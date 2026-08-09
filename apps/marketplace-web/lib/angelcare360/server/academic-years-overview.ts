import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export type AcademicYearRecord = {
  id: string
  schoolId: string
  yearCode: string
  label: string
  startsOn: string
  endsOn: string
  isCurrent: boolean
  status: string
  metadata: Row
}

export type AcademicTermRecord = {
  id: string
  schoolId: string
  academicYearId: string
  termCode: string
  label: string
  termType: string | null
  startsOn: string
  endsOn: string
  orderIndex: number
  status: string
  metadata: Row
}

export type CalendarEventRecord = {
  id: string
  academicYearId: string | null
  eventCode: string
  title: string
  description: string | null
  eventType: string
  startsOn: string
  endsOn: string
  allDay: boolean
  audience: string
  status: string
}

export type AcademicYearTimelineItem = {
  id: string
  label: string
  startsOn: string
  endsOn: string
  status: 'completed' | 'active' | 'upcoming' | 'closed' | 'attention'
  statusLabel: string
}

export type AcademicDeadlineItem = {
  id: string
  title: string
  detail: string
  date: string
  timeLabel: string | null
  amountLabel: string | null
  tone: 'blue' | 'green' | 'orange' | 'red' | 'slate'
  href: string
}

export type AcademicMilestoneItem = {
  id: string
  title: string
  detail: string
  date: string
  daysLeft: number
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  href: string
}

export type AcademicChecklistItem = {
  id: string
  label: string
  completed: number
  total: number
  progress: number | null
  state: 'complete' | 'partial' | 'blocked' | 'not_applicable'
  href: string
}

export type AcademicAlertItem = {
  id: string
  title: string
  detail: string
  label: string
  tone: 'blue' | 'green' | 'orange' | 'red'
  href: string
}

export type Angelcare360AcademicYearsOverviewData = {
  years: AcademicYearRecord[]
  activeYear: AcademicYearRecord | null
  terms: AcademicTermRecord[]
  timeline: AcademicYearTimelineItem[]
  kpis: {
    openPeriods: number
    deadlinesThisWeek: number
    plannedClosures: number
    openEnrollmentWindows: number
  }
  enrollment: {
    activeCount: number
    capacity: number
    occupancyRate: number | null
  }
  deadlinesThisWeek: AcademicDeadlineItem[]
  milestones: AcademicMilestoneItem[]
  checklist: {
    title: string
    subtitle: string
    progress: number | null
    completedItems: number
    totalItems: number
    items: AcademicChecklistItem[]
    reopeningTitle: string
    reopeningProgress: number | null
    reopeningItems: AcademicChecklistItem[]
  }
  alerts: AcademicAlertItem[]
  calendar: {
    events: CalendarEventRecord[]
    unpublishedEvents: CalendarEventRecord[]
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

function asBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function asObject(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as unknown as Row[] : []
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(value: Date, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function daysUntil(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - startOfToday().getTime()) / 86400000)
}

function inRange(value: unknown, startsOn: string, endsOn: string) {
  const text = asString(value).slice(0, 10)
  return Boolean(text && text >= startsOn && text <= endsOn)
}

function inFutureWindow(value: unknown, days: number) {
  const left = daysUntil(value)
  return left !== null && left >= 0 && left <= days
}

function moneyDh(value: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh`
}

function dateTimeLabel(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  const hasTime = String(value).includes('T')
  return hasTime ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date) : null
}

function normalizeText(value: unknown) {
  return asString(value).toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function eventMatches(row: Row, terms: string[]) {
  const haystack = [row.title, row.event_type, row.event_code, row.description, JSON.stringify(asObject(row.metadata_json))]
    .map(normalizeText)
    .join(' ')
  return terms.some((term) => haystack.includes(normalizeText(term)))
}

function mapAcademicYear(row: Row): AcademicYearRecord {
  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    yearCode: asString(row.year_code),
    label: asString(row.label) || asString(row.year_code),
    startsOn: asString(row.starts_on),
    endsOn: asString(row.ends_on),
    isCurrent: asBoolean(row.is_current),
    status: asString(row.status) || 'planned',
    metadata: asObject(row.metadata_json),
  }
}

function mapTerm(row: Row): AcademicTermRecord {
  const metadata = asObject(row.metadata_json)
  return {
    id: asString(row.id),
    schoolId: asString(row.school_id),
    academicYearId: asString(row.academic_year_id),
    termCode: asString(row.term_code),
    label: asString(row.label) || asString(row.term_code),
    termType: asString(metadata.term_type) || null,
    startsOn: asString(row.starts_on),
    endsOn: asString(row.ends_on),
    orderIndex: asNumber(row.order_index) || 1,
    status: asString(row.status) || 'planned',
    metadata,
  }
}

function mapCalendarEvent(row: Row): CalendarEventRecord {
  return {
    id: asString(row.id),
    academicYearId: asString(row.academic_year_id) || null,
    eventCode: asString(row.event_code),
    title: asString(row.title) || 'Évènement scolaire',
    description: asString(row.description) || null,
    eventType: asString(row.event_type) || 'institutionnel',
    startsOn: asString(row.starts_on),
    endsOn: asString(row.ends_on),
    allDay: row.all_day !== false,
    audience: asString(row.audience) || 'all',
    status: asString(row.status) || 'planned',
  }
}

async function selectRows(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  schoolId: string,
  options: {
    academicYearId?: string | null
    academicYearColumn?: string
    orderColumn?: string
    ascending?: boolean
    limit?: number
  },
  warnings: string[],
) {
  let query = client.from(table).select(columns).eq('school_id', schoolId)
  if (options.academicYearId) query = query.eq(options.academicYearColumn || 'academic_year_id', options.academicYearId)
  if (options.orderColumn) query = query.order(options.orderColumn, { ascending: options.ascending ?? true })
  if (options.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) {
    const warning = `${table}: ${error.message}`
    if (!warnings.includes(warning)) warnings.push(warning)
    return []
  }
  return asRows(data)
}

function resolveActiveYear(years: AcademicYearRecord[], preferredId?: string | null) {
  if (preferredId) {
    const preferred = years.find((year) => year.id === preferredId)
    if (preferred) return preferred
  }
  return years.find((year) => year.isCurrent) || years.find((year) => year.status === 'active') || null
}

function termTimelineStatus(term: AcademicTermRecord): AcademicYearTimelineItem['status'] {
  if (term.status === 'closed' || term.status === 'archived') return 'completed'
  if (term.status === 'active') return 'active'
  if (term.status === 'planned') {
    const left = daysUntil(term.startsOn)
    if (left !== null && left < 0) return 'attention'
    return 'upcoming'
  }
  return 'closed'
}

function timelineStatusLabel(status: AcademicYearTimelineItem['status']) {
  if (status === 'completed') return 'Terminée'
  if (status === 'active') return 'En cours'
  if (status === 'upcoming') return 'À venir'
  if (status === 'attention') return 'À vérifier'
  return 'Fermée'
}

function checklistItem(id: string, label: string, completed: number, total: number, href: string): AcademicChecklistItem {
  if (total <= 0) return { id, label, completed: 0, total: 0, progress: null, state: 'not_applicable', href }
  const progress = Math.max(0, Math.min(100, Math.round((completed / total) * 100)))
  return {
    id,
    label,
    completed,
    total,
    progress,
    state: progress >= 100 ? 'complete' : progress <= 0 ? 'blocked' : 'partial',
    href,
  }
}

function averageProgress(items: AcademicChecklistItem[]) {
  const applicable = items.filter((item) => item.progress !== null)
  if (!applicable.length) return null
  return Math.round(applicable.reduce((sum, item) => sum + (item.progress || 0), 0) / applicable.length)
}

export async function getAngelcare360AcademicYearsOverviewData(input: {
  schoolId: string
  preferredAcademicYearId?: string | null
}): Promise<Angelcare360AcademicYearsOverviewData> {
  const client = await createClient()
  const warnings: string[] = []

  const yearRows = await selectRows(
    client,
    'angelcare360_academic_years',
    'id, school_id, year_code, label, starts_on, ends_on, is_current, status, metadata_json, created_at, updated_at',
    input.schoolId,
    { orderColumn: 'starts_on', ascending: false, limit: 50 },
    warnings,
  )

  const years = yearRows.map(mapAcademicYear)
  const activeYear = resolveActiveYear(years, input.preferredAcademicYearId)
  const academicYearId = activeYear?.id || input.preferredAcademicYearId || null

  const [termRows, calendarRows, examRows, reportCardRows, invoiceRows, admissionRows, admissionDocumentRows, attendanceSessionRows, attendanceJustificationRows, transportRows, enrollmentRows, classRows, timetableRows] = await Promise.all([
    selectRows(client, 'angelcare360_terms', 'id, school_id, academic_year_id, term_code, label, starts_on, ends_on, order_index, status, metadata_json, created_at, updated_at', input.schoolId, { academicYearId, orderColumn: 'order_index', ascending: true, limit: 100 }, warnings),
    selectRows(client, 'angelcare360_school_calendar_events', 'id, school_id, academic_year_id, event_code, title, description, event_type, starts_on, ends_on, all_day, audience, status, metadata_json, created_at, updated_at', input.schoolId, { academicYearId, orderColumn: 'starts_on', ascending: true, limit: 500 }, warnings),
    selectRows(client, 'angelcare360_exams', 'id, school_id, academic_year_id, title, exam_type, scheduled_on, status, metadata_json', input.schoolId, { academicYearId, orderColumn: 'scheduled_on', ascending: true, limit: 2000 }, warnings),
    selectRows(client, 'angelcare360_report_cards', 'id, school_id, academic_year_id, term_id, generated_on, status, metadata_json', input.schoolId, { academicYearId, orderColumn: 'generated_on', ascending: true, limit: 5000 }, warnings),
    selectRows(client, 'angelcare360_invoices', 'id, school_id, academic_year_id, student_id, invoice_number, due_date, total_amount, amount_paid, balance_due, status, metadata_json', input.schoolId, { academicYearId, orderColumn: 'due_date', ascending: true, limit: 5000 }, warnings),
    selectRows(client, 'angelcare360_admission_applications', 'id, school_id, academic_year_id, application_code, application_stage, application_date, status, metadata_json', input.schoolId, { academicYearId, orderColumn: 'application_date', ascending: false, limit: 3000 }, warnings),
    selectRows(client, 'angelcare360_admission_document_submissions', 'id, school_id, application_id, verification_status, status, submitted_at, reviewed_at', input.schoolId, { orderColumn: 'created_at', ascending: false, limit: 5000 }, warnings),
    selectRows(client, 'angelcare360_attendance_sessions', 'id, school_id, academic_year_id, session_date, status, total_expected, total_present, total_absent, total_late, total_excused', input.schoolId, { academicYearId, orderColumn: 'session_date', ascending: true, limit: 10000 }, warnings),
    selectRows(client, 'angelcare360_attendance_justifications', 'id, school_id, decision, status, submitted_at, reviewed_at', input.schoolId, { orderColumn: 'submitted_at', ascending: true, limit: 10000 }, warnings),
    selectRows(client, 'angelcare360_transport_assignments', 'id, school_id, academic_year_id, vehicle_id, pickup_stop_id, dropoff_stop_id, status, metadata_json', input.schoolId, { academicYearId, orderColumn: 'assigned_on', ascending: false, limit: 5000 }, warnings),
    selectRows(client, 'angelcare360_class_enrollments', 'id, school_id, academic_year_id, student_id, enrollment_status, status, enrolled_on, left_on', input.schoolId, { academicYearId, orderColumn: 'enrolled_on', ascending: false, limit: 10000 }, warnings),
    selectRows(client, 'angelcare360_classes', 'id, school_id, academic_year_id, capacity, status', input.schoolId, { academicYearId, limit: 1000 }, warnings),
    selectRows(client, 'angelcare360_timetable_slots', 'id, school_id, academic_year_id, status, day_of_week, start_time, end_time', input.schoolId, { academicYearId, limit: 10000 }, warnings),
  ])

  const terms = termRows.map(mapTerm)
  const calendarEvents = calendarRows.map(mapCalendarEvent)
  const todayText = dateOnly(startOfToday())
  const weekEndText = dateOnly(addDays(startOfToday(), 7))

  const activeEnrollmentRows = enrollmentRows.filter((row) => asString(row.status) === 'active' && ['enrolled', 'active', 'confirmed'].includes(asString(row.enrollment_status) || 'enrolled'))
  const activeClasses = classRows.filter((row) => asString(row.status) === 'active')
  const capacity = activeClasses.reduce((sum, row) => sum + asNumber(row.capacity), 0)
  const occupancyRate = capacity ? Math.round((activeEnrollmentRows.length / capacity) * 1000) / 10 : null

  const openPeriods = terms.filter((term) => term.status === 'active' || (term.status === 'planned' && term.startsOn <= todayText && term.endsOn >= todayText)).length
  const enrollmentEvents = calendarRows.filter((row) => eventMatches(row, ['inscription', 'admission', 'réinscription', 'reinscription']))
  const openEnrollmentWindows = enrollmentEvents.filter((row) => ['planned', 'published'].includes(asString(row.status)) && asString(row.starts_on) <= todayText && asString(row.ends_on) >= todayText).length
  const closureEvents = calendarRows.filter((row) => eventMatches(row, ['clôture', 'cloture', 'fermeture', 'bilan']))
  const plannedClosures = closureEvents.filter((row) => ['planned', 'published'].includes(asString(row.status)) && inFutureWindow(row.starts_on, 30)).length

  const deadlines: AcademicDeadlineItem[] = []
  for (const row of calendarRows) {
    if (!['planned', 'published'].includes(asString(row.status))) continue
    const date = asString(row.starts_on)
    if (date < todayText || date > weekEndText) continue
    deadlines.push({
      id: `calendar-${asString(row.id)}`,
      title: asString(row.title) || 'Évènement scolaire',
      detail: asString(row.event_type) || 'Calendrier institutionnel',
      date,
      timeLabel: null,
      amountLabel: null,
      tone: eventMatches(row, ['clôture', 'cloture', 'échéance', 'echeance']) ? 'red' : eventMatches(row, ['inscription']) ? 'green' : 'blue',
      href: '/angelcare-360-command-center/emploi-du-temps/calendrier',
    })
  }
  for (const row of examRows) {
    const date = asString(row.scheduled_on)
    if (!date || date < todayText || date > weekEndText || ['closed', 'archived'].includes(asString(row.status))) continue
    deadlines.push({
      id: `exam-${asString(row.id)}`,
      title: asString(row.title) || 'Évaluation',
      detail: asString(row.exam_type) || 'Évaluation académique',
      date,
      timeLabel: dateTimeLabel(row.scheduled_on),
      amountLabel: null,
      tone: 'orange',
      href: '/angelcare-360-command-center/academique/examens',
    })
  }
  for (const row of invoiceRows) {
    const date = asString(row.due_date)
    const balance = asNumber(row.balance_due)
    if (!date || date < todayText || date > weekEndText || balance <= 0 || ['paid', 'void', 'cancelled'].includes(asString(row.status))) continue
    deadlines.push({
      id: `invoice-${asString(row.id)}`,
      title: `Échéance ${asString(row.invoice_number) || 'facture'}`,
      detail: 'Finance scolaire',
      date,
      timeLabel: null,
      amountLabel: moneyDh(balance),
      tone: 'red',
      href: '/angelcare-360-command-center/finance/factures',
    })
  }
  deadlines.sort((left, right) => left.date.localeCompare(right.date))

  const milestones: AcademicMilestoneItem[] = []
  for (const row of calendarRows) {
    if (!['planned', 'published'].includes(asString(row.status))) continue
    const left = daysUntil(row.starts_on)
    if (left === null || left < 0 || left > 120) continue
    milestones.push({
      id: `event-${asString(row.id)}`,
      title: asString(row.title) || 'Jalon institutionnel',
      detail: asString(row.event_type) || 'Calendrier scolaire',
      date: asString(row.starts_on),
      daysLeft: left,
      tone: eventMatches(row, ['inscription']) ? 'green' : eventMatches(row, ['clôture', 'cloture']) ? 'red' : 'purple',
      href: '/angelcare-360-command-center/emploi-du-temps/calendrier',
    })
  }
  for (const term of terms) {
    const startLeft = daysUntil(term.startsOn)
    if (startLeft !== null && startLeft >= 0 && startLeft <= 120 && term.status === 'planned') {
      milestones.push({ id: `term-start-${term.id}`, title: `Ouverture — ${term.label}`, detail: 'Période académique', date: term.startsOn, daysLeft: startLeft, tone: 'blue', href: '/angelcare-360-command-center/administration/periodes' })
    }
    const endLeft = daysUntil(term.endsOn)
    if (endLeft !== null && endLeft >= 0 && endLeft <= 120 && !['closed', 'archived'].includes(term.status)) {
      milestones.push({ id: `term-end-${term.id}`, title: `Clôture — ${term.label}`, detail: 'Période académique', date: term.endsOn, daysLeft: endLeft, tone: endLeft <= 14 ? 'orange' : 'purple', href: '/angelcare-360-command-center/administration/periodes' })
    }
  }
  milestones.sort((left, right) => left.date.localeCompare(right.date))

  const activeTerm = terms.find((term) => term.status === 'active') || terms.find((term) => term.startsOn <= todayText && term.endsOn >= todayText) || null
  const nextTerm = terms.filter((term) => term.startsOn > todayText && term.status === 'planned').sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0] || null
  const checklistStarts = activeTerm?.startsOn || activeYear?.startsOn || todayText
  const checklistEnds = activeTerm?.endsOn || activeYear?.endsOn || todayText

  const termExams = examRows.filter((row) => inRange(row.scheduled_on, checklistStarts, checklistEnds))
  const closedExams = termExams.filter((row) => ['closed', 'archived'].includes(asString(row.status))).length
  const termReports = activeTerm ? reportCardRows.filter((row) => asString(row.term_id) === activeTerm.id) : reportCardRows.filter((row) => inRange(row.generated_on, checklistStarts, checklistEnds))
  const publishedReports = termReports.filter((row) => asString(row.status) === 'published').length
  const termAttendance = attendanceSessionRows.filter((row) => inRange(row.session_date, checklistStarts, checklistEnds))
  const closedAttendance = termAttendance.filter((row) => ['closed', 'locked'].includes(asString(row.status))).length
  const termJustifications = attendanceJustificationRows.filter((row) => inRange(row.submitted_at || row.reviewed_at, checklistStarts, checklistEnds))
  const reviewedJustifications = termJustifications.filter((row) => ['accepted', 'rejected'].includes(asString(row.decision))).length
  const termInvoices = invoiceRows.filter((row) => inRange(row.due_date, checklistStarts, checklistEnds))
  const settledInvoices = termInvoices.filter((row) => asNumber(row.balance_due) <= 0 || ['paid', 'void', 'cancelled'].includes(asString(row.status))).length
  const termCalendar = calendarRows.filter((row) => inRange(row.starts_on, checklistStarts, checklistEnds))
  const publishedCalendar = termCalendar.filter((row) => ['published', 'completed'].includes(asString(row.status))).length

  const checklistItems = [
    checklistItem('exams', 'Évaluations finalisées', closedExams, termExams.length, '/angelcare-360-command-center/academique/examens'),
    checklistItem('reports', 'Bulletins publiés', publishedReports, termReports.length, '/angelcare-360-command-center/academique/bulletins'),
    checklistItem('attendance', 'Feuilles de présence verrouillées', closedAttendance, termAttendance.length, '/angelcare-360-command-center/presences'),
    checklistItem('justifications', 'Justifications d’absence traitées', reviewedJustifications, termJustifications.length, '/angelcare-360-command-center/presences/justifications'),
    checklistItem('finance', 'Échéances financières soldées', settledInvoices, termInvoices.length, '/angelcare-360-command-center/finance/factures'),
    checklistItem('calendar', 'Calendrier de période publié', publishedCalendar, termCalendar.length, '/angelcare-360-command-center/emploi-du-temps/calendrier'),
  ]

  const nextTermSlots = timetableRows.filter((row) => asString(row.status) === 'active').length
  const nextTermEvents = nextTerm ? calendarRows.filter((row) => inRange(row.starts_on, nextTerm.startsOn, nextTerm.endsOn)) : []
  const nextTermPublishedEvents = nextTermEvents.filter((row) => ['published', 'completed'].includes(asString(row.status))).length
  const reopeningItems = [
    checklistItem('next-term', 'Période suivante configurée', nextTerm ? 1 : 0, 1, '/angelcare-360-command-center/administration/periodes'),
    checklistItem('slots', 'Cours & emplois du temps disponibles', nextTermSlots, Math.max(nextTermSlots, 1), '/angelcare-360-command-center/emploi-du-temps'),
    checklistItem('next-calendar', 'Jalons de réouverture publiés', nextTermPublishedEvents, nextTermEvents.length, '/angelcare-360-command-center/emploi-du-temps/calendrier'),
  ]

  const alerts: AcademicAlertItem[] = []
  const overdueInvoices = invoiceRows.filter((row) => asString(row.due_date) && asString(row.due_date) < todayText && asNumber(row.balance_due) > 0 && !['paid', 'void', 'cancelled'].includes(asString(row.status)))
  if (overdueInvoices.length) {
    const families = new Set(overdueInvoices.map((row) => asString(row.student_id)).filter(Boolean)).size
    const amount = overdueInvoices.reduce((sum, row) => sum + asNumber(row.balance_due), 0)
    alerts.push({ id: 'overdue-invoices', title: `${families} famille(s) avec solde impayé`, detail: `Montant total : ${moneyDh(amount)}`, label: 'Critique', tone: 'red', href: '/angelcare-360-command-center/finance/factures' })
  }

  const incompleteAdmissions = admissionRows.filter((row) => ['open', 'in_review'].includes(asString(row.status)) || ['draft', 'documents', 'incomplete'].includes(asString(row.application_stage)))
  const missingAdmissionDocuments = admissionDocumentRows.filter((row) => ['pending', 'missing', 'rejected'].includes(asString(row.verification_status)) && asString(row.status) === 'active')
  if (incompleteAdmissions.length || missingAdmissionDocuments.length) {
    alerts.push({ id: 'admissions-incomplete', title: `${Math.max(incompleteAdmissions.length, missingAdmissionDocuments.length)} dossier(s) à compléter`, detail: 'Admissions et pièces justificatives', label: 'Important', tone: 'orange', href: '/angelcare-360-command-center/admissions/documents' })
  }

  const incompleteTransport = transportRows.filter((row) => asString(row.status) === 'active' && (!row.vehicle_id || !row.pickup_stop_id || !row.dropoff_stop_id))
  if (incompleteTransport.length) {
    alerts.push({ id: 'transport-incomplete', title: `${incompleteTransport.length} affectation(s) transport incomplète(s)`, detail: 'Véhicule ou arrêt à compléter', label: 'Important', tone: 'orange', href: '/angelcare-360-command-center/transport/affectations' })
  }

  if (openEnrollmentWindows) {
    alerts.push({ id: 'enrollment-window', title: `${openEnrollmentWindows} fenêtre(s) d’inscription ouverte(s)`, detail: 'Admissions actuellement accessibles', label: 'Info', tone: 'blue', href: '/angelcare-360-command-center/admissions' })
  }

  if (activeYear && terms.length === 0) {
    alerts.push({ id: 'missing-terms', title: 'Aucune période configurée', detail: `L’année ${activeYear.label} doit être structurée`, label: 'Critique', tone: 'red', href: '/angelcare-360-command-center/administration/periodes' })
  }

  const timeline = terms.map((term) => {
    const status = termTimelineStatus(term)
    return { id: term.id, label: term.label, startsOn: term.startsOn, endsOn: term.endsOn, status, statusLabel: timelineStatusLabel(status) }
  })

  return {
    years,
    activeYear,
    terms,
    timeline,
    kpis: {
      openPeriods,
      deadlinesThisWeek: deadlines.length,
      plannedClosures,
      openEnrollmentWindows,
    },
    enrollment: {
      activeCount: activeEnrollmentRows.length,
      capacity,
      occupancyRate,
    },
    deadlinesThisWeek: deadlines.slice(0, 6),
    milestones: milestones.slice(0, 6),
    checklist: {
      title: activeTerm ? `Clôture de période — ${activeTerm.label}` : 'Préparation de clôture',
      subtitle: activeTerm ? `${activeTerm.startsOn} → ${activeTerm.endsOn}` : 'Aucune période active',
      progress: averageProgress(checklistItems),
      completedItems: checklistItems.filter((item) => item.state === 'complete').length,
      totalItems: checklistItems.length,
      items: checklistItems,
      reopeningTitle: nextTerm ? `Réouverture prochaine — ${nextTerm.label}` : 'Réouverture prochaine',
      reopeningProgress: averageProgress(reopeningItems),
      reopeningItems,
    },
    alerts: alerts.slice(0, 5),
    calendar: {
      events: calendarEvents,
      unpublishedEvents: calendarEvents.filter((event) => event.status === 'planned'),
    },
    queryWarnings: warnings,
  }
}


export async function publishAngelcare360AcademicCalendar(input: { schoolId: string; academicYearId: string }) {
  const context = await requireAngelcare360Permission('emploi_du_temps.update', { schoolId: input.schoolId })
  const client = await createClient()

  const { data: before, error: readError } = await client
    .from('angelcare360_school_calendar_events')
    .select('id, event_code, title, status')
    .eq('school_id', context.school!.id)
    .eq('academic_year_id', input.academicYearId)
    .eq('status', 'planned')

  if (readError) return { ok: false, error: readError.message }
  if (!before?.length) return { ok: true, count: 0, message: 'Aucun évènement planifié à publier.' }

  const { data: published, error } = await client
    .from('angelcare360_school_calendar_events')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('school_id', context.school!.id)
    .eq('academic_year_id', input.academicYearId)
    .eq('status', 'planned')
    .select('id, event_code, title, status')

  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'academic',
    module: 'annees_scolaires',
    action: 'academic_calendar.published',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'academic_year',
    entityId: input.academicYearId,
    severity: 'notice',
    beforeData: { plannedEvents: before },
    afterData: { publishedEvents: published || [] },
    metadata: { publishedCount: published?.length || 0 },
  })

  return {
    ok: true,
    count: published?.length || 0,
    message: `${published?.length || 0} évènement(s) publié(s).`,
    warning: auditResult.ok ? null : auditResult.error || 'Calendrier publié, mais audit indisponible.',
  }
}
