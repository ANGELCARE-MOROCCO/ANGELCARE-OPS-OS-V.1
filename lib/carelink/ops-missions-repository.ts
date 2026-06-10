import type {
  CareLinkMission,
  CareLinkMissionAgent,
  CareLinkMissionEvent,
  CareLinkMissionIncident,
  CareLinkMissionReport,
  CareLinkMissionSector,
  MissionActionRequest,
  MissionActionResponse,
  MissionControlPayload,
  MissionKpi,
  MissionLane,
  MissionTone,
  MissionWorkspace,
} from './ops-missions-types'

const TABLES = {
  missions: 'carelink_missions',
  agents: 'carelink_agent_profiles',
  events: 'carelink_mission_lifecycle_events',
  incidents: 'carelink_mission_incidents',
  reports: 'carelink_mission_reports',
  sectors: 'carelink_operation_sectors',
  notes: 'carelink_mission_notes',
}

const STATUS_FLOW: Array<{ key: string; label: string; tone: MissionTone }> = [
  { key: 'created', label: 'Created', tone: 'slate' },
  { key: 'assigned', label: 'Assigned', tone: 'blue' },
  { key: 'accepted', label: 'Accepted', tone: 'cyan' },
  { key: 'en_route', label: 'En Route', tone: 'blue' },
  { key: 'in_progress', label: 'In Progress', tone: 'emerald' },
  { key: 'report_pending', label: 'Report Pending', tone: 'amber' },
  { key: 'validation', label: 'Validation', tone: 'violet' },
  { key: 'closed', label: 'Closed', tone: 'green' },
]

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return { url: url.replace(/\/$/, ''), key }
}

async function rest<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const { url, key } = supabaseConfig()
  if (!url || !key) return { ok: false, status: 0, data: null, error: 'Supabase URL or API key is not configured.' }

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

  const text = await res.text()
  let data: T | null = null
  if (text) {
    try { data = JSON.parse(text) as T } catch { return { ok: false, status: res.status, data: null, error: text.slice(0, 400) } }
  }
  if (!res.ok) {
    const payload = data as { message?: string; details?: string; hint?: string; code?: string } | null
    return { ok: false, status: res.status, data, error: payload?.message || payload?.details || payload?.hint || text.slice(0, 400) || `HTTP ${res.status}` }
  }
  return { ok: true, status: res.status, data }
}

function str(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return value === null || value === undefined || value === '' ? null : String(value)
}

function num(row: Record<string, unknown>, key: string): number | null {
  const value = row[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeMission(row: Record<string, unknown>): CareLinkMission {
  return {
    id: String(row.id || ''),
    mission_code: String(row.mission_code || row.id || ''),
    status: str(row, 'status') || 'created',
    service_type: str(row, 'service_type'),
    visit_type: str(row, 'visit_type'),
    client_name: str(row, 'client_name'),
    beneficiary_name: str(row, 'beneficiary_name'),
    beneficiary_phone: str(row, 'beneficiary_phone'),
    member_id: str(row, 'member_id'),
    city: str(row, 'city'),
    zone: str(row, 'zone'),
    address: str(row, 'address'),
    latitude: num(row, 'latitude'),
    longitude: num(row, 'longitude'),
    scheduled_start: str(row, 'scheduled_start'),
    scheduled_end: str(row, 'scheduled_end'),
    started_at: str(row, 'started_at'),
    completed_at: str(row, 'completed_at'),
    priority: str(row, 'priority'),
    sla_due_at: str(row, 'sla_due_at'),
    sla_minutes_remaining: num(row, 'sla_minutes_remaining'),
    readiness_score: num(row, 'readiness_score'),
    checklist_total: num(row, 'checklist_total'),
    checklist_completed: num(row, 'checklist_completed'),
    assigned_agent_id: str(row, 'assigned_agent_id'),
    assigned_agent_name: str(row, 'assigned_agent_name'),
    assigned_agent_phone: str(row, 'assigned_agent_phone'),
    compliance_status: str(row, 'compliance_status'),
    report_status: str(row, 'report_status'),
    incident_count: num(row, 'incident_count') || 0,
    required_skills: arr(row.required_skills),
    blockers: arr(row.blockers),
    notes: str(row, 'notes'),
    created_at: str(row, 'created_at'),
    updated_at: str(row, 'updated_at'),
  }
}

function normalizeAgent(row: Record<string, unknown>): CareLinkMissionAgent {
  return {
    id: String(row.id || ''),
    full_name: String(row.full_name || row.agent_name || ''),
    phone: str(row, 'phone'),
    status: str(row, 'status'),
    city: str(row, 'city'),
    zone: str(row, 'zone'),
    skills: arr(row.skills),
    readiness_score: num(row, 'readiness_score'),
    reliability_score: num(row, 'reliability_score'),
    next_available_at: str(row, 'next_available_at'),
  }
}

function normalizeEvent(row: Record<string, unknown>): CareLinkMissionEvent {
  return {
    id: String(row.id || ''),
    mission_id: str(row, 'mission_id'),
    mission_code: str(row, 'mission_code'),
    action: String(row.action || row.event_type || 'event'),
    actor_name: str(row, 'actor_name'),
    event_type: str(row, 'event_type'),
    payload: (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<string, unknown>,
    created_at: str(row, 'created_at'),
  }
}

function normalizeIncident(row: Record<string, unknown>): CareLinkMissionIncident {
  return {
    id: String(row.id || ''),
    mission_id: str(row, 'mission_id'),
    mission_code: str(row, 'mission_code'),
    incident_type: String(row.incident_type || 'Incident'),
    severity: str(row, 'severity'),
    status: str(row, 'status'),
    summary: str(row, 'summary'),
    owner_name: str(row, 'owner_name'),
    sla_due_at: str(row, 'sla_due_at'),
    created_at: str(row, 'created_at'),
  }
}

function normalizeReport(row: Record<string, unknown>): CareLinkMissionReport {
  return {
    id: String(row.id || ''),
    mission_id: str(row, 'mission_id'),
    mission_code: str(row, 'mission_code'),
    report_type: str(row, 'report_type'),
    status: str(row, 'status'),
    quality_score: num(row, 'quality_score'),
    submitted_by_name: str(row, 'submitted_by_name'),
    submitted_at: str(row, 'submitted_at'),
    validation_status: str(row, 'validation_status'),
    issues: arr(row.issues),
  }
}

function normalizeSector(row: Record<string, unknown>): CareLinkMissionSector {
  return {
    id: String(row.id || ''),
    city_name: String(row.city_name || ''),
    sector_name: String(row.sector_name || ''),
    region: str(row, 'region'),
    lat: num(row, 'lat'),
    lng: num(row, 'lng'),
    active_missions_count: num(row, 'active_missions_count'),
    open_agents_count: num(row, 'open_agents_count'),
    load_level: str(row, 'load_level'),
  }
}

function emptyPayload(workspace: MissionWorkspace, warnings: string[] = []): MissionControlPayload {
  return {
    ok: true,
    source: warnings.length ? 'schema-missing' : 'live-empty',
    generatedAt: new Date(0).toISOString(),
    workspace,
    kpis: buildKpis([]),
    lanes: buildLanes([]),
    missions: [],
    agents: [],
    events: [],
    incidents: [],
    reports: [],
    sectors: [],
    metadata: { dbConnected: Boolean(supabaseConfig().url && supabaseConfig().key), schemaReady: !warnings.length, tablesChecked: Object.values(TABLES), warnings },
  }
}

function buildKpis(missions: CareLinkMission[]): MissionKpi[] {
  const today = new Date().toISOString().slice(0, 10)
  const isToday = (m: CareLinkMission) => (m.scheduled_start || '').slice(0, 10) === today
  return [
    { key: 'missions_today', label: 'Missions Today', value: missions.filter(isToday).length, helper: 'Live scheduled missions', tone: 'blue' },
    { key: 'in_progress', label: 'In Progress', value: missions.filter((m) => m.status === 'in_progress').length, helper: 'Currently active', tone: 'cyan' },
    { key: 'pending_validation', label: 'Pending Validation', value: missions.filter((m) => m.status === 'validation').length, helper: 'Awaiting ops review', tone: 'violet' },
    { key: 'at_risk', label: 'At Risk', value: missions.filter((m) => m.status === 'at_risk' || (m as any).risk_level === 'high').length, helper: 'Needs intervention', tone: 'red' },
    { key: 'completed', label: 'Completed', value: missions.filter((m) => m.status === 'closed' || m.status === 'completed').length, helper: 'Closed or completed', tone: 'green' },
    { key: 'sla_breaches', label: 'SLA Breaches', value: missions.filter((m) => typeof m.sla_minutes_remaining === 'number' && m.sla_minutes_remaining < 0).length, helper: 'Past due', tone: 'rose' },
    { key: 'reports_pending', label: 'Reports Pending', value: missions.filter((m) => m.report_status === 'pending' || m.status === 'report_pending').length, helper: 'Awaiting field report', tone: 'amber' },
    { key: 'unassigned', label: 'Unassigned', value: missions.filter((m) => !m.assigned_agent_id).length, helper: 'Needs assignment', tone: 'slate' },
  ]
}

function buildLanes(missions: CareLinkMission[]): MissionLane[] {
  return STATUS_FLOW.map((stage) => ({
    ...stage,
    missions: missions.filter((mission) => mission.status === stage.key),
    count: missions.filter((mission) => mission.status === stage.key).length,
  }))
}

export async function buildMissionControlPayload(workspace: MissionWorkspace = 'board'): Promise<MissionControlPayload> {
  const warnings: string[] = []
  const tablesChecked = Object.values(TABLES)
  const missionsRes = await rest<Record<string, unknown>[]>(`${TABLES.missions}?select=*&order=scheduled_start.asc.nullslast&limit=500`)
  if (!missionsRes.ok) return emptyPayload(workspace, [missionsRes.error || 'Unable to load carelink_missions. Apply the CareLink missions migration.'])

  const [agentsRes, eventsRes, incidentsRes, reportsRes, sectorsRes] = await Promise.all([
    rest<Record<string, unknown>[]>(`${TABLES.agents}?select=*&order=full_name.asc&limit=500`),
    rest<Record<string, unknown>[]>(`${TABLES.events}?select=*&order=created_at.desc&limit=500`),
    rest<Record<string, unknown>[]>(`${TABLES.incidents}?select=*&order=created_at.desc&limit=500`),
    rest<Record<string, unknown>[]>(`${TABLES.reports}?select=*&order=submitted_at.desc.nullslast&limit=500`),
    rest<Record<string, unknown>[]>(`${TABLES.sectors}?select=*&order=city_name.asc&limit=500`),
  ])
  for (const result of [agentsRes, eventsRes, incidentsRes, reportsRes, sectorsRes]) if (!result.ok && result.error) warnings.push(result.error)

  const missions = (missionsRes.data || []).map(normalizeMission).filter((mission) => mission.id)
  const agents = (agentsRes.data || []).map(normalizeAgent).filter((agent) => agent.id)
  const events = (eventsRes.data || []).map(normalizeEvent).filter((event) => event.id)
  const incidents = (incidentsRes.data || []).map(normalizeIncident).filter((incident) => incident.id)
  const reports = (reportsRes.data || []).map(normalizeReport).filter((report) => report.id)
  const sectors = (sectorsRes.data || []).map(normalizeSector).filter((sector) => sector.id)

  return {
    ok: true,
    source: missions.length || agents.length || incidents.length || reports.length || sectors.length ? 'live-db' : 'live-empty',
    generatedAt: new Date().toISOString(),
    workspace,
    kpis: buildKpis(missions),
    lanes: buildLanes(missions),
    missions,
    agents,
    events,
    incidents,
    reports,
    sectors,
    metadata: { dbConnected: true, schemaReady: !warnings.length, tablesChecked, warnings },
  }
}

function cleanActionPayload(payload?: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload || {}).filter(([, value]) => value !== undefined))
}

export async function runMissionAction(request: MissionActionRequest): Promise<MissionActionResponse> {
  const action = request.action
  const payload = cleanActionPayload(request.payload)
  try {
    if (action === 'create_mission') {
      const res = await rest<Record<string, unknown>[]>(TABLES.missions, { method: 'POST', body: JSON.stringify([{ ...payload, status: payload.status || 'created' }]) })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission created.', data: res.data?.[0] || null }
    }

    if (action === 'update_mission' && request.missionId) {
      const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(request.missionId)}`, { method: 'PATCH', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission updated.', data: res.data?.[0] || null }
    }

    if (action === 'delete_mission' && request.missionId) {
      const res = await rest<unknown>(`${TABLES.missions}?id=eq.${encodeURIComponent(request.missionId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission permanently removed.', data: res.data }
    }

    if ((action === 'assign_mission' || action === 'reassign_mission') && request.missionId) {
      const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(request.missionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_agent_id: request.agentId || payload.assigned_agent_id || null, assigned_agent_name: payload.assigned_agent_name || null, status: 'assigned' }),
      })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: action === 'assign_mission' ? 'Mission assigned.' : 'Mission reassigned.', data: res.data?.[0] || null }
    }

    if (action === 'escalate_mission' && request.missionId) {
      const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(request.missionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'at_risk', risk_level: 'high', blockers: payload.blockers || ['Ops escalation required'] }),
      })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission escalated.', data: res.data?.[0] || null }
    }

    if (action === 'validate_mission' && request.missionId) {
      const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=eq.${encodeURIComponent(request.missionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed', compliance_status: 'validated', report_status: 'validated', completed_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission validated and closed.', data: res.data?.[0] || null }
    }

    if (action === 'bulk_update_status' && request.missionIds?.length) {
      const ids = request.missionIds.map(encodeURIComponent).join(',')
      const res = await rest<Record<string, unknown>[]>(`${TABLES.missions}?id=in.(${ids})`, { method: 'PATCH', body: JSON.stringify({ status: payload.status || 'validation' }) })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Bulk mission status updated.', data: res.data || [] }
    }

    if (action === 'add_note' && request.missionId) {
      const res = await rest<Record<string, unknown>[]>(TABLES.notes, { method: 'POST', body: JSON.stringify([{ mission_id: request.missionId, note: payload.note || '', created_by_name: payload.created_by_name || 'CareLink Ops' }]) })
      if (!res.ok) throw new Error(res.error)
      return { ok: true, action, message: 'Mission note added.', data: res.data?.[0] || null }
    }

    return { ok: true, action, message: 'Action registered. Connect a dedicated workflow if this action needs custom downstream automation.', data: { request } }
  } catch (error) {
    return { ok: false, action, message: 'Mission action failed.', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
