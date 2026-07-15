import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorRenewalCreateSchema, operatorRenewalStatusUpdateSchema } from './validation'
import type { Angelcare360OperatorRenewalRecord } from '@/types/angelcare360/operator'

export async function listOperatorRenewals() {
  await requireAngelcare360OperatorPermission('operator.renewals.view')
  return (await safeList('angelcare360_operator_renewals', '*', [], ['renewal_date', { ascending: true }])) as Angelcare360OperatorRenewalRecord[]
}

export async function createOperatorRenewal(input: unknown) {
  const parsed = operatorRenewalCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le renouvellement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.renewals.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    subscription_id: parsed.data.subscriptionId || null,
    renewal_date: parsed.data.renewalDate,
    status: parsed.data.status,
    probability: parsed.data.probability ?? null,
    expected_amount_mad: parsed.data.expectedAmountMad ?? null,
    owner_id: parsed.data.ownerId || null,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_renewals').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'renewals',
    action: 'renewal.created',
    entityType: 'angelcare360_operator_renewals',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorRenewalRecord }
}

export async function updateOperatorRenewalStatus(input: unknown) {
  const parsed = operatorRenewalStatusUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le renouvellement est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.renewals.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_renewals').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: parsed.data.status, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_renewals').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'renewals',
    action: 'renewal.status_changed',
    entityType: 'angelcare360_operator_renewals',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorRenewalRecord }
}

