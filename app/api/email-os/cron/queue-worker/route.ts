import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"

async function writeProviderLog(input: {
  provider: string
  status: string
  message?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_provider_logs").insert({
      provider: input.provider,
      status: input.status,
      message: input.message || null,
      metadata: input.metadata || {},
      created_at: nowIso()
    })
  } catch {
    // provider log is non-blocking
  }
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
    const smtpReady = Boolean(
      process.env.EMAIL_OS_SMTP_HOST &&
      process.env.EMAIL_OS_SMTP_USER &&
      process.env.EMAIL_OS_SMTP_PASSWORD
    )

    if (!smtpReady) {
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
      .eq("status", "queued")
      .eq("type", "send")
      .order("scheduled_at", { ascending: true })
      .limit(25)

    if (error) throw error

    const transporter = createTransporter()
    const results: Array<Record<string, unknown>> = []

    for (const job of jobs || []) {
      try {
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
            last_error: null,
            result: {
              messageId: sent.messageId
            },
            updated_at: nowIso()
          })
          .eq("id", job.id)

        results.push({
          id: job.id,
          ok: true,
          messageId: sent.messageId
        })
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : "Send job failed"
        const attempts = Number(job.attempts || 0) + 1

        await db
          .from("email_os_core_queue")
          .update({
            status: attempts >= 3 ? "failed" : "queued",
            attempts,
            last_error: message,
            updated_at: nowIso()
          })
          .eq("id", job.id)

        results.push({
          id: job.id,
          ok: false,
          error: message
        })
      }
    }

    await writeProviderLog({
      provider: "smtp",
      status: "queue-worker.completed",
      metadata: {
        count: results.length
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
