export type SalesAutomationStatus = 'active' | 'paused' | 'draft'
export type SalesAutomationPriority = 'low' | 'medium' | 'high' | 'urgent'
export type SalesAutomationSeverity = 'medium' | 'high' | 'critical'

export interface SalesAutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  ownerRole: string
  status: SalesAutomationStatus
}

export interface SalesAutomationQueueItem {
  id: string
  dealRef: string
  title: string
  requiredAction: string
  owner: string
  priority: SalesAutomationPriority
  status: 'open' | 'blocked' | 'done'
  sla: string
}

export interface SalesAutomationAlert {
  id: string
  title: string
  severity: SalesAutomationSeverity
  message: string
  recommendedAction: string
}
