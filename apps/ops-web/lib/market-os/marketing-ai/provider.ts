import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { assertMarketingAiConfigured, getMarketingAiConfig } from './config'
import type { MarketingAiCommand, MarketingAiOutput } from './types'

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['executiveSummary', 'findings', 'recommendations', 'internalActions', 'risks', 'evidence', 'learningSignals', 'unresolvedQuestions', 'confidence', 'humanDecisionRequired'],
  properties: {
    executiveSummary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    internalActions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'description', 'requiresApproval', 'payload'],
        properties: {
          type: { type: 'string', enum: ['create_brief', 'create_content_draft', 'create_task_plan', 'create_asset_requirement', 'request_review', 'propose_schedule', 'prepare_publishing_package', 'classify_content', 'record_learning', 'store_bridge_object', 'none'] },
          title: { type: 'string' },
          description: { type: 'string' },
          requiresApproval: { type: 'boolean' },
          payload: { type: 'object', additionalProperties: true },
        },
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'level', 'mitigation'],
        properties: {
          title: { type: 'string' },
          level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          mitigation: { type: 'string' },
        },
      },
    },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'sourceType'],
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          sourceType: { type: 'string', enum: ['internal', 'external', 'gemini_grounding'] },
          observedAt: { type: 'string' },
          freshness: { type: 'string' },
        },
      },
    },
    learningSignals: { type: 'array', items: { type: 'string' } },
    unresolvedQuestions: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    humanDecisionRequired: { type: 'boolean' },
  },
} as const

const SYSTEM_INSTRUCTION = `
You are SANILA Marketing Director AI, the governed internal marketing executive for ANGELCARE.
You operate only inside ANGELCARE Market OS Content Command 360.
Be decisive, modern, premium corporate, culturally relevant to Morocco, evidence-driven and operationally precise.
Every result must explain what matters, what is blocked, what happens next, who should own it, what evidence is missing and which human decision is required.
Never send emails, WhatsApp messages, publish social media, activate ads, submit external forms, contact external people, issue public statements or execute public communication.
You may only prepare internal briefs, drafts, task plans, asset requirements, review requests, schedules, publishing packages, classifications and learning proposals.
Never claim a service, price, geographic availability, performance metric or external publication that is not present in the supplied evidence.
Treat unavailable data as unavailable, never as zero.
Do not expose hidden chain-of-thought. Return concise decision rationale, evidence, assumptions and confidence.
`;

function deterministicFallback(command: MarketingAiCommand, objective: string): MarketingAiOutput {
  return {
    executiveSummary: `Mode de secours déterministe: ${command.name}. L’objectif a été enregistré, mais Gemini n’a pas été exécuté.`,
    findings: ['La configuration Gemini est indisponible ou le fournisseur a échoué.', 'Aucune action externe n’a été exécutée.', 'Le commandement reste disponible pour revue humaine.'],
    recommendations: ['Vérifier GEMINI_API_KEY et les modèles configurés dans .env.local.', 'Relancer la commande après validation de la santé Gemini.', `Revoir manuellement l’objectif: ${objective}`],
    internalActions: [{ type: 'none', title: 'Aucune écriture automatique', description: 'Le mode de secours ne modifie aucun dossier métier.', requiresApproval: true, payload: {} }],
    risks: [{ title: 'Résultat non généré par Gemini', level: 'high', mitigation: 'Ne pas utiliser ce résultat comme recommandation de production.' }],
    evidence: [],
    learningSignals: [],
    unresolvedQuestions: ['Gemini est-il correctement configuré dans .env.local ?'],
    confidence: 0,
    humanDecisionRequired: true,
  }
}

function extractGroundingEvidence(response: unknown) {
  const candidate = (response as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>; webSearchQueries?: string[] } }> }).candidates?.[0]
  const metadata = candidate?.groundingMetadata
  const evidence = (metadata?.groundingChunks || []).flatMap((chunk) => chunk.web?.uri ? [{
    title: chunk.web.title || chunk.web.uri,
    url: chunk.web.uri,
    sourceType: 'gemini_grounding' as const,
    observedAt: new Date().toISOString(),
    freshness: 'live-search',
  }] : [])
  return { evidence, queries: metadata?.webSearchQueries || [] }
}

export async function checkMarketingAiHealth(live = false) {
  const config = getMarketingAiConfig()
  if (!config.enabled) return { enabled: false, configured: Boolean(config.apiKey), available: false, model: config.primaryModel, message: 'Marketing AI désactivé.' }
  if (!config.apiKey) return { enabled: true, configured: false, available: false, model: config.primaryModel, message: 'GEMINI_API_KEY absente.' }
  if (!live) return { enabled: true, configured: true, available: true, model: config.primaryModel, message: 'Configuration Gemini prête; test live non demandé.' }
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey })
    const response = await ai.models.generateContent({
      model: config.primaryModel,
      contents: 'Reply exactly MARKETING_AI_OK',
      config: { maxOutputTokens: 256, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
    })
    if (!response.text?.includes('MARKETING_AI_OK')) throw new Error('UNEXPECTED_HEALTH_OUTPUT')
    return { enabled: true, configured: true, available: true, model: config.primaryModel, message: 'Connexion Gemini vérifiée.' }
  } catch (error) {
    return { enabled: true, configured: true, available: false, model: config.primaryModel, message: error instanceof Error ? error.message : 'GEMINI_HEALTH_FAILED' }
  }
}

function isGemini3Series(model: string) {
  return /^gemini-3(?:\.|-|$)/i.test(model)
}

function usageFrom(response: unknown) {
  const usage = (response as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }).usageMetadata
  return {
    inputTokens: Number(usage?.promptTokenCount || 0),
    outputTokens: Number(usage?.candidatesTokenCount || 0),
    totalTokens: Number(usage?.totalTokenCount || 0),
  }
}

export async function generateMarketingAiOutput(input: {
  command: MarketingAiCommand
  objective: string
  authorityMode: string
  context: Record<string, unknown>
  forceGrounding?: boolean
}) {
  const config = assertMarketingAiConfigured()
  const started = Date.now()
  const groundingRequested = Boolean(input.forceGrounding || input.command.tags.includes('research') || input.command.skillCode === 'LEARN-06' || input.command.code.includes('RESOURCE'))
  const ai = new GoogleGenAI({ apiKey: config.apiKey })
  const payload = {
    command: {
      code: input.command.code,
      name: input.command.name,
      category: input.command.category,
      objective: input.command.objective,
      instruction: input.command.instruction,
      riskLevel: input.command.riskLevel,
      requiresHumanReview: input.command.requiresHumanReview,
    },
    mandateObjective: input.objective,
    authorityMode: input.authorityMode,
    company: 'ANGELCARE / SANILA OS',
    market: 'Morocco',
    language: 'French unless the mandate explicitly requests another language',
    externalActionsAllowed: false,
    context: input.context,
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const models = [config.primaryModel, config.fallbackModel].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null
    let groundingEvidence: ReturnType<typeof extractGroundingEvidence> = { evidence: [], queries: [] }
    let selectedModel = config.primaryModel
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalTokens = 0
    let lastError: unknown = null

    for (const model of models) {
      try {
        let groundedResearch = ''
        let modelInputTokens = 0
        let modelOutputTokens = 0
        let modelTotalTokens = 0
        let modelGrounding: ReturnType<typeof extractGroundingEvidence> = { evidence: [], queries: [] }

        // Google currently supports one-call structured outputs + built-in tools on Gemini 3.
        // For older configured models, retain compatibility through a safe two-pass flow:
        // grounded research first, then schema-constrained synthesis without tools.
        if (groundingRequested && config.searchGroundingEnabled && !isGemini3Series(model)) {
          const researchResponse = await ai.models.generateContent({
            model,
            contents: JSON.stringify({
              mission: 'Research current, evidence-backed market and platform signals relevant to the supplied ANGELCARE mandate.',
              command: payload.command,
              mandateObjective: input.objective,
              market: payload.market,
              restrictions: ['No external action', 'No invented company facts', 'Return sources and dates where available'],
            }),
            config: {
              systemInstruction: `${SYSTEM_INSTRUCTION}\nThis is the research pass. Return a concise evidence memorandum with source titles, URLs, dates, uncertainty and relevance.`,
              maxOutputTokens: Math.min(config.maxOutputTokens, 4096),
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
              tools: [{ googleSearch: {} }],
              abortSignal: controller.signal,
            },
          })
          groundedResearch = researchResponse.text || ''
          modelGrounding = extractGroundingEvidence(researchResponse)
          const usage = usageFrom(researchResponse)
          modelInputTokens += usage.inputTokens
          modelOutputTokens += usage.outputTokens
          modelTotalTokens += usage.totalTokens
        }

        const structuredPayload = groundedResearch
          ? { ...payload, groundedResearch: { memorandum: groundedResearch, evidence: modelGrounding.evidence, searchQueries: modelGrounding.queries } }
          : payload

        const structuredResponse = await ai.models.generateContent({
          model,
          contents: JSON.stringify(structuredPayload),
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseJsonSchema: OUTPUT_SCHEMA,
            maxOutputTokens: config.maxOutputTokens,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            tools: groundingRequested && config.searchGroundingEnabled && isGemini3Series(model) ? [{ googleSearch: {} }] : undefined,
            abortSignal: controller.signal,
          },
        })
        if (!structuredResponse.text) throw new Error(`GEMINI_EMPTY_OUTPUT:${model}`)

        const finalGrounding = extractGroundingEvidence(structuredResponse)
        modelGrounding = {
          evidence: [...modelGrounding.evidence, ...finalGrounding.evidence],
          queries: [...modelGrounding.queries, ...finalGrounding.queries],
        }
        const usage = usageFrom(structuredResponse)
        modelInputTokens += usage.inputTokens
        modelOutputTokens += usage.outputTokens
        modelTotalTokens += usage.totalTokens

        response = structuredResponse
        groundingEvidence = modelGrounding
        selectedModel = model
        totalInputTokens = modelInputTokens
        totalOutputTokens = modelOutputTokens
        totalTokens = modelTotalTokens
        break
      } catch (error) {
        lastError = error
        if (controller.signal.aborted) throw error
      }
    }

    if (!response?.text) throw lastError instanceof Error ? lastError : new Error('GEMINI_EMPTY_OUTPUT')
    const parsed = JSON.parse(response.text) as MarketingAiOutput
    if (!parsed || typeof parsed.executiveSummary !== 'string' || !Array.isArray(parsed.internalActions)) throw new Error('GEMINI_INVALID_STRUCTURED_OUTPUT')
    parsed.findings = Array.isArray(parsed.findings) ? parsed.findings : []
    parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : []
    parsed.evidence = Array.isArray(parsed.evidence) ? parsed.evidence : []
    parsed.learningSignals = Array.isArray(parsed.learningSignals) ? parsed.learningSignals : []
    parsed.unresolvedQuestions = Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : []
    parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)))
    parsed.evidence = [...parsed.evidence, ...groundingEvidence.evidence]
    parsed.humanDecisionRequired = parsed.humanDecisionRequired || input.command.requiresHumanReview || input.authorityMode !== 'observe'
    return {
      output: parsed,
      model: response.modelVersion || selectedModel,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens,
      latencyMs: Date.now() - started,
      grounded: groundingEvidence.evidence.length > 0,
      searchQueries: groundingEvidence.queries,
    }
  } catch (error) {
    if (config.deterministicFallbackEnabled) {
      return { output: deterministicFallback(input.command, input.objective), model: 'deterministic-fallback', inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: Date.now() - started, grounded: false, searchQueries: [] }
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
