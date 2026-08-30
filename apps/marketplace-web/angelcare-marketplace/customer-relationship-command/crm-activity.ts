import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'

export type CrmTaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
export type CrmTaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type CrmCommunicationChannel = 'email' | 'phone' | 'whatsapp' | 'meeting' | 'visit' | 'other'
export type CrmCommunicationDirection = 'inbound' | 'outbound' | 'internal'

export type CrmTask = {
  id: string; public_reference: string; title: string; description: string | null
  related_type: string; related_id: string; status: CrmTaskStatus; priority: CrmTaskPriority
  owner_id: string | null; assignee_id: string | null; due_at: string | null
  completed_at: string | null; next_action: string | null; created_by: string | null
  updated_by: string | null; created_at: string; updated_at: string
}

export type CrmCommunicationLog = {
  id: string; related_type: string; related_id: string; channel: CrmCommunicationChannel
  direction: CrmCommunicationDirection; subject: string | null; summary: string
  evidence_reference: string | null; occurred_at: string; actor_id: string | null; created_at: string
}

const taskSelect = 'id,public_reference,title,description,related_type,related_id,status,priority,owner_id,assignee_id,due_at,completed_at,next_action,created_by,updated_by,created_at,updated_at'
const communicationSelect = 'id,related_type,related_id,channel,direction,subject,summary,evidence_reference,occurred_at,actor_id,created_at'

function dbFailure(operation: string, error: unknown): never {
  throw new MarketplaceError('INTERNAL_ERROR', `Impossible de ${operation}.`, { cause: error, retryable: true })
}

async function assertCustomer(customerId: string) {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_customer_accounts').select('id').eq('id', customerId).maybeSingle()
  if (error) dbFailure('vérifier le client', error)
  if (!data) throw new MarketplaceError('NOT_FOUND', 'Client introuvable.')
}

export async function listCustomerCrmActivity(customerId: string) {
  await assertCustomer(customerId)
  const db = await createServiceClient()
  const [tasksResult, communicationsResult, auditResult] = await Promise.all([
    db.from('angelcare_marketplace_crm_tasks').select(taskSelect).eq('related_type', 'customer_account').eq('related_id', customerId).order('updated_at', { ascending: false }).limit(250),
    db.from('angelcare_marketplace_crm_communication_logs').select(communicationSelect).eq('related_type', 'customer_account').eq('related_id', customerId).order('occurred_at', { ascending: false }).limit(250),
    db.from('angelcare_marketplace_audit_events').select('id,action,object_type,object_id,actor_id,before_value,after_value,reason,created_at').in('object_type', ['crm_task', 'crm_communication_log']).order('created_at', { ascending: false }).limit(500),
  ])
  if (tasksResult.error) dbFailure('charger les tâches CRM', tasksResult.error)
  if (communicationsResult.error) dbFailure('charger les communications CRM', communicationsResult.error)
  if (auditResult.error) dbFailure('charger l’historique CRM', auditResult.error)
  const objectIds = new Set([...(tasksResult.data || []), ...(communicationsResult.data || [])].map((row) => String(row.id)))
  return {
    tasks: (tasksResult.data || []) as CrmTask[],
    communications: (communicationsResult.data || []) as CrmCommunicationLog[],
    history: (auditResult.data || []).filter((row) => objectIds.has(String(row.object_id))),
  }
}

export async function createCustomerCrmTask(input: {
  customerId: string; title: string; description: string | null; priority: CrmTaskPriority
  assigneeId: string | null; dueAt: string | null; nextAction: string | null
  context: MarketplaceRequestContext; request: Request; requestId: string
}) {
  await assertCustomer(input.customerId)
  const now = new Date().toISOString()
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_crm_tasks').insert({
    title: input.title, description: input.description, related_type: 'customer_account', related_id: input.customerId,
    status: 'open', priority: input.priority, owner_id: input.context.actor.id, assignee_id: input.assigneeId,
    due_at: input.dueAt, next_action: input.nextAction, created_by: input.context.actor.id, updated_by: input.context.actor.id,
    created_at: now, updated_at: now,
  }).select(taskSelect).single()
  if (error || !data) dbFailure('créer la tâche CRM', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, request: input.request, action: 'marketplace.crm.task.created', objectType: 'crm_task', objectId: String(data.id), afterValue: data, source: 'marketplace-crm-task-authority' })
  return data as CrmTask
}

export async function updateCustomerCrmTask(input: {
  customerId: string; taskId: string; patch: Partial<Pick<CrmTask, 'title' | 'description' | 'status' | 'priority' | 'assignee_id' | 'due_at' | 'next_action'>>
  context: MarketplaceRequestContext; request: Request; requestId: string
}) {
  const db = await createServiceClient()
  const { data: before, error: readError } = await db.from('angelcare_marketplace_crm_tasks').select(taskSelect).eq('id', input.taskId).eq('related_type', 'customer_account').eq('related_id', input.customerId).maybeSingle()
  if (readError) dbFailure('lire la tâche CRM', readError)
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Tâche CRM introuvable.')
  const current = String(before.status) as CrmTaskStatus
  const target = input.patch.status
  const transitions: Record<CrmTaskStatus, CrmTaskStatus[]> = {
    open: ['in_progress', 'blocked', 'completed', 'cancelled'], in_progress: ['open', 'blocked', 'completed', 'cancelled'],
    blocked: ['open', 'in_progress', 'completed', 'cancelled'], completed: ['open'], cancelled: ['open'],
  }
  if (target && target !== current && !transitions[current].includes(target)) throw new MarketplaceError('CONFLICT', `Transition CRM ${current} → ${target} non autorisée.`)
  const now = new Date().toISOString()
  const update = { ...input.patch, completed_at: target === 'completed' ? now : target ? null : before.completed_at, updated_by: input.context.actor.id, updated_at: now }
  const { data, error } = await db.from('angelcare_marketplace_crm_tasks').update(update).eq('id', input.taskId).eq('related_type', 'customer_account').eq('related_id', input.customerId).select(taskSelect).single()
  if (error || !data) dbFailure('mettre à jour la tâche CRM', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, request: input.request, action: target && target !== current ? `marketplace.crm.task.${target}` : 'marketplace.crm.task.updated', objectType: 'crm_task', objectId: input.taskId, beforeValue: before, afterValue: data, source: 'marketplace-crm-task-authority' })
  return data as CrmTask
}

export async function logCustomerCrmCommunication(input: {
  customerId: string; channel: CrmCommunicationChannel; direction: CrmCommunicationDirection
  subject: string | null; summary: string; evidenceReference: string | null; occurredAt: string
  context: MarketplaceRequestContext; request: Request; requestId: string
}) {
  await assertCustomer(input.customerId)
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_crm_communication_logs').insert({
    related_type: 'customer_account', related_id: input.customerId, channel: input.channel, direction: input.direction,
    subject: input.subject, summary: input.summary, evidence_reference: input.evidenceReference,
    occurred_at: input.occurredAt, actor_id: input.context.actor.id,
  }).select(communicationSelect).single()
  if (error || !data) dbFailure('journaliser la communication CRM', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, request: input.request, action: 'marketplace.crm.communication.logged', objectType: 'crm_communication_log', objectId: String(data.id), afterValue: data, source: 'marketplace-crm-communication-authority' })
  return data as CrmCommunicationLog
}
