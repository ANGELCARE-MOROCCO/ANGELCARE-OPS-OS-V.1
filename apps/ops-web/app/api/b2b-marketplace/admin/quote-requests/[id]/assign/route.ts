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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const assignedName = String(body.assignedName || body.assigned_name || '').trim()
  const priority = String(body.priority || 'normal')
  const nextAction = String(body.nextAction || body.next_action || '').trim()
  const followUpAt = String(body.followUpAt || body.follow_up_at || '').trim() || null
  const supabase = await createClient()
  const { data, error } = await supabase.from('b2b_marketplace_quote_requests').update({ assigned_name: assignedName, priority, next_action: nextAction, follow_up_at: followUpAt, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  await supabase.from('b2b_marketplace_quote_assignments').insert({ quote_request_id: id, assigned_to_name: assignedName, assigned_by: guard.user?.id || null, assigned_by_name: guard.user?.name || guard.user?.email || 'AngelCare Admin', priority, next_action: nextAction, follow_up_at: followUpAt })
  await supabase.from('b2b_marketplace_quote_activity_logs').insert({ quote_request_id: id, activity_type: 'assignment_updated', title: 'Assignation mise à jour', description: `${assignedName || 'Non assigné'} • ${priority} • ${nextAction}`, actor_user_id: guard.user?.id || null, actor_name: guard.user?.name || guard.user?.email || 'AngelCare Admin' })
  return NextResponse.json({ ok: true, data })
}
