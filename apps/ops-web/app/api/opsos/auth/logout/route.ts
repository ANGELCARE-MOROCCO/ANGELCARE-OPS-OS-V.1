import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clear(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: '',
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  })
}

export async function POST() {
  const response = NextResponse.json(
    { ok: true, message: 'OpsOS browser/session cleanup requested.' },
    { headers: { 'Cache-Control': 'no-store' } },
  )

  const commonNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'angelcare-auth-token',
    'opsos-auth-token',
    'gops-auth-token',
    'carelink-auth-token',
    'traininghub-auth-token',
    'session',
    'auth',
  ]

  commonNames.forEach((name) => clear(response, name))

  return response
}

export async function GET() {
  return POST()
}
