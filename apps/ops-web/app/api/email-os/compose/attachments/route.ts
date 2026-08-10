import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId } from "@/lib/email-os-core/schema"
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, estimateStorageGbFromBytes, runAc360WiredAction } from "@/lib/ac360/action-wiring"

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const mailboxScope = await resolveMailboxScopeForUser(user.id, body.mailboxId || body.mailbox_id || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    const totalBytes = attachments.reduce((sum: number, item: any) => sum + Number(item?.size || item?.size_bytes || 0), 0)
    const quantity = estimateStorageGbFromBytes(totalBytes)

    const guarded = await runAc360WiredAction('email_os.compose_attachments', async () => {
      const rows = attachments.map((item: any) => ({
        id: makeEmailOSId(),
        draft_id: body.draftId || null,
        outbox_id: body.outboxId || null,
        mailbox_id: mailboxScope.mailboxId,
        filename: item.filename || item.name || "attachment",
        size_bytes: Number(item.size || item.size_bytes || 0),
        mime_type: item.mimeType || item.type || null,
        status: "attached",
        metadata: { ...(item.metadata || {}), ac360Guarded: true }
      }))

      if (rows.length > 0) {
        const { error } = await db.from("email_os_core_compose_attachments").insert(rows)
        if (error) throw error
      }

      return { inserted: rows.length, attachments: rows }
    }, {
      orgId: body.orgId || body.org_id,
      quantity,
      idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('email.attachments', `${body.draftId || body.outboxId || 'compose'}:${attachments.length}:${totalBytes}`),
      metadata: { attachmentCount: attachments.length, totalBytes, quantityGb: quantity, source: 'api.email-os.compose.attachments.POST' },
    })

    if (!guarded.ok) return ac360GuardBlockedResponse(guarded)

    return NextResponse.json({ ok: true, data: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Attachment registration failed"
      },
      { status: 500 }
    )
  }
}
