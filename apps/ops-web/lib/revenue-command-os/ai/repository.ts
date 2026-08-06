import 'server-only'

import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type {
  RevenueAiGenerationRequest,
  RevenueAiGenerationResult,
  RevenueAiProviderHealth,
} from './types'
import type {
  CommandSelection,
  ContextSnapshot,
  RevenueObjective,
  RevenueStrategy,
  StrategyComparison,
} from '../strategy-brain/types'

const active = [
  'queued',
  'validating',
  'assembling_context',
  'selecting_commands',
  'calling_provider',
  'validating_output',
  'repairing_output',
  'persisting',
  'retry_scheduled',
]

async function client() {
  return await createServiceClient() as any
}

export async function assertAiQuota(
  tenantId: string,
  userId: string,
  _limits: { minute: number; day: number; concurrency: number },
) {
  // Compatibility only. Enforcement is exclusively performed by AI Provider Control
  // during ai_provider_begin_governed_request; Revenue OS keeps no second authority.
  return { tenantId, userId, authority: 'ai-provider-control' as const }
}

export async function createAiJob(input: {
  tenantId: string
  userId: string
  objectiveId: string
  idempotencyKey: string
}) {
  const c = await client()
  const row = {
    tenant_id: input.tenantId,
    user_id: input.userId,
    objective_id: input.objectiveId,
    status: 'queued',
    idempotency_key: input.idempotencyKey,
    lease_expires_at: new Date(Date.now() + 180000).toISOString(),
    payload: {
      executionMode: 'live',
      externalActions: 0,
      operatingSpine: true,
    },
  }
  const result = await c.from('revenue_os_ai_jobs')
    .upsert(row, { onConflict: 'tenant_id,idempotency_key', ignoreDuplicates: false })
    .select('*')
    .single()
  if (result.error) throw result.error
  return result.data
}

export async function updateAiJob(id: string, status: string, patch: Record<string, unknown> = {}) {
  const c = await client()
  const result = await c.from('revenue_os_ai_jobs')
    .update({ status, ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (result.error) throw result.error
}

export async function recordAiAttempt(
  request: RevenueAiGenerationRequest,
  result: RevenueAiGenerationResult | undefined,
  error: unknown,
  attempt = 1,
) {
  const c = await client()
  const row = {
    tenant_id: request.tenantId,
    user_id: request.userId,
    objective_id: request.objective.id,
    run_id: request.runId,
    provider: result?.provider || 'gemini',
    model: result?.model || process.env.GEMINI_PRIMARY_MODEL || 'unknown',
    prompt_code: request.promptCode,
    prompt_version: request.promptVersion,
    status: result ? 'completed' : 'failed',
    attempt_no: attempt,
    request_hash: result?.requestHash,
    response_hash: result?.responseHash,
    input_tokens: result?.usage.inputTokens || 0,
    output_tokens: result?.usage.outputTokens || 0,
    latency_ms: result?.latencyMs || 0,
    fallback_used: result?.fallbackUsed || false,
    error_code: error instanceof Error ? error.name : null,
    error_message: error instanceof Error ? error.message : null,
    external_actions: 0,
  }
  const saved = await c.from('revenue_os_ai_run_attempts').insert(row)
  if (saved.error) throw saved.error
}

function localResources(context: ContextSnapshot): string[] {
  const names = context.facts
    .map((fact) => String(fact.key || '').split(':')[0])
    .concat(context.hypotheses.map((fact) => String(fact.key || '').split(':')[0]))
    .filter(Boolean)
  return Array.from(new Set(names)).sort()
}

export async function persistAiAssembly(args: {
  runId: string
  objective: RevenueObjective
  context: ContextSnapshot
  commands: CommandSelection[]
  strategies: RevenueStrategy[]
  comparison: StrategyComparison
  result: RevenueAiGenerationResult
  userId: string
}) {
  const c = await client()
  const sourceHash = crypto.createHash('sha256').update(args.result.responseHash).digest('hex')
  const resources = localResources(args.context)
  const now = new Date().toISOString()

  const strategyRows = args.strategies.map((strategy) => ({
    id: strategy.id,
    tenant_id: strategy.tenantId,
    objective_id: strategy.objectiveId,
    strategy_id: strategy.id,
    status: strategy.status,
    payload: strategy,
    version: 1,
    source_hash: `${sourceHash}:${strategy.id}`,
  }))
  const versionRows = args.strategies.map((strategy) => ({
    tenant_id: strategy.tenantId,
    objective_id: strategy.objectiveId,
    strategy_id: strategy.id,
    status: 'active',
    payload: {
      strategy,
      provider: args.result.provider,
      model: args.result.model,
      responseHash: args.result.responseHash,
      runId: args.runId,
    },
    version: 1,
    source_hash: `${sourceHash}:v1:${strategy.id}`,
  }))
  const commandRows = args.commands.map((command) => ({
    id: crypto.randomUUID(),
    tenant_id: args.objective.tenantId,
    objective_id: args.objective.id,
    strategy_id: null,
    status: command.eligible ? 'selected' : 'excluded',
    payload: { ...command, runId: args.runId },
    version: 1,
    source_hash: `${sourceHash}:command:${command.commandCode}:${command.version}`,
  }))
  const assemblyPayload = {
    runId: args.runId,
    objectiveId: args.objective.id,
    status: 'completed',
    provider: args.result.provider,
    model: args.result.model,
    modelVersion: args.result.modelVersion,
    promptCode: 'REVENUE_STRATEGY_ASSEMBLY',
    strategyCount: args.strategies.length,
    strategyIds: args.strategies.map((strategy) => strategy.id),
    selectedCommandCount: args.commands.length,
    selectedCommands: args.commands.map((command) => command.commandCode),
    contextSnapshotId: args.context.id,
    contextFactCount: args.context.facts.length,
    hypothesisCount: args.context.hypotheses.length,
    unknownCount: args.context.unknowns.length,
    contradictionCount: args.context.contradictions.length,
    localResources: resources,
    providerNativeToolCalls: 0,
    externalActions: 0,
    fallbackUsed: args.result.fallbackUsed,
    latencyMs: args.result.latencyMs,
    usage: args.result.usage,
    comparisonId: args.comparison.id,
    completedAt: now,
  }
  const toolTracePayload = {
    runId: args.runId,
    traceType: 'governed_context_orchestration',
    localResources: resources,
    localContextAdapters: ['digital_twin', 'doctrine', 'signals', 'pipeline', 'capacity'],
    selectedCommands: args.commands.map((command) => ({
      code: command.commandCode,
      version: command.version,
      family: command.family,
      score: command.score,
      reason: command.reason,
    })),
    facts: args.context.facts.length,
    hypotheses: args.context.hypotheses.length,
    unknowns: args.context.unknowns.length,
    contradictions: args.context.contradictions.length,
    providerNativeToolCalls: 0,
    providerToolCallingEnabled: false,
    explanation: 'Les ressources AngelCare sont lues par les adaptateurs de contexte internes avant l’appel Gemini. Aucun outil externe natif Gemini n’est exécuté dans cette version.',
    externalActions: 0,
    recordedAt: now,
  }
  const modelRun = {
    tenant_id: args.objective.tenantId,
    objective_id: args.objective.id,
    status: 'completed',
    payload: {
      runId: args.runId,
      provider: args.result.provider,
      model: args.result.model,
      modelVersion: args.result.modelVersion,
      responseId: args.result.responseId,
      usage: args.result.usage,
      latencyMs: args.result.latencyMs,
      requestHash: args.result.requestHash,
      responseHash: args.result.responseHash,
      fallbackUsed: args.result.fallbackUsed,
      strategyCount: args.strategies.length,
      selectedCommandCount: args.commands.length,
      localResources: resources,
      providerNativeToolCalls: 0,
      externalActions: 0,
    },
    source_hash: args.result.responseHash,
  }
  const audit = {
    tenant_id: args.objective.tenantId,
    objective_id: args.objective.id,
    status: 'recorded',
    payload: {
      action: 'gemini_strategy_assembly_persisted',
      runId: args.runId,
      userId: args.userId,
      strategyIds: args.strategies.map((strategy) => strategy.id),
      selectedCommands: args.commands.map((command) => command.commandCode),
      localResources: resources,
      provider: args.result.provider,
      model: args.result.model,
      providerNativeToolCalls: 0,
      externalActions: 0,
    },
    source_hash: `audit:${sourceHash}`,
  }

  const operations = [
    c.from('revenue_os_strategy_objectives').upsert({
      id: args.objective.id,
      tenant_id: args.objective.tenantId,
      objective_id: args.objective.id,
      status: args.objective.status,
      payload: args.objective,
      source_hash: `objective:${args.objective.id}`,
    }, { onConflict: 'id' }),
    c.from('revenue_os_strategy_context_snapshots').upsert({
      id: args.context.id,
      tenant_id: args.context.tenantId,
      objective_id: args.objective.id,
      status: 'frozen',
      payload: args.context,
      source_hash: `context:${args.context.id}`,
    }, { onConflict: 'id' }),
    c.from('revenue_os_strategy_assembly_runs').upsert({
      id: args.runId,
      tenant_id: args.objective.tenantId,
      objective_id: args.objective.id,
      status: 'completed',
      payload: assemblyPayload,
      source_hash: `assembly:${sourceHash}`,
    }, { onConflict: 'id' }),
    c.from('revenue_os_strategy_command_selections').insert(commandRows),
    c.from('revenue_os_strategy_tool_traces').insert({
      id: crypto.randomUUID(),
      tenant_id: args.objective.tenantId,
      objective_id: args.objective.id,
      status: 'completed',
      payload: toolTracePayload,
      source_hash: `trace:${sourceHash}`,
    }),
    c.from('revenue_os_strategies').upsert(strategyRows, { onConflict: 'id' }),
    c.from('revenue_os_strategy_versions').insert(versionRows),
    c.from('revenue_os_strategy_comparisons').insert({
      id: args.comparison.id,
      tenant_id: args.objective.tenantId,
      objective_id: args.objective.id,
      status: 'generated',
      payload: args.comparison,
      source_hash: `comparison:${args.comparison.id}`,
    }),
    c.from('revenue_os_strategy_model_runs').insert(modelRun),
    c.from('revenue_os_strategy_audit_events').insert(audit),
  ]
  const results = await Promise.all(operations)
  for (const result of results) if (result.error) throw result.error
}

export async function saveProviderHealth(health: RevenueAiProviderHealth) {
  const c = await client()
  const result = await c.from('revenue_os_ai_provider_health').upsert({
    provider: health.provider,
    model: health.model,
    status: health.available ? 'available' : 'unavailable',
    checked_at: health.checkedAt,
    last_success_at: health.lastSuccessAt,
    last_failure_at: health.lastFailureAt,
    error_code: health.errorCode,
    message: health.message,
  }, { onConflict: 'provider,model' })
  if (result.error) throw result.error
}

export async function getAiUsage(_tenantId: string) {
  const c = await client()
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  const result = await c.from('ai_provider_usage_ledger')
    .select('request_count,input_tokens,output_tokens,outcome,status:outcome,occurred_at,created_at')
    .eq('module_key', 'revenue_os')
    .gte('occurred_at', since.toISOString())
  if (result.error) {
    const message = String(result.error.message || '')
    if (message.includes('does not exist') || message.includes('schema cache')) throw new Error('AI_PROVIDER_CONTROL_MIGRATION_REQUIRED')
    throw result.error
  }
  return result.data || []
}

export async function getAiJob(id: string, tenantId: string) {
  const c = await client()
  const result = await c.from('revenue_os_ai_jobs').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle()
  if (result.error) throw result.error
  return result.data
}

export async function cancelAiJob(id: string, tenantId: string) {
  const c = await client()
  const result = await c.from('revenue_os_ai_jobs')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .in('status', active)
  if (result.error) throw result.error
}
