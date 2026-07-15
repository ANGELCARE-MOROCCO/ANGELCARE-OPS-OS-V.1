import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const supabase = await createClient()
  let totalMad = Number(body.total_mad || body.totalMad || 0)
  if (!totalMad) {
    const { data: lines } = await supabase.from('b2b_marketplace_quote_lines').select('quantity, estimated_unit_price_mad, unit_price_mad, total_mad').eq('quote_request_id', id)
    totalMad = (lines || []).reduce((sum, line) => {
      const qty = Number(line.quantity || 1)
      const unit = Number(line.unit_price_mad || line.estimated_unit_price_mad || 0)
      const direct = Number(line.total_mad || 0)
      return sum + (direct > 0 ? direct : qty * unit)
    }, 0)
  }
  const proposalReference = `AC-B2B-DEVIS-${Date.now().toString(36).toUpperCase()}`
  const { data: existing } = await supabase.from('b2b_marketplace_quote_proposals').select('*').eq('quote_request_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  let proposal = existing
  if (!proposal) {
    const { data, error } = await supabase.from('b2b_marketplace_quote_proposals').insert({
      quote_request_id: id,
      proposal_reference: proposalReference,
      status: 'draft',
      total_mad: totalMad,
      payload: { generated_from: 'crm_a4_devis', version: '1.0', print_requested: Boolean(body.print) },
      created_by: guard.user?.id || null,
      created_by_name: guard.user?.name || guard.user?.email || 'AngelCare Admin',
    }).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    proposal = data
  } else {
    const { data, error } = await supabase.from('b2b_marketplace_quote_proposals').update({
      total_mad: totalMad,
      payload: { ...(proposal.payload || {}), generated_from: 'crm_a4_devis', version: '1.0', print_requested: Boolean(body.print), updated_at: new Date().toISOString() },
    }).eq('id', proposal.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    proposal = data
  }
  await supabase.from('b2b_marketplace_quote_requests').update({ status: 'quote_preparation', estimated_total_mad: totalMad, updated_at: new Date().toISOString() }).eq('id', id)
  await supabase.from('b2b_marketplace_quote_documents').insert({ quote_request_id: id, document_type: 'devis_a4', title: `Devis A4 — ${proposal.proposal_reference}`, status: 'generated', created_by: guard.user?.id || null, created_by_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'a4_devis_prepared', title: 'Devis A4 préparé / impression lancée', description: proposal.proposal_reference, actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin', metadata: { total_mad: totalMad } })
  return NextResponse.json({ ok: true, data: proposal })
}
