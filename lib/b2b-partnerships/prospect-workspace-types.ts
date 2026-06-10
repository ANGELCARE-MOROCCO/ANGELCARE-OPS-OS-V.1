export type B2BApiResult<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; error: string; data?: never }

export type B2BCrmStatus =
  | 'New'
  | 'Contacted'
  | 'No Response'
  | 'Interested'
  | 'Meeting Booked'
  | 'Meeting Done'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Pilot Agreed'
  | 'Signed Partner'
  | 'Not Fit'
  | 'Follow Up Later'
  | 'Lost'

export type B2BPriorityScore = 'A' | 'B' | 'C'
export type B2BRelationshipWarmth = 'Cold' | 'Warm' | 'Hot'

export type B2BProspectSector =
  | 'Hotel'
  | 'Resort'
  | 'Family hotel'
  | 'Boutique hotel'
  | 'Event venue'
  | 'Pediatric clinic'
  | 'Pediatrician'
  | 'Child development center'
  | 'Orthophonist'
  | 'Psychomotor specialist'
  | 'Family wellness center'
  | 'School'
  | 'Nursery'
  | 'Corporate family service buyer'
  | 'Other'

export type B2BProspect = {
  id: string
  name: string
  sector: B2BProspectSector | string
  sub_sector?: string | null
  city?: string | null
  address?: string | null
  website?: string | null
  instagram?: string | null
  linkedin?: string | null
  google_maps_url?: string | null
  phone?: string | null
  email?: string | null
  main_contact_name?: string | null
  main_contact_role?: string | null
  decision_maker_name?: string | null
  decision_maker_role?: string | null
  decision_maker_phone?: string | null
  decision_maker_email?: string | null
  status: B2BCrmStatus | string
  priority_score: B2BPriorityScore | string
  fit_score?: number | null
  urgency_score?: number | null
  decision_power_score?: number | null
  revenue_potential_score?: number | null
  relationship_warmth?: B2BRelationshipWarmth | string | null
  potential_service_fit?: string | null
  current_family_services?: string | null
  pain_points?: string | null
  opportunity_description?: string | null
  estimated_monthly_value?: number | null
  estimated_annual_value?: number | null
  assigned_owner_id?: string | null
  created_by?: string | null
  updated_by?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  next_action?: string | null
  loss_reason?: string | null
  not_fit_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
  archived_at?: string | null
}

export type B2BContact = {
  id: string
  prospect_id: string
  name: string
  role?: string | null
  phone?: string | null
  email?: string | null
  linkedin?: string | null
  is_decision_maker?: boolean | null
  influence_level?: string | null
  preferred_channel?: string | null
  notes?: string | null
  created_at?: string | null
}

export type B2BActivity = {
  id: string
  prospect_id?: string | null
  actor_id?: string | null
  activity_type: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export type B2BProspectDetail = {
  prospect: B2BProspect
  contacts: B2BContact[]
  activities: B2BActivity[]
  outreach: Array<Record<string, unknown>>
  calls: Array<Record<string, unknown>>
  meetings: Array<Record<string, unknown>>
  proposals: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
}

export type B2BProspectPayload = Partial<B2BProspect> & {
  name: string
  sector: string
  priority_score?: string
  status?: string
  relationship_warmth?: string
}

export const B2B_PIPELINE_STATUSES: B2BCrmStatus[] = [
  'New',
  'Contacted',
  'No Response',
  'Interested',
  'Meeting Booked',
  'Meeting Done',
  'Proposal Sent',
  'Negotiation',
  'Pilot Agreed',
  'Signed Partner',
  'Not Fit',
  'Follow Up Later',
  'Lost',
]

export const B2B_SECTORS: B2BProspectSector[] = [
  'Hotel',
  'Resort',
  'Family hotel',
  'Boutique hotel',
  'Event venue',
  'Pediatric clinic',
  'Pediatrician',
  'Child development center',
  'Orthophonist',
  'Psychomotor specialist',
  'Family wellness center',
  'School',
  'Nursery',
  'Corporate family service buyer',
  'Other',
]

export const B2B_PRIORITY_SCORES: B2BPriorityScore[] = ['A', 'B', 'C']
export const B2B_RELATIONSHIP_WARMTH: B2BRelationshipWarmth[] = ['Cold', 'Warm', 'Hot']
