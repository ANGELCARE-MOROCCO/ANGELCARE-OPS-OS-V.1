import type { AmbassadorRecord } from "../contracts"
import type { AmbassadorSettingsConfiguration } from "./contracts"

export const DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION: AmbassadorSettingsConfiguration = {
  schemaVersion: 1,
  program: {
    programName: "AngelCare Ambassador Network",
    programCode: "AC-AMB",
    status: "active",
    country: "Morocco",
    defaultRegion: "Rabat / Casablanca",
    activeCities: ["Rabat", "Casablanca"],
    serviceLines: ["Home Service", "Academy", "Kindergarten & Preschool", "Hospitality Kids Friendly", "Corporates Liner"],
    defaultLanguage: "fr",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    applicationOpen: true,
    capacityTarget: 100,
    maximumActiveAmbassadors: 250,
    programOwner: "Market OS Manager",
    complianceOwner: "Compliance Manager",
    financeOwner: "Finance Operations",
    defaultCoordinator: "Ambassador Program Coordinator",
  },
  recruitment: {
    minimumAge: 18,
    requiredFields: ["Full name", "Email", "Phone", "City", "CIN / Passport"],
    requiredDocuments: ["CIN / Passport", "CV", "Signed program acknowledgement"],
    acceptedCities: ["Rabat", "Casablanca"],
    requiredLanguages: ["French", "Arabic"],
    duplicatePolicy: "email_or_phone",
    stages: ["sourced", "screened", "interview", "approved", "converted"],
    interviewMinimumScore: 70,
    automaticRejectionReasons: ["Identity could not be verified", "Conflict of interest", "Mandatory documentation missing"],
    allowManualExceptions: true,
    candidateRetentionDays: 730,
    conversionRequiresApproval: true,
  },
  onboarding: {
    mandatorySteps: ["Profile verified", "Files collected", "Orientation completed", "Training assigned", "Territory confirmed"],
    completionDeadlineDays: 10,
    profileVerificationRequired: true,
    contractAcknowledgementRequired: true,
    bankDetailsRequired: true,
    territoryConfirmationRequired: true,
    managerApprovalRequired: true,
    automaticReminderHours: 24,
    escalationAfterHours: 48,
    suspendOnExpiredDocuments: true,
  },
  training: {
    mandatoryPrograms: ["AngelCare brand and ethics", "Child safeguarding", "Field sales doctrine", "Lead qualification", "Proof and compliance"],
    certificationMinimumScore: 80,
    maximumAttempts: 2,
    fieldShadowingRequired: true,
    certificationValidityDays: 365,
    recertificationReminderDays: 30,
    suspendOnCertificationExpiry: true,
    highRiskMissionCertificationRequired: true,
    authorizedCertifierRoles: ["ambassador_admin", "market_manager", "compliance"],
  },
  territories: {
    hierarchyLevels: ["Country", "Region", "City", "Zone", "Sector"],
    maximumAmbassadorsPerTerritory: 25,
    exclusivePrimaryAssignment: true,
    managerApprovalRequired: true,
    allowBackupAssignments: true,
    allowTemporaryAssignments: true,
    defaultAssignmentDays: 90,
    travelRadiusKm: 50,
    uncoveredTerritoryEscalationHours: 24,
  },
  missions: {
    allowedMissionTypes: ["field_activation", "lead_generation", "partner_visit", "event_support", "content_activation"],
    maximumConcurrentMissions: 4,
    acceptanceDeadlineHours: 24,
    proofRequired: true,
    managerReviewRequired: true,
    locationEvidenceRequired: true,
    checkpointRequired: true,
    cancellationReasons: ["Client cancellation", "Safety concern", "Ambassador unavailable", "Operational conflict"],
    incidentEscalationHours: 1,
    completionRequiresApprovedProof: true,
  },
  attribution: {
    requiredLeadFields: ["Lead name", "Phone", "City", "Service interest", "Ambassador"],
    duplicateLeadPolicy: "manual_review",
    attributionWindowDays: 30,
    promoCodeAttributionEnabled: true,
    referralLinkAttributionEnabled: true,
    manualAttributionRequiresApproval: true,
    conversionProofRequired: true,
    validationAuthorityRoles: ["market_manager", "compliance", "ambassador_admin"],
    refundReversesAttribution: true,
    disputeWindowDays: 15,
  },
  rewards: {
    defaultCommissionRate: 10,
    minimumPayoutMad: 250,
    payoutCycle: "monthly",
    financeApprovalRequired: true,
    proofRequiredBeforeReward: true,
    paymentReferenceRequired: true,
    refundReversesReward: true,
    maximumRewardMad: 25000,
    temporaryBonusEnabled: false,
    temporaryBonusRate: 0,
    temporaryBonusEndsAt: null,
  },
  kpis: {
    dailyContactsTarget: 20,
    dailyQualifiedLeadsTarget: 5,
    monthlyConversionsTarget: 6,
    monthlyRevenueTargetMad: 25000,
    followUpSlaHours: 24,
    inactivityThresholdDays: 7,
    coachingTriggerScore: 65,
    suspensionTriggerScore: 40,
    weights: { activity: 20, leads: 20, conversions: 30, quality: 20, compliance: 10 },
  },
  communications: {
    enabledChannels: ["email", "whatsapp", "in_app"],
    dailyReportRequired: true,
    blockedEscalationHours: 24,
    trainingExpiryReminderDays: 30,
    proofRevisionReminderHours: 24,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
    consentRequired: true,
    maximumDeliveryAttempts: 3,
  },
  governance: {
    separationOfDutiesRequired: true,
    dualApprovalForFinanceChanges: true,
    complianceApprovalForPrivacyChanges: true,
    sessionMaximumHours: 12,
    exportAllowedRoles: ["ambassador_admin", "market_manager", "finance", "compliance"],
    emergencyAccessEnabled: false,
    emergencyAccessMaximumMinutes: 60,
    configurationChangeReasonRequired: true,
    publicationRequiresValidation: true,
    rollbackRequiresDirector: true,
  },
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : fallback
}

export function configurationFromLegacySettings(settings: AmbassadorRecord | null | undefined): AmbassadorSettingsConfiguration {
  const source = record(settings)
  const approval = record(source.approval_rules)
  const incentive = record(source.incentive_rules)
  const onboarding = record(source.onboarding_rules)
  const training = record(source.training_rules)
  const kpis = record(source.kpi_rules)
  const notifications = record(source.notification_rules)
  const base = structuredClone(DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION)

  base.program.defaultRegion = String(source.default_region || base.program.defaultRegion)
  base.onboarding.mandatorySteps = stringArray(onboarding.mandatory_steps, base.onboarding.mandatorySteps)
  base.training.certificationMinimumScore = Number(training.certification_min_score ?? base.training.certificationMinimumScore)
  base.training.fieldShadowingRequired = Boolean(training.field_shadowing_required ?? base.training.fieldShadowingRequired)
  base.kpis.dailyContactsTarget = Number(kpis.default_daily_contacts ?? base.kpis.dailyContactsTarget)
  base.kpis.dailyQualifiedLeadsTarget = Number(kpis.default_daily_leads ?? base.kpis.dailyQualifiedLeadsTarget)
  base.communications.dailyReportRequired = Boolean(notifications.daily_report_required ?? base.communications.dailyReportRequired)
  base.communications.blockedEscalationHours = Number(notifications.escalation_when_blocked_hours ?? base.communications.blockedEscalationHours)
  base.rewards.financeApprovalRequired = Boolean(approval.payout_requires_manager_validation ?? base.rewards.financeApprovalRequired)
  base.rewards.proofRequiredBeforeReward = Boolean(approval.proof_required_before_payment ?? base.rewards.proofRequiredBeforeReward)
  base.rewards.payoutCycle = ["weekly", "biweekly", "monthly"].includes(String(incentive.payout_cycle))
    ? String(incentive.payout_cycle) as "weekly" | "biweekly" | "monthly"
    : base.rewards.payoutCycle

  return base
}

export function legacySettingsProjection(configuration: AmbassadorSettingsConfiguration): AmbassadorRecord {
  return {
    default_region: configuration.program.defaultRegion,
    approval_rules: {
      payout_requires_manager_validation: configuration.rewards.financeApprovalRequired,
      proof_required_before_payment: configuration.rewards.proofRequiredBeforeReward,
      child_image_publication_blocked_without_written_authorization: configuration.communications.consentRequired,
    },
    incentive_rules: {
      currency: configuration.program.currency,
      payment_states: ["pending", "approved", "rejected", "paid"],
      payout_cycle: configuration.rewards.payoutCycle,
      default_commission_rate: configuration.rewards.defaultCommissionRate,
      minimum_payout_mad: configuration.rewards.minimumPayoutMad,
    },
    onboarding_rules: {
      mandatory_steps: configuration.onboarding.mandatorySteps,
      completion_deadline_days: configuration.onboarding.completionDeadlineDays,
      manager_approval_required: configuration.onboarding.managerApprovalRequired,
    },
    training_rules: {
      certification_min_score: configuration.training.certificationMinimumScore,
      field_shadowing_required: configuration.training.fieldShadowingRequired,
      certification_validity_days: configuration.training.certificationValidityDays,
    },
    kpi_rules: {
      default_daily_contacts: configuration.kpis.dailyContactsTarget,
      default_daily_leads: configuration.kpis.dailyQualifiedLeadsTarget,
      hot_lead_requires_call_followup: true,
      monthly_conversions_target: configuration.kpis.monthlyConversionsTarget,
      monthly_revenue_target_mad: configuration.kpis.monthlyRevenueTargetMad,
    },
    notification_rules: {
      daily_report_required: configuration.communications.dailyReportRequired,
      escalation_when_blocked_hours: configuration.communications.blockedEscalationHours,
      enabled_channels: configuration.communications.enabledChannels,
    },
  }
}
