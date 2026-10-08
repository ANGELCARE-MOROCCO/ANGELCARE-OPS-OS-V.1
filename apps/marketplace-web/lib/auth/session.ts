/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { DEMO_COOKIE, resolveDemoSession } from '@/lib/sanila-demo/authority'

export const APP_SESSION_COOKIE = 'angelcare_ops_session'

export const APP_SESSION_COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? 'angelcarehub.com' : undefined

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function getCurrentAppUser() {
  const cookieStore = await cookies()
  const demoToken = cookieStore.get(DEMO_COOKIE)?.value
  if (demoToken) {
    const demo = await resolveDemoSession(demoToken).catch(() => null)
    if (demo?.config?.school_admin_app_user_id) {
      const demoDb = await createClient()
      const { data: demoUser } = await demoDb.from('app_users').select('*').eq('id', demo.config.school_admin_app_user_id).eq('status', 'active').maybeSingle()
      if (demoUser) return { ...demoUser, __demo: true, __demoGrantId: demo.grant_id, __demoInquiryId: demo.grant?.public_inquiry_id || null, __demoSchoolId: demo.school_id, __demoExpiresAt: demo.effective_expires_at }
    }
  }
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value

  if (!token) return null

  const supabase = await createClient()

  const { data: session } = await supabase
    .from('app_sessions')
    .select('*')
    .eq('session_token', token)
    .maybeSingle()

  if (!session) return null

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await supabase.from('app_sessions').delete().eq('session_token', token)
    return null
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle()

  if (!user || user.status !== 'active') return null

  const tenantAccessResult = await supabase
    .from('angelcare360_operator_tenant_access_accounts')
    .select('id,status,security_policy,access_starts_at,access_expires_at,mfa_enrolled_at')
    .eq('app_user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Security policy is an authorization dependency. A database/policy lookup
  // failure must never silently degrade to unrestricted access.
  if (tenantAccessResult.error) {
    await supabase.from('app_sessions').delete().eq('session_token', token)
    return null
  }

  const tenantAccess = tenantAccessResult.data
  if (tenantAccess) {
    const now = Date.now()
    const startsAt = tenantAccess.access_starts_at ? new Date(tenantAccess.access_starts_at).getTime() : null
    const expiresAt = tenantAccess.access_expires_at ? new Date(tenantAccess.access_expires_at).getTime() : null
    if (tenantAccess.status !== 'active' || (startsAt && startsAt > now) || (expiresAt && expiresAt <= now)) {
      await supabase.from('app_sessions').delete().eq('session_token', token)
      return null
    }
    const policy = (tenantAccess.security_policy || {}) as Record<string, unknown>
    const durationHours = Math.max(1, Math.min(168, Number(policy.session_duration_hours || 12)))
    const createdAt = session.created_at ? new Date(session.created_at).getTime() : null
    if (createdAt && createdAt + durationHours * 3600000 <= now) {
      await supabase.from('app_sessions').delete().eq('session_token', token)
      return null
    }
    if (Boolean(policy.require_mfa)) {
      if (!tenantAccess.mfa_enrolled_at) {
        await supabase.from('app_sessions').delete().eq('session_token', token)
        return null
      }
      if (!session.mfa_verified_at) return { ...user, __mfaRequired: true }
    }
    const seen = await supabase.from('app_sessions').update({ last_seen_at: new Date().toISOString() }).eq('session_token', token)
    if (seen.error) {
      await supabase.from('app_sessions').delete().eq('session_token', token)
      return null
    }
  }

  return user
}

export async function requireUser() {
  const user = await getCurrentAppUser()
  if (!user) redirect('/login')
  // Master Demo is authenticated by its governed PIN/session authority, not by
  // the underlying school-admin password. Password/MFA challenges therefore
  // belong only to normal app sessions and must never trap an approved demo.
  if ((user as any).__demo === true) return user
  if ((user as any).__mfaRequired) redirect('/angelcare-360-access/mfa')
  if (Boolean((user as any).must_change_password)) redirect('/angelcare-360-access/change-password')
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser()
  const role = String((user as any).role || '').trim().toLowerCase()
  const normalizedAllowedRoles = allowedRoles.map((item) => String(item).trim().toLowerCase())

  if (role === 'ceo' || role === 'owner' || role === 'super_admin') {
    return user
  }

  if (!normalizedAllowedRoles.includes(role)) {
    redirect('/unauthorized')
  }

  return user
}
