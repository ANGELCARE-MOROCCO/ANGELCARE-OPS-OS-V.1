import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorIncidentCreateSchema, operatorIncidentResolveSchema, operatorNoteCreateSchema, operatorServiceEventCreateSchema, operatorServiceRequestCompleteSchema, operatorServiceRequestCreateSchema, operatorServiceRequestUpdateSchema, operatorTaskCompleteSchema, operatorTaskCreateSchema, operatorTaskUpdateSchema } from './validation'
import type {
  Angelcare360OperatorIncidentRecord,
  Angelcare360OperatorNoteRecord,
  Angelcare360OperatorServiceEventRecord,
  Angelcare360OperatorServiceRequestRecord,
  Angelcare360OperatorTaskRecord,
} from '@/types/angelcare360/operator'

export async function listOperatorServiceRequests() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return (await safeList('angelcare360_operator_service_requests', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorServiceRequestRecord[]
}

export async function listOperatorTasks() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return (await safeList('angelcare360_operator_tasks', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorTaskRecord[]
}

export async function listOperatorNotes() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return (await safeList('angelcare360_operator_notes', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorNoteRecord[]
}

export async function createOperatorServiceRequest(input: unknown) {
  const parsed = operatorServiceRequestCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La demande service est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    request_type: parsed.data.requestType,
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    status: parsed.data.status,
    assigned_to: parsed.data.assignedTo || null,
    due_date: parsed.data.dueDate || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_service_requests').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'service_request.created',
    entityType: 'angelcare360_operator_service_requests',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorServiceRequestRecord }
}

export async function updateOperatorServiceRequest(input: unknown) {
  const parsed = operatorServiceRequestUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La demande service est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_service_requests').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    request_type: parsed.data.requestType,
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    status: parsed.data.status,
    assigned_to: parsed.data.assignedTo || null,
    due_date: parsed.data.dueDate || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_service_requests').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'service_request.updated',
    entityType: 'angelcare360_operator_service_requests',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorServiceRequestRecord }
}

export async function completeOperatorServiceRequest(input: unknown) {
  const parsed = operatorServiceRequestCompleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La demande service est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_service_requests').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'resolved', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_service_requests').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'service_request.completed',
    entityType: 'angelcare360_operator_service_requests',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorServiceRequestRecord }
}

export async function listOperatorIncidents() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return (await safeList('angelcare360_operator_incidents', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorIncidentRecord[]
}

export async function createOperatorIncident(input: unknown) {
  const parsed = operatorIncidentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’incident est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId || null,
    tenant_id: parsed.data.tenantId || null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    title: parsed.data.title,
    description: parsed.data.description,
    started_at: parsed.data.startedAt || new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_incidents').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'incident.created',
    entityType: 'angelcare360_operator_incidents',
    entityId: String(data.id),
    clientId: parsed.data.clientId || null,
    tenantId: parsed.data.tenantId || null,
    severity: parsed.data.severity === 'critical' ? 'critical' : 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorIncidentRecord }
}

export async function resolveOperatorIncident(input: unknown) {
  const parsed = operatorIncidentResolveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’incident est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_incidents').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'resolved', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_incidents').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'incident.resolved',
    entityType: 'angelcare360_operator_incidents',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id || ''),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorIncidentRecord }
}

export async function createOperatorTask(input: unknown) {
  const parsed = operatorTaskCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId || null,
    tenant_id: parsed.data.tenantId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    owner_id: parsed.data.ownerId || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_tasks').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'task.created',
    entityType: 'angelcare360_operator_tasks',
    entityId: String(data.id),
    clientId: parsed.data.clientId || null,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorTaskRecord }
}

export async function updateOperatorTask(input: unknown) {
  const parsed = operatorTaskUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_tasks').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    client_id: parsed.data.clientId || null,
    tenant_id: parsed.data.tenantId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    owner_id: parsed.data.ownerId || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_tasks').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'task.updated',
    entityType: 'angelcare360_operator_tasks',
    entityId: String(data.id),
    clientId: parsed.data.clientId || null,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorTaskRecord }
}

export async function completeOperatorTask(input: unknown) {
  const parsed = operatorTaskCompleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La tâche est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_tasks').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_tasks').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'task.completed',
    entityType: 'angelcare360_operator_tasks',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id || ''),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorTaskRecord }
}

export async function createOperatorNote(input: unknown) {
  const parsed = operatorNoteCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La note est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId || null,
    tenant_id: parsed.data.tenantId || null,
    author_id: parsed.data.authorId || session.user.id,
    note_type: parsed.data.noteType,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
  }
  const { data, error } = await supabase.from('angelcare360_operator_notes').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'service',
    action: 'note.created',
    entityType: 'angelcare360_operator_notes',
    entityId: String(data.id),
    clientId: parsed.data.clientId || null,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorNoteRecord }
}

export async function listOperatorServiceEvents(options?: { clientId?: string | null; tenantId?: string | null }) {
  await requireAngelcare360OperatorPermission('operator.service.view')
  const filters: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]> = []
  if (options?.clientId) filters.push(['client_id', 'eq', options.clientId])
  if (options?.tenantId) filters.push(['tenant_id', 'eq', options.tenantId])
  return (await safeList('angelcare360_operator_service_events', '*', filters, ['occurred_at', { ascending: false }])) as Angelcare360OperatorServiceEventRecord[]
}
