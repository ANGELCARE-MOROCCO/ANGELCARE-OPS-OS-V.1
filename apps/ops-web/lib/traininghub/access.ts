import { createTrainingHubUserClient } from './supabase'
import { createTrainingHubAdminClient, findTrainingHubAuthUserByEmail } from './admin'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import type { JsonRecord, TrainingHubContext } from './types'

const INTERNAL_ACCESS_PERMISSIONS = [
  'settings.security.manage',
  'partner.user.invite',
  'partner.user.remove',
]

function clean(value: unknown) {
  return String(value || '').trim()
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase()
}

function optionalUuid(value: unknown) {
  const text = clean(value)
  return text || null
}

function metadata(value: unknown): JsonRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonRecord
  return {}
}

export function requireTrainingHubAccessManager(context: TrainingHubContext) {
  if (context.isSuperAdmin) return
  if (!context.isInternal) {
    throw new TrainingHubHttpError('Only AngelCare TrainingHub internal users can manage access.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, INTERNAL_ACCESS_PERMISSIONS)
}

export async function getTrainingHubAccessDiagnostics(context: TrainingHubContext) {
  requireTrainingHubAccessManager(context)
  const supabase = await createTrainingHubUserClient()

  async function safeCount(table: string) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return {
      table,
      ok: !error,
      count: count || 0,
      error: error?.message || null,
    }
  }

  const tables = [
    'core_organizations',
    'core_organization_sites',
    'core_user_profiles',
    'core_memberships',
    'authz_roles',
    'authz_permissions',
    'authz_user_role_assignments',
    'ent_definitions',
    'ent_organization_entitlements',
    'trn_courses',
    'trn_sessions',
    'learn_entitlements',
  ]

  const counts = []
  for (const table of tables) counts.push(await safeCount(table))

  return {
    status: 'traininghub-access-foundation-ready',
    access: {
      profileId: context.profile.id,
      email: context.profile.email,
      isInternal: context.isInternal,
      isSuperAdmin: context.isSuperAdmin,
      organizations: context.organizations.map((org) => ({
        id: org.id,
        name: org.name,
        type: org.organization_type,
        status: org.status,
      })),
      roles: context.roles.map((role) => role.code),
      permissions: context.permissions,
    },
    env: {
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    counts,
  }
}

export async function listTrainingHubRoles(context: TrainingHubContext) {
  requireTrainingHubAccessManager(context)
  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('authz_roles')
    .select('id, code, name, scope, description, is_system_role, status, created_at')
    .order('scope', { ascending: true })
    .order('code', { ascending: true })

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ROLES_LIST_FAILED')
  return data || []
}

export async function listTrainingHubOrganizations(context: TrainingHubContext, url: URL) {
  requireTrainingHubAccessManager(context)
  const supabase = await createTrainingHubUserClient()
  const type = clean(url.searchParams.get('type'))
  const status = clean(url.searchParams.get('status'))
  const q = clean(url.searchParams.get('q'))
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200)

  let query = supabase
    .from('core_organizations')
    .select('id, name, legal_name, organization_type, status, country_code, city, currency_code, timezone, preferred_language, primary_contact_email, primary_contact_phone, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('organization_type', type)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`name.ilike.%${q}%,legal_name.ilike.%${q}%,primary_contact_email.ilike.%${q}%`)

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ORGANIZATIONS_LIST_FAILED')
  return data || []
}

export async function createTrainingHubOrganization(context: TrainingHubContext, body: any) {
  requireTrainingHubAccessManager(context)
  const admin = createTrainingHubAdminClient()

  const name = clean(body?.name || body?.school_name || body?.organization_name)
  if (!name) throw new TrainingHubHttpError('Organization name is required.', 400, 'TRAININGHUB_ORG_NAME_REQUIRED')

  const organizationType = clean(body?.organization_type || body?.organizationType || 'partner_school') || 'partner_school'
  const allowedTypes = new Set(['partner_school', 'trainer_company', 'angelcare_internal'])
  if (!allowedTypes.has(organizationType)) {
    throw new TrainingHubHttpError('Invalid TrainingHub organization type.', 400, 'TRAININGHUB_ORG_TYPE_INVALID', {
      allowed: Array.from(allowedTypes),
    })
  }

  if (organizationType === 'angelcare_internal' && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Only super admin can create internal AngelCare organizations.', 403, 'TRAININGHUB_SUPER_ADMIN_REQUIRED')
  }

  const payload = {
    name,
    legal_name: clean(body?.legal_name || body?.legalName) || name,
    organization_type: organizationType,
    status: clean(body?.status || 'active') || 'active',
    country_code: clean(body?.country_code || body?.countryCode || 'MA') || 'MA',
    city: clean(body?.city || 'Rabat') || 'Rabat',
    region: clean(body?.region) || null,
    currency_code: clean(body?.currency_code || body?.currencyCode || 'MAD') || 'MAD',
    timezone: clean(body?.timezone || 'Africa/Casablanca') || 'Africa/Casablanca',
    preferred_language: clean(body?.preferred_language || body?.preferredLanguage || 'fr') || 'fr',
    primary_contact_name: clean(body?.primary_contact_name || body?.primaryContactName) || null,
    primary_contact_email: cleanLower(body?.primary_contact_email || body?.primaryContactEmail) || null,
    primary_contact_phone: clean(body?.primary_contact_phone || body?.primaryContactPhone) || null,
    billing_email: cleanLower(body?.billing_email || body?.billingEmail || body?.primary_contact_email || body?.primaryContactEmail) || null,
    commercial_owner_id: context.profile.id,
    academy_owner_id: context.profile.id,
    metadata: {
      created_from: 'traininghub_access_api',
      created_by_profile_id: context.profile.id,
      ...(metadata(body?.metadata)),
    },
  }

  const { data: organization, error } = await admin
    .from('core_organizations')
    .insert(payload)
    .select('id, name, legal_name, organization_type, status, country_code, city, currency_code, timezone, preferred_language, primary_contact_email, primary_contact_phone, created_at')
    .single()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ORG_CREATE_FAILED')

  let site = null
  if (body?.create_site !== false && organizationType === 'partner_school') {
    const { data: createdSite, error: siteError } = await admin
      .from('core_organization_sites')
      .insert({
        organization_id: organization.id,
        site_name: clean(body?.site_name || body?.siteName || name) || name,
        city: clean(body?.site_city || body?.siteCity || payload.city) || payload.city,
        address_line: clean(body?.address_line || body?.addressLine) || null,
        capacity_children: Number.isFinite(Number(body?.capacity_children || body?.capacityChildren))
          ? Number(body?.capacity_children || body?.capacityChildren)
          : null,
        staff_count: Number.isFinite(Number(body?.staff_count || body?.staffCount)) ? Number(body?.staff_count || body?.staffCount) : null,
        active_children_count: Number.isFinite(Number(body?.active_children_count || body?.activeChildrenCount))
          ? Number(body?.active_children_count || body?.activeChildrenCount)
          : null,
        school_type: clean(body?.school_type || body?.schoolType || 'creche_maternelle') || 'creche_maternelle',
        status: 'active',
        metadata: { created_from: 'traininghub_access_api' },
      })
      .select('id, organization_id, site_name, city, address_line, capacity_children, staff_count, active_children_count, school_type, status')
      .single()

    if (siteError) throw new TrainingHubHttpError(siteError.message, 500, 'TRAININGHUB_SITE_CREATE_FAILED')
    site = createdSite
  }

  if (organizationType === 'partner_school') {
    await admin.from('bill_accounts').insert({
      organization_id: organization.id,
      billing_name: payload.legal_name,
      billing_email: payload.billing_email,
      billing_phone: payload.primary_contact_phone,
      country_code: payload.country_code,
      currency_code: payload.currency_code,
      status: 'active',
      metadata: { created_from: 'traininghub_access_api' },
    })
  }

  await admin.from('auto_events').insert({
    event_type: 'traininghub.organization_created',
    organization_id: organization.id,
    actor_user_id: context.profile.id,
    source_type: 'core_organizations',
    source_id: organization.id,
    payload: { organization_type: organization.organization_type, name: organization.name },
    status: 'pending',
  })

  return { organization, site }
}

export async function listTrainingHubUsers(context: TrainingHubContext, url: URL) {
  requireTrainingHubAccessManager(context)
  const supabase = await createTrainingHubUserClient()
  const organizationId = clean(url.searchParams.get('organization_id') || url.searchParams.get('organizationId'))
  const q = clean(url.searchParams.get('q'))
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 80), 1), 200)

  let query = supabase
    .from('core_user_profiles')
    .select('id, auth_user_id, full_name, email, phone, job_title, status, preferred_language, last_login_at, created_at, core_memberships(id, organization_id, site_id, membership_type, status), authz_user_role_assignments(id, organization_id, site_id, status, authz_roles(id, code, name, scope))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_USERS_LIST_FAILED')

  const rows = data || []
  if (!organizationId) return rows

  return rows.filter((row: any) => (row.core_memberships || []).some((membership: any) => membership.organization_id === organizationId))
}

export async function bridgeExistingSupabaseAuthUserToTrainingHub(context: TrainingHubContext, body: any) {
  requireTrainingHubAccessManager(context)
  const admin = createTrainingHubAdminClient()

  const email = cleanLower(body?.email)
  const organizationId = clean(body?.organization_id || body?.organizationId)
  const siteId = optionalUuid(body?.site_id || body?.siteId)
  const roleCode = clean(body?.role_code || body?.roleCode || 'partner_owner') || 'partner_owner'
  const membershipType = clean(body?.membership_type || body?.membershipType || 'partner_owner') || 'partner_owner'

  if (!email) throw new TrainingHubHttpError('Email is required.', 400, 'TRAININGHUB_BRIDGE_EMAIL_REQUIRED')
  if (!organizationId) throw new TrainingHubHttpError('organization_id is required.', 400, 'TRAININGHUB_BRIDGE_ORG_REQUIRED')

  const authUser = await findTrainingHubAuthUserByEmail(email)
  if (!authUser?.id) {
    throw new TrainingHubHttpError(
      'Supabase Auth user not found. Create/invite the login account in Supabase Authentication first, then bridge it.',
      404,
      'TRAININGHUB_AUTH_USER_NOT_FOUND',
      { email },
    )
  }

  const { data: organization, error: orgError } = await admin
    .from('core_organizations')
    .select('id, name, organization_type, status')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) throw new TrainingHubHttpError(orgError.message, 500, 'TRAININGHUB_BRIDGE_ORG_LOOKUP_FAILED')
  if (!organization?.id) throw new TrainingHubHttpError('TrainingHub organization not found.', 404, 'TRAININGHUB_BRIDGE_ORG_NOT_FOUND')

  const { data: role, error: roleError } = await admin
    .from('authz_roles')
    .select('id, code, name, scope')
    .eq('code', roleCode)
    .maybeSingle()

  if (roleError) throw new TrainingHubHttpError(roleError.message, 500, 'TRAININGHUB_BRIDGE_ROLE_LOOKUP_FAILED')
  if (!role?.id) throw new TrainingHubHttpError('TrainingHub role not found.', 404, 'TRAININGHUB_BRIDGE_ROLE_NOT_FOUND', { roleCode })

  const fullName = clean(body?.full_name || body?.fullName || authUser.user_metadata?.full_name || email)

  const { data: profile, error: profileError } = await admin
    .from('core_user_profiles')
    .upsert(
      {
        auth_user_id: authUser.id,
        full_name: fullName,
        email,
        phone: clean(body?.phone) || authUser.phone || null,
        job_title: clean(body?.job_title || body?.jobTitle || role.name || roleCode) || null,
        preferred_language: clean(body?.preferred_language || body?.preferredLanguage || 'fr') || 'fr',
        status: 'active',
        metadata: {
          bridged_from: 'traininghub_access_api',
          bridged_by_profile_id: context.profile.id,
          role_code: roleCode,
          ...(metadata(body?.metadata)),
        },
      },
      { onConflict: 'auth_user_id' },
    )
    .select('id, auth_user_id, full_name, email, job_title, status')
    .single()

  if (profileError) throw new TrainingHubHttpError(profileError.message, 500, 'TRAININGHUB_PROFILE_BRIDGE_FAILED')

  const { data: existingMembership } = await admin
    .from('core_memberships')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', profile.id)
    .eq('membership_type', membershipType)
    .maybeSingle()

  let membership = existingMembership
  if (!membership?.id) {
    const { data: createdMembership, error: membershipError } = await admin
      .from('core_memberships')
      .insert({
        organization_id: organizationId,
        site_id: siteId,
        user_id: profile.id,
        membership_type: membershipType,
        status: 'active',
        joined_at: new Date().toISOString(),
        invited_by: context.profile.id,
        metadata: { bridged_from: 'traininghub_access_api' },
      })
      .select('id, organization_id, site_id, user_id, membership_type, status')
      .single()

    if (membershipError) throw new TrainingHubHttpError(membershipError.message, 500, 'TRAININGHUB_MEMBERSHIP_BRIDGE_FAILED')
    membership = createdMembership
  }

  const { data: existingAssignment } = await admin
    .from('authz_user_role_assignments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', profile.id)
    .eq('role_id', role.id)
    .eq('status', 'active')
    .maybeSingle()

  let assignment = existingAssignment
  if (!assignment?.id) {
    const { data: createdAssignment, error: assignmentError } = await admin
      .from('authz_user_role_assignments')
      .insert({
        user_id: profile.id,
        organization_id: organizationId,
        site_id: siteId,
        role_id: role.id,
        assigned_by: context.profile.id,
        assigned_at: new Date().toISOString(),
        status: 'active',
        metadata: {
          assignment_reason: 'TrainingHub access bridge',
          assigned_from: 'traininghub_access_api',
        },
      })
      .select('id, user_id, organization_id, site_id, role_id, status')
      .single()

    if (assignmentError) throw new TrainingHubHttpError(assignmentError.message, 500, 'TRAININGHUB_ROLE_ASSIGNMENT_FAILED')
    assignment = createdAssignment
  }

  await admin.from('auto_events').insert({
    event_type: 'traininghub.user_bridged',
    organization_id: organizationId,
    actor_user_id: context.profile.id,
    source_type: 'core_user_profiles',
    source_id: profile.id,
    payload: { email, role_code: roleCode, membership_type: membershipType },
    status: 'pending',
  })

  return { authUser: { id: authUser.id, email: authUser.email }, profile, organization, membership, role, assignment }
}

export async function assignTrainingHubRole(context: TrainingHubContext, body: any) {
  requireTrainingHubAccessManager(context)
  const admin = createTrainingHubAdminClient()

  const userId = clean(body?.user_id || body?.userId)
  const organizationId = clean(body?.organization_id || body?.organizationId)
  const siteId = optionalUuid(body?.site_id || body?.siteId)
  const roleCode = clean(body?.role_code || body?.roleCode)

  if (!userId) throw new TrainingHubHttpError('user_id is required.', 400, 'TRAININGHUB_ASSIGN_ROLE_USER_REQUIRED')
  if (!organizationId) throw new TrainingHubHttpError('organization_id is required.', 400, 'TRAININGHUB_ASSIGN_ROLE_ORG_REQUIRED')
  if (!roleCode) throw new TrainingHubHttpError('role_code is required.', 400, 'TRAININGHUB_ASSIGN_ROLE_CODE_REQUIRED')

  const { data: role, error: roleError } = await admin.from('authz_roles').select('id, code, name, scope').eq('code', roleCode).maybeSingle()
  if (roleError) throw new TrainingHubHttpError(roleError.message, 500, 'TRAININGHUB_ASSIGN_ROLE_LOOKUP_FAILED')
  if (!role?.id) throw new TrainingHubHttpError('Role not found.', 404, 'TRAININGHUB_ASSIGN_ROLE_NOT_FOUND')

  const { data: existing } = await admin
    .from('authz_user_role_assignments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('role_id', role.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existing?.id) return { assignment: existing, role, reused: true }

  const { data, error } = await admin
    .from('authz_user_role_assignments')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      site_id: siteId,
      role_id: role.id,
      assigned_by: context.profile.id,
      assigned_at: new Date().toISOString(),
      status: 'active',
      metadata: { assigned_from: 'traininghub_access_api' },
    })
    .select('id, user_id, organization_id, site_id, role_id, status')
    .single()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ASSIGN_ROLE_FAILED')
  return { assignment: data, role, reused: false }
}

export async function grantTrainingHubOrganizationEntitlement(context: TrainingHubContext, body: any) {
  requireTrainingHubAccessManager(context)
  const admin = createTrainingHubAdminClient()

  const organizationId = clean(body?.organization_id || body?.organizationId)
  const siteId = optionalUuid(body?.site_id || body?.siteId)
  const entitlementCode = clean(body?.entitlement_code || body?.entitlementCode)

  if (!organizationId) throw new TrainingHubHttpError('organization_id is required.', 400, 'TRAININGHUB_GRANT_ENT_ORG_REQUIRED')
  if (!entitlementCode) throw new TrainingHubHttpError('entitlement_code is required.', 400, 'TRAININGHUB_GRANT_ENT_CODE_REQUIRED')

  const { data: definition, error: defError } = await admin
    .from('ent_definitions')
    .select('id, code, name, entitlement_type')
    .eq('code', entitlementCode)
    .maybeSingle()

  if (defError) throw new TrainingHubHttpError(defError.message, 500, 'TRAININGHUB_GRANT_ENT_LOOKUP_FAILED')
  if (!definition?.id) throw new TrainingHubHttpError('Entitlement definition not found.', 404, 'TRAININGHUB_GRANT_ENT_NOT_FOUND')

  const { data, error } = await admin
    .from('ent_organization_entitlements')
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      entitlement_definition_id: definition.id,
      source_type: clean(body?.source_type || body?.sourceType || 'manual_grant') || 'manual_grant',
      source_id: optionalUuid(body?.source_id || body?.sourceId),
      status: clean(body?.status || 'active') || 'active',
      valid_from: body?.valid_from || body?.validFrom || new Date().toISOString(),
      valid_until: body?.valid_until || body?.validUntil || null,
      limit_value: Number.isFinite(Number(body?.limit_value || body?.limitValue)) ? Number(body?.limit_value || body?.limitValue) : null,
      used_value: 0,
      metadata: {
        granted_from: 'traininghub_access_api',
        granted_by_profile_id: context.profile.id,
        ...(metadata(body?.metadata)),
      },
    })
    .select('id, organization_id, site_id, source_type, status, valid_from, valid_until, limit_value, used_value')
    .single()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_GRANT_ENT_FAILED')
  return { entitlement: data, definition }
}
