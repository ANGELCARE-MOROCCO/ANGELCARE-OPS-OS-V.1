import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value

  if (!token) return null

  const supabase = await createServiceClient()

  const { data: session, error: sessionError } = await supabase
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (sessionError || !session?.user_id) return null

  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle()

  if (userError) return null
  return user || null
}
