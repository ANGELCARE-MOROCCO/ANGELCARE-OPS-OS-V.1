export type AiProviderModuleKey = 'revenue_os' | 'marketing_ai' | 'marketing_autopilot' | string
export type AiProviderCapability = 'health_check' | 'structured_strategy' | 'structured_content' | 'grounded_research' | 'general' | string
export type AiProviderAssignmentMode = 'primary' | 'secondary' | 'failover' | 'emergency_reserve' | 'sandbox' | 'manual' | 'disabled'
export type AiProviderStatus = 'draft' | 'testing' | 'ready' | 'operating' | 'limited' | 'cooldown' | 'suspended' | 'draining' | 'revoked' | 'archived'

export type JsonRecord = Record<string, unknown>

export type AiProviderDossier = {
  id: string
  code: string
  name: string
  provider_type: string
  status: AiProviderStatus
  environment: string
  account_label: string | null
  external_account_id: string | null
  billing_tier: string
  reconciliation_state: string
  is_enabled: boolean
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderCapacityPool = {
  id: string
  dossier_id: string
  pool_key: string
  project_name: string
  external_project_id: string | null
  quota_scope: string
  provider_rpm: number | null
  provider_tpm: number | null
  provider_rpd: number | null
  provider_grounded_rpd: number | null
  billing_tier: string
  status: string
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderCredential = {
  id: string
  dossier_id: string
  capacity_pool_id: string | null
  fingerprint: string
  secret_suffix: string
  version_number: number
  key_type: string
  status: string
  validated_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  failure_code: string | null
  created_at: string
  updated_at: string
}

export type AiProviderModelPolicy = {
  id: string
  dossier_id: string
  model_code: string
  display_name: string
  capability: string
  enabled: boolean
  primary_for_capability: boolean
  grounding_allowed: boolean
  max_output_tokens: number | null
  metadata: JsonRecord
}

export type AiProviderModuleAssignment = {
  id: string
  module_key: string
  dossier_id: string
  capacity_pool_id: string | null
  assignment_mode: AiProviderAssignmentMode
  priority: number
  enabled: boolean
  capability_allowlist: string[]
  primary_model: string | null
  fallback_model: string | null
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderQuotaPolicy = {
  id: string
  scope_type: string
  scope_key: string
  max_requests_per_minute: number | null
  max_requests_per_hour: number | null
  max_requests_per_day: number | null
  max_requests_per_week: number | null
  max_requests_per_month: number | null
  max_input_tokens_per_day: number | null
  max_input_tokens_per_week: number | null
  max_output_tokens_per_day: number | null
  max_output_tokens_per_week: number | null
  max_total_tokens_per_week: number | null
  max_estimated_cost_usd_per_day: number | null
  max_estimated_cost_usd_per_week: number | null
  max_estimated_cost_usd_per_month: number | null
  max_grounded_requests_per_day: number | null
  max_concurrent_requests: number | null
  emergency_reserve_requests: number
  soft_threshold_percent: number
  hard_limit: boolean
  reset_timezone: string
  enabled: boolean
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderUsageRow = {
  id: string
  occurred_at: string
  module_key: string
  capability: string
  dossier_id: string | null
  capacity_pool_id: string | null
  credential_id: string | null
  model_code: string | null
  request_count: number
  grounded_request_count: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  latency_ms: number | null
  http_status: number | null
  outcome: string
  error_code: string | null
  estimated_cost_usd: number
  actor_id: string | null
  mission_id: string | null
  command_code: string | null
  metadata: JsonRecord
}

export type AiProviderSnapshot = {
  generatedAt: string
  emergency: JsonRecord | null
  dossiers: AiProviderDossier[]
  pools: AiProviderCapacityPool[]
  credentials: AiProviderCredential[]
  models: AiProviderModelPolicy[]
  assignments: AiProviderModuleAssignment[]
  routingRules: JsonRecord[]
  quotas: AiProviderQuotaPolicy[]
  usage: AiProviderUsageRow[]
  healthChecks: JsonRecord[]
  incidents: JsonRecord[]
  alerts: JsonRecord[]
  configVersions: JsonRecord[]
  audit: JsonRecord[]
  commandPolicies: AiProviderCommandPolicy[]
  schedules: AiProviderCommandSchedule[]
  governedRequests: AiProviderGovernedRequest[]
  structuredCache: AiProviderStructuredCache[]
  reuseEvents: JsonRecord[]
  rollups: {
    todayRequests: number
    todayGroundedRequests: number
    todayInputTokens: number
    todayOutputTokens: number
    todayFailures: number
    activeDossiers: number
    operatingPools: number
    activeCredentials: number
    weekRequests: number
    weekInputTokens: number
    weekOutputTokens: number
    weekCostUsd: number
    cacheHits: number
    joinedRequests: number
    blockedRequests: number
    avoidedRequests: number
    avoidedTokens: number
    avoidedCostUsd: number
    activeSchedules: number
    suspendedCommands: number
  }
}

export type GovernedProviderAcquisition = {
  governed: boolean
  reservationId: string | null
  leaseId: string | null
  dossierId: string | null
  capacityPoolId: string | null
  credentialId: string | null
  providerType: string
  apiKey: string | null
  model: string
  moduleKey: string
  capability: string
  assignmentMode: string | null
  decision?: AiProviderRequestDecision
  requestId?: string | null
  sourceRequestId?: string | null
  cachedResult?: JsonRecord | null
  cacheExpiresAt?: string | null
}


export type GovernedUsage = {
  requestCount?: number
  groundedRequestCount?: number
  inputTokens?: number
  outputTokens?: number
  latencyMs?: number
  httpStatus?: number
  outcome?: string
  errorCode?: string | null
  estimatedCostUsd?: number
  actorId?: string | null
  missionId?: string | null
  commandCode?: string | null
  metadata?: JsonRecord
}

export type AiProviderRequestDecision =
  | 'EXECUTE_NEW'
  | 'REUSE_CACHED'
  | 'JOIN_IN_FLIGHT'
  | 'BLOCK_QUOTA'
  | 'BLOCK_DUPLICATE'
  | 'BLOCK_POLICY'
  | 'DEFER_SCHEDULE'
  | 'REQUIRE_APPROVAL'

export type AiProviderTriggerType = 'manual' | 'scheduled' | 'retry' | 'forced_refresh' | 'system' | 'health_test'

export type AiProviderCommandPolicy = {
  id: string
  module_key: string
  workspace_key: string
  command_code: string
  ai_mode: 'deterministic' | 'ai_optional' | 'ai_recommended' | 'ai_required' | 'ai_prohibited'
  manual_allowed: boolean
  scheduled_allowed: boolean
  minimum_interval_seconds: number
  max_runs_per_day: number | null
  max_runs_per_week: number | null
  max_runs_per_month: number | null
  max_input_tokens_per_run: number | null
  max_output_tokens_per_run: number | null
  max_cost_usd_per_run: number | null
  max_cost_usd_per_day: number | null
  max_cost_usd_per_week: number | null
  max_retries: number
  cache_mode: string
  cache_ttl_seconds: number
  duplicate_window_seconds: number
  force_refresh_allowed: boolean
  approval_class: string
  allowed_provider_types: string[]
  allowed_models: string[]
  allowed_trigger_types: string[]
  execution_window: JsonRecord
  cooldown_after_failure_seconds: number
  consecutive_failure_suspend_threshold: number
  enabled: boolean
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderCommandSchedule = {
  id: string
  schedule_key: string
  module_key: string
  workspace_key: string
  command_code: string
  schedule_expression: string
  schedule_format: 'cron' | 'rrule' | 'interval'
  timezone: string
  enabled: boolean
  status: 'active' | 'paused' | 'suspended' | 'completed' | 'archived'
  priority: number
  freshness_seconds: number
  duplicate_window_seconds: number
  max_runs_per_day: number | null
  max_runs_per_week: number | null
  estimated_input_tokens: number
  estimated_output_tokens: number
  estimated_cost_usd: number
  approval_required: boolean
  provider_policy: JsonRecord
  dependency_policy: JsonRecord
  failure_policy: JsonRecord
  last_due_at: string | null
  last_started_at: string | null
  last_completed_at: string | null
  next_run_at: string | null
  skipped_count: number
  failure_count: number
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderGovernedRequest = {
  id: string
  request_fingerprint: string
  module_key: string
  workspace_key: string
  capability: string
  command_code: string | null
  mandate_id: string | null
  mission_id: string | null
  actor_id: string | null
  trigger_type: AiProviderTriggerType
  schedule_id: string | null
  prompt_version: string | null
  source_revision: string | null
  requested_model: string | null
  provider_type: string | null
  model_code: string | null
  decision: AiProviderRequestDecision
  status: string
  source_request_id: string | null
  reservation_id: string | null
  lease_id: string | null
  estimated_requests: number
  estimated_input_tokens: number
  estimated_output_tokens: number
  estimated_cost_usd: number
  actual_input_tokens: number
  actual_output_tokens: number
  actual_cost_usd: number
  result_json: JsonRecord | null
  result_hash: string | null
  cache_expires_at: string | null
  error_code: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type AiProviderStructuredCache = {
  id: string
  request_fingerprint: string
  module_key: string
  workspace_key: string
  capability: string
  command_code: string | null
  prompt_version: string | null
  source_revision: string | null
  provider_type: string | null
  model_code: string | null
  result_json: JsonRecord
  result_hash: string
  validation_status: string
  source_request_id: string | null
  original_input_tokens: number
  original_output_tokens: number
  original_cost_usd: number
  reuse_count: number
  avoided_input_tokens: number
  avoided_output_tokens: number
  avoided_cost_usd: number
  expires_at: string | null
  invalidated_at: string | null
  invalidation_reason: string | null
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

export type GovernedAiPreflight = {
  eligible: boolean
  decision: AiProviderRequestDecision
  reason?: string | null
  moduleKey?: string
  workspaceKey?: string
  commandCode?: string
  providerType?: string
  model?: string
  assignmentMode?: string
  estimatedRequests?: number
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  estimatedCostUsd?: number
  usage?: JsonRecord
  policy?: AiProviderCommandPolicy | null
  schedule?: AiProviderCommandSchedule | null
  cache?: JsonRecord | null
  inFlightRequestId?: string | null
}

export type GovernedAiExecutionContext = {
  apiKey: string
  model: string
  providerType: string
  requestId: string
  reservationId: string | null
  leaseId: string | null
}

export type GovernedAiExecutionInput<TResult> = {
  moduleKey: AiProviderModuleKey
  workspaceKey: string
  capability: AiProviderCapability
  commandCode: string
  requestedModel: string
  promptVersion?: string | null
  sourceRevision?: string | null
  requestPayload: unknown
  triggerType?: AiProviderTriggerType
  scheduleKey?: string | null
  actorId?: string | null
  missionId?: string | null
  mandateId?: string | null
  estimatedRequests?: number
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  estimatedCostUsd?: number
  grounded?: boolean
  forceRefresh?: boolean
  approvalGranted?: boolean
  cacheTtlSeconds?: number
  metadata?: JsonRecord
  joinTimeoutMs?: number
  execute: (context: GovernedAiExecutionContext) => Promise<{
    result: TResult
    requestCount?: number
    groundedRequestCount?: number
    inputTokens?: number
    outputTokens?: number
    latencyMs?: number
    httpStatus?: number
    estimatedCostUsd?: number
    metadata?: JsonRecord
  }>
}

export type GovernedAiExecutionResult<TResult> = {
  decision: AiProviderRequestDecision
  requestId: string
  sourceRequestId: string | null
  providerType: string | null
  model: string | null
  result: TResult
  cacheExpiresAt: string | null
  reused: boolean
  joined: boolean
  usage: {
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    providerCallAvoided: boolean
  }
}
