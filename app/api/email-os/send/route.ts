import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.toEmail || !body.subject || !body.body) {
      return NextResponse.json({ ok: false, error: "Missing toEmail, subject or body" }, { status: 400 })
    }

    const smtpReady = Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_SMTP_USER && process.env.EMAIL_OS_SMTP_PASSWORD)

    if (!smtpReady) {
      const db = createEmailOSCoreDb()
      const job = {
        id: makeEmailOSId(),
        type: "send",
        status: "queued",
        payload: body,
        attempts: 0,
        last_error: "SMTP not configured; queued safely",
        scheduled_at: nowIso(),
        created_at: nowIso(),
        updated_at: nowIso()
      }
      const { error } = await db.from("email_os_core_queue").insert(job)
      if (error) throw error
      await audit("compose.queued", { targetType: "queue", targetId: job.id })
      return NextResponse.json({ ok: true, mode: "queued", data: job })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_OS_SMTP_HOST,
      port: Number(process.env.EMAIL_OS_SMTP_PORT || 587),
      secure: Number(process.env.EMAIL_OS_SMTP_PORT || 587) === 465,
      auth: { user: process.env.EMAIL_OS_SMTP_USER, pass: process.env.EMAIL_OS_SMTP_PASSWORD }
    })

    const sent = await transporter.sendMail({
      from: process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER,
      to: body.toEmail,
      subject: body.subject,
      text: body.body
    })

    await audit("compose.sent", { targetType: "message", targetId: sent.messageId })
    return NextResponse.json({ ok: true, mode: "sent", data: { messageId: sent.messageId } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Send failed" }, { status: 500 })
  }
}
