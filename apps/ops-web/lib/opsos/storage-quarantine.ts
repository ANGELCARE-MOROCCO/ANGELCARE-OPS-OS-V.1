import { randomUUID } from "node:crypto"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import type {
  WindowsStorageQuarantineCase,
  WindowsStorageQuarantineEvent,
  WindowsStorageQuarantineImpact,
  WindowsStorageQuarantineListResult,
  WindowsStorageQuarantineMode,
  WindowsStorageQuarantinePolicy,
  WindowsStorageQuarantineStatus,
} from "@/lib/opsos/windows-node-types"

type AnyRow = Record<string, any>

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function iso(value: unknown, fallback = "") {
  const text = clean(value)
  if (!text) return fallback
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function caseNumber() {
  const year = new Date().getUTCFullYear()
  return `QRT-${year}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
}

export function defaultQuarantinePolicy(): WindowsStorageQuarantinePolicy {
  return {
    id: "default",
    defaultRetentionDays: 30,
    maximumRetentionDays: 180,
    requireApprovalForReferenced: true,
    requireSecondApprovalAboveBytes: 500 * 1024 * 1024,
    allowSameVolumeQuarantine: true,
    allowExternalVaultQuarantine: true,
    allowMessageQuarantine: true,
    allowActiveSendAttachmentQuarantine: false,
    allowLegalHoldQuarantine: false,
    active: true,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  }
}

function policyFromRow(row?: AnyRow | null): WindowsStorageQuarantinePolicy {
  if (!row) return defaultQuarantinePolicy()
  return {
    id: clean(row.id) || "default",
    defaultRetentionDays: num(row.default_retention_days, 30),
    maximumRetentionDays: num(row.maximum_retention_days, 180),
    requireApprovalForReferenced: row.require_approval_for_referenced !== false,
    requireSecondApprovalAboveBytes: num(row.require_second_approval_above_bytes, 500 * 1024 * 1024),
    allowSameVolumeQuarantine: row.allow_same_volume_quarantine !== false,
    allowExternalVaultQuarantine: row.allow_external_vault_quarantine !== false,
    allowMessageQuarantine: row.allow_message_quarantine !== false,
    allowActiveSendAttachmentQuarantine: Boolean(row.allow_active_send_attachment_quarantine),
    allowLegalHoldQuarantine: Boolean(row.allow_legal_hold_quarantine),
    active: row.active !== false,
    updatedAt: iso(row.updated_at, new Date().toISOString()),
    updatedBy: clean(row.updated_by) || null,
  }
}

function caseFromRow(row: AnyRow): WindowsStorageQuarantineCase {
  return {
    id: clean(row.id),
    caseNumber: clean(row.case_number),
    sourceId: clean(row.source_id),
    objectType: clean(row.object_type),
    objectReference: clean(row.object_reference),
    fileId: clean(row.file_id) || null,
    mailboxId: clean(row.mailbox_id) || null,
    entityType: clean(row.entity_type) || null,
    entityId: clean(row.entity_id) || null,
    originalName: clean(row.original_name),
    originalSizeBytes: num(row.original_size_bytes),
    originalSha256: clean(row.original_sha256) || null,
    originalRelativePath: clean(row.original_relative_path),
    originalLocationToken: clean(row.original_location_token),
    quarantineMode: (clean(row.quarantine_mode) || "logical") as WindowsStorageQuarantineMode,
    quarantineLocationToken: clean(row.quarantine_location_token) || null,
    riskLevel: (clean(row.risk_level) || "controlled") as WindowsStorageQuarantineCase["riskLevel"],
    status: (clean(row.status) || "draft") as WindowsStorageQuarantineStatus,
    reason: clean(row.reason),
    impactSnapshot: (row.impact_snapshot || {}) as WindowsStorageQuarantineImpact,
    referencesSnapshot: Array.isArray(row.references_snapshot) ? row.references_snapshot : [],
    estimatedRecoverableBytes: num(row.estimated_recoverable_bytes),
    actualRecoveredBytes: num(row.actual_recovered_bytes),
    requestedBy: clean(row.requested_by),
    approvedBy: clean(row.approved_by) || null,
    secondApprovedBy: clean(row.second_approved_by) || null,
    approvalCount: num(row.approval_count),
    approvalsRequired: Math.max(1, num(row.approvals_required, 1)),
    executedBy: clean(row.executed_by) || null,
    retentionUntil: iso(row.retention_until),
    restoreReadiness: (clean(row.restore_readiness) || "partial") as WindowsStorageQuarantineCase["restoreReadiness"],
    restoredAt: iso(row.restored_at) || null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    lastError: clean(row.last_error) || null,
  }
}

function eventFromRow(row: AnyRow): WindowsStorageQuarantineEvent {
  return {
    id: clean(row.id),
    caseId: clean(row.case_id),
    eventType: clean(row.event_type),
    status: clean(row.status),
    actor: clean(row.actor),
    reason: clean(row.reason) || null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: iso(row.created_at),
  }
}

export async function getQuarantinePolicy() {
  const db = createEmailOSCoreDb()
  const { data, error } = await db
    .from("opsos_storage_quarantine_policies")
    .select("*")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return policyFromRow(data)
}

export async function saveQuarantinePolicy(input: Partial<WindowsStorageQuarantinePolicy>, actor: string) {
  const current = await getQuarantinePolicy().catch(() => defaultQuarantinePolicy())
  const days = Math.max(1, Math.min(3650, Math.floor(num(input.defaultRetentionDays, current.defaultRetentionDays))))
  const maximumDays = Math.max(days, Math.min(3650, Math.floor(num(input.maximumRetentionDays, current.maximumRetentionDays))))
  const payload = {
    id: current.id === "default" ? randomUUID() : current.id,
    default_retention_days: days,
    maximum_retention_days: maximumDays,
    require_approval_for_referenced: input.requireApprovalForReferenced ?? current.requireApprovalForReferenced,
    require_second_approval_above_bytes: Math.max(0, num(input.requireSecondApprovalAboveBytes, current.requireSecondApprovalAboveBytes)),
    allow_same_volume_quarantine: input.allowSameVolumeQuarantine ?? current.allowSameVolumeQuarantine,
    allow_external_vault_quarantine: input.allowExternalVaultQuarantine ?? current.allowExternalVaultQuarantine,
    allow_message_quarantine: input.allowMessageQuarantine ?? current.allowMessageQuarantine,
    allow_active_send_attachment_quarantine: input.allowActiveSendAttachmentQuarantine ?? current.allowActiveSendAttachmentQuarantine,
    allow_legal_hold_quarantine: input.allowLegalHoldQuarantine ?? current.allowLegalHoldQuarantine,
    active: true,
    updated_at: new Date().toISOString(),
    updated_by: actor,
  }
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_quarantine_policies").upsert(payload).select("*").single()
  if (error) throw error
  return policyFromRow(data)
}

export async function createQuarantineCase(input: {
  impact: WindowsStorageQuarantineImpact
  mode: WindowsStorageQuarantineMode
  reason: string
  retentionDays: number
  actor: string
}) {
  if (!input.reason.trim() || input.reason.trim().length < 8) throw new Error("A detailed quarantine reason is required")
  if (!input.impact.allowedModes.includes(input.mode)) throw new Error("Selected quarantine mode is not allowed for this object")
  if (input.impact.riskLevel === "blocked" || input.impact.blockedReasons.length) throw new Error("This object is blocked from quarantine")
  const policy = await getQuarantinePolicy().catch(() => defaultQuarantinePolicy())
  const retentionDays = Math.max(1, Math.min(policy.maximumRetentionDays, Math.floor(input.retentionDays || policy.defaultRetentionDays)))
  const now = new Date()
  const retentionUntil = new Date(now.getTime() + retentionDays * 86_400_000).toISOString()
  const needsApproval = input.impact.riskLevel !== "low" || (policy.requireApprovalForReferenced && input.impact.referenceCount > 0)
  const approvalsRequired = input.impact.riskLevel === "high" || input.impact.sizeBytes >= policy.requireSecondApprovalAboveBytes ? 2 : needsApproval ? 1 : 1
  const payload = {
    id: randomUUID(),
    case_number: caseNumber(),
    source_id: input.impact.sourceId,
    object_type: input.impact.objectType,
    object_reference: `${input.impact.sourceId}:${input.impact.relativePath}`,
    file_id: input.impact.fileId,
    mailbox_id: input.impact.mailboxId,
    entity_type: input.impact.entityType,
    entity_id: input.impact.entityId,
    original_name: input.impact.filename,
    original_size_bytes: input.impact.sizeBytes,
    original_sha256: input.impact.sha256Hash,
    original_relative_path: input.impact.relativePath,
    original_location_token: clean(input.impact.originalLocationToken),
    quarantine_mode: input.mode,
    quarantine_location_token: null,
    risk_level: input.impact.riskLevel,
    status: needsApproval ? "awaiting_approval" : "approved",
    reason: input.reason.trim(),
    impact_snapshot: input.impact,
    references_snapshot: input.impact.references,
    estimated_recoverable_bytes: input.impact.primaryStorageRecoveryByMode[input.mode] || 0,
    actual_recovered_bytes: 0,
    requested_by: input.actor,
    approved_by: needsApproval ? null : input.actor,
    second_approved_by: null,
    approval_count: needsApproval ? 0 : 1,
    approvals_required: approvalsRequired,
    executed_by: null,
    retention_until: retentionUntil,
    restore_readiness: input.impact.restoreReadiness,
    restored_at: null,
    last_error: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_quarantine_cases").insert(payload).select("*").single()
  if (error) throw error
  const itemPayload = {
    id: randomUUID(), case_id: payload.id, source_id: payload.source_id, object_reference: payload.object_reference,
    file_id: payload.file_id, original_name: payload.original_name, original_size_bytes: payload.original_size_bytes,
    original_sha256: payload.original_sha256, original_relative_path: payload.original_relative_path, status: "registered",
    metadata: { objectType: payload.object_type, mailboxId: payload.mailbox_id, entityType: payload.entity_type, entityId: payload.entity_id },
    created_at: now.toISOString(), updated_at: now.toISOString(),
  }
  const referencesPayload = input.impact.references.map((reference) => ({
    id: randomUUID(), case_id: payload.id, reference_type: reference.type, reference_id: reference.id,
    label: reference.label, detail: reference.detail, mailbox_id: reference.mailboxId, active: reference.active,
    snapshot: reference, created_at: now.toISOString(),
  }))
  const { error: itemError } = await db.from("opsos_storage_quarantine_items").insert(itemPayload)
  if (itemError) throw itemError
  if (referencesPayload.length) {
    const { error: referencesError } = await db.from("opsos_storage_quarantine_references").insert(referencesPayload)
    if (referencesError) throw referencesError
  }
  await recordQuarantineEvent(payload.id, "quarantine_requested", payload.status, input.actor, input.reason, { mode: input.mode, riskLevel: input.impact.riskLevel, retentionDays, approvalsRequired })
  return caseFromRow(data)
}

export async function loadQuarantineCase(caseId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_quarantine_cases").select("*").eq("id", caseId).maybeSingle()
  if (error) throw error
  return data ? caseFromRow(data) : null
}

export async function listQuarantineCases(limit = 200): Promise<WindowsStorageQuarantineListResult> {
  const db = createEmailOSCoreDb()
  const [{ data, error }, policy] = await Promise.all([
    db.from("opsos_storage_quarantine_cases").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit))),
    getQuarantinePolicy().catch(() => defaultQuarantinePolicy()),
  ])
  if (error) throw error
  let cases = (data || []).map(caseFromRow)
  const expired = cases.filter((item) => item.status === "quarantined" && new Date(item.retentionUntil).getTime() <= Date.now())
  if (expired.length) {
    await Promise.all(expired.map(async (item) => {
      await db.from("opsos_storage_quarantine_cases").update({ status: "eligible_for_future_purge", updated_at: new Date().toISOString() }).eq("id", item.id)
      await db.from("opsos_storage_quarantine_events").insert({
        id: randomUUID(), case_id: item.id, event_type: "retention_expired", status: "eligible_for_future_purge",
        actor: "system_retention_clock", reason: "Retention elapsed; case remains stored and reversible pending future Phase 4 review.",
        metadata: { permanentDeletion: false, automaticPurge: false }, created_at: new Date().toISOString(),
      })
    }))
    const expiredIds = new Set(expired.map((item) => item.id))
    cases = cases.map((item) => expiredIds.has(item.id) ? { ...item, status: "eligible_for_future_purge" as const, updatedAt: new Date().toISOString() } : item)
  }
  return {
    phase: 3,
    reversible: true,
    cases,
    totalCases: cases.length,
    quarantinedCount: cases.filter((item) => item.status === "quarantined").length,
    awaitingApprovalCount: cases.filter((item) => item.status === "awaiting_approval").length,
    restoreRequestedCount: cases.filter((item) => item.status === "restore_requested").length,
    eligibleForFuturePurgeCount: cases.filter((item) => item.status === "eligible_for_future_purge").length,
    totalPrimaryBytesRecovered: cases.reduce((sum, item) => sum + item.actualRecoveredBytes, 0),
    totalVaultBytesOccupied: cases.filter((item) => item.status === "quarantined" && item.quarantineMode === "physical").reduce((sum, item) => sum + item.originalSizeBytes, 0),
    policies: policy,
    queriedAt: new Date().toISOString(),
  }
}

export async function listQuarantineEvents(caseId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_quarantine_events").select("*").eq("case_id", caseId).order("created_at", { ascending: true }).limit(500)
  if (error) throw error
  return (data || []).map(eventFromRow)
}

export async function updateQuarantineCase(caseId: string, patch: AnyRow) {
  const db = createEmailOSCoreDb()
  const payload = { ...patch, updated_at: new Date().toISOString() }
  const { data, error } = await db.from("opsos_storage_quarantine_cases").update(payload).eq("id", caseId).select("*").single()
  if (error) throw error
  return caseFromRow(data)
}

export async function recordQuarantineEvent(caseId: string, eventType: string, status: string, actor: string, reason?: string | null, metadata: Record<string, unknown> = {}) {
  const db = createEmailOSCoreDb()
  const payload = {
    id: randomUUID(),
    case_id: caseId,
    event_type: eventType,
    status,
    actor,
    reason: clean(reason) || null,
    metadata,
    created_at: new Date().toISOString(),
  }
  const { data, error } = await db.from("opsos_storage_quarantine_events").insert(payload).select("*").single()
  if (error) throw error
  return eventFromRow(data)
}

export async function approveQuarantineCase(caseId: string, actor: string, reason: string) {
  const current = await loadQuarantineCase(caseId)
  if (!current) throw new Error("Quarantine case not found")
  if (current.status !== "awaiting_approval") throw new Error("Case is not awaiting approval")
  if (current.requestedBy === actor && current.approvalsRequired > 1) throw new Error("This case requires approval by an operator different from the requester")
  if (current.approvedBy === actor) throw new Error("The same operator cannot provide both approvals")
  const nextCount = current.approvalCount + 1
  const fullyApproved = nextCount >= current.approvalsRequired
  const patch = current.approvalCount === 0
    ? { approved_by: actor, approval_count: nextCount, status: fullyApproved ? "approved" : "awaiting_approval" }
    : { second_approved_by: actor, approval_count: nextCount, status: fullyApproved ? "approved" : "awaiting_approval" }
  const updated = await updateQuarantineCase(caseId, patch)
  await recordQuarantineEvent(caseId, fullyApproved ? "quarantine_fully_approved" : "quarantine_approval_recorded", updated.status, actor, reason || "Quarantine approved", { requestedBy: current.requestedBy, riskLevel: current.riskLevel, approvalCount: nextCount, approvalsRequired: current.approvalsRequired })
  return updated
}

export async function extendQuarantineRetention(caseId: string, days: number, actor: string, reason: string) {
  const current = await loadQuarantineCase(caseId)
  if (!current) throw new Error("Quarantine case not found")
  const policy = await getQuarantinePolicy().catch(() => defaultQuarantinePolicy())
  const normalized = Math.max(1, Math.min(policy.maximumRetentionDays, Math.floor(days)))
  const base = Math.max(Date.now(), new Date(current.retentionUntil).getTime())
  const retentionUntil = new Date(base + normalized * 86_400_000).toISOString()
  const updated = await updateQuarantineCase(caseId, { retention_until: retentionUntil })
  await recordQuarantineEvent(caseId, "retention_extended", current.status, actor, reason, { days: normalized, retentionUntil })
  return updated
}

export async function updateQuarantineItemStatus(caseId: string, status: string, metadata: Record<string, unknown> = {}) {
  const db = createEmailOSCoreDb()
  const { error } = await db.from("opsos_storage_quarantine_items").update({ status, metadata, updated_at: new Date().toISOString() }).eq("case_id", caseId)
  if (error) throw error
}

export async function createRestoreJob(input: { caseId: string; actor: string; reason: string; originalSha256?: string | null }) {
  const db = createEmailOSCoreDb()
  const payload = {
    id: randomUUID(), case_id: input.caseId, status: "requested", requested_by: input.actor, reason: input.reason,
    original_sha256: clean(input.originalSha256) || null, restored_sha256: null, result: {}, last_error: null,
    requested_at: new Date().toISOString(), started_at: null, completed_at: null, updated_at: new Date().toISOString(),
  }
  const { data, error } = await db.from("opsos_storage_restore_jobs").insert(payload).select("*").single()
  if (error) throw error
  return data as AnyRow
}

export async function updateRestoreJob(jobId: string, patch: Record<string, unknown>) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_restore_jobs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", jobId).select("*").single()
  if (error) throw error
  return data as AnyRow
}

export async function updateStorageRecordForQuarantine(input: {
  fileId: string | null
  caseId: string
  caseNumber: string
  status: "quarantined" | "active"
  reason: string
  actor: string
  quarantineMode?: WindowsStorageQuarantineMode
  quarantineLocationToken?: string | null
  originalStatus?: string | null
}) {
  if (!input.fileId) return null
  const db = createEmailOSCoreDb()
  const { data: current, error: loadError } = await db.from("angelcare_storage_files").select("*").eq("id", input.fileId).maybeSingle()
  if (loadError) throw loadError
  if (!current) return null
  const metadata = current.metadata && typeof current.metadata === "object" ? current.metadata : {}
  const nextMetadata = input.status === "quarantined"
    ? {
        ...metadata,
        quarantine: {
          caseId: input.caseId,
          caseNumber: input.caseNumber,
          reason: input.reason,
          mode: input.quarantineMode,
          locationToken: input.quarantineLocationToken,
          quarantinedAt: new Date().toISOString(),
          quarantinedBy: input.actor,
          originalStatus: clean(current.status) || "active",
          reversible: true,
        },
      }
    : {
        ...metadata,
        quarantine: {
          ...(metadata as AnyRow).quarantine,
          restoredAt: new Date().toISOString(),
          restoredBy: input.actor,
          restored: true,
        },
      }
  const { data, error } = await db.from("angelcare_storage_files").update({
    status: input.status === "quarantined" ? "quarantined" : clean(input.originalStatus) || clean((metadata as AnyRow).quarantine?.originalStatus) || "active",
    metadata: nextMetadata,
    updated_at: new Date().toISOString(),
  }).eq("id", input.fileId).select("*").single()
  if (error) throw error
  return data
}
