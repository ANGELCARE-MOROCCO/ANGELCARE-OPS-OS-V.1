import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360AttendanceAbsenceRecordsQuerySchema,
  angelcare360AttendanceAuditFilterSchema,
  angelcare360AttendanceBulkUpdateSchema,
  angelcare360AttendanceJustificationCreateSchema,
  angelcare360AttendanceJustificationDecisionSchema,
  angelcare360AttendanceJustificationUpdateSchema,
  angelcare360AttendanceLateRecordsQuerySchema,
  angelcare360AttendanceRecordUpdateSchema,
  angelcare360AttendanceSessionCloseSchema,
  angelcare360AttendanceSessionOpenSchema,
  angelcare360AttendanceSessionQuerySchema,
  angelcare360AttendanceStudentSummaryQuerySchema,
  type Angelcare360ValidationResult,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360AttendanceDayClassRecord,
  Angelcare360AttendanceDayState,
  Angelcare360AttendanceJustificationListRecord,
  Angelcare360AttendanceJustificationRecord,
  Angelcare360AttendanceOverviewRecord,
  Angelcare360AttendanceRecordListRecord,
  Angelcare360AttendanceSessionListRecord,
  Angelcare360AttendanceSheetRecord,
  Angelcare360AttendanceSheetResponse,
  Angelcare360AttendanceStatusHistoryRecord,
  Angelcare360AttendanceTimetableConflictResult,
  Angelcare360SchoolCalendarEventListRecord,
  Angelcare360TimetableSlotListRecord,
} from '@/types/angelcare360/attendance'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asMaybeString(value: unknown) {
  const text = asString(value).trim()
  return text || null
}

function toDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toDayKey(value?: string | null) {
  const parsed = toDate(value)
  return parsed ? parsed.toISOString().slice(0, 10) : null
}

function isClosedStatus(status: unknown) {
  return ['closed', 'locked'].includes(String(status || '').toLowerCase())
}

function buildHref(basePath: string, id: string) {
  return `${basePath}/${id}`
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && String(value).trim())).map((value) => value.trim())))
}

function attendanceLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'present') return 'mark_present'
  if (normalized === 'absent') return 'mark_absent'
  if (normalized === 'late') return 'mark_late'
  if (normalized === 'excused' || normalized === 'justified') return 'mark_excused'
  if (normalized === 'left_early') return 'mark_left_early'
  return 'status_changed'
}

async function countRows(client: SupabaseClient, table: string, schoolId?: string | null, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (schoolId) query = query.eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

function parseValidationErrors<T>(result: Angelcare360ValidationResult<T>, fallback: string) {
  if (result.success) return null
  return result.errors[0]?.message || fallback
}

async function getContext(permissionKey: string, schoolId?: string | null) {
  return requireAngelcare360Permission(permissionKey, { schoolId })
}

function emptyAttendanceOverview(): Angelcare360AttendanceOverviewRecord {
  return {
    schoolCount: 0,
    activeStudents: 0,
    activeParents: 0,
    activeTeachers: 0,
    activeStaff: 0,
    activeClasses: 0,
    activeAcademicYearLabel: null,
    todaySessions: 0,
    completedSessions: 0,
    incompleteSessions: 0,
    expectedStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    pendingJustifications: 0,
    missingAttendanceSheets: 0,
    repeatedAbsences: 0,
    repeatedLates: 0,
    timetableSlots: 0,
    calendarEvents: 0,
    completionRate: 0,
    latestAuditEvents: [],
    risks: [],
  }
}

function mapSessionRow(row: Row, counts: { expected: number; marked: number; present: number; absent: number; late: number; excused: number; records: Row[]; }) {
  const completionRate = counts.expected > 0 ? Math.round((counts.marked / counts.expected) * 100) : 0
  const classRecord = (row.class as Row | undefined) || {}
  const sectionRecord = (row.section as Row | undefined) || {}
  const academicYearRecord = (row.academic_year as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    session_date: asString(row.session_date),
    session_key: asString(row.session_key || 'daily'),
    status: asString(row.status),
    opened_by: row.opened_by ? asString(row.opened_by) : null,
    closed_by: row.closed_by ? asString(row.closed_by) : null,
    opened_at: row.opened_at ? asString(row.opened_at) : null,
    closed_at: row.closed_at ? asString(row.closed_at) : null,
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    academic_year_label: academicYearRecord.label ? asString(academicYearRecord.label) : null,
    class_name: classRecord.name ? asString(classRecord.name) : null,
    class_code: classRecord.class_code ? asString(classRecord.class_code) : null,
    section_name: sectionRecord.name ? asString(sectionRecord.name) : null,
    section_code: sectionRecord.section_code ? asString(sectionRecord.section_code) : null,
    expected_students: counts.expected,
    marked_students: counts.marked,
    present_count: counts.present,
    absent_count: counts.absent,
    late_count: counts.late,
    excused_count: counts.excused,
    completion_rate: completionRate,
    is_closed: isClosedStatus(row.status),
    detail_href: buildHref('/angelcare-360-command-center/presences/classes', asString(row.class_id)),
    records: counts.records,
  } as Angelcare360AttendanceSessionListRecord & { records: Row[] }
}

function mapRecordRow(row: Row): Angelcare360AttendanceRecordListRecord {
  const student = (row.student as Row | undefined) || {}
  const classRecord = (row.class as Row | undefined) || {}
  const sectionRecord = (row.section as Row | undefined) || {}
  const session = (row.session as Row | undefined) || {}
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    attendance_session_id: asString(row.attendance_session_id),
    student_id: asString(row.student_id),
    attendance_type: asMaybeString(row.attendance_type || 'student') || 'student',
    attendance_status: asString(row.attendance_status),
    recorded_at: row.recorded_at ? asString(row.recorded_at) : null,
    check_in_at: row.check_in_at ? asString(row.check_in_at) : null,
    check_out_at: row.check_out_at ? asString(row.check_out_at) : null,
    minutes_late: row.minutes_late === null || row.minutes_late === undefined ? null : Number(row.minutes_late),
    note: row.note ? asString(row.note) : null,
    correction_status: metadata.correction_status ? asString(metadata.correction_status) : null,
    justification_required: Boolean(row.justification_required),
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: metadata,
    student_full_name: student.full_name ? asString(student.full_name) : null,
    student_code: student.student_code ? asString(student.student_code) : null,
    class_name: classRecord.name ? asString(classRecord.name) : null,
    class_code: classRecord.class_code ? asString(classRecord.class_code) : null,
    section_name: sectionRecord.name ? asString(sectionRecord.name) : null,
    section_code: sectionRecord.section_code ? asString(sectionRecord.section_code) : null,
    session_date: session.session_date ? asString(session.session_date) : null,
    session_status: session.status ? asString(session.status) : null,
    justification_status: metadata.justification_status ? asString(metadata.justification_status) : null,
    detail_href: buildHref('/angelcare-360-command-center/presences/classes', asString(row.attendance_session_id)),
  }
}

function mapJustificationRow(row: Row): Angelcare360AttendanceJustificationListRecord {
  const record = (row.record as Row | undefined) || {}
  const student = (row.student as Row | undefined) || {}
  const session = (row.session as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    attendance_record_id: asString(row.attendance_record_id),
    justification_code: asString(row.justification_code),
    reason_category: asString(row.reason_category),
    description: asString(row.description),
    evidence_document_id: row.evidence_document_id ? asString(row.evidence_document_id) : null,
    submitted_by: row.submitted_by ? asString(row.submitted_by) : null,
    submitted_at: row.submitted_at ? asString(row.submitted_at) : null,
    reviewed_by: row.reviewed_by ? asString(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at ? asString(row.reviewed_at) : null,
    decision: asString(row.decision),
    decision_reason: row.decision_reason ? asString(row.decision_reason) : null,
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    student_full_name: student.full_name ? asString(student.full_name) : null,
    student_code: student.student_code ? asString(student.student_code) : null,
    session_date: session.session_date ? asString(session.session_date) : null,
    attendance_status: record.attendance_status ? asString(record.attendance_status) : null,
    detail_href: buildHref('/angelcare-360-command-center/presences/justifications', asString(row.id)),
  }
}

function mapTimetableRow(row: Row): Angelcare360TimetableSlotListRecord {
  const classRecord = (row.class as Row | undefined) || {}
  const sectionRecord = (row.section as Row | undefined) || {}
  const subjectRecord = (row.subject as Row | undefined) || {}
  const staffRecord = (row.staff as Row | undefined) || {}
  const academicYear = (row.academic_year as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    subject_id: asString(row.subject_id),
    staff_id: row.staff_id ? asString(row.staff_id) : null,
    day_of_week: Number(row.day_of_week || 1),
    start_time: asString(row.start_time),
    end_time: asString(row.end_time),
    room: row.room ? asString(row.room) : null,
    slot_type: row.slot_type ? asString(row.slot_type) : null,
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    academic_year_label: academicYear.label ? asString(academicYear.label) : null,
    class_name: classRecord.name ? asString(classRecord.name) : null,
    class_code: classRecord.class_code ? asString(classRecord.class_code) : null,
    section_name: sectionRecord.name ? asString(sectionRecord.name) : null,
    section_code: sectionRecord.section_code ? asString(sectionRecord.section_code) : null,
    subject_name: subjectRecord.name ? asString(subjectRecord.name) : null,
    subject_code: subjectRecord.subject_code ? asString(subjectRecord.subject_code) : null,
    staff_full_name: staffRecord.full_name ? asString(staffRecord.full_name) : null,
    conflict_count: Number((row.conflict_count as number | undefined) || 0),
    detail_href: buildHref('/angelcare-360-command-center/emploi-du-temps/classes', asString(row.class_id)),
  }
}

function mapCalendarRow(row: Row): Angelcare360SchoolCalendarEventListRecord {
  const academicYear = (row.academic_year as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: row.academic_year_id ? asString(row.academic_year_id) : null,
    event_code: asString(row.event_code),
    title: asString(row.title),
    description: row.description ? asString(row.description) : null,
    event_type: asString(row.event_type),
    starts_on: asString(row.starts_on),
    ends_on: asString(row.ends_on),
    all_day: Boolean(row.all_day),
    audience: asString(row.audience),
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    academic_year_label: academicYear.label ? asString(academicYear.label) : null,
    detail_href: buildHref('/angelcare-360-command-center/emploi-du-temps/calendrier', asString(row.id)),
  }
}

export async function getAngelcare360AttendanceOverview(options?: { schoolId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null

  const supabase = await createClient()
  const schoolId = context.school.id
  const foundation = await Promise.all([
    countRows(supabase, 'angelcare360_students', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_parents', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_staff', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_classes', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_attendance_sessions', schoolId),
    countRows(supabase, 'angelcare360_attendance_records', schoolId),
    countRows(supabase, 'angelcare360_attendance_justifications', schoolId),
    countRows(supabase, 'angelcare360_timetable_slots', schoolId),
    countRows(supabase, 'angelcare360_school_calendar_events', schoolId),
    countRows(supabase, 'angelcare360_audit_logs', schoolId, [['module', 'in', ['attendance', 'timetable']]]),
  ])

  const [studentsResponse, docsResponse, contactsResponse, enrollmentsResponse, sessionsResponse, recordsResponse, justificationsResponse, yearsResponse, staffRowsResponse, auditResponse] = await Promise.all([
    supabase.from('angelcare360_students').select('id, current_class_id, current_section_id, status').eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('angelcare360_documents').select('id, documentable_type, documentable_id, status').eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('angelcare360_emergency_contacts').select('id, contactable_type, contactable_id, status').eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('angelcare360_class_enrollments').select('id, student_id, class_id, section_id, academic_year_id, status').eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('angelcare360_attendance_sessions').select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_by, closed_by, opened_at, closed_at, created_at, updated_at, metadata_json, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), academic_year:angelcare360_academic_years(id, label)').eq('school_id', schoolId).order('session_date', { ascending: false }).limit(120),
    supabase.from('angelcare360_attendance_records').select('id, school_id, attendance_session_id, student_id, attendance_type, attendance_status, recorded_at, check_in_at, check_out_at, minutes_late, note, justification_required, status, created_at, updated_at, metadata_json, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date, status, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code))').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(250),
    supabase.from('angelcare360_attendance_justifications').select('id, school_id, attendance_record_id, justification_code, reason_category, description, evidence_document_id, submitted_by, submitted_at, reviewed_by, reviewed_at, decision, decision_reason, status, created_at, updated_at, metadata_json, record:angelcare360_attendance_records(id, attendance_status, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date))').eq('school_id', schoolId).order('submitted_at', { ascending: false }).limit(120),
    supabase.from('angelcare360_academic_years').select('id, label, is_current, status').eq('school_id', schoolId).order('is_current', { ascending: false }).order('starts_on', { ascending: false }).limit(1),
    supabase.from('angelcare360_staff').select('id, staff_type, status').eq('school_id', schoolId).eq('status', 'active'),
    supabase.from('angelcare360_audit_logs').select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, metadata, created_at').eq('school_id', schoolId).or('module.eq.attendance,module.eq.timetable').order('created_at', { ascending: false }).limit(6),
  ])

  const activeStudents = foundation[0]
  const activeParents = foundation[1]
  const activeStaff = foundation[2]
  const activeClasses = foundation[3]
  const todaySessions = foundation[4]
  const totalRecords = foundation[5]
  const totalJustifications = foundation[6]
  const timetableSlots = foundation[7]
  const calendarEvents = foundation[8]

  const enrollmentRows = (enrollmentsResponse.data || []) as Row[]
  const studentRows = (studentsResponse.data || []) as Row[]
  const documentRows = (docsResponse.data || []).filter((row) => (row as Row).documentable_type === 'student') as Row[]
  const contactRows = (contactsResponse.data || []).filter((row) => (row as Row).contactable_type === 'student') as Row[]

  const linkedStudents = new Set<string>()
  for (const row of enrollmentRows) {
    linkedStudents.add(asString(row.student_id))
  }

  const withClass = studentRows.filter((row) => row.current_class_id || row.current_section_id).length
  const missingDocs = studentRows.filter((row) => !documentRows.some((doc) => asString(doc.documentable_id) === asString(row.id))).length
  const missingContacts = studentRows.filter((row) => !contactRows.some((contact) => asString(contact.contactable_id) === asString(row.id))).length
  const incompleteDossiers = studentRows.filter((row) => !row.current_class_id || !row.current_section_id || !documentRows.some((doc) => asString(doc.documentable_id) === asString(row.id)) || !contactRows.some((contact) => asString(contact.contactable_id) === asString(row.id))).length
  const attendanceByStatus = (recordsResponse.data || []) as Row[]
  const presentCount = attendanceByStatus.filter((row) => asString(row.attendance_status) === 'present').length
  const absentCount = attendanceByStatus.filter((row) => asString(row.attendance_status) === 'absent').length
  const lateCount = attendanceByStatus.filter((row) => asString(row.attendance_status) === 'late').length
  const excusedCount = attendanceByStatus.filter((row) => ['excused', 'justified'].includes(asString(row.attendance_status))).length
  const pendingJustifications = (justificationsResponse.data || []).filter((row) => asString(row.decision) === 'pending').length

  const repeatedAbsences = studentRows.filter((student) => attendanceByStatus.filter((record) => asString(record.student_id) === asString(student.id) && asString(record.attendance_status) === 'absent').length >= 3).length
  const repeatedLates = studentRows.filter((student) => attendanceByStatus.filter((record) => asString(record.student_id) === asString(student.id) && asString(record.attendance_status) === 'late').length >= 3).length

  const completionRate = totalRecords > 0 ? Math.round(((presentCount + absentCount + lateCount + excusedCount) / Math.max(totalRecords, 1)) * 100) : 0
  const risks: string[] = []
  if (!context.academicYear) risks.push('Aucune année scolaire active n’est résolue.')
  if (!activeClasses) risks.push('Aucune classe active n’est configurée.')
  if (withClass === 0) risks.push('Aucun élève n’a encore d’affectation de classe.')
  if (missingDocs > 0) risks.push(`${missingDocs} dossier(s) élève n’ont pas leurs documents complets.`)
  if (missingContacts > 0) risks.push(`${missingContacts} dossier(s) élève n’ont pas de contact d’urgence.`)
  if (pendingJustifications > 0) risks.push(`${pendingJustifications} justification(s) sont en attente de décision.`)
  if (repeatedAbsences > 0) risks.push(`${repeatedAbsences} élève(s) cumulent des absences répétées.`)
  if (repeatedLates > 0) risks.push(`${repeatedLates} élève(s) cumulent des retards répétés.`)
  if (todaySessions === 0) risks.push('Aucune session de présence n’est ouverte aujourd’hui.')

  const latestAuditEvents = ((auditResponse.data || []) as Array<Row>).map((row) => row as unknown as Angelcare360AuditRecord)
  const teacherRows = (staffRowsResponse.data || []) as Row[]

  return {
    schoolCount: 1,
    activeStudents,
    activeParents,
    activeTeachers: countTeacherRows(teacherRows),
    activeStaff,
    activeClasses,
    activeAcademicYearLabel: context.academicYear?.label || null,
    todaySessions,
    completedSessions: (sessionsResponse.data || []).filter((row) => isClosedStatus((row as Row).status)).length,
    incompleteSessions: (sessionsResponse.data || []).filter((row) => !isClosedStatus((row as Row).status)).length,
    expectedStudents: studentRows.length,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    pendingJustifications,
    missingAttendanceSheets: activeClasses - todaySessions,
    repeatedAbsences,
    repeatedLates,
    timetableSlots,
    calendarEvents,
    completionRate,
    latestAuditEvents,
    risks,
  }
}

function countTeacherRows(rows: Row[]) {
  return rows.filter((row) => String(row.staff_type || row.role_label || '').toLowerCase().includes('teacher') || String(row.staff_type || '').toLowerCase().includes('enseignant')).length
}

export async function getAngelcare360DailyAttendanceState(options?: { schoolId?: string | null; date?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null
  const selectedDate = toDayKey(options?.date) || new Date().toISOString().slice(0, 10)
  const dayClasses = await listAngelcare360AttendanceDayClasses({ schoolId: context.school.id, date: selectedDate })
  const sessions = await listAngelcare360AttendanceSessions({ schoolId: context.school.id, date: selectedDate })
  const completeSessions = sessions.filter((session) => isClosedStatus(session.status))
  const incompleteSessions = sessions.filter((session) => !isClosedStatus(session.status))
  const totalExpectedStudents = dayClasses.reduce((sum, item) => sum + item.expectedStudents, 0)
  const totalMarkedStudents = dayClasses.reduce((sum, item) => sum + item.markedStudents, 0)
  const totalCompletionRate = totalExpectedStudents > 0 ? Math.round((totalMarkedStudents / totalExpectedStudents) * 100) : 0
  const risks = [] as string[]
  if (!context.academicYear) risks.push('Aucune année scolaire active n’est résolue.')
  if (dayClasses.length === 0) risks.push('Aucune classe n’est prête pour la présence du jour.')
  if (sessions.length === 0) risks.push('Aucune session n’a été ouverte pour la date sélectionnée.')
  if (incompleteSessions.length > 0) risks.push(`${incompleteSessions.length} session(s) restent incomplètes.`)
  return {
    selectedDate,
    activeSchoolName: context.school.name,
    activeAcademicYearLabel: context.academicYear?.label || null,
    sessions,
    classes: dayClasses,
    totalExpectedStudents,
    totalMarkedStudents,
    totalCompletionRate,
    risks,
  } satisfies Angelcare360AttendanceDayState
}

export async function listAngelcare360AttendanceDayClasses(options?: { schoolId?: string | null; date?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return []
  const supabase = await createClient()
  const selectedDate = toDayKey(options?.date) || new Date().toISOString().slice(0, 10)
  const academicYearId = context.academicYear?.id || null

  const [classesResponse, sectionsResponse, enrollmentsResponse, sessionsResponse, recordsResponse] = await Promise.all([
    supabase.from('angelcare360_classes').select('id, school_id, academic_year_id, class_code, name, level, capacity, status, order_index').eq('school_id', context.school.id).eq('status', 'active').order('order_index', { ascending: true }).order('name', { ascending: true }),
    supabase.from('angelcare360_sections').select('id, school_id, academic_year_id, class_id, section_code, name, capacity, status').eq('school_id', context.school.id).eq('status', 'active').order('name', { ascending: true }),
    supabase.from('angelcare360_class_enrollments').select('id, school_id, academic_year_id, student_id, class_id, section_id, status, student:angelcare360_students(id, full_name, student_code)').eq('school_id', context.school.id).eq('status', 'active'),
    supabase.from('angelcare360_attendance_sessions').select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_at, closed_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code)').eq('school_id', context.school.id).eq('session_date', selectedDate),
    supabase.from('angelcare360_attendance_records').select('id, school_id, attendance_session_id, student_id, attendance_status, minutes_late, note, status, student:angelcare360_students(id, full_name, student_code)').eq('school_id', context.school.id),
  ])

  const classes = (classesResponse.data || []) as Row[]
  const sections = (sectionsResponse.data || []) as Row[]
  const enrollments = (enrollmentsResponse.data || []) as Row[]
  const sessions = (sessionsResponse.data || []) as Row[]
  const records = (recordsResponse.data || []) as Row[]

  const output: Angelcare360AttendanceDayClassRecord[] = []
  for (const classRow of classes) {
    const classSections = sections.filter((section) => asString(section.class_id) === asString(classRow.id))
    const relevantSections = classSections.length > 0 ? classSections : [null]
    for (const sectionRow of relevantSections) {
      const expectedEnrollments = enrollments.filter((enrollment) => asString(enrollment.class_id) === asString(classRow.id) && (sectionRow ? asString(enrollment.section_id) === asString(sectionRow.id) : !enrollment.section_id) && (!academicYearId || asString(enrollment.academic_year_id) === academicYearId))
      const session = sessions.find((row) => asString(row.class_id) === asString(classRow.id) && (sectionRow ? asString(row.section_id) === asString(sectionRow.id) : !row.section_id))
      const linkedRecords = session ? records.filter((record) => asString(record.attendance_session_id) === asString(session.id)) : []
      const markedStudents = linkedRecords.length
      const presentCount = linkedRecords.filter((record) => asString(record.attendance_status) === 'present').length
      const absentCount = linkedRecords.filter((record) => asString(record.attendance_status) === 'absent').length
      const lateCount = linkedRecords.filter((record) => asString(record.attendance_status) === 'late').length
      const excusedCount = linkedRecords.filter((record) => ['excused', 'justified'].includes(asString(record.attendance_status))).length
      const expectedStudents = expectedEnrollments.length
      const completionRate = expectedStudents > 0 ? Math.round((markedStudents / expectedStudents) * 100) : 0
      output.push({
        classId: asString(classRow.id),
        className: asString(classRow.name),
        classCode: asMaybeString(classRow.class_code),
        sectionId: sectionRow ? asString(sectionRow.id) : null,
        sectionName: sectionRow ? asMaybeString(sectionRow.name) : null,
        sectionCode: sectionRow ? asMaybeString(sectionRow.section_code) : null,
        expectedStudents,
        markedStudents,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        completionRate,
        hasSession: Boolean(session),
        sessionId: session ? asString(session.id) : null,
        sessionStatus: session ? asString(session.status) : null,
        detailHref: `${'/angelcare-360-command-center/presences/classes'}/${classRow.id}?date=${selectedDate}${sectionRow ? `&sectionId=${sectionRow.id}` : ''}`,
      })
    }
  }

  return output
}

export async function listAngelcare360AttendanceSessions(options?: { schoolId?: string | null; date?: string | null; classId?: string | null; sectionId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_attendance_sessions')
    .select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_by, closed_by, opened_at, closed_at, created_at, updated_at, metadata_json, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)
  if (options?.date) query = query.eq('session_date', toDayKey(options.date))
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  const { data } = await query
  return (data || []).map((row) => row as unknown as Angelcare360AttendanceSessionListRecord)
}

export async function getAngelcare360AttendanceSessionById(options: { schoolId?: string | null; id: string }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return null
  const supabase = await createClient()
  const { data: session } = await supabase
    .from('angelcare360_attendance_sessions')
    .select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_by, closed_by, opened_at, closed_at, created_at, updated_at, metadata_json, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  if (!session) return null
  const records = await listAngelcare360AttendanceRecords({ schoolId: context.school.id, sessionId: options.id })
  return { session: session as unknown as Angelcare360AttendanceSessionListRecord, records }
}

export async function openAngelcare360AttendanceSession(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceSessionOpenSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parseValidationErrors(parsed, 'Session de présence invalide.') }
  }
  const context = await getContext('presences.create', parsed.data.schoolId)
  const supabase = await createClient()
  const existing = await supabase
    .from('angelcare360_attendance_sessions')
    .select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_by, closed_by, opened_at, closed_at, created_at, updated_at, metadata_json')
    .eq('school_id', context.school!.id)
    .eq('academic_year_id', parsed.data.academicYearId)
    .eq('class_id', parsed.data.classId)
    .eq('session_date', parsed.data.sessionDate)
    .eq('session_key', parsed.data.sessionKey)
    .maybeSingle()

  if (existing.data) {
    return { ok: true, record: existing.data as Angelcare360AttendanceSessionListRecord, warning: 'Une session existe déjà pour cette combinaison. La session existante a été conservée.' }
  }

  const { data, error } = await supabase
    .from('angelcare360_attendance_sessions')
    .insert({
      school_id: context.school!.id,
      academic_year_id: parsed.data.academicYearId,
      class_id: parsed.data.classId,
      section_id: parsed.data.sectionId || null,
      session_date: parsed.data.sessionDate,
      session_key: parsed.data.sessionKey,
      status: parsed.data.sessionStatus || 'open',
      metadata_json: { notes: parsed.data.notes || null },
    })
    .select('*')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: 'attendance_session.opened',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_session',
    entityId: String(data.id),
    severity: 'info',
    metadata: { sessionDate: parsed.data.sessionDate, classId: parsed.data.classId, sectionId: parsed.data.sectionId || null },
  })

  return { ok: true, record: data as Angelcare360AttendanceSessionListRecord, warning: auditResult.ok ? null : auditResult.error || 'Session créée, mais audit indisponible.' }
}

export async function closeAngelcare360AttendanceSession(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceSessionCloseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Clôture de session invalide.') }
  const context = await getContext('presences.approve', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_attendance_sessions').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.attendanceSessionId).maybeSingle()
  if (!before) return { ok: false, error: 'Session introuvable.' }
  if (isClosedStatus(before.status)) return { ok: true, record: before as Angelcare360AttendanceSessionListRecord, warning: 'La session était déjà clôturée.' }

  const { data, error } = await supabase
    .from('angelcare360_attendance_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: context.user.id, metadata_json: { ...(before.metadata_json as Record<string, unknown> || {}), closure_notes: parsed.data.notes || null } })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.attendanceSessionId)
    .select('*')
    .single()
  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: 'attendance_session.closed',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_session',
    entityId: String(parsed.data.attendanceSessionId),
    severity: 'warning',
    beforeData: before as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { notes: parsed.data.notes || null },
  })

  return { ok: true, record: data as Angelcare360AttendanceSessionListRecord, warning: auditResult.ok ? null : auditResult.error || 'Session clôturée, mais audit indisponible.' }
}

export async function listAngelcare360AttendanceRecords(options: { schoolId?: string | null; sessionId?: string | null; studentId?: string | null; classId?: string | null; date?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_attendance_records')
    .select('id, school_id, attendance_session_id, student_id, attendance_type, attendance_status, recorded_at, check_in_at, check_out_at, minutes_late, note, justification_required, status, created_at, updated_at, metadata_json, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date, status, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code))')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(300)
  if (options.sessionId) query = query.eq('attendance_session_id', options.sessionId)
  if (options.studentId) query = query.eq('student_id', options.studentId)
  const { data } = await query
  return (data || []).map((row) => mapRecordRow(row as Row))
}

export async function listAngelcare360ClassAttendanceSheet(options: { schoolId?: string | null; classId: string; date?: string | null; sectionId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return { session: null, students: [], expectedStudents: 0, markedStudents: 0, completionRate: 0, isClosed: false, risks: ['Aucun établissement actif n’est disponible.'] } satisfies Angelcare360AttendanceSheetResponse
  const selectedDate = toDayKey(options.date) || new Date().toISOString().slice(0, 10)
  const supabase = await createClient()
  const academicYearId = context.academicYear?.id || null

  const [{ data: session }, { data: enrollments }, { data: records }, { data: historyRows }] = await Promise.all([
    supabase.from('angelcare360_attendance_sessions').select('id, school_id, academic_year_id, class_id, section_id, session_date, session_key, status, opened_by, closed_by, opened_at, closed_at, created_at, updated_at, metadata_json, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), academic_year:angelcare360_academic_years(id, label)').eq('school_id', context.school.id).eq('class_id', options.classId).eq('session_date', selectedDate).maybeSingle(),
    supabase.from('angelcare360_class_enrollments').select('id, school_id, academic_year_id, student_id, class_id, section_id, status, student:angelcare360_students(id, full_name, student_code)').eq('school_id', context.school.id).eq('class_id', options.classId).eq('status', 'active'),
    supabase.from('angelcare360_attendance_records').select('id, school_id, attendance_session_id, student_id, attendance_type, attendance_status, recorded_at, check_in_at, check_out_at, minutes_late, note, justification_required, status, created_at, updated_at, metadata_json, student:angelcare360_students(id, full_name, student_code)').eq('school_id', context.school.id),
    supabase.from('angelcare360_attendance_status_history').select('id, school_id, attendance_record_id, from_status, to_status, changed_by, changed_at, note, created_at, updated_at, metadata_json').eq('school_id', context.school.id).order('changed_at', { ascending: false }).limit(200),
  ])

  const sessionRecord = session ? (session as Row) : null
  const filteredEnrollments = (enrollments || []).filter((row) => !academicYearId || asString((row as Row).academic_year_id) === academicYearId)
  const filteredBySection = options.sectionId ? filteredEnrollments.filter((row) => asString((row as Row).section_id) === options.sectionId) : filteredEnrollments
  const linkedRecords = (records || []).filter((row) => !sessionRecord || asString((row as Row).attendance_session_id) === asString(sessionRecord.id))

  const students: Angelcare360AttendanceSheetRecord[] = filteredBySection.map((enrollment) => {
    const student = ((enrollment as Row).student as Row | undefined) || {}
    const record = linkedRecords.find((item) => asString(item.student_id) === asString((enrollment as Row).student_id))
    const history = record ? (historyRows || []).filter((item) => asString((item as Row).attendance_record_id) === asString(record.id)) : []
    const metadata = record ? ((record as Row).metadata_json as Record<string, unknown> | undefined) || {} : {}
    return {
      studentId: asString((enrollment as Row).student_id),
      studentFullName: asString(student.full_name || ''),
      studentCode: student.student_code ? asString(student.student_code) : null,
      className: sessionRecord?.class?.name ? asString((sessionRecord.class as Row).name) : null,
      sectionName: sessionRecord?.section?.name ? asString((sessionRecord.section as Row).name) : null,
      enrollmentStatus: asString((enrollment as Row).status),
      attendanceRecordId: record ? asString(record.id) : null,
      attendanceStatus: record ? asString(record.attendance_status) : 'unknown',
      minutesLate: record?.minutes_late === null || record?.minutes_late === undefined ? null : Number(record.minutes_late),
      note: record?.note ? asString(record.note) : null,
      justificationId: metadata.justification_id ? asString(metadata.justification_id) : null,
      justificationStatus: metadata.justification_status ? asString(metadata.justification_status) : null,
      statusHistory: (history as Row[]).map((item) => ({
        id: asString(item.id),
        school_id: asString(item.school_id),
        attendance_record_id: asString(item.attendance_record_id),
        from_status: item.from_status ? asString(item.from_status) : null,
        to_status: asString(item.to_status),
        changed_by: item.changed_by ? asString(item.changed_by) : null,
        changed_at: asString(item.changed_at),
        note: item.note ? asString(item.note) : null,
        created_at: asString(item.created_at),
        updated_at: asString(item.updated_at),
        metadata_json: (item.metadata_json as Record<string, unknown> | undefined) || {},
      })),
    }
  })

  const expectedStudents = students.length
  const markedStudents = students.filter((student) => student.attendanceStatus !== 'unknown').length
  const completionRate = expectedStudents > 0 ? Math.round((markedStudents / expectedStudents) * 100) : 0
  const risks: string[] = []
  if (!sessionRecord) risks.push('Aucune session n’est ouverte pour ce groupe à la date sélectionnée.')
  if (students.some((student) => student.attendanceStatus === 'unknown')) risks.push('Des élèves n’ont pas encore été renseignés.')
  if (sessionRecord && isClosedStatus(sessionRecord.status)) risks.push('La session est clôturée et l’édition normale est verrouillée.')

  return {
    session: sessionRecord ? mapSessionRow(sessionRecord, {
      expected: expectedStudents,
      marked: markedStudents,
      present: students.filter((student) => student.attendanceStatus === 'present').length,
      absent: students.filter((student) => student.attendanceStatus === 'absent').length,
      late: students.filter((student) => student.attendanceStatus === 'late').length,
      excused: students.filter((student) => ['excused', 'justified'].includes(student.attendanceStatus)).length,
      records: linkedRecords,
    }) : null,
    students,
    expectedStudents,
    markedStudents,
    completionRate,
    isClosed: Boolean(sessionRecord && isClosedStatus(sessionRecord.status)),
    risks,
  } satisfies Angelcare360AttendanceSheetResponse
}

export async function updateAngelcare360AttendanceRecord(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceRecordUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Présence invalide.') }
  const context = await getContext('presences.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: session } = await supabase.from('angelcare360_attendance_sessions').select('id, status').eq('school_id', context.school!.id).eq('id', parsed.data.attendanceSessionId).maybeSingle()
  if (!session) return { ok: false, error: 'Session introuvable.' }
  if (isClosedStatus((session as Row).status) && !context.permissions.has('presences.approve') && context.access.accessLevel !== 'super_admin') {
    return { ok: false, error: 'La session est clôturée. Une autorisation d’approbation est requise pour modifier les présences.' }
  }

  const { data: before } = await supabase
    .from('angelcare360_attendance_records')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('attendance_session_id', parsed.data.attendanceSessionId)
    .eq('student_id', parsed.data.studentId)
    .maybeSingle()

  const payload = {
    school_id: context.school!.id,
    attendance_session_id: parsed.data.attendanceSessionId,
    student_id: parsed.data.studentId,
    attendance_status: parsed.data.attendanceStatus,
    minutes_late: parsed.data.minutesLate ?? null,
    note: parsed.data.note ?? null,
    justification_required: Boolean(parsed.data.justificationRequired),
    status: 'active',
    metadata_json: {
      ...(before?.metadata_json && typeof before.metadata_json === 'object' ? before.metadata_json : {}),
      updated_from_phase6: true,
    },
  }

  const { data, error } = await supabase
    .from('angelcare360_attendance_records')
    .upsert(payload, { onConflict: 'attendance_session_id,student_id' })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await supabase.from('angelcare360_attendance_status_history').insert({
    school_id: context.school!.id,
    attendance_record_id: String(data.id),
    from_status: before?.attendance_status || null,
    to_status: parsed.data.attendanceStatus,
    changed_by: context.user.id,
    changed_at: new Date().toISOString(),
    note: parsed.data.note || null,
    metadata_json: {
      minutesLate: parsed.data.minutesLate ?? null,
      justificationRequired: Boolean(parsed.data.justificationRequired),
    },
  })

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: `attendance_record.${attendanceLabel(parsed.data.attendanceStatus)}`,
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_record',
    entityId: String(data.id),
    severity: parsed.data.attendanceStatus === 'absent' || parsed.data.attendanceStatus === 'late' ? 'warning' : 'info',
    beforeData: before || undefined,
    afterData: data as Record<string, unknown>,
    metadata: { sessionId: parsed.data.attendanceSessionId, studentId: parsed.data.studentId },
  })

  return { ok: true, record: data as Angelcare360AttendanceRecordListRecord, warning: auditResult.ok ? null : auditResult.error || 'Présence enregistrée, mais audit indisponible.' }
}

export async function bulkUpdateAngelcare360AttendanceRecords(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceBulkUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Lot de présence invalide.') }
  const context = await getContext('presences.update', parsed.data.schoolId)
  const results: Array<Angelcare360AttendanceRecordListRecord> = []
  for (const record of parsed.data.records) {
    const result = await updateAngelcare360AttendanceRecord({ ...record, schoolId: parsed.data.schoolId, attendanceSessionId: parsed.data.attendanceSessionId })
    if (!result.ok) return result
    if (result.record) results.push(result.record)
  }
  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: 'attendance_record.bulk_updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_session',
    entityId: parsed.data.attendanceSessionId,
    severity: 'warning',
    metadata: { updatedCount: results.length },
  })
  return { ok: true, record: { id: parsed.data.attendanceSessionId }, warning: auditResult.ok ? null : auditResult.error || 'Lot enregistré, mais audit indisponible.' }
}

export async function getAngelcare360StudentAttendanceSummary(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceStudentSummaryQuerySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Résumé de présence invalide.') }
  const context = await getAngelcare360AccessContext({ schoolId: parsed.data.schoolId })
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif.' }
  const supabase = await createClient()
  let query = supabase.from('angelcare360_attendance_records').select('id, student_id, attendance_status, minutes_late, note, created_at, session:angelcare360_attendance_sessions(id, session_date, class_id, section_id, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code))').eq('school_id', context.school.id)
  if (parsed.data.studentId) query = query.eq('student_id', parsed.data.studentId)
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data } = await query.order('created_at', { ascending: false }).limit(300)
  const rows = (data || []) as Row[]
  const counts = {
    present: rows.filter((row) => asString(row.attendance_status) === 'present').length,
    absent: rows.filter((row) => asString(row.attendance_status) === 'absent').length,
    late: rows.filter((row) => asString(row.attendance_status) === 'late').length,
    excused: rows.filter((row) => ['excused', 'justified'].includes(asString(row.attendance_status))).length,
    unknown: rows.filter((row) => asString(row.attendance_status) === 'unknown').length,
  }
  return { ok: true, record: { counts, rows: rows.map(mapRecordRow) } }
}

export async function listAngelcare360LateRecords(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceLateRecordsQuerySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Filtre retards invalide.') }
  const context = await getAngelcare360AccessContext({ schoolId: parsed.data.schoolId })
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif.' }
  const supabase = await createClient()
  let query = supabase.from('angelcare360_attendance_records').select('id, school_id, attendance_session_id, student_id, attendance_status, minutes_late, note, status, created_at, updated_at, metadata_json, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date, class_id, section_id, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code))').eq('school_id', context.school.id).eq('attendance_status', 'late')
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data } = await query.order('created_at', { ascending: false }).limit(200)
  return (data || [])
    .filter((row) => !parsed.data.classId || asString(((row as Row).session as Row | undefined)?.class_id) === parsed.data.classId)
    .filter((row) => !parsed.data.studentId || asString((row as Row).student_id) === parsed.data.studentId)
    .map((row) => mapRecordRow(row as Row))
}

export async function listAngelcare360AbsenceRecords(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceAbsenceRecordsQuerySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Filtre absences invalide.') }
  const context = await getAngelcare360AccessContext({ schoolId: parsed.data.schoolId })
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif.' }
  const supabase = await createClient()
  let query = supabase.from('angelcare360_attendance_records').select('id, school_id, attendance_session_id, student_id, attendance_status, minutes_late, note, status, created_at, updated_at, metadata_json, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date, class_id, section_id, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code))').eq('school_id', context.school.id).eq('attendance_status', 'absent')
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data } = await query.order('created_at', { ascending: false }).limit(200)
  return (data || [])
    .filter((row) => !parsed.data.classId || asString(((row as Row).session as Row | undefined)?.class_id) === parsed.data.classId)
    .filter((row) => !parsed.data.studentId || asString((row as Row).student_id) === parsed.data.studentId)
    .map((row) => mapRecordRow(row as Row))
}

export async function listAngelcare360AttendanceStatusHistory(options: { schoolId?: string | null; attendanceRecordId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase.from('angelcare360_attendance_status_history').select('id, school_id, attendance_record_id, from_status, to_status, changed_by, changed_at, note, created_at, updated_at, metadata_json').eq('school_id', context.school.id).order('changed_at', { ascending: false }).limit(200)
  if (options.attendanceRecordId) query = query.eq('attendance_record_id', options.attendanceRecordId)
  const { data } = await query
  return (data || []) as Angelcare360AttendanceStatusHistoryRecord[]
}

export async function listAngelcare360AttendanceJustifications(options: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase.from('angelcare360_attendance_justifications').select('id, school_id, attendance_record_id, justification_code, reason_category, description, evidence_document_id, submitted_by, submitted_at, reviewed_by, reviewed_at, decision, decision_reason, status, created_at, updated_at, metadata_json, record:angelcare360_attendance_records(id, attendance_status, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date))').eq('school_id', context.school.id).order('submitted_at', { ascending: false })
  if (options.status) query = query.eq('status', options.status)
  const { data } = await query.limit(200)
  return (data || []).map((row) => mapJustificationRow(row as Row))
}

export async function getAngelcare360AttendanceJustificationById(options: { schoolId?: string | null; id: string }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase.from('angelcare360_attendance_justifications').select('id, school_id, attendance_record_id, justification_code, reason_category, description, evidence_document_id, submitted_by, submitted_at, reviewed_by, reviewed_at, decision, decision_reason, status, created_at, updated_at, metadata_json, record:angelcare360_attendance_records(id, attendance_status, student:angelcare360_students(id, full_name, student_code), session:angelcare360_attendance_sessions(id, session_date))').eq('school_id', context.school.id).eq('id', options.id).maybeSingle()
  return data ? mapJustificationRow(data as Row) : null
}

export async function createAngelcare360AttendanceJustification(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceJustificationCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Justification invalide.') }
  const context = await getContext('presences.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: record } = await supabase.from('angelcare360_attendance_records').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.attendanceRecordId).maybeSingle()
  if (!record) return { ok: false, error: 'Relevé de présence introuvable.' }
  const payload = {
    school_id: context.school!.id,
    attendance_record_id: parsed.data.attendanceRecordId,
    justification_code: parsed.data.justificationCode,
    reason_category: parsed.data.reasonCategory,
    description: parsed.data.description,
    evidence_document_id: parsed.data.evidenceDocumentId || null,
    submitted_by: context.user.id,
    submitted_at: new Date().toISOString(),
    decision: parsed.data.status || 'pending',
    status: 'active',
    metadata_json: { source: 'phase6', created_by: context.user.id },
  }
  const { data, error } = await supabase.from('angelcare360_attendance_justifications').upsert(payload, { onConflict: 'attendance_record_id' }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await supabase.from('angelcare360_attendance_records').update({ metadata_json: { ...((record.metadata_json as Record<string, unknown>) || {}), justification_id: data.id, justification_status: data.decision } }).eq('id', parsed.data.attendanceRecordId)
  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: 'attendance_justification.created',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_justification',
    entityId: String(data.id),
    severity: 'info',
    afterData: data as Record<string, unknown>,
    metadata: { attendanceRecordId: parsed.data.attendanceRecordId },
  })
  return { ok: true, record: data as Angelcare360AttendanceJustificationRecord, warning: auditResult.ok ? null : auditResult.error || 'Justification créée, mais audit indisponible.' }
}

export async function updateAngelcare360AttendanceJustification(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceJustificationUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Justification invalide.') }
  const context = await getContext('presences.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_attendance_justifications').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Justification introuvable.' }
  const { data, error } = await supabase.from('angelcare360_attendance_justifications').update({
    attendance_record_id: parsed.data.attendanceRecordId,
    justification_code: parsed.data.justificationCode,
    reason_category: parsed.data.reasonCategory,
    description: parsed.data.description,
    evidence_document_id: parsed.data.evidenceDocumentId || null,
    reviewed_at: parsed.data.reviewedAt || null,
    metadata_json: { ...((before.metadata_json as Record<string, unknown>) || {}), updated_by_phase6: context.user.id },
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: 'attendance_justification.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_justification',
    entityId: String(data.id),
    severity: 'info',
    beforeData: before as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360AttendanceJustificationRecord, warning: auditResult.ok ? null : auditResult.error || 'Justification mise à jour, mais audit indisponible.' }
}

export async function decideAngelcare360AttendanceJustification(input: Record<string, unknown>) {
  const parsed = angelcare360AttendanceJustificationDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Décision invalide.') }
  const context = await getContext('presences.approve', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_attendance_justifications').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Justification introuvable.' }
  const { data, error } = await supabase.from('angelcare360_attendance_justifications').update({
    decision: parsed.data.decision,
    decision_reason: parsed.data.decisionReason || null,
    reviewed_by: context.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }

  if (parsed.data.decision === 'accepted') {
    await supabase.from('angelcare360_attendance_records').update({ attendance_status: 'excused', metadata_json: { ...(((before as Row).metadata_json as Record<string, unknown>) || {}), justification_id: before.id, justification_status: 'accepted' } }).eq('id', before.attendance_record_id)
  }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'attendance',
    module: 'attendance',
    action: parsed.data.decision === 'accepted' ? 'attendance_justification.accepted' : parsed.data.decision === 'rejected' ? 'attendance_justification.rejected' : 'attendance_justification.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'attendance_justification',
    entityId: String(data.id),
    severity: parsed.data.decision === 'accepted' ? 'warning' : parsed.data.decision === 'rejected' ? 'warning' : 'info',
    beforeData: before as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { decision: parsed.data.decision },
  })
  return { ok: true, record: data as Angelcare360AttendanceJustificationRecord, warning: auditResult.ok ? null : auditResult.error || 'Décision enregistrée, mais audit indisponible.' }
}

export async function listAngelcare360AttendanceAuditEvents(options?: { schoolId?: string | null; filters?: Record<string, unknown> }) {
  const context = await getContext('audit.view', options?.schoolId)
  const supabase = await createClient()
  let query = supabase.from('angelcare360_audit_logs').select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at').eq('school_id', context.school!.id).or('module.eq.attendance,module.eq.timetable').order('created_at', { ascending: false }).limit(200)
  const parsed = angelcare360AttendanceAuditFilterSchema.safeParse(options?.filters || {})
  if (parsed.success) {
    if (parsed.data.search) query = query.or(`action.ilike.%${parsed.data.search}%,module.ilike.%${parsed.data.search}%,entity_type.ilike.%${parsed.data.search}%`)
    if (parsed.data.module) query = query.eq('module', parsed.data.module)
    if (parsed.data.action) query = query.eq('action', parsed.data.action)
    if (parsed.data.severity) query = query.eq('severity', parsed.data.severity)
    if (parsed.data.entityType) query = query.eq('entity_type', parsed.data.entityType)
    if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
    if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  }
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function detectAngelcare360TimetableConflicts(options: { schoolId?: string | null; academicYearId?: string | null; classId?: string | null; sectionId?: string | null; staffId?: string | null; dayOfWeek?: number | null; startTime?: string | null; endTime?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options.schoolId })
  if (!context?.school) return { ok: false, conflicts: [] }
  const supabase = await createClient()
  let query = supabase.from('angelcare360_timetable_slots').select('id, school_id, academic_year_id, class_id, section_id, subject_id, staff_id, day_of_week, start_time, end_time, status').eq('school_id', context.school.id).eq('status', 'active')
  if (options.academicYearId) query = query.eq('academic_year_id', options.academicYearId)
  if (options.classId) query = query.eq('class_id', options.classId)
  if (options.sectionId) query = query.eq('section_id', options.sectionId)
  if (options.staffId) query = query.eq('staff_id', options.staffId)
  if (options.dayOfWeek) query = query.eq('day_of_week', options.dayOfWeek)
  const { data } = await query
  const slots = (data || []) as Row[]
  const conflicts = [] as Angelcare360AttendanceTimetableConflictResult['conflicts']
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const left = slots[i]
      const right = slots[j]
      const overlap = asString(left.start_time) < asString(right.end_time) && asString(right.start_time) < asString(left.end_time)
      if (!overlap) continue
      const sameTeacher = left.staff_id && right.staff_id && asString(left.staff_id) === asString(right.staff_id)
      const sameClass = asString(left.class_id) === asString(right.class_id)
      const sameSection = left.section_id && right.section_id && asString(left.section_id) === asString(right.section_id)
      if (sameTeacher || sameClass || sameSection) {
        conflicts.push({
          type: sameTeacher ? 'teacher_overlap' : sameSection ? 'section_overlap' : 'class_overlap',
          label: sameTeacher ? 'Conflit enseignant' : sameSection ? 'Conflit section' : 'Conflit classe',
          message: 'Un créneau chevauche un autre créneau actif.',
          slotIds: [asString(left.id), asString(right.id)],
          severity: 'warning',
        })
      }
    }
  }
  if (options.startTime && options.endTime && options.startTime >= options.endTime) {
    conflicts.push({
      type: 'time_invalid',
      label: 'Horaire invalide',
      message: 'L’heure de fin doit être postérieure à l’heure de début.',
      slotIds: [],
      severity: 'critical',
    })
  }
  return { ok: conflicts.length === 0, conflicts }
}
