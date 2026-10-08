import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import {
  addPublicBasketItem,
  confirmPublicConversion,
  conversionAdminSummary,
  createConversionSessionFromBasket,
  createPublicConversionSession,
  getOrCreatePublicBasket,
  getPublicConversionSession,
  listConversionSessions,
  recordConversionConsent,
  recoverConversionSession,
  removePublicBasketItem,
  revalidateConversionAvailability,
  revalidateConversionPrice,
  updatePublicConversionSession,
} from './repository'
import { createInput, journey, locale, object, positiveNumber, requiredText, status } from './validation'

function visitor(request: Request, body?: Record<string, unknown>) {
  return String(body?.visitorReference || request.headers.get('x-marketplace-visitor') || '').trim()
}

export async function handleConversionSessions(request: Request) {
  const id = requestId(request)
  try {
    if (request.method === 'POST') {
      const body = await parseJsonObject(request)
      return apiSuccess(await createPublicConversionSession(createInput(body)), { requestId: id, status: 201 })
    }
    const url = new URL(request.url)
    const sessionKey = requiredText(url.searchParams.get('sessionKey'), 'sessionKey', 180)
    const visitorReference = requiredText(request.headers.get('x-marketplace-visitor'), 'visitorReference', 180)
    return apiSuccess(await getPublicConversionSession(sessionKey, visitorReference), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionSession(request: Request, sessionKey: string) {
  const id = requestId(request)
  try {
    const body = request.method === 'GET' ? {} : await parseJsonObject(request)
    const visitorReference = requiredText(visitor(request, body), 'visitorReference', 180)
    if (request.method === 'GET') {
      return apiSuccess(await getPublicConversionSession(sessionKey, visitorReference), { requestId: id })
    }
    return apiSuccess(await updatePublicConversionSession({
      sessionKey,
      visitorReference,
      identity: body.identity ? object(body.identity) : undefined,
      configuration: body.configuration ? object(body.configuration) : undefined,
      status: body.status ? status(body.status) : undefined,
      territoryCode: body.territoryCode === undefined ? undefined : String(body.territoryCode || '') || null,
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handlePriceRevalidation(request: Request, sessionKey: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    return apiSuccess(await revalidateConversionPrice({
      sessionKey,
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      quantity: positiveNumber(body.quantity, 1),
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleAvailabilityRevalidation(request: Request, sessionKey: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    return apiSuccess(await revalidateConversionAvailability({
      sessionKey,
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      quantity: positiveNumber(body.quantity, 1),
      configuration: object(body.configuration),
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionConsent(request: Request, sessionKey: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    return apiSuccess(await recordConversionConsent({
      sessionKey,
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      consentKey: requiredText(body.consentKey, 'consentKey', 120),
      consentVersion: requiredText(body.consentVersion || '2026.1', 'consentVersion', 80),
      locale: locale(body.locale),
      accepted: body.accepted === true,
      evidence: object(body.evidence),
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionConfirmation(request: Request, sessionKey: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    return apiSuccess(await confirmPublicConversion({
      sessionKey,
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      idempotencyKey: requiredText(body.idempotencyKey, 'idempotencyKey', 220),
      paymentIntentId: body.paymentIntentId ? String(body.paymentIntentId) : null,
    }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handlePublicBasket(request: Request) {
  const id = requestId(request)
  try {
    const body = request.method === 'GET' ? {} : await parseJsonObject(request)
    const url = new URL(request.url)
    return apiSuccess(await getOrCreatePublicBasket({
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      locale: locale(body.locale || url.searchParams.get('locale')),
      territoryCode: String(body.territoryCode || url.searchParams.get('territoryCode') || '') || null,
      kind: String(body.kind || url.searchParams.get('kind') || 'transactional') === 'quotation' ? 'quotation' : 'transactional',
    }), { requestId: id, status: request.method === 'POST' ? 201 : 200 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handlePublicBasketItems(request: Request, basketId: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    const visitorReference = requiredText(visitor(request, body), 'visitorReference', 180)
    if (request.method === 'DELETE') {
      return apiSuccess(await removePublicBasketItem({
        visitorReference,
        basketId,
        itemId: requiredText(body.itemId, 'itemId', 80),
      }), { requestId: id })
    }
    return apiSuccess(await addPublicBasketItem({
      visitorReference,
      basketId,
      itemSlug: requiredText(body.itemSlug, 'itemSlug', 180),
      locale: locale(body.locale),
      quantity: positiveNumber(body.quantity, 1),
      configuration: object(body.configuration),
    }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionAdminSummary(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.conversion.view')
    return apiSuccess(await conversionAdminSummary(context), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionAdminSessions(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.conversion.view')
    const url = new URL(request.url)
    return apiSuccess(await listConversionSessions(context, {
      journey: journey(url.searchParams.get('journey')),
      status: url.searchParams.get('status') ? status(url.searchParams.get('status')) : undefined,
      limit: positiveNumber(url.searchParams.get('limit'), 200),
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleConversionRecovery(request: Request, sessionId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.conversion.recover')
    const body = await parseJsonObject(request)
    return apiSuccess(await recoverConversionSession({
      sessionId,
      target: status(body.target),
      reason: requiredText(body.reason, 'reason', 1500),
      context,
      requestId: id,
      request,
    }), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleBasketCheckout(request: Request, basketId: string) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    return apiSuccess(await createConversionSessionFromBasket({
      visitorReference: requiredText(visitor(request, body), 'visitorReference', 180),
      basketId,
      locale: locale(body.locale),
      idempotencyKey: requiredText(body.idempotencyKey, 'idempotencyKey', 220),
    }), { requestId: id, status: 201 })
  } catch (error) {
    return apiFailure(error, id)
  }
}
