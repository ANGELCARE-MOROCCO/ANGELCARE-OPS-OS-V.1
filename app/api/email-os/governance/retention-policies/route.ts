import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_retention_policies")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load policies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      entity: body.entity || "threads",
      policy_name: body.policyName || body.policy_name || "Default retention policy",
      retention_days: Number(body.retentionDays || body.retention_days || 365),
      enabled: body.enabled !== false,
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_core_retention_policies")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create policy" }, { status: 500 })
  }
}
