export type GovernanceUserRow = Record<string, unknown> & {
  id: string
  email?: string | null
  full_name?: string | null
  username?: string | null
  role?: string | null
  status?: string | null
  department?: string | null
  job_title?: string | null
  permissions?: unknown
}

export type AccessResourceType =
  | 'module'
  | 'module_workspace'
  | 'route_family'
  | 'route_group'
  | 'standalone_route'
  | 'route'
  | 'dynamic_route'
  | 'api_route'
  | 'redirect'
  | 'internal'

export type AccessResourceStatus =
  | 'discovered'
  | 'classified'
  | 'review_required'
  | 'active'
  | 'missing'
  | 'retired'
  | 'excluded'

export type AccessResourceRegistryRow = {
  id: string
  resource_key: string
  resource_type: AccessResourceType | string
  parent_resource_key: string | null
  module_key: string | null
  family_key: string | null
  display_name: string
  description: string | null
  canonical_route: string | null
  route_pattern: string | null
  source_path: string | null
  application_root: string
  category: string | null
  department: string | null
  icon: string | null
  permission_key: string
  assignable: boolean
  dashboard_visible: boolean
  navigation_visible: boolean
  protected: boolean
  risk_level: string
  status: AccessResourceStatus | string
  classification_confidence: number
  classification_reason: string | null
  first_seen_at: string
  last_seen_at: string
  published_at: string | null
  retired_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AccessModuleRegistryRow = {
  id: string
  module_key: string
  module_label: string
  module_group: string | null
  parent_module_key: string | null
  description: string | null
  icon: string | null
  route_prefixes: string[]
  permission_key: string | null
  module_permission_key: string | null
  status: string
  risk_level: string
  sort_order: number
  detected_source: string | null
  metadata: Record<string, unknown>
  last_seen_at: string
  created_at: string
  updated_at: string
}

export type AccessRouteRegistryRow = {
  id: string
  href: string
  label: string
  short_label: string | null
  module_key: string
  module_label: string | null
  parent_module_key: string | null
  permission_key: string
  module_permission_key: string | null
  route_type: string
  workspace_key: string | null
  submodule_key: string | null
  resource_key?: string | null
  family_key?: string | null
  status: string
  is_protected: boolean
  is_core_system: boolean
  is_navigation_visible: boolean
  detected_source: string | null
  metadata: Record<string, unknown>
  last_seen_at: string
  created_at: string
  updated_at: string
}

export type AccessScanRunRow = {
  id: string
  scan_type: string
  scan_mode?: string | null
  status: string
  modules_detected: number
  routes_detected: number
  resources_detected?: number
  families_detected?: number
  groups_detected?: number
  standalone_routes_detected?: number
  api_routes_detected?: number
  new_modules: number
  new_routes: number
  new_resources?: number
  changed_resources?: number
  stale_modules: number
  stale_routes: number
  missing_resources?: number
  source: string | null
  payload: Record<string, unknown>
  checksum?: string | null
  registry_version_id?: string | null
  idempotency_key?: string | null
  created_by: string | null
  actor_email: string | null
  created_at: string
  published_at?: string | null
}

export type AccessRegistryVersionRow = {
  id: string
  version_number: number
  status: string
  source_scan_id: string | null
  checksum: string
  resource_count: number
  module_count: number
  route_count: number
  snapshot: Record<string, unknown>
  created_by: string | null
  actor_email: string | null
  created_at: string
  published_at: string | null
  rolled_back_at: string | null
  metadata: Record<string, unknown>
}

export type AccessRegistryEventRow = {
  id: string
  event_type: string
  module_key: string | null
  route_href: string | null
  resource_key?: string | null
  actor_user_id: string | null
  actor_email: string | null
  message: string | null
  payload: Record<string, unknown>
  created_at: string
}

export type AccessRoleTemplateRow = {
  id: string
  template_key: string
  template_label: string
  description: string | null
  role: string | null
  permissions: string[]
  is_system: boolean
  status: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AccessGovernanceRegistrySnapshot = {
  modules: AccessModuleRegistryRow[]
  routes: AccessRouteRegistryRow[]
  resources: AccessResourceRegistryRow[]
  templates: AccessRoleTemplateRow[]
  latestScan: AccessScanRunRow | null
  latestVersion: AccessRegistryVersionRow | null
  stats: AccessGovernanceStats
}

export type AccessGovernanceStats = {
  totalModules: number
  totalRoutes: number
  totalResources: number
  totalFamilies: number
  totalGroups: number
  totalStandaloneRoutes: number
  activeRoutes: number
  activeResources: number
  staleRoutes: number
  missingResources: number
  newRoutesSinceLastScan: number
  latestScanAt: string | null
}

export type AccessDiscoveredResource = {
  resourceKey: string
  resourceType: AccessResourceType
  parentResourceKey: string | null
  moduleKey: string | null
  familyKey: string | null
  displayName: string
  description: string
  canonicalRoute: string | null
  routePattern: string | null
  sourcePath: string | null
  applicationRoot: string
  category: string | null
  department: string | null
  icon: string | null
  permissionKey: string
  assignable: boolean
  dashboardVisible: boolean
  navigationVisible: boolean
  protected: boolean
  riskLevel: string
  status: AccessResourceStatus
  classificationConfidence: number
  classificationReason: string
  metadata: Record<string, unknown>
}

export type AccessResourceOverride = {
  resourceKey: string
  resourceType?: AccessResourceType
  parentResourceKey?: string | null
  displayName?: string
  category?: string | null
  department?: string | null
  icon?: string | null
  assignable?: boolean
  dashboardVisible?: boolean
  navigationVisible?: boolean
  status?: AccessResourceStatus
}

export type AccessGovernanceScanSummary = {
  scanMode: 'dry_run' | 'publish'
  modulesDetected: number
  routesDetected: number
  resourcesDetected: number
  familiesDetected: number
  groupsDetected: number
  standaloneRoutesDetected: number
  apiRoutesDetected: number
  newModules: number
  newRoutes: number
  newResources: number
  changedResources: number
  staleModules: number
  staleRoutes: number
  missingResources: number
  latestScanAt: string
  latestScanId: string
  registryVersionId: string | null
  checksum: string
  source: string
  rootsScanned: string[]
  warnings: string[]
  modules: Array<{
    moduleKey: string
    moduleLabel: string
    moduleGroup: string | null
    permissionKey: string | null
    modulePermissionKey: string | null
    routeCount: number
    status: string
  }>
  routes: Array<{
    href: string
    label: string
    shortLabel: string | null
    moduleKey: string
    moduleLabel: string | null
    familyKey: string | null
    resourceKey: string | null
    permissionKey: string
    modulePermissionKey: string | null
    routeType: string
    workspaceKey: string | null
    submoduleKey: string | null
    status: string
  }>
  resources: AccessDiscoveredResource[]
  diff: {
    newResourceKeys: string[]
    changedResourceKeys: string[]
    missingResourceKeys: string[]
    newModuleKeys: string[]
    newRouteHrefs: string[]
    staleModuleKeys: string[]
    staleRouteHrefs: string[]
  }
}

export type AccessRoutePermissionGap = {
  href: string
  label: string
  moduleKey: string
  moduleLabel: string | null
  missingPermissions: string[]
}

export type AccessGovernancePreview = {
  user: {
    id: string
    fullName: string
    username: string | null
    email: string | null
    role: string | null
    status: string | null
    department: string | null
    jobTitle: string | null
  }
  role: string | null
  status: string | null
  permissions: string[]
  fullAccess: boolean
  assignedModules: Array<{
    moduleKey: string
    moduleLabel: string | null
    routeCount: number
    permissionKey: string | null
    modulePermissionKey: string | null
  }>
  assignedResources?: Array<{
    resourceKey: string
    resourceType: string
    displayName: string
    canonicalRoute: string | null
    permissionKey: string
  }>
  assignedRoutes: Array<{
    href: string
    label: string
    moduleKey: string
    moduleLabel: string | null
    permissionKey: string
    modulePermissionKey: string | null
  }>
  deniedRoutes: AccessRoutePermissionGap[]
  missingPermissionRoutes: string[]
  staleAssignedPermissions: string[]
  registryVersion: {
    id: string
    createdAt: string
    scanType: string
    source: string | null
  } | null
  latestScan: AccessScanRunRow | null
  routeCount: number
  moduleCount: number
  resourceCount?: number
}
