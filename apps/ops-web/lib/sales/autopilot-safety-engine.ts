import type { AutopilotActionRisk, AutopilotActionStatus } from '@/types/sales/autopilot-safety'

export function classifyAutopilotRisk(action: {
  actionType: string
  discountPercent?: number
  paymentStatus?: string
  contractStatus?: string
  clientSensitivity?: 'normal' | 'sensitive' | 'vip'
}): AutopilotActionRisk {
  if (action.clientSensitivity === 'vip') return 'critical'
  if ((action.discountPercent ?? 0) > 15) return 'high'
  if (action.actionType.includes('contract') && action.contractStatus !== 'ready') return 'high'
  if (action.paymentStatus === 'late') return 'medium'
  return 'low'
}

export function resolveAutopilotStatus(risk: AutopilotActionRisk): AutopilotActionStatus {
  if (risk === 'critical' || risk === 'high') return 'needs_approval'
  return 'queued'
}

export function canExecuteAutopilotAction(status: AutopilotActionStatus): boolean {
  return status === 'approved' || status === 'queued'
}
