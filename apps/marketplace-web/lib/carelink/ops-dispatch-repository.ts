import { createClient } from '@/lib/supabase/server'
import { assignOpsMission, createOpsAlert, loadCareLinkOpsSnapshot, notifyOpsAgent, recordOpsAuditEvent, saveOpsMessage } from './ops-enterprise'
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

import { resolvedMissionCode } from '@/lib/missions/mission-codes'

function __carelinkMissionVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('cancelled') || status.includes('archived')) return false
  return true
}

function __carelinkFilterVisibleMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __carelinkMissionVisible(row)) : []
}


function __carelinkMissionIsVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}


function __carelinkLiveMissionVisible(row: any) {
  const status = String(row?.status || row?.lifecycle_stage || row?.lifecycleStage || row?.dossier_status || '').toLowerCase()
  if (row?.is_archived === true || row?.isArchived === true) return false
  if (status.includes('deleted') || status.includes('cancelled') || status.includes('archived')) return false
  return true
}

const TABLES = {
  missions: 'missions',
  agents: 'caregivers',
  sectors: 'carelink_ops_city_sectors',
  incidents: 'incidents',
  communications: 'carelink_dispatch_messages',
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
  if (Array.isArray(value)) return value.map(String).filter(Boolean).filter(__carelinkLiveMissionVisible)
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

function mapLifecycleToDispatchStatus(status: string, riskLevel: string, readinessStatus: string, reportStatus: string) {
  const normalized = String(status || '').toLowerCase()
  const risk = String(riskLevel || '').toLowerCase()
  const readiness = String(readinessStatus || '').toLowerCase()
  const report = String(reportStatus || '').toLowerCase()
  if (['new_request', 'qualification', 'ready_for_dispatch', 'matching', 'proposed', 'assigned', 'accepted', 'en_route', 'on_site', 'at_risk', 'escalation', 'completed', 'cancelled'].includes(normalized)) return normalized
  if (['cancelled', 'archived'].includes(normalized)) return 'cancelled'
  if (['completed', 'closed'].includes(normalized)) return 'completed'
  if (['incident', 'incident_reported'].includes(normalized) || ['high', 'critical'].includes(risk)) return 'at_risk'
  if (['in_progress', 'checked_in', 'mission_started'].includes(normalized)) return 'on_site'
  if (['en_route', 'arrived_near_location', 'arrival_confirmed'].includes(normalized)) return 'en_route'
  if (['agent_accepted', 'accepted', 'confirmed'].includes(normalized)) return 'accepted'
  if (['assigned', 'dispatch_confirmed'].includes(normalized)) return 'assigned'
  if (['report_submitted'].includes(normalized) || report === 'submitted') return 'proposed'
  if (['ready', 'pending'].includes(readiness)) return 'ready_for_dispatch'
  if (['draft', 'ready_for_assignment'].includes(normalized)) return 'new_request'
  return 'matching'
}

function mapMissionToDispatchMission(mission: Record<string, any>): DispatchMission {
  const riskLevel = String(mission.riskLevel || mission.risk_level || 'normal')
  const readinessStatus = String(mission.readinessStatus || mission.readiness_status || 'pending')
  const reportStatus = String(mission.reportStatus || mission.report_status || 'not_required')
  const status = mapLifecycleToDispatchStatus(String(mission.status || mission.lifecycleStage || mission.lifecycle_stage || 'draft'), riskLevel, readinessStatus, reportStatus)
  return {
    id: String(mission.id),
    mission_code: resolvedMissionCode(mission),
    status,
    service_type: mission.serviceType ? String(mission.serviceType) : mission.service_type ? String(mission.service_type) : null,
    client_name: mission.familyName ? String(mission.familyName) : mission.client_name ? String(mission.client_name) : null,
    beneficiary_name: mission.serviceType ? String(mission.serviceType) : null,
    city: mission.city ? String(mission.city) : null,
    zone: mission.zone ? String(mission.zone) : null,
    address: mission.address ? String(mission.address) : null,
    scheduled_start: mission.dateLabel ? String(mission.dateLabel) : null,
    scheduled_end: mission.timeLabel ? String(mission.timeLabel) : null,
    priority: mission.priority ? String(mission.priority) : mission.urgency ? String(mission.urgency) : null,
    readiness_score: typeof mission.readinessScore === 'number' ? mission.readinessScore : typeof mission.readiness_score === 'number' ? mission.readiness_score : null,
    sla_minutes_remaining: typeof mission.sla_minutes_remaining === 'number' ? mission.sla_minutes_remaining : null,
    risk_level: riskLevel,
    assigned_agent_id: mission.caregiverId == null ? null : String(mission.caregiverId),
    assigned_agent_name: mission.caregiverName ? String(mission.caregiverName) : mission.caregiverId ? `Caregiver #${mission.caregiverId}` : null,
    required_skills: Array.isArray(mission.requiredSkills) ? mission.requiredSkills.map(String).filter(Boolean) : Array.isArray(mission.required_skills) ? mission.required_skills.map(String).filter(Boolean) : [],
    blockers: [
      ...(readinessStatus === 'blocked' ? ['Readiness blocked'] : []),
      ...(reportStatus === 'needs_correction' ? ['Report correction required'] : []),
      ...(riskLevel !== 'normal' ? [`Risk level ${riskLevel}`] : []),
    ],
    notes: mission.note ? String(mission.note) : mission.notes ? String(mission.notes) : null,
    latitude: typeof mission.latitude === 'number' ? mission.latitude : null,
    longitude: typeof mission.longitude === 'number' ? mission.longitude : null,
    created_at: mission.createdAt ? String(mission.createdAt) : mission.created_at ? String(mission.created_at) : null,
    updated_at: mission.updatedAt ? String(mission.updatedAt) : mission.updated_at ? String(mission.updated_at) : null,
  }
}

function mapMissionsToSectors(missions: DispatchMission[], agents: DispatchAgent[]): DispatchSector[] {
  const map = new Map<string, DispatchSector>()
  for (const mission of missions) {
    const city = mission.city || 'Ville non définie'
    const zone = mission.zone || 'Zone non définie'
    const key = `${city}__${zone}`
    const current = map.get(key) || {
      id: key,
      city_name: city,
      sector_name: zone,
      region: null,
      lat: null,
      lng: null,
      polygon_geojson: null,
      load_level: 'normal',
      active_missions_count: 0,
      open_agents_count: 0,
      updated_at: mission.updated_at,
    }
    current.active_missions_count = (current.active_missions_count || 0) + 1
    current.load_level = current.active_missions_count > 10 ? 'high' : current.active_missions_count > 5 ? 'medium' : 'normal'
    current.updated_at = mission.updated_at || current.updated_at
    map.set(key, current)
  }
  for (const agent of agents) {
    const city = agent.city || 'Ville non définie'
    const zone = agent.zone || 'Zone non définie'
    const key = `${city}__${zone}`
    const current = map.get(key) || {
      id: key,
      city_name: city,
      sector_name: zone,
      region: null,
      lat: null,
      lng: null,
      polygon_geojson: null,
      load_level: 'normal',
      active_missions_count: 0,
      open_agents_count: 0,
      updated_at: agent.updated_at,
    }
    current.open_agents_count = (current.open_agents_count || 0) + 1
    current.updated_at = agent.updated_at || current.updated_at
    map.set(key, current)
  }
  return Array.from(map.values())
}

function flattenThreadsToMessages(threads: Array<{ messages: Array<Record<string, unknown>> }>) {
  return threads.flatMap((thread) => thread.messages || [])
}

export async function getCareLinkOpsDispatchPayload(): Promise<DispatchPayload> {
  const snapshot = await loadCareLinkOpsSnapshot().catch(() => null)
  if (!snapshot) {
    return baseEmptyPayload('error', 'CareLink Ops snapshot could not be loaded.')
  }

  const missions = snapshot.missions.map(mapMissionToDispatchMission)
  const agents = snapshot.agents.map((agent) => ({
    id: String(agent.id),
    agent_code: null,
    full_name: String(agent.fullName),
    status: agent.status || null,
    city: agent.city || null,
    zone: agent.zone || null,
    skills: agent.skills || [],
    readiness_score: agent.readinessScore,
    reliability_score: agent.reliabilityScore,
    active_missions_count: agent.workload,
    next_available_at: null,
    latitude: null,
    longitude: null,
    updated_at: snapshot.generatedAt,
  }))
  const incidents = snapshot.incidents.map((incident) => ({
    id: String(incident.id),
    mission_id: incident.missionId == null ? null : String(incident.missionId),
    mission_code: incident.missionCode,
    incident_type: incident.title,
    severity: incident.severity,
    status: incident.status,
    city: incident.city,
    zone: incident.zone,
    summary: incident.summary,
    owner_name: incident.ownerName,
    sla_due_at: null,
    created_at: incident.createdAt,
    updated_at: incident.createdAt,
  }))
  const communications = flattenThreadsToMessages(snapshot.messages).map((message) => ({
    id: String(message.id || ''),
    mission_id: message.mission_id == null ? (message.missionId == null ? null : String(message.missionId)) : String(message.mission_id),
    mission_code: message.mission_code == null ? (message.thread_key == null ? null : String(message.thread_key)) : String(message.mission_code),
    channel: message.channel == null ? (message.recipient_type == null ? (message.recipientType == null ? null : String(message.recipientType)) : String(message.recipient_type)) : String(message.channel),
    sender_name: message.sender_name == null ? (message.senderType == null ? (message.sender_type == null ? null : String(message.sender_type)) : String(message.senderType)) : String(message.sender_name),
    message_type: message.message_type == null ? (message.status == null ? null : String(message.status)) : String(message.message_type),
    body: message.body == null ? '' : String(message.body),
    priority: message.priority == null ? 'normal' : String(message.priority),
    created_at: message.created_at == null ? (message.createdAt == null ? snapshot.generatedAt : String(message.createdAt)) : String(message.created_at),
  }))
  const auditTrail = snapshot.history.map((row) => ({
    id: String(row.id),
    entity_type: row.entityType,
    entity_id: row.entityId,
    action: row.action,
    actor_name: row.actorName,
    payload: row.payload,
    created_at: row.createdAt,
  }))
  const sectors = mapMissionsToSectors(missions, agents)
  const warnings = snapshot.source === 'live-empty' ? ['No live dispatch records were found.'] : []

  return {
    ok: true,
    source: snapshot.source === 'live-empty' ? 'live-empty' : 'live-db',
    generatedAt: snapshot.generatedAt,
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
      schemaReady: snapshot.source !== 'error',
      tablesChecked: ['missions', 'caregivers', 'mission_events', 'incidents', 'carelink_dispatch_messages', 'carelink_notifications', 'carelink_alerts', 'carelink_mission_reports', 'carelink_payment_disputes'],
      warnings,
    },
  }
}

async function logAudit(action: string, entityType: string, entityId: string | null, payload: Record<string, unknown>) {
  await recordOpsAuditEvent({
    entityType,
    entityId,
    action,
    actorName: String(payload.actor_name || 'CareLink Ops'),
    payload,
  })
}

export async function createMission(payload: Record<string, unknown>): Promise<DispatchActionResponse> {
  const supabase = await createClient()
  const body = {
    family_id: payload.family_id ?? payload.familyId ?? null,
    caregiver_id: payload.caregiver_id ?? payload.caregiverId ?? null,
    service_type: payload.service_type || payload.serviceType || null,
    mission_date: payload.mission_date || payload.missionDate || null,
    start_time: payload.start_time || payload.startTime || null,
    end_time: payload.end_time || payload.endTime || null,
    city: payload.city || null,
    zone: payload.zone || null,
    address: payload.address || null,
    status: payload.status || ((payload.caregiver_id || payload.caregiverId) ? 'assigned' : 'draft'),
    lifecycle_stage: (payload.caregiver_id || payload.caregiverId) ? 'assigned' : 'ready_for_assignment',
    mission_kind: payload.mission_kind || 'single',
    mission_group_id: payload.mission_group_id || crypto.randomUUID(),
    urgency: payload.urgency || 'standard',
    risk_level: payload.risk_level || 'normal',
    service_family: payload.service_family || payload.service_type || payload.serviceType || null,
    mission_scope: payload.mission_scope || null,
    internal_procedure_level: payload.internal_procedure_level || null,
    readiness_status: (payload.caregiver_id || payload.caregiverId) ? 'ready' : 'pending',
    validation_status: 'pending',
    report_status: (payload.caregiver_id || payload.caregiverId) ? 'pending' : 'not_required',
    notes: payload.notes || null,
  }
  const { data, error } = await supabase.from('missions').insert([body]).select('*, caregivers(*), families(*), contracts(*)').maybeSingle()
  if (error) return { ok: false, action: 'create_mission', message: 'Mission creation failed.', error: error.message }
  await recordOpsAuditEvent({
    entityType: 'mission',
    entityId: data?.id ? String(data.id) : null,
    action: 'mission.created',
    payload: body,
  })
  return { ok: true, action: 'create_mission', message: 'Mission created.', data: data || null }
}

export async function updateMission(id: string, payload: Record<string, unknown>): Promise<DispatchActionResponse> {
  const supabase = await createClient()
  const patch = { ...payload } as Record<string, unknown>
  if ('assigned_agent_id' in patch && patch.caregiver_id == null) {
    patch.caregiver_id = patch.assigned_agent_id ?? null
  }
  delete patch.assigned_agent_id
  delete patch.assigned_agent_name
  const { data, error } = await supabase.from('missions').update(patch).eq('id', id).select('*, caregivers(*), families(*), contracts(*)').maybeSingle()
  if (error) return { ok: false, action: 'update_mission', message: 'Mission update failed.', error: error.message }
  await recordOpsAuditEvent({
    entityType: 'mission',
    entityId: id,
    action: 'mission.updated',
    payload: patch,
  })
  return { ok: true, action: 'update_mission', message: 'Mission updated.', data: data || null }
}

export async function deleteMission(id: string): Promise<DispatchActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase.from('missions').delete().eq('id', id)
  if (error) return { ok: false, action: 'delete_mission', message: 'Mission deletion failed.', error: error.message }
  await recordOpsAuditEvent({
    entityType: 'mission',
    entityId: id,
    action: 'mission.deleted',
    payload: {},
  })
  return { ok: true, action: 'delete_mission', message: 'Mission deleted from CareLink Ops.', data: null }
}

async function assignMission(id: string, agentId: string, status = 'assigned'): Promise<DispatchActionResponse> {
  const result = await assignOpsMission(Number(id), Number(agentId), { status })
  return { ok: true, action: 'assign_mission', message: 'Mission assigned.', data: result }
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
    const message = await saveOpsMessage({
      body: String(payload.body || ''),
      priority: String(payload.priority || 'normal'),
      subject: String(payload.subject || 'Broadcast dispatch'),
      metadata: { channel: payload.channel || 'dispatch', sender_name: payload.sender_name || 'CareLink Ops' },
    })
    await logAudit('dispatch.broadcast', 'communication', message.id, payload)
    return { ok: true, action, message: 'Broadcast saved.', data: message || null }
  }

  if (action === 'add_note' && input.missionId) {
    const message = await saveOpsMessage({
      missionId: Number(input.missionId),
      body: String(payload.body || ''),
      priority: String(payload.priority || 'normal'),
      subject: String(payload.subject || 'Dispatch note'),
      metadata: { channel: 'dispatch', sender_name: payload.sender_name || 'CareLink Ops' },
    })
    await logAudit('mission.note_added', 'mission', input.missionId, payload)
    return { ok: true, action, message: 'Note added.', data: message || null }
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
