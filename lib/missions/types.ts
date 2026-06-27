export type MissionKind = 'single' | 'dossier' | 'sub_mission'
export type MissionStatus = 'draft' | 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'incident' | 'cancelled' | 'archived'
export type MissionLifecycleStage =
  | 'draft'
  | 'intake_review'
  | 'ready_for_assignment'
  | 'assigned'
  | 'family_confirmed'
  | 'caregiver_confirmed'
  | 'confirmed'
  | 'pre_mission_check'
  | 'en_route'
  | 'checked_in'
  | 'in_progress'
  | 'field_report_pending'
  | 'report_submitted'
  | 'ops_validation'
  | 'completed'
  | 'incident'
  | 'cancelled'
  | 'archived'

export type ReportStatus = 'not_required' | 'pending' | 'submitted' | 'needs_correction' | 'validated'
export type ValidationStatus = 'pending' | 'ready' | 'validated' | 'rejected' | 'needs_review'
export type ReadinessStatus = 'pending' | 'ready' | 'warning' | 'blocked'
export type RiskLevel = 'normal' | 'watch' | 'elevated' | 'critical'

export type MissionRow = {
  id: number
  family_id: number | null
  caregiver_id: number | null
  service_type: string | null
  mission_date: string | null
  start_time: string | null
  end_time: string | null
  status: MissionStatus | string | null
  urgency: string | null
  ops_priority?: string | null
  city: string | null
  zone: string | null
  notes: string | null
  ops_notes?: string | null
  is_archived?: boolean | null
  contract_id?: number | null
  confirmed_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  incident_at?: string | null
  cancelled_at?: string | null
  parent_mission_id?: number | null
  mission_group_id?: string | null
  mission_kind?: MissionKind | string | null
  recurrence_type?: string | null
  recurrence_rule?: Record<string, unknown> | null
  recurrence_start_date?: string | null
  recurrence_end_date?: string | null
  occurrence_index?: number | null
  dossier_reference?: string | null
  dossier_status?: string | null
  lifecycle_stage?: MissionLifecycleStage | string | null
  readiness_status?: ReadinessStatus | string | null
  validation_status?: ValidationStatus | string | null
  report_status?: ReportStatus | string | null
  sla_status?: string | null
  risk_level?: RiskLevel | string | null
  service_family?: string | null
  mission_scope?: string | null
  internal_procedure_level?: string | null
  report_submitted_at?: string | null
  validated_at?: string | null
  validated_by?: string | null
  families?: Record<string, unknown> | null
  caregivers?: Record<string, unknown> | null
  contracts?: Record<string, unknown> | null
}

export type MissionEvent = {
  id?: number | string
  mission_id: number
  event_type: string
  content: string
  metadata?: Record<string, unknown>
  source?: string
  created_at?: string
  created_by?: string | null
}

export type MissionControlRecord = {
  id: number
  code: string
  title: string
  missionKind: MissionKind
  status: string
  lifecycleStage: string
  serviceType: string
  serviceFamily: string
  dateLabel: string
  timeLabel: string
  city: string
  zone: string
  familyName: string
  caregiverName: string
  caregiverId: number | null
  familyId: number | null
  urgency: string
  priority: string
  readinessStatus: string
  validationStatus: string
  reportStatus: string
  riskLevel: string
  subMissionCount: number
  completedSubMissionCount: number
  upcomingSubMissionCount: number
}

export type MissionDossier = {
  mission: MissionControlRecord
  raw: MissionRow
  subMissions: MissionControlRecord[]
  events: MissionEvent[]
  routes: Record<string, unknown>[]
  parameters: Record<string, unknown> | null
  parameterDays: Record<string, unknown>[]
  transport: Record<string, unknown> | null
  allowances: Record<string, unknown> | null
  programLines: Record<string, unknown>[]
  checklistItems?: Record<string, unknown>[]
  report?: Record<string, unknown> | null
  dispatchMessages?: Record<string, unknown>[]
  notifications?: Record<string, unknown>[]
  alerts?: Record<string, unknown>[]
  paymentDisputes?: Record<string, unknown>[]
  documents?: Record<string, unknown>[]
  programActivityLogs?: Record<string, unknown>[]
  briefAcknowledgements?: Record<string, unknown>[]
  routeExecutionLogs?: Record<string, unknown>[]
}

export type ServiceCharacteristic = {
  serviceType: string
  serviceFamily: string
  requiredFields: string[]
  requiredSkills: string[]
  requiredDocuments: string[]
  defaultChecklist: string[]
  reportTemplate: string[]
  riskRules: string[]
  internalProcedure: string
  allowedAssignmentRoles: string[]
}
