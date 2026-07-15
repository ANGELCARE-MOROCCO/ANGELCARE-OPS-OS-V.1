import { createClient } from '@supabase/supabase-js'

export type JsonRecord = Record<string, any>
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate'

export type CommercialPartnerRecord = {
  id: string
  name: string
  city: string
  owner: string
  segment: string
  status: string
  health: number
  stage: string
  plan: string
  amountMinor: number
  arrMinor: number
  risk: 'low' | 'medium' | 'high' | 'blocked'
  nextAction: string
  lastUpdate: string
  portalVisibility: 'hidden' | 'partial' | 'published'
  sync: Record<string, boolean>
  counts: Record<string, number>
}

export type CommercialWorkspace = {
  generatedAt: string
  kpis: Array<{ id: string; label: string; value: string | number; sublabel: string; tone: Tone; filter?: string }>
  stages: Array<{ id: string; index: string; label: string; count: number; amountMinor: number }>
  partners: CommercialPartnerRecord[]
  raw: Record<string, JsonRecord[]>
  actions: Array<{ id: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; action_type: string; organization_id?: string }>
  syncHealth: { score: number; tables: Array<{ table: string; count: number; ok: boolean; error: string | null }> }
  warnings: string[]
}

const STAGES = [
  ['prospect_identified', '01', 'Prospect identifié'],
  ['contact_established', '02', 'Contact établi'],
  ['diagnostic_done', '03', 'Diagnostic'],
  ['offer_prepared', '04', 'Offre préparée'],
  ['offer_sent', '05', 'Offre envoyée'],
  ['negotiation', '06', 'Négociation'],
  ['agreement', '07', 'Accord'],
  ['order_created', '08', 'Commande'],
  ['subscription_active', '09', 'Abonnement'],
  ['credits_issued', '10', 'Crédits'],
  ['session_planned', '11', 'Formation'],
  ['portal_visible', '12', 'Portail visible'],
] as const

export function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

export function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function asArray(data: any) {
  return Array.isArray(data) ? data : data ? [data] : []
}

function amountMinor(row: JsonRecord) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || row.total_minor || row.amount_minor || row.arr_minor || 0) || 0
}

function statusOf(row: JsonRecord) {
  return normalize(row.status || row.stage || row.state)
}

function createdAt(row: JsonRecord) {
  return clean(row.updated_at || row.created_at || row.issued_at || row.scheduled_start_at || row.starts_at)
}

function isActiveish(row: JsonRecord) {
  const status = statusOf(row)
  return !['deleted', 'archived', 'cancelled', 'void', 'inactive', 'disabled'].includes(status)
}

function isInternalOrg(row: JsonRecord) {
  const haystack = `${normalize(row.organization_type)} ${normalize(row.type)} ${normalize(row.segment)} ${normalize(row.name)} ${normalize(row.legal_name)}`
  return ['angelcare_internal', 'internal', 'opsos'].some((pattern) => haystack.includes(pattern))
}

function uniqueRows(rows: JsonRecord[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const id = clean(row.id)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function createTrainingHubCommercialAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || (!serviceKey && !anonKey)) throw new Error('Missing Supabase env for TrainingHub commercial sync.')
  return createClient(url, serviceKey || anonKey!, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function safeRows(supabase: any, table: string, select = '*', options?: { limit?: number; order?: string; organizationId?: string }) {
  try {
    let query = supabase.from(table).select(select)
    if (options?.organizationId) query = table === 'core_organizations' ? query.eq('id', options.organizationId) : query.eq('organization_id', options.organizationId)
    if (options?.order) query = query.order(options.order, { ascending: false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    return { table, rows: asArray(data), error: error?.message || null }
  } catch (error) {
    return { table, rows: [], error: error instanceof Error ? error.message : String(error || 'unknown') }
  }
}

function byOrg(rows: JsonRecord[]) {
  const map = new Map<string, JsonRecord[]>()
  for (const row of rows) {
    const orgId = clean(row.organization_id || row.partner_id || row.org_id)
    if (!orgId) continue
    const bucket = map.get(orgId) || []
    bucket.push(row)
    map.set(orgId, bucket)
  }
  return map
}

function inferStage(parts: Record<string, JsonRecord[]>) {
  const opp = (parts.opportunities || []).find(isActiveish)
  const explicit = normalize(opp?.stage || opp?.pipeline_stage)
  if (explicit) return explicit
  if ((parts.documents || []).some((row) => ['published', 'available', 'active'].includes(statusOf(row)))) return 'portal_visible'
  if ((parts.sessions || []).some((row) => ['planned', 'scheduled', 'confirmed', 'delivered', 'completed'].includes(statusOf(row)))) return 'session_planned'
  if ((parts.credits || []).some((row) => ['available', 'active', 'issued'].includes(statusOf(row)))) return 'credits_issued'
  if ((parts.subscriptions || []).some((row) => ['active', 'trialing', 'scheduled'].includes(statusOf(row)))) return 'subscription_active'
  if ((parts.orders || []).some(isActiveish)) return 'order_created'
  if ((parts.proposals || []).some((row) => ['accepted', 'signed', 'validated'].includes(statusOf(row)))) return 'agreement'
  if ((parts.proposals || []).some((row) => ['sent', 'viewed'].includes(statusOf(row)))) return 'offer_sent'
  if ((parts.proposals || []).some(isActiveish)) return 'offer_prepared'
  if (opp) return 'diagnostic_done'
  return 'prospect_identified'
}

function riskOf(parts: Record<string, JsonRecord[]>) {
  const unpaid = (parts.invoices || []).filter((row) => !['paid', 'settled', 'closed', 'cancelled'].includes(statusOf(row))).length
  const sent = (parts.proposals || []).filter((row) => ['sent', 'viewed'].includes(statusOf(row))).length
  if (unpaid >= 2) return 'high'
  if (unpaid === 1 || sent >= 1) return 'medium'
  if (!(parts.credits || []).length && !(parts.sessions || []).length) return 'medium'
  return 'low'
}

function visibilityOf(parts: Record<string, JsonRecord[]>) {
  const docs = (parts.documents || []).some((row) => ['published', 'available', 'active'].includes(statusOf(row)))
  const commercial = [...(parts.proposals || []), ...(parts.invoices || [])].some((row) => row.portal_visible === true || row.is_visible_to_partner === true)
  if (docs && commercial) return 'published'
  if (docs || commercial) return 'partial'
  return 'hidden'
}

function nextAction(stage: string, risk: string, sync: Record<string, boolean>) {
  if (risk === 'high') return 'Traiter blocage commercial ou paiement'
  if (!sync.account) return 'Créer le compte billing'
  if (!sync.opportunity) return 'Qualifier opportunité'
  if (!sync.offer) return 'Préparer une offre'
  if (stage === 'offer_sent') return 'Relancer et confirmer décision'
  if (!sync.order) return 'Convertir en commande'
  if (!sync.subscription) return 'Activer abonnement annuel'
  if (!sync.credits) return 'Émettre crédits formation'
  if (!sync.session) return 'Planifier session'
  if (!sync.documents) return 'Publier preuves portail'
  return 'Préparer renouvellement'
}

function buildPartners(raw: Record<string, JsonRecord[]>) {
  const maps = Object.fromEntries(Object.entries(raw).map(([key, rows]) => [key, byOrg(rows)])) as Record<string, Map<string, JsonRecord[]>>
  return uniqueRows(raw.partners || [])
    .filter(isActiveish)
    .filter((partner) => !isInternalOrg(partner))
    .map((partner) => {
      const id = clean(partner.id)
      const parts: Record<string, JsonRecord[]> = {}
      for (const key of Object.keys(raw)) parts[key] = maps[key]?.get(id) || []
      const sync = {
        account: (parts.accounts || []).length > 0,
        opportunity: (parts.opportunities || []).length > 0,
        offer: (parts.proposals || []).length > 0,
        order: (parts.orders || []).length > 0,
        subscription: (parts.subscriptions || []).length > 0,
        invoice: (parts.invoices || []).length > 0,
        credits: (parts.credits || []).length > 0,
        session: (parts.sessions || []).length > 0,
        documents: (parts.documents || []).length > 0 || (parts.certificates || []).length > 0,
      }
      const stage = inferStage(parts)
      const risk = riskOf(parts)
      const amount = [...(parts.proposals || []), ...(parts.orders || []), ...(parts.invoices || []), ...(parts.subscriptions || [])].reduce((sum, row) => sum + amountMinor(row), 0)
      const arr = (parts.subscriptions || []).reduce((sum, row) => sum + Number(row.arr_minor || row.amount_minor || 0), 0)
      const health = Math.min(100, Math.round(Object.values(sync).filter(Boolean).length / Object.keys(sync).length * 100))
      const dates = Object.values(parts).flat().map(createdAt).filter(Boolean).sort()
      return {
        id,
        name: clean(partner.name || partner.legal_name || partner.display_name, 'Partenaire TrainingHub'),
        city: clean(partner.city || partner.metadata?.partner?.city || partner.metadata?.city, 'Ville non renseignée'),
        owner: clean(partner.owner_name || partner.account_owner || partner.metadata?.commercial?.owner, 'Non assigné'),
        segment: clean(partner.segment || partner.organization_type || partner.partner_type || partner.metadata?.segment, 'partner_school'),
        status: clean(partner.status || 'active'),
        health,
        stage,
        plan: clean(partner.plan_name || partner.metadata?.commercial?.plan || parts.subscriptions?.[0]?.plan_name || parts.proposals?.[0]?.title, 'Aucun plan'),
        amountMinor: amount,
        arrMinor: arr,
        risk,
        nextAction: nextAction(stage, risk, sync),
        lastUpdate: dates[dates.length - 1] || createdAt(partner),
        portalVisibility: visibilityOf(parts),
        sync,
        counts: {
          opportunities: (parts.opportunities || []).length,
          proposals: (parts.proposals || []).length,
          orders: (parts.orders || []).length,
          subscriptions: (parts.subscriptions || []).length,
          invoices: (parts.invoices || []).length,
          credits: (parts.credits || []).length,
          sessions: (parts.sessions || []).length,
          participants: (parts.participants || []).length,
          certificates: (parts.certificates || []).length,
          documents: (parts.documents || []).length,
          requests: (parts.requests || []).length,
        },
      } as CommercialPartnerRecord
    })
}

function kpis(partners: CommercialPartnerRecord[]) {
  const count = (fn: (p: CommercialPartnerRecord) => boolean) => partners.filter(fn).length
  const amount = partners.reduce((sum, p) => sum + p.amountMinor, 0)
  const arr = partners.reduce((sum, p) => sum + p.arrMinor, 0)
  return [
    { id: 'opps', label: 'Opportunités', value: partners.length, sublabel: 'portefeuille', tone: 'blue', filter: 'pipeline' },
    { id: 'offers', label: 'Offres préparées', value: count((p) => p.sync.offer), sublabel: 'propositions', tone: 'violet', filter: 'offers' },
    { id: 'accepted', label: 'Accords validés', value: count((p) => ['agreement', 'order_created', 'subscription_active', 'credits_issued', 'session_planned', 'portal_visible'].includes(p.stage)), sublabel: 'à convertir', tone: 'green', filter: 'accepted' },
    { id: 'forecast', label: 'CA prévisionnel', value: amount, sublabel: 'MAD mineur', tone: 'blue', filter: 'forecast' },
    { id: 'arr', label: 'ARR partenaire', value: arr, sublabel: 'abonnements', tone: 'green', filter: 'subscriptions' },
    { id: 'billing', label: 'Factures ouvertes', value: count((p) => p.sync.invoice && !p.sync.credits), sublabel: 'à sécuriser', tone: 'amber', filter: 'billing' },
    { id: 'credits', label: 'Crédits à émettre', value: count((p) => p.sync.subscription && !p.sync.credits), sublabel: 'wallet absent', tone: 'amber', filter: 'credits' },
    { id: 'sessions', label: 'Sessions à planifier', value: count((p) => p.sync.credits && !p.sync.session), sublabel: 'delivery', tone: 'amber', filter: 'delivery' },
    { id: 'renewal', label: 'Renouvellements', value: count((p) => p.stage === 'portal_visible'), sublabel: 'à préparer', tone: 'slate', filter: 'renewal' },
  ] as CommercialWorkspace['kpis']
}

function stages(partners: CommercialPartnerRecord[]) {
  return STAGES.map(([id, index, label]) => {
    const scoped = partners.filter((p) => p.stage === id)
    return { id, index, label, count: scoped.length, amountMinor: scoped.reduce((sum, p) => sum + p.amountMinor, 0) }
  })
}

function recommendedActions(partners: CommercialPartnerRecord[]) {
  const actions: CommercialWorkspace['actions'] = []
  const add = (id: string, title: string, description: string, priority: 'high'|'medium'|'low', action_type: string, organization_id?: string) => actions.push({ id, title, description, priority, action_type, organization_id })
  const noOwner = partners.find((p) => normalize(p.owner) === 'non assigné')
  if (noOwner) add('assign_owner', 'Assigner owner', `${noOwner.name} doit avoir un responsable commercial.`, 'high', 'create_followup', noOwner.id)
  const noOffer = partners.find((p) => !p.sync.offer)
  if (noOffer) add('create_offer', 'Préparer une offre', `${noOffer.name} n’a pas encore d’offre TrainingHub.`, 'high', 'create_offer', noOffer.id)
  const noCredits = partners.find((p) => p.sync.subscription && !p.sync.credits)
  if (noCredits) add('issue_credits', 'Émettre crédits', `${noCredits.name} a un abonnement sans wallet crédits.`, 'medium', 'issue_credits', noCredits.id)
  const noSession = partners.find((p) => p.sync.credits && !p.sync.session)
  if (noSession) add('plan_session', 'Planifier session', `${noSession.name} a des crédits mais aucune session.`, 'medium', 'plan_session', noSession.id)
  const hidden = partners.find((p) => p.portalVisibility === 'hidden' && p.sync.session)
  if (hidden) add('publish_portal', 'Publier portail', `${hidden.name} peut afficher preuves et documents.`, 'medium', 'publish_portal_visibility', hidden.id)
  return actions
}

export async function buildTrainingHubCommercialWorkspace(supabase: any): Promise<CommercialWorkspace> {
  const results = await Promise.all([
    safeRows(supabase, 'core_organizations', '*', { limit: 300, order: 'created_at' }),
    safeRows(supabase, 'traininghub_commercial_opportunities', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_accounts', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_subscriptions', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_proposals', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_orders', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_invoices', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'bill_training_credits', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'trn_sessions', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'trn_session_participants', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'trn_certificates', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'partner_documents', '*', { limit: 300, order: 'updated_at' }),
    safeRows(supabase, 'partner_requests', '*', { limit: 300, order: 'updated_at' }),
  ])
  const raw = {
    partners: results[0].rows,
    opportunities: results[1].rows,
    accounts: results[2].rows,
    subscriptions: results[3].rows,
    proposals: results[4].rows,
    orders: results[5].rows,
    invoices: results[6].rows,
    credits: results[7].rows,
    sessions: results[8].rows,
    participants: results[9].rows,
    certificates: results[10].rows,
    documents: results[11].rows,
    requests: results[12].rows,
  }
  const partners = buildPartners(raw)
  const ok = results.filter((r) => !r.error).length
  return {
    generatedAt: new Date().toISOString(),
    kpis: kpis(partners),
    stages: stages(partners),
    partners,
    raw,
    actions: recommendedActions(partners),
    syncHealth: {
      score: Math.round((ok / Math.max(results.length, 1)) * 100),
      tables: results.map((r) => ({ table: r.table, count: r.rows.length, ok: !r.error, error: r.error })),
    },
    warnings: results.filter((r) => r.error).map((r) => `${r.table}: ${r.error}`),
  }
}

export function parseDbColumnError(error: any) {
  const msg = String(error?.message || error || '')
  return msg.match(/Could not find the '([^']+)' column/i)?.[1] || msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] || msg.match(/null value in column "([^"]+)"/i)?.[1] || ''
}

export async function adaptiveInsert(supabase: any, table: string, payload: JsonRecord) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, error: null }
    const col = parseDbColumnError(error)
    if (col && col in row) {
      delete row[col]
      continue
    }
    return { ok: false, table, data: null, error: error.message, payload: row }
  }
  return { ok: false, table, data: null, error: 'Adaptive insert failed.', payload: row }
}

export async function adaptiveUpdate(supabase: any, table: string, id: string, payload: JsonRecord) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, error: null }
    const col = parseDbColumnError(error)
    if (col && col in row) {
      delete row[col]
      continue
    }
    return { ok: false, table, data: null, error: error.message, payload: row }
  }
  return { ok: false, table, data: null, error: 'Adaptive update failed.', payload: row }
}

function serial(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

async function audit(supabase: any, action: string, payload: JsonRecord, result: any) {
  return adaptiveInsert(supabase, 'auto_events', {
    organization_id: payload.organization_id || payload.partner_id || null,
    event_type: `traininghub.commercial.${action}`,
    title: `Commercial action: ${action}`,
    status: result?.ok === false ? 'failed' : 'completed',
    payload: { input: payload, result: result?.data || result },
    created_at: new Date().toISOString(),
  })
}

export async function executeTrainingHubCommercialAction(supabase: any, action: string, payload: JsonRecord) {
  const organizationId = clean(payload.organization_id || payload.partner_id)
  const now = new Date().toISOString()
  if (!organizationId) throw new Error('organization_id is required for commercial action.')
  let result: any
  const base = { organization_id: organizationId, partner_id: organizationId, created_at: now, updated_at: now }
  if (action === 'create_opportunity') {
    result = await adaptiveInsert(supabase, 'traininghub_commercial_opportunities', {
      ...base,
      title: clean(payload.title, 'Opportunité TrainingHub'),
      stage: clean(payload.stage, 'diagnostic_done'),
      status: clean(payload.status, 'active'),
      owner_name: clean(payload.owner_name, 'Non assigné'),
      amount_minor: toNumber(payload.amount_minor, 0),
      probability: toNumber(payload.probability, 35),
      next_action: clean(payload.next_action, 'Préparer une offre'),
      metadata: { source: 'traininghub_commercial_command_center', package: payload.package || null },
    })
    if (!result.ok) {
      result = await adaptiveInsert(supabase, 'auto_events', {
        organization_id: organizationId,
        event_type: 'traininghub.commercial.opportunity.created',
        title: clean(payload.title, 'Opportunité TrainingHub'),
        status: 'active',
        payload,
        created_at: now,
      })
    }
  } else if (action === 'create_offer') {
    result = await adaptiveInsert(supabase, 'bill_proposals', {
      ...base,
      proposal_number: serial('TH-OFFRE'),
      title: clean(payload.title, payload.plan_name || 'Offre TrainingHub partenaire'),
      status: clean(payload.status, 'draft'),
      currency: clean(payload.currency, 'MAD'),
      subtotal_minor: toNumber(payload.amount_minor, 720000),
      total_minor: toNumber(payload.amount_minor, 720000),
      grand_total_minor: toNumber(payload.amount_minor, 720000),
      valid_until: payload.valid_until || new Date(Date.now() + 30 * 86400000).toISOString(),
      portal_visible: Boolean(payload.portal_visible),
      metadata: { source: 'traininghub_commercial_command_center', package: payload.package || 'activation', line_items: payload.line_items || [] },
    })
  } else if (action === 'convert_offer_to_order') {
    result = await adaptiveInsert(supabase, 'bill_orders', {
      ...base,
      proposal_id: payload.proposal_id || null,
      order_number: serial('TH-CMD'),
      title: clean(payload.title, 'Commande TrainingHub'),
      status: 'confirmed',
      currency: clean(payload.currency, 'MAD'),
      total_minor: toNumber(payload.amount_minor, 720000),
      grand_total_minor: toNumber(payload.amount_minor, 720000),
      metadata: { source: 'traininghub_commercial_command_center' },
    })
  } else if (action === 'create_subscription') {
    const amount = toNumber(payload.amount_minor, 720000)
    result = await adaptiveInsert(supabase, 'bill_subscriptions', {
      ...base,
      account_id: payload.account_id || null,
      proposal_id: payload.proposal_id || null,
      subscription_number: serial('TH-SUB'),
      plan_name: clean(payload.plan_name, 'Activation annuelle TrainingHub'),
      status: clean(payload.status, 'active'),
      billing_period: clean(payload.billing_period, 'annual'),
      currency: clean(payload.currency, 'MAD'),
      amount_minor: amount,
      arr_minor: amount,
      mrr_minor: Math.round(amount / 12),
      starts_at: payload.starts_at || now,
      renewal_policy: clean(payload.renewal_policy, 'manual_review_30_days_before_end'),
      metadata: { source: 'traininghub_commercial_command_center', model: 'account_subscription', commission_per_sale: false },
    })
  } else if (action === 'generate_invoice') {
    result = await adaptiveInsert(supabase, 'bill_invoices', {
      ...base,
      invoice_number: serial('TH-INV'),
      title: clean(payload.title, 'Facture TrainingHub'),
      status: clean(payload.status, 'draft'),
      currency: clean(payload.currency, 'MAD'),
      amount_due_minor: toNumber(payload.amount_minor, 720000),
      grand_total_minor: toNumber(payload.amount_minor, 720000),
      issued_at: payload.issued_at || now,
      due_at: payload.due_at || new Date(Date.now() + 15 * 86400000).toISOString(),
      portal_visible: Boolean(payload.portal_visible),
      metadata: { source: 'traininghub_commercial_command_center' },
    })
  } else if (action === 'issue_credits') {
    result = await adaptiveInsert(supabase, 'bill_training_credits', {
      ...base,
      credit_type: clean(payload.credit_type, 'training_course'),
      source_type: clean(payload.source_type, 'partner_subscription'),
      status: 'available',
      quantity_total: toNumber(payload.credits, 10),
      quantity_available: toNumber(payload.credits, 10),
      quantity_remaining: toNumber(payload.credits, 10),
      quantity_used: 0,
      amount_minor: toNumber(payload.amount_minor, 720000),
      currency: clean(payload.currency, 'MAD'),
      metadata: { source: 'traininghub_commercial_command_center', credit_policy: 'commercial_issued_wallet' },
    })
  } else if (action === 'plan_session') {
    result = await adaptiveInsert(supabase, 'trn_sessions', {
      ...base,
      session_code: serial('TH-SESS'),
      title: clean(payload.title, 'Session TrainingHub'),
      status: clean(payload.status, 'planned'),
      mode: clean(payload.mode, 'onsite'),
      delivery_mode: clean(payload.delivery_mode, 'onsite'),
      city: clean(payload.city, 'Site partenaire'),
      location: clean(payload.location || payload.city, 'Site partenaire'),
      scheduled_start_at: payload.scheduled_start_at || new Date(Date.now() + 7 * 86400000).toISOString(),
      scheduled_end_at: payload.scheduled_end_at || new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString(),
      max_participants: toNumber(payload.participants, 10),
      planned_participant_count: toNumber(payload.participants, 10),
      checklist_template: clean(payload.checklist_template, 'standard_training_delivery'),
      metadata: { source: 'traininghub_commercial_command_center' },
    })
  } else if (action === 'publish_portal_visibility') {
    result = await adaptiveInsert(supabase, 'partner_documents', {
      organization_id: organizationId,
      document_type: clean(payload.document_type, 'commercial_visibility_pack'),
      title: clean(payload.title, 'Pack visibilité partenaire'),
      status: 'published',
      published_at: now,
      portal_visible: true,
      metadata: { source: 'traininghub_commercial_command_center', visibility: 'partner_portal', modules: payload.modules || ['offer', 'invoice', 'credits', 'session', 'proofs'] },
      created_at: now,
      updated_at: now,
    })
  } else if (action === 'create_followup') {
    result = await adaptiveInsert(supabase, 'partner_requests', {
      organization_id: organizationId,
      request_type: clean(payload.request_type, 'commercial_followup'),
      title: clean(payload.title, 'Relance commerciale'),
      description: clean(payload.description, 'Relance créée depuis le cockpit commercial.'),
      status: 'open',
      priority: clean(payload.priority, 'normal'),
      metadata: { source: 'traininghub_commercial_command_center', channel: payload.channel || 'phone_email_whatsapp' },
      created_at: now,
      updated_at: now,
    })
    if (!result.ok) {
      result = await adaptiveInsert(supabase, 'auto_events', {
        organization_id: organizationId,
        event_type: 'traininghub.commercial.followup.created',
        title: clean(payload.title, 'Relance commerciale'),
        status: 'open',
        payload,
        created_at: now,
      })
    }
  } else if (action === 'archive_record') {
    if (!clean(payload.table) || !clean(payload.id)) throw new Error('table and id are required.')
    result = await adaptiveUpdate(supabase, clean(payload.table), clean(payload.id), { status: 'archived', archived_at: now, updated_at: now })
  } else {
    throw new Error(`Unsupported commercial action: ${action}`)
  }
  await audit(supabase, action, { ...payload, organization_id: organizationId }, result).catch(() => null)
  return result
}
