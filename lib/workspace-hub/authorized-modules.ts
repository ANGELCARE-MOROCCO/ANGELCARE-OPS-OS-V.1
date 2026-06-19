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
    registryStatus: 'live_registry' | 'empty_registry' | 'registry_error' | 'fallback_generated'
    registryError?: string
  }
  warnings: string[]
}

function normalizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(input.map(String).map((item) => item.trim()).filter(Boolean))]
}

function isFullAccessUser(user: AppUserLike) {
  const role = String(user.role || '').toLowerCase()
  return ['ceo', 'admin', 'super_admin', 'owner'].includes(role)
}

function normalizeRouteFromGenerated(route: any) {
  const href = String(route?.href || route?.path || '').trim()
  if (!href || href === '#') return null

  const moduleKey = String(route?.module || route?.moduleKey || href.split('/').filter(Boolean)[0] || 'workspace')
    .trim()
    .toLowerCase()

  return {
    href,
    label: String(route?.label || route?.shortLabel || formatModuleLabel(href.split('/').filter(Boolean).pop() || moduleKey)),
    module_key: moduleKey,
    module_label: String(route?.moduleLabel || formatModuleLabel(moduleKey)),
    module_group: String(route?.moduleGroup || 'ANGELCARE Workspaces'),
    permission_key: String(route?.permissionKey || `page:${href}`),
    module_permission_key: String(route?.modulePermissionKey || `${moduleKey}.view`),
    status: 'active',
    risk_level: 'normal',
    route_type: 'page',
  }
}

async function loadGeneratedRoutesFallback() {
  try {
    const mod = await import('@/lib/generated/app-routes')
    const appRoutes = Array.isArray((mod as any).APP_ROUTES) ? (mod as any).APP_ROUTES : []
    return appRoutes.map(normalizeRouteFromGenerated).filter(Boolean)
  } catch {
    return []
  }
}

function canAccessRoute(route: any, userPermissions: string[], fullAccess: boolean) {
  if (fullAccess) return true

  const href = String(route.href || '')
  const moduleKey = String(route.module_key || route.moduleKey || '').toLowerCase()
  const permissionKey = String(route.permission_key || route.permissionKey || `page:${href}`)
  const modulePermissionKey = String(route.module_permission_key || route.modulePermissionKey || `${moduleKey}.view`)

  return (
    userPermissions.includes(permissionKey) ||
    userPermissions.includes(modulePermissionKey) ||
    userPermissions.includes(`page:${href}`) ||
    userPermissions.includes(`${moduleKey}.view`) ||
    userPermissions.some((permission) => permission.startsWith(`page:/${moduleKey}`))
  )
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

function buildModulesFromRoutes(routes: any[], userPermissions: string[], fullAccess: boolean): AuthorizedWorkspaceModule[] {
  const grouped = new Map<string, any[]>()

  for (const route of routes) {
    if (!route?.href) continue
    if (String(route.status || 'active') === 'stale') continue
    if (!canAccessRoute(route, userPermissions, fullAccess)) continue

    const moduleKey = String(route.module_key || route.moduleKey || route.href.split('/').filter(Boolean)[0] || 'workspace').toLowerCase()
    const list = grouped.get(moduleKey) || []
    list.push(route)
    grouped.set(moduleKey, list)
  }

  return [...grouped.entries()]
    .map(([moduleKey, moduleRoutes]) => {
      const sortedRoutes = moduleRoutes
        .map((route) => ({
          label: String(route.label || route.short_label || formatModuleLabel(route.href)),
          href: String(route.href),
          permissionKey: String(route.permission_key || `page:${route.href}`),
          modulePermissionKey: route.module_permission_key || `${moduleKey}.view`,
          status: route.status || 'active',
        }))
        .sort((a, b) => {
          if (a.href === `/${moduleKey}`) return -1
          if (b.href === `/${moduleKey}`) return 1
          return a.label.localeCompare(b.label)
        })

      const primary = sortedRoutes.find((route) => route.href === `/${moduleKey}`) || sortedRoutes[0]
      const moduleLabel = String(moduleRoutes[0]?.module_label || moduleRoutes[0]?.moduleLabel || formatModuleLabel(moduleKey))
      const moduleGroup = String(moduleRoutes[0]?.module_group || moduleRoutes[0]?.moduleGroup || 'ANGELCARE Workspaces')

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
  const fullAccess = isFullAccessUser(user)
  const warnings: string[] = []

  let registryBacked = false
  let fallbackUsed = false
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
        .select('id', { count: 'exact', head: true }),
    ])

    if (moduleError) {
      registryError = moduleError.message
    }

    registryModulesCount = Number(moduleCount || 0)

    if (routeError) {
      registryStatus = 'registry_error'
      registryError = routeError.message
      warnings.push('Workspace registry is synchronizing. Generated route fallback is active.')
    } else if (Array.isArray(routeData) && routeData.length > 0) {
      registryBacked = true
      registryStatus = 'live_registry'
      registryRoutes = routeData
    } else {
      registryStatus = 'empty_registry'
      warnings.push('Workspace registry is synchronizing. Generated route fallback is active.')
    }
  } catch (error) {
    registryStatus = 'registry_error'
    registryError = error instanceof Error ? error.message : 'Unknown registry read error'
    warnings.push('Workspace registry is temporarily unavailable. Generated route fallback is active.')
  }

  let routes = registryRoutes

  if (!routes.length) {
    const fallback = await loadGeneratedRoutesFallback()
    routes = fallback
    fallbackUsed = true
    if (registryStatus !== 'registry_error') registryStatus = 'fallback_generated'
  }

  const modules = buildModulesFromRoutes(routes, permissions, fullAccess)
  const authorizedPages = modules.reduce((sum, module) => sum + module.routeCount, 0)

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
      registryStatus,
      registryError,
    },
    warnings,
  }
}
