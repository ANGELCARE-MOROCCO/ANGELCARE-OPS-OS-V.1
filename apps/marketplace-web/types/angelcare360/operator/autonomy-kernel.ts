export type AutonomyKernelScene =
  | 'command'
  | 'metadata'
  | 'workflows'
  | 'policies'
  | 'entitlements'
  | 'metering'
  | 'extensions'
  | 'reliability'

export type KernelLifecycleStatus = 'draft' | 'review' | 'approved' | 'published' | 'deprecated' | 'retired'
export type KernelCertificationStatus = 'not_verified' | 'in_progress' | 'passed' | 'failed' | 'waived'
export type KernelSeverity = 'info' | 'warning' | 'critical'
export type KernelProvisioningStatus = 'queued' | 'running' | 'verification' | 'completed' | 'failed' | 'dead_letter'

export type KernelMetadataDefinition = {
  id: string
  key: string
  name: string
  description: string | null
  domain: string
  entity_type: string
  current_version: number
  lifecycle_status: KernelLifecycleStatus
  owner_role: string | null
  created_at: string
  updated_at: string
}

export type KernelMetadataVersion = {
  id: string
  definition_id: string
  version_number: number
  schema_json: Record<string, unknown>
  ui_schema_json: Record<string, unknown>
  validation_json: Record<string, unknown>
  compatibility_json: Record<string, unknown>
  checksum: string
  status: KernelLifecycleStatus
  effective_from: string | null
  effective_to: string | null
  created_at: string
}

export type KernelWorkflowDefinition = {
  id: string
  key: string
  name: string
  domain: string
  entity_type: string
  current_version: number
  lifecycle_status: KernelLifecycleStatus
  created_at: string
  updated_at: string
}

export type KernelWorkflowVersion = {
  id: string
  definition_id: string
  version_number: number
  states_json: Array<Record<string, unknown>>
  transitions_json: Array<Record<string, unknown>>
  sla_json: Record<string, unknown>
  automation_json: Array<Record<string, unknown>>
  checksum: string
  status: KernelLifecycleStatus
  created_at: string
}

export type KernelPolicyDefinition = {
  id: string
  key: string
  name: string
  domain: string
  scope_type: string
  current_version: number
  lifecycle_status: KernelLifecycleStatus
  created_at: string
  updated_at: string
}

export type KernelPolicyVersion = {
  id: string
  definition_id: string
  version_number: number
  condition_json: Record<string, unknown>
  actions_json: Array<Record<string, unknown>>
  authority_json: Record<string, unknown>
  exception_json: Record<string, unknown>
  checksum: string
  status: KernelLifecycleStatus
  created_at: string
}

export type KernelChangeset = {
  id: string
  changeset_code: string
  title: string
  domain: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'executing' | 'verified' | 'rolled_back'
  requested_by: string | null
  impact_json: Record<string, unknown>
  rollback_json: Record<string, unknown>
  validation_json: Record<string, unknown>
  effective_at: string | null
  created_at: string
  updated_at: string
}

export type KernelProvisioningJob = {
  id: string
  job_code: string
  tenant_id: string | null
  client_id: string | null
  subscription_id: string | null
  entitlement_snapshot_id: string | null
  operation: string
  idempotency_key: string
  status: KernelProvisioningStatus
  attempts: number
  max_attempts: number
  next_attempt_at: string | null
  payload_json: Record<string, unknown>
  result_json: Record<string, unknown> | null
  error_json: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type KernelMeterDefinition = {
  id: string
  meter_key: string
  name: string
  unit: string
  aggregation_method: string
  reset_schedule: string | null
  measurement_source: string
  soft_limit_pct: number
  warning_limit_pct: number
  critical_limit_pct: number
  hard_limit_pct: number
  lifecycle_status: KernelLifecycleStatus
  created_at: string
  updated_at: string
}

export type KernelCapacitySnapshot = {
  id: string
  tenant_id: string | null
  meter_key: string
  measured_at: string
  included_quantity: number
  reserved_quantity: number
  consumed_quantity: number
  forecast_quantity: number
  pressure_pct: number
  confidence_pct: number
  source_freshness_at: string | null
  state: 'healthy' | 'watch' | 'warning' | 'critical' | 'blocked' | 'stale'
  created_at: string
}

export type KernelExtensionManifest = {
  id: string
  extension_key: string
  name: string
  description: string | null
  current_version: string
  lifecycle_status: KernelLifecycleStatus
  compatibility_status: 'unknown' | 'compatible' | 'conditional' | 'incompatible'
  manifest_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type KernelCertificationControl = {
  id: string
  control_key: string
  control_name: string
  domain: string
  criticality: 'mandatory' | 'high' | 'standard'
  status: KernelCertificationStatus
  evidence_required: string
  owner_role: string | null
  last_verified_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type KernelRecoveryRehearsal = {
  id: string
  rehearsal_code: string
  scope: string
  status: 'planned' | 'running' | 'passed' | 'failed'
  target_rpo_minutes: number | null
  actual_rpo_minutes: number | null
  target_rto_minutes: number | null
  actual_rto_minutes: number | null
  evidence_json: Record<string, unknown>
  executed_at: string | null
  created_at: string
}

export type AutonomyKernelSnapshot = {
  generated_at: string
  production_certified: boolean
  certification_reason: string
  metrics: Array<{ key: string; label: string; value: string; detail: string; tone: 'neutral' | 'positive' | 'warning' | 'critical' }>
  metadata_definitions: KernelMetadataDefinition[]
  metadata_versions: KernelMetadataVersion[]
  workflow_definitions: KernelWorkflowDefinition[]
  workflow_versions: KernelWorkflowVersion[]
  policy_definitions: KernelPolicyDefinition[]
  policy_versions: KernelPolicyVersion[]
  changesets: KernelChangeset[]
  provisioning_jobs: KernelProvisioningJob[]
  meter_definitions: KernelMeterDefinition[]
  capacity_snapshots: KernelCapacitySnapshot[]
  extensions: KernelExtensionManifest[]
  certification_controls: KernelCertificationControl[]
  recovery_rehearsals: KernelRecoveryRehearsal[]
  freshness: Array<{ source: string; latest_at: string | null; state: 'fresh' | 'stale' | 'empty' }>
}

export type AutonomyKernelOperation =
  | 'create_metadata_definition'
  | 'publish_metadata_version'
  | 'validate_metadata_record'
  | 'create_workflow_definition'
  | 'publish_workflow_version'
  | 'start_workflow_instance'
  | 'transition_workflow_instance'
  | 'create_policy_definition'
  | 'publish_policy_version'
  | 'evaluate_policy'
  | 'create_changeset'
  | 'submit_changeset'
  | 'approve_changeset'
  | 'reject_changeset'
  | 'schedule_changeset'
  | 'start_changeset_execution'
  | 'verify_changeset'
  | 'rollback_changeset'
  | 'compile_tenant_entitlements'
  | 'queue_provisioning_job'
  | 'retry_provisioning_job'
  | 'create_meter_definition'
  | 'record_meter_sample'
  | 'refresh_capacity_snapshot'
  | 'register_extension'
  | 'publish_extension_version'
  | 'create_release_candidate'
  | 'assign_release_target'
  | 'create_runbook'
  | 'record_control_evidence'
  | 'create_recovery_rehearsal'
  | 'update_recovery_rehearsal'
