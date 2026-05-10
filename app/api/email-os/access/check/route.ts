import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function actionToColumn(action: string) {
  if (action === "read") return "can_read"
  if (action === "compose") return "can_compose"
  if (action === "send") return "can_send"
  if (action === "manage") return "can_manage"
  return "can_read"
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = body.mailboxId
    const principalId = body.principalId || "operations"
    const principalType = body.principalType || "role"
    const action = body.action || "read"

    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: "mailboxId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const column = actionToColumn(action)

    const { data, error } = await db
      .from("email_os_core_mailbox_permissions")
      .select("*")
      .eq("mailbox_id", mailboxId)
      .eq("principal_type", principalType)
      .eq("principal_id", principalId)
      .limit(1)

    if (error) throw error

    const rule = data?.[0]
    const allowed = Boolean(rule?.[column] ?? false)
    const decision = allowed ? "allowed" : "denied"

    try {
  await db.from("email_os_core_access_audit").insert({
    id: makeEmailOSId(),
    actor: body.actor || body.userId || "system",
    resource: body.resource || body.scope || "email-os",
    action: body.action || "access.check",
    decision: allowed ? "allowed" : "denied",
    reason: rule ? `matched permission ${rule.id}` : "no matching permission",
    created_at: nowIso()
  })
} catch {
  // audit write is non-blocking
}

    return NextResponse.json({
      ok: true,
      data: {
        allowed,
        decision,
        rule: rule || null
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Access check failed" }, { status: 500 })
  }
}
