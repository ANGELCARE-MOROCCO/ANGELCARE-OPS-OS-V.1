export const COCKPIT_ZONE_KEYS = [
  'objective-command',
  'live-signals',
  'strategy-assembly',
  'validation-council',
  'active-programs',
  'command-runs',
  'campaign-waves',
  'mission-compiler',
  'execution-progress',
  'revenue-exceptions',
  'experiments-winning-plays',
  'revenue-learning-memory',
  'approvals-governance',
] as const

export type CockpitZoneKey = (typeof COCKPIT_ZONE_KEYS)[number]
export type CockpitRoleView = 'executive' | 'commercial' | 'operations' | 'finance' | 'agent'
export type CockpitSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type CockpitPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'
export type FreshnessState = 'live' | 'fresh' | 'aging' | 'stale' | 'unknown'
export type InterventionStatus = 'open' | 'acknowledged' | 'assigned' | 'in_progress' | 'resolved' | 'dismissed'
export type CockpitExecutionMode = 'shadow' | 'internal_only' | 'approval_required' | 'limited_autopilot' | 'suspended' | 'emergency_stop'

export interface CockpitActor {
  id: string
  displayName: string
  role: string
  permissions: string[]
  tenantId: string
  roleView: CockpitRoleView
}

export interface DataFreshness {
  state: FreshnessState
  observedAt?: string
  refreshedAt: string
  ageMinutes?: number
  source: string
  message: string
}

export interface ObjectiveCommandSummary {
  id: string
  code: string
  title: string
  status: string
  version: number
  revenueTarget: number
  qualifiedPipelineTarget: number
  marginTarget: number
  actualRevenue: number
  qualifiedPipeline: number
  forecastRevenue: number
  progressPercent: number
  forecastPercent: number
  confidence: number
  territories: string[]
  businessUnits: string[]
  segments: string[]
  horizonStart?: string
  horizonEnd?: string
  approvalStatus: string
  currentBlockers: string[]
  nextMilestone?: string
  freshness: DataFreshness
}

export interface LiveSignalSummary {
  id: string
  code: string
  category: string
  signalType: string
  title: string
  summary: string
  severity: CockpitSeverity
  confidence: string
  priorityScore: number
  opportunityScore: number
  riskScore: number
  status: string
  source: string
  occurredAt: string
  affectedStrategyIds: string[]
  affectedAccounts: string[]
  recommendedActions: string[]
  acknowledged: boolean
  freshness: DataFreshness
}

export interface StrategyAssemblySummary {
  id: string
  code: string
  title: string
  version: string
  status: string
  thesis: string
  archetype: string
  targetSegments: string[]
  territories: string[]
  offer: string
  valueProposition: string
  pricingPosture: string
  confidence: number
  assumptionsOpen: number
  risksHigh: number
  evidenceCount: number
  fallbacks: number
  stopConditions: number
  provider: string
  model: string
  promptVersion: string
  approved: boolean
  recommended: boolean
  sourceObjectiveId?: string
  freshness: DataFreshness
}

export interface CouncilSummary {
  runId: string
  strategyId: string
  classification: string
  readyForExecutiveReview: boolean
  reviewCount: number
  completedAgents: number
  criticalFindings: number
  blockingFindings: number
  contradictions: number
  disagreements: number
  redTeamAttacks: number
  survivedAttacks: number
  optimizedVersion?: string
  scores: {
    evidence: number
    opportunity: number
    feasibility: number
    execution: number
    capacity: number
    profitability: number
    risk: number
    confidence: number
  }
  topFindings: string[]
  unresolvedAssumptions: string[]
  auditStatus: string
  freshness: DataFreshness
}

export interface RevenueProgramSummary {
  id: string
  code: string
  title: string
  status: string
  revenuePlay: string
  targetRevenue: number
  forecastRevenue: number
  pipelineContribution: number
  marginTarget: number
  progressPercent: number
  activeCampaigns: number
  activeWaves: number
  accounts: number
  missions: number
  tasksOpen: number
  tasksBlocked: number
  capacityUtilization: number
  owner: string
  territories: string[]
  nextMilestone?: string
  stopConditionTriggered: boolean
  sourceStrategyId: string
  freshness: DataFreshness
}

export interface CommandRunSummary {
  id: string
  kind: 'gemini' | 'council' | 'approval' | 'compilation' | 'propagation' | 'adapter' | 'scan' | 'webhook' | 'schedule'
  title: string
  status: string
  startedAt?: string
  completedAt?: string
  scheduledAt?: string
  durationMs?: number
  sourceId?: string
  owner?: string
  attempts: number
  lastError?: string
  nextAction?: string
  externalAction: boolean
  freshness: DataFreshness
}

export interface CampaignWaveSummary {
  id: string
  campaignId: string
  campaignTitle: string
  waveCode: string
  waveNumber: number
  status: string
  territory: string
  segment: string
  offer: string
  accountCount: number
  contacted: number
  positiveReplies: number
  meetings: number
  proposals: number
  conversions: number
  stoppedAccounts: number
  rescuedAccounts: number
  conversionRate: number
  capacityReserved: number
  owner: string
  startAt?: string
  endAt?: string
  sourceProgramId?: string
  freshness: DataFreshness
}

export interface CompilerStatusSummary {
  eligibleStrategies: number
  compiling: number
  compiled: number
  readyForPropagation: number
  blockedByCapacity: number
  blockedByAssignment: number
  blockingConflicts: number
  superseded: number
  rolledBack: number
  latestRunId?: string
  latestVersion?: number
  generatedObjects: number
  freshness: DataFreshness
}

export interface ExecutionProgressSummary {
  prepared: number
  awaitingApproval: number
  queued: number
  executing: number
  succeeded: number
  failed: number
  retries: number
  deadLetters: number
  rolledBack: number
  compensated: number
  externalActionsExecuted: number
  adapterHealth: Record<string, string>
  deliveryStates: Record<string, number>
  executionMode: CockpitExecutionMode
  freshness: DataFreshness
}

export interface RevenueException {
  id: string
  code: string
  exceptionType: string
  title: string
  summary: string
  priority: CockpitPriority
  severity: CockpitSeverity
  status: InterventionStatus
  businessImpact: string
  revenueAtRisk: number
  rootCause: string
  affectedEntityType: string
  affectedEntityId?: string
  affectedEntityLabel?: string
  evidence: string[]
  recommendedAction: string
  allowedActions: string[]
  ownerId?: string
  ownerLabel?: string
  dueAt?: string
  escalationRole?: string
  sourceZone: CockpitZoneKey
  sourceRecordId?: string
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
  freshness: DataFreshness
}

export interface ExperimentSummary {
  id: string
  title: string
  dimension: 'message' | 'channel' | 'offer' | 'territory' | 'segment' | 'timing' | 'command-family'
  status: string
  baselineLabel: string
  challengerLabel: string
  baselineMetric: number
  challengerMetric: number
  liftPercent: number
  sampleSize: number
  confidence: number
  winningVariant?: string
  sourceProgramId?: string
  evidenceStatus: string
  freshness: DataFreshness
}

export interface LearningMemorySummary {
  id: string
  title: string
  memoryType: 'winning-play' | 'failure-pattern' | 'objection' | 'pricing-outcome' | 'rescue-outcome' | 'delivery-outcome' | 'executive-decision'
  segment?: string
  territory?: string
  outcome: string
  confidence: number
  evidenceCount: number
  reusable: boolean
  sourceObjectIds: string[]
  lastObservedAt?: string
  freshness: DataFreshness
}

export interface ApprovalGovernanceSummary {
  id: string
  approvalType: string
  title: string
  status: string
  strategyId?: string
  actionId?: string
  requiredRole: string
  requestedBy: string
  requestedAt: string
  expiresAt?: string
  reversible: boolean
  businessConsequence: string
  rejectConsequence: string
  conditions: string[]
  freshness: DataFreshness
}

export interface CockpitTimelineEvent {
  id: string
  eventType: string
  title: string
  summary: string
  occurredAt: string
  sourceZone: CockpitZoneKey
  sourceId?: string
  actor?: string
  consequence?: string
  severity: CockpitSeverity
}

export interface ExecutiveBrief {
  id: string
  version: number
  title: string
  generatedAt: string
  objectiveStatement: string
  currentPosition: string
  forecastStatement: string
  materialChanges: string[]
  criticalRisks: string[]
  approvalsRequired: string[]
  immediateDecision: string
  nextMilestones: string[]
  recommendedExecutiveAction: string
  sourceReferences: Array<{ type: string; id: string; label: string }>
  provider: 'deterministic' | 'gemini-assisted'
  traceable: true
}

export interface CockpitWatchlist {
  id: string
  name: string
  objectTypes: string[]
  objectIds: string[]
  filters: Record<string, unknown>
  createdBy: string
  createdAt: string
}

export interface CockpitIntervention {
  id: string
  tenantId: string
  exceptionId: string
  status: InterventionStatus
  actionType: string
  reason: string
  assignedTo?: string
  assignedRole?: string
  deadline?: string
  evidence: string[]
  sourceZone: CockpitZoneKey
  sourceObjectId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  outcome?: string
}

export interface CockpitZoneHealth {
  zone: CockpitZoneKey
  status: 'healthy' | 'degraded' | 'empty' | 'blocked' | 'stale'
  records: number
  criticalItems: number
  freshness: DataFreshness
  message: string
}

export interface CockpitDashboard {
  generatedAt: string
  tenantId: string
  roleView: CockpitRoleView
  executionMode: CockpitExecutionMode
  objective: ObjectiveCommandSummary | null
  signals: LiveSignalSummary[]
  strategies: StrategyAssemblySummary[]
  council: CouncilSummary | null
  programs: RevenueProgramSummary[]
  runs: CommandRunSummary[]
  waves: CampaignWaveSummary[]
  compiler: CompilerStatusSummary
  execution: ExecutionProgressSummary
  exceptions: RevenueException[]
  experiments: ExperimentSummary[]
  learning: LearningMemorySummary[]
  approvals: ApprovalGovernanceSummary[]
  timeline: CockpitTimelineEvent[]
  executiveBrief: ExecutiveBrief
  zoneHealth: CockpitZoneHealth[]
  counts: {
    revenueAtRisk: number
    approvalsRequired: number
    criticalExceptions: number
    activePrograms: number
    activeCampaigns: number
    activeWaves: number
    openMissions: number
    externalActionsExecuted: number
  }
}

export interface AcknowledgeInput {
  tenantId: string
  actor: CockpitActor
  exceptionId: string
  note?: string
  idempotencyKey: string
}

export interface InterventionInput {
  tenantId: string
  actor: CockpitActor
  exceptionId: string
  actionType: string
  reason: string
  assignedTo?: string
  assignedRole?: string
  deadline?: string
  evidence?: string[]
  idempotencyKey: string
}

export interface ResolveExceptionInput {
  tenantId: string
  actor: CockpitActor
  exceptionId: string
  resolution: string
  evidence: string[]
  idempotencyKey: string
}
