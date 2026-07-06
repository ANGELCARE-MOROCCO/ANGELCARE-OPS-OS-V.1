import { NextResponse } from 'next/server'
import type {
  JsonRecord,
  TrainingHubAuthUser,
  TrainingHubContext,
  TrainingHubEntitlement,
  TrainingHubMembership,
  TrainingHubOrganization,
  TrainingHubProfile,
  TrainingHubRole,
} from './types'
import { createTrainingHubUserClient } from './supabase'

const INTERNAL_ORG_TYPES = new Set(['angelcare_internal'])
const INTERNAL_ROLE_CODES = new Set([
  'super_admin',
  'academy_director',
  'academy_ops',
  'sales_manager',
  'sales_agent',
  'finance_manager',
  'trainer_manager',
  'support_agent',
  'aftersales_manager',
  'auditor',
  'internal_admin',
  'traininghub_admin',
])

export class TrainingHubHttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status = 500, code = 'TRAININGHUB_ERROR', details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function trainingHubErrorResponse(error: unknown, fallback = 'TrainingHub request failed') {
  if (error instanceof TrainingHubHttpError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code, details: error.details },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const message = error instanceof Error ? error.message : String(error || fallback)
  console.error('[traininghub]', message, error)
  return NextResponse.json(
    { ok: false, error: message || fallback, code: 'TRAININGHUB_INTERNAL_ERROR' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}

function clean(value: unknown) {
  return String(value || '').trim()
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function normalizeRoleCode(value: unknown) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => clean(value)).filter(Boolean)))
}

function dedupeRows<T extends { id?: string | null }>(rows: T[]) {
  return rows.filter((row, index, arr) => row?.id && arr.findIndex((candidate) => candidate.id === row.id) === index)
}

function isActiveRecord(row: any) {
  if (!row) return false
  const status = normalize(row.status || 'active')
  const stage = normalize(row.stage || '')
  const access = normalize(row.access_status || 'active')
  if (['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(status)) return false
  if (stage && ['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(stage)) return false
  if (access && ['inactive', 'disabled', 'suspended', 'deleted', 'archived'].includes(access)) return false
  if (row.is_active === false) return false
  return true
}

async function selectRows(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>, table: string, build: (query: any) => any) {
  try {
    const { data, error } = await build(supabase.from(table).select('*'))
    if (error) return []
    return Array.isArray(data) ? data : data ? [data] : []
  } catch {
    return []
  }
}

async function readCurrentSupabaseAuthUser(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>) {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw new TrainingHubHttpError(error.message, 401, 'TRAININGHUB_AUTH_SESSION_INVALID')
  }

  if (!data.user?.id) {
    throw new TrainingHubHttpError('Unauthorized TrainingHub request.', 401, 'TRAININGHUB_UNAUTHORIZED')
  }

  return data.user as unknown as TrainingHubAuthUser
}

async function readProfileByAuthUser(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  authUser: TrainingHubAuthUser,
) {
  const email = normalize(authUser.email)
  const rows = [
    ...await selectRows(supabase, 'core_user_profiles', (query) => query.eq('auth_user_id', authUser.id).limit(20)),
    ...await selectRows(supabase, 'core_user_profiles', (query) => query.eq('user_id', authUser.id).limit(20)),
    ...(email ? await selectRows(supabase, 'core_user_profiles', (query) => query.ilike('email', email).limit(20)) : []),
  ]

  const profiles = dedupeRows(rows as TrainingHubProfile[])
  return (profiles.find((profile: any) => isActiveRecord(profile)) || profiles[0] || null) as TrainingHubProfile | null
}

async function readOrganizations(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  organizationIds: string[],
) {
  if (!organizationIds.length) return []

  const rows = await selectRows(supabase, 'core_organizations', (query) => query.in('id', organizationIds))
  return (rows || []).filter(isActiveRecord) as TrainingHubOrganization[]
}

async function readMemberships(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  profileId: string,
  authUserId: string,
) {
  const rows = [
    ...await selectRows(supabase, 'core_memberships', (query) => query.eq('user_id', profileId).limit(50)),
    ...await selectRows(supabase, 'core_memberships', (query) => query.eq('profile_id', profileId).limit(50)),
    ...await selectRows(supabase, 'core_memberships', (query) => query.eq('auth_user_id', authUserId).limit(50)),
    ...await selectRows(supabase, 'core_memberships', (query) => query.eq('user_id', authUserId).limit(50)),
  ]

  return dedupeRows(rows as TrainingHubMembership[]).filter(isActiveRecord) as TrainingHubMembership[]
}

async function readRoleAssignments(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  profileId: string,
  authUserId: string,
) {
  async function withJoin(field: string, value: string) {
    try {
      const { data, error } = await supabase
        .from('authz_user_role_assignments')
        .select('*, authz_roles(*)')
        .eq(field, value)
        .eq('status', 'active')
        .limit(50)

      if (error) return []
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const rows = dedupeRows([
    ...await withJoin('user_id', profileId),
    ...await withJoin('profile_id', profileId),
    ...await withJoin('auth_user_id', authUserId),
    ...await withJoin('user_id', authUserId),
  ] as any[]).filter(isActiveRecord)

  return rows
    .map((row: any) => {
      const roleRow = row.authz_roles || {}
      const code =
        clean(roleRow.code) ||
        clean(roleRow.slug) ||
        clean(roleRow.key) ||
        clean(row.role_key) ||
        clean(row.role) ||
        normalizeRoleCode(roleRow.name)

      return {
        id: String(row.role_id || roleRow.id || ''),
        code: normalizeRoleCode(code),
        name: roleRow.name || row.role || row.role_key || null,
        scope: roleRow.scope || row.scope_type || null,
        organization_id: row.organization_id || null,
        site_id: row.site_id || null,
        assignment_status: row.status || null,
      }
    })
    .filter((role: TrainingHubRole) => role.id && role.code) as TrainingHubRole[]
}

async function readPermissions(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>, roleIds: string[]) {
  if (!roleIds.length) return []

  try {
    const { data, error } = await supabase
      .from('authz_role_permissions')
      .select('role_id, authz_permissions(code)')
      .in('role_id', roleIds)

    if (error) return []
    return uniq((data || []).map((row: any) => row.authz_permissions?.code))
  } catch {
    return []
  }
}

async function readEntitlements(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  organizationIds: string[],
) {
  if (!organizationIds.length) return []

  try {
    const { data, error } = await supabase
      .from('ent_organization_entitlements')
      .select('id, organization_id, site_id, source_type, source_id, status, valid_from, valid_until, limit_value, used_value, ent_definitions(code, name, entitlement_type)')
      .in('organization_id', organizationIds)
      .in('status', ['active', 'pending', 'unlocked'])

    if (error) return []

    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.ent_definitions?.code || null,
      name: row.ent_definitions?.name || null,
      entitlement_type: row.ent_definitions?.entitlement_type || null,
      organization_id: row.organization_id || null,
      site_id: row.site_id || null,
      source_type: row.source_type || null,
      source_id: row.source_id || null,
      status: row.status || null,
      valid_from: row.valid_from || null,
      valid_until: row.valid_until || null,
      limit_value: row.limit_value ?? null,
      used_value: row.used_value ?? null,
    })) as TrainingHubEntitlement[]
  } catch {
    return []
  }
}

export async function getTrainingHubContext(): Promise<TrainingHubContext> {
  const supabase = await createTrainingHubUserClient()
  const authUser = await readCurrentSupabaseAuthUser(supabase)
  const profile = await readProfileByAuthUser(supabase, authUser)

  if (!profile?.id) {
    throw new TrainingHubHttpError(
      'Current Supabase Auth user is not bridged to TrainingHub core_user_profiles.',
      403,
      'TRAININGHUB_PROFILE_NOT_BRIDGED',
      { authUserId: authUser.id, email: authUser.email || null },
    )
  }

  if (!isActiveRecord(profile)) {
    throw new TrainingHubHttpError('TrainingHub profile is not active.', 403, 'TRAININGHUB_PROFILE_INACTIVE')
  }

  const memberships = await readMemberships(supabase, profile.id, authUser.id)
  if (!memberships.length) {
    throw new TrainingHubHttpError('TrainingHub profile has no active organization membership.', 403, 'TRAININGHUB_NO_ACTIVE_MEMBERSHIP')
  }

  const metadata = (profile.metadata || {}) as JsonRecord
  const authMetadata = (authUser.user_metadata || {}) as JsonRecord
  const organizationIds = uniq([
    ...memberships.map((membership) => membership.organization_id),
    (profile as any).organization_id,
    metadata.organization_id as string | undefined,
    authMetadata.organization_id as string | undefined,
  ])
  const siteIds = uniq(memberships.map((membership) => membership.site_id))
  const organizations = await readOrganizations(supabase, organizationIds)
  const orgById = new Map(organizations.map((org) => [org.id, org]))

  const membershipsWithOrg = memberships.map((membership) => ({
    ...membership,
    organization: orgById.get(membership.organization_id) || null,
  }))

  const roles = await readRoleAssignments(supabase, profile.id, authUser.id)
  const roleIds = uniq(roles.map((role) => role.id))
  const permissions = await readPermissions(supabase, roleIds)
  const entitlements = await readEntitlements(supabase, organizationIds)

  const isSuperAdmin = roles.some((role) => role.code === 'super_admin') || permissions.includes('*')
  const isInternal =
    isSuperAdmin ||
    organizations.some((org) => INTERNAL_ORG_TYPES.has(String(org.organization_type || ''))) ||
    roles.some((role) => INTERNAL_ROLE_CODES.has(role.code))

  const primaryMembership = membershipsWithOrg[0] || null
  const primaryOrganization =
    organizations.find((org) => org.id === primaryMembership?.organization_id) ||
    organizations[0] ||
    null

  return {
    authUser,
    profile,
    memberships: membershipsWithOrg,
    organizations,
    roles,
    permissions: isSuperAdmin && !permissions.includes('*') ? ['*', ...permissions] : permissions,
    entitlements,
    isInternal,
    isSuperAdmin,
    organizationIds,
    siteIds,
    organization: primaryOrganization,
    organization_id: primaryOrganization?.id || organizationIds[0] || null,
    membership: primaryMembership,
  } as TrainingHubContext
}

export function requireTrainingHubPermission(context: TrainingHubContext, required: string | string[]) {
  if (context.isSuperAdmin || context.permissions.includes('*')) return

  const requiredList = Array.isArray(required) ? required : [required]
  const allowed = requiredList.some((permission) => context.permissions.includes(permission))

  if (!allowed) {
    throw new TrainingHubHttpError('Forbidden TrainingHub request.', 403, 'TRAININGHUB_FORBIDDEN', {
      required: requiredList,
    })
  }
}

export function serializeTrainingHubMe(context: TrainingHubContext) {
  return {
    authUser: {
      id: context.authUser.id,
      email: context.authUser.email || null,
    },
    profile: context.profile,
    organizations: context.organizations,
    memberships: context.memberships,
    roles: context.roles,
    permissions: context.permissions,
    entitlements: context.entitlements,
    access: {
      isInternal: context.isInternal,
      isSuperAdmin: context.isSuperAdmin,
      organizationIds: context.organizationIds,
      siteIds: context.siteIds,
    },
  }
}
