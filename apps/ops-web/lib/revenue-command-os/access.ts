import 'server-only'
import { getCurrentUser } from '@/lib/getUser'
import { RevenueOsError } from './errors'
import { REVENUE_OS_PRIVILEGED_ROLES } from './permissions'

export const REVENUE_OS_CANONICAL_TENANT_ID =
  process.env.REVENUE_OS_CANONICAL_TENANT_ID?.trim() || 'angelcare-main'

// Stable UUID derived from md5('angelcare-main'); the MZ19 additive migration uses the same value.
export const REVENUE_OS_CANONICAL_TENANT_UUID =
  process.env.REVENUE_OS_CANONICAL_TENANT_UUID?.trim() || 'c09a0815-6e36-8f6e-7c51-27cf503cb6af'

export interface RevenueOsActor {
  id: string
  tenantId: string
  tenantUuid: string
  displayName: string
  role: string
  permissions: string[]
  email?: string
}

export interface RevenueOsTenantBinding {
  tenantId: string
  tenantUuid: string
  source: 'user' | 'canonical-internal'
}

const privilegedRoles = new Set<string>(REVENUE_OS_PRIVILEGED_ROLES)

export function normalizeRevenueOsRole(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'managing_director' || normalized === 'director_general' || normalized === 'dg') {
    return 'direction'
  }

  return normalized
}

function isPrivilegedRevenueOsUser(user: any): boolean {
  const role = normalizeRevenueOsRole(user?.role ?? user?.role_key)
  return privilegedRoles.has(role) || role === 'direction'
}

export function revenueOsPermissionsOf(user: any): string[] {
  const raw: string[] = Array.isArray(user?.permissions)
    ? user.permissions.map((value: unknown) => String(value))
    : []
  const permissions = new Set<string>(raw)
  const role = normalizeRevenueOsRole(user?.role ?? user?.role_key)

  if (privilegedRoles.has(role) || role === 'direction') permissions.add('*')

  return Array.from(permissions)
}

function requestedTenant(payload: unknown, key: 'tenantId' | 'tenantUuid'): string {
  if (!payload || typeof payload !== 'object') return ''
  return String((payload as Record<string, unknown>)[key] ?? '').trim()
}

export function revenueOsTenantBindingOf(user: any, payload?: unknown): RevenueOsTenantBinding {
  const directTenantId = String(
    user?.revenue_os_tenant_id ??
      user?.tenant_id ??
      user?.tenantId ??
      user?.organization_id ??
      user?.organizationId ??
      '',
  ).trim()

  const directTenantUuid = String(
    user?.revenue_os_tenant_uuid ?? user?.tenant_uuid ?? user?.tenantUuid ?? '',
  ).trim()

  const binding: RevenueOsTenantBinding = directTenantId || directTenantUuid
    ? {
        tenantId: directTenantId || REVENUE_OS_CANONICAL_TENANT_ID,
        tenantUuid: directTenantUuid || REVENUE_OS_CANONICAL_TENANT_UUID,
        source: 'user',
      }
    : isPrivilegedRevenueOsUser(user)
      ? {
          tenantId: REVENUE_OS_CANONICAL_TENANT_ID,
          tenantUuid: REVENUE_OS_CANONICAL_TENANT_UUID,
          source: 'canonical-internal',
        }
      : (() => {
          throw new RevenueOsError(
            'REVENUE_OS_TENANT_MISSING',
            'Votre session est valide, mais aucun périmètre Revenue OS actif n’a été résolu.',
            {
              status: 403,
              recoverable: false,
              context: { remediation: 'Vérifier l’affectation institutionnelle Revenue OS de cet utilisateur.' },
            },
          )
        })()

  const requestedId = requestedTenant(payload, 'tenantId')
  const requestedUuid = requestedTenant(payload, 'tenantUuid')

  if (requestedId && requestedId !== binding.tenantId && requestedId !== binding.tenantUuid) {
    throw new RevenueOsError(
      'REVENUE_OS_TENANT_MISMATCH',
      'Le périmètre Revenue OS demandé ne correspond pas à votre session.',
      { status: 403, recoverable: false },
    )
  }

  if (requestedUuid && requestedUuid !== binding.tenantUuid) {
    throw new RevenueOsError(
      'REVENUE_OS_TENANT_MISMATCH',
      'Le périmètre technique Revenue OS demandé ne correspond pas à votre session.',
      { status: 403, recoverable: false },
    )
  }

  return binding
}

export function revenueOsTenantOf(user: any, payload?: unknown): string {
  return revenueOsTenantBindingOf(user, payload).tenantId
}

export function revenueOsTenantUuidOf(user: any, payload?: unknown): string {
  return revenueOsTenantBindingOf(user, payload).tenantUuid
}

export function actorFromRevenueOsUser(user: any, payload?: unknown): RevenueOsActor {
  const binding = revenueOsTenantBindingOf(user, payload)
  const role = normalizeRevenueOsRole(user?.role ?? user?.role_key)
  const permissions = revenueOsPermissionsOf(user)

  return {
    id: String(user?.id ?? user?.email ?? 'current-user'),
    tenantId: binding.tenantId,
    tenantUuid: binding.tenantUuid,
    displayName: String(
      user?.full_name ?? user?.name ?? user?.display_name ?? user?.email ?? 'Opérateur Revenue OS',
    ),
    role: role || 'revenue_operator',
    permissions,
    email: user?.email ? String(user.email) : undefined,
  }
}

export function hasRevenueOsPermission(
  actorOrUser: RevenueOsActor | any,
  permission: string,
  aliases: string[] = [],
): boolean {
  const permissions = new Set(
    Array.isArray(actorOrUser?.permissions)
      ? actorOrUser.permissions.map(String)
      : revenueOsPermissionsOf(actorOrUser),
  )
  const role = normalizeRevenueOsRole(actorOrUser?.role ?? actorOrUser?.role_key)

  if (permissions.has('*') || privilegedRoles.has(role) || role === 'direction') return true
  if (permissions.has(permission)) return true
  if (permission !== 'revenue_os.view' && permissions.has('revenue_os.manage')) return true

  return aliases.some((alias) => permissions.has(alias))
}

export function requireRevenueOsPermission(
  actorOrUser: RevenueOsActor | any,
  permission: string,
  message = 'Permission Revenue Command OS requise.',
  aliases: string[] = [],
): void {
  if (!hasRevenueOsPermission(actorOrUser, permission, aliases)) {
    throw new RevenueOsError('REVENUE_OS_PERMISSION_DENIED', message, {
      status: 403,
      recoverable: false,
      context: { permission },
    })
  }
}

export async function resolveRevenueOsActor(
  permission?: string,
  options: { message?: string; aliases?: string[]; payload?: unknown } = {},
): Promise<RevenueOsActor> {
  const user = await getCurrentUser()

  if (!user) {
    throw new RevenueOsError('REVENUE_OS_UNAUTHENTICATED', 'Authentification requise.', {
      status: 401,
      recoverable: true,
    })
  }

  const actor = actorFromRevenueOsUser(user, options.payload)

  if (permission) {
    requireRevenueOsPermission(actor, permission, options.message, options.aliases)
  }

  return actor
}
