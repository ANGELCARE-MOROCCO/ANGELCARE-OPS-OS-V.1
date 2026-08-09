export type CatalogueUniverse = 'b2c' | 'b2b'
export type CatalogueCompositionMode = 'package' | 'journey'
export type CatalogueDeliveryMode = 'physical' | 'digital' | 'hybrid'

export type CatalogueCollectionCandidate = {
  id: string
  code: string
  name: string
  categoryId: string
  categoryCode: string
  categoryName: string
  versionId: string | null
  versionLabel: string
  status: string
  lifecycle: string
  readinessScore: number
  cardCount: number
  ageMinMonths: number | null
  ageMaxMonths: number | null
  languages: string[]
  formats: CatalogueDeliveryMode[]
  methodologies: string[]
  audiences: string[]
  usageContexts: string[]
  objectiveKeys: string[]
  painPointKeys: string[]
  outcomeKeys: string[]
  description: string
  historicalPriceDh: number | null
  priceDh: number | null
  unitCostDh: number | null
  minimumQuantity: number
  taxPercent: number
  volumeTiers: Array<Record<string, unknown>>
  commercialAuthority: 'confirmed' | 'historical_seed' | 'unconfigured'
  commercialStatus: 'active' | 'draft' | 'missing_price' | 'inactive'
  warnings: string[]
}

export type CatalogueComposerOptions = {
  sourceMode: 'database' | 'catalogue_seed'
  collections: CatalogueCollectionCandidate[]
  categories: Array<{ id: string; code: string; name: string; collectionCount: number }>
  ontology: Record<'learnerProfiles' | 'usageContexts' | 'painPoints' | 'objectives' | 'outcomes', Array<{ key: string; label: string; description: string }>>
}

export type PackageComposerInput = {
  title: string
  universe: CatalogueUniverse
  customerSegment: string
  learnerAgesMonths: number[]
  learnerCount: number
  languages: string[]
  deliveryMode: CatalogueDeliveryMode
  usageContexts: string[]
  objectiveKeys: string[]
  painPointKeys: string[]
  outcomeKeys: string[]
  requiredCategoryIds: string[]
  excludedCategoryIds: string[]
  requiredCollectionIds: string[]
  excludedCollectionIds: string[]
  minimumCollections: number
  maximumCollections: number
  budgetMaxDh: number
  quantity: number
  requestedProposalCount: number
  variationPriorities: string[]
}

export type JourneyComposerInput = {
  title: string
  universe: CatalogueUniverse
  learnerAgesMonths: number[]
  learnerCount: number
  languages: string[]
  learnerProfileKeys: string[]
  usageContextKeys: string[]
  painPointKeys: string[]
  objectiveKeys: string[]
  outcomeKeys: string[]
  durationDays: number
  sessionsPerDay: number
  minutesPerSession: number
  intensity: 'light' | 'medium' | 'intensive'
  facilitatorType: string
  deliveryMode: CatalogueDeliveryMode
  requiredCategoryIds: string[]
  excludedCategoryIds: string[]
  requiredCollectionIds: string[]
  excludedCollectionIds: string[]
  maximumCollections: number
  budgetMaxDh: number
  quantity: number
  requestedProposalCount: number
}

export type CataloguePriceLine = {
  collectionId: string
  collectionCode: string
  collectionName: string
  versionId: string | null
  versionLabel: string
  quantity: number
  unitPriceDh: number
  subtotalDh: number
  unitCostDh: number | null
  costSubtotalDh: number | null
}

export type CatalogueCommercialCalculation = {
  currency: 'Dh'
  lines: CataloguePriceLine[]
  subtotalDh: number
  taxPercent: number
  taxDh: number
  finalTotalDh: number
  totalKnownCostDh: number
  grossMarginDh: number | null
  grossMarginPercent: number | null
  warnings: string[]
  calculatedAt: string
}

export type CataloguePackageScenario = {
  id: string
  mode: 'package'
  requestId: string
  name: string
  positioning: string
  customerPromise: string
  targetCustomer: string
  collectionIds: string[]
  collectionRationales: Array<{ collectionId: string; rationale: string; usageOrder: number }>
  coverageGaps: string[]
  risks: string[]
  upsellCollectionIds: string[]
  upgradePath: string
  salesArgument: string
  confidenceScore: number
  commercial: CatalogueCommercialCalculation
  modelUsed: string
  publishedSellableId: string | null
}

export type CatalogueJourneyActivity = {
  order: number
  title: string
  instruction: string
  durationMinutes: number
  collectionId: string
  cardReference: string
  objectiveKeys: string[]
  expectedObservation: string
}

export type CatalogueJourneyScenario = {
  id: string
  mode: 'journey'
  requestId: string
  name: string
  thesis: string
  targetLearner: string
  expectedOutcome: string
  collectionIds: string[]
  days: Array<{
    dayNumber: number
    title: string
    objectiveKeys: string[]
    sessions: Array<{
      sessionNumber: number
      title: string
      durationMinutes: number
      objectiveKeys: string[]
      activities: CatalogueJourneyActivity[]
      facilitatorInstruction: string
      successIndicator: string
    }>
    parentOrTeacherContinuation: string
  }>
  baseline: string
  midpointReview: string
  finalAssessment: string
  adaptations: string[]
  risks: string[]
  commercial: CatalogueCommercialCalculation
  modelUsed: string
  publishedSellableId: string | null
}

export type CatalogueCompositionScenario = CataloguePackageScenario | CatalogueJourneyScenario

export type CatalogueCompositionResult = {
  mode: CatalogueCompositionMode
  requestId: string
  requestCode: string
  title: string
  universe: CatalogueUniverse
  sourceMode: 'database' | 'catalogue_seed'
  sourceDoctrine: 'local_catalogue_only'
  scenarios: CatalogueCompositionScenario[]
  collections: CatalogueCollectionCandidate[]
}
