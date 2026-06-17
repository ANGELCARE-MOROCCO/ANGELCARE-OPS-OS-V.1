import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'
import { safeRefreshInterval } from '@/lib/runtime/client-live-governor'
import {
  isMissingRelationError,
  isPublicSystemPath,
  isStaticAssetPath,
  isSystemControlPath,
  isSystemRuntimeAuthorizedActor,
  loadRuntimeState,
  type RuntimeActor,
  type SystemRuntimeState,
} from './runtime'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SYSTEM_MODULE_REGISTRY_TABLE = 'system_module_registry'
export const SYSTEM_RUNTIME_POLICY_TABLE = 'system_runtime_policies'
export const SYSTEM_ROUTE_REGISTRY_TABLE = 'system_route_registry'
export const SYSTEM_SCAN_RESULTS_TABLE = 'system_scan_results'
export const SYSTEM_POLICY_EVENTS_TABLE = 'system_policy_events'

export type ModuleRegistryRow = {
  id: string
  module_key: string
  module_name: string
  module_group: string | null
  description: string | null
  route_prefixes: string[] | null
  api_prefixes: string[] | null
  owner_role: string | null
  status: string | null
  risk_level: string | null
  cost_sensitivity: string | null
  is_core_system: boolean | null
  is_allowed_in_standby: boolean | null
  detected_source: string | null
  last_seen_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type RuntimePolicyRow = {
  id: string
  module_key: string
  auto_refresh_enabled: boolean | null
  live_polling_enabled: boolean | null
  heavy_sync_enabled: boolean | null
  min_refresh_interval_ms: number | null
  max_refresh_interval_ms: number | null
  jitter_enabled: boolean | null
  standby_behavior: string | null
  emergency_behavior: string | null
  allowed_during_standby: boolean | null
  manual_override_enabled: boolean | null
  schedule: Record<string, unknown> | null
  policy_payload: Record<string, unknown> | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type RouteRegistryRow = {
  id: string
  module_key: string | null
  route_path: string
  route_type: string | null
  method: string | null
  is_api: boolean | null
  is_heavy: boolean | null
  is_live_sync: boolean | null
  is_allowed_in_standby: boolean | null
  risk_level: string | null
  detected_from: string | null
  last_seen_at: string | null
  created_at: string | null
}

export type ScanResultRow = {
  id: string
  scan_type: string | null
  status: string | null
  modules_detected: number | null
  routes_detected: number | null
  api_routes_detected: number | null
  polling_sources_detected: number | null
  high_risk_items: number | null
  payload: Record<string, unknown> | null
  created_by: string | null
  created_at: string | null
}

export type PolicyEventRow = {
  id: string
  event_type: string | null
  module_key: string | null
  route_path: string | null
  actor_email: string | null
  before_payload: Record<string, unknown> | null
  after_payload: Record<string, unknown> | null
  message: string | null
  created_at: string | null
}

export type ModuleCatalogEntry = {
  module: ModuleRegistryRow
  policy: RuntimePolicyRow
}

export type RouteClassification = {
  id?: string
  moduleKey: string | null
  moduleName: string
  routePath: string
  routeType: string
  method: string | null
  isApi: boolean
  isHeavy: boolean
  isLiveSync: boolean
  isAllowedInStandby: boolean
  riskLevel: string
  detectedFrom: string
  lastSeenAt: string
}

type ScanCandidate = {
  filePath: string
  routePath: string | null
  moduleKey: string | null
  fileType: string
  riskLevel: string
  signals: string[]
}

const DEFAULT_MODULES: Array<Pick<ModuleRegistryRow,
  'module_key' | 'module_name' | 'module_group' | 'description' | 'route_prefixes' | 'api_prefixes' | 'owner_role' | 'status' | 'risk_level' | 'cost_sensitivity' | 'is_core_system' | 'is_allowed_in_standby' | 'detected_source'
>> = [
  {
    module_key: 'ceo-system-control',
    module_name: 'CEO System Control',
    module_group: 'CEO',
    description: 'Executive runtime command tower and protected standby governance.',
    route_prefixes: ['/ceo/system-control'],
    api_prefixes: ['/api/system-control'],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'critical',
    cost_sensitivity: 'high',
    is_core_system: true,
    is_allowed_in_standby: true,
    detected_source: 'seed',
  },
  {
    module_key: 'carelink_ops',
    module_name: 'CareLink Ops',
    module_group: 'CareLink',
    description: 'Operational dispatch and protected care workflow control.',
    route_prefixes: ['/carelink-ops'],
    api_prefixes: ['/api/carelink-ops'],
    owner_role: 'ops',
    status: 'active',
    risk_level: 'high',
    cost_sensitivity: 'medium',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'carelink_mobile',
    module_name: 'CareLink Mobile',
    module_group: 'CareLink',
    description: 'Mobile clinical workflows and caregiver-facing experiences.',
    route_prefixes: ['/carelink'],
    api_prefixes: ['/api/carelink'],
    owner_role: 'ops',
    status: 'active',
    risk_level: 'high',
    cost_sensitivity: 'medium',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'email_os',
    module_name: 'Email-OS',
    module_group: 'Operations',
    description: 'Executive mail and command workflows.',
    route_prefixes: ['/email-os'],
    api_prefixes: ['/api/email-os'],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'critical',
    cost_sensitivity: 'high',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'voice',
    module_name: 'Voice',
    module_group: 'Operations',
    description: 'Voice workflow and call orchestration surfaces.',
    route_prefixes: ['/voice'],
    api_prefixes: ['/api/voice'],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'critical',
    cost_sensitivity: 'high',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'connect',
    module_name: 'Connect',
    module_group: 'Operations',
    description: 'Realtime communications and collaboration surface.',
    route_prefixes: ['/connect'],
    api_prefixes: ['/api/connect'],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'high',
    cost_sensitivity: 'medium',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'hr',
    module_name: 'HR',
    module_group: 'Operations',
    description: 'Human resources execution and workforce governance.',
    route_prefixes: ['/hr'],
    api_prefixes: ['/api/hr'],
    owner_role: 'admin',
    status: 'active',
    risk_level: 'medium',
    cost_sensitivity: 'medium',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'b2b',
    module_name: 'B2B',
    module_group: 'Commercial',
    description: 'Business development and partnership operations.',
    route_prefixes: ['/b2b-partnerships'],
    api_prefixes: ['/api/b2b-partnerships'],
    owner_role: 'admin',
    status: 'active',
    risk_level: 'medium',
    cost_sensitivity: 'medium',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
  {
    module_key: 'revenue',
    module_name: 'Revenue',
    module_group: 'Commercial',
    description: 'Revenue command and commercial operations.',
    route_prefixes: ['/revenue-command-center'],
    api_prefixes: ['/api/revenue-command-center'],
    owner_role: 'ceo',
    status: 'active',
    risk_level: 'critical',
    cost_sensitivity: 'high',
    is_core_system: false,
    is_allowed_in_standby: false,
    detected_source: 'seed',
  },
]

const DEFAULT_POLICY = {
  auto_refresh_enabled: true,
  live_polling_enabled: true,
  heavy_sync_enabled: true,
  min_refresh_interval_ms: 300_000,
  max_refresh_interval_ms: 600_000,
  jitter_enabled: true,
  standby_behavior: 'disable_non_core',
  emergency_behavior: 'block',
  allowed_during_standby: false,
  manual_override_enabled: true,
  schedule: {} as Record<string, unknown>,
  policy_payload: {} as Record<string, unknown>,
}

const SCANNABLE_ROOTS = ['app', 'components', 'lib']
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const MAX_SCAN_FILE_BYTES = 512_000
const MAX_SCAN_FILES = 1500

function titleize(key: string) {
  return key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePathname(value: string) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function uniq(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && String(value).trim())).map((value) => String(value).trim()))]
}

function normalizeScanType(scanType: string) {
  const normalized = String(scanType || '').trim().toLowerCase()
  if (normalized === 'quick' || normalized === 'quick_scan') return 'quick'
  if (normalized === 'full' || normalized === 'full_scan') return 'full'
  if (normalized === 'deep' || normalized === 'deep_scan') return 'deep'
  return 'local_app_scan'
}

function inferModuleKeyFromPath(routePath: string | null, filePath: string) {
  const normalizedRoute = routePath ? normalizePathname(routePath) : ''
  if (normalizedRoute === '/ceo/system-control') return 'ceo-system-control'
  if (normalizedRoute.startsWith('/api/system-control')) return 'ceo-system-control'
  if (normalizedRoute.startsWith('/api/')) {
    const parts = normalizedRoute.replace(/^\/api\//, '').split('/').filter(Boolean)
    return parts[0] ? parts[0].replace(/[^a-z0-9_-]/gi, '-').toLowerCase() : 'api'
  }

  const relative = filePath.replace(/\\/g, '/')
  const segments = relative.split('/')
  const appIndex = segments.indexOf('app')
  if (appIndex >= 0 && segments[appIndex + 1]) {
    const root = segments[appIndex + 1]
    if (root.startsWith('(') && segments[appIndex + 2]) return segments[appIndex + 2].replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
    return root.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  }
  const componentsIndex = segments.indexOf('components')
  if (componentsIndex >= 0 && segments[componentsIndex + 1]) return segments[componentsIndex + 1].replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  const libIndex = segments.indexOf('lib')
  if (libIndex >= 0 && segments[libIndex + 1]) return segments[libIndex + 1].replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  return null
}

function inferRoutePathFromFile(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/')
  const appPrefix = '/app/'
  const appIndex = normalized.indexOf(appPrefix)
  if (appIndex < 0) return null

  const relative = normalized.slice(appIndex + appPrefix.length)
  if (!relative) return null

  if (relative.endsWith('/page.tsx') || relative.endsWith('/page.ts') || relative.endsWith('/page.jsx') || relative.endsWith('/page.js')) {
    const route = relative.replace(/\/page\.(?:tsx|ts|jsx|js)$/, '')
    return normalizePathname(route.replace(/\/index$/, ''))
  }

  if (relative.endsWith('/route.ts') || relative.endsWith('/route.tsx') || relative.endsWith('/route.js') || relative.endsWith('/route.jsx')) {
    return normalizePathname(relative.replace(/\/route\.(?:tsx|ts|jsx|js)$/, ''))
  }

  return null
}

function detectRouteSignals(routePath: string, content: string) {
  const signals: string[] = []
  if (/setInterval\s*\(/.test(content)) signals.push('setInterval')
  if (/safeRefreshInterval/.test(content)) signals.push('safeRefreshInterval')
  if (/shouldStartAutoRefresh/.test(content)) signals.push('shouldStartAutoRefresh')
  if (/fetch\s*\(/.test(content) && /no-store/.test(content)) signals.push('fetch-no-store')
  if (/fetch\s*\(/.test(content) && /cache\s*:\s*['"]no-store['"]/.test(content)) signals.push('fetch-cache-no-store')
  if (/crypto\.randomUUID\s*\(/.test(content)) signals.push('crypto.randomUUID')
  if (routePath.includes('/api/')) signals.push('api-route')
  return signals
}

function inferRiskLevel(routePath: string, fileContent: string, filePath: string) {
  const lower = `${routePath} ${filePath} ${fileContent}`.toLowerCase()
  if (lower.includes('/api/system-control') || lower.includes('emergency_lock') || lower.includes('shutdown_now')) return 'critical'
  if (lower.includes('setinterval') || lower.includes('safeRefreshInterval'.toLowerCase()) || lower.includes('shouldstartautorefresh')) return 'high'
  if (lower.includes('fetch(') && lower.includes('no-store')) return 'high'
  if (lower.includes('poll') || lower.includes('realtime') || lower.includes('sync')) return 'medium'
  return 'normal'
}

function inferRouteType(routePath: string, filePath: string) {
  if (routePath.startsWith('/api/')) return 'api'
  if (filePath.endsWith('/page.tsx') || filePath.endsWith('/page.ts') || filePath.endsWith('/page.jsx') || filePath.endsWith('/page.js')) return 'page'
  if (filePath.endsWith('/layout.tsx') || filePath.endsWith('/layout.ts') || filePath.endsWith('/layout.jsx') || filePath.endsWith('/layout.js')) return 'layout'
  return 'file'
}

function inferModuleGroup(moduleKey: string | null) {
  if (!moduleKey) return null
  if (moduleKey === 'ceo-system-control') return 'CEO'
  if (moduleKey.startsWith('carelink')) return 'CareLink'
  if (['email-os', 'voice', 'connect'].includes(moduleKey)) return 'Operations'
  if (['hr', 'b2b', 'revenue'].includes(moduleKey)) return 'Commercial'
  return titleize(moduleKey)
}

function defaultModuleRegistryRow(module: typeof DEFAULT_MODULES[number]): ModuleRegistryRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    module_key: module.module_key,
    module_name: module.module_name,
    module_group: module.module_group,
    description: module.description,
    route_prefixes: module.route_prefixes || [],
    api_prefixes: module.api_prefixes || [],
    owner_role: module.owner_role,
    status: module.status,
    risk_level: module.risk_level,
    cost_sensitivity: module.cost_sensitivity,
    is_core_system: module.is_core_system,
    is_allowed_in_standby: module.is_allowed_in_standby,
    detected_source: module.detected_source,
    last_seen_at: now,
    created_at: now,
    updated_at: now,
  }
}

function defaultPolicyRow(moduleKey: string, isCoreSystem = false): RuntimePolicyRow {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    module_key: moduleKey,
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: true,
    min_refresh_interval_ms: isCoreSystem ? 60_000 : DEFAULT_POLICY.min_refresh_interval_ms,
    max_refresh_interval_ms: isCoreSystem ? 300_000 : DEFAULT_POLICY.max_refresh_interval_ms,
    jitter_enabled: true,
    standby_behavior: isCoreSystem ? 'allow' : DEFAULT_POLICY.standby_behavior,
    emergency_behavior: DEFAULT_POLICY.emergency_behavior,
    allowed_during_standby: isCoreSystem,
    manual_override_enabled: true,
    schedule: {},
    policy_payload: {},
    updated_by: null,
    created_at: now,
    updated_at: now,
  }
}

function normalizeModuleRow(row: Partial<ModuleRegistryRow> | null | undefined): ModuleRegistryRow {
  const base = defaultModuleRegistryRow(DEFAULT_MODULES[0])
  const now = new Date().toISOString()
  return {
    id: String(row?.id || crypto.randomUUID()),
    module_key: String(row?.module_key || base.module_key),
    module_name: String(row?.module_name || base.module_name),
    module_group: typeof row?.module_group === 'string' ? row.module_group : base.module_group,
    description: typeof row?.description === 'string' ? row.description : base.description,
    route_prefixes: Array.isArray(row?.route_prefixes) ? row.route_prefixes.map(String) : [],
    api_prefixes: Array.isArray(row?.api_prefixes) ? row.api_prefixes.map(String) : [],
    owner_role: typeof row?.owner_role === 'string' ? row.owner_role : base.owner_role,
    status: typeof row?.status === 'string' ? row.status : base.status,
    risk_level: typeof row?.risk_level === 'string' ? row.risk_level : base.risk_level,
    cost_sensitivity: typeof row?.cost_sensitivity === 'string' ? row.cost_sensitivity : base.cost_sensitivity,
    is_core_system: Boolean(row?.is_core_system ?? base.is_core_system),
    is_allowed_in_standby: Boolean(row?.is_allowed_in_standby ?? base.is_allowed_in_standby),
    detected_source: typeof row?.detected_source === 'string' ? row.detected_source : base.detected_source,
    last_seen_at: typeof row?.last_seen_at === 'string' ? row.last_seen_at : now,
    created_at: typeof row?.created_at === 'string' ? row.created_at : now,
    updated_at: typeof row?.updated_at === 'string' ? row.updated_at : now,
  }
}

function normalizePolicyRow(row: Partial<RuntimePolicyRow> | null | undefined, moduleKey: string, isCoreSystem = false): RuntimePolicyRow {
  const base = defaultPolicyRow(moduleKey, isCoreSystem)
  const schedule = row?.schedule && typeof row.schedule === 'object' && !Array.isArray(row.schedule) ? row.schedule : base.schedule
  const policyPayload = row?.policy_payload && typeof row.policy_payload === 'object' && !Array.isArray(row.policy_payload) ? row.policy_payload : base.policy_payload
  return {
    id: String(row?.id || base.id),
    module_key: String(row?.module_key || moduleKey),
    auto_refresh_enabled: Boolean(row?.auto_refresh_enabled ?? base.auto_refresh_enabled),
    live_polling_enabled: Boolean(row?.live_polling_enabled ?? base.live_polling_enabled),
    heavy_sync_enabled: Boolean(row?.heavy_sync_enabled ?? base.heavy_sync_enabled),
    min_refresh_interval_ms: Number.isFinite(Number(row?.min_refresh_interval_ms)) ? Number(row?.min_refresh_interval_ms) : base.min_refresh_interval_ms,
    max_refresh_interval_ms: Number.isFinite(Number(row?.max_refresh_interval_ms)) ? Number(row?.max_refresh_interval_ms) : base.max_refresh_interval_ms,
    jitter_enabled: Boolean(row?.jitter_enabled ?? base.jitter_enabled),
    standby_behavior: String(row?.standby_behavior || base.standby_behavior),
    emergency_behavior: String(row?.emergency_behavior || base.emergency_behavior),
    allowed_during_standby: Boolean(row?.allowed_during_standby ?? base.allowed_during_standby),
    manual_override_enabled: Boolean(row?.manual_override_enabled ?? base.manual_override_enabled),
    schedule,
    policy_payload: policyPayload,
    updated_by: typeof row?.updated_by === 'string' ? row.updated_by : base.updated_by,
    created_at: typeof row?.created_at === 'string' ? row.created_at : base.created_at,
    updated_at: typeof row?.updated_at === 'string' ? row.updated_at : base.updated_at,
  }
}

function normalizeRouteRow(row: Partial<RouteRegistryRow> | null | undefined): RouteRegistryRow {
  const routePath = normalizePathname(row?.route_path || '/')
  const moduleKey = row?.module_key ? String(row.module_key) : inferModuleKeyFromPath(routePath, routePath)
  const routeType = String(row?.route_type || (routePath.startsWith('/api/') ? 'api' : 'page'))
  const isApi = Boolean(row?.is_api ?? routePath.startsWith('/api/'))
  const isHeavy = Boolean(row?.is_heavy ?? /setinterval|poll|realtime|sync|fetch-no-store/i.test(`${row?.risk_level || ''} ${row?.detected_from || ''}`))
  const isLiveSync = Boolean(row?.is_live_sync ?? /realtime|sync/i.test(`${row?.route_type || ''} ${routePath}`))
  const isAllowedInStandby = Boolean(
    row?.is_allowed_in_standby ?? (routePath.startsWith('/ceo/system-control') || routePath.startsWith('/api/system-control')),
  )
  const riskLevel = String(row?.risk_level || 'normal')
  return {
    id: String(row?.id || crypto.randomUUID()),
    module_key: moduleKey ? String(moduleKey) : null,
    route_path: routePath,
    route_type: routeType,
    method: typeof row?.method === 'string' ? row.method : null,
    is_api: isApi,
    is_heavy: isHeavy,
    is_live_sync: isLiveSync,
    is_allowed_in_standby: isAllowedInStandby,
    risk_level: riskLevel,
    detected_from: typeof row?.detected_from === 'string' ? row.detected_from : 'heuristic',
    last_seen_at: typeof row?.last_seen_at === 'string' ? row.last_seen_at : new Date().toISOString(),
    created_at: typeof row?.created_at === 'string' ? row.created_at : new Date().toISOString(),
  }
}

function buildPolicyPayload(policy: RuntimePolicyRow, module: ModuleRegistryRow) {
  return {
    auto_refresh_enabled: policy.auto_refresh_enabled,
    live_polling_enabled: policy.live_polling_enabled,
    heavy_sync_enabled: policy.heavy_sync_enabled,
    min_refresh_interval_ms: policy.min_refresh_interval_ms,
    max_refresh_interval_ms: policy.max_refresh_interval_ms,
    jitter_enabled: policy.jitter_enabled,
    standby_behavior: policy.standby_behavior,
    emergency_behavior: policy.emergency_behavior,
    allowed_during_standby: policy.allowed_during_standby,
    manual_override_enabled: policy.manual_override_enabled,
    module_group: module.module_group,
    risk_level: module.risk_level,
    cost_sensitivity: module.cost_sensitivity,
    is_core_system: module.is_core_system,
    is_allowed_in_standby: module.is_allowed_in_standby,
  }
}

async function safeTableSelect<T>(supabase: SupabaseClient, table: string, query: (builder: any) => Promise<{ data: T[] | null; error: any }>) {
  try {
    const result = await query(supabase.from(table))
    if (result.error) {
      if (isMissingRelationError(result.error)) return { data: [] as T[], connected: false }
      throw result.error
    }
    return { data: (result.data || []) as T[], connected: true }
  } catch (error) {
    if (isMissingRelationError(error)) return { data: [] as T[], connected: false }
    throw error
  }
}

function buildDefaultCatalog() {
  const modules = DEFAULT_MODULES.map((module) => {
    const moduleRow = defaultModuleRegistryRow(module)
    const policyRow = defaultPolicyRow(module.module_key, Boolean(module.is_core_system))
    return { module: moduleRow, policy: policyRow }
  })
  return {
    connected: false,
    modules,
  }
}

export async function getRegisteredModules(supabase?: SupabaseClient) {
  if (!supabase) return buildDefaultCatalog()

  const [modulesResult, policiesResult] = await Promise.all([
    safeTableSelect<ModuleRegistryRow>(supabase, SYSTEM_MODULE_REGISTRY_TABLE, (builder) => builder.select('*').order('last_seen_at', { ascending: false })),
    safeTableSelect<RuntimePolicyRow>(supabase, SYSTEM_RUNTIME_POLICY_TABLE, (builder) => builder.select('*').order('updated_at', { ascending: false })),
  ])

  const registry = modulesResult.data.length ? modulesResult.data.map((row) => normalizeModuleRow(row)) : DEFAULT_MODULES.map((module) => defaultModuleRegistryRow(module))
  const policies = policiesResult.data.length ? policiesResult.data.map((row) => normalizePolicyRow(row, String(row.module_key || ''), String(row.module_key || '') === 'ceo-system-control')) : []
  const policyMap = new Map(policies.map((policy) => [policy.module_key, policy]))

  const modules = uniq([
    ...registry.map((row) => row.module_key),
    ...DEFAULT_MODULES.map((row) => row.module_key),
  ]).map((moduleKey) => {
    const module = registry.find((row) => row.module_key === moduleKey) || defaultModuleRegistryRow(DEFAULT_MODULES.find((item) => item.module_key === moduleKey) || DEFAULT_MODULES[0])
    const policy = policyMap.get(moduleKey) || defaultPolicyRow(moduleKey, Boolean(module.is_core_system))
    return { module, policy }
  })

  return {
    connected: modulesResult.connected && policiesResult.connected,
    modules,
  }
}

export async function getModuleRuntimePolicy(moduleKey: string, supabase?: SupabaseClient) {
  const key = String(moduleKey || '').trim().toLowerCase()
  if (!key) return defaultPolicyRow('unknown')
  if (!supabase) return defaultPolicyRow(key, key === 'ceo-system-control')

  const { data, error } = await supabase
    .from(SYSTEM_RUNTIME_POLICY_TABLE)
    .select('*')
    .eq('module_key', key)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return defaultPolicyRow(key, key === 'ceo-system-control')
    throw error
  }

  return normalizePolicyRow(data as RuntimePolicyRow | null, key, key === 'ceo-system-control')
}

export async function shouldModuleAutoRefresh(moduleKey: string, supabase?: SupabaseClient) {
  const policy = await getModuleRuntimePolicy(moduleKey, supabase)
  return Boolean(policy.auto_refresh_enabled && policy.live_polling_enabled)
}

export async function getModuleSafeRefreshInterval(moduleKey: string, requestedMs: number, supabase?: SupabaseClient) {
  const policy = await getModuleRuntimePolicy(moduleKey, supabase)
  const module = (await getRegisteredModules(supabase)).modules.find((entry) => entry.module.module_key === policy.module_key)?.module
    || defaultModuleRegistryRow(DEFAULT_MODULES.find((item) => item.module_key === policy.module_key) || DEFAULT_MODULES[0])

  const requested = Number.isFinite(requestedMs) ? requestedMs : policy.min_refresh_interval_ms || 300_000
  const min = Math.max(policy.min_refresh_interval_ms || 60_000, module.is_core_system ? 60_000 : 60_000)
  const max = Math.max(policy.max_refresh_interval_ms || min, min)
  const clamped = Math.max(min, Math.min(max, requested))

  if (!policy.jitter_enabled) return clamped
  const jitterMax = Math.max(0, Math.min(max - min, 30_000))
  return Math.max(min, Math.min(max, clamped + Math.floor(Math.random() * (jitterMax + 1))))
}

export async function getRouteRuntimeClassification(pathname: string, supabase?: SupabaseClient): Promise<RouteClassification> {
  const routePath = normalizePathname(pathname)
  const now = new Date().toISOString()

  if (isStaticAssetPath(routePath) || isPublicSystemPath(routePath) || isSystemControlPath(routePath)) {
    const moduleKey = routePath.startsWith('/ceo/system-control') || routePath.startsWith('/api/system-control') ? 'ceo-system-control' : inferModuleKeyFromPath(routePath, routePath)
    return {
      moduleKey,
      moduleName: moduleKey ? titleize(moduleKey) : 'System',
      routePath,
      routeType: routePath.startsWith('/api/') ? 'api' : 'page',
      method: routePath.startsWith('/api/') ? 'GET' : null,
      isApi: routePath.startsWith('/api/'),
      isHeavy: false,
      isLiveSync: false,
      isAllowedInStandby: true,
      riskLevel: 'normal',
      detectedFrom: 'core-path',
      lastSeenAt: now,
    }
  }

  if (supabase) {
    const { data, error } = await supabase
      .from(SYSTEM_ROUTE_REGISTRY_TABLE)
      .select('*')
      .eq('route_path', routePath)
      .maybeSingle()

    if (!error && data) {
      const row = normalizeRouteRow(data as RouteRegistryRow)
      return {
        id: row.id,
        moduleKey: row.module_key,
        moduleName: row.module_key ? titleize(row.module_key) : 'Unknown',
        routePath: row.route_path,
        routeType: row.route_type || 'page',
        method: row.method,
        isApi: Boolean(row.is_api),
        isHeavy: Boolean(row.is_heavy),
        isLiveSync: Boolean(row.is_live_sync),
        isAllowedInStandby: Boolean(row.is_allowed_in_standby),
        riskLevel: row.risk_level || 'normal',
        detectedFrom: row.detected_from || 'registry',
        lastSeenAt: row.last_seen_at || now,
      }
    }
  }

  const moduleKey = inferModuleKeyFromPath(routePath, routePath)
  const isApi = routePath.startsWith('/api/')
  const signals = detectRouteSignals(routePath, routePath)
  const riskLevel = inferRiskLevel(routePath, routePath, routePath)
  return {
    moduleKey,
    moduleName: moduleKey ? titleize(moduleKey) : 'Unknown',
    routePath,
    routeType: isApi ? 'api' : 'page',
    method: isApi ? 'GET' : null,
    isApi,
    isHeavy: signals.includes('setInterval') || signals.includes('fetch-no-store') || signals.includes('fetch-cache-no-store'),
    isLiveSync: signals.includes('safeRefreshInterval') || signals.includes('shouldStartAutoRefresh'),
    isAllowedInStandby: routePath.startsWith('/ceo/system-control') || routePath.startsWith('/api/system-control') || routePath.startsWith('/login') || routePath.startsWith('/auth'),
    riskLevel,
    detectedFrom: 'heuristic',
    lastSeenAt: now,
  }
}

export async function isRouteAllowedByRuntime(pathname: string, user: RuntimeActor | null, state?: SystemRuntimeState | null, supabase?: SupabaseClient) {
  const routePath = normalizePathname(pathname)

  if (isStaticAssetPath(routePath) || isPublicSystemPath(routePath) || isSystemControlPath(routePath)) return true
  if (routePath.startsWith('/api/auth')) return true

  const runtimeState = state || (supabase ? await loadRuntimeState(supabase) : null)
  const classification = await getRouteRuntimeClassification(routePath, supabase)

  if (!runtimeState) return true
  if (runtimeState.mode === 'normal') return true
  if (classification.isAllowedInStandby) return true
  if (user && isSystemRuntimeAuthorizedActor(user, runtimeState) && classification.moduleKey === 'ceo-system-control') return true
  if (user && isSystemRuntimeAuthorizedActor(user, runtimeState) && routePath.startsWith('/api/system-control')) return true

  return false
}

function extractRouteFromFile(filePath: string) {
  const routePath = inferRoutePathFromFile(filePath)
  if (!routePath) return null
  return normalizePathname(routePath)
}

async function readScanFile(filePath: string) {
  try {
    const fileStats = await stat(filePath)
    if (!fileStats.isFile() || fileStats.size > MAX_SCAN_FILE_BYTES) return null
    const content = await readFile(filePath, 'utf8')
    return content
  } catch {
    return null
  }
}

async function walkDirectory(root: string, relative = '', files: string[] = [], limit = MAX_SCAN_FILES) {
  if (files.length >= limit) return files
  const currentDir = path.join(root, relative)
  let entries: Array<import('fs').Dirent>
  try {
    entries = await readdir(currentDir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    if (files.length >= limit) break
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') continue
    const nextRelative = path.join(relative, entry.name)
    const nextAbsolute = path.join(root, nextRelative)
    if (entry.isDirectory()) {
      await walkDirectory(root, nextRelative, files, limit)
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!SCAN_EXTENSIONS.has(ext)) continue
    try {
      const stats = await stat(nextAbsolute)
      if (stats.size <= MAX_SCAN_FILE_BYTES) files.push(nextAbsolute)
    } catch {
      continue
    }
  }

  return files
}

function buildModuleSummary(modules: Map<string, {
  module_key: string
  module_name: string
  module_group: string | null
  description: string | null
  route_prefixes: string[]
  api_prefixes: string[]
  owner_role: string | null
  status: string | null
  risk_level: string | null
  cost_sensitivity: string | null
  is_core_system: boolean
  is_allowed_in_standby: boolean
  detected_source: string
  last_seen_at: string
}>) {
  return [...modules.values()].sort((a, b) => a.module_key.localeCompare(b.module_key))
}

function buildRouteSummary(routes: Map<string, RouteRegistryRow>) {
  return [...routes.values()].sort((a, b) => a.route_path.localeCompare(b.route_path))
}

export async function runLocalAppScan(supabase?: SupabaseClient, actor?: RuntimeActor | null, scanType = 'local_app_scan') {
  const root = process.cwd()
  const normalizedScanType = normalizeScanType(scanType)
  const directories = [...SCANNABLE_ROOTS]
  const availableRoots: string[] = []

  for (const directory of directories) {
    try {
      const stats = await stat(path.join(root, directory))
      if (stats.isDirectory()) availableRoots.push(path.join(root, directory))
    } catch {
      continue
    }
  }

  if (!availableRoots.length) {
    return {
      connected: false,
      limited: true,
      message: 'Runtime scan limited in production. Use build-time registry or manual module registration.',
      scan: null,
      modules: [],
      routes: [],
      candidates: [],
    }
  }

  const files = new Set<string>()
  for (const directory of availableRoots) {
    const rel = path.relative(root, directory)
    const walked = await walkDirectory(root, rel)
    for (const file of walked) files.add(file)
  }

  const moduleMap = new Map<string, {
    module_key: string
    module_name: string
    module_group: string | null
    description: string | null
    route_prefixes: string[]
    api_prefixes: string[]
    owner_role: string | null
    status: string | null
    risk_level: string | null
    cost_sensitivity: string | null
    is_core_system: boolean
    is_allowed_in_standby: boolean
    detected_source: string
    last_seen_at: string
  }>()
  const routeMap = new Map<string, RouteRegistryRow>()
  const candidates: ScanCandidate[] = []
  const now = new Date().toISOString()
  let pollingSourcesDetected = 0
  let highRiskItems = 0

  for (const filePath of files) {
    const content = await readScanFile(filePath)
    if (content == null) continue

    const routePath = extractRouteFromFile(filePath)
    const moduleKey = inferModuleKeyFromPath(routePath, filePath) || 'misc'
    const moduleName = titleize(moduleKey)
    const routeType = routePath ? inferRouteType(routePath, filePath) : 'file'
    const signals = routePath ? detectRouteSignals(routePath, content) : detectRouteSignals(filePath, content)
    const riskLevel = routePath ? inferRiskLevel(routePath, content, filePath) : inferRiskLevel(filePath, content, filePath)
    const isApi = Boolean(routePath?.startsWith('/api/'))
    const isHeavy = signals.includes('setInterval') || signals.includes('fetch-no-store') || signals.includes('fetch-cache-no-store') || riskLevel === 'critical' || riskLevel === 'high'
    const isLiveSync = signals.includes('safeRefreshInterval') || signals.includes('shouldStartAutoRefresh')
    const isAllowedInStandby = Boolean(routePath && (routePath.startsWith('/ceo/system-control') || routePath.startsWith('/api/system-control') || routePath.startsWith('/login') || routePath.startsWith('/auth')))

    if (signals.includes('setInterval') || signals.includes('safeRefreshInterval') || signals.includes('shouldStartAutoRefresh')) pollingSourcesDetected += 1
    if (riskLevel === 'critical' || riskLevel === 'high') highRiskItems += 1

    if (moduleKey) {
      const existing = moduleMap.get(moduleKey)
      moduleMap.set(moduleKey, {
        module_key: moduleKey,
        module_name: existing?.module_name || moduleName,
        module_group: existing?.module_group || inferModuleGroup(moduleKey),
        description: existing?.description || `Discovered from ${path.relative(root, filePath)}`,
        route_prefixes: uniq([...(existing?.route_prefixes || []), routePath ? path.posix.dirname(routePath) : null]),
        api_prefixes: uniq([...(existing?.api_prefixes || []), isApi && routePath ? path.posix.dirname(routePath) : null]),
        owner_role: existing?.owner_role || (moduleKey === 'ceo-system-control' ? 'ceo' : 'admin'),
        status: existing?.status || 'active',
        risk_level: existing?.risk_level || riskLevel,
        cost_sensitivity: existing?.cost_sensitivity || (riskLevel === 'critical' ? 'high' : riskLevel === 'high' ? 'medium' : 'medium'),
        is_core_system: existing?.is_core_system || moduleKey === 'ceo-system-control',
        is_allowed_in_standby: existing?.is_allowed_in_standby || moduleKey === 'ceo-system-control',
        detected_source: 'scan:file',
        last_seen_at: now,
      })
    }

    if (routePath) {
      routeMap.set(routePath, {
        id: crypto.randomUUID(),
        module_key: moduleKey,
        route_path: routePath,
        route_type: routeType,
        method: isApi ? 'GET' : null,
        is_api: isApi,
        is_heavy: isHeavy,
        is_live_sync: isLiveSync,
        is_allowed_in_standby: isAllowedInStandby,
        risk_level: riskLevel,
        detected_from: path.relative(root, filePath),
        last_seen_at: now,
        created_at: now,
      })
    }

    if (signals.length || isHeavy) {
      candidates.push({
        filePath: path.relative(root, filePath),
        routePath,
        moduleKey,
        fileType: routeType,
        riskLevel,
        signals,
      })
    }
  }

  const modules = buildModuleSummary(moduleMap)
  const routes = buildRouteSummary(routeMap)
  const scanResult = {
    scan_type: normalizedScanType,
    status: 'completed',
    modules_detected: modules.length,
    routes_detected: routes.length,
    api_routes_detected: routes.filter((route) => route.is_api).length,
    polling_sources_detected: pollingSourcesDetected,
    high_risk_items: highRiskItems,
    payload: {
      scanType,
      normalizedScanType,
      modules,
      routes,
      candidates,
      roots: availableRoots.map((rootPath) => path.relative(root, rootPath) || '.'),
      analysisType: 'rule-based',
      mode: 'runtime',
    },
    created_by: actor?.email || null,
  }

  if (!supabase) {
    return {
      connected: false,
      limited: false,
      message: 'Local scan available. Runtime scan completed locally without registry persistence.',
      scan: scanResult,
      modules,
      routes,
      candidates,
    }
  }

  let connected = true
  let limited = false
  try {
    const moduleRows = modules.map((entry) => ({
      module_key: entry.module_key,
      module_name: entry.module_name,
      module_group: entry.module_group,
      description: entry.description,
      route_prefixes: entry.route_prefixes,
      api_prefixes: entry.api_prefixes,
      owner_role: entry.owner_role,
      status: entry.status,
      risk_level: entry.risk_level,
      cost_sensitivity: entry.cost_sensitivity,
      is_core_system: entry.is_core_system,
      is_allowed_in_standby: entry.is_allowed_in_standby,
      detected_source: entry.detected_source,
      last_seen_at: entry.last_seen_at,
      updated_at: now,
    }))

    const routeRows = routes.map((entry) => ({
      module_key: entry.module_key,
      route_path: entry.route_path,
      route_type: entry.route_type,
      method: entry.method,
      is_api: entry.is_api,
      is_heavy: entry.is_heavy,
      is_live_sync: entry.is_live_sync,
      is_allowed_in_standby: entry.is_allowed_in_standby,
      risk_level: entry.risk_level,
      detected_from: entry.detected_from,
      last_seen_at: entry.last_seen_at,
      created_at: entry.created_at,
    }))

    const moduleResponse = moduleRows.length
      ? await supabase.from(SYSTEM_MODULE_REGISTRY_TABLE).upsert(moduleRows, { onConflict: 'module_key' }).select('*')
      : { error: null }
    if (moduleResponse.error && !isMissingRelationError(moduleResponse.error)) throw moduleResponse.error

    const routeResponse = routeRows.length
      ? await supabase.from(SYSTEM_ROUTE_REGISTRY_TABLE).upsert(routeRows, { onConflict: 'route_path' }).select('*')
      : { error: null }
    if (routeResponse.error && !isMissingRelationError(routeResponse.error)) throw routeResponse.error

    const scanInsert = await supabase.from(SYSTEM_SCAN_RESULTS_TABLE).insert([scanResult]).select('*').single()
    if (scanInsert.error && !isMissingRelationError(scanInsert.error)) throw scanInsert.error

    const eventInsert = await supabase.from(SYSTEM_POLICY_EVENTS_TABLE).insert([{
      event_type: 'runtime_scan_completed',
      module_key: null,
      route_path: null,
      actor_email: actor?.email || null,
      before_payload: {},
      after_payload: scanResult.payload,
      message: `Completed ${scanType} with ${scanResult.modules_detected} modules and ${scanResult.routes_detected} routes.`,
    }])
    if (eventInsert.error && !isMissingRelationError(eventInsert.error)) throw eventInsert.error
  } catch (error) {
    if (isMissingRelationError(error)) {
      connected = false
      limited = true
    } else {
      throw error
    }
  }

  return {
    connected,
    limited,
    message: connected
      ? 'Scan completed.'
      : 'Runtime scan limited in production. Use build-time registry or manual module registration.',
    scan: scanResult,
    modules,
    routes,
    candidates,
  }
}

export async function loadLatestScanResult(supabase?: SupabaseClient) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(SYSTEM_SCAN_RESULTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }

  return (data as ScanResultRow | null) || null
}

export async function loadRouteRegistry(supabase?: SupabaseClient) {
  if (!supabase) {
    return { connected: false, routes: [] as RouteRegistryRow[] }
  }

  const { data, error } = await supabase
    .from(SYSTEM_ROUTE_REGISTRY_TABLE)
    .select('*')
    .order('last_seen_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return { connected: false, routes: [] as RouteRegistryRow[] }
    throw error
  }

  return {
    connected: true,
    routes: (data || []).map((row) => normalizeRouteRow(row as RouteRegistryRow)),
  }
}

export async function loadPolicyEvents(supabase?: SupabaseClient, limit = 100) {
  if (!supabase) return { connected: false, events: [] as PolicyEventRow[] }
  const { data, error } = await supabase
    .from(SYSTEM_POLICY_EVENTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (isMissingRelationError(error)) return { connected: false, events: [] as PolicyEventRow[] }
    throw error
  }

  return {
    connected: true,
    events: (data || []) as PolicyEventRow[],
  }
}

export async function loadModuleScanAndPolicyCatalog(supabase?: SupabaseClient) {
  const modules = await getRegisteredModules(supabase)
  const scan = await loadLatestScanResult(supabase)
  const routes = await loadRouteRegistry(supabase)
  const policyEvents = await loadPolicyEvents(supabase, 50)

  return {
    modules,
    scan,
    routes,
    policyEvents,
  }
}

export function buildModulePolicyPayload(module: ModuleRegistryRow, policy: RuntimePolicyRow) {
  return buildPolicyPayload(policy, module)
}

export function inferModuleName(moduleKey: string) {
  return titleize(moduleKey)
}
