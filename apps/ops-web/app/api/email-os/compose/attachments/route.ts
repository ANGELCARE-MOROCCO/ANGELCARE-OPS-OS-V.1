import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { operationalActionBlockedResponse, buildOperationalIdempotencyKey, estimateStorageGbFromBytes, runOperationalWiredAction } from "@/lib/shared/operational-action-wiring"
import { attachmentErrorResponse, loadComposeAttachments, persistComposeAttachments, validateComposeAttachments } from "@/lib/email-os-core/compose-attachments"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const mailboxScope = await resolveMailboxScopeForUser(user.id, clean(url.searchParams.get("mailboxId")) || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_read",
      request,
    })

    const draftId = clean(url.searchParams.get("draftId")) || null
    const outboxId = clean(url.searchParams.get("outboxId")) || null
    if (!draftId && !outboxId) {
      return NextResponse.json({ ok: false, error: "draftId or outboxId is required" }, { status: 400 })
    }

    const data = await loadComposeAttachments({
      db: createEmailOSCoreDb(),
      mailboxId: mailboxScope.mailboxId,
      draftId,
      outboxId,
    })

    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    const attachment = attachmentErrorResponse(error)
    return NextResponse.json(
      { ok: false, error: attachment?.message || (error instanceof Error ? error.message : "Attachment hydration failed"), ...(attachment ? { code: attachment.code } : {}) },
      { status: attachment?.status || 500 }
    )
  }
}

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

    const attachments = await validateComposeAttachments({ db, mailboxId: mailboxScope.mailboxId, attachments: body.attachments })
    const totalBytes = attachments.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0)
    const quantity = estimateStorageGbFromBytes(totalBytes)

    const guarded = await runOperationalWiredAction('email_os.compose_attachments', async () => {
      const rows = await persistComposeAttachments({
        db,
        mailboxId: mailboxScope.mailboxId,
        draftId: clean(body.draftId) || null,
        outboxId: clean(body.outboxId) || null,
        attachments,
        metadata: { ...(body.metadata || {}), ac360Guarded: true },
      })
      return { inserted: rows.length, attachments: rows }
    }, {
      orgId: body.orgId || body.org_id,
      quantity,
      idempotencyKey: body.idempotencyKey || body.idempotency_key || buildOperationalIdempotencyKey('email.attachments', `${body.draftId || body.outboxId || 'compose'}:${attachments.length}:${totalBytes}`),
      metadata: { attachmentCount: attachments.length, totalBytes, quantityGb: quantity, source: 'api.email-os.compose.attachments.POST' },
    })

    if (!guarded.ok) return operationalActionBlockedResponse(guarded)

    return NextResponse.json({ ok: true, data: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
  } catch (error) {
    const attachment = attachmentErrorResponse(error)
    return NextResponse.json(
      { ok: false, error: attachment?.message || (error instanceof Error ? error.message : "Attachment registration failed"), ...(attachment ? { code: attachment.code } : {}) },
      { status: attachment?.status || 500 }
    )
  }
}
