import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function verifyMailbox(mailbox: any) {
  const started = Date.now()

  try {
    const transporter = nodemailer.createTransport({
      host: mailbox.smtp.host,
      port: mailbox.smtp.port,
      secure: mailbox.smtp.secure,
      auth: {
        user: mailbox.smtp.user,
        pass: mailbox.smtp.pass
      },
      pool: false,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 45000
    } as any)

    await transporter.verify()
    transporter.close()

    return {
      key: mailbox.key,
      email: mailbox.email,
      smtpUser: mailbox.smtp.user,
      smtpHost: mailbox.smtp.host,
      smtpPort: mailbox.smtp.port,
      ok: true,
      ms: Date.now() - started,
      error: null
    }
  } catch (error) {
    return {
      key: mailbox.key,
      email: mailbox.email,
      smtpUser: mailbox.smtp.user,
      smtpHost: mailbox.smtp.host,
      smtpPort: mailbox.smtp.port,
      ok: false,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : "SMTP auth failed"
    }
  }
}

export async function GET() {
  try {
    const mailboxes = listEmailOSMultiMailboxes()
    const data: any[] = []

    for (const mailbox of mailboxes) {
      const result = await verifyMailbox(mailbox)
      data.push(result)

      /*
        Menara throttles SMTP greeting/auth checks.
        Keep diagnostics slow and sequential.
      */
      await sleep(2500)
    }

    return NextResponse.json({
      ok: true,
      data,
      summary: {
        total: data.length,
        ok: data.filter((item) => item.ok).length,
        failed: data.filter((item) => !item.ok).length,
        throttled: data.filter((item) => String(item.error || "").includes("Too many")).length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Auth diagnostics failed" },
      { status: 500 }
    )
  }
}
