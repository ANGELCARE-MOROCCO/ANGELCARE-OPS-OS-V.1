import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"

export type MZ7Provider = "instagram" | "facebook"
export type MZ7EntityType = "conversation" | "comment" | "mention" | "contact" | "message" | "provider_event"
export type MZ7JourneySource = "webhook_live" | "historical_sync" | "operator" | "automation" | "meta_test" | "provider_reconciliation"

export type MZ7RelationshipIdentityInput = {
  provider: MZ7Provider
  providerUserId: string
  providerAccountId?: string | null
  username?: string | null
  displayName?: string | null
  profilePictureUrl?: string | null
  evidence?: Record<string, unknown>
  firstSeenAt?: string | null
  lastSeenAt?: string | null
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function recordJourneyEventMZ7(input: {
  contactId?: string | null
  provider?: MZ7Provider | null
  providerIdentityId?: string | null
  entityType: MZ7EntityType
  entityId?: string | null
  kind: string
  source: MZ7JourneySource
  title?: string | null
  summary?: string | null
  occurredAt?: string | null
  actorUserId?: string | null
  providerReference?: string | null
  payload?: Record<string, unknown>
}) {
  const db = await socialDb()
  const row = {
    id: crypto.randomUUID(),
    relationship_contact_id: cleanString(input.contactId, 120) || null,
    provider_identity_id: cleanString(input.providerIdentityId, 120) || null,
    provider: input.provider || null,
    entity_type: cleanString(input.entityType, 80),
    entity_id: cleanString(input.entityId, 160) || null,
    event_kind: cleanString(input.kind, 120),
    source_kind: input.source,
    title: cleanString(input.title, 260) || null,
    summary: cleanString(input.summary, 4000) || null,
    actor_user_id: cleanString(input.actorUserId, 160) || null,
    provider_reference: cleanString(input.providerReference, 500) || null,
    occurred_at: cleanString(input.occurredAt, 100) || nowIso(),
    payload: input.payload || {},
    created_at: nowIso(),
  }
  const { error } = await db.from("social_command_journey_events").insert(row)
  if (error) throw error
  return row
}

export async function ensureRelationshipIdentityMZ7(input: MZ7RelationshipIdentityInput) {
  const providerUserId = cleanString(input.providerUserId, 500)
  if (!providerUserId) throw new Error("Provider-scoped identity is required")
  const provider = input.provider
  const db = await socialDb()
  const { data: existingIdentity, error: identityError } = await db.from("social_command_relationship_identities")
    .select("*").eq("provider", provider).eq("provider_user_id", providerUserId).maybeSingle()
  if (identityError) throw identityError
  const now = nowIso()
  if (existingIdentity) {
    const evidence = { ...safeRecord(existingIdentity.evidence), ...(input.evidence || {}) }
    const patch = {
      provider_account_id: cleanString(input.providerAccountId, 500) || existingIdentity.provider_account_id || null,
      username: cleanString(input.username, 500) || existingIdentity.username || null,
      display_name: cleanString(input.displayName, 500) || existingIdentity.display_name || null,
      profile_picture_url: cleanString(input.profilePictureUrl, 3000) || existingIdentity.profile_picture_url || null,
      last_seen_at: cleanString(input.lastSeenAt, 100) || now,
      evidence,
      updated_at: now,
    }
    const { data, error } = await db.from("social_command_relationship_identities").update(patch).eq("id", existingIdentity.id).select("*").single()
    if (error) throw error
    await db.from("social_command_relationship_contacts").update({
      display_name: patch.display_name || patch.username || undefined,
      last_seen_at: patch.last_seen_at,
      updated_at: now,
    }).eq("id", existingIdentity.relationship_contact_id)
    return data
  }

  const contactId = crypto.randomUUID()
  const identityId = crypto.randomUUID()
  const display = cleanString(input.displayName, 500) || cleanString(input.username, 500) || null
  const firstSeen = cleanString(input.firstSeenAt, 100) || cleanString(input.lastSeenAt, 100) || now
  const { error: contactError } = await db.from("social_command_relationship_contacts").insert({
    id: contactId,
    display_name: display,
    relationship_state: "active",
    first_seen_at: firstSeen,
    last_seen_at: cleanString(input.lastSeenAt, 100) || firstSeen,
    current_owner_user_id: null,
    tags: [],
    metadata: {},
    created_at: now,
    updated_at: now,
  })
  if (contactError) throw contactError
  const identity = {
    id: identityId,
    relationship_contact_id: contactId,
    provider,
    provider_user_id: providerUserId,
    provider_account_id: cleanString(input.providerAccountId, 500) || null,
    username: cleanString(input.username, 500) || null,
    display_name: cleanString(input.displayName, 500) || null,
    profile_picture_url: cleanString(input.profilePictureUrl, 3000) || null,
    link_state: "provider_identity",
    first_seen_at: firstSeen,
    last_seen_at: cleanString(input.lastSeenAt, 100) || firstSeen,
    evidence: input.evidence || {},
    created_at: now,
    updated_at: now,
  }
  const { data, error } = await db.from("social_command_relationship_identities").insert(identity).select("*").single()
  if (error) throw error
  await recordJourneyEventMZ7({
    contactId,
    provider,
    providerIdentityId: identityId,
    entityType: "contact",
    entityId: contactId,
    kind: "relationship.identity_created",
    source: "provider_reconciliation",
    title: "Identité sociale reliée",
    summary: display ? `${provider} · ${display}` : `${provider} · identité fournisseur`,
    occurredAt: firstSeen,
    providerReference: providerUserId,
    payload: { providerAccountId: input.providerAccountId || null },
  })
  return data
}

export async function bindEntityToRelationshipMZ7(input: {
  entityType: "conversation" | "comment" | "mention"
  entityId: string
  contactId: string
  sourceKind?: MZ7JourneySource
}) {
  const db = await socialDb()
  const table = input.entityType === "conversation" ? "social_command_conversations" : input.entityType === "comment" ? "social_command_comments" : "social_command_mentions"
  const { error } = await db.from(table).update({ relationship_contact_id: input.contactId, source_kind: input.sourceKind || "webhook_live", updated_at: nowIso() }).eq("id", input.entityId)
  if (error) throw error
}

export async function setConversationJourneyStateMZ7(conversationId: string, input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const { data: current, error: currentError } = await db.from("social_command_conversations").select("*").eq("id", conversationId).single()
  if (currentError || !current) throw currentError || new Error("Conversation not found")
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  let eventKind = "conversation.updated"
  const action = cleanString(input.action || input.status, 80)
  if (action === "archive") {
    patch.status = "archived"; patch.archived_at = nowIso(); patch.archived_by = actorUserId; patch.archive_reason = cleanString(input.reason, 1000) || "Cleared from active workspace"; eventKind = "conversation.archived"
  } else if (action === "restore") {
    patch.status = cleanString(input.restoreStatus, 40) || "open"; patch.archived_at = null; patch.archived_by = null; patch.archive_reason = null; eventKind = "conversation.restored"
  } else if (action === "resolve") {
    patch.status = "resolved"; patch.resolved_at = nowIso(); eventKind = "conversation.resolved"
  } else if (action === "reopen") {
    patch.status = "open"; patch.resolved_at = null; eventKind = "conversation.reopened"
  } else if (action === "waiting") {
    patch.status = "waiting"; patch.waiting_reason = cleanString(input.reason, 1000) || null; patch.waiting_until = cleanString(input.waitingUntil, 100) || null; eventKind = "conversation.waiting"
  } else if (action === "priority") {
    patch.status = "priority"; patch.priority = cleanString(input.priority, 40) || "high"; eventKind = "conversation.priority"
  }
  if (Object.prototype.hasOwnProperty.call(input, "assignedUserId")) { patch.assigned_user_id = cleanString(input.assignedUserId, 200) || null; eventKind = "conversation.assigned" }
  if (Array.isArray(input.tags)) patch.tags = stringArray(input.tags)
  if (Object.prototype.hasOwnProperty.call(input, "triageCategory")) patch.triage_category = cleanString(input.triageCategory, 120) || null
  const { data, error } = await db.from("social_command_conversations").update(patch).eq("id", conversationId).select("*").single()
  if (error) throw error
  await recordJourneyEventMZ7({
    contactId: cleanString(current.relationship_contact_id, 120) || null,
    provider: current.channel === "facebook" ? "facebook" : "instagram",
    entityType: "conversation",
    entityId: conversationId,
    kind: eventKind,
    source: "operator",
    title: eventKind.split(".").slice(1).join(" ").replace(/_/g," "),
    actorUserId,
    payload: { action, reason: cleanString(input.reason, 1000) || null, changed: Object.keys(patch) },
  })
  return data
}

export async function setCommentJourneyStateMZ7(commentId: string, input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const { data: current, error: currentError } = await db.from("social_command_comments").select("*").eq("id", commentId).single()
  if (currentError || !current) throw currentError || new Error("Comment not found")
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  let eventKind = "comment.updated"
  const action = cleanString(input.action || input.status, 80)
  if (action === "archive") { patch.status = "archived"; patch.archived_at = nowIso(); patch.archived_by = actorUserId; patch.archive_reason = cleanString(input.reason, 1000) || "Cleared from active workspace"; eventKind = "comment.archived" }
  else if (action === "restore") { patch.status = cleanString(input.restoreStatus, 40) || "unanswered"; patch.archived_at = null; patch.archived_by = null; patch.archive_reason = null; eventKind = "comment.restored" }
  else if (action === "resolve") { patch.status = "resolved"; patch.resolved_at = nowIso(); eventKind = "comment.resolved" }
  else if (action === "reopen") { patch.status = "unanswered"; patch.resolved_at = null; eventKind = "comment.reopened" }
  else if (["priority","sensitive","answered","unanswered"].includes(action)) { patch.status = action; eventKind = `comment.${action}` }
  if (Object.prototype.hasOwnProperty.call(input, "assignedUserId")) patch.assigned_user_id = cleanString(input.assignedUserId, 200) || null
  const { data, error } = await db.from("social_command_comments").update(patch).eq("id", commentId).select("*").single()
  if (error) throw error
  await recordJourneyEventMZ7({
    contactId: cleanString(current.relationship_contact_id, 120) || null,
    provider: current.channel === "facebook" ? "facebook" : "instagram",
    entityType: "comment",
    entityId: commentId,
    kind: eventKind,
    source: "operator",
    actorUserId,
    providerReference: cleanString(current.provider_comment_id, 500) || null,
    payload: { action, reason: cleanString(input.reason, 1000) || null },
  })
  return data
}


export async function setMentionJourneyStateMZ7(mentionId: string, input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const { data: current, error: currentError } = await db.from("social_command_mentions").select("*").eq("id", mentionId).single()
  if (currentError || !current) throw currentError || new Error("Mention not found")
  const action = cleanString(input.action || input.status, 80)
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  let eventKind = "mention.updated"
  if (action === "archive") { patch.status = "archived"; patch.archived_at = nowIso(); patch.archived_by = actorUserId; patch.archive_reason = cleanString(input.reason, 1000) || "Cleared from active workspace"; eventKind = "mention.archived" }
  else if (action === "restore") { patch.status = cleanString(input.restoreStatus, 40) || "reviewed"; patch.archived_at = null; patch.archived_by = null; patch.archive_reason = null; eventKind = "mention.restored" }
  else if (action === "resolve") { patch.status = "resolved"; eventKind = "mention.resolved" }
  else if (action === "reviewed") { patch.status = "reviewed"; eventKind = "mention.reviewed" }
  const { data, error } = await db.from("social_command_mentions").update(patch).eq("id", mentionId).select("*").single()
  if (error) throw error
  await recordJourneyEventMZ7({ contactId: cleanString(current.relationship_contact_id,120)||null, provider: current.channel === "facebook" ? "facebook" : "instagram", entityType:"mention", entityId:mentionId, kind:eventKind, source:"operator", actorUserId, providerReference:cleanString(current.provider_mention_id,500)||null, payload:{action,reason:cleanString(input.reason,1000)||null} })
  return data
}

export async function archiveResolvedEngagementMZ7(actorUserId: string) {
  const db = await socialDb()
  const [cq,cmq,mq] = await Promise.all([
    db.from("social_command_conversations").select("id").eq("status","resolved").limit(500),
    db.from("social_command_comments").select("id").eq("status","resolved").limit(500),
    db.from("social_command_mentions").select("id").eq("status","resolved").limit(500),
  ])
  if (cq.error) throw cq.error; if (cmq.error) throw cmq.error; if (mq.error) throw mq.error
  let conversations=0,comments=0,mentions=0
  for (const row of cq.data||[]) { await setConversationJourneyStateMZ7(row.id,{action:"archive",reason:"Bulk clear resolved workspace"},actorUserId); conversations++ }
  for (const row of cmq.data||[]) { await setCommentJourneyStateMZ7(row.id,{action:"archive",reason:"Bulk clear resolved workspace"},actorUserId); comments++ }
  for (const row of mq.data||[]) { await setMentionJourneyStateMZ7(row.id,{action:"archive",reason:"Bulk clear resolved workspace"},actorUserId); mentions++ }
  return { conversations, comments, mentions, total: conversations+comments+mentions }
}

export async function listArchivedEngagementMZ7(limit = 160) {
  const db = await socialDb()
  const [{ data: conversations, error: cError }, { data: comments, error: cmError }, { data: mentions, error: mError }] = await Promise.all([
    db.from("social_command_conversations").select("*").eq("status", "archived").order("archived_at", { ascending: false, nullsFirst: false }).limit(limit),
    db.from("social_command_comments").select("*").eq("status", "archived").order("archived_at", { ascending: false, nullsFirst: false }).limit(limit),
    db.from("social_command_mentions").select("*").eq("status", "archived").order("archived_at", { ascending: false, nullsFirst: false }).limit(limit),
  ])
  if (cError) throw cError; if (cmError) throw cmError; if (mError) throw mError
  return { conversations: conversations || [], comments: comments || [], mentions: mentions || [] }
}

export async function getRelationshipDossierMZ7(contactId: string) {
  const id = cleanString(contactId, 120)
  if (!id) throw new Error("Relationship contact id is required")
  const db = await socialDb()
  const [contactQ, identityQ, journeyQ, conversationsQ, commentsQ, mentionsQ] = await Promise.all([
    db.from("social_command_relationship_contacts").select("*").eq("id", id).maybeSingle(),
    db.from("social_command_relationship_identities").select("*").eq("relationship_contact_id", id).order("last_seen_at", { ascending: false }),
    db.from("social_command_journey_events").select("*").eq("relationship_contact_id", id).order("occurred_at", { ascending: false }).limit(500),
    db.from("social_command_conversations").select("id,channel,status,priority,last_message_at,first_received_at,triage_category,tags,archived_at").eq("relationship_contact_id", id).order("last_message_at", { ascending: false }).limit(120),
    db.from("social_command_comments").select("id,channel,status,text,provider_created_at,publication_id,campaign_id,archived_at").eq("relationship_contact_id", id).order("provider_created_at", { ascending: false }).limit(180),
    db.from("social_command_mentions").select("id,channel,status,text,provider_created_at,archived_at").eq("relationship_contact_id", id).order("provider_created_at", { ascending: false }).limit(120),
  ])
  for (const q of [contactQ, identityQ, journeyQ, conversationsQ, commentsQ, mentionsQ]) if (q.error) throw q.error
  if (!contactQ.data) throw new Error("Relationship contact not found")
  const conversations = conversationsQ.data || [], comments = commentsQ.data || [], mentions = mentionsQ.data || []
  const openConversationStates = new Set(["new","open","waiting","priority","assigned","responded"])
  return {
    contact: contactQ.data,
    identities: identityQ.data || [],
    journey: journeyQ.data || [],
    conversations,
    comments,
    mentions,
    summary: {
      totalInteractions: conversations.length + comments.length + mentions.length,
      openInteractions: conversations.filter((x: any) => openConversationStates.has(x.status)).length + comments.filter((x: any) => !["resolved","archived"].includes(x.status)).length + mentions.filter((x: any) => !["resolved","archived"].includes(x.status)).length,
      resolved: conversations.filter((x: any) => x.status === "resolved").length + comments.filter((x: any) => x.status === "resolved").length + mentions.filter((x: any) => x.status === "resolved").length,
      archived: conversations.filter((x: any) => x.status === "archived").length + comments.filter((x: any) => x.status === "archived").length + mentions.filter((x: any) => x.status === "archived").length,
      channels: [...new Set([...(identityQ.data || []).map((x: any) => x.provider), ...conversations.map((x: any) => x.channel), ...comments.map((x: any) => x.channel)])],
      firstSeenAt: contactQ.data.first_seen_at || null,
      lastSeenAt: contactQ.data.last_seen_at || null,
    },
  }
}

export async function complianceAnonymizeRelationshipMZ7(contactId: string, reasonValue: unknown, actor: { id: string; role: string }) {
  const reason = cleanString(reasonValue, 2000)
  if (!reason) throw new Error("Compliance reason is required")
  const role = cleanString(actor.role, 120).toLowerCase()
  const configured = String(process.env.SOCIAL_COMMAND_COMPLIANCE_ERASURE_ROLES || "super_admin,admin,dpo,privacy_officer").toLowerCase().split(",").map(x => x.trim()).filter(Boolean)
  if (!configured.includes(role)) throw new Error("COMPLIANCE_ERASURE_FORBIDDEN")
  const db = await socialDb()
  const { data, error } = await db.rpc("social_command_mz7_compliance_anonymize_contact", {
    p_contact_id: cleanString(contactId, 120),
    p_actor_user_id: actor.id,
    p_reason: reason,
  })
  if (error) throw error
  return data
}
