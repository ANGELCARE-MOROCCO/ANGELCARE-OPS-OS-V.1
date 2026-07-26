import crypto from 'node:crypto'
import { objectiveSchema } from './schemas'
import { buildContextSnapshot } from './context-assembler'
import { createSupabaseContextAdapters } from './supabase-context-adapters'
import { selectCommandPortfolio, type CandidateCommand } from './command-portfolio'
import { readRevenueCommandKernel } from '../command-kernel/repository'
import { compareStrategies } from './comparison'
import { validateStrategyPreflight } from './guardrails'
import { validateMaterialDiversity } from '../ai/diversity-validator'
import { resolveRevenueAiProvider, resolveDeterministicFallback } from '../ai/provider-registry'
import { getRevenueAiConfig } from '../ai/config'
import { STRATEGY_ASSEMBLY_PROMPT } from '../ai/prompt-registry'
import {
  createAiJob,
  persistAiAssembly,
  recordAiAttempt,
  updateAiJob,
} from '../ai/repository'
import type { RevenueObjective } from './types'

export async function runGeminiStrategyAssembly(input: {
  objective: RevenueObjective
  userId: string
  idempotencyKey?: string
}) {
  const objective = objectiveSchema.parse(input.objective)
  const config = getRevenueAiConfig()
  const idempotencyKey = input.idempotencyKey || crypto
    .createHash('sha256')
    .update(`${objective.tenantId}:${objective.id}:${objective.status}`)
    .digest('hex')

  const job = await createAiJob({
    tenantId: objective.tenantId,
    userId: input.userId,
    objectiveId: objective.id,
    idempotencyKey,
  })
  const runId = String(job.id)

  try {
    await updateAiJob(runId, 'assembling_context')
    const context = await buildContextSnapshot(objective, createSupabaseContextAdapters())

    await updateAiJob(runId, 'selecting_commands')
    const { bootstrap } = await readRevenueCommandKernel()
    const candidates: CandidateCommand[] = bootstrap.commands.map((command) => ({
      commandCode: command.commandCode,
      version: command.activeVersion,
      family: command.family,
      health: 'healthy',
      status: command.status,
      segments: command.segments,
      territories: command.territories,
      stages: command.commercialStages,
      requiredContext: command.requiredContext.map((item) =>
        typeof item === 'string' ? item : String((item as any).key || ''),
      ),
      forbiddenTools: command.toolPermissions
        .filter((item) => (item as any).access === 'forbidden')
        .map((item) => (item as any).tool),
      performance: 0.8,
    }))
    const commands = selectCommandPortfolio(objective, context, candidates)
    if (commands.length < 3) throw new Error('INSUFFICIENT_ELIGIBLE_COMMANDS')

    const request = {
      runId,
      tenantId: objective.tenantId,
      userId: input.userId,
      objective,
      context,
      commands,
      minimumStrategies: config.minimumStrategies,
      promptCode: STRATEGY_ASSEMBLY_PROMPT.code,
      promptVersion: STRATEGY_ASSEMBLY_PROMPT.version,
      idempotencyKey,
    }

    await updateAiJob(runId, 'calling_provider', {
      payload: {
        executionMode: 'approval-gated',
        externalActions: 0,
        contextSnapshotId: context.id,
        contextFactCount: context.facts.length,
        hypothesisCount: context.hypotheses.length,
        unknownCount: context.unknowns.length,
        contradictionCount: context.contradictions.length,
        selectedCommandCount: commands.length,
        selectedCommands: commands.map((command) => command.commandCode),
      },
    })

    let result
    let providerError: unknown
    try {
      result = await resolveRevenueAiProvider().generateStructured(request)
    } catch (error) {
      providerError = error
      if (!config.deterministicFallback) throw error
      result = await resolveDeterministicFallback().generateStructured(request)
    }

    await updateAiJob(runId, 'validating_output')
    for (const strategy of result.strategies) {
      const preflight = validateStrategyPreflight(strategy)
      if (!preflight.pass) throw new Error(`STRATEGY_PREFLIGHT:${preflight.errors.join('|')}`)
    }
    const diversity = validateMaterialDiversity(result.strategies, config.minimumStrategies)
    if (!diversity.pass) throw new Error(`STRATEGY_DIVERSITY:${diversity.errors.join('|')}`)

    const comparison = compareStrategies(objective.id, result.strategies)
    await updateAiJob(runId, 'persisting')
    await persistAiAssembly({
      runId,
      objective,
      context,
      commands,
      strategies: result.strategies,
      comparison,
      result,
      userId: input.userId,
    })
    await recordAiAttempt(request, result, providerError)
    await updateAiJob(runId, 'completed', {
      completed_at: new Date().toISOString(),
      result_ref: comparison.id,
      payload: {
        provider: result.provider,
        model: result.model,
        promptCode: request.promptCode,
        promptVersion: request.promptVersion,
        strategyCount: result.strategies.length,
        strategyIds: result.strategies.map((strategy) => strategy.id),
        contextSnapshotId: context.id,
        contextFactCount: context.facts.length,
        hypothesisCount: context.hypotheses.length,
        unknownCount: context.unknowns.length,
        contradictionCount: context.contradictions.length,
        selectedCommandCount: commands.length,
        selectedCommands: commands.map((command) => command.commandCode),
        localResources: Array.from(new Set(context.facts.map((fact) => String(fact.key).split(':')[0]))),
        providerNativeToolCalls: 0,
        fallbackUsed: result.fallbackUsed,
        usage: result.usage,
        latencyMs: result.latencyMs,
        externalActions: 0,
      },
    })

    return {
      runId,
      objective,
      context,
      commands,
      strategies: result.strategies,
      comparison,
      provider: {
        code: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        usage: result.usage,
        latencyMs: result.latencyMs,
      },
      providerNativeToolCalls: 0,
      externalActions: 0,
    }
  } catch (error) {
    await updateAiJob(runId, 'failed', {
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    }).catch(() => undefined)
    throw error
  }
}
