import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolParentTrustPayload = Record<string, unknown>

type ParentTrustWiringKey =
  | 'ac360.school_parenttrust.survey_template.upsert'
  | 'ac360.school_parenttrust.survey.launch'
  | 'ac360.school_parenttrust.survey.response'
  | 'ac360.school_parenttrust.complaint.open'
  | 'ac360.school_parenttrust.complaint.status'
  | 'ac360.school_parenttrust.appointment_slot.upsert'
  | 'ac360.school_parenttrust.appointment.book'
  | 'ac360.school_parenttrust.appointment.status'
  | 'ac360.school_parenttrust.reputation_request.create'
  | 'ac360.school_parenttrust.testimonial.record'
  | 'ac360.school_parenttrust.reconcile'
  | 'ac360.school_parenttrust.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeParentTrustRpc(
  wiringKey: ParentTrustWiringKey,
  body: Ac360SchoolParentTrustPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.templateId || body.template_id || body.surveyId || body.survey_id || body.complaintId || body.complaint_id || body.appointmentId || body.appointment_id || body.guardianId || body.guardian_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 ParentTrust RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-parenttrust',
      phase: 'phase_2l_parenttrust_surveys_complaints_appointments_reputation',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked ParentTrust action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolParentTrustDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_parenttrust_dashboard', {
    p_org_id: resolved.orgId,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 ParentTrust dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360ParentTrustSurveyTemplate(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.survey_template.upsert', body, 'ac360_school_upsert_parenttrust_survey_template', {
    p_template_id: body.templateId || body.template_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_label: body.label || body.name || null,
    p_survey_type: text(body.surveyType || body.survey_type, 'satisfaction'),
    p_audience_type: text(body.audienceType || body.audience_type, 'parents'),
    p_questions_json: body.questionsJson || body.questions_json || body.questions || [],
    p_scoring_json: body.scoringJson || body.scoring_json || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'survey_template.upsert' })
}

export async function launchAc360ParentTrustSurvey(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.survey.launch', body, 'ac360_school_launch_parenttrust_survey', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_id: body.templateId || body.template_id || null,
    p_survey_key: body.surveyKey || body.survey_key || null,
    p_title: body.title || null,
    p_survey_type: text(body.surveyType || body.survey_type, 'satisfaction'),
    p_audience_json: body.audienceJson || body.audience_json || body.audience || {},
    p_closes_at: body.closesAt || body.closes_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'survey.launch' })
}

export async function recordAc360ParentTrustSurveyResponse(body: Ac360SchoolParentTrustPayload) {
  return executeParentTrustRpc('ac360.school_parenttrust.survey.response', body, 'ac360_school_record_parenttrust_survey_response', {
    p_survey_id: body.surveyId || body.survey_id,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_response_channel: text(body.responseChannel || body.response_channel || body.channel, 'manual'),
    p_score: body.score == null ? null : num(body.score),
    p_nps_score: body.npsScore == null && body.nps_score == null ? null : num(body.npsScore || body.nps_score),
    p_answers_json: body.answersJson || body.answers_json || body.answers || {},
    p_sentiment: body.sentiment || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'survey.response.record' })
}

export async function openAc360ParentTrustComplaint(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.complaint.open', body, 'ac360_school_open_parenttrust_complaint', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_category: text(body.category, 'general'),
    p_priority: text(body.priority, 'medium'),
    p_title: body.title || null,
    p_description: body.description || body.notes || null,
    p_source_channel: text(body.sourceChannel || body.source_channel || body.channel, 'manual'),
    p_assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    p_due_at: body.dueAt || body.due_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'complaint.open' })
}

export async function updateAc360ParentTrustComplaintStatus(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.complaint.status', body, 'ac360_school_update_parenttrust_complaint_status', {
    p_complaint_id: body.complaintId || body.complaint_id,
    p_status: text(body.status, 'in_progress'),
    p_note: body.note || body.resolutionNote || body.resolution_note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'complaint.status.update' })
}

export async function upsertAc360ParentTrustAppointmentSlot(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.appointment_slot.upsert', body, 'ac360_school_upsert_parenttrust_appointment_slot', {
    p_slot_id: body.slotId || body.slot_id || null,
    p_campus_id: body.campusId || body.campus_id || null,
    p_staff_id: body.staffId || body.staff_id || null,
    p_slot_key: body.slotKey || body.slot_key || null,
    p_starts_at: body.startsAt || body.starts_at || null,
    p_ends_at: body.endsAt || body.ends_at || null,
    p_capacity: num(body.capacity, 1),
    p_appointment_type: text(body.appointmentType || body.appointment_type, 'parent_meeting'),
    p_status: text(body.status, 'open'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'appointment_slot.upsert' })
}

export async function bookAc360ParentTrustAppointment(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.appointment.book', body, 'ac360_school_book_parenttrust_appointment', {
    p_slot_id: body.slotId || body.slot_id || null,
    p_campus_id: body.campusId || body.campus_id || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_complaint_id: body.complaintId || body.complaint_id || null,
    p_appointment_type: text(body.appointmentType || body.appointment_type, 'parent_meeting'),
    p_scheduled_at: body.scheduledAt || body.scheduled_at || null,
    p_purpose: body.purpose || body.title || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'appointment.book' })
}

export async function updateAc360ParentTrustAppointmentStatus(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.appointment.status', body, 'ac360_school_update_parenttrust_appointment_status', {
    p_appointment_id: body.appointmentId || body.appointment_id,
    p_status: text(body.status, 'completed'),
    p_outcome_note: body.outcomeNote || body.outcome_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'appointment.status.update' })
}

export async function createAc360ParentTrustReputationRequest(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.reputation_request.create', body, 'ac360_school_create_parenttrust_reputation_request', {
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_request_type: text(body.requestType || body.request_type, 'testimonial'),
    p_channel: text(body.channel, 'whatsapp'),
    p_target_url: body.targetUrl || body.target_url || null,
    p_status: text(body.status, 'queued'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'reputation_request.create' })
}

export async function recordAc360ParentTrustTestimonial(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.testimonial.record', body, 'ac360_school_record_parenttrust_testimonial', {
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_reputation_request_id: body.reputationRequestId || body.reputation_request_id || null,
    p_testimonial_type: text(body.testimonialType || body.testimonial_type, 'text'),
    p_rating: body.rating == null ? null : num(body.rating),
    p_quote: body.quote || body.message || null,
    p_permission_to_publish: bool(body.permissionToPublish ?? body.permission_to_publish, false),
    p_status: text(body.status, 'collected'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'testimonial.record' })
}

export async function reconcileAc360ParentTrust(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.reconcile', body, 'ac360_school_reconcile_parenttrust_runtime', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'reconcile' })
}

export async function resolveAc360ParentTrustAlert(body: Ac360SchoolParentTrustPayload) {
  const actorId = await currentActorId()
  return executeParentTrustRpc('ac360.school_parenttrust.alert.resolve', body, 'ac360_school_resolve_parenttrust_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { parentTrustAction: 'alert.resolve' })
}
