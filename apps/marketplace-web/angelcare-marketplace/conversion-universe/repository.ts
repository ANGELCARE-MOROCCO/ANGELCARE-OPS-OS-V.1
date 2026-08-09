import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { getDiscoveryItem } from '../catalog-discovery/repository'
import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { journeyForItem } from './content'
import type {
  ConversionAdminSummary,
  ConversionBasketRecord,
  ConversionEvidenceRecord,
  ConversionAvailabilityDecision,
  ConversionConsentRecord,
  ConversionJourney,
  ConversionOutcome,
  ConversionPriceSnapshot,
  ConversionQueueFilters,
  ConversionSession,
  ConversionSessionCreateInput,
  ConversionStatus,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null

const asRows = (value: unknown): Row[] =>
  Array.isArray(value) ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object') : []
const text = (value: unknown): string => typeof value === 'string' ? value : ''
const nullableText = (value: unknown): string | null => text(value) || null
const numberValue = (value: unknown): number => Number(value || 0)
const objectValue = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

function fail(operation: string, error: DbError): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_conversion_')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Basket, Booking & Checkout Conversion Universe doit être appliquée.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

function visitorHash(reference: string): string {
  return createHash('sha256').update(`angelcare-marketplace:${reference}`).digest('hex')
}

function mapPrice(row: Row | null): ConversionPriceSnapshot | null {
  if (!row) return null
  return {
    id: text(row.id),
    session_id: text(row.session_id),
    catalog_item_id: text(row.catalog_item_id),
    pricing_source: text(row.pricing_source) as ConversionPriceSnapshot['pricing_source'],
    price_book_id: nullableText(row.price_book_id),
    price_rule_id: nullableText(row.price_rule_id),
    currency_label: text(row.currency_label) || 'Dh',
    pricing_model: text(row.pricing_model),
    unit_price: row.unit_price === null || row.unit_price === undefined ? null : numberValue(row.unit_price),
    quantity: numberValue(row.quantity) || 1,
    subtotal: row.subtotal === null || row.subtotal === undefined ? null : numberValue(row.subtotal),
    discount_total: numberValue(row.discount_total),
    tax_total: numberValue(row.tax_total),
    grand_total: row.grand_total === null || row.grand_total === undefined ? null : numberValue(row.grand_total),
    status: text(row.status) as ConversionPriceSnapshot['status'],
    source_hash: text(row.source_hash),
    valid_until: text(row.valid_until),
    evidence: objectValue(row.evidence),
  }
}

function mapConsent(row: Row): ConversionConsentRecord {
  return {
    id: text(row.id),
    session_id: text(row.session_id),
    consent_key: text(row.consent_key),
    consent_version: text(row.consent_version),
    locale: text(row.locale) as CatalogLocale,
    accepted: Boolean(row.accepted),
    accepted_at: nullableText(row.accepted_at),
    text_hash: text(row.text_hash),
    evidence: objectValue(row.evidence),
  }
}

function mapOutcome(row: Row | null): ConversionOutcome | null {
  if (!row) return null
  return {
    id: text(row.id),
    session_id: text(row.session_id),
    outcome_type: text(row.outcome_type),
    canonical_object_type: text(row.canonical_object_type),
    canonical_object_id: nullableText(row.canonical_object_id),
    public_reference: text(row.public_reference),
    status: text(row.status) as ConversionOutcome['status'],
    handover_payload: objectValue(row.handover_payload),
    created_at: text(row.created_at),
  }
}

function mapSession(row: Row, item?: DiscoveryItem | null): ConversionSession {
  const priceRows = asRows(row.price_snapshots)
  const consentRows = asRows(row.consents)
  const outcomeRows = asRows(row.outcomes)
  return {
    id: text(row.id),
    public_reference: text(row.public_reference),
    session_key: text(row.session_key),
    journey: text(row.journey) as ConversionJourney,
    status: text(row.status) as ConversionStatus,
    locale: text(row.locale) as CatalogLocale,
    territory_id: nullableText(row.territory_id),
    tenant_id: nullableText(row.tenant_id),
    family_account_id: nullableText(row.family_account_id),
    crm_account_id: nullableText(row.crm_account_id),
    catalog_item_id: text(row.catalog_item_id),
    quote_basket_id: nullableText(row.quote_basket_id),
    identity_context: objectValue(row.identity_context),
    configuration: objectValue(row.configuration),
    eligibility_result: objectValue(row.eligibility_result),
    availability_result: objectValue(row.availability_result),
    failure_code: nullableText(row.failure_code),
    failure_message: nullableText(row.failure_message),
    expires_at: text(row.expires_at),
    last_activity_at: text(row.last_activity_at),
    submitted_at: nullableText(row.submitted_at),
    confirmed_at: nullableText(row.confirmed_at),
    outcome_type: nullableText(row.outcome_type),
    outcome_id: nullableText(row.outcome_id),
    item: item || null,
    priceSnapshot: mapPrice(priceRows[0] || null),
    consents: consentRows.map(mapConsent),
    outcome: mapOutcome(outcomeRows[0] || null),
  }
}

async function territoryIdForCode(code: string | null | undefined): Promise<string | null> {
  if (!code) return null
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_territories')
    .select('id')
    .eq('territory_code', code)
    .maybeSingle()
  if (error) throw fail('résoudre le territoire', error)
  return data?.id ? String(data.id) : null
}

async function itemById(itemId: string, locale: CatalogLocale): Promise<DiscoveryItem | null> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_catalog_discovery_v')
    .select('*')
    .eq('id', itemId)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw fail('charger l’offre de conversion', error)
  if (!data) return null
  const row = data as Row
  const localized = (base: string) => text(row[`${base}_${locale}`]) || text(row[`${base}_fr`])
  return {
    id: text(row.id),
    public_reference: text(row.public_reference),
    item_key: text(row.item_key),
    slug: text(row.slug),
    kind: text(row.kind) as DiscoveryItem['kind'],
    name: localized('name'),
    short_description: localized('short_description') || null,
    description: localized('description') || null,
    currency_label: text(row.currency_label) || 'Dh',
    price_mode: text(row.price_mode) as DiscoveryItem['price_mode'],
    price_amount: row.price_amount === null || row.price_amount === undefined ? null : numberValue(row.price_amount),
    featured: Boolean(row.featured),
    availability_status: text(row.availability_status),
    territory_id: nullableText(row.territory_id),
    category_key: nullableText(row.category_key),
    category_title: localized('category_title') || null,
    media_url: nullableText(row.media_url),
    trust_labels: Array.isArray(row.trust_labels) ? row.trust_labels.map(String) : [],
    metadata: objectValue(row.commercial_metadata),
  }
}

async function sessionRowByKey(sessionKey: string, hash?: string): Promise<Row | null> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_conversion_sessions')
    .select('*,price_snapshots:angelcare_marketplace_conversion_price_snapshots(*),consents:angelcare_marketplace_conversion_consents(*),outcomes:angelcare_marketplace_conversion_outcomes(*)')
    .eq('session_key', sessionKey)
  if (hash) query = query.eq('visitor_reference_hash', hash)
  const { data, error } = await query.maybeSingle()
  if (error) throw fail('charger la session de conversion', error)
  return data as Row | null
}

export async function getConversionItem(input: { locale: CatalogLocale; slug: string; territoryCode?: string | null }) {
  return getDiscoveryItem(input)
}

export async function createPublicConversionSession(input: ConversionSessionCreateInput): Promise<ConversionSession> {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const existing = await db
    .from('angelcare_marketplace_conversion_sessions')
    .select('session_key')
    .eq('idempotency_key', input.idempotencyKey)
    .eq('visitor_reference_hash', hash)
    .maybeSingle()
  if (existing.error) throw fail('rechercher une session existante', existing.error)
  if (existing.data?.session_key) {
    const replay = await getPublicConversionSession(String(existing.data.session_key), input.visitorReference)
    if (replay) return replay
  }

  const item = await getDiscoveryItem({ locale: input.locale, slug: input.itemSlug, territoryCode: input.territoryCode })
  if (!item) throw new MarketplaceError('NOT_FOUND', 'Cette offre n’est pas disponible dans le Marketplace publié.')
  const resolvedJourney = input.journey || journeyForItem(item)
  const territoryId = await territoryIdForCode(input.territoryCode)
  const sessionKey = randomUUID()
  const { data, error } = await db
    .from('angelcare_marketplace_conversion_sessions')
    .insert({
      session_key: sessionKey,
      journey: resolvedJourney,
      status: 'configuring',
      locale: input.locale,
      territory_id: territoryId || item.territory_id,
      catalog_item_id: item.id,
      visitor_reference_hash: hash,
      configuration: input.initialConfiguration || {},
      source_route: input.sourceRoute || null,
      idempotency_key: input.idempotencyKey,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single()
  if (error || !data) throw fail('créer la session de conversion', error)
  await recordEvent(String(data.id), 'session.created', { journey: resolvedJourney, itemId: item.id })
  return mapSession(data as Row, item)
}

export async function getPublicConversionSession(sessionKey: string, visitorReference: string): Promise<ConversionSession | null> {
  const row = await sessionRowByKey(sessionKey, visitorHash(visitorReference))
  if (!row) return null
  const item = await itemById(text(row.catalog_item_id), text(row.locale) as CatalogLocale)
  return mapSession(row, item)
}

export async function updatePublicConversionSession(input: {
  sessionKey: string
  visitorReference: string
  identity?: Record<string, unknown>
  configuration?: Record<string, unknown>
  status?: ConversionStatus
  territoryCode?: string | null
}): Promise<ConversionSession> {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const before = await sessionRowByKey(input.sessionKey, hash)
  if (!before) throw new MarketplaceError('NOT_FOUND', 'Session de conversion introuvable ou expirée.')
  if (['confirmed', 'cancelled', 'expired'].includes(text(before.status))) {
    throw new MarketplaceError('CONFLICT', 'Cette session ne peut plus être modifiée.')
  }
  const patch: Row = { last_activity_at: new Date().toISOString() }
  if (input.identity) patch.identity_context = { ...objectValue(before.identity_context), ...input.identity }
  if (input.configuration) patch.configuration = { ...objectValue(before.configuration), ...input.configuration }
  if (input.status) patch.status = input.status
  if (input.territoryCode !== undefined) patch.territory_id = await territoryIdForCode(input.territoryCode)
  const { data, error } = await db
    .from('angelcare_marketplace_conversion_sessions')
    .update(patch)
    .eq('id', text(before.id))
    .eq('visitor_reference_hash', hash)
    .select('*')
    .single()
  if (error || !data) throw fail('mettre à jour la session', error)
  await recordEvent(text(before.id), 'session.updated', { status: input.status || before.status })
  const current = await sessionRowByKey(input.sessionKey, hash)
  const item = await itemById(text(before.catalog_item_id), text(before.locale) as CatalogLocale)
  return mapSession(current || data as Row, item)
}

export async function revalidateConversionPrice(input: {
  sessionKey: string
  visitorReference: string
  quantity?: number
}): Promise<ConversionPriceSnapshot> {
  const db = await createServiceClient()
  const row = await sessionRowByKey(input.sessionKey, visitorHash(input.visitorReference))
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session de conversion introuvable.')
  const item = await itemById(text(row.catalog_item_id), text(row.locale) as CatalogLocale)
  if (!item) throw new MarketplaceError('NOT_FOUND', 'Offre publiée introuvable.')
  const validUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const basketId = nullableText(row.quote_basket_id)

  if (basketId) {
    const basketResult = await db
      .from('angelcare_marketplace_quote_baskets')
      .select('currency_label,items:angelcare_marketplace_quote_basket_items(catalog_item_id,quantity,unit_price)')
      .eq('id', basketId)
      .single()
    if (basketResult.error || !basketResult.data) throw fail('charger les lignes du panier', basketResult.error)
    const lines = asRows(basketResult.data.items)
    if (!lines.length) throw new MarketplaceError('VALIDATION_ERROR', 'Le panier ne contient aucune ligne à revérifier.')
    let subtotal = 0
    let quoteRequired = false
    let financeRules = 0
    const evidenceLines: Array<Record<string, unknown>> = []
    for (const line of lines) {
      let ruleQuery = db
        .from('angelcare_marketplace_finance_price_rules')
        .select('*,price_book:angelcare_marketplace_finance_price_books(*)')
        .eq('catalog_item_id', text(line.catalog_item_id))
        .eq('status', 'active')
      if (row.territory_id) ruleQuery = ruleQuery.or(`territory_id.is.null,territory_id.eq.${row.territory_id}`)
      const ruleResult = await ruleQuery.order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (ruleResult.error && ruleResult.error.code !== 'PGRST116') throw fail('résoudre le prix d’une ligne', ruleResult.error)
      const rule = ruleResult.data as Row | null
      const quantity = Math.max(1, numberValue(line.quantity))
      const unitPrice = rule ? numberValue(rule.standard_price) : line.unit_price === null || line.unit_price === undefined ? null : numberValue(line.unit_price)
      if (unitPrice === null) quoteRequired = true
      else subtotal += unitPrice * quantity
      if (rule) financeRules += 1
      evidenceLines.push({
        catalogItemId: text(line.catalog_item_id),
        quantity,
        unitPrice,
        pricingSource: rule ? 'finance_price_rule' : unitPrice === null ? 'quote_required' : 'catalog_fallback',
        priceRuleId: rule?.id || null,
        priceBookId: rule?.price_book_id || null,
      })
    }
    const totalQuantity = lines.reduce((sum, line) => sum + Math.max(1, numberValue(line.quantity)), 0)
    const sourceHash = createHash('sha256').update(JSON.stringify({ basketId, evidenceLines })).digest('hex')
    const { data, error } = await db
      .from('angelcare_marketplace_conversion_price_snapshots')
      .insert({
        session_id: text(row.id),
        catalog_item_id: item.id,
        pricing_source: quoteRequired ? 'quote_required' : financeRules === lines.length ? 'finance_price_rule' : 'catalog_fallback',
        price_book_id: null,
        price_rule_id: null,
        currency_label: text(basketResult.data.currency_label) || item.currency_label,
        pricing_model: text(row.journey) === 'b2b_quotation' ? 'custom_approved' : 'basket',
        unit_price: null,
        quantity: totalQuantity,
        subtotal: quoteRequired ? null : subtotal,
        discount_total: 0,
        tax_total: 0,
        grand_total: quoteRequired ? null : subtotal,
        status: quoteRequired ? 'quote_required' : 'valid',
        source_hash: sourceHash,
        valid_until: validUntil,
        evidence: { basketId, lineCount: lines.length, lines: evidenceLines },
      })
      .select('*')
      .single()
    if (error || !data) throw fail('enregistrer le prix du panier', error)
    await db.from('angelcare_marketplace_conversion_sessions').update({ price_snapshot_id: data.id, last_activity_at: new Date().toISOString() }).eq('id', text(row.id))
    await recordEvent(text(row.id), 'price.revalidated', { priceSnapshotId: data.id, status: data.status, basketId, lineCount: lines.length })
    return mapPrice(data as Row) as ConversionPriceSnapshot
  }

  const quantity = Math.max(1, Number(input.quantity || objectValue(row.configuration).quantity || 1))
  let ruleQuery = db
    .from('angelcare_marketplace_finance_price_rules')
    .select('*,price_book:angelcare_marketplace_finance_price_books(*)')
    .eq('catalog_item_id', item.id)
    .eq('status', 'active')
  if (row.territory_id) ruleQuery = ruleQuery.or(`territory_id.is.null,territory_id.eq.${row.territory_id}`)
  const ruleResult = await ruleQuery.order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (ruleResult.error && ruleResult.error.code !== 'PGRST116') throw fail('résoudre le prix', ruleResult.error)
  const rule = ruleResult.data as Row | null
  const book = rule ? objectValue(rule.price_book) : {}
  const quoteRequired = item.price_mode === 'quote_only' || (!rule && item.price_amount === null)
  const unitPrice = quoteRequired ? null : rule ? numberValue(rule.standard_price) : item.price_amount
  const subtotal = unitPrice === null ? null : unitPrice * quantity
  const sourceHash = createHash('sha256').update(JSON.stringify({ item: item.id, rule: rule?.id || null, unitPrice, quantity })).digest('hex')
  const { data, error } = await db
    .from('angelcare_marketplace_conversion_price_snapshots')
    .insert({
      session_id: text(row.id), catalog_item_id: item.id,
      pricing_source: quoteRequired ? 'quote_required' : rule ? 'finance_price_rule' : 'catalog_fallback',
      price_book_id: nullableText(rule?.price_book_id), price_rule_id: nullableText(rule?.id),
      currency_label: text(book.currency_label) || item.currency_label,
      pricing_model: text(rule?.pricing_model) || item.price_mode,
      unit_price: unitPrice, quantity, subtotal, discount_total: 0, tax_total: 0, grand_total: subtotal,
      status: quoteRequired ? 'quote_required' : 'valid', source_hash: sourceHash, valid_until: validUntil,
      evidence: { priceBookReference: book.public_reference || null, priceBookVersion: book.version || null, ruleId: rule?.id || null, catalogPriceMode: item.price_mode },
    })
    .select('*')
    .single()
  if (error || !data) throw fail('enregistrer le prix revérifié', error)
  await db.from('angelcare_marketplace_conversion_sessions').update({ price_snapshot_id: data.id, last_activity_at: new Date().toISOString() }).eq('id', text(row.id))
  await recordEvent(text(row.id), 'price.revalidated', { priceSnapshotId: data.id, status: data.status })
  return mapPrice(data as Row) as ConversionPriceSnapshot
}

export async function revalidateConversionAvailability(input: {
  sessionKey: string
  visitorReference: string
  quantity?: number
  configuration?: Record<string, unknown>
}): Promise<ConversionAvailabilityDecision> {
  const db = await createServiceClient()
  const row = await sessionRowByKey(input.sessionKey, visitorHash(input.visitorReference))
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session de conversion introuvable.')
  const item = await itemById(text(row.catalog_item_id), text(row.locale) as CatalogLocale)
  if (!item) throw new MarketplaceError('NOT_FOUND', 'Offre publiée introuvable.')
  const configuration = { ...objectValue(row.configuration), ...(input.configuration || {}) }
  const quantity = Math.max(1, Number(input.quantity || configuration.quantity || 1))
  const holdTargets: Array<{catalogItemId:string;holdType:'cohort_seat'|'inventory'|'service_capacity';authority:ConversionAvailabilityDecision['authority'];sourceId:string|null;startsAt:string|null;endsAt:string|null;evidence:Record<string,unknown>;quantity:number}> = []
  let decision: ConversionAvailabilityDecision
  const basketId = nullableText(row.quote_basket_id)

  if (basketId) {
    const basketResult = await db.from('angelcare_marketplace_quote_baskets').select('items:angelcare_marketplace_quote_basket_items(catalog_item_id,quantity,catalog_item:angelcare_marketplace_catalog_items(kind,price_mode))').eq('id', basketId).single()
    if (basketResult.error || !basketResult.data) throw fail('charger les lignes du panier', basketResult.error)
    const lines = asRows(basketResult.data.items)
    if (!lines.length) throw new MarketplaceError('VALIDATION_ERROR', 'Le panier est vide.')
    let unavailable = false
    let configurationRequired = false
    const evidenceLines: Array<Record<string, unknown>> = []
    let aggregateAvailable: number | null = 0
    for (const line of lines) {
      const catalogItem = objectValue(line.catalog_item)
      let availabilityQuery = db.from('angelcare_marketplace_catalog_availability').select('*').eq('catalog_item_id', text(line.catalog_item_id)).eq('available', true)
      if (row.territory_id) availabilityQuery = availabilityQuery.or(`territory_id.is.null,territory_id.eq.${row.territory_id}`)
      const availabilityResult = await availabilityQuery.order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (availabilityResult.error && availabilityResult.error.code !== 'PGRST116') throw fail('vérifier la disponibilité d’une ligne', availabilityResult.error)
      const availability = availabilityResult.data as Row | null
      const lineQuantity = Math.max(1, numberValue(line.quantity))
      const capacity = availability?.capacity_limit === null || availability?.capacity_limit === undefined ? null : numberValue(availability.capacity_limit)
      const quoted = text(catalogItem.price_mode) === 'quote_only' || ['audit','saas_module'].includes(text(catalogItem.kind))
      if (!availability) {
        if (quoted) configurationRequired = true
        else unavailable = true
      } else if (capacity !== null && capacity < lineQuantity) unavailable = true
      if (capacity === null) aggregateAvailable = null
      else if (aggregateAvailable !== null) aggregateAvailable += capacity
      const sourceId = availability?.id ? String(availability.id) : null
      evidenceLines.push({ catalogItemId: text(line.catalog_item_id), quantity: lineQuantity, capacity, sourceId, quoted })
      if (availability && !quoted && (capacity === null || capacity >= lineQuantity)) holdTargets.push({
        catalogItemId: text(line.catalog_item_id), holdType: ['product','kit'].includes(text(catalogItem.kind)) ? 'inventory' : 'service_capacity',
        authority: ['product','kit'].includes(text(catalogItem.kind)) ? 'inventory' : 'catalog', sourceId,
        startsAt: nullableText(availability.starts_at), endsAt: nullableText(availability.ends_at),
        evidence: { catalogAvailabilityId: sourceId, basketId }, quantity: lineQuantity,
      })
    }
    decision = {
      status: unavailable ? 'unavailable' : configurationRequired ? 'configuration_required' : 'hold_required',
      authority: 'inventory', quantity, availableQuantity: aggregateAvailable, sourceId: basketId,
      startsAt: null, endsAt: null,
      reason: unavailable ? 'Au moins une ligne n’est plus disponible.' : configurationRequired ? 'Une qualification opérationnelle est requise pour au moins une ligne.' : null,
      evidence: { basketId, lineCount: lines.length, lines: evidenceLines },
    }
  } else {
    const cohortId = text(configuration.cohortId)
    if (item.kind === 'training' && cohortId) {
      const { data, error } = await db.from('angelcare_marketplace_academy_cohorts').select('*').eq('id', cohortId).maybeSingle()
      if (error) throw fail('vérifier la cohorte', error)
      const available = data ? Math.max(0, Number(data.capacity || 0) - Number(data.enrolled_count || 0)) : 0
      decision = { status: data && data.status === 'enrollment_open' && available >= quantity ? 'hold_required' : 'unavailable', authority: 'academy', quantity, availableQuantity: available, sourceId: data?.id ? String(data.id) : null, startsAt: data?.starts_at ? String(data.starts_at) : null, endsAt: data?.ends_at ? String(data.ends_at) : null, reason: data ? null : 'Cohorte introuvable.', evidence: data ? { cohortReference: data.public_reference, status: data.status } : {} }
      if (decision.status === 'hold_required') holdTargets.push({catalogItemId:item.id,holdType:'cohort_seat',authority:'academy',sourceId:decision.sourceId,startsAt:decision.startsAt,endsAt:decision.endsAt,evidence:decision.evidence,quantity})
    } else {
      let query = db.from('angelcare_marketplace_catalog_availability').select('*').eq('catalog_item_id', item.id)
      if (row.territory_id) query = query.or(`territory_id.is.null,territory_id.eq.${row.territory_id}`)
      const { data, error } = await query.eq('available', true).order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (error && error.code !== 'PGRST116') throw fail('vérifier la disponibilité', error)
      const capacity = data?.capacity_limit === null || data?.capacity_limit === undefined ? null : Number(data.capacity_limit)
      const isQuoted = item.price_mode === 'quote_only' || ['audit', 'saas_module'].includes(item.kind)
      decision = data ? { status: capacity !== null && capacity < quantity ? 'unavailable' : isQuoted ? 'configuration_required' : 'hold_required', authority: item.kind === 'product' || item.kind === 'kit' ? 'inventory' : 'catalog', quantity, availableQuantity: capacity, sourceId: String(data.id), startsAt: data.starts_at ? String(data.starts_at) : null, endsAt: data.ends_at ? String(data.ends_at) : null, reason: data.reason ? String(data.reason) : null, evidence: { audience: data.audience, catalogAvailabilityId: data.id } } : { status: isQuoted ? 'configuration_required' : 'unavailable', authority: isQuoted ? 'manual_review' : 'catalog', quantity, availableQuantity: null, sourceId: null, startsAt: null, endsAt: null, reason: isQuoted ? 'Validation opérationnelle requise.' : 'Aucune disponibilité publiée pour cette sélection.', evidence: {} }
      if (decision.status === 'hold_required') holdTargets.push({catalogItemId:item.id,holdType:item.kind === 'product' || item.kind === 'kit' ? 'inventory' : 'service_capacity',authority:decision.authority,sourceId:decision.sourceId,startsAt:decision.startsAt,endsAt:decision.endsAt,evidence:decision.evidence,quantity})
    }
  }

  const holdIds: string[] = []
  if (decision.status === 'hold_required') {
    for (const target of holdTargets) {
      const { data, error } = await db.from('angelcare_marketplace_conversion_availability_holds').insert({
        session_id: text(row.id), catalog_item_id: target.catalogItemId, hold_type: target.holdType,
        authority: target.authority, authority_object_id: target.sourceId, source_reference: target.sourceId,
        quantity: target.quantity, status: 'held', starts_at: target.startsAt, ends_at: target.endsAt,
        expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), evidence: target.evidence,
      }).select('id').single()
      if (error || !data) throw fail('créer la réservation temporaire', error)
      holdIds.push(String(data.id))
    }
  }
  const result = { ...decision, holdIds }
  await db.from('angelcare_marketplace_conversion_sessions').update({ availability_result: result, status: 'consent_pending', last_activity_at: new Date().toISOString() }).eq('id', text(row.id))
  await recordEvent(text(row.id), 'availability.revalidated', result)
  return decision
}

export async function recordConversionConsent(input: {
  sessionKey: string
  visitorReference: string
  consentKey: string
  consentVersion: string
  locale: CatalogLocale
  accepted: boolean
  evidence?: Record<string, unknown>
}): Promise<ConversionConsentRecord> {
  const db = await createServiceClient()
  const row = await sessionRowByKey(input.sessionKey, visitorHash(input.visitorReference))
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session de conversion introuvable.')
  const textHash = createHash('sha256').update(`${input.consentKey}:${input.consentVersion}:${input.locale}`).digest('hex')
  const { data, error } = await db
    .from('angelcare_marketplace_conversion_consents')
    .upsert({
      session_id: text(row.id),
      consent_key: input.consentKey,
      consent_version: input.consentVersion,
      locale: input.locale,
      accepted: input.accepted,
      accepted_at: input.accepted ? new Date().toISOString() : null,
      text_hash: textHash,
      evidence: input.evidence || {},
    }, { onConflict: 'session_id,consent_key,consent_version' })
    .select('*')
    .single()
  if (error || !data) throw fail('enregistrer le consentement', error)
  await recordEvent(text(row.id), input.accepted ? 'consent.accepted' : 'consent.declined', { consentKey: input.consentKey, version: input.consentVersion })
  return mapConsent(data as Row)
}

async function createLead(input: {
  session: Row
  item: DiscoveryItem
  identity: Record<string, unknown>
  journey: ConversionJourney
}): Promise<{ id: string; public_reference: string }> {
  const db = await createServiceClient()
  const leadType = input.journey === 'service_booking'
    ? 'family'
    : input.journey === 'partner_subscription'
      ? 'partner'
      : input.item.category_key === 'hospitality'
        ? 'hotel'
        : input.item.category_key === 'health-partners'
          ? 'clinic'
          : input.item.category_key === 'corporates'
            ? 'corporate'
            : 'establishment'
  const { data, error } = await db
    .from('angelcare_marketplace_crm_leads')
    .insert({
      lead_type: leadType,
      name: text(input.identity.fullName) || text(input.identity.contactName) || input.item.name,
      organization_name: nullableText(input.identity.organizationName),
      email: nullableText(input.identity.email),
      phone: nullableText(input.identity.phone),
      source: 'marketplace_conversion',
      source_reference: text(input.session.public_reference),
      status: 'new',
      territory_id: nullableText(input.session.territory_id),
      consent_evidence: { conversionSessionId: input.session.id, journey: input.journey },
      next_action: 'Qualifier la demande Marketplace et confirmer le handover canonique.',
    })
    .select('id,public_reference')
    .single()
  if (error || !data) throw fail('créer le handover CRM', error)
  return { id: String(data.id), public_reference: String(data.public_reference) }
}

export async function confirmPublicConversion(input: {
  sessionKey: string
  visitorReference: string
  idempotencyKey: string
}): Promise<ConversionOutcome> {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const row = await sessionRowByKey(input.sessionKey, hash)
  if (!row) throw new MarketplaceError('NOT_FOUND', 'Session de conversion introuvable.')
  const existing = asRows(row.outcomes)[0]
  if (existing) return mapOutcome(existing) as ConversionOutcome
  if (new Date(text(row.expires_at)).getTime() <= Date.now()) throw new MarketplaceError('CONFLICT', 'Cette session a expiré.')
  const item = await itemById(text(row.catalog_item_id), text(row.locale) as CatalogLocale)
  if (!item) throw new MarketplaceError('NOT_FOUND', 'Offre publiée introuvable.')
  const price = mapPrice(asRows(row.price_snapshots)[0] || null)
  if (!price) throw new MarketplaceError('VALIDATION_ERROR', 'Le prix ou le statut devis doit être revérifié avant confirmation.')
  if (price.status === 'valid' && new Date(price.valid_until).getTime() <= Date.now()) {
    throw new MarketplaceError('CONFLICT', 'Le prix a expiré et doit être revérifié.')
  }
  const availability = objectValue(row.availability_result)
  if (availability.status === 'unavailable') throw new MarketplaceError('CONFLICT', 'La disponibilité sélectionnée n’est plus valide.')
  const consents = asRows(row.consents).map(mapConsent)
  const mandatory = ['marketplace_terms', 'privacy_notice']
  if (item.category_key === 'health-partners') mandatory.push('non_medical_boundary')
  const missing = mandatory.filter(key => !consents.some(consent => consent.consent_key === key && consent.accepted))
  if (missing.length) throw new MarketplaceError('VALIDATION_ERROR', `Consentements requis manquants : ${missing.join(', ')}.`)

  const identity = objectValue(row.identity_context)
  const configuration = objectValue(row.configuration)
  const journey = text(row.journey) as ConversionJourney
  let canonicalObjectType = 'marketplace_conversion_handover'
  let canonicalObjectId: string | null = null
  let publicReference = text(row.public_reference)
  let outcomeType = 'request_created'
  let outcomeStatus: ConversionOutcome['status'] = 'handover_pending'

  if (journey === 'service_booking' && row.family_account_id) {
    const { data, error } = await db
      .from('angelcare_marketplace_family_quote_requests')
      .insert({
        family_account_id: row.family_account_id,
        child_id: nullableText(configuration.childId),
        diagnostic_id: nullableText(configuration.diagnosticId),
        service_family: item.item_key,
        city: text(configuration.city) || text(identity.city) || 'À confirmer',
        requested_start_date: nullableText(configuration.requestedDate),
        schedule: objectValue(configuration.schedule),
        duration_expectation: nullableText(configuration.duration),
        location_notes: nullableText(configuration.locationNotes),
        priorities: Array.isArray(configuration.priorities) ? configuration.priorities.map(String) : [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select('id,public_reference')
      .single()
    if (error || !data) throw fail('créer la demande famille', error)
    canonicalObjectType = 'family_quote_request'
    canonicalObjectId = String(data.id)
    publicReference = String(data.public_reference)
    outcomeType = 'booking_request_created'
    outcomeStatus = 'submitted'
  } else if (journey === 'academy_enrollment' && configuration.cohortId && identity.learnerUserId) {
    const { data, error } = await db
      .from('angelcare_marketplace_academy_enrollments')
      .upsert({
        cohort_id: configuration.cohortId,
        learner_user_id: identity.learnerUserId,
        learner_provider_id: nullableText(identity.providerId),
        organization_id: nullableText(identity.organizationId),
        status: 'enrolled',
        territory_id: nullableText(row.territory_id),
        tenant_id: nullableText(row.tenant_id),
      }, { onConflict: 'cohort_id,learner_user_id' })
      .select('id')
      .single()
    if (error || !data) throw fail('créer l’inscription Academy', error)
    canonicalObjectType = 'academy_enrollment'
    canonicalObjectId = String(data.id)
    publicReference = text(configuration.cohortReference) || text(row.public_reference)
    outcomeType = 'enrollment_created'
    outcomeStatus = 'created'
  } else if (journey === 'partner_subscription' && row.tenant_id && configuration.planId) {
    const { data, error } = await db
      .from('angelcare_marketplace_partner_subscriptions')
      .insert({
        tenant_id: row.tenant_id,
        plan_id: configuration.planId,
        status: 'draft',
        renewal_mode: text(configuration.renewalMode) || 'manual',
        amount: price.grand_total,
        currency_label: price.currency_label,
      })
      .select('id,public_reference')
      .single()
    if (error || !data) throw fail('créer la demande d’abonnement', error)
    canonicalObjectType = 'partner_subscription'
    canonicalObjectId = String(data.id)
    publicReference = String(data.public_reference)
    outcomeType = 'subscription_request_created'
    outcomeStatus = 'created'
  } else {
    const lead = await createLead({ session: row, item, identity, journey })
    canonicalObjectType = 'crm_lead'
    canonicalObjectId = lead.id
    publicReference = lead.public_reference
    outcomeType = journey === 'product_checkout'
      ? 'order_handover_created'
      : journey === 'academy_enrollment'
        ? 'enrollment_request_created'
        : journey === 'quality_assessment'
          ? 'assessment_request_created'
          : journey === 'partner_subscription'
            ? 'subscription_request_created'
            : journey === 'b2b_quotation'
              ? 'quotation_request_created'
              : 'booking_request_created'
    outcomeStatus = 'handover_pending'
  }

  const { data, error } = await db
    .from('angelcare_marketplace_conversion_outcomes')
    .insert({
      session_id: row.id,
      outcome_type: outcomeType,
      canonical_object_type: canonicalObjectType,
      canonical_object_id: canonicalObjectId,
      public_reference: publicReference,
      status: outcomeStatus,
      handover_payload: {
        itemId: item.id,
        itemKey: item.item_key,
        journey,
        identity,
        configuration,
        priceSnapshotId: price.id,
        priceStatus: price.status,
        availability,
      },
      idempotency_key: input.idempotencyKey,
    })
    .select('*')
    .single()
  if (error || !data) throw fail('enregistrer le résultat de conversion', error)

  await db
    .from('angelcare_marketplace_conversion_sessions')
    .update({
      status: outcomeStatus === 'handover_pending' ? 'handover_pending' : 'confirmed',
      submitted_at: new Date().toISOString(),
      confirmed_at: outcomeStatus === 'handover_pending' ? null : new Date().toISOString(),
      outcome_type: outcomeType,
      outcome_id: data.id,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', text(row.id))
  await db.from('angelcare_marketplace_conversion_availability_holds').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('session_id', text(row.id)).eq('status', 'held')
  await recordEvent(text(row.id), 'conversion.confirmed', { outcomeId: data.id, outcomeType, canonicalObjectType, canonicalObjectId })
  return mapOutcome(data as Row) as ConversionOutcome
}

export async function getOrCreatePublicBasket(input: {
  visitorReference: string
  locale: CatalogLocale
  territoryCode?: string | null
  kind?: 'transactional' | 'quotation'
}) {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const existing = await db
    .from('angelcare_marketplace_quote_baskets')
    .select('*,items:angelcare_marketplace_quote_basket_items(*,catalog_item:angelcare_marketplace_catalog_items(id,slug,name_fr,name_en,name_ar,kind,price_mode,currency_label))')
    .eq('visitor_reference_hash', hash)
    .eq('basket_kind', input.kind || 'transactional')
    .eq('basket_status', 'draft')
    .maybeSingle()
  if (existing.error) throw fail('charger le panier', existing.error)
  if (existing.data) return existing.data
  const territoryId = await territoryIdForCode(input.territoryCode)
  const { data, error } = await db
    .from('angelcare_marketplace_quote_baskets')
    .insert({
      basket_kind: input.kind || 'transactional',
      locale: input.locale,
      visitor_reference_hash: hash,
      territory_id: territoryId,
      basket_status: 'draft',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      idempotency_key: `basket:${hash}:${input.kind || 'transactional'}`,
    })
    .select('*')
    .single()
  if (error || !data) throw fail('créer le panier', error)
  return { ...data, items: [] }
}

export async function addPublicBasketItem(input: {
  visitorReference: string
  basketId: string
  itemSlug: string
  locale: CatalogLocale
  quantity: number
  configuration?: Record<string, unknown>
}) {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const basket = await db.from('angelcare_marketplace_quote_baskets').select('*').eq('id', input.basketId).eq('visitor_reference_hash', hash).eq('basket_status', 'draft').single()
  if (basket.error || !basket.data) throw new MarketplaceError('NOT_FOUND', 'Panier introuvable ou expiré.')
  const item = await getDiscoveryItem({ locale: input.locale, slug: input.itemSlug })
  if (!item) throw new MarketplaceError('NOT_FOUND', 'Offre publiée introuvable.')
  const unitPrice = item.price_mode === 'quote_only' ? null : item.price_amount
  const quantity = Math.max(1, input.quantity)
  const existing = await db
    .from('angelcare_marketplace_quote_basket_items')
    .select('id')
    .eq('basket_id', input.basketId)
    .eq('catalog_item_id', item.id)
    .is('catalog_variant_id', null)
    .maybeSingle()
  if (existing.error) throw fail('vérifier la ligne du panier', existing.error)

  const line = {
    quantity,
    unit_price: unitPrice,
    line_total: unitPrice === null ? null : unitPrice * quantity,
    configuration: input.configuration || {},
    item_kind: item.kind,
    price_status: unitPrice === null ? 'quote_required' : 'catalog_snapshot',
    availability_status: item.availability_status,
    source_version: item.metadata.source_version || null,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
  const mutation = existing.data
    ? db.from('angelcare_marketplace_quote_basket_items').update(line).eq('id', existing.data.id)
    : db.from('angelcare_marketplace_quote_basket_items').insert({
        ...line,
        basket_id: input.basketId,
        catalog_item_id: item.id,
      })
  const { data, error } = await mutation.select('*').single()
  if (error || !data) throw fail('ajouter l’offre au panier', error)
  await recalculateBasket(input.basketId)
  return data
}

export async function removePublicBasketItem(input: { visitorReference: string; basketId: string; itemId: string }) {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const basket = await db.from('angelcare_marketplace_quote_baskets').select('id').eq('id', input.basketId).eq('visitor_reference_hash', hash).eq('basket_status', 'draft').single()
  if (basket.error || !basket.data) throw new MarketplaceError('NOT_FOUND', 'Panier introuvable.')
  const { error } = await db.from('angelcare_marketplace_quote_basket_items').delete().eq('id', input.itemId).eq('basket_id', input.basketId)
  if (error) throw fail('retirer la ligne du panier', error)
  await recalculateBasket(input.basketId)
  return { removed: true }
}

async function recalculateBasket(basketId: string) {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_quote_basket_items').select('line_total,price_status').eq('basket_id', basketId)
  if (error) throw fail('recalculer le panier', error)
  const rows = asRows(data)
  const subtotal = rows.reduce((sum, row) => sum + numberValue(row.line_total), 0)
  const quoteRequired = rows.some(row => text(row.price_status) === 'quote_required')
  await db.from('angelcare_marketplace_quote_baskets').update({ subtotal, grand_total: subtotal, pricing_status: quoteRequired ? 'mixed_quote_required' : 'catalog_snapshot', updated_at: new Date().toISOString() }).eq('id', basketId)
}

async function recordEvent(sessionId: string, eventType: string, payload: Record<string, unknown>) {
  const db = await createServiceClient()
  await db.from('angelcare_marketplace_conversion_events').insert({ session_id: sessionId, event_type: eventType, payload })
}

export async function conversionAdminSummary(context: MarketplaceRequestContext): Promise<ConversionAdminSummary> {
  const db = await createServiceClient()
  const scoped = (table: string) => {
    let query = db.from(table).select('id', { count: 'exact', head: true })
    if (context.territoryId) query = query.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`)
    if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
    return query
  }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const count = async (query: PromiseLike<{ count: number | null }>) => (await query).count || 0
  const [activeSessions, readyForConfirmation, submittedToday, abandoned, expiringHolds, quoteRequired, failedSessions, criticalExceptions] = await Promise.all([
    count(scoped('angelcare_marketplace_conversion_sessions').in('status', ['configuring', 'identity_pending', 'availability_pending', 'consent_pending', 'review', 'ready'])),
    count(scoped('angelcare_marketplace_conversion_sessions').eq('status', 'ready')),
    count(scoped('angelcare_marketplace_conversion_sessions').gte('submitted_at', today.toISOString())),
    count(scoped('angelcare_marketplace_conversion_sessions').eq('status', 'expired')),
    count(db.from('angelcare_marketplace_conversion_availability_holds').select('id', { count: 'exact', head: true }).eq('status', 'held').lte('expires_at', new Date(Date.now() + 30 * 60 * 1000).toISOString())),
    count(db.from('angelcare_marketplace_conversion_price_snapshots').select('id', { count: 'exact', head: true }).eq('status', 'quote_required')),
    count(scoped('angelcare_marketplace_conversion_sessions').eq('status', 'failed')),
    count(db.from('angelcare_marketplace_conversion_exceptions').select('id', { count: 'exact', head: true }).eq('status', 'open').in('severity', ['high', 'critical'])),
  ])
  const { data } = await db.from('angelcare_marketplace_conversion_sessions').select('journey').neq('status', 'cancelled').limit(2000)
  const journeyCounts = new Map<ConversionJourney, number>()
  for (const row of asRows(data)) {
    const journey = text(row.journey) as ConversionJourney
    journeyCounts.set(journey, (journeyCounts.get(journey) || 0) + 1)
  }
  return {
    activeSessions,
    readyForConfirmation,
    submittedToday,
    abandoned,
    expiringHolds,
    quoteRequired,
    failedSessions,
    criticalExceptions,
    conversionByJourney: [...journeyCounts].map(([journey, value]) => ({ journey, count: value })),
  }
}

export async function listConversionSessions(context: MarketplaceRequestContext, filters: ConversionQueueFilters = {}): Promise<ConversionSession[]> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_conversion_sessions')
    .select('*,price_snapshots:angelcare_marketplace_conversion_price_snapshots(*),consents:angelcare_marketplace_conversion_consents(*),outcomes:angelcare_marketplace_conversion_outcomes(*)')
    .order('last_activity_at', { ascending: false })
    .limit(Math.min(filters.limit || 200, 500))
  if (context.territoryId) query = query.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`)
  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  if (filters.journey) query = query.eq('journey', filters.journey)
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw fail('charger les sessions de conversion', error)
  const result: ConversionSession[] = []
  for (const row of asRows(data)) {
    result.push(mapSession(row, await itemById(text(row.catalog_item_id), text(row.locale) as CatalogLocale)))
  }
  return result
}

export async function recoverConversionSession(input: {
  sessionId: string
  target: ConversionStatus
  reason: string
  context: MarketplaceRequestContext
  requestId: string
  request?: Request
}): Promise<ConversionSession> {
  const db = await createServiceClient()
  const { data: before, error: loadError } = await db.from('angelcare_marketplace_conversion_sessions').select('*').eq('id', input.sessionId).single()
  if (loadError || !before) throw fail('charger la session', loadError)
  const { data, error } = await db
    .from('angelcare_marketplace_conversion_sessions')
    .update({
      status: input.target,
      failure_code: null,
      failure_message: null,
      last_activity_at: new Date().toISOString(),
      metadata: { ...objectValue(before.metadata), recoveryReason: input.reason, recoveredBy: input.context.actor.id },
    })
    .eq('id', input.sessionId)
    .select('*')
    .single()
  if (error || !data) throw fail('récupérer la session', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: input.requestId,
    action: 'marketplace.conversion.session_recovered',
    objectType: 'conversion_session',
    objectId: input.sessionId,
    beforeValue: before,
    afterValue: data,
    reason: input.reason,
    severity: 'warning',
    source: 'conversion-universe',
    request: input.request,
  })
  await recordEvent(input.sessionId, 'session.recovered', { target: input.target, reason: input.reason, actorId: input.context.actor.id })
  return mapSession(data as Row, await itemById(text(data.catalog_item_id), text(data.locale) as CatalogLocale))
}

export async function getConversionOptions(input: { item: DiscoveryItem; journey: ConversionJourney }): Promise<import('./types').ConversionOption[]> {
  const db = await createServiceClient()
  if (input.journey === 'service_booking') {
    let availabilityQuery = db
      .from('angelcare_marketplace_catalog_availability')
      .select('territory_id')
      .eq('catalog_item_id', input.item.id)
      .eq('available', true)
    const availabilityResult = await availabilityQuery.limit(100)
    if (availabilityResult.error) throw fail('charger les territoires de service', availabilityResult.error)
    const availabilityRows = asRows(availabilityResult.data)
    const territoryIds = [...new Set(availabilityRows.map(row => text(row.territory_id)).filter(Boolean))]
    const globallyAvailable = availabilityRows.some(row => !text(row.territory_id))
    if (!territoryIds.length && input.item.territory_id) territoryIds.push(input.item.territory_id)
    let territoryQuery = db
      .from('angelcare_marketplace_territories')
      .select('id,territory_code,name,country_code,timezone,currency_label,status')
      .in('status', ['soft_launch', 'live'])
      .order('name')
    if (!globallyAvailable) {
      if (!territoryIds.length) return []
      territoryQuery = territoryQuery.in('id', territoryIds)
    }
    const { data, error } = await territoryQuery.limit(100)
    if (error) throw fail('charger les territoires actifs', error)
    return asRows(data).map(row => ({
      id: text(row.id),
      label: text(row.name),
      subtitle: [text(row.country_code), text(row.territory_code)].filter(Boolean).join(' · ') || null,
      status: text(row.status),
      availableQuantity: null,
      startsAt: null,
      endsAt: null,
      priceAmount: null,
      currencyLabel: text(row.currency_label) || null,
      metadata: { territoryCode: row.territory_code, countryCode: row.country_code, timezone: row.timezone },
    }))
  }
  if (input.journey === 'academy_enrollment') {
    const courseId = text(input.item.metadata.course_id || input.item.metadata.courseId)
    let query = db.from('angelcare_marketplace_academy_cohorts').select('*').eq('status', 'enrollment_open').order('starts_at')
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query.limit(30)
    if (error) throw fail('charger les cohortes disponibles', error)
    return asRows(data).map(row => ({
      id: text(row.id),
      label: text(row.name) || text(row.public_reference),
      subtitle: nullableText(row.site_reference),
      status: text(row.status),
      availableQuantity: Math.max(0, numberValue(row.capacity) - numberValue(row.enrolled_count)),
      startsAt: nullableText(row.starts_at),
      endsAt: nullableText(row.ends_at),
      priceAmount: null,
      currencyLabel: null,
      metadata: { publicReference: row.public_reference, capacity: row.capacity, enrolledCount: row.enrolled_count },
    }))
  }
  if (input.journey === 'partner_subscription') {
    const { data, error } = await db.from('angelcare_marketplace_partner_plans').select('*').eq('status', 'published').order('sort_order')
    if (error) throw fail('charger les plans Partner OS', error)
    return asRows(data).map(row => ({
      id: text(row.id),
      label: text(row.name_fr),
      subtitle: nullableText(row.description_fr),
      status: text(row.status),
      availableQuantity: null,
      startsAt: null,
      endsAt: null,
      priceAmount: row.base_price === null || row.base_price === undefined ? null : numberValue(row.base_price),
      currencyLabel: text(row.currency_label) || 'Dh',
      metadata: { planKey: row.plan_key, billingPeriod: row.billing_period },
    }))
  }
  if (input.journey === 'quality_assessment') {
    const { data, error } = await db.from('angelcare_marketplace_quality_frameworks').select('*').eq('status', 'active').order('name_fr')
    if (error) throw fail('charger les référentiels Quality Check 360', error)
    return asRows(data).map(row => ({
      id: text(row.id),
      label: text(row.name_fr),
      subtitle: nullableText(row.description_fr),
      status: text(row.status),
      availableQuantity: null,
      startsAt: null,
      endsAt: null,
      priceAmount: null,
      currencyLabel: null,
      metadata: { frameworkKey: row.framework_key },
    }))
  }
  return []
}

export async function createConversionSessionFromBasket(input: {
  visitorReference: string
  basketId: string
  locale: CatalogLocale
  idempotencyKey: string
}): Promise<ConversionSession> {
  const db = await createServiceClient()
  const hash = visitorHash(input.visitorReference)
  const { data: basket, error } = await db
    .from('angelcare_marketplace_quote_baskets')
    .select('*,items:angelcare_marketplace_quote_basket_items(*)')
    .eq('id', input.basketId)
    .eq('visitor_reference_hash', hash)
    .eq('basket_status', 'draft')
    .single()
  if (error || !basket) throw new MarketplaceError('NOT_FOUND', 'Panier introuvable ou expiré.')
  const items = asRows(basket.items)
  if (!items.length) throw new MarketplaceError('VALIDATION_ERROR', 'Le panier est vide.')
  const first = items[0]
  const item = await itemById(text(first.catalog_item_id), input.locale)
  if (!item) throw new MarketplaceError('NOT_FOUND', 'La première offre du panier n’est plus publiée.')
  const existing = await db.from('angelcare_marketplace_conversion_sessions').select('session_key').eq('idempotency_key', input.idempotencyKey).eq('visitor_reference_hash', hash).maybeSingle()
  if (existing.error) throw fail('rechercher le checkout existant', existing.error)
  if (existing.data?.session_key) {
    const replay = await getPublicConversionSession(String(existing.data.session_key), input.visitorReference)
    if (replay) return replay
  }
  const journey: ConversionJourney = basket.basket_kind === 'quotation' ? 'b2b_quotation' : 'product_checkout'
  const { data, error: insertError } = await db.from('angelcare_marketplace_conversion_sessions').insert({
    session_key: randomUUID(),
    journey,
    status: 'identity_pending',
    locale: input.locale,
    territory_id: basket.territory_id,
    tenant_id: basket.tenant_id,
    family_account_id: basket.family_account_id,
    catalog_item_id: item.id,
    quote_basket_id: basket.id,
    visitor_reference_hash: hash,
    configuration: { basketId: basket.id, basketReference: basket.public_reference, lineCount: items.length, quantity: items.reduce((sum, row) => sum + numberValue(row.quantity), 0) },
    idempotency_key: input.idempotencyKey,
    source_route: `/angelcare-marketplace/${input.locale}/checkout`,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  }).select('*').single()
  if (insertError || !data) throw fail('ouvrir le checkout', insertError)
  await recordEvent(String(data.id), 'checkout.created_from_basket', { basketId: basket.id, lineCount: items.length })
  return mapSession(data as Row, item)
}


export async function getConversionAdminSession(context: MarketplaceRequestContext, sessionId: string): Promise<ConversionSession | null> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_conversion_sessions')
    .select('*,price_snapshots:angelcare_marketplace_conversion_price_snapshots(*),consents:angelcare_marketplace_conversion_consents(*),outcomes:angelcare_marketplace_conversion_outcomes(*)')
    .eq('id', sessionId)
  if (context.territoryId) query = query.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`)
  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  const { data, error } = await query.maybeSingle()
  if (error) throw fail('charger le dossier de conversion', error)
  if (!data) return null
  return mapSession(data as Row, await itemById(text(data.catalog_item_id), text(data.locale) as CatalogLocale))
}

export async function listConversionBaskets(context: MarketplaceRequestContext, limit = 200): Promise<ConversionBasketRecord[]> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_quote_baskets')
    .select('*,items:angelcare_marketplace_quote_basket_items(id)')
    .order('updated_at', { ascending: false })
    .limit(Math.min(limit, 500))
  if (context.territoryId) query = query.or(`territory_id.is.null,territory_id.eq.${context.territoryId}`)
  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  const { data, error } = await query
  if (error) throw fail('charger les paniers de conversion', error)
  return asRows(data).map(row => ({
    id: text(row.id),
    publicReference: text(row.public_reference),
    kind: text(row.basket_kind) === 'quotation' ? 'quotation' : 'transactional',
    status: text(row.basket_status),
    pricingStatus: text(row.pricing_status) || 'not_revalidated',
    lineCount: asRows(row.items).length,
    subtotal: numberValue(row.subtotal),
    grandTotal: numberValue(row.grand_total),
    currencyLabel: text(row.currency_label) || 'Dh',
    territoryId: nullableText(row.territory_id),
    familyAccountId: nullableText(row.family_account_id),
    tenantId: nullableText(row.tenant_id),
    expiresAt: nullableText(row.expires_at),
    createdAt: text(row.created_at),
  }))
}

export async function listConversionEvidence(
  context: MarketplaceRequestContext,
  kind: 'holds' | 'consents' | 'exceptions',
  limit = 200,
): Promise<ConversionEvidenceRecord[]> {
  const db = await createServiceClient()
  const table = kind === 'holds'
    ? 'angelcare_marketplace_conversion_availability_holds'
    : kind === 'consents'
      ? 'angelcare_marketplace_conversion_consents'
      : 'angelcare_marketplace_conversion_exceptions'
  let query = db
    .from(table)
    .select('*,session:angelcare_marketplace_conversion_sessions(id,public_reference,territory_id,tenant_id)')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 500))
  const { data, error } = await query
  if (error) throw fail(`charger les preuves ${kind}`, error)
  return asRows(data).filter(row => {
    const session = objectValue(row.session)
    if (context.territoryId && text(session.territory_id) && text(session.territory_id) !== context.territoryId) return false
    if (context.tenantId && text(session.tenant_id) !== context.tenantId) return false
    return true
  }).map(row => {
    const session = objectValue(row.session)
    if (kind === 'holds') return {
      id: text(row.id), recordType: 'hold' as const, status: text(row.status), severity: null,
      sessionId: text(row.session_id), sessionReference: nullableText(session.public_reference),
      title: `${text(row.authority) || 'availability'} · ${text(row.source_reference) || 'hold'}`,
      detail: text(row.reason) || `Quantité réservée: ${numberValue(row.quantity)}`,
      expiresAt: nullableText(row.expires_at), createdAt: text(row.created_at),
    }
    if (kind === 'consents') return {
      id: text(row.id), recordType: 'consent' as const, status: Boolean(row.accepted) ? 'accepted' : 'declined', severity: null,
      sessionId: text(row.session_id), sessionReference: nullableText(session.public_reference),
      title: `${text(row.consent_key)} · v${text(row.consent_version)}`,
      detail: `${text(row.locale).toUpperCase()} · ${text(row.text_hash).slice(0, 16)}`,
      expiresAt: null, createdAt: text(row.created_at),
    }
    return {
      id: text(row.id), recordType: 'exception' as const, status: text(row.status), severity: nullableText(row.severity),
      sessionId: text(row.session_id), sessionReference: nullableText(session.public_reference),
      title: text(row.exception_code) || 'conversion_exception',
      detail: text(row.message), expiresAt: null, createdAt: text(row.created_at),
    }
  })
}
