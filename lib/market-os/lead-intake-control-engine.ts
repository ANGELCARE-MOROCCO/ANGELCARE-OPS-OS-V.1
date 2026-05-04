export type LeadSource = "meta_ads" | "whatsapp" | "website" | "referral" | "partner" | "organic"
export type LeadStage = "new" | "assigned" | "contacted" | "qualified" | "appointment" | "converted" | "lost"
export type LeadRisk = "low" | "medium" | "high" | "critical"

export type MarketLead = {
  id: string
  name: string
  source: LeadSource
  stage: LeadStage
  risk: LeadRisk
  campaign: string
  serviceInterest: string
  owner: string
  intentScore: number
  slaMinutesRemaining: number
  estimatedValueMad: number
  lastMessage: string
  recommendedScript: string
  nextAction: string
  attribution: string
}

export const marketLeads: MarketLead[] = [
  {
    id: "lead-001",
    name: "Family inquiry - postpartum support",
    source: "meta_ads",
    stage: "new",
    risk: "high",
    campaign: "Premium Postpartum Reassurance Campaign",
    serviceInterest: "Postpartum Care",
    owner: "Sales Agent 1",
    intentScore: 86,
    slaMinutesRemaining: 7,
    estimatedValueMad: 5900,
    lastMessage: "I need help after delivery but I want someone trustworthy.",
    recommendedScript: "Premium Postpartum Reassurance Call Script",
    nextAction: "Call within SLA and open with trust/reliability reassurance.",
    attribution: "Meta campaign / premium postpartum creative",
  },
  {
    id: "lead-002",
    name: "Clinic referral opportunity",
    source: "partner",
    stage: "assigned",
    risk: "medium",
    campaign: "Clinic Partnership Authority Sprint",
    serviceInterest: "B2B Referral",
    owner: "Partnership Lead",
    intentScore: 78,
    slaMinutesRemaining: 42,
    estimatedValueMad: 18000,
    lastMessage: "Clinic wants details about referral process.",
    recommendedScript: "Clinic Partner Meeting Script",
    nextAction: "Send partner prospectus and book meeting.",
    attribution: "Clinic mapping sprint / direct outreach",
  },
  {
    id: "lead-003",
    name: "Academy candidate inquiry",
    source: "whatsapp",
    stage: "contacted",
    risk: "medium",
    campaign: "Academy Career Path Recruitment Push",
    serviceInterest: "Academy Training",
    owner: "Academy Marketing",
    intentScore: 59,
    slaMinutesRemaining: 120,
    estimatedValueMad: 1200,
    lastMessage: "Is this training useful to find work?",
    recommendedScript: "Academy Candidate Qualification Script",
    nextAction: "Qualify seriousness and explain career pathway.",
    attribution: "WhatsApp organic / Academy content",
  }
]

export function sourceLabel(source: LeadSource) {
  const map: Record<LeadSource, string> = {
    meta_ads: "Meta Ads",
    whatsapp: "WhatsApp",
    website: "Website",
    referral: "Referral",
    partner: "Partner",
    organic: "Organic",
  }
  return map[source]
}

export function stageLabel(stage: LeadStage) {
  const map: Record<LeadStage, string> = {
    new: "New",
    assigned: "Assigned",
    contacted: "Contacted",
    qualified: "Qualified",
    appointment: "Appointment",
    converted: "Converted",
    lost: "Lost",
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
