import type { WorkspaceActionRequest, WorkspaceActionResponse } from './ops-dispatch-workspace'

const TABLES = {
  missions: 'missions',
  agents: 'caregivers',
  sectors: 'carelink_ops_city_sectors',
  incidents: 'incidents',
  communications: 'carelink_dispatch_messages',
  audit: 'carelink_ops_audit_events',
  scheduleBlocks: 'carelink_ops_schedule_blocks',
} as const

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  return { url: url.replace(/\/$/, ''), key }
}

async function rest<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const { url, key } = supabaseConfig()
  if (!url || !key) return { ok: false, status: 0, data: null, error: 'Supabase URL or key is not configured.' }

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  let data: T | null = null
  if (text && contentType.includes('application/json')) {
    try {
      data = JSON.parse(text) as T
    } catch {
      return { ok: false, status: res.status, data: null, error: text.slice(0, 500) }
    }
  }

  if (!res.ok) {
    const errorPayload = data as { message?: string; details?: string; hint?: string } | null
    return { ok: false, status: res.status, data, error: errorPayload?.message || errorPayload?.details || errorPayload?.hint || text.slice(0, 500) || `HTTP ${res.status}` }
  }

  return { ok: true, status: res.status, data }
}

function cleanArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean)
  return []
}

function cleanPayload(payload: Record<string, unknown>, allowed: string[]) {
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (payload[key] === undefined) continue
    if (key === 'assigned_agent_id') {
      out.caregiver_id = payload[key] === '' ? null : payload[key]
      continue
    }
    if (['skills', 'required_skills', 'blockers'].includes(key)) out[key] = cleanArray(payload[key])
    else out[key] = payload[key] === '' ? null : payload[key]
  }
  return out
}

async function logAudit(action: string, entityType: string, entityId: string | null, payload: Record<string, unknown>) {
  await rest(TABLES.audit, {
    method: 'POST',
    body: JSON.stringify([{ action, entity_type: entityType, entity_id: entityId, actor_name: String(payload.actor_name || 'CareLink Ops'), payload }]),
  })
}

async function insert(table: string, entityType: string, action: string, payload: Record<string, unknown>, allowed: string[]): Promise<WorkspaceActionResponse> {
  const body = cleanPayload(payload, allowed)
  const res = await rest<Record<string, unknown>[]>(table, { method: 'POST', body: JSON.stringify([body]) })
  if (!res.ok) return { ok: false, action, message: `${entityType} creation failed.`, error: res.error }
  const id = res.data?.[0]?.id ? String(res.data[0].id) : null
  await logAudit(`${entityType}.created`, entityType, id, body)
  return { ok: true, action, message: `${entityType} created.`, data: res.data?.[0] || null }
}

async function update(table: string, entityType: string, action: string, id: string, payload: Record<string, unknown>, allowed: string[]): Promise<WorkspaceActionResponse> {
  const body = cleanPayload(payload, allowed)
  const res = await rest<Record<string, unknown>[]>(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) })
  if (!res.ok) return { ok: false, action, message: `${entityType} update failed.`, error: res.error }
  await logAudit(`${entityType}.updated`, entityType, id, body)
  return { ok: true, action, message: `${entityType} updated.`, data: res.data?.[0] || null }
}

async function remove(table: string, entityType: string, action: string, id: string): Promise<WorkspaceActionResponse> {
  const res = await rest<Record<string, unknown>[]>(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, action, message: `${entityType} deletion failed.`, error: res.error }
  await logAudit(`${entityType}.deleted`, entityType, id, {})
  return { ok: true, action, message: `${entityType} deleted.`, data: res.data || [] }
}

export async function runCareLinkDispatchWorkspaceAction(input: WorkspaceActionRequest): Promise<WorkspaceActionResponse> {
  const payload = input.payload || {}
  const id = input.entityId || input.missionId || input.agentId || ''

  const missionFields = [
    'mission_code',
    'status',
    'service_type',
    'client_name',
    'beneficiary_name',
    'city',
    'zone',
    'address',
    'scheduled_start',
    'scheduled_end',
    'priority',
    'readiness_score',
    'sla_minutes_remaining',
    'risk_level',
    'caregiver_id',
    'assigned_agent_id',
    'mission_kind',
    'mission_group_id',
    'parent_mission_id',
    'occurrence_index',
    'recurrence_type',
    'recurrence_rule',
    'recurrence_start_date',
    'recurrence_end_date',
    'lifecycle_stage',
    'readiness_status',
    'validation_status',
    'report_status',
    'service_family',
    'mission_scope',
    'internal_procedure_level',
    'ops_priority',
    'sla_status',
    'confirmed_at',
    'started_at',
    'completed_at',
    'incident_at',
    'cancelled_at',
    'dossier_reference',
    'is_archived',
    'ops_notes',
    'required_skills',
    'blockers',
    'notes',
    'latitude',
    'longitude',
    'metadata',
  ]
  const agentFields = ['agent_code', 'full_name', 'status', 'city', 'zone', 'skills', 'readiness_score', 'reliability_score', 'active_missions_count', 'next_available_at', 'latitude', 'longitude', 'metadata']
  const sectorFields = ['city_name', 'sector_name', 'region', 'lat', 'lng', 'polygon_geojson', 'load_level', 'active_missions_count', 'open_agents_count', 'metadata']
  const incidentFields = ['mission_id', 'mission_code', 'incident_type', 'severity', 'status', 'city', 'zone', 'summary', 'owner_name', 'sla_due_at', 'metadata']
  const communicationFields = ['mission_id', 'mission_code', 'channel', 'sender_name', 'message_type', 'body', 'priority', 'metadata']
  const scheduleFields = ['agent_id', 'mission_id', 'city', 'zone', 'block_type', 'status', 'starts_at', 'ends_at', 'notes', 'metadata']

  if (input.action === 'create_mission') return insert(TABLES.missions, 'mission', input.action, { status: 'new_request', ...payload }, missionFields)
  if (input.action === 'update_mission' && id) return update(TABLES.missions, 'mission', input.action, id, payload, missionFields)
  if (input.action === 'delete_mission' && id) return remove(TABLES.missions, 'mission', input.action, id)
  if (input.action === 'assign_mission' && input.missionId && input.agentId) return update(TABLES.missions, 'mission', input.action, input.missionId, { caregiver_id: input.agentId, status: 'assigned', ...payload }, missionFields)
  if (input.action === 'reassign_mission' && input.missionId && input.agentId) return update(TABLES.missions, 'mission', input.action, input.missionId, { caregiver_id: input.agentId, status: 'assigned', ...payload }, missionFields)
  if (input.action === 'set_status' && input.missionId) return update(TABLES.missions, 'mission', input.action, input.missionId, { status: payload.status || 'ready_for_dispatch' }, missionFields)
  if (input.action === 'escalate_mission' && input.missionId) return update(TABLES.missions, 'mission', input.action, input.missionId, { status: 'escalation', risk_level: 'high', ...payload }, missionFields)

  if (input.action === 'create_agent') return insert(TABLES.agents, 'agent', input.action, payload, agentFields)
  if (input.action === 'update_agent' && id) return update(TABLES.agents, 'agent', input.action, id, payload, agentFields)
  if (input.action === 'delete_agent' && id) return remove(TABLES.agents, 'agent', input.action, id)

  if (input.action === 'create_sector') return insert(TABLES.sectors, 'sector', input.action, payload, sectorFields)
  if (input.action === 'update_sector' && id) return update(TABLES.sectors, 'sector', input.action, id, payload, sectorFields)
  if (input.action === 'delete_sector' && id) return remove(TABLES.sectors, 'sector', input.action, id)

  if (input.action === 'create_incident') return insert(TABLES.incidents, 'incident', input.action, { status: 'open', ...payload }, incidentFields)
  if (input.action === 'update_incident' && id) return update(TABLES.incidents, 'incident', input.action, id, payload, incidentFields)
  if (input.action === 'close_incident' && id) return update(TABLES.incidents, 'incident', input.action, id, { status: 'closed', ...payload }, incidentFields)
  if (input.action === 'delete_incident' && id) return remove(TABLES.incidents, 'incident', input.action, id)

  if (input.action === 'create_communication' || input.action === 'broadcast_message' || input.action === 'add_note') {
    const body = input.action === 'broadcast_message' ? { channel: 'broadcast', message_type: 'broadcast', priority: 'high', ...payload } : payload
    return insert(TABLES.communications, 'communication', input.action, body, communicationFields)
  }
  if (input.action === 'delete_communication' && id) return remove(TABLES.communications, 'communication', input.action, id)

  if (input.action === 'create_schedule_block') return insert(TABLES.scheduleBlocks, 'schedule_block', input.action, payload, scheduleFields)
  if (input.action === 'update_schedule_block' && id) return update(TABLES.scheduleBlocks, 'schedule_block', input.action, id, payload, scheduleFields)
  if (input.action === 'delete_schedule_block' && id) return remove(TABLES.scheduleBlocks, 'schedule_block', input.action, id)

  if (input.action === 'import_requests') {
    const rows = Array.isArray(payload.rows) ? payload.rows : []
    if (!rows.length) return { ok: false, action: input.action, message: 'No rows provided.', error: 'payload.rows is required.' }
    const cleaned = rows.map((row) => cleanPayload(row as Record<string, unknown>, missionFields))
    const res = await rest<Record<string, unknown>[]>(TABLES.missions, { method: 'POST', body: JSON.stringify(cleaned) })
    if (!res.ok) return { ok: false, action: input.action, message: 'Import failed.', error: res.error }
    await logAudit('missions.imported', 'mission', null, { count: cleaned.length })
    return { ok: true, action: input.action, message: 'Mission requests imported.', data: res.data || [] }
  }

  if (input.action === 'optimize_routes') {
    await logAudit('routes.optimization_requested', 'dispatch', null, payload)
    return { ok: true, action: input.action, message: 'Route optimization request logged. Connect routing engine to write route plans.', data: { writeMode: 'audit-only' } }
  }

  return { ok: false, action: input.action, message: 'Unsupported or incomplete workspace action.', error: 'Missing required entity id or unsupported action.' }
}
