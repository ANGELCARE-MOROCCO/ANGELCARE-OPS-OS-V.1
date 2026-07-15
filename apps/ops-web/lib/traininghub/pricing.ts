import { createTrainingHubUserClient } from './supabase'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import type {
  JsonRecord,
  TrainingHubContext,
  TrainingHubCourse,
  TrainingHubPricingPreview,
  TrainingHubPricingPreviewRequest,
} from './types'

const MONEY_FIELDS = [
  'travel_fee_minor',
  'travelFeeMinor',
  'kit_fee_minor',
  'kitFeeMinor',
  'rush_fee_minor',
  'rushFeeMinor',
  'custom_material_fee_minor',
  'customMaterialFeeMinor',
  'trainer_seniority_fee_minor',
  'trainerSeniorityFeeMinor',
  'commercial_discount_minor',
  'commercialDiscountMinor',
]

function asObject(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainingHubHttpError('Invalid TrainingHub pricing payload.', 400, 'TRAININGHUB_INVALID_PRICING_PAYLOAD')
  }
  return value as JsonRecord
}

function stringValue(value: unknown) {
  return String(value || '').trim()
}

function numberValue(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.floor(n)
}

function nonNegativeMoney(value: unknown, field: string) {
  const n = numberValue(value, 0)
  if (n < 0) {
    throw new TrainingHubHttpError(`${field} cannot be negative.`, 400, 'TRAININGHUB_NEGATIVE_MONEY_FIELD', { field })
  }
  return n
}

function readRequest(body: unknown): TrainingHubPricingPreviewRequest {
  const source = asObject(body)
  for (const key of MONEY_FIELDS) {
    if (source[key] !== undefined && numberValue(source[key], 0) < 0) {
      throw new TrainingHubHttpError(`${key} cannot be negative.`, 400, 'TRAININGHUB_NEGATIVE_MONEY_FIELD', { field: key })
    }
  }
  return source as TrainingHubPricingPreviewRequest
}

function requestCourseRef(body: TrainingHubPricingPreviewRequest) {
  const ref = stringValue(body.course_ref || body.courseRef)
  return ref ? ref.toUpperCase() : ''
}

function requestCourseId(body: TrainingHubPricingPreviewRequest) {
  return stringValue(body.course_id || body.courseId)
}

function requestOrganizationId(body: TrainingHubPricingPreviewRequest, context: TrainingHubContext) {
  const explicit = stringValue(body.organization_id || body.organizationId)
  if (explicit) return explicit
  const first = context.organizationIds[0]
  if (!first) throw new TrainingHubHttpError('No TrainingHub organization available for pricing.', 403, 'TRAININGHUB_NO_ORGANIZATION')
  return first
}

function requestSiteId(body: TrainingHubPricingPreviewRequest) {
  return stringValue(body.site_id || body.siteId) || null
}

function contextCanPriceOrganization(context: TrainingHubContext, organizationId: string) {
  if (context.isInternal || context.isSuperAdmin) return true
  return context.organizationIds.includes(organizationId)
}

function contextHasPartnerPricingAccess(context: TrainingHubContext) {
  if (context.isInternal || context.isSuperAdmin) return true
  return context.entitlements.some((entitlement) =>
    ['can_access_training_portal', 'can_use_partner_prices'].includes(String(entitlement.code || '')) &&
    ['active', 'pending'].includes(String(entitlement.status || ''))
  )
}

function requirePricingAccess(context: TrainingHubContext, organizationId: string) {
  if (!contextCanPriceOrganization(context, organizationId)) {
    throw new TrainingHubHttpError('Cannot preview pricing for another TrainingHub organization.', 403, 'TRAININGHUB_PRICING_ORG_FORBIDDEN')
  }

  if (context.isInternal || context.isSuperAdmin) {
    requireTrainingHubPermission(context, ['training.proposal.create', 'training.proposal.send', 'training.catalogue.view'])
    return
  }

  if (!contextHasPartnerPricingAccess(context)) {
    throw new TrainingHubHttpError('TrainingHub pricing preview requires partner pricing entitlement.', 403, 'TRAININGHUB_PRICING_ENTITLEMENT_REQUIRED')
  }
}

async function loadCourseForPricing(courseRef: string, courseId: string): Promise<TrainingHubCourse> {
  const supabase = await createTrainingHubUserClient()
  let query = supabase
    .from('trn_courses')
    .select('id, category_id, ref, title, short_description, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, has_refresh_module, publication_status, status, metadata')

  if (courseId) query = query.eq('id', courseId)
  else if (courseRef) query = query.eq('ref', courseRef)
  else throw new TrainingHubHttpError('course_ref or course_id is required.', 400, 'TRAININGHUB_PRICING_COURSE_REQUIRED')

  const { data, error } = await query.maybeSingle()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PRICING_COURSE_LOAD_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub course not found for pricing.', 404, 'TRAININGHUB_PRICING_COURSE_NOT_FOUND')
  return data as TrainingHubCourse
}

async function loadActivePricingRules() {
  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('trn_pricing_rules')
    .select('id, code, name, rule_type, scope, priority, condition_json, calculation_json, status, valid_from, valid_until, metadata')
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .order('code', { ascending: true })

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PRICING_RULES_LOAD_FAILED')
  return data || []
}

function resolvePreview(body: TrainingHubPricingPreviewRequest, context: TrainingHubContext, course: TrainingHubCourse, organizationId: string, siteId: string | null, rules: unknown[]): TrainingHubPricingPreview {
  const warnings: string[] = []
  const customQuoteReasons: string[] = []
  const participantCount = Math.max(1, numberValue(body.participant_count ?? body.participantCount, Number(course.starter_min_participants || 3)))
  const starterMin = Math.max(1, Number(course.starter_min_participants || 3))
  const starterMax = Math.max(starterMin, Number(course.starter_max_participants || 8))
  const minHours = Math.max(1, Number(course.min_hours || 6))
  const maxHours = Math.max(minHours, Number(course.max_hours || 15))
  const requestedHoursRaw = numberValue(body.requested_hours ?? body.requestedHours, minHours)
  const requestedHours = requestedHoursRaw <= 0 ? minHours : requestedHoursRaw
  const billableParticipantCount = Math.max(participantCount, starterMin)
  const city = stringValue(body.city) || null
  const currencyCode = String(course.currency_code || 'MAD')
  const basePriceMinor = Math.max(0, Number(course.onsite_entry_price_minor || 0))

  let requiresCustomQuote = false
  let extraParticipantsPriceMinor = 0
  let extraHoursPriceMinor = 0

  if (participantCount < starterMin) {
    warnings.push(`Starter price is a minimum commercial unit for ${starterMin} participants.`)
  }

  if (participantCount > starterMax) {
    requiresCustomQuote = true
    customQuoteReasons.push(`Participant count ${participantCount} exceeds starter maximum ${starterMax}.`)
  }

  if (requestedHours < minHours) {
    warnings.push(`Requested hours are below the normal ${minHours}h minimum; meeting validation is required.`)
  }

  if (requestedHours > maxHours) {
    requiresCustomQuote = true
    customQuoteReasons.push(`Requested hours ${requestedHours} exceed standard maximum ${maxHours}h.`)
  }

  const travelFeeMinor = nonNegativeMoney(body.travel_fee_minor ?? body.travelFeeMinor, 'travel_fee_minor')
  const kitFeeMinor = nonNegativeMoney(body.kit_fee_minor ?? body.kitFeeMinor, 'kit_fee_minor')
  const rushFeeMinor = nonNegativeMoney(body.rush_fee_minor ?? body.rushFeeMinor, 'rush_fee_minor')
  const customMaterialFeeMinor = nonNegativeMoney(body.custom_material_fee_minor ?? body.customMaterialFeeMinor, 'custom_material_fee_minor')
  const trainerSeniorityFeeMinor = nonNegativeMoney(body.trainer_seniority_fee_minor ?? body.trainerSeniorityFeeMinor, 'trainer_seniority_fee_minor')
  const commercialDiscountMinor = nonNegativeMoney(body.commercial_discount_minor ?? body.commercialDiscountMinor, 'commercial_discount_minor')
  const discountReason = stringValue(body.discount_reason || body.discountReason)

  if (commercialDiscountMinor > 0 && !context.isInternal) {
    throw new TrainingHubHttpError('Commercial discount preview is internal only.', 403, 'TRAININGHUB_DISCOUNT_INTERNAL_ONLY')
  }

  if (commercialDiscountMinor > 0 && !discountReason) {
    warnings.push('Discount entered without reason; approval workflow will be required before proposal send.')
  }

  const positiveTotal =
    basePriceMinor +
    extraParticipantsPriceMinor +
    extraHoursPriceMinor +
    travelFeeMinor +
    kitFeeMinor +
    rushFeeMinor +
    customMaterialFeeMinor +
    trainerSeniorityFeeMinor
  const discountMinor = Math.min(commercialDiscountMinor, positiveTotal)
  const finalPriceMinor = Math.max(0, positiveTotal - discountMinor)

  const lines = [
    { key: 'base_price', label: 'Onsite starter price', amount_minor: basePriceMinor, direction: 'add' as const },
    { key: 'extra_participants', label: 'Extra participants', amount_minor: extraParticipantsPriceMinor, direction: 'add' as const },
    { key: 'extra_hours', label: 'Extra hours', amount_minor: extraHoursPriceMinor, direction: 'add' as const },
    { key: 'travel_fee', label: 'Travel / city fee', amount_minor: travelFeeMinor, direction: 'add' as const },
    { key: 'kit_fee', label: 'Extra printed kit fee', amount_minor: kitFeeMinor, direction: 'add' as const },
    { key: 'rush_fee', label: 'Rush scheduling fee', amount_minor: rushFeeMinor, direction: 'add' as const },
    { key: 'custom_material', label: 'Custom material fee', amount_minor: customMaterialFeeMinor, direction: 'add' as const },
    { key: 'trainer_seniority', label: 'Trainer seniority fee', amount_minor: trainerSeniorityFeeMinor, direction: 'add' as const },
    { key: 'discount', label: 'Commercial discount preview', amount_minor: discountMinor, direction: 'subtract' as const, metadata: { reason: discountReason || null } },
  ].filter((line) => line.amount_minor > 0 || ['base_price'].includes(line.key))

  const calculationDetails: JsonRecord = {
    doctrine: 'TrainingHub starter pricing applies to 3-8 participants; 6-15h distribution is validated during meeting; over-limit cases require custom quote or future approved pricing rule.',
    rules_loaded: Array.isArray(rules) ? rules.length : 0,
    starter: { min_participants: starterMin, max_participants: starterMax },
    hours: { min_hours: minHours, max_hours: maxHours, requested_hours: requestedHours },
    request_notes: body.notes || null,
    custom_quote_reasons: customQuoteReasons,
    warnings,
  }

  return {
    course_id: course.id,
    course_ref: course.ref,
    course_title: course.title,
    organization_id: organizationId,
    site_id: siteId,
    participant_count: participantCount,
    starter_min_participants: starterMin,
    starter_max_participants: starterMax,
    billable_participant_count: billableParticipantCount,
    requested_hours: requestedHours,
    min_hours: minHours,
    max_hours: maxHours,
    city,
    currency_code: currencyCode,
    base_price_minor: basePriceMinor,
    extra_participants_price_minor: extraParticipantsPriceMinor,
    extra_hours_price_minor: extraHoursPriceMinor,
    travel_fee_minor: travelFeeMinor,
    kit_fee_minor: kitFeeMinor,
    rush_fee_minor: rushFeeMinor,
    custom_material_fee_minor: customMaterialFeeMinor,
    trainer_seniority_fee_minor: trainerSeniorityFeeMinor,
    discount_minor: discountMinor,
    final_price_minor: finalPriceMinor,
    requires_custom_quote: requiresCustomQuote,
    custom_quote_reasons: customQuoteReasons,
    warnings,
    lines,
    calculation_details: calculationDetails,
    persisted: false,
  }
}

export async function previewTrainingHubPricing(context: TrainingHubContext, body: unknown, options: { persist?: boolean } = {}) {
  const request = readRequest(body)
  const courseRef = requestCourseRef(request)
  const courseId = requestCourseId(request)
  const organizationId = requestOrganizationId(request, context)
  const siteId = requestSiteId(request)

  requirePricingAccess(context, organizationId)

  const [course, rules] = await Promise.all([
    loadCourseForPricing(courseRef, courseId),
    loadActivePricingRules(),
  ])

  if (!context.isInternal && (course.status !== 'active' || course.publication_status !== 'published')) {
    throw new TrainingHubHttpError('TrainingHub course is not available for partner pricing.', 404, 'TRAININGHUB_PRICING_COURSE_NOT_AVAILABLE')
  }

  const preview = resolvePreview(request, context, course, organizationId, siteId, rules)

  if (!options.persist) return preview

  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase
    .from('trn_pricing_previews')
    .insert({
      organization_id: preview.organization_id,
      site_id: preview.site_id,
      course_id: preview.course_id,
      participant_count: preview.participant_count,
      requested_hours: preview.requested_hours,
      city: preview.city,
      base_price_minor: preview.base_price_minor,
      extra_participants_price_minor: preview.extra_participants_price_minor,
      extra_hours_price_minor: preview.extra_hours_price_minor,
      travel_fee_minor: preview.travel_fee_minor,
      kit_fee_minor: preview.kit_fee_minor,
      rush_fee_minor: preview.rush_fee_minor,
      discount_minor: preview.discount_minor,
      final_price_minor: preview.final_price_minor,
      requires_custom_quote: preview.requires_custom_quote,
      calculation_details: preview.calculation_details,
      created_by: context.profile.id,
    })
    .select('id')
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PRICING_PREVIEW_SAVE_FAILED')

  return {
    ...preview,
    id: data?.id || null,
    persisted: true,
  }
}

export async function listTrainingHubPricingRules(context: TrainingHubContext) {
  if (context.isInternal) requireTrainingHubPermission(context, ['training.proposal.create', 'training.catalogue.view'])
  const rules = await loadActivePricingRules()
  return rules
}
