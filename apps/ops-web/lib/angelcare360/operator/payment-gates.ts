import { getOperatorClient, safeList, summarizeMoney, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorPaymentGateCreateSchema, operatorPaymentGateStatusSchema } from './validation'
import { getAngelcare360PaymentProviderStatus, createAngelcare360CheckoutSession } from '@/lib/angelcare360/payments/provider'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'

export async function listOperatorPaymentGates() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return (await safeList('angelcare360_operator_payment_gates', '*', [], ['updated_at', { ascending: false }])) as Angelcare360PaymentGateRecord[]
}

export async function getOperatorPaymentGateById(id: string) {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  const supabase = await getOperatorClient()
  const { data } = await supabase.from('angelcare360_operator_payment_gates').select('*').eq('id', id).maybeSingle()
  return (data as Angelcare360PaymentGateRecord | null) ?? null
}

export async function createOperatorPaymentGate(input: unknown) {
  const parsed = operatorPaymentGateCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le gate de paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    invoice_id: parsed.data.invoiceId || null,
    subscription_id: parsed.data.subscriptionId || null,
    gate_code: parsed.data.gateCode,
    status: parsed.data.status,
    amount_due_mad: parsed.data.amountDueMad,
    currency: parsed.data.currency || 'MAD',
    reason: parsed.data.reason,
    due_date: parsed.data.dueDate || null,
    blocking: parsed.data.blocking ?? true,
    provider_key: parsed.data.providerKey || null,
    checkout_url: parsed.data.checkoutUrl || null,
    online_payment_reference: parsed.data.onlinePaymentReference || null,
    created_by: session.user.id,
  }
  const { data, error } = await supabase.from('angelcare360_operator_payment_gates').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment_gate.created',
    entityType: 'angelcare360_operator_payment_gates',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360PaymentGateRecord }
}

export async function updateOperatorPaymentGateStatus(input: unknown) {
  const parsed = operatorPaymentGateStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le gate de paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_payment_gates').select('*').eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Le gate de paiement est introuvable.' }
  const payload = {
    status: parsed.data.status,
    resolution_reason: parsed.data.resolutionReason || (before as Record<string, unknown>).resolution_reason || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_payment_gates').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment_gate.status_changed',
    entityType: 'angelcare360_operator_payment_gates',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: parsed.data.status === 'waived' || parsed.data.status === 'cancelled' ? 'warning' : 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360PaymentGateRecord }
}

export async function markOperatorPaymentGateManualPending(input: unknown) {
  return updateOperatorPaymentGateStatus({ ...(input as Record<string, unknown>), status: 'manual_pending' })
}

export async function markOperatorPaymentGateManualProcessed(input: unknown) {
  const parsed = operatorPaymentGateStatusSchema.safeParse({ ...(input as Record<string, unknown>), status: 'processed' })
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le gate de paiement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.billing.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_payment_gates').select('*').eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Le gate de paiement est introuvable.' }
  const payload = {
    status: 'processed',
    manual_processed_by: session.user.id,
    manual_processed_at: new Date().toISOString(),
    resolved_by: session.user.id,
    resolved_at: new Date().toISOString(),
    resolution_reason: parsed.data.resolutionReason || (before as Record<string, unknown>).resolution_reason || 'Traité manuellement par AngelCare.',
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_payment_gates').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'billing',
    action: 'payment_gate.manual_processed',
    entityType: 'angelcare360_operator_payment_gates',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360PaymentGateRecord }
}

export async function waiveOperatorPaymentGate(input: unknown) {
  return updateOperatorPaymentGateStatus({ ...(input as Record<string, unknown>), status: 'waived' })
}

export async function cancelOperatorPaymentGate(input: unknown) {
  return updateOperatorPaymentGateStatus({ ...(input as Record<string, unknown>), status: 'cancelled' })
}

export async function expireOperatorPaymentGate(input: unknown) {
  return updateOperatorPaymentGateStatus({ ...(input as Record<string, unknown>), status: 'expired' })
}

export async function getAngelcare360OperatorPaymentGateOverview() {
  const paymentGates = await listOperatorPaymentGates()
  const provider = getAngelcare360PaymentProviderStatus()
  return {
    paymentGates,
    activeCount: paymentGates.filter((gate) => String(gate.status) === 'active').length,
    unresolvedCount: paymentGates.filter((gate) => ['active', 'online_processing', 'manual_pending'].includes(String(gate.status))).length,
    amountDueMad: summarizeMoney(paymentGates.map((gate) => gate.amount_due_mad)),
    provider,
  }
}

export async function tryCreateOperatorCheckoutSession(input: { gateCode: string; amountDueMad: number; currency?: string | null; returnUrl?: string | null }) {
  const provider = getAngelcare360PaymentProviderStatus()
  if (!provider.configured) {
    return {
      ok: false,
      locked: true,
      error: provider.reason,
      provider,
    }
  }
  return createAngelcare360CheckoutSession(input)
}

