export type OfferStage =
  | "concept"
  | "pricing"
  | "margin_review"
  | "approval"
  | "ready"
  | "live"
  | "iteration"

export type OfferRisk = "low" | "medium" | "high" | "critical"

export type OfferItem = {
  id: string
  title: string
  strategy: string
  segment: string
  owner: string
  stage: OfferStage
  risk: OfferRisk
  basePriceMad: number
  costMad: number
  marginPercent: number
  expectedConversion: number
  revenuePotentialMad: number
  approvalRequired: boolean
  readiness: number
  pricingIssue: string
  offerStrength: string
  nextAction: string
}

export const offers: OfferItem[] = [
  {
    id: "offer-001",
    title: "Premium 7-Day Postpartum Starter Package",
    strategy: "Postpartum Growth System",
    segment: "Families needing immediate postnatal support",
    owner: "Marketing Director",
    stage: "margin_review",
    risk: "medium",
    basePriceMad: 5900,
    costMad: 3650,
    marginPercent: 38,
    expectedConversion: 12.5,
    revenuePotentialMad: 280000,
    approvalRequired: true,
    readiness: 74,
    pricingIssue: "Margin is acceptable but discount policy must be controlled.",
    offerStrength: "Strong emotional urgency and premium reassurance potential.",
    nextAction: "Validate margin guardrails and approve launch offer.",
  },
  {
    id: "offer-002",
    title: "Clinic Referral Priority Access Program",
    strategy: "B2B Clinic Partnership Pipeline",
    segment: "Maternity clinics and gynecologists",
    owner: "Partnership Lead",
    stage: "pricing",
    risk: "low",
    basePriceMad: 0,
    costMad: 2500,
    marginPercent: 52,
    expectedConversion: 18,
    revenuePotentialMad: 320000,
    approvalRequired: true,
    readiness: 58,
    pricingIssue: "Referral reward and operational cost rules need final definition.",
    offerStrength: "High trust channel with low acquisition cost.",
    nextAction: "Define partner incentive model and approval thresholds.",
  },
  {
    id: "offer-003",
    title: "Academy Training-to-Career Enrollment Offer",
    strategy: "Caregiver Supply Brand Authority",
    segment: "Young candidates seeking professional pathway",
    owner: "Academy Marketing",
    stage: "concept",
    risk: "high",
    basePriceMad: 1200,
    costMad: 620,
    marginPercent: 48,
    expectedConversion: 7,
    revenuePotentialMad: 95000,
    approvalRequired: false,
    readiness: 31,
    pricingIssue: "Offer value is not clear enough versus free informal alternatives.",
    offerStrength: "Can become strong if linked to certification and job access.",
    nextAction: "Rebuild offer promise around future career value.",
  }
]

export function stageLabel(stage: OfferStage) {
  const map: Record<OfferStage, string> = {
    concept: "Concept",
    pricing: "Pricing",
    margin_review: "Margin Review",
    approval: "Approval",
    ready: "Ready",
    live: "Live",
    iteration: "Iteration",
  }
  return map[stage]
}

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}
