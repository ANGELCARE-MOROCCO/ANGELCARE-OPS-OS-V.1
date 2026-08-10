import { requireSocialCommandActor, socialError, socialOk } from "@/lib/social-command/auth"
import { auditSocial } from "@/lib/social-command/repository"
import { replyToComment, updateCommentState } from "@/lib/social-command/engagement"
import { getCommentDossierMZ6, getConversationDossierMZ6, sendInstagramDirectTextMZ6, updateConversationOperationalStateMZ6 } from "@/lib/social-command/instagram-engagement-mz6"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = { params: Promise<{ segments: string[] }> }
function key(parts: string[]) { return parts.join("/") }

export async function GET(_request: Request, context: RouteContext) {
  const { segments = [] } = await context.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    const conversation = /^conversations\/([^/]+)$/.exec(route)
    if (conversation) return socialOk(await getConversationDossierMZ6(conversation[1]))
    const comment = /^comments\/([^/]+)$/.exec(route)
    if (comment) return socialOk(await getCommentDossierMZ6(comment[1]))
    return socialError("SOCIAL_COMMAND_MZ6_ROUTE_NOT_FOUND", 404, { path: route })
  } catch (error) { return socialError(error, 500, { path: route }) }
}

export async function POST(request: Request, context: RouteContext) {
  const { segments = [] } = await context.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    const body = await request.json().catch(() => ({})) as Record<string, unknown>

    const reply = /^conversations\/([^/]+)\/reply$/.exec(route)
    if (reply) {
      const result = await sendInstagramDirectTextMZ6(reply[1], body.text, auth.actor.id)
      await auditSocial(auth.actor.id, "conversation.reply.instagram_login", "conversation", reply[1], { adapter: "instagram_login_mz6" })
      return socialOk(result)
    }
    const state = /^conversations\/([^/]+)\/state$/.exec(route)
    if (state) {
      const result = await updateConversationOperationalStateMZ6(state[1], body, auth.actor.id)
      await auditSocial(auth.actor.id, "conversation.updated.mz6", "conversation", state[1], body)
      return socialOk(result)
    }
    const profile = /^conversations\/([^/]+)\/profile-refresh$/.exec(route)
    if (profile) {
      const result = await getConversationDossierMZ6(profile[1], true)
      await auditSocial(auth.actor.id, "conversation.profile.refresh", "conversation", profile[1], { provider: "instagram" })
      return socialOk(result)
    }
    const commentReply = /^comments\/([^/]+)\/reply$/.exec(route)
    if (commentReply) {
      const result = await replyToComment(commentReply[1], body.text, auth.actor.id)
      await auditSocial(auth.actor.id, "comment.reply", "comment", commentReply[1], { surface: "mz6" })
      return socialOk(result)
    }
    const commentState = /^comments\/([^/]+)\/state$/.exec(route)
    if (commentState) {
      const payload = body.assignSelf === true ? { ...body, assignedUserId: auth.actor.id } : body
      const result = await updateCommentState(commentState[1], payload)
      await auditSocial(auth.actor.id, "comment.updated.mz6", "comment", commentState[1], payload)
      return socialOk(result)
    }
    return socialError("SOCIAL_COMMAND_MZ6_ROUTE_NOT_FOUND", 404, { path: route })
  } catch (error) { return socialError(error, 500, { path: route }) }
}
