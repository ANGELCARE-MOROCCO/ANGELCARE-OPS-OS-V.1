import { APP_ROUTES } from '@/lib/generated/app-routes'

export type PageAccessUser = {
  role?: string | null
  role_key?: string | null
  permissions?: string[] | null
}

export function isCeo(user: PageAccessUser | null | undefined) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  return role === 'ceo'
}

export function canAccessRoute(user: PageAccessUser | null | undefined, route: typeof APP_ROUTES[number]) {
  if (!user) return false
  if (isCeo(user)) return true

  const permissions = Array.isArray(user.permissions) ? user.permissions : []

  return (
    permissions.includes(route.permissionKey) ||
    permissions.includes(route.modulePermissionKey)
  )
}

export function getAllowedAppRoutes(user: PageAccessUser | null | undefined) {
  if (!user) return []
  if (isCeo(user)) return [...APP_ROUTES]
  return APP_ROUTES.filter((route) => canAccessRoute(user, route))
}

export function groupRoutesByModule<T extends { module: string }>(routes: readonly T[]) {
  return routes.reduce<Record<string, T[]>>((acc, route) => {
    if (!acc[route.module]) acc[route.module] = []
    acc[route.module].push(route)
    return acc
  }, {})
}
