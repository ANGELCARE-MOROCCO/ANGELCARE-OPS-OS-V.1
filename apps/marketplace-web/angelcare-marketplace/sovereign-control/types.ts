export type ApprovalStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'expired'
export type ActionStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
export type ActionPriority = 'low' | 'normal' | 'high' | 'critical'

export interface CommandMetric {
  key: string
  label: string
  value: number
  status: 'healthy' | 'attention' | 'critical' | 'neutral'
  route: string
  explanation: string
}

export interface CommandSummary {
  generatedAt: string
  metrics: CommandMetric[]
  approvals: ApprovalRecord[]
  actions: ActionItem[]
  recentAudit: AuditSignal[]
  risks: CommandRisk[]
}

export interface ApprovalRecord {
  id: string
  public_reference: string
  object_type: string
  object_id: string
  title: string
  summary: string | null
  status: ApprovalStatus
  priority: ActionPriority
  territory_id: string | null
  tenant_id: string | null
  owner_id: string | null
  requested_by: string | null
  current_step: number
  required_steps: number
  due_at: string | null
  submitted_at: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface ActionItem {
  id: string
  public_reference: string
  title: string
  description: string | null
  object_type: string | null
  object_id: string | null
  status: ActionStatus
  priority: ActionPriority
  owner_id: string | null
  assignee_id: string | null
  territory_id: string | null
  due_at: string | null
  blocker: string | null
  next_action: string | null
  created_at: string
  updated_at: string
}

export interface AuditSignal {
  id: string
  action: string
  object_type: string
  object_id: string | null
  actor_id: string | null
  result: string
  severity: string
  created_at: string
}

export interface CommandRisk {
  key: string
  label: string
  count: number
  severity: 'warning' | 'critical'
  route: string
  nextAction: string
}

export interface SearchResult {
  object_type: string
  object_id: string
  public_reference: string | null
  title: string
  subtitle: string | null
  status: string
  owner_id: string | null
  territory_id: string | null
  tenant_id: string | null
  route: string
  search_rank: number
  updated_at: string
}

export interface ObjectComment {
  id: string
  object_type: string
  object_id: string
  body: string
  author_id: string
  visibility: 'internal' | 'restricted'
  created_at: string
}

export interface ExecutiveBrief {
  id: string
  public_reference: string
  title: string
  period_start: string | null
  period_end: string | null
  status: 'draft' | 'review' | 'published' | 'archived'
  summary: string
  decisions: unknown[]
  risks: unknown[]
  evidence: unknown[]
  owner_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}
