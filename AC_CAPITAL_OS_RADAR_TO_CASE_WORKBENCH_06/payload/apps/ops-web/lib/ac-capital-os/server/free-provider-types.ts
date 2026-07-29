export type JsonRecord = Record<string, unknown>;

export type AcCapitalProviderKey = "tavily" | "openrouter";
export type AcCapitalAgentStatus = "active" | "paused" | "disabled";
export type AcCapitalRunStatus = "queued" | "running" | "completed" | "completed-with-warnings" | "failed" | "cancelled" | "blocked";

export type AcCapitalProviderConfig = {
  id: string;
  provider_key: AcCapitalProviderKey;
  display_name: string;
  provider_role: "search" | "analysis";
  enabled: boolean;
  paused: boolean;
  dossier_id: string | null;
  capacity_pool_id: string | null;
  credential_id: string | null;
  endpoint: string;
  model_code: string | null;
  config: JsonRecord;
  internal_limits: JsonRecord;
  provider_usage: JsonRecord;
  health_status: string;
  health_message: string | null;
  last_health_check_at: string | null;
  last_usage_sync_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AcCapitalAiAgent = {
  id: string;
  agent_key: string;
  name: string;
  description: string | null;
  category: string;
  status: AcCapitalAgentStatus;
  search_provider_key: string;
  analysis_provider_key: string;
  trigger_mode: "manual" | "scheduled" | "both";
  frequency_key: "hourly" | "daily" | "weekly" | "monthly" | "custom";
  schedule: JsonRecord;
  search_config: JsonRecord;
  analysis_config: JsonRecord;
  quota_config: JsonRecord;
  action_permissions: JsonRecord;
  prompt_doctrine: string;
  failure_policy: JsonRecord;
  last_run_at: string | null;
  next_run_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
};

export type ExternalResearchSource = {
  index: number;
  title: string;
  url: string;
  content: string;
  rawContent: string | null;
  score: number;
  domain: string;
};

export type ExternalResearchOpportunity = {
  title: string;
  organizationName: string | null;
  opportunityType: string;
  country: string | null;
  region: string | null;
  amountMin: number | null;
  amountMax: number | null;
  amountRangeLabel: string | null;
  currencyLabel: string;
  deadline: string | null;
  deadlineLabel: string | null;
  deadlineHeat: "cold" | "watch" | "warm" | "hot" | "critical" | "unknown";
  applicationUrl: string | null;
  applicationStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  eligibilityPreview: string;
  angelcareRelevancePreview: string;
  whyCaptured: string;
  sourceConfidence: number;
  relevanceScore: number;
  eligibilityConfidence: number;
  evidenceQualityScore: number;
  strategicValueScore: number;
  effortScore: number;
  riskLevel: string;
  requiredDocuments: string[];
  proofGaps: string[];
  evidenceQuotes: string[];
  recommendedNextAction: string;
  clusterKey: string | null;
  captureDecision: "capture" | "reject";
  rejectionReason: string | null;
};

export type ExternalResearchAnalysis = {
  summary: string;
  confidence: number;
  opportunities: ExternalResearchOpportunity[];
  rejectedSignals: Array<{
    title: string;
    reason: string;
    sourceTitle: string | null;
    sourceUrl: string | null;
  }>;
  marketSignals: string[];
  risks: string[];
  nextActions: string[];
};

export type ExternalResearchExecution = {
  runId: string;
  agent: AcCapitalAiAgent;
  searchProvider: "tavily";
  analysisProvider: "openrouter";
  selectedAnalysisModel: string;
  tavilyRequestId: string | null;
  openRouterRequestId: string | null;
  tavilyCredits: number;
  searchQueries: string[];
  inputTokens: number;
  outputTokens: number;
  searchLatencyMs: number;
  analysisLatencyMs: number;
  sources: ExternalResearchSource[];
  analysis: ExternalResearchAnalysis;
};

export type AcCapitalAiControlSnapshot = {
  generatedAt: string;
  runtimeState: JsonRecord | null;
  providers: AcCapitalProviderConfig[];
  agents: AcCapitalAiAgent[];
  profiles: JsonRecord[];
  runs: JsonRecord[];
  usage: JsonRecord[];
  incidents: JsonRecord[];
  audits: JsonRecord[];
  providerDossiers: JsonRecord[];
  providerCredentials: JsonRecord[];
  rollups: {
    activeAgents: number;
    pausedAgents: number;
    completedToday: number;
    failedToday: number;
    tavilyCreditsToday: number;
    tavilyCreditsMonth: number;
    openRouterRequestsToday: number;
    openRouterRequestsMonth: number;
  };
};
