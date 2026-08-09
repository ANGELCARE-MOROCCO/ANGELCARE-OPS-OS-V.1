export type B2CExperienceKey =
  | "b2c-command"
  | "family-dossier"
  | "family-care-start-dossier"
  | "family-consultation-dossier"
  | "family-intake-dossier"
  | "family-matching-dossier"
  | "family-onboarding-dossier"
  | "family-qualification-dossier"
  | "family-recovery-dossier"
  | "active-families-command"
  | "b2c-analytics-command"
  | "care-start-command"
  | "consultation-command"
  | "b2c-executive-command"
  | "high-value-family-command"
  | "intake-command"
  | "matching-command"
  | "create-family-studio"
  | "onboarding-command"
  | "b2c-pipeline-command"
  | "qualification-command"
  | "recovery-command"
  | "retention-command"
  | "b2c-risk-command"

export type B2CCaseRecord = {
  id: string
  family_reference?: string | null
  parent_name?: string | null
  family_name?: string | null
  city?: string | null
  service_interest?: string | null
  stage?: string | null
  status?: string | null
  priority?: string | null
  urgency?: string | null
  estimated_value_mad?: number | null
  owner?: string | null
  owner_id?: string | null
  phone?: string | null
  email?: string | null
  preferred_channel?: string | null
  prospect_text_id?: string | null
  account_id?: string | null
  opportunity_id?: string | null
  accepted_proposal_id?: string | null
  contract_id?: string | null
  operational_handoff_id?: string | null
  intake_status?: string | null
  qualification_status?: string | null
  consultation_status?: string | null
  recommendation_status?: string | null
  quote_status?: string | null
  matching_status?: string | null
  onboarding_status?: string | null
  activation_status?: string | null
  care_start_status?: string | null
  relationship_status?: string | null
  retention_status?: string | null
  risk_status?: string | null
  satisfaction_score?: number | null
  desired_start_date?: string | null
  next_action?: string | null
  next_action_at?: string | null
  last_activity_at?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

export type B2CPortfolio = {
  cases: B2CCaseRecord[]
  guardians: Array<Record<string, any>>
  beneficiaries: Array<Record<string, any>>
  requirements: Array<Record<string, any>>
  needsAssessments: Array<Record<string, any>>
  consultations: Array<Record<string, any>>
  recommendations: Array<Record<string, any>>
  matchingCycles: Array<Record<string, any>>
  matchingCandidates: Array<Record<string, any>>
  matchingDecisions: Array<Record<string, any>>
  onboardingPlans: Array<Record<string, any>>
  onboardingItems: Array<Record<string, any>>
  activationGates: Array<Record<string, any>>
  careStarts: Array<Record<string, any>>
  satisfactionChecks: Array<Record<string, any>>
  complaints: Array<Record<string, any>>
  retentionRisks: Array<Record<string, any>>
  retentionPlans: Array<Record<string, any>>
  recoveryPlans: Array<Record<string, any>>
  recoveryCheckpoints: Array<Record<string, any>>
  emergencyContacts: Array<Record<string, any>>
  familyInstructions: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  evidence: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  communications: Array<Record<string, any>>
  appointments: Array<Record<string, any>>
  proposals: Array<Record<string, any>>
  contracts: Array<Record<string, any>>
  paymentConfirmations: Array<Record<string, any>>
  operationalHandoffs: Array<Record<string, any>>
  summary: {
    total: number
    newLeads: number
    intakePending: number
    qualified: number
    consultationPending: number
    quoted: number
    matching: number
    onboarding: number
    activationBlocked: number
    activeFamilies: number
    retentionRisk: number
    recovery: number
    highValue: number
    pipelineMad: number
    contractedMad: number
    realizedMad: number
    averageSatisfaction: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type B2CActionKind =
  | "create-family" | "edit-family" | "transition-case"
  | "add-guardian" | "add-beneficiary" | "add-emergency-contact" | "add-family-instruction"
  | "add-service-requirement" | "update-service-requirement"
  | "create-needs-assessment" | "complete-needs-assessment"
  | "schedule-consultation" | "record-consultation"
  | "create-recommendation" | "approve-recommendation"
  | "create-matching-cycle" | "add-match-candidate" | "verify-availability"
  | "reject-candidate" | "present-match" | "accept-match" | "reject-match" | "rematch"
  | "create-onboarding" | "add-onboarding-item" | "complete-onboarding-item"
  | "evaluate-activation" | "approve-activation" | "create-operational-handoff"
  | "accept-operational-handoff" | "authorize-care-start" | "record-care-start"
  | "record-satisfaction" | "record-feedback"
  | "create-complaint" | "contain-complaint" | "close-complaint"
  | "create-retention-risk" | "launch-retention-plan" | "close-retention-plan"
  | "create-recovery-plan" | "add-recovery-checkpoint" | "complete-recovery-checkpoint"
  | "create-extension" | "launch-renewal-quote" | "launch-upsell-quote"
  | "link-contract" | "link-payment" | "record-cancellation" | "close-case"
  | "record-evidence" | "timeline-viewer" | "audit-viewer"
