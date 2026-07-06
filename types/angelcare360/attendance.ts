import type { Angelcare360UUID } from './database'

export interface Angelcare360AttendanceSessionRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  session_date: string
  session_type: string
  status: string
  created_at: string
  updated_at: string
}

export interface Angelcare360AttendanceRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  attendance_session_id: Angelcare360UUID
  student_id: Angelcare360UUID
  attendance_status: string
  minutes_late?: number | null
  note?: string | null
  status: string
  created_at: string
  updated_at: string
}

