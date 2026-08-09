import crypto from 'node:crypto'
import type { RevenueAiGenerationRequest, RevenueAiGenerationResult, RevenueAiProvider, RevenueAiProviderHealth } from './types'
import type { RevenueStrategy } from '../strategy-brain/types'
import { getRevenueAiConfig } from './config'
import { STRATEGY_ASSEMBLY_PROMPT } from './prompt-registry'
import { minimizeAiContext } from './context-minimizer'
import { redactSensitiveValues } from './sensitive-value-redactor'
import { GEMINI_STRATEGY_JSON_SCHEMA, geminiStrategyAssembly } from './structured-output'
import { withRevenueAiRetry } from './retry-controller'
import { classifyRevenueAiError, RevenueAiError } from './errors'
import {
  estimateAiCostUsd,
  executeGovernedAiRequest,
  resolveGovernedProviderForHealth,
} from '@/lib/ai-provider-control/governor'
import { invokeGeminiProvider } from '@/lib/ai-provider-control/gemini-runtime'

const hash = (value: unknown) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const now = () => new Date().toISOString()

type GovernedStrategyPayload = {
  assembly: any
  modelVersion?: string
  responseId?: string
  attempts: number
}

export class GeminiRevenueAiProvider implements RevenueAiProvider {
  readonly providerCode = 'gemini' as const

  async checkHealth(live = false): Promise<RevenueAiProviderHealth> {
    const config = getRevenueAiConfig()
    if (!config.enabled) {
      return {
        provider: this.providerCode,
        enabled: false,
        available: false,
        model: config.primaryModel,
        checkedAt: now(),
        message: 'IA Revenue désactivée par configuration.',
      }
    }

    try {
      const route = await resolveGovernedProviderForHealth({
        moduleKey: 'revenue_os',
        capability: 'health_check',
        requestedModel: config.primaryModel,
      })
      if (!route.governed || !route.apiKey) {
        return {
          provider: this.providerCode,
          enabled: true,
          available: false,
          model: config.primaryModel,
          checkedAt: now(),
          errorCode: 'AI_PROVIDER_ROUTE_REQUIRED',
          message: 'Aucune route souveraine active. Revenue OS ne peut pas utiliser une clé d’environnement en contournement.',
        }
      }

      if (!live) {
        return {
          provider: this.providerCode,
          enabled: true,
          available: true,
          model: route.model,
          checkedAt: now(),
          message: 'Route AI Provider Control active. Contrôle passif sans consommation Gemini.',
        }
      }

      const health = await executeGovernedAiRequest<{ ok: true; modelVersion?: string }>({
        moduleKey: 'revenue_os',
        workspaceKey: 'provider-health',
        capability: 'health_check',
        commandCode: 'REVENUE_PROVIDER_HEALTH_ACTIVE',
        requestedModel: route.model,
        promptVersion: 'health-1.0.0',
        sourceRevision: 'GEMINI_OK',
        requestPayload: { probe: 'GEMINI_OK' },
        triggerType: 'health_test',
        estimatedRequests: 1,
        estimatedInputTokens: 32,
        estimatedOutputTokens: 64,
        estimatedCostUsd: estimateAiCostUsd(32, 64),
        cacheTtlSeconds: 3600,
        execute: async ({ apiKey, model }) => {
          const started = Date.now()
          const response = await invokeGeminiProvider({ apiKey, model, contents: 'Reply exactly GEMINI_OK', maxOutputTokens: 64, thinkingLevel: 'LOW' })
          if (!response.text?.includes('GEMINI_OK')) throw new Error('GEMINI_HEALTH_UNEXPECTED_OUTPUT')
          const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined
          return {
            result: { ok: true, modelVersion: response.modelVersion },
            requestCount: 1,
            inputTokens: Number(usage?.promptTokenCount || 0),
            outputTokens: Number(usage?.candidatesTokenCount || 0),
            latencyMs: Date.now() - started,
            metadata: { responseId: response.responseId, activeHealthTest: true },
          }
        },
      })

      return {
        provider: this.providerCode,
        enabled: true,
        available: true,
        model: health.model || route.model,
        checkedAt: now(),
        lastSuccessAt: now(),
        message: health.reused
          ? 'Test actif réutilisé dans sa fenêtre de fraîcheur; aucun nouvel appel Gemini.'
          : health.joined
            ? 'Test actif joint à une vérification déjà en cours; aucun appel dupliqué.'
            : 'Connexion Gemini vérifiée sous budget et traçabilité AI Provider Control.',
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

    const requestHash = hash({
      minimized,
      prompt: STRATEGY_ASSEMBLY_PROMPT.version,
      modelPolicy: config.primaryModel,
      objectiveId: request.objective.id,
      contextSnapshotId: request.context.id,
      commandCodes: request.commands.map(item => item.commandCode).sort(),
    })

    try {
      const governed = await executeGovernedAiRequest<GovernedStrategyPayload>({
        moduleKey: 'revenue_os',
        workspaceKey: 'strategy-assembly',
        capability: 'structured_strategy',
        commandCode: 'REVENUE_STRATEGY_ASSEMBLY',
        requestedModel: config.primaryModel,
        promptVersion: STRATEGY_ASSEMBLY_PROMPT.version,
        sourceRevision: hash({ objective: request.objective, context: request.context, commands: request.commands.map(item => item.commandCode) }),
        requestPayload: minimized,
        triggerType: 'manual',
        actorId: request.userId || null,
        missionId: request.runId,
        mandateId: request.objective.id,
        estimatedRequests: Math.max(1, config.maxRetries + 1),
        estimatedInputTokens,
        estimatedOutputTokens: config.maxOutputTokensPerRun,
        estimatedCostUsd: estimateAiCostUsd(estimatedInputTokens, config.maxOutputTokensPerRun),
        grounded: false,
        cacheTtlSeconds: config.cacheEnabled ? Math.max(config.cacheTtlSeconds, 3600) : 0,
        metadata: {
          tenantId: request.tenantId,
          strategyMinimum: request.minimumStrategies,
          idempotencyKey: request.idempotencyKey,
          promptCode: request.promptCode,
        },
        execute: async ({ apiKey, model }) => {
          let attempts = 0
          const executionStarted = Date.now()
          const response = await withRevenueAiRetry(async () => {
            attempts += 1
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), config.timeoutMs)
            try {
              return await invokeGeminiProvider({
                apiKey,
                model,
                contents: serialized,
                systemInstruction: STRATEGY_ASSEMBLY_PROMPT.content,
                responseMimeType: 'application/json',
                responseJsonSchema: GEMINI_STRATEGY_JSON_SCHEMA,
                maxOutputTokens: config.maxOutputTokensPerRun,
                thinkingLevel: 'MEDIUM',
                abortSignal: controller.signal,
              })
            } finally {
              clearTimeout(timer)
            }
          }, Math.min(config.maxRetries, 1))

          const text = response.text
          if (!text) throw new RevenueAiError('INVALID_OUTPUT', 'Gemini returned no text', false, 502)
          let parsed: unknown
          try {
            parsed = JSON.parse(text)
          } catch (error) {
            throw new RevenueAiError('INVALID_OUTPUT', 'Gemini returned malformed JSON', false, 502, error)
          }
          const assembly = geminiStrategyAssembly.safeParse(parsed)
          if (!assembly.success) {
            throw new RevenueAiError(
              'INVALID_OUTPUT',
              `Gemini schema validation failed: ${assembly.error.issues.slice(0, 8).map(issue => `${issue.path.map(String).join('.')}:${issue.message}`).join('|')}`,
              false,
              502,
            )
          }
          const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined
          const inputTokens = Number(usage?.promptTokenCount || 0)
          const outputTokens = Number(usage?.candidatesTokenCount || 0)
          return {
            result: {
              assembly: assembly.data,
              modelVersion: response.modelVersion,
              responseId: response.responseId,
              attempts,
            },
            requestCount: attempts,
            inputTokens,
            outputTokens,
            latencyMs: Date.now() - executionStarted,
            estimatedCostUsd: estimateAiCostUsd(inputTokens, outputTokens),
            metadata: { responseId: response.responseId, modelVersion: response.modelVersion, attempts },
          }
        },
      })

      const assembly = governed.result.assembly
      const byCode = new Map(request.commands.map(item => [item.commandCode, item]))
      const strategies: RevenueStrategy[] = assembly.strategies.map((draft: any, index: number) => {
        const selected = draft.commandCodes
          .map((code: string) => byCode.get(code))
          .filter((item: (typeof request.commands)[number] | undefined): item is (typeof request.commands)[number] => Boolean(item))
        if (selected.length < 3) throw new RevenueAiError('INVALID_OUTPUT', `Strategy ${index + 1} has fewer than 3 valid command references`, false, 502)
        return {
          id: crypto.randomUUID(),
          code: `STRAT-GEMINI-${request.runId.slice(0, 8)}-${String(index + 1).padStart(2, '0')}`,
          tenantId: request.tenantId,
          objectiveId: request.objective.id,
          contextSnapshotId: request.context.id,
          archetype: draft.archetype,
          thesis: draft.thesis,
          objective: draft.objective,
          targetMarket: draft.targetMarket,
          targetSegments: draft.targetSegments,
          accountProfile: draft.accountProfile,
          businessProblem: draft.businessProblem,
          offer: draft.offer,
          valueProposition: draft.valueProposition,
          differentiatingAngle: draft.differentiatingAngle,
          channelMix: draft.channelMix,
          messageArchitecture: draft.messageArchitecture,
          campaignSequence: draft.campaignSequence,
          decisionMakerStrategy: draft.decisionMakerStrategy,
          meetingStrategy: draft.meetingStrategy,
          proposalStrategy: draft.proposalStrategy,
          pricingPosture: draft.pricingPosture,
          scarcityMechanism: draft.scarcityMechanism,
          trustEvidence: draft.trustEvidence,
          resourcesRequired: draft.resourcesRequired,
          capacityRequirements: draft.capacityRequirements,
          predictedResults: draft.predictedResults,
          assumptions: draft.assumptions.map((item: any) => ({ ...item, id: crypto.randomUUID() })),
          confidence: draft.confidence,
          risks: draft.risks.map((item: any) => ({ ...item, id: crypto.randomUUID() })),
          fallbackPlan: draft.fallbackPlan,
          stopConditions: draft.stopConditions,
          commandPortfolio: selected,
          scenarios: draft.scenarios.map((item: any) => ({ ...item, id: crypto.randomUUID() })),
          status: 'ready_for_comparison',
          version: '1.0.0',
          combinationLineage: [],
          assemblyRunId: request.runId,
          createdAt: now(),
        }
      })

      const raw = JSON.stringify(governed.result.assembly)
      return {
        provider: this.providerCode,
        model: governed.result.modelVersion || governed.model || config.primaryModel,
        modelVersion: governed.result.modelVersion,
        responseId: governed.result.responseId,
        strategies,
        usage: {
          inputTokens: governed.usage.inputTokens,
          outputTokens: governed.usage.outputTokens,
          totalTokens: governed.usage.inputTokens + governed.usage.outputTokens,
          estimatedCostUsd: governed.usage.estimatedCostUsd,
        },
        latencyMs: Date.now() - started,
        requestHash,
        responseHash: hash(raw),
        fallbackUsed: governed.result.attempts > 1,
        rawStatus: governed.decision.toLowerCase(),
      }
    } catch (error) {
      const classified = classifyRevenueAiError(error)
      if (String(classified.code) === 'UNKNOWN') {
        throw new RevenueAiError('PROVIDER_ERROR', classified.message, true, classified.status, error)
      }
      throw error
    }
  }
}
