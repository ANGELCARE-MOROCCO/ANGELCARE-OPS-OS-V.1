import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

export function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

export function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

export function asDateOnly(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export function buildCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export async function getContextOrNull(schoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  return context?.school ? context : null
}

export async function countRows(client: SupabaseClient, table: string, schoolId?: string | null, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (schoolId) query = query.eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

export async function fetchAuditRows(options: {
  schoolId: string
  modules: string[]
  filters?: { search?: string | null; action?: string | null; severity?: string | null; entityType?: string | null; entityId?: string | null; actorUserId?: string | null; status?: string | null; from?: string | null; to?: string | null }
  limit?: number
}): Promise<Angelcare360AuditRecord[]> {
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', options.schoolId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 200)

  if (options.modules.length === 1) {
    query = query.eq('module', options.modules[0])
  } else if (options.modules.length > 1) {
    query = query.in('module', options.modules)
  }

  const filters = options.filters || {}
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters.actorUserId) query = query.eq('actor_user_id', filters.actorUserId)
  if (filters.status) query = query.eq('metadata->>status', filters.status)
  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) query = query.lte('created_at', filters.to)
  if (filters.search) {
    const needle = `%${filters.search}%`
    query = query.or(`action.ilike.${needle},entity_type.ilike.${needle},module.ilike.${needle}`)
  }

  const { data } = await query
  return ((data || []) as unknown as Angelcare360AuditRecord[]) || []
}

export async function auditReportingEvent(input: {
  category: 'reports' | 'exports' | 'documents'
  module: string
  action: string
  schoolId: string
  entityType: string
  entityId: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: input.category,
    module: input.module,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

export function recordToRow(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Row
}
