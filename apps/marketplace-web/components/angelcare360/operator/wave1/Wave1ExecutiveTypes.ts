export type Wave1Tone = 'success' | 'info' | 'warning' | 'critical' | 'neutral'
export type Wave1Lens = 'executive' | 'financial' | 'service' | 'retention' | 'activation' | 'governance'

export type Wave1SourceState = {
  key: string
  table: string
  available: boolean
  count: number
  error?: string
}

export type Wave1Signal = {
  id: string
  label: string
  value: string
  detail: string
  tone: Wave1Tone
  href?: string
  evidenceLabel?: string
}

export type Wave1HealthFactor = {
  key: string
  label: string
  state: 'healthy' | 'watch' | 'critical' | 'unknown'
  value: string
  explanation: string
  source: string
  href: string
}

export type Wave1Customer = {
  id: string
  name: string
  code: string
  city: string
  status: string
  lifecycle: string
  risk: string
  healthBand: 'healthy' | 'watch' | 'critical' | 'unknown'
  healthLabel: string
  mrrDh: number
  balanceDh: number
  overdueInvoices: number
  openTickets: number
  urgentTickets: number
  openIncidents: number
  blockedActivation: number
  tenantCount: number
  renewalDate?: string | null
  renewalProbability?: number | null
  renewalValueDh: number
  lastAccessAt?: string | null
  owner: string
  factors: Wave1HealthFactor[]
  href: string
}

export type Wave1RevenueStage = {
  key: string
  label: string
  valueDh: number
  count: number
  tone: Wave1Tone
  description: string
  href: string
}

export type Wave1Decision = {
  id: string
  kind: 'finance' | 'service' | 'retention' | 'activation' | 'governance'
  title: string
  entityLabel: string
  customerId?: string | null
  customerName: string
  situation: string
  recommendation: string
  alternative: string
  financialImpactDh: number
  operationalImpact: string
  riskOfNoAction: string
  authority: string
  deadline?: string | null
  owner: string
  evidence: Array<{ label: string; value: string; href: string }>
  executionHref: string
  tone: Wave1Tone
}

export type Wave1HorizonItem = {
  id: string
  category: 'renewal' | 'billing' | 'contract' | 'activation' | 'capacity' | 'service' | 'commitment'
  title: string
  customerName: string
  date: string
  daysRemaining: number
  valueDh: number
  risk: Wave1Tone
  owner: string
  readiness: string
  href: string
}

export type Wave1AccountabilityItem = {
  id: string
  title: string
  customerName: string
  objectType: 'commitment' | 'activation' | 'service' | 'decision'
  owner: string
  sponsor: string
  dueDate?: string | null
  state: string
  progress: number
  priority: string
  evidenceState: 'present' | 'missing' | 'not_required'
  impact: string
  href: string
}

export type Wave1ServicePressure = {
  id: string
  type: 'ticket' | 'incident' | 'activation' | 'request'
  title: string
  customerName: string
  severity: Wave1Tone
  durationLabel: string
  owner: string
  impact: string
  financialExposureDh: number
  href: string
}

export type Wave1AuditEvent = {
  id: string
  title: string
  detail: string
  timestamp: string
  tone: Wave1Tone
  href: string
}

export type Wave1ExecutiveData = {
  generatedAt: string
  periodLabel: string
  sourceHealth: {
    state: 'complete' | 'partial' | 'unavailable'
    availableSources: number
    totalSources: number
    failures: Wave1SourceState[]
    sources: Wave1SourceState[]
  }
  summary: {
    totalClients: number
    activeClients: number
    activeTenants: number
    activeSubscriptions: number
    mrrDh: number
    arrDh: number
    invoicedPeriodDh: number
    collectedPeriodDh: number
    outstandingDh: number
    overdueDh: number
    renewalRiskDh: number
    expansionPotentialDh: number
    criticalServiceCount: number
    executiveDecisionCount: number
  }
  signals: Wave1Signal[]
  customers: Wave1Customer[]
  revenueStages: Wave1RevenueStage[]
  decisions: Wave1Decision[]
  horizon: Wave1HorizonItem[]
  accountability: Wave1AccountabilityItem[]
  servicePressure: Wave1ServicePressure[]
  auditEvents: Wave1AuditEvent[]
  narrative: {
    headline: string
    body: string
    evidence: Array<{ label: string; href: string }>
  }
}
