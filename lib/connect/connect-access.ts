export type MinimalAppUser = {
  id?: string | null
  role?: string | null
  department?: string | null
  permissions?: string[] | null
}

export function isDirectionUser(user: MinimalAppUser | null | undefined) {
  const role = String(user?.role || '').toLowerCase()
  return ['ceo', 'admin', 'direction', 'super_admin', 'owner'].includes(role)
}

export function canAccessConnectDepartment(user: MinimalAppUser | null | undefined, department?: string | null) {
  if (!department) return true
  if (isDirectionUser(user)) return true
  const userDept = String(user?.department || '').toLowerCase()
  const target = String(department || '').toLowerCase()
  if (userDept && userDept === target) return true
  const permissions = user?.permissions || []
  return permissions.some((permission) => permission.toLowerCase().includes(target))
}

export function canCreateExecutiveBroadcast(user: MinimalAppUser | null | undefined) {
  return isDirectionUser(user)
}
