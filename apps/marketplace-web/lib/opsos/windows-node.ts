import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/getUser"
import {
  cleanString,
  maskSecretValue,
  maskEmail,
  getRequestIp,
} from "@/lib/email-os/server-control"
import type {
  MaintenanceModeState,
  WindowsAuditEvent,
  WindowsNodeApiError,
  WindowsNodeApiResponse,
  WindowsNodeHealthStatus,
  WindowsNodeLogType,
  WindowsNodeAuditSeverity,
} from "@/lib/opsos/windows-node-types"

type AdminUser = {
  id?: string
  email?: string
  name?: string
  full_name?: string
  username?: string
  role?: string
  title?: string
  permissions?: string[]
}

type BridgeProxyResult<T> = WindowsNodeApiResponse<T> | (WindowsNodeApiError & { status: number })

const INFRA_ADMIN_ROLES = new Set([
  "ceo",
  "owner",
  "founder",
  "super_admin",
  "superadmin",
  "admin_ceo",
  "admin",
  "direction",
  "director",
  "managing_director",
  "managing director",
  "internal_platform_admin",
  "platform_admin",
  "internal_admin",
  "infrastructure_admin",
  "infrastructure admin",
])

const ALLOWED_LOG_TYPES = new Set<WindowsNodeLogType>([
  "bridge",
  "bridge-error",
  "caddy",
  "caddy-error",
  "duckdns",
  "audit",
  "service",
])

export function normalizeWindowsNodeBridgeUrl() {
  return cleanString(process.env.EMAIL_OS_BRIDGE_URL || "https://angelcare-mailbridge.duckdns.org").replace(/\/+$/, "")
}

export function getWindowsNodeBridgeHost() {
  const baseUrl = normalizeWindowsNodeBridgeUrl()
  try {
    return baseUrl ? new URL(baseUrl).host : ""
  } catch {
    return ""
  }
}

export function hasWindowsNodeBridgeUrl() {
  return Boolean(normalizeWindowsNodeBridgeUrl())
}

export function hasWindowsNodeAdminToken() {
  return Boolean(cleanString(process.env.EMAIL_BRIDGE_ADMIN_TOKEN))
}

export function buildWindowsNodeOperator(user: AdminUser | null | undefined, request?: Request) {
  const requestIp = request ? getRequestIp(request) : ""
  const headerOperator = request?.headers.get("x-opsos-actor") || request?.headers.get("x-angelcare-operator") || ""
  if (headerOperator.trim()) {
    return headerOperator.trim().slice(0, 120)
  }

  const candidates = [
    user?.full_name,
    user?.name,
    user?.username,
    user?.email,
    user?.id,
  ]

  const base = candidates.map(cleanString).find(Boolean) || "operator"
  if (requestIp) {
    return `${base} @ ${requestIp}`.slice(0, 120)
  }
  return base.slice(0, 120)
}

export function isInfrastructureAdminUser(user: AdminUser | null | undefined) {
  if (!user) return false

  const role = cleanString(user.role).toLowerCase()
  const title = cleanString(user.title).toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions.map((item) => cleanString(item).toLowerCase()) : []

  if (INFRA_ADMIN_ROLES.has(role)) return true
  if (title.includes("founder")) return true
  if (title.includes("managing director")) return true
  if (title.includes("infrastructure")) return true
  if (title.includes("platform admin")) return true
  if (permissions.includes("*")) return true
  if (permissions.includes("admin.manage") || permissions.includes("admin.view")) return true

  return false
}

export async function requireInfrastructureAdmin() {
  const user = (await getCurrentUser().catch(() => null)) as AdminUser | null

  if (!isInfrastructureAdminUser(user)) {
    await recordWindowsNodeAudit({
      timestamp: new Date().toISOString(),
      actor: buildWindowsNodeOperator(user, undefined),
      action: "windows_node_control_access_blocked",
      target: "/opsos/infrastructure/windows-node",
      result: "blocked",
      reason: "Infrastructure admin access required",
      severity: "high",
      metadataSummary: user ? `role=${cleanString(user.role) || "unknown"} title=${cleanString(user.title) || "unknown"}` : "unauthenticated",
    }).catch(() => null)
    redirect("/unauthorized")
  }

  await recordWindowsNodeAudit({
    timestamp: new Date().toISOString(),
    actor: buildWindowsNodeOperator(user, undefined),
    action: "windows_node_control_page_viewed",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: "Authorized infrastructure admin visited the control center",
    severity: "low",
    metadataSummary: `role=${cleanString(user?.role) || "unknown"} email=${maskEmail(user?.email) || "unknown"}`,
  }).catch(() => null)

  return user
}

export async function authorizeInfrastructureAdminRequest(request: Request) {
  const user = (await getCurrentUser().catch(() => null)) as AdminUser | null

  if (!isInfrastructureAdminUser(user)) {
    await recordWindowsNodeAudit({
      timestamp: new Date().toISOString(),
      actor: buildWindowsNodeOperator(user, request),
      action: "windows_node_control_access_blocked",
      target: new URL(request.url).pathname,
      result: "blocked",
      reason: "Infrastructure admin access required",
      severity: "high",
      metadataSummary: user ? `role=${cleanString(user.role) || "unknown"} title=${cleanString(user.title) || "unknown"}` : "unauthenticated",
    }).catch(() => null)

    return {
      ok: false as const,
      response: buildWindowsNodeApiErrorResponse({
        status: user ? 403 : 401,
        errorName: user ? "Forbidden" : "Unauthorized",
        errorMessage: "Infrastructure admin access required",
        causeCode: user ? "INFRA_ADMIN_FORBIDDEN" : "INFRA_ADMIN_UNAUTHENTICATED",
        recommendedAction: "Sign in with an infrastructure admin account.",
      }),
    }
  }

  return {
    ok: true as const,
    user,
    operator: buildWindowsNodeOperator(user, request),
  }
}

export function normalizeWindowsNodeLogType(input: string | null | undefined): WindowsNodeLogType {
  const value = cleanString(input).toLowerCase()
  return ALLOWED_LOG_TYPES.has(value as WindowsNodeLogType) ? (value as WindowsNodeLogType) : "bridge"
}

export function normalizeLines(input: string | null | undefined, fallback = 100) {
  const value = Number(input ?? fallback)
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(300, Math.floor(value)))
}

export function normalizeMaintenanceState(input: unknown): MaintenanceModeState {
  const state = typeof input === "object" && input ? (input as Record<string, unknown>) : {}
  return {
    enabled: Boolean(state.enabled),
    reason: cleanString(state.reason),
    expectedDuration: cleanString(state.expectedDuration || state.expected_duration),
    startedAt: cleanString(state.startedAt || state.started_at),
    startedBy: cleanString(state.startedBy || state.started_by),
    message: cleanString(state.message),
  }
}

export function buildWindowsNodeAuditEvent(input: Partial<WindowsAuditEvent> & { actor?: string; action?: string; target?: string; result?: string; reason?: string; severity?: string; metadataSummary?: string }) {
  return {
    timestamp: cleanString(input.timestamp) || new Date().toISOString(),
    actor: cleanString(input.actor) || "operator",
    action: cleanString(input.action) || "unknown",
    target: cleanString(input.target) || "/opsos/infrastructure/windows-node",
    result: cleanString(input.result) || "unknown",
    reason: cleanString(input.reason),
    severity: (["info", "low", "medium", "high", "critical"].includes(cleanString(input.severity)) ? cleanString(input.severity) : "info") as WindowsNodeAuditSeverity,
    metadataSummary: cleanString(input.metadataSummary),
  } satisfies WindowsAuditEvent
}

export function buildWindowsNodeApiErrorResponse({
  status,
  errorName,
  errorMessage,
  causeCode,
  causeDetail,
  bridgeUrlHost = getWindowsNodeBridgeHost(),
  endpointPath = "",
  recommendedAction = "Verify the bridge URL, admin token, and Windows bridge service.",
}: {
  status: number
  errorName: string
  errorMessage: string
  causeCode?: string
  causeDetail?: string
  bridgeUrlHost?: string
  endpointPath?: string
  recommendedAction?: string
}) {
  const hasBridgeUrl = hasWindowsNodeBridgeUrl()
  const hasAdminToken = hasWindowsNodeAdminToken()
  return {
    ok: false as const,
    error: errorMessage,
    errorName,
    errorMessage,
    cause: causeCode || causeDetail ? { code: causeCode, detail: causeDetail } : undefined,
    bridgeUrlHost,
    endpointPath,
    hasBridgeUrl,
    hasAdminToken,
    recommendedAction,
  }
}

export function maskTokenLikeStrings(value: string) {
  return value
    .replace(/([A-Fa-f0-9]{24,})/g, "***REDACTED***")
    .replace(/(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2})/g, "***REDACTED***")
    .replace(/([?&](?:token|secret|password|pass|key)=)[^&\s]+/gi, "$1***REDACTED***")
    .replace(/\b([A-Za-z0-9_\-]{32,})\b/g, "***REDACTED***")
}

export async function callWindowsBridgeAdmin<T>(
  endpointPath: string,
  options: RequestInit = {},
  context?: { operator?: string; requestIp?: string }
): Promise<BridgeProxyResult<T>> {
  const bridgeUrl = normalizeWindowsNodeBridgeUrl()
  const hasBridgeUrl = Boolean(bridgeUrl)
  const hasAdminToken = hasWindowsNodeAdminToken()
  const adminToken = cleanString(process.env.EMAIL_BRIDGE_ADMIN_TOKEN)

  if (!hasBridgeUrl) {
    return {
      ...buildWindowsNodeApiErrorResponse({
        status: 500,
        errorName: "BridgeUrlMissing",
        errorMessage: "EMAIL_OS_BRIDGE_URL is not configured",
        causeCode: "BRIDGE_URL_MISSING",
        endpointPath,
      }),
      status: 500,
    }
  }

  if (!hasAdminToken) {
    return {
      ...buildWindowsNodeApiErrorResponse({
        status: 500,
        errorName: "AdminTokenMissing",
        errorMessage: "EMAIL_BRIDGE_ADMIN_TOKEN is not configured",
        causeCode: "ADMIN_TOKEN_MISSING",
        endpointPath,
      }),
      status: 500,
    }
  }

  const headers = new Headers(options.headers || {})
  headers.set("x-email-bridge-admin-token", adminToken)
  if (context?.operator) {
    headers.set("x-angelcare-operator", context.operator)
  }
  if (context?.requestIp) {
    headers.set("x-forwarded-for", context.requestIp)
  }

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  let response: Response
  try {
    response = await fetch(`${bridgeUrl}${endpointPath}`, {
      ...options,
      headers,
      cache: "no-store",
    })
  } catch (error) {
    return {
      ...buildWindowsNodeApiErrorResponse({
        status: 502,
        errorName: "BridgeUnavailable",
        errorMessage: error instanceof Error ? error.message : "Bridge request failed",
        causeCode: "BRIDGE_FETCH_FAILED",
        causeDetail: error instanceof Error ? error.name : "network_error",
        endpointPath,
      }),
      status: 502,
    }
  }

  const responseText = await response.text().catch(() => "")
  const bodyPreview = maskTokenLikeStrings(responseText.slice(0, 400))

  let json: Record<string, unknown> | null = null
  if (responseText.trim()) {
    try {
      json = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      json = null
    }
  }

  if (!response.ok || json?.ok === false) {
    const errorName = cleanString((json?.errorName as string) || (json?.cause as Record<string, unknown> | undefined)?.code || `HTTP_${response.status}`)
    const errorMessage = cleanString((json?.errorMessage as string) || (json?.error as string) || `Bridge request failed with HTTP ${response.status}`)
    return {
      ...buildWindowsNodeApiErrorResponse({
        status: response.status,
        errorName,
        errorMessage,
        causeCode: cleanString((json?.cause as Record<string, unknown> | undefined)?.code || `HTTP_${response.status}`),
        causeDetail: cleanString((json?.cause as Record<string, unknown> | undefined)?.detail || ""),
        endpointPath,
      }),
      status: response.status,
      responseStatus: response.status,
      responseBodyPreview: bodyPreview,
    }
  }

  const data = (json?.data ?? json ?? {}) as T
  return {
    ok: true,
    data,
  }
}

export async function recordWindowsNodeAudit(event: WindowsAuditEvent) {
  const payload = buildWindowsNodeAuditEvent(event)
  const result = await callWindowsBridgeAdmin<{ ok: true }>("/admin/audit/event", {
    method: "POST",
    body: JSON.stringify({ event: payload }),
  }, {
    operator: payload.actor,
  })

  return result.ok
}

export function buildWindowsNodeApiErrorFromBridgeResult(
  result: BridgeProxyResult<unknown>,
  endpointPath: string,
  fallbackAction: string,
) {
  if (result.ok) {
    return null
  }

  return buildWindowsNodeApiErrorResponse({
    status: result.status,
    errorName: result.errorName,
    errorMessage: result.errorMessage,
    causeCode: result.cause?.code || fallbackAction,
    causeDetail: result.cause?.detail || result.responseBodyPreview || "",
    endpointPath,
    recommendedAction: result.recommendedAction || "Verify the bridge token and Windows service health.",
  })
}

export function buildServiceHealth(status: string | undefined, fallback: WindowsNodeHealthStatus = "unknown"): WindowsNodeHealthStatus {
  const normalized = cleanString(status).toLowerCase()
  if (normalized === "running" || normalized === "healthy" || normalized === "ok") return "healthy"
  if (normalized === "degraded" || normalized === "warning" || normalized === "partial") return "degraded"
  if (normalized === "failed" || normalized === "stopped" || normalized === "error" || normalized === "down" || normalized === "offline") return "critical"
  return fallback
}
