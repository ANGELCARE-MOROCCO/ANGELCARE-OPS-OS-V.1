import { NextResponse } from "next/server"

export async function GET() {
  const smtp = {
    host: Boolean(process.env.EMAIL_OS_SMTP_HOST),
    port: Boolean(process.env.EMAIL_OS_SMTP_PORT),
    user: Boolean(process.env.EMAIL_OS_SMTP_USER),
    password: Boolean(process.env.EMAIL_OS_SMTP_PASSWORD),
    from: Boolean(process.env.EMAIL_OS_SMTP_FROM)
  }

  const imap = {
    host: Boolean(process.env.EMAIL_OS_IMAP_HOST),
    port: Boolean(process.env.EMAIL_OS_IMAP_PORT),
    user: Boolean(process.env.EMAIL_OS_IMAP_USER),
    password: Boolean(process.env.EMAIL_OS_IMAP_PASSWORD)
  }

  const smtpReady = Object.values(smtp).every(Boolean)
  const imapReady = Object.values(imap).every(Boolean)

  return NextResponse.json({
    ok: smtpReady && imapReady,
    data: {
      smtp,
      imap,
      smtpReady,
      imapReady,
      status: smtpReady && imapReady ? "provider-env-ready" : "provider-env-incomplete"
    }
  })
}
