export type AcademyProgramStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived'

export type AcademyProgramTrainer = {
  id?: string | number
  trainer_id?: string | number | null
  trainer_name: string
  role?: string | null
  specialty?: string | null
  sort_order?: number
}

export type AcademyProgramLibraryLink = {
  id?: string | number
  category: 'training_workbook' | 'training_presentation' | 'assessments_exams' | 'participant_docs_checklists'
  label: string
  url: string
  sort_order?: number
}

export type AcademyProgramPricingRow = {
  id?: string | number
  label: string
  billing_type: string
  amount_dhs: number
  tax_rate?: number
  applies_to: string
  sort_order?: number
}

export type AcademyProgramAddon = {
  id?: string | number
  label: string
  addon_type: string
  amount_dhs: number
  optional_required: 'optional' | 'required'
  sort_order?: number
}

export type AcademyProgramPayload = {
  reference_number?: string
  title: string
  category?: string | null
  level?: string | null
  delivery_format?: string | null
  status?: AcademyProgramStatus
  target_audience?: string | null
  description?: string | null
  intake_start?: string | null
  intake_end?: string | null
  duration_days?: number
  hours_per_day?: number
  total_hours?: number
  base_price_dhs?: number
  currency?: string
  visibility?: string | null
  enrollment_cap?: number
  readiness_score?: number
  parameters?: Record<string, any>
  outcomes?: Record<string, any>
  trainers?: AcademyProgramTrainer[]
  library_links?: AcademyProgramLibraryLink[]
  pricing_rows?: AcademyProgramPricingRow[]
  addons?: AcademyProgramAddon[]
}

export type AcademyProgramRecord = AcademyProgramPayload & {
  id: string | number
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
  trainers: AcademyProgramTrainer[]
  library_links: AcademyProgramLibraryLink[]
  pricing_rows: AcademyProgramPricingRow[]
  addons: AcademyProgramAddon[]
}

export type AcademyProgramsDashboard = {
  programs: AcademyProgramRecord[]
  trainers: { id: string | number; full_name: string; specialty?: string | null; status?: string | null }[]
  stats: {
    totalPrograms: number
    activePrograms: number
    planningPrograms: number
    totalBaseValue: number
  }
}
