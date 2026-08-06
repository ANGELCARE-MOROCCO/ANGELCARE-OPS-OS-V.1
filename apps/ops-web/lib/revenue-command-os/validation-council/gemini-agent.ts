import crypto from 'node:crypto'
import { getRevenueAiConfig } from '../ai/config'
import { withRevenueAiRetry } from '../ai/retry-controller'
import { redactSensitiveValues } from '../ai/sensitive-value-redactor'
import { councilReviewDraft, COUNCIL_REVIEW_JSON_SCHEMA } from './schemas'
import type { CouncilReviewDraft } from './schemas'
import { councilPrompt } from './prompts'
import type { CouncilAgentInput, CouncilReview } from './types'
import { estimateAiCostUsd, executeGovernedAiRequest } from '@/lib/ai-provider-control/governor'
import { invokeGeminiProvider } from '@/lib/ai-provider-control/gemini-runtime'

const h = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const now = () => new Date().toISOString()

export async function runCouncilAgent(input: CouncilAgentInput): Promise<CouncilReview> {
  const config = getRevenueAiConfig()
  const payload = redactSensitiveValues({
    strategy: input.strategy,
    context: {
      ...input.context,
      facts: input.context.facts.slice(0, 80),
      hypotheses: input.context.hypotheses.slice(0, 40),
    },
    agent: input.agent,
    priorReviews: input.priorReviews?.map(review => ({
      agentCode: review.agentCode,
      verdict: review.verdict,
      score: review.score,
      blockingIssues: review.blockingIssues,
    })),
    redTeamAttacks: input.redTeamAttacks,
  })
  const serialized = JSON.stringify(payload)
  const requestHash = h(payload)
  if (!config.enabled) throw new Error('COUNCIL_GEMINI_DISABLED')

  try {
    const estimatedInputTokens = Math.ceil(serialized.length / 4)
    const governed = await executeGovernedAiRequest<CouncilReviewDraft>({
      moduleKey: 'revenue_os',
      workspaceKey: 'validation-council',
      capability: 'structured_strategy',
      commandCode: `REVENUE_COUNCIL_${input.agent.code.toUpperCase()}`,
      requestedModel: config.primaryModel,
      promptVersion: input.agent.promptVersion,
      sourceRevision: h({
        strategyId: input.strategy.id,
        strategyVersion: input.strategy.version,
        contextSnapshotId: input.context.id,
        agentCode: input.agent.code,
        priorReviews: input.priorReviews?.map(review => [review.agentCode, review.responseHash]),
        redTeamAttacks: input.redTeamAttacks,
      }),
      requestPayload: payload,
      triggerType: 'manual',
      actorId: input.run.requestedBy,
      missionId: input.run.id,
      mandateId: input.run.objectiveId,
      estimatedRequests: 1,
      estimatedInputTokens,
      estimatedOutputTokens: Math.min(config.maxOutputTokensPerRun, 7000),
      estimatedCostUsd: estimateAiCostUsd(estimatedInputTokens, Math.min(config.maxOutputTokensPerRun, 7000)),
      cacheTtlSeconds: 86400,
      metadata: {
        tenantId: input.run.tenantId,
        strategyId: input.strategy.id,
        strategyVersion: input.strategy.version,
        agentCode: input.agent.code,
        sharedContextSnapshotId: input.context.id,
      },
      execute: async ({ apiKey, model }) => {
        const started = Date.now()
        let attempts = 0
        const response = await withRevenueAiRetry(
          async () => {
            attempts += 1
            return invokeGeminiProvider({
            apiKey,
            model,
            contents: serialized,
            systemInstruction: councilPrompt(input.agent),
            responseMimeType: 'application/json',
            responseJsonSchema: COUNCIL_REVIEW_JSON_SCHEMA,
            maxOutputTokens: Math.min(config.maxOutputTokensPerRun, 7000),
            thinkingLevel: 'MEDIUM',
            abortSignal: AbortSignal.timeout(config.timeoutMs),
            })
          },
          Math.min(config.maxRetries, 1),
        )
        if (!response.text) throw new Error('COUNCIL_EMPTY_RESPONSE')
        const parsed = councilReviewDraft.parse(JSON.parse(response.text))
        if (parsed.agentCode !== input.agent.code) throw new Error('COUNCIL_AGENT_IDENTITY_MISMATCH')
        const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined
        const inputTokens = Number(usage?.promptTokenCount || 0)
        const outputTokens = Number(usage?.candidatesTokenCount || 0)
        return {
          result: parsed,
          requestCount: attempts,
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - started,
          estimatedCostUsd: estimateAiCostUsd(inputTokens, outputTokens),
          metadata: {
            responseId: response.responseId,
            modelVersion: response.modelVersion,
            agentCode: input.agent.code,
            sharedContextSnapshotId: input.context.id,
          },
        }
      },
    })

    const parsed = governed.result
    return {
      id: crypto.randomUUID(),
      runId: input.run.id,
      tenantId: input.run.tenantId,
      strategyId: input.strategy.id,
      strategyVersion: input.strategy.version,
      ...parsed,
      findings: parsed.findings.map(item => ({ ...item, id: crypto.randomUUID() })),
      evidenceChecks: parsed.evidenceChecks.map(item => ({ ...item, id: crypto.randomUUID() })),
      contradictions: parsed.contradictions.map(item => ({ ...item, id: crypto.randomUUID() })),
      provider: 'gemini',
      model: governed.model || config.primaryModel,
      promptVersion: input.agent.promptVersion,
      requestHash,
      responseHash: h(parsed),
      inputTokens: governed.usage.inputTokens,
      outputTokens: governed.usage.outputTokens,
      latencyMs: 0,
      fallbackUsed: false,
      externalActions: 0,
      reviewedAt: now(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`COUNCIL_GEMINI_EXECUTION_FAILED:${message}`)
  }
}
