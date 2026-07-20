import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AcademicOverview } from '@/lib/angelcare360/server/academics'

type Row = Record<string, unknown>

type TrendSource = 'official' | 'operational' | 'unavailable'
type ActivityKind = 'lesson' | 'assignment' | 'submission' | 'exam' | 'mark' | 'report-card' | 'comment' | 'academic'

export type Angelcare360AcademicCommandOverviewData = {
  selectedDate: string
  selectedDateLabel: string
  schoolName: string
  activeAcademicYearId: string | null
  activeAcademicYearLabel: string | null
  activeTermId: string | null
  activeTermLabel: string | null
  gradingScaleLabel: string
  gradingScaleMax: number
  successThreshold: number | null
  activeClassCount: number
  activeStudentCount: number
  lessonsInPreparation: number
  assignmentsToCorrect: number
  upcomingExamCount: number
  officialAverage: number | null
  successRate: number | null
  officialAverageStudentCount: number
  formulaReady: boolean
  formulaReason: string | null
  performanceTrend: {
    source: TrendSource
    sourceLabel: string
    points: Array<{
      key: string
      label: string
      dateLabel: string
      value: number | null
      sampleSize: number
    }>
    bestAverage: number | null
    lowestAverage: number | null
    progression: number | null
  }
  recentActivities: Array<{
    id: string
    kind: ActivityKind
    title: string
    detail: string
    occurredAt: string
    href: string
  }>
  levelDistribution: Array<{
    level: string
    average: number
    percentage: number
    studentCount: number
  }>
  readiness: {
    hasAcademicYear: boolean
    hasActiveTerm: boolean
    hasClasses: boolean
    hasStudents: boolean
    hasMarks: boolean
    hasOfficialAverages: boolean
    successThresholdConfigured: boolean
  }
  risks: string[]
  warnings: string[]
}

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as unknown as Row[] : []
}

function asObject(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function dateKey(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function dateAtNoon(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

function addDays(value: string, amount: number) {
  const date = dateAtNoon(value)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

function compactDateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(dateAtNoon(value)).replace('.', '')
}

function fullDateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dateAtNoon(value))
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function average(values: number[]) {
  if (!values.length) return null
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 1)
}

function isDateWithin(value: unknown, start: string, end: string) {
  const key = asString(value).slice(0, 10)
  return Boolean(key && key >= start && key <= end)
}

function parseGradingScaleMax(label: unknown) {
  const source = asString(label).trim()
  const matches = source.match(/(\d+(?:[.,]\d+)?)\s*$/)
  if (!matches) return 20
  const parsed = Number(matches[1].replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20
}

function nestedNumber(source: Row, keys: string[]) {
  let current: unknown = source
  for (const key of keys) {
    const object = asObject(current)
    current = object[key]
  }
  return nullableNumber(current)
}

function resolveSuccessThreshold(metadata: unknown, scaleMax: number) {
  const source = asObject(metadata)
  const candidates = [
    nullableNumber(source.success_threshold),
    nullableNumber(source.academic_success_threshold),
    nullableNumber(source.passing_score),
    nestedNumber(source, ['grading', 'success_threshold']),
    nestedNumber(source, ['academic', 'success_threshold']),
    nestedNumber(source, ['assessment', 'passing_score']),
  ].filter((value): value is number => value !== null)

  const raw = candidates[0]
  if (raw === undefined) return null
  const normalized = raw > 0 && raw <= 1 ? raw * scaleMax : raw
  if (normalized < 0 || normalized > scaleMax) return null
  return round(normalized, 2)
}

function normalizedMark(row: Row, scaleMax: number) {
  const score = nullableNumber(row.score)
  const maxScore = nullableNumber(row.max_score)
  if (score === null || maxScore === null || maxScore <= 0 || score < 0 || score > maxScore) return null
  return round((score / maxScore) * scaleMax, 2)
}

function latestRowsByKey(rows: Row[], key: string, dateKeys: string[]) {
  const sorted = [...rows].sort((a, b) => {
    const aDate = dateKeys.map((dateKey) => asString(a[dateKey])).find(Boolean) || ''
    const bDate = dateKeys.map((dateKey) => asString(b[dateKey])).find(Boolean) || ''
    return bDate.localeCompare(aDate)
  })
  const selected = new Map<string, Row>()
  for (const row of sorted) {
    const id = asString(row[key])
    if (id && !selected.has(id)) selected.set(id, row)
  }
  return Array.from(selected.values())
}

type QueryFilter = [string, 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'lt', unknown]

async function selectRows(
  client: Awaited<ReturnType<typeof createClient>>,
  table: string,
  columns: string,
  schoolId: string,
  options: {
    filters?: QueryFilter[]
    orderColumn?: string
    ascending?: boolean
    limit?: number
  },
  warnings: string[],
) {
  const db = client as any
  let query = db.from(table).select(columns).eq('school_id', schoolId)

  for (const [column, operator, value] of options.filters || []) {
    if (operator === 'eq') query = query.eq(column, value)
    if (operator === 'neq') query = query.neq(column, value)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value)
    if (operator === 'gte') query = query.gte(column, value)
    if (operator === 'lte') query = query.lte(column, value)
    if (operator === 'lt') query = query.lt(column, value)
  }

  if (options.orderColumn) query = query.order(options.orderColumn, { ascending: options.ascending ?? false })
  if (options.limit) query = query.limit(options.limit)

  try {
    const { data, error } = await query
    if (error) {
      const warning = `${table}: ${error.message || 'source indisponible'}`
      if (!warnings.includes(warning)) warnings.push(warning)
      return []
    }
    return asRows(data)
  } catch (error) {
    const warning = `${table}: ${error instanceof Error ? error.message : 'source indisponible'}`
    if (!warnings.includes(warning)) warnings.push(warning)
    return []
  }
}

function buildSixWeekBuckets(input: {
  selectedDate: string
  termStart?: string | null
  officialRows: Row[]
  markRows: Row[]
  scaleMax: number
}) {
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const end = addDays(input.selectedDate, -(5 - index) * 7)
    const start = addDays(end, -6)
    const termStart = input.termStart ? dateKey(input.termStart) : null
    const weekNumber = termStart
      ? Math.max(1, Math.floor((dateAtNoon(end).getTime() - dateAtNoon(termStart).getTime()) / 604800000) + 1)
      : null
    return {
      key: `${start}:${end}`,
      start,
      end,
      label: weekNumber ? `Sem. ${weekNumber}` : `S${index + 1}`,
      dateLabel: compactDateLabel(end),
    }
  })

  const officialPoints = buckets.map((bucket) => {
    const values = input.officialRows
      .filter((row) => isDateWithin(row.generated_on || row.updated_at || row.created_at, bucket.start, bucket.end))
      .map((row) => nullableNumber(row.overall_average))
      .filter((value): value is number => value !== null && value >= 0 && value <= input.scaleMax)

    return {
      ...bucket,
      value: average(values),
      sampleSize: values.length,
    }
  })

  if (officialPoints.filter((point) => point.value !== null).length >= 2) {
    return {
      source: 'official' as const,
      sourceLabel: 'Moyennes officielles consolidées',
      points: officialPoints,
    }
  }

  const operationalPoints = buckets.map((bucket) => {
    const values = input.markRows
      .filter((row) => isDateWithin(row.recorded_at || row.updated_at || row.created_at, bucket.start, bucket.end))
      .map((row) => normalizedMark(row, input.scaleMax))
      .filter((value): value is number => value !== null)

    return {
      ...bucket,
      value: average(values),
      sampleSize: values.length,
    }
  })

  if (operationalPoints.some((point) => point.value !== null)) {
    return {
      source: 'operational' as const,
      sourceLabel: 'Tendance des notes enregistrées',
      points: operationalPoints,
    }
  }

  return {
    source: 'unavailable' as const,
    sourceLabel: 'Tendance non disponible',
    points: buckets.map((bucket) => ({ ...bucket, value: null, sampleSize: 0 })),
  }
}

function activityHref(entityType: string, entityId: string) {
  if (entityType.includes('lesson')) return entityId ? `/angelcare-360-command-center/academique/cours/${entityId}` : '/angelcare-360-command-center/academique/cours'
  if (entityType.includes('assignment_submission')) return '/angelcare-360-command-center/academique/soumissions'
  if (entityType.includes('assignment')) return entityId ? `/angelcare-360-command-center/academique/devoirs/${entityId}` : '/angelcare-360-command-center/academique/devoirs'
  if (entityType.includes('exam')) return entityId ? `/angelcare-360-command-center/academique/examens/${entityId}` : '/angelcare-360-command-center/academique/examens'
  if (entityType.includes('mark')) return '/angelcare-360-command-center/academique/notes'
  if (entityType.includes('report_card')) return entityId ? `/angelcare-360-command-center/academique/bulletins/${entityId}` : '/angelcare-360-command-center/academique/bulletins'
  if (entityType.includes('comment')) return '/angelcare-360-command-center/academique/appreciations'
  return '/angelcare-360-command-center/academique/audit'
}

function activityKind(entityType: string): ActivityKind {
  if (entityType.includes('lesson')) return 'lesson'
  if (entityType.includes('assignment_submission')) return 'submission'
  if (entityType.includes('assignment')) return 'assignment'
  if (entityType.includes('exam')) return 'exam'
  if (entityType.includes('mark')) return 'mark'
  if (entityType.includes('report_card')) return 'report-card'
  if (entityType.includes('comment')) return 'comment'
  return 'academic'
}

function actionTitle(action: string, entityType: string) {
  const map: Record<string, string> = {
    'lesson.created': 'Cours ajouté',
    'lesson.updated': 'Cours mis à jour',
    'assignment.created': 'Devoir créé',
    'assignment.updated': 'Devoir mis à jour',
    'assignment.published': 'Devoir publié',
    'assignment.closed': 'Devoir clôturé',
    'submission.updated': 'Soumission traitée',
    'exam.created': 'Examen créé',
    'exam.updated': 'Examen mis à jour',
    'exam.scheduled': 'Examen programmé',
    'exam.open': 'Examen ouvert',
    'mark.created': 'Note saisie',
    'mark.updated': 'Note mise à jour',
    'mark.bulk_updated': 'Saisie de notes enregistrée',
    'report_card.draft_created': 'Bulletin préparé',
    'report_card.approved': 'Bulletin approuvé',
    'report_card.published': 'Bulletin publié',
    'teacher_comment.created': 'Appréciation ajoutée',
    'teacher_comment.updated': 'Appréciation mise à jour',
  }
  return map[action] || `${entityType || 'Opération académique'} mis à jour`
}

function activityDetail(row: Row, maps: {
  lessons: Map<string, Row>
  assignments: Map<string, Row>
  exams: Map<string, Row>
  subjects: Map<string, Row>
  classes: Map<string, Row>
  students: Map<string, Row>
}) {
  const entityId = asString(row.entity_id)
  const entityType = asString(row.entity_type).toLowerCase()
  const after = asObject(row.after_data)
  const metadata = asObject(row.metadata)

  if (entityType.includes('lesson')) {
    const item = maps.lessons.get(entityId) || after
    const subject = maps.subjects.get(asString(item.subject_id))
    const classRow = maps.classes.get(asString(item.class_id))
    return [asString(item.topic), asString(subject?.name), asString(classRow?.class_code || classRow?.name)].filter(Boolean).join(' · ') || 'Cours académique'
  }
  if (entityType.includes('assignment')) {
    const item = maps.assignments.get(entityId) || after
    const subject = maps.subjects.get(asString(item.subject_id))
    const classRow = maps.classes.get(asString(item.class_id))
    return [asString(item.title), asString(subject?.name), asString(classRow?.class_code || classRow?.name)].filter(Boolean).join(' · ') || 'Devoir académique'
  }
  if (entityType.includes('exam')) {
    const item = maps.exams.get(entityId) || after
    const subject = maps.subjects.get(asString(item.subject_id))
    const classRow = maps.classes.get(asString(item.class_id))
    return [asString(item.title), asString(subject?.name), asString(classRow?.class_code || classRow?.name)].filter(Boolean).join(' · ') || 'Évaluation académique'
  }
  if (entityType.includes('mark')) {
    const student = maps.students.get(asString(after.student_id || metadata.student_id))
    const subject = maps.subjects.get(asString(after.subject_id || metadata.subject_id))
    return [asString(student?.full_name), asString(subject?.name), 'Notes'].filter(Boolean).join(' · ')
  }
  if (entityType.includes('report_card')) {
    const student = maps.students.get(asString(after.student_id || metadata.student_id))
    return [asString(student?.full_name), 'Bulletin scolaire'].filter(Boolean).join(' · ')
  }
  if (entityType.includes('comment')) {
    const student = maps.students.get(asString(after.student_id || metadata.student_id))
    return [asString(student?.full_name), 'Appréciation pédagogique'].filter(Boolean).join(' · ')
  }
  return asString(metadata.label || after.title || after.name || row.action) || 'Opération académique'
}

export async function getAngelcare360AcademicCommandOverview(input: {
  schoolId: string
  academicYearId?: string | null
  academicYearLabel?: string | null
  selectedDate?: string | null
}): Promise<Angelcare360AcademicCommandOverviewData> {
  const selectedDate = dateKey(input.selectedDate)
  const warnings: string[] = []
  const client = await createClient()
  const baseOverview = await getAngelcare360AcademicOverview({ schoolId: input.schoolId })
  const academicYearId = input.academicYearId || baseOverview?.activeAcademicYearId || null

  const academicYearFilters: QueryFilter[] = academicYearId ? [['academic_year_id', 'eq', academicYearId]] : []

  const [
    settingsRows,
    termRows,
    classRows,
    enrollmentRows,
    studentRows,
    subjectRows,
    lessonRows,
    assignmentRows,
    examRows,
    markRows,
    reportCardRows,
    auditRows,
  ] = await Promise.all([
    selectRows(client, 'angelcare360_school_settings', 'grading_scale, metadata_json, status', input.schoolId, { limit: 1 }, warnings),
    selectRows(client, 'angelcare360_terms', 'id, academic_year_id, term_code, label, starts_on, ends_on, order_index, status, metadata_json', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'order_index',
      ascending: true,
      limit: 24,
    }, warnings),
    selectRows(client, 'angelcare360_classes', 'id, academic_year_id, class_code, name, level, order_index, status, metadata_json', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'order_index',
      ascending: true,
      limit: 500,
    }, warnings),
    selectRows(client, 'angelcare360_class_enrollments', 'id, academic_year_id, student_id, class_id, section_id, enrollment_status, enrolled_on, left_on, status', input.schoolId, {
      filters: academicYearFilters,
      limit: 5000,
    }, warnings),
    selectRows(client, 'angelcare360_students', 'id, student_code, full_name, current_class_id, current_section_id, admission_status, status', input.schoolId, {
      limit: 5000,
    }, warnings),
    selectRows(client, 'angelcare360_subjects', 'id, subject_code, name, short_name, department, status', input.schoolId, {
      limit: 1000,
    }, warnings),
    selectRows(client, 'angelcare360_lessons', 'id, academic_year_id, class_id, section_id, subject_id, staff_id, lesson_code, lesson_date, topic, status, created_at, updated_at', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'updated_at',
      ascending: false,
      limit: 5000,
    }, warnings),
    selectRows(client, 'angelcare360_assignments', 'id, academic_year_id, class_id, section_id, subject_id, assignment_code, title, due_on, max_score, status, created_at, updated_at', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'updated_at',
      ascending: false,
      limit: 3000,
    }, warnings),
    selectRows(client, 'angelcare360_exams', 'id, academic_year_id, class_id, section_id, subject_id, exam_code, title, exam_type, scheduled_on, max_score, status, created_at, updated_at', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'scheduled_on',
      ascending: true,
      limit: 2000,
    }, warnings),
    selectRows(client, 'angelcare360_marks', 'id, academic_year_id, student_id, subject_id, exam_id, assignment_id, assessment_type, score, max_score, grade, recorded_at, status, created_at, updated_at', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'recorded_at',
      ascending: false,
      limit: 8000,
    }, warnings),
    selectRows(client, 'angelcare360_report_cards', 'id, academic_year_id, student_id, class_id, section_id, term_id, report_card_code, generated_on, overall_average, status, created_at, updated_at', input.schoolId, {
      filters: academicYearFilters,
      orderColumn: 'generated_on',
      ascending: false,
      limit: 5000,
    }, warnings),
    selectRows(client, 'angelcare360_audit_logs', 'id, module, action, entity_type, entity_id, severity, after_data, metadata, created_at', input.schoolId, {
      filters: [
        ['module', 'in', ['academics', 'examens', 'bulletins']],
        ['created_at', 'gte', `${addDays(selectedDate, -45)}T00:00:00.000Z`],
      ],
      orderColumn: 'created_at',
      ascending: false,
      limit: 30,
    }, warnings),
  ])

  const assignmentIds = assignmentRows.map((row) => asString(row.id)).filter(Boolean)
  const submissionRows = assignmentIds.length
    ? await selectRows(client, 'angelcare360_assignment_submissions', 'id, assignment_id, student_id, submitted_at, score, feedback, status, created_at, updated_at', input.schoolId, {
        filters: [
          ['assignment_id', 'in', assignmentIds],
          ['status', 'in', ['submitted', 'late', 'reviewed']],
        ],
        orderColumn: 'updated_at',
        ascending: false,
        limit: 5000,
      }, warnings)
    : []

  const setting = settingsRows[0] || {}
  const gradingScaleLabel = asString(setting.grading_scale) || '0-20'
  const gradingScaleMax = parseGradingScaleMax(gradingScaleLabel)
  const successThreshold = resolveSuccessThreshold(setting.metadata_json, gradingScaleMax)

  const activeTerm = termRows.find((row) => asString(row.status) === 'active')
    || termRows.find((row) => isDateWithin(selectedDate, asString(row.starts_on), asString(row.ends_on)))
    || null

  const activeClasses = classRows.filter((row) => asString(row.status) === 'active')
  const activeStudentIds = new Set(
    studentRows
      .filter((row) => asString(row.status) === 'active')
      .map((row) => asString(row.id))
      .filter(Boolean),
  )
  const activeEnrollments = enrollmentRows.filter((row) => {
    const status = asString(row.status)
    const enrollmentStatus = asString(row.enrollment_status)
    const leftOn = asString(row.left_on)
    return status === 'active'
      && activeStudentIds.has(asString(row.student_id))
      && ['enrolled', 'admitted', 'active'].includes(enrollmentStatus)
      && (!leftOn || leftOn >= selectedDate)
  })
  const enrolledStudentIds = new Set(activeEnrollments.map((row) => asString(row.student_id)).filter(Boolean))

  const lessonsInPreparation = lessonRows.filter((row) => ['draft', 'planned'].includes(asString(row.status))).length
  const assignmentsToCorrect = submissionRows.filter((row) => ['submitted', 'late', 'reviewed'].includes(asString(row.status))).length
  const upcomingExamEnd = addDays(selectedDate, 30)
  const upcomingExamCount = examRows.filter((row) => {
    const status = asString(row.status)
    const date = asString(row.scheduled_on)
    return ['planned', 'scheduled', 'active', 'open'].includes(status)
      && date >= selectedDate
      && date <= upcomingExamEnd
  }).length

  const consolidatedStatuses = new Set(['calculated', 'reviewed', 'approved', 'published'])
  const consolidatedCards = reportCardRows.filter((row) => {
    const value = nullableNumber(row.overall_average)
    return consolidatedStatuses.has(asString(row.status))
      && value !== null
      && value >= 0
      && value <= gradingScaleMax
  })
  const activeTermCards = activeTerm
    ? consolidatedCards.filter((row) => asString(row.term_id) === asString(activeTerm.id))
    : []
  const authoritativeCards = latestRowsByKey(
    activeTermCards.length ? activeTermCards : consolidatedCards,
    'student_id',
    ['generated_on', 'updated_at', 'created_at'],
  )
  const authoritativeValues = authoritativeCards
    .map((row) => nullableNumber(row.overall_average))
    .filter((value): value is number => value !== null)
  const officialAverage = average(authoritativeValues)
  const successRate = successThreshold !== null && authoritativeValues.length
    ? round((authoritativeValues.filter((value) => value >= successThreshold).length / authoritativeValues.length) * 100, 1)
    : null

  const validMarks = markRows.filter((row) => asString(row.status) !== 'archived' && normalizedMark(row, gradingScaleMax) !== null)
  const trend = buildSixWeekBuckets({
    selectedDate,
    termStart: asString(activeTerm?.starts_on) || null,
    officialRows: consolidatedCards,
    markRows: validMarks,
    scaleMax: gradingScaleMax,
  })
  const trendValues = trend.points.map((point) => point.value).filter((value): value is number => value !== null)
  const firstTrend = trendValues[0] ?? null
  const lastTrend = trendValues.length ? trendValues[trendValues.length - 1] : null

  const classMap = new Map(classRows.map((row) => [asString(row.id), row]))
  const enrollmentByStudent = new Map(activeEnrollments.map((row) => [asString(row.student_id), row]))
  const studentMap = new Map(studentRows.map((row) => [asString(row.id), row]))
  const subjectMap = new Map(subjectRows.map((row) => [asString(row.id), row]))
  const lessonMap = new Map(lessonRows.map((row) => [asString(row.id), row]))
  const assignmentMap = new Map(assignmentRows.map((row) => [asString(row.id), row]))
  const examMap = new Map(examRows.map((row) => [asString(row.id), row]))

  const levelGroups = new Map<string, { values: number[]; students: Set<string>; order: number }>()
  if (authoritativeCards.length) {
    for (const row of authoritativeCards) {
      const classRow = classMap.get(asString(row.class_id))
      const level = asString(classRow?.level || classRow?.class_code || classRow?.name) || 'Niveau non précisé'
      const value = nullableNumber(row.overall_average)
      if (value === null) continue
      const current = levelGroups.get(level) || { values: [], students: new Set<string>(), order: asNumber(classRow?.order_index) || 999 }
      current.values.push(value)
      current.students.add(asString(row.student_id))
      levelGroups.set(level, current)
    }
  } else {
    const marksByStudent = new Map<string, number[]>()
    for (const row of validMarks) {
      const studentId = asString(row.student_id)
      if (!enrolledStudentIds.has(studentId)) continue
      const value = normalizedMark(row, gradingScaleMax)
      if (value === null) continue
      const current = marksByStudent.get(studentId) || []
      current.push(value)
      marksByStudent.set(studentId, current)
    }
    for (const [studentId, values] of marksByStudent.entries()) {
      const enrollment = enrollmentByStudent.get(studentId)
      const classRow = classMap.get(asString(enrollment?.class_id))
      const level = asString(classRow?.level || classRow?.class_code || classRow?.name) || 'Niveau non précisé'
      const studentAverage = average(values)
      if (studentAverage === null) continue
      const current = levelGroups.get(level) || { values: [], students: new Set<string>(), order: asNumber(classRow?.order_index) || 999 }
      current.values.push(studentAverage)
      current.students.add(studentId)
      levelGroups.set(level, current)
    }
  }

  const levelDistribution = Array.from(levelGroups.entries())
    .map(([level, group]) => {
      const value = average(group.values) || 0
      return {
        level,
        average: value,
        percentage: round(Math.min(100, Math.max(0, (value / gradingScaleMax) * 100)), 1),
        studentCount: group.students.size,
        order: group.order,
      }
    })
    .sort((a, b) => a.order - b.order || a.level.localeCompare(b.level))
    .slice(0, 10)
    .map(({ order: _order, ...item }) => item)

  let recentActivities = auditRows.slice(0, 8).map((row) => {
    const entityType = asString(row.entity_type).toLowerCase()
    const entityId = asString(row.entity_id)
    return {
      id: asString(row.id),
      kind: activityKind(entityType),
      title: actionTitle(asString(row.action), entityType),
      detail: activityDetail(row, {
        lessons: lessonMap,
        assignments: assignmentMap,
        exams: examMap,
        subjects: subjectMap,
        classes: classMap,
        students: studentMap,
      }),
      occurredAt: asString(row.created_at),
      href: activityHref(entityType, entityId),
    }
  })

  if (!recentActivities.length) {
    const fallbackEvents: Angelcare360AcademicCommandOverviewData['recentActivities'] = [
      ...lessonRows.slice(0, 3).map((row) => ({
        id: `lesson-${asString(row.id)}`,
        kind: 'lesson' as const,
        title: asString(row.status) === 'completed' ? 'Cours réalisé' : 'Cours planifié',
        detail: [asString(row.topic), asString(subjectMap.get(asString(row.subject_id))?.name), asString(classMap.get(asString(row.class_id))?.class_code)].filter(Boolean).join(' · '),
        occurredAt: asString(row.updated_at || row.created_at),
        href: `/angelcare-360-command-center/academique/cours/${asString(row.id)}`,
      })),
      ...assignmentRows.slice(0, 3).map((row) => ({
        id: `assignment-${asString(row.id)}`,
        kind: 'assignment' as const,
        title: asString(row.status) === 'published' ? 'Devoir publié' : 'Devoir préparé',
        detail: [asString(row.title), asString(subjectMap.get(asString(row.subject_id))?.name), asString(classMap.get(asString(row.class_id))?.class_code)].filter(Boolean).join(' · '),
        occurredAt: asString(row.updated_at || row.created_at),
        href: `/angelcare-360-command-center/academique/devoirs/${asString(row.id)}`,
      })),
      ...examRows.slice(0, 3).map((row) => ({
        id: `exam-${asString(row.id)}`,
        kind: 'exam' as const,
        title: 'Examen programmé',
        detail: [asString(row.title), asString(subjectMap.get(asString(row.subject_id))?.name), asString(classMap.get(asString(row.class_id))?.class_code)].filter(Boolean).join(' · '),
        occurredAt: asString(row.updated_at || row.created_at),
        href: `/angelcare-360-command-center/academique/examens/${asString(row.id)}`,
      })),
    ].filter((item) => item.occurredAt)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 8)
    recentActivities = fallbackEvents
  }

  const risks = [...(baseOverview?.risks || [])]
  if (successThreshold === null) risks.push('Le seuil institutionnel de réussite n’est pas encore configuré.')
  if (!authoritativeValues.length && validMarks.length) risks.push('Des notes existent, mais aucune moyenne officielle consolidée n’est disponible.')
  if (!baseOverview?.readiness.formulaReady && baseOverview?.readiness.reason) risks.push(baseOverview.readiness.reason)

  return {
    selectedDate,
    selectedDateLabel: fullDateLabel(selectedDate),
    schoolName: baseOverview?.schoolName || 'Établissement AngelCare 360',
    activeAcademicYearId: academicYearId,
    activeAcademicYearLabel: input.academicYearLabel || baseOverview?.activeAcademicYearLabel || null,
    activeTermId: asString(activeTerm?.id) || baseOverview?.activeTermId || null,
    activeTermLabel: asString(activeTerm?.label) || baseOverview?.activeTermLabel || null,
    gradingScaleLabel,
    gradingScaleMax,
    successThreshold,
    activeClassCount: activeClasses.length,
    activeStudentCount: enrolledStudentIds.size,
    lessonsInPreparation,
    assignmentsToCorrect,
    upcomingExamCount,
    officialAverage,
    successRate,
    officialAverageStudentCount: authoritativeValues.length,
    formulaReady: Boolean(baseOverview?.readiness.formulaReady),
    formulaReason: baseOverview?.readiness.reason || null,
    performanceTrend: {
      source: trend.source,
      sourceLabel: trend.sourceLabel,
      points: trend.points.map(({ start: _start, end: _end, ...point }) => point),
      bestAverage: trendValues.length ? round(Math.max(...trendValues), 1) : null,
      lowestAverage: trendValues.length ? round(Math.min(...trendValues), 1) : null,
      progression: firstTrend !== null && lastTrend !== null ? round(lastTrend - firstTrend, 1) : null,
    },
    recentActivities,
    levelDistribution,
    readiness: {
      hasAcademicYear: Boolean(academicYearId),
      hasActiveTerm: Boolean(activeTerm || baseOverview?.activeTermId),
      hasClasses: activeClasses.length > 0,
      hasStudents: enrolledStudentIds.size > 0,
      hasMarks: validMarks.length > 0,
      hasOfficialAverages: authoritativeValues.length > 0,
      successThresholdConfigured: successThreshold !== null,
    },
    risks: Array.from(new Set(risks.filter(Boolean))),
    warnings,
  }
}
