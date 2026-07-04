import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function parseDbError(message: string) {
  const missing =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)

  if (missing?.[1]) return { type: 'missing', column: missing[1] }

  const notNull = message.match(/null value in column "([^"]+)"/i)
  if (notNull?.[1]) return { type: 'not_null', column: notNull[1] }

  return null
}

async function adaptiveUpdate(supabase: any, table: string, id: string, payload: AnyRow) {
  let row = JSON.parse(JSON.stringify(payload || {}))

  for (let index = 0; index < 16; index += 1) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, data }

    const parsed = parseDbError(error.message || String(error))
    if (parsed?.type === 'missing') {
      delete row[parsed.column]
      continue
    }

    return { ok: false, error: error.message || String(error) }
  }

  return { ok: false, error: `Update impossible: ${table}` }
}

async function adaptiveInsert(supabase: any, table: string, payload: AnyRow) {
  let row = JSON.parse(JSON.stringify(payload || {}))

  for (let index = 0; index < 16; index += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { ok: true, data }

    const parsed = parseDbError(error.message || String(error))
    if (parsed?.type === 'missing' || parsed?.type === 'not_null') {
      delete row[parsed.column]
      continue
    }

    return { ok: false, error: error.message || String(error) }
  }

  return { ok: false, error: `Insert impossible: ${table}` }
}

async function countByOrg(supabase: any, table: string, organizationId: string) {
  const attempts = [
    () => supabase.from(table).select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    () => supabase.from(table).select('id', { count: 'exact', head: true }).eq('partner_id', organizationId),
  ]

  for (const attempt of attempts) {
    const { count, error } = await attempt()
    if (!error) return Number(count || 0)
  }

  return 0
}

async function selectMaybeByOrg(supabase: any, table: string, organizationId: string, limit = 8) {
  const attempts = [
    () => supabase.from(table).select('*').eq('organization_id', organizationId).limit(limit),
    () => supabase.from(table).select('*').eq('partner_id', organizationId).limit(limit),
  ]

  for (const attempt of attempts) {
    const { data, error } = await attempt()
    if (!error) return Array.isArray(data) ? data : []
  }

  return []
}

async function deleteByOrg(supabase: any, table: string, organizationId: string) {
  const attempts = [
    () => supabase.from(table).delete().eq('organization_id', organizationId),
    () => supabase.from(table).delete().eq('partner_id', organizationId),
  ]

  for (const attempt of attempts) {
    const { error } = await attempt()
    if (!error) return { ok: true }
  }

  return { ok: true }
}

async function getParams(context: { params: Promise<{ id: string }> | { id: string } }) {
  return await Promise.resolve(context.params as any)
}

async function logActivity(supabase: any, organizationId: string, action: string, metadata: AnyRow = {}) {
  const payload = {
    organization_id: organizationId,
    event_type: `traininghub.partner_dossier.${action}`,
    title: metadata.title || action,
    body: metadata.body || null,
    status: 'recorded',
    metadata: { source: 'existing_partner_access_password_complete', ...metadata },
    created_at: new Date().toISOString(),
  }

  const event = await adaptiveInsert(supabase, 'partner_activity_events', payload)
  if (event.ok) return event

  return adaptiveInsert(supabase, 'traininghub_internal_actions', {
    module: 'partner_dossier',
    action,
    entity_id: organizationId,
    organization_id: organizationId,
    status: 'recorded',
    metadata: payload,
    created_at: new Date().toISOString(),
  })
}

function mapOrg(row: AnyRow = {}) {
  return {
    id: row.id,
    name: row.name || row.display_name || row.legal_name || 'Partenaire',
    legalName: row.legal_name || row.display_name || row.name || '',
    city: row.city || row.metadata?.city || 'Rabat',
    address: row.address || row.metadata?.address || '',
    website: row.website || row.metadata?.website || '',
    segment: row.segment || row.organization_type || row.partner_type || row.metadata?.segment || 'partner_school',
    partnerType: row.partner_type || row.organization_type || row.metadata?.partnerType || 'school_partner',
    owner: row.owner_name || row.account_owner || row.metadata?.commercial?.owner || 'Non assigné',
    plan: row.plan_name || row.metadata?.commercial?.plan || 'Aucun plan',
    stage: row.stage || row.status || 'active',
    status: row.status || 'active',
    health: Number(row.health_score || row.metadata?.governance?.health || 62),
    risk: row.risk_level || row.metadata?.governance?.riskLevel || 'À surveiller',
    raw: row,
  }
}

async function getPrimaryProfile(supabase: any, organizationId: string, email?: string) {
  const profiles = await selectMaybeByOrg(supabase, 'core_user_profiles', organizationId, 12)
  if (email) {
    const byEmail = profiles.find((profile) => String(profile.email || '').toLowerCase() === String(email).toLowerCase())
    if (byEmail) return byEmail
  }
  return profiles.find((profile) => profile.auth_user_id) || profiles[0] || null
}

async function ensureAuthAccess(
  supabase: any,
  organizationId: string,
  form: AnyRow,
  password: string,
) {
  const email = String(form.contactEmail || form.loginEmail || '').trim().toLowerCase()
  if (!email) return { ok: false, message: 'Email portail requis pour créer ou réinitialiser le mot de passe.' }
  if (!password || password.length < 10) return { ok: false, message: 'Mot de passe temporaire minimum 10 caractères.' }

  let authUserId = ''
  let profile = await getPrimaryProfile(supabase, organizationId, email)

  if (profile?.auth_user_id) {
    authUserId = profile.auth_user_id
    const { error } = await supabase.auth.admin.updateUserById(authUserId, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: form.contactFullName || form.name,
        organization_id: organizationId,
        traininghub_role: form.accessRole || 'partner_admin',
        access_level: form.accessLevel || 'standard_partner_access',
      },
    })

    if (error) return { ok: false, message: error.message }
  } else {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: form.contactFullName || form.name,
        organization_id: organizationId,
        traininghub_role: form.accessRole || 'partner_admin',
        access_level: form.accessLevel || 'standard_partner_access',
      },
    })

    if (created.error) return { ok: false, message: created.error.message }
    authUserId = created.data?.user?.id || ''
  }

  if (profile?.id) {
    await adaptiveUpdate(supabase, 'core_user_profiles', profile.id, {
      auth_user_id: authUserId,
      organization_id: organizationId,
      email,
      full_name: form.contactFullName || form.name,
      display_name: form.contactFullName || form.name,
      phone: form.contactPhone || null,
      status: 'active',
      access_status: 'active',
      metadata: {
        ...(profile.metadata || {}),
        source: 'existing_partner_access_password_complete',
        password_last_reset_at: new Date().toISOString(),
        temporary_password_issued: true,
        password_reset_required: true,
        portal_path: '/traininghub/partner',
        traininghub_role: form.accessRole || 'partner_admin',
        access_level: form.accessLevel || 'standard_partner_access',
      },
      updated_at: new Date().toISOString(),
    })
  } else {
    const insertedProfile = await adaptiveInsert(supabase, 'core_user_profiles', {
      auth_user_id: authUserId,
      organization_id: organizationId,
      email,
      full_name: form.contactFullName || form.name,
      display_name: form.contactFullName || form.name,
      phone: form.contactPhone || null,
      status: 'active',
      access_status: 'active',
      metadata: {
        source: 'existing_partner_access_password_complete',
        password_last_reset_at: new Date().toISOString(),
        temporary_password_issued: true,
        password_reset_required: true,
        portal_path: '/traininghub/partner',
        traininghub_role: form.accessRole || 'partner_admin',
        access_level: form.accessLevel || 'standard_partner_access',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    profile = insertedProfile.data || null
  }

  await adaptiveInsert(supabase, 'core_memberships', {
    organization_id: organizationId,
    user_id: authUserId,
    profile_id: profile?.id || null,
    role: form.accessRole || 'partner_admin',
    status: 'active',
    membership_type: 'partner_portal',
    metadata: {
      access_level: form.accessLevel || 'standard_partner_access',
      portal_policy: form.portalPolicy || 'restricted_partner_scope',
      source: 'existing_partner_access_password_complete',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await adaptiveInsert(supabase, 'authz_user_role_assignments', {
    organization_id: organizationId,
    user_id: authUserId,
    profile_id: profile?.id || null,
    role_key: form.accessRole || 'partner_admin',
    role: form.accessRole || 'partner_admin',
    scope_type: 'organization',
    scope_id: organizationId,
    status: 'active',
    metadata: {
      access_level: form.accessLevel || 'standard_partner_access',
      portal_policy: form.portalPolicy || 'restricted_partner_scope',
      enabled_modules: form.enabledModules || [],
      source: 'existing_partner_access_password_complete',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await logActivity(supabase, organizationId, 'password_set', {
    title: 'Mot de passe portail partenaire défini',
    email,
    authUserId,
  })

  return {
    ok: true,
    authUserId,
    profileId: profile?.id || null,
    loginEmail: email,
    message: 'Mot de passe portail défini. Copiez-le maintenant, il ne sera pas stocké en clair.',
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await getParams(context)

  const { data: organization, error } = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
  if (!organization) return NextResponse.json({ ok: false, message: 'Partenaire introuvable.' }, { status: 404 })

  const [
    billingAccounts,
    profiles,
    memberships,
    roles,
    proposals,
    subscriptions,
    credits,
    sessions,
    participants,
    certificates,
    documents,
    requests,
  ] = await Promise.all([
    selectMaybeByOrg(supabase, 'bill_accounts', id, 4),
    selectMaybeByOrg(supabase, 'core_user_profiles', id, 8),
    selectMaybeByOrg(supabase, 'core_memberships', id, 12),
    selectMaybeByOrg(supabase, 'authz_user_role_assignments', id, 12),
    selectMaybeByOrg(supabase, 'bill_proposals', id, 8),
    selectMaybeByOrg(supabase, 'bill_subscriptions', id, 4),
    selectMaybeByOrg(supabase, 'bill_training_credits', id, 8),
    selectMaybeByOrg(supabase, 'trn_sessions', id, 8),
    selectMaybeByOrg(supabase, 'trn_session_participants', id, 12),
    selectMaybeByOrg(supabase, 'trn_certificates', id, 12),
    selectMaybeByOrg(supabase, 'partner_documents', id, 12),
    selectMaybeByOrg(supabase, 'partner_requests', id, 12),
  ])

  const primaryProfile = profiles.find((profile) => profile.auth_user_id) || profiles[0] || null
  const accessInfo = {
    loginEmail: primaryProfile?.email || organization?.metadata?.contact?.email || '',
    authUserId: primaryProfile?.auth_user_id || null,
    profileId: primaryProfile?.id || null,
    accessStatus: primaryProfile?.access_status || primaryProfile?.status || 'not_configured',
    passwordLastResetAt:
      primaryProfile?.metadata?.password_last_reset_at ||
      organization?.metadata?.access?.passwordLastResetAt ||
      null,
    passwordResetRequired:
      primaryProfile?.metadata?.password_reset_required ||
      organization?.metadata?.access?.passwordResetRequired ||
      false,
    temporaryPasswordAvailable: false,
    note: 'Les mots de passe existants ne sont jamais lisibles. Vous pouvez générer ou définir un nouveau mot de passe temporaire.',
    portalPath: '/traininghub/partner',
  }

  const counts = {
    offers: await countByOrg(supabase, 'bill_proposals', id),
    orders: await countByOrg(supabase, 'bill_orders', id),
    invoices: await countByOrg(supabase, 'bill_invoices', id),
    credits: await countByOrg(supabase, 'bill_training_credits', id),
    sessions: await countByOrg(supabase, 'trn_sessions', id),
    participants: await countByOrg(supabase, 'trn_session_participants', id),
    certificates: await countByOrg(supabase, 'trn_certificates', id),
    requests: await countByOrg(supabase, 'partner_requests', id),
    documents: await countByOrg(supabase, 'partner_documents', id),
    users: profiles.length,
    roles: roles.length,
  }

  return NextResponse.json({
    ok: true,
    data: {
      partner: mapOrg(organization),
      organization,
      billingAccount: billingAccounts[0] || null,
      profiles,
      memberships,
      roles,
      proposals,
      subscriptions,
      credits,
      sessions,
      participants,
      certificates,
      documents,
      requests,
      counts,
      accessInfo,
    },
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await getParams(context)
  const body = await request.json().catch(() => ({}))
  const action = body.action || 'save'
  const form = body.form || {}

  if (action === 'set_password') {
    const result = await ensureAuthAccess(supabase, id, form, String(body.password || ''))
    if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: 400 })

    const { data: organization } = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()
    await adaptiveUpdate(supabase, 'core_organizations', id, {
      metadata: {
        ...(organization?.metadata || {}),
        contact: {
          ...(organization?.metadata?.contact || {}),
          email: result.loginEmail,
          fullName: form.contactFullName || null,
          phone: form.contactPhone || null,
        },
        access: {
          ...(organization?.metadata?.access || {}),
          role: form.accessRole || 'partner_admin',
          accessLevel: form.accessLevel || 'standard_partner_access',
          portalPolicy: form.portalPolicy || 'restricted_partner_scope',
          enabledModules: form.enabledModules || [],
          authUserId: result.authUserId,
          loginEmail: result.loginEmail,
          passwordLastResetAt: new Date().toISOString(),
          passwordResetRequired: true,
          passwordStatus: 'temporary_password_set',
        },
      },
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, data: result, message: result.message })
  }

  if (action === 'suspend' || action === 'restore') {
    const suspended = action === 'suspend'
    const { data: organization } = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()

    const update = await adaptiveUpdate(supabase, 'core_organizations', id, {
      status: suspended ? 'suspended' : 'active',
      stage: suspended ? 'suspended' : 'active',
      metadata: {
        ...(organization?.metadata || body.currentMetadata || {}),
        access_temporarily_suspended: suspended,
        access_suspension_reason: body.reason || null,
        access_status_changed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })

    const profiles = await selectMaybeByOrg(supabase, 'core_user_profiles', id, 20)
    for (const profile of profiles) {
      await adaptiveUpdate(supabase, 'core_user_profiles', profile.id, {
        status: suspended ? 'suspended' : 'active',
        access_status: suspended ? 'suspended' : 'active',
        updated_at: new Date().toISOString(),
      })
      if (profile.auth_user_id && supabase.auth?.admin?.updateUserById) {
        await supabase.auth.admin.updateUserById(profile.auth_user_id, { ban_duration: suspended ? '876000h' : 'none' }).catch?.(() => null)
      }
    }

    await logActivity(supabase, id, suspended ? 'suspended_access' : 'restored_access', {
      title: suspended ? 'Accès partenaire suspendu' : 'Accès partenaire réactivé',
      reason: body.reason || null,
    })

    return NextResponse.json({ ok: update.ok, data: update.data, message: update.ok ? 'Accès mis à jour.' : update.error })
  }

  const { data: currentOrg } = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()

  const orgPayload = {
    name: form.name,
    display_name: form.name,
    legal_name: form.legalName || form.name,
    city: form.city,
    address: form.address,
    website: form.website,
    segment: form.segment,
    organization_type: form.segment,
    partner_type: form.partnerType,
    status: form.status || 'active',
    stage: form.stage || form.status || 'active',
    owner_name: form.owner,
    account_owner: form.owner,
    plan_name: form.plan,
    health_score: Number(form.health || 0),
    risk_level: form.risk,
    metadata: {
      ...(currentOrg?.metadata || form.raw?.metadata || {}),
      source: 'existing_partner_access_password_complete',
      last_live_edit_at: new Date().toISOString(),
      contact: {
        fullName: form.contactFullName || null,
        email: form.contactEmail || null,
        phone: form.contactPhone || null,
        function: form.contactFunction || null,
      },
      commercial: {
        owner: form.owner,
        plan: form.plan,
        monthlyAmount: form.monthlyAmount || 0,
      },
      access: {
        ...(currentOrg?.metadata?.access || {}),
        role: form.accessRole,
        accessLevel: form.accessLevel,
        portalPolicy: form.portalPolicy,
        enabledModules: form.enabledModules || [],
        loginEmail: form.contactEmail || null,
      },
      billing: {
        billingModel: form.billingModel,
        accountType: form.accountType,
        billingPeriod: form.billingPeriod,
        currency: form.currency,
        paymentTerms: form.paymentTerms,
        invoicePolicy: form.invoicePolicy,
        renewalPolicy: form.renewalPolicy,
      },
      delivery: {
        mode: form.mode,
        location: form.location,
        checklistTemplate: form.checklistTemplate,
      },
      proofs: {
        proofVisibility: form.proofVisibility,
        selectedKits: form.selectedKits || [],
      },
      governance: {
        slaPolicy: form.slaPolicy,
        priority: form.priority,
        riskLevel: form.risk,
        health: Number(form.health || 0),
      },
    },
    updated_at: new Date().toISOString(),
  }

  const updated = await adaptiveUpdate(supabase, 'core_organizations', id, orgPayload)

  const billingAccounts = await selectMaybeByOrg(supabase, 'bill_accounts', id, 1)
  if (billingAccounts[0]?.id) {
    await adaptiveUpdate(supabase, 'bill_accounts', billingAccounts[0].id, {
      account_name: form.name,
      billing_email: form.contactEmail,
      billing_phone: form.contactPhone,
      billing_address: form.address,
      payment_terms: form.paymentTerms,
      invoice_policy: form.invoicePolicy,
      account_type: form.accountType,
      currency: form.currency || 'MAD',
      owner_name: form.owner,
      updated_at: new Date().toISOString(),
    })
  }

  await logActivity(supabase, id, 'saved_live_edit', {
    title: 'Dossier partenaire modifié',
    fields: Object.keys(form || {}),
  })

  return NextResponse.json({ ok: updated.ok, data: updated.data, message: updated.ok ? 'Dossier sauvegardé.' : updated.error })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await getParams(context)
  const body = await request.json().catch(() => ({}))

  if (body.confirmation !== 'DELETE_PARTNER') {
    return NextResponse.json({ ok: false, message: 'Confirmation DELETE_PARTNER requise.' }, { status: 400 })
  }

  const profiles = await selectMaybeByOrg(supabase, 'core_user_profiles', id, 20)
  for (const profile of profiles) {
    if (profile.auth_user_id && supabase.auth?.admin?.deleteUser) {
      await supabase.auth.admin.deleteUser(profile.auth_user_id).catch?.(() => null)
    }
  }

  const tables = [
    'partner_notifications',
    'partner_activity_events',
    'partner_documents',
    'partner_requests',
    'trn_certificates',
    'trn_session_participants',
    'trn_sessions',
    'bill_training_credits',
    'bill_payments',
    'bill_invoice_items',
    'bill_invoices',
    'bill_order_items',
    'bill_orders',
    'bill_proposal_items',
    'bill_proposals',
    'bill_subscriptions',
    'bill_accounts',
    'authz_user_role_assignments',
    'core_memberships',
    'core_user_profiles',
  ]

  for (const table of tables) await deleteByOrg(supabase, table, id)

  const { error } = await supabase.from('core_organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, message: 'Partenaire supprimé définitivement.' })
}
