export type ContentStage =
  | "idea"
  | "brief"
  | "copywriting"
  | "design"
  | "brand_review"
  | "compliance_review"
  | "approved"
  | "published"

export type ContentRisk = "low" | "medium" | "high" | "critical"

export type ContentAsset = {
  id: string
  title: string
  campaign: string
  owner: string
  assetType: string
  stage: ContentStage
  risk: ContentRisk
  channel: string
  deadline: string
  brandScore: number
  complianceScore: number
  readiness: number
  missing: string[]
  brandIssue: string
  complianceIssue: string
  nextAction: string
}

export const contentAssets: ContentAsset[] = [
  {
    id: "asset-001",
    title: "Premium Postpartum Landing Page Copy",
    campaign: "Premium Postpartum Reassurance Campaign",
    owner: "Content & Branding",
    assetType: "Landing Page",
    stage: "brand_review",
    risk: "high",
    channel: "Landing Page",
    deadline: "2026-05-06",
    brandScore: 76,
    complianceScore: 68,
    readiness: 71,
    missing: ["medical claim validation", "family reassurance section", "final CTA copy"],
    brandIssue: "Tone is premium but still needs stronger emotional reassurance.",
    complianceIssue: "Some health-related claims need softer wording and internal validation.",
    nextAction: "Rewrite medical-sensitive claims and submit final CTA for approval.",
  },
  {
    id: "asset-002",
    title: "Clinic Partner Prospectus",
    campaign: "Clinic Partnership Authority Sprint",
    owner: "Partnership Lead",
    assetType: "Partner Brochure",
    stage: "design",
    risk: "medium",
    channel: "B2B Outreach",
    deadline: "2026-05-10",
    brandScore: 82,
    complianceScore: 79,
    readiness: 58,
    missing: ["pricing disclaimer", "partner benefits page", "case proof block"],
    brandIssue: "Design direction is strong but partner value is not sharp enough.",
    complianceIssue: "Needs clear non-exclusive partnership disclaimer.",
    nextAction: "Add partner value matrix and final disclaimer before review.",
  },
  {
    id: "asset-003",
    title: "Academy Recruitment Carousel",
    campaign: "Academy Career Path Recruitment Push",
    owner: "Academy Marketing",
    assetType: "Social/Recruitment Creative",
    stage: "brief",
    risk: "medium",
    channel: "Meta + Local Groups",
    deadline: "2026-05-12",
    brandScore: 61,
    complianceScore: 84,
    readiness: 33,
    missing: ["career promise", "candidate FAQ", "visual direction", "success story"],
    brandIssue: "Message is too generic and does not create ambition.",
    complianceIssue: "Controlled.",
    nextAction: "Rebuild angle around professional progression and job-access pathway.",
  }
]

export function stageLabel(stage: ContentStage) {
  const map: Record<ContentStage, string> = {
    idea: "Idea",
    brief: "Brief",
    copywriting: "Copywriting",
    design: "Design",
    brand_review: "Brand Review",
    compliance_review: "Compliance Review",
    approved: "Approved",
    published: "Published",
  }
  return map[stage]
}
