import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export const SYSTEM_RUNTIME_CONTROL_ID = '11111111-1111-1111-1111-111111111111'
export const SYSTEM_CONTROL_STATE_TABLE = 'system_runtime_control'
export const SYSTEM_CONTROL_EVENT_TABLE = 'system_runtime_events'
export const SYSTEM_CONTROL_USAGE_TABLE = 'system_usage_snapshots'

export const SYSTEM_CONTROL_ALLOWED_ROLES = ['ceo', 'admin'] as const

export const SYSTEM_CONTROL_PUBLIC_PATHS = [
  '/login',
  '/logout',
  '/auth',
  '/unauthorized',
  '/system-offline',
  '/verify',
]

export const SYSTEM_CONTROL_PUBLIC_PREFIXES = [
  '/api/auth',
]

export const SYSTEM_CONTROL_CORE_PREFIXES = [
  '/ceo/system-control',
  '/api/system-control',
]

export const SYSTEM_CONTROL_STATIC_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

export const SYSTEM_CONTROL_PROGRESS = {
  shutdown: [
    { percent: 0, key: 'validate_authorization', label: 'Validate CEO authorization', detail: 'Confirm the active operator can place the platform into standby.' },
    { percent: 15, key: 'freeze_live_polling', label: 'Freeze live polling', detail: 'Stop live refresh loops and realtime polling paths.' },
    { percent: 30, key: 'disable_background_sync', label: 'Disable background sync', detail: 'Pause scheduled sync workers and non-essential reconciliations.' },
    { percent: 45, key: 'disable_heavy_apis', label: 'Disable heavy APIs', detail: 'Block non-essential API traffic and operational dashboards.' },
    { percent: 60, key: 'lock_normal_users', label: 'Lock normal users', detail: 'Redirect protected pages to protected standby mode.' },
    { percent: 75, key: 'preserve_core_routes', label: 'Preserve CEO core routes', detail: 'Keep the CEO control tower and system-control APIs accessible.' },
    { percent: 90, key: 'write_audit_event', label: 'Write audit event', detail: 'Persist the runtime transition with actor and payload detail.' },
    { percent: 100, key: 'standby_active', label: 'Standby mode active', detail: 'Protected standby mode is now active.' },
  ],
  restore: [
    { percent: 0, key: 'validate_authorization', label: 'Validate CEO authorization', detail: 'Confirm the active operator can restore normal operation.' },
    { percent: 15, key: 'unlock_routing', label: 'Unlock routing', detail: 'Allow protected routing to resume for authorized paths.' },
    { percent: 30, key: 're_enable_core_apis', label: 'Re-enable core APIs', detail: 'Restore control-plane and core app routes.' },
    { percent: 45, key: 're_enable_module_apis', label: 'Re-enable module APIs', detail: 'Restore non-essential module endpoints when safe.' },
    { percent: 60, key: 're_enable_polling', label: 'Re-enable polling at safe rate', detail: 'Return live polling in a controlled cadence.' },
    { percent: 75, key: 're_enable_scheduled_sync', label: 'Re-enable scheduled sync', detail: 'Resume background sync jobs and reconciliations.' },
    { percent: 90, key: 'write_audit_event', label: 'Write audit event', detail: 'Persist the restore transition with actor and payload detail.' },
    { percent: 100, key: 'normal_restored', label: 'Normal mode restored', detail: 'Platform is back in normal mode.' },
  ],
} as const

export type SystemRuntimeMode =
  | 'normal'
  | 'shutdown_in_progress'
  | 'standby'
  | 'restore_in_progress'
  | 'emergency_lock'
  | 'polling_only'
  | 'sync_only'
  | string

export type SystemRuntimeStateRow = {
  id: string
  mode: SystemRuntimeMode
  is_system_online: boolean
  shutdown_started_at: string | null
  shutdown_ends_at: string | null
  resume_at: string | null
  timezone: string
  reason: string | null
  authorized_roles: string[] | null
  authorized_emails: string[] | null
  disabled_modules: Record<string, unknown> | null
  enabled_core_routes: string[] | null
  schedule: Record<string, unknown> | null
  last_action_by: string | null
  last_action_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type SystemRuntimeState = {
  id: string
  mode: SystemRuntimeMode
  isSystemOnline: boolean
  shutdownStartedAt: string | null
  shutdownEndsAt: string | null
  resumeAt: string | null
  timezone: string
  reason: string | null
  authorizedRoles: string[]
  authorizedEmails: string[]
  disabledModules: Record<string, {
    disabled: boolean
    updatedAt: string | null
    pressure?: number
    reason?: string | null
    lastActivityAt?: string | null
    scope?: string | null
  }>
  enabledCoreRoutes: string[]
  schedule: Record<string, unknown>
  lastActionBy: string | null
  lastActionAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type RuntimeActor = {
  id: string | null
  email: string | null
  role: string | null
  permissions: string[]
}

export type RuntimeProgressStep = {
  percent: number
  key: string
  label: string
  detail: string
}

export type RuntimeProgressPlan = {
  action: 'shutdown' | 'restore'
  command: string
  steps: RuntimeProgressStep[]
  finalState: Partial<SystemRuntimeStateRow>
}

export type SafeDisabledResponseInput = {
  pathname: string
  method: string
  reason?: string | null
  resumeAt?: string | null
  mode?: string | null
}

export function getSupabaseRuntimeClientFromRequest(request: NextRequest) {
  const env = getSupabaseEnv()

  return createServerClient(env.url, env.serviceRoleKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
      },
      setAll() {},
    },
  })
}

export function getDefaultRuntimeRow(): SystemRuntimeStateRow {
  return {
    id: SYSTEM_RUNTIME_CONTROL_ID,
    mode: 'normal',
    is_system_online: true,
    shutdown_started_at: null,
    shutdown_ends_at: null,
    resume_at: null,
    timezone: 'Africa/Casablanca',
    reason: null,
    authorized_roles: ['ceo', 'admin'],
    authorized_emails: [],
    disabled_modules: {},
    enabled_core_routes: ['/ceo/system-control'],
    schedule: {},
    last_action_by: null,
    last_action_at: null,
    created_at: null,
    updated_at: null,
  }
}

export function normalizeRuntimeRow(row: Partial<SystemRuntimeStateRow> | null | undefined): SystemRuntimeState {
  const base = getDefaultRuntimeRow()
  const disabledModulesRaw = (row?.disabled_modules && typeof row.disabled_modules === 'object' && !Array.isArray(row.disabled_modules))
    ? row.disabled_modules as Record<string, unknown>
    : {}

  const disabledModules = Object.entries(disabledModulesRaw).reduce<SystemRuntimeState['disabledModules']>((acc, [key, value]) => {
    if (typeof value === 'boolean') {
      acc[key] = { disabled: value, updatedAt: null }
      return acc
    }

    if (value && typeof value === 'object') {
      const entry = value as Record<string, unknown>
      acc[key] = {
        disabled: Boolean(entry.disabled ?? entry.is_disabled ?? false),
        updatedAt: typeof entry.updatedAt === 'string' ? String(entry.updatedAt) : typeof entry.updated_at === 'string' ? String(entry.updated_at) : null,
        pressure: typeof entry.pressure === 'number' ? entry.pressure : typeof entry.requestPressure === 'number' ? entry.requestPressure : undefined,
        reason: typeof entry.reason === 'string' ? entry.reason : null,
        lastActivityAt: typeof entry.lastActivityAt === 'string' ? entry.lastActivityAt : typeof entry.last_activity_at === 'string' ? String(entry.last_activity_at) : null,
        scope: typeof entry.scope === 'string' ? entry.scope : null,
      }
    }

    return acc
  }, {})

  return {
    id: String(row?.id || base.id),
    mode: String(row?.mode || base.mode),
    isSystemOnline: Boolean(row?.is_system_online ?? base.is_system_online),
    shutdownStartedAt: row?.shutdown_started_at || base.shutdown_started_at,
    shutdownEndsAt: row?.shutdown_ends_at || base.shutdown_ends_at,
    resumeAt: row?.resume_at || base.resume_at,
    timezone: String(row?.timezone || base.timezone),
    reason: row?.reason ?? base.reason,
    authorizedRoles: Array.isArray(row?.authorized_roles) ? row!.authorized_roles!.map(String) : base.authorized_roles || [],
    authorizedEmails: Array.isArray(row?.authorized_emails) ? row!.authorized_emails!.map((email) => String(email).toLowerCase()) : base.authorized_emails || [],
    disabledModules,
    enabledCoreRoutes: Array.isArray(row?.enabled_core_routes) ? row!.enabled_core_routes!.map(String) : base.enabled_core_routes || [],
    schedule: (row?.schedule && typeof row.schedule === 'object' && !Array.isArray(row.schedule)) ? row.schedule as Record<string, unknown> : {},
    lastActionBy: row?.last_action_by ?? base.last_action_by,
    lastActionAt: row?.last_action_at ?? base.last_action_at,
    createdAt: row?.created_at ?? base.created_at,
    updatedAt: row?.updated_at ?? base.updated_at,
  }
}

export function isSystemRuntimeAuthorizedActor(actor: RuntimeActor | null | undefined, state?: SystemRuntimeState | null) {
  if (!actor) return false

  const role = String(actor.role || '').trim().toLowerCase()
  const email = String(actor.email || '').trim().toLowerCase()
  const allowedRoles = state?.authorizedRoles?.length ? state.authorizedRoles.map((value) => String(value).toLowerCase()) : [...SYSTEM_CONTROL_ALLOWED_ROLES]
  const allowedEmails = state?.authorizedEmails?.length ? state.authorizedEmails.map((value) => String(value).toLowerCase()) : []

  return allowedRoles.includes(role) || allowedEmails.includes(email) || role === 'ceo' || role === 'admin'
}

export function isStaticAssetPath(pathname: string) {
  return SYSTEM_CONTROL_STATIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|webp|ico|txt|json|xml|woff2?|ttf|otf)$/i.test(pathname)
}

export function isPublicSystemPath(pathname: string) {
  return SYSTEM_CONTROL_PUBLIC_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || SYSTEM_CONTROL_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isSystemControlPath(pathname: string) {
  return SYSTEM_CONTROL_CORE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getRuntimeModuleForPath(pathname: string) {
  const normalized = pathname.toLowerCase()

  if (normalized.startsWith('/ceo/system-control') || normalized.startsWith('/api/system-control')) return 'control-tower'
  if (normalized.startsWith('/api/carelink/ops') || normalized.startsWith('/carelink-ops')) return 'carelink-ops'
  if (normalized.startsWith('/api/carelink') || normalized.startsWith('/carelink')) return 'carelink-mobile'
  if (normalized.includes('live-map') || normalized.includes('dispatch') || normalized.includes('agent-pool') || normalized.includes('sla-escalations') || normalized.includes('control-room') || normalized.includes('overview') || normalized.includes('reports') || normalized.includes('payments')) return 'dashboards'
  if (normalized.includes('poll') || normalized.includes('realtime') || normalized.includes('live-missions') || normalized.includes('sync')) return 'live-polling'
  if (normalized.includes('email-os') || normalized.includes('/connect') || normalized.includes('/voice')) return 'email-connect-voice'
  return null
}

export function isCoreRouteAllowed(pathname: string, state: SystemRuntimeState, actor?: RuntimeActor | null) {
  if (isStaticAssetPath(pathname) || isPublicSystemPath(pathname) || isSystemControlPath(pathname)) return true
  if (actor && isSystemRuntimeAuthorizedActor(actor, state)) {
    return state.enabledCoreRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  }
  return false
}

export function shouldBlockRouteForDisabledModule(pathname: string, state: SystemRuntimeState) {
  const moduleKey = getRuntimeModuleForPath(pathname)
  if (!moduleKey) return false

  const moduleState = state.disabledModules[moduleKey]
  if (moduleState?.disabled) return true

  if (state.mode === 'emergency_lock') return true
  if (state.mode === 'standby' || state.mode === 'shutdown_in_progress' || state.mode === 'restore_in_progress') {
    return true
  }

  return false
}

export function buildSafeDisabledResponse(input: SafeDisabledResponseInput) {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      mode: input.mode || 'standby',
      pathname: input.pathname,
      method: input.method,
      message: 'ANGELCARE system is in protected standby mode.',
      resumeAt: input.resumeAt || null,
      reason: input.reason || null,
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Retry-After': '300',
      },
    },
  )
}

export async function ensureRuntimeControlRow(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_STATE_TABLE)
    .select('*')
    .eq('id', SYSTEM_RUNTIME_CONTROL_ID)
    .maybeSingle()

  if (error) throw error
  if (data) return data as SystemRuntimeStateRow

  const { data: inserted, error: insertError } = await supabase
    .from(SYSTEM_CONTROL_STATE_TABLE)
    .insert([getDefaultRuntimeRow()])
    .select('*')
    .single()

  if (insertError) throw insertError

  return inserted as SystemRuntimeStateRow
}

export async function loadRuntimeState(supabase: SupabaseClient) {
  const row = await ensureRuntimeControlRow(supabase)
  return normalizeRuntimeRow(row)
}

export async function updateRuntimeState(
  supabase: SupabaseClient,
  patch: Partial<SystemRuntimeStateRow>,
) {
  const current = await ensureRuntimeControlRow(supabase)
  const updates = {
    ...patch,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_STATE_TABLE)
    .update(updates)
    .eq('id', current.id)
    .select('*')
    .single()

  if (error) throw error
  return normalizeRuntimeRow(data as SystemRuntimeStateRow)
}

export async function recordRuntimeEvent(
  supabase: SupabaseClient,
  input: {
    eventType: string
    fromMode?: string | null
    toMode?: string | null
    actorEmail?: string | null
    actorRole?: string | null
    payload?: Record<string, unknown>
  },
) {
  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_EVENT_TABLE)
    .insert([{
      event_type: input.eventType,
      from_mode: input.fromMode || null,
      to_mode: input.toMode || null,
      actor_email: input.actorEmail || null,
      actor_role: input.actorRole || null,
      payload: input.payload || {},
    }])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function recordUsageSnapshot(
  supabase: SupabaseClient,
  input: {
    source: string
    metricKey: string
    metricValue?: number
    costEstimate?: number
    periodStart?: string
    periodEnd?: string
    payload?: Record<string, unknown>
  },
) {
  const periodEnd = input.periodEnd ? new Date(input.periodEnd) : new Date()
  const periodStart = input.periodStart ? new Date(input.periodStart) : new Date(periodEnd.getTime() - 60 * 60 * 1000)

  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_USAGE_TABLE)
    .insert([{
      source: input.source,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metric_key: input.metricKey,
      metric_value: input.metricValue ?? 0,
      cost_estimate: input.costEstimate ?? 0,
      payload: input.payload || {},
    }])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listRuntimeEvents(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_EVENT_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function listUsageSnapshots(supabase: SupabaseClient, limit = 200) {
  const { data, error } = await supabase
    .from(SYSTEM_CONTROL_USAGE_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export function buildShutdownProgressPlan(input: {
  state: SystemRuntimeState
  command: string
  reason?: string | null
  resumeAt?: string | null
  timezone?: string | null
  disabledModules?: Record<string, unknown>
  enabledCoreRoutes?: string[]
}) : RuntimeProgressPlan {
  const now = new Date().toISOString()
  const baseDisabledModules = { ...input.state.disabledModules }
  const command = input.command || 'shutdown_now'
  const isFullShutdown = command === 'shutdown_now' || command === 'emergency_lock'
  const isPollingOnly = command === 'disable_polling_only'
  const isSyncOnly = command === 'disable_heavy_sync_only'

  const nextDisabledModules: Record<string, unknown> = isFullShutdown ? {
    ...baseDisabledModules,
    carelink_ops: {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'ops',
      pressure: 0,
    },
    carelink_mobile: {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'mobile',
      pressure: 0,
    },
    dashboards: {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'dashboards',
      pressure: 0,
    },
    background_sync: {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'sync',
      pressure: 0,
    },
    live_polling: {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'polling',
      pressure: 0,
    },
    'email-connect-voice': {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'shutdown mode',
      scope: 'connect-voice',
      pressure: 0,
    },
  } : {
    ...baseDisabledModules,
  }

  if (isPollingOnly) {
    nextDisabledModules.live_polling = {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'polling disabled',
      scope: 'polling',
      pressure: 0,
    }
  }

  if (isSyncOnly) {
    nextDisabledModules.background_sync = {
      disabled: true,
      updatedAt: now,
      reason: input.reason || 'background sync disabled',
      scope: 'sync',
      pressure: 0,
    }
  }

  if (input.disabledModules && typeof input.disabledModules === 'object') {
    Object.assign(nextDisabledModules, input.disabledModules)
  }

  const progress = SYSTEM_CONTROL_PROGRESS.shutdown

  return {
    action: 'shutdown',
    command,
    steps: [...progress],
    finalState: {
      mode: isFullShutdown ? (command === 'emergency_lock' ? 'emergency_lock' : 'standby') : command,
      is_system_online: isFullShutdown ? false : true,
      shutdown_started_at: isFullShutdown ? now : input.state.shutdownStartedAt || null,
      shutdown_ends_at: isFullShutdown ? now : input.state.shutdownEndsAt || null,
      resume_at: input.resumeAt || input.state.resumeAt || null,
      timezone: input.timezone || input.state.timezone,
      reason: input.reason || input.state.reason || 'Protected standby mode enabled.',
      disabled_modules: nextDisabledModules,
      enabled_core_routes: input.enabledCoreRoutes || input.state.enabledCoreRoutes || ['/ceo/system-control'],
      schedule: {
        ...(input.state.schedule || {}),
        shutdownAt: isFullShutdown ? now : input.state.schedule?.shutdownAt || null,
        resumeAt: input.resumeAt || input.state.resumeAt || null,
        timezone: input.timezone || input.state.timezone,
        reason: input.reason || input.state.reason || null,
        command,
      },
      last_action_at: now,
    },
  }
}

export function buildRestoreProgressPlan(input: {
  state: SystemRuntimeState
  command: string
  reason?: string | null
  timezone?: string | null
}) : RuntimeProgressPlan {
  const now = new Date().toISOString()

  return {
    action: 'restore',
    command: input.command || 'restore_now',
    steps: [...SYSTEM_CONTROL_PROGRESS.restore],
    finalState: {
      mode: 'normal',
      is_system_online: true,
      shutdown_started_at: input.state.shutdownStartedAt || null,
      shutdown_ends_at: input.state.shutdownEndsAt || null,
      resume_at: now,
      timezone: input.timezone || input.state.timezone,
      reason: input.reason || null,
      disabled_modules: {},
      enabled_core_routes: input.state.enabledCoreRoutes || ['/ceo/system-control'],
      schedule: {
        ...(input.state.schedule || {}),
        resumeAt: now,
        timezone: input.timezone || input.state.timezone,
        reason: input.reason || null,
        command: input.command || 'restore_now',
      },
      last_action_at: now,
    },
  }
}

export async function refreshRuntimeStateFromSchedule(supabase: SupabaseClient, state: SystemRuntimeState) {
  const schedule = state.schedule || {}
  const now = Date.now()
  const shutdownAt = typeof schedule.shutdownAt === 'string' ? Date.parse(schedule.shutdownAt) : NaN
  const resumeAt = typeof schedule.resumeAt === 'string' ? Date.parse(schedule.resumeAt) : NaN

  if (state.mode === 'normal' && Number.isFinite(shutdownAt) && shutdownAt <= now) {
    const next = await updateRuntimeState(supabase, {
      mode: 'standby',
      is_system_online: false,
      shutdown_started_at: new Date(shutdownAt).toISOString(),
      shutdown_ends_at: new Date(shutdownAt).toISOString(),
      resume_at: typeof schedule.resumeAt === 'string' ? schedule.resumeAt : state.resumeAt,
      timezone: typeof schedule.timezone === 'string' ? schedule.timezone : state.timezone,
      reason: typeof schedule.reason === 'string' ? schedule.reason : state.reason,
      last_action_by: 'system-scheduler',
      last_action_at: new Date().toISOString(),
    })
    await recordRuntimeEvent(supabase, {
      eventType: 'scheduled_shutdown_activated',
      fromMode: 'normal',
      toMode: next.mode,
      actorEmail: 'system-scheduler',
      actorRole: 'system',
      payload: { schedule },
    })
    return next
  }

  if (state.mode !== 'normal' && Number.isFinite(resumeAt) && resumeAt <= now) {
    const next = await updateRuntimeState(supabase, {
      mode: 'normal',
      is_system_online: true,
      resume_at: new Date(resumeAt).toISOString(),
      disabled_modules: {},
      last_action_by: 'system-scheduler',
      last_action_at: new Date().toISOString(),
    })
    await recordRuntimeEvent(supabase, {
      eventType: 'scheduled_restore_activated',
      fromMode: state.mode,
      toMode: next.mode,
      actorEmail: 'system-scheduler',
      actorRole: 'system',
      payload: { schedule },
    })
    return next
  }

  return state
}

export async function fetchVercelUsageSnapshot() {
  const token = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_SLUG

  if (!token || !teamId || !projectId) {
    return {
      connected: false,
      source: 'vercel',
      message: 'Vercel usage API not connected yet',
      data: null as any,
    }
  }

  const endpoint = `https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/usage?teamId=${encodeURIComponent(teamId)}`

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        connected: false,
        source: 'vercel',
        message: `Vercel usage API not connected yet (${response.status})`,
        data: null as any,
      }
    }

    const data = await response.json().catch(() => null)
    return {
      connected: true,
      source: 'vercel',
      message: 'Vercel usage API connected',
      data,
    }
  } catch {
    return {
      connected: false,
      source: 'vercel',
      message: 'Vercel usage API not connected yet',
      data: null as any,
    }
  }
}

export function buildSystemDisabledPayload(input: SafeDisabledResponseInput) {
  return {
    ok: false,
    disabled: true,
    mode: input.mode || 'standby',
    pathname: input.pathname,
    method: input.method,
    message: 'ANGELCARE system is in protected standby mode.',
    resumeAt: input.resumeAt || null,
    reason: input.reason || null,
  }
}
