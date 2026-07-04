import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AdminUser = { id?: string; email?: string; name?: string; role?: string; permissions?: string[] } | null
async function requireMarketplaceAdmin() {
  try {
    const user = (await getCurrentUser()) as AdminUser
    const allowed = user?.role === 'ceo' || user?.role === 'manager' || user?.permissions?.includes('admin:b2b-marketplace')
    if (!allowed) return { response: NextResponse.json({ ok: false, error: 'Marketplace CRM admin access required' }, { status: 401 }) }
    return { user }
  } catch (error) {
    return { response: NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Admin auth unavailable' }, { status: 401 }) }
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const supabase = await createClient()
  const proposalRef = `AC-B2B-PROP-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await supabase.from('b2b_marketplace_quote_proposals').insert({ quote_request_id: id, proposal_reference: proposalRef, status: 'draft', created_by: guard.user?.id || null, created_by_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' }).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  await supabase.from('b2b_marketplace_quote_requests').update({ status: 'quote_preparation', updated_at: new Date().toISOString() }).eq('id', id)
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'proposal_draft_created', title: 'Devis / proposition préparé', description: proposalRef, actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  return NextResponse.json({ ok: true, data })
}
