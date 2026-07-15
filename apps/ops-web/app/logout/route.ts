import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'

export async function GET(request: Request) {
  const token = request.headers
    .get('cookie')
    ?.split('; ')
    .find((row) => row.startsWith(`${APP_SESSION_COOKIE}=`))
    ?.split('=')[1]

  const supabase = await createClient()

  if (token) {
    await supabase
      .from('app_sessions')
      .delete()
      .eq('session_token', decodeURIComponent(token))
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete(APP_SESSION_COOKIE)

  return response
}