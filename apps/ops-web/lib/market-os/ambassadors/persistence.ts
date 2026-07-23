import { createHash, randomUUID } from "node:crypto"
import type {
  AmbassadorActor,
  AmbassadorEntityKey,
  AmbassadorRecord,
} from "./contracts"
import { AmbassadorServiceError } from "./errors"
import { getAmbassadorSupabaseAdmin } from "./supabase"

export type EntityConfig = {
  table: string
  required: readonly string[]
  fields: readonly string[]
  numeric?: readonly string[]
  json?: readonly string[]
  orderBy?: string
}

const COMMON_FIELDS = [
  "id",
  "tenant_id",
  "organization_id",
  "created_by_actor_id",
  "updated_by_actor_id",
  "created_at",
  "updated_at",
  "archived_at",
] as const

export const ENTITY_CONFIG: Record<AmbassadorEntityKey, EntityConfig> = {
  ambassadors: {
    table: "market_os_ambassadors",
    required: ["full_name"],
    fields: [...COMMON_FIELDS, "full_name", "name", "display_name", "email", "phone", "normalized_email", "normalized_phone", "identity_hash", "city", "region", "zone", "role", "title", "profile_type", "status", "lifecycle_stage", "territory_id", "territory_name", "manager_id", "manager_name", "performance_score", "score", "kpi_score", "missions_assigned", "missions_completed", "leads_generated", "hot_leads", "meetings_booked", "incentives_balance", "certification_status", "drive_folder_url", "notes", "source", "metadata", "payload", "joined_at", "last_activity_at"],
    numeric: ["performance_score", "score", "kpi_score", "missions_assigned", "missions_completed", "leads_generated", "hot_leads", "meetings_booked", "incentives_balance"],
    json: ["metadata", "payload"],
  },
  territories: {
    table: "market_os_ambassador_territories",
    required: ["name"],
    fields: [...COMMON_FIELDS, "name", "title", "city", "region", "zone", "manager_name", "assigned_owner", "coverage_goal", "active_ambassadors_count", "status", "notes", "metadata", "restrictions"],
    numeric: ["coverage_goal", "active_ambassadors_count"],
    json: ["metadata", "restrictions"],
  },
  missions: {
    table: "market_os_ambassador_missions",
    required: ["title"],
    fields: [...COMMON_FIELDS, "ambassador_id", "assigned_ambassador_id", "territory_id", "title", "name", "mission_type", "priority", "status", "city", "region", "due_date", "due_at", "completed_at", "assigned_by", "description", "instructions", "evidence_url", "proof_status", "proof_required", "metadata", "payload"],
    json: ["metadata", "payload"],
  },
  recruitment: {
    table: "market_os_ambassador_recruitment",
    required: ["candidate_name"],
    fields: [...COMMON_FIELDS, "candidate_name", "email", "phone", "normalized_email", "normalized_phone", "identity_hash", "city", "region", "source", "stage", "evaluation_score", "interviewer", "next_step", "notes", "ambassador_id", "metadata"],
    numeric: ["evaluation_score"],
    json: ["metadata"],
  },
  leads: {
    table: "market_os_ambassador_leads",
    required: ["lead_name"],
    fields: [...COMMON_FIELDS, "lead_name", "parent_name", "email", "phone", "city", "region", "zone", "source", "lead_type", "segment", "status", "score", "value_mad", "ambassador_id", "territory_id", "next_followup_at", "qualified_at", "converted_at", "notes", "metadata", "payload"],
    numeric: ["score", "value_mad"],
    json: ["metadata", "payload"],
  },
  conversions: {
    table: "market_os_ambassador_conversions",
    required: ["lead_name"],
    fields: [...COMMON_FIELDS, "lead_id", "lead_name", "parent_name", "ambassador_id", "ambassador_name", "territory_id", "city", "region", "offer_name", "value", "currency", "status", "validation_decision", "validation_note", "proof_id", "proof_url", "validated_by", "validated_by_actor_id", "validated_at", "rejected_at", "paid_at", "score", "idempotency_key", "metadata", "payload"],
    numeric: ["value", "score"],
    json: ["metadata", "payload"],
  },
  onboarding: {
    table: "market_os_ambassador_onboarding",
    required: ["ambassador_id"],
    fields: [...COMMON_FIELDS, "ambassador_id", "stage", "assigned_owner", "due_date", "completed_at", "completion_rate", "checklist", "notes", "metadata"],
    numeric: ["completion_rate"],
    json: ["checklist", "metadata"],
  },
  training: {
    table: "market_os_ambassador_training",
    required: ["ambassador_id", "training_name"],
    fields: [...COMMON_FIELDS, "ambassador_id", "training_name", "module_title", "certification_name", "status", "certification_status", "score", "valid_until", "completed_at", "issued_by", "metadata", "payload"],
    numeric: ["score"],
    json: ["metadata", "payload"],
  },
  goals: {
    table: "market_os_ambassador_goals",
    required: ["goal_type"],
    fields: [...COMMON_FIELDS, "ambassador_id", "period", "goal_type", "target_value", "current_value", "completion_rate", "status", "manager_notes", "metadata"],
    numeric: ["target_value", "current_value", "completion_rate"],
    json: ["metadata"],
  },
  incentives: {
    table: "market_os_ambassador_incentives",
    required: ["ambassador_id", "amount"],
    fields: [...COMMON_FIELDS, "ambassador_id", "incentive_type", "amount", "amount_mad", "currency", "status", "reason", "proof_id", "conversion_id", "approved_by", "approved_by_actor_id", "approved_at", "paid_at", "metadata", "payload"],
    numeric: ["amount", "amount_mad"],
    json: ["metadata", "payload"],
  },
  proofs: {
    table: "market_os_ambassador_proofs",
    required: ["ambassador_id", "title", "proof_url"],
    fields: [...COMMON_FIELDS, "ambassador_id", "mission_id", "title", "proof_url", "proof_type", "status", "review_note", "reviewed_by_actor_id", "reviewed_at", "metadata", "payload"],
    json: ["metadata", "payload"],
  },
  payouts: {
    table: "market_os_ambassador_payouts",
    required: ["ambassador_id", "amount_mad"],
    fields: [...COMMON_FIELDS, "ambassador_id", "incentive_id", "amount_mad", "currency", "status", "period", "approval_note", "approved_by_actor_id", "approved_at", "executed_by_actor_id", "executed_at", "payment_reference", "paid_at", "metadata", "payload"],
    numeric: ["amount_mad"],
    json: ["metadata", "payload"],
  },
  reports: {
    table: "market_os_ambassador_reports",
    required: ["report_type"],
    fields: [...COMMON_FIELDS, "report_type", "title", "period_start", "period_end", "generated_by", "generated_by_actor_id", "status", "filters", "row_count", "export_url", "export_payload", "metadata"],
    numeric: ["row_count"],
    json: ["filters", "export_payload", "metadata"],
  },
  audit: {
    table: "market_os_ambassador_audit_logs",
    required: ["entity_type", "entity_id", "action"],
    fields: ["id", "tenant_id", "organization_id", "entity_type", "entity_id", "action", "summary", "actor_id", "actor_name", "actor_role", "request_id", "ip_hash", "user_agent", "payload", "before_snapshot", "after_snapshot", "metadata", "created_at"],
    json: ["payload", "before_snapshot", "after_snapshot", "metadata"],
    orderBy: "created_at",
  },
}

export const SETTINGS_TABLE = "market_os_ambassador_settings"
export const MISSION_ASSIGNMENTS_TABLE = "market_os_ambassador_mission_assignments"
export const TERRITORY_ASSIGNMENTS_TABLE = "market_os_ambassador_territory_assignments"

function sanitizeJson(value: unknown, fallback: unknown): unknown {
  if (value === undefined) return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function cleanEntityPayload(
  entity: AmbassadorEntityKey,
  payload: Record<string, unknown>,
  existing: AmbassadorRecord | null,
  actor: AmbassadorActor,
): AmbassadorRecord {
  const config = ENTITY_CONFIG[entity]
  const output: AmbassadorRecord = { id: String(payload.id || existing?.id || randomUUID()) }
  for (const field of config.fields) {
    if (field === "id" || field === "tenant_id" || field === "organization_id" || field === "created_by_actor_id" || field === "updated_by_actor_id") continue
    if (payload[field] !== undefined) output[field] = payload[field]
  }
  for (const field of config.numeric || []) {
    if (output[field] === undefined || output[field] === null || output[field] === "") continue
    const value = Number(output[field])
    if (!Number.isFinite(value)) throw new AmbassadorServiceError("VALIDATION_ERROR", `${field} must be numeric`, 400)
    output[field] = value
  }
  for (const field of config.json || []) {
    if (output[field] !== undefined) output[field] = sanitizeJson(output[field], field === "checklist" ? [] : {})
  }
  output.tenant_id = actor.tenantId
  output.organization_id = actor.organizationId
  output.created_by_actor_id = existing?.created_by_actor_id || actor.actorId
  output.updated_by_actor_id = actor.actorId
  if (existing?.created_at) output.created_at = existing.created_at
  return output
}

export function validateRequired(entity: AmbassadorEntityKey, payload: Record<string, unknown>): void {
  const missing = ENTITY_CONFIG[entity].required.filter((field) => {
    const value = payload[field]
    return value === null || value === undefined || String(value).trim() === ""
  })
  if (missing.length) {
    throw new AmbassadorServiceError("VALIDATION_ERROR", `Missing required field(s): ${missing.join(", ")}`, 400)
  }
}

function scoped(query: any, actor: AmbassadorActor): any {
  return query.eq("tenant_id", actor.tenantId).eq("organization_id", actor.organizationId)
}

function persistenceFailure(area: string, error: { message?: string } | null): never {
  throw new AmbassadorServiceError("PERSISTENCE_ERROR", `${area}: ${error?.message || "Supabase operation failed"}`, 503)
}

export async function listRows(entity: AmbassadorEntityKey, actor: AmbassadorActor, limit = 250): Promise<AmbassadorRecord[]> {
  const config = ENTITY_CONFIG[entity]
  const orderBy = config.orderBy || "updated_at"
  const result = await scoped(getAmbassadorSupabaseAdmin().from(config.table).select("*"), actor)
    .order(orderBy, { ascending: false })
    .limit(limit)
  if (result.error) persistenceFailure(`List ${entity}`, result.error)
  return (result.data || []) as AmbassadorRecord[]
}

export async function getRow(entity: AmbassadorEntityKey, id: string, actor: AmbassadorActor): Promise<AmbassadorRecord | null> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(ENTITY_CONFIG[entity].table).select("*").eq("id", id), actor).maybeSingle()
  if (result.error) persistenceFailure(`Get ${entity}`, result.error)
  return (result.data || null) as AmbassadorRecord | null
}

export async function insertRow(entity: AmbassadorEntityKey, row: AmbassadorRecord, actor: AmbassadorActor): Promise<AmbassadorRecord> {
  const result = await getAmbassadorSupabaseAdmin().from(ENTITY_CONFIG[entity].table).insert(row).select("*").single()
  if (result.error) {
    const conflict = String(result.error.message || "").toLowerCase().includes("duplicate")
    throw new AmbassadorServiceError(conflict ? "CONFLICT" : "PERSISTENCE_ERROR", result.error.message, conflict ? 409 : 503)
  }
  const record = result.data as AmbassadorRecord
  if (record.tenant_id !== actor.tenantId || record.organization_id !== actor.organizationId) {
    throw new AmbassadorServiceError("PERSISTENCE_ERROR", "Persisted record escaped the authenticated scope", 500)
  }
  return record
}

export async function updateRow(entity: AmbassadorEntityKey, id: string, patch: AmbassadorRecord, actor: AmbassadorActor): Promise<AmbassadorRecord> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(ENTITY_CONFIG[entity].table).update(patch).eq("id", id), actor).select("*").maybeSingle()
  if (result.error) persistenceFailure(`Update ${entity}`, result.error)
  if (!result.data) throw new AmbassadorServiceError("NOT_FOUND", "Record not found", 404)
  return result.data as AmbassadorRecord
}

export async function listTable(table: string, actor: AmbassadorActor, limit = 500): Promise<AmbassadorRecord[]> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(table).select("*"), actor).order("created_at", { ascending: false }).limit(limit)
  if (result.error) persistenceFailure(`List ${table}`, result.error)
  return (result.data || []) as AmbassadorRecord[]
}

export async function getSettingsRow(actor: AmbassadorActor): Promise<AmbassadorRecord | null> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(SETTINGS_TABLE).select("*"), actor).maybeSingle()
  if (result.error) persistenceFailure("Load Ambassador settings", result.error)
  return (result.data || null) as AmbassadorRecord | null
}

export async function upsertSettingsRow(settings: AmbassadorRecord, actor: AmbassadorActor): Promise<AmbassadorRecord> {
  const result = await getAmbassadorSupabaseAdmin().from(SETTINGS_TABLE).upsert(settings, { onConflict: "tenant_id,organization_id" }).select("*").single()
  if (result.error) persistenceFailure("Update Ambassador settings", result.error)
  return result.data as AmbassadorRecord
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.AMBASSADOR_AUDIT_IP_SALT
  if (!salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

export async function writeAudit(
  actor: AmbassadorActor,
  input: {
    entityType: string
    entityId: string
    action: string
    summary: string
    payload?: Record<string, unknown>
    before?: AmbassadorRecord | null
    after?: AmbassadorRecord | null
  },
): Promise<AmbassadorRecord> {
  const row: AmbassadorRecord = {
    id: randomUUID(),
    tenant_id: actor.tenantId,
    organization_id: actor.organizationId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    summary: input.summary,
    actor_id: actor.actorId,
    actor_name: actor.displayName,
    actor_role: actor.roleKey,
    request_id: actor.requestId,
    ip_hash: hashIp(actor.ipAddress),
    user_agent: actor.userAgent,
    payload: input.payload || {},
    before_snapshot: input.before || null,
    after_snapshot: input.after || null,
    metadata: {
      authentication_source: actor.authenticationSource,
      auth_user_id: actor.authUserId,
      app_user_id: actor.appUserId,
    },
    created_at: new Date().toISOString(),
  }
  const result = await getAmbassadorSupabaseAdmin().from(ENTITY_CONFIG.audit.table).insert(row).select("*").single()
  if (result.error) persistenceFailure("Write immutable Ambassador audit", result.error)
  return result.data as AmbassadorRecord
}

export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const result = await getAmbassadorSupabaseAdmin().rpc(name, args)
  if (result.error) {
    const message = result.error.message || `RPC ${name} failed`
    const lower = message.toLowerCase()
    const code = lower.includes("permission") ? "FORBIDDEN" : lower.includes("conflict") || lower.includes("already") ? "CONFLICT" : lower.includes("not found") ? "NOT_FOUND" : "PERSISTENCE_ERROR"
    const status = code === "FORBIDDEN" ? 403 : code === "CONFLICT" ? 409 : code === "NOT_FOUND" ? 404 : 503
    throw new AmbassadorServiceError(code, message, status)
  }
  return result.data as T
}
