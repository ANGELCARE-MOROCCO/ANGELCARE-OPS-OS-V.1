import type {
  IntelligenceOverview,
  IntelligenceSignal,
  ModelProfile,
  ProductOpportunity,
  ProviderHealth,
  ResearchMission,
  UsageLedgerSummary,
} from '@/lib/flashcards-os/intelligence/types'
import type { CollectionSummary } from '@/lib/flashcards-os/types'
import { providerConfigurationStatus } from '@/lib/flashcards-os/intelligence/config'

export const BOOTSTRAP_MODEL_PROFILES: ModelProfile[] = [
  ['external_research_synthesis','External Research Synthesis','Synthèse structurée des preuves Tavily après arbitrage.',0.15,7000,90000,['public_evidence','portfolio_aggregate']],
  ['evidence_claim_extraction','Evidence Claim Extraction','Extraction de claims, limites et contradictions depuis les preuves.',0,4200,75000,['public_evidence']],
  ['portfolio_gap_analysis','Portfolio Gap Analysis','Analyse interne des trous de couverture et duplications.',0.1,5000,90000,['portfolio_aggregate','collection_metadata']],
  ['product_opportunity_architect','Product Opportunity Architect','Transformation des signaux en opportunités produit explicables.',0.2,6000,100000,['public_evidence','portfolio_aggregate','collection_metadata']],
  ['product_concept_designer','Product Concept Designer','Architecture du Product Design avant production externe.',0.25,12000,120000,['public_evidence','portfolio_aggregate','collection_metadata','approved_product_decisions']],
  ['product_design_critic','Product Design Critic','Revue des contradictions, risques et arbitrages produit.',0.1,6500,100000,['public_evidence','portfolio_aggregate','approved_product_decisions']],
  ['production_command_compiler','Production Command Compiler','Compilation des commandes de production externe sans génération d’actif.',0.15,14000,120000,['approved_product_decisions','collection_metadata','public_evidence']],
  ['flashcards_solution_composer','Sellable Solution Composer','Composition de solutions B2C/B2B à partir de releases approuvées.',0.25,18000,150000,['approved_product_decisions','collection_metadata','commercial_rules']],
  ['flashcards_learning_journey_architect','Learning Journey Architect','Architecture détaillée des programmes jour/session.',0.25,18000,150000,['approved_product_decisions','collection_metadata','learning_objectives']],
  ['commercial_intelligence','Commercial Intelligence','Analyse commerciale interne strictement consultative.',0.2,6000,120000,['commercial_context','approved_product_decisions']],
  ['experience_advisory','Customer Experience Advisory','Synthèse et recommandations CX strictement consultatives.',0.15,6000,120000,['customer_experience_context','approved_product_decisions']],
].map(([profileKey,label,purpose,temperature,maxOutputTokens,timeoutMs,allowedDataClasses]) => ({
  id: `profile-${String(profileKey).replaceAll('_','-')}`,
  profileKey: String(profileKey),
  label: String(label),
  purpose: String(purpose),
  primaryModel: 'openrouter/free',
  fallbackModels: [],
  temperature: Number(temperature),
  maxOutputTokens: Number(maxOutputTokens),
  timeoutMs: Number(timeoutMs),
  retryLimit: 2,
  costCeilingUsd: 0,
  requireStructuredOutput: true,
  requireZdr: false,
  denyDataCollection: false,
  allowedDataClasses: allowedDataClasses as string[],
  status: 'active' as const,
  updatedAt: null,
}))

function nowIso() {
  return new Date().toISOString()
}

function missingCoverageSignals(collections: CollectionSummary[]): IntelligenceSignal[] {
  const structuredEmpty = collections.filter((item) => item.structuredCardCount === 0)
  const missingAge = collections.filter((item) => item.ageMinMonths == null || item.ageMaxMonths == null)
  const missingCount = collections.filter((item) => item.expectedCardCount == null)
  const issueHeavy = collections.filter((item) => item.issueCount > 0)
  const domains = new Map<string, number>()
  for (const item of collections) domains.set(item.parentCategoryName, (domains.get(item.parentCategoryName) || 0) + 1)

  return [
    {
      id: 'signal-card-structuring-gap',
      signalType: 'portfolio_content_gap',
      title: 'Registres carte par carte encore non structurés',
      detail: `${structuredEmpty.length} collection(s) possèdent une quantité historique mais aucun contenu carte canonique. Le signal recommande une priorisation par valeur et réutilisabilité, sans inventer le contenu absent.`,
      strength: structuredEmpty.length ? 96 : 10,
      sourceType: 'internal',
      sourceEntityId: 'portfolio-flashcards',
      status: 'new',
      createdAt: nowIso(),
    },
    {
      id: 'signal-age-coverage-gap',
      signalType: 'audience_data_gap',
      title: 'Couverture âge à gouverner',
      detail: `${missingAge.length} collection(s) nécessitent une validation explicite de l’âge minimum et maximum avant exploitation dans les futurs moteurs de solutions.`,
      strength: Math.min(100, 45 + missingAge.length),
      sourceType: 'internal',
      sourceEntityId: 'portfolio-flashcards',
      status: 'new',
      createdAt: nowIso(),
    },
    {
      id: 'signal-legacy-quantity-gap',
      signalType: 'legacy_integrity_gap',
      title: 'Quantités historiques indéterminées',
      detail: `${missingCount.length} collection(s) portent encore une quantité N/A ou non démontrée dans la source catalogue.`,
      strength: missingCount.length ? 82 : 8,
      sourceType: 'internal',
      sourceEntityId: 'legacy-catalogue-2022',
      status: 'new',
      createdAt: nowIso(),
    },
    {
      id: 'signal-import-anomalies',
      signalType: 'quality_signal',
      title: 'Anomalies catalogue affectant la confiance produit',
      detail: `${issueHeavy.length} collection(s) restent reliées à au moins une anomalie du catalogue source; ces décisions doivent précéder toute analyse externe qui les utiliserait comme vérité canonique.`,
      strength: issueHeavy.length ? 88 : 5,
      sourceType: 'internal',
      sourceEntityId: 'legacy-intake-control',
      status: 'new',
      createdAt: nowIso(),
    },
    {
      id: 'signal-domain-concentration',
      signalType: 'portfolio_shape',
      title: 'Concentration historique par domaines catalogue',
      detail: [...domains.entries()].map(([name, count]) => `${name}: ${count}`).join(' · '),
      strength: 72,
      sourceType: 'internal',
      sourceEntityId: 'portfolio-flashcards',
      status: 'reviewed',
      createdAt: nowIso(),
    },
  ]
}

function deterministicScore(input: Partial<ProductOpportunity['score']>): ProductOpportunity['score'] {
  const score = {
    evidenceStrength: 45,
    strategicFit: 78,
    portfolioGap: 88,
    audienceValue: 80,
    learningValue: 84,
    languageRelevance: 74,
    ageCoverage: 70,
    contextCoverage: 76,
    differentiation: 72,
    formatReuse: 82,
    bundlePotential: 81,
    journeyPotential: 86,
    commercialPotential: 74,
    productionComplexity: 58,
    contentRisk: 36,
    culturalRisk: 30,
    rightsRisk: 28,
    overlapRisk: 40,
    readinessToDesign: 62,
    weightedTotal: 75,
    ...input,
  }
  const positive = [score.evidenceStrength, score.strategicFit, score.portfolioGap, score.audienceValue, score.learningValue, score.languageRelevance, score.ageCoverage, score.contextCoverage, score.differentiation, score.formatReuse, score.bundlePotential, score.journeyPotential, score.commercialPotential, score.readinessToDesign]
  const risks = [score.productionComplexity, score.contentRisk, score.culturalRisk, score.rightsRisk, score.overlapRisk]
  score.weightedTotal = Math.max(0, Math.min(100, Math.round(positive.reduce((sum, value) => sum + value, 0) / positive.length * .82 + (100 - risks.reduce((sum, value) => sum + value, 0) / risks.length) * .18)))
  return score
}

function bootstrapOpportunities(collections: CollectionSummary[]): ProductOpportunity[] {
  const daily = collections.filter((item) => /routine|journée|maison|famille|vêtement|fourniture/i.test(item.name)).slice(0, 8)
  const emotion = collections.filter((item) => /émotion/i.test(item.name)).slice(0, 4)
  return [
    {
      id: 'opp-bootstrap-routines',
      code: 'OPP-BOOT-001',
      title: 'Architecture de routines maison multilingues',
      thesis: 'Les collections historiques liées à la journée, la maison, la famille et l’autonomie peuvent former le socle d’une nouvelle ligne produit structurée, mais la preuve externe et le contenu carte par carte doivent être acquis avant décision.',
      problemStatement: 'Le portefeuille contient plusieurs briques quotidiennes dispersées sans architecture explicite de progression, de contexte parental ni de résultat mesurable.',
      targetAudience: ['Familles avec enfants 3–7 ans', 'Crèches et maternelles', 'Professionnels de l’accompagnement'],
      relatedCollectionIds: daily.map((item) => item.id),
      relatedMissionIds: [],
      evidenceClaimIds: [],
      status: 'evidence_requested',
      score: deterministicScore({ evidenceStrength: 28, portfolioGap: 92, journeyPotential: 94, readinessToDesign: 48 }),
      recommendation: 'Lancer une mission Tavily ciblée sur les usages de supports visuels pour les routines, puis comparer les formats home/classroom et la logique de progression.',
      missingEvidence: ['Pratiques internationales récentes', 'Segmentation par âge', 'Formats institutionnels', 'Risques de surcharge visuelle'],
      ownerName: 'Direction Produit',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'opp-bootstrap-emotional-language',
      code: 'OPP-BOOT-002',
      title: 'Langage émotionnel et communication sociale',
      thesis: 'La collection historique « Les émotions » peut devenir une architecture plus large reliant vocabulaire, expression, contexte social et stratégies de régulation, sous réserve d’une doctrine et d’une preuve spécialiste robustes.',
      problemStatement: 'Le catalogue prouve l’existence d’une collection émotions, mais ne démontre pas son périmètre, sa progression, ses situations d’usage ni ses adaptations.',
      targetAudience: ['Enfants 3–10 ans', 'Parents', 'Écoles', 'Orthophonie et accompagnement spécialisé'],
      relatedCollectionIds: emotion.map((item) => item.id),
      relatedMissionIds: [],
      evidenceClaimIds: [],
      status: 'candidate',
      score: deterministicScore({ evidenceStrength: 22, audienceValue: 90, learningValue: 92, contentRisk: 48, readinessToDesign: 42 }),
      recommendation: 'Acquérir des sources institutionnelles et spécialistes avant toute architecture produit, notamment sur l’âge, la représentation culturelle et les limites d’usage.',
      missingEvidence: ['Sources spécialistes', 'Âges et complexité émotionnelle', 'Contextes thérapeutiques', 'Cadre de sécurité et non-diagnostic'],
      ownerName: 'Direction Produit',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ]
}

function providerHealth(): ProviderHealth[] {
  const status = providerConfigurationStatus()
  return [
    {
      provider: 'tavily',
      configured: status.tavilyConfigured,
      status: status.tavilyConfigured ? 'healthy' : 'unconfigured',
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: status.tavilyConfigured ? null : 'TAVILY_API_KEY absent.',
    },
    {
      provider: 'openrouter',
      configured: status.openrouterConfigured,
      status: status.openrouterConfigured ? 'healthy' : 'unconfigured',
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: status.openrouterConfigured ? null : 'OPENROUTER_API_KEY absent.',
    },
  ]
}

function usage(): UsageLedgerSummary {
  return {
    tavilyCredits: 0,
    tavilyRequests: 0,
    openrouterCostUsd: 0,
    openrouterRequests: 0,
    totalTokens: 0,
    failedRuns: 0,
    blockedRuns: 0,
    monthlyBudgetUsd: 0,
    monthlySpendUsd: 0,
  }
}

export function controlledBootstrapOverview(collections: CollectionSummary[]): IntelligenceOverview {
  const signals = missingCoverageSignals(collections)
  const opportunities = bootstrapOpportunities(collections)
  const missions: ResearchMission[] = []
  const baseUsage = usage()
  return {
    sourceMode: 'controlled_bootstrap',
    missions,
    sources: [],
    claims: [],
    syntheses: [],
    signals,
    opportunities,
    designs: [],
    modelProfiles: BOOTSTRAP_MODEL_PROFILES,
    runs: [],
    providerHealth: providerHealth(),
    usage: baseUsage,
    metrics: {
      activeMissions: 0,
      pendingEvidence: 0,
      contradictions: 0,
      qualifiedOpportunities: opportunities.filter((item) => ['qualified', 'shortlisted', 'design_authorised'].includes(item.status)).length,
      designsAwaitingDecision: 0,
      blockedRuns: 0,
    },
  }
}
