import type { SovereignTowerKey } from '@/data/angelcare360/operator-sovereign-navigation'

export type SovereignSourceState = 'complete' | 'partial' | 'unavailable'

export type SovereignSourceReport = {
  key: string
  label: string
  state: SovereignSourceState
  count: number
  message?: string | null
}

export type SovereignMetric = {
  key: string
  label: string
  value: string
  detail: string
  tone?: 'neutral' | 'good' | 'warning' | 'critical'
}

export type SovereignEntityKind =
  | 'client'
  | 'tenant'
  | 'subscription'
  | 'billing-account'
  | 'invoice'
  | 'payment'
  | 'contract'
  | 'renewal'
  | 'ticket'
  | 'incident'
  | 'onboarding'
  | 'task'
  | 'service-request'
  | 'note'
  | 'dunning'
  | 'feature'
  | 'limit'
  | 'plan'
  | 'package'
  | 'audit'

export type SovereignEntity = {
  id: string
  kind: SovereignEntityKind
  title: string
  subtitle?: string | null
  status?: string | null
  clientId?: string | null
  tenantId?: string | null
  href?: string | null
  fields: Array<{ label: string; value: string }>
  raw: Record<string, unknown>
}

export type SovereignWorkspaceSnapshot = {
  tower: SovereignTowerKey
  generatedAt: string
  sourceState: SovereignSourceState
  sources: SovereignSourceReport[]
  metrics: SovereignMetric[]
  entities: SovereignEntity[]
  relationships: Record<string, string[]>
  labels: {
    clients: Record<string, string>
    tenants: Record<string, string>
    subscriptions: Record<string, string>
    invoices: Record<string, string>
  }
}
