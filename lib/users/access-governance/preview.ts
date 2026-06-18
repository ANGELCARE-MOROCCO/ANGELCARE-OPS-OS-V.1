import type { AccessGovernancePreview, GovernanceUserRow } from './types'
import {
  getKnownRegistryPermissionKeys,
  loadAccessGovernanceRegistry,
  normalizePermissions,
  normalizeRole,
  normalizeStatus,
  routePermissionMatches,
} from './registry'

type SupabaseClient = any

function userIdentity(user: GovernanceUserRow) {
  return {
    id: user.id,
    fullName: String(user.full_name || user.fullName || 'Unnamed user'),
    username: user.username ? String(user.username) : null,
    email: user.email ? String(user.email) : null,
    role: user.role ? String(user.role) : null,
    status: user.status ? String(user.status) : null,
    department: user.department ? String(user.department) : null,
    jobTitle: user.job_title ? String(user.job_title) : null,
  }
}

export async function buildAccessGovernancePreview(supabase: SupabaseClient, userId: string) {
  try {
    const [userResult, registryResult] = await Promise.all([
      supabase.from('app_users').select('*').eq('id', userId).maybeSingle(),
      loadAccessGovernanceRegistry(supabase),
    ])

    if (userResult.error) throw userResult.error
    if (!userResult.data) return { ok: false as const, status: 404, error: 'User not found.', missingMigration: false }
    if (!registryResult.ok) return { ok: false as const, status: 500, error: registryResult.error, missingMigration: registryResult.missingMigration }

    const user = userResult.data as GovernanceUserRow
    const permissions = normalizePermissions(user)
    const role = normalizeRole(user.role)
    const fullAccess = role === 'ceo' || permissions.includes('*')
    const knownPermissionKeys = getKnownRegistryPermissionKeys(registryResult.snapshot.routes)
    const assignedRoutes = registryResult.snapshot.routes.filter((route) => route.status === 'active' && routePermissionMatches(permissions, route))
    const deniedRoutes = registryResult.snapshot.routes
      .filter((route) => route.status === 'active' && !routePermissionMatches(permissions, route))
      .map((route) => {
        const missingPermissions = [route.permission_key, route.module_permission_key || ''].filter(Boolean).filter((permission) => !permissions.includes(permission) && !permissions.includes('*'))
        return {
          href: route.href,
          label: route.label,
          moduleKey: route.module_key,
          moduleLabel: route.module_label,
          missingPermissions: Array.from(new Set(missingPermissions)),
        }
      })

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

    const missingPermissionRoutes = Array.from(new Set(deniedRoutes.flatMap((route) => route.missingPermissions))).filter((permission) => !permissions.includes(permission) && knownPermissionKeys.has(permission))
    const staleAssignedPermissions = permissions.filter((permission) => permission !== '*' && !knownPermissionKeys.has(permission))

    const latestScan = registryResult.snapshot.latestScan
    const preview: AccessGovernancePreview = {
      user: userIdentity(user),
      role: user.role ? String(user.role) : null,
      status: normalizeStatus(user.status),
      permissions,
      fullAccess,
      assignedModules: [...assignedModules.values()],
      assignedRoutes: assignedRoutes.map((route) => ({
        href: route.href,
        label: route.label,
        moduleKey: route.module_key,
        moduleLabel: route.module_label,
        permissionKey: route.permission_key,
        modulePermissionKey: route.module_permission_key,
      })),
      deniedRoutes,
      missingPermissionRoutes,
      staleAssignedPermissions,
      registryVersion: latestScan
        ? {
            id: latestScan.id,
            createdAt: latestScan.created_at,
            scanType: latestScan.scan_type,
            source: latestScan.source,
          }
        : null,
      latestScan,
      routeCount: assignedRoutes.length,
      moduleCount: assignedModules.size,
    }

    return { ok: true as const, preview }
  } catch (error) {
    if (String((error as { code?: string })?.code || '') === 'PGRST116') {
      return { ok: false as const, status: 404, error: 'User not found.', missingMigration: false }
    }
    if (String((error as { message?: string })?.message || '').toLowerCase().includes('access governance registry tables are missing')) {
      return { ok: false as const, status: 500, error: 'Access governance registry tables are missing. Apply the Phase 1 migration before using preview.', missingMigration: true }
    }
    return { ok: false as const, status: 500, error: error instanceof Error ? error.message : 'Unable to build access preview.', missingMigration: false }
  }
}
