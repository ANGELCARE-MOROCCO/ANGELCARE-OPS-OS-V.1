export type CampaignStage =
  | "brief"
  | "assets"
  | "approval"
  | "ready"
  | "live"
  | "optimization"
  | "post_mortem"

export type CampaignRisk = "low" | "medium" | "high" | "critical"

export type Campaign = {
  id: string
  title: string
  strategy: string
  owner: string
  stage: CampaignStage
  risk: CampaignRisk
  audience: string
  offer: string
  channel: string
  budgetMad: number
  spentMad: number
  launchDate: string
  readiness: number
  missingItems: string[]
  optimizationFocus: string
  expectedOutcome: string
  nextAction: string
}

export const campaigns: Campaign[] = [
  {
    id: "camp-001",
    title: "Premium Postpartum Reassurance Campaign",
    strategy: "Postpartum Growth System",
    owner: "Marketing Director",
    stage: "approval",
    risk: "high",
    audience: "New mothers and families seeking trusted postnatal support",
    offer: "Premium 7-day postpartum homecare starter package",
    channel: "Meta + WhatsApp + Landing Page",
    budgetMad: 42000,
    spentMad: 0,
    launchDate: "2026-05-08",
    readiness: 72,
    missingItems: ["CEO offer approval", "final WhatsApp objection script", "landing page proof check"],
    optimizationFocus: "Reduce CAC and increase high-intent WhatsApp conversations",
    expectedOutcome: "Generate 260 qualified leads and 34 premium client opportunities",
    nextAction: "Approve final campaign promise and validate launch checklist.",
  },
  {
    id: "camp-002",
    title: "Clinic Partnership Authority Sprint",
    strategy: "B2B Clinic Partnership Pipeline",
    owner: "Partnership Lead",
    stage: "assets",
    risk: "medium",
    audience: "Maternity clinics, gynecologists and clinic administrators",
    offer: "Referral partnership and priority homecare access program",
    channel: "Direct outreach + partner prospectus",
    budgetMad: 18000,
    spentMad: 3000,
    launchDate: "2026-05-13",
    readiness: 48,
    missingItems: ["partner prospectus", "clinic segmentation grid", "outreach follow-up calendar"],
    optimizationFocus: "Increase partner reply rate and meeting conversion",
    expectedOutcome: "Secure 8 partner meetings and 2 signed referral agreements",
    nextAction: "Finalize partner prospectus and outreach sequencing.",
  },
  {
    id: "camp-003",
    title: "Academy Career Path Recruitment Push",
    strategy: "Caregiver Supply Brand Authority",
    owner: "Academy Marketing",
    stage: "brief",
    risk: "medium",
    audience: "Young candidates in Rabat, Temara and Salé seeking professional training",
    offer: "Training-to-career pathway with certification and job access",
    channel: "Meta + local groups + ambassador referrals",
    budgetMad: 16000,
    spentMad: 0,
    launchDate: "2026-05-18",
    readiness: 25,
    missingItems: ["campaign brief", "creative direction", "candidate FAQ", "lead qualification form"],
    optimizationFocus: "Improve candidate quality and reduce weak applications",
    expectedOutcome: "Generate 180 qualified Academy candidate leads",
    nextAction: "Build full campaign brief and candidate qualification criteria.",
  },
]

export function stageLabel(stage: CampaignStage) {
  const map: Record<CampaignStage, string> = {
    brief: "Brief",
    assets: "Assets",
    approval: "Approval",
    ready: "Ready",
    live: "Live",
    optimization: "Optimization",
    post_mortem: "Post-Mortem",
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
