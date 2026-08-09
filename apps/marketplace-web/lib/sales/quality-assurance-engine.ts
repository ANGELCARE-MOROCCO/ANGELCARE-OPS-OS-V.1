import type { SalesQaStatus } from '@/types/sales/quality-assurance'

export function calculateSalesQualityScore(input: {
  scriptMatched?: boolean
  paymentConfirmed?: boolean
  discountApproved?: boolean
  contractReady?: boolean
  handoffReady?: boolean
}) {
  let score = 100
  if (!input.scriptMatched) score -= 15
  if (!input.paymentConfirmed) score -= 25
  if (!input.discountApproved) score -= 15
  if (!input.contractReady) score -= 20
  if (!input.handoffReady) score -= 15
  return Math.max(0, score)
}

export function resolveSalesQaStatus(score: number): SalesQaStatus {
  if (score >= 85) return 'clean'
  if (score >= 65) return 'warning'
  return 'critical'
}

export function buildQaRecommendation(score: number) {
  if (score >= 85) return 'Deal quality is acceptable. Continue normal closing and fulfillment monitoring.'
  if (score >= 65) return 'Manager review recommended before contract activation or fulfillment handoff.'
  return 'Block risky progression until missing proof, payment, contract, or handoff elements are corrected.'
}
