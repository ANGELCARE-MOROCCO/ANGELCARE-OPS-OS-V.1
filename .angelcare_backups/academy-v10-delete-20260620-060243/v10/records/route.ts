import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function cleanNumber(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}
function normalize(row: any) {
  return {
    module_key: row.module_key || row.module || "academy",
    page_key: row.page_key || row.page || null,
    record_type: row.record_type || row.module_key || "academy_command",
    title: row.title || row.name || "Academy command record",
    description: row.description || row.note || null,
    owner_name: row.owner_name || row.owner || null,
    department: row.department || "Academy",
    status: row.status || "open",
    priority: row.priority || "medium",
    risk_level: row.risk_level || row.risk || "low",
    value_mad: cleanNumber(row.value_mad || row.value),
    due_at: row.due_at || row.due || null,
    next_action: row.next_action || row.next || null,
    stage: row.stage || row.status || null,
    score: row.score === undefined ? null : cleanNumber(row.score),
    source_entity: row.source_entity || null,
    source_entity_id: row.source_entity_id || null,
    metadata: { ...(row.metadata || {}), raw_payload: row },
    updated_at: new Date().toISOString(),
  }
}
async function audit(supabase: any, payload: any) {
  await supabase.from("academy_action_logs").insert({
    module_key: payload.module_key || "academy",
    page_key: payload.page_key || null,
    action_key: payload.action_key || "record_action",
    selected_count: payload.selected_count || 1,
    payload,
    status: payload.status || "logged",
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const module = req.nextUrl.searchParams.get("module")
  const page = req.nextUrl.searchParams.get("page")
  const status = req.nextUrl.searchParams.get("status")
  const q = req.nextUrl.searchParams.get("q")
  let query = supabase.from("academy_command_records").select("*").order("updated_at", { ascending: false }).limit(250)
  if (module) query = query.eq("module_key", module)
  if (page) query = query.eq("page_key", page)
  if (status && status !== "all") query = query.eq("status", status)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,owner_name.ilike.%${q}%`)
  const { data, error } = await query
  return NextResponse.json({ ok: !error, records: data || [], page, error: error?.message || null })
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const row = normalize(payload)
  const { data, error } = await supabase.from("academy_command_records").insert(row).select("*").single()
  await audit(supabase, { ...row, action_key: "create_record", selected_count: 1, status: error ? "failed" : "logged", error: error?.message || null })
  return NextResponse.json({ ok: !error, record: data || null, error: error?.message || null }, { status: error ? 500 : 200 })
}

export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const id = payload.id
  if (!id) return NextResponse.json({ ok: false, error: "Missing record id" }, { status: 400 })
  const supabase = await createClient()
  const updates = normalize(payload)
  const { data, error } = await supabase.from("academy_command_records").update(updates).eq("id", id).select("*").single()
  await audit(supabase, { id, ...updates, action_key: payload.action_key || "update_record", selected_count: 1, status: error ? "failed" : "logged", error: error?.message || null })
  return NextResponse.json({ ok: !error, record: data || null, error: error?.message || null }, { status: error ? 500 : 200 })
}

export async function DELETE(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const id = payload.id
  if (!id) return NextResponse.json({ ok: false, error: "Missing record id" }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from("academy_command_records").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id)
  await audit(supabase, { id, module_key: payload.module_key || "academy", page_key: payload.page_key, action_key: "archive_record", selected_count: 1, status: error ? "failed" : "logged", error: error?.message || null })
  return NextResponse.json({ ok: !error, error: error?.message || null }, { status: error ? 500 : 200 })
}
