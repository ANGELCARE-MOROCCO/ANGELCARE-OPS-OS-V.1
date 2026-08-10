import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/ac360-portability/auth-session'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value

  if (!token) return null

  const supabase = await createServiceClient()

  const { data: session, error: sessionError } = await supabase
    .from('app_sessions')
    .select('*')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (sessionError || !session?.user_id) return null

  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle()

  if (userError || !user || user.status !== 'active') return null

  try {
    const { data: tenantAccess } = await supabase
      .from('angelcare360_operator_tenant_access_accounts')
      .select('status,security_policy,access_starts_at,access_expires_at,mfa_enrolled_at')
      .eq('app_user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (tenantAccess) {
      const now = Date.now()
      const startsAt = tenantAccess.access_starts_at ? new Date(tenantAccess.access_starts_at).getTime() : null
      const expiresAt = tenantAccess.access_expires_at ? new Date(tenantAccess.access_expires_at).getTime() : null
      if (tenantAccess.status !== 'active' || (startsAt && startsAt > now) || (expiresAt && expiresAt <= now)) return null
      const policy = (tenantAccess.security_policy || {}) as Record<string, unknown>
      const durationHours = Math.max(1, Math.min(168, Number(policy.session_duration_hours || 12)))
      const createdAt = session.created_at ? new Date(session.created_at).getTime() : null
      if (createdAt && createdAt + durationHours * 3600000 <= now) return null
      if (Boolean(policy.require_mfa) && tenantAccess.mfa_enrolled_at && !session.mfa_verified_at) return null
    }
  } catch {
    // Compatibility mode before the Tenant Identity migration exists.
  }
  return user
}
