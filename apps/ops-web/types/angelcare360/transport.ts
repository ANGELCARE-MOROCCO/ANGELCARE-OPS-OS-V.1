import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export type Angelcare360TransportRouteStatus = 'draft' | 'active' | 'inactive' | 'suspended' | 'archived'
export type Angelcare360TransportStopStatus = 'active' | 'inactive' | 'suspended' | 'archived'
export type Angelcare360TransportVehicleStatus = 'active' | 'inactive' | 'maintenance' | 'unavailable' | 'archived'
export type Angelcare360TransportAssignmentStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'cancelled' | 'archived'
export type Angelcare360TransportOperationReadinessStatus = 'ready' | 'incomplete' | 'blocked' | 'live_tracking_locked' | 'notifications_locked'

export interface Angelcare360TransportRouteRecord extends Angelcare360BaseRecord {
  route_code: string
  label: string
  route_type: string
  responsible_staff_id?: Angelcare360UUID | null
  accompagnateur_staff_id?: Angelcare360UUID | null
  vehicle_id?: Angelcare360UUID | null
  capacity_seats?: number | null
  status: Angelcare360TransportRouteStatus | string
}

export interface Angelcare360TransportRouteListRecord extends Angelcare360TransportRouteRecord {
  responsible_staff_full_name?: string | null
  accompagnateur_staff_full_name?: string | null
  vehicle_code?: string | null
  vehicle_plate_number?: string | null
  vehicle_capacity_seats?: number | null
  stop_count?: number
  active_stop_count?: number
  assignment_count?: number
  active_assignment_count?: number
  capacity_warning?: boolean
  missing_driver?: boolean
  missing_accompagnateur?: boolean
  detail_href?: string
}

export interface Angelcare360TransportStopRecord extends Angelcare360BaseRecord {
  route_id: Angelcare360UUID
  stop_code: string
  label: string
  order_index: number
  latitude?: number | null
  longitude?: number | null
  planned_time?: string | null
  status: Angelcare360TransportStopStatus | string
}

export interface Angelcare360TransportStopListRecord extends Angelcare360TransportStopRecord {
  route_code?: string | null
  route_label?: string | null
  route_status?: string | null
  detail_href?: string
}

export interface Angelcare360TransportVehicleRecord extends Angelcare360BaseRecord {
  vehicle_code: string
  plate_number: string
  model?: string | null
  capacity_seats: number
  assigned_driver_staff_id?: Angelcare360UUID | null
  insurance_expires_on?: string | null
  status: Angelcare360TransportVehicleStatus | string
}

export interface Angelcare360TransportVehicleListRecord extends Angelcare360TransportVehicleRecord {
  assigned_driver_full_name?: string | null
  route_label?: string | null
  route_code?: string | null
  active_assignment_count?: number
  capacity_warning?: boolean
  detail_href?: string
}

export interface Angelcare360TransportAssignmentRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  route_id: Angelcare360UUID
  student_id: Angelcare360UUID
  vehicle_id?: Angelcare360UUID | null
  pickup_stop_id?: Angelcare360UUID | null
  dropoff_stop_id?: Angelcare360UUID | null
  assigned_on: string
  status: Angelcare360TransportAssignmentStatus | string
}

export interface Angelcare360TransportAssignmentListRecord extends Angelcare360TransportAssignmentRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  route_code?: string | null
  route_label?: string | null
  vehicle_code?: string | null
  vehicle_label?: string | null
  pickup_stop_label?: string | null
  dropoff_stop_label?: string | null
  emergency_contact_count?: number
  emergency_contact_ready?: boolean
  detail_href?: string
}

export interface Angelcare360TransportPickupListRecord extends Angelcare360TransportAssignmentListRecord {
  expected_time?: string | null
}

export interface Angelcare360TransportDropoffListRecord extends Angelcare360TransportAssignmentListRecord {
  expected_time?: string | null
}

export interface Angelcare360TransportReadinessCheckpointRecord {
  key: string
  label: string
  status: Angelcare360TransportOperationReadinessStatus
  reason: string
}

export interface Angelcare360TransportSafetyReadinessRecord {
  schoolId: Angelcare360UUID
  academicYearId?: Angelcare360UUID | null
  overallStatus: Angelcare360TransportOperationReadinessStatus
  checkpoints: Angelcare360TransportReadinessCheckpointRecord[]
  routeCount: number
  activeRouteCount: number
  stopCount: number
  vehicleCount: number
  activeVehicleCount: number
  assignmentCount: number
  activeAssignmentCount: number
  missingDriverCount: number
  missingAccompagnateurCount: number
  routeWithoutStopsCount: number
  capacityWarningCount: number
  emergencyCoverageMissingCount: number
  gpsLocked: boolean
  notificationsLocked: boolean
}

export interface Angelcare360TransportNotificationReadinessRecord {
  schoolId: Angelcare360UUID
  overallStatus: Angelcare360TransportOperationReadinessStatus
  reason: string
  messagingLocked: boolean
}

export interface Angelcare360TransportOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  routeCount: number
  activeRouteCount: number
  stopCount: number
  vehicleCount: number
  activeVehicleCount: number
  assignmentCount: number
  activeAssignmentCount: number
  missingDriverCount: number
  missingAccompagnateurCount: number
  routeWithoutStopsCount: number
  capacityWarningCount: number
  emergencyCoverageMissingCount: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
  safety: Angelcare360TransportSafetyReadinessRecord
  notifications: Angelcare360TransportNotificationReadinessRecord
}

export interface Angelcare360TransportAuditFilter {
  schoolId?: Angelcare360UUID | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  actorUserId?: Angelcare360UUID | null
  status?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360TransportMutationResult<T = unknown> {
  ok: boolean
  record?: T | null
  records?: T[]
  error?: string
  warning?: string | null
  idempotent?: boolean
  locked?: boolean
  reason?: string | null
}

