import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logCampaignEvent } from '@/lib/market-os/campaign-v2-db'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json()
  const action = String(body.action || 'note')
  const now = new Date().toISOString()
  const updates: Record<string, any> = { updated_at: now }
  if (action === 'launch') { updates.status = 'active'; updates.stage = 'live' }
  if (action === 'pause') { updates.status = 'paused' }
  if (action === 'approve') { updates.stage = 'live'; updates.status = 'active'; updates.readiness_score = 92 }
  if (action === 'optimize') { updates.stage = 'optimize' }
  if (action === 'scale') { updates.stage = 'scale'; updates.status = 'active' }
  if (action === 'close') { updates.stage = 'closure'; updates.status = 'completed' }
  if (action === 'risk') { updates.status = 'risk'; updates.risk_score = 75 }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('market_os_campaigns').update(updates).eq('id', id).select('*').single()
    if (error) throw error
    await logCampaignEvent(id, action, { note: body.note || '', updates })
    return NextResponse.json({ ok: true, campaign: data, action })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to execute campaign action' }, { status: 500 })
  }
}
