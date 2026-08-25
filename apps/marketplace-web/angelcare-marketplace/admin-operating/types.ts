export type OperatingCaseStatus =
  | 'open' | 'intake' | 'validation' | 'qualified' | 'ready' | 'in_progress'
  | 'evidence_pending' | 'approval_pending' | 'blocked' | 'recovery'
  | 'reconciled' | 'closed' | 'cancelled'

export type OperatingPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical'
export type OperatingRisk = 'low' | 'normal' | 'high' | 'critical'

export type WorkspaceType = 'command' | 'queue' | 'dossier' | 'studio' | 'reconciliation' | 'configuration'

export interface WorkspaceDefinition {
  key: string
  route: string
  domain: string
  mission: string
  primaryEntityType: string
  workspaceType: WorkspaceType
  lifecycle: string[]
  capabilities: string[]
  requiredEvidence: string[]
  ownerRole: string
  verticalityVersion: number
}

export interface OperatingCase {
  id: string
  public_reference: string
  workspace_key: string
  entity_type: string
  entity_id: string
  title: string
  mission: string | null
  status: OperatingCaseStatus
  priority: OperatingPriority
  risk_level: OperatingRisk
  owner_id: string | null
  tenant_id: string | null
  territory_id: string | null
  customer_id: string | null
  organization_id: string | null
  next_action: string | null
  due_at: string | null
  blockers: string[]
  financial_exposure: number
  currency_label: string
  source_system: string
  source_reference: string | null
  closure_code: string | null
  closure_summary: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface OperatingAssignment {
  id: string
  case_id: string
  assignee_type: string
  assignee_id: string
  role_label: string | null
  status: string
  priority: string
  assigned_by: string | null
  assigned_at: string
  due_at: string | null
  released_at: string | null
  reason: string | null
}

export interface OperatingTimelineEvent {
  id: string
  case_id: string
  event_kind: string
  action: string
  actor_id: string | null
  previous_state: string | null
  new_state: string | null
  reason: string | null
  request_id: string | null
  source: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface OperatingEvidence {
  id: string
  case_id: string
  evidence_type: string
  title: string
  source_type: string
  source_reference: string | null
  storage_reference: string | null
  validation_status: string
  customer_visible: boolean
  submitted_by: string | null
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_reason: string | null
  metadata: Record<string, unknown>
}

export interface OperatingApproval {
  id: string
  case_id: string
  approval_key: string
  version: number
  required_role: string | null
  status: string
  requested_by: string | null
  requested_at: string
  decided_by: string | null
  decided_at: string | null
  decision_reason: string | null
  evidence_ids: string[]
  metadata: Record<string, unknown>
}

export interface OperatingException {
  id: string
  public_reference: string
  case_id: string
  exception_type: string
  status: string
  severity: string
  summary: string
  next_action: string | null
  owner_id: string | null
  due_at: string | null
  blocker_codes: string[]
  financial_exposure: number
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface OperatingRecoveryAction {
  id: string
  case_id: string
  exception_id: string | null
  action_type: string
  status: string
  title: string
  reason: string | null
  requested_by: string | null
  approved_by: string | null
  executed_by: string | null
  requested_at: string
  executed_at: string | null
  outcome: string | null
}

export interface OperatingComment {
  id: string
  case_id: string
  author_id: string | null
  body: string
  visibility: string
  created_at: string
}

export interface OperatingDossierData {
  case: OperatingCase
  assignment: OperatingAssignment | null
  timeline: OperatingTimelineEvent[]
  evidence: OperatingEvidence[]
  approvals: OperatingApproval[]
  exceptions: OperatingException[]
  recoveries: OperatingRecoveryAction[]
  comments: OperatingComment[]
}

export interface OperatingCaseInput {
  workspaceKey: string
  entityType: string
  entityId: string
  title: string
  mission?: string | null
  priority?: OperatingPriority
  riskLevel?: OperatingRisk
  tenantId?: string | null
  territoryId?: string | null
  customerId?: string | null
  organizationId?: string | null
  nextAction?: string | null
  dueAt?: string | null
  blockers?: string[]
  financialExposure?: number
  currencyLabel?: string
  sourceReference?: string | null
}
