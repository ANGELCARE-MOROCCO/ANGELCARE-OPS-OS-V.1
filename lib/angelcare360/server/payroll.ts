import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360PayrollAuditQueryFiltersSchema,
  angelcare360PayrollComplianceReadinessSchema,
  angelcare360PayrollHistoryFiltersSchema,
  angelcare360PayrollItemCancelSchema,
  angelcare360PayrollItemCreateSchema,
  angelcare360PayrollItemUpdateSchema,
  angelcare360PayrollPeriodCreateSchema,
  angelcare360PayrollPeriodStatusChangeSchema,
  angelcare360PayrollPeriodUpdateSchema,
  angelcare360PayrollRecordBlockSchema,
  angelcare360PayrollRecordPaymentStatusSchema,
  angelcare360PayrollRecordPrepareSchema,
  angelcare360PayrollRecordUpdateSchema,
  angelcare360PayrollRecordValidateSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360PayrollAuditFilter,
  Angelcare360PayrollComplianceCheckpointRecord,
  Angelcare360PayrollComplianceReadinessRecord,
  Angelcare360PayrollHistoryFiltersInput,
  Angelcare360PayrollItemCreateInput,
  Angelcare360PayrollItemListRecord,
  Angelcare360PayrollItemRecord,
  Angelcare360PayrollMutationResult,
  Angelcare360PayrollOverviewRecord,
  Angelcare360PayrollPaymentStatus,
  Angelcare360PayrollPeriodListRecord,
  Angelcare360PayrollPeriodRecord,
  Angelcare360PayrollReadinessRecord,
  Angelcare360PayrollRecordListRecord,
  Angelcare360PayrollRecordStatus,
} from '@/types/angelcare360/payroll'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, any>

const PAYROLL_MODULE = 'paie'
const BLOCKED_EXPORT_MESSAGE = 'Le bulletin de paie PDF sera activé dans la phase Rapports & Exports.'
const BLOCKED_BANK_TRANSFER_MESSAGE = 'Le virement bancaire nécessite une intégration bancaire configurée.'
const BLOCKED_COMPLIANCE_MESSAGE = 'Les règles sociales, fiscales et CNSS doivent être validées avant automatisation.'
const BLOCKED_CALCULATION_MESSAGE = 'Le calcul final de la paie sera activé après validation des règles de rémunération de l’établissement.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function asDateOnly(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function asTimestamp(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function baseRecordFields(row: Row) {
  const createdAt = asString(row.created_at || new Date().toISOString())
  const updatedAt = asString(row.updated_at || row.created_at || createdAt)
  return {
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function pickRecord(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Row
}

function parseValidationErrors<T>(result: { success: true; data: T } | { success: false; errors: Array<{ message: string }> }, fallback: string) {
  return result.success ? fallback : result.errors[0]?.message || fallback
}

async function getContextOrNull(schoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  return context?.school ? context : null
}

async function auditPayrollEvent(input: {
  module?: string
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'payroll',
    module: input.module || PAYROLL_MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

async function countRows(client: SupabaseClient, table: string, schoolId?: string | null, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (schoolId) query = query.eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

function toNumber(value: unknown) {
  const parsed = asNumber(value)
  return parsed === null ? 0 : parsed
}

function periodStatusSet() {
  return ['draft', 'planned', 'open', 'calculated', 'validated', 'paid', 'closed', 'cancelled', 'archived'] as const
}

function recordStatusSet() {
  return ['draft', 'pending_review', 'validated', 'payment_pending', 'paid', 'blocked', 'cancelled', 'approved', 'archived'] as const
}

function paymentStatusSet() {
  return ['not_ready', 'pending', 'confirmed', 'blocked', 'cancelled', 'partial', 'paid', 'failed'] as const
}

function itemTypeSet() {
  return ['base_salary', 'bonus', 'deduction', 'advance', 'adjustment', 'reimbursement', 'other', 'earning', 'allowance'] as const
}

function isValidRecordStatus(status: string) {
  return recordStatusSet().includes(status as never)
}

function isValidPeriodStatus(status: string) {
  return periodStatusSet().includes(status as never)
}

function isOpenPeriod(status: string) {
  return ['draft', 'planned', 'open', 'calculated', 'validated'].includes(status)
}

function computePayrollTotals(baseSalary: number, items: Row[]) {
  let gross = baseSalary
  let bonuses = 0
  let deductions = 0
  let advances = 0
  let reimbursements = 0

  for (const item of items) {
    const amount = toNumber(item.amount)
    const itemType = String(item.item_type || '')
    if (itemType === 'deduction') {
      deductions += Math.abs(amount)
      continue
    }
    if (itemType === 'advance') {
      advances += Math.abs(amount)
      continue
    }
    if (itemType === 'adjustment') {
      if (amount >= 0) {
        gross += amount
      } else {
        deductions += Math.abs(amount)
      }
      continue
    }
    if (itemType === 'bonus' || itemType === 'base_salary' || itemType === 'earning' || itemType === 'allowance' || itemType === 'other') {
      bonuses += amount
      gross += amount
      continue
    }
    if (itemType === 'reimbursement') {
      reimbursements += amount
      gross += amount
    }
  }

  const net = gross - deductions - advances
  return {
    gross,
    bonuses,
    deductions,
    advances,
    reimbursements,
    net,
  }
}

function toPayrollPeriodListRecord(row: Row, counters: Map<string, Row[]>, academicYearLabel?: string | null): Angelcare360PayrollPeriodListRecord {
  const records = counters.get(String(row.id)) || []
  const validated = records.filter((record) => isValidRecordStatus(String(record.status)) && ['validated', 'paid', 'approved'].includes(String(record.status))).length
  const paid = records.filter((record) => String(record.status) === 'paid' || String(record.payment_status) === 'confirmed' || String(record.payment_status) === 'paid').length
  const grossTotal = records.reduce((total, record) => total + toNumber(record.gross_amount), 0)
  const netTotal = records.reduce((total, record) => total + toNumber(record.net_amount), 0)
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    period_code: asString(row.period_code),
    label: asString(row.label),
    starts_on: asString(row.starts_on),
    ends_on: asString(row.ends_on),
    payment_date: row.payment_date ? asString(row.payment_date) : null,
    status: asString(row.status),
    validated_at: row.validated_at ? asString(row.validated_at) : null,
    validated_by: row.validated_by ? asString(row.validated_by) : null,
    closed_at: row.closed_at ? asString(row.closed_at) : null,
    blocked_reason: row.blocked_reason ? asString(row.blocked_reason) : null,
    idempotency_key: row.idempotency_key ? asString(row.idempotency_key) : null,
    academic_year_label: academicYearLabel || null,
    payroll_record_count: records.length,
    validated_record_count: validated,
    paid_record_count: paid,
    gross_total: grossTotal,
    net_total: netTotal,
    detail_href: `/angelcare-360-command-center/paie/periodes/${row.id}`,
  }
}

function toPayrollRecordListRecord(row: Row, itemRows: Row[], staffMap: Map<string, Row>, periodMap: Map<string, Row>, yearMap: Map<string, Row>): Angelcare360PayrollRecordListRecord {
  const staff = pickRecord(staffMap.get(String(row.staff_id)))
  const period = pickRecord(periodMap.get(String(row.payroll_period_id)))
  const academicYear = pickRecord(yearMap.get(String(period.academic_year_id || row.academic_year_id || '')))
  const totals = computePayrollTotals(toNumber(row.base_salary), itemRows)
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    payroll_period_id: asString(row.payroll_period_id),
    staff_id: asString(row.staff_id),
    payroll_number: asString(row.payroll_number),
    base_salary: toNumber(row.base_salary),
    gross_amount: toNumber(row.gross_amount || totals.gross),
    deductions_total: toNumber(row.deductions_total || totals.deductions),
    bonuses_total: toNumber(row.bonuses_total || totals.bonuses),
    net_amount: toNumber(row.net_amount || totals.net),
    payment_status: asString(row.payment_status),
    paid_at: row.paid_at ? asString(row.paid_at) : null,
    payment_date: row.payment_date ? asString(row.payment_date) : null,
    payment_method: row.payment_method ? asString(row.payment_method) : null,
    payment_reference: row.payment_reference ? asString(row.payment_reference) : null,
    validated_at: row.validated_at ? asString(row.validated_at) : null,
    validated_by: row.validated_by ? asString(row.validated_by) : null,
    blocked_reason: row.blocked_reason ? asString(row.blocked_reason) : null,
    status: asString(row.status),
    idempotency_key: row.idempotency_key ? asString(row.idempotency_key) : null,
    staff_full_name: staff.full_name ? asString(staff.full_name) : null,
    staff_code: staff.staff_code ? asString(staff.staff_code) : null,
    staff_type: staff.staff_type ? asString(staff.staff_type) : null,
    department: staff.department ? asString(staff.department) : null,
    period_label: period.label ? asString(period.label) : null,
    period_code: period.period_code ? asString(period.period_code) : null,
    academic_year_label: academicYear.label ? asString(academicYear.label) : null,
    contract_salary_amount: row.contract_salary_amount ? toNumber(row.contract_salary_amount) : null,
    contract_currency: row.contract_currency ? asString(row.contract_currency) : null,
    item_count: itemRows.length,
    bonus_total: totals.bonuses,
    deduction_total: totals.deductions,
    advance_total: totals.advances,
    reimbursement_total: totals.reimbursements,
    detail_href: `/angelcare-360-command-center/paie/dossiers/${row.id}`,
  }
}

function toPayrollItemListRecord(row: Row, recordMap: Map<string, Row>, staffMap: Map<string, Row>, periodMap: Map<string, Row>): Angelcare360PayrollItemListRecord {
  const payrollRecord = pickRecord(recordMap.get(String(row.payroll_record_id)))
  const staff = pickRecord(staffMap.get(String(payrollRecord.staff_id || row.staff_id || '')))
  const period = pickRecord(periodMap.get(String(payrollRecord.payroll_period_id || row.payroll_period_id || '')))
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    payroll_record_id: asString(row.payroll_record_id),
    item_code: asString(row.item_code),
    item_type: asString(row.item_type),
    label: asString(row.label),
    amount: toNumber(row.amount),
    notes: row.notes ? asString(row.notes) : null,
    status: asString(row.status),
    idempotency_key: row.idempotency_key ? asString(row.idempotency_key) : null,
    payroll_number: payrollRecord.payroll_number ? asString(payrollRecord.payroll_number) : null,
    staff_full_name: staff.full_name ? asString(staff.full_name) : null,
    staff_code: staff.staff_code ? asString(staff.staff_code) : null,
    staff_type: staff.staff_type ? asString(staff.staff_type) : null,
    period_label: period.label ? asString(period.label) : null,
    period_code: period.period_code ? asString(period.period_code) : null,
    detail_href: `/angelcare-360-command-center/paie/dossiers/${row.payroll_record_id}`,
  }
}

async function getActivePeriodId(client: SupabaseClient, schoolId: string) {
  const { data } = await client
    .from('angelcare360_payroll_periods')
    .select('id')
    .eq('school_id', schoolId)
    .in('status', ['open', 'planned', 'validated'])
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ? String((data as Row).id) : null
}

async function getCurrentStaffContract(client: SupabaseClient, schoolId: string, staffId: string) {
  const { data } = await client
    .from('angelcare360_staff_contracts')
    .select('id, salary_amount, currency, status')
    .eq('school_id', schoolId)
    .eq('staff_id', staffId)
    .eq('status', 'active')
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as Row | null) ?? null
}

async function loadPayrollReferenceMaps(client: SupabaseClient, schoolId: string, recordRows: Row[]) {
  const staffIds = Array.from(new Set(recordRows.map((row) => String(row.staff_id)).filter(Boolean)))
  const periodIds = Array.from(new Set(recordRows.map((row) => String(row.payroll_period_id)).filter(Boolean)))
  const academicYearIds = Array.from(new Set(recordRows.map((row) => String(row.academic_year_id)).filter(Boolean)))

  const [staffResponse, periodsResponse, yearsResponse, itemsResponse] = await Promise.all([
    staffIds.length
      ? client.from('angelcare360_staff').select('id, full_name, staff_code, staff_type, department').eq('school_id', schoolId).in('id', staffIds)
      : Promise.resolve({ data: [] as Row[] }),
    periodIds.length
      ? client.from('angelcare360_payroll_periods').select('id, academic_year_id, period_code, label, starts_on, ends_on, status').eq('school_id', schoolId).in('id', periodIds)
      : Promise.resolve({ data: [] as Row[] }),
    academicYearIds.length
      ? client.from('angelcare360_academic_years').select('id, label, year_code').eq('school_id', schoolId).in('id', academicYearIds)
      : Promise.resolve({ data: [] as Row[] }),
    recordRows.length
      ? client.from('angelcare360_payroll_items').select('id, school_id, payroll_record_id, item_code, item_type, label, amount, notes, status, idempotency_key, created_at, updated_at').eq('school_id', schoolId).in('payroll_record_id', recordRows.map((row) => String(row.id)))
      : Promise.resolve({ data: [] as Row[] }),
  ])

  const staffMap = new Map<string, Row>((staffResponse.data || []).map((row) => [String((row as Row).id), row as Row]))
  const periodMap = new Map<string, Row>((periodsResponse.data || []).map((row) => [String((row as Row).id), row as Row]))
  const yearMap = new Map<string, Row>((yearsResponse.data || []).map((row) => [String((row as Row).id), row as Row]))
  const itemsByRecord = new Map<string, Row[]>()

  for (const item of (itemsResponse.data || []) as Row[]) {
    const current = itemsByRecord.get(String(item.payroll_record_id)) || []
    current.push(item)
    itemsByRecord.set(String(item.payroll_record_id), current)
  }

  return { staffMap, periodMap, yearMap, itemsByRecord }
}

async function loadPayrollPeriodReferenceMaps(client: SupabaseClient, schoolId: string, periodRows: Row[]) {
  const academicYearIds = Array.from(new Set(periodRows.map((row) => String(row.academic_year_id)).filter(Boolean)))
  const [yearsResponse, recordsResponse] = await Promise.all([
    academicYearIds.length
      ? client.from('angelcare360_academic_years').select('id, label, year_code').eq('school_id', schoolId).in('id', academicYearIds)
      : Promise.resolve({ data: [] as Row[] }),
    periodRows.length
      ? client.from('angelcare360_payroll_records').select('id, school_id, payroll_period_id, staff_id, payroll_number, base_salary, gross_amount, deductions_total, bonuses_total, net_amount, payment_status, paid_at, payment_date, payment_method, payment_reference, validated_at, validated_by, blocked_reason, status, idempotency_key').eq('school_id', schoolId).in('payroll_period_id', periodRows.map((row) => String(row.id)))
      : Promise.resolve({ data: [] as Row[] }),
  ])
  const yearMap = new Map<string, Row>((yearsResponse.data || []).map((row) => [String((row as Row).id), row as Row]))
  const recordsByPeriod = new Map<string, Row[]>()
  for (const record of (recordsResponse.data || []) as Row[]) {
    const current = recordsByPeriod.get(String(record.payroll_period_id)) || []
    current.push(record)
    recordsByPeriod.set(String(record.payroll_period_id), current)
  }
  return { yearMap, recordsByPeriod }
}

export async function listAngelcare360PayrollPeriods(options?: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  let query = client
    .from('angelcare360_payroll_periods')
    .select('id, school_id, academic_year_id, period_code, label, starts_on, ends_on, payment_date, status, validated_at, validated_by, closed_at, blocked_reason, idempotency_key, created_at, updated_at')
    .eq('school_id', context.school.id)
    .order('starts_on', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) {
    const term = options.search.trim()
    if (term) query = query.or(`period_code.ilike.%${term}%,label.ilike.%${term}%`)
  }

  const { data } = await query
  const rows = (data || []) as Row[]
  const { yearMap, recordsByPeriod } = await loadPayrollPeriodReferenceMaps(client, context.school.id, rows)
  return rows.map((row) => toPayrollPeriodListRecord(row, recordsByPeriod, yearMap.get(String(row.academic_year_id))?.label ? String(yearMap.get(String(row.academic_year_id))?.label) : null))
}

export async function getAngelcare360PayrollPeriodById(periodId: string) {
  const context = await getContextOrNull()
  if (!context?.school) return null
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_payroll_periods')
    .select('id, school_id, academic_year_id, period_code, label, starts_on, ends_on, payment_date, status, validated_at, validated_by, closed_at, blocked_reason, idempotency_key, created_at, updated_at')
    .eq('school_id', context.school.id)
    .eq('id', periodId)
    .maybeSingle()

  if (!data) return null
  const period = data as Row
  const related = await listAngelcare360PayrollRecords({ schoolId: context.school.id, payrollPeriodId: periodId })
  const { yearMap, recordsByPeriod } = await loadPayrollPeriodReferenceMaps(client, context.school.id, [period])
  const academicYear = yearMap.get(String(period.academic_year_id)) || null
  return {
    ...toPayrollPeriodListRecord(period, recordsByPeriod, academicYear ? String(academicYear.label || null) || null : null),
    records: related,
  }
}

export async function createAngelcare360PayrollPeriod(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollPeriodCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload période de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  if (parsed.data.idempotencyKey) {
    const { data: existingByKey } = await client
      .from('angelcare360_payroll_periods')
      .select('id')
      .eq('school_id', context.school!.id)
      .eq('idempotency_key', parsed.data.idempotencyKey)
      .maybeSingle()
    if (existingByKey) return { ok: true, idempotent: true, record: { id: String((existingByKey as Row).id) } }
  }
  const { data: existingByCode } = await client
    .from('angelcare360_payroll_periods')
    .select('id, label, starts_on, ends_on, status')
    .eq('school_id', context.school!.id)
    .eq('period_code', parsed.data.periodCode)
    .maybeSingle()
  if (existingByCode) {
    const existing = existingByCode as Row
    const same = asString(existing.label) === parsed.data.label && asString(existing.starts_on) === parsed.data.startsOn && asString(existing.ends_on) === parsed.data.endsOn
    if (same) return { ok: true, idempotent: true, record: { id: String(existing.id) } }
    return { ok: false, error: 'Une période de paie portant ce code existe déjà.' }
  }
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    period_code: parsed.data.periodCode,
    label: parsed.data.label,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
    payment_date: parsed.data.paymentDate || null,
    status: parsed.data.status || 'planned',
    idempotency_key: parsed.data.idempotencyKey || null,
    metadata_json: { source: 'phase9' },
  }
  const { data, error } = await client.from('angelcare360_payroll_periods').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_period.created',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'payroll_period',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360PayrollPeriod(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollPeriodUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload période de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_periods').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La période de paie est introuvable.' }
  const payload = {
    academic_year_id: parsed.data.academicYearId,
    period_code: parsed.data.periodCode,
    label: parsed.data.label,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
    payment_date: parsed.data.paymentDate || null,
    status: parsed.data.status || before.data.status,
    blocked_reason: parsed.data.blockedReason || before.data.blocked_reason || null,
    idempotency_key: parsed.data.idempotencyKey || before.data.idempotency_key || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_periods').update(payload).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_period.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'payroll_period',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function changeAngelcare360PayrollPeriodStatus(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollPeriodStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Le changement de statut de la période de paie est invalide.') }
  const context = await requireAngelcare360Permission('paie.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_periods').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La période de paie est introuvable.' }
  const currentStatus = String((before.data as Row).status)
  if (['closed', 'paid', 'cancelled', 'archived'].includes(currentStatus) && parsed.data.status === 'open') {
    return { ok: false, locked: true, reason: 'Une période clôturée ne peut pas être rouverte sans workflow explicite.' }
  }
  const openStatus = parsed.data.status === 'open'
  if (openStatus) {
    const { count } = await client.from('angelcare360_payroll_periods').select('id', { count: 'exact', head: true }).eq('school_id', context.school!.id).eq('status', 'open').neq('id', parsed.data.id)
    if ((count || 0) > 0) {
      return { ok: false, locked: true, reason: 'Une seule période de paie peut rester ouverte pour un établissement.' }
    }
  }
  const payload = {
    status: parsed.data.status,
    validated_at: parsed.data.status === 'validated' ? new Date().toISOString() : before.data.validated_at || null,
    closed_at: parsed.data.status === 'closed' ? new Date().toISOString() : before.data.closed_at || null,
    blocked_reason: parsed.data.reason || before.data.blocked_reason || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_periods').update(payload).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  const action = parsed.data.status === 'open' ? 'payroll_period.opened' : parsed.data.status === 'closed' ? 'payroll_period.closed' : parsed.data.status === 'cancelled' ? 'payroll_period.cancelled' : 'payroll_period.updated'
  await auditPayrollEvent({
    action,
    severity: parsed.data.status === 'cancelled' ? 'warning' : 'info',
    schoolId: context.school!.id,
    entityType: 'payroll_period',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360PayrollRecords(options?: { schoolId?: string | null; payrollPeriodId?: string | null; staffId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  let query = client
    .from('angelcare360_payroll_records')
    .select('id, school_id, payroll_period_id, staff_id, payroll_number, base_salary, gross_amount, deductions_total, bonuses_total, net_amount, payment_status, paid_at, payment_date, payment_method, payment_reference, validated_at, validated_by, blocked_reason, status, idempotency_key, created_at, updated_at')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })

  if (options?.payrollPeriodId) query = query.eq('payroll_period_id', options.payrollPeriodId)
  if (options?.staffId) query = query.eq('staff_id', options.staffId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) {
    const term = options.search.trim()
    if (term) query = query.or(`payroll_number.ilike.%${term}%,blocked_reason.ilike.%${term}%`)
  }

  const { data } = await query.limit(500)
  const rows = (data || []) as Row[]
  const { staffMap, periodMap, yearMap, itemsByRecord } = await loadPayrollReferenceMaps(client, context.school.id, rows)
  return rows.map((row) => toPayrollRecordListRecord(row, itemsByRecord.get(String(row.id)) || [], staffMap, periodMap, yearMap))
}

export async function getAngelcare360PayrollRecordById(recordId: string) {
  const context = await getContextOrNull()
  if (!context?.school) return null
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_payroll_records')
    .select('id, school_id, payroll_period_id, staff_id, payroll_number, base_salary, gross_amount, deductions_total, bonuses_total, net_amount, payment_status, paid_at, payment_date, payment_method, payment_reference, validated_at, validated_by, blocked_reason, status, idempotency_key, created_at, updated_at')
    .eq('school_id', context.school.id)
    .eq('id', recordId)
    .maybeSingle()
  if (!data) return null
  const record = data as Row
  const items = await listAngelcare360PayrollItems({ schoolId: context.school.id, payrollRecordId: recordId })
  const { staffMap, periodMap, yearMap, itemsByRecord } = await loadPayrollReferenceMaps(client, context.school.id, [record])
  return {
    ...toPayrollRecordListRecord(record, itemsByRecord.get(String(record.id)) || [], staffMap, periodMap, yearMap),
    items,
  }
}

export async function prepareAngelcare360PayrollRecord(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollRecordPrepareSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload dossier de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.create', { schoolId: parsed.data.schoolId })
  const schoolId = context.school!.id
  const client = await createClient()
  if (parsed.data.idempotencyKey) {
    const { data: existingByKey } = await client
      .from('angelcare360_payroll_records')
      .select('id')
      .eq('school_id', schoolId)
      .eq('idempotency_key', parsed.data.idempotencyKey)
      .maybeSingle()
    if (existingByKey) return { ok: true, idempotent: true, record: { id: String((existingByKey as Row).id) } }
  }
  const { data: existing } = await client
    .from('angelcare360_payroll_records')
    .select('id, payroll_number, base_salary, status')
    .eq('school_id', schoolId)
    .eq('payroll_period_id', parsed.data.payrollPeriodId)
    .eq('staff_id', parsed.data.staffId)
    .maybeSingle()
  if (existing) {
    return { ok: true, idempotent: true, record: { id: String((existing as Row).id) } }
  }
  const contract = await getCurrentStaffContract(client, schoolId, parsed.data.staffId)
  const baseSalary = parsed.data.baseSalary ?? (toNumber(contract?.salary_amount) || 0)
  const payrollNumber = parsed.data.payrollNumber || buildCode('PAYR')
  const payload = {
    school_id: schoolId,
    payroll_period_id: parsed.data.payrollPeriodId,
    staff_id: parsed.data.staffId,
    payroll_number: payrollNumber,
    base_salary: baseSalary,
    gross_amount: baseSalary,
    deductions_total: 0,
    bonuses_total: 0,
    net_amount: baseSalary,
    payment_status: parsed.data.paymentStatus || (baseSalary > 0 ? 'pending' : 'not_ready'),
    status: parsed.data.status || 'draft',
    idempotency_key: parsed.data.idempotencyKey || null,
    metadata_json: { source: 'phase9', contract_id: contract?.id || null },
  }
  const { data, error } = await client.from('angelcare360_payroll_records').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_record.prepared',
    severity: 'info',
    schoolId,
    entityType: 'payroll_record',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function createAngelcare360PayrollRecord(input: Record<string, unknown>) {
  return prepareAngelcare360PayrollRecord(input)
}

export async function updateAngelcare360PayrollRecord(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollRecordUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload dossier de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.update', { schoolId: parsed.data.schoolId })
  const schoolId = context.school!.id
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_records').select('*').eq('school_id', schoolId).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le dossier de paie est introuvable.' }
  const items = await listAngelcare360PayrollItems({ schoolId, payrollRecordId: parsed.data.id })
  const baseSalary = parsed.data.baseSalary ?? toNumber((before.data as Row).base_salary)
  const totals = computePayrollTotals(baseSalary, items as Row[])
  const payload = {
    payroll_number: parsed.data.payrollNumber || before.data.payroll_number,
    base_salary: baseSalary,
    gross_amount: parsed.data.grossAmount ?? totals.gross,
    deductions_total: parsed.data.deductionsTotal ?? totals.deductions,
    bonuses_total: parsed.data.bonusesTotal ?? totals.bonuses,
    net_amount: parsed.data.netAmount ?? totals.net,
    payment_status: parsed.data.paymentStatus || before.data.payment_status,
    status: parsed.data.status || before.data.status,
    blocked_reason: parsed.data.blockedReason || before.data.blocked_reason || null,
    idempotency_key: parsed.data.idempotencyKey || before.data.idempotency_key || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_records').update(payload).eq('school_id', schoolId).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_record.updated',
    severity: 'info',
    schoolId,
    entityType: 'payroll_record',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function validateAngelcare360PayrollRecord(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollRecordValidateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de validation de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.approve', { schoolId: parsed.data.schoolId })
  const schoolId = context.school!.id
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_records').select('*').eq('school_id', schoolId).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le dossier de paie est introuvable.' }
  const readiness = await calculateAngelcare360PayrollReadiness({ schoolId, payrollPeriodId: String((before.data as Row).payroll_period_id), staffId: String((before.data as Row).staff_id) })
  if (!readiness.canCalculate) {
    return { ok: false, locked: true, reason: readiness.reason || BLOCKED_CALCULATION_MESSAGE }
  }
  const totals = await calculateAngelcare360PayrollTotals(schoolId, String((before.data as Row).id))
  const payload = {
    gross_amount: totals.gross,
    deductions_total: totals.deductions,
    bonuses_total: totals.bonuses,
    net_amount: totals.net,
    status: 'validated',
    payment_status: 'pending',
    validated_at: new Date().toISOString(),
    validated_by: context.user.id,
    blocked_reason: null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_records').update(payload).eq('school_id', schoolId).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_record.validated',
    severity: 'info',
    schoolId,
    entityType: 'payroll_record',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function blockAngelcare360PayrollRecord(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollRecordBlockSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Le blocage du dossier de paie est invalide.') }
  const context = await requireAngelcare360Permission('paie.approve', { schoolId: parsed.data.schoolId })
  const schoolId = context.school!.id
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_records').select('*').eq('school_id', schoolId).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le dossier de paie est introuvable.' }
  const payload = {
    status: 'blocked',
    payment_status: 'blocked',
    blocked_reason: parsed.data.reason,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_records').update(payload).eq('school_id', schoolId).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_record.blocked',
    severity: 'warning',
    schoolId,
    entityType: 'payroll_record',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function markAngelcare360PayrollRecordPaid(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollRecordPaymentStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Le statut de paiement de la paie est invalide.') }
  const context = await requireAngelcare360Permission('paie.approve', { schoolId: parsed.data.schoolId })
  const schoolId = context.school!.id
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_records').select('*').eq('school_id', schoolId).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le dossier de paie est introuvable.' }
  const payload = {
    payment_status: parsed.data.status,
    status: parsed.data.status === 'blocked' ? 'blocked' : 'paid',
    paid_at: parsed.data.paymentDate || new Date().toISOString(),
    payment_date: parsed.data.paymentDate || asDateOnly(new Date().toISOString()),
    payment_method: parsed.data.paymentMethod || before.data.payment_method || null,
    payment_reference: parsed.data.paymentReference || before.data.payment_reference || null,
    blocked_reason: parsed.data.status === 'blocked' ? parsed.data.reason || before.data.blocked_reason || null : before.data.blocked_reason || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_records').update(payload).eq('school_id', schoolId).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditPayrollEvent({
    action: 'payroll_payment.confirmed',
    severity: 'info',
    schoolId,
    entityType: 'payroll_record',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360PayrollItems(options?: { schoolId?: string | null; payrollRecordId?: string | null; itemType?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  let query = client
    .from('angelcare360_payroll_items')
    .select('id, school_id, payroll_record_id, item_code, item_type, label, amount, notes, status, idempotency_key, created_at, updated_at')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })

  if (options?.payrollRecordId) query = query.eq('payroll_record_id', options.payrollRecordId)
  if (options?.itemType) query = query.eq('item_type', options.itemType)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) {
    const term = options.search.trim()
    if (term) query = query.or(`item_code.ilike.%${term}%,label.ilike.%${term}%,notes.ilike.%${term}%`)
  }

  const { data } = await query.limit(500)
  const rows = (data || []) as Row[]
  const recordIds = Array.from(new Set(rows.map((row) => String(row.payroll_record_id)).filter(Boolean)))
  const [recordsResponse, staffResponse, periodsResponse] = await Promise.all([
    recordIds.length ? client.from('angelcare360_payroll_records').select('id, payroll_number, payroll_period_id, staff_id').eq('school_id', context.school.id).in('id', recordIds) : Promise.resolve({ data: [] as Row[] }),
    recordIds.length
      ? client
          .from('angelcare360_payroll_records')
          .select('id, staff_id, payroll_period_id, payroll_number')
          .eq('school_id', context.school.id)
          .in('id', recordIds)
      : Promise.resolve({ data: [] as Row[] }),
    recordIds.length
      ? client
          .from('angelcare360_payroll_records')
          .select('id, payroll_period_id')
          .eq('school_id', context.school.id)
          .in('id', recordIds)
      : Promise.resolve({ data: [] as Row[] }),
  ])
  const recordMap = new Map<string, Row>((recordsResponse.data || []).map((row) => [String((row as Row).id), row as Row]))
  const staffIds = Array.from(new Set(((staffResponse.data || []) as Row[]).map((row) => String(row.staff_id)).filter(Boolean)))
  const periodIds = Array.from(new Set(((periodsResponse.data || []) as Row[]).map((row) => String(row.payroll_period_id)).filter(Boolean)))
  const [staffLookup, periodLookup] = await Promise.all([
    staffIds.length ? client.from('angelcare360_staff').select('id, full_name, staff_code, staff_type').eq('school_id', context.school.id).in('id', staffIds) : Promise.resolve({ data: [] as Row[] }),
    periodIds.length ? client.from('angelcare360_payroll_periods').select('id, label, period_code').eq('school_id', context.school.id).in('id', periodIds) : Promise.resolve({ data: [] as Row[] }),
  ])
  const staffMap = new Map<string, Row>((staffLookup.data || []).map((row) => [String((row as Row).id), row as Row]))
  const periodMap = new Map<string, Row>((periodLookup.data || []).map((row) => [String((row as Row).id), row as Row]))
  return rows.map((row) => toPayrollItemListRecord(row, recordMap, staffMap, periodMap))
}

export async function createAngelcare360PayrollItem(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollItemCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload élément de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const parent = await client.from('angelcare360_payroll_records').select('id, payroll_number, payroll_period_id, staff_id, base_salary, gross_amount, deductions_total, bonuses_total, net_amount, status').eq('school_id', context.school!.id).eq('id', parsed.data.payrollRecordId).maybeSingle()
  if (!parent.data) return { ok: false, error: 'Le dossier de paie est introuvable.' }
  if (parsed.data.idempotencyKey) {
    const { data: existing } = await client.from('angelcare360_payroll_items').select('id').eq('school_id', context.school!.id).eq('idempotency_key', parsed.data.idempotencyKey).maybeSingle()
    if (existing) return { ok: true, idempotent: true, record: { id: String((existing as Row).id) } }
  }
  const itemCode = parsed.data.itemCode || buildCode('ITEM')
  const payload = {
    school_id: context.school!.id,
    payroll_record_id: parsed.data.payrollRecordId,
    item_code: itemCode,
    item_type: parsed.data.itemType,
    label: parsed.data.label,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
    status: parsed.data.status || 'active',
    idempotency_key: parsed.data.idempotencyKey || null,
    metadata_json: { source: 'phase9' },
  }
  const { data, error } = await client.from('angelcare360_payroll_items').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  const recalc = await calculateAngelcare360PayrollTotals(context.school!.id, parsed.data.payrollRecordId)
  await client.from('angelcare360_payroll_records').update({
    gross_amount: recalc.gross,
    deductions_total: recalc.deductions,
    bonuses_total: recalc.bonuses,
    net_amount: recalc.net,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.payrollRecordId)
  const actionMap: Record<string, string> = {
    bonus: 'payroll_bonus.created',
    deduction: 'payroll_deduction.created',
    advance: 'payroll_advance.created',
    adjustment: 'payroll_adjustment.created',
    reimbursement: 'payroll_reimbursement.created',
    base_salary: 'payroll_item.created',
    earning: 'payroll_item.created',
    allowance: 'payroll_item.created',
    other: 'payroll_item.created',
  }
  await auditPayrollEvent({
    action: actionMap[parsed.data.itemType] || 'payroll_item.created',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'payroll_item',
    entityId: String(data.id),
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360PayrollItem(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollItemUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload élément de paie invalide.') }
  const context = await requireAngelcare360Permission('paie.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_items').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’élément de paie est introuvable.' }
  const payload = {
    payroll_record_id: parsed.data.payrollRecordId,
    item_code: parsed.data.itemCode || before.data.item_code,
    item_type: parsed.data.itemType,
    label: parsed.data.label,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
    status: parsed.data.status || before.data.status,
    idempotency_key: parsed.data.idempotencyKey || before.data.idempotency_key || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client.from('angelcare360_payroll_items').update(payload).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  const recalc = await calculateAngelcare360PayrollTotals(context.school!.id, parsed.data.payrollRecordId)
  await client.from('angelcare360_payroll_records').update({
    gross_amount: recalc.gross,
    deductions_total: recalc.deductions,
    bonuses_total: recalc.bonuses,
    net_amount: recalc.net,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.payrollRecordId)
  await auditPayrollEvent({
    action: 'payroll_item.updated',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'payroll_item',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: payload as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function cancelAngelcare360PayrollItem(input: Record<string, unknown>): Promise<Angelcare360PayrollMutationResult<{ id: string }>> {
  const parsed = angelcare360PayrollItemCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'L’annulation de l’élément de paie est invalide.') }
  const context = await requireAngelcare360Permission('paie.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payroll_items').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’élément de paie est introuvable.' }
  const { data, error } = await client.from('angelcare360_payroll_items').update({
    status: 'archived',
    notes: `${before.data.notes || ''}${before.data.notes ? ' · ' : ''}${parsed.data.reason}`,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  const recalc = await calculateAngelcare360PayrollTotals(context.school!.id, String(before.data.payroll_record_id))
  await client.from('angelcare360_payroll_records').update({
    gross_amount: recalc.gross,
    deductions_total: recalc.deductions,
    bonuses_total: recalc.bonuses,
    net_amount: recalc.net,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', before.data.payroll_record_id)
  await auditPayrollEvent({
    action: 'payroll_item.cancelled',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'payroll_item',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { ...before.data, status: 'archived', reason: parsed.data.reason } as Record<string, unknown>,
  })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360PayrollBonuses(options?: { schoolId?: string | null; payrollRecordId?: string | null; search?: string | null }) {
  return listAngelcare360PayrollItems({ ...options, itemType: 'bonus' })
}

export async function listAngelcare360PayrollDeductions(options?: { schoolId?: string | null; payrollRecordId?: string | null; search?: string | null }) {
  return listAngelcare360PayrollItems({ ...options, itemType: 'deduction' })
}

export async function listAngelcare360PayrollAdvances(options?: { schoolId?: string | null; payrollRecordId?: string | null; search?: string | null }) {
  return listAngelcare360PayrollItems({ ...options, itemType: 'advance' })
}

export async function listAngelcare360PayrollAdjustments(options?: { schoolId?: string | null; payrollRecordId?: string | null; search?: string | null }) {
  return listAngelcare360PayrollItems({ ...options, itemType: 'adjustment' })
}

export async function listAngelcare360PayrollReimbursements(options?: { schoolId?: string | null; payrollRecordId?: string | null; search?: string | null }) {
  return listAngelcare360PayrollItems({ ...options, itemType: 'reimbursement' })
}

export async function calculateAngelcare360PayrollTotals(schoolId: string, payrollRecordId: string) {
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_payroll_items')
    .select('id, item_type, amount, status')
    .eq('school_id', schoolId)
    .eq('payroll_record_id', payrollRecordId)
    .eq('status', 'active')
  const items = (data || []) as Row[]
  const { data: record } = await client
    .from('angelcare360_payroll_records')
    .select('base_salary')
    .eq('school_id', schoolId)
    .eq('id', payrollRecordId)
    .maybeSingle()
  const baseSalary = toNumber((record as Row | null)?.base_salary)
  return computePayrollTotals(baseSalary, items)
}

export async function listAngelcare360PayrollPeriodsForReadiness(options?: { schoolId?: string | null; payrollPeriodId?: string | null; staffId?: string | null }) {
  const readiness = await calculateAngelcare360PayrollReadiness(options || {})
  return readiness
}

export async function calculateAngelcare360PayrollReadiness(options: { schoolId?: string | null; payrollPeriodId?: string | null; staffId?: string | null }) {
  const context = await getContextOrNull(options.schoolId)
  if (!context?.school) {
    return {
      schoolId: options.schoolId || '',
      academicYearId: null,
      payrollPeriodId: options.payrollPeriodId || null,
      staffId: options.staffId || null,
      payrollRecordCount: 0,
      payrollItemCount: 0,
      baseSalaryReady: false,
      formulaReady: false,
      periodSelected: Boolean(options.payrollPeriodId),
      staffSelected: Boolean(options.staffId),
      canCalculate: false,
      reason: 'Aucun établissement actif n’est disponible.',
    } satisfies Angelcare360PayrollReadinessRecord
  }
  const client = await createClient()
  const [recordCount, itemCount, activePeriod, staffRecord] = await Promise.all([
    countRows(client, 'angelcare360_payroll_records', context.school.id, [
      options.payrollPeriodId ? ['payroll_period_id', 'eq', options.payrollPeriodId] : null,
      options.staffId ? ['staff_id', 'eq', options.staffId] : null,
    ].filter(Boolean) as Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>),
    countRows(client, 'angelcare360_payroll_items', context.school.id, [
      options.payrollPeriodId ? ['payroll_record_id', 'in', (await listAngelcare360PayrollRecords({ schoolId: context.school.id, payrollPeriodId: options.payrollPeriodId })).map((row) => row.id)] : null,
    ].filter(Boolean) as Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>),
    options.payrollPeriodId
      ? client.from('angelcare360_payroll_periods').select('id, academic_year_id').eq('school_id', context.school.id).eq('id', options.payrollPeriodId).maybeSingle()
      : Promise.resolve({ data: null }),
    options.staffId ? client.from('angelcare360_staff').select('id').eq('school_id', context.school.id).eq('id', options.staffId).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const activePeriodId = options.payrollPeriodId || (await getActivePeriodId(client, context.school.id))
  const baseSalaryReady = Boolean(recordCount > 0 || staffRecord?.data)
  const formulaReady = recordCount > 0 && itemCount > 0 && baseSalaryReady
  const periodSelected = Boolean(activePeriodId)
  const staffSelected = Boolean(options.staffId)
  const canCalculate = Boolean(periodSelected && staffSelected && formulaReady)
  const reason = canCalculate ? null : BLOCKED_CALCULATION_MESSAGE
  return {
    schoolId: context.school.id,
    academicYearId: activePeriod?.data ? String((activePeriod.data as Row).academic_year_id || null) || null : null,
    payrollPeriodId: activePeriodId || null,
    staffId: options.staffId || null,
    payrollRecordCount: recordCount,
    payrollItemCount: itemCount,
    baseSalaryReady,
    formulaReady,
    periodSelected,
    staffSelected,
    canCalculate,
    reason,
  }
}

export async function getAngelcare360PayrollComplianceReadiness(options?: { schoolId?: string | null; payrollPeriodId?: string | null; staffId?: string | null }): Promise<Angelcare360PayrollComplianceReadinessRecord | null> {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return null
  await requireAngelcare360Permission('paie.view', { context })
  const checkpoints: Angelcare360PayrollComplianceCheckpointRecord[] = [
    { key: 'cnss', label: 'CNSS', status: 'locked', reason: BLOCKED_COMPLIANCE_MESSAGE },
    { key: 'tax', label: 'IR / fiscalité', status: 'locked', reason: BLOCKED_COMPLIANCE_MESSAGE },
    { key: 'declarations', label: 'Déclarations légales', status: 'locked', reason: BLOCKED_COMPLIANCE_MESSAGE },
    { key: 'bank_transfer', label: 'Virement bancaire', status: 'locked', reason: BLOCKED_BANK_TRANSFER_MESSAGE },
    { key: 'payslip_export', label: 'Bulletin PDF', status: 'locked', reason: BLOCKED_EXPORT_MESSAGE },
    { key: 'final_calculation', label: 'Calcul final', status: 'locked', reason: BLOCKED_CALCULATION_MESSAGE },
  ]
  return {
    schoolId: context.school.id,
    overallStatus: 'locked',
    checkpoints,
  }
}

export async function listAngelcare360StaffPayrollHistory(options?: Angelcare360PayrollHistoryFiltersInput) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('paie.view', { context })
  const records = await listAngelcare360PayrollRecords({
    schoolId: context.school.id,
    payrollPeriodId: options?.payrollPeriodId || null,
    staffId: options?.staffId || null,
    status: options?.status || null,
    search: options?.search || null,
  })
  if (!options?.from && !options?.to) return records
  return records.filter((record) => {
    const created = record.created_at
    const afterFrom = !options?.from || created >= options.from
    const beforeTo = !options?.to || created <= options.to
    return afterFrom && beforeTo
  })
}

export async function listAngelcare360PayrollAuditEvents(options?: Angelcare360PayrollAuditFilter) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  await requireAngelcare360Permission('audit.view', { context })
  const client = await createClient()
  let query = client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .in('module', [PAYROLL_MODULE])
    .order('created_at', { ascending: false })
    .limit(200)

  if (options?.module) query = query.eq('module', options.module)
  if (options?.action) query = query.eq('action', options.action)
  if (options?.entityType) query = query.eq('entity_type', options.entityType)
  if (options?.entityId) query = query.eq('entity_id', options.entityId)
  if (options?.severity) query = query.eq('severity', options.severity)
  if (options?.actorUserId) query = query.eq('actor_user_id', options.actorUserId)
  if (options?.from) query = query.gte('created_at', options.from)
  if (options?.to) query = query.lte('created_at', options.to)
  if (options?.search) {
    const term = options.search.trim()
    if (term) query = query.or(`action.ilike.%${term}%,entity_type.ilike.%${term}%,module.ilike.%${term}%`)
  }
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function getAngelcare360PayrollOverview(options?: { schoolId?: string | null }) : Promise<Angelcare360PayrollOverviewRecord | null> {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return null
  await requireAngelcare360Permission('paie.view', { context })
  const client = await createClient()
  const [periods, records, items, staffCount, teacherCount, auditEvents, activeYear, activePeriod, compliance, readiness] = await Promise.all([
    listAngelcare360PayrollPeriods({ schoolId: context.school.id }),
    listAngelcare360PayrollRecords({ schoolId: context.school.id }),
    listAngelcare360PayrollItems({ schoolId: context.school.id }),
    countRows(client, 'angelcare360_staff', context.school.id, [['status', 'eq', 'active']]),
    countRows(client, 'angelcare360_staff', context.school.id, [['status', 'eq', 'active'], ['staff_type', 'eq', 'teacher']]),
    listAngelcare360PayrollAuditEvents({ schoolId: context.school.id }),
    client.from('angelcare360_academic_years').select('id, label').eq('school_id', context.school.id).eq('status', 'active').order('is_current', { ascending: false }).limit(1).maybeSingle(),
    client.from('angelcare360_payroll_periods').select('id, label').eq('school_id', context.school.id).in('status', ['open', 'planned', 'validated']).order('starts_on', { ascending: false }).limit(1).maybeSingle(),
    getAngelcare360PayrollComplianceReadiness({ schoolId: context.school.id }),
    calculateAngelcare360PayrollReadiness({ schoolId: context.school.id }),
  ])

  const activePeriodId = activePeriod.data ? String((activePeriod.data as Row).id) : null
  const activePeriodLabel = activePeriod.data ? String((activePeriod.data as Row).label || null) || null : null
  const activeAcademicYearId = activeYear.data ? String((activeYear.data as Row).id) : context.academicYear?.id || null
  const activeAcademicYearLabel = activeYear.data ? String((activeYear.data as Row).label || null) || null : context.academicYear?.label || null

  const periodsCount = periods.length
  const openPeriodCount = periods.filter((period) => String(period.status) === 'open').length
  const payrollRecordCount = records.length
  const pendingReviewCount = records.filter((record) => String(record.status) === 'pending_review').length
  const validatedCount = records.filter((record) => String(record.status) === 'validated' || String(record.status) === 'approved').length
  const paidCount = records.filter((record) => String(record.status) === 'paid' || String(record.payment_status) === 'confirmed' || String(record.payment_status) === 'paid').length
  const blockedCount = records.filter((record) => String(record.status) === 'blocked' || String(record.payment_status) === 'blocked').length
  const grossTotal = records.reduce((total, record) => total + toNumber(record.gross_amount), 0)
  const netTotal = records.reduce((total, record) => total + toNumber(record.net_amount), 0)
  const baseSalaryTotal = records.reduce((total, record) => total + toNumber(record.base_salary), 0)
  const bonusTotal = records.reduce((total, record) => total + toNumber(record.bonuses_total), 0)
  const deductionTotal = records.reduce((total, record) => total + toNumber(record.deductions_total), 0)
  const advanceTotal = items.filter((item) => String(item.item_type) === 'advance').reduce((total, item) => total + Math.abs(toNumber(item.amount)), 0)
  const reimbursementTotal = items.filter((item) => String(item.item_type) === 'reimbursement').reduce((total, item) => total + toNumber(item.amount), 0)
  const openPeriod = activePeriodId ? periods.find((period) => String(period.id) === activePeriodId) : periods[0] || null

  const risks: string[] = []
  if (openPeriodCount === 0) risks.push('Aucune période de paie ouverte n’est disponible.')
  if (records.length === 0) risks.push('Aucun dossier de paie n’est encore préparé.')
  if (pendingReviewCount > 0) risks.push('Des dossiers de paie attendent encore la vérification.')
  if (blockedCount > 0) risks.push('Des dossiers de paie sont bloqués et requièrent un motif documenté.')
  if (records.some((record) => toNumber(record.base_salary) <= 0)) risks.push('Des dossiers n’ont pas encore de salaire de base exploitable.')
  if (records.some((record) => String(record.payment_status) === 'not_ready' || String(record.payment_status) === 'blocked')) risks.push('Des paiements internes ne sont pas encore prêts ou sont bloqués.')
  if (paidCount === 0 && payrollRecordCount > 0) risks.push('Aucun dossier de paie n’a encore été confirmé comme payé.')
  if (periodsCount === 0) risks.push('Aucune période de paie n’a encore été créée.')
  if (!compliance || compliance.overallStatus !== 'locked') risks.push('La conformité paie n’est pas verrouillée correctement.')

  return {
    schoolId: context.school.id,
    schoolName: context.school.name,
    activeAcademicYearId,
    activeAcademicYearLabel,
    activePayrollPeriodId: openPeriod ? String(openPeriod.id) : activePeriodId,
    activePayrollPeriodLabel: openPeriod ? String(openPeriod.label || null) || null : activePeriodLabel,
    staffCount,
    teacherCount,
    payrollPeriodCount: periodsCount,
    payrollRecordCount,
    pendingReviewCount,
    validatedCount,
    paidCount,
    blockedCount,
    openPeriodCount,
    grossTotal,
    netTotal,
    baseSalaryTotal,
    bonusTotal,
    deductionTotal,
    advanceTotal,
    reimbursementTotal,
    latestAuditEvents: auditEvents,
    risks,
    readiness,
    compliance: compliance || {
      schoolId: context.school.id,
      overallStatus: 'locked',
      checkpoints: [],
    },
    monthLabel: openPeriod ? String(openPeriod.label || null) || null : null,
  }
}

export async function blockAngelcare360PayrollExport(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null }) {
  const context = await getContextOrNull(input.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif n’est disponible.' }
  await auditPayrollEvent({
    action: 'payroll_export.blocked_not_available',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'payroll_export',
    entityId: input.entityId || context.school.id,
    afterData: { reason: input.reason || BLOCKED_EXPORT_MESSAGE },
  })
  return { ok: true, locked: true, reason: input.reason || BLOCKED_EXPORT_MESSAGE }
}

export async function blockAngelcare360PayrollBankTransfer(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null }) {
  const context = await getContextOrNull(input.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif n’est disponible.' }
  await auditPayrollEvent({
    action: 'payroll_bank_transfer.blocked_not_available',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'payroll_bank_transfer',
    entityId: input.entityId || context.school.id,
    afterData: { reason: input.reason || BLOCKED_BANK_TRANSFER_MESSAGE },
  })
  return { ok: true, locked: true, reason: input.reason || BLOCKED_BANK_TRANSFER_MESSAGE }
}

export async function blockAngelcare360PayrollCompliance(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null }) {
  const context = await getContextOrNull(input.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif n’est disponible.' }
  await auditPayrollEvent({
    action: 'payroll_compliance.blocked_not_configured',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'payroll_compliance',
    entityId: input.entityId || context.school.id,
    afterData: { reason: input.reason || BLOCKED_COMPLIANCE_MESSAGE },
  })
  return { ok: true, locked: true, reason: input.reason || BLOCKED_COMPLIANCE_MESSAGE }
}
