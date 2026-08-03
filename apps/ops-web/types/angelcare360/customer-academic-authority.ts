export type AcademicAuthorityDomain = 'attendance' | 'timetable' | 'learning' | 'assessment'
export type AcademicAuthoritySeverity = 'info' | 'warning' | 'critical' | 'success'
export type AcademicAuthorityEntity =
  | 'attendance-correction'
  | 'day-closure'
  | 'timetable-publication'
  | 'grade-correction'
  | 'academic-validation'
  | 'report-card-publication'

export interface AcademicAuthorityQueueRecord {
  id: string
  entity: AcademicAuthorityEntity
  title: string
  detail: string | null
  status: string
  severity: AcademicAuthoritySeverity
  created_at: string
  effective_at: string | null
  metadata: Record<string, unknown>
}

export interface AcademicAuthoritySignals {
  corrections: AcademicAuthorityQueueRecord[]
  closures: AcademicAuthorityQueueRecord[]
  timetablePublications: AcademicAuthorityQueueRecord[]
  gradeCorrections: AcademicAuthorityQueueRecord[]
  validations: AcademicAuthorityQueueRecord[]
  reportCardPublications: AcademicAuthorityQueueRecord[]
  warnings: string[]
}
