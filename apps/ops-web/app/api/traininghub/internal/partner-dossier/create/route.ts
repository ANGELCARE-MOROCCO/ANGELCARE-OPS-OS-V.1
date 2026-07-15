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

function code(prefix: string) {
  return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function toMinor(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
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

function fallbackValue(column: string, row: AnyRow) {
  if (column === 'id') return crypto.randomUUID()
  if (column.endsWith('_id')) return row.organization_id || row.partner_id || row.account_id || row.user_id || row.profile_id || null
  if (column.includes('email')) return row.email || `partner-${Date.now()}@example.com`
  if (column.includes('number')) return code(column.toUpperCase().slice(0, 10))
  if (column.includes('code')) return code(column.toUpperCase().slice(0, 8))
  if (column.includes('currency')) return 'MAD'
  if (column.includes('status')) return 'active'
  if (column.includes('stage')) return 'onboarding'
  if (column.includes('type')) return 'partner_school'
  if (column.includes('source')) return 'traininghub'
  if (column.includes('role')) return 'partner_admin'
  if (column.includes('title') || column.includes('name')) return 'TrainingHub Partner'
  if (column.includes('amount') || column.includes('total') || column.includes('minor') || column.includes('quantity')) return 0
  if (column.includes('metadata') || column.includes('payload') || column.includes('settings') || column.includes('config')) return {}
  if (column.endsWith('_at') || column.includes('date')) return new Date().toISOString()
  if (column.startsWith('is_') || column.includes('enabled')) return true
  return 'traininghub'
}

async function adaptiveInsert(supabase: any, table: string, payload: AnyRow) {
  let row: AnyRow = JSON.parse(JSON.stringify(payload || {}))

  for (let index = 0; index < 20; index += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { ok: true, table, data }

    const parsed = parseDbError(error.message || String(error))
    if (parsed?.type === 'missing') {
      delete row[parsed.column]
      continue
    }

    if (parsed?.type === 'not_null') {
      row[parsed.column] = fallbackValue(parsed.column, row)
      continue
    }

    return { ok: false, table, error: error.message || String(error) }
  }

  return { ok: false, table, error: `Insert impossible dans ${table}` }
}

async function adaptiveUpdate(supabase: any, table: string, id: string, payload: AnyRow) {
  let row: AnyRow = JSON.parse(JSON.stringify(payload || {}))

  for (let index = 0; index < 12; index += 1) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, table, data }

    const parsed = parseDbError(error.message || String(error))
    if (parsed?.type === 'missing') {
      delete row[parsed.column]
      continue
    }

    return { ok: false, table, error: error.message || String(error) }
  }

  return { ok: false, table, error: `Update impossible dans ${table}` }
}

async function createAuthUser(supabase: any, email: string, password: string, metadata: AnyRow) {
  if (!email) return { ok: false, skipped: true, error: 'email missing' }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: password || `TrainingHub-${Math.random().toString(36).slice(2, 8)}!`,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) return { ok: false, error: error.message || String(error) }
    return { ok: true, user: data?.user || null }
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) }
  }
}

function cleanText(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

async function logActivity(supabase: any, organizationId: string, action: string, body: AnyRow = {}) {
  const payload = {
    organization_id: organizationId,
    event_type: `traininghub.partner_dossier.create.${action}`,
    title: body.title || action,
    body: body.notes || body.description || null,
    metadata: { source: 'create_partner_dossier_v2_presets', ...body },
    created_at: new Date().toISOString(),
  }

  const event = await adaptiveInsert(supabase, 'partner_activity_events', payload)
  if (event.ok) return event

  return adaptiveInsert(supabase, 'traininghub_internal_actions', {
    module: 'partner_dossier_create',
    action,
    entity_id: organizationId,
    organization_id: organizationId,
    status: 'recorded',
    notes: body.notes || null,
    metadata: payload,
    created_at: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const partner = body.partner || {}
  const contact = body.contact || {}
  const access = body.access || {}
  const commercial = body.commercial || {}
  const billing = body.billing || {}
  const offer = body.offer || {}
  const delivery = body.delivery || {}
  const governance = body.governance || {}
  const proofs = body.proofs || {}

  const name = cleanText(partner.name)
  if (!name) return NextResponse.json({ ok: false, message: 'Nom établissement requis.' }, { status: 400 })

  const now = new Date().toISOString()
  const selectedServices = Array.isArray(offer.selectedServices) ? offer.selectedServices : []
  const enabledModules = Array.isArray(access.enabledModules) ? access.enabledModules : []
  const billingModel = cleanText(billing.model, 'account_subscription')
  const amountMinor = toMinor(offer.amount || billing.setupFee || commercial.monthlyAmount || 7200)

  const result: AnyRow = {
    organization: null,
    account: null,
    authUser: null,
    profile: null,
    membership: null,
    role: null,
    proposal: null,
    proposalItems: [],
    subscription: null,
    trainingCredits: null,
    session: null,
    documents: [],
    request: null,
    notification: null,
    audit: [],
  }

  const organization = await adaptiveInsert(supabase, 'core_organizations', {
    name,
    display_name: name,
    legal_name: cleanText(partner.legalName, name),
    city: cleanText(partner.city, 'Rabat'),
    country: 'MA',
    address: cleanText(partner.address),
    phone: cleanText(contact.phone),
    email: cleanText(contact.email),
    website: cleanText(partner.website),
    organization_type: cleanText(partner.segment, 'partner_school'),
    partner_type: cleanText(partner.partnerType, 'school_partner'),
    segment: cleanText(partner.segment, 'partner_school'),
    status: cleanText(partner.status, 'active'),
    stage: cleanText(partner.stage, 'onboarding'),
    owner_name: cleanText(commercial.owner, 'Non assigné'),
    account_owner: cleanText(commercial.owner, 'Non assigné'),
    plan_name: cleanText(commercial.plan, 'Activation'),
    billing_status: 'À préparer',
    risk_level: cleanText(governance.riskLevel, 'Faible'),
    health_score: Number(governance.health || commercial.health || 76),
    metadata: {
      source: 'create_partner_dossier_v2_presets',
      partner,
      contact,
      access,
      commercial,
      billing,
      offer,
      delivery,
      governance,
      proofs,
      monetization_model: {
        commission_per_sale: false,
        tax_vat_collection: false,
        account_subscription: billingModel === 'account_subscription',
        training_credits: Boolean(billing.creditWalletEnabled),
        refresh_revenue: Boolean(billing.refreshEnabled),
        proof_kits: Boolean(proofs.createStarterKit),
        premium_reporting: selectedServices.includes('premium_reporting'),
      },
    },
    created_at: now,
    updated_at: now,
  })

  if (!organization.ok || !organization.data?.id) {
    return NextResponse.json({ ok: false, message: organization.error || 'Création du partenaire impossible.' }, { status: 400 })
  }

  result.organization = organization.data
  const organizationId = String(organization.data.id)

  const account = await adaptiveInsert(supabase, 'bill_accounts', {
    organization_id: organizationId,
    partner_id: organizationId,
    account_number: code('TH-ACC'),
    account_name: name,
    status: 'active',
    account_type: cleanText(billing.accountType, 'partner_training_account'),
    currency: cleanText(billing.currency, 'MAD'),
    billing_email: cleanText(contact.email),
    billing_phone: cleanText(contact.phone),
    billing_address: cleanText(partner.address),
    payment_terms: cleanText(billing.paymentTerms, 'due_15'),
    invoice_policy: cleanText(billing.invoicePolicy, 'manual_review_before_issue'),
    owner_name: cleanText(commercial.owner, 'Non assigné'),
    metadata: {
      source: 'create_partner_dossier_v2_presets',
      billing,
      plan: commercial.plan,
      controlled_access: {
        role: access.role,
        modules: enabledModules,
        accessLevel: access.accessLevel,
      },
    },
    created_at: now,
    updated_at: now,
  })
  if (account.ok) result.account = account.data

  if (cleanText(contact.email)) {
    const auth = await createAuthUser(
      supabase,
      cleanText(contact.email),
      cleanText(access.password, '20262026'),
      {
        organization_id: organizationId,
        full_name: cleanText(contact.fullName, name),
        role: cleanText(access.role, 'partner_admin'),
        access_level: cleanText(access.accessLevel, 'standard_partner_access'),
        enabled_modules: enabledModules,
        source: 'create_partner_dossier_v2_presets',
      }
    )

    if (auth.ok && auth.user?.id) {
      result.authUser = auth.user
      const userId = String(auth.user.id)

      const profile = await adaptiveInsert(supabase, 'core_user_profiles', {
        id: userId,
        user_id: userId,
        organization_id: organizationId,
        full_name: cleanText(contact.fullName, name),
        display_name: cleanText(contact.fullName, name),
        email: cleanText(contact.email),
        phone: cleanText(contact.phone),
        job_title: cleanText(contact.function, 'Direction partenaire'),
        status: 'active',
        metadata: { source: 'create_partner_dossier_v2_presets', enabled_modules: enabledModules, access },
        created_at: now,
        updated_at: now,
      })
      if (profile.ok) result.profile = profile.data

      const membership = await adaptiveInsert(supabase, 'core_memberships', {
        organization_id: organizationId,
        user_id: userId,
        profile_id: userId,
        role: cleanText(access.role, 'partner_admin'),
        status: 'active',
        membership_type: 'partner_access',
        access_level: cleanText(access.accessLevel, 'standard_partner_access'),
        metadata: { source: 'create_partner_dossier_v2_presets', enabled_modules: enabledModules, portal_policy: access.portalPolicy },
        created_at: now,
        updated_at: now,
      })
      if (membership.ok) result.membership = membership.data

      const role = await adaptiveInsert(supabase, 'authz_user_role_assignments', {
        organization_id: organizationId,
        user_id: userId,
        role_key: cleanText(access.role, 'partner_admin'),
        role: cleanText(access.role, 'partner_admin'),
        scope_type: 'organization',
        scope_id: organizationId,
        status: 'active',
        metadata: { source: 'create_partner_dossier_v2_presets', enabled_modules: enabledModules, permissions: access.permissions || [] },
        created_at: now,
        updated_at: now,
      })
      if (role.ok) result.role = role.data
    } else {
      result.authUser = { error: auth.error || 'auth skipped' }
    }
  }

  if (offer.createInitialOffer !== false) {
    const proposal = await adaptiveInsert(supabase, 'bill_proposals', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_id: result.account?.id || null,
      proposal_number: code('TH-OFFRE'),
      title: cleanText(offer.title, `${commercial.plan || 'Activation'} TrainingHub`),
      status: cleanText(offer.status, 'draft'),
      currency: cleanText(billing.currency, 'MAD'),
      subtotal_minor: amountMinor,
      total_minor: amountMinor,
      grand_total_minor: amountMinor,
      valid_until: offer.validUntil || null,
      metadata: {
        source: 'create_partner_dossier_v2_presets',
        billing_model: billingModel,
        selected_services: selectedServices,
        package_type: cleanText(offer.packageType, 'training_activation_pack'),
        participants: Number(offer.participants || 10),
        plan: commercial.plan,
        commercial_terms: billing,
      },
      created_at: now,
      updated_at: now,
    })

    if (proposal.ok) {
      result.proposal = proposal.data
      const services = selectedServices.length ? selectedServices : ['training_activation_pack']
      const unit = Math.max(0, Math.round(amountMinor / Math.max(1, services.length)))

      for (const service of services) {
        const item = await adaptiveInsert(supabase, 'bill_proposal_items', {
          organization_id: organizationId,
          proposal_id: proposal.data?.id,
          item_type: service.includes('refresh') ? 'refresh_cycle' : service.includes('proof') ? 'proof_kit' : 'training_course',
          source_type: 'partner_dossier_create',
          title: service.replace(/_/g, ' '),
          description: cleanText(offer.description, 'Prestation TrainingHub sélectionnée depuis le dossier partenaire.'),
          quantity: Number(offer.participants || 1),
          unit_price_minor: unit,
          total_minor: unit,
          currency: cleanText(billing.currency, 'MAD'),
          metadata: { source: 'create_partner_dossier_v2_presets', service },
          created_at: now,
          updated_at: now,
        })
        if (item.ok) result.proposalItems.push(item.data)
      }
    }
  }

  if (commercial.createSubscription || billingModel === 'account_subscription') {
    const subscription = await adaptiveInsert(supabase, 'bill_subscriptions', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_id: result.account?.id || null,
      subscription_number: code('TH-SUB'),
      plan_name: cleanText(commercial.plan, 'Activation'),
      status: cleanText(commercial.subscriptionStatus, 'active'),
      billing_period: cleanText(billing.billingPeriod, 'monthly'),
      currency: cleanText(billing.currency, 'MAD'),
      amount_minor: toMinor(commercial.monthlyAmount || 0),
      starts_at: now,
      renewal_policy: cleanText(billing.renewalPolicy, 'manual_review_30_days_before_end'),
      metadata: {
        source: 'create_partner_dossier_v2_presets',
        model: billingModel,
        included_modules: enabledModules,
        refresh_enabled: Boolean(billing.refreshEnabled),
      },
      created_at: now,
      updated_at: now,
    })
    if (subscription.ok) result.subscription = subscription.data
  }

  if (billing.creditWalletEnabled) {
    const credits = await adaptiveInsert(supabase, 'bill_training_credits', {
      organization_id: organizationId,
      partner_id: organizationId,
      proposal_id: result.proposal?.id || null,
      credit_type: cleanText(billing.creditType, 'training_course'),
      source_type: 'partner_dossier_create',
      status: 'available',
      quantity_total: Number(billing.creditQuantity || offer.participants || 10),
      quantity_available: Number(billing.creditQuantity || offer.participants || 10),
      quantity_used: 0,
      amount_minor: toMinor(billing.creditAmount || offer.amount || 0),
      currency: cleanText(billing.currency, 'MAD'),
      metadata: { source: 'create_partner_dossier_v2_presets', wallet_policy: billing.creditPolicy },
      created_at: now,
      updated_at: now,
    })
    if (credits.ok) result.trainingCredits = credits.data
  }

  if (delivery.createFirstSession) {
    const session = await adaptiveInsert(supabase, 'trn_sessions', {
      organization_id: organizationId,
      partner_id: organizationId,
      session_code: code('TH-SESS'),
      title: cleanText(delivery.sessionTitle, 'Session TrainingHub de lancement'),
      status: 'planned',
      mode: cleanText(delivery.mode, 'onsite'),
      location: cleanText(delivery.location, cleanText(partner.city, 'Site partenaire')),
      scheduled_start_at: delivery.startAt || now,
      scheduled_end_at: delivery.endAt || null,
      max_participants: Number(delivery.maxParticipants || offer.participants || 10),
      checklist_template: cleanText(delivery.checklistTemplate, 'standard_training_delivery'),
      metadata: { source: 'create_partner_dossier_v2_presets', delivery, onboarding_session: true },
      created_at: now,
      updated_at: now,
    })
    if (session.ok) result.session = session.data
  }

  const proofDocuments = Array.isArray(proofs.selectedKits) ? proofs.selectedKits : []
  if (proofs.createStarterKit || proofDocuments.length) {
    const kits = proofDocuments.length ? proofDocuments : ['starter_kit']
    for (const kit of kits) {
      const document = await adaptiveInsert(supabase, 'partner_documents', {
        organization_id: organizationId,
        document_type: kit,
        title: kit.replace(/_/g, ' '),
        status: 'published',
        published_at: now,
        metadata: { source: 'create_partner_dossier_v2_presets', kit, visibility: proofs.visibility || 'partner_portal' },
        created_at: now,
        updated_at: now,
      })
      if (document.ok) result.documents.push(document.data)
    }
  }

  const requestRow = await adaptiveInsert(supabase, 'partner_requests', {
    organization_id: organizationId,
    request_type: cleanText(governance.firstRequestType, 'onboarding'),
    title: cleanText(governance.firstRequestTitle, 'Finaliser onboarding partenaire TrainingHub'),
    description: 'Vérifier accès, offre, plan, facturation, session, preuves et renouvellement.',
    status: 'open',
    priority: cleanText(governance.priority, 'high'),
    sla_policy: cleanText(governance.slaPolicy, 'standard_48h'),
    due_at: governance.dueAt || null,
    metadata: { source: 'create_partner_dossier_v2_presets', governance },
    created_at: now,
    updated_at: now,
  })
  if (requestRow.ok) result.request = requestRow.data

  const notification = await adaptiveInsert(supabase, 'partner_notifications', {
    organization_id: organizationId,
    title: cleanText(governance.welcomeNotificationTitle, 'Bienvenue sur AngelCare TrainingHub'),
    body: cleanText(governance.welcomeNotificationBody, 'Votre dossier partenaire est créé. Votre référent AngelCare finalisera l’activation.'),
    status: 'unread',
    notification_type: 'welcome',
    action_url: '/traininghub/partner',
    metadata: { source: 'create_partner_dossier_v2_presets', enabled_modules: enabledModules },
    created_at: now,
  })
  if (notification.ok) result.notification = notification.data

  const activity = await logActivity(supabase, organizationId, 'created_full_v2', {
    title: `Dossier partenaire créé: ${name}`,
    organization_id: organizationId,
    plan: commercial.plan,
    billing_model: billingModel,
    selected_services: selectedServices,
    enabled_modules: enabledModules,
  })
  if (activity.ok) result.audit.push(activity.data)

  return NextResponse.json({
    ok: true,
    data: {
      organization_id: organizationId,
      organization: result.organization,
      account: result.account,
      authUser: result.authUser,
      profile: result.profile,
      membership: result.membership,
      role: result.role,
      proposal: result.proposal,
      proposalItems: result.proposalItems,
      subscription: result.subscription,
      trainingCredits: result.trainingCredits,
      session: result.session,
      documents: result.documents,
      request: result.request,
      notification: result.notification,
      audit: result.audit,
      summary: {
        created_partner: true,
        created_account: Boolean(result.account),
        created_user_access: Boolean(result.authUser?.id),
        created_offer: Boolean(result.proposal),
        created_proposal_items: result.proposalItems.length,
        created_subscription: Boolean(result.subscription),
        created_training_credits: Boolean(result.trainingCredits),
        created_session: Boolean(result.session),
        created_documents: result.documents.length,
        created_request: Boolean(result.request),
        created_notification: Boolean(result.notification),
      },
    },
  })
}
