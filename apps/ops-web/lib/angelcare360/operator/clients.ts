import { getOperatorClient, safeList, summarizeMoney, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorClientArchiveSchema, operatorClientCreateSchema, operatorClientUpdateSchema } from './validation'
import type {
  Angelcare360OperatorClientRecord,
  Angelcare360OperatorBillingAccountRecord,
  Angelcare360OperatorTenantRecord,
  Angelcare360OperatorSubscriptionRecord,
  Angelcare360OperatorInvoiceRecord,
  Angelcare360OperatorPaymentRecord,
  Angelcare360OperatorOnboardingTaskRecord,
  Angelcare360OperatorSupportTicketRecord,
  Angelcare360OperatorContractRecord,
  Angelcare360OperatorRenewalRecord,
  Angelcare360OperatorServiceEventRecord,
  Angelcare360OperatorAuditLogRecord,
} from '@/types/angelcare360/operator'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'

export async function listOperatorClients(options?: { search?: string | null; status?: string | null; lifecycleStage?: string | null; city?: string | null }) {
  await requireAngelcare360OperatorPermission('operator.clients.view')
  const filters: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]> = []
  if (options?.status) filters.push(['status', 'eq', options.status])
  if (options?.lifecycleStage) filters.push(['lifecycle_stage', 'eq', options.lifecycleStage])
  if (options?.city) filters.push(['city', 'eq', options.city])
  const rows = await safeList('angelcare360_operator_clients', '*', filters, ['updated_at', { ascending: false }])

  const subscriptions = await safeList('angelcare360_operator_subscriptions', '*', [], ['updated_at', { ascending: false }])
  const invoices = await safeList('angelcare360_operator_invoices', '*', [], ['updated_at', { ascending: false }])
  const payments = await safeList('angelcare360_operator_payments', '*', [], ['updated_at', { ascending: false }])
  const support = await safeList('angelcare360_operator_support_tickets', '*', [], ['updated_at', { ascending: false }])
  return (rows as Angelcare360OperatorClientRecord[]).map((client) => {
    const clientSubscriptions = subscriptions.filter((row) => String(row.client_id) === client.id) as Angelcare360OperatorSubscriptionRecord[]
    const clientInvoices = invoices.filter((row) => String(row.client_id) === client.id) as Angelcare360OperatorInvoiceRecord[]
    const clientPayments = payments.filter((row) => String(row.client_id) === client.id) as Angelcare360OperatorPaymentRecord[]
    const clientSupport = support.filter((row) => String(row.client_id) === client.id) as Angelcare360OperatorSupportTicketRecord[]
    const balance = summarizeMoney(clientInvoices.map((item) => item.balance_due_mad))

    return {
      ...client,
      active_subscription_status: clientSubscriptions.find((item) => item.status === 'active')?.status || null,
      invoice_count: clientInvoices.length,
      payment_count: clientPayments.length,
      support_count: clientSupport.length,
      balance_due_mad: balance,
      detail_href: `/angelcare-360-operator/clients/${client.id}`,
    }
  })
}

export async function getOperatorClientById(id: string) {
  await requireAngelcare360OperatorPermission('operator.clients.view')
  const supabase = await getOperatorClient()
  const [clientResult, tenantsResult, billingAccountsResult, subscriptionsResult, invoicesResult, paymentsResult, onboardingResult, supportResult, contractsResult, renewalsResult, eventsResult, auditResult, paymentGatesResult] = await Promise.all([
    supabase.from('angelcare360_operator_clients').select('*').eq('id', id).maybeSingle(),
    safeList(
      'angelcare360_operator_tenants',
      'id, client_id, school_id, tenant_slug, environment, status, provisioning_status, command_center_url, go_live_date, last_access_at, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      3,
    ),
    safeList(
      'angelcare360_operator_billing_accounts',
      'id, client_id, billing_name, billing_email, billing_phone, billing_address, tax_identifier, payment_terms_days, status, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      1,
    ),
    safeList(
      'angelcare360_operator_subscriptions',
      'id, client_id, tenant_id, plan_id, subscription_code, status, start_date, trial_ends_at, current_period_start, current_period_end, billing_cycle, billing_amount_mad, discount_amount_mad, cancellation_reason, suspended_reason, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_invoices',
      'id, client_id, subscription_id, billing_account_id, invoice_number, issue_date, due_date, period_start, period_end, subtotal_mad, discount_mad, total_mad, amount_paid_mad, balance_due_mad, status, notes, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_payments',
      'id, client_id, invoice_id, payment_reference, payment_date, amount_mad, method, status, received_by, notes, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_onboarding_tasks',
      'id, client_id, tenant_id, title, description, owner_id, status, priority, due_date, completed_at, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_support_tickets',
      'id, client_id, tenant_id, subject, description, category, priority, status, assigned_to, resolution_summary, resolved_at, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_contracts',
      'id, client_id, subscription_id, contract_code, status, start_date, end_date, renewal_date, signed_at, document_url, notes, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_renewals',
      'id, client_id, subscription_id, renewal_date, status, probability, expected_amount_mad, owner_id, notes, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['updated_at', { ascending: false }],
      5,
    ),
    safeList(
      'angelcare360_operator_service_events',
      'id, client_id, tenant_id, title, event_type, severity, status, occurred_at, created_at, updated_at',
      [['client_id', 'eq', id]],
      ['occurred_at', { ascending: false }],
      10,
    ),
    safeList(
      'angelcare360_operator_audit_logs',
      'id, client_id, tenant_id, module, action, entity_type, severity, created_at',
      [['client_id', 'eq', id]],
      ['created_at', { ascending: false }],
      10,
    ),
    safeList(
      'angelcare360_operator_payment_gates',
      'id, client_id, tenant_id, invoice_id, subscription_id, gate_code, status, amount_due_mad, currency, reason, due_date, blocking, provider_key, checkout_url, online_payment_reference, resolution_reason, created_by, created_at, updated_at',
      [['client_id', 'eq', id], ['status', 'in', ['active', 'online_processing', 'manual_pending']]],
      ['updated_at', { ascending: false }],
      5,
    ),
  ])

  const client = clientResult.data as Angelcare360OperatorClientRecord | null
  if (!client) return null
  const billingAccountRows = (billingAccountsResult || []) as Angelcare360OperatorBillingAccountRecord[]
  const tenantRows = (tenantsResult || []) as Angelcare360OperatorTenantRecord[]
  const invoiceRows = (invoicesResult || []) as Angelcare360OperatorInvoiceRecord[]
  const paymentRows = (paymentsResult || []) as Angelcare360OperatorPaymentRecord[]
  const subscriptionRows = (subscriptionsResult || []) as Angelcare360OperatorSubscriptionRecord[]
  const onboardingRows = (onboardingResult || []) as Angelcare360OperatorOnboardingTaskRecord[]
  const supportRows = (supportResult || []) as Angelcare360OperatorSupportTicketRecord[]
  const contractRows = (contractsResult || []) as Angelcare360OperatorContractRecord[]
  const renewalRows = (renewalsResult || []) as Angelcare360OperatorRenewalRecord[]
  const serviceEventRows = (eventsResult || []) as Angelcare360OperatorServiceEventRecord[]
  const auditRows = (auditResult || []) as Angelcare360OperatorAuditLogRecord[]
  const paymentGateRows = (paymentGatesResult || []) as Angelcare360PaymentGateRecord[]
  const activeSubscription = subscriptionRows.find((item) => String(item.status) === 'active') || subscriptionRows[0] || null

  return {
    ...client,
    tenants: tenantRows,
    billingAccounts: billingAccountRows,
    subscriptions: subscriptionRows,
    activeSubscription,
    invoices: invoiceRows,
    payments: paymentRows,
    onboardingTasks: onboardingRows,
    supportTickets: supportRows,
    contracts: contractRows,
    renewals: renewalRows,
    serviceEvents: serviceEventRows,
    auditLogs: auditRows,
    paymentGates: paymentGateRows,
    balance_due_mad: summarizeMoney(invoiceRows.map((item) => item.balance_due_mad)),
  }
}

export async function createOperatorClient(input: unknown) {
  const parsed = operatorClientCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le client est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.clients.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_code: parsed.data.clientCode,
    display_name: parsed.data.displayName,
    legal_name: parsed.data.legalName || null,
    client_type: parsed.data.clientType,
    city: parsed.data.city || null,
    country: parsed.data.country || 'Maroc',
    address: parsed.data.address || null,
    primary_contact_name: parsed.data.primaryContactName || null,
    primary_contact_email: parsed.data.primaryContactEmail || null,
    primary_contact_phone: parsed.data.primaryContactPhone || null,
    status: parsed.data.status,
    lifecycle_stage: parsed.data.lifecycleStage,
    source: parsed.data.source || null,
    health_status: parsed.data.healthStatus || null,
    risk_level: parsed.data.riskLevel || null,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_clients').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'clients',
    action: 'client.created',
    entityType: 'angelcare360_operator_clients',
    entityId: String(data.id),
    clientId: String(data.id),
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorClientRecord }
}

export async function updateOperatorClient(input: unknown) {
  const parsed = operatorClientUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le client est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.clients.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_clients').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_code: parsed.data.clientCode,
    display_name: parsed.data.displayName,
    legal_name: parsed.data.legalName || null,
    client_type: parsed.data.clientType,
    city: parsed.data.city || null,
    country: parsed.data.country || 'Maroc',
    address: parsed.data.address || null,
    primary_contact_name: parsed.data.primaryContactName || null,
    primary_contact_email: parsed.data.primaryContactEmail || null,
    primary_contact_phone: parsed.data.primaryContactPhone || null,
    status: parsed.data.status,
    lifecycle_stage: parsed.data.lifecycleStage,
    source: parsed.data.source || null,
    health_status: parsed.data.healthStatus || null,
    risk_level: parsed.data.riskLevel || null,
    notes: parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_clients').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'clients',
    action: 'client.updated',
    entityType: 'angelcare360_operator_clients',
    entityId: String(data.id),
    clientId: String(data.id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorClientRecord }
}

export async function archiveOperatorClient(input: unknown) {
  const parsed = operatorClientArchiveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le client est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.clients.archive')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_clients').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: parsed.data.reason || (before as Record<string, unknown> | null)?.notes || null }
  const { data, error } = await supabase.from('angelcare360_operator_clients').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'clients',
    action: 'client.archived',
    entityType: 'angelcare360_operator_clients',
    entityId: String(data.id),
    clientId: String(data.id),
    severity: 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole, reason: parsed.data.reason || null },
  })
  return { ok: true, record: data as Angelcare360OperatorClientRecord }
}
