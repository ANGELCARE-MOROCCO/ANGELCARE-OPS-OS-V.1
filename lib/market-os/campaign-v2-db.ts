import { createClient } from '@/lib/supabase/server'
import { fallbackCampaigns, fallbackTasks, type CampaignV2 } from '@/lib/market-os/campaign-v2'

function normalizeCampaign(row: any): CampaignV2 {
  return {
    id: row.id,
    title: row.title,
    status: row.status || 'draft',
    stage: row.stage || 'strategy',
    owner: row.owner || row.owner_agent || 'Unassigned',
    city: row.city || 'Rabat / Témara',
    channel_mix: Array.isArray(row.channel_mix) ? row.channel_mix : (row.metadata?.channel_mix || []),
    objective: row.objective || row.metadata?.objective || 'Qualified leads',
    target_audience: row.target_audience || row.metadata?.target_audience || 'Families',
    offer: row.offer || row.metadata?.offer || 'AngelCare consultation',
    budget: Number(row.budget || 0),
    spent: Number(row.spent || 0),
    leads: Number(row.leads || 0),
    qualified_leads: Number(row.qualified_leads || 0),
    conversions: Number(row.conversions || 0),
    revenue: Number(row.revenue || 0),
    start_date: row.start_date,
    end_date: row.end_date,
    risk_score: Number(row.risk_score || 0),
    readiness_score: Number(row.readiness_score || 70),
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata || {},
  }
}

export async function listCampaignsV2() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('market_os_campaigns').select('*').order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(normalizeCampaign)
  } catch {
    return fallbackCampaigns
  }
}

export async function getCampaignV2(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('market_os_campaigns').select('*').eq('id', id).maybeSingle()
    if (error || !data) return fallbackCampaigns.find(c => c.id === id) || null
    return normalizeCampaign(data)
  } catch {
    return fallbackCampaigns.find(c => c.id === id) || null
  }
}

export async function listCampaignTasksV2(campaignId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from('market_os_campaign_tasks').select('*').order('created_at', { ascending: false })
    if (campaignId) query = query.eq('campaign_id', campaignId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch {
    return campaignId ? fallbackTasks.filter(t => t.campaign_id === campaignId) : fallbackTasks
  }
}

export async function logCampaignEvent(campaignId: string, eventType: string, payload: Record<string, any> = {}) {
  try {
    const supabase = await createClient()
    await supabase.from('market_os_campaign_events').insert({ campaign_id: campaignId, event_type: eventType, payload })
  } catch {}
}
