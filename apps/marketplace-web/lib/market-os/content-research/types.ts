export type JsonRecord = Record<string, unknown>

export type ResearchProviderKey = 'tavily' | 'openrouter' | 'searxng'
export type ResearchProviderRole = 'search_primary' | 'search_fallback' | 'analysis'
export type ResearchProviderStatus = 'active' | 'paused' | 'not_configured' | 'degraded'
export type ResearchAgentStatus = 'draft' | 'active' | 'paused' | 'retired'
export type ResearchRunStatus =
  | 'queued'
  | 'searching_tavily'
  | 'searching_searxng_fallback'
  | 'sources_normalized'
  | 'sources_persisted'
  | 'analyzing_openrouter'
  | 'validating_findings'
  | 'materializing_internal'
  | 'completed'
  | 'completed_without_opportunities'
  | 'partially_completed'
  | 'blocked_no_search_provider'
  | 'failed_source_persistence'
  | 'failed_analysis_provider'
  | 'failed_schema_validation'
  | 'failed'
  | 'cancelled'

export type ResearchFindingType =
  | 'signal'
  | 'content_opportunity'
  | 'communication_risk'
  | 'editorial_window'
  | 'content_gap'
  | 'claim_verification'
  | 'source_integrity'
  | 'creative_reference'
  | 'evidence_gap'
  | 'publication_readiness'

export type ResearchProviderPolicy = {
  id: string
  provider_key: ResearchProviderKey
  display_name: string
  provider_role: ResearchProviderRole
  status: ResearchProviderStatus
  enabled: boolean
  configuration: JsonRecord
  limits: JsonRecord
  health: JsonRecord
  version_number: number
  updated_by_name: string | null
  last_tested_at: string | null
  created_at: string
  updated_at: string
}

export type ResearchAgent = {
  id: string
  code: string
  name: string
  agent_type: string
  purpose: string
  owner_name: string | null
  status: ResearchAgentStatus
  priority: string
  workspace_scopes: string[]
  content_families: string[]
  services: string[]
  audiences: string[]
  cities: string[]
  languages: string[]
  topics: string[]
  excluded_topics: string[]
  provider_policy: JsonRecord
  schedule_policy: JsonRecord
  quota_policy: JsonRecord
  research_policy: JsonRecord
  analysis_policy: JsonRecord
  materialization_policy: JsonRecord
  approval_boundary: string
  policy_version: number
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
  updated_at: string
}

export type ResearchRun = {
  id: string
  agent_id: string | null
  agent_code: string
  research_command: string
  objective: string
  query: string
  status: ResearchRunStatus
  priority: string
  trigger_type: string
  provider_stage: string
  requested_by_name: string | null
  override_policy: JsonRecord
  search_provider: string | null
  analysis_provider: string | null
  requested_model: string | null
  resolved_model: string | null
  search_request_id: string | null
  search_credits: number
  search_result_count: number
  accepted_source_count: number
  finding_count: number
  signal_count: number
  internal_action_count: number
  input_tokens: number
  output_tokens: number
  latency_ms: number
  result_summary: string | null
  materialization_result: JsonRecord
  error_code: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type ResearchRunEvent = {
  id: number
  run_id: string
  event_type: string
  stage: string
  message: string
  detail: JsonRecord
  created_at: string
}

export type ResearchUsageLedger = {
  id: number
  provider_key: string
  agent_id: string | null
  run_id: string | null
  metric_type: string
  quantity: number
  unit: string
  period_key: string
  detail: JsonRecord
  created_at: string
}

export type ResearchAlert = {
  id: string
  provider_key: string | null
  agent_id: string | null
  run_id: string | null
  alert_type: string
  severity: string
  title: string
  message: string
  status: string
  detail: JsonRecord
  acknowledged_by_name: string | null
  acknowledged_at: string | null
  created_at: string
}

export type CanonicalPublicSource = {
  id: string
  canonical_url: string
  normalized_url: string
  title: string
  publisher: string | null
  published_at: string | null
  retrieved_at: string
  research_query: string
  snippet: string
  content_excerpt: string
  source_provider: string
  provider_rank: number | null
  origin_module: string
  origin_workspace: string
  research_run_id: string | null
  url_hash: string
  content_hash: string
  language: string | null
  country: string | null
  source_type: string
  credibility_state: string
  freshness_state: string
  rights_state: string
  raw_metadata: JsonRecord
  first_seen_at: string
  last_seen_at: string
}

export type ResearchFinding = {
  id: string
  run_id: string
  agent_id: string | null
  finding_type: ResearchFindingType
  title: string
  description: string
  evidence_summary: string
  source_ids: string[]
  services: string[]
  audiences: string[]
  cities: string[]
  channels: string[]
  relevance_score: number
  business_fit_score: number
  urgency_score: number
  evidence_confidence: number
  combined_score: number
  recommended_internal_action: string
  limitations: string[]
  unknowns: string[]
  status: string
  materialized_signal_id: string | null
  created_at: string
}

export type ResearchControlSnapshot = {
  migrationReady: boolean
  generatedAt: string
  credentials: {
    tavilyPresent: boolean
    openrouterPresent: boolean
    searxngConfigured: boolean
  }
  providers: ResearchProviderPolicy[]
  agents: ResearchAgent[]
  runs: ResearchRun[]
  runEvents: ResearchRunEvent[]
  usage: ResearchUsageLedger[]
  alerts: ResearchAlert[]
  sources: CanonicalPublicSource[]
  findings: ResearchFinding[]
  audit?: Array<Record<string, unknown>>
  rollups: {
    activeAgents: number
    pausedAgents: number
    queuedRuns: number
    activeRuns: number
    failedRuns: number
    sourcesThisMonth: number
    opportunitiesThisMonth: number
    tavilyCreditsThisMonth: number
    openrouterRequestsThisMonth: number
    pendingAlerts: number
  }
}

export type TavilySearchResult = {
  title: string
  url: string
  content: string
  score: number
  rawContent: string | null
  favicon: string | null
}

export type TavilySearchResponse = {
  query: string
  results: TavilySearchResult[]
  requestId: string | null
  credits: number
  responseTime: number | null
}

export type StructuredResearchFinding = {
  findingType: ResearchFindingType
  title: string
  description: string
  sourceIndexes: number[]
  evidenceSummary: string
  services: string[]
  audiences: string[]
  cities: string[]
  channels: string[]
  relevanceScore: number
  businessFitScore: number
  urgencyScore: number
  evidenceConfidence: number
  recommendedInternalAction: string
  limitations: string[]
  unknowns: string[]
}

export type StructuredResearchAnalysis = {
  researchSummary: string
  findings: StructuredResearchFinding[]
  rejectedHypotheses: string[]
  missingInformation: string[]
}

export type OpenRouterAnalysisResponse = {
  requestedModel: string
  resolvedModel: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  analysis: StructuredResearchAnalysis
}
