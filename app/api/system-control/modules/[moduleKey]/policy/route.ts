import { NextResponse } from 'next/server'
import { getSystemControlContext } from '../../../_shared'
import {
  buildModulePolicyPayload,
  getRegisteredModules,
  type RuntimePolicyRow,
} from '@/lib/system-control/policy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function safeNumber(value: unknown) {
  const numeric = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(numeric) ? Math.floor(numeric) : null
}

function isTruthy(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  return false
}

export async function PATCH(request: Request, { params }: { params: Promise<{ moduleKey: string }> }) {
  try {
    const context = await getSystemControlContext()

    if (!context.authorized) {
      return NextResponse.json(
        { ok: false, error: 'System control access denied.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const { moduleKey: rawModuleKey } = await params
    const moduleKey = String(rawModuleKey || '').trim().toLowerCase()
    if (!moduleKey) {
      return NextResponse.json(
        { ok: false, error: 'Module key is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const catalog = await getRegisteredModules(context.supabase)
    const module = catalog.modules.find((entry) => entry.module.module_key === moduleKey)?.module || null
    const current = catalog.modules.find((entry) => entry.module.module_key === moduleKey)?.policy
      || null
    const fallbackModule = module || {
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
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const nextPolicy: RuntimePolicyRow = {
      id: current?.id || crypto.randomUUID(),
      module_key: moduleKey,
      auto_refresh_enabled: body.auto_refresh_enabled === undefined ? Boolean(current?.auto_refresh_enabled ?? true) : isTruthy(body.auto_refresh_enabled),
      live_polling_enabled: body.live_polling_enabled === undefined ? Boolean(current?.live_polling_enabled ?? true) : isTruthy(body.live_polling_enabled),
      heavy_sync_enabled: body.heavy_sync_enabled === undefined ? Boolean(current?.heavy_sync_enabled ?? true) : isTruthy(body.heavy_sync_enabled),
      min_refresh_interval_ms: safeNumber(body.min_refresh_interval_ms) ?? Number(current?.min_refresh_interval_ms || 300000),
      max_refresh_interval_ms: safeNumber(body.max_refresh_interval_ms) ?? Number(current?.max_refresh_interval_ms || 600000),
      jitter_enabled: body.jitter_enabled === undefined ? Boolean(current?.jitter_enabled ?? true) : isTruthy(body.jitter_enabled),
      standby_behavior: typeof body.standby_behavior === 'string' && body.standby_behavior.trim() ? String(body.standby_behavior) : String(current?.standby_behavior || 'disable_non_core'),
      emergency_behavior: typeof body.emergency_behavior === 'string' && body.emergency_behavior.trim() ? String(body.emergency_behavior) : String(current?.emergency_behavior || 'block'),
      allowed_during_standby: body.allowed_during_standby === undefined ? Boolean(current?.allowed_during_standby ?? false) : isTruthy(body.allowed_during_standby),
      manual_override_enabled: body.manual_override_enabled === undefined ? Boolean(current?.manual_override_enabled ?? true) : isTruthy(body.manual_override_enabled),
      schedule: body.schedule && typeof body.schedule === 'object' && !Array.isArray(body.schedule) ? body.schedule as Record<string, unknown> : (current?.schedule || {}),
      policy_payload: body.policy_payload && typeof body.policy_payload === 'object' && !Array.isArray(body.policy_payload) ? body.policy_payload as Record<string, unknown> : (current?.policy_payload || {}),
      updated_by: context.actor.email || context.user?.email || null,
      created_at: current?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const minRefreshIntervalMs = Number.isFinite(nextPolicy.min_refresh_interval_ms) ? Number(nextPolicy.min_refresh_interval_ms) : 300000
    const maxRefreshIntervalMs = Number.isFinite(nextPolicy.max_refresh_interval_ms) ? Number(nextPolicy.max_refresh_interval_ms) : 600000

    const isCore = Boolean(module?.is_core_system || moduleKey === 'ceo-system-control')

    if (!isCore && minRefreshIntervalMs < 60_000) {
      return NextResponse.json(
        { ok: false, error: 'Minimum refresh interval cannot be below 60000 ms for non-core modules.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    if (maxRefreshIntervalMs < minRefreshIntervalMs) {
      return NextResponse.json(
        { ok: false, error: 'Maximum refresh interval must be greater than or equal to the minimum refresh interval.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    if (moduleKey === 'ceo-system-control' && nextPolicy.allowed_during_standby === false) {
      return NextResponse.json(
        { ok: false, error: 'CEO control module cannot be blocked from standby.' },
        { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const beforePayload = current ? buildModulePolicyPayload(fallbackModule, current) : {}

    const { data: savedPolicy, error: saveError } = await context.supabase
      .from('system_runtime_policies')
      .upsert([{
        module_key: nextPolicy.module_key,
        auto_refresh_enabled: nextPolicy.auto_refresh_enabled,
        live_polling_enabled: nextPolicy.live_polling_enabled,
        heavy_sync_enabled: nextPolicy.heavy_sync_enabled,
        min_refresh_interval_ms: minRefreshIntervalMs,
        max_refresh_interval_ms: maxRefreshIntervalMs,
        jitter_enabled: nextPolicy.jitter_enabled,
        standby_behavior: nextPolicy.standby_behavior,
        emergency_behavior: nextPolicy.emergency_behavior,
        allowed_during_standby: moduleKey === 'ceo-system-control' ? true : nextPolicy.allowed_during_standby,
        manual_override_enabled: nextPolicy.manual_override_enabled,
        schedule: nextPolicy.schedule,
        policy_payload: {
          ...(nextPolicy.policy_payload || {}),
          is_core_system: isCore,
          module_group: module?.module_group || null,
          risk_level: module?.risk_level || 'normal',
          cost_sensitivity: module?.cost_sensitivity || 'medium',
        },
        updated_by: nextPolicy.updated_by,
        updated_at: nextPolicy.updated_at,
      }], { onConflict: 'module_key' })
      .select('*')
      .single()

    if (saveError) {
      return NextResponse.json(
        { ok: false, error: saveError.message || 'Unable to save runtime policy.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    const { error: eventError } = await context.supabase.from('system_policy_events').insert([{
      event_type: 'runtime_policy_updated',
      module_key: moduleKey,
      route_path: null,
      actor_email: context.actor.email || context.user?.email || null,
      before_payload: beforePayload,
      after_payload: {
        ...buildModulePolicyPayload(fallbackModule, savedPolicy as RuntimePolicyRow),
        source: 'policy-api',
      },
      message: `Runtime policy updated for ${moduleKey}.`,
    }])

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message || 'Policy saved but audit write failed.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        moduleKey,
        policy: savedPolicy,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update runtime policy',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
