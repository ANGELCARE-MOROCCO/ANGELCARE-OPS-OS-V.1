import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { getActiveConnectionWithSecrets } from "@/lib/social-command/repository"
import { getConnectionSecrets, metaConfig } from "@/lib/social-command/meta"
import { ensureRelationshipIdentityMZ7, recordJourneyEventMZ7 } from "@/lib/social-command/relationship-mz7"

export const FACEBOOK_MZ7_DEFAULT_FIELDS = [
  "messages",
  "message_echoes",
  "message_reads",
  "message_reactions",
  "message_edits",
  "messaging_postbacks",
  "messaging_referrals",
  "messaging_policy_enforcement",
  "standby",
  "feed",
] as const

export type FacebookProviderErrorKind = "permission" | "token" | "policy" | "window" | "rate_limit" | "provider_unavailable" | "invalid_recipient" | "unsupported" | "unknown"

export class FacebookProviderErrorMZ7 extends Error {
  kind: FacebookProviderErrorKind
  code: string | null
  subcode: string | null
  status: number
  constructor(message: string, kind: FacebookProviderErrorKind, status: number, code?: string | null, subcode?: string | null) {
    super(message); this.name = "FacebookProviderErrorMZ7"; this.kind = kind; this.status = status; this.code = code || null; this.subcode = subcode || null
  }
}

function classifyProviderError(message: string, code: string, status: number): FacebookProviderErrorKind {
  const value = `${message} ${code}`.toLowerCase()
  if (/permission|capability|not authorized|requires advanced access|oauth permission/.test(value)) return "permission"
  if (/access token|oauth|session has expired|invalid token/.test(value) || code === "190") return "token"
  if (/24.hour|window|outside.*window/.test(value)) return "window"
  if (/policy|enforcement/.test(value)) return "policy"
  if (/rate|too many|application request limit/.test(value) || status === 429) return "rate_limit"
  if (/recipient|psid|user not found/.test(value)) return "invalid_recipient"
  if (/unsupported|not supported/.test(value)) return "unsupported"
  if (status >= 500) return "provider_unavailable"
  return "unknown"
}

function providerError(payload: unknown, status: number) {
  const root = jsonObject(payload)
  const error = jsonObject(root.error)
  const message = cleanString(error.message || root.error_description || root.error || `Facebook HTTP ${status}`, 2000)
  const code = cleanString(error.code, 80)
  const subcode = cleanString(error.error_subcode, 80)
  return new FacebookProviderErrorMZ7(message || `Facebook HTTP ${status}`, classifyProviderError(message, code, status), status, code || null, subcode || null)
}

async function graphJsonMZ7(url: URL, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  })
  const text = await response.text().catch(() => "")
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  if (!response.ok || payload?.error) throw providerError(payload, response.status)
  return payload || {}
}

export async function facebookRuntimeMZ7() {
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) throw new Error("No active Meta connection")
  const pageId = cleanString(connection.facebook_page_id, 500)
  if (!pageId) throw new Error("Facebook Page is not connected")
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken) throw new Error("Facebook Page access token is unavailable")
  const cfg = metaConfig()
  const tasks = Array.isArray(connection.meta_json?.page_tasks) ? connection.meta_json.page_tasks.map((x: unknown) => cleanString(x, 120)).filter(Boolean) : []
  const scopes = Array.isArray(connection.granted_scopes) ? connection.granted_scopes.map((x: unknown) => cleanString(x, 120)).filter(Boolean) : []
  return { connection, pageId, pageToken, graphVersion: cfg.graphVersion, tasks, scopes }
}

export async function inspectFacebookOperationsMZ7() {
  const runtime = await facebookRuntimeMZ7()
  const pageUrl = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(runtime.pageId)}`)
  pageUrl.searchParams.set("fields", "id,name,category,link")
  let page: any = null, pageError: string | null = null
  try { page = await graphJsonMZ7(pageUrl, runtime.pageToken) } catch (error) { pageError = error instanceof Error ? error.message : String(error) }
  let subscriptions: any = null, subscriptionError: any = null
  try { subscriptions = await inspectFacebookSubscriptionsMZ7() } catch (error) {
    subscriptionError = error instanceof FacebookProviderErrorMZ7 ? { message: error.message, kind: error.kind, code: error.code, subcode: error.subcode } : { message: error instanceof Error ? error.message : String(error), kind: "unknown" }
  }
  const scopes = new Set(runtime.scopes)
  const tasks = new Set(runtime.tasks.map((x: string) => x.toUpperCase()))
  const permissionState = {
    pagesMessaging: scopes.has("pages_messaging"),
    pagesManageMetadata: scopes.has("pages_manage_metadata"),
    pagesReadEngagement: scopes.has("pages_read_engagement"),
    pagesManagePosts: scopes.has("pages_manage_posts"),
    pagesReadUserContent: scopes.has("pages_read_user_content"),
  }
  return {
    page: { configured: true, id: runtime.pageId, name: cleanString(page?.name || runtime.connection.facebook_page_name, 500) || null, category: cleanString(page?.category, 500) || null, link: cleanString(page?.link, 2000) || null, error: pageError },
    token: { configured: true, hidden: true, expiresAt: runtime.connection.token_expires_at || null, lastVerifiedAt: runtime.connection.last_verified_at || null },
    tasks: runtime.tasks,
    scopes: runtime.scopes,
    permissionState,
    capabilities: {
      publishing: Boolean(tasks.has("CREATE_CONTENT") || tasks.has("MANAGE") || permissionState.pagesManagePosts),
      messenger: Boolean(tasks.has("MESSAGING") || tasks.has("MODERATE")) && permissionState.pagesMessaging,
      moderation: Boolean(tasks.has("MODERATE") || tasks.has("MANAGE")) && (permissionState.pagesReadEngagement || permissionState.pagesReadUserContent),
      historicalMessenger: permissionState.pagesMessaging && permissionState.pagesManageMetadata && permissionState.pagesReadEngagement,
      historicalComments: permissionState.pagesReadEngagement || permissionState.pagesReadUserContent,
    },
    subscriptions,
    subscriptionError,
  }
}

export async function inspectFacebookSubscriptionsMZ7() {
  const runtime = await facebookRuntimeMZ7()
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(runtime.pageId)}/subscribed_apps`)
  const payload = await graphJsonMZ7(url, runtime.pageToken)
  const data = Array.isArray(payload.data) ? payload.data : []
  const appId = cleanString(metaConfig().appId, 200)
  const row = data.find((entry: any) => !appId || cleanString(entry?.id, 200) === appId) || data[0] || null
  const subscribed = Array.isArray(row?.subscribed_fields) ? row.subscribed_fields.map((x: unknown) => cleanString(x, 120)).filter(Boolean) : []
  const desired = String(process.env.SOCIAL_COMMAND_FACEBOOK_WEBHOOK_FIELDS || FACEBOOK_MZ7_DEFAULT_FIELDS.join(",")).split(",").map(x => cleanString(x, 120)).filter(Boolean)
  return {
    pageId: runtime.pageId,
    appId: cleanString(row?.id, 200) || appId || null,
    appName: cleanString(row?.name, 500) || null,
    subscribedFields: subscribed,
    desiredFields: desired,
    missingFields: desired.filter(field => !subscribed.includes(field)),
    extraFields: subscribed.filter((field: string) => !desired.includes(field)),
    healthy: desired.every(field => subscribed.includes(field)),
    inspectedAt: nowIso(),
  }
}

export async function reconcileFacebookSubscriptionsMZ7(fieldsValue?: unknown) {
  const runtime = await facebookRuntimeMZ7()
  const requested = Array.isArray(fieldsValue) ? fieldsValue.map((x: unknown) => cleanString(x, 120)).filter(Boolean) : String(fieldsValue || process.env.SOCIAL_COMMAND_FACEBOOK_WEBHOOK_FIELDS || FACEBOOK_MZ7_DEFAULT_FIELDS.join(",")).split(",").map(x => cleanString(x, 120)).filter(Boolean)
  if (!requested.length) throw new Error("At least one Facebook webhook field is required")
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(runtime.pageId)}/subscribed_apps`)
  url.searchParams.set("subscribed_fields", requested.join(","))
  const result = await graphJsonMZ7(url, runtime.pageToken, { method: "POST" })
  const inspected = await inspectFacebookSubscriptionsMZ7()
  return { result, inspected }
}

export async function sendFacebookMessengerTextMZ7(input: { conversationId: string; text: unknown; actorUserId: string }) {
  const text = cleanString(input.text, 20000)
  if (!text) throw new Error("Message text is required")
  const db = await socialDb()
  const { data: conversation, error } = await db.from("social_command_conversations").select("*").eq("id", input.conversationId).single()
  if (error || !conversation) throw error || new Error("Conversation not found")
  if (conversation.channel !== "facebook") throw new Error("This adapter only sends Facebook Messenger conversations")
  const runtime = await facebookRuntimeMZ7()
  const recipientId = cleanString(conversation.participant_id, 500)
  if (!recipientId) throw new Error("Facebook Page-scoped recipient ID is unavailable")
  const windowExpiry = conversation.messaging_window_expires_at ? new Date(conversation.messaging_window_expires_at).getTime() : null
  if (windowExpiry && Number.isFinite(windowExpiry) && windowExpiry < Date.now()) throw new FacebookProviderErrorMZ7("Standard Messenger reply window is closed for this conversation", "window", 409)
  const localMessageId = crypto.randomUUID(), now = nowIso()
  await db.from("social_command_messages").insert({
    id: localMessageId, conversation_id: input.conversationId, provider_message_id: null, direction: "outbound",
    sender_id: runtime.pageId, recipient_id: recipientId, sender_username: runtime.connection.facebook_page_name || null,
    message_type: "text", text, attachments: [], status: "sending", sent_by_user_id: input.actorUserId,
    provider_timestamp: now, provider_payload: { adapter: "facebook_messenger_mz7", source_kind: "operator" }, source_kind: "operator", provider_state: "sending", created_at: now, updated_at: now,
  })
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(runtime.pageId)}/messages`)
  try {
    const payload = await graphJsonMZ7(url, runtime.pageToken, {
      method: "POST",
      body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: "RESPONSE", message: { text } }),
    })
    const providerMessageId = cleanString(payload.message_id, 500) || null
    await db.from("social_command_messages").update({ provider_message_id: providerMessageId, status: "sent", provider_payload: payload, provider_state: "provider_accepted", updated_at: nowIso() }).eq("id", localMessageId)
    await db.from("social_command_conversations").update({ status: "responded", unread_count: 0, first_response_at: conversation.first_response_at || now, last_message_at: now, last_message_preview: text, updated_at: nowIso() }).eq("id", input.conversationId)
    await recordJourneyEventMZ7({ contactId: conversation.relationship_contact_id || null, provider: "facebook", entityType: "message", entityId: localMessageId, kind: "messenger.reply.provider_accepted", source: "operator", actorUserId: input.actorUserId, providerReference: providerMessageId, title: "Réponse Messenger envoyée", summary: text, occurredAt: now, payload })
    return { localMessageId, providerMessageId, recipientId, status: "sent" }
  } catch (sendError) {
    const detail = sendError instanceof FacebookProviderErrorMZ7 ? { message: sendError.message, kind: sendError.kind, code: sendError.code, subcode: sendError.subcode } : { message: sendError instanceof Error ? sendError.message : String(sendError), kind: "unknown" }
    await db.from("social_command_messages").update({ status: "failed", provider_payload: { error: detail }, provider_state: "failed", updated_at: nowIso() }).eq("id", localMessageId)
    await recordJourneyEventMZ7({ contactId: conversation.relationship_contact_id || null, provider: "facebook", entityType: "message", entityId: localMessageId, kind: "messenger.reply.failed", source: "operator", actorUserId: input.actorUserId, title: "Réponse Messenger non envoyée", summary: detail.message, occurredAt: nowIso(), payload: detail })
    throw sendError
  }
}

export async function sendFacebookSenderActionMZ7(conversationId: string, action: "mark_seen" | "typing_on" | "typing_off") {
  const db = await socialDb()
  const { data: conversation, error } = await db.from("social_command_conversations").select("participant_id,channel").eq("id", conversationId).single()
  if (error || !conversation) throw error || new Error("Conversation not found")
  if (conversation.channel !== "facebook") throw new Error("Facebook Messenger conversation required")
  const runtime = await facebookRuntimeMZ7()
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(runtime.pageId)}/messages`)
  return graphJsonMZ7(url, runtime.pageToken, { method: "POST", body: JSON.stringify({ recipient: { id: conversation.participant_id }, sender_action: action }) })
}

export async function getOrRefreshFacebookContactProfileMZ7(providerScopedId: string, force = false) {
  const id = cleanString(providerScopedId, 500)
  if (!id) return null
  const db = await socialDb()
  const { data: cached, error } = await db.from("social_command_contact_profiles").select("*").eq("provider", "facebook").eq("provider_scoped_user_id", id).maybeSingle()
  if (error) throw error
  const last = cached?.last_refreshed_at ? new Date(cached.last_refreshed_at).getTime() : 0
  if (!force && cached && Number.isFinite(last) && Date.now() - last < 12 * 60 * 60 * 1000) return cached
  const runtime = await facebookRuntimeMZ7()
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(id)}`)
  url.searchParams.set("fields", "first_name,last_name,name,profile_pic")
  const now = nowIso()
  try {
    const payload = await graphJsonMZ7(url, runtime.pageToken)
    const displayName = cleanString(payload.name || [payload.first_name,payload.last_name].filter(Boolean).join(" "), 500) || null
    const row = {
      id: cached?.id || crypto.randomUUID(), provider: "facebook", provider_scoped_user_id: id,
      username: null, display_name: displayName, profile_picture_url: cleanString(payload.profile_pic, 3000) || null,
      follower_count: null, is_verified_user: null, is_user_follow_business: null, is_business_follow_user: null,
      consent_state: "message_initiated", refresh_state: "live", last_refreshed_at: now, last_error: null,
      first_seen_at: cached?.first_seen_at || now, created_at: cached?.created_at || now, updated_at: now,
    }
    const { data, error: upsertError } = await db.from("social_command_contact_profiles").upsert(row, { onConflict: "provider,provider_scoped_user_id" }).select("*").single()
    if (upsertError) throw upsertError
    const identity = await ensureRelationshipIdentityMZ7({ provider: "facebook", providerUserId: id, providerAccountId: runtime.pageId, displayName, profilePictureUrl: row.profile_picture_url, evidence: { profile: payload }, lastSeenAt: now })
    await db.from("social_command_contact_profiles").update({ relationship_contact_id: identity.relationship_contact_id }).eq("id", data.id)
    return { ...data, relationship_contact_id: identity.relationship_contact_id }
  } catch (profileError) {
    const message = profileError instanceof Error ? profileError.message : String(profileError)
    const row = {
      id: cached?.id || crypto.randomUUID(), provider: "facebook", provider_scoped_user_id: id,
      consent_state: "provider_limited", refresh_state: "provider_limited", last_refreshed_at: now, last_error: cleanString(message, 1800),
      first_seen_at: cached?.first_seen_at || now, created_at: cached?.created_at || now, updated_at: now,
    }
    const { data } = await db.from("social_command_contact_profiles").upsert(row, { onConflict: "provider,provider_scoped_user_id" }).select("*").single()
    return data || cached || null
  }
}

export async function replyFacebookCommentMZ7(commentId: string, messageValue: unknown, actorUserId: string) {
  const message = cleanString(messageValue, 20000)
  if (!message) throw new Error("Reply text is required")
  const db = await socialDb()
  const { data: comment, error } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (error || !comment) throw error || new Error("Comment not found")
  if (comment.channel !== "facebook") throw new Error("Facebook comment required")
  const runtime = await facebookRuntimeMZ7()
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(comment.provider_comment_id)}/comments`)
  const payload = await graphJsonMZ7(url, runtime.pageToken, { method: "POST", body: JSON.stringify({ message }) })
  const repliedAt = nowIso()
  await db.from("social_command_comments").update({ status: "answered", replied_at: repliedAt, updated_at: repliedAt, metadata: { ...jsonObject(comment.metadata), last_reply: payload, replied_by: actorUserId } }).eq("id", commentId)
  await recordJourneyEventMZ7({ contactId: comment.relationship_contact_id || null, provider: "facebook", entityType: "comment", entityId: commentId, kind: "facebook.comment.replied", source: "operator", actorUserId, providerReference: cleanString(payload.id, 500) || null, title: "Réponse Facebook publiée", summary: message, occurredAt: repliedAt, payload })
  return { id: commentId, providerReplyId: cleanString(payload.id, 500) || null, status: "answered", repliedAt }
}

export async function moderateFacebookCommentMZ7(commentId: string, action: "hide" | "unhide") {
  const db = await socialDb()
  const { data: comment, error } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (error || !comment) throw error || new Error("Comment not found")
  if (comment.channel !== "facebook") throw new Error("Facebook comment required")
  const runtime = await facebookRuntimeMZ7()
  const url = new URL(`https://graph.facebook.com/${runtime.graphVersion}/${encodeURIComponent(comment.provider_comment_id)}`)
  const payload = await graphJsonMZ7(url, runtime.pageToken, { method: "POST", body: JSON.stringify({ is_hidden: action === "hide" }) })
  await db.from("social_command_comments").update({ provider_state: action === "hide" ? "hidden" : "visible", metadata: { ...jsonObject(comment.metadata), moderation: { action, payload, at: nowIso() } }, updated_at: nowIso() }).eq("id", commentId)
  return { id: commentId, action, providerState: action === "hide" ? "hidden" : "visible", payload }
}
