/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { getSanilaBusinessClock, SANILA_MASTER_DEMO_SCHOOL_ID } from './business-clock'
import type { Angelcare360AccessContext } from './context'

export type SanilaDataState = 'synced' | 'partial' | 'unavailable' | 'restricted'
export type SanilaMetric = { value: number | null; state: SanilaDataState; detail?: string | null }
export type SanilaTrendPoint = { key: string; label: string; primary: number; secondary?: number; tertiary?: number }
export type SanilaActionItem = { id: string; label: string; detail: string; href: string; tone: 'critical' | 'warning' | 'info'; count: number }

export type SanilaCommandCenterSnapshot = {
  generatedAt: string
  businessDate: string
  businessTimeLabel: string
  simulated: boolean
  school: { id: string; name: string; academicYearLabel: string | null; timezone: string; currency: string }
  sourceState: SanilaDataState
  sourceWarnings: string[]
  domainStates: {
    people: SanilaDataState
    attendance: SanilaDataState
    finance: SanilaDataState
    admissions: SanilaDataState
    academic: SanilaDataState
    payroll: SanilaDataState
    transport: SanilaDataState
    library: SanilaDataState
    inventory: SanilaDataState
    quality: SanilaDataState
  }
  metrics: {
    students: SanilaMetric
    classes: SanilaMetric
    staff: SanilaMetric
    teachers: SanilaMetric
    attendanceToday: SanilaMetric
    absencesToday: SanilaMetric
    latesToday: SanilaMetric
    invoices: SanilaMetric
    overdueInvoices: SanilaMetric
    partialInvoices: SanilaMetric
    payments: SanilaMetric
    assignments: SanilaMetric
    exams: SanilaMetric
    marks: SanilaMetric
    payrollRecords: SanilaMetric
    transportRoutes: SanilaMetric
    libraryLoans: SanilaMetric
    inventoryMovements: SanilaMetric
    complaints: SanilaMetric
    calendarEvents: SanilaMetric
  }
  attendanceTrend: SanilaTrendPoint[]
  financeTrend: SanilaTrendPoint[]
  admissionsFunnel: SanilaTrendPoint[]
  actions: SanilaActionItem[]
  masterDemo: boolean
}

type SafeResult<T> = { data: T; state: SanilaDataState; warning?: string }

function restrictedCount(): SafeResult<number> {
  return { data: 0, state: 'restricted' }
}

function restrictedRows<T>(): SafeResult<T[]> {
  return { data: [], state: 'restricted' }
}

function hasAnyPermission(context: Angelcare360AccessContext, permissions: string[]) {
  if (context.access.accessLevel === 'super_admin') return true
  if (context.permissions.has('*') || context.permissions.has('angelcare360.*')) return true
  return permissions.some((permission) => context.permissions.has(permission) || context.access.permissions.includes(permission))
}

function roleAllows(context: Angelcare360AccessContext, accessLevels: string[]) {
  return accessLevels.includes(context.access.accessLevel)
}

function asNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function dayLabel(date: string, timezone: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: timezone }).format(new Date(`${date}T12:00:00Z`))
}

function monthLabel(date: string, timezone: string) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit', timeZone: timezone }).format(new Date(`${date}T12:00:00Z`))
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

async function safeCount(client: any, table: string, schoolId: string, configure?: (query: any) => any): Promise<SafeResult<number>> {
  try {
    let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
    if (configure) query = configure(query)
    const { count, error } = await query
    if (error) return { data: 0, state: 'unavailable', warning: `${table}: ${error.message}` }
    return { data: count || 0, state: 'synced' }
  } catch (error) {
    return { data: 0, state: 'unavailable', warning: `${table}: ${error instanceof Error ? error.message : 'indisponible'}` }
  }
}

async function safeRows<T = Record<string, unknown>>(work: () => PromiseLike<{ data: T[] | null; error: any }>, label: string): Promise<SafeResult<T[]>> {
  try {
    const result = await work()
    if (result.error) return { data: [], state: 'unavailable', warning: `${label}: ${result.error.message}` }
    return { data: result.data || [], state: 'synced' }
  } catch (error) {
    return { data: [], state: 'unavailable', warning: `${label}: ${error instanceof Error ? error.message : 'indisponible'}` }
  }
}

function metric(result: SafeResult<number>, detail?: string): SanilaMetric {
  return { value: result.state === 'unavailable' || result.state === 'restricted' ? null : result.data, state: result.state, detail: detail || null }
}

function stateFrom(results: SafeResult<unknown>[]): SanilaDataState {
  const observable = results.filter((result) => result.state !== 'restricted')
  if (observable.length === 0) return 'restricted'
  const unavailable = observable.filter((result) => result.state === 'unavailable').length
  if (unavailable === observable.length) return 'unavailable'
  if (unavailable > 0) return 'partial'
  return 'synced'
}

function addDays(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return dateKey(date)
}

function monthStart(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return dateKey(date)
}

export function isTrustedSanilaMasterDemoContext(context: Angelcare360AccessContext | null | undefined) {
  return Boolean(
    context?.school?.id === SANILA_MASTER_DEMO_SCHOOL_ID
      && context.demoAccess
      && context.demoAccess.schoolId === context.school.id,
  )
}

export async function getSanilaCommandCenterSnapshot(context: Angelcare360AccessContext): Promise<SanilaCommandCenterSnapshot> {
  if (!context.school) throw new Error('SANILA command center requires an active school context.')
  const client = await createClient()
  const schoolId = context.school.id
  const clock = getSanilaBusinessClock(context)
  const businessDate = clock.date
  const timezone = context.schoolSettings?.default_timezone || context.school.timezone || 'Africa/Casablanca'
  const currency = context.schoolSettings?.default_currency || context.school.currency || 'MAD'
  const masterDemo = isTrustedSanilaMasterDemoContext(context)

  // The command center uses the service-role-backed server client, so tenant scoping alone
  // is not sufficient: every sensitive domain must also respect the viewer's established
  // AngelCare 360 authorization before a query is executed. Master Demo inherits the
  // trusted demo principal's super-admin authority; real tenants remain role/permission scoped.
  const peopleAllowed = context.access.canSeePeopleData || roleAllows(context, ['super_admin', 'direction', 'administration', 'support'])
  const attendanceAllowed = hasAnyPermission(context, ['angelcare360.attendance.view', 'attendance.view', 'presences.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'reception', 'enseignant', 'qualite', 'support'])
  const financeAllowed = context.access.canSeeSensitiveFinance || hasAnyPermission(context, ['angelcare360.finance.view', 'finance.view'])
  const admissionsAllowed = hasAnyPermission(context, ['angelcare360.admissions.view', 'admissions.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'reception', 'support'])
  const academicAllowed = hasAnyPermission(context, ['angelcare360.academics.view', 'academics.view', 'academique.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'enseignant', 'support'])
  const payrollAllowed = hasAnyPermission(context, ['angelcare360.paie.view', 'paie.view']) || roleAllows(context, ['super_admin', 'direction', 'rh', 'support'])
  const transportAllowed = hasAnyPermission(context, ['angelcare360.transport.view', 'transport.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'transport', 'support'])
  const libraryAllowed = hasAnyPermission(context, ['angelcare360.bibliotheque.view', 'bibliotheque.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'bibliotheque', 'support'])
  const inventoryAllowed = hasAnyPermission(context, ['angelcare360.inventaire.view', 'inventaire.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'support'])
  const qualityAllowed = hasAnyPermission(context, ['angelcare360.reclamations.view', 'reclamations.view']) || roleAllows(context, ['super_admin', 'direction', 'administration', 'qualite', 'support'])

  const metricResults = await Promise.all([
    peopleAllowed ? safeCount(client, 'angelcare360_students', schoolId, (q) => q.eq('status', 'active')) : restrictedCount(),
    academicAllowed ? safeCount(client, 'angelcare360_classes', schoolId, (q) => q.eq('status', 'active')) : restrictedCount(),
    peopleAllowed ? safeCount(client, 'angelcare360_staff', schoolId, (q) => q.eq('status', 'active')) : restrictedCount(),
    peopleAllowed ? safeCount(client, 'angelcare360_staff', schoolId, (q) => q.eq('status', 'active').eq('staff_type', 'teacher')) : restrictedCount(),
    financeAllowed ? safeCount(client, 'angelcare360_invoices', schoolId) : restrictedCount(),
    financeAllowed ? safeCount(client, 'angelcare360_invoices', schoolId, (q) => q.eq('status', 'overdue')) : restrictedCount(),
    financeAllowed ? safeCount(client, 'angelcare360_invoices', schoolId, (q) => q.in('status', ['partial', 'partially_paid'])) : restrictedCount(),
    financeAllowed ? safeCount(client, 'angelcare360_payments', schoolId) : restrictedCount(),
    academicAllowed ? safeCount(client, 'angelcare360_assignments', schoolId) : restrictedCount(),
    academicAllowed ? safeCount(client, 'angelcare360_exams', schoolId) : restrictedCount(),
    academicAllowed ? safeCount(client, 'angelcare360_marks', schoolId) : restrictedCount(),
    payrollAllowed ? safeCount(client, 'angelcare360_payroll_records', schoolId) : restrictedCount(),
    transportAllowed ? safeCount(client, 'angelcare360_transport_routes', schoolId, (q) => q.eq('status', 'active')) : restrictedCount(),
    libraryAllowed ? safeCount(client, 'angelcare360_library_loans', schoolId) : restrictedCount(),
    inventoryAllowed ? safeCount(client, 'angelcare360_inventory_movements', schoolId) : restrictedCount(),
    qualityAllowed ? safeCount(client, 'angelcare360_reclamations', schoolId, (q) => q.not('status', 'in', '(resolved,closed,archived)')) : restrictedCount(),
    safeCount(client, 'angelcare360_school_calendar_events', schoolId),
  ])
  const [students, classes, staff, teachers, invoices, overdueInvoices, partialInvoices, payments, assignments, exams, marks, payrollRecords, transportRoutes, libraryLoans, inventoryMovements, complaints, calendarEvents] = metricResults

  const attendanceSessionRows = attendanceAllowed
    ? await safeRows<any>(
        () => client.from('angelcare360_attendance_sessions').select('id,session_date').eq('school_id', schoolId).gte('session_date', addDays(businessDate, -6)).lte('session_date', businessDate),
        'attendance_sessions',
      )
    : restrictedRows<any>()
  const sessionIds = attendanceSessionRows.data.map((row) => String(row.id))
  const attendanceRows = sessionIds.length
    ? await safeRows<any>(
        () => client.from('angelcare360_attendance_records').select('attendance_session_id,attendance_status').eq('school_id', schoolId).in('attendance_session_id', sessionIds),
        'attendance_records',
      )
    : { data: [], state: attendanceSessionRows.state, warning: attendanceSessionRows.warning }

  const sessionsById = new Map(attendanceSessionRows.data.map((row) => [String(row.id), String(row.session_date)]))
  const attendanceMap = new Map<string, { total: number; present: number; absent: number; late: number }>()
  for (let offset = -6; offset <= 0; offset += 1) attendanceMap.set(addDays(businessDate, offset), { total: 0, present: 0, absent: 0, late: 0 })
  for (const row of attendanceRows.data) {
    const day = sessionsById.get(String(row.attendance_session_id))
    if (!day || !attendanceMap.has(day)) continue
    const bucket = attendanceMap.get(day)!
    bucket.total += 1
    const status = String(row.attendance_status || '')
    if (status === 'present') bucket.present += 1
    else if (status === 'absent') bucket.absent += 1
    else if (status === 'late') bucket.late += 1
  }
  const attendanceTrend = [...attendanceMap.entries()].map(([day, row]) => ({
    key: day,
    label: dayLabel(day, timezone),
    primary: row.total ? Math.round(((row.present + row.late) / row.total) * 1000) / 10 : 0,
    secondary: row.absent,
    tertiary: row.late,
  }))
  const todayAttendance = attendanceMap.get(businessDate) || { total: 0, present: 0, absent: 0, late: 0 }
  const attendanceState = stateFrom([attendanceSessionRows, attendanceRows])

  const firstFinanceMonth = monthStart(businessDate, -5)
  const financeInvoices = financeAllowed
    ? await safeRows<any>(
        () => client.from('angelcare360_invoices').select('invoice_date,total_amount,amount_paid,balance_due,status').eq('school_id', schoolId).gte('invoice_date', firstFinanceMonth).lte('invoice_date', businessDate),
        'finance_invoices_trend',
      )
    : restrictedRows<any>()
  const financeMap = new Map<string, { invoiced: number; paid: number; outstanding: number }>()
  for (let offset = -5; offset <= 0; offset += 1) financeMap.set(monthStart(businessDate, offset).slice(0, 7), { invoiced: 0, paid: 0, outstanding: 0 })
  for (const row of financeInvoices.data) {
    const key = String(row.invoice_date || '').slice(0, 7)
    if (!financeMap.has(key)) continue
    const bucket = financeMap.get(key)!
    bucket.invoiced += asNumber(row.total_amount)
    bucket.paid += asNumber(row.amount_paid)
    bucket.outstanding += asNumber(row.balance_due)
  }
  const financeTrend = [...financeMap.entries()].map(([month, row]) => ({ key: month, label: monthLabel(`${month}-01`, timezone), primary: Math.round(row.invoiced), secondary: Math.round(row.paid), tertiary: Math.round(row.outstanding) }))

  const admissionRows = admissionsAllowed
    ? await safeRows<any>(
        () => client.from('angelcare360_admission_applications').select('status,application_stage,ready_for_conversion').eq('school_id', schoolId),
        'admissions_funnel',
      )
    : restrictedRows<any>()
  const admissionStages = [
    { key: 'demandes', label: 'Demandes', test: () => true },
    { key: 'revue', label: 'En revue', test: (row: any) => ['open', 'in_review'].includes(String(row.status || '')) },
    { key: 'acceptes', label: 'Acceptés', test: (row: any) => ['approved', 'accepted'].includes(String(row.status || '')) },
    { key: 'conversion', label: 'Prêts à inscrire', test: (row: any) => Boolean(row.ready_for_conversion) },
    { key: 'inscrits', label: 'Inscrits', test: (row: any) => ['converted', 'enrolled'].includes(String(row.status || '')) },
  ]
  const admissionsFunnel = admissionStages.map((stage) => ({ key: stage.key, label: stage.label, primary: admissionRows.data.filter(stage.test).length }))

  const sourceResults: SafeResult<unknown>[] = [...metricResults, attendanceSessionRows, attendanceRows, financeInvoices, admissionRows]
  const warnings = sourceResults.map((result) => result.warning).filter((warning): warning is string => Boolean(warning))

  const actions: SanilaActionItem[] = []
  const overdue = overdueInvoices.state === 'synced' ? overdueInvoices.data : 0
  if (overdue > 0) actions.push({ id: 'finance-overdue', label: `${overdue} facture${overdue > 1 ? 's' : ''} à recouvrer`, detail: 'Les créances échues méritent une action de suivi.', href: '/angelcare-360-command-center/finance/impayes', tone: overdue > 25 ? 'critical' : 'warning', count: overdue })
  if (todayAttendance.absent > 0) actions.push({ id: 'attendance-absent', label: `${todayAttendance.absent} absence${todayAttendance.absent > 1 ? 's' : ''} aujourd’hui`, detail: 'Contrôler les justifications et les situations répétées.', href: '/angelcare-360-command-center/presences/absences', tone: 'warning', count: todayAttendance.absent })
  if (todayAttendance.late > 0) actions.push({ id: 'attendance-late', label: `${todayAttendance.late} retard${todayAttendance.late > 1 ? 's' : ''} aujourd’hui`, detail: 'Suivre les retards et les récurrences.', href: '/angelcare-360-command-center/presences/retards', tone: 'info', count: todayAttendance.late })
  if (complaints.state === 'synced' && complaints.data > 0) actions.push({ id: 'quality-open', label: `${complaints.data} sujet${complaints.data > 1 ? 's' : ''} qualité ouvert${complaints.data > 1 ? 's' : ''}`, detail: 'Assurer propriétaire, réponse et résolution.', href: '/angelcare-360-command-center/reclamations', tone: 'warning', count: complaints.data })
  if (actions.length === 0) actions.push({ id: 'clear', label: 'Aucune priorité critique détectée', detail: 'Le cockpit peut se concentrer sur les tendances et les décisions à venir.', href: '/angelcare-360-command-center/direction', tone: 'info', count: 0 })

  const businessTimeLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(clock.instant)

  return {
    generatedAt: new Date().toISOString(),
    businessDate,
    businessTimeLabel,
    simulated: clock.simulated,
    school: { id: schoolId, name: context.school.name, academicYearLabel: context.academicYear?.label || null, timezone, currency },
    sourceState: stateFrom(sourceResults),
    sourceWarnings: warnings,
    domainStates: {
      people: peopleAllowed ? stateFrom([students, staff, teachers]) : 'restricted',
      attendance: attendanceAllowed ? attendanceState : 'restricted',
      finance: financeAllowed ? stateFrom([invoices, overdueInvoices, partialInvoices, payments, financeInvoices]) : 'restricted',
      admissions: admissionsAllowed ? admissionRows.state : 'restricted',
      academic: academicAllowed ? stateFrom([classes, assignments, exams, marks]) : 'restricted',
      payroll: payrollAllowed ? payrollRecords.state : 'restricted',
      transport: transportAllowed ? transportRoutes.state : 'restricted',
      library: libraryAllowed ? libraryLoans.state : 'restricted',
      inventory: inventoryAllowed ? inventoryMovements.state : 'restricted',
      quality: qualityAllowed ? complaints.state : 'restricted',
    },
    metrics: {
      students: metric(students),
      classes: metric(classes),
      staff: metric(staff),
      teachers: metric(teachers),
      attendanceToday: { value: attendanceState === 'unavailable' || attendanceState === 'restricted' ? null : todayAttendance.total, state: attendanceState, detail: `${todayAttendance.present + todayAttendance.late} présents ou arrivés` },
      absencesToday: { value: attendanceState === 'unavailable' || attendanceState === 'restricted' ? null : todayAttendance.absent, state: attendanceState },
      latesToday: { value: attendanceState === 'unavailable' || attendanceState === 'restricted' ? null : todayAttendance.late, state: attendanceState },
      invoices: metric(invoices),
      overdueInvoices: metric(overdueInvoices),
      partialInvoices: metric(partialInvoices),
      payments: metric(payments),
      assignments: metric(assignments),
      exams: metric(exams),
      marks: metric(marks),
      payrollRecords: metric(payrollRecords),
      transportRoutes: metric(transportRoutes),
      libraryLoans: metric(libraryLoans),
      inventoryMovements: metric(inventoryMovements),
      complaints: metric(complaints),
      calendarEvents: metric(calendarEvents),
    },
    attendanceTrend,
    financeTrend,
    admissionsFunnel,
    actions: actions.slice(0, 6),
    masterDemo,
  }
}
