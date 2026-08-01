export type ExecutiveSceneKey =
  | 'command'
  | 'decisions'
  | 'agenda'
  | 'performance'
  | 'growth'
  | 'risk'
  | 'transformation'
  | 'board'

export type ExecutiveTone = 'good' | 'info' | 'warning' | 'critical' | 'neutral'
export type ExecutiveSourceState = 'live' | 'partial' | 'unavailable'
export type ExecutiveEntityType = 'priority' | 'decision' | 'agenda' | 'objective' | 'initiative' | 'risk' | 'board_session' | 'paper' | 'mandate'

export interface ExecutiveSourceReport {
  key: string
  label: string
  state: ExecutiveSourceState
  count: number
  updatedAt: string
  message?: string | null
}

export interface ExecutiveMetric {
  key: string
  label: string
  value: string
  detail: string
  delta?: string
  tone: ExecutiveTone
  href?: string
}

export interface ExecutivePriority {
  id: string
  priorityCode: string
  title: string
  summary: string
  status: string
  priority: string
  authorityLevel: string
  ownerName: string
  sponsorName?: string | null
  dueAt?: string | null
  impact: string
  evidenceState: string
  sourceType?: string | null
  sourceId?: string | null
  nextAction?: string | null
  tone: ExecutiveTone
  href?: string
  createdAt: string
  updatedAt: string
}

export interface ExecutiveDecision {
  id: string
  decisionCode: string
  title: string
  statement: string
  status: string
  decisionType: string
  authorityLevel: string
  ownerName: string
  sponsorName?: string | null
  dueAt?: string | null
  financialImpactMad: number
  customerImpact: string
  riskLevel: string
  evidenceState: string
  conditions: string[]
  outcome?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutiveAgendaStream {
  id: string
  streamCode: string
  title: string
  strategicPillar: string
  horizon: string
  status: string
  executiveSponsor: string
  ownerName: string
  objective: string
  progress: number
  confidence: number
  dueAt?: string | null
  dependencies: string[]
  pressure: string
  expectedOutcome: string
  createdAt: string
  updatedAt: string
}

export interface ExecutiveObjective {
  id: string
  objectiveCode: string
  title: string
  domain: string
  status: string
  ownerName: string
  targetValue: number
  actualValue: number
  unit: string
  confidence: number
  trend: 'up' | 'down' | 'stable'
  dueAt?: string | null
  evidenceState: string
  correctiveAction?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutiveInitiative {
  id: string
  initiativeCode: string
  title: string
  programType: string
  status: string
  sponsorName: string
  ownerName: string
  progress: number
  confidence: number
  expectedValue: string
  currentMilestone: string
  nextMilestone?: string | null
  dueAt?: string | null
  dependencies: string[]
  blockers: string[]
  createdAt: string
  updatedAt: string
}

export interface ExecutiveRisk {
  id: string
  riskCode: string
  title: string
  domain: string
  status: string
  likelihood: number
  impact: number
  exposure: number
  ownerName: string
  sponsorName?: string | null
  earlySignals: string[]
  planA: string
  planB?: string | null
  planC?: string | null
  escalationThreshold: string
  currentResponse?: string | null
  nextReviewAt?: string | null
  tone: ExecutiveTone
  createdAt: string
  updatedAt: string
}

export interface ExecutiveBoardSession {
  id: string
  sessionCode: string
  title: string
  sessionType: string
  status: string
  scheduledAt?: string | null
  chairName: string
  secretaryName?: string | null
  agendaCount: number
  resolutionCount: number
  openCommitments: number
  evidenceState: string
  createdAt: string
  updatedAt: string
}

export interface ExecutivePaper {
  id: string
  paperCode: string
  title: string
  paperType: string
  status: string
  audience: string
  ownerName: string
  approvalState: string
  dueAt?: string | null
  versionNumber: number
  confidentiality: string
  createdAt: string
  updatedAt: string
}

export interface ExecutiveMandate {
  id: string
  mandateCode: string
  title: string
  status: string
  ownerName: string
  sponsorName?: string | null
  dueAt?: string | null
  progress: number
  expectedOutcome: string
  outcomeState?: string | null
  sourceType?: string | null
  sourceId?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutiveSignal {
  id: string
  domain: string
  title: string
  summary: string
  context: string
  occurredAt: string
  tone: ExecutiveTone
  href?: string
}

export interface ExecutiveGrowthLever {
  key: string
  label: string
  value: string
  detail: string
  pressure: number
  tone: ExecutiveTone
  href: string
}

export interface ExecutiveSnapshot {
  generatedAt: string
  sourceState: ExecutiveSourceState
  sources: ExecutiveSourceReport[]
  metrics: ExecutiveMetric[]
  priorities: ExecutivePriority[]
  decisions: ExecutiveDecision[]
  agenda: ExecutiveAgendaStream[]
  objectives: ExecutiveObjective[]
  initiatives: ExecutiveInitiative[]
  risks: ExecutiveRisk[]
  boardSessions: ExecutiveBoardSession[]
  papers: ExecutivePaper[]
  mandates: ExecutiveMandate[]
  signals: ExecutiveSignal[]
  growthLevers: ExecutiveGrowthLever[]
  authorityQueue: number
  criticalRiskCount: number
  strategicHealth: number
  executionConfidence: number
  companyPulse: {
    revenue: number
    customers: number
    tenants: number
    service: number
    platform: number
    people: number
  }
}
