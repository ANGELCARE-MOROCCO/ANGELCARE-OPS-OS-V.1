import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST() {
  const db = createEmailOSCoreDb()

  try {
    const { data: queueRows, error } = await db
      .from("email_os_core_queue")
      .select("*")
      .in("status", ["queued", "pending", "retry"])
      .order("created_at", { ascending: true })
      .limit(3)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const rows = queueRows || []
    const results: any[] = []

    for (const row of rows) {
      try {
        const outboxId = row.outbox_id || row.outboxId || row.payload?.outboxId
        let outbox: any = null

        if (outboxId) {
          const { data } = await db
            .from("email_os_core_outbox")
            .select("*")
            .eq("id", outboxId)
            .maybeSingle()

          outbox = data
        }

        const payload = {
          ...(row.payload || {}),
          ...(outbox || {})
        }

        const mailboxId = clean(payload.mailbox_id || payload.mailboxId)
        const fromEmail = clean(payload.from_email || payload.fromEmail)
        const toEmail = clean(payload.to_email || payload.toEmail)
        const ccEmail = clean(payload.cc_email || payload.ccEmail)
        const bccEmail = clean(payload.bcc_email || payload.bccEmail)
        const subject = clean(payload.subject) || "(Sans objet)"
        const body = clean(payload.body || payload.message)

        const { identity, info } = await sendEmailOSDirect({
          mailboxId,
          fromEmail,
          toEmail,
          ccEmail,
          bccEmail,
          subject,
          body
        })

        const sentAt = nowIso()

        await db
          .from("email_os_core_queue")
          .update({
            status: "sent",
            updated_at: sentAt,
            last_error: null,
            diagnostics: {
              ...(row.diagnostics || {}),
              transport: "central-send-mail",
              resolvedMailboxKey: identity.key,
              resolvedMailboxId: identity.mailboxId,
              messageId: info.messageId || null
            }
          })
          .eq("id", row.id)
          .then(() => null, () => null)

        if (outboxId) {
          await db
            .from("email_os_core_outbox")
            .update({
              status: "sent",
              provider_message_id: info.messageId || null,
              sent_at: sentAt,
              updated_at: sentAt,
              mailbox_id: identity.mailboxId,
              from_email: identity.smtp.from,
              last_error: null,
              diagnostics: {
                ...(outbox?.diagnostics || {}),
                transport: "central-send-mail",
                resolvedMailboxKey: identity.key,
                resolvedMailboxId: identity.mailboxId,
                smtpUser: identity.smtp.user
              }
            })
            .eq("id", outboxId)
            .then(() => null, () => null)
        }

        results.push({
          id: row.id,
          outboxId,
          ok: true,
          messageId: info.messageId || null,
          mailboxKey: identity.key,
          from: identity.smtp.from
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Queue send failed"

        await db
          .from("email_os_core_queue")
          .update({
            status: "failed",
            updated_at: nowIso(),
            last_error: message
          })
          .eq("id", row.id)
          .then(() => null, () => null)

        results.push({
          id: row.id,
          outboxId: row.outbox_id || row.outboxId || row.payload?.outboxId || null,
          ok: false,
          error: message
        })
      }
    }

    return NextResponse.json({ ok: true, data: results })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Queue worker failed" },
      { status: 500 }
    )
  }
}
