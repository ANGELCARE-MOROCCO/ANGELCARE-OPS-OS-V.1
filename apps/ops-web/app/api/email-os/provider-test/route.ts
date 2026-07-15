import { NextResponse } from "next/server"
import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"
import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

export async function GET() {
  const mailboxes = listEmailOSMultiMailboxes()
  return NextResponse.json({
    ok: true,
    data: {
      mode: "resolver-only",
      mailboxCount: mailboxes.length,
      mailboxes: mailboxes.map((mailbox) => ({
        key: mailbox.key,
        email: mailbox.email,
        mailboxId: mailbox.mailboxId,
        smtpHost: mailbox.smtp.host,
        smtpPort: mailbox.smtp.port,
        incomingHost: mailbox.incoming.host,
        incomingPort: mailbox.incoming.port,
        incomingProtocol: mailbox.incoming.protocol
      }))
    }
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  if (!body.toEmail && !body.to_email && !body.to) {
    return NextResponse.json({
      ok: false,
      error: "Provider test requires toEmail to actually send. Use GET for dry-run resolver validation."
    }, { status: 400 })
  }

  const result = await sendEmailOSDirect({
    mailboxId: body.mailboxId || body.mailbox_id,
    fromEmail: body.fromEmail || body.from_email,
    toEmail: body.toEmail || body.to_email || body.to,
    subject: body.subject || "Email-OS provider test",
    body: body.body || "Email-OS provider test via central resolver."
  })

  return NextResponse.json({
    ok: true,
    data: {
      messageId: result.info.messageId || null,
      mailboxKey: result.identity.key,
      mailboxId: result.identity.mailboxId,
      from: result.identity.smtp.from
    }
  })
}
