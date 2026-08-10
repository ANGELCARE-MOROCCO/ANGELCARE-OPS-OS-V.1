import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export type Angelcare360TeachersOverviewData = {
  attendance: {
    presentToday: number
    expectedToday: number
    presenceRate: number | null
    statusByTeacher: Record<string, 'present' | 'late' | 'absent' | 'unrecorded'>
  }
  schedule: {
    coursesToday: number
    hoursByTeacher: Record<string, number>
  }
  replacements: {
    openCount: number
    urgent: Array<{
      id: string
      title: string
      detail: string
      dateLabel: string
      tone: 'blue' | 'green' | 'orange' | 'red'
      href: string
    }>
  }
  training: {
    completedCount: number
    totalHours: number
    upcomingCount: number
    toPlanCount: number
    recommended: Array<{
      id: string
      title: string
      detail: string
      dateLabel: string
      href: string
    }>
  }
  documents: {
    expiringCount: number
    expiringSoon: Array<{
      id: string
      title: string
      detail: string
      daysLeft: number | null
      href: string
    }>
  }
  pedagogy: {
    matrix: Array<{
      subject: string
      classes: Record<string, number>
      total: number
    }>
    classLabels: string[]
  }
  queryWarnings: string[]
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

function asRowArray(value: unknown): Row[] {
  return Array.isArray(value) ? (value as unknown as Row[]) : []
}

function startOfTodayIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function endOfTodayIso() {
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

function daysUntil(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

function safeDateLabel(value: unknown) {
  if (!value) return 'Date non résolue'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Date non résolue'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function computeRate(part: number, total: number) {
  if (!total) return null
  return Math.round((part / total) * 1000) / 10
}

function itemName(value: unknown, fallback = 'Non renseigné') {
  if (!value || typeof value !== 'object') return fallback
  const row = value as Row
  return asString(row.name || row.title || row.class_code || row.subject_code || row.section_code) || fallback
}

async function selectRows(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  schoolId: string,
  options: {
    filters?: Array<[string, 'eq' | 'neq' | 'in' | 'gte' | 'lte', unknown]>
    orderColumn?: string
    ascending?: boolean
    limit?: number
  },
  warnings: string[],
) {
  let query = client.from(table).select(columns).eq('school_id', schoolId)

  for (const [column, operator, value] of options.filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'neq') query = query.neq(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
  }

  if (options.orderColumn) query = query.order(options.orderColumn, { ascending: options.ascending ?? false })
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) {
    const warning = `${table}: ${error.message}`
    if (!warnings.includes(warning)) warnings.push(warning)
    return []
  }

  return asRowArray(data)
}

function buildAssignmentMatrix(assignments: Row[]) {
  const classes = new Set<string>()
  const matrixMap = new Map<string, Map<string, number>>()

  for (const assignment of assignments) {
    const subject = itemName(assignment.subject, asString(assignment.subject_name || assignment.subject_code) || 'Matière à préciser')
    const classLabel = itemName(assignment.class, asString(assignment.class_name || assignment.class_code) || 'Classe à préciser')
    classes.add(classLabel)
    const current = matrixMap.get(subject) || new Map<string, number>()
    current.set(classLabel, (current.get(classLabel) || 0) + 1)
    matrixMap.set(subject, current)
  }

  const classLabels = Array.from(classes).slice(0, 6)
  const matrix = Array.from(matrixMap.entries()).slice(0, 6).map(([subject, values]) => {
    const classValues: Record<string, number> = {}
    let total = 0
    for (const label of classLabels) {
      const count = values.get(label) || 0
      classValues[label] = count
      total += count
    }
    return { subject, classes: classValues, total }
  })

  return { classLabels, matrix }
}

export async function getAngelcare360TeachersOverviewData(input: {
  schoolId: string
  teachers: Array<Record<string, unknown>>
}): Promise<Angelcare360TeachersOverviewData> {
  const client = await createClient()
  const warnings: string[] = []
  const todayStart = startOfTodayIso()
  const todayEnd = endOfTodayIso()

  const [attendanceRows, scheduleRows, replacementRows, trainingRows, documentRows, assignmentRows] = await Promise.all([
    selectRows(
      client,
      'angelcare360_staff_attendance',
      'id, staff_id, attendance_status, status, check_in_at, recorded_at, created_at',
      input.schoolId,
      {
        filters: [
          ['recorded_at', 'gte', todayStart],
          ['recorded_at', 'lte', todayEnd],
        ],
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_course_sessions',
      'id, staff_id, teacher_id, subject_id, class_id, starts_at, ends_at, status, created_at',
      input.schoolId,
      {
        filters: [
          ['starts_at', 'gte', todayStart],
          ['starts_at', 'lte', todayEnd],
        ],
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_teacher_replacements',
      'id, teacher_id, staff_id, class_id, subject_id, starts_at, ends_at, priority, status, reason, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'in', ['open', 'pending', 'requested', 'urgent']],
        ],
        orderColumn: 'starts_at',
        ascending: true,
        limit: 8,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_staff_training_records',
      'id, staff_id, title, training_title, hours, status, due_at, completed_at, starts_at, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'neq', 'archived'],
        ],
        orderColumn: 'created_at',
        ascending: false,
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_documents',
      'id, documentable_id, documentable_type, title, category, status, expires_at, valid_until, updated_at, created_at',
      input.schoolId,
      {
        filters: [
          ['documentable_type', 'eq', 'staff'],
        ],
        orderColumn: 'updated_at',
        ascending: false,
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_staff_assignments',
      `
        id,
        staff_id,
        class_id,
        subject_id,
        assignment_type,
        status,
        assigned_from,
        assigned_to,
        metadata_json,
        created_at,
        class:angelcare360_classes(id, name, class_code),
        subject:angelcare360_subjects(id, name, subject_code)
      `,
      input.schoolId,
      {
        filters: [
          ['status', 'eq', 'active'],
        ],
        limit: 1000,
      },
      warnings,
    ),
  ])

  const activeTeachers = input.teachers.filter((teacher) => asString(teacher.status) === 'active')
  const activeTeacherIds = new Set(activeTeachers.map((teacher) => asString(teacher.id)).filter(Boolean))
  const statusByTeacher: Record<string, 'present' | 'late' | 'absent' | 'unrecorded'> = {}
  for (const teacher of activeTeachers) statusByTeacher[asString(teacher.id)] = 'unrecorded'

  for (const row of attendanceRows) {
    const staffId = asString(row.staff_id)
    if (!activeTeacherIds.has(staffId)) continue
    const status = asString(row.attendance_status || row.status).toLowerCase()
    if (status.includes('present')) statusByTeacher[staffId] = 'present'
    else if (status.includes('late') || status.includes('retard')) statusByTeacher[staffId] = 'late'
    else if (status.includes('absent')) statusByTeacher[staffId] = 'absent'
  }

  const presentToday = Object.values(statusByTeacher).filter((value) => value === 'present' || value === 'late').length
  const expectedToday = attendanceRows.length ? activeTeachers.length : 0
  const presenceRate = computeRate(presentToday, expectedToday)

  const hoursByTeacher: Record<string, number> = {}
  for (const row of scheduleRows) {
    const staffId = asString(row.staff_id || row.teacher_id)
    if (!staffId) continue
    const starts = new Date(asString(row.starts_at))
    const ends = new Date(asString(row.ends_at))
    const hours = !Number.isNaN(starts.getTime()) && !Number.isNaN(ends.getTime())
      ? Math.max(0, (ends.getTime() - starts.getTime()) / 3600000)
      : 1
    hoursByTeacher[staffId] = Math.round(((hoursByTeacher[staffId] || 0) + hours) * 10) / 10
  }

  const completedTrainings = trainingRows.filter((row) => asString(row.status).toLowerCase().includes('complete') || asString(row.completed_at))
  const upcomingTrainings = trainingRows.filter((row) => ['planned', 'scheduled', 'pending', 'recommended'].includes(asString(row.status).toLowerCase()))
  const trainingHours = completedTrainings.reduce((sum, row) => sum + asNumber(row.hours), 0)

  const expiringDocuments = documentRows
    .map((row) => ({ row, left: daysUntil(row.expires_at || row.valid_until) }))
    .filter((item) => item.left !== null && item.left >= 0 && item.left <= 60)
    .sort((a, b) => (a.left || 0) - (b.left || 0))
    .slice(0, 6)

  const pedagogy = buildAssignmentMatrix(assignmentRows)

  return {
    attendance: {
      presentToday,
      expectedToday,
      presenceRate,
      statusByTeacher,
    },
    schedule: {
      coursesToday: scheduleRows.length,
      hoursByTeacher,
    },
    replacements: {
      openCount: replacementRows.length,
      urgent: replacementRows.slice(0, 4).map((row) => ({
        id: asString(row.id) || asString(row.created_at),
        title: itemName(row.class, asString(row.class_id) || 'Classe à couvrir'),
        detail: itemName(row.subject, asString(row.reason) || 'Remplacement à organiser'),
        dateLabel: safeDateLabel(row.starts_at || row.created_at),
        tone: asString(row.priority).toLowerCase().includes('urgent') ? 'red' : 'orange',
        href: '/angelcare-360-command-center/emploi-du-temps/remplacements',
      })),
    },
    training: {
      completedCount: completedTrainings.length,
      totalHours: Math.round(trainingHours * 10) / 10,
      upcomingCount: upcomingTrainings.length,
      toPlanCount: upcomingTrainings.length,
      recommended: upcomingTrainings.slice(0, 4).map((row) => ({
        id: asString(row.id) || asString(row.created_at),
        title: asString(row.title || row.training_title) || 'Formation à planifier',
        detail: asString(row.status) || 'À suivre',
        dateLabel: safeDateLabel(row.due_at || row.starts_at || row.created_at),
        href: '/angelcare-360-command-center/enseignants',
      })),
    },
    documents: {
      expiringCount: expiringDocuments.length,
      expiringSoon: expiringDocuments.map(({ row, left }) => ({
        id: asString(row.id) || asString(row.created_at),
        title: asString(row.title) || asString(row.category) || 'Document enseignant',
        detail: asString(row.status) || 'À vérifier',
        daysLeft: left,
        href: '/angelcare-360-command-center/personnes/documents',
      })),
    },
    pedagogy,
    queryWarnings: warnings,
  }
}
