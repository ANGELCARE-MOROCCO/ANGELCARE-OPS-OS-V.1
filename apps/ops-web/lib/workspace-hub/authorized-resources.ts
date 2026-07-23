import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { AccessResourceRegistryRow } from '@/lib/users/access-governance/types'

export type AuthorizedIndependentResource = {
  resourceKey: string
  resourceType: string
  title: string
  description: string
  href: string
  icon: string | null
  category: string | null
  riskLevel: string
  permissionKey: string
  childCount: number
  allowedBy: string[]
}

type WorkspaceUser = {
  role?: string | null
  role_key?: string | null
  permissions?: unknown
}

function permissionsFor(user: WorkspaceUser) {
  return Array.from(new Set((Array.isArray(user.permissions) ? user.permissions : []).map(String).filter(Boolean)))
}

function fullAccess(user: WorkspaceUser) {
  const role = String(user.role || user.role_key || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const permissions = permissionsFor(user)
  return ['ceo', 'direction', 'owner', 'super_admin', 'root', 'root_admin'].includes(role) || permissions.includes('*')
}

function permissionAllows(permissions: Set<string>, resource: AccessResourceRegistryRow) {
  return permissions.has(resource.permission_key)
    || Boolean(resource.canonical_route && permissions.has(`page:${resource.canonical_route}`))
    || Boolean(resource.module_key && permissions.has(`${resource.module_key}.view`))
}

function topResource(resource: AccessResourceRegistryRow, byKey: Map<string, AccessResourceRegistryRow>) {
  let current = resource
  const visited = new Set<string>()
  while (current.parent_resource_key && !visited.has(current.resource_key)) {
    visited.add(current.resource_key)
    const parent = byKey.get(current.parent_resource_key)
    if (!parent) break
    current = parent
  }
  return current
}

export async function loadAuthorizedIndependentResources(user: WorkspaceUser): Promise<AuthorizedIndependentResource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('access_resource_registry')
    .select('*')
    .eq('status', 'active')
    .eq('assignable', true)
    .order('display_name', { ascending: true })
    .limit(20000)

  if (error) {
    if (['42P01', 'PGRST205'].includes(String((error as any).code || ''))) return []
    throw new Error(error.message)
  }

  const resources = (data || []) as AccessResourceRegistryRow[]
  const byKey = new Map(resources.map((resource) => [resource.resource_key, resource]))
  const permissionSet = new Set(permissionsFor(user))
  const unrestricted = fullAccess(user)
  const allowedRoots = new Map<string, { root: AccessResourceRegistryRow; allowedBy: Set<string> }>()

  for (const resource of resources) {
    if (!unrestricted && !permissionAllows(permissionSet, resource)) continue
    const root = topResource(resource, byKey)
    if (!['route_family', 'standalone_route'].includes(root.resource_type)) continue
    if (!root.dashboard_visible && resource.resource_key === root.resource_key) continue
    const current = allowedRoots.get(root.resource_key) || { root, allowedBy: new Set<string>() }
    current.allowedBy.add(unrestricted ? '*' : resource.permission_key)
    allowedRoots.set(root.resource_key, current)
  }

  return [...allowedRoots.values()].map(({ root, allowedBy }) => ({
    resourceKey: root.resource_key,
    resourceType: root.resource_type,
    title: root.display_name,
    description: root.description || 'Authorized independent workspace.',
    href: root.canonical_route || '/',
    icon: root.icon,
    category: root.category,
    riskLevel: root.risk_level,
    permissionKey: root.permission_key,
    childCount: resources.filter((resource) => topResource(resource, byKey).resource_key === root.resource_key && resource.resource_key !== root.resource_key).length,
    allowedBy: [...allowedBy],
  }))
}
