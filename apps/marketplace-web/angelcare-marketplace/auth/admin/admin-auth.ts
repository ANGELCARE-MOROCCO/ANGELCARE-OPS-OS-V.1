import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSessionToken, verifyPassword } from '@/lib/auth/session'
import { ROLE_PERMISSION_FALLBACK, SOURCE_ROLE_TO_MARKETPLACE_ROLE } from '@/angelcare-marketplace/domain/constants'
import { getMarketplaceAccessPolicy, marketplacePolicyAllowsSession } from '@/lib/auth/marketplace-access-policy'

const ADMIN_PERMISSION = 'marketplace.admin.access'
const LOGIN_FAILURE_ACTION = 'marketplace.admin.login.failed'
const LOGIN_SUCCESS_ACTION = 'marketplace.admin.login.success'
const FAILURE_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_PER_WINDOW = 5
const DEFAULT_SESSION_HOURS = 12
const MAX_SESSION_HOURS = 168

type Row = Record<string, unknown>

type AdminLoginResult =
  | {
      ok: true
      sessionToken: string
      expiresAt: string
      returnTo: string
      userId: string
      displayName: string
    }
  | {
      ok: false
      status: number
      code: 'INVALID_CREDENTIALS' | 'ACCESS_DENIED' | 'RATE_LIMITED' | 'ACCOUNT_UNAVAILABLE' | 'MFA_REQUIRED'
      message: string
    }

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizedIdentifier(value: unknown): string {
  return text(value).toLowerCase().slice(0, 320)
}

function auditTarget(identifier: string): string {
  return crypto.createHash('sha256').update(identifier).digest('hex')
}

function safeReturnTo(value: unknown): string {
  const candidate = text(value)
  if (!candidate.startsWith('/angelcare-marketplace/admin')) return '/angelcare-marketplace/admin'
  if (candidate.startsWith('//') || candidate.includes('://')) return '/angelcare-marketplace/admin'
  return candidate
}

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || null
}

function requestHost(request: Request): string {
  return request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
}

export function assertAdminLoginSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const originUrl = new URL(origin)
    const host = requestHost(request).split(',')[0]?.trim().toLowerCase()
    return Boolean(host && originUrl.host.toLowerCase() === host)
  } catch {
    return false
  }
}

async function writeLoginAudit(input: {
  action: string
  actorUserId?: string | null
  targetId: string
  result: 'success' | 'failed' | 'denied' | 'rate_limited'
  reason: string
  request: Request
}) {
  try {
    const db = await createServiceClient()
    const ip = requestIp(input.request)
    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null
    await db.from('app_audit_logs').insert({
      actor_user_id: input.actorUserId || null,
      action: input.action,
      target_table: 'app_users',
      target_id: input.targetId,
      details: {
        channel: 'angelcare-marketplace-admin',
        result: input.result,
        reason: input.reason,
        ip_hash: ipHash,
        user_agent: input.request.headers.get('user-agent')?.slice(0, 500) || null,
      },
    })
  } catch {
    // Authentication decisions never depend on audit availability.
  }
}

async function tooManyRecentFailures(identifierHash: string): Promise<boolean> {
  try {
    const db = await createServiceClient()
    const since = new Date(Date.now() - FAILURE_WINDOW_MS).toISOString()
    const { count, error } = await db
      .from('app_audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', LOGIN_FAILURE_ACTION)
      .eq('target_id', identifierHash)
      .gte('created_at', since)
    if (error) return false
    return Number(count || 0) >= MAX_FAILURES_PER_WINDOW
  } catch {
    return false
  }
}

async function userHasAdminAccess(db: Awaited<ReturnType<typeof createServiceClient>>, user: Row): Promise<boolean> {
  const userId = text(user.id)
  if (!userId) return false

  try {
    const { data: assignments, error: assignmentError } = await db
      .from('angelcare_marketplace_user_role_assignments')
      .select('role_key,active')
      .eq('app_user_id', userId)
      .eq('active', true)

    if (!assignmentError && assignments?.length) {
      const roleKeys = [...new Set(assignments.map((row: Row) => text(row.role_key)).filter(Boolean))]
      if (roleKeys.length) {
        const { data: permissions, error: permissionError } = await db
          .from('angelcare_marketplace_role_permissions')
          .select('permission_key,role_key')
          .in('role_key', roleKeys)
        if (!permissionError) {
          return Boolean((permissions || []).some((row: Row) => text(row.permission_key) === ADMIN_PERMISSION))
        }
      }
    }
  } catch {
    // Fall back to the canonical source-role mapping below.
  }

  const sourceRole = text(user.role).toLowerCase()
  const roleKey = SOURCE_ROLE_TO_MARKETPLACE_ROLE[sourceRole] || 'marketplace_viewer'
  return (ROLE_PERMISSION_FALLBACK[roleKey] || []).includes(ADMIN_PERMISSION)
}

async function sessionPolicy(db: Awaited<ReturnType<typeof createServiceClient>>, userId: string): Promise<
  | { ok: true; durationHours: number }
  | { ok: false; code: 'ACCOUNT_UNAVAILABLE' | 'MFA_REQUIRED'; message: string }
> {
  const policy = await getMarketplaceAccessPolicy(db, userId)
  const availability = marketplacePolicyAllowsSession(policy)
  if (!availability.ok) {
    return { ok: false, code: 'ACCOUNT_UNAVAILABLE', message: 'Cet accès administrateur Marketplace est indisponible.' }
  }
  // MFA is fail-closed only when the Marketplace policy explicitly requires it.
  // Enrollment/challenge is completed by the dedicated Marketplace MFA authority in Ultra MZ2.
  if (policy.requireMfa) {
    return { ok: false, code: 'MFA_REQUIRED', message: 'Une validation MFA Marketplace est requise avant cet accès.' }
  }
  return { ok: true, durationHours: policy.sessionDurationHours }
}

export async function authenticateMarketplaceAdmin(input: {
  identifier: unknown
  password: unknown
  returnTo?: unknown
  request: Request
}): Promise<AdminLoginResult> {
  const identifier = normalizedIdentifier(input.identifier)
  const password = typeof input.password === 'string' ? input.password : ''
  const identifierHash = auditTarget(identifier || 'missing')
  const returnTo = safeReturnTo(input.returnTo)

  if (!identifier || !password || password.length > 512) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, targetId: identifierHash, result: 'failed', reason: 'invalid_input', request: input.request })
    return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Identifiants administrateur invalides.' }
  }

  if (await tooManyRecentFailures(identifierHash)) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, targetId: identifierHash, result: 'rate_limited', reason: 'too_many_attempts', request: input.request })
    return { ok: false, status: 429, code: 'RATE_LIMITED', message: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const db = await createServiceClient()
  const lookupColumn = identifier.includes('@') ? 'email' : 'username'
  const { data: user, error } = await db
    .from('app_users')
    .select('id,email,username,full_name,role,status,password_hash')
    .ilike(lookupColumn, identifier)
    .limit(1)
    .maybeSingle()

  if (error || !user || text(user.status).toLowerCase() !== 'active' || !text(user.password_hash)) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, targetId: identifierHash, result: 'failed', reason: 'identity_not_available', request: input.request })
    return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Identifiants administrateur invalides.' }
  }

  const passwordValid = await verifyPassword(password, text(user.password_hash)).catch(() => false)
  if (!passwordValid) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, actorUserId: text(user.id), targetId: identifierHash, result: 'failed', reason: 'password_mismatch', request: input.request })
    return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Identifiants administrateur invalides.' }
  }

  const adminAllowed = await userHasAdminAccess(db, user as Row)
  if (!adminAllowed) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, actorUserId: text(user.id), targetId: identifierHash, result: 'denied', reason: 'marketplace_admin_permission_missing', request: input.request })
    return { ok: false, status: 403, code: 'ACCESS_DENIED', message: 'Ce compte ne dispose pas de l’autorité Marketplace Admin.' }
  }

  const policy = await sessionPolicy(db, text(user.id))
  if (policy.ok === false) {
    await writeLoginAudit({ action: LOGIN_FAILURE_ACTION, actorUserId: text(user.id), targetId: identifierHash, result: 'denied', reason: policy.code.toLowerCase(), request: input.request })
    return { ok: false, status: policy.code === 'MFA_REQUIRED' ? 428 : 403, code: policy.code, message: policy.message }
  }

  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + policy.durationHours * 60 * 60 * 1000).toISOString()

  await db.from('app_sessions').delete().eq('user_id', user.id).lt('expires_at', new Date().toISOString())
  const { error: sessionError } = await db.from('app_sessions').insert({
    user_id: user.id,
    session_token: sessionToken,
    expires_at: expiresAt,
  })

  if (sessionError) {
    throw new Error(`Marketplace admin session creation failed: ${sessionError.message}`)
  }

  await db.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id).then(() => null, () => null)
  await writeLoginAudit({ action: LOGIN_SUCCESS_ACTION, actorUserId: text(user.id), targetId: identifierHash, result: 'success', reason: 'authenticated', request: input.request })

  return {
    ok: true,
    sessionToken,
    expiresAt,
    returnTo,
    userId: text(user.id),
    displayName: text(user.full_name) || text(user.email) || 'Administrateur ANGELCARE',
  }
}

export function adminSessionMaxAge(expiresAt: string): number {
  return Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}
