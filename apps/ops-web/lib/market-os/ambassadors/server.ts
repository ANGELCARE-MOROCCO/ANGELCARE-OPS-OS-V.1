import { createHash, randomUUID } from "node:crypto"
import type {
  AmbassadorActor,
  AmbassadorEntityKey,
  AmbassadorMissionAssignment,
  AmbassadorPermission,
  AmbassadorRecord,
  AmbassadorServiceResult,
  AmbassadorTerritoryAssignment,
  AmbassadorWorkspaceSnapshot,
} from "./contracts"
import {
  assertLifecycleTransition,
  ENTITY_LIFECYCLES,
  normalizeLifecycleValue,
} from "./contracts"
import { actorCan, requireAmbassadorPermission } from "./auth"
import { AmbassadorServiceError, asAmbassadorServiceError } from "./errors"
import {
  cleanEntityPayload,
  ENTITY_CONFIG,
  getRow,
  getSettingsRow,
  insertRow,
  listRows,
  listTable,
  MISSION_ASSIGNMENTS_TABLE,
  rpc,
  TERRITORY_ASSIGNMENTS_TABLE,
  updateRow,
  validateRequired,
  writeAudit,
} from "./persistence"
import { getAmbassadorSupabaseAdmin } from "./supabase"
import { getEffectiveAmbassadorSettingsConfiguration } from "./settings/runtime"

const DEFAULT_SETTINGS: AmbassadorRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  default_region: "Rabat / Casablanca",
  approval_rules: {
    payout_requires_manager_validation: true,
    proof_required_before_payment: true,
    child_image_publication_blocked_without_written_authorization: true,
  },
  incentive_rules: { currency: "MAD", payment_states: ["pending", "approved", "rejected", "paid"] },
  onboarding_rules: {
    mandatory_steps: ["Profile verified", "Files collected", "Orientation completed", "Training assigned", "Territory confirmed"],
  },
  training_rules: { certification_min_score: 80, field_shadowing_required: true },
  kpi_rules: { default_daily_contacts: 20, default_daily_leads: 5, hot_lead_requires_call_followup: true },
  notification_rules: { daily_report_required: true, escalation_when_blocked_hours: 24 },
}

const READ_PERMISSION: Record<AmbassadorEntityKey, AmbassadorPermission> = {
  ambassadors: "ambassadors.read",
  territories: "territories.read",
  missions: "missions.read",
  recruitment: "recruitment.read",
  leads: "leads.read",
  conversions: "conversions.read",
  onboarding: "onboarding.read",
  training: "training.read",
  goals: "goals.read",
  incentives: "rewards.read",
  proofs: "proofs.read",
  payouts: "payouts.read",
  reports: "reports.read",
  audit: "audit.read",
}

const WRITE_PERMISSION: Record<AmbassadorEntityKey, AmbassadorPermission> = {
  ambassadors: "ambassadors.write",
  territories: "territories.write",
  missions: "missions.write",
  recruitment: "recruitment.write",
  leads: "leads.write",
  conversions: "conversions.write",
  onboarding: "onboarding.write",
  training: "training.write",
  goals: "goals.write",
  incentives: "rewards.write",
  proofs: "proofs.submit",
  payouts: "payouts.approve",
  reports: "reports.generate",
  audit: "audit.read",
}

const TRANSITION_PERMISSION: Partial<Record<AmbassadorEntityKey, AmbassadorPermission>> = {
  ambassadors: "ambassadors.write",
  missions: "missions.transition",
  recruitment: "recruitment.transition",
  leads: "leads.transition",
  conversions: "conversions.review",
  incentives: "rewards.approve",
  proofs: "proofs.review",
  payouts: "payouts.approve",
}

const CONTROLLED_MUTATION_FIELDS: Partial<Record<AmbassadorEntityKey, readonly string[]>> = {
  missions: ["status", "completed_at", "proof_status"],
  recruitment: ["stage", "ambassador_id"],
  conversions: ["status", "validation_decision", "validation_note", "validated_by", "validated_by_actor_id", "validated_at", "rejected_at", "paid_at"],
  incentives: ["status", "approved_by", "approved_by_actor_id", "approved_at", "paid_at"],
  proofs: ["status", "review_note", "reviewed_by_actor_id", "reviewed_at"],
  payouts: ["status", "approval_note", "approved_by_actor_id", "approved_at", "executed_by_actor_id", "executed_at", "payment_reference", "paid_at"],
}

function rejectControlledGenericMutation(entity: AmbassadorEntityKey, payload: Record<string, unknown>): void {
  const fields = CONTROLLED_MUTATION_FIELDS[entity] || []
  const attempted = fields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field))
  if (attempted.length) {
    throw new AmbassadorServiceError(
      "GATE_BLOCKED",
      `${entity} field(s) ${attempted.join(", ")} require the dedicated controlled action endpoint`,
      409,
    )
  }
}

function now(): string {
  return new Date().toISOString()
}

function success<T>(data: T, extras: Record<string, unknown> = {}): AmbassadorServiceResult<T> {
  return { ok: true, source: "ambassador-supabase", data, ...extras }
}

function failure(error: unknown): AmbassadorServiceResult<never> {
  const resolved = asAmbassadorServiceError(error)
  return {
    ok: false,
    source: resolved.code.startsWith("AUTH") || resolved.code === "FORBIDDEN" || resolved.code === "SCOPE_REQUIRED" ? "ambassador-auth" : resolved.code === "VALIDATION_ERROR" || resolved.code === "CONFLICT" || resolved.code === "GATE_BLOCKED" ? "ambassador-validation" : "ambassador-supabase",
    error: resolved.message,
    code: resolved.code,
    status: resolved.status,
    details: resolved.details,
  }
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function arrayOfRecords(value: unknown): AmbassadorRecord[] {
  return Array.isArray(value) ? value.filter((item): item is AmbassadorRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : []
}

function completionRate(checklist: AmbassadorRecord[]): number {
  if (!checklist.length) return 0
  return Math.round((checklist.filter((step) => Boolean(step.done)).length / checklist.length) * 100)
}

function goalCompletion(goal: AmbassadorRecord): number {
  const target = Number(goal.target_value || 0)
  if (!target) return 0
  return Math.max(0, Math.min(100, Math.round((Number(goal.current_value || 0) / target) * 100)))
}

function candidateIdentity(payload: Record<string, unknown>): { email: string | null; phone: string | null; hash: string | null } {
  const email = text(payload.email).toLowerCase() || null
  const phoneDigits = text(payload.phone).replace(/\D/g, "")
  const phone = phoneDigits ? (phoneDigits.startsWith("212") ? `+${phoneDigits}` : phoneDigits.startsWith("0") ? `+212${phoneDigits.slice(1)}` : `+${phoneDigits}`) : null
  const source = email ? `email:${email}` : phone ? `phone:${phone}` : null
  return { email, phone, hash: source ? createHash("sha256").update(source).digest("hex") : null }
}

function applyDefaults(entity: AmbassadorEntityKey, row: AmbassadorRecord, existing: AmbassadorRecord | null): AmbassadorRecord {
  const next = { ...row }
  if (entity === "ambassadors") {
    next.status = next.status || existing?.status || "candidate"
    next.lifecycle_stage = normalizeLifecycleValue(next.lifecycle_stage || existing?.lifecycle_stage || next.status)
    next.certification_status = next.certification_status || existing?.certification_status || "pending"
  }
  if (entity === "territories") next.status = next.status || existing?.status || "active"
  if (entity === "missions") {
    next.status = normalizeLifecycleValue(next.status || existing?.status || "draft")
    next.priority = next.priority || existing?.priority || "normal"
    next.mission_type = next.mission_type || existing?.mission_type || "field_activation"
    if (next.proof_required === undefined) next.proof_required = existing?.proof_required ?? true
  }
  if (entity === "recruitment") {
    next.stage = normalizeLifecycleValue(next.stage || existing?.stage || "sourced")
    const identity = candidateIdentity(next)
    next.normalized_email = identity.email
    next.normalized_phone = identity.phone
    next.identity_hash = identity.hash
  }
  if (entity === "leads") {
    next.status = normalizeLifecycleValue(next.status || existing?.status || "new")
    next.lead_type = next.lead_type || existing?.lead_type || "Parent"
    next.source = next.source || existing?.source || "Manual"
  }
  if (entity === "conversions") {
    next.status = normalizeLifecycleValue(next.status || existing?.status || "pending")
    next.currency = next.currency || existing?.currency || "MAD"
  }
  if (entity === "onboarding") {
    const checklist = arrayOfRecords(next.checklist)
    next.checklist = checklist
    next.completion_rate = completionRate(checklist)
    next.stage = Number(next.completion_rate || 0) >= 100 ? "completed" : normalizeLifecycleValue(next.stage || existing?.stage || "not_started")
    if (Number(next.completion_rate || 0) >= 100) next.completed_at = next.completed_at || now()
  }
  if (entity === "training") {
    next.status = next.status || existing?.status || "assigned"
    next.certification_status = next.certification_status || existing?.certification_status || "pending"
  }
  if (entity === "goals") {
    next.status = next.status || existing?.status || "tracking"
    next.completion_rate = goalCompletion(next)
    if (Number(next.completion_rate) >= 100) next.status = "achieved"
  }
  if (entity === "incentives") {
    next.status = normalizeLifecycleValue(next.status || existing?.status || "pending")
    next.currency = next.currency || existing?.currency || "MAD"
    next.amount_mad = Number(next.amount_mad || next.amount || 0)
    next.amount = Number(next.amount || next.amount_mad || 0)
  }
  if (entity === "proofs") next.status = normalizeLifecycleValue(next.status || existing?.status || "submitted")
  if (entity === "payouts") {
    next.status = normalizeLifecycleValue(next.status || existing?.status || "draft")
    next.currency = next.currency || existing?.currency || "MAD"
  }
  if (entity === "reports") {
    next.status = next.status || existing?.status || "generated"
    next.title = next.title || `${text(next.report_type) || "Ambassador"} report`
  }
  return next
}

function validateBusinessRules(entity: AmbassadorEntityKey, row: AmbassadorRecord): void {
  validateRequired(entity, row)
  if (entity === "recruitment" && !row.identity_hash) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", "Candidate email or phone is required for deduplication", 400)
  }
  if (entity === "incentives" && Number(row.amount || row.amount_mad || 0) <= 0) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", "Incentive amount must be greater than zero", 400)
  }
  if (entity === "payouts" && Number(row.amount_mad || 0) <= 0) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", "Payout amount must be greater than zero", 400)
  }
  if (entity === "goals" && Number(row.target_value || 0) <= 0) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", "Goal target value must be greater than zero", 400)
  }
}

async function assertCandidateUnique(actor: AmbassadorActor, identityHash: string, excludingId?: string): Promise<void> {
  let query: any = getAmbassadorSupabaseAdmin()
    .from(ENTITY_CONFIG.recruitment.table)
    .select("id,candidate_name,stage,ambassador_id")
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("identity_hash", identityHash)
    .is("archived_at", null)
    .limit(1)
  if (excludingId) query = query.neq("id", excludingId)
  const result = await query
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
  if (result.data?.length) {
    throw new AmbassadorServiceError("CONFLICT", "A candidate with the same normalized email or phone already exists", 409, { duplicate: result.data[0] })
  }
}

function assertTransitionPermission(actor: AmbassadorActor, entity: AmbassadorEntityKey): void {
  const permission = TRANSITION_PERMISSION[entity]
  if (permission) requireAmbassadorPermission(actor, permission)
}

function assertTransition(entity: AmbassadorEntityKey, before: AmbassadorRecord, after: AmbassadorRecord): void {
  const lifecycle = ENTITY_LIFECYCLES[entity]
  if (!lifecycle) return
  const beforeValue = before[lifecycle.field]
  const afterValue = after[lifecycle.field]
  if (normalizeLifecycleValue(beforeValue) !== normalizeLifecycleValue(afterValue)) {
    try {
      assertLifecycleTransition(entity, beforeValue, afterValue)
    } catch (error) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", error instanceof Error ? error.message : "Invalid lifecycle transition", 409)
    }
  }
}

async function approvedProofForMission(actor: AmbassadorActor, missionId: string): Promise<AmbassadorRecord | null> {
  const result = await getAmbassadorSupabaseAdmin()
    .from(ENTITY_CONFIG.proofs.table)
    .select("*")
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("mission_id", missionId)
    .eq("status", "approved")
    .is("archived_at", null)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
  return (result.data || null) as AmbassadorRecord | null
}

async function approvedRewardSource(actor: AmbassadorActor, incentive: AmbassadorRecord): Promise<boolean> {
  if (incentive.proof_id) {
    const proof = await getRow("proofs", String(incentive.proof_id), actor)
    if (proof?.status === "approved") return true
  }
  if (incentive.conversion_id) {
    const conversion = await getRow("conversions", String(incentive.conversion_id), actor)
    if (conversion?.status === "validated" || conversion?.status === "paid") return true
  }
  return false
}

async function assignmentsForSnapshot(actor: AmbassadorActor): Promise<{ missionAssignments: AmbassadorMissionAssignment[]; territoryAssignments: AmbassadorTerritoryAssignment[] }> {
  const [missionAssignments, territoryAssignments] = await Promise.all([
    listTable(MISSION_ASSIGNMENTS_TABLE, actor, 1000),
    listTable(TERRITORY_ASSIGNMENTS_TABLE, actor, 1000),
  ])
  return {
    missionAssignments: missionAssignments as AmbassadorMissionAssignment[],
    territoryAssignments: territoryAssignments as AmbassadorTerritoryAssignment[],
  }
}

function enrichSnapshot(input: {
  rows: Record<AmbassadorEntityKey, AmbassadorRecord[]>
  settings: AmbassadorRecord
  missionAssignments: AmbassadorMissionAssignment[]
  territoryAssignments: AmbassadorTerritoryAssignment[]
}): AmbassadorWorkspaceSnapshot {
  const rows = input.rows
  const activeMissionAssignments = input.missionAssignments.filter((item) => !item.archived_at && !["revoked", "declined"].includes(text(item.status)))
  const activeTerritoryAssignments = input.territoryAssignments.filter((item) => !item.archived_at && text(item.status) === "approved" && !item.valid_to)
  const assignmentsByMission = new Map<string, AmbassadorMissionAssignment[]>()
  for (const assignment of activeMissionAssignments) {
    const key = text(assignment.mission_id)
    assignmentsByMission.set(key, [...(assignmentsByMission.get(key) || []), assignment])
  }
  const territoryById = new Map(rows.territories.map((item) => [text(item.id), item]))
  const missionByAmbassador = new Map<string, AmbassadorRecord[]>()
  for (const assignment of activeMissionAssignments) {
    const mission = rows.missions.find((item) => text(item.id) === text(assignment.mission_id))
    if (!mission) continue
    const key = text(assignment.ambassador_id)
    missionByAmbassador.set(key, [...(missionByAmbassador.get(key) || []), mission])
  }
  const incentiveByAmbassador = new Map<string, AmbassadorRecord[]>()
  for (const incentive of rows.incentives.filter((item) => item.status !== "archived")) {
    const key = text(incentive.ambassador_id)
    incentiveByAmbassador.set(key, [...(incentiveByAmbassador.get(key) || []), incentive])
  }
  const trainingByAmbassador = new Map<string, AmbassadorRecord[]>()
  for (const training of rows.training.filter((item) => !item.archived_at && item.status !== "archived")) {
    const key = text(training.ambassador_id)
    trainingByAmbassador.set(key, [...(trainingByAmbassador.get(key) || []), training])
  }

  const ambassadors = rows.ambassadors.map((ambassador): import("./contracts").AmbassadorProfile => {
    const territory = ambassador.territory_id ? territoryById.get(text(ambassador.territory_id)) : null
    const missions = missionByAmbassador.get(text(ambassador.id)) || []
    const incentives = incentiveByAmbassador.get(text(ambassador.id)) || []
    const trainings = trainingByAmbassador.get(text(ambassador.id)) || []
    return {
      ...ambassador,
      territory_name: ambassador.territory_name || territory?.name || "",
      missions_assigned: missions.length,
      missions_completed: missions.filter((item) => item.status === "completed").length,
      incentives_balance: incentives.filter((item) => ["pending", "approved"].includes(text(item.status))).reduce((sum, item) => sum + Number(item.amount || item.amount_mad || 0), 0),
      incentives_paid_total: incentives.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || item.amount_mad || 0), 0),
      certification_status: trainings.length && trainings.every((item) => item.status === "completed" || item.certification_status === "certified") ? "certified" : ambassador.certification_status || "pending",
    }
  })

  const missions: AmbassadorRecord[] = rows.missions.filter((item) => !item.archived_at && item.status !== "archived").map((mission): AmbassadorRecord => ({
    ...mission,
    assigned_ambassadors: (assignmentsByMission.get(text(mission.id)) || []).map((assignment) => ({
      ambassador_id: assignment.ambassador_id,
      role: assignment.assignment_role,
      status: assignment.status,
      assignment_id: assignment.id,
    })),
  }))
  const territories: AmbassadorRecord[] = rows.territories.map((territory): AmbassadorRecord => ({
    ...territory,
    active_ambassadors_count: activeTerritoryAssignments.filter((assignment) => text(assignment.territory_id) === text(territory.id)).length,
  }))
  const onboarding = rows.onboarding.map((item) => {
    const checklist = arrayOfRecords(item.checklist)
    return { ...item, checklist, completion_rate: completionRate(checklist) }
  })
  const goals = rows.goals.map((item) => ({ ...item, completion_rate: goalCompletion(item) }))
  const activeAmbassadors = ambassadors.filter((item) => !["archived", "suspended", "inactive"].includes(text(item.status || item.lifecycle_stage)))
  const activeTerritories = territories.filter((item) => item.status !== "archived")
  const assignedTerritories = activeTerritories.filter((item) => Number(item.active_ambassadors_count || 0) > 0).length
  const completedMissions = missions.filter((item) => item.status === "completed").length
  const onboardingCompletion = onboarding.length ? Math.round(onboarding.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / onboarding.length) : 0
  const trainingCompletion = rows.training.length ? Math.round((rows.training.filter((item) => item.status === "completed" || item.certification_status === "certified").length / rows.training.length) * 100) : 0
  const certificationValidity = rows.training.length ? Math.round((rows.training.filter((item) => item.certification_status === "certified").length / rows.training.length) * 100) : 0
  const kpiCompletion = goals.length ? Math.round(goals.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / goals.length) : 0
  const incentivesPaid = rows.incentives.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || item.amount_mad || 0), 0)
  const incentivesPending = rows.incentives.filter((item) => ["pending", "approved"].includes(text(item.status))).reduce((sum, item) => sum + Number(item.amount || item.amount_mad || 0), 0)
  const audit = [...rows.audit].sort((a, b) => text(b.created_at).localeCompare(text(a.created_at))).slice(0, 200)

  return {
    records: ambassadors,
    ambassadors,
    archivedRecords: ambassadors.filter((item) => item.status === "archived"),
    territories,
    territoryAssignments: input.territoryAssignments,
    missions,
    missionAssignments: input.missionAssignments,
    recruitment: rows.recruitment,
    leads: rows.leads,
    conversions: rows.conversions,
    onboarding,
    training: rows.training,
    goals,
    incentives: rows.incentives,
    proofs: rows.proofs,
    payouts: rows.payouts,
    reports: rows.reports,
    settings: input.settings,
    audit,
    stats: {
      store: "ambassador-runtime-supabase",
      totalRecords: ambassadors.length + territories.length + missions.length + rows.recruitment.length + rows.leads.length + rows.conversions.length + onboarding.length + rows.training.length + goals.length + rows.incentives.length + rows.proofs.length + rows.payouts.length + rows.reports.length,
      activeTerritories: activeTerritories.length,
      activeMissions: missions.length,
    },
    kpis: {
      totalAmbassadors: ambassadors.length,
      activeAmbassadors: activeAmbassadors.length,
      suspendedAmbassadors: ambassadors.filter((item) => item.status === "suspended").length,
      territoryCoverage: activeTerritories.length ? Math.round((assignedTerritories / activeTerritories.length) * 100) : 0,
      assignedTerritories,
      missionsAssigned: missions.length,
      missionsCompleted: completedMissions,
      onboardingCompletion,
      recruitmentPipeline: rows.recruitment.filter((item) => !["converted", "rejected", "archived"].includes(text(item.stage))).length,
      leadsOpen: rows.leads.filter((item) => !["converted", "lost", "archived"].includes(text(item.status))).length,
      conversionsPending: rows.conversions.filter((item) => !["validated", "rejected", "paid", "archived"].includes(text(item.status))).length,
      trainingCompletion,
      certificationValidity,
      kpiCompletion,
      incentivesPaid,
      incentivesPending,
      proofsPending: rows.proofs.filter((item) => ["submitted", "under_review", "revision_requested"].includes(text(item.status))).length,
      payoutsPending: rows.payouts.filter((item) => ["draft", "pending_approval", "approved", "processing"].includes(text(item.status))).length,
    },
    activity: audit.slice(0, 20),
    diagnostics: [],
    updatedAt: now(),
  }
}

export async function loadAmbassadorWorkspaceSnapshot(actor: AmbassadorActor): Promise<AmbassadorServiceResult<AmbassadorWorkspaceSnapshot>> {
  try {
    requireAmbassadorPermission(actor, "ambassadors.read")
    const entityKeys = Object.keys(ENTITY_CONFIG) as AmbassadorEntityKey[]
    const readable = entityKeys.filter((entity) => actorCan(actor, READ_PERMISSION[entity]))
    const entries = await Promise.all(readable.map(async (entity) => [entity, await listRows(entity, actor, entity === "audit" ? 200 : 500)] as const))
    const rows = Object.fromEntries(entityKeys.map((entity) => [entity, [] as AmbassadorRecord[]])) as unknown as Record<AmbassadorEntityKey, AmbassadorRecord[]>
    for (const [entity, values] of entries) rows[entity] = values
    const settings = actorCan(actor, "settings.read") ? { ...DEFAULT_SETTINGS, ...(await getSettingsRow(actor) || {}) } : { ...DEFAULT_SETTINGS }
    const assignments = await assignmentsForSnapshot(actor)
    const snapshot = enrichSnapshot({ rows, settings, ...assignments })
    return success(snapshot, { snapshot })
  } catch (error) {
    return failure(error)
  }
}

export const loadAmbassadorServerSnapshot = loadAmbassadorWorkspaceSnapshot

export async function listAmbassadorEntity(actor: AmbassadorActor, entity: AmbassadorEntityKey): Promise<AmbassadorServiceResult<AmbassadorRecord[]>> {
  try {
    requireAmbassadorPermission(actor, READ_PERMISSION[entity])
    const records = await listRows(entity, actor, entity === "audit" ? 200 : 500)
    return success(records, { records, items: records })
  } catch (error) {
    return failure(error)
  }
}

export async function getAmbassadorEntity(actor: AmbassadorActor, entity: AmbassadorEntityKey, id: string): Promise<AmbassadorServiceResult<AmbassadorRecord | null>> {
  try {
    requireAmbassadorPermission(actor, READ_PERMISSION[entity])
    const record = await getRow(entity, id, actor)
    if (!record) throw new AmbassadorServiceError("NOT_FOUND", "Record not found", 404)
    return success(record, { record })
  } catch (error) {
    return failure(error)
  }
}

export async function createAmbassadorEntity(actor: AmbassadorActor, entity: AmbassadorEntityKey, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    if (entity === "audit") throw new AmbassadorServiceError("FORBIDDEN", "Audit events are server-generated and immutable", 403)
    requireAmbassadorPermission(actor, WRITE_PERMISSION[entity])
    let row = applyDefaults(entity, cleanEntityPayload(entity, payload, null, actor), null)
    if (entity === "ambassadors") { row.status = "candidate"; row.lifecycle_stage = "candidate" }
    if (entity === "missions") row.status = "draft"
    if (entity === "recruitment") row.stage = "sourced"
    if (entity === "leads") row.status = "new"
    if (entity === "conversions") row.status = "pending"
    if (entity === "missions") {
      const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
        territory: text(row.territory_id),
        city: text(row.city),
        region: text(row.region),
      })
      const missionType = text(row.mission_type)
      if (missionType && !settings.missions.allowedMissionTypes.includes(missionType)) {
        throw new AmbassadorServiceError("GATE_BLOCKED", `Mission type ${missionType} is not enabled by the effective Ambassador policy`, 409)
      }
      row.proof_required = settings.missions.proofRequired
    }
    if (entity === "incentives") {
      const settings = await getEffectiveAmbassadorSettingsConfiguration(actor)
      const amount = Number(row.amount_mad ?? row.amount ?? 0)
      if (amount > settings.rewards.maximumRewardMad) {
        throw new AmbassadorServiceError("GATE_BLOCKED", `Reward amount exceeds the effective ${settings.rewards.maximumRewardMad} Dh policy cap`, 409)
      }
      row.currency = "MAD"
    }
    validateBusinessRules(entity, row)
    if (entity === "recruitment") await assertCandidateUnique(actor, String(row.identity_hash))
    if (entity === "incentives") {
      row.status = "pending"
      row.approved_by = null
      row.approved_by_actor_id = null
      row.approved_at = null
      row.paid_at = null
    }
    if (entity === "proofs") {
      row.status = "submitted"
      row.reviewed_by_actor_id = null
      row.reviewed_at = null
    }
    if (entity === "payouts") row.status = "draft"
    const record = await insertRow(entity, row, actor)
    await writeAudit(actor, { entityType: entity, entityId: text(record.id), action: "create", summary: `Created ${entity} record`, after: record })

    if (entity === "missions") {
      const ambassadorIds = Array.from(new Set([...(Array.isArray(payload.ambassador_ids) ? payload.ambassador_ids : []), payload.ambassador_id].map(text).filter(Boolean)))
      if (ambassadorIds.length) await assignMissionToAmbassador(actor, { id: text(record.id), ambassador_ids: ambassadorIds, assignment_role: "primary" })
    }
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function updateAmbassadorEntity(actor: AmbassadorActor, entity: AmbassadorEntityKey, idOrPayload: string | Record<string, unknown>, patch?: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    if (entity === "audit") throw new AmbassadorServiceError("FORBIDDEN", "Audit events are immutable", 403)
    requireAmbassadorPermission(actor, WRITE_PERMISSION[entity])
    const id = typeof idOrPayload === "string" ? idOrPayload : text(idOrPayload.id)
    const payload = typeof idOrPayload === "string" ? patch || {} : idOrPayload
    if (!id) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing record id", 400)
    rejectControlledGenericMutation(entity, payload)
    const existing = await getRow(entity, id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Record not found", 404)
    let next = applyDefaults(entity, cleanEntityPayload(entity, { ...existing, ...payload, id }, existing, actor), existing)
    validateBusinessRules(entity, next)
    const lifecycle = ENTITY_LIFECYCLES[entity]
    if (lifecycle && normalizeLifecycleValue(existing[lifecycle.field]) !== normalizeLifecycleValue(next[lifecycle.field])) {
      assertTransitionPermission(actor, entity)
      assertTransition(entity, existing, next)
    }
    if (entity === "recruitment" && next.identity_hash && next.identity_hash !== existing.identity_hash) {
      await assertCandidateUnique(actor, String(next.identity_hash), id)
    }
    const record = await updateRow(entity, id, next, actor)
    await writeAudit(actor, { entityType: entity, entityId: id, action: "update", summary: `Updated ${entity} record`, before: existing, after: record })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function archiveAmbassadorEntity(actor: AmbassadorActor, entity: AmbassadorEntityKey, id: string): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    if (entity === "audit") throw new AmbassadorServiceError("FORBIDDEN", "Audit events are immutable", 403)
    requireAmbassadorPermission(actor, entity === "ambassadors" ? "ambassadors.archive" : WRITE_PERMISSION[entity])
    const existing = await getRow(entity, id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Record not found", 404)
    const lifecycle = ENTITY_LIFECYCLES[entity]
    const patch: AmbassadorRecord = { id, archived_at: now(), updated_by_actor_id: actor.actorId }
    if (lifecycle) {
      assertTransitionPermission(actor, entity)
      assertLifecycleTransition(entity, existing[lifecycle.field], "archived")
      patch[lifecycle.field] = "archived"
      if (lifecycle.field !== "status" && "status" in existing) patch.status = "archived"
    } else if ("status" in existing) patch.status = "archived"
    const record = await updateRow(entity, id, patch, actor)
    await writeAudit(actor, { entityType: entity, entityId: id, action: "archive", summary: `Archived ${entity} record`, before: existing, after: record })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

async function revokePreviousPrimaryTerritories(actor: AmbassadorActor, ambassadorId: string, exceptAssignmentId: string): Promise<void> {
  const timestamp = now()
  const result = await getAmbassadorSupabaseAdmin()
    .from(TERRITORY_ASSIGNMENTS_TABLE)
    .update({ status: "revoked", valid_to: timestamp, revoked_by_actor_id: actor.actorId, updated_by_actor_id: actor.actorId })
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("ambassador_id", ambassadorId)
    .eq("assignment_type", "primary")
    .eq("status", "approved")
    .neq("id", exceptAssignmentId)
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
}

async function assertTerritoryCapacity(
  actor: AmbassadorActor,
  territoryId: string,
  maximum: number,
): Promise<void> {
  const result = await getAmbassadorSupabaseAdmin()
    .from(TERRITORY_ASSIGNMENTS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("territory_id", territoryId)
    .eq("status", "approved")
    .is("archived_at", null)
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
  if (Number(result.count || 0) >= maximum) {
    throw new AmbassadorServiceError("GATE_BLOCKED", `Territory capacity is limited to ${maximum} active Ambassadors by the effective policy`, 409)
  }
}

async function activeMissionAssignmentCount(
  actor: AmbassadorActor,
  ambassadorId: string,
  exceptMissionId: string,
): Promise<number> {
  const result = await getAmbassadorSupabaseAdmin()
    .from(MISSION_ASSIGNMENTS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("ambassador_id", ambassadorId)
    .in("status", ["assigned", "accepted"])
    .neq("mission_id", exceptMissionId)
    .is("archived_at", null)
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
  return Number(result.count || 0)
}

async function persistTerritoryAssignment(actor: AmbassadorActor, payload: Record<string, unknown>, initialStatus: "pending" | "approved"): Promise<AmbassadorTerritoryAssignment> {
  const ambassadorId = text(payload.ambassador_id)
  const territoryId = text(payload.territory_id)
  if (!ambassadorId || !territoryId) throw new AmbassadorServiceError("VALIDATION_ERROR", "Ambassador and territory are required", 400)
  const [ambassador, territory] = await Promise.all([getRow("ambassadors", ambassadorId, actor), getRow("territories", territoryId, actor)])
  if (!ambassador) throw new AmbassadorServiceError("NOT_FOUND", "Ambassador not found", 404)
  if (!territory) throw new AmbassadorServiceError("NOT_FOUND", "Territory not found", 404)
  if (["archived", "suspended", "inactive"].includes(normalizeLifecycleValue(ambassador.status || ambassador.lifecycle_stage))) {
    throw new AmbassadorServiceError("GATE_BLOCKED", "Archived, suspended or inactive ambassadors cannot be assigned", 409)
  }
  const assignmentType = text(payload.assignment_type) || "primary"
  if (!["primary", "backup", "temporary"].includes(assignmentType)) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", "Territory assignment type must be primary, backup or temporary", 400)
  }
  const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
    territory: territoryId,
    city: text(territory.city),
    region: text(territory.region),
  })
  if (assignmentType === "backup" && !settings.territories.allowBackupAssignments) {
    throw new AmbassadorServiceError("GATE_BLOCKED", "Backup territory assignments are disabled by the effective policy", 409)
  }
  if (assignmentType === "temporary" && !settings.territories.allowTemporaryAssignments) {
    throw new AmbassadorServiceError("GATE_BLOCKED", "Temporary territory assignments are disabled by the effective policy", 409)
  }
  const radiusKm = Number(payload.radius_km ?? settings.territories.travelRadiusKm)
  if (radiusKm > settings.territories.travelRadiusKm) {
    throw new AmbassadorServiceError("GATE_BLOCKED", `Territory travel radius exceeds the effective ${settings.territories.travelRadiusKm} km limit`, 409)
  }
  const externalKey = text(payload.assignment_id || payload.external_assignment_key) || null
  const idempotencyKey = text(payload.idempotency_key) || `${ambassadorId}:${territoryId}:${assignmentType}:${externalKey || "direct"}`
  const existingResult = await getAmbassadorSupabaseAdmin()
    .from(TERRITORY_ASSIGNMENTS_TABLE)
    .select("*")
    .eq("tenant_id", actor.tenantId)
    .eq("organization_id", actor.organizationId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()
  if (existingResult.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", existingResult.error.message, 503)
  if (existingResult.data) return existingResult.data as AmbassadorTerritoryAssignment
  if (initialStatus === "approved") {
    await assertTerritoryCapacity(actor, territoryId, settings.territories.maximumAmbassadorsPerTerritory)
  }

  const row = {
    id: randomUUID(),
    tenant_id: actor.tenantId,
    organization_id: actor.organizationId,
    ambassador_id: ambassadorId,
    territory_id: territoryId,
    assignment_type: assignmentType,
    coverage_mode: payload.coverage_mode || null,
    radius_km: radiusKm,
    status: initialStatus,
    external_assignment_key: externalKey,
    idempotency_key: idempotencyKey,
    requested_by_actor_id: actor.actorId,
    decided_by_actor_id: initialStatus === "approved" ? actor.actorId : null,
    decision_note: payload.decision_note || null,
    requested_at: now(),
    decided_at: initialStatus === "approved" ? now() : null,
    valid_from: initialStatus === "approved" ? now() : null,
    valid_to: assignmentType === "temporary"
      ? new Date(Date.now() + settings.territories.defaultAssignmentDays * 86_400_000).toISOString()
      : null,
    metadata: { source: payload.source || "market-os-ambassadors" },
    created_by_actor_id: actor.actorId,
    updated_by_actor_id: actor.actorId,
  }
  const result = await getAmbassadorSupabaseAdmin().from(TERRITORY_ASSIGNMENTS_TABLE).insert(row).select("*").single()
  if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)
  return result.data as AmbassadorTerritoryAssignment
}

export async function assignAmbassadorTerritory(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "territories.assign")
    const territoryId = text(payload.territory_id)
    const territoryBefore = territoryId ? await getRow("territories", territoryId, actor) : null
    if (!territoryBefore) throw new AmbassadorServiceError("NOT_FOUND", "Territory not found", 404)
    const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
      territory: territoryId,
      city: text(territoryBefore.city),
      region: text(territoryBefore.region),
    })
    const assignment = await persistTerritoryAssignment(actor, payload, settings.territories.managerApprovalRequired ? "pending" : "approved")
    const territory = await getRow("territories", assignment.territory_id, actor)
    if (!territory) throw new AmbassadorServiceError("NOT_FOUND", "Territory not found", 404)
    const ambassador = await getRow("ambassadors", assignment.ambassador_id, actor)
    if (!ambassador) throw new AmbassadorServiceError("NOT_FOUND", "Ambassador not found", 404)
    if (assignment.status === "pending") {
      await writeAudit(actor, {
        entityType: "territory_assignments",
        entityId: assignment.id,
        action: "territory_assignment_requested",
        summary: `Requested territory assignment for ${text(ambassador.full_name) || ambassador.id}`,
        payload: { assignment },
        before: ambassador,
      })
      const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
      return success(ambassador, { record: ambassador, assignment, pendingApproval: true, snapshot: snapshotResult.snapshot })
    }
    if (assignment.assignment_type === "primary" && settings.territories.exclusivePrimaryAssignment) {
      await revokePreviousPrimaryTerritories(actor, assignment.ambassador_id, assignment.id)
    }
    const updated = await updateRow("ambassadors", assignment.ambassador_id, {
      id: assignment.ambassador_id,
      territory_id: assignment.territory_id,
      territory_name: territory.name,
      city: payload.city || territory.city || ambassador.city,
      region: payload.region || territory.region || ambassador.region,
      updated_by_actor_id: actor.actorId,
    }, actor)
    await writeAudit(actor, {
      entityType: "territory_assignments",
      entityId: assignment.id,
      action: "territory_assignment_approved",
      summary: `Assigned ${text(updated.full_name) || updated.id} to ${text(territory.name) || territory.id}`,
      payload: { assignment, source: payload.source || null },
      before: ambassador,
      after: updated,
    })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(updated, { record: updated, assignment, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function decideTerritoryAssignment(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "territories.approve")
    const decision = normalizeLifecycleValue(payload.decision)
    if (!text(payload.territory_id) || !text(payload.ambassador_id) || !text(payload.assignment_id)) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", "territory_id, assignment_id and ambassador_id are required", 400)
    }
    if (!["approved", "rejected"].includes(decision)) throw new AmbassadorServiceError("VALIDATION_ERROR", "Decision must be approved or rejected", 400)
    if (decision === "rejected" && !text(payload.decision_note)) throw new AmbassadorServiceError("VALIDATION_ERROR", "A rejection reason is required", 400)

    let query: any = getAmbassadorSupabaseAdmin()
      .from(TERRITORY_ASSIGNMENTS_TABLE)
      .select("*")
      .eq("tenant_id", actor.tenantId)
      .eq("organization_id", actor.organizationId)
      .eq("ambassador_id", text(payload.ambassador_id))
      .eq("territory_id", text(payload.territory_id))
    const assignmentId = text(payload.assignment_id)
    query = /^[0-9a-f-]{36}$/i.test(assignmentId) ? query.eq("id", assignmentId) : query.eq("external_assignment_key", assignmentId)
    const existingResult = await query.maybeSingle()
    if (existingResult.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", existingResult.error.message, 503)
    let assignment = existingResult.data as AmbassadorTerritoryAssignment | null
    if (!assignment) assignment = await persistTerritoryAssignment(actor, payload, "pending")
    if (["approved", "rejected"].includes(text(assignment.status))) {
      if (text(assignment.status) !== decision) throw new AmbassadorServiceError("CONFLICT", "This assignment already has a different final decision", 409)
      const ambassador = await getRow("ambassadors", assignment.ambassador_id, actor)
      return success(ambassador || { id: assignment.ambassador_id }, { record: ambassador, assignment, idempotent: true, decision })
    }
    const territoryForPolicy = await getRow("territories", assignment.territory_id, actor)
    if (!territoryForPolicy) throw new AmbassadorServiceError("NOT_FOUND", "Territory not found", 404)
    const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
      territory: assignment.territory_id,
      city: text(territoryForPolicy.city),
      region: text(territoryForPolicy.region),
    })
    if (decision === "approved") {
      await assertTerritoryCapacity(actor, assignment.territory_id, settings.territories.maximumAmbassadorsPerTerritory)
    }

    const updateResult = await getAmbassadorSupabaseAdmin()
      .from(TERRITORY_ASSIGNMENTS_TABLE)
      .update({
        status: decision,
        decided_by_actor_id: actor.actorId,
        decision_note: payload.decision_note || null,
        decided_at: now(),
        valid_from: decision === "approved" ? now() : null,
        updated_by_actor_id: actor.actorId,
      })
      .eq("id", assignment.id)
      .eq("tenant_id", actor.tenantId)
      .eq("organization_id", actor.organizationId)
      .eq("status", "pending")
      .select("*")
      .single()
    if (updateResult.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", updateResult.error.message, 503)
    assignment = updateResult.data as AmbassadorTerritoryAssignment
    let ambassador = await getRow("ambassadors", assignment.ambassador_id, actor)
    if (!ambassador) throw new AmbassadorServiceError("NOT_FOUND", "Ambassador not found", 404)
    if (decision === "approved") {
      if (assignment.assignment_type === "primary" && settings.territories.exclusivePrimaryAssignment) {
        await revokePreviousPrimaryTerritories(actor, assignment.ambassador_id, assignment.id)
      }
      const territory = await getRow("territories", assignment.territory_id, actor)
      if (!territory) throw new AmbassadorServiceError("NOT_FOUND", "Territory not found", 404)
      ambassador = await updateRow("ambassadors", assignment.ambassador_id, {
        id: assignment.ambassador_id,
        territory_id: assignment.territory_id,
        territory_name: territory.name,
        city: payload.city || territory.city || ambassador.city,
        region: payload.region || territory.region || ambassador.region,
        updated_by_actor_id: actor.actorId,
      }, actor)
    }
    await writeAudit(actor, {
      entityType: "territory_assignments",
      entityId: assignment.id,
      action: decision === "approved" ? "territory_assignment_approved" : "territory_assignment_rejected",
      summary: `${decision === "approved" ? "Approved" : "Rejected"} territory assignment for ${text(ambassador.full_name) || ambassador.id}`,
      payload: { assignment, decision_note: payload.decision_note || null },
      after: ambassador,
    })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(ambassador, { record: ambassador, assignment, decision, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function assignMissionToAmbassador(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "missions.assign")
    const missionId = text(payload.id || payload.mission_id)
    if (!missionId) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing mission id", 400)
    const mission = await getRow("missions", missionId, actor)
    if (!mission) throw new AmbassadorServiceError("NOT_FOUND", "Mission not found", 404)
    const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
      territory: text(mission.territory_id),
      city: text(mission.city),
      region: text(mission.region),
    })
    const missionType = text(mission.mission_type)
    if (missionType && !settings.missions.allowedMissionTypes.includes(missionType)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", `Mission type ${missionType} is not enabled by the effective Ambassador policy`, 409)
    }
    const ambassadorIds = Array.from(new Set([...(Array.isArray(payload.ambassador_ids) ? payload.ambassador_ids : []), payload.ambassador_id].map(text).filter(Boolean)))
    if (!ambassadorIds.length) throw new AmbassadorServiceError("VALIDATION_ERROR", "At least one ambassador is required", 400)
    const ambassadors = await Promise.all(ambassadorIds.map((id) => getRow("ambassadors", id, actor)))
    if (ambassadors.some((item) => !item)) throw new AmbassadorServiceError("NOT_FOUND", "One or more ambassadors were not found in the authenticated scope", 404)
    const concurrentCounts = await Promise.all(ambassadorIds.map((id) => activeMissionAssignmentCount(actor, id, missionId)))
    const overloadedIndex = concurrentCounts.findIndex((count) => count >= settings.missions.maximumConcurrentMissions)
    if (overloadedIndex >= 0) {
      const overloaded = ambassadors[overloadedIndex]
      throw new AmbassadorServiceError(
        "GATE_BLOCKED",
        `${text(overloaded?.full_name) || ambassadorIds[overloadedIndex]} already reached the effective limit of ${settings.missions.maximumConcurrentMissions} concurrent missions`,
        409,
      )
    }

    const roleById = payload.roles && typeof payload.roles === "object" ? payload.roles as Record<string, unknown> : {}
    const rows = ambassadorIds.map((ambassadorId, index) => ({
      id: randomUUID(),
      tenant_id: actor.tenantId,
      organization_id: actor.organizationId,
      mission_id: missionId,
      ambassador_id: ambassadorId,
      assignment_role: text(roleById[ambassadorId]) || (index === 0 ? text(payload.assignment_role) || "primary" : "support"),
      status: "assigned",
      assigned_by_actor_id: actor.actorId,
      assigned_at: now(),
      idempotency_key: `${missionId}:${ambassadorId}`,
      metadata: { source: payload.source || "market-os-ambassadors" },
      created_by_actor_id: actor.actorId,
      updated_by_actor_id: actor.actorId,
    }))
    const result = await getAmbassadorSupabaseAdmin()
      .from(MISSION_ASSIGNMENTS_TABLE)
      .upsert(rows, { onConflict: "tenant_id,organization_id,mission_id,ambassador_id" })
      .select("*")
    if (result.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", result.error.message, 503)

    const currentStatus = normalizeLifecycleValue(mission.status)
    const patch: AmbassadorRecord = {
      id: missionId,
      ambassador_id: ambassadorIds[0],
      assigned_ambassador_id: ambassadorIds[0],
      updated_by_actor_id: actor.actorId,
    }
    if (currentStatus === "draft") patch.status = "assigned"
    const updated = await updateRow("missions", missionId, patch, actor)
    await writeAudit(actor, {
      entityType: "mission_assignments",
      entityId: missionId,
      action: "mission_ambassadors_assigned",
      summary: `Assigned ${ambassadorIds.length} ambassador(s) to mission`,
      payload: { assignment_ids: (result.data || []).map((item: AmbassadorRecord) => item.id), ambassador_ids: ambassadorIds },
      before: mission,
      after: updated,
    })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(updated, { record: updated, assignments: result.data || [], snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function moveRecruitmentStage(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "recruitment.transition")
    const id = text(payload.id)
    const target = normalizeLifecycleValue(payload.stage)
    if (!id || !target) throw new AmbassadorServiceError("VALIDATION_ERROR", "Candidate id and target stage are required", 400)
    const existing = await getRow("recruitment", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Candidate not found", 404)
    assertLifecycleTransition("recruitment", existing.stage, target)
    if (target === "converted") {
      requireAmbassadorPermission(actor, "recruitment.convert")
      const response = await rpc<Record<string, unknown>>("market_os_ambassador_convert_candidate", {
        p_candidate_id: id,
        p_actor_id: actor.actorId,
        p_tenant_id: actor.tenantId,
        p_organization_id: actor.organizationId,
        p_idempotency_key: text(payload.idempotency_key) || `candidate-conversion:${id}`,
      })
      const record = response.candidate as AmbassadorRecord
      const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
      return success(record, { record, ambassador: response.ambassador, idempotent: Boolean(response.idempotent), snapshot: snapshotResult.snapshot })
    }
    const record = await updateRow("recruitment", id, {
      id,
      stage: target,
      next_step: payload.next_step,
      notes: payload.notes,
      updated_by_actor_id: actor.actorId,
    }, actor)
    await writeAudit(actor, { entityType: "recruitment", entityId: id, action: "recruitment_stage_transition", summary: `Moved candidate from ${text(existing.stage)} to ${target}`, payload: { from: existing.stage, to: target }, before: existing, after: record })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function completeOnboardingStep(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "onboarding.write")
    const id = text(payload.id)
    const stepId = text(payload.step_id)
    if (!id || !stepId) throw new AmbassadorServiceError("VALIDATION_ERROR", "Onboarding id and step id are required", 400)
    const existing = await getRow("onboarding", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Onboarding record not found", 404)
    const checklist = arrayOfRecords(existing.checklist).map((step) => text(step.id) === stepId ? { ...step, done: Boolean(payload.done), completed_by_actor_id: payload.done ? actor.actorId : null, completed_at: payload.done ? now() : null } : step)
    const rate = completionRate(checklist)
    const record = await updateRow("onboarding", id, { id, checklist, completion_rate: rate, stage: rate >= 100 ? "completed" : existing.stage, completed_at: rate >= 100 ? now() : null, updated_by_actor_id: actor.actorId }, actor)
    await writeAudit(actor, { entityType: "onboarding", entityId: id, action: "onboarding_checklist_updated", summary: `Updated onboarding checklist step ${stepId}`, payload: { step_id: stepId, done: Boolean(payload.done), completion_rate: rate }, before: existing, after: record })
    return success(record, { record })
  } catch (error) {
    return failure(error)
  }
}

export async function recalculateGoal(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "goals.write")
    const id = text(payload.id)
    if (!id) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing goal id", 400)
    const existing = await getRow("goals", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Goal not found", 404)
    const rate = goalCompletion(existing)
    const record = await updateRow("goals", id, { id, completion_rate: rate, status: rate >= 100 ? "achieved" : existing.status || "tracking", updated_by_actor_id: actor.actorId }, actor)
    await writeAudit(actor, { entityType: "goals", entityId: id, action: "goal_recalculated", summary: "Recalculated Ambassador goal", payload: { completion_rate: rate }, before: existing, after: record })
    return success(record, { record })
  } catch (error) {
    return failure(error)
  }
}

export async function decideConversion(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "conversions.review")
    const id = text(payload.id || payload.conversion_id)
    const status = normalizeLifecycleValue(payload.status || payload.validation_decision || "validated")
    if (!id) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing conversion id", 400)
    const existing = await getRow("conversions", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Conversion not found", 404)
    assertLifecycleTransition("conversions", existing.status, status)
    if (status === "validated") {
      const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
        territory: text(existing.territory_id),
        city: text(existing.city),
        region: text(existing.region),
      })
      if (settings.attribution.conversionProofRequired) {
        const proofId = text(payload.proof_id || existing.proof_id)
        if (!proofId) throw new AmbassadorServiceError("GATE_BLOCKED", "An approved proof is required before conversion validation", 409)
        const proof = await getRow("proofs", proofId, actor)
        if (!proof || proof.status !== "approved") throw new AmbassadorServiceError("GATE_BLOCKED", "The linked proof is not approved", 409)
      }
    }
    const patch: AmbassadorRecord = {
      id,
      status,
      validation_decision: status,
      validation_note: payload.validation_note || payload.notes || null,
      validated_by: actor.displayName,
      validated_by_actor_id: actor.actorId,
      updated_by_actor_id: actor.actorId,
    }
    if (status === "validated") patch.validated_at = now()
    if (status === "rejected") patch.rejected_at = now()
    const record = await updateRow("conversions", id, patch, actor)
    await writeAudit(actor, { entityType: "conversions", entityId: id, action: `conversion_${status}`, summary: `Conversion decision: ${status}`, payload: { note: patch.validation_note }, before: existing, after: record })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function decideProof(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "proofs.review")
    const id = text(payload.id || payload.proof_id)
    const decision = normalizeLifecycleValue(payload.status || payload.decision)
    if (!id || !["approved", "rejected", "revision_requested", "under_review"].includes(decision)) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", "Proof id and a valid decision are required", 400)
    }
    if (["rejected", "revision_requested"].includes(decision) && !text(payload.review_note || payload.reason)) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", "A review note is required", 400)
    }
    const existing = await getRow("proofs", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Proof not found", 404)
    assertLifecycleTransition("proofs", existing.status, decision)
    const record = await updateRow("proofs", id, {
      id,
      status: decision,
      review_note: payload.review_note || payload.reason || null,
      reviewed_by_actor_id: actor.actorId,
      reviewed_at: now(),
      updated_by_actor_id: actor.actorId,
    }, actor)
    await writeAudit(actor, { entityType: "proofs", entityId: id, action: `proof_${decision}`, summary: `Proof decision: ${decision}`, payload: { review_note: record.review_note }, before: existing, after: record })
    return success(record, { record })
  } catch (error) {
    return failure(error)
  }
}

export async function decideIncentive(actor: AmbassadorActor, payload: Record<string, unknown>, decision: "approved" | "rejected" | "paid"): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    const permission: AmbassadorPermission = decision === "paid" ? "payouts.execute" : "rewards.approve"
    requireAmbassadorPermission(actor, permission)
    const id = text(payload.id)
    if (!id) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing incentive id", 400)
    const existing = await getRow("incentives", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Incentive not found", 404)
    assertLifecycleTransition("incentives", existing.status, decision)
    const settings = await getEffectiveAmbassadorSettingsConfiguration(actor)
    if (decision === "approved" && settings.rewards.proofRequiredBeforeReward && !(await approvedRewardSource(actor, existing))) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Reward approval requires an approved proof or validated conversion", 409)
    }
    if (decision === "paid" && existing.status !== "approved") {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Only an approved reward can be paid", 409)
    }
    if (decision === "paid" && settings.rewards.paymentReferenceRequired && !text(payload.payment_reference)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "A payment reference is required", 409)
    }
    const response = await rpc<Record<string, unknown>>("market_os_ambassador_decide_incentive", {
      p_incentive_id: id,
      p_decision: decision,
      p_actor_id: actor.actorId,
      p_tenant_id: actor.tenantId,
      p_organization_id: actor.organizationId,
      p_reason: text(payload.reason) || null,
      p_payment_reference: text(payload.payment_reference) || null,
      p_idempotency_key: text(payload.idempotency_key) || `${decision}:${id}`,
    })
    const record = response.incentive as AmbassadorRecord
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, payout: response.payout || null, idempotent: Boolean(response.idempotent), snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function updateMissionStatus(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "missions.transition")
    const id = text(payload.id)
    const status = normalizeLifecycleValue(payload.status || "completed")
    if (!id) throw new AmbassadorServiceError("VALIDATION_ERROR", "Missing mission id", 400)
    const existing = await getRow("missions", id, actor)
    if (!existing) throw new AmbassadorServiceError("NOT_FOUND", "Mission not found", 404)
    assertLifecycleTransition("missions", existing.status, status)
    const settings = await getEffectiveAmbassadorSettingsConfiguration(actor, {
      territory: text(existing.territory_id),
      city: text(existing.city),
      region: text(existing.region),
    })
    const missionProofRequired = existing.proof_required !== false && settings.missions.proofRequired
    if (["approved", "completed"].includes(status) && missionProofRequired && settings.missions.completionRequiresApprovedProof) {
      const proof = await approvedProofForMission(actor, id)
      if (!proof) throw new AmbassadorServiceError("GATE_BLOCKED", "Mission approval or completion requires an approved proof", 409)
    }
    const record = await updateRow("missions", id, { id, status, completed_at: status === "completed" ? now() : null, updated_by_actor_id: actor.actorId }, actor)
    if (status === "completed") {
      const assignmentResult = await getAmbassadorSupabaseAdmin()
        .from(MISSION_ASSIGNMENTS_TABLE)
        .update({ status: "completed", completed_at: now(), updated_by_actor_id: actor.actorId })
        .eq("tenant_id", actor.tenantId)
        .eq("organization_id", actor.organizationId)
        .eq("mission_id", id)
        .in("status", ["assigned", "accepted"])
      if (assignmentResult.error) throw new AmbassadorServiceError("PERSISTENCE_ERROR", assignmentResult.error.message, 503)
    }
    await writeAudit(actor, { entityType: "missions", entityId: id, action: `mission_${status}`, summary: `Mission transitioned to ${status}`, payload: { from: existing.status, to: status }, before: existing, after: record })
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    return success(record, { record, snapshot: snapshotResult.snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function getAmbassadorSettings(actor: AmbassadorActor): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "settings.read")
    const record = { ...DEFAULT_SETTINGS, ...(await getSettingsRow(actor) || {}) }
    return success(record, { record })
  } catch (error) {
    return failure(error)
  }
}

export async function updateAmbassadorSettings(actor: AmbassadorActor, _payload: Record<string, unknown>): Promise<AmbassadorServiceResult<AmbassadorRecord>> {
  try {
    requireAmbassadorPermission(actor, "settings.write")
    throw new AmbassadorServiceError(
      "GATE_BLOCKED",
      "Direct settings updates are retired. Create a versioned draft in the Ambassador Settings Control Center, validate it, obtain required approvals, then publish it.",
      409,
    )
  } catch (error) {
    return failure(error)
  }
}

export async function generateAmbassadorReport(actor: AmbassadorActor, payload: Record<string, unknown>): Promise<AmbassadorServiceResult<{ filename: string; csv: string; report: AmbassadorRecord | null }>> {
  try {
    requireAmbassadorPermission(actor, "reports.generate")
    const snapshotResult = await loadAmbassadorWorkspaceSnapshot(actor)
    if (!snapshotResult.ok || !snapshotResult.snapshot) throw new AmbassadorServiceError("PERSISTENCE_ERROR", snapshotResult.error || "Snapshot unavailable", 503)
    const reportType = text(payload.report_type) || "ambassadors"
    const rows = rowsForReport(snapshotResult.snapshot, reportType)
    const csv = buildCsv(rows.headers, rows.rows)
    const reportResult = await createAmbassadorEntity(actor, "reports", {
      report_type: reportType,
      title: payload.title || `${reportType} report`,
      period_start: payload.period_start || null,
      period_end: payload.period_end || null,
      generated_by: actor.displayName,
      generated_by_actor_id: actor.actorId,
      filters: payload.filters || {},
      row_count: rows.rows.length,
      status: "generated",
    })
    if (!reportResult.ok) throw new AmbassadorServiceError(reportResult.code || "PERSISTENCE_ERROR", reportResult.error || "Report record could not be persisted", Number(reportResult.status || 503))
    return { ok: true, source: "ambassador-report-engine", data: { filename: `angelcare-ambassadors-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`, csv, report: reportResult.record || null } }
  } catch (error) {
    return failure(error)
  }
}

function rowsForReport(snapshot: AmbassadorWorkspaceSnapshot, reportType: string): { headers: string[]; rows: unknown[][] } {
  if (reportType.includes("territor")) return { headers: ["Territory", "City", "Region", "Goal", "Active", "Manager", "Status"], rows: snapshot.territories.map((item) => [item.name, item.city, item.region, item.coverage_goal, item.active_ambassadors_count, item.manager_name, item.status]) }
  if (reportType.includes("mission")) return { headers: ["Mission", "Ambassadors", "City", "Status", "Due", "Completed"], rows: snapshot.missions.map((item) => [item.title, arrayOfRecords(item.assigned_ambassadors).map((entry) => entry.ambassador_id).join(";"), item.city, item.status, item.due_date, item.completed_at]) }
  if (reportType.includes("recruit")) return { headers: ["Candidate", "Email", "Phone", "City", "Stage", "Score", "Next Step"], rows: snapshot.recruitment.map((item) => [item.candidate_name, item.email, item.phone, item.city, item.stage, item.evaluation_score, item.next_step]) }
  if (reportType.includes("lead")) return { headers: ["Lead", "Parent", "Phone", "City", "Source", "Status", "Score", "Ambassador"], rows: snapshot.leads.map((item) => [item.lead_name, item.parent_name, item.phone, item.city, item.source, item.status, item.score, item.ambassador_id]) }
  if (reportType.includes("conversion")) return { headers: ["Lead", "Parent", "Ambassador", "City", "Offer", "Value", "Status", "Validated"], rows: snapshot.conversions.map((item) => [item.lead_name, item.parent_name, item.ambassador_name || item.ambassador_id, item.city, item.offer_name, item.value, item.status, item.validated_at]) }
  if (reportType.includes("proof")) return { headers: ["Proof", "Mission", "Ambassador", "Status", "Reviewed"], rows: snapshot.proofs.map((item) => [item.title, item.mission_id, item.ambassador_id, item.status, item.reviewed_at]) }
  if (reportType.includes("payout")) return { headers: ["Ambassador", "Incentive", "Amount", "Status", "Reference", "Paid"], rows: snapshot.payouts.map((item) => [item.ambassador_id, item.incentive_id, item.amount_mad, item.status, item.payment_reference, item.paid_at]) }
  if (reportType.includes("onboard")) return { headers: ["Ambassador", "Stage", "Completion", "Owner", "Due"], rows: snapshot.onboarding.map((item) => [item.ambassador_id, item.stage, item.completion_rate, item.assigned_owner, item.due_date]) }
  if (reportType.includes("training")) return { headers: ["Ambassador", "Training", "Status", "Certification", "Score", "Valid Until"], rows: snapshot.training.map((item) => [item.ambassador_id, item.training_name, item.status, item.certification_status, item.score, item.valid_until]) }
  if (reportType.includes("goal") || reportType.includes("performance")) return { headers: ["Ambassador", "Goal", "Target", "Current", "Completion", "Status"], rows: snapshot.goals.map((item) => [item.ambassador_id, item.goal_type, item.target_value, item.current_value, item.completion_rate, item.status]) }
  if (reportType.includes("incentive")) return { headers: ["Ambassador", "Type", "Amount", "Currency", "Status", "Approved", "Paid"], rows: snapshot.incentives.map((item) => [item.ambassador_id, item.incentive_type, item.amount, item.currency, item.status, item.approved_at, item.paid_at]) }
  return { headers: ["Name", "Email", "Phone", "City", "Region", "Territory", "Status", "Performance", "KPI", "Missions Completed", "Incentives Pending"], rows: snapshot.ambassadors.map((item) => [item.full_name, item.email, item.phone, item.city, item.region, item.territory_name, item.status, item.performance_score, item.kpi_score, item.missions_completed, item.incentives_balance]) }
}

function buildCsv(headers: string[], rows: unknown[][]): string {
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
  decideTerritoryAssignment,
  assignMissionToAmbassador,
  completeOnboardingStep,
  decideConversion,
  decideProof,
  decideIncentive,
  getAmbassadorSettings,
  moveRecruitmentStage,
  recalculateGoal,
  updateAmbassadorSettings,
  updateMissionStatus,
  generateAmbassadorReport,
}
