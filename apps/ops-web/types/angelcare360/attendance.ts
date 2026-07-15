import type { Angelcare360BaseRecord, Angelcare360Json, Angelcare360UUID } from './database'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'justified'
  | 'pending_justification'
  | 'left_early'
  | 'unknown'

export type Angelcare360AttendanceSessionStatus =
  | 'draft'
  | 'open'
  | 'partially_completed'
  | 'completed'
  | 'closed'
  | 'locked'
  | 'cancelled'

export type Angelcare360AttendanceJustificationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled'

export type Angelcare360TimetableStatus = 'active' | 'draft' | 'suspended' | 'archived'

export interface Angelcare360AttendanceSessionRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  session_date: string
  session_key: string
  status: Angelcare360AttendanceSessionStatus | string
  opened_by?: Angelcare360UUID | null
  closed_by?: Angelcare360UUID | null
  opened_at?: string | null
  closed_at?: string | null
}

export interface Angelcare360AttendanceSessionListRecord extends Angelcare360AttendanceSessionRecord {
  academic_year_label?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  expected_students?: number
  marked_students?: number
  present_count?: number
  absent_count?: number
  late_count?: number
  excused_count?: number
  completion_rate?: number
  is_closed?: boolean
  detail_href?: string
}

export interface Angelcare360AttendanceRecord extends Angelcare360BaseRecord {
  attendance_session_id: Angelcare360UUID
  student_id: Angelcare360UUID
  attendance_type?: string
  attendance_status: Angelcare360AttendanceStatus | string
  recorded_at?: string | null
  check_in_at?: string | null
  check_out_at?: string | null
  minutes_late?: number | null
  reason?: string | null
  note?: string | null
  correction_status?: string | null
  justification_required?: boolean
  status: string
}

export interface Angelcare360AttendanceRecordListRecord extends Angelcare360AttendanceRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  session_date?: string | null
  session_status?: string | null
  justification_status?: Angelcare360AttendanceJustificationStatus | string | null
  detail_href?: string
}

export interface Angelcare360AttendanceJustificationRecord extends Angelcare360BaseRecord {
  attendance_record_id: Angelcare360UUID
  justification_code: string
  reason_category: string
  description: string
  evidence_document_id?: Angelcare360UUID | null
  submitted_by?: Angelcare360UUID | null
  submitted_at?: string | null
  reviewed_by?: Angelcare360UUID | null
  reviewed_at?: string | null
  decision: Angelcare360AttendanceJustificationStatus | string
  decision_reason?: string | null
  status: string
}

export interface Angelcare360AttendanceJustificationListRecord extends Angelcare360AttendanceJustificationRecord {
  student_full_name?: string | null
  student_code?: string | null
  session_date?: string | null
  attendance_status?: string | null
  detail_href?: string
}

export interface Angelcare360AttendanceStatusHistoryRecord extends Angelcare360BaseRecord {
  attendance_record_id: Angelcare360UUID
  from_status?: string | null
  to_status: string
  changed_by?: Angelcare360UUID | null
  changed_at: string
  note?: string | null
  status: string
}

export interface Angelcare360TimetableSlotRecord extends Angelcare360BaseRecord {
  academic_year_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  subject_id: Angelcare360UUID
  staff_id?: Angelcare360UUID | null
  day_of_week: number
  start_time: string
  end_time: string
  room?: string | null
  slot_type?: string | null
  status: Angelcare360TimetableStatus | string
}

export interface Angelcare360TimetableSlotListRecord extends Angelcare360TimetableSlotRecord {
  academic_year_label?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  subject_name?: string | null
  subject_code?: string | null
  staff_full_name?: string | null
  conflict_count?: number
  detail_href?: string
}

export interface Angelcare360SchoolCalendarEventRecord extends Angelcare360BaseRecord {
  academic_year_id?: Angelcare360UUID | null
  event_code: string
  title: string
  description?: string | null
  event_type: string
  starts_on: string
  ends_on: string
  all_day: boolean
  audience: string
  status: string
}

export interface Angelcare360SchoolCalendarEventListRecord extends Angelcare360SchoolCalendarEventRecord {
  academic_year_label?: string | null
  detail_href?: string
}

export interface Angelcare360AttendanceOverviewRecord {
  schoolCount: number
  activeStudents: number
  activeParents: number
  activeTeachers: number
  activeStaff: number
  activeClasses: number
  activeAcademicYearLabel?: string | null
  todaySessions: number
  completedSessions: number
  incompleteSessions: number
  expectedStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  pendingJustifications: number
  missingAttendanceSheets: number
  repeatedAbsences: number
  repeatedLates: number
  timetableSlots: number
  calendarEvents: number
  completionRate: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
}

export interface Angelcare360AttendanceDayClassRecord {
  classId: Angelcare360UUID
  className: string
  classCode?: string | null
  sectionId?: Angelcare360UUID | null
  sectionName?: string | null
  sectionCode?: string | null
  expectedStudents: number
  markedStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  completionRate: number
  hasSession: boolean
  sessionId?: Angelcare360UUID | null
  sessionStatus?: Angelcare360AttendanceSessionStatus | string | null
  detailHref: string
}

export interface Angelcare360AttendanceSheetRecord {
  studentId: Angelcare360UUID
  studentFullName: string
  studentCode?: string | null
  className?: string | null
  sectionName?: string | null
  enrollmentStatus?: string | null
  attendanceRecordId?: Angelcare360UUID | null
  attendanceStatus: Angelcare360AttendanceStatus | string
  minutesLate?: number | null
  note?: string | null
  justificationId?: Angelcare360UUID | null
  justificationStatus?: Angelcare360AttendanceJustificationStatus | string | null
  statusHistory?: Angelcare360AttendanceStatusHistoryRecord[]
}

export interface Angelcare360AttendanceSheetRecordInput {
  studentId: string
  attendanceStatus: string
  minutesLate?: number | null
  note?: string | null
  reason?: string | null
  justificationRequired?: boolean
}

export interface Angelcare360AttendanceDayState {
  selectedDate: string
  activeSchoolName?: string | null
  activeAcademicYearLabel?: string | null
  sessions: Angelcare360AttendanceSessionListRecord[]
  classes: Angelcare360AttendanceDayClassRecord[]
  totalExpectedStudents: number
  totalMarkedStudents: number
  totalCompletionRate: number
  risks: string[]
}

export interface Angelcare360AttendanceQueryFilters {
  schoolId?: string | null
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
  studentId?: string | null
  status?: string | null
  date?: string | null
  from?: string | null
  to?: string | null
  search?: string | null
}

export interface Angelcare360AttendanceNavigationItem {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export interface Angelcare360AttendanceTimetableConflict {
  type: 'teacher_overlap' | 'class_overlap' | 'section_overlap' | 'time_invalid' | 'duplicate_slot'
  label: string
  message: string
  slotIds: Angelcare360UUID[]
  severity: 'warning' | 'critical'
}

export interface Angelcare360AttendanceTimetableConflictResult {
  ok: boolean
  conflicts: Angelcare360AttendanceTimetableConflict[]
}

export interface Angelcare360AttendanceMutationResult<T = { id: string }> {
  ok: boolean
  record?: T | null
  warning?: string | null
  error?: string | null
}

export interface Angelcare360AttendanceSheetResponse {
  session: Angelcare360AttendanceSessionListRecord | null
  students: Angelcare360AttendanceSheetRecord[]
  expectedStudents: number
  markedStudents: number
  completionRate: number
  isClosed: boolean
  risks: string[]
}
