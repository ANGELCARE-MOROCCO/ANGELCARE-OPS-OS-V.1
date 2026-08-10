import crypto from "node:crypto"
import { cleanString, nowIso, socialDb } from "@/lib/social-command/db"
import { instagramWebhookConfig } from "@/lib/social-command/instagram-webhook"
import { getConversation, updateConversationState } from "@/lib/social-command/engagement"
import type { SocialConversation } from "@/lib/social-command/types"

export type InstagramContactProfileMZ6 = {
  provider_scoped_user_id: string
  username: string | null
  display_name: string | null
  profile_picture_url: string | null
  follower_count: number | null
  is_verified_user: boolean | null
  is_user_follow_business: boolean | null
  is_business_follow_user: boolean | null
  refresh_state: "live" | "stale" | "provider_limited" | "failed" | "unknown"
  last_refreshed_at: string | null
  last_error: string | null
}

export type ConversationDossierMZ6 = {
  conversation: SocialConversation
  contactProfile: InstagramContactProfileMZ6 | null
  assignmentHistory: Array<Record<string, unknown>>
  notes: Array<Record<string, unknown>>
  publication: Record<string, unknown> | null
  campaign: Record<string, unknown> | null
  provider: {
    family: "instagram_login"
    host: "graph.instagram.com"
    accountConfigured: boolean
    tokenConfigured: boolean
  }
}

function providerError(payload: unknown, status: number) {
  const root = payload && typeof payload === "object" ? payload as Record<string, any> : {}
  const error = root.error && typeof root.error === "object" ? root.error as Record<string, any> : {}
  const message = cleanString(error.message || root.error_description || root.error || `Instagram HTTP ${status}`, 1800)
  const code = cleanString(error.code, 80)
  const subcode = cleanString(error.error_subcode, 80)
  return [message, code && `code=${code}`, subcode && `subcode=${subcode}`].filter(Boolean).join(" · ")
}

async function instagramJson(url: URL, init: RequestInit = {}) {
  const cfg = instagramWebhookConfig()
  if (!cfg.accessToken) throw new Error("Dedicated Instagram Login token is not configured")
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${cfg.accessToken}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  })
  const text = await response.text().catch(() => "")
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  if (!response.ok || payload?.error) throw new Error(providerError(payload, response.status))
  return payload || {}
}

function normalizeCachedProfile(row: Record<string, unknown> | null | undefined): InstagramContactProfileMZ6 | null {
  if (!row) return null
  return {
    provider_scoped_user_id: cleanString(row.provider_scoped_user_id, 500),
    username: cleanString(row.username, 500) || null,
    display_name: cleanString(row.display_name, 500) || null,
    profile_picture_url: cleanString(row.profile_picture_url, 3000) || null,
    follower_count: row.follower_count == null ? null : Number(row.follower_count),
    is_verified_user: typeof row.is_verified_user === "boolean" ? row.is_verified_user : null,
    is_user_follow_business: typeof row.is_user_follow_business === "boolean" ? row.is_user_follow_business : null,
    is_business_follow_user: typeof row.is_business_follow_user === "boolean" ? row.is_business_follow_user : null,
    refresh_state: (["live","stale","provider_limited","failed"] as string[]).includes(cleanString(row.refresh_state, 40)) ? cleanString(row.refresh_state, 40) as InstagramContactProfileMZ6["refresh_state"] : "unknown",
    last_refreshed_at: cleanString(row.last_refreshed_at, 100) || null,
    last_error: cleanString(row.last_error, 1800) || null,
  }
}

function isFresh(value: string | null | undefined, ttlMs: number) {
  if (!value) return false
  const t = new Date(value).getTime()
  return Number.isFinite(t) && Date.now() - t < ttlMs
}

export async function getOrRefreshInstagramContactProfile(providerScopedId: string, force = false) {
  const scopedId = cleanString(providerScopedId, 500)
  if (!scopedId) return null
  const db = await socialDb()
  const { data: cached, error: cacheError } = await db.from("social_command_contact_profiles")
    .select("*").eq("provider", "instagram").eq("provider_scoped_user_id", scopedId).maybeSingle()
  if (cacheError) throw cacheError
  const cachedProfile = normalizeCachedProfile(cached as Record<string, unknown> | null)
  if (!force && cachedProfile?.refresh_state === "live" && isFresh(cachedProfile.last_refreshed_at, 12 * 60 * 60 * 1000)) return cachedProfile
  if (!force && cachedProfile?.last_error && isFresh(cachedProfile.last_refreshed_at, 15 * 60 * 1000)) return cachedProfile

  const cfg = instagramWebhookConfig()
  if (!cfg.accessToken) return cachedProfile
  const url = new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(scopedId)}`)
  url.searchParams.set("fields", "name,username,profile_pic,follower_count,is_verified_user,is_user_follow_business,is_business_follow_user")
  const now = nowIso()
  try {
    const payload = await instagramJson(url)
    const row = {
      id: cached?.id || crypto.randomUUID(),
      provider: "instagram",
      provider_scoped_user_id: scopedId,
      username: cleanString(payload.username, 500) || null,
      display_name: cleanString(payload.name, 500) || null,
      profile_picture_url: cleanString(payload.profile_pic, 3000) || null,
      follower_count: payload.follower_count == null ? null : Math.max(0, Number(payload.follower_count || 0)),
      is_verified_user: typeof payload.is_verified_user === "boolean" ? payload.is_verified_user : null,
      is_user_follow_business: typeof payload.is_user_follow_business === "boolean" ? payload.is_user_follow_business : null,
      is_business_follow_user: typeof payload.is_business_follow_user === "boolean" ? payload.is_business_follow_user : null,
      consent_state: "message_initiated",
      refresh_state: "live",
      last_refreshed_at: now,
      last_error: null,
      first_seen_at: cached?.first_seen_at || now,
      updated_at: now,
    }
    const { data, error } = await db.from("social_command_contact_profiles").upsert(row, { onConflict: "provider,provider_scoped_user_id" }).select("*").single()
    if (error) throw error
    return normalizeCachedProfile(data as Record<string, unknown>)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const state = /consent|required|permission|not supported|unsupported/i.test(message) ? "provider_limited" : "failed"
    const fallback = {
      id: cached?.id || crypto.randomUUID(), provider: "instagram", provider_scoped_user_id: scopedId,
      username: cached?.username || null, display_name: cached?.display_name || null,
      profile_picture_url: cached?.profile_picture_url || null, follower_count: cached?.follower_count ?? null,
      is_verified_user: cached?.is_verified_user ?? null, is_user_follow_business: cached?.is_user_follow_business ?? null,
      is_business_follow_user: cached?.is_business_follow_user ?? null, consent_state: "message_initiated",
      refresh_state: state, last_refreshed_at: now, last_error: cleanString(message, 1800),
      first_seen_at: cached?.first_seen_at || now, updated_at: now,
    }
    await db.from("social_command_contact_profiles").upsert(fallback, { onConflict: "provider,provider_scoped_user_id" })
    return normalizeCachedProfile(fallback)
  }
}

async function applyProfileToConversation(conversation: SocialConversation, profile: InstagramContactProfileMZ6 | null) {
  if (!profile) return conversation
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  if (profile.username) patch.participant_username = profile.username
  if (profile.display_name) patch.participant_name = profile.display_name
  if (profile.profile_picture_url) patch.participant_profile_picture_url = profile.profile_picture_url
  patch.metadata = {
    ...(conversation.metadata || {}),
    instagram_profile: {
      verified: profile.is_verified_user,
      follower_count: profile.follower_count,
      follows_business: profile.is_user_follow_business,
      business_follows_user: profile.is_business_follow_user,
      refresh_state: profile.refresh_state,
      refreshed_at: profile.last_refreshed_at,
    },
  }
  const db = await socialDb()
  await db.from("social_command_conversations").update(patch).eq("id", conversation.id)
  return await getConversation(conversation.id)
}

export async function getConversationDossierMZ6(conversationId: string, forceProfile = false): Promise<ConversationDossierMZ6> {
  let conversation = await getConversation(conversationId)
  let contactProfile: InstagramContactProfileMZ6 | null = null
  if (conversation.channel === "instagram" && conversation.participant_id) {
    contactProfile = await getOrRefreshInstagramContactProfile(conversation.participant_id, forceProfile)
    conversation = await applyProfileToConversation(conversation, contactProfile)
  }
  const db = await socialDb()
  const [{ data: assignments }, { data: notes }] = await Promise.all([
    db.from("social_command_conversation_assignments").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(30),
    db.from("social_command_operator_notes").select("*").eq("entity_type", "conversation").eq("entity_id", conversationId).order("created_at", { ascending: false }).limit(30),
  ])
  let publication: Record<string, unknown> | null = null
  let campaign: Record<string, unknown> | null = null
  if (conversation.source_publication_id) {
    const { data } = await db.from("social_command_publications").select("id,title,format,channels,status,scheduled_at,published_at,campaign_id,metadata").eq("id", conversation.source_publication_id).maybeSingle()
    publication = data || null
  }
  const campaignId = conversation.campaign_id || cleanString(publication?.campaign_id, 200)
  if (campaignId) {
    const { data } = await db.from("social_command_campaigns").select("id,title,status,channels,start_at,end_at").eq("id", campaignId).maybeSingle()
    campaign = data || null
  }
  const cfg = instagramWebhookConfig()
  return {
    conversation,
    contactProfile,
    assignmentHistory: (assignments || []) as Array<Record<string, unknown>>,
    notes: (notes || []) as Array<Record<string, unknown>>,
    publication,
    campaign,
    provider: { family: "instagram_login", host: "graph.instagram.com", accountConfigured: Boolean(cfg.accountId), tokenConfigured: Boolean(cfg.accessToken) },
  }
}

export async function getCommentDossierMZ6(commentId: string) {
  const db = await socialDb()
  const { data: comment, error } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (error || !comment) throw error || new Error("Comment not found")
  let publication: Record<string, unknown> | null = null
  let campaign: Record<string, unknown> | null = null
  if (comment.publication_id) {
    const { data } = await db.from("social_command_publications").select("id,title,format,channels,status,scheduled_at,published_at,campaign_id,metadata").eq("id", comment.publication_id).maybeSingle()
    publication = data || null
  }
  const campaignId = comment.campaign_id || publication?.campaign_id
  if (campaignId) {
    const { data } = await db.from("social_command_campaigns").select("id,title,status,channels,start_at,end_at").eq("id", campaignId).maybeSingle()
    campaign = data || null
  }
  return { comment, publication, campaign }
}

export async function sendInstagramDirectTextMZ6(conversationId: string, textValue: unknown, actorUserId: string) {
  const text = cleanString(textValue, 20000)
  if (!text) throw new Error("Message text is required")
  const conversation = await getConversation(conversationId)
  if (conversation.channel !== "instagram") throw new Error("Instagram Login messaging is only available for Instagram conversations")
  const cfg = instagramWebhookConfig()
  if (!cfg.accountId) throw new Error("Dedicated Instagram professional account ID is not configured")
  if (!cfg.accessToken) throw new Error("Dedicated Instagram Login access token is not configured")
  if (!conversation.participant_id) throw new Error("Instagram recipient identity is unavailable")
  const db = await socialDb()
  const now = nowIso()
  const messageId = crypto.randomUUID()
  await db.from("social_command_messages").insert({
    id: messageId, conversation_id: conversationId, provider_message_id: null, direction: "outbound",
    sender_id: cfg.accountId, recipient_id: conversation.participant_id, sender_username: null,
    message_type: "text", text, attachments: [], status: "sending", sent_by_user_id: actorUserId,
    provider_timestamp: now, provider_payload: { adapter: "instagram_login_mz6", host: "graph.instagram.com" }, created_at: now, updated_at: now,
  })
  try {
    const url = new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(cfg.accountId)}/messages`)
    const payload = await instagramJson(url, { method: "POST", body: JSON.stringify({ recipient: { id: conversation.participant_id }, message: { text } }) })
    const providerMessageId = cleanString(payload.message_id, 500) || null
    const providerRecipientId = cleanString(payload.recipient_id, 500) || conversation.participant_id
    await db.from("social_command_messages").update({
      provider_message_id: providerMessageId, recipient_id: providerRecipientId, status: "sent",
      provider_payload: { ...payload, adapter: "instagram_login_mz6", host: "graph.instagram.com" }, updated_at: nowIso(),
    }).eq("id", messageId)
    await db.from("social_command_conversations").update({
      status: "responded", unread_count: 0, first_response_at: conversation.first_response_at || now,
      last_message_at: now, last_message_preview: text, updated_at: nowIso(),
    }).eq("id", conversationId)
    return await getConversationDossierMZ6(conversationId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.from("social_command_messages").update({ status: "failed", provider_payload: { adapter: "instagram_login_mz6", error: cleanString(message, 1800) }, updated_at: nowIso() }).eq("id", messageId)
    throw new Error(`Réponse Instagram non envoyée. La conversation reste inchangée. Détail fournisseur: ${message}`)
  }
}

export async function updateConversationOperationalStateMZ6(conversationId: string, input: Record<string, unknown>, actorUserId: string) {
  const normalized: Record<string, unknown> = { ...input }
  if (input.assignSelf === true) {
    normalized.assignedUserId = actorUserId
    if (!cleanString(input.status, 60)) normalized.status = "assigned"
  }
  delete normalized.assignSelf
  const base = await updateConversationState(conversationId, normalized, actorUserId)
  const waitingReason = cleanString(input.waitingReason, 120)
  const db = await socialDb()
  if (waitingReason || Object.prototype.hasOwnProperty.call(input, "waitingReason")) {
    const metadata = { ...(base.metadata || {}), waiting_reason: waitingReason || null, waiting_since: waitingReason ? nowIso() : null }
    await db.from("social_command_conversations").update({ metadata, updated_at: nowIso() }).eq("id", conversationId)
  }
  await db.from("social_command_engagement_events").insert({
    id: crypto.randomUUID(), kind: "operation", channel: base.channel, conversation_id: conversationId,
    campaign_id: base.campaign_id, publication_id: base.source_publication_id, provider_reference: base.provider_conversation_id,
    status: cleanString(normalized.status, 60) || "updated", payload: { ...normalized, waitingReason: waitingReason || null, actorUserId }, observed_at: nowIso(), created_at: nowIso(),
  })
  return await getConversationDossierMZ6(conversationId)
}
