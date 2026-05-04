import type { ClosingChecklistItem, ClosingDealSnapshot, ClosingStage } from '@/types/sales/closing'

export const CLOSING_STAGE_ORDER: ClosingStage[] = [
  'qualification',
  'proposal_sent',
  'negotiation',
  'verbal_agreement',
  'payment_pending',
  'payment_confirmed',
  'contract_signed',
  'activated',
  'handed_off',
]

export function getClosingStageProgress(stage: ClosingStage): number {
  const index = CLOSING_STAGE_ORDER.indexOf(stage)
  if (index < 0) return 0
  return Math.round(((index + 1) / CLOSING_STAGE_ORDER.length) * 100)
}

export function getNextClosingStage(stage: ClosingStage): ClosingStage {
  const index = CLOSING_STAGE_ORDER.indexOf(stage)
  if (index < 0 || index === CLOSING_STAGE_ORDER.length - 1) return stage
  return CLOSING_STAGE_ORDER[index + 1]
}

export function canAdvanceClosing(checklist: ClosingChecklistItem[]): boolean {
  return checklist.filter((item) => item.blocking).every((item) => item.completed)
}

export function calculateClosingScore(deal: ClosingDealSnapshot, checklist: ClosingChecklistItem[]): number {
  const stageProgress = getClosingStageProgress(deal.stage)
  const checklistProgress = checklist.length
    ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)
    : 0
  const riskPenalty = deal.risk === 'critical' ? 30 : deal.risk === 'high' ? 20 : deal.risk === 'medium' ? 10 : 0
  return Math.max(0, Math.min(100, Math.round((stageProgress * 0.35) + (deal.probability * 0.35) + (checklistProgress * 0.3) - riskPenalty)))
}

export function buildDefaultClosingChecklist(): ClosingChecklistItem[] {
  return [
    { id: 'client_validated', label: 'Client validated', description: 'Confirm name, phone, decision-maker, need, location, and urgency.', completed: true, blocking: true },
    { id: 'service_matched', label: 'Service matched', description: 'Service/package must match the client need and operational feasibility.', completed: true, blocking: true },
    { id: 'pricing_approved', label: 'Pricing approved', description: 'Price, discount, payment terms, and margin rules are checked.', completed: false, blocking: true },
    { id: 'payment_confirmed', label: 'Payment confirmed', description: 'Payment received or promise tracked with exact date and amount.', completed: false, blocking: true },
    { id: 'contract_ready', label: 'Contract ready', description: 'Contract, invoice, and required documents are ready for activation.', completed: false, blocking: false },
    { id: 'ops_feasibility', label: 'Ops feasibility checked', description: 'Fulfillment capacity and handoff owner are confirmed.', completed: false, blocking: true },
  ]
}
