export type TerritoryStatus =
  | 'draft'
  | 'configuring'
  | 'review'
  | 'soft_launch'
  | 'live'
  | 'paused'
  | 'archived'

export type TerritoryHealthStatus =
  | 'healthy'
  | 'attention_required'
  | 'at_risk'
  | 'critical'
  | 'paused'
  | 'unknown'

export type TerritoryType = 'country' | 'region' | 'city_cluster' | 'vertical_world'
export type TerritoryInheritanceMode =
  | 'inherited_reference'
  | 'inherited_snapshot'
  | 'local_default'
  | 'local_override'
  | 'locked_global'

export type TerritoryOverrideStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'effective'
  | 'rolled_back'
  | 'archived'

export type TerritoryGateRequirement =
  | 'mandatory_blocking'
  | 'mandatory_non_blocking'
  | 'recommended'
  | 'informational'

export type TerritoryGateStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'passed'
  | 'failed'
  | 'waiver_requested'
  | 'waiver_approved'
  | 'expired'
  | 'not_applicable'

export interface Territory {
  id: string
  public_reference: string
  territory_code: string
  name: string
  country_code: string
  territory_type: TerritoryType
  timezone: string
  currency_label: string
  default_locale: 'fr' | 'en' | 'ar'
  active_locales: Array<'fr' | 'en' | 'ar'>
  status: TerritoryStatus
  owner_id: string | null
  executive_sponsor_id: string | null
  source_territory_id: string | null
  source_template_id: string | null
  inheritance_version: number
  readiness_score: number
  health_status: TerritoryHealthStatus
  target_launch_at: string | null
  soft_launched_at: string | null
  launched_at: string | null
  paused_at: string | null
  archived_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  version: number
  metadata: Record<string, unknown>
}

export interface TerritorySetting {
  id: string
  territory_id: string
  setting_key: string
  category: string
  label: string
  description: string | null
  source_type: 'global_master' | 'territory' | 'template' | 'local'
  source_id: string | null
  source_version: number | null
  inheritance_mode: TerritoryInheritanceMode
  is_locked: boolean
  local_override_allowed: boolean
  effective_value: unknown
  override_value: unknown
  override_status: TerritoryOverrideStatus | null
  owner_id: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface TerritoryTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  territory_type: TerritoryType
  active: boolean
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TerritoryOverride {
  id: string
  public_reference: string
  territory_id: string
  setting_key: string
  source_value: unknown
  proposed_value: unknown
  effective_value: unknown
  business_reason: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  status: TerritoryOverrideStatus
  requested_by: string | null
  owner_id: string | null
  reviewer_id: string | null
  decision_reason: string | null
  effective_at: string | null
  reviewed_at: string | null
  rolled_back_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface TerritoryLaunchCheck {
  id: string
  territory_id: string
  gate_key: string
  gate_group: string
  title: string
  description: string | null
  requirement_level: TerritoryGateRequirement
  status: TerritoryGateStatus
  score_weight: number
  score: number
  owner_id: string | null
  owner_role: string | null
  reviewer_id: string | null
  due_at: string | null
  evidence_required: boolean
  evidence_reference: string | null
  evidence: Record<string, unknown>
  blocker_reason: string | null
  warning_reason: string | null
  next_action: string | null
  last_validated_at: string | null
  validated_by: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TerritoryHealthEvent {
  id: string
  territory_id: string
  event_key: string
  category: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string | null
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
  source: string
  owner_id: string | null
  due_at: string | null
  resolved_at: string | null
  resolution_note: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TerritoryCityZone {
  id: string
  territory_id: string
  city_name: string
  zone_name: string | null
  coverage_status: 'planned' | 'limited' | 'operational' | 'paused' | 'unavailable'
  support_level: 'standard' | 'priority' | 'pilot'
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TerritorySupportContact {
  id: string
  territory_id: string
  contact_type: 'public' | 'operations' | 'escalation' | 'security'
  label: string
  email: string | null
  phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface TerritoryAssignment {
  id: string
  territory_id: string
  app_user_id: string
  assignment_role: string
  responsibility: string | null
  active: boolean
  assigned_by: string | null
  created_at: string
  updated_at: string
}

export interface TerritoryLaunchApproval {
  id: string
  territory_id: string
  approval_type: 'soft_launch' | 'live_launch' | 'resume'
  readiness_score: number
  blocking_gate_count: number
  reviewer_id: string
  decision: 'approved' | 'rejected'
  comments: string
  evidence_summary: Record<string, unknown>
  created_at: string
}

export interface TerritoryReadinessSummary {
  score: number
  total: number
  passed: number
  blocking: number
  warnings: number
  missingOwners: number
  overdue: number
  recommendedTransition: TerritoryStatus | null
  launchEligible: boolean
  softLaunchEligible: boolean
}

export interface TerritoryPortfolioSummary {
  total: number
  live: number
  configuring: number
  review: number
  paused: number
  criticalBlockers: number
  averageReadiness: number
  unhealthy: number
}

export interface TerritoryDetailBundle {
  territory: Territory
  settings: TerritorySetting[]
  overrides: TerritoryOverride[]
  launchChecks: TerritoryLaunchCheck[]
  healthEvents: TerritoryHealthEvent[]
  cityZones: TerritoryCityZone[]
  supportContacts: TerritorySupportContact[]
  assignments: TerritoryAssignment[]
  approvals: TerritoryLaunchApproval[]
  readiness: TerritoryReadinessSummary
}

export interface TerritoryFilters {
  q?: string
  status?: TerritoryStatus
  health?: TerritoryHealthStatus
  country?: string
  ownerId?: string
  minReadiness?: number
}
