import { requireUser } from '@/lib/auth/session'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import type { Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360OperatorPermission, Angelcare360OperatorRole } from '@/types/angelcare360/operator'

export type Angelcare360OperatorSession = {
  user: Angelcare360SessionUser
  access: ReturnType<typeof buildAngelcare360AccessProfile>
  operatorRole: Angelcare360OperatorRole
}

const INTERNAL_OPERATOR_ROLES = new Set<Angelcare360OperatorRole>([
  'super_admin',
  'operator_admin',
  'account_manager',
  'finance_operator',
  'support_operator',
  'implementation_manager',
  'read_only',
])

const INTERNAL_OPERATOR_PERMISSION_KEYS = new Set<string>(['operator.*', 'angelcare360.operator.*', '*'])

function getOperatorRole(user: Angelcare360SessionUser): Angelcare360OperatorRole {
  const role = String(user.role || user.role_key || '').toLowerCase()
  if (role === 'super_admin' || role === 'ceo' || role === 'owner') return 'super_admin'
  if (role === 'operator_admin') return 'operator_admin'
  if (role === 'account_manager') return 'account_manager'
  if (role === 'finance_operator') return 'finance_operator'
  if (role === 'support_operator') return 'support_operator'
  if (role === 'implementation_manager') return 'implementation_manager'
  return 'read_only'
}

export async function requireAngelcare360OperatorSession(): Promise<Angelcare360OperatorSession | null> {
  const raw = await requireUser().catch(() => null)
  const user = normalizeAngelcare360User(raw as Partial<Angelcare360SessionUser> | null)
  if (!user) return null

  const access = buildAngelcare360AccessProfile(user)
  const operatorRole = getOperatorRole(user)
  const permissions = new Set((user.permissions || []).map((permission) => String(permission)))

  const allowed = access.accessLevel === 'super_admin' || [...permissions].some((permission) => INTERNAL_OPERATOR_PERMISSION_KEYS.has(permission))
  if (!allowed) return null

  return {
    user,
    access,
    operatorRole: INTERNAL_OPERATOR_ROLES.has(operatorRole) ? operatorRole : 'read_only',
  }
}

export async function requireAngelcare360OperatorPermission(permissionKey?: Angelcare360OperatorPermission | string) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) {
    throw new Error('Cette action nécessite un accès opérateur AngelCare.')
  }

  if (!permissionKey) return session

  const userPermissions = new Set((session.user.permissions || []).map((permission) => String(permission)))
  if (session.access.accessLevel === 'super_admin' || userPermissions.has(permissionKey) || userPermissions.has('operator.*') || userPermissions.has('angelcare360.operator.*') || userPermissions.has('*')) {
    return session
  }

  throw new Error('Cette action nécessite un accès opérateur AngelCare.')
}

export function hasAngelcare360OperatorAccess(user: Partial<Angelcare360SessionUser> | null | undefined) {
  const normalized = user?.id ? normalizeAngelcare360User(user) : null
  if (!normalized) return false
  const access = buildAngelcare360AccessProfile(normalized)
  const permissions = new Set((normalized.permissions || []).map((permission) => String(permission)))
  return access.accessLevel === 'super_admin' || [...permissions].some((permission) => INTERNAL_OPERATOR_PERMISSION_KEYS.has(permission))
}

