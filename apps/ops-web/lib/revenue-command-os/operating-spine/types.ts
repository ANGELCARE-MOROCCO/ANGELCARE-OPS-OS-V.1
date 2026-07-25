export type RevenueOperatingStageKey =
  | 'objective'
  | 'intelligence'
  | 'strategy'
  | 'council'
  | 'decision'
  | 'compilation'
  | 'execution'
  | 'learning'

export type RevenueOperatingStageState =
  | 'ready'
  | 'active'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'degraded'
  | 'empty'

export interface RevenueOperatingStage {
  key: RevenueOperatingStageKey
  label: string
  state: RevenueOperatingStageState
  summary: string
  count: number
  href: string
  nextAction?: string
  blocker?: string
}

export interface RevenueOperatingObjective {
  id: string
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  targetSegments: string[]
  territories: string[]
  revenueTarget?: number
  marginTarget?: number
  horizon: string
  priority: string
  status: string
  owner: string
  updatedAt?: string
  raw: Record<string, unknown>
}

export interface RevenueAiRunLedger {
  id: string
  objectiveId?: string
  status: string
  provider: string
  model: string
  promptCode?: string
  promptVersion?: string
  startedAt?: string
  completedAt?: string
  durationMs?: number
  inputTokens: number
  outputTokens: number
  fallbackUsed: boolean
  error?: string
  strategyCount: number
  selectedCommandCount: number
  contextFactCount: number
  hypothesisCount: number
  unknownCount: number
  contradictionCount: number
  localResources: string[]
  providerNativeToolCalls: number
  externalActions: number
}

export interface RevenueOperatingStrategy {
  id: string
  code: string
  title: string
  version: string
  status: string
  thesis: string
  archetype: string
  confidence: number
  targetMarkets: string[]
  targetSegments: string[]
  territories: string[]
  valueProposition: string
  predictedResults: Record<string, Record<string, number>>
  risks: Array<Record<string, unknown>>
  assumptions: Array<Record<string, unknown>>
  commandPortfolio: Array<Record<string, unknown>>
  scenarios: Array<Record<string, unknown>>
  evidenceCount: number
  recommended: boolean
  councilEligible: boolean
  approved: boolean
  raw: Record<string, unknown>
}

export interface RevenueCouncilLedger {
  runId?: string
  strategyId?: string
  status: string
  classification?: string
  completedAgents: number
  findings: number
  blockingFindings: number
  contradictions: number
  topFindings: string[]
  readyForDecision: boolean
  updatedAt?: string
}

export interface RevenueDecisionLedger {
  requestId?: string
  decisionId?: string
  strategyId?: string
  status: string
  approvalClass?: string
  conditions: string[]
  reason?: string
  decidedBy?: string
  decidedAt?: string
}

export interface RevenueCompilationLedger {
  runId?: string
  strategyId?: string
  status: string
  packageId?: string
  generatedObjects: number
  conflicts: number
  programs: number
  campaigns: number
  waves: number
  missions: number
  tasks: number
  updatedAt?: string
}

export interface RevenueExecutionLedger {
  packageId?: string
  propagationRunId?: string
  status: string
  executionMode: string
  adaptersDeclared: number
  adaptersHealthy: number
  prepared: number
  awaitingApproval: number
  queued: number
  executing: number
  succeeded: number
  failed: number
  deadLetters: number
  externalActions: number
  latestActions: Array<{
    id: string
    type: string
    status: string
    adapter: string
    target: string
    externalAction: boolean
    approvalRequired: boolean
    lastError?: string
    updatedAt?: string
  }>
}

export interface RevenueOutcomeLedger {
  outcomes: number
  experiments: number
  attributionEvents: number
  feedbackRecords: number
  winningPlays: number
  latestOutcome?: string
  latestLearning?: string
}

export interface RevenueBoardBrief {
  tryingToWin: string
  engineWork: string
  recommendation: string
  expectedBenefit: string
  evidencePosition: string
  blockedOrAtRisk: string
  decisionRequired: string
  nextAction: string
}

export interface RevenueOperatingSpineSnapshot {
  generatedAt: string
  tenantId: string
  executionMode: string
  externalActionsEnabled: boolean
  boardBrief: RevenueBoardBrief
  stages: RevenueOperatingStage[]
  objective: RevenueOperatingObjective | null
  aiRuns: RevenueAiRunLedger[]
  strategies: RevenueOperatingStrategy[]
  context: Record<string, unknown> | null
  comparison: Record<string, unknown> | null
  council: RevenueCouncilLedger
  decision: RevenueDecisionLedger
  compilation: RevenueCompilationLedger
  execution: RevenueExecutionLedger
  outcomes: RevenueOutcomeLedger
  programs: Array<Record<string, unknown>>
  missions: Array<Record<string, unknown>>
  exceptions: Array<{
    id: string
    title: string
    severity: string
    status: string
    impact: string
    recommendedAction: string
    owner?: string
    dueAt?: string
  }>
  sourceHealth: Record<string, { ok: boolean; message?: string }>
  warnings: string[]
}

export interface RevenueOperationLaunchInput {
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  targetSegments: string[]
  territories: string[]
  targetAccounts: string[]
  revenueTarget?: number
  marginTarget?: number
  horizon: string
  deadline?: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  budgetLimit?: number
  capacityLimit?: number
  approvedOffers: string[]
  approvedChannels: string[]
  constraints: string[]
  successDefinition: string[]
  failureDefinition: string[]
  riskAppetite: 'conservative' | 'balanced' | 'aggressive'
  authorityLevel: string
}
