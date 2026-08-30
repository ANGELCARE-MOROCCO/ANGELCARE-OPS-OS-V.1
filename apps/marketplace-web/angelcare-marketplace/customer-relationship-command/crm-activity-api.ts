import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, parseJsonObject, requestId, requireText } from '../server/request'
import { MarketplaceError } from '../server/errors'
import {
  createCustomerCrmTask, listCustomerCrmActivity, logCustomerCrmCommunication, updateCustomerCrmTask,
  type CrmCommunicationChannel, type CrmCommunicationDirection, type CrmTaskPriority, type CrmTaskStatus,
} from './crm-activity'

const priorities = new Set<CrmTaskPriority>(['low', 'normal', 'high', 'critical'])
const statuses = new Set<CrmTaskStatus>(['open', 'in_progress', 'blocked', 'completed', 'cancelled'])
const channels = new Set<CrmCommunicationChannel>(['email', 'phone', 'whatsapp', 'meeting', 'visit', 'other'])
const directions = new Set<CrmCommunicationDirection>(['inbound', 'outbound', 'internal'])

function enumValue<T extends string>(value: unknown, allowed: Set<T>, label: string): T {
  const candidate = String(value || '') as T
  if (!allowed.has(candidate)) throw new MarketplaceError('VALIDATION_ERROR', `${label} invalide.`)
  return candidate
}

function timestamp(value: unknown, label: string, required = false): string | null {
  if (value === null || value === undefined || value === '') {
    if (required) throw new MarketplaceError('VALIDATION_ERROR', `${label} requis.`)
    return null
  }
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new MarketplaceError('VALIDATION_ERROR', `${label} invalide.`)
  return date.toISOString()
}

function optionalUuid(value: unknown, label: string): string | null {
  const candidate = cleanOptionalText(value, 64)
  if (!candidate) return null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) throw new MarketplaceError('VALIDATION_ERROR', `${label} doit être un identifiant opérateur valide.`)
  return candidate
}

export async function handleCustomerCrmActivity(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.crm.view')
    if (request.method !== 'GET') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non autorisée.')
    return apiSuccess(await listCustomerCrmActivity(customerId), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCustomerCrmTasks(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.crm.tasks.manage')
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non autorisée.')
    const body = await parseJsonObject(request)
    const task = await createCustomerCrmTask({
      customerId, title: requireText(body.title, 'title', 'Titre', 180), description: cleanOptionalText(body.description, 2000),
      priority: enumValue(body.priority || 'normal', priorities, 'Priorité'), assigneeId: optionalUuid(body.assigneeId, 'Assignation'),
      dueAt: timestamp(body.dueAt, 'Échéance'), nextAction: cleanOptionalText(body.nextAction, 500), context, request, requestId: rid,
    })
    return apiSuccess(task, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCustomerCrmTask(request: Request, customerId: string, taskId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.crm.tasks.manage')
    if (request.method !== 'PATCH') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non autorisée.')
    const body = await parseJsonObject(request)
    const patch: Parameters<typeof updateCustomerCrmTask>[0]['patch'] = {}
    if (body.title !== undefined) patch.title = requireText(body.title, 'title', 'Titre', 180)
    if (body.description !== undefined) patch.description = cleanOptionalText(body.description, 2000)
    if (body.priority !== undefined) patch.priority = enumValue(body.priority, priorities, 'Priorité')
    if (body.status !== undefined) patch.status = enumValue(body.status, statuses, 'Statut')
    if (body.assigneeId !== undefined) patch.assignee_id = optionalUuid(body.assigneeId, 'Assignation')
    if (body.dueAt !== undefined) patch.due_at = timestamp(body.dueAt, 'Échéance')
    if (body.nextAction !== undefined) patch.next_action = cleanOptionalText(body.nextAction, 500)
    if (!Object.keys(patch).length) throw new MarketplaceError('VALIDATION_ERROR', 'Aucune modification fournie.')
    return apiSuccess(await updateCustomerCrmTask({ customerId, taskId, patch, context, request, requestId: rid }), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCustomerCrmCommunications(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.crm.communications.log')
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non autorisée.')
    const body = await parseJsonObject(request)
    const communication = await logCustomerCrmCommunication({
      customerId, channel: enumValue(body.channel, channels, 'Canal'), direction: enumValue(body.direction, directions, 'Direction'),
      subject: cleanOptionalText(body.subject, 180), summary: requireText(body.summary, 'summary', 'Résumé', 4000),
      evidenceReference: cleanOptionalText(body.evidenceReference, 500), occurredAt: timestamp(body.occurredAt || new Date().toISOString(), 'Date de communication', true)!,
      context, request, requestId: rid,
    })
    return apiSuccess(communication, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}
