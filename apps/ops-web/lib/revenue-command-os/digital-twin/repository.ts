import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { normalizeRevenueOsError, RevenueOsError } from '../errors'
import { writeRevenueOsAuditEvent } from '../repository'
import type {
  RevenueTwinBootstrap,
  RevenueTwinBusinessUnit,
  RevenueTwinCapacity,
  RevenueTwinCustomerSegment,
  RevenueTwinDecisionMaker,
  RevenueTwinDependency,
  RevenueTwinEditableEntity,
  RevenueTwinGrowthPath,
  RevenueTwinMarket,
  RevenueTwinMutationInput,
  RevenueTwinOffer,
  RevenueTwinOfferRelationship,
  RevenueTwinPriceRule,
  RevenueTwinSalesChannel,
  RevenueTwinSalesJourney,
  RevenueTwinSeasonalWindow,
  RevenueTwinStatus,
  RevenueTwinValidationIssue,
} from '../types'
import { REVENUE_TWIN_ENTITY_TABLES, REVENUE_TWIN_SECTIONS } from './constants'
import { createSeedDigitalTwinBootstrap } from './seed-data'
import { calculateDigitalTwinCompleteness, validateDigitalTwin } from './validation'

type Row = Record<string, any>
type Actor = { id?: string; label: string }

const statusValues: RevenueTwinStatus[] = ['draft', 'needs-validation', 'validated', 'active', 'inactive', 'retired']

function array(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const valueNumber = Number(value)
  return Number.isFinite(valueNumber) ? valueNumber : fallback
}

function status(value: unknown): RevenueTwinStatus {
  return statusValues.includes(value as RevenueTwinStatus) ? value as RevenueTwinStatus : 'needs-validation'
}

function rowBusinessUnit(row: Row): RevenueTwinBusinessUnit {
  return { id: String(row.id), code: row.code, name: row.name, tagline: row.tagline || '', purpose: row.purpose || '', revenueModel: row.revenue_model || '', deliveryModel: row.delivery_model || '', ownerRole: row.owner_role || '', status: status(row.status), commercialPriority: numberValue(row.commercial_priority), activeOffers: numberValue(row.active_offers), targetSegments: numberValue(row.target_segments), territories: array(row.territories), dependencies: array(row.dependencies), source: 'database', updatedAt: row.updated_at || new Date().toISOString() }
}

function rowOffer(row: Row): RevenueTwinOffer {
  return { id: String(row.id), code: row.code, businessUnitCode: row.business_unit_code, family: row.family || '', name: row.name, commercialName: row.commercial_name || row.name, customerProblem: row.customer_problem || '', valueProposition: row.value_proposition || '', deliveryFormats: array(row.delivery_formats), targetSegmentCodes: array(row.target_segment_codes), decisionMakerCodes: array(row.decision_maker_codes), territoryCodes: array(row.territory_codes), salesCycleDays: numberValue(row.sales_cycle_days), pricingModel: row.pricing_model || '', priceFromDh: row.price_from_dh == null ? undefined : numberValue(row.price_from_dh), priceToDh: row.price_to_dh == null ? undefined : numberValue(row.price_to_dh), targetMarginPct: row.target_margin_pct == null ? undefined : numberValue(row.target_margin_pct), maxDiscountPct: row.max_discount_pct == null ? undefined : numberValue(row.max_discount_pct), requiredCapacityCodes: array(row.required_capacity_codes), evidenceAssets: array(row.evidence_assets), status: status(row.status), availability: row.availability || 'conditional', source: 'database', updatedAt: row.updated_at || new Date().toISOString() }
}

function rowSegment(row: Row): RevenueTwinCustomerSegment {
  return { id: String(row.id), code: row.code, name: row.name, category: row.category || '', profile: row.profile || '', painPoints: array(row.pain_points), buyingTriggers: array(row.buying_triggers), trustRequirements: array(row.trust_requirements), likelyObjections: array(row.likely_objections), preferredChannels: array(row.preferred_channels), bestFitOfferCodes: array(row.best_fit_offer_codes), budgetSensitivity: row.budget_sensitivity || 'medium', decisionCycle: row.decision_cycle || '', lifetimeValuePotential: row.lifetime_value_potential || 'medium', commercialPriority: numberValue(row.commercial_priority), status: status(row.status) }
}

function rowDecisionMaker(row: Row): RevenueTwinDecisionMaker {
  return { id: String(row.id), code: row.code, roleName: row.role_name, organizationTypes: array(row.organization_types), authorityLevel: row.authority_level || 'recommender', primaryConcerns: array(row.primary_concerns), motivations: array(row.motivations), requiredEvidence: array(row.required_evidence), objections: array(row.objections), preferredStyle: row.preferred_style || '', relevantOfferCodes: array(row.relevant_offer_codes), contactStrategy: row.contact_strategy || '', status: status(row.status) }
}

function rowMarket(row: Row): RevenueTwinMarket {
  return { id: String(row.id), code: row.code, country: row.country || 'Maroc', region: row.region || '', city: row.city || '', zones: array(row.zones), marketMaturity: row.market_maturity || 'emerging', priority: numberValue(row.priority), activeBusinessUnitCodes: array(row.active_business_unit_codes), immediatelyDeliverableOfferCodes: array(row.immediately_deliverable_offer_codes), conditionalOfferCodes: array(row.conditional_offer_codes), deliveryConstraints: array(row.delivery_constraints), seasonalWindows: array(row.seasonal_windows), status: status(row.status) }
}

function rowChannel(row: Row): RevenueTwinSalesChannel {
  return { id: String(row.id), code: row.code, name: row.name, channelType: row.channel_type, bestForStages: array(row.best_for_stages), bestForSegments: array(row.best_for_segments), governance: row.governance || '', measurement: array(row.measurement), status: status(row.status) }
}

function rowJourney(row: Row): RevenueTwinSalesJourney {
  return { id: String(row.id), code: row.code, name: row.name, businessUnitCodes: array(row.business_unit_codes), segmentCodes: array(row.segment_codes), offerCodes: array(row.offer_codes), objective: row.objective || '', stages: Array.isArray(row.stages) ? row.stages : [], status: status(row.status) }
}

function rowPrice(row: Row): RevenueTwinPriceRule {
  return { id: String(row.id), code: row.code, offerCode: row.offer_code, priceBook: row.price_book || '', currency: 'Dh', pricingModel: row.pricing_model || '', publicPrice: row.public_price == null ? undefined : numberValue(row.public_price), partnerPrice: row.partner_price == null ? undefined : numberValue(row.partner_price), internalCost: row.internal_cost == null ? undefined : numberValue(row.internal_cost), deliveryCost: row.delivery_cost == null ? undefined : numberValue(row.delivery_cost), minimumProtectedPrice: row.minimum_protected_price == null ? undefined : numberValue(row.minimum_protected_price), targetMarginPct: row.target_margin_pct == null ? undefined : numberValue(row.target_margin_pct), maxDiscountPct: row.max_discount_pct == null ? undefined : numberValue(row.max_discount_pct), approvalRole: row.approval_role || '', effectiveFrom: row.effective_from || '', effectiveTo: row.effective_to || undefined, status: status(row.status) }
}

function rowCapacity(row: Row): RevenueTwinCapacity {
  return { id: String(row.id), code: row.code, name: row.name, capacityType: row.capacity_type, unit: row.unit || '', availableQuantity: numberValue(row.available_quantity), reservedQuantity: numberValue(row.reserved_quantity), maximumQuantity: numberValue(row.maximum_quantity), territoryCodes: array(row.territory_codes), offerCodes: array(row.offer_codes), leadTimeDays: numberValue(row.lead_time_days), constraints: array(row.constraints), availability: row.availability || 'conditional', updatedAt: row.updated_at || new Date().toISOString() }
}

function rowDependency(row: Row): RevenueTwinDependency {
  return { id: String(row.id), code: row.code, sourceType: row.source_type, sourceCode: row.source_code, dependencyType: row.dependency_type, targetType: row.target_type, targetCode: row.target_code, rule: row.rule || '', failureEffect: row.failure_effect || '', recoveryAction: row.recovery_action || '', active: Boolean(row.active) }
}

function rowSeason(row: Row): RevenueTwinSeasonalWindow {
  return { id: String(row.id), code: row.code, name: row.name, startMonthDay: row.start_month_day, endMonthDay: row.end_month_day, segmentCodes: array(row.segment_codes), offerCodes: array(row.offer_codes), opportunity: row.opportunity || '', urgency: row.urgency || 'medium', preparationLeadDays: numberValue(row.preparation_lead_days), riskOfDelay: row.risk_of_delay || '', recommendedActions: array(row.recommended_actions), status: status(row.status) }
}

function rowGrowth(row: Row): RevenueTwinGrowthPath {
  return { id: String(row.id), code: row.code, pathType: row.path_type, sourceOfferCode: row.source_offer_code, destinationOfferCode: row.destination_offer_code, triggerSignals: array(row.trigger_signals), eligibilityRules: array(row.eligibility_rules), recommendedTiming: row.recommended_timing || '', rationale: row.rationale || '', priorityScore: numberValue(row.priority_score), status: status(row.status) }
}

function rowIssue(row: Row): RevenueTwinValidationIssue {
  return { id: String(row.id), code: row.code, entityType: row.entity_type, entityCode: row.entity_code, severity: row.severity, category: row.category, title: row.title, detail: row.detail || '', recommendedAction: row.recommended_action || '', status: row.status || 'open', detectedAt: row.detected_at || row.created_at || new Date().toISOString() }
}

function rowRelationship(row: Row): RevenueTwinOfferRelationship {
  return { id: String(row.id), code: row.code, sourceOfferCode: row.source_offer_code, targetOfferCode: row.target_offer_code, relationshipType: row.relationship_type, rationale: row.rationale || '', eligibilityRules: array(row.eligibility_rules), timing: row.timing || '', priorityScore: numberValue(row.priority_score), active: Boolean(row.active) }
}

async function safeRows(supabase: Awaited<ReturnType<typeof createClient>>, table: string, warnings: string[]): Promise<Row[]> {
  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (error) {
    warnings.push(`${table}: ${error instanceof Error ? error.message : String(error)}`)
    return []
  }
}

export async function readRevenueDigitalTwin(): Promise<{ bootstrap: RevenueTwinBootstrap; warnings: string[] }> {
  const seed = createSeedDigitalTwinBootstrap()
  const warnings: string[] = []
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch (error) {
    warnings.push(`Supabase indisponible: ${error instanceof Error ? error.message : String(error)}`)
    return { bootstrap: { ...seed, validationIssues: validateDigitalTwin(seed), completeness: calculateDigitalTwinCompleteness(seed) }, warnings }
  }

  const tables = [
    'revenue_os_business_units', 'revenue_os_offers', 'revenue_os_offer_relationships', 'revenue_os_offer_bundles',
    'revenue_os_customer_segments', 'revenue_os_decision_maker_profiles', 'revenue_os_markets', 'revenue_os_sales_channels',
    'revenue_os_sales_journeys', 'revenue_os_offer_prices', 'revenue_os_capacity_types', 'revenue_os_revenue_dependencies',
    'revenue_os_seasonal_windows', 'revenue_os_growth_paths', 'revenue_os_digital_twin_gaps',
  ]
  const results = await Promise.all(tables.map((table) => safeRows(supabase, table, warnings)))
  const [businessUnitsRows, offersRows, relationshipRows, bundleRows, segmentRows, decisionRows, marketRows, channelRows, journeyRows, priceRows, capacityRows, dependencyRows, seasonRows, growthRows, issueRows] = results

  const bootstrap: RevenueTwinBootstrap = {
    ...seed,
    generatedAt: new Date().toISOString(),
    storageMode: results.some((rows: Row[]) => rows.length) ? 'supabase' : 'contract-seed',
    sections: REVENUE_TWIN_SECTIONS,
    businessUnits: businessUnitsRows.length ? businessUnitsRows.map(rowBusinessUnit) : seed.businessUnits,
    offers: offersRows.length ? offersRows.map(rowOffer) : seed.offers,
    offerRelationships: relationshipRows.length ? relationshipRows.map(rowRelationship) : seed.offerRelationships,
    bundles: bundleRows.length ? bundleRows.map((row: Row) => ({ id: String(row.id), code: row.code, name: row.name, commercialPromise: row.commercial_promise || '', segmentCodes: array(row.segment_codes), offerCodes: array(row.offer_codes), bundleType: row.bundle_type || 'growth', pricingLogic: row.pricing_logic || '', protectedMarginPct: row.protected_margin_pct == null ? undefined : numberValue(row.protected_margin_pct), status: status(row.status) })) : seed.bundles,
    segments: segmentRows.length ? segmentRows.map(rowSegment) : seed.segments,
    decisionMakers: decisionRows.length ? decisionRows.map(rowDecisionMaker) : seed.decisionMakers,
    markets: marketRows.length ? marketRows.map(rowMarket) : seed.markets,
    channels: channelRows.length ? channelRows.map(rowChannel) : seed.channels,
    journeys: journeyRows.length ? journeyRows.map(rowJourney) : seed.journeys,
    priceRules: priceRows.length ? priceRows.map(rowPrice) : seed.priceRules,
    capacities: capacityRows.length ? capacityRows.map(rowCapacity) : seed.capacities,
    dependencies: dependencyRows.length ? dependencyRows.map(rowDependency) : seed.dependencies,
    seasonalWindows: seasonRows.length ? seasonRows.map(rowSeason) : seed.seasonalWindows,
    growthPaths: growthRows.length ? growthRows.map(rowGrowth) : seed.growthPaths,
    validationIssues: issueRows.length ? issueRows.map(rowIssue) : seed.validationIssues,
  }
  bootstrap.completeness = calculateDigitalTwinCompleteness(bootstrap)
  bootstrap.validationIssues = validateDigitalTwin(bootstrap)
  const open = bootstrap.validationIssues.filter((item) => item.status === 'open' || item.status === 'acknowledged')
  bootstrap.counters = {
    businessUnits: bootstrap.businessUnits.length,
    activeOffers: bootstrap.offers.filter((item) => item.status === 'active').length,
    targetSegments: bootstrap.segments.length,
    decisionMakers: bootstrap.decisionMakers.length,
    activeMarkets: bootstrap.markets.filter((item) => item.status === 'active').length,
    salesJourneys: bootstrap.journeys.length,
    openValidationIssues: open.length,
    criticalValidationIssues: open.filter((item) => item.severity === 'critical').length,
  }
  return { bootstrap, warnings }
}

function requiredString(payload: Record<string, unknown>, key: string, minimum = 2) {
  const value = text(payload[key]).trim()
  if (value.length < minimum) throw new RevenueOsError('REVENUE_TWIN_INVALID_INPUT', `${key} est requis.`, { status: 400 })
  return value
}

function validateMutation(input: RevenueTwinMutationInput) {
  if (!Object.prototype.hasOwnProperty.call(REVENUE_TWIN_ENTITY_TABLES, input.entity)) throw new RevenueOsError('REVENUE_TWIN_ENTITY_NOT_ALLOWED', 'Type d’objet Digital Twin non autorisé.', { status: 400 })
  if (!['create', 'update', 'retire'].includes(input.operation)) throw new RevenueOsError('REVENUE_TWIN_OPERATION_NOT_ALLOWED', 'Opération Digital Twin non autorisée.', { status: 400 })
  if (input.operation !== 'create' && !input.id) throw new RevenueOsError('REVENUE_TWIN_INVALID_INPUT', 'Identifiant requis pour cette opération.', { status: 400 })
  if (input.operation !== 'retire') {
    requiredString(input.payload, 'code')
    const nameKey = input.entity === 'decision-maker' ? 'role_name' : 'name'
    if (!['price-rule', 'dependency', 'growth-path', 'offer-relationship'].includes(input.entity)) requiredString(input.payload, nameKey)
    if (input.entity === 'price-rule') requiredString(input.payload, 'offer_code')
    if (input.entity === 'growth-path') { requiredString(input.payload, 'source_offer_code'); requiredString(input.payload, 'destination_offer_code') }
    if (input.entity === 'dependency') { requiredString(input.payload, 'source_code'); requiredString(input.payload, 'target_code') }
    if (input.entity === 'offer-relationship') { requiredString(input.payload, 'source_offer_code'); requiredString(input.payload, 'target_offer_code'); requiredString(input.payload, 'relationship_type') }
  }
}

const permittedFields: Record<RevenueTwinEditableEntity, string[]> = {
  'business-unit': ['code', 'name', 'tagline', 'purpose', 'revenue_model', 'delivery_model', 'owner_role', 'status', 'commercial_priority', 'territories', 'dependencies'],
  offer: ['code', 'business_unit_code', 'family', 'name', 'commercial_name', 'customer_problem', 'value_proposition', 'delivery_formats', 'target_segment_codes', 'decision_maker_codes', 'territory_codes', 'sales_cycle_days', 'pricing_model', 'price_from_dh', 'price_to_dh', 'target_margin_pct', 'max_discount_pct', 'required_capacity_codes', 'evidence_assets', 'status', 'availability'],
  bundle: ['code', 'name', 'commercial_promise', 'segment_codes', 'offer_codes', 'bundle_type', 'pricing_logic', 'protected_margin_pct', 'status'],
  'offer-relationship': ['code', 'source_offer_code', 'target_offer_code', 'relationship_type', 'rationale', 'eligibility_rules', 'timing', 'priority_score', 'active'],
  segment: ['code', 'name', 'category', 'profile', 'pain_points', 'buying_triggers', 'trust_requirements', 'likely_objections', 'preferred_channels', 'best_fit_offer_codes', 'budget_sensitivity', 'decision_cycle', 'lifetime_value_potential', 'commercial_priority', 'status'],
  'decision-maker': ['code', 'role_name', 'organization_types', 'authority_level', 'primary_concerns', 'motivations', 'required_evidence', 'objections', 'preferred_style', 'relevant_offer_codes', 'contact_strategy', 'status'],
  market: ['code', 'country', 'region', 'city', 'zones', 'market_maturity', 'priority', 'active_business_unit_codes', 'immediately_deliverable_offer_codes', 'conditional_offer_codes', 'delivery_constraints', 'seasonal_windows', 'status'],
  channel: ['code', 'name', 'channel_type', 'best_for_stages', 'best_for_segments', 'governance', 'measurement', 'status'],
  journey: ['code', 'name', 'business_unit_codes', 'segment_codes', 'offer_codes', 'objective', 'stages', 'status'],
  'price-rule': ['code', 'offer_code', 'price_book', 'currency', 'pricing_model', 'public_price', 'partner_price', 'internal_cost', 'delivery_cost', 'minimum_protected_price', 'target_margin_pct', 'max_discount_pct', 'approval_role', 'effective_from', 'effective_to', 'status'],
  capacity: ['code', 'name', 'capacity_type', 'unit', 'available_quantity', 'reserved_quantity', 'maximum_quantity', 'territory_codes', 'offer_codes', 'lead_time_days', 'constraints', 'availability'],
  'seasonal-window': ['code', 'name', 'start_month_day', 'end_month_day', 'segment_codes', 'offer_codes', 'opportunity', 'urgency', 'preparation_lead_days', 'risk_of_delay', 'recommended_actions', 'status'],
  'growth-path': ['code', 'path_type', 'source_offer_code', 'destination_offer_code', 'trigger_signals', 'eligibility_rules', 'recommended_timing', 'rationale', 'priority_score', 'status'],
  dependency: ['code', 'source_type', 'source_code', 'dependency_type', 'target_type', 'target_code', 'rule', 'failure_effect', 'recovery_action', 'active'],
}

function sanitizePayload(entity: RevenueTwinEditableEntity, payload: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const field of permittedFields[entity]) if (payload[field] !== undefined) result[field] = payload[field]
  return result
}

export async function mutateRevenueDigitalTwin(input: RevenueTwinMutationInput, actor: Actor) {
  validateMutation(input)
  const table = REVENUE_TWIN_ENTITY_TABLES[input.entity]
  const payload = sanitizePayload(input.entity, input.payload)
  try {
    const supabase = await createClient()
    let response: { data: Row | null; error: any }
    if (input.operation === 'create') {
      const createPayload = input.entity === 'business-unit' || input.entity === 'offer'
        ? { ...payload, source: 'manual', updated_at: new Date().toISOString() }
        : { ...payload, updated_at: new Date().toISOString() }
      response = await supabase.from(table).insert(createPayload).select('*').single()
    } else if (input.operation === 'retire') {
      const retirePayload = input.entity === 'dependency' || input.entity === 'offer-relationship'
        ? { active: false, updated_at: new Date().toISOString() }
        : input.entity === 'capacity'
          ? { availability: 'unavailable', updated_at: new Date().toISOString() }
          : { status: 'retired', updated_at: new Date().toISOString() }
      response = await supabase.from(table).update(retirePayload).eq('id', input.id).select('*').single()
    } else {
      response = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', input.id).select('*').single()
    }
    if (response.error) throw response.error
    await writeRevenueOsAuditEvent({
      action: `digital_twin.${input.entity}.${input.operation}`,
      actorId: actor.id,
      actorLabel: actor.label,
      actorType: 'user',
      resourceType: input.entity,
      resourceId: String(response.data?.id || input.id || ''),
      outcome: 'success',
      summary: `${input.operation} ${input.entity}: ${text(response.data?.code, text(payload.code))}`,
      metadata: { release: 'MZ02', fields: Object.keys(payload) },
    }, supabase)
    return response.data
  } catch (error) {
    throw new RevenueOsError('REVENUE_TWIN_STORAGE_FAILURE', 'La mutation du jumeau commercial a échoué. Vérifiez la migration Mega ZIP 2.', { status: 503, recoverable: true, cause: normalizeRevenueOsError(error) })
  }
}

export async function persistDigitalTwinValidation(actor: Actor) {
  const { bootstrap } = await readRevenueDigitalTwin()
  const issues = validateDigitalTwin(bootstrap)
  const completeness = calculateDigitalTwinCompleteness(bootstrap)
  try {
    const supabase = await createClient()
    for (const current of issues) {
      const { error } = await supabase.from('revenue_os_digital_twin_gaps').upsert({
        code: current.code,
        entity_type: current.entityType,
        entity_code: current.entityCode,
        severity: current.severity,
        category: current.category,
        title: current.title,
        detail: current.detail,
        recommended_action: current.recommendedAction,
        status: current.status,
        detected_at: current.detectedAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'code,entity_code' })
      if (error) throw error
    }
    const { error: versionError } = await supabase.from('revenue_os_digital_twin_versions').insert({
      model_version: `DT-${Date.now()}`,
      release_code: 'AC-REVENUE-OS-MZ02-DIGITAL-TWIN',
      completeness_score: completeness.overall,
      snapshot: { counters: bootstrap.counters, completeness },
      created_by: actor.id || null,
      created_by_label: actor.label,
      status: completeness.overall >= 90 && !issues.some((item) => item.severity === 'critical' && item.status === 'open') ? 'validated' : 'needs-validation',
    })
    if (versionError) throw versionError
    await writeRevenueOsAuditEvent({ action: 'digital_twin.validation.completed', actorId: actor.id, actorLabel: actor.label, actorType: 'user', resourceType: 'revenue_digital_twin', outcome: 'success', summary: `Validation Digital Twin terminée: ${completeness.overall}% de complétude, ${issues.length} points détectés.`, metadata: { completeness, issueCount: issues.length } }, supabase)
    return { completeness, issues }
  } catch (error) {
    throw new RevenueOsError('REVENUE_TWIN_VALIDATION_STORAGE_FAILURE', 'La validation a été calculée mais ne peut pas être persistée.', { status: 503, recoverable: true, cause: normalizeRevenueOsError(error) })
  }
}

export async function updateValidationIssueStatus(issueId: string, nextStatus: RevenueTwinValidationIssue['status'], actor: Actor) {
  if (!['open', 'acknowledged', 'resolved', 'waived'].includes(nextStatus)) throw new RevenueOsError('REVENUE_TWIN_INVALID_INPUT', 'Statut de validation non autorisé.', { status: 400 })
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_os_digital_twin_gaps').update({ status: nextStatus, updated_at: new Date().toISOString(), resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null }).eq('id', issueId).select('*').single()
    if (error) throw error
    await writeRevenueOsAuditEvent({ action: 'digital_twin.validation.status_changed', actorId: actor.id, actorLabel: actor.label, actorType: 'user', resourceType: 'digital_twin_gap', resourceId: issueId, outcome: 'success', summary: `Point de validation passé à ${nextStatus}.`, metadata: { nextStatus } }, supabase)
    return rowIssue(data)
  } catch (error) {
    throw new RevenueOsError('REVENUE_TWIN_STORAGE_FAILURE', 'Le statut du point de validation n’a pas pu être modifié.', { status: 503, recoverable: true, cause: normalizeRevenueOsError(error) })
  }
}
