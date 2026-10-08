export type TransportAuthority = 'advanced' | 'legacy'
export type TransportTone = 'good' | 'warn' | 'bad' | 'neutral'

export interface TransportIntegrity {
  installed: boolean
  safeForOperations: boolean
  assignmentStopRouteMismatch: number
  assignmentCrossOrg: number
  routeReferenceCrossOrg: number
  runReferenceCrossOrg: number
  runEventReferenceCrossOrg: number
  safetyReferenceCrossOrg: number
  overCapacityRoutes: number
  message?: string
}

export interface TransportRoute {
  id: string
  code: string
  label: string
  direction: string
  routeType: string
  campusId?: string | null
  vehicleId?: string | null
  driverId?: string | null
  vehicleLabel?: string | null
  driverName?: string | null
  status: string
  stopCount: number
  assignmentCount: number
  capacity: number
  capacityPressure: boolean
}

export interface TransportStop {
  id: string
  routeId: string
  routeCode: string
  routeLabel: string
  order: number
  label: string
  zone?: string | null
  address?: string | null
  plannedTime?: string | null
  latitude?: number | null
  longitude?: number | null
  status: string
  studentCount: number
}

export interface TransportVehicle {
  id: string
  code: string
  label: string
  vehicleType: string
  plateNumber?: string | null
  capacity: number
  seatbeltCount: number
  insuranceExpiry?: string | null
  inspectionExpiry?: string | null
  status: string
  routeCount: number
  assignmentCount: number
}

export interface TransportDriver {
  id: string
  code: string
  fullName: string
  phone?: string | null
  staffId?: string | null
  licenseNumber?: string | null
  licenseExpiry?: string | null
  status: string
  routeCount: number
  runCountToday: number
}

export interface TransportStudent {
  id: string
  code: string
  fullName: string
  status: string
}

export interface TransportStaff {
  id: string
  code: string
  fullName: string
  phone?: string | null
  department?: string | null
  status: string
}

export interface TransportAssignment {
  id: string
  studentId: string
  studentName: string
  studentCode: string
  routeId: string
  routeCode: string
  routeLabel: string
  stopId?: string | null
  stopLabel?: string | null
  serviceDirection: string
  monthlyFeeMad: number
  startsOn?: string | null
  endsOn?: string | null
  status: string
}

export interface TransportRun {
  id: string
  routeId: string
  routeCode: string
  routeLabel: string
  vehicleId?: string | null
  vehicleLabel?: string | null
  driverId?: string | null
  driverName?: string | null
  runDate: string
  runType: string
  plannedStartAt?: string | null
  startedAt?: string | null
  endedAt?: string | null
  status: string
  notes?: string | null
  eventCount: number
  safetyResult?: string | null
}

export interface TransportRunEvent {
  id: string
  routeRunId: string
  studentId?: string | null
  studentName?: string | null
  stopId?: string | null
  stopLabel?: string | null
  eventType: string
  occurredAt: string
  status: string
  notes?: string | null
}

export interface TransportSafetyCheck {
  id: string
  vehicleId?: string | null
  vehicleLabel?: string | null
  driverId?: string | null
  driverName?: string | null
  routeRunId?: string | null
  checkType: string
  result: string
  checkedAt: string
  notes?: string | null
}

export interface TransportAlert {
  id: string
  key: string
  severity: string
  entityType?: string | null
  entityId?: string | null
  title: string
  message?: string | null
  status: string
  createdAt: string
  resolvedAt?: string | null
}

export interface TransportAuditEvent {
  id: string
  action: string
  entityType?: string | null
  entityId?: string | null
  severity: string
  actorRole?: string | null
  createdAt: string
  metadata?: Record<string, unknown> | null
}

export interface TransportMetrics {
  routes: number
  activeRoutes: number
  stops: number
  vehicles: number
  activeVehicles: number
  drivers: number
  activeDrivers: number
  assignments: number
  activeAssignments: number
  runsToday: number
  runsOpen: number
  runsCompleted: number
  failedSafetyChecks: number
  openAlerts: number
  routesWithoutStops: number
  routesWithoutDriver: number
  routesWithoutVehicle: number
  capacityWarnings: number
}

export interface TransportSnapshot {
  schoolId: string
  schoolName: string
  schoolCode: string
  timezone: string
  authority: TransportAuthority
  authorityOrgId?: string | null
  authorityReason: string
  advancedAvailable: boolean
  integrity: TransportIntegrity
  metrics: TransportMetrics
  routes: TransportRoute[]
  stops: TransportStop[]
  vehicles: TransportVehicle[]
  drivers: TransportDriver[]
  students: TransportStudent[]
  staff: TransportStaff[]
  assignments: TransportAssignment[]
  runs: TransportRun[]
  events: TransportRunEvent[]
  safetyChecks: TransportSafetyCheck[]
  alerts: TransportAlert[]
  audits: TransportAuditEvent[]
  gpsLiveAvailable: false
  externalParentNotificationsAvailable: false
}

export interface TransportMutationResult {
  ok: boolean
  error?: string
  warning?: string
  locked?: boolean
  id?: string | null
  record?: unknown
}
