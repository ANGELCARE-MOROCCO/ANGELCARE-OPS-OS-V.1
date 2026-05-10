import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

function smtpReady() {
  return Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_SMTP_USER && process.env.EMAIL_OS_SMTP_PASSWORD)
}

export async function POST(request: Request) {
  try {
    if (!smtpReady()) {
      return NextResponse.json({ ok: false, error: "SMTP env not configured" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const limit = Number(body.limit || 10)
    const db = createEmailOSCoreDb()

    const { data: jobs, error } = await db
      .from("email_os_core_queue")
      .select("*")
      .in("status", ["queued", "failed"])
      .order("scheduled_at", { ascending: true })
      .limit(limit)

    if (error) throw error

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_OS_SMTP_HOST,
      port: Number(process.env.EMAIL_OS_SMTP_PORT || 587),
      secure: Number(process.env.EMAIL_OS_SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.EMAIL_OS_SMTP_USER,
        pass: process.env.EMAIL_OS_SMTP_PASSWORD
      }
    })

    const results = []

    for (const job of jobs || []) {
      try {
        const payload = job.payload || {}
        const sent = await transporter.sendMail({
          from: process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER,
          to: payload.toEmail,
          subject: payload.subject,
          text: payload.body
        })

        await db
          .from("email_os_core_queue")
          .update({ status: "sent", attempts: Number(job.attempts || 0) + 1, last_error: null, updated_at: nowIso() })
          .eq("id", job.id)

        results.push({ id: job.id, ok: true, messageId: sent.messageId })
      } catch (sendError) {
        const message = sendError instanceof Error ? sendError.message : "Send failed"
        await db
          .from("email_os_core_queue")
          .update({ status: "failed", attempts: Number(job.attempts || 0) + 1, last_error: message, updated_at: nowIso() })
          .eq("id", job.id)

        results.push({ id: job.id, ok: false, error: message })
      }
    }

    await audit("queue.retry", { targetType: "queue", count: results.length })
    return NextResponse.json({ ok: true, data: results })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Queue retry failed" }, { status: 500 })
  }
}
