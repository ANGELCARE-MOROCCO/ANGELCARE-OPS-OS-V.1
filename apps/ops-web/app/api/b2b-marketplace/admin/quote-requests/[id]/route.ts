import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'
import { canonicalDossierPayload, getQuoteDossier } from '@/lib/b2b-marketplace/crm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AdminUser = { id?: string; email?: string; name?: string; role?: string; permissions?: string[] } | null

async function requireMarketplaceAdmin(): Promise<{ response?: NextResponse; user?: AdminUser }> {
  try {
    const user = (await getCurrentUser()) as AdminUser
    const allowed = user?.role === 'ceo' || user?.role === 'manager' || user?.permissions?.includes('admin:b2b-marketplace')
    if (!allowed) return { response: NextResponse.json({ ok: false, error: 'Marketplace CRM admin access required' }, { status: 401 }) }
    return { user }
  } catch (error) {
    return { response: NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Admin auth unavailable' }, { status: 401 }) }
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { id } = await params
  const dossier = await getQuoteDossier(id)
  if (!dossier) return NextResponse.json({ ok: false, error: 'Quote request not found' }, { status: 404 })
  const payload = canonicalDossierPayload(dossier)
  return NextResponse.json({ ok: true, data: payload, ...payload })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const allowed = ['school_name', 'contact_name', 'phone', 'email', 'city', 'message', 'priority', 'request_type', 'source', 'source_page', 'origin_url', 'assigned_name', 'next_action', 'follow_up_at', 'estimated_total_mad', 'lost_reason', 'internal_summary', 'devis_terms', 'commercial_notes', 'discount_mad', 'devis_valid_until']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) if (key in body) update[key] = body[key]
  const supabase = await createClient()
  const { data, error } = await supabase.from('b2b_marketplace_quote_requests').update(update).eq('id', id).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'request_updated', title: 'Dossier client modifié', description: 'Coordonnées, résumé ou total mis à jour', actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  return NextResponse.json({ ok: true, data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const supabase = await createClient()
  await supabase.from('b2b_marketplace_quote_lines').delete().eq('quote_request_id', id)
  await supabase.from('b2b_marketplace_quote_notes').delete().eq('quote_request_id', id)
  await supabase.from('b2b_marketplace_quote_status_history').delete().eq('quote_request_id', id)
  await supabase.from('b2b_marketplace_quote_activity_logs').delete().eq('quote_request_id', id)
  await supabase.from('b2b_marketplace_quote_documents').delete().eq('quote_request_id', id)
  await supabase.from('b2b_marketplace_quote_proposals').delete().eq('quote_request_id', id)
  const { error } = await supabase.from('b2b_marketplace_quote_requests').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, id })
}
