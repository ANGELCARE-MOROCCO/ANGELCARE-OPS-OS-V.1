import nodemailer from "nodemailer"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { resolveEmailOSMailboxIdentity, resolveEmailOSMailboxIdentityFromDb } from "@/lib/email-os-core/multi-mailbox-resolver"
import { downloadStorageFileFromBridge, loadStorageFileMetadata } from "@/lib/email-os-core/storage-gateway"
import { auditSenderIdentity, resolveSenderIdentity, senderIdentitySnapshot, type ResolvedSenderIdentity, type SenderIdentityOverride } from "@/lib/email-os-core/sender-identity"

const sendLocks = new Map<string, Promise<void>>()
const lastSendAt = new Map<string, number>()

export type EmailOSAttachmentInput = {
  filename: string
  contentType?: string | null
  contentBase64?: string | null
  fileId?: string | null
  storageFileId?: string | null
  storageBucket?: string | null
  storageKey?: string | null
}

export type EmailOSSendInput = {
  mailboxId?: string | null
  fromEmail?: string | null
  fromDisplayName?: string | null
  senderIdentityId?: string | null
  senderIdentityVersion?: number | null
  freezeSenderIdentity?: boolean
  senderIdentityOverride?: SenderIdentityOverride | null
  toEmail: string
  ccEmail?: string | null
  bccEmail?: string | null
  subject: string
  body: string
  bodyHtml?: string | null
  bodyText?: string | null
  headers?: Record<string, string>
  attachments?: EmailOSAttachmentInput[]
}

export type EmailOSSendInfo = {
  messageId: string | null
  accepted: unknown[]
  rejected: unknown[]
  bridge: boolean
  bridgeUrl?: string
  senderIdentity: ResolvedSenderIdentity
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


const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024
const MAX_ATTACHMENT_COUNT = 10

function sanitizeAttachmentFilename(value: unknown) {
  const raw = clean(value).replace(/[\\/:*?"<>|]/g, "_")
  return raw.slice(0, 160) || "attachment"
}

function estimateBase64Bytes(value: string) {
  const cleanValue = value.replace(/\s/g, "")
  const padding = cleanValue.endsWith("==") ? 2 : cleanValue.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor(cleanValue.length * 3 / 4) - padding)
}

async function normalizeEmailAttachments(input: unknown) {
  const rows = Array.isArray(input) ? input.slice(0, MAX_ATTACHMENT_COUNT) : []
  let totalBytes = 0
  const db = createEmailOSCoreDb()

  async function resolveStorageAttachment(fileId: string, fallbackFilename: string, fallbackContentType: string) {
    const metadata = await loadStorageFileMetadata(db, fileId)
    const response = await downloadStorageFileFromBridge(fileId)
    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length) {
      throw new Error(`Attachment ${fallbackFilename} has no file content.`)
    }
    const contentType = clean(metadata?.content_type || fallbackContentType) || "application/octet-stream"
    const filename = sanitizeAttachmentFilename(metadata?.original_filename || fallbackFilename)
    return { filename, contentType, content: buffer }
  }

  const normalized: Array<{ filename: string; contentType: string; content: Buffer }> = []

  for (const item of rows) {
    const filename = sanitizeAttachmentFilename(item?.filename || item?.name)
    const contentType = clean(item?.contentType || item?.content_type || item?.mimeType) || "application/octet-stream"
    const fileId = clean(item?.fileId || item?.file_id || item?.storageFileId || item?.storage_file_id)
    const rawBase64 = clean(item?.contentBase64 || item?.content_base64 || item?.base64 || item?.content)

    if (fileId) {
      const resolved = await resolveStorageAttachment(fileId, filename, contentType)
      const bytes = resolved.content.length
      if (bytes > MAX_ATTACHMENT_BYTES) {
        throw new Error(`Attachment ${resolved.filename} exceeds the 8 MB limit.`)
      }

      totalBytes += bytes
      if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
        throw new Error("Total attachments exceed the 15 MB limit.")
      }

      normalized.push(resolved)
      continue
    }

    if (!rawBase64) {
      throw new Error(`Attachment ${filename} has no file content.`)
    }

    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(rawBase64)) {
      throw new Error(`Attachment ${filename} is not valid base64.`)
    }

    const bytes = estimateBase64Bytes(rawBase64)
    if (bytes > MAX_ATTACHMENT_BYTES) {
      throw new Error(`Attachment ${filename} exceeds the 8 MB limit.`)
    }

    totalBytes += bytes
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new Error("Total attachments exceed the 15 MB limit.")
    }

    normalized.push({
      filename,
      contentType,
      content: Buffer.from(rawBase64, "base64")
    })
  }

  return normalized
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function decodeHtmlEntities(value: unknown) {
  let output = String(value || "")

  for (let pass = 0; pass < 3; pass += 1) {
    const before = output
    output = output
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '\"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
    if (output === before) break
  }

  return output
}

function normalizeHtmlMarkup(value: unknown) {
  const raw = String(value || "").trim()
  if (!raw) return ""

  const containsHtml = /<[a-z][\s\S]*>/i.test(raw)
  const containsEncodedHtml = /&lt;\/?[a-z][\s\S]*?&gt;/i.test(raw) || /&amp;lt;\/?[a-z][\s\S]*?&amp;gt;/i.test(raw)
  const normalized = !containsHtml && containsEncodedHtml ? decodeHtmlEntities(raw) : raw

  if (/<[a-z][\s\S]*>/i.test(normalized)) return normalized
  return escapeHtml(normalized).replace(/\r?\n/g, "<br />")
}

function htmlFromBody(value: unknown) {
  return normalizeHtmlMarkup(value)
}

function textFromBody(value: unknown) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
      .replace(/<li(?:\s[^>]*)?>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function resolveMessageBodies(input: EmailOSSendInput) {
  const html = htmlFromBody(input.bodyHtml ?? input.body)
  const text = clean(input.bodyText) || textFromBody(input.bodyHtml ?? input.body)
  return { html, text }
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

async function sendViaBridge(identity: any, input: EmailOSSendInput, senderIdentity: ResolvedSenderIdentity): Promise<EmailOSSendInfo | null> {
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
  const messageBodies = resolveMessageBodies(input)

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
        fromEmail: senderIdentity.fromAddress,
        fromName: senderIdentity.fromName,
        replyToName: senderIdentity.replyToName || undefined,
        diagnostics: {
          source: "angelcare-email-os",
          transport: "angelcare-windows-email-bridge",
          mailboxId: identity.mailboxId,
          mailboxKey: identity.key,
          smtpHost: identity.smtp.host,
          smtpPort: identity.smtp.port,
          smtpUser: identity.smtp.user,
          passwordConfigured: Boolean(identity.credential?.passwordRef || identity.smtp.pass),
          senderIdentity: senderIdentitySnapshot(senderIdentity)
        },
        toEmail: input.toEmail,
        cc: clean(input.ccEmail) || undefined,
        bcc: clean(input.bccEmail) || undefined,
        subject: input.subject || "(Sans objet)",
        body: messageBodies.html,
        text: messageBodies.text,
        html: messageBodies.html,
        replyTo: senderIdentity.replyToAddress || input.headers?.["Reply-To"] || undefined,
        attachments: (await normalizeEmailAttachments(input.attachments || [])).map((item) => ({
          filename: item.filename,
          contentType: item.contentType,
          contentBase64: item.content.toString("base64")
        }))
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
    bridgeUrl,
    senderIdentity
  }
}

export function getEmailOSBridgeFailureDiagnostics(error: unknown) {
  if (error instanceof EmailOSBridgeFetchError) {
    return error.diagnostics
  }

  return null
}

export async function sendEmailOSDirect(input: EmailOSSendInput): Promise<{ identity: any; info: EmailOSSendInfo }> {
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

  const senderIdentity = await resolveSenderIdentity({
    mailboxId: identity.mailboxId || mailboxId,
    canonicalFromAddress: identity.smtp.from,
    mailboxInternalName: identity.label || identity.key,
    requestedDisplayName: input.fromDisplayName,
    senderIdentityId: input.senderIdentityId,
    senderIdentityVersion: input.freezeSenderIdentity ? input.senderIdentityVersion : null,
    override: input.senderIdentityOverride || null,
  })

  const lockKey = identity.smtp.user || identity.email || identity.key

  const info = await runLocked<EmailOSSendInfo>(lockKey, async () => {
    const bridged = await sendViaBridge(identity, input, senderIdentity)
    if (bridged) return bridged

    if (String(process.env.EMAIL_OS_FORCE_BRIDGE || "").toLowerCase() === "true") {
      throw new Error("Email-OS bridge is required but EMAIL_OS_BRIDGE_URL is missing or bridge send did not execute")
    }

    const messageBodies = resolveMessageBodies(input)

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
      const sent = await transporter.sendMail({
        from: { name: senderIdentity.fromName, address: senderIdentity.fromAddress },
        to: toEmail,
        cc: clean(input.ccEmail) || undefined,
        bcc: clean(input.bccEmail) || undefined,
        subject: input.subject || "(Sans objet)",
        text: messageBodies.text,
        html: messageBodies.html,
        attachments: await normalizeEmailAttachments(input.attachments || []),
        replyTo: senderIdentity.replyToAddress
          ? { name: senderIdentity.replyToName || senderIdentity.fromName, address: senderIdentity.replyToAddress }
          : undefined,
        headers: {
          "X-AngelCare-Mailbox-Key": identity.key,
          "X-AngelCare-Mailbox-ID": identity.mailboxId,
          "X-AngelCare-Actual-From": senderIdentity.fromAddress,
          "X-AngelCare-Sender-Identity-ID": senderIdentity.identityId || "fallback",
          "X-AngelCare-Sender-Identity-Version": String(senderIdentity.version || 0),
          ...(input.headers || {})
        }
      })

      return {
        messageId: clean((sent as any)?.messageId) || null,
        accepted: Array.isArray((sent as any)?.accepted) ? (sent as any).accepted : [],
        rejected: Array.isArray((sent as any)?.rejected) ? (sent as any).rejected : [],
        bridge: false,
        senderIdentity
      }
    } finally {
      transporter.close()
    }
  })

  await auditSenderIdentity({
    identityId: senderIdentity.identityId,
    mailboxId: senderIdentity.mailboxId || identity.mailboxId,
    actor: { name: clean(input.headers?.["X-AngelCare-Operator-Name"]) || "Email OS send service" },
    action: "sender_identity_used_for_send",
    result: "success",
    reason: "Resolved automatically by the authoritative sender identity service",
    metadata: {
      messageId: info.messageId,
      fromName: senderIdentity.fromName,
      fromAddress: senderIdentity.fromAddress,
      replyToName: senderIdentity.replyToName,
      replyToAddress: senderIdentity.replyToAddress,
      source: senderIdentity.source,
      bridge: info.bridge,
    },
  }).catch(() => null)

  return {
    identity,
    info
  }
}
