import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolIntakePayload = Record<string, unknown>

type IntakeWiringKey =
  | 'ac360.school_intake.form.upsert'
  | 'ac360.school_intake.form.publish'
  | 'ac360.school_intake.submission.create'
  | 'ac360.school_intake.submission.status'
  | 'ac360.school_intake.lead_capture.process'
  | 'ac360.school_intake.parent_request.create'
  | 'ac360.school_intake.parent_request.status'
  | 'ac360.school_intake.external_source.upsert'
  | 'ac360.school_intake.mapping.upsert'
  | 'ac360.school_intake.reconcile'
  | 'ac360.school_intake.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeIntakeRpc(
  wiringKey: IntakeWiringKey,
  body: Ac360SchoolIntakePayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.formId || body.form_id || body.submissionId || body.submission_id || body.parentRequestId || body.parent_request_id || body.sourceId || body.source_id || body.mappingId || body.mapping_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 intake RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-intake',
      phase: 'phase_2o_public_forms_lead_capture_parent_requests_external_intake',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked intake action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolIntakeDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_intake_dashboard', { p_org_id: resolved.orgId, p_as_of_date: asOfDate || null } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 intake dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360IntakeForm(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.form.upsert', body, 'ac360_school_upsert_intake_form', {
    p_form_id: body.formId || body.form_id || null,
    p_form_key: body.formKey || body.form_key || null,
    p_title: body.title || body.label || null,
    p_form_type: text(body.formType || body.form_type, 'admission'),
    p_audience_type: text(body.audienceType || body.audience_type, 'parents'),
    p_public_slug: body.publicSlug || body.public_slug || null,
    p_language: text(body.language, 'fr'),
    p_intro_text: body.introText || body.intro_text || null,
    p_success_message: body.successMessage || body.success_message || null,
    p_settings_json: body.settingsJson || body.settings_json || body.settings || {},
    p_fields_json: body.fieldsJson || body.fields_json || body.fields || [],
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'form.upsert' })
}

export async function publishAc360IntakeForm(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.form.publish', body, 'ac360_school_publish_intake_form', {
    p_form_id: body.formId || body.form_id,
    p_status: text(body.status, 'published'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'form.publish' })
}

export async function createAc360IntakeSubmission(body: Ac360SchoolIntakePayload) {
  return executeIntakeRpc('ac360.school_intake.submission.create', body, 'ac360_school_create_intake_submission', {
    p_form_id: body.formId || body.form_id || null,
    p_source_id: body.sourceId || body.source_id || null,
    p_submission_key: body.submissionKey || body.submission_key || null,
    p_submission_type: text(body.submissionType || body.submission_type, 'form'),
    p_parent_name: body.parentName || body.parent_name || null,
    p_parent_phone: body.parentPhone || body.parent_phone || null,
    p_parent_email: body.parentEmail || body.parent_email || null,
    p_child_name: body.childName || body.child_name || null,
    p_payload_json: body.payloadJson || body.payload_json || body.payload || {},
    p_normalized_json: body.normalizedJson || body.normalized_json || body.normalized || {},
    p_consent_json: body.consentJson || body.consent_json || body.consent || {},
    p_ip_address: body.ipAddress || body.ip_address || null,
    p_user_agent: body.userAgent || body.user_agent || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'submission.create' })
}

export async function updateAc360IntakeSubmissionStatus(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.submission.status', body, 'ac360_school_update_intake_submission_status', {
    p_submission_id: body.submissionId || body.submission_id,
    p_status: text(body.status, 'validated'),
    p_linked_entity_type: body.linkedEntityType || body.linked_entity_type || null,
    p_linked_entity_id: body.linkedEntityId || body.linked_entity_id || null,
    p_actor_app_user_id: actorId,
    p_note: body.note || body.message || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'submission.status' })
}

export async function processAc360LeadCapture(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.lead_capture.process', body, 'ac360_school_process_lead_capture', {
    p_submission_id: body.submissionId || body.submission_id,
    p_mapping_id: body.mappingId || body.mapping_id || null,
    p_action_taken: text(body.actionTaken || body.action_taken, 'captured'),
    p_target_entity_type: body.targetEntityType || body.target_entity_type || null,
    p_target_entity_id: body.targetEntityId || body.target_entity_id || null,
    p_actor_app_user_id: actorId,
    p_result_json: body.resultJson || body.result_json || body.result || {},
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'lead_capture.process' })
}

export async function createAc360ParentRequest(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.parent_request.create', body, 'ac360_school_create_parent_request', {
    p_submission_id: body.submissionId || body.submission_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_request_key: body.requestKey || body.request_key || null,
    p_request_type: text(body.requestType || body.request_type, 'general'),
    p_title: body.title || body.label || null,
    p_description: body.description || body.note || null,
    p_priority: text(body.priority, 'medium'),
    p_due_at: body.dueAt || body.due_at || null,
    p_assigned_to: body.assignedTo || body.assigned_to || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'parent_request.create' })
}

export async function updateAc360ParentRequestStatus(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.parent_request.status', body, 'ac360_school_update_parent_request_status', {
    p_request_id: body.parentRequestId || body.parent_request_id || body.requestId || body.request_id,
    p_status: text(body.status, 'in_review'),
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'parent_request.status' })
}

export async function upsertAc360ExternalIntakeSource(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.external_source.upsert', body, 'ac360_school_upsert_external_intake_source', {
    p_source_id: body.sourceId || body.source_id || null,
    p_source_key: body.sourceKey || body.source_key || null,
    p_label: body.label || body.title || null,
    p_source_type: text(body.sourceType || body.source_type, 'website'),
    p_allowed_origins: body.allowedOrigins || body.allowed_origins || [],
    p_mapping_json: body.mappingJson || body.mapping_json || {},
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'external_source.upsert' })
}

export async function upsertAc360IntakeMapping(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.mapping.upsert', body, 'ac360_school_upsert_intake_mapping', {
    p_mapping_id: body.mappingId || body.mapping_id || null,
    p_source_id: body.sourceId || body.source_id || null,
    p_form_id: body.formId || body.form_id || null,
    p_mapping_key: body.mappingKey || body.mapping_key || null,
    p_target_module: text(body.targetModule || body.target_module, 'admissions'),
    p_target_action: text(body.targetAction || body.target_action, 'lead_create'),
    p_field_map_json: body.fieldMapJson || body.field_map_json || body.fieldMap || {},
    p_default_values_json: body.defaultValuesJson || body.default_values_json || body.defaultValues || {},
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'mapping.upsert' })
}

export async function reconcileAc360SchoolIntake(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.reconcile', body, 'ac360_school_reconcile_intake', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'reconcile' })
}

export async function resolveAc360IntakeAlert(body: Ac360SchoolIntakePayload) {
  const actorId = await currentActorId()
  return executeIntakeRpc('ac360.school_intake.alert.resolve', body, 'ac360_school_resolve_intake_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { intakeAction: 'alert.resolve' })
}
