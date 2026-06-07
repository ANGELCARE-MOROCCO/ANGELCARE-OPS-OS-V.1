export type AcademyCohortStatus = 'planned' | 'open' | 'active' | 'completed' | 'paused' | 'cancelled'

export type AcademyCohortParticipant = {
  id?: string | number
  trainee_id?: string | number | null
  enrollment_id?: string | number | null
  trainee_name: string
  email?: string | null
  phone?: string | null
  status?: string | null
  joined_at?: string | null
}

export type AcademyCohortChecklistItem = {
  id?: string | number
  item_key: string
  label: string
  checked: boolean
  checked_at?: string | null
  checked_by?: string | null
  sort_order?: number
}

export type AcademyCohortPayload = {
  training_start_time?: string
  training_end_time?: string
  hours_per_day?: number
  [key: string]: any
  reference_number?: string
  title: string
  program_id?: string | number | null
  program_title?: string | null
  trainer_id?: string | number | null
  trainer_name?: string | null
  start_date?: string | null
  end_date?: string | null
  capacity?: number
  status?: AcademyCohortStatus
  readiness_score?: number
  progression_percent?: number
  attendance_health?: number
  notes?: string | null
  participants?: AcademyCohortParticipant[]
  checklist?: AcademyCohortChecklistItem[]
}

export type AcademyCohortRecord = AcademyCohortPayload & {
  id: string | number
  created_at?: string
  updated_at?: string
  participants: AcademyCohortParticipant[]
  checklist: AcademyCohortChecklistItem[]
}

export type AcademyCohortsDashboard = {
  cohorts: AcademyCohortRecord[]
  programs: { id: string | number; title: string; reference_number?: string | null; duration_days?: number | null; total_hours?: number | null }[]
  trainers: { id: string | number; full_name: string; specialty?: string | null; status?: string | null }[]
  approvedEnrollments: { id: string | number; trainee_id?: string | number | null; trainee_name: string; program_id?: string | number | null; course_id?: string | null; status?: string | null; email?: string | null; phone?: string | null }[]
  stats: { totalCohorts: number; activeCohorts: number; availableSeats: number; totalParticipants: number }
}
