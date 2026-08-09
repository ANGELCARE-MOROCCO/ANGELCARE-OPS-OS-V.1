import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import {
  categoryNativeFilters,
  categoryNativeJourneyContinuity,
  commitCategoryNativeSession,
  compareCategoryNativeItems,
  createCategoryNativeSession,
  getAdaptiveExperience,
  getCategoryNativeSession,
  revalidateCategoryNativeSession,
  updateCategoryNativeConfiguration,
} from './repository'
import { categoryNativeLocale } from './validation'

function required(value: unknown, label: string): string {
  const result = String(value || '').trim()
  if (!result) throw new MarketplaceError('VALIDATION_ERROR', `${label} est requis.`)
  return result
}

export async function handlePublicCategoryNativeExperience(request: Request, params: Promise<{ itemKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { itemKey } = await params
    const url = new URL(request.url)
    const locale = categoryNativeLocale(url.searchParams.get('locale'))
    const experience = await getAdaptiveExperience({ locale, itemKey, territoryCode: url.searchParams.get('territory') })
    if (!experience) throw new MarketplaceError('NOT_FOUND', 'Expérience category-native introuvable.')
    return apiSuccess(experience, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handlePublicCategoryNativeConfiguration(request: Request, params: Promise<{ itemKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { itemKey } = await params
    const url = new URL(request.url)
    const locale = categoryNativeLocale(url.searchParams.get('locale'))
    const experience = await getAdaptiveExperience({ locale, itemKey, territoryCode: url.searchParams.get('territory') })
    if (!experience) throw new MarketplaceError('NOT_FOUND', 'Expérience introuvable.')
    return apiSuccess({
      schemaKey: experience.schema.schema_key,
      schemaVersion: experience.schema.version,
      conversionTemplate: experience.schema.conversion_template,
      operationsHandoverType: experience.schema.operations_handover_type,
      fields: experience.schema.fields.filter((field) => field.admin_visible),
      variantGroups: experience.variantGroups,
      variants: experience.variants,
    }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handlePublicCategoryNativePricing(request: Request, params: Promise<{ itemKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { itemKey } = await params
    const url = new URL(request.url)
    const experience = await getAdaptiveExperience({ locale: categoryNativeLocale(url.searchParams.get('locale')), itemKey, territoryCode: url.searchParams.get('territory') })
    if (!experience) throw new MarketplaceError('NOT_FOUND', 'Expérience introuvable.')
    return apiSuccess({ price: experience.price, schemaKey: experience.schema.schema_key, revalidationRequired: true }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handlePublicCategoryNativeAvailability(request: Request, params: Promise<{ itemKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { itemKey } = await params
    const url = new URL(request.url)
    const experience = await getAdaptiveExperience({ locale: categoryNativeLocale(url.searchParams.get('locale')), itemKey, territoryCode: url.searchParams.get('territory') })
    if (!experience) throw new MarketplaceError('NOT_FOUND', 'Expérience introuvable.')
    return apiSuccess({ availability: experience.availability, authority: experience.schema.availability_authority, revalidationRequired: true }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handlePublicCategoryNativeRecommendations(request: Request, params: Promise<{ itemKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { itemKey } = await params
    const url = new URL(request.url)
    const experience = await getAdaptiveExperience({ locale: categoryNativeLocale(url.searchParams.get('locale')), itemKey, territoryCode: url.searchParams.get('territory') })
    if (!experience) throw new MarketplaceError('NOT_FOUND', 'Expérience introuvable.')
    return apiSuccess({ items: experience.recommendations, schemaKey: experience.schema.schema_key }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeFilters(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const url = new URL(request.url)
    const schemaKeys = url.searchParams.getAll('schema')
    const filters = await categoryNativeFilters({ locale: categoryNativeLocale(url.searchParams.get('locale')), schemaKeys, categoryKey: url.searchParams.get('category') })
    return apiSuccess({ filters }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeCompare(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const url = new URL(request.url)
    const slugs = url.searchParams.getAll('item').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
    if (slugs.length < 2) throw new MarketplaceError('VALIDATION_ERROR', 'Deux offres au minimum sont requises pour comparer.')
    return apiSuccess(await compareCategoryNativeItems({ locale: categoryNativeLocale(url.searchParams.get('locale')), slugs }), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeSessionCreate(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const session = await createCategoryNativeSession({
      itemSlug: required(body.itemSlug, 'itemSlug'), locale: categoryNativeLocale(body.locale),
      visitorReference: required(body.visitorReference, 'visitorReference'), idempotencyKey: required(body.idempotencyKey, 'idempotencyKey'),
      sourceRoute: body.sourceRoute ? String(body.sourceRoute) : undefined,
      territoryCode: body.territoryCode ? String(body.territoryCode) : null,
      initialConfiguration: body.initialConfiguration && typeof body.initialConfiguration === 'object' && !Array.isArray(body.initialConfiguration) ? body.initialConfiguration as Record<string, unknown> : {},
    })
    return apiSuccess(session, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeSession(request: Request, params: Promise<{ sessionKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { sessionKey } = await params
    const url = new URL(request.url)
    const visitorReference = required(url.searchParams.get('visitorReference'), 'visitorReference')
    const session = await getCategoryNativeSession(sessionKey, visitorReference)
    if (!session) throw new MarketplaceError('NOT_FOUND', 'Session category-native introuvable.')
    return apiSuccess(session, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeConfigurationUpdate(request: Request, params: Promise<{ sessionKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { sessionKey } = await params
    if (request.method !== 'PATCH') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const configuration = body.configuration && typeof body.configuration === 'object' && !Array.isArray(body.configuration) ? body.configuration as Record<string, unknown> : {}
    const identity = body.identity && typeof body.identity === 'object' && !Array.isArray(body.identity) ? body.identity as Record<string, unknown> : {}
    return apiSuccess(await updateCategoryNativeConfiguration({ sessionKey, visitorReference: required(body.visitorReference, 'visitorReference'), configuration, identity }), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeRevalidate(request: Request, params: Promise<{ sessionKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { sessionKey } = await params
    const body = await parseJsonObject(request)
    return apiSuccess(await revalidateCategoryNativeSession({ sessionKey, visitorReference: required(body.visitorReference, 'visitorReference'), quantity: body.quantity === undefined ? undefined : Number(body.quantity) }), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeCommit(request: Request, params: Promise<{ sessionKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { sessionKey } = await params
    const body = await parseJsonObject(request)
    const consentBody = body.consents && typeof body.consents === 'object' && !Array.isArray(body.consents) ? body.consents as Record<string, unknown> : {}
    return apiSuccess(await commitCategoryNativeSession({ sessionKey, visitorReference: required(body.visitorReference, 'visitorReference'), idempotencyKey: required(body.idempotencyKey, 'idempotencyKey'), consents: { terms: consentBody.terms === true, privacy: consentBody.privacy === true, nonMedical: consentBody.nonMedical === true } }), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeJourney(request: Request, params: Promise<{ journeyId: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.journeys.view')
    const { journeyId } = await params
    const url = new URL(request.url)
    const continuity = await categoryNativeJourneyContinuity({ journeyId, locale: categoryNativeLocale(url.searchParams.get('locale')) })
    if (!continuity) throw new MarketplaceError('NOT_FOUND', 'Continuité category-native introuvable.')
    return apiSuccess(continuity, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}
