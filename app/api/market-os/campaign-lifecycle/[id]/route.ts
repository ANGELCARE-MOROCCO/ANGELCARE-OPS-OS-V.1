import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCampaignV2, listCampaignTasksV2, logCampaignEvent } from '@/lib/market-os/campaign-v2-db'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const campaign = await getCampaignV2(id)
  const tasks = await listCampaignTasksV2(id)
  return NextResponse.json({ ok: true, campaign, tasks })
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json()
  try {
    const supabase = await createClient()
    const patch = { ...body, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('market_os_campaigns').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    await logCampaignEvent(id, 'updated', { patch })
    return NextResponse.json({ ok: true, campaign: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to update campaign' }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('market_os_campaigns').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    await logCampaignEvent(id, 'archived', {})
    return NextResponse.json({ ok: true, id })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to archive campaign' }, { status: 500 })
  }
}
