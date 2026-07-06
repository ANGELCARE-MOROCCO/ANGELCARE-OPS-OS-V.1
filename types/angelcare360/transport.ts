import type { Angelcare360UUID } from './database'

export interface Angelcare360TransportRouteRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  route_code: string
  label: string
  status: string
}

export interface Angelcare360TransportAssignmentRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  route_id: Angelcare360UUID
  student_id: Angelcare360UUID
  status: string
}

