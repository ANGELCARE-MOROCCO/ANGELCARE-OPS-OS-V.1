import type { SalesDirectorPriority, SalesDirectorSignal, SalesDirectorSignalType } from '@/types/sales/ai-director'

type DealLike = {
  id: string
  lead_id?: string
  owner_id?: string
  stage?: string
  amount?: number
  discount_percent?: number
  payment_status?: string
  last_action_at?: string
  handoff_status?: string
  closing_probability?: number
}

function priority(score: number): SalesDirectorPriority {
  if (score >= 90) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function daysSince(date?: string) {
  if (!date) return 999
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return 999
  return Math.floor((Date.now() - t) / 86400000)
}

function signal(deal: DealLike, type: SalesDirectorSignalType, score: number, title: string, diagnosis: string, recommendedAction: string, expectedImpact: string): SalesDirectorSignal {
  return {
    id: `${deal.id}-${type}`,
    dealId: deal.id,
    leadId: deal.lead_id,
    ownerId: deal.owner_id,
    type,
    priority: priority(score),
    title,
    diagnosis,
    recommendedAction,
    expectedImpact,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
}

export function evaluateSalesDirectorSignals(deals: DealLike[]): SalesDirectorSignal[] {
  const output: SalesDirectorSignal[] = []

  for (const deal of deals) {
    const inactivityDays = daysSince(deal.last_action_at)
    const probability = deal.closing_probability ?? 0
    const discount = deal.discount_percent ?? 0

    if (probability >= 65 && deal.payment_status !== 'paid' && inactivityDays >= 1) {
      output.push(signal(
        deal,
        'payment_delay',
        85,
        'Payment pressure required',
        'The deal is close to won but payment is not secured yet. Delay can create emotional cooling and loss risk.',
        'Trigger a same-day payment confirmation call and send one short payment instruction message.',
        'Improves close probability and reduces verbal-agreement leakage.'
      ))
    }

    if (discount > 20) {
      output.push(signal(
        deal,
        'discount_abuse',
        92,
        'Discount governance risk',
        'The requested discount is above normal commercial discipline and may weaken margin quality.',
        'Escalate to manager approval and require a reason, competitor context, and payment commitment.',
        'Protects margin while allowing controlled exception handling.'
      ))
    }

    if (inactivityDays >= 2 && ['proposal_sent', 'negotiation', 'payment_pending'].includes(deal.stage ?? '')) {
      output.push(signal(
        deal,
        'followup_gap',
        78,
        'Follow-up gap detected',
        'The opportunity is active but has not received a recent commercial action.',
        'Assign a follow-up action now: call first, WhatsApp second, revised offer only if objection is clear.',
        'Prevents deal stagnation and keeps the client decision active.'
      ))
    }

    if (deal.stage === 'contract_signed' && deal.handoff_status !== 'completed') {
      output.push(signal(
        deal,
        'handoff_blocker',
        88,
        'Fulfillment handoff not complete',
        'The deal is commercially closed but operational activation is not confirmed.',
        'Open fulfillment checklist, confirm required documents, and assign an activation owner.',
        'Reduces post-sale friction and protects client trust.'
      ))
    }

    if ((deal.amount ?? 0) > 5000 && probability >= 75 && discount <= 10) {
      output.push(signal(
        deal,
        'upsell_opportunity',
        55,
        'Controlled upsell opportunity',
        'The deal value and probability suggest the client may accept a stronger package.',
        'Offer a premium package comparison with clear benefit framing, not a generic upsell.',
        'Can increase revenue without damaging close momentum.'
      ))
    }
  }

  return output.sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 }
    return rank[b.priority] - rank[a.priority]
  })
}
