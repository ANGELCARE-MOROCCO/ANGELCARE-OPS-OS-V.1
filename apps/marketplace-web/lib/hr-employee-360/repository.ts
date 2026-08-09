import { createServiceClient } from '@/lib/supabase/server'
import type {
  Employee360Actor,
} from './permissions'
import type {
  Employee360Aggregate,
  Employee360DomainKey,
  Employee360Health,
  Employee360Profile,
  Employee360Record,
  Employee360TimelineEvent,
  JsonObject,
} from './types'

type DbRow = Record<string, unknown>
type DomainReadResult = {
  rows: Employee360Record[]
  state: 'healthy' | 'unavailable' | 'degraded'
  warning?: string
}

const DOMAIN_KEYS: Employee360DomainKey[] = [
  'attendance',
  'leave',
  'payroll',
  'planning',
  'documents',
  'contracts',
  'onboarding',
  'training',
  'performance',
  'communications',
  'tasks',
  'approvals',
  'incidents',
]

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized ? normalized : null
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  const normalized = String(value || '').toLowerCase()
  if (['true', '1', 'yes', 'oui'].includes(normalized)) return true
  if (['false', '0', 'no', 'non'].includes(normalized)) return false
  return fallback
}

function objectValue(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output: JsonObject = {}
  Object.entries(value).forEach(([key, item]) => {
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean' ||
      Array.isArray(item) ||
      (typeof item === 'object' && item !== null)
    ) {
      output[key] = item as JsonObject[string]
    }
  })
  return output
}

function dateValue(value: unknown): string | null {
  const normalized = text(value)
  return normalized
}

function canonicalStatus(row: DbRow): string {
  return text(row.status) || text(row.stage) || text(row.state) || 'recorded'
}

function canonicalTitle(row: DbRow, fallback: string): string {
  return (
    text(row.title) ||
    text(row.name) ||
    text(row.document_type) ||
    text(row.contract_type) ||
    text(row.leave_type) ||
    text(row.training_title) ||
    text(row.training_name) ||
    text(row.review_cycle) ||
    text(row.correction_type) ||
    text(row.request_type) ||
    text(row.incident_type) ||
    fallback
  )
}

function canonicalSubtitle(row: DbRow): string | null {
  return (
    text(row.description) ||
    text(row.reason) ||
    text(row.notes) ||
    text(row.department) ||
    text(row.location)
  )
}

function canonicalEffectiveAt(row: DbRow): string | null {
  return (
    dateValue(row.effective_at) ||
    dateValue(row.occurred_at) ||
    dateValue(row.work_date) ||
    dateValue(row.start_date) ||
    dateValue(row.period_start) ||
    dateValue(row.assigned_at) ||
    dateValue(row.created_at)
  )
}

function canonicalDueAt(row: DbRow): string | null {
  return (
    dateValue(row.due_at) ||
    dateValue(row.due_date) ||
    dateValue(row.end_date) ||
    dateValue(row.expiry_date) ||
    dateValue(row.period_end)
  )
}

function normalizeDomainRecord(
  domain: Employee360DomainKey,
  sourceTable: string,
  employeeId: string,
  row: DbRow,
): Employee360Record {
  const metadata = {
    ...objectValue(row.metadata),
    sourceRow: objectValue(row),
  }

  return {
    id: String(row.id || ''),
    employeeId,
    domain,
    title: canonicalTitle(row, `Enregistrement ${domain}`),
    subtitle: canonicalSubtitle(row),
    status: canonicalStatus(row),
    stage: text(row.stage),
    priority: text(row.priority) || text(row.severity),
    effectiveAt: canonicalEffectiveAt(row),
    dueAt: canonicalDueAt(row),
    amount: numberValue(row.amount) ?? numberValue(row.salary) ?? numberValue(row.score),
    currency: text(row.currency),
    owner: text(row.owner) || text(row.owner_name) || text(row.approver_name),
    archivedAt: dateValue(row.archived_at),
    version: Math.max(1, numberValue(row.version) || 1),
    sourceTable,
    metadata,
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at),
  }
}

function normalizeProfile(row: DbRow): Employee360Profile {
  const firstName = text(row.first_name)
  const lastName = text(row.last_name)
  const fullName =
    text(row.full_name) ||
    text(row.name) ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    text(row.email) ||
    'Collaborateur'

  const employmentStatus = text(row.employment_status) || text(row.status) || 'active'
  const rawLifecycle = text(row.lifecycle_state) || employmentStatus.toLowerCase()
  const lifecycleState = [
    'draft',
    'preboarding',
    'probation',
    'active',
    'on_leave',
    'suspended',
    'transferred',
    'promoted',
    'notice_period',
    'terminated',
    'archived',
    'rehired',
  ].includes(rawLifecycle)
    ? rawLifecycle
    : 'active'

  return {
    id: String(row.id || ''),
    appUserId: text(row.app_user_id) || text(row.user_id),
    tenantId: text(row.tenant_id),
    organizationId: text(row.organization_id),
    firstName,
    lastName,
    preferredName: text(row.preferred_name),
    fullName,
    email: text(row.email) || text(row.work_email),
    phone: text(row.phone) || text(row.mobile),
    nationalId: text(row.national_id) || text(row.cin),
    dateOfBirth: dateValue(row.date_of_birth),
    placeOfBirth: text(row.place_of_birth),
    nationality: text(row.nationality),
    gender: text(row.gender),
    maritalStatus: text(row.marital_status),
    childrenCount: Math.max(0, numberValue(row.children_count) || 0),
    address: text(row.address),
    city: text(row.city),
    postalCode: text(row.postal_code),
    country: text(row.country),
    branchOffice: text(row.branch_office) || text(row.office),
    workCity: text(row.work_city) || text(row.city),
    remoteOption: text(row.remote_option),
    position: text(row.position) || text(row.job_title) || text(row.role),
    department: text(row.department),
    manager: text(row.manager) || text(row.reports_to),
    managerUserId: text(row.manager_user_id),
    employmentStatus,
    lifecycleState: lifecycleState as Employee360Profile['lifecycleState'],
    employmentType: text(row.employment_type),
    startDate: dateValue(row.start_date),
    hireDate: dateValue(row.hire_date) || dateValue(row.start_date),
    probationEndDate: dateValue(row.probation_end_date),
    contractType: text(row.contract_type),
    salary: numberValue(row.salary) ?? numberValue(row.base_salary),
    currency: text(row.currency) || 'MAD',
    paymentMethod: text(row.payment_method),
    cnssNumber: text(row.cnss_number),
    amoNumber: text(row.amo_number),
    emergencyContactName: text(row.emergency_contact_name),
    emergencyContactPhone: text(row.emergency_contact_phone),
    emergencyContactRelation: text(row.emergency_contact_relation),
    confidentialityLevel: text(row.confidentiality_level) || 'internal',
    archivedAt: dateValue(row.archived_at),
    archiveReason: text(row.archive_reason),
    terminatedAt: dateValue(row.terminated_at),
    terminationReason: text(row.termination_reason),
    rehireEligible: booleanValue(row.rehire_eligible, true),
    version: Math.max(1, numberValue(row.version) || 1),
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at),
  }
}

function scopeMatches(profile: Employee360Profile, actor: Employee360Actor): boolean {
  if (actor.tenantId && profile.tenantId && actor.tenantId !== profile.tenantId) return false
  if (actor.organizationId && profile.organizationId && actor.organizationId !== profile.organizationId) return false
  return true
}

async function readRows(
  table: string,
  employeeId: string,
  limit = 250,
): Promise<{ rows: DbRow[]; error: string | null }> {
  const db = await createServiceClient()
  try {
    const response = await db
      .from(table)
      .select('*')
      .or(`staff_id.eq.${employeeId},employee_id.eq.${employeeId},profile_id.eq.${employeeId}`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (!response.error) {
      return { rows: Array.isArray(response.data) ? response.data : [], error: null }
    }

    const fallback = await db
      .from(table)
      .select('*')
      .eq('staff_id', employeeId)
      .limit(limit)

    if (!fallback.error) {
      return { rows: Array.isArray(fallback.data) ? fallback.data : [], error: null }
    }

    return { rows: [], error: `${response.error.message} | ${fallback.error.message}` }
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Lecture indisponible' }
  }
}

async function readAttendance(employeeId: string): Promise<DomainReadResult> {
  const [records, corrections] = await Promise.all([
    readRows('hr_attendance_records', employeeId),
    readRows('hr_attendance_corrections', employeeId),
  ])

  const rows = [
    ...records.rows.map((row) => normalizeDomainRecord('attendance', 'hr_attendance_records', employeeId, row)),
    ...corrections.rows.map((row) => normalizeDomainRecord('attendance', 'hr_attendance_corrections', employeeId, row)),
  ].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))

  const errors = [records.error, corrections.error].filter(Boolean)
  return {
    rows,
    state: errors.length === 2 ? 'unavailable' : errors.length ? 'degraded' : 'healthy',
    warning: errors.join(' | ') || undefined,
  }
}

async function readDomain(
  domain: Exclude<Employee360DomainKey, 'attendance'>,
  table: string,
  employeeId: string,
): Promise<DomainReadResult> {
  const result = await readRows(table, employeeId)
  return {
    rows: result.rows.map((row) => normalizeDomainRecord(domain, table, employeeId, row)),
    state: result.error ? 'unavailable' : 'healthy',
    warning: result.error || undefined,
  }
}

async function readCommunications(employeeId: string): Promise<DomainReadResult> {
  const db = await createServiceClient()
  try {
    const response = await db
      .from('hr_employee_email_send_jobs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(250)

    if (response.error) {
      return {
        rows: [],
        state: 'unavailable',
        warning: response.error.message,
      }
    }

    return {
      rows: (Array.isArray(response.data) ? response.data : []).map((row) =>
        normalizeDomainRecord('communications', 'hr_employee_email_send_jobs', employeeId, row),
      ),
      state: 'healthy',
    }
  } catch (error) {
    return {
      rows: [],
      state: 'unavailable',
      warning: error instanceof Error ? error.message : 'Historique communication indisponible',
    }
  }
}

async function readTimeline(employeeId: string): Promise<Employee360TimelineEvent[]> {
  const db = await createServiceClient()
  const [audit, lifecycle, cases] = await Promise.all([
    db
      .from('hr_employee_360_audit_events')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(300),
    db
      .from('hr_employee_lifecycle_events')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('hr_employee_cases')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(150),
  ])

  const auditRows = Array.isArray(audit.data) ? audit.data : []
  const lifecycleRows = Array.isArray(lifecycle.data) ? lifecycle.data : []
  const caseRows = Array.isArray(cases.data) ? cases.data : []

  const timeline: Employee360TimelineEvent[] = auditRows.map((row) => ({
    id: String(row.id || ''),
    employeeId,
    eventType: text(row.event_type) || 'audit',
    domain: text(row.domain) || 'employee',
    action: text(row.action) || 'recorded',
    title: text(row.title) || 'Événement RH',
    summary: text(row.summary),
    actorName: text(row.actor_name),
    actorId: text(row.actor_id),
    riskLevel: text(row.risk_level) || 'normal',
    beforeState: objectValue(row.before_state),
    afterState: objectValue(row.after_state),
    metadata: objectValue(row.metadata),
    createdAt: text(row.created_at) || new Date().toISOString(),
  }))

  lifecycleRows.forEach((row) => {
    timeline.push({
      id: `lifecycle-${String(row.id || '')}`,
      employeeId,
      eventType: 'lifecycle_transition',
      domain: 'lifecycle',
      action: 'transition',
      title: `Cycle de vie: ${text(row.from_state) || '—'} → ${text(row.to_state) || '—'}`,
      summary: text(row.reason),
      actorName: text(row.actor_name),
      actorId: text(row.actor_id),
      riskLevel: 'normal',
      beforeState: { state: text(row.from_state) },
      afterState: { state: text(row.to_state) },
      metadata: objectValue(row.metadata),
      createdAt: text(row.created_at) || new Date().toISOString(),
    })
  })

  caseRows.forEach((row) => {
    timeline.push({
      id: `case-${String(row.id || '')}`,
      employeeId,
      eventType: text(row.case_type) || 'employee_case',
      domain: text(row.domain) || 'employee',
      action: 'case_recorded',
      title: text(row.title) || 'Cas RH',
      summary: text(row.description),
      actorName: text(row.owner_name),
      actorId: text(row.created_by),
      riskLevel: text(row.priority) || 'normal',
      beforeState: {},
      afterState: objectValue(row),
      metadata: objectValue(row.metadata),
      createdAt: text(row.created_at) || new Date().toISOString(),
    })
  })

  return timeline.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 400)
}

function calculateSummary(
  profile: Employee360Profile,
  domains: Employee360Aggregate['domains'],
): Employee360Aggregate['summary'] {
  const identityFields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.department,
    profile.position,
    profile.city,
    profile.startDate,
    profile.manager,
    profile.nationalId,
  ]
  const identityCompletion = identityFields.filter(Boolean).length / identityFields.length
  const evidenceDomains = DOMAIN_KEYS.filter((key) => domains[key].length > 0).length
  const evidenceCoverage = Math.round((evidenceDomains / DOMAIN_KEYS.length) * 100)
  const readiness = Math.max(0, Math.min(100, Math.round(identityCompletion * 65 + evidenceCoverage * 0.35)))

  const now = Date.now()
  const records = DOMAIN_KEYS.flatMap((key) => domains[key])
  const openRecords = records.filter((record) => !record.archivedAt && !['completed', 'closed', 'validated', 'approved', 'sent'].includes(record.status.toLowerCase()))
  const overdue = openRecords.filter((record) => {
    if (!record.dueAt) return false
    const due = new Date(record.dueAt).getTime()
    return Number.isFinite(due) && due < now
  })
  const attendanceAnomalies = domains.attendance.filter((record) =>
    ['pending', 'missing', 'late', 'anomaly', 'requested'].some((value) => record.status.toLowerCase().includes(value)),
  ).length
  const documentsAtRisk = domains.documents.filter((record) => {
    if (['rejected', 'expired', 'missing'].includes(record.status.toLowerCase())) return true
    if (!record.dueAt) return false
    const due = new Date(record.dueAt).getTime()
    return Number.isFinite(due) && due < now + 30 * 86400000
  }).length
  const leavePending = domains.leave.filter((record) => record.status.toLowerCase().includes('pending')).length
  const trainingDue = domains.training.filter((record) => !['completed', 'validated'].includes(record.status.toLowerCase())).length
  const performanceDue = domains.performance.filter((record) => !['completed', 'closed', 'validated'].includes(record.status.toLowerCase())).length
  const activeContract = domains.contracts.some((record) => ['active', 'signed', 'valid'].includes(record.status.toLowerCase()))

  const risk = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 - readiness +
          Math.min(20, overdue.length * 4) +
          Math.min(15, attendanceAnomalies * 3) +
          Math.min(15, documentsAtRisk * 3) +
          (activeContract ? 0 : 8),
      ),
    ),
  )

  return {
    readiness,
    risk,
    evidenceCoverage,
    openActions: openRecords.length,
    overdueActions: overdue.length,
    activeContract,
    documentsAtRisk,
    attendanceAnomalies,
    leavePending,
    trainingDue,
    performanceDue,
  }
}

export async function loadEmployee360Aggregate(
  employeeId: string,
  actor: Employee360Actor,
): Promise<Employee360Aggregate> {
  const db = await createServiceClient()
  const profileResponse = await db
    .from('hr_staff_profiles')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle()

  if (profileResponse.error || !profileResponse.data) {
    throw Object.assign(new Error('Dossier collaborateur introuvable dans hr_staff_profiles.'), {
      status: 404,
      code: 'EMPLOYEE_NOT_FOUND',
    })
  }

  const profile = normalizeProfile(profileResponse.data)
  if (!scopeMatches(profile, actor)) {
    throw Object.assign(new Error('Le collaborateur appartient à un autre périmètre organisationnel.'), {
      status: 403,
      code: 'SCOPE_MISMATCH',
    })
  }

  const reads = await Promise.all([
    readAttendance(employeeId),
    readDomain('leave', 'hr_leave_requests', employeeId),
    readDomain('payroll', 'hr_payroll_inputs', employeeId),
    readDomain('planning', 'hr_roster_assignments', employeeId),
    readDomain('documents', 'hr_documents', employeeId),
    readDomain('contracts', 'hr_contracts', employeeId),
    readDomain('onboarding', 'hr_onboarding_journeys', employeeId),
    readDomain('training', 'hr_training_records', employeeId),
    readDomain('performance', 'hr_performance_reviews', employeeId),
    readCommunications(employeeId),
    readDomain('tasks', 'hr_tasks', employeeId),
    readDomain('approvals', 'hr_approval_requests', employeeId),
    readDomain('incidents', 'hr_incidents', employeeId),
  ])

  const domains = {
    attendance: reads[0].rows,
    leave: reads[1].rows,
    payroll: actor.access.viewCompensation ? reads[2].rows : [],
    planning: reads[3].rows,
    documents: reads[4].rows,
    contracts: actor.access.viewCompensation
      ? reads[5].rows
      : reads[5].rows.map((record) => ({ ...record, amount: null, currency: null })),
    onboarding: reads[6].rows,
    training: reads[7].rows,
    performance: reads[8].rows,
    communications: reads[9].rows,
    tasks: reads[10].rows,
    approvals: reads[11].rows,
    incidents: reads[12].rows,
  }

  const healthMap = {} as Employee360Health['domainAuthority']
  DOMAIN_KEYS.forEach((key, index) => {
    healthMap[key] = reads[index].state
  })

  const warnings = reads.map((result) => result.warning).filter((value): value is string => Boolean(value))
  const timeline = await readTimeline(employeeId)

  return {
    profile,
    permissions: actor.access,
    domains,
    timeline,
    summary: calculateSummary(profile, domains),
    health: {
      canonicalEmployee: 'healthy',
      tenantScope: profile.tenantId || profile.organizationId ? 'verified' : 'unresolved',
      auditAuthority: warnings.some((warning) => warning.includes('hr_employee_360_audit_events')) ? 'degraded' : 'healthy',
      domainAuthority: healthMap,
      warnings,
    },
    loadedAt: new Date().toISOString(),
  }
}

export async function readRawEmployee(employeeId: string): Promise<DbRow | null> {
  const db = await createServiceClient()
  const response = await db.from('hr_staff_profiles').select('*').eq('id', employeeId).maybeSingle()
  return response.error || !response.data ? null : response.data
}

export function employeeProfileFromRow(row: DbRow): Employee360Profile {
  return normalizeProfile(row)
}
