import { getCurrentUser } from "@/lib/getUser"

export type ServerControlAction =
  | "restart_bridge"
  | "restart_caddy"
  | "validate_caddy"
  | "refresh_duckdns"
  | "smtp_test"
  | "send_test"
  | "reboot_server"
  | "shutdown_server"
  | "cancel_shutdown"
  | "network_test"

export type ServerControlServiceName = "angelcare-email-bridge" | "angelcare-caddy"
export type ServerControlLogType = "bridge" | "bridge-error" | "caddy" | "caddy-error" | "audit"

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function maskValue(value: unknown, visible = 4) {
  const text = cleanString(value)
  if (!text) return ""
  if (text.length <= visible * 2) return `${text.slice(0, 1)}***${text.slice(-1)}`
  return `${text.slice(0, visible)}***${text.slice(-visible)}`
}

export function maskEmail(value: unknown) {
  const email = cleanString(value)
  if (!email) return ""
  const [local, domain] = email.split("@")
  if (!domain) return maskValue(email, 3)
  const localMasked = local.length <= 2 ? `${local.slice(0, 1)}*` : `${local.slice(0, 2)}***`
  return `${localMasked}@${domain}`
}

export function maskHost(value: unknown) {
  return cleanString(value)
}

export function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getEmailBridgeBaseUrl() {
  return cleanString(process.env.EMAIL_OS_BRIDGE_URL).replace(/\/+$/, "")
}

export function getEmailBridgeAdminToken() {
  return cleanString(process.env.EMAIL_BRIDGE_ADMIN_TOKEN)
}

export function getEmailBridgePublicDomain() {
  return cleanString(process.env.EMAIL_OS_BRIDGE_URL || "https://angelcare-mailbridge.duckdns.org")
}

export function getOperatorLabel(user: any, request?: Request) {
  const headerOperator = cleanString(request?.headers.get("x-angelcare-operator"))
  if (headerOperator) return headerOperator.slice(0, 120)

  const candidates = [
    user?.full_name,
    user?.name,
    user?.email,
    user?.username,
    user?.id
  ]

  const value = candidates.map(cleanString).find(Boolean) || "operator"
  return value.slice(0, 120)
}

export function getRequestIp(request: Request) {
  const forwarded = cleanString(request.headers.get("x-forwarded-for"))
  if (forwarded) return forwarded.split(",")[0]?.trim() || ""
  return cleanString(request.headers.get("x-real-ip")) || cleanString(request.headers.get("cf-connecting-ip")) || ""
}

export function maskSecretValue(value: unknown) {
  const text = cleanString(value)
  if (!text) return ""
  if (text.length <= 8) return "***"
  return `${text.slice(0, 4)}***${text.slice(-4)}`
}

export function buildTechnicalSettings() {
  const smtpUser = cleanString(process.env.DEFAULT_SMTP_USER || process.env.EMAIL_OS_SMTP_USER)
  const smtpHost = cleanString(process.env.DEFAULT_SMTP_HOST || process.env.EMAIL_OS_SMTP_HOST || "smtp-auth.menara.ma")
  const smtpPort = cleanString(process.env.DEFAULT_SMTP_PORT || process.env.EMAIL_OS_SMTP_PORT || "587")

  return {
    emailOsBridgeUrl: cleanString(process.env.EMAIL_OS_BRIDGE_URL || "https://angelcare-mailbridge.duckdns.org"),
    emailOsForceBridge: cleanString(process.env.EMAIL_OS_FORCE_BRIDGE || "false"),
    emailOsBridgeToken: maskSecretValue(process.env.EMAIL_OS_BRIDGE_TOKEN),
    emailBridgeAdminToken: maskSecretValue(process.env.EMAIL_BRIDGE_ADMIN_TOKEN),
    publicBridgeDomain: cleanString(process.env.EMAIL_OS_BRIDGE_URL || "https://angelcare-mailbridge.duckdns.org"),
    serviceNames: {
      bridge: "angelcare-email-bridge",
      caddy: "angelcare-caddy"
    },
    logPaths: {
      bridgeOut: "C:\\AngelCare\\logs\\email-bridge-out.log",
      bridgeError: "C:\\AngelCare\\logs\\email-bridge-error.log",
      caddyOut: "C:\\AngelCare\\logs\\caddy-out.log",
      caddyError: "C:\\AngelCare\\logs\\caddy-error.log",
      audit: "C:\\AngelCare\\logs\\email-bridge-audit.jsonl"
    },
    caddyfilePath: "C:\\AngelCare\\caddy\\Caddyfile",
    duckdnsDomain: "angelcare-mailbridge.duckdns.org",
    menara: {
      host: maskHost(smtpHost),
      port: smtpPort,
      user: maskEmail(smtpUser)
    }
  }
}

export function normalizeLinesParam(input: string | null | undefined, fallback = 200) {
  const value = safeNumber(input, fallback)
  return Math.min(1000, Math.max(1, Math.floor(value)))
}

export function normalizeLogType(type: string | null | undefined): ServerControlLogType {
  const clean = cleanString(type).toLowerCase()
  if (clean === "bridge-error" || clean === "caddy" || clean === "caddy-error" || clean === "audit") return clean
  return "bridge"
}

export function mapLogTypeToPath(type: ServerControlLogType) {
  switch (type) {
    case "bridge-error":
      return "bridge-error"
    case "caddy":
      return "caddy"
    case "caddy-error":
      return "caddy-error"
    case "audit":
      return "audit"
    case "bridge":
    default:
      return "bridge"
  }
}

export function isServerControlAction(value: unknown): value is ServerControlAction {
  return [
    "restart_bridge",
    "restart_caddy",
    "validate_caddy",
    "refresh_duckdns",
    "smtp_test",
    "send_test",
    "reboot_server",
    "shutdown_server",
    "cancel_shutdown",
    "network_test"
  ].includes(String(value))
}

export async function getAuthenticatedOperatorContext(request: Request) {
  const user = await getCurrentUser().catch(() => null)

  if (!user) {
    return null
  }

  return {
    user,
    operator: getOperatorLabel(user, request)
  }
}

export async function callBridgeAdmin(path: string, options: RequestInit = {}, operator?: string, requestIp?: string) {
  const baseUrl = getEmailBridgeBaseUrl()
  const adminToken = getEmailBridgeAdminToken()

  if (!baseUrl) {
    throw new Error("EMAIL_OS_BRIDGE_URL is not configured")
  }

  if (!adminToken) {
    throw new Error("EMAIL_BRIDGE_ADMIN_TOKEN is not configured")
  }

  const headers = new Headers(options.headers || {})
  headers.set("x-email-bridge-admin-token", adminToken)
  if (operator) headers.set("x-angelcare-operator", operator)
  if (requestIp) headers.set("x-forwarded-for", requestIp)
  headers.set("content-type", "application/json")

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  })

  const json = await response.json().catch(() => null)

  if (!response.ok || json?.ok === false) {
    const error = json?.error || `Bridge request failed with HTTP ${response.status}`
    throw new Error(error)
  }

  return json
}

export function buildServerControlError(message: string, status = 500, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...(extra || {}) }, { status })
}

export function buildServerControlOk<T>(data: T, extra?: Record<string, unknown>) {
  return Response.json({ ok: true, data, ...(extra || {}) })
}
