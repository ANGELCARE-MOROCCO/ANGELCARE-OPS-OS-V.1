import { createClient } from '@/lib/supabase/server'

type Row = Record<string, unknown>
type DatabaseClient = Awaited<ReturnType<typeof createClient>>

export type Angelcare360SubjectProgramRow = {
  id: string
  school_id: string
  subject_code: string
  name: string
  short_name: string | null
  department: string | null
  credit_hours: number | null
  status: string
  linked_class_ids: string[]
  class_labels: string[]
  level_labels: string[]
  teacher_names: string[]
  teacher_ids: string[]
  planned_sequence_count: number
  completed_sequence_count: number
  total_sequence_count: number
  progression_percent: number | null
  upcoming_evaluation_count: number
  resource_count: number
  monthly_progression: number[]
}

export type Angelcare360ProgramEvaluation = {
  id: string
  kind: 'exam' | 'assignment'
  title: string
  subjectId: string
  subjectName: string
  classLabel: string
  dueOn: string
  dateLabel: string
  daysLeft: number
  detail: string
  href: string
}

export type Angelcare360ProgramGap = {
  subjectId: string
  subjectName: string
  progression: number
  expected: number
  gap: number
  impact: 'Élevé' | 'Moyen' | 'Faible'
  tone: 'red' | 'orange' | 'green'
  href: string
}

export type Angelcare360SubjectsProgramOverviewData = {
  subjects: Angelcare360SubjectProgramRow[]
  activeSubjectCount: number
  plannedSequenceCount: number
  completedSequenceCount: number
  upcomingEvaluationCount: number
  coveragePercent: number | null
  sharedResourceCount: number
  expectedProgressPercent: number | null
  monthLabels: string[]
  upcomingEvaluations: Angelcare360ProgramEvaluation[]
  deadlines: Angelcare360ProgramEvaluation[]
  progressionGaps: Angelcare360ProgramGap[]
  queryWarnings: string[]
}

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as unknown as Row[]) : []
}

function pickRecord(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {}
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function dateOnly(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function daysFromToday(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

function dateLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à confirmer'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function classLabel(value: unknown) {
  const row = pickRecord(value)
  return asString(row.name || row.class_code) || 'Classe à préciser'
}

function staffLabel(value: unknown) {
  const row = pickRecord(value)
  return asString(row.full_name || row.staff_code) || 'Enseignant à préciser'
}

function subjectLabel(value: unknown) {
  const row = pickRecord(value)
  return asString(row.name || row.subject_code) || 'Matière'
}

function buildMonths() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', ''),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  })
}

function expectedProgress(startsOn?: string | null, endsOn?: string | null) {
  if (!startsOn || !endsOn) return null
  const start = new Date(startsOn)
  const end = new Date(endsOn)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null
  const now = new Date()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)
}

async function warnQuery<T>(
  query: PromiseLike<{ data: T | null; error: { message?: string } | null }>,
  label: string,
  warnings: string[],
): Promise<T | null> {
  const response = await query
  if (response.error) {
    const message = `${label}: ${response.error.message || 'source indisponible'}`
    if (!warnings.includes(message)) warnings.push(message)
    return null
  }
  return response.data
}

export async function getAngelcare360SubjectsProgramOverview(input: {
  schoolId: string
  academicYearId?: string | null
  academicYearStartsOn?: string | null
  academicYearEndsOn?: string | null
}): Promise<Angelcare360SubjectsProgramOverviewData> {
  const client: DatabaseClient = await createClient()
  const warnings: string[] = []
  const months = buildMonths()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon14 = new Date(today)
  horizon14.setDate(horizon14.getDate() + 14)
  const horizon30 = new Date(today)
  horizon30.setDate(horizon30.getDate() + 30)

  let classLinksQuery = client
    .from('angelcare360_class_subjects')
    .select('id, subject_id, class_id, teacher_id, coefficient, is_required, status, class:angelcare360_classes(id, name, class_code, level), teacher:angelcare360_staff(id, full_name, staff_code)')
    .eq('school_id', input.schoolId)
    .eq('status', 'active')
  if (input.academicYearId) classLinksQuery = classLinksQuery.eq('academic_year_id', input.academicYearId)

  let teacherAssignmentsQuery = client
    .from('angelcare360_teacher_assignments')
    .select('id, subject_id, staff_id, class_id, status, staff:angelcare360_staff(id, full_name, staff_code), class:angelcare360_classes(id, name, class_code, level)')
    .eq('school_id', input.schoolId)
    .eq('status', 'active')
  if (input.academicYearId) teacherAssignmentsQuery = teacherAssignmentsQuery.eq('academic_year_id', input.academicYearId)

  let lessonsQuery = client
    .from('angelcare360_lessons')
    .select('id, subject_id, class_id, staff_id, lesson_date, topic, status, class:angelcare360_classes(id, name, class_code), staff:angelcare360_staff(id, full_name)')
    .eq('school_id', input.schoolId)
    .neq('status', 'archived')
  if (input.academicYearId) lessonsQuery = lessonsQuery.eq('academic_year_id', input.academicYearId)

  let examsQuery = client
    .from('angelcare360_exams')
    .select('id, subject_id, class_id, title, exam_type, scheduled_on, duration_minutes, status, subject:angelcare360_subjects(id, name, subject_code), class:angelcare360_classes(id, name, class_code)')
    .eq('school_id', input.schoolId)
    .in('status', ['planned', 'open'])
    .gte('scheduled_on', today.toISOString().slice(0, 10))
    .lte('scheduled_on', horizon30.toISOString().slice(0, 10))
    .order('scheduled_on', { ascending: true })
  if (input.academicYearId) examsQuery = examsQuery.eq('academic_year_id', input.academicYearId)

  let assignmentsQuery = client
    .from('angelcare360_assignments')
    .select('id, subject_id, class_id, title, due_on, max_score, status, subject:angelcare360_subjects(id, name, subject_code), class:angelcare360_classes(id, name, class_code)')
    .eq('school_id', input.schoolId)
    .in('status', ['draft', 'published'])
    .gte('due_on', today.toISOString().slice(0, 10))
    .lte('due_on', horizon30.toISOString().slice(0, 10))
    .order('due_on', { ascending: true })
  if (input.academicYearId) assignmentsQuery = assignmentsQuery.eq('academic_year_id', input.academicYearId)

  const [subjectData, classLinkData, teacherAssignmentData, lessonData, examData, assignmentData, documentData] = await Promise.all([
    warnQuery(client.from('angelcare360_subjects').select('id, school_id, subject_code, name, short_name, department, credit_hours, status, created_at, updated_at').eq('school_id', input.schoolId).order('name', { ascending: true }), 'Matières', warnings),
    warnQuery(classLinksQuery, 'Rattachements classes-matières', warnings),
    warnQuery(teacherAssignmentsQuery, 'Affectations enseignants', warnings),
    warnQuery(lessonsQuery, 'Séquences pédagogiques', warnings),
    warnQuery(examsQuery, 'Examens à venir', warnings),
    warnQuery(assignmentsQuery, 'Devoirs à venir', warnings),
    warnQuery(client.from('angelcare360_documents').select('id, documentable_id, title, category, visibility, status, created_at').eq('school_id', input.schoolId).eq('documentable_type', 'subject').in('status', ['active', 'verified']).order('created_at', { ascending: false }), 'Ressources pédagogiques', warnings),
  ])

  const subjects = asRows(subjectData)
  const classLinks = asRows(classLinkData)
  const teacherAssignments = asRows(teacherAssignmentData)
  const lessons = asRows(lessonData)
  const exams = asRows(examData)
  const assignments = asRows(assignmentData)
  const documents = asRows(documentData)

  const classLinksBySubject = new Map<string, Row[]>()
  for (const row of classLinks) {
    const id = asString(row.subject_id)
    if (!id) continue
    classLinksBySubject.set(id, [...(classLinksBySubject.get(id) || []), row])
  }

  const teacherAssignmentsBySubject = new Map<string, Row[]>()
  for (const row of teacherAssignments) {
    const id = asString(row.subject_id)
    if (!id) continue
    teacherAssignmentsBySubject.set(id, [...(teacherAssignmentsBySubject.get(id) || []), row])
  }

  const lessonsBySubject = new Map<string, Row[]>()
  for (const row of lessons) {
    const id = asString(row.subject_id)
    if (!id) continue
    lessonsBySubject.set(id, [...(lessonsBySubject.get(id) || []), row])
  }

  const evaluationsBySubject = new Map<string, number>()
  for (const row of [...exams, ...assignments]) {
    const id = asString(row.subject_id)
    if (id) evaluationsBySubject.set(id, (evaluationsBySubject.get(id) || 0) + 1)
  }

  const resourcesBySubject = new Map<string, number>()
  for (const row of documents) {
    const id = asString(row.documentable_id)
    if (id) resourcesBySubject.set(id, (resourcesBySubject.get(id) || 0) + 1)
  }

  const subjectRows: Angelcare360SubjectProgramRow[] = subjects.map((subject) => {
    const subjectId = asString(subject.id)
    const links = classLinksBySubject.get(subjectId) || []
    const assignmentsForSubject = teacherAssignmentsBySubject.get(subjectId) || []
    const lessonsForSubject = lessonsBySubject.get(subjectId) || []
    const planned = lessonsForSubject.filter((row) => asString(row.status) === 'planned').length
    const completed = lessonsForSubject.filter((row) => asString(row.status) === 'completed').length
    const total = planned + completed
    const progression = total ? Math.round((completed / total) * 100) : null

    const linkedClassIds = unique(links.map((row) => asString(row.class_id)))
    const classLabels = unique(links.map((row) => classLabel(row.class)))
    const levelLabels = unique(links.map((row) => asString(pickRecord(row.class).level)))
    const teacherRows = [...links, ...assignmentsForSubject]
    const teacherNames = unique(teacherRows.map((row) => staffLabel(row.teacher || row.staff)))
    const teacherIds = unique(teacherRows.map((row) => asString(row.teacher_id || row.staff_id)))

    const monthlyProgression = months.map((month) => {
      if (!total) return 0
      const completedThroughMonth = lessonsForSubject.filter((row) => {
        if (asString(row.status) !== 'completed') return false
        const lessonDate = new Date(asString(row.lesson_date))
        return !Number.isNaN(lessonDate.getTime()) && lessonDate <= month.end
      }).length
      return Math.min(100, Math.round((completedThroughMonth / total) * 100))
    })

    return {
      id: subjectId,
      school_id: asString(subject.school_id),
      subject_code: asString(subject.subject_code),
      name: asString(subject.name) || 'Matière à compléter',
      short_name: asString(subject.short_name) || null,
      department: asString(subject.department) || null,
      credit_hours: asNumber(subject.credit_hours),
      status: asString(subject.status) || 'active',
      linked_class_ids: linkedClassIds,
      class_labels: classLabels,
      level_labels: levelLabels,
      teacher_names: teacherNames,
      teacher_ids: teacherIds,
      planned_sequence_count: planned,
      completed_sequence_count: completed,
      total_sequence_count: total,
      progression_percent: progression,
      upcoming_evaluation_count: evaluationsBySubject.get(subjectId) || 0,
      resource_count: resourcesBySubject.get(subjectId) || 0,
      monthly_progression: monthlyProgression,
    }
  })

  const evaluationRows: Angelcare360ProgramEvaluation[] = [
    ...exams.map((row) => {
      const due = dateOnly(row.scheduled_on) || today.toISOString().slice(0, 10)
      const left = daysFromToday(due) ?? 0
      return {
        id: asString(row.id),
        kind: 'exam' as const,
        title: asString(row.title) || 'Évaluation',
        subjectId: asString(row.subject_id),
        subjectName: subjectLabel(row.subject),
        classLabel: classLabel(row.class),
        dueOn: due,
        dateLabel: dateLabel(due),
        daysLeft: left,
        detail: `${asString(row.exam_type) || 'Évaluation'}${asNumber(row.duration_minutes) ? ` · ${asNumber(row.duration_minutes)} min` : ''}`,
        href: `/angelcare-360-command-center/academique/examens/${asString(row.id)}`,
      }
    }),
    ...assignments.map((row) => {
      const due = dateOnly(row.due_on) || today.toISOString().slice(0, 10)
      const left = daysFromToday(due) ?? 0
      return {
        id: asString(row.id),
        kind: 'assignment' as const,
        title: asString(row.title) || 'Devoir',
        subjectId: asString(row.subject_id),
        subjectName: subjectLabel(row.subject),
        classLabel: classLabel(row.class),
        dueOn: due,
        dateLabel: dateLabel(due),
        daysLeft: left,
        detail: `${asString(row.status) === 'published' ? 'Publié' : 'Brouillon'}${asNumber(row.max_score) ? ` · /${asNumber(row.max_score)}` : ''}`,
        href: `/angelcare-360-command-center/academique/devoirs/${asString(row.id)}`,
      }
    }),
  ].sort((a, b) => a.dueOn.localeCompare(b.dueOn))

  const expected = expectedProgress(input.academicYearStartsOn, input.academicYearEndsOn)
  const progressionGaps: Angelcare360ProgramGap[] = expected === null
    ? []
    : subjectRows
        .filter((row) => row.progression_percent !== null)
        .map((row) => {
          const progression = row.progression_percent || 0
          const gap = progression - expected
          const impact: Angelcare360ProgramGap['impact'] = gap <= -15 ? 'Élevé' : gap <= -7 ? 'Moyen' : 'Faible'
          const tone: Angelcare360ProgramGap['tone'] = impact === 'Élevé' ? 'red' : impact === 'Moyen' ? 'orange' : 'green'
          return {
            subjectId: row.id,
            subjectName: row.name,
            progression,
            expected,
            gap,
            impact,
            tone,
            href: `/angelcare-360-command-center/academique/cours?subjectId=${encodeURIComponent(row.id)}`,
          }
        })
        .sort((a, b) => a.gap - b.gap)
        .slice(0, 5)

  const plannedSequenceCount = subjectRows.reduce((sum, row) => sum + row.planned_sequence_count, 0)
  const completedSequenceCount = subjectRows.reduce((sum, row) => sum + row.completed_sequence_count, 0)
  const totalSequenceCount = plannedSequenceCount + completedSequenceCount
  const coveragePercent = totalSequenceCount ? Math.round((completedSequenceCount / totalSequenceCount) * 100) : null

  return {
    subjects: subjectRows,
    activeSubjectCount: subjectRows.filter((row) => row.status === 'active').length,
    plannedSequenceCount,
    completedSequenceCount,
    upcomingEvaluationCount: evaluationRows.filter((row) => row.daysLeft <= 14).length,
    coveragePercent,
    sharedResourceCount: documents.length,
    expectedProgressPercent: expected,
    monthLabels: months.map((month) => month.label),
    upcomingEvaluations: evaluationRows.filter((row) => row.daysLeft <= 14).slice(0, 4),
    deadlines: evaluationRows.slice(0, 6),
    progressionGaps,
    queryWarnings: warnings,
  }
}
