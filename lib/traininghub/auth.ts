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

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
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
  const { data, error } = await supabase
    .from('core_user_profiles')
    .select('id, auth_user_id, full_name, email, job_title, status, preferred_language, metadata')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PROFILE_LOOKUP_FAILED')
  return (data || null) as TrainingHubProfile | null
}

async function readOrganizations(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  organizationIds: string[],
) {
  if (!organizationIds.length) return []

  const { data, error } = await supabase
    .from('core_organizations')
    .select('id, name, legal_name, organization_type, status, country_code, city, currency_code, timezone, preferred_language')
    .in('id', organizationIds)

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ORGANIZATIONS_LOOKUP_FAILED')
  return (data || []) as TrainingHubOrganization[]
}

async function readMemberships(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>, profileId: string) {
  const { data, error } = await supabase
    .from('core_memberships')
    .select('id, organization_id, site_id, user_id, membership_type, status')
    .eq('user_id', profileId)
    .eq('status', 'active')

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_MEMBERSHIPS_LOOKUP_FAILED')
  return (data || []) as TrainingHubMembership[]
}

async function readRoleAssignments(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>, profileId: string) {
  const { data, error } = await supabase
    .from('authz_user_role_assignments')
    .select('id, organization_id, site_id, status, role_id, authz_roles(id, code, name, scope)')
    .eq('user_id', profileId)
    .eq('status', 'active')

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ROLES_LOOKUP_FAILED')

  return (data || [])
    .map((row: any) => ({
      id: String(row.role_id || row.authz_roles?.id || ''),
      code: String(row.authz_roles?.code || ''),
      name: row.authz_roles?.name || null,
      scope: row.authz_roles?.scope || null,
      organization_id: row.organization_id || null,
      site_id: row.site_id || null,
      assignment_status: row.status || null,
    }))
    .filter((role: TrainingHubRole) => role.id && role.code) as TrainingHubRole[]
}

async function readPermissions(supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>, roleIds: string[]) {
  if (!roleIds.length) return []

  const { data, error } = await supabase
    .from('authz_role_permissions')
    .select('role_id, authz_permissions(code)')
    .in('role_id', roleIds)

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PERMISSIONS_LOOKUP_FAILED')

  return uniq((data || []).map((row: any) => row.authz_permissions?.code))
}

async function readEntitlements(
  supabase: Awaited<ReturnType<typeof createTrainingHubUserClient>>,
  organizationIds: string[],
) {
  if (!organizationIds.length) return []

  const { data, error } = await supabase
    .from('ent_organization_entitlements')
    .select('id, organization_id, site_id, source_type, source_id, status, valid_from, valid_until, limit_value, used_value, ent_definitions(code, name, entitlement_type)')
    .in('organization_id', organizationIds)
    .in('status', ['active', 'pending'])

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ENTITLEMENTS_LOOKUP_FAILED')

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

  if (profile.status !== 'active') {
    throw new TrainingHubHttpError('TrainingHub profile is not active.', 403, 'TRAININGHUB_PROFILE_INACTIVE')
  }

  const memberships = await readMemberships(supabase, profile.id)
  if (!memberships.length) {
    throw new TrainingHubHttpError('TrainingHub profile has no active organization membership.', 403, 'TRAININGHUB_NO_ACTIVE_MEMBERSHIP')
  }

  const organizationIds = uniq(memberships.map((membership) => membership.organization_id))
  const siteIds = uniq(memberships.map((membership) => membership.site_id))
  const organizations = await readOrganizations(supabase, organizationIds)
  const orgById = new Map(organizations.map((org) => [org.id, org]))

  const membershipsWithOrg = memberships.map((membership) => ({
    ...membership,
    organization: orgById.get(membership.organization_id) || null,
  }))

  const roles = await readRoleAssignments(supabase, profile.id)
  const roleIds = uniq(roles.map((role) => role.id))
  const permissions = await readPermissions(supabase, roleIds)
  const entitlements = await readEntitlements(supabase, organizationIds)

  const isSuperAdmin = roles.some((role) => role.code === 'super_admin') || permissions.includes('*')
  const isInternal =
    isSuperAdmin ||
    organizations.some((org) => INTERNAL_ORG_TYPES.has(String(org.organization_type || ''))) ||
    roles.some((role) => INTERNAL_ROLE_CODES.has(role.code))

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
  }
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
