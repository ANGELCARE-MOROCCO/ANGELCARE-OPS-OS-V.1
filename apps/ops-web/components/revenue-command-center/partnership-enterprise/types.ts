export type PartnershipExperienceKey =
  | "partnership-command"
  | "partner-dossier"
  | "partner-decision-map"
  | "partner-qualification-dossier"
  | "partner-recovery-dossier"
  | "partner-referrals-dossier"
  | "decision-map-command"
  | "executive-command"
  | "growth-command"
  | "high-value-command"
  | "meetings-command"
  | "create-partnership"
  | "performance-command"
  | "pipeline-command"
  | "qualification-command"
  | "recovery-command"
  | "referral-command"
  | "risk-command"

export type PartnershipRecord = {
  id: string
  partner_name?: string | null
  entity_name?: string | null
  account_name?: string | null
  account_id?: string | null
  prospect_text_id?: string | null
  partner_type?: string | null
  sector?: string | null
  city?: string | null
  territory?: string | null
  stage?: string | null
  status?: string | null
  priority?: string | null
  strategic_tier?: string | null
  qualification_status?: string | null
  activation_status?: string | null
  health_status?: string | null
  health_score?: number | null
  estimated_value_mad?: number | null
  attributed_pipeline_mad?: number | null
  attributed_realized_mad?: number | null
  owner?: string | null
  owner_id?: string | null
  contract_id?: string | null
  renewal_date?: string | null
  last_activity_at?: string | null
  next_action?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

export type PartnershipPortfolio = {
  partnerships: PartnershipRecord[]
  stakeholders: Array<Record<string, any>>
  qualifications: Array<Record<string, any>>
  programs: Array<Record<string, any>>
  programLocations: Array<Record<string, any>>
  programServices: Array<Record<string, any>>
  benefits: Array<Record<string, any>>
  benefitUsage: Array<Record<string, any>>
  obligations: Array<Record<string, any>>
  milestones: Array<Record<string, any>>
  activationPlans: Array<Record<string, any>>
  activationGates: Array<Record<string, any>>
  referrals: Array<Record<string, any>>
  referralHistory: Array<Record<string, any>>
  attributions: Array<Record<string, any>>
  attributionConflicts: Array<Record<string, any>>
  performancePeriods: Array<Record<string, any>>
  performanceMetrics: Array<Record<string, any>>
  scorecards: Array<Record<string, any>>
  reviews: Array<Record<string, any>>
  risks: Array<Record<string, any>>
  recoveryPlans: Array<Record<string, any>>
  recoveryCheckpoints: Array<Record<string, any>>
  renewals: Array<Record<string, any>>
  expansions: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  closures: Array<Record<string, any>>
  contracts: Array<Record<string, any>>
  realizationEvents: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  communications: Array<Record<string, any>>
  meetings: Array<Record<string, any>>
  summary: {
    total: number
    qualifying: number
    active: number
    performing: number
    atRisk: number
    recovery: number
    renewalDue: number
    expansionReady: number
    referralCount: number
    acceptedReferrals: number
    attributedReferrals: number
    openConflicts: number
    openObligations: number
    overdueObligations: number
    openRisks: number
    pipelineMad: number
    contractedMad: number
    realizedMad: number
    averageHealth: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type PartnershipActionKind =
  | "create-partnership" | "edit-partnership" | "classify-partner"
  | "complete-qualification" | "disqualify-partner" | "add-stakeholder"
  | "edit-stakeholder" | "create-decision-map" | "create-opportunity"
  | "define-model" | "create-program" | "add-program-location"
  | "add-program-service" | "define-partner-benefit" | "define-angelcare-benefit"
  | "approve-benefit" | "record-benefit-usage" | "define-obligation"
  | "complete-obligation" | "record-obligation-breach" | "add-milestone"
  | "complete-milestone" | "create-activation-plan" | "add-activation-gate"
  | "evaluate-activation" | "approve-launch" | "register-referral"
  | "review-duplicate-referral" | "accept-referral" | "reject-referral"
  | "link-existing-prospect" | "convert-referral" | "link-opportunity"
  | "create-attribution" | "raise-attribution-conflict" | "resolve-attribution-conflict"
  | "override-attribution" | "create-performance-period" | "set-targets"
  | "record-performance-result" | "complete-partner-review" | "create-corrective-action"
  | "launch-recovery-plan" | "complete-recovery-checkpoint" | "prepare-renewal"
  | "approve-renewal" | "launch-renewal-proposal" | "launch-renewal-negotiation"
  | "create-expansion-assessment" | "approve-expansion" | "suspend-partnership"
  | "terminate-partnership" | "close-partnership" | "evidence-viewer"
  | "referral-history" | "attribution-history" | "performance-history" | "partner-audit"
