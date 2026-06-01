import { NextResponse } from "next/server"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

export async function GET() {
  const mailboxes = listEmailOSMultiMailboxes()
  const configured = mailboxes.filter((mailbox) =>
    mailbox.email &&
    mailbox.smtp.host &&
    mailbox.smtp.port &&
    mailbox.smtp.user &&
    mailbox.smtp.pass &&
    mailbox.incoming.host &&
    mailbox.incoming.port &&
    mailbox.incoming.user &&
    mailbox.incoming.pass
  )

  return NextResponse.json({
    ok: true,
    data: {
      providerMode: process.env.EMAIL_PROVIDER_MODE || "multi_mailbox_enterprise",
      totalMailboxes: mailboxes.length,
      configuredMailboxes: configured.length,
      ready: mailboxes.length > 0 && configured.length === mailboxes.length,
      smtpHost: mailboxes[0]?.smtp?.host || null,
      smtpPort: mailboxes[0]?.smtp?.port || null,
      incomingProtocol: mailboxes[0]?.incoming?.protocol || null,
      incomingHost: mailboxes[0]?.incoming?.host || null,
      incomingPort: mailboxes[0]?.incoming?.port || null
    }
  })
}
