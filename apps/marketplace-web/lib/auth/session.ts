import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceAccessPolicy, marketplacePolicyAllowsSession } from './marketplace-access-policy'

export const APP_SESSION_COOKIE = 'angelcare_marketplace_internal_session'

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

  const policy = await getMarketplaceAccessPolicy(supabase, String(user.id))
  const availability = marketplacePolicyAllowsSession(policy)
  if (!availability.ok) {
    await supabase.from('app_sessions').delete().eq('session_token', token)
    return null
  }
  const createdAt = session.created_at ? new Date(session.created_at).getTime() : null
  if (createdAt && createdAt + policy.sessionDurationHours * 3600000 <= Date.now()) {
    await supabase.from('app_sessions').delete().eq('session_token', token)
    return null
  }
  if (policy.requireMfa && !session.mfa_verified_at) {
    return { ...user, __mfaRequired: true }
  }
  await supabase.from('app_sessions').update({ last_seen_at: new Date().toISOString() }).eq('session_token', token).then(() => null, () => null)

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
