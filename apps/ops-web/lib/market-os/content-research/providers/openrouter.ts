import { getContentResearchConfig } from '../config'
import type {
  OpenRouterAnalysisResponse,
  StructuredResearchAnalysis,
  StructuredResearchFinding,
  TavilySearchResult,
} from '../types'

const FINDING_TYPES = new Set([
  'signal',
  'content_opportunity',
  'communication_risk',
  'editorial_window',
  'content_gap',
  'claim_verification',
  'source_integrity',
  'creative_reference',
  'evidence_gap',
  'publication_readiness',
])

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['researchSummary', 'findings', 'rejectedHypotheses', 'missingInformation'],
  properties: {
    researchSummary: { type: 'string' },
    findings: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'findingType', 'title', 'description', 'sourceIndexes', 'evidenceSummary',
          'services', 'audiences', 'cities', 'channels', 'relevanceScore',
          'businessFitScore', 'urgencyScore', 'evidenceConfidence',
          'recommendedInternalAction', 'limitations', 'unknowns',
        ],
        properties: {
          findingType: { type: 'string', enum: Array.from(FINDING_TYPES) },
          title: { type: 'string' },
          description: { type: 'string' },
          sourceIndexes: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 0 } },
          evidenceSummary: { type: 'string' },
          services: { type: 'array', items: { type: 'string' } },
          audiences: { type: 'array', items: { type: 'string' } },
          cities: { type: 'array', items: { type: 'string' } },
          channels: { type: 'array', items: { type: 'string' } },
          relevanceScore: { type: 'integer', minimum: 0, maximum: 100 },
          businessFitScore: { type: 'integer', minimum: 0, maximum: 100 },
          urgencyScore: { type: 'integer', minimum: 0, maximum: 100 },
          evidenceConfidence: { type: 'integer', minimum: 0, maximum: 100 },
          recommendedInternalAction: { type: 'string' },
          limitations: { type: 'array', items: { type: 'string' } },
          unknowns: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    rejectedHypotheses: { type: 'array', items: { type: 'string' } },
    missingInformation: { type: 'array', items: { type: 'string' } },
  },
} as const

function clamp(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []
}

function parseJson(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned) as unknown
}

function validateAnalysis(value: unknown, sourceCount: number): StructuredResearchAnalysis {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('OPENROUTER_SCHEMA_INVALID_ROOT')
  const row = value as Record<string, unknown>
  const findings = Array.isArray(row.findings) ? row.findings : []

  const normalizedFindings: StructuredResearchFinding[] = findings.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const finding = item as Record<string, unknown>
    const findingType = String(finding.findingType || '')
    const sourceIndexes = Array.isArray(finding.sourceIndexes)
      ? Array.from(new Set(finding.sourceIndexes.map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < sourceCount)))
      : []
    const title = String(finding.title || '').trim()
    const description = String(finding.description || '').trim()
    const evidenceSummary = String(finding.evidenceSummary || '').trim()
    if (!FINDING_TYPES.has(findingType) || !title || !description || !evidenceSummary || !sourceIndexes.length) return []
    return [{
      findingType: findingType as StructuredResearchFinding['findingType'],
      title,
      description,
      sourceIndexes,
      evidenceSummary,
      services: strings(finding.services),
      audiences: strings(finding.audiences),
      cities: strings(finding.cities),
      channels: strings(finding.channels),
      relevanceScore: clamp(finding.relevanceScore),
      businessFitScore: clamp(finding.businessFitScore),
      urgencyScore: clamp(finding.urgencyScore),
      evidenceConfidence: clamp(finding.evidenceConfidence),
      recommendedInternalAction: String(finding.recommendedInternalAction || '').trim(),
      limitations: strings(finding.limitations),
      unknowns: strings(finding.unknowns),
    }]
  })

  return {
    researchSummary: String(row.researchSummary || '').trim(),
    findings: normalizedFindings,
    rejectedHypotheses: strings(row.rejectedHypotheses),
    missingInformation: strings(row.missingInformation),
  }
}

function providerError(status: number, payload: unknown) {
  const message = payload && typeof payload === 'object'
    ? String((payload as { error?: { message?: string } }).error?.message || `OPENROUTER_HTTP_${status}`)
    : `OPENROUTER_HTTP_${status}`
  const error = new Error(message)
  Object.assign(error, { provider: 'openrouter', status, retryable: status === 408 || status === 429 || status >= 500 })
  return error
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeWithOpenRouter(input: {
  objective: string
  agentName: string
  agentPurpose: string
  outputLanguage: string
  sources: TavilySearchResult[]
  model: string
  maxSourceCharacters: number
  maxOutputTokens: number
  repairAttempts: number
}): Promise<OpenRouterAnalysisResponse> {
  const config = getContentResearchConfig()
  if (!config.openrouter.apiKey) throw new Error('OPENROUTER_API_KEY_MISSING')

  const sourcePackage = input.sources.map((source, index) => ({
    index,
    title: source.title,
    url: source.url,
    excerpt: (source.rawContent || source.content).slice(0, input.maxSourceCharacters),
    searchScore: source.score,
  }))

  const system = [
    'You are the governed internal Content Intelligence analyst for ANGELCARE Market OS Content Command Center.',
    'This is not sales prospecting, lead generation, fundraising, investor targeting or commercial pipeline work.',
    'Analyze only the supplied public-source package and produce Content Command findings such as content opportunities, editorial windows, communication risks, content gaps, claim checks, source-integrity issues, creative references, evidence gaps and publication-readiness observations.',
    'Every finding must cite at least one valid source index from the supplied package.',
    'Do not invent statistics, sources, availability, prices, claims, people, organizations or external events.',
    'Separate limitations and unknowns. Omit any finding that is not supported by the supplied sources.',
    'Internal creation is permitted. External publication, communication and submission always require human approval.',
    `Return the result in ${input.outputLanguage || 'French'}.`,
  ].join(' ')

  const endpoint = `${config.openrouter.baseUrl.replace(/\/$/, '')}/chat/completions`
  let lastError: unknown = null
  const attempts = Math.max(0, input.repairAttempts) + 1

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const started = Date.now()
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': config.openrouter.appName,
          ...(config.openrouter.httpReferer ? { 'HTTP-Referer': config.openrouter.httpReferer } : {}),
        },
        body: JSON.stringify({
          model: input.model || config.openrouter.model,
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content: JSON.stringify({
                agent: { name: input.agentName, purpose: input.agentPurpose },
                objective: input.objective,
                sourcePackage,
                correctionInstruction: attempt > 0
                  ? 'Previous response failed schema or evidence validation. Return a complete valid JSON response with only supported findings.'
                  : undefined,
              }),
            },
          ],
          max_tokens: input.maxOutputTokens,
          response_format: attempt === 0
            ? {
                type: 'json_schema',
                json_schema: {
                  name: 'angelcare_content_research_analysis',
                  strict: true,
                  schema: ANALYSIS_SCHEMA,
                },
              }
            : { type: 'json_object' },
          provider: {
            allow_fallbacks: true,
            require_parameters: false,
          },
        }),
      }, config.openrouter.timeoutMs)

      const payload = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok || payload.error) throw providerError(response.status || 500, payload)
      const choices = Array.isArray(payload.choices) ? payload.choices : []
      const message = choices[0] && typeof choices[0] === 'object'
        ? (choices[0] as { message?: { content?: unknown } }).message
        : undefined
      const content = typeof message?.content === 'string' ? message.content : ''
      if (!content) throw new Error('OPENROUTER_EMPTY_OUTPUT')
      const analysis = validateAnalysis(parseJson(content), sourcePackage.length)
      const usage = payload.usage && typeof payload.usage === 'object' ? payload.usage as Record<string, unknown> : {}
      return {
        requestedModel: input.model || config.openrouter.model,
        resolvedModel: String(payload.model || input.model || config.openrouter.model),
        inputTokens: Number(usage.prompt_tokens || 0),
        outputTokens: Number(usage.completion_tokens || 0),
        latencyMs: Date.now() - started,
        analysis,
      }
    } catch (error) {
      lastError = error
      if (attempt >= attempts - 1) break
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') throw new Error('OPENROUTER_TIMEOUT')
  throw lastError instanceof Error ? lastError : new Error('OPENROUTER_ANALYSIS_FAILED')
}

export async function testOpenRouter() {
  const config = getContentResearchConfig()
  if (!config.openrouter.apiKey) return { available: false, configured: false, error: 'OPENROUTER_API_KEY_MISSING' }
  const started = Date.now()
  try {
    const response = await fetchWithTimeout(`${config.openrouter.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': config.openrouter.appName,
        ...(config.openrouter.httpReferer ? { 'HTTP-Referer': config.openrouter.httpReferer } : {}),
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages: [{ role: 'user', content: 'Return exactly ANGELCARE_OPENROUTER_OK' }],
        max_tokens: 64,
      }),
    }, Math.min(config.openrouter.timeoutMs, 45000))
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok || payload.error) throw providerError(response.status || 500, payload)
    return {
      available: true,
      configured: true,
      requestedModel: config.openrouter.model,
      resolvedModel: String(payload.model || config.openrouter.model),
      latencyMs: Date.now() - started,
    }
  } catch (error) {
    return { available: false, configured: true, error: error instanceof Error ? error.message : 'OPENROUTER_HEALTH_FAILED' }
  }
}
