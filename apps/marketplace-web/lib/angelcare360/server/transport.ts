import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360TransportAssignmentCancelSchema,
  angelcare360TransportAssignmentCreateSchema,
  angelcare360TransportAssignmentUpdateSchema,
  angelcare360TransportAuditQueryFiltersSchema,
  angelcare360TransportRouteSchema,
  angelcare360TransportRouteStatusChangeSchema,
  angelcare360TransportRouteUpdateSchema,
  angelcare360TransportStopCreateSchema,
  angelcare360TransportStopUpdateSchema,
  angelcare360TransportVehicleCreateSchema,
  angelcare360TransportVehicleStatusChangeSchema,
  angelcare360TransportVehicleUpdateSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360AuditRecord,
} from '@/types/angelcare360/audit'
import type {
  Angelcare360TransportAssignmentListRecord,
  Angelcare360TransportAssignmentRecord,
  Angelcare360TransportAuditFilter,
  Angelcare360TransportDropoffListRecord,
  Angelcare360TransportMutationResult,
  Angelcare360TransportNotificationReadinessRecord,
  Angelcare360TransportOperationReadinessStatus,
  Angelcare360TransportOverviewRecord,
  Angelcare360TransportPickupListRecord,
  Angelcare360TransportReadinessCheckpointRecord,
  Angelcare360TransportRouteListRecord,
  Angelcare360TransportRouteRecord,
  Angelcare360TransportSafetyReadinessRecord,
  Angelcare360TransportStopListRecord,
  Angelcare360TransportStopRecord,
  Angelcare360TransportVehicleListRecord,
  Angelcare360TransportVehicleRecord,
} from '@/types/angelcare360/transport'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Angelcare360AccessContext = NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>>
type Angelcare360AccessContextWithSchool = Angelcare360AccessContext & {
  school: NonNullable<Angelcare360AccessContext['school']>
}
type Row = Record<string, any>

const TRANSPORT_MODULE = 'transport'
const GPS_BLOCKED_MESSAGE = 'Le suivi GPS sera activé après configuration d’un fournisseur de cartographie.'
const GPS_LIVE_TRACKING_MESSAGE = 'Le suivi temps réel des véhicules n’est pas encore activé.'
const NOTIFICATIONS_BLOCKED_MESSAGE = 'L’envoi automatique aux parents sera activé avec le module Messagerie.'
const NOTIFICATIONS_SIMULATION_MESSAGE = 'Les notifications WhatsApp/SMS ne doivent pas être simulées.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function asTimeText(value?: string | null) {
  if (!value) return null
  const parsed = String(value).trim()
  if (!parsed) return null
  return parsed.length === 5 ? `${parsed}:00` : parsed
}

function baseRecordFields(row: Row) {
  const createdAt = asString(row.created_at || new Date().toISOString())
  return {
    created_at: createdAt,
    updated_at: asString(row.updated_at || row.created_at || createdAt),
  }
}

function buildDetailHref(basePath: string, id: string) {
  return `${basePath}/${id}`
}

function pickRecord(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Row
}

function asTransportStatus(value: unknown) {
  return asString(value || 'active')
}

function groupRows(rows: Row[], key: string) {
  const map = new Map<string, Row[]>()
  for (const row of rows) {
    const groupKey = asString(row[key])
    if (!groupKey) continue
    const current = map.get(groupKey) || []
    current.push(row)
    map.set(groupKey, current)
  }
  return map
}

function countMap(rows: Row[], key: string) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const groupKey = asString(row[key])
    if (!groupKey) continue
    map.set(groupKey, (map.get(groupKey) || 0) + 1)
  }
  return map
}

async function getContextOrThrow(permissionKey?: string, schoolId?: string | null): Promise<Angelcare360AccessContextWithSchool> {
  if (permissionKey) {
    const context = await requireAngelcare360Permission(permissionKey, { schoolId })
    if (!context.school) {
      throw new Error('Aucun établissement actif n’est disponible.')
    }
    return context as Angelcare360AccessContextWithSchool
  }

  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  if (!context?.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context as Angelcare360AccessContextWithSchool
}

async function auditTransportEvent(input: {
  module?: string
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  category?: 'transport' | 'security' | 'settings'
}) {
  return recordAngelcare360AuditEventServer({
    category: input.category || 'transport',
    module: input.module || TRANSPORT_MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

function makeReadinessCheckpoint(
  key: string,
  label: string,
  condition: boolean,
  blockedReason: string,
  readyReason = 'Contrôle validé.',
): Angelcare360TransportReadinessCheckpointRecord {
  return {
    key,
    label,
    status: condition ? 'ready' : 'incomplete',
    reason: condition ? readyReason : blockedReason,
  }
}

function buildRouteRecord(row: Row, stopsByRoute: Map<string, Row[]>, assignmentsByRoute: Map<string, Row[]>, vehicleMap: Map<string, Row>, staffMap: Map<string, Row>): Angelcare360TransportRouteListRecord {
  const stops = stopsByRoute.get(asString(row.id)) || []
  const assignments = assignmentsByRoute.get(asString(row.id)) || []
  const vehicle = row.vehicle_id ? pickRecord(vehicleMap.get(asString(row.vehicle_id))) : null
  const driver = row.responsible_staff_id ? pickRecord(staffMap.get(asString(row.responsible_staff_id))) : null
  const accompanateur = row.accompagnateur_staff_id ? pickRecord(staffMap.get(asString(row.accompagnateur_staff_id))) : null
  const capacitySeats = row.capacity_seats === null || row.capacity_seats === undefined ? vehicle?.capacity_seats ?? null : Number(row.capacity_seats)
  const capacityWarning = Boolean(capacitySeats && assignments.filter((assignment) => !['cancelled', 'archived', 'inactive'].includes(asString(assignment.status))).length > capacitySeats)
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    route_code: asString(row.route_code),
    label: asString(row.label),
    route_type: asString(row.route_type || 'school_bus'),
    responsible_staff_id: row.responsible_staff_id ? asString(row.responsible_staff_id) : null,
    accompagnateur_staff_id: row.accompagnateur_staff_id ? asString(row.accompagnateur_staff_id) : null,
    vehicle_id: row.vehicle_id ? asString(row.vehicle_id) : null,
    capacity_seats: capacitySeats === null || Number.isNaN(Number(capacitySeats)) ? null : Number(capacitySeats),
    status: asTransportStatus(row.status),
    responsible_staff_full_name: driver?.full_name ? asString(driver.full_name) : null,
    accompagnateur_staff_full_name: accompanateur?.full_name ? asString(accompanateur.full_name) : null,
    vehicle_code: vehicle?.vehicle_code ? asString(vehicle.vehicle_code) : null,
    vehicle_plate_number: vehicle?.plate_number ? asString(vehicle.plate_number) : null,
    vehicle_capacity_seats: vehicle?.capacity_seats === undefined ? null : Number(vehicle.capacity_seats),
    stop_count: stops.length,
    active_stop_count: stops.filter((stop) => asString(stop.status) === 'active').length,
    assignment_count: assignments.length,
    active_assignment_count: assignments.filter((assignment) => ['active', 'pending', 'suspended'].includes(asString(assignment.status))).length,
    capacity_warning: capacityWarning,
    missing_driver: !row.responsible_staff_id,
    missing_accompagnateur: !row.accompagnateur_staff_id,
    detail_href: buildDetailHref('/angelcare-360-command-center/transport/circuits', asString(row.id)),
  }
}

function buildStopRecord(row: Row, routeMap: Map<string, Row>): Angelcare360TransportStopListRecord {
  const route = pickRecord(routeMap.get(asString(row.route_id)))
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    route_id: asString(row.route_id),
    stop_code: asString(row.stop_code),
    label: asString(row.label),
    order_index: Number(row.order_index || 0),
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    planned_time: row.planned_time ? asTimeText(String(row.planned_time)) : null,
    status: asTransportStatus(row.status),
    route_code: route.route_code ? asString(route.route_code) : null,
    route_label: route.label ? asString(route.label) : null,
    route_status: route.status ? asString(route.status) : null,
    detail_href: buildDetailHref('/angelcare-360-command-center/transport/arrets', asString(row.id)),
  }
}

function buildVehicleRecord(row: Row, staffMap: Map<string, Row>, assignmentsByVehicle: Map<string, Row[]>, routeByVehicle: Map<string, Row>): Angelcare360TransportVehicleListRecord {
  const driver = row.assigned_driver_staff_id ? pickRecord(staffMap.get(asString(row.assigned_driver_staff_id))) : null
  const assignments = assignmentsByVehicle.get(asString(row.id)) || []
  const activeAssignmentCount = assignments.filter((assignment) => ['active', 'pending', 'suspended'].includes(asString(assignment.status))).length
  const capacityWarning = Boolean(Number(row.capacity_seats || 0) > 0 && activeAssignmentCount > Number(row.capacity_seats || 0))
  const route = pickRecord(routeByVehicle.get(asString(row.id)))
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    vehicle_code: asString(row.vehicle_code),
    plate_number: asString(row.plate_number),
    model: row.model ? asString(row.model) : null,
    capacity_seats: Number(row.capacity_seats || 0),
    assigned_driver_staff_id: row.assigned_driver_staff_id ? asString(row.assigned_driver_staff_id) : null,
    insurance_expires_on: row.insurance_expires_on ? asString(row.insurance_expires_on) : null,
    status: asTransportStatus(row.status),
    assigned_driver_full_name: driver?.full_name ? asString(driver.full_name) : null,
    route_label: route.label ? asString(route.label) : null,
    route_code: route.route_code ? asString(route.route_code) : null,
    active_assignment_count: activeAssignmentCount,
    capacity_warning: capacityWarning,
    detail_href: buildDetailHref('/angelcare-360-command-center/transport/vehicules', asString(row.id)),
  }
}

function buildAssignmentRecord(
  row: Row,
  studentMap: Map<string, Row>,
  routeMap: Map<string, Row>,
  vehicleMap: Map<string, Row>,
  stopMap: Map<string, Row>,
  emergencyContactCountByStudent: Map<string, number>,
): Angelcare360TransportAssignmentListRecord {
  const student = pickRecord(studentMap.get(asString(row.student_id)))
  const route = pickRecord(routeMap.get(asString(row.route_id)))
  const vehicle = row.vehicle_id ? pickRecord(vehicleMap.get(asString(row.vehicle_id))) : null
  const pickupStop = row.pickup_stop_id ? pickRecord(stopMap.get(asString(row.pickup_stop_id))) : null
  const dropoffStop = row.dropoff_stop_id ? pickRecord(stopMap.get(asString(row.dropoff_stop_id))) : null
  const emergencyCount = emergencyContactCountByStudent.get(asString(row.student_id)) || 0
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    route_id: asString(row.route_id),
    student_id: asString(row.student_id),
    vehicle_id: row.vehicle_id ? asString(row.vehicle_id) : null,
    pickup_stop_id: row.pickup_stop_id ? asString(row.pickup_stop_id) : null,
    dropoff_stop_id: row.dropoff_stop_id ? asString(row.dropoff_stop_id) : null,
    assigned_on: asString(row.assigned_on),
    status: asTransportStatus(row.status),
    student_full_name: student.full_name ? asString(student.full_name) : null,
    student_code: student.student_code ? asString(student.student_code) : null,
    class_name: student.current_class_name ? asString(student.current_class_name) : null,
    class_code: student.current_class_code ? asString(student.current_class_code) : null,
    section_name: student.current_section_name ? asString(student.current_section_name) : null,
    section_code: student.current_section_code ? asString(student.current_section_code) : null,
    route_code: route.route_code ? asString(route.route_code) : null,
    route_label: route.label ? asString(route.label) : null,
    vehicle_code: vehicle?.vehicle_code ? asString(vehicle.vehicle_code) : null,
    vehicle_label: vehicle?.plate_number ? asString(vehicle.plate_number) : null,
    pickup_stop_label: pickupStop?.label ? asString(pickupStop.label) : null,
    dropoff_stop_label: dropoffStop?.label ? asString(dropoffStop.label) : null,
    emergency_contact_count: emergencyCount,
    emergency_contact_ready: emergencyCount > 0,
    detail_href: `/angelcare-360-command-center/transport/affectations?assignment=${asString(row.id)}`,
  }
}

async function loadTransportSnapshot(options: { schoolId: string; academicYearId?: string | null; search?: string | null }) {
  const client = await createClient()
  const schoolId = options.schoolId
  const academicYearId = options.academicYearId || null
  const search = options.search?.trim().toLowerCase() || ''

  const [studentsResponse, contactsResponse, routesResponse, stopsResponse, vehiclesResponse, assignmentsResponse, staffResponse] = await Promise.all([
    client
      .from('angelcare360_students')
      .select(`
        id,
        school_id,
        student_code,
        full_name,
        first_name,
        last_name,
        current_class_id,
        current_section_id,
        class:angelcare360_classes(id, name, class_code, level),
        section:angelcare360_sections(id, name, section_code),
        status,
        created_at,
        updated_at
      `)
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('full_name', { ascending: true })
      .limit(500),
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, status, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('contactable_type', 'student')
      .eq('status', 'active'),
    client
      .from('angelcare360_transport_routes')
      .select(`
        id,
        school_id,
        route_code,
        label,
        route_type,
        responsible_staff_id,
        accompagnateur_staff_id,
        vehicle_id,
        capacity_seats,
        status,
        created_at,
        updated_at
      `)
      .eq('school_id', schoolId)
      .order('route_code', { ascending: true }),
    client
      .from('angelcare360_transport_stops')
      .select('id, school_id, route_id, stop_code, label, order_index, latitude, longitude, planned_time, status, created_at, updated_at')
      .eq('school_id', schoolId)
      .order('order_index', { ascending: true }),
    client
      .from('angelcare360_transport_vehicles')
      .select(`
        id,
        school_id,
        vehicle_code,
        plate_number,
        model,
        capacity_seats,
        assigned_driver_staff_id,
        insurance_expires_on,
        status,
        created_at,
        updated_at,
        assigned_driver:angelcare360_staff(id, full_name, staff_code, staff_type, status)
      `)
      .eq('school_id', schoolId)
      .order('vehicle_code', { ascending: true }),
    client
      .from('angelcare360_transport_assignments')
      .select(`
        id,
        school_id,
        academic_year_id,
        route_id,
        student_id,
        vehicle_id,
        pickup_stop_id,
        dropoff_stop_id,
        assigned_on,
        status,
        created_at,
        updated_at
      `)
      .eq('school_id', schoolId)
      .order('assigned_on', { ascending: false }),
    client
      .from('angelcare360_staff')
      .select('id, school_id, staff_code, staff_type, full_name, status, department')
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true }),
  ])

  const students = (studentsResponse.data || []) as Row[]
  const contacts = (contactsResponse.data || []) as Row[]
  const routes = (routesResponse.data || []) as Row[]
  const stops = (stopsResponse.data || []) as Row[]
  const vehicles = (vehiclesResponse.data || []) as Row[]
  const assignments = (assignmentsResponse.data || []) as Row[]
  const staff = (staffResponse.data || []) as Row[]

  const routeMap = new Map(routes.map((route) => [asString(route.id), route]))
  const routeByVehicle = new Map(routes.filter((route) => route.vehicle_id).map((route) => [asString(route.vehicle_id), route]))
  const stopMap = new Map(stops.map((stop) => [asString(stop.id), stop]))
  const vehicleMap = new Map(vehicles.map((vehicle) => [asString(vehicle.id), vehicle]))
  const studentMap = new Map(students.map((student) => {
    const classRecord = pickRecord(student.class)
    const sectionRecord = pickRecord(student.section)
    return [asString(student.id), {
      ...student,
      current_class_name: classRecord.name || null,
      current_class_code: classRecord.class_code || null,
      current_section_name: sectionRecord.name || null,
      current_section_code: sectionRecord.section_code || null,
    }]
  }))
  const staffMap = new Map(staff.map((member) => [asString(member.id), member]))
  const emergencyContactCountByStudent = countMap(contacts, 'contactable_id')
  const stopsByRoute = groupRows(stops, 'route_id')
  const assignmentsForAcademicYear = academicYearId ? assignments.filter((assignment) => asString(assignment.academic_year_id) === academicYearId) : assignments
  const assignmentsByRoute = groupRows(assignmentsForAcademicYear, 'route_id')
  const assignmentsByVehicle = groupRows(assignmentsForAcademicYear, 'vehicle_id')
  const routeRows = routes.map((route) => buildRouteRecord(route, stopsByRoute, assignmentsByRoute, vehicleMap, staffMap))
  const stopRows = stops.map((stop) => buildStopRecord(stop, routeMap))
  const vehicleRows = vehicles.map((vehicle) => {
    return buildVehicleRecord(vehicle, staffMap, assignmentsByVehicle, routeByVehicle)
  })
  const assignmentRows = assignmentsForAcademicYear.map((assignment) =>
    buildAssignmentRecord(assignment, studentMap, routeMap, vehicleMap, stopMap, emergencyContactCountByStudent),
  )

  const filteredRoutes = search
    ? routeRows.filter((row) => [row.route_code, row.label, row.responsible_staff_full_name, row.accompagnateur_staff_full_name, row.vehicle_plate_number].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
    : routeRows
  const filteredStops = search
    ? stopRows.filter((row) => [row.stop_code, row.label, row.route_code, row.route_label].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
    : stopRows
  const filteredVehicles = search
    ? vehicleRows.filter((row) => [row.vehicle_code, row.plate_number, row.model, row.assigned_driver_full_name, row.route_label].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
    : vehicleRows
  const filteredAssignments = search
    ? assignmentRows.filter((row) => [row.student_full_name, row.student_code, row.route_label, row.vehicle_label, row.pickup_stop_label, row.dropoff_stop_label].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)))
    : assignmentRows

  return {
    students,
    contacts,
    routes: filteredRoutes,
    stops: filteredStops,
    vehicles: filteredVehicles,
    assignments: filteredAssignments,
    routeMap,
    stopMap,
    vehicleMap,
    studentMap,
    staffMap,
    emergencyContactCountByStudent,
    stopsByRoute,
    assignmentsByRoute,
    assignmentsByVehicle,
    latestAuditEvents: [],
  }
}

async function loadLatestTransportAuditEvents(schoolId: string, filters?: Partial<Angelcare360TransportAuditFilter>) {
  const client = await createClient()
  let query = client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', schoolId)
    .eq('module', TRANSPORT_MODULE)
    .order('created_at', { ascending: false })
    .limit(30)

  if (filters?.module) query = query.ilike('module', `%${filters.module}%`)
  if (filters?.action) query = query.ilike('action', `%${filters.action}%`)
  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters?.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters?.actorUserId) query = query.eq('actor_user_id', filters.actorUserId)
  if (filters?.status) query = query.filter('metadata->>status', 'eq', filters.status)
  if (filters?.from) query = query.gte('created_at', filters.from)
  if (filters?.to) query = query.lte('created_at', filters.to)
  if (filters?.search) {
    const search = filters.search.replace(/'/g, "''")
    query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%,module.ilike.%${search}%`)
  }

  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

function buildSafetyReadiness(snapshot: Awaited<ReturnType<typeof loadTransportSnapshot>>, schoolId: string, academicYearId?: string | null): Angelcare360TransportSafetyReadinessRecord {
  const activeRoutes = snapshot.routes.filter((route) => route.status === 'active')
  const activeVehicles = snapshot.vehicles.filter((vehicle) => vehicle.status === 'active')
  const activeAssignments = snapshot.assignments.filter((assignment) => assignment.status === 'active')
  const missingDriverCount = snapshot.routes.filter((route) => !route.responsible_staff_id).length
  const missingAccompagnateurCount = snapshot.routes.filter((route) => !route.accompagnateur_staff_id).length
  const routeWithoutStopsCount = snapshot.routes.filter((route) => (snapshot.stopsByRoute.get(route.id)?.length || 0) === 0).length
  const capacityWarningCount = snapshot.routes.filter((route) => route.capacity_warning).length + snapshot.vehicles.filter((vehicle) => vehicle.capacity_warning).length
  const emergencyCoverageMissingCount = snapshot.assignments.filter((assignment) => !assignment.emergency_contact_ready).length
  const checkpoints = [
    makeReadinessCheckpoint('routes', 'Circuits actifs', activeRoutes.length > 0, 'Aucun circuit actif n’est disponible.'),
    makeReadinessCheckpoint('vehicles', 'Véhicules disponibles', activeVehicles.length > 0, 'Aucun véhicule actif n’est disponible.'),
    makeReadinessCheckpoint('assignments', 'Affectations élèves', activeAssignments.length > 0, 'Aucune affectation active n’est disponible.'),
    makeReadinessCheckpoint('driver', 'Chauffeurs affectés', missingDriverCount === 0, 'Au moins un circuit n’a pas de chauffeur affecté.'),
    makeReadinessCheckpoint('assistant', 'Accompagnateurs affectés', missingAccompagnateurCount === 0, 'Au moins un circuit n’a pas d’accompagnateur affecté.'),
    makeReadinessCheckpoint('stops', 'Arrêts configurés', routeWithoutStopsCount === 0, 'Au moins un circuit n’a aucun arrêt.'),
    makeReadinessCheckpoint('capacity', 'Capacité respectée', capacityWarningCount === 0, 'La capacité transport est dépassée sur au moins un circuit ou véhicule.'),
    makeReadinessCheckpoint('contacts', 'Contacts d’urgence couverts', emergencyCoverageMissingCount === 0, 'Des élèves affectés n’ont pas de contact d’urgence actif.'),
    {
      key: 'gps',
      label: 'GPS',
      status: 'live_tracking_locked',
      reason: GPS_BLOCKED_MESSAGE,
    },
    {
      key: 'notifications',
      label: 'Notifications parents',
      status: 'notifications_locked',
      reason: NOTIFICATIONS_BLOCKED_MESSAGE,
    },
  ] satisfies Angelcare360TransportReadinessCheckpointRecord[]

  const overallStatus: Angelcare360TransportOperationReadinessStatus =
    routeWithoutStopsCount > 0 || missingDriverCount > 0 || emergencyCoverageMissingCount > 0
      ? 'incomplete'
      : activeRoutes.length > 0 && activeVehicles.length > 0 && activeAssignments.length > 0
        ? 'ready'
        : 'blocked'

  return {
    schoolId,
    academicYearId: academicYearId || null,
    overallStatus,
    checkpoints,
    routeCount: snapshot.routes.length,
    activeRouteCount: activeRoutes.length,
    stopCount: snapshot.stops.length,
    vehicleCount: snapshot.vehicles.length,
    activeVehicleCount: activeVehicles.length,
    assignmentCount: snapshot.assignments.length,
    activeAssignmentCount: activeAssignments.length,
    missingDriverCount,
    missingAccompagnateurCount,
    routeWithoutStopsCount,
    capacityWarningCount,
    emergencyCoverageMissingCount,
    gpsLocked: true,
    notificationsLocked: true,
  }
}

export async function getAngelcare360TransportOverview(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const safety = buildSafetyReadiness(snapshot, context.school.id, context.academicYear?.id || null)
  const latestAuditEvents = await loadLatestTransportAuditEvents(context.school.id, { schoolId: context.school.id })
  const risks = [
    ...(safety.missingDriverCount > 0 ? ['Des circuits n’ont pas de chauffeur affecté.'] : []),
    ...(safety.missingAccompagnateurCount > 0 ? ['Des circuits n’ont pas d’accompagnateur affecté.'] : []),
    ...(safety.routeWithoutStopsCount > 0 ? ['Des circuits n’ont aucun arrêt configuré.'] : []),
    ...(safety.capacityWarningCount > 0 ? ['La capacité transport est dépassée sur au moins un circuit ou véhicule.'] : []),
    ...(safety.emergencyCoverageMissingCount > 0 ? ['Des élèves transportés n’ont pas de contact d’urgence couvert.'] : []),
    'Le suivi GPS reste verrouillé tant qu’un fournisseur de cartographie n’est pas configuré.',
    'Les notifications parents restent verrouillées tant que le module Messagerie n’est pas activé.',
  ]

  return {
    schoolId: context.school.id,
    schoolName: context.school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    routeCount: snapshot.routes.length,
    activeRouteCount: snapshot.routes.filter((route) => route.status === 'active').length,
    stopCount: snapshot.stops.length,
    vehicleCount: snapshot.vehicles.length,
    activeVehicleCount: snapshot.vehicles.filter((vehicle) => vehicle.status === 'active').length,
    assignmentCount: snapshot.assignments.length,
    activeAssignmentCount: snapshot.assignments.filter((assignment) => assignment.status === 'active').length,
    missingDriverCount: safety.missingDriverCount,
    missingAccompagnateurCount: safety.missingAccompagnateurCount,
    routeWithoutStopsCount: safety.routeWithoutStopsCount,
    capacityWarningCount: safety.capacityWarningCount,
    emergencyCoverageMissingCount: safety.emergencyCoverageMissingCount,
    latestAuditEvents,
    risks,
    safety,
    notifications: {
      schoolId: context.school.id,
      overallStatus: 'notifications_locked',
      reason: NOTIFICATIONS_BLOCKED_MESSAGE,
      messagingLocked: true,
    },
  } satisfies Angelcare360TransportOverviewRecord
}

export async function listAngelcare360TransportRoutes(options?: { schoolId?: string | null; search?: string | null; status?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null, search: options?.search || null })
  return (options?.status ? snapshot.routes.filter((route) => route.status === options.status) : snapshot.routes) as Angelcare360TransportRouteListRecord[]
}

export async function getAngelcare360TransportRouteById(routeId: string) {
  const context = await getContextOrThrow('transport.view')
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const record = snapshot.routes.find((route) => route.id === routeId)
  return record || null
}

export async function createAngelcare360TransportRoute(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportRouteRecord>> {
  const parsed = angelcare360TransportRouteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload circuit invalide.' }
  const context = await requireAngelcare360Permission('transport.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()

  const payload = {
    school_id: context.school!.id,
    route_code: parsed.data.routeCode,
    label: parsed.data.label,
    route_type: parsed.data.routeType || 'school_bus',
    responsible_staff_id: parsed.data.responsibleStaffId || null,
    accompagnateur_staff_id: parsed.data.assistantStaffId || null,
    vehicle_id: parsed.data.vehicleId || null,
    capacity_seats: parsed.data.capacitySeats,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {},
  }

  const { data, error } = await client.from('angelcare360_transport_routes').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  const audit = await auditTransportEvent({
    action: 'transport_route.created',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_route',
    entityId: String(data.id),
    afterData: payload,
  })
  if (!audit.ok && audit.error) {
    return { ok: true, record: data as Angelcare360TransportRouteRecord, warning: audit.error }
  }

  return { ok: true, record: data as Angelcare360TransportRouteRecord }
}

export async function updateAngelcare360TransportRoute(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportRouteRecord>> {
  const parsed = angelcare360TransportRouteUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload circuit invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_routes').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Circuit introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_routes')
    .update({
      route_code: parsed.data.routeCode,
      label: parsed.data.label,
      route_type: parsed.data.routeType || 'school_bus',
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      accompagnateur_staff_id: parsed.data.assistantStaffId || null,
      vehicle_id: parsed.data.vehicleId || null,
      capacity_seats: parsed.data.capacitySeats,
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  const audit = await auditTransportEvent({
    action: 'transport_route.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_route',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })
  if (!audit.ok && audit.error) {
    return { ok: true, record: data as Angelcare360TransportRouteRecord, warning: audit.error }
  }

  return { ok: true, record: data as Angelcare360TransportRouteRecord }
}

export async function changeAngelcare360TransportRouteStatus(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportRouteRecord>> {
  const parsed = angelcare360TransportRouteStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Statut de circuit invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_routes').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Circuit introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_routes')
    .update({
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_route.status_changed',
    severity: parsed.data.status === 'archived' || parsed.data.status === 'suspended' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'transport_route',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: parsed.data.status, reason: parsed.data.reason || null },
  })

  if (parsed.data.status === 'suspended') {
    await auditTransportEvent({
      action: 'transport_capacity.warning_detected',
      severity: 'warning',
      schoolId: context.school!.id,
      entityType: 'transport_route',
      entityId: parsed.data.id,
      metadata: { reason: parsed.data.reason || null },
    })
  }

  return { ok: true, record: data as Angelcare360TransportRouteRecord }
}

export async function listAngelcare360TransportStops(options?: { schoolId?: string | null; routeId?: string | null; search?: string | null; status?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null, search: options?.search || null })
  let stops = snapshot.stops
  if (options?.routeId) stops = stops.filter((stop) => stop.route_id === options.routeId)
  if (options?.status) stops = stops.filter((stop) => stop.status === options.status)
  return stops as Angelcare360TransportStopListRecord[]
}

export async function createAngelcare360TransportStop(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportStopRecord>> {
  const parsed = angelcare360TransportStopCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload arrêt invalide.' }
  const context = await requireAngelcare360Permission('transport.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const route = await client.from('angelcare360_transport_routes').select('id, school_id, route_code, label, status').eq('school_id', context.school!.id).eq('id', parsed.data.routeId).maybeSingle()
  if (!route.data) return { ok: false, error: 'Circuit introuvable.' }

  const payload = {
    school_id: context.school!.id,
    route_id: parsed.data.routeId,
    stop_code: parsed.data.stopCode,
    label: parsed.data.label,
    order_index: parsed.data.orderIndex,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    planned_time: parsed.data.plannedTime,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {},
  }

  const { data, error } = await client.from('angelcare360_transport_stops').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_stop.created',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_stop',
    entityId: String(data.id),
    afterData: payload,
  })

  return { ok: true, record: data as Angelcare360TransportStopRecord }
}

export async function updateAngelcare360TransportStop(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportStopRecord>> {
  const parsed = angelcare360TransportStopUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload arrêt invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_stops').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Arrêt introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_stops')
    .update({
      route_id: parsed.data.routeId,
      stop_code: parsed.data.stopCode,
      label: parsed.data.label,
      order_index: parsed.data.orderIndex,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      planned_time: parsed.data.plannedTime,
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_stop.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_stop',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: data as Angelcare360TransportStopRecord }
}

export async function listAngelcare360TransportVehicles(options?: { schoolId?: string | null; search?: string | null; status?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null, search: options?.search || null })
  let vehicles = snapshot.vehicles
  if (options?.status) vehicles = vehicles.filter((vehicle) => vehicle.status === options.status)
  return vehicles as Angelcare360TransportVehicleListRecord[]
}

export async function getAngelcare360TransportVehicleById(vehicleId: string) {
  const context = await getContextOrThrow('transport.view')
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const record = snapshot.vehicles.find((vehicle) => vehicle.id === vehicleId)
  return record || null
}

export async function createAngelcare360TransportVehicle(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportVehicleRecord>> {
  const parsed = angelcare360TransportVehicleCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload véhicule invalide.' }
  const context = await requireAngelcare360Permission('transport.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()

  const payload = {
    school_id: context.school!.id,
    vehicle_code: parsed.data.vehicleCode,
    plate_number: parsed.data.plateNumber,
    model: parsed.data.model || null,
    capacity_seats: parsed.data.capacitySeats,
    assigned_driver_staff_id: parsed.data.assignedDriverStaffId || null,
    insurance_expires_on: parsed.data.insuranceExpiresOn || null,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {},
  }

  const { data, error } = await client.from('angelcare360_transport_vehicles').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_vehicle.created',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_vehicle',
    entityId: String(data.id),
    afterData: payload,
  })

  return { ok: true, record: data as Angelcare360TransportVehicleRecord }
}

export async function updateAngelcare360TransportVehicle(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportVehicleRecord>> {
  const parsed = angelcare360TransportVehicleUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload véhicule invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_vehicles').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Véhicule introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_vehicles')
    .update({
      vehicle_code: parsed.data.vehicleCode,
      plate_number: parsed.data.plateNumber,
      model: parsed.data.model || null,
      capacity_seats: parsed.data.capacitySeats,
      assigned_driver_staff_id: parsed.data.assignedDriverStaffId || null,
      insurance_expires_on: parsed.data.insuranceExpiresOn || null,
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_vehicle.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_vehicle',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: data as Angelcare360TransportVehicleRecord }
}

export async function changeAngelcare360TransportVehicleStatus(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportVehicleRecord>> {
  const parsed = angelcare360TransportVehicleStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Statut véhicule invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_vehicles').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Véhicule introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_vehicles')
    .update({
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_vehicle.status_changed',
    severity: parsed.data.status === 'maintenance' || parsed.data.status === 'unavailable' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'transport_vehicle',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: parsed.data.status, reason: parsed.data.reason || null },
  })

  return { ok: true, record: data as Angelcare360TransportVehicleRecord }
}

export async function listAngelcare360TransportAssignments(options?: { schoolId?: string | null; academicYearId?: string | null; routeId?: string | null; studentId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: options?.academicYearId || context.academicYear?.id || null, search: options?.search || null })
  let assignments = snapshot.assignments
  if (options?.routeId) assignments = assignments.filter((assignment) => assignment.route_id === options.routeId)
  if (options?.studentId) assignments = assignments.filter((assignment) => assignment.student_id === options.studentId)
  if (options?.status) assignments = assignments.filter((assignment) => assignment.status === options.status)
  return assignments as Angelcare360TransportAssignmentListRecord[]
}

export async function createAngelcare360TransportAssignment(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportAssignmentRecord>> {
  const parsed = angelcare360TransportAssignmentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload affectation invalide.' }
  const context = await requireAngelcare360Permission('transport.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()

  const [route, student, vehicle, pickupStop, dropoffStop] = await Promise.all([
    client.from('angelcare360_transport_routes').select('id, school_id, route_code, label, status, capacity_seats').eq('school_id', context.school!.id).eq('id', parsed.data.routeId).maybeSingle(),
    client.from('angelcare360_students').select('id, school_id, student_code, full_name, current_class_id, current_section_id, status').eq('school_id', context.school!.id).eq('id', parsed.data.studentId).maybeSingle(),
    parsed.data.vehicleId ? client.from('angelcare360_transport_vehicles').select('id, school_id, vehicle_code, plate_number, capacity_seats, status').eq('school_id', context.school!.id).eq('id', parsed.data.vehicleId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    parsed.data.pickupStopId ? client.from('angelcare360_transport_stops').select('id, school_id, route_id, stop_code, label, status').eq('school_id', context.school!.id).eq('id', parsed.data.pickupStopId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    parsed.data.dropoffStopId ? client.from('angelcare360_transport_stops').select('id, school_id, route_id, stop_code, label, status').eq('school_id', context.school!.id).eq('id', parsed.data.dropoffStopId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ])

  if (!route.data) return { ok: false, error: 'Circuit introuvable.' }
  if (!student.data) return { ok: false, error: 'Élève introuvable.' }
  if (parsed.data.vehicleId && !vehicle.data) return { ok: false, error: 'Véhicule introuvable.' }
  if (parsed.data.pickupStopId && (!pickupStop.data || String((pickupStop.data as Row).route_id) !== parsed.data.routeId)) return { ok: false, error: 'L’arrêt de ramassage ne correspond pas au circuit.' }
  if (parsed.data.dropoffStopId && (!dropoffStop.data || String((dropoffStop.data as Row).route_id) !== parsed.data.routeId)) return { ok: false, error: 'L’arrêt de dépôt ne correspond pas au circuit.' }

  const existing = await client
    .from('angelcare360_transport_assignments')
    .select('id, status')
    .eq('school_id', context.school!.id)
    .eq('student_id', parsed.data.studentId)
    .eq('academic_year_id', parsed.data.academicYearId)
    .maybeSingle()

  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    route_id: parsed.data.routeId,
    student_id: parsed.data.studentId,
    vehicle_id: parsed.data.vehicleId || null,
    pickup_stop_id: parsed.data.pickupStopId || null,
    dropoff_stop_id: parsed.data.dropoffStopId || null,
    assigned_on: parsed.data.assignedOn || new Date().toISOString().slice(0, 10),
    status: parsed.data.status,
    updated_by: context.user.id,
    created_by: context.user.id,
    metadata_json: {},
  }

  const { data, error } = await client.from('angelcare360_transport_assignments').upsert(payload, { onConflict: 'student_id,academic_year_id' }).select('*').single()
  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: existing.data ? 'transport_assignment.updated' : 'transport_assignment.created',
    severity: existing.data ? 'info' : 'notice',
    schoolId: context.school!.id,
    entityType: 'transport_assignment',
    entityId: String(data.id),
    beforeData: existing.data as Record<string, unknown>,
    afterData: payload,
  })

  if (parsed.data.status === 'active') {
    const routeAssignments = await client
      .from('angelcare360_transport_assignments')
      .select('id, status')
      .eq('school_id', context.school!.id)
      .eq('route_id', parsed.data.routeId)

    const activeCount = (routeAssignments.data || []).filter((assignment) => ['active', 'pending', 'suspended'].includes(asString(assignment.status))).length
    const routeRecord = await client.from('angelcare360_transport_routes').select('id, capacity_seats').eq('school_id', context.school!.id).eq('id', parsed.data.routeId).maybeSingle()
    const capacity = Number(routeRecord.data?.capacity_seats || vehicle.data?.capacity_seats || 0)
    if (capacity > 0 && activeCount > capacity) {
      await auditTransportEvent({
        action: 'transport_capacity.warning_detected',
        severity: 'warning',
        schoolId: context.school!.id,
        entityType: 'transport_route',
        entityId: parsed.data.routeId,
        metadata: { activeCount, capacity },
      })
    }
  }

  return { ok: true, record: data as Angelcare360TransportAssignmentRecord }
}

export async function updateAngelcare360TransportAssignment(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportAssignmentRecord>> {
  const parsed = angelcare360TransportAssignmentUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload affectation invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_assignments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Affectation introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_assignments')
    .update({
      academic_year_id: parsed.data.academicYearId,
      route_id: parsed.data.routeId,
      student_id: parsed.data.studentId,
      vehicle_id: parsed.data.vehicleId || null,
      pickup_stop_id: parsed.data.pickupStopId || null,
      dropoff_stop_id: parsed.data.dropoffStopId || null,
      assigned_on: parsed.data.assignedOn || asString(before.data.assigned_on),
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_assignment.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'transport_assignment',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: data as Angelcare360TransportAssignmentRecord }
}

export async function cancelAngelcare360TransportAssignment(input: unknown): Promise<Angelcare360TransportMutationResult<Angelcare360TransportAssignmentRecord>> {
  const parsed = angelcare360TransportAssignmentCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Annulation d’affectation invalide.' }
  const context = await requireAngelcare360Permission('transport.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_transport_assignments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Affectation introuvable.' }

  const { data, error } = await client
    .from('angelcare360_transport_assignments')
    .update({
      status: 'cancelled',
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
      metadata_json: {
        ...(before.data.metadata_json || {}),
        cancellation_reason: parsed.data.reason,
      },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await auditTransportEvent({
    action: 'transport_assignment.cancelled',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'transport_assignment',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: 'cancelled', reason: parsed.data.reason },
  })

  return { ok: true, record: data as Angelcare360TransportAssignmentRecord }
}

export async function listAngelcare360TransportPickupList(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: options?.academicYearId || context.academicYear?.id || null })
  return snapshot.assignments
    .filter((assignment) => ['active', 'pending'].includes(assignment.status))
    .map((assignment) => ({
      ...assignment,
      expected_time: assignment.pickup_stop_id ? asTimeText(snapshot.stopMap.get(assignment.pickup_stop_id)?.planned_time || null) : null,
    })) as Angelcare360TransportPickupListRecord[]
}

export async function listAngelcare360TransportDropoffList(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: options?.academicYearId || context.academicYear?.id || null })
  return snapshot.assignments
    .filter((assignment) => ['active', 'pending'].includes(assignment.status))
    .map((assignment) => ({
      ...assignment,
      expected_time: assignment.dropoff_stop_id ? asTimeText(snapshot.stopMap.get(assignment.dropoff_stop_id)?.planned_time || null) : null,
    })) as Angelcare360TransportDropoffListRecord[]
}

export async function getAngelcare360TransportSafetyReadiness(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  const snapshot = await loadTransportSnapshot({ schoolId: context.school.id, academicYearId: options?.academicYearId || context.academicYear?.id || null })
  const readiness = buildSafetyReadiness(snapshot, context.school.id, options?.academicYearId || context.academicYear?.id || null)
  await auditTransportEvent({
    action: 'transport_safety.readiness_checked',
    severity: 'info',
    schoolId: context.school.id,
    entityType: 'transport_safety',
    entityId: context.school.id,
    metadata: {
      overallStatus: readiness.overallStatus,
      routeCount: readiness.routeCount,
      activeRouteCount: readiness.activeRouteCount,
      vehicleCount: readiness.vehicleCount,
      assignmentCount: readiness.assignmentCount,
    },
  })
  return readiness
}

export async function getAngelcare360TransportNotificationReadiness(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('transport.view', options?.schoolId || undefined)
  return {
    schoolId: context.school.id,
    overallStatus: 'notifications_locked',
    reason: `${NOTIFICATIONS_BLOCKED_MESSAGE} ${NOTIFICATIONS_SIMULATION_MESSAGE}`,
    messagingLocked: true,
  } satisfies Angelcare360TransportNotificationReadinessRecord
}

export async function listAngelcare360TransportAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360TransportAuditFilter> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId || undefined)
  const parsed = angelcare360TransportAuditQueryFiltersSchema.safeParse({
    ...(options?.filters || {}),
    schoolId: options?.filters?.schoolId || context.school.id,
  })
  if (!parsed.success) {
    throw new Error(parsed.errors[0]?.message || 'Filtres d’audit transport invalides.')
  }
  return loadLatestTransportAuditEvents(context.school.id, parsed.data)
}

export async function blockAngelcare360TransportNotification(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null } = {}) {
  const context = await getContextOrThrow('transport.view', input.schoolId || undefined)
  return auditTransportEvent({
    action: 'transport_notification.blocked_not_available',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'transport_notification',
    entityId: input.entityId || context.school.id,
    metadata: { reason: input.reason || NOTIFICATIONS_BLOCKED_MESSAGE },
  })
}

export async function blockAngelcare360TransportGps(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null } = {}) {
  const context = await getContextOrThrow('transport.view', input.schoolId || undefined)
  return auditTransportEvent({
    action: 'transport_gps.blocked_not_configured',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'transport_gps',
    entityId: input.entityId || context.school.id,
    metadata: { reason: input.reason || GPS_BLOCKED_MESSAGE, liveTracking: GPS_LIVE_TRACKING_MESSAGE },
  })
}
