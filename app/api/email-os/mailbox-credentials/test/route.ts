import { NextResponse } from "next/server"
import { getEmailOSMailboxCredentials } from "@/lib/email-os-core/mailbox-credentials"

export async function GET() {
  const data = getEmailOSMailboxCredentials().map((mailbox) => ({
    key: mailbox.key,
    label: mailbox.label,
    email: mailbox.email,
    smtp: {
      host: mailbox.smtp.host,
      port: mailbox.smtp.port,
      secure: mailbox.smtp.secure,
      user: mailbox.smtp.user,
      passwordConfigured: mailbox.smtp.passwordConfigured
    },
    incoming: (mailbox as any).incoming || (mailbox as any).imap
  }))

  return NextResponse.json({
    ok: true,
    data,
    summary: {
      total: data.length,
      configured: data.filter((item) => item.smtp.passwordConfigured).length
    }
  })
}
