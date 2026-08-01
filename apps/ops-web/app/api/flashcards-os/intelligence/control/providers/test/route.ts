import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, testIntelligenceProviderConnection } from '@/lib/flashcards-os/intelligence/server/jobs'

export async function POST(request: Request) {
  const access = await assertFlashcardsApiAccess('flashcards_os.manage_model_profiles')
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  try {
    const body = await request.json() as { provider?: string }
    if (body.provider !== 'tavily' && body.provider !== 'openrouter') {
      return NextResponse.json({ error: 'Provider must be tavily or openrouter.' }, { status: 400 })
    }
    const result = await testIntelligenceProviderConnection(body.provider, actorFromUser(access.user))
    return NextResponse.json({ result })
  } catch (error) {
    const typed = error as Error & { code?: string; status?: number; retryAfterSeconds?: number | null }
    return NextResponse.json({
      error: typed.message || 'Provider test failed.',
      code: typed.code || 'PROVIDER_TEST_FAILED',
      retryAfterSeconds: typed.retryAfterSeconds ?? null,
      syntheticFallbackUsed: false,
    }, { status: typed.status && typed.status >= 400 && typed.status < 600 ? typed.status : 502 })
  }
}
