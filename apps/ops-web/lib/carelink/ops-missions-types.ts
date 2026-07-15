export type MissionWorkspace = 'board' | 'master-list' | 'timeline' | 'validation' | 'risk-monitoring' | 'field-reports' | 'audit'

export type MissionTone = 'blue' | 'cyan' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'slate' | 'rose' | 'emerald'

export type CareLinkMission = {
  id: string
  mission_code: string
  status: string
  service_type: string | null
  visit_type: string | null
  client_name: string | null
  beneficiary_name: string | null
  beneficiary_phone: string | null
  member_id: string | null
  city: string | null
  zone: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  scheduled_start: string | null
  scheduled_end: string | null
  started_at: string | null
  completed_at: string | null
  priority: string | null
  sla_due_at: string | null
  sla_minutes_remaining: number | null
  readiness_score: number | null
  checklist_total: number | null
  checklist_completed: number | null
  assigned_agent_id: string | null
  assigned_agent_name: string | null
  assigned_agent_phone: string | null
  compliance_status: string | null
  report_status: string | null
  incident_count: number
  required_skills: string[]
  blockers: string[]
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type CareLinkMissionAgent = {
  id: string
  full_name: string
  phone: string | null
  status: string | null
  city: string | null
  zone: string | null
  skills: string[]
  readiness_score: number | null
  reliability_score: number | null
  next_available_at: string | null
}

export type CareLinkMissionEvent = {
  id: string
  mission_id: string | null
  mission_code: string | null
  action: string
  actor_name: string | null
  event_type: string | null
  payload: Record<string, unknown>
  created_at: string | null
}

export type CareLinkMissionIncident = {
  id: string
  mission_id: string | null
  mission_code: string | null
  incident_type: string
  severity: string | null
  status: string | null
  summary: string | null
  owner_name: string | null
  sla_due_at: string | null
  created_at: string | null
}

export type CareLinkMissionReport = {
  id: string
  mission_id: string | null
  mission_code: string | null
  report_type: string | null
  status: string | null
  quality_score: number | null
  submitted_by_name: string | null
  submitted_at: string | null
  validation_status: string | null
  issues: string[]
}

export type CareLinkMissionSector = {
  id: string
  city_name: string
  sector_name: string
  region: string | null
  lat: number | null
  lng: number | null
  active_missions_count: number | null
  open_agents_count: number | null
  load_level: string | null
}

export type MissionKpi = {
  key: string
  label: string
  value: number
  helper: string
  tone: MissionTone
}

export type MissionLane = {
  key: string
  label: string
  tone: MissionTone
  count: number
  missions: CareLinkMission[]
}

export type MissionControlPayload = {
  ok: boolean
  source: 'live-db' | 'live-empty' | 'schema-missing' | 'error'
  generatedAt: string
  workspace: MissionWorkspace
  kpis: MissionKpi[]
  lanes: MissionLane[]
  missions: CareLinkMission[]
  agents: CareLinkMissionAgent[]
  events: CareLinkMissionEvent[]
  incidents: CareLinkMissionIncident[]
  reports: CareLinkMissionReport[]
  sectors: CareLinkMissionSector[]
  metadata: {
    dbConnected: boolean
    schemaReady: boolean
    tablesChecked: string[]
    warnings: string[]
  }
}

export type MissionActionRequest = {
  action:
    | 'create_mission'
    | 'update_mission'
    | 'delete_mission'
    | 'assign_mission'
    | 'reassign_mission'
    | 'escalate_mission'
    | 'validate_mission'
    | 'request_report_correction'
    | 'open_report'
    | 'add_note'
    | 'bulk_update_status'
    | 'export_view'
  missionId?: string
  missionIds?: string[]
  agentId?: string
  payload?: Record<string, unknown>
}

export type MissionActionResponse = {
  ok: boolean
  action: string
  message: string
  data?: unknown
  error?: string
}
