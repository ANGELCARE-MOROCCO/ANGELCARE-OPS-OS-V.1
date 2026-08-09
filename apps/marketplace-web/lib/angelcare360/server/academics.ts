import { createClient } from '@/lib/supabase/server'
import { listAngelcare360AcademicYears } from './queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments, listAngelcare360Terms } from './administration'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import { listAngelcare360ClassEnrollments } from './people'
import {
  angelcare360AcademicAuditQuerySchema,
  angelcare360AssignmentCreateSchema,
  angelcare360AssignmentStatusChangeSchema,
  angelcare360AssignmentUpdateSchema,
  angelcare360AverageReadinessCheckSchema,
  angelcare360BulkMarkUpdateSchema,
  angelcare360ExamCreateSchema,
  angelcare360ExamSessionCreateSchema,
  angelcare360ExamSessionUpdateSchema,
  angelcare360ExamStatusChangeSchema,
  angelcare360ExamUpdateSchema,
  angelcare360LessonCreateSchema,
  angelcare360LessonUpdateSchema,
  angelcare360MarkUpdateSchema,
  angelcare360ReportCardDraftCreateSchema,
  angelcare360ReportCardStatusChangeSchema,
  angelcare360SubmissionStatusUpdateSchema,
  angelcare360TeacherCommentCreateSchema,
  angelcare360TeacherCommentUpdateSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360AcademicAuditFilter,
  Angelcare360AcademicAverageReadinessRecord,
  Angelcare360AcademicCommentStatus,
  Angelcare360AcademicOverviewRecord,
  Angelcare360AssignmentListRecord,
  Angelcare360AssignmentRecord,
  Angelcare360AssignmentStatus,
  Angelcare360AssignmentSubmissionListRecord,
  Angelcare360AssignmentSubmissionRecord,
  Angelcare360ExamListRecord,
  Angelcare360ExamRecord,
  Angelcare360ExamSessionListRecord,
  Angelcare360ExamSessionRecord,
  Angelcare360ExamSessionStatus,
  Angelcare360ExamStatus,
  Angelcare360LessonListRecord,
  Angelcare360LessonRecord,
  Angelcare360LessonStatus,
  Angelcare360MarkListRecord,
  Angelcare360MarkRecord,
  Angelcare360MarkStatus,
  Angelcare360ReportCardListRecord,
  Angelcare360ReportCardRecord,
  Angelcare360ReportCardStatus,
  Angelcare360SubmissionStatus,
  Angelcare360TeacherCommentListRecord,
  Angelcare360TeacherCommentRecord,
} from '@/types/angelcare360/academics'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, any>

const ACADEMIC_MODULES = ['academics', 'examens', 'bulletins'] as const
const BLOCKED_AVERAGE_MESSAGE = 'Le calcul automatique des moyennes sera activé après validation de la formule pédagogique de l’établissement.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function asDateOnly(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function asTimestamp(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function baseRecordFields(row: Row) {
  const createdAt = asString(row.created_at || new Date().toISOString())
  const updatedAt = asString(row.updated_at || row.created_at || createdAt)
  return {
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function pickRecord(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Row
}

function parseValidationErrors<T>(result: { success: true; data: T } | { success: false; errors: Array<{ message: string }> }, fallback: string) {
  return result.success ? fallback : result.errors[0]?.message || fallback
}

function auditActionForStatus(base: string, status: string) {
  if (status === 'published') return `${base}.published`
  if (status === 'closed') return `${base}.closed`
  if (status === 'scheduled' || status === 'planned' || status === 'active' || status === 'open') return `${base}.scheduled`
  if (status === 'completed' || status === 'graded' || status === 'approved' || status === 'reviewed') return `${base}.completed`
  return `${base}.updated`
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

async function getCurrentSchoolContext(schoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  return context?.school ? context : null
}

async function auditAcademicEvent(input: {
  module: 'academics' | 'examens' | 'bulletins'
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  category?: 'academic' | 'settings' | 'security'
}) {
  return recordAngelcare360AuditEventServer({
    category: input.category || 'academic',
    module: input.module,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

function toLessonRecord(row: Row): Angelcare360LessonRecord & Partial<Angelcare360LessonListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    subject_id: asString(row.subject_id),
    staff_id: row.staff_id ? asString(row.staff_id) : null,
    lesson_code: asString(row.lesson_code),
    lesson_date: asString(row.lesson_date),
    topic: asString(row.topic),
    objectives: row.objectives ? asString(row.objectives) : null,
    homework_summary: row.homework_summary ? asString(row.homework_summary) : null,
    status: asString(row.status) as Angelcare360LessonStatus,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    subject_name: asString(row.subject?.name || null) || null,
    subject_code: asString(row.subject?.subject_code || null) || null,
    staff_full_name: asString(row.staff?.full_name || null) || null,
    detail_href: `/angelcare-360-command-center/academique/cours/${row.id}`,
  }
}

function toAssignmentRecord(row: Row): Angelcare360AssignmentRecord & Partial<Angelcare360AssignmentListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    subject_id: asString(row.subject_id),
    created_by_staff_id: row.created_by_staff_id ? asString(row.created_by_staff_id) : null,
    assignment_code: asString(row.assignment_code),
    title: asString(row.title),
    description: row.description ? asString(row.description) : null,
    due_on: row.due_on ? asString(row.due_on) : null,
    max_score: row.max_score === null || row.max_score === undefined ? null : Number(row.max_score),
    status: asString(row.status) as Angelcare360AssignmentStatus,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    subject_name: asString(row.subject?.name || null) || null,
    subject_code: asString(row.subject?.subject_code || null) || null,
    staff_full_name: asString(row.staff?.full_name || null) || null,
    submission_count: Number(row.submission_count || 0),
    pending_submission_count: Number(row.pending_submission_count || 0),
    review_ready_count: Number(row.review_ready_count || 0),
    detail_href: `/angelcare-360-command-center/academique/devoirs/${row.id}`,
  }
}

function toSubmissionRecord(row: Row): Angelcare360AssignmentSubmissionRecord & Partial<Angelcare360AssignmentSubmissionListRecord> {
  const assignment = pickRecord(row.assignment)
  const student = pickRecord(row.student)
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    assignment_id: asString(row.assignment_id),
    student_id: asString(row.student_id),
    submitted_at: row.submitted_at ? asString(row.submitted_at) : null,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    feedback: row.feedback ? asString(row.feedback) : null,
    status: asString(row.status) as Angelcare360SubmissionStatus,
    assignment_title: asString(assignment.title || null) || null,
    assignment_code: asString(assignment.assignment_code || null) || null,
    student_full_name: asString(student.full_name || null) || null,
    student_code: asString(student.student_code || null) || null,
    class_name: asString(assignment.class?.name || null) || null,
    class_code: asString(assignment.class?.class_code || null) || null,
    section_name: asString(assignment.section?.name || null) || null,
    section_code: asString(assignment.section?.section_code || null) || null,
    due_on: assignment.due_on ? asString(assignment.due_on) : null,
    late: Boolean(assignment.due_on && row.submitted_at && asTimestamp(row.submitted_at) && asDateOnly(assignment.due_on) && asDateOnly(row.submitted_at) && asDateOnly(row.submitted_at)! > asDateOnly(assignment.due_on)!),
    detail_href: `/angelcare-360-command-center/academique/soumissions?assignment=${row.assignment_id}`,
  }
}

async function getActiveTermId(supabase: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  const query = supabase
    .from('angelcare360_terms')
    .select('id')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('order_index', { ascending: true })
    .limit(1)

  if (academicYearId) query.eq('academic_year_id', academicYearId)
  const { data } = await query.maybeSingle()
  return data?.id || null
}

export async function getAngelcare360AcademicOverview(options?: { schoolId?: string | null }): Promise<Angelcare360AcademicOverviewRecord | null> {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return null

  const supabase = await createClient()
  const schoolId = context.school.id
  const academicYearId = context.academicYear?.id || null
  const activeAcademicYears = await listAngelcare360AcademicYears(schoolId)
  const activeTermId = await getActiveTermId(supabase, schoolId, academicYearId)
  const activeTerm = activeTermId
    ? (await supabase.from('angelcare360_terms').select('id, label').eq('id', activeTermId).maybeSingle()).data
    : null

  const [
    classCount,
    sectionCount,
    subjectCount,
    teacherAssignmentCount,
    lessonCount,
    assignmentCount,
    submissionCount,
    examCount,
    sessionCount,
    markCount,
    reportCardCount,
    teacherCommentCount,
    classSubjectCount,
    latestAuditResponse,
    invalidMarksResponse,
  ] = await Promise.all([
    countRows(supabase, 'angelcare360_classes', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_sections', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_subjects', schoolId),
    countRows(supabase, 'angelcare360_teacher_assignments', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_lessons', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_assignments', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_assignment_submissions', schoolId),
    countRows(supabase, 'angelcare360_exams', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_exam_sessions', schoolId),
    countRows(supabase, 'angelcare360_marks', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_report_cards', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_teacher_comments', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_class_subjects', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    supabase
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .in('module', [...ACADEMIC_MODULES])
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('angelcare360_marks')
      .select('score, max_score')
      .eq('school_id', schoolId),
  ])

  const latestAuditEvents = (latestAuditResponse.data || []) as Angelcare360AuditRecord[]
  const invalidMarkCount = ((invalidMarksResponse.data || []) as Row[]).filter((row) => {
    const score = asNumber(row.score)
    const maxScore = asNumber(row.max_score)
    if (score === null || maxScore === null) return false
    return score < 0 || score > maxScore
  }).length
  const pendingSubmissionCount = await countRows(supabase, 'angelcare360_assignment_submissions', schoolId, [['status', 'in', ['pending', 'draft', 'submitted', 'late', 'missing']]])
  const lessonPlannedCount = await countRows(supabase, 'angelcare360_lessons', schoolId, [['status', 'eq', 'planned']])
  const lessonCompletedCount = await countRows(supabase, 'angelcare360_lessons', schoolId, [['status', 'eq', 'completed']])
  const assignmentPublishedCount = await countRows(supabase, 'angelcare360_assignments', schoolId, [['status', 'eq', 'published']])
  const examScheduledCount = await countRows(supabase, 'angelcare360_exams', schoolId, [['status', 'in', ['planned', 'scheduled', 'active', 'open']]])
  const reportCardDraftCount = await countRows(supabase, 'angelcare360_report_cards', schoolId, [['status', 'eq', 'draft']])
  const reportCardReviewCount = await countRows(supabase, 'angelcare360_report_cards', schoolId, [['status', 'eq', 'reviewed']])
  const reportCardApprovedCount = await countRows(supabase, 'angelcare360_report_cards', schoolId, [['status', 'eq', 'approved']])
  const reportCardPublishedCount = await countRows(supabase, 'angelcare360_report_cards', schoolId, [['status', 'eq', 'published']])
  const sessionCountSafe = sessionCount

  const readiness: Angelcare360AcademicAverageReadinessRecord = {
    schoolId,
    academicYearId,
    termId: activeTermId,
    classId: null,
    sectionId: null,
    studentId: null,
    subjectId: null,
    marksCount: markCount,
    coefficientsReady: markCount > 0,
    formulaReady: false,
    termSelected: Boolean(activeTermId),
    studentSelected: false,
    classSelected: classCount > 0,
    canCalculate: false,
    reason: BLOCKED_AVERAGE_MESSAGE,
  }

  const risks: string[] = []
  if (!activeTermId) risks.push('Aucune période active n’est résolue pour l’exécution académique.')
  if (classSubjectCount === 0) risks.push('Les matières ne sont pas encore affectées aux classes.')
  if (teacherAssignmentCount === 0) risks.push('Aucune affectation enseignant n’est disponible.')
  if (sessionCountSafe === 0 && examCount > 0) risks.push('Des examens existent, mais aucune session n’est planifiée.')
  if (markCount === 0 && examCount > 0) risks.push('Aucune note n’a encore été saisie pour les examens.')
  if (invalidMarkCount > 0) risks.push(`${invalidMarkCount} note(s) sort(ent) de la plage autorisée.`)
  if (reportCardDraftCount > 0) risks.push('Des bulletins restent au statut brouillon.')
  if (teacherCommentCount === 0 && reportCardCount > 0) risks.push('Aucune appréciation enseignant n’est encore enregistrée.')

  return {
    schoolId,
    schoolName: context.school.name,
    activeAcademicYearId: academicYearId,
    activeAcademicYearLabel: context.academicYear?.label || activeAcademicYears[0]?.label || null,
    activeTermId,
    activeTermLabel: activeTerm?.label || null,
    classCount,
    sectionCount,
    subjectCount,
    teacherAssignmentCount,
    lessonCount,
    lessonPlannedCount,
    lessonCompletedCount,
    assignmentCount,
    assignmentPublishedCount,
    pendingSubmissionCount,
    examCount,
    examScheduledCount,
    examSessionCount: sessionCountSafe,
    missingMarkCount: Math.max(0, examCount - markCount),
    markCount,
    reportCardCount,
    reportCardDraftCount,
    reportCardReviewCount,
    reportCardApprovedCount,
    reportCardPublishedCount,
    teacherCommentCount,
    missingTeacherCommentCount: Math.max(0, reportCardCount - teacherCommentCount),
    readiness,
    latestAuditEvents,
    risks,
  }
}

export async function listAngelcare360Lessons(options?: { schoolId?: string | null; academicYearId?: string | null; classId?: string | null; sectionId?: string | null; subjectId?: string | null; staffId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_lessons')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, staff_id, lesson_code, lesson_date, topic, objectives, homework_summary, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), staff:angelcare360_staff(id, full_name), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('lesson_date', { ascending: false })
    .limit(200)

  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options?.staffId) query = query.eq('staff_id', options.staffId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`lesson_code.ilike.%${options.search}%,topic.ilike.%${options.search}%`)

  const { data } = await query
  return ((data || []) as Row[]).map(toLessonRecord) as Angelcare360LessonListRecord[]
}

export async function getAngelcare360LessonById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_lessons')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, staff_id, lesson_code, lesson_date, topic, objectives, homework_summary, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), staff:angelcare360_staff(id, full_name), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  return data ? (toLessonRecord(data as Row) as Angelcare360LessonListRecord) : null
}

export async function createAngelcare360Lesson(input: Record<string, unknown>) {
  const parsed = angelcare360LessonCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de cours invalide.') }
  const context = await requireAngelcare360Permission('academics.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    staff_id: parsed.data.staffId || null,
    lesson_code: parsed.data.lessonCode || buildCode('LES'),
    lesson_date: parsed.data.lessonDate,
    topic: parsed.data.title,
    objectives: parsed.data.objectives || null,
    homework_summary: parsed.data.homeworkSummary || null,
    status: parsed.data.status,
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_lessons').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'lesson.created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'lesson',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Lesson(input: Record<string, unknown>) {
  const parsed = angelcare360LessonUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de cours invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_lessons').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le cours demandé est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_lessons').update({
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    staff_id: parsed.data.staffId || null,
    lesson_date: parsed.data.lessonDate,
    topic: parsed.data.title,
    objectives: parsed.data.objectives || null,
    homework_summary: parsed.data.homeworkSummary || null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'lesson.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'lesson',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360Assignments(options?: { schoolId?: string | null; academicYearId?: string | null; classId?: string | null; sectionId?: string | null; subjectId?: string | null; staffId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_assignments')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, created_by_staff_id, assignment_code, title, description, due_on, max_score, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), staff:angelcare360_staff(id, full_name), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options?.staffId) query = query.eq('created_by_staff_id', options.staffId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`assignment_code.ilike.%${options.search}%,title.ilike.%${options.search}%`)
  const { data: assignments } = await query
  const assignmentIds = (assignments || []).map((row) => String((row as Row).id))
  const { data: submissions } = assignmentIds.length
    ? await supabase.from('angelcare360_assignment_submissions').select('assignment_id, id, status').eq('school_id', context.school.id).in('assignment_id', assignmentIds)
    : { data: [] }
  const submissionsByAssignment = new Map<string, Row[]>()
  for (const submission of (submissions || []) as Row[]) {
    const key = asString(submission.assignment_id)
    submissionsByAssignment.set(key, [...(submissionsByAssignment.get(key) || []), submission])
  }
  return ((assignments || []) as Row[]).map((row) => {
    const assignmentSubmissions = submissionsByAssignment.get(asString(row.id)) || []
    return {
      ...toAssignmentRecord(row),
      submission_count: assignmentSubmissions.length,
      pending_submission_count: assignmentSubmissions.filter((item) => ['pending', 'draft', 'submitted', 'late', 'missing'].includes(asString(item.status))).length,
      review_ready_count: assignmentSubmissions.filter((item) => ['submitted', 'late'].includes(asString(item.status))).length,
    } as Angelcare360AssignmentListRecord
  })
}

export async function getAngelcare360AssignmentById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_assignments')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, created_by_staff_id, assignment_code, title, description, due_on, max_score, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), staff:angelcare360_staff(id, full_name), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  if (!data) return null
  const { data: submissions } = await supabase
    .from('angelcare360_assignment_submissions')
    .select('id, school_id, assignment_id, student_id, submitted_at, score, feedback, status, student:angelcare360_students(id, full_name, student_code)')
    .eq('school_id', context.school.id)
    .eq('assignment_id', options.id)
  return {
    assignment: toAssignmentRecord(data as Row) as Angelcare360AssignmentListRecord,
    submissions: ((submissions || []) as Row[]).map(toSubmissionRecord) as Angelcare360AssignmentSubmissionListRecord[],
  }
}

export async function createAngelcare360Assignment(input: Record<string, unknown>) {
  const parsed = angelcare360AssignmentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de devoir invalide.') }
  const context = await requireAngelcare360Permission('academics.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    created_by_staff_id: parsed.data.staffId,
    assignment_code: parsed.data.assignmentCode || buildCode('HW'),
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_on: parsed.data.dueOn || null,
    max_score: parsed.data.maxScore ?? null,
    status: parsed.data.status,
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_assignments').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'assignment.created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'assignment',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Assignment(input: Record<string, unknown>) {
  const parsed = angelcare360AssignmentUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de devoir invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_assignments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le devoir demandé est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_assignments').update({
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    created_by_staff_id: parsed.data.staffId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_on: parsed.data.dueOn || null,
    max_score: parsed.data.maxScore ?? null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'assignment.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'assignment',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function changeAngelcare360AssignmentStatus(input: Record<string, unknown>) {
  const parsed = angelcare360AssignmentStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Changement de statut de devoir invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_assignments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le devoir demandé est introuvable.' }
  if (parsed.data.status === 'published' && !before.data.due_on) {
    return { ok: false, error: 'La publication du devoir est verrouillée tant qu’aucune date d’échéance n’est définie.' }
  }
  const { data, error } = await supabase.from('angelcare360_assignments').update({
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: auditActionForStatus('assignment', parsed.data.status),
    severity: parsed.data.status === 'published' || parsed.data.status === 'closed' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'assignment',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: parsed.data.status },
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360AssignmentSubmissions(options?: { schoolId?: string | null; assignmentId?: string | null; studentId?: string | null; classId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_assignment_submissions')
    .select('id, school_id, assignment_id, student_id, submitted_at, score, feedback, status, assignment:angelcare360_assignments(id, assignment_code, title, due_on, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code)), student:angelcare360_students(id, full_name, student_code)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(300)
  if (options?.assignmentId) query = query.eq('assignment_id', options.assignmentId)
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`feedback.ilike.%${options.search}%,status.ilike.%${options.search}%`)
  const { data } = await query
  const rows = ((data || []) as Row[])
    .filter((row) => {
      if (!options?.classId) return true
      const assignment = pickRecord(row.assignment)
      const assignmentClass = pickRecord(assignment.class)
      return asString(assignmentClass.id) === options.classId
    })
    .map(toSubmissionRecord) as Angelcare360AssignmentSubmissionListRecord[]
  return rows
}

export async function updateAngelcare360AssignmentSubmissionStatus(input: Record<string, unknown>) {
  const parsed = angelcare360SubmissionStatusUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Changement de statut de soumission invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const { data: assignment } = await supabase.from('angelcare360_assignments').select('id, due_on, max_score').eq('school_id', context.school!.id).eq('id', parsed.data.assignmentId).maybeSingle()
  const before = await supabase.from('angelcare360_assignment_submissions').select('*').eq('school_id', context.school!.id).eq('assignment_id', parsed.data.assignmentId).eq('student_id', parsed.data.studentId).maybeSingle()
  const dueOn = assignment?.due_on ? asDateOnly(String(assignment.due_on)) : null
  const submittedAt = parsed.data.submittedAt || before.data?.submitted_at || null
  const derivedStatus = parsed.data.status === 'submitted' && dueOn && submittedAt && asDateOnly(submittedAt) && asDateOnly(submittedAt)! > dueOn ? 'late' : parsed.data.status
  const payload = {
    school_id: context.school!.id,
    assignment_id: parsed.data.assignmentId,
    student_id: parsed.data.studentId,
    submitted_at: submittedAt || null,
    score: parsed.data.score ?? before.data?.score ?? null,
    feedback: parsed.data.feedback ?? before.data?.feedback ?? null,
    status: derivedStatus,
    metadata_json: { source: 'phase7', due_on: dueOn },
  }
  const { data, error } = before.data
    ? await supabase.from('angelcare360_assignment_submissions').update(payload).eq('id', before.data.id).select('id').single()
    : await supabase.from('angelcare360_assignment_submissions').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'submission.updated',
    severity: derivedStatus === 'late' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'assignment_submission',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown> || {},
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

function toExamRecord(row: Row): Angelcare360ExamRecord & Partial<Angelcare360ExamListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    subject_id: asString(row.subject_id),
    exam_code: asString(row.exam_code),
    title: asString(row.title),
    exam_type: asString(row.exam_type),
    scheduled_on: asString(row.scheduled_on),
    duration_minutes: row.duration_minutes === null || row.duration_minutes === undefined ? null : Number(row.duration_minutes),
    max_score: row.max_score === null || row.max_score === undefined ? null : Number(row.max_score),
    status: asString(row.status) as Angelcare360ExamStatus,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    subject_name: asString(row.subject?.name || null) || null,
    subject_code: asString(row.subject?.subject_code || null) || null,
    session_count: Number(row.session_count || 0),
    mark_count: Number(row.mark_count || 0),
    detail_href: `/angelcare-360-command-center/academique/examens/${row.id}`,
  }
}

function toExamSessionRecord(row: Row): Angelcare360ExamSessionRecord & Partial<Angelcare360ExamSessionListRecord> {
  const exam = pickRecord(row.exam)
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    exam_id: asString(row.exam_id),
    session_code: asString(row.session_code),
    room: row.room ? asString(row.room) : null,
    starts_at: row.starts_at ? asString(row.starts_at) : null,
    ends_at: row.ends_at ? asString(row.ends_at) : null,
    invigilator_staff_id: row.invigilator_staff_id ? asString(row.invigilator_staff_id) : null,
    status: asString(row.status) as Angelcare360ExamSessionStatus,
    exam_title: asString(exam.title || null) || null,
    exam_code: asString(exam.exam_code || null) || null,
    class_name: asString(exam.class?.name || null) || null,
    class_code: asString(exam.class?.class_code || null) || null,
    section_name: asString(exam.section?.name || null) || null,
    section_code: asString(exam.section?.section_code || null) || null,
    subject_name: asString(exam.subject?.name || null) || null,
    subject_code: asString(exam.subject?.subject_code || null) || null,
    invigilator_full_name: asString(row.invigilator?.full_name || null) || null,
    detail_href: `/angelcare-360-command-center/academique/sessions-examens`,
  }
}

function toMarkRecord(row: Row): Angelcare360MarkRecord & Partial<Angelcare360MarkListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    student_id: asString(row.student_id),
    subject_id: asString(row.subject_id),
    exam_id: row.exam_id ? asString(row.exam_id) : null,
    assignment_id: row.assignment_id ? asString(row.assignment_id) : null,
    assessment_type: asString(row.assessment_type),
    score: Number(row.score),
    max_score: Number(row.max_score),
    grade: row.grade ? asString(row.grade) : null,
    recorded_by_staff_id: row.recorded_by_staff_id ? asString(row.recorded_by_staff_id) : null,
    recorded_at: asString(row.recorded_at),
    status: asString(row.status) as Angelcare360MarkStatus,
    mark_state: asString(row.mark_state || 'present'),
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    subject_name: asString(row.subject?.name || null) || null,
    subject_code: asString(row.subject?.subject_code || null) || null,
    exam_title: asString(row.exam?.title || null) || null,
    assignment_title: asString(row.assignment?.title || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    recorded_by_full_name: asString(row.staff?.full_name || null) || null,
    detail_href: `/angelcare-360-command-center/academique/notes`,
  } as Angelcare360MarkListRecord
}

function toReportCardRecord(row: Row): Angelcare360ReportCardRecord & Partial<Angelcare360ReportCardListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    student_id: asString(row.student_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    term_id: row.term_id ? asString(row.term_id) : null,
    report_card_code: asString(row.report_card_code),
    generated_on: asString(row.generated_on),
    overall_average: row.overall_average === null || row.overall_average === undefined ? null : Number(row.overall_average),
    rank_position: row.rank_position === null || row.rank_position === undefined ? null : Number(row.rank_position),
    attendance_summary: row.attendance_summary ? asString(row.attendance_summary) : null,
    status: asString(row.status) as Angelcare360ReportCardStatus,
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    term_label: asString(row.term?.label || null) || null,
    line_count: Number(row.line_count || 0),
    ready_for_calculation: Boolean(row.ready_for_calculation),
    detail_href: `/angelcare-360-command-center/academique/bulletins/${row.id}`,
  }
}

function toTeacherCommentRecord(row: Row): Angelcare360TeacherCommentRecord & Partial<Angelcare360TeacherCommentListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    student_id: asString(row.student_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    term_id: row.term_id ? asString(row.term_id) : null,
    staff_id: asString(row.staff_id),
    comment_type: asString(row.comment_type),
    comment_text: asString(row.comment_text),
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    status: asString(row.status) as Angelcare360AcademicCommentStatus,
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    term_label: asString(row.term?.label || null) || null,
    staff_full_name: asString(row.staff?.full_name || null) || null,
    detail_href: `/angelcare-360-command-center/academique/appreciations`,
  }
}

export async function listAngelcare360Exams(options?: { schoolId?: string | null; academicYearId?: string | null; classId?: string | null; sectionId?: string | null; subjectId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_exams')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, exam_code, title, exam_type, scheduled_on, duration_minutes, max_score, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('scheduled_on', { ascending: false })
    .limit(200)
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`exam_code.ilike.%${options.search}%,title.ilike.%${options.search}%`)
  const { data: exams } = await query
  const examIds = (exams || []).map((row) => String((row as Row).id))
  const [sessions, marks] = await Promise.all([
    examIds.length ? supabase.from('angelcare360_exam_sessions').select('id, exam_id').eq('school_id', context.school.id).in('exam_id', examIds) : Promise.resolve({ data: [] as Row[] }),
    examIds.length ? supabase.from('angelcare360_marks').select('id, exam_id').eq('school_id', context.school.id).in('exam_id', examIds) : Promise.resolve({ data: [] as Row[] }),
  ])
  const sessionCountByExam = new Map<string, number>()
  for (const item of (sessions.data || []) as Row[]) {
    const key = asString(item.exam_id)
    sessionCountByExam.set(key, (sessionCountByExam.get(key) || 0) + 1)
  }
  const markCountByExam = new Map<string, number>()
  for (const item of (marks.data || []) as Row[]) {
    const key = asString(item.exam_id)
    markCountByExam.set(key, (markCountByExam.get(key) || 0) + 1)
  }
  return ((exams || []) as Row[]).map((row) => ({
    ...toExamRecord(row),
    session_count: sessionCountByExam.get(asString(row.id)) || 0,
    mark_count: markCountByExam.get(asString(row.id)) || 0,
  })) as Angelcare360ExamListRecord[]
}

export async function getAngelcare360ExamById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_exams')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, exam_code, title, exam_type, scheduled_on, duration_minutes, max_score, status, created_at, updated_at, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  if (!data) return null
  const [sessions, marks] = await Promise.all([
    supabase.from('angelcare360_exam_sessions').select('id').eq('school_id', context.school.id).eq('exam_id', options.id),
    supabase.from('angelcare360_marks').select('id').eq('school_id', context.school.id).eq('exam_id', options.id),
  ])
  return {
    exam: toExamRecord(data as Row) as Angelcare360ExamListRecord,
    sessionCount: (sessions.data || []).length,
    markCount: (marks.data || []).length,
    sessions: await listAngelcare360ExamSessions({ schoolId: context.school.id, examId: options.id }),
    marks: await listAngelcare360Marks({ schoolId: context.school.id, examId: options.id }),
  }
}

export async function createAngelcare360Exam(input: Record<string, unknown>) {
  const parsed = angelcare360ExamCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’examen invalide.') }
  const context = await requireAngelcare360Permission('examens.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    exam_code: parsed.data.examCode || buildCode('EX'),
    title: parsed.data.title,
    exam_type: parsed.data.examType,
    scheduled_on: parsed.data.scheduledOn,
    duration_minutes: parsed.data.durationMinutes ?? null,
    max_score: parsed.data.maxScore ?? null,
    status: parsed.data.status,
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_exams').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'examens',
    action: 'exam.created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'exam',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Exam(input: Record<string, unknown>) {
  const parsed = angelcare360ExamUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’examen invalide.') }
  const context = await requireAngelcare360Permission('examens.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_exams').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’examen demandé est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_exams').update({
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    exam_type: parsed.data.examType,
    scheduled_on: parsed.data.scheduledOn,
    duration_minutes: parsed.data.durationMinutes ?? null,
    max_score: parsed.data.maxScore ?? null,
    title: parsed.data.title,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'examens',
    action: 'exam.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'exam',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function changeAngelcare360ExamStatus(input: Record<string, unknown>) {
  const parsed = angelcare360ExamStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Changement de statut d’examen invalide.') }
  const context = await requireAngelcare360Permission('examens.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_exams').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’examen demandé est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_exams').update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  const action = parsed.data.status === 'closed' || parsed.data.status === 'completed' || parsed.data.status === 'graded' ? 'exam.completed' : 'exam.scheduled'
  await auditAcademicEvent({
    module: 'examens',
    action,
    severity: parsed.data.status === 'closed' || parsed.data.status === 'completed' || parsed.data.status === 'graded' ? 'warning' : 'notice',
    schoolId: context.school!.id,
    entityType: 'exam',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: parsed.data.status },
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360ExamSessions(options?: { schoolId?: string | null; examId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_exam_sessions')
    .select('id, school_id, exam_id, session_code, room, starts_at, ends_at, invigilator_staff_id, status, created_at, updated_at, exam:angelcare360_exams(id, exam_code, title, scheduled_on, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code)), invigilator:angelcare360_staff(id, full_name)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (options?.examId) query = query.eq('exam_id', options.examId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`session_code.ilike.%${options.search}%,room.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toExamSessionRecord) as Angelcare360ExamSessionListRecord[]
}

export async function createAngelcare360ExamSession(input: Record<string, unknown>) {
  const parsed = angelcare360ExamSessionCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de session d’examen invalide.') }
  const context = await requireAngelcare360Permission('examens.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    exam_id: parsed.data.examId,
    session_code: parsed.data.sessionCode,
    room: parsed.data.room || null,
    starts_at: parsed.data.startsAt || null,
    ends_at: parsed.data.endsAt || null,
    invigilator_staff_id: parsed.data.invigilatorStaffId || null,
    status: parsed.data.status,
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_exam_sessions').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'examens',
    action: 'exam_session.created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'exam_session',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360ExamSession(input: Record<string, unknown>) {
  const parsed = angelcare360ExamSessionUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de session d’examen invalide.') }
  const context = await requireAngelcare360Permission('examens.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_exam_sessions').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La session d’examen demandée est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_exam_sessions').update({
    exam_id: parsed.data.examId,
    session_code: parsed.data.sessionCode,
    room: parsed.data.room || null,
    starts_at: parsed.data.startsAt || null,
    ends_at: parsed.data.endsAt || null,
    invigilator_staff_id: parsed.data.invigilatorStaffId || null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'examens',
    action: 'exam_session.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'exam_session',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360Marks(options?: { schoolId?: string | null; academicYearId?: string | null; examId?: string | null; assignmentId?: string | null; classId?: string | null; sectionId?: string | null; subjectId?: string | null; studentId?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_marks')
    .select('id, school_id, academic_year_id, student_id, subject_id, exam_id, assignment_id, assessment_type, score, max_score, grade, recorded_by_staff_id, recorded_at, status, mark_state, created_at, updated_at, student:angelcare360_students(id, full_name, student_code), subject:angelcare360_subjects(id, name, subject_code), exam:angelcare360_exams(id, title, exam_code), assignment:angelcare360_assignments(id, title, assignment_code), staff:angelcare360_staff(id, full_name)')
    .eq('school_id', context.school.id)
    .order('recorded_at', { ascending: false })
    .limit(300)
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.examId) query = query.eq('exam_id', options.examId)
  if (options?.assignmentId) query = query.eq('assignment_id', options.assignmentId)
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options?.search) query = query.or(`assessment_type.ilike.%${options.search}%,grade.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toMarkRecord) as Angelcare360MarkListRecord[]
}

export async function listAngelcare360MarksEntrySheet(options: { schoolId?: string | null; academicYearId?: string | null; classId: string; sectionId?: string | null; subjectId?: string | null; examId?: string | null; assignmentId?: string | null }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return { students: [], marks: [], context: null }
  const supabase = await createClient()
  const enrollments = await listAngelcare360ClassEnrollments({ schoolId: context.school.id, academicYearId: options.academicYearId || context.academicYear?.id || null })
  const classEnrollments = enrollments.filter((enrollment) => String(enrollment.class_id) === options.classId)
  const sectionEnrollments = options.sectionId ? classEnrollments.filter((enrollment) => String(enrollment.section_id || '') === options.sectionId) : classEnrollments
  const { data: marks } = await supabase
    .from('angelcare360_marks')
    .select('id, school_id, academic_year_id, student_id, subject_id, exam_id, assignment_id, assessment_type, score, max_score, grade, recorded_by_staff_id, recorded_at, status, mark_state, student:angelcare360_students(id, full_name, student_code), subject:angelcare360_subjects(id, name, subject_code), exam:angelcare360_exams(id, title, exam_code), assignment:angelcare360_assignments(id, title, assignment_code), staff:angelcare360_staff(id, full_name)')
    .eq('school_id', context.school.id)
    .eq('academic_year_id', options.academicYearId || context.academicYear?.id || '')
  if (options.examId) {
    await supabase.from('angelcare360_marks').select('id').eq('exam_id', options.examId)
  }
  const selectedMarks = ((marks || []) as Row[])
    .filter((row) => !options.subjectId || String(row.subject_id) === options.subjectId)
    .filter((row) => !options.examId || String(row.exam_id || '') === options.examId)
    .filter((row) => !options.assignmentId || String(row.assignment_id || '') === options.assignmentId)
  const marksByStudent = new Map<string, Row>()
  for (const mark of selectedMarks) marksByStudent.set(String(mark.student_id), mark)
  const students = sectionEnrollments.map((enrollment) => {
    const mark = marksByStudent.get(String(enrollment.student_id))
    return {
      enrollment,
      mark: mark ? toMarkRecord(mark) : null,
    }
  })
  return {
    students,
    marks: selectedMarks.map(toMarkRecord) as Angelcare360MarkListRecord[],
    context: {
      classId: options.classId,
      sectionId: options.sectionId || null,
      subjectId: options.subjectId || null,
      examId: options.examId || null,
      assignmentId: options.assignmentId || null,
    },
  }
}

type Angelcare360ParsedMarkUpdate = {
  schoolId: string
  academicYearId: string
  studentId: string
  subjectId: string
  examId?: string | null
  assignmentId?: string | null
  assessmentType: string
  score?: number | null
  maxScore: number
  markState: 'present' | 'absent' | 'exempt' | 'pending'
  grade?: string | null
  recordedByStaffId?: string | null
}

async function persistAngelcare360Mark(context: Awaited<ReturnType<typeof getCurrentSchoolContext>>, parsed: { data: Angelcare360ParsedMarkUpdate }) {
  const supabase = await createClient()
  const before = await supabase
    .from('angelcare360_marks')
    .select('*')
    .eq('school_id', context!.school!.id)
    .eq('academic_year_id', parsed.data.academicYearId)
    .eq('student_id', parsed.data.studentId)
    .eq('subject_id', parsed.data.subjectId)
    .eq('exam_id', parsed.data.examId || null)
    .eq('assignment_id', parsed.data.assignmentId || null)
    .maybeSingle()

  const payload = {
    school_id: context!.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    subject_id: parsed.data.subjectId,
    exam_id: parsed.data.examId || null,
    assignment_id: parsed.data.assignmentId || null,
    assessment_type: parsed.data.assessmentType,
    score: parsed.data.markState === 'absent' || parsed.data.markState === 'exempt' ? 0 : (parsed.data.score ?? 0),
    max_score: parsed.data.maxScore,
    grade: parsed.data.grade || null,
    recorded_by_staff_id: parsed.data.recordedByStaffId || null,
    recorded_at: new Date().toISOString(),
    status: 'active',
    mark_state: parsed.data.markState,
    metadata_json: { source: 'phase7' },
  }

  const result = before.data
    ? await supabase.from('angelcare360_marks').update(payload).eq('id', before.data.id).select('id').single()
    : await supabase.from('angelcare360_marks').insert(payload).select('id').single()

  if (result.error) {
    return { ok: false, error: result.error.message }
  }

  await auditAcademicEvent({
    module: 'examens',
    action: before.data ? 'mark.updated' : 'mark.created',
    severity: parsed.data.markState === 'absent' || parsed.data.markState === 'exempt' ? 'warning' : 'info',
    schoolId: context!.school!.id,
    entityType: 'mark',
    entityId: String(result.data.id),
    beforeData: before.data as Record<string, unknown> || {},
    afterData: payload as Record<string, unknown>,
  })

  return { ok: true, record: { id: String(result.data.id) } }
}

export async function updateAngelcare360Mark(input: Record<string, unknown>) {
  const parsed = angelcare360MarkUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de note invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  return persistAngelcare360Mark(context, { data: parsed.data })
}

export async function bulkUpdateAngelcare360Marks(input: Record<string, unknown>) {
  const parsed = angelcare360BulkMarkUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Lot de notes invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const results: Array<{ id: string }> = []
  for (const record of parsed.data.records) {
    const item = await persistAngelcare360Mark(context, { data: record })
    if (!item.ok) return item
    if (item.record) results.push({ id: String(item.record.id) })
  }
  await auditAcademicEvent({
    module: 'examens',
    action: 'mark.bulk_updated',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'mark',
    entityId: parsed.data.examId || parsed.data.assignmentId || parsed.data.subjectId,
    afterData: { updatedCount: results.length, classId: parsed.data.classId || null, sectionId: parsed.data.sectionId || null },
  })
  return { ok: true, record: { updatedCount: results.length } }
}

export async function getAngelcare360AverageReadiness(input: Record<string, unknown>) {
  const parsed = angelcare360AverageReadinessCheckSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Contrôle de moyennes invalide.') }
  const context = await getCurrentSchoolContext(parsed.data.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif.' }
  const supabase = await createClient()
  const [marks, assignments, terms] = await Promise.all([
    countRows(supabase, 'angelcare360_marks', context.school.id, parsed.data.academicYearId ? [['academic_year_id', 'eq', parsed.data.academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_class_subjects', context.school.id, parsed.data.classId ? [['class_id', 'eq', parsed.data.classId]] : undefined),
    countRows(supabase, 'angelcare360_terms', context.school.id, parsed.data.academicYearId ? [['academic_year_id', 'eq', parsed.data.academicYearId]] : undefined),
    countRows(supabase, 'angelcare360_students', context.school.id),
  ])
  const readiness: Angelcare360AcademicAverageReadinessRecord = {
    schoolId: context.school.id,
    academicYearId: parsed.data.academicYearId || context.academicYear?.id || null,
    termId: parsed.data.termId || null,
    classId: parsed.data.classId || null,
    sectionId: parsed.data.sectionId || null,
    studentId: parsed.data.studentId || null,
    subjectId: parsed.data.subjectId || null,
    marksCount: marks,
    coefficientsReady: assignments > 0,
    formulaReady: false,
    termSelected: Boolean(parsed.data.termId || terms > 0),
    studentSelected: Boolean(parsed.data.studentId),
    classSelected: Boolean(parsed.data.classId || parsed.data.sectionId),
    canCalculate: false,
    reason: BLOCKED_AVERAGE_MESSAGE,
  }

  await auditAcademicEvent({
    module: 'academics',
    action: 'average.calculation_checked',
    severity: 'info',
    schoolId: context.school.id,
    entityType: 'average_readiness',
    entityId: parsed.data.studentId || parsed.data.classId || parsed.data.termId || context.school.id,
    afterData: readiness as unknown as Record<string, unknown>,
  })

  return { ok: true, record: readiness }
}

export async function calculateAngelcare360Averages(input: Record<string, unknown>) {
  const readiness = await getAngelcare360AverageReadiness(input)
  if (!readiness.ok) return readiness
  const schoolId = typeof input === 'object' && input !== null && typeof (input as Row).schoolId === 'string' ? String((input as Row).schoolId) : null
  const context = await getCurrentSchoolContext(schoolId)
  if (context?.school) {
    await auditAcademicEvent({
      module: 'academics',
      action: 'average.calculation_blocked',
      severity: 'warning',
      schoolId: context.school.id,
      entityType: 'average',
      entityId: String((input as Row).studentId || (input as Row).classId || context.school.id),
      afterData: { reason: BLOCKED_AVERAGE_MESSAGE },
    })
  }
  return { ok: false, error: BLOCKED_AVERAGE_MESSAGE, record: readiness.record }
}

export async function listAngelcare360ReportCards(options?: { schoolId?: string | null; academicYearId?: string | null; termId?: string | null; classId?: string | null; sectionId?: string | null; studentId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_report_cards')
    .select('id, school_id, academic_year_id, student_id, class_id, section_id, term_id, report_card_code, generated_on, overall_average, rank_position, attendance_summary, status, created_at, updated_at, student:angelcare360_students(id, full_name, student_code), class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), term:angelcare360_terms(id, label)')
    .eq('school_id', context.school.id)
    .order('generated_on', { ascending: false })
    .limit(200)
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.termId) query = query.eq('term_id', options.termId)
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`report_card_code.ilike.%${options.search}%,attendance_summary.ilike.%${options.search}%`)
  const { data: reportCards } = await query
  const reportCardIds = (reportCards || []).map((row) => String((row as Row).id))
  const { data: lines } = reportCardIds.length
    ? await supabase.from('angelcare360_report_card_lines').select('report_card_id, id, teacher_comment_id').eq('school_id', context.school.id).in('report_card_id', reportCardIds)
    : { data: [] as Row[] }
  const lineCountByReportCard = new Map<string, number>()
  for (const line of (lines || []) as Row[]) {
    const key = asString(line.report_card_id)
    lineCountByReportCard.set(key, (lineCountByReportCard.get(key) || 0) + 1)
  }
  return ((reportCards || []) as Row[]).map((row) => ({
    ...toReportCardRecord(row),
    line_count: lineCountByReportCard.get(asString(row.id)) || 0,
    ready_for_calculation: (lineCountByReportCard.get(asString(row.id)) || 0) > 0,
  })) as Angelcare360ReportCardListRecord[]
}

export async function getAngelcare360ReportCardById(options: { schoolId?: string | null; id: string }) {
  const context = await getCurrentSchoolContext(options.schoolId)
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_report_cards')
    .select('id, school_id, academic_year_id, student_id, class_id, section_id, term_id, report_card_code, generated_on, overall_average, rank_position, attendance_summary, status, created_at, updated_at, student:angelcare360_students(id, full_name, student_code), class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), term:angelcare360_terms(id, label)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  if (!data) return null
  const [lines, comments, marks] = await Promise.all([
    supabase.from('angelcare360_report_card_lines').select('id, school_id, report_card_id, subject_id, teacher_comment_id, mark_average, coefficient, letter_grade, remarks, status, created_at, updated_at, subject:angelcare360_subjects(id, name, subject_code), teacher_comment:angelcare360_teacher_comments(id, comment_text)').eq('school_id', context.school.id).eq('report_card_id', options.id),
    supabase.from('angelcare360_teacher_comments').select('id').eq('school_id', context.school.id).eq('student_id', String((data as Row).student_id)).maybeSingle(),
    supabase.from('angelcare360_marks').select('id').eq('school_id', context.school.id).eq('student_id', String((data as Row).student_id)),
  ])
  return {
    reportCard: toReportCardRecord(data as Row) as Angelcare360ReportCardListRecord,
    lines: (lines.data || []).map((row) => ({
      ...baseRecordFields(row as Row),
      id: asString((row as Row).id),
      school_id: asString((row as Row).school_id),
      report_card_id: asString((row as Row).report_card_id),
      subject_id: asString((row as Row).subject_id),
      teacher_comment_id: (row as Row).teacher_comment_id ? asString((row as Row).teacher_comment_id) : null,
      mark_average: (row as Row).mark_average === null || (row as Row).mark_average === undefined ? null : Number((row as Row).mark_average),
      coefficient: Number((row as Row).coefficient || 1),
      letter_grade: (row as Row).letter_grade ? asString((row as Row).letter_grade) : null,
      remarks: (row as Row).remarks ? asString((row as Row).remarks) : null,
      status: asString((row as Row).status),
      subject_name: asString((row as Row).subject?.name || null) || null,
      subject_code: asString((row as Row).subject?.subject_code || null) || null,
      teacher_comment_text: asString((row as Row).teacher_comment?.comment_text || null) || null,
    })),
    marks: (marks.data || []).map(toMarkRecord) as Angelcare360MarkListRecord[],
    commentCount: (comments.data ? 1 : 0),
  }
}

export async function createAngelcare360ReportCardDraft(input: Record<string, unknown>) {
  const parsed = angelcare360ReportCardDraftCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de bulletin invalide.') }
  const context = await requireAngelcare360Permission('bulletins.create', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    term_id: parsed.data.termId,
    report_card_code: parsed.data.reportCardCode || buildCode('RPT'),
    generated_on: parsed.data.generatedOn || new Date().toISOString().slice(0, 10),
    status: 'draft',
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_report_cards').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'bulletins',
    action: 'report_card.draft_created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'report_card',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360ReportCardStatus(input: Record<string, unknown>) {
  const parsed = angelcare360ReportCardStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Changement de statut du bulletin invalide.') }
  const context = await requireAngelcare360Permission(parsed.data.status === 'approved' ? 'bulletins.approve' : 'bulletins.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_report_cards').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le bulletin demandé est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_report_cards').update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'bulletins',
    action: parsed.data.status === 'approved' ? 'report_card.approved' : parsed.data.status === 'published' ? 'report_card.published' : 'report_card.updated',
    severity: parsed.data.status === 'published' || parsed.data.status === 'approved' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'report_card',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: parsed.data.status },
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360TeacherComments(options?: { schoolId?: string | null; academicYearId?: string | null; termId?: string | null; classId?: string | null; studentId?: string | null; staffId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_teacher_comments')
    .select('id, school_id, academic_year_id, student_id, class_id, section_id, term_id, staff_id, comment_type, comment_text, rating, status, created_at, updated_at, student:angelcare360_students(id, full_name, student_code), class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), term:angelcare360_terms(id, label), staff:angelcare360_staff(id, full_name)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(300)
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.termId) query = query.eq('term_id', options.termId)
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.staffId) query = query.eq('staff_id', options.staffId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`comment_text.ilike.%${options.search}%,comment_type.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toTeacherCommentRecord) as Angelcare360TeacherCommentListRecord[]
}

export async function createAngelcare360TeacherComment(input: Record<string, unknown>) {
  const parsed = angelcare360TeacherCommentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’appréciation invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    term_id: parsed.data.termId || null,
    staff_id: parsed.data.staffId,
    comment_type: parsed.data.commentType,
    comment_text: parsed.data.commentText,
    rating: parsed.data.rating ?? null,
    status: parsed.data.status || 'active',
    metadata_json: { source: 'phase7' },
  }
  const { data, error } = await supabase.from('angelcare360_teacher_comments').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'teacher_comment.created',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'teacher_comment',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360TeacherComment(input: Record<string, unknown>) {
  const parsed = angelcare360TeacherCommentUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’appréciation invalide.') }
  const context = await requireAngelcare360Permission('academics.update', { schoolId: parsed.data.schoolId })
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_teacher_comments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’appréciation demandée est introuvable.' }
  const { data, error } = await supabase.from('angelcare360_teacher_comments').update({
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    term_id: parsed.data.termId || null,
    staff_id: parsed.data.staffId,
    comment_type: parsed.data.commentType,
    comment_text: parsed.data.commentText,
    rating: parsed.data.rating ?? null,
    status: parsed.data.status || 'active',
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditAcademicEvent({
    module: 'academics',
    action: 'teacher_comment.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'teacher_comment',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360AcademicAuditEvents(options?: { schoolId?: string | null; filters?: Record<string, unknown> }) {
  const context = await getCurrentSchoolContext(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('audit.view', { context })
  const parsed = angelcare360AcademicAuditQuerySchema.safeParse(options?.filters || {})
  const filters = parsed.success ? parsed.data : null
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .in('module', [...ACADEMIC_MODULES])
    .order('created_at', { ascending: false })
    .limit(300)
  if (filters?.search) query = query.or(`module.ilike.%${filters.search}%,action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`)
  if (filters?.module) query = query.eq('module', filters.module)
  if (filters?.action) query = query.eq('action', filters.action)
  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters?.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters?.actorRole) query = query.eq('actor_role', filters.actorRole)
  if (filters?.from) query = query.gte('created_at', filters.from)
  if (filters?.to) query = query.lte('created_at', filters.to)
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360AcademicExport(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null }) {
  const context = await getCurrentSchoolContext(input.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif.' }

  await auditAcademicEvent({
    module: 'bulletins',
    action: 'academic_export.blocked_not_available',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'report_card',
    entityId: input.entityId || context.school.id,
    afterData: { reason: input.reason || 'Export PDF non disponible.' },
  })

  return { ok: false, error: input.reason || 'L’export PDF n’est pas disponible pour ce module.' }
}
