import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export interface Angelcare360AdmissionLeadRecord extends Angelcare360BaseRecord {
  lead_code: string
  parent_name: string
  parent_phone?: string | null
  parent_email?: string | null
  student_full_name: string
  desired_level?: string | null
  source_channel?: string | null
}

export interface Angelcare360AdmissionApplicationRecord extends Angelcare360BaseRecord {
  application_code: string
  lead_id?: Angelcare360UUID | null
  parent_id?: Angelcare360UUID | null
  student_id?: Angelcare360UUID | null
  academic_year_id?: Angelcare360UUID | null
  class_id?: Angelcare360UUID | null
  section_id?: Angelcare360UUID | null
  application_stage: string
}

