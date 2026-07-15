import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorOnboardingTaskCompleteSchema, operatorOnboardingTaskCreateSchema, operatorOnboardingTaskUpdateSchema } from './validation'
import type { Angelcare360OperatorOnboardingTaskRecord } from '@/types/angelcare360/operator'

export async function listOperatorOnboardingTasks() {
  await requireAngelcare360OperatorPermission('operator.onboarding.view')
  return (await safeList('angelcare360_operator_onboarding_tasks', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorOnboardingTaskRecord[]
}

export async function createOperatorOnboardingTask(input: unknown) {
  const parsed = operatorOnboardingTaskCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.onboarding.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    owner_id: parsed.data.ownerId || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_onboarding_tasks').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'onboarding',
    action: 'onboarding_task.created',
    entityType: 'angelcare360_operator_onboarding_tasks',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorOnboardingTaskRecord }
}

export async function updateOperatorOnboardingTask(input: unknown) {
  const parsed = operatorOnboardingTaskUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.onboarding.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_onboarding_tasks').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    owner_id: parsed.data.ownerId || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_onboarding_tasks').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'onboarding',
    action: 'onboarding_task.updated',
    entityType: 'angelcare360_operator_onboarding_tasks',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorOnboardingTaskRecord }
}

export async function completeOperatorOnboardingTask(input: unknown) {
  const parsed = operatorOnboardingTaskCompleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.onboarding.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_onboarding_tasks').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_onboarding_tasks').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'onboarding',
    action: 'onboarding_task.completed',
    entityType: 'angelcare360_operator_onboarding_tasks',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorOnboardingTaskRecord }
}

