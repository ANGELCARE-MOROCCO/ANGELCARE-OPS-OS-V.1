import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAngelcare360A4PdfBytes } from '@/lib/angelcare360/documents/pdf'
import { buildCustomerFinanceDocumentModel } from '@/lib/angelcare360/documents/finance'
import { requireProductRealityOperation } from '@/lib/angelcare360/server/product-reality'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import {
  applyAngelcare360Discount,
  confirmAngelcare360Payment,
  createAngelcare360Discount,
  createAngelcare360Expense,
  createAngelcare360FeeItem,
  createAngelcare360FeeStructure,
  createAngelcare360Invoice,
  createAngelcare360PaymentReminder,
  createAngelcare360ReceiptFromPayment,
  createAngelcare360StudentFeeAssignment,
  decideAngelcare360Discount,
  getAngelcare360FinanceOverview,
  getAngelcare360StudentAccountStatement,
  issueAngelcare360Invoice,
  listAngelcare360Discounts,
  listAngelcare360FeeStructures,
  listAngelcare360Expenses,
  listAngelcare360Invoices,
  listAngelcare360PaymentReminders,
  listAngelcare360Payments,
  listAngelcare360Receipts,
  listAngelcare360StudentBalances,
  listAngelcare360StudentFeeAssignments,
  recordAngelcare360Payment,
} from '@/lib/angelcare360/server/finance'
import { getFinanceAuthorityOperation } from '@/data/angelcare360/customer-finance-authority'
import type {
  FinanceAuthorityCommandRequest,
  FinanceAuthorityCommandResult,
  FinanceAuthorityMetric,
  FinanceAuthorityRecord,
  FinanceAuthorityScene,
  FinanceAuthoritySnapshot,
} from '@/types/angelcare360/customer-finance-authority'

type Row = Record<string, unknown>
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>
const FINANCE_DOCUMENT_BUCKET = 'angelcare360-finance-documents'

function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
function string(value: unknown, fallback = ''): string { return value === null || value === undefined ? fallback : String(value) }
function optional(value: unknown): string | null { const rendered = string(value).trim(); return rendered || null }
function numeric(value: unknown, fallback = 0): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function boolean(value: unknown, fallback = false): boolean { return typeof value === 'boolean' ? value : value === 'true' || value === 1 || value === '1' ? true : value === 'false' || value === 0 || value === '0' ? false : fallback }
function now() { return new Date().toISOString() }
function today() { return new Date().toISOString().slice(0, 10) }
function stableHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function code(prefix: string) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}` }
function required(payload: Row, key: string, label: string) { const value = optional(payload[key]); if (!value) throw new Error(`${label} est requis.`); return value }

function decimalToCents(value: unknown): number {
  const raw = string(value, '0').trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error(`Montant invalide: ${raw || 'vide'}.`)
  const negative = raw.startsWith('-')
  const normalized = negative ? raw.slice(1) : raw
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2))
  if (!Number.isSafeInteger(cents)) throw new Error('Montant hors limite autorisée.')
  return negative ? -cents : cents
}
function centsToDecimal(cents: number) { return (cents / 100).toFixed(2) }
function money(value: unknown, currency = 'Dh') { return `${numeric(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}` }

async function safeRows(client: ServiceClient, table: string, schoolId: string, limit = 60, order = 'created_at') {
  const { data, error } = await client.from(table).select('*').eq('school_id', schoolId).order(order, { ascending: false }).limit(limit)
  return error ? [] as Row[] : (data || []) as Row[]
}
async function safeCount(client: ServiceClient, table: string, schoolId: string, filters: Array<[string, unknown]> = []) {
  let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
  for (const [column, value] of filters) query = query.eq(column, value as never)
  const { count, error } = await query
  return error ? 0 : count || 0
}


async function ensurePayerAccountForStudent(
  client: ServiceClient,
  schoolId: string,
  userId: string,
  studentId: string,
) {
  const { data: existingMember, error: memberError } = await client
    .from('angelcare360_finance_payer_account_members')
    .select('payer_account_id, payer_account:angelcare360_finance_payer_accounts(*)')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (memberError && memberError.code !== 'PGRST116') throw new Error(memberError.message)
  const linked = row(existingMember)
  if (linked.payer_account_id) return row(linked.payer_account)

  const { data: student, error: studentError } = await client
    .from('angelcare360_students')
    .select('id,student_code,full_name,status')
    .eq('school_id', schoolId)
    .eq('id', studentId)
    .single()
  if (studentError) throw new Error(studentError.message)
  const studentRow = row(student)
  const accountCode = `STU-${string(studentRow.student_code || studentId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32).toUpperCase()}`

  const { data: account, error: accountError } = await client
    .from('angelcare360_finance_payer_accounts')
    .upsert({
      school_id: schoolId,
      account_code: accountCode,
      account_type: 'family',
      label: `Compte famille · ${string(studentRow.full_name, string(studentRow.student_code, 'Élève'))}`,
      currency: 'MAD',
      status: 'active',
      created_by: userId,
      updated_at: now(),
    }, { onConflict: 'school_id,account_code' })
    .select('*')
    .single()
  if (accountError) throw new Error(accountError.message)
  const accountRow = row(account)

  const { error: linkError } = await client
    .from('angelcare360_finance_payer_account_members')
    .upsert({
      school_id: schoolId,
      payer_account_id: accountRow.id,
      student_id: studentId,
      responsibility_type: 'primary_payer',
      allocation_percentage: 100,
      effective_from: today(),
      status: 'active',
    }, { onConflict: 'school_id,payer_account_id,student_id' })
  if (linkError) throw new Error(linkError.message)
  return accountRow
}

const PERIOD_LOCK_EXEMPT = new Set<FinanceAuthorityCommandRequest['operationKey']>([
  'finance.period.create',
  'finance.period.close',
  'finance.period.reopen',
  'finance.report.execute',
  'finance.export.execute',
  'finance.document.generate',
  'finance.document.template.publish',
  'finance.approval.decide',
])

function operationDate(payload: Row): string {
  return optional(
    payload.effectiveDate
    || payload.invoiceDate
    || payload.paymentDate
    || payload.expenseDate
    || payload.dueDate
    || payload.date
  ) || today()
}

async function assertFinancePeriodOpen(
  client: ServiceClient,
  schoolId: string,
  operationKey: FinanceAuthorityCommandRequest['operationKey'],
  payload: Row,
) {
  if (PERIOD_LOCK_EXEMPT.has(operationKey)) return
  const date = operationDate(payload)
  const { data, error } = await client
    .from('angelcare360_finance_periods')
    .select('id,label,date_from,date_to,status')
    .eq('school_id', schoolId)
    .eq('status', 'closed')
    .lte('date_from', date)
    .gte('date_to', date)
    .limit(1)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (data) {
    throw new Error(`La période financière « ${string(row(data).label, 'clôturée')} » verrouille cette opération à la date ${date}.`)
  }
}

async function loadUnallocatedPaymentBlockers(client: ServiceClient, schoolId: string) {
  const { data, error } = await client
    .from('angelcare360_payments')
    .select('id,amount,allocated_amount,status')
    .eq('school_id', schoolId)
    .eq('status', 'confirmed')
    .limit(2000)
  if (error) return 0
  return ((data || []) as Row[]).filter((payment) => {
    return decimalToCents(payment.amount || 0) > decimalToCents(payment.allocated_amount || 0)
  }).length
}

async function createFinanceNotificationIntent(
  client: ServiceClient,
  input: {
    schoolId: string
    userId: string
    executionId: string
    intentType: string
    sourceType: string
    sourceId: string
    recipientId?: string | null
    templatePurpose: string
    deduplicationKey: string
    metadata?: Row
  },
) {
  const { error } = await client.from('angelcare360_notification_intents').upsert({
    school_id: input.schoolId,
    intent_type: input.intentType,
    source_entity_type: input.sourceType,
    source_entity_id: input.sourceId,
    recipient_id: input.recipientId || null,
    template_purpose: input.templatePurpose,
    deduplication_key: input.deduplicationKey,
    status: 'pending',
    entitlement_state: 'eligible',
    requested_by: input.userId,
    requested_at: now(),
    metadata_json: { ...input.metadata, finance_execution_id: input.executionId },
  }, { onConflict: 'school_id,deduplication_key' })
  if (error) throw new Error(error.message)
}

function toRecord(input: Row, fallbackPrefix: string): FinanceAuthorityRecord {
  const amount = input.amount ?? input.total_amount ?? input.balance_due ?? input.outstanding_amount ?? input.current_balance ?? null
  const status = string(input.status || input.state || 'active')
  const tone = ['failed','blocked','overdue','broken','rejected','critical'].includes(status) ? 'critical'
    : ['pending','requested','review','unallocated','warning','disputed'].includes(status) ? 'warning'
      : ['approved','paid','completed','reconciled','issued','active','published'].includes(status) ? 'healthy'
        : ['processing','open','in_progress'].includes(status) ? 'active' : 'neutral'
  return {
    id: string(input.id || `${fallbackPrefix}-${stableHash(input).slice(0, 10)}`),
    code: string(input.code || input.fee_code || input.invoice_number || input.payment_number || input.receipt_number || input.expense_code || input.case_code || input.run_code || input.reference || '—'),
    title: string(input.title || input.label || input.student_full_name || input.payer_name || input.vendor_name || input.invoice_number || input.payment_number || 'Enregistrement financier'),
    subtitle: string(input.description || input.reason || input.student_code || input.invoice_number || input.method || input.category || input.detail || status),
    status,
    tone,
    amount: amount === null ? null : money(amount, string(input.currency || 'Dh')),
    date: optional(input.due_date || input.payment_date || input.invoice_date || input.expense_date || input.created_at),
    owner: optional(input.owner_name || input.assignee_name || input.recorded_by),
    href: optional(input.detail_href || input.href),
    meta: {},
  }
}

async function nextFinanceNumber(client: ServiceClient, schoolId: string, sequenceKey: string, prefix: string) {
  const { data, error } = await client.rpc('angelcare360_next_finance_number', { p_school_id: schoolId, p_sequence_key: sequenceKey, p_prefix: prefix })
  if (error) throw new Error(error.message)
  return string(data)
}

async function beginFinanceExecution(client: ServiceClient, schoolId: string, userId: string, request: FinanceAuthorityCommandRequest) {
  const idempotencyKey = optional(request.idempotencyKey) || stableHash({ schoolId, operationKey: request.operationKey, entityId: request.entityId || null, payload: request.payload || {} })
  const { data: existing, error: existingError } = await client.from('angelcare360_finance_authority_executions').select('*').eq('school_id', schoolId).eq('idempotency_key', idempotencyKey).maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing && ['completed','approval_required'].includes(string(row(existing).state))) return { execution: row(existing), replay: true }
  if (existing) {
    const { data, error } = await client.from('angelcare360_finance_authority_executions').update({ state: 'processing', attempt_count: numeric(row(existing).attempt_count) + 1, started_at: now(), last_error: null }).eq('id', row(existing).id as never).select('*').single()
    if (error) throw new Error(error.message)
    return { execution: row(data), replay: false }
  }
  const { data, error } = await client.from('angelcare360_finance_authority_executions').insert({
    school_id: schoolId,
    operation_key: request.operationKey,
    entity_id: request.entityId || null,
    idempotency_key: idempotencyKey,
    request_payload: request.payload || {},
    state: 'processing',
    requested_by: userId,
    started_at: now(),
  }).select('*').single()
  if (error) throw new Error(error.message)
  return { execution: row(data), replay: false }
}

async function finishExecution(client: ServiceClient, executionId: string, state: string, result: Row, errorMessage?: string | null) {
  await client.from('angelcare360_finance_authority_executions').update({ state, result_payload: result, last_error: errorMessage || null, completed_at: ['completed','failed','rejected','approval_required'].includes(state) ? now() : null }).eq('id', executionId)
}

async function requestApproval(client: ServiceClient, schoolId: string, userId: string, request: FinanceAuthorityCommandRequest, executionId: string) {
  const idempotencyKey = `finance:${request.operationKey}:${executionId}:approval`
  const { data: existing } = await client.from('angelcare360_product_reality_approvals').select('*').eq('school_id', schoolId).eq('idempotency_key', idempotencyKey).maybeSingle()
  if (existing) return row(existing)
  const definition = getFinanceAuthorityOperation(request.operationKey)
  const { data, error } = await client.from('angelcare360_product_reality_approvals').insert({
    school_id: schoolId,
    domain: 'finance',
    operation_key: request.operationKey,
    entity_type: 'finance_authority',
    entity_id: request.entityId || null,
    status: 'open',
    decision: 'pending',
    reason: request.reason || definition?.label || request.operationKey,
    evidence_json: row(request.payload?.evidence),
    request_payload: { ...request.payload, financeExecutionId: executionId, originalOperationKey: request.operationKey, originalEntityId: request.entityId || null, originalIdempotencyKey: request.idempotencyKey || null },
    requested_by: userId,
    requested_at: now(),
    requested_execution_id: null,
    idempotency_key: idempotencyKey,
  }).select('*').single()
  if (error) throw new Error(error.message)
  return row(data)
}

async function generateFinanceDocument(input: { client: ServiceClient; schoolId: string; schoolName: string; userId: string; kind: Parameters<typeof buildCustomerFinanceDocumentModel>[0]['kind']; source: Row; lines?: Row[]; movements?: Row[]; sourceType: string; sourceId: string }) {
  const documentNumber = await nextFinanceNumber(input.client, input.schoolId, `document:${input.kind}`, input.kind.toUpperCase().slice(0, 3))
  const model = buildCustomerFinanceDocumentModel({ kind: input.kind, schoolName: input.schoolName, referenceCode: documentNumber, source: input.source, lines: input.lines, movements: input.movements, currency: string(input.source.currency || 'Dh') })
  const bytes = await generateAngelcare360A4PdfBytes(model)
  const checksum = createHash('sha256').update(bytes).digest('hex')
  const storagePath = `${input.schoolId}/${input.kind}/${input.sourceId}/${documentNumber}.pdf`
  const { error: uploadError } = await input.client.storage.from(FINANCE_DOCUMENT_BUCKET).upload(storagePath, bytes, { contentType: 'application/pdf', upsert: false })
  if (uploadError && !uploadError.message.toLowerCase().includes('already exists')) throw new Error(uploadError.message)
  const { data, error } = await input.client.from('angelcare360_finance_document_versions').insert({
    school_id: input.schoolId,
    document_number: documentNumber,
    document_type: input.kind,
    source_type: input.sourceType,
    source_id: input.sourceId,
    source_revision_hash: stableHash(input.source),
    template_key: model.templateKey,
    template_version: model.version,
    storage_bucket: FINANCE_DOCUMENT_BUCKET,
    storage_path: storagePath,
    checksum_sha256: checksum,
    size_bytes: bytes.byteLength,
    status: 'generated',
    generated_by: input.userId,
    generated_at: now(),
    metadata_json: { model },
  }).select('*').single()
  if (error) throw new Error(error.message)
  return row(data)
}

async function billingPreview(client: ServiceClient, schoolId: string, payload: Row) {
  const academicYearId = required(payload, 'academicYearId', 'Année scolaire')
  let query = client.from('angelcare360_student_fee_assignments').select('*, angelcare360_fee_structures(*, angelcare360_fee_items(*))').eq('school_id', schoolId).eq('academic_year_id', academicYearId).eq('status', 'active')
  const assignmentIds = array(payload.assignmentIds).map(String).filter(Boolean)
  if (assignmentIds.length) query = query.in('id', assignmentIds)
  const { data, error } = await query.limit(500)
  if (error) throw new Error(error.message)
  const items = ((data || []) as unknown as Row[]).map((assignment: Row) => {
    const record = row(assignment)
    const structure = row(record.angelcare360_fee_structures)
    const feeItems = array(structure.angelcare360_fee_items).map(row).filter((item: Row) => string(item.status) === 'active')
    const amountCents = feeItems.reduce((sum: number, item: Row) => sum + decimalToCents(item.amount || 0), 0)
    return { assignmentId: string(record.id), studentId: string(record.student_id), feeStructureId: string(record.fee_structure_id), amount: centsToDecimal(amountCents), feeItemCount: feeItems.length, status: feeItems.length ? 'eligible' : 'blocked', blockers: feeItems.length ? [] : ['Aucune ligne de frais active.'] }
  })
  return { academicYearId, eligibleCount: items.filter((item: { status: string }) => item.status === 'eligible').length, blockedCount: items.filter((item: { status: string }) => item.status === 'blocked').length, totalAmount: centsToDecimal(items.reduce((sum: number, item: { amount: string }) => sum + decimalToCents(item.amount), 0)), items }
}

async function executeBillingRun(client: ServiceClient, schoolId: string, userId: string, payload: Row, idempotencyKey: string) {
  const preview = await billingPreview(client, schoolId, payload)
  const { data: run, error: runError } = await client.from('angelcare360_finance_billing_runs').insert({ school_id: schoolId, academic_year_id: preview.academicYearId, run_code: code('BILL'), idempotency_key: idempotencyKey, status: 'processing', preview_json: preview, requested_by: userId, started_at: now() }).select('*').single()
  if (runError) {
    if (runError.code === '23505') {
      const { data: existing, error } = await client.from('angelcare360_finance_billing_runs').select('*').eq('school_id', schoolId).eq('idempotency_key', idempotencyKey).single()
      if (error) throw new Error(error.message)
      return row(existing)
    }
    throw new Error(runError.message)
  }
  const runRow = row(run)
  let created = 0
  let skipped = 0
  const failures: Row[] = []
  for (const itemValue of preview.items) {
    const item = row(itemValue)
    if (string(item.status) !== 'eligible') { skipped += 1; continue }
    try {
      const assignmentId = string(item.assignmentId)
      const { data: assignment, error: assignmentError } = await client.from('angelcare360_student_fee_assignments').select('*, angelcare360_fee_structures(*, angelcare360_fee_items(*))').eq('school_id', schoolId).eq('id', assignmentId).single()
      if (assignmentError) throw new Error(assignmentError.message)
      const assignmentRow = row(assignment)
      const structure = row(assignmentRow.angelcare360_fee_structures)
      const feeItems = array(structure.angelcare360_fee_items).map(row).filter((feeItem) => string(feeItem.status) === 'active')
      const invoiceNumber = await nextFinanceNumber(client, schoolId, 'invoice', 'FAC')
      const totalCents = feeItems.reduce((sum, feeItem) => sum + decimalToCents(feeItem.amount || 0), 0)
      const { data: invoice, error: invoiceError } = await client.from('angelcare360_invoices').insert({
        school_id: schoolId,
        academic_year_id: preview.academicYearId,
        student_id: assignmentRow.student_id,
        invoice_number: invoiceNumber,
        invoice_type: 'school_fee',
        invoice_date: today(),
        due_date: optional(payload.dueDate) || today(),
        currency: string(structure.currency || 'MAD'),
        subtotal_amount: centsToDecimal(totalCents),
        discount_total: '0.00',
        tax_total: '0.00',
        total_amount: centsToDecimal(totalCents),
        amount_paid: '0.00',
        status: 'draft',
        metadata_json: { billingRunId: runRow.id, assignmentId },
      }).select('*').single()
      if (invoiceError) throw new Error(invoiceError.message)
      const invoiceRow = row(invoice)
      if (feeItems.length) {
        const { error: lineError } = await client.from('angelcare360_invoice_lines').insert(feeItems.map((feeItem) => ({ school_id: schoolId, invoice_id: invoiceRow.id, fee_item_id: feeItem.id, line_code: feeItem.item_code, label: feeItem.label, quantity: 1, unit_amount: feeItem.amount, line_total: feeItem.amount, status: 'active' })))
        if (lineError) throw new Error(lineError.message)
      }
      await client.from('angelcare360_finance_billing_run_items').insert({ school_id: schoolId, billing_run_id: runRow.id, assignment_id: assignmentId, student_id: assignmentRow.student_id, invoice_id: invoiceRow.id, outcome: 'created', amount: centsToDecimal(totalCents), result_json: { invoiceNumber } })
      created += 1
    } catch (error) {
      failures.push({ assignmentId: item.assignmentId, error: error instanceof Error ? error.message : 'Échec inconnu' })
      await client.from('angelcare360_finance_billing_run_items').insert({ school_id: schoolId, billing_run_id: runRow.id, assignment_id: item.assignmentId, student_id: item.studentId, outcome: 'failed', amount: item.amount, result_json: failures.at(-1) })
    }
  }
  const state = failures.length ? (created ? 'partially_failed' : 'failed') : 'completed'
  const result = { created, skipped, failed: failures.length, failures, totalAmount: preview.totalAmount }
  const { data: completed, error } = await client.from('angelcare360_finance_billing_runs').update({ status: state, result_json: result, completed_at: now() }).eq('id', runRow.id as never).select('*').single()
  if (error) throw new Error(error.message)
  return row(completed)
}

async function performFinanceOperation(input: { client: ServiceClient; schoolId: string; schoolName: string; userId: string; executionId: string; request: FinanceAuthorityCommandRequest; bypassApproval: boolean }): Promise<Row> {
  const payload = row(input.request.payload)
  const schoolId = input.schoolId
  switch (input.request.operationKey) {
    case 'finance.fee.create': {
      const result = await createAngelcare360FeeStructure({
        schoolId,
        academicYearId: required(payload, 'academicYearId', 'Année scolaire'),
        feeCode: optional(payload.feeCode),
        label: required(payload, 'label', 'Libellé'),
        description: optional(payload.description),
        dueDayOfMonth: payload.dueDayOfMonth === undefined ? null : numeric(payload.dueDayOfMonth),
        currency: string(payload.currency || 'MAD'),
        appliesToLevel: optional(payload.appliesToLevel),
        status: 'draft',
      })
      if (!result.ok) throw new Error(result.error || 'La structure de frais n’a pas pu être créée.')
      return { feeStructure: result.record }
    }
    case 'finance.fee.item.create': {
      const result = await createAngelcare360FeeItem({
        schoolId,
        feeStructureId: required(payload, 'feeStructureId', 'Structure de frais'),
        itemCode: optional(payload.itemCode),
        label: required(payload, 'label', 'Libellé'),
        feeType: string(payload.feeType || 'tuition'),
        amount: numeric(centsToDecimal(decimalToCents(required(payload, 'amount', 'Montant')))),
        dueOn: optional(payload.dueOn),
        isRequired: boolean(payload.isRequired, true),
        status: 'active',
      })
      if (!result.ok) throw new Error(result.error || 'La ligne de frais n’a pas pu être créée.')
      return { feeItem: result.record }
    }
    case 'finance.installment_plan.create': {
      const totalCents = decimalToCents(required(payload, 'totalAmount', 'Montant total'))
      const depositCents = decimalToCents(payload.depositAmount || 0)
      const count = Math.max(1, Math.trunc(numeric(payload.installmentCount, 1)))
      if (depositCents < 0 || depositCents > totalCents) throw new Error('Le dépôt doit être compris entre zéro et le montant total.')
      const remainingCents = totalCents - depositCents
      const baseCents = Math.floor(remainingCents / count)
      const remainder = remainingCents - (baseCents * count)
      const startDate = new Date(optional(payload.firstDueDate) || today())
      if (Number.isNaN(startDate.getTime())) throw new Error('La première échéance est invalide.')
      const schedule = Array.from({ length: count }, (_, index) => {
        const due = new Date(startDate)
        due.setUTCMonth(due.getUTCMonth() + index)
        return {
          sequence: index + 1,
          dueDate: due.toISOString().slice(0, 10),
          amount: centsToDecimal(baseCents + (index === count - 1 ? remainder : 0)),
          status: 'scheduled',
        }
      })
      const planCode = optional(payload.planCode) || await nextFinanceNumber(input.client, schoolId, 'installment_plan', 'ECH')
      let payerAccountId = optional(payload.payerAccountId)
      const assignmentId = optional(payload.assignmentId)
      if (!payerAccountId && assignmentId) {
        const { data: assignment, error: assignmentError } = await input.client
          .from('angelcare360_student_fee_assignments')
          .select('student_id')
          .eq('school_id', schoolId)
          .eq('id', assignmentId)
          .single()
        if (assignmentError) throw new Error(assignmentError.message)
        payerAccountId = string((await ensurePayerAccountForStudent(input.client, schoolId, input.userId, string(row(assignment).student_id))).id)
      }
      const { data, error } = await input.client.from('angelcare360_finance_installment_plans').insert({
        school_id: schoolId,
        student_fee_assignment_id: assignmentId,
        payer_account_id: payerAccountId,
        plan_code: planCode,
        total_amount: centsToDecimal(totalCents),
        deposit_amount: centsToDecimal(depositCents),
        installment_count: count,
        schedule_json: schedule,
        current_revision: 1,
        status: 'draft',
        created_by: input.userId,
      }).select('*').single()
      if (error) throw new Error(error.message)
      await input.client.from('angelcare360_finance_installment_plan_revisions').insert({ school_id: schoolId, installment_plan_id: row(data).id, revision_number: 1, schedule_json: schedule, reason: optional(payload.reason) || 'Création de l’échéancier', created_by: input.userId })
      return { installmentPlan: data }
    }
    case 'finance.invoice.create': {
      const subtotalCents = decimalToCents(required(payload, 'subtotalAmount', 'Sous-total'))
      const discountCents = decimalToCents(payload.discountTotal || 0)
      const taxCents = decimalToCents(payload.taxTotal || 0)
      if (discountCents > subtotalCents + taxCents) throw new Error('La remise dépasse le montant facturable.')
      const totalCents = subtotalCents - discountCents + taxCents
      const invoiceNumber = optional(payload.invoiceNumber) || await nextFinanceNumber(input.client, schoolId, 'invoice', 'FAC')
      const result = await createAngelcare360Invoice({
        schoolId,
        academicYearId: required(payload, 'academicYearId', 'Année scolaire'),
        studentId: required(payload, 'studentId', 'Élève'),
        invoiceNumber,
        invoiceType: string(payload.invoiceType || 'manual'),
        invoiceDate: optional(payload.invoiceDate) || today(),
        dueDate: optional(payload.dueDate),
        currency: string(payload.currency || 'MAD'),
        subtotalAmount: numeric(centsToDecimal(subtotalCents)),
        discountTotal: numeric(centsToDecimal(discountCents)),
        taxTotal: numeric(centsToDecimal(taxCents)),
        totalAmount: numeric(centsToDecimal(totalCents)),
        amountPaid: 0,
        status: 'draft',
      })
      if (!result.ok) throw new Error(result.error || 'La facture n’a pas pu être créée.')
      return { invoice: result.record, invoiceNumber }
    }
    case 'finance.payment.confirm': {
      const paymentId = input.request.entityId || required(payload, 'paymentId', 'Paiement')
      const result = await confirmAngelcare360Payment({ schoolId, id: paymentId, reference: optional(payload.reference) })
      if (!result.ok) throw new Error(result.error || 'Le paiement n’a pas pu être confirmé.')
      return { payment: result.record }
    }
    case 'finance.discount.apply': {
      const discountId = input.request.entityId || required(payload, 'discountId', 'Remise')
      const result = await applyAngelcare360Discount({ schoolId, id: discountId, invoiceId: optional(payload.invoiceId) })
      if (!result.ok) throw new Error(result.error || 'La remise n’a pas pu être appliquée.')
      return { discount: result.record }
    }
    case 'finance.reminder.create': {
      const invoiceId = required(payload, 'invoiceId', 'Facture')
      const result = await createAngelcare360PaymentReminder({
        schoolId,
        invoiceId,
        studentId: optional(payload.studentId),
        reminderCode: optional(payload.reminderCode),
        reminderType: string(payload.reminderType || 'payment_due'),
        scheduledFor: required(payload, 'scheduledFor', 'Date de relance'),
        channel: string(payload.channel || 'email'),
        status: 'planned',
      })
      if (!result.ok) throw new Error(result.error || 'La relance n’a pas pu être créée.')
      await createFinanceNotificationIntent(input.client, {
        schoolId,
        userId: input.userId,
        executionId: input.executionId,
        intentType: string(payload.reminderType || 'payment_due'),
        sourceType: 'invoice',
        sourceId: invoiceId,
        recipientId: optional(payload.studentId),
        templatePurpose: `finance.${string(payload.reminderType || 'payment_due')}`,
        deduplicationKey: `finance:reminder:${invoiceId}:${string(payload.scheduledFor)}`,
        metadata: { channel: string(payload.channel || 'email'), reminderId: result.record?.id || null },
      })
      return { reminder: result.record, notificationIntent: 'pending' }
    }
    case 'finance.dispute.open': {
      const { data, error } = await input.client.from('angelcare360_finance_disputes').insert({
        school_id: schoolId,
        account_id: optional(payload.accountId),
        entity_type: required(payload, 'entityType', 'Type contesté'),
        entity_id: optional(payload.entityId),
        dispute_code: optional(payload.disputeCode) || code('LIT'),
        reason: required(payload, 'reason', 'Motif'),
        evidence_json: row(payload.evidence),
        status: 'opened',
        opened_by: input.userId,
        opened_at: now(),
      }).select('*').single()
      if (error) throw new Error(error.message)
      return { dispute: data }
    }
    case 'finance.reconciliation.session.open': {
      const { data, error } = await input.client.from('angelcare360_finance_reconciliation_sessions').insert({
        school_id: schoolId,
        session_code: optional(payload.sessionCode) || code('RAP'),
        source_type: required(payload, 'sourceType', 'Source de rapprochement'),
        source_reference: optional(payload.sourceReference),
        date_from: optional(payload.dateFrom),
        date_to: optional(payload.dateTo),
        status: 'open',
        summary_json: row(payload.summary),
        opened_by: input.userId,
        opened_at: now(),
      }).select('*').single()
      if (error) throw new Error(error.message)
      return { reconciliationSession: data }
    }
    case 'finance.period.create': {
      const dateFrom = required(payload, 'dateFrom', 'Date de début')
      const dateTo = required(payload, 'dateTo', 'Date de fin')
      if (dateTo < dateFrom) throw new Error('La fin de période doit être postérieure au début.')
      const { data: overlap, error: overlapError } = await input.client.from('angelcare360_finance_periods').select('id,label,date_from,date_to').eq('school_id', schoolId).lte('date_from', dateTo).gte('date_to', dateFrom).limit(1).maybeSingle()
      if (overlapError && overlapError.code !== 'PGRST116') throw new Error(overlapError.message)
      if (overlap) throw new Error(`Cette période chevauche « ${string(row(overlap).label, 'une période existante')} ».`)
      const { data, error } = await input.client.from('angelcare360_finance_periods').insert({
        school_id: schoolId,
        academic_year_id: optional(payload.academicYearId),
        period_code: optional(payload.periodCode) || code('PER'),
        label: required(payload, 'label', 'Libellé'),
        date_from: dateFrom,
        date_to: dateTo,
        status: 'open',
      }).select('*').single()
      if (error) throw new Error(error.message)
      return { period: data }
    }
    case 'finance.document.template.publish': {
      const templateCode = required(payload, 'templateCode', 'Code template')
      const versionNumber = Math.max(1, Math.trunc(numeric(payload.versionNumber, 1)))
      const { data: existing, error: existingError } = await input.client.from('angelcare360_finance_document_templates').select('*').eq('school_id', schoolId).eq('template_code', templateCode).eq('version_number', versionNumber).maybeSingle()
      if (existingError && existingError.code !== 'PGRST116') throw new Error(existingError.message)
      if (existing && string(row(existing).status) === 'published') return { template: existing, replay: true }
      const templatePayload = {
        school_id: schoolId,
        template_code: templateCode,
        document_type: required(payload, 'documentType', 'Type de document'),
        language: string(payload.language || 'fr'),
        version_number: versionNumber,
        data_contract: row(payload.dataContract),
        template_json: row(payload.template),
        status: 'published',
        effective_from: optional(payload.effectiveFrom) || now(),
        effective_to: optional(payload.effectiveTo),
        published_by: input.userId,
        published_at: now(),
      }
      const mutation = existing
        ? input.client.from('angelcare360_finance_document_templates').update(templatePayload).eq('id', row(existing).id).select('*').single()
        : input.client.from('angelcare360_finance_document_templates').insert(templatePayload).select('*').single()
      const { data, error } = await mutation
      if (error) throw new Error(error.message)
      return { template: data }
    }
    case 'finance.fee.version.publish': {
      const feeStructureId = required(payload, 'feeStructureId', 'Structure de frais')
      const { data: source, error: sourceError } = await input.client.from('angelcare360_fee_structures').select('*, angelcare360_fee_items(*)').eq('school_id', schoolId).eq('id', feeStructureId).single()
      if (sourceError) throw new Error(sourceError.message)
      const versionNumber = numeric(payload.versionNumber, 1)
      const { data, error } = await input.client.from('angelcare360_finance_fee_policy_versions').insert({ school_id: schoolId, fee_structure_id: feeStructureId, policy_code: string(row(source).fee_code), version_number: versionNumber, status: 'published', effective_from: optional(payload.effectiveFrom) || today(), effective_to: optional(payload.effectiveTo), policy_json: source, published_by: input.userId, published_at: now() }).select('*').single()
      if (error) throw new Error(error.message)
      return { policyVersion: data }
    }
    case 'finance.assignment.create': {
      const result = await createAngelcare360StudentFeeAssignment({ ...payload, schoolId })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      return { assignment: result.record }
    }
    case 'finance.installment_plan.approve': {
      const planId = input.request.entityId || required(payload, 'planId', 'Échéancier')
      const { data, error } = await input.client.from('angelcare360_finance_installment_plans').update({ status: 'active', approved_by: input.userId, approved_at: now(), current_revision: numeric(payload.currentRevision, 1) }).eq('school_id', schoolId).eq('id', planId).select('*').single()
      if (error) throw new Error(error.message)
      return { plan: data }
    }
    case 'finance.billing_run.preview': return { preview: await billingPreview(input.client, schoolId, payload) }
    case 'finance.billing_run.execute': return { billingRun: await executeBillingRun(input.client, schoolId, input.userId, payload, optional(input.request.idempotencyKey) || stableHash(payload)) }
    case 'finance.invoice.issue': {
      const invoiceId = input.request.entityId || required(payload, 'invoiceId', 'Facture')
      const result = await issueAngelcare360Invoice({ schoolId, id: invoiceId })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      const { data: invoice } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', invoiceId).single()
      const { data: lines } = await input.client.from('angelcare360_invoice_lines').select('*').eq('school_id', schoolId).eq('invoice_id', invoiceId)
      const document = invoice ? await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind: 'invoice', source: row(invoice), lines: (lines || []) as Row[], sourceType: 'invoice', sourceId: invoiceId }) : null
      return { invoice: result.record, document }
    }
    case 'finance.invoice.credit': {
      const invoiceId = input.request.entityId || required(payload, 'invoiceId', 'Facture')
      const amountCents = decimalToCents(required(payload, 'amount', 'Montant avoir'))
      if (amountCents <= 0) throw new Error('Le montant de l’avoir doit être positif.')
      const creditNumber = await nextFinanceNumber(input.client, schoolId, 'credit_note', 'AVR')
      const { data: invoice, error: invoiceError } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', invoiceId).single()
      if (invoiceError) throw new Error(invoiceError.message)
      const invoiceRow = row(invoice)
      const balanceCents = decimalToCents(invoiceRow.total_amount || 0) - decimalToCents(invoiceRow.amount_paid || 0)
      if (amountCents > balanceCents) throw new Error('L’avoir dépasse le solde disponible de la facture.')
      const nextDiscountCents = decimalToCents(invoiceRow.discount_total || 0) + amountCents
      const nextTotalCents = decimalToCents(invoiceRow.total_amount || 0) - amountCents
      const afterInvoice = {
        ...invoiceRow,
        discount_total: centsToDecimal(nextDiscountCents),
        total_amount: centsToDecimal(nextTotalCents),
        status: amountCents === balanceCents ? 'credited' : invoiceRow.status,
      }
      const { data: credit, error } = await input.client.from('angelcare360_finance_credit_notes').insert({ school_id: schoolId, invoice_id: invoiceId, credit_number: creditNumber, amount: centsToDecimal(amountCents), currency: invoiceRow.currency, reason: required(payload, 'reason', 'Motif'), status: 'issued', issued_by: input.userId, issued_at: now() }).select('*').single()
      if (error) throw new Error(error.message)
      const { count } = await input.client.from('angelcare360_finance_invoice_revisions').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('invoice_id', invoiceId)
      const revisionNumber = (count || 0) + 1
      const { error: revisionError } = await input.client.from('angelcare360_finance_invoice_revisions').insert({ school_id: schoolId, invoice_id: invoiceId, revision_number: revisionNumber, revision_type: 'credit_note', before_json: invoiceRow, after_json: afterInvoice, reason: required(payload, 'reason', 'Motif'), revised_by: input.userId, revised_at: now() })
      if (revisionError) throw new Error(revisionError.message)
      const { error: updateError } = await input.client.from('angelcare360_invoices').update({ discount_total: afterInvoice.discount_total, total_amount: afterInvoice.total_amount, status: afterInvoice.status, updated_at: now(), metadata_json: { ...row(invoiceRow.metadata_json), lastCreditNoteId: row(credit).id, lastRevision: revisionNumber } }).eq('id', invoiceId).eq('school_id', schoolId)
      if (updateError) throw new Error(updateError.message)
      const document = await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind: 'credit_note', source: { ...row(credit), total_amount: centsToDecimal(amountCents), invoice_number: invoiceRow.invoice_number }, sourceType: 'credit_note', sourceId: string(row(credit).id) })
      return { creditNote: credit, revisionNumber, document }
    }
    case 'finance.invoice.cancel': {
      const invoiceId = input.request.entityId || required(payload, 'invoiceId', 'Facture')
      const { data, error } = await input.client.from('angelcare360_invoices').update({ status: 'cancelled', metadata_json: { cancelReason: required(payload, 'reason', 'Motif'), cancelledBy: input.userId, cancelledAt: now() } }).eq('school_id', schoolId).eq('id', invoiceId).in('status', ['draft','issued','sent','overdue']).select('*').single()
      if (error) throw new Error(error.message)
      return { invoice: data }
    }
    case 'finance.payment.capture': {
      const result = await recordAngelcare360Payment({ ...payload, schoolId })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      return { payment: result.record }
    }
    case 'finance.payment.allocate': {
      const paymentId = input.request.entityId || required(payload, 'paymentId', 'Paiement')
      const requestedAllocations = array(payload.allocations).map(row)
      if (!requestedAllocations.length) requestedAllocations.push({ invoiceId: required(payload, 'invoiceId', 'Facture'), amount: payload.amount })
      const { data: payment, error: paymentError } = await input.client.from('angelcare360_payments').select('*').eq('school_id', schoolId).eq('id', paymentId).single()
      if (paymentError) throw new Error(paymentError.message)
      const paymentRow = row(payment)
      if (string(paymentRow.status) !== 'confirmed') throw new Error('Le paiement doit être confirmé avant affectation.')
      const { data: activeAllocations, error: allocationLoadError } = await input.client.from('angelcare360_finance_payment_allocations').select('*').eq('school_id', schoolId).eq('payment_id', paymentId).eq('status', 'active')
      if (allocationLoadError) throw new Error(allocationLoadError.message)
      const existingRows = (activeAllocations || []) as Row[]
      const existingCents = existingRows.reduce((sum, allocation) => sum + decimalToCents(allocation.amount || 0), 0)
      const normalized = requestedAllocations.map((allocation) => {
        const invoiceId = required(allocation, 'invoiceId', 'Facture')
        const amountCents = decimalToCents(required(allocation, 'amount', 'Montant affecté'))
        if (amountCents <= 0) throw new Error('Chaque montant affecté doit être strictement positif.')
        return { invoiceId, amountCents }
      })
      const requestedCents = normalized.reduce((sum, allocation) => sum + allocation.amountCents, 0)
      const paymentCents = decimalToCents(paymentRow.amount || 0)
      if (existingCents + requestedCents > paymentCents) throw new Error('Les affectations dépassent le montant disponible du paiement.')
      const results: Row[] = []
      for (const allocation of normalized) {
        const idempotencyKey = `${input.executionId}:${allocation.invoiceId}`
        const { data: existing } = await input.client.from('angelcare360_finance_payment_allocations').select('*').eq('school_id', schoolId).eq('idempotency_key', idempotencyKey).maybeSingle()
        if (existing) { results.push(row(existing)); continue }
        const { data: invoice, error: invoiceError } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', allocation.invoiceId).single()
        if (invoiceError) throw new Error(invoiceError.message)
        const invoiceRow = row(invoice)
        const outstandingCents = Math.max(0, decimalToCents(invoiceRow.total_amount || 0) - decimalToCents(invoiceRow.amount_paid || 0))
        if (allocation.amountCents > outstandingCents) throw new Error(`L’affectation dépasse le solde de la facture ${string(invoiceRow.invoice_number)}.`)
        const nextPaidCents = decimalToCents(invoiceRow.amount_paid || 0) + allocation.amountCents
        const nextStatus = nextPaidCents >= decimalToCents(invoiceRow.total_amount || 0) ? 'paid' : 'partially_paid'
        const { error: invoiceUpdateError } = await input.client.from('angelcare360_invoices').update({ amount_paid: centsToDecimal(nextPaidCents), status: nextStatus, updated_at: now() }).eq('school_id', schoolId).eq('id', allocation.invoiceId)
        if (invoiceUpdateError) throw new Error(invoiceUpdateError.message)
        const { data: allocationRow, error: insertError } = await input.client.from('angelcare360_finance_payment_allocations').insert({ school_id: schoolId, payment_id: paymentId, invoice_id: allocation.invoiceId, amount: centsToDecimal(allocation.amountCents), status: 'active', allocated_by: input.userId, allocated_at: now(), idempotency_key: idempotencyKey }).select('*').single()
        if (insertError) throw new Error(insertError.message)
        results.push(row(allocationRow))
      }
      const totalAllocatedCents = existingCents + requestedCents
      const activeInvoiceIds = [...new Set([...existingRows.map((item) => string(item.invoice_id)), ...normalized.map((item) => item.invoiceId)].filter(Boolean))]
      const { error: paymentUpdateError } = await input.client.from('angelcare360_payments').update({ allocated_amount: centsToDecimal(totalAllocatedCents), invoice_id: activeInvoiceIds.length === 1 ? activeInvoiceIds[0] : null, updated_at: now() }).eq('school_id', schoolId).eq('id', paymentId)
      if (paymentUpdateError) throw new Error(paymentUpdateError.message)
      return { allocations: results, allocatedAmount: centsToDecimal(totalAllocatedCents), unallocatedAmount: centsToDecimal(paymentCents - totalAllocatedCents) }
    }
    case 'finance.payment.reallocate': {
      const allocationId = input.request.entityId || required(payload, 'allocationId', 'Affectation')
      const { data: allocation, error: loadError } = await input.client.from('angelcare360_finance_payment_allocations').select('*').eq('school_id', schoolId).eq('id', allocationId).single()
      if (loadError) throw new Error(loadError.message)
      const allocationRow = row(allocation)
      if (string(allocationRow.status) !== 'active') throw new Error('Seule une affectation active peut être révisée.')
      const newInvoiceId = required(payload, 'invoiceId', 'Nouvelle facture')
      const newAmountCents = decimalToCents(required(payload, 'amount', 'Montant'))
      if (newAmountCents <= 0) throw new Error('Le montant réaffecté doit être strictement positif.')
      const oldInvoiceId = required(allocationRow, 'invoice_id', 'Facture source')
      const oldAmountCents = decimalToCents(allocationRow.amount || 0)
      const { data: oldInvoice, error: oldInvoiceError } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', oldInvoiceId).single()
      if (oldInvoiceError) throw new Error(oldInvoiceError.message)
      const { data: targetInvoice, error: targetInvoiceError } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', newInvoiceId).single()
      if (targetInvoiceError) throw new Error(targetInvoiceError.message)
      const oldRow = row(oldInvoice)
      const targetRow = row(targetInvoice)
      const restoredOldPaidCents = Math.max(0, decimalToCents(oldRow.amount_paid || 0) - oldAmountCents)
      const targetBasePaidCents = newInvoiceId === oldInvoiceId ? restoredOldPaidCents : decimalToCents(targetRow.amount_paid || 0)
      const targetOutstandingCents = Math.max(0, decimalToCents(targetRow.total_amount || 0) - targetBasePaidCents)
      if (newAmountCents > targetOutstandingCents) throw new Error('La nouvelle affectation dépasse le solde restant de la facture cible.')
      const { data: payment, error: paymentError } = await input.client.from('angelcare360_payments').select('*').eq('school_id', schoolId).eq('id', allocationRow.payment_id as never).single()
      if (paymentError) throw new Error(paymentError.message)
      const paymentRow = row(payment)
      const nextAllocatedCents = decimalToCents(paymentRow.allocated_amount || 0) - oldAmountCents + newAmountCents
      if (nextAllocatedCents > decimalToCents(paymentRow.amount || 0)) throw new Error('La réaffectation dépasse le montant du paiement.')
      if (newInvoiceId !== oldInvoiceId) {
        const oldStatus = restoredOldPaidCents <= 0 ? (string(oldRow.status) === 'paid' || string(oldRow.status) === 'partially_paid' ? 'issued' : string(oldRow.status)) : restoredOldPaidCents >= decimalToCents(oldRow.total_amount || 0) ? 'paid' : 'partially_paid'
        const { error: restoreError } = await input.client.from('angelcare360_invoices').update({ amount_paid: centsToDecimal(restoredOldPaidCents), status: oldStatus, updated_at: now() }).eq('school_id', schoolId).eq('id', oldInvoiceId)
        if (restoreError) throw new Error(restoreError.message)
      }
      const targetPaidCents = targetBasePaidCents + newAmountCents
      const targetStatus = targetPaidCents >= decimalToCents(targetRow.total_amount || 0) ? 'paid' : 'partially_paid'
      const { error: targetUpdateError } = await input.client.from('angelcare360_invoices').update({ amount_paid: centsToDecimal(targetPaidCents), status: targetStatus, updated_at: now() }).eq('school_id', schoolId).eq('id', newInvoiceId)
      if (targetUpdateError) throw new Error(targetUpdateError.message)
      await input.client.from('angelcare360_finance_payment_allocation_revisions').insert({ school_id: schoolId, allocation_id: allocationId, before_json: allocationRow, after_json: { invoice_id: newInvoiceId, amount: centsToDecimal(newAmountCents) }, reason: required(payload, 'reason', 'Motif'), revised_by: input.userId, revised_at: now() })
      const { data: updated, error: allocationUpdateError } = await input.client.from('angelcare360_finance_payment_allocations').update({ invoice_id: newInvoiceId, amount: centsToDecimal(newAmountCents), updated_at: now() }).eq('school_id', schoolId).eq('id', allocationId).select('*').single()
      if (allocationUpdateError) throw new Error(allocationUpdateError.message)
      const { data: active } = await input.client.from('angelcare360_finance_payment_allocations').select('invoice_id').eq('school_id', schoolId).eq('payment_id', allocationRow.payment_id as never).eq('status', 'active')
      const invoiceIds = [...new Set(((active || []) as Row[]).map((item) => string(item.invoice_id)).filter(Boolean))]
      const { error: paymentUpdateError } = await input.client.from('angelcare360_payments').update({ allocated_amount: centsToDecimal(nextAllocatedCents), invoice_id: invoiceIds.length === 1 ? invoiceIds[0] : null, updated_at: now() }).eq('school_id', schoolId).eq('id', allocationRow.payment_id as never)
      if (paymentUpdateError) throw new Error(paymentUpdateError.message)
      return { allocation: updated, allocatedAmount: centsToDecimal(nextAllocatedCents) }
    }
    case 'finance.receipt.issue': {
      const paymentId = input.request.entityId || required(payload, 'paymentId', 'Paiement')
      const result = await createAngelcare360ReceiptFromPayment({ schoolId, paymentId, status: 'issued' })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      const { data: payment } = await input.client.from('angelcare360_payments').select('*').eq('school_id', schoolId).eq('id', paymentId).single()
      const document = payment ? await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind: 'receipt', source: row(payment), sourceType: 'payment', sourceId: paymentId }) : null
      return { receipt: result.record, document }
    }
    case 'finance.refund.request': {
      const paymentId = input.request.entityId || required(payload, 'paymentId', 'Paiement')
      const { data, error } = await input.client.from('angelcare360_finance_refund_requests').insert({ school_id: schoolId, payment_id: paymentId, refund_code: code('RFD'), requested_amount: required(payload, 'amount', 'Montant'), reason: required(payload, 'reason', 'Motif'), status: 'requested', requested_by: input.userId, requested_at: now(), evidence_json: row(payload.evidence) }).select('*').single()
      if (error) throw new Error(error.message)
      return { refund: data }
    }
    case 'finance.refund.approve': {
      const refundId = input.request.entityId || required(payload, 'refundId', 'Remboursement')
      const { data, error } = await input.client.from('angelcare360_finance_refund_requests').update({ status: 'approved', approved_amount: payload.amount || undefined, approved_by: input.userId, approved_at: now() }).eq('school_id', schoolId).eq('id', refundId).eq('status', 'requested').select('*').single()
      if (error) throw new Error(error.message)
      return { refund: data }
    }
    case 'finance.refund.execute': {
      const refundId = input.request.entityId || required(payload, 'refundId', 'Remboursement')
      const { data: refund, error: refundError } = await input.client.from('angelcare360_finance_refund_requests').select('*').eq('school_id', schoolId).eq('id', refundId).single()
      if (refundError) throw new Error(refundError.message)
      const refundRow = row(refund)
      if (string(refundRow.status) === 'executed') return { refund: refundRow, replay: true }
      if (string(refundRow.status) !== 'approved') throw new Error('Le remboursement doit être approuvé avant exécution.')
      const approvedCents = decimalToCents(refundRow.approved_amount || refundRow.requested_amount || 0)
      if (approvedCents <= 0) throw new Error('Le montant approuvé est invalide.')
      const { data: payment, error: paymentError } = await input.client.from('angelcare360_payments').select('*').eq('school_id', schoolId).eq('id', refundRow.payment_id as never).single()
      if (paymentError) throw new Error(paymentError.message)
      const paymentRow = row(payment)
      const paymentCents = decimalToCents(paymentRow.amount || 0)
      if (approvedCents > paymentCents) throw new Error('Le remboursement dépasse le paiement source.')
      const { data: previousRefunds, error: previousRefundsError } = await input.client.from('angelcare360_finance_refund_requests').select('approved_amount,requested_amount,status').eq('school_id', schoolId).eq('payment_id', refundRow.payment_id as never).eq('status', 'executed')
      if (previousRefundsError) throw new Error(previousRefundsError.message)
      const alreadyRefundedCents = ((previousRefunds || []) as Row[]).reduce((sum, item) => sum + decimalToCents(item.approved_amount || item.requested_amount || 0), 0)
      if (alreadyRefundedCents + approvedCents > paymentCents) throw new Error('Le cumul des remboursements dépasse le paiement source.')
      const invoiceId = optional(paymentRow.invoice_id)
      if (invoiceId) {
        const { data: invoice, error: invoiceError } = await input.client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('id', invoiceId).single()
        if (invoiceError) throw new Error(invoiceError.message)
        const invoiceRow = row(invoice)
        const nextPaidCents = Math.max(0, decimalToCents(invoiceRow.amount_paid || 0) - approvedCents)
        const nextStatus = nextPaidCents <= 0 ? 'issued' : nextPaidCents >= decimalToCents(invoiceRow.total_amount || 0) ? 'paid' : 'partially_paid'
        const { error: invoiceUpdateError } = await input.client.from('angelcare360_invoices').update({ amount_paid: centsToDecimal(nextPaidCents), status: nextStatus, updated_at: now() }).eq('school_id', schoolId).eq('id', invoiceId)
        if (invoiceUpdateError) throw new Error(invoiceUpdateError.message)
      }
      const fullyRefunded = alreadyRefundedCents + approvedCents === paymentCents
      const { error: paymentUpdateError } = await input.client.from('angelcare360_payments').update({
        status: fullyRefunded ? 'refunded' : 'confirmed',
        allocated_amount: centsToDecimal(Math.max(0, decimalToCents(paymentRow.allocated_amount || 0) - approvedCents)),
        metadata_json: { ...row(paymentRow.metadata_json), refundedAmount: centsToDecimal(alreadyRefundedCents + approvedCents), lastRefundId: refundId },
        updated_at: now(),
      }).eq('school_id', schoolId).eq('id', refundRow.payment_id as never)
      if (paymentUpdateError) throw new Error(paymentUpdateError.message)
      const executionReference = optional(payload.executionReference) || code('RFDX')
      const { data: executed, error } = await input.client.from('angelcare360_finance_refund_requests').update({ status: 'executed', execution_reference: executionReference, executed_by: input.userId, executed_at: now(), reconciliation_status: 'pending', updated_at: now() }).eq('school_id', schoolId).eq('id', refundId).select('*').single()
      if (error) throw new Error(error.message)
      const document = await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind: 'refund', source: { ...row(executed), amount: centsToDecimal(approvedCents), payment_number: paymentRow.payment_number, currency: 'MAD' }, sourceType: 'refund', sourceId: refundId })
      return { refund: executed, document, sourcePaymentPreserved: true }
    }
    case 'finance.discount.request': {
      const result = await createAngelcare360Discount({ ...payload, schoolId })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      return { discount: result.record }
    }
    case 'finance.discount.approve': {
      const discountId = input.request.entityId || required(payload, 'discountId', 'Remise')
      const result = await decideAngelcare360Discount({ schoolId, id: discountId, status: 'approved', reason: payload.reason })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      return { discount: result.record }
    }
    case 'finance.collection_case.open': {
      const accountReference = required(payload, 'accountId', 'Compte payeur')
      const { data: directAccount, error: directAccountError } = await input.client
        .from('angelcare360_finance_payer_accounts')
        .select('*')
        .eq('school_id', schoolId)
        .eq('id', accountReference)
        .maybeSingle()
      if (directAccountError && directAccountError.code !== 'PGRST116') throw new Error(directAccountError.message)
      const payerAccount = directAccount || await ensurePayerAccountForStudent(input.client, schoolId, input.userId, accountReference)
      const accountId = string(row(payerAccount).id)
      const { data, error } = await input.client.from('angelcare360_finance_collection_cases').insert({ school_id: schoolId, account_id: accountId, case_code: code('COL'), status: 'monitoring', priority: string(payload.priority || 'normal'), outstanding_amount: payload.outstandingAmount || 0, aging_bucket: string(payload.agingBucket || 'current'), owner_id: optional(payload.ownerId), next_action: optional(payload.nextAction), due_at: optional(payload.dueAt), opened_by: input.userId, opened_at: now() }).select('*').single()
      if (error) throw new Error(error.message)
      return { collectionCase: data }
    }
    case 'finance.commitment.record': {
      const caseId = input.request.entityId || required(payload, 'caseId', 'Dossier de recouvrement')
      const { data, error } = await input.client.from('angelcare360_finance_payment_commitments').insert({ school_id: schoolId, collection_case_id: caseId, commitment_code: code('PTP'), committed_amount: required(payload, 'amount', 'Montant engagé'), due_date: required(payload, 'dueDate', 'Échéance'), schedule_json: payload.schedule || {}, source_invoice_ids: payload.invoiceIds || [], status: 'active', recorded_by: input.userId, recorded_at: now() }).select('*').single()
      if (error) throw new Error(error.message)
      return { commitment: data }
    }
    case 'finance.commitment.resolve': {
      const commitmentId = input.request.entityId || required(payload, 'commitmentId', 'Engagement')
      const status = required(payload, 'status', 'Statut')
      const { data, error } = await input.client.from('angelcare360_finance_payment_commitments').update({ status, breach_reason: status === 'broken' ? optional(payload.reason) : null, resolved_by: input.userId, resolved_at: now() }).eq('school_id', schoolId).eq('id', commitmentId).select('*').single()
      if (error) throw new Error(error.message)
      return { commitment: data }
    }
    case 'finance.dispute.decide': {
      const disputeId = input.request.entityId || required(payload, 'disputeId', 'Litige')
      const { data, error } = await input.client.from('angelcare360_finance_disputes').update({ status: required(payload, 'decision', 'Décision'), decision_reason: required(payload, 'reason', 'Motif'), decided_by: input.userId, decided_at: now(), consequence_json: row(payload.consequence) }).eq('school_id', schoolId).eq('id', disputeId).select('*').single()
      if (error) throw new Error(error.message)
      return { dispute: data }
    }
    case 'finance.statement.generate': {
      const studentId = input.request.entityId || required(payload, 'studentId', 'Élève')
      const statement = await getAngelcare360StudentAccountStatement({ schoolId, studentId })
      if (!statement) throw new Error('Le relevé ne peut pas être construit.')
      const document = await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind: 'statement', source: row(statement), movements: array(row(statement).movements).map(row), sourceType: 'student_account', sourceId: studentId })
      return { statement: row(statement), document }
    }
    case 'finance.expense.submit': {
      const result = await createAngelcare360Expense({ ...payload, schoolId, status: 'draft' })
      if (!result.ok) throw new Error(result.error || 'La mutation financière a échoué.')
      return { expense: result.record }
    }
    case 'finance.expense.approve': {
      const expenseId = input.request.entityId || required(payload, 'expenseId', 'Dépense')
      const { data, error } = await input.client.from('angelcare360_expenses').update({
        status: 'approved',
        notes: optional(payload.notes),
        updated_at: now(),
        metadata_json: { approvedBy: input.userId, approvedAt: now(), reason: optional(payload.reason) },
      }).eq('school_id', schoolId).eq('id', expenseId).eq('status', 'draft').select('*').single()
      if (error) throw new Error(error.message)
      return { expense: data }
    }
    case 'finance.expense.mark_paid': {
      const expenseId = input.request.entityId || required(payload, 'expenseId', 'Dépense')
      const { data, error } = await input.client.from('angelcare360_expenses').update({
        status: 'paid',
        payment_method: optional(payload.paymentMethod),
        notes: optional(payload.notes),
        updated_at: now(),
        metadata_json: { paidBy: input.userId, paidAt: now(), paymentReference: optional(payload.paymentReference) },
      }).eq('school_id', schoolId).eq('id', expenseId).eq('status', 'approved').select('*').single()
      if (error) throw new Error(error.message)
      return { expense: data }
    }
    case 'finance.reconciliation.resolve': {
      const matchId = input.request.entityId || required(payload, 'matchId', 'Rapprochement')
      const { data, error } = await input.client.from('angelcare360_finance_reconciliation_matches').update({ status: 'resolved', resolution: required(payload, 'resolution', 'Résolution'), resolved_by: input.userId, resolved_at: now() }).eq('school_id', schoolId).eq('id', matchId).select('*').single()
      if (error) throw new Error(error.message)
      return { match: data }
    }
    case 'finance.period.close': {
      const periodId = input.request.entityId || required(payload, 'periodId', 'Période')
      const blockers = {
        unallocatedPayments: await loadUnallocatedPaymentBlockers(input.client, schoolId),
        pendingRefunds: await safeCount(input.client, 'angelcare360_finance_refund_requests', schoolId, [['status','requested']]),
        pendingExpenses: await safeCount(input.client, 'angelcare360_expenses', schoolId, [['status','draft']]),
      }
      if (Object.values(blockers).some((value) => value > 0) && !boolean(payload.overrideBlockers)) throw new Error('La clôture est bloquée par des opérations non résolues.')
      const { data, error } = await input.client.from('angelcare360_finance_periods').update({ status: 'closed', closed_by: input.userId, closed_at: now(), closure_snapshot: blockers }).eq('school_id', schoolId).eq('id', periodId).select('*').single()
      if (error) throw new Error(error.message)
      return { period: data, blockers }
    }
    case 'finance.period.reopen': {
      const periodId = input.request.entityId || required(payload, 'periodId', 'Période')
      const reason = required(payload, 'reason', 'Motif')
      const { data, error } = await input.client.from('angelcare360_finance_periods').update({ status: 'open', reopened_by: input.userId, reopened_at: now(), reopen_reason: reason }).eq('school_id', schoolId).eq('id', periodId).eq('status', 'closed').select('*').single()
      if (error) throw new Error(error.message)
      return { period: data }
    }
    case 'finance.document.generate': {
      const sourceType = required(payload, 'sourceType', 'Type source')
      const sourceId = input.request.entityId || required(payload, 'sourceId', 'Source')
      const table = sourceType === 'invoice' ? 'angelcare360_invoices' : sourceType === 'payment' ? 'angelcare360_payments' : sourceType === 'credit_note' ? 'angelcare360_finance_credit_notes' : null
      if (!table) throw new Error('Type de document financier non pris en charge.')
      const { data: source, error } = await input.client.from(table).select('*').eq('school_id', schoolId).eq('id', sourceId).single()
      if (error) throw new Error(error.message)
      const kind = sourceType === 'invoice' ? 'invoice' : sourceType === 'payment' ? 'receipt' : 'credit_note'
      const document = await generateFinanceDocument({ client: input.client, schoolId, schoolName: input.schoolName, userId: input.userId, kind, source: row(source), sourceType, sourceId })
      return { document }
    }
    case 'finance.report.execute': {
      const reportKey = required(payload, 'reportKey', 'Rapport')
      const { data, error } = await input.client.from('angelcare360_finance_report_runs').insert({
        school_id: schoolId,
        report_key: reportKey,
        run_code: code('FRPT'),
        report_title: string(payload.title || reportKey),
        output_format: string(payload.format || 'pdf'),
        status: 'queued',
        parameters_json: payload.parameters || {},
        requested_by: input.userId,
        requested_at: now(),
        idempotency_key: optional(input.request.idempotencyKey) || input.executionId,
      }).select('*').single()
      if (error) throw new Error(error.message)
      return { reportRun: data }
    }
    case 'finance.export.execute': {
      const { data, error } = await input.client.from('angelcare360_finance_export_runs').insert({ school_id: schoolId, export_code: code('FEXP'), export_type: required(payload, 'exportType', 'Type export'), format: string(payload.format || 'csv'), filters_json: payload.filters || {}, status: 'queued', requested_by: input.userId, requested_at: now(), expires_at: optional(payload.expiresAt) }).select('*').single()
      if (error) throw new Error(error.message)
      return { exportRun: data }
    }
    default: throw new Error(`Opération financière non implémentée: ${input.request.operationKey}.`)
  }
}

export async function executeFinanceAuthorityCommand(request: FinanceAuthorityCommandRequest, options: { bypassApproval?: boolean } = {}): Promise<FinanceAuthorityCommandResult> {
  const definition = getFinanceAuthorityOperation(request.operationKey)
  if (!definition) throw new Error(`Opération financière inconnue: ${request.operationKey}.`)
  const gate = await requireProductRealityOperation(request.operationKey, { entityId: request.entityId, payload: request.payload || {}, allowApprovalRequired: true })
  const context = gate.context
  if (!context.school) throw new Error('Établissement actif introuvable.')
  const client = await createServiceClient()
  const { execution, replay } = await beginFinanceExecution(client, context.school.id, context.user.id, request)
  const executionId = string(execution.id)
  if (replay) return { ok: string(execution.state) !== 'failed', state: string(execution.state) as FinanceAuthorityCommandResult['state'], message: string(row(execution.result_payload).message || 'Exécution financière déjà traitée.'), operationKey: request.operationKey, executionId, approvalId: optional(row(execution.result_payload).approvalId), entityId: request.entityId || null, result: row(execution.result_payload) }
  try {
    await assertFinancePeriodOpen(client, context.school.id, request.operationKey, row(request.payload))
    if (definition.approval && !options.bypassApproval) {
      const approval = await requestApproval(client, context.school.id, context.user.id, request, executionId)
      const result = { approvalId: approval.id, message: 'Opération transmise au circuit d’approbation.' }
      await finishExecution(client, executionId, 'approval_required', result)
      return { ok: true, state: 'approval_required', message: result.message, operationKey: request.operationKey, executionId, approvalId: string(approval.id), entityId: request.entityId || null, result }
    }
    const result = await performFinanceOperation({ client, schoolId: context.school.id, schoolName: context.school.name, userId: context.user.id, executionId, request, bypassApproval: Boolean(options.bypassApproval) })
    await finishExecution(client, executionId, 'completed', result)
    await recordAngelcare360AuditEventServer({ category: 'finance', module: 'finance', action: request.operationKey, schoolId: context.school.id, entityType: 'finance_authority', entityId: request.entityId || executionId, severity: 'info', afterData: { executionId, result } })
    return { ok: true, state: 'completed', message: 'Opération financière exécutée, équilibrée et auditée.', operationKey: request.operationKey, executionId, entityId: request.entityId || null, result }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec de l’opération financière.'
    await finishExecution(client, executionId, 'failed', { message }, message)
    await recordAngelcare360AuditEventServer({ category: 'finance', module: 'finance', action: `${request.operationKey}.failed`, schoolId: context.school.id, entityType: 'finance_authority', entityId: request.entityId || executionId, severity: 'critical', afterData: { executionId, message } })
    return { ok: false, state: 'failed', message, operationKey: request.operationKey, executionId, entityId: request.entityId || null, result: { message } }
  }
}

export async function decideFinanceAuthorityApproval(input: { approvalId: string; decision: 'approved' | 'rejected'; reason: string }): Promise<FinanceAuthorityCommandResult> {
  const gate = await requireProductRealityOperation('finance.approval.decide', { entityId: input.approvalId, allowApprovalRequired: true })
  const context = gate.context
  if (!context.school) throw new Error('Établissement actif introuvable.')
  const client = await createServiceClient()
  const { data: approval, error } = await client.from('angelcare360_product_reality_approvals').select('*').eq('school_id', context.school.id).eq('id', input.approvalId).single()
  if (error) throw new Error(error.message)
  const approvalRow = row(approval)
  if (string(approvalRow.status) !== 'open' || string(approvalRow.decision) !== 'pending') throw new Error('Cette approbation a déjà été décidée.')
  if (input.decision === 'rejected') {
    await client.from('angelcare360_product_reality_approvals').update({ status: 'closed', decision: 'rejected', decision_reason: input.reason, decided_by: context.user.id, decided_at: now() }).eq('id', input.approvalId)
    const financeExecutionId = optional(row(approvalRow.request_payload).financeExecutionId)
    if (financeExecutionId) await finishExecution(client, financeExecutionId, 'rejected', { approvalId: input.approvalId, message: input.reason })
    return { ok: true, state: 'rejected', message: 'Opération financière rejetée et clôturée.', operationKey: 'finance.approval.decide', approvalId: input.approvalId, result: { decision: 'rejected' } }
  }
  const payload = row(approvalRow.request_payload)
  const originalOperationKey = required(payload, 'originalOperationKey', 'Opération source') as FinanceAuthorityCommandRequest['operationKey']
  const request: FinanceAuthorityCommandRequest = { operationKey: originalOperationKey, entityId: optional(payload.originalEntityId), idempotencyKey: `approved:${input.approvalId}`, reason: input.reason, payload: { ...payload, approvalId: input.approvalId } }
  await client.from('angelcare360_product_reality_approvals').update({ status: 'executing', decision: 'approved', decision_reason: input.reason, decided_by: context.user.id, decided_at: now() }).eq('id', input.approvalId)
  const result = await executeFinanceAuthorityCommand(request, { bypassApproval: true })
  await client.from('angelcare360_product_reality_approvals').update({ status: result.ok ? 'closed' : 'execution_failed', decision_result: result }).eq('id', input.approvalId)
  return { ...result, approvalId: input.approvalId }
}

export async function getFinanceAuthoritySnapshot(scene: FinanceAuthorityScene = 'command'): Promise<FinanceAuthoritySnapshot> {
  const gate = await requireProductRealityOperation('finance.workspace.view', { allowApprovalRequired: true })
  const context = gate.context
  if (!context.school) throw new Error('Établissement actif introuvable.')
  const client = await createServiceClient()
  const schoolId = context.school.id
  const [overview, feeStructures, feeAssignments, invoices, payments, receipts, discounts, reminders, balances, expenses, payerAccounts, collectionCases, commitments, refunds, periods, templates, documents, reportRuns, exportRuns, approvals, executions] = await Promise.all([
    getAngelcare360FinanceOverview({ schoolId }),
    listAngelcare360FeeStructures({ schoolId }),
    listAngelcare360StudentFeeAssignments({ schoolId }),
    listAngelcare360Invoices({ schoolId }),
    listAngelcare360Payments({ schoolId }),
    listAngelcare360Receipts({ schoolId }),
    listAngelcare360Discounts({ schoolId }),
    listAngelcare360PaymentReminders({ schoolId }),
    listAngelcare360StudentBalances({ schoolId }),
    listAngelcare360Expenses({ schoolId }),
    safeRows(client, 'angelcare360_finance_payer_accounts', schoolId),
    safeRows(client, 'angelcare360_finance_collection_cases', schoolId),
    safeRows(client, 'angelcare360_finance_payment_commitments', schoolId),
    safeRows(client, 'angelcare360_finance_refund_requests', schoolId),
    safeRows(client, 'angelcare360_finance_periods', schoolId),
    safeRows(client, 'angelcare360_finance_document_templates', schoolId),
    safeRows(client, 'angelcare360_finance_document_versions', schoolId),
    safeRows(client, 'angelcare360_finance_report_runs', schoolId),
    safeRows(client, 'angelcare360_finance_export_runs', schoolId),
    safeRows(client, 'angelcare360_product_reality_approvals', schoolId),
    safeRows(client, 'angelcare360_finance_authority_executions', schoolId),
  ])
  const invoiceRows = (invoices || []) as unknown as Row[]
  const paymentRows = (payments || []) as unknown as Row[]
  const balanceRows = (balances || []) as unknown as Row[]
  const overdue = invoiceRows.filter((invoice) => ['overdue','partial','partially_paid'].includes(string(invoice.status)))
  const outstanding = balanceRows.reduce((sum, balance) => sum + numeric(balance.outstandingTotal), 0)
  const collected = paymentRows.filter((payment) => ['confirmed','paid'].includes(string(payment.status))).reduce((sum, payment) => sum + numeric(payment.amount), 0)
  const invoiced = invoiceRows.reduce((sum, invoice) => sum + numeric(invoice.total_amount), 0)
  const unallocated = paymentRows.reduce((sum, payment) => sum + Math.max(0, numeric(payment.amount) - numeric(payment.allocated_amount)), 0)
  const collectionRate = invoiced > 0 ? Math.min(100, (collected / invoiced) * 100) : 0
  const metrics: FinanceAuthorityMetric[] = [
    { key: 'invoiced', label: 'Facturé', value: money(invoiced), detail: `${invoiceRows.length} facture(s)`, tone: 'active' },
    { key: 'collected', label: 'Encaissé', value: money(collected), detail: `${paymentRows.length} paiement(s)`, tone: 'healthy' },
    { key: 'outstanding', label: 'Solde dû', value: money(outstanding), detail: `${overdue.length} facture(s) en suivi`, tone: outstanding > 0 ? 'warning' : 'healthy' },
    { key: 'collection-rate', label: 'Taux collecte', value: `${collectionRate.toFixed(1)} %`, detail: 'Encaissement / facturation', tone: collectionRate >= 85 ? 'healthy' : collectionRate >= 60 ? 'warning' : 'critical' },
    { key: 'unallocated', label: 'Non affecté', value: money(unallocated), detail: 'Paiements à rapprocher', tone: unallocated > 0 ? 'warning' : 'healthy' },
    { key: 'approvals', label: 'Approbations', value: String(approvals.filter((item) => string(item.status) === 'open' && string(item.domain) === 'finance').length), detail: 'Décisions financières attendues', tone: 'governed' },
  ]
  const aging = [
    { bucket: 'Courant', min: -Infinity, max: 0, tone: 'healthy' as const },
    { bucket: '1–30 jours', min: 1, max: 30, tone: 'active' as const },
    { bucket: '31–60 jours', min: 31, max: 60, tone: 'warning' as const },
    { bucket: '61–90 jours', min: 61, max: 90, tone: 'warning' as const },
    { bucket: '91+ jours', min: 91, max: Infinity, tone: 'critical' as const },
  ].map((bucket) => {
    const items = invoiceRows.filter((invoice) => {
      const due = optional(invoice.due_date)
      const days = due ? Math.floor((Date.now() - Date.parse(due)) / 86400000) : 0
      return numeric(invoice.balance_due, numeric(invoice.total_amount) - numeric(invoice.amount_paid)) > 0 && days >= bucket.min && days <= bucket.max
    })
    return { bucket: bucket.bucket, amount: money(items.reduce((sum, invoice) => sum + numeric(invoice.balance_due, numeric(invoice.total_amount) - numeric(invoice.amount_paid)), 0)), invoices: items.length, tone: bucket.tone }
  })
  const methodMap = new Map<string, { amount: number; count: number }>()
  for (const payment of paymentRows) {
    const method = string(payment.method || 'other')
    const current = methodMap.get(method) || { amount: 0, count: 0 }
    current.amount += numeric(payment.amount)
    current.count += 1
    methodMap.set(method, current)
  }
  const exceptionRecords: FinanceAuthorityRecord[] = [
    ...paymentRows.filter((payment) => numeric(payment.amount) > numeric(payment.allocated_amount)).map((payment) => toRecord({ ...payment, title: 'Paiement non affecté', status: 'unallocated', amount: numeric(payment.amount) - numeric(payment.allocated_amount) }, 'pay')),
    ...overdue.slice(0, 20).map((invoice) => toRecord({ ...invoice, title: 'Facture en retard', amount: invoice.balance_due || numeric(invoice.total_amount) - numeric(invoice.amount_paid) }, 'inv')),
    ...refunds.filter((refund) => ['requested','failed'].includes(string(refund.status))).map((refund) => toRecord(refund, 'refund')),
    ...executions.filter((execution) => string(execution.state) === 'failed').map((execution) => toRecord({ ...execution, title: 'Exécution financière échouée', status: 'failed', subtitle: execution.last_error }, 'exec')),
  ]
  const activePeriod = periods.find((period) => ['open','review','closure_requested'].includes(string(period.status))) || periods[0]
  return {
    generatedAt: now(),
    schoolId,
    schoolName: context.school.name,
    academicYearId: context.academicYear?.id || null,
    academicYearLabel: context.academicYear?.label || null,
    currency: 'Dh',
    scene,
    permissions: [...context.permissions],
    entitlementKeys: ['finance','reports'],
    metrics,
    records: {
      feeStructures: ((feeStructures || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'fee')),
      feeAssignments: ((feeAssignments || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'assignment')),
      periods: periods.map((item) => toRecord(item, 'period')),
      invoices: invoiceRows.slice(0, 80).map((item) => toRecord(item, 'inv')),
      payments: paymentRows.slice(0, 80).map((item) => toRecord(item, 'pay')),
      receipts: ((receipts || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'receipt')),
      discounts: ((discounts || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'discount')),
      reminders: ((reminders || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'reminder')),
      balances: balanceRows.slice(0, 80).map((item) => toRecord({ ...item, id: item.studentId, code: item.studentCode, title: item.studentFullName, amount: item.outstandingTotal, status: numeric(item.outstandingTotal) > 0 ? 'outstanding' : 'settled' }, 'balance')),
      expenses: ((expenses || []) as unknown as Row[]).slice(0, 80).map((item) => toRecord(item, 'expense')),
      payerAccounts: payerAccounts.map((item) => toRecord(item, 'payer')),
      collectionCases: collectionCases.map((item) => toRecord(item, 'collection')),
      commitments: commitments.map((item) => toRecord(item, 'commitment')),
      refunds: refunds.map((item) => toRecord(item, 'refund')),
      templates: templates.map((item) => toRecord({ ...item, code: item.template_code, title: item.document_type, date: item.published_at || item.effective_from }, 'template')),
      documents: documents.map((item) => toRecord(item, 'document')),
      reportRuns: reportRuns.map((item) => toRecord(item, 'report')),
      exportRuns: exportRuns.map((item) => toRecord(item, 'export')),
      approvals: approvals.filter((item) => string(item.domain) === 'finance').map((item) => toRecord(item, 'approval')),
      executions: executions.map((item) => toRecord(item, 'execution')),
    },
    aging,
    paymentMethods: [...methodMap.entries()].map(([method, value]) => ({ method, amount: money(value.amount), count: value.count })),
    collectionPerformance: [
      { label: 'Collecte', value: Number(collectionRate.toFixed(1)), target: 90 },
      { label: 'Affectation', value: collected > 0 ? Number(Math.max(0, Math.min(100, ((collected - unallocated) / collected) * 100)).toFixed(1)) : 100, target: 98 },
      { label: 'Promesses tenues', value: commitments.length ? Number((commitments.filter((item) => string(item.status) === 'fulfilled').length / commitments.length * 100).toFixed(1)) : 100, target: 90 },
    ],
    exceptions: exceptionRecords.slice(0, 60),
    period: { id: activePeriod ? string(activePeriod.id) : null, label: activePeriod ? string(activePeriod.label || activePeriod.period_code) : 'Période courante', status: activePeriod ? string(activePeriod.status) : 'not_configured', blockers: exceptionRecords.length },
    system: { productAuthority: true, sharedApprovalEngine: true, sharedAudit: true, notificationOutbox: true, documentAuthority: true, financialInvariants: true },
  }
}
