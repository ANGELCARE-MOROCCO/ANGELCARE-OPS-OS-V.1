import { randomUUID } from "node:crypto"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { fetchEmailOSInboundBridgeMessages } from "@/lib/email-os-core/inbound-bridge"
import { persistEmailOSBridgeInboundMessages } from "@/lib/email-os-core/inbound-sync"
import {
  listEmailOSMultiMailboxes,
  listEmailOSMultiMailboxesFromDb,
  type ResolvedEmailOSMailbox,
} from "@/lib/email-os-core/multi-mailbox-resolver"
import { listCleanupProfiles, listRetentionPolicies, simulateRetentionPolicy } from "@/lib/opsos/storage-destruction"
import { callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type {
  WindowsStorageDedupCopy,
  WindowsStorageDedupGroup,
  WindowsStorageDedupPlan,
  WindowsStorageDedupPlanStatus,
  WindowsStorageDedupScan,
  WindowsStorageForecast,
  WindowsStorageLifecycleAction,
  WindowsStorageLifecycleAlert,
  WindowsStorageLifecyclePolicy,
  WindowsStorageLifecycleRegistry,
  WindowsStorageLifecycleRun,
  WindowsStorageLifecycleRunItem,
  WindowsStorageLifecycleRunStatus,
  WindowsStorageLifecycleSnapshot,
  WindowsStorageProviderCapabilities,
  WindowsStorageProviderReconciliation,
  WindowsStorageProviderSyncRun,
} from "@/lib/opsos/windows-node-types"

type AnyRow = Record<string, any>

function clean(value: unknown) { return String(value ?? "").trim() }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function bool(value: unknown, fallback = false) { return value === undefined || value === null ? fallback : Boolean(value) }
function iso(value: unknown, fallback = "") { const text = clean(value); if (!text) return fallback; const date = new Date(text); return Number.isNaN(date.getTime()) ? fallback : date.toISOString() }
function now() { return new Date().toISOString() }
function runNumber() { return `LFC-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}` }
function planNumber() { return `DDP-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}` }
function providerRunNumber() { return `PRV-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}` }

export const DEFAULT_LIFECYCLE_ACTIONS: WindowsStorageLifecycleAction[] = ["inventory", "forecast", "provider_reconcile", "dedup_scan", "retention_dry_run", "cleanup_dry_run"]

export function defaultLifecyclePolicy(): WindowsStorageLifecyclePolicy {
  return {
    id: "default",
    name: "Cycle de vie OPSOS par défaut",
    enabled: true,
    cadenceMinutes: 60,
    actions: DEFAULT_LIFECYCLE_ACTIONS,
    providerSyncEnabled: false,
    providerSyncLimitPerMailbox: 25,
    dedupScanEnabled: true,
    autoCreateQuarantineRequests: false,
    autoCreateDestructionReviews: false,
    autoApproveLowRisk: false,
    maximumCandidatesPerRun: 250,
    growthAlertBytesPerDay: 2 * 1024 * 1024 * 1024,
    warningFreeBytes: 25 * 1024 * 1024 * 1024,
    criticalFreeBytes: 10 * 1024 * 1024 * 1024,
    staleProviderMinutes: 360,
    requireDryRun: true,
    updatedAt: now(),
    updatedBy: null,
  }
}

function policyFromRow(row?: AnyRow | null): WindowsStorageLifecyclePolicy {
  if (!row) return defaultLifecyclePolicy()
  return {
    id: clean(row.id) || "default",
    name: clean(row.name) || "Cycle de vie OPSOS",
    enabled: row.enabled !== false,
    cadenceMinutes: Math.max(15, num(row.cadence_minutes, 60)),
    actions: Array.isArray(row.actions) ? row.actions.map(clean).filter(Boolean) as WindowsStorageLifecycleAction[] : DEFAULT_LIFECYCLE_ACTIONS,
    providerSyncEnabled: bool(row.provider_sync_enabled, false),
    providerSyncLimitPerMailbox: Math.max(1, Math.min(100, num(row.provider_sync_limit_per_mailbox, 25))),
    dedupScanEnabled: bool(row.dedup_scan_enabled, true),
    autoCreateQuarantineRequests: bool(row.auto_create_quarantine_requests, false),
    autoCreateDestructionReviews: bool(row.auto_create_destruction_reviews, false),
    autoApproveLowRisk: bool(row.auto_approve_low_risk, false),
    maximumCandidatesPerRun: Math.max(10, Math.min(5000, num(row.maximum_candidates_per_run, 250))),
    growthAlertBytesPerDay: Math.max(0, num(row.growth_alert_bytes_per_day, 2 * 1024 * 1024 * 1024)),
    warningFreeBytes: Math.max(0, num(row.warning_free_bytes, 25 * 1024 * 1024 * 1024)),
    criticalFreeBytes: Math.max(0, num(row.critical_free_bytes, 10 * 1024 * 1024 * 1024)),
    staleProviderMinutes: Math.max(15, num(row.stale_provider_minutes, 360)),
    requireDryRun: row.require_dry_run !== false,
    updatedAt: iso(row.updated_at, now()),
    updatedBy: clean(row.updated_by) || null,
  }
}

function snapshotFromRow(row: AnyRow): WindowsStorageLifecycleSnapshot {
  return {
    id: clean(row.id), totalBytes: num(row.total_bytes), usedBytes: num(row.used_bytes), freeBytes: num(row.free_bytes),
    attachmentBytes: num(row.attachment_bytes), duplicateBytes: num(row.duplicate_bytes), quarantineBytes: num(row.quarantine_bytes),
    recoverableBytes: num(row.recoverable_bytes), mailboxCount: num(row.mailbox_count), storageFileCount: num(row.storage_file_count),
    providerMessageCount: num(row.provider_message_count), capturedAt: iso(row.captured_at, now()),
  }
}

function alertFromRow(row: AnyRow): WindowsStorageLifecycleAlert {
  return {
    id: clean(row.id), alertType: clean(row.alert_type), severity: (clean(row.severity) || "info") as WindowsStorageLifecycleAlert["severity"],
    title: clean(row.title), message: clean(row.message), status: (clean(row.status) || "open") as WindowsStorageLifecycleAlert["status"],
    source: clean(row.source), evidence: row.evidence && typeof row.evidence === "object" ? row.evidence : {}, createdAt: iso(row.created_at, now()),
    acknowledgedAt: iso(row.acknowledged_at) || null, acknowledgedBy: clean(row.acknowledged_by) || null, resolvedAt: iso(row.resolved_at) || null,
  }
}

function runItemFromRow(row: AnyRow): WindowsStorageLifecycleRunItem {
  return {
    id: clean(row.id), runId: clean(row.run_id), action: clean(row.action) as WindowsStorageLifecycleAction, status: clean(row.status),
    objectReference: clean(row.object_reference) || null, sourceId: clean(row.source_id) || null, mailboxId: clean(row.mailbox_id) || null,
    sizeBytes: num(row.size_bytes), recommendedAction: clean(row.recommended_action) || null,
    riskLevel: clean(row.risk_level) ? clean(row.risk_level) as WindowsStorageLifecycleRunItem["riskLevel"] : null,
    result: row.result && typeof row.result === "object" ? row.result : {}, createdAt: iso(row.created_at, now()), updatedAt: iso(row.updated_at, now()),
  }
}

function runFromRow(row: AnyRow, items: WindowsStorageLifecycleRunItem[] = []): WindowsStorageLifecycleRun {
  return {
    id: clean(row.id), runNumber: clean(row.run_number), policyId: clean(row.policy_id) || null,
    trigger: (clean(row.trigger) || "manual") as WindowsStorageLifecycleRun["trigger"], status: (clean(row.status) || "queued") as WindowsStorageLifecycleRunStatus,
    actions: Array.isArray(row.actions) ? row.actions.map(clean).filter(Boolean) as WindowsStorageLifecycleAction[] : [], requestedBy: clean(row.requested_by),
    startedAt: iso(row.started_at) || null, completedAt: iso(row.completed_at) || null, pausedAt: iso(row.paused_at) || null, cancelledAt: iso(row.cancelled_at) || null,
    scannedCount: num(row.scanned_count), candidateCount: num(row.candidate_count), recommendedRecoveryBytes: num(row.recommended_recovery_bytes),
    actualRecoveredBytes: num(row.actual_recovered_bytes), providerMailboxCount: num(row.provider_mailbox_count), providerMessageCount: num(row.provider_message_count),
    warningCount: num(row.warning_count), errorCount: num(row.error_count), summary: row.summary && typeof row.summary === "object" ? row.summary : {},
    lastError: clean(row.last_error) || null, createdAt: iso(row.created_at, now()), updatedAt: iso(row.updated_at, now()), items,
  }
}

function dedupCopyFromRow(row: AnyRow): WindowsStorageDedupCopy {
  const snapshot = row.snapshot && typeof row.snapshot === "object" ? row.snapshot : row
  return {
    fileId: clean(row.file_id || snapshot.fileId) || null, sourceId: clean(row.source_id || snapshot.sourceId), relativePath: clean(row.relative_path || snapshot.relativePath),
    filename: clean(row.filename || snapshot.filename), mailboxId: clean(row.mailbox_id || snapshot.mailboxId) || null,
    entityType: clean(row.entity_type || snapshot.entityType) || null, entityId: clean(row.entity_id || snapshot.entityId) || null,
    sizeBytes: num(row.size_bytes || snapshot.sizeBytes), sha256: clean(row.sha256 || snapshot.sha256), canonical: bool(row.canonical || snapshot.canonical),
    activeReferenceCount: num(row.active_reference_count || snapshot.activeReferenceCount), legalHold: bool(row.legal_hold || snapshot.legalHold), status: clean(row.status || snapshot.status) || "active",
  }
}

function dedupPlanFromRow(row: AnyRow, copies: WindowsStorageDedupCopy[] = []): WindowsStorageDedupPlan {
  return {
    id: clean(row.id), planNumber: clean(row.plan_number), status: (clean(row.status) || "draft") as WindowsStorageDedupPlanStatus,
    sha256: clean(row.sha256_hash), canonicalFileId: clean(row.canonical_file_id) || null, canonicalSourceId: clean(row.canonical_source_id),
    canonicalRelativePath: clean(row.canonical_relative_path), sizeBytes: num(row.size_bytes), physicalCopies: num(row.physical_copies), referenceCount: num(row.reference_count),
    potentialRecoverableBytes: num(row.potential_recoverable_bytes), actualRecoveredBytes: num(row.actual_recovered_bytes),
    riskLevel: (clean(row.risk_level) || "controlled") as WindowsStorageDedupPlan["riskLevel"], reason: clean(row.reason), requestedBy: clean(row.requested_by),
    approvedBy: clean(row.approved_by) || null, executedBy: clean(row.executed_by) || null, bridgePlanToken: clean(row.bridge_plan_token) || null,
    preflight: row.preflight && typeof row.preflight === "object" ? row.preflight : {}, result: row.result && typeof row.result === "object" ? row.result : {},
    createdAt: iso(row.created_at, now()), updatedAt: iso(row.updated_at, now()), completedAt: iso(row.completed_at) || null, copies,
  }
}

function providerRunFromRow(row: AnyRow): WindowsStorageProviderSyncRun {
  return {
    id: clean(row.id), runNumber: clean(row.run_number), mailboxId: clean(row.mailbox_id) || null,
    status: (clean(row.status) || "queued") as WindowsStorageProviderSyncRun["status"], requestedBy: clean(row.requested_by),
    mailboxCount: num(row.mailbox_count), fetchedCount: num(row.fetched_count), insertedCount: num(row.inserted_count), updatedCount: num(row.updated_count),
    skippedCount: num(row.skipped_count), failedCount: num(row.failed_count), result: row.result && typeof row.result === "object" ? row.result : {},
    createdAt: iso(row.created_at, now()), startedAt: iso(row.started_at) || null, completedAt: iso(row.completed_at) || null, lastError: clean(row.last_error) || null,
  }
}

function reconciliationFromRow(row: AnyRow): WindowsStorageProviderReconciliation {
  return {
    id: clean(row.id), mailboxId: clean(row.mailbox_id), email: clean(row.email), providerMessageCount: num(row.provider_message_count), localMessageCount: num(row.local_message_count),
    providerOnlyCount: num(row.provider_only_count), localOnlyCount: num(row.local_only_count), matchedCount: num(row.matched_count),
    providerOnlyUids: Array.isArray(row.provider_only_uids) ? row.provider_only_uids.map(clean).filter(Boolean) : [],
    localOnlyUids: Array.isArray(row.local_only_uids) ? row.local_only_uids.map(clean).filter(Boolean) : [],
    status: (clean(row.status) || "partial") as WindowsStorageProviderReconciliation["status"], detail: clean(row.detail), reconciledAt: iso(row.reconciled_at, now()),
  }
}

export async function getLifecyclePolicy() {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_lifecycle_policies").select("*").eq("enabled", true).order("updated_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return policyFromRow(data)
}

export async function saveLifecyclePolicy(input: Partial<WindowsStorageLifecyclePolicy>, actor: string) {
  const current = await getLifecyclePolicy().catch(() => defaultLifecyclePolicy())
  const db = createEmailOSCoreDb()
  const payload = {
    id: current.id === "default" ? randomUUID() : current.id, name: clean(input.name) || current.name, enabled: input.enabled ?? current.enabled,
    cadence_minutes: Math.max(15, num(input.cadenceMinutes, current.cadenceMinutes)), actions: Array.isArray(input.actions) ? input.actions : current.actions,
    provider_sync_enabled: input.providerSyncEnabled ?? current.providerSyncEnabled,
    provider_sync_limit_per_mailbox: Math.max(1, Math.min(100, num(input.providerSyncLimitPerMailbox, current.providerSyncLimitPerMailbox))),
    dedup_scan_enabled: input.dedupScanEnabled ?? current.dedupScanEnabled,
    auto_create_quarantine_requests: input.autoCreateQuarantineRequests ?? current.autoCreateQuarantineRequests,
    auto_create_destruction_reviews: input.autoCreateDestructionReviews ?? current.autoCreateDestructionReviews,
    auto_approve_low_risk: input.autoApproveLowRisk ?? current.autoApproveLowRisk,
    maximum_candidates_per_run: Math.max(10, Math.min(5000, num(input.maximumCandidatesPerRun, current.maximumCandidatesPerRun))),
    growth_alert_bytes_per_day: Math.max(0, num(input.growthAlertBytesPerDay, current.growthAlertBytesPerDay)),
    warning_free_bytes: Math.max(0, num(input.warningFreeBytes, current.warningFreeBytes)), critical_free_bytes: Math.max(0, num(input.criticalFreeBytes, current.criticalFreeBytes)),
    stale_provider_minutes: Math.max(15, num(input.staleProviderMinutes, current.staleProviderMinutes)), require_dry_run: input.requireDryRun ?? current.requireDryRun,
    updated_at: now(), updated_by: actor,
  }
  const { data, error } = await db.from("opsos_storage_lifecycle_policies").upsert(payload).select("*").single()
  if (error) throw error
  return policyFromRow(data)
}

export async function captureLifecycleSnapshot(operator = "system") {
  const bridge = await callWindowsBridgeAdmin<any>("/admin/storage/inventory?mode=summary&force=1", { method: "GET" }, { operator })
  if (!bridge.ok) throw new Error(bridge.errorMessage || "Windows storage inventory unavailable")
  const inventory = bridge.data || {}
  const disk = inventory.disk || {}
  const summary = inventory.summary || {}
  const emailStorage = inventory.emailStorage || {}
  const db = createEmailOSCoreDb()
  let latestProviderRows: AnyRow[] = []
  try {
    const providerResult = await db.from("opsos_storage_provider_reconciliation").select("mailbox_id,provider_message_count,reconciled_at").order("reconciled_at", { ascending: false }).limit(500)
    latestProviderRows = Array.isArray(providerResult.data) ? providerResult.data : []
  } catch {}
  const providerByMailbox = new Map<string, number>()
  for (const row of latestProviderRows) if (!providerByMailbox.has(clean(row.mailbox_id))) providerByMailbox.set(clean(row.mailbox_id), num(row.provider_message_count))
  const payload = {
    id: randomUUID(), total_bytes: num(disk.totalBytes), used_bytes: num(disk.usedBytes), free_bytes: num(disk.freeBytes),
    attachment_bytes: num(summary.attachmentBytes || emailStorage.totalBytes), duplicate_bytes: num(summary.duplicateRecoverableBytes || emailStorage.duplicateBytes || emailStorage.potentialDuplicateBytes),
    quarantine_bytes: num(summary.quarantineBytes || inventory.quarantineBytes), recoverable_bytes: num(summary.duplicateRecoverableBytes || emailStorage.potentialRecoverableBytes),
    mailbox_count: Array.isArray(emailStorage.mailboxes) ? emailStorage.mailboxes.length : num(emailStorage.mailboxCount),
    storage_file_count: num(summary.attachmentFileCount || emailStorage.fileCount || emailStorage.totalFiles || inventory.totalFiles), provider_message_count: [...providerByMailbox.values()].reduce((sum, value) => sum + value, 0), captured_at: now(), metadata: { operator, scanId: inventory.scanId || null, scanStatus: inventory.scanStatus || null },
  }
  const { data, error } = await db.from("opsos_storage_lifecycle_snapshots").insert(payload).select("*").single()
  if (error) throw error
  return snapshotFromRow(data)
}

export async function listSnapshots(limit = 720) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_lifecycle_snapshots").select("*").order("captured_at", { ascending: false }).limit(Math.max(2, Math.min(5000, limit)))
  if (error) throw error
  return (data || []).map(snapshotFromRow)
}

export function calculateForecast(snapshots: WindowsStorageLifecycleSnapshot[], thresholds?: { warningFreeBytes?: number; criticalFreeBytes?: number }): WindowsStorageForecast {
  const ordered = [...snapshots].sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
  if (ordered.length < 2) return { phase: 5, generatedAt: now(), sampleCount: ordered.length, averageGrowthBytesPerDay: 0, projectedWarningAt: null, projectedCriticalAt: null, projectedFullAt: null, daysToWarning: null, daysToCritical: null, daysToFull: null, confidence: "insufficient", trend: "unknown", points: ordered.map((item) => ({ timestamp: item.capturedAt, usedBytes: item.usedBytes, freeBytes: item.freeBytes })) }
  const first = ordered[0]
  const last = ordered.at(-1)!
  const elapsedDays = Math.max((new Date(last.capturedAt).getTime() - new Date(first.capturedAt).getTime()) / 86_400_000, 1 / 24)
  const averageGrowthBytesPerDay = (last.usedBytes - first.usedBytes) / elapsedDays
  const policyWarning = Math.max(0, num(thresholds?.warningFreeBytes, 25 * 1024 * 1024 * 1024))
  const policyCritical = Math.max(0, num(thresholds?.criticalFreeBytes, 10 * 1024 * 1024 * 1024))
  const daysFor = (targetFree: number) => averageGrowthBytesPerDay > 0 ? Math.max(0, (last.freeBytes - targetFree) / averageGrowthBytesPerDay) : null
  const toIso = (days: number | null) => days === null || !Number.isFinite(days) ? null : new Date(Date.now() + days * 86_400_000).toISOString()
  const daysToWarning = daysFor(policyWarning)
  const daysToCritical = daysFor(policyCritical)
  const daysToFull = daysFor(0)
  const absolute = Math.abs(averageGrowthBytesPerDay)
  return {
    phase: 5, generatedAt: now(), sampleCount: ordered.length, averageGrowthBytesPerDay,
    projectedWarningAt: toIso(daysToWarning), projectedCriticalAt: toIso(daysToCritical), projectedFullAt: toIso(daysToFull),
    daysToWarning, daysToCritical, daysToFull,
    confidence: ordered.length >= 90 ? "high" : ordered.length >= 24 ? "medium" : "low",
    trend: absolute < 10 * 1024 * 1024 ? "stable" : averageGrowthBytesPerDay > 0 ? "growing" : "shrinking",
    points: ordered.slice(-240).map((item) => ({ timestamp: item.capturedAt, usedBytes: item.usedBytes, freeBytes: item.freeBytes })),
  }
}

export async function getForecast() { const [snapshots, policy] = await Promise.all([listSnapshots(720).catch(() => []), getLifecyclePolicy().catch(() => defaultLifecyclePolicy())]); return calculateForecast(snapshots, { warningFreeBytes: policy.warningFreeBytes, criticalFreeBytes: policy.criticalFreeBytes }) }

export async function createLifecycleAlert(input: { alertType: string; severity: WindowsStorageLifecycleAlert["severity"]; title: string; message: string; source: string; evidence?: Record<string, unknown> }) {
  const db = createEmailOSCoreDb()
  const existing = await db.from("opsos_storage_lifecycle_alerts").select("id").eq("alert_type", input.alertType).eq("status", "open").limit(1).maybeSingle()
  if (existing.data?.id) return existing.data
  const payload = { id: randomUUID(), alert_type: input.alertType, severity: input.severity, title: input.title, message: input.message, status: "open", source: input.source, evidence: input.evidence || {}, created_at: now(), acknowledged_at: null, acknowledged_by: null, resolved_at: null }
  const { data, error } = await db.from("opsos_storage_lifecycle_alerts").insert(payload).select("*").single()
  if (error) throw error
  return alertFromRow(data)
}

export async function listLifecycleAlerts(limit = 200) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_lifecycle_alerts").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  return (data || []).map(alertFromRow)
}

export async function updateLifecycleAlert(alertId: string, action: "acknowledge" | "resolve", actor: string) {
  const db = createEmailOSCoreDb()
  const changes = action === "acknowledge" ? { status: "acknowledged", acknowledged_at: now(), acknowledged_by: actor } : { status: "resolved", resolved_at: now() }
  const { data, error } = await db.from("opsos_storage_lifecycle_alerts").update(changes).eq("id", alertId).select("*").single()
  if (error) throw error
  return alertFromRow(data)
}

async function queryLegalHolds() {
  const db = createEmailOSCoreDb()
  const { data } = await db.from("opsos_storage_legal_holds").select("file_id,object_reference,status").eq("status", "active").limit(5000)
  return Array.isArray(data) ? data : []
}

export async function scanExactDuplicates(limit = 5000): Promise<WindowsStorageDedupScan> {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("angelcare_storage_files").select("id,mailbox_id,entity_type,entity_id,original_filename,safe_filename,size_bytes,sha256_hash,storage_bucket,storage_key,status,metadata").not("sha256_hash", "is", null).in("status", ["active", "deduplicated"]).limit(Math.max(100, Math.min(20_000, limit)))
  if (error) throw error
  const holds = await queryLegalHolds().catch(() => [])
  const holdFiles = new Set(holds.map((item: any) => clean(item.file_id)).filter(Boolean))
  const grouped = new Map<string, AnyRow[]>()
  for (const row of data || []) {
    const hash = clean(row.sha256_hash).toLowerCase()
    if (!hash || num(row.size_bytes) <= 0) continue
    const rows = grouped.get(hash) || []
    rows.push(row)
    grouped.set(hash, rows)
  }
  const groups: WindowsStorageDedupGroup[] = []
  for (const [sha256, rows] of grouped) {
    if (rows.length < 2) continue
    const sizeBytes = num(rows[0]?.size_bytes)
    const copies = rows.map((row, index): WindowsStorageDedupCopy => ({
      fileId: clean(row.id) || null, sourceId: "email_attachments", relativePath: clean(row.storage_key), filename: clean(row.original_filename || row.safe_filename),
      mailboxId: clean(row.mailbox_id) || null, entityType: clean(row.entity_type) || null, entityId: clean(row.entity_id) || null,
      sizeBytes: num(row.size_bytes), sha256, canonical: index === 0, activeReferenceCount: clean(row.entity_id) ? 1 : 0,
      legalHold: holdFiles.has(clean(row.id)), status: clean(row.status) || "active",
    }))
    const blockedReasons: string[] = []
    if (copies.some((item) => item.legalHold)) blockedReasons.push("A legal hold protects at least one copy")
    if (copies.some((item) => !item.fileId || !item.relativePath)) blockedReasons.push("One or more copies lack a complete storage reference")
    groups.push({ sha256, sizeBytes, physicalCopies: copies.length, referenceCount: copies.reduce((sum, item) => sum + item.activeReferenceCount, 0), potentialRecoverableBytes: Math.max(0, (copies.length - 1) * sizeBytes), eligible: blockedReasons.length === 0, blockedReasons, copies })
  }
  groups.sort((a, b) => b.potentialRecoverableBytes - a.potentialRecoverableBytes)
  return { phase: 5, readOnly: true, groupCount: groups.length, physicalCopyCount: groups.reduce((sum, item) => sum + item.physicalCopies, 0), potentialRecoverableBytes: groups.reduce((sum, item) => sum + item.potentialRecoverableBytes, 0), blockedGroupCount: groups.filter((item) => !item.eligible).length, groups: groups.slice(0, 500), scannedAt: now() }
}

export async function createDedupPlan(group: WindowsStorageDedupGroup, reason: string, actor: string, preflight: Record<string, unknown> = {}) {
  if (!group.eligible) throw new Error(group.blockedReasons.join("; ") || "Duplicate group is blocked")
  if (clean(reason).length < 8) throw new Error("A detailed deduplication reason is required")
  const canonical = group.copies.find((item) => item.canonical) || group.copies[0]
  const db = createEmailOSCoreDb()
  const planId = randomUUID()
  const payload = { id: planId, plan_number: planNumber(), status: "awaiting_approval", sha256_hash: group.sha256, canonical_file_id: canonical.fileId, canonical_source_id: canonical.sourceId, canonical_relative_path: canonical.relativePath, size_bytes: group.sizeBytes, physical_copies: group.physicalCopies, reference_count: group.referenceCount, potential_recoverable_bytes: group.potentialRecoverableBytes, actual_recovered_bytes: 0, risk_level: group.referenceCount > 0 ? "controlled" : "low", reason: clean(reason), requested_by: actor, approved_by: null, executed_by: null, bridge_plan_token: null, preflight, result: {}, created_at: now(), updated_at: now(), completed_at: null }
  const { data, error } = await db.from("opsos_storage_dedup_plans").insert(payload).select("*").single()
  if (error) throw error
  const itemRows = group.copies.map((copy) => ({ id: randomUUID(), plan_id: planId, file_id: copy.fileId, source_id: copy.sourceId, relative_path: copy.relativePath, filename: copy.filename, mailbox_id: copy.mailboxId, entity_type: copy.entityType, entity_id: copy.entityId, size_bytes: copy.sizeBytes, sha256: copy.sha256, canonical: copy.canonical, active_reference_count: copy.activeReferenceCount, legal_hold: copy.legalHold, status: copy.status, snapshot: copy, created_at: now(), updated_at: now() }))
  const inserted = await db.from("opsos_storage_dedup_plan_items").insert(itemRows)
  if (inserted.error) throw inserted.error
  return dedupPlanFromRow(data, group.copies)
}

export async function listDedupPlans(limit = 200) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_dedup_plans").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  const plans = (data || []).map((row) => dedupPlanFromRow(row))
  if (!plans.length) return plans
  const { data: itemRows } = await db.from("opsos_storage_dedup_plan_items").select("*").in("plan_id", plans.map((item) => item.id)).order("canonical", { ascending: false })
  const grouped = new Map<string, WindowsStorageDedupCopy[]>()
  for (const row of itemRows || []) { const list = grouped.get(clean(row.plan_id)) || []; list.push(dedupCopyFromRow(row)); grouped.set(clean(row.plan_id), list) }
  return plans.map((plan) => ({ ...plan, copies: grouped.get(plan.id) || [] }))
}

export async function loadDedupPlan(planId: string) { return (await listDedupPlans(500)).find((item) => item.id === planId) || null }

export async function approveDedupPlan(planId: string, actor: string, reason: string) {
  const plan = await loadDedupPlan(planId)
  if (!plan) throw new Error("Deduplication plan not found")
  if (plan.requestedBy === actor) throw new Error("Independent approval is required")
  if (clean(reason).length < 8) throw new Error("Approval reason is required")
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_dedup_plans").update({ status: "approved", approved_by: actor, preflight: { ...(plan.preflight || {}), approvalReason: clean(reason), approvedAt: now() }, updated_at: now() }).eq("id", planId).eq("status", "awaiting_approval").select("*").single()
  if (error) throw error
  return dedupPlanFromRow(data, plan.copies)
}

export async function beginDedupPlanExecution(planId: string, actor: string) {
  const plan = await loadDedupPlan(planId)
  if (!plan) throw new Error("Deduplication plan not found")
  if (plan.status !== "approved") throw new Error("Deduplication plan requires independent approval")
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_dedup_plans").update({ status: "executing", executed_by: actor, updated_at: now() }).eq("id", planId).eq("status", "approved").select("*").single()
  if (error) throw error
  return dedupPlanFromRow(data, plan.copies)
}

export async function finalizeDedupPlan(planId: string, actor: string, bridgeResult: AnyRow) {
  const plan = await loadDedupPlan(planId)
  if (!plan) throw new Error("Deduplication plan not found")
  const db = createEmailOSCoreDb()
  const completed = bridgeResult.status === "completed" || bridgeResult.status === "completed_with_warnings"
  const changes = { status: completed ? bridgeResult.status : "failed", executed_by: actor, bridge_plan_token: clean(bridgeResult.planToken) || null, actual_recovered_bytes: num(bridgeResult.actualRecoveredBytes), result: bridgeResult, updated_at: now(), completed_at: completed ? now() : null }
  const { data, error } = await db.from("opsos_storage_dedup_plans").update(changes).eq("id", planId).select("*").single()
  if (error) throw error
  if (completed) {
    for (const copy of plan.copies) {
      if (!copy.fileId) continue
      await db.from("opsos_storage_dedup_references").upsert({ id: randomUUID(), plan_id: planId, file_id: copy.fileId, sha256_hash: plan.sha256, canonical_file_id: plan.canonicalFileId, canonical: copy.canonical, active: true, created_at: now(), updated_at: now() }, { onConflict: "file_id" })
      const file = await db.from("angelcare_storage_files").select("metadata").eq("id", copy.fileId).maybeSingle()
      const metadata = file.data?.metadata && typeof file.data.metadata === "object" ? file.data.metadata : {}
      await db.from("angelcare_storage_files").update({ status: "deduplicated", metadata: { ...metadata, deduplication: { planId, planNumber: plan.planNumber, sha256: plan.sha256, canonicalFileId: plan.canonicalFileId, canonical: copy.canonical, hardlinked: Boolean(bridgeResult.hardlinked), completedAt: now() } }, updated_at: now() }).eq("id", copy.fileId)
    }
  }
  return dedupPlanFromRow(data, plan.copies)
}

export async function recordDedupMaterialization(planId: string, fileId: string, actor: string, reason: string, bridgeResult: AnyRow) {
  const plan = await loadDedupPlan(planId)
  if (!plan) throw new Error("Deduplication plan not found")
  const copy = plan.copies.find((item) => item.fileId === fileId)
  if (!copy) throw new Error("Deduplicated file reference not found")
  if (copy.canonical) throw new Error("The canonical file does not require materialization")
  if (clean(reason).length < 8) throw new Error("A materialization reason is required")
  const db = createEmailOSCoreDb()
  await db.from("opsos_storage_dedup_references").update({ active: false, updated_at: now() }).eq("file_id", fileId)
  await db.from("opsos_storage_dedup_plan_items").update({ status: "materialized", updated_at: now() }).eq("plan_id", planId).eq("file_id", fileId)
  const currentFile = await db.from("angelcare_storage_files").select("metadata").eq("id", fileId).maybeSingle()
  const metadata = currentFile.data?.metadata && typeof currentFile.data.metadata === "object" ? currentFile.data.metadata : {}
  await db.from("angelcare_storage_files").update({ status: "active", metadata: { ...metadata, deduplication: { ...((metadata as AnyRow).deduplication || {}), active: false, materializedAt: now(), materializedBy: actor, materializationReason: clean(reason), bridgeResult } }, updated_at: now() }).eq("id", fileId)
  const materializations = Array.isArray((plan.result as AnyRow).materializations) ? (plan.result as AnyRow).materializations : []
  const result = { ...plan.result, materializations: [...materializations, { fileId, actor, reason: clean(reason), result: bridgeResult, completedAt: now() }] }
  const updated = await db.from("opsos_storage_dedup_plans").update({ result, updated_at: now() }).eq("id", planId).select("*").single()
  if (updated.error) throw updated.error
  return dedupPlanFromRow(updated.data, plan.copies.map((item) => item.fileId === fileId ? { ...item, status: "materialized" } : item))
}

async function resolveMailboxes(): Promise<ResolvedEmailOSMailbox[]> {
  const dbRows = await listEmailOSMultiMailboxesFromDb().catch(() => [])
  return dbRows.length ? dbRows : listEmailOSMultiMailboxes()
}
function mailboxPassword(mailbox: ResolvedEmailOSMailbox) { return clean(mailbox.password || mailbox.incoming.pass || mailbox.smtp?.pass || mailbox.credential?.passwordRef || "") }
function bridgeIncoming(mailbox: ResolvedEmailOSMailbox) { const host = clean(mailbox.incoming.host).toLowerCase(); const menara = host === "pop.menara.ma" || clean(mailbox.provider?.providerKey).toLowerCase().includes("menara"); return { protocol: "pop3" as const, host: menara ? "pop.menara.ma" : mailbox.incoming.host, port: menara ? 110 : mailbox.incoming.port, secure: menara ? false : mailbox.incoming.secure } }

export async function getProviderCapabilities(mailboxId: string, operator: string) {
  const mailboxes = await resolveMailboxes()
  const mailbox = mailboxes.find((item) => item.mailboxId === mailboxId || item.key === mailboxId || item.email.toLowerCase() === mailboxId.toLowerCase())
  if (!mailbox) throw new Error("Mailbox not found")
  const incoming = bridgeIncoming(mailbox)
  const result = await callWindowsBridgeAdmin<WindowsStorageProviderCapabilities>("/admin/storage/provider/capabilities", { method: "POST", body: JSON.stringify({ mailboxId: mailbox.mailboxId, email: mailbox.email, username: mailbox.incoming.user || mailbox.smtp.user || mailbox.email, password: mailboxPassword(mailbox), host: incoming.host, port: incoming.port, secure: incoming.secure }) }, { operator })
  if (!result.ok) throw new Error(result.errorMessage || "Provider capability check failed")
  return result.data
}

export async function reconcileProviderMailbox(mailboxId: string, operator: string) {
  const mailboxes = await resolveMailboxes()
  const mailbox = mailboxes.find((item) => item.mailboxId === mailboxId || item.key === mailboxId || item.email.toLowerCase() === mailboxId.toLowerCase())
  if (!mailbox) throw new Error("Mailbox not found")
  const incoming = bridgeIncoming(mailbox)
  const provider = await callWindowsBridgeAdmin<any>("/admin/storage/provider/reconcile", { method: "POST", body: JSON.stringify({ mailboxId: mailbox.mailboxId, email: mailbox.email, username: mailbox.incoming.user || mailbox.smtp.user || mailbox.email, password: mailboxPassword(mailbox), host: incoming.host, port: incoming.port, secure: incoming.secure }) }, { operator })
  if (!provider.ok) throw new Error(provider.errorMessage || "Provider reconciliation failed")
  const providerUids = new Set<string>((Array.isArray(provider.data?.uids) ? provider.data.uids : []).map((value: unknown) => clean(value)).filter((value: string) => Boolean(value)))
  const db = createEmailOSCoreDb()
  const { data } = await db.from("email_os_core_inbox").select("id,provider_uid,external_id,message_id").eq("mailbox_id", mailbox.mailboxId).limit(20_000)
  const localUids = new Set<string>((data || []).map((row: AnyRow) => clean(row.provider_uid || row.external_id)).filter((value): value is string => Boolean(value)))
  const providerOnlyUids = [...providerUids].filter((uid) => !localUids.has(uid)).slice(0, 500)
  const localOnlyUids = [...localUids].filter((uid) => !providerUids.has(uid)).slice(0, 500)
  const matchedCount = [...providerUids].filter((uid) => localUids.has(uid)).length
  const row = { id: randomUUID(), mailbox_id: mailbox.mailboxId, email: mailbox.email, provider_message_count: providerUids.size, local_message_count: localUids.size, provider_only_count: providerOnlyUids.length, local_only_count: localOnlyUids.length, matched_count: matchedCount, provider_only_uids: providerOnlyUids, local_only_uids: localOnlyUids, status: providerOnlyUids.length || localOnlyUids.length ? "drift" : "matched", detail: providerOnlyUids.length || localOnlyUids.length ? "Provider and Email OS require reconciliation." : "Provider and local Email OS identities are aligned.", reconciled_at: now(), metadata: { operator, totalProviderBytes: num(provider.data?.totalBytes) } }
  const inserted = await db.from("opsos_storage_provider_reconciliation").insert(row).select("*").single()
  if (inserted.error) throw inserted.error
  return reconciliationFromRow(inserted.data)
}

export async function runProviderSync(input: { mailboxId?: string | null; limit: number; actor: string }) {
  const db = createEmailOSCoreDb()
  const id = randomUUID()
  const runRow = { id, run_number: providerRunNumber(), mailbox_id: clean(input.mailboxId) || null, status: "running", requested_by: input.actor, mailbox_count: 0, fetched_count: 0, inserted_count: 0, updated_count: 0, skipped_count: 0, failed_count: 0, result: {}, created_at: now(), started_at: now(), completed_at: null, last_error: null }
  const start = await db.from("opsos_storage_provider_sync_runs").insert(runRow).select("*").single()
  if (start.error) throw start.error
  const mailboxes = (await resolveMailboxes()).filter((mailbox) => !input.mailboxId || [mailbox.mailboxId, mailbox.key, mailbox.email].some((value) => clean(value).toLowerCase() === clean(input.mailboxId).toLowerCase()))
  let fetchedCount = 0, insertedCount = 0, updatedCount = 0, skippedCount = 0, failedCount = 0
  const results: AnyRow[] = []
  for (const mailbox of mailboxes) {
    try {
      const incoming = bridgeIncoming(mailbox)
      const bridge = await fetchEmailOSInboundBridgeMessages({ mailboxId: mailbox.mailboxId, email: mailbox.email, username: mailbox.incoming.user || mailbox.smtp.user || mailbox.email, password: mailboxPassword(mailbox), incoming, limit: Math.max(1, Math.min(100, input.limit)) })
      const persisted = await persistEmailOSBridgeInboundMessages(mailbox, bridge.messages)
      fetchedCount += bridge.fetched; insertedCount += persisted.inserted; updatedCount += persisted.updated; skippedCount += bridge.skipped + persisted.skipped
      results.push({ mailboxId: mailbox.mailboxId, email: mailbox.email, ok: true, fetched: bridge.fetched, inserted: persisted.inserted, updated: persisted.updated, skipped: bridge.skipped + persisted.skipped })
    } catch (error) {
      failedCount += 1
      results.push({ mailboxId: mailbox.mailboxId, email: mailbox.email, ok: false, error: error instanceof Error ? error.message : "Provider sync failed" })
    }
  }
  const status = failedCount === mailboxes.length && mailboxes.length ? "failed" : failedCount ? "completed_with_warnings" : "completed"
  const changes = { status, mailbox_count: mailboxes.length, fetched_count: fetchedCount, inserted_count: insertedCount, updated_count: updatedCount, skipped_count: skippedCount, failed_count: failedCount, result: { results }, completed_at: now(), last_error: status === "failed" ? "All provider mailbox synchronizations failed" : null }
  const done = await db.from("opsos_storage_provider_sync_runs").update(changes).eq("id", id).select("*").single()
  if (done.error) throw done.error
  return providerRunFromRow(done.data)
}

export async function listProviderRuns(limit = 100) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_provider_sync_runs").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  return (data || []).map(providerRunFromRow)
}

export async function listProviderReconciliations(limit = 100) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_provider_reconciliation").select("*").order("reconciled_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  return (data || []).map(reconciliationFromRow)
}

export async function createLifecycleRun(input: { policy?: WindowsStorageLifecyclePolicy; actions?: WindowsStorageLifecycleAction[]; trigger?: WindowsStorageLifecycleRun["trigger"]; actor: string }) {
  const policy = input.policy || await getLifecyclePolicy().catch(() => defaultLifecyclePolicy())
  const actions = Array.isArray(input.actions) && input.actions.length ? input.actions : policy.actions
  const db = createEmailOSCoreDb()
  const row = { id: randomUUID(), run_number: runNumber(), policy_id: policy.id === "default" ? null : policy.id, trigger: input.trigger || "manual", status: "queued", actions, requested_by: input.actor, started_at: null, completed_at: null, paused_at: null, cancelled_at: null, scanned_count: 0, candidate_count: 0, recommended_recovery_bytes: 0, actual_recovered_bytes: 0, provider_mailbox_count: 0, provider_message_count: 0, warning_count: 0, error_count: 0, summary: {}, last_error: null, created_at: now(), updated_at: now() }
  const { data, error } = await db.from("opsos_storage_lifecycle_runs").insert(row).select("*").single()
  if (error) throw error
  return runFromRow(data)
}

async function insertRunItem(runId: string, action: WindowsStorageLifecycleAction, input: Partial<WindowsStorageLifecycleRunItem>) {
  const db = createEmailOSCoreDb()
  const row = { id: randomUUID(), run_id: runId, action, status: input.status || "completed", object_reference: input.objectReference || null, source_id: input.sourceId || null, mailbox_id: input.mailboxId || null, size_bytes: num(input.sizeBytes), recommended_action: input.recommendedAction || null, risk_level: input.riskLevel || null, result: input.result || {}, created_at: now(), updated_at: now() }
  const { data, error } = await db.from("opsos_storage_lifecycle_run_items").insert(row).select("*").single()
  if (error) throw error
  return runItemFromRow(data)
}

export async function executeLifecycleRun(runId: string, actor: string) {
  const db = createEmailOSCoreDb()
  const currentRow = await db.from("opsos_storage_lifecycle_runs").select("*").eq("id", runId).single()
  if (currentRow.error) throw currentRow.error
  const current = runFromRow(currentRow.data)
  if (!["queued", "paused", "failed"].includes(current.status)) throw new Error(`Run cannot execute from status ${current.status}`)
  await db.from("opsos_storage_lifecycle_runs").update({ status: "running", started_at: current.startedAt || now(), paused_at: null, last_error: null, updated_at: now() }).eq("id", runId)
  let snapshot: WindowsStorageLifecycleSnapshot | null = null
  let forecast: WindowsStorageForecast | null = null
  let dedup: WindowsStorageDedupScan | null = null
  let providerRun: WindowsStorageProviderSyncRun | null = null
  const warnings: string[] = []
  const errors: string[] = []
  let scannedCount = 0, candidateCount = 0, recommendedRecoveryBytes = 0, providerMailboxCount = 0, providerMessageCount = 0
  for (const action of current.actions) {
    try {
      if (action === "inventory") {
        snapshot = await captureLifecycleSnapshot(actor); scannedCount += snapshot.storageFileCount
        await insertRunItem(runId, action, { status: "completed", sizeBytes: snapshot.usedBytes, result: { ...snapshot } })
      } else if (action === "forecast") {
        forecast = await getForecast(); await insertRunItem(runId, action, { status: "completed", result: { ...forecast } })
      } else if (action === "dedup_scan") {
        dedup = await scanExactDuplicates(); candidateCount += dedup.groupCount; recommendedRecoveryBytes += dedup.potentialRecoverableBytes
        await insertRunItem(runId, action, { status: dedup.blockedGroupCount ? "completed_with_warnings" : "completed", sizeBytes: dedup.potentialRecoverableBytes, recommendedAction: "Review exact duplicate groups and create independently approved consolidation plans.", riskLevel: dedup.blockedGroupCount ? "controlled" : "low", result: { groupCount: dedup.groupCount, blockedGroupCount: dedup.blockedGroupCount, potentialRecoverableBytes: dedup.potentialRecoverableBytes } })
      } else if (action === "provider_sync") {
        providerRun = await runProviderSync({ limit: (await getLifecyclePolicy().catch(() => defaultLifecyclePolicy())).providerSyncLimitPerMailbox, actor }); providerMailboxCount += providerRun.mailboxCount; providerMessageCount += providerRun.fetchedCount
        await insertRunItem(runId, action, { status: providerRun.status, result: { ...providerRun } })
      } else if (action === "provider_reconcile") {
        const mailboxes = await resolveMailboxes(); let drift = 0
        for (const mailbox of mailboxes.slice(0, 50)) { try { const rec = await reconcileProviderMailbox(mailbox.mailboxId, actor); if (rec.status !== "matched") drift += 1 } catch (error) { warnings.push(`${mailbox.email}: ${error instanceof Error ? error.message : "reconciliation failed"}`) } }
        await insertRunItem(runId, action, { status: warnings.length ? "completed_with_warnings" : "completed", recommendedAction: drift ? "Review provider/local drift before retention decisions." : null, result: { mailboxCount: mailboxes.length, driftCount: drift } })
      } else if (action === "retention_dry_run") {
        const policies = await listRetentionPolicies(); const results = []
        for (const policy of policies.filter((item) => item.enabled).slice(0, 30)) results.push(await simulateRetentionPolicy(policy.id))
        candidateCount += results.reduce((sum, item) => sum + item.matchedCount, 0); recommendedRecoveryBytes += results.reduce((sum, item) => sum + item.matchedBytes, 0)
        await insertRunItem(runId, action, { status: "completed", sizeBytes: results.reduce((sum, item) => sum + item.matchedBytes, 0), recommendedAction: "Use Phase 3 and Phase 4 governed workflows for eligible results.", result: { policies: results } })
      } else if (action === "cleanup_dry_run") {
        const profiles = await listCleanupProfiles(); await insertRunItem(runId, action, { status: "completed", result: { profiles, dryRunOnly: true } })
      } else {
        await insertRunItem(runId, action, { status: "blocked", recommendedAction: "This action requires a governed Phase 3 or Phase 4 approval workflow.", riskLevel: "blocked", result: { automatedDestructiveExecution: false } })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `${action} failed`
      errors.push(`${action}: ${message}`)
      await insertRunItem(runId, action, { status: "failed", result: { error: message } }).catch(() => null)
    }
  }
  const policy = await getLifecyclePolicy().catch(() => defaultLifecyclePolicy())
  if (snapshot && snapshot.freeBytes <= policy.criticalFreeBytes) await createLifecycleAlert({ alertType: "disk_critical", severity: "critical", title: "Capacité disque critique", message: `Seulement ${snapshot.freeBytes} octets restent disponibles sur le nœud Windows.`, source: "windows_storage", evidence: { ...snapshot } }).catch(() => null)
  else if (snapshot && snapshot.freeBytes <= policy.warningFreeBytes) await createLifecycleAlert({ alertType: "disk_warning", severity: "high", title: "Capacité disque sous le seuil d’alerte", message: `Le stockage libre est inférieur au seuil configuré.`, source: "windows_storage", evidence: { ...snapshot } }).catch(() => null)
  if (forecast && forecast.averageGrowthBytesPerDay > policy.growthAlertBytesPerDay) await createLifecycleAlert({ alertType: "growth_anomaly", severity: "high", title: "Croissance de stockage anormale", message: "Le rythme de croissance quotidien dépasse le seuil configuré.", source: "forecast", evidence: { ...forecast } }).catch(() => null)
  if (dedup && dedup.potentialRecoverableBytes > 1024 * 1024 * 1024) await createLifecycleAlert({ alertType: "dedup_opportunity", severity: "medium", title: "Potentiel important de déduplication", message: "Plus d’un gigaoctet pourrait être récupéré après consolidation gouvernée.", source: "dedup", evidence: { bytes: dedup.potentialRecoverableBytes, groups: dedup.groupCount } }).catch(() => null)
  const status: WindowsStorageLifecycleRunStatus = errors.length && errors.length === current.actions.length ? "failed" : errors.length || warnings.length ? "completed_with_warnings" : "completed"
  const changes = { status, completed_at: now(), scanned_count: scannedCount, candidate_count: candidateCount, recommended_recovery_bytes: recommendedRecoveryBytes, provider_mailbox_count: providerMailboxCount, provider_message_count: providerMessageCount, warning_count: warnings.length, error_count: errors.length, summary: { snapshot, forecast, dedup: dedup ? { groupCount: dedup.groupCount, potentialRecoverableBytes: dedup.potentialRecoverableBytes } : null, providerRun, warnings, errors, automationBoundary: "No quarantine or permanent destruction bypassed Phase 3/4 approval gates." }, last_error: errors.join(" | ") || null, updated_at: now() }
  const done = await db.from("opsos_storage_lifecycle_runs").update(changes).eq("id", runId).select("*").single()
  if (done.error) throw done.error
  return runFromRow(done.data)
}

export async function updateLifecycleRunState(runId: string, action: "pause" | "resume" | "cancel", actor: string) {
  const db = createEmailOSCoreDb()
  const row = await db.from("opsos_storage_lifecycle_runs").select("*").eq("id", runId).single()
  if (row.error) throw row.error
  const current = runFromRow(row.data)
  if (action === "pause" && current.status !== "running") throw new Error("Only a running lifecycle job can be paused")
  if (action === "resume" && current.status !== "paused") throw new Error("Only a paused lifecycle job can be resumed")
  if (action === "cancel" && !["queued", "running", "paused"].includes(current.status)) throw new Error("This lifecycle job can no longer be cancelled")
  const changes = action === "pause" ? { status: "paused", paused_at: now(), updated_at: now(), summary: { ...current.summary, pausedBy: actor } } : action === "resume" ? { status: "queued", paused_at: null, updated_at: now(), summary: { ...current.summary, resumedBy: actor } } : { status: "cancelled", cancelled_at: now(), completed_at: now(), updated_at: now(), summary: { ...current.summary, cancelledBy: actor } }
  const updated = await db.from("opsos_storage_lifecycle_runs").update(changes).eq("id", runId).select("*").single()
  if (updated.error) throw updated.error
  return runFromRow(updated.data)
}

export async function listLifecycleRuns(limit = 100) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from("opsos_storage_lifecycle_runs").select("*").order("created_at", { ascending: false }).limit(Math.max(1, Math.min(500, limit)))
  if (error) throw error
  const runs = (data || []).map((row) => runFromRow(row))
  if (!runs.length) return runs
  const { data: itemRows } = await db.from("opsos_storage_lifecycle_run_items").select("*").in("run_id", runs.map((item) => item.id)).order("created_at", { ascending: true })
  const grouped = new Map<string, WindowsStorageLifecycleRunItem[]>()
  for (const row of itemRows || []) { const list = grouped.get(clean(row.run_id)) || []; list.push(runItemFromRow(row)); grouped.set(clean(row.run_id), list) }
  return runs.map((run) => ({ ...run, items: grouped.get(run.id) || [] }))
}

export async function listLifecycleRegistry(): Promise<WindowsStorageLifecycleRegistry> {
  const [policy, snapshots, forecast, runs, alerts, dedupPlans, providerRuns, reconciliations] = await Promise.all([
    getLifecyclePolicy().catch(() => defaultLifecyclePolicy()), listSnapshots(1).catch(() => []), getForecast(), listLifecycleRuns(100).catch(() => []),
    listLifecycleAlerts(200).catch(() => []), listDedupPlans(200).catch(() => []), listProviderRuns(100).catch(() => []), listProviderReconciliations(100).catch(() => []),
  ])
  return { phase: 5, automationSafe: true, policy, latestSnapshot: snapshots[0] || null, forecast, runs, alerts, dedupPlans, providerRuns, reconciliations, openAlertCount: alerts.filter((item) => item.status === "open").length, runningRunCount: runs.filter((item) => ["queued", "running", "paused"].includes(item.status)).length, pendingDedupPlanCount: dedupPlans.filter((item) => ["awaiting_approval", "approved", "executing"].includes(item.status)).length, potentialDedupRecoveryBytes: dedupPlans.filter((item) => !["completed", "cancelled"].includes(item.status)).reduce((sum, item) => sum + item.potentialRecoverableBytes, 0), queriedAt: now() }
}

export async function listProviderMailboxOptions() {
  const mailboxes = await resolveMailboxes()
  return mailboxes.map((mailbox) => ({ mailboxId: mailbox.mailboxId, key: mailbox.key, email: mailbox.email, name: clean(mailbox.label || mailbox.key || mailbox.email), provider: clean(mailbox.provider?.providerKey || mailbox.incoming.protocol || "pop3") }))
}
