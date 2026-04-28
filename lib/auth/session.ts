import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export const APP_SESSION_COOKIE = 'angelcare_ops_session'

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

  return user
}

export async function requireUser() {
  const user = await getCurrentAppUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser()

  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}
