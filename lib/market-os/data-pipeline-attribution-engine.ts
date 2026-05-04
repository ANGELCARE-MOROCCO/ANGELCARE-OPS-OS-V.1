export type AttributionSource = "meta" | "whatsapp" | "website" | "seo" | "partner" | "referral" | "direct"
export type AttributionStatus = "clean" | "partial" | "missing" | "conflict"
export type AttributionRisk = "low" | "medium" | "high" | "critical"

export type AttributionRecord = {
  id: string
  source: AttributionSource
  status: AttributionStatus
  risk: AttributionRisk
  campaign: string
  channelCostMad: number
  leads: number
  qualifiedLeads: number
  conversions: number
  revenueMad: number
  attributionConfidence: number
  dataIssue: string
  businessMeaning: string
  nextAction: string
}

export const attributionRecords: AttributionRecord[] = [
  {
    id: "attr-001",
    source: "meta",
    status: "partial",
    risk: "medium",
    campaign: "Premium Postpartum Reassurance Campaign",
    channelCostMad: 38000,
    leads: 412,
    qualifiedLeads: 126,
    conversions: 32,
    revenueMad: 188000,
    attributionConfidence: 72,
    dataIssue: "Some WhatsApp conversions are not fully linked back to Meta ad creative.",
    businessMeaning: "Campaign appears valuable but CAC proof is incomplete.",
    nextAction: "Connect lead intake attribution field to campaign and creative ID.",
  },
  {
    id: "attr-002",
    source: "partner",
    status: "clean",
    risk: "low",
    campaign: "Clinic Partnership Authority Sprint",
    channelCostMad: 9000,
    leads: 31,
    qualifiedLeads: 21,
    conversions: 6,
    revenueMad: 64000,
    attributionConfidence: 89,
    dataIssue: "Controlled.",
    businessMeaning: "Partner source has strong ROI and should be expanded.",
    nextAction: "Scale clinic partner mapping and track referral origin per clinic.",
  },
  {
    id: "attr-003",
    source: "whatsapp",
    status: "missing",
    risk: "high",
    campaign: "Academy Career Path Recruitment Push",
    channelCostMad: 6500,
    leads: 86,
    qualifiedLeads: 24,
    conversions: 5,
    revenueMad: 19000,
    attributionConfidence: 38,
    dataIssue: "Many WhatsApp leads are not linked to exact content source.",
    businessMeaning: "Academy marketing cannot yet prove which content generates serious candidates.",
    nextAction: "Add required source capture to Academy WhatsApp intake workflow.",
  }
]

export function sourceLabel(source: AttributionSource) {
  const map: Record<AttributionSource, string> = {
    meta: "Meta",
    whatsapp: "WhatsApp",
    website: "Website",
    seo: "SEO",
    partner: "Partner",
    referral: "Referral",
    direct: "Direct",
  }
  return map[source]
}

export function statusLabel(status: AttributionStatus) {
  const map: Record<AttributionStatus, string> = {
    clean: "Clean",
    partial: "Partial",
    missing: "Missing",
    conflict: "Conflict",
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
