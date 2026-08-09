import type {
  Angelcare360OperatorBillingAccountRecord,
  Angelcare360OperatorClientRecord,
  Angelcare360OperatorContractRecord,
  Angelcare360OperatorFeatureFlagRecord,
  Angelcare360OperatorIncidentRecord,
  Angelcare360OperatorInvoiceRecord,
  Angelcare360OperatorNoteRecord,
  Angelcare360OperatorPaymentRecord,
  Angelcare360OperatorPlanRecord,
  Angelcare360OperatorRenewalRecord,
  Angelcare360OperatorServiceEventRecord,
  Angelcare360OperatorSubscriptionRecord,
  Angelcare360OperatorSupportTicketRecord,
  Angelcare360OperatorTaskRecord,
  Angelcare360OperatorTenantRecord,
  Angelcare360OperatorUsageLimitRecord,
} from '@/types/angelcare360/operator'

export type Wave2Tone = 'success' | 'info' | 'warning' | 'critical' | 'neutral' | 'commercial'
export type Wave2SourceState = 'complete' | 'partial' | 'unavailable'

export type Wave2DataSource = {
  key: string
  label: string
  state: Wave2SourceState
  count: number
  detail: string
}

export type Wave2RibbonItem = {
  id: string
  label: string
  value: string
  detail: string
  tone: Wave2Tone
  evidenceIds?: string[]
  href?: string
}

export type Wave2Evidence = {
  id: string
  type: 'financial' | 'service' | 'contract' | 'usage' | 'audit' | 'relationship' | 'configuration' | 'communication'
  label: string
  title: string
  detail: string
  value?: string
  timestamp?: string | null
  status?: string
  tone: Wave2Tone
  href?: string
  source: string
  verified: boolean
}

export type Wave2Factor = {
  id: string
  label: string
  value: string
  detail: string
  tone: Wave2Tone
  evidenceIds: string[]
  movement?: 'up' | 'down' | 'stable' | 'unknown'
}

export type Wave2RelationshipNode = {
  id: string
  kind: 'customer' | 'tenant' | 'subscription' | 'billing' | 'invoice' | 'payment' | 'renewal' | 'incident' | 'ticket' | 'contract' | 'feature' | 'usage' | 'task'
  label: string
  meta: string
  status: string
  tone: Wave2Tone
  href?: string
  evidenceIds?: string[]
}

export type Wave2TimelineEvent = {
  id: string
  title: string
  detail: string
  timestamp: string
  actor: string
  tone: Wave2Tone
  evidenceIds: string[]
}

export type Wave2Action = {
  id: string
  label: string
  description: string
  tone: Wave2Tone
  href?: string
  lockedReason?: string
  decision?: Wave2Decision
}

export type Wave2Decision = {
  id: string
  title: string
  situation: string
  recommendation: string
  alternatives: string[]
  customerImpact: string
  tenantImpact: string
  financialImpactDh: number
  contractImpact: string
  reversibility: string
  authority: string
  requiredReason: string
  notifications: string[]
  auditResult: string
  followUp: string
  evidenceIds: string[]
  executionHref?: string
  tone: Wave2Tone
}

export type Wave2SimulationLine = {
  id: string
  label: string
  current: string
  proposed: string
  impact: string
  tone: Wave2Tone
  certainty: 'exact' | 'derived' | 'estimated' | 'unavailable'
}

export type Wave2Simulation = {
  id: string
  title: string
  description: string
  lines: Wave2SimulationLine[]
  financialDeltaDh: number
  affectedUsers?: number | null
  affectedSites?: number | null
  blockedCapabilities?: number | null
  evidenceIds: string[]
  warning: string
}

export type Wave2CommandBase = {
  generatedAt: string
  sourceState: Wave2SourceState
  sources: Wave2DataSource[]
  entityId: string
  entityKind: string
  title: string
  subtitle: string
  status: string
  tone: Wave2Tone
  owner: string
  sponsor: string
  financialValueDh: number
  riskLabel: string
  lastMeaningfulEvent: string
  nextDeadline: string
  primaryRecommendation: string
  ribbon: Wave2RibbonItem[]
  factors: Wave2Factor[]
  relationships: Wave2RelationshipNode[]
  evidence: Wave2Evidence[]
  timeline: Wave2TimelineEvent[]
  actions: Wave2Action[]
}

export type Wave2CustomerCommand = Wave2CommandBase & {
  kind: 'customer'
  client: Angelcare360OperatorClientRecord
  tenants: Angelcare360OperatorTenantRecord[]
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  billingAccounts: Angelcare360OperatorBillingAccountRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  payments: Angelcare360OperatorPaymentRecord[]
  contracts: Angelcare360OperatorContractRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  tickets: Angelcare360OperatorSupportTicketRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  tasks: Angelcare360OperatorTaskRecord[]
  notes: Angelcare360OperatorNoteRecord[]
  serviceEvents: Angelcare360OperatorServiceEventRecord[]
  lifecycle: Array<{ label: string; state: 'done' | 'current' | 'blocked' | 'upcoming'; detail: string }>
  healthScore: number
}

export type Wave2TenantCommand = Wave2CommandBase & {
  kind: 'tenant'
  tenant: Angelcare360OperatorTenantRecord
  client: Angelcare360OperatorClientRecord | null
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  features: Angelcare360OperatorFeatureFlagRecord[]
  usage: Angelcare360OperatorUsageLimitRecord[]
  tickets: Angelcare360OperatorSupportTicketRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  tasks: Angelcare360OperatorTaskRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  capabilitySummary: Array<{ module: string; enabled: number; restricted: number; total: number; tone: Wave2Tone }>
  suspensionSimulation: Wave2Simulation
  restorationSimulation: Wave2Simulation
}

export type Wave2SubscriptionCommand = Wave2CommandBase & {
  kind: 'subscription'
  subscription: Angelcare360OperatorSubscriptionRecord
  client: Angelcare360OperatorClientRecord | null
  tenant: Angelcare360OperatorTenantRecord | null
  plan: Angelcare360OperatorPlanRecord | null
  features: Angelcare360OperatorFeatureFlagRecord[]
  usage: Angelcare360OperatorUsageLimitRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  contracts: Angelcare360OperatorContractRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  lifecycle: Array<{ label: string; state: 'done' | 'current' | 'blocked' | 'upcoming'; detail: string }>
  simulations: Wave2Simulation[]
}

export type Wave2BillingCommand = Wave2CommandBase & {
  kind: 'billing'
  account: Angelcare360OperatorBillingAccountRecord
  client: Angelcare360OperatorClientRecord | null
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  payments: Angelcare360OperatorPaymentRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  collectionStages: Array<{ key: string; label: string; count: number; amountDh: number; tone: Wave2Tone; detail: string }>
  restrictionSimulation: Wave2Simulation
}

export type Wave2RenewalScenario = {
  id: string
  title: string
  subtitle: string
  recurringValueDh: number
  annualValueDh: number
  deltaDh: number
  featureImpact: string
  relationshipImpact: string
  approval: string
  tone: Wave2Tone
}

export type Wave2RenewalCommand = Wave2CommandBase & {
  kind: 'renewal'
  renewal: Angelcare360OperatorRenewalRecord
  client: Angelcare360OperatorClientRecord | null
  subscription: Angelcare360OperatorSubscriptionRecord | null
  tenant: Angelcare360OperatorTenantRecord | null
  plan: Angelcare360OperatorPlanRecord | null
  contracts: Angelcare360OperatorContractRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  tickets: Angelcare360OperatorSupportTicketRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  scenarios: Wave2RenewalScenario[]
  strategyFields: Array<{ label: string; value: string; detail: string; tone: Wave2Tone }>
}

export type Wave2IncidentCommand = Wave2CommandBase & {
  kind: 'incident'
  incident: Angelcare360OperatorIncidentRecord
  client: Angelcare360OperatorClientRecord | null
  tenant: Angelcare360OperatorTenantRecord | null
  tickets: Angelcare360OperatorSupportTicketRecord[]
  tasks: Angelcare360OperatorTaskRecord[]
  serviceEvents: Angelcare360OperatorServiceEventRecord[]
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  phases: Array<{ label: string; state: 'done' | 'current' | 'blocked' | 'upcoming'; detail: string }>
  closureDecision: Wave2Decision
}
