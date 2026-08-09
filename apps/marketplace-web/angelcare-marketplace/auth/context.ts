import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { getCurrentUser } from '@/lib/getUser'
import { createServiceClient } from '@/lib/supabase/server'
import {
  ROLE_PERMISSION_FALLBACK,
  SOURCE_ROLE_TO_MARKETPLACE_ROLE,
} from '../domain/constants'
import type {
  MarketplacePermission,
  MarketplaceRequestContext,
  MarketplaceRoleAssignment,
} from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { getCustomerContext } from '../customer-commerce/customer-auth'

type CurrentAppUser = Record<string, unknown> & {
  id?: string
  email?: string
  role?: string
  full_name?: string
  name?: string
  display_name?: string
  locale?: string
  tenant_id?: string
  territory_id?: string
  permissions?: string[]
}

function normalizeLocale(value: unknown): 'fr' | 'en' | 'ar' {
  return value === 'ar' || value === 'en' ? value : 'fr'
}

function fallbackRole(sourceRole: string): string {
  return SOURCE_ROLE_TO_MARKETPLACE_ROLE[sourceRole] || 'marketplace_viewer'
}

function uniquePermissions(values: string[]): MarketplacePermission[] {
  return [...new Set(values)].filter((value): value is MarketplacePermission =>
    value.startsWith('marketplace.'),
  )
}

function fallbackPermissions(roleKeys: string[], user: CurrentAppUser): MarketplacePermission[] {
  return uniquePermissions([
    ...roleKeys.flatMap((roleKey) => ROLE_PERMISSION_FALLBACK[roleKey] || []),
    ...(Array.isArray(user.permissions) ? user.permissions : []),
  ])
}

async function databaseAssignments(userId: string): Promise<{
  assignments: MarketplaceRoleAssignment[]
  permissions: MarketplacePermission[]
}> {
  try {
    const supabase = await createServiceClient()
    const { data: assignmentRows, error: assignmentsError } = await supabase
      .from('angelcare_marketplace_user_role_assignments')
      .select('role_key, scope_type, territory_id, tenant_id, active')
      .eq('app_user_id', userId)
      .eq('active', true)

    if (assignmentsError) return { assignments: [], permissions: [] }

    const assignments: MarketplaceRoleAssignment[] = (assignmentRows || []).map((row: Record<string, unknown>) => ({
      roleKey: String(row.role_key),
      scopeType: (row.scope_type || 'global') as MarketplaceRoleAssignment['scopeType'],
      territoryId: row.territory_id ? String(row.territory_id) : null,
      tenantId: row.tenant_id ? String(row.tenant_id) : null,
    }))

    const roleKeys = [...new Set(assignments.map((assignment) => assignment.roleKey))]
    if (!roleKeys.length) return { assignments, permissions: [] }

    const { data: permissionRows, error: permissionsError } = await supabase
      .from('angelcare_marketplace_role_permissions')
      .select('permission_key, role_key')
      .in('role_key', roleKeys)

    if (permissionsError) return { assignments, permissions: [] }

    return {
      assignments,
      permissions: uniquePermissions((permissionRows || []).map((row: Record<string, unknown>) => String(row.permission_key))),
    }
  } catch {
    return { assignments: [], permissions: [] }
  }
}

export async function getMarketplaceContext(): Promise<MarketplaceRequestContext | null> {
  const user = (await getCurrentUser().catch(() => null)) as CurrentAppUser | null
  if (!user?.id) return null

  const sourceRole = String(user.role || '').trim().toLowerCase()
  const stored = await databaseAssignments(String(user.id))
  const fallbackRoleKey = fallbackRole(sourceRole)
  const assignments: MarketplaceRoleAssignment[] = stored.assignments.length
    ? stored.assignments
    : [{
        roleKey: fallbackRoleKey,
        scopeType: 'global',
        territoryId: user.territory_id ? String(user.territory_id) : null,
        tenantId: user.tenant_id ? String(user.tenant_id) : null,
      }]

  const roleKeys = [...new Set(assignments.map((assignment) => assignment.roleKey))]
  const permissions = stored.permissions.length
    ? stored.permissions
    : fallbackPermissions(roleKeys, user)

  const cookieStore = await cookies()
  const sessionReference = cookieStore.get(APP_SESSION_COOKIE)?.value || null

  return {
    actor: {
      id: String(user.id),
      email: user.email ? String(user.email) : null,
      displayName: String(
        user.full_name || user.display_name || user.name || user.email || 'Utilisateur ANGELCARE',
      ),
      sourceRole,
    },
    roleKeys,
    permissions,
    assignments,
    territoryId: user.territory_id ? String(user.territory_id) : assignments[0]?.territoryId || null,
    tenantId: user.tenant_id ? String(user.tenant_id) : assignments[0]?.tenantId || null,
    locale: normalizeLocale(user.locale),
    sessionReference,
  }
}

export function hasMarketplacePermission(
  context: MarketplaceRequestContext,
  permission: MarketplacePermission,
): boolean {
  // Canonical authority doctrine:
  // marketplace_admin is the highest Marketplace authority.
  // It must never be denied because of registry drift, a newly introduced
  // permission, a partial role-permission read, or a workspace-specific key.
  if (context.roleKeys.includes('marketplace_admin')) {
    return true
  }

  // Source-role fail-safe. CEO/admin identities remain absolute authorities
  // even if the persisted Marketplace assignment cannot be resolved.
  if (
    context.actor.sourceRole === 'ceo' ||
    context.actor.sourceRole === 'admin' ||
    context.actor.sourceRole === 'super_admin'
  ) {
    return true
  }

  return context.permissions.includes(permission)
}


const FAMILY_CUSTOMER_SELF_SERVICE_PERMISSIONS = new Set<MarketplacePermission>([
  'marketplace.family.access',
  'marketplace.family.dashboard',
  'marketplace.family.profile.view',
  'marketplace.family.profile.manage',
  'marketplace.family.children.view',
  'marketplace.family.children.manage',
  'marketplace.family.diagnostics.create',
  'marketplace.family.diagnostics.view',
  'marketplace.family.requests.create',
  'marketplace.family.requests.view',
  'marketplace.family.missions.view',
  'marketplace.family.support.create',
  'marketplace.family.support.view',
])

async function familyCustomerContext(permission?: MarketplacePermission): Promise<MarketplaceRequestContext | null> {
  if (!permission || !FAMILY_CUSTOMER_SELF_SERVICE_PERMISSIONS.has(permission)) return null
  const customer = await getCustomerContext().catch(() => null)
  return customer?.marketplace || null
}

export async function requireMarketplaceApiContext(
  permission?: MarketplacePermission,
): Promise<MarketplaceRequestContext> {
  const context = await getMarketplaceContext() || await familyCustomerContext(permission)
  if (!context) {
    throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Authentification ANGELCARE requise.')
  }
  if (permission && !hasMarketplacePermission(context, permission)) {
    try {
      const { writeMarketplaceAudit } = await import('../audit/write-audit')
      await writeMarketplaceAudit({
        context,
        requestId: crypto.randomUUID(),
        action: 'marketplace.access.denied',
        objectType: 'marketplace_permission',
        objectId: permission,
        result: 'denied',
        severity: 'warning',
        reason: `Permission requise : ${permission}`,
        source: 'angelcare-marketplace-api-guard',
      })
    } catch {
      // Denial remains effective even when the evidence store is unavailable.
    }
    throw new MarketplaceError(
      'PERMISSION_DENIED',
      'Votre rôle ne permet pas cette action dans ANGELCARE Marketplace.',
    )
  }
  return context
}

export async function requireMarketplacePageContext(
  permission?: MarketplacePermission,
): Promise<MarketplaceRequestContext> {
  const context = await getMarketplaceContext() || await familyCustomerContext(permission)
  if (!context) {
    redirect(`/login?returnTo=${encodeURIComponent('/angelcare-marketplace/workspace')}`)
    throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Authentification ANGELCARE requise.')
  }
  if (permission && !hasMarketplacePermission(context, permission)) {
    redirect('/angelcare-marketplace/access-denied')
  }
  return context
}

export async function requireMarketplaceAdminPageContext(
  permission: MarketplacePermission = 'marketplace.admin.access',
): Promise<MarketplaceRequestContext> {
  const context = await getMarketplaceContext()
  if (!context) {
    redirect(`/admin?returnTo=${encodeURIComponent('/angelcare-marketplace/admin')}`)
    throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Authentification Marketplace Admin requise.')
  }
  if (!hasMarketplacePermission(context, 'marketplace.admin.access')) {
    redirect('/angelcare-marketplace/access-denied')
  }
  if (permission && !hasMarketplacePermission(context, permission)) {
    redirect('/angelcare-marketplace/access-denied')
  }
  return context
}
