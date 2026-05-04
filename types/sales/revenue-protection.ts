export type RevenueProtectionRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type RevenueProtectionStatus =
  | 'monitoring'
  | 'needs_sales_action'
  | 'needs_manager_action'
  | 'protected'
  | 'failed'

export interface RevenueProtectionCase {
  id: string
  dealId: string
  clientName: string
  packageName: string
  amount: number
  riskLevel: RevenueProtectionRiskLevel
  status: RevenueProtectionStatus
  owner: string
  nextAction: string
  dueAt: string
  blockers: string[]
  protectionScore: number
}

export interface ProtectionChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}
