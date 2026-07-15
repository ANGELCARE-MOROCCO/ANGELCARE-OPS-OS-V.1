import { NextResponse } from 'next/server'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clearCookie(response: NextResponse, name: string) {
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
    { ok: true, message: 'TrainingHub session cleared.' },
    { headers: { 'Cache-Control': 'no-store' } },
  )

  try {
    const supabase = await createTrainingHubUserClient()
    await supabase.auth.signOut()
  } catch {
    // Cookie cleanup below is the important fallback.
  }

  // Known Supabase SSR cookie families. Browser client cleanup also clears localStorage.
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'traininghub-auth-token',
  ]

  cookieNames.forEach((name) => clearCookie(response, name))

  return response
}

export async function GET() {
  return POST()
}
