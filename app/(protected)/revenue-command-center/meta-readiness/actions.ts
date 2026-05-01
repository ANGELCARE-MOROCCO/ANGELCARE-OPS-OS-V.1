'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { scoreProspectAttribution } from '@/lib/metaAdsReadinessEngine'

function clean(v: FormDataEntryValue | null) {
  return String(v || '').trim() || null
}

export async function createAdCampaign(formData: FormData) {
  const supabase = await createClient()

  const name = clean(formData.get('name'))
  const objective = clean(formData.get('objective'))
  const budget = Number(clean(formData.get('budget')) || 0)

  if (!name) throw new Error('Missing campaign name.')

  const { error } = await supabase.from('bd_ad_campaigns').insert({
    name,
    objective,
    budget,
    platform: 'meta',
    status: 'draft',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/meta-readiness')
}

export async function createAdCreative(formData: FormData) {
  const supabase = await createClient()

  const campaignId = clean(formData.get('campaign_id'))
  const name = clean(formData.get('name'))
  const angle = clean(formData.get('angle'))
  const offer = clean(formData.get('offer'))
  const audience = clean(formData.get('audience'))
  const primaryText = clean(formData.get('primary_text'))
  const headline = clean(formData.get('headline'))
  const cta = clean(formData.get('call_to_action'))

  if (!campaignId || !name) throw new Error('Missing campaign or creative name.')

  const { error } = await supabase.from('bd_ad_creatives').insert({
    campaign_id: campaignId,
    name,
    angle,
    offer,
    audience,
    primary_text: primaryText,
    headline,
    call_to_action: cta,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/meta-readiness')
}

export async function updateCampaignMetrics(formData: FormData) {
  const supabase = await createClient()

  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing campaign.')

  const payload = {
    spend: Number(clean(formData.get('spend')) || 0),
    impressions: Number(clean(formData.get('impressions')) || 0),
    clicks: Number(clean(formData.get('clicks')) || 0),
    leads: Number(clean(formData.get('leads')) || 0),
    status: clean(formData.get('status')) || 'active',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('bd_ad_campaigns').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/meta-readiness')
}

export async function attributeProspect(formData: FormData) {
  const supabase = await createClient()

  const prospectId = clean(formData.get('prospect_id'))
  const campaignId = clean(formData.get('campaign_id'))
  const sourceChannel = clean(formData.get('source_channel'))
  const leadQuality = clean(formData.get('lead_quality')) || 'unknown'

  if (!prospectId) throw new Error('Missing prospect.')

  const { data: prospect } = await supabase.from('bd_prospects').select('*').eq('id', prospectId).maybeSingle()
  const next = {
    ...(prospect || {}),
    source_platform: 'meta',
    source_channel: sourceChannel,
    campaign_id: campaignId,
    lead_quality: leadQuality,
  }

  const attributionScore = scoreProspectAttribution(next)

  const { error } = await supabase.from('bd_prospects').update({
    source_platform: 'meta',
    source_channel: sourceChannel,
    campaign_id: campaignId,
    lead_quality: leadQuality,
    attribution_score: attributionScore,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)

  if (error) throw new Error(error.message)

  await supabase.from('bd_attribution_events').insert({
    prospect_id: prospectId,
    campaign_id: campaignId,
    event_type: 'manual_attribution',
    source_platform: 'meta',
    source_channel: sourceChannel,
    metadata: { lead_quality: leadQuality, attribution_score: attributionScore },
  })

  revalidatePath('/revenue-command-center/meta-readiness')
}
