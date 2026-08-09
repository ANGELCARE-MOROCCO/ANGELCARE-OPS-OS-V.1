import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { loadCollections } from '@/lib/flashcards-os/server/repository'
import { controlledBootstrapOverview, BOOTSTRAP_MODEL_PROFILES } from '@/lib/flashcards-os/intelligence/bootstrap'
import { intelligenceEnvironment, INTELLIGENCE_TENANT_KEY, INTELLIGENCE_VIEW_PREFIX, providerConfigurationStatus } from '@/lib/flashcards-os/intelligence/config'
import type {
  ActorContext,
  CreateDesignInput,
  CreateMissionInput,
  CreateOpportunityInput,
  DesignStatus,
  EvidenceClaim,
  EvidenceReviewStatus,
  IntelligenceOverview,
  IntelligenceRun,
  ModelProfile,
  OpportunityScore,
  ProductDesign,
  ProductOpportunity,
  ProviderHealth,
  ResearchMission,
  ResearchMissionStatus,
  ResearchSource,
  ResearchSynthesis,
  UsageLedgerSummary,
} from '@/lib/flashcards-os/intelligence/types'

function table(client: Awaited<ReturnType<typeof createServiceClient>>, name: string) {
  return client.from(`${INTELLIGENCE_VIEW_PREFIX}${name}`)
}

function iso(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function code(prefix: string) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  return `${prefix}-${stamp}-${randomUUID().slice(0, 6).toUpperCase()}`
}

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function mapMission(row: any): ResearchMission {
  return {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    strategicQuestion: String(row.strategic_question || ''),
    purpose: row.purpose,
    mode: row.mode,
    status: row.status,
    productDomain: row.product_domain == null ? null : String(row.product_domain),
    collectionIds: strings(row.collection_ids),
    audienceProfiles: strings(row.audience_profiles),
    geographicScope: strings(row.geographic_scope),
    languages: strings(row.languages),
    sourceCategories: strings(row.source_categories),
    includeDomains: strings(row.include_domains),
    excludeDomains: strings(row.exclude_domains),
    plannedQueries: strings(row.planned_queries),
    searchDepth: row.search_depth || 'basic',
    sourceLimit: number(row.source_limit, 8),
    budgetCredits: number(row.budget_credits, 10),
    usedCredits: number(row.used_credits),
    ownerName: String(row.owner_name || 'Direction Produit'),
    reviewerName: row.reviewer_name == null ? null : String(row.reviewer_name),
    deadline: iso(row.deadline),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    sourceCount: number(row.source_count),
    acceptedClaimCount: number(row.accepted_claim_count),
    contradictionCount: number(row.contradiction_count),
    failureReason: row.failure_reason == null ? null : String(row.failure_reason),
  }
}

function mapSource(row: any): ResearchSource {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    title: String(row.title || 'Source sans titre'),
    url: String(row.url || ''),
    domain: String(row.domain || ''),
    publicationDate: iso(row.publication_date),
    retrievalDate: iso(row.retrieval_date),
    author: row.author == null ? null : String(row.author),
    sourceCategory: String(row.source_category || 'web'),
    country: row.country == null ? null : String(row.country),
    language: row.language == null ? null : String(row.language),
    relevanceScore: number(row.relevance_score),
    freshnessScore: number(row.freshness_score),
    authorityScore: number(row.authority_score),
    qualityScore: number(row.quality_score),
    duplicateGroup: row.duplicate_group == null ? null : String(row.duplicate_group),
    reviewStatus: row.review_status,
    contentPreview: String(row.content_preview || row.normalized_content || '').slice(0, 700),
    contentHash: String(row.content_hash || ''),
    tavilyRequestId: row.tavily_request_id == null ? null : String(row.tavily_request_id),
    faviconUrl: row.favicon_url == null ? null : String(row.favicon_url),
  }
}

function mapClaim(row: any, sourceLinks: Map<string, string[]>): EvidenceClaim {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    statement: String(row.statement || ''),
    kind: row.claim_kind,
    sourceIds: sourceLinks.get(String(row.id)) || [],
    supportingExtract: String(row.supporting_extract || ''),
    confidence: number(row.confidence),
    directness: row.directness,
    contradictionIds: strings(row.contradiction_ids),
    geographicApplicability: strings(row.geographic_applicability),
    ageApplicability: strings(row.age_applicability),
    productApplicability: strings(row.product_applicability),
    reviewStatus: row.review_status,
    reviewerNote: row.reviewer_note == null ? null : String(row.reviewer_note),
  }
}

function mapSynthesis(row: any): ResearchSynthesis {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    version: number(row.version_no, 1),
    status: row.status,
    executiveAnswer: String(row.executive_answer || ''),
    findings: Array.isArray(row.findings) ? row.findings : [],
    contradictions: Array.isArray(row.contradictions) ? row.contradictions : [],
    limitations: strings(row.limitations),
    productImplications: strings(row.product_implications),
    risks: strings(row.risks),
    assumptions: strings(row.assumptions),
    remainingGaps: strings(row.remaining_gaps),
    recommendedNextAction: String(row.recommended_next_action || ''),
    modelUsed: row.model_used == null ? null : String(row.model_used),
    createdAt: iso(row.created_at),
  }
}

function mapOpportunityScore(row: any): OpportunityScore {
  return {
    evidenceStrength: number(row.evidence_strength),
    strategicFit: number(row.strategic_fit),
    portfolioGap: number(row.portfolio_gap),
    audienceValue: number(row.audience_value),
    learningValue: number(row.learning_value),
    languageRelevance: number(row.language_relevance),
    ageCoverage: number(row.age_coverage),
    contextCoverage: number(row.context_coverage),
    differentiation: number(row.differentiation),
    formatReuse: number(row.format_reuse),
    bundlePotential: number(row.bundle_potential),
    journeyPotential: number(row.journey_potential),
    commercialPotential: number(row.commercial_potential),
    productionComplexity: number(row.production_complexity),
    contentRisk: number(row.content_risk),
    culturalRisk: number(row.cultural_risk),
    rightsRisk: number(row.rights_risk),
    overlapRisk: number(row.overlap_risk),
    readinessToDesign: number(row.readiness_to_design),
    weightedTotal: number(row.weighted_total),
  }
}

function mapOpportunity(row: any, scores: Map<string, any>): ProductOpportunity {
  const scoreRow = scores.get(String(row.id)) || {}
  return {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    thesis: String(row.thesis || ''),
    problemStatement: String(row.problem_statement || ''),
    targetAudience: strings(row.target_audience),
    relatedCollectionIds: strings(row.related_collection_ids),
    relatedMissionIds: strings(row.related_mission_ids),
    evidenceClaimIds: strings(row.evidence_claim_ids),
    status: row.status,
    score: mapOpportunityScore(scoreRow),
    recommendation: String(row.recommendation || ''),
    missingEvidence: strings(row.missing_evidence),
    ownerName: String(row.owner_name || 'Direction Produit'),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function mapDesign(row: any, alternatives: Map<string, any[]>, decisions: Map<string, any[]>): ProductDesign {
  return {
    id: String(row.id),
    code: String(row.code),
    opportunityId: String(row.opportunity_id),
    title: String(row.title),
    version: number(row.version_no, 1),
    status: row.status,
    executiveThesis: String(row.executive_thesis || ''),
    problemDefinition: String(row.problem_definition || ''),
    evidenceClaimIds: strings(row.evidence_claim_ids),
    targetMarkets: strings(row.target_markets),
    learnerProfiles: strings(row.learner_profiles),
    ageRanges: strings(row.age_ranges),
    usageContexts: strings(row.usage_contexts),
    painPoints: strings(row.pain_points),
    desiredOutcomes: strings(row.desired_outcomes),
    educationalDoctrine: strings(row.educational_doctrine),
    primaryObjective: String(row.primary_objective || ''),
    secondaryObjectives: strings(row.secondary_objectives),
    contentPerimeter: strings(row.content_perimeter),
    cardArchitecture: Array.isArray(row.card_architecture) ? row.card_architecture : [],
    totalCardCountHypothesis: number(row.total_card_count_hypothesis),
    progressionModel: strings(row.progression_model),
    languageStrategy: strings(row.language_strategy),
    inclusionRequirements: strings(row.inclusion_requirements),
    culturalAdaptation: strings(row.cultural_adaptation),
    formatStrategy: strings(row.format_strategy),
    overlapAnalysis: strings(row.overlap_analysis),
    differentiation: strings(row.differentiation),
    bundleCompatibility: strings(row.bundle_compatibility),
    journeyCompatibility: strings(row.journey_compatibility),
    commercialHypothesis: strings(row.commercial_hypothesis),
    productionComplexity: strings(row.production_complexity),
    rightsAndSafetyRisks: strings(row.rights_and_safety_risks),
    openQuestions: strings(row.open_questions),
    alternatives: (alternatives.get(String(row.id)) || []).map((item) => ({
      id: String(item.id),
      name: String(item.name),
      thesis: String(item.thesis || ''),
      benefits: strings(item.benefits),
      drawbacks: strings(item.drawbacks),
      cardCountHypothesis: number(item.card_count_hypothesis),
      formats: strings(item.formats),
      audienceFit: number(item.audience_fit),
      differentiation: number(item.differentiation),
      complexity: number(item.complexity),
      risk: number(item.risk),
      recommendation: String(item.recommendation || ''),
    })),
    decisions: (decisions.get(String(row.id)) || []).map((item) => ({
      id: String(item.id),
      label: String(item.label),
      decision: String(item.decision_text || ''),
      status: item.status,
      evidenceClaimIds: strings(item.evidence_claim_ids),
    })),
    readinessScore: number(row.readiness_score),
    approvedBy: row.approved_by == null ? null : String(row.approved_by),
    approvedAt: iso(row.approved_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function mapModelProfile(row: any): ModelProfile {
  return {
    id: String(row.id),
    profileKey: String(row.profile_key),
    label: String(row.label),
    purpose: String(row.purpose || ''),
    primaryModel: 'openrouter/free',
    fallbackModels: [],
    temperature: number(row.temperature),
    maxOutputTokens: number(row.max_output_tokens, 4000),
    timeoutMs: number(row.timeout_ms, 90_000),
    retryLimit: number(row.retry_limit, 2),
    costCeilingUsd: 0,
    requireStructuredOutput: Boolean(row.require_structured_output),
    requireZdr: false,
    denyDataCollection: false,
    allowedDataClasses: strings(row.allowed_data_classes),
    status: row.status,
    updatedAt: iso(row.updated_at),
  }
}

function mapRun(row: any): IntelligenceRun {
  return {
    id: String(row.id),
    runCode: String(row.run_code),
    taskProfile: String(row.task_profile),
    status: row.status,
    provider: row.provider,
    modelRequested: row.model_requested == null ? null : String(row.model_requested),
    modelUsed: row.model_used == null ? null : String(row.model_used),
    fallbackUsed: Boolean(row.fallback_used),
    inputHash: row.input_hash == null ? null : String(row.input_hash),
    outputHash: row.output_hash == null ? null : String(row.output_hash),
    promptTokens: number(row.prompt_tokens),
    completionTokens: number(row.completion_tokens),
    totalTokens: number(row.total_tokens),
    costUsd: number(row.cost_usd),
    latencyMs: number(row.latency_ms),
    retryCount: number(row.retry_count),
    errorCode: row.error_code == null ? null : String(row.error_code),
    errorMessage: row.error_message == null ? null : String(row.error_message),
    createdAt: iso(row.created_at),
    completedAt: iso(row.completed_at),
  }
}

async function auditAndOutbox(client: Awaited<ReturnType<typeof createServiceClient>>, actor: ActorContext, input: {
  actionKey: string
  actionLabel: string
  entityType: string
  entityId: string
  summary: string
  riskLevel?: 'normal' | 'medium' | 'high' | 'critical'
  payload?: Record<string, unknown>
  eventKey: string
}) {
  const requestId = randomUUID()
  const now = new Date().toISOString()
  const [auditResult, outboxResult] = await Promise.all([
    table(client, 'audit_events').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      actor_id: actor.id,
      actor_name: actor.name,
      action_key: input.actionKey,
      action_label: input.actionLabel,
      entity_type: input.entityType,
      entity_id: input.entityId,
      summary: input.summary,
      after_payload: input.payload || {},
      risk_level: input.riskLevel || 'normal',
      request_id: requestId,
      created_at: now,
    }),
    table(client, 'outbox_events').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      event_key: input.eventKey,
      aggregate_type: input.entityType,
      aggregate_id: input.entityId,
      payload: input.payload || {},
      status: 'pending',
      attempts: 0,
      available_at: now,
      created_at: now,
    }),
  ])
  if (auditResult.error) throw auditResult.error
  if (outboxResult.error) throw outboxResult.error
}

async function loadProviderHealth(client: Awaited<ReturnType<typeof createServiceClient>>): Promise<ProviderHealth[]> {
  const configuration = providerConfigurationStatus()
  const { data } = await table(client, 'provider_health_events')
    .select('*')
    .eq('tenant_key', INTELLIGENCE_TENANT_KEY)
    .order('created_at', { ascending: false })
    .limit(40)

  return (['tavily', 'openrouter'] as const).map((provider) => {
    const rows = (data || []).filter((item: any) => item.provider === provider)
    const lastSuccess = rows.find((item: any) => item.status === 'success')
    const lastFailure = rows.find((item: any) => item.status === 'failure')
    const configured = provider === 'tavily' ? configuration.tavilyConfigured : configuration.openrouterConfigured
    return {
      provider,
      configured,
      status: !configured ? 'unconfigured' : lastFailure && (!lastSuccess || String(lastFailure.created_at) > String(lastSuccess.created_at)) ? 'degraded' : 'healthy',
      lastSuccessAt: iso(lastSuccess?.created_at),
      lastFailureAt: iso(lastFailure?.created_at),
      lastError: lastFailure?.error_message == null ? (!configured ? `${provider.toUpperCase()} key absent.` : null) : String(lastFailure.error_message),
    }
  })
}

async function loadUsage(client: Awaited<ReturnType<typeof createServiceClient>>): Promise<UsageLedgerSummary> {
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
  const [{ data: usageRows }, { data: runRows }] = await Promise.all([
    table(client, 'usage_ledger').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).gte('created_at', monthStart),
    table(client, 'intelligence_runs').select('status').eq('tenant_key', INTELLIGENCE_TENANT_KEY).gte('created_at', monthStart),
  ])
  const rows = usageRows || []
  const runs = runRows || []
  return {
    tavilyCredits: rows.filter((item: any) => item.provider === 'tavily').reduce((sum: number, item: any) => sum + number(item.credits), 0),
    tavilyRequests: rows.filter((item: any) => item.provider === 'tavily').length,
    openrouterCostUsd: rows.filter((item: any) => item.provider === 'openrouter').reduce((sum: number, item: any) => sum + number(item.cost_usd), 0),
    openrouterRequests: rows.filter((item: any) => item.provider === 'openrouter').length,
    totalTokens: rows.reduce((sum: number, item: any) => sum + number(item.total_tokens), 0),
    failedRuns: runs.filter((item: any) => item.status === 'failed' || item.status === 'dead_letter').length,
    blockedRuns: runs.filter((item: any) => item.status === 'blocked').length,
    monthlyBudgetUsd: 0,
    monthlySpendUsd: rows.reduce((sum: number, item: any) => sum + number(item.cost_usd), 0),
  }
}

export async function loadIntelligenceOverview(): Promise<IntelligenceOverview> {
  const { collections } = await loadCollections()
  const fallback = controlledBootstrapOverview(collections)
  try {
    const client = await createServiceClient()
    const [
      missionsResult, sourcesResult, claimsResult, linksResult, synthesesResult,
      signalsResult, opportunitiesResult, scoresResult, designsResult, alternativesResult,
      decisionsResult, profilesResult, runsResult, providerHealth, usage,
    ] = await Promise.all([
      table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('updated_at', { ascending: false }).limit(100),
      table(client, 'research_sources').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('quality_score', { ascending: false }).limit(400),
      table(client, 'evidence_claims').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('created_at', { ascending: false }).limit(600),
      table(client, 'claim_source_links').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).limit(1500),
      table(client, 'research_syntheses').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('created_at', { ascending: false }).limit(100),
      table(client, 'intelligence_signals').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('strength', { ascending: false }).limit(200),
      table(client, 'product_opportunities').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('updated_at', { ascending: false }).limit(200),
      table(client, 'opportunity_scores').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).limit(300),
      table(client, 'product_designs').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('updated_at', { ascending: false }).limit(150),
      table(client, 'design_alternatives').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('sort_order').limit(600),
      table(client, 'design_decisions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('created_at').limit(600),
      table(client, 'model_profiles').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('profile_key').limit(100),
      table(client, 'intelligence_runs').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).order('created_at', { ascending: false }).limit(250),
      loadProviderHealth(client),
      loadUsage(client),
    ])

    const criticalError = [missionsResult, sourcesResult, claimsResult, synthesesResult, opportunitiesResult, designsResult, profilesResult].find((result) => result.error)
    if (criticalError?.error) return fallback

    const sourceLinks = new Map<string, string[]>()
    for (const link of linksResult.data || []) {
      const list = sourceLinks.get(String(link.claim_id)) || []
      list.push(String(link.source_id))
      sourceLinks.set(String(link.claim_id), list)
    }
    const scoreMap = new Map<string, any>((scoresResult.data || []).map((item: any) => [String(item.opportunity_id), item] as [string, any]))
    const alternativesMap = new Map<string, any[]>()
    for (const item of alternativesResult.data || []) {
      const list = alternativesMap.get(String(item.design_id)) || []
      list.push(item)
      alternativesMap.set(String(item.design_id), list)
    }
    const decisionsMap = new Map<string, any[]>()
    for (const item of decisionsResult.data || []) {
      const list = decisionsMap.get(String(item.design_id)) || []
      list.push(item)
      decisionsMap.set(String(item.design_id), list)
    }

    const missions = (missionsResult.data || []).map(mapMission)
    const sources = (sourcesResult.data || []).map(mapSource)
    const claims = (claimsResult.data || []).map((row: any) => mapClaim(row, sourceLinks))
    const syntheses = (synthesesResult.data || []).map(mapSynthesis)
    const opportunities = (opportunitiesResult.data || []).map((row: any) => mapOpportunity(row, scoreMap))
    const designs = (designsResult.data || []).map((row: any) => mapDesign(row, alternativesMap, decisionsMap))
    const profiles = (profilesResult.data || []).map(mapModelProfile)
    const runs = (runsResult.data || []).map(mapRun)
    const dbSignals = (signalsResult.data || []).map((row: any) => ({
      id: String(row.id),
      signalType: String(row.signal_type),
      title: String(row.title),
      detail: String(row.detail || ''),
      strength: number(row.strength),
      sourceType: row.source_type,
      sourceEntityId: row.source_entity_id == null ? null : String(row.source_entity_id),
      status: row.status,
      createdAt: iso(row.created_at),
    }))

    const signals = dbSignals.length ? dbSignals : fallback.signals
    const resolvedProfiles = profiles.length ? profiles : BOOTSTRAP_MODEL_PROFILES
    const resolvedOpportunities = opportunities.length ? opportunities : fallback.opportunities
    return {
      sourceMode: 'database',
      missions,
      sources,
      claims,
      syntheses,
      signals,
      opportunities: resolvedOpportunities,
      designs,
      modelProfiles: resolvedProfiles,
      runs,
      providerHealth,
      usage,
      metrics: {
        activeMissions: missions.filter((item: ResearchMission) => !['completed', 'cancelled', 'failed', 'archived'].includes(item.status)).length,
        pendingEvidence: sources.filter((item: ResearchSource) => item.reviewStatus === 'pending' || item.reviewStatus === 'needs_verification').length,
        contradictions: claims.reduce((sum: number, item: EvidenceClaim) => sum + item.contradictionIds.length, 0),
        qualifiedOpportunities: resolvedOpportunities.filter((item: ProductOpportunity) => ['qualified', 'shortlisted', 'design_authorised'].includes(item.status)).length,
        designsAwaitingDecision: designs.filter((item: ProductDesign) => ['review', 'rework'].includes(item.status)).length,
        blockedRuns: runs.filter((item: IntelligenceRun) => item.status === 'blocked' || item.status === 'dead_letter').length,
      },
    }
  } catch {
    return fallback
  }
}

export async function loadResearchMission(missionId: string) {
  const overview = await loadIntelligenceOverview()
  return {
    sourceMode: overview.sourceMode,
    mission: overview.missions.find((item) => item.id === missionId || item.code === missionId) || null,
    sources: overview.sources.filter((item) => item.missionId === missionId),
    claims: overview.claims.filter((item) => item.missionId === missionId),
    syntheses: overview.syntheses.filter((item) => item.missionId === missionId),
    runs: overview.runs.filter((item) => item.runCode.includes(missionId.slice(0, 8))),
  }
}

export async function loadResearchSynthesis(synthesisId: string) {
  const overview = await loadIntelligenceOverview()
  const synthesis = overview.syntheses.find((item) => item.id === synthesisId) || null
  const mission = synthesis ? overview.missions.find((item) => item.id === synthesis.missionId) || null : null
  const claims = synthesis ? overview.claims.filter((item) => item.missionId === synthesis.missionId) : []
  const sources = synthesis ? overview.sources.filter((item) => item.missionId === synthesis.missionId) : []
  return { sourceMode: overview.sourceMode, synthesis, mission, claims, sources }
}

export async function loadProductOpportunity(opportunityId: string) {
  const overview = await loadIntelligenceOverview()
  const opportunity = overview.opportunities.find((item) => item.id === opportunityId || item.code === opportunityId) || null
  const designs = opportunity ? overview.designs.filter((item) => item.opportunityId === opportunity.id) : []
  const claims = opportunity ? overview.claims.filter((item) => opportunity.evidenceClaimIds.includes(item.id)) : []
  const missions = opportunity ? overview.missions.filter((item) => opportunity.relatedMissionIds.includes(item.id)) : []
  return { sourceMode: overview.sourceMode, opportunity, designs, claims, missions }
}

export async function loadProductDesign(designId: string) {
  const overview = await loadIntelligenceOverview()
  const design = overview.designs.find((item) => item.id === designId || item.code === designId) || null
  const opportunity = design ? overview.opportunities.find((item) => item.id === design.opportunityId) || null : null
  const claims = design ? overview.claims.filter((item) => design.evidenceClaimIds.includes(item.id)) : []
  return { sourceMode: overview.sourceMode, design, opportunity, claims }
}

export async function createResearchMission(input: CreateMissionInput, actor: ActorContext) {
  if (!input.title.trim() || !input.strategicQuestion.trim() || !input.plannedQueries?.length) throw new Error('Mission title, strategic question and at least one query are required.')
  const env = intelligenceEnvironment()
  const client = await createServiceClient()
  const missionCode = code('RSCH')
  const row = {
    tenant_key: INTELLIGENCE_TENANT_KEY,
    code: missionCode,
    title: input.title.trim(),
    strategic_question: input.strategicQuestion.trim(),
    purpose: input.purpose,
    mode: input.mode,
    status: 'draft',
    product_domain: input.productDomain?.trim() || null,
    collection_ids: input.collectionIds || [],
    audience_profiles: input.audienceProfiles || [],
    geographic_scope: input.geographicScope || [],
    languages: input.languages || ['fr'],
    source_categories: input.sourceCategories || [],
    include_domains: input.includeDomains || [],
    exclude_domains: input.excludeDomains || [],
    planned_queries: input.plannedQueries.map((item) => item.trim()).filter(Boolean).slice(0, 12),
    search_depth: input.searchDepth || 'basic',
    source_limit: Math.min(20, Math.max(1, input.sourceLimit || 8)),
    budget_credits: Math.min(env.governance.maximumMissionCredits, Math.max(1, input.budgetCredits || 12)),
    used_credits: 0,
    owner_name: input.ownerName?.trim() || actor.name,
    reviewer_name: input.reviewerName?.trim() || null,
    deadline: input.deadline || null,
    created_by: actor.id,
  }
  const { data, error } = await table(client, 'research_missions').insert(row).select('*').single()
  if (error) throw error
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.research.created',
    actionLabel: 'Mission de recherche créée',
    entityType: 'research_mission',
    entityId: String(data.id),
    summary: `${missionCode} · ${row.title}`,
    payload: { missionCode, purpose: input.purpose, mode: input.mode },
    eventKey: 'research.mission.created',
  })
  return mapMission(data)
}

export async function updateResearchMissionStatus(missionId: string, status: ResearchMissionStatus, actor: ActorContext, note?: string) {
  const client = await createServiceClient()
  const allowed: ResearchMissionStatus[] = ['draft', 'submitted', 'approved', 'queued', 'acquiring', 'evidence_review', 'ready_for_synthesis', 'synthesising', 'human_review', 'completed', 'cancelled', 'failed', 'archived']
  if (!allowed.includes(status)) throw new Error('Invalid research mission status.')
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') { patch.approved_by = actor.id; patch.approved_at = new Date().toISOString() }
  if (status === 'cancelled') { patch.cancelled_by = actor.id; patch.cancelled_at = new Date().toISOString(); patch.cancellation_note = note || null }
  const { data, error } = await table(client, 'research_missions').update(patch).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).select('*').single()
  if (error) throw error
  await auditAndOutbox(client, actor, {
    actionKey: `intelligence.research.${status}`,
    actionLabel: `Mission de recherche → ${status}`,
    entityType: 'research_mission',
    entityId: missionId,
    summary: `${data.code} · ${status}`,
    riskLevel: ['cancelled', 'failed'].includes(status) ? 'high' : status === 'approved' ? 'medium' : 'normal',
    payload: { status, note: note || null },
    eventKey: `research.mission.${status}`,
  })
  return mapMission(data)
}

export async function queueResearchMission(missionId: string, actor: ActorContext) {
  const client = await createServiceClient()
  const { data: mission, error: missionError } = await table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single()
  if (missionError) throw missionError
  if (!['approved', 'failed'].includes(String(mission.status))) throw new Error('Only approved or failed research missions can be queued.')
  const idempotencyKey = `mission-acquisition:${missionId}:${hash(mission.planned_queries)}`
  const { data: job, error: jobError } = await table(client, 'intelligence_jobs').upsert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    idempotency_key: idempotencyKey,
    job_type: 'mission_acquisition',
    entity_type: 'research_mission',
    entity_id: missionId,
    status: 'queued',
    priority: 70,
    max_attempts: intelligenceEnvironment().governance.maximumRetries,
    payload: { missionId },
    available_at: new Date().toISOString(),
    created_by: actor.id,
  }, { onConflict: 'tenant_key,idempotency_key' }).select('*').single()
  if (jobError) throw jobError
  const { error: missionUpdateError } = await table(client, 'research_missions').update({ status: 'queued', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
  if (missionUpdateError) throw missionUpdateError
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.research.queued',
    actionLabel: 'Mission placée dans la file intelligence',
    entityType: 'research_mission',
    entityId: missionId,
    summary: `${mission.code} · job ${job.id}`,
    payload: { jobId: job.id, idempotencyKey },
    eventKey: 'research.mission.queued',
  })
  return { jobId: String(job.id), status: String(job.status), idempotencyKey }
}

export async function reviewEvidence(sourceId: string, reviewStatus: EvidenceReviewStatus, note: string, actor: ActorContext) {
  if (!['accepted', 'rejected', 'needs_verification'].includes(reviewStatus)) throw new Error('Invalid evidence decision.')
  if (!note.trim()) throw new Error('A review justification is required.')
  const client = await createServiceClient()
  const now = new Date().toISOString()
  const { data: source, error } = await table(client, 'research_sources').update({
    review_status: reviewStatus,
    reviewed_by: actor.id,
    reviewer_note: note.trim(),
    reviewed_at: now,
    updated_at: now,
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', sourceId).select('*').single()
  if (error) throw error
  await table(client, 'evidence_reviews').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    entity_type: 'source',
    entity_id: sourceId,
    decision: reviewStatus,
    note: note.trim(),
    reviewer_id: actor.id,
    reviewer_name: actor.name,
    created_at: now,
  })
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.evidence.reviewed',
    actionLabel: 'Source arbitrée',
    entityType: 'research_source',
    entityId: sourceId,
    summary: `${source.title} · ${reviewStatus}`,
    riskLevel: reviewStatus === 'accepted' ? 'medium' : 'normal',
    payload: { reviewStatus, note },
    eventKey: 'research.evidence.reviewed',
  })
  return mapSource(source)
}

export async function queueSynthesis(missionId: string, actor: ActorContext) {
  const client = await createServiceClient()
  const { count, error: countError } = await table(client, 'research_sources').select('id', { count: 'exact', head: true }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId).eq('review_status', 'accepted')
  if (countError) throw countError
  if (!count) throw new Error('At least one accepted source is required before synthesis.')
  const idempotencyKey = `mission-synthesis:${missionId}:${count}`
  const { data, error } = await table(client, 'intelligence_jobs').upsert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    idempotency_key: idempotencyKey,
    job_type: 'research_synthesis',
    entity_type: 'research_mission',
    entity_id: missionId,
    status: 'queued',
    priority: 75,
    max_attempts: intelligenceEnvironment().governance.maximumRetries,
    payload: { missionId },
    available_at: new Date().toISOString(),
    created_by: actor.id,
  }, { onConflict: 'tenant_key,idempotency_key' }).select('*').single()
  if (error) throw error
  await table(client, 'research_missions').update({ status: 'ready_for_synthesis', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.synthesis.queued',
    actionLabel: 'Synthèse de recherche mise en file',
    entityType: 'research_mission',
    entityId: missionId,
    summary: `Synthèse prête · ${count} source(s) acceptée(s)`,
    payload: { jobId: data.id, acceptedSources: count },
    eventKey: 'research.synthesis.queued',
  })
  return { jobId: String(data.id), status: String(data.status) }
}

export async function createProductOpportunity(input: CreateOpportunityInput, actor: ActorContext) {
  if (!input.title.trim() || !input.thesis.trim() || !input.problemStatement.trim()) throw new Error('Opportunity title, thesis and problem statement are required.')
  const client = await createServiceClient()
  const opportunityCode = code('OPP')
  const { data, error } = await table(client, 'product_opportunities').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    code: opportunityCode,
    title: input.title.trim(),
    thesis: input.thesis.trim(),
    problem_statement: input.problemStatement.trim(),
    target_audience: input.targetAudience || [],
    related_collection_ids: input.relatedCollectionIds || [],
    related_mission_ids: input.relatedMissionIds || [],
    evidence_claim_ids: input.evidenceClaimIds || [],
    status: (input.evidenceClaimIds?.length ? 'qualified' : 'candidate'),
    recommendation: input.evidenceClaimIds?.length ? 'Soumettre à la qualification déterministe et à la décision Product Direction.' : 'Acquérir ou lier des preuves avant qualification.',
    missing_evidence: input.evidenceClaimIds?.length ? [] : ['Preuves externes ou internes validées'],
    owner_name: input.ownerName || actor.name,
    created_by: actor.id,
  }).select('*').single()
  if (error) throw error
  const defaultScore = {
    tenant_key: INTELLIGENCE_TENANT_KEY,
    opportunity_id: data.id,
    evidence_strength: input.evidenceClaimIds?.length ? 58 : 20,
    strategic_fit: 70,
    portfolio_gap: 65,
    audience_value: 70,
    learning_value: 75,
    language_relevance: 65,
    age_coverage: 55,
    context_coverage: 60,
    differentiation: 60,
    format_reuse: 70,
    bundle_potential: 68,
    journey_potential: 72,
    commercial_potential: 65,
    production_complexity: 50,
    content_risk: 40,
    cultural_risk: 35,
    rights_risk: 30,
    overlap_risk: 45,
    readiness_to_design: input.evidenceClaimIds?.length ? 58 : 32,
    weighted_total: input.evidenceClaimIds?.length ? 64 : 48,
    score_version: 'UMZ2-1.0',
  }
  const { data: scoreRow, error: scoreError } = await table(client, 'opportunity_scores').insert(defaultScore).select('*').single()
  if (scoreError) throw scoreError
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.opportunity.created',
    actionLabel: 'Opportunité produit créée',
    entityType: 'product_opportunity',
    entityId: String(data.id),
    summary: `${opportunityCode} · ${data.title}`,
    payload: { opportunityCode },
    eventKey: 'product.opportunity.created',
  })
  return mapOpportunity(data, new Map([[String(data.id), scoreRow]]))
}

export async function decideProductOpportunity(opportunityId: string, status: ProductOpportunity['status'], note: string, actor: ActorContext) {
  const allowed: ProductOpportunity['status'][] = ['candidate', 'evidence_requested', 'qualified', 'shortlisted', 'design_authorised', 'design_active', 'approved', 'rejected', 'deferred', 'archived']
  if (!allowed.includes(status)) throw new Error('Invalid product opportunity decision.')
  if (!note.trim()) throw new Error('A decision note is required.')
  const client = await createServiceClient()
  const { data, error } = await table(client, 'product_opportunities').update({ status, updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', opportunityId).select('*').single()
  if (error) throw error
  await table(client, 'opportunity_decisions').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    opportunity_id: opportunityId,
    decision: status,
    note: note.trim(),
    decided_by: actor.id,
    decided_by_name: actor.name,
  })
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.opportunity.decided',
    actionLabel: `Opportunité → ${status}`,
    entityType: 'product_opportunity',
    entityId: opportunityId,
    summary: `${data.code} · ${status}`,
    riskLevel: ['approved', 'design_authorised', 'rejected'].includes(status) ? 'high' : 'medium',
    payload: { status, note },
    eventKey: `product.opportunity.${status}`,
  })
  const { data: scoreRow } = await table(client, 'opportunity_scores').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('opportunity_id', opportunityId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return mapOpportunity(data, new Map([[opportunityId, scoreRow || {}]]))
}

export async function createProductDesign(input: CreateDesignInput, actor: ActorContext) {
  if (!input.opportunityId || !input.title.trim() || !input.executiveThesis.trim()) throw new Error('Opportunity, design title and thesis are required.')
  const client = await createServiceClient()
  const designCode = code('DSN')
  const { data: opportunity, error: opportunityError } = await table(client, 'product_opportunities').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', input.opportunityId).single()
  if (opportunityError) throw opportunityError
  if (!['shortlisted', 'design_authorised', 'design_active', 'approved'].includes(String(opportunity.status))) throw new Error('The opportunity must be shortlisted or authorised before product design begins.')
  const { data, error } = await table(client, 'product_designs').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    code: designCode,
    opportunity_id: input.opportunityId,
    title: input.title.trim(),
    version_no: 1,
    status: 'draft',
    executive_thesis: input.executiveThesis.trim(),
    problem_definition: input.problemDefinition.trim(),
    evidence_claim_ids: opportunity.evidence_claim_ids || [],
    target_markets: opportunity.target_audience || [],
    learner_profiles: [],
    age_ranges: [],
    usage_contexts: [],
    pain_points: [],
    desired_outcomes: [],
    educational_doctrine: [],
    primary_objective: '',
    secondary_objectives: [],
    content_perimeter: [],
    card_architecture: [],
    total_card_count_hypothesis: 0,
    progression_model: [],
    language_strategy: [],
    inclusion_requirements: [],
    cultural_adaptation: [],
    format_strategy: [],
    overlap_analysis: [],
    differentiation: [],
    bundle_compatibility: [],
    journey_compatibility: [],
    commercial_hypothesis: [],
    production_complexity: [],
    rights_and_safety_risks: [],
    open_questions: [],
    readiness_score: 15,
    created_by: actor.id,
  }).select('*').single()
  if (error) throw error
  await table(client, 'product_opportunities').update({ status: 'design_active', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', input.opportunityId)
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.design.created',
    actionLabel: 'Product Design ouvert',
    entityType: 'product_design',
    entityId: String(data.id),
    summary: `${designCode} · ${data.title}`,
    payload: { opportunityId: input.opportunityId },
    eventKey: 'product.design.created',
  })
  return mapDesign(data, new Map(), new Map())
}

export async function createProductDesignVersion(designId: string, changeSummary: string, actor: ActorContext) {
  if (!changeSummary.trim()) throw new Error('A change summary is required.')
  const client = await createServiceClient()
  const { data: current, error: currentError } = await table(client, 'product_designs').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).single()
  if (currentError) throw currentError
  const nextVersion = number(current.version_no, 1) + 1
  const snapshot = { ...current, id: undefined, created_at: undefined, updated_at: undefined }
  const { error: versionError } = await table(client, 'product_design_versions').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    design_id: designId,
    version_no: number(current.version_no, 1),
    status: current.status,
    change_summary: changeSummary.trim(),
    design_snapshot: current,
    created_by: actor.id,
  })
  if (versionError) throw versionError
  const { data, error } = await table(client, 'product_designs').update({ ...snapshot, version_no: nextVersion, status: 'rework', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).select('*').single()
  if (error) throw error
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.design.versioned',
    actionLabel: 'Nouvelle version Product Design',
    entityType: 'product_design',
    entityId: designId,
    summary: `${current.code} · version ${nextVersion}`,
    payload: { previousVersion: current.version_no, nextVersion, changeSummary },
    eventKey: 'product.design.versioned',
  })
  return mapDesign(data, new Map(), new Map())
}

export async function decideProductDesign(designId: string, status: DesignStatus, note: string, actor: ActorContext) {
  if (!['review', 'approved', 'rework', 'rejected', 'ready_for_umz3', 'archived'].includes(status)) throw new Error('Invalid product design decision.')
  if (!note.trim()) throw new Error('A decision note is required.')
  const client = await createServiceClient()
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved' || status === 'ready_for_umz3') { patch.approved_by = actor.name; patch.approved_at = new Date().toISOString() }
  const { data, error } = await table(client, 'product_designs').update(patch).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).select('*').single()
  if (error) throw error
  await table(client, 'design_decisions').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    design_id: designId,
    label: `Décision ${status}`,
    decision_text: note.trim(),
    status: status === 'approved' || status === 'ready_for_umz3' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'rework' ? 'rework' : 'pending',
    evidence_claim_ids: data.evidence_claim_ids || [],
    decided_by: actor.id,
    decided_by_name: actor.name,
  })
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.design.decided',
    actionLabel: `Product Design → ${status}`,
    entityType: 'product_design',
    entityId: designId,
    summary: `${data.code} · ${status}`,
    riskLevel: ['approved', 'ready_for_umz3', 'rejected'].includes(status) ? 'high' : 'medium',
    payload: { status, note },
    eventKey: `product.design.${status}`,
  })
  return mapDesign(data, new Map(), new Map())
}

export async function updateModelProfile(profileId: string, patch: Partial<ModelProfile>, actor: ActorContext) {
  const client = await createServiceClient()
  const updates: Record<string, unknown> = {
    primary_model: 'openrouter/free',
    fallback_models: [],
    cost_ceiling_usd: 0,
    require_zdr: false,
    deny_data_collection: false,
  }
  if (patch.temperature !== undefined) updates.temperature = Math.min(2, Math.max(0, patch.temperature))
  if (patch.maxOutputTokens !== undefined) updates.max_output_tokens = Math.min(50_000, Math.max(256, patch.maxOutputTokens))
  if (patch.timeoutMs !== undefined) updates.timeout_ms = Math.min(180_000, Math.max(10_000, patch.timeoutMs))
  if (patch.retryLimit !== undefined) updates.retry_limit = Math.min(8, Math.max(0, patch.retryLimit))
  if (patch.requireStructuredOutput !== undefined) updates.require_structured_output = patch.requireStructuredOutput
  if (patch.allowedDataClasses !== undefined) updates.allowed_data_classes = patch.allowedDataClasses
  if (patch.status !== undefined) updates.status = patch.status
  updates.updated_by = actor.id
  updates.updated_at = new Date().toISOString()
  const { data, error } = await table(client, 'model_profiles').update(updates).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', profileId).select('*').single()
  if (error) throw error
  await auditAndOutbox(client, actor, {
    actionKey: 'intelligence.task_policy.updated',
    actionLabel: 'Politique d’exécution IA mise à jour',
    entityType: 'model_profile',
    entityId: profileId,
    summary: `${data.profile_key} · openrouter/free`,
    riskLevel: 'high',
    payload: { changedFields: Object.keys(updates).filter((key) => !['updated_by', 'updated_at'].includes(key)) },
    eventKey: 'intelligence.task_policy.updated',
  })
  return mapModelProfile(data)
}

export async function loadModelProfile(profileKey: string): Promise<ModelProfile> {
  try {
    const client = await createServiceClient()
    const { data, error } = await table(client, 'model_profiles').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('profile_key', profileKey).eq('status', 'active').maybeSingle()
    if (!error && data) return mapModelProfile(data)
  } catch {
    // Use the controlled bootstrap contract.
  }
  return BOOTSTRAP_MODEL_PROFILES.find((item) => item.profileKey === profileKey) || BOOTSTRAP_MODEL_PROFILES[0]
}
