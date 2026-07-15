'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function clean(v:FormDataEntryValue|null){return String(v||'').trim()||null}

export async function setRevenueTarget(formData:FormData){
  const supabase=await createClient()
  const revenue=Number(clean(formData.get('target_revenue'))||0)
  const leads=Number(clean(formData.get('target_leads'))||0)
  await supabase.from('bd_revenue_targets').insert({
    target_revenue:revenue,
    target_leads:leads,
    period:'monthly'
  })
  revalidatePath('/revenue-command-center/predictive')
}

export async function createRevenueAction(formData:FormData){
  const supabase=await createClient()
  const action=clean(formData.get('action'))
  const priority=clean(formData.get('priority'))||'high'
  await supabase.from('bd_revenue_actions').insert({
    action,
    priority
  })
  revalidatePath('/revenue-command-center/predictive')
}

export async function updateCampaignBrief(formData:FormData){
  const supabase=await createClient()
  const id=clean(formData.get('id'))
  const briefing=clean(formData.get('briefing'))
  const script=clean(formData.get('sales_script'))
  const feedback=clean(formData.get('quality_feedback'))

  await supabase.from('bd_ad_campaigns').update({
    briefing,
    sales_script:script,
    quality_feedback:feedback,
    updated_at:new Date().toISOString()
  }).eq('id',id)

  revalidatePath('/revenue-command-center/meta-readiness')
}
