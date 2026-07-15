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

export type EmailOSBridgeFetchDiagnostics = {
  bridgeFetchFailed: true
  bridgeUrlHost: string
  bridgeEndpointPath: "/send"
  forceBridge: boolean
  hasBridgeUrl: boolean
  hasBridgeToken: boolean
  errorName: string
  errorMessage: string
  errorCauseCode?: string
  errorCauseMessage?: string
  bridgeResponseStatus?: number
  bridgeResponseBodyPreview?: string
}

export class EmailOSBridgeFetchError extends Error {
  diagnostics: EmailOSBridgeFetchDiagnostics

  constructor(message: string, diagnostics: EmailOSBridgeFetchDiagnostics) {
    super(message)
    this.name = "EmailOSBridgeFetchError"
    this.diagnostics = diagnostics
  }
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

function normalizeBridgeUrl(value: unknown) {
  return clean(value).replace(/\/+$/, "")
}

function getBridgeConfig() {
  const bridgeUrl = normalizeBridgeUrl(process.env.EMAIL_OS_BRIDGE_URL)
  const bridgeToken = clean(process.env.EMAIL_OS_BRIDGE_TOKEN)
  const forceBridge = String(process.env.EMAIL_OS_FORCE_BRIDGE || "").toLowerCase() === "true"
  const hasBridgeUrl = Boolean(bridgeUrl)
  const hasBridgeToken = Boolean(bridgeToken)
  const bridgeUrlHost = getBridgeUrlHost(bridgeUrl)

  return {
    bridgeUrl,
    bridgeToken,
    forceBridge,
    hasBridgeUrl,
    hasBridgeToken,
    bridgeUrlHost
  }
}

function getBridgeUrlHost(bridgeUrl: string) {
  if (!bridgeUrl) return ""

  try {
    return new URL(bridgeUrl).host
  } catch {
    return ""
  }
}

function safePreview(input: unknown, maxLength = 260) {
  if (input === null || input === undefined) return ""

  const redactText = (text: string) =>
    text
      .replace(/(["']?(?:password|pass|token|secret|authorization|cookie|smtpPass|smtpPassword)["']?\s*[:=]\s*)(["']?)([^"'\n\r,}]+)\2/gi, "$1***REDACTED***")
      .replace(/(smtpPass\s*[:=]\s*)([^,\s}]+)/gi, "$1***REDACTED***")

  const raw = typeof input === "string" ? input : JSON.stringify(input)
  const text = redactText(raw || "")
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

function getErrorCause(error: unknown) {
  if (!error || typeof error !== "object") return null
  const cause = (error as { cause?: unknown }).cause
  if (!cause || typeof cause !== "object") return null

  const code = clean((cause as { code?: unknown }).code)
  const message = clean((cause as { message?: unknown }).message)

  return {
    code: code || undefined,
    message: message || undefined
  }
}

function buildBridgeDiagnostics(input: {
  bridgeUrl: string
  forceBridge: boolean
  hasBridgeUrl: boolean
  hasBridgeToken: boolean
  error: unknown
  bridgeResponseStatus?: number
  bridgeResponseBodyPreview?: string
}): EmailOSBridgeFetchDiagnostics {
  const errorName = input.error instanceof Error ? input.error.name : "Error"
  const errorMessage = input.error instanceof Error ? input.error.message : String(input.error || "Bridge request failed")
  const cause = getErrorCause(input.error)

  return {
    bridgeFetchFailed: true,
    bridgeUrlHost: getBridgeUrlHost(input.bridgeUrl),
    bridgeEndpointPath: "/send",
    forceBridge: input.forceBridge,
    hasBridgeUrl: input.hasBridgeUrl,
    hasBridgeToken: input.hasBridgeToken,
    errorName,
    errorMessage,
    ...(cause?.code ? { errorCauseCode: cause.code } : {}),
    ...(cause?.message ? { errorCauseMessage: cause.message } : {}),
    ...(typeof input.bridgeResponseStatus === "number" ? { bridgeResponseStatus: input.bridgeResponseStatus } : {}),
    ...(input.bridgeResponseBodyPreview ? { bridgeResponseBodyPreview: input.bridgeResponseBodyPreview } : {})
  }
}

function getBridgeFailureMessage(reason: string, bridgeUrl: string) {
  const host = getBridgeUrlHost(bridgeUrl)
  return `${reason}${host ? ` (${host})` : ""}`
}

async function sendViaBridge(identity: any, input: EmailOSSendInput) {
  const { bridgeUrl, bridgeToken, forceBridge, hasBridgeUrl, hasBridgeToken } = getBridgeConfig()

  if (!hasBridgeUrl || !bridgeUrl.startsWith("http://") && !bridgeUrl.startsWith("https://")) {
    if (forceBridge) {
      throw new EmailOSBridgeFetchError(
        "Email-OS bridge is required but EMAIL_OS_BRIDGE_URL is missing or invalid.",
        {
          bridgeFetchFailed: true,
          bridgeUrlHost: getBridgeUrlHost(bridgeUrl),
          bridgeEndpointPath: "/send",
          forceBridge,
          hasBridgeUrl,
          hasBridgeToken,
          errorName: "EmailOSBridgeConfigError",
          errorMessage: "EMAIL_OS_BRIDGE_URL must be configured and start with http:// or https://."
        }
      )
    }

    return null
  }

  if (!hasBridgeToken) {
    if (forceBridge) {
      throw new EmailOSBridgeFetchError(
        "Email-OS bridge is required but EMAIL_OS_BRIDGE_TOKEN is missing.",
        {
          bridgeFetchFailed: true,
          bridgeUrlHost: getBridgeUrlHost(bridgeUrl),
          bridgeEndpointPath: "/send",
          forceBridge,
          hasBridgeUrl,
          hasBridgeToken,
          errorName: "EmailOSBridgeConfigError",
          errorMessage: "EMAIL_OS_BRIDGE_TOKEN must be configured before bridge send can run."
        }
      )
    }

    return null
  }

  const endpoint = `${bridgeUrl}/send`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-email-os-token": bridgeToken
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
      }),
      cache: "no-store"
    })
  } catch (error) {
    throw new EmailOSBridgeFetchError(
      getBridgeFailureMessage("Email bridge fetch failed", bridgeUrl),
      buildBridgeDiagnostics({
        bridgeUrl,
        forceBridge,
        hasBridgeUrl,
        hasBridgeToken,
        error
      })
    )
  }

  const responseText = await response.text().catch(() => "")
  const payload = responseText ? (() => {
    try {
      return JSON.parse(responseText)
    } catch {
      return null
    }
  })() : null

  if (!response.ok || !payload?.ok) {
    throw new EmailOSBridgeFetchError(
      payload?.error || `Email bridge failed with HTTP ${response.status}`,
      buildBridgeDiagnostics({
        bridgeUrl,
        forceBridge,
        hasBridgeUrl,
        hasBridgeToken,
        error: new Error(payload?.error || `Email bridge failed with HTTP ${response.status}`),
        bridgeResponseStatus: response.status,
        bridgeResponseBodyPreview: safePreview(payload ?? responseText)
      })
    )
  }

  return {
    messageId: payload?.data?.messageId || null,
    accepted: payload?.data?.accepted || [],
    rejected: payload?.data?.rejected || [],
    bridge: true,
    bridgeUrl
  }
}

export function getEmailOSBridgeFailureDiagnostics(error: unknown) {
  if (error instanceof EmailOSBridgeFetchError) {
    return error.diagnostics
  }

  return null
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
