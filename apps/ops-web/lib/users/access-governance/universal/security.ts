import { randomUUID } from 'node:crypto'
import type { GovernanceUserRow } from '../types'
import type { JsonObject, JsonValue } from './types'

const VIEW_ROLES = new Set(['ceo', 'direction', 'owner', 'admin', 'super_admin', 'root', 'root_admin', 'manager'])
const EXECUTE_ROLES = new Set(['ceo', 'owner', 'super_admin', 'root', 'root_admin'])
const APPROVE_ROLES = new Set(['ceo', 'direction', 'owner', 'super_admin', 'root', 'root_admin'])
const SECRET_KEY_PATTERN = /(secret|password|token|private[_-]?key|credential|api[_-]?key|authorization|cookie)/i
const SECRET_VALUE_PATTERN = /(bearer\s+[a-z0-9._-]+|sk-[a-z0-9_-]{20,}|-----begin\s+[^-]*private\s+key-----)/i

function normalizeRole(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function permissions(user: GovernanceUserRow | null | undefined) {
  if (!Array.isArray(user?.permissions)) return []
  return user.permissions.map((permission) => String(permission).trim()).filter(Boolean)
}

export function canViewUniversalAuthorizationCommand(user: GovernanceUserRow | null | undefined) {
  if (!user) return false
  const assigned = permissions(user)
  return VIEW_ROLES.has(normalizeRole(user.role))
    || assigned.includes('*')
    || assigned.includes('users.view')
    || assigned.includes('users.manage')
    || assigned.includes('access_governance.view')
}

export function canManageUniversalAuthorizationCommand(user: GovernanceUserRow | null | undefined) {
  if (!user) return false
  const assigned = permissions(user)
  return VIEW_ROLES.has(normalizeRole(user.role))
    || assigned.includes('*')
    || assigned.includes('users.manage')
    || assigned.includes('access_governance.manage')
}

export function canApproveUniversalAuthorizationPlan(user: GovernanceUserRow | null | undefined) {
  if (!user) return false
  const assigned = permissions(user)
  return APPROVE_ROLES.has(normalizeRole(user.role))
    || assigned.includes('*')
    || assigned.includes('access_governance.approve')
}

export function canExecuteUniversalAuthorizationPlan(user: GovernanceUserRow | null | undefined) {
  if (!user) return false
  const assigned = permissions(user)
  return EXECUTE_ROLES.has(normalizeRole(user.role))
    || assigned.includes('*')
    || assigned.includes('access_governance.execute')
}

export function createCorrelationId(prefix = 'access') {
  return `${prefix}-${randomUUID()}`
}

export function actorIdentity(user: GovernanceUserRow) {
  return {
    id: String(user.id),
    email: String(user.email ?? '').trim() || null,
    name: String(user.full_name ?? user.username ?? user.email ?? 'Authorized actor'),
    role: String(user.role ?? '').trim() || null,
  }
}

function redactValue(value: JsonValue, key = ''): JsonValue {
  if (SECRET_KEY_PATTERN.test(key)) return '[REDACTED]'
  if (typeof value === 'string') return SECRET_VALUE_PATTERN.test(value) ? '[REDACTED]' : value
  if (Array.isArray(value)) return value.map((item) => redactValue(item))
  if (value && typeof value === 'object') {
    const result: JsonObject = {}
    for (const [childKey, childValue] of Object.entries(value)) result[childKey] = redactValue(childValue, childKey)
    return result
  }
  return value
}

export function redactSensitiveMetadata(value: JsonObject): JsonObject {
  return redactValue(value) as JsonObject
}

export function assertSafeDatabaseIdentifier(value: string, label: string) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/i.test(value)) {
    throw new Error(`${label} is not a safe PostgreSQL identifier.`)
  }
  return value
}

export function assertSafeRpcName(value: string) {
  return assertSafeDatabaseIdentifier(value, 'Mutation RPC')
}
