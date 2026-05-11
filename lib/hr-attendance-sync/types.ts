export type AttendanceAction = 'shift_in' | 'shift_out' | 'lunch_start' | 'lunch_end'
export type AttendanceView = 'dashboard' | 'day' | 'week' | 'agenda' | 'people' | 'exceptions'

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
