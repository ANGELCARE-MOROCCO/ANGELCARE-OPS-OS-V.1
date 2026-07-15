export type AttendanceAction = 'shift_in' | 'shift_out' | 'lunch_start' | 'lunch_end'
export type AttendanceView = 'dashboard' | 'day' | 'week' | 'agenda' | 'people' | 'exceptions'
export type LiveAttendanceStatus = 'none' | 'in' | 'out' | 'pause' | 'back' | 'error'

export type AttendanceRecord = {
  id: string
  user_id?: string | null
  staff_profile_id?: string | null
  staff_name?: string | null
  attendance_date: string
  check_in?: string | null
  check_out?: string | null
  lunch_start?: string | null
  lunch_end?: string | null
  status?: string | null
  validation_status?: string | null
  source?: string | null
  total_minutes?: number | null
  break_minutes?: number | null
  overtime_minutes?: number | null
  late_minutes?: number | null
  missing_punch?: boolean | null
  anomaly_reason?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type AttendanceLog = {
  id: string
  user_id?: string | null
  staff_profile_id?: string | null
  action: AttendanceAction | string
  note?: string | null
  source?: string | null
  created_at: string
}

export type PunchResult = {
  ok: true
  attendance_date: string
  action: AttendanceAction
  status: LiveAttendanceStatus
  message: string
  record: AttendanceRecord | null
  canPunch: Record<AttendanceAction, boolean>
  workedMinutes: number
  breakMinutes: number
}

export type AttendanceLiveState = {
  ok: true
  attendance_date: string
  status: LiveAttendanceStatus
  message: string
  record: AttendanceRecord | null
  canPunch: Record<AttendanceAction, boolean>
  workedMinutes: number
  breakMinutes: number
  staff: {
    id: string | null
    user_id: string
    full_name: string
    department?: string | null
    position?: string | null
  } | null
}
