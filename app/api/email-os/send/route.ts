import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function normalizeEmail(value: unknown) {
  return String(value || "").trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const mailboxId = normalizeEmail(body.mailboxId)
    const toEmail = normalizeEmail(body.toEmail)
    const subject = String(body.subject || "").trim()
    const messageBody = String(body.body || "").trim()

    if (!mailboxId) {
      return NextResponse.json({ ok: false, error: "Mailbox required" }, { status: 400 })
    }

    if (!toEmail || !subject || !messageBody) {
      return NextResponse.json({ ok: false, error: "toEmail, subject and body are required" }, { status: 400 })
    }

    let fromEmail = normalizeEmail(body.fromEmail)

    if (!fromEmail) {
      const { data: mailbox } = await db
        .from("email_os_core_mailboxes")
        .select("*")
        .eq("id", mailboxId)
        .maybeSingle()

      fromEmail =
        mailbox?.email_address ||
        mailbox?.address ||
        process.env.EMAIL_OS_SMTP_FROM ||
        process.env.EMAIL_OS_SMTP_USER ||
        ""
    }

    const outboxId = makeEmailOSId()
    const queueId = makeEmailOSId()

    const outboxRecord = {
      id: outboxId,
      queue_id: queueId,
      mailbox_id: mailboxId,
      from_email: fromEmail,
      to_email: toEmail,
      cc_email: body.ccEmail || null,
      bcc_email: body.bccEmail || null,
      subject,
      body: messageBody,
      status: "queued",
      priority: body.priority || "normal",
      template_key: body.templateKey || null,
      diagnostics: body.diagnostics || {},
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const queueRecord = {
      id: queueId,
      type: "send",
      status: "queued",
      mailbox_id: mailboxId,
      outbox_id: outboxId,
      payload: {
        mailboxId,
        outboxId,
        fromEmail,
        toEmail,
        ccEmail: body.ccEmail || null,
        bccEmail: body.bccEmail || null,
        subject,
        body: messageBody
      },
      attempts: 0,
      last_error: null,
      result: {},
      scheduled_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { error: outboxError } = await db.from("email_os_core_outbox").insert(outboxRecord)
    if (outboxError) throw outboxError

    const { error: queueError } = await db.from("email_os_core_queue").insert(queueRecord)
    if (queueError) {
      await db
        .from("email_os_core_outbox")
        .update({
          status: "failed",
          last_error: queueError.message,
          updated_at: nowIso()
        })
        .eq("id", outboxId)

      throw queueError
    }

    return NextResponse.json({
      ok: true,
      data: {
        queued: true,
        outboxInserted: true,
        queueId,
        outboxId
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Send failed"
      },
      { status: 500 }
    )
  }
}
