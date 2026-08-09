import { createClient } from '@/lib/supabase/server'
import { getWorkspaceIconKey, formatModuleLabel } from '@/lib/workspace-hub/module-icons'

type AppUserLike = {
  id?: string | null
  full_name?: string | null
  fullName?: string | null
  username?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
  department?: string | null
  permissions?: string[] | null
  profile_photo_path?: string | null
  updated_at?: string | null
}

export type AuthorizedWorkspaceRoute = {
  label: string
  href: string
  permissionKey: string
  modulePermissionKey?: string | null
  status?: string | null
}

export type AuthorizedWorkspaceModule = {
  moduleKey: string
  moduleLabel: string
  moduleGroup: string
  description: string
  iconKey: string
  primaryHref: string
  routeCount: number
  permissionCount: number
  status: string
  riskLevel: string
  routes: AuthorizedWorkspaceRoute[]
}

export type AuthorizedWorkspaceHubData = {
  user: {
    id: string | null
    name: string
    username: string
    email: string
    role: string
    status: string
    department: string
    permissionCount: number
    fullAccess: boolean
    photoUrl: string | null
  }
  modules: AuthorizedWorkspaceModule[]
  stats: {
    authorizedModules: number
    authorizedPages: number
    permissionCount: number
    registryBacked: boolean
    fallbackUsed: boolean
    registryRoutes: number
    registryModules: number
    generatedRoutes: number
    mergedRoutes: number
    registryMissingRoutes: number
    unmatchedPermissions: number
    registryStatus: 'live_registry' | 'empty_registry' | 'registry_error' | 'fallback_generated'
    registryError?: string
  }
  warnings: string[]
}

const FULL_ACCESS_ROLES = new Set([
  'ceo', 'direction', 'super_admin', 'owner', 'root', 'root_admin',
])

const DASHBOARD_EXCLUDED_ROOTS = new Set([
  'api', 'login', 'auth', 'unauthorized', 'system-offline', 'offline', 'health',
  'favicon.ico', '_not-found', 'not-found', 'privacy', 'terms', 'public', 'print',
  'academy-print', 'verify',
])

function normalizePermission(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

function normalizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(input.map(normalizePermission).filter(Boolean))]
}

function normalizeRole(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function isFullAccessUser(user: AppUserLike) {
  const role = normalizeRole(user.role)
  const permissions = normalizePermissions(user.permissions)
  return FULL_ACCESS_ROLES.has(role) || permissions.includes('*')
}

function rootSegment(href: string) {
  return String(href || '').split('?')[0].split('#')[0].split('/').filter(Boolean)[0]?.toLowerCase() || ''
}

function normalizedDashboardModuleKey(value: unknown, href: string) {
  const raw = String(value || rootSegment(href) || 'workspace').trim().toLowerCase()
  return raw.replace(/^family__/, '').replace(/^standalone__/, '') || 'workspace'
}

function isDashboardRoute(route: any) {
  const href = String(route?.href || '').trim()
  if (!href || href === '#' || href === '/') return false
  return !DASHBOARD_EXCLUDED_ROOTS.has(rootSegment(href))
}

function normalizeRouteFromGenerated(route: any) {
  const href = String(route?.href || route?.path || '').trim()
  if (!href || href === '#') return null

  const moduleKey = normalizedDashboardModuleKey(route?.module || route?.moduleKey, href)

  return {
    href,
    label: String(route?.label || route?.shortLabel || formatModuleLabel(href.split('/').filter(Boolean).pop() || moduleKey)),
    short_label: String(route?.shortLabel || route?.label || formatModuleLabel(href)),
    module_key: moduleKey,
    module_label: String(route?.moduleLabel || formatModuleLabel(moduleKey)),
    module_group: String(route?.moduleGroup || 'ANGELCARE Workspaces'),
    permission_key: normalizePermission(route?.permissionKey || route?.value || `page:${href}`),
    module_permission_key: normalizePermission(route?.modulePermissionKey || `${moduleKey}.view`),
    status: 'active',
    risk_level: 'normal',
    route_type: route?.routeType || 'page',
    metadata: { ...(route?.metadata || {}), source: 'generated_app_routes' },
    detected_source: 'lib/generated/app-routes.ts',
  }
}

async function loadGeneratedRoutes() {
  try {
    const mod = await import('@/lib/generated/app-routes')
    const appRoutes = Array.isArray((mod as any).APP_ROUTES) ? (mod as any).APP_ROUTES : []
    return appRoutes.map(normalizeRouteFromGenerated).filter(Boolean).filter(isDashboardRoute)
  } catch {
    return []
  }
}

function mergeRouteUniverse(registryRoutes: any[], generatedRoutes: any[]) {
  const routesByHref = new Map<string, any>()

  for (const route of generatedRoutes) {
    if (!isDashboardRoute(route)) continue
    routesByHref.set(String(route.href), route)
  }

  for (const registryRoute of registryRoutes) {
    if (!isDashboardRoute(registryRoute)) continue
    const href = String(registryRoute.href)
    const generated = routesByHref.get(href) || {}
    const moduleKey = normalizedDashboardModuleKey(registryRoute.module_key || generated.module_key, href)
    routesByHref.set(href, {
      ...generated,
      ...registryRoute,
      module_key: moduleKey,
      module_label: registryRoute.module_label || generated.module_label || formatModuleLabel(moduleKey),
      module_group: registryRoute.module_group || generated.module_group || 'ANGELCARE Workspaces',
      permission_key: normalizePermission(registryRoute.permission_key || generated.permission_key || `page:${href}`),
      module_permission_key: normalizePermission(registryRoute.module_permission_key || generated.module_permission_key || `${moduleKey}.view`),
      status: registryRoute.status || generated.status || 'active',
      metadata: { ...(generated.metadata || {}), ...(registryRoute.metadata || {}), registryBacked: true },
    })
  }

  return [...routesByHref.values()]
}

function permissionCandidates(route: any) {
  const href = String(route.href || '')
  const moduleKey = normalizedDashboardModuleKey(route.module_key || route.moduleKey, href)
  const metadata = route?.metadata && typeof route.metadata === 'object' ? route.metadata : {}
  const ancestorPermissionKeys = Array.isArray(metadata.ancestorPermissionKeys) ? metadata.ancestorPermissionKeys : []

  return new Set([
    normalizePermission(route.permission_key || route.permissionKey || `page:${href}`),
    normalizePermission(route.module_permission_key || route.modulePermissionKey || `${moduleKey}.view`),
    normalizePermission(`page:${href}`),
    normalizePermission(`${moduleKey}.view`),
    normalizePermission(`resource:family:${moduleKey}`),
    ...ancestorPermissionKeys.map(normalizePermission),
  ].filter(Boolean))
}

function canAccessRoute(route: any, userPermissions: Set<string>, fullAccess: boolean) {
  if (fullAccess) return true
  for (const candidate of permissionCandidates(route)) {
    if (userPermissions.has(candidate)) return true
  }
  return false
}

function moduleDescription(moduleKey: string, routeCount: number) {
  if (moduleKey.includes('pacojaco')) return 'Invoices, quotations, clients, PDF dispatch and commercial document operations.'
  if (moduleKey.includes('carelink')) return 'Operational dispatch, missions, caregivers and field service lifecycle.'
  if (moduleKey.includes('users')) return 'User accounts, roles, permissions and access governance.'
  if (moduleKey.includes('ceo') || moduleKey.includes('system-control')) return 'Executive runtime control, telemetry, policies and system protection.'
  if (moduleKey.includes('hr')) return 'Human resources operations, staff records and workforce workflows.'
  if (moduleKey.includes('academy')) return 'Training, academy programs, trainees and education operations.'
  if (moduleKey.includes('email')) return 'Corporate mailboxes, messaging, outbound and inbound communication.'
  if (moduleKey.includes('b2b')) return 'B2B partnerships, prospects, proposals and strategic accounts.'
  if (moduleKey.includes('sales')) return 'Sales operations, pipeline, quotes, orders and commercial control.'
  if (moduleKey.includes('revenue')) return 'Revenue control, payments, deals and financial monitoring.'
  return `${routeCount} authorized workspace page${routeCount === 1 ? '' : 's'} available.`
}

function buildModulesFromRoutes(routes: any[], userPermissions: Set<string>, fullAccess: boolean): AuthorizedWorkspaceModule[] {
  const grouped = new Map<string, any[]>()

  for (const route of routes) {
    if (!route?.href || !isDashboardRoute(route)) continue
    if (String(route.status || 'active') === 'stale') continue
    if (!canAccessRoute(route, userPermissions, fullAccess)) continue

    const moduleKey = normalizedDashboardModuleKey(route.module_key || route.moduleKey, route.href)
    const list = grouped.get(moduleKey) || []
    if (!list.some((item) => String(item.href) === String(route.href))) list.push(route)
    grouped.set(moduleKey, list)
  }

  return [...grouped.entries()]
    .map(([moduleKey, moduleRoutes]) => {
      const sortedRoutes = moduleRoutes
        .map((route) => ({
          label: String(route.label || route.short_label || formatModuleLabel(route.href)),
          href: String(route.href),
          permissionKey: normalizePermission(route.permission_key || `page:${route.href}`),
          modulePermissionKey: normalizePermission(route.module_permission_key || `${moduleKey}.view`),
          status: route.status || 'active',
        }))
        .sort((a, b) => {
          if (a.href === `/${moduleKey}`) return -1
          if (b.href === `/${moduleKey}`) return 1
          return a.label.localeCompare(b.label)
        })

      const primary = sortedRoutes.find((route) => route.href === `/${moduleKey}`) || sortedRoutes[0]
      const moduleLabel = String(moduleRoutes.find((route) => route.module_label)?.module_label || formatModuleLabel(moduleKey))
      const moduleGroup = String(moduleRoutes.find((route) => route.module_group)?.module_group || 'ANGELCARE Workspaces')

      return {
        moduleKey,
        moduleLabel,
        moduleGroup,
        description: moduleDescription(moduleKey, sortedRoutes.length),
        iconKey: getWorkspaceIconKey(moduleKey),
        primaryHref: primary?.href || '#',
        routeCount: sortedRoutes.length,
        permissionCount: new Set(sortedRoutes.map((route) => route.permissionKey)).size,
        status: String(moduleRoutes[0]?.status || 'active'),
        riskLevel: String(moduleRoutes[0]?.risk_level || moduleRoutes[0]?.riskLevel || 'normal'),
        routes: sortedRoutes,
      }
    })
    .sort((a, b) => {
      if (a.moduleKey === 'ceo-system-control') return -1
      if (b.moduleKey === 'ceo-system-control') return 1
      return a.moduleLabel.localeCompare(b.moduleLabel)
    })
}

export async function loadAuthorizedWorkspaceHub(user: AppUserLike): Promise<AuthorizedWorkspaceHubData> {
  const supabase = await createClient()
  const permissions = normalizePermissions(user.permissions)
  const permissionSet = new Set(permissions)
  const fullAccess = isFullAccessUser(user)
  const warnings: string[] = []

  let registryBacked = false
  let registryRoutes: any[] = []
  let registryModulesCount = 0
  let registryStatus: AuthorizedWorkspaceHubData['stats']['registryStatus'] = 'empty_registry'
  let registryError: string | undefined

  try {
    const [{ data: routeData, error: routeError }, { count: moduleCount, error: moduleError }] = await Promise.all([
      supabase
        .from('access_route_registry')
        .select('href,label,short_label,module_key,module_label,module_permission_key,permission_key,status,route_type,metadata,last_seen_at')
        .neq('status', 'stale')
        .order('module_key', { ascending: true })
        .order('href', { ascending: true }),
      supabase
        .from('access_module_registry')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'stale'),
    ])

    if (moduleError) registryError = moduleError.message
    registryModulesCount = Number(moduleCount || 0)

    if (routeError) {
      registryStatus = 'registry_error'
      registryError = routeError.message
      warnings.push('The live access registry could not be read. The complete generated route catalogue is protecting dashboard coverage.')
    } else if (Array.isArray(routeData) && routeData.length > 0) {
      registryBacked = true
      registryStatus = 'live_registry'
      registryRoutes = routeData
    } else {
      registryStatus = 'empty_registry'
      warnings.push('The live access registry is empty. The complete generated route catalogue is active until a scan is published.')
    }
  } catch (error) {
    registryStatus = 'registry_error'
    registryError = error instanceof Error ? error.message : 'Unknown registry read error'
    warnings.push('The live access registry is unavailable. The complete generated route catalogue is protecting dashboard coverage.')
  }

  const generatedRoutes = await loadGeneratedRoutes()
  const registryHrefs = new Set(registryRoutes.map((route) => String(route.href)))
  const registryMissingRoutes = generatedRoutes.filter((route: any) => !registryHrefs.has(String(route.href))).length
  const routes = mergeRouteUniverse(registryRoutes, generatedRoutes)
  const fallbackUsed = !registryRoutes.length || registryMissingRoutes > 0

  if (registryBacked && registryMissingRoutes > 0) {
    warnings.push(`${registryMissingRoutes} generated application routes are not yet present in the published registry. They have been merged safely so authorized dashboard cards remain complete.`)
  }

  const modules = buildModulesFromRoutes(routes, permissionSet, fullAccess)
  const authorizedPages = modules.reduce((sum, module) => sum + module.routeCount, 0)
  const matchedPermissions = new Set<string>()
  for (const route of routes) {
    if (!canAccessRoute(route, permissionSet, false)) continue
    for (const candidate of permissionCandidates(route)) {
      if (permissionSet.has(candidate)) matchedPermissions.add(candidate)
    }
  }
  const unmatchedPermissions = permissions.filter((permission) => permission !== '*' && !matchedPermissions.has(permission)).length

  if (unmatchedPermissions > 0) {
    warnings.push(`${unmatchedPermissions} assigned permission keys do not currently resolve to a dashboard route. They remain preserved for actions, APIs, legacy access, or future registry publication.`)
  }

  return {
    user: {
      id: user.id ? String(user.id) : null,
      name: String(user.full_name || user.fullName || user.username || 'ANGELCARE user'),
      username: String(user.username || ''),
      email: String(user.email || ''),
      role: String(user.role || 'user'),
      status: String(user.status || 'active'),
      department: String(user.department || ''),
      permissionCount: permissions.length,
      fullAccess,
      photoUrl:
        user.profile_photo_path && user.id
          ? `/api/users/${encodeURIComponent(String(user.id))}/profile-photo?v=${encodeURIComponent(String(user.updated_at || '1'))}`
          : null,
    },
    modules,
    stats: {
      authorizedModules: modules.length,
      authorizedPages,
      permissionCount: permissions.length,
      registryBacked,
      fallbackUsed,
      registryRoutes: registryRoutes.length,
      registryModules: registryModulesCount,
      generatedRoutes: generatedRoutes.length,
      mergedRoutes: routes.length,
      registryMissingRoutes,
      unmatchedPermissions,
      registryStatus: registryRoutes.length ? registryStatus : generatedRoutes.length ? 'fallback_generated' : registryStatus,
      registryError,
    },
    warnings,
  }
}
