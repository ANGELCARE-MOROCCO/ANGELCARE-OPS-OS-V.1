import type { SalesAgentScorecard, SalesPerformanceBand, SalesPipelineHealthSignal } from '@/types/sales/performance-intelligence'

export function calculatePerformanceBand(score: number): SalesPerformanceBand {
  if (score >= 85) return 'elite'
  if (score >= 70) return 'strong'
  if (score >= 50) return 'unstable'
  return 'critical'
}

export function buildAgentScorecard(agent: Partial<SalesAgentScorecard>): SalesAgentScorecard {
  const conversionRate = agent.conversionRate ?? 0
  const followupDiscipline = agent.followupDiscipline ?? 0
  const responseScore = Math.max(0, 100 - ((agent.averageResponseMinutes ?? 60) / 60) * 25)
  const weightedScore = conversionRate * 0.45 + followupDiscipline * 0.35 + responseScore * 0.2

  return {
    agentId: agent.agentId ?? 'unknown',
    agentName: agent.agentName ?? 'Unassigned Agent',
    dealsTouched: agent.dealsTouched ?? 0,
    closedDeals: agent.closedDeals ?? 0,
    conversionRate,
    followupDiscipline,
    averageResponseMinutes: agent.averageResponseMinutes ?? 0,
    revenueProtected: agent.revenueProtected ?? 0,
    band: calculatePerformanceBand(weightedScore),
    coachingSignal: buildCoachingSignal(conversionRate, followupDiscipline, agent.averageResponseMinutes ?? 0),
  }
}

export function buildCoachingSignal(conversionRate: number, followupDiscipline: number, averageResponseMinutes: number): string {
  if (followupDiscipline < 55) return 'Follow-up discipline is the priority. Tighten reminders, callbacks, and same-day client pressure.'
  if (conversionRate < 35) return 'Conversion is weak. Review qualification, offer fit, objection handling, and closing confidence.'
  if (averageResponseMinutes > 45) return 'Response time is slow. Prioritize hot lead speed and reduce waiting gaps.'
  return 'Execution is healthy. Maintain rhythm and push higher-value closing opportunities.'
}

export function diagnosePipelineHealth(metrics: { hotDeals: number; stalledDeals: number; paymentPending: number; handoffRisk: number }): SalesPipelineHealthSignal[] {
  const signals: SalesPipelineHealthSignal[] = []

  if (metrics.stalledDeals > metrics.hotDeals * 0.4) {
    signals.push({
      id: 'stalled-deals',
      title: 'STALLED DEAL PRESSURE',
      severity: 'high',
      diagnosis: 'Too many active opportunities are not moving toward payment or signature.',
      action: 'Launch a closing sprint and force next action on every stalled deal today.',
    })
  }

  if (metrics.paymentPending > 0) {
    signals.push({
      id: 'payment-pending',
      title: 'PAYMENT PROMISE RISK',
      severity: metrics.paymentPending > 5 ? 'urgent' : 'medium',
      diagnosis: 'Closed or near-closed deals are exposed because payment has not been secured.',
      action: 'Trigger payment confirmation scripts and escalate high-value promises.',
    })
  }

  if (metrics.handoffRisk > 0) {
    signals.push({
      id: 'handoff-risk',
      title: 'FULFILLMENT HANDOFF RISK',
      severity: 'high',
      diagnosis: 'Some closed deals may collapse after the sale because fulfillment readiness is not locked.',
      action: 'Check activation requirements, documents, dates, and operational feasibility before declaring victory.',
    })
  }

  if (signals.length === 0) {
    signals.push({
      id: 'healthy-pipeline',
      title: 'PIPELINE RHYTHM HEALTHY',
      severity: 'low',
      diagnosis: 'No major pressure signal detected in the current sample.',
      action: 'Keep focus on high-value deals and daily closing discipline.',
    })
  }

  return signals
}
