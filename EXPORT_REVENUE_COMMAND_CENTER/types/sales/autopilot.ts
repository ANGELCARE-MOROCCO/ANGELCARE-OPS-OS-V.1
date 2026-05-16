export type AutopilotMode = 'manual' | 'suggest_only' | 'approval_required' | 'auto_execute_safe'

export type AutopilotActionType =
  | 'CALL_CLIENT'
  | 'SEND_WHATSAPP_FOLLOWUP'
  | 'SEND_PAYMENT_REMINDER'
  | 'REQUEST_MANAGER_APPROVAL'
  | 'ESCALATE_TO_CEO'
  | 'CREATE_CLOSING_TASK'
  | 'TRIGGER_HANDOFF_REVIEW'

export interface SalesAutopilotSignal {
  id: string
  dealId: string
  signal: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendedAction: AutopilotActionType
  requiresApproval: boolean
  reason: string
}

export interface SalesAutopilotRule {
  id: string
  name: string
  trigger: string
  action: AutopilotActionType
  mode: AutopilotMode
  enabled: boolean
}
