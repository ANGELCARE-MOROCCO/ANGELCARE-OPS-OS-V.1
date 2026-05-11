import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"
import { writeProviderLog } from "@/lib/email-os-core/provider-log"

function smtpReady() {
  return Boolean(
    process.env.EMAIL_OS_SMTP_HOST &&
    process.env.EMAIL_OS_SMTP_USER &&
    process.env.EMAIL_OS_SMTP_PASSWORD
  )
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_OS_SMTP_HOST,
    port: Number(process.env.EMAIL_OS_SMTP_PORT || 587),
    secure: Number(process.env.EMAIL_OS_SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL_OS_SMTP_USER,
      pass: process.env.EMAIL_OS_SMTP_PASSWORD
    }
  })
}

export async function POST() {
  try {
    if (!smtpReady()) {
      return NextResponse.json(
        {
          ok: false,
          error: "SMTP is not configured"
        },
        { status: 500 }
      )
    }

    const db = createEmailOSCoreDb()

    const { data: jobs, error } = await db
      .from("email_os_core_queue")
      .select("*")
      .eq("type", "send")
      .eq("status", "queued")
      .order("scheduled_at", { ascending: true })
      .limit(25)

    if (error) throw error

    const transporter = createTransporter()
    const results: Array<Record<string, unknown>> = []

    for (const job of jobs || []) {
      const outboxId = job.outbox_id || job.payload?.outboxId || null

      try {
        await db
          .from("email_os_core_queue")
          .update({
            status: "sending",
            updated_at: nowIso()
          })
          .eq("id", job.id)

        if (outboxId) {
          await db
            .from("email_os_core_outbox")
            .update({
              status: "sending",
              updated_at: nowIso()
            })
            .eq("id", outboxId)
        }

        const payload = job.payload || {}

        const sent = await transporter.sendMail({
          from: payload.fromEmail || process.env.EMAIL_OS_SMTP_FROM || process.env.EMAIL_OS_SMTP_USER,
          to: payload.toEmail,
          cc: payload.ccEmail || undefined,
          bcc: payload.bccEmail || undefined,
          subject: payload.subject || "Untitled",
          text: payload.body || ""
        })

        await db
          .from("email_os_core_queue")
          .update({
            status: "completed",
            attempts: Number(job.attempts || 0) + 1,
            last_error: null,
            result: {
              messageId: sent.messageId
            },
            updated_at: nowIso()
          })
          .eq("id", job.id)

        if (outboxId) {
          await db
            .from("email_os_core_outbox")
            .update({
              status: "sent",
              provider_message_id: sent.messageId,
              last_error: null,
              sent_at: nowIso(),
              updated_at: nowIso()
            })
            .eq("id", outboxId)
        }

        results.push({
          id: job.id,
          outboxId,
          ok: true,
          messageId: sent.messageId
        })
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : "SMTP dispatch failed"
        const attempts = Number(job.attempts || 0) + 1
        const finalStatus = attempts >= 3 ? "failed" : "queued"

        await db
          .from("email_os_core_queue")
          .update({
            status: finalStatus,
            attempts,
            last_error: message,
            updated_at: nowIso()
          })
          .eq("id", job.id)

        if (outboxId) {
          await db
            .from("email_os_core_outbox")
            .update({
              status: finalStatus === "failed" ? "failed" : "queued",
              last_error: message,
              updated_at: nowIso()
            })
            .eq("id", outboxId)
        }

        results.push({
          id: job.id,
          outboxId,
          ok: false,
          error: message
        })
      }
    }

    await writeProviderLog({
      provider: "smtp",
      status: "queue-worker.completed",
      metadata: {
        processed: results.length
      }
    })

    return NextResponse.json({
      ok: true,
      data: results
    })
  } catch (error) {
    await writeProviderLog({
      provider: "smtp",
      status: "queue-worker.failed",
      message: error instanceof Error ? error.message : "Queue worker failed"
    })

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Queue worker failed"
      },
      { status: 500 }
    )
  }
}
