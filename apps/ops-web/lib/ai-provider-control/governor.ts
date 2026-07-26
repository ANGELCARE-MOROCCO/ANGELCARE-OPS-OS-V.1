import { createServiceClient } from '@/lib/supabase/server'
import type { AiProviderCapability, AiProviderModuleKey, GovernedProviderAcquisition, GovernedUsage } from './types'

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) || null
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

function isMissingControlPlane(error: unknown) {
  const text = String((error as { message?: string })?.message || error || '').toLowerCase()
  return text.includes('ai_provider_') && (text.includes('does not exist') || text.includes('schema cache'))
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
    const secretResult = await supabase.rpc('ai_provider_resolve_secret', { p_credential_id: row.credential_id })
    if (secretResult.error) throw new Error(secretResult.error.message)
    const secretRow = firstRow(secretResult.data)
    const apiKey = String(secretRow?.decrypted_secret || secretResult.data || '')
    if (!apiKey) throw new Error('AI_PROVIDER_SECRET_UNAVAILABLE')
    return {
      governed: true,
      reservationId: String(row.reservation_id || '') || null,
      leaseId: String(row.lease_id || '') || null,
      dossierId: String(row.dossier_id || '') || null,
      capacityPoolId: String(row.capacity_pool_id || '') || null,
      credentialId: String(row.credential_id || '') || null,
      providerType: String(row.provider_type || 'gemini'),
      apiKey,
      model: String(row.model_code || input.requestedModel),
      moduleKey: input.moduleKey,
      capability: input.capability,
      assignmentMode: String(row.assignment_mode || '') || null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
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
    const secretResult = await supabase.rpc('ai_provider_resolve_secret', { p_credential_id: row.credential_id })
    if (secretResult.error) throw new Error(secretResult.error.message)
    const secretRow = firstRow(secretResult.data)
    const apiKey = String(secretRow?.decrypted_secret || secretResult.data || '')
    return {
      governed: true,
      reservationId: null,
      leaseId: null,
      dossierId: String(row.dossier_id || '') || null,
      capacityPoolId: String(row.capacity_pool_id || '') || null,
      credentialId: String(row.credential_id || '') || null,
      providerType: String(row.provider_type || 'gemini'),
      apiKey: apiKey || null,
      model: String(row.model_code || input.requestedModel),
      moduleKey: input.moduleKey,
      capability: input.capability || 'health_check',
      assignmentMode: String(row.assignment_mode || '') || null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'AI_PROVIDER_CONTROL_NOT_INSTALLED') {
      return {
        governed: false, reservationId: null, leaseId: null, dossierId: null,
        capacityPoolId: null, credentialId: null, providerType: 'gemini', apiKey: null,
        model: input.requestedModel, moduleKey: input.moduleKey,
        capability: input.capability || 'health_check', assignmentMode: null,
      }
    }
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
  const message = error instanceof Error ? error.message : String(error)
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
