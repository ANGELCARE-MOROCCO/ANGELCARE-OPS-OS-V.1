export type B2BDashboardMetrics = {
  total_prospects: number
  qualified_prospects: number
  hotels_pipeline: number
  pediatric_clinics_pipeline: number
  decision_makers_identified: number
  outreach_sent_this_week: number
  calls_completed_this_week: number
  positive_replies: number
  meetings_booked: number
  meetings_completed: number
  proposals_sent: number
  pilots_agreed: number
  signed_partners: number
  estimated_monthly_revenue: number
  estimated_annual_partnership_value: number
  conversion_rate: number
  overdue_followups: number
}

export type B2BProspectDashboardRow = {
  id: string
  name: string
  sector: string
  city: string | null
  status: string
  priority_score: 'A' | 'B' | 'C'
  relationship_warmth?: string | null
  estimated_monthly_value?: number | null
  estimated_annual_value?: number | null
  assigned_owner_id?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  next_action?: string | null
  decision_maker_name?: string | null
  created_at?: string | null
}

export type B2BPartnerProgram = {
  id: string
  name: string
  sector_focus: string | null
  description: string | null
  services: string[]
  value_proposition: string[]
  pricing_models: string[]
  is_active: boolean
}

export type B2BApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
