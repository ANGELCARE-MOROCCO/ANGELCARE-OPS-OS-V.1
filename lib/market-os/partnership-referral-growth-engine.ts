export type PartnerType = "clinic" | "doctor" | "ambassador" | "influencer" | "corporate" | "community"
export type PartnerStage = "identified" | "qualified" | "contacted" | "meeting" | "active" | "paused"
export type PartnerRisk = "low" | "medium" | "high" | "critical"

export type GrowthPartner = {
  id: string
  name: string
  type: PartnerType
  stage: PartnerStage
  risk: PartnerRisk
  owner: string
  market: string
  potentialLeads: number
  actualLeads: number
  conversionRate: number
  revenueMad: number
  trustScore: number
  activationScore: number
  blocker: string
  nextAction: string
  strategicValue: string
}

export const growthPartners: GrowthPartner[] = [
  {
    id: "partner-001",
    name: "Rabat Maternity Clinic Network",
    type: "clinic",
    stage: "meeting",
    risk: "medium",
    owner: "Partnership Lead",
    market: "Rabat / Temara / Salé",
    potentialLeads: 140,
    actualLeads: 18,
    conversionRate: 16.5,
    revenueMad: 74000,
    trustScore: 82,
    activationScore: 58,
    blocker: "Partner prospectus and referral terms need final approval.",
    nextAction: "Finalize pilot partnership agreement and schedule decision-maker meeting.",
    strategicValue: "High-trust acquisition channel for postpartum and family care services.",
  },
  {
    id: "partner-002",
    name: "AngelCare Ambassador Mothers Circle",
    type: "ambassador",
    stage: "active",
    risk: "low",
    owner: "Community Manager",
    market: "Casablanca",
    potentialLeads: 90,
    actualLeads: 42,
    conversionRate: 13.2,
    revenueMad: 52000,
    trustScore: 88,
    activationScore: 76,
    blocker: "Needs clearer reward tracking and content prompts.",
    nextAction: "Launch ambassador monthly challenge and referral dashboard.",
    strategicValue: "Warm referral source with strong emotional credibility.",
  },
  {
    id: "partner-003",
    name: "Corporate HR Family Support Pilot",
    type: "corporate",
    stage: "qualified",
    risk: "high",
    owner: "Marketing Director",
    market: "Morocco",
    potentialLeads: 220,
    actualLeads: 0,
    conversionRate: 0,
    revenueMad: 0,
    trustScore: 64,
    activationScore: 31,
    blocker: "No B2B offer deck or HR benefits positioning yet.",
    nextAction: "Create corporate family support offer and HR decision-maker script.",
    strategicValue: "Potential scalable B2B channel with recurring family support demand.",
  }
]

export function typeLabel(type: PartnerType) {
  const map: Record<PartnerType, string> = {
    clinic: "Clinic",
    doctor: "Doctor",
    ambassador: "Ambassador",
    influencer: "Influencer",
    corporate: "Corporate",
    community: "Community",
  }
  return map[type]
}

export function stageLabel(stage: PartnerStage) {
  const map: Record<PartnerStage, string> = {
    identified: "Identified",
    qualified: "Qualified",
    contacted: "Contacted",
    meeting: "Meeting",
    active: "Active",
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
