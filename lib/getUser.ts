import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value

  if (!token) return null

  const supabase = await createClient()

  const { data } = await supabase
    .from('app_sessions')
    .select('user_id, app_users(*)')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return data?.app_users || null
}