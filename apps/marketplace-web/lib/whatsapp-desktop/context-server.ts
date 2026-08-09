import { NextRequest } from "next/server"
import type { WhatsAppContextPriority, WhatsAppContextType, WhatsAppPhoneNormalization, WhatsAppResolvedEntity } from "@/lib/whatsapp-desktop/context-types"
import { WHATSAPP_CONTEXT_TYPES, WHATSAPP_OUTCOMES } from "@/lib/whatsapp-desktop/context-types"
import { adapterForContext } from "@/lib/whatsapp-desktop/adapters/registry"
import { firstValue } from "@/lib/whatsapp-desktop/adapters/base"
import { auditEvent, governanceContext, hasGovernancePermission } from "@/lib/whatsapp-desktop/server"

type Row = Record<string, any>


const MODULE_PERMISSION_HINTS: Record<string, string[]> = {
  b2b_prospect: ["b2b.view", "b2b.*", "b2b_partnerships.view"],
  b2b_partner: ["b2b.view", "b2b.*", "b2b_partnerships.view"],
  commercial_opportunity: ["b2b.view", "commercial.view", "b2b.*"],
  academy_learner: ["academy.view", "traininghub.view", "training.*"],
  academy_partner: ["academy.view", "traininghub.view", "training.*"],
  training_session: ["traininghub.view", "training.view", "training.*"],
  parent: ["customers.view", "parents.view", "customer.*"],
  customer: ["customers.view", "customer.*"],
  admission: ["admissions.view", "admissions.*"],
  support_case: ["support.view", "reclamations.view", "support.*"],
  quotation: ["commercial.view", "finance.view", "b2b.view"],
  invoice: ["finance.view", "finance.*"],
  payment_followup: ["finance.view", "finance.*"],
  recruitment_candidate: ["recruitment.view", "rh.view", "hr.*"],
  refferq_member: ["refferq.view", "market_os.view", "refferq.*"],
  incident: ["operations.view", "incidents.view", "operations.*"],
  appointment: ["appointments.view", "calendar.view", "operations.view"],
  custom: [],
}

export function ensureSourceModulePermission(user: Row, contextType: string) {
  const role = cleanText(user?.role, 80).toLowerCase()
  if (["ceo", "owner", "super_admin", "admin"].includes(role)) return
  const permissions = asStrings(user?.permissions || user?.permission_codes || user?.access_permissions)
  if (!permissions.length) return // Legacy accounts rely on the governed workspace assignment.
  const accepted = MODULE_PERMISSION_HINTS[contextType] || []
  if (permissions.includes("whatsapp_context.*") || permissions.includes("whatsapp_desktop.*")) return
  if (accepted.some((permission) => permissions.includes(permission))) return
  throw new Error("SOURCE_MODULE_PERMISSION_DENIED")
}

export const CONTEXT_PERMISSIONS = {
  view: "whatsapp_context.view", open: "whatsapp_context.open", prepare: "whatsapp_context.prepare_message",
  outcome: "whatsapp_context.record_outcome", note: "whatsapp_context.create_note", task: "whatsapp_context.create_task",
  appointment: "whatsapp_context.schedule_appointment", handoff: "whatsapp_context.handoff",
  escalate: "whatsapp_context.escalate", analytics: "whatsapp_context.analytics.view",
} as const
export type WhatsAppContextPermission = typeof CONTEXT_PERMISSIONS[keyof typeof CONTEXT_PERMISSIONS]

export function cleanText(value: unknown, max = 1000) { return String(value ?? "").trim().slice(0, max) }
export function cleanId(value: unknown) { return cleanText(value, 100) }
export function asRecord(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {} }
export function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 120)).filter(Boolean)
  return []
}

export function normalizeWhatsAppPhone(rawValue: unknown, defaultCountry = "MA"): WhatsAppPhoneNormalization {
  const raw = cleanText(rawValue, 80)
  if (!raw) return { raw, normalized_e164: null, whatsapp_digits: null, country_code: null, national_number: null, status: "missing", is_mobile: null, is_landline: null, reason: "PHONE_MISSING" }
  let value = raw.replace(/[\s().\-_/]/g, "")
  if (value.startsWith("00")) value = `+${value.slice(2)}`
  if (!value.startsWith("+") && defaultCountry === "MA") {
    if (/^0[567]\d{8}$/.test(value)) value = `+212${value.slice(1)}`
    else if (/^212\d{9}$/.test(value)) value = `+${value}`
    else if (/^[567]\d{8}$/.test(value)) value = `+212${value}`
  }
  if (!/^\+\d{8,15}$/.test(value)) {
    const digits = value.replace(/\D/g, "")
    return { raw, normalized_e164: null, whatsapp_digits: null, country_code: null, national_number: digits || null, status: digits.length < 8 ? "incomplete" : "unsupported", is_mobile: null, is_landline: null, reason: digits.length < 8 ? "PHONE_INCOMPLETE" : "PHONE_FORMAT_UNSUPPORTED" }
  }
  const digits = value.slice(1)
  let countryCode = digits.slice(0, Math.min(3, digits.length - 7))
  let national = digits.slice(countryCode.length)
  if (digits.startsWith("212")) { countryCode = "212"; national = digits.slice(3) }
  const isMoroccanMobile = digits.startsWith("2126") || digits.startsWith("2127")
  const isMoroccanLandline = digits.startsWith("2125")
  return {
    raw, normalized_e164: value, whatsapp_digits: digits, country_code: countryCode, national_number: national,
    status: isMoroccanLandline ? "needs_confirmation" : "validated",
    is_mobile: digits.startsWith("212") ? isMoroccanMobile : null,
    is_landline: digits.startsWith("212") ? isMoroccanLandline : null,
    reason: isMoroccanLandline ? "MOROCCAN_LANDLINE_CONFIRM_WHATSAPP" : "PHONE_VALID",
  }
}

function normalizePriority(value: unknown, fallback: WhatsAppContextPriority = "normal"): WhatsAppContextPriority {
  const raw = cleanText(value, 30).toLowerCase()
  if (["critical", "urgent", "emergency", "critique"].includes(raw)) return "critical"
  if (["high", "haute", "important"].includes(raw)) return "high"
  if (["low", "faible"].includes(raw)) return "low"
  return fallback
}

function firstName(name: string) { return name.trim().split(/\s+/)[0] || name }
function renderTemplate(template: string, variables: Record<string,string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => variables[key] ?? "")
}
function safeSourceSnapshot(row: Row) {
  const blocked = /(password|passwd|secret|token|cookie|credential|api[_-]?key|private[_-]?key|access[_-]?key|auth|session)/i
  const snapshot: Row = {}
  for (const [key, value] of Object.entries(row || {}).slice(0, 160)) {
    if (blocked.test(key)) continue
    if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") snapshot[key] = value
    else if (typeof value === "string") snapshot[key] = value.slice(0, 2000)
    else if (Array.isArray(value)) snapshot[key] = value.slice(0, 25)
    else if (typeof value === "object") snapshot[key] = { present: true }
  }
  return snapshot
}

function documentList(row: Row, fields: string[]) {
  const result: WhatsAppResolvedEntity["documents"] = []
  for (const field of fields) {
    const value = row?.[field]
    if (typeof value === "string" && /^https?:\/\//i.test(value)) result.push({ label: field.replace(/_/g, " "), category: field, url: value })
  }
  if (Array.isArray(row.documents)) for (const item of row.documents) {
    const data = asRecord(item); const url = cleanText(data.url, 2000)
    if (/^https?:\/\//i.test(url)) result.push({ id: cleanId(data.id) || undefined, label: cleanText(data.label || data.name || "Document", 180), category: cleanText(data.category || "document", 80), url, filename: cleanText(data.filename, 240) || null })
  }
  return result.slice(0, 30)
}

async function readAdapterRecord(supabase: any, tables: string[], entityId: string) {
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").eq("id", entityId).maybeSingle()
      if (!error && data) return { row: data as Row, table }
    } catch {}
  }
  return { row: null as Row | null, table: null as string | null }
}

export async function resolveBusinessEntity(supabase: any, input: Row, operatorName: string): Promise<WhatsAppResolvedEntity> {
  const contextType = cleanText(input.context_type, 80) as WhatsAppContextType
  if (!WHATSAPP_CONTEXT_TYPES.includes(contextType)) throw new Error("CONTEXT_TYPE_UNSUPPORTED")
  const entityId = cleanId(input.entity_id)
  if (!entityId) throw new Error("ENTITY_ID_REQUIRED")
  const adapter = adapterForContext(contextType)
  const hint = asRecord(input.entity_hint)
  const record = adapter ? await readAdapterRecord(supabase, adapter.tableCandidates, entityId) : { row: null, table: null }
  const row = record.row || hint
  if (!Object.keys(row).length) throw new Error("ENTITY_NOT_FOUND_OR_HINT_REQUIRED")
  const moduleLabel = adapter?.moduleLabel || cleanText(hint.module_label || "Contexte WhatsApp", 160)
  const entityName = cleanText(firstValue(row, adapter?.nameFields || []) || hint.entity_name || hint.name || "Dossier ANGELCARE", 240)
  const rawPhone = cleanText(firstValue(row, adapter?.phoneFields || []) || hint.phone_number || hint.phone, 80) || null
  const phone = normalizeWhatsAppPhone(rawPhone, cleanText(input.default_country || "MA", 4))
  const stage = cleanText(firstValue(row, adapter?.stageFields || []) || hint.current_stage, 120) || null
  const assignedUserId = cleanId(firstValue(row, adapter?.assigneeFields || []) || hint.assigned_user_id) || null
  const preferredLanguage = cleanText(firstValue(row, adapter?.languageFields || []) || hint.preferred_language || "fr", 20)
  const priority = normalizePriority(firstValue(row, adapter?.priorityFields || []) || hint.priority, adapter?.fallbackPriority || "normal")
  const purpose = cleanText(input.purpose || hint.communication_purpose || adapter?.defaultPurpose || "Communication WhatsApp", 240)
  const expectedOutcome = cleanText(input.expected_outcome || hint.expected_outcome || adapter?.defaultOutcome, 500) || null
  const sourceRoute = cleanText(input.source_route || hint.source_route || adapter?.sourceRoute(contextType, entityId) || "/", 1000)
  const variables = {
    entity_name: entityName,
    contact_first_name: firstName(cleanText(hint.contact_name || entityName, 200)),
    operator_name: operatorName,
    communication_purpose: purpose,
    current_stage: stage || "",
    reference: cleanText(row.reference || row.code || row.number, 120),
    organization_name: cleanText(row.organization_name || row.company_name || entityName, 200),
    quotation_reference: cleanText(row.quotation_reference || row.reference, 120),
    suggested_date: cleanText(input.suggested_date || hint.suggested_date, 120),
  }
  const template = cleanText(input.prepared_message || hint.prepared_message || adapter?.defaultMessage, 12000)
  return {
    context_type: contextType, entity_id: entityId, entity_name: entityName, phone_number_raw: rawPhone, phone,
    module_label: moduleLabel, source_route: sourceRoute, current_stage: stage, assigned_user_id: assignedUserId,
    priority, preferred_language: preferredLanguage, communication_purpose: purpose, expected_outcome: expectedOutcome,
    prepared_message: template ? renderTemplate(template, variables) : null, variables,
    documents: documentList(row, adapter?.documentFields || []), adapter_id: adapter?.id || "custom",
    source_table: record.table, source_snapshot: { adapter: adapter?.id || "custom", table: record.table, fields: safeSourceSnapshot(row) },
  }
}

export async function contextRequestContext(request: NextRequest, permission: WhatsAppContextPermission = CONTEXT_PERMISSIONS.view) {
  const context = await governanceContext(request)
  if ("error" in context) return context
  if (!hasGovernancePermission(context.user, permission) && !hasGovernancePermission(context.user, "whatsapp_desktop.session.open")) {
    return { error: (await import("@/lib/whatsapp-desktop/server")).fail("WHATSAPP_CONTEXT_PERMISSION_DENIED", 403) }
  }
  return context
}

export async function requireWorkspaceAssignment(supabase: any, userId: string, workspaceId: string, contextType?: string, requiredPermission: WhatsAppContextPermission = CONTEXT_PERMISSIONS.view) {
  const [{ data: workspace }, { data: assignment }, { data: policy }] = await Promise.all([
    supabase.from("whatsapp_desktop_workspaces").select("*").eq("id", workspaceId).eq("status", "active").maybeSingle(),
    supabase.from("whatsapp_desktop_assignments").select("*").eq("workspace_id", workspaceId).eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase.from("whatsapp_desktop_workspace_policies").select("*").eq("workspace_id", workspaceId).maybeSingle(),
  ])
  if (!workspace || !assignment) throw new Error("WORKSPACE_ASSIGNMENT_REQUIRED")
  if (assignment.valid_until && new Date(assignment.valid_until).getTime() <= Date.now()) throw new Error("WORKSPACE_ASSIGNMENT_EXPIRED")
  const role = cleanText(assignment.role, 40)
  const permissions = asStrings(assignment.permissions)
  const roleDefaults: Record<string, string[]> = {
    owner: ["whatsapp_context.*"], administrator: ["whatsapp_context.*"], supervisor: ["whatsapp_context.*"],
    operator: [CONTEXT_PERMISSIONS.view, CONTEXT_PERMISSIONS.open, CONTEXT_PERMISSIONS.prepare, CONTEXT_PERMISSIONS.outcome, CONTEXT_PERMISSIONS.note, CONTEXT_PERMISSIONS.task, CONTEXT_PERMISSIONS.appointment],
    auditor: [CONTEXT_PERMISSIONS.view, CONTEXT_PERMISSIONS.analytics],
  }
  const effective = [...permissions, ...(roleDefaults[role] || [])]
  if (!(effective.includes(requiredPermission) || effective.includes("whatsapp_context.*") || effective.includes("whatsapp_desktop.*"))) throw new Error("WORKSPACE_CONTEXT_PERMISSION_DENIED")
  const policyJson = asRecord(policy?.policy_json)
  const allowed = asStrings(policyJson.allowed_context_types)
  if (contextType && allowed.length && !allowed.includes(contextType)) throw new Error("CONTEXT_TYPE_BLOCKED_BY_WORKSPACE_POLICY")
  return { workspace, assignment, policy, policyJson }
}

export async function loadBusinessContext(supabase: any, contextId: string, userId: string, admin = false, requiredPermission: WhatsAppContextPermission = CONTEXT_PERMISSIONS.view) {
  const { data, error } = await supabase.from("whatsapp_context_sessions").select("*").eq("id", contextId).maybeSingle()
  if (error) throw error
  if (!data) throw new Error("WHATSAPP_CONTEXT_NOT_FOUND")
  if (!admin && data.user_id !== userId && data.assigned_user_id !== userId) throw new Error("WHATSAPP_CONTEXT_ACCESS_DENIED")
  if (!admin) await requireWorkspaceAssignment(supabase, userId, data.workspace_id, data.context_type, requiredPermission)
  return data as Row
}

export async function contextEvent(supabase: any, input: { contextId: string; workspaceId: string; userId: string; eventType: string; title: string; detail?: string | null; entityType?: string | null; entityId?: string | null; metadata?: unknown }) {
  await supabase.from("whatsapp_context_events").insert({
    context_id: input.contextId, workspace_id: input.workspaceId, user_id: input.userId,
    event_type: cleanText(input.eventType, 120), title: cleanText(input.title, 240), detail: cleanText(input.detail, 2000) || null,
    entity_type: cleanText(input.entityType, 80) || null, entity_id: cleanId(input.entityId) || null, metadata: input.metadata || {},
  })
}

export async function auditContextAction(supabase: any, requestContext: Row, input: { contextId: string; workspaceId: string; action: string; reason?: string; previous?: unknown; next?: unknown }) {
  await auditEvent(supabase, { actorUserId: requestContext.userId, workspaceId: input.workspaceId, action: input.action, reason: input.reason || null, previousState: input.previous, newState: input.next, ip: requestContext.ip, userAgent: requestContext.userAgent })
}

export function validateOutcome(value: unknown) {
  const outcome = cleanText(value, 80)
  if (!(WHATSAPP_OUTCOMES as readonly string[]).includes(outcome)) throw new Error("OUTCOME_STATUS_UNSUPPORTED")
  return outcome
}

export async function mirrorOptionalRecord(supabase: any, envName: string, payload: Row) {
  const table = cleanText(process.env[envName], 120).replace(/[^a-zA-Z0-9_]/g, "")
  if (!table) return { mirrored: false, reason: "MIRROR_TABLE_NOT_CONFIGURED" }
  try {
    const { data, error } = await supabase.from(table).insert(payload).select("id").single()
    if (error) return { mirrored: false, reason: error.message }
    return { mirrored: true, table, id: data?.id || null }
  } catch (error) { return { mirrored: false, reason: error instanceof Error ? error.message : String(error) } }
}
