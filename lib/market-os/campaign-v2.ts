export type CampaignStage = 'strategy' | 'build' | 'approval' | 'live' | 'optimize' | 'scale' | 'closure'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'risk' | 'completed' | 'archived'

export type CampaignV2 = {
  id: string
  title: string
  status: CampaignStatus
  stage: CampaignStage
  owner: string
  city: string
  channel_mix: string[]
  objective: string
  target_audience: string
  offer: string
  budget: number
  spent: number
  leads: number
  qualified_leads: number
  conversions: number
  revenue: number
  start_date?: string
  end_date?: string
  risk_score: number
  readiness_score: number
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
}

export type CampaignTask = {
  id: string
  campaign_id: string
  title: string
  owner: string
  status: string
  priority: string
  workstream: string
  due_date?: string
  dependency?: string
  proof_required?: boolean
}

export type CampaignApproval = {
  id: string
  campaign_id: string
  title: string
  status: string
  requested_by: string
  approver: string
  created_at?: string
}

export const campaignStages: CampaignStage[] = ['strategy','build','approval','live','optimize','scale','closure']

export const campaignScenarioTemplates = [
  { name: 'Rabat childcare acquisition sprint', objective: 'Qualified leads', audience: 'Mothers 25-45 in Rabat / Témara', channels: ['Meta','WhatsApp','Landing Page'], offer: 'Safe supervised childcare assessment', budget: 12000 },
  { name: 'Post-partum premium support launch', objective: 'Bookings', audience: 'New mothers and young families', channels: ['Meta','SEO Blog','WhatsApp'], offer: 'Home recovery support consultation', budget: 15000 },
  { name: 'Senior care trust authority campaign', objective: 'Qualified leads', audience: 'Adult children managing parent care', channels: ['SEO Blog','Partner Referrals','WhatsApp'], offer: 'Senior care assessment and caregiver matching', budget: 10000 },
  { name: 'Pharmacy partner referral activation', objective: 'Partner-sourced referrals', audience: 'Pharmacy customers needing home care support', channels: ['Partners Network','Printed Brochure','WhatsApp'], offer: 'Referral-backed family care consultation', budget: 8000 },
  { name: 'Ambassador city launch campaign', objective: 'Community leads', audience: 'Local family communities', channels: ['Ambassador Program','Meta','Events'], offer: 'Trusted family care discovery session', budget: 9000 },
  { name: 'Ramadan family support campaign', objective: 'Bookings', audience: 'Families needing household and care support', channels: ['Meta','WhatsApp','Content'], offer: 'Ramadan home support planning', budget: 18000 },
]

export const fallbackCampaigns: CampaignV2[] = [
  {
    id: 'camp-v2-rabat-childcare', title: 'Rabat Childcare Lead Capture', status: 'active', stage: 'live', owner: 'Marketing Lead', city: 'Rabat / Témara',
    channel_mix: ['Meta','WhatsApp','Landing Page'], objective: 'Qualified leads', target_audience: 'Mothers 25-45', offer: 'Book a trusted childcare assessment',
    budget: 12000, spent: 5400, leads: 86, qualified_leads: 44, conversions: 13, revenue: 39000, risk_score: 18, readiness_score: 91,
    metadata: { next_action: 'Optimize CPL and assign ambassador follow-up missions', insight: 'WhatsApp replies convert faster than form-only leads.' }
  },
  {
    id: 'camp-v2-senior-care', title: 'Senior Care Trust Authority', status: 'risk', stage: 'optimize', owner: 'Growth Manager', city: 'Rabat / Salé',
    channel_mix: ['SEO Blog','Partners Network','WhatsApp'], objective: 'Qualified leads', target_audience: 'Adult children managing senior care', offer: 'Senior care consultation with follow-up',
    budget: 10000, spent: 7300, leads: 41, qualified_leads: 17, conversions: 4, revenue: 22000, risk_score: 62, readiness_score: 78,
    metadata: { next_action: 'Repair partner lead quality and publish objection-handling article', insight: 'Lead quality drops from unbriefed partner sources.' }
  },
]

export const fallbackTasks: CampaignTask[] = [
  { id:'task-brief', campaign_id:'camp-v2-rabat-childcare', title:'Finalize campaign positioning and care promise', owner:'Marketing Lead', status:'done', priority:'high', workstream:'Strategy', proof_required:true },
  { id:'task-content', campaign_id:'camp-v2-rabat-childcare', title:'Publish 3 approved content assets in Content Command Center', owner:'Content Officer', status:'in_progress', priority:'high', workstream:'Content', dependency:'task-brief', proof_required:true },
  { id:'task-seo', campaign_id:'camp-v2-rabat-childcare', title:'Create SEO support article and meta title', owner:'SEO Officer', status:'queued', priority:'normal', workstream:'SEO', dependency:'task-brief' },
  { id:'task-amb', campaign_id:'camp-v2-rabat-childcare', title:'Assign 8 ambassador local missions for family referrals', owner:'Ambassador Manager', status:'in_progress', priority:'critical', workstream:'Ambassadors', proof_required:true },
  { id:'task-partner', campaign_id:'camp-v2-senior-care', title:'Brief 5 pharmacy partners and validate lead script', owner:'Partner Manager', status:'blocked', priority:'critical', workstream:'Partners', proof_required:true },
]

export function calculateCampaignHealth(c: CampaignV2) {
  const roi = c.spent > 0 ? Math.round(((c.revenue - c.spent) / c.spent) * 100) : 0
  const cpl = c.leads > 0 ? Math.round(c.spent / c.leads) : 0
  const conversionRate = c.leads > 0 ? Math.round((c.conversions / c.leads) * 100) : 0
  const budgetBurn = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0
  const health = Math.max(0, Math.min(100, Math.round((c.readiness_score + Math.max(0, 100 - c.risk_score) + Math.min(100, roi + 40)) / 3)))
  return { roi, cpl, conversionRate, budgetBurn, health }
}

export function campaignActionPlaybook(c: CampaignV2) {
  const h = calculateCampaignHealth(c)
  const actions = []
  if (c.readiness_score < 80) actions.push('Complete readiness checklist before scaling.')
  if (c.risk_score > 50) actions.push('Open risk review and require manager approval before new spend.')
  if (h.cpl > 120) actions.push('Launch creative A/B test and refresh targeting.')
  if (h.conversionRate < 10) actions.push('Improve lead handoff and qualification script.')
  if (h.roi > 100 && c.stage === 'live') actions.push('Move to scale stage and increase budget gradually.')
  if (!actions.length) actions.push('Maintain monitoring rhythm and document learning for closure report.')
  return actions
}
