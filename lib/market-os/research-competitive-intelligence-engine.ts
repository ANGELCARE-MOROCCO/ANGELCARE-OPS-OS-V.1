export type ResearchType =
  | "competitor"
  | "customer_pain"
  | "pricing"
  | "market_signal"
  | "city_opportunity"
  | "service_gap"

export type OpportunityLevel = "low" | "medium" | "high" | "critical"
export type ResearchStatus = "new" | "validated" | "assigned" | "converted" | "archived"

export type ResearchSignal = {
  id: string
  title: string
  type: ResearchType
  status: ResearchStatus
  opportunity: OpportunityLevel
  market: string
  source: string
  owner: string
  confidence: number
  revenuePotentialMad: number
  urgency: number
  finding: string
  strategicMeaning: string
  recommendedAction: string
  executionTask: string
}

export const researchSignals: ResearchSignal[] = [
  {
    id: "research-001",
    title: "Competitor offering cheaper postpartum packages with weak differentiation",
    type: "competitor",
    status: "validated",
    opportunity: "high",
    market: "Casablanca / Rabat",
    source: "Competitor website + Meta ads observation",
    owner: "Marketing Director",
    confidence: 84,
    revenuePotentialMad: 210000,
    urgency: 82,
    finding: "Competitors are competing mostly on price, not trust, reassurance, medical sensitivity or premium family experience.",
    strategicMeaning: "AngelCare can avoid price war by positioning postpartum care as safe, structured, premium and emotionally reassuring.",
    recommendedAction: "Build premium differentiation matrix and use it in landing page, sales scripts and Meta ads.",
    executionTask: "Create competitor differentiation brief for premium postpartum campaign.",
  },
  {
    id: "research-002",
    title: "Families ask for proof of caregiver reliability before buying",
    type: "customer_pain",
    status: "new",
    opportunity: "critical",
    market: "Morocco",
    source: "Sales calls + WhatsApp conversations",
    owner: "Sales Enablement",
    confidence: 91,
    revenuePotentialMad: 340000,
    urgency: 88,
    finding: "A recurring objection is fear of unreliable caregivers, lack of trust and uncertainty about replacement support.",
    strategicMeaning: "Trust proof must become a core marketing asset, not only a sales explanation.",
    recommendedAction: "Create caregiver reliability proof block, replacement promise, FAQ and reassurance scripts.",
    executionTask: "Produce trust-proof content kit for all family-facing campaigns.",
  },
  {
    id: "research-003",
    title: "Rabat maternity clinic partnership density is underexploited",
    type: "city_opportunity",
    status: "assigned",
    opportunity: "high",
    market: "Rabat / Temara / Salé",
    source: "Local market mapping",
    owner: "Partnership Lead",
    confidence: 76,
    revenuePotentialMad: 180000,
    urgency: 70,
    finding: "Several clinics serve postpartum families but have no structured homecare referral partner.",
    strategicMeaning: "Partnership pipeline can become a low-CAC acquisition channel if activated with professional materials.",
    recommendedAction: "Create city partner map, priority scoring and outreach sprint.",
    executionTask: "Launch Rabat clinic partnership mapping sprint.",
  },
]

export function typeLabel(type: ResearchType) {
  const map: Record<ResearchType, string> = {
    competitor: "Competitor",
    customer_pain: "Customer Pain",
    pricing: "Pricing",
    market_signal: "Market Signal",
    city_opportunity: "City Opportunity",
    service_gap: "Service Gap",
  }
  return map[type]
}

export function statusLabel(status: ResearchStatus) {
  const map: Record<ResearchStatus, string> = {
    new: "New",
    validated: "Validated",
    assigned: "Assigned",
    converted: "Converted",
    archived: "Archived",
  }
  return map[status]
}

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}
