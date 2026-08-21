import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'

async function GET__angelcareGovernedImpl() {
  try {
    await requireMarketingAiUser('view')
    const { data, error } = await createContentCommandSupabaseServerClient().from('market_ai_doctrine_entries').select('*').order('category').order('code')
    if (error) throw error
    return NextResponse.json({ ok: true, entries: data || [] })
  } catch (error) { return apiErrorResponse(error) }
}

async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const actor = await requireMarketingAiUser('govern')
    const body = await request.json()
    if (!body.code || !body.title || !body.category || !body.content) return NextResponse.json({ ok: false, error: 'DOCTRINE_FIELDS_REQUIRED' }, { status: 400 })
    const client = createContentCommandSupabaseServerClient()
    const code = String(body.code).trim().toUpperCase()
    const { data: existing, error: existingError } = await client.from('market_ai_doctrine_entries').select('*').eq('code', code).maybeSingle()
    if (existingError) throw existingError
    if (existing && ['approved', 'adopted', 'canonical', 'effective'].includes(String(existing.authority_state || ''))) {
      throw new Error('DOCTRINE_IMMUTABLE_NEW_VERSION_REQUIRED')
    }
    const { data, error } = await client.from('market_ai_doctrine_entries').upsert({
      code,
      title: String(body.title).trim(),
      category: String(body.category).trim(),
      authority_state: body.authorityState || 'provisional',
      content: String(body.content).trim(),
      version: body.version || '1.0.0',
      source: body.source || 'Manual governance',
      created_by: actor.id,
    }, { onConflict: 'code' }).select('*').single()
    if (error) throw error
    return NextResponse.json({ ok: true, entry: data })
  } catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/doctrine',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/doctrine',
  },
  POST__angelcareGovernedImpl,
)
