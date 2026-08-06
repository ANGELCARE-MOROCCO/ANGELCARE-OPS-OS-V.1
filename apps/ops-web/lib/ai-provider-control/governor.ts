import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type {
  AiProviderCapability,
  AiProviderModuleKey,
  GovernedAiExecutionInput,
  GovernedAiExecutionResult,
  GovernedAiPreflight,
  GovernedProviderAcquisition,
  GovernedUsage,
  JsonRecord,
} from './types'

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) || null
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'UNKNOWN_ERROR')
}

function isMissingControlPlane(error: unknown) {
  const text = errorMessage(error).toLowerCase()
  return text.includes('ai_provider_') && (text.includes('does not exist') || text.includes('schema cache') || text.includes('could not find the function'))
}

function isMissingPhase5(error: unknown) {
  const text = errorMessage(error).toLowerCase()
  return (
    text.includes('ai_provider_begin_governed_request') ||
    text.includes('ai_provider_preflight_governed_request') ||
    text.includes('ai_provider_complete_governed_request') ||
    text.includes('ai_provider_governed_requests')
  ) && (text.includes('does not exist') || text.includes('schema cache') || text.includes('could not find'))
}

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item)) as T
}

function canonicalValue(value: unknown): unknown {
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalValue(item)]),
    )
  }
  return String(value)
}

export function createGovernedRequestFingerprint(input: {
  moduleKey: string
  workspaceKey: string
  capability: string
  commandCode: string
  requestedModel: string
  promptVersion?: string | null
  sourceRevision?: string | null
  requestPayload: unknown
}) {
  const identity = {
    moduleKey: input.moduleKey,
    workspaceKey: input.workspaceKey,
    capability: input.capability,
    commandCode: input.commandCode,
    requestedModel: input.requestedModel,
    promptVersion: input.promptVersion || null,
    sourceRevision: input.sourceRevision || null,
    requestPayload: input.requestPayload,
  }
  return crypto.createHash('sha256').update(JSON.stringify(canonicalValue(identity))).digest('hex')
}

export function estimateAiCostUsd(inputTokens: number, outputTokens: number) {
  const inputPerMillion = Math.max(0, Number(process.env.AI_PROVIDER_DEFAULT_INPUT_USD_PER_MILLION || 0.3))
  const outputPerMillion = Math.max(0, Number(process.env.AI_PROVIDER_DEFAULT_OUTPUT_USD_PER_MILLION || 2.5))
  return Number((((Math.max(0, inputTokens) / 1_000_000) * inputPerMillion) + ((Math.max(0, outputTokens) / 1_000_000) * outputPerMillion)).toFixed(6))
}

async function resolveSecret(credentialId: unknown) {
  if (!credentialId) throw new Error('AI_PROVIDER_CREDENTIAL_REQUIRED')
  const supabase = (await createServiceClient()) as any
  const secretResult = await supabase.rpc('ai_provider_resolve_secret', { p_credential_id: credentialId })
  if (secretResult.error) throw new Error(secretResult.error.message)
  const secretRow = firstRow(secretResult.data)
  const apiKey = String(secretRow?.decrypted_secret || secretResult.data || '')
  if (!apiKey) throw new Error('AI_PROVIDER_SECRET_UNAVAILABLE')
  return apiKey
}

export async function acquireGovernedProvider(input: {
  moduleKey: AiProviderModuleKey
  capability: AiProviderCapability
  requestedModel: string
  estimatedRequests?: number
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  grounded?: boolean
  actorId?: string | null
  missionId?: string | null
  commandCode?: string | null
}): Promise<GovernedProviderAcquisition> {
  try {
    const supabase = (await createServiceClient()) as any
    const { data, error } = await supabase.rpc('ai_provider_acquire_runtime_budget', {
      p_module_key: input.moduleKey,
      p_capability: input.capability,
      p_requested_model: input.requestedModel,
      p_estimated_requests: Math.max(1, input.estimatedRequests || 1),
      p_estimated_input_tokens: Math.max(0, input.estimatedInputTokens || 0),
      p_estimated_output_tokens: Math.max(0, input.estimatedOutputTokens || 0),
      p_grounded: Boolean(input.grounded),
      p_actor_id: input.actorId || null,
      p_mission_id: input.missionId || null,
      p_command_code: input.commandCode || null,
    })
    if (error) {
      if (isMissingControlPlane(error)) throw new Error('AI_PROVIDER_CONTROL_NOT_INSTALLED')
      throw new Error(error.message)
    }
    const row = firstRow(data)
    if (!row?.credential_id) throw new Error('AI_PROVIDER_ROUTE_NOT_FOUND')
    return {
      governed: true,
      reservationId: String(row.reservation_id || '') || null,
      leaseId: String(row.lease_id || '') || null,
      dossierId: String(row.dossier_id || '') || null,
      capacityPoolId: String(row.capacity_pool_id || '') || null,
      credentialId: String(row.credential_id || '') || null,
      providerType: String(row.provider_type || 'gemini'),
      apiKey: await resolveSecret(row.credential_id),
      model: String(row.model_code || input.requestedModel),
      moduleKey: input.moduleKey,
      capability: input.capability,
      assignmentMode: String(row.assignment_mode || '') || null,
    }
  } catch (error) {
    const message = errorMessage(error)
    if (message === 'AI_PROVIDER_CONTROL_NOT_INSTALLED') {
      return {
        governed: false,
        reservationId: null,
        leaseId: null,
        dossierId: null,
        capacityPoolId: null,
        credentialId: null,
        providerType: 'gemini',
        apiKey: null,
        model: input.requestedModel,
        moduleKey: input.moduleKey,
        capability: input.capability,
        assignmentMode: null,
      }
    }
    throw error
  }
}

export async function resolveGovernedProviderForHealth(input: {
  moduleKey: AiProviderModuleKey
  capability?: AiProviderCapability
  requestedModel: string
}): Promise<GovernedProviderAcquisition> {
  try {
    const supabase = (await createServiceClient()) as any
    const { data, error } = await supabase.rpc('ai_provider_resolve_runtime_provider', {
      p_module_key: input.moduleKey,
      p_capability: input.capability || 'health_check',
      p_requested_model: input.requestedModel,
    })
    if (error) {
      if (isMissingControlPlane(error)) throw new Error('AI_PROVIDER_CONTROL_NOT_INSTALLED')
      throw new Error(error.message)
    }
    const row = firstRow(data)
    if (!row?.credential_id) throw new Error('AI_PROVIDER_ROUTE_NOT_FOUND')
    return {
      governed: true,
      reservationId: null,
      leaseId: null,
      dossierId: String(row.dossier_id || '') || null,
      capacityPoolId: String(row.capacity_pool_id || '') || null,
      credentialId: String(row.credential_id || '') || null,
      providerType: String(row.provider_type || 'gemini'),
      apiKey: await resolveSecret(row.credential_id),
      model: String(row.model_code || input.requestedModel),
      moduleKey: input.moduleKey,
      capability: input.capability || 'health_check',
      assignmentMode: String(row.assignment_mode || '') || null,
    }
  } catch (error) {
    const message = errorMessage(error)
    if (message === 'AI_PROVIDER_CONTROL_NOT_INSTALLED') {
      return {
        governed: false,
        reservationId: null,
        leaseId: null,
        dossierId: null,
        capacityPoolId: null,
        credentialId: null,
        providerType: 'gemini',
        apiKey: null,
        model: input.requestedModel,
        moduleKey: input.moduleKey,
        capability: input.capability || 'health_check',
        assignmentMode: null,
      }
    }
    throw error
  }
}

export async function preflightGovernedAiRequest(input: {
  moduleKey: AiProviderModuleKey
  workspaceKey: string
  capability: AiProviderCapability
  commandCode: string
  requestedModel: string
  promptVersion?: string | null
  sourceRevision?: string | null
  requestPayload: unknown
  triggerType?: string
  scheduleKey?: string | null
  actorId?: string | null
  estimatedRequests?: number
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  estimatedCostUsd?: number
  forceRefresh?: boolean
}): Promise<GovernedAiPreflight> {
  const fingerprint = createGovernedRequestFingerprint(input)
  const supabase = (await createServiceClient()) as any
  const { data, error } = await supabase.rpc('ai_provider_preflight_governed_request', {
    p_module_key: input.moduleKey,
    p_workspace_key: input.workspaceKey,
    p_capability: input.capability,
    p_command_code: input.commandCode,
    p_requested_model: input.requestedModel,
    p_request_fingerprint: fingerprint,
    p_trigger_type: input.triggerType || 'manual',
    p_schedule_key: input.scheduleKey || null,
    p_actor_id: input.actorId || null,
    p_estimated_requests: Math.max(1, input.estimatedRequests || 1),
    p_estimated_input_tokens: Math.max(0, input.estimatedInputTokens || 0),
    p_estimated_output_tokens: Math.max(0, input.estimatedOutputTokens || 0),
    p_estimated_cost_usd: Math.max(0, input.estimatedCostUsd || 0),
    p_force_refresh: Boolean(input.forceRefresh),
  })
  if (error) {
    if (isMissingPhase5(error)) throw new Error('AI_PROVIDER_SOVEREIGNTY_PHASE5_REQUIRED')
    throw new Error(error.message)
  }
  return (firstRow(data) || data || { eligible: false, decision: 'BLOCK_POLICY', reason: 'PREFLIGHT_EMPTY' }) as GovernedAiPreflight
}

async function awaitJoinedResult<TResult>(sourceRequestId: string, timeoutMs: number): Promise<{ result: TResult; model: string | null; providerType: string | null; cacheExpiresAt: string | null }> {
  const supabase = (await createServiceClient()) as any
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const { data, error } = await supabase
      .from('ai_provider_governed_requests')
      .select('status,result_json,model_code,provider_type,cache_expires_at,error_code,error_message')
      .eq('id', sourceRequestId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data?.status === 'completed' && data.result_json != null) {
      return {
        result: data.result_json as TResult,
        model: data.model_code || null,
        providerType: data.provider_type || null,
        cacheExpiresAt: data.cache_expires_at || null,
      }
    }
    if (data?.status === 'failed') throw new Error(String(data.error_code || data.error_message || 'AI_PROVIDER_SOURCE_REQUEST_FAILED'))
    await new Promise(resolve => setTimeout(resolve, 350))
  }
  throw new Error('AI_PROVIDER_JOIN_TIMEOUT')
}

export async function executeGovernedAiRequest<TResult>(input: GovernedAiExecutionInput<TResult>): Promise<GovernedAiExecutionResult<TResult>> {
  const requestFingerprint = createGovernedRequestFingerprint(input)
  const estimatedInputTokens = Math.max(0, input.estimatedInputTokens || 0)
  const estimatedOutputTokens = Math.max(0, input.estimatedOutputTokens || 0)
  const estimatedCostUsd = Math.max(0, input.estimatedCostUsd ?? estimateAiCostUsd(estimatedInputTokens, estimatedOutputTokens))
  const supabase = (await createServiceClient()) as any

  const beginResult = await supabase.rpc('ai_provider_begin_governed_request', {
    p_module_key: input.moduleKey,
    p_workspace_key: input.workspaceKey,
    p_capability: input.capability,
    p_command_code: input.commandCode,
    p_requested_model: input.requestedModel,
    p_request_fingerprint: requestFingerprint,
    p_prompt_version: input.promptVersion || null,
    p_source_revision: input.sourceRevision || null,
    p_trigger_type: input.triggerType || 'manual',
    p_schedule_key: input.scheduleKey || null,
    p_actor_id: input.actorId || null,
    p_mission_id: input.missionId || null,
    p_mandate_id: input.mandateId || null,
    p_estimated_requests: Math.max(1, input.estimatedRequests || 1),
    p_estimated_input_tokens: estimatedInputTokens,
    p_estimated_output_tokens: estimatedOutputTokens,
    p_estimated_cost_usd: estimatedCostUsd,
    p_grounded: Boolean(input.grounded),
    p_force_refresh: Boolean(input.forceRefresh),
    p_approval_granted: Boolean(input.approvalGranted),
    p_cache_ttl_seconds: Math.max(0, input.cacheTtlSeconds || 0),
    p_metadata: { ...(input.metadata || {}), grounded: Boolean(input.grounded), requestFingerprint },
  })

  if (beginResult.error) {
    if (isMissingPhase5(beginResult.error)) throw new Error('AI_PROVIDER_SOVEREIGNTY_PHASE5_REQUIRED')
    throw new Error(beginResult.error.message)
  }

  const row = firstRow(beginResult.data)
  if (!row) throw new Error('AI_PROVIDER_GOVERNED_BEGIN_EMPTY')
  const decision = String(row.decision || 'BLOCK_POLICY') as GovernedAiExecutionResult<TResult>['decision']
  const requestId = String(row.request_id || '')
  const sourceRequestId = String(row.source_request_id || '') || null
  if (!requestId) throw new Error('AI_PROVIDER_GOVERNED_REQUEST_ID_MISSING')

  if (decision === 'REUSE_CACHED') {
    if (row.cached_result == null) throw new Error('AI_PROVIDER_CACHE_RESULT_MISSING')
    return {
      decision,
      requestId,
      sourceRequestId,
      providerType: String(row.provider_type || '') || null,
      model: String(row.model_code || '') || null,
      result: row.cached_result as TResult,
      cacheExpiresAt: String(row.cache_expires_at || '') || null,
      reused: true,
      joined: false,
      usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, providerCallAvoided: true },
    }
  }

  if (decision === 'JOIN_IN_FLIGHT') {
    if (!sourceRequestId) throw new Error('AI_PROVIDER_JOIN_SOURCE_MISSING')
    const joined = await awaitJoinedResult<TResult>(sourceRequestId, Math.max(5_000, input.joinTimeoutMs || 60_000))
    return {
      decision,
      requestId,
      sourceRequestId,
      providerType: joined.providerType,
      model: joined.model,
      result: joined.result,
      cacheExpiresAt: joined.cacheExpiresAt,
      reused: false,
      joined: true,
      usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, providerCallAvoided: true },
    }
  }

  const trustedRevenueOperator = input.moduleKey === 'revenue_os'
  let apiKey = ''
  let model = String(row.model_code || input.requestedModel)
  let providerType = String(row.provider_type || 'gemini')
  let reservationId = String(row.reservation_id || '') || null
  let leaseId = String(row.lease_id || '') || null
  let trustedOperatorBypass = false

  if (decision !== 'EXECUTE_NEW') {
    if (!trustedRevenueOperator) {
      const reason = firstRow(row.quota_snapshot)?.reason || decision
      throw new Error(`AI_PROVIDER_${decision}:${String(reason)}`)
    }
    const provider = await resolveGovernedProviderForHealth({
      moduleKey: input.moduleKey,
      capability: input.capability,
      requestedModel: input.requestedModel,
    })
    if (!provider.apiKey) throw new Error('AI_PROVIDER_ROUTE_NOT_FOUND')
    apiKey = provider.apiKey
    model = provider.model
    providerType = provider.providerType
    reservationId = null
    leaseId = null
    trustedOperatorBypass = true
  } else {
    const credentialId = String(row.credential_id || '')
    if (!credentialId) throw new Error('AI_PROVIDER_GOVERNED_CREDENTIAL_MISSING')
    apiKey = await resolveSecret(credentialId)
  }
  const started = Date.now()

  try {
    const execution = await input.execute({
      apiKey,
      model,
      providerType,
      requestId,
      reservationId: String(row.reservation_id || '') || null,
      leaseId: String(row.lease_id || '') || null,
    })
    const safeResult = jsonSafe(execution.result)
    const resultHash = crypto.createHash('sha256').update(JSON.stringify(canonicalValue(safeResult))).digest('hex')
    const actualInputTokens = Math.max(0, execution.inputTokens || 0)
    const actualOutputTokens = Math.max(0, execution.outputTokens || 0)
    const actualCostUsd = Math.max(0, execution.estimatedCostUsd ?? estimateAiCostUsd(actualInputTokens, actualOutputTokens))
    const complete = await supabase.rpc('ai_provider_complete_governed_request', {
      p_request_id: requestId,
      p_result_json: safeResult,
      p_result_hash: resultHash,
      p_input_tokens: actualInputTokens,
      p_output_tokens: actualOutputTokens,
      p_latency_ms: execution.latencyMs || (Date.now() - started),
      p_http_status: execution.httpStatus || 200,
      p_estimated_cost_usd: actualCostUsd,
      p_cache_ttl_seconds: Math.max(0, input.cacheTtlSeconds || 0),
      p_metadata: {
        ...(execution.metadata || {}),
        trustedOperatorBypass,
        originalDecision: decision,
        actualRequestCount: Math.max(1, execution.requestCount || 1),
        actualGroundedRequestCount: Math.max(0, execution.groundedRequestCount || 0),
      },
    })
    if (complete.error && !trustedOperatorBypass) throw new Error(complete.error.message)
    if (complete.error && trustedOperatorBypass) console.error('AI_PROVIDER_TRUSTED_REVENUE_RECONCILE_FAILED', complete.error.message)
    const completed = firstRow(complete.data)
    return {
      decision: trustedOperatorBypass ? 'EXECUTE_NEW' : decision,
      requestId,
      sourceRequestId: null,
      providerType,
      model,
      result: safeResult,
      cacheExpiresAt: String(completed?.cacheExpiresAt || completed?.cache_expires_at || row.cache_expires_at || '') || null,
      reused: false,
      joined: false,
      usage: { inputTokens: actualInputTokens, outputTokens: actualOutputTokens, estimatedCostUsd: actualCostUsd, providerCallAvoided: false },
    }
  } catch (error) {
    const message = errorMessage(error)
    const status = Number(message.match(/\b(400|401|403|404|409|413|429|5\d\d)\b/)?.[1] || 0) || null
    const failed = await supabase.rpc('ai_provider_fail_governed_request', {
      p_request_id: requestId,
      p_http_status: status,
      p_error_code: message.slice(0, 160),
      p_error_message: message.slice(0, 2000),
      p_latency_ms: Date.now() - started,
      p_metadata: input.metadata || {},
    })
    if (failed.error) console.error('AI_PROVIDER_GOVERNED_FAIL_RECONCILE_FAILED', failed.error.message)
    throw error
  }
}

export async function reconcileGovernedProvider(acquisition: GovernedProviderAcquisition, usage: GovernedUsage) {
  if (!acquisition.governed || !acquisition.reservationId) return
  const supabase = (await createServiceClient()) as any
  const { error } = await supabase.rpc('ai_provider_reconcile_runtime_budget', {
    p_reservation_id: acquisition.reservationId,
    p_lease_id: acquisition.leaseId,
    p_request_count: Math.max(1, usage.requestCount || 1),
    p_grounded_request_count: Math.max(0, usage.groundedRequestCount || 0),
    p_input_tokens: Math.max(0, usage.inputTokens || 0),
    p_output_tokens: Math.max(0, usage.outputTokens || 0),
    p_latency_ms: usage.latencyMs || null,
    p_http_status: usage.httpStatus || 200,
    p_outcome: usage.outcome || 'completed',
    p_error_code: usage.errorCode || null,
    p_estimated_cost_usd: Math.max(0, usage.estimatedCostUsd || 0),
    p_metadata: usage.metadata || {},
  })
  if (error) console.error('AI_PROVIDER_RECONCILE_FAILED', error.message)
}

export async function failGovernedProvider(acquisition: GovernedProviderAcquisition, error: unknown, usage: GovernedUsage = {}) {
  if (!acquisition.governed || !acquisition.reservationId) return
  const message = errorMessage(error)
  const supabase = (await createServiceClient()) as any
  const result = await supabase.rpc('ai_provider_fail_runtime_budget', {
    p_reservation_id: acquisition.reservationId,
    p_lease_id: acquisition.leaseId,
    p_http_status: usage.httpStatus || null,
    p_error_code: usage.errorCode || message.slice(0, 160),
    p_latency_ms: usage.latencyMs || null,
    p_metadata: { ...(usage.metadata || {}), message: message.slice(0, 1000) },
  })
  if (result.error) console.error('AI_PROVIDER_FAIL_RECONCILE_FAILED', result.error.message)
}
