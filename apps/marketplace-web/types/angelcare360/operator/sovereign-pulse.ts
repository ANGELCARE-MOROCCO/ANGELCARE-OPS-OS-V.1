export type SovereignPulseTone = 'good' | 'info' | 'warning' | 'critical' | 'neutral'
export type SovereignPulseMode = 'desk' | 'wall'
export type SovereignPulsePrivacy = 'executive' | 'operations' | 'team_safe' | 'visitor_safe'
export type SovereignPulseSceneKey =
  | 'overview'
  | 'revenue'
  | 'customers'
  | 'tenants'
  | 'experience'
  | 'communications'
  | 'platform'
  | 'missions'

export interface SovereignPulseSourceState {
  key: string
  label: string
  state: 'live' | 'partial' | 'unavailable'
  count: number
  updatedAt: string
  message?: string | null
}

export interface SovereignPulseMetric {
  key: string
  label: string
  value: string
  numericValue: number
  deltaLabel: string
  detail: string
  tone: SovereignPulseTone
  href: string
  source: string
  updatedAt: string
}

export interface SovereignPulseTower {
  key: string
  number: string
  label: string
  shortLabel: string
  health: number
  tone: SovereignPulseTone
  primarySignal: string
  secondarySignal: string
  valueLabel: string
  href: string
}

export interface SovereignPulsePriority {
  id: string
  rank: number
  category: 'intervention' | 'decision' | 'blocker' | 'deadline' | 'opportunity' | 'delegated'
  title: string
  context: string
  impact: string
  evidence: string
  owner: string
  deadlineLabel: string
  tone: SovereignPulseTone
  href: string
  customerLabel?: string | null
  tenantLabel?: string | null
}

export interface SovereignPulseEvent {
  id: string
  occurredAt: string
  domain: 'business' | 'customer' | 'platform'
  title: string
  summary: string
  context: string
  tone: SovereignPulseTone
  href: string
}

export interface SovereignPulseRevenueStage {
  key: string
  label: string
  value: number
  displayValue: string
  target: number
  blocked: number
  atRisk: number
  conversion: number
  href: string
}

export interface SovereignPulseCustomerNode {
  id: string
  label: string
  code: string
  segment: string
  city: string
  addressLabel: string
  latitude: number
  longitude: number
  locationPrecision: 'exact' | 'city' | 'regional' | 'fallback'
  value: number
  health: number
  state: 'healthy' | 'onboarding' | 'attention' | 'intervention' | 'inactive'
  renewalDays?: number | null
  openCases: number
  href: string
}

export interface SovereignPulseTenantStage {
  key: string
  label: string
  count: number
  blocked: number
  tone: SovereignPulseTone
  href: string
}

export interface SovereignPulseExperienceSector {
  key: string
  label: string
  pressure: number
  openCount: number
  criticalCount: number
  trend: 'up' | 'down' | 'stable'
  tone: SovereignPulseTone
  href: string
}

export interface SovereignPulseEmailStage {
  key: string
  label: string
  count: number
  tone: SovereignPulseTone
  href: string
}

export interface SovereignPulsePlatformService {
  key: string
  label: string
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'
  latencyLabel: string
  freshnessLabel: string
  impact: string
  href: string
}

export interface SovereignPulseMission {
  id: string
  timeLabel: string
  title: string
  context: string
  owner: string
  readiness: number
  state: 'ready' | 'attention' | 'blocked' | 'overdue'
  href: string
}

export interface SovereignPulseCriticalEvent {
  id: string
  title: string
  summary: string
  impact: string[]
  owner: string
  currentAction: string
  startedAt: string
  severity: 'critical'
  href: string
}

export interface SovereignPulseSnapshot {
  generatedAt: string
  sourceState: 'live' | 'partial' | 'unavailable'
  globalHealth: number
  environmentLabel: string
  headline: string
  subheadline: string
  sources: SovereignPulseSourceState[]
  metrics: SovereignPulseMetric[]
  towers: SovereignPulseTower[]
  priorities: SovereignPulsePriority[]
  events: SovereignPulseEvent[]
  revenueFlow: SovereignPulseRevenueStage[]
  customerNodes: SovereignPulseCustomerNode[]
  tenantStages: SovereignPulseTenantStage[]
  experience: SovereignPulseExperienceSector[]
  emailFlow: SovereignPulseEmailStage[]
  platformServices: SovereignPulsePlatformService[]
  missions: SovereignPulseMission[]
  criticalEvent?: SovereignPulseCriticalEvent | null
  nextDecisiveEvent: string
  privacyDefault: SovereignPulsePrivacy
  rotationSeconds: number
}
