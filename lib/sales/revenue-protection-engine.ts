import type { RevenueProtectionCase, RevenueProtectionRiskLevel } from '@/types/sales/revenue-protection'

export function calculateProtectionScore(input: {
  paymentConfirmed: boolean
  contractSigned: boolean
  opsHandoffReady: boolean
  clientConfirmedStart: boolean
  blockers: string[]
  overdueHours: number
}) {
  let score = 100
  if (!input.paymentConfirmed) score -= 25
  if (!input.contractSigned) score -= 20
  if (!input.opsHandoffReady) score -= 20
  if (!input.clientConfirmedStart) score -= 15
  score -= Math.min(input.blockers.length * 8, 24)
  score -= Math.min(Math.floor(input.overdueHours / 6) * 5, 20)
  return Math.max(0, score)
}

export function classifyProtectionRisk(score: number): RevenueProtectionRiskLevel {
  if (score < 35) return 'critical'
  if (score < 60) return 'high'
  if (score < 80) return 'medium'
  return 'low'
}

export function getProtectionNextAction(item: RevenueProtectionCase) {
  if (item.riskLevel === 'critical') return 'Manager must intervene immediately and lock client reassurance call.'
  if (item.riskLevel === 'high') return 'Sales owner must resolve blockers before next fulfillment checkpoint.'
  if (item.riskLevel === 'medium') return 'Confirm client expectations and validate handoff readiness.'
  return 'Keep monitoring until service start is confirmed.'
}
