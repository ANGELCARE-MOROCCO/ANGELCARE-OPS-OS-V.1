"use client"

export type CampaignSyncStatus = "healthy" | "warning" | "critical"
export type CampaignContentType =
  | "brochure"
  | "post"
  | "newsletter"
  | "video"
  | "story"
  | "presentation"
  | "demo_video"
  | "promo_video"

export type CampaignContentRequirement = {
  id: string
  campaign_id: string
  campaign_name: string
  content_type: CampaignContentType
  required_count: number
  produced_count: number
  approved_count: number
  published_count: number
  priority: "low" | "normal" | "high" | "urgent"
  owner: string
  deadline: string
  status: CampaignSyncStatus
  service_name?: string
  notes?: string
}

export const contentTypeNames: Record<CampaignContentType, string> = {
  brochure: "Brochure",
  post: "Post réseaux sociaux",
  newsletter: "Newsletter",
  video: "Vidéo",
  story: "Story",
  presentation: "Présentation",
  demo_video: "Demo video",
  promo_video: "Promo video",
}

export const defaultCampaignContentRequirements: CampaignContentRequirement[] = [
  {
    id: "sync-req-1",
    campaign_id: "camp-angelcare-b2c-trust",
    campaign_name: "AngelCare B2C Trust Campaign",
    content_type: "post",
    required_count: 12,
    produced_count: 7,
    approved_count: 4,
    published_count: 3,
    priority: "high",
    owner: "Content Officer",
    deadline: "This week",
    status: "warning",
    service_name: "Garde d'enfants",
    notes: "Increase trust posts, testimonials and before/after formats.",
  },
  {
    id: "sync-req-2",
    campaign_id: "camp-partner-growth",
    campaign_name: "Partner Acquisition Campaign",
    content_type: "brochure",
    required_count: 2,
    produced_count: 1,
    approved_count: 1,
    published_count: 0,
    priority: "urgent",
    owner: "Brand Officer",
    deadline: "48h",
    status: "critical",
    service_name: "Partenariat AngelCare",
    notes: "Partner sales brochure missing final publishable version.",
  },
  {
    id: "sync-req-3",
    campaign_id: "camp-newsletter-family",
    campaign_name: "Family Newsletter Loop",
    content_type: "newsletter",
    required_count: 4,
    produced_count: 4,
    approved_count: 3,
    published_count: 2,
    priority: "normal",
    owner: "Content Officer",
    deadline: "Monthly",
    status: "healthy",
    service_name: "Accompagnement famille",
    notes: "Newsletter production is stable; publish cadence needs tracking.",
  },
]

export function calculateRequirementStatus(item: CampaignContentRequirement): CampaignSyncStatus {
  const producedRatio = item.produced_count / Math.max(1, item.required_count)
  const approvedRatio = item.approved_count / Math.max(1, item.required_count)
  const publishedRatio = item.published_count / Math.max(1, item.required_count)

  if (item.priority === "urgent" && publishedRatio < 0.5) return "critical"
  if (producedRatio < 0.5) return "critical"
  if (approvedRatio < 0.7 || publishedRatio < 0.5) return "warning"
  return "healthy"
}

export function syncScore(requirements: CampaignContentRequirement[]) {
  if (!requirements.length) return 0
  const total = requirements.reduce((sum, item) => {
    const production = item.produced_count / Math.max(1, item.required_count)
    const approval = item.approved_count / Math.max(1, item.required_count)
    const publishing = item.published_count / Math.max(1, item.required_count)
    return sum + Math.min(1, production * 0.4 + approval * 0.3 + publishing * 0.3)
  }, 0)

  return Math.round((total / requirements.length) * 100)
}

export function missingOutputCount(requirements: CampaignContentRequirement[]) {
  return requirements.reduce((sum, item) => sum + Math.max(0, item.required_count - item.produced_count), 0)
}

export function buildAutoTaskPayload(requirement: CampaignContentRequirement) {
  return {
    title: `${contentTypeNames[requirement.content_type]} — ${requirement.campaign_name}`,
    content_type: requirement.content_type,
    service_name: requirement.service_name || "AngelCare service",
    creator: requirement.owner || "Content Officer",
    stage: "planned",
    priority: requirement.priority,
    channel: requirement.content_type === "newsletter" ? "Email" : "Meta",
    target: requirement.campaign_name.toLowerCase().includes("partner") ? "Partners B2B" : "Parents B2C",
    deadline: requirement.deadline,
    objective: `Produce required ${contentTypeNames[requirement.content_type]} for campaign: ${requirement.campaign_name}.`,
    output_notes: requirement.notes || "",
    review_notes: "",
    asset_url: "",
    approval_status: "none",
    production_score: 20,
    campaign_id: requirement.campaign_id,
  }
}
