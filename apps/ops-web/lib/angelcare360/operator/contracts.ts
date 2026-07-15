import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorContractCreateSchema, operatorContractStatusUpdateSchema } from './validation'
import type { Angelcare360OperatorContractRecord } from '@/types/angelcare360/operator'

export async function listOperatorContracts() {
  await requireAngelcare360OperatorPermission('operator.contracts.view')
  return (await safeList('angelcare360_operator_contracts', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorContractRecord[]
}

export async function createOperatorContract(input: unknown) {
  const parsed = operatorContractCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le contrat est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.contracts.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    subscription_id: parsed.data.subscriptionId || null,
    contract_code: parsed.data.contractCode,
    status: parsed.data.status,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate || null,
    renewal_date: parsed.data.renewalDate || null,
    signed_at: parsed.data.signedAt || null,
    document_url: parsed.data.documentUrl || null,
    notes: parsed.data.notes || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_contracts').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'contracts',
    action: 'contract.created',
    entityType: 'angelcare360_operator_contracts',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorContractRecord }
}

export async function updateOperatorContractStatus(input: unknown) {
  const parsed = operatorContractStatusUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le contrat est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.contracts.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_contracts').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: parsed.data.status, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_contracts').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'contracts',
    action: 'contract.status_changed',
    entityType: 'angelcare360_operator_contracts',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorContractRecord }
}

