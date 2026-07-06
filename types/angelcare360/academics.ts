import type { Angelcare360UUID } from './database'

export interface Angelcare360LessonRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  subject_id: Angelcare360UUID
  staff_id?: Angelcare360UUID | null
  lesson_date: string
  topic: string
  status: string
}

export interface Angelcare360AssignmentRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  subject_id: Angelcare360UUID
  title: string
  due_on?: string | null
  max_score?: number | null
  status: string
}

export interface Angelcare360ExamRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  subject_id: Angelcare360UUID
  title: string
  scheduled_on: string
  max_score?: number | null
  status: string
}

