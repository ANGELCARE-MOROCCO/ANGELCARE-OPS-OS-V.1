export type SalesPerformanceBand = 'elite' | 'strong' | 'unstable' | 'critical'

export interface SalesAgentScorecard {
  agentId: string
  agentName: string
  dealsTouched: number
  closedDeals: number
  conversionRate: number
  followupDiscipline: number
  averageResponseMinutes: number
  revenueProtected: number
  band: SalesPerformanceBand
  coachingSignal: string
}

export interface SalesPipelineHealthSignal {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  diagnosis: string
  action: string
}
