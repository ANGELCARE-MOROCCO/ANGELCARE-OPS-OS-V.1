import crypto from 'node:crypto'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import type { RevenueAiGenerationRequest, RevenueAiGenerationResult, RevenueAiProvider, RevenueAiProviderHealth } from './types'
import type { RevenueStrategy } from '../strategy-brain/types'
import { getRevenueAiConfig, assertGeminiSecret } from './config'
import { STRATEGY_ASSEMBLY_PROMPT } from './prompt-registry'
import { minimizeAiContext } from './context-minimizer'
import { redactSensitiveValues } from './sensitive-value-redactor'
import { GEMINI_STRATEGY_JSON_SCHEMA, geminiStrategyAssembly } from './structured-output'
import { withRevenueAiRetry } from './retry-controller'
import { classifyRevenueAiError, RevenueAiError } from './errors'
import {
  acquireGovernedProvider,
  failGovernedProvider,
  reconcileGovernedProvider,
  resolveGovernedProviderForHealth,
} from '@/lib/ai-provider-control/governor'

const hash = (value: unknown) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const now = () => new Date().toISOString()

export class GeminiRevenueAiProvider implements RevenueAiProvider {
  readonly providerCode = 'gemini' as const

  async checkHealth(live = false): Promise<RevenueAiProviderHealth> {
    const config = getRevenueAiConfig()
    try {
      assertGeminiSecret()
      if (!config.enabled) return { provider: this.providerCode, enabled: false, available: false, model: config.primaryModel, checkedAt: now(), message: 'IA désactivée par configuration.' }
      const governed = await resolveGovernedProviderForHealth({ moduleKey: 'revenue_os', capability: 'health_check', requestedModel: config.primaryModel })
      const apiKey = governed.apiKey || assertGeminiSecret()
      const model = governed.model || config.primaryModel
      if (live) {
        const response = await new GoogleGenAI({ apiKey }).models.generateContent({
          model,
          contents: 'Reply exactly GEMINI_OK',
          config: { maxOutputTokens: 256, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
        })
        if (!response.text?.includes('GEMINI_OK')) throw new Error('GEMINI_HEALTH_UNEXPECTED_OUTPUT')
      }
      return {
        provider: this.providerCode,
        enabled: true,
        available: true,
        model,
        checkedAt: now(),
        lastSuccessAt: live ? now() : undefined,
        message: governed.governed
          ? (live ? 'Connexion Gemini gouvernée vérifiée.' : 'Dossier fournisseur actif et prêt.')
          : (live ? 'Connexion Gemini bootstrap vérifiée.' : 'Configuration Gemini bootstrap prête.'),
      }
    } catch (error) {
      const classified = classifyRevenueAiError(error)
      return {
        provider: this.providerCode,
        enabled: config.enabled,
        available: false,
        model: config.primaryModel,
        checkedAt: now(),
        lastFailureAt: now(),
        errorCode: classified.code,
        message: classified.message,
      }
    }
  }

  async generateStructured(request: RevenueAiGenerationRequest): Promise<RevenueAiGenerationResult> {
    const config = getRevenueAiConfig()
    if (!config.enabled) throw new RevenueAiError('DISABLED', 'Revenue AI disabled', false, 503)
    const started = Date.now()
    const minimized = redactSensitiveValues(minimizeAiContext(request))
    const serialized = JSON.stringify(minimized)
    const estimatedInputTokens = Math.ceil(serialized.length / 4)
    if (estimatedInputTokens > config.maxInputTokensPerRun) {
      throw new RevenueAiError('INVALID_OUTPUT', `Input token ceiling exceeded: ${estimatedInputTokens}`, false, 413)
    }

    const governed = await acquireGovernedProvider({
      moduleKey: 'revenue_os',
      capability: 'structured_strategy',
      requestedModel: config.primaryModel,
      estimatedRequests: Math.max(1, config.maxRetries + 1),
      estimatedInputTokens,
      estimatedOutputTokens: config.maxOutputTokensPerRun,
      grounded: false,
      actorId: request.userId || null,
      missionId: request.runId,
      commandCode: 'REVENUE_STRATEGY_ASSEMBLY',
    })

    const apiKey = governed.apiKey || assertGeminiSecret()
    const client = new GoogleGenAI({ apiKey })
    const requestHash = hash({ minimized, prompt: STRATEGY_ASSEMBLY_PROMPT.version, model: governed.model || config.primaryModel })
    let attempts = 0

    try {
      const response = await withRevenueAiRetry(async attempt => {
        attempts += 1
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), config.timeoutMs)
        try {
          const model = governed.governed ? governed.model : (attempt === 0 ? config.primaryModel : config.fallbackModel)
          return await client.models.generateContent({
            model,
            contents: JSON.stringify(minimized),
            config: {
              systemInstruction: STRATEGY_ASSEMBLY_PROMPT.content,
              responseMimeType: 'application/json',
              responseJsonSchema: GEMINI_STRATEGY_JSON_SCHEMA,
              maxOutputTokens: config.maxOutputTokensPerRun,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
              abortSignal: controller.signal,
            },
          })
        } finally {
          clearTimeout(timer)
        }
      }, config.maxRetries)

      const text = response.text
      if (!text) throw new RevenueAiError('INVALID_OUTPUT', 'Gemini returned no text', false, 502)
      let parsed: unknown
      try { parsed = JSON.parse(text) } catch (error) { throw new RevenueAiError('INVALID_OUTPUT', 'Gemini returned malformed JSON', false, 502, error) }
      const assembly = geminiStrategyAssembly.safeParse(parsed)
      if (!assembly.success) {
        throw new RevenueAiError('INVALID_OUTPUT', `Gemini schema validation failed: ${assembly.error.issues.slice(0, 8).map(issue => issue.path.map(segment => String(segment)).join('.') + ':' + issue.message).join('|')}`, false, 502)
      }

      const byCode = new Map(request.commands.map(item => [item.commandCode, item]))
      const strategies: RevenueStrategy[] = assembly.data.strategies.map((draft, index) => {
        const selected = draft.commandCodes.map(code => byCode.get(code)).filter((item): item is NonNullable<typeof item> => Boolean(item))
        if (selected.length < 3) throw new RevenueAiError('INVALID_OUTPUT', `Strategy ${index + 1} has fewer than 3 valid command references`, false, 502)
        return {
          id: crypto.randomUUID(), code: `STRAT-GEMINI-${request.runId.slice(0, 8)}-${String(index + 1).padStart(2, '0')}`,
          tenantId: request.tenantId, objectiveId: request.objective.id, contextSnapshotId: request.context.id,
          archetype: draft.archetype, thesis: draft.thesis, objective: draft.objective, targetMarket: draft.targetMarket,
          targetSegments: draft.targetSegments, accountProfile: draft.accountProfile, businessProblem: draft.businessProblem,
          offer: draft.offer, valueProposition: draft.valueProposition, differentiatingAngle: draft.differentiatingAngle,
          channelMix: draft.channelMix, messageArchitecture: draft.messageArchitecture, campaignSequence: draft.campaignSequence,
          decisionMakerStrategy: draft.decisionMakerStrategy, meetingStrategy: draft.meetingStrategy,
          proposalStrategy: draft.proposalStrategy, pricingPosture: draft.pricingPosture,
          scarcityMechanism: draft.scarcityMechanism, trustEvidence: draft.trustEvidence,
          resourcesRequired: draft.resourcesRequired, capacityRequirements: draft.capacityRequirements,
          predictedResults: draft.predictedResults, assumptions: draft.assumptions.map(item => ({ ...item, id: crypto.randomUUID() })),
          confidence: draft.confidence, risks: draft.risks.map(item => ({ ...item, id: crypto.randomUUID() })),
          fallbackPlan: draft.fallbackPlan, stopConditions: draft.stopConditions, commandPortfolio: selected,
          scenarios: draft.scenarios.map(item => ({ ...item, id: crypto.randomUUID() })),
          status: 'ready_for_comparison', version: '1.0.0', combinationLineage: [], assemblyRunId: request.runId, createdAt: now(),
        }
      })

      const usageMeta = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined
      const usage = {
        inputTokens: Number(usageMeta?.promptTokenCount || 0),
        outputTokens: Number(usageMeta?.candidatesTokenCount || 0),
        totalTokens: Number(usageMeta?.totalTokenCount || 0),
        estimatedCostUsd: 0,
      }
      await reconcileGovernedProvider(governed, {
        requestCount: attempts,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        latencyMs: Date.now() - started,
        httpStatus: 200,
        outcome: 'completed',
        missionId: request.runId,
        commandCode: 'REVENUE_STRATEGY_ASSEMBLY',
        metadata: { responseId: response.responseId, modelVersion: response.modelVersion },
      })
      return {
        provider: this.providerCode,
        model: response.modelVersion || governed.model || config.primaryModel,
        modelVersion: response.modelVersion,
        responseId: response.responseId,
        strategies,
        usage,
        latencyMs: Date.now() - started,
        requestHash,
        responseHash: hash(text),
        fallbackUsed: attempts > 1,
        rawStatus: 'completed',
      }
    } catch (error) {
      const classified = classifyRevenueAiError(error)
      await failGovernedProvider(governed, error, {
        httpStatus: classified.status,
        errorCode: classified.code,
        latencyMs: Date.now() - started,
        missionId: request.runId,
        commandCode: 'REVENUE_STRATEGY_ASSEMBLY',
        metadata: { attempts },
      })
      throw error
    }
  }
}
