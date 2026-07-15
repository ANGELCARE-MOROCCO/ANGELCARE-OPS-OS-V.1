export type B2BApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type B2BProspectLite = {
  id: string
  name: string
  sector?: string | null
  city?: string | null
  status?: string | null
  priority_score?: string | null
  relationship_warmth?: string | null
  estimated_monthly_value?: number | null
  estimated_annual_value?: number | null
  assigned_owner_id?: string | null
  next_follow_up_at?: string | null
  decision_maker_name?: string | null
  decision_maker_email?: string | null
  decision_maker_phone?: string | null
}

export type B2BProposal = {
  id: string
  prospect_id: string
  proposal_title: string
  proposal_type?: string | null
  services_included?: string[] | null
  pricing_model?: string | null
  estimated_monthly_value?: number | null
  estimated_annual_value?: number | null
  pilot_duration?: string | null
  status: string
  created_by?: string | null
  approved_by?: string | null
  sent_at?: string | null
  follow_up_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  prospect?: B2BProspectLite | null
}

export type B2BPartnerProgram = {
  id: string
  name: string
  sector_focus?: string | null
  description?: string | null
  services?: string[] | null
  value_proposition?: string[] | null
  pricing_models?: string[] | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type B2BWeeklyReport = {
  id: string
  report_type: string
  period_start: string
  period_end: string
  owner_id?: string | null
  metrics?: Record<string, unknown> | null
  summary?: string | null
  best_opportunities?: string | null
  objections?: string | null
  support_needed?: string | null
  next_week_plan?: string | null
  created_at?: string | null
}

export type B2BCompletionMetrics = {
  total_proposals: number
  draft_proposals: number
  sent_proposals: number
  accepted_proposals: number
  rejected_proposals: number
  proposal_pipeline_value_monthly: number
  proposal_pipeline_value_annual: number
  active_partner_programs: number
  reports_generated: number
  signed_partners: number
  pilots_agreed: number
  conversion_rate: number
  follow_up_needed: number
}

export const PROPOSAL_TYPES = [
  'Hotel Family Hospitality Partnership',
  'Hotel Kids Club Support',
  'Hotel Event Childcare Partnership',
  'Pediatric Clinic Family Support Partnership',
  'Pediatric Clinic Child Development Workshop Partnership',
  'Referral Partnership',
  'Pilot Partnership',
  'Custom Partnership',
] as const

export const PROPOSAL_STATUSES = [
  'Draft',
  'Internal Review',
  'Approved',
  'Sent',
  'Viewed',
  'Follow-up Needed',
  'Negotiation',
  'Accepted',
  'Rejected',
  'Expired',
] as const

export const PRICING_MODELS = [
  'Fixed monthly retainer',
  'Commission per booking',
  'Revenue share',
  'Per event',
  'Per child/session',
  'Per workshop',
  'Referral partnership',
  'Pilot package',
  'Custom',
] as const

export const REPORT_SECTIONS = [
  'Prospects added',
  'Decision makers identified',
  'Emails sent',
  'Calls made',
  'WhatsApp messages sent',
  'LinkedIn contacts made',
  'Positive replies',
  'Meetings booked',
  'Meetings completed',
  'Proposals sent',
  'Pilots discussed',
  'Partnerships signed',
  'Objections received',
  'Best opportunities',
  'Lost opportunities',
  'Support needed from management',
  'Next week action plan',
] as const
