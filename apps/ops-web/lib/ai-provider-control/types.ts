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
  max_requests_per_month: number | null
  max_input_tokens_per_day: number | null
  max_output_tokens_per_day: number | null
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
  rollups: {
    todayRequests: number
    todayGroundedRequests: number
    todayInputTokens: number
    todayOutputTokens: number
    todayFailures: number
    activeDossiers: number
    operatingPools: number
    activeCredentials: number
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
