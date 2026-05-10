import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function smtpConfig() {
  return {
    host: process.env.EMAIL_OS_SMTP_HOST,
    port: Number(process.env.EMAIL_OS_SMTP_PORT || 587),
    secure: String(process.env.EMAIL_OS_SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.EMAIL_OS_SMTP_USER,
      pass: process.env.EMAIL_OS_SMTP_PASSWORD
    }
  }
}

export async function POST(request: Request) {
  const db = createEmailOSCoreDb()

  try {
    const body = await request.json().catch(() => ({}))

    if (!body.toEmail || !body.subject || !body.body) {
      return NextResponse.json(
        { ok: false, error: "toEmail, subject and body are required" },
        { status: 400 }
      )
    }

    const fromEmail = body.fromEmail || process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER

    const row = {
      id: makeEmailOSId(),
      mailbox_id: body.mailboxId || null,
      from_email: fromEmail,
      to_email: body.toEmail,
      cc_email: body.ccEmail || null,
      bcc_email: body.bccEmail || null,
      subject: body.subject,
      body: body.body,
      status: "queued",
      send_attempts: 0,
      last_error: null,
      provider_message_id: null,
      metadata: body.metadata || {},
      created_at: nowIso(),
      sent_at: null
    }

    const { data: queued, error: queueError } = await db
      .from("email_os_core_outbound_messages")
      .insert(row)
      .select("*")
      .single()

    if (queueError) throw queueError

    try {
      const transporter = nodemailer.createTransport(smtpConfig())

      const result = await transporter.sendMail({
        from: fromEmail,
        to: body.toEmail,
        cc: body.ccEmail || undefined,
        bcc: body.bccEmail || undefined,
        subject: body.subject,
        text: body.body
      })

      const { data: sent, error: updateError } = await db
        .from("email_os_core_outbound_messages")
        .update({
          status: "sent",
          send_attempts: 1,
          provider_message_id: result.messageId || null,
          sent_at: nowIso()
        })
        .eq("id", queued.id)
        .select("*")
        .single()

      if (updateError) throw updateError

      return NextResponse.json({ ok: true, data: sent })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "SMTP send failed"

      await db
        .from("email_os_core_outbound_messages")
        .update({
          status: "failed",
          send_attempts: 1,
          last_error: message
        })
        .eq("id", queued.id)

      return NextResponse.json(
        { ok: false, error: message, data: queued },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    )
  }
}
