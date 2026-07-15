import { createClient } from '@supabase/supabase-js'

export type TrainingHubProvisioningOptions = {
  organizationId: string
  planName?: string
  amountMinor?: number
  credits?: number
  currency?: string
  createSession?: boolean
  actorProfileId?: string | null
  source?: string
  execute?: boolean
}

export type TrainingHubProvisioningResult = {
  ok: boolean
  execute: boolean
  organizationId: string
  organizationName: string
  created: Array<{ table: string; id?: string | null; ok: boolean; error?: string | null }>
  existing: Record<string, number>
  readiness: {
    account: boolean
    offer: boolean
    subscription: boolean
    credits: boolean
    session: boolean
    documents: boolean
    score: number
  }
  errors: string[]
}

function nowIso() {
  return new Date().toISOString()
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function code(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

function parseDbError(error: any) {
  const msg = String(error?.message || error || '')
  return (
    msg.match(/Could not find the '([^']+)' column/i)?.[1] ||
    msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] ||
    msg.match(/null value in column "([^"]+)"/i)?.[1] ||
    ''
  )
}

function asArray(data: any) {
  return Array.isArray(data) ? data : data ? [data] : []
}

export function createTrainingHubProvisioningAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function selectByOrg(supabase: any, table: string, organizationId: string, limit = 20) {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('organization_id', organizationId).limit(limit)
    if (error) return { rows: [], error: error.message }
    return { rows: asArray(data), error: null }
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : String(error || 'unknown') }
  }
}

async function selectOrganization(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error(`TrainingHub partner organization not found: ${organizationId}`)

  return data
}

async function adaptiveInsert(supabase: any, table: string, payload: Record<string, any>, execute: boolean) {
  if (!execute) {
    return { table, ok: true, id: null, dryRun: true, payload }
  }

  let row = JSON.parse(JSON.stringify(payload || {}))

  for (let attempt = 0; attempt < 22; attempt += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()

    if (!error) {
      return { table, ok: true, id: data?.id || null, data }
    }

    const column = parseDbError(error)

    if (column && column in row) {
      delete row[column]
      continue
    }

    return { table, ok: false, id: null, error: error.message, payload: row }
  }

  return { table, ok: false, id: null, error: 'Adaptive insert failed after multiple schema attempts.', payload: row }
}

function amountMinor(options: TrainingHubProvisioningOptions) {
  return Number(options.amountMinor || 0) > 0 ? Number(options.amountMinor) : 720000
}

function creditQuantity(options: TrainingHubProvisioningOptions) {
  return Number(options.credits || 0) > 0 ? Number(options.credits) : 10
}

function currency(options: TrainingHubProvisioningOptions) {
  return clean(options.currency, 'MAD')
}

function planName(options: TrainingHubProvisioningOptions) {
  return clean(options.planName, 'Activation annuelle TrainingHub')
}

function source(options: TrainingHubProvisioningOptions) {
  return clean(options.source, 'traininghub_partner_activation_auto_provisioning')
}

function readiness(existing: Record<string, number>, created: TrainingHubProvisioningResult['created']) {
  const success = (table: string) => created.some((item) => item.table === table && item.ok)

  const state = {
    account: existing.accounts > 0 || success('bill_accounts'),
    offer: existing.proposals > 0 || success('bill_proposals'),
    subscription: existing.subscriptions > 0 || success('bill_subscriptions'),
    credits: existing.credits > 0 || success('bill_training_credits'),
    session: existing.sessions > 0 || success('trn_sessions'),
    documents: existing.documents > 0 || success('partner_documents'),
  }

  const score = Math.round(
    (state.account ? 18 : 0) +
      (state.offer ? 18 : 0) +
      (state.subscription ? 18 : 0) +
      (state.credits ? 18 : 0) +
      (state.session ? 14 : 0) +
      (state.documents ? 14 : 0),
  )

  return { ...state, score }
}

export async function ensureTrainingHubPartnerCommercialProvisioning(
  supabase: any,
  options: TrainingHubProvisioningOptions,
): Promise<TrainingHubProvisioningResult> {
  const organizationId = clean(options.organizationId)

  if (!organizationId) {
    throw new Error('organizationId is required.')
  }

  const org = await selectOrganization(supabase, organizationId)
  const organizationName = clean(org.name || org.legal_name || org.display_name, 'Partenaire TrainingHub')
  const contact = org.metadata?.contact || org.metadata?.partner || {}

  const [
    accounts,
    subscriptions,
    proposals,
    orders,
    invoices,
    credits,
    sessions,
    documents,
  ] = await Promise.all([
    selectByOrg(supabase, 'bill_accounts', organizationId, 5),
    selectByOrg(supabase, 'bill_subscriptions', organizationId, 5),
    selectByOrg(supabase, 'bill_proposals', organizationId, 10),
    selectByOrg(supabase, 'bill_orders', organizationId, 10),
    selectByOrg(supabase, 'bill_invoices', organizationId, 10),
    selectByOrg(supabase, 'bill_training_credits', organizationId, 10),
    selectByOrg(supabase, 'trn_sessions', organizationId, 10),
    selectByOrg(supabase, 'partner_documents', organizationId, 10),
  ])

  const existing = {
    accounts: accounts.rows.length,
    subscriptions: subscriptions.rows.length,
    proposals: proposals.rows.length,
    orders: orders.rows.length,
    invoices: invoices.rows.length,
    credits: credits.rows.length,
    sessions: sessions.rows.length,
    documents: documents.rows.length,
  }

  const created: TrainingHubProvisioningResult['created'] = []
  const errors = [accounts, subscriptions, proposals, orders, invoices, credits, sessions, documents]
    .map((item) => item.error)
    .filter(Boolean) as string[]

  let account = accounts.rows[0] || null
  let proposal = proposals.rows[0] || null
  let subscription = subscriptions.rows[0] || null
  let creditWallet = credits.rows[0] || null

  if (!account) {
    const result = await adaptiveInsert(supabase, 'bill_accounts', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_number: code('TH-ACC'),
      account_name: organizationName,
      status: 'active',
      account_type: 'partner_training_account',
      currency: currency(options),
      billing_email: clean(contact.email || org.billing_email || org.primary_contact_email),
      billing_phone: clean(contact.phone || org.phone),
      payment_terms: 'manual_agreement',
      invoice_policy: 'manual_review_before_issue',
      owner_name: clean(org.owner_name || org.account_owner, 'AngelCare'),
      metadata: {
        source: source(options),
        actor_profile_id: options.actorProfileId || null,
        monetization_model: 'account_subscription_no_commission',
        provisioned_at: nowIso(),
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }, Boolean(options.execute))

    created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
    account = result.data || account
  }

  if (!proposal) {
    const result = await adaptiveInsert(supabase, 'bill_proposals', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_id: account?.id || null,
      proposal_number: code('TH-OFFRE'),
      title: planName(options),
      status: 'sent',
      currency: currency(options),
      subtotal_minor: amountMinor(options),
      total_minor: amountMinor(options),
      grand_total_minor: amountMinor(options),
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      metadata: {
        source: source(options),
        actor_profile_id: options.actorProfileId || null,
        package_type: 'annual_partner_subscription',
        participants: creditQuantity(options),
        services: ['training_activation_pack', 'credit_wallet', 'refresh_readiness', 'proof_kit'],
        provisioned_at: nowIso(),
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }, Boolean(options.execute))

    created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
    proposal = result.data || proposal
  }

  if (!subscription) {
    const result = await adaptiveInsert(supabase, 'bill_subscriptions', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_id: account?.id || null,
      proposal_id: proposal?.id || null,
      subscription_number: code('TH-SUB'),
      plan_name: planName(options),
      status: 'active',
      billing_period: 'annual',
      currency: currency(options),
      amount_minor: amountMinor(options),
      starts_at: nowIso(),
      renewal_policy: 'manual_review_30_days_before_end',
      metadata: {
        source: source(options),
        actor_profile_id: options.actorProfileId || null,
        model: 'account_subscription',
        commission_per_sale: false,
        provisioned_at: nowIso(),
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }, Boolean(options.execute))

    created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
    subscription = result.data || subscription
  }

  if (!creditWallet) {
    const result = await adaptiveInsert(supabase, 'bill_training_credits', {
      organization_id: organizationId,
      partner_id: organizationId,
      account_id: account?.id || null,
      proposal_id: proposal?.id || null,
      subscription_id: subscription?.id || null,
      credit_type: 'training_course',
      source_type: 'partner_subscription',
      status: 'available',
      quantity_total: creditQuantity(options),
      quantity_available: creditQuantity(options),
      quantity_remaining: creditQuantity(options),
      quantity_used: 0,
      amount_minor: amountMinor(options),
      currency: currency(options),
      metadata: {
        source: source(options),
        actor_profile_id: options.actorProfileId || null,
        credit_policy: 'annual_partner_training_wallet',
        provisioned_at: nowIso(),
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }, Boolean(options.execute))

    created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
    creditWallet = result.data || creditWallet
  }

  if (options.createSession !== false && !sessions.rows.length) {
    const start = new Date(Date.now() + 7 * 86400000).toISOString()
    const end = new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString()
    const result = await adaptiveInsert(supabase, 'trn_sessions', {
      organization_id: organizationId,
      partner_id: organizationId,
      session_code: code('TH-SESS'),
      title: 'Session TrainingHub de lancement',
      status: 'planned',
      mode: 'onsite',
      delivery_mode: 'onsite',
      location: clean(org.city || org.metadata?.partner?.city, 'Site partenaire'),
      city: clean(org.city || org.metadata?.partner?.city, 'Site partenaire'),
      scheduled_start_at: start,
      scheduled_end_at: end,
      max_participants: creditQuantity(options),
      planned_participant_count: creditQuantity(options),
      checklist_template: 'standard_training_delivery',
      metadata: {
        source: source(options),
        actor_profile_id: options.actorProfileId || null,
        onboarding_session: true,
        provisioned_at: nowIso(),
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }, Boolean(options.execute))

    created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
  }

  if (!documents.rows.length) {
    for (const kit of ['starter_kit', 'partner_welcome_pack', 'proof_readiness_pack']) {
      const result = await adaptiveInsert(supabase, 'partner_documents', {
        organization_id: organizationId,
        document_type: kit,
        title: kit.replace(/_/g, ' '),
        status: 'published',
        published_at: nowIso(),
        metadata: {
          source: source(options),
          actor_profile_id: options.actorProfileId || null,
          visibility: 'partner_portal',
          provisioned_at: nowIso(),
        },
        created_at: nowIso(),
        updated_at: nowIso(),
      }, Boolean(options.execute))

      created.push({ table: result.table, id: result.id, ok: result.ok, error: result.error || null })
    }
  }

  const finalReadiness = readiness(existing, created)

  return {
    ok: created.every((item) => item.ok) && errors.length === 0,
    execute: Boolean(options.execute),
    organizationId,
    organizationName,
    created,
    existing,
    readiness: finalReadiness,
    errors: [...errors, ...created.map((item) => item.error).filter(Boolean)] as string[],
  }
}
