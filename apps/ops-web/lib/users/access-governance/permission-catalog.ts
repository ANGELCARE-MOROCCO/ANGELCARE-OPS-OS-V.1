import { MODULE_PERMISSIONS } from '@/lib/auth/permissions'
import { normalizeGeneratedRoutes, titleize, loadAccessGovernanceRegistry } from './registry'
import type { AccessModuleRegistryRow, AccessRouteRegistryRow, AccessScanRunRow } from './types'

type SupabaseClient = any

export type PermissionCatalogSourceFlags = {
  registry: boolean
  staticPermissions: boolean
  generatedRoutes: boolean
}

export type PermissionCatalogPermissionType = 'module' | 'route' | 'action' | 'legacy'
export type PermissionCatalogPermissionSource = 'Registry' | 'Generated' | 'Legacy'

export type PermissionCatalogPermission = {
  key: string
  label: string
  type: PermissionCatalogPermissionType
  href: string | null
  moduleKey: string
  moduleLabel: string
  status: string
  source: PermissionCatalogPermissionSource
  modulePermissionKey: string | null
  routeType: string | null
  riskLevel: string | null
  permissionKey: string
  stale: boolean
  isNew: boolean
}

export type PermissionCatalogModule = {
  moduleKey: string
  moduleLabel: string
  moduleGroup: string | null
  status: string
  riskLevel: string
  modulePermissionKey: string | null
  permissionKey: string | null
  routeCount: number
  permissions: PermissionCatalogPermission[]
}

export type PermissionCatalogResponse = {
  ok: true
  source: PermissionCatalogSourceFlags
  latestScan: AccessScanRunRow | null
  modules: PermissionCatalogModule[]
  flatPermissions: PermissionCatalogPermission[]
  message?: string
}

type CatalogItemInput = {
  key: string
  label: string
  moduleKey: string
  moduleLabel: string
  moduleGroup?: string | null
  status: string
  riskLevel: string | null
  source: PermissionCatalogPermissionSource
  type?: PermissionCatalogPermissionType
  href?: string | null
  modulePermissionKey?: string | null
  routeType?: string | null
  permissionKey?: string
  stale?: boolean
  isNew?: boolean
}

function strip(value: unknown) {
  return String(value || '').trim()
}

function normalizeModuleKey(value: unknown) {
  return strip(value).toLowerCase().replace(/[\s]+/g, '_')
}

function normalizePermissionKey(value: unknown) {
  return strip(value).toLowerCase().replace(/\s+/g, '')
}

function normalizeSourceName(value: PermissionCatalogPermissionSource) {
  return value
}

function formatPermissionLabel(permissionKey: string) {
  if (permissionKey.startsWith('page:/')) {
    return permissionKey.replace(/^page:\//, '/')
  }
  return permissionKey.replaceAll('.', ' / ').replaceAll('_', ' ')
}

function moduleGroupFor(moduleKey: string, registryModule?: AccessModuleRegistryRow | null) {
  if (registryModule?.module_group) return registryModule.module_group
  return moduleKey.split(/[_-]/)[0] || null
}

function latestScanMeta(latestScan: AccessScanRunRow | null) {
  const payload = (latestScan?.payload || {}) as Record<string, unknown>
  const newRoutes = new Set((Array.isArray(payload.newRoutes) ? payload.newRoutes : []).map((value) => normalizePermissionKey(value)))
  const staleRoutes = new Set((Array.isArray(payload.staleRoutes) ? payload.staleRoutes : []).map((value) => normalizePermissionKey(value)))
  const newModules = new Set((Array.isArray(payload.newModules) ? payload.newModules : []).map((value) => normalizeModuleKey(value)))
  const staleModules = new Set((Array.isArray(payload.staleModules) ? payload.staleModules : []).map((value) => normalizeModuleKey(value)))
  return { payload, newRoutes, staleRoutes, newModules, staleModules }
}

function makePermissionType(source: PermissionCatalogPermissionSource, key: string, modulePermissionKey: string | null): PermissionCatalogPermissionType {
  if (key.startsWith('page:/')) return 'route'
  if (source === 'Generated') return 'route'
  if (key === modulePermissionKey || key.endsWith('.view')) return 'module'
  return source === 'Legacy' ? 'legacy' : 'action'
}

function upsertPermission(
  permissions: Map<string, PermissionCatalogPermission>,
  input: CatalogItemInput,
  priority: number,
) {
  const key = normalizePermissionKey(input.key)
  if (!key) return

  const current = permissions.get(key)
  const next: PermissionCatalogPermission = {
    key,
    label: input.label || formatPermissionLabel(key),
    type: input.type || makePermissionType(input.source, key, input.modulePermissionKey || null),
    href: input.href ?? null,
    moduleKey: input.moduleKey,
    moduleLabel: input.moduleLabel,
    status: input.status,
    source: input.source,
    modulePermissionKey: input.modulePermissionKey || null,
    routeType: input.routeType || null,
    riskLevel: input.riskLevel || null,
    permissionKey: input.permissionKey || key,
    stale: Boolean(input.stale),
    isNew: Boolean(input.isNew),
  }

  if (!current || (current as any).__priority <= priority) {
    permissions.set(key, { ...(current || {}), ...next, __priority: priority } as PermissionCatalogPermission & { __priority?: number })
    return
  }

  const merged = {
    ...current,
    label: current.label || next.label,
    href: current.href || next.href,
    moduleLabel: current.moduleLabel || next.moduleLabel,
    modulePermissionKey: current.modulePermissionKey || next.modulePermissionKey,
    routeType: current.routeType || next.routeType,
    riskLevel: current.riskLevel || next.riskLevel,
    status: current.status || next.status,
    stale: current.stale || next.stale,
    isNew: current.isNew || next.isNew,
  }
  permissions.set(key, { ...merged, __priority: (current as any).__priority || priority } as PermissionCatalogPermission & { __priority?: number })
}

function attachModule(
  modules: Map<string, PermissionCatalogModule>,
  permission: PermissionCatalogPermission,
  registryModule?: AccessModuleRegistryRow | null,
) {
  const key = permission.moduleKey
  const current = modules.get(key)

  if (!current) {
    modules.set(key, {
      moduleKey: key,
      moduleLabel: permission.moduleLabel || registryModule?.module_label || titleize(key),
      moduleGroup: moduleGroupFor(key, registryModule),
      status: registryModule?.status || permission.status || 'active',
      riskLevel: registryModule?.risk_level || permission.riskLevel || 'normal',
      modulePermissionKey: registryModule?.module_permission_key || permission.modulePermissionKey || null,
      permissionKey: registryModule?.permission_key || permission.permissionKey || null,
      routeCount: permission.type === 'route' ? 1 : 0,
      permissions: [permission],
    })
    return
  }

  current.moduleLabel = current.moduleLabel || permission.moduleLabel || registryModule?.module_label || titleize(key)
  current.moduleGroup = current.moduleGroup || moduleGroupFor(key, registryModule)
  current.status = registryModule?.status || current.status || permission.status || 'active'
  current.riskLevel = registryModule?.risk_level || current.riskLevel || permission.riskLevel || 'normal'
  current.modulePermissionKey = current.modulePermissionKey || registryModule?.module_permission_key || permission.modulePermissionKey || null
  current.permissionKey = current.permissionKey || registryModule?.permission_key || permission.permissionKey || null
  current.routeCount += permission.type === 'route' ? 1 : 0
  if (!current.permissions.some((item) => item.key === permission.key)) {
    current.permissions.push(permission)
  }
}

function registryRoutePermission(route: AccessRouteRegistryRow, meta: ReturnType<typeof latestScanMeta>) {
  const permissionKey = normalizePermissionKey(route.permission_key)
  return {
    key: permissionKey,
    label: strip(route.label) || formatPermissionLabel(permissionKey),
    type: 'route' as const,
    href: strip(route.href) || null,
    moduleKey: normalizeModuleKey(route.module_key),
    moduleLabel: strip(route.module_label || titleize(route.module_key)),
    status: strip(route.status) || 'active',
    source: normalizeSourceName('Registry' as const),
    modulePermissionKey: route.module_permission_key ? normalizePermissionKey(route.module_permission_key) : null,
    routeType: strip(route.route_type) || null,
    riskLevel: null,
    permissionKey,
    stale: route.status === 'stale' || meta.staleRoutes.has(permissionKey) || meta.staleRoutes.has(normalizePermissionKey(route.href)),
    isNew: meta.newRoutes.has(permissionKey) || meta.newRoutes.has(normalizePermissionKey(route.href)),
  }
}

function registryModulePermission(module: AccessModuleRegistryRow, meta: ReturnType<typeof latestScanMeta>) {
  const permissionKey = normalizePermissionKey(module.module_permission_key || module.permission_key || `${module.module_key}.view`)
  const isNew = meta.newModules.has(normalizeModuleKey(module.module_key))
  return {
    key: permissionKey,
    label: `${strip(module.module_label || titleize(module.module_key))} access`,
    type: 'module' as const,
    href: null,
    moduleKey: normalizeModuleKey(module.module_key),
    moduleLabel: strip(module.module_label || titleize(module.module_key)),
    status: strip(module.status) || 'active',
    source: normalizeSourceName('Registry' as const),
    modulePermissionKey: permissionKey,
    routeType: null,
    riskLevel: strip(module.risk_level) || 'normal',
    permissionKey,
    stale: module.status === 'stale' || meta.staleModules.has(normalizeModuleKey(module.module_key)),
    isNew,
  }
}

function generatedRoutePermission(route: ReturnType<typeof normalizeGeneratedRoutes>[number], meta: ReturnType<typeof latestScanMeta>) {
  const permissionKey = normalizePermissionKey(route.permissionKey)
  return {
    key: permissionKey,
    label: strip(route.label) || formatPermissionLabel(permissionKey),
    type: 'route' as const,
    href: strip(route.href) || null,
    moduleKey: normalizeModuleKey(route.moduleKey),
    moduleLabel: strip(route.moduleLabel || titleize(route.moduleKey)),
    status: 'active',
    source: normalizeSourceName('Generated' as const),
    modulePermissionKey: route.modulePermissionKey ? normalizePermissionKey(route.modulePermissionKey) : null,
    routeType: strip(route.routeType) || null,
    riskLevel: 'normal',
    permissionKey,
    stale: false,
    isNew: meta.newRoutes.has(permissionKey) || meta.newRoutes.has(normalizePermissionKey(route.href)),
  }
}

function staticModulePermission(moduleKey: string, permissionKey: string) {
  const normalizedModuleKey = normalizeModuleKey(moduleKey)
  const normalizedPermissionKey = normalizePermissionKey(permissionKey)
  return {
    key: normalizedPermissionKey,
    label: formatPermissionLabel(normalizedPermissionKey),
    type: normalizedPermissionKey.endsWith('.view') ? ('module' as const) : ('legacy' as const),
    href: null,
    moduleKey: normalizedModuleKey,
    moduleLabel: titleize(normalizedModuleKey),
    status: 'legacy',
    source: normalizeSourceName('Legacy' as const),
    modulePermissionKey: `${normalizedModuleKey}.view`,
    routeType: null,
    riskLevel: 'normal',
    permissionKey: normalizedPermissionKey,
    stale: false,
    isNew: false,
  }
}

export async function loadPermissionCatalog(supabase: SupabaseClient): Promise<PermissionCatalogResponse> {
  const registryResult = await loadAccessGovernanceRegistry(supabase)
  const registryModules = registryResult.ok ? registryResult.snapshot.modules : []
  const registryRoutes = registryResult.ok ? registryResult.snapshot.routes : []
  const latestScan = registryResult.ok ? registryResult.snapshot.latestScan : null
  const meta = latestScanMeta(latestScan)

  const permissionMap = new Map<string, PermissionCatalogPermission & { __priority?: number }>()
  const moduleMap = new Map<string, PermissionCatalogModule>()

  const hasRegistryRows = registryModules.length > 0 || registryRoutes.length > 0
  const source: PermissionCatalogSourceFlags = {
    registry: hasRegistryRows,
    staticPermissions: Object.keys(MODULE_PERMISSIONS).length > 0,
    generatedRoutes: normalizeGeneratedRoutes().length > 0,
  }

  const registryModuleMap = new Map(registryModules.map((module) => [normalizeModuleKey(module.module_key), module]))

  if (hasRegistryRows) {
    for (const module of registryModules) {
      const moduleKey = normalizeModuleKey(module.module_key)
      const permissions = registryRoutes
        .filter((route) => normalizeModuleKey(route.module_key) === moduleKey)
        .map((route) => registryRoutePermission(route, meta))

      const modulePermission = registryModulePermission(module, meta)
      upsertPermission(permissionMap, modulePermission, 3)
      attachModule(moduleMap, modulePermission, module)

      for (const permission of permissions) {
        upsertPermission(permissionMap, permission, 3)
        attachModule(moduleMap, permission, module)
      }
    }

    for (const route of registryRoutes) {
      const permission = registryRoutePermission(route, meta)
      upsertPermission(permissionMap, permission, 3)
      attachModule(moduleMap, permission, registryModuleMap.get(normalizeModuleKey(route.module_key)) || null)
    }
  }

  const generatedRoutes = normalizeGeneratedRoutes()
  for (const route of generatedRoutes) {
    const permission = generatedRoutePermission(route as any, meta)
    upsertPermission(permissionMap, permission, hasRegistryRows ? 2 : 3)
    attachModule(moduleMap, permission, registryModuleMap.get(normalizeModuleKey(route.moduleKey)) || null)
  }

  for (const [moduleKey, permissions] of Object.entries(MODULE_PERMISSIONS)) {
    const registryModule = registryModuleMap.get(normalizeModuleKey(moduleKey)) || null
    for (const permissionKey of permissions) {
      const permission = staticModulePermission(moduleKey, permissionKey)
      upsertPermission(permissionMap, permission, hasRegistryRows ? 1 : 2)
      attachModule(moduleMap, permission, registryModule)
    }
  }

  const modules = [...moduleMap.values()].map((module) => {
    const permissions = module.permissions
      .filter((permission, index, list) => list.findIndex((item) => item.key === permission.key) === index)
      .sort((a, b) => {
        const order = { module: 0, route: 1, action: 2, legacy: 3 } as const
        return (order[a.type] - order[b.type]) || a.label.localeCompare(b.label)
      })

    const routeCount = permissions.filter((permission) => permission.type === 'route').length
    const representative = permissions.find((permission) => permission.type === 'module') || permissions[0] || null
    const registryModule = registryModuleMap.get(module.moduleKey) || null

    return {
      ...module,
      moduleLabel: module.moduleLabel || registryModule?.module_label || titleize(module.moduleKey),
      moduleGroup: module.moduleGroup || moduleGroupFor(module.moduleKey, registryModule),
      status: registryModule?.status || module.status || 'active',
      riskLevel: registryModule?.risk_level || module.riskLevel || 'normal',
      modulePermissionKey: registryModule?.module_permission_key || representative?.modulePermissionKey || representative?.key || null,
      permissionKey: registryModule?.permission_key || representative?.key || null,
      routeCount,
      permissions,
    }
  })

  modules.sort((a, b) => {
    const registryA = registryModules.find((module) => normalizeModuleKey(module.module_key) === a.moduleKey)
    const registryB = registryModules.find((module) => normalizeModuleKey(module.module_key) === b.moduleKey)
    const orderA = registryA?.sort_order ?? Number.MAX_SAFE_INTEGER
    const orderB = registryB?.sort_order ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB || a.moduleLabel.localeCompare(b.moduleLabel)
  })

  const flatPermissions = [...permissionMap.values()]
    .map(({ __priority, ...permission }) => permission)
    .sort((a, b) => {
      const order = { module: 0, route: 1, action: 2, legacy: 3 } as const
      return (order[a.type] - order[b.type]) || a.moduleLabel.localeCompare(b.moduleLabel) || a.label.localeCompare(b.label)
    })

  const registryActive = hasRegistryRows
  const message = registryActive ? undefined : 'Access registry not populated yet. Run App Access Scan.'

  return {
    ok: true,
    source,
    latestScan,
    modules,
    flatPermissions,
    ...(message ? { message } : {}),
  }
}
