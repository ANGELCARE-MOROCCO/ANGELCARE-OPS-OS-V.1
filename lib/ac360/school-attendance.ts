import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolAttendancePayload = Record<string, unknown>

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function dateOnly(value: unknown) {
  const raw = String(value || '').trim()
  return raw || new Date().toISOString().slice(0, 10)
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeAttendanceRpc(
  wiringKey:
    | 'ac360.school_attendance.session.open'
    | 'ac360.school_attendance.event.record'
    | 'ac360.school_attendance.correction.request'
    | 'ac360.school_attendance.correction.decide'
    | 'ac360.school_attendance.session.close'
    | 'ac360.school_daily_ops.reconcile'
    | 'ac360.school_daily_ops.alert.resolve',
  body: Ac360SchoolAttendancePayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.attendanceSessionId || body.attendance_session_id || body.attendanceRecordId || body.attendance_record_id || body.correctionId || body.correction_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 attendance RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-attendance',
      phase: 'phase_2c_attendance_presence_daily_ops',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked attendance action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolAttendanceDashboard(orgId?: string, campusId?: string | null, operationDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_attendance_daily_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_operation_date: operationDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 attendance dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function openAc360AttendanceSession(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_attendance.session.open', body, 'ac360_school_open_attendance_session', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_class_id: body.classId || body.class_id || null,
    p_academic_year_id: body.academicYearId || body.academic_year_id || null,
    p_session_date: body.sessionDate || body.session_date || dateOnly(body.operationDate || body.operation_date),
    p_session_key: text(body.sessionKey || body.session_key, 'daily'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'session.open' })
}

export async function recordAc360AttendanceEvent(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_attendance.event.record', body, 'ac360_school_record_attendance_event', {
    p_attendance_session_id: body.attendanceSessionId || body.attendance_session_id || null,
    p_daybook_id: body.daybookId || body.daybook_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id || null,
    p_attendance_type: body.attendanceType || body.attendance_type || null,
    p_event_type: text(body.eventType || body.event_type, 'check_in'),
    p_attendance_status: body.attendanceStatus || body.attendance_status || null,
    p_event_at: body.eventAt || body.event_at || null,
    p_reason: body.reason || null,
    p_source: text(body.source, 'manual'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'event.record' })
}

export async function requestAc360AttendanceCorrection(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_attendance.correction.request', body, 'ac360_school_request_attendance_correction', {
    p_attendance_record_id: body.attendanceRecordId || body.attendance_record_id,
    p_requested_status: body.requestedStatus || body.requested_status || null,
    p_requested_check_in_at: body.requestedCheckInAt || body.requested_check_in_at || null,
    p_requested_check_out_at: body.requestedCheckOutAt || body.requested_check_out_at || null,
    p_request_reason: body.requestReason || body.request_reason || body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'correction.request' })
}

export async function decideAc360AttendanceCorrection(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_attendance.correction.decide', body, 'ac360_school_decide_attendance_correction', {
    p_correction_id: body.correctionId || body.correction_id,
    p_decision_status: text(body.decisionStatus || body.decision_status, 'approved'),
    p_decision_reason: body.decisionReason || body.decision_reason || body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'correction.decide' })
}

export async function closeAc360AttendanceSession(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_attendance.session.close', body, 'ac360_school_close_attendance_session', {
    p_attendance_session_id: body.attendanceSessionId || body.attendance_session_id,
    p_close_status: text(body.closeStatus || body.close_status || body.status, 'closed'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'session.close' })
}

export async function reconcileAc360DailyOperations(body: Ac360SchoolAttendancePayload = {}) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_daily_ops.reconcile', body, 'ac360_school_run_daily_ops_reconcile', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_operation_date: body.operationDate || body.operation_date || dateOnly(body.sessionDate || body.session_date),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'daily_ops.reconcile' })
}

export async function resolveAc360DailyOpsAlert(body: Ac360SchoolAttendancePayload) {
  const actorId = await currentActorId()
  return executeAttendanceRpc('ac360.school_daily_ops.alert.resolve', body, 'ac360_school_resolve_daily_ops_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { attendanceAction: 'daily_ops.alert.resolve' })
}
