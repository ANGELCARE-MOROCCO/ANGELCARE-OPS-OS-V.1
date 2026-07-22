import { randomUUID } from 'node:crypto'
import type {
  AccessDiscoveredResource,
  AccessGovernanceScanSummary,
  AccessModuleRegistryRow,
  AccessRegistryEventRow,
  AccessResourceOverride,
  AccessResourceRegistryRow,
  AccessRouteRegistryRow,
  GovernanceUserRow,
} from './types'
import {
  canManageAccessGovernance,
  getModuleGroup,
  getRouteSegments,
  getSubmoduleKey,
  getWorkspaceKey,
  isMissingRegistryTableError,
  normalizeModuleKey,
  normalizeStatus,
  titleize,
} from './registry'
import { discoverGlobalAccessResources } from './discovery'

type SupabaseClient = any

type ScanOptions = {
  mode?: 'dry_run' | 'publish'
  includeApi?: boolean
  overrides?: AccessResourceOverride[]
  idempotencyKey?: string | null
  sourceScanId?: string | null
}

function actorSnapshot(actor: GovernanceUserRow) {
  return {
    id: actor.id,
    email: actor.email || null,
    full_name: actor.full_name || null,
    role: actor.role || null,
    status: actor.status || null,
  }
}

function buildEvent(
  eventType: string,
  actor: GovernanceUserRow,
  message: string,
  payload: Record<string, unknown>,
  resourceKey: string | null = null,
): AccessRegistryEventRow {
  return {
    id: randomUUID(),
    event_type: eventType,
    module_key: null,
    route_href: null,
    resource_key: resourceKey,
    actor_user_id: actor.id,
    actor_email: actor.email || null,
    message,
    payload,
    created_at: new Date().toISOString(),
  }
}

async function readRows(supabase: SupabaseClient, table: string, columns = '*') {
  const { data, error } = await supabase.from(table).select(columns)
  if (error) throw error
  return (data || []) as any[]
}

function resourceRow(resource: AccessDiscoveredResource, timestamp: string, existing?: Partial<AccessResourceRegistryRow>) {
  return {
    resource_key: resource.resourceKey,
    resource_type: resource.resourceType,
    parent_resource_key: resource.parentResourceKey,
    module_key: resource.moduleKey,
    family_key: resource.familyKey,
    display_name: resource.displayName,
    description: resource.description,
    canonical_route: resource.canonicalRoute,
    route_pattern: resource.routePattern,
    source_path: resource.sourcePath,
    application_root: resource.applicationRoot,
    category: resource.category,
    department: resource.department,
    icon: resource.icon,
    permission_key: resource.permissionKey,
    assignable: resource.assignable,
    dashboard_visible: resource.dashboardVisible,
    navigation_visible: resource.navigationVisible,
    protected: resource.protected,
    risk_level: resource.riskLevel,
    status: resource.status === 'excluded' ? 'excluded' : 'active',
    classification_confidence: resource.classificationConfidence,
    classification_reason: resource.classificationReason,
    first_seen_at: existing?.first_seen_at || timestamp,
    last_seen_at: timestamp,
    published_at: timestamp,
    retired_at: null,
    metadata: {
      ...(existing?.metadata || {}),
      ...resource.metadata,
      detectedAt: timestamp,
      scannerVersion: 2,
    },
  }
}

function parentResource(resources: AccessDiscoveredResource[], resource: AccessDiscoveredResource) {
  if (!resource.parentResourceKey) return null
  return resources.find((candidate) => candidate.resourceKey === resource.parentResourceKey) || null
}

function buildModuleRows(resources: AccessDiscoveredResource[], timestamp: string) {
  return resources
    .filter((resource) => resource.resourceType === 'module')
    .map((resource, index) => {
      const childRoutes = resources.filter((candidate) => candidate.moduleKey === resource.moduleKey && candidate.canonicalRoute)
      return {
        module_key: resource.moduleKey || normalizeModuleKey(resource.resourceKey.replace(/^module:/, '')),
        module_label: resource.displayName,
        module_group: getModuleGroup(resource.moduleKey || resource.resourceKey),
        parent_module_key: null,
        description: resource.description,
        icon: resource.icon,
        route_prefixes: Array.from(new Set(childRoutes.map((candidate) => candidate.canonicalRoute).filter(Boolean))).slice(0, 200),
        permission_key: resource.permissionKey,
        module_permission_key: resource.permissionKey,
        status: 'active',
        risk_level: resource.riskLevel,
        sort_order: index,
        detected_source: 'global-app-filesystem-scanner-v2',
        metadata: {
          ...resource.metadata,
          resourceKey: resource.resourceKey,
          routeCount: childRoutes.length,
          resourceType: resource.resourceType,
        },
        last_seen_at: timestamp,
      }
    })
}

function buildRouteRows(resources: AccessDiscoveredResource[], timestamp: string) {
  return resources
    .filter((resource) => ['route', 'dynamic_route', 'standalone_route'].includes(resource.resourceType) && resource.canonicalRoute)
    .map((resource) => {
      const canonicalRoute = resource.canonicalRoute as string
      const parent = parentResource(resources, resource)
      const fallbackKey = resource.familyKey ? `family__${resource.familyKey}` : normalizeModuleKey(getRouteSegments(canonicalRoute)[0] || 'workspace')
      const moduleKey = resource.moduleKey || fallbackKey
      const rootResource = resources.find((candidate) =>
        candidate.resourceType === 'module' && candidate.moduleKey === resource.moduleKey
        || candidate.resourceType === 'route_family' && candidate.familyKey === resource.familyKey
        || candidate.resourceKey === resource.parentResourceKey,
      )
      const modulePermissionKey = rootResource?.permissionKey || parent?.permissionKey || `${moduleKey}.view`
      const ancestorPermissionKeys: string[] = []
      let ancestor = parent
      const visited = new Set<string>()
      while (ancestor && !visited.has(ancestor.resourceKey)) {
        visited.add(ancestor.resourceKey)
        ancestorPermissionKeys.push(ancestor.permissionKey)
        ancestor = ancestor.parentResourceKey
          ? resources.find((candidate) => candidate.resourceKey === ancestor?.parentResourceKey) || null
          : null
      }
      return {
        href: canonicalRoute,
        label: resource.displayName,
        short_label: resource.displayName.split(' / ').pop() || resource.displayName,
        module_key: moduleKey,
        module_label: rootResource?.displayName || parent?.displayName || titleize(moduleKey),
        parent_module_key: null,
        permission_key: resource.permissionKey,
        module_permission_key: modulePermissionKey,
        route_type: resource.resourceType,
        workspace_key: getWorkspaceKey(canonicalRoute),
        submodule_key: getSubmoduleKey(canonicalRoute),
        resource_key: resource.resourceKey,
        family_key: resource.familyKey,
        status: 'active',
        is_protected: resource.protected,
        is_core_system: canonicalRoute.startsWith('/admin') || canonicalRoute.startsWith('/users'),
        is_navigation_visible: resource.navigationVisible,
        detected_source: 'global-app-filesystem-scanner-v2',
        metadata: {
          ...resource.metadata,
          parentResourceKey: resource.parentResourceKey,
          resourceType: resource.resourceType,
          routePattern: resource.routePattern,
          ancestorPermissionKeys,
        },
        last_seen_at: timestamp,
      }
    })
}

function comparableResource(resource: AccessDiscoveredResource | AccessResourceRegistryRow) {
  const anyResource = resource as any
  return {
    resourceType: anyResource.resourceType ?? anyResource.resource_type,
    parentResourceKey: anyResource.parentResourceKey ?? anyResource.parent_resource_key,
    moduleKey: anyResource.moduleKey ?? anyResource.module_key,
    familyKey: anyResource.familyKey ?? anyResource.family_key,
    displayName: anyResource.displayName ?? anyResource.display_name,
    canonicalRoute: anyResource.canonicalRoute ?? anyResource.canonical_route,
    routePattern: anyResource.routePattern ?? anyResource.route_pattern,
    permissionKey: anyResource.permissionKey ?? anyResource.permission_key,
    assignable: anyResource.assignable,
    dashboardVisible: anyResource.dashboardVisible ?? anyResource.dashboard_visible,
    navigationVisible: anyResource.navigationVisible ?? anyResource.navigation_visible,
    protected: anyResource.protected,
    riskLevel: anyResource.riskLevel ?? anyResource.risk_level,
    status: anyResource.status === 'active' ? 'classified' : anyResource.status,
  }
}

function hasResourceChanged(resource: AccessDiscoveredResource, existing: AccessResourceRegistryRow) {
  return JSON.stringify(comparableResource(resource)) !== JSON.stringify(comparableResource(existing))
}

function buildSummary(input: {
  mode: 'dry_run' | 'publish'
  timestamp: string
  scanId: string
  versionId: string | null
  discovery: ReturnType<typeof discoverGlobalAccessResources>
  moduleRows: any[]
  routeRows: any[]
  newModuleKeys: string[]
  newRouteHrefs: string[]
  newResourceKeys: string[]
  changedResourceKeys: string[]
  missingResourceKeys: string[]
  staleModuleKeys: string[]
  staleRouteHrefs: string[]
}): AccessGovernanceScanSummary {
  const { discovery, moduleRows, routeRows } = input
  return {
    scanMode: input.mode,
    modulesDetected: moduleRows.length,
    routesDetected: routeRows.length,
    resourcesDetected: discovery.resources.length,
    familiesDetected: discovery.resources.filter((resource) => resource.resourceType === 'route_family').length,
    groupsDetected: discovery.resources.filter((resource) => ['route_group', 'module_workspace'].includes(resource.resourceType)).length,
    standaloneRoutesDetected: discovery.resources.filter((resource) => resource.resourceType === 'standalone_route').length,
    apiRoutesDetected: discovery.resources.filter((resource) => resource.resourceType === 'api_route').length,
    newModules: input.newModuleKeys.length,
    newRoutes: input.newRouteHrefs.length,
    newResources: input.newResourceKeys.length,
    changedResources: input.changedResourceKeys.length,
    staleModules: input.staleModuleKeys.length,
    staleRoutes: input.staleRouteHrefs.length,
    missingResources: input.missingResourceKeys.length,
    latestScanAt: input.timestamp,
    latestScanId: input.scanId,
    registryVersionId: input.versionId,
    checksum: discovery.checksum,
    source: 'global-app-filesystem-scanner-v2',
    rootsScanned: discovery.rootsScanned,
    warnings: discovery.warnings,
    modules: moduleRows.map((module) => ({
      moduleKey: module.module_key,
      moduleLabel: module.module_label,
      moduleGroup: module.module_group,
      permissionKey: module.permission_key,
      modulePermissionKey: module.module_permission_key,
      routeCount: Number(module.metadata?.routeCount || 0),
      status: 'active',
    })),
    routes: routeRows.map((route) => ({
      href: route.href,
      label: route.label,
      shortLabel: route.short_label,
      moduleKey: route.module_key,
      moduleLabel: route.module_label,
      familyKey: route.family_key || null,
      resourceKey: route.resource_key || null,
      permissionKey: route.permission_key,
      modulePermissionKey: route.module_permission_key,
      routeType: route.route_type,
      workspaceKey: route.workspace_key,
      submoduleKey: route.submodule_key,
      status: 'active',
    })),
    resources: discovery.resources,
    diff: {
      newResourceKeys: input.newResourceKeys,
      changedResourceKeys: input.changedResourceKeys,
      missingResourceKeys: input.missingResourceKeys,
      newModuleKeys: input.newModuleKeys,
      newRouteHrefs: input.newRouteHrefs,
      staleModuleKeys: input.staleModuleKeys,
      staleRouteHrefs: input.staleRouteHrefs,
    },
  }
}

async function insertScanRun(
  supabase: SupabaseClient,
  actor: GovernanceUserRow,
  summary: AccessGovernanceScanSummary,
  idempotencyKey: string,
) {
  const payload = {
    scan_type: 'global_access_resource_scan',
    scan_mode: summary.scanMode,
    status: summary.scanMode === 'publish' ? 'published' : 'previewed',
    modules_detected: summary.modulesDetected,
    routes_detected: summary.routesDetected,
    resources_detected: summary.resourcesDetected,
    families_detected: summary.familiesDetected,
    groups_detected: summary.groupsDetected,
    standalone_routes_detected: summary.standaloneRoutesDetected,
    api_routes_detected: summary.apiRoutesDetected,
    new_modules: summary.newModules,
    new_routes: summary.newRoutes,
    new_resources: summary.newResources,
    changed_resources: summary.changedResources,
    stale_modules: summary.staleModules,
    stale_routes: summary.staleRoutes,
    missing_resources: summary.missingResources,
    source: summary.source,
    payload: summary,
    checksum: summary.checksum,
    registry_version_id: summary.registryVersionId,
    idempotency_key: idempotencyKey,
    created_by: actor.id,
    actor_email: actor.email || null,
    created_at: summary.latestScanAt,
    published_at: summary.scanMode === 'publish' ? summary.latestScanAt : null,
  }
  const { data, error } = await supabase.from('access_scan_runs').insert(payload).select('id').single()
  if (error) throw error
  return String(data?.id || '')
}

async function nextVersionNumber(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('access_registry_versions').select('version_number').order('version_number', { ascending: false }).limit(1)
  if (error) throw error
  return Number(data?.[0]?.version_number || 0) + 1
}

async function publishRegistry(
  supabase: SupabaseClient,
  actor: GovernanceUserRow,
  discovery: ReturnType<typeof discoverGlobalAccessResources>,
  timestamp: string,
  existingResources: AccessResourceRegistryRow[],
  existingModules: AccessModuleRegistryRow[],
  existingRoutes: AccessRouteRegistryRow[],
  sourceScanId: string | null = null,
) {
  const moduleRows = buildModuleRows(discovery.resources, timestamp)
  const routeRows = buildRouteRows(discovery.resources, timestamp)
  const existingResourceMap = new Map(existingResources.map((row) => [row.resource_key, row]))
  const resourceRows = discovery.resources.map((resource) => resourceRow(resource, timestamp, existingResourceMap.get(resource.resourceKey)))

  if (resourceRows.length) {
    const { error } = await supabase.from('access_resource_registry').upsert(resourceRows, { onConflict: 'resource_key' })
    if (error) throw error
  }
  if (moduleRows.length) {
    const { error } = await supabase.from('access_module_registry').upsert(moduleRows, { onConflict: 'module_key' })
    if (error) throw error
  }
  if (routeRows.length) {
    const { error } = await supabase.from('access_route_registry').upsert(routeRows, { onConflict: 'href' })
    if (error) throw error
  }

  const detectedResourceKeys = new Set(discovery.resources.map((resource) => resource.resourceKey))
  const missingResourceKeys = existingResources.filter((resource) => !detectedResourceKeys.has(resource.resource_key) && !['retired', 'excluded'].includes(resource.status)).map((resource) => resource.resource_key)
  if (missingResourceKeys.length) {
    const { error } = await supabase.from('access_resource_registry').update({ status: 'missing', last_seen_at: timestamp }).in('resource_key', missingResourceKeys)
    if (error) throw error
  }

  const moduleKeys = new Set(moduleRows.map((row) => row.module_key))
  const staleModuleKeys = existingModules.filter((module) => !moduleKeys.has(module.module_key) && module.status !== 'retired').map((module) => module.module_key)
  if (staleModuleKeys.length) {
    const { error } = await supabase.from('access_module_registry').update({ status: 'stale' }).in('module_key', staleModuleKeys)
    if (error) throw error
  }

  const routeHrefs = new Set(routeRows.map((row) => row.href))
  const staleRouteHrefs = existingRoutes.filter((route) => !routeHrefs.has(route.href) && route.status !== 'retired').map((route) => route.href)
  if (staleRouteHrefs.length) {
    const { error } = await supabase.from('access_route_registry').update({ status: 'stale' }).in('href', staleRouteHrefs)
    if (error) throw error
  }

  const versionNumber = await nextVersionNumber(supabase)
  const snapshot = {
    resources: resourceRows,
    modules: moduleRows,
    routes: routeRows,
    missingResourceKeys,
    staleModuleKeys,
    staleRouteHrefs,
  }
  const { error: supersedeError } = await supabase
    .from('access_registry_versions')
    .update({ status: 'superseded' })
    .eq('status', 'active')
  if (supersedeError) throw supersedeError

  const { data: version, error: versionError } = await supabase.from('access_registry_versions').insert({
    version_number: versionNumber,
    source_scan_id: sourceScanId,
    status: 'active',
    checksum: discovery.checksum,
    resource_count: resourceRows.length,
    module_count: moduleRows.length,
    route_count: routeRows.length,
    snapshot,
    created_by: actor.id,
    actor_email: actor.email || null,
    created_at: timestamp,
    published_at: timestamp,
    metadata: { rootsScanned: discovery.rootsScanned, scannerVersion: 2 },
  }).select('id').single()
  if (versionError) throw versionError

  return { moduleRows, routeRows, versionId: String(version?.id || ''), missingResourceKeys, staleModuleKeys, staleRouteHrefs }
}

export async function runAccessGovernanceScan(
  supabase: SupabaseClient,
  actor: GovernanceUserRow,
  options: ScanOptions = {},
) {
  if (!canManageAccessGovernance(actor)) {
    return { ok: false as const, status: 403, error: 'Access denied. This scan requires CEO, Admin, Manager, or users.manage.', missingMigration: false }
  }
  if (normalizeStatus(actor.status) !== 'active') {
    return { ok: false as const, status: 403, error: 'Access denied. Your account is not active.', missingMigration: false }
  }

  const mode = options.mode || 'dry_run'
  const timestamp = new Date().toISOString()
  const idempotencyKey = options.idempotencyKey || `${mode}:${timestamp.slice(0, 16)}:${actor.id}`

  try {
    const duplicate = await supabase.from('access_scan_runs').select('id,payload').eq('idempotency_key', idempotencyKey).maybeSingle()
    if (duplicate.error) throw duplicate.error
    if (duplicate.data?.payload) {
      return { ok: true as const, summary: duplicate.data.payload as AccessGovernanceScanSummary, idempotent: true }
    }

    const [existingResources, existingModules, existingRoutes] = await Promise.all([
      readRows(supabase, 'access_resource_registry', '*') as Promise<AccessResourceRegistryRow[]>,
      readRows(supabase, 'access_module_registry', '*') as Promise<AccessModuleRegistryRow[]>,
      readRows(supabase, 'access_route_registry', '*') as Promise<AccessRouteRegistryRow[]>,
    ])

    const discovery = discoverGlobalAccessResources({ includeApi: mode === 'publish' ? true : options.includeApi !== false, overrides: options.overrides || [] })
    const moduleRows = buildModuleRows(discovery.resources, timestamp)
    const routeRows = buildRouteRows(discovery.resources, timestamp)
    const existingResourceMap = new Map(existingResources.map((row) => [row.resource_key, row]))
    const existingModuleKeys = new Set(existingModules.map((row) => row.module_key))
    const existingRouteHrefs = new Set(existingRoutes.map((row) => row.href))
    const detectedResourceKeys = new Set(discovery.resources.map((resource) => resource.resourceKey))
    const detectedModuleKeys = new Set(moduleRows.map((row) => row.module_key))
    const detectedRouteHrefs = new Set(routeRows.map((row) => row.href))

    const newResourceKeys = discovery.resources.filter((resource) => !existingResourceMap.has(resource.resourceKey)).map((resource) => resource.resourceKey)
    const changedResourceKeys = discovery.resources.filter((resource) => {
      const existing = existingResourceMap.get(resource.resourceKey)
      return Boolean(existing && hasResourceChanged(resource, existing))
    }).map((resource) => resource.resourceKey)
    const missingResourceKeys = existingResources.filter((resource) => !detectedResourceKeys.has(resource.resource_key) && !['retired', 'excluded'].includes(resource.status)).map((resource) => resource.resource_key)
    const newModuleKeys = moduleRows.filter((row) => !existingModuleKeys.has(row.module_key)).map((row) => row.module_key)
    const newRouteHrefs = routeRows.filter((row) => !existingRouteHrefs.has(row.href)).map((row) => row.href)
    const staleModuleKeys = existingModules.filter((row) => !detectedModuleKeys.has(row.module_key) && row.status !== 'retired').map((row) => row.module_key)
    const staleRouteHrefs = existingRoutes.filter((row) => !detectedRouteHrefs.has(row.href) && row.status !== 'retired').map((row) => row.href)

    let versionId: string | null = null
    if (mode === 'publish') {
      const published = await publishRegistry(supabase, actor, discovery, timestamp, existingResources, existingModules, existingRoutes, options.sourceScanId || null)
      versionId = published.versionId
    }

    const provisionalScanId = randomUUID()
    let summary = buildSummary({
      mode,
      timestamp,
      scanId: provisionalScanId,
      versionId,
      discovery,
      moduleRows,
      routeRows,
      newModuleKeys,
      newRouteHrefs,
      newResourceKeys,
      changedResourceKeys,
      missingResourceKeys,
      staleModuleKeys,
      staleRouteHrefs,
    })

    const scanId = await insertScanRun(supabase, actor, summary, idempotencyKey)
    summary = { ...summary, latestScanId: scanId || provisionalScanId }
    await supabase.from('access_scan_runs').update({ payload: summary }).eq('id', scanId)

    const event = buildEvent(
      mode === 'publish' ? 'registry.scan_published' : 'registry.scan_previewed',
      actor,
      mode === 'publish'
        ? `Published global access registry version with ${summary.resourcesDetected} resources.`
        : `Previewed ${summary.resourcesDetected} global access resources without granting access.`,
      { summary, actor: actorSnapshot(actor) },
    )
    const { error: eventError } = await supabase.from('access_registry_events').insert(event)
    if (eventError) throw eventError

    return { ok: true as const, summary, idempotent: false }
  } catch (error) {
    if (isMissingRegistryTableError(error)) {
      return { ok: false as const, status: 500, error: 'Global access registry tables are missing. Apply the global registry migration before scanning.', missingMigration: true }
    }
    return { ok: false as const, status: 500, error: error instanceof Error ? error.message : 'Global access registry scan failed.', missingMigration: false }
  }
}

export async function publishStoredAccessGovernanceScan(
  supabase: SupabaseClient,
  actor: GovernanceUserRow,
  scanId: string,
  overrides: AccessResourceOverride[] = [],
  idempotencyKey?: string | null,
) {
  if (!canManageAccessGovernance(actor) || normalizeStatus(actor.status) !== 'active') {
    return { ok: false as const, status: 403, error: 'Access denied.', missingMigration: false }
  }
  const { data, error } = await supabase.from('access_scan_runs').select('payload').eq('id', scanId).maybeSingle()
  if (error) return { ok: false as const, status: 500, error: error.message, missingMigration: isMissingRegistryTableError(error) }
  if (!data?.payload) return { ok: false as const, status: 404, error: 'Scan preview not found.', missingMigration: false }

  return runAccessGovernanceScan(supabase, actor, {
    mode: 'publish',
    includeApi: true,
    overrides,
    sourceScanId: scanId,
    idempotencyKey: idempotencyKey || `publish:${scanId}`,
  })
}

export async function rollbackAccessRegistryVersion(
  supabase: SupabaseClient,
  actor: GovernanceUserRow,
  versionId: string,
) {
  if (!canManageAccessGovernance(actor) || normalizeStatus(actor.status) !== 'active') {
    return { ok: false as const, status: 403, error: 'Access denied.', missingMigration: false }
  }
  try {
    const { data: version, error } = await supabase.from('access_registry_versions').select('*').eq('id', versionId).maybeSingle()
    if (error) throw error
    if (!version?.snapshot) return { ok: false as const, status: 404, error: 'Registry version not found.', missingMigration: false }

    const snapshot = version.snapshot as { resources?: any[]; modules?: any[]; routes?: any[] }
    const resources = Array.isArray(snapshot.resources) ? snapshot.resources : []
    const modules = Array.isArray(snapshot.modules) ? snapshot.modules : []
    const routes = Array.isArray(snapshot.routes) ? snapshot.routes : []
    const timestamp = new Date().toISOString()

    const [currentResources, currentModules, currentRoutes] = await Promise.all([
      readRows(supabase, 'access_resource_registry', 'resource_key,status'),
      readRows(supabase, 'access_module_registry', 'module_key,status'),
      readRows(supabase, 'access_route_registry', 'href,status'),
    ])

    const restoredResourceKeys = new Set(resources.map((row) => String(row.resource_key || '')).filter(Boolean))
    const restoredModuleKeys = new Set(modules.map((row) => String(row.module_key || '')).filter(Boolean))
    const restoredRouteHrefs = new Set(routes.map((row) => String(row.href || '')).filter(Boolean))
    const extraResourceKeys = currentResources.map((row) => String(row.resource_key || '')).filter((key) => key && !restoredResourceKeys.has(key))
    const extraModuleKeys = currentModules.map((row) => String(row.module_key || '')).filter((key) => key && !restoredModuleKeys.has(key))
    const extraRouteHrefs = currentRoutes.map((row) => String(row.href || '')).filter((href) => href && !restoredRouteHrefs.has(href))

    if (resources.length) {
      const { error: resourceError } = await supabase.from('access_resource_registry').upsert(resources, { onConflict: 'resource_key' })
      if (resourceError) throw resourceError
    }
    if (modules.length) {
      const { error: moduleError } = await supabase.from('access_module_registry').upsert(modules, { onConflict: 'module_key' })
      if (moduleError) throw moduleError
    }
    if (routes.length) {
      const { error: routeError } = await supabase.from('access_route_registry').upsert(routes, { onConflict: 'href' })
      if (routeError) throw routeError
    }
    if (extraResourceKeys.length) {
      const { error: missingError } = await supabase.from('access_resource_registry').update({ status: 'missing', last_seen_at: timestamp }).in('resource_key', extraResourceKeys)
      if (missingError) throw missingError
    }
    if (extraModuleKeys.length) {
      const { error: staleModuleError } = await supabase.from('access_module_registry').update({ status: 'stale' }).in('module_key', extraModuleKeys)
      if (staleModuleError) throw staleModuleError
    }
    if (extraRouteHrefs.length) {
      const { error: staleRouteError } = await supabase.from('access_route_registry').update({ status: 'stale' }).in('href', extraRouteHrefs)
      if (staleRouteError) throw staleRouteError
    }

    const { error: supersedeError } = await supabase.from('access_registry_versions').update({ status: 'superseded' }).eq('status', 'active')
    if (supersedeError) throw supersedeError
    const rollbackVersionNumber = await nextVersionNumber(supabase)
    const rollbackSnapshot = {
      resources,
      modules,
      routes,
      missingResourceKeys: extraResourceKeys,
      staleModuleKeys: extraModuleKeys,
      staleRouteHrefs: extraRouteHrefs,
    }
    const { data: rollbackVersion, error: rollbackVersionError } = await supabase.from('access_registry_versions').insert({
      version_number: rollbackVersionNumber,
      status: 'active',
      checksum: String(version.checksum || ''),
      resource_count: resources.length,
      module_count: modules.length,
      route_count: routes.length,
      snapshot: rollbackSnapshot,
      created_by: actor.id,
      actor_email: actor.email || null,
      created_at: timestamp,
      published_at: timestamp,
      rolled_back_at: timestamp,
      metadata: { rollbackOfVersionId: versionId, rollbackOfVersionNumber: version.version_number, scannerVersion: 2 },
    }).select('id').single()
    if (rollbackVersionError) throw rollbackVersionError

    await supabase.from('access_registry_events').insert(buildEvent(
      'registry.version_rolled_back',
      actor,
      `Restored registry version ${version.version_number} as version ${rollbackVersionNumber}.`,
      {
        restoredVersionId: versionId,
        restoredVersionNumber: version.version_number,
        rollbackVersionId: rollbackVersion?.id || null,
        rollbackVersionNumber,
        extraResourceKeys,
        extraModuleKeys,
        extraRouteHrefs,
      },
    ))
    return {
      ok: true as const,
      versionId,
      versionNumber: version.version_number,
      rollbackVersionId: String(rollbackVersion?.id || ''),
      rollbackVersionNumber,
      rolledBackAt: timestamp,
    }
  } catch (error) {
    return { ok: false as const, status: 500, error: error instanceof Error ? error.message : 'Registry rollback failed.', missingMigration: isMissingRegistryTableError(error) }
  }
}
