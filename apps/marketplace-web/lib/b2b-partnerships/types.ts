import {
  B2B_CRM_STATUSES,
  B2B_MEETING_STATUSES,
  B2B_OUTREACH_CHANNELS,
  B2B_OUTREACH_OUTCOMES,
  B2B_PRIORITY_SCORES,
  B2B_PROPOSAL_STATUSES,
  B2B_RELATIONSHIP_WARMTH,
  B2B_SECTORS,
  B2B_TASK_PRIORITIES,
  B2B_TASK_STATUSES,
} from './constants'

export type B2BSector = (typeof B2B_SECTORS)[number]
export type B2BCrmStatus = (typeof B2B_CRM_STATUSES)[number]
export type B2BPriorityScore = (typeof B2B_PRIORITY_SCORES)[number]
export type B2BRelationshipWarmth = (typeof B2B_RELATIONSHIP_WARMTH)[number]
export type B2BOutreachChannel = (typeof B2B_OUTREACH_CHANNELS)[number]
export type B2BOutreachOutcome = (typeof B2B_OUTREACH_OUTCOMES)[number]
export type B2BMeetingStatus = (typeof B2B_MEETING_STATUSES)[number]
export type B2BProposalStatus = (typeof B2B_PROPOSAL_STATUSES)[number]
export type B2BTaskStatus = (typeof B2B_TASK_STATUSES)[number]
export type B2BTaskPriority = (typeof B2B_TASK_PRIORITIES)[number]

export type B2BRole =
  | 'CEO / Managing Director'
  | 'Business Development Manager'
  | 'Business Developer Intern'
  | 'Operations Manager'
  | 'Admin'
  | 'Viewer'

export type B2BPermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'archive'
  | 'approve_proposal'
  | 'manage_settings'
  | 'view_all'
  | 'export'

export type B2BPermissionContext = {
  actorId: string
  actorRole?: string | null
  assignedOwnerId?: string | null
  createdBy?: string | null
}

export type B2BProspectInput = {
  name: string
  sector: B2BSector
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
  status?: B2BCrmStatus
  priority_score?: B2BPriorityScore
  fit_score?: number | null
  urgency_score?: number | null
  decision_power_score?: number | null
  revenue_potential_score?: number | null
  relationship_warmth?: B2BRelationshipWarmth
  potential_service_fit?: string | null
  current_family_services?: string | null
  pain_points?: string | null
  opportunity_description?: string | null
  estimated_monthly_value?: number | null
  estimated_annual_value?: number | null
  assigned_owner_id?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
  next_action?: string | null
}

export type B2BApiResponse<T = unknown> =
  | { ok: true; data: T; error?: never }
  | { ok: false; error: string; data?: never }
