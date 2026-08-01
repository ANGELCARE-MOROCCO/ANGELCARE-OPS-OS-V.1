export type SolutionsSourceMode = 'database' | 'controlled_bootstrap'
export type CommercialUniverse = 'b2c' | 'b2b'
export type DeliveryMode = 'physical' | 'digital' | 'hybrid'
export type ScenarioPriority = 'affordability' | 'coverage' | 'margin' | 'diversity' | 'simplicity' | 'premium'
export type ScenarioRole = 'essential' | 'balanced' | 'comprehensive' | 'premium' | 'lowest_cost' | 'highest_coverage' | 'highest_margin' | 'fastest_deployment' | 'digital_first' | 'physical_first' | 'hybrid' | 'home_intensive' | 'classroom_ready' | 'therapist_oriented'
export type SolutionRequestStatus = 'draft' | 'validation_required' | 'eligible' | 'generating' | 'generated' | 'decision_required' | 'selected' | 'closed' | 'cancelled'
export type ScenarioStatus = 'draft' | 'generated' | 'edited' | 'selected' | 'rejected' | 'promoted' | 'superseded'
export type SellableStatus = 'draft' | 'commercial_review' | 'pricing_review' | 'margin_approval' | 'publication_requested' | 'approved' | 'published' | 'suspended' | 'superseded' | 'retired' | 'archived'
export type JourneyStatus = 'draft' | 'validation_required' | 'generating' | 'generated' | 'human_review' | 'pedagogical_validation' | 'commercial_validation' | 'approved' | 'published' | 'superseded' | 'retired'
export type OntologyKind = 'learner_profile' | 'usage_context' | 'pain_point' | 'capability_objective' | 'desired_outcome'

export type ActorContext = { id: string; name: string; role: string }

export type EligibleRelease = {
  id: string
  code: string
  collectionId: string
  collectionCode: string
  collectionName: string
  releaseVersion: number
  releaseStatus: string
  commercialStatus: 'eligible' | 'ineligible' | 'conditional'
  markets: CommercialUniverse[]
  languages: string[]
  ageMinMonths: number | null
  ageMaxMonths: number | null
  usageContexts: string[]
  objectiveKeys: string[]
  painPointKeys: string[]
  outcomeKeys: string[]
  formats: DeliveryMode[]
  cardCount: number
  stockState: 'available' | 'limited' | 'production_required' | 'digital_only' | 'unknown'
  leadTimeDays: number
  basePriceDh: number | null
  unitCostDh: number | null
  effectiveFrom: string | null
  effectiveUntil: string | null
  blockingFindings: string[]
}

export type SolutionRequestProfile = {
  customerSegment: string
  learnerAgesMonths: number[]
  learnerCount: number
  languages: string[]
  individualOrGroup: 'individual' | 'group'
  supportProfiles: string[]
}

export type SolutionConstraints = {
  usageContexts: string[]
  objectiveKeys: string[]
  painPointKeys: string[]
  outcomeKeys: string[]
  deliveryMode: DeliveryMode
  budgetMinDh: number
  budgetMaxDh: number
  durationDays: number
  deliveryDeadline: string | null
  region: string
  supportLevel: string
  minimumCollections: number
  maximumCollections: number
  requiredReleaseIds: string[]
  excludedReleaseIds: string[]
  requiredCategoryKeys: string[]
  excludedCategoryKeys: string[]
  requiredFormats: DeliveryMode[]
  maximumLeadTimeDays: number
  minimumGrossMarginPercent: number
  maximumDiscountPercent: number
  priceBookId: string | null
  taxProfileId: string | null
  allowRepeatedProductsAcrossScenarios: boolean
  maximumRepeatedCollections: number
  requireVisiblyDifferentScenarios: boolean
}

export type SolutionRequest = {
  id: string
  code: string
  title: string
  universe: CommercialUniverse
  status: SolutionRequestStatus
  profile: SolutionRequestProfile
  constraints: SolutionConstraints
  requestedScenarioCount: number
  priorities: ScenarioPriority[]
  scenarioRoles: ScenarioRole[]
  eligibilityRunId: string | null
  generatedScenarioIds: string[]
  createdBy: string
  createdAt: string | null
  updatedAt: string | null
}

export type EligibilityResult = {
  id: string
  requestId: string
  releaseId: string
  eligible: boolean
  reasons: string[]
  warnings: string[]
  score: number
  evaluatedAt: string | null
}

export type PricingLine = {
  releaseId: string
  code: string
  label: string
  quantity: number
  unitPriceDh: number
  unitCostDh: number
  priceSubtotalDh: number
  costSubtotalDh: number
}

export type CommercialCalculation = {
  currency: 'Dh'
  lines: PricingLine[]
  productRevenueDh: number
  productCostDh: number
  packagingDh: number
  handlingDh: number
  digitalDeliveryDh: number
  supportDh: number
  deliveryDh: number
  licenceDh: number
  discountPercent: number
  discountDh: number
  taxableBaseDh: number
  taxPercent: number
  taxDh: number
  finalTotalDh: number
  totalCostDh: number
  grossMarginDh: number
  grossMarginPercent: number
  minimumMarginPercent: number
  marginEligible: boolean
  warnings: string[]
  calculatedAt: string
}

export type ScenarioItem = {
  id: string
  releaseId: string
  releaseCode: string
  collectionName: string
  quantity: number
  format: DeliveryMode
  rationale: string
  objectivesCovered: string[]
  painPointsCovered: string[]
  outcomesCovered: string[]
  locked: boolean
}

export type SolutionScenario = {
  id: string
  code: string
  requestId: string
  version: number
  role: ScenarioRole
  status: ScenarioStatus
  name: string
  positioning: string
  targetCustomer: string
  problemAddressed: string
  promise: string
  items: ScenarioItem[]
  coverageScore: number
  suitabilityScore: number
  diversityScore: number
  confidenceScore: number
  coverageGaps: string[]
  duplicateWarnings: string[]
  risks: string[]
  upsell: string
  downgradeAlternative: string
  salesArgument: string
  commercial: CommercialCalculation
  evidenceIds: string[]
  internalFactIds: string[]
  generationRunId: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type Sellable = {
  id: string
  code: string
  universe: CommercialUniverse
  version: number
  status: SellableStatus
  name: string
  promise: string
  targetSegment: string
  learnerProfile: string
  scenarioId: string
  releaseIds: string[]
  readyPlanId: string | null
  priceDh: number
  grossMarginPercent: number
  deliveryMode: DeliveryMode
  minimumOrder: number
  quantityBands: Array<{ minimum: number; maximum: number | null; unitPriceDh: number; discountPercent: number }>
  licenceTerms: string
  fulfilmentModel: string
  customerInstructions: string
  effectiveFrom: string | null
  effectiveUntil: string | null
  approvedBy: string | null
  approvedAt: string | null
  publishedAt: string | null
  supersedesId: string | null
  createdAt: string | null
}

export type OntologyOption = {
  id: string
  kind: OntologyKind
  key: string
  label: string
  family: string
  description: string
  ageMinMonths: number | null
  ageMaxMonths: number | null
  applicableContexts: string[]
  measurableTemplate: string | null
  status: 'active' | 'inactive' | 'archived'
  sortOrder: number
}

export type JourneyRequest = {
  id: string
  code: string
  title: string
  universe: CommercialUniverse
  status: JourneyStatus
  learnerProfileKeys: string[]
  usageContextKeys: string[]
  painPointKeys: string[]
  capabilityObjectiveKeys: string[]
  desiredOutcomeKeys: string[]
  primaryObjectiveKey: string
  secondaryObjectiveKeys: string[]
  durationDays: number
  sessionsPerDay: number
  minutesPerSession: number
  intensity: 'light' | 'medium' | 'intensive'
  individualOrGroup: 'individual' | 'group'
  facilitatorType: string
  parentInvolvement: string
  teacherInvolvement: string
  deliveryMode: DeliveryMode
  availableReleaseIds: string[]
  requiredReleaseIds: string[]
  excludedReleaseIds: string[]
  maximumCollections: number
  budgetMaxDh: number
  repetitionRhythm: string
  assessmentRhythm: string
  adaptationKeys: string[]
  requestedPlanCount: number
  createdBy: string
  createdAt: string | null
}

export type JourneyActivity = {
  id: string
  order: number
  kind: 'opening' | 'revision' | 'new_content' | 'core' | 'guided_practice' | 'independent_practice' | 'reinforcement' | 'assessment' | 'closing' | 'home_continuation'
  title: string
  instruction: string
  durationMinutes: number
  releaseId: string | null
  cardGroupReference: string | null
  objectiveKeys: string[]
  successIndicator: string
}

export type JourneySession = {
  id: string
  dayNumber: number
  sessionNumber: number
  title: string
  durationMinutes: number
  objectiveKeys: string[]
  activities: JourneyActivity[]
  facilitatorScript: string
  learnerResponseExpected: string
  adjustmentRule: string
}

export type JourneyDay = {
  id: string
  dayNumber: number
  title: string
  objectiveKeys: string[]
  targetConcepts: string[]
  sessions: JourneySession[]
  observation: string
  homeContinuation: string
}

export type JourneyScenario = {
  id: string
  code: string
  requestId: string
  version: number
  status: JourneyStatus
  name: string
  thesis: string
  targetLearner: string
  rationale: string
  expectedOutcome: string
  releaseIds: string[]
  days: JourneyDay[]
  adaptations: Array<{ key: string; title: string; instruction: string }>
  baseline: string
  midpointReview: string
  finalAssessment: string
  masteryCriteria: string
  risks: string[]
  workloadFindings: string[]
  commercial: CommercialCalculation
  generationRunId: string | null
  createdAt: string | null
}

export type ReadyLearningPlan = {
  id: string
  code: string
  universe: CommercialUniverse
  version: number
  status: JourneyStatus
  name: string
  scenarioId: string
  learnerProfile: string
  objectives: string[]
  releaseIds: string[]
  durationDays: number
  totalSessions: number
  totalMinutes: number
  priceDh: number
  grossMarginPercent: number
  approvedBy: string | null
  approvedAt: string | null
  publishedAt: string | null
  supersedesId: string | null
}

export type PriceBookSummary = {
  id: string
  code: string
  label: string
  universe: CommercialUniverse
  currency: 'Dh'
  status: 'draft' | 'active' | 'expired' | 'archived'
  effectiveFrom: string | null
  effectiveUntil: string | null
  entryCount: number
}

export type SolutionsOverview = {
  sourceMode: SolutionsSourceMode
  releases: EligibleRelease[]
  requests: SolutionRequest[]
  eligibility: EligibilityResult[]
  scenarios: SolutionScenario[]
  b2cSellables: Sellable[]
  b2bSellables: Sellable[]
  ontology: OntologyOption[]
  journeyRequests: JourneyRequest[]
  journeyScenarios: JourneyScenario[]
  readyPlans: ReadyLearningPlan[]
  priceBooks: PriceBookSummary[]
  metrics: {
    eligibleReleases: number
    requestsInProgress: number
    scenariosAwaitingDecision: number
    b2cPublished: number
    b2bPublished: number
    journeysAwaitingApproval: number
    pricingWarnings: number
    ontologyOptions: number
  }
}

export type CreateSolutionRequestInput = {
  title: string
  universe: CommercialUniverse
  profile: SolutionRequestProfile
  constraints: SolutionConstraints
  requestedScenarioCount: number
  priorities: ScenarioPriority[]
  scenarioRoles: ScenarioRole[]
}

export type CreateJourneyRequestInput = Omit<JourneyRequest, 'id' | 'code' | 'status' | 'createdBy' | 'createdAt'>
