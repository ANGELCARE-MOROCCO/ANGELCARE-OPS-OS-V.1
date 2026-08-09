import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { AiProviderSnapshot, JsonRecord } from './types'
import { estimateAiCostUsd } from './governor'
import { invokeProviderHealth } from './provider-runtime'

const now = () => new Date().toISOString()
const clean = (value: unknown) => String(value ?? '').trim()
const numberOrNull = (value: unknown) => value === '' || value == null ? null : Number(value)
const asArray = <T>(value: unknown) => Array.isArray(value) ? value as T[] : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) as T[] : []

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


async function selectPhase5Safe(table: string, order = 'created_at', ascending = false, limit = 500) {
  try {
    return await selectSafe(table, order, ascending, limit)
  } catch (error) {
    if (error instanceof Error && error.message === 'AI_PROVIDER_CONTROL_MIGRATION_REQUIRED') return []
    throw error
  }
}

export async function loadAiProviderSnapshot(): Promise<AiProviderSnapshot> {
  const supabase = await admin()
  const since = new Date(); since.setHours(0, 0, 0, 0)
  const [dossiers, pools, credentials, models, assignments, routingRules, quotas, usage, healthChecks, incidents, alerts, configVersions, audit, commandPolicies, schedules, governedRequests, structuredCache, reuseEvents, acCapitalProviderLogs, phase6Incidents, phase6Changes, phase6Destructions, phase6Adapters, phase6Capabilities, phase6Modules, phase6SopArticles, phase6SopProgress, phase6Notes, phase6Jobs, phase6Tombstones, emergencyResult] = await Promise.all([
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
    selectPhase5Safe('ai_provider_command_policies', 'updated_at', false, 1000),
    selectPhase5Safe('ai_provider_command_schedules', 'updated_at', false, 1000),
    selectPhase5Safe('ai_provider_governed_requests', 'created_at', false, 5000),
    selectPhase5Safe('ai_provider_structured_result_cache', 'updated_at', false, 2000),
    selectPhase5Safe('ai_provider_reuse_events', 'created_at', false, 5000),
    selectPhase5Safe('ac_capital_provider_execution_logs', 'created_at', false, 1000),
    selectPhase5Safe('ai_ops_incident_cases', 'created_at', false, 500),
    selectPhase5Safe('ai_ops_change_requests', 'created_at', false, 500),
    selectPhase5Safe('ai_ops_destruction_requests', 'created_at', false, 500),
    selectPhase5Safe('ai_ops_provider_adapters', 'display_name', true, 200),
    selectPhase5Safe('ai_ops_capability_registry', 'display_name', true, 500),
    selectPhase5Safe('ai_ops_module_registry', 'display_name', true, 500),
    selectPhase5Safe('ai_ops_sop_articles', 'sort_order', true, 500),
    selectPhase5Safe('ai_ops_sop_progress', 'updated_at', false, 2000),
    selectPhase5Safe('ai_ops_operator_notes', 'created_at', false, 1000),
    selectPhase5Safe('ai_ops_action_jobs', 'created_at', false, 1000),
    selectPhase5Safe('ai_ops_entity_tombstones', 'destroyed_at', false, 500),
    supabase.from('ai_provider_emergency_state').select('*').eq('scope_key', '*').maybeSingle(),
  ])
  const todayUsage = usage.filter((row) => new Date(String(row.occurred_at || 0)) >= since)
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekUsage = usage.filter((row) => new Date(String(row.occurred_at || 0)) >= weekStart)
  const sum = (key: string) => todayUsage.reduce((total, row) => total + Number(row[key] || 0), 0)
  const weekSum = (key: string) => weekUsage.reduce((total, row) => total + Number(row[key] || 0), 0)
  const avoidedRequests = reuseEvents.reduce((total, row) => total + Number(row.avoided_requests || 0), 0)
  const avoidedTokens = reuseEvents.reduce((total, row) => total + Number(row.avoided_input_tokens || 0) + Number(row.avoided_output_tokens || 0), 0)
  const avoidedCostUsd = reuseEvents.reduce((total, row) => total + Number(row.avoided_cost_usd || 0), 0)
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
    commandPolicies: commandPolicies as any,
    schedules: schedules as any,
    governedRequests: governedRequests as any,
    structuredCache: structuredCache as any,
    reuseEvents,
    acCapitalProviderLogs,
    phase6: {
      incidents: phase6Incidents,
      changeRequests: phase6Changes,
      destructionRequests: phase6Destructions,
      providerAdapters: phase6Adapters,
      capabilities: phase6Capabilities,
      modules: phase6Modules,
      sopArticles: phase6SopArticles,
      sopProgress: phase6SopProgress,
      operatorNotes: phase6Notes,
      actionJobs: phase6Jobs,
      tombstones: phase6Tombstones,
    },
    rollups: {
      todayRequests: sum('request_count'),
      todayGroundedRequests: sum('grounded_request_count'),
      todayInputTokens: sum('input_tokens'),
      todayOutputTokens: sum('output_tokens'),
      todayFailures: todayUsage.filter((row) => row.outcome === 'failed').length,
      activeDossiers: dossiers.filter((row) => row.is_enabled && ['ready', 'operating', 'limited'].includes(String(row.status))).length,
      operatingPools: pools.filter((row) => row.status === 'operating').length,
      activeCredentials: credentials.filter((row) => row.status === 'active').length,
      weekRequests: weekSum('request_count'),
      weekInputTokens: weekSum('input_tokens'),
      weekOutputTokens: weekSum('output_tokens'),
      weekCostUsd: weekSum('estimated_cost_usd'),
      cacheHits: governedRequests.filter((row) => row.decision === 'REUSE_CACHED').length,
      joinedRequests: governedRequests.filter((row) => row.decision === 'JOIN_IN_FLIGHT').length,
      blockedRequests: governedRequests.filter((row) => ['blocked','deferred'].includes(String(row.status))).length,
      avoidedRequests,
      avoidedTokens,
      avoidedCostUsd,
      activeSchedules: schedules.filter((row) => row.enabled && row.status === 'active').length,
      suspendedCommands: commandPolicies.filter((row) => row.enabled === false || row.ai_mode === 'ai_prohibited').length,
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
      code, name: clean(payload.name), provider_type: clean(payload.providerType || 'openrouter'),
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
    if (!credentialId) throw new Error('CREDENTIAL_ID_REQUIRED')
    const credentialResult = await supabase.from('ai_provider_credentials').select('id,dossier_id,capacity_pool_id').eq('id', credentialId).single()
    if (credentialResult.error) throw new Error(credentialResult.error.message)
    const credential = credentialResult.data
    const dossierResult = await supabase.from('ai_provider_dossiers').select('id,provider_type,name,code,status').eq('id', credential.dossier_id).single()
    if (dossierResult.error) throw new Error(dossierResult.error.message)
    const providerType = clean(dossierResult.data?.provider_type || 'unknown').toLowerCase()
    if (/gemini|google/.test(providerType) && ['marketing_ai','marketing_autopilot'].includes(clean(payload.moduleKey))) throw new Error('MARKET_OS_GEMINI_PROVIDER_RETIRED')

    const modelsResult = await supabase.from('ai_provider_models')
      .select('model_code,primary_for_capability,enabled,created_at')
      .eq('dossier_id', credential.dossier_id)
      .eq('enabled', true)
      .order('primary_for_capability', { ascending: false })
      .order('created_at', { ascending: true })
    if (modelsResult.error) throw new Error(modelsResult.error.message)
    const registeredModels = asArray<JsonRecord>(modelsResult.data)
    const requestedModel = clean(payload.model)
    const selectedModel = (requestedModel
      ? registeredModels.find((row) => clean(row.model_code) === requestedModel)
      : undefined)
      || registeredModels.find((row) => Boolean(row.primary_for_capability))
      || registeredModels[0]
    const model = clean(selectedModel?.model_code)
    if (!model) throw new Error('NO_ACTIVE_MODEL_REGISTERED')

    const retestStateResult = await supabase.from('ai_provider_credentials').update({
      status: 'testing', failure_code: null, updated_at: now(),
    }).eq('id', credentialId)
    if (retestStateResult.error) throw new Error(retestStateResult.error.message)

    const secretResult = await supabase.rpc('ai_provider_resolve_secret', { p_credential_id: credentialId })
    if (secretResult.error) throw new Error(secretResult.error.message)
    const secretData = Array.isArray(secretResult.data) ? secretResult.data[0] : secretResult.data
    const apiKey = clean(secretData?.decrypted_secret || secretData)
    if (!apiKey) throw new Error('CREDENTIAL_SECRET_UNAVAILABLE')
    const policyResult = await supabase.from('ai_provider_command_policies').select('*')
      .eq('module_key', 'ai_provider_control').eq('workspace_key', 'credential-health')
      .eq('command_code', 'AI_PROVIDER_CREDENTIAL_TEST').maybeSingle()
    if (policyResult.error) {
      const message = String(policyResult.error.message || '')
      if (message.includes('does not exist') || message.includes('schema cache')) throw new Error('AI_PROVIDER_SOVEREIGNTY_PHASE5_REQUIRED')
      throw new Error(message)
    }
    const policy = policyResult.data
    if (!policy?.enabled || policy.ai_mode === 'ai_prohibited' || !policy.manual_allowed) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_POLICY_BLOCKED')

    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
    const usageResult = await supabase.from('ai_provider_usage_ledger')
      .select('request_count,input_tokens,output_tokens,estimated_cost_usd,occurred_at,command_code')
      .eq('module_key', 'ai_provider_control')
      .gte('occurred_at', weekStart.toISOString())
    if (usageResult.error) throw new Error(usageResult.error.message)
    const moduleUsageRows = asArray<JsonRecord>(usageResult.data)
    const usageRows = moduleUsageRows.filter((row) => row.command_code === 'AI_PROVIDER_CREDENTIAL_TEST')
    const dayRows = usageRows.filter((row) => new Date(String(row.occurred_at || 0)) >= dayStart)
    const countRows = (rows: JsonRecord[]) => rows.reduce((total, row) => total + Number(row.request_count || 0), 0)
    const costRows = (rows: JsonRecord[]) => rows.reduce((total, row) => total + Number(row.estimated_cost_usd || 0), 0)
    const estimatedInputTokens = 32
    const estimatedOutputTokens = 64
    const estimatedCostUsd = estimateAiCostUsd(estimatedInputTokens, estimatedOutputTokens)
    const quotaResult = await supabase.from('ai_provider_quota_policies').select('*')
      .eq('scope_type', 'module').eq('scope_key', 'ai_provider_control').maybeSingle()
    if (quotaResult.error) throw new Error(quotaResult.error.message)
    const quota = quotaResult.data
    const moduleDayRows = moduleUsageRows.filter((row) => new Date(String(row.occurred_at || 0)) >= dayStart)
    const moduleWeekInput = moduleUsageRows.reduce((total, row) => total + Number(row.input_tokens || 0), 0)
    const moduleWeekOutput = moduleUsageRows.reduce((total, row) => total + Number(row.output_tokens || 0), 0)
    if (quota?.hard_limit) {
      if (quota.max_requests_per_day != null && countRows(moduleDayRows) + 1 > Number(quota.max_requests_per_day)) throw new Error('AI_PROVIDER_CONTROL_DAILY_REQUEST_BUDGET')
      if (quota.max_requests_per_week != null && countRows(moduleUsageRows) + 1 > Number(quota.max_requests_per_week)) throw new Error('AI_PROVIDER_CONTROL_WEEKLY_REQUEST_BUDGET')
      if (quota.max_input_tokens_per_week != null && moduleWeekInput + estimatedInputTokens > Number(quota.max_input_tokens_per_week)) throw new Error('AI_PROVIDER_CONTROL_WEEKLY_INPUT_TOKEN_BUDGET')
      if (quota.max_output_tokens_per_week != null && moduleWeekOutput + estimatedOutputTokens > Number(quota.max_output_tokens_per_week)) throw new Error('AI_PROVIDER_CONTROL_WEEKLY_OUTPUT_TOKEN_BUDGET')
      if (quota.max_total_tokens_per_week != null && moduleWeekInput + moduleWeekOutput + estimatedInputTokens + estimatedOutputTokens > Number(quota.max_total_tokens_per_week)) throw new Error('AI_PROVIDER_CONTROL_WEEKLY_TOTAL_TOKEN_BUDGET')
      if (quota.max_estimated_cost_usd_per_day != null && costRows(moduleDayRows) + estimatedCostUsd > Number(quota.max_estimated_cost_usd_per_day)) throw new Error('AI_PROVIDER_CONTROL_DAILY_COST_BUDGET')
      if (quota.max_estimated_cost_usd_per_week != null && costRows(moduleUsageRows) + estimatedCostUsd > Number(quota.max_estimated_cost_usd_per_week)) throw new Error('AI_PROVIDER_CONTROL_WEEKLY_COST_BUDGET')
    }
    if (policy.max_runs_per_day != null && countRows(dayRows) + 1 > Number(policy.max_runs_per_day)) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_DAILY_LIMIT')
    if (policy.max_runs_per_week != null && countRows(usageRows) + 1 > Number(policy.max_runs_per_week)) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_WEEKLY_LIMIT')
    if (policy.max_cost_usd_per_day != null && costRows(dayRows) + estimatedCostUsd > Number(policy.max_cost_usd_per_day)) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_DAILY_COST_LIMIT')
    if (policy.max_cost_usd_per_week != null && costRows(usageRows) + estimatedCostUsd > Number(policy.max_cost_usd_per_week)) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_WEEKLY_COST_LIMIT')

    const latestResult = await supabase.from('ai_provider_health_checks').select('checked_at')
      .eq('credential_id', credentialId).order('checked_at', { ascending: false }).limit(1).maybeSingle()
    if (latestResult.error) throw new Error(latestResult.error.message)
    const latestAt = latestResult.data?.checked_at ? new Date(String(latestResult.data.checked_at)).getTime() : 0
    if (Number(policy.minimum_interval_seconds || 0) > 0 && latestAt > Date.now() - Number(policy.minimum_interval_seconds) * 1000) {
      throw new Error('AI_PROVIDER_CREDENTIAL_TEST_MINIMUM_INTERVAL')
    }

    const requestFingerprint = crypto.createHash('sha256').update(`credential-health:${credentialId}:${model}:${Math.floor(Date.now() / Math.max(60_000, Number(policy.minimum_interval_seconds || 3600) * 1000))}`).digest('hex')
    const requestId = crypto.randomUUID()
    const requestInsert = await supabase.from('ai_provider_governed_requests').insert({
      id: requestId, request_fingerprint: requestFingerprint, module_key: 'ai_provider_control', workspace_key: 'credential-health',
      capability: 'health_check', command_code: 'AI_PROVIDER_CREDENTIAL_TEST', actor_id: actor.id, trigger_type: 'health_test',
      requested_model: model, provider_type: providerType, model_code: model, decision: 'EXECUTE_NEW', status: 'running',
      estimated_requests: 1, estimated_input_tokens: estimatedInputTokens, estimated_output_tokens: estimatedOutputTokens,
      estimated_cost_usd: estimatedCostUsd, started_at: now(), metadata: { credentialId, dossierId: credential.dossier_id, explicitCredentialTest: true },
    })
    if (requestInsert.error) {
      if (String(requestInsert.error.message || '').includes('duplicate')) throw new Error('AI_PROVIDER_CREDENTIAL_TEST_ALREADY_RUNNING')
      throw new Error(requestInsert.error.message)
    }

    const started = Date.now()
    try {
      const response = await invokeProviderHealth({ providerType, apiKey, model })
      const responseText = clean(response.text)
      const healthTokenMatched = responseText.includes('SANILA_PROVIDER_OK')
      const inputTokens = Number(response.inputTokens || 0)
      const outputTokens = Number(response.outputTokens || 0)
      const usage = { promptTokenCount: inputTokens, candidatesTokenCount: outputTokens, totalTokenCount: inputTokens + outputTokens }
      const actualCostUsd = estimateAiCostUsd(inputTokens, outputTokens)
      await supabase.from('ai_provider_credentials').update({ status: 'validated', validated_at: now(), last_success_at: now(), failure_code: null, updated_at: now() }).eq('id', credentialId)
      await supabase.from('ai_provider_health_checks').insert({ dossier_id: credential.dossier_id, capacity_pool_id: credential.capacity_pool_id, credential_id: credentialId, model_code: model, status: 'healthy', latency_ms: Date.now() - started, checked_by: actor.id, details: { responseId: response.responseId, governedRequestId: requestId, providerType: response.providerType, healthTokenMatched, ...response.details, responsePreview: responseText.slice(0, 160) } })
      await supabase.from('ai_provider_usage_ledger').insert({
        module_key: 'ai_provider_control', capability: 'health_check', dossier_id: credential.dossier_id,
        capacity_pool_id: credential.capacity_pool_id, credential_id: credentialId, model_code: model,
        request_count: 1, grounded_request_count: 0, input_tokens: inputTokens,
        output_tokens: outputTokens, latency_ms: Date.now() - started,
        http_status: 200, outcome: 'completed', actor_id: actor.id, command_code: 'AI_PROVIDER_CREDENTIAL_TEST', estimated_cost_usd: actualCostUsd,
        metadata: { source: 'credential_live_test', providerType: response.providerType, responseId: response.responseId, governedRequestId: requestId },
      })
      await supabase.from('ai_provider_governed_requests').update({
        status: 'completed', actual_input_tokens: inputTokens, actual_output_tokens: outputTokens, actual_cost_usd: actualCostUsd,
        result_json: { ok: true, providerType: response.providerType, modelVersion: response.modelVersion || model, healthTokenMatched, ...response.details }, result_hash: crypto.createHash('sha256').update(String(response.text || '')).digest('hex'),
        completed_at: now(), updated_at: now(), metadata: { credentialId, responseId: response.responseId, explicitCredentialTest: true },
      }).eq('id', requestId)
      await audit(actor, action, 'credential', credentialId, { model, latencyMs: Date.now() - started, governedRequestId: requestId })
      return { ok: true, providerType: response.providerType, model: response.modelVersion || model, latencyMs: Date.now() - started, usage, governedRequestId: requestId }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const httpStatus = Number(message.match(/\b(401|403|404|429|5\d\d)\b/)?.[1] || 0) || null
      await supabase.from('ai_provider_credentials').update({ status: 'failed', last_failure_at: now(), failure_code: message.slice(0, 160), updated_at: now() }).eq('id', credentialId)
      await supabase.from('ai_provider_health_checks').insert({ dossier_id: credential.dossier_id, capacity_pool_id: credential.capacity_pool_id, credential_id: credentialId, model_code: model, status: 'failed', latency_ms: Date.now() - started, checked_by: actor.id, details: { error: message.slice(0, 1000), governedRequestId: requestId } })
      await supabase.from('ai_provider_usage_ledger').insert({
        module_key: 'ai_provider_control', capability: 'health_check', dossier_id: credential.dossier_id,
        capacity_pool_id: credential.capacity_pool_id, credential_id: credentialId, model_code: model,
        request_count: 1, grounded_request_count: 0, input_tokens: 0, output_tokens: 0,
        latency_ms: Date.now() - started, http_status: httpStatus, outcome: 'failed',
        error_code: message.slice(0, 160), actor_id: actor.id, command_code: 'AI_PROVIDER_CREDENTIAL_TEST', estimated_cost_usd: estimatedCostUsd,
        metadata: { source: 'credential_live_test', governedRequestId: requestId },
      })
      await supabase.from('ai_provider_governed_requests').update({ status: 'failed', error_code: message.slice(0, 160), error_message: message.slice(0, 2000), completed_at: now(), updated_at: now() }).eq('id', requestId)
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

  if (action === 'apply_ac_capital_single_model_profile') {
    const modelCode = clean(payload.modelCode || 'gemini-3.6-flash')
    if (modelCode !== 'gemini-3.6-flash') throw new Error('AC_CAPITAL_SINGLE_MODEL_MUST_BE_GEMINI_3_6_FLASH')

    const assignmentResult = await supabase.from('ai_provider_module_assignments')
      .select('*')
      .eq('module_key', 'ac_capital_os')
      .eq('enabled', true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (assignmentResult.error) throw new Error(assignmentResult.error.message)
    const assignment = assignmentResult.data
    if (!assignment?.id || !assignment?.dossier_id) throw new Error('AC_CAPITAL_ENABLED_ASSIGNMENT_REQUIRED')

    let capacityPoolId = clean(assignment.capacity_pool_id) || null
    if (!capacityPoolId) {
      const poolResult = await supabase.from('ai_provider_capacity_pools')
        .select('id')
        .eq('dossier_id', assignment.dossier_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (poolResult.error) throw new Error(poolResult.error.message)
      capacityPoolId = clean(poolResult.data?.id) || null
    }

    const capabilityAllowlist = Array.from(new Set([
      ...asArray<string>(assignment.capability_allowlist),
      'grounded_research',
      'structured_content',
    ]))

    const assignmentUpdate = await supabase.from('ai_provider_module_assignments').update({
      capacity_pool_id: capacityPoolId,
      assignment_mode: 'primary',
      priority: 1,
      enabled: true,
      capability_allowlist: capabilityAllowlist,
      primary_model: modelCode,
      fallback_model: null,
      metadata: {
        ...(assignment.metadata || {}),
        acCapitalSingleModel: true,
        selectedModel: modelCode,
        internalWritesEnabled: true,
        externalActionsEnabled: false,
        source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
      },
      updated_by: actor.id,
      updated_at: now(),
    }).eq('id', assignment.id).select('*').single()
    if (assignmentUpdate.error) throw new Error(assignmentUpdate.error.message)

    const demoteModels = await supabase.from('ai_provider_models').update({
      primary_for_capability: false,
      updated_at: now(),
    })
      .eq('dossier_id', assignment.dossier_id)
      .in('capability', ['grounded_research', 'structured_content'])
      .contains('metadata', { moduleKey: 'ac_capital_os' })
      .neq('model_code', modelCode)
    if (demoteModels.error) throw new Error(demoteModels.error.message)

    const modelRows = [
      {
        dossier_id: assignment.dossier_id,
        model_code: modelCode,
        display_name: 'Gemini 3.6 Flash — AC Capital Grounded Research',
        capability: 'grounded_research',
        enabled: true,
        primary_for_capability: true,
        grounding_allowed: true,
        max_output_tokens: 6000,
        metadata: {
          moduleKey: 'ac_capital_os',
          singleModelProfile: true,
          providerTier: 'paid',
          googleSearchGrounding: true,
          source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
        },
        updated_at: now(),
      },
      {
        dossier_id: assignment.dossier_id,
        model_code: modelCode,
        display_name: 'Gemini 3.6 Flash — AC Capital Intelligence',
        capability: 'structured_content',
        enabled: true,
        primary_for_capability: true,
        grounding_allowed: false,
        max_output_tokens: 7000,
        metadata: {
          moduleKey: 'ac_capital_os',
          singleModelProfile: true,
          providerTier: 'paid',
          googleSearchGrounding: false,
          source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
        },
        updated_at: now(),
      },
    ]
    const modelResult = await supabase.from('ai_provider_models')
      .upsert(modelRows, { onConflict: 'dossier_id,model_code,capability' })
      .select('*')
    if (modelResult.error) throw new Error(modelResult.error.message)

    const routeRows = ['grounded_research', 'structured_content'].map((capability) => ({
      module_key: 'ac_capital_os',
      capability,
      routing_mode: 'exclusive',
      primary_assignment_id: assignment.id,
      fallback_assignment_ids: [],
      sticky_mission: true,
      enabled: true,
      metadata: {
        singleModelProfile: true,
        modelCode,
        externalActions: false,
        source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
      },
      updated_by: actor.id,
      updated_at: now(),
    }))
    const routeResult = await supabase.from('ai_provider_routing_rules')
      .upsert(routeRows, { onConflict: 'module_key,capability' })
      .select('*')
    if (routeResult.error) throw new Error(routeResult.error.message)

    const existingQuota = await supabase.from('ai_provider_quota_policies')
      .select('*')
      .eq('scope_type', 'module')
      .eq('scope_key', 'ac_capital_os')
      .maybeSingle()
    if (existingQuota.error) throw new Error(existingQuota.error.message)
    const quotaRow = {
      scope_type: 'module',
      scope_key: 'ac_capital_os',
      max_requests_per_minute: 10,
      max_requests_per_hour: 100,
      max_requests_per_day: 500,
      max_requests_per_week: 3500,
      max_requests_per_month: 15000,
      max_input_tokens_per_day: 2000000,
      max_input_tokens_per_week: 14000000,
      max_output_tokens_per_day: 1000000,
      max_output_tokens_per_week: 7000000,
      max_total_tokens_per_week: 21000000,
      max_estimated_cost_usd_per_day: 10,
      max_estimated_cost_usd_per_week: 40,
      max_estimated_cost_usd_per_month: 120,
      max_grounded_requests_per_day: 500,
      max_concurrent_requests: 2,
      emergency_reserve_requests: 0,
      soft_threshold_percent: 80,
      hard_limit: true,
      reset_timezone: 'Africa/Casablanca',
      enabled: true,
      metadata: {
        ...(existingQuota.data?.metadata || {}),
        providerIncludedGroundedPromptsMonthly: 5000,
        selectedModel: modelCode,
        providerTier: 'paid',
        source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
      },
      updated_by: actor.id,
      updated_at: now(),
    }
    const quotaResult = await supabase.from('ai_provider_quota_policies')
      .upsert(quotaRow, { onConflict: 'scope_type,scope_key' })
      .select('*')
      .single()
    if (quotaResult.error) throw new Error(quotaResult.error.message)

    // AC_CAPITAL_GLOBAL_GROUNDING_QUOTA
    // The global governor is evaluated before the module quota.
    // Keep it aligned when the AC Capital single-model profile is applied.
    const existingGlobalQuota = await supabase
      .from('ai_provider_quota_policies')
      .select('*')
      .eq('scope_type', 'global')
      .eq('scope_key', '*')
      .maybeSingle()

    if (existingGlobalQuota.error) {
      throw new Error(existingGlobalQuota.error.message)
    }

    const globalQuotaRow = {
      scope_type: 'global',
      scope_key: '*',
      max_requests_per_minute: Math.max(
        Number(existingGlobalQuota.data?.max_requests_per_minute || 0),
        60,
      ),
      max_requests_per_hour: Math.max(
        Number(existingGlobalQuota.data?.max_requests_per_hour || 0),
        1000,
      ),
      max_requests_per_day: Math.max(
        Number(existingGlobalQuota.data?.max_requests_per_day || 0),
        5000,
      ),
      max_requests_per_week: Math.max(
        Number(existingGlobalQuota.data?.max_requests_per_week || 0),
        35000,
      ),
      max_requests_per_month: Math.max(
        Number(existingGlobalQuota.data?.max_requests_per_month || 0),
        150000,
      ),
      max_input_tokens_per_day: Math.max(
        Number(existingGlobalQuota.data?.max_input_tokens_per_day || 0),
        20000000,
      ),
      max_input_tokens_per_week: Math.max(
        Number(existingGlobalQuota.data?.max_input_tokens_per_week || 0),
        140000000,
      ),
      max_output_tokens_per_day: Math.max(
        Number(existingGlobalQuota.data?.max_output_tokens_per_day || 0),
        10000000,
      ),
      max_output_tokens_per_week: Math.max(
        Number(existingGlobalQuota.data?.max_output_tokens_per_week || 0),
        70000000,
      ),
      max_total_tokens_per_week: Math.max(
        Number(existingGlobalQuota.data?.max_total_tokens_per_week || 0),
        210000000,
      ),
      max_estimated_cost_usd_per_day: Math.max(
        Number(existingGlobalQuota.data?.max_estimated_cost_usd_per_day || 0),
        100,
      ),
      max_estimated_cost_usd_per_week: Math.max(
        Number(existingGlobalQuota.data?.max_estimated_cost_usd_per_week || 0),
        400,
      ),
      max_estimated_cost_usd_per_month: Math.max(
        Number(existingGlobalQuota.data?.max_estimated_cost_usd_per_month || 0),
        1200,
      ),
      max_grounded_requests_per_day: Math.max(
        Number(existingGlobalQuota.data?.max_grounded_requests_per_day || 0),
        500,
      ),
      max_concurrent_requests: Math.max(
        Number(existingGlobalQuota.data?.max_concurrent_requests || 0),
        10,
      ),
      emergency_reserve_requests: Number(
        existingGlobalQuota.data?.emergency_reserve_requests || 0,
      ),
      soft_threshold_percent: Number(
        existingGlobalQuota.data?.soft_threshold_percent || 80,
      ),
      hard_limit: true,
      reset_timezone:
        existingGlobalQuota.data?.reset_timezone || 'Africa/Casablanca',
      enabled: true,
      metadata: {
        ...(existingGlobalQuota.data?.metadata || {}),
        acCapitalSingleModelCompatible: true,
        selectedModel: modelCode,
        internalGroundingCeiling: 500,
        externalActions: false,
        source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04_GLOBAL_FIX',
      },
      updated_by: actor.id,
      updated_at: now(),
    }

    const globalQuotaResult = await supabase
      .from('ai_provider_quota_policies')
      .upsert(globalQuotaRow, {
        onConflict: 'scope_type,scope_key',
      })
      .select('*')
      .single()

    if (globalQuotaResult.error) {
      throw new Error(globalQuotaResult.error.message)
    }

    if (capacityPoolId) {
      const poolCurrent = await supabase.from('ai_provider_capacity_pools').select('metadata').eq('id', capacityPoolId).maybeSingle()
      if (poolCurrent.error) throw new Error(poolCurrent.error.message)
      const poolUpdate = await supabase.from('ai_provider_capacity_pools').update({
        billing_tier: 'paid',
        provider_rpd: null,
        provider_grounded_rpd: null,
        status: 'operating',
        metadata: {
          ...(poolCurrent.data?.metadata || {}),
          selectedModel: modelCode,
          providerIncludedGroundedPromptsMonthly: 5000,
          source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
        },
        updated_by: actor.id,
        updated_at: now(),
      }).eq('id', capacityPoolId)
      if (poolUpdate.error) throw new Error(poolUpdate.error.message)
    }

    const commandDefinitions = [
      { workspaceKey: 'opportunity-radar', commandCode: 'AC_CAPITAL_RADAR_GROUNDED_RESEARCH', daily: 500, output: 6000 },
      { workspaceKey: 'executive-report-studio', commandCode: 'AC_CAPITAL_REPORT_COMPOSE', daily: 500, output: 7000 },
    ]
    const commandPolicies: JsonRecord[] = []
    for (const definition of commandDefinitions) {
      const current = await supabase.from('ai_provider_command_policies').select('*')
        .eq('module_key', 'ac_capital_os')
        .eq('workspace_key', definition.workspaceKey)
        .eq('command_code', definition.commandCode)
        .maybeSingle()
      if (current.error) throw new Error(current.error.message)
      const row = {
        module_key: 'ac_capital_os',
        workspace_key: definition.workspaceKey,
        command_code: definition.commandCode,
        ai_mode: 'ai_required',
        manual_allowed: true,
        scheduled_allowed: false,
        minimum_interval_seconds: 1,
        max_runs_per_day: definition.daily,
        max_runs_per_week: definition.daily * 7,
        max_runs_per_month: definition.daily * 30,
        max_input_tokens_per_run: 120000,
        max_output_tokens_per_run: definition.output,
        max_cost_usd_per_run: 2,
        max_cost_usd_per_day: 10,
        max_cost_usd_per_week: 40,
        max_retries: 1,
        cache_mode: 'no_cache',
        cache_ttl_seconds: 0,
        duplicate_window_seconds: 1,
        force_refresh_allowed: true,
        approval_class: 'executive',
        allowed_provider_types: ['gemini'],
        allowed_models: [modelCode],
        allowed_trigger_types: ['manual', 'forced_refresh'],
        execution_window: {},
        cooldown_after_failure_seconds: 60,
        consecutive_failure_suspend_threshold: 5,
        enabled: true,
        metadata: {
          ...(current.data?.metadata || {}),
          singleModelProfile: true,
          selectedModel: modelCode,
          internalWritesEnabled: true,
          externalActions: false,
          humanReviewRequiredForExternalRelease: true,
          source: 'AC_CAPITAL_SINGLE_MODEL_AI_CONTROL_04',
        },
        updated_by: actor.id,
        updated_at: now(),
      }
      const result = await supabase.from('ai_provider_command_policies')
        .upsert(row, { onConflict: 'module_key,workspace_key,command_code' })
        .select('*')
        .single()
      if (result.error) throw new Error(result.error.message)
      commandPolicies.push(result.data)
    }

    await supabase.from('ac_capital_live_wiring_status').update({
      ai_provider_mode: 'provider-control-live-single-model',
      report_status: 'substantive-ai-composition',
      updated_at: now(),
      last_checked_at: now(),
    }).in('workspace', ['capital-radar', 'strategy-production-command', 'executive-report-studio'])

    await audit(actor, action, 'module_assignment', assignment.id, {
      moduleKey: 'ac_capital_os',
      modelCode,
      capacityPoolId,
      routes: routeRows.map((row) => row.capability),
      quota: { maxGroundedRequestsPerDay: 500 },
      externalActions: false,
    })

    return {
      moduleKey: 'ac_capital_os',
      modelCode,
      assignment: assignmentUpdate.data,
      models: modelResult.data,
      routes: routeResult.data,
      quota: quotaResult.data,
      commandPolicies,
      capacityPoolId,
      internalActions: {
        liveGroundedResearch: true,
        sourcePersistence: true,
        opportunityPersistence: true,
        reportDrafting: true,
      },
      externalActions: false,
    }
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
      max_requests_per_week: numberOrNull(payload.maxRequestsPerWeek),
      max_requests_per_month: numberOrNull(payload.maxRequestsPerMonth),
      max_input_tokens_per_day: numberOrNull(payload.maxInputTokensPerDay),
      max_input_tokens_per_week: numberOrNull(payload.maxInputTokensPerWeek),
      max_output_tokens_per_day: numberOrNull(payload.maxOutputTokensPerDay),
      max_output_tokens_per_week: numberOrNull(payload.maxOutputTokensPerWeek),
      max_total_tokens_per_week: numberOrNull(payload.maxTotalTokensPerWeek),
      max_estimated_cost_usd_per_day: numberOrNull(payload.maxEstimatedCostUsdPerDay),
      max_estimated_cost_usd_per_week: numberOrNull(payload.maxEstimatedCostUsdPerWeek),
      max_estimated_cost_usd_per_month: numberOrNull(payload.maxEstimatedCostUsdPerMonth),
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

  if (action === 'save_command_policy') {
    const moduleKey = clean(payload.moduleKey), commandCode = clean(payload.commandCode)
    if (!moduleKey || !commandCode) throw new Error('COMMAND_POLICY_MODULE_AND_COMMAND_REQUIRED')
    const row = {
      module_key: moduleKey,
      workspace_key: clean(payload.workspaceKey || '*'),
      command_code: commandCode,
      ai_mode: clean(payload.aiMode || 'ai_required'),
      manual_allowed: payload.manualAllowed !== false,
      scheduled_allowed: Boolean(payload.scheduledAllowed),
      minimum_interval_seconds: Math.max(0, Number(payload.minimumIntervalSeconds || 0)),
      max_runs_per_day: numberOrNull(payload.maxRunsPerDay),
      max_runs_per_week: numberOrNull(payload.maxRunsPerWeek),
      max_runs_per_month: numberOrNull(payload.maxRunsPerMonth),
      max_input_tokens_per_run: numberOrNull(payload.maxInputTokensPerRun),
      max_output_tokens_per_run: numberOrNull(payload.maxOutputTokensPerRun),
      max_cost_usd_per_run: numberOrNull(payload.maxCostUsdPerRun),
      max_cost_usd_per_day: numberOrNull(payload.maxCostUsdPerDay),
      max_cost_usd_per_week: numberOrNull(payload.maxCostUsdPerWeek),
      max_retries: Math.max(0, Number(payload.maxRetries || 0)),
      cache_mode: clean(payload.cacheMode || 'until_source_changes'),
      cache_ttl_seconds: Math.max(0, Number(payload.cacheTtlSeconds || 21600)),
      duplicate_window_seconds: Math.max(0, Number(payload.duplicateWindowSeconds || 900)),
      force_refresh_allowed: Boolean(payload.forceRefreshAllowed),
      approval_class: clean(payload.approvalClass || 'none'),
      allowed_provider_types: asArray<string>(payload.allowedProviderTypes),
      allowed_models: asArray<string>(payload.allowedModels),
      allowed_trigger_types: asArray<string>(payload.allowedTriggerTypes).length ? asArray<string>(payload.allowedTriggerTypes) : ['manual'],
      execution_window: payload.executionWindow || {},
      cooldown_after_failure_seconds: Math.max(0, Number(payload.cooldownAfterFailureSeconds || 300)),
      consecutive_failure_suspend_threshold: Math.max(0, Number(payload.consecutiveFailureSuspendThreshold || 3)),
      enabled: payload.enabled !== false,
      metadata: payload.metadata || {},
      updated_by: actor.id,
      updated_at: now(),
    }
    const result = await supabase.from('ai_provider_command_policies').upsert(row, { onConflict: 'module_key,workspace_key,command_code' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'command_policy', result.data.id, row)
    return result.data
  }

  if (action === 'save_schedule') {
    const scheduleKey = clean(payload.scheduleKey), moduleKey = clean(payload.moduleKey), commandCode = clean(payload.commandCode)
    if (!scheduleKey || !moduleKey || !commandCode) throw new Error('SCHEDULE_IDENTITY_REQUIRED')
    const row = {
      schedule_key: scheduleKey,
      module_key: moduleKey,
      workspace_key: clean(payload.workspaceKey || '*'),
      command_code: commandCode,
      schedule_expression: clean(payload.scheduleExpression),
      schedule_format: clean(payload.scheduleFormat || 'cron'),
      timezone: clean(payload.timezone || 'Africa/Casablanca'),
      enabled: Boolean(payload.enabled),
      status: clean(payload.status || (payload.enabled ? 'active' : 'paused')),
      priority: Number(payload.priority || 100),
      freshness_seconds: Math.max(0, Number(payload.freshnessSeconds || 21600)),
      duplicate_window_seconds: Math.max(0, Number(payload.duplicateWindowSeconds || 900)),
      max_runs_per_day: numberOrNull(payload.maxRunsPerDay),
      max_runs_per_week: numberOrNull(payload.maxRunsPerWeek),
      estimated_input_tokens: Math.max(0, Number(payload.estimatedInputTokens || 0)),
      estimated_output_tokens: Math.max(0, Number(payload.estimatedOutputTokens || 0)),
      estimated_cost_usd: Math.max(0, Number(payload.estimatedCostUsd || 0)),
      approval_required: Boolean(payload.approvalRequired),
      provider_policy: payload.providerPolicy || {},
      dependency_policy: payload.dependencyPolicy || {},
      failure_policy: payload.failurePolicy || {},
      next_run_at: clean(payload.nextRunAt) || null,
      metadata: payload.metadata || {},
      updated_by: actor.id,
      updated_at: now(),
    }
    if (!row.schedule_expression) throw new Error('SCHEDULE_EXPRESSION_REQUIRED')
    const result = await supabase.from('ai_provider_command_schedules').upsert(row, { onConflict: 'schedule_key' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'command_schedule', result.data.id, row)
    return result.data
  }

  if (action === 'set_schedule_status') {
    const id = clean(payload.id), status = clean(payload.status)
    if (!id || !status) throw new Error('SCHEDULE_ID_AND_STATUS_REQUIRED')
    const updates = { status, enabled: status === 'active', updated_by: actor.id, updated_at: now() }
    const result = await supabase.from('ai_provider_command_schedules').update(updates).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'command_schedule', id, updates)
    return result.data
  }

  if (action === 'cancel_governed_request') {
    const id = clean(payload.id)
    if (!id) throw new Error('GOVERNED_REQUEST_ID_REQUIRED')
    const current = await supabase.from('ai_provider_governed_requests').select('*').eq('id', id).single()
    if (current.error) throw new Error(current.error.message)
    if (!['queued', 'running', 'joined'].includes(String(current.data.status))) throw new Error('GOVERNED_REQUEST_NOT_CANCELLABLE')
    if (current.data.reservation_id) {
      const release = await supabase.rpc('ai_provider_fail_runtime_budget', {
        p_reservation_id: current.data.reservation_id,
        p_lease_id: current.data.lease_id || null,
        p_http_status: null,
        p_error_code: 'CANCELLED_BY_AUTHORIZED_USER',
        p_latency_ms: null,
        p_metadata: { governedRequestId: id, cancelledBy: actor.id },
      })
      if (release.error) throw new Error(release.error.message)
    }
    const result = await supabase.from('ai_provider_governed_requests').update({
      status: 'cancelled', error_code: 'CANCELLED_BY_AUTHORIZED_USER',
      error_message: clean(payload.reason || 'Annulée par un utilisateur autorisé.'), completed_at: now(), updated_at: now(),
    }).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    if (current.data.decision === 'EXECUTE_NEW') {
      await supabase.from('ai_provider_governed_requests').update({
        status: 'cancelled', error_code: 'SOURCE_REQUEST_CANCELLED', completed_at: now(), updated_at: now(),
      }).eq('source_request_id', id).eq('status', 'joined')
    }
    await audit(actor, action, 'governed_request', id, { reason: clean(payload.reason), previousStatus: current.data.status })
    return result.data
  }

  if (action === 'invalidate_cache') {
    const fingerprint = clean(payload.requestFingerprint), reason = clean(payload.reason)
    if (!fingerprint || !reason) throw new Error('CACHE_FINGERPRINT_AND_REASON_REQUIRED')
    const result = await supabase.rpc('ai_provider_invalidate_structured_cache', {
      p_request_fingerprint: fingerprint,
      p_reason: reason,
      p_actor_id: actor.id,
    })
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'structured_result_cache', null, { fingerprint, reason, count: result.data })
    return { invalidated: Number(result.data || 0) }
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
      commandPolicies: current.commandPolicies,
      schedules: current.schedules,
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
    const result = await supabase.rpc('ai_provider_restore_sovereign_configuration', {
      p_version_id: versionId,
      p_actor_id: actor.id,
    })
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'config_version', versionId, { reason: clean(payload.reason || 'Rollback administrateur') })
    return result.data
  }


  if (action === 'phase6_set_dossier_state') {
    const id = clean(payload.id), state = clean(payload.state)
    if (!id || !state) throw new Error('DOSSIER_ID_AND_STATE_REQUIRED')
    const allowed = ['draft','testing','ready','operating','limited','cooldown','suspended','draining','revoked','archived']
    if (!allowed.includes(state)) throw new Error('INVALID_DOSSIER_STATE')
    const result = await supabase.from('ai_provider_dossiers').update({
      status: state, is_enabled: !['suspended','revoked','archived'].includes(state), updated_by: actor.id, updated_at: now(),
    }).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'dossier', id, { state, reason: clean(payload.reason) })
    return result.data
  }

  if (action === 'phase6_set_credential_state') {
    const id = clean(payload.id), state = clean(payload.state)
    if (!id || !state) throw new Error('CREDENTIAL_ID_AND_STATE_REQUIRED')
    const allowed = ['testing','validated','active','standby','failed','revoked','archived']
    if (!allowed.includes(state)) throw new Error('INVALID_CREDENTIAL_STATE')
    const updates: JsonRecord = { status: state, updated_at: now() }
    if (state === 'revoked') updates.revoked_at = now()
    if (state === 'active') updates.activated_at = now()
    const result = await supabase.from('ai_provider_credentials').update(updates).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'credential', id, { state, reason: clean(payload.reason) })
    return result.data
  }

  if (action === 'phase6_update_alert') {
    const id = clean(payload.id), status = clean(payload.status)
    if (!id || !status) throw new Error('ALERT_ID_AND_STATUS_REQUIRED')
    const updates: JsonRecord = { status }
    if (status === 'acknowledged') { updates.acknowledged_at = now(); updates.acknowledged_by = actor.id }
    const result = await supabase.from('ai_provider_alerts').update(updates).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'alert', id, { status })
    return result.data
  }

  if (action === 'phase6_save_incident') {
    const id = clean(payload.id)
    const row: JsonRecord = {
      incident_code: clean(payload.incidentCode) || `AI-INC-${Date.now()}`,
      title: clean(payload.title), severity: clean(payload.severity || 'medium'),
      category: clean(payload.category || 'operations'), status: clean(payload.status || 'open'),
      provider_dossier_id: clean(payload.dossierId) || null, affected_modules: asArray<string>(payload.affectedModules),
      summary: clean(payload.summary) || null, impact: clean(payload.impact) || null,
      root_cause: clean(payload.rootCause) || null, resolution: clean(payload.resolution) || null,
      prevention: clean(payload.prevention) || null, evidence: payload.evidence || {},
      owner_id: clean(payload.ownerId || actor.id), updated_by: actor.id, updated_at: now(),
    }
    if (!row.title) throw new Error('INCIDENT_TITLE_REQUIRED')
    const query = id ? supabase.from('ai_ops_incident_cases').update(row).eq('id', id) : supabase.from('ai_ops_incident_cases').insert({ ...row, opened_by: actor.id })
    const result = await query.select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'incident_case', result.data.id, row)
    return result.data
  }

  if (action === 'phase6_resolve_incident') {
    const id = clean(payload.id), status = clean(payload.status || 'resolved')
    if (!id) throw new Error('INCIDENT_ID_REQUIRED')
    const result = await supabase.from('ai_ops_incident_cases').update({
      status, resolution: clean(payload.resolution) || null, root_cause: clean(payload.rootCause) || null,
      prevention: clean(payload.prevention) || null, resolved_by: actor.id,
      resolved_at: status === 'resolved' ? now() : null, updated_by: actor.id, updated_at: now(),
    }).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'incident_case', id, { status })
    return result.data
  }

  if (action === 'phase6_save_change_request') {
    const id = clean(payload.id)
    const row: JsonRecord = {
      change_code: clean(payload.changeCode) || `AI-CHG-${Date.now()}`,
      title: clean(payload.title), reason: clean(payload.reason), status: clean(payload.status || 'draft'),
      risk_level: clean(payload.riskLevel || 'medium'), affected_modules: asArray<string>(payload.affectedModules),
      current_configuration: payload.currentConfiguration || {}, proposed_configuration: payload.proposedConfiguration || {},
      impact_analysis: payload.impactAnalysis || {}, testing_evidence: payload.testingEvidence || {},
      rollback_plan: clean(payload.rollbackPlan) || null, activation_mode: clean(payload.activationMode || 'manual'),
      scheduled_for: clean(payload.scheduledFor) || null, requested_by: clean(payload.requestedBy || actor.id),
      updated_by: actor.id, updated_at: now(),
    }
    if (!row.title || !row.reason) throw new Error('CHANGE_TITLE_AND_REASON_REQUIRED')
    const query = id ? supabase.from('ai_ops_change_requests').update(row).eq('id', id) : supabase.from('ai_ops_change_requests').insert(row)
    const result = await query.select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'change_request', result.data.id, row)
    return result.data
  }

  if (action === 'phase6_update_change_status') {
    const id = clean(payload.id), status = clean(payload.status)
    if (!id || !status) throw new Error('CHANGE_ID_AND_STATUS_REQUIRED')
    const updates: JsonRecord = { status, updated_by: actor.id, updated_at: now() }
    if (status === 'approved') { updates.approved_by = actor.id; updates.approved_at = now() }
    if (status === 'published') updates.published_at = now()
    const result = await supabase.from('ai_ops_change_requests').update(updates).eq('id', id).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'change_request', id, { status })
    return result.data
  }

  if (action === 'phase6_request_destruction') {
    const entityType = clean(payload.entityType), entityId = clean(payload.entityId), entityCode = clean(payload.entityCode)
    if (!entityType || !entityId || !entityCode || !clean(payload.reason)) throw new Error('DESTRUCTION_REQUEST_INCOMPLETE')
    const expected = `DESTROY ${entityCode}`
    if (clean(payload.confirmationText) !== expected) throw new Error(`TYPE_CONFIRMATION_REQUIRED:${expected}`)
    const snapshotResult = await supabase.rpc('ai_ops_dependency_snapshot', { p_entity_type: entityType, p_entity_id: entityId })
    if (snapshotResult.error) throw new Error(snapshotResult.error.message)
    const result = await supabase.from('ai_ops_destruction_requests').insert({
      request_code: `AI-DEST-${Date.now()}`, entity_type: entityType, entity_id: entityId,
      entity_code: entityCode, reason: clean(payload.reason), status: 'requested',
      dependency_snapshot: snapshotResult.data || {}, confirmation_text: clean(payload.confirmationText),
      requested_by: actor.id,
    }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, entityType, entityId, { requestId: result.data.id, reason: clean(payload.reason) })
    return result.data
  }

  if (action === 'phase6_approve_destruction') {
    const id = clean(payload.id)
    if (!id) throw new Error('DESTRUCTION_REQUEST_ID_REQUIRED')
    const result = await supabase.from('ai_ops_destruction_requests').update({
      status: 'approved', approved_by: actor.id, approved_at: now(), updated_at: now(),
    }).eq('id', id).eq('status', 'requested').select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'destruction_request', id, {})
    return result.data
  }

  if (action === 'phase6_execute_destruction') {
    const id = clean(payload.id)
    if (!id) throw new Error('DESTRUCTION_REQUEST_ID_REQUIRED')
    const result = await supabase.rpc('ai_ops_execute_destruction', { p_request_id: id, p_actor_id: actor.id })
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'destruction_request', id, { result: result.data })
    return result.data
  }

  if (action === 'phase6_save_registry') {
    const registry = clean(payload.registry), id = clean(payload.id)
    const table = registry === 'adapter' ? 'ai_ops_provider_adapters' : registry === 'capability' ? 'ai_ops_capability_registry' : registry === 'module' ? 'ai_ops_module_registry' : ''
    if (!table) throw new Error('INVALID_REGISTRY')
    const row: JsonRecord = {
      registry_key: clean(payload.registryKey), display_name: clean(payload.displayName), status: clean(payload.status || 'active'),
      description: clean(payload.description) || null, contract: payload.contract || {}, metadata: payload.metadata || {},
      updated_by: actor.id, updated_at: now(),
    }
    if (!row.registry_key || !row.display_name) throw new Error('REGISTRY_KEY_AND_NAME_REQUIRED')
    const query = id ? supabase.from(table).update(row).eq('id', id) : supabase.from(table).insert({ ...row, created_by: actor.id })
    const result = await query.select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, registry, result.data.id, row)
    return result.data
  }

  if (action === 'phase6_save_sop_progress') {
    const articleKey = clean(payload.articleKey)
    if (!articleKey) throw new Error('SOP_ARTICLE_KEY_REQUIRED')
    const row = {
      user_id: actor.id, article_key: articleKey, role_key: clean(payload.roleKey || 'operator'),
      status: clean(payload.status || 'in_progress'), completion_percent: Math.max(0, Math.min(100, Number(payload.completionPercent || 0))),
      checklist_state: payload.checklistState || {}, workbook_notes: clean(payload.workbookNotes) || null,
      assessment_score: numberOrNull(payload.assessmentScore), supervisor_validation: payload.supervisorValidation || {},
      updated_at: now(),
    }
    const result = await supabase.from('ai_ops_sop_progress').upsert(row, { onConflict: 'user_id,article_key' }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'sop_progress', result.data.id, { articleKey, status: row.status })
    return result.data
  }

  if (action === 'phase6_save_operator_note') {
    const result = await supabase.from('ai_ops_operator_notes').insert({
      user_id: actor.id, entity_type: clean(payload.entityType || 'general'), entity_id: clean(payload.entityId) || null,
      title: clean(payload.title), note: clean(payload.note), visibility: clean(payload.visibility || 'private'), tags: asArray<string>(payload.tags),
    }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'operator_note', result.data.id, {})
    return result.data
  }

  if (action === 'phase6_create_action_job') {
    const result = await supabase.from('ai_ops_action_jobs').insert({
      job_code: `AI-JOB-${Date.now()}`, job_type: clean(payload.jobType), entity_type: clean(payload.entityType) || null,
      entity_id: clean(payload.entityId) || null, status: 'queued', priority: Number(payload.priority || 100),
      input_payload: payload.inputPayload || {}, requested_by: actor.id,
    }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    await audit(actor, action, 'action_job', result.data.id, { jobType: clean(payload.jobType) })
    return result.data
  }

  throw new Error(`INVALID_ACTION:${action}`)
}
