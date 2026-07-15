import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolAdmissionsPayload = Record<string, unknown>

type AdmissionsWiringKey =
  | 'ac360.school_admissions.pipeline.ensure'
  | 'ac360.school_admissions.lead.create'
  | 'ac360.school_admissions.lead.stage'
  | 'ac360.school_admissions.guardian.link'
  | 'ac360.school_admissions.visit.schedule'
  | 'ac360.school_admissions.visit.complete'
  | 'ac360.school_admissions.followup.create'
  | 'ac360.school_admissions.followup.complete'
  | 'ac360.school_admissions.offer.generate'
  | 'ac360.school_admissions.offer.decide'
  | 'ac360.school_admissions.application.create'
  | 'ac360.school_admissions.convert'
  | 'ac360.school_admissions.import_batch.create'
  | 'ac360.school_admissions.duplicate_scan'
  | 'ac360.school_admissions.reconcile'
  | 'ac360.school_admissions.alert.resolve'

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

async function executeAdmissionsRpc(
  wiringKey: AdmissionsWiringKey,
  body: Ac360SchoolAdmissionsPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.leadId || body.lead_id || body.visitId || body.visit_id || body.followupId || body.followup_id || body.offerId || body.offer_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 admissions RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey as any, idSeed),
    metadata: {
      source: 'lib.ac360.school-admissions',
      phase: 'phase_2h_admissions_crm_leads_visits_conversion',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked admissions action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolAdmissionsDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_admissions_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 admissions dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function ensureAc360AdmissionsPipeline(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.pipeline.ensure', body, 'ac360_school_ensure_admissions_pipeline', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'pipeline.ensure' })
}

export async function createAc360AdmissionLead(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.lead.create', body, 'ac360_school_create_admission_lead', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_child_first_name: body.childFirstName || body.child_first_name || body.firstName || body.first_name || null,
    p_child_last_name: body.childLastName || body.child_last_name || body.lastName || body.last_name || null,
    p_date_of_birth: body.dateOfBirth || body.date_of_birth || null,
    p_desired_start_date: body.desiredStartDate || body.desired_start_date || null,
    p_desired_level: body.desiredLevel || body.desired_level || null,
    p_parent_name: body.parentName || body.parent_name || null,
    p_parent_phone: body.parentPhone || body.parent_phone || body.phone || null,
    p_parent_email: body.parentEmail || body.parent_email || body.email || null,
    p_preferred_channel: text(body.preferredChannel || body.preferred_channel, 'whatsapp'),
    p_source_key: text(body.sourceKey || body.source_key, 'manual'),
    p_priority: text(body.priority, 'medium'),
    p_score: num(body.score, 0),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'lead.create' })
}

export async function updateAc360AdmissionLeadStage(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.lead.stage', body, 'ac360_school_update_admission_stage', {
    p_lead_id: body.leadId || body.lead_id,
    p_stage_key: body.stageKey || body.stage_key || body.stage || null,
    p_lead_status: body.leadStatus || body.lead_status || null,
    p_reason: body.reason || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'lead.stage' })
}

export async function linkAc360AdmissionGuardian(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.guardian.link', body, 'ac360_school_link_admission_guardian', {
    p_lead_id: body.leadId || body.lead_id,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_guardian_name: body.guardianName || body.guardian_name || body.name || null,
    p_relationship: text(body.relationship, 'parent'),
    p_phone: body.phone || body.parentPhone || body.parent_phone || null,
    p_email: body.email || body.parentEmail || body.parent_email || null,
    p_is_primary: Boolean(body.isPrimary || body.is_primary),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'guardian.link' })
}

export async function scheduleAc360AdmissionVisit(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.visit.schedule', body, 'ac360_school_schedule_admission_visit', {
    p_lead_id: body.leadId || body.lead_id,
    p_campus_id: body.campusId || body.campus_id || null,
    p_scheduled_at: body.scheduledAt || body.scheduled_at || null,
    p_visit_type: text(body.visitType || body.visit_type, 'school_visit'),
    p_assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'visit.schedule' })
}

export async function completeAc360AdmissionVisit(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.visit.complete', body, 'ac360_school_complete_admission_visit', {
    p_visit_id: body.visitId || body.visit_id,
    p_status: text(body.status, 'completed'),
    p_outcome: body.outcome || null,
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'visit.complete' })
}

export async function createAc360AdmissionFollowup(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.followup.create', body, 'ac360_school_create_admission_followup', {
    p_lead_id: body.leadId || body.lead_id,
    p_due_at: body.dueAt || body.due_at || null,
    p_followup_type: text(body.followupType || body.followup_type, 'call'),
    p_assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    p_next_action: body.nextAction || body.next_action || null,
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'followup.create' })
}

export async function completeAc360AdmissionFollowup(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.followup.complete', body, 'ac360_school_complete_admission_followup', {
    p_followup_id: body.followupId || body.followup_id,
    p_outcome: body.outcome || null,
    p_next_action: body.nextAction || body.next_action || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'followup.complete' })
}

export async function generateAc360AdmissionOffer(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.offer.generate', body, 'ac360_school_generate_admission_offer', {
    p_lead_id: body.leadId || body.lead_id,
    p_offer_type: text(body.offerType || body.offer_type, 'standard'),
    p_registration_fee_mad: num(body.registrationFeeMad || body.registration_fee_mad, 0),
    p_tuition_monthly_mad: num(body.tuitionMonthlyMad || body.tuition_monthly_mad, 0),
    p_discount_mad: num(body.discountMad || body.discount_mad, 0),
    p_valid_until: body.validUntil || body.valid_until || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'offer.generate' })
}

export async function decideAc360AdmissionOffer(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.offer.decide', body, 'ac360_school_decide_admission_offer', {
    p_offer_id: body.offerId || body.offer_id,
    p_decision: body.decision || body.status,
    p_decision_note: body.decisionNote || body.decision_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'offer.decide' })
}

export async function createAc360EnrollmentApplication(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  const docs = Array.isArray(body.missingDocuments || body.missing_documents) ? (body.missingDocuments || body.missing_documents) as string[] : []
  return executeAdmissionsRpc('ac360.school_admissions.application.create', body, 'ac360_school_create_enrollment_application', {
    p_lead_id: body.leadId || body.lead_id,
    p_offer_id: body.offerId || body.offer_id || null,
    p_status: text(body.status, 'submitted'),
    p_missing_documents: docs,
    p_review_note: body.reviewNote || body.review_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'application.create' })
}

export async function convertAc360AdmissionToStudent(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.convert', body, 'ac360_school_convert_admission_to_student', {
    p_lead_id: body.leadId || body.lead_id,
    p_class_id: body.classId || body.class_id || null,
    p_academic_year_id: body.academicYearId || body.academic_year_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'convert_to_student' })
}

export async function createAc360AdmissionImportBatch(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.import_batch.create', body, 'ac360_school_create_admission_import_batch', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_source_label: body.sourceLabel || body.source_label || null,
    p_total_rows: num(body.totalRows || body.total_rows, 0),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'import_batch.create' }, Math.max(1, num(body.totalRows || body.total_rows, 1)))
}

export async function scanAc360AdmissionDuplicates(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.duplicate_scan', body, 'ac360_school_scan_admission_duplicates', {
    p_lead_id: body.leadId || body.lead_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'duplicate_scan' })
}

export async function reconcileAc360Admissions(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.reconcile', body, 'ac360_school_reconcile_admissions', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'reconcile' })
}

export async function resolveAc360AdmissionAlert(body: Ac360SchoolAdmissionsPayload) {
  const actorId = await currentActorId()
  return executeAdmissionsRpc('ac360.school_admissions.alert.resolve', body, 'ac360_school_resolve_admission_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { admissionsAction: 'alert.resolve' })
}
