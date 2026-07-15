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
  status: string
  modules_detected: number
  routes_detected: number
  new_modules: number
  new_routes: number
  stale_modules: number
  stale_routes: number
  source: string | null
  payload: Record<string, unknown>
  created_by: string | null
  actor_email: string | null
  created_at: string
}

export type AccessRegistryEventRow = {
  id: string
  event_type: string
  module_key: string | null
  route_href: string | null
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
  templates: AccessRoleTemplateRow[]
  latestScan: AccessScanRunRow | null
  stats: AccessGovernanceStats
}

export type AccessGovernanceStats = {
  totalModules: number
  totalRoutes: number
  activeRoutes: number
  staleRoutes: number
  newRoutesSinceLastScan: number
  latestScanAt: string | null
}

export type AccessGovernanceScanSummary = {
  modulesDetected: number
  routesDetected: number
  newModules: number
  newRoutes: number
  staleModules: number
  staleRoutes: number
  latestScanAt: string
  latestScanId: string
  source: string
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
    permissionKey: string
    modulePermissionKey: string | null
    routeType: string
    workspaceKey: string | null
    submoduleKey: string | null
    status: string
  }>
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
}

