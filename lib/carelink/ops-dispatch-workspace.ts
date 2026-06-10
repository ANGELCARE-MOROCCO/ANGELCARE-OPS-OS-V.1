import type { DispatchPayload } from './ops-dispatch-types'

export type DispatchWorkspaceView =
  | 'dispatch-board'
  | 'live-map'
  | 'matching-engine'
  | 'agent-pool'
  | 'schedule'
  | 'sla-escalations'
  | 'communications'
  | 'audit-trail'

export type DispatchWorkspaceNavItem = {
  key: DispatchWorkspaceView
  label: string
  href: string
  purpose: string
}

export const DISPATCH_WORKSPACE_NAV: DispatchWorkspaceNavItem[] = [
  { key: 'dispatch-board', label: 'Dispatch Board', href: '/carelink-ops/dispatch', purpose: 'Mission distribution, assignment, and lane control.' },
  { key: 'live-map', label: 'Live Map', href: '/carelink-ops/dispatch/live-map', purpose: 'City, sector, agent, and mission geospatial operations.' },
  { key: 'matching-engine', label: 'Matching Engine', href: '/carelink-ops/dispatch/matching-engine', purpose: 'Agent matching, eligibility scoring, and assignment decisions.' },
  { key: 'agent-pool', label: 'Agent Pool', href: '/carelink-ops/dispatch/agent-pool', purpose: 'Field agent directory, availability, skills, and compliance readiness.' },
  { key: 'schedule', label: 'Schedule', href: '/carelink-ops/dispatch/schedule', purpose: 'Operational calendar, coverage capacity, and dispatch slots.' },
  { key: 'sla-escalations', label: 'SLA & Escalations', href: '/carelink-ops/dispatch/sla-escalations', purpose: 'SLA risk, incident escalation, and closure control.' },
  { key: 'communications', label: 'Communications', href: '/carelink-ops/dispatch/communications', purpose: 'Dispatch messages, broadcast, mission notes, and handoff.' },
  { key: 'audit-trail', label: 'Audit Trail', href: '/carelink-ops/dispatch/audit-trail', purpose: 'Immutable operational actions and governance trace.' },
]

export type WorkspaceActionName =
  | 'create_mission'
  | 'update_mission'
  | 'delete_mission'
  | 'assign_mission'
  | 'reassign_mission'
  | 'set_status'
  | 'escalate_mission'
  | 'create_agent'
  | 'update_agent'
  | 'delete_agent'
  | 'create_sector'
  | 'update_sector'
  | 'delete_sector'
  | 'create_incident'
  | 'update_incident'
  | 'close_incident'
  | 'delete_incident'
  | 'create_communication'
  | 'delete_communication'
  | 'create_schedule_block'
  | 'update_schedule_block'
  | 'delete_schedule_block'
  | 'broadcast_message'
  | 'add_note'
  | 'import_requests'
  | 'optimize_routes'

export type WorkspaceActionRequest = {
  action: WorkspaceActionName
  entityId?: string
  missionId?: string
  agentId?: string
  payload?: Record<string, unknown>
  missionIds?: string[]
}

export type WorkspaceActionResponse = {
  ok: boolean
  action: string
  message: string
  data?: unknown
  error?: string
}

export function emptyPayloadFallback(payload?: Partial<DispatchPayload> | null): DispatchPayload {
  return {
    ok: payload?.ok ?? true,
    source: payload?.source || 'live-empty',
    generatedAt: payload?.generatedAt || new Date(0).toISOString(),
    message: payload?.message,
    kpis: Array.isArray(payload?.kpis) ? payload.kpis : [],
    lanes: Array.isArray(payload?.lanes) ? payload.lanes : [],
    missions: Array.isArray(payload?.missions) ? payload.missions : [],
    agents: Array.isArray(payload?.agents) ? payload.agents : [],
    sectors: Array.isArray(payload?.sectors) ? payload.sectors : [],
    incidents: Array.isArray(payload?.incidents) ? payload.incidents : [],
    communications: Array.isArray(payload?.communications) ? payload.communications : [],
    auditTrail: Array.isArray(payload?.auditTrail) ? payload.auditTrail : [],
    metadata: {
      dbConnected: Boolean(payload?.metadata?.dbConnected),
      schemaReady: Boolean(payload?.metadata?.schemaReady),
      tablesChecked: Array.isArray(payload?.metadata?.tablesChecked) ? payload.metadata.tablesChecked : [],
      warnings: Array.isArray(payload?.metadata?.warnings) ? payload.metadata.warnings : [],
    },
  }
}
