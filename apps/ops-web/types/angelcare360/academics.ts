import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360LessonStatus = 'draft' | 'planned' | 'completed' | 'cancelled' | 'archived'
export type Angelcare360AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived'
export type Angelcare360SubmissionStatus = 'pending' | 'draft' | 'submitted' | 'late' | 'reviewed' | 'graded' | 'missing' | 'archived'
export type Angelcare360ExamStatus = 'draft' | 'planned' | 'scheduled' | 'active' | 'open' | 'completed' | 'closed' | 'graded' | 'archived'
export type Angelcare360ExamSessionStatus = 'planned' | 'scheduled' | 'open' | 'closed' | 'archived'
export type Angelcare360MarkStatus = 'active' | 'adjusted' | 'archived'
export type Angelcare360ReportCardStatus = 'draft' | 'calculated' | 'reviewed' | 'approved' | 'published' | 'archived'
export type Angelcare360AcademicCommentStatus = 'active' | 'archived'

export interface Angelcare360LessonRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  subject_id: Angelcare360UUID
  staff_id?: Angelcare360UUID | null
  lesson_code: string
  lesson_date: string
  topic: string
  objectives?: string | null
  homework_summary?: string | null
  status: Angelcare360LessonStatus | string
}

export interface Angelcare360LessonListRecord extends Angelcare360LessonRecord {
  academic_year_label?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  staff_full_name?: string | null
  detail_href?: string
}

export interface Angelcare360AssignmentRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  subject_id: Angelcare360UUID
  created_by_staff_id?: Angelcare360UUID | null
  assignment_code: string
  title: string
  description?: string | null
  due_on?: string | null
  max_score?: number | null
  status: Angelcare360AssignmentStatus | string
}

export interface Angelcare360AssignmentListRecord extends Angelcare360AssignmentRecord {
  academic_year_label?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  staff_full_name?: string | null
  submission_count?: number
  pending_submission_count?: number
  review_ready_count?: number
  detail_href?: string
}

export interface Angelcare360AssignmentSubmissionRecord extends Angelcare360BaseRecord {
  assignment_id: Angelcare360UUID
  student_id: Angelcare360UUID
  submitted_at?: string | null
  score?: number | null
  feedback?: string | null
  status: Angelcare360SubmissionStatus | string
}

export interface Angelcare360AssignmentSubmissionListRecord extends Angelcare360AssignmentSubmissionRecord {
  assignment_title?: string | null
  assignment_code?: string | null
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  due_on?: string | null
  late?: boolean
  detail_href?: string
}

export interface Angelcare360ExamRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  subject_id: Angelcare360UUID
  exam_code: string
  title: string
  exam_type: string
  scheduled_on: string
  duration_minutes?: number | null
  max_score?: number | null
  status: Angelcare360ExamStatus | string
}

export interface Angelcare360ExamListRecord extends Angelcare360ExamRecord {
  academic_year_label?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  session_count?: number
  mark_count?: number
  detail_href?: string
}

export interface Angelcare360ExamSessionRecord extends Angelcare360BaseRecord {
  exam_id: Angelcare360UUID
  session_code: string
  room?: string | null
  starts_at?: string | null
  ends_at?: string | null
  invigilator_staff_id?: Angelcare360UUID | null
  status: Angelcare360ExamSessionStatus | string
}

export interface Angelcare360ExamSessionListRecord extends Angelcare360ExamSessionRecord {
  exam_title?: string | null
  exam_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  invigilator_full_name?: string | null
  detail_href?: string
}

export interface Angelcare360MarkRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  subject_id: Angelcare360UUID
  exam_id?: Angelcare360UUID | null
  assignment_id?: Angelcare360UUID | null
  assessment_type: string
  score: number
  max_score: number
  grade?: string | null
  recorded_by_staff_id?: Angelcare360UUID | null
  recorded_at: string
  mark_state?: string | null
  status: Angelcare360MarkStatus | string
}

export interface Angelcare360MarkListRecord extends Angelcare360MarkRecord {
  student_full_name?: string | null
  student_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  exam_title?: string | null
  assignment_title?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  recorded_by_full_name?: string | null
  detail_href?: string
}

export interface Angelcare360ReportCardLineRecord extends Angelcare360BaseRecord {
  report_card_id: Angelcare360UUID
  subject_id: Angelcare360UUID
  teacher_comment_id?: Angelcare360UUID | null
  mark_average?: number | null
  coefficient: number
  letter_grade?: string | null
  remarks?: string | null
  status: string
}

export interface Angelcare360ReportCardLineListRecord extends Angelcare360ReportCardLineRecord {
  subject_name?: string | null
  subject_code?: string | null
  teacher_comment_text?: string | null
}

export interface Angelcare360ReportCardRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  term_id?: Angelcare360UUID | null
  report_card_code: string
  generated_on: string
  overall_average?: number | null
  rank_position?: number | null
  attendance_summary?: string | null
  status: Angelcare360ReportCardStatus | string
}

export interface Angelcare360ReportCardListRecord extends Angelcare360ReportCardRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  term_label?: string | null
  line_count?: number
  ready_for_calculation?: boolean
  detail_href?: string
}

export interface Angelcare360TeacherCommentRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  term_id?: Angelcare360UUID | null
  staff_id: Angelcare360UUID
  comment_type: string
  comment_text: string
  rating?: number | null
  status: Angelcare360AcademicCommentStatus | string
}

export interface Angelcare360TeacherCommentListRecord extends Angelcare360TeacherCommentRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  term_label?: string | null
  staff_full_name?: string | null
  detail_href?: string
}

export interface Angelcare360AcademicAverageReadinessRecord {
  schoolId: Angelcare360UUID
  academicYearId?: Angelcare360UUID | null
  termId?: Angelcare360UUID | null
  classId?: Angelcare360UUID | null
  sectionId?: Angelcare360UUID | null
  studentId?: Angelcare360UUID | null
  subjectId?: Angelcare360UUID | null
  marksCount: number
  coefficientsReady: boolean
  formulaReady: boolean
  termSelected: boolean
  studentSelected: boolean
  classSelected: boolean
  canCalculate: boolean
  reason?: string | null
}

export interface Angelcare360AcademicOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  activeTermId?: Angelcare360UUID | null
  activeTermLabel?: string | null
  classCount: number
  sectionCount: number
  subjectCount: number
  teacherAssignmentCount: number
  lessonCount: number
  lessonPlannedCount: number
  lessonCompletedCount: number
  assignmentCount: number
  assignmentPublishedCount: number
  pendingSubmissionCount: number
  examCount: number
  examScheduledCount: number
  examSessionCount: number
  missingMarkCount: number
  markCount: number
  reportCardCount: number
  reportCardDraftCount: number
  reportCardReviewCount: number
  reportCardApprovedCount: number
  reportCardPublishedCount: number
  teacherCommentCount: number
  missingTeacherCommentCount: number
  readiness: Angelcare360AcademicAverageReadinessRecord
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
}

export type Angelcare360AcademicAuditFilter = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: string | null
  actorRole?: string | null
  from?: string | null
  to?: string | null
}
