export type SalesQaStatus = 'clean' | 'warning' | 'critical' | 'resolved'
export type SalesQaCategory = 'script_compliance' | 'promise_accuracy' | 'discount_discipline' | 'contract_readiness' | 'handoff_quality' | 'payment_risk'

export interface SalesQualityAudit {
  id: string
  dealId: string
  agentId?: string
  category: SalesQaCategory
  score: number
  status: SalesQaStatus
  finding: string
  requiredAction: string
  createdAt: string
}

export interface SalesQaMetric {
  label: string
  value: string
  trend: string
  severity: SalesQaStatus
}
