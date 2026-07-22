export type RevenueOsWorkspaceKey =
  | 'strategic-view'
  | 'mega-production'
  | 'digital-twin'
  | 'revenue-objectives'
  | 'signals'
  | 'strategies'
  | 'strategy-engine'
  | 'validation-council'
  | 'strategy-studio'
  | 'intelligent-commands'
  | 'active-programs'
  | 'compiled-missions'
  | 'approvals'
  | 'exceptions'
  | 'memory-learning'
  | 'audit'
  | 'settings'

export type RevenueOsHealthStatus = 'operational' | 'degraded' | 'attention' | 'offline'
export type RevenueOsMaturityStatus = 'locked' | 'ready' | 'foundation' | 'planned'
export type RevenueOsPriority = 'critical' | 'high' | 'medium' | 'low'
export type RevenueOsObjectiveStatus = 'draft' | 'submitted' | 'validated' | 'active' | 'paused' | 'completed' | 'cancelled'
export type RevenueOsExecutionMode = 'shadow' | 'recommend' | 'approval-gated' | 'limited-autonomy'
export type RevenueOsEnvironment = 'development' | 'staging' | 'production'

export type RevenueOsWorkspaceDefinition = {
  key: RevenueOsWorkspaceKey
  label: string
  shortLabel: string
  description: string
  href: string
  icon: string
  order: number
  permission: string
  status: RevenueOsMaturityStatus
  accent: 'navy' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose' | 'violet'
  contractScope: string[]
}

export type RevenueOsFeatureFlag = {
  key: string
  label: string
  description: string
  enabled: boolean
  locked: boolean
  environment: RevenueOsEnvironment | 'all'
  riskClass: 'low' | 'controlled' | 'restricted'
}

export type RevenueOsSystemCheck = {
  key: string
  label: string
  status: RevenueOsHealthStatus
  detail: string
  checkedAt: string
  action?: string
}

export type RevenueOsObjective = {
  id: string
  code: string
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  horizon: string
  priority: RevenueOsPriority
  status: RevenueOsObjectiveStatus
  executionMode: RevenueOsExecutionMode
  owner: string
  createdAt: string
  updatedAt: string
  source: 'database' | 'foundation-seed' | 'manual'
}

export type RevenueOsAuditEvent = {
  id: string
  eventId: string
  action: string
  actor: string
  actorType: 'user' | 'system' | 'migration' | 'api'
  resourceType: string
  resourceId?: string
  outcome: 'success' | 'blocked' | 'failure' | 'pending'
  summary: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export type RevenueOsFoundationBootstrap = {
  contractVersion: string
  releaseCode: string
  moduleVersion: string
  environment: RevenueOsEnvironment
  executionMode: RevenueOsExecutionMode
  storageMode: 'supabase' | 'foundation-fallback'
  generatedAt: string
  workspaces: RevenueOsWorkspaceDefinition[]
  featureFlags: RevenueOsFeatureFlag[]
  systemChecks: RevenueOsSystemCheck[]
  objectives: RevenueOsObjective[]
  auditEvents: RevenueOsAuditEvent[]
  counters: {
    workspaceCount: number
    lockedContractItems: number
    enabledFeatureFlags: number
    pendingApprovals: number
    openExceptions: number
    auditEventsToday: number
  }
}

export type RevenueOsSearchResult = {
  id: string
  type: 'workspace' | 'objective' | 'audit' | 'feature-flag' | 'status' | 'digital-twin' | 'doctrine' | 'knowledge-asset' | 'playbook' | 'knowledge-conflict' | 'revenue-signal' | 'signal-source' | 'context-snapshot' | 'revenue-command' | 'command-run'
  title: string
  subtitle: string
  href: string
  badge?: string
  keywords: string[]
}

export type RevenueOsObjectiveInput = {
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  horizon: string
  priority: RevenueOsPriority
  executionMode: RevenueOsExecutionMode
}

export type RevenueTwinStatus = 'draft' | 'needs-validation' | 'validated' | 'active' | 'inactive' | 'retired'
export type RevenueTwinAvailability = 'available' | 'conditional' | 'unavailable' | 'planned'
export type RevenueTwinConfidence = 'high' | 'medium' | 'low'
export type RevenueTwinRelationshipType = 'prerequisite' | 'complementary' | 'entry' | 'premium' | 'cross-sell' | 'upsell' | 'renewal' | 'referral' | 'prohibited'
export type RevenueTwinValidationSeverity = 'critical' | 'high' | 'medium' | 'low'
export type RevenueTwinValidationStatus = 'open' | 'acknowledged' | 'resolved' | 'waived'
export type RevenueTwinEntitySource = 'database' | 'contract-seed' | 'manual'

export type RevenueTwinSectionKey =
  | 'overview'
  | 'business-units'
  | 'offers-services'
  | 'bundles-combinations'
  | 'customer-segments'
  | 'decision-makers'
  | 'markets-territories'
  | 'channels-journeys'
  | 'pricing-margins'
  | 'capacity-constraints'
  | 'seasonality'
  | 'expansion-renewal'
  | 'revenue-dependencies'
  | 'model-validation'

export type RevenueTwinBusinessUnit = {
  id: string
  code: string
  name: string
  tagline: string
  purpose: string
  revenueModel: string
  deliveryModel: string
  ownerRole: string
  status: RevenueTwinStatus
  commercialPriority: number
  activeOffers: number
  targetSegments: number
  territories: string[]
  dependencies: string[]
  source: RevenueTwinEntitySource
  updatedAt: string
}

export type RevenueTwinOffer = {
  id: string
  code: string
  businessUnitCode: string
  family: string
  name: string
  commercialName: string
  customerProblem: string
  valueProposition: string
  deliveryFormats: string[]
  targetSegmentCodes: string[]
  decisionMakerCodes: string[]
  territoryCodes: string[]
  salesCycleDays: number
  pricingModel: string
  priceFromDh?: number
  priceToDh?: number
  targetMarginPct?: number
  maxDiscountPct?: number
  requiredCapacityCodes: string[]
  evidenceAssets: string[]
  status: RevenueTwinStatus
  availability: RevenueTwinAvailability
  source: RevenueTwinEntitySource
  updatedAt: string
}

export type RevenueTwinOfferRelationship = {
  id: string
  code: string
  sourceOfferCode: string
  targetOfferCode: string
  relationshipType: RevenueTwinRelationshipType
  rationale: string
  eligibilityRules: string[]
  timing: string
  priorityScore: number
  active: boolean
}

export type RevenueTwinBundle = {
  id: string
  code: string
  name: string
  commercialPromise: string
  segmentCodes: string[]
  offerCodes: string[]
  bundleType: 'entry' | 'growth' | 'premium' | 'retention' | 'seasonal'
  pricingLogic: string
  protectedMarginPct?: number
  status: RevenueTwinStatus
}

export type RevenueTwinCustomerSegment = {
  id: string
  code: string
  name: string
  category: string
  profile: string
  painPoints: string[]
  buyingTriggers: string[]
  trustRequirements: string[]
  likelyObjections: string[]
  preferredChannels: string[]
  bestFitOfferCodes: string[]
  budgetSensitivity: 'low' | 'medium' | 'high'
  decisionCycle: string
  lifetimeValuePotential: 'low' | 'medium' | 'high' | 'strategic'
  commercialPriority: number
  status: RevenueTwinStatus
}

export type RevenueTwinDecisionMaker = {
  id: string
  code: string
  roleName: string
  organizationTypes: string[]
  authorityLevel: 'influencer' | 'recommender' | 'co-decider' | 'final-decider' | 'gatekeeper'
  primaryConcerns: string[]
  motivations: string[]
  requiredEvidence: string[]
  objections: string[]
  preferredStyle: string
  relevantOfferCodes: string[]
  contactStrategy: string
  status: RevenueTwinStatus
}

export type RevenueTwinMarket = {
  id: string
  code: string
  country: string
  region: string
  city: string
  zones: string[]
  marketMaturity: 'emerging' | 'developing' | 'established' | 'strategic'
  priority: number
  activeBusinessUnitCodes: string[]
  immediatelyDeliverableOfferCodes: string[]
  conditionalOfferCodes: string[]
  deliveryConstraints: string[]
  seasonalWindows: string[]
  status: RevenueTwinStatus
}

export type RevenueTwinSalesChannel = {
  id: string
  code: string
  name: string
  channelType: 'whatsapp' | 'email' | 'phone' | 'field' | 'event' | 'referral' | 'partner' | 'web' | 'social'
  bestForStages: string[]
  bestForSegments: string[]
  governance: string
  measurement: string[]
  status: RevenueTwinStatus
}

export type RevenueTwinJourneyStage = {
  code: string
  name: string
  order: number
  entryCriteria: string[]
  exitCriteria: string[]
  requiredData: string[]
  requiredEvidence: string[]
  responsibleRole: string
  maximumRecommendedDays: number
  successEvent: string
  failureEvent: string
  recoveryRoute: string
}

export type RevenueTwinSalesJourney = {
  id: string
  code: string
  name: string
  businessUnitCodes: string[]
  segmentCodes: string[]
  offerCodes: string[]
  objective: string
  stages: RevenueTwinJourneyStage[]
  status: RevenueTwinStatus
}

export type RevenueTwinPriceRule = {
  id: string
  code: string
  offerCode: string
  priceBook: string
  currency: 'Dh'
  pricingModel: string
  publicPrice?: number
  partnerPrice?: number
  internalCost?: number
  deliveryCost?: number
  minimumProtectedPrice?: number
  targetMarginPct?: number
  maxDiscountPct?: number
  approvalRole: string
  effectiveFrom: string
  effectiveTo?: string
  status: RevenueTwinStatus
}

export type RevenueTwinCapacity = {
  id: string
  code: string
  name: string
  capacityType: 'trainer' | 'caregiver' | 'commercial' | 'operations' | 'inventory' | 'transport' | 'digital' | 'venue'
  unit: string
  availableQuantity: number
  reservedQuantity: number
  maximumQuantity: number
  territoryCodes: string[]
  offerCodes: string[]
  leadTimeDays: number
  constraints: string[]
  availability: RevenueTwinAvailability
  updatedAt: string
}

export type RevenueTwinDependency = {
  id: string
  code: string
  sourceType: 'offer' | 'bundle' | 'journey' | 'market'
  sourceCode: string
  dependencyType: 'hard' | 'soft' | 'financial-gate' | 'approval-gate' | 'capacity-gate' | 'delivery-gate' | 'risk-condition'
  targetType: 'capacity' | 'offer' | 'market' | 'approval' | 'payment' | 'document' | 'inventory' | 'role'
  targetCode: string
  rule: string
  failureEffect: string
  recoveryAction: string
  active: boolean
}

export type RevenueTwinSeasonalWindow = {
  id: string
  code: string
  name: string
  startMonthDay: string
  endMonthDay: string
  segmentCodes: string[]
  offerCodes: string[]
  opportunity: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  preparationLeadDays: number
  riskOfDelay: string
  recommendedActions: string[]
  status: RevenueTwinStatus
}

export type RevenueTwinGrowthPath = {
  id: string
  code: string
  pathType: 'cross-sell' | 'upsell' | 'renewal' | 'referral'
  sourceOfferCode: string
  destinationOfferCode: string
  triggerSignals: string[]
  eligibilityRules: string[]
  recommendedTiming: string
  rationale: string
  priorityScore: number
  status: RevenueTwinStatus
}

export type RevenueTwinValidationIssue = {
  id: string
  code: string
  entityType: string
  entityCode: string
  severity: RevenueTwinValidationSeverity
  category: 'completeness' | 'contradiction' | 'pricing' | 'capacity' | 'territory' | 'journey' | 'governance' | 'dependency'
  title: string
  detail: string
  recommendedAction: string
  status: RevenueTwinValidationStatus
  detectedAt: string
}

export type RevenueTwinSectionDefinition = {
  key: RevenueTwinSectionKey
  label: string
  description: string
  href: string
  icon: string
  status: 'ready' | 'needs-attention' | 'planned'
}

export type RevenueTwinCompleteness = {
  overall: number
  businessUnits: number
  offers: number
  segments: number
  decisionMakers: number
  territories: number
  journeys: number
  pricing: number
  capacity: number
  dependencies: number
  seasonality: number
  expansion: number
}

export type RevenueTwinBootstrap = {
  contractVersion: string
  releaseCode: string
  moduleVersion: string
  generatedAt: string
  storageMode: 'supabase' | 'contract-seed'
  sections: RevenueTwinSectionDefinition[]
  businessUnits: RevenueTwinBusinessUnit[]
  offers: RevenueTwinOffer[]
  offerRelationships: RevenueTwinOfferRelationship[]
  bundles: RevenueTwinBundle[]
  segments: RevenueTwinCustomerSegment[]
  decisionMakers: RevenueTwinDecisionMaker[]
  markets: RevenueTwinMarket[]
  channels: RevenueTwinSalesChannel[]
  journeys: RevenueTwinSalesJourney[]
  priceRules: RevenueTwinPriceRule[]
  capacities: RevenueTwinCapacity[]
  dependencies: RevenueTwinDependency[]
  seasonalWindows: RevenueTwinSeasonalWindow[]
  growthPaths: RevenueTwinGrowthPath[]
  validationIssues: RevenueTwinValidationIssue[]
  completeness: RevenueTwinCompleteness
  counters: {
    businessUnits: number
    activeOffers: number
    targetSegments: number
    decisionMakers: number
    activeMarkets: number
    salesJourneys: number
    openValidationIssues: number
    criticalValidationIssues: number
  }
}

export type RevenueTwinEditableEntity =
  | 'business-unit'
  | 'offer'
  | 'bundle'
  | 'offer-relationship'
  | 'segment'
  | 'decision-maker'
  | 'market'
  | 'channel'
  | 'journey'
  | 'price-rule'
  | 'capacity'
  | 'seasonal-window'
  | 'growth-path'
  | 'dependency'

export type RevenueTwinMutationInput = {
  entity: RevenueTwinEditableEntity
  operation: 'create' | 'update' | 'retire'
  id?: string
  payload: Record<string, unknown>
}


// Revenue Command OS — Mega ZIP 3: Doctrine & Institutional Memory
export type RevenueKnowledgeStatus = 'draft' | 'in-review' | 'approved' | 'effective' | 'suspended' | 'retired' | 'rejected'
export type RevenueKnowledgeConfidentiality = 'public' | 'internal' | 'confidential' | 'restricted'
export type RevenueKnowledgeSource = 'database' | 'contract-seed' | 'manual' | 'imported'
export type RevenueKnowledgeApprovalDecision = 'pending' | 'approved' | 'rejected' | 'changes-requested' | 'cancelled'
export type RevenueKnowledgeConflictStatus = 'open' | 'under-review' | 'resolved' | 'accepted-risk' | 'dismissed'
export type RevenueKnowledgeValidationSeverity = 'critical' | 'high' | 'medium' | 'low'
export type RevenueKnowledgeIndexStatus = 'not-indexed' | 'queued' | 'processing' | 'indexed' | 'failed' | 'blocked'
export type RevenueKnowledgeType =
  | 'commercial-doctrine'
  | 'policy'
  | 'playbook'
  | 'sop'
  | 'sales-script'
  | 'objection-logic'
  | 'case-study'
  | 'campaign-pattern'
  | 'offer-evidence'
  | 'pricing-rule'
  | 'legal-restriction'
  | 'brand-standard'
  | 'partner-benefit'
  | 'customer-profile'
  | 'market-positioning'
  | 'service-definition'

export type RevenueKnowledgeSectionKey =
  | 'overview'
  | 'doctrine-library'
  | 'knowledge-assets'
  | 'rules-restrictions'
  | 'scripts-objections'
  | 'cases-patterns'
  | 'playbooks-sops'
  | 'approval-desk'
  | 'conflict-resolver'
  | 'versions-provenance'
  | 'indexing-readiness'
  | 'model-validation'

export type RevenueKnowledgeSectionDefinition = {
  key: RevenueKnowledgeSectionKey
  label: string
  description: string
  href: string
  icon: string
  status: 'ready' | 'needs-attention' | 'planned'
}

export type RevenueKnowledgeContentBlock = {
  code: string
  heading: string
  body: string
  order: number
  blockType: 'principle' | 'rule' | 'procedure' | 'example' | 'warning' | 'evidence' | 'decision'
}

export type RevenueDoctrineRule = {
  code: string
  name: string
  condition: string
  requiredAction: string
  prohibitedAction?: string
  escalationRole?: string
  severity: RevenueKnowledgeValidationSeverity
  machineEnforceable: boolean
}

export type RevenueDoctrine = {
  id: string
  code: string
  title: string
  summary: string
  knowledgeType: RevenueKnowledgeType
  ownerRole: string
  department: string
  businessUnitCodes: string[]
  status: RevenueKnowledgeStatus
  confidentiality: RevenueKnowledgeConfidentiality
  version: string
  effectiveFrom?: string
  effectiveTo?: string
  nextReviewAt?: string
  reviewCycleDays: number
  supersedesCode?: string
  applicableCommandFamilies: string[]
  applicableSegmentCodes: string[]
  applicableOfferCodes: string[]
  tags: string[]
  sourceAuthority: string
  contentBlocks: RevenueKnowledgeContentBlock[]
  rules: RevenueDoctrineRule[]
  evidenceRefs: string[]
  source: RevenueKnowledgeSource
  createdAt: string
  updatedAt: string
}

export type RevenueKnowledgeAsset = {
  id: string
  code: string
  title: string
  assetType: 'document' | 'catalogue' | 'template' | 'script-library' | 'pricing-sheet' | 'case-file' | 'policy-pack' | 'dataset'
  description: string
  ownerRole: string
  businessUnitCodes: string[]
  confidentiality: RevenueKnowledgeConfidentiality
  status: RevenueKnowledgeStatus
  version: string
  effectiveFrom?: string
  sourceUri?: string
  fileName?: string
  mimeType?: string
  checksum?: string
  pageCount?: number
  language: string
  tags: string[]
  linkedDoctrineCodes: string[]
  indexStatus: RevenueKnowledgeIndexStatus
  chunkCount: number
  source: RevenueKnowledgeSource
  createdAt: string
  updatedAt: string
}

export type RevenueKnowledgeRelationship = {
  id: string
  code: string
  sourceType: 'doctrine' | 'asset' | 'playbook' | 'script' | 'case'
  sourceCode: string
  relationshipType: 'supports' | 'implements' | 'supersedes' | 'contradicts' | 'requires' | 'restricts' | 'evidences' | 'applies-to'
  targetType: 'doctrine' | 'asset' | 'playbook' | 'offer' | 'segment' | 'command-family' | 'policy'
  targetCode: string
  rationale: string
  active: boolean
}

export type RevenueSalesScript = {
  id: string
  code: string
  name: string
  channel: 'whatsapp' | 'email' | 'phone' | 'meeting' | 'field' | 'proposal'
  stage: string
  segmentCodes: string[]
  offerCodes: string[]
  objective: string
  opening: string
  body: string
  callToAction: string
  fallback: string
  prohibitedClaims: string[]
  requiredPersonalizationFields: string[]
  status: RevenueKnowledgeStatus
  version: string
  ownerRole: string
  updatedAt: string
}

export type RevenueObjectionPattern = {
  id: string
  code: string
  objection: string
  category: 'price' | 'timing' | 'trust' | 'authority' | 'capacity' | 'need' | 'competition' | 'risk' | 'delivery'
  segmentCodes: string[]
  offerCodes: string[]
  diagnosticQuestions: string[]
  responseFramework: string[]
  evidenceRefs: string[]
  escalationTrigger: string
  prohibitedResponse: string
  status: RevenueKnowledgeStatus
  updatedAt: string
}

export type RevenueCaseStudy = {
  id: string
  code: string
  title: string
  caseType: 'success' | 'failure' | 'recovery' | 'experiment'
  businessUnitCode: string
  segmentCode: string
  marketCode: string
  context: string
  problem: string
  actions: string[]
  outcome: string
  measurableSignals: Record<string, string | number>
  lessons: string[]
  reusablePatterns: string[]
  evidenceRefs: string[]
  status: RevenueKnowledgeStatus
  confidentiality: RevenueKnowledgeConfidentiality
  updatedAt: string
}

export type RevenueCampaignPattern = {
  id: string
  code: string
  name: string
  patternType: 'seasonal' | 'territory-capture' | 'pipeline-rescue' | 'launch' | 'referral' | 'renewal' | 'cross-sell'
  objective: string
  applicability: string[]
  sequence: string[]
  requiredSignals: string[]
  stopConditions: string[]
  successMetrics: string[]
  riskControls: string[]
  status: RevenueKnowledgeStatus
  version: string
  updatedAt: string
}

export type RevenuePlaybookStep = {
  code: string
  order: number
  name: string
  purpose: string
  instructions: string[]
  requiredInputs: string[]
  expectedOutputs: string[]
  evidenceRequired: string[]
  responsibleRole: string
  slaHours: number
  approvalRequired: boolean
  recoveryRoute: string
}

export type RevenuePlaybook = {
  id: string
  code: string
  name: string
  objective: string
  businessUnitCodes: string[]
  segmentCodes: string[]
  trigger: string
  preconditions: string[]
  steps: RevenuePlaybookStep[]
  completionRule: string
  escalationPolicy: string
  status: RevenueKnowledgeStatus
  version: string
  ownerRole: string
  updatedAt: string
}

export type RevenuePolicyRestriction = {
  id: string
  code: string
  name: string
  restrictionType: 'pricing' | 'discount' | 'legal' | 'brand' | 'privacy' | 'external-action' | 'capacity' | 'promise' | 'approval'
  scope: string[]
  rule: string
  prohibitedActions: string[]
  requiredApproverRole?: string
  escalationPath: string
  severity: RevenueKnowledgeValidationSeverity
  status: RevenueKnowledgeStatus
  effectiveFrom?: string
  updatedAt: string
}

export type RevenueBrandRequirement = {
  id: string
  code: string
  name: string
  scope: string[]
  requirement: string
  allowedPatterns: string[]
  prohibitedPatterns: string[]
  evidenceRequired: string[]
  status: RevenueKnowledgeStatus
  updatedAt: string
}

export type RevenuePartnerBenefit = {
  id: string
  code: string
  name: string
  segmentCodes: string[]
  offerCodes: string[]
  valueStatement: string
  eligibilityRules: string[]
  validityWindow?: string
  approvalRole: string
  communicationRules: string[]
  status: RevenueKnowledgeStatus
  updatedAt: string
}

export type RevenueKnowledgeApproval = {
  id: string
  code: string
  resourceType: 'doctrine' | 'asset' | 'script' | 'playbook' | 'case' | 'policy'
  resourceCode: string
  resourceVersion: string
  requestedBy: string
  requestedAt: string
  requiredApproverRole: string
  decision: RevenueKnowledgeApprovalDecision
  decidedBy?: string
  decidedAt?: string
  rationale?: string
  checklist: Array<{ key: string; label: string; passed: boolean }>
}

export type RevenueKnowledgeConflict = {
  id: string
  code: string
  conflictType: 'version' | 'rule' | 'pricing' | 'authority' | 'brand' | 'legal' | 'scope' | 'source'
  leftResourceCode: string
  rightResourceCode: string
  summary: string
  risk: string
  recommendedResolution: string
  status: RevenueKnowledgeConflictStatus
  severity: RevenueKnowledgeValidationSeverity
  detectedAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
}

export type RevenueKnowledgeVersion = {
  id: string
  resourceType: string
  resourceCode: string
  version: string
  status: RevenueKnowledgeStatus
  changeReason: string
  snapshotHash: string
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
}

export type RevenueKnowledgeIndexJob = {
  id: string
  code: string
  assetCode: string
  requestedAt: string
  status: RevenueKnowledgeIndexStatus
  chunkCount: number
  error?: string
  completedAt?: string
}

export type RevenueKnowledgeValidationIssue = {
  id: string
  code: string
  resourceType: string
  resourceCode: string
  category: 'completeness' | 'authority' | 'versioning' | 'conflict' | 'provenance' | 'indexing' | 'lifecycle' | 'scope' | 'restriction'
  severity: RevenueKnowledgeValidationSeverity
  title: string
  detail: string
  recommendedAction: string
  status: 'open' | 'acknowledged' | 'resolved' | 'waived'
  detectedAt: string
}

export type RevenueKnowledgeReadiness = {
  overall: number
  approvedDoctrineCoverage: number
  provenanceCoverage: number
  versionIntegrity: number
  conflictSafety: number
  indexingReadiness: number
  authorityCoverage: number
  reviewFreshness: number
}

export type RevenueKnowledgeBootstrap = {
  contractVersion: string
  releaseCode: string
  moduleVersion: string
  generatedAt: string
  storageMode: 'supabase' | 'contract-seed'
  sections: RevenueKnowledgeSectionDefinition[]
  doctrines: RevenueDoctrine[]
  assets: RevenueKnowledgeAsset[]
  relationships: RevenueKnowledgeRelationship[]
  scripts: RevenueSalesScript[]
  objections: RevenueObjectionPattern[]
  cases: RevenueCaseStudy[]
  campaignPatterns: RevenueCampaignPattern[]
  playbooks: RevenuePlaybook[]
  restrictions: RevenuePolicyRestriction[]
  brandRequirements: RevenueBrandRequirement[]
  partnerBenefits: RevenuePartnerBenefit[]
  approvals: RevenueKnowledgeApproval[]
  conflicts: RevenueKnowledgeConflict[]
  versions: RevenueKnowledgeVersion[]
  indexJobs: RevenueKnowledgeIndexJob[]
  validationIssues: RevenueKnowledgeValidationIssue[]
  readiness: RevenueKnowledgeReadiness
  counters: {
    effectiveDoctrines: number
    approvedDoctrines: number
    draftDoctrines: number
    indexedAssets: number
    openApprovals: number
    openConflicts: number
    criticalIssues: number
    overdueReviews: number
  }
}

export type RevenueDoctrineMutationInput = {
  operation: 'create' | 'update' | 'submit-review' | 'approve' | 'reject' | 'activate' | 'suspend' | 'retire'
  id?: string
  payload: Record<string, unknown>
}

// Revenue Command OS — Mega ZIP 4: Live Revenue Signal Fabric
export type RevenueSignalStatus = 'new' | 'triaged' | 'acknowledged' | 'context-ready' | 'monitoring' | 'resolved' | 'dismissed' | 'blocked'
export type RevenueSignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type RevenueSignalConfidence = 'confirmed' | 'high' | 'medium' | 'low' | 'unknown'
export type RevenueSignalSourceStatus = 'healthy' | 'degraded' | 'stale' | 'offline' | 'paused' | 'unconfigured'
export type RevenueSignalSourceKind = 'database' | 'email' | 'whatsapp' | 'calendar' | 'finance' | 'academy' | 'operations' | 'crm' | 'browser-extension' | 'manual' | 'webhook'
export type RevenueSignalCategory =
  | 'market-opportunity'
  | 'account-intent'
  | 'pipeline-risk'
  | 'engagement'
  | 'meeting'
  | 'proposal'
  | 'capacity'
  | 'payment'
  | 'renewal'
  | 'customer-risk'
  | 'seasonality'
  | 'execution'
  | 'data-quality'
  | 'competitive'
  | 'referral'
export type RevenueSignalEntityType = 'account' | 'contact' | 'opportunity' | 'proposal' | 'meeting' | 'message' | 'invoice' | 'payment' | 'training-session' | 'trainer' | 'capacity' | 'complaint' | 'territory' | 'offer' | 'campaign' | 'unknown'
export type RevenueSignalValidationSeverity = 'critical' | 'high' | 'medium' | 'low'
export type RevenueSignalSectionKey =
  | 'overview'
  | 'live-stream'
  | 'source-control'
  | 'source-health'
  | 'classification'
  | 'deduplication'
  | 'scheduled-scans'
  | 'context-snapshots'
  | 'stale-data'
  | 'subscriptions'
  | 'data-access'
  | 'model-validation'

export type RevenueSignalSectionDefinition = {
  key: RevenueSignalSectionKey
  label: string
  description: string
  href: string
  icon: string
  status: 'ready' | 'needs-attention' | 'planned'
}

export type RevenueSignalSource = {
  id: string
  code: string
  name: string
  sourceKind: RevenueSignalSourceKind
  adapterKey: string
  description: string
  businessUnitCodes: string[]
  sourceTables: string[]
  supportedEventTypes: string[]
  status: RevenueSignalSourceStatus
  pollingMinutes: number
  staleAfterMinutes: number
  lastObservedAt?: string
  lastSuccessfulScanAt?: string
  lastCursor?: string
  recordCount24h: number
  errorCount24h: number
  containsSensitiveData: boolean
  minimumPermission: string
  enabled: boolean
  updatedAt: string
}

export type RevenueRawSignalEvent = {
  id: string
  eventId: string
  sourceCode: string
  sourceRecordId?: string
  eventType: string
  occurredAt: string
  receivedAt: string
  deduplicationKey: string
  payloadHash: string
  payload: Record<string, unknown>
  processingStatus: 'received' | 'normalized' | 'duplicate' | 'rejected' | 'failed'
  duplicateOfEventId?: string
  rejectionReason?: string
}

export type RevenueSignalEntityRef = {
  entityType: RevenueSignalEntityType
  entityId?: string
  entityCode?: string
  label: string
  relationship: 'primary' | 'related' | 'owner' | 'decision-maker' | 'source' | 'dependency'
}

export type RevenueSignal = {
  id: string
  code: string
  rawEventId?: string
  sourceCode: string
  category: RevenueSignalCategory
  signalType: string
  title: string
  summary: string
  businessUnitCode?: string
  marketCode?: string
  territoryCode?: string
  offerCode?: string
  segmentCode?: string
  severity: RevenueSignalSeverity
  confidence: RevenueSignalConfidence
  priorityScore: number
  urgencyScore: number
  opportunityScore: number
  riskScore: number
  status: RevenueSignalStatus
  occurredAt: string
  detectedAt: string
  expiresAt?: string
  ownerRole?: string
  entities: RevenueSignalEntityRef[]
  evidence: Array<{ source: string; label: string; value: string; observedAt: string }>
  recommendedCommandFamilies: string[]
  recommendedNextActions: string[]
  blockingReasons: string[]
  metadata: Record<string, unknown>
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export type RevenueSignalRule = {
  id: string
  code: string
  name: string
  sourceCodes: string[]
  eventTypes: string[]
  category: RevenueSignalCategory
  signalType: string
  condition: string
  severityLogic: string
  confidenceLogic: string
  scoreLogic: string
  recommendedCommandFamilies: string[]
  expiryMinutes: number
  cooldownMinutes: number
  enabled: boolean
  version: string
  updatedAt: string
}

export type RevenueScheduledScan = {
  id: string
  code: string
  name: string
  sourceCode: string
  scheduleExpression: string
  timezone: string
  scanMode: 'incremental' | 'lookback' | 'full-safe'
  lookbackMinutes: number
  maximumRecords: number
  status: 'active' | 'paused' | 'failed' | 'planned'
  lastRunAt?: string
  nextRunAt?: string
  lastOutcome?: 'success' | 'partial' | 'failure' | 'skipped'
  lastCreatedSignals: number
  consecutiveFailures: number
}

export type RevenueSignalSourceHealth = {
  id: string
  sourceCode: string
  status: RevenueSignalSourceStatus
  checkedAt: string
  latencyMs?: number
  freshnessMinutes?: number
  recordsObserved: number
  normalizedSignals: number
  duplicateEvents: number
  failedEvents: number
  lastError?: string
  diagnostic: string
}

export type RevenueSignalContextSource = {
  sourceType: 'signal' | 'source-record' | 'digital-twin' | 'doctrine' | 'knowledge-asset' | 'historical-outcome' | 'user-context'
  sourceCode: string
  label: string
  authority: 'primary' | 'approved' | 'supporting' | 'hypothesis'
  freshness: 'live' | 'fresh' | 'aging' | 'stale' | 'unknown'
  retrievedAt: string
  redactions: string[]
}

export type RevenueSignalContextSnapshot = {
  id: string
  code: string
  signalCode: string
  purpose: string
  audienceRole: string
  visibilityProfile: 'executive' | 'revenue-manager' | 'commercial-agent' | 'auditor'
  status: 'building' | 'ready' | 'blocked' | 'expired'
  generatedAt: string
  expiresAt: string
  facts: Array<{ key: string; label: string; value: string; confidence: RevenueSignalConfidence; sourceCode: string }>
  hypotheses: Array<{ key: string; statement: string; validationMethod: string }>
  constraints: string[]
  opportunities: string[]
  risks: string[]
  sources: RevenueSignalContextSource[]
  redactedFields: string[]
  completenessScore: number
  freshnessScore: number
}

export type RevenueSignalSubscription = {
  id: string
  code: string
  name: string
  subscriberType: 'role' | 'user' | 'workspace' | 'system'
  subscriberKey: string
  categories: RevenueSignalCategory[]
  severities: RevenueSignalSeverity[]
  businessUnitCodes: string[]
  territoryCodes: string[]
  deliveryMode: 'in-app' | 'digest' | 'mission-proposal' | 'approval-queue'
  cooldownMinutes: number
  active: boolean
}

export type RevenueSignalValidationIssue = {
  id: string
  code: string
  resourceType: string
  resourceCode: string
  category: 'source' | 'freshness' | 'deduplication' | 'classification' | 'privacy' | 'context' | 'permission' | 'schedule' | 'coverage' | 'governance'
  severity: RevenueSignalValidationSeverity
  title: string
  detail: string
  recommendedAction: string
  status: 'open' | 'acknowledged' | 'resolved' | 'waived'
  detectedAt: string
}

export type RevenueSignalReadiness = {
  overall: number
  sourceCoverage: number
  sourceHealth: number
  freshness: number
  classificationCoverage: number
  deduplicationSafety: number
  contextReadiness: number
  privacySafety: number
  scheduleReliability: number
}

export type RevenueSignalBootstrap = {
  contractVersion: string
  releaseCode: string
  moduleVersion: string
  generatedAt: string
  storageMode: 'supabase' | 'contract-seed'
  executionPosture: 'shadow-observation'
  sections: RevenueSignalSectionDefinition[]
  sources: RevenueSignalSource[]
  signals: RevenueSignal[]
  rawEvents: RevenueRawSignalEvent[]
  rules: RevenueSignalRule[]
  scheduledScans: RevenueScheduledScan[]
  sourceHealth: RevenueSignalSourceHealth[]
  contextSnapshots: RevenueSignalContextSnapshot[]
  subscriptions: RevenueSignalSubscription[]
  validationIssues: RevenueSignalValidationIssue[]
  readiness: RevenueSignalReadiness
  counters: {
    sourcesEnabled: number
    sourcesHealthy: number
    signals24h: number
    criticalSignals: number
    highSignals: number
    unacknowledgedSignals: number
    duplicateEvents24h: number
    staleSources: number
    contextReady: number
    scansAtRisk: number
  }
}

export type RevenueSignalIngestionInput = {
  sourceCode: string
  sourceRecordId?: string
  eventType: string
  occurredAt?: string
  payload: Record<string, unknown>
  correlationId?: string
}
