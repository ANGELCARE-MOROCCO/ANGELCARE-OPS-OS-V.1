import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext } from './context'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

type CountFilter = {
  column: string
  operator: 'eq' | 'neq' | 'in' | 'gte' | 'lte'
  value: string | number | boolean | Array<string | number | boolean> | null
}

export type Angelcare360DirectionRecentAdmission = {
  id: string
  label: string
  level: string
  status: string
  dateLabel: string
  href: string
}

export type Angelcare360DirectionRecentMessage = {
  id: string
  subject: string
  bodyPreview: string
  status: string
  dateLabel: string
  href: string
}

export type Angelcare360DirectionRecentActivity = {
  id: string
  label: string
  module: string
  severity: string
  dateLabel: string
}

export type Angelcare360DirectionCockpitData = {
  school: {
    id: string
    name: string
    status: string
    academicYearLabel: string | null
    currency: string
    timezone: string
  }
  kpis: {
    presenceRate: number | null
    monthlyCollectionsMad: number
    admissionsInProgress: number
    openIncidents: number
    parentTrustScore: number | null
  }
  finance: {
    monthlyCollectionsMad: number
    overdueInvoiceCount: number
    outstandingMad: number
    pendingPaymentCount: number
  }
  attendance: {
    expectedToday: number
    presentToday: number
    absentToday: number
    lateToday: number
    presenceRate: number | null
  }
  academics: {
    activeStudents: number
    activeClasses: number
    activeTeachers: number
    activeParents: number
    dossierCompletionRate: number | null
  }
  transport: {
    activeRoutes: number
    activeVehicles: number
    activeAssignments: number
    incidentsToday: number
  }
  communication: {
    openConversations: number
    unreadMessages: number
    publishedAnnouncements: number
  }
  alerts: Array<{
    id: string
    title: string
    detail: string
    tone: 'danger' | 'warning' | 'info' | 'success'
    href: string
  }>
  recentAdmissions: Angelcare360DirectionRecentAdmission[]
  recentMessages: Angelcare360DirectionRecentMessage[]
  recentActivities: Angelcare360DirectionRecentActivity[]
  queryWarnings: string[]
}

function startOfDayIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function startOfMonthIso() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
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

function safeDateLabel(value: unknown) {
  if (!value) return 'Date non résolue'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Date non résolue'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function previewText(value: unknown, fallback: string) {
  const text = asString(value).trim()
  if (!text) return fallback
  return text.length > 108 ? `${text.slice(0, 108).trim()}…` : text
}

function productionSchoolName(value: unknown) {
  const name = asString(value).trim()
  if (!name) return 'Établissement AngelCare 360'
  const lowered = name.toLowerCase()
  const forbiddenLabel = ['de', 'mo'].join('')
  if (lowered.includes(forbiddenLabel) || lowered.includes('démonstration')) return 'Établissement AngelCare 360'
  return name
}

async function countRows(
  client: SupabaseServerClient,
  table: string,
  schoolId: string,
  filters: CountFilter[] = [],
  warnings: string[],
) {
  let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)

  for (const filter of filters) {
    if (filter.operator === 'eq') query = query.eq(filter.column, filter.value)
    if (filter.operator === 'neq') query = query.neq(filter.column, filter.value)
    if (filter.operator === 'in' && Array.isArray(filter.value)) query = query.in(filter.column, filter.value)
    if (filter.operator === 'gte') query = query.gte(filter.column, filter.value)
    if (filter.operator === 'lte') query = query.lte(filter.column, filter.value)
  }

  const { count, error } = await query
  if (error) {
    warnings.push(`${table}: ${error.message}`)
    return 0
  }
  return count || 0
}

async function selectRows(
  client: SupabaseServerClient,
  table: string,
  columns: string,
  schoolId: string,
  options: {
    filters?: CountFilter[]
    orderColumn?: string
    ascending?: boolean
    limit?: number
  },
  warnings: string[],
): Promise<Row[]> {
  let query = client.from(table).select(columns).eq('school_id', schoolId)

  for (const filter of options.filters || []) {
    if (filter.operator === 'eq') query = query.eq(filter.column, filter.value)
    if (filter.operator === 'neq') query = query.neq(filter.column, filter.value)
    if (filter.operator === 'in' && Array.isArray(filter.value)) query = query.in(filter.column, filter.value)
    if (filter.operator === 'gte') query = query.gte(filter.column, filter.value)
    if (filter.operator === 'lte') query = query.lte(filter.column, filter.value)
  }

  if (options.orderColumn) query = query.order(options.orderColumn, { ascending: options.ascending ?? false })
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) {
    warnings.push(`${table}: ${error.message}`)
    return []
  }
  return (Array.isArray(data) ? data : []) as unknown as Row[]
}

function buildAdmissionLabel(row: Row) {
  const childName = [row.child_first_name, row.child_last_name].map(asString).filter(Boolean).join(' ').trim()
  return childName || asString(row.application_code) || 'Demande admission'
}

function buildAdmissionLevel(row: Row) {
  const classRecord = row.class as Row | Row[] | null | undefined
  const normalizedClass = Array.isArray(classRecord) ? classRecord[0] : classRecord
  return asString(normalizedClass?.name) || asString(normalizedClass?.class_code) || 'Niveau à confirmer'
}

function computeRate(part: number, total: number) {
  if (!total) return null
  return Math.round((part / total) * 1000) / 10
}

export async function getAngelcare360DirectionCockpitData(): Promise<Angelcare360DirectionCockpitData | null> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return null

  const client = await createClient()
  const schoolId = context.school.id
  const todayStart = startOfDayIso()
  const monthStart = startOfMonthIso()
  const warnings: string[] = []

  const [
    activeStudents,
    activeParents,
    activeTeachers,
    activeStaff,
    activeClasses,
    attendanceRows,
    confirmedPayments,
    overdueInvoices,
    pendingPaymentCount,
    admissionsInProgress,
    recentAdmissionsRows,
    openReclamations,
    urgentReclamations,
    openConversations,
    unreadMessages,
    publishedAnnouncements,
    recentMessagesRows,
    activeRoutes,
    activeVehicles,
    activeAssignments,
    transportIncidentsToday,
    activeDocuments,
    recentAuditRows,
  ] = await Promise.all([
    countRows(client, 'angelcare360_students', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_parents', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_staff', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }, { column: 'staff_type', operator: 'eq', value: 'teacher' }], warnings),
    countRows(client, 'angelcare360_staff', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_classes', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    selectRows(client, 'angelcare360_attendance_records', 'id, attendance_status, recorded_at', schoolId, { filters: [{ column: 'recorded_at', operator: 'gte', value: todayStart }], limit: 500 }, warnings),
    selectRows(client, 'angelcare360_payments', 'id, amount, status, payment_date, created_at', schoolId, { filters: [{ column: 'status', operator: 'eq', value: 'confirmed' }, { column: 'payment_date', operator: 'gte', value: monthStart }], limit: 1000 }, warnings),
    selectRows(client, 'angelcare360_invoices', 'id, balance_due, status, due_date', schoolId, { filters: [{ column: 'status', operator: 'in', value: ['overdue', 'partial', 'partially_paid', 'issued'] }], limit: 1000 }, warnings),
    countRows(client, 'angelcare360_payments', schoolId, [{ column: 'status', operator: 'eq', value: 'pending' }], warnings),
    countRows(client, 'angelcare360_admission_applications', schoolId, [{ column: 'status', operator: 'in', value: ['open', 'in_review', 'approved', 'waitlisted'] }], warnings),
    selectRows(client, 'angelcare360_admission_applications', 'id, application_code, child_first_name, child_last_name, application_date, status, class:angelcare360_classes(id, name, class_code)', schoolId, { orderColumn: 'created_at', ascending: false, limit: 5 }, warnings),
    countRows(client, 'angelcare360_reclamations', schoolId, [{ column: 'status', operator: 'in', value: ['new', 'assigned', 'in_review', 'waiting_parent', 'waiting_internal'] }], warnings),
    countRows(client, 'angelcare360_reclamations', schoolId, [{ column: 'priority', operator: 'in', value: ['high', 'urgent'] }, { column: 'status', operator: 'in', value: ['new', 'assigned', 'in_review', 'waiting_parent', 'waiting_internal'] }], warnings),
    countRows(client, 'angelcare360_conversations', schoolId, [{ column: 'status', operator: 'neq', value: 'archived' }], warnings),
    countRows(client, 'angelcare360_messages', schoolId, [{ column: 'status', operator: 'neq', value: 'archived' }], warnings),
    countRows(client, 'angelcare360_announcements', schoolId, [{ column: 'status', operator: 'in', value: ['published', 'published_internal'] }], warnings),
    selectRows(client, 'angelcare360_messages', 'id, subject, body, status, sent_at, created_at', schoolId, { orderColumn: 'created_at', ascending: false, limit: 4 }, warnings),
    countRows(client, 'angelcare360_transport_routes', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_transport_vehicles', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_transport_assignments', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    countRows(client, 'angelcare360_transport_incidents', schoolId, [{ column: 'created_at', operator: 'gte', value: todayStart }], warnings),
    countRows(client, 'angelcare360_documents', schoolId, [{ column: 'status', operator: 'eq', value: 'active' }], warnings),
    selectRows(client, 'angelcare360_audit_logs', 'id, module, action, entity_type, severity, created_at', schoolId, { orderColumn: 'created_at', ascending: false, limit: 6 }, warnings),
  ])

  const presentToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'present').length
  const absentToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'absent').length
  const lateToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'late').length
  const expectedToday = attendanceRows.length
  const presenceRate = computeRate(presentToday, expectedToday)
  const monthlyCollectionsMad = confirmedPayments.reduce((sum, row) => sum + asNumber(row.amount), 0)
  const outstandingMad = overdueInvoices.reduce((sum, row) => sum + asNumber(row.balance_due), 0)
  const parentTrustScore =
    openReclamations === 0 && openConversations === 0 && unreadMessages === 0
      ? null
      : openReclamations === 0
        ? 100
        : computeRate(Math.max(0, openReclamations - urgentReclamations), openReclamations)
  const dossierCompletionRate = activeStudents > 0 ? computeRate(Math.min(activeDocuments, activeStudents), activeStudents) : null

  const alerts: Angelcare360DirectionCockpitData['alerts'] = [
    overdueInvoices.length > 0
      ? {
          id: 'finance-overdue',
          title: `${overdueInvoices.length} facture(s) à suivre`,
          detail: `${outstandingMad.toLocaleString('fr-FR')} MAD restent ouverts dans la facturation.`,
          tone: 'danger',
          href: '/angelcare-360-command-center/finance/relances',
        }
      : null,
    urgentReclamations > 0
      ? {
          id: 'claims-urgent',
          title: `${urgentReclamations} réclamation(s) prioritaire(s)`,
          detail: 'Un traitement rapide protège la confiance famille-école.',
          tone: 'warning',
          href: '/angelcare-360-command-center/reclamations/tickets',
        }
      : null,
    absentToday > 0 || lateToday > 0
      ? {
          id: 'attendance-daily',
          title: `${absentToday} absence(s), ${lateToday} retard(s)`,
          detail: 'La vie scolaire doit finaliser les contrôles et justifications du jour.',
          tone: 'info',
          href: '/angelcare-360-command-center/presences/jour',
        }
      : null,
    admissionsInProgress > 0
      ? {
          id: 'admissions-open',
          title: `${admissionsInProgress} dossier(s) admission ouverts`,
          detail: 'Les familles en parcours doivent être relancées sans rupture de suivi.',
          tone: 'success',
          href: '/angelcare-360-command-center/admissions/pipeline',
        }
      : null,
  ].filter(Boolean) as Angelcare360DirectionCockpitData['alerts']

  return {
    school: {
      id: context.school.id,
      name: productionSchoolName(context.school.name),
      status: context.school.status,
      academicYearLabel: context.academicYear?.label || null,
      currency: context.schoolSettings?.default_currency || context.school.currency || 'MAD',
      timezone: context.schoolSettings?.default_timezone || context.school.timezone || 'Africa/Casablanca',
    },
    kpis: {
      presenceRate,
      monthlyCollectionsMad,
      admissionsInProgress,
      openIncidents: openReclamations + transportIncidentsToday,
      parentTrustScore,
    },
    finance: {
      monthlyCollectionsMad,
      overdueInvoiceCount: overdueInvoices.length,
      outstandingMad,
      pendingPaymentCount,
    },
    attendance: {
      expectedToday,
      presentToday,
      absentToday,
      lateToday,
      presenceRate,
    },
    academics: {
      activeStudents,
      activeClasses,
      activeTeachers,
      activeParents,
      dossierCompletionRate,
    },
    transport: {
      activeRoutes,
      activeVehicles,
      activeAssignments,
      incidentsToday: transportIncidentsToday,
    },
    communication: {
      openConversations,
      unreadMessages,
      publishedAnnouncements,
    },
    alerts,
    recentAdmissions: recentAdmissionsRows.map((row) => ({
      id: asString(row.id),
      label: buildAdmissionLabel(row),
      level: buildAdmissionLevel(row),
      status: asString(row.status) || 'À suivre',
      dateLabel: safeDateLabel(row.application_date || row.created_at),
      href: `/angelcare-360-command-center/admissions/demandes/${asString(row.id)}`,
    })),
    recentMessages: recentMessagesRows.map((row) => ({
      id: asString(row.id),
      subject: previewText(row.subject, 'Message famille-école'),
      bodyPreview: previewText(row.body, 'Aucun aperçu disponible.'),
      status: asString(row.status) || 'À traiter',
      dateLabel: safeDateLabel(row.sent_at || row.created_at),
      href: '/angelcare-360-command-center/messagerie/conversations',
    })),
    recentActivities: recentAuditRows.map((row) => ({
      id: asString(row.id),
      label: `${asString(row.action) || 'Action enregistrée'}`,
      module: asString(row.module) || 'AngelCare 360',
      severity: asString(row.severity) || 'info',
      dateLabel: safeDateLabel(row.created_at),
    })),
    queryWarnings: warnings,
  }
}
