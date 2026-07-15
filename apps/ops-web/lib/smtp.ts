import { sendEmailOSDirect } from "@/lib/email-os-core/send-mail"

export type LegacySmtpSendInput = {
  from?: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  text?: string
  html?: string
  body?: string
  mailboxId?: string
}

export async function sendSmtpMail(input: LegacySmtpSendInput) {
  const body =
    input.body ||
    input.text ||
    String(input.html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")

  const result = await sendEmailOSDirect({
    mailboxId: input.mailboxId,
    fromEmail: input.from,
    toEmail: input.to,
    ccEmail: input.cc,
    bccEmail: input.bcc,
    subject: input.subject,
    body
  })

  return result.info
}

export async function sendMailViaAccount(account: any, message: { to: string; cc?: string; bcc?: string; subject: string; text?: string; html?: string; body?: string }) {
  const mailboxId = account?.mailbox_id || account?.mailboxId || account?.id || account?.email || account?.email_address || account?.address
  return sendSmtpMail({
    mailboxId,
    from: account?.email || account?.email_address || account?.address || account?.from_email,
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    text: message.text,
    html: message.html,
    body: message.body
  })
}

export async function sendMail(input: LegacySmtpSendInput) {
  return sendSmtpMail(input)
}

export default {
  sendMail: sendSmtpMail,
  sendSmtpMail,
  sendMailViaAccount
}
