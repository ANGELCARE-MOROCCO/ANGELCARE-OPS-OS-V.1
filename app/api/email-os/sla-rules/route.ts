import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_sla_rules").select("*").order("updated_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load SLA rules" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: body.id || makeEmailOSId(),
      name: body.name || "SLA Rule",
      priority: body.priority || "normal",
      response_minutes: Number(body.responseMinutes || 240),
      escalation_minutes: Number(body.escalationMinutes || 480),
      enabled: body.enabled !== false,
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_sla_rules").insert(row).select("*").single()
    if (error) throw error

    await audit("sla_rule.created", { targetType: "sla_rule", targetId: row.id })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create SLA rule" }, { status: 500 })
  }
}
