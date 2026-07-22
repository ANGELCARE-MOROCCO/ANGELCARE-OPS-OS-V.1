import type { AmbassadorRecord } from "../contracts"

export const SETTINGS_SCOPE_TYPES = [
  "organization",
  "program",
  "country",
  "region",
  "city",
  "territory",
  "service_line",
] as const

export type AmbassadorSettingsScopeType = (typeof SETTINGS_SCOPE_TYPES)[number]
export type AmbassadorSettingsVersionStatus =
  | "draft"
  | "revision_requested"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "superseded"
  | "rejected"
  | "rolled_back"
  | "cancelled"

export type SettingsApprovalDomain = "program" | "compliance" | "finance" | "system"
export type SettingsApprovalStatus = "pending" | "approved" | "rejected" | "revision_requested"

export type ProgramSettings = {
  programName: string
  programCode: string
  status: "active" | "paused" | "restricted" | "archived"
  country: string
  defaultRegion: string
  activeCities: string[]
  serviceLines: string[]
  defaultLanguage: "fr" | "en" | "ar"
  timezone: string
  currency: "MAD"
  applicationOpen: boolean
  capacityTarget: number
  maximumActiveAmbassadors: number
  programOwner: string
  complianceOwner: string
  financeOwner: string
  defaultCoordinator: string
}

export type RecruitmentSettings = {
  minimumAge: number
  requiredFields: string[]
  requiredDocuments: string[]
  acceptedCities: string[]
  requiredLanguages: string[]
  duplicatePolicy: "email_or_phone" | "email" | "phone"
  stages: string[]
  interviewMinimumScore: number
  automaticRejectionReasons: string[]
  allowManualExceptions: boolean
  candidateRetentionDays: number
  conversionRequiresApproval: boolean
}

export type OnboardingSettings = {
  mandatorySteps: string[]
  completionDeadlineDays: number
  profileVerificationRequired: boolean
  contractAcknowledgementRequired: boolean
  bankDetailsRequired: boolean
  territoryConfirmationRequired: boolean
  managerApprovalRequired: boolean
  automaticReminderHours: number
  escalationAfterHours: number
  suspendOnExpiredDocuments: boolean
}

export type TrainingSettings = {
  mandatoryPrograms: string[]
  certificationMinimumScore: number
  maximumAttempts: number
  fieldShadowingRequired: boolean
  certificationValidityDays: number
  recertificationReminderDays: number
  suspendOnCertificationExpiry: boolean
  highRiskMissionCertificationRequired: boolean
  authorizedCertifierRoles: string[]
}

export type TerritorySettings = {
  hierarchyLevels: string[]
  maximumAmbassadorsPerTerritory: number
  exclusivePrimaryAssignment: boolean
  managerApprovalRequired: boolean
  allowBackupAssignments: boolean
  allowTemporaryAssignments: boolean
  defaultAssignmentDays: number
  travelRadiusKm: number
  uncoveredTerritoryEscalationHours: number
}

export type MissionSettings = {
  allowedMissionTypes: string[]
  maximumConcurrentMissions: number
  acceptanceDeadlineHours: number
  proofRequired: boolean
  managerReviewRequired: boolean
  locationEvidenceRequired: boolean
  checkpointRequired: boolean
  cancellationReasons: string[]
  incidentEscalationHours: number
  completionRequiresApprovedProof: boolean
}

export type AttributionSettings = {
  requiredLeadFields: string[]
  duplicateLeadPolicy: "merge" | "reject" | "manual_review"
  attributionWindowDays: number
  promoCodeAttributionEnabled: boolean
  referralLinkAttributionEnabled: boolean
  manualAttributionRequiresApproval: boolean
  conversionProofRequired: boolean
  validationAuthorityRoles: string[]
  refundReversesAttribution: boolean
  disputeWindowDays: number
}

export type RewardSettings = {
  defaultCommissionRate: number
  minimumPayoutMad: number
  payoutCycle: "weekly" | "biweekly" | "monthly"
  financeApprovalRequired: boolean
  proofRequiredBeforeReward: boolean
  paymentReferenceRequired: boolean
  refundReversesReward: boolean
  maximumRewardMad: number
  temporaryBonusEnabled: boolean
  temporaryBonusRate: number
  temporaryBonusEndsAt: string | null
}

export type KpiSettings = {
  dailyContactsTarget: number
  dailyQualifiedLeadsTarget: number
  monthlyConversionsTarget: number
  monthlyRevenueTargetMad: number
  followUpSlaHours: number
  inactivityThresholdDays: number
  coachingTriggerScore: number
  suspensionTriggerScore: number
  weights: {
    activity: number
    leads: number
    conversions: number
    quality: number
    compliance: number
  }
}

export type CommunicationSettings = {
  enabledChannels: Array<"email" | "whatsapp" | "sms" | "in_app">
  dailyReportRequired: boolean
  blockedEscalationHours: number
  trainingExpiryReminderDays: number
  proofRevisionReminderHours: number
  quietHoursStart: string
  quietHoursEnd: string
  consentRequired: boolean
  maximumDeliveryAttempts: number
}

export type GovernanceSettings = {
  separationOfDutiesRequired: boolean
  dualApprovalForFinanceChanges: boolean
  complianceApprovalForPrivacyChanges: boolean
  sessionMaximumHours: number
  exportAllowedRoles: string[]
  emergencyAccessEnabled: boolean
  emergencyAccessMaximumMinutes: number
  configurationChangeReasonRequired: boolean
  publicationRequiresValidation: boolean
  rollbackRequiresDirector: boolean
}

export type AmbassadorSettingsConfiguration = {
  schemaVersion: 1
  program: ProgramSettings
  recruitment: RecruitmentSettings
  onboarding: OnboardingSettings
  training: TrainingSettings
  territories: TerritorySettings
  missions: MissionSettings
  attribution: AttributionSettings
  rewards: RewardSettings
  kpis: KpiSettings
  communications: CommunicationSettings
  governance: GovernanceSettings
}

export type AmbassadorSettingsValidationIssue = {
  path: string
  severity: "error" | "warning"
  code: string
  message: string
}

export type AmbassadorSettingsValidationResult = {
  valid: boolean
  score: number
  checkedAt: string
  issues: AmbassadorSettingsValidationIssue[]
  requiredApprovals: SettingsApprovalDomain[]
}

export type AmbassadorSettingsImpactSnapshot = {
  calculatedAt: string
  affectedAmbassadors: number
  affectedTerritories: number
  openMissions: number
  candidatesInPipeline: number
  pendingConversions: number
  pendingRewards: number
  pendingPayoutsMad: number
  projectedCommissionDeltaMad: number
  riskLevel: "low" | "medium" | "high" | "critical"
  warnings: string[]
}

export type AmbassadorSettingsVersion = AmbassadorRecord & {
  id: string
  revision: number
  title: string
  status: AmbassadorSettingsVersionStatus
  scope_type: AmbassadorSettingsScopeType
  scope_key: string
  configuration: AmbassadorSettingsConfiguration
  change_summary: string
  validation_result?: AmbassadorSettingsValidationResult | null
  impact_snapshot?: AmbassadorSettingsImpactSnapshot | null
  base_version_id?: string | null
  scheduled_for?: string | null
  effective_from?: string | null
  published_at?: string | null
  submitted_at?: string | null
  created_by_actor_id?: string | null
  updated_by_actor_id?: string | null
}

export type AmbassadorSettingsApproval = AmbassadorRecord & {
  id: string
  version_id: string
  approval_domain: SettingsApprovalDomain
  status: SettingsApprovalStatus
  decision_note?: string | null
  decided_by_actor_id?: string | null
  decided_at?: string | null
}

export type AmbassadorSettingsRuntimeEvent = AmbassadorRecord & {
  id: string
  version_id?: string | null
  event_type: string
  status: string
  summary: string
  details?: Record<string, unknown>
}

export type AmbassadorSettingsActorCapabilities = {
  canRead: boolean
  canDraft: boolean
  canValidate: boolean
  canSubmit: boolean
  canApprove: boolean
  canPublish: boolean
  canRollback: boolean
  canProcessRuntime: boolean
  approvalDomains: SettingsApprovalDomain[]
}

export type AmbassadorSettingsControlCenterSnapshot = {
  effectiveVersion: AmbassadorSettingsVersion | null
  effectiveConfiguration: AmbassadorSettingsConfiguration
  drafts: AmbassadorSettingsVersion[]
  versions: AmbassadorSettingsVersion[]
  approvals: AmbassadorSettingsApproval[]
  runtimeEvents: AmbassadorSettingsRuntimeEvent[]
  scheduledPublications: AmbassadorRecord[]
  activeScopes: AmbassadorRecord[]
  actor: {
    displayName: string
    roleKey: string
    tenantId: string
    organizationId: string
  }
  capabilities: AmbassadorSettingsActorCapabilities
  diagnostics: Array<{ severity: "info" | "warning" | "error"; message: string }>
  loadedAt: string
}
