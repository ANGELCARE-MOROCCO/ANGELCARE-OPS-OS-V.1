import { randomUUID } from "node:crypto"
import type { AmbassadorActor, AmbassadorPermission } from "./contracts"
import { AmbassadorServiceError } from "./errors"
import { getAmbassadorSupabaseAdmin } from "./supabase"

type ActorRoleRow = {
  id: string
  auth_user_id: string
  tenant_id: string
  organization_id: string
  role_key: string
  display_name: string | null
  status: string
}

type PermissionRow = { permission_key: string }

function parseCookies(request: Request): Map<string, string> {
  const result = new Map<string, string>()
  const raw = request.headers.get("cookie") || ""
  for (const item of raw.split(";")) {
    const index = item.indexOf("=")
    if (index < 0) continue
    const key = item.slice(0, index).trim()
    const value = item.slice(index + 1).trim()
    if (key) result.set(key, value)
  }
  return result
}

function decodeCookieValue(value: string): string {
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    decoded = value
  }
  if (decoded.startsWith("base64-")) {
    try {
      decoded = Buffer.from(decoded.slice(7), "base64").toString("utf8")
    } catch {
      return decoded
    }
  }
  return decoded
}

function tokenFromStructuredCookie(value: string): string | null {
  const decoded = decodeCookieValue(value)
  try {
    const parsed = JSON.parse(decoded) as unknown
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0]
    if (parsed && typeof parsed === "object") {
      const token = (parsed as Record<string, unknown>).access_token
      if (typeof token === "string") return token
    }
  } catch {
    if (decoded.split(".").length === 3) return decoded
  }
  return null
}

function extractAccessToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim()
    if (token) return token
  }

  const cookies = parseCookies(request)
  for (const key of ["sb-access-token", "supabase-access-token", "supabase-auth-token"]) {
    const value = cookies.get(key)
    if (value) {
      const token = tokenFromStructuredCookie(value)
      if (token) return token
    }
  }

  const grouped = new Map<string, Array<[number, string]>>()
  for (const [key, value] of cookies) {
    const match = key.match(/^(sb-[^-]+-auth-token)(?:\.(\d+))?$/)
    if (!match) continue
    const base = match[1]
    const part = Number(match[2] || 0)
    if (!grouped.has(base)) grouped.set(base, [])
    grouped.get(base)?.push([part, value])
  }
  for (const parts of grouped.values()) {
    const joined = parts.sort((a, b) => a[0] - b[0]).map((item) => item[1]).join("")
    const token = tokenFromStructuredCookie(joined)
    if (token) return token
  }
  return null
}

function selectedScope(request: Request, memberships: ActorRoleRow[]): ActorRoleRow {
  const requestedTenant = request.headers.get("x-angelcare-tenant-id")?.trim()
  const requestedOrganization = request.headers.get("x-angelcare-organization-id")?.trim()
  const matches = memberships.filter((row) =>
    (!requestedTenant || row.tenant_id === requestedTenant) &&
    (!requestedOrganization || row.organization_id === requestedOrganization),
  )
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) {
    throw new AmbassadorServiceError("SCOPE_REQUIRED", "No active Ambassador scope is assigned to this user", 403)
  }
  throw new AmbassadorServiceError(
    "SCOPE_REQUIRED",
    "Multiple Ambassador scopes are available; send x-angelcare-tenant-id and x-angelcare-organization-id",
    409,
  )
}

function requestIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null
}

export async function resolveAmbassadorActor(request: Request): Promise<AmbassadorActor> {
  const token = extractAccessToken(request)
  if (!token) throw new AmbassadorServiceError("AUTH_REQUIRED", "Authentication is required", 401)

  const supabase = getAmbassadorSupabaseAdmin()
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) throw new AmbassadorServiceError("AUTH_INVALID", "Authentication token is invalid or expired", 401)

  const { data: membershipData, error: membershipError } = await supabase
    .from("market_os_ambassador_actor_roles")
    .select("id,auth_user_id,tenant_id,organization_id,role_key,display_name,status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")

  if (membershipError) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to resolve Ambassador actor scope: ${membershipError.message}`, 503)
  }
  const membership = selectedScope(request, (membershipData || []) as ActorRoleRow[])

  const { data: permissionData, error: permissionError } = await supabase
    .from("market_os_ambassador_role_permissions")
    .select("permission_key")
    .eq("role_key", membership.role_key)
    .eq("enabled", true)

  if (permissionError) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to resolve Ambassador permissions: ${permissionError.message}`, 503)
  }

  const permissions = new Set<string>((permissionData || []).map((row: PermissionRow) => String(row.permission_key || "")).filter(Boolean))
  return {
    actorId: membership.id,
    authUserId: user.id,
    displayName: membership.display_name || String(user.user_metadata?.full_name || user.email || user.id),
    email: user.email || null,
    roleKey: membership.role_key,
    tenantId: membership.tenant_id,
    organizationId: membership.organization_id,
    permissions,
    requestId: request.headers.get("x-request-id") || randomUUID(),
    ipAddress: requestIp(request),
    userAgent: request.headers.get("user-agent"),
  }
}

export function actorCan(actor: AmbassadorActor, permission: AmbassadorPermission): boolean {
  return actor.permissions.has("*") || actor.permissions.has(permission)
}

export function requireAmbassadorPermission(actor: AmbassadorActor, permission: AmbassadorPermission): void {
  if (!actorCan(actor, permission)) {
    throw new AmbassadorServiceError("FORBIDDEN", `Missing Ambassador permission: ${permission}`, 403)
  }
}
