import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

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

  try {
    const { data: tenantAccess } = await supabase
      .from('angelcare360_operator_tenant_access_accounts')
      .select('id,status,security_policy,access_starts_at,access_expires_at,mfa_enrolled_at')
      .eq('app_user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
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
        if (!session.mfa_verified_at) {
          return { ...user, __mfaRequired: true }
        }
      }
      await supabase.from('app_sessions').update({ last_seen_at: new Date().toISOString() }).eq('session_token', token).then(() => null, () => null)
    }
  } catch {
    // Compatibility mode until the additive Tenant Identity migration is applied.
  }

  return user
}

export async function requireUser() {
  const user = await getCurrentAppUser()
  if (!user) redirect('/login')
  if ((user as any).__mfaRequired) redirect('/angelcare-360-access/mfa')
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
