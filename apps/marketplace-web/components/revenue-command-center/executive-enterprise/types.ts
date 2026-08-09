export type ExecutiveExperience =
  | "executive-overview"
  | "control-tower"
  | "executive-briefing"
  | "forecast-command"
  | "strategy-room"
  | "revenue-analytics"
  | "team-intelligence"
  | "overdue-heatmap"
  | "workload-command"
  | "management-decision-room"

export type ExecutiveTone = "navy" | "blue" | "cyan" | "green" | "amber" | "red" | "violet"

export type ExecutiveMetric = {
  key: string
  label: string
  value: number
  formatted?: string
  detail?: string
  delta?: number
  tone?: ExecutiveTone
  source?: string
}

export type ExecutiveRecord = {
  id: string
  title: string
  subtitle?: string
  status?: string
  owner?: string
  amountMad?: number
  probability?: number
  dueAt?: string | null
  severity?: string
  sourceType?: string
  sourceId?: string
  evidence?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type ExecutiveForecastLine = ExecutiveRecord & {
  category: string
  systemAmountMad: number
  ownerAmountMad?: number
  executiveAmountMad?: number
  expectedDate?: string | null
  confidence: number
  evidenceScore: number
  stage?: string
  lastActivityAt?: string | null
  blockers?: string[]
}

export type ExecutiveContribution = {
  source: string
  pipelineMad: number
  contractedMad: number
  confirmedMad: number
  realizedMad: number
  count: number
}

export type ExecutiveTeamRow = {
  owner: string
  pipelineMad: number
  weightedMad: number
  realizedMad: number
  openTasks: number
  overdueTasks: number
  interventions: number
  forecastAccuracy: number
  dataQualityScore: number
}

export type ExecutivePortfolio = {
  syncedAt: string
  experience: ExecutiveExperience
  schema: Record<string, boolean>
  summary: Record<string, number>
  metrics: ExecutiveMetric[]
  forecastLines: ExecutiveForecastLine[]
  interventions: ExecutiveRecord[]
  signals: ExecutiveRecord[]
  leakage: ExecutiveRecord[]
  decisions: ExecutiveRecord[]
  scenarios: ExecutiveRecord[]
  briefings: ExecutiveRecord[]
  collections: ExecutiveRecord[]
  accounts: ExecutiveRecord[]
  partners: ExecutiveRecord[]
  b2c: ExecutiveRecord[]
  campaigns: ExecutiveRecord[]
  team: ExecutiveTeamRow[]
  contributions: ExecutiveContribution[]
  dataQuality: ExecutiveRecord[]
  sourceHealth: Array<{ source: string; available: boolean; records: number; note?: string }>
}

export type ExecutiveCommand =
  | "generate-forecast-snapshot"
  | "submit-owner-forecast"
  | "override-forecast"
  | "expire-forecast-override"
  | "create-intervention"
  | "assign-intervention"
  | "escalate-intervention"
  | "request-decision"
  | "decide-intervention"
  | "record-intervention-checkpoint"
  | "close-intervention"
  | "create-scenario"
  | "run-scenario"
  | "approve-scenario"
  | "generate-briefing"
  | "approve-briefing"
  | "acknowledge-signal"
  | "dismiss-signal"
  | "create-canonical-task"
  | "request-finance-review"

export type ExecutiveCommandPayload = {
  command: ExecutiveCommand
  entityId?: string
  title?: string
  reason?: string
  evidenceReference?: string
  owner?: string
  executiveSponsor?: string
  amountMad?: number
  dueAt?: string
  decision?: string
  conditions?: string
  horizon?: string
  category?: string
  expectedDate?: string
  probability?: number
  scenarioType?: string
  assumptions?: Array<Record<string, unknown>>
  briefingType?: string
  metadata?: Record<string, unknown>
}
