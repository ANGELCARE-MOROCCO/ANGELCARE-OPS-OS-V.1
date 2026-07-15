import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction, type Ac360WiringKey } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360LifecyclePayload = Record<string, unknown>

type RpcResult = {
  ok: boolean
  status?: number
  data?: unknown
  error?: string
  ac360?: Record<string, unknown>
}

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', '1', 'yes', 'oui'].includes(value.toLowerCase())
  return fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeLifecycleRpc(
  wiringKey: Ac360WiringKey,
  body: Ac360LifecyclePayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
): Promise<RpcResult> {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || rpcArgs.p_org_id || ''))
  if (!resolved.ok) return resolved as any

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.studentId || body.student_id || body.guardianId || body.guardian_id || body.classId || body.class_id || body.toClassId || body.to_class_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 lifecycle RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-lifecycle',
      phase: 'phase_2b_student_parent_class_lifecycle',
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked lifecycle action.', ac360: { guard: guarded.guard, blocked: true } }
  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolLifecycleDashboard(orgId?: string) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_lifecycle_dashboard', { p_org_id: resolved.orgId } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 school lifecycle dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function transitionAc360Student(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.student.transition', body, 'ac360_school_transition_student', {
    p_student_id: body.studentId || body.student_id,
    p_to_enrollment_status: text(body.toEnrollmentStatus || body.to_enrollment_status || body.enrollmentStatus || body.enrollment_status, 'enrolled'),
    p_to_status: body.toStatus || body.to_status || body.status || null,
    p_reason: body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'student.transition' })
}

export async function archiveAc360Student(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.student.archive', body, 'ac360_school_archive_student', {
    p_student_id: body.studentId || body.student_id,
    p_reason: body.reason || 'Safe archive requested from AC360 Phase 2B.',
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'student.archive', dataStrategy: 'archive_not_delete' })
}

export async function linkAc360Guardian(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.guardian.link', body, 'ac360_school_link_guardian', {
    p_student_id: body.studentId || body.student_id,
    p_guardian_id: body.guardianId || body.guardian_id,
    p_relation_label: text(body.relationLabel || body.relation_label, 'guardian'),
    p_is_primary: bool(body.isPrimary || body.is_primary, false),
    p_can_pickup: bool(body.canPickup || body.can_pickup, true),
    p_can_receive_billing: bool(body.canReceiveBilling || body.can_receive_billing, true),
    p_can_receive_reports: bool(body.canReceiveReports || body.can_receive_reports, true),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'guardian.link' })
}

export async function updateAc360GuardianPortalStatus(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.guardian.portal_status', body, 'ac360_school_update_guardian_portal_status', {
    p_guardian_id: body.guardianId || body.guardian_id,
    p_portal_status: text(body.portalStatus || body.portal_status, 'invited'),
    p_status: body.status || null,
    p_reason: body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'guardian.portal_status' })
}

export async function transferAc360StudentClass(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.class.transfer', body, 'ac360_school_transfer_student_class', {
    p_student_id: body.studentId || body.student_id,
    p_to_class_id: body.toClassId || body.to_class_id || body.classId || body.class_id,
    p_from_class_id: body.fromClassId || body.from_class_id || null,
    p_transfer_date: body.transferDate || body.transfer_date || null,
    p_reason: body.reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'class.transfer_student' })
}

export async function reconcileAc360ClassCapacity(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.class.capacity_reconcile', body, 'ac360_school_reconcile_class_capacity', {
    p_class_id: body.classId || body.class_id,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'class.capacity_reconcile' })
}

export async function closeAc360Class(body: Ac360LifecyclePayload) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.class.close', body, 'ac360_school_close_class', {
    p_class_id: body.classId || body.class_id,
    p_reason: body.reason || 'Class closed safely through AC360 Phase 2B.',
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'class.close', dataStrategy: 'archive_not_delete' })
}

export async function runAc360SchoolLifecycleIntegrityCheck(body: Ac360LifecyclePayload = {}) {
  const actorId = await currentActorId()
  return executeLifecycleRpc('ac360.school_lifecycle.integrity_check', body, 'ac360_school_run_lifecycle_integrity_check', {
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { lifecycleAction: 'integrity_check', uiBuildAllowed: false })
}
