export type EmailOSInboundBridgeIncoming = {
  protocol: "pop3"
  host: string
  port: number
  secure: boolean
}

export type EmailOSInboundBridgeRequest = {
  mailboxId: string
  email: string
  username: string
  password: string
  incoming: EmailOSInboundBridgeIncoming
  limit: number
}

export type EmailOSInboundBridgeMessage = {
  externalId: string
  messageId: string | null
  subject: string
  fromEmail: string
  fromName: string | null
  to: string[]
  cc: string[]
  date: string
  text: string | null
  html: string | null
  snippet: string
  hasAttachments: boolean
  attachments: Array<{
    filename: string | null
    contentType: string | null
    size: number | null
    storageFileId?: string | null
    storageBucket?: string | null
    storageKey?: string | null
    storageStatus?: string | null
  }>
  rawHeaders: Record<string, string>
}

export type EmailOSInboundBridgeResponse = {
  ok: true
  mailboxId: string
  email: string
  incoming: EmailOSInboundBridgeIncoming
  fetched: number
  skipped: number
  messages: EmailOSInboundBridgeMessage[]
  diagnostics?: Record<string, unknown>
}

export type EmailOSInboundBridgeErrorCode =
  | "BRIDGE_UNAVAILABLE"
  | "POP_TIMEOUT"
  | "POP_HOST_UNREACHABLE"
  | "POP_AUTH_FAILED"
  | "POP_PARSE_FAILED"

export class EmailOSInboundBridgeError extends Error {
  code: EmailOSInboundBridgeErrorCode
  status: number
  diagnostics: Record<string, unknown>

  constructor(code: EmailOSInboundBridgeErrorCode, message: string, status = 502, diagnostics: Record<string, unknown> = {}) {
    super(message)
    this.name = "EmailOSInboundBridgeError"
    this.code = code
    this.status = status
    this.diagnostics = diagnostics
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeBridgeUrl(value: unknown) {
  return clean(value).replace(/\/+$/, "")
}

function safePreview(value: unknown, maxLength = 260) {
  const raw = typeof value === "string" ? value : JSON.stringify(value || {})
  const text = raw.replace(/(["']?(?:password|pass|token|secret|authorization|cookie|smtpPass|smtpPassword)["']?\s*[:=]\s*)(["']?)([^"'\n\r,}]+)\2/gi, "$1***REDACTED***")
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

function getBridgeConfig() {
  const bridgeUrl = normalizeBridgeUrl(process.env.EMAIL_OS_BRIDGE_URL)
  const bridgeToken = clean(process.env.EMAIL_BRIDGE_ADMIN_TOKEN)

  return {
    bridgeUrl,
    bridgeToken,
    hasBridgeUrl: Boolean(bridgeUrl),
    hasBridgeToken: Boolean(bridgeToken)
  }
}

function buildBaseDiagnostics(input: EmailOSInboundBridgeRequest) {
  return {
    mailboxId: input.mailboxId,
    email: input.email,
    incoming: input.incoming,
    limit: input.limit
  }
}

function mapNetworkError(error: unknown, input: EmailOSInboundBridgeRequest) {
  const message = error instanceof Error ? error.message : String(error || "Bridge request failed")
  const diagnostics = {
    ...buildBaseDiagnostics(input),
    bridgeUrlHost: getBridgeUrlHost(process.env.EMAIL_OS_BRIDGE_URL || "")
  }

  if (/abort|timeout|timed out/i.test(message)) {
    return new EmailOSInboundBridgeError("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502, diagnostics)
  }

  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/i.test(message)) {
    return new EmailOSInboundBridgeError("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502, diagnostics)
  }

  return new EmailOSInboundBridgeError("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502, diagnostics)
}

function getBridgeUrlHost(bridgeUrl: string) {
  if (!bridgeUrl) return ""
  try {
    return new URL(bridgeUrl).host
  } catch {
    return ""
  }
}

function normalizeErrorCode(code: unknown): EmailOSInboundBridgeErrorCode {
  const normalized = clean(code).toUpperCase()
  if (normalized === "POP_TIMEOUT") return "POP_TIMEOUT"
  if (normalized === "POP_HOST_UNREACHABLE") return "POP_HOST_UNREACHABLE"
  if (normalized === "POP_AUTH_FAILED") return "POP_AUTH_FAILED"
  if (normalized === "POP_PARSE_FAILED") return "POP_PARSE_FAILED"
  return "BRIDGE_UNAVAILABLE"
}

export function isInboundBridgeUnavailableError(error: unknown) {
  return error instanceof EmailOSInboundBridgeError && error.code === "BRIDGE_UNAVAILABLE"
}

export async function fetchEmailOSInboundBridgeMessages(input: EmailOSInboundBridgeRequest): Promise<EmailOSInboundBridgeResponse> {
  const { bridgeUrl, bridgeToken, hasBridgeUrl, hasBridgeToken } = getBridgeConfig()

  if (!hasBridgeUrl || !/^https?:\/\//i.test(bridgeUrl)) {
    throw new EmailOSInboundBridgeError(
      "BRIDGE_UNAVAILABLE",
      "Windows inbound bridge unavailable",
      502,
      {
        ...buildBaseDiagnostics(input),
        hasBridgeUrl,
        hasBridgeToken
      }
    )
  }

  if (!hasBridgeToken) {
    throw new EmailOSInboundBridgeError(
      "BRIDGE_UNAVAILABLE",
      "Windows inbound bridge unavailable",
      502,
      {
        ...buildBaseDiagnostics(input),
        hasBridgeUrl,
        hasBridgeToken
      }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error("Bridge request timed out")), 45_000)

  try {
    const response = await fetch(`${bridgeUrl}/admin/inbound/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-email-bridge-admin-token": bridgeToken
      },
      body: JSON.stringify({
        mailboxId: input.mailboxId,
        email: input.email,
        username: input.username,
        password: input.password,
        host: input.incoming.host,
        port: input.incoming.port,
        secure: input.incoming.secure,
        limit: input.limit,
        protocol: input.incoming.protocol
      }),
      cache: "no-store",
      signal: controller.signal
    })

    const responseText = await response.text().catch(() => "")
    const payload = responseText ? (() => {
      try {
        return JSON.parse(responseText)
      } catch {
        return null
      }
    })() : null

    if (!response.ok || !payload?.ok) {
      const code = normalizeErrorCode(payload?.code || payload?.errorCode)
      const message =
        code === "POP_TIMEOUT"
          ? "POP3 connection timed out from Windows bridge"
          : code === "POP_AUTH_FAILED"
            ? "POP3 authentication failed"
            : code === "POP_PARSE_FAILED"
              ? "POP3 parse failed"
              : code === "POP_HOST_UNREACHABLE"
                ? "POP3 host unreachable from Windows bridge"
                : "Windows inbound bridge unavailable"

      throw new EmailOSInboundBridgeError(code, message, response.status || 502, {
        ...buildBaseDiagnostics(input),
        bridgeResponseStatus: response.status,
        bridgeResponseBodyPreview: safePreview(payload ?? responseText),
        bridgeUrlHost: getBridgeUrlHost(bridgeUrl)
      })
    }

    return payload
  } catch (error) {
    if (error instanceof EmailOSInboundBridgeError) {
      throw error
    }

    throw mapNetworkError(error, input)
  } finally {
    clearTimeout(timeout)
  }
}
