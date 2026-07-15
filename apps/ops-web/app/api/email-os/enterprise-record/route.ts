import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

function tableFor(kind: string) {
  if (["task", "meeting", "call", "crm", "note", "label", "folder"].includes(kind)) return "email_os_core_ai_copilot_actions"
  return "email_os_core_audit"
}

async function insertCopilot(db: any, kind: string, payload: any, targetId: string | null) {
  const now = nowIso()
  const row = {
    id: makeEmailOSId(),
    action_type: kind,
    target_type: "email",
    target_id: targetId,
    proposed_by: "enterprise-email-os",
    approval_status: "executed",
    payload,
    created_at: now,
    executed_at: now
  }

  const { data, error } = await db.from("email_os_core_ai_copilot_actions").insert(row).select("*").single()
  if (!error && data) return data

  const audit = {
    id: row.id,
    action: `enterprise.${kind}`,
    target_type: "email_os_enterprise_record",
    target_id: targetId || "manual",
    severity: kind === "escalation" ? "warning" : "info",
    details: payload,
    created_at: now
  }
  const fallback = await db.from("email_os_core_audit").insert(audit).select("*").single()
  if (fallback.error) throw fallback.error
  return fallback.data
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const kind = clean(body.kind || body.actionType || body.action)
    const payload = body.payload || body
    const targetId = clean(body.emailId || body.targetId || payload.emailId || payload.targetId) || null

    if (!kind) return NextResponse.json({ ok: false, error: "kind is required" }, { status: 400 })

    const db = createEmailOSCoreDb()
    const data = tableFor(kind) === "email_os_core_ai_copilot_actions"
      ? await insertCopilot(db, kind, payload, targetId)
      : await insertCopilot(db, kind, payload, targetId)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Enterprise record failed" }, { status: 500 })
  }
}
