import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolHrPayload = Record<string, unknown>

type HrWiringKey =
  | 'ac360.school_hr.department.upsert'
  | 'ac360.school_hr.contract.upsert'
  | 'ac360.school_hr.shift_profile.upsert'
  | 'ac360.school_hr.schedule_cycle.open'
  | 'ac360.school_hr.shift.assign'
  | 'ac360.school_hr.shift.status'
  | 'ac360.school_hr.leave_policy.upsert'
  | 'ac360.school_hr.leave_request.create'
  | 'ac360.school_hr.leave_request.decide'
  | 'ac360.school_hr.staffing_request.open'
  | 'ac360.school_hr.staffing_request.fulfill'
  | 'ac360.school_hr.evaluation.create'
  | 'ac360.school_hr.compliance.reconcile'
  | 'ac360.school_hr.alert.resolve'

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

async function executeHrRpc(
  wiringKey: HrWiringKey,
  body: Ac360SchoolHrPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.staffProfileId || body.staff_profile_id || body.assignmentId || body.assignment_id || body.leaveRequestId || body.leave_request_id || body.staffingRequestId || body.staffing_request_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 HR RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-hr',
      phase: 'phase_2i_hr_staff_scheduling_leave_staffing',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked HR action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolHrDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_hr_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 HR dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360HrDepartment(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.department.upsert', body, 'ac360_school_upsert_hr_department', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_department_key: body.departmentKey || body.department_key || null,
    p_label: body.label || body.name || null,
    p_department_type: text(body.departmentType || body.department_type, 'operations'),
    p_manager_staff_id: body.managerStaffId || body.manager_staff_id || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'department.upsert' })
}

export async function upsertAc360StaffContract(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.contract.upsert', body, 'ac360_school_upsert_staff_contract', {
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id,
    p_contract_code: body.contractCode || body.contract_code || null,
    p_contract_type: text(body.contractType || body.contract_type, 'employment'),
    p_employment_status: text(body.employmentStatus || body.employment_status, 'active'),
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_base_salary_mad: num(body.baseSalaryMad || body.base_salary_mad, 0),
    p_hourly_rate_mad: num(body.hourlyRateMad || body.hourly_rate_mad, 0),
    p_weekly_hours: num(body.weeklyHours || body.weekly_hours, 0),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'contract.upsert' })
}

export async function upsertAc360ShiftProfile(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.shift_profile.upsert', body, 'ac360_school_upsert_shift_profile', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_shift_key: body.shiftKey || body.shift_key || null,
    p_label: body.label || body.name || null,
    p_starts_at: body.startsAt || body.starts_at || '08:00',
    p_ends_at: body.endsAt || body.ends_at || '17:00',
    p_break_minutes: num(body.breakMinutes || body.break_minutes, 0),
    p_grace_minutes: num(body.graceMinutes || body.grace_minutes, 10),
    p_expected_hours: num(body.expectedHours || body.expected_hours, 0),
    p_applies_to_department: body.appliesToDepartment || body.applies_to_department || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'shift_profile.upsert' })
}

export async function openAc360ScheduleCycle(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.schedule_cycle.open', body, 'ac360_school_open_staff_schedule_cycle', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_cycle_key: body.cycleKey || body.cycle_key || null,
    p_label: body.label || body.title || null,
    p_cycle_type: text(body.cycleType || body.cycle_type, 'weekly'),
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'schedule_cycle.open' })
}

export async function assignAc360StaffShift(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.shift.assign', body, 'ac360_school_assign_staff_shift', {
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id,
    p_campus_id: body.campusId || body.campus_id || null,
    p_cycle_id: body.cycleId || body.cycle_id || null,
    p_shift_profile_id: body.shiftProfileId || body.shift_profile_id || null,
    p_assignment_date: body.assignmentDate || body.assignment_date || null,
    p_starts_at: body.startsAt || body.starts_at || null,
    p_ends_at: body.endsAt || body.ends_at || null,
    p_assigned_role: body.assignedRole || body.assigned_role || null,
    p_class_id: body.classId || body.class_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'shift.assign' })
}

export async function updateAc360StaffShiftStatus(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.shift.status', body, 'ac360_school_update_staff_shift_status', {
    p_assignment_id: body.assignmentId || body.assignment_id,
    p_status: body.status,
    p_attendance_status: body.attendanceStatus || body.attendance_status || null,
    p_reason: body.reason || body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'shift.status' })
}

export async function upsertAc360LeavePolicy(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.leave_policy.upsert', body, 'ac360_school_upsert_leave_policy', {
    p_policy_key: body.policyKey || body.policy_key || null,
    p_label: body.label || body.title || null,
    p_leave_type: text(body.leaveType || body.leave_type, 'annual'),
    p_yearly_allowance_days: num(body.yearlyAllowanceDays || body.yearly_allowance_days, 0),
    p_paid: bool(body.paid, true),
    p_requires_approval: bool(body.requiresApproval || body.requires_approval, true),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'leave_policy.upsert' })
}

export async function createAc360LeaveRequest(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.leave_request.create', body, 'ac360_school_create_leave_request', {
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id,
    p_policy_id: body.policyId || body.policy_id || null,
    p_leave_type: text(body.leaveType || body.leave_type, 'annual'),
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_reason: body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'leave_request.create' })
}

export async function decideAc360LeaveRequest(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.leave_request.decide', body, 'ac360_school_decide_leave_request', {
    p_leave_request_id: body.leaveRequestId || body.leave_request_id,
    p_decision: body.decision || body.status,
    p_decision_note: body.decisionNote || body.decision_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'leave_request.decide' })
}

export async function openAc360StaffingRequest(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.staffing_request.open', body, 'ac360_school_open_staffing_request', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_request_type: text(body.requestType || body.request_type, 'replacement'),
    p_role_needed: body.roleNeeded || body.role_needed || null,
    p_department: body.department || null,
    p_needed_from: body.neededFrom || body.needed_from || null,
    p_needed_until: body.neededUntil || body.needed_until || null,
    p_priority: text(body.priority, 'medium'),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'staffing_request.open' })
}

export async function fulfillAc360StaffingRequest(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.staffing_request.fulfill', body, 'ac360_school_fulfill_staffing_request', {
    p_staffing_request_id: body.staffingRequestId || body.staffing_request_id,
    p_fulfilled_by_staff_id: body.fulfilledByStaffId || body.fulfilled_by_staff_id || null,
    p_status: text(body.status, 'fulfilled'),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'staffing_request.fulfill' })
}

export async function createAc360StaffEvaluation(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.evaluation.create', body, 'ac360_school_create_staff_evaluation', {
    p_staff_profile_id: body.staffProfileId || body.staff_profile_id,
    p_evaluation_type: text(body.evaluationType || body.evaluation_type, 'monthly'),
    p_period_start: body.periodStart || body.period_start || null,
    p_period_end: body.periodEnd || body.period_end || null,
    p_score: num(body.score, 0),
    p_strengths: body.strengths || null,
    p_improvement_points: body.improvementPoints || body.improvement_points || null,
    p_status: text(body.status, 'completed'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'evaluation.create' })
}

export async function reconcileAc360Hr(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.compliance.reconcile', body, 'ac360_school_reconcile_hr', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'compliance.reconcile' })
}

export async function resolveAc360HrAlert(body: Ac360SchoolHrPayload) {
  const actorId = await currentActorId()
  return executeHrRpc('ac360.school_hr.alert.resolve', body, 'ac360_school_resolve_hr_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { hrAction: 'alert.resolve' })
}
