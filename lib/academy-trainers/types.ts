export type AcademyTrainerStatus = 'active' | 'available' | 'in_session' | 'inactive' | 'on_leave' | 'overloaded' | 'pending'

export type AcademyTrainer = {
  id: string
  reference_number: string
  full_name: string
  email: string | null
  mobile: string | null
  professional_title: string | null
  gender: string | null
  city: string | null
  base_location: string | null
  languages: string[]
  employment_type: string
  status: AcademyTrainerStatus | string
  seniority_level: string | null
  main_specialty: string | null
  secondary_specialties: string[]
  readiness_score: number
  dispatch_score: number
  utilization_percent: number
  availability_status: string | null
  weekly_capacity_hours: number
  current_load_hours: number
  max_hours_per_day: number
  programs_qualified: number
  regions_covered: string[]
  delivery_formats: string[]
  preferred_slots: string | null
  availability_days: string[]
  base_rate_type: string | null
  base_rate_dhs: number
  hourly_rate_dhs: number
  travel_fee_dhs: number
  accommodation: string | null
  payment_method: string | null
  session_rating: number
  completion_rate: number
  punctuality_score: number
  incident_count: number
  documents_verified: boolean
  contract_signed: boolean
  compliance_clear: boolean
  internal_remarks: string | null
  profile_photo_url: string | null
  assignments?: AcademyTrainerAssignment[]
  certifications?: AcademyTrainerCertification[]
  documents?: AcademyTrainerDocument[]
  created_at?: string
  updated_at?: string
}

export type AcademyTrainerAssignment = {
  id: string
  trainer_id: string
  title: string
  cohort_label: string | null
  program_label: string | null
  assignment_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  delivery_mode: string | null
  status: string
  priority: string | null
  notes: string | null
}

export type AcademyTrainerCertification = {
  id: string
  trainer_id: string
  label: string
  issuer: string | null
  expiry_date: string | null
  status: string
}

export type AcademyTrainerDocument = {
  id: string
  trainer_id: string
  label: string
  file_url: string | null
  status: string
}

export type AcademyTrainerPayload = Partial<AcademyTrainer> & {
  full_name: string
}
