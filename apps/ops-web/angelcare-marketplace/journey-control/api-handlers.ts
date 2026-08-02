import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import {
  acknowledgeCustomerNotification,
  completeCustomerAction,
  createCustomerChangeRequest,
  createCustomerRecoveryCase,
  getAdminJourney,
  getCustomerAccountSummary,
  getCustomerJourney,
  getJourneyAdminSummary,
  listAdminJourneys,
  listCustomerJourneys,
  transitionAdminJourney,
} from './repository'
import { journeyRisk, journeyStatus, journeyType, objectValue, requiredText } from './validation'

const locale = (value: unknown): 'fr' | 'en' | 'ar' => value === 'en' || value === 'ar' ? value : 'fr'

export async function handleCustomerAccount(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext()
    const url = new URL(request.url)
    return apiSuccess(await getCustomerAccountSummary(context, locale(url.searchParams.get('locale'))), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleCustomerJourneys(request: Request) {
  const id = requestId(request)
  try { return apiSuccess(await listCustomerJourneys(await requireMarketplaceApiContext()), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleCustomerJourney(request: Request, journeyId: string) {
  const id = requestId(request)
  try { return apiSuccess(await getCustomerJourney(journeyId, await requireMarketplaceApiContext()), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleCompleteCustomerAction(request: Request, journeyId: string, actionId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext()
    const body = await parseJsonObject(request)
    return apiSuccess(await completeCustomerAction({ journeyId, actionId, evidence: objectValue(body.evidence), context, requestId: id, request }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleCreateChangeRequest(request: Request, journeyId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext()
    const body = await parseJsonObject(request)
    return apiSuccess(await createCustomerChangeRequest({ journeyId, requestType: requiredText(body.requestType, 'requestType', 80), reason: requiredText(body.reason, 'reason', 2000), requestedChanges: objectValue(body.requestedChanges), context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleCreateRecovery(request: Request, journeyId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext()
    const body = await parseJsonObject(request)
    return apiSuccess(await createCustomerRecoveryCase({ journeyId, issueType: requiredText(body.issueType, 'issueType', 100), urgency: journeyRisk(body.urgency) || 'medium', summary: requiredText(body.summary, 'summary', 3000), evidence: objectValue(body.evidence), context, requestId: id, request }), { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleAcknowledgeNotification(request: Request, notificationId: string) {
  const id = requestId(request)
  try { await acknowledgeCustomerNotification(notificationId, await requireMarketplaceApiContext()); return apiSuccess({ acknowledged: true }, { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleAdminSummary(request: Request) {
  const id = requestId(request)
  try { return apiSuccess(await getJourneyAdminSummary(await requireMarketplaceApiContext('marketplace.journeys.view')), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleAdminJourneys(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.journeys.view')
    const url = new URL(request.url)
    return apiSuccess(await listAdminJourneys(context, { journeyType: journeyType(url.searchParams.get('journeyType')), status: journeyStatus(url.searchParams.get('status')), riskLevel: journeyRisk(url.searchParams.get('riskLevel')), query: url.searchParams.get('q') || undefined }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleAdminJourney(request: Request, journeyId: string) {
  const id = requestId(request)
  try {
    if (request.method === 'GET') return apiSuccess(await getAdminJourney(journeyId, await requireMarketplaceApiContext('marketplace.journeys.view')), { requestId: id })
    const context = await requireMarketplaceApiContext('marketplace.journeys.manage')
    const body = await parseJsonObject(request)
    const target = journeyStatus(body.status)
    if (!target) throw new Error('Statut de parcours invalide.')
    return apiSuccess(await transitionAdminJourney({ journeyId, status: target, reason: requiredText(body.reason, 'reason', 2000), context, requestId: id, request }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}
