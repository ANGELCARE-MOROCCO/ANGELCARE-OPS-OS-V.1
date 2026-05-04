export type ExpansionStage =
  | "scan"
  | "research"
  | "validation"
  | "pilot"
  | "launch_ready"
  | "launched"
  | "paused"

export type ExpansionRisk = "low" | "medium" | "high" | "critical"
export type ExpansionMarket = "morocco" | "spain" | "france" | "uae" | "qatar" | "ksa"

export type CityOpportunity = {
  id: string
  city: string
  country: ExpansionMarket
  stage: ExpansionStage
  risk: ExpansionRisk
  owner: string
  demandScore: number
  supplyReadiness: number
  competitionIntensity: number
  legalComplexity: number
  launchPriority: number
  estimatedRevenueMad: number
  mainOpportunity: string
  blocker: string
  launchCondition: string
  nextAction: string
}

export const cityOpportunities: CityOpportunity[] = [
  {
    id: "city-001",
    city: "Rabat / Temara / Salé",
    country: "morocco",
    stage: "pilot",
    risk: "medium",
    owner: "Marketing Director",
    demandScore: 82,
    supplyReadiness: 71,
    competitionIntensity: 48,
    legalComplexity: 32,
    launchPriority: 86,
    estimatedRevenueMad: 420000,
    mainOpportunity: "Strong family demand, Academy supply potential and B2B clinic access.",
    blocker: "Need stronger caregiver supply and clinic partner activation.",
    launchCondition: "Minimum 25 reliable caregivers and 5 active referral partners.",
    nextAction: "Launch city pilot with postpartum, senior care and Academy recruitment tracks.",
  },
  {
    id: "city-002",
    city: "Casablanca",
    country: "morocco",
    stage: "validation",
    risk: "low",
    owner: "CEO / Marketing Director",
    demandScore: 91,
    supplyReadiness: 78,
    competitionIntensity: 66,
    legalComplexity: 35,
    launchPriority: 89,
    estimatedRevenueMad: 680000,
    mainOpportunity: "Largest demand pool and high premium-service potential.",
    blocker: "Competition is stronger and differentiation must be sharper.",
    launchCondition: "Premium positioning, trust-proof content and fast lead SLA.",
    nextAction: "Strengthen premium differentiation and scale Meta + referral campaigns.",
  },
  {
    id: "city-003",
    city: "Dubai",
    country: "uae",
    stage: "research",
    risk: "high",
    owner: "Expansion Lead",
    demandScore: 88,
    supplyReadiness: 34,
    competitionIntensity: 74,
    legalComplexity: 82,
    launchPriority: 62,
    estimatedRevenueMad: 950000,
    mainOpportunity: "High purchasing power and demand for premium family support.",
    blocker: "Legal, licensing and workforce compliance require deeper validation.",
    launchCondition: "Local legal framework, partnership model and compliant workforce channel.",
    nextAction: "Build UAE legal/commercial validation dossier before any launch commitment.",
  }
]

export function countryLabel(country: ExpansionMarket) {
  const map: Record<ExpansionMarket, string> = {
    morocco: "Morocco",
    spain: "Spain",
    france: "France",
    uae: "UAE",
    qatar: "Qatar",
    ksa: "KSA",
  }
  return map[country]
}

export function stageLabel(stage: ExpansionStage) {
  const map: Record<ExpansionStage, string> = {
    scan: "Scan",
    research: "Research",
    validation: "Validation",
    pilot: "Pilot",
    launch_ready: "Launch Ready",
    launched: "Launched",
    paused: "Paused",
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
