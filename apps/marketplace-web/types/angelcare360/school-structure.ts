import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export interface Angelcare360AcademicYearRecord extends Angelcare360BaseRecord {
  year_code: string
  label: string
  starts_on: string
  ends_on: string
  is_current: boolean
}

export interface Angelcare360TermRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  term_code: string
  label: string
  starts_on: string
  ends_on: string
  order_index: number
}

export interface Angelcare360ClassRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_code: string
  name: string
  level: string
  capacity: number
}

export interface Angelcare360SectionRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_code: string
  name: string
  capacity: number
}

export interface Angelcare360SubjectRecord extends Angelcare360BaseRecord {
  subject_code: string
  name: string
  short_name?: string | null
  credit_hours?: number | null
}

