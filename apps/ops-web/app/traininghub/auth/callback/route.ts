import { NextRequest, NextResponse } from 'next/server'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin
  const next = url.searchParams.get('next') || '/traininghub'

  if (!code) {
    return NextResponse.redirect(`${origin}/traininghub/login?error=callback_failed`)
  }

  const supabase = await createTrainingHubUserClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/traininghub/login?error=callback_failed`)
  }

  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/traininghub'}`)
}
