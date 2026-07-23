import { randomUUID } from "node:crypto"
import type {
  AmbassadorActor,
  AmbassadorAuthenticationSource,
  AmbassadorPermission,
} from "./contracts"
import { AmbassadorServiceError } from "./errors"
import { getAmbassadorSupabaseAdmin } from "./supabase"

const OPS_SESSION_COOKIE = "angelcare_ops_session"

type ActorRoleRow = {
  id: string
  auth_user_id: string | null
  app_user_id: string | null
  tenant_id: string
  organization_id: string
  role_key: string
  display_name: string | null
  status: string
}

type PermissionRow = { permission_key: string }
type SupabaseCredential = { token: string; explicit: boolean }
type UnknownRow = Record<string, unknown>

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

function extractSupabaseCredential(request: Request, cookies: Map<string, string>): SupabaseCredential | null {
  const authorization = request.headers.get("authorization")
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim()
    if (token) return { token, explicit: true }
  }

  for (const key of ["sb-access-token", "supabase-access-token", "supabase-auth-token"]) {
    const value = cookies.get(key)
    if (value) {
      const token = tokenFromStructuredCookie(value)
      if (token) return { token, explicit: false }
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
    if (token) return { token, explicit: false }
  }
  return null
}

function extractOpsSessionToken(cookies: Map<string, string>): string | null {
  const value = cookies.get(OPS_SESSION_COOKIE)
  if (!value) return null
  const token = decodeCookieValue(value).trim()
  return token || null
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

function stringField(row: UnknownRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function isSessionRevoked(session: UnknownRow): boolean {
  if (stringField(session, ["revoked_at", "invalidated_at", "deleted_at"])) return true
  const status = stringField(session, ["status", "state"])?.toLowerCase()
  return status ? ["revoked", "invalid", "invalidated", "disabled", "expired", "terminated"].includes(status) : false
}

function sessionExpired(session: UnknownRow): boolean {
  const expiresAt = stringField(session, ["expires_at"])
  if (!expiresAt) return true
  const timestamp = Date.parse(expiresAt)
  return !Number.isFinite(timestamp) || timestamp <= Date.now()
}

function configurationFailure(message: string): never {
  throw new AmbassadorServiceError("CONFIGURATION_ERROR", message, 503)
}

async function resolveMemberships(
  request: Request,
  identityColumn: "auth_user_id" | "app_user_id",
  identityValue: string,
): Promise<ActorRoleRow> {
  const supabase = getAmbassadorSupabaseAdmin()
  const { data, error } = await supabase
    .from("market_os_ambassador_actor_roles")
    .select("id,auth_user_id,app_user_id,tenant_id,organization_id,role_key,display_name,status")
    .eq(identityColumn, identityValue)
    .eq("status", "active")

  if (error) {
    const lower = String(error.message || "").toLowerCase()
    if (identityColumn === "app_user_id" && lower.includes("app_user_id")) {
      configurationFailure("Ambassador OpsOS session bridge migration is missing; apply the session bridge migration")
    }
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to resolve Ambassador actor scope: ${error.message}`, 503)
  }
  return selectedScope(request, (data || []) as ActorRoleRow[])
}

async function resolvePermissions(roleKey: string): Promise<ReadonlySet<string>> {
  const { data, error } = await getAmbassadorSupabaseAdmin()
    .from("market_os_ambassador_role_permissions")
    .select("permission_key")
    .eq("role_key", roleKey)
    .eq("enabled", true)

  if (error) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to resolve Ambassador permissions: ${error.message}`, 503)
  }
  return new Set<string>((data || []).map((row: PermissionRow) => String(row.permission_key || "")).filter(Boolean))
}

function actorResult(
  request: Request,
  membership: ActorRoleRow,
  identity: {
    authenticationSource: AmbassadorAuthenticationSource
    authUserId: string | null
    appUserId: string | null
    displayName: string
    email: string | null
  },
  permissions: ReadonlySet<string>,
): AmbassadorActor {
  return {
    actorId: membership.id,
    authUserId: identity.authUserId,
    appUserId: identity.appUserId,
    authenticationSource: identity.authenticationSource,
    displayName: membership.display_name || identity.displayName,
    email: identity.email,
    roleKey: membership.role_key,
    tenantId: membership.tenant_id,
    organizationId: membership.organization_id,
    permissions,
    requestId: request.headers.get("x-request-id") || randomUUID(),
    ipAddress: requestIp(request),
    userAgent: request.headers.get("user-agent"),
  }
}

async function resolveSupabaseActor(request: Request, token: string): Promise<AmbassadorActor> {
  const supabase = getAmbassadorSupabaseAdmin()
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) {
    throw new AmbassadorServiceError("AUTH_INVALID", "Authentication token is invalid or expired", 401)
  }

  const membership = await resolveMemberships(request, "auth_user_id", user.id)
  const permissions = await resolvePermissions(membership.role_key)
  return actorResult(request, membership, {
    authenticationSource: "supabase_auth",
    authUserId: user.id,
    appUserId: null,
    displayName: String(user.user_metadata?.full_name || user.email || user.id),
    email: user.email || null,
  }, permissions)
}

async function resolveOpsSessionActor(request: Request, sessionToken: string): Promise<AmbassadorActor> {
  const supabase = getAmbassadorSupabaseAdmin()
  const { data: rawSession, error: sessionError } = await supabase
    .from("app_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .maybeSingle()

  if (sessionError) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to validate OpsOS session: ${sessionError.message}`, 503)
  }
  const session = (rawSession || null) as UnknownRow | null
  if (!session || isSessionRevoked(session)) {
    throw new AmbassadorServiceError("AUTH_INVALID", "OpsOS session is invalid or revoked", 401)
  }
  if (sessionExpired(session)) {
    await supabase.from("app_sessions").delete().eq("session_token", sessionToken).then(() => undefined, () => undefined)
    throw new AmbassadorServiceError("AUTH_INVALID", "OpsOS session is expired", 401)
  }

  const appUserId = stringField(session, ["user_id"])
  if (!appUserId) {
    throw new AmbassadorServiceError("AUTH_INVALID", "OpsOS session has no user identity", 401)
  }

  const { data: rawUser, error: userError } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", appUserId)
    .maybeSingle()

  if (userError) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", `Unable to validate OpsOS user: ${userError.message}`, 503)
  }
  const user = (rawUser || null) as UnknownRow | null
  if (!user || stringField(user, ["status"])?.toLowerCase() !== "active") {
    throw new AmbassadorServiceError("AUTH_INVALID", "OpsOS user is missing or inactive", 401)
  }

  const membership = await resolveMemberships(request, "app_user_id", appUserId)
  const permissions = await resolvePermissions(membership.role_key)
  return actorResult(request, membership, {
    authenticationSource: "ops_session",
    authUserId: null,
    appUserId,
    displayName: stringField(user, ["full_name", "display_name", "name", "username", "email"]) || appUserId,
    email: stringField(user, ["email"]),
  }, permissions)
}

export async function resolveAmbassadorActor(request: Request): Promise<AmbassadorActor> {
  const cookies = parseCookies(request)
  const supabaseCredential = extractSupabaseCredential(request, cookies)
  const opsSessionToken = extractOpsSessionToken(cookies)

  if (supabaseCredential) {
    try {
      return await resolveSupabaseActor(request, supabaseCredential.token)
    } catch (error) {
      if (
        !supabaseCredential.explicit &&
        opsSessionToken &&
        error instanceof AmbassadorServiceError &&
        error.code === "AUTH_INVALID"
      ) {
        return resolveOpsSessionActor(request, opsSessionToken)
      }
      throw error
    }
  }

  if (opsSessionToken) return resolveOpsSessionActor(request, opsSessionToken)
  throw new AmbassadorServiceError("AUTH_REQUIRED", "Authentication is required", 401)
}

export function actorCan(actor: AmbassadorActor, permission: AmbassadorPermission): boolean {
  return actor.permissions.has("*") || actor.permissions.has(permission)
}

export function requireAmbassadorPermission(actor: AmbassadorActor, permission: AmbassadorPermission): void {
  if (!actorCan(actor, permission)) {
    throw new AmbassadorServiceError("FORBIDDEN", `Missing Ambassador permission: ${permission}`, 403)
  }
}
