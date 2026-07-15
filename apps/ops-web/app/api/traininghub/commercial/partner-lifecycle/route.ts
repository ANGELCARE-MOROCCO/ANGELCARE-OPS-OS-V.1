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

const WRITE_PERMISSIONS = ['training.access.manage', 'training.proposal.create', 'training.proposal.send']

function clean(value: unknown) {
  return String(value || '').trim()
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function emailValue(value: unknown) {
  const email = normalize(value)
  if (!email || !email.includes('@')) {
    throw new TrainingHubHttpError('Email invalide.', 400, 'TRAININGHUB_LIFECYCLE_EMAIL_INVALID')
  }
  return email
}

function randomPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!'
  let value = 'AC-'
  for (let i = 0; i < 14; i += 1) value += alphabet[Math.floor(Math.random() * alphabet.length)]
  return value
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceKey) {
    throw new TrainingHubHttpError(
      'Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY requis pour les actions production TrainingHub.',
      500,
      'TRAININGHUB_SERVICE_ROLE_MISSING',
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any
}

async function selectCount(admin: any, table: string, field?: string, value?: string) {
  try {
    let query = admin.from(table).select('id', { count: 'exact', head: true })
    if (field && value) query = query.eq(field, value)
    const { count } = await query
    return count || 0
  } catch {
    return 0
  }
}

async function insertFirst(admin: any, table: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null
  for (const payload of payloads) {
    const { data, error } = await admin.from(table).insert(payload).select('*').maybeSingle()
    if (!error && data) return data
    lastError = error
  }
  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function updateFirst(admin: any, table: string, id: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null
  for (const payload of payloads) {
    const { data, error } = await admin.from(table).update(payload).eq('id', id).select('*').maybeSingle()
    if (!error && data) return data
    lastError = error
  }
  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function audit(admin: any, input: JsonRecord) {
  const payload = {
    organization_id: input.organization_id || null,
    actor_user_id: input.actor_user_id || null,
    entity_type: input.entity_type || 'traininghub_partner_lifecycle',
    entity_id: input.entity_id || input.organization_id || null,
    action: input.action || 'traininghub.lifecycle.action',
    severity: input.severity || 'info',
    message: input.message || input.action || 'Action TrainingHub',
    metadata: {
      source: 'traininghub_production_hardening',
      ...input.metadata,
    },
  }

  const attempts = [
    () => admin.from('audit_change_logs').insert(payload).select('*').maybeSingle(),
    () => admin.from('audit_security_logs').insert(payload).select('*').maybeSingle(),
    () =>
      admin.from('auto_events').insert({
        organization_id: payload.organization_id,
        event_type: payload.action,
        title: payload.message,
        status: 'open',
        payload: payload.metadata,
      }).select('*').maybeSingle(),
  ]

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt()
      if (!error && data) return data
    } catch {
      // best-effort audit fallback
    }
  }

  return null
}

async function findAuthUserByEmail(admin: any, email: string) {
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) return null
    return (data.users || []).find((user: any) => normalize(user.email) === email) || null
  } catch {
    return null
  }
}

async function ensureAuthUser(admin: any, body: JsonRecord) {
  const email = emailValue(body.email)
  const password = clean(body.temporary_password) || randomPassword()
  const fullName = clean(body.full_name) || email
  const jobTitle = clean(body.job_title) || 'Utilisateur partenaire'

  let user = await findAuthUserByEmail(admin, email)
  if (!user?.id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        job_title: jobTitle,
        source: 'traininghub_partner_lifecycle',
      },
    })

    if (error || !data?.user?.id) {
      throw new TrainingHubHttpError(error?.message || 'Compte de connexion partenaire non créé.', 500, 'TRAININGHUB_AUTH_CREATE_FAILED')
    }

    user = data.user
  } else if (body.reset_password === true || body.reset_password === 'true') {
    await admin.auth.admin.updateUserById(user.id, {
      password,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: fullName,
        job_title: jobTitle,
        source: 'traininghub_partner_lifecycle',
      },
    })
  }

  return { user, temporary_password: password }
}

async function ensureOrganization(admin: any, body: JsonRecord, actorId: string) {
  const existingId = clean(body.organization_id)
  if (existingId) {
    const { data, error } = await admin
      .from('core_organizations')
      .select('*')
      .eq('id', existingId)
      .maybeSingle()

    if (error || !data?.id) {
      throw new TrainingHubHttpError(error?.message || 'Partenaire introuvable.', 404, 'TRAININGHUB_PARTNER_NOT_FOUND')
    }

    return data
  }

  const partnerName = clean(body.partner_name || body.organization_name)
  if (!partnerName) {
    throw new TrainingHubHttpError('Nom du partenaire requis.', 400, 'TRAININGHUB_PARTNER_NAME_REQUIRED')
  }

  const payloads = [
    {
      name: partnerName,
      legal_name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
      city: clean(body.partner_city) || null,
      phone: clean(body.partner_phone) || null,
      primary_contact_email: clean(body.email) || null,
      billing_email: clean(body.billing_email || body.email) || null,
      metadata: {
        source: 'traininghub_partner_lifecycle',
        lifecycle_stage: 'account_created',
        notes: clean(body.partner_notes) || null,
        created_by: actorId,
      },
    },
    {
      name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
      primary_contact_email: clean(body.email) || null,
      billing_email: clean(body.billing_email || body.email) || null,
      metadata: {
        city: clean(body.partner_city) || null,
        phone: clean(body.partner_phone) || null,
        source: 'traininghub_partner_lifecycle',
        lifecycle_stage: 'account_created',
        created_by: actorId,
      },
    },
    {
      name: partnerName,
      organization_type: clean(body.partner_type) || 'partner_school',
      status: 'active',
    },
  ]

  return insertFirst(admin, 'core_organizations', payloads, 'TRAININGHUB_ORG_CREATE_FAILED', 'Dossier partenaire non créé.')
}

async function ensureBillAccount(admin: any, organizationId: string, body: JsonRecord, actorId: string) {
  const { data: existing } = await admin
    .from('bill_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing?.id) {
    return updateFirst(
      admin,
      'bill_accounts',
      existing.id,
      [
        {
          status: 'active',
          currency_code: 'MAD',
          metadata: {
            ...(existing.metadata || {}),
            lifecycle_stage: 'account_active',
            updated_by: actorId,
          },
        },
        { status: 'active' },
      ],
      'TRAININGHUB_ACCOUNT_UPDATE_FAILED',
      'Compte partenaire non réactivé.',
    )
  }

  const payloads = [
    {
      organization_id: organizationId,
      status: 'active',
      currency_code: 'MAD',
      account_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      metadata: {
        source: 'traininghub_partner_lifecycle',
        lifecycle_stage: 'account_active',
        valid_until: clean(body.valid_until) || null,
        created_by: actorId,
      },
    },
    {
      organization_id: organizationId,
      status: 'active',
      currency_code: 'MAD',
      metadata: {
        plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
        lifecycle_stage: 'account_active',
        valid_until: clean(body.valid_until) || null,
        created_by: actorId,
      },
    },
    {
      organization_id: organizationId,
      status: 'active',
    },
  ]

  return insertFirst(admin, 'bill_accounts', payloads, 'TRAININGHUB_ACCOUNT_CREATE_FAILED', 'Compte partenaire non créé.')
}

async function ensureSubscription(admin: any, organizationId: string, accountId: string | null, body: JsonRecord, actorId: string) {
  const { data: existing } = await admin
    .from('bill_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id && !body.force_new_subscription) {
    return updateFirst(
      admin,
      'bill_subscriptions',
      existing.id,
      [
        {
          status: clean(body.plan_status) || 'active',
          plan_name: clean(body.plan_name) || existing.plan_name || 'Compte partenaire TrainingHub',
          current_period_end: clean(body.valid_until) || existing.current_period_end || null,
          metadata: {
            ...(existing.metadata || {}),
            updated_by: actorId,
            source: 'traininghub_partner_lifecycle',
          },
        },
        { status: clean(body.plan_status) || 'active' },
      ],
      'TRAININGHUB_SUBSCRIPTION_UPDATE_FAILED',
      'Abonnement partenaire non mis à jour.',
    )
  }

  const payloads = [
    {
      organization_id: organizationId,
      account_id: accountId,
      plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      plan_code: clean(body.plan_code) || 'traininghub_partner',
      status: clean(body.plan_status) || 'active',
      currency_code: 'MAD',
      billing_interval: clean(body.billing_interval) || 'annual',
      current_period_start: new Date().toISOString(),
      current_period_end: clean(body.valid_until) || null,
      metadata: {
        source: 'traininghub_partner_lifecycle',
        created_by: actorId,
      },
    },
    {
      organization_id: organizationId,
      plan_name: clean(body.plan_name) || 'Compte partenaire TrainingHub',
      status: clean(body.plan_status) || 'active',
      currency_code: 'MAD',
    },
  ]

  try {
    return await insertFirst(admin, 'bill_subscriptions', payloads, 'TRAININGHUB_SUBSCRIPTION_CREATE_FAILED', 'Abonnement partenaire non créé.')
  } catch {
    return null
  }
}

async function ensureProfile(admin: any, authUserId: string, body: JsonRecord, actorId: string) {
  const profilePayload = {
    id: authUserId,
    auth_user_id: authUserId,
    full_name: clean(body.full_name) || emailValue(body.email),
    email: emailValue(body.email),
    job_title: clean(body.job_title) || 'Utilisateur partenaire',
    status: 'active',
    preferred_language: 'fr',
    metadata: {
      source: 'traininghub_partner_lifecycle',
      partner_account_user: true,
      created_by: actorId,
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

  throw new TrainingHubHttpError(lastError?.message || 'Profil partenaire non créé.', 500, 'TRAININGHUB_PROFILE_CREATE_FAILED')
}

async function ensureMembership(admin: any, profileId: string, organizationId: string) {
  const { data: existing } = await admin
    .from('core_memberships')
    .select('*')
    .eq('user_id', profileId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing?.id) {
    await admin.from('core_memberships').update({ status: 'active', membership_type: existing.membership_type || 'partner_user' }).eq('id', existing.id)
    return existing
  }

  return insertFirst(
    admin,
    'core_memberships',
    [
      {
        user_id: profileId,
        organization_id: organizationId,
        membership_type: 'partner_user',
        status: 'active',
      },
    ],
    'TRAININGHUB_MEMBERSHIP_CREATE_FAILED',
    'Rattachement partenaire non créé.',
  )
}

async function ensureRole(admin: any, roleCode: string) {
  const { data, error } = await admin.from('authz_roles').select('*').eq('code', roleCode).maybeSingle()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ROLE_LOOKUP_FAILED')
  if (!data?.id) throw new TrainingHubHttpError(`Rôle TrainingHub introuvable: ${roleCode}`, 400, 'TRAININGHUB_ROLE_NOT_FOUND')
  return data
}

async function ensureRoleAssignment(admin: any, profileId: string, organizationId: string, roleId: string) {
  const { data: existing } = await admin
    .from('authz_user_role_assignments')
    .select('*')
    .eq('user_id', profileId)
    .eq('organization_id', organizationId)
    .eq('role_id', roleId)
    .maybeSingle()

  if (existing?.id) {
    await admin.from('authz_user_role_assignments').update({ status: 'active' }).eq('id', existing.id)
    return existing
  }

  return insertFirst(
    admin,
    'authz_user_role_assignments',
    [
      {
        user_id: profileId,
        organization_id: organizationId,
        role_id: roleId,
        status: 'active',
      },
    ],
    'TRAININGHUB_ROLE_ASSIGNMENT_FAILED',
    'Rôle partenaire non affecté.',
  )
}

async function verifyAccess(admin: any, organizationId?: string) {
  const filterOrg = clean(organizationId)
  const [
    organizations,
    billAccounts,
    subscriptions,
    profiles,
    memberships,
    roles,
    proposals,
    orders,
    invoices,
    sessions,
    participants,
    certificates,
  ] = await Promise.all([
    selectCount(admin, 'core_organizations', filterOrg ? 'id' : undefined, filterOrg || undefined),
    selectCount(admin, 'bill_accounts', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'bill_subscriptions', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'core_user_profiles'),
    selectCount(admin, 'core_memberships', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'authz_user_role_assignments', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'bill_proposals', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'bill_orders', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'bill_invoices', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'trn_sessions', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'trn_session_participants', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
    selectCount(admin, 'trn_certificates', filterOrg ? 'organization_id' : undefined, filterOrg || undefined),
  ])

  const score = Math.min(
    100,
    Math.round(
      (organizations ? 12 : 0) +
        (billAccounts ? 12 : 0) +
        (subscriptions ? 10 : 0) +
        (memberships ? 14 : 0) +
        (roles ? 14 : 0) +
        (proposals ? 8 : 0) +
        (orders ? 8 : 0) +
        (invoices ? 8 : 0) +
        (sessions ? 8 : 0) +
        (participants ? 3 : 0) +
        (certificates ? 3 : 0),
    ),
  )

  return {
    scope: filterOrg ? 'partner' : 'portfolio',
    score,
    counts: {
      organizations,
      billAccounts,
      subscriptions,
      profiles,
      memberships,
      roleAssignments: roles,
      proposals,
      orders,
      invoices,
      sessions,
      participants,
      certificates,
    },
    missing: [
      !organizations ? 'dossier partenaire' : null,
      !billAccounts ? 'compte partenaire' : null,
      !memberships ? 'utilisateurs rattachés' : null,
      !roles ? 'rôles affectés' : null,
      !proposals ? 'pipeline commercial' : null,
      !sessions ? 'delivery formation' : null,
    ].filter(Boolean),
  }
}

async function onboardPartnerFull(admin: any, body: JsonRecord, actorId: string) {
  const created: JsonRecord = {}
  try {
    const organization = await ensureOrganization(admin, body, actorId)
    created.organizationId = organization.id

    const account = await ensureBillAccount(admin, organization.id, body, actorId)
    created.accountId = account?.id

    const subscription = await ensureSubscription(admin, organization.id, account?.id || null, body, actorId)
    created.subscriptionId = subscription?.id

    let authUserBundle: any = null
    let profile: any = null
    let membership: any = null
    let role: any = null
    let roleAssignment: any = null

    if (clean(body.email)) {
      authUserBundle = await ensureAuthUser(admin, body)
      created.authUserId = authUserBundle.user.id

      profile = await ensureProfile(admin, authUserBundle.user.id, body, actorId)
      created.profileId = profile.id

      membership = await ensureMembership(admin, profile.id, organization.id)
      role = await ensureRole(admin, clean(body.role_code) || 'partner_owner')
      roleAssignment = await ensureRoleAssignment(admin, profile.id, organization.id, role.id)
    }

    await audit(admin, {
      organization_id: organization.id,
      actor_user_id: actorId,
      entity_type: 'partner',
      entity_id: organization.id,
      action: 'traininghub.partner.onboarded',
      message: 'Dossier partenaire créé / synchronisé',
      metadata: {
        created,
        has_user: Boolean(profile?.id),
      },
    })

    return {
      organization,
      account,
      subscription,
      profile,
      membership,
      role,
      roleAssignment,
      email: clean(body.email) || null,
      temporary_password: authUserBundle?.temporary_password || null,
      verification: await verifyAccess(admin, organization.id),
    }
  } catch (error) {
    if (created.organizationId) {
      try {
        await admin.from('core_organizations').update({
          status: 'onboarding_incomplete',
          metadata: {
            source: 'traininghub_partner_lifecycle',
            lifecycle_stage: 'onboarding_incomplete',
            error: error instanceof Error ? error.message : String(error),
          },
        }).eq('id', created.organizationId)
      } catch {
        // best-effort incomplete marking
      }

      await audit(admin, {
        organization_id: created.organizationId,
        actor_user_id: actorId,
        entity_type: 'partner',
        entity_id: created.organizationId,
        action: 'traininghub.partner.onboarding_failed',
        severity: 'error',
        message: 'Onboarding partenaire incomplet',
        metadata: {
          created,
          error: error instanceof Error ? error.message : String(error),
        },
      })
    }

    throw error
  }
}

async function createDossierEvent(admin: any, body: JsonRecord, actorId: string, eventType: string, title: string) {
  const organizationId = clean(body.organization_id)
  if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_DOSSIER_ORG_REQUIRED')

  const data = await insertFirst(
    admin,
    'auto_events',
    [
      {
        organization_id: organizationId,
        event_type: eventType,
        title,
        status: 'open',
        payload: {
          source: 'traininghub_partner_lifecycle',
          priority: clean(body.priority) || 'normal',
          due_at: clean(body.due_at) || null,
          note: clean(body.note) || null,
          created_by: actorId,
        },
      },
      {
        organization_id: organizationId,
        event_type: eventType,
        status: 'open',
        payload: {
          title,
          source: 'traininghub_partner_lifecycle',
          created_by: actorId,
        },
      },
    ],
    'TRAININGHUB_DOSSIER_EVENT_FAILED',
    'Action dossier non créée.',
  )

  await audit(admin, {
    organization_id: organizationId,
    actor_user_id: actorId,
    entity_type: 'partner_action',
    entity_id: data.id,
    action: eventType,
    message: title,
  })

  return data
}

async function updatePartnerStatus(admin: any, body: JsonRecord, actorId: string, status: string) {
  const organizationId = clean(body.organization_id)
  if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_DOSSIER_ORG_REQUIRED')

  const org = await updateFirst(
    admin,
    'core_organizations',
    organizationId,
    [
      {
        status,
        metadata: {
          source: 'traininghub_partner_lifecycle',
          lifecycle_stage: status,
          updated_by: actorId,
        },
      },
      { status },
    ],
    'TRAININGHUB_PARTNER_STATUS_FAILED',
    'Statut partenaire non modifié.',
  )

  await admin.from('bill_accounts').update({ status }).eq('organization_id', organizationId)
  await admin.from('bill_subscriptions').update({ status }).eq('organization_id', organizationId)
  await admin.from('core_memberships').update({ status }).eq('organization_id', organizationId)
  await admin.from('authz_user_role_assignments').update({ status }).eq('organization_id', organizationId)

  await audit(admin, {
    organization_id: organizationId,
    actor_user_id: actorId,
    entity_type: 'partner',
    entity_id: organizationId,
    action: `traininghub.partner.${status}`,
    message: `Statut partenaire: ${status}`,
  })

  return org
}

export async function GET(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_LIFECYCLE_INTERNAL_ONLY')
    }

    requireTrainingHubPermission(context, WRITE_PERMISSIONS)
    const admin = getServiceClient()
    const organizationId = request.nextUrl.searchParams.get('organization_id') || undefined
    return NextResponse.json({ ok: true, data: await verifyAccess(admin, organizationId) })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_LIFECYCLE_INTERNAL_ONLY')
    }

    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const body = (await request.json()) as JsonRecord
    const action = clean(body.action)
    const admin = getServiceClient()

    if (action === 'onboard_partner_full') {
      const data = await onboardPartnerFull(admin, body, context.profile.id)
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'verify_access') {
      return NextResponse.json({ ok: true, data: await verifyAccess(admin, clean(body.organization_id) || undefined) })
    }

    if (action === 'open_followup') {
      const data = await createDossierEvent(admin, body, context.profile.id, 'partner_followup_required', 'Relance partenaire à planifier')
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'upgrade_review') {
      const data = await createDossierEvent(admin, body, context.profile.id, 'partner_upgrade_review', 'Revue de montée en gamme partenaire')
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'renewal_review') {
      const data = await createDossierEvent(admin, body, context.profile.id, 'partner_renewal_review', 'Renouvellement partenaire à préparer')
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'suspend_partner') {
      const data = await updatePartnerStatus(admin, body, context.profile.id, 'suspended')
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'reactivate_partner') {
      const data = await updatePartnerStatus(admin, body, context.profile.id, 'active')
      return NextResponse.json({ ok: true, data })
    }

    throw new TrainingHubHttpError('Action lifecycle inconnue.', 400, 'TRAININGHUB_LIFECYCLE_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
