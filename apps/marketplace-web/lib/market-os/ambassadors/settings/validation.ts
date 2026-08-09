import { DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION } from "./defaults"
import type {
  AmbassadorSettingsConfiguration,
  AmbassadorSettingsValidationIssue,
  AmbassadorSettingsValidationResult,
  SettingsApprovalDomain,
} from "./contracts"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T
  if (!isRecord(base) || !isRecord(patch)) return (patch === undefined ? base : patch) as T
  const next: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    const current = next[key]
    next[key] = isRecord(current) && isRecord(value) ? deepMerge(current, value) : Array.isArray(current) ? (Array.isArray(value) ? value : current) : value
  }
  return next as T
}

export function normalizeSettingsConfiguration(value: unknown): AmbassadorSettingsConfiguration {
  const merged = deepMerge(structuredClone(DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION), isRecord(value) ? value : {})
  merged.schemaVersion = 1
  return merged
}

function issue(
  issues: AmbassadorSettingsValidationIssue[],
  path: string,
  severity: "error" | "warning",
  code: string,
  message: string,
): void {
  issues.push({ path, severity, code, message })
}

function nonEmpty(values: string[]): string[] {
  return values.map((value) => String(value).trim()).filter(Boolean)
}

export function changedSettingsDomains(
  before: AmbassadorSettingsConfiguration,
  after: AmbassadorSettingsConfiguration,
): string[] {
  return (Object.keys(after) as Array<keyof AmbassadorSettingsConfiguration>)
    .filter((key) => key !== "schemaVersion" && JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map(String)
}

export function requiredApprovalsForConfiguration(
  before: AmbassadorSettingsConfiguration,
  after: AmbassadorSettingsConfiguration,
): SettingsApprovalDomain[] {
  const changed = new Set(changedSettingsDomains(before, after))
  const approvals = new Set<SettingsApprovalDomain>(["program"])
  if (["training", "missions", "attribution", "communications"].some((domain) => changed.has(domain))) approvals.add("compliance")
  if (changed.has("rewards")) approvals.add("finance")
  if (changed.has("governance")) approvals.add("system")
  return [...approvals]
}

export function validateSettingsConfiguration(
  input: unknown,
  previous: AmbassadorSettingsConfiguration = DEFAULT_AMBASSADOR_SETTINGS_CONFIGURATION,
): AmbassadorSettingsValidationResult {
  const config = normalizeSettingsConfiguration(input)
  const issues: AmbassadorSettingsValidationIssue[] = []

  if (!config.program.programName.trim()) issue(issues, "program.programName", "error", "PROGRAM_NAME_REQUIRED", "Program name is required.")
  if (!config.program.programCode.trim()) issue(issues, "program.programCode", "error", "PROGRAM_CODE_REQUIRED", "Program code is required.")
  if (!config.program.activeCities.length) issue(issues, "program.activeCities", "error", "ACTIVE_CITY_REQUIRED", "At least one active city is required.")
  if (config.program.capacityTarget < 1) issue(issues, "program.capacityTarget", "error", "INVALID_CAPACITY", "Capacity target must be greater than zero.")
  if (config.program.maximumActiveAmbassadors < config.program.capacityTarget) {
    issue(issues, "program.maximumActiveAmbassadors", "warning", "CAPACITY_BELOW_TARGET", "Maximum active Ambassadors is below the capacity target.")
  }
  if (config.program.currency !== "MAD") issue(issues, "program.currency", "error", "CURRENCY_LOCKED", "Ambassador financial rules must use MAD internally.")

  if (config.recruitment.minimumAge < 18) issue(issues, "recruitment.minimumAge", "error", "MINIMUM_AGE", "Minimum Ambassador age cannot be below 18.")
  if (!nonEmpty(config.recruitment.requiredFields).some((field) => /email|phone/i.test(field))) {
    issue(issues, "recruitment.requiredFields", "error", "IDENTITY_FIELD_REQUIRED", "Recruitment requires an email or phone identity field for deduplication.")
  }
  if (config.recruitment.interviewMinimumScore < 0 || config.recruitment.interviewMinimumScore > 100) {
    issue(issues, "recruitment.interviewMinimumScore", "error", "INVALID_SCORE", "Interview score must be between 0 and 100.")
  }
  if (!config.recruitment.stages.includes("approved") || !config.recruitment.stages.includes("converted")) {
    issue(issues, "recruitment.stages", "error", "RECRUITMENT_GATE_MISSING", "Recruitment must preserve approved and converted lifecycle gates.")
  }

  if (!config.onboarding.mandatorySteps.length) issue(issues, "onboarding.mandatorySteps", "error", "ONBOARDING_STEPS_REQUIRED", "At least one onboarding step is required.")
  if (config.onboarding.completionDeadlineDays < 1) issue(issues, "onboarding.completionDeadlineDays", "error", "INVALID_DEADLINE", "Onboarding deadline must be at least one day.")
  if (!config.onboarding.profileVerificationRequired) issue(issues, "onboarding.profileVerificationRequired", "warning", "PROFILE_GATE_DISABLED", "Disabling profile verification weakens activation controls.")

  if (config.training.certificationMinimumScore < 60 || config.training.certificationMinimumScore > 100) {
    issue(issues, "training.certificationMinimumScore", "error", "CERTIFICATION_SCORE", "Certification minimum score must be between 60 and 100.")
  }
  if (config.training.maximumAttempts < 1) issue(issues, "training.maximumAttempts", "error", "TRAINING_ATTEMPTS", "At least one certification attempt is required.")
  if (config.training.certificationValidityDays < 30) issue(issues, "training.certificationValidityDays", "warning", "SHORT_CERTIFICATION", "Certification validity below 30 days may create excessive operational suspension.")

  if (config.territories.maximumAmbassadorsPerTerritory < 1) issue(issues, "territories.maximumAmbassadorsPerTerritory", "error", "TERRITORY_CAPACITY", "Territory capacity must be greater than zero.")
  if (config.territories.travelRadiusKm < 0) issue(issues, "territories.travelRadiusKm", "error", "TRAVEL_RADIUS", "Travel radius cannot be negative.")

  if (config.missions.maximumConcurrentMissions < 1) issue(issues, "missions.maximumConcurrentMissions", "error", "MISSION_CAPACITY", "At least one concurrent mission must be allowed.")
  if (config.missions.completionRequiresApprovedProof && !config.missions.proofRequired) {
    issue(issues, "missions.proofRequired", "error", "PROOF_CONFLICT", "Mission completion cannot require approved proof while proof collection is disabled.")
  }
  if (!config.missions.allowedMissionTypes.length) issue(issues, "missions.allowedMissionTypes", "error", "MISSION_TYPE_REQUIRED", "At least one mission type is required.")

  if (config.attribution.attributionWindowDays < 1) issue(issues, "attribution.attributionWindowDays", "error", "ATTRIBUTION_WINDOW", "Attribution window must be at least one day.")
  if (!config.attribution.validationAuthorityRoles.length) issue(issues, "attribution.validationAuthorityRoles", "error", "VALIDATOR_REQUIRED", "At least one conversion validation authority is required.")

  if (config.rewards.defaultCommissionRate < 0 || config.rewards.defaultCommissionRate > 100) {
    issue(issues, "rewards.defaultCommissionRate", "error", "COMMISSION_RATE", "Commission rate must be between 0% and 100%.")
  }
  if (config.rewards.minimumPayoutMad < 0) issue(issues, "rewards.minimumPayoutMad", "error", "PAYOUT_THRESHOLD", "Minimum payout cannot be negative.")
  if (config.rewards.maximumRewardMad < config.rewards.minimumPayoutMad) {
    issue(issues, "rewards.maximumRewardMad", "error", "REWARD_CAP", "Maximum reward cannot be below the minimum payout threshold.")
  }
  if (config.rewards.temporaryBonusEnabled && config.rewards.temporaryBonusRate <= 0) {
    issue(issues, "rewards.temporaryBonusRate", "error", "BONUS_RATE", "An enabled temporary bonus requires a positive rate.")
  }
  if (!config.rewards.proofRequiredBeforeReward) {
    issue(issues, "rewards.proofRequiredBeforeReward", "error", "REWARD_EVIDENCE_FLOOR", "Production reward approval cannot bypass approved proof or validated conversion evidence.")
  }
  if (!config.rewards.paymentReferenceRequired) {
    issue(issues, "rewards.paymentReferenceRequired", "error", "PAYMENT_REFERENCE_FLOOR", "Production payout execution requires an immutable payment reference.")
  }
  if (!config.rewards.financeApprovalRequired) {
    issue(issues, "rewards.financeApprovalRequired", "error", "FINANCE_APPROVAL_FLOOR", "Production payout governance requires finance approval.")
  }

  const weightTotal = Object.values(config.kpis.weights).reduce((sum, value) => sum + Number(value || 0), 0)
  if (weightTotal !== 100) issue(issues, "kpis.weights", "error", "KPI_WEIGHT_TOTAL", `KPI weights must total 100; current total is ${weightTotal}.`)
  if (config.kpis.suspensionTriggerScore >= config.kpis.coachingTriggerScore) {
    issue(issues, "kpis.suspensionTriggerScore", "error", "KPI_TRIGGER_ORDER", "Suspension trigger must be lower than the coaching trigger.")
  }

  if (!config.communications.enabledChannels.length) issue(issues, "communications.enabledChannels", "warning", "NO_CHANNEL", "No communication channel is enabled.")
  if (config.communications.maximumDeliveryAttempts < 1) issue(issues, "communications.maximumDeliveryAttempts", "error", "DELIVERY_ATTEMPTS", "At least one delivery attempt is required.")

  if (!config.governance.separationOfDutiesRequired) issue(issues, "governance.separationOfDutiesRequired", "warning", "SOD_DISABLED", "Disabling separation of duties weakens finance and compliance governance.")
  if (!config.governance.publicationRequiresValidation) issue(issues, "governance.publicationRequiresValidation", "warning", "VALIDATION_DISABLED", "Publishing without validation increases production risk.")
  if (!config.governance.exportAllowedRoles.length) issue(issues, "governance.exportAllowedRoles", "error", "EXPORT_ROLE_REQUIRED", "At least one role must be authorized to export configuration evidence.")

  const errors = issues.filter((item) => item.severity === "error").length
  const warnings = issues.filter((item) => item.severity === "warning").length
  return {
    valid: errors === 0,
    score: Math.max(0, 100 - errors * 14 - warnings * 4),
    checkedAt: new Date().toISOString(),
    issues,
    requiredApprovals: requiredApprovalsForConfiguration(previous, config),
  }
}
