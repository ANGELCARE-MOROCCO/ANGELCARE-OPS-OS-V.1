import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const actionType = body.actionType || body.kind
    const payload = body.payload || {}
    const emailId = body.emailId || payload.emailId || null

    if (!actionType) {
      return NextResponse.json({ ok: false, error: "actionType is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const auditRow = {
      id: makeEmailOSId(),
      action: `assistant.${actionType}`,
      target_type: "email_os_assistant_action",
      target_id: emailId || payload.targetId || "manual",
      severity: actionType === "escalation" ? "warning" : "info",
      details: { ...payload, actionType, source: "EmailOSWorkspacePro" },
      created_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_audit").insert(auditRow).select("*").single()
    if (error) throw error

    await db.from("email_os_core_ai_copilot_actions").insert({
      id: makeEmailOSId(),
      action_type: actionType,
      target_type: "email",
      target_id: emailId,
      proposed_by: "email-os-assistant",
      approval_status: "executed",
      payload: { ...payload, auditId: data?.id },
      created_at: nowIso(),
      executed_at: nowIso()
    }).then(() => null, () => null)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Assistant action failed" }, { status: 500 })
  }
}
