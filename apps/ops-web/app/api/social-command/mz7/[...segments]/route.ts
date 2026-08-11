import { requireSocialCommandActor, socialError, socialOk } from "@/lib/social-command/auth"
import { assertMZ7Permission, mz7AuthorizationSnapshot } from "@/lib/social-command/mz7-authz"
import { auditSocial } from "@/lib/social-command/repository"
import { archiveResolvedEngagementMZ7, engagementMZ7Bootstrap, getCommentDossierMZ7, getConversationDossierMZ7, replyCommentMZ7, sendConversationReplyMZ7, setCommentJourneyStateMZ7, setConversationJourneyStateMZ7, setMentionJourneyStateMZ7 } from "@/lib/social-command/engagement-mz7"
import { getRelationshipDossierMZ7, complianceAnonymizeRelationshipMZ7 } from "@/lib/social-command/relationship-mz7"
import { historySyncBootstrapMZ7, runMetaHistorySyncMZ7 } from "@/lib/social-command/history-sync-mz7"
import { inspectFacebookOperationsMZ7, inspectFacebookSubscriptionsMZ7, moderateFacebookCommentMZ7, reconcileFacebookSubscriptionsMZ7, sendFacebookSenderActionMZ7 } from "@/lib/social-command/facebook-mz7"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
type RouteContext = { params: Promise<{ segments: string[] }> }
function routeKey(parts: string[]) { return parts.join("/") }

export async function GET(_request: Request, context: RouteContext) {
  const { segments = [] } = await context.params, route = routeKey(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    if (route === "bootstrap") return socialOk(await engagementMZ7Bootstrap())
    if (route === "facebook/control") return socialOk({ ...(await inspectFacebookOperationsMZ7()), authorization: mz7AuthorizationSnapshot(auth.actor) })
    if (route === "facebook/subscriptions") { assertMZ7Permission(auth.actor, "facebook.control"); return socialOk(await inspectFacebookSubscriptionsMZ7()) }
    if (route === "history") { assertMZ7Permission(auth.actor, "history.sync"); return socialOk(await historySyncBootstrapMZ7()) }
    const conversation = /^conversations\/([^/]+)$/.exec(route); if (conversation) return socialOk(await getConversationDossierMZ7(conversation[1]))
    const comment = /^comments\/([^/]+)$/.exec(route); if (comment) return socialOk(await getCommentDossierMZ7(comment[1]))
    const relationship = /^relationships\/([^/]+)$/.exec(route); if (relationship) return socialOk(await getRelationshipDossierMZ7(relationship[1]))
    return socialError("SOCIAL_COMMAND_MZ7_ROUTE_NOT_FOUND", 404, { path: route })
  } catch (error) { return socialError(error, 500, { path: route }) }
}

export async function POST(request: Request, context: RouteContext) {
  const { segments = [] } = await context.params, route = routeKey(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    if (route === "facebook/subscriptions/reconcile") {
      assertMZ7Permission(auth.actor, "facebook.control")
      const result = await reconcileFacebookSubscriptionsMZ7(body.fields)
      await auditSocial(auth.actor.id, "facebook.subscriptions.reconciled.mz7", "facebook_page", result.inspected.pageId, { fields: result.inspected.subscribedFields, missing: result.inspected.missingFields })
      return socialOk(result)
    }
    if (route === "history/sync") {
      assertMZ7Permission(auth.actor, "history.sync")
      const provider = body.provider === "facebook" ? "facebook" : body.provider === "instagram" ? "instagram" : null
      const kind = body.kind === "comments" ? "comments" : body.kind === "conversations" ? "conversations" : null
      const mode = body.mode === "import" ? "import" : body.mode === "discover" ? "discover" : null
      if (!provider || !kind || !mode) return socialError("provider, kind and mode are required", 400)
      const result = await runMetaHistorySyncMZ7({ provider, kind, mode, actorUserId: auth.actor.id, maxPages: Number(body.maxPages || 5), maxRecords: Number(body.maxRecords || 500) })
      await auditSocial(auth.actor.id, `history.${provider}.${kind}.${mode}.mz7`, "history_sync", result.runId, { discovered: result.discovered, imported: result.imported, skipped: result.skipped, failed: result.failed, providerLimited: result.providerLimited })
      return socialOk(result)
    }
    const conversationReply = /^conversations\/([^/]+)\/reply$/.exec(route)
    if (conversationReply) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await sendConversationReplyMZ7(conversationReply[1], body.text, auth.actor.id)
      await auditSocial(auth.actor.id, "conversation.reply.mz7", "conversation", conversationReply[1], { providerDispatch: true })
      return socialOk(result)
    }
    const conversationState = /^conversations\/([^/]+)\/state$/.exec(route)
    if (conversationState) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await setConversationJourneyStateMZ7(conversationState[1], body, auth.actor.id)
      await auditSocial(auth.actor.id, "conversation.state.mz7", "conversation", conversationState[1], { action: body.action || body.status || null })
      return socialOk(result)
    }
    const conversationProfile = /^conversations\/([^/]+)\/profile-refresh$/.exec(route)
    if (conversationProfile) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await getConversationDossierMZ7(conversationProfile[1], true)
      await auditSocial(auth.actor.id, "conversation.profile.refresh.mz7", "conversation", conversationProfile[1], { channel: result.conversation.channel })
      return socialOk(result)
    }
    const senderAction = /^conversations\/([^/]+)\/facebook-action$/.exec(route)
    if (senderAction) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const action = body.action === "typing_on" || body.action === "typing_off" ? body.action : "mark_seen"
      const result = await sendFacebookSenderActionMZ7(senderAction[1], action)
      await auditSocial(auth.actor.id, "facebook.messenger.sender_action.mz7", "conversation", senderAction[1], { action })
      return socialOk(result)
    }
    const commentReply = /^comments\/([^/]+)\/reply$/.exec(route)
    if (commentReply) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await replyCommentMZ7(commentReply[1], body.text, auth.actor.id)
      await auditSocial(auth.actor.id, "comment.reply.mz7", "comment", commentReply[1], {})
      return socialOk(result)
    }
    const commentState = /^comments\/([^/]+)\/state$/.exec(route)
    if (commentState) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const payload = body.assignSelf === true ? { ...body, assignedUserId: auth.actor.id } : body
      const result = await setCommentJourneyStateMZ7(commentState[1], payload, auth.actor.id)
      await auditSocial(auth.actor.id, "comment.state.mz7", "comment", commentState[1], { action: payload.action || payload.status || null })
      return socialOk(result)
    }
    const mentionState = /^mentions\/([^/]+)\/state$/.exec(route)
    if (mentionState) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await setMentionJourneyStateMZ7(mentionState[1], body, auth.actor.id)
      await auditSocial(auth.actor.id, "mention.state.mz7", "mention", mentionState[1], { action: body.action || body.status || null })
      return socialOk(result)
    }
    if (route === "engagement/archive-resolved") {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const result = await archiveResolvedEngagementMZ7(auth.actor.id)
      await auditSocial(auth.actor.id, "engagement.bulk_archive_resolved.mz7", "engagement", "resolved", result)
      return socialOk(result)
    }
    const moderation = /^comments\/([^/]+)\/facebook-moderation$/.exec(route)
    if (moderation) {
      assertMZ7Permission(auth.actor, "engagement.operate")
      const action = body.action === "unhide" ? "unhide" : "hide"
      const result = await moderateFacebookCommentMZ7(moderation[1], action)
      await auditSocial(auth.actor.id, "facebook.comment.moderation.mz7", "comment", moderation[1], { action })
      return socialOk(result)
    }
    const compliance = /^relationships\/([^/]+)\/compliance-anonymize$/.exec(route)
    if (compliance) {
      assertMZ7Permission(auth.actor, "relationship.compliance")
      const result = await complianceAnonymizeRelationshipMZ7(compliance[1], body.reason, auth.actor)
      await auditSocial(auth.actor.id, "relationship.compliance_anonymized.mz7", "relationship_contact", compliance[1], { reasonProvided: Boolean(body.reason) })
      return socialOk(result)
    }
    return socialError("SOCIAL_COMMAND_MZ7_ROUTE_NOT_FOUND", 404, { path: route })
  } catch (error) { return socialError(error, 500, { path: route }) }
}
