import { createClient } from '@supabase/supabase-js'

type Row = Record<string, any>

export type OfferLine = {
  id: string
  label: string
  code: string
  quantity: number
  unitMinor: number
  totalMinor: number
  category: string
}

export type OfferRecord = {
  id: string
  organizationId: string
  partnerName: string
  partnerCity: string
  owner: string
  number: string
  title: string
  status: string
  packageId: string
  packageLabel: string
  amountMinor: number
  currency: string
  credits: number
  participants: number
  portalVisible: boolean
  createdAt: string
  updatedAt: string
  validUntil: string
  linked: Record<string, boolean>
  lines: OfferLine[]
}

export const OFFER_PACKAGES = [
  { id: 'activation', label: 'Activation', amountMinor: 720000, credits: 10, participants: 10, description: 'Dossier, accès, première session et kit démarrage.' },
  { id: 'growth', label: 'Growth', amountMinor: 1850000, credits: 24, participants: 24, description: 'Abonnement annuel, crédits, refresh et reporting.' },
  { id: 'premium', label: 'Premium', amountMinor: 4200000, credits: 60, participants: 60, description: 'Preuves premium, SLA renforcé, multi-site et support.' },
  { id: 'enterprise', label: 'Enterprise', amountMinor: 9500000, credits: 120, participants: 120, description: 'Gouvernance, analytics, réseau et renouvellement.' },
  { id: 'custom', label: 'Custom', amountMinor: 0, credits: 0, participants: 0, description: 'Offre sur mesure avec lignes personnalisées.' },
]

export const LINE_CATALOGUE: OfferLine[] = [
  { id: 'session', label: 'Session formation', code: 'TRAINING_SESSION', quantity: 1, unitMinor: 350000, totalMinor: 350000, category: 'delivery' },
  { id: 'credits', label: 'Crédits formation', code: 'TRAINING_CREDITS', quantity: 10, unitMinor: 50000, totalMinor: 500000, category: 'credits' },
  { id: 'participants', label: 'Participants supplémentaires', code: 'EXTRA_PARTICIPANTS', quantity: 10, unitMinor: 25000, totalMinor: 250000, category: 'credits' },
  { id: 'refresh', label: 'Refresh annuel', code: 'ANNUAL_REFRESH', quantity: 1, unitMinor: 280000, totalMinor: 280000, category: 'renewal' },
  { id: 'certificates', label: 'Pack certificats', code: 'CERTIFICATE_PACK', quantity: 1, unitMinor: 180000, totalMinor: 180000, category: 'proofs' },
  { id: 'proofs', label: 'Pack preuves & reporting', code: 'PROOF_REPORTING_PACK', quantity: 1, unitMinor: 320000, totalMinor: 320000, category: 'proofs' },
  { id: 'onsite', label: 'Visite sur site', code: 'ONSITE_VISIT', quantity: 1, unitMinor: 450000, totalMinor: 450000, category: 'delivery' },
  { id: 'support', label: 'Support premium', code: 'PREMIUM_SUPPORT', quantity: 1, unitMinor: 650000, totalMinor: 650000, category: 'sla' },
  { id: 'starter', label: 'Kit démarrage', code: 'STARTER_KIT', quantity: 1, unitMinor: 120000, totalMinor: 120000, category: 'onboarding' },
]

const clean = (v: unknown, fallback = '') => String(v || '').trim() || fallback
const norm = (v: unknown) => clean(v).toLowerCase()
const arr = (data: any) => Array.isArray(data) ? data : data ? [data] : []
const now = () => new Date().toISOString()
const serial = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`
const moneyMinor = (row: Row) => Number(row.grand_total_minor || row.total_minor || row.subtotal_minor || row.amount_minor || 0) || 0

function parseColumnError(error: any) {
  const msg = String(error?.message || error || '')
  return msg.match(/Could not find the '([^']+)' column/i)?.[1]
    || msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1]
    || msg.match(/null value in column "([^"]+)"/i)?.[1]
    || ''
}

function isInternalOrg(row: Row) {
  const text = `${norm(row.organization_type)} ${norm(row.type)} ${norm(row.segment)} ${norm(row.name)}`
  return text.includes('internal') || text.includes('angelcare_internal') || text.includes('opsos')
}

function packById(id: string) {
  return OFFER_PACKAGES.find(p => p.id === id) || OFFER_PACKAGES[0]
}

function inferPackage(row: Row) {
  const fromMeta = clean(row.metadata?.package || row.package_id)
  if (fromMeta) return fromMeta
  const title = norm(row.title)
  if (title.includes('growth')) return 'growth'
  if (title.includes('premium')) return 'premium'
  if (title.includes('enterprise')) return 'enterprise'
  if (title.includes('custom')) return 'custom'
  return 'activation'
}

function linesFrom(row: Row): OfferLine[] {
  const raw = row.metadata?.line_items || row.lines || []
  if (Array.isArray(raw) && raw.length) {
    return raw.map((line: any, i: number) => ({
      id: clean(line.id, `line_${i}`),
      label: clean(line.label || line.title || line.name, `Ligne ${i + 1}`),
      code: clean(line.code || line.sku, `LINE_${i + 1}`),
      quantity: Number(line.quantity || 1),
      unitMinor: Number(line.unitMinor || line.unit_minor || line.unit_price_minor || line.amount_minor || 0),
      totalMinor: Number(line.totalMinor || line.total_minor || line.amount_minor || 0),
      category: clean(line.category, 'custom'),
    }))
  }
  const id = inferPackage(row)
  if (id === 'custom') return []
  if (id === 'activation') return LINE_CATALOGUE.filter(l => ['session','credits','starter'].includes(l.id))
  if (id === 'growth') return LINE_CATALOGUE.filter(l => ['session','credits','refresh','proofs'].includes(l.id))
  if (id === 'premium') return LINE_CATALOGUE.filter(l => ['session','credits','proofs','certificates','support'].includes(l.id))
  return LINE_CATALOGUE
}

function byOrg(rows: Row[]) {
  const map = new Map<string, Row[]>()
  rows.forEach(row => {
    const id = clean(row.organization_id || row.partner_id || row.org_id)
    if (!id) return
    map.set(id, [...(map.get(id) || []), row])
  })
  return map
}

function byOffer(rows: Row[]) {
  const map = new Map<string, Row[]>()
  rows.forEach(row => {
    const id = clean(row.proposal_id || row.offer_id || row.source_proposal_id)
    if (!id) return
    map.set(id, [...(map.get(id) || []), row])
  })
  return map
}

export function createOffersAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env for TrainingHub offers.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function safeRows(supabase: any, table: string) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(400)
    if (error) return { table, rows: [], error: error.message }
    return { table, rows: arr(data), error: null }
  } catch (e) {
    return { table, rows: [], error: e instanceof Error ? e.message : String(e || 'unknown') }
  }
}

async function adaptiveInsert(supabase: any, table: string, payload: Row) {
  let row = JSON.parse(JSON.stringify(payload))
  for (let i = 0; i < 24; i++) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, error: null }
    const col = parseColumnError(error)
    if (col && col in row) { delete row[col]; continue }
    return { ok: false, table, data: null, error: error.message }
  }
  return { ok: false, table, data: null, error: 'adaptive insert failed' }
}

async function adaptiveUpdate(supabase: any, table: string, id: string, payload: Row) {
  let row = JSON.parse(JSON.stringify(payload))
  for (let i = 0; i < 24; i++) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, error: null }
    const col = parseColumnError(error)
    if (col && col in row) { delete row[col]; continue }
    return { ok: false, table, data: null, error: error.message }
  }
  return { ok: false, table, data: null, error: 'adaptive update failed' }
}

async function adaptiveDelete(supabase: any, table: string, id: string) {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id')
  if (error) return { ok: false, table, data: null, error: error.message }
  return { ok: true, table, data, error: null }
}

async function audit(supabase: any, action: string, payload: Row, result: any) {
  await adaptiveInsert(supabase, 'auto_events', {
    organization_id: payload.organization_id || null,
    event_type: `traininghub.offres.${action}`,
    title: `Offer action: ${action}`,
    status: result?.ok === false ? 'failed' : 'completed',
    payload: { input: payload, result: result?.data || result },
    created_at: now(),
  }).catch(() => null)
}

export async function buildOffersWorkspace(supabase: any) {
  const results = await Promise.all([
    safeRows(supabase, 'core_organizations'),
    safeRows(supabase, 'bill_proposals'),
    safeRows(supabase, 'bill_orders'),
    safeRows(supabase, 'bill_subscriptions'),
    safeRows(supabase, 'bill_invoices'),
    safeRows(supabase, 'bill_training_credits'),
    safeRows(supabase, 'trn_sessions'),
    safeRows(supabase, 'partner_documents'),
  ])

  const partnersRaw = results[0].rows.filter((p: Row) => !isInternalOrg(p))
  const partnerMap = new Map<string, Row>()
  partnersRaw.forEach((p: Row) => partnerMap.set(clean(p.id), p))

  const ordersByOffer = byOffer(results[2].rows)
  const subscriptionsByOffer = byOffer(results[3].rows)
  const invoicesByOffer = byOffer(results[4].rows)
  const creditsByOrg = byOrg(results[5].rows)
  const sessionsByOrg = byOrg(results[6].rows)
  const documentsByOrg = byOrg(results[7].rows)

  const offers: OfferRecord[] = results[1].rows.map((row: Row) => {
    const orgId = clean(row.organization_id || row.partner_id)
    const partner = partnerMap.get(orgId) || {}
    const packageId = inferPackage(row)
    const pack = packById(packageId)
    return {
      id: clean(row.id),
      organizationId: orgId,
      partnerName: clean(partner.name || partner.legal_name || partner.display_name, 'Partenaire non lié'),
      partnerCity: clean(partner.city || partner.metadata?.partner?.city, 'Ville non renseignée'),
      owner: clean(partner.owner_name || partner.account_owner || partner.metadata?.commercial?.owner, 'Non assigné'),
      number: clean(row.proposal_number || row.reference || row.code, 'OFFRE-SANS-REF'),
      title: clean(row.title || row.name || row.plan_name, pack.label),
      status: clean(row.status, 'draft'),
      packageId,
      packageLabel: pack.label,
      amountMinor: moneyMinor(row),
      currency: clean(row.currency, 'MAD'),
      credits: Number(row.metadata?.credits || row.metadata?.participants || pack.credits || 0),
      participants: Number(row.metadata?.participants || pack.participants || 0),
      portalVisible: row.portal_visible === true || row.is_visible_to_partner === true,
      createdAt: clean(row.created_at),
      updatedAt: clean(row.updated_at || row.created_at),
      validUntil: clean(row.valid_until || row.expires_at),
      linked: {
        order: (ordersByOffer.get(clean(row.id)) || []).length > 0,
        subscription: (subscriptionsByOffer.get(clean(row.id)) || []).length > 0,
        invoice: (invoicesByOffer.get(clean(row.id)) || []).length > 0,
        credits: (creditsByOrg.get(orgId) || []).length > 0,
        session: (sessionsByOrg.get(orgId) || []).length > 0,
        documents: (documentsByOrg.get(orgId) || []).length > 0,
      },
      lines: linesFrom(row),
    }
  })

  const kpis = [
    { id: 'total', label: 'Offres', value: offers.length, sublabel: 'portefeuille', tone: 'blue' },
    { id: 'draft', label: 'Brouillons', value: offers.filter(o => norm(o.status) === 'draft').length, sublabel: 'à finaliser', tone: 'slate' },
    { id: 'sent', label: 'Envoyées', value: offers.filter(o => ['sent','viewed'].includes(norm(o.status))).length, sublabel: 'à relancer', tone: 'amber' },
    { id: 'accepted', label: 'Acceptées', value: offers.filter(o => ['accepted','signed','validated'].includes(norm(o.status))).length, sublabel: 'à convertir', tone: 'green' },
    { id: 'converted', label: 'Converties', value: offers.filter(o => o.linked.order || norm(o.status) === 'converted').length, sublabel: 'commandes', tone: 'violet' },
    { id: 'forecast', label: 'CA offres', value: offers.reduce((sum, o) => sum + o.amountMinor, 0), sublabel: 'MAD mineur', tone: 'blue' },
    { id: 'portal', label: 'Portail visible', value: offers.filter(o => o.portalVisible).length, sublabel: 'publiées', tone: 'green' },
  ] as const

  const warnings = results.filter(r => r.error).map(r => `${r.table}: ${r.error}`)
  return {
    generatedAt: now(),
    offers,
    partners: partnersRaw.map((p: Row) => ({
      id: clean(p.id),
      name: clean(p.name || p.legal_name || p.display_name, 'Partenaire TrainingHub'),
      city: clean(p.city || p.metadata?.partner?.city, 'Ville non renseignée'),
      status: clean(p.status, 'active'),
      owner: clean(p.owner_name || p.account_owner || p.metadata?.commercial?.owner, 'Non assigné'),
    })),
    kpis,
    packages: OFFER_PACKAGES,
    lineCatalogue: LINE_CATALOGUE,
    syncHealth: {
      score: Math.round((results.filter(r => !r.error).length / Math.max(results.length, 1)) * 100),
      warnings,
      tables: results.map(r => ({ table: r.table, count: r.rows.length, ok: !r.error, error: r.error })),
    },
  }
}

function linesPayload(input: Row): OfferLine[] {
  if (Array.isArray(input.lines) && input.lines.length) return input.lines
  const pack = packById(clean(input.package || input.package_id, 'activation'))
  if (pack.id === 'custom') return []
  if (pack.id === 'activation') return LINE_CATALOGUE.filter(l => ['session','credits','starter'].includes(l.id))
  if (pack.id === 'growth') return LINE_CATALOGUE.filter(l => ['session','credits','refresh','proofs'].includes(l.id))
  if (pack.id === 'premium') return LINE_CATALOGUE.filter(l => ['session','credits','proofs','certificates','support'].includes(l.id))
  return LINE_CATALOGUE
}

export async function executeOfferAction(supabase: any, action: string, payload: Row) {
  const orgId = clean(payload.organization_id || payload.partner_id)
  const offerId = clean(payload.offer_id || payload.proposal_id || payload.id)
  const t = now()
  let result: any

  if (['create_offer','create_multiple_offers'].includes(action) && !orgId) throw new Error('organization_id is required.')
  if (['update_offer','send_offer','accept_offer','reject_offer','archive_offer','delete_offer_permanently','duplicate_offer','convert_offer_to_order','publish_offer_to_portal'].includes(action) && !offerId) throw new Error('offer_id is required.')

  if (action === 'create_offer') {
    const pack = packById(clean(payload.package || 'activation'))
    const amount = Number(payload.amount_minor || pack.amountMinor)
    result = await adaptiveInsert(supabase, 'bill_proposals', {
      organization_id: orgId,
      partner_id: orgId,
      proposal_number: serial('TH-OFFRE'),
      title: clean(payload.title, `${pack.label} TrainingHub`),
      status: clean(payload.status, 'draft'),
      currency: clean(payload.currency, 'MAD'),
      subtotal_minor: amount,
      total_minor: amount,
      grand_total_minor: amount,
      valid_until: payload.valid_until || new Date(Date.now() + 30 * 86400000).toISOString(),
      portal_visible: Boolean(payload.portal_visible),
      metadata: {
        source: 'traininghub_offres_management',
        package: pack.id,
        package_label: pack.label,
        credits: Number(payload.credits || pack.credits),
        participants: Number(payload.participants || pack.participants),
        billing_period: clean(payload.billing_period, 'annual'),
        payment_policy: clean(payload.payment_policy, 'manual_agreement'),
        renewal_policy: clean(payload.renewal_policy, 'manual_review_30_days_before_end'),
        line_items: linesPayload({ ...payload, package: pack.id }),
        notes: clean(payload.notes),
      },
      created_at: t,
      updated_at: t,
    })
  } else if (action === 'create_multiple_offers') {
    const packs = Array.isArray(payload.packages) && payload.packages.length ? payload.packages : ['activation','growth']
    const writes = []
    for (const packId of packs) {
      const pack = packById(clean(packId, 'activation'))
      writes.push(await adaptiveInsert(supabase, 'bill_proposals', {
        organization_id: orgId,
        partner_id: orgId,
        proposal_number: serial('TH-OFFRE'),
        title: `${pack.label} TrainingHub`,
        status: 'draft',
        currency: 'MAD',
        subtotal_minor: pack.amountMinor,
        total_minor: pack.amountMinor,
        grand_total_minor: pack.amountMinor,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
        portal_visible: false,
        metadata: { source: 'traininghub_offres_management_multi', package: pack.id, package_label: pack.label, credits: pack.credits, participants: pack.participants, line_items: linesPayload({ package: pack.id }) },
        created_at: t,
        updated_at: t,
      }))
    }
    result = { ok: writes.every(w => w.ok), table: 'bill_proposals', data: writes, error: writes.find(w => !w.ok)?.error || null }
  } else if (action === 'update_offer') {
    const pack = packById(clean(payload.package || 'activation'))
    const amount = Number(payload.amount_minor || pack.amountMinor)
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, {
      title: clean(payload.title, `${pack.label} TrainingHub`),
      status: clean(payload.status, 'draft'),
      currency: clean(payload.currency, 'MAD'),
      subtotal_minor: amount,
      total_minor: amount,
      grand_total_minor: amount,
      valid_until: payload.valid_until || null,
      portal_visible: Boolean(payload.portal_visible),
      updated_at: t,
      metadata: {
        source: 'traininghub_offres_management_update',
        package: pack.id,
        package_label: pack.label,
        credits: Number(payload.credits || pack.credits),
        participants: Number(payload.participants || pack.participants),
        billing_period: clean(payload.billing_period, 'annual'),
        payment_policy: clean(payload.payment_policy, 'manual_agreement'),
        renewal_policy: clean(payload.renewal_policy, 'manual_review_30_days_before_end'),
        line_items: linesPayload({ ...payload, package: pack.id }),
        notes: clean(payload.notes),
      },
    })
  } else if (action === 'send_offer') {
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, { status: 'sent', sent_at: t, portal_visible: payload.portal_visible !== false, updated_at: t })
  } else if (action === 'accept_offer') {
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, { status: 'accepted', accepted_at: t, updated_at: t })
  } else if (action === 'reject_offer') {
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, { status: 'rejected', rejected_at: t, updated_at: t })
  } else if (action === 'archive_offer') {
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, { status: 'archived', archived_at: t, portal_visible: false, is_visible_to_partner: false, updated_at: t })
  } else if (action === 'delete_offer_permanently') {
    result = await adaptiveDelete(supabase, 'bill_proposals', offerId)
  } else if (action === 'duplicate_offer') {
    const { data, error } = await supabase.from('bill_proposals').select('*').eq('id', offerId).maybeSingle()
    if (error || !data) throw new Error(error?.message || 'Offer not found.')
    const clone = { ...data }
    delete clone.id
    clone.proposal_number = serial('TH-OFFRE-COPY')
    clone.title = `${clean(data.title, 'Offre TrainingHub')} - copie`
    clone.status = 'draft'
    clone.portal_visible = false
    clone.created_at = t
    clone.updated_at = t
    clone.metadata = { ...(data.metadata || {}), duplicated_from: offerId, source: 'traininghub_offres_management_duplicate' }
    result = await adaptiveInsert(supabase, 'bill_proposals', clone)
  } else if (action === 'convert_offer_to_order') {
    const { data, error } = await supabase.from('bill_proposals').select('*').eq('id', offerId).maybeSingle()
    if (error || !data) throw new Error(error?.message || 'Offer not found.')
    const organizationId = clean(data.organization_id || data.partner_id || orgId)
    result = await adaptiveInsert(supabase, 'bill_orders', {
      organization_id: organizationId,
      partner_id: organizationId,
      proposal_id: offerId,
      order_number: serial('TH-CMD'),
      title: clean(data.title, 'Commande TrainingHub'),
      status: 'confirmed',
      currency: clean(data.currency, 'MAD'),
      subtotal_minor: moneyMinor(data),
      total_minor: moneyMinor(data),
      grand_total_minor: moneyMinor(data),
      metadata: { source: 'traininghub_offres_management_convert', converted_from_offer: offerId, offer_metadata: data.metadata || {} },
      created_at: t,
      updated_at: t,
    })
    await adaptiveUpdate(supabase, 'bill_proposals', offerId, { status: 'converted', converted_at: t, updated_at: t }).catch(() => null)
  } else if (action === 'publish_offer_to_portal') {
    result = await adaptiveUpdate(supabase, 'bill_proposals', offerId, { portal_visible: true, is_visible_to_partner: true, published_at: t, updated_at: t })
  } else {
    throw new Error(`Unsupported offer action: ${action}`)
  }

  await audit(supabase, action, payload, result)
  return result
}
