import type {
  AmbassadorChecklistItem,
  AmbassadorDashboardKpis,
  AmbassadorEntity,
  AmbassadorWorkspaceSnapshot,
  JsonObject,
  JsonValue,
} from "./types"

export type ValidationResult<T extends Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown }

const todayIso = () => new Date().toISOString()

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function readPayload(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

export function asNullableString(value: unknown): string | null {
  const normalized = asString(value)
  return normalized ? normalized : null
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function asJsonObject(value: unknown): JsonObject {
  if (!isRecord(value)) return {}
  return Object.entries(value).reduce<JsonObject>((acc, [key, item]) => {
    acc[key] = toJsonValue(item)
    return acc
  }, {})
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }
  if (Array.isArray(value)) return value.map(toJsonValue)
  if (isRecord(value)) return asJsonObject(value)
  return String(value)
}

export function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}

export function normalizeChecklist(value: unknown): AmbassadorChecklistItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (typeof item === "string") {
        return { id: `step-${index + 1}`, label: item.trim(), done: false }
      }
      if (!isRecord(item)) return null
      const label = asString(item.label || item.title || item.name)
      if (!label) return null
      return {
        id: asString(item.id, `step-${index + 1}`),
        label,
        done: Boolean(item.done || item.completed),
        completed_at: asNullableString(item.completed_at),
      }
    })
    .filter((item): item is AmbassadorChecklistItem => Boolean(item))
}

export function calculateCompletionRate(checklist: AmbassadorChecklistItem[]): number {
  if (!checklist.length) return 0
  const done = checklist.filter((item) => item.done).length
  return Math.round((done / checklist.length) * 100)
}

export function calculateGoalCompletion(currentValue: number, targetValue: number): number {
  if (!targetValue || targetValue <= 0) return 0
  return Math.max(0, Math.min(999, Math.round((currentValue / targetValue) * 100)))
}

export function normalizeAmbassadorPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const fullName = asString(body.full_name ?? body.fullName ?? body.name ?? body.display_name)
  if (!partial && !fullName) return { ok: false, error: "Ambassador full name is required" }
  const now = todayIso()
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      full_name: fullName || undefined,
      name: fullName || undefined,
      display_name: (asNullableString(body.display_name ?? body.displayName) ?? fullName) || undefined,
      email: asNullableString(body.email),
      phone: asNullableString(body.phone),
      city: asNullableString(body.city),
      region: asNullableString(body.region),
      territory_id: asNullableString(body.territory_id ?? body.territoryId),
      territory_name: asNullableString(body.territory_name ?? body.territoryName ?? body.territory),
      territory: asNullableString(body.territory_name ?? body.territoryName ?? body.territory),
      role: asNullableString(body.role ?? body.title),
      title: asNullableString(body.title ?? body.role),
      status: asString(body.status, "active").toLowerCase(),
      lifecycle_stage: asString(body.lifecycle_stage ?? body.lifecycleStage, "active").toLowerCase(),
      manager_id: asNullableString(body.manager_id ?? body.managerId),
      manager_name: asNullableString(body.manager_name ?? body.managerName),
      recruitment_stage: asNullableString(body.recruitment_stage ?? body.recruitmentStage),
      onboarding_stage: asNullableString(body.onboarding_stage ?? body.onboardingStage),
      training_status: asNullableString(body.training_status ?? body.trainingStatus),
      certification_status: asNullableString(body.certification_status ?? body.certificationStatus),
      performance_score: asNumber(body.performance_score ?? body.performanceScore ?? body.score, 0),
      score: asNumber(body.performance_score ?? body.performanceScore ?? body.score, 0),
      kpi_score: asNumber(body.kpi_score ?? body.kpiScore, 0),
      missions_completed: asNumber(body.missions_completed ?? body.missionsCompleted, 0),
      missions_assigned: asNumber(body.missions_assigned ?? body.missionsAssigned, 0),
      incentives_balance: asNumber(body.incentives_balance ?? body.incentivesBalance, 0),
      last_activity_at: asNullableString(body.last_activity_at ?? body.lastActivityAt) ?? now,
      joined_at: asNullableString(body.joined_at ?? body.joinedAt),
      metadata: asJsonObject(body.metadata),
      updated_at: now,
    }),
  }
}

export function normalizeTerritoryPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const name = asString(body.name ?? body.title)
  if (!partial && !name) return { ok: false, error: "Territory name is required" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      name: name || undefined,
      title: name || undefined,
      city: asNullableString(body.city),
      region: asNullableString(body.region),
      zone: asNullableString(body.zone),
      coverage_goal: asNumber(body.coverage_goal ?? body.coverageGoal, 0),
      active_ambassadors_count: asNumber(body.active_ambassadors_count ?? body.activeAmbassadorsCount, 0),
      manager_name: asNullableString(body.manager_name ?? body.managerName ?? body.assigned_owner),
      assigned_owner: asNullableString(body.manager_name ?? body.managerName ?? body.assigned_owner),
      status: asString(body.status, "active").toLowerCase(),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeMissionPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const title = asString(body.title ?? body.name)
  if (!partial && !title) return { ok: false, error: "Mission title is required" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      ambassador_id: asNullableString(body.ambassador_id ?? body.ambassadorId ?? body.assigned_ambassador_id),
      assigned_ambassador_id: asNullableString(body.ambassador_id ?? body.ambassadorId ?? body.assigned_ambassador_id),
      title: title || undefined,
      name: title || undefined,
      mission_type: asNullableString(body.mission_type ?? body.missionType),
      priority: asString(body.priority, "normal").toLowerCase(),
      status: asString(body.status, "assigned").toLowerCase(),
      city: asNullableString(body.city),
      region: asNullableString(body.region),
      territory_id: asNullableString(body.territory_id ?? body.territoryId),
      due_date: asNullableString(body.due_date ?? body.dueDate ?? body.due_at),
      due_at: asNullableString(body.due_date ?? body.dueDate ?? body.due_at),
      completed_at: asNullableString(body.completed_at ?? body.completedAt),
      assigned_by: asNullableString(body.assigned_by ?? body.assignedBy),
      description: asNullableString(body.description),
      instructions: asNullableString(body.instructions),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeRecruitmentPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const candidateName = asString(body.candidate_name ?? body.candidateName ?? body.name)
  if (!partial && !candidateName) return { ok: false, error: "Candidate name is required" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      candidate_name: candidateName || undefined,
      email: asNullableString(body.email),
      phone: asNullableString(body.phone),
      city: asNullableString(body.city),
      region: asNullableString(body.region),
      source: asNullableString(body.source),
      stage: asString(body.stage, "sourced").toLowerCase(),
      evaluation_score: asNumber(body.evaluation_score ?? body.evaluationScore, 0),
      interviewer: asNullableString(body.interviewer),
      notes: asNullableString(body.notes),
      next_step: asNullableString(body.next_step ?? body.nextStep),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeOnboardingPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const ambassadorId = asString(body.ambassador_id ?? body.ambassadorId)
  if (!partial && !ambassadorId) return { ok: false, error: "Ambassador is required for onboarding" }
  const checklist = normalizeChecklist(body.checklist)
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      ambassador_id: ambassadorId || undefined,
      stage: asString(body.stage, "not_started").toLowerCase(),
      checklist,
      completion_rate: asNumber(body.completion_rate ?? body.completionRate, calculateCompletionRate(checklist)),
      assigned_owner: asNullableString(body.assigned_owner ?? body.assignedOwner),
      due_date: asNullableString(body.due_date ?? body.dueDate),
      completed_at: asNullableString(body.completed_at ?? body.completedAt),
      notes: asNullableString(body.notes),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeTrainingPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const ambassadorId = asString(body.ambassador_id ?? body.ambassadorId)
  const trainingName = asString(body.training_name ?? body.trainingName ?? body.module_title)
  if (!partial && !ambassadorId) return { ok: false, error: "Ambassador is required for training" }
  if (!partial && !trainingName) return { ok: false, error: "Training name is required" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      ambassador_id: ambassadorId || undefined,
      training_name: trainingName || undefined,
      module_title: trainingName || undefined,
      certification_name: asNullableString(body.certification_name ?? body.certificationName),
      status: asString(body.status, "assigned").toLowerCase(),
      certification_status: asNullableString(body.certification_status ?? body.certificationStatus),
      score: asNumber(body.score, 0),
      valid_until: asNullableString(body.valid_until ?? body.validUntil),
      completed_at: asNullableString(body.completed_at ?? body.completedAt),
      issued_by: asNullableString(body.issued_by ?? body.issuedBy),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeGoalPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const goalType = asString(body.goal_type ?? body.goalType)
  if (!partial && !goalType) return { ok: false, error: "Goal type is required" }
  const targetValue = asNumber(body.target_value ?? body.targetValue, 0)
  const currentValue = asNumber(body.current_value ?? body.currentValue, 0)
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      ambassador_id: asNullableString(body.ambassador_id ?? body.ambassadorId),
      period: asString(body.period, "current"),
      goal_type: goalType || undefined,
      target_value: targetValue,
      current_value: currentValue,
      completion_rate: asNumber(body.completion_rate ?? body.completionRate, calculateGoalCompletion(currentValue, targetValue)),
      status: asString(body.status, currentValue >= targetValue && targetValue > 0 ? "achieved" : "tracking").toLowerCase(),
      manager_notes: asNullableString(body.manager_notes ?? body.managerNotes),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeIncentivePayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const ambassadorId = asString(body.ambassador_id ?? body.ambassadorId)
  if (!partial && !ambassadorId) return { ok: false, error: "Ambassador is required for incentive" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      ambassador_id: ambassadorId || undefined,
      incentive_type: asString(body.incentive_type ?? body.incentiveType, "performance_bonus"),
      amount: asNumber(body.amount ?? body.amount_mad, 0),
      amount_mad: asNumber(body.amount ?? body.amount_mad, 0),
      currency: asString(body.currency, "MAD").toUpperCase(),
      status: asString(body.status, "pending").toLowerCase(),
      reason: asNullableString(body.reason),
      approved_by: asNullableString(body.approved_by ?? body.approvedBy),
      approved_at: asNullableString(body.approved_at ?? body.approvedAt),
      paid_at: asNullableString(body.paid_at ?? body.paidAt),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeReportPayload(payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  const reportType = asString(body.report_type ?? body.reportType)
  const title = asString(body.title)
  if (!partial && !reportType) return { ok: false, error: "Report type is required" }
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      report_type: reportType || undefined,
      title: title || `${reportType || "Ambassador"} report`,
      period_start: asNullableString(body.period_start ?? body.periodStart),
      period_end: asNullableString(body.period_end ?? body.periodEnd),
      filters: asJsonObject(body.filters),
      generated_by: asNullableString(body.generated_by ?? body.generatedBy),
      status: asString(body.status, "generated").toLowerCase(),
      export_url: asNullableString(body.export_url ?? body.exportUrl),
      export_payload: asJsonObject(body.export_payload ?? body.exportPayload),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizeSettingsPayload(payload: unknown): ValidationResult<Record<string, unknown>> {
  const body = readPayload(payload)
  return {
    ok: true,
    data: compactRecord({
      tenant_id: asNullableString(body.tenant_id),
      organization_id: asNullableString(body.organization_id),
      default_region: asNullableString(body.default_region ?? body.defaultRegion),
      approval_rules: asJsonObject(body.approval_rules ?? body.approvalRules),
      incentive_rules: asJsonObject(body.incentive_rules ?? body.incentiveRules),
      onboarding_rules: asJsonObject(body.onboarding_rules ?? body.onboardingRules),
      training_rules: asJsonObject(body.training_rules ?? body.trainingRules),
      kpi_rules: asJsonObject(body.kpi_rules ?? body.kpiRules),
      notification_rules: asJsonObject(body.notification_rules ?? body.notificationRules),
      metadata: asJsonObject(body.metadata),
      updated_at: todayIso(),
    }),
  }
}

export function normalizePayloadForEntity(entity: AmbassadorEntity, payload: unknown, partial = false): ValidationResult<Record<string, unknown>> {
  switch (entity) {
    case "ambassadors":
      return normalizeAmbassadorPayload(payload, partial)
    case "territories":
      return normalizeTerritoryPayload(payload, partial)
    case "missions":
      return normalizeMissionPayload(payload, partial)
    case "recruitment":
      return normalizeRecruitmentPayload(payload, partial)
    case "onboarding":
      return normalizeOnboardingPayload(payload, partial)
    case "training":
      return normalizeTrainingPayload(payload, partial)
    case "goals":
      return normalizeGoalPayload(payload, partial)
    case "incentives":
      return normalizeIncentivePayload(payload, partial)
    case "reports":
      return normalizeReportPayload(payload, partial)
    case "settings":
      return normalizeSettingsPayload(payload)
    case "audit":
      return { ok: true, data: readPayload(payload) }
    default:
      return { ok: false, error: "Unsupported Ambassador entity" }
  }
}

export function deriveAmbassadorKpis(snapshot: AmbassadorWorkspaceSnapshot): AmbassadorDashboardKpis {
  const ambassadors = snapshot.ambassadors.filter((item) => item.status !== "archived")
  const active = ambassadors.filter((item) => item.status === "active")
  const inactive = ambassadors.filter((item) => item.status === "inactive")
  const suspended = ambassadors.filter((item) => item.status === "suspended")
  const onboardingRecords = snapshot.onboarding.filter((item) => item.stage !== "completed" || item.completion_rate < 100)
  const trainingRecords = snapshot.training.filter((item) => item.status !== "expired")
  const certified = snapshot.training.filter((item) => item.certification_status === "certified" || item.status === "completed")
  const goals = snapshot.goals.filter((item) => item.status !== "archived")
  const incentives = snapshot.incentives.filter((item) => item.status !== "archived")
  const territories = snapshot.territories.filter((item) => item.status !== "archived")
  const coverageTarget = territories.reduce((sum, item) => sum + Math.max(item.coverage_goal, 0), 0)
  const coverageCurrent = territories.reduce((sum, item) => sum + Math.max(item.active_ambassadors_count, 0), 0)

  return {
    totalAmbassadors: ambassadors.length,
    activeAmbassadors: active.length,
    inactiveAmbassadors: inactive.length,
    suspendedAmbassadors: suspended.length,
    onboardingCompletion: Math.round(average(snapshot.onboarding.map((item) => item.completion_rate))),
    recruitmentPipeline: snapshot.recruitment.filter((item) => !["converted", "rejected", "archived"].includes(item.stage)).length,
    assignedTerritories: territories.filter((item) => item.active_ambassadors_count > 0).length,
    territoryCoverage: coverageTarget ? Math.round(Math.min(100, (coverageCurrent / coverageTarget) * 100)) : 0,
    missionsAssigned: snapshot.missions.filter((item) => item.status !== "archived").length,
    missionsCompleted: snapshot.missions.filter((item) => item.status === "completed").length,
    trainingCompletion: trainingRecords.length ? Math.round((trainingRecords.filter((item) => item.status === "completed").length / trainingRecords.length) * 100) : 0,
    certificationValidity: trainingRecords.length ? Math.round((certified.length / trainingRecords.length) * 100) : 0,
    kpiCompletion: Math.round(average(goals.map((item) => item.completion_rate))),
    incentivesPending: incentives.filter((item) => item.status === "pending").length,
    incentivesApproved: incentives.filter((item) => item.status === "approved").length,
    incentivesPaid: incentives.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0),
    reportsGenerated: snapshot.reports.filter((item) => item.status !== "archived").length,
  }
}

function average(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

export function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
}

export function datedFilename(moduleName: string, reportType: string, extension = "csv"): string {
  const date = new Date().toISOString().slice(0, 10)
  const safeType = reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return `${moduleName}-${safeType}-${date}.${extension}`
}
