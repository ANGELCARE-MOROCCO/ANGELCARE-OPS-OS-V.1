import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_executive_command_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load executive actions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      action_type: body.actionType || "manual_intervention",
      target_type: body.targetType || "thread",
      target_id: body.targetId || null,
      command_status: "queued",
      requested_by: body.requestedBy || "operations",
      approved_by: body.approvedBy || null,
      payload: body.payload || {},
      result: {},
      created_at: nowIso(),
      executed_at: null
    }

    const { data, error } = await db
      .from("email_os_core_executive_command_actions")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    await audit("executive.action_created", {
      targetType: row.target_type,
      targetId: row.target_id,
      actionType: row.action_type
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create executive action" }, { status: 500 })
  }
}
