import { createClient } from '@/lib/supabase/server'
import { DEFAULT_ACTIONS, DEFAULT_APIS, DEFAULT_FEATURE_FLAGS, DEFAULT_INCIDENTS, DEFAULT_MODULES, DEFAULT_OPTION_GROUPS, DEFAULT_OPTIONS } from './catalog'
import type { FactoryAction, FactoryApi, FactoryAuditEvent, FactoryFeatureFlag, FactoryIncident, FactoryModule, FactoryOption, FactoryOptionGroup, FactoryOverview } from './types'

type TableName =
  | 'saas_factory_modules'
  | 'saas_factory_option_groups'
  | 'saas_factory_options'
  | 'saas_factory_feature_flags'
  | 'saas_factory_incidents'
  | 'saas_factory_action_registry'
  | 'saas_factory_api_registry'
  | 'saas_factory_audit_events'

const fallbackByTable: Record<TableName, any[]> = {
  saas_factory_modules: DEFAULT_MODULES,
  saas_factory_option_groups: DEFAULT_OPTION_GROUPS,
  saas_factory_options: DEFAULT_OPTIONS,
  saas_factory_feature_flags: DEFAULT_FEATURE_FLAGS,
  saas_factory_incidents: DEFAULT_INCIDENTS,
  saas_factory_action_registry: DEFAULT_ACTIONS,
  saas_factory_api_registry: DEFAULT_APIS,
  saas_factory_audit_events: [
    { event_type: 'factory.phase2.loaded', title: 'SaaS Factory Command Phase 2 loaded', actor: 'system', module_key: 'saas_factory_command', severity: 'info', metadata_json: { phase: 2 }, created_at: new Date().toISOString() },
  ],
}

async function getSupabase() {
  try {
    return await createClient()
  } catch (error) {
    console.warn('[saas-factory] Supabase unavailable, using seeded fallback.', error)
    return null
  }
}

async function listTable<T>(table: TableName, orderColumn = 'created_at', ascending = false): Promise<{ data: T[]; source: 'supabase' | 'fallback'; error?: string }> {
  const supabase = await getSupabase()
  if (!supabase) return { data: fallbackByTable[table] as T[], source: 'fallback' }

  try {
    const query = supabase.from(table).select('*')
    const { data, error } = await query.order(orderColumn, { ascending })
    if (error) return { data: fallbackByTable[table] as T[], source: 'fallback', error: error.message }
    return { data: (data || fallbackByTable[table]) as T[], source: 'supabase' }
  } catch (error: any) {
    return { data: fallbackByTable[table] as T[], source: 'fallback', error: error?.message || 'Unknown table read error' }
  }
}

async function upsertTable<T extends Record<string, any>>(table: TableName, payload: T, conflict = 'key') {
  const supabase = await getSupabase()
  const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

  if (!supabase) {
    return { ok: true, data: { ...cleanPayload, id: cleanPayload.id || `local-${Date.now()}` }, source: 'fallback', warning: 'Supabase unavailable. Returned local preview object only.' }
  }

  try {
    const { data, error } = await supabase.from(table).upsert(cleanPayload, { onConflict: conflict }).select().single()
    if (error) return { ok: false, error: error.message, source: 'supabase' }
    await logAudit({ event_type: `${table}.upsert`, title: `Updated ${table}`, module_key: String((payload as any).module_key || 'saas_factory_command'), severity: 'info', metadata_json: { payload: cleanPayload } })
    return { ok: true, data, source: 'supabase' }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Unknown upsert error', source: 'supabase' }
  }
}

async function patchById<T extends Record<string, any>>(table: TableName, id: string, payload: T) {
  const supabase = await getSupabase()
  const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

  if (!supabase) return { ok: true, data: { id, ...cleanPayload }, source: 'fallback', warning: 'Supabase unavailable. Returned local preview object only.' }

  try {
    const { data, error } = await supabase.from(table).update({ ...cleanPayload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return { ok: false, error: error.message, source: 'supabase' }
    await logAudit({ event_type: `${table}.patch`, title: `Patched ${table}`, module_key: String((payload as any).module_key || 'saas_factory_command'), severity: 'info', metadata_json: { id, payload: cleanPayload } })
    return { ok: true, data, source: 'supabase' }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Unknown patch error', source: 'supabase' }
  }
}

export async function getFactoryOverview(): Promise<FactoryOverview & { source: string; warnings: string[] }> {
  const [modules, groups, options, featureFlags, incidents, actions, apis, auditEvents] = await Promise.all([
    listTable<FactoryModule>('saas_factory_modules', 'label', true),
    listTable<FactoryOptionGroup>('saas_factory_option_groups', 'label', true),
    listTable<FactoryOption>('saas_factory_options', 'sort_order', true),
    listTable<FactoryFeatureFlag>('saas_factory_feature_flags', 'module_key', true),
    listTable<FactoryIncident>('saas_factory_incidents'),
    listTable<FactoryAction>('saas_factory_action_registry', 'module_key', true),
    listTable<FactoryApi>('saas_factory_api_registry', 'module_key', true),
    listTable<FactoryAuditEvent>('saas_factory_audit_events'),
  ])

  const all = [modules, groups, options, featureFlags, incidents, actions, apis, auditEvents]
  const warnings = all.map((entry) => entry.error).filter(Boolean) as string[]
  const source = all.some((entry) => entry.source === 'supabase') ? 'supabase' : 'fallback'

  return {
    source,
    warnings,
    counts: {
      modules: modules.data.length,
      options: options.data.length,
      featureFlags: featureFlags.data.length,
      incidents: incidents.data.length,
      actions: actions.data.length,
      apis: apis.data.length,
      auditEvents: auditEvents.data.length,
    },
    modules: modules.data,
    optionGroups: groups.data,
    options: options.data,
    featureFlags: featureFlags.data,
    incidents: incidents.data,
    actions: actions.data,
    apis: apis.data,
    auditEvents: auditEvents.data,
  }
}

export async function listFactoryModules() { return listTable<FactoryModule>('saas_factory_modules', 'label', true) }
export async function listFactoryOptions() { return listTable<FactoryOption>('saas_factory_options', 'sort_order', true) }
export async function listFactoryOptionGroups() { return listTable<FactoryOptionGroup>('saas_factory_option_groups', 'label', true) }
export async function listFactoryFeatureFlags() { return listTable<FactoryFeatureFlag>('saas_factory_feature_flags', 'module_key', true) }
export async function listFactoryIncidents() { return listTable<FactoryIncident>('saas_factory_incidents') }
export async function listFactoryActions() { return listTable<FactoryAction>('saas_factory_action_registry', 'module_key', true) }
export async function listFactoryApis() { return listTable<FactoryApi>('saas_factory_api_registry', 'module_key', true) }
export async function listFactoryAuditEvents() { return listTable<FactoryAuditEvent>('saas_factory_audit_events') }

export async function saveFactoryModule(payload: Partial<FactoryModule>) {
  return upsertTable('saas_factory_modules', { ...payload, key: payload.key, label: payload.label || payload.key, status: payload.status || 'operational', updated_at: new Date().toISOString() }, 'key')
}

export async function saveFactoryOption(payload: Partial<FactoryOption>) {
  return upsertTable('saas_factory_options', { ...payload, group_key: payload.group_key || 'cities', value: payload.value, label: payload.label || payload.value, is_enabled: payload.is_enabled ?? true, sort_order: payload.sort_order || 100, updated_at: new Date().toISOString() }, 'group_key,value')
}

export async function saveFactoryOptionGroup(payload: Partial<FactoryOptionGroup>) {
  return upsertTable('saas_factory_option_groups', { ...payload, key: payload.key, label: payload.label || payload.key, is_enabled: payload.is_enabled ?? true, updated_at: new Date().toISOString() }, 'key')
}

export async function saveFactoryFeatureFlag(payload: Partial<FactoryFeatureFlag>) {
  return upsertTable('saas_factory_feature_flags', { ...payload, key: payload.key, label: payload.label || payload.key, module_key: payload.module_key || 'saas_factory_command', status: payload.status || 'disabled', rollout_percent: payload.rollout_percent ?? 0, updated_at: new Date().toISOString() }, 'key')
}

export async function saveFactoryIncident(payload: Partial<FactoryIncident>) {
  return upsertTable('saas_factory_incidents', { ...payload, title: payload.title || 'Untitled incident', severity: payload.severity || 'warning', status: payload.status || 'open', source: payload.source || 'manual', updated_at: new Date().toISOString() }, 'id')
}

export async function saveFactoryAction(payload: Partial<FactoryAction>) {
  return upsertTable('saas_factory_action_registry', { ...payload, module_key: payload.module_key || 'saas_factory_command', page_path: payload.page_path || '/saas-factory-command', action_key: payload.action_key, action_label: payload.action_label || payload.action_key, action_type: payload.action_type || 'button', status: payload.status || 'unknown', updated_at: new Date().toISOString() }, 'module_key,page_path,action_key')
}

export async function saveFactoryApi(payload: Partial<FactoryApi>) {
  return upsertTable('saas_factory_api_registry', { ...payload, route: payload.route, module_key: payload.module_key || 'saas_factory_command', method: payload.method || 'GET', status: payload.status || 'operational', last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'route,method')
}

export async function patchFactoryRecord(table: TableName, id: string, payload: Record<string, any>) {
  return patchById(table, id, payload)
}

export async function logAudit(event: Partial<FactoryAuditEvent>) {
  const supabase = await getSupabase()
  const payload = {
    event_type: event.event_type || 'saas_factory.event',
    title: event.title || 'SaaS Factory event',
    actor: event.actor || 'system',
    module_key: event.module_key || 'saas_factory_command',
    severity: event.severity || 'info',
    metadata_json: event.metadata_json || {},
  }

  if (!supabase) return { ok: true, data: payload, source: 'fallback' }

  try {
    const { data, error } = await supabase.from('saas_factory_audit_events').insert(payload).select().single()
    if (error) return { ok: false, error: error.message, source: 'supabase' }
    return { ok: true, data, source: 'supabase' }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Unknown audit error', source: 'supabase' }
  }
}

export async function seedFactoryCatalog() {
  const results = []
  for (const row of DEFAULT_OPTION_GROUPS) results.push(await saveFactoryOptionGroup(row))
  for (const row of DEFAULT_MODULES) results.push(await saveFactoryModule(row))
  for (const row of DEFAULT_OPTIONS) results.push(await saveFactoryOption(row))
  for (const row of DEFAULT_FEATURE_FLAGS) results.push(await saveFactoryFeatureFlag(row))
  for (const row of DEFAULT_ACTIONS) results.push(await saveFactoryAction(row))
  for (const row of DEFAULT_APIS) results.push(await saveFactoryApi(row))
  await logAudit({ event_type: 'saas_factory.seed', title: 'Seeded SaaS Factory Phase 2 catalog', severity: 'info', metadata_json: { results: results.length } })
  return { ok: results.every((result) => result.ok !== false), results }
}
