export type CampaignExperienceKey =
  | "campaign-command"
  | "campaign-create-studio"
  | "campaign-board"
  | "campaign-dossier"
  | "campaign-assets-studio"
  | "campaign-live-room"
  | "campaign-performance"
  | "sdr-command"

export type CampaignRecord = {
  id: string
  reference?: string | null
  name?: string | null
  audience?: string | null
  objective?: string | null
  channel?: string | null
  channel_mix?: string[] | null
  campaign_type?: string | null
  status?: string | null
  priority?: string | null
  owner?: string | null
  owner_id?: string | null
  sdr_lead?: string | null
  budget_mad?: number | null
  launch_at?: string | null
  end_at?: string | null
  completed_at?: string | null
  approval_status?: string | null
  readiness_status?: string | null
  audience_mode?: string | null
  attribution_model?: string | null
  attribution_window_days?: number | null
  frequency_policy?: Record<string, unknown> | null
  strategy?: Record<string, unknown> | null
  performance?: Record<string, unknown> | null
  assets?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  archived_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type CampaignPortfolio = {
  campaigns: CampaignRecord[]
  segments: Array<Record<string, any>>
  segmentVersions: Array<Record<string, any>>
  audienceSnapshots: Array<Record<string, any>>
  audienceMembers: Array<Record<string, any>>
  recipients: Array<Record<string, any>>
  eligibility: Array<Record<string, any>>
  suppressions: Array<Record<string, any>>
  frequencyDecisions: Array<Record<string, any>>
  sequences: Array<Record<string, any>>
  sequenceVersions: Array<Record<string, any>>
  sequenceSteps: Array<Record<string, any>>
  sequenceBranches: Array<Record<string, any>>
  templates: Array<Record<string, any>>
  templateVersions: Array<Record<string, any>>
  enrollments: Array<Record<string, any>>
  stepExecutions: Array<Record<string, any>>
  dispatchAttempts: Array<Record<string, any>>
  replies: Array<Record<string, any>>
  sdrAssignments: Array<Record<string, any>>
  providerReadiness: Array<Record<string, any>>
  senderReadiness: Array<Record<string, any>>
  conversionEvents: Array<Record<string, any>>
  attributions: Array<Record<string, any>>
  attributionConflicts: Array<Record<string, any>>
  costs: Array<Record<string, any>>
  performancePeriods: Array<Record<string, any>>
  experiments: Array<Record<string, any>>
  experimentVariants: Array<Record<string, any>>
  risks: Array<Record<string, any>>
  recoveryPlans: Array<Record<string, any>>
  recoveryCheckpoints: Array<Record<string, any>>
  evidence: Array<Record<string, any>>
  approvals: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  communications: Array<Record<string, any>>
  deliveryEvents: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  appointments: Array<Record<string, any>>
  opportunities: Array<Record<string, any>>
  proposals: Array<Record<string, any>>
  contracts: Array<Record<string, any>>
  realizationEvents: Array<Record<string, any>>
  senderIdentities: Array<Record<string, any>>
  summary: {
    total: number
    draft: number
    approvalRequired: number
    scheduled: number
    active: number
    paused: number
    atRisk: number
    completed: number
    eligibleAudience: number
    enrolled: number
    contacted: number
    replies: number
    positiveReplies: number
    meetings: number
    opportunities: number
    proposals: number
    contracts: number
    realizedMad: number
    estimatedCostMad: number
    confirmedCostMad: number
    openSuppressions: number
    providerFailures: number
    sdrBacklog: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type CampaignActionKind =
  | "create-campaign"
  | "edit-campaign"
  | "transition-campaign"
  | "create-segment"
  | "freeze-audience"
  | "evaluate-eligibility"
  | "suppress-recipient"
  | "remove-suppression"
  | "create-sequence"
  | "add-sequence-step"
  | "approve-sequence"
  | "create-template"
  | "approve-template"
  | "record-provider-readiness"
  | "record-sender-readiness"
  | "evaluate-readiness"
  | "request-approval"
  | "decide-approval"
  | "launch-campaign"
  | "pause-campaign"
  | "resume-campaign"
  | "emergency-stop"
  | "enroll-recipient"
  | "remove-recipient"
  | "dispatch-step"
  | "record-provider-event"
  | "record-reply"
  | "record-call-outcome"
  | "create-meeting-conversion"
  | "create-opportunity-conversion"
  | "create-attribution"
  | "raise-attribution-conflict"
  | "resolve-attribution-conflict"
  | "record-cost"
  | "create-performance-period"
  | "close-performance-period"
  | "create-experiment"
  | "create-recovery-plan"
  | "complete-recovery-checkpoint"
  | "record-evidence"

export type CampaignActionDefinition = {
  kind: CampaignActionKind
  label: string
  description: string
  endpoint: string
  method: "POST" | "PATCH"
  tone?: "primary" | "neutral" | "warning" | "danger"
  requiresCampaign?: boolean
  fields: Array<{
    key: string
    label: string
    type?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "checkbox"
    required?: boolean
    options?: string[]
    placeholder?: string
    defaultValue?: string | number | boolean
  }>
}
