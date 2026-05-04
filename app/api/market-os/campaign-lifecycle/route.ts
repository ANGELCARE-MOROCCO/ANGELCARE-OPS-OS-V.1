import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listCampaignsV2 } from '@/lib/market-os/campaign-v2-db'

export async function GET() {
  const campaigns = await listCampaignsV2()
  return NextResponse.json({ ok: true, campaigns })
}

export async function POST(req: Request) {
  const body = await req.json()
  const payload = {
    title: body.title || 'New AngelCare Campaign',
    status: body.status || 'draft',
    stage: body.stage || 'strategy',
    owner: body.owner || 'Unassigned',
    city: body.city || 'Rabat / Témara',
    channel_mix: body.channel_mix || body.channels || ['Meta', 'WhatsApp'],
    objective: body.objective || 'Qualified leads',
    target_audience: body.target_audience || body.audience || 'Families',
    offer: body.offer || 'AngelCare consultation',
    budget: Number(body.budget || 0),
    spent: Number(body.spent || 0),
    leads: Number(body.leads || 0),
    qualified_leads: Number(body.qualified_leads || 0),
    conversions: Number(body.conversions || 0),
    revenue: Number(body.revenue || 0),
    risk_score: Number(body.risk_score || 12),
    readiness_score: Number(body.readiness_score || 75),
    metadata: body.metadata || {},
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('market_os_campaigns').insert(payload).select('*').single()
    if (error) throw error
    await supabase.from('market_os_campaign_events').insert({ campaign_id: data.id, event_type: 'created', payload: { source: 'campaign_v2_api' } })
    return NextResponse.json({ ok: true, campaign: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create campaign', draft: payload }, { status: 500 })
  }
}
