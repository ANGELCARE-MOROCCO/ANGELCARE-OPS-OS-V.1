export type HRStatus = 'active' | 'inactive' | 'pending' | 'open' | 'closed' | 'planned' | 'completed' | 'approved' | 'rejected'

export type HRStaff = {
  id: string
  full_name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  department?: string | null
  position?: string | null
  employment_status?: string | null
  contract_type?: string | null
  start_date?: string | null
  compliance_status?: string | null
  skills?: string | null
  certifications?: string | null
  updated_at?: string | null
  created_at?: string | null
}

export type HRCandidate = {
  id: string
  full_name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  source?: string | null
  desired_position?: string | null
  pipeline_stage?: string | null
  score?: number | null
  decision?: string | null
  interview_date?: string | null
  availability_date?: string | null
  created_at?: string | null
}

export type HROpening = {
  id: string
  title: string
  department?: string | null
  position?: string | null
  city?: string | null
  contract_type?: string | null
  hiring_priority?: string | null
  status?: string | null
  openings_count?: number | null
  target_start_date?: string | null
}

export type HRAttendance = {
  id: string
  staff_id?: string | null
  staff_name?: string | null
  attendance_date: string
  check_in?: string | null
  check_out?: string | null
  status?: string | null
  validation_status?: string | null
}

export type HRRoster = {
  id: string
  staff_id?: string | null
  staff_name?: string | null
  shift_date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  duty_type?: string | null
  status?: string | null
  conflict_status?: string | null
}

export type HRDashboardData = {
  openings: HROpening[]
  candidates: HRCandidate[]
  staff: HRStaff[]
  departments: any[]
  positions: any[]
  rosters: HRRoster[]
  attendance: HRAttendance[]
  attendanceCorrections: any[]
  tasks: any[]
  approvals: any[]
  onboarding: any[]
  docs: any[]
  reviews: any[]
  syncEvents: any[]
  qualityChecks: any[]
  serviceRequests: any[]
}
