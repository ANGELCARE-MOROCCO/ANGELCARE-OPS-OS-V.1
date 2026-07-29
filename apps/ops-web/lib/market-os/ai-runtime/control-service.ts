import { createServiceClient } from '@/lib/supabase/server'
import { getMarketAiRuntimeStatus, inspectRuntimeCapability } from './gateway'
import type { MarketAiCapability } from './types'

const now = () => new Date().toISOString()
const clean = (value: unknown) => String(value ?? '').trim()
const bool = (value: unknown, fallback = false) => value == null ? fallback : value === true || value === 'true'
const array = (value: unknown) => Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : []

async function db() { return (await createServiceClient()) as any }

async function safeRows(table: string, order = 'created_at', ascending = false, limit = 500) {
  const supabase = await db()
  const result = await supabase.from(table).select('*').order(order, { ascending }).limit(limit)
  if (result.error) {
    const message = clean(result.error.message)
    if (/does not exist|schema cache/i.test(message)) return []
    throw new Error(message)
  }
  return Array.isArray(result.data) ? result.data as Array<Record<string, unknown>> : []
}

export type RuntimeControlActor = { id: string; name: string; role: string }

function providerFamily(value: unknown) {
  const code = clean(value).toLowerCase()
  if (/tavily/.test(code)) return 'tavily'
  if (/openrouter/.test(code)) return 'openrouter'
  if (/gemini|google/.test(code)) return 'gemini-retired'
  return code || 'unknown'
}

function isMarketAssignment(row: Record<string, unknown>) {
  return ['marketing_ai', 'marketing_autopilot', 'market_os_content_command', 'content_command_center'].includes(clean(row.module_key))
}

export async function loadRuntimeControlSnapshot(options: { live?: boolean } = {}) {
  const [dossiers, assignments, models, credentials, pools, requests, schedules] = await Promise.all([
    safeRows('ai_provider_dossiers', 'created_at', false, 200),
    safeRows('ai_provider_module_assignments', 'priority', true, 500),
    safeRows('ai_provider_models', 'display_name', true, 500),
    safeRows('ai_provider_credentials', 'created_at', false, 500),
    safeRows('ai_provider_capacity_pools', 'created_at', false, 500),
    safeRows('ai_provider_governed_requests', 'created_at', false, 100),
    safeRows('marketing_ai_schedules', 'updated_at', false, 200),
  ])
  const dossierById = new Map(dossiers.map((row) => [clean(row.id), row]))
  const marketAssignments: Array<Record<string, unknown>> = assignments.filter(isMarketAssignment).map((row) => {
    const dossier = dossierById.get(clean(row.dossier_id)) || {}
    return {
      ...row,
      provider_type: dossier.provider_type,
      provider_family: providerFamily(dossier.provider_type),
      dossier_name: dossier.name,
      dossier_code: dossier.code,
      dossier_status: dossier.status,
    }
  })
  const marketDossierIds = new Set(marketAssignments.map((row) => clean(row.dossier_id)).filter(Boolean))
  const marketModels = models.filter((row) => marketDossierIds.has(clean(row.dossier_id)))
  const capabilities = await getMarketAiRuntimeStatus(Boolean(options.live))
  return {
    generatedAt: now(),
    architecture: {
      research: 'tavily',
      intelligence: 'openrouter',
      providerControl: 'sanila-ai-provider-control',
      gemini: 'retired',
      zeroDeadEnds: true,
      externalBusinessActions: 'prepared-human-handoff',
    },
    capabilities,
    dossiers: dossiers.filter((row) => marketDossierIds.has(clean(row.id)) || ['tavily', 'openrouter', 'gemini-retired'].includes(providerFamily(row.provider_type))).map((row) => ({
      ...row,
      provider_family: providerFamily(row.provider_type),
      dependency_counts: {
        assignments: assignments.filter((item) => clean(item.dossier_id) === clean(row.id)).length,
        models: models.filter((item) => clean(item.dossier_id) === clean(row.id)).length,
        credentials: credentials.filter((item) => clean(item.dossier_id) === clean(row.id)).length,
        pools: pools.filter((item) => clean(item.dossier_id) === clean(row.id)).length,
      },
    })),
    assignments: marketAssignments,
    models: marketModels,
    schedules: schedules.map((row) => ({
      ...row,
      providerRetired: /gemini|google/i.test(clean(row.provider_type || row.model || row.primary_model)),
    })),
    recentRequests: requests.filter((row) => ['marketing_ai', 'marketing_autopilot', 'market_os_content_command', 'content_command_center'].includes(clean(row.module_key))),
    controlPolicy: {
      edit: true,
      disable: true,
      archive: true,
      override: true,
      permanentDelete: true,
      permanentDeleteRequires: ['disabled record', 'no active request', 'typed confirmation', 'reason', 'server authority'],
    },
  }
}

async function requireAssignment(supabase: any, id: string) {
  const result = await supabase.from('ai_provider_module_assignments').select('*').eq('id', id).single()
  if (result.error || !result.data) throw new Error('RUNTIME_ASSIGNMENT_NOT_FOUND')
  if (!isMarketAssignment(result.data)) throw new Error('RUNTIME_ASSIGNMENT_OUT_OF_SCOPE')
  return result.data as Record<string, unknown>
}

async function activeRequestsForAssignment(supabase: any, assignment: Record<string, unknown>) {
  const activeStates = ['accepted', 'queued', 'running', 'processing', 'executing', 'awaiting_approval', 'in_progress']
  const result = await supabase.from('ai_provider_governed_requests')
    .select('id,status,module_key,created_at')
    .eq('module_key', clean(assignment.module_key))
    .in('status', activeStates)
    .limit(50)
  if (result.error && !/does not exist|schema cache/i.test(clean(result.error.message))) throw new Error(clean(result.error.message))
  return Array.isArray(result.data) ? result.data : []
}

export async function updateRuntimeAssignment(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id)
  const reason = clean(payload.reason)
  if (!id) throw new Error('RUNTIME_ASSIGNMENT_ID_REQUIRED')
  if (!reason) throw new Error('RUNTIME_CHANGE_REASON_REQUIRED')
  const supabase = await db()
  const current = await requireAssignment(supabase, id)
  const metadata = typeof current.metadata === 'object' && current.metadata ? current.metadata as Record<string, unknown> : {}
  const patch = {
    priority: payload.priority == null ? current.priority : Number(payload.priority),
    enabled: payload.enabled == null ? current.enabled : bool(payload.enabled),
    assignment_mode: clean(payload.assignmentMode || current.assignment_mode || 'primary'),
    primary_model: clean(payload.primaryModel || current.primary_model) || null,
    fallback_model: clean(payload.fallbackModel || current.fallback_model) || null,
    capability_allowlist: payload.capabilityAllowlist == null ? current.capability_allowlist : array(payload.capabilityAllowlist),
    metadata: {
      ...metadata,
      runtimeContinuity: true,
      lastGovernedChange: { actorId: actor.id, actorName: actor.name, role: actor.role, reason, at: now() },
    },
    updated_by: actor.id,
    updated_at: now(),
  }
  const result = await supabase.from('ai_provider_module_assignments').update(patch).eq('id', id).select('*').single()
  if (result.error) throw new Error(clean(result.error.message))
  return result.data
}

export async function disableRuntimeAssignment(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  return updateRuntimeAssignment({ ...payload, enabled: false, reason: clean(payload.reason) || 'Suspension humaine du runtime' }, actor)
}

export async function overrideRuntimeAssignment(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const reason = clean(payload.reason)
  if (!reason) throw new Error('RUNTIME_OVERRIDE_REASON_REQUIRED')
  return updateRuntimeAssignment({
    ...payload,
    enabled: payload.enabled == null ? true : payload.enabled,
    reason: `OVERRIDE: ${reason}`,
  }, actor)
}

export async function permanentlyDeleteRuntimeAssignment(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id)
  const reason = clean(payload.reason)
  const confirmation = clean(payload.confirmation)
  if (!id) throw new Error('RUNTIME_ASSIGNMENT_ID_REQUIRED')
  if (!reason) throw new Error('RUNTIME_DELETE_REASON_REQUIRED')
  const expected = `DELETE ${id.slice(0, 8).toUpperCase()}`
  if (confirmation !== expected) throw new Error(`RUNTIME_DELETE_CONFIRMATION_REQUIRED:${expected}`)
  const supabase = await db()
  const current = await requireAssignment(supabase, id)
  if (bool(current.enabled, true)) throw new Error('RUNTIME_ASSIGNMENT_MUST_BE_DISABLED_BEFORE_DELETE')
  const active = await activeRequestsForAssignment(supabase, current)
  if (active.length) throw new Error(`RUNTIME_ASSIGNMENT_HAS_ACTIVE_REQUESTS:${active.length}`)
  const result = await supabase.from('ai_provider_module_assignments').delete().eq('id', id).select('id').single()
  if (result.error) throw new Error(clean(result.error.message))
  return { deleted: true, id, deletedAt: now(), deletedBy: actor.id, reason }
}

export async function updateRuntimeModel(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id)
  const reason = clean(payload.reason)
  if (!id) throw new Error('RUNTIME_MODEL_ID_REQUIRED')
  if (!reason) throw new Error('RUNTIME_CHANGE_REASON_REQUIRED')
  const supabase = await db()
  const current = await supabase.from('ai_provider_models').select('*').eq('id', id).single()
  if (current.error || !current.data) throw new Error('RUNTIME_MODEL_NOT_FOUND')
  const metadata = typeof current.data.metadata === 'object' && current.data.metadata ? current.data.metadata : {}
  const result = await supabase.from('ai_provider_models').update({
    display_name: clean(payload.displayName || current.data.display_name),
    capability: clean(payload.capability || current.data.capability || 'general'),
    enabled: payload.enabled == null ? current.data.enabled : bool(payload.enabled),
    max_output_tokens: payload.maxOutputTokens == null ? current.data.max_output_tokens : Number(payload.maxOutputTokens),
    grounding_allowed: payload.groundingAllowed == null ? current.data.grounding_allowed : bool(payload.groundingAllowed),
    primary_for_capability: payload.primaryForCapability == null ? current.data.primary_for_capability : bool(payload.primaryForCapability),
    metadata: { ...metadata, lastGovernedChange: { actorId: actor.id, reason, at: now() } },
    updated_at: now(),
  }).eq('id', id).select('*').single()
  if (result.error) throw new Error(clean(result.error.message))
  return result.data
}

export async function permanentlyDeleteRuntimeModel(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id)
  const reason = clean(payload.reason)
  const confirmation = clean(payload.confirmation)
  if (!id || !reason) throw new Error('RUNTIME_MODEL_DELETE_INPUT_REQUIRED')
  const expected = `DELETE ${id.slice(0, 8).toUpperCase()}`
  if (confirmation !== expected) throw new Error(`RUNTIME_DELETE_CONFIRMATION_REQUIRED:${expected}`)
  const supabase = await db()
  const current = await supabase.from('ai_provider_models').select('*').eq('id', id).single()
  if (current.error || !current.data) throw new Error('RUNTIME_MODEL_NOT_FOUND')
  if (bool(current.data.enabled, true)) throw new Error('RUNTIME_MODEL_MUST_BE_DISABLED_BEFORE_DELETE')
  const assignments = await supabase.from('ai_provider_module_assignments').select('id').or(`primary_model.eq.${current.data.model_code},fallback_model.eq.${current.data.model_code}`).limit(10)
  if (!assignments.error && Array.isArray(assignments.data) && assignments.data.length) throw new Error(`RUNTIME_MODEL_HAS_ASSIGNMENTS:${assignments.data.length}`)
  const result = await supabase.from('ai_provider_models').delete().eq('id', id).select('id').single()
  if (result.error) throw new Error(clean(result.error.message))
  return { deleted: true, id, deletedAt: now(), deletedBy: actor.id, reason }
}

export async function updateRuntimeDossier(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id), reason = clean(payload.reason)
  if (!id || !reason) throw new Error('RUNTIME_DOSSIER_CHANGE_INPUT_REQUIRED')
  const supabase = await db()
  const current = await supabase.from('ai_provider_dossiers').select('*').eq('id', id).single()
  if (current.error || !current.data) throw new Error('RUNTIME_DOSSIER_NOT_FOUND')
  const metadata = typeof current.data.metadata === 'object' && current.data.metadata ? current.data.metadata : {}
  const result = await supabase.from('ai_provider_dossiers').update({
    name: clean(payload.name || current.data.name),
    status: clean(payload.status || current.data.status),
    is_enabled: payload.isEnabled == null ? current.data.is_enabled : bool(payload.isEnabled),
    billing_tier: clean(payload.billingTier || current.data.billing_tier),
    metadata: { ...metadata, lastGovernedChange: { actorId: actor.id, reason, at: now() } },
    updated_by: actor.id, updated_at: now(),
  }).eq('id', id).select('*').single()
  if (result.error) throw new Error(clean(result.error.message))
  return result.data
}

export async function archiveRuntimeDossier(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id), reason = clean(payload.reason) || 'Archivage du dossier provider'
  const supabase = await db()
  const activeAssignments = await supabase.from('ai_provider_module_assignments').select('id').eq('dossier_id', id).eq('enabled', true).limit(20)
  if (!activeAssignments.error && activeAssignments.data?.length) throw new Error(`RUNTIME_DOSSIER_ACTIVE_ASSIGNMENTS:${activeAssignments.data.length}`)
  return updateRuntimeDossier({ id, status: 'archived', isEnabled: false, reason }, actor)
}

export async function permanentlyDeleteRuntimeDossier(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const id = clean(payload.id), reason = clean(payload.reason), confirmation = clean(payload.confirmation)
  if (!id || !reason) throw new Error('RUNTIME_DOSSIER_DELETE_INPUT_REQUIRED')
  const supabase = await db()
  const current = await supabase.from('ai_provider_dossiers').select('*').eq('id', id).single()
  if (current.error || !current.data) throw new Error('RUNTIME_DOSSIER_NOT_FOUND')
  const expected = `DELETE ${clean(current.data.code).toUpperCase()}`
  if (confirmation !== expected) throw new Error(`RUNTIME_DELETE_CONFIRMATION_REQUIRED:${expected}`)
  if (bool(current.data.is_enabled, true) || !['archived', 'suspended', 'revoked'].includes(clean(current.data.status).toLowerCase())) throw new Error('RUNTIME_DOSSIER_MUST_BE_ARCHIVED_BEFORE_DELETE')
  const dependencyTables = ['ai_provider_module_assignments', 'ai_provider_models', 'ai_provider_credentials', 'ai_provider_capacity_pools']
  const dependencies: Record<string, number> = {}
  for (const table of dependencyTables) {
    const result = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('dossier_id', id)
    if (!result.error && Number(result.count || 0) > 0) dependencies[table] = Number(result.count || 0)
  }
  if (Object.keys(dependencies).length) throw new Error(`RUNTIME_DOSSIER_HAS_DEPENDENCIES:${JSON.stringify(dependencies)}`)
  const result = await supabase.from('ai_provider_dossiers').delete().eq('id', id).select('id').single()
  if (result.error) throw new Error(clean(result.error.message))
  return { deleted: true, id, code: current.data.code, reason, deletedBy: actor.id, deletedAt: now() }
}

export async function retireGeminiMarketAssignments(payload: Record<string, unknown>, actor: RuntimeControlActor) {
  const reason = clean(payload.reason) || 'Gemini déclaré inopérant; retrait du runtime Market OS'
  const supabase = await db()
  const dossiers = await supabase.from('ai_provider_dossiers').select('id,provider_type,name,code,status').or('provider_type.ilike.%gemini%,provider_type.ilike.%google%')
  if (dossiers.error) throw new Error(clean(dossiers.error.message))
  const ids = (dossiers.data || []).map((row: Record<string, unknown>) => clean(row.id)).filter(Boolean)
  if (!ids.length) return { updated: 0, schedulesSuspended: 0 }
  const assignments = await supabase.from('ai_provider_module_assignments').select('*').in('dossier_id', ids)
  if (assignments.error) throw new Error(clean(assignments.error.message))
  const market = (assignments.data || []).filter(isMarketAssignment)
  for (const row of market) {
    await updateRuntimeAssignment({ id: row.id, enabled: false, reason }, actor)
  }
  const schedules = await supabase.from('marketing_ai_schedules').select('id,provider_type,model,status').or('provider_type.ilike.%gemini%,model.ilike.%gemini%')
  let suspended = 0
  if (!schedules.error) {
    for (const row of schedules.data || []) {
      const result = await supabase.from('marketing_ai_schedules').update({ status: 'suspended', enabled: false, updated_at: now(), metadata: { providerRetired: true, reason, actorId: actor.id } }).eq('id', row.id)
      if (!result.error) suspended += 1
    }
  }
  return { updated: market.length, schedulesSuspended: suspended, reason }
}

export async function testRuntimeCapability(payload: Record<string, unknown>) {
  const capability = clean(payload.capability) as MarketAiCapability
  if (!['web_research', 'source_extraction', 'structured_reasoning', 'structured_content', 'multimodal_analysis', 'image_generation'].includes(capability)) throw new Error('RUNTIME_CAPABILITY_INVALID')
  return inspectRuntimeCapability(capability, true)
}
