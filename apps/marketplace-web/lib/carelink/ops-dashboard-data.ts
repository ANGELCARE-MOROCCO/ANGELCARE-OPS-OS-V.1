export type CareLinkTone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'cyan' | 'slate'

export type CareLinkKpi = {
  key: string
  label: string
  value: number
  helper: string
  tone: CareLinkTone
}

export type CareLinkMission = {
  id: string
  code: string
  clientLabel: string
  beneficiaryLabel?: string
  serviceType: string
  city: string
  zone?: string
  scheduledStart?: string
  scheduledEnd?: string
  status: string
  riskLevel?: string
  readinessScore?: number
  assignedAgent?: string
  notes?: string
  blockers?: string[]
}

export type CareLinkLane = {
  key: string
  label: string
  count: number
  tone: CareLinkTone
  items: CareLinkMission[]
}

export type CareLinkCity = {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  load: number
  status: 'no_data' | 'normal' | 'warning' | 'critical'
  missions: number
  agents: number
}

export type CareLinkZone = {
  id: string
  cityId: string
  name: string
  lat: number
  lng: number
  missions: number
  agents: number
  status: 'no_data' | 'normal' | 'warning' | 'critical'
}

export type CareLinkAgent = {
  id: string
  fullName: string
  role: string
  city: string
  zone?: string
  readinessScore: number
  status: string
  complianceStatus: string
  skills: string[]
}

export type CareLinkCoverageRow = {
  id: string
  label: string
  city: string
  load: string
  blocks: Array<'empty' | 'booked' | 'progress' | 'gap' | 'risk' | 'done'>
}

export type CareLinkIncident = {
  id: string
  title: string
  severity: 'info' | 'warning' | 'critical'
  status: string
  missionCode?: string
  city?: string
  detail: string
  createdAt?: string
}

export type CareLinkReport = {
  id: string
  missionCode: string
  clientLabel: string
  agentLabel: string
  reportType: string
  status: string
  qualityScore?: number
  issues: string[]
  tags: string[]
}

export type CareLinkFollowUp = {
  id: string
  title: string
  value: number
  helper: string
}

export type OpsDashboardPayload = {
  ok: boolean
  source: 'live-empty' | 'live'
  generatedAt: string
  kpis: CareLinkKpi[]
  lanes: CareLinkLane[]
  cities: CareLinkCity[]
  zones: CareLinkZone[]
  agents: CareLinkAgent[]
  coverage: CareLinkCoverageRow[]
  incidents: CareLinkIncident[]
  reports: CareLinkReport[]
  followUps: CareLinkFollowUp[]
}

const emptyLanes: CareLinkLane[] = [
  { key: 'unassigned', label: 'Unassigned', count: 0, tone: 'slate', items: [] },
  { key: 'assigned', label: 'Assigned', count: 0, tone: 'blue', items: [] },
  { key: 'accepted', label: 'Accepted', count: 0, tone: 'violet', items: [] },
  { key: 'en_route', label: 'En route', count: 0, tone: 'cyan', items: [] },
  { key: 'in_progress', label: 'In progress', count: 0, tone: 'green', items: [] },
  { key: 'report_pending', label: 'Report pending', count: 0, tone: 'amber', items: [] },
  { key: 'validation', label: 'Validation', count: 0, tone: 'violet', items: [] },
  { key: 'at_risk', label: 'At risk', count: 0, tone: 'red', items: [] },
]

export function buildCareLinkOpsDashboard(): OpsDashboardPayload {
  return {
    ok: true,
    source: 'live-empty',
    generatedAt: new Date(0).toISOString(),
    kpis: [
      { key: 'missions_today', label: 'Missions Today', value: 0, helper: 'No live missions connected', tone: 'blue' },
      { key: 'in_progress', label: 'In Progress', value: 0, helper: 'No active field mission', tone: 'cyan' },
      { key: 'at_risk', label: 'At Risk', value: 0, helper: 'No operational risk loaded', tone: 'amber' },
      { key: 'unassigned', label: 'Unassigned', value: 0, helper: 'No dispatch queue loaded', tone: 'violet' },
      { key: 'agents_available', label: 'Agents Available', value: 0, helper: 'No live agents connected', tone: 'green' },
      { key: 'incidents_open', label: 'Incidents Open', value: 0, helper: 'No incident feed connected', tone: 'red' },
      { key: 'reports_pending', label: 'Reports Pending', value: 0, helper: 'No validation queue loaded', tone: 'blue' },
      { key: 'compliance_blockers', label: 'Compliance Blockers', value: 0, helper: 'No blocker feed connected', tone: 'red' },
    ],
    lanes: emptyLanes,
    cities: [],
    zones: [],
    agents: [],
    coverage: [],
    incidents: [],
    reports: [],
    followUps: [],
  }
}
