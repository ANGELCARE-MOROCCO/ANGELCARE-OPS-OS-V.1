export type FlashcardsLifecycle =
  | 'legacy_intake'
  | 'idea'
  | 'structuring'
  | 'content_draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'revision_required'
  | 'archived'

export type FlashcardsReadinessStatus =
  | 'needs_structuring'
  | 'needs_review'
  | 'ready_for_growth'
  | 'active'
  | 'approved'
  | 'archived'

export type CatalogueSeedCategory = {
  id: string
  code: string
  name: string
  shortName: string
  parentId: string | null
  order: number
  status: FlashcardsReadinessStatus
  accent: string
  description: string
}

export type CatalogueSeedCollection = {
  id: string
  code: string
  name: string
  slug: string
  categoryId: string
  legacyDomain: string
  legacyNumber: string
  expectedCardCount: number | null
  structuredCardCount: number
  historicalPriceDh: number | null
  primaryFormat: string
  status: FlashcardsReadinessStatus
  readiness: number
  ageMinMonths: number | null
  ageMaxMonths: number | null
  languages: string[]
  methodologies: string[]
  sourcePage: number
  sourceLabel: string
  issues: string[]
  notes: string
  primaryObjective: string
  audiences: string[]
  usageContexts: string[]
  version: string
  owner: string
  lifecycle: FlashcardsLifecycle
}

export type CatalogueSeed = {
  schemaVersion: string
  portfolio: { id: string; code: string; name: string; status: string }
  family: { id: string; code: string; name: string; status: string }
  categories: CatalogueSeedCategory[]
  collections: CatalogueSeedCollection[]
}

export type TaxonomyNode = CatalogueSeedCategory & {
  collectionCount: number
  expectedCardCount: number
  issueCount: number
  readinessAverage: number
  children: TaxonomyNode[]
}

export type CollectionSummary = CatalogueSeedCollection & {
  categoryName: string
  parentCategoryName: string
  issueCount: number
}

export type CollectionCard = {
  id: string
  collectionId: string
  sequence: number
  concept: string | null
  frontText: string | null
  backGuidance: string | null
  language: string
  translation: string | null
  pronunciation: string | null
  example: string | null
  activity: string | null
  difficulty: 'foundation' | 'developing' | 'advanced'
  imageBrief: string | null
  rightsStatus: 'unverified' | 'cleared' | 'restricted'
  approvalStatus: 'draft' | 'review' | 'approved' | 'rejected'
  updatedAt: string | null
}

export type CollectionDossier = CollectionSummary & {
  cards: CollectionCard[]
  sections: Array<{
    key: string
    label: string
    status: 'ready' | 'partial' | 'future_engine'
    completeness: number
  }>
  editions: Array<{ id: string; language: string; status: string; version: string }>
  formats: Array<{ id: string; format: string; status: string }>
  timeline: Array<{ id: string; label: string; detail: string; date: string | null; tone: 'neutral' | 'warning' | 'positive' }>
}

export type ImportIssue = {
  id: string
  collectionCode: string
  collectionName: string
  sourcePage: number
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'resolved' | 'accepted' | 'rejected'
  explanation: string
}

export type FlashcardsDashboardData = {
  sourceMode: 'database' | 'catalogue_seed'
  portfolioName: string
  collections: number
  categories: number
  activeDomains: number
  expectedCards: number
  structuredCards: number
  openIssues: number
  averageReadiness: number
  historicalPortfolioValueDh: number
  lifecycle: Record<string, number>
  topDomains: Array<{
    id: string
    name: string
    collections: number
    expectedCards: number
    issues: number
    readiness: number
  }>
  decisionQueue: ImportIssue[]
  latestCollections: CollectionSummary[]
}

export type CollectionMutationInput = {
  name?: string
  categoryId?: string
  status?: FlashcardsReadinessStatus
  lifecycle?: FlashcardsLifecycle
  expectedCardCount?: number | null
  historicalPriceDh?: number | null
  ageMinMonths?: number | null
  ageMaxMonths?: number | null
  languages?: string[]
  methodologies?: string[]
  primaryObjective?: string
  audiences?: string[]
  usageContexts?: string[]
  owner?: string
  notes?: string
}
