import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTrainingHubContext,
  requireTrainingHubPermission,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, any>

function clean(value: unknown) {
  return String(value || '').trim()
}

function emailValue(value: unknown) {
  const email = clean(value).toLowerCase()
  if (!email.includes('@')) {
    throw new TrainingHubHttpError('Email partenaire invalide.', 400, 'TRAININGHUB_PARTNER_USER_EMAIL_INVALID')
  }
  return email
}

function getServiceClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceKey) {
    throw new TrainingHubHttpError(
      'Configuration serveur manquante pour créer les accès partenaires. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local / Vercel.',
      500,
      'TRAININGHUB_SERVICE_ROLE_MISSING',
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function randomPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!'
  let value = 'AC-'
  for (let i = 0; i < 14; i += 1) value += alphabet[Math.floor(Math.random() * alphabet.length)]
  return value
}

async function findAuthUserByEmail(admin: any, email: string) {
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) return null
    return (data.users || []).find((user: any) => String(user.email || '').toLowerCase() === email) || null
  } catch {
    return null
  }
}

async function ensureRole(admin: any, roleCode: string) {
  const { data, error } = await admin
    .from('authz_roles')
    .select('id, code')
    .eq('code', roleCode)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ROLE_LOOKUP_FAILED')
  if (!data?.id) throw new TrainingHubHttpError(`Rôle TrainingHub introuvable: ${roleCode}`, 400, 'TRAININGHUB_ROLE_NOT_FOUND')
  return data
}

async function createPartnerOrganization(admin: any, body: JsonRecord, createdBy: string) {
  const partnerName = clean(body.partner_name)
  if (!partnerName) throw new TrainingHubHttpError('Nom établissement partenaire requis.', 400, 'TRAININGHUB_PARTNER_NAME_REQUIRED')

  const payloads = [
    {
      name: partnerName,
      legal_name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
      city: clean(body.partner_city) || null,
      phone: clean(body.partner_phone) || null,
      primary_contact_email: emailValue(body.email),
      billing_email: emailValue(body.email),
      metadata: {
        source: 'commercial_partner_user_workflow',
        notes: clean(body.partner_notes) || null,
        created_by: createdBy,
      },
    },
    {
      name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
      primary_contact_email: emailValue(body.email),
      billing_email: emailValue(body.email),
      metadata: {
        city: clean(body.partner_city) || null,
        phone: clean(body.partner_phone) || null,
        source: 'commercial_partner_user_workflow',
        created_by: createdBy,
      },
    },
    {
      name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
    },
  ]

  let lastError: any = null
  for (const payload of payloads) {
    const { data, error } = await admin.from('core_organizations').insert(payload).select('*').maybeSingle()
    if (!error && data?.id) return data
    lastError = error
  }

  throw new TrainingHubHttpError(lastError?.message || 'Dossier partenaire non créé.', 500, 'TRAININGHUB_PARTNER_ORG_CREATE_FAILED')
}

async function ensureBillAccount(admin: any, organizationId: string, body: JsonRecord, createdBy: string) {
  const { data: existing } = await admin
    .from('bill_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing?.id) {
    await admin.from('bill_accounts').update({ status: 'active' }).eq('id', existing.id)
    return existing
  }

  const payloads = [
    {
      organization_id: organizationId,
      status: 'active',
      currency_code: 'MAD',
      account_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      metadata: {
        valid_until: clean(body.valid_until) || null,
        source: 'commercial_partner_user_workflow',
        created_by: createdBy,
      },
    },
    {
      organization_id: organizationId,
      status: 'active',
      currency_code: 'MAD',
      metadata: {
        plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
        valid_until: clean(body.valid_until) || null,
        source: 'commercial_partner_user_workflow',
        created_by: createdBy,
      },
    },
    {
      organization_id: organizationId,
      status: 'active',
    },
  ]

  for (const payload of payloads) {
    const { data, error } = await admin.from('bill_accounts').insert(payload).select('*').maybeSingle()
    if (!error && data?.id) return data
  }

  return null
}

async function ensureSubscription(admin: any, organizationId: string, accountId: string | null, body: JsonRecord, createdBy: string) {
  const payloads = [
    {
      organization_id: organizationId,
      account_id: accountId,
      plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      status: clean(body.plan_status) || 'active',
      currency_code: 'MAD',
      current_period_end: clean(body.valid_until) || null,
      metadata: {
        source: 'commercial_partner_user_workflow',
        created_by: createdBy,
      },
    },
    {
      organization_id: organizationId,
      plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      status: clean(body.plan_status) || 'active',
      currency_code: 'MAD',
    },
  ]

  for (const payload of payloads) {
    const { data, error } = await admin.from('bill_subscriptions').insert(payload).select('*').maybeSingle()
    if (!error && data?.id) return data
  }

  return null
}

async function ensureProfile(admin: any, payload: JsonRecord) {
  const profilePayload = {
    id: payload.auth_user_id,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    email: payload.email,
    job_title: payload.job_title || null,
    status: 'active',
    preferred_language: 'fr',
    metadata: {
      source: 'traininghub_commercial_partner_user',
      partner_account_user: true,
      created_by: payload.created_by,
    },
  }

  const attempts = [
    () => admin.from('core_user_profiles').upsert(profilePayload, { onConflict: 'auth_user_id' }).select('*').maybeSingle(),
    () => admin.from('core_user_profiles').upsert(profilePayload, { onConflict: 'id' }).select('*').maybeSingle(),
    () => admin.from('core_user_profiles').insert(profilePayload).select('*').maybeSingle(),
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const { data, error } = await attempt()
    if (!error && data?.id) return data
    lastError = error
  }

  throw new TrainingHubHttpError(lastError?.message || 'Profil partenaire non créé.', 500, 'TRAININGHUB_PARTNER_PROFILE_FAILED')
}

async function ensureMembership(admin: any, profileId: string, organizationId: string) {
  const { data: existing, error: existingError } = await admin
    .from('core_memberships')
    .select('*')
    .eq('user_id', profileId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existingError) throw new TrainingHubHttpError(existingError.message, 500, 'TRAININGHUB_MEMBERSHIP_LOOKUP_FAILED')
  if (existing?.id) {
    const { data, error } = await admin
      .from('core_memberships')
      .update({ status: 'active', membership_type: existing.membership_type || 'partner_user' })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle()

    if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_MEMBERSHIP_REACTIVATE_FAILED')
    return data || existing
  }

  const { data, error } = await admin
    .from('core_memberships')
    .insert({
      user_id: profileId,
      organization_id: organizationId,
      membership_type: 'partner_user',
      status: 'active',
    })
    .select('*')
    .maybeSingle()

  if (error || !data) throw new TrainingHubHttpError(error?.message || 'Membership partenaire non créé.', 500, 'TRAININGHUB_MEMBERSHIP_CREATE_FAILED')
  return data
}

async function ensureRoleAssignment(admin: any, profileId: string, organizationId: string, roleId: string) {
  const { data: existing, error: existingError } = await admin
    .from('authz_user_role_assignments')
    .select('*')
    .eq('user_id', profileId)
    .eq('organization_id', organizationId)
    .eq('role_id', roleId)
    .maybeSingle()

  if (existingError) throw new TrainingHubHttpError(existingError.message, 500, 'TRAININGHUB_ROLE_ASSIGNMENT_LOOKUP_FAILED')
  if (existing?.id) {
    await admin.from('authz_user_role_assignments').update({ status: 'active' }).eq('id', existing.id)
    return existing
  }

  const { data, error } = await admin
    .from('authz_user_role_assignments')
    .insert({
      user_id: profileId,
      organization_id: organizationId,
      role_id: roleId,
      status: 'active',
    })
    .select('*')
    .maybeSingle()

  if (error || !data) throw new TrainingHubHttpError(error?.message || 'Rôle partenaire non affecté.', 500, 'TRAININGHUB_ROLE_ASSIGNMENT_CREATE_FAILED')
  return data
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_PARTNER_USER_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, ['training.access.manage', 'training.proposal.create', 'training.proposal.send'])

    const body = (await request.json()) as JsonRecord
    const action = clean(body.action)
    const admin: any = getServiceClient()

    if (action === 'suspend' || action === 'reactivate') {
      const profileId = clean(body.profile_id)
      if (!profileId) throw new TrainingHubHttpError('Profil utilisateur requis.', 400, 'TRAININGHUB_PROFILE_ID_REQUIRED')

      const status = action === 'suspend' ? 'suspended' : 'active'
      const membershipStatus = action === 'suspend' ? 'suspended' : 'active'

      const { data: profile, error: profileError } = await admin
        .from('core_user_profiles')
        .update({ status })
        .eq('id', profileId)
        .select('*')
        .maybeSingle()

      if (profileError || !profile) throw new TrainingHubHttpError(profileError?.message || 'Profil non modifié.', 500, 'TRAININGHUB_PROFILE_STATUS_FAILED')

      await admin.from('core_memberships').update({ status: membershipStatus }).eq('user_id', profileId)
      await admin.from('authz_user_role_assignments').update({ status: membershipStatus }).eq('user_id', profileId)

      return NextResponse.json({ ok: true, data: profile })
    }

    if (action !== 'create') {
      throw new TrainingHubHttpError('Action utilisateur partenaire inconnue.', 400, 'TRAININGHUB_PARTNER_USER_ACTION_UNKNOWN')
    }

    const fullName = clean(body.full_name)
    const email = emailValue(body.email)
    const jobTitle = clean(body.job_title) || 'Utilisateur partenaire'
    const roleCode = clean(body.role_code) || 'partner_owner'
    const temporaryPassword = clean(body.temporary_password) || randomPassword()
    const shouldCreatePartner = body.create_partner === true || body.create_partner === 'true'

    if (!fullName) throw new TrainingHubHttpError('Nom complet requis.', 400, 'TRAININGHUB_PARTNER_USER_NAME_REQUIRED')
    if (temporaryPassword.length < 8) throw new TrainingHubHttpError('Mot de passe temporaire trop court.', 400, 'TRAININGHUB_TEMP_PASSWORD_TOO_SHORT')

    let organization: any = null

    if (shouldCreatePartner) {
      organization = await createPartnerOrganization(admin, body, context.profile.id)
      const account = await ensureBillAccount(admin, organization.id, body, context.profile.id)
      await ensureSubscription(admin, organization.id, account?.id || null, body, context.profile.id)
    } else {
      const organizationId = clean(body.organization_id)
      if (!organizationId) throw new TrainingHubHttpError('Établissement partenaire requis.', 400, 'TRAININGHUB_PARTNER_ORG_REQUIRED')

      const { data, error } = await admin
        .from('core_organizations')
        .select('id, name, organization_type, status')
        .eq('id', organizationId)
        .maybeSingle()

      if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Partenaire introuvable.', 404, 'TRAININGHUB_PARTNER_ORG_NOT_FOUND')
      organization = data
      await ensureBillAccount(admin, organization.id, body, context.profile.id)
    }

    let authUser = await findAuthUserByEmail(admin, email)

    if (!authUser?.id) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          job_title: jobTitle,
          source: 'traininghub_partner_account',
        },
      })

      if (createError || !created.user?.id) {
        throw new TrainingHubHttpError(createError?.message || 'Compte de connexion partenaire non créé.', 500, 'TRAININGHUB_AUTH_USER_CREATE_FAILED')
      }

      authUser = created.user
    } else {
      await admin.auth.admin.updateUserById(authUser.id, {
        password: temporaryPassword,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          full_name: fullName,
          job_title: jobTitle,
          source: 'traininghub_partner_account',
        },
      })
    }

    const profile = await ensureProfile(admin, {
      auth_user_id: authUser.id,
      full_name: fullName,
      email,
      job_title: jobTitle,
      created_by: context.profile.id,
    })

    const membership = await ensureMembership(admin, profile.id, organization.id)
    const role = await ensureRole(admin, roleCode)
    const roleAssignment = await ensureRoleAssignment(admin, profile.id, organization.id, role.id)

    return NextResponse.json({
      ok: true,
      data: {
        email,
        temporary_password: temporaryPassword,
        organization,
        profile,
        membership,
        role,
        roleAssignment,
      },
    })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
