export type SalesDirectorPriority = 'critical' | 'high' | 'medium' | 'low'
export type SalesDirectorSignalType =
  | 'closing_risk'
  | 'payment_delay'
  | 'discount_abuse'
  | 'followup_gap'
  | 'handoff_blocker'
  | 'upsell_opportunity'
  | 'agent_performance'

export interface SalesDirectorSignal {
  id: string
  dealId?: string
  leadId?: string
  ownerId?: string
  type: SalesDirectorSignalType
  priority: SalesDirectorPriority
  title: string
  diagnosis: string
  recommendedAction: string
  expectedImpact: string
  status: 'open' | 'accepted' | 'rejected' | 'resolved'
  createdAt: string
}

export interface SalesDirectorCommand {
  id: string
  title: string
  target: string
  instruction: string
  priority: SalesDirectorPriority
  deadlineLabel: string
}
