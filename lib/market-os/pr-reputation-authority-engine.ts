export type PrStage =
  | "targeting"
  | "pitch"
  | "outreach"
  | "follow_up"
  | "secured"
  | "published"
  | "archived"

export type PrRisk = "low" | "medium" | "high" | "critical"
export type PrType = "media" | "expert" | "clinic" | "community" | "institution" | "podcast"

export type PrOpportunity = {
  id: string
  title: string
  type: PrType
  stage: PrStage
  risk: PrRisk
  owner: string
  targetName: string
  targetMarket: string
  authorityScore: number
  reachPotential: number
  trustImpact: number
  leadPotential: number
  pitchAngle: string
  blocker: string
  nextAction: string
  reputationValue: string
}

export const prOpportunities: PrOpportunity[] = [
  {
    id: "pr-001",
    title: "Postpartum Safety & Family Reassurance Expert Feature",
    type: "media",
    stage: "pitch",
    risk: "medium",
    owner: "Marketing Director",
    targetName: "Moroccan Family & Health Media",
    targetMarket: "Morocco",
    authorityScore: 74,
    reachPotential: 42000,
    trustImpact: 86,
    leadPotential: 95,
    pitchAngle: "How structured homecare support reduces stress for new mothers and families.",
    blocker: "Needs expert quote and approved brand-safe claims.",
    nextAction: "Finalize PR pitch and attach postpartum trust-proof data.",
    reputationValue: "Positions AngelCare as a serious and trusted postnatal care authority.",
  },
  {
    id: "pr-002",
    title: "AngelCare Academy Professional Pathway Story",
    type: "community",
    stage: "targeting",
    risk: "high",
    owner: "Academy Marketing",
    targetName: "Local youth and training communities",
    targetMarket: "Rabat / Temara / Salé",
    authorityScore: 52,
    reachPotential: 28000,
    trustImpact: 70,
    leadPotential: 120,
    pitchAngle: "From training to real employability in homecare careers.",
    blocker: "No trainee success story pack yet.",
    nextAction: "Collect trainee proof, testimonials and career pathway data.",
    reputationValue: "Improves Academy credibility and attracts serious candidates.",
  },
  {
    id: "pr-003",
    title: "Clinic Partnership Thought Leadership",
    type: "clinic",
    stage: "outreach",
    risk: "low",
    owner: "Partnership Lead",
    targetName: "Maternity Clinic Decision Makers",
    targetMarket: "Rabat / Casablanca",
    authorityScore: 81,
    reachPotential: 12000,
    trustImpact: 88,
    leadPotential: 40,
    pitchAngle: "A better referral pathway between maternity clinics and homecare support.",
    blocker: "Needs final partner prospectus.",
    nextAction: "Send co-branded collaboration proposal to priority clinics.",
    reputationValue: "Builds B2B trust and referral legitimacy.",
  }
]

export function stageLabel(stage: PrStage) {
  const map: Record<PrStage, string> = {
    targeting: "Targeting",
    pitch: "Pitch",
    outreach: "Outreach",
    follow_up: "Follow-Up",
    secured: "Secured",
    published: "Published",
    archived: "Archived",
  }
  return map[stage]
}

export function typeLabel(type: PrType) {
  const map: Record<PrType, string> = {
    media: "Media",
    expert: "Expert",
    clinic: "Clinic",
    community: "Community",
    institution: "Institution",
    podcast: "Podcast",
  }
  return map[type]
}
