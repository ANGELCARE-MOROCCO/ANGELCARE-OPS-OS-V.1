export type HRRow = Record<string, any>

export type HRResult<T = HRRow[]> = {
  data: T
  error: string | null
  table?: string
}

export type HRDashboardData = {
  loadedAt: string
  errors: Record<string, string>

  staff: HRRow[]
  openings: HRRow[]
  candidates: HRRow[]
  onboarding: HRRow[]
  attendance: HRRow[]
  rosters: HRRow[]
  departments: HRRow[]
  positions: HRRow[]
  documents: HRRow[]
  docs: HRRow[]
  approvals: HRRow[]
  contracts: HRRow[]
  training: HRRow[]
  compliance: HRRow[]
  leave: HRRow[]
  payroll: HRRow[]
  tasks: HRRow[]
  serviceRequests: HRRow[]
  sla: HRRow[]
  escalations: HRRow[]
  dailyOperations: HRRow[]
  dataQuality: HRRow[]
  playbooks: HRRow[]
  templates: HRRow[]
  syncEvents: HRRow[]
  incidents: HRRow[]
  performance: HRRow[]
  audit: HRRow[]
  activity: HRRow[]
}

export type HRHealthStatus = 'healthy' | 'warning' | 'critical'

export type HRActivityInput = {
  action: string
  entity_type?: string
  entity_id?: string
  record_id?: string | null
  source_table?: string | null
  actor_user_id?: string | null
  actor_label?: string | null
  actor_role?: string | null
  module?: string
  source?: string
  status?: string
  severity?: 'info' | 'warning' | 'critical' | string
  payload?: any
  metadata?: any
  before?: any
  after?: any
  reason?: string
  [key: string]: any
}
