import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360DiscountApplySchema,
  angelcare360DiscountCreateSchema,
  angelcare360DiscountDecisionSchema,
  angelcare360ExpenseCreateSchema,
  angelcare360ExpenseUpdateSchema,
  angelcare360FeeItemCreateSchema,
  angelcare360FeeItemUpdateSchema,
  angelcare360FeeStructureCreateSchema,
  angelcare360FeeStructureUpdateSchema,
  angelcare360FinanceAuditQueryFiltersSchema,
  angelcare360InvoiceCancelSchema,
  angelcare360InvoiceCreateSchema,
  angelcare360InvoiceIssueSchema,
  angelcare360InvoiceLineCreateSchema,
  angelcare360InvoiceLineUpdateSchema,
  angelcare360InvoiceUpdateSchema,
  angelcare360PaymentAllocationSchema,
  angelcare360PaymentCancelSchema,
  angelcare360PaymentConfirmSchema,
  angelcare360PaymentRecordSchema,
  angelcare360PaymentRejectSchema,
  angelcare360ReceiptCancelSchema,
  angelcare360ReceiptCreateSchema,
  angelcare360ReminderBlockedSchema,
  angelcare360ReminderCreateSchema,
  angelcare360StudentFeeAssignmentCreateSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360AccountStatementMovementRecord,
  Angelcare360AccountStatementRecord,
  Angelcare360DiscountListRecord,
  Angelcare360DiscountRecord,
  Angelcare360ExpenseListRecord,
  Angelcare360ExpenseRecord,
  Angelcare360FeeItemListRecord,
  Angelcare360FeeItemRecord,
  Angelcare360FeeStructureListRecord,
  Angelcare360FeeStructureRecord,
  Angelcare360FinanceAuditFilter,
  Angelcare360FinanceAccountRecord,
  Angelcare360FinanceMutationResult,
  Angelcare360FinanceOverviewRecord,
  Angelcare360InvoiceListRecord,
  Angelcare360InvoiceLineListRecord,
  Angelcare360InvoiceLineRecord,
  Angelcare360InvoiceRecord,
  Angelcare360InvoiceStatus,
  Angelcare360PaymentListRecord,
  Angelcare360PaymentRecord,
  Angelcare360PaymentReminderListRecord,
  Angelcare360PaymentReminderRecord,
  Angelcare360ReceiptListRecord,
  Angelcare360ReceiptRecord,
  Angelcare360StudentBalanceRecord,
  Angelcare360StudentFeeAssignmentListRecord,
  Angelcare360StudentFeeAssignmentRecord,
} from '@/types/angelcare360/finance'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, any>

const FINANCE_MODULE = 'finance'
const PAYMENT_MODULE = 'paiements'
const BLOCKED_EXPORT_MESSAGE = 'L’export PDF sera activé dans la phase Rapports & Exports.'
const BLOCKED_PAYMENT_MESSAGE = 'Le paiement en ligne nécessite une passerelle configurée.'
const BLOCKED_REMINDER_MESSAGE = 'L’envoi automatique des relances sera activé avec le module Messagerie.'

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

function asIso(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function baseRecordFields(row: Row) {
  return {
    created_at: asString(row.created_at || new Date().toISOString()),
    updated_at: asString(row.updated_at || row.created_at || new Date().toISOString()),
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

async function auditFinanceEvent(input: {
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
    category: 'finance',
    module: input.module || FINANCE_MODULE,
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

function moneyTotal(rows: Row[], field: string) {
  return rows.reduce((total, row) => total + (asNumber(row[field]) || 0), 0)
}

function statusIsActiveDiscount(status: string) {
  return ['approved', 'applied', 'active'].includes(status)
}

function statusIsChargeableInvoice(status: string) {
  return ['draft', 'issued', 'sent', 'partial', 'partially_paid', 'paid', 'overdue'].includes(status)
}

function canEditInvoice(status: string) {
  return ['draft'].includes(status)
}

function canCancelInvoice(status: string) {
  return ['draft', 'issued', 'sent', 'partial', 'partially_paid', 'overdue'].includes(status)
}

function canEditPayment(status: string) {
  return ['pending', 'failed'].includes(status)
}

function canEditDiscount(status: string) {
  return ['requested', 'active', 'inactive'].includes(status)
}

function canEditReminder(status: string) {
  return ['planned', 'scheduled', 'blocked', 'failed'].includes(status)
}

function financeQueryBase(client: SupabaseClient, table: string, schoolId: string) {
  return client.from(table).select('*').eq('school_id', schoolId)
}

function toFeeStructureRecord(row: Row): Angelcare360FeeStructureRecord & Partial<Angelcare360FeeStructureListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    fee_code: asString(row.fee_code),
    label: asString(row.label),
    description: row.description ? asString(row.description) : null,
    due_day_of_month: row.due_day_of_month === null || row.due_day_of_month === undefined ? null : Number(row.due_day_of_month),
    currency: asString(row.currency || 'MAD'),
    applies_to_level: row.applies_to_level ? asString(row.applies_to_level) : null,
    status: asString(row.status),
    academic_year_label: asString(row.academic_year?.label || null) || null,
    fee_item_count: Number(row.fee_item_count || 0),
    student_assignment_count: Number(row.student_assignment_count || 0),
    detail_href: `/angelcare-360-command-center/finance/frais/${row.id}`,
  }
}

function toFeeItemRecord(row: Row): Angelcare360FeeItemRecord & Partial<Angelcare360FeeItemListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    fee_structure_id: asString(row.fee_structure_id),
    item_code: asString(row.item_code),
    label: asString(row.label),
    fee_type: asString(row.fee_type),
    amount: Number(row.amount || 0),
    due_on: row.due_on ? asString(row.due_on) : null,
    is_required: Boolean(row.is_required),
    status: asString(row.status),
    fee_structure_label: asString(row.fee_structure?.label || null) || null,
    fee_structure_code: asString(row.fee_structure?.fee_code || null) || null,
    detail_href: `/angelcare-360-command-center/finance/frais/${row.fee_structure_id}`,
  }
}

function toStudentFeeAssignmentRecord(row: Row): Angelcare360StudentFeeAssignmentRecord & Partial<Angelcare360StudentFeeAssignmentListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    student_id: asString(row.student_id),
    fee_structure_id: asString(row.fee_structure_id),
    class_id: row.class_id ? asString(row.class_id) : null,
    section_id: row.section_id ? asString(row.section_id) : null,
    assigned_on: asString(row.assigned_on),
    status: asString(row.status),
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    class_name: asString(row.class?.name || null) || null,
    class_code: asString(row.class?.class_code || null) || null,
    section_name: asString(row.section?.name || null) || null,
    section_code: asString(row.section?.section_code || null) || null,
    fee_structure_label: asString(row.fee_structure?.label || null) || null,
    fee_structure_code: asString(row.fee_structure?.fee_code || null) || null,
  }
}

function toInvoiceRecord(row: Row): Angelcare360InvoiceRecord & Partial<Angelcare360InvoiceListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    student_id: asString(row.student_id),
    invoice_number: asString(row.invoice_number),
    invoice_type: asString(row.invoice_type),
    invoice_date: asString(row.invoice_date),
    due_date: row.due_date ? asString(row.due_date) : null,
    currency: asString(row.currency || 'MAD'),
    subtotal_amount: Number(row.subtotal_amount || 0),
    discount_total: Number(row.discount_total || 0),
    tax_total: Number(row.tax_total || 0),
    total_amount: Number(row.total_amount || 0),
    amount_paid: Number(row.amount_paid || 0),
    balance_due: Number(row.balance_due ?? Math.max((Number(row.total_amount || 0)) - (Number(row.amount_paid || 0)), 0)),
    status: asString(row.status),
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    class_name: asString(row.student?.current_class?.name || null) || null,
    class_code: asString(row.student?.current_class?.class_code || null) || null,
    section_name: asString(row.student?.current_section?.name || null) || null,
    section_code: asString(row.student?.current_section?.section_code || null) || null,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    line_count: Number(row.line_count || 0),
    payment_count: Number(row.payment_count || 0),
    detail_href: `/angelcare-360-command-center/finance/factures/${row.id}`,
  }
}

function toInvoiceLineRecord(row: Row): Angelcare360InvoiceLineRecord & Partial<Angelcare360InvoiceLineListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    invoice_id: asString(row.invoice_id),
    fee_item_id: row.fee_item_id ? asString(row.fee_item_id) : null,
    line_code: row.line_code ? asString(row.line_code) : null,
    label: asString(row.label),
    quantity: Number(row.quantity || 1),
    unit_amount: Number(row.unit_amount || 0),
    line_total: Number(row.line_total || 0),
    status: asString(row.status),
    fee_item_label: asString(row.fee_item?.label || null) || null,
    fee_item_code: asString(row.fee_item?.item_code || null) || null,
  }
}

function toPaymentRecord(row: Row): Angelcare360PaymentRecord & Partial<Angelcare360PaymentListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    invoice_id: row.invoice_id ? asString(row.invoice_id) : null,
    student_id: row.student_id ? asString(row.student_id) : null,
    payment_number: asString(row.payment_number),
    payment_date: asString(row.payment_date),
    method: asString(row.method),
    amount: Number(row.amount || 0),
    allocated_amount: Number(row.allocated_amount || 0),
    reference: row.reference ? asString(row.reference) : null,
    recorded_by: row.recorded_by ? asString(row.recorded_by) : null,
    status: asString(row.status),
    invoice_number: asString(row.invoice?.invoice_number || null) || null,
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    receipt_number: asString(row.receipt?.receipt_number || null) || null,
    detail_href: `/angelcare-360-command-center/finance/paiements/${row.id}`,
  }
}

function toReceiptRecord(row: Row): Angelcare360ReceiptRecord & Partial<Angelcare360ReceiptListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    payment_id: asString(row.payment_id),
    receipt_number: asString(row.receipt_number),
    issued_at: asString(row.issued_at),
    receipt_document_id: row.receipt_document_id ? asString(row.receipt_document_id) : null,
    status: asString(row.status),
    payment_number: asString(row.payment?.payment_number || null) || null,
    payment_amount: row.payment?.amount ? Number(row.payment.amount) : null,
    invoice_number: asString(row.payment?.invoice?.invoice_number || null) || null,
    detail_href: `/angelcare-360-command-center/finance/recus`,
  }
}

function toDiscountRecord(row: Row): Angelcare360DiscountRecord & Partial<Angelcare360DiscountListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: row.academic_year_id ? asString(row.academic_year_id) : null,
    student_id: row.student_id ? asString(row.student_id) : null,
    invoice_id: row.invoice_id ? asString(row.invoice_id) : null,
    discount_code: asString(row.discount_code),
    discount_type: asString(row.discount_type),
    amount: Number(row.amount || 0),
    reason: row.reason ? asString(row.reason) : null,
    approved_by: row.approved_by ? asString(row.approved_by) : null,
    status: asString(row.status),
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    invoice_number: asString(row.invoice?.invoice_number || null) || null,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    detail_href: `/angelcare-360-command-center/finance/remises`,
  }
}

function toReminderRecord(row: Row): Angelcare360PaymentReminderRecord & Partial<Angelcare360PaymentReminderListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    invoice_id: asString(row.invoice_id),
    student_id: row.student_id ? asString(row.student_id) : null,
    reminder_code: asString(row.reminder_code),
    reminder_type: asString(row.reminder_type),
    scheduled_for: asString(row.scheduled_for),
    sent_at: row.sent_at ? asString(row.sent_at) : null,
    channel: asString(row.channel),
    notes: row.notes ? asString(row.notes) : null,
    delivered_by: row.delivered_by ? asString(row.delivered_by) : null,
    status: asString(row.status),
    invoice_number: asString(row.invoice?.invoice_number || null) || null,
    student_full_name: asString(row.student?.full_name || null) || null,
    student_code: asString(row.student?.student_code || null) || null,
    detail_href: `/angelcare-360-command-center/finance/relances`,
  }
}

function toExpenseRecord(row: Row): Angelcare360ExpenseRecord & Partial<Angelcare360ExpenseListRecord> {
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: row.academic_year_id ? asString(row.academic_year_id) : null,
    expense_code: asString(row.expense_code),
    expense_date: asString(row.expense_date),
    category: asString(row.category),
    vendor_name: asString(row.vendor_name),
    account_id: row.account_id ? asString(row.account_id) : null,
    amount: Number(row.amount || 0),
    currency: asString(row.currency || 'MAD'),
    payment_method: asString(row.payment_method),
    notes: row.notes ? asString(row.notes) : null,
    status: asString(row.status),
    account_label: asString(row.account?.label || null) || null,
    academic_year_label: asString(row.academic_year?.label || null) || null,
    detail_href: `/angelcare-360-command-center/finance/depenses`,
  }
}

async function getActiveTermId(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  let query = client.from('angelcare360_terms').select('id').eq('school_id', schoolId).eq('status', 'active').order('order_index', { ascending: true }).limit(1)
  if (academicYearId) query = query.eq('academic_year_id', academicYearId)
  const { data } = await query.maybeSingle()
  return data?.id || null
}

export async function getAngelcare360FinanceOverview(options?: { schoolId?: string | null }): Promise<Angelcare360FinanceOverviewRecord | null> {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return null

  const client = await createClient()
  const schoolId = context.school.id
  const academicYearId = context.academicYear?.id || null
  const activeTermId = await getActiveTermId(client, schoolId, academicYearId)
  const activeTerm = activeTermId
    ? (await client.from('angelcare360_terms').select('id, label').eq('id', activeTermId).maybeSingle()).data
    : null
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())

  const [
    totalFeeStructures,
    totalFeeItems,
    totalAssignments,
    totalInvoices,
    issuedInvoices,
    overdueInvoices,
    totalPayments,
    confirmedPayments,
    pendingPayments,
    totalReceipts,
    totalDiscounts,
    requestedDiscounts,
    approvedDiscounts,
    totalReminders,
    plannedReminders,
    blockedReminders,
    totalExpenses,
    classCount,
    sectionCount,
    teacherAssignmentCount,
    latestAuditResponse,
    invoicesResponse,
    studentsResponse,
    assignmentsResponse,
  ] = await Promise.all([
    countRows(client, 'angelcare360_fee_structures', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_fee_items', schoolId),
    countRows(client, 'angelcare360_student_fee_assignments', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_invoices', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_invoices', schoolId, [['status', 'eq', 'issued']]),
    countRows(client, 'angelcare360_invoices', schoolId, [['status', 'in', ['overdue', 'partial', 'partially_paid']]]),
    countRows(client, 'angelcare360_payments', schoolId),
    countRows(client, 'angelcare360_payments', schoolId, [['status', 'eq', 'confirmed']]),
    countRows(client, 'angelcare360_payments', schoolId, [['status', 'eq', 'pending']]),
    countRows(client, 'angelcare360_receipts', schoolId),
    countRows(client, 'angelcare360_discounts', schoolId),
    countRows(client, 'angelcare360_discounts', schoolId, [['status', 'eq', 'requested']]),
    countRows(client, 'angelcare360_discounts', schoolId, [['status', 'eq', 'approved']]),
    countRows(client, 'angelcare360_payment_reminders', schoolId),
    countRows(client, 'angelcare360_payment_reminders', schoolId, [['status', 'eq', 'planned']]),
    countRows(client, 'angelcare360_payment_reminders', schoolId, [['status', 'eq', 'blocked']]),
    countRows(client, 'angelcare360_expenses', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_classes', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_sections', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_teacher_assignments', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    client
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .in('module', [FINANCE_MODULE, PAYMENT_MODULE, 'frais', 'remises', 'relances'])
      .order('created_at', { ascending: false })
      .limit(8),
    client
      .from('angelcare360_invoices')
      .select('id, school_id, student_id, total_amount, amount_paid, discount_total, balance_due, status, student:angelcare360_students(id, student_code, full_name)')
      .eq('school_id', schoolId)
      .eq('status', 'overdue'),
    client
      .from('angelcare360_students')
      .select('id, school_id, student_code, full_name')
      .eq('school_id', schoolId),
    client
      .from('angelcare360_student_fee_assignments')
      .select('id, school_id, student_id, fee_structure_id, status')
      .eq('school_id', schoolId)
      .eq('status', 'active'),
  ])

  const invoices = (invoicesResponse.data || []) as Row[]
  const students = (studentsResponse.data || []) as Row[]
  const assignments = (assignmentsResponse.data || []) as Row[]
  const outstandingTotal = invoices.reduce((sum, row) => sum + (asNumber(row.balance_due) || 0), 0)
  const totalBalances = invoices.length
  const studentsWithOutstandingCount = new Set(invoices.filter((row) => (asNumber(row.balance_due) || 0) > 0).map((row) => String(row.student_id))).size
  const studentWithFeeAssignmentCount = new Set(assignments.map((row) => String(row.student_id))).size

  const risks: string[] = []
  if (!activeTermId) risks.push('Aucune période active n’est résolue pour le recouvrement.')
  if (totalFeeStructures === 0) risks.push('Aucune structure de frais n’est disponible.')
  if (studentWithFeeAssignmentCount === 0) risks.push('Aucune affectation de frais élève n’est configurée.')
  if (overdueInvoices > 0) risks.push(`${overdueInvoices} facture(s) sont en retard.`)
  if (pendingPayments > 0) risks.push(`${pendingPayments} paiement(s) sont encore en attente.`)
  if (requestedDiscounts > 0) risks.push(`${requestedDiscounts} remise(s) attendent approbation.`)
  if (blockedReminders > 0) risks.push(`${blockedReminders} relance(s) sont bloquées par l’absence de canal actif.`)
  if (studentsWithOutstandingCount > 0 && totalReceipts === 0) risks.push('Des créances existent, mais aucun reçu n’est encore émis.')
  if (outstandingTotal > 0) risks.push('Le solde dû reste ouvert sur un ou plusieurs élèves.')
  risks.push(BLOCKED_EXPORT_MESSAGE)
  risks.push(BLOCKED_PAYMENT_MESSAGE)

  return {
    schoolId,
    schoolName: context.school.name,
    activeAcademicYearId: academicYearId,
    activeAcademicYearLabel: context.academicYear?.label || null,
    activeTermId,
    activeTermLabel: activeTerm?.label || null,
    totalFeeStructures,
    totalFeeItems,
    totalAssignments,
    totalInvoices,
    issuedInvoices,
    overdueInvoices,
    totalPayments,
    confirmedPayments,
    pendingPayments,
    totalReceipts,
    totalDiscounts,
    requestedDiscounts,
    approvedDiscounts,
    totalReminders,
    plannedReminders,
    blockedReminders,
    totalBalances,
    totalOutstanding: outstandingTotal,
    totalExpenses,
    studentWithFeeAssignmentCount,
    studentsWithOutstandingCount,
    classCount,
    sectionCount,
    teacherAssignmentCount,
    latestAuditEvents: (latestAuditResponse.data || []) as Angelcare360AuditRecord[],
    risks,
    monthLabel,
  }
}

export async function listAngelcare360FeeStructures(options?: { schoolId?: string | null; academicYearId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_fee_structures')
    .select('id, school_id, academic_year_id, fee_code, label, description, due_day_of_month, currency, applies_to_level, status, created_at, updated_at, academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })

  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`fee_code.ilike.%${options.search}%,label.ilike.%${options.search}%`)

  const { data } = await query
  const structureIds = ((data || []) as Row[]).map((row) => String(row.id))
  const [itemsResponse, assignmentsResponse] = await Promise.all([
    structureIds.length
      ? client.from('angelcare360_fee_items').select('id, fee_structure_id').eq('school_id', context.school.id).in('fee_structure_id', structureIds)
      : Promise.resolve({ data: [] as Row[] }),
    structureIds.length
      ? client.from('angelcare360_student_fee_assignments').select('id, fee_structure_id').eq('school_id', context.school.id).in('fee_structure_id', structureIds)
      : Promise.resolve({ data: [] as Row[] }),
  ])
  const itemsByStructure = new Map<string, number>()
  for (const row of (itemsResponse.data || []) as Row[]) {
    const key = asString(row.fee_structure_id)
    itemsByStructure.set(key, (itemsByStructure.get(key) || 0) + 1)
  }
  const assignmentsByStructure = new Map<string, number>()
  for (const row of (assignmentsResponse.data || []) as Row[]) {
    const key = asString(row.fee_structure_id)
    assignmentsByStructure.set(key, (assignmentsByStructure.get(key) || 0) + 1)
  }
  return ((data || []) as Row[]).map((row) => ({
    ...toFeeStructureRecord(row),
    fee_item_count: itemsByStructure.get(asString(row.id)) || 0,
    student_assignment_count: assignmentsByStructure.get(asString(row.id)) || 0,
  })) as Angelcare360FeeStructureListRecord[]
}

export async function getAngelcare360FeeStructureById(options: { schoolId?: string | null; id: string }) {
  const context = await getContextOrNull(options.schoolId)
  if (!context?.school) return null
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_fee_structures')
    .select('id, school_id, academic_year_id, fee_code, label, description, due_day_of_month, currency, applies_to_level, status, created_at, updated_at, academic_year:angelcare360_academic_years(id, label), items:angelcare360_fee_items(id, item_code, label, fee_type, amount, due_on, is_required, status)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  if (!data) return null
  const structure = toFeeStructureRecord(data as Row) as Angelcare360FeeStructureListRecord
  structure.fee_item_count = ((data as Row).items || []).length
  const { data: assignments } = await client.from('angelcare360_student_fee_assignments').select('id, fee_structure_id, student_id, status, student:angelcare360_students(id, full_name, student_code), class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code)').eq('school_id', context.school.id).eq('fee_structure_id', options.id)
  return {
    structure,
    items: (((data as Row).items || []) as Row[]).map((row) => toFeeItemRecord({ ...row, fee_structure: data })),
    assignments: ((assignments || []) as Row[]).map(toStudentFeeAssignmentRecord),
  }
}

export async function createAngelcare360FeeStructure(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360FeeStructureCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de structure de frais invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    fee_code: parsed.data.feeCode || buildCode('FEE'),
    label: parsed.data.label,
    description: parsed.data.description || null,
    due_day_of_month: parsed.data.dueDayOfMonth || null,
    currency: parsed.data.currency || 'MAD',
    applies_to_level: parsed.data.appliesToLevel || null,
    status: parsed.data.status || 'draft',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_fee_structures').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'fee_structure.created', severity: 'info', schoolId: context.school!.id, entityType: 'fee_structure', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360FeeStructure(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360FeeStructureUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de structure de frais invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_fee_structures').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La structure de frais est introuvable.' }
  const { data, error } = await client.from('angelcare360_fee_structures').update({
    academic_year_id: parsed.data.academicYearId,
    fee_code: parsed.data.feeCode || before.data.fee_code,
    label: parsed.data.label,
    description: parsed.data.description || null,
    due_day_of_month: parsed.data.dueDayOfMonth || null,
    currency: parsed.data.currency || before.data.currency || 'MAD',
    applies_to_level: parsed.data.appliesToLevel || null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'fee_structure.updated', severity: 'info', schoolId: context.school!.id, entityType: 'fee_structure', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: parsed.data as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function createAngelcare360FeeItem(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360FeeItemCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’article de frais invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    fee_structure_id: parsed.data.feeStructureId,
    item_code: parsed.data.itemCode || buildCode('ITEM'),
    label: parsed.data.label,
    fee_type: parsed.data.feeType || 'tuition',
    amount: parsed.data.amount,
    due_on: parsed.data.dueOn || null,
    is_required: Boolean(parsed.data.isRequired),
    status: parsed.data.status || 'active',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_fee_items').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'fee_item.created', severity: 'info', schoolId: context.school!.id, entityType: 'fee_item', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360FeeItem(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360FeeItemUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’article de frais invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_fee_items').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’article de frais est introuvable.' }
  const { data, error } = await client.from('angelcare360_fee_items').update({
    fee_structure_id: parsed.data.feeStructureId,
    item_code: parsed.data.itemCode || before.data.item_code,
    label: parsed.data.label,
    fee_type: parsed.data.feeType || before.data.fee_type || 'tuition',
    amount: parsed.data.amount,
    due_on: parsed.data.dueOn || null,
    is_required: Boolean(parsed.data.isRequired),
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'fee_item.updated', severity: 'info', schoolId: context.school!.id, entityType: 'fee_item', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: parsed.data as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360StudentFeeAssignments(options?: { schoolId?: string | null; academicYearId?: string | null; studentId?: string | null; classId?: string | null; sectionId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_student_fee_assignments')
    .select('id, school_id, academic_year_id, student_id, fee_structure_id, class_id, section_id, assigned_on, status, created_at, updated_at, student:angelcare360_students(id, full_name, student_code), class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), fee_structure:angelcare360_fee_structures(id, label, fee_code)')
    .eq('school_id', context.school.id)
    .order('assigned_on', { ascending: false })
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`student_id.ilike.%${options.search}%,fee_structure_id.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toStudentFeeAssignmentRecord) as Angelcare360StudentFeeAssignmentListRecord[]
}

export async function createAngelcare360StudentFeeAssignment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360StudentFeeAssignmentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload d’affectation de frais invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    fee_structure_id: parsed.data.feeStructureId,
    class_id: parsed.data.classId || null,
    section_id: parsed.data.sectionId || null,
    assigned_on: parsed.data.assignedOn || new Date().toISOString().slice(0, 10),
    status: parsed.data.status || 'active',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_student_fee_assignments').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'student_fee_assignment.created', severity: 'info', schoolId: context.school!.id, entityType: 'student_fee_assignment', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360StudentFeeAssignmentStatus(input: { schoolId: string; id: string; status: 'active' | 'inactive' | 'archived' }): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const context = await requireAngelcare360Permission('finance.update', { schoolId: input.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_student_fee_assignments').select('*').eq('school_id', context.school!.id).eq('id', input.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'L’affectation de frais est introuvable.' }
  if (before.data.status === input.status) return { ok: true, record: { id: input.id }, idempotent: true }
  const { data, error } = await client.from('angelcare360_student_fee_assignments').update({ status: input.status, updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', input.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'student_fee_assignment.updated', severity: 'info', schoolId: context.school!.id, entityType: 'student_fee_assignment', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: input.status } })
  return { ok: true, record: { id: String(data.id) } }
}

async function recalculateInvoiceTotals(client: SupabaseClient, schoolId: string, invoiceId: string) {
  const { data: invoiceRows } = await client.from('angelcare360_invoice_lines').select('line_total, status').eq('school_id', schoolId).eq('invoice_id', invoiceId)
  const { data: discountRows } = await client.from('angelcare360_discounts').select('amount, status').eq('school_id', schoolId).eq('invoice_id', invoiceId)
  const subtotal = moneyTotal((invoiceRows || []) as Row[], 'line_total')
  const discountTotal = moneyTotal(((discountRows || []) as Row[]).filter((row) => statusIsActiveDiscount(asString(row.status))), 'amount')
  const total = Math.max(subtotal - discountTotal, 0)
  const { data: payments } = await client.from('angelcare360_payments').select('amount, status').eq('school_id', schoolId).eq('invoice_id', invoiceId)
  const amountPaid = moneyTotal(((payments || []) as Row[]).filter((row) => ['confirmed'].includes(asString(row.status))), 'amount')
  const { data, error } = await client.from('angelcare360_invoices').update({
    subtotal_amount: subtotal,
    discount_total: discountTotal,
    tax_total: 0,
    total_amount: total,
    amount_paid: amountPaid,
    status: amountPaid >= total && total > 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'draft',
    updated_at: new Date().toISOString(),
  }).eq('school_id', schoolId).eq('id', invoiceId).select('id, status, subtotal_amount, discount_total, tax_total, total_amount, amount_paid, balance_due').single()
  if (error) throw new Error(error.message)
  return data as Row
}

export async function listAngelcare360Invoices(options?: { schoolId?: string | null; academicYearId?: string | null; studentId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_invoices')
    .select('id, school_id, academic_year_id, student_id, invoice_number, invoice_type, invoice_date, due_date, currency, subtotal_amount, discount_total, tax_total, total_amount, amount_paid, balance_due, status, created_at, updated_at, student:angelcare360_students(id, student_code, full_name, current_class:angelcare360_classes(id, name, class_code), current_section:angelcare360_sections(id, name, section_code)), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('invoice_date', { ascending: false })
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`invoice_number.ilike.%${options.search}%,student_id.ilike.%${options.search}%`)
  const { data } = await query
  const invoiceIds = ((data || []) as Row[]).map((row) => String(row.id))
  const [lineResponse, paymentResponse] = await Promise.all([
    invoiceIds.length ? client.from('angelcare360_invoice_lines').select('invoice_id, id').eq('school_id', context.school.id).in('invoice_id', invoiceIds) : Promise.resolve({ data: [] as Row[] }),
    invoiceIds.length ? client.from('angelcare360_payments').select('invoice_id, id').eq('school_id', context.school.id).in('invoice_id', invoiceIds) : Promise.resolve({ data: [] as Row[] }),
  ])
  const linesByInvoice = new Map<string, number>()
  for (const row of (lineResponse.data || []) as Row[]) linesByInvoice.set(asString(row.invoice_id), (linesByInvoice.get(asString(row.invoice_id)) || 0) + 1)
  const paymentsByInvoice = new Map<string, number>()
  for (const row of (paymentResponse.data || []) as Row[]) paymentsByInvoice.set(asString(row.invoice_id), (paymentsByInvoice.get(asString(row.invoice_id)) || 0) + 1)
  return ((data || []) as Row[]).map((row) => ({
    ...toInvoiceRecord(row),
    line_count: linesByInvoice.get(asString(row.id)) || 0,
    payment_count: paymentsByInvoice.get(asString(row.id)) || 0,
  })) as Angelcare360InvoiceListRecord[]
}

export async function getAngelcare360InvoiceById(options: { schoolId?: string | null; id: string }) {
  const context = await getContextOrNull(options.schoolId)
  if (!context?.school) return null
  const client = await createClient()
  const [{ data: invoice }, { data: lines }, { data: payments }, { data: receipts }, { data: discounts }] = await Promise.all([
    client.from('angelcare360_invoices').select('id, school_id, academic_year_id, student_id, invoice_number, invoice_type, invoice_date, due_date, currency, subtotal_amount, discount_total, tax_total, total_amount, amount_paid, balance_due, status, created_at, updated_at, student:angelcare360_students(id, student_code, full_name, current_class:angelcare360_classes(id, name, class_code), current_section:angelcare360_sections(id, name, section_code)), academic_year:angelcare360_academic_years(id, label)').eq('school_id', context.school.id).eq('id', options.id).maybeSingle(),
    client.from('angelcare360_invoice_lines').select('id, school_id, invoice_id, fee_item_id, line_code, label, quantity, unit_amount, line_total, status, fee_item:angelcare360_fee_items(id, item_code, label)').eq('school_id', context.school.id).eq('invoice_id', options.id),
    client.from('angelcare360_payments').select('id, school_id, academic_year_id, invoice_id, student_id, payment_number, payment_date, method, amount, allocated_amount, reference, recorded_by, status, invoice:angelcare360_invoices(id, invoice_number), student:angelcare360_students(id, student_code, full_name), receipt:angelcare360_receipts(id, receipt_number)').eq('school_id', context.school.id).eq('invoice_id', options.id),
    client.from('angelcare360_receipts').select('id, school_id, payment_id, receipt_number, issued_at, receipt_document_id, status, payment:angelcare360_payments(id, payment_number, amount)').eq('school_id', context.school.id),
    client.from('angelcare360_discounts').select('id, school_id, academic_year_id, student_id, invoice_id, discount_code, discount_type, amount, reason, approved_by, status').eq('school_id', context.school.id).eq('invoice_id', options.id),
  ])
  if (!invoice) return null
  return {
    invoice: toInvoiceRecord(invoice as Row) as Angelcare360InvoiceListRecord,
    lines: ((lines || []) as Row[]).map(toInvoiceLineRecord) as Angelcare360InvoiceLineListRecord[],
    payments: ((payments || []) as Row[]).map(toPaymentRecord) as Angelcare360PaymentListRecord[],
    receipts: ((receipts || []) as Row[]).map(toReceiptRecord) as Angelcare360ReceiptListRecord[],
    discounts: ((discounts || []) as Row[]).map(toDiscountRecord) as Angelcare360DiscountListRecord[],
  }
}

export async function createAngelcare360Invoice(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    invoice_number: parsed.data.invoiceNumber || buildCode('INV'),
    invoice_type: parsed.data.invoiceType || 'tuition',
    invoice_date: parsed.data.invoiceDate || new Date().toISOString().slice(0, 10),
    due_date: parsed.data.dueDate || null,
    currency: parsed.data.currency || 'MAD',
    subtotal_amount: parsed.data.subtotalAmount || 0,
    discount_total: parsed.data.discountTotal || 0,
    tax_total: parsed.data.taxTotal || 0,
    total_amount: parsed.data.totalAmount || 0,
    amount_paid: parsed.data.amountPaid || 0,
    status: parsed.data.status || 'draft',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_invoices').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'invoice.created', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Invoice(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_invoices').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La facture est introuvable.' }
  if (!canEditInvoice(asString(before.data.status))) return { ok: false, error: 'La facture ne peut plus être modifiée dans son statut actuel.' }
  const { data, error } = await client.from('angelcare360_invoices').update({
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    invoice_number: parsed.data.invoiceNumber || before.data.invoice_number,
    invoice_type: parsed.data.invoiceType || before.data.invoice_type,
    invoice_date: parsed.data.invoiceDate || before.data.invoice_date,
    due_date: parsed.data.dueDate || null,
    currency: parsed.data.currency || before.data.currency || 'MAD',
    subtotal_amount: parsed.data.subtotalAmount ?? before.data.subtotal_amount,
    discount_total: parsed.data.discountTotal ?? before.data.discount_total,
    tax_total: parsed.data.taxTotal ?? before.data.tax_total,
    total_amount: parsed.data.totalAmount ?? before.data.total_amount,
    amount_paid: parsed.data.amountPaid ?? before.data.amount_paid,
    status: parsed.data.status || before.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'invoice.updated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: parsed.data as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function recalculateAngelcare360InvoiceTotals(options: { schoolId: string; invoiceId: string }): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const context = await requireAngelcare360Permission('finance.update', { schoolId: options.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_invoices').select('*').eq('school_id', context.school!.id).eq('id', options.invoiceId).maybeSingle()
  if (!before.data) return { ok: false, error: 'La facture est introuvable.' }
  const updated = await recalculateInvoiceTotals(client, context.school!.id, options.invoiceId)
  await auditFinanceEvent({ action: 'invoice.total_recalculated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: options.invoiceId, beforeData: before.data as Record<string, unknown>, afterData: updated as Record<string, unknown> })
  return { ok: true, record: { id: options.invoiceId } }
}

export async function issueAngelcare360Invoice(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceIssueSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Émission de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_invoices').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La facture est introuvable.' }
  if (before.data.status === 'issued') return { ok: true, record: { id: parsed.data.id }, idempotent: true }
  const { data: lineRows } = await client.from('angelcare360_invoice_lines').select('id').eq('school_id', context.school!.id).eq('invoice_id', parsed.data.id)
  if (!lineRows || lineRows.length === 0) return { ok: false, error: 'La facture doit comporter au moins une ligne avant émission.' }
  const recalculated = await recalculateInvoiceTotals(client, context.school!.id, parsed.data.id)
  const { data, error } = await client.from('angelcare360_invoices').update({ status: 'issued', updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'invoice.issued', severity: 'warning', schoolId: context.school!.id, entityType: 'invoice', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: recalculated as Record<string, unknown>, metadata: { reason: parsed.data.reason || null } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function cancelAngelcare360Invoice(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Annulation de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_invoices').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La facture est introuvable.' }
  if (!canCancelInvoice(asString(before.data.status))) return { ok: false, error: 'La facture ne peut pas être annulée dans son statut actuel.' }
  if ((asNumber(before.data.amount_paid) || 0) > 0) return { ok: false, error: 'La facture a déjà reçu un paiement. Un avoir doit être traité séparément.' }
  if (before.data.status === 'cancelled') return { ok: true, record: { id: parsed.data.id }, idempotent: true }
  const { data, error } = await client.from('angelcare360_invoices').update({ status: 'cancelled', updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), cancellation_reason: parsed.data.reason } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'invoice.cancelled', severity: 'critical', schoolId: context.school!.id, entityType: 'invoice', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'cancelled', reason: parsed.data.reason } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function createAngelcare360InvoiceLine(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceLineCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de ligne de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const invoice = await client.from('angelcare360_invoices').select('id, status').eq('school_id', context.school!.id).eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice.data) return { ok: false, error: 'La facture liée est introuvable.' }
  if (!canEditInvoice(asString(invoice.data.status))) return { ok: false, error: 'La facture ne peut plus recevoir de nouvelles lignes dans son statut actuel.' }
  const payload = {
    school_id: context.school!.id,
    invoice_id: parsed.data.invoiceId,
    fee_item_id: parsed.data.feeItemId || null,
    line_code: parsed.data.lineCode || buildCode('LIN'),
    label: parsed.data.label,
    quantity: parsed.data.quantity || 1,
    unit_amount: parsed.data.unitAmount,
    line_total: (parsed.data.quantity || 1) * parsed.data.unitAmount,
    status: parsed.data.status || 'active',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_invoice_lines').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  const recalculated = await recalculateInvoiceTotals(client, context.school!.id, parsed.data.invoiceId)
  await auditFinanceEvent({ action: 'invoice.total_recalculated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: parsed.data.invoiceId, afterData: recalculated as Record<string, unknown> })
  await auditFinanceEvent({ action: 'invoice.updated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice_line', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360InvoiceLine(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360InvoiceLineUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de ligne de facture invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_invoice_lines').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La ligne de facture est introuvable.' }
  const previousInvoiceId = before.data.invoice_id ? String(before.data.invoice_id) : null
  const { data, error } = await client.from('angelcare360_invoice_lines').update({
    invoice_id: parsed.data.invoiceId,
    fee_item_id: parsed.data.feeItemId || null,
    line_code: parsed.data.lineCode || before.data.line_code,
    label: parsed.data.label,
    quantity: parsed.data.quantity || 1,
    unit_amount: parsed.data.unitAmount,
    line_total: (parsed.data.quantity || 1) * parsed.data.unitAmount,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  if (previousInvoiceId && previousInvoiceId !== parsed.data.invoiceId) {
    const previousRecalculated = await recalculateInvoiceTotals(client, context.school!.id, previousInvoiceId)
    await auditFinanceEvent({ action: 'invoice.total_recalculated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: previousInvoiceId, afterData: previousRecalculated as Record<string, unknown> })
  }
  const recalculated = await recalculateInvoiceTotals(client, context.school!.id, parsed.data.invoiceId)
  await auditFinanceEvent({ action: 'invoice.total_recalculated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice', entityId: parsed.data.invoiceId, afterData: recalculated as Record<string, unknown> })
  await auditFinanceEvent({ action: 'invoice.updated', severity: 'info', schoolId: context.school!.id, entityType: 'invoice_line', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: parsed.data as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360Payments(options?: { schoolId?: string | null; academicYearId?: string | null; studentId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_payments')
    .select('id, school_id, academic_year_id, invoice_id, student_id, payment_number, payment_date, method, amount, allocated_amount, reference, recorded_by, status, created_at, updated_at, invoice:angelcare360_invoices(id, invoice_number), student:angelcare360_students(id, student_code, full_name), receipt:angelcare360_receipts(id, receipt_number)')
    .eq('school_id', context.school.id)
    .order('payment_date', { ascending: false })
  if (options?.academicYearId || context.academicYear?.id) query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  if (options?.studentId) query = query.eq('student_id', options.studentId)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`payment_number.ilike.%${options.search}%,reference.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toPaymentRecord) as Angelcare360PaymentListRecord[]
}

export async function getAngelcare360PaymentById(options: { schoolId?: string | null; id: string }) {
  const context = await getContextOrNull(options.schoolId)
  if (!context?.school) return null
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_payments')
    .select('id, school_id, academic_year_id, invoice_id, student_id, payment_number, payment_date, method, amount, allocated_amount, reference, recorded_by, status, created_at, updated_at, invoice:angelcare360_invoices(id, invoice_number, total_amount, amount_paid, balance_due), student:angelcare360_students(id, student_code, full_name), receipt:angelcare360_receipts(id, receipt_number, status)')
    .eq('school_id', context.school.id)
    .eq('id', options.id)
    .maybeSingle()
  return data ? (toPaymentRecord(data as Row) as Angelcare360PaymentListRecord) : null
}

export async function recordAngelcare360Payment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360PaymentRecordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de paiement invalide.') }
  const context = await requireAngelcare360Permission('paiements.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  if (parsed.data.invoiceId) {
    const invoice = await client.from('angelcare360_invoices').select('id, total_amount, amount_paid, balance_due, status').eq('school_id', context.school!.id).eq('id', parsed.data.invoiceId).maybeSingle()
    if (!invoice.data) return { ok: false, error: 'La facture liée est introuvable.' }
    const outstanding = Math.max((asNumber(invoice.data.balance_due) || 0), 0)
    if (parsed.data.amount > outstanding) return { ok: false, error: 'Le montant du paiement dépasse le solde restant de la facture.' }
  }
  const existing = parsed.data.reference
    ? await client.from('angelcare360_payments').select('id, status').eq('school_id', context.school!.id).eq('reference', parsed.data.reference).maybeSingle()
    : { data: null }
  if (existing.data) return { ok: true, record: { id: String(existing.data.id) }, idempotent: true }
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    invoice_id: parsed.data.invoiceId || null,
    student_id: parsed.data.studentId || null,
    payment_number: parsed.data.paymentNumber || buildCode('PAY'),
    payment_date: parsed.data.paymentDate,
    method: parsed.data.method,
    amount: parsed.data.amount,
    allocated_amount: 0,
    reference: parsed.data.reference || null,
    recorded_by: context.user.id,
    status: parsed.data.status || 'pending',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_payments').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'payment.recorded', severity: 'info', schoolId: context.school!.id, entityType: 'payment', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function confirmAngelcare360Payment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360PaymentConfirmSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Confirmation de paiement invalide.') }
  const context = await requireAngelcare360Permission('paiements.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le paiement est introuvable.' }
  if (before.data.status === 'confirmed') return { ok: true, record: { id: parsed.data.id }, idempotent: true }
  const { data, error } = await client.from('angelcare360_payments').update({ status: 'confirmed', updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'payment.confirmed', severity: 'warning', schoolId: context.school!.id, entityType: 'payment', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'confirmed', reference: parsed.data.reference || null } })
  if (before.data.invoice_id) {
    await allocateAngelcare360PaymentToInvoice({ schoolId: context.school!.id, paymentId: String(data.id), invoiceId: String(before.data.invoice_id), amount: asNumber(before.data.amount) || 0 })
  }
  return { ok: true, record: { id: String(data.id) } }
}

export async function rejectAngelcare360Payment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360PaymentRejectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Rejet de paiement invalide.') }
  const context = await requireAngelcare360Permission('paiements.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le paiement est introuvable.' }
  const { data, error } = await client.from('angelcare360_payments').update({ status: 'rejected', updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), rejection_reason: parsed.data.reason } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'payment.rejected', severity: 'warning', schoolId: context.school!.id, entityType: 'payment', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'rejected', reason: parsed.data.reason } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function cancelAngelcare360Payment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360PaymentCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Annulation de paiement invalide.') }
  const context = await requireAngelcare360Permission('paiements.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payments').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le paiement est introuvable.' }
  if (before.data.status === 'cancelled') return { ok: true, record: { id: parsed.data.id }, idempotent: true }
  if (before.data.allocated_amount > 0 && before.data.invoice_id) {
    const invoice = await client.from('angelcare360_invoices').select('id, amount_paid').eq('school_id', context.school!.id).eq('id', before.data.invoice_id).maybeSingle()
    if (invoice.data) {
      await client.from('angelcare360_invoices').update({ amount_paid: Math.max((asNumber(invoice.data.amount_paid) || 0) - (asNumber(before.data.amount) || 0), 0), updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', invoice.data.id)
    }
  }
  const { data, error } = await client.from('angelcare360_payments').update({ status: 'cancelled', updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), cancellation_reason: parsed.data.reason } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'payment.cancelled', severity: 'critical', schoolId: context.school!.id, entityType: 'payment', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'cancelled', reason: parsed.data.reason } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function allocateAngelcare360PaymentToInvoice(input: { schoolId: string; paymentId: string; invoiceId: string; amount?: number | null }): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const context = await requireAngelcare360Permission('paiements.update', { schoolId: input.schoolId })
  const client = await createClient()
  const payment = await client.from('angelcare360_payments').select('*').eq('school_id', context.school!.id).eq('id', input.paymentId).maybeSingle()
  if (!payment.data) return { ok: false, error: 'Le paiement est introuvable.' }
  const invoice = await client.from('angelcare360_invoices').select('id, total_amount, amount_paid, balance_due, status').eq('school_id', context.school!.id).eq('id', input.invoiceId).maybeSingle()
  if (!invoice.data) return { ok: false, error: 'La facture est introuvable.' }
  if (payment.data.status !== 'confirmed') return { ok: false, error: 'Le paiement doit être confirmé avant allocation.' }
  const allocationAmount = input.amount ?? asNumber(payment.data.amount) ?? 0
  const currentOutstanding = Math.max((asNumber(invoice.data.balance_due) || 0), 0)
  if (allocationAmount > currentOutstanding) return { ok: false, error: 'L’allocation dépasse le solde restant de la facture.' }
  const idempotent = payment.data.invoice_id === input.invoiceId && asNumber(payment.data.allocated_amount) === allocationAmount
  if (idempotent) return { ok: true, record: { id: input.paymentId }, idempotent: true }

  const beforePayment = payment.data as Row
  const beforeInvoice = invoice.data as Row
  const existingInvoiceId = payment.data.invoice_id ? String(payment.data.invoice_id) : null
  if (existingInvoiceId && existingInvoiceId !== input.invoiceId) {
    const previousInvoice = await client.from('angelcare360_invoices').select('id, amount_paid').eq('school_id', context.school!.id).eq('id', existingInvoiceId).maybeSingle()
    if (previousInvoice.data) {
      await client.from('angelcare360_invoices').update({
        amount_paid: Math.max((asNumber(previousInvoice.data.amount_paid) || 0) - (asNumber(payment.data.allocated_amount) || 0), 0),
        updated_at: new Date().toISOString(),
      }).eq('school_id', context.school!.id).eq('id', existingInvoiceId)
    }
  }
  const updatedInvoiceAmountPaid = Math.max((asNumber(invoice.data.amount_paid) || 0) + allocationAmount, 0)
  const updatedInvoiceStatus: Angelcare360InvoiceStatus = updatedInvoiceAmountPaid >= (asNumber(invoice.data.total_amount) || 0)
    ? 'paid'
    : updatedInvoiceAmountPaid > 0
      ? 'partially_paid'
      : asString(invoice.data.status) as Angelcare360InvoiceStatus
  const [paymentUpdate, invoiceUpdate] = await Promise.all([
    client.from('angelcare360_payments').update({ invoice_id: input.invoiceId, allocated_amount: allocationAmount, status: 'confirmed', updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', input.paymentId).select('id').single(),
    client.from('angelcare360_invoices').update({ amount_paid: updatedInvoiceAmountPaid, status: updatedInvoiceStatus, updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', input.invoiceId).select('id').single(),
  ])
  if (paymentUpdate.error) return { ok: false, error: paymentUpdate.error.message }
  if (invoiceUpdate.error) return { ok: false, error: invoiceUpdate.error.message }
  await auditFinanceEvent({ action: 'payment.allocated', severity: 'info', schoolId: context.school!.id, entityType: 'payment', entityId: input.paymentId, beforeData: { payment: beforePayment, invoice: beforeInvoice }, afterData: { paymentId: input.paymentId, invoiceId: input.invoiceId, amount: allocationAmount } })
  return { ok: true, record: { id: input.paymentId } }
}

export async function listAngelcare360Receipts(options?: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_receipts')
    .select('id, school_id, payment_id, receipt_number, issued_at, receipt_document_id, status, created_at, updated_at, payment:angelcare360_payments(id, payment_number, amount, status, invoice:angelcare360_invoices(id, invoice_number))')
    .eq('school_id', context.school.id)
    .order('issued_at', { ascending: false })
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`receipt_number.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toReceiptRecord) as Angelcare360ReceiptListRecord[]
}

export async function createAngelcare360ReceiptFromPayment(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ReceiptCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Création de reçu invalide.') }
  const context = await requireAngelcare360Permission('paiements.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payment = await client.from('angelcare360_payments').select('id, status, amount, invoice_id').eq('school_id', context.school!.id).eq('id', parsed.data.paymentId).maybeSingle()
  if (!payment.data) return { ok: false, error: 'Le paiement est introuvable.' }
  if (payment.data.status !== 'confirmed') return { ok: false, error: 'Un reçu ne peut être émis que pour un paiement confirmé.' }
  const existing = await client.from('angelcare360_receipts').select('id, status').eq('school_id', context.school!.id).eq('payment_id', parsed.data.paymentId).maybeSingle()
  if (existing.data && existing.data.status !== 'cancelled' && existing.data.status !== 'void') {
    return { ok: true, record: { id: String(existing.data.id) }, idempotent: true }
  }
  const payload = {
    school_id: context.school!.id,
    payment_id: parsed.data.paymentId,
    receipt_number: buildCode('RCP'),
    issued_at: new Date().toISOString(),
    status: parsed.data.status || 'issued',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_receipts').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'receipt.created', severity: 'info', schoolId: context.school!.id, entityType: 'receipt', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function cancelAngelcare360Receipt(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ReceiptCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Annulation de reçu invalide.') }
  const context = await requireAngelcare360Permission('paiements.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_receipts').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Le reçu est introuvable.' }
  if (before.data.status === 'cancelled') return { ok: true, record: { id: parsed.data.id }, idempotent: true }
  const { data, error } = await client.from('angelcare360_receipts').update({ status: 'cancelled', updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), cancellation_reason: parsed.data.reason } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'receipt.cancelled', severity: 'warning', schoolId: context.school!.id, entityType: 'receipt', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'cancelled', reason: parsed.data.reason } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360Discounts(options?: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_discounts')
    .select('id, school_id, academic_year_id, student_id, invoice_id, discount_code, discount_type, amount, reason, approved_by, status, created_at, updated_at, student:angelcare360_students(id, student_code, full_name), invoice:angelcare360_invoices(id, invoice_number), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`discount_code.ilike.%${options.search}%,reason.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toDiscountRecord) as Angelcare360DiscountListRecord[]
}

export async function createAngelcare360Discount(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360DiscountCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de remise invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId || context.academicYear?.id || null,
    student_id: parsed.data.studentId || null,
    invoice_id: parsed.data.invoiceId || null,
    discount_code: parsed.data.discountCode || buildCode('DISC'),
    discount_type: parsed.data.discountType,
    amount: parsed.data.amount,
    reason: parsed.data.reason || null,
    status: parsed.data.status || 'requested',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_discounts').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'discount.created', severity: 'info', schoolId: context.school!.id, entityType: 'discount', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function decideAngelcare360Discount(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360DiscountDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Décision de remise invalide.') }
  const context = await requireAngelcare360Permission('finance.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_discounts').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La remise est introuvable.' }
  if (!canEditDiscount(asString(before.data.status)) && parsed.data.decision !== 'approved') return { ok: false, error: 'La remise ne peut plus être modifiée dans son statut actuel.' }
  const nextStatus = parsed.data.decision
  const { data, error } = await client.from('angelcare360_discounts').update({ status: nextStatus, approved_by: parsed.data.decision === 'approved' ? context.user.id : before.data.approved_by, updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), decision_reason: parsed.data.reason || null } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({
    action: nextStatus === 'approved' ? 'discount.approved' : nextStatus === 'rejected' ? 'discount.rejected' : 'discount.updated',
    severity: nextStatus === 'approved' ? 'critical' : 'warning',
    schoolId: context.school!.id,
    entityType: 'discount',
    entityId: String(data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: nextStatus, reason: parsed.data.reason || null },
  })
  if (parsed.data.decision === 'approved' && before.data.invoice_id) {
    await applyAngelcare360Discount({ schoolId: context.school!.id, id: String(data.id), invoiceId: String(before.data.invoice_id) })
  }
  return { ok: true, record: { id: String(data.id) } }
}

export async function applyAngelcare360Discount(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360DiscountApplySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Application de remise invalide.') }
  const payload = parsed.data
  const context = await requireAngelcare360Permission('finance.update', { schoolId: payload.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_discounts').select('*').eq('school_id', context.school!.id).eq('id', payload.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La remise est introuvable.' }
  const invoiceId = payload.invoiceId || before.data.invoice_id
  if (!invoiceId) return { ok: false, error: 'La remise doit être reliée à une facture pour être appliquée.' }
  const { data, error } = await client.from('angelcare360_discounts').update({ status: 'applied', invoice_id: invoiceId, updated_at: new Date().toISOString() }).eq('school_id', context.school!.id).eq('id', payload.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await recalculateInvoiceTotals(client, context.school!.id, invoiceId)
  await auditFinanceEvent({ action: 'discount.applied', severity: 'warning', schoolId: context.school!.id, entityType: 'discount', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'applied', invoiceId } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360PaymentReminders(options?: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_payment_reminders')
    .select('id, school_id, invoice_id, student_id, reminder_code, reminder_type, scheduled_for, sent_at, channel, notes, delivered_by, status, created_at, updated_at, invoice:angelcare360_invoices(id, invoice_number), student:angelcare360_students(id, student_code, full_name)')
    .eq('school_id', context.school.id)
    .order('scheduled_for', { ascending: false })
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`reminder_code.ilike.%${options.search}%,notes.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toReminderRecord) as Angelcare360PaymentReminderListRecord[]
}

export async function createAngelcare360PaymentReminder(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ReminderCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de relance invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    invoice_id: parsed.data.invoiceId,
    student_id: parsed.data.studentId || null,
    reminder_code: parsed.data.reminderCode || buildCode('REM'),
    reminder_type: parsed.data.reminderType,
    scheduled_for: parsed.data.scheduledFor,
    sent_at: null,
    channel: parsed.data.channel || 'email',
    status: parsed.data.status || 'planned',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_payment_reminders').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'reminder.created', severity: 'warning', schoolId: context.school!.id, entityType: 'payment_reminder', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function markAngelcare360ReminderBlocked(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ReminderBlockedSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Blocage de relance invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_payment_reminders').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La relance est introuvable.' }
  const { data, error } = await client.from('angelcare360_payment_reminders').update({ status: 'blocked', updated_at: new Date().toISOString(), metadata_json: { ...(before.data.metadata_json || {}), blocked_reason: parsed.data.reason } }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'reminder.blocked_not_sent', severity: 'warning', schoolId: context.school!.id, entityType: 'payment_reminder', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: { status: 'blocked', reason: parsed.data.reason } })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360StudentBalances(options?: { schoolId?: string | null; search?: string | null; classId?: string | null; sectionId?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let studentsQuery = client
    .from('angelcare360_students')
    .select('id, school_id, student_code, full_name, current_class_id, current_section_id, current_class:angelcare360_classes(id, name, class_code), current_section:angelcare360_sections(id, name, section_code)')
    .eq('school_id', context.school.id)
    .order('full_name', { ascending: true })
    .limit(300)
  if (options?.classId) studentsQuery = studentsQuery.eq('current_class_id', options.classId)
  if (options?.sectionId) studentsQuery = studentsQuery.eq('current_section_id', options.sectionId)
  if (options?.search) studentsQuery = studentsQuery.or(`student_code.ilike.%${options.search}%,full_name.ilike.%${options.search}%`)
  const [{ data: students }, { data: invoices }, { data: discounts }, { data: payments }, { data: assignments }] = await Promise.all([
    studentsQuery,
    client.from('angelcare360_invoices').select('id, student_id, currency, total_amount, amount_paid, discount_total, balance_due, status').eq('school_id', context.school.id),
    client.from('angelcare360_discounts').select('student_id, amount, status').eq('school_id', context.school.id),
    client.from('angelcare360_payments').select('student_id, amount, status').eq('school_id', context.school.id),
    client.from('angelcare360_student_fee_assignments').select('student_id').eq('school_id', context.school.id).eq('status', 'active'),
  ])
  const invoiceRows = (invoices || []) as Row[]
  const discountRows = (discounts || []) as Row[]
  const paymentRows = (payments || []) as Row[]
  const assignmentSet = new Set(((assignments || []) as Row[]).map((row) => String(row.student_id)))
  const studentBalances = new Map<string, Angelcare360StudentBalanceRecord>()
  for (const student of (students || []) as Row[]) {
    const studentId = String(student.id)
    const studentInvoices = invoiceRows.filter((row) => String(row.student_id) === studentId && statusIsChargeableInvoice(asString(row.status)))
    const studentDiscounts = discountRows.filter((row) => String(row.student_id) === studentId && statusIsActiveDiscount(asString(row.status)))
    const studentPayments = paymentRows.filter((row) => String(row.student_id) === studentId && asString(row.status) === 'confirmed')
    const invoicedTotal = moneyTotal(studentInvoices, 'total_amount')
    const paidTotal = moneyTotal(studentPayments, 'amount')
    const discountTotal = moneyTotal(studentDiscounts, 'amount')
    const outstandingTotal = Math.max(invoicedTotal - paidTotal - discountTotal, 0)
    studentBalances.set(studentId, {
      schoolId: context.school.id,
      studentId,
      studentFullName: asString(student.full_name),
      studentCode: asOptionalString(student.student_code),
      className: asString(student.current_class?.name || null) || null,
      classCode: asString(student.current_class?.class_code || null) || null,
      sectionName: asString(student.current_section?.name || null) || null,
      sectionCode: asString(student.current_section?.section_code || null) || null,
      invoicedTotal,
      paidTotal,
      discountTotal,
      outstandingTotal,
      currency: studentInvoices[0]?.currency || context.school.currency || 'MAD',
      isPartialCalculation: !assignmentSet.has(studentId),
      detailHref: `/angelcare-360-command-center/people/eleves/${studentId}`,
    })
  }
  return Array.from(studentBalances.values())
}

export async function getAngelcare360StudentAccountStatement(options: { schoolId?: string | null; studentId: string }) {
  const context = await getContextOrNull(options.schoolId)
  if (!context?.school) return null
  const client = await createClient()
  const [studentResponse, invoicesResponse, paymentsResponse, discountsResponse, remindersResponse] = await Promise.all([
    client.from('angelcare360_students').select('id, school_id, student_code, full_name, current_class:angelcare360_classes(id, name, class_code), current_section:angelcare360_sections(id, name, section_code)').eq('school_id', context.school.id).eq('id', options.studentId).maybeSingle(),
    client.from('angelcare360_invoices').select('id, invoice_number, invoice_date, total_amount, amount_paid, discount_total, balance_due, status').eq('school_id', context.school.id).eq('student_id', options.studentId),
    client.from('angelcare360_payments').select('id, payment_number, payment_date, amount, status').eq('school_id', context.school.id).eq('student_id', options.studentId),
    client.from('angelcare360_discounts').select('id, discount_code, created_at, amount, status, invoice_id').eq('school_id', context.school.id).eq('student_id', options.studentId),
    client.from('angelcare360_payment_reminders').select('id, reminder_code, scheduled_for, status').eq('school_id', context.school.id).eq('student_id', options.studentId),
  ])
  if (!studentResponse.data) return null
  const movements: Angelcare360AccountStatementMovementRecord[] = []
  for (const invoice of (invoicesResponse.data || []) as Row[]) {
    movements.push({ movementType: 'invoice', movementId: String(invoice.id), movementCode: String(invoice.invoice_number), movementDate: String(invoice.invoice_date), label: 'Facture émise', amount: Number(invoice.total_amount || 0), balanceAfter: Number(invoice.balance_due || 0), status: String(invoice.status) })
  }
  for (const payment of (paymentsResponse.data || []) as Row[]) {
    movements.push({ movementType: 'payment', movementId: String(payment.id), movementCode: String(payment.payment_number), movementDate: String(payment.payment_date), label: 'Paiement reçu', amount: -Number(payment.amount || 0), balanceAfter: 0, status: String(payment.status) })
  }
  for (const discount of (discountsResponse.data || []) as Row[]) {
    movements.push({ movementType: 'discount', movementId: String(discount.id), movementCode: String(discount.discount_code), movementDate: String(discount.created_at || new Date().toISOString()), label: 'Remise appliquée', amount: -Number(discount.amount || 0), balanceAfter: 0, status: String(discount.status) })
  }
  for (const reminder of (remindersResponse.data || []) as Row[]) {
    movements.push({ movementType: 'reminder', movementId: String(reminder.id), movementCode: String(reminder.reminder_code), movementDate: String(reminder.scheduled_for), label: 'Relance de recouvrement', amount: 0, balanceAfter: 0, status: String(reminder.status) })
  }
  movements.sort((a, b) => String(a.movementDate).localeCompare(String(b.movementDate)))
  let balance = 0
  const enriched = movements.map((movement) => {
    balance += movement.amount
    return { ...movement, balanceAfter: balance }
  })
  return {
    schoolId: context.school.id,
    studentId: options.studentId,
    studentFullName: asString(studentResponse.data.full_name),
    studentCode: asOptionalString(studentResponse.data.student_code),
    className: asString((studentResponse.data as Row).current_class?.name || null) || null,
    classCode: asString((studentResponse.data as Row).current_class?.class_code || null) || null,
    sectionName: asString((studentResponse.data as Row).current_section?.name || null) || null,
    sectionCode: asString((studentResponse.data as Row).current_section?.section_code || null) || null,
    currency: context.school.currency || 'MAD',
    openingBalance: 0,
    closingBalance: balance,
    movements: enriched,
    isPartialCalculation: false,
  } as Angelcare360AccountStatementRecord
}

export async function listAngelcare360Expenses(options?: { schoolId?: string | null; status?: string | null; search?: string | null }) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_expenses')
    .select('id, school_id, academic_year_id, expense_code, expense_date, category, vendor_name, account_id, amount, currency, payment_method, notes, status, created_at, updated_at, account:angelcare360_finance_accounts(id, label), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school.id)
    .order('expense_date', { ascending: false })
  if (options?.status) query = query.eq('status', options.status)
  if (options?.search) query = query.or(`expense_code.ilike.%${options.search}%,vendor_name.ilike.%${options.search}%,category.ilike.%${options.search}%`)
  const { data } = await query
  return ((data || []) as Row[]).map(toExpenseRecord) as Angelcare360ExpenseListRecord[]
}

export async function createAngelcare360Expense(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ExpenseCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de dépense invalide.') }
  const context = await requireAngelcare360Permission('finance.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId || context.academicYear?.id || null,
    expense_code: parsed.data.expenseCode || buildCode('EXP'),
    expense_date: parsed.data.expenseDate || new Date().toISOString().slice(0, 10),
    category: parsed.data.category,
    vendor_name: parsed.data.vendorName,
    account_id: parsed.data.accountId || null,
    amount: parsed.data.amount,
    currency: parsed.data.currency || 'MAD',
    payment_method: parsed.data.paymentMethod || 'cash',
    notes: parsed.data.notes || null,
    status: parsed.data.status || 'draft',
    metadata_json: { source: 'phase8' },
  }
  const { data, error } = await client.from('angelcare360_expenses').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'expense.created', severity: 'info', schoolId: context.school!.id, entityType: 'expense', entityId: String(data.id), afterData: payload as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Expense(input: Record<string, unknown>): Promise<Angelcare360FinanceMutationResult<{ id: string }>> {
  const parsed = angelcare360ExpenseUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Payload de dépense invalide.') }
  const context = await requireAngelcare360Permission('finance.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_expenses').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'La dépense est introuvable.' }
  const { data, error } = await client.from('angelcare360_expenses').update({
    academic_year_id: parsed.data.academicYearId || null,
    expense_code: parsed.data.expenseCode || before.data.expense_code,
    expense_date: parsed.data.expenseDate || before.data.expense_date,
    category: parsed.data.category,
    vendor_name: parsed.data.vendorName,
    account_id: parsed.data.accountId || null,
    amount: parsed.data.amount,
    currency: parsed.data.currency || before.data.currency || 'MAD',
    payment_method: parsed.data.paymentMethod || before.data.payment_method,
    notes: parsed.data.notes || null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('id').single()
  if (error) return { ok: false, error: error.message }
  await auditFinanceEvent({ action: 'expense.updated', severity: 'info', schoolId: context.school!.id, entityType: 'expense', entityId: String(data.id), beforeData: before.data as Record<string, unknown>, afterData: parsed.data as Record<string, unknown> })
  return { ok: true, record: { id: String(data.id) } }
}

export async function listAngelcare360FinanceAuditEvents(options?: Angelcare360FinanceAuditFilter) {
  const context = await getContextOrNull(options?.schoolId)
  if (!context?.school) return []
  const client = await createClient()
  let query = client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .in('module', [FINANCE_MODULE, PAYMENT_MODULE, 'frais', 'remises', 'relances'])
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
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360FinanceExport(input: { schoolId?: string | null; reason?: string | null; entityType?: string | null; entityId?: string | null }) {
  const context = await getContextOrNull(input.schoolId)
  if (!context?.school) return { ok: false, error: 'Aucun établissement actif n’est disponible.' }
  await auditFinanceEvent({
    action: 'finance_export.blocked_not_available',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: input.entityType || 'finance_export',
    entityId: input.entityId || context.school.id,
    afterData: { reason: input.reason || BLOCKED_EXPORT_MESSAGE },
  })
  return { ok: true, locked: true, reason: input.reason || BLOCKED_EXPORT_MESSAGE }
}
