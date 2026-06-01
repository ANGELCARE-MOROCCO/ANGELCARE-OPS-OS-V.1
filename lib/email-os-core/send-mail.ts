import nodemailer from "nodemailer"
import { resolveEmailOSMailboxIdentity } from "@/lib/email-os-core/multi-mailbox-resolver"

const sendLocks = new Map<string, Promise<void>>()
const lastSendAt = new Map<string, number>()

export type EmailOSSendInput = {
  mailboxId?: string | null
  fromEmail?: string | null
  toEmail: string
  ccEmail?: string | null
  bccEmail?: string | null
  subject: string
  body: string
  headers?: Record<string, string>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runLocked<T>(key: string, task: () => Promise<T>) {
  const previous = sendLocks.get(key) || Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })

  sendLocks.set(key, previous.then(() => current))

  await previous

  try {
    const now = Date.now()
    const last = lastSendAt.get(key) || 0
    const waitMs = Math.max(0, 1600 - (now - last))

    if (waitMs > 0) {
      await sleep(waitMs)
    }

    const result = await task()
    lastSendAt.set(key, Date.now())
    return result
  } finally {
    release()
    if (sendLocks.get(key) === current) {
      sendLocks.delete(key)
    }
  }
}

function clean(value: any) {
  return typeof value === "string" ? value.trim() : ""
}

export async function sendEmailOSDirect(input: EmailOSSendInput) {
  const toEmail = clean(input.toEmail)
  const fromEmail = clean(input.fromEmail)
  const mailboxId = clean(input.mailboxId)

  if (!toEmail) {
    throw new Error("Recipient is required")
  }

  const identity = resolveEmailOSMailboxIdentity({
    mailboxId,
    fromEmail,
    selectedEmail: fromEmail
  })

  if (!identity || !identity.smtp.host || !identity.smtp.port || !identity.smtp.user || !identity.smtp.pass) {
    throw new Error(
      `SMTP is not configured for selected mailbox. mailboxId=${mailboxId || "none"} from=${fromEmail || "none"}`
    )
  }

  const lockKey = identity.smtp.user || identity.email || identity.key

  const info = await runLocked(lockKey, async () => {
    const transporter = nodemailer.createTransport({
      host: identity.smtp.host,
      port: identity.smtp.port,
      secure: identity.smtp.secure,
      auth: {
        user: identity.smtp.user,
        pass: identity.smtp.pass
      },
      pool: false,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 45000
    } as any)

    try {
      /*
        Do not pre-verify before send.
        Menara counts greetings aggressively and can return 421.
      */
      return await transporter.sendMail({
        from: identity.smtp.from,
        to: toEmail,
        cc: clean(input.ccEmail) || undefined,
        bcc: clean(input.bccEmail) || undefined,
        subject: input.subject || "(Sans objet)",
        text: input.body || "",
        html: String(input.body || "").replace(/\n/g, "<br />"),
        headers: {
          "X-AngelCare-Mailbox-Key": identity.key,
          "X-AngelCare-Mailbox-ID": identity.mailboxId,
          "X-AngelCare-Actual-From": identity.smtp.from,
          ...(input.headers || {})
        }
      })
    } finally {
      transporter.close()
    }
  })

  return {
    identity,
    info
  }
}
