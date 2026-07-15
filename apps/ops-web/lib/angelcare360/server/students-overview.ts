import { createClient } from '@/lib/supabase/server'
import type { Angelcare360StudentListRecord } from '@/types/angelcare360/people'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export type Angelcare360StudentsOverviewData = {
  attendance: {
    expectedToday: number
    presentToday: number
    absentToday: number
    lateToday: number
    excusedToday: number
    presenceRate: number | null
    hasTodaySession: boolean
  }
  finance: {
    balancesByStudent: Record<string, number>
    totalOutstandingMad: number
    studentsWithBalanceDue: number
  }
  health: {
    studentsWithHealthNotes: number
  }
  documents: {
    studentsWithoutDocuments: number
  }
  authorizations: {
    studentsWithAuthorizedPickup: number
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

function computeRate(part: number, total: number) {
  if (!total) return null
  return Math.round((part / total) * 1000) / 10
}

function extractHealthSignal(student: Angelcare360StudentListRecord) {
  const metadata = (student.metadata_json || {}) as Record<string, unknown>
  const allergies = Array.isArray(metadata.allergies) ? metadata.allergies : []
  const medicalConditions = Array.isArray(metadata.medical_conditions) ? metadata.medical_conditions : []
  return Boolean(
    allergies.length ||
    medicalConditions.length ||
    metadata.health_note ||
    metadata.medical_note ||
    metadata.emergency_notes ||
    metadata.dietary_notes ||
    (student as unknown as Row).health_notes ||
    (student as unknown as Row).medical_notes ||
    (student as unknown as Row).allergies,
  )
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
    warnings.push(`${table}: ${error.message}`)
    return []
  }

  return asRowArray(data)
}

export async function getAngelcare360StudentsOverviewData(input: {
  schoolId: string
  students: Angelcare360StudentListRecord[]
}): Promise<Angelcare360StudentsOverviewData> {
  const client = await createClient()
  const warnings: string[] = []
  const todayStart = startOfTodayIso()

  const [attendanceRows, invoiceRows, auditRows] = await Promise.all([
    selectRows(
      client,
      'angelcare360_attendance_records',
      'id, student_id, attendance_status, check_in_at, minutes_late, status, recorded_at, created_at',
      input.schoolId,
      {
        filters: [
          ['status', 'neq', 'archived'],
          ['recorded_at', 'gte', todayStart],
        ],
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_invoices',
      'id, student_id, balance_due, status, due_date, updated_at',
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
      'angelcare360_audit_logs',
      'id, module, action, entity_type, severity, created_at',
      input.schoolId,
      {
        filters: [
          ['module', 'in', ['eleves', 'presences', 'documents', 'finance']],
        ],
        orderColumn: 'created_at',
        ascending: false,
        limit: 6,
      },
      warnings,
    ),
  ])

  const activeStudents = input.students.filter((student) => asString(student.status) === 'active')
  const presentToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'present').length
  const absentToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'absent').length
  const lateToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'late').length
  const excusedToday = attendanceRows.filter((row) => asString(row.attendance_status) === 'excused').length
  const expectedToday = attendanceRows.length
  const presenceRate = computeRate(presentToday, expectedToday)

  const balancesByStudent: Record<string, number> = {}
  for (const invoice of invoiceRows) {
    const studentId = asString(invoice.student_id)
    if (!studentId) continue
    balancesByStudent[studentId] = (balancesByStudent[studentId] || 0) + asNumber(invoice.balance_due)
  }

  const totalOutstandingMad = Object.values(balancesByStudent).reduce((sum, value) => sum + value, 0)
  const studentsWithBalanceDue = Object.values(balancesByStudent).filter((value) => value > 0).length
  const studentsWithHealthNotes = activeStudents.filter(extractHealthSignal).length
  const studentsWithoutDocuments = activeStudents.filter((student) => Number(student.document_count || 0) === 0).length
  const studentsWithAuthorizedPickup = activeStudents.filter((student) => {
    const links = Array.isArray((student as unknown as Row).parent_links) ? ((student as unknown as Row).parent_links as Row[]) : []
    return links.some((link) => link.can_pickup === true)
  }).length

  return {
    attendance: {
      expectedToday,
      presentToday,
      absentToday,
      lateToday,
      excusedToday,
      presenceRate,
      hasTodaySession: expectedToday > 0,
    },
    finance: {
      balancesByStudent,
      totalOutstandingMad,
      studentsWithBalanceDue,
    },
    health: {
      studentsWithHealthNotes,
    },
    documents: {
      studentsWithoutDocuments,
    },
    authorizations: {
      studentsWithAuthorizedPickup,
    },
    recentActivity: auditRows.map((row) => {
      const severity = asString(row.severity).toLowerCase()
      const tone =
        severity.includes('critical') || severity.includes('error')
          ? 'red'
          : severity.includes('warning')
            ? 'orange'
            : severity.includes('notice')
              ? 'blue'
              : 'green'
      return {
        id: asString(row.id) || `${asString(row.module)}-${asString(row.created_at)}`,
        title: asString(row.action) || 'Action enregistrée',
        detail: asString(row.module) || 'AngelCare 360',
        dateLabel: safeDateLabel(row.created_at),
        tone,
      }
    }),
    queryWarnings: warnings,
  }
}
