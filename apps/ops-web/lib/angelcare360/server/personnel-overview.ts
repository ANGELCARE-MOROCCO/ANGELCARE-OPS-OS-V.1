import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export type Angelcare360PersonnelOverviewData = {
  attendance: {
    absencesToday: number
    expectedToday: number
    absenceRate: number | null
    statusByStaff: Record<string, 'present' | 'late' | 'absent' | 'on_leave' | 'unrecorded'>
  }
  contracts: {
    renewalCount: number
    upcomingRenewals: Array<{
      id: string
      staffId: string
      staffName: string
      title: string
      detail: string
      daysLeft: number | null
      href: string
    }>
  }
  documents: {
    validCount: number
    expiringCount: number
    expiredCount: number
    missingCount: number
    complianceRate: number | null
    expiringSoon: Array<{
      id: string
      staffId: string
      staffName: string
      title: string
      detail: string
      daysLeft: number | null
      href: string
    }>
  }
  recruitment: {
    openCount: number
    interviewsThisWeek: number
  }
  roles: {
    distribution: Array<{
      label: string
      count: number
      share: number
      color: string
    }>
  }
  departments: {
    matrix: Array<{
      department: string
      months: Record<string, number>
      total: number
    }>
    monthLabels: string[]
    totalByMonth: Record<string, number>
  }
  priorities: Array<{
    id: string
    title: string
    detail: string
    label: string
    tone: 'red' | 'orange' | 'blue' | 'green'
    href: string
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

function asObject(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {}
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

function monthLabelsForCurrentYear() {
  const now = new Date()
  return Array.from({ length: 8 }, (_, index) => {
    const monthIndex = index
    const date = new Date(now.getFullYear(), monthIndex, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')
  })
}

function staffName(row: Row | undefined) {
  if (!row) return 'Collaborateur'
  return asString(row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ')) || 'Collaborateur'
}

function staffRole(row: Row) {
  const meta = asObject(row.metadata_json)
  const explicit = asString(meta.role || meta.role_label || meta.function || meta.position)
  if (explicit) return explicit
  const staffType = asString(row.staff_type)
  if (staffType === 'teacher') return 'Enseignant'
  const department = asString(row.department).toLowerCase()
  if (department.includes('direction')) return 'Direction'
  if (department.includes('admin')) return 'Administration'
  if (department.includes('rh')) return 'Gestionnaire RH'
  if (department.includes('support') || department.includes('service')) return 'Support'
  return asString(row.department) || 'Autres'
}

function contractTitle(row: Row) {
  return asString(row.contract_type || row.employment_type || row.contract_number) || 'Contrat personnel'
}

function documentExpiry(row: Row) {
  const meta = asObject(row.metadata_json)
  return row.expires_at || row.valid_until || meta.expires_at || meta.valid_until || meta.expiry_date || meta.expiration_date || null
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

function buildDepartmentMatrix(staff: Row[]) {
  const monthLabels = monthLabelsForCurrentYear()
  const now = new Date()
  const year = now.getFullYear()
  const departments = new Map<string, Record<string, number>>()
  const totalByMonth: Record<string, number> = Object.fromEntries(monthLabels.map((label) => [label, 0]))

  for (const row of staff) {
    const department = asString(row.department) || 'Non affecté'
    const hireDate = row.hire_date ? new Date(asString(row.hire_date)) : new Date(year, 0, 1)
    const endDate = row.end_date ? new Date(asString(row.end_date)) : null
    const current = departments.get(department) || Object.fromEntries(monthLabels.map((label) => [label, 0]))

    monthLabels.forEach((label, monthIndex) => {
      const start = new Date(year, monthIndex, 1)
      const end = new Date(year, monthIndex + 1, 0)
      const activeDuringMonth =
        (!Number.isNaN(hireDate.getTime()) ? hireDate <= end : true) &&
        (!endDate || Number.isNaN(endDate.getTime()) || endDate >= start) &&
        asString(row.status) !== 'archived'
      if (activeDuringMonth) {
        current[label] = (current[label] || 0) + 1
        totalByMonth[label] = (totalByMonth[label] || 0) + 1
      }
    })

    departments.set(department, current)
  }

  const matrix = Array.from(departments.entries())
    .map(([department, months]) => ({
      department,
      months,
      total: monthLabels.length ? Math.round(monthLabels.reduce((sum, label) => sum + (months[label] || 0), 0) / monthLabels.length) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  return { monthLabels, matrix, totalByMonth }
}

function buildRoleDistribution(staff: Row[]) {
  const palette = ['#2563eb', '#22c55e', '#8b5cf6', '#f59e0b', '#64748b', '#ec4899']
  const active = staff.filter((row) => asString(row.status) === 'active' || asString(row.status) === 'on_leave')
  const total = Math.max(1, active.length)
  const counts = new Map<string, number>()

  for (const row of active) {
    const role = staffRole(row)
    counts.set(role, (counts.get(role) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], index) => ({
      label,
      count,
      share: Math.round((count / total) * 100),
      color: palette[index % palette.length],
    }))
}

function buildRoleGradient(items: Array<{ color: string; share: number }>) {
  if (!items.length) return 'conic-gradient(#e2e8f0 0 100%)'
  let cursor = 0
  const segments = items.map((item) => {
    const start = cursor
    const end = Math.min(100, cursor + item.share)
    cursor = end
    return `${item.color} ${start}% ${end}%`
  })
  if (cursor < 100) segments.push(`#e2e8f0 ${cursor}% 100%`)
  return `conic-gradient(${segments.join(', ')})`
}

export function buildAngelcare360PersonnelRoleGradient(items: Array<{ color: string; share: number }>) {
  return buildRoleGradient(items)
}

export async function getAngelcare360PersonnelOverviewData(input: {
  schoolId: string
  staff: Array<Record<string, unknown>>
}): Promise<Angelcare360PersonnelOverviewData> {
  const client = await createClient()
  const warnings: string[] = []
  const todayStart = startOfTodayIso()
  const todayEnd = endOfTodayIso()
  const staffRows = input.staff as Row[]
  const staffById = new Map(staffRows.map((row) => [asString(row.id), row]))

  const [attendanceRows, contractRows, documentRows, recruitmentRows] = await Promise.all([
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
      'angelcare360_staff_contracts',
      'id, school_id, staff_id, contract_number, contract_type, starts_on, ends_on, employment_type, salary_amount, currency, workload_percent, status, metadata_json, created_at, updated_at',
      input.schoolId,
      {
        filters: [
          ['status', 'neq', 'archived'],
        ],
        orderColumn: 'ends_on',
        ascending: true,
        limit: 1000,
      },
      warnings,
    ),
    selectRows(
      client,
      'angelcare360_documents',
      'id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, visibility, status, metadata_json, created_at, updated_at',
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
      'angelcare360_recruitments',
      'id, title, status, stage, interview_at, created_at, updated_at',
      input.schoolId,
      {
        filters: [
          ['status', 'in', ['open', 'active', 'interview', 'in_progress']],
        ],
        limit: 200,
      },
      warnings,
    ),
  ])

  const activeStaff = staffRows.filter((row) => asString(row.status) === 'active')
  const statusByStaff: Record<string, 'present' | 'late' | 'absent' | 'on_leave' | 'unrecorded'> = {}
  for (const row of activeStaff) statusByStaff[asString(row.id)] = 'unrecorded'

  for (const row of attendanceRows) {
    const staffId = asString(row.staff_id)
    if (!statusByStaff[staffId]) continue
    const status = asString(row.attendance_status || row.status).toLowerCase()
    if (status.includes('present')) statusByStaff[staffId] = 'present'
    else if (status.includes('late') || status.includes('retard')) statusByStaff[staffId] = 'late'
    else if (status.includes('leave') || status.includes('congé')) statusByStaff[staffId] = 'on_leave'
    else if (status.includes('absent')) statusByStaff[staffId] = 'absent'
  }

  const absencesToday = Object.values(statusByStaff).filter((value) => value === 'absent' || value === 'on_leave').length
  const expectedToday = attendanceRows.length ? activeStaff.length : 0
  const absenceRate = expectedToday ? Math.round((absencesToday / expectedToday) * 1000) / 10 : null

  const renewalCandidates = contractRows
    .map((row) => ({ row, left: daysUntil(row.ends_on) }))
    .filter((item) => item.left !== null && item.left >= 0 && item.left <= 120)
    .sort((a, b) => (a.left || 0) - (b.left || 0))

  const documentExpiryCandidates = documentRows
    .map((row) => ({ row, left: daysUntil(documentExpiry(row)) }))
    .filter((item) => item.left !== null && item.left >= 0 && item.left <= 60)
    .sort((a, b) => (a.left || 0) - (b.left || 0))

  const expiredDocuments = documentRows.filter((row) => {
    const left = daysUntil(documentExpiry(row))
    return left !== null && left < 0
  })

  const validDocuments = documentRows.filter((row) => {
    const status = asString(row.status).toLowerCase()
    return status.includes('valid') || status.includes('reçu') || status.includes('recu') || status.includes('appr')
  })

  const missingCount = Math.max(0, activeStaff.length - documentRows.length)
  const complianceTotal = validDocuments.length + documentExpiryCandidates.length + expiredDocuments.length + missingCount
  const complianceRate = complianceTotal ? Math.round((validDocuments.length / complianceTotal) * 1000) / 10 : null

  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const interviewsThisWeek = recruitmentRows.filter((row) => {
    const interview = row.interview_at ? new Date(asString(row.interview_at)) : null
    return interview && !Number.isNaN(interview.getTime()) && interview <= weekEnd
  }).length

  const roleDistribution = buildRoleDistribution(staffRows)
  const departments = buildDepartmentMatrix(staffRows)

  const priorities: Angelcare360PersonnelOverviewData['priorities'] = []

  for (const item of renewalCandidates.slice(0, 2)) {
    const staff = staffById.get(asString(item.row.staff_id))
    priorities.push({
      id: `contract-${asString(item.row.id)}`,
      title: 'Contrat à renouveler',
      detail: `${staffName(staff)} — ${contractTitle(item.row)}`,
      label: item.left !== null && item.left <= 30 ? 'Urgent' : 'Important',
      tone: item.left !== null && item.left <= 30 ? 'red' : 'orange',
      href: '/angelcare-360-command-center/paie/dossiers',
    })
  }

  for (const item of documentExpiryCandidates.slice(0, 2)) {
    const staff = staffById.get(asString(item.row.documentable_id))
    priorities.push({
      id: `document-${asString(item.row.id)}`,
      title: 'Document expirant',
      detail: `${asString(item.row.title || item.row.category) || 'Document'} — ${staffName(staff)}`,
      label: item.left !== null && item.left <= 15 ? 'Urgent' : 'Important',
      tone: item.left !== null && item.left <= 15 ? 'red' : 'orange',
      href: '/angelcare-360-command-center/personnes/documents',
    })
  }

  if (absencesToday > 0) {
    priorities.push({
      id: 'absence-today',
      title: 'Absences aujourd’hui',
      detail: `${absencesToday} absence(s) ou congé(s) à vérifier`,
      label: 'À traiter',
      tone: 'blue',
      href: '/angelcare-360-command-center/presences/absences',
    })
  }

  return {
    attendance: {
      absencesToday,
      expectedToday,
      absenceRate,
      statusByStaff,
    },
    contracts: {
      renewalCount: renewalCandidates.length,
      upcomingRenewals: renewalCandidates.slice(0, 4).map(({ row, left }) => {
        const staff = staffById.get(asString(row.staff_id))
        return {
          id: asString(row.id) || asString(row.updated_at),
          staffId: asString(row.staff_id),
          staffName: staffName(staff),
          title: contractTitle(row),
          detail: asString(row.employment_type || row.contract_number || row.status) || 'Contrat à suivre',
          daysLeft: left,
          href: '/angelcare-360-command-center/paie/dossiers',
        }
      }),
    },
    documents: {
      validCount: validDocuments.length,
      expiringCount: documentExpiryCandidates.length,
      expiredCount: expiredDocuments.length,
      missingCount,
      complianceRate,
      expiringSoon: documentExpiryCandidates.slice(0, 4).map(({ row, left }) => {
        const staff = staffById.get(asString(row.documentable_id))
        return {
          id: asString(row.id) || asString(row.updated_at),
          staffId: asString(row.documentable_id),
          staffName: staffName(staff),
          title: asString(row.title || row.category) || 'Document personnel',
          detail: asString(row.status) || 'À vérifier',
          daysLeft: left,
          href: '/angelcare-360-command-center/personnes/documents',
        }
      }),
    },
    recruitment: {
      openCount: recruitmentRows.length,
      interviewsThisWeek,
    },
    roles: {
      distribution: roleDistribution,
    },
    departments,
    priorities: priorities.slice(0, 5),
    queryWarnings: warnings,
  }
}
