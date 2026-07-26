import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'

export async function GET() {
  try {
    await requireMarketingAiUser('view')
    const { data, error } = await createContentCommandSupabaseServerClient().from('market_ai_doctrine_entries').select('*').order('category').order('code')
    if (error) throw error
    return NextResponse.json({ ok: true, entries: data || [] })
  } catch (error) { return apiErrorResponse(error) }
}

export async function POST(request: Request) {
  try {
    const actor = await requireMarketingAiUser('govern')
    const body = await request.json()
    if (!body.code || !body.title || !body.category || !body.content) return NextResponse.json({ ok: false, error: 'DOCTRINE_FIELDS_REQUIRED' }, { status: 400 })
    const { data, error } = await createContentCommandSupabaseServerClient().from('market_ai_doctrine_entries').upsert({
      code: String(body.code).trim().toUpperCase(),
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
