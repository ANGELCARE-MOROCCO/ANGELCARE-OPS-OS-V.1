export type Angelcare360FoundationDomain = 'direction' | 'governance' | 'people' | 'admissions'
export type Angelcare360FoundationSeverity = 'critical' | 'warning' | 'info' | 'healthy'

export interface Angelcare360FoundationPlane {
  key: string
  label: string
  description: string
  href: string
  permission?: string
  entitlementKey?: string
}

export interface Angelcare360FoundationSignal {
  id: string
  domain: Angelcare360FoundationDomain
  title: string
  detail: string
  severity: Angelcare360FoundationSeverity
  href?: string | null
  dueAt?: string | null
  ownerLabel?: string | null
  valueLabel?: string | null
}

export interface Angelcare360FoundationSignals {
  decisions: Angelcare360FoundationSignal[]
  duplicateCases: Angelcare360FoundationSignal[]
  readiness: Angelcare360FoundationSignal[]
  conversions: Angelcare360FoundationSignal[]
  warnings: string[]
}

export interface Angelcare360ManagementDecisionInput {
  title: string
  detail?: string | null
  domain: Angelcare360FoundationDomain
  severity?: Angelcare360FoundationSeverity
  dueAt?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  ownerUserId?: string | null
}
