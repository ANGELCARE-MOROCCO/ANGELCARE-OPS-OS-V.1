import { cleanString, nowIso, socialDb } from "@/lib/social-command/db"
import { getConversation } from "@/lib/social-command/engagement"
import { getConversationDossierMZ6, getOrRefreshInstagramContactProfile, sendInstagramDirectTextMZ6 } from "@/lib/social-command/instagram-engagement-mz6"
import { getOrRefreshFacebookContactProfileMZ7, replyFacebookCommentMZ7, sendFacebookMessengerTextMZ7 } from "@/lib/social-command/facebook-mz7"
import { bindEntityToRelationshipMZ7, ensureRelationshipIdentityMZ7, getRelationshipDossierMZ7, archiveResolvedEngagementMZ7, listArchivedEngagementMZ7, recordJourneyEventMZ7, setCommentJourneyStateMZ7, setConversationJourneyStateMZ7, setMentionJourneyStateMZ7 } from "@/lib/social-command/relationship-mz7"
import { replyToComment } from "@/lib/social-command/engagement"

async function ensureConversationRelationship(conversation: any, forceProfile = false) {
  const provider = conversation.channel === "facebook" ? "facebook" as const : "instagram" as const
  let profile: any = null
  if (provider === "facebook") profile = await getOrRefreshFacebookContactProfileMZ7(conversation.participant_id, forceProfile)
  else profile = await getOrRefreshInstagramContactProfile(conversation.participant_id, forceProfile)
  const identity = await ensureRelationshipIdentityMZ7({
    provider, providerUserId: conversation.participant_id,
    providerAccountId: conversation.provider_account_id || null,
    username: profile?.username || conversation.participant_username || null,
    displayName: profile?.display_name || conversation.participant_name || null,
    profilePictureUrl: profile?.profile_picture_url || conversation.participant_profile_picture_url || null,
    evidence: { source: "dossier_reconciliation", profileState: profile?.refresh_state || null },
    firstSeenAt: conversation.first_received_at, lastSeenAt: conversation.last_message_at,
  })
  if (conversation.relationship_contact_id !== identity.relationship_contact_id) await bindEntityToRelationshipMZ7({ entityType: "conversation", entityId: conversation.id, contactId: identity.relationship_contact_id, sourceKind: (conversation.source_kind || "webhook_live") as any })
  return { profile, identity }
}

export async function getConversationDossierMZ7(conversationId: string, forceProfile = false) {
  const conversation = await getConversation(conversationId)
  const db = await socialDb()
  if (conversation.channel === "instagram") {
    const mz6 = await getConversationDossierMZ6(conversationId, forceProfile)
    const linked = await ensureConversationRelationship(mz6.conversation, forceProfile)
    const relationship = await getRelationshipDossierMZ7(linked.identity.relationship_contact_id)
    const windowExpiry = (mz6.conversation as any).messaging_window_expires_at || null
    return { ...mz6, relationship, provider: { ...mz6.provider, channel: "instagram" }, messagingWindow: { expiresAt: windowExpiry, state: windowExpiry && new Date(windowExpiry).getTime() < Date.now() ? "closed" : "open_or_unknown" } }
  }
  const linked = await ensureConversationRelationship(conversation, forceProfile)
  const [assignmentQ, noteQ, publicationQ, campaignQ, relationship] = await Promise.all([
    db.from("social_command_conversation_assignments").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(60),
    db.from("social_command_operator_notes").select("*").eq("entity_type", "conversation").eq("entity_id", conversationId).order("created_at", { ascending: false }).limit(60),
    conversation.source_publication_id ? db.from("social_command_publications").select("*").eq("id", conversation.source_publication_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    conversation.campaign_id ? db.from("social_command_campaigns").select("*").eq("id", conversation.campaign_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    getRelationshipDossierMZ7(linked.identity.relationship_contact_id),
  ])
  for (const q of [assignmentQ, noteQ, publicationQ, campaignQ]) if ((q as any).error) throw (q as any).error
  const windowExpiry = (conversation as any).messaging_window_expires_at || null
  return {
    conversation,
    contactProfile: linked.profile,
    relationship,
    assignmentHistory: assignmentQ.data || [],
    notes: noteQ.data || [],
    publication: publicationQ.data || null,
    campaign: campaignQ.data || null,
    provider: { family: "facebook_login", host: "graph.facebook.com", channel: "facebook", accountConfigured: true, tokenConfigured: true },
    messagingWindow: { expiresAt: windowExpiry, state: windowExpiry && new Date(windowExpiry).getTime() < Date.now() ? "closed" : "open_or_unknown" },
  }
}

export async function getCommentDossierMZ7(commentId: string) {
  const db = await socialDb()
  const { data: comment, error } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (error || !comment) throw error || new Error("Comment not found")
  let identity: any = null
  const provider = comment.channel === "facebook" ? "facebook" as const : "instagram" as const
  if (comment.commenter_id) {
    identity = await ensureRelationshipIdentityMZ7({ provider, providerUserId: comment.commenter_id, providerAccountId: comment.provider_account_id || null, username: provider === "instagram" ? comment.commenter_username : null, displayName: provider === "facebook" ? comment.commenter_username : null, evidence: { source: "comment_dossier" }, firstSeenAt: comment.provider_created_at, lastSeenAt: comment.provider_created_at })
    if (comment.relationship_contact_id !== identity.relationship_contact_id) await bindEntityToRelationshipMZ7({ entityType: "comment", entityId: comment.id, contactId: identity.relationship_contact_id, sourceKind: (comment.source_kind || "webhook_live") as any })
  }
  const [publicationQ, campaignQ, threadQ, relationship] = await Promise.all([
    comment.publication_id ? db.from("social_command_publications").select("*").eq("id", comment.publication_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    comment.campaign_id ? db.from("social_command_campaigns").select("*").eq("id", comment.campaign_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    comment.provider_post_id || comment.media_id ? db.from("social_command_comments").select("*").eq("channel", comment.channel).eq("provider_post_id", comment.provider_post_id || comment.media_id).order("provider_created_at", { ascending: true }).limit(120) : Promise.resolve({ data: [comment], error: null }),
    identity?.relationship_contact_id ? getRelationshipDossierMZ7(identity.relationship_contact_id) : Promise.resolve(null),
  ])
  for (const q of [publicationQ, campaignQ, threadQ]) if ((q as any).error) throw (q as any).error
  return { comment: { ...comment, relationship_contact_id: identity?.relationship_contact_id || comment.relationship_contact_id || null }, publication: publicationQ.data || null, campaign: campaignQ.data || null, thread: threadQ.data || [comment], relationship, provider: { channel: comment.channel, providerState: comment.provider_state || null, sourceKind: comment.source_kind || "webhook_live" } }
}

export async function sendConversationReplyMZ7(conversationId: string, text: unknown, actorUserId: string) {
  const db = await socialDb(); const { data: conversation, error } = await db.from("social_command_conversations").select("channel").eq("id", conversationId).single(); if (error || !conversation) throw error || new Error("Conversation not found")
  if (conversation.channel === "facebook") return sendFacebookMessengerTextMZ7({ conversationId, text, actorUserId })
  return sendInstagramDirectTextMZ6(conversationId, text, actorUserId)
}

export async function replyCommentMZ7(commentId: string, text: unknown, actorUserId: string) {
  const db = await socialDb(); const { data: comment, error } = await db.from("social_command_comments").select("channel,relationship_contact_id").eq("id", commentId).single(); if (error || !comment) throw error || new Error("Comment not found")
  const result = comment.channel === "facebook" ? await replyFacebookCommentMZ7(commentId, text, actorUserId) : await replyToComment(commentId, text, actorUserId)
  if (comment.channel !== "facebook") await recordJourneyEventMZ7({ contactId: comment.relationship_contact_id || null, provider: "instagram", entityType: "comment", entityId: commentId, kind: "instagram.comment.replied", source: "operator", actorUserId, title: "Réponse Instagram publiée", summary: cleanString(text, 2000), occurredAt: nowIso(), payload: result as any })
  return result
}

export async function engagementMZ7Bootstrap() {
  const db = await socialDb()
  const [{ data: activeConversations, error: cError }, { data: activeComments, error: cmError }, { data: activeMentions, error: mError }, archived] = await Promise.all([
    db.from("social_command_conversations").select("*").neq("status", "archived").order("last_message_at", { ascending: false }).limit(300),
    db.from("social_command_comments").select("*").neq("status", "archived").order("provider_created_at", { ascending: false, nullsFirst: false }).limit(400),
    db.from("social_command_mentions").select("*").neq("status", "archived").order("provider_created_at", { ascending: false, nullsFirst: false }).limit(250),
    listArchivedEngagementMZ7(200),
  ])
  if (cError) throw cError; if (cmError) throw cmError; if (mError) throw mError
  return { active: { conversations: activeConversations || [], comments: activeComments || [], mentions: activeMentions || [] }, archived }
}

export { setConversationJourneyStateMZ7, setCommentJourneyStateMZ7, setMentionJourneyStateMZ7, archiveResolvedEngagementMZ7 }
