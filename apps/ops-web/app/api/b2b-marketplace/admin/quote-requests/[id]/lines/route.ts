import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AdminUser = { id?: string; email?: string; name?: string; role?: string; permissions?: string[] } | null
async function requireMarketplaceAdmin(): Promise<{ response?: NextResponse; user?: AdminUser }> { try { const user = (await getCurrentUser()) as AdminUser; const allowed = user?.role === 'ceo' || user?.role === 'manager' || user?.permissions?.includes('admin:b2b-marketplace'); if (!allowed) return { response: NextResponse.json({ ok: false, error: 'Marketplace CRM admin access required' }, { status: 401 }) }; return { user } } catch (error) { return { response: NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Admin auth unavailable' }, { status: 401 }) } } }
async function refreshTotal(supabase: Awaited<ReturnType<typeof createClient>>, id: string) { const { data: lines } = await supabase.from('b2b_marketplace_quote_lines').select('quantity, estimated_unit_price_mad, unit_price_mad, total_mad').eq('quote_request_id', id); const total = (lines || []).reduce((sum, line) => { const qty = Number(line.quantity || 1); const unit = Number(line.unit_price_mad || line.estimated_unit_price_mad || 0); const direct = Number(line.total_mad || 0); return sum + (direct > 0 ? direct : qty * unit) }, 0); await supabase.from('b2b_marketplace_quote_requests').update({ estimated_total_mad: total, updated_at: new Date().toISOString() }).eq('id', id); return total }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin(); if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const qty = Number(body.quantity || 1)
  const unit = Number(body.unit_price_mad || body.estimated_unit_price_mad || body.unitPriceMad || body.estimatedUnitPriceMad || 0)
  const insert = { quote_request_id: id, item_type: String(body.item_type || body.itemType || 'product'), reference_code: String(body.reference_code || body.referenceCode || 'À-COMPLÉTER'), title: String(body.title || 'Nouvelle ligne devis'), quantity: qty, estimated_unit_price_mad: unit, unit_price_mad: unit, total_mad: Number(body.total_mad || body.totalMad || qty * unit), personalization_notes: String(body.personalization_notes || body.personalizationNotes || ''), source_page: String(body.source_page || body.sourcePage || ''), item_slug: String(body.item_slug || body.itemSlug || ''), item_payload: typeof body.item_payload === 'object' && body.item_payload ? body.item_payload : {} }
  const supabase = await createClient()
  const { data, error } = await supabase.from('b2b_marketplace_quote_lines').insert(insert).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  const total = await refreshTotal(supabase, id)
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'line_created', title: 'Ligne devis ajoutée', description: `${insert.reference_code} • ${insert.title}`, actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  return NextResponse.json({ ok: true, data, total })
}
