import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export type Angelcare360ParentsOverviewData = {
  finance: {
    balancesByParent: Record<string, number>
    totalOutstandingMad: number
    parentsWithBalanceDue: number
    relanceCount: number
  }
  communication: {
    unreadMessages: number
    recentMessages: Array<{
      id: string
      title: string
      detail: string
      dateLabel: string
      href: string
      tone: 'blue' | 'green' | 'orange' | 'red'
    }>
  }
  authorizations: {
    pendingCount: number
    recentPending: Array<{
      id: string
      title: string
      detail: string
      dateLabel: string
      href: string
      tone: 'blue' | 'green' | 'orange' | 'red'
    }>
  }
  appointments: {
    upcoming: Array<{
      id: string
      title: string
      detail: string
      dateLabel: string
      href: string
    }>
  }
  engagement: {
    score: number | null
    highlyEngaged: number
    engaged: number
    weak: number
    risk: number
  }
  recentActivity: Array<{
    id: string
    title: string
    detail: string
    dateLabel: string
    tone: 'blue' | 'green' | 'orange' | 'red'
  }>
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

function parentLinkedStudentIds(parent: Row) {
  const links = Array.isArray(parent.parent_links) ? (parent.parent_links as Row[]) : []
  return links.map((link) => asString(link.student_id)).filter(Boolean)
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

function activityTone(value: unknown): 'blue' | 'green' | 'orange' | 'red' {
  const normalized = asString(value).toLowerCase()
  if (normalized.includes('critical') || normalized.includes('error')) return 'red'
  if (normalized.includes('warning') || normalized.includes('attention')) return 'orange'
  if (normalized.includes('notice') || normalized.includes('info')) return 'blue'
  return 'green'
}

export async function getAngelcare360ParentsOverviewData(input: {
  schoolId: string
  parents: Array<Record<string, unknown>>
}): Promise<Angelcare360ParentsOverviewData> {
  const client = await createClient()
  const warnings: string[] = []
  const todayStart = startOfTodayIso()

  const [invoiceRows, messageRows, authorizationRows, appointmentRows, auditRows] = await Promise.all([
    selectRows(
      client,
      'angelcare360_invoices',
      'id, student_id, balance_due, status, due_date, updated_at, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'in', ['issued', 'sent', 'partial', 'partially_paid', 'overdue']],
        ],
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_messages',
      'id, subject, body, status, sent_at, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'neq', 'archived'],
        ],
        orderColumn: 'created_at',
        ascending: false,
        limit: 8,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_authorizations',
      'id, title, authorization_type, status, student_id, parent_id, valid_from, valid_until, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'in', ['pending', 'requested', 'in_review', 'waiting_parent']],
        ],
        orderColumn: 'created_at',
        ascending: false,
        limit: 8,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_parent_appointments',
      'id, title, parent_id, student_id, scheduled_at, location, status, created_at',
      input.schoolId,
      {
        filters: [
          ['scheduled_at', 'gte', todayStart],
        ],
        orderColumn: 'scheduled_at',
        ascending: true,
        limit: 6,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_audit_logs',
      'id, module, action, entity_type, severity, created_at',
      input.schoolId,
      {
        filters: [
          ['module', 'in', ['parents', 'messagerie', 'finance', 'documents']],
        ],
        orderColumn: 'created_at',
        ascending: false,
        limit: 8,
      },
      warnings,
    ),
  ])

  const studentToParentIds = new Map<string, string[]>()
  for (const parent of input.parents) {
    const parentId = asString(parent.id)
    for (const studentId of parentLinkedStudentIds(parent)) {
      const current = studentToParentIds.get(studentId) || []
      current.push(parentId)
      studentToParentIds.set(studentId, current)
    }
  }

  const balancesByParent: Record<string, number> = {}
  for (const invoice of invoiceRows) {
    const studentId = asString(invoice.student_id)
    const parentIds = studentToParentIds.get(studentId) || []
    for (const parentId of parentIds) {
      balancesByParent[parentId] = (balancesByParent[parentId] || 0) + asNumber(invoice.balance_due)
    }
  }

  const totalOutstandingMad = Object.values(balancesByParent).reduce((sum, amount) => sum + amount, 0)
  const parentsWithBalanceDue = Object.values(balancesByParent).filter((amount) => amount > 0).length
  const relanceCount = invoiceRows.filter((row) => asNumber(row.balance_due) > 0).length
  const unreadMessages = messageRows.filter((row) => ['unread', 'new', 'pending'].includes(asString(row.status).toLowerCase())).length
  const activeParents = input.parents.filter((parent) => asString(parent.status) === 'active')
  const linkedParents = activeParents.filter((parent) => parentLinkedStudentIds(parent).length > 0)
  const contactReadyParents = activeParents.filter((parent) => asString(parent.phone) || asString(parent.email) || asString(parent.whatsapp))
  const financeClearParents = activeParents.filter((parent) => (balancesByParent[asString(parent.id)] || 0) <= 0)

  const denominator = activeParents.length
  const engagementScore = denominator
    ? Math.round((((linkedParents.length + contactReadyParents.length + financeClearParents.length) / (denominator * 3)) * 1000)) / 10
    : null

  const highlyEngaged = engagementScore === null ? 0 : Math.round((Math.max(0, engagementScore - 70) / 30) * denominator)
  const weak = engagementScore === null ? 0 : Math.max(0, parentsWithBalanceDue)
  const risk = engagementScore === null ? 0 : Math.max(0, activeParents.length - linkedParents.length)
  const engaged = Math.max(0, denominator - highlyEngaged - weak - risk)

  return {
    finance: {
      balancesByParent,
      totalOutstandingMad,
      parentsWithBalanceDue,
      relanceCount,
    },
    communication: {
      unreadMessages,
      recentMessages: messageRows.slice(0, 4).map((row) => ({
        id: asString(row.id) || asString(row.created_at),
        title: asString(row.subject) || 'Communication famille',
        detail: asString(row.body) || 'Aucun aperçu disponible',
        dateLabel: safeDateLabel(row.sent_at || row.created_at),
        href: '/angelcare-360-command-center/messagerie/conversations',
        tone: asString(row.status).toLowerCase() === 'unread' ? 'orange' : 'blue',
      })),
    },
    authorizations: {
      pendingCount: authorizationRows.length,
      recentPending: authorizationRows.slice(0, 4).map((row) => ({
        id: asString(row.id) || asString(row.created_at),
        title: asString(row.title) || asString(row.authorization_type) || 'Autorisation à traiter',
        detail: asString(row.status) || 'En attente',
        dateLabel: safeDateLabel(row.valid_from || row.created_at),
        href: '/angelcare-360-command-center/parents',
        tone: 'orange',
      })),
    },
    appointments: {
      upcoming: appointmentRows.slice(0, 4).map((row) => ({
        id: asString(row.id) || asString(row.created_at),
        title: asString(row.title) || 'Rendez-vous parent',
        detail: asString(row.location) || asString(row.status) || 'Lieu à confirmer',
        dateLabel: safeDateLabel(row.scheduled_at || row.created_at),
        href: '/angelcare-360-command-center/parents',
      })),
    },
    engagement: {
      score: engagementScore,
      highlyEngaged,
      engaged,
      weak,
      risk,
    },
    recentActivity: auditRows.map((row) => ({
      id: asString(row.id) || `${asString(row.module)}-${asString(row.created_at)}`,
      title: asString(row.action) || 'Action enregistrée',
      detail: asString(row.module) || 'AngelCare 360',
      dateLabel: safeDateLabel(row.created_at),
      tone: activityTone(row.severity),
    })),
    queryWarnings: warnings,
  }
}
