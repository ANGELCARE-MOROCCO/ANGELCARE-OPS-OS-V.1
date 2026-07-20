import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export type SenderIdentityMode = "corporate" | "department" | "named_operator" | "executive"
export type SenderIdentityStatus = "draft" | "testing" | "active" | "suspended" | "retired"

export type SenderIdentityActor = {
  userId?: string | null
  name: string
  ip?: string | null
}

export type SenderIdentityOverride = {
  identityId?: string | null
  version?: number | null
  externalDisplayName: string
  fromAddress: string
  replyToName?: string | null
  replyToAddress?: string | null
  identityMode?: SenderIdentityMode | null
}

export type ResolvedSenderIdentity = {
  identityId: string | null
  version: number | null
  mailboxId: string
  internalName: string
  fromName: string
  fromAddress: string
  replyToName: string | null
  replyToAddress: string | null
  identityMode: SenderIdentityMode
  status: SenderIdentityStatus | "fallback"
  source: "active_identity" | "frozen_version" | "admin_override" | "mailbox_fallback" | "brand_fallback"
}

export type SenderIdentityRecord = {
  id: string
  mailbox_id: string
  internal_name: string
  external_display_name: string
  from_address: string
  reply_to_name: string | null
  reply_to_address: string | null
  identity_mode: SenderIdentityMode
  brand_prefix: string | null
  default_language: string
  category: string | null
  status: SenderIdentityStatus
  version: number
  is_default: boolean
  last_tested_at: string | null
  last_test_status: "success" | "failed" | null
  last_test_message_id: string | null
  last_test_recipient: string | null
  activated_at: string | null
  activated_by: string | null
  suspended_at: string | null
  suspended_by: string | null
  suspension_reason: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  metadata_json: Record<string, unknown> | null
}

export type SenderIdentityVersionRecord = {
  id: string
  sender_identity_id: string
  mailbox_id: string
  version: number
  internal_name: string
  external_display_name: string
  from_address: string
  reply_to_name: string | null
  reply_to_address: string | null
  identity_mode: SenderIdentityMode
  brand_prefix: string | null
  default_language: string | null
  category: string | null
  status: SenderIdentityStatus
  is_default: boolean
  snapshot_reason: string | null
  snapshot_json: Record<string, unknown> | null
  created_at: string
  created_by: string | null
}

type MailboxRow = {
  id: string
  name?: string | null
  address?: string | null
  status?: string | null
  owner?: string | null
  provider?: string | null
  sender_display_name?: string | null
  reply_to_name?: string | null
  reply_to_address?: string | null
}

type ResolveInput = {
  mailboxId?: string | null
  canonicalFromAddress: string
  mailboxInternalName?: string | null
  requestedDisplayName?: string | null
  senderIdentityId?: string | null
  senderIdentityVersion?: number | null
  override?: SenderIdentityOverride | null
}

const CACHE_TTL_MS = 45_000
const identityCache = new Map<string, { expiresAt: number; value: ResolvedSenderIdentity }>()

function requireSenderIdentityServiceRole() {
  if (!clean(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for sender identity administration.")
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase()
}

function safeHeaderText(value: unknown, maxLength = 120) {
  return clean(value).replace(/[\r\n\0]/g, " ").replace(/\s{2,}/g, " ").slice(0, maxLength)
}

function emailDomain(value: unknown) {
  return normalizeEmail(value).split("@")[1] || ""
}

function titleFromLocalPart(address: string) {
  const local = normalizeEmail(address).split("@")[0] || ""
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function standardSenderDisplayName(address: string, internalName?: string | null) {
  const email = normalizeEmail(address)
  const local = email.split("@")[0] || ""
  if (["support", "supports"].includes(local)) return "ANGELCARE Support Client"
  if (local === "ops") return "ANGELCARE Operations"
  if (local === "academy") return "ANGELCARE Academy"
  if (["partenaires", "partners"].includes(local)) return "ANGELCARE Partenariats"
  if (local === "rh") return "ANGELCARE Ressources Humaines"
  if (local === "b2b") return "ANGELCARE Business Partnerships"
  if (local === "it.support") return "ANGELCARE IT Support"
  if (local === "montessori") return "ANGELCARE Montessori"
  if (["homeservice", "home.service"].includes(local)) return "ANGELCARE Home Service"
  if (local === "events") return "ANGELCARE Événements"
  if (local === "excursions") return "ANGELCARE Excursions"
  if (local === "commercial") return "ANGELCARE Commercial"
  if (local === "flashcartes") return "ANGELCARE Flashcartes"

  const label = safeHeaderText(internalName) || titleFromLocalPart(email)
  return label ? `ANGELCARE ${label}` : "ANGELCARE"
}

export function standardReplyToName(address: string) {
  const local = normalizeEmail(address).split("@")[0] || ""
  if (["support", "supports"].includes(local)) return "Équipe Support ANGELCARE"
  if (local === "ops") return "Équipe Opérations ANGELCARE"
  if (local === "academy") return "Équipe ANGELCARE Academy"
  if (["partenaires", "partners"].includes(local)) return "Équipe Partenariats ANGELCARE"
  if (local === "rh") return "Équipe Ressources Humaines ANGELCARE"
  return "Équipe ANGELCARE"
}

function asResolvedIdentity(row: SenderIdentityRecord | SenderIdentityVersionRecord, source: ResolvedSenderIdentity["source"]): ResolvedSenderIdentity {
  return {
    identityId: "sender_identity_id" in row ? row.sender_identity_id : row.id,
    version: Number(row.version || 0) || null,
    mailboxId: clean(row.mailbox_id),
    internalName: safeHeaderText(row.internal_name),
    fromName: safeHeaderText(row.external_display_name),
    fromAddress: normalizeEmail(row.from_address),
    replyToName: safeHeaderText(row.reply_to_name) || null,
    replyToAddress: normalizeEmail(row.reply_to_address) || null,
    identityMode: row.identity_mode || "corporate",
    status: row.status,
    source,
  }
}

export function invalidateSenderIdentityCache(mailboxId?: string | null) {
  const normalized = clean(mailboxId)
  if (!normalized) {
    identityCache.clear()
    return
  }
  for (const key of identityCache.keys()) {
    if (key.startsWith(`${normalized}|`)) identityCache.delete(key)
  }
}

function cacheKey(input: ResolveInput) {
  return [
    clean(input.mailboxId),
    normalizeEmail(input.canonicalFromAddress),
    clean(input.senderIdentityId),
    Number(input.senderIdentityVersion || 0),
  ].join("|")
}

async function loadMailbox(db: ReturnType<typeof createEmailOSCoreDb>, mailboxId: string, fromAddress: string) {
  let query = db.from("email_os_core_mailboxes").select("id,name,address,status,owner,provider,sender_display_name,reply_to_name,reply_to_address")
  if (mailboxId) query = query.eq("id", mailboxId)
  else query = query.ilike("address", fromAddress)
  const { data } = await query.maybeSingle()
  return (data || null) as MailboxRow | null
}

function buildFallback(mailbox: MailboxRow | null, input: ResolveInput): ResolvedSenderIdentity {
  const fromAddress = normalizeEmail(mailbox?.address || input.canonicalFromAddress)
  const internalName = safeHeaderText(mailbox?.name || input.mailboxInternalName || titleFromLocalPart(fromAddress) || "Email OS")
  const mailboxName = safeHeaderText(mailbox?.sender_display_name)
  const fromName = mailboxName || standardSenderDisplayName(fromAddress, internalName) || "ANGELCARE"
  const replyToAddress = normalizeEmail(mailbox?.reply_to_address || fromAddress) || fromAddress
  const replyToName = safeHeaderText(mailbox?.reply_to_name) || standardReplyToName(fromAddress)

  return {
    identityId: null,
    version: null,
    mailboxId: clean(mailbox?.id || input.mailboxId),
    internalName,
    fromName,
    fromAddress,
    replyToName,
    replyToAddress,
    identityMode: "corporate",
    status: "fallback",
    source: mailboxName ? "mailbox_fallback" : "brand_fallback",
  }
}

function validateOverride(override: SenderIdentityOverride, canonicalFromAddress: string, mailboxId: string): ResolvedSenderIdentity {
  const fromAddress = normalizeEmail(override.fromAddress)
  if (!fromAddress || fromAddress !== normalizeEmail(canonicalFromAddress)) {
    throw new Error("Sender identity override does not match the authenticated mailbox address.")
  }
  const fromName = safeHeaderText(override.externalDisplayName)
  if (!fromName) throw new Error("Sender display name is required.")
  return {
    identityId: clean(override.identityId) || null,
    version: Number(override.version || 0) || null,
    mailboxId,
    internalName: fromName,
    fromName,
    fromAddress,
    replyToName: safeHeaderText(override.replyToName) || null,
    replyToAddress: normalizeEmail(override.replyToAddress) || fromAddress,
    identityMode: override.identityMode || "corporate",
    status: "testing",
    source: "admin_override",
  }
}

export async function resolveSenderIdentity(input: ResolveInput): Promise<ResolvedSenderIdentity> {
  const mailboxId = clean(input.mailboxId)
  const canonicalFromAddress = normalizeEmail(input.canonicalFromAddress)
  if (!canonicalFromAddress) throw new Error("Canonical sender address is required.")

  if (input.override) return validateOverride(input.override, canonicalFromAddress, mailboxId)

  const key = cacheKey(input)
  const cached = identityCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const db = createEmailOSCoreDb()
  let resolved: ResolvedSenderIdentity | null = null

  try {
    if (clean(input.senderIdentityId) && Number(input.senderIdentityVersion || 0) > 0) {
      const { data } = await db
        .from("email_os_sender_identity_versions")
        .select("*")
        .eq("sender_identity_id", clean(input.senderIdentityId))
        .eq("version", Number(input.senderIdentityVersion))
        .maybeSingle()
      if (data && normalizeEmail(data.from_address) === canonicalFromAddress) {
        resolved = asResolvedIdentity(data as SenderIdentityVersionRecord, "frozen_version")
      }
    }

    if (!resolved) {
      let query = db.from("email_os_sender_identities").select("*").eq("status", "active").eq("is_default", true)
      query = mailboxId ? query.eq("mailbox_id", mailboxId) : query.ilike("from_address", canonicalFromAddress)
      const { data } = await query.maybeSingle()
      if (data && normalizeEmail(data.from_address) === canonicalFromAddress) {
        resolved = asResolvedIdentity(data as SenderIdentityRecord, "active_identity")
      }
    }
  } catch {
    resolved = null
  }

  if (!resolved) {
    const mailbox = await loadMailbox(db, mailboxId, canonicalFromAddress).catch(() => null)
    resolved = buildFallback(mailbox, input)
  }

  identityCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value: resolved })
  return resolved
}

function senderIdentityPayload(row: SenderIdentityRecord | Record<string, unknown>) {
  return {
    id: clean(row.id),
    mailbox_id: clean(row.mailbox_id),
    internal_name: safeHeaderText(row.internal_name),
    external_display_name: safeHeaderText(row.external_display_name),
    from_address: normalizeEmail(row.from_address),
    reply_to_name: safeHeaderText(row.reply_to_name) || null,
    reply_to_address: normalizeEmail(row.reply_to_address) || null,
    identity_mode: clean(row.identity_mode) || "corporate",
    brand_prefix: safeHeaderText(row.brand_prefix) || null,
    default_language: clean(row.default_language) || "fr",
    category: safeHeaderText(row.category) || null,
    status: clean(row.status) || "draft",
    version: Number(row.version || 1),
    is_default: Boolean(row.is_default),
  }
}

async function validateReplyAddress(db: ReturnType<typeof createEmailOSCoreDb>, fromAddress: string, replyToAddress: string) {
  if (!replyToAddress || replyToAddress === fromAddress) return
  if (emailDomain(replyToAddress) !== emailDomain(fromAddress)) {
    throw new Error("Reply-To must use the same authorized AngelCare domain.")
  }
  const { data } = await db.from("email_os_core_mailboxes").select("id").ilike("address", replyToAddress).maybeSingle()
  if (!data) throw new Error("Reply-To must belong to an authorized Email OS mailbox.")
}

export async function validateSenderIdentityInput(input: Record<string, unknown>) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const mailboxId = clean(input.mailboxId || input.mailbox_id)
  if (!mailboxId) throw new Error("Mailbox is required.")
  const { data: mailbox } = await db.from("email_os_core_mailboxes").select("id,name,address,status").eq("id", mailboxId).maybeSingle()
  if (!mailbox) throw new Error("Mailbox not found.")

  const fromAddress = normalizeEmail(mailbox.address)
  const externalDisplayName = safeHeaderText(input.externalDisplayName || input.external_display_name)
  const internalName = safeHeaderText(input.internalName || input.internal_name || mailbox.name)
  const replyToAddress = normalizeEmail(input.replyToAddress || input.reply_to_address || fromAddress)
  const replyToName = safeHeaderText(input.replyToName || input.reply_to_name || standardReplyToName(fromAddress))
  const identityMode = clean(input.identityMode || input.identity_mode || "corporate") as SenderIdentityMode

  if (!externalDisplayName) throw new Error("External display name is required.")
  if (externalDisplayName.length < 3 || externalDisplayName.length > 120) throw new Error("External display name must contain 3 to 120 characters.")
  if (!externalDisplayName.toUpperCase().includes("ANGELCARE") && identityMode !== "named_operator") {
    throw new Error("Corporate, department and executive identities must contain the ANGELCARE brand.")
  }
  if (!["corporate", "department", "named_operator", "executive"].includes(identityMode)) throw new Error("Invalid identity mode.")
  await validateReplyAddress(db, fromAddress, replyToAddress)

  return {
    mailbox,
    values: {
      mailbox_id: mailboxId,
      internal_name: internalName || safeHeaderText(mailbox.name) || titleFromLocalPart(fromAddress),
      external_display_name: externalDisplayName,
      from_address: fromAddress,
      reply_to_name: replyToName || null,
      reply_to_address: replyToAddress || fromAddress,
      identity_mode: identityMode,
      brand_prefix: safeHeaderText(input.brandPrefix || input.brand_prefix || "ANGELCARE") || "ANGELCARE",
      default_language: clean(input.defaultLanguage || input.default_language || "fr") || "fr",
      category: safeHeaderText(input.category || mailbox.name) || null,
    },
  }
}

async function insertVersion(db: ReturnType<typeof createEmailOSCoreDb>, row: SenderIdentityRecord, actor: SenderIdentityActor, reason: string) {
  const payload = senderIdentityPayload(row)
  const { error } = await db.from("email_os_sender_identity_versions").insert({
    sender_identity_id: row.id,
    mailbox_id: row.mailbox_id,
    version: row.version,
    internal_name: row.internal_name,
    external_display_name: row.external_display_name,
    from_address: row.from_address,
    reply_to_name: row.reply_to_name,
    reply_to_address: row.reply_to_address,
    identity_mode: row.identity_mode,
    brand_prefix: row.brand_prefix,
    default_language: row.default_language,
    category: row.category,
    status: row.status,
    is_default: row.is_default,
    snapshot_reason: reason,
    snapshot_json: payload,
    created_by: actor.name,
  })
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error
}

export async function auditSenderIdentity(input: {
  identityId?: string | null
  mailboxId?: string | null
  actor: SenderIdentityActor
  action: string
  result?: string
  reason?: string | null
  previous?: unknown
  next?: unknown
  metadata?: Record<string, unknown>
}) {
  const db = createEmailOSCoreDb()
  await db.from("email_os_sender_identity_audit").insert({
    sender_identity_id: clean(input.identityId) || null,
    mailbox_id: clean(input.mailboxId) || null,
    actor_user_id: clean(input.actor.userId) || null,
    actor_name: input.actor.name,
    actor_ip: clean(input.actor.ip) || null,
    action: input.action,
    result: input.result || "ok",
    reason: clean(input.reason) || null,
    previous_json: input.previous || null,
    next_json: input.next || null,
    metadata_json: input.metadata || {},
  }).then(() => null, () => null)
}

export async function saveSenderIdentityDraft(input: Record<string, unknown>, actor: SenderIdentityActor) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const identityId = clean(input.id || input.identityId)
  const { values } = await validateSenderIdentityInput(input)

  const { data: existing } = identityId
    ? await db.from("email_os_sender_identities").select("*").eq("id", identityId).maybeSingle()
    : await db.from("email_os_sender_identities").select("*").eq("mailbox_id", values.mailbox_id).maybeSingle()

  const now = new Date().toISOString()
  let row: SenderIdentityRecord

  if (existing) {
    const previous = existing as SenderIdentityRecord
    const nextVersion = Number(previous.version || 0) + 1
    const { data, error } = await db.from("email_os_sender_identities").update({
      ...values,
      status: "draft",
      version: nextVersion,
      is_default: false,
      last_tested_at: null,
      last_test_status: null,
      last_test_message_id: null,
      last_test_recipient: null,
      updated_at: now,
      updated_by: actor.name,
    }).eq("id", previous.id).select("*").single()
    if (error) throw error
    row = data as SenderIdentityRecord
    await insertVersion(db, row, actor, clean(input.reason) || "Sender identity draft updated")
    await auditSenderIdentity({ identityId: row.id, mailboxId: row.mailbox_id, actor, action: "sender_identity_draft_updated", reason: clean(input.reason), previous: senderIdentityPayload(previous), next: senderIdentityPayload(row) })
  } else {
    const { data, error } = await db.from("email_os_sender_identities").insert({
      ...values,
      status: "draft",
      version: 1,
      is_default: false,
      created_by: actor.name,
      updated_by: actor.name,
      created_at: now,
      updated_at: now,
    }).select("*").single()
    if (error) throw error
    row = data as SenderIdentityRecord
    await insertVersion(db, row, actor, clean(input.reason) || "Sender identity draft created")
    await auditSenderIdentity({ identityId: row.id, mailboxId: row.mailbox_id, actor, action: "sender_identity_draft_created", reason: clean(input.reason), next: senderIdentityPayload(row) })
  }

  invalidateSenderIdentityCache(row.mailbox_id)
  return row
}

export async function markSenderIdentityTestResult(identityId: string, actor: SenderIdentityActor, input: { success: boolean; recipient: string; messageId?: string | null; error?: string | null; reason: string }) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const now = new Date().toISOString()
  const { data, error } = await db.from("email_os_sender_identities").update({
    status: input.success ? "testing" : "draft",
    last_tested_at: now,
    last_test_status: input.success ? "success" : "failed",
    last_test_message_id: clean(input.messageId) || null,
    last_test_recipient: normalizeEmail(input.recipient),
    updated_at: now,
    updated_by: actor.name,
  }).eq("id", identityId).select("*").single()
  if (error) throw error
  const row = data as SenderIdentityRecord
  await auditSenderIdentity({
    identityId: row.id,
    mailboxId: row.mailbox_id,
    actor,
    action: "sender_identity_proof_test",
    result: input.success ? "success" : "failed",
    reason: input.reason,
    next: senderIdentityPayload(row),
    metadata: { recipient: normalizeEmail(input.recipient), messageId: clean(input.messageId) || null, error: clean(input.error) || null },
  })
  return row
}

export async function activateSenderIdentity(identityId: string, actor: SenderIdentityActor, reason: string) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const { data: current, error: currentError } = await db.from("email_os_sender_identities").select("*").eq("id", identityId).maybeSingle()
  if (currentError || !current) throw currentError || new Error("Sender identity not found.")
  const previous = current as SenderIdentityRecord
  if (previous.last_test_status !== "success" || !previous.last_tested_at) throw new Error("A successful proof email is required before activation.")
  const testedAt = new Date(previous.last_tested_at).getTime()
  if (!Number.isFinite(testedAt) || Date.now() - testedAt > 7 * 24 * 60 * 60 * 1000) throw new Error("The proof test is older than seven days. Send a new proof before activation.")

  const now = new Date().toISOString()
  const nextVersion = Number(previous.version || 0) + 1
  const { data, error } = await db.from("email_os_sender_identities").update({
    status: "active",
    version: nextVersion,
    is_default: true,
    activated_at: now,
    activated_by: actor.name,
    suspended_at: null,
    suspended_by: null,
    suspension_reason: null,
    updated_at: now,
    updated_by: actor.name,
  }).eq("id", identityId).select("*").single()
  if (error) throw error
  const row = data as SenderIdentityRecord
  await insertVersion(db, row, actor, reason || "Sender identity activated")
  await db.from("email_os_core_mailboxes").update({ sender_display_name: row.external_display_name, reply_to_name: row.reply_to_name, reply_to_address: row.reply_to_address, updated_at: now }).eq("id", row.mailbox_id).then(() => null, () => null)
  await auditSenderIdentity({ identityId: row.id, mailboxId: row.mailbox_id, actor, action: "sender_identity_activated", reason, previous: senderIdentityPayload(previous), next: senderIdentityPayload(row) })
  invalidateSenderIdentityCache(row.mailbox_id)
  return row
}

export async function suspendSenderIdentity(identityId: string, actor: SenderIdentityActor, reason: string) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const { data: current } = await db.from("email_os_sender_identities").select("*").eq("id", identityId).maybeSingle()
  if (!current) throw new Error("Sender identity not found.")
  const previous = current as SenderIdentityRecord
  const now = new Date().toISOString()
  const { data, error } = await db.from("email_os_sender_identities").update({
    status: "suspended",
    version: Number(previous.version || 0) + 1,
    is_default: false,
    suspended_at: now,
    suspended_by: actor.name,
    suspension_reason: reason,
    updated_at: now,
    updated_by: actor.name,
  }).eq("id", identityId).select("*").single()
  if (error) throw error
  const row = data as SenderIdentityRecord
  await insertVersion(db, row, actor, reason || "Sender identity suspended")
  await auditSenderIdentity({ identityId: row.id, mailboxId: row.mailbox_id, actor, action: "sender_identity_suspended", reason, previous: senderIdentityPayload(previous), next: senderIdentityPayload(row) })
  invalidateSenderIdentityCache(row.mailbox_id)
  return row
}

export async function rollbackSenderIdentity(identityId: string, targetVersion: number, actor: SenderIdentityActor, reason: string) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const [{ data: current }, { data: target }] = await Promise.all([
    db.from("email_os_sender_identities").select("*").eq("id", identityId).maybeSingle(),
    db.from("email_os_sender_identity_versions").select("*").eq("sender_identity_id", identityId).eq("version", targetVersion).maybeSingle(),
  ])
  if (!current || !target) throw new Error("Identity or target version not found.")
  const previous = current as SenderIdentityRecord
  const version = target as SenderIdentityVersionRecord
  const now = new Date().toISOString()
  const { data, error } = await db.from("email_os_sender_identities").update({
    internal_name: version.internal_name,
    external_display_name: version.external_display_name,
    from_address: version.from_address,
    reply_to_name: version.reply_to_name,
    reply_to_address: version.reply_to_address,
    identity_mode: version.identity_mode,
    brand_prefix: version.brand_prefix,
    default_language: version.default_language || "fr",
    category: version.category,
    status: version.status === "active" ? "active" : "draft",
    version: Number(previous.version || 0) + 1,
    is_default: version.status === "active",
    last_tested_at: version.status === "active" ? now : null,
    last_test_status: version.status === "active" ? "success" : null,
    updated_at: now,
    updated_by: actor.name,
    metadata_json: { ...(previous.metadata_json || {}), rolled_back_from_version: targetVersion },
  }).eq("id", identityId).select("*").single()
  if (error) throw error
  const row = data as SenderIdentityRecord
  await insertVersion(db, row, actor, reason || `Rolled back from version ${targetVersion}`)
  await auditSenderIdentity({ identityId: row.id, mailboxId: row.mailbox_id, actor, action: "sender_identity_rolled_back", reason, previous: senderIdentityPayload(previous), next: senderIdentityPayload(row), metadata: { targetVersion } })
  invalidateSenderIdentityCache(row.mailbox_id)
  return row
}

export async function getSenderIdentityDossier(identityId: string) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const [{ data: identity, error }, { data: versions }, { data: audit }] = await Promise.all([
    db.from("email_os_sender_identities").select("*").eq("id", identityId).maybeSingle(),
    db.from("email_os_sender_identity_versions").select("*").eq("sender_identity_id", identityId).order("version", { ascending: false }).limit(50),
    db.from("email_os_sender_identity_audit").select("*").eq("sender_identity_id", identityId).order("created_at", { ascending: false }).limit(80),
  ])
  if (error || !identity) throw error || new Error("Sender identity not found.")
  return { identity, versions: versions || [], audit: audit || [] }
}

export async function listSenderIdentityRegistry() {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const [{ data: mailboxes, error: mailboxError }, { data: identities, error: identityError }, { data: audit }] = await Promise.all([
    db.from("email_os_core_mailboxes").select("id,name,address,status,owner,provider,sender_display_name,reply_to_name,reply_to_address").order("name", { ascending: true }),
    db.from("email_os_sender_identities").select("*").order("updated_at", { ascending: false }),
    db.from("email_os_sender_identity_audit").select("*").order("created_at", { ascending: false }).limit(100),
  ])
  if (mailboxError) throw mailboxError
  if (identityError) throw identityError

  const identityRows = (identities || []) as SenderIdentityRecord[]
  const mailboxRows = (mailboxes || []) as MailboxRow[]
  const identityMap = new Map<string, SenderIdentityRecord>(identityRows.map((identity: SenderIdentityRecord) => [clean(identity.mailbox_id), identity]))
  const rows = mailboxRows.map((mailbox: MailboxRow) => {
    const identity = identityMap.get(clean(mailbox.id)) || null
    const proposedDisplayName = standardSenderDisplayName(clean(mailbox.address), clean(mailbox.name))
    const health = identity
      ? identity.status === "active" && identity.last_test_status === "success"
        ? "verified"
        : identity.status === "active"
          ? "active_untested"
          : identity.status === "suspended"
            ? "suspended"
            : "attention"
      : "unconfigured"
    return {
      mailbox,
      identity,
      proposedDisplayName,
      proposedReplyToName: standardReplyToName(clean(mailbox.address)),
      health,
    }
  })

  return {
    rows,
    audit: audit || [],
    summary: {
      mailboxes: rows.length,
      configured: rows.filter((row) => row.identity).length,
      active: rows.filter((row) => row.identity?.status === "active").length,
      verified: rows.filter((row) => row.health === "verified").length,
      attention: rows.filter((row) => ["attention", "active_untested", "unconfigured", "suspended"].includes(row.health)).length,
      lastTestedAt: identityRows.map((identity: SenderIdentityRecord) => identity.last_tested_at).filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    },
  }
}

export async function bulkStandardizeSenderIdentities(actor: SenderIdentityActor, apply: boolean, reason: string) {
  requireSenderIdentityServiceRole()
  const db = createEmailOSCoreDb()
  const { data: mailboxes, error } = await db.from("email_os_core_mailboxes").select("id,name,address,status").order("name", { ascending: true })
  if (error) throw error
  const proposals = ((mailboxes || []) as MailboxRow[]).map((mailbox: MailboxRow) => ({
    mailboxId: clean(mailbox.id),
    internalName: safeHeaderText(mailbox.name) || titleFromLocalPart(clean(mailbox.address)),
    fromAddress: normalizeEmail(mailbox.address),
    externalDisplayName: standardSenderDisplayName(clean(mailbox.address), clean(mailbox.name)),
    replyToName: standardReplyToName(clean(mailbox.address)),
    replyToAddress: normalizeEmail(mailbox.address),
    identityMode: "corporate" as SenderIdentityMode,
    category: safeHeaderText(mailbox.name) || "Email OS",
  }))

  if (!apply) return { applied: false, proposals }

  const applied: SenderIdentityRecord[] = []
  for (const proposal of proposals) {
    applied.push(await saveSenderIdentityDraft({ ...proposal, reason }, actor))
  }
  await auditSenderIdentity({ actor, action: "sender_identity_bulk_standardized", reason, metadata: { count: applied.length } })
  return { applied: true, proposals, identities: applied }
}

export function senderIdentitySnapshot(identity: ResolvedSenderIdentity) {
  return {
    senderIdentityId: identity.identityId,
    senderIdentityVersion: identity.version,
    resolvedFromName: identity.fromName,
    resolvedFromAddress: identity.fromAddress,
    resolvedReplyToName: identity.replyToName,
    resolvedReplyToAddress: identity.replyToAddress,
    identityMode: identity.identityMode,
    senderIdentitySource: identity.source,
  }
}
