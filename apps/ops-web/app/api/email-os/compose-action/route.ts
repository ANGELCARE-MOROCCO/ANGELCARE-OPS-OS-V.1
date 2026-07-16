import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action || "compose_action"
    const payload = body.payload || {}
    const mailboxScope = await resolveMailboxScopeForUser(user.id, payload.mailboxId || payload.mailbox_id || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const db = createEmailOSCoreDb()

    const { data, error } = await db.from("email_os_core_audit").insert({
      id: makeEmailOSId(),
      action,
      target_type: "email_compose",
      target_id: payload.messageId || mailboxScope.mailboxId || "compose",
      severity: "info",
      details: { ...payload, mailboxId: mailboxScope.mailboxId, actorUserId: user.id },
      created_at: nowIso()
    }).select("*").single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Compose action failed" },
      { status: 500 }
    )
  }
}
