import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const store = await cookies()
  const token = store.get(APP_SESSION_COOKIE)?.value || null
  if (token) {
    try {
      const db = await createServiceClient()
      await db.from('app_sessions').delete().eq('session_token', token)
    } catch {
      // Cookie revocation remains effective if database cleanup is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true, returnTo: '/admin' })
  response.cookies.set(APP_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  response.headers.set('cache-control', 'no-store')
  return response
}
