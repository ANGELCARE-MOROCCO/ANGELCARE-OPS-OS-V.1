import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMissingSupabaseServerEnv, isSupabaseServerConfigured } from "@/lib/supabase/env"

type SnapshotInput = {
  key: string
  value: string
  source?: string
  origin?: string
}

type SnapshotRow = {
  storage_key: string
  payload_text: string
  payload_size: number
  checksum: string
  updated_at: string
  source: string
  last_origin: string | null
}

const MANAGED_PREFIXES = [
  "revenue_",
  "market_",
  "ambassador_",
  "seo_",
  "content_",
  "csv_",
  "task_",
  "tasks_",
  "staff_",
  "angelcare_",
]

const BLOCKED_FRAGMENTS = [
  "supabase.auth",
  "sb-",
  "auth-token",
  "access_token",
  "refresh_token",
  "password",
  "secret",
]

function workspaceId() {
  return process.env.NEXT_PUBLIC_ANGELCARE_WORKSPACE_ID || "angelcare-main"
}

function isManagedKey(key: string) {
  const lower = key.toLowerCase()
  if (BLOCKED_FRAGMENTS.some((fragment) => lower.includes(fragment))) return false
  return MANAGED_PREFIXES.some((prefix) => lower.startsWith(prefix) || lower.includes(prefix))
}

function tryJson(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object") return parsed
    return null
  } catch {
    return null
  }
}

async function checksum(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      reason: "supabase_env_missing",
      missing: getMissingSupabaseServerEnv(),
      workspaceId: workspaceId(),
      snapshots: [],
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("app_local_storage_snapshots")
    .select("storage_key,payload_text,payload_size,checksum,updated_at,source,last_origin")
    .eq("workspace_id", workspaceId())
    .eq("archived", false)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    workspaceId: workspaceId(),
    snapshots: ((data || []) as SnapshotRow[]).map((row) => ({
      key: row.storage_key,
      value: row.payload_text,
      size: row.payload_size,
      checksum: row.checksum,
      updatedAt: row.updated_at,
      source: row.source,
      origin: row.last_origin,
    })),
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const snapshots = Array.isArray(body.snapshots) ? (body.snapshots as SnapshotInput[]) : []
  const userAgent = request.headers.get("user-agent") || "unknown"
  const cleaned = snapshots
    .filter((item) => item && typeof item.key === "string" && typeof item.value === "string")
    .filter((item) => isManagedKey(item.key))
    .slice(0, 500)

  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      reason: "supabase_env_missing",
      missing: getMissingSupabaseServerEnv(),
      workspaceId: workspaceId(),
      received: cleaned.length,
      snapshots: [],
    })
  }

  const supabase = await createClient()

  const rows = await Promise.all(cleaned.map(async (item) => ({
    workspace_id: workspaceId(),
    storage_key: item.key,
    payload_text: item.value,
    payload_json: tryJson(item.value),
    payload_size: item.value.length,
    checksum: await checksum(item.value),
    source: item.source || "browser-sync",
    last_user_agent: userAgent,
    last_origin: item.origin || null,
    archived: false,
  })))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("app_local_storage_snapshots")
      .upsert(rows, { onConflict: "workspace_id,storage_key" })

    if (upsertError) {
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from("app_local_storage_snapshots")
    .select("storage_key,payload_text,payload_size,checksum,updated_at,source,last_origin")
    .eq("workspace_id", workspaceId())
    .eq("archived", false)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    workspaceId: workspaceId(),
    received: cleaned.length,
    snapshots: ((data || []) as SnapshotRow[]).map((row) => ({
      key: row.storage_key,
      value: row.payload_text,
      size: row.payload_size,
      checksum: row.checksum,
      updatedAt: row.updated_at,
      source: row.source,
      origin: row.last_origin,
    })),
  })
}
