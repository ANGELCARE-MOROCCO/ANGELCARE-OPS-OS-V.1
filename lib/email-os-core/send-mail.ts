import nodemailer from "nodemailer"
import { resolveEmailOSMailboxIdentity, resolveEmailOSMailboxIdentityFromDb } from "@/lib/email-os-core/multi-mailbox-resolver"

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

function bridgeUrl() {
  return clean(process.env.EMAIL_OS_BRIDGE_URL).replace(/\/+$/, "")
}

function bridgeToken() {
  return clean(process.env.EMAIL_OS_BRIDGE_TOKEN)
}

async function sendViaBridge(identity: any, input: EmailOSSendInput) {
  const url = bridgeUrl()
  if (!url) return null

  const response = await fetch(`${url}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-email-os-token": bridgeToken()
    },
    body: JSON.stringify({
      smtpHost: identity.smtp.host,
      smtpPort: identity.smtp.port,
      smtpSecure: identity.smtp.secure,
      username: identity.smtp.user,
      password: identity.smtp.pass || identity.credential?.passwordRef || "",
      fromEmail: identity.smtp.from,
      diagnostics: {
        source: "angelcare-email-os",
        transport: "angelcare-windows-email-bridge",
        mailboxId: identity.mailboxId,
        mailboxKey: identity.key,
        smtpHost: identity.smtp.host,
        smtpPort: identity.smtp.port,
        smtpUser: identity.smtp.user,
        passwordConfigured: Boolean(identity.credential?.passwordRef || identity.smtp.pass)
      },
      toEmail: input.toEmail,
      cc: clean(input.ccEmail) || undefined,
      bcc: clean(input.bccEmail) || undefined,
      subject: input.subject || "(Sans objet)",
      text: input.body || "",
      html: String(input.body || "").replace(/\n/g, "<br />"),
      replyTo: input.headers?.["Reply-To"] || undefined
    })
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    const error = payload?.error || `Email bridge failed with HTTP ${response.status}`
    throw new Error(error)
  }

  return {
    messageId: payload?.data?.messageId || null,
    accepted: payload?.data?.accepted || [],
    rejected: payload?.data?.rejected || [],
    bridge: true,
    bridgeUrl: url
  }
}

export async function sendEmailOSDirect(input: EmailOSSendInput) {
  const toEmail = clean(input.toEmail)
  const fromEmail = clean(input.fromEmail)
  const mailboxId = clean(input.mailboxId)

  if (!toEmail) {
    throw new Error("Recipient is required")
  }

  const dbIdentity = await resolveEmailOSMailboxIdentityFromDb({
    mailboxId,
    fromEmail,
    selectedEmail: fromEmail
  })

  const identity =
    dbIdentity ||
    resolveEmailOSMailboxIdentity({
      mailboxId,
      fromEmail,
      selectedEmail: fromEmail
    })

  if (
    !identity ||
    !identity.smtp.host ||
    !identity.smtp.port ||
    !identity.smtp.user ||
    !(identity.smtp.pass || identity.credential?.passwordRef)
  ) {
    throw new Error(
      `SMTP is not configured for selected mailbox. mailboxId=${mailboxId || "none"} from=${fromEmail || "none"}`
    )
  }

  const lockKey = identity.smtp.user || identity.email || identity.key

  const info = await runLocked(lockKey, async () => {
    const bridged = await sendViaBridge(identity, input)
    if (bridged) return bridged

    if (String(process.env.EMAIL_OS_FORCE_BRIDGE || "").toLowerCase() === "true") {
      throw new Error("Email-OS bridge is required but EMAIL_OS_BRIDGE_URL is missing or bridge send did not execute")
    }

    const transporter = nodemailer.createTransport({
      host: identity.smtp.host,
      port: identity.smtp.port,
      secure: identity.smtp.secure,
      auth: {
        user: identity.smtp.user,
        pass: identity.smtp.pass || identity.credential?.passwordRef || ""
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
