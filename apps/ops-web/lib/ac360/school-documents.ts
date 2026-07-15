import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, estimateStorageGbFromBytes, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolDocumentPayload = Record<string, unknown>

type DocumentWiringKey =
  | 'ac360.school_documents.document.register'
  | 'ac360.school_documents.document.version'
  | 'ac360.school_documents.document.archive'
  | 'ac360.school_documents.review.request'
  | 'ac360.school_documents.review.decide'
  | 'ac360.school_documents.access.record'
  | 'ac360.school_documents.report_template.upsert'
  | 'ac360.school_documents.report_job.queue'
  | 'ac360.school_documents.report_artifact.record'
  | 'ac360.school_documents.export.queue'
  | 'ac360.school_documents.export.ready'
  | 'ac360.school_documents.storage.reconcile'
  | 'ac360.school_documents.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 1) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeDocumentsRpc(
  wiringKey: DocumentWiringKey,
  body: Ac360SchoolDocumentPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.documentId || body.document_id || body.documentCode || body.document_code || body.reportJobId || body.report_job_id || body.exportJobId || body.export_job_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 documents RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-documents',
      phase: 'phase_2f_documents_reports_storage_exports',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked document/report/storage action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolDocumentsDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_documents_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 documents dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function registerAc360SchoolDocument(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  const bytes = num(body.fileSizeBytes || body.file_size_bytes || body.sizeBytes || body.size_bytes, 0)
  return executeDocumentsRpc('ac360.school_documents.document.register', body, 'ac360_school_register_document', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_folder_id: body.folderId || body.folder_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id || null,
    p_document_code: body.documentCode || body.document_code || null,
    p_document_type: text(body.documentType || body.document_type, 'general'),
    p_title: body.title || body.label || null,
    p_file_name: body.fileName || body.file_name || null,
    p_file_path: body.filePath || body.file_path || null,
    p_file_size_bytes: bytes,
    p_mime_type: body.mimeType || body.mime_type || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'document.register', fileSizeBytes: bytes }, estimateStorageGbFromBytes(bytes))
}

export async function createAc360DocumentVersion(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  const bytes = num(body.fileSizeBytes || body.file_size_bytes || body.sizeBytes || body.size_bytes, 0)
  return executeDocumentsRpc('ac360.school_documents.document.version', body, 'ac360_school_create_document_version', {
    p_document_id: body.documentId || body.document_id,
    p_file_name: body.fileName || body.file_name || null,
    p_file_path: body.filePath || body.file_path || null,
    p_file_size_bytes: bytes,
    p_mime_type: body.mimeType || body.mime_type || null,
    p_checksum: body.checksum || null,
    p_change_note: body.changeNote || body.change_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'document.version', fileSizeBytes: bytes }, estimateStorageGbFromBytes(bytes))
}

export async function archiveAc360SchoolDocument(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.document.archive', body, 'ac360_school_archive_document', {
    p_document_id: body.documentId || body.document_id,
    p_reason: body.reason || body.archiveReason || body.archive_reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'document.archive', archiveNotDelete: true })
}

export async function requestAc360DocumentReview(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.review.request', body, 'ac360_school_request_document_review', {
    p_document_id: body.documentId || body.document_id,
    p_review_type: text(body.reviewType || body.review_type, 'approval'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'review.request' })
}

export async function decideAc360DocumentReview(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.review.decide', body, 'ac360_school_decide_document_review', {
    p_review_id: body.reviewId || body.review_id,
    p_decision: body.decision || body.status,
    p_decision_note: body.decisionNote || body.decision_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'review.decide' })
}

export async function recordAc360DocumentAccess(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.access.record', body, 'ac360_school_record_document_access', {
    p_document_id: body.documentId || body.document_id,
    p_access_type: text(body.accessType || body.access_type, 'view'),
    p_actor_app_user_id: actorId,
    p_result: text(body.result, 'success'),
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'access.record' })
}

export async function upsertAc360ReportTemplate(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.report_template.upsert', body, 'ac360_school_upsert_report_template', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_label: body.label || body.title || null,
    p_report_type: text(body.reportType || body.report_type, 'standard'),
    p_output_format: text(body.outputFormat || body.output_format, 'pdf'),
    p_data_scope: text(body.dataScope || body.data_scope, 'organization'),
    p_template_json: cleanMetadata(body.templateJson || body.template_json || body.template || {}),
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'report_template.upsert' })
}

export async function queueAc360ReportJob(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.report_job.queue', body, 'ac360_school_queue_report_job', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_report_code: body.reportCode || body.report_code || null,
    p_report_type: text(body.reportType || body.report_type, 'standard'),
    p_title: body.title || body.label || null,
    p_period_start: body.periodStart || body.period_start || null,
    p_period_end: body.periodEnd || body.period_end || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'report.queue' })
}

export async function recordAc360ReportArtifact(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  const bytes = num(body.fileSizeBytes || body.file_size_bytes || body.sizeBytes || body.size_bytes, 0)
  return executeDocumentsRpc('ac360.school_documents.report_artifact.record', body, 'ac360_school_record_report_artifact', {
    p_report_job_id: body.reportJobId || body.report_job_id,
    p_artifact_code: body.artifactCode || body.artifact_code || null,
    p_artifact_type: text(body.artifactType || body.artifact_type, 'report_pdf'),
    p_output_format: text(body.outputFormat || body.output_format, 'pdf'),
    p_file_name: body.fileName || body.file_name || null,
    p_file_path: body.filePath || body.file_path || null,
    p_file_size_bytes: bytes,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'report.artifact', fileSizeBytes: bytes })
}

export async function queueAc360ExportJob(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.export.queue', body, 'ac360_school_queue_export_job', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_export_code: body.exportCode || body.export_code || null,
    p_export_type: text(body.exportType || body.export_type, 'data_export'),
    p_data_scope: text(body.dataScope || body.data_scope, 'organization'),
    p_output_format: text(body.outputFormat || body.output_format, 'xlsx'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'export.queue' })
}

export async function markAc360ExportReady(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  const bytes = num(body.fileSizeBytes || body.file_size_bytes || body.sizeBytes || body.size_bytes, 0)
  return executeDocumentsRpc('ac360.school_documents.export.ready', body, 'ac360_school_mark_export_ready', {
    p_export_job_id: body.exportJobId || body.export_job_id,
    p_output_path: body.outputPath || body.output_path || null,
    p_file_size_bytes: bytes,
    p_row_count: num(body.rowCount || body.row_count, 0),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'export.ready', fileSizeBytes: bytes })
}

export async function reconcileAc360SchoolStorage(body: Ac360SchoolDocumentPayload) {
  return executeDocumentsRpc('ac360.school_documents.storage.reconcile', body, 'ac360_school_reconcile_storage', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_source_key: text(body.sourceKey || body.source_key, 'manual_reconcile'),
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'storage.reconcile' })
}

export async function resolveAc360DocumentAlert(body: Ac360SchoolDocumentPayload) {
  const actorId = await currentActorId()
  return executeDocumentsRpc('ac360.school_documents.alert.resolve', body, 'ac360_school_resolve_document_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { documentAction: 'alert.resolve' })
}
