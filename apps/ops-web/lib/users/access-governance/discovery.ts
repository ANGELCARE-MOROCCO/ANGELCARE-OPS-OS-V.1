import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { AccessDiscoveredResource, AccessResourceOverride, AccessResourceType } from './types'

const ROUTE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'route.ts', 'route.js'])
const IGNORE_DIRECTORIES = new Set(['node_modules', '.next', '.git', '.turbo', 'coverage', 'dist', 'build', 'backups'])
const NON_ASSIGNABLE_ROOTS = new Set([
  'api', 'login', 'auth', 'unauthorized', 'system-offline', 'offline', 'health', 'favicon.ico',
  '_not-found', 'not-found', 'privacy', 'terms', 'public', 'print', 'academy-print',
])
const FORMAL_MODULE_ROOTS = new Set([
  'admin', 'academy', 'angelcare-360', 'angelcare-360-command-center', 'b2b-partnerships',
  'billing', 'capital-command-center', 'caregivers', 'carelink-ops', 'contracts', 'csa',
  'email-os', 'families', 'hr', 'interventions', 'market-os', 'missions', 'operations',
  'opsos-control-plane', 'pacojaco-ops', 'revenue-command-center', 'sales', 'service-os',
  'services', 'staff-portal', 'traininghub', 'users', 'voice-center', 'whatsapp-os',
])
const MODULE_PATTERNS = [/\bos\b/i, /command-center/i, /control-plane/i, /traininghub/i, /carelink/i]
const RISK_SEGMENTS = new Set(['settings', 'permissions', 'governance', 'security', 'payouts', 'payments', 'billing', 'delete', 'admin'])

export type DiscoveredRoute = {
  href: string
  routePattern: string
  sourcePath: string
  fileType: 'page' | 'api'
  routeGroups: string[]
  dynamic: boolean
  protected: boolean
  rootSegment: string
  visibleSegments: string[]
  guardStatus: 'guarded' | 'unverified' | 'not_applicable'
  httpMethods: string[]
}

export type AccessDiscoveryResult = {
  routes: DiscoveredRoute[]
  resources: AccessDiscoveredResource[]
  rootsScanned: string[]
  warnings: string[]
  checksum: string
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/\[\[\.\.\./g, 'optional-catchall-')
    .replace(/\[\.\.\./g, 'catchall-')
    .replace(/[\[\]]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'root'
}

function title(value: string) {
  const cleaned = value
    .replace(/^\[\[?\.\.\./, '')
    .replace(/\]\]?$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Application'
}

function isRouteGroup(segment: string) {
  return segment.startsWith('(') && segment.endsWith(')')
}

function isParallelRoute(segment: string) {
  return segment.startsWith('@')
}

function routeSegmentsFromRelative(relativeFile: string) {
  const parts = relativeFile.split(path.sep)
  const directoryParts = parts.slice(0, -1)
  const routeGroups = directoryParts.filter(isRouteGroup)
  const visibleSegments = directoryParts.filter((segment) => !isRouteGroup(segment) && !isParallelRoute(segment))
  return { visibleSegments, routeGroups }
}

function normalizeRoute(visibleSegments: string[]) {
  const href = `/${visibleSegments.join('/')}`.replace(/\/+/g, '/')
  return href === '/' ? '/' : href.replace(/\/$/, '')
}

function routePattern(href: string) {
  return href
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*?')
    .replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')
    .replace(/\[([^\]]+)\]/g, ':$1')
}

function walk(root: string, current: string, output: string[]) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORE_DIRECTORIES.has(entry.name)) continue
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) {
      walk(root, absolute, output)
      continue
    }
    if (entry.isFile() && ROUTE_FILES.has(entry.name)) {
      output.push(path.relative(root, absolute))
    }
  }
}

function candidateAppRoots() {
  const cwd = process.cwd()
  const configured = text(process.env.ACCESS_REGISTRY_APP_ROOT)
  const candidates = [
    configured,
    path.join(cwd, 'app'),
    path.join(cwd, 'src', 'app'),
    path.join(cwd, 'apps', 'ops-web', 'app'),
  ].filter(Boolean)

  return Array.from(new Set(candidates.map((candidate) => path.resolve(candidate)))).filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory())
}

function detectFormalModule(rootSegment: string, routes: DiscoveredRoute[]) {
  if (FORMAL_MODULE_ROOTS.has(rootSegment)) return true
  if (MODULE_PATTERNS.some((pattern) => pattern.test(rootSegment))) return true
  const rootPage = routes.some((route) => route.href === `/${rootSegment}`)
  const routeCount = routes.filter((route) => route.rootSegment === rootSegment && route.fileType === 'page').length
  return rootPage && routeCount >= 8
}

function routeRiskLevel(route: DiscoveredRoute) {
  if (route.fileType === 'api') return 'high'
  if (route.visibleSegments.some((segment) => RISK_SEGMENTS.has(segment.toLowerCase()))) return 'high'
  if (route.dynamic) return 'controlled'
  return 'normal'
}

function routeAssignability(route: DiscoveredRoute) {
  if (route.fileType === 'api') return false
  if (NON_ASSIGNABLE_ROOTS.has(route.rootSegment)) return false
  if (route.href === '/') return false
  if (route.href.includes('/login') || route.href.includes('/auth') || route.href.includes('/unauthorized')) return false
  return true
}

function makeResource(input: Omit<AccessDiscoveredResource, 'classificationConfidence' | 'classificationReason'> & { classificationConfidence?: number; classificationReason?: string }) {
  return {
    ...input,
    classificationConfidence: input.classificationConfidence ?? 0.9,
    classificationReason: input.classificationReason ?? 'Classified from the global Next.js route topology.',
  }
}

function resourcePermission(type: AccessResourceType, resourceKey: string, canonicalRoute: string | null) {
  if (type === 'route' || type === 'dynamic_route' || type === 'standalone_route') return `page:${canonicalRoute}`
  if (type === 'api_route') return `api:${canonicalRoute}`
  if (type === 'module') return `${resourceKey.replace(/^module:/, '')}.view`
  return `resource:${resourceKey}`
}

function buildResources(routes: DiscoveredRoute[]) {
  const resources = new Map<string, AccessDiscoveredResource>()
  const pageRoutes = routes.filter((route) => route.fileType === 'page')
  const roots = Array.from(new Set(pageRoutes.map((route) => route.rootSegment).filter(Boolean))).sort()

  for (const rootSegment of roots) {
    const rootRoutes = pageRoutes.filter((route) => route.rootSegment === rootSegment)
    const formalModule = detectFormalModule(rootSegment, rootRoutes)
    const rootType: AccessResourceType = formalModule ? 'module' : rootRoutes.length > 1 ? 'route_family' : 'standalone_route'
    const rootRoute = rootRoutes.find((route) => route.href === `/${rootSegment}`)?.href || rootRoutes[0]?.href || `/${rootSegment}`
    const rootKey = `${rootType === 'module' ? 'module' : rootType === 'route_family' ? 'family' : 'standalone'}:${slug(rootSegment)}`
    const assignable = !NON_ASSIGNABLE_ROOTS.has(rootSegment)

    resources.set(rootKey, makeResource({
      resourceKey: rootKey,
      resourceType: rootType,
      parentResourceKey: null,
      moduleKey: formalModule ? slug(rootSegment) : null,
      familyKey: formalModule ? null : slug(rootSegment),
      displayName: title(rootSegment),
      description: formalModule
        ? `${rootRoutes.length} application pages classified as a formal operational module.`
        : rootRoutes.length > 1
          ? `${rootRoutes.length} related pages classified as an independent route family.`
          : 'Independent standalone application page.',
      canonicalRoute: rootRoute,
      routePattern: routePattern(rootRoute),
      sourcePath: rootRoutes[0]?.sourcePath || null,
      applicationRoot: 'apps/ops-web/app',
      category: formalModule ? 'module' : 'independent',
      department: null,
      icon: formalModule ? 'Boxes' : rootRoutes.length > 1 ? 'FolderKanban' : 'FileText',
      permissionKey: resourcePermission(rootType, rootKey, rootRoute),
      assignable,
      dashboardVisible: assignable,
      navigationVisible: assignable,
      protected: rootRoutes.some((route) => route.protected),
      riskLevel: rootRoutes.some((route) => routeRiskLevel(route) === 'high') ? 'high' : 'normal',
      status: assignable ? 'classified' : 'excluded',
      metadata: { routeCount: rootRoutes.length, rootSegment, formalModule },
      classificationConfidence: formalModule ? 0.98 : rootRoutes.length > 1 ? 0.93 : 0.88,
      classificationReason: formalModule
        ? 'Recognized formal module root or mature module topology.'
        : rootRoutes.length > 1
          ? 'Multiple related pages share one independent application root.'
          : 'Single independent page outside formal module roots.',
    }))

    const groupMap = new Map<string, DiscoveredRoute[]>()
    for (const route of rootRoutes) {
      if (route.visibleSegments.length < 2) continue
      const groupSegment = route.visibleSegments[1]
      const groupKey = `${rootSegment}/${groupSegment}`
      const list = groupMap.get(groupKey) || []
      list.push(route)
      groupMap.set(groupKey, list)
    }

    for (const [groupPath, groupRoutes] of groupMap) {
      if (groupRoutes.length < 2) continue
      const [, groupSegment] = groupPath.split('/')
      const groupResourceKey = `group:${slug(rootSegment)}:${slug(groupSegment)}`
      const groupRoute = groupRoutes.find((route) => route.href === `/${groupPath}`)?.href || groupRoutes[0].href
      resources.set(groupResourceKey, makeResource({
        resourceKey: groupResourceKey,
        resourceType: formalModule ? 'module_workspace' : 'route_group',
        parentResourceKey: rootKey,
        moduleKey: formalModule ? slug(rootSegment) : null,
        familyKey: formalModule ? null : slug(rootSegment),
        displayName: title(groupSegment),
        description: `${groupRoutes.length} related pages grouped under ${title(rootSegment)}.` ,
        canonicalRoute: groupRoute,
        routePattern: routePattern(groupRoute),
        sourcePath: groupRoutes[0].sourcePath,
        applicationRoot: 'apps/ops-web/app',
        category: formalModule ? 'workspace' : 'route_group',
        department: null,
        icon: 'Layers3',
        permissionKey: resourcePermission(formalModule ? 'module_workspace' : 'route_group', groupResourceKey, groupRoute),
        assignable,
        dashboardVisible: false,
        navigationVisible: assignable,
        protected: groupRoutes.some((route) => route.protected),
        riskLevel: groupRoutes.some((route) => routeRiskLevel(route) === 'high') ? 'high' : 'normal',
        status: assignable ? 'classified' : 'excluded',
        metadata: { routeCount: groupRoutes.length, groupPath },
        classificationReason: 'Multiple pages share a stable second-level route prefix.',
      }))
    }
  }

  for (const route of routes) {
    const rootRoutes = pageRoutes.filter((candidate) => candidate.rootSegment === route.rootSegment)
    const formalModule = detectFormalModule(route.rootSegment, rootRoutes)
    const rootType = formalModule ? 'module' : rootRoutes.length > 1 ? 'route_family' : 'standalone_route'
    const rootKey = `${rootType === 'module' ? 'module' : rootType === 'route_family' ? 'family' : 'standalone'}:${slug(route.rootSegment || 'root')}`
    const groupKey = route.visibleSegments.length > 1 ? `group:${slug(route.rootSegment)}:${slug(route.visibleSegments[1])}` : null
    const parentKey = groupKey && resources.has(groupKey) ? groupKey : resources.has(rootKey) ? rootKey : null
    const assignable = routeAssignability(route)
    const type: AccessResourceType = route.fileType === 'api'
      ? 'api_route'
      : route.dynamic
        ? 'dynamic_route'
        : rootRoutes.length === 1 && route.visibleSegments.length <= 1
          ? 'standalone_route'
          : 'route'
    const resourceKey = `${route.fileType === 'api' ? 'api' : 'route'}:${slug(route.routePattern)}`

    // A one-page independent root is already represented by its standalone root
    // resource. Do not create a second resource with the same permission key.
    const rootResource = resources.get(rootKey)
    if (
      route.fileType === 'page' &&
      rootType === 'standalone_route' &&
      rootResource?.canonicalRoute === route.href
    ) {
      continue
    }

    resources.set(resourceKey, makeResource({
      resourceKey,
      resourceType: type,
      parentResourceKey: parentKey,
      moduleKey: formalModule ? slug(route.rootSegment) : null,
      familyKey: formalModule ? null : slug(route.rootSegment || 'root'),
      displayName: route.visibleSegments.length ? route.visibleSegments.map(title).join(' / ') : 'Application Home',
      description: route.fileType === 'api' ? 'Server API route discovered from the application tree.' : 'Assignable application page discovered from the application tree.',
      canonicalRoute: route.href,
      routePattern: route.routePattern,
      sourcePath: route.sourcePath,
      applicationRoot: 'apps/ops-web/app',
      category: route.fileType === 'api' ? 'api' : 'page',
      department: null,
      icon: route.fileType === 'api' ? 'Braces' : route.dynamic ? 'Route' : 'FileText',
      permissionKey: resourcePermission(type, resourceKey, route.href),
      assignable,
      dashboardVisible: false,
      navigationVisible: assignable && route.fileType === 'page',
      protected: route.protected,
      riskLevel: routeRiskLevel(route),
      status: assignable ? 'classified' : 'excluded',
      metadata: {
        routeGroups: route.routeGroups,
        dynamic: route.dynamic,
        fileType: route.fileType,
        visibleSegments: route.visibleSegments,
        guardStatus: route.guardStatus,
        httpMethods: route.httpMethods,
      },
      classificationConfidence: route.fileType === 'api' ? 1 : 0.99,
      classificationReason: route.fileType === 'api'
        ? 'Detected from a Next.js route handler file.'
        : route.dynamic
          ? 'Detected from a dynamic Next.js page route.'
          : 'Detected from a Next.js page route.',
    }))
  }

  return [...resources.values()].sort((a, b) => {
    const order: Record<string, number> = { module: 0, route_family: 1, standalone_route: 2, module_workspace: 3, route_group: 4, route: 5, dynamic_route: 6, api_route: 7, internal: 8 }
    return (order[a.resourceType] ?? 99) - (order[b.resourceType] ?? 99) || a.displayName.localeCompare(b.displayName)
  })
}

function applyOverrides(resources: AccessDiscoveredResource[], overrides: AccessResourceOverride[]) {
  const byKey = new Map(overrides.map((override) => [override.resourceKey, override]))
  const next = resources.map((resource) => {
    const override = byKey.get(resource.resourceKey)
    if (!override) return { ...resource, metadata: { ...resource.metadata } }
    const merged: AccessDiscoveredResource = {
      ...resource,
      ...(override.resourceType ? { resourceType: override.resourceType } : {}),
      ...(override.parentResourceKey !== undefined ? { parentResourceKey: override.parentResourceKey } : {}),
      ...(override.displayName ? { displayName: override.displayName } : {}),
      ...(override.category !== undefined ? { category: override.category } : {}),
      ...(override.department !== undefined ? { department: override.department } : {}),
      ...(override.icon !== undefined ? { icon: override.icon } : {}),
      ...(override.assignable !== undefined ? { assignable: override.assignable } : {}),
      ...(override.dashboardVisible !== undefined ? { dashboardVisible: override.dashboardVisible } : {}),
      ...(override.navigationVisible !== undefined ? { navigationVisible: override.navigationVisible } : {}),
      ...(override.status ? { status: override.status } : {}),
      metadata: { ...resource.metadata, classificationOverride: true },
      classificationReason: `${resource.classificationReason} Reviewed and overridden by an authorized governance actor.`,
    }
    merged.permissionKey = resourcePermission(merged.resourceType, merged.resourceKey, merged.canonicalRoute)
    if (!merged.assignable || merged.status === 'excluded' || merged.resourceType === 'api_route' || merged.resourceType === 'internal') {
      merged.assignable = false
      merged.dashboardVisible = false
      merged.navigationVisible = false
    }
    return merged
  })

  const map = new Map(next.map((resource) => [resource.resourceKey, resource]))
  const topResources = next.filter((resource) => !resource.parentResourceKey)
  for (const root of topResources) {
    const rootSlug = slug(root.canonicalRoute?.split('/').filter(Boolean)[0] || root.resourceKey)
    if (root.resourceType === 'module') {
      root.moduleKey = root.moduleKey || rootSlug
      root.familyKey = null
      root.permissionKey = `${root.moduleKey}.view`
    } else if (root.resourceType === 'route_family') {
      root.moduleKey = null
      root.familyKey = root.familyKey || rootSlug
      root.permissionKey = `resource:${root.resourceKey}`
    } else if (root.resourceType === 'standalone_route') {
      root.moduleKey = null
      root.familyKey = root.familyKey || rootSlug
      root.permissionKey = resourcePermission('standalone_route', root.resourceKey, root.canonicalRoute)
    }

    const queue = [root.resourceKey]
    const visited = new Set<string>()
    while (queue.length) {
      const parentKey = queue.shift()!
      if (visited.has(parentKey)) continue
      visited.add(parentKey)
      for (const child of next.filter((resource) => resource.parentResourceKey === parentKey)) {
        child.moduleKey = root.resourceType === 'module' ? root.moduleKey : null
        child.familyKey = root.resourceType === 'module' ? null : root.familyKey
        queue.push(child.resourceKey)
      }
    }
  }

  for (const resource of next) {
    if (resource.parentResourceKey && !map.has(resource.parentResourceKey)) {
      throw new Error(`Resource ${resource.resourceKey} references missing parent ${resource.parentResourceKey}.`)
    }
  }

  const permissions = new Map<string, string>()
  for (const resource of next) {
    const existing = permissions.get(resource.permissionKey)
    if (existing && existing !== resource.resourceKey) {
      throw new Error(`Duplicate permission key ${resource.permissionKey} for ${existing} and ${resource.resourceKey}.`)
    }
    permissions.set(resource.permissionKey, resource.resourceKey)
  }

  return next
}

export function discoverGlobalAccessResources(options: { includeApi?: boolean; overrides?: AccessResourceOverride[] } = {}): AccessDiscoveryResult {
  const roots = candidateAppRoots()
  const warnings: string[] = []
  const routes: DiscoveredRoute[] = []

  if (!roots.length) {
    throw new Error('No Next.js app root was found. Set ACCESS_REGISTRY_APP_ROOT to the application app directory.')
  }

  for (const appRoot of roots) {
    const files: string[] = []
    walk(appRoot, appRoot, files)
    for (const relativeFile of files) {
      const fileName = path.basename(relativeFile)
      const fileType = fileName.startsWith('route.') ? 'api' : 'page'
      if (fileType === 'api' && options.includeApi === false) continue
      const { visibleSegments, routeGroups } = routeSegmentsFromRelative(relativeFile)
      const href = normalizeRoute(visibleSegments)
      const rootSegment = visibleSegments[0] || 'root'
      const absoluteFile = path.join(appRoot, relativeFile)
      const source = fileType === 'api' ? fs.readFileSync(absoluteFile, 'utf8') : ''
      const guardStatus = fileType === 'api'
        ? /(getCurrentUser|getCurrentAppUser|requireUser|requireRole|auth\.uid|authorization|verify.*token|session)/i.test(source)
          ? 'guarded'
          : 'unverified'
        : 'not_applicable'
      const httpMethods = fileType === 'api'
        ? Array.from(source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)/g)).map((match) => String((match as RegExpMatchArray)[1] || ''))
        : []
      routes.push({
        href,
        routePattern: routePattern(href),
        sourcePath: path.posix.join('apps/ops-web/app', relativeFile.split(path.sep).join('/')),
        fileType,
        routeGroups,
        dynamic: visibleSegments.some((segment) => segment.includes('[')),
        protected: routeGroups.includes('(protected)'),
        rootSegment,
        visibleSegments,
        guardStatus,
        httpMethods,
      })
    }
  }

  const deduped = [...new Map(routes.map((route) => [`${route.fileType}:${route.href}:${route.sourcePath}`, route])).values()]
  if (deduped.some((route) => route.fileType === 'page' && !route.protected)) {
    warnings.push('Unprotected and independently mounted pages were detected and classified; assignability remains explicit and reviewable.')
  }
  if (!deduped.some((route) => route.fileType === 'api')) {
    warnings.push('No API routes were included in this scan.')
  } else {
    const unverifiedApis = deduped.filter((route) => route.fileType === 'api' && route.guardStatus === 'unverified')
    if (unverifiedApis.length) warnings.push(`${unverifiedApis.length} API routes require manual guard verification; discovery never treats heuristic guard detection as proof of enforcement.`)
  }

  const resources = applyOverrides(buildResources(deduped), options.overrides || [])
  const checksum = createHash('sha256')
    .update(JSON.stringify(resources.map((resource) => ({
      resourceKey: resource.resourceKey,
      resourceType: resource.resourceType,
      parentResourceKey: resource.parentResourceKey,
      canonicalRoute: resource.canonicalRoute,
      permissionKey: resource.permissionKey,
      assignable: resource.assignable,
      dashboardVisible: resource.dashboardVisible,
      status: resource.status,
    }))))
    .digest('hex')

  return { routes: deduped, resources, rootsScanned: roots, warnings, checksum }
}
