import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  TransportAlert,
  TransportAssignment,
  TransportAuditEvent,
  TransportAuthority,
  TransportDriver,
  TransportIntegrity,
  TransportMutationResult,
  TransportRoute,
  TransportRun,
  TransportRunEvent,
  TransportSafetyCheck,
  TransportSnapshot,
  TransportStaff,
  TransportStop,
  TransportStudent,
  TransportVehicle,
} from '@/types/angelcare360/transport-mobility'

type Row = Record<string, any>
const MODULE = 'transport'
const TODAY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date())

function s(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function n(value: unknown, fallback = 0) { const x = Number(value); return Number.isFinite(x) ? x : fallback }
function nullable(value: unknown) { const x = s(value).trim(); return x ? x : null }
function bool(value: unknown) { return value === true || value === 'true' || value === 1 }
function dateExpired(value?: string | null) {
  if (!value) return false
  const d = new Date(`${value}T23:59:59`)
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now()
}
function fullStudentName(row: Row) {
  const preferred = nullable(row.preferred_name)
  if (preferred) return preferred
  return [s(row.first_name), s(row.last_name)].filter(Boolean).join(' ').trim() || s(row.full_name, 'Élève')
}

async function access(permission: string, schoolId?: string | null) {
  const ctx = await requireAngelcare360Permission(permission, { schoolId })
  if (!ctx.school) throw new Error('Aucun établissement actif n’est disponible.')
  return ctx
}

async function audit(input: {
  schoolId: string
  action: string
  entityType: string
  entityId: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  metadata?: Record<string, unknown>
}) {
  try {
    await recordAngelcare360AuditEventServer({
      category: 'transport',
      module: MODULE,
      action: input.action,
      schoolId: input.schoolId,
      entityType: input.entityType,
      entityId: input.entityId,
      severity: input.severity || 'info',
      metadata: input.metadata,
    })
  } catch {}
}

async function resolveAdvancedOrg(client: any, school: { id: string; school_code: string; name: string }) {
  const byId = await client.from('ac360_organizations')
    .select('id,org_code,display_name,status,metadata_json')
    .eq('id', school.id).maybeSingle()
  if (!byId.error && byId.data) return { orgId: s(byId.data.id), reason: 'ID organisation = ID établissement' }

  const byCode = await client.from('ac360_organizations')
    .select('id,org_code,display_name,status,metadata_json')
    .eq('org_code', school.school_code).limit(2)
  if (!byCode.error && (byCode.data || []).length === 1) {
    return { orgId: s(byCode.data[0].id), reason: 'Code organisation = code établissement' }
  }

  for (const key of ['angelcare360_school_id', 'legacySchoolId', 'schoolId']) {
    const probe = await client.from('ac360_organizations')
      .select('id,org_code,display_name,status,metadata_json')
      .contains('metadata_json', { [key]: school.id }).limit(2)
    if (!probe.error && (probe.data || []).length === 1) {
      return { orgId: s(probe.data[0].id), reason: `Liaison organisation confirmée par metadata_json.${key}` }
    }
  }
  return { orgId: null as string | null, reason: 'Aucune liaison déterministe avec ac360_organizations' }
}

async function countRows(client: any, table: string, column: string, id: string) {
  const { count, error } = await client.from(table).select('id', { head: true, count: 'exact' }).eq(column, id)
  if (error) return 0
  return count || 0
}

async function chooseAuthority(client: any, school: { id: string; school_code: string; name: string }) {
  const advanced = await resolveAdvancedOrg(client, school)
  const legacyCount = await countRows(client, 'angelcare360_transport_routes', 'school_id', school.id)
  let advancedCount = 0
  if (advanced.orgId) advancedCount = await countRows(client, 'ac360_school_transport_routes', 'org_id', advanced.orgId)

  if (advanced.orgId && advancedCount > 0) {
    return { authority: 'advanced' as TransportAuthority, orgId: advanced.orgId, reason: `${advanced.reason}; autorité Transport avancée déjà alimentée.` }
  }
  if (legacyCount > 0) {
    return { authority: 'legacy' as TransportAuthority, orgId: advanced.orgId, reason: advanced.orgId
      ? 'Données Transport historiques présentes; aucune donnée avancée n’est substituée silencieusement.'
      : 'Autorité Transport historique active pour cet établissement.' }
  }
  if (advanced.orgId) {
    return { authority: 'advanced' as TransportAuthority, orgId: advanced.orgId, reason: `${advanced.reason}; nouveau Transport dirigé vers l’autorité avancée.` }
  }
  return { authority: 'legacy' as TransportAuthority, orgId: null, reason: 'Aucune organisation avancée liée; autorité historique conservée.' }
}

function emptyIntegrity(message: string): TransportIntegrity {
  return {
    installed: false,
    safeForOperations: false,
    assignmentStopRouteMismatch: 0,
    assignmentCrossOrg: 0,
    routeReferenceCrossOrg: 0,
    runReferenceCrossOrg: 0,
    runEventReferenceCrossOrg: 0,
    safetyReferenceCrossOrg: 0,
    overCapacityRoutes: 0,
    message,
  }
}

async function loadIntegrity(client: any, orgId: string | null, authority: TransportAuthority) {
  if (authority !== 'advanced' || !orgId) {
    return emptyIntegrity('Le garde-fou avancé s’applique aux opérations d’exécution Transport; le tenant utilise actuellement l’autorité historique de planification.')
  }
  const { data, error } = await client.rpc('angelcare360_transport_integrity_status_v1', { p_org_id: orgId })
  if (error || !data) {
    return emptyIntegrity('Le garde-fou SQL SANILA Mobility n’est pas encore installé. Les opérations de course, sécurité et événements restent verrouillées.')
  }
  const row = (Array.isArray(data) ? data[0] : data) as Row
  return {
    installed: true,
    safeForOperations: bool(row.safeForOperations ?? row.safe_for_operations),
    assignmentStopRouteMismatch: n(row.assignmentStopRouteMismatch ?? row.assignment_stop_route_mismatch),
    assignmentCrossOrg: n(row.assignmentCrossOrg ?? row.assignment_cross_org),
    routeReferenceCrossOrg: n(row.routeReferenceCrossOrg ?? row.route_reference_cross_org),
    runReferenceCrossOrg: n(row.runReferenceCrossOrg ?? row.run_reference_cross_org),
    runEventReferenceCrossOrg: n(row.runEventReferenceCrossOrg ?? row.run_event_reference_cross_org),
    safetyReferenceCrossOrg: n(row.safetyReferenceCrossOrg ?? row.safety_reference_cross_org),
    overCapacityRoutes: n(row.overCapacityRoutes ?? row.over_capacity_routes),
    message: nullable(row.message) || undefined,
  } satisfies TransportIntegrity
}

async function queryRows(client: any, table: string, columns: string, column: string, id: string, order?: string) {
  let q = client.from(table).select(columns).eq(column, id).range(0, 9999)
  if (order) q = q.order(order, { ascending: true })
  const { data, error } = await q
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data || []) as Row[]
}

async function advancedRaw(client: any, orgId: string, schoolId: string) {
  const today = TODAY()
  const results = await Promise.all([
    queryRows(client, 'ac360_school_transport_routes', '*', 'org_id', orgId, 'route_code'),
    queryRows(client, 'ac360_school_transport_route_stops', '*', 'org_id', orgId, 'stop_order'),
    queryRows(client, 'ac360_school_transport_vehicles', '*', 'org_id', orgId, 'vehicle_code'),
    queryRows(client, 'ac360_school_transport_drivers', '*', 'org_id', orgId, 'full_name'),
    queryRows(client, 'ac360_school_transport_student_assignments', '*', 'org_id', orgId, 'starts_on'),
    queryRows(client, 'ac360_school_transport_route_runs', '*', 'org_id', orgId, 'run_date'),
    queryRows(client, 'ac360_school_transport_run_events', '*', 'org_id', orgId, 'occurred_at'),
    queryRows(client, 'ac360_school_transport_safety_checks', '*', 'org_id', orgId, 'checked_at'),
    queryRows(client, 'ac360_school_transport_alerts', '*', 'org_id', orgId, 'created_at'),
    queryRows(client, 'ac360_school_students', 'id,org_id,student_code,first_name,last_name,preferred_name,status,enrollment_status', 'org_id', orgId, 'first_name'),
    queryRows(client, 'ac360_school_staff_profiles', 'id,org_id,staff_code,full_name,phone,department,status,employment_status', 'org_id', orgId, 'full_name'),
    client.from('angelcare360_audit_logs')
      .select('id,action,entity_type,entity_id,severity,actor_role,created_at,metadata,module')
      .eq('school_id', schoolId).in('module', ['transport', 'mobilite']).order('created_at', { ascending: false }).limit(300),
  ])
  const audit = results[11]
  return {
    routes: results[0] as Row[], stops: results[1] as Row[], vehicles: results[2] as Row[], drivers: results[3] as Row[],
    assignments: results[4] as Row[], runs: results[5] as Row[], events: results[6] as Row[], safety: results[7] as Row[],
    alerts: results[8] as Row[], students: results[9] as Row[], staff: results[10] as Row[],
    audits: (audit.data || []) as Row[], today,
  }
}

async function legacyRaw(client: any, schoolId: string) {
  const results = await Promise.all([
    queryRows(client, 'angelcare360_transport_routes', '*', 'school_id', schoolId, 'route_code'),
    queryRows(client, 'angelcare360_transport_stops', '*', 'school_id', schoolId, 'order_index'),
    queryRows(client, 'angelcare360_transport_vehicles', '*', 'school_id', schoolId, 'vehicle_code'),
    queryRows(client, 'angelcare360_transport_assignments', '*', 'school_id', schoolId, 'assigned_on'),
    queryRows(client, 'angelcare360_students', 'id,school_id,student_code,full_name,status', 'school_id', schoolId, 'full_name'),
    queryRows(client, 'angelcare360_staff', 'id,school_id,staff_code,full_name,phone,department,status', 'school_id', schoolId, 'full_name'),
    client.from('angelcare360_audit_logs')
      .select('id,action,entity_type,entity_id,severity,actor_role,created_at,metadata,module')
      .eq('school_id', schoolId).in('module', ['transport', 'mobilite']).order('created_at', { ascending: false }).limit(300),
  ])
  return {
    routes: results[0] as Row[], stops: results[1] as Row[], vehicles: results[2] as Row[], assignments: results[3] as Row[],
    students: results[4] as Row[], staff: results[5] as Row[], audits: (results[6].data || []) as Row[],
    drivers: [] as Row[], runs: [] as Row[], events: [] as Row[], safety: [] as Row[], alerts: [] as Row[], today: TODAY(),
  }
}

function normalizeAdvanced(raw: any) {
  const routeById = new Map(raw.routes.map((r: Row) => [s(r.id), r]))
  const vehicleById = new Map(raw.vehicles.map((r: Row) => [s(r.id), r]))
  const driverById = new Map(raw.drivers.map((r: Row) => [s(r.id), r]))
  const stopById = new Map(raw.stops.map((r: Row) => [s(r.id), r]))
  const studentById = new Map(raw.students.map((r: Row) => [s(r.id), r]))
  const runById = new Map(raw.runs.map((r: Row) => [s(r.id), r]))

  const assignmentCounts = new Map<string, number>()
  const stopStudentCounts = new Map<string, number>()
  for (const a of raw.assignments) if (s(a.status) === 'active') {
    assignmentCounts.set(s(a.route_id), (assignmentCounts.get(s(a.route_id)) || 0) + 1)
    if (a.stop_id) stopStudentCounts.set(s(a.stop_id), (stopStudentCounts.get(s(a.stop_id)) || 0) + 1)
  }
  const stopCounts = new Map<string, number>()
  for (const st of raw.stops) if (s(st.status) !== 'archived') stopCounts.set(s(st.route_id), (stopCounts.get(s(st.route_id)) || 0) + 1)

  const routes: TransportRoute[] = raw.routes.map((r: Row) => {
    const vehicle = vehicleById.get(s(r.default_vehicle_id))
    const driver = driverById.get(s(r.default_driver_id))
    const assignments = assignmentCounts.get(s(r.id)) || 0
    const capacity = n(vehicle?.capacity)
    return {
      id: s(r.id), code: s(r.route_code), label: s(r.label), direction: s(r.direction, 'round_trip'),
      routeType: s(r.route_type, 'regular'), campusId: nullable(r.campus_id), vehicleId: nullable(r.default_vehicle_id),
      driverId: nullable(r.default_driver_id), vehicleLabel: vehicle ? s(vehicle.label || vehicle.vehicle_code) : null,
      driverName: driver ? s(driver.full_name) : null, status: s(r.status), stopCount: stopCounts.get(s(r.id)) || 0,
      assignmentCount: assignments, capacity, capacityPressure: capacity > 0 && assignments > capacity,
    }
  })
  const stops: TransportStop[] = raw.stops.map((r: Row) => {
    const route = routeById.get(s(r.route_id))
    return {
      id: s(r.id), routeId: s(r.route_id), routeCode: s(route?.route_code), routeLabel: s(route?.label),
      order: n(r.stop_order, 1), label: s(r.stop_label), zone: nullable(r.zone), address: nullable(r.address),
      plannedTime: nullable(r.planned_time), latitude: r.gps_lat == null ? null : n(r.gps_lat),
      longitude: r.gps_lng == null ? null : n(r.gps_lng), status: s(r.status), studentCount: stopStudentCounts.get(s(r.id)) || 0,
    }
  })
  const vehicles: TransportVehicle[] = raw.vehicles.map((r: Row) => ({
    id: s(r.id), code: s(r.vehicle_code), label: s(r.label || r.vehicle_code), vehicleType: s(r.vehicle_type, 'bus'),
    plateNumber: nullable(r.plate_number), capacity: n(r.capacity), seatbeltCount: n(r.seatbelt_count),
    insuranceExpiry: nullable(r.insurance_expiry), inspectionExpiry: nullable(r.inspection_expiry), status: s(r.status),
    routeCount: raw.routes.filter((x: Row) => s(x.default_vehicle_id) === s(r.id) && s(x.status) === 'active').length,
    assignmentCount: routes.filter(x => x.vehicleId === s(r.id)).reduce((sum, x) => sum + x.assignmentCount, 0),
  }))
  const drivers: TransportDriver[] = raw.drivers.map((r: Row) => ({
    id: s(r.id), code: s(r.driver_code), fullName: s(r.full_name), phone: nullable(r.phone), staffId: nullable(r.staff_id),
    licenseNumber: nullable(r.license_number), licenseExpiry: nullable(r.license_expiry), status: s(r.status),
    routeCount: raw.routes.filter((x: Row) => s(x.default_driver_id) === s(r.id) && s(x.status) === 'active').length,
    runCountToday: raw.runs.filter((x: Row) => s(x.driver_id) === s(r.id) && s(x.run_date) === raw.today).length,
  }))
  const students: TransportStudent[] = raw.students.map((r: Row) => ({ id: s(r.id), code: s(r.student_code), fullName: fullStudentName(r), status: s(r.status) }))
  const staff: TransportStaff[] = raw.staff.map((r: Row) => ({ id: s(r.id), code: s(r.staff_code), fullName: s(r.full_name), phone: nullable(r.phone), department: nullable(r.department), status: s(r.status) }))
  const assignments: TransportAssignment[] = raw.assignments.map((r: Row) => {
    const student = studentById.get(s(r.student_id)); const route = routeById.get(s(r.route_id)); const stop = stopById.get(s(r.stop_id))
    return {
      id: s(r.id), studentId: s(r.student_id), studentName: student ? fullStudentName(student) : 'Élève non résolu',
      studentCode: s(student?.student_code, '—'), routeId: s(r.route_id), routeCode: s(route?.route_code, '—'),
      routeLabel: s(route?.label, 'Circuit non résolu'), stopId: nullable(r.stop_id), stopLabel: stop ? s(stop.stop_label) : null,
      serviceDirection: s(r.service_direction), monthlyFeeMad: n(r.monthly_fee_mad), startsOn: nullable(r.starts_on),
      endsOn: nullable(r.ends_on), status: s(r.status),
    }
  })
  const safetyByRun = new Map<string, Row>()
  for (const c of [...raw.safety].sort((a: Row,b: Row) => s(b.checked_at).localeCompare(s(a.checked_at)))) if (c.route_run_id && !safetyByRun.has(s(c.route_run_id))) safetyByRun.set(s(c.route_run_id), c)
  const eventCounts = new Map<string, number>(); for (const e of raw.events) eventCounts.set(s(e.route_run_id), (eventCounts.get(s(e.route_run_id)) || 0) + 1)
  const runs: TransportRun[] = raw.runs.map((r: Row) => {
    const route=routeById.get(s(r.route_id)); const vehicle=vehicleById.get(s(r.vehicle_id)); const driver=driverById.get(s(r.driver_id))
    return {
      id:s(r.id), routeId:s(r.route_id), routeCode:s(route?.route_code,'—'), routeLabel:s(route?.label,'Circuit non résolu'),
      vehicleId:nullable(r.vehicle_id), vehicleLabel:vehicle?s(vehicle.label||vehicle.vehicle_code):null,
      driverId:nullable(r.driver_id), driverName:driver?s(driver.full_name):null, runDate:s(r.run_date), runType:s(r.run_type),
      plannedStartAt:nullable(r.planned_start_at), startedAt:nullable(r.started_at), endedAt:nullable(r.ended_at), status:s(r.status),
      notes:nullable(r.notes), eventCount:eventCounts.get(s(r.id))||0, safetyResult:nullable(safetyByRun.get(s(r.id))?.result),
    }
  })
  const events: TransportRunEvent[] = raw.events.map((e: Row) => {
    const student=studentById.get(s(e.student_id)); const stop=stopById.get(s(e.stop_id))
    return { id:s(e.id), routeRunId:s(e.route_run_id), studentId:nullable(e.student_id), studentName:student?fullStudentName(student):null,
      stopId:nullable(e.stop_id), stopLabel:stop?s(stop.stop_label):null, eventType:s(e.event_type), occurredAt:s(e.occurred_at), status:s(e.status), notes:nullable(e.notes) }
  })
  const safetyChecks: TransportSafetyCheck[] = raw.safety.map((c: Row) => {
    const v=vehicleById.get(s(c.vehicle_id)); const d=driverById.get(s(c.driver_id))
    return { id:s(c.id), vehicleId:nullable(c.vehicle_id), vehicleLabel:v?s(v.label||v.vehicle_code):null, driverId:nullable(c.driver_id),
      driverName:d?s(d.full_name):null, routeRunId:nullable(c.route_run_id), checkType:s(c.check_type), result:s(c.result),
      checkedAt:s(c.checked_at), notes:nullable(c.notes) }
  })
  const alerts: TransportAlert[] = raw.alerts.map((a: Row) => ({ id:s(a.id), key:s(a.alert_key), severity:s(a.severity), entityType:nullable(a.entity_type), entityId:nullable(a.entity_id), title:s(a.title), message:nullable(a.message), status:s(a.status), createdAt:s(a.created_at), resolvedAt:nullable(a.resolved_at) }))
  const audits: TransportAuditEvent[] = raw.audits.map((a: Row) => ({ id:s(a.id), action:s(a.action), entityType:nullable(a.entity_type), entityId:nullable(a.entity_id), severity:s(a.severity), actorRole:nullable(a.actor_role), createdAt:s(a.created_at), metadata:(a.metadata||null) as Record<string,unknown>|null }))
  return { routes, stops, vehicles, drivers, students, staff, assignments, runs, events, safetyChecks, alerts, audits }
}

function normalizeLegacy(raw: any) {
  const routeById=new Map(raw.routes.map((r:Row)=>[s(r.id),r])); const vehicleById=new Map(raw.vehicles.map((r:Row)=>[s(r.id),r])); const studentById=new Map(raw.students.map((r:Row)=>[s(r.id),r])); const stopById=new Map(raw.stops.map((r:Row)=>[s(r.id),r]))
  const assignmentCounts=new Map<string,number>(); const stopStudentCounts=new Map<string,number>()
  for (const a of raw.assignments) if (s(a.status)==='active') { assignmentCounts.set(s(a.route_id),(assignmentCounts.get(s(a.route_id))||0)+1); if(a.pickup_stop_id) stopStudentCounts.set(s(a.pickup_stop_id),(stopStudentCounts.get(s(a.pickup_stop_id))||0)+1) }
  const stopCounts=new Map<string,number>(); for (const st of raw.stops) if(s(st.status)!=='archived') stopCounts.set(s(st.route_id),(stopCounts.get(s(st.route_id))||0)+1)
  const staffById=new Map(raw.staff.map((r:Row)=>[s(r.id),r]))
  const routes:TransportRoute[]=raw.routes.map((r:Row)=>{const v=vehicleById.get(s(r.vehicle_id));const d=staffById.get(s(r.responsible_staff_id));const ac=assignmentCounts.get(s(r.id))||0;const cap=n(r.capacity_seats??v?.capacity_seats);return{id:s(r.id),code:s(r.route_code),label:s(r.label),direction:'round_trip',routeType:s(r.route_type,'school_bus'),vehicleId:nullable(r.vehicle_id),driverId:nullable(r.responsible_staff_id),vehicleLabel:v?s(v.model||v.vehicle_code):null,driverName:d?s(d.full_name):null,status:s(r.status),stopCount:stopCounts.get(s(r.id))||0,assignmentCount:ac,capacity:cap,capacityPressure:cap>0&&ac>cap}})
  const stops:TransportStop[]=raw.stops.map((r:Row)=>{const route=routeById.get(s(r.route_id));return{id:s(r.id),routeId:s(r.route_id),routeCode:s(route?.route_code),routeLabel:s(route?.label),order:n(r.order_index,1),label:s(r.label),plannedTime:nullable(r.planned_time),latitude:r.latitude==null?null:n(r.latitude),longitude:r.longitude==null?null:n(r.longitude),status:s(r.status),studentCount:stopStudentCounts.get(s(r.id))||0}})
  const vehicles:TransportVehicle[]=raw.vehicles.map((r:Row)=>({id:s(r.id),code:s(r.vehicle_code),label:s(r.model||r.vehicle_code),vehicleType:'school_bus',plateNumber:nullable(r.plate_number),capacity:n(r.capacity_seats),seatbeltCount:0,insuranceExpiry:nullable(r.insurance_expires_on),inspectionExpiry:null,status:s(r.status),routeCount:routes.filter(x=>x.vehicleId===s(r.id)&&x.status==='active').length,assignmentCount:routes.filter(x=>x.vehicleId===s(r.id)).reduce((sum,x)=>sum+x.assignmentCount,0)}))
  const students:TransportStudent[]=raw.students.map((r:Row)=>({id:s(r.id),code:s(r.student_code),fullName:s(r.full_name,'Élève'),status:s(r.status)}))
  const staff:TransportStaff[]=raw.staff.map((r:Row)=>({id:s(r.id),code:s(r.staff_code),fullName:s(r.full_name),phone:nullable(r.phone),department:nullable(r.department),status:s(r.status)}))
  const assignments:TransportAssignment[]=raw.assignments.map((r:Row)=>{const st=studentById.get(s(r.student_id));const route=routeById.get(s(r.route_id));const stop=stopById.get(s(r.pickup_stop_id));return{id:s(r.id),studentId:s(r.student_id),studentName:s(st?.full_name,'Élève non résolu'),studentCode:s(st?.student_code,'—'),routeId:s(r.route_id),routeCode:s(route?.route_code,'—'),routeLabel:s(route?.label,'Circuit non résolu'),stopId:nullable(r.pickup_stop_id),stopLabel:stop?s(stop.label):null,serviceDirection:'round_trip',monthlyFeeMad:0,startsOn:nullable(r.assigned_on),endsOn:null,status:s(r.status)}})
  const audits:TransportAuditEvent[]=raw.audits.map((a:Row)=>({id:s(a.id),action:s(a.action),entityType:nullable(a.entity_type),entityId:nullable(a.entity_id),severity:s(a.severity),actorRole:nullable(a.actor_role),createdAt:s(a.created_at),metadata:(a.metadata||null) as Record<string,unknown>|null}))
  return {routes,stops,vehicles,drivers:[] as TransportDriver[],students,staff,assignments,runs:[] as TransportRun[],events:[] as TransportRunEvent[],safetyChecks:[] as TransportSafetyCheck[],alerts:[] as TransportAlert[],audits}
}

export async function getTransportMobilitySnapshot(options?: { schoolId?: string | null }): Promise<TransportSnapshot> {
  const ctx=await access('transport.view',options?.schoolId)
  const client=await createClient()
  const choice=await chooseAuthority(client,ctx.school!)
  const raw=choice.authority==='advanced'&&choice.orgId ? await advancedRaw(client,choice.orgId,ctx.school!.id) : await legacyRaw(client,ctx.school!.id)
  const normalized=choice.authority==='advanced'?normalizeAdvanced(raw):normalizeLegacy(raw)
  const integrity=await loadIntegrity(client,choice.orgId,choice.authority)
  const routes=normalized.routes
  const today=TODAY()
  const metrics={
    routes:routes.length,activeRoutes:routes.filter(x=>x.status==='active').length,stops:normalized.stops.length,vehicles:normalized.vehicles.length,
    activeVehicles:normalized.vehicles.filter(x=>x.status==='active').length,drivers:normalized.drivers.length,activeDrivers:normalized.drivers.filter(x=>x.status==='active').length,
    assignments:normalized.assignments.length,activeAssignments:normalized.assignments.filter(x=>x.status==='active').length,
    runsToday:normalized.runs.filter(x=>x.runDate===today).length,runsOpen:normalized.runs.filter(x=>x.runDate===today&&['planned','started','in_progress','incident'].includes(x.status)).length,
    runsCompleted:normalized.runs.filter(x=>x.runDate===today&&x.status==='completed').length,
    failedSafetyChecks:normalized.safetyChecks.filter(x=>x.checkedAt.slice(0,10)===today&&['failed','blocked'].includes(x.result)).length,
    openAlerts:normalized.alerts.filter(x=>['open','acknowledged'].includes(x.status)).length,
    routesWithoutStops:routes.filter(x=>x.status==='active'&&x.stopCount===0).length,routesWithoutDriver:routes.filter(x=>x.status==='active'&&!x.driverId).length,
    routesWithoutVehicle:routes.filter(x=>x.status==='active'&&!x.vehicleId).length,capacityWarnings:routes.filter(x=>x.capacityPressure).length,
  }
  return { schoolId:ctx.school!.id,schoolName:ctx.school!.name,schoolCode:ctx.school!.school_code,timezone:ctx.school!.timezone||'Africa/Casablanca',
    authority:choice.authority,authorityOrgId:choice.orgId,authorityReason:choice.reason,advancedAvailable:Boolean(choice.orgId),integrity,metrics,...normalized,
    gpsLiveAvailable:false,externalParentNotificationsAvailable:false }
}

async function requireAdvancedMutation(permission: string, schoolId?: string | null) {
  const ctx=await access(permission,schoolId)
  const client=await createClient()
  const choice=await chooseAuthority(client,ctx.school!)
  if (choice.authority!=='advanced'||!choice.orgId) return { ctx,client,choice,locked:'Les opérations d’exécution avancées nécessitent une liaison active avec l’autorité Transport ac360_school_*.' }
  const integrity=await loadIntegrity(client,choice.orgId,'advanced')
  if (!integrity.installed||!integrity.safeForOperations) return { ctx,client,choice,locked:integrity.message||'Le garde-fou d’intégrité Transport doit être appliqué avant cette opération.' }
  return { ctx,client,choice,locked:null as string|null }
}

function resultError(error: any): TransportMutationResult { return {ok:false,error:error?.message||String(error||'Erreur Transport')} }
function rpcId(data:any,...keys:string[]){for(const key of keys){if(data&&data[key])return s(data[key])}return null}

export async function transportMutation(input: Record<string,unknown>): Promise<TransportMutationResult> {
  const action=s(input.action)
  const schoolId=nullable(input.schoolId)
  const permission=action.includes('view')?'transport.view':'transport.manage'
  const ctx=await access(permission,schoolId)
  const client=await createClient()
  const choice=await chooseAuthority(client,ctx.school!)
  const actor=ctx.user.id

  try {
    if (choice.authority==='advanced'&&choice.orgId) {
      const orgId=choice.orgId
      if (action==='route.upsert') {
        const vehicleId=nullable(input.vehicleId); const driverId=nullable(input.driverId)
        if(vehicleId){const {count}=await client.from('ac360_school_transport_vehicles').select('id',{head:true,count:'exact'}).eq('id',vehicleId).eq('org_id',orgId);if(!count)return{ok:false,error:'Le véhicule sélectionné n’appartient pas à cette organisation.'}}
        if(driverId){const {count}=await client.from('ac360_school_transport_drivers').select('id',{head:true,count:'exact'}).eq('id',driverId).eq('org_id',orgId);if(!count)return{ok:false,error:'Le chauffeur sélectionné n’appartient pas à cette organisation.'}}
        const {data,error}=await client.rpc('ac360_school_upsert_transport_route',{p_org_id:orgId,p_route_id:nullable(input.id),p_route_code:nullable(input.code),p_label:nullable(input.label),p_direction:s(input.direction,'round_trip'),p_route_type:s(input.routeType,'regular'),p_default_vehicle_id:vehicleId,p_default_driver_id:driverId,p_status:s(input.status,'active'),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error); const id=rpcId(data,'routeId'); if(id)await audit({schoolId:ctx.school!.id,action:'transport.route.upsert',entityType:'transport_route',entityId:id,metadata:{authority:'advanced'}}); return {ok:true,id}
      }
      if (action==='stop.upsert') {
        const routeId=s(input.routeId); if(!routeId)return{ok:false,error:'Circuit requis.'}
        const {count:routeCount}=await client.from('ac360_school_transport_routes').select('id',{head:true,count:'exact'}).eq('id',routeId).eq('org_id',orgId);if(!routeCount)return{ok:false,error:'Le circuit sélectionné n’appartient pas à cette organisation.'}
        const {data,error}=await client.rpc('ac360_school_upsert_transport_route_stop',{p_org_id:orgId,p_route_id:routeId,p_stop_id:nullable(input.id),p_stop_order:n(input.order,1),p_stop_label:nullable(input.label),p_zone:nullable(input.zone),p_address:nullable(input.address),p_planned_time:nullable(input.plannedTime),p_gps_lat:input.latitude==null?null:n(input.latitude),p_gps_lng:input.longitude==null?null:n(input.longitude),p_status:s(input.status,'active'),p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error); const id=rpcId(data,'stopId'); if(id)await audit({schoolId:ctx.school!.id,action:'transport.stop.upsert',entityType:'transport_stop',entityId:id,metadata:{authority:'advanced',routeId}}); return{ok:true,id}
      }
      if (action==='vehicle.upsert') {
        const {data,error}=await client.rpc('ac360_school_upsert_transport_vehicle',{p_org_id:orgId,p_vehicle_id:nullable(input.id),p_vehicle_code:nullable(input.code),p_label:nullable(input.label),p_vehicle_type:s(input.vehicleType,'bus'),p_plate_number:nullable(input.plateNumber),p_capacity:n(input.capacity),p_seatbelt_count:n(input.seatbeltCount),p_insurance_expiry:nullable(input.insuranceExpiry),p_inspection_expiry:nullable(input.inspectionExpiry),p_status:s(input.status,'active'),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);const id=rpcId(data,'vehicleId');if(id)await audit({schoolId:ctx.school!.id,action:'transport.vehicle.upsert',entityType:'transport_vehicle',entityId:id,metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (action==='driver.upsert') {
        const staffId=nullable(input.staffId);if(staffId){const {count}=await client.from('ac360_school_staff_profiles').select('id',{head:true,count:'exact'}).eq('id',staffId).eq('org_id',orgId);if(!count)return{ok:false,error:'Le membre du personnel sélectionné n’appartient pas à cette organisation.'}}
        const {data,error}=await client.rpc('ac360_school_upsert_transport_driver',{p_org_id:orgId,p_driver_id:nullable(input.id),p_staff_id:staffId,p_driver_code:nullable(input.code),p_full_name:nullable(input.fullName),p_phone:nullable(input.phone),p_license_number:nullable(input.licenseNumber),p_license_expiry:nullable(input.licenseExpiry),p_status:s(input.status,'active'),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);const id=rpcId(data,'driverId');if(id)await audit({schoolId:ctx.school!.id,action:'transport.driver.upsert',entityType:'transport_driver',entityId:id,metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (['assignment.upsert','run.open','run.close','event.record','safety.record'].includes(action)) {
        const gated=await requireAdvancedMutation('transport.manage',ctx.school!.id)
        if(gated.locked)return{ok:false,locked:true,error:gated.locked}
      }
      if (action==='assignment.upsert') {
        const {data,error}=await client.rpc('angelcare360_transport_assign_student_v1',{p_org_id:orgId,p_student_id:s(input.studentId),p_route_id:s(input.routeId),p_stop_id:nullable(input.stopId),p_service_direction:s(input.serviceDirection,'round_trip'),p_monthly_fee_mad:n(input.monthlyFeeMad),p_starts_on:nullable(input.startsOn)||TODAY(),p_ends_on:nullable(input.endsOn),p_status:s(input.status,'active'),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);const id=rpcId(data,'assignmentId');if(id)await audit({schoolId:ctx.school!.id,action:'transport.assignment.upsert',entityType:'transport_assignment',entityId:id,metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (action==='run.open') {
        const {data,error}=await client.rpc('angelcare360_transport_open_run_v1',{p_org_id:orgId,p_route_id:s(input.routeId),p_vehicle_id:nullable(input.vehicleId),p_driver_id:nullable(input.driverId),p_run_date:nullable(input.runDate)||TODAY(),p_run_type:s(input.runType,'pickup'),p_planned_start_at:nullable(input.plannedStartAt),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);if(data?.ok===false)return{ok:false,error:s(data.error)};const id=rpcId(data,'routeRunId');if(id)await audit({schoolId:ctx.school!.id,action:'transport.run.open',entityType:'transport_route_run',entityId:id,severity:'notice',metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (action==='run.close') {
        const {data,error}=await client.rpc('angelcare360_transport_close_run_v1',{p_org_id:orgId,p_route_run_id:s(input.runId),p_status:s(input.status,'completed'),p_notes:nullable(input.notes),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);if(data?.ok===false)return{ok:false,error:s(data.error)};const id=rpcId(data,'routeRunId')||s(input.runId);await audit({schoolId:ctx.school!.id,action:'transport.run.close',entityType:'transport_route_run',entityId:id,severity:'notice',metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (action==='event.record') {
        const {data,error}=await client.rpc('angelcare360_transport_record_run_event_v1',{p_org_id:orgId,p_route_run_id:s(input.runId),p_student_id:nullable(input.studentId),p_stop_id:nullable(input.stopId),p_event_type:s(input.eventType,'run_note'),p_occurred_at:new Date().toISOString(),p_status:'recorded',p_notes:nullable(input.notes),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);if(data?.ok===false)return{ok:false,error:s(data.error)};const id=rpcId(data,'eventId');if(id)await audit({schoolId:ctx.school!.id,action:`transport.event.${s(input.eventType)}`,entityType:'transport_run_event',entityId:id,metadata:{authority:'advanced',runId:s(input.runId)}});return{ok:true,id}
      }
      if (action==='safety.record') {
        const {data,error}=await client.rpc('angelcare360_transport_record_safety_check_v1',{p_org_id:orgId,p_vehicle_id:nullable(input.vehicleId),p_driver_id:nullable(input.driverId),p_route_run_id:nullable(input.runId),p_check_type:s(input.checkType,'pre_route'),p_result:s(input.result,'passed'),p_checked_at:new Date().toISOString(),p_checked_by_staff_id:nullable(input.checkedByStaffId),p_notes:nullable(input.notes),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);if(data?.ok===false)return{ok:false,error:s(data.error)};const id=rpcId(data,'safetyCheckId');if(id)await audit({schoolId:ctx.school!.id,action:'transport.safety.record',entityType:'transport_safety_check',entityId:id,severity:['failed','blocked'].includes(s(input.result))?'warning':'info',metadata:{authority:'advanced'}});return{ok:true,id}
      }
      if (action==='alert.resolve') {
        const {data,error}=await client.rpc('ac360_school_resolve_transport_alert',{p_org_id:orgId,p_alert_id:s(input.alertId),p_resolution_note:nullable(input.notes),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);if(data?.ok===false)return{ok:false,error:s(data.error)};return{ok:true,id:s(input.alertId)}
      }
      if (action==='runtime.reconcile') {
        const {data,error}=await client.rpc('ac360_school_reconcile_transport_runtime',{p_org_id:orgId,p_as_of_date:TODAY(),p_actor_app_user_id:actor,p_metadata:{source:'sanila_mobility'}})
        if(error)return resultError(error);return{ok:true,record:data}
      }
      return{ok:false,error:'Action Transport avancée inconnue.'}
    }

    // Legacy planning authority: deliberately limited to planning CRUD. No fake runs/safety/GPS.
    const school=ctx.school!.id
    if(action==='route.upsert'){
      const id=nullable(input.id); const row={school_id:school,route_code:s(input.code),label:s(input.label),route_type:s(input.routeType,'school_bus'),responsible_staff_id:nullable(input.driverId),vehicle_id:nullable(input.vehicleId),capacity_seats:n(input.capacity),status:s(input.status,'active'),updated_by:actor}
      const q=id?client.from('angelcare360_transport_routes').update(row).eq('id',id).eq('school_id',school).select('id').maybeSingle():client.from('angelcare360_transport_routes').insert({...row,created_by:actor}).select('id').single()
      const {data,error}=await q;if(error)return resultError(error);const rid=s(data?.id);if(rid)await audit({schoolId:school,action:'transport.route.upsert',entityType:'transport_route',entityId:rid,metadata:{authority:'legacy'}});return{ok:true,id:rid}
    }
    if(action==='stop.upsert'){
      const id=nullable(input.id);const row={school_id:school,route_id:s(input.routeId),stop_code:s(input.code)||`STOP-${Date.now()}`,label:s(input.label),order_index:n(input.order,1),latitude:input.latitude==null?null:n(input.latitude),longitude:input.longitude==null?null:n(input.longitude),planned_time:nullable(input.plannedTime),status:s(input.status,'active'),updated_by:actor}
      const q=id?client.from('angelcare360_transport_stops').update(row).eq('id',id).eq('school_id',school).select('id').maybeSingle():client.from('angelcare360_transport_stops').insert({...row,created_by:actor}).select('id').single()
      const {data,error}=await q;if(error)return resultError(error);return{ok:true,id:s(data?.id)}
    }
    if(action==='vehicle.upsert'){
      const id=nullable(input.id);const row={school_id:school,vehicle_code:s(input.code),plate_number:s(input.plateNumber),model:s(input.label),capacity_seats:n(input.capacity),assigned_driver_staff_id:nullable(input.driverId),insurance_expires_on:nullable(input.insuranceExpiry),status:s(input.status,'active'),updated_by:actor}
      const q=id?client.from('angelcare360_transport_vehicles').update(row).eq('id',id).eq('school_id',school).select('id').maybeSingle():client.from('angelcare360_transport_vehicles').insert({...row,created_by:actor}).select('id').single()
      const {data,error}=await q;if(error)return resultError(error);return{ok:true,id:s(data?.id)}
    }
    if(action==='assignment.upsert'){
      const id=nullable(input.id);const row={school_id:school,academic_year_id:ctx.academicYear?.id,route_id:s(input.routeId),student_id:s(input.studentId),vehicle_id:nullable(input.vehicleId),pickup_stop_id:nullable(input.stopId),dropoff_stop_id:nullable(input.dropoffStopId)||nullable(input.stopId),assigned_on:nullable(input.startsOn)||TODAY(),status:s(input.status,'active'),updated_by:actor}
      if(!row.academic_year_id)return{ok:false,error:'Année scolaire active requise.'}
      const q=id?client.from('angelcare360_transport_assignments').update(row).eq('id',id).eq('school_id',school).select('id').maybeSingle():client.from('angelcare360_transport_assignments').insert({...row,created_by:actor}).select('id').single()
      const {data,error}=await q;if(error)return resultError(error);return{ok:true,id:s(data?.id)}
    }
    return{ok:false,locked:true,error:'Cette opération appartient au moteur Transport avancé. Elle reste verrouillée tant que l’établissement n’est pas lié à ac360_school_transport_*.'}
  } catch(error){return resultError(error)}
}

export async function getTransportRouteDossier(id:string, options?:{schoolId?:string|null}){
  const snapshot=await getTransportMobilitySnapshot(options);const route=snapshot.routes.find(x=>x.id===id);if(!route)return null
  return{snapshot,route,stops:snapshot.stops.filter(x=>x.routeId===id).sort((a,b)=>a.order-b.order),assignments:snapshot.assignments.filter(x=>x.routeId===id),runs:snapshot.runs.filter(x=>x.routeId===id)}
}
export async function getTransportVehicleDossier(id:string,options?:{schoolId?:string|null}){const snapshot=await getTransportMobilitySnapshot(options);const vehicle=snapshot.vehicles.find(x=>x.id===id);if(!vehicle)return null;return{snapshot,vehicle,routes:snapshot.routes.filter(x=>x.vehicleId===id),runs:snapshot.runs.filter(x=>x.vehicleId===id),safety:snapshot.safetyChecks.filter(x=>x.vehicleId===id)}}
export async function getTransportDriverDossier(id:string,options?:{schoolId?:string|null}){const snapshot=await getTransportMobilitySnapshot(options);const driver=snapshot.drivers.find(x=>x.id===id);if(!driver)return null;return{snapshot,driver,routes:snapshot.routes.filter(x=>x.driverId===id),runs:snapshot.runs.filter(x=>x.driverId===id),safety:snapshot.safetyChecks.filter(x=>x.driverId===id)}}
export async function getTransportRunDossier(id:string,options?:{schoolId?:string|null}){const snapshot=await getTransportMobilitySnapshot(options);const run=snapshot.runs.find(x=>x.id===id);if(!run)return null;const route=snapshot.routes.find(x=>x.id===run.routeId)||null;return{snapshot,run,route,stops:route?snapshot.stops.filter(x=>x.routeId===route.id).sort((a,b)=>a.order-b.order):[],assignments:route?snapshot.assignments.filter(x=>x.routeId===route.id&&x.status==='active'):[],events:snapshot.events.filter(x=>x.routeRunId===id).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)),safety:snapshot.safetyChecks.filter(x=>x.routeRunId===id)}}
