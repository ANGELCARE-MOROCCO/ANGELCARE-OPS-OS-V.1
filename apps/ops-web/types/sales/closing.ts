export type ClosingStage =
  | 'qualification'
  | 'proposal_sent'
  | 'negotiation'
  | 'verbal_agreement'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'contract_signed'
  | 'activated'
  | 'handed_off'

export type ClosingRisk = 'low' | 'medium' | 'high' | 'critical'

export type ClosingActionType =
  | 'call_client'
  | 'send_whatsapp'
  | 'send_revised_quote'
  | 'request_discount_approval'
  | 'confirm_payment'
  | 'prepare_contract'
  | 'activate_service'
  | 'handoff_to_ops'
  | 'escalate_to_manager'

export interface ClosingDealSnapshot {
  id: string
  clientName: string
  serviceName: string
  stage: ClosingStage
  amountMad: number
  probability: number
  risk: ClosingRisk
  ownerName: string
  lastAction: string
  nextAction: string
}

export interface ClosingChecklistItem {
  id: string
  label: string
  description: string
  completed: boolean
  blocking: boolean
}

export interface ClosingObjection {
  id: string
  title: string
  category: string
  severity: ClosingRisk
  recommendedResponse: string
  recommendedAction: ClosingActionType
}

export interface PaymentPromise {
  id: string
  amountMad: number
  dueDate: string
  status: 'promised' | 'late' | 'paid' | 'cancelled'
  pressureLevel: ClosingRisk
}

export interface ClosingAction {
  id: string
  type: ClosingActionType
  title: string
  description: string
  priority: ClosingRisk
  dueLabel: string
}
