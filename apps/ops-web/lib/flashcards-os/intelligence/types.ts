export type IntelligenceSourceMode = 'database' | 'controlled_bootstrap'

export type ResearchMissionStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'queued'
  | 'acquiring'
  | 'evidence_review'
  | 'ready_for_synthesis'
  | 'synthesising'
  | 'human_review'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'archived'

export type ResearchMode = 'rapid_scan' | 'deep_evidence' | 'known_source' | 'domain_investigation'
export type ResearchPurpose =
  | 'new_collection_opportunity'
  | 'product_concept_validation'
  | 'format_benchmark'
  | 'methodology_review'
  | 'age_suitability'
  | 'institutional_demand'
  | 'competitor_portfolio'
  | 'parent_pain_points'
  | 'specialist_use_case'
  | 'market_positioning'
  | 'cultural_adaptation'
  | 'content_gap'

export type EvidenceReviewStatus = 'pending' | 'accepted' | 'rejected' | 'needs_verification'
export type ClaimKind = 'fact' | 'market_signal' | 'methodology' | 'risk' | 'requirement' | 'benchmark' | 'inference'
export type IntelligenceRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'dead_letter' | 'blocked'
export type OpportunityStatus = 'candidate' | 'evidence_requested' | 'qualified' | 'shortlisted' | 'design_authorised' | 'design_active' | 'approved' | 'rejected' | 'deferred' | 'archived'
export type DesignStatus = 'draft' | 'researching' | 'structuring' | 'review' | 'approved' | 'rework' | 'rejected' | 'ready_for_umz3' | 'archived'
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'deferred' | 'rework'

export type ResearchMission = {
  id: string
  code: string
  title: string
  strategicQuestion: string
  purpose: ResearchPurpose
  mode: ResearchMode
  status: ResearchMissionStatus
  productDomain: string | null
  collectionIds: string[]
  audienceProfiles: string[]
  geographicScope: string[]
  languages: string[]
  sourceCategories: string[]
  includeDomains: string[]
  excludeDomains: string[]
  plannedQueries: string[]
  searchDepth: 'basic' | 'advanced'
  sourceLimit: number
  budgetCredits: number
  usedCredits: number
  ownerName: string
  reviewerName: string | null
  deadline: string | null
  createdAt: string | null
  updatedAt: string | null
  sourceCount: number
  acceptedClaimCount: number
  contradictionCount: number
  failureReason: string | null
}

export type ResearchSource = {
  id: string
  missionId: string
  title: string
  url: string
  domain: string
  publicationDate: string | null
  retrievalDate: string | null
  author: string | null
  sourceCategory: string
  country: string | null
  language: string | null
  relevanceScore: number
  freshnessScore: number
  authorityScore: number
  qualityScore: number
  duplicateGroup: string | null
  reviewStatus: EvidenceReviewStatus
  contentPreview: string
  contentHash: string
  tavilyRequestId: string | null
  faviconUrl: string | null
}

export type EvidenceClaim = {
  id: string
  missionId: string
  statement: string
  kind: ClaimKind
  sourceIds: string[]
  supportingExtract: string
  confidence: number
  directness: 'direct' | 'inferred'
  contradictionIds: string[]
  geographicApplicability: string[]
  ageApplicability: string[]
  productApplicability: string[]
  reviewStatus: EvidenceReviewStatus
  reviewerNote: string | null
}

export type ResearchSynthesis = {
  id: string
  missionId: string
  version: number
  status: 'draft' | 'review' | 'approved' | 'rejected'
  executiveAnswer: string
  findings: Array<{ title: string; conclusion: string; evidenceClaimIds: string[]; confidence: number }>
  contradictions: Array<{ issue: string; evidenceClaimIds: string[]; decisionNeeded: string }>
  limitations: string[]
  productImplications: string[]
  risks: string[]
  assumptions: string[]
  remainingGaps: string[]
  recommendedNextAction: string
  modelUsed: string | null
  createdAt: string | null
}

export type IntelligenceSignal = {
  id: string
  signalType: string
  title: string
  detail: string
  strength: number
  sourceType: 'internal' | 'external' | 'manual'
  sourceEntityId: string | null
  status: 'new' | 'reviewed' | 'converted' | 'dismissed'
  createdAt: string | null
}

export type OpportunityScore = {
  evidenceStrength: number
  strategicFit: number
  portfolioGap: number
  audienceValue: number
  learningValue: number
  languageRelevance: number
  ageCoverage: number
  contextCoverage: number
  differentiation: number
  formatReuse: number
  bundlePotential: number
  journeyPotential: number
  commercialPotential: number
  productionComplexity: number
  contentRisk: number
  culturalRisk: number
  rightsRisk: number
  overlapRisk: number
  readinessToDesign: number
  weightedTotal: number
}

export type ProductOpportunity = {
  id: string
  code: string
  title: string
  thesis: string
  problemStatement: string
  targetAudience: string[]
  relatedCollectionIds: string[]
  relatedMissionIds: string[]
  evidenceClaimIds: string[]
  status: OpportunityStatus
  score: OpportunityScore
  recommendation: string
  missingEvidence: string[]
  ownerName: string
  createdAt: string | null
  updatedAt: string | null
}

export type ProductDesignAlternative = {
  id: string
  name: string
  thesis: string
  benefits: string[]
  drawbacks: string[]
  cardCountHypothesis: number
  formats: string[]
  audienceFit: number
  differentiation: number
  complexity: number
  risk: number
  recommendation: string
}

export type ProductDesign = {
  id: string
  code: string
  opportunityId: string
  title: string
  version: number
  status: DesignStatus
  executiveThesis: string
  problemDefinition: string
  evidenceClaimIds: string[]
  targetMarkets: string[]
  learnerProfiles: string[]
  ageRanges: string[]
  usageContexts: string[]
  painPoints: string[]
  desiredOutcomes: string[]
  educationalDoctrine: string[]
  primaryObjective: string
  secondaryObjectives: string[]
  contentPerimeter: string[]
  cardArchitecture: Array<{ group: string; purpose: string; estimatedCards: number; progression: string }>
  totalCardCountHypothesis: number
  progressionModel: string[]
  languageStrategy: string[]
  inclusionRequirements: string[]
  culturalAdaptation: string[]
  formatStrategy: string[]
  overlapAnalysis: string[]
  differentiation: string[]
  bundleCompatibility: string[]
  journeyCompatibility: string[]
  commercialHypothesis: string[]
  productionComplexity: string[]
  rightsAndSafetyRisks: string[]
  openQuestions: string[]
  alternatives: ProductDesignAlternative[]
  decisions: Array<{ id: string; label: string; decision: string; status: DecisionStatus; evidenceClaimIds: string[] }>
  readinessScore: number
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ModelProfile = {
  id: string
  profileKey: string
  label: string
  purpose: string
  primaryModel: string
  fallbackModels: string[]
  temperature: number
  maxOutputTokens: number
  timeoutMs: number
  retryLimit: number
  costCeilingUsd: number
  requireStructuredOutput: boolean
  requireZdr: boolean
  denyDataCollection: boolean
  allowedDataClasses: string[]
  status: 'draft' | 'active' | 'disabled' | 'archived'
  updatedAt: string | null
}

export type IntelligenceRun = {
  id: string
  runCode: string
  taskProfile: string
  status: IntelligenceRunStatus
  provider: 'tavily' | 'openrouter' | 'internal'
  modelRequested: string | null
  modelUsed: string | null
  fallbackUsed: boolean
  inputHash: string | null
  outputHash: string | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  latencyMs: number
  retryCount: number
  errorCode: string | null
  errorMessage: string | null
  createdAt: string | null
  completedAt: string | null
}

export type ProviderHealth = {
  provider: 'tavily' | 'openrouter'
  configured: boolean
  status: 'healthy' | 'degraded' | 'unconfigured' | 'blocked'
  lastSuccessAt: string | null
  lastFailureAt: string | null
  lastError: string | null
}

export type UsageLedgerSummary = {
  tavilyCredits: number
  tavilyRequests: number
  openrouterCostUsd: number
  openrouterRequests: number
  totalTokens: number
  failedRuns: number
  blockedRuns: number
  monthlyBudgetUsd: number
  monthlySpendUsd: number
}

export type IntelligenceOverview = {
  sourceMode: IntelligenceSourceMode
  missions: ResearchMission[]
  sources: ResearchSource[]
  claims: EvidenceClaim[]
  syntheses: ResearchSynthesis[]
  signals: IntelligenceSignal[]
  opportunities: ProductOpportunity[]
  designs: ProductDesign[]
  modelProfiles: ModelProfile[]
  runs: IntelligenceRun[]
  providerHealth: ProviderHealth[]
  usage: UsageLedgerSummary
  metrics: {
    activeMissions: number
    pendingEvidence: number
    contradictions: number
    qualifiedOpportunities: number
    designsAwaitingDecision: number
    blockedRuns: number
  }
}

export type ActorContext = {
  id: string
  name: string
  role: string
}

export type CreateMissionInput = {
  title: string
  strategicQuestion: string
  purpose: ResearchPurpose
  mode: ResearchMode
  productDomain?: string
  collectionIds?: string[]
  audienceProfiles?: string[]
  geographicScope?: string[]
  languages?: string[]
  sourceCategories?: string[]
  includeDomains?: string[]
  excludeDomains?: string[]
  plannedQueries: string[]
  searchDepth?: 'basic' | 'advanced'
  sourceLimit?: number
  budgetCredits?: number
  ownerName?: string
  reviewerName?: string
  deadline?: string
}

export type CreateOpportunityInput = {
  title: string
  thesis: string
  problemStatement: string
  targetAudience: string[]
  relatedCollectionIds?: string[]
  relatedMissionIds?: string[]
  evidenceClaimIds?: string[]
  ownerName?: string
}

export type CreateDesignInput = {
  opportunityId: string
  title: string
  executiveThesis: string
  problemDefinition: string
}
