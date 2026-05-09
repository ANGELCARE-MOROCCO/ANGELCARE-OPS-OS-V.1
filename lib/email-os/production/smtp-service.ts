
import nodemailer from "nodemailer"

export type SendEmailInput = {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}

export function createEmailOSTransporter() {
  const host = process.env.EMAIL_OS_SMTP_HOST
  const port = Number(process.env.EMAIL_OS_SMTP_PORT || 587)
  const user = process.env.EMAIL_OS_SMTP_USER
  const pass = process.env.EMAIL_OS_SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error("Missing EMAIL_OS_SMTP_HOST / USER / PASSWORD")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

export async function sendEmailOSMessage(input: SendEmailInput) {
  const transporter = createEmailOSTransporter()
  const from = input.from || process.env.EMAIL_OS_SMTP_USER

  if (!from) throw new Error("Missing sender address")

  return transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text
  })
}
