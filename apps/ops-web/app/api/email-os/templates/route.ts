import crypto from "crypto"
import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import {
  EmailOSMailboxAccessError,
  requireUnlockedMailboxAccess,
  resolveMailboxScopeForUser
} from "@/lib/email-os-core/access-governance"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { resolveEmailOSOperatorIdentity } from "@/lib/email-os-core/operator-identity"

type Db = ReturnType<typeof createEmailOSCoreDb>

type TemplateInput = {
  id?: unknown
  templateCode?: unknown
  template_code?: unknown
  name?: unknown
  description?: unknown
  category?: unknown
  language?: unknown
  status?: unknown
  tags?: unknown
  subject?: unknown
  subjectTemplate?: unknown
  subject_template?: unknown
  body?: unknown
  bodyText?: unknown
  body_text?: unknown
  bodyHtml?: unknown
  body_html?: unknown
  defaultPriority?: unknown
  default_priority?: unknown
  defaultCc?: unknown
  default_cc?: unknown
  defaultBcc?: unknown
  default_bcc?: unknown
  trackingEnabled?: unknown
  tracking_enabled?: unknown
  signatureMode?: unknown
  signature_mode?: unknown
  changeSummary?: unknown
  change_summary?: unknown
}

const VALID_STATUSES = new Set(["draft", "published", "archived"])
const VALID_PRIORITIES = new Set(["low", "normal", "high", "urgent", "vip"])
const VALID_SIGNATURE_MODES = new Set(["mailbox", "operator", "department", "none"])
const VALID_IMPORT_STRATEGIES = new Set(["create_new", "skip_duplicates", "update_matching_codes", "create_duplicates"])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KNOWN_VARIABLES = new Set([
  "contact_name",
  "first_name",
  "company_name",
  "parent_name",
  "child_name",
  "operator_full_name",
  "operator_title",
  "operator",
  "mailbox_name",
  "mailbox",
  "today_date",
  "follow_up_date",
  "quote_reference",
  "service",
  "city"
])

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase()
}

function bool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  const normalized = cleanLower(value)
  if (["true", "1", "yes", "oui", "on"].includes(normalized)) return true
  if (["false", "0", "no", "non", "off"].includes(normalized)) return false
  return fallback
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean)
  const text = clean(value)
  if (!text) return []
  return text.split(/[|;,]/).map((item) => item.trim()).filter(Boolean)
}

function normalizeStatus(value: unknown, fallback = "draft") {
  const normalized = cleanLower(value)
  return VALID_STATUSES.has(normalized) ? normalized : fallback
}

function normalizePriority(value: unknown) {
  const normalized = cleanLower(value)
  return VALID_PRIORITIES.has(normalized) ? normalized : "normal"
}

function normalizeSignatureMode(value: unknown) {
  const normalized = cleanLower(value)
  return VALID_SIGNATURE_MODES.has(normalized) ? normalized : "mailbox"
}

function normalizeLanguage(value: unknown) {
  const normalized = cleanLower(value).replace("_", "-")
  if (!normalized) return "fr"
  if (["fr", "fr-fr", "en", "en-us", "en-gb", "ar", "es"].includes(normalized)) return normalized.split("-")[0]
  return normalized.slice(0, 12)
}

function normalizeCode(value: unknown, fallbackName = "template") {
  const source = clean(value) || clean(fallbackName) || "template"
  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
  return (normalized || `TEMPLATE_${Date.now()}`).slice(0, 96)
}

function extractVariables(...values: unknown[]) {
  const found = new Set<string>()
  const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g
  for (const value of values) {
    const text = clean(value)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text))) found.add(match[1].toLowerCase())
  }
  return Array.from(found).sort()
}

function contentHash(subject: unknown, bodyText: unknown, bodyHtml: unknown) {
  return crypto
    .createHash("sha256")
    .update([clean(subject), clean(bodyText), clean(bodyHtml)].join("|"))
    .digest("hex")
}

function normalizeInput(input: TemplateInput) {
  const name = clean(input.name)
  const subject = clean(input.subjectTemplate ?? input.subject_template ?? input.subject)
  const bodyText = clean(input.bodyText ?? input.body_text ?? input.body)
  const bodyHtml = clean(input.bodyHtml ?? input.body_html)
  return {
    id: clean(input.id),
    templateCode: normalizeCode(input.templateCode ?? input.template_code, name),
    name,
    description: clean(input.description),
    category: cleanLower(input.category) || "other",
    language: normalizeLanguage(input.language),
    status: normalizeStatus(input.status),
    tags: stringList(input.tags),
    subject,
    bodyText,
    bodyHtml,
    variables: extractVariables(subject, bodyText, bodyHtml),
    defaultPriority: normalizePriority(input.defaultPriority ?? input.default_priority),
    defaultCc: clean(input.defaultCc ?? input.default_cc),
    defaultBcc: clean(input.defaultBcc ?? input.default_bcc),
    trackingEnabled: bool(input.trackingEnabled ?? input.tracking_enabled, true),
    signatureMode: normalizeSignatureMode(input.signatureMode ?? input.signature_mode),
    changeSummary: clean(input.changeSummary ?? input.change_summary)
  }
}

function validateTemplate(input: ReturnType<typeof normalizeInput>) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.name) errors.push("Template name is required")
  if (!input.templateCode) errors.push("Template code is required")
  if (!input.subject) warnings.push("Subject is empty")
  if (!input.bodyText && !input.bodyHtml) errors.push("At least one message body is required")
  if (input.defaultCc && !input.defaultCc.split(/[;,]/).map(clean).filter(Boolean).every((email) => EMAIL_RE.test(email))) errors.push("Default CC contains an invalid email")
  if (input.defaultBcc && !input.defaultBcc.split(/[;,]/).map(clean).filter(Boolean).every((email) => EMAIL_RE.test(email))) errors.push("Default BCC contains an invalid email")
  const unknownVariables = input.variables.filter((variable) => !KNOWN_VARIABLES.has(variable))
  if (unknownVariables.length) warnings.push(`Unknown variables: ${unknownVariables.join(", ")}`)
  if (/<script[\s>]/i.test(input.bodyHtml)) errors.push("HTML body cannot contain script elements")
  return { errors, warnings, unknownVariables }
}

function accessError(error: unknown) {
  if (error instanceof EmailOSMailboxAccessError) {
    const access = error as EmailOSMailboxAccessError
    return NextResponse.json({ ok: false, error: access.message }, { status: access.status })
  }
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : "Template Studio request failed" },
    { status: 500 }
  )
}

async function resolveContext(request: Request, mailboxId: string, permission: "can_read" | "can_manage_templates") {
  const user = await getCurrentAppUser()
  if (!user) throw new EmailOSMailboxAccessError("Unauthorized", 401)
  const scope = await resolveMailboxScopeForUser(user.id, mailboxId || null)
  const access = await requireUnlockedMailboxAccess({
    userId: user.id,
    mailboxId: scope.mailboxId,
    requiredPermission: permission,
    request
  })
  const operator = await resolveEmailOSOperatorIdentity(createEmailOSCoreDb(), user.id, {
    id: user.id,
    name: user.name || undefined,
    email: user.email || undefined,
    role: user.role || undefined
  })
  return { user, scope, access, operator }
}

async function loadCurrentVersionMap(db: Db, templateIds: string[]) {
  if (!templateIds.length) return new Map<string, any>()
  const { data, error } = await db
    .from("email_os_template_versions")
    .select("*")
    .in("template_id", templateIds)
    .order("version_number", { ascending: false })
  if (error) throw error
  const map = new Map<string, any>()
  for (const row of data || []) {
    if (!map.has(clean(row.template_id))) map.set(clean(row.template_id), row)
  }
  return map
}

function normalizeTemplate(row: any, version?: any) {
  const current = version || {}
  return {
    id: clean(row?.id),
    mailboxId: clean(row?.mailbox_id),
    mailbox_id: clean(row?.mailbox_id),
    templateCode: clean(row?.template_code),
    template_code: clean(row?.template_code),
    name: clean(row?.name || "Untitled template"),
    description: clean(row?.description),
    category: clean(row?.category || "other"),
    language: clean(row?.language || "fr"),
    status: clean(row?.status || "draft"),
    tags: Array.isArray(row?.tags) ? row.tags : [],
    defaultPriority: clean(row?.default_priority || "normal"),
    default_priority: clean(row?.default_priority || "normal"),
    defaultCc: clean(row?.default_cc),
    default_cc: clean(row?.default_cc),
    defaultBcc: clean(row?.default_bcc),
    default_bcc: clean(row?.default_bcc),
    trackingEnabled: Boolean(row?.tracking_enabled),
    tracking_enabled: Boolean(row?.tracking_enabled),
    signatureMode: clean(row?.signature_mode || "mailbox"),
    signature_mode: clean(row?.signature_mode || "mailbox"),
    currentVersion: Number(row?.current_version || current?.version_number || 1),
    current_version: Number(row?.current_version || current?.version_number || 1),
    subject: clean(current?.subject_template),
    subject_template: clean(current?.subject_template),
    body: clean(current?.body_text),
    bodyText: clean(current?.body_text),
    body_text: clean(current?.body_text),
    bodyHtml: clean(current?.body_html),
    body_html: clean(current?.body_html),
    variables: Array.isArray(current?.variables) ? current.variables : [],
    contentHash: clean(current?.content_hash),
    changeSummary: clean(current?.change_summary),
    usageCount: Number(row?.usage_count || 0),
    lastUsedAt: row?.last_used_at || null,
    lastUsedByUserId: row?.last_used_by_user_id || null,
    createdByUserId: row?.created_by_user_id || null,
    updatedByUserId: row?.updated_by_user_id || null,
    publishedByUserId: row?.published_by_user_id || null,
    createdAt: row?.created_at || null,
    updatedAt: row?.updated_at || null,
    publishedAt: row?.published_at || null,
    archivedAt: row?.archived_at || null
  }
}

async function loadTemplates(db: Db, mailboxId: string) {
  const { data, error } = await db
    .from("email_os_mailbox_templates")
    .select("*")
    .eq("mailbox_id", mailboxId)
    .order("updated_at", { ascending: false })
    .limit(1000)
  if (error) throw error
  const rows = data || []
  const versionMap = await loadCurrentVersionMap(db, rows.map((row: any) => clean(row.id)))
  return rows.map((row: any) => normalizeTemplate(row, versionMap.get(clean(row.id))))
}

async function loadDetail(db: Db, mailboxId: string, templateId: string) {
  const { data: template, error } = await db
    .from("email_os_mailbox_templates")
    .select("*")
    .eq("mailbox_id", mailboxId)
    .eq("id", templateId)
    .maybeSingle()
  if (error) throw error
  if (!template) return null
  const [{ data: versions }, { data: usage }, { data: audit }] = await Promise.all([
    db.from("email_os_template_versions").select("*").eq("mailbox_id", mailboxId).eq("template_id", templateId).order("version_number", { ascending: false }).limit(100),
    db.from("email_os_template_usage_events").select("*").eq("mailbox_id", mailboxId).eq("template_id", templateId).order("created_at", { ascending: false }).limit(100),
    db.from("email_os_template_audit_events").select("*").eq("mailbox_id", mailboxId).eq("template_id", templateId).order("created_at", { ascending: false }).limit(100)
  ])
  const current = (versions || []).find((row: any) => Number(row.version_number) === Number(template.current_version)) || versions?.[0]
  return {
    template: normalizeTemplate(template, current),
    versions: versions || [],
    usage: usage || [],
    audit: audit || []
  }
}

async function writeAudit(db: Db, input: {
  mailboxId: string
  templateId?: string | null
  templateName?: string | null
  eventType: string
  actor: any
  versionNumber?: number | null
  details?: Record<string, unknown>
}) {
  await db.from("email_os_template_audit_events").insert({
    id: makeEmailOSId(),
    mailbox_id: input.mailboxId,
    template_id: input.templateId || null,
    template_name_snapshot: input.templateName || null,
    event_type: input.eventType,
    actor_user_id: input.actor?.id || null,
    actor_name_snapshot: input.actor?.fullName || input.actor?.name || null,
    version_number: input.versionNumber || null,
    details: input.details || {},
    created_at: nowIso()
  }).then(() => null, () => null)
}

async function nextVersionNumber(db: Db, mailboxId: string, templateId: string) {
  const { data } = await db
    .from("email_os_template_versions")
    .select("version_number")
    .eq("mailbox_id", mailboxId)
    .eq("template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
  return Number(data?.[0]?.version_number || 0) + 1
}

async function createVersion(db: Db, input: {
  mailboxId: string
  templateId: string
  versionNumber: number
  normalized: ReturnType<typeof normalizeInput>
  actorUserId: string
  changeSummary?: string
}) {
  const versionId = makeEmailOSId()
  const row = {
    id: versionId,
    template_id: input.templateId,
    mailbox_id: input.mailboxId,
    version_number: input.versionNumber,
    subject_template: input.normalized.subject,
    body_text: input.normalized.bodyText,
    body_html: input.normalized.bodyHtml || null,
    variables: input.normalized.variables,
    content_hash: contentHash(input.normalized.subject, input.normalized.bodyText, input.normalized.bodyHtml),
    change_summary: input.changeSummary || input.normalized.changeSummary || null,
    created_by_user_id: input.actorUserId,
    created_at: nowIso()
  }
  const { data, error } = await db.from("email_os_template_versions").insert(row).select("*").single()
  if (error) throw error
  return data
}

async function createTemplate(db: Db, context: any, rawInput: TemplateInput, options: { duplicateSuffix?: string; eventType?: string } = {}) {
  const normalized = normalizeInput(rawInput)
  const validation = validateTemplate(normalized)
  if (validation.errors.length) throw new Error(validation.errors.join(" · "))
  const id = makeEmailOSId()
  const now = nowIso()
  const templateCode = options.duplicateSuffix
    ? normalizeCode(`${normalized.templateCode}_${options.duplicateSuffix}`, normalized.name)
    : normalized.templateCode
  const row = {
    id,
    mailbox_id: context.scope.mailboxId,
    template_code: templateCode,
    name: normalized.name,
    description: normalized.description || null,
    category: normalized.category,
    language: normalized.language,
    status: normalized.status,
    tags: normalized.tags,
    default_priority: normalized.defaultPriority,
    default_cc: normalized.defaultCc || null,
    default_bcc: normalized.defaultBcc || null,
    tracking_enabled: normalized.trackingEnabled,
    signature_mode: normalized.signatureMode,
    current_version: 1,
    usage_count: 0,
    created_by_user_id: context.user.id,
    updated_by_user_id: context.user.id,
    published_by_user_id: normalized.status === "published" ? context.user.id : null,
    created_at: now,
    updated_at: now,
    published_at: normalized.status === "published" ? now : null,
    archived_at: normalized.status === "archived" ? now : null
  }
  const { error } = await db.from("email_os_mailbox_templates").insert(row)
  if (error) throw error
  const version = await createVersion(db, {
    mailboxId: context.scope.mailboxId,
    templateId: id,
    versionNumber: 1,
    normalized,
    actorUserId: context.user.id,
    changeSummary: normalized.changeSummary || "Initial version"
  })
  await db.from("email_os_mailbox_templates").update({ current_version_id: version.id }).eq("id", id).eq("mailbox_id", context.scope.mailboxId)
  await writeAudit(db, {
    mailboxId: context.scope.mailboxId,
    templateId: id,
    templateName: normalized.name,
    eventType: options.eventType || "template_created",
    actor: context.operator,
    versionNumber: 1,
    details: { templateCode, status: normalized.status, warnings: validation.warnings }
  })
  return loadDetail(db, context.scope.mailboxId, id)
}

async function updateTemplate(db: Db, context: any, templateId: string, rawInput: TemplateInput, eventType = "template_updated") {
  const normalized = normalizeInput({ ...rawInput, id: templateId })
  const validation = validateTemplate(normalized)
  if (validation.errors.length) throw new Error(validation.errors.join(" · "))
  const detail = await loadDetail(db, context.scope.mailboxId, templateId)
  if (!detail) throw new Error("Template not found in this mailbox")
  const nextVersion = await nextVersionNumber(db, context.scope.mailboxId, templateId)
  const version = await createVersion(db, {
    mailboxId: context.scope.mailboxId,
    templateId,
    versionNumber: nextVersion,
    normalized,
    actorUserId: context.user.id,
    changeSummary: normalized.changeSummary || `Saved version ${nextVersion}`
  })
  const now = nowIso()
  const updates = {
    template_code: normalized.templateCode,
    name: normalized.name,
    description: normalized.description || null,
    category: normalized.category,
    language: normalized.language,
    status: normalized.status,
    tags: normalized.tags,
    default_priority: normalized.defaultPriority,
    default_cc: normalized.defaultCc || null,
    default_bcc: normalized.defaultBcc || null,
    tracking_enabled: normalized.trackingEnabled,
    signature_mode: normalized.signatureMode,
    current_version: nextVersion,
    current_version_id: version.id,
    updated_by_user_id: context.user.id,
    updated_at: now,
    published_by_user_id: normalized.status === "published" ? context.user.id : detail.template.publishedByUserId,
    published_at: normalized.status === "published" ? (detail.template.publishedAt || now) : detail.template.publishedAt,
    archived_at: normalized.status === "archived" ? now : null
  }
  const { error } = await db.from("email_os_mailbox_templates").update(updates).eq("id", templateId).eq("mailbox_id", context.scope.mailboxId)
  if (error) throw error
  await writeAudit(db, {
    mailboxId: context.scope.mailboxId,
    templateId,
    templateName: normalized.name,
    eventType,
    actor: context.operator,
    versionNumber: nextVersion,
    details: { status: normalized.status, warnings: validation.warnings }
  })
  return loadDetail(db, context.scope.mailboxId, templateId)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mailboxId = clean(url.searchParams.get("mailboxId") || url.searchParams.get("mailbox_id"))
    const templateId = clean(url.searchParams.get("templateId") || url.searchParams.get("template_id"))
    const context = await resolveContext(request, mailboxId, "can_read")
    const db = createEmailOSCoreDb()
    const templates = await loadTemplates(db, context.scope.mailboxId)
    const permissions = {
      canUse: Boolean(context.access.assignment?.can_read),
      canCreate: Boolean(context.access.assignment?.can_manage_templates),
      canEdit: Boolean(context.access.assignment?.can_manage_templates),
      canImport: Boolean(context.access.assignment?.can_manage_templates),
      canPublish: Boolean(context.access.assignment?.can_manage_templates),
      canArchive: Boolean(context.access.assignment?.can_manage_templates),
      canDeletePermanent: Boolean(context.access.assignment?.can_manage_templates && context.access.assignment?.can_delete)
    }
    const stats = {
      total: templates.length,
      published: templates.filter((row: any) => row.status === "published").length,
      drafts: templates.filter((row: any) => row.status === "draft").length,
      archived: templates.filter((row: any) => row.status === "archived").length,
      imported: 0,
      usage: templates.reduce((sum: number, row: any) => sum + Number(row.usageCount || 0), 0)
    }
    const { data: recentImports } = await db
      .from("email_os_template_import_jobs")
      .select("*")
      .eq("mailbox_id", context.scope.mailboxId)
      .order("created_at", { ascending: false })
      .limit(10)
    stats.imported = (recentImports || []).reduce((sum: number, row: any) => sum + Number(row.created_rows || 0) + Number(row.updated_rows || 0), 0)
    const detail = templateId ? await loadDetail(db, context.scope.mailboxId, templateId) : null
    return NextResponse.json({
      ok: true,
      data: {
        mailbox: {
          id: context.scope.mailboxId,
          name: context.access.mailbox?.name || context.access.mailbox?.address || context.scope.mailboxId,
          email: context.access.mailbox?.address || ""
        },
        templates,
        stats,
        permissions,
        recentImports: recentImports || [],
        detail,
        knownVariables: Array.from(KNOWN_VARIABLES).sort()
      }
    })
  } catch (error) {
    return accessError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = cleanLower(body.action || "create")
    const mailboxId = clean(body.mailboxId || body.mailbox_id)
    const readOnlyAction = action === "record_usage"
    const context = await resolveContext(request, mailboxId, readOnlyAction ? "can_read" : "can_manage_templates")
    const db = createEmailOSCoreDb()

    if (action === "create") {
      const detail = await createTemplate(db, context, body)
      return NextResponse.json({ ok: true, data: detail })
    }

    if (action === "update") {
      const templateId = clean(body.id || body.templateId || body.template_id)
      if (!templateId) return NextResponse.json({ ok: false, error: "Template id is required" }, { status: 400 })
      const detail = await updateTemplate(db, context, templateId, body)
      return NextResponse.json({ ok: true, data: detail })
    }

    if (action === "duplicate") {
      const templateId = clean(body.id || body.templateId || body.template_id)
      const detail = await loadDetail(db, context.scope.mailboxId, templateId)
      if (!detail) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 })
      const suffix = clean(body.suffix) || `COPY_${Date.now().toString().slice(-6)}`
      const created = await createTemplate(db, context, {
        ...detail.template,
        id: undefined,
        templateCode: `${detail.template.templateCode}_${suffix}`,
        name: clean(body.name) || `${detail.template.name} — Copy`,
        status: "draft",
        changeSummary: `Duplicated from ${detail.template.name}`
      }, { eventType: "template_duplicated" })
      await db.from("email_os_template_usage_events").insert({
        id: makeEmailOSId(), mailbox_id: context.scope.mailboxId, template_id: created?.template?.id,
        version_number: 1, action: "duplicated", actor_user_id: context.user.id, created_at: nowIso()
      }).then(() => null, () => null)
      return NextResponse.json({ ok: true, data: created })
    }

    if (action === "archive" || action === "restore") {
      const templateId = clean(body.id || body.templateId || body.template_id)
      const detail = await loadDetail(db, context.scope.mailboxId, templateId)
      if (!detail) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 })
      const status = action === "archive" ? "archived" : (clean(body.status) || "draft")
      const now = nowIso()
      const { error } = await db.from("email_os_mailbox_templates").update({
        status,
        archived_at: status === "archived" ? now : null,
        updated_by_user_id: context.user.id,
        updated_at: now
      }).eq("id", templateId).eq("mailbox_id", context.scope.mailboxId)
      if (error) throw error
      await writeAudit(db, {
        mailboxId: context.scope.mailboxId, templateId, templateName: detail.template.name,
        eventType: action === "archive" ? "template_archived" : "template_restored",
        actor: context.operator, versionNumber: detail.template.currentVersion
      })
      return NextResponse.json({ ok: true, data: await loadDetail(db, context.scope.mailboxId, templateId) })
    }

    if (action === "restore_version") {
      const templateId = clean(body.id || body.templateId || body.template_id)
      const versionNumber = Number(body.versionNumber || body.version_number)
      const { data: version, error } = await db.from("email_os_template_versions").select("*")
        .eq("mailbox_id", context.scope.mailboxId).eq("template_id", templateId).eq("version_number", versionNumber).maybeSingle()
      if (error) throw error
      if (!version) return NextResponse.json({ ok: false, error: "Version not found" }, { status: 404 })
      const detail = await loadDetail(db, context.scope.mailboxId, templateId)
      if (!detail) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 })
      const updated = await updateTemplate(db, context, templateId, {
        ...detail.template,
        subject: version.subject_template,
        bodyText: version.body_text,
        bodyHtml: version.body_html,
        changeSummary: `Restored from version ${versionNumber}`
      }, "template_version_restored")
      await db.from("email_os_template_usage_events").insert({
        id: makeEmailOSId(), mailbox_id: context.scope.mailboxId, template_id: templateId,
        version_number: versionNumber, action: "restored", actor_user_id: context.user.id, created_at: nowIso()
      }).then(() => null, () => null)
      return NextResponse.json({ ok: true, data: updated })
    }

    if (action === "delete_permanent") {
      if (!context.access.assignment?.can_delete) {
        return NextResponse.json({ ok: false, error: "Permanent template deletion requires delete permission" }, { status: 403 })
      }
      if (clean(body.confirmation) !== "DELETE TEMPLATE") {
        return NextResponse.json({ ok: false, error: "Type DELETE TEMPLATE to confirm permanent deletion" }, { status: 400 })
      }
      const templateId = clean(body.id || body.templateId || body.template_id)
      const detail = await loadDetail(db, context.scope.mailboxId, templateId)
      if (!detail) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 })
      const versionCount = detail.versions.length
      const usageCount = detail.usage.length
      await writeAudit(db, {
        mailboxId: context.scope.mailboxId,
        templateId,
        templateName: detail.template.name,
        eventType: "template_deleted_permanently",
        actor: context.operator,
        versionNumber: detail.template.currentVersion,
        details: { versionCountRemoved: versionCount, usageEventsRemoved: usageCount }
      })
      await db.from("email_os_template_usage_events").delete().eq("mailbox_id", context.scope.mailboxId).eq("template_id", templateId)
      await db.from("email_os_template_versions").delete().eq("mailbox_id", context.scope.mailboxId).eq("template_id", templateId)
      await db.from("email_os_template_import_rows").update({ template_id: null }).eq("mailbox_id", context.scope.mailboxId).eq("template_id", templateId)
      const { error } = await db.from("email_os_mailbox_templates").delete().eq("mailbox_id", context.scope.mailboxId).eq("id", templateId)
      if (error) throw error
      return NextResponse.json({
        ok: true,
        data: {
          deleted: true,
          templateId,
          templateName: detail.template.name,
          mailboxId: context.scope.mailboxId,
          versionCountRemoved: versionCount,
          usageEventsRemoved: usageCount,
          deletedBy: context.operator.fullName,
          deletedAt: nowIso()
        }
      })
    }

    if (action === "record_usage") {
      const templateId = clean(body.id || body.templateId || body.template_id)
      const detail = await loadDetail(db, context.scope.mailboxId, templateId)
      if (!detail) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 })
      const usageAction = ["previewed", "inserted", "sent"].includes(cleanLower(body.usageAction || body.usage_action))
        ? cleanLower(body.usageAction || body.usage_action)
        : "inserted"
      const now = nowIso()
      await db.from("email_os_template_usage_events").insert({
        id: makeEmailOSId(),
        mailbox_id: context.scope.mailboxId,
        template_id: templateId,
        version_number: detail.template.currentVersion,
        action: usageAction,
        message_id: clean(body.messageId || body.message_id) || null,
        outbox_id: clean(body.outboxId || body.outbox_id) || null,
        actor_user_id: context.user.id,
        created_at: now
      })
      await db.from("email_os_mailbox_templates").update({
        usage_count: Number(detail.template.usageCount || 0) + 1,
        last_used_at: now,
        last_used_by_user_id: context.user.id,
        updated_at: now
      }).eq("mailbox_id", context.scope.mailboxId).eq("id", templateId)
      await writeAudit(db, {
        mailboxId: context.scope.mailboxId, templateId, templateName: detail.template.name,
        eventType: `template_${usageAction}`, actor: context.operator, versionNumber: detail.template.currentVersion
      })
      return NextResponse.json({ ok: true, data: { recorded: true, action: usageAction } })
    }

    if (action === "import_csv") {
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : []
      const strategy = VALID_IMPORT_STRATEGIES.has(cleanLower(body.strategy)) ? cleanLower(body.strategy) : "skip_duplicates"
      if (!rows.length) return NextResponse.json({ ok: false, error: "No import rows were provided" }, { status: 400 })
      const jobId = makeEmailOSId()
      const now = nowIso()
      await db.from("email_os_template_import_jobs").insert({
        id: jobId,
        mailbox_id: context.scope.mailboxId,
        file_name: clean(body.fileName || body.file_name) || "templates.csv",
        strategy,
        status: "processing",
        total_rows: rows.length,
        created_by_user_id: context.user.id,
        created_at: now
      })
      const existingTemplates = await loadTemplates(db, context.scope.mailboxId)
      const byCode = new Map<string, any>(existingTemplates.map((row: any) => [cleanLower(row.templateCode), row]))
      const byNameSubject = new Map<string, any>(existingTemplates.map((row: any) => [`${cleanLower(row.name)}|${cleanLower(row.subject)}`, row]))
      const importRows: any[] = []
      const receipt = { total: rows.length, valid: 0, created: 0, updated: 0, skipped: 0, invalid: 0, warnings: 0 }

      for (let index = 0; index < rows.length; index += 1) {
        const raw = rows[index] || {}
        const normalized = normalizeInput(raw)
        const validation = validateTemplate(normalized)
        const codeMatch = byCode.get(cleanLower(normalized.templateCode))
        const contentMatch = byNameSubject.get(`${cleanLower(normalized.name)}|${cleanLower(normalized.subject)}`)
        const duplicate = codeMatch || contentMatch
        let rowStatus = validation.errors.length ? "invalid" : validation.warnings.length ? "warning" : "ready"
        let rowAction = "none"
        let templateId: string | null = null

        if (validation.errors.length) {
          receipt.invalid += 1
        } else {
          receipt.valid += 1
          if (validation.warnings.length) receipt.warnings += 1
          try {
            if (duplicate && (strategy === "skip_duplicates" || strategy === "create_new")) {
              rowStatus = "skipped"
              rowAction = "skipped_duplicate"
              templateId = duplicate.id
              receipt.skipped += 1
            } else if (codeMatch && strategy === "update_matching_codes") {
              const updated = await updateTemplate(db, context, codeMatch.id, { ...raw, templateCode: codeMatch.templateCode }, "template_import_updated")
              rowStatus = "updated"
              rowAction = "updated"
              templateId = updated?.template?.id || codeMatch.id
              receipt.updated += 1
              byNameSubject.set(`${cleanLower(normalized.name)}|${cleanLower(normalized.subject)}`, updated?.template || codeMatch)
            } else {
              const suffix = duplicate && strategy === "create_duplicates" ? `COPY_${index + 1}_${Date.now().toString().slice(-4)}` : undefined
              const created = await createTemplate(db, context, raw, { duplicateSuffix: suffix, eventType: "template_import_created" })
              rowStatus = "created"
              rowAction = "created"
              templateId = created?.template?.id || null
              receipt.created += 1
              if (created?.template) {
                byCode.set(cleanLower(created.template.templateCode), created.template)
                byNameSubject.set(`${cleanLower(created.template.name)}|${cleanLower(created.template.subject)}`, created.template)
              }
            }
          } catch (error) {
            rowStatus = "invalid"
            rowAction = "failed"
            validation.errors.push(error instanceof Error ? error.message : "Import failed")
            receipt.valid = Math.max(0, receipt.valid - 1)
            receipt.invalid += 1
          }
        }

        importRows.push({
          id: makeEmailOSId(),
          job_id: jobId,
          mailbox_id: context.scope.mailboxId,
          row_number: index + 2,
          template_code: normalized.templateCode || null,
          template_name: normalized.name || null,
          row_status: rowStatus,
          row_action: rowAction,
          template_id: templateId,
          errors: validation.errors,
          warnings: validation.warnings,
          created_at: nowIso()
        })
      }

      if (importRows.length) {
        const { error } = await db.from("email_os_template_import_rows").insert(importRows)
        if (error) throw error
      }
      await db.from("email_os_template_import_jobs").update({
        status: "completed",
        valid_rows: receipt.valid,
        created_rows: receipt.created,
        updated_rows: receipt.updated,
        skipped_rows: receipt.skipped,
        invalid_rows: receipt.invalid,
        completed_at: nowIso()
      }).eq("id", jobId).eq("mailbox_id", context.scope.mailboxId)
      await writeAudit(db, {
        mailboxId: context.scope.mailboxId,
        eventType: "template_csv_import_completed",
        actor: context.operator,
        details: { jobId, strategy, fileName: clean(body.fileName || body.file_name), ...receipt }
      })
      return NextResponse.json({
        ok: true,
        data: {
          jobId,
          strategy,
          receipt,
          rows: importRows,
          templates: await loadTemplates(db, context.scope.mailboxId)
        }
      })
    }

    return NextResponse.json({ ok: false, error: `Unsupported template action: ${action}` }, { status: 400 })
  } catch (error) {
    return accessError(error)
  }
}

// Backward-compatible verbs for older Email-OS clients.
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  return POST(new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ ...body, action: "update" }) }))
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}))
  return POST(new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ ...body, action: body.permanent ? "delete_permanent" : "archive" }) }))
}
