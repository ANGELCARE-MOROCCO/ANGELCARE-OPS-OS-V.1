import type { AppRoute } from '@/lib/generated/app-routes'
import { APP_ROUTES, APP_ROUTE_PERMISSIONS } from '@/lib/generated/app-routes'
import type {
  AccessGovernanceRegistrySnapshot,
  AccessGovernanceStats,
  AccessResourceRegistryRow,
  AccessRegistryVersionRow,
  AccessModuleRegistryRow,
  AccessRegistryEventRow,
  AccessRoleTemplateRow,
  AccessRouteRegistryRow,
  AccessScanRunRow,
  GovernanceUserRow,
} from './types'

type SupabaseClient = any
type RoutePermissionSource = {
  value: string
  label: string
  module: string
  moduleLabel: string
  href?: string
  shortLabel?: string
}

type RouteSource = AppRoute | RoutePermissionSource

const MODULE_GROUPS: Record<string, string> = {
  academy: 'academy',
  admin: 'administration',
  billing: 'finance',
  caregivers: 'care',
  'carelink-ops': 'operations',
  contracts: 'contracts',
  families: 'care',
  incidents: 'operations',
  interventions: 'operations',
  leads: 'growth',
  locations: 'operations',
  market_os: 'marketing',
  'market-os': 'marketing',
  missions: 'operations',
  operations: 'operations',
  pointage: 'operations',
  print: 'documents',
  profile: 'identity',
  reports: 'analytics',
  'revenue-command-center': 'revenue',
  capital_command: 'revenue',
  sales: 'sales',
  services: 'services',
  users: 'identity',
  hr: 'people',
  'voice-center': 'communications',
  voice: 'communications',
  b2b_partnerships: 'partnerships',
  staff_portal: 'people',
  dashboard: 'workspace',
}

const ACCESS_GOVERNANCE_ADMIN_ROLES = [
  'ceo', 'direction', 'admin', 'manager', 'super_admin', 'owner', 'root', 'root_admin',
  'hr_admin', 'hr_manager', 'operations_manager',
] as const
const ADMIN_ROLES = new Set<string>(ACCESS_GOVERNANCE_ADMIN_ROLES)
const VIEW_ROLES = new Set<string>(ACCESS_GOVERNANCE_ADMIN_ROLES)
const CORE_SYSTEM_MODULES = new Set(['admin', 'profile', 'users'])

function strip(value: unknown) {
  return String(value || '').trim()
}

export function normalizeRole(value: unknown) {
  return strip(value).toLowerCase().replace(/[\s-]+/g, '_')
}

export function normalizePermissionKey(value: unknown) {
  return strip(value).toLowerCase().replace(/\s+/g, '')
}

export function normalizeModuleKey(value: unknown) {
  return strip(value).toLowerCase().replace(/[\s]+/g, '_')
}

export function titleize(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getModuleGroup(moduleKey: string) {
  return MODULE_GROUPS[moduleKey] || moduleKey.split(/[_-]/)[0] || null
}

export function getRouteSegments(href: string) {
  return strip(href)
    .replace(/\/+$/, '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
}

export function getWorkspaceKey(href: string) {
  const segments = getRouteSegments(href)
  if (!segments.length) return null
  if (segments.length === 1) return segments[0]
  if (segments.length === 2) return segments[0]
  return `${segments[0]}/${segments[1]}`
}

export function getSubmoduleKey(href: string) {
  const segments = getRouteSegments(href)
  if (segments.length <= 1) return null
  if (segments.length === 2) return segments[1]
  return segments.slice(2).join('/')
}

export function getRouteType(href: string) {
  const segments = getRouteSegments(href)
  return segments.length <= 1 ? 'workspace' : 'page'
}

export function getRoutePrefix(href: string) {
  const segments = getRouteSegments(href)
  if (!segments.length) return '/'
  if (segments.length === 1) return `/${segments[0]}`
  return `/${segments.slice(0, Math.min(segments.length, 2)).join('/')}`
}

export function getAppRouteSource(): RouteSource[] {
  if (APP_ROUTES.length) return [...APP_ROUTES]
  const permissions = APP_ROUTE_PERMISSIONS as unknown as ReadonlyArray<RoutePermissionSource>
  return permissions.map((permission) => ({
    label: permission.label,
    shortLabel: permission.shortLabel || strip(permission.label).split('/').pop()?.trim() || permission.label,
    href: permission.href || String(permission.value).replace(/^page:/, ''),
    module: permission.module,
    moduleLabel: permission.moduleLabel,
    permissionKey: permission.value,
    modulePermissionKey: permission.module ? `${permission.module}.view` : null,
  })) as RouteSource[]
}

export function normalizeGeneratedRoute(route: RouteSource, sortOrder: number) {
  const href = strip(route.href)
  const moduleKey = normalizeModuleKey(route.module || getRouteSegments(href)[0] || 'workspace')
  const moduleLabel = strip(route.moduleLabel || titleize(moduleKey))
  const label = strip(route.label || route.shortLabel || href || moduleLabel || moduleKey) || moduleLabel
  const shortLabel = strip(route.shortLabel || label.split(' / ').pop() || label) || null
  const permissionKey = normalizePermissionKey('permissionKey' in route && route.permissionKey ? route.permissionKey : `page:${href}`)
  const modulePermissionKey = normalizePermissionKey('modulePermissionKey' in route && route.modulePermissionKey ? route.modulePermissionKey : `${moduleKey}.view`)

  return {
    href,
    label,
    shortLabel,
    moduleKey,
    moduleLabel,
    permissionKey,
    modulePermissionKey,
    routeType: getRouteType(href),
    workspaceKey: getWorkspaceKey(href),
    submoduleKey: getSubmoduleKey(href),
    isCoreSystem: CORE_SYSTEM_MODULES.has(moduleKey) || href.startsWith('/admin') || href.startsWith('/profile') || href.startsWith('/users'),
    isProtected: true,
    isNavigationVisible: true,
    detectedSource: 'lib/generated/app-routes.ts',
    metadata: {
      source: 'generated_app_routes',
      sortOrder,
      segments: getRouteSegments(href),
      routeDepth: getRouteSegments(href).length,
    } as Record<string, unknown>,
    sortOrder,
  }
}

export function normalizeGeneratedRoutes() {
  return getAppRouteSource().map((route, index) => normalizeGeneratedRoute(route, index))
}

export function buildModuleRegistrations(routes: ReturnType<typeof normalizeGeneratedRoutes>) {
  const grouped = new Map<string, typeof routes>()

  for (const route of routes) {
    const list = grouped.get(route.moduleKey) || []
    list.push(route)
    grouped.set(route.moduleKey, list)
  }

  return [...grouped.entries()].map(([moduleKey, moduleRoutes], index) => {
    const first = moduleRoutes[0]
    const routePrefixes = Array.from(new Set(moduleRoutes.map((route) => getRoutePrefix(route.href)))).sort((a, b) => a.localeCompare(b))
    const routeHrefs = moduleRoutes.map((route) => route.href)
    const routeLabels = moduleRoutes.map((route) => route.label)

    return {
      module_key: moduleKey,
      module_label: first.moduleLabel || titleize(moduleKey),
      module_group: getModuleGroup(moduleKey),
      parent_module_key: null,
      description: `${first.moduleLabel || titleize(moduleKey)} access surfaces detected from generated routes.`,
      icon: null,
      route_prefixes: routePrefixes,
      permission_key: first.permissionKey,
      module_permission_key: first.modulePermissionKey,
      status: 'active',
      risk_level: 'normal',
      sort_order: index,
      detected_source: 'lib/generated/app-routes.ts',
      metadata: {
        routeCount: moduleRoutes.length,
        routeHrefs,
        routeLabels,
        firstRoute: routeHrefs[0] || null,
        lastRoute: routeHrefs[routeHrefs.length - 1] || null,
      } as Record<string, unknown>,
      last_seen_at: new Date().toISOString(),
    }
  })
}

export function buildRouteRegistrations(routes: ReturnType<typeof normalizeGeneratedRoutes>) {
  return routes.map((route) => ({
    href: route.href,
    label: route.label,
    short_label: route.shortLabel,
    module_key: route.moduleKey,
    module_label: route.moduleLabel,
    parent_module_key: null,
    permission_key: route.permissionKey,
    module_permission_key: route.modulePermissionKey,
    route_type: route.routeType,
    workspace_key: route.workspaceKey,
    submodule_key: route.submoduleKey,
    status: 'active',
    is_protected: route.isProtected,
    is_core_system: route.isCoreSystem,
    is_navigation_visible: route.isNavigationVisible,
    detected_source: route.detectedSource,
    metadata: route.metadata,
    last_seen_at: new Date().toISOString(),
  }))
}

export function normalizePermissions(user: GovernanceUserRow | null | undefined) {
  return Array.from(new Set((Array.isArray(user?.permissions) ? user!.permissions : []).map((permission) => strip(permission)).filter(Boolean)))
}

export function canViewAccessGovernance(user: GovernanceUserRow | null | undefined) {
  if (!user || normalizeStatus(user.status) !== 'active') return false
  const role = normalizeRole(user.role)
  const permissions = normalizePermissions(user)
  return VIEW_ROLES.has(role) || permissions.includes('users.view') || permissions.includes('users.manage')
}

export function canManageAccessGovernance(user: GovernanceUserRow | null | undefined) {
  if (!user || normalizeStatus(user.status) !== 'active') return false
  const role = normalizeRole(user.role)
  const permissions = normalizePermissions(user)
  return ADMIN_ROLES.has(role) || permissions.includes('users.manage')
}

export function normalizeStatus(value: unknown) {
  const status = strip(value).toLowerCase()
  if (!status) return 'active'
  if (['active', 'enabled', 'available', 'actif'].includes(status)) return 'active'
  if (['inactive', 'disabled', 'suspended', 'archived', 'pending'].includes(status)) return status
  return status
}

export function isMissingRegistryTableError(error: unknown) {
  const code = strip((error as { code?: unknown })?.code)
  const message = strip((error as { message?: unknown })?.message).toLowerCase()
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(code) || message.includes('does not exist') || message.includes('could not find the table')
}

async function safeSelect<T>(supabase: SupabaseClient, table: string, columns = '*', options: { orderBy?: string; ascending?: boolean; limit?: number } = {}) {
  let query = supabase.from(table).select(columns)
  if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false })
  if (options.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) throw error
  return (data || []) as T[]
}

export async function loadAccessGovernanceRegistry(supabase: SupabaseClient): Promise<
  | { ok: true; snapshot: AccessGovernanceRegistrySnapshot }
  | { ok: false; error: string; missingMigration: boolean }
> {
  try {
    const [modules, routes, resources, templates, scans, versions] = await Promise.all([
      safeSelect<AccessModuleRegistryRow>(supabase, 'access_module_registry', '*', { orderBy: 'sort_order', ascending: true, limit: 1000 }),
      safeSelect<AccessRouteRegistryRow>(supabase, 'access_route_registry', '*', { orderBy: 'href', ascending: true, limit: 10000 }),
      safeSelect<AccessResourceRegistryRow>(supabase, 'access_resource_registry', '*', { orderBy: 'display_name', ascending: true, limit: 20000 }),
      safeSelect<AccessRoleTemplateRow>(supabase, 'access_role_templates', '*', { orderBy: 'template_key', ascending: true, limit: 500 }),
      safeSelect<AccessScanRunRow>(supabase, 'access_scan_runs', '*', { orderBy: 'created_at', ascending: false, limit: 1 }),
      safeSelect<AccessRegistryVersionRow>(supabase, 'access_registry_versions', '*', { orderBy: 'version_number', ascending: false, limit: 1 }),
    ])

    const latestScan = scans[0] || null
    const latestVersion = versions[0] || null
    const snapshot: AccessGovernanceRegistrySnapshot = {
      modules,
      routes,
      resources,
      templates,
      latestScan,
      latestVersion,
      stats: computeGovernanceStats(modules, routes, latestScan, resources),
    }

    return { ok: true, snapshot }
  } catch (error) {
    if (isMissingRegistryTableError(error)) {
      return {
        ok: false,
        missingMigration: true,
        error: 'Global access registry tables are missing. Apply the global registry migration before using this module.',
      }
    }

    return {
      ok: false,
      missingMigration: false,
      error: error instanceof Error ? error.message : 'Unable to load access governance registry.',
    }
  }
}

export function computeGovernanceStats(
  modules: AccessModuleRegistryRow[],
  routes: AccessRouteRegistryRow[],
  latestScan: AccessScanRunRow | null,
  resources: AccessResourceRegistryRow[] = [],
): AccessGovernanceStats {
  return {
    totalModules: modules.length,
    totalRoutes: routes.length,
    totalResources: resources.length,
    totalFamilies: resources.filter((resource) => resource.resource_type === 'route_family').length,
    totalGroups: resources.filter((resource) => ['route_group', 'module_workspace'].includes(resource.resource_type)).length,
    totalStandaloneRoutes: resources.filter((resource) => resource.resource_type === 'standalone_route').length,
    activeRoutes: routes.filter((route) => route.status === 'active').length,
    activeResources: resources.filter((resource) => resource.status === 'active').length,
    staleRoutes: routes.filter((route) => ['stale', 'missing'].includes(route.status)).length,
    missingResources: resources.filter((resource) => resource.status === 'missing').length,
    newRoutesSinceLastScan: latestScan?.new_routes || 0,
    latestScanAt: latestScan?.created_at || null,
  }
}

export async function loadAccessGovernanceEvents(supabase: SupabaseClient) {
  try {
    const [events, scans] = await Promise.all([
      safeSelect<AccessRegistryEventRow>(supabase, 'access_registry_events', '*', { orderBy: 'created_at', ascending: false, limit: 100 }),
      safeSelect<AccessScanRunRow>(supabase, 'access_scan_runs', '*', { orderBy: 'created_at', ascending: false, limit: 20 }),
    ])

    return { ok: true as const, events, scans }
  } catch (error) {
    if (isMissingRegistryTableError(error)) {
      return { ok: false as const, error: 'Global access registry tables are missing. Apply the global registry migration before using this module.', missingMigration: true }
    }
    return { ok: false as const, error: error instanceof Error ? error.message : 'Unable to load registry events.', missingMigration: false }
  }
}

export function summarizePermissionCoverage(routes: AccessRouteRegistryRow[], permissions: string[]) {
  const permissionSet = new Set(permissions.map((permission) => strip(permission)).filter(Boolean))
  const assignedRoutes = routes.filter((route) => route.status === 'active' && (permissionSet.has('*') || permissionSet.has(route.permission_key) || permissionSet.has(route.module_permission_key || '')))
  const assignedModules = new Map<string, { moduleKey: string; moduleLabel: string | null; routeCount: number; permissionKey: string | null; modulePermissionKey: string | null }>()

  for (const route of assignedRoutes) {
    const current = assignedModules.get(route.module_key) || {
      moduleKey: route.module_key,
      moduleLabel: route.module_label || null,
      routeCount: 0,
      permissionKey: route.permission_key,
      modulePermissionKey: route.module_permission_key,
    }
    current.routeCount += 1
    assignedModules.set(route.module_key, current)
  }

  return {
    assignedRoutes,
    assignedModules: [...assignedModules.values()],
  }
}

export function routePermissionMatches(permissions: string[], route: AccessRouteRegistryRow) {
  const permissionSet = new Set(permissions.map((permission) => strip(permission)).filter(Boolean))
  const ancestorPermissionKeys = Array.isArray(route.metadata?.ancestorPermissionKeys)
    ? route.metadata.ancestorPermissionKeys.map((permission) => strip(permission)).filter(Boolean)
    : []
  return permissionSet.has('*')
    || permissionSet.has(route.permission_key)
    || permissionSet.has(route.module_permission_key || '')
    || ancestorPermissionKeys.some((permission) => permissionSet.has(permission))
}

export function getKnownRegistryPermissionKeys(routes: AccessRouteRegistryRow[]) {
  const keys = new Set<string>(['*'])
  routes.forEach((route) => {
    keys.add(route.permission_key)
    if (route.module_permission_key) keys.add(route.module_permission_key)
  })
  return keys
}
