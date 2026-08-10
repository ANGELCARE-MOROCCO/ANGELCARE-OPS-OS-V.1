import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { bindEntityToRelationshipMZ7, ensureRelationshipIdentityMZ7, recordJourneyEventMZ7 } from "@/lib/social-command/relationship-mz7"

function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.map(jsonObject).filter(x => Object.keys(x).length) : [] }
function providerIso(value: unknown) {
  const n = Number(value || 0)
  if (Number.isFinite(n) && n > 0) { const d = new Date(n < 10_000_000_000 ? n * 1000 : n); if (!Number.isNaN(d.getTime())) return d.toISOString() }
  const d = new Date(String(value || "")); return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString()
}
function sourceForPayload(value: Record<string, unknown>) { return value.__mz7_source === "historical_sync" ? "historical_sync" as const : "webhook_live" as const }

async function findPublicationContext(providerPostId: string | null) {
  if (!providerPostId) return { publicationId: null as string | null, campaignId: null as string | null }
  const db = await socialDb()
  const { data: providerResult } = await db.from("social_command_provider_results").select("publication_id").eq("provider_reference", providerPostId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  const publicationId = providerResult?.publication_id || null
  if (!publicationId) return { publicationId: null, campaignId: null }
  const { data: publication } = await db.from("social_command_publications").select("campaign_id").eq("id", publicationId).maybeSingle()
  return { publicationId, campaignId: publication?.campaign_id || null }
}

async function upsertFacebookConversationMZ7(input: { pageId: string; participantId: string; preview: string; receivedAt: string; providerConversationId?: string | null; sourceKind?: "webhook_live" | "historical_sync"; profile?: { name?: string | null; username?: string | null; picture?: string | null } }) {
  const db = await socialDb(), now = nowIso()
  const identity = await ensureRelationshipIdentityMZ7({
    provider: "facebook", providerUserId: input.participantId, providerAccountId: input.pageId,
    displayName: input.profile?.name || null, username: input.profile?.username || null, profilePictureUrl: input.profile?.picture || null,
    evidence: { source: input.sourceKind || "webhook_live" }, firstSeenAt: input.receivedAt, lastSeenAt: input.receivedAt,
  })
  const { data: existing, error: findError } = await db.from("social_command_conversations").select("*").eq("channel", "facebook").eq("participant_id", input.participantId).maybeSingle()
  if (findError) throw findError
  const common = {
    provider_conversation_id: cleanString(input.providerConversationId, 500) || existing?.provider_conversation_id || null,
    participant_username: cleanString(input.profile?.username, 500) || existing?.participant_username || null,
    participant_name: cleanString(input.profile?.name, 500) || existing?.participant_name || null,
    participant_profile_picture_url: cleanString(input.profile?.picture, 3000) || existing?.participant_profile_picture_url || null,
    relationship_contact_id: identity.relationship_contact_id,
    provider_account_id: input.pageId,
    source_kind: input.sourceKind || "webhook_live",
    last_message_at: input.receivedAt,
    last_message_preview: input.preview || existing?.last_message_preview || null,
    messaging_window_expires_at: new Date(new Date(input.receivedAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now,
  }
  if (existing) {
    const { data, error } = await db.from("social_command_conversations").update({
      ...common,
      status: ["resolved","archived"].includes(existing.status) ? "open" : existing.status,
      unread_count: Number(existing.unread_count || 0) + 1,
    }).eq("id", existing.id).select("*").single()
    if (error) throw error
    return { conversation: data, identity }
  }
  const id = crypto.randomUUID()
  const { data, error } = await db.from("social_command_conversations").insert({
    id, channel: "facebook", participant_id: input.participantId, status: "open", priority: "normal", unread_count: 1,
    first_received_at: input.receivedAt, first_response_at: null, resolved_at: null, due_at: null, tags: [], metadata: {}, created_at: now,
    ...common,
  }).select("*").single()
  if (error) throw error
  await recordJourneyEventMZ7({ contactId: identity.relationship_contact_id, providerIdentityId: identity.id, provider: "facebook", entityType: "conversation", entityId: id, kind: "facebook.messenger.conversation_started", source: input.sourceKind || "webhook_live", title: "Conversation Messenger", summary: input.preview, occurredAt: input.receivedAt, providerReference: input.providerConversationId || input.participantId })
  return { conversation: data, identity }
}

async function persistFacebookMessageMZ7(pageId: string, event: Record<string, unknown>, sourceKind: "webhook_live" | "historical_sync" = "webhook_live") {
  const sender = jsonObject(event.sender), recipient = jsonObject(event.recipient), message = jsonObject(event.message), postback = jsonObject(event.postback)
  const senderId = cleanString(sender.id, 500), recipientId = cleanString(recipient.id, 500)
  const inbound = Boolean(senderId && senderId !== pageId)
  const participantId = inbound ? senderId : recipientId
  if (!participantId) return 0
  const attachments = arr(message.attachments)
  const text = cleanString(message.text || postback.title || postback.payload, 20000)
  const receivedAt = providerIso(event.timestamp || message.created_time)
  const { conversation, identity } = await upsertFacebookConversationMZ7({ pageId, participantId, preview: text || (attachments.length ? "Pièce jointe Messenger" : "Événement Messenger"), receivedAt, providerConversationId: cleanString(event.conversation_id || event.thread_id, 500) || null, sourceKind })
  const providerMessageId = cleanString(message.mid || message.id || postback.mid, 500) || null
  const db = await socialDb()
  if (providerMessageId) {
    const { data: exists, error } = await db.from("social_command_messages").select("id").eq("provider_message_id", providerMessageId).maybeSingle()
    if (error) throw error
    if (exists) return 0
  }
  const id = crypto.randomUUID()
  const messageType = postback.payload ? "postback" : attachments.length ? "attachment" : message.is_echo ? "echo" : "text"
  const { error } = await db.from("social_command_messages").insert({
    id, conversation_id: conversation.id, provider_message_id: providerMessageId, direction: inbound ? "inbound" : "outbound",
    sender_id: senderId || null, recipient_id: recipientId || null, sender_username: null, message_type: messageType,
    text, attachments, status: inbound ? "received" : "sent", sent_by_user_id: null, provider_timestamp: receivedAt,
    provider_payload: event, source_kind: sourceKind, provider_state: message.is_echo ? "echo_observed" : inbound ? "received" : "provider_observed",
    created_at: nowIso(), updated_at: nowIso(),
  })
  if (error) throw error
  await recordJourneyEventMZ7({ contactId: identity.relationship_contact_id, providerIdentityId: identity.id, provider: "facebook", entityType: "message", entityId: id, kind: inbound ? "facebook.messenger.inbound" : message.is_echo ? "facebook.messenger.echo" : "facebook.messenger.outbound_observed", source: sourceKind, title: inbound ? "Message Messenger reçu" : "Message Messenger observé", summary: text || messageType, occurredAt: receivedAt, providerReference: providerMessageId, payload: event })
  return 1
}

async function persistFacebookReadMZ7(pageId: string, event: Record<string, unknown>) {
  const read = jsonObject(event.read), sender = jsonObject(event.sender)
  const participantId = cleanString(sender.id, 500)
  const watermark = Number(read.watermark || 0)
  if (!participantId || !watermark) return 0
  const db = await socialDb(), readAt = providerIso(watermark)
  const { data: conversation } = await db.from("social_command_conversations").select("id,relationship_contact_id").eq("channel", "facebook").eq("participant_id", participantId).maybeSingle()
  if (!conversation) return 0
  await db.from("social_command_messages").update({ status: "read", provider_state: "read_by_customer", updated_at: nowIso() }).eq("conversation_id", conversation.id).eq("direction", "outbound").lte("provider_timestamp", readAt)
  await recordJourneyEventMZ7({ contactId: conversation.relationship_contact_id || null, provider: "facebook", entityType: "conversation", entityId: conversation.id, kind: "facebook.messenger.read", source: "webhook_live", title: "Lecture Messenger observée", occurredAt: readAt, providerReference: participantId, payload: event })
  return 1
}

async function persistFacebookDeliveryMZ7(event: Record<string, unknown>) {
  const delivery = jsonObject(event.delivery), mids = Array.isArray(delivery.mids) ? delivery.mids.map(x => cleanString(x, 500)).filter(Boolean) : []
  if (!mids.length) return 0
  const db = await socialDb()
  const { error } = await db.from("social_command_messages").update({ provider_state: "delivered", updated_at: nowIso() }).in("provider_message_id", mids)
  if (error) throw error
  return mids.length
}

async function persistFacebookAuxEventMZ7(pageId: string, event: Record<string, unknown>) {
  const sender = jsonObject(event.sender), recipient = jsonObject(event.recipient)
  const participantId = cleanString(sender.id, 500) !== pageId ? cleanString(sender.id, 500) : cleanString(recipient.id, 500)
  if (!participantId) return 0
  const db = await socialDb()
  const { data: conversation } = await db.from("social_command_conversations").select("id,relationship_contact_id").eq("channel", "facebook").eq("participant_id", participantId).maybeSingle()
  const kind = Object.keys(event).find(k => ["reaction","message_reaction","message_edit","edit","referral","postback","policy_enforcement","standby","optin","account_linking"].includes(k)) || (jsonObject(event.message).is_echo ? "message_echo" : "messenger_event")
  await recordJourneyEventMZ7({ contactId: conversation?.relationship_contact_id || null, provider: "facebook", entityType: "provider_event", entityId: conversation?.id || null, kind: `facebook.${kind}`, source: "webhook_live", title: "Événement Messenger", summary: kind.replace(/_/g," "), occurredAt: providerIso(event.timestamp), providerReference: participantId, payload: event })
  return 1
}

async function persistFacebookCommentChangeMZ7(pageId: string, change: Record<string, unknown>, sourceKind: "webhook_live" | "historical_sync" = "webhook_live") {
  const value = jsonObject(change.value)
  const item = cleanString(value.item, 80)
  const verb = cleanString(value.verb, 80) || "add"
  const providerCommentId = cleanString(value.comment_id || value.id, 500)
  if (!providerCommentId || (item && item !== "comment")) return 0
  const providerPostId = cleanString(value.post_id || value.parent_id || value.media_id, 500) || null
  const authorId = cleanString(value.sender_id || jsonObject(value.from).id, 500) || null
  const authorName = cleanString(value.sender_name || jsonObject(value.from).name, 500) || null
  const message = cleanString(value.message || value.text, 20000)
  const occurredAt = providerIso(value.created_time || value.timestamp)
  const db = await socialDb()
  const { data: existing, error: existsError } = await db.from("social_command_comments").select("*").eq("provider_comment_id", providerCommentId).maybeSingle()
  if (existsError) throw existsError
  if (verb === "remove" || verb === "delete" || value.is_hidden === true && value.deleted === true) {
    if (existing) {
      await db.from("social_command_comments").update({ provider_state: "deleted_on_facebook", metadata: { ...jsonObject(existing.metadata), last_provider_event: value }, updated_at: nowIso() }).eq("id", existing.id)
      await recordJourneyEventMZ7({ contactId: existing.relationship_contact_id || null, provider: "facebook", entityType: "comment", entityId: existing.id, kind: "facebook.comment.provider_deleted", source: sourceKind, title: "Commentaire supprimé sur Facebook", summary: existing.text || null, occurredAt, providerReference: providerCommentId, payload: value })
    }
    return existing ? 1 : 0
  }
  if (existing) {
    if (verb === "edited" || verb === "edit") {
      await db.from("social_command_comments").update({ text: message || existing.text, metadata: { ...jsonObject(existing.metadata), last_provider_event: value }, provider_state: "edited_on_facebook", updated_at: nowIso() }).eq("id", existing.id)
      await recordJourneyEventMZ7({ contactId: existing.relationship_contact_id || null, provider: "facebook", entityType: "comment", entityId: existing.id, kind: "facebook.comment.edited", source: sourceKind, title: "Commentaire Facebook modifié", summary: message || existing.text, occurredAt, providerReference: providerCommentId, payload: value })
      return 1
    }
    return 0
  }
  const context = await findPublicationContext(providerPostId)
  const id = crypto.randomUUID()
  let identity: any = null
  if (authorId) identity = await ensureRelationshipIdentityMZ7({ provider: "facebook", providerUserId: authorId, providerAccountId: pageId, displayName: authorName, evidence: { comment: value }, firstSeenAt: occurredAt, lastSeenAt: occurredAt })
  const row = {
    id, provider_comment_id: providerCommentId, channel: "facebook", media_id: providerPostId,
    provider_post_id: providerPostId, parent_comment_id: cleanString(value.parent_id, 500) || null,
    publication_id: context.publicationId, campaign_id: context.campaignId,
    commenter_id: authorId, commenter_username: authorName, text: message,
    status: "unanswered", assigned_user_id: null, provider_created_at: occurredAt,
    relationship_contact_id: identity?.relationship_contact_id || null, source_kind: sourceKind, provider_state: "visible",
    metadata: value, created_at: nowIso(), updated_at: nowIso(),
  }
  const { error } = await db.from("social_command_comments").insert(row)
  if (error) throw error
  if (identity) await bindEntityToRelationshipMZ7({ entityType: "comment", entityId: id, contactId: identity.relationship_contact_id, sourceKind })
  await recordJourneyEventMZ7({ contactId: identity?.relationship_contact_id || null, providerIdentityId: identity?.id || null, provider: "facebook", entityType: "comment", entityId: id, kind: "facebook.comment.received", source: sourceKind, title: "Commentaire Facebook", summary: message, occurredAt, providerReference: providerCommentId, payload: { postId: providerPostId, value } })
  return 1
}

export async function normalizeFacebookWebhookPayloadMZ7(payload: Record<string, unknown>) {
  let normalized = 0
  const kinds = new Set<string>()
  for (const entry of arr(payload.entry)) {
    const pageId = cleanString(entry.id, 500)
    for (const event of arr(entry.messaging)) {
      const message = jsonObject(event.message)
      if (Object.keys(message).length || Object.keys(jsonObject(event.postback)).length) { normalized += await persistFacebookMessageMZ7(pageId, event); kinds.add(message.is_echo ? "message_echoes" : "messages") }
      if (Object.keys(jsonObject(event.read)).length) { normalized += await persistFacebookReadMZ7(pageId, event); kinds.add("message_reads") }
      if (Object.keys(jsonObject(event.delivery)).length) { normalized += await persistFacebookDeliveryMZ7(event); kinds.add("message_deliveries") }
      const hasAux = Object.keys(event).some(k => ["reaction","message_reaction","message_edit","edit","referral","policy_enforcement","standby","optin","account_linking"].includes(k))
      if (hasAux) { normalized += await persistFacebookAuxEventMZ7(pageId, event); kinds.add("messenger_events") }
    }
    for (const change of arr(entry.changes)) {
      const field = cleanString(change.field, 120)
      if (field === "feed" || field === "comments") { normalized += await persistFacebookCommentChangeMZ7(pageId, change); kinds.add("facebook_comments") }
      else if (["messages","message_echoes","message_reads","message_reactions","message_edits","messaging_postbacks","messaging_referrals","messaging_policy_enforcement","standby"].includes(field)) {
        await recordJourneyEventMZ7({ provider: "facebook", entityType: "provider_event", kind: `facebook.page.${field}`, source: "webhook_live", title: "Signal Facebook Page", summary: field, occurredAt: nowIso(), providerReference: pageId, payload: change }); normalized += 1; kinds.add(field)
      }
    }
  }
  return { normalized, kind: kinds.size === 1 ? [...kinds][0] : kinds.size ? `facebook:${[...kinds].join(",")}` : "facebook:unknown" }
}

export { persistFacebookMessageMZ7, persistFacebookCommentChangeMZ7 }

/**
 * MZ7 Facebook-specific webhook processing envelope.
 *
 * Signature verification remains owned by the existing Social Command route/MZ3
 * hardened verifier before this function is invoked. This function owns Page
 * payload deduplication, evidence persistence, normalization and delivery status
 * without depending on Instagram/MZ3 processor internals.
 */
export async function processFacebookMetaWebhookPayloadMZ7(payload: Record<string, unknown>, rawBody: string) {
  const db = await socialDb()
  const receivedAt = nowIso()
  const digest = crypto.createHash("sha256").update(rawBody || JSON.stringify(payload), "utf8").digest("hex")
  const eventKey = `facebook:mz7:${digest}`
  const deliveryId = crypto.randomUUID()

  const { error: deliveryInsertError } = await db.from("social_command_webhook_deliveries").insert({
    id: deliveryId,
    provider: "meta",
    event_key: eventKey,
    signature_valid: true,
    received_at: receivedAt,
    payload_bytes: Buffer.byteLength(rawBody || JSON.stringify(payload), "utf8"),
    status: "received",
    metadata: { provider_surface: "facebook", mz7: true },
  })
  if (deliveryInsertError) throw deliveryInsertError

  const { data: existing, error: existingError } = await db.from("social_command_webhook_events")
    .select("id")
    .eq("provider_event_key", eventKey)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    await db.from("social_command_webhook_deliveries").update({
      status: "duplicate",
      duplicate_event_id: existing.id,
      processed_at: nowIso(),
      metadata: { provider_surface: "facebook", mz7: true, duplicate: true },
    }).eq("id", deliveryId)
    return { accepted: true, duplicate: true, eventKey, normalized: 0, kind: "duplicate" }
  }

  const eventId = crypto.randomUUID()
  const { error: eventInsertError } = await db.from("social_command_webhook_events").insert({
    id: eventId,
    provider: "meta",
    provider_event_key: eventKey,
    object_type: "page",
    event_type: "facebook:webhook",
    status: "processing",
    payload,
    received_at: receivedAt,
    created_at: receivedAt,
  })
  if (eventInsertError) throw eventInsertError

  try {
    const facebook = await normalizeFacebookWebhookPayloadMZ7(payload)
    const processedAt = nowIso()
    const latencyMs = Math.max(0, new Date(processedAt).getTime() - new Date(receivedAt).getTime())
    await db.from("social_command_webhook_events").update({
      status: "processed",
      event_type: facebook.kind,
      normalized_count: facebook.normalized,
      processed_at: processedAt,
    }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({
      status: "processed",
      event_id: eventId,
      normalized_count: facebook.normalized,
      latency_ms: latencyMs,
      processed_at: processedAt,
      metadata: { provider_surface: "facebook", mz7: true, kind: facebook.kind },
    }).eq("id", deliveryId)
    return { accepted: true, duplicate: false, eventKey, normalized: facebook.normalized, kind: facebook.kind }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const processedAt = nowIso()
    await db.from("social_command_webhook_events").update({ status: "failed", error_message: message, processed_at: processedAt }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({
      status: "failed",
      event_id: eventId,
      error_message: message,
      processed_at: processedAt,
      metadata: { provider_surface: "facebook", mz7: true },
    }).eq("id", deliveryId)
    throw error
  }
}
