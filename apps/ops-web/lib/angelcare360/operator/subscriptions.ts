import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorSubscriptionCancelSchema, operatorSubscriptionCreateSchema, operatorSubscriptionStatusChangeSchema, operatorSubscriptionUpdateSchema } from './validation'
import type { Angelcare360OperatorSubscriptionRecord } from '@/types/angelcare360/operator'

export async function listOperatorSubscriptions() {
  await requireAngelcare360OperatorPermission('operator.subscriptions.view')
  return (await safeList('angelcare360_operator_subscriptions', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorSubscriptionRecord[]
}

export async function createOperatorSubscription(input: unknown) {
  const parsed = operatorSubscriptionCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’abonnement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.subscriptions.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    plan_id: parsed.data.planId,
    subscription_code: parsed.data.subscriptionCode,
    status: parsed.data.status,
    start_date: parsed.data.startDate,
    trial_ends_at: parsed.data.trialEndsAt || null,
    current_period_start: parsed.data.currentPeriodStart || null,
    current_period_end: parsed.data.currentPeriodEnd || null,
    billing_cycle: parsed.data.billingCycle,
    billing_amount_mad: parsed.data.billingAmountMad,
    discount_amount_mad: parsed.data.discountAmountMad || 0,
    cancellation_reason: parsed.data.cancellationReason || null,
    suspended_reason: parsed.data.suspendedReason || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'subscriptions',
    action: 'subscription.created',
    entityType: 'angelcare360_operator_subscriptions',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSubscriptionRecord }
}

export async function updateOperatorSubscription(input: unknown) {
  const parsed = operatorSubscriptionUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’abonnement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_subscriptions').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    plan_id: parsed.data.planId,
    subscription_code: parsed.data.subscriptionCode,
    status: parsed.data.status,
    start_date: parsed.data.startDate,
    trial_ends_at: parsed.data.trialEndsAt || null,
    current_period_start: parsed.data.currentPeriodStart || null,
    current_period_end: parsed.data.currentPeriodEnd || null,
    billing_cycle: parsed.data.billingCycle,
    billing_amount_mad: parsed.data.billingAmountMad,
    discount_amount_mad: parsed.data.discountAmountMad || 0,
    cancellation_reason: parsed.data.cancellationReason || null,
    suspended_reason: parsed.data.suspendedReason || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'subscriptions',
    action: 'subscription.updated',
    entityType: 'angelcare360_operator_subscriptions',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSubscriptionRecord }
}

export async function changeOperatorSubscriptionStatus(input: unknown) {
  const parsed = operatorSubscriptionStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le statut est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_subscriptions').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: parsed.data.status, cancellation_reason: parsed.data.reason || null, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'subscriptions',
    action: 'subscription.status_changed',
    entityType: 'angelcare360_operator_subscriptions',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSubscriptionRecord }
}

export async function cancelOperatorSubscription(input: unknown) {
  const parsed = operatorSubscriptionCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’abonnement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.subscriptions.cancel')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_subscriptions').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'cancelled', cancellation_reason: parsed.data.reason || 'Annulé par opérateur', updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_subscriptions').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'subscriptions',
    action: 'subscription.cancelled',
    entityType: 'angelcare360_operator_subscriptions',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'warning',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole, reason: parsed.data.reason || null },
  })
  return { ok: true, record: data as Angelcare360OperatorSubscriptionRecord }
}

