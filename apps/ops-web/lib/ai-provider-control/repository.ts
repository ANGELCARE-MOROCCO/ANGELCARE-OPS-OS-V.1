import crypto from 'node:crypto'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createServiceClient } from '@/lib/supabase/server'
import type { AiProviderSnapshot, JsonRecord } from './types'

const now = () => new Date().toISOString()
const clean = (value: unknown) => String(value ?? '').trim()
const numberOrNull = (value: unknown) => value === '' || value == null ? null : Number(value)
const asArray = <T>(value: unknown) => Array.isArray(value) ? value as T[] : []

async function admin() { return (await createServiceClient()) as any }

async function selectSafe(table: string, order = 'created_at', ascending = false, limit = 500) {
  const supabase = await admin()
  const result = await supabase.from(table).select('*').order(order, { ascending }).limit(limit)
  if (result.error) {
    const text = String(result.error.message || '')
    if (text.includes('does not exist') || text.includes('schema cache')) throw new Error('AI_PROVIDER_CONTROL_MIGRATION_REQUIRED')
    throw new Error(text)
  }
  return asArray<JsonRecord>(result.data)
}

export async function loadAiProviderSnapshot(): Promise<AiProviderSnapshot> {
  const supabase = await admin()
  const since = new Date(); since.setHours(0, 0, 0, 0)
  const [dossiers, pools, credentials, models, assignments, routingRules, quotas, usage, healthChecks, incidents, alerts, configVersions, audit, emergencyResult] = await Promise.all([
    selectSafe('ai_provider_dossiers', 'created_at', false, 200),
    selectSafe('ai_provider_capacity_pools', 'created_at', false, 300),
    selectSafe('ai_provider_credentials', 'created_at', false, 500),
    selectSafe('ai_provider_models', 'display_name', true, 500),
    selectSafe('ai_provider_module_assignments', 'priority', true, 500),
    selectSafe('ai_provider_routing_rules', 'created_at', false, 500),
    selectSafe('ai_provider_quota_policies', 'created_at', false, 1000),
    selectSafe('ai_provider_usage_ledger', 'occurred_at', false, 5000),
    selectSafe('ai_provider_health_checks', 'checked_at', false, 200),
    selectSafe('ai_provider_incidents', 'created_at', false, 200),
    selectSafe('ai_provider_alerts', 'created_at', false, 200),
    selectSafe('ai_provider_config_versions', 'version_number', false, 100),
    selectSafe('ai_provider_audit', 'created_at', false, 300),
    supabase.from('ai_provider_emergency_state').select('*').eq('scope_key', '*').maybeSingle(),
  ])
  const todayUsage = usage.filter((row) => new Date(String(row.occurred_at || 0)) >= since)
  const sum = (key: string) => todayUsage.reduce((total, row) => total + Number(row[key] || 0), 0)
  return {
    generatedAt: now(),
    emergency: emergencyResult.data || null,
    dossiers: dossiers as any,
    pools: pools as any,
    credentials: credentials as any,
    models: models as any,
    assignments: assignments as any,
    routingRules,
    quotas: quotas as any,
    usage: usage as any,
    healthChecks,
    incidents,
    alerts,
    configVersions,
    audit,
    rollups: {
      todayRequests: sum('request_count'),
      todayGroundedRequests: sum('grounded_request_count'),
      todayInputTokens: sum('input_tokens'),
      todayOutputTokens: sum('output_tokens'),
      todayFailures: todayUsage.filter((row) => row.outcome === 'failed').length,
      activeDossiers: dossiers.filter((row) => row.is_enabled && ['ready', 'operating', 'limited'].includes(String(row.status))).length,
      operatingPools: pools.filter((row) => row.status === 'operating').length,
      activeCredentials: credentials.filter((row) => row.status === 'active').length,
    },
  }
}

async function audit(actor: { id: string; name: string }, action: string, entityType: string, entityId: string | null, payload: JsonRecord = {}) {
  const supabase = await admin()
  await supabase.from('ai_provider_audit').insert({
    action_key: action, entity_type: entityType, entity_id: entityId,
    actor_id: actor.id, actor_name: actor.name, payload,
  })
}

export async function executeAiProviderAction(action: string, payload: JsonRecord, actor: { id: string; name: string }) {
  const supabase = await admin()
  if (action === 'create_dossier') {
    const code = clean(payload.code || payload.name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
    if (!code || !clean(payload.name)) throw new Error('DOSSIER_NAME_REQUIRED')
    const dossierResult = await supabase.from('ai_provider_dossiers').insert({
      code, name: clean(payload.name), provider_type: clean(payload.providerType || 'gemini'),
      status: 'draft', environment: clean(payload.environment || 'production'),
      account_label: clean(payload.accountLabel) || null,
      external_account_id: clean(payload.externalAccountId) || null,
      billing_tier: clean(payload.billingTier || 'free'), reconciliation_state: 'not_reconciled',
      is_enabled: true, metadata: payload.metadata || {}, created_by: actor.id, updated_by: actor.id,
    }).select('*').single()
    if (dossierResult.error) throw new Error(dossierResult.error.message)
    const dossier = dossierResult.data
    const poolResult = await supabase.from('ai_provider_capacity_pools').insert({
      dossier_id: dossier.id,
      pool_key: clean(payload.poolKey || `${code}_PRIMARY`),
      project_name: clean(payload.projectName || payload.name),
      external_project_id: clean(payload.externalProjectId) || null,
      billing_tier: clean(payload.billingTier || 'free'), status: 'draft',
      provider_rpm: numberOrNull(payload.providerRpm), provider_tpm: numberOrNull(payload.providerTpm),
      provider_rpd: numberOrNull(payload.providerRpd), provider_grounded_rpd: numberOrNull(payload.providerGroundedRpd),
      metadata: {}, created_by: actor.id, updated_by: actor.id,
    }).select('*').single()
    if (poolResult.error) throw new Error(poolResult.error.message)
    await audit(actor, action, 'dossier', dossier.id, { code, capacityPoolId: poolResult.data.id })
    return { dossier, capacityPool: poolResult.data }
  }

  if (action === 'update_dossier') {
    const id = clean(payload.id); if (!id) throw new Error('DOSSIER_ID_REQUIRED')
    const updates: JsonRecord = { updated_by: actor.id, updated_at: now() }
    for (const [source, target] of [['name','name'],['status','status'],['billingTier','billing_tier'],['accountLabel','account_label'],['externalAccountId','external_account_id'],['isEnabled','is_enabled']] as const) {
      if (payload[source] !== undefined) updates[target] = payload[source]
    }
    const result = await supabase.from('ai_provider_dossiers').update(updates).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'dossier', id, updates)
    return result.data
  }

  if (action === 'store_credential') {
    const dossierId = clean(payload.dossierId), secret = clean(payload.secret)
    if (!dossierId || !secret) throw new Error('CREDENTIAL_DOSSIER_AND_SECRET_REQUIRED')
    const result = await supabase.rpc('ai_provider_store_credential', {
      p_dossier_id: dossierId,
      p_capacity_pool_id: clean(payload.capacityPoolId) || null,
      p_secret: secret,
      p_key_type: clean(payload.keyType || 'auth_key'),
      p_actor_id: actor.id,
    })
    if (result.error) throw new Error(result.error.message)
    const row = Array.isArray(result.data) ? result.data[0] : result.data
    await audit(actor, action, 'credential', String(row?.credential_id || ''), { dossierId, suffix: row?.secret_suffix })
    return row
  }

  if (action === 'test_credential') {
    const credentialId = clean(payload.credentialId)

    if (!credentialId) {
      throw new Error('CREDENTIAL_ID_REQUIRED')
    }

    const credentialResult = await supabase
      .from('ai_provider_credentials')
      .select('id,dossier_id,capacity_pool_id')
      .eq('id', credentialId)
      .single()

    if (credentialResult.error) {
      throw new Error(credentialResult.error.message)
    }

    const credential = credentialResult.data

    /*
     * Select only a model registered and enabled for this dossier.
     * A requested model is accepted only when it belongs to this
     * dossier's active model catalogue.
     */
    const modelsResult = await supabase
      .from('ai_provider_models')
      .select('model_code,primary_for_capability,enabled,created_at')
      .eq('dossier_id', credential.dossier_id)
      .eq('enabled', true)
      .order('primary_for_capability', { ascending: false })
      .order('created_at', { ascending: true })

    if (modelsResult.error) {
      throw new Error(modelsResult.error.message)
    }

    const registeredModels = asArray<JsonRecord>(modelsResult.data)
    const requestedModel = clean(payload.model)

    const selectedModel =
      (
        requestedModel
          ? registeredModels.find(
              (row) => clean(row.model_code) === requestedModel,
            )
          : undefined
      )
      || registeredModels.find(
        (row) => Boolean(row.primary_for_capability),
      )
      || registeredModels[0]

    const model = clean(selectedModel?.model_code)

    if (!model) {
      throw new Error('NO_ACTIVE_MODEL_REGISTERED')
    }

    const secretResult = await supabase.rpc(
      'ai_provider_resolve_secret',
      { p_credential_id: credentialId },
    )

    if (secretResult.error) {
      throw new Error(secretResult.error.message)
    }

    const secretData = Array.isArray(secretResult.data)
      ? secretResult.data[0]
      : secretResult.data

    const apiKey = clean(
      secretData?.decrypted_secret || secretData,
    )

    if (!apiKey) {
      throw new Error('CREDENTIAL_SECRET_UNAVAILABLE')
    }

    /*
     * Clear the stale FAILED state before each genuine retest.
     */
    await supabase
      .from('ai_provider_credentials')
      .update({
        status: 'testing',
        failure_code: null,
        updated_at: now(),
      })
      .eq('id', credentialId)

    const started = Date.now()

    try {
      const ai = new GoogleGenAI({ apiKey })

      const requestConfig: {
        maxOutputTokens: number
        thinkingConfig?: {
          thinkingLevel: ThinkingLevel
        }
      } = {
        maxOutputTokens: 64,
      }

      /*
       * thinkingLevel belongs to Gemini 3.x.
       * This keeps future Gemini 2.x catalogue entries compatible.
       */
      if (/^gemini-3(?:\.|$)/.test(model)) {
        requestConfig.thinkingConfig = {
          thinkingLevel: ThinkingLevel.LOW,
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents:
          'Reply with exactly this text and nothing else: SANILA_PROVIDER_OK',
        config: requestConfig,
      })

      const responseText = clean(response.text)

      if (!responseText.includes('SANILA_PROVIDER_OK')) {
        throw new Error('PROVIDER_TEST_UNEXPECTED_OUTPUT')
      }

      const usage = response.usageMetadata as {
        promptTokenCount?: number
        candidatesTokenCount?: number
        totalTokenCount?: number
      } | undefined

      const completedAt = now()
      const latencyMs = Date.now() - started

      const credentialUpdate = await supabase
        .from('ai_provider_credentials')
        .update({
          status: 'validated',
          validated_at: completedAt,
          last_success_at: completedAt,
          failure_code: null,
          updated_at: completedAt,
        })
        .eq('id', credentialId)

      if (credentialUpdate.error) {
        throw new Error(credentialUpdate.error.message)
      }

      await supabase
        .from('ai_provider_health_checks')
        .insert({
          dossier_id: credential.dossier_id,
          capacity_pool_id: credential.capacity_pool_id,
          credential_id: credentialId,
          model_code: model,
          status: 'healthy',
          latency_ms: latencyMs,
          checked_by: actor.id,
          details: {
            responseId: response.responseId,
            responseModel: response.modelVersion || model,
          },
        })

      await supabase
        .from('ai_provider_usage_ledger')
        .insert({
          module_key: 'ai_provider_control',
          capability: 'health_check',
          dossier_id: credential.dossier_id,
          capacity_pool_id: credential.capacity_pool_id,
          credential_id: credentialId,
          model_code: model,
          request_count: 1,
          grounded_request_count: 0,
          input_tokens: Number(
            usage?.promptTokenCount || 0,
          ),
          output_tokens: Number(
            usage?.candidatesTokenCount || 0,
          ),
          latency_ms: latencyMs,
          http_status: 200,
          outcome: 'completed',
          actor_id: actor.id,
          metadata: {
            source: 'credential_live_test',
            responseId: response.responseId,
          },
        })

      await audit(
        actor,
        action,
        'credential',
        credentialId,
        {
          model,
          latencyMs,
        },
      )

      return {
        ok: true,
        model: response.modelVersion || model,
        latencyMs,
        usage,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error)

      const httpStatus =
        Number(
          message.match(
            /\b(400|401|403|404|409|429|5\d\d)\b/,
          )?.[1] || 0,
        ) || null

      const failedAt = now()

      await supabase
        .from('ai_provider_credentials')
        .update({
          status: 'failed',
          last_failure_at: failedAt,
          failure_code: message.slice(0, 500),
          updated_at: failedAt,
        })
        .eq('id', credentialId)

      await supabase
        .from('ai_provider_health_checks')
        .insert({
          dossier_id: credential.dossier_id,
          capacity_pool_id: credential.capacity_pool_id,
          credential_id: credentialId,
          model_code: model,
          status: 'failed',
          latency_ms: Date.now() - started,
          checked_by: actor.id,
          details: {
            error: message.slice(0, 2000),
          },
        })

      await supabase
        .from('ai_provider_usage_ledger')
        .insert({
          module_key: 'ai_provider_control',
          capability: 'health_check',
          dossier_id: credential.dossier_id,
          capacity_pool_id: credential.capacity_pool_id,
          credential_id: credentialId,
          model_code: model,
          request_count: 1,
          grounded_request_count: 0,
          input_tokens: 0,
          output_tokens: 0,
          latency_ms: Date.now() - started,
          http_status: httpStatus,
          outcome: 'failed',
          error_code: message.slice(0, 500),
          actor_id: actor.id,
          metadata: {
            source: 'credential_live_test',
          },
        })

      throw error
    }
  }

  if (action === 'activate_credential') {
    const credentialId = clean(payload.credentialId); if (!credentialId) throw new Error('CREDENTIAL_ID_REQUIRED')
    const current = await supabase.from('ai_provider_credentials').select('*').eq('id', credentialId).single()
    if (current.error) throw new Error(current.error.message)
    if (!['validated', 'standby', 'active'].includes(String(current.data.status))) throw new Error('CREDENTIAL_NOT_VALIDATED')
    await supabase.from('ai_provider_credentials').update({ status: 'standby', updated_at: now() }).eq('dossier_id', current.data.dossier_id).eq('status', 'active').neq('id', credentialId)
    const activated = await supabase.from('ai_provider_credentials').update({ status: 'active', activated_at: now(), updated_at: now() }).eq('id', credentialId).select('*').single()
    if (activated.error) throw new Error(activated.error.message)
    await supabase.from('ai_provider_dossiers').update({ status: 'operating', updated_at: now(), updated_by: actor.id }).eq('id', current.data.dossier_id)
    if (current.data.capacity_pool_id) await supabase.from('ai_provider_capacity_pools').update({ status: 'operating', updated_at: now() }).eq('id', current.data.capacity_pool_id)
    await audit(actor, action, 'credential', credentialId, { dossierId: current.data.dossier_id })
    return activated.data
  }

  if (action === 'save_model') {
    const dossierId = clean(payload.dossierId), modelCode = clean(payload.modelCode)
    if (!dossierId || !modelCode) throw new Error('MODEL_DOSSIER_AND_CODE_REQUIRED')
    const row = {
      dossier_id: dossierId, model_code: modelCode, display_name: clean(payload.displayName || modelCode),
      capability: clean(payload.capability || 'general'), enabled: payload.enabled !== false,
      primary_for_capability: Boolean(payload.primaryForCapability), grounding_allowed: Boolean(payload.groundingAllowed),
      max_output_tokens: numberOrNull(payload.maxOutputTokens), metadata: payload.metadata || {}, updated_at: now(),
    }
    const result = await supabase.from('ai_provider_models').upsert(row, { onConflict: 'dossier_id,model_code,capability' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'model', result.data.id, row)
    return result.data
  }

  if (action === 'save_assignment') {
    const moduleKey = clean(payload.moduleKey), dossierId = clean(payload.dossierId)
    if (!moduleKey || !dossierId) throw new Error('ASSIGNMENT_MODULE_AND_DOSSIER_REQUIRED')
    const row = {
      module_key: moduleKey, dossier_id: dossierId, capacity_pool_id: clean(payload.capacityPoolId) || null,
      assignment_mode: clean(payload.assignmentMode || 'primary'), priority: Number(payload.priority || 100),
      enabled: payload.enabled !== false, capability_allowlist: asArray<string>(payload.capabilityAllowlist),
      primary_model: clean(payload.primaryModel) || null, fallback_model: clean(payload.fallbackModel) || null,
      metadata: payload.metadata || {}, updated_by: actor.id, updated_at: now(),
    }
    const result = await supabase.from('ai_provider_module_assignments').upsert(row, { onConflict: 'module_key,dossier_id,assignment_mode' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'assignment', result.data.id, row)
    return result.data
  }

  if (action === 'save_quota') {
    const scopeType = clean(payload.scopeType || 'global'), scopeKey = clean(payload.scopeKey || '*')
    const row = {
      scope_type: scopeType, scope_key: scopeKey,
      max_requests_per_minute: numberOrNull(payload.maxRequestsPerMinute),
      max_requests_per_hour: numberOrNull(payload.maxRequestsPerHour),
      max_requests_per_day: numberOrNull(payload.maxRequestsPerDay),
      max_requests_per_month: numberOrNull(payload.maxRequestsPerMonth),
      max_input_tokens_per_day: numberOrNull(payload.maxInputTokensPerDay),
      max_output_tokens_per_day: numberOrNull(payload.maxOutputTokensPerDay),
      max_grounded_requests_per_day: numberOrNull(payload.maxGroundedRequestsPerDay),
      max_concurrent_requests: numberOrNull(payload.maxConcurrentRequests),
      emergency_reserve_requests: Number(payload.emergencyReserveRequests || 0),
      soft_threshold_percent: Number(payload.softThresholdPercent || 80),
      hard_limit: payload.hardLimit !== false, reset_timezone: clean(payload.resetTimezone || 'Africa/Casablanca'),
      enabled: payload.enabled !== false, metadata: payload.metadata || {}, updated_by: actor.id, updated_at: now(),
    }
    const result = await supabase.from('ai_provider_quota_policies').upsert(row, { onConflict: 'scope_type,scope_key' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'quota_policy', result.data.id, row)
    return result.data
  }

  if (action === 'save_routing') {
    const moduleKey = clean(payload.moduleKey), capability = clean(payload.capability || '*')
    if (!moduleKey) throw new Error('ROUTING_MODULE_REQUIRED')
    const row = {
      module_key: moduleKey, capability, routing_mode: clean(payload.routingMode || 'primary_fallback'),
      primary_assignment_id: clean(payload.primaryAssignmentId) || null,
      fallback_assignment_ids: asArray<string>(payload.fallbackAssignmentIds), sticky_mission: payload.stickyMission !== false,
      enabled: payload.enabled !== false, metadata: payload.metadata || {}, updated_by: actor.id, updated_at: now(),
    }
    const result = await supabase.from('ai_provider_routing_rules').upsert(row, { onConflict: 'module_key,capability' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'routing_rule', result.data.id, row)
    return result.data
  }

  if (action === 'simulate_route') {
    const result = await supabase.rpc('ai_provider_simulate_runtime_route', {
      p_module_key: clean(payload.moduleKey), p_capability: clean(payload.capability || 'general'),
      p_requested_model: clean(payload.requestedModel) || null,
      p_estimated_requests: Math.max(1, Number(payload.estimatedRequests || 1)),
      p_grounded: Boolean(payload.grounded),
    })
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'simulation', null, { request: payload })
    return result.data
  }

  if (action === 'set_emergency') {
    const scopeKey = clean(payload.scopeKey || '*'), mode = clean(payload.mode || 'normal')
    const row = { scope_key: scopeKey, mode, reason: clean(payload.reason) || null, updated_by: actor.id, updated_at: now() }
    const result = await supabase.from('ai_provider_emergency_state').upsert(row, { onConflict: 'scope_key' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'emergency_state', result.data.id, row)
    return result.data
  }

  if (action === 'publish_configuration') {
    const current = await loadAiProviderSnapshot()
    const configuration = {
      emergency: current.emergency,
      dossiers: current.dossiers,
      pools: current.pools,
      credentials: current.credentials.map((item) => ({
        id: item.id, dossier_id: item.dossier_id, capacity_pool_id: item.capacity_pool_id,
        version_number: item.version_number, fingerprint: item.fingerprint,
        secret_suffix: item.secret_suffix, key_type: item.key_type, status: item.status,
      })),
      models: current.models,
      assignments: current.assignments,
      routingRules: current.routingRules,
      quotas: current.quotas,
    }
    const latest = await supabase.from('ai_provider_config_versions').select('version_number').order('version_number', { ascending: false }).limit(1).maybeSingle()
    const versionNumber = Number(latest.data?.version_number || 0) + 1
    const result = await supabase.from('ai_provider_config_versions').insert({
      version_number: versionNumber, version_code: `AI-PROVIDER-V${String(versionNumber).padStart(4, '0')}`,
      status: 'published', reason: clean(payload.reason || 'Publication configuration'), snapshot: configuration,
      checksum: crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('hex'),
      published_at: now(), created_by: actor.id,
    }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'config_version', result.data.id, { versionNumber })
    return result.data
  }

  if (action === 'rollback_configuration') {
    const versionId = clean(payload.versionId)
    if (!versionId) throw new Error('CONFIG_VERSION_ID_REQUIRED')
    const result = await supabase.rpc('ai_provider_restore_configuration', {
      p_version_id: versionId,
      p_actor_id: actor.id,
    })
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'config_version', versionId, { reason: clean(payload.reason || 'Rollback administrateur') })
    return result.data
  }

  throw new Error(`INVALID_ACTION:${action}`)
}
