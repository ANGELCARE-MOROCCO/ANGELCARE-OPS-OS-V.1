export type MarketingAiAuthorityMode = 'observe' | 'advise' | 'prepare' | 'orchestrate_internal'
export type MarketingAiCommandStatus = 'draft' | 'active' | 'paused' | 'retired'
export type MarketingAiRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type MarketingAiFrequency = 'manual' | 'hourly' | 'every_4_hours' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
export type MarketingAiRunStatus = 'queued' | 'running' | 'needs_review' | 'completed' | 'failed' | 'cancelled' | 'blocked'
export type MarketingAiMissionStatus = 'draft' | 'approved' | 'running' | 'paused' | 'needs_review' | 'completed' | 'failed' | 'cancelled'

export interface MarketingAiSkill {
  code: string
  name: string
  category: string
  description: string
  defaultFrequency: MarketingAiFrequency
  mode: string
  riskLevel: MarketingAiRiskLevel
  progressiveLevels: string[]
  monthlyResourceUpdate: boolean
  status: 'active' | 'paused' | 'retired'
}

export interface MarketingAiOperation {
  code: string
  name: string
  instruction: string
  defaultFrequency: MarketingAiFrequency
}

export interface MarketingAiCommand {
  id?: string
  code: string
  name: string
  skillCode: string
  skillName: string
  category: string
  objective: string
  instruction: string
  defaultFrequency: MarketingAiFrequency
  authorityMode: MarketingAiAuthorityMode
  riskLevel: MarketingAiRiskLevel
  requiresHumanReview: boolean
  status: MarketingAiCommandStatus
  deployed: boolean
  tags: string[]
  source: 'system_catalog' | 'csv_import' | 'manual'
  version: string
  createdAt?: string
  updatedAt?: string
}

export interface MarketingAiSchedule {
  id: string
  name: string
  commandId?: string | null
  commandCode: string
  frequency: MarketingAiFrequency
  timezone: string
  hour: number
  minute: number
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  enabled: boolean
  authorityMode: MarketingAiAuthorityMode
  objective: string
  context: Record<string, unknown>
  lastRunAt?: string | null
  nextRunAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MarketingAiMission {
  id: string
  title: string
  objective: string
  sponsor: string
  authorityMode: MarketingAiAuthorityMode
  status: MarketingAiMissionStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  commandCodes: string[]
  context: Record<string, unknown>
  restrictions: string[]
  expectedOutcomes: string[]
  createdAt: string
  updatedAt: string
}

export interface MarketingAiRun {
  id: string
  missionId?: string | null
  scheduleId?: string | null
  commandId?: string | null
  commandCode: string
  status: MarketingAiRunStatus
  authorityMode: MarketingAiAuthorityMode
  model?: string | null
  objective: string
  input: Record<string, unknown>
  output?: MarketingAiOutput | null
  error?: string | null
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  grounded: boolean
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
}

export interface MarketingAiEvidence {
  title: string
  url?: string
  sourceType: 'internal' | 'external' | 'gemini_grounding'
  observedAt?: string
  freshness?: string
}

export interface MarketingAiInternalAction {
  type: 'create_brief' | 'create_content_draft' | 'create_task_plan' | 'create_asset_requirement' | 'request_review' | 'propose_schedule' | 'prepare_publishing_package' | 'classify_content' | 'record_learning' | 'store_bridge_object' | 'none'
  title: string
  description: string
  requiresApproval: boolean
  payload: Record<string, unknown>
}

export interface MarketingAiOutput {
  executiveSummary: string
  findings: string[]
  recommendations: string[]
  internalActions: MarketingAiInternalAction[]
  risks: Array<{ title: string; level: MarketingAiRiskLevel; mitigation: string }>
  evidence: MarketingAiEvidence[]
  learningSignals: string[]
  unresolvedQuestions: string[]
  confidence: number
  humanDecisionRequired: boolean
}


export interface MarketingAiBridgeObject {
  id: string
  runId?: string | null
  actionId?: string | null
  contentId?: string | null
  bridgeFileId: string
  entityType: string
  originalFilename: string
  safeFilename: string
  contentType?: string | null
  sizeBytes: number
  sha256Hash: string
  storageKey: string
  classification: Record<string, unknown>
  status: 'active' | 'superseded' | 'archived' | 'failed'
  createdAt: string
}

export interface MarketingAiDashboardSnapshot {
  source: 'database' | 'catalog_fallback'
  provider: {
    enabled: boolean
    configured: boolean
    model: string
    searchGrounding: boolean
    externalActionsAllowed: false
  }
  totals: {
    skills: number
    commands: number
    activeCommands: number
    schedules: number
    dueSchedules: number
    missions: number
    runs: number
    needsReview: number
    learningEvents: number
  }
  recentRuns: MarketingAiRun[]
  dueSchedules: MarketingAiSchedule[]
}
