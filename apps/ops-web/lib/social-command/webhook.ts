import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { metaConfig } from "@/lib/social-command/meta"

export type WebhookProcessResult = {
  accepted: boolean
  duplicate: boolean
  eventKey: string
  normalized: number
  kind: string
}

function secureEqualHex(left: string, right: string) {
  const a = Buffer.from(left, "hex")
  const b = Buffer.from(right, "hex")
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = metaConfig().appSecret
  if (!appSecret) return false
  const supplied = cleanString(signatureHeader, 256)
  if (!supplied.startsWith("sha256=")) return false
  const digest = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
  return secureEqualHex(digest, supplied.slice(7))
}

export function verifyWebhookChallenge(url: URL) {
  const mode = cleanString(url.searchParams.get("hub.mode"), 80)
  const token = cleanString(url.searchParams.get("hub.verify_token"), 500)
  const challenge = cleanString(url.searchParams.get("hub.challenge"), 5000)
  const expected = cleanString(process.env.SOCIAL_COMMAND_META_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN, 500)
  if (mode !== "subscribe" || !expected || token !== expected || !challenge) return null
  return challenge
}

function stableEventKey(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload)
  return crypto.createHash("sha256").update(raw).digest("hex")
}

function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
function objectArray(value: unknown): Record<string, unknown>[] { return asArray(value).map(jsonObject).filter((row) => Object.keys(row).length > 0) }
function isoFromProvider(value: unknown) {
  const n = Number(value || 0)
  if (Number.isFinite(n) && n > 0) {
    const millis = n < 10_000_000_000 ? n * 1000 : n
    const date = new Date(millis)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  const date = new Date(String(value || ""))
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString()
}

async function upsertConversation(input: {
  channel: "instagram" | "facebook"
  participantId: string
  username?: string | null
  name?: string | null
  preview?: string | null
  providerConversationId?: string | null
  receivedAt: string
}) {
  const db = await socialDb()
  const now = nowIso()
  const row = {
    channel: input.channel,
    participant_id: input.participantId,
    participant_username: input.username || null,
    participant_name: input.name || null,
    provider_conversation_id: input.providerConversationId || null,
    status: "open",
    unread_count: 1,
    last_message_at: input.receivedAt,
    last_message_preview: input.preview || null,
    updated_at: now,
  }
  const { data: existing, error: findError } = await db.from("social_command_conversations")
    .select("*").eq("channel", input.channel).eq("participant_id", input.participantId).maybeSingle()
  if (findError) throw findError
  if (existing) {
    const { data, error } = await db.from("social_command_conversations").update({
      ...row,
      status: existing.status === "resolved" || existing.status === "archived" ? "open" : existing.status,
      unread_count: Number(existing.unread_count || 0) + 1,
      first_received_at: existing.first_received_at || input.receivedAt,
    }).eq("id", existing.id).select("*").single()
    if (error) throw error
    return data
  }
  const { data, error } = await db.from("social_command_conversations").insert({
    id: crypto.randomUUID(), ...row, first_received_at: input.receivedAt, tags: [], metadata: {}, created_at: now,
  }).select("*").single()
  if (error) throw error
  return data
}

async function persistMessage(entryId: string, messageEvent: Record<string, unknown>) {
  const sender = jsonObject(messageEvent.sender)
  const recipient = jsonObject(messageEvent.recipient)
  const message = jsonObject(messageEvent.message)
  const postback = jsonObject(messageEvent.postback)
  const senderId = cleanString(sender.id, 300)
  const recipientId = cleanString(recipient.id, 300)
  if (!senderId && !recipientId) return 0
  const inbound = senderId && senderId !== entryId
  const participantId = inbound ? senderId : recipientId
  if (!participantId) return 0
  const text = cleanString(message.text || postback.title || postback.payload, 20000)
  const receivedAt = isoFromProvider(messageEvent.timestamp)
  const conversation = await upsertConversation({
    channel: "instagram", participantId, preview: text || "Pièce jointe Instagram", receivedAt,
  })
  const providerMessageId = cleanString(message.mid || postback.mid, 500) || null
  const db = await socialDb()
  if (providerMessageId) {
    const { data: exists, error: existsError } = await db.from("social_command_messages").select("id").eq("provider_message_id", providerMessageId).maybeSingle()
    if (existsError) throw existsError
    if (exists) return 0
  }
  const attachments = objectArray(message.attachments)
  const { error } = await db.from("social_command_messages").insert({
    id: crypto.randomUUID(), conversation_id: conversation.id, provider_message_id: providerMessageId,
    direction: inbound ? "inbound" : "outbound", sender_id: senderId || null, recipient_id: recipientId || null,
    sender_username: null, message_type: postback.payload ? "postback" : attachments.length ? "attachment" : "text",
    text, attachments, status: inbound ? "received" : "sent", sent_by_user_id: null,
    provider_timestamp: receivedAt, provider_payload: messageEvent, created_at: nowIso(), updated_at: nowIso(),
  })
  if (error) throw error
  if (inbound) {
    try {
      const automation = await import("@/lib/social-command/automation")
      await automation.evaluateInboundConversationAutomations(conversation.id)
    } catch { /* webhook ingestion remains authoritative even if automation evaluation fails */ }
  }
  return 1
}

async function persistSeen(entryId: string, messagingEvent: Record<string, unknown>) {
  const read = jsonObject(messagingEvent.read)
  const mid = cleanString(read.mid, 500)
  if (!mid) return 0
  const db = await socialDb()
  const { error } = await db.from("social_command_messages").update({ status: "read", updated_at: nowIso() }).eq("provider_message_id", mid)
  if (error) throw error
  return 1
}

async function persistComment(change: Record<string, unknown>) {
  const value = jsonObject(change.value)
  const providerCommentId = cleanString(value.id || value.comment_id, 500)
  if (!providerCommentId) return 0
  const from = jsonObject(value.from)
  const media = jsonObject(value.media)
  const db = await socialDb()
  const { data: existing, error: existingError } = await db.from("social_command_comments").select("id").eq("provider_comment_id", providerCommentId).maybeSingle()
  if (existingError) throw existingError
  if (existing) return 0
  const mediaId = cleanString(media.id || value.media_id, 500) || null
  let publicationId: string | null = null
  let campaignId: string | null = null
  if (mediaId) {
    const { data: providerResult } = await db.from("social_command_provider_results").select("publication_id").eq("provider_reference", mediaId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    publicationId = providerResult?.publication_id || null
    if (publicationId) {
      const { data: publication } = await db.from("social_command_publications").select("campaign_id").eq("id", publicationId).maybeSingle()
      campaignId = publication?.campaign_id || null
    }
  }
  const { error } = await db.from("social_command_comments").insert({
    id: crypto.randomUUID(), provider_comment_id: providerCommentId, channel: "instagram", media_id: mediaId,
    publication_id: publicationId, campaign_id: campaignId, commenter_id: cleanString(from.id, 300) || null,
    commenter_username: cleanString(from.username, 500) || null, text: cleanString(value.text, 20000),
    status: "unanswered", assigned_user_id: null, provider_created_at: isoFromProvider(value.created_time || value.timestamp),
    metadata: value, created_at: nowIso(), updated_at: nowIso(),
  })
  if (error) throw error
  return 1
}

async function persistMention(change: Record<string, unknown>) {
  const value = jsonObject(change.value)
  const providerMentionId = cleanString(value.id || value.comment_id || value.media_id, 500)
  if (!providerMentionId) return 0
  const from = jsonObject(value.from)
  const db = await socialDb()
  const { data: existing, error: existingError } = await db.from("social_command_mentions").select("id").eq("provider_mention_id", providerMentionId).maybeSingle()
  if (existingError) throw existingError
  if (existing) return 0
  const { error } = await db.from("social_command_mentions").insert({
    id: crypto.randomUUID(), provider_mention_id: providerMentionId, channel: "instagram",
    actor_id: cleanString(from.id || value.user_id, 300) || null, actor_username: cleanString(from.username, 500) || null,
    media_id: cleanString(value.media_id, 500) || null, text: cleanString(value.text, 20000) || null,
    status: "new", metadata: value, provider_created_at: isoFromProvider(value.created_time || value.timestamp),
    created_at: nowIso(), updated_at: nowIso(),
  })
  if (error) throw error
  return 1
}

export async function processMetaWebhookPayload(payload: Record<string, unknown>, rawBody: string): Promise<WebhookProcessResult> {
  const db = await socialDb()
  const receivedAt = nowIso()
  const eventKey = stableEventKey(payload)
  const deliveryId = crypto.randomUUID()
  await db.from("social_command_webhook_deliveries").insert({
    id: deliveryId, provider: "meta", event_key: eventKey, signature_valid: true, received_at: receivedAt,
    payload_bytes: Buffer.byteLength(rawBody, "utf8"), status: "received", metadata: {},
  })
  const { data: existing, error: existingError } = await db.from("social_command_webhook_events").select("id").eq("provider_event_key", eventKey).maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    await db.from("social_command_webhook_deliveries").update({ status: "duplicate", duplicate_event_id: existing.id, processed_at: nowIso() }).eq("id", deliveryId)
    return { accepted: true, duplicate: true, eventKey, normalized: 0, kind: "duplicate" }
  }
  const eventId = crypto.randomUUID()
  const { error: eventError } = await db.from("social_command_webhook_events").insert({
    id: eventId, provider: "meta", provider_event_key: eventKey, object_type: cleanString(payload.object, 80) || "unknown",
    event_type: "webhook", status: "processing", payload, received_at: receivedAt, created_at: receivedAt,
  })
  if (eventError) throw eventError

  let normalized = 0
  let kind = "unknown"
  try {
    for (const entry of objectArray(payload.entry)) {
      const entryId = cleanString(entry.id, 300)
      for (const messagingEvent of objectArray(entry.messaging)) {
        if (Object.keys(jsonObject(messagingEvent.message)).length || Object.keys(jsonObject(messagingEvent.postback)).length) {
          normalized += await persistMessage(entryId, messagingEvent); kind = "messages"
        }
        if (Object.keys(jsonObject(messagingEvent.read)).length) {
          normalized += await persistSeen(entryId, messagingEvent); kind = "messaging_seen"
        }
      }
      for (const change of objectArray(entry.changes)) {
        const field = cleanString(change.field, 120)
        if (field === "comments" || field === "live_comments") { normalized += await persistComment(change); kind = "comments" }
        else if (field === "mentions") { normalized += await persistMention(change); kind = "mentions" }
      }
    }
    const processedAt = nowIso()
    const latencyMs = Math.max(0, new Date(processedAt).getTime() - new Date(receivedAt).getTime())
    await db.from("social_command_webhook_events").update({ status: "processed", event_type: kind, normalized_count: normalized, processed_at: processedAt }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "processed", event_id: eventId, normalized_count: normalized, latency_ms: latencyMs, processed_at: processedAt }).eq("id", deliveryId)
    return { accepted: true, duplicate: false, eventKey, normalized, kind }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.from("social_command_webhook_events").update({ status: "failed", error_message: message, processed_at: nowIso() }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "failed", event_id: eventId, error_message: message, processed_at: nowIso() }).eq("id", deliveryId)
    throw error
  }
}

export async function recordWebhookVerification() {
  try {
    const db = await socialDb()
    const at = nowIso()
    await db.from("social_command_webhook_deliveries").insert({
      id: crypto.randomUUID(), provider: "meta", signature_valid: true, status: "verified", payload_bytes: 0,
      received_at: at, processed_at: at, latency_ms: 0, metadata: { kind: "verification_challenge" },
    })
  } catch { /* a valid challenge response must not fail because observability persistence is unavailable */ }
}

export async function recordRejectedWebhook(rawBody: string, reason: string) {
  try {
    const db = await socialDb()
    await db.from("social_command_webhook_deliveries").insert({
      id: crypto.randomUUID(), provider: "meta", signature_valid: false, received_at: nowIso(),
      payload_bytes: Buffer.byteLength(rawBody, "utf8"), status: "rejected", error_message: cleanString(reason, 2000), metadata: {},
    })
  } catch { /* rejection must not become an oracle */ }
}

export async function webhookHealth() {
  const db = await socialDb()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ data: latest }, { data: rows, error }, { data: verification }] = await Promise.all([
    db.from("social_command_webhook_deliveries").select("received_at,processed_at,status,latency_ms").neq("status", "verified").order("received_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("social_command_webhook_deliveries").select("status,received_at,processed_at,latency_ms").gte("received_at", since).limit(5000),
    db.from("social_command_webhook_deliveries").select("id,received_at").eq("status", "verified").order("received_at", { ascending: false }).limit(1).maybeSingle(),
  ])
  if (error) throw error
  const deliveries = rows || []
  const lastLatencyMs = latest?.latency_ms != null ? Number(latest.latency_ms) : latest?.processed_at && latest?.received_at ? Math.max(0, new Date(latest.processed_at).getTime() - new Date(latest.received_at).getTime()) : null
  const base = cleanString(process.env.SOCIAL_COMMAND_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL, 1000).replace(/\/+$/, "")
  const verifyTokenConfigured = Boolean(process.env.SOCIAL_COMMAND_META_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN)
  return {
    configured: Boolean(base && verifyTokenConfigured),
    verified: Boolean(verification?.id),
    lastEventAt: latest?.received_at || null,
    events24h: deliveries.filter((row: any) => row.status === "processed").length,
    rejected24h: deliveries.filter((row: any) => row.status === "rejected").length,
    duplicates24h: deliveries.filter((row: any) => row.status === "duplicate").length,
    failed24h: deliveries.filter((row: any) => row.status === "failed").length,
    lastLatencyMs,
    endpoint: base ? `${base}/api/social-command/meta/webhooks` : null,
  }
}
