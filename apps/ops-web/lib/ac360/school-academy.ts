import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolAcademyPayload = Record<string, unknown>

type AcademyWiringKey =
  | 'ac360.school_academy.program.upsert'
  | 'ac360.school_academy.course.upsert'
  | 'ac360.school_academy.session.schedule'
  | 'ac360.school_academy.staff.enroll'
  | 'ac360.school_academy.attendance.record'
  | 'ac360.school_academy.assessment.upsert'
  | 'ac360.school_academy.assessment_result.record'
  | 'ac360.school_academy.certificate.issue'
  | 'ac360.school_academy.assignment.create'
  | 'ac360.school_academy.reconcile'
  | 'ac360.school_academy.alert.resolve'

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

async function executeAcademyRpc(
  wiringKey: AcademyWiringKey,
  body: Ac360SchoolAcademyPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.programId || body.program_id || body.courseId || body.course_id || body.sessionId || body.session_id || body.staffId || body.staff_id || body.assessmentId || body.assessment_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 Academy RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-academy',
      phase: 'phase_2m_academy_training_staff_courses_assessments_certificates',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked Academy action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolAcademyDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_academy_dashboard', {
    p_org_id: resolved.orgId,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 Academy dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360AcademyProgram(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.program.upsert', body, 'ac360_school_academy_upsert_program', {
    p_program_id: body.programId || body.program_id || null,
    p_program_key: body.programKey || body.program_key || null,
    p_label: body.label || body.title || body.name || null,
    p_program_type: text(body.programType || body.program_type, 'staff_training'),
    p_target_audience: text(body.targetAudience || body.target_audience, 'staff'),
    p_duration_hours: num(body.durationHours || body.duration_hours, 0),
    p_curriculum_json: body.curriculumJson || body.curriculum_json || body.curriculum || [],
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'program.upsert' })
}

export async function upsertAc360AcademyCourse(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.course.upsert', body, 'ac360_school_academy_upsert_course', {
    p_course_id: body.courseId || body.course_id || null,
    p_program_id: body.programId || body.program_id || null,
    p_course_key: body.courseKey || body.course_key || null,
    p_title: body.title || body.label || null,
    p_course_type: text(body.courseType || body.course_type, 'training'),
    p_level: text(body.level, 'standard'),
    p_duration_hours: num(body.durationHours || body.duration_hours, 0),
    p_content_json: body.contentJson || body.content_json || body.content || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'course.upsert' })
}

export async function scheduleAc360AcademySession(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.session.schedule', body, 'ac360_school_academy_schedule_session', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_course_id: body.courseId || body.course_id || null,
    p_session_key: body.sessionKey || body.session_key || null,
    p_title: body.title || null,
    p_starts_at: body.startsAt || body.starts_at || null,
    p_ends_at: body.endsAt || body.ends_at || null,
    p_delivery_mode: text(body.deliveryMode || body.delivery_mode, 'onsite'),
    p_trainer_staff_id: body.trainerStaffId || body.trainer_staff_id || null,
    p_capacity: body.capacity == null ? null : num(body.capacity),
    p_status: text(body.status, 'scheduled'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'session.schedule' })
}

export async function enrollAc360AcademyStaff(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.staff.enroll', body, 'ac360_school_academy_enroll_staff', {
    p_staff_id: body.staffId || body.staff_id,
    p_program_id: body.programId || body.program_id || null,
    p_course_id: body.courseId || body.course_id || null,
    p_enrollment_type: text(body.enrollmentType || body.enrollment_type, 'assigned'),
    p_mandatory: bool(body.mandatory, false),
    p_due_at: body.dueAt || body.due_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'staff.enroll' })
}

export async function recordAc360AcademyAttendance(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.attendance.record', body, 'ac360_school_academy_record_attendance', {
    p_session_id: body.sessionId || body.session_id,
    p_staff_id: body.staffId || body.staff_id || null,
    p_enrollment_id: body.enrollmentId || body.enrollment_id || null,
    p_attendance_status: text(body.attendanceStatus || body.attendance_status, 'present'),
    p_check_in_at: body.checkInAt || body.check_in_at || null,
    p_check_out_at: body.checkOutAt || body.check_out_at || null,
    p_note: body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'attendance.record' })
}

export async function upsertAc360AcademyAssessment(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.assessment.upsert', body, 'ac360_school_academy_upsert_assessment', {
    p_assessment_id: body.assessmentId || body.assessment_id || null,
    p_course_id: body.courseId || body.course_id || null,
    p_assessment_key: body.assessmentKey || body.assessment_key || null,
    p_title: body.title || null,
    p_assessment_type: text(body.assessmentType || body.assessment_type, 'quiz'),
    p_max_score: num(body.maxScore || body.max_score, 100),
    p_pass_score: num(body.passScore || body.pass_score, 60),
    p_questions_json: body.questionsJson || body.questions_json || body.questions || [],
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'assessment.upsert' })
}

export async function recordAc360AcademyAssessmentResult(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.assessment_result.record', body, 'ac360_school_academy_record_assessment_result', {
    p_assessment_id: body.assessmentId || body.assessment_id,
    p_staff_id: body.staffId || body.staff_id || null,
    p_enrollment_id: body.enrollmentId || body.enrollment_id || null,
    p_score: num(body.score, 0),
    p_max_score: num(body.maxScore || body.max_score, 100),
    p_answers_json: body.answersJson || body.answers_json || body.answers || {},
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'assessment_result.record' })
}

export async function issueAc360AcademyCertificate(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.certificate.issue', body, 'ac360_school_academy_issue_certificate', {
    p_staff_id: body.staffId || body.staff_id,
    p_enrollment_id: body.enrollmentId || body.enrollment_id || null,
    p_assessment_result_id: body.assessmentResultId || body.assessment_result_id || null,
    p_title: body.title || null,
    p_expires_on: body.expiresOn || body.expires_on || null,
    p_document_id: body.documentId || body.document_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'certificate.issue' })
}

export async function createAc360AcademyAssignment(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.assignment.create', body, 'ac360_school_academy_create_assignment', {
    p_staff_id: body.staffId || body.staff_id || null,
    p_program_id: body.programId || body.program_id || null,
    p_course_id: body.courseId || body.course_id || null,
    p_assignment_reason: text(body.assignmentReason || body.assignment_reason, 'manual'),
    p_mandatory: bool(body.mandatory, true),
    p_due_at: body.dueAt || body.due_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'assignment.create' })
}

export async function reconcileAc360Academy(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.reconcile', body, 'ac360_school_academy_reconcile', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'reconcile' })
}

export async function resolveAc360AcademyAlert(body: Ac360SchoolAcademyPayload) {
  const actorId = await currentActorId()
  return executeAcademyRpc('ac360.school_academy.alert.resolve', body, 'ac360_school_academy_resolve_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { academyAction: 'alert.resolve' })
}
