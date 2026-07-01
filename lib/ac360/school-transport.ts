
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolTransportPayload = Record<string, unknown>

type TransportWiringKey =
  | 'ac360.school_transport.vehicle.upsert'
  | 'ac360.school_transport.driver.upsert'
  | 'ac360.school_transport.route.upsert'
  | 'ac360.school_transport.route_stop.upsert'
  | 'ac360.school_transport.student.assign'
  | 'ac360.school_transport.route_run.open'
  | 'ac360.school_transport.route_run.event'
  | 'ac360.school_transport.route_run.close'
  | 'ac360.school_transport.safety_check.record'
  | 'ac360.school_transport.billing.reconcile'
  | 'ac360.school_transport.reconcile'
  | 'ac360.school_transport.alert.resolve'

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

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeTransportRpc(
  wiringKey: TransportWiringKey,
  body: Ac360SchoolTransportPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.vehicleId || body.vehicle_id || body.driverId || body.driver_id || body.routeId || body.route_id || body.routeRunId || body.route_run_id || body.studentId || body.student_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 transport RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-transport',
      phase: 'phase_2k_transport_routes_vehicles_drivers',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked transport action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolTransportDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_transport_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 transport dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360TransportVehicle(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.vehicle.upsert', body, 'ac360_school_upsert_transport_vehicle', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_vehicle_id: body.vehicleId || body.vehicle_id || null,
    p_vehicle_code: body.vehicleCode || body.vehicle_code || null,
    p_label: body.label || body.name || null,
    p_vehicle_type: text(body.vehicleType || body.vehicle_type, 'bus'),
    p_plate_number: body.plateNumber || body.plate_number || null,
    p_capacity: num(body.capacity, 0),
    p_seatbelt_count: num(body.seatbeltCount || body.seatbelt_count, 0),
    p_insurance_expiry: body.insuranceExpiry || body.insurance_expiry || null,
    p_inspection_expiry: body.inspectionExpiry || body.inspection_expiry || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'vehicle.upsert' })
}

export async function upsertAc360TransportDriver(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.driver.upsert', body, 'ac360_school_upsert_transport_driver', {
    p_staff_id: body.staffId || body.staff_id || null,
    p_driver_id: body.driverId || body.driver_id || null,
    p_driver_code: body.driverCode || body.driver_code || null,
    p_full_name: body.fullName || body.full_name || body.name || null,
    p_phone: body.phone || null,
    p_license_number: body.licenseNumber || body.license_number || null,
    p_license_expiry: body.licenseExpiry || body.license_expiry || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'driver.upsert' })
}

export async function upsertAc360TransportRoute(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.route.upsert', body, 'ac360_school_upsert_transport_route', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_route_id: body.routeId || body.route_id || null,
    p_route_code: body.routeCode || body.route_code || null,
    p_label: body.label || body.name || null,
    p_direction: text(body.direction, 'round_trip'),
    p_route_type: text(body.routeType || body.route_type, 'regular'),
    p_default_vehicle_id: body.defaultVehicleId || body.default_vehicle_id || body.vehicleId || body.vehicle_id || null,
    p_default_driver_id: body.defaultDriverId || body.default_driver_id || body.driverId || body.driver_id || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'route.upsert' })
}

export async function upsertAc360TransportRouteStop(body: Ac360SchoolTransportPayload) {
  return executeTransportRpc('ac360.school_transport.route_stop.upsert', body, 'ac360_school_upsert_transport_route_stop', {
    p_route_id: body.routeId || body.route_id,
    p_stop_id: body.stopId || body.stop_id || null,
    p_stop_order: num(body.stopOrder || body.stop_order, 1),
    p_stop_label: body.stopLabel || body.stop_label || body.label || null,
    p_zone: body.zone || null,
    p_address: body.address || null,
    p_planned_time: body.plannedTime || body.planned_time || null,
    p_gps_lat: body.gpsLat || body.gps_lat || null,
    p_gps_lng: body.gpsLng || body.gps_lng || null,
    p_status: text(body.status, 'active'),
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'route_stop.upsert' })
}

export async function assignAc360TransportStudent(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.student.assign', body, 'ac360_school_assign_transport_student', {
    p_student_id: body.studentId || body.student_id,
    p_route_id: body.routeId || body.route_id,
    p_stop_id: body.stopId || body.stop_id || null,
    p_service_direction: text(body.serviceDirection || body.service_direction || body.direction, 'round_trip'),
    p_monthly_fee_mad: num(body.monthlyFeeMad || body.monthly_fee_mad, 0),
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'student.assign' })
}

export async function openAc360TransportRouteRun(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.route_run.open', body, 'ac360_school_open_transport_route_run', {
    p_route_id: body.routeId || body.route_id,
    p_vehicle_id: body.vehicleId || body.vehicle_id || null,
    p_driver_id: body.driverId || body.driver_id || null,
    p_run_date: body.runDate || body.run_date || null,
    p_run_type: text(body.runType || body.run_type, 'pickup'),
    p_planned_start_at: body.plannedStartAt || body.planned_start_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'route_run.open' })
}

export async function recordAc360TransportRouteRunEvent(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.route_run.event', body, 'ac360_school_record_transport_run_event', {
    p_route_run_id: body.routeRunId || body.route_run_id,
    p_student_id: body.studentId || body.student_id || null,
    p_stop_id: body.stopId || body.stop_id || null,
    p_event_type: text(body.eventType || body.event_type, 'run_note'),
    p_occurred_at: body.occurredAt || body.occurred_at || null,
    p_status: text(body.status, 'recorded'),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'route_run.event' })
}

export async function closeAc360TransportRouteRun(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.route_run.close', body, 'ac360_school_close_transport_route_run', {
    p_route_run_id: body.routeRunId || body.route_run_id,
    p_status: text(body.status, 'completed'),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'route_run.close' })
}

export async function recordAc360TransportSafetyCheck(body: Ac360SchoolTransportPayload) {
  return executeTransportRpc('ac360.school_transport.safety_check.record', body, 'ac360_school_record_transport_safety_check', {
    p_vehicle_id: body.vehicleId || body.vehicle_id || null,
    p_driver_id: body.driverId || body.driver_id || null,
    p_route_run_id: body.routeRunId || body.route_run_id || null,
    p_check_type: text(body.checkType || body.check_type, 'pre_route'),
    p_result: text(body.result, 'passed'),
    p_checked_at: body.checkedAt || body.checked_at || null,
    p_checked_by_staff_id: body.checkedByStaffId || body.checked_by_staff_id || null,
    p_notes: body.notes || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'safety_check.record' })
}

export async function reconcileAc360TransportBilling(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.billing.reconcile', body, 'ac360_school_reconcile_transport_billing', {
    p_billing_month: body.billingMonth || body.billing_month || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'billing.reconcile' })
}

export async function reconcileAc360Transport(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.reconcile', body, 'ac360_school_reconcile_transport_runtime', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'reconcile' })
}

export async function resolveAc360TransportAlert(body: Ac360SchoolTransportPayload) {
  const actorId = await currentActorId()
  return executeTransportRpc('ac360.school_transport.alert.resolve', body, 'ac360_school_resolve_transport_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { transportAction: 'alert.resolve' })
}
