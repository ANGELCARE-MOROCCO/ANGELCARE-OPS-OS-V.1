export type JsonSchema = Record<string, unknown>

const stringArray = { type: 'array', items: { type: 'string' } }
const identifierArray = { type: 'array', items: { type: 'string' } }
const score = { type: 'number', minimum: 0, maximum: 100 }

export const EVIDENCE_EXTRACTION_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['claims', 'sourceAssessment'],
  properties: {
    claims: {
      type: 'array',
      maxItems: 24,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'statement', 'kind', 'supportingExtract', 'confidence', 'directness',
          'geographicApplicability', 'ageApplicability', 'productApplicability', 'contradictionSignals',
        ],
        properties: {
          statement: { type: 'string' },
          kind: { type: 'string', enum: ['fact', 'market_signal', 'methodology', 'risk', 'requirement', 'benchmark', 'inference'] },
          supportingExtract: { type: 'string' },
          confidence: score,
          directness: { type: 'string', enum: ['direct', 'inferred'] },
          geographicApplicability: stringArray,
          ageApplicability: stringArray,
          productApplicability: stringArray,
          contradictionSignals: stringArray,
        },
      },
    },
    sourceAssessment: {
      type: 'object',
      additionalProperties: false,
      required: ['authorityScore', 'freshnessScore', 'limitations', 'recommendedReview'],
      properties: {
        authorityScore: score,
        freshnessScore: score,
        limitations: stringArray,
        recommendedReview: { type: 'string', enum: ['accept', 'needs_verification', 'reject'] },
      },
    },
  },
}

export const RESEARCH_SYNTHESIS_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'executiveAnswer', 'findings', 'contradictions', 'limitations', 'productImplications',
    'risks', 'assumptions', 'remainingGaps', 'recommendedNextAction',
  ],
  properties: {
    executiveAnswer: { type: 'string' },
    findings: {
      type: 'array',
      maxItems: 18,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'conclusion', 'evidenceClaimIds', 'confidence'],
        properties: {
          title: { type: 'string' },
          conclusion: { type: 'string' },
          evidenceClaimIds: identifierArray,
          confidence: score,
        },
      },
    },
    contradictions: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['issue', 'evidenceClaimIds', 'decisionNeeded'],
        properties: {
          issue: { type: 'string' },
          evidenceClaimIds: identifierArray,
          decisionNeeded: { type: 'string' },
        },
      },
    },
    limitations: stringArray,
    productImplications: stringArray,
    risks: stringArray,
    assumptions: stringArray,
    remainingGaps: stringArray,
    recommendedNextAction: { type: 'string' },
  },
}

export const OPPORTUNITY_ARCHITECTURE_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'thesis', 'problemStatement', 'targetAudience', 'recommendation', 'missingEvidence'],
  properties: {
    title: { type: 'string' },
    thesis: { type: 'string' },
    problemStatement: { type: 'string' },
    targetAudience: stringArray,
    recommendation: { type: 'string' },
    missingEvidence: stringArray,
  },
}

export const PRODUCT_DESIGN_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'executiveThesis', 'problemDefinition', 'targetMarkets', 'learnerProfiles', 'ageRanges',
    'usageContexts', 'painPoints', 'desiredOutcomes', 'educationalDoctrine', 'primaryObjective',
    'secondaryObjectives', 'contentPerimeter', 'cardArchitecture', 'totalCardCountHypothesis',
    'progressionModel', 'languageStrategy', 'inclusionRequirements', 'culturalAdaptation',
    'formatStrategy', 'overlapAnalysis', 'differentiation', 'bundleCompatibility',
    'journeyCompatibility', 'commercialHypothesis', 'productionComplexity', 'rightsAndSafetyRisks',
    'openQuestions', 'alternatives',
  ],
  properties: {
    executiveThesis: { type: 'string' },
    problemDefinition: { type: 'string' },
    targetMarkets: stringArray,
    learnerProfiles: stringArray,
    ageRanges: stringArray,
    usageContexts: stringArray,
    painPoints: stringArray,
    desiredOutcomes: stringArray,
    educationalDoctrine: stringArray,
    primaryObjective: { type: 'string' },
    secondaryObjectives: stringArray,
    contentPerimeter: stringArray,
    cardArchitecture: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['group', 'purpose', 'estimatedCards', 'progression'],
        properties: {
          group: { type: 'string' },
          purpose: { type: 'string' },
          estimatedCards: { type: 'integer', minimum: 1, maximum: 200 },
          progression: { type: 'string' },
        },
      },
    },
    totalCardCountHypothesis: { type: 'integer', minimum: 1, maximum: 1000 },
    progressionModel: stringArray,
    languageStrategy: stringArray,
    inclusionRequirements: stringArray,
    culturalAdaptation: stringArray,
    formatStrategy: stringArray,
    overlapAnalysis: stringArray,
    differentiation: stringArray,
    bundleCompatibility: stringArray,
    journeyCompatibility: stringArray,
    commercialHypothesis: stringArray,
    productionComplexity: stringArray,
    rightsAndSafetyRisks: stringArray,
    openQuestions: stringArray,
    alternatives: {
      type: 'array',
      minItems: 2,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'thesis', 'benefits', 'drawbacks', 'cardCountHypothesis', 'formats', 'audienceFit', 'differentiation', 'complexity', 'risk', 'recommendation'],
        properties: {
          name: { type: 'string' },
          thesis: { type: 'string' },
          benefits: stringArray,
          drawbacks: stringArray,
          cardCountHypothesis: { type: 'integer', minimum: 1, maximum: 1000 },
          formats: stringArray,
          audienceFit: score,
          differentiation: score,
          complexity: score,
          risk: score,
          recommendation: { type: 'string' },
        },
      },
    },
  },
}

export function schemaForTask(taskProfile: string): { name: string; schema: JsonSchema } {
  if (taskProfile === 'evidence_claim_extraction' || taskProfile === 'source_quality_analysis') {
    return { name: 'flashcards_evidence_extraction', schema: EVIDENCE_EXTRACTION_SCHEMA }
  }
  if (taskProfile === 'external_research_synthesis' || taskProfile === 'contradiction_analysis' || taskProfile === 'executive_intelligence_brief') {
    return { name: 'flashcards_research_synthesis', schema: RESEARCH_SYNTHESIS_SCHEMA }
  }
  if (taskProfile === 'product_opportunity_architect' || taskProfile === 'portfolio_gap_analysis') {
    return { name: 'flashcards_product_opportunity', schema: OPPORTUNITY_ARCHITECTURE_SCHEMA }
  }
  return { name: 'flashcards_product_design', schema: PRODUCT_DESIGN_SCHEMA }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function numberScore(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}

export function parseStructuredJson(content: string): unknown {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('OpenRouter returned an empty structured response.')
  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
    if (fenced) return JSON.parse(fenced)
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1))
    throw new Error('OpenRouter response is not valid JSON.')
  }
}

export function validateStructuredOutput(taskProfile: string, value: unknown) {
  if (!isRecord(value)) throw new Error('Structured output must be a JSON object.')

  if (taskProfile === 'evidence_claim_extraction' || taskProfile === 'source_quality_analysis') {
    if (!Array.isArray(value.claims) || !isRecord(value.sourceAssessment)) throw new Error('Evidence output is missing claims or sourceAssessment.')
    for (const claim of value.claims) {
      if (!isRecord(claim) || typeof claim.statement !== 'string' || typeof claim.supportingExtract !== 'string' || !numberScore(claim.confidence)) {
        throw new Error('Evidence claim does not satisfy the governed output contract.')
      }
    }
    return value
  }

  if (taskProfile === 'external_research_synthesis' || taskProfile === 'contradiction_analysis' || taskProfile === 'executive_intelligence_brief') {
    if (typeof value.executiveAnswer !== 'string' || !Array.isArray(value.findings) || !stringArrayValue(value.limitations) || typeof value.recommendedNextAction !== 'string') {
      throw new Error('Research synthesis does not satisfy the governed output contract.')
    }
    return value
  }

  if (taskProfile === 'product_opportunity_architect' || taskProfile === 'portfolio_gap_analysis') {
    if (typeof value.title !== 'string' || typeof value.thesis !== 'string' || typeof value.problemStatement !== 'string' || !stringArrayValue(value.targetAudience)) {
      throw new Error('Product opportunity does not satisfy the governed output contract.')
    }
    return value
  }

  if (typeof value.executiveThesis !== 'string' || typeof value.primaryObjective !== 'string' || !Array.isArray(value.cardArchitecture) || !Array.isArray(value.alternatives)) {
    throw new Error('Product design does not satisfy the governed output contract.')
  }
  return value
}
