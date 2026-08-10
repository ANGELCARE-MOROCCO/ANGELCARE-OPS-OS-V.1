import { processFacebookMetaWebhookPayloadMZ7 } from "@/lib/social-command/facebook-webhook-mz7"
import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { storedMetaWebhookSubscriptionSnapshot } from "@/lib/social-command/meta"

export type WebhookProcessResult = {
  accepted: boolean
  duplicate: boolean
  eventKey: string
  normalized: number
  kind: string
}

export type WebhookSignatureCheck = {
  valid: boolean
  reason: "valid" | "missing_signature" | "unsupported_signature_scheme" | "no_signing_secret" | "signature_mismatch"
  matchedSource: string | null
  candidateSources: string[]
  signaturePresent: boolean
  signatureFingerprint: string | null
}

type SigningCandidate = { source: string; secret: string }

function secureEqualHex(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false
  const a = Buffer.from(left, "hex")
  const b = Buffer.from(right, "hex")
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)
}

function parseSecretList(raw: string) {
  const trimmed = String(raw || "").trim()
  if (!trimmed) return [] as string[]
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.trim()).filter(Boolean)
  } catch {}
  return trimmed.split(/[\n;,]+/).map((value) => value.trim()).filter(Boolean)
}

function webhookSigningCandidates(): SigningCandidate[] {
  const candidates: SigningCandidate[] = []
  const push = (source: string, secret: string | undefined) => {
    const value = String(secret || "").trim()
    if (value) candidates.push({ source, secret: value })
  }
  push("SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRET", process.env.SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRET)
  push("SOCIAL_COMMAND_INSTAGRAM_APP_SECRET", process.env.SOCIAL_COMMAND_INSTAGRAM_APP_SECRET)
  push("INSTAGRAM_APP_SECRET", process.env.INSTAGRAM_APP_SECRET)
  parseSecretList(String(process.env.SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRETS || "")).forEach((secret, index) => push(`SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRETS[${index}]`, secret))
  push("META_APP_SECRET", process.env.META_APP_SECRET)
  push("FACEBOOK_APP_SECRET", process.env.FACEBOOK_APP_SECRET)
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const fingerprint = crypto.createHash("sha256").update(candidate.secret).digest("hex")
    if (seen.has(fingerprint)) return false
    seen.add(fingerprint)
    return true
  })
}

export function webhookSignatureConfiguration() {
  const candidates = webhookSigningCandidates()
  return {
    configured: candidates.length > 0,
    candidateCount: candidates.length,
    candidateSources: candidates.map((candidate) => candidate.source),
    dedicatedSigningSecretConfigured: candidates.some((candidate) => candidate.source === "SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRET"),
  }
}

export function verifyMetaWebhookSignatureDetailed(rawBody: string, signatureHeader: string | null): WebhookSignatureCheck {
  const candidates = webhookSigningCandidates()
  const supplied = cleanString(signatureHeader, 512)
  const fingerprint = supplied ? crypto.createHash("sha256").update(supplied).digest("hex").slice(0, 16) : null
  const base = {
    matchedSource: null,
    candidateSources: candidates.map((candidate) => candidate.source),
    signaturePresent: Boolean(supplied),
    signatureFingerprint: fingerprint,
  }
  if (!supplied) return { ...base, valid: false, reason: "missing_signature" }
  if (!supplied.startsWith("sha256=")) return { ...base, valid: false, reason: "unsupported_signature_scheme" }
  if (!candidates.length) return { ...base, valid: false, reason: "no_signing_secret" }
  const providedDigest = supplied.slice(7)
  for (const candidate of candidates) {
    const digest = crypto.createHmac("sha256", candidate.secret).update(rawBody, "utf8").digest("hex")
    if (secureEqualHex(digest, providedDigest)) return { ...base, valid: true, reason: "valid", matchedSource: candidate.source }
  }
  return { ...base, valid: false, reason: "signature_mismatch" }
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null) {
  return verifyMetaWebhookSignatureDetailed(rawBody, signatureHeader).valid
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
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
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
  const inbound = Boolean(senderId && senderId !== entryId)
  const participantId = inbound ? senderId : recipientId
  if (!participantId) return 0
  const providerMessageId = cleanString(message.mid || postback.mid, 500) || null
  const db = await socialDb()
  // Idempotency is checked before conversation counters are touched, making replays safe.
  if (providerMessageId) {
    const { data: exists, error: existsError } = await db.from("social_command_messages").select("id").eq("provider_message_id", providerMessageId).maybeSingle()
    if (existsError) throw existsError
    if (exists) return 0
  }
  const text = cleanString(message.text || postback.title || postback.payload, 20000)
  const receivedAt = isoFromProvider(messageEvent.timestamp)
  const conversation = await upsertConversation({
    channel: "instagram", participantId, preview: text || "Pièce jointe Instagram", receivedAt,
  })
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
  const db = await socialDb()
  if (mid) {
    const { error } = await db.from("social_command_messages").update({ status: "read", updated_at: nowIso() }).eq("provider_message_id", mid)
    if (error) throw error
    return 1
  }
  const sender = cleanString(jsonObject(messagingEvent.sender).id, 300)
  const watermark = Number(read.watermark || messagingEvent.timestamp || 0)
  if (!sender || !Number.isFinite(watermark) || watermark <= 0) return 0
  const { data: conversation, error: conversationError } = await db.from("social_command_conversations")
    .select("id").eq("channel", "instagram").eq("participant_id", sender).maybeSingle()
  if (conversationError) throw conversationError
  if (!conversation?.id) return 0
  const before = isoFromProvider(watermark)
  const { error } = await db.from("social_command_messages").update({ status: "read", updated_at: nowIso() })
    .eq("conversation_id", conversation.id).eq("direction", "outbound").in("status", ["queued", "sending", "sent"]).lte("provider_timestamp", before)
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

async function normalizeMetaDomainPayload(payload: Record<string, unknown>) {
  let normalized = 0
  const kinds = new Set<string>()
  for (const entry of objectArray(payload.entry)) {
    const entryId = cleanString(entry.id, 300)
    for (const messagingEvent of objectArray(entry.messaging)) {
      if (Object.keys(jsonObject(messagingEvent.message)).length || Object.keys(jsonObject(messagingEvent.postback)).length) {
        normalized += await persistMessage(entryId, messagingEvent)
        kinds.add(Object.keys(jsonObject(messagingEvent.postback)).length ? "messaging_postbacks" : "messages")
      }
      if (Object.keys(jsonObject(messagingEvent.read)).length) {
        normalized += await persistSeen(entryId, messagingEvent)
        kinds.add("messaging_seen")
      }
    }
    for (const change of objectArray(entry.changes)) {
      const field = cleanString(change.field, 120)
      if (field === "comments" || field === "live_comments") { normalized += await persistComment(change); kinds.add(field) }
      else if (field === "mentions") { normalized += await persistMention(change); kinds.add("mentions") }
    }
  }
  const kind = kinds.size === 0 ? "unknown" : kinds.size === 1 ? [...kinds][0] : "mixed"
  return { normalized, kind, kinds: [...kinds] }
}

async function processMetaWebhookPayloadBeforeMZ7(payload: Record<string, unknown>, rawBody: string, signature?: WebhookSignatureCheck): Promise<WebhookProcessResult> {
  const db = await socialDb()
  const receivedAt = nowIso()
  const eventKey = stableEventKey(payload)
  const deliveryId = crypto.randomUUID()
  const metadata = signature ? { signature: { matchedSource: signature.matchedSource, candidateSources: signature.candidateSources, fingerprint: signature.signatureFingerprint } } : {}
  await db.from("social_command_webhook_deliveries").insert({
    id: deliveryId, provider: "meta", event_key: eventKey, signature_valid: true, received_at: receivedAt,
    payload_bytes: Buffer.byteLength(rawBody, "utf8"), status: "received", metadata,
  })
  const { data: existing, error: existingError } = await db.from("social_command_webhook_events").select("id").eq("provider_event_key", eventKey).maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    await db.from("social_command_webhook_deliveries").update({ status: "duplicate", duplicate: true, duplicate_event_id: existing.id, processed_at: nowIso() }).eq("id", deliveryId)
    return { accepted: true, duplicate: true, eventKey, normalized: 0, kind: "duplicate" }
  }
  const eventId = crypto.randomUUID()
  const { error: eventError } = await db.from("social_command_webhook_events").insert({
    id: eventId, delivery_id: deliveryId, provider: "meta", provider_event_key: eventKey, object_type: cleanString(payload.object, 80) || "unknown",
    event_type: "webhook", status: "processing", payload, received_at: receivedAt, created_at: receivedAt,
  })
  if (eventError) throw eventError
  try {
    const result = await normalizeMetaDomainPayload(payload)
    const processedAt = nowIso()
    const latencyMs = Math.max(0, new Date(processedAt).getTime() - new Date(receivedAt).getTime())
    await db.from("social_command_webhook_events").update({ status: "processed", event_type: result.kind, normalized_count: result.normalized, processed_at: processedAt, error_message: null }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "processed", event_id: eventId, normalized_count: result.normalized, latency_ms: latencyMs, processed_at: processedAt }).eq("id", deliveryId)
    return { accepted: true, duplicate: false, eventKey, normalized: result.normalized, kind: result.kind }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.from("social_command_webhook_events").update({ status: "failed", error_message: message, processed_at: nowIso() }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "failed", event_id: eventId, error_message: message, processed_at: nowIso() }).eq("id", deliveryId)
    throw error
  }
}

export async function replayMetaWebhookEvent(eventId: string) {
  const db = await socialDb()
  const { data: event, error } = await db.from("social_command_webhook_events").select("*").eq("id", eventId).maybeSingle()
  if (error) throw error
  if (!event) throw new Error("Webhook event not found")
  if (event.status !== "failed") throw new Error("Only failed, signature-verified webhook events can be replayed")
  const payload = jsonObject(event.payload)
  if (!Object.keys(payload).length) throw new Error("Webhook event payload is unavailable")
  const deliveryId = crypto.randomUUID()
  const startedAt = nowIso()
  await db.from("social_command_webhook_deliveries").insert({
    id: deliveryId, provider: "meta", event_key: event.provider_event_key, signature_valid: true, status: "replay",
    payload_bytes: Buffer.byteLength(JSON.stringify(payload), "utf8"), received_at: startedAt, metadata: { replayOfEventId: eventId },
  })
  try {
    await db.from("social_command_webhook_events").update({ status: "processing", error_message: null, processed_at: null }).eq("id", eventId)
    const result = await normalizeMetaDomainPayload(payload)
    const processedAt = nowIso()
    const latencyMs = Math.max(0, new Date(processedAt).getTime() - new Date(startedAt).getTime())
    await db.from("social_command_webhook_events").update({ status: "processed", event_type: result.kind, normalized_count: result.normalized, processed_at: processedAt, error_message: null }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "processed", event_id: eventId, normalized_count: result.normalized, latency_ms: latencyMs, processed_at: processedAt }).eq("id", deliveryId)
    return { eventId, deliveryId, status: "processed", ...result }
  } catch (replayError) {
    const message = replayError instanceof Error ? replayError.message : String(replayError)
    await db.from("social_command_webhook_events").update({ status: "failed", error_message: message, processed_at: nowIso() }).eq("id", eventId)
    await db.from("social_command_webhook_deliveries").update({ status: "failed", event_id: eventId, error_message: message, processed_at: nowIso() }).eq("id", deliveryId)
    throw replayError
  }
}

export async function runWebhookSignatureSelfTest() {
  const candidates = webhookSigningCandidates()
  if (!candidates.length) return { ok: false, reason: "no_signing_secret", configuration: webhookSignatureConfiguration() }
  const payload = { object: "instagram", entry: [{ id: "social-command-self-test", time: Date.now(), changes: [] }] }
  const rawBody = JSON.stringify(payload)
  const signature = `sha256=${crypto.createHmac("sha256", candidates[0].secret).update(rawBody, "utf8").digest("hex")}`
  const result = verifyMetaWebhookSignatureDetailed(rawBody, signature)
  try {
    const db = await socialDb()
    const at = nowIso()
    await db.from("social_command_webhook_deliveries").insert({
      id: crypto.randomUUID(), provider: "meta", signature_valid: result.valid, status: "self_test", payload_bytes: Buffer.byteLength(rawBody, "utf8"),
      received_at: at, processed_at: at, latency_ms: 0, metadata: { kind: "signature_self_test", result: { ...result, candidateSources: result.candidateSources } },
    })
  } catch {}
  return { ok: result.valid, result, configuration: webhookSignatureConfiguration() }
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

export async function recordRejectedWebhook(rawBody: string, reason: string, diagnostics?: WebhookSignatureCheck | Record<string, unknown>) {
  try {
    const db = await socialDb()
    const bodyHash = crypto.createHash("sha256").update(rawBody, "utf8").digest("hex")
    const safeDiagnostics = diagnostics && "candidateSources" in diagnostics
      ? {
          reason: (diagnostics as WebhookSignatureCheck).reason,
          matchedSource: (diagnostics as WebhookSignatureCheck).matchedSource,
          candidateSources: (diagnostics as WebhookSignatureCheck).candidateSources,
          signaturePresent: (diagnostics as WebhookSignatureCheck).signaturePresent,
          signatureFingerprint: (diagnostics as WebhookSignatureCheck).signatureFingerprint,
        }
      : jsonObject(diagnostics)
    await db.from("social_command_webhook_deliveries").insert({
      id: crypto.randomUUID(), provider: "meta", signature_valid: false, received_at: nowIso(),
      payload_bytes: Buffer.byteLength(rawBody, "utf8"), status: "rejected", error_message: cleanString(reason, 2000),
      metadata: { bodySha256: bodyHash, diagnostics: safeDiagnostics },
    })
  } catch { /* rejection must not become an oracle */ }
}

export async function webhookHealth() {
  const db = await socialDb()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ data: latest }, { data: rows, error }, { data: verification }, { data: activeConnection }, { data: failedEvents }] = await Promise.all([
    db.from("social_command_webhook_deliveries").select("received_at,processed_at,status,latency_ms,error_message,metadata").neq("status", "verified").neq("status", "self_test").order("received_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("social_command_webhook_deliveries").select("status,received_at,processed_at,latency_ms,error_message,metadata").gte("received_at", since).limit(5000),
    db.from("social_command_webhook_deliveries").select("id,received_at").eq("status", "verified").order("received_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("social_command_connections").select("id,meta_json").eq("status", "connected").order("connected_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("social_command_webhook_events").select("id,event_type,error_message,received_at").eq("status", "failed").order("received_at", { ascending: false }).limit(10),
  ])
  if (error) throw error
  const deliveries = rows || []
  const lastLatencyMs = latest?.latency_ms != null ? Number(latest.latency_ms) : latest?.processed_at && latest?.received_at ? Math.max(0, new Date(latest.processed_at).getTime() - new Date(latest.received_at).getTime()) : null
  const base = cleanString(process.env.SOCIAL_COMMAND_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL, 1000).replace(/\/+$/, "")
  const verifyTokenConfigured = Boolean(process.env.SOCIAL_COMMAND_META_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN)
  const rejected = deliveries.filter((row: any) => row.status === "rejected")
  const rejectionCounts = rejected.reduce((acc: Record<string, number>, row: any) => {
    const reason = cleanString(row.error_message, 200) || "unknown"
    acc[reason] = (acc[reason] || 0) + 1
    return acc
  }, {})
  const lastRejected = rejected.sort((a: any, b: any) => String(b.received_at).localeCompare(String(a.received_at)))[0] || null
  const subscriptionSnapshot = activeConnection ? storedMetaWebhookSubscriptionSnapshot(activeConnection) : {}
  return {
    configured: Boolean(base && verifyTokenConfigured),
    verified: Boolean(verification?.id),
    lastEventAt: latest?.received_at || null,
    events24h: deliveries.filter((row: any) => row.status === "processed").length,
    rejected24h: rejected.length,
    duplicates24h: deliveries.filter((row: any) => row.status === "duplicate").length,
    failed24h: deliveries.filter((row: any) => row.status === "failed").length,
    lastLatencyMs,
    endpoint: base ? `${base}/api/social-command/meta/webhooks` : null,
    signature: {
      ...webhookSignatureConfiguration(),
      lastRejectionReason: cleanString(lastRejected?.error_message, 300) || null,
      lastRejectionAt: lastRejected?.received_at || null,
      rejectionCounts,
      lastDiagnostics: jsonObject(jsonObject(lastRejected?.metadata).diagnostics),
    },
    subscriptions: Object.keys(subscriptionSnapshot).length ? subscriptionSnapshot : { state: "not_inspected", expectedFields: [], subscribedFields: [], missingFields: [] },
    replayableEvents: (failedEvents || []).map((row: any) => ({ id: row.id, eventType: row.event_type, error: row.error_message || null, receivedAt: row.received_at })),
  }
}

// SOCIAL_COMMAND_MZ7_FACEBOOK_WEBHOOK_WRAPPER
// Facebook Page payloads are handled by the MZ7 provider processor. Every
// non-Facebook payload is delegated byte-for-byte to the pre-MZ7 hardened
// processor above. No dependency on its internal variable names or loop shape.
export async function processMetaWebhookPayload(payload: Record<string, unknown>, rawBody: string) {
  if (String(payload.object || "").trim().toLowerCase() === "page") {
    return processFacebookMetaWebhookPayloadMZ7(payload, rawBody)
  }
  return processMetaWebhookPayloadBeforeMZ7(payload, rawBody)
}
