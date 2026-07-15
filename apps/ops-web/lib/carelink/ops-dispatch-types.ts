export type DispatchTone = 'blue' | 'cyan' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'slate'

export type DispatchStatus =
  | 'new_request'
  | 'qualification'
  | 'ready_for_dispatch'
  | 'matching'
  | 'proposed'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'on_site'
  | 'at_risk'
  | 'escalation'
  | 'completed'
  | 'cancelled'

export type DispatchMission = {
  id: string
  mission_code: string
  status: DispatchStatus | string
  service_type: string | null
  client_name: string | null
  beneficiary_name: string | null
  city: string | null
  zone: string | null
  address: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  priority: string | null
  readiness_score: number | null
  sla_minutes_remaining: number | null
  risk_level: string | null
  assigned_agent_id: string | null
  assigned_agent_name: string | null
  required_skills: string[]
  blockers: string[]
  notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  updated_at: string | null
}

export type DispatchAgent = {
  id: string
  agent_code: string | null
  full_name: string
  status: string | null
  city: string | null
  zone: string | null
  skills: string[]
  readiness_score: number | null
  reliability_score: number | null
  active_missions_count: number | null
  next_available_at: string | null
  latitude: number | null
  longitude: number | null
  updated_at: string | null
}

export type DispatchSector = {
  id: string
  city_name: string
  sector_name: string
  region: string | null
  lat: number | null
  lng: number | null
  polygon_geojson: unknown | null
  load_level: string | null
  active_missions_count: number | null
  open_agents_count: number | null
  updated_at: string | null
}

export type DispatchIncident = {
  id: string
  mission_id: string | null
  mission_code: string | null
  incident_type: string
  severity: string | null
  status: string | null
  city: string | null
  zone: string | null
  summary: string | null
  owner_name: string | null
  sla_due_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type DispatchMessage = {
  id: string
  mission_id: string | null
  mission_code: string | null
  channel: string | null
  sender_name: string | null
  message_type: string | null
  body: string | null
  priority: string | null
  created_at: string | null
}

export type DispatchAuditEvent = {
  id: string
  entity_type: string
  entity_id: string | null
  action: string
  actor_name: string | null
  payload: Record<string, unknown>
  created_at: string | null
}

export type DispatchKpi = {
  key: string
  label: string
  value: number
  helper: string
  tone: DispatchTone
}

export type DispatchLane = {
  key: DispatchStatus | string
  label: string
  tone: DispatchTone
  count: number
  missions: DispatchMission[]
}

export type DispatchPayload = {
  ok: boolean
  source: 'live-db' | 'live-empty' | 'schema-missing' | 'error'
  generatedAt: string
  message?: string
  kpis: DispatchKpi[]
  lanes: DispatchLane[]
  missions: DispatchMission[]
  agents: DispatchAgent[]
  sectors: DispatchSector[]
  incidents: DispatchIncident[]
  communications: DispatchMessage[]
  auditTrail: DispatchAuditEvent[]
  metadata: {
    dbConnected: boolean
    schemaReady: boolean
    tablesChecked: string[]
    warnings: string[]
  }
}

export type DispatchActionRequest = {
  action:
    | 'create_mission'
    | 'update_mission'
    | 'delete_mission'
    | 'assign_mission'
    | 'reassign_mission'
    | 'batch_assign'
    | 'escalate_mission'
    | 'broadcast_message'
    | 'add_note'
    | 'optimize_routes'
    | 'import_requests'
    | 'set_status'
  missionId?: string
  agentId?: string
  missionIds?: string[]
  payload?: Record<string, unknown>
}

export type DispatchActionResponse = {
  ok: boolean
  action: string
  message: string
  data?: unknown
  error?: string
}
