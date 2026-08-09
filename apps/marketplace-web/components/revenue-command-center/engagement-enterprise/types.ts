export type EngagementExperienceKey =
  | "engagement-command"
  | "appointment-dashboard"
  | "appointment-command"
  | "control-tower"
  | "appointment-dossier"
  | "briefing-room"
  | "calendar"
  | "conversion"
  | "escalations"
  | "executive"
  | "follow-up"
  | "high-value"
  | "live-command"
  | "live-room"
  | "schedule-studio"
  | "new-appointment"
  | "no-shows"
  | "outcome-studio"
  | "performance"
  | "queue"
  | "recovery"
  | "reschedules"
  | "risk"
  | "analytics"

export type EngagementAppointment = {
  id: string
  title: string
  status: string
  appointment_at: string
  end_at?: string | null
  owner?: string | null
  appointment_type?: string | null
  priority?: string | null
  location?: string | null
  meeting_link?: string | null
  objective?: string | null
  expected_outcome?: string | null
  agenda?: string | null
  notes?: string | null
  live_notes?: string | null
  outcome?: string | null
  follow_up_at?: string | null
  entity_type?: string | null
  entity_id?: string | null
  prospect_id?: string | null
  account_id?: string | null
  opportunity_id?: string | null
  contact_id?: string | null
  entity_name?: string | null
  account_name?: string | null
  opportunity_title?: string | null
  primary_contact_name?: string | null
  primary_contact_email?: string | null
  primary_contact_phone?: string | null
  entity_city?: string | null
  entity_stage?: string | null
  entity_priority?: string | null
  commercial_value_mad?: number | null
  no_show_risk?: number | null
  confirmation_status?: string | null
  preparation_status?: string | null
  outcome_code?: string | null
  timezone?: string | null
  duration_minutes?: number | null
  participant_count?: number | null
  confirmed_participant_count?: number | null
  preparation_done_count?: number | null
  preparation_total_count?: number | null
  objection_count?: number | null
  commitment_count?: number | null
  open_commitment_count?: number | null
  communication_count?: number | null
  recovery_attempt_count?: number | null
  version?: number | null
  metadata?: Record<string, any> | null
  created_at?: string | null
  updated_at?: string | null
}

export type EngagementPortfolio = {
  appointments: EngagementAppointment[]
  participants: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  agendaItems: Array<Record<string, any>>
  preparationItems: Array<Record<string, any>>
  attendance: Array<Record<string, any>>
  notes: Array<Record<string, any>>
  objections: Array<Record<string, any>>
  decisions: Array<Record<string, any>>
  commitments: Array<Record<string, any>>
  outcomes: Array<Record<string, any>>
  followUps: Array<Record<string, any>>
  noShows: Array<Record<string, any>>
  recoveryAttempts: Array<Record<string, any>>
  communicationThreads: Array<Record<string, any>>
  communicationEvents: Array<Record<string, any>>
  deliveryEvents: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  summary: {
    total: number
    today: number
    upcoming: number
    confirmationPending: number
    preparationPending: number
    live: number
    completed: number
    noShows: number
    recoveryOpen: number
    highValue: number
    atRisk: number
    conversionRate: number
    confirmedRate: number
    commercialValueMad: number
    valueAtRiskMad: number
    openCommitments: number
    waitingExternal: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type EngagementModalKind =
  | "schedule"
  | "participant"
  | "confirm"
  | "reschedule"
  | "cancel"
  | "communication"
  | "follow-up"
  | "no-show"
  | "recovery"
  | "preparation"
  | "note"
  | "objection"
  | "decision"
  | "commitment"
  | "outcome"
