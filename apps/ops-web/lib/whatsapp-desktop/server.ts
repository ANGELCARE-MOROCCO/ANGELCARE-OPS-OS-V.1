import crypto from "node:crypto"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  JsonRecord,
  WhatsAppAuthorizationResult,
  WhatsAppDesktopPolicy,
  WhatsAppRemoteCommand,
} from "@/lib/whatsapp-desktop/types"

type Row = Record<string, any>

export const REMOTE_COMMANDS = new Set<WhatsAppRemoteCommand>([
  "HIDE_WHATSAPP_VIEW",
  "SHOW_ACCESS_REVOKED_NOTICE",
  "RELOAD_WHATSAPP_VIEW",
  "RESTART_WHATSAPP_RENDERER",
  "CLEAR_WHATSAPP_CACHE",
  "CLEAR_WHATSAPP_SESSION",
  "REFRESH_AUTHORIZATION",
  "LOG_OUT_ANGELCARE_DESKTOP",
])

const SUPER_ROLES = new Set(["ceo", "owner", "super_admin", "admin"])
const DEFAULT_POLICY: Omit<WhatsAppDesktopPolicy, "workspace_id"> = {
  lease_duration_minutes: 15,
  offline_grace_minutes: 15,
  heartbeat_active_seconds: 45,
  heartbeat_background_seconds: 180,
  maximum_users: 20,
  maximum_devices_per_user: 2,
  require_new_device_approval: true,
  clear_session_on_revocation: false,
  allow_downloads: true,
  allow_uploads: true,
  allow_microphone: true,
  allow_camera: true,
  allow_notifications: true,
  allow_external_open: true,
  allow_local_cache_clear: true,
  allow_local_session_clear: true,
  minimum_desktop_version: "1.2.0",
  blocked_versions: [],
  policy_json: {},
}

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max)
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item, 160)).filter(Boolean)
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map((item) => clean(item, 160)).filter(Boolean)
    } catch {}
    return value.split(",").map((item) => clean(item, 160)).filter(Boolean)
  }
  return []
}

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function normalizeRole(value: unknown) {
  return clean(value, 80).toLowerCase()
}

function userPermissions(user: Row | null) {
  if (!user) return []
  return asArray(user.permissions || user.permission_codes || user.access_permissions)
}

export function isGovernanceAdmin(user: Row | null, permission?: string) {
  if (!user) return false
  if (SUPER_ROLES.has(normalizeRole(user.role))) return true
  if (!permission) return false
  const permissions = userPermissions(user)
  return permissions.includes(permission) || permissions.includes("whatsapp_desktop.*")
}

export function hasGovernancePermission(user: Row | null, permission: string) {
  return isGovernanceAdmin(user, permission)
}

async function supabaseForGovernance() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (url && serviceKey) {
    return createSupabaseAdminClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as any
  }
  return (await createSupabaseServerClient()) as any
}

function requestIp(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || ""
  return clean(raw.split(",")[0], 80) || null
}

export async function governanceContext(request: NextRequest, options: { adminPermission?: string } = {}) {
  const user = (await getCurrentAppUser().catch(() => null)) as Row | null
  if (!user) {
    return { error: NextResponse.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 }) }
  }
  if (options.adminPermission && !hasGovernancePermission(user, options.adminPermission)) {
    return { error: NextResponse.json({ ok: false, error: "GOVERNANCE_PERMISSION_DENIED" }, { status: 403 }) }
  }
  return {
    user,
    userId: clean(user.id, 80),
    supabase: await supabaseForGovernance(),
    ip: requestIp(request),
    userAgent: clean(request.headers.get("user-agent"), 500) || null,
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function fail(error: unknown, status = 400, extra: JsonRecord = {}) {
  return NextResponse.json({ ok: false, error: clean(error, 1000) || "UNKNOWN_ERROR", ...extra }, { status })
}

export async function parseBody(request: NextRequest): Promise<Row> {
  try {
    const value = await request.json()
    return value && typeof value === "object" && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

export async function auditEvent(
  supabase: any,
  input: {
    actorUserId?: string | null
    targetUserId?: string | null
    deviceId?: string | null
    workspaceId?: string | null
    action: string
    reason?: string | null
    previousState?: unknown
    newState?: unknown
    commandId?: string | null
    ip?: string | null
    userAgent?: string | null
  },
) {
  await supabase.from("whatsapp_desktop_audit_events").insert({
    actor_user_id: input.actorUserId || null,
    target_user_id: input.targetUserId || null,
    device_id: input.deviceId || null,
    workspace_id: input.workspaceId || null,
    action: clean(input.action, 160),
    reason: clean(input.reason, 1000) || null,
    previous_state: input.previousState ?? null,
    new_state: input.newState ?? null,
    command_id: input.commandId || null,
    request_ip: input.ip || null,
    user_agent: input.userAgent || null,
  })
}

export async function accessEvent(
  supabase: any,
  input: {
    eventType: string
    userId?: string | null
    deviceId?: string | null
    workspaceId?: string | null
    assignmentId?: string | null
    outcome?: string
    reason?: string | null
    metadata?: unknown
    ip?: string | null
    userAgent?: string | null
  },
) {
  await supabase.from("whatsapp_desktop_access_events").insert({
    event_type: clean(input.eventType, 160),
    user_id: input.userId || null,
    device_id: input.deviceId || null,
    workspace_id: input.workspaceId || null,
    assignment_id: input.assignmentId || null,
    outcome: clean(input.outcome || "recorded", 80),
    reason: clean(input.reason, 1000) || null,
    metadata: input.metadata || {},
    request_ip: input.ip || null,
    user_agent: input.userAgent || null,
  })
}

export async function securityEvent(
  supabase: any,
  input: {
    severity?: "informational" | "attention" | "high" | "critical"
    eventType: string
    userId?: string | null
    deviceId?: string | null
    workspaceId?: string | null
    title: string
    description?: string | null
    metadata?: unknown
  },
) {
  await supabase.from("whatsapp_desktop_security_events").insert({
    severity: input.severity || "informational",
    event_type: clean(input.eventType, 160),
    user_id: input.userId || null,
    device_id: input.deviceId || null,
    workspace_id: input.workspaceId || null,
    title: clean(input.title, 240),
    description: clean(input.description, 2000) || null,
    metadata: input.metadata || {},
  })
}

function policyFor(workspaceId: string, row?: Row | null): WhatsAppDesktopPolicy {
  return {
    workspace_id: workspaceId,
    ...DEFAULT_POLICY,
    ...(row || {}),
    blocked_versions: asArray(row?.blocked_versions),
    policy_json: asObject(row?.policy_json),
  }
}

function versionParts(version: string) {
  return clean(version, 80).replace(/^v/i, "").split(/[.-]/).slice(0, 3).map((item) => Number.parseInt(item, 10) || 0)
}

function compareVersions(left: string, right: string) {
  const a = versionParts(left)
  const b = versionParts(right)
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1
    if ((a[index] || 0) < (b[index] || 0)) return -1
  }
  return 0
}

function leaseSecret() {
  const explicit = process.env.WHATSAPP_DESKTOP_LEASE_SECRET
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (explicit) return explicit
  if (fallback) return crypto.createHash("sha256").update(`whatsapp-desktop:${fallback}`).digest("hex")
  if (process.env.NODE_ENV !== "production") return "ANGELCARE_LOCAL_WHATSAPP_DESKTOP_LEASE_SECRET_CHANGE_ME"
  throw new Error("WHATSAPP_DESKTOP_LEASE_SECRET is required in production.")
}

function b64(value: Buffer | string) {
  return Buffer.from(value).toString("base64url")
}

function signLease(payload: Row) {
  const encoded = b64(JSON.stringify(payload))
  const signature = crypto.createHmac("sha256", leaseSecret()).update(encoded).digest("base64url")
  return `${encoded}.${signature}`
}

function tokenDigest(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function activeAssignment(row: Row | null) {
  if (!row || row.status !== "active") return false
  const now = Date.now()
  if (row.valid_from && new Date(row.valid_from).getTime() > now) return false
  if (row.valid_until && new Date(row.valid_until).getTime() <= now) return false
  return true
}

export async function loadAuthorizationInputs(supabase: any, userId: string, installationId: string, workspaceId: string) {
  const [{ data: workspace }, { data: assignment }, { data: device }, { data: policy }] = await Promise.all([
    supabase.from("whatsapp_desktop_workspaces").select("*").eq("id", workspaceId).maybeSingle(),
    supabase.from("whatsapp_desktop_assignments").select("*").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle(),
    supabase.from("whatsapp_desktop_devices").select("*").eq("installation_id", installationId).maybeSingle(),
    supabase.from("whatsapp_desktop_workspace_policies").select("*").eq("workspace_id", workspaceId).maybeSingle(),
  ])
  let deviceAccess = null
  if (device?.id) {
    const response = await supabase
      .from("whatsapp_desktop_device_workspace_access")
      .select("*")
      .eq("device_id", device.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    deviceAccess = response.data || null
  }
  return { workspace, assignment, device, deviceAccess, policy: policyFor(workspaceId, policy) }
}

export async function issueAuthorizationLease(
  supabase: any,
  input: { userId: string; installationId: string; workspaceId: string; desktopVersion: string },
): Promise<WhatsAppAuthorizationResult> {
  const values = await loadAuthorizationInputs(supabase, input.userId, input.installationId, input.workspaceId)
  const { workspace, assignment, device, deviceAccess, policy } = values
  let reason = "AUTHORIZED"
  if (!workspace || workspace.status !== "active") reason = "WORKSPACE_NOT_ACTIVE"
  else if (!activeAssignment(assignment)) reason = "ASSIGNMENT_NOT_ACTIVE"
  else if (!device) reason = "DEVICE_NOT_REGISTERED"
  else if (device.current_user_id && device.current_user_id !== input.userId) reason = "DEVICE_USER_MISMATCH"
  else if (device.approval_status !== "approved") reason = `DEVICE_${clean(device.approval_status, 60).toUpperCase()}`
  else if (!deviceAccess || deviceAccess.status !== "approved") reason = "DEVICE_WORKSPACE_NOT_APPROVED"
  else if (policy.blocked_versions.includes(input.desktopVersion)) reason = "DESKTOP_VERSION_BLOCKED"
  else if (compareVersions(input.desktopVersion, policy.minimum_desktop_version) < 0) reason = "DESKTOP_UPDATE_REQUIRED"

  if (reason !== "AUTHORIZED") {
    return { ok: true, authorized: false, reason, workspace, device, assignment, policy }
  }

  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + policy.lease_duration_minutes * 60_000)
  const graceExpiresAt = new Date(expiresAt.getTime() + policy.offline_grace_minutes * 60_000)
  const leaseId = crypto.randomUUID()
  const token = signLease({
    v: 1,
    leaseId,
    userId: input.userId,
    deviceId: device.id,
    installationId: input.installationId,
    workspaceId: input.workspaceId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    graceExpiresAt: graceExpiresAt.toISOString(),
  })

  await supabase
    .from("whatsapp_desktop_device_sessions")
    .update({ status: "expired" })
    .eq("device_id", device.id)
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId)
    .eq("status", "active")

  const { data: lease, error } = await supabase
    .from("whatsapp_desktop_device_sessions")
    .insert({
      id: leaseId,
      device_id: device.id,
      workspace_id: input.workspaceId,
      user_id: input.userId,
      status: "active",
      lease_token_digest: tokenDigest(token),
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      grace_expires_at: graceExpiresAt.toISOString(),
      last_renewed_at: issuedAt.toISOString(),
      client_version: input.desktopVersion,
    })
    .select("id,issued_at,expires_at,grace_expires_at")
    .single()
  if (error) throw error

  return {
    ok: true,
    authorized: true,
    reason,
    lease: { ...lease, token },
    workspace,
    device,
    assignment,
    policy,
  }
}

export async function revokeActiveLeases(supabase: any, input: { userId?: string; deviceId?: string; workspaceId?: string; actorId?: string; reason: string }) {
  let query = supabase.from("whatsapp_desktop_device_sessions").update({
    status: "revoked",
    revoked_at: new Date().toISOString(),
    revoked_by: input.actorId || null,
    revoke_reason: clean(input.reason, 1000),
  }).in("status", ["active", "grace"])
  if (input.userId) query = query.eq("user_id", input.userId)
  if (input.deviceId) query = query.eq("device_id", input.deviceId)
  if (input.workspaceId) query = query.eq("workspace_id", input.workspaceId)
  await query
}

export async function pendingCommands(supabase: any, deviceId: string) {
  const now = new Date().toISOString()
  await supabase.from("whatsapp_desktop_commands").update({ status: "expired" }).eq("device_id", deviceId).lt("expires_at", now).in("status", ["created", "delivered", "received"])
  const { data } = await supabase
    .from("whatsapp_desktop_commands")
    .select("id,workspace_id,command_type,payload,reason,status,issued_at,expires_at")
    .eq("device_id", deviceId)
    .in("status", ["created", "delivered"])
    .gt("expires_at", now)
    .order("issued_at", { ascending: true })
    .limit(50)
  const ids = (data || []).filter((row: Row) => row.status === "created").map((row: Row) => row.id)
  if (ids.length) await supabase.from("whatsapp_desktop_commands").update({ status: "delivered", delivered_at: now }).in("id", ids)
  return data || []
}

export function sanitizeWorkspaceInput(body: Row, current?: Row | null) {
  const security = clean(body.security_level || current?.security_level || "standard", 30)
  const status = clean(body.status || current?.status || "draft", 30)
  return {
    code: clean(body.code || current?.code, 80).toUpperCase().replace(/[^A-Z0-9_-]+/g, "_"),
    name: clean(body.name || current?.name, 180),
    description: clean(body.description ?? current?.description, 2000) || null,
    phone_number_e164: clean(body.phone_number_e164 ?? current?.phone_number_e164, 40) || null,
    department: clean(body.department ?? current?.department, 180) || null,
    owner_user_id: clean(body.owner_user_id || current?.owner_user_id, 80),
    status: ["draft", "active", "suspended", "retired"].includes(status) ? status : "draft",
    maximum_devices: Math.max(1, Math.min(20, Number(body.maximum_devices ?? current?.maximum_devices ?? 4))),
    security_level: ["standard", "sensitive", "executive"].includes(security) ? security : "standard",
  }
}

export function sanitizePolicyInput(workspaceId: string, body: Row, current?: Row | null): WhatsAppDesktopPolicy {
  const base = policyFor(workspaceId, current)
  const number = (key: keyof WhatsAppDesktopPolicy, min: number, max: number) => Math.max(min, Math.min(max, Number(body[key] ?? base[key])))
  const bool = (key: keyof WhatsAppDesktopPolicy) => Boolean(body[key] ?? base[key])
  return {
    ...base,
    workspace_id: workspaceId,
    lease_duration_minutes: number("lease_duration_minutes", 5, 240),
    offline_grace_minutes: number("offline_grace_minutes", 0, 1440),
    heartbeat_active_seconds: number("heartbeat_active_seconds", 15, 300),
    heartbeat_background_seconds: number("heartbeat_background_seconds", 30, 1800),
    maximum_users: number("maximum_users", 1, 500),
    maximum_devices_per_user: number("maximum_devices_per_user", 1, 20),
    require_new_device_approval: bool("require_new_device_approval"),
    clear_session_on_revocation: bool("clear_session_on_revocation"),
    allow_downloads: bool("allow_downloads"),
    allow_uploads: bool("allow_uploads"),
    allow_microphone: bool("allow_microphone"),
    allow_camera: bool("allow_camera"),
    allow_notifications: bool("allow_notifications"),
    allow_external_open: bool("allow_external_open"),
    allow_local_cache_clear: bool("allow_local_cache_clear"),
    allow_local_session_clear: bool("allow_local_session_clear"),
    minimum_desktop_version: clean(body.minimum_desktop_version ?? base.minimum_desktop_version, 80) || "1.2.0",
    blocked_versions: asArray(body.blocked_versions ?? base.blocked_versions),
    policy_json: asObject(body.policy_json ?? base.policy_json),
  }
}

export async function getUserDirectory(supabase: any) {
  const { data, error } = await supabase
    .from("app_users")
    .select("id,full_name,username,email,role,status,department,job_title,created_at")
    .order("created_at", { ascending: false })
    .limit(1000)
  if (error) throw new Error(`Unable to load ANGELCARE user directory: ${error.message}`)
  return (data || []).map((user: Row) => ({
    ...user,
    display_name: clean(user.full_name || user.email || user.username || "Utilisateur ANGELCARE", 200),
  }))
}

export function publicDevice(row: Row) {
  if (!row) return row
  const { last_ip: _lastIp, ...rest } = row
  return rest
}
