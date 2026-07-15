import { getOperatorClient, safeList, toRecord } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { operatorSupportTicketAssignSchema, operatorSupportTicketCreateSchema, operatorSupportTicketResolveSchema, operatorSupportTicketStatusChangeSchema } from './validation'
import type { Angelcare360OperatorSupportTicketRecord } from '@/types/angelcare360/operator'

export async function listOperatorSupportTickets() {
  await requireAngelcare360OperatorPermission('operator.support.view')
  return (await safeList('angelcare360_operator_support_tickets', '*', [], ['updated_at', { ascending: false }])) as Angelcare360OperatorSupportTicketRecord[]
}

export async function getOperatorSupportTicketById(id: string) {
  await requireAngelcare360OperatorPermission('operator.support.view')
  const supabase = await getOperatorClient()
  const { data } = await supabase.from('angelcare360_operator_support_tickets').select('*').eq('id', id).maybeSingle()
  return (data as Angelcare360OperatorSupportTicketRecord | null) ?? null
}

export async function createOperatorSupportTicket(input: unknown) {
  const parsed = operatorSupportTicketCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le ticket est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.support.create')
  const supabase = await getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId,
    tenant_id: parsed.data.tenantId || null,
    subject: parsed.data.subject,
    description: parsed.data.description,
    category: parsed.data.category,
    priority: parsed.data.priority,
    status: parsed.data.status,
    assigned_to: parsed.data.assignedTo || null,
    resolution_summary: parsed.data.resolutionSummary || null,
  }
  const { data, error } = await supabase.from('angelcare360_operator_support_tickets').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'support',
    action: 'support_ticket.created',
    entityType: 'angelcare360_operator_support_tickets',
    entityId: String(data.id),
    clientId: parsed.data.clientId,
    tenantId: parsed.data.tenantId || null,
    severity: 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSupportTicketRecord }
}

export async function assignOperatorSupportTicket(input: unknown) {
  const parsed = operatorSupportTicketAssignSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le ticket est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.support.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_support_tickets').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { assigned_to: parsed.data.assignedTo, status: 'assigned', updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_support_tickets').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'support',
    action: 'support_ticket.assigned',
    entityType: 'angelcare360_operator_support_tickets',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSupportTicketRecord }
}

export async function changeOperatorSupportTicketStatus(input: unknown) {
  const parsed = operatorSupportTicketStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le ticket est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.support.update')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_support_tickets').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = {
    status: parsed.data.status,
    resolution_summary: parsed.data.reason || (before as Record<string, unknown> | null)?.resolution_summary || null,
    resolved_at: parsed.data.status === 'resolved' ? new Date().toISOString() : (before as Record<string, unknown> | null)?.resolved_at || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('angelcare360_operator_support_tickets').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'support',
    action: 'support_ticket.status_changed',
    entityType: 'angelcare360_operator_support_tickets',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSupportTicketRecord }
}

export async function resolveOperatorSupportTicket(input: unknown) {
  const parsed = operatorSupportTicketResolveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le ticket est invalide.' }
  const session = await requireAngelcare360OperatorPermission('operator.support.resolve')
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from('angelcare360_operator_support_tickets').select('*').eq('id', parsed.data.id).maybeSingle()
  const payload = { status: 'resolved', resolution_summary: parsed.data.resolutionSummary, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('angelcare360_operator_support_tickets').update(payload).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({
    module: 'support',
    action: 'support_ticket.resolved',
    entityType: 'angelcare360_operator_support_tickets',
    entityId: String(data.id),
    clientId: String((data as Record<string, unknown>).client_id),
    tenantId: (data as Record<string, unknown>).tenant_id ? String((data as Record<string, unknown>).tenant_id) : null,
    severity: 'notice',
    beforeData: toRecord(before),
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })
  return { ok: true, record: data as Angelcare360OperatorSupportTicketRecord }
}

