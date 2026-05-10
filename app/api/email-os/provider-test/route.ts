import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    smtpConfigured: Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_SMTP_USER && process.env.EMAIL_OS_SMTP_PASSWORD),
    imapConfigured: Boolean(process.env.EMAIL_OS_IMAP_HOST && process.env.EMAIL_OS_IMAP_USER && process.env.EMAIL_OS_IMAP_PASSWORD)
  }

  return NextResponse.json({
    ok: checks.supabaseUrl && checks.supabaseKey,
    data: checks
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const mode = body.mode || "all"
  const results: Record<string, unknown> = {}

  if ((mode === "all" || mode === "smtp") && process.env.EMAIL_OS_SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_OS_SMTP_HOST,
        port: Number(process.env.EMAIL_OS_SMTP_PORT || 587),
        secure: Number(process.env.EMAIL_OS_SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.EMAIL_OS_SMTP_USER,
          pass: process.env.EMAIL_OS_SMTP_PASSWORD
        }
      })

      await transporter.verify()
      results.smtp = { ok: true }
    } catch (error) {
      results.smtp = { ok: false, error: error instanceof Error ? error.message : "SMTP test failed" }
    }
  }

  if ((mode === "all" || mode === "imap") && process.env.EMAIL_OS_IMAP_HOST) {
    const client = new ImapFlow({
      host: process.env.EMAIL_OS_IMAP_HOST,
      port: Number(process.env.EMAIL_OS_IMAP_PORT || 993),
      secure: String(process.env.EMAIL_OS_IMAP_SECURE || "true") !== "false",
      auth: {
        user: String(process.env.EMAIL_OS_IMAP_USER || ""),
        pass: String(process.env.EMAIL_OS_IMAP_PASSWORD || "")
      }
    })

    try {
      await client.connect()
      await client.logout()
      results.imap = { ok: true }
    } catch (error) {
      results.imap = { ok: false, error: error instanceof Error ? error.message : "IMAP test failed" }
    }
  }

  return NextResponse.json({ ok: true, data: results })
}
