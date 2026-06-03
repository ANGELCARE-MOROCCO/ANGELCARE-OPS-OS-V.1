export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = Record<string, JsonValue>

export type AmbassadorStatus = "active" | "inactive" | "suspended" | "archived" | "candidate"
export type AmbassadorLifecycleStage = "candidate" | "onboarding" | "trained" | "certified" | "active" | "alumni"
export type AmbassadorRecruitmentStage = "sourced" | "screening" | "interview" | "offer" | "onboarding" | "converted" | "rejected" | "archived"
export type AmbassadorOnboardingStage = "not_started" | "documents" | "orientation" | "field_shadowing" | "ready" | "completed" | "blocked"
export type AmbassadorTrainingStatus = "not_started" | "assigned" | "in_progress" | "completed" | "expired" | "failed"
export type AmbassadorCertificationStatus = "not_certified" | "pending" | "certified" | "expired" | "revoked"
export type AmbassadorTerritoryStatus = "active" | "paused" | "at_risk" | "archived"
export type AmbassadorMissionStatus = "draft" | "assigned" | "in_progress" | "completed" | "blocked" | "cancelled" | "archived"
export type AmbassadorPriority = "low" | "normal" | "high" | "critical"
export type AmbassadorGoalStatus = "tracking" | "at_risk" | "achieved" | "missed" | "archived"
export type AmbassadorIncentiveStatus = "draft" | "pending" | "approved" | "rejected" | "paid" | "archived"
export type AmbassadorReportStatus = "generated" | "exported" | "failed" | "archived"

export type AmbassadorWorkspaceMode =
  | "overview"
  | "directory"
  | "territories"
  | "performance"
  | "reports"
  | "recruitment"
  | "onboarding"
  | "training"
  | "goals"
  | "incentives"
  | "missions"
  | "settings"
  | "detail"
  | "create"
  | "edit"
  | "delete"

export type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
  details?: unknown
}

export type AmbassadorChecklistItem = {
  id: string
  label: string
  done: boolean
  completed_at?: string | null
}

export type Ambassador = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  full_name: string
  display_name?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  region?: string | null
  territory_id?: string | null
  territory_name?: string | null
  role?: string | null
  title?: string | null
  status: AmbassadorStatus
  lifecycle_stage: AmbassadorLifecycleStage
  manager_id?: string | null
  manager_name?: string | null
  recruitment_stage?: AmbassadorRecruitmentStage | null
  onboarding_stage?: AmbassadorOnboardingStage | null
  training_status?: AmbassadorTrainingStatus | null
  certification_status?: AmbassadorCertificationStatus | null
  performance_score: number
  kpi_score: number
  missions_completed: number
  missions_assigned: number
  incentives_balance: number
  last_activity_at?: string | null
  joined_at?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorTerritory = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  name: string
  city?: string | null
  region?: string | null
  zone?: string | null
  coverage_goal: number
  active_ambassadors_count: number
  manager_name?: string | null
  status: AmbassadorTerritoryStatus
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorMission = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  ambassador_id?: string | null
  title: string
  mission_type?: string | null
  priority: AmbassadorPriority
  status: AmbassadorMissionStatus
  city?: string | null
  region?: string | null
  territory_id?: string | null
  due_date?: string | null
  completed_at?: string | null
  assigned_by?: string | null
  description?: string | null
  instructions?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorRecruitmentRecord = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  candidate_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  region?: string | null
  source?: string | null
  stage: AmbassadorRecruitmentStage
  evaluation_score: number
  interviewer?: string | null
  notes?: string | null
  next_step?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorOnboardingRecord = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  ambassador_id: string
  stage: AmbassadorOnboardingStage
  checklist: AmbassadorChecklistItem[]
  completion_rate: number
  assigned_owner?: string | null
  due_date?: string | null
  completed_at?: string | null
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorTrainingCertification = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  ambassador_id: string
  training_name: string
  certification_name?: string | null
  status: AmbassadorTrainingStatus
  certification_status?: AmbassadorCertificationStatus | null
  score: number
  valid_until?: string | null
  completed_at?: string | null
  issued_by?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorKpiGoal = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  ambassador_id?: string | null
  period: string
  goal_type: string
  target_value: number
  current_value: number
  completion_rate: number
  status: AmbassadorGoalStatus
  manager_notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorIncentive = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  ambassador_id: string
  incentive_type: string
  amount: number
  currency: string
  status: AmbassadorIncentiveStatus
  reason?: string | null
  approved_by?: string | null
  approved_at?: string | null
  paid_at?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorReport = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  report_type: string
  title: string
  period_start?: string | null
  period_end?: string | null
  filters: JsonObject
  generated_by?: string | null
  status: AmbassadorReportStatus
  export_url?: string | null
  export_payload?: JsonObject | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorModuleSettings = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  default_region?: string | null
  approval_rules: JsonObject
  incentive_rules: JsonObject
  onboarding_rules: JsonObject
  training_rules: JsonObject
  kpi_rules: JsonObject
  notification_rules: JsonObject
  created_at: string
  updated_at: string
  metadata: JsonObject
}

export type AmbassadorAuditLog = {
  id: string
  tenant_id?: string | null
  organization_id?: string | null
  actor_id?: string | null
  actor_name?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  summary?: string | null
  before_snapshot?: JsonObject | null
  after_snapshot?: JsonObject | null
  created_at: string
  metadata: JsonObject
}

export type AmbassadorWorkspaceSnapshot = {
  ambassadors: Ambassador[]
  territories: AmbassadorTerritory[]
  missions: AmbassadorMission[]
  recruitment: AmbassadorRecruitmentRecord[]
  onboarding: AmbassadorOnboardingRecord[]
  training: AmbassadorTrainingCertification[]
  goals: AmbassadorKpiGoal[]
  incentives: AmbassadorIncentive[]
  reports: AmbassadorReport[]
  settings: AmbassadorModuleSettings | null
  audit: AmbassadorAuditLog[]
  diagnostics: string[]
}

export type AmbassadorDashboardKpis = {
  totalAmbassadors: number
  activeAmbassadors: number
  inactiveAmbassadors: number
  suspendedAmbassadors: number
  onboardingCompletion: number
  recruitmentPipeline: number
  assignedTerritories: number
  territoryCoverage: number
  missionsAssigned: number
  missionsCompleted: number
  trainingCompletion: number
  certificationValidity: number
  kpiCompletion: number
  incentivesPending: number
  incentivesApproved: number
  incentivesPaid: number
  reportsGenerated: number
}

export type AmbassadorEntity =
  | "ambassadors"
  | "territories"
  | "missions"
  | "recruitment"
  | "onboarding"
  | "training"
  | "goals"
  | "incentives"
  | "reports"
  | "settings"
  | "audit"

export type AmbassadorEntityRecord =
  | Ambassador
  | AmbassadorTerritory
  | AmbassadorMission
  | AmbassadorRecruitmentRecord
  | AmbassadorOnboardingRecord
  | AmbassadorTrainingCertification
  | AmbassadorKpiGoal
  | AmbassadorIncentive
  | AmbassadorReport
  | AmbassadorModuleSettings
  | AmbassadorAuditLog
