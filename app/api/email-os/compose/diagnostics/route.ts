import { NextResponse } from "next/server"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

export async function GET() {
  const mailboxes = listEmailOSMultiMailboxes()

  return NextResponse.json({
    ok: true,
    data: {
      mailboxCount: mailboxes.length,
      mailboxes: mailboxes.map((mailbox) => ({
        key: mailbox.key,
        label: mailbox.label,
        email: mailbox.email,
        mailboxId: mailbox.mailboxId,
        smtp: {
          host: mailbox.smtp.host,
          port: mailbox.smtp.port,
          secure: mailbox.smtp.secure,
          user: mailbox.smtp.user,
          configured: Boolean(mailbox.smtp.pass)
        },
        incoming: {
          protocol: mailbox.incoming.protocol,
          host: mailbox.incoming.host,
          port: mailbox.incoming.port,
          secure: mailbox.incoming.secure,
          user: mailbox.incoming.user,
          configured: Boolean(mailbox.incoming.pass)
        }
      }))
    }
  })
}
