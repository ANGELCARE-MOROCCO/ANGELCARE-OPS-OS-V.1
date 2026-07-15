import { getOperatorClient, safeList, summarizeMoney, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import {
  operatorDunningActionCompleteSchema,
  operatorDunningActionCreateSchema,
  operatorBillingAccountCreateSchema,
  operatorBillingAccountUpdateSchema,
  operatorInvoiceCancelSchema,
  operatorInvoiceCreateSchema,
  operatorInvoiceIssueSchema,
  operatorPaymentConfirmSchema,
  operatorPaymentRecordSchema,
  operatorPaymentRejectSchema,
} from './validation'
import type {
  Angelcare360OperatorBillingAccountRecord,
  Angelcare360OperatorInvoiceRecord,
  Angelcare360OperatorPaymentRecord,
} from '@/types/angelcare360/operator'

export async function listOperatorBillingAccounts() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return (await safeList('angelcare360_operator_billing_accounts', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorBillingAccountRecord[]
}

export async function getOperatorBillingAccountById(id: string) {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  const supabase = await getOperatorClient()
  const { data } = await supabase.from('angelcare360_operator_billing_accounts').select('*').eq('id', id).maybeSingle()
  return (data as Angelcare360OperatorBillingAccountRecord | null) ?? null
}

export async function createOperatorBillingAccount(input: unknown) {
  const parsed = operatorBillingAccountCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le compte de facturation est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    billing_name: parsed.data.billingName,
    billing_email: parsed.data.billingEmail,
    billing_phone: parsed.data.billingPhone || null,
    billing_address: parsed.data.billingAddress || null,
    tax_identifier: parsed.data.taxIdentifier || null,
    payment_terms_days: parsed.data.paymentTermsDays ?? 7,
    status: parsed.data.status,
  }
  const { data, error } = await supabase.from('angelcare360_operator_billing_accounts').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'billing_account.created',
    entityType: 'angelcare360_operator_billing_accounts',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorBillingAccountRecord }
}

export async function updateOperatorBillingAccount(input: unknown) {
  const parsed = operatorBillingAccountUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le compte de facturation est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_billing_accounts').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_id: parsed.data.clientId,
    billing_name: parsed.data.billingName,
    billing_email: parsed.data.billingEmail,
    billing_phone: parsed.data.billingPhone || null,
    billing_address: parsed.data.billingAddress || null,
    tax_identifier: parsed.data.taxIdentifier || null,
    payment_terms_days: parsed.data.paymentTermsDays ?? 7,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_billing_accounts').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'billing_account.updated',
    entityType: 'angelcare360_operator_billing_accounts',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorBillingAccountRecord }
}

export async function listOperatorInvoices() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return (await safeList('angelcare360_operator_invoices', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorInvoiceRecord[]
}

export async function getOperatorInvoiceById(id: string) {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  const supabase = await getOperatorClient()
  const { data } = await supabase
    .from('angelcare360_operator_invoices')
    .select('*, client:angelcare360_operator_clients(*), billing_account:angelcare360_operator_billing_accounts(*), subscription:angelcare360_operator_subscriptions(*)')
    .eq('id', id)
    .maybeSingle()
  return (data as (Angelcare360OperatorInvoiceRecord & {
    client?: Record<string, unknown> | null
    billing_account?: Record<string, unknown> | null
    subscription?: Record<string, unknown> | null
  }) | null) ?? null
}

export async function createOperatorInvoice(input: unknown) {
  const parsed = operatorInvoiceCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La facture est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    subscription_id: parsed.data.subscriptionId || null,
    billing_account_id: parsed.data.billingAccountId || null,
    invoice_number: parsed.data.invoiceNumber,
    issue_date: parsed.data.issueDate,
    due_date: parsed.data.dueDate,
    period_start: parsed.data.periodStart || null,
    period_end: parsed.data.periodEnd || null,
    subtotal_mad: parsed.data.subtotalMad,
    discount_mad: parsed.data.discountMad || 0,
    total_mad: parsed.data.totalMad,
    amount_paid_mad: parsed.data.amountPaidMad || 0,
    balance_due_mad: parsed.data.balanceDueMad ?? Math.max(0, parsed.data.totalMad - (parsed.data.amountPaidMad || 0)),
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_invoices').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'invoice.created',
    entityType: 'angelcare360_operator_invoices',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorInvoiceRecord }
}

export async function issueOperatorInvoice(input: unknown) {
  const parsed = operatorInvoiceIssueSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La facture est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_invoices').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'issued', updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_invoices').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'invoice.issued',
    entityType: 'angelcare360_operator_invoices',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorInvoiceRecord }
}

export async function cancelOperatorInvoice(input: unknown) {
  const parsed = operatorInvoiceCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La facture est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_invoices').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'cancelled', notes: parsed.data.reason || (before as Record<string, unknown> | null)?.notes || null, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_invoices').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'invoice.cancelled',
    entityType: 'angelcare360_operator_invoices',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole, reason: parsed.data.reason || null },
  })
  return { ok: true, record: data as Angelcare360OperatorInvoiceRecord }
}

export async function listOperatorPayments() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return (await safeList('angelcare360_operator_payments', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorPaymentRecord[]
}

export async function getOperatorPaymentById(id: string) {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  const supabase = await getOperatorClient()
  const { data } = await supabase
    .from('angelcare360_operator_payments')
    .select('*, invoice:angelcare360_operator_invoices(*, client:angelcare360_operator_clients(*), billing_account:angelcare360_operator_billing_accounts(*)), client:angelcare360_operator_clients(*)')
    .eq('id', id)
    .maybeSingle()
  return (data as (Angelcare360OperatorPaymentRecord & { invoice?: Record<string, unknown> | null; client?: Record<string, unknown> | null }) | null) ?? null
}

export async function recordOperatorPayment(input: unknown) {
  const parsed = operatorPaymentRecordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.payments.record')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    invoice_id: parsed.data.invoiceId || null,
    payment_reference: parsed.data.paymentReference,
    payment_date: parsed.data.paymentDate,
    amount_mad: parsed.data.amountMad,
    method: parsed.data.method,
    status: parsed.data.status,
    received_by: parsed.data.receivedBy || null,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_payments').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment.recorded',
    entityType: 'angelcare360_operator_payments',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPaymentRecord }
}

export async function confirmOperatorPayment(input: unknown) {
  const parsed = operatorPaymentConfirmSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.payments.confirm')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_payments').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'confirmed', updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_payments').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment.confirmed',
    entityType: 'angelcare360_operator_payments',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorPaymentRecord }
}

export async function rejectOperatorPayment(input: unknown) {
  const parsed = operatorPaymentRejectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.payments.reject')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_payments').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'rejected', notes: parsed.data.reason || (before as Record<string, unknown> | null)?.notes || null, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_payments').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment.rejected',
    entityType: 'angelcare360_operator_payments',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole, reason: parsed.data.reason || null },
  })
  return { ok: true, record: data as Angelcare360OperatorPaymentRecord }
}

export async function getOperatorClientBalanceSummary(clientId?: string | null) {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  const invoices = await safeList('angelcare360_operator_invoices', '*', clientId ? [['client_id', 'eq', clientId]] : [], ['updated_at', { ascending: false }])
  const payments = await safeList('angelcare360_operator_payments', '*', clientId ? [['client_id', 'eq', clientId]] : [], ['updated_at', { ascending: false }])
  return {
    billedMad: summarizeMoney(invoices.map((item) => item.total_mad)),
    paidMad: summarizeMoney(payments.filter((item) => item.status === 'confirmed').map((item) => item.amount_mad)),
    dueMad: summarizeMoney(invoices.map((item) => item.balance_due_mad)),
    overdueMad: summarizeMoney(invoices.filter((item) => item.status === 'overdue').map((item) => item.balance_due_mad)),
    lastPaymentDate: payments[0]?.payment_date || null,
    invoices,
    payments,
  }
}

export async function listOperatorDunningActions() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return (await safeList('angelcare360_operator_dunning_actions', '*', [], ['updated_at', { ascending: false }]))
}

export async function createOperatorDunningAction(input: unknown) {
  const parsed = operatorDunningActionCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’action de relance est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    invoice_id: parsed.data.invoiceId || null,
    action_type: parsed.data.actionType,
    status: parsed.data.status,
    due_date: parsed.data.dueDate || null,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_dunning_actions').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'dunning_action.created',
    entityType: 'angelcare360_operator_dunning_actions',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data }
}

export async function completeOperatorDunningAction(input: unknown) {
  const parsed = operatorDunningActionCompleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’action de relance est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_dunning_actions').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_dunning_actions').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'dunning_action.completed',
    entityType: 'angelcare360_operator_dunning_actions',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data }
}
