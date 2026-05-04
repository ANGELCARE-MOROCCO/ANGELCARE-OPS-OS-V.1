export type SeoStage =
  | "research"
  | "brief"
  | "production"
  | "published"
  | "ranking"
  | "optimization"

export type SeoRisk = "low" | "medium" | "high" | "critical"

export type SeoCluster = {
  id: string
  title: string
  serviceLine: string
  owner: string
  stage: SeoStage
  risk: SeoRisk
  targetMarket: string
  primaryKeyword: string
  supportingKeywords: number
  plannedPages: number
  publishedPages: number
  rankingScore: number
  authorityScore: number
  organicLeads: number
  revenuePotentialMad: number
  blocker: string
  nextAction: string
  strategicMeaning: string
}

export const seoClusters: SeoCluster[] = [
  {
    id: "seo-001",
    title: "Postpartum Homecare Authority Cluster",
    serviceLine: "Postpartum Care",
    owner: "SEO / Content",
    stage: "production",
    risk: "medium",
    targetMarket: "Casablanca / Rabat",
    primaryKeyword: "aide post accouchement à domicile",
    supportingKeywords: 38,
    plannedPages: 12,
    publishedPages: 4,
    rankingScore: 42,
    authorityScore: 55,
    organicLeads: 19,
    revenuePotentialMad: 180000,
    blocker: "Missing expert FAQ and internal linking structure.",
    nextAction: "Produce 4 authority articles and connect them to postpartum landing page.",
    strategicMeaning: "Builds long-term premium trust beyond paid ads.",
  },
  {
    id: "seo-002",
    title: "Caregiver Training & Academy Search Cluster",
    serviceLine: "AngelCare Academy",
    owner: "Academy Marketing",
    stage: "brief",
    risk: "high",
    targetMarket: "Rabat / Temara / Salé",
    primaryKeyword: "formation aide à domicile Maroc",
    supportingKeywords: 26,
    plannedPages: 8,
    publishedPages: 1,
    rankingScore: 18,
    authorityScore: 33,
    organicLeads: 6,
    revenuePotentialMad: 95000,
    blocker: "Search intent is not yet separated between training, job access and certification.",
    nextAction: "Build SEO brief separating candidate questions from employer trust pages.",
    strategicMeaning: "Can reduce recruitment CAC and improve trainee quality.",
  },
  {
    id: "seo-003",
    title: "Elderly Care Trust & Family Decision Cluster",
    serviceLine: "Senior Care",
    owner: "Marketing Director",
    stage: "research",
    risk: "medium",
    targetMarket: "Morocco",
    primaryKeyword: "aide personne âgée à domicile",
    supportingKeywords: 44,
    plannedPages: 15,
    publishedPages: 2,
    rankingScore: 25,
    authorityScore: 41,
    organicLeads: 11,
    revenuePotentialMad: 240000,
    blocker: "Needs family decision psychology and trust-proof content.",
    nextAction: "Create decision-guide page and caregiver reliability proof article.",
    strategicMeaning: "Captures families researching before urgent care decisions.",
  }
]

export function stageLabel(stage: SeoStage) {
  const map: Record<SeoStage, string> = {
    research: "Research",
    brief: "Brief",
    production: "Production",
    published: "Published",
    ranking: "Ranking",
    optimization: "Optimization",
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
