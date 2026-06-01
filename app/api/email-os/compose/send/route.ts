import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  const db = createEmailOSCoreDb()
  let outboxId = ""

  try {
    const body = await request.json().catch(() => ({}))
    const mailboxId = clean(body.mailboxId || body.mailbox_id)
    const fromEmail = clean(body.fromEmail || body.from_email)
    const toEmail = clean(body.toEmail || body.to_email || body.to)
    const ccEmail = clean(body.ccEmail || body.cc_email || body.cc)
    const bccEmail = clean(body.bccEmail || body.bcc_email || body.bcc)
    const subject = clean(body.subject) || "(Sans objet)"
    const message = clean(body.body || body.message || body.text || body.html)

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient is required" }, { status: 400 })
    }

    const now = nowIso()
    outboxId = makeEmailOSId()

    await db.from("email_os_core_outbox").insert({
      id: outboxId,
      mailbox_id: mailboxId || null,
      from_email: fromEmail || null,
      to_email: toEmail,
      cc_email: ccEmail || null,
      bcc_email: bccEmail || null,
      subject,
      body: message,
      status: "sending",
      priority: body.priority || "normal",
      provider_message_id: null,
      queue_id: null,
      diagnostics: { route: "compose/send", transport: "central-send-mail" },
      created_at: now,
      updated_at: now,
      sent_at: null,
      last_error: null
    }).then(() => null, () => null)

    const { identity, info } = await sendEmailOSDirect({
      mailboxId,
      fromEmail,
      toEmail,
      ccEmail,
      bccEmail,
      subject,
      body: message
    })

    const sentAt = nowIso()

    await db.from("email_os_core_outbox").update({
      mailbox_id: identity.mailboxId,
      from_email: identity.smtp.from,
      status: "sent",
      provider_message_id: info.messageId || null,
      sent_at: sentAt,
      updated_at: sentAt,
      last_error: null,
      diagnostics: {
        route: "compose/send",
        transport: "central-send-mail",
        resolvedMailboxKey: identity.key,
        resolvedMailboxId: identity.mailboxId,
        smtpUser: identity.smtp.user,
        accepted: info.accepted || [],
        rejected: info.rejected || []
      }
    }).eq("id", outboxId).then(() => null, () => null)

    return NextResponse.json({
      ok: true,
      data: {
        sent: true,
        outboxId,
        messageId: info.messageId || null,
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        from: identity.smtp.from
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compose send failed"

    if (outboxId) {
      await db.from("email_os_core_outbox").update({
        status: "failed",
        updated_at: nowIso(),
        last_error: message
      }).eq("id", outboxId).then(() => null, () => null)
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
