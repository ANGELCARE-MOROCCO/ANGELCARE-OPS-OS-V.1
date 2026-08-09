import crypto from "node:crypto"
import { cleanString, nowIso, socialDb, stringArray } from "@/lib/social-command/db"
import { getActiveConnectionWithSecrets } from "@/lib/social-command/repository"
import { getConnectionSecrets, metaConfig } from "@/lib/social-command/meta"
import type { SocialComment, SocialConversation, SocialMessage, SocialMention } from "@/lib/social-command/types"

function normalizeConversation(row: Record<string, unknown>): SocialConversation {
  return {
    id: cleanString(row.id, 200), channel: row.channel === "facebook" ? "facebook" : "instagram",
    provider_conversation_id: cleanString(row.provider_conversation_id, 500) || null,
    participant_id: cleanString(row.participant_id, 500), participant_username: cleanString(row.participant_username, 500) || null,
    participant_name: cleanString(row.participant_name, 500) || null, participant_profile_picture_url: cleanString(row.participant_profile_picture_url, 2000) || null,
    status: (cleanString(row.status, 60) || "open") as SocialConversation["status"], priority: cleanString(row.priority, 60) || "normal",
    assigned_user_id: cleanString(row.assigned_user_id, 200) || null, campaign_id: cleanString(row.campaign_id, 200) || null,
    source_publication_id: cleanString(row.source_publication_id, 200) || null, triage_category: cleanString(row.triage_category, 120) || null,
    triage_source: cleanString(row.triage_source, 120) || null, triage_confidence: row.triage_confidence == null ? null : Number(row.triage_confidence),
    unread_count: Number(row.unread_count || 0), first_received_at: cleanString(row.first_received_at, 100) || nowIso(),
    last_message_at: cleanString(row.last_message_at, 100) || nowIso(), first_response_at: cleanString(row.first_response_at, 100) || null,
    resolved_at: cleanString(row.resolved_at, 100) || null, due_at: cleanString(row.due_at, 100) || null,
    last_message_preview: cleanString(row.last_message_preview, 2000) || null, tags: stringArray(row.tags),
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {},
    created_at: cleanString(row.created_at, 100) || nowIso(), updated_at: cleanString(row.updated_at, 100) || nowIso(),
  }
}

function normalizeMessage(row: Record<string, unknown>): SocialMessage {
  return {
    id: cleanString(row.id, 200), conversation_id: cleanString(row.conversation_id, 200), provider_message_id: cleanString(row.provider_message_id, 500) || null,
    direction: row.direction === "outbound" ? "outbound" : "inbound", sender_id: cleanString(row.sender_id, 500) || null,
    recipient_id: cleanString(row.recipient_id, 500) || null, sender_username: cleanString(row.sender_username, 500) || null,
    message_type: cleanString(row.message_type, 100) || "text", text: cleanString(row.text, 20000), attachments: Array.isArray(row.attachments) ? row.attachments as Array<Record<string, unknown>> : [],
    status: (cleanString(row.status, 60) || "received") as SocialMessage["status"], sent_by_user_id: cleanString(row.sent_by_user_id, 200) || null,
    provider_timestamp: cleanString(row.provider_timestamp, 100) || null,
    provider_payload: row.provider_payload && typeof row.provider_payload === "object" && !Array.isArray(row.provider_payload) ? row.provider_payload as Record<string, unknown> : {},
    created_at: cleanString(row.created_at, 100) || nowIso(), updated_at: cleanString(row.updated_at, 100) || nowIso(),
  }
}

export async function listConversations(limit = 180): Promise<SocialConversation[]> {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_conversations").select("*").neq("status", "archived").order("last_message_at", { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []).map((row: any) => normalizeConversation(row as Record<string, unknown>))
}

export async function getConversation(conversationId: string) {
  const db = await socialDb()
  const [{ data: row, error }, { data: messages, error: messageError }] = await Promise.all([
    db.from("social_command_conversations").select("*").eq("id", conversationId).single(),
    db.from("social_command_messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(500),
  ])
  if (error || !row) throw error || new Error("Conversation not found")
  if (messageError) throw messageError
  const conversation = normalizeConversation(row as Record<string, unknown>)
  conversation.messages = (messages || []).map((message: any) => normalizeMessage(message as Record<string, unknown>))
  return conversation
}

export async function listComments(limit = 220): Promise<SocialComment[]> {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_comments").select("*").neq("status", "resolved").order("provider_created_at", { ascending: false, nullsFirst: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialComment[]
}

export async function listMentions(limit = 160): Promise<SocialMention[]> {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_mentions").select("*").neq("status", "resolved").order("provider_created_at", { ascending: false, nullsFirst: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialMention[]
}

export async function engagementBootstrap() {
  const [conversations, comments, mentions] = await Promise.all([listConversations(), listComments(), listMentions()])
  return { conversations, comments, mentions }
}

async function graphJson(url: URL, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" })
  const text = await response.text().catch(() => "")
  let payload: Record<string, unknown> = {}
  try { payload = text ? JSON.parse(text) as Record<string, unknown> : {} } catch {}
  const errorObject = payload.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : null
  if (!response.ok || errorObject) throw new Error(cleanString(errorObject?.message || payload.error || `Meta HTTP ${response.status}`, 3000))
  return payload
}

export async function sendConversationReply(conversationId: string, textValue: unknown, actorUserId: string) {
  const text = cleanString(textValue, 20000)
  if (!text) throw new Error("Message text is required")
  const conversation = await getConversation(conversationId)
  if (conversation.channel !== "instagram") throw new Error("This MZ2 messaging adapter currently supports Instagram conversations")
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) throw new Error("No active Meta connection")
  const igId = cleanString(connection.instagram_business_id, 300)
  if (!igId) throw new Error("Instagram business account is not connected")
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken) throw new Error("Meta Page token is unavailable")
  const cfg = metaConfig()
  const host = cleanString(process.env.SOCIAL_COMMAND_INSTAGRAM_MESSAGING_HOST || "https://graph.facebook.com", 1000).replace(/\/+$/, "")
  const url = new URL(`${host}/${cfg.graphVersion}/${encodeURIComponent(igId)}/messages`)
  url.searchParams.set("access_token", pageToken)
  const messageId = crypto.randomUUID()
  const db = await socialDb()
  const now = nowIso()
  await db.from("social_command_messages").insert({
    id: messageId, conversation_id: conversationId, provider_message_id: null, direction: "outbound",
    sender_id: igId, recipient_id: conversation.participant_id, sender_username: connection.instagram_username || null,
    message_type: "text", text, attachments: [], status: "sending", sent_by_user_id: actorUserId,
    provider_timestamp: now, provider_payload: {}, created_at: now, updated_at: now,
  })
  try {
    const payload = await graphJson(url, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipient: { id: conversation.participant_id }, message: { text } }),
    })
    const providerMessageId = cleanString(payload.message_id, 500) || null
    const providerRecipientId = cleanString(payload.recipient_id, 500) || conversation.participant_id
    await db.from("social_command_messages").update({
      provider_message_id: providerMessageId, recipient_id: providerRecipientId, status: "sent", provider_payload: payload, updated_at: nowIso(),
    }).eq("id", messageId)
    await db.from("social_command_conversations").update({
      status: "responded", unread_count: 0, first_response_at: conversation.first_response_at || now,
      last_message_at: now, last_message_preview: text, updated_at: nowIso(),
    }).eq("id", conversationId)
    return await getConversation(conversationId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.from("social_command_messages").update({ status: "failed", provider_payload: { error: message }, updated_at: nowIso() }).eq("id", messageId)
    throw error
  }
}

export async function updateConversationState(conversationId: string, input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  const status = cleanString(input.status, 60)
  if (["new","open","waiting","priority","assigned","responded","resolved","archived"].includes(status)) {
    patch.status = status
    if (status === "resolved") patch.resolved_at = nowIso()
    if (status !== "resolved") patch.resolved_at = null
  }
  const priority = cleanString(input.priority, 60)
  if (priority) patch.priority = priority
  if (Object.prototype.hasOwnProperty.call(input, "assignedUserId")) patch.assigned_user_id = cleanString(input.assignedUserId, 200) || null
  if (Array.isArray(input.tags)) patch.tags = stringArray(input.tags)
  if (Object.prototype.hasOwnProperty.call(input, "campaignId")) patch.campaign_id = cleanString(input.campaignId, 200) || null
  if (input.markRead === true) patch.unread_count = 0
  const { data, error } = await db.from("social_command_conversations").update(patch).eq("id", conversationId).select("*").single()
  if (error || !data) throw error || new Error("Conversation not found")
  await db.from("social_command_conversation_assignments").insert({
    id: crypto.randomUUID(), conversation_id: conversationId, assigned_user_id: cleanString(patch.assigned_user_id, 200) || null,
    assigned_by: actorUserId, action: cleanString(patch.status, 60) || (Object.prototype.hasOwnProperty.call(patch,"assigned_user_id") ? "assignment" : "update"), created_at: nowIso(),
  })
  return normalizeConversation(data as Record<string, unknown>)
}

export async function bulkConversationAction(input: Record<string, unknown>, actorUserId: string) {
  const ids = stringArray(input.conversationIds).slice(0, 500)
  if (!ids.length) throw new Error("No conversations selected")
  const db = await socialDb()
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  const action = cleanString(input.action, 80)
  if (action === "resolve") { patch.status = "resolved"; patch.resolved_at = nowIso() }
  else if (action === "reopen") { patch.status = "open"; patch.resolved_at = null }
  else if (action === "priority") { patch.status = "priority"; patch.priority = cleanString(input.priority, 60) || "high" }
  else if (action === "assign") { patch.status = "assigned"; patch.assigned_user_id = cleanString(input.assignedUserId, 200) || actorUserId }
  else if (action === "waiting") patch.status = "waiting"
  else if (action === "archive") patch.status = "archived"
  else throw new Error("Unsupported bulk engagement action")
  const { data, error } = await db.from("social_command_conversations").update(patch).in("id", ids).select("id")
  if (error) throw error
  return { updated: (data || []).length, action }
}

export async function replyToComment(commentId: string, messageValue: unknown, actorUserId: string) {
  const message = cleanString(messageValue, 20000)
  if (!message) throw new Error("Reply text is required")
  const db = await socialDb()
  const { data: comment, error } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (error || !comment) throw error || new Error("Comment not found")
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) throw new Error("No active Meta connection")
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken) throw new Error("Meta Page token is unavailable")
  const cfg = metaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${encodeURIComponent(comment.provider_comment_id)}/replies`)
  url.searchParams.set("access_token", pageToken)
  const payload = await graphJson(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) })
  await db.from("social_command_comments").update({ status: "answered", replied_at: nowIso(), updated_at: nowIso(), metadata: { ...(comment.metadata || {}), last_reply: payload, replied_by: actorUserId } }).eq("id", commentId)
  return { id: commentId, providerReplyId: cleanString(payload.id, 500) || null, status: "answered" }
}

export async function updateCommentState(commentId: string, input: Record<string, unknown>) {
  const db = await socialDb()
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  const status = cleanString(input.status, 60)
  if (["new","unanswered","priority","sensitive","answered","resolved"].includes(status)) {
    patch.status = status
    if (status === "resolved") patch.resolved_at = nowIso()
  }
  if (Object.prototype.hasOwnProperty.call(input, "assignedUserId")) patch.assigned_user_id = cleanString(input.assignedUserId, 200) || null
  const { data, error } = await db.from("social_command_comments").update(patch).eq("id", commentId).select("*").single()
  if (error || !data) throw error || new Error("Comment not found")
  return data as SocialComment
}

export function classifyConversationText(textValue: unknown) {
  const text = cleanString(textValue, 20000).toLocaleLowerCase("fr")
  const rules: Array<{ category: string; pattern: RegExp }> = [
    { category: "URGENT", pattern: /urgent|immédiat|vite|emergency|urgence|asap/ },
    { category: "COMPLAINT", pattern: /plainte|réclamation|mécontent|problème|mauvais|déçu|rembourse/ },
    { category: "PARTNERSHIP", pattern: /partenariat|partnership|collaboration|b2b|entreprise|école|crèche|hotel|hôtel/ },
    { category: "CAREER", pattern: /emploi|recrut|cv|travail|job|stage|academy|formation/ },
    { category: "SERVICE_INFORMATION", pattern: /prix|tarif|service|garde|nanny|montessori|activité|programme|disponib/ },
  ]
  for (const rule of rules) if (rule.pattern.test(text)) return { category: rule.category, source: "rules", confidence: 0.82 }
  return { category: "OTHER", source: "rules", confidence: 0.55 }
}
