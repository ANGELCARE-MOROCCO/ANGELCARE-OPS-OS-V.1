import type { SalesAutopilotSignal, AutopilotActionType } from '@/types/sales/autopilot'

type DealInput = {
  id: string
  stage?: string
  value?: number
  days_in_stage?: number
  payment_due_date?: string | null
  discount_percent?: number
  last_contact_hours?: number
  risk_score?: number
}

function buildSignal(
  deal: DealInput,
  signal: string,
  severity: SalesAutopilotSignal['severity'],
  recommendedAction: AutopilotActionType,
  requiresApproval: boolean,
  reason: string
): SalesAutopilotSignal {
  return {
    id: `${deal.id}-${signal}`,
    dealId: deal.id,
    signal,
    severity,
    recommendedAction,
    requiresApproval,
    reason,
  }
}

export function evaluateSalesAutopilot(deal: DealInput): SalesAutopilotSignal[] {
  const signals: SalesAutopilotSignal[] = []

  if ((deal.days_in_stage ?? 0) >= 3 && deal.stage === 'negotiation') {
    signals.push(buildSignal(deal, 'NEGOTIATION_STALLED', 'high', 'CREATE_CLOSING_TASK', false, 'Deal is stuck in negotiation and needs a closing push.'))
  }

  if ((deal.last_contact_hours ?? 0) >= 24) {
    signals.push(buildSignal(deal, 'FOLLOWUP_OVERDUE', 'medium', 'SEND_WHATSAPP_FOLLOWUP', false, 'Client has not been touched within the expected follow-up window.'))
  }

  if (deal.stage === 'payment_pending') {
    signals.push(buildSignal(deal, 'PAYMENT_PENDING', 'critical', 'SEND_PAYMENT_REMINDER', false, 'Payment is the blocker before activation.'))
  }

  if ((deal.discount_percent ?? 0) > 15) {
    signals.push(buildSignal(deal, 'DISCOUNT_APPROVAL_REQUIRED', 'high', 'REQUEST_MANAGER_APPROVAL', true, 'Discount exceeds safe sales governance threshold.'))
  }

  if ((deal.risk_score ?? 0) >= 80 || (deal.value ?? 0) >= 50000) {
    signals.push(buildSignal(deal, 'EXECUTIVE_ATTENTION', 'critical', 'ESCALATE_TO_CEO', true, 'High-value or high-risk deal requires command-level visibility.'))
  }

  return signals
}

export function canAutoExecute(action: AutopilotActionType) {
  return ['SEND_WHATSAPP_FOLLOWUP', 'SEND_PAYMENT_REMINDER', 'CREATE_CLOSING_TASK'].includes(action)
}
