import { createClient } from '@/lib/supabase/server'
import {
  getAngelcare360DailyAttendanceState,
  listAngelcare360AttendanceJustifications,
} from '@/lib/angelcare360/server/attendance'

type Row = Record<string, unknown>

export type Angelcare360PresencesOverviewData = {
  selectedDate: string
  selectedDateLabel: string
  activeAcademicYearLabel: string | null
  expectedStudents: number
  markedStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  unmarkedCount: number
  attendanceRate: number | null
  completionRate: number
  todaySessions: number
  classAlertsCount: number
  classes: Array<{
    id: string
    label: string
    classId: string
    sectionId: string | null
    expected: number
    marked: number
    present: number
    absent: number
    late: number
    excused: number
    unmarked: number
    attendanceRate: number | null
    completionRate: number
    hasSession: boolean
    sessionStatus: string | null
    href: string
  }>
  lateRows: Array<{
    id: string
    studentId: string
    studentName: string
    studentCode: string | null
    classLabel: string
    timeLabel: string
    minutesLate: number
    note: string | null
    href: string
  }>
  pendingJustifications: Array<{
    id: string
    studentName: string
    studentCode: string | null
    classLabel: string
    absenceDate: string | null
    reason: string
    submittedLabel: string | null
    href: string
  }>
  unjustifiedAbsences: Array<{
    id: string
    studentId: string
    studentName: string
    studentCode: string | null
    classLabel: string
    absenceDate: string | null
    daysOpen: number
    href: string
  }>
  trend: Array<{
    date: string
    label: string
    rate: number | null
    present: number
    total: number
  }>
  alerts: Array<{
    id: string
    title: string
    detail: string
    count: number
    tone: 'red' | 'orange' | 'blue' | 'purple' | 'green'
    href: string
    actionLabel: string
  }>
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

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as unknown as Row[] : []
}

function asObject(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function dayKey(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00`)
}

function addDays(value: string, amount: number) {
  const date = dateAtNoon(value)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(dateAtNoon(value)).replace('.', '')
}

function fullDateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dateAtNoon(value))
}

function timeLabel(value: unknown) {
  if (!value) return 'Heure non renseignée'
  const parsed = new Date(asString(value))
  if (Number.isNaN(parsed.getTime())) return 'Heure non renseignée'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function daysSince(value: unknown, selectedDate: string) {
  if (!value) return 0
  const parsed = new Date(asString(value))
  if (Number.isNaN(parsed.getTime())) return 0
  const target = dateAtNoon(selectedDate)
  const source = new Date(parsed)
  source.setHours(12, 0, 0, 0)
  return Math.max(0, Math.floor((target.getTime() - source.getTime()) / 86400000))
}

function rate(part: number, total: number) {
  if (!total) return null
  return Math.round((part / total) * 1000) / 10
}

function classLabelFromSession(value: unknown) {
  const session = asObject(value)
  const classRecord = asObject(session.class)
  const sectionRecord = asObject(session.section)
  const className = asString(classRecord.class_code || classRecord.name) || 'Classe'
  const sectionName = asString(sectionRecord.section_code || sectionRecord.name)
  return sectionName ? `${className} · ${sectionName}` : className
}

async function safeQuery<T>(
  task: () => PromiseLike<{ data: T | null; error: { message?: string } | null }>,
  warningLabel: string,
  warnings: string[],
) {
  try {
    const response = await task()
    if (response.error) {
      const warning = `${warningLabel}: ${response.error.message || 'source indisponible'}`
      if (!warnings.includes(warning)) warnings.push(warning)
      return null
    }
    return response.data
  } catch (error) {
    const warning = `${warningLabel}: ${error instanceof Error ? error.message : 'source indisponible'}`
    if (!warnings.includes(warning)) warnings.push(warning)
    return null
  }
}

export async function getAngelcare360PresencesOverview(input: {
  schoolId: string
  selectedDate?: string | null
  activeAcademicYearLabel?: string | null
}): Promise<Angelcare360PresencesOverviewData> {
  const selectedDate = dayKey(input.selectedDate)
  const warnings: string[] = []
  const dailyState = await getAngelcare360DailyAttendanceState({
    schoolId: input.schoolId,
    date: selectedDate,
  })

  const classes = (dailyState?.classes || []).map((item) => {
    const present = asNumber(item.presentCount)
    const absent = asNumber(item.absentCount)
    const late = asNumber(item.lateCount)
    const excused = asNumber(item.excusedCount)
    const expected = asNumber(item.expectedStudents)
    const marked = asNumber(item.markedStudents)
    const unmarked = Math.max(0, expected - marked)
    return {
      id: `${item.classId}:${item.sectionId || 'class'}`,
      label: item.sectionName
        ? `${item.classCode || item.className} · ${item.sectionCode || item.sectionName}`
        : item.classCode || item.className,
      classId: item.classId,
      sectionId: item.sectionId || null,
      expected,
      marked,
      present,
      absent,
      late,
      excused,
      unmarked,
      attendanceRate: rate(present, expected),
      completionRate: asNumber(item.completionRate),
      hasSession: Boolean(item.hasSession),
      sessionStatus: item.sessionStatus || null,
      href: item.detailHref,
    }
  })

  const expectedStudents = classes.reduce((sum, item) => sum + item.expected, 0)
  const markedStudents = classes.reduce((sum, item) => sum + item.marked, 0)
  const presentCount = classes.reduce((sum, item) => sum + item.present, 0)
  const absentCount = classes.reduce((sum, item) => sum + item.absent, 0)
  const lateCount = classes.reduce((sum, item) => sum + item.late, 0)
  const excusedCount = classes.reduce((sum, item) => sum + item.excused, 0)
  const unmarkedCount = Math.max(0, expectedStudents - markedStudents)
  const attendanceRate = rate(presentCount, expectedStudents)
  const completionRate = rate(markedStudents, expectedStudents) || 0
  const todaySessions = classes.filter((item) => item.hasSession).length

  const client = await createClient()
  const db = client as any
  const start30 = addDays(selectedDate, -30)
  const start7 = addDays(selectedDate, -6)
  const endExclusive = addDays(selectedDate, 1)

  const sessionsData = await safeQuery<Row[]>(
    () => db
      .from('angelcare360_attendance_sessions')
      .select('id, session_date, class_id, section_id, status, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code)')
      .eq('school_id', input.schoolId)
      .gte('session_date', start30)
      .lt('session_date', endExclusive)
      .order('session_date', { ascending: true })
      .limit(2000),
    'Sessions de présence',
    warnings,
  )
  const sessions = asRows(sessionsData)
  const sessionIds = sessions.map((row) => asString(row.id)).filter(Boolean)
  const sessionById = new Map(sessions.map((row) => [asString(row.id), row]))

  let recordRows: Row[] = []
  if (sessionIds.length) {
    const recordsData = await safeQuery<Row[]>(
      () => db
        .from('angelcare360_attendance_records')
        .select('id, attendance_session_id, student_id, attendance_status, recorded_at, check_in_at, minutes_late, note, justification_required, status, created_at, metadata_json, student:angelcare360_students(id, full_name, student_code)')
        .eq('school_id', input.schoolId)
        .in('attendance_session_id', sessionIds)
        .order('recorded_at', { ascending: false })
        .limit(5000),
      'Pointages élèves',
      warnings,
    )
    recordRows = asRows(recordsData)
  }

  const justificationData = await safeQuery<Row[]>(
    () => db
      .from('angelcare360_attendance_justifications')
      .select('id, attendance_record_id, reason_category, description, submitted_at, reviewed_at, decision, status, created_at')
      .eq('school_id', input.schoolId)
      .order('submitted_at', { ascending: false })
      .limit(1500),
    'Justificatifs',
    warnings,
  )
  const justificationRows = asRows(justificationData)
  const justificationsByRecord = new Map<string, Row[]>()
  for (const row of justificationRows) {
    const key = asString(row.attendance_record_id)
    if (!key) continue
    const current = justificationsByRecord.get(key) || []
    current.push(row)
    justificationsByRecord.set(key, current)
  }

  const selectedSessionIds = new Set(
    sessions
      .filter((row) => asString(row.session_date) === selectedDate)
      .map((row) => asString(row.id)),
  )
  const selectedRecords = recordRows.filter((row) => selectedSessionIds.has(asString(row.attendance_session_id)))

  const lateRows = selectedRecords
    .filter((row) => asString(row.attendance_status) === 'late')
    .sort((a, b) => asString(a.check_in_at || a.recorded_at).localeCompare(asString(b.check_in_at || b.recorded_at)))
    .slice(0, 6)
    .map((row) => {
      const student = asObject(row.student)
      const session = sessionById.get(asString(row.attendance_session_id))
      const studentId = asString(row.student_id)
      return {
        id: asString(row.id),
        studentId,
        studentName: asString(student.full_name) || 'Élève',
        studentCode: asString(student.student_code) || null,
        classLabel: classLabelFromSession(session),
        timeLabel: timeLabel(row.check_in_at || row.recorded_at),
        minutesLate: asNumber(row.minutes_late),
        note: asString(row.note) || null,
        href: studentId
          ? `/angelcare-360-command-center/presences/eleves?studentId=${encodeURIComponent(studentId)}`
          : '/angelcare-360-command-center/presences/retards',
      }
    })

  const pendingItems = await listAngelcare360AttendanceJustifications({
    schoolId: input.schoolId,
    status: null,
    search: null,
  })
  const pendingJustifications = pendingItems
    .filter((item) => asString(item.decision).toLowerCase() === 'pending' || asString(item.status).toLowerCase() === 'pending')
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      studentName: item.student_full_name || 'Élève',
      studentCode: item.student_code || null,
      classLabel: 'Classe à consulter',
      absenceDate: item.session_date || null,
      reason: item.reason_category || item.description || 'Justificatif reçu',
      submittedLabel: item.submitted_at ? fullDateLabel(asString(item.submitted_at).slice(0, 10)) : null,
      href: item.detail_href || `/angelcare-360-command-center/presences/justifications/${item.id}`,
    }))

  const absences30 = recordRows.filter((row) => asString(row.attendance_status) === 'absent')
  const absenceCounts = new Map<string, number>()
  for (const row of absences30) {
    const studentId = asString(row.student_id)
    if (!studentId) continue
    absenceCounts.set(studentId, (absenceCounts.get(studentId) || 0) + 1)
  }
  const repeatedAbsenceStudents = Array.from(absenceCounts.values()).filter((count) => count >= 3).length

  const unjustifiedAbsences = absences30
    .filter((row) => {
      const linked = justificationsByRecord.get(asString(row.id)) || []
      const accepted = linked.some((item) => ['accepted', 'approved', 'valid'].includes(asString(item.decision || item.status).toLowerCase()))
      const session = sessionById.get(asString(row.attendance_session_id))
      const date = asString(session?.session_date)
      return !accepted && date && daysSince(date, selectedDate) >= 2
    })
    .sort((a, b) => {
      const sessionA = sessionById.get(asString(a.attendance_session_id))
      const sessionB = sessionById.get(asString(b.attendance_session_id))
      return asString(sessionA?.session_date).localeCompare(asString(sessionB?.session_date))
    })
    .slice(0, 6)
    .map((row) => {
      const student = asObject(row.student)
      const session = sessionById.get(asString(row.attendance_session_id))
      const studentId = asString(row.student_id)
      const absenceDate = asString(session?.session_date) || null
      return {
        id: asString(row.id),
        studentId,
        studentName: asString(student.full_name) || 'Élève',
        studentCode: asString(student.student_code) || null,
        classLabel: classLabelFromSession(session),
        absenceDate,
        daysOpen: absenceDate ? daysSince(absenceDate, selectedDate) : 0,
        href: studentId
          ? `/angelcare-360-command-center/presences/eleves?studentId=${encodeURIComponent(studentId)}`
          : '/angelcare-360-command-center/presences/absences',
      }
    })

  const trend = Array.from({ length: 7 }, (_, index) => addDays(start7, index)).map((date) => {
    const ids = new Set(
      sessions
        .filter((row) => asString(row.session_date) === date)
        .map((row) => asString(row.id)),
    )
    const rows = recordRows.filter((row) => ids.has(asString(row.attendance_session_id)))
    const present = rows.filter((row) => asString(row.attendance_status) === 'present').length
    const total = rows.filter((row) => ['present', 'absent', 'late', 'excused', 'justified'].includes(asString(row.attendance_status))).length
    return {
      date,
      label: dateLabel(date),
      rate: rate(present, total),
      present,
      total,
    }
  })

  const lowAttendanceClasses = classes.filter((item) => item.hasSession && item.attendanceRate !== null && item.attendanceRate < 90)
  const missingSheets = classes.filter((item) => !item.hasSession || item.unmarked > 0)
  const alertCount = [
    repeatedAbsenceStudents,
    lowAttendanceClasses.length,
    pendingJustifications.length,
    unjustifiedAbsences.length,
    missingSheets.length,
  ].filter((value) => value > 0).length

  const alerts: Angelcare360PresencesOverviewData['alerts'] = []
  if (repeatedAbsenceStudents > 0) {
    alerts.push({
      id: 'repeated-absences',
      title: 'Absences répétées',
      detail: `${repeatedAbsenceStudents} élève(s) cumulent au moins 3 absences sur 30 jours.`,
      count: repeatedAbsenceStudents,
      tone: 'red',
      href: '/angelcare-360-command-center/presences/absences',
      actionLabel: 'Voir la liste',
    })
  }
  if (lowAttendanceClasses.length > 0) {
    alerts.push({
      id: 'low-class-rate',
      title: 'Taux de présence faible',
      detail: `${lowAttendanceClasses.length} classe(s) sont sous le seuil de 90 % pour la journée.`,
      count: lowAttendanceClasses.length,
      tone: 'orange',
      href: '/angelcare-360-command-center/presences/classes',
      actionLabel: 'Voir les classes',
    })
  }
  if (pendingJustifications.length > 0) {
    alerts.push({
      id: 'pending-justifications',
      title: 'Justificatifs en attente',
      detail: `${pendingJustifications.length} justificatif(s) nécessitent une décision.`,
      count: pendingJustifications.length,
      tone: 'blue',
      href: '/angelcare-360-command-center/presences/justifications',
      actionLabel: 'Traiter maintenant',
    })
  }
  if (unjustifiedAbsences.length > 0) {
    alerts.push({
      id: 'unjustified-absences',
      title: 'Absences non justifiées',
      detail: `${unjustifiedAbsences.length} absence(s) dépassent 48 heures sans validation.`,
      count: unjustifiedAbsences.length,
      tone: 'purple',
      href: '/angelcare-360-command-center/presences/absences',
      actionLabel: 'Relancer les parents',
    })
  }
  if (missingSheets.length > 0) {
    alerts.push({
      id: 'incomplete-sheets',
      title: 'Pointage incomplet',
      detail: `${missingSheets.length} feuille(s) de classe restent à ouvrir ou à compléter.`,
      count: missingSheets.length,
      tone: 'orange',
      href: '/angelcare-360-command-center/presences/jour',
      actionLabel: 'Ouvrir le pointage',
    })
  }

  return {
    selectedDate,
    selectedDateLabel: fullDateLabel(selectedDate),
    activeAcademicYearLabel: input.activeAcademicYearLabel || dailyState?.activeAcademicYearLabel || null,
    expectedStudents,
    markedStudents,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    unmarkedCount,
    attendanceRate,
    completionRate,
    todaySessions,
    classAlertsCount: alertCount,
    classes,
    lateRows,
    pendingJustifications,
    unjustifiedAbsences,
    trend,
    alerts: alerts.slice(0, 5),
    warnings,
  }
}
