import { randomUUID } from "node:crypto"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { loadQuarantineCase, listQuarantineCases } from "@/lib/opsos/storage-quarantine"
import type {
  WindowsStorageCleanupProfile,
  WindowsStorageDestructionCertificate,
  WindowsStorageDestructionCopyState,
  WindowsStorageDestructionEvent,
  WindowsStorageDestructionImpact,
  WindowsStorageDestructionPolicy,
  WindowsStorageDestructionRegistry,
  WindowsStorageDestructionRequest,
  WindowsStorageDestructionRisk,
  WindowsStorageDestructionScope,
  WindowsStorageDestructionStatus,
  WindowsStorageQuarantineCase,
  WindowsStorageRetentionDryRun,
  WindowsStorageRetentionPolicy,
  WindowsStorageLegalHold,
} from "@/lib/opsos/windows-node-types"

type AnyRow = Record<string, any>

function clean(value: unknown) { return String(value ?? "").trim() }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function iso(value: unknown, fallback = "") { const text = clean(value); if (!text) return fallback; const date = new Date(text); return Number.isNaN(date.getTime()) ? fallback : date.toISOString() }
function requestNumber() { return `DST-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}` }
function certificateNumber() { return `CERT-DST-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}` }

export function defaultDestructionPolicy(): WindowsStorageDestructionPolicy {
  return {
    id: "default",
    lowRiskCoolingOffSeconds: 300,
    controlledRiskCoolingOffSeconds: 86_400,
    highRiskCoolingOffSeconds: 259_200,
    requireIndependentApproval: true,
    requireTwoApprovalsForHighRisk: true,
    requireTypedConfirmationForHighRisk: true,
    requireRetentionCompletion: true,
    allowPrimaryDestructionWhileBackupsExpire: true,
    active: true,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  }
}

export const DEFAULT_CLEANUP_PROFILES: WindowsStorageCleanupProfile[] = [
  { id: "expired-temporary-files", name: "Fichiers temporaires expirés", description: "Téléversements et fragments temporaires anciens dans les racines approuvées.", sourceIds: ["temporary", "uploads"], extensions: [], minimumAgeDays: 14, maximumBatchSize: 500, riskLevel: "low", enabled: true },
  { id: "failed-export-remnants", name: "Résidus d’exports échoués", description: "Exports partiels ou abandonnés après expiration du délai opérationnel.", sourceIds: ["exports"], extensions: [".tmp", ".partial", ".failed"], minimumAgeDays: 30, maximumBatchSize: 250, riskLevel: "low", enabled: true },
  { id: "rotated-compressed-logs", name: "Journaux compressés arrivés à échéance", description: "Journaux déjà rotatés et non actifs dans le périmètre approuvé.", sourceIds: ["logs"], extensions: [".gz", ".zip", ".log.1", ".log.2"], minimumAgeDays: 90, maximumBatchSize: 250, riskLevel: "low", enabled: true },
  { id: "diagnostic-bundles", name: "Paquets de diagnostic expirés", description: "Archives de diagnostic anciennes créées par OPSOS.", sourceIds: ["exports", "backups"], extensions: [".zip", ".json"], minimumAgeDays: 90, maximumBatchSize: 100, riskLevel: "controlled", enabled: false },
]

function destructionPolicyFromRow(row?: AnyRow | null): WindowsStorageDestructionPolicy {
  if (!row) return defaultDestructionPolicy()
  return {
    id: clean(row.id) || "default",
    lowRiskCoolingOffSeconds: num(row.low_risk_cooling_off_seconds, 300),
    controlledRiskCoolingOffSeconds: num(row.controlled_risk_cooling_off_seconds, 86_400),
    highRiskCoolingOffSeconds: num(row.high_risk_cooling_off_seconds, 259_200),
    requireIndependentApproval: row.require_independent_approval !== false,
    requireTwoApprovalsForHighRisk: row.require_two_approvals_for_high_risk !== false,
    requireTypedConfirmationForHighRisk: row.require_typed_confirmation_for_high_risk !== false,
    requireRetentionCompletion: row.require_retention_completion !== false,
    allowPrimaryDestructionWhileBackupsExpire: row.allow_primary_destruction_while_backups_expire !== false,
    active: row.active !== false,
    updatedAt: iso(row.updated_at, new Date().toISOString()),
    updatedBy: clean(row.updated_by) || null,
  }
}

function retentionPolicyFromRow(row: AnyRow): WindowsStorageRetentionPolicy {
  return {
    id: clean(row.id),
    name: clean(row.name),
    category: clean(row.category),
    minimumAgeDays: num(row.minimum_age_days),
    quarantineDays: num(row.quarantine_days, 30),
    actionAfterRetention: (clean(row.action_after_retention) || "review") as WindowsStorageRetentionPolicy["actionAfterRetention"],
    enabled: row.enabled !== false,
    dryRunRequired: row.dry_run_required !== false,
    exclusions: Array.isArray(row.exclusions) ? row.exclusions.map(clean).filter(Boolean) : [],
    updatedAt: iso(row.updated_at),
    updatedBy: clean(row.updated_by) || null,
  }
}

function cleanupProfileFromRow(row: AnyRow): WindowsStorageCleanupProfile {
  return {
    id: clean(row.id),
    name: clean(row.name),
    description: clean(row.description),
    sourceIds: Array.isArray(row.source_ids) ? row.source_ids.map(clean).filter(Boolean) : [],
    extensions: Array.isArray(row.extensions) ? row.extensions.map(clean).filter(Boolean) : [],
    minimumAgeDays: num(row.minimum_age_days),
    maximumBatchSize: num(row.maximum_batch_size, 100),
    riskLevel: clean(row.risk_level) === "controlled" ? "controlled" : "low",
    enabled: row.enabled !== false,
  }
}

function requestFromRow(row: AnyRow): WindowsStorageDestructionRequest {
  return {
    id: clean(row.id),
    requestNumber: clean(row.request_number),
    quarantineCaseId: clean(row.quarantine_case_id),
    quarantineCaseNumber: clean(row.quarantine_case_number),
    scope: (clean(row.scope) || "physical_file") as WindowsStorageDestructionScope,
    riskLevel: (clean(row.risk_level) || "controlled") as WindowsStorageDestructionRisk,
    status: (clean(row.status) || "impact_review_required") as WindowsStorageDestructionStatus,
    reason: clean(row.reason),
    sourceId: clean(row.source_id),
    objectReference: clean(row.object_reference),
    fileId: clean(row.file_id) || null,
    mailboxId: clean(row.mailbox_id) || null,
    entityType: clean(row.entity_type) || null,
    entityId: clean(row.entity_id) || null,
    originalName: clean(row.original_name),
    originalSizeBytes: num(row.original_size_bytes),
    expectedSha256: clean(row.expected_sha256) || null,
    quarantineLocationToken: clean(row.quarantine_location_token) || null,
    impactSnapshot: (row.impact_snapshot || {}) as WindowsStorageDestructionImpact,
    requestedBy: clean(row.requested_by),
    approvedBy: clean(row.approved_by) || null,
    secondApprovedBy: clean(row.second_approved_by) || null,
    approvalCount: num(row.approval_count),
    approvalsRequired: Math.max(1, num(row.approvals_required, 1)),
    scheduledFor: iso(row.scheduled_for) || null,
    coolingOffSeconds: num(row.cooling_off_seconds),
    executedBy: clean(row.executed_by) || null,
    actualRecoveredBytes: num(row.actual_recovered_bytes),
    certificateId: clean(row.certificate_id) || null,
    certificateNumber: clean(row.certificate_number) || null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    completedAt: iso(row.completed_at) || null,
    lastError: clean(row.last_error) || null,
  }
}

function eventFromRow(row: AnyRow): WindowsStorageDestructionEvent {
  return {
    id: clean(row.id), requestId: clean(row.request_id), eventType: clean(row.event_type), status: clean(row.status), actor: clean(row.actor),
    reason: clean(row.reason) || null, metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {}, createdAt: iso(row.created_at),
  }
}

function certificateFromRow(row: AnyRow): WindowsStorageDestructionCertificate {
  return {
    id: clean(row.id), certificateNumber: clean(row.certificate_number), requestId: clean(row.request_id), requestNumber: clean(row.request_number),
    quarantineCaseId: clean(row.quarantine_case_id), originalName: clean(row.original_name), originalSizeBytes: num(row.original_size_bytes),
    originalSha256: clean(row.original_sha256) || null, sourceId: clean(row.source_id), mailboxId: clean(row.mailbox_id) || null,
    scope: (clean(row.scope) || "physical_file") as WindowsStorageDestructionScope, requester: clean(row.requester),
    approvers: Array.isArray(row.approvers) ? row.approvers.map(clean).filter(Boolean) : [], executedBy: clean(row.executed_by),
    executedAt: iso(row.executed_at), verificationResult: clean(row.verification_result), actualRecoveredBytes: num(row.actual_recovered_bytes),
    remainingCopies: Array.isArray(row.remaining_copies) ? row.remaining_copies : [], createdAt: iso(row.created_at),
  }
}


function legalHoldFromRow(row: AnyRow): WindowsStorageLegalHold {
  return {
    id: clean(row.id), sourceId: clean(row.source_id), objectReference: clean(row.object_reference),
    fileId: clean(row.file_id) || null, mailboxId: clean(row.mailbox_id) || null, reason: clean(row.reason),
    status: clean(row.status) === "released" ? "released" : "active", placedBy: clean(row.placed_by), placedAt: iso(row.placed_at),
    releasedBy: clean(row.released_by) || null, releasedAt: iso(row.released_at) || null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  }
}

export async function listLegalHolds(limit = 300) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_legal_holds").select("*").order("placed_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  return (data || []).map(legalHoldFromRow)
}

export async function createLegalHold(input: { sourceId: string; objectReference: string; fileId?: string | null; mailboxId?: string | null; reason: string; actor: string; metadata?: Record<string, unknown> }) {
  if (!clean(input.sourceId) || !clean(input.objectReference)) throw new Error("sourceId and objectReference are required")
  if (clean(input.reason).length < 8) throw new Error("A detailed legal-hold reason is required")
  const db = createEmailOSCoreDb()
  const payload = { id: randomUUID(), source_id: clean(input.sourceId), object_reference: clean(input.objectReference), file_id: clean(input.fileId) || null, mailbox_id: clean(input.mailboxId) || null, reason: clean(input.reason), status: "active", placed_by: input.actor, placed_at: new Date().toISOString(), released_by: null, released_at: null, metadata: input.metadata || {} }
  const { data, error } = await db.from("opsos_storage_legal_holds").insert(payload).select("*").single()
  if (error) throw error
  return legalHoldFromRow(data)
}

export async function releaseLegalHold(holdId: string, actor: string, reason: string) {
  if (clean(reason).length < 8) throw new Error("A detailed release reason is required")
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_legal_holds").update({ status: "released", released_by: actor, released_at: new Date().toISOString(), metadata: { releaseReason: clean(reason) } }).eq("id", holdId).eq("status", "active").select("*").single()
  if (error) throw error
  return legalHoldFromRow(data)
}

export async function getDestructionPolicy() {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_policies").select("*").eq("active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return destructionPolicyFromRow(data)
}

export async function saveDestructionPolicy(input: Partial<WindowsStorageDestructionPolicy>, actor: string) {
  const current = await getDestructionPolicy().catch(() => defaultDestructionPolicy())
  const db = createEmailOSCoreDb()
  const payload = {
    id: current.id === "default" ? randomUUID() : current.id,
    low_risk_cooling_off_seconds: Math.max(0, num(input.lowRiskCoolingOffSeconds, current.lowRiskCoolingOffSeconds)),
    controlled_risk_cooling_off_seconds: Math.max(0, num(input.controlledRiskCoolingOffSeconds, current.controlledRiskCoolingOffSeconds)),
    high_risk_cooling_off_seconds: Math.max(0, num(input.highRiskCoolingOffSeconds, current.highRiskCoolingOffSeconds)),
    require_independent_approval: input.requireIndependentApproval ?? current.requireIndependentApproval,
    require_two_approvals_for_high_risk: input.requireTwoApprovalsForHighRisk ?? current.requireTwoApprovalsForHighRisk,
    require_typed_confirmation_for_high_risk: input.requireTypedConfirmationForHighRisk ?? current.requireTypedConfirmationForHighRisk,
    require_retention_completion: input.requireRetentionCompletion ?? current.requireRetentionCompletion,
    allow_primary_destruction_while_backups_expire: input.allowPrimaryDestructionWhileBackupsExpire ?? current.allowPrimaryDestructionWhileBackupsExpire,
    active: true, updated_at: new Date().toISOString(), updated_by: actor,
  }
  const { data, error } = await db.from("opsos_storage_destruction_policies").upsert(payload).select("*").single()
  if (error) throw error
  return destructionPolicyFromRow(data)
}

export async function listRetentionPolicies() {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_retention_policies").select("*").order("category", { ascending: true }).order("name", { ascending: true })
  if (error) throw error
  return (data || []).map(retentionPolicyFromRow)
}

export async function saveRetentionPolicy(input: Partial<WindowsStorageRetentionPolicy>, actor: string) {
  const db = createEmailOSCoreDb()
  const payload = {
    id: clean(input.id) || randomUUID(), name: clean(input.name) || "Politique de conservation", category: clean(input.category) || "general",
    minimum_age_days: Math.max(0, num(input.minimumAgeDays)), quarantine_days: Math.max(0, num(input.quarantineDays, 30)),
    action_after_retention: input.actionAfterRetention || "review", enabled: input.enabled !== false, dry_run_required: input.dryRunRequired !== false,
    exclusions: Array.isArray(input.exclusions) ? input.exclusions : [], updated_at: new Date().toISOString(), updated_by: actor,
  }
  const { data, error } = await db.from("opsos_storage_retention_policies").upsert(payload).select("*").single()
  if (error) throw error
  return retentionPolicyFromRow(data)
}

export async function listCleanupProfiles() {
  const db = createEmailOSCoreDb()
  try {
    const { data, error } = await db.from("opsos_storage_cleanup_profiles").select("*").order("name", { ascending: true })
    if (error) throw error
    return data?.length ? data.map(cleanupProfileFromRow) : DEFAULT_CLEANUP_PROFILES
  } catch {
    return DEFAULT_CLEANUP_PROFILES
  }
}

export async function analyzeDestructionEligibility(caseId: string): Promise<WindowsStorageDestructionImpact> {
  const record = await loadQuarantineCase(caseId)
  if (!record) throw new Error("Quarantine case not found")
  const db = createEmailOSCoreDb()
  const policy = await getDestructionPolicy().catch(() => defaultDestructionPolicy())
  const blockedReasons: string[] = []
  const now = Date.now()
  const retentionComplete = new Date(record.retentionUntil).getTime() <= now || record.status === "eligible_for_future_purge"
  if (!["quarantined", "eligible_for_future_purge"].includes(record.status)) blockedReasons.push("The quarantine case is not active or eligible for Phase 4 review.")
  if (policy.requireRetentionCompletion && !retentionComplete) blockedReasons.push("The Phase 3 quarantine retention period is still active.")
  if (!record.originalSha256) blockedReasons.push("Original SHA-256 evidence is missing.")
  if (!record.quarantineLocationToken) blockedReasons.push("Quarantine location evidence is missing.")

  let legalHold = false
  try {
    let query: any = db.from("opsos_storage_legal_holds").select("id").eq("status", "active")
    if (record.fileId) query = query.or(`file_id.eq.${record.fileId},object_reference.eq.${record.objectReference}`)
    else query = query.eq("object_reference", record.objectReference)
    const { data } = await query.limit(1)
    legalHold = Boolean(data?.length)
    if (legalHold) blockedReasons.push("An active legal hold blocks permanent destruction.")
  } catch {
    blockedReasons.push("Legal-hold verification was unavailable.")
  }

  const activeReference = record.referencesSnapshot.some((item) => item.active)
  if (activeReference) blockedReasons.push("An active business or outbound reference still depends on this object.")

  const riskLevel: WindowsStorageDestructionRisk = legalHold || activeReference ? "blocked" : record.riskLevel === "high" ? "high" : record.riskLevel === "controlled" ? "controlled" : "low"
  const approvalsRequired = riskLevel === "high" && policy.requireTwoApprovalsForHighRisk ? 2 : 1
  const coolingOffSeconds = riskLevel === "high" ? policy.highRiskCoolingOffSeconds : riskLevel === "controlled" ? policy.controlledRiskCoolingOffSeconds : policy.lowRiskCoolingOffSeconds
  const copies: WindowsStorageDestructionCopyState[] = [
    { label: "Objet de quarantaine", bytes: record.originalSizeBytes, targeted: true, status: "present", detail: record.quarantineMode === "physical" ? "Copie physique dans le coffre Phase 3." : "Objet logiquement isolé sur le stockage principal." },
    { label: "Métadonnées Email OS", bytes: 0, targeted: false, status: "present", detail: "Le minimum de preuve et le certificat resteront conservés." },
    { label: "Sauvegardes", bytes: record.originalSizeBytes * 2, targeted: false, status: "unknown", detail: "Les sauvegardes ne sont pas détruites par cette demande et expirent selon leur propre politique." },
    { label: "Message fournisseur Menara", bytes: 0, targeted: false, status: "unknown", detail: "La copie fournisseur n’est pas modifiée par Phase 4." },
  ]
  const allowedScopes: WindowsStorageDestructionScope[] = blockedReasons.length ? [] : record.objectType === "email_attachment" ? ["physical_file", "application_message", "complete_local_message"] : ["physical_file", "technical_cleanup"]
  return {
    phase: 4, permanent: true, quarantineCaseId: record.id, quarantineCaseNumber: record.caseNumber,
    eligible: blockedReasons.length === 0, blockedReasons, sourceId: record.sourceId, objectReference: record.objectReference,
    fileId: record.fileId, mailboxId: record.mailboxId, entityType: record.entityType, entityId: record.entityId,
    originalName: record.originalName, originalSizeBytes: record.originalSizeBytes, originalSha256: record.originalSha256,
    quarantineLocationToken: record.quarantineLocationToken, riskLevel, allowedScopes,
    recommendedScope: allowedScopes.includes("physical_file") ? "physical_file" : allowedScopes[0] || null,
    approvalsRequired, coolingOffSeconds, immediateRecoverableBytes: record.quarantineMode === "physical" ? record.originalSizeBytes : record.actualRecoveredBytes,
    estimatedTotalRecoverableBytes: record.originalSizeBytes, copies, backupCopiesRemain: true, providerCopyRemains: true, legalHold,
    userVisibleConsequence: record.objectType === "email_attachment" ? "The email remains readable while the attachment becomes permanently unavailable and displays a destruction certificate reference." : "The quarantined object is physically removed and cannot be restored after verification.",
    analyzedAt: new Date().toISOString(),
  }
}

export async function createDestructionRequest(input: { impact: WindowsStorageDestructionImpact; scope: WindowsStorageDestructionScope; reason: string; actor: string }) {
  if (!input.impact.eligible || input.impact.blockedReasons.length) throw new Error("This object is not eligible for permanent destruction")
  if (!input.impact.allowedScopes.includes(input.scope)) throw new Error("Selected destruction scope is not allowed")
  if (input.reason.trim().length < 12) throw new Error("A detailed permanent-destruction reason of at least 12 characters is required")
  const id = randomUUID()
  const payload = {
    id, request_number: requestNumber(), quarantine_case_id: input.impact.quarantineCaseId, quarantine_case_number: input.impact.quarantineCaseNumber,
    scope: input.scope, risk_level: input.impact.riskLevel, status: "awaiting_approval", reason: input.reason.trim(),
    source_id: input.impact.sourceId, object_reference: input.impact.objectReference, file_id: input.impact.fileId,
    mailbox_id: input.impact.mailboxId, entity_type: input.impact.entityType, entity_id: input.impact.entityId,
    original_name: input.impact.originalName, original_size_bytes: input.impact.originalSizeBytes, expected_sha256: input.impact.originalSha256,
    quarantine_location_token: input.impact.quarantineLocationToken, impact_snapshot: input.impact, requested_by: input.actor,
    approved_by: null, second_approved_by: null, approval_count: 0, approvals_required: input.impact.approvalsRequired,
    scheduled_for: null, cooling_off_seconds: input.impact.coolingOffSeconds, executed_by: null, actual_recovered_bytes: 0,
    certificate_id: null, certificate_number: null, completed_at: null, last_error: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_requests").insert(payload).select("*").single()
  if (error) throw error
  await recordDestructionEvent(id, "destruction_requested", "awaiting_approval", input.actor, input.reason, { scope: input.scope, riskLevel: input.impact.riskLevel, permanent: true })
  return requestFromRow(data)
}

export async function loadDestructionRequest(requestId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_requests").select("*").eq("id", requestId).maybeSingle()
  if (error) throw error
  return data ? requestFromRow(data) : null
}

export async function updateDestructionRequest(requestId: string, patch: AnyRow) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_requests").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", requestId).select("*").single()
  if (error) throw error
  return requestFromRow(data)
}

export async function recordDestructionEvent(requestId: string, eventType: string, status: string, actor: string, reason?: string | null, metadata: Record<string, unknown> = {}) {
  const db = createEmailOSCoreDb()
  const payload = { id: randomUUID(), request_id: requestId, event_type: eventType, status, actor, reason: clean(reason) || null, metadata, created_at: new Date().toISOString() }
  const { data, error } = await db.from("opsos_storage_destruction_events").insert(payload).select("*").single()
  if (error) throw error
  return eventFromRow(data)
}

export async function listDestructionEvents(requestId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_events").select("*").eq("request_id", requestId).order("created_at", { ascending: true }).limit(500)
  if (error) throw error
  return (data || []).map(eventFromRow)
}

export async function approveDestructionRequest(requestId: string, actor: string, reason: string) {
  const current = await loadDestructionRequest(requestId)
  if (!current) throw new Error("Destruction request not found")
  if (current.status !== "awaiting_approval") throw new Error("Request is not awaiting approval")
  const policy = await getDestructionPolicy().catch(() => defaultDestructionPolicy())
  if (policy.requireIndependentApproval && current.requestedBy === actor) throw new Error("The requester cannot approve their own permanent-destruction request")
  if ([current.approvedBy, current.secondApprovedBy].includes(actor)) throw new Error("This operator has already approved the request")
  const nextCount = current.approvalCount + 1
  const fullyApproved = nextCount >= current.approvalsRequired
  const patch = current.approvalCount === 0
    ? { approved_by: actor, approval_count: nextCount, status: fullyApproved ? "approved_for_destruction" : "awaiting_approval" }
    : { second_approved_by: actor, approval_count: nextCount, status: fullyApproved ? "approved_for_destruction" : "awaiting_approval" }
  const updated = await updateDestructionRequest(requestId, patch)
  const db = createEmailOSCoreDb()
  await db.from("opsos_storage_destruction_approvals").insert({ id: randomUUID(), request_id: requestId, actor, decision: "approved", reason, created_at: new Date().toISOString() })
  await recordDestructionEvent(requestId, fullyApproved ? "destruction_fully_approved" : "destruction_approval_recorded", updated.status, actor, reason, { approvalCount: nextCount, approvalsRequired: current.approvalsRequired })
  return updated
}

export async function scheduleDestructionRequest(requestId: string, actor: string, confirmation: string) {
  const current = await loadDestructionRequest(requestId)
  if (!current) throw new Error("Destruction request not found")
  if (current.status !== "approved_for_destruction") throw new Error("Request must be fully approved before scheduling")
  const policy = await getDestructionPolicy().catch(() => defaultDestructionPolicy())
  if (current.riskLevel === "high" && policy.requireTypedConfirmationForHighRisk) {
    const expected = `SUPPRIMER DÉFINITIVEMENT ${current.requestNumber}`
    if (clean(confirmation) !== expected) throw new Error(`Type exactly: ${expected}`)
  }
  const scheduledFor = new Date(Date.now() + Math.max(0, current.coolingOffSeconds) * 1000).toISOString()
  const updated = await updateDestructionRequest(requestId, { status: "destruction_scheduled", scheduled_for: scheduledFor })
  await recordDestructionEvent(requestId, "destruction_scheduled", updated.status, actor, "Cooling-off period started", { scheduledFor, coolingOffSeconds: current.coolingOffSeconds })
  return updated
}

export async function cancelDestructionRequest(requestId: string, actor: string, reason: string) {
  const current = await loadDestructionRequest(requestId)
  if (!current) throw new Error("Destruction request not found")
  if (!["awaiting_approval", "approved_for_destruction", "destruction_scheduled"].includes(current.status)) throw new Error("This request can no longer be cancelled")
  const updated = await updateDestructionRequest(requestId, { status: "cancelled", last_error: null })
  await recordDestructionEvent(requestId, "destruction_cancelled", "cancelled", actor, reason, { permanentDeletionExecuted: false })
  return updated
}

export async function createDestructionCertificate(input: {
  request: WindowsStorageDestructionRequest
  actor: string
  verificationResult: string
  actualRecoveredBytes: number
  remainingCopies: WindowsStorageDestructionCopyState[]
}) {
  const db = createEmailOSCoreDb()
  const id = randomUUID()
  const number = certificateNumber()
  const approvers = [input.request.approvedBy, input.request.secondApprovedBy].filter(Boolean)
  const payload = {
    id, certificate_number: number, request_id: input.request.id, request_number: input.request.requestNumber,
    quarantine_case_id: input.request.quarantineCaseId, original_name: input.request.originalName,
    original_size_bytes: input.request.originalSizeBytes, original_sha256: input.request.expectedSha256,
    source_id: input.request.sourceId, mailbox_id: input.request.mailboxId, scope: input.request.scope,
    requester: input.request.requestedBy, approvers, executed_by: input.actor, executed_at: new Date().toISOString(),
    verification_result: input.verificationResult, actual_recovered_bytes: input.actualRecoveredBytes,
    remaining_copies: input.remainingCopies, created_at: new Date().toISOString(),
  }
  const { data, error } = await db.from("opsos_storage_destruction_certificates").insert(payload).select("*").single()
  if (error) throw error
  await updateDestructionRequest(input.request.id, { certificate_id: id, certificate_number: number })
  return certificateFromRow(data)
}

export async function loadDestructionCertificate(requestId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_destruction_certificates").select("*").eq("request_id", requestId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data ? certificateFromRow(data) : null
}

export async function listDestructionRegistry(limit = 300): Promise<WindowsStorageDestructionRegistry> {
  const db = createEmailOSCoreDb()
  const [{ data, error }, quarantine, policy, retentionPolicies, cleanupProfiles, legalHolds] = await Promise.all([
    db.from("opsos_storage_destruction_requests").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit))),
    listQuarantineCases(500), getDestructionPolicy().catch(() => defaultDestructionPolicy()), listRetentionPolicies().catch(() => []), listCleanupProfiles(), listLegalHolds().catch(() => []),
  ])
  if (error) throw error
  const requests = (data || []).map(requestFromRow)
  const eligibleQuarantineCases = quarantine.cases.filter((item) => item.status === "eligible_for_future_purge" || (item.status === "quarantined" && new Date(item.retentionUntil).getTime() <= Date.now()))
  return {
    phase: 4, permanent: true, requests, eligibleQuarantineCases, totalRequests: requests.length,
    awaitingApprovalCount: requests.filter((item) => item.status === "awaiting_approval").length,
    scheduledCount: requests.filter((item) => item.status === "destruction_scheduled").length,
    destroyedCount: requests.filter((item) => item.status === "destroyed").length,
    failedCount: requests.filter((item) => ["failed", "partially_destroyed"].includes(item.status)).length,
    totalRecoveredBytes: requests.reduce((sum, item) => sum + item.actualRecoveredBytes, 0),
    policy, retentionPolicies, cleanupProfiles, legalHolds, queriedAt: new Date().toISOString(),
  }
}

export async function simulateRetentionPolicy(policyId: string): Promise<WindowsStorageRetentionDryRun> {
  const policies = await listRetentionPolicies()
  const policy = policies.find((item) => item.id === policyId)
  if (!policy) throw new Error("Retention policy not found")
  const quarantine = await listQuarantineCases(500)
  const cutoff = Date.now() - policy.minimumAgeDays * 86_400_000
  const matched = quarantine.cases.filter((item) => new Date(item.createdAt).getTime() <= cutoff)
  const sample = matched.slice(0, 50).map((item) => ({ id: item.id, label: item.originalName, bytes: item.originalSizeBytes, reason: item.status === "eligible_for_future_purge" ? "Retention completed" : "Further review required", eligible: item.status === "eligible_for_future_purge" }))
  return {
    phase: 4, readOnly: true, policyId: policy.id, policyName: policy.name, matchedCount: matched.length,
    matchedBytes: matched.reduce((sum, item) => sum + item.originalSizeBytes, 0),
    immediatelyEligibleCount: sample.filter((item) => item.eligible).length,
    blockedCount: matched.filter((item) => item.riskLevel === "blocked").length,
    legalHoldCount: 0, reviewRequiredCount: matched.filter((item) => item.status !== "eligible_for_future_purge").length,
    sample, simulatedAt: new Date().toISOString(),
  }
}
