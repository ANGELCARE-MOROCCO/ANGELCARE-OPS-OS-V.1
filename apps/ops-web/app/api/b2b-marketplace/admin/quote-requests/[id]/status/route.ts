import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'
import { QUOTE_CRM_STATUSES, normalizeQuoteStatus } from '@/lib/b2b-marketplace/crm'

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const status = String(body.status || '')
  if (!(QUOTE_CRM_STATUSES as string[]).includes(status)) return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
  const supabase = await createClient()
  const { data: before } = await supabase.from('b2b_marketplace_quote_requests').select('status').eq('id', id).maybeSingle()
  const fromStatus = normalizeQuoteStatus(before?.status)
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'archived') update.archived_at = new Date().toISOString()
  if (status === 'contacted') update.last_contacted_at = new Date().toISOString()
  const { data, error } = await supabase.from('b2b_marketplace_quote_requests').update(update).eq('id', id).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  const note = String(body.note || '')
  await supabase.from('b2b_marketplace_quote_status_history').insert({ quote_request_id: id, from_status: fromStatus, to_status: status, changed_by: guard.user?.id || null, changed_by_name: guard.user?.name || guard.user?.email || 'AngelCare Admin', note })
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'status_changed', title: `Statut mis à jour: ${fromStatus} → ${status}`, description: note, actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  return NextResponse.json({ ok: true, data })
}
