import { NextResponse } from 'next/server'
import { getSystemControlContext } from '../../_shared'
import {
  buildModulePolicyPayload,
  getRegisteredModules,
  type ModuleRegistryRow,
  type RuntimePolicyRow,
} from '@/lib/system-control/policy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type BatchPatchInput = {
  auto_refresh_enabled?: boolean
  live_polling_enabled?: boolean
  heavy_sync_enabled?: boolean
  min_refresh_interval_ms?: number
  max_refresh_interval_ms?: number
  standby_behavior?: string
  emergency_behavior?: string
}

type BatchResult = {
  moduleKey: string
  moduleName: string
  policy: RuntimePolicyRow
}

function isTruthy(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  return false
}

function safeNumber(value: unknown) {
  const numeric = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(numeric) ? Math.floor(numeric) : null
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isProtectedModuleKey(moduleKey: string) {
  return moduleKey === 'ceo-system-control'
}

function hasPatchChange(current: RuntimePolicyRow, patch: BatchPatchInput) {
  return Object.entries(patch).some(([key, value]) => {
    switch (key) {
      case 'auto_refresh_enabled':
        return Boolean(current.auto_refresh_enabled) !== Boolean(value)
      case 'live_polling_enabled':
        return Boolean(current.live_polling_enabled) !== Boolean(value)
      case 'heavy_sync_enabled':
        return Boolean(current.heavy_sync_enabled) !== Boolean(value)
      case 'min_refresh_interval_ms':
        return Number(current.min_refresh_interval_ms || 0) !== Number(value || 0)
      case 'max_refresh_interval_ms':
        return Number(current.max_refresh_interval_ms || 0) !== Number(value || 0)
      case 'standby_behavior':
        return String(current.standby_behavior || '') !== String(value || '')
      case 'emergency_behavior':
        return String(current.emergency_behavior || '') !== String(value || '')
      default:
        return false
    }
  })
}

function buildSafePatch(rawPatch: Record<string, unknown>) {
  const allowedKeys = new Set([
    'auto_refresh_enabled',
    'live_polling_enabled',
    'heavy_sync_enabled',
    'min_refresh_interval_ms',
    'max_refresh_interval_ms',
    'standby_behavior',
    'emergency_behavior',
  ])
  const unknownKeys = Object.keys(rawPatch).filter((key) => !allowedKeys.has(key))
  if (unknownKeys.length) {
    return {
      patch: null,
      errors: [`Unsupported patch field(s): ${unknownKeys.join(', ')}`],
    }
  }

  const patch: BatchPatchInput = {}
  const errors: string[] = []

  if ('auto_refresh_enabled' in rawPatch) patch.auto_refresh_enabled = isTruthy(rawPatch.auto_refresh_enabled)
  if ('live_polling_enabled' in rawPatch) patch.live_polling_enabled = isTruthy(rawPatch.live_polling_enabled)
  if ('heavy_sync_enabled' in rawPatch) patch.heavy_sync_enabled = isTruthy(rawPatch.heavy_sync_enabled)

  if ('min_refresh_interval_ms' in rawPatch) {
    const value = safeNumber(rawPatch.min_refresh_interval_ms)
    if (value == null) errors.push('min_refresh_interval_ms must be a number.')
    else patch.min_refresh_interval_ms = value
  }

  if ('max_refresh_interval_ms' in rawPatch) {
    const value = safeNumber(rawPatch.max_refresh_interval_ms)
    if (value == null) errors.push('max_refresh_interval_ms must be a number.')
    else patch.max_refresh_interval_ms = value
  }

  if ('standby_behavior' in rawPatch) {
    const value = normalizeString(rawPatch.standby_behavior)
    if (!value) errors.push('standby_behavior must be a non-empty string.')
    else patch.standby_behavior = value
  }

  if ('emergency_behavior' in rawPatch) {
    const value = normalizeString(rawPatch.emergency_behavior)
    if (!value) errors.push('emergency_behavior must be a non-empty string.')
    else patch.emergency_behavior = value
  }

  if (patch.min_refresh_interval_ms != null && patch.max_refresh_interval_ms != null && patch.max_refresh_interval_ms < patch.min_refresh_interval_ms) {
    errors.push('max_refresh_interval_ms must be greater than or equal to min_refresh_interval_ms.')
  }

  return {
    patch,
    errors,
  }
}

function buildRuntimePolicyRow(
  module: ModuleRegistryRow,
  current: RuntimePolicyRow,
  patch: BatchPatchInput,
): RuntimePolicyRow {
  const now = new Date().toISOString()
  const isCore = isProtectedModuleKey(module.module_key)
  const minRefresh = patch.min_refresh_interval_ms ?? Number(current.min_refresh_interval_ms || (isCore ? 60_000 : 300_000))
  const maxRefresh = patch.max_refresh_interval_ms ?? Number(current.max_refresh_interval_ms || (isCore ? 300_000 : 600_000))

  return {
    ...current,
    module_key: module.module_key,
    auto_refresh_enabled: patch.auto_refresh_enabled ?? Boolean(current.auto_refresh_enabled ?? true),
    live_polling_enabled: patch.live_polling_enabled ?? Boolean(current.live_polling_enabled ?? true),
    heavy_sync_enabled: patch.heavy_sync_enabled ?? Boolean(current.heavy_sync_enabled ?? true),
    min_refresh_interval_ms: minRefresh,
    max_refresh_interval_ms: maxRefresh,
    jitter_enabled: Boolean(current.jitter_enabled ?? true),
    standby_behavior: patch.standby_behavior ?? String(current.standby_behavior || (isCore ? 'allow' : 'disable_non_core')),
    emergency_behavior: patch.emergency_behavior ?? String(current.emergency_behavior || 'block'),
    allowed_during_standby: isCore ? true : Boolean(current.allowed_during_standby ?? false),
    manual_override_enabled: Boolean(current.manual_override_enabled ?? true),
    schedule: current.schedule || {},
    policy_payload: {
      ...(current.policy_payload || {}),
      is_core_system: Boolean(module.is_core_system),
      module_group: module.module_group || null,
      risk_level: module.risk_level || 'normal',
      cost_sensitivity: module.cost_sensitivity || 'medium',
    },
    updated_by: current.updated_by || null,
    created_at: current.created_at || now,
    updated_at: now,
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getSystemControlContext()
    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const rawModuleKeys = Array.isArray(body.moduleKeys) ? body.moduleKeys : []
    const moduleKeys = [...new Set(rawModuleKeys.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean))]

    if (!moduleKeys.length) {
      return NextResponse.json(
        { ok: false, error: 'moduleKeys must be a non-empty array.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const rawPatch = body.patch && typeof body.patch === 'object' && !Array.isArray(body.patch) ? body.patch as Record<string, unknown> : {}
    const normalized = buildSafePatch(rawPatch)
    if (normalized.errors.length) {
      return NextResponse.json(
        { ok: false, error: 'Invalid patch payload.', details: normalized.errors },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }
    const patch = normalized.patch
    if (!patch) {
      return NextResponse.json(
        { ok: false, error: 'Invalid patch payload.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const reason = normalizeString(body.reason)
    const catalog = await getRegisteredModules(context.supabase)
    const moduleMap = new Map(catalog.modules.map(({ module, policy }) => [module.module_key, { module, policy }]))
    const updatedPolicies: BatchResult[] = []
    const failures: Array<{ moduleKey: string; error: string }> = []
    const unchanged: string[] = []

    for (const moduleKey of moduleKeys) {
      const entry = moduleMap.get(moduleKey)
      if (!entry) {
        failures.push({ moduleKey, error: 'Module not found in runtime registry.' })
        continue
      }

      if (isProtectedModuleKey(moduleKey)) {
        if (patch.auto_refresh_enabled === false || patch.live_polling_enabled === false || patch.heavy_sync_enabled === false) {
          failures.push({ moduleKey, error: 'CEO control module cannot be disabled.' })
          continue
        }
        if (patch.standby_behavior && patch.standby_behavior !== 'allow') {
          failures.push({ moduleKey, error: 'CEO control module must remain allowed during standby.' })
          continue
        }
        if (patch.emergency_behavior && patch.emergency_behavior !== 'block') {
          failures.push({ moduleKey, error: 'CEO control module must remain protected in emergency.' })
          continue
        }
        if (patch.min_refresh_interval_ms != null && patch.min_refresh_interval_ms < 60_000) {
          failures.push({ moduleKey, error: 'CEO control module minimum interval cannot be below 60000 ms.' })
          continue
        }
      } else if (patch.min_refresh_interval_ms != null && patch.min_refresh_interval_ms < 60_000) {
        failures.push({ moduleKey, error: 'Minimum refresh interval cannot be below 60000 ms for non-core modules.' })
        continue
      }

      const nextPolicy = buildRuntimePolicyRow(entry.module, entry.policy, patch)
      const minRefreshIntervalMs = Number(nextPolicy.min_refresh_interval_ms || 0)
      const maxRefreshIntervalMs = Number(nextPolicy.max_refresh_interval_ms || 0)

      if (maxRefreshIntervalMs < minRefreshIntervalMs) {
        failures.push({ moduleKey, error: 'Maximum refresh interval must be greater than or equal to the minimum refresh interval.' })
        continue
      }

      if (!hasPatchChange(entry.policy, patch)) {
        unchanged.push(moduleKey)
        continue
      }

      const { data: savedPolicy, error: saveError } = await context.supabase
        .from('system_runtime_policies')
        .upsert([{
          module_key: moduleKey,
          auto_refresh_enabled: nextPolicy.auto_refresh_enabled,
          live_polling_enabled: nextPolicy.live_polling_enabled,
          heavy_sync_enabled: nextPolicy.heavy_sync_enabled,
          min_refresh_interval_ms: minRefreshIntervalMs,
          max_refresh_interval_ms: maxRefreshIntervalMs,
          jitter_enabled: nextPolicy.jitter_enabled,
          standby_behavior: nextPolicy.standby_behavior,
          emergency_behavior: nextPolicy.emergency_behavior,
          allowed_during_standby: nextPolicy.allowed_during_standby,
          manual_override_enabled: nextPolicy.manual_override_enabled,
          schedule: nextPolicy.schedule,
          policy_payload: nextPolicy.policy_payload,
          updated_by: context.actor.email || context.user?.email || null,
          updated_at: nextPolicy.updated_at,
          created_at: nextPolicy.created_at,
        }], { onConflict: 'module_key' })
        .select('*')
        .single()

      if (saveError) {
        failures.push({ moduleKey, error: saveError.message || 'Unable to save runtime policy.' })
        continue
      }

      updatedPolicies.push({
        moduleKey,
        moduleName: entry.module.module_name,
        policy: savedPolicy as RuntimePolicyRow,
      })
    }

    if (!updatedPolicies.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No policy rows were updated.',
          failures,
          unchanged,
        },
        { status: 409, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const batchEvent = {
      event_type: 'runtime_policy_batch_updated',
      module_key: null,
      route_path: null,
      actor_email: context.actor.email || context.user?.email || null,
      before_payload: {
        moduleKeys,
        reason,
      },
        after_payload: {
        patch,
        updatedModules: updatedPolicies.map((item) => ({
          moduleKey: item.moduleKey,
          moduleName: item.moduleName,
          policy: buildModulePolicyPayload(
            moduleMap.get(item.moduleKey)?.module || entryFallbackModule(item.moduleKey),
            item.policy,
          ),
        })),
        failedModules: failures,
        unchanged,
        reason,
      },
      message: `Updated ${updatedPolicies.length} runtime policies${reason ? `: ${reason}` : '.'}`,
    }

    const { error: eventError } = await context.supabase.from('system_policy_events').insert([batchEvent])
    if (eventError) {
      return NextResponse.json(
        {
          ok: false,
          error: eventError.message || 'Policies saved but audit write failed.',
          updatedPolicies,
          failures,
          unchanged,
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        updatedPolicies,
        failures,
        unchanged,
        summary: {
          updatedCount: updatedPolicies.length,
          failedCount: failures.length,
          unchangedCount: unchanged.length,
          auditEventWritten: true,
        },
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update runtime policies',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}

function entryFallbackModule(moduleKey: string): ModuleRegistryRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    module_key: moduleKey,
    module_name: moduleKey,
    module_group: null,
    description: null,
    route_prefixes: [],
    api_prefixes: [],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'normal',
    cost_sensitivity: 'medium',
    is_core_system: moduleKey === 'ceo-system-control',
    is_allowed_in_standby: moduleKey === 'ceo-system-control',
    detected_source: 'manual',
    last_seen_at: now,
    created_at: now,
    updated_at: now,
  }
}
