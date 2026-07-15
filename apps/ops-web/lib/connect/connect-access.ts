export type MinimalAppUser = {
  id?: string | null
  role?: string | null
  department?: string | null
  permissions?: string[] | null
  email?: string | null
}

const DIRECTION_ROLES = new Set(['ceo', 'chief executive officer', 'chief-executive-officer', 'dg', 'direction générale', 'direction generale', 'general direction', 'admin', 'direction', 'super_admin', 'super admin', 'owner', 'founder', 'executive'])
const MANAGER_ROLES = new Set(['manager', 'admin', 'super_admin', 'owner', 'ceo', 'direction', 'operations_manager', 'hr_manager'])

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function isDirectionUser(user: MinimalAppUser | null | undefined) {
  return DIRECTION_ROLES.has(normalize(user?.role))
}

export function isManagerUser(user: MinimalAppUser | null | undefined) {
  return isDirectionUser(user) || MANAGER_ROLES.has(normalize(user?.role))
}

export function canAccessConnectDepartment(user: MinimalAppUser | null | undefined, department?: string | null) {
  if (!department) return true
  if (isDirectionUser(user)) return true
  const userDept = normalize(user?.department)
  const target = normalize(department)
  if (userDept && userDept === target) return true
  const permissions = user?.permissions || []
  return permissions.some((permission) => normalize(permission).includes(target) || normalize(permission).includes('connect:all'))
}

export function canCreateExecutiveBroadcast(user: MinimalAppUser | null | undefined) {
  return isDirectionUser(user)
}

export function isCeoUser(user: MinimalAppUser | null | undefined) {
  const role = normalize(user?.role)
  const permissions = user?.permissions || []
  return role === 'ceo'
    || role === 'chief executive officer'
    || role === 'chief-executive-officer'
    || role === 'dg'
    || role === 'direction générale'
    || role === 'direction generale'
    || role === 'founder'
    || role === 'owner'
    || role === 'super_admin'
    || role === 'super admin'
    || permissions.some((permission) => {
      const value = normalize(permission)
      return value === 'ceo' || value === 'connect:rooms:create' || value === 'connect:admin'
    })
}

export function canCreateDepartmentRoom(user: MinimalAppUser | null | undefined, department?: string | null) {
  return isCeoUser(user)
}

export function canUseConnectAdminActions(user: MinimalAppUser | null | undefined) {
  return isDirectionUser(user) || isManagerUser(user)
}
