import { createClient } from '@/lib/supabase/server'
import { getOperatorClient, safeList } from './shared'
import { requireAngelcare360OperatorPermission, requireAngelcare360OperatorSession } from './access'
import type { Angelcare360OperatorAuditLogRecord, Angelcare360OperatorAuditSeverity } from '@/types/angelcare360/operator'

export type Angelcare360OperatorAuditInput = {
  module: string
  action: string
  entityType: string
  entityId?: string | null
  clientId?: string | null
  tenantId?: string | null
  severity?: Angelcare360OperatorAuditSeverity
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export async function writeOperatorAuditLog(input: Angelcare360OperatorAuditInput) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) return { ok: false, persisted: false, error: 'Cette action nécessite un accès opérateur AngelCare.' }
  const supabase = await createClient()
  const payload = {
    actor_user_id: session.user.id,
    actor_role: session.operatorRole,
    client_id: input.clientId || null,
    tenant_id: input.tenantId || null,
    module: input.module,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    severity: input.severity || 'info',
    before_data: input.beforeData || null,
    after_data: input.afterData || null,
    metadata: {
      ...(input.metadata || {}),
      access_level: session.access.accessLevel,
      role_label: session.access.roleLabel,
    },
  }

  const { data, error } = await supabase.from('angelcare360_operator_audit_logs').insert(payload).select('*').single()
  if (error) return { ok: false, persisted: false, error: error.message }
  return { ok: true, persisted: true, record: data as Angelcare360OperatorAuditLogRecord }
}

export type OperatorAuditFilters = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  clientId?: string | null
  tenantId?: string | null
  from?: string | null
  to?: string | null
}

export async function listOperatorAuditLogs(filters?: OperatorAuditFilters) {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  const conditions: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]> = []
  if (filters?.module) conditions.push(['module', 'eq', filters.module])
  if (filters?.action) conditions.push(['action', 'eq', filters.action])
  if (filters?.severity) conditions.push(['severity', 'eq', filters.severity])
  if (filters?.clientId) conditions.push(['client_id', 'eq', filters.clientId])
  if (filters?.tenantId) conditions.push(['tenant_id', 'eq', filters.tenantId])
  if (filters?.from) conditions.push(['created_at', 'gte', filters.from])
  if (filters?.to) conditions.push(['created_at', 'lte', filters.to])
  return (await safeList('angelcare360_operator_audit_logs', '*', conditions, ['created_at', { ascending: false }])) as Angelcare360OperatorAuditLogRecord[]
}

export async function listOperatorAuditEvents(filters?: OperatorAuditFilters) {
  return listOperatorAuditLogs(filters)
}
