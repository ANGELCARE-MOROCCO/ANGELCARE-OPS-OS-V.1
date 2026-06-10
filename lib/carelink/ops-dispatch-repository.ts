import type {
  DispatchActionRequest,
  DispatchActionResponse,
  DispatchAgent,
  DispatchAuditEvent,
  DispatchIncident,
  DispatchKpi,
  DispatchLane,
  DispatchMessage,
  DispatchMission,
  DispatchPayload,
  DispatchSector,
} from './ops-dispatch-types'

const TABLES = {
  missions: 'carelink_ops_missions',
  agents: 'carelink_ops_agents',
  sectors: 'carelink_ops_city_sectors',
  incidents: 'carelink_ops_incidents',
  communications: 'carelink_ops_communications',
  audit: 'carelink_ops_audit_events',
} as const

const DISPATCH_LANES: Array<{ key: string; label: string; tone: DispatchLane['tone'] }> = [
  { key: 'new_request', label: 'New Requests', tone: 'blue' },
  { key: 'qualification', label: 'Qualification', tone: 'amber' },
  { key: 'ready_for_dispatch', label: 'Ready for Dispatch', tone: 'green' },
  { key: 'matching', label: 'Matching', tone: 'cyan' },
  { key: 'proposed', label: 'Proposed', tone: 'violet' },
  { key: 'assigned', label: 'Assigned', tone: 'slate' },
  { key: 'accepted', label: 'Accepted', tone: 'green' },
  { key: 'en_route', label: 'En Route', tone: 'blue' },
  { key: 'on_site', label: 'On Site', tone: 'cyan' },
  { key: 'at_risk', label: 'At Risk', tone: 'red' },
  { key: 'escalation', label: 'Escalations', tone: 'red' },
]

function nowIso() {
  return new Date().toISOString()
}

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

function baseEmptyPayload(source: DispatchPayload['source'] = 'live-empty', message?: string): DispatchPayload {
  const missions: DispatchMission[] = []
  const agents: DispatchAgent[] = []
  const sectors: DispatchSector[] = []
  const incidents: DispatchIncident[] = []
  const communications: DispatchMessage[] = []
  const auditTrail: DispatchAuditEvent[] = []
  return {
    ok: source !== 'error',
    source,
    generatedAt: nowIso(),
    message,
    kpis: buildKpis(missions, agents, incidents),
    lanes: buildLanes(missions),
    missions,
    agents,
    sectors,
    incidents,
    communications,
    auditTrail,
    metadata: {
      dbConnected: false,
      schemaReady: false,
      tablesChecked: Object.values(TABLES),
      warnings: message ? [message] : [],
    },
  }
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
    const payload = data as { message?: string; details?: string; hint?: string; code?: string } | null
    return {
      ok: false,
      status: res.status,
      data,
      error: payload?.message || payload?.details || payload?.hint || text.slice(0, 500) || `HTTP ${res.status}`,
    }
  }

  return { ok: true, status: res.status, data }
}

function arrayOrEmpty<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return value.split(',').map((x) => x.trim()).filter(Boolean)
  return []
}

function normalizeMission(row: Record<string, unknown>): DispatchMission {
  return {
    id: String(row.id || ''),
    mission_code: String(row.mission_code || row.id || ''),
    status: String(row.status || 'new_request'),
    service_type: row.service_type ? String(row.service_type) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    beneficiary_name: row.beneficiary_name ? String(row.beneficiary_name) : null,
    city: row.city ? String(row.city) : null,
    zone: row.zone ? String(row.zone) : null,
    address: row.address ? String(row.address) : null,
    scheduled_start: row.scheduled_start ? String(row.scheduled_start) : null,
    scheduled_end: row.scheduled_end ? String(row.scheduled_end) : null,
    priority: row.priority ? String(row.priority) : null,
    readiness_score: typeof row.readiness_score === 'number' ? row.readiness_score : null,
    sla_minutes_remaining: typeof row.sla_minutes_remaining === 'number' ? row.sla_minutes_remaining : null,
    risk_level: row.risk_level ? String(row.risk_level) : null,
    assigned_agent_id: row.assigned_agent_id ? String(row.assigned_agent_id) : null,
    assigned_agent_name: row.assigned_agent_name ? String(row.assigned_agent_name) : null,
    required_skills: normalizeStringArray(row.required_skills),
    blockers: normalizeStringArray(row.blockers),
    notes: row.notes ? String(row.notes) : null,
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  }
}

function normalizeAgent(row: Record<string, unknown>): DispatchAgent {
  return {
    id: String(row.id || ''),
    agent_code: row.agent_code ? String(row.agent_code) : null,
    full_name: String(row.full_name || row.agent_name || 'Field Agent'),
    status: row.status ? String(row.status) : null,
    city: row.city ? String(row.city) : null,
    zone: row.zone ? String(row.zone) : null,
    skills: normalizeStringArray(row.skills),
    readiness_score: typeof row.readiness_score === 'number' ? row.readiness_score : null,
    reliability_score: typeof row.reliability_score === 'number' ? row.reliability_score : null,
    active_missions_count: typeof row.active_missions_count === 'number' ? row.active_missions_count : null,
    next_available_at: row.next_available_at ? String(row.next_available_at) : null,
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  }
}

function normalizeSector(row: Record<string, unknown>): DispatchSector {
  return {
    id: String(row.id || ''),
    city_name: String(row.city_name || ''),
    sector_name: String(row.sector_name || ''),
    region: row.region ? String(row.region) : null,
    lat: typeof row.lat === 'number' ? row.lat : null,
    lng: typeof row.lng === 'number' ? row.lng : null,
    polygon_geojson: row.polygon_geojson || null,
    load_level: row.load_level ? String(row.load_level) : null,
    active_missions_count: typeof row.active_missions_count === 'number' ? row.active_missions_count : null,
    open_agents_count: typeof row.open_agents_count === 'number' ? row.open_agents_count : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  }
}

function normalizeIncident(row: Record<string, unknown>): DispatchIncident {
  return {
    id: String(row.id || ''),
    mission_id: row.mission_id ? String(row.mission_id) : null,
    mission_code: row.mission_code ? String(row.mission_code) : null,
    incident_type: String(row.incident_type || 'Incident'),
    severity: row.severity ? String(row.severity) : null,
    status: row.status ? String(row.status) : null,
    city: row.city ? String(row.city) : null,
    zone: row.zone ? String(row.zone) : null,
    summary: row.summary ? String(row.summary) : null,
    owner_name: row.owner_name ? String(row.owner_name) : null,
    sla_due_at: row.sla_due_at ? String(row.sla_due_at) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  }
}

function normalizeMessage(row: Record<string, unknown>): DispatchMessage {
  return {
    id: String(row.id || ''),
    mission_id: row.mission_id ? String(row.mission_id) : null,
    mission_code: row.mission_code ? String(row.mission_code) : null,
    channel: row.channel ? String(row.channel) : null,
    sender_name: row.sender_name ? String(row.sender_name) : null,
    message_type: row.message_type ? String(row.message_type) : null,
    body: row.body ? String(row.body) : null,
    priority: row.priority ? String(row.priority) : null,
    created_at: row.created_at ? String(row.created_at) : null,
  }
}

function normalizeAudit(row: Record<string, unknown>): DispatchAuditEvent {
  return {
    id: String(row.id || ''),
    entity_type: String(row.entity_type || 'carelink'),
    entity_id: row.entity_id ? String(row.entity_id) : null,
    action: String(row.action || 'event'),
    actor_name: row.actor_name ? String(row.actor_name) : null,
    payload: typeof row.payload === 'object' && row.payload ? (row.payload as Record<string, unknown>) : {},
    created_at: row.created_at ? String(row.created_at) : null,
  }
}

function isAtRisk(mission: DispatchMission) {
  return mission.status === 'at_risk' || mission.status === 'escalation' || (mission.sla_minutes_remaining !== null && mission.sla_minutes_remaining < 0) || mission.risk_level === 'high'
}

function buildKpis(missions: DispatchMission[], agents: DispatchAgent[], incidents: DispatchIncident[]): DispatchKpi[] {
  const openMissions = missions.filter((m) => !['completed', 'cancelled'].includes(String(m.status)))
  const readyAgents = agents.filter((a) => ['available', 'ready', 'online'].includes(String(a.status || '').toLowerCase()))
  const atRisk = openMissions.filter(isAtRisk)
  const escalations = incidents.filter((i) => ['open', 'triaged', 'escalated'].includes(String(i.status || '').toLowerCase()))
  const unassigned = openMissions.filter((m) => !m.assigned_agent_id && ['new_request', 'qualification', 'ready_for_dispatch', 'matching', 'proposed'].includes(String(m.status)))
  return [
    { key: 'unassigned', label: 'Unassigned Missions', value: unassigned.length, helper: 'Needs assignment', tone: 'blue' },
    { key: 'dispatch_backlog', label: 'Dispatch Backlog', value: openMissions.length, helper: 'Open operational demand', tone: 'orange' },
    { key: 'agents_ready', label: 'Agents Ready', value: readyAgents.length, helper: 'Available now', tone: 'green' },
    { key: 'missions_at_risk', label: 'Missions At Risk', value: atRisk.length, helper: 'Requires dispatcher review', tone: 'red' },
    { key: 'escalations_open', label: 'Escalations Open', value: escalations.length, helper: 'Open incident workflow', tone: 'violet' },
    { key: 'sla_breaches', label: 'SLA Breaches', value: openMissions.filter((m) => (m.sla_minutes_remaining ?? 9999) < 0).length, helper: 'Past due', tone: 'red' },
  ]
}

function buildLanes(missions: DispatchMission[]): DispatchLane[] {
  return DISPATCH_LANES.map((lane) => {
    const laneMissions = missions.filter((m) => m.status === lane.key)
    return {
      ...lane,
      count: laneMissions.length,
      missions: laneMissions,
    }
  })
}

export async function getCareLinkOpsDispatchPayload(): Promise<DispatchPayload> {
  const { url, key } = supabaseConfig()
  if (!url || !key) {
    return baseEmptyPayload('live-empty', 'Supabase is not configured. Dispatch page is ready and waiting for live CareLink Ops tables.')
  }

  const [missionsRes, agentsRes, sectorsRes, incidentsRes, communicationsRes, auditRes] = await Promise.all([
    rest<Record<string, unknown>[]>(`${TABLES.missions}?select=*&order=scheduled_start.asc.nullslast&limit=200`),
    rest<Record<string, unknown>[]>(`${TABLES.agents}?select=*&order=updated_at.desc.nullslast&limit=200`),
    rest<Record<string, unknown>[]>(`${TABLES.sectors}?select=*&order=city_name.asc,sector_name.asc&limit=500`),
    rest<Record<string, unknown>[]>(`${TABLES.incidents}?select=*&order=created_at.desc.nullslast&limit=100`),
    rest<Record<string, unknown>[]>(`${TABLES.communications}?select=*&order=created_at.desc.nullslast&limit=100`),
    rest<Record<string, unknown>[]>(`${TABLES.audit}?select=*&order=created_at.desc.nullslast&limit=120`),
  ])

  const allResults = [missionsRes, agentsRes, sectorsRes, incidentsRes, communicationsRes, auditRes]
  const missingSchema = allResults.find((r) => !r.ok && /does not exist|schema cache|Could not find|relation/i.test(String(r.error || '')))
  if (missingSchema) {
    return baseEmptyPayload('schema-missing', `CareLink Ops dispatch schema is not ready: ${missingSchema.error}`)
  }

  const warnings = allResults.filter((r) => !r.ok).map((r) => r.error || `HTTP ${r.status}`)

  const missions = arrayOrEmpty(missionsRes.data).map(normalizeMission)
  const agents = arrayOrEmpty(agentsRes.data).map(normalizeAgent)
  const sectors = arrayOrEmpty(sectorsRes.data).map(normalizeSector)
  const incidents = arrayOrEmpty(incidentsRes.data).map(normalizeIncident)
  const communications = arrayOrEmpty(communicationsRes.data).map(normalizeMessage)
  const auditTrail = arrayOrEmpty(auditRes.data).map(normalizeAudit)

  return {
    ok: true,
    source: warnings.length ? 'live-empty' : 'live-db',
    generatedAt: nowIso(),
    kpis: buildKpis(missions, agents, incidents),
    lanes: buildLanes(missions),
    missions,
    agents,
    sectors,
    incidents,
    communications,
    auditTrail,
    metadata: {
      dbConnected: true,
      schemaReady: warnings.length === 0,
      tablesChecked: Object.values(TABLES),
      warnings,
    },
  }
}

async function logAudit(action: string, entityType: string, entityId: string | null, payload: Record<string, unknown>) {
  await rest(`${TABLES.audit}`, {
    method: 'POST',
    body: JSON.stringify([{ action, entity_type: entityType, entity_id: entityId, actor_name: String(payload.actor_name || 'CareLink Ops'), payload }]),
  })
}

export async function createMission(payload: Record<string, unknown>): Promise<DispatchActionResponse> {
  const body = {
    mission_code: payload.mission_code || null,
    status: payload.status || 'new_request',
    service_type: payload.service_type || null,
    client_name: payload.client_name || null,
    beneficiary_name: payload.beneficiary_name || null,
    city: payload.city || null,
    zone: payload.zone || null,
    address: payload.address || null,
    scheduled_start: payload.scheduled_start || null,
    scheduled_end: payload.scheduled_end || null,
    priority: payload.priority || 'normal',
    required_skills: Array.isArray(payload.required_skills) ? payload.required_skills : [],
    notes: payload.notes || null,
  }

  const res = await rest<Record<string, unknown>[]>(TABLES.missions, { method: 'POST', body: JSON.stringify([body]) })
  if (!res.ok) return { ok: false, action: 'create_mission', message: 'Mission creation failed.', error: res.error }
  await logAudit('mission.created', 'mission', res.data?.[0]?.id ? String(res.data[0].id) : null, body)
  return { ok: true, action: 'create_mission', message: 'Mission created.', data: res.data?.[0] || null }
}

export async function updateMission(id: string, payload: Record<string, unknown>): Promise<DispatchActionResponse> {
  const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
  if (!res.ok) return { ok: false, action: 'update_mission', message: 'Mission update failed.', error: res.error }
  await logAudit('mission.updated', 'mission', id, payload)
  return { ok: true, action: 'update_mission', message: 'Mission updated.', data: res.data?.[0] || null }
}

export async function deleteMission(id: string): Promise<DispatchActionResponse> {
  const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, action: 'delete_mission', message: 'Mission deletion failed.', error: res.error }
  await logAudit('mission.deleted', 'mission', id, {})
  return { ok: true, action: 'delete_mission', message: 'Mission deleted from CareLink Ops.', data: res.data || [] }
}

async function assignMission(id: string, agentId: string, status = 'assigned'): Promise<DispatchActionResponse> {
  const agentRes = await rest<Record<string, unknown>[]>(`${TABLES.agents}?id=eq.${encodeURIComponent(agentId)}&select=id,full_name&limit=1`)
  const agent = agentRes.data?.[0]
  const payload = { assigned_agent_id: agentId, assigned_agent_name: agent?.full_name || null, status }
  const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
  if (!res.ok) return { ok: false, action: 'assign_mission', message: 'Mission assignment failed.', error: res.error }
  await logAudit('mission.assigned', 'mission', id, payload)
  return { ok: true, action: 'assign_mission', message: 'Mission assigned.', data: res.data?.[0] || null }
}

export async function runDispatchAction(input: DispatchActionRequest): Promise<DispatchActionResponse> {
  const action = input.action
  const payload = input.payload || {}

  if (action === 'create_mission') return createMission(payload)
  if (action === 'update_mission' && input.missionId) return updateMission(input.missionId, payload)
  if (action === 'delete_mission' && input.missionId) return deleteMission(input.missionId)
  if ((action === 'assign_mission' || action === 'reassign_mission') && input.missionId && input.agentId) return assignMission(input.missionId, input.agentId)
  if (action === 'set_status' && input.missionId) return updateMission(input.missionId, { status: payload.status || 'ready_for_dispatch' })
  if (action === 'escalate_mission' && input.missionId) return updateMission(input.missionId, { status: 'escalation', risk_level: 'high', blockers: payload.blockers || [] })

  if (action === 'batch_assign' && Array.isArray(input.missionIds) && input.agentId) {
    const results = []
    for (const id of input.missionIds) results.push(await assignMission(id, input.agentId))
    return { ok: results.every((r) => r.ok), action, message: 'Batch assignment executed.', data: results }
  }

  if (action === 'broadcast_message') {
    const res = await rest<Record<string, unknown>[]>(TABLES.communications, {
      method: 'POST',
      body: JSON.stringify([{ channel: payload.channel || 'dispatch', message_type: 'broadcast', body: payload.body || '', priority: payload.priority || 'normal', sender_name: payload.sender_name || 'CareLink Ops' }]),
    })
    if (!res.ok) return { ok: false, action, message: 'Broadcast failed.', error: res.error }
    await logAudit('dispatch.broadcast', 'communication', res.data?.[0]?.id ? String(res.data[0].id) : null, payload)
    return { ok: true, action, message: 'Broadcast saved.', data: res.data?.[0] || null }
  }

  if (action === 'add_note' && input.missionId) {
    const res = await rest<Record<string, unknown>[]>(TABLES.communications, {
      method: 'POST',
      body: JSON.stringify([{ mission_id: input.missionId, channel: 'dispatch', message_type: 'note', body: payload.body || '', priority: payload.priority || 'normal', sender_name: payload.sender_name || 'CareLink Ops' }]),
    })
    if (!res.ok) return { ok: false, action, message: 'Note creation failed.', error: res.error }
    await logAudit('mission.note_added', 'mission', input.missionId, payload)
    return { ok: true, action, message: 'Note added.', data: res.data?.[0] || null }
  }

  if (action === 'import_requests') {
    const rows = Array.isArray(payload.rows) ? payload.rows : []
    if (!rows.length) return { ok: false, action, message: 'No rows provided for import.', error: 'rows array is required.' }
    const normalizedRows = rows.map((row) => ({ ...(row as Record<string, unknown>), status: (row as Record<string, unknown>).status || 'new_request' }))
    const res = await rest<Record<string, unknown>[]>(TABLES.missions, { method: 'POST', body: JSON.stringify(normalizedRows) })
    if (!res.ok) return { ok: false, action, message: 'Import failed.', error: res.error }
    await logAudit('missions.imported', 'mission', null, { count: normalizedRows.length })
    return { ok: true, action, message: 'Requests imported.', data: res.data || [] }
  }

  if (action === 'optimize_routes') {
    const live = await getCareLinkOpsDispatchPayload()
    return {
      ok: true,
      action,
      message: 'Route optimization analysis completed using live loaded missions and agents. No route changes are written automatically.',
      data: {
        missionsWithCoordinates: live.missions.filter((m) => typeof m.latitude === 'number' && typeof m.longitude === 'number').length,
        agentsWithCoordinates: live.agents.filter((a) => typeof a.latitude === 'number' && typeof a.longitude === 'number').length,
        warnings: live.metadata.warnings,
      },
    }
  }

  return { ok: false, action, message: 'Unsupported or incomplete dispatch action.', error: 'Missing required missionId, agentId, missionIds, or payload.' }
}
