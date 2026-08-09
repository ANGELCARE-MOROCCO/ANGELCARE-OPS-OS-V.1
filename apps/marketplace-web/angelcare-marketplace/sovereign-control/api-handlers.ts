import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId, requireText } from '../server/request'
import { MarketplaceError } from '../server/errors'
import { addObjectComment, createApproval, decideApproval, getCommandSummary, getObjectDossier, globalSearch, listActions, listApprovals, listExecutiveBriefs, updateAction } from './repository'

export async function handleCommandSummary(request: Request) {
  const id = requestId(request)
  try { await requireMarketplaceApiContext('marketplace.backoffice.command.view'); return apiSuccess(await getCommandSummary(), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleGlobalSearch(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.backoffice.search')
    const url = new URL(request.url)
    const q = cleanText(url.searchParams.get('q'), 200)
    if (q.length < 2) throw new MarketplaceError('VALIDATION_ERROR', 'Saisissez au moins deux caractères.')
    return apiSuccess(await globalSearch({ q, objectType: cleanOptionalText(url.searchParams.get('type'), 80) || undefined, territoryId: context.territoryId, limit: Number(url.searchParams.get('limit') || 30) }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleApprovals(request: Request) {
  const id = requestId(request)
  try {
    if (request.method === 'GET') {
      await requireMarketplaceApiContext('marketplace.backoffice.approvals.view')
      return apiSuccess(await listApprovals(new URL(request.url).searchParams.get('status') || undefined), { requestId: id })
    }
    const context = await requireMarketplaceApiContext('marketplace.backoffice.approvals.create')
    const body = await parseJsonObject(request)
    return apiSuccess(await createApproval({ objectType: requireText(body.objectType, 'objectType', 'Type d’objet', 100), objectId: requireText(body.objectId, 'objectId', 'Identifiant objet', 100), title: requireText(body.title, 'title', 'Titre', 200), summary: cleanOptionalText(body.summary, 2000), priority: cleanText(body.priority || 'normal', 20), ownerId: cleanOptionalText(body.ownerId, 100), dueAt: cleanOptionalText(body.dueAt, 50), territoryId: context.territoryId, context, requestId: id }), { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleApprovalDecision(request: Request, approvalId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.backoffice.approvals.decide')
    const body = await parseJsonObject(request)
    const decision = cleanText(body.decision, 20)
    if (decision !== 'approved' && decision !== 'rejected') throw new MarketplaceError('VALIDATION_ERROR', 'Décision invalide.')
    return apiSuccess(await decideApproval({ approvalId, decision, reason: requireText(body.reason, 'reason', 'Motif', 2000), context, requestId: id }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleActions(request: Request) {
  const id = requestId(request)
  try { await requireMarketplaceApiContext('marketplace.backoffice.actions.view'); return apiSuccess(await listActions(new URL(request.url).searchParams.get('status') || undefined), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleActionUpdate(request: Request, actionId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.backoffice.actions.manage')
    const body = await parseJsonObject(request)
    return apiSuccess(await updateAction({ id: actionId, status: cleanOptionalText(body.status, 30) || undefined, assigneeId: body.assigneeId === null ? null : cleanOptionalText(body.assigneeId, 100), blocker: body.blocker === null ? null : cleanOptionalText(body.blocker, 1000), nextAction: body.nextAction === null ? null : cleanOptionalText(body.nextAction, 1000), context, requestId: id }), { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleObjectDossier(request: Request, objectType: string, objectId: string) {
  const id = requestId(request)
  try { await requireMarketplaceApiContext('marketplace.backoffice.objects.view'); return apiSuccess(await getObjectDossier(objectType, objectId), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}

export async function handleObjectComment(request: Request, objectType: string, objectId: string) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.backoffice.objects.comment')
    const body = await parseJsonObject(request)
    return apiSuccess(await addObjectComment({ objectType, objectId, body: requireText(body.body, 'body', 'Commentaire', 4000), visibility: body.visibility === 'restricted' ? 'restricted' : 'internal', context, requestId: id }), { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error, id) }
}

export async function handleExecutiveBriefs(request: Request) {
  const id = requestId(request)
  try { await requireMarketplaceApiContext('marketplace.backoffice.briefs.view'); return apiSuccess(await listExecutiveBriefs(), { requestId: id }) }
  catch (error) { return apiFailure(error, id) }
}
