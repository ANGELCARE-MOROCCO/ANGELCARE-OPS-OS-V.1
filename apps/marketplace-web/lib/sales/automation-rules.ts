import type { SalesAutomationRule } from '@/types/sales/automation'

export const defaultSalesAutomationRules: SalesAutomationRule[] = [
  {
    id: 'rule-payment-promise-sla',
    name: 'Payment Promise SLA Guard',
    description: 'Creates an urgent queue item when a payment promise is near breach or overdue.',
    trigger: 'payment_promise_due_soon',
    action: 'create_urgent_followup',
    ownerRole: 'sales_agent',
    status: 'active',
  },
  {
    id: 'rule-discount-escalation',
    name: 'Discount Escalation Control',
    description: 'Blocks unsafe discounts and routes them to sales manager or CEO control.',
    trigger: 'discount_above_threshold',
    action: 'request_manager_approval',
    ownerRole: 'sales_manager',
    status: 'active',
  },
  {
    id: 'rule-closing-stall',
    name: 'Closing Stall Detector',
    description: 'Detects stalled deals in negotiation, proposal, or payment pending states.',
    trigger: 'deal_stage_age_exceeded',
    action: 'recommend_next_best_action',
    ownerRole: 'sales_manager',
    status: 'active',
  },
  {
    id: 'rule-handoff-readiness',
    name: 'Fulfillment Readiness Gate',
    description: 'Prevents fragile handoffs when activation, payment, contract, or client details are incomplete.',
    trigger: 'handoff_attempted_with_missing_data',
    action: 'block_handoff_and_create_fix_queue',
    ownerRole: 'closing_owner',
    status: 'active',
  },
  {
    id: 'rule-lost-deal-autopsy',
    name: 'Lost Deal Autopsy Trigger',
    description: 'Forces structured diagnosis when a high-value or hot lead is lost.',
    trigger: 'deal_lost_high_value',
    action: 'open_lost_deal_autopsy',
    ownerRole: 'sales_manager',
    status: 'active',
  },
]

export function evaluateAutomationRule(input: {
  type: string
  value?: number
  stageAgeHours?: number
  hasPaymentProof?: boolean
  hasContract?: boolean
}) {
  if (input.type === 'discount' && Number(input.value || 0) > 20) return 'request_manager_approval'
  if (input.type === 'payment' && input.hasPaymentProof === false) return 'create_urgent_followup'
  if (input.type === 'stage' && Number(input.stageAgeHours || 0) > 48) return 'recommend_next_best_action'
  if (input.type === 'handoff' && (!input.hasPaymentProof || !input.hasContract)) return 'block_handoff_and_create_fix_queue'
  return 'no_action'
}
