import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import type { AmbassadorWorkspaceSnapshot } from "./types"

type AnyRecord = Record<string, any>
type EntityKey =
  | "ambassadors"
  | "territories"
  | "missions"
  | "recruitment"
  | "leads"
  | "conversions"
  | "onboarding"
  | "training"
  | "goals"
  | "incentives"
  | "reports"
  | "audit"

type ServiceResult<T = any> = {
  ok: boolean
  data?: T
  record?: AnyRecord | null
  records?: AnyRecord[]
  items?: AnyRecord[]
  snapshot?: AmbassadorWorkspaceSnapshot
  source: string
  error?: string | null
  diagnostics?: AnyRecord[]
  [key: string]: any
}

type EntityConfig = {
  table: string
  prefix: string
  archivedField?: "status" | "stage" | "archived_at"
  archiveStatus?: string
  required?: string[]
  fields: string[]
  numeric?: string[]
  json?: string[]
}

const ENTITY_CONFIG: Record<EntityKey, EntityConfig> = {
  ambassadors: {
    table: "market_os_ambassadors",
    prefix: "amb",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["full_name"],
    fields: [
      "id",
      "full_name",
      "email",
      "phone",
      "city",
      "region",
      "zone",
      "role",
      "title",
      "profile_type",
      "status",
      "lifecycle_stage",
      "territory_id",
      "territory_name",
      "manager_name",
      "performance_score",
      "kpi_score",
      "missions_assigned",
      "missions_completed",
      "leads_generated",
      "hot_leads",
      "meetings_booked",
      "incentives_balance",
      "certification_status",
      "drive_folder_url",
      "notes",
      "source",
      "created_at",
      "updated_at",
      "archived_at",
    ],
    numeric: ["performance_score", "kpi_score", "missions_assigned", "missions_completed", "leads_generated", "hot_leads", "meetings_booked", "incentives_balance"],
  },
  territories: {
    table: "market_os_ambassador_territories",
    prefix: "ter",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["name"],
    fields: ["id", "name", "city", "region", "zone", "manager_name", "coverage_goal", "active_ambassadors_count", "status", "notes", "created_at", "updated_at", "archived_at"],
    numeric: ["coverage_goal", "active_ambassadors_count"],
  },
  missions: {
    table: "market_os_ambassador_missions",
    prefix: "mis",
    archivedField: "archived_at",
    required: ["title"],
    fields: ["id", "ambassador_id", "territory_id", "title", "mission_type", "priority", "status", "city", "region", "due_date", "completed_at", "archived_at", "description", "instructions", "evidence_url", "proof_status", "created_at", "updated_at"],
  },
  recruitment: {
    table: "market_os_ambassador_recruitment",
    prefix: "rec",
    archivedField: "stage",
    archiveStatus: "archived",
    required: ["candidate_name"],
    fields: ["id", "candidate_name", "email", "phone", "city", "region", "source", "stage", "evaluation_score", "interviewer", "next_step", "notes", "ambassador_id", "created_at", "updated_at", "archived_at"],
    numeric: ["evaluation_score"],
  },

  leads: {
    table: "market_os_ambassador_leads",
    prefix: "lea",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["lead_name"],
    fields: ["id", "lead_name", "parent_name", "email", "phone", "city", "region", "zone", "source", "lead_type", "status", "score", "ambassador_id", "territory_id", "next_followup_at", "qualified_at", "converted_at", "notes", "created_at", "updated_at", "archived_at"],
    numeric: ["score"],
  },
  conversions: {
    table: "market_os_ambassador_conversions",
    prefix: "con",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["lead_name"],
    fields: ["id", "lead_id", "lead_name", "parent_name", "ambassador_id", "ambassador_name", "territory_id", "city", "region", "offer_name", "value", "currency", "status", "validation_decision", "validation_note", "proof_url", "validated_by", "validated_at", "rejected_at", "paid_at", "score", "created_at", "updated_at", "archived_at"],
    numeric: ["value", "score"],
  },
  onboarding: {
    table: "market_os_ambassador_onboarding",
    prefix: "onb",
    archivedField: "stage",
    archiveStatus: "archived",
    required: ["ambassador_id"],
    fields: ["id", "ambassador_id", "stage", "assigned_owner", "due_date", "completed_at", "completion_rate", "checklist", "notes", "created_at", "updated_at", "archived_at"],
    numeric: ["completion_rate"],
    json: ["checklist"],
  },
  training: {
    table: "market_os_ambassador_training",
    prefix: "trn",
    archivedField: "archived_at",
    required: ["ambassador_id", "training_name"],
    fields: ["id", "ambassador_id", "training_name", "certification_name", "status", "certification_status", "score", "valid_until", "issued_by", "archived_at", "created_at", "updated_at"],
    numeric: ["score"],
  },
  goals: {
    table: "market_os_ambassador_goals",
    prefix: "gol",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["goal_type"],
    fields: ["id", "ambassador_id", "period", "goal_type", "target_value", "current_value", "completion_rate", "status", "manager_notes", "created_at", "updated_at", "archived_at"],
    numeric: ["target_value", "current_value", "completion_rate"],
  },
  incentives: {
    table: "market_os_ambassador_incentives",
    prefix: "inc",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["ambassador_id", "amount"],
    fields: ["id", "ambassador_id", "incentive_type", "amount", "currency", "status", "reason", "approved_by", "approved_at", "paid_at", "created_at", "updated_at", "archived_at"],
    numeric: ["amount"],
  },
  reports: {
    table: "market_os_ambassador_reports",
    prefix: "rep",
    archivedField: "status",
    archiveStatus: "archived",
    required: ["report_type"],
    fields: ["id", "report_type", "title", "period_start", "period_end", "generated_by", "status", "filters", "row_count", "created_at", "updated_at", "archived_at"],
    numeric: ["row_count"],
    json: ["filters"],
  },
  audit: {
    table: "market_os_ambassador_audit_logs",
    prefix: "aud",
    fields: ["id", "entity_type", "entity_id", "action", "summary", "actor_name", "payload", "created_at"],
    json: ["payload"],
  },
}

const SETTINGS_TABLE = "market_os_ambassador_settings"
const STORE_FILE = ".angelcare_market_os_ambassadors_store.json"
const DEFAULT_ACTOR = "AngelCare Operator"
const ENTITY_LIMITS: Record<EntityKey, number> = {
  ambassadors: 200,
  territories: 80,
  missions: 120,
  recruitment: 120,
  leads: 160,
  conversions: 160,
  onboarding: 120,
  training: 120,
  goals: 120,
  incentives: 120,
  reports: 60,
  audit: 120,
}

const DEFAULT_SETTINGS: AnyRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  default_region: "Rabat / Casablanca",
  approval_rules: {
    payout_requires_manager_validation: true,
    proof_required_before_payment: true,
    child_image_publication_blocked_without_written_authorization: true,
  },
  incentive_rules: {
    currency: "MAD",
    payment_states: ["pending", "approved", "rejected", "paid"],
  },
  onboarding_rules: {
    mandatory_steps: ["Profile verified", "Files collected", "Orientation completed", "Training assigned", "Territory confirmed"],
  },
  training_rules: {
    certification_min_score: 80,
    field_shadowing_required: true,
  },
  kpi_rules: {
    default_daily_contacts: 20,
    default_daily_leads: 5,
    hot_lead_requires_call_followup: true,
  },
  notification_rules: {
    daily_report_required: true,
    escalation_when_blocked_hours: 24,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function now() {
  return new Date().toISOString()
}

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY))
}

function createAdminClient() {
  if (!hasSupabaseEnv()) return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function localStorePath() {
  return path.join(process.cwd(), STORE_FILE)
}

function emptyTables(): Record<string, AnyRecord[]> {
  return Object.fromEntries(Object.values(ENTITY_CONFIG).map((config) => [config.table, []]))
}

function readLocalStore(): { version: number; updatedAt: string; tables: Record<string, AnyRecord[]>; settings: AnyRecord } {
  const file = localStorePath()
  if (!fs.existsSync(file)) {
    return { version: 1, updatedAt: now(), tables: emptyTables(), settings: DEFAULT_SETTINGS }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
    return {
      version: 1,
      updatedAt: String(parsed.updatedAt || now()),
      tables: parsed.tables && typeof parsed.tables === "object" ? { ...emptyTables(), ...parsed.tables } : emptyTables(),
      settings: parsed.settings && typeof parsed.settings === "object" ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
    }
  } catch {
    return { version: 1, updatedAt: now(), tables: emptyTables(), settings: DEFAULT_SETTINGS }
  }
}

function writeLocalStore(store: { tables: Record<string, AnyRecord[]>; settings: AnyRecord }) {
  const next = { version: 1, updatedAt: now(), tables: store.tables, settings: { ...store.settings, updated_at: now() } }
  try {
    fs.writeFileSync(localStorePath(), JSON.stringify(next, null, 2))
  } catch {
    // Serverless read-only filesystems should not break API responses; Supabase remains the production source.
  }
  return next
}

function idFor(_prefix: string) {
  return randomUUID()
}

function cleanPayload(entity: EntityKey, payload: AnyRecord = {}, existing: AnyRecord = {}) {
  const config = ENTITY_CONFIG[entity]
  const current = now()
  const output: AnyRecord = {}
  for (const field of config.fields) {
    if (payload[field] !== undefined && payload[field] !== "") output[field] = payload[field]
  }
  output.id = String(output.id || existing.id || idFor(config.prefix))
  output.created_at = existing.created_at || payload.created_at || current
  output.updated_at = current

  for (const field of config.numeric || []) {
    if (output[field] !== undefined) {
      const value = Number(output[field])
      output[field] = Number.isFinite(value) ? value : 0
    }
  }
  for (const field of config.json || []) {
    if (output[field] === undefined) continue
    if (typeof output[field] === "string") {
      try {
        output[field] = JSON.parse(output[field])
      } catch {
        output[field] = []
      }
    }
  }

  if (entity === "ambassadors") {
    output.status = output.status || existing.status || "active"
    output.lifecycle_stage = output.lifecycle_stage || existing.lifecycle_stage || output.status
    output.performance_score = Number(output.performance_score || 0)
    output.kpi_score = Number(output.kpi_score || 0)
    output.missions_assigned = Number(output.missions_assigned || 0)
    output.missions_completed = Number(output.missions_completed || 0)
    output.leads_generated = Number(output.leads_generated || 0)
    output.hot_leads = Number(output.hot_leads || 0)
    output.meetings_booked = Number(output.meetings_booked || 0)
    output.incentives_balance = Number(output.incentives_balance || 0)
    output.certification_status = output.certification_status || existing.certification_status || "pending"
  }
  if (entity === "territories") {
    output.status = output.status || existing.status || "active"
    output.coverage_goal = Number(output.coverage_goal || 0)
    output.active_ambassadors_count = Number(output.active_ambassadors_count || 0)
  }
  if (entity === "missions") {
    output.status = output.status || existing.status || "assigned"
    output.priority = output.priority || existing.priority || "normal"
    output.mission_type = output.mission_type || existing.mission_type || "field_activation"
  }
  if (entity === "recruitment") {
    output.stage = output.stage || existing.stage || "sourced"
    output.evaluation_score = Number(output.evaluation_score || 0)
  }
  if (entity === "leads") {
    output.status = output.status || existing.status || "new"
    output.lead_type = output.lead_type || existing.lead_type || "Parent"
    output.source = output.source || existing.source || "Manual"
    output.score = Number(output.score || 0)
  }
  if (entity === "conversions") {
    output.status = output.status || existing.status || "pending"
    output.currency = output.currency || existing.currency || "MAD"
    output.value = Number(output.value || 0)
    output.score = Number(output.score || 0)
    if (["validated", "approved"].includes(String(output.status))) output.validated_at = output.validated_at || current
    if (String(output.status) === "rejected") output.rejected_at = output.rejected_at || current
  }
  if (entity === "onboarding") {
    output.stage = output.stage || existing.stage || "not_started"
    output.checklist = Array.isArray(output.checklist) ? output.checklist : []
    output.completion_rate = completionRate(output.checklist)
    if (output.completion_rate >= 100) {
      output.stage = "completed"
      output.completed_at = output.completed_at || current
    }
  }
  if (entity === "training") {
    output.status = output.status || existing.status || "assigned"
    output.certification_status = output.certification_status || existing.certification_status || "pending"
    output.score = Number(output.score || 0)
  }
  if (entity === "goals") {
    output.status = output.status || existing.status || "tracking"
    output.target_value = Number(output.target_value || 0)
    output.current_value = Number(output.current_value || 0)
    output.completion_rate = goalCompletion(output)
    if (output.completion_rate >= 100) output.status = "achieved"
  }
  if (entity === "incentives") {
    output.status = output.status || existing.status || "pending"
    output.currency = output.currency || existing.currency || "MAD"
    output.amount = Number(output.amount || 0)
  }
  if (entity === "reports") {
    output.status = output.status || existing.status || "generated"
    output.title = output.title || `${String(output.report_type || "Ambassador")} report`
    output.row_count = Number(output.row_count || 0)
    output.filters = output.filters && typeof output.filters === "object" ? output.filters : {}
  }
  return output
}

function validateEntity(entity: EntityKey, payload: AnyRecord) {
  const missing = (ENTITY_CONFIG[entity].required || []).filter((field) => !String(payload[field] ?? "").trim())
  if (missing.length) return `Missing required field(s): ${missing.join(", ")}`
  if (entity === "incentives" && Number(payload.amount || 0) <= 0) return "Incentive amount must be greater than zero"
  if (entity === "goals" && Number(payload.target_value || 0) <= 0) return "Goal target value must be greater than zero"
  return null
}

function completionRate(checklist: AnyRecord[] = []) {
  if (!Array.isArray(checklist) || checklist.length === 0) return 0
  const done = checklist.filter((step) => step.done).length
  return Math.round((done / checklist.length) * 100)
}

function goalCompletion(goal: AnyRecord) {
  const target = Number(goal.target_value || 0)
  if (!target) return 0
  return Math.max(0, Math.min(100, Math.round((Number(goal.current_value || 0) / target) * 100)))
}

async function tryDbList(entity: EntityKey) {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const table = ENTITY_CONFIG[entity].table
  const limit = ENTITY_LIMITS[entity] || 100
  const { data, error } = await supabase.from(table).select("*").order("updated_at", { ascending: false }).limit(limit)
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data: data || [] }
}

async function tryDbSettings() {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const { data, error } = await supabase.from(SETTINGS_TABLE).select("*").eq("id", DEFAULT_SETTINGS.id).maybeSingle()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data: data || DEFAULT_SETTINGS }
}

async function tryDbUpsert(entity: EntityKey, row: AnyRecord) {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const { data, error } = await supabase.from(ENTITY_CONFIG[entity].table).upsert(row, { onConflict: "id" }).select("*").single()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data }
}

async function tryDbPatch(entity: EntityKey, id: string, patch: AnyRecord) {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const { data, error } = await supabase.from(ENTITY_CONFIG[entity].table).update(patch).eq("id", id).select("*").single()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data }
}

async function tryDbGet(entity: EntityKey, id: string) {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const { data, error } = await supabase.from(ENTITY_CONFIG[entity].table).select("*").eq("id", id).maybeSingle()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data }
}

async function tryDbSettingsUpsert(settings: AnyRecord) {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, reason: "Supabase env not configured" }
  const { data, error } = await supabase.from(SETTINGS_TABLE).upsert(settings, { onConflict: "id" }).select("*").single()
  if (error) return { ok: false, reason: error.message }
  return { ok: true, data }
}

async function writeAudit(entity: string, entityId: string, action: string, summary: string, payload: AnyRecord = {}) {
  const row = cleanPayload("audit", {
    entity_type: entity,
    entity_id: entityId,
    action,
    summary,
    actor_name: DEFAULT_ACTOR,
    payload,
    created_at: now(),
  })
  const db = await tryDbUpsert("audit", row)
  if (!db.ok) {
    const store = readLocalStore()
    const rows = store.tables[ENTITY_CONFIG.audit.table] || []
    store.tables[ENTITY_CONFIG.audit.table] = [row, ...rows].slice(0, 500)
    writeLocalStore(store)
  }
  return row
}

function localRows(entity: EntityKey) {
  const store = readLocalStore()
  return (store.tables[ENTITY_CONFIG[entity].table] || []).slice(0, ENTITY_LIMITS[entity] || 100)
}

function upsertLocal(entity: EntityKey, row: AnyRecord) {
  const store = readLocalStore()
  const table = ENTITY_CONFIG[entity].table
  const rows = [...(store.tables[table] || [])]
  const index = rows.findIndex((item) => String(item.id) === String(row.id))
  if (index >= 0) rows[index] = { ...rows[index], ...row }
  else rows.unshift(row)
  store.tables[table] = rows
  writeLocalStore(store)
  return index >= 0 ? rows[index] : row
}

function patchLocal(entity: EntityKey, id: string, patch: AnyRecord) {
  const existing = localRows(entity).find((item) => String(item.id) === String(id)) || {}
  return upsertLocal(entity, { ...existing, ...patch, id, updated_at: now() })
}

async function listRaw(entity: EntityKey) {
  const db = await tryDbList(entity)
  if (db.ok) return { rows: db.data as AnyRecord[], source: "supabase", diagnostic: null }
  return { rows: localRows(entity), source: "local-store", diagnostic: { area: entity, store: "local-store", reason: db.reason } }
}

async function getRaw(entity: EntityKey, id: string) {
  const db = await tryDbGet(entity, id)
  if (db.ok) return { row: db.data as AnyRecord | null, source: "supabase", diagnostic: null }
  return { row: localRows(entity).find((item) => String(item.id) === String(id)) || null, source: "local-store", diagnostic: { area: entity, store: "local-store", reason: db.reason } }
}

function enrichSnapshot(input: {
  ambassadors: AnyRecord[]
  territories: AnyRecord[]
  missions: AnyRecord[]
  recruitment: AnyRecord[]
  onboarding: AnyRecord[]
  training: AnyRecord[]
  goals: AnyRecord[]
  incentives: AnyRecord[]
  reports: AnyRecord[]
  audit: AnyRecord[]
  settings: AnyRecord
  diagnostics: AnyRecord[]
  source: string
}): AmbassadorWorkspaceSnapshot {
  const activeAmbassadors = input.ambassadors.filter((item) => item.status !== "archived")
  const territoryById = new Map(input.territories.map((item) => [String(item.id), item]))
  const missionsByAmbassador = new Map<string, AnyRecord[]>()
  const incentivesByAmbassador = new Map<string, AnyRecord[]>()
  const trainingByAmbassador = new Map<string, AnyRecord[]>()

  for (const mission of input.missions.filter((item) => !item.archived_at && item.status !== "archived")) {
    const key = String(mission.ambassador_id || "")
    if (!missionsByAmbassador.has(key)) missionsByAmbassador.set(key, [])
    missionsByAmbassador.get(key)?.push(mission)
  }
  for (const incentive of input.incentives.filter((item) => item.status !== "archived")) {
    const key = String(incentive.ambassador_id || "")
    if (!incentivesByAmbassador.has(key)) incentivesByAmbassador.set(key, [])
    incentivesByAmbassador.get(key)?.push(incentive)
  }
  for (const training of input.training.filter((item) => !item.archived_at && item.status !== "archived")) {
    const key = String(training.ambassador_id || "")
    if (!trainingByAmbassador.has(key)) trainingByAmbassador.set(key, [])
    trainingByAmbassador.get(key)?.push(training)
  }

  const ambassadors: AnyRecord[] = input.ambassadors.map((ambassador) => {
    const territory = ambassador.territory_id ? territoryById.get(String(ambassador.territory_id)) : null
    const missions = missionsByAmbassador.get(String(ambassador.id)) || []
    const incentives = incentivesByAmbassador.get(String(ambassador.id)) || []
    const trainings = trainingByAmbassador.get(String(ambassador.id)) || []
    const paid = incentives.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const pending = incentives.filter((item) => item.status === "pending" || item.status === "approved").reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const completed = missions.filter((item) => item.status === "completed").length
    const completedTrainings = trainings.filter((item) => item.status === "completed" || item.certification_status === "certified").length
    return {
      ...ambassador,
      territory_name: ambassador.territory_name || territory?.name || "",
      missions_assigned: missions.length,
      missions_completed: completed,
      incentives_balance: pending,
      incentives_paid_total: paid,
      certification_status: trainings.length && completedTrainings === trainings.length ? "certified" : ambassador.certification_status || "pending",
    }
  })

  const territories: AnyRecord[] = input.territories.map((territory) => ({
    ...territory,
    active_ambassadors_count: activeAmbassadors.filter((ambassador) => String(ambassador.territory_id || "") === String(territory.id)).length,
  }))

  const onboarding: AnyRecord[] = input.onboarding.map((item) => ({ ...item, checklist: Array.isArray(item.checklist) ? item.checklist : [], completion_rate: completionRate(Array.isArray(item.checklist) ? item.checklist : []) }))
  const goals: AnyRecord[] = input.goals.map((item) => ({ ...item, completion_rate: goalCompletion(item) }))

  const missionsActive = input.missions.filter((item) => !item.archived_at && item.status !== "archived")
  const activeTerritories = territories.filter((item) => item.status !== "archived")
  const completedMissions = missionsActive.filter((item) => item.status === "completed").length
  const assignedTerritories = activeTerritories.filter((item) => Number(item.active_ambassadors_count || 0) > 0).length
  const onboardingCompletion = onboarding.length ? Math.round(onboarding.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / onboarding.length) : 0
  const trainingCompletion = input.training.length ? Math.round((input.training.filter((item) => item.status === "completed" || item.certification_status === "certified").length / input.training.length) * 100) : 0
  const certificationValidity = input.training.length ? Math.round((input.training.filter((item) => item.certification_status === "certified").length / input.training.length) * 100) : 0
  const kpiCompletion = goals.length ? Math.round(goals.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / goals.length) : 0
  const incentivesPaid = input.incentives.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const incentivesPending = input.incentives.filter((item) => item.status === "pending" || item.status === "approved").reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const snapshot: AmbassadorWorkspaceSnapshot = {
    records: ambassadors,
    ambassadors,
    archivedRecords: ambassadors.filter((item) => item.status === "archived"),
    territories,
    missions: missionsActive,
    recruitment: input.recruitment,
    onboarding,
    training: input.training,
    goals,
    incentives: input.incentives,
    reports: input.reports,
    settings: input.settings || DEFAULT_SETTINGS,
    audit: input.audit.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))).slice(0, 100),
    stats: {
      store: input.source,
      totalRecords: ambassadors.length + territories.length + missionsActive.length + input.recruitment.length + onboarding.length + input.training.length + goals.length + input.incentives.length + input.reports.length,
      activeTerritories: activeTerritories.length,
      activeMissions: missionsActive.length,
    },
    kpis: {
      totalAmbassadors: ambassadors.length,
      activeAmbassadors: activeAmbassadors.length,
      suspendedAmbassadors: ambassadors.filter((item) => item.status === "suspended").length,
      territoryCoverage: activeTerritories.length ? Math.round((assignedTerritories / activeTerritories.length) * 100) : 0,
      assignedTerritories,
      missionsAssigned: missionsActive.length,
      missionsCompleted: completedMissions,
      onboardingCompletion,
      recruitmentPipeline: input.recruitment.filter((item) => !["converted", "rejected", "archived"].includes(String(item.stage))).length,
      trainingCompletion,
      certificationValidity,
      kpiCompletion,
      incentivesPaid,
      incentivesPending,
    },
    activity: input.audit.slice(0, 20),
    diagnostics: input.diagnostics,
    updatedAt: now(),
  }
  return snapshot
}

export async function loadAmbassadorWorkspaceSnapshot(): Promise<ServiceResult<AmbassadorWorkspaceSnapshot>> {
  const diagnostics: AnyRecord[] = []
  const entries = await Promise.all((Object.keys(ENTITY_CONFIG) as EntityKey[]).map(async (entity) => [entity, await listRaw(entity)] as const))
  const rows = Object.fromEntries(entries.map(([entity, result]) => {
    if (result.diagnostic) diagnostics.push(result.diagnostic)
    return [entity, result.rows]
  })) as Record<EntityKey, AnyRecord[]>
  const settingsResult = await tryDbSettings()
  let settings = DEFAULT_SETTINGS
  if (settingsResult.ok) settings = { ...DEFAULT_SETTINGS, ...(settingsResult.data as AnyRecord) }
  else {
    diagnostics.push({ area: "settings", store: "local-store", reason: settingsResult.reason })
    settings = readLocalStore().settings || DEFAULT_SETTINGS
  }
  const source = diagnostics.length ? "ambassador-runtime-local-fallback" : "ambassador-runtime-supabase"
  const snapshot = enrichSnapshot({
    ambassadors: rows.ambassadors || [],
    territories: rows.territories || [],
    missions: rows.missions || [],
    recruitment: rows.recruitment || [],
    onboarding: rows.onboarding || [],
    training: rows.training || [],
    goals: rows.goals || [],
    incentives: rows.incentives || [],
    reports: rows.reports || [],
    audit: rows.audit || [],
    settings,
    diagnostics,
    source,
  })
  return { ok: true, source, data: snapshot, snapshot, diagnostics }
}

export const loadAmbassadorServerSnapshot = loadAmbassadorWorkspaceSnapshot

export async function listAmbassadorEntity(entity: EntityKey): Promise<ServiceResult<AnyRecord[]>> {
  const result = await listRaw(entity)
  return { ok: true, source: `ambassador-${result.source}`, data: result.rows, records: result.rows, items: result.rows, diagnostics: result.diagnostic ? [result.diagnostic] : [] }
}

export async function getAmbassadorEntity(entity: EntityKey, id: string): Promise<ServiceResult<AnyRecord | null>> {
  const result = await getRaw(entity, id)
  return { ok: Boolean(result.row), source: `ambassador-${result.source}`, data: result.row, record: result.row, error: result.row ? null : "Record not found", diagnostics: result.diagnostic ? [result.diagnostic] : [] }
}

export async function createAmbassadorEntity(entity: EntityKey, payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const validationError = validateEntity(entity, payload)
  if (validationError) return { ok: false, source: "ambassador-validation", error: validationError }
  const row = cleanPayload(entity, payload)
  const db = await tryDbUpsert(entity, row)
  const record = db.ok ? (db.data as AnyRecord) : upsertLocal(entity, row)
  await writeAudit(entity, record.id, "create", `Created ${entity} record`, record)
  const snapshotResult = await loadAmbassadorWorkspaceSnapshot()
  return { ok: true, source: db.ok ? "ambassador-supabase" : "ambassador-local-store", data: record, record, snapshot: snapshotResult.snapshot }
}

export async function updateAmbassadorEntity(entity: EntityKey, idOrPayload: string | AnyRecord, patch?: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const id = typeof idOrPayload === "string" ? idOrPayload : String(idOrPayload.id || "")
  const payload = typeof idOrPayload === "string" ? (patch || {}) : idOrPayload
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing record id" }
  const existing = (await getRaw(entity, id)).row || {}
  const next = cleanPayload(entity, { ...existing, ...payload, id }, existing)
  const db = await tryDbPatch(entity, id, next)
  const record = db.ok ? (db.data as AnyRecord) : patchLocal(entity, id, next)
  await writeAudit(entity, id, "update", `Updated ${entity} record`, { before: existing, after: record })
  const snapshotResult = await loadAmbassadorWorkspaceSnapshot()
  return { ok: true, source: db.ok ? "ambassador-supabase" : "ambassador-local-store", data: record, record, snapshot: snapshotResult.snapshot }
}

export async function archiveAmbassadorEntity(entity: EntityKey, id: string): Promise<ServiceResult<AnyRecord>> {
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing record id" }
  const config = ENTITY_CONFIG[entity]
  const patch: AnyRecord = { updated_at: now(), archived_at: now() }
  if (config.archivedField === "status") patch.status = config.archiveStatus || "archived"
  if (config.archivedField === "stage") patch.stage = config.archiveStatus || "archived"
  const db = await tryDbPatch(entity, id, patch)
  const record = db.ok ? (db.data as AnyRecord) : patchLocal(entity, id, patch)
  await writeAudit(entity, id, "archive", `Archived ${entity} record`, record)
  const snapshotResult = await loadAmbassadorWorkspaceSnapshot()
  return { ok: true, source: db.ok ? "ambassador-supabase" : "ambassador-local-store", data: record, record, snapshot: snapshotResult.snapshot }
}

export async function assignAmbassadorTerritory(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const ambassadorId = String(payload.ambassador_id || "")
  const territoryId = String(payload.territory_id || "")
  if (!ambassadorId || !territoryId) return { ok: false, source: "ambassador-validation", error: "Ambassador and territory are required" }
  const territory = (await getRaw("territories", territoryId)).row
  if (!territory) return { ok: false, source: "ambassador-validation", error: "Territory not found" }
  return updateAmbassadorEntity("ambassadors", ambassadorId, {
    territory_id: territoryId,
    territory_name: territory.name,
    city: payload.city || territory.city,
    region: payload.region || territory.region,
  })
}

export async function assignMissionToAmbassador(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  return updateAmbassadorEntity("missions", String(payload.id || payload.mission_id || ""), {
    ambassador_id: payload.ambassador_id,
    status: payload.status || "assigned",
  })
}

export async function moveRecruitmentStage(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const id = String(payload.id || "")
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing candidate id" }
  const updated = await updateAmbassadorEntity("recruitment", id, { stage: payload.stage, next_step: payload.next_step, notes: payload.notes })
  if (updated.ok && payload.stage === "converted" && updated.record && !updated.record.ambassador_id) {
    const ambassador = await createAmbassadorEntity("ambassadors", {
      full_name: updated.record.candidate_name,
      email: updated.record.email,
      phone: updated.record.phone,
      city: updated.record.city,
      region: updated.record.region,
      status: "active",
      lifecycle_stage: "active",
      source: "recruitment-conversion",
      performance_score: updated.record.evaluation_score || 0,
    })
    if (ambassador.ok && ambassador.record) {
      await updateAmbassadorEntity("recruitment", id, { ambassador_id: ambassador.record.id })
    }
  }
  return updated
}

export async function completeOnboardingStep(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const id = String(payload.id || "")
  const stepId = String(payload.step_id || "")
  if (!id || !stepId) return { ok: false, source: "ambassador-validation", error: "Onboarding id and step id are required" }
  const existing = (await getRaw("onboarding", id)).row
  if (!existing) return { ok: false, source: "ambassador-validation", error: "Onboarding record not found" }
  const checklist = Array.isArray(existing.checklist) ? existing.checklist.map((step: AnyRecord) => step.id === stepId ? { ...step, done: Boolean(payload.done) } : step) : []
  return updateAmbassadorEntity("onboarding", id, { checklist, completion_rate: completionRate(checklist), completed_at: completionRate(checklist) >= 100 ? now() : null })
}

export async function recalculateGoal(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const id = String(payload.id || "")
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing goal id" }
  const existing = (await getRaw("goals", id)).row
  if (!existing) return { ok: false, source: "ambassador-validation", error: "Goal not found" }
  return updateAmbassadorEntity("goals", id, { completion_rate: goalCompletion(existing), status: goalCompletion(existing) >= 100 ? "achieved" : existing.status || "tracking" })
}

export async function decideIncentive(payload: AnyRecord, decision: "approved" | "rejected" | "paid"): Promise<ServiceResult<AnyRecord>> {
  const id = String(payload.id || "")
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing incentive id" }
  const patch: AnyRecord = { status: decision }
  if (decision === "approved") {
    patch.approved_by = payload.approved_by || DEFAULT_ACTOR
    patch.approved_at = now()
  }
  if (decision === "paid") {
    patch.paid_at = now()
    patch.approved_by = payload.approved_by || DEFAULT_ACTOR
    patch.approved_at = payload.approved_at || now()
  }
  if (payload.reason) patch.reason = payload.reason
  return updateAmbassadorEntity("incentives", id, patch)
}

export async function updateMissionStatus(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const id = String(payload.id || "")
  if (!id) return { ok: false, source: "ambassador-validation", error: "Missing mission id" }
  const status = String(payload.status || "completed")
  return updateAmbassadorEntity("missions", id, { status, completed_at: status === "completed" ? now() : null })
}

export async function getAmbassadorSettings(): Promise<ServiceResult<AnyRecord>> {
  const db = await tryDbSettings()
  const settings = db.ok ? { ...DEFAULT_SETTINGS, ...(db.data as AnyRecord) } : (readLocalStore().settings || DEFAULT_SETTINGS)
  return { ok: true, source: db.ok ? "ambassador-supabase" : "ambassador-local-store", data: settings, record: settings }
}

export async function updateAmbassadorSettings(payload: AnyRecord): Promise<ServiceResult<AnyRecord>> {
  const settings = { ...DEFAULT_SETTINGS, ...payload, id: DEFAULT_SETTINGS.id, updated_at: now() }
  const db = await tryDbSettingsUpsert(settings)
  let record: AnyRecord = settings
  if (db.ok) record = db.data as AnyRecord
  else {
    const store = readLocalStore()
    store.settings = settings
    writeLocalStore(store)
  }
  await writeAudit("settings", record.id, "update", "Updated Ambassador module settings", record)
  return { ok: true, source: db.ok ? "ambassador-supabase" : "ambassador-local-store", data: record, record }
}

export async function generateAmbassadorReport(payload: AnyRecord): Promise<ServiceResult<{ filename: string; csv: string; report: AnyRecord | null }>> {
  const snapshot = (await loadAmbassadorWorkspaceSnapshot()).snapshot!
  const reportType = String(payload.report_type || "ambassadors")
  const rows = rowsForReport(snapshot, reportType)
  const csv = buildCsv(rows.headers, rows.rows)
  const reportResult = await createAmbassadorEntity("reports", {
    report_type: reportType,
    title: payload.title || `${reportType} report`,
    period_start: payload.period_start || null,
    period_end: payload.period_end || null,
    generated_by: payload.generated_by || DEFAULT_ACTOR,
    filters: payload.filters || {},
    row_count: rows.rows.length,
    status: "generated",
  })
  return {
    ok: true,
    source: "ambassador-report-engine",
    data: {
      filename: `angelcare-ambassadors-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      report: reportResult.record || null,
    },
  }
}

function rowsForReport(snapshot: AmbassadorWorkspaceSnapshot, reportType: string): { headers: string[]; rows: unknown[][] } {
  if (reportType.includes("territor")) return { headers: ["Territory", "City", "Region", "Goal", "Active", "Manager", "Status"], rows: snapshot.territories.map((item: any) => [item.name, item.city, item.region, item.coverage_goal, item.active_ambassadors_count, item.manager_name, item.status]) }
  if (reportType.includes("mission")) return { headers: ["Mission", "Ambassador", "City", "Status", "Due", "Completed"], rows: snapshot.missions.map((item: any) => [item.title, item.ambassador_id, item.city, item.status, item.due_date, item.completed_at]) }
  if (reportType.includes("recruit")) return { headers: ["Candidate", "Email", "Phone", "City", "Stage", "Score", "Next Step"], rows: snapshot.recruitment.map((item: any) => [item.candidate_name, item.email, item.phone, item.city, item.stage, item.evaluation_score, item.next_step]) }
  if (reportType.includes("lead")) return { headers: ["Lead", "Parent", "Phone", "City", "Source", "Status", "Score", "Ambassador"], rows: ((snapshot as any).leads || []).map((item: any) => [item.lead_name, item.parent_name, item.phone, item.city, item.source, item.status, item.score, item.ambassador_id]) }
  if (reportType.includes("conversion")) return { headers: ["Lead", "Parent", "Ambassador", "City", "Offer", "Value", "Status", "Validated"], rows: ((snapshot as any).conversions || []).map((item: any) => [item.lead_name, item.parent_name, item.ambassador_name || item.ambassador_id, item.city, item.offer_name, item.value, item.status, item.validated_at]) }
  if (reportType.includes("onboard")) return { headers: ["Ambassador", "Stage", "Completion", "Owner", "Due"], rows: snapshot.onboarding.map((item: any) => [item.ambassador_id, item.stage, item.completion_rate, item.assigned_owner, item.due_date]) }
  if (reportType.includes("training")) return { headers: ["Ambassador", "Training", "Status", "Certification", "Score", "Valid Until"], rows: snapshot.training.map((item: any) => [item.ambassador_id, item.training_name, item.status, item.certification_status, item.score, item.valid_until]) }
  if (reportType.includes("goal") || reportType.includes("performance")) return { headers: ["Ambassador", "Goal", "Target", "Current", "Completion", "Status"], rows: snapshot.goals.map((item: any) => [item.ambassador_id, item.goal_type, item.target_value, item.current_value, item.completion_rate, item.status]) }
  if (reportType.includes("incentive")) return { headers: ["Ambassador", "Type", "Amount", "Currency", "Status", "Approved", "Paid"], rows: snapshot.incentives.map((item: any) => [item.ambassador_id, item.incentive_type, item.amount, item.currency, item.status, item.approved_at, item.paid_at]) }
  return { headers: ["Name", "Email", "Phone", "City", "Region", "Territory", "Status", "Performance", "KPI", "Missions Completed", "Incentives Pending"], rows: snapshot.ambassadors.map((item: any) => [item.full_name, item.email, item.phone, item.city, item.region, item.territory_name, item.status, item.performance_score, item.kpi_score, item.missions_completed, item.incentives_balance]) }
}

function buildCsv(headers: string[], rows: unknown[][]) {
  const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
  return [headers.map(esc).join(","), ...rows.map((row) => headers.map((_, index) => esc(row[index])).join(","))].join("\n")
}

export default {
  loadAmbassadorWorkspaceSnapshot,
  loadAmbassadorServerSnapshot,
  listAmbassadorEntity,
  getAmbassadorEntity,
  createAmbassadorEntity,
  updateAmbassadorEntity,
  archiveAmbassadorEntity,
  assignAmbassadorTerritory,
  assignMissionToAmbassador,
  completeOnboardingStep,
  decideIncentive,
  getAmbassadorSettings,
  moveRecruitmentStage,
  recalculateGoal,
  updateAmbassadorSettings,
  updateMissionStatus,
  generateAmbassadorReport,
}
