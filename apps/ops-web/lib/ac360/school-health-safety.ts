import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolHealthSafetyPayload = Record<string, unknown>

type HealthSafetyWiringKey =
  | 'ac360.school_health_safety.health_profile.upsert'
  | 'ac360.school_health_safety.emergency_contact.upsert'
  | 'ac360.school_health_safety.medication_plan.upsert'
  | 'ac360.school_health_safety.medication_admin.record'
  | 'ac360.school_health_safety.authorized_pickup.upsert'
  | 'ac360.school_health_safety.pickup.record'
  | 'ac360.school_health_safety.incident.report'
  | 'ac360.school_health_safety.incident.status'
  | 'ac360.school_health_safety.incident.acknowledge'
  | 'ac360.school_health_safety.checklist.upsert'
  | 'ac360.school_health_safety.check.record'
  | 'ac360.school_health_safety.reconcile'
  | 'ac360.school_health_safety.alert.resolve'

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

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeHealthSafetyRpc(
  wiringKey: HealthSafetyWiringKey,
  body: Ac360SchoolHealthSafetyPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.studentId || body.student_id || body.incidentId || body.incident_id || body.alertId || body.alert_id || body.authorizedPickupId || body.authorized_pickup_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 health/safety RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-health-safety',
      phase: 'phase_2j_health_safety_incidents_medical_pickup',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked health/safety action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolHealthSafetyDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_health_safety_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 health/safety dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360HealthProfile(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.health_profile.upsert', body, 'ac360_school_upsert_health_profile', {
    p_student_id: body.studentId || body.student_id,
    p_blood_type: body.bloodType || body.blood_type || null,
    p_allergies: arr(body.allergies),
    p_medical_conditions: arr(body.medicalConditions || body.medical_conditions),
    p_dietary_notes: body.dietaryNotes || body.dietary_notes || null,
    p_emergency_notes: body.emergencyNotes || body.emergency_notes || null,
    p_doctor_name: body.doctorName || body.doctor_name || null,
    p_doctor_phone: body.doctorPhone || body.doctor_phone || null,
    p_insurance_reference: body.insuranceReference || body.insurance_reference || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'health_profile.upsert' })
}

export async function upsertAc360EmergencyContact(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.emergency_contact.upsert', body, 'ac360_school_upsert_emergency_contact', {
    p_student_id: body.studentId || body.student_id,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_contact_name: body.contactName || body.contact_name || body.name || null,
    p_relationship: body.relationship || null,
    p_phone: body.phone || null,
    p_email: body.email || null,
    p_priority_order: num(body.priorityOrder || body.priority_order, 1),
    p_can_pickup: bool(body.canPickup || body.can_pickup, false),
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'emergency_contact.upsert' })
}

export async function upsertAc360MedicationPlan(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.medication_plan.upsert', body, 'ac360_school_upsert_medication_plan', {
    p_student_id: body.studentId || body.student_id,
    p_medication_plan_id: body.medicationPlanId || body.medication_plan_id || null,
    p_medication_name: body.medicationName || body.medication_name || null,
    p_dosage: body.dosage || null,
    p_frequency: body.frequency || null,
    p_instructions: body.instructions || null,
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_requires_parent_authorization: bool(body.requiresParentAuthorization || body.requires_parent_authorization, true),
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'medication_plan.upsert' })
}

export async function recordAc360MedicationAdmin(body: Ac360SchoolHealthSafetyPayload) {
  return executeHealthSafetyRpc('ac360.school_health_safety.medication_admin.record', body, 'ac360_school_record_medication_admin', {
    p_medication_plan_id: body.medicationPlanId || body.medication_plan_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_administered_at: body.administeredAt || body.administered_at || null,
    p_administered_by_staff_id: body.administeredByStaffId || body.administered_by_staff_id || null,
    p_dosage_given: body.dosageGiven || body.dosage_given || null,
    p_status: text(body.status, 'administered'),
    p_notes: body.notes || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'medication_admin.record' })
}

export async function upsertAc360AuthorizedPickup(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.authorized_pickup.upsert', body, 'ac360_school_upsert_authorized_pickup', {
    p_student_id: body.studentId || body.student_id,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_pickup_name: body.pickupName || body.pickup_name || body.name || null,
    p_relationship: body.relationship || null,
    p_phone: body.phone || null,
    p_id_reference: body.idReference || body.id_reference || null,
    p_authorization_status: text(body.authorizationStatus || body.authorization_status, 'authorized'),
    p_valid_from: body.validFrom || body.valid_from || null,
    p_valid_until: body.validUntil || body.valid_until || null,
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'authorized_pickup.upsert' })
}

export async function recordAc360Pickup(body: Ac360SchoolHealthSafetyPayload) {
  return executeHealthSafetyRpc('ac360.school_health_safety.pickup.record', body, 'ac360_school_record_pickup', {
    p_student_id: body.studentId || body.student_id,
    p_authorized_pickup_id: body.authorizedPickupId || body.authorized_pickup_id || null,
    p_pickup_name: body.pickupName || body.pickup_name || null,
    p_pickup_at: body.pickupAt || body.pickup_at || null,
    p_released_by_staff_id: body.releasedByStaffId || body.released_by_staff_id || null,
    p_verification_status: text(body.verificationStatus || body.verification_status, 'verified'),
    p_status: text(body.status, 'released'),
    p_notes: body.notes || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'pickup.record' })
}

export async function reportAc360Incident(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.incident.report', body, 'ac360_school_report_incident', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_class_id: body.classId || body.class_id || null,
    p_incident_type: text(body.incidentType || body.incident_type, 'safety'),
    p_severity: text(body.severity, 'medium'),
    p_occurred_at: body.occurredAt || body.occurred_at || null,
    p_location: body.location || null,
    p_description: body.description || body.summary || null,
    p_immediate_action: body.immediateAction || body.immediate_action || null,
    p_reported_by_staff_id: body.reportedByStaffId || body.reported_by_staff_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'incident.report' })
}

export async function updateAc360IncidentStatus(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.incident.status', body, 'ac360_school_update_incident_status', {
    p_incident_id: body.incidentId || body.incident_id,
    p_status: body.status,
    p_parent_notification_status: body.parentNotificationStatus || body.parent_notification_status || null,
    p_note: body.note || body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'incident.status' })
}

export async function acknowledgeAc360Incident(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.incident.acknowledge', body, 'ac360_school_acknowledge_incident', {
    p_incident_id: body.incidentId || body.incident_id,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_acknowledged_by_name: body.acknowledgedByName || body.acknowledged_by_name || null,
    p_channel: text(body.channel, 'manual'),
    p_status: text(body.status, 'acknowledged'),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'incident.acknowledge' })
}

export async function upsertAc360SafetyChecklist(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.checklist.upsert', body, 'ac360_school_upsert_safety_checklist', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_checklist_key: body.checklistKey || body.checklist_key || null,
    p_label: body.label || body.title || null,
    p_checklist_type: text(body.checklistType || body.checklist_type, 'daily_safety'),
    p_frequency: text(body.frequency, 'daily'),
    p_items: Array.isArray(body.items) ? body.items : [],
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'checklist.upsert' })
}

export async function recordAc360SafetyCheck(body: Ac360SchoolHealthSafetyPayload) {
  return executeHealthSafetyRpc('ac360.school_health_safety.check.record', body, 'ac360_school_record_safety_check', {
    p_checklist_id: body.checklistId || body.checklist_id || null,
    p_campus_id: body.campusId || body.campus_id || null,
    p_class_id: body.classId || body.class_id || null,
    p_checked_by_staff_id: body.checkedByStaffId || body.checked_by_staff_id || null,
    p_status: text(body.status, 'completed'),
    p_score: num(body.score, 100),
    p_findings: body.findings || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'safety_check.record' })
}

export async function reconcileAc360HealthSafety(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.reconcile', body, 'ac360_school_reconcile_health_safety', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'reconcile' })
}

export async function resolveAc360HealthSafetyAlert(body: Ac360SchoolHealthSafetyPayload) {
  const actorId = await currentActorId()
  return executeHealthSafetyRpc('ac360.school_health_safety.alert.resolve', body, 'ac360_school_resolve_health_safety_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { healthSafetyAction: 'alert.resolve' })
}
