import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type {
  Ambassador,
  AmbassadorAuditLog,
  AmbassadorChecklistItem,
  AmbassadorEntity,
  AmbassadorEntityRecord,
  AmbassadorIncentive,
  AmbassadorKpiGoal,
  AmbassadorMission,
  AmbassadorModuleSettings,
  AmbassadorOnboardingRecord,
  AmbassadorRecruitmentRecord,
  AmbassadorReport,
  AmbassadorTerritory,
  AmbassadorTrainingCertification,
  AmbassadorWorkspaceSnapshot,
  ApiResponse,
  JsonObject,
} from "./types"
import {
  asJsonObject,
  asNullableString,
  asNumber,
  asString,
  calculateCompletionRate,
  calculateGoalCompletion,
  compactRecord,
  normalizeChecklist,
  normalizePayloadForEntity,
  readPayload,
} from "./validation"

export const AMBASSADOR_MIGRATION_PATH = "supabase/migrations/20260603_market_os_ambassadors_enterprise_module.sql"

export const AMBASSADOR_TABLES: Record<AmbassadorEntity, string> = {
  ambassadors: "market_os_ambassadors",
  territories: "market_os_ambassador_territories",
  missions: "market_os_ambassador_missions",
  recruitment: "market_os_ambassador_recruitment",
  onboarding: "market_os_ambassador_onboarding",
  training: "market_os_ambassador_training",
  goals: "market_os_ambassador_kpis",
  incentives: "market_os_ambassador_incentives",
  reports: "market_os_ambassador_reports",
  settings: "market_os_ambassador_settings",
  audit: "market_os_ambassador_audit_logs",
}

type Db = SupabaseClient
type RawRow = Record<string, unknown>

const SETTINGS_SINGLETON_ID = "00000000-0000-0000-0000-000000000001"

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function tableMissingHint(entity: AmbassadorEntity, error: string): string {
  return `${entity} persistence failed: ${error}. Apply ${AMBASSADOR_MIGRATION_PATH} if the table or columns are missing.`
}

function entityTitle(entity: AmbassadorEntity, row: RawRow): string {
  return asString(
    row.full_name ??
      row.candidate_name ??
      row.name ??
      row.title ??
      row.training_name ??
      row.goal_type ??
      row.incentive_type ??
      row.report_type ??
      entity
  )
}

function isArchived(row: RawRow): boolean {
  return asString(row.status).toLowerCase() === "archived" || Boolean(row.archived_at)
}

function normalizeAudit(row: RawRow): AmbassadorAuditLog {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    actor_id: asNullableString(row.actor_id),
    actor_name: asNullableString(row.actor_name),
    action: asString(row.action, "ambassador.action"),
    entity_type: asString(row.entity_type, "ambassador"),
    entity_id: asNullableString(row.entity_id),
    summary: asNullableString(row.summary),
    before_snapshot: row.before_snapshot ? asJsonObject(row.before_snapshot) : null,
    after_snapshot: row.after_snapshot ? asJsonObject(row.after_snapshot) : null,
    created_at: asString(row.created_at),
    metadata: asJsonObject(row.metadata),
  }
}

function normalizeAmbassador(row: RawRow): Ambassador {
  const fullName = asString(row.full_name ?? row.name ?? row.display_name)
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    full_name: fullName,
    display_name: asNullableString(row.display_name) ?? fullName,
    email: asNullableString(row.email),
    phone: asNullableString(row.phone),
    city: asNullableString(row.city),
    region: asNullableString(row.region),
    territory_id: asNullableString(row.territory_id),
    territory_name: asNullableString(row.territory_name ?? row.territory),
    role: asNullableString(row.role ?? row.title),
    title: asNullableString(row.title ?? row.role),
    status: asString(row.status, "candidate").toLowerCase() as Ambassador["status"],
    lifecycle_stage: asString(row.lifecycle_stage, "candidate").toLowerCase() as Ambassador["lifecycle_stage"],
    manager_id: asNullableString(row.manager_id),
    manager_name: asNullableString(row.manager_name),
    recruitment_stage: asNullableString(row.recruitment_stage) as Ambassador["recruitment_stage"],
    onboarding_stage: asNullableString(row.onboarding_stage) as Ambassador["onboarding_stage"],
    training_status: asNullableString(row.training_status) as Ambassador["training_status"],
    certification_status: asNullableString(row.certification_status) as Ambassador["certification_status"],
    performance_score: asNumber(row.performance_score ?? row.score, 0),
    kpi_score: asNumber(row.kpi_score, 0),
    missions_completed: asNumber(row.missions_completed, 0),
    missions_assigned: asNumber(row.missions_assigned, 0),
    incentives_balance: asNumber(row.incentives_balance, 0),
    last_activity_at: asNullableString(row.last_activity_at),
    joined_at: asNullableString(row.joined_at),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata ?? row.payload),
  }
}

function normalizeTerritory(row: RawRow): AmbassadorTerritory {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    name: asString(row.name ?? row.title),
    city: asNullableString(row.city),
    region: asNullableString(row.region),
    zone: asNullableString(row.zone),
    coverage_goal: asNumber(row.coverage_goal ?? row.coverage_score, 0),
    active_ambassadors_count: asNumber(row.active_ambassadors_count, 0),
    manager_name: asNullableString(row.manager_name ?? row.assigned_owner),
    status: asString(row.status, "active").toLowerCase() as AmbassadorTerritory["status"],
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata ?? row.restrictions),
  }
}

function normalizeMission(row: RawRow): AmbassadorMission {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    ambassador_id: asNullableString(row.ambassador_id ?? row.assigned_ambassador_id),
    title: asString(row.title ?? row.name),
    mission_type: asNullableString(row.mission_type),
    priority: asString(row.priority, "normal").toLowerCase() as AmbassadorMission["priority"],
    status: asString(row.status, "assigned").toLowerCase() as AmbassadorMission["status"],
    city: asNullableString(row.city),
    region: asNullableString(row.region),
    territory_id: asNullableString(row.territory_id),
    due_date: asNullableString(row.due_date ?? row.due_at),
    completed_at: asNullableString(row.completed_at),
    assigned_by: asNullableString(row.assigned_by),
    description: asNullableString(row.description),
    instructions: asNullableString(row.instructions),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata ?? row.payload),
  }
}

function normalizeRecruitment(row: RawRow): AmbassadorRecruitmentRecord {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    candidate_name: asString(row.candidate_name ?? row.name),
    email: asNullableString(row.email),
    phone: asNullableString(row.phone),
    city: asNullableString(row.city),
    region: asNullableString(row.region),
    source: asNullableString(row.source),
    stage: asString(row.stage, "sourced").toLowerCase() as AmbassadorRecruitmentRecord["stage"],
    evaluation_score: asNumber(row.evaluation_score, 0),
    interviewer: asNullableString(row.interviewer),
    notes: asNullableString(row.notes),
    next_step: asNullableString(row.next_step),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata),
  }
}

function normalizeOnboarding(row: RawRow): AmbassadorOnboardingRecord {
  const checklist = normalizeChecklist(row.checklist)
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    ambassador_id: asString(row.ambassador_id),
    stage: asString(row.stage, "not_started").toLowerCase() as AmbassadorOnboardingRecord["stage"],
    checklist,
    completion_rate: asNumber(row.completion_rate, calculateCompletionRate(checklist)),
    assigned_owner: asNullableString(row.assigned_owner),
    due_date: asNullableString(row.due_date),
    completed_at: asNullableString(row.completed_at),
    notes: asNullableString(row.notes),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata),
  }
}

function normalizeTraining(row: RawRow): AmbassadorTrainingCertification {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    ambassador_id: asString(row.ambassador_id),
    training_name: asString(row.training_name ?? row.module_title),
    certification_name: asNullableString(row.certification_name),
    status: asString(row.status, "assigned").toLowerCase() as AmbassadorTrainingCertification["status"],
    certification_status: asNullableString(row.certification_status) as AmbassadorTrainingCertification["certification_status"],
    score: asNumber(row.score, 0),
    valid_until: asNullableString(row.valid_until),
    completed_at: asNullableString(row.completed_at),
    issued_by: asNullableString(row.issued_by),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata ?? row.payload),
  }
}

function normalizeGoal(row: RawRow): AmbassadorKpiGoal {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    ambassador_id: asNullableString(row.ambassador_id),
    period: asString(row.period, "current"),
    goal_type: asString(row.goal_type),
    target_value: asNumber(row.target_value, 0),
    current_value: asNumber(row.current_value, 0),
    completion_rate: asNumber(row.completion_rate, calculateGoalCompletion(asNumber(row.current_value, 0), asNumber(row.target_value, 0))),
    status: asString(row.status, "tracking").toLowerCase() as AmbassadorKpiGoal["status"],
    manager_notes: asNullableString(row.manager_notes),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata),
  }
}

function normalizeIncentive(row: RawRow): AmbassadorIncentive {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    ambassador_id: asString(row.ambassador_id),
    incentive_type: asString(row.incentive_type, "performance_bonus"),
    amount: asNumber(row.amount ?? row.amount_mad, 0),
    currency: asString(row.currency, "MAD"),
    status: asString(row.status, "pending").toLowerCase() as AmbassadorIncentive["status"],
    reason: asNullableString(row.reason),
    approved_by: asNullableString(row.approved_by),
    approved_at: asNullableString(row.approved_at),
    paid_at: asNullableString(row.paid_at),
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata ?? row.payload),
  }
}

function normalizeReport(row: RawRow): AmbassadorReport {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    report_type: asString(row.report_type),
    title: asString(row.title),
    period_start: asNullableString(row.period_start),
    period_end: asNullableString(row.period_end),
    filters: asJsonObject(row.filters),
    generated_by: asNullableString(row.generated_by),
    status: asString(row.status, "generated").toLowerCase() as AmbassadorReport["status"],
    export_url: asNullableString(row.export_url),
    export_payload: row.export_payload ? asJsonObject(row.export_payload) : null,
    archived_at: asNullableString(row.archived_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata),
  }
}

function normalizeSettings(row: RawRow): AmbassadorModuleSettings {
  return {
    id: asString(row.id),
    tenant_id: asNullableString(row.tenant_id),
    organization_id: asNullableString(row.organization_id),
    default_region: asNullableString(row.default_region),
    approval_rules: asJsonObject(row.approval_rules),
    incentive_rules: asJsonObject(row.incentive_rules),
    onboarding_rules: asJsonObject(row.onboarding_rules),
    training_rules: asJsonObject(row.training_rules),
    kpi_rules: asJsonObject(row.kpi_rules),
    notification_rules: asJsonObject(row.notification_rules),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata: asJsonObject(row.metadata),
  }
}

export function normalizeEntityRow(entity: AmbassadorEntity, row: RawRow): AmbassadorEntityRecord {
  switch (entity) {
    case "ambassadors":
      return normalizeAmbassador(row)
    case "territories":
      return normalizeTerritory(row)
    case "missions":
      return normalizeMission(row)
    case "recruitment":
      return normalizeRecruitment(row)
    case "onboarding":
      return normalizeOnboarding(row)
    case "training":
      return normalizeTraining(row)
    case "goals":
      return normalizeGoal(row)
    case "incentives":
      return normalizeIncentive(row)
    case "reports":
      return normalizeReport(row)
    case "settings":
      return normalizeSettings(row)
    case "audit":
      return normalizeAudit(row)
  }
}

async function getDb(): Promise<Db> {
  return createClient()
}

async function writeAuditLog(
  supabase: Db,
  params: {
    action: string
    entityType: AmbassadorEntity | string
    entityId?: string | null
    summary: string
    before?: RawRow | null
    after?: RawRow | null
    actorName?: string | null
    metadata?: JsonObject
  }
): Promise<void> {
  const row = {
    actor_id: null,
    actor_name: params.actorName || "AngelCare Operator",
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    summary: params.summary,
    before_snapshot: params.before || null,
    after_snapshot: params.after || null,
    metadata: params.metadata || {},
  }
  const { error } = await supabase.from(AMBASSADOR_TABLES.audit).insert(row)
  if (error) {
    console.error("[ambassadors:audit]", error.message)
  }
}

export async function listAmbassadorEntity(entity: AmbassadorEntity, params?: URLSearchParams): Promise<ApiResponse<AmbassadorEntityRecord[]>> {
  if (entity === "settings") {
    const settings = await getAmbassadorSettings()
    return settings.ok ? { ok: true, data: settings.data ? [settings.data] : [] } : { ok: false, error: settings.error, details: settings.details }
  }

  try {
    const supabase = await getDb()
    const limit = Math.min(Math.max(Number(params?.get("limit") || 500), 1), 2000)
    let query = supabase.from(AMBASSADOR_TABLES[entity]).select("*").order("updated_at", { ascending: false }).limit(limit)
    const status = params?.get("status")
    const city = params?.get("city")
    const region = params?.get("region")
    const territoryId = params?.get("territory_id")
    const ambassadorId = params?.get("ambassador_id")
    if (status && status !== "all") query = query.eq("status", status)
    if (city && city !== "all") query = query.eq("city", city)
    if (region && region !== "all") query = query.eq("region", region)
    if (territoryId && territoryId !== "all") query = query.eq("territory_id", territoryId)
    if (ambassadorId && ambassadorId !== "all") query = query.eq("ambassador_id", ambassadorId)

    const { data, error } = await query
    if (error) return { ok: false, error: tableMissingHint(entity, error.message), data: [] }
    return { ok: true, data: (data || []).map((row) => normalizeEntityRow(entity, row as RawRow)) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, `Failed to list ${entity}`), data: [] }
  }
}

export async function getAmbassadorEntity(entity: AmbassadorEntity, id: string): Promise<ApiResponse<AmbassadorEntityRecord | null>> {
  try {
    const supabase = await getDb()
    const { data, error } = await supabase.from(AMBASSADOR_TABLES[entity]).select("*").eq("id", id).maybeSingle()
    if (error) return { ok: false, error: tableMissingHint(entity, error.message), data: null }
    return { ok: true, data: data ? normalizeEntityRow(entity, data as RawRow) : null }
  } catch (error) {
    return { ok: false, error: errorMessage(error, `Failed to load ${entity}`), data: null }
  }
}

export async function createAmbassadorEntity(entity: AmbassadorEntity, payload: unknown): Promise<ApiResponse<AmbassadorEntityRecord>> {
  const validation = normalizePayloadForEntity(entity, payload)
  if (!validation.ok) return { ok: false, error: validation.error, details: validation.details }
  try {
    const supabase = await getDb()
    const { data, error } = await supabase.from(AMBASSADOR_TABLES[entity]).insert(validation.data).select("*").single()
    if (error) return { ok: false, error: tableMissingHint(entity, error.message) }
    const record = normalizeEntityRow(entity, data as RawRow)
    await writeAuditLog(supabase, {
      action: `${entity}.created`,
      entityType: entity,
      entityId: asString((data as RawRow).id),
      summary: `${entityTitle(entity, data as RawRow)} created`,
      after: data as RawRow,
    })
    await refreshDerivedAmbassadorStats(supabase, entity, data as RawRow)
    return { ok: true, data: record }
  } catch (error) {
    return { ok: false, error: errorMessage(error, `Failed to create ${entity}`) }
  }
}

export async function updateAmbassadorEntity(entity: AmbassadorEntity, id: string, payload: unknown, action = "updated"): Promise<ApiResponse<AmbassadorEntityRecord>> {
  const validation = normalizePayloadForEntity(entity, payload, true)
  if (!validation.ok) return { ok: false, error: validation.error, details: validation.details }
  try {
    const supabase = await getDb()
    const beforeResult = await supabase.from(AMBASSADOR_TABLES[entity]).select("*").eq("id", id).maybeSingle()
    if (beforeResult.error) return { ok: false, error: tableMissingHint(entity, beforeResult.error.message) }
    const { data, error } = await supabase.from(AMBASSADOR_TABLES[entity]).update(validation.data).eq("id", id).select("*").single()
    if (error) return { ok: false, error: tableMissingHint(entity, error.message) }
    const record = normalizeEntityRow(entity, data as RawRow)
    await writeAuditLog(supabase, {
      action: `${entity}.${action}`,
      entityType: entity,
      entityId: id,
      summary: `${entityTitle(entity, data as RawRow)} ${action}`,
      before: (beforeResult.data || null) as RawRow | null,
      after: data as RawRow,
    })
    await refreshDerivedAmbassadorStats(supabase, entity, data as RawRow)
    return { ok: true, data: record }
  } catch (error) {
    return { ok: false, error: errorMessage(error, `Failed to update ${entity}`) }
  }
}

export async function archiveAmbassadorEntity(entity: AmbassadorEntity, id: string): Promise<ApiResponse<AmbassadorEntityRecord>> {
  try {
    const supabase = await getDb()
    const beforeResult = await supabase.from(AMBASSADOR_TABLES[entity]).select("*").eq("id", id).maybeSingle()
    if (beforeResult.error) return { ok: false, error: tableMissingHint(entity, beforeResult.error.message) }
    const patch = { status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from(AMBASSADOR_TABLES[entity]).update(patch).eq("id", id).select("*").single()
    if (error) return { ok: false, error: tableMissingHint(entity, error.message) }
    await writeAuditLog(supabase, {
      action: `${entity}.archived`,
      entityType: entity,
      entityId: id,
      summary: `${entityTitle(entity, data as RawRow)} archived`,
      before: (beforeResult.data || null) as RawRow | null,
      after: data as RawRow,
    })
    await refreshDerivedAmbassadorStats(supabase, entity, data as RawRow)
    return { ok: true, data: normalizeEntityRow(entity, data as RawRow) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, `Failed to archive ${entity}`) }
  }
}

export async function getAmbassadorSettings(): Promise<ApiResponse<AmbassadorModuleSettings | null>> {
  try {
    const supabase = await getDb()
    const { data, error } = await supabase
      .from(AMBASSADOR_TABLES.settings)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return { ok: false, error: tableMissingHint("settings", error.message), data: null }
    return { ok: true, data: data ? normalizeSettings(data as RawRow) : null }
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to load Ambassador settings"), data: null }
  }
}

export async function updateAmbassadorSettings(payload: unknown): Promise<ApiResponse<AmbassadorModuleSettings>> {
  const validation = normalizePayloadForEntity("settings", payload, true)
  if (!validation.ok) return { ok: false, error: validation.error, details: validation.details }
  try {
    const supabase = await getDb()
    const row = {
      id: asString(readPayload(payload).id, SETTINGS_SINGLETON_ID),
      ...validation.data,
    }
    const { data, error } = await supabase
      .from(AMBASSADOR_TABLES.settings)
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()
    if (error) return { ok: false, error: tableMissingHint("settings", error.message) }
    await writeAuditLog(supabase, {
      action: "settings.updated",
      entityType: "settings",
      entityId: asString((data as RawRow).id),
      summary: "Ambassador module settings updated",
      after: data as RawRow,
    })
    return { ok: true, data: normalizeSettings(data as RawRow) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to update Ambassador settings") }
  }
}

export async function assignAmbassadorTerritory(payload: unknown): Promise<ApiResponse<Ambassador>> {
  const body = readPayload(payload)
  const ambassadorId = asString(body.ambassador_id ?? body.ambassadorId)
  const territoryId = asString(body.territory_id ?? body.territoryId)
  if (!ambassadorId || !territoryId) return { ok: false, error: "Ambassador and territory are required" }
  try {
    const supabase = await getDb()
    const territoryResult = await supabase.from(AMBASSADOR_TABLES.territories).select("*").eq("id", territoryId).maybeSingle()
    if (territoryResult.error) return { ok: false, error: tableMissingHint("territories", territoryResult.error.message) }
    if (!territoryResult.data) return { ok: false, error: "Territory not found" }
    const beforeResult = await supabase.from(AMBASSADOR_TABLES.ambassadors).select("*").eq("id", ambassadorId).maybeSingle()
    if (beforeResult.error) return { ok: false, error: tableMissingHint("ambassadors", beforeResult.error.message) }
    const territory = normalizeTerritory(territoryResult.data as RawRow)
    const patch = {
      territory_id: territory.id,
      territory_name: territory.name,
      territory: territory.name,
      city: territory.city,
      region: territory.region,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from(AMBASSADOR_TABLES.ambassadors).update(patch).eq("id", ambassadorId).select("*").single()
    if (error) return { ok: false, error: tableMissingHint("ambassadors", error.message) }
    await refreshTerritoryCount(supabase, territoryId)
    await writeAuditLog(supabase, {
      action: "territory.assigned",
      entityType: "ambassadors",
      entityId: ambassadorId,
      summary: `${entityTitle("ambassadors", data as RawRow)} assigned to ${territory.name}`,
      before: (beforeResult.data || null) as RawRow | null,
      after: data as RawRow,
    })
    return { ok: true, data: normalizeAmbassador(data as RawRow) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to assign territory") }
  }
}

export async function assignMissionToAmbassador(payload: unknown): Promise<ApiResponse<AmbassadorMission>> {
  const body = readPayload(payload)
  const missionId = asString(body.mission_id ?? body.missionId)
  const ambassadorId = asString(body.ambassador_id ?? body.ambassadorId)
  if (!missionId || !ambassadorId) return { ok: false, error: "Mission and ambassador are required" }
  const patch = {
    ambassador_id: ambassadorId,
    assigned_ambassador_id: ambassadorId,
    assigned_by: asString(body.assigned_by ?? body.assignedBy, "AngelCare Operator"),
    status: "assigned",
    updated_at: new Date().toISOString(),
  }
  const response = await updateAmbassadorEntity("missions", missionId, patch, "assigned")
  if (!response.ok || !response.data) return { ok: false, error: response.error || "Failed to assign mission", details: response.details }
  return { ok: true, data: response.data as AmbassadorMission }
}

export async function updateMissionStatus(payload: unknown): Promise<ApiResponse<AmbassadorMission>> {
  const body = readPayload(payload)
  const missionId = asString(body.id ?? body.mission_id ?? body.missionId)
  const status = asString(body.status)
  if (!missionId || !status) return { ok: false, error: "Mission and status are required" }
  const patch = {
    status,
    completed_at: status === "completed" ? new Date().toISOString() : asNullableString(body.completed_at),
    updated_at: new Date().toISOString(),
  }
  const response = await updateAmbassadorEntity("missions", missionId, patch, status === "completed" ? "completed" : "status_updated")
  if (!response.ok || !response.data) return { ok: false, error: response.error || "Failed to update mission status", details: response.details }
  return { ok: true, data: response.data as AmbassadorMission }
}

export async function moveRecruitmentStage(payload: unknown): Promise<ApiResponse<AmbassadorRecruitmentRecord>> {
  const body = readPayload(payload)
  const candidateId = asString(body.id ?? body.candidate_id ?? body.candidateId)
  const stage = asString(body.stage)
  if (!candidateId || !stage) return { ok: false, error: "Candidate and stage are required" }
  const response = await updateAmbassadorEntity("recruitment", candidateId, { stage, next_step: asNullableString(body.next_step), notes: asNullableString(body.notes) }, "stage_changed")
  if (!response.ok || !response.data) return { ok: false, error: response.error || "Failed to move recruitment stage", details: response.details }
  return { ok: true, data: response.data as AmbassadorRecruitmentRecord }
}

export async function completeOnboardingStep(payload: unknown): Promise<ApiResponse<AmbassadorOnboardingRecord>> {
  const body = readPayload(payload)
  const onboardingId = asString(body.id ?? body.onboarding_id ?? body.onboardingId)
  const stepId = asString(body.step_id ?? body.stepId)
  if (!onboardingId || !stepId) return { ok: false, error: "Onboarding record and checklist step are required" }
  try {
    const supabase = await getDb()
    const current = await supabase.from(AMBASSADOR_TABLES.onboarding).select("*").eq("id", onboardingId).maybeSingle()
    if (current.error) return { ok: false, error: tableMissingHint("onboarding", current.error.message) }
    if (!current.data) return { ok: false, error: "Onboarding record not found" }
    const checklist = normalizeChecklist((current.data as RawRow).checklist).map((item) =>
      item.id === stepId
        ? { ...item, done: Boolean(body.done ?? !item.done), completed_at: Boolean(body.done ?? !item.done) ? new Date().toISOString() : null }
        : item
    )
    const patch = {
      checklist,
      completion_rate: calculateCompletionRate(checklist),
      stage: calculateCompletionRate(checklist) >= 100 ? "completed" : asString((current.data as RawRow).stage, "orientation"),
      completed_at: calculateCompletionRate(checklist) >= 100 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from(AMBASSADOR_TABLES.onboarding).update(patch).eq("id", onboardingId).select("*").single()
    if (error) return { ok: false, error: tableMissingHint("onboarding", error.message) }
    await writeAuditLog(supabase, {
      action: "onboarding.updated",
      entityType: "onboarding",
      entityId: onboardingId,
      summary: "Onboarding checklist updated",
      before: current.data as RawRow,
      after: data as RawRow,
    })
    return { ok: true, data: normalizeOnboarding(data as RawRow) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to complete onboarding step") }
  }
}

export async function recalculateGoal(payload: unknown): Promise<ApiResponse<AmbassadorKpiGoal>> {
  const body = readPayload(payload)
  const goalId = asString(body.id ?? body.goal_id ?? body.goalId)
  if (!goalId) return { ok: false, error: "Goal id is required" }
  try {
    const supabase = await getDb()
    const current = await supabase.from(AMBASSADOR_TABLES.goals).select("*").eq("id", goalId).maybeSingle()
    if (current.error) return { ok: false, error: tableMissingHint("goals", current.error.message) }
    if (!current.data) return { ok: false, error: "KPI goal not found" }
    const currentRow = current.data as RawRow
    const completion = calculateGoalCompletion(asNumber(currentRow.current_value, 0), asNumber(currentRow.target_value, 0))
    const patch = {
      completion_rate: completion,
      status: completion >= 100 ? "achieved" : completion < 60 ? "at_risk" : "tracking",
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from(AMBASSADOR_TABLES.goals).update(patch).eq("id", goalId).select("*").single()
    if (error) return { ok: false, error: tableMissingHint("goals", error.message) }
    await writeAuditLog(supabase, {
      action: "goals.recalculated",
      entityType: "goals",
      entityId: goalId,
      summary: "KPI completion recalculated",
      before: currentRow,
      after: data as RawRow,
    })
    return { ok: true, data: normalizeGoal(data as RawRow) }
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to recalculate KPI goal") }
  }
}

export async function decideIncentive(payload: unknown, decision: "approved" | "rejected" | "paid"): Promise<ApiResponse<AmbassadorIncentive>> {
  const body = readPayload(payload)
  const incentiveId = asString(body.id ?? body.incentive_id ?? body.incentiveId)
  if (!incentiveId) return { ok: false, error: "Incentive id is required" }
  const patch = compactRecord({
    status: decision,
    approved_by: decision === "approved" || decision === "paid" ? asString(body.approved_by ?? body.approvedBy, "AngelCare Finance") : undefined,
    approved_at: decision === "approved" || decision === "paid" ? new Date().toISOString() : undefined,
    paid_at: decision === "paid" ? new Date().toISOString() : undefined,
    reason: asNullableString(body.reason),
    updated_at: new Date().toISOString(),
  })
  const response = await updateAmbassadorEntity("incentives", incentiveId, patch, decision)
  if (!response.ok || !response.data) return { ok: false, error: response.error || `Failed to mark incentive ${decision}`, details: response.details }
  return { ok: true, data: response.data as AmbassadorIncentive }
}

async function refreshDerivedAmbassadorStats(supabase: Db, entity: AmbassadorEntity, row: RawRow): Promise<void> {
  if (entity === "missions") {
    const mission = normalizeMission(row)
    if (mission.ambassador_id) await refreshAmbassadorMissionStats(supabase, mission.ambassador_id)
  }
  if (entity === "incentives") {
    const incentive = normalizeIncentive(row)
    if (incentive.ambassador_id) await refreshAmbassadorIncentiveStats(supabase, incentive.ambassador_id)
  }
  if (entity === "training") {
    const training = normalizeTraining(row)
    if (training.ambassador_id) await supabase.from(AMBASSADOR_TABLES.ambassadors).update({
      training_status: training.status,
      certification_status: training.certification_status,
      updated_at: new Date().toISOString(),
    }).eq("id", training.ambassador_id)
  }
}

async function refreshAmbassadorMissionStats(supabase: Db, ambassadorId: string): Promise<void> {
  const { data, error } = await supabase.from(AMBASSADOR_TABLES.missions).select("status").eq("ambassador_id", ambassadorId)
  if (error) {
    console.error("[ambassadors:mission-stats]", error.message)
    return
  }
  const missions = (data || []) as RawRow[]
  const assigned = missions.filter((item) => !isArchived(item)).length
  const completed = missions.filter((item) => asString(item.status) === "completed").length
  await supabase.from(AMBASSADOR_TABLES.ambassadors).update({
    missions_assigned: assigned,
    missions_completed: completed,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", ambassadorId)
}

async function refreshAmbassadorIncentiveStats(supabase: Db, ambassadorId: string): Promise<void> {
  const { data, error } = await supabase.from(AMBASSADOR_TABLES.incentives).select("amount,status").eq("ambassador_id", ambassadorId)
  if (error) {
    console.error("[ambassadors:incentive-stats]", error.message)
    return
  }
  const balance = ((data || []) as RawRow[])
    .filter((item) => ["pending", "approved"].includes(asString(item.status)))
    .reduce((sum, item) => sum + asNumber(item.amount, 0), 0)
  await supabase.from(AMBASSADOR_TABLES.ambassadors).update({
    incentives_balance: balance,
    updated_at: new Date().toISOString(),
  }).eq("id", ambassadorId)
}

async function refreshTerritoryCount(supabase: Db, territoryId: string): Promise<void> {
  const { count, error } = await supabase
    .from(AMBASSADOR_TABLES.ambassadors)
    .select("id", { count: "exact", head: true })
    .eq("territory_id", territoryId)
    .eq("status", "active")
  if (error) {
    console.error("[ambassadors:territory-count]", error.message)
    return
  }
  await supabase.from(AMBASSADOR_TABLES.territories).update({
    active_ambassadors_count: count || 0,
    updated_at: new Date().toISOString(),
  }).eq("id", territoryId)
}

export async function loadAmbassadorWorkspaceSnapshot(): Promise<ApiResponse<AmbassadorWorkspaceSnapshot>> {
  const diagnostics: string[] = []
  const empty: AmbassadorWorkspaceSnapshot = {
    ambassadors: [],
    territories: [],
    missions: [],
    recruitment: [],
    onboarding: [],
    training: [],
    goals: [],
    incentives: [],
    reports: [],
    settings: null,
    audit: [],
    diagnostics,
  }

  try {
    const supabase = await getDb()
    const [
      ambassadors,
      territories,
      missions,
      recruitment,
      onboarding,
      training,
      goals,
      incentives,
      reports,
      settings,
      audit,
    ] = await Promise.all([
      supabase.from(AMBASSADOR_TABLES.ambassadors).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.territories).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.missions).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.recruitment).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.onboarding).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.training).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.goals).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.incentives).select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from(AMBASSADOR_TABLES.reports).select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from(AMBASSADOR_TABLES.settings).select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from(AMBASSADOR_TABLES.audit).select("*").order("created_at", { ascending: false }).limit(100),
    ])

    const results = { ambassadors, territories, missions, recruitment, onboarding, training, goals, incentives, reports, settings, audit }
    for (const [key, result] of Object.entries(results)) {
      if (result.error) diagnostics.push(tableMissingHint(key as AmbassadorEntity, result.error.message))
    }

    const snapshot: AmbassadorWorkspaceSnapshot = {
      ambassadors: ((ambassadors.data || []) as RawRow[]).map(normalizeAmbassador),
      territories: ((territories.data || []) as RawRow[]).map(normalizeTerritory),
      missions: ((missions.data || []) as RawRow[]).map(normalizeMission),
      recruitment: ((recruitment.data || []) as RawRow[]).map(normalizeRecruitment),
      onboarding: ((onboarding.data || []) as RawRow[]).map(normalizeOnboarding),
      training: ((training.data || []) as RawRow[]).map(normalizeTraining),
      goals: ((goals.data || []) as RawRow[]).map(normalizeGoal),
      incentives: ((incentives.data || []) as RawRow[]).map(normalizeIncentive),
      reports: ((reports.data || []) as RawRow[]).map(normalizeReport),
      settings: settings.data ? normalizeSettings(settings.data as RawRow) : null,
      audit: ((audit.data || []) as RawRow[]).map(normalizeAudit),
      diagnostics,
    }

    return diagnostics.length ? { ok: false, data: snapshot, error: "Ambassador workspace has missing persistence requirements", details: diagnostics } : { ok: true, data: snapshot }
  } catch (error) {
    return { ok: false, data: empty, error: errorMessage(error, "Failed to load Ambassador workspace"), details: diagnostics }
  }
}
