import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { getMarketplaceAccessPolicy, marketplacePolicyAllowsSession } from '@/lib/auth/marketplace-access-policy'

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

  const policy = await getMarketplaceAccessPolicy(supabase, String(user.id))
  const availability = marketplacePolicyAllowsSession(policy)
  if (!availability.ok) return null
  const createdAt = session.created_at ? new Date(session.created_at).getTime() : null
  if (createdAt && createdAt + policy.sessionDurationHours * 3600000 <= Date.now()) return null
  if (policy.requireMfa && !session.mfa_verified_at) return null

  return user
}
