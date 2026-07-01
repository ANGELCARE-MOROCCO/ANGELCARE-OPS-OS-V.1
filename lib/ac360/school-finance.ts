import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolFinancePayload = Record<string, unknown>

type FinanceWiringKey =
  | 'ac360.school_finance.fee_catalog.upsert'
  | 'ac360.school_finance.billing_cycle.open'
  | 'ac360.school_finance.invoice_batch.generate'
  | 'ac360.school_finance.invoice.issue'
  | 'ac360.school_finance.payment.record'
  | 'ac360.school_finance.payment.allocate'
  | 'ac360.school_finance.receivables.reconcile'
  | 'ac360.school_finance.invoice.mark_overdue'
  | 'ac360.school_finance.payment_promise.create'
  | 'ac360.school_finance.adjustment.decide'
  | 'ac360.school_finance.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function dateOnly(value: unknown) {
  const raw = String(value || '').trim()
  return raw || new Date().toISOString().slice(0, 10)
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeFinanceRpc(
  wiringKey: FinanceWiringKey,
  body: Ac360SchoolFinancePayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.invoiceId || body.invoice_id || body.paymentId || body.payment_id || body.billingCycleId || body.billing_cycle_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 finance RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: 1,
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-finance',
      phase: 'phase_2d_finance_invoicing_payments_receivables',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked finance action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolFinanceDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_finance_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 school finance dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360FeeCatalogItem(body: Ac360SchoolFinancePayload) {
  return executeFinanceRpc('ac360.school_finance.fee_catalog.upsert', body, 'ac360_school_upsert_fee_catalog_item', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_fee_key: body.feeKey || body.fee_key || null,
    p_label: body.label || null,
    p_fee_type: text(body.feeType || body.fee_type, 'tuition'),
    p_billing_cycle: text(body.billingCycle || body.billing_cycle, 'monthly'),
    p_default_amount_mad: num(body.defaultAmountMad || body.default_amount_mad || body.amountMad || body.amount_mad, 0),
    p_status: text(body.status, 'active'),
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'fee_catalog.upsert' })
}

export async function openAc360BillingCycle(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.billing_cycle.open', body, 'ac360_school_open_billing_cycle', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_academic_year_id: body.academicYearId || body.academic_year_id || null,
    p_cycle_key: body.cycleKey || body.cycle_key || null,
    p_label: body.label || null,
    p_period_start: body.periodStart || body.period_start || dateOnly(null),
    p_period_end: body.periodEnd || body.period_end || null,
    p_invoice_due_date: body.invoiceDueDate || body.invoice_due_date || body.dueDate || body.due_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'billing_cycle.open' })
}

export async function generateAc360InvoiceBatch(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.invoice_batch.generate', body, 'ac360_school_generate_invoice_batch', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_billing_cycle_id: body.billingCycleId || body.billing_cycle_id || null,
    p_due_date: body.dueDate || body.due_date || null,
    p_fee_key: body.feeKey || body.fee_key || null,
    p_default_amount_mad: num(body.defaultAmountMad || body.default_amount_mad || body.amountMad || body.amount_mad, 0),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'invoice_batch.generate' })
}

export async function issueAc360SchoolInvoice(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  const lines = Array.isArray(body.lines) ? body.lines : []
  return executeFinanceRpc('ac360.school_finance.invoice.issue', body, 'ac360_school_issue_invoice', {
    p_student_id: body.studentId || body.student_id,
    p_invoice_account_id: body.invoiceAccountId || body.invoice_account_id || null,
    p_campus_id: body.campusId || body.campus_id || null,
    p_academic_year_id: body.academicYearId || body.academic_year_id || null,
    p_billing_cycle_id: body.billingCycleId || body.billing_cycle_id || null,
    p_invoice_batch_id: body.invoiceBatchId || body.invoice_batch_id || null,
    p_invoice_number: body.invoiceNumber || body.invoice_number || null,
    p_invoice_type: text(body.invoiceType || body.invoice_type, 'tuition'),
    p_due_date: body.dueDate || body.due_date || null,
    p_lines: lines,
    p_discount_mad: num(body.discountMad || body.discount_mad, 0),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'invoice.issue', lineCount: lines.length })
}

export async function recordAc360FeePayment(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.payment.record', body, 'ac360_school_record_fee_payment', {
    p_invoice_id: body.invoiceId || body.invoice_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_payment_reference: body.paymentReference || body.payment_reference || null,
    p_payment_method: text(body.paymentMethod || body.payment_method, 'cash'),
    p_amount_mad: num(body.amountMad || body.amount_mad, 0),
    p_paid_at: body.paidAt || body.paid_at || null,
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'payment.record' })
}

export async function allocateAc360Payment(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.payment.allocate', body, 'ac360_school_allocate_payment', {
    p_payment_id: body.paymentId || body.payment_id,
    p_invoice_id: body.invoiceId || body.invoice_id,
    p_amount_mad: body.amountMad || body.amount_mad || null,
    p_actor_app_user_id: actorId,
    p_notes: body.notes || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'payment.allocate' })
}

export async function reconcileAc360Receivables(body: Ac360SchoolFinancePayload = {}) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.receivables.reconcile', body, 'ac360_school_reconcile_receivables', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_run_date: body.runDate || body.run_date || body.asOfDate || body.as_of_date || dateOnly(null),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'receivables.reconcile' })
}

export async function markAc360InvoiceOverdue(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.invoice.mark_overdue', body, 'ac360_school_mark_invoice_overdue', {
    p_invoice_id: body.invoiceId || body.invoice_id,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'invoice.mark_overdue' })
}

export async function createAc360PaymentPromise(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.payment_promise.create', body, 'ac360_school_create_payment_promise', {
    p_student_id: body.studentId || body.student_id || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_invoice_id: body.invoiceId || body.invoice_id || null,
    p_promised_amount_mad: num(body.promisedAmountMad || body.promised_amount_mad || body.amountMad || body.amount_mad, 0),
    p_promised_date: body.promisedDate || body.promised_date || dateOnly(null),
    p_notes: body.notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'payment_promise.create' })
}

export async function decideAc360FinanceAdjustment(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.adjustment.decide', body, 'ac360_school_decide_finance_adjustment', {
    p_invoice_id: body.invoiceId || body.invoice_id,
    p_adjustment_type: text(body.adjustmentType || body.adjustment_type, 'discount'),
    p_requested_amount_mad: num(body.requestedAmountMad || body.requested_amount_mad || body.amountMad || body.amount_mad, 0),
    p_status: text(body.status || body.decisionStatus || body.decision_status, 'approved'),
    p_reason: body.reason || body.decisionReason || body.decision_reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'adjustment.decide' })
}

export async function resolveAc360FinanceAlert(body: Ac360SchoolFinancePayload) {
  const actorId = await currentActorId()
  return executeFinanceRpc('ac360.school_finance.alert.resolve', body, 'ac360_school_resolve_finance_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { financeAction: 'alert.resolve' })
}
