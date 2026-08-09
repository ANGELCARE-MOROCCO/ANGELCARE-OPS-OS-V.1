export type ExecutionExperienceKey =
  | "daily-desk"
  | "daily-command"
  | "daily-task-dossier"
  | "team-command"
  | "execution-analytics"
  | "daily-approvals"
  | "daily-blocked"
  | "daily-board"
  | "execution-calendar"
  | "focus-mode"
  | "daily-registry"
  | "daily-create"
  | "my-work"
  | "task-dossier"
  | "task-approvals"
  | "task-blocked"
  | "task-board"
  | "task-create"
  | "task-command"
  | "workload-balancer"
  | "activity-timeline"

export type ExecutionTask = {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  owner?: string | null
  assigned_user_id?: string | null
  assigned_role?: string | null
  entity_type?: string | null
  entity_id?: string | null
  prospect_id?: string | null
  entity_name?: string | null
  opportunity_title?: string | null
  commercial_value_mad?: number | null
  due_date?: string | null
  due_at?: string | null
  start_at?: string | null
  completed_at?: string | null
  expected_outcome?: string | null
  completion_outcome?: string | null
  estimated_minutes?: number | null
  actual_minutes?: number | null
  version?: number | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  checklist_count?: number | null
  checklist_done_count?: number | null
  dependency_count?: number | null
  unresolved_dependency_count?: number | null
  evidence_count?: number | null
  pending_approval_count?: number | null
  blocker_count?: number | null
  escalation_count?: number | null
}

export type ExecutionPortfolio = {
  tasks: ExecutionTask[]
  activities: Array<Record<string, any>>
  assignments: Array<Record<string, any>>
  dependencies: Array<Record<string, any>>
  evidence: Array<Record<string, any>>
  approvals: Array<Record<string, any>>
  blockers: Array<Record<string, any>>
  escalations: Array<Record<string, any>>
  checklists: Array<Record<string, any>>
  comments: Array<Record<string, any>>
  workload: Array<Record<string, any>>
  summary: {
    total: number
    open: number
    inProgress: number
    waiting: number
    blocked: number
    overdue: number
    approvalRequired: number
    completed: number
    unassigned: number
    evidenceMissing: number
    commercialValueAtRiskMad: number
    completionRate: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}
