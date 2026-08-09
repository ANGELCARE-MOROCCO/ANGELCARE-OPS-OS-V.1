import type { ClosingAction, ClosingDealSnapshot, PaymentPromise } from '@/types/sales/closing'

export function getNextBestClosingActions(deal: ClosingDealSnapshot, promises: PaymentPromise[]): ClosingAction[] {
  const latePromise = promises.find((promise) => promise.status === 'late')

  if (latePromise) {
    return [
      {
        id: 'recover-late-payment',
        type: 'call_client',
        title: 'Recover late payment now',
        description: `Call client and recover ${latePromise.amountMad.toLocaleString()} MAD payment promise. Confirm new deadline or escalate.`,
        priority: 'critical',
        dueLabel: 'Immediate',
      },
    ]
  }

  if (deal.stage === 'negotiation') {
    return [
      {
        id: 'send-revised-quote',
        type: 'send_revised_quote',
        title: 'Send revised quote with closing condition',
        description: 'Send final offer with exact validity, activation condition, and payment deadline.',
        priority: 'high',
        dueLabel: 'Today',
      },
      {
        id: 'handle-objection',
        type: 'send_whatsapp',
        title: 'Send objection response',
        description: 'Use approved script to remove the strongest objection and push toward verbal agreement.',
        priority: 'high',
        dueLabel: 'Today',
      },
    ]
  }

  if (deal.stage === 'payment_pending') {
    return [
      {
        id: 'confirm-payment',
        type: 'confirm_payment',
        title: 'Confirm payment execution',
        description: 'Ask for transfer proof, cash collection confirmation, or payment link completion.',
        priority: 'critical',
        dueLabel: 'Immediate',
      },
    ]
  }

  if (deal.stage === 'contract_signed') {
    return [
      {
        id: 'activate-service',
        type: 'activate_service',
        title: 'Activate service and prepare handoff',
        description: 'Create activation event and push fulfillment readiness checklist.',
        priority: 'high',
        dueLabel: 'Today',
      },
    ]
  }

  return [
    {
      id: 'call-client',
      type: 'call_client',
      title: 'Call client and advance one stage',
      description: 'Use the current sales script, validate the blocker, and move the deal forward.',
      priority: deal.risk,
      dueLabel: 'Today',
    },
  ]
}
