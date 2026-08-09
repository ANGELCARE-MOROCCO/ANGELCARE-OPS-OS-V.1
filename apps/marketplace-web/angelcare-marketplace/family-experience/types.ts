export type FamilyRequestStatus = 'draft' | 'submitted' | 'qualified' | 'proposal_ready' | 'accepted' | 'declined' | 'cancelled'
export type SupportStatus = 'open' | 'triaged' | 'in_progress' | 'waiting_family' | 'resolved' | 'closed'

export interface FamilyAccount {
  id: string
  public_reference: string
  app_user_id: string
  display_name: string
  email: string | null
  phone: string | null
  city: string | null
  preferred_locale: 'fr' | 'en' | 'ar'
  status: 'active' | 'incomplete' | 'suspended' | 'archived'
  onboarding_status: 'not_started' | 'in_progress' | 'completed'
  consent_status: 'pending' | 'granted' | 'withdrawn'
  territory_id: string | null
  created_at: string
  updated_at: string
}

export interface FamilyChild {
  id: string
  public_reference: string
  family_account_id: string
  first_name: string
  birth_date: string
  age_group: string
  gender: string | null
  school_level: string | null
  languages: string[]
  interests: string[]
  allergies: string | null
  medical_boundaries: string | null
  support_notes: string | null
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface NeedsDiagnostic {
  id: string
  public_reference: string
  family_account_id: string
  child_id: string
  status: 'draft' | 'submitted' | 'reviewed' | 'superseded'
  schedule_needs: Record<string, unknown>
  development_goals: string[]
  routine_needs: string[]
  safety_constraints: string[]
  family_priorities: string[]
  free_context: string | null
  recommendation_summary: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilyQuoteRequest {
  id: string
  public_reference: string
  family_account_id: string
  child_id: string | null
  diagnostic_id: string | null
  service_family: string
  city: string
  requested_start_date: string | null
  schedule: Record<string, unknown>
  duration_expectation: string | null
  location_notes: string | null
  priorities: string[]
  status: FamilyRequestStatus
  owner_id: string | null
  qualification_notes: string | null
  next_action: string | null
  submitted_at: string | null
  qualified_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMission {
  id: string
  public_reference: string
  family_account_id: string
  quote_request_id: string | null
  child_id: string | null
  status: 'requested' | 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  service_type: string
  starts_at: string | null
  ends_at: string | null
  city: string | null
  provider_display_name: string | null
  next_action: string | null
  created_at: string
  updated_at: string
}

export interface MissionTimelineEvent {
  id: string
  mission_id: string
  event_type: string
  title: string
  description: string | null
  visible_to_family: boolean
  occurred_at: string
}

export interface MissionReport {
  id: string
  mission_id: string
  status: 'draft' | 'submitted' | 'validated' | 'correction_required' | 'published'
  summary: string
  activities: unknown[]
  observations: unknown[]
  recommendations: unknown[]
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface SupportTicket {
  id: string
  public_reference: string
  family_account_id: string
  subject: string
  category: string
  priority: 'normal' | 'high' | 'urgent'
  status: SupportStatus
  owner_id: string | null
  next_action: string | null
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  author_type: 'family' | 'staff' | 'system'
  author_id: string | null
  body: string
  visible_to_family: boolean
  created_at: string
}

export interface FamilyDashboardData {
  account: FamilyAccount
  children: FamilyChild[]
  requests: FamilyQuoteRequest[]
  missions: FamilyMission[]
  reports: MissionReport[]
  tickets: SupportTicket[]
  nextActions: Array<{ key: string; title: string; text: string; route: string; priority: 'normal' | 'high' }>
}
