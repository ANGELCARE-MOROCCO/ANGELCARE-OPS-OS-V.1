"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Forward,
  Inbox,
  LockKeyhole,
  Mail,
  MailOpen,
  Paperclip,
  PencilLine,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
  Users,
  X,
  RotateCcw,
  Link2,
  Plus,
  LayoutGrid,
  Eye,
  Settings2,
  Trash2,
  AlertTriangle,
  CalendarClock,
  Copy,
  MoreHorizontal,
  ChevronDown,
  MessageSquareText,
  ClipboardCheck,
  History,
  Bot,
  Workflow,
  Flag,
  Building2,
  Activity,
  ArrowUpRight
} from "lucide-react"
import EnterpriseComposeModal from "@/components/email-os-core/EnterpriseComposeModal"
import StorageHealthPanel from "@/components/email-os-core/StorageHealthPanel"
import { EnterpriseDrawer, DrawerSection, DrawerField, DrawerFooter, DrawerMetric, DrawerOption, DrawerCallout, DrawerTimelineItem, DrawerEvidenceBadge, DrawerEmptyState } from "@/components/email-os-core/EnterpriseDrawerSystem"
import MailboxTemplatesStudio from "@/components/email-os-core/MailboxTemplatesStudio"

type MessageRow = any
type TemplateRow = any

type WorkflowResponse = {
  currentUser?: { id?: string; fullName?: string | null; name?: string | null; email?: string | null; role?: string | null; department?: string | null; title?: string | null; initials?: string | null; avatarUrl?: string | null }
  operatorDirectory?: Array<{ id: string; fullName: string; email?: string; role?: string; department?: string; title?: string; initials?: string; avatarUrl?: string; active?: boolean }>
  mailboxScope?: {
    mailboxId?: string
    mailbox?: any
    assignment?: any
    session?: any
  } | null
  mailboxes?: any[]
  messages?: MessageRow[]
  detail?: {
    message?: any
    workflow?: any
    notes?: any[]
    tasks?: any[]
    links?: any[]
    audit?: any[]
  } | null
  notes?: any[]
  tasks?: any[]
  links?: any[]
  audit?: any[]
  slaRules?: any[]
  syncHistory?: any[]
  teamWorkloads?: any[]
  stats?: any
  metrics?: any
  diagnostics?: any
}

type FilterKey =
  | "all"
  | "unread"
  | "unassigned"
  | "assigned_to_me"
  | "team_queue"
  | "waiting_internal"
  | "handoff_needed"
  | "overdue"
  | "has_attachments"
  | "complaints"
  | "partnerships"
  | "b2b"
  | "finance_payment"
  | "recruitment"
  | "archived_resolved"

type SortKey = "newest" | "oldest" | "priority" | "sla_due" | "unassigned_first" | "opened_first" | "contact"

type MailFolderKey =
  | "inbox"
  | "unread"
  | "outbox"
  | "drafts"
  | "scheduled"
  | "failed"
  | "all_mail"
  | "archived"
  | "spam"
  | "trash"
  | "templates"

type ActionToast = {
  id: string
  tone: "success" | "warning" | "error" | "info"
  title: string
  message?: string
  detail?: string
  timestamp: string
}

type CommandTone = "primary" | "decision" | "workflow" | "intelligence" | "success" | "warning" | "danger" | "quiet"

type CommandActionProps = {
  label: string
  description?: string
  currentValue?: string
  badge?: string
  icon: any
  tone?: CommandTone
  onClick: () => void
  busy?: boolean
  disabled?: boolean
  compact?: boolean
}

const BUILTIN_TEMPLATES = [
  { id: "template-partnership-first-response", name: "Partnership first response", category: "partnership", subject: "Re: {{service}} - Partnership request", body: "Bonjour {{first_name}},\n\nMerci pour votre message et votre intérêt pour AngelCare.\n\n{{operator}} a bien reçu votre demande concernant {{service}}. Nous revenons vers vous avec les prochaines étapes opérationnelles.\n\nCordialement,\n{{mailbox}}" },
  { id: "template-b2b-quote-follow-up", name: "B2B quote follow-up", category: "b2b", subject: "Re: Devis {{service}}", body: "Bonjour {{first_name}},\n\nNous faisons suite à votre demande de devis pour {{service}}.\n\n{{operator}} reste disponible pour préciser le périmètre, les délais et les modalités de déploiement.\n\nCordialement,\nAngelCare B2B" },
  { id: "template-candidate-recruitment-response", name: "Candidate/recruitment response", category: "recruitment", subject: "Re: Candidature {{service}}", body: "Bonjour {{first_name}},\n\nMerci pour votre candidature et pour votre intérêt pour AngelCare.\n\nNous examinons votre dossier et reviendrons vers vous dès que possible avec les prochaines étapes.\n\nCordialement,\n{{mailbox}}" },
  { id: "template-parent-client-response", name: "Parent/client response", category: "parent_client", subject: "Re: Votre demande", body: "Bonjour {{first_name}},\n\nMerci pour votre message. Nous avons bien pris en compte votre demande concernant {{service}}.\n\n{{operator}} vous répondra avec les informations utiles dans les meilleurs délais.\n\nCordialement,\nAngelCare" },
  { id: "template-complaint-acknowledgement", name: "Complaint acknowledgement", category: "complaint", subject: "Re: Réclamation {{service}}", body: "Bonjour {{first_name}},\n\nNous accusons réception de votre réclamation concernant {{service}}.\n\nVotre demande est désormais prise en charge par l’équipe {{mailbox}}. Nous reviendrons vers vous avec un suivi précis.\n\nCordialement,\n{{operator}}" },
  { id: "template-payment-invoice-follow-up", name: "Payment/invoice follow-up", category: "finance_payment", subject: "Re: Paiement / facture", body: "Bonjour {{first_name}},\n\nNous faisons suite à votre demande liée à {{service}}.\n\nMerci de nous transmettre les éléments manquants afin que nous puissions finaliser le traitement.\n\nCordialement,\n{{mailbox}}" },
  { id: "template-supplier-request", name: "Supplier request", category: "supplier", subject: "Re: Demande fournisseur", body: "Bonjour {{first_name}},\n\nMerci pour votre message. Nous examinons les informations relatives à {{service}} et revenons vers vous avec la suite à donner.\n\nCordialement,\n{{operator}}" },
  { id: "template-meeting-scheduling", name: "Meeting scheduling", category: "internal", subject: "Re: Planification de réunion", body: "Bonjour {{first_name}},\n\nMerci pour votre disponibilité. Nous proposons de planifier un échange au sujet de {{service}}.\n\nMerci de nous partager vos créneaux.\n\nCordialement,\n{{mailbox}}" },
  { id: "template-missing-information", name: "Missing information request", category: "other", subject: "Re: Informations complémentaires requises", body: "Bonjour {{first_name}},\n\nPour avancer sur {{service}}, il nous manque encore quelques informations.\n\nMerci de nous transmettre les éléments suivants dès que possible.\n\nCordialement,\n{{operator}}" },
  { id: "template-escalation-acknowledgement", name: "Escalation acknowledgement", category: "internal", subject: "Re: Escalade {{service}}", body: "Bonjour {{first_name}},\n\nVotre demande a été escaladée et est désormais suivie de près.\n\nNous assurons un retour opérationnel dès que possible.\n\nCordialement,\nAngelCare" }
]

async function api(path: string, options?: RequestInit) {
  try {
    const res = await fetch(path, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    })
    const json = await res.json().catch(() => ({}))
    return {
      ok: res.ok && json?.ok !== false,
      status: res.status,
      data: json?.data ?? json,
      error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network request failed"
    }
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function decodeMessageHtmlEntities(value: unknown) {
  let output = String(value ?? "")
  for (let pass = 0; pass < 3; pass += 1) {
    const before = output
    output = output
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
    if (output === before) break
  }
  return output
}

function looksLikeHtml(value: unknown) {
  const source = String(value ?? "")
  return /<[a-z][\s\S]*>/i.test(source) || /&lt;\/?[a-z][\s\S]*?&gt;/i.test(source)
}

function stripTrackingPixels(value: unknown) {
  return String(value ?? "")
    .replace(/<img\b[^>]*src=["'][^"']*\/api\/email-os\/tracking\/open\/[^"']*["'][^>]*>/gi, "")
    .replace(/<img\b(?=[^>]*(?:width=["']?1["']?|height=["']?1["']?))[^>]*>/gi, "")
}

function htmlToReadableText(value: unknown) {
  return decodeMessageHtmlEntities(
    stripTrackingPixels(value)
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
      .replace(/<li(?:\s[^>]*)?>/gi, "• ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function resolveMessageBodyFields(row: MessageRow | null | undefined) {
  const diagnosticsContent = row?.diagnostics?.content || row?.diagnostics?.messageContent || {}
  const rawBody = clean(row?.body)
  const explicitHtml = clean(row?.bodyHtml || row?.body_html || row?.html || diagnosticsContent?.bodyHtml || diagnosticsContent?.body_html)
  const explicitText = clean(row?.bodyText || row?.body_text || row?.text || diagnosticsContent?.bodyText || diagnosticsContent?.body_text)
  const bodyHtml = stripTrackingPixels(explicitHtml || (looksLikeHtml(rawBody) ? decodeMessageHtmlEntities(rawBody) : ""))
  const bodyText = explicitText || (bodyHtml ? htmlToReadableText(bodyHtml) : rawBody)
  return {
    bodyHtml: clean(bodyHtml),
    bodyText: clean(bodyText),
    raw: explicitHtml || rawBody || explicitText
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

function formatRelativeMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return "—"
  if (minutes <= 0) return "0 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}


function formatTimeOnly(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(parsed)
}

function formatActivityAge(value?: string | null) {
  if (!value) return "No activity recorded"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "No activity recorded"
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000))
  if (elapsedMinutes < 1) return "Just now"
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`
  const hours = Math.floor(elapsedMinutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function mailboxBusinessPurpose(mailboxName: string, mailboxEmail: string) {
  const identity = `${mailboxName} ${mailboxEmail}`.toLowerCase()
  if (identity.includes("academy") || identity.includes("training")) return "Training, partnerships and academic operations"
  if (identity.includes("b2b") || identity.includes("partner")) return "Institutional partnerships and commercial operations"
  if (identity.includes("rh") || identity.includes("recruit") || identity.includes("people")) return "People, recruitment and workforce operations"
  if (identity.includes("finance") || identity.includes("billing") || identity.includes("payment")) return "Finance, billing and payment operations"
  if (identity.includes("commercial") || identity.includes("sales")) return "Commercial development and client acquisition"
  if (identity.includes("support")) return "Client support and service recovery operations"
  if (identity.includes("montessori")) return "Montessori programmes and learning-material operations"
  if (identity.includes("event")) return "Events, activations and field coordination"
  if (identity.includes("excursion")) return "Excursions, mobility and family experience operations"
  if (identity.includes("home")) return "Home-service coordination and family operations"
  if (identity.includes("carelink")) return "Care delivery, dispatch and mission coordination"
  return "Business communication and operational coordination"
}

function safePercent(part: number, total: number) {
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)))
}

function getMailboxLabel(mailbox?: any) {
  return clean(mailbox?.name || mailbox?.label || mailbox?.address || mailbox?.email || mailbox?.email_address || mailbox?.id || "Mailbox")
}

function getMailboxEmail(mailbox?: any) {
  return clean(mailbox?.address || mailbox?.email || mailbox?.email_address || "")
}

function getRowSubject(row: MessageRow) {
  return clean(row?.subject || "(Sans objet)")
}

function getRowSender(row: MessageRow) {
  if (normalizedSource(row) === "outbox") {
    return clean(row?.toName || row?.to_name || row?.toEmail || row?.to_email || row?.recipient_email || "Destinataire")
  }
  return clean(row?.fromName || row?.from_name || row?.fromEmail || row?.from_email || row?.sender_email || row?.raw?.fromEmail || "Expéditeur inconnu")
}

function getRowSenderEmail(row: MessageRow) {
  if (normalizedSource(row) === "outbox") {
    return clean(row?.toEmail || row?.to_email || row?.recipient_email || "")
  }
  return clean(row?.fromEmail || row?.from_email || row?.sender_email || row?.raw?.fromEmail || "")
}

function getRowFromDisplay(row: MessageRow) {
  return clean(row?.fromName || row?.from_name || row?.mailboxName || row?.mailbox_name || row?.fromEmail || row?.from_email || row?.sender_email || "AngelCare")
}

function getRowFromEmail(row: MessageRow) {
  return clean(row?.fromEmail || row?.from_email || row?.sender_email || row?.raw?.fromEmail || "")
}

function getRowToDisplay(row: MessageRow) {
  return clean(row?.toName || row?.to_name || row?.toEmail || row?.to_email || row?.recipient_email || "—")
}

function getRowBody(row: MessageRow) {
  const content = resolveMessageBodyFields(row)
  return content.bodyText || clean(row?.preview || row?.raw?.text || row?.raw?.html || "")
}

function isUnread(row: MessageRow) {
  return clean(row?.status).toLowerCase() === "new" || clean(row?.status).toLowerCase() === "unread" || !row?.readAt
}

function isOverdue(row: MessageRow) {
  return Boolean(row?.sla?.overdue)
}

function hasAttachments(row: MessageRow) {
  return Boolean(row?.hasAttachments || (Array.isArray(row?.attachments) && row.attachments.length))
}

function normalizedStatus(row: MessageRow) {
  return clean(row?.status || row?.workflowStatus || row?.state).toLowerCase()
}

function normalizedSource(row: MessageRow) {
  const source = clean(row?.source || row?.folderKind || row?.kind).toLowerCase()
  const sourceTable = clean(row?.sourceTable || row?.source_table || row?.table).toLowerCase()
  if (source.includes("outbox") || sourceTable.includes("outbox")) return "outbox"
  if (source.includes("draft") || sourceTable.includes("draft")) return "drafts"
  if (source.includes("saved_draft") || sourceTable.includes("saved_draft")) return "drafts"
  return "inbox"
}

function isPermanentlyDeletedState(row: MessageRow) {
  return Boolean(row?.permanentlyDeletedAt || row?.permanently_deleted_at) || ["deleted_permanent", "permanently_deleted"].includes(normalizedStatus(row))
}

function isTrashState(row: MessageRow) {
  if (isPermanentlyDeletedState(row)) return false
  const status = normalizedStatus(row)
  return ["trash", "trashed", "deleted"].includes(status) || Boolean(row?.deletedAt || row?.deleted_at)
}

function isSpamState(row: MessageRow) {
  if (isPermanentlyDeletedState(row)) return false
  return normalizedStatus(row) === "spam" || Boolean(row?.spamAt || row?.spam_at) || clean(row?.category).toLowerCase() === "spam"
}

function isArchivedState(row: MessageRow) {
  if (isTrashState(row) || isSpamState(row) || isPermanentlyDeletedState(row)) return false
  return ["archived", "resolved"].includes(normalizedStatus(row)) || Boolean(row?.archivedAt || row?.archived_at)
}

function isFailedState(row: MessageRow) {
  const status = normalizedStatus(row)
  return ["failed", "error", "bounced"].includes(status) || Boolean(row?.error || row?.lastError || row?.last_error)
}

function isScheduledState(row: MessageRow) {
  return normalizedStatus(row) === "scheduled" || Boolean(row?.scheduled_at || row?.scheduledAt)
}

function resolveMailFolder(row: MessageRow): MailFolderKey {
  if (isTrashState(row)) return "trash"
  if (isSpamState(row)) return "spam"
  if (isArchivedState(row)) return "archived"
  if (isFailedState(row)) return "failed"
  if (isScheduledState(row)) return "scheduled"
  const source = normalizedSource(row)
  if (source === "outbox") return "outbox"
  if (source === "drafts") return "drafts"
  return "inbox"
}


function isUnreadRow(row: MessageRow | null | undefined) {
  if (!row) return false
  const status = normalizedStatus(row)
  const readAt = clean(row?.readAt || row?.read_at || row?.seenAt || row?.seen_at)
  const explicitRead = row?.isRead === true || row?.is_read === true || row?.read === true || Boolean(readAt)
  const explicitUnread = row?.isUnread === true || row?.is_unread === true || row?.unread === true
  if (status === "read" || status === "seen" || explicitRead) return false
  if (status === "unread" || status === "new" || explicitUnread) return true
  return false
}

function markRowReadLocal(row: MessageRow): MessageRow {
  const now = new Date().toISOString()
  const currentStatus = normalizedStatus(row)
  return {
    ...row,
    status: currentStatus === "new" || currentStatus === "unread" ? "read" : row.status,
    isRead: true,
    is_read: true,
    isUnread: false,
    is_unread: false,
    unread: false,
    readAt: row?.readAt || row?.read_at || now,
    read_at: row?.read_at || row?.readAt || now,
    updatedAt: now,
    updated_at: now
  }
}

function belongsToFolder(row: MessageRow, folder: MailFolderKey) {
  if (folder === "all_mail") return !isPermanentlyDeletedState(row)
  if (folder === "unread") return isUnreadRow(row)
  if (folder === "templates") return false
  return resolveMailFolder(row) === folder
}

function messageDedupeKey(row: MessageRow) {
  const mailbox = clean(row?.mailboxId || row?.mailbox_id)
  const source = clean(row?.source || row?.folderKind || row?.sourceTable)
  const tracking = clean(row?.trackingId || row?.tracking_id || row?.diagnostics?.tracking?.trackingId || row?.diagnostics?.tracking?.tracking_id)
  const provider = clean(row?.provider_message_id || row?.providerMessageId || row?.externalId || row?.external_id)
  const sourceId = clean(row?.sourceId || row?.messageId || row?.id).replace(/^(outbox|draft)-/, "")
  if (tracking) return `${mailbox}:tracking:${tracking}`
  if (provider) return `${mailbox}:provider:${provider}`
  if (sourceId) return `${mailbox}:id:${sourceId}`
  const recipient = clean(row?.toEmail || row?.to_email || row?.fromEmail || row?.from_email).toLowerCase()
  const subject = clean(row?.subject).toLowerCase().replace(/\s+/g, " ")
  const minute = clean(row?.sentAt || row?.sent_at || row?.receivedAt || row?.createdAt || row?.created_at).slice(0, 16)
  return `${mailbox}:${source}:${recipient}:${subject}:${minute}`
}

function rowCompletenessScore(row: MessageRow) {
  return [
    row?.sourceId,
    row?.trackingId || row?.tracking_id,
    row?.provider_message_id || row?.providerMessageId,
    row?.firstOpenedAt || row?.first_opened_at,
    row?.lastOpenedAt || row?.last_opened_at,
    Number(row?.openCount || row?.open_count || 0) > 0,
    row?.body || row?.bodyText || row?.preview,
    row?.sentAt || row?.sent_at
  ].filter(Boolean).length
}

function uniqueMessageRows(rows: MessageRow[]) {
  const byKey = new Map<string, MessageRow>()
  for (const row of rows) {
    const key = messageDedupeKey(row)
    if (!key) continue
    const current = byKey.get(key)
    if (!current || rowCompletenessScore(row) >= rowCompletenessScore(current)) byKey.set(key, row)
  }
  return Array.from(byKey.values())
}

function folderActionModel(folder: MailFolderKey) {
  if (folder === "trash") {
    return {
      primary: "Restore",
      primaryAction: "restore",
      destructive: "Delete permanently",
      destructiveAction: "delete_permanent",
      bulk: [
        { label: "Restore", action: "restore", tone: "success" },
        { label: "Delete forever", action: "delete_permanent", tone: "danger" }
      ]
    }
  }
  if (folder === "spam") {
    return {
      primary: "Not spam",
      primaryAction: "restore",
      destructive: "Trash",
      destructiveAction: "move_trash",
      bulk: [
        { label: "Not spam", action: "restore", tone: "success" },
        { label: "Trash", action: "move_trash", tone: "danger" }
      ]
    }
  }
  if (folder === "archived") {
    return {
      primary: "Restore",
      primaryAction: "restore",
      destructive: "Delete permanently",
      destructiveAction: "delete_permanent",
      bulk: [
        { label: "Restore", action: "restore", tone: "success" },
        { label: "Delete forever", action: "delete_permanent", tone: "danger" }
      ]
    }
  }
  if (folder === "drafts") {
    return {
      primary: "Edit draft",
      primaryAction: "edit_draft",
      destructive: "Delete draft",
      destructiveAction: "move_trash",
      bulk: [
        { label: "Trash", action: "move_trash", tone: "danger" }
      ]
    }
  }
  if (folder === "outbox") {
    return {
      primary: "Duplicate",
      primaryAction: "duplicate",
      destructive: "Delete permanently",
      destructiveAction: "delete_permanent",
      bulk: [
        { label: "Delete forever", action: "delete_permanent", tone: "danger" }
      ]
    }
  }
  return {
    primary: "Archive",
    primaryAction: "archive",
    destructive: "Trash",
    destructiveAction: "move_trash",
    bulk: [
      { label: "Read", action: "mark_read", tone: "neutral" },
      { label: "Unread", action: "mark_unread", tone: "neutral" },
      { label: "Archive", action: "archive", tone: "neutral" },
      { label: "Trash", action: "move_trash", tone: "danger" },
      { label: "Spam", action: "mark_spam", tone: "warning" },
      { label: "Resolve", action: "resolve", tone: "success" }
    ]
  }
}

function statusTone(status: string) {
  const text = clean(status).toLowerCase()
  if (text === "resolved" || text === "archived") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (text === "waiting_client" || text === "waiting_internal") return "bg-amber-50 text-amber-700 border-amber-200"
  if (text === "assigned" || text === "in_progress") return "bg-blue-50 text-blue-700 border-blue-200"
  return "bg-slate-50 text-slate-600 border-slate-200"
}

function priorityTone(priority: string) {
  const text = clean(priority).toLowerCase()
  if (text === "vip" || text === "urgent") return "bg-rose-50 text-rose-700 border-rose-200"
  if (text === "high") return "bg-orange-50 text-orange-700 border-orange-200"
  if (text === "low") return "bg-slate-50 text-slate-600 border-slate-200"
  return "bg-blue-50 text-blue-700 border-blue-200"
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    parent_client: "Parent/client",
    b2b: "B2B",
    partnership: "Partnership",
    recruitment: "Recrutement",
    finance_payment: "Finance / paiement",
    complaint: "Réclamation",
    supplier: "Fournisseur",
    internal: "Interne",
    other: "Autre"
  }
  return map[clean(category)] || clean(category) || "Autre"
}

function humanizeActionValue(value: unknown, fallback = "Not set") {
  const normalized = clean(value)
  if (!normalized) return fallback
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sortMessages(rows: MessageRow[], sort: SortKey) {
  const score = (priority: string) => {
    const p = clean(priority).toLowerCase()
    if (p === "vip") return 5
    if (p === "urgent") return 4
    if (p === "high") return 3
    if (p === "normal") return 2
    return 1
  }

  return [...rows].sort((a, b) => {
    if (sort === "oldest") return new Date(a.receivedAt || a.createdAt || 0).getTime() - new Date(b.receivedAt || b.createdAt || 0).getTime()
    if (sort === "priority") return score(b.priority) - score(a.priority) || new Date(b.receivedAt || b.createdAt || 0).getTime() - new Date(a.receivedAt || a.createdAt || 0).getTime()
    if (sort === "sla_due") return new Date(a.firstResponseDueAt || a.sla?.dueAt || 0).getTime() - new Date(b.firstResponseDueAt || b.sla?.dueAt || 0).getTime()
    if (sort === "unassigned_first") return Number(Boolean(a.ownerUserId)) - Number(Boolean(b.ownerUserId)) || new Date(b.receivedAt || b.createdAt || 0).getTime() - new Date(a.receivedAt || a.createdAt || 0).getTime()
    if (sort === "opened_first") return Number(b.openCount || b.open_count || 0) - Number(a.openCount || a.open_count || 0) || new Date(b.lastOpenedAt || b.last_opened_at || b.receivedAt || b.createdAt || 0).getTime() - new Date(a.lastOpenedAt || a.last_opened_at || a.receivedAt || a.createdAt || 0).getTime()
    if (sort === "contact") return getRowSender(a).localeCompare(getRowSender(b)) || new Date(b.receivedAt || b.createdAt || 0).getTime() - new Date(a.receivedAt || a.createdAt || 0).getTime()
    return new Date(b.receivedAt || b.createdAt || 0).getTime() - new Date(a.receivedAt || a.createdAt || 0).getTime()
  })
}

function bodyView(row: MessageRow, view: "clean" | "plain" | "original") {
  const content = resolveMessageBodyFields(row)
  if (view === "original") return content.raw || content.bodyText
  return content.bodyText
}

function quoteOriginalMessage(row: MessageRow) {
  const lines = [
    "",
    "---------- Message d'origine ----------",
    `De: ${getRowSender(row)} <${getRowSenderEmail(row) || "inconnu"}>`,
    `Date: ${formatDate(row?.receivedAt || row?.createdAt)}`,
    `Objet: ${getRowSubject(row)}`,
    "",
    getRowBody(row)
  ]
  return lines.join("\n")
}

function matchesCategoryFilter(row: MessageRow, filter: FilterKey) {
  if (filter === "all") return true
  if (filter === "unread") return isUnread(row)
  if (filter === "unassigned") return !row?.ownerUserId
  if (filter === "assigned_to_me") return Boolean(row?.ownerUserId || row?.owner_user_id)
  if (filter === "team_queue") return Boolean(row?.ownerUserId || row?.owner_user_id)
  if (filter === "waiting_internal") return normalizedStatus(row) === "waiting_internal"
  if (filter === "handoff_needed") return !row?.ownerUserId || normalizedStatus(row) === "triaged" || normalizedStatus(row) === "new"
  if (filter === "overdue") return isOverdue(row)
  if (filter === "has_attachments") return hasAttachments(row)
  if (filter === "complaints") return clean(row?.category) === "complaint"
  if (filter === "partnerships") return clean(row?.category) === "partnership"
  if (filter === "b2b") return clean(row?.category) === "b2b"
  if (filter === "finance_payment") return clean(row?.category) === "finance_payment"
  if (filter === "recruitment") return clean(row?.category) === "recruitment"
  if (filter === "archived_resolved") return ["archived", "resolved"].includes(clean(row?.status).toLowerCase())
  return true
}

function readyHtml(input: string) {
  return stripTrackingPixels(decodeMessageHtmlEntities(input))
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
}

function renderTemplate(template: TemplateRow, mailboxName: string, operatorName: string, contextRow?: MessageRow | null) {
  const senderName = getRowSender(contextRow || {})
  const firstName = senderName.split(/\s+/).filter(Boolean)[0] || "collaborateur"
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date())
  const replacements: Record<string, string> = {
    "{{contact_name}}": senderName || "collaborateur",
    "{{first_name}}": firstName,
    "{{company}}": "AngelCare",
    "{{company_name}}": "votre organisation",
    "{{parent_name}}": senderName || "parent",
    "{{child_name}}": "votre enfant",
    "{{mailbox}}": mailboxName,
    "{{mailbox_name}}": mailboxName,
    "{{operator}}": operatorName,
    "{{operator_full_name}}": operatorName,
    "{{operator_title}}": "AngelCare",
    "{{date}}": today,
    "{{today_date}}": today,
    "{{follow_up_date}}": today,
    "{{quote_reference}}": "référence à confirmer",
    "{{service}}": getRowSubject(contextRow || {}) || "la demande",
    "{{city}}": "Maroc"
  }
  const subject = clean(template?.subject || template?.subject_template || template?.name || "")
  const htmlFallback = clean(template?.bodyHtml || template?.body_html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
  const body = clean(template?.bodyText || template?.body_text || template?.body || template?.body_template || htmlFallback).replace(/\\n/g, "\n")
  return {
    subject: Object.entries(replacements).reduce((value, [needle, replacement]) => value.replaceAll(needle, replacement), subject),
    body: Object.entries(replacements).reduce((value, [needle, replacement]) => value.replaceAll(needle, replacement), body)
  }
}

type WorkspaceResizePane = "left" | "right"

type WorkspacePaneWidths = {
  left: number
  right: number
}

const EMAIL_OS_WORKSPACE_PANES_STORAGE_KEY = "angelcare:email-os:workspace-pane-widths:v1"
const EMAIL_OS_WORKSPACE_DEFAULT_PANES: WorkspacePaneWidths = { left: 340, right: 340 }
const EMAIL_OS_WORKSPACE_MIN_LEFT = 260
const EMAIL_OS_WORKSPACE_MAX_LEFT = 560
const EMAIL_OS_WORKSPACE_MIN_RIGHT = 320
const EMAIL_OS_WORKSPACE_MAX_RIGHT = 520
const EMAIL_OS_WORKSPACE_MIN_READER = 600
const EMAIL_OS_WORKSPACE_RESIZER_WIDTH = 18

function clampWorkspacePane(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)))
}

function fitWorkspacePanes(widths: WorkspacePaneWidths, containerWidth: number) {
  let left = clampWorkspacePane(widths.left, EMAIL_OS_WORKSPACE_MIN_LEFT, EMAIL_OS_WORKSPACE_MAX_LEFT)
  let right = clampWorkspacePane(widths.right, EMAIL_OS_WORKSPACE_MIN_RIGHT, EMAIL_OS_WORKSPACE_MAX_RIGHT)

  const availableForSidePanes = Math.max(
    EMAIL_OS_WORKSPACE_MIN_LEFT + EMAIL_OS_WORKSPACE_MIN_RIGHT,
    containerWidth - EMAIL_OS_WORKSPACE_MIN_READER - EMAIL_OS_WORKSPACE_RESIZER_WIDTH * 2
  )

  let overflow = left + right - availableForSidePanes
  if (overflow > 0) {
    const rightReduction = Math.min(overflow, right - EMAIL_OS_WORKSPACE_MIN_RIGHT)
    right -= rightReduction
    overflow -= rightReduction
    left = Math.max(EMAIL_OS_WORKSPACE_MIN_LEFT, left - overflow)
  }

  return { left, right }
}

const EMAIL_OS_WORKFLOW_SAFE_MODE = true

export default function ScopedMailboxCommandCenter({ mailboxId }: { mailboxId?: string }) {
  const scoped = Boolean(mailboxId)
  const [data, setData] = useState<WorkflowResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [activeFolder, setActiveFolder] = useState<MailFolderKey>("inbox")
  const [folderRows, setFolderRows] = useState<MessageRow[]>([])
  const [folderLoading, setFolderLoading] = useState(false)
  const [folderNotice, setFolderNotice] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("newest")
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedViewsOpen, setCheckCircle2dViewsOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const defaultSearchFilters = {
    sender: "",
    recipient: "",
    owner: "",
    status: "",
    priority: "",
    category: "",
    opened: "any",
    attachment: "any",
    crm: "any",
    task: "any",
    sla: "any",
    dateFrom: "",
    dateTo: ""
  }
  const [searchFilters, setSearchFilters] = useState(defaultSearchFilters)
  const [bodyMode, setBodyMode] = useState<"clean" | "plain" | "original">("clean")
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [status, setStatus] = useState("Chargement")
  const [toasts, setToasts] = useState<ActionToast[]>([])
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "forward" | "schedule">("compose")
  const [composeSeed, setComposeSeed] = useState<any>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateQuery, setTemplateQuery] = useState("")
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [templateForm, setTemplateForm] = useState({ id: "", name: "", category: "other", subject: "", body: "", language: "fr" })
  const [notesOpen, setNotesOpen] = useState(false)
  const [noteBody, setNoteBody] = useState("")
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueAt: "", priority: "normal", ownerUserId: "", note: "" })
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkForm, setLinkForm] = useState({ entityType: "contact", entityId: "", entityLabel: "", note: "" })
  const [crmQuickOpen, setCrmQuickOpen] = useState(false)
  const [opsCopilotOpen, setOpsCopilotOpen] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [teamOpsOpen, setTeamOpsOpen] = useState(false)
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [handoffForm, setHandoffForm] = useState({ ownerUserId: "", note: "", dueAt: "", priority: "normal" })
  const [ownerSearch, setOwnerSearch] = useState("")
  const [workflowOpen, setWorkflowOpen] = useState<"status" | "priority" | "category" | "assign" | null>(null)
  const [workflowForm, setWorkflowForm] = useState({
    status: "in_progress",
    priority: "high",
    category: "other",
    ownerUserId: "",
    note: ""
  })
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [trackingRefreshAt, setTrackingRefreshAt] = useState<string | null>(null)
  const [trackingStatusDebug, setTrackingStatusDebug] = useState<any>(null)
  const [actionOverflowOpen, setActionOverflowOpen] = useState(false)
  const actionOverflowRef = useRef<HTMLDivElement | null>(null)
  const actionOverflowButtonRef = useRef<HTMLButtonElement | null>(null)
  const autoMarkSelectedReadRef = useRef<Set<string>>(new Set())
  const workspaceRef = useRef<HTMLElement | null>(null)
  const workspaceResizeRef = useRef<{
    pane: WorkspaceResizePane
    startX: number
    startLeft: number
    startRight: number
    containerWidth: number
  } | null>(null)
  const [workspacePaneWidths, setWorkspacePaneWidths] = useState<WorkspacePaneWidths>(EMAIL_OS_WORKSPACE_DEFAULT_PANES)
  const [workspaceResizingPane, setWorkspaceResizingPane] = useState<WorkspaceResizePane | null>(null)
  const [workspacePanePreferencesReady, setWorkspacePanePreferencesReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(EMAIL_OS_WORKSPACE_PANES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const next = fitWorkspacePanes(
          {
            left: Number(parsed?.left || EMAIL_OS_WORKSPACE_DEFAULT_PANES.left),
            right: Number(parsed?.right || EMAIL_OS_WORKSPACE_DEFAULT_PANES.right)
          },
          workspaceRef.current?.getBoundingClientRect().width || window.innerWidth
        )
        setWorkspacePaneWidths(next)
      }
    } catch {
      setWorkspacePaneWidths(EMAIL_OS_WORKSPACE_DEFAULT_PANES)
    } finally {
      setWorkspacePanePreferencesReady(true)
    }
  }, [])

  useEffect(() => {
    if (!workspacePanePreferencesReady) return
    try {
      window.localStorage.setItem(EMAIL_OS_WORKSPACE_PANES_STORAGE_KEY, JSON.stringify(workspacePaneWidths))
    } catch {
      // Local preference persistence is optional; resizing remains fully operational.
    }
  }, [workspacePanePreferencesReady, workspacePaneWidths])

  useEffect(() => {
    function reconcileWorkspaceWidth() {
      const containerWidth = workspaceRef.current?.getBoundingClientRect().width
      if (!containerWidth) return
      setWorkspacePaneWidths((current) => fitWorkspacePanes(current, containerWidth))
    }

    window.addEventListener("resize", reconcileWorkspaceWidth)
    return () => window.removeEventListener("resize", reconcileWorkspaceWidth)
  }, [])

  useEffect(() => {
    if (!workspaceResizingPane) return

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    function handlePointerMove(event: PointerEvent) {
      const session = workspaceResizeRef.current
      if (!session) return

      const delta = event.clientX - session.startX
      const next = session.pane === "left"
        ? { left: session.startLeft + delta, right: session.startRight }
        : { left: session.startLeft, right: session.startRight - delta }

      setWorkspacePaneWidths(fitWorkspacePanes(next, session.containerWidth))
    }

    function finishWorkspaceResize() {
      workspaceResizeRef.current = null
      setWorkspaceResizingPane(null)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", finishWorkspaceResize)
    window.addEventListener("pointercancel", finishWorkspaceResize)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", finishWorkspaceResize)
      window.removeEventListener("pointercancel", finishWorkspaceResize)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }
  }, [workspaceResizingPane])

  useEffect(() => {
    if (!actionOverflowOpen) return

    const focusableSelector = '[role="menuitem"]:not([disabled])'
    requestAnimationFrame(() => {
      const firstItem = actionOverflowRef.current?.querySelector<HTMLElement>(focusableSelector)
      firstItem?.focus()
    })

    function closeOverflow(returnFocus = false) {
      setActionOverflowOpen(false)
      if (returnFocus) requestAnimationFrame(() => actionOverflowButtonRef.current?.focus())
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!actionOverflowRef.current?.contains(event.target as Node)) closeOverflow(false)
    }

    function handleOverflowKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        closeOverflow(true)
        return
      }

      if (event.key !== "Tab") return
      const items = Array.from(actionOverflowRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || [])
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", handleOverflowKeyboard)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", handleOverflowKeyboard)
    }
  }, [actionOverflowOpen])

  function handleBodyModeKey(event: ReactKeyboardEvent<HTMLButtonElement>, mode: "clean" | "plain" | "original") {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const modes: Array<"clean" | "plain" | "original"> = ["clean", "plain", "original"]
    const currentIndex = modes.indexOf(mode)
    const nextMode = event.key === "Home"
      ? modes[0]
      : event.key === "End"
        ? modes[modes.length - 1]
        : modes[(currentIndex + (event.key === "ArrowRight" ? 1 : -1) + modes.length) % modes.length]
    setBodyMode(nextMode)
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-body-mode="${nextMode}"]`)?.focus())
  }

  function beginWorkspaceResize(pane: WorkspaceResizePane, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const containerWidth = workspaceRef.current?.getBoundingClientRect().width
    if (!containerWidth) return

    event.preventDefault()
    workspaceResizeRef.current = {
      pane,
      startX: event.clientX,
      startLeft: workspacePaneWidths.left,
      startRight: workspacePaneWidths.right,
      containerWidth
    }
    setWorkspaceResizingPane(pane)
  }

  function resizeWorkspacePaneBy(pane: WorkspaceResizePane, amount: number) {
    const containerWidth = workspaceRef.current?.getBoundingClientRect().width || window.innerWidth
    setWorkspacePaneWidths((current) => fitWorkspacePanes(
      pane === "left"
        ? { ...current, left: current.left + amount }
        : { ...current, right: current.right + amount },
      containerWidth
    ))
  }

  function handleWorkspaceResizeKey(pane: WorkspaceResizePane, event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 40 : 12
    const directionMultiplier = pane === "left" ? 1 : -1

    if (event.key === "ArrowLeft") {
      event.preventDefault()
      resizeWorkspacePaneBy(pane, -step * directionMultiplier)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      resizeWorkspacePaneBy(pane, step * directionMultiplier)
    } else if (event.key === "Home") {
      event.preventDefault()
      const containerWidth = workspaceRef.current?.getBoundingClientRect().width || window.innerWidth
      setWorkspacePaneWidths((current) => fitWorkspacePanes(
        pane === "left"
          ? { ...current, left: EMAIL_OS_WORKSPACE_MIN_LEFT }
          : { ...current, right: EMAIL_OS_WORKSPACE_MIN_RIGHT },
        containerWidth
      ))
    } else if (event.key === "End") {
      event.preventDefault()
      const containerWidth = workspaceRef.current?.getBoundingClientRect().width || window.innerWidth
      setWorkspacePaneWidths((current) => fitWorkspacePanes(
        pane === "left"
          ? { ...current, left: EMAIL_OS_WORKSPACE_MAX_LEFT }
          : { ...current, right: EMAIL_OS_WORKSPACE_MAX_RIGHT },
        containerWidth
      ))
    }
  }

  function resetWorkspacePane(pane: WorkspaceResizePane) {
    const containerWidth = workspaceRef.current?.getBoundingClientRect().width || window.innerWidth
    setWorkspacePaneWidths((current) => fitWorkspacePanes(
      pane === "left"
        ? { ...current, left: EMAIL_OS_WORKSPACE_DEFAULT_PANES.left }
        : { ...current, right: EMAIL_OS_WORKSPACE_DEFAULT_PANES.right },
      containerWidth
    ))
  }

  function pushToast(toast: Omit<ActionToast, "id" | "timestamp">) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: ActionToast = {
      id,
      timestamp: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()),
      ...toast
    }
    setToasts((current) => [entry, ...current].slice(0, 5))
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, toast.tone === "error" ? 9000 : 6500)
  }

  async function load(nextMessageId?: string | null) {
    setLoading(true)
    setError(null)
    const url = new URL("/api/email-os/workflows", window.location.origin)
    if (mailboxId) url.searchParams.set("mailboxId", mailboxId)
    if (nextMessageId) url.searchParams.set("messageId", nextMessageId)
    const result = await api(url.pathname + url.search)
    setLoading(false)
    if (!result.ok) {
      const message = result.error || "Échec de chargement"
      setError(message)
      pushToast({ tone: "error", title: "Mailbox load failed", message, detail: "The current workspace could not refresh from Email-OS metadata." })
      return
    }

    const payload = result.data as WorkflowResponse
    setData(payload)
    const nextSelected = nextMessageId || payload.detail?.message?.id || payload.messages?.[0]?.id || null
    setSelectedId((current) => current && payload.messages?.some((row) => row.id === current) ? current : nextSelected)
    setStatus(mailboxId ? `Boîte ${payload.mailboxScope?.mailbox?.name || payload.mailboxScope?.mailboxId || "chargée"}` : "Vue globale chargée")
  }

  useEffect(() => {
    // Templates are private to the active mailbox. Clear the parent summary cache
    // immediately when the route mailbox changes; the Studio repopulates it from
    // its own authoritative mailbox-scoped API load when opened.
    setTemplates([])
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailboxId])

  useEffect(() => {
    if (!selectedId) return
    void load(selectedId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    setSelectedIds([])
  }, [activeFolder, filter, query, sort])

  useEffect(() => {
    async function loadMailboxFolder() {
      setFolderNotice(null)
      setSelectedId(null)
      setBodyMode("clean")

      if (activeFolder === "outbox" || activeFolder === "scheduled" || activeFolder === "failed") {
        setFolderLoading(true)
        const result = await api("/api/email-os/outbox")
        setFolderLoading(false)

        if (!result.ok) {
          setFolderRows([])
          setFolderNotice(result.error || "Outbox unavailable")
          return
        }

        const rows = (Array.isArray(result.data) ? result.data : []).map((row: any) => ({
          ...row,
          id: `outbox-${row.id}`,
          sourceId: row.id,
          folderKind: "outbox",
          mailboxId: row.mailbox_id || row.mailboxId || mailboxId,
          subject: row.subject || "(Sans objet)",
          fromName: row.from_name || row.mailbox_name || row.from_email || "AngelCare",
          fromEmail: row.from_email || "",
          toName: row.to_name || row.toName || row.to_email || row.toEmail || "Recipient",
          toEmail: row.to_email || row.toEmail || row.recipient_email || "",
          preview: resolveMessageBodyFields(row).bodyText || row.error || "",
          bodyText: resolveMessageBodyFields(row).bodyText || row.error || "",
          bodyHtml: resolveMessageBodyFields(row).bodyHtml,
          receivedAt: row.sent_at || row.scheduled_at || row.created_at || row.updated_at,
          status: row.status || (row.sent_at ? "sent" : "outbox"),
          priority: row.priority || "normal",
          category: row.category || "outbound",
          trackingEnabled: Boolean(row.tracking_enabled || row.diagnostics?.tracking?.enabled),
          trackingId: row.tracking_id || row.diagnostics?.tracking?.trackingId || row.diagnostics?.tracking?.tracking_id || "",
          firstOpenedAt: row.first_opened_at || row.diagnostics?.tracking?.firstOpenedAt || row.diagnostics?.tracking?.first_opened_at || null,
          lastOpenedAt: row.last_opened_at || row.diagnostics?.tracking?.lastOpenedAt || row.diagnostics?.tracking?.last_opened_at || null,
          openCount: Number(row.open_count || row.diagnostics?.tracking?.openCount || row.diagnostics?.tracking?.open_count || 0)
        }))

        setFolderRows(rows)
        return
      }

      if (activeFolder === "drafts") {
        setFolderLoading(true)
        const url = mailboxId ? `/api/email-os/saved-drafts?mailboxId=${encodeURIComponent(mailboxId)}` : "/api/email-os/saved-drafts"
        const result = await api(url)
        setFolderLoading(false)

        if (!result.ok) {
          setFolderRows([])
          setFolderNotice(result.error || "Drafts unavailable")
          return
        }

        const rows = (Array.isArray(result.data) ? result.data : []).map((row: any) => ({
          ...row,
          id: `draft-${row.id}`,
          sourceId: row.id,
          folderKind: "draft",
          mailboxId: row.mailbox_id || row.mailboxId || mailboxId,
          subject: row.subject || "Draft without subject",
          fromName: row.from_name || row.mailbox_name || row.from_email || "AngelCare",
          fromEmail: row.from_email || "",
          toName: row.to_name || row.toName || row.to_email || row.toEmail || "Draft recipient",
          toEmail: row.to_email || row.toEmail || row.recipient_email || "",
          preview: resolveMessageBodyFields(row).bodyText || "Draft message",
          bodyText: resolveMessageBodyFields(row).bodyText,
          bodyHtml: resolveMessageBodyFields(row).bodyHtml,
          receivedAt: row.updated_at || row.created_at,
          status: "draft",
          priority: row.priority || "normal",
          category: row.category || "draft"
        }))

        setFolderRows(rows)
        return
      }

      if (activeFolder === "templates") {
        setTemplateOpen(true)
      }

      setFolderRows([])
    }

    void loadMailboxFolder()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, mailboxId])

  const currentUser = data?.currentUser || null
  const scopeMailbox = data?.mailboxScope?.mailbox || null
  const sourceMessages = data?.messages || []

  const matchesFolder = (row: MessageRow) => belongsToFolder(row, activeFolder)

  const visibleSourceMessages = sourceMessages.filter((row) => {
    const mailboxMatch = !mailboxId || clean(row.mailboxId) === clean(mailboxId)
    const folderMatch = matchesFolder(row)
    const filterMatch = matchesCategoryFilter(row, filter)
    const haystack = [getRowSender(row), getRowSenderEmail(row), getRowSubject(row), getRowBody(row), clean(row.category), clean(row.status), clean(row.ownerUserId)].join(" ").toLowerCase()
    return mailboxMatch && folderMatch && filterMatch && (!query.trim() || haystack.includes(query.trim().toLowerCase()))
  })

  const mailboxFolderRows = folderRows.filter((row) => {
    const status = clean(row.status).toLowerCase()
    if (activeFolder === "scheduled") return status === "scheduled" || Boolean(row.scheduled_at || row.scheduledAt)
    if (activeFolder === "failed") return status === "failed" || status === "error" || Boolean(row.error)
    const haystack = [getRowSender(row), getRowSenderEmail(row), getRowSubject(row), getRowBody(row), clean(row.category), clean(row.status)].join(" ").toLowerCase()
    return !query.trim() || haystack.includes(query.trim().toLowerCase())
  })

  const resolvedRowsPool = uniqueMessageRows([...sourceMessages, ...folderRows])
  const operatorDirectory = Array.isArray(data?.operatorDirectory) ? data.operatorDirectory : []


function safeAttachmentList(row: MessageRow) {
  const direct = Array.isArray(row?.attachments) ? row.attachments : []
  const raw = Array.isArray(row?.raw?.attachments) ? row.raw.attachments : []
  return [...direct, ...raw].filter(Boolean)
}


  function rowSearchHaystack(row: MessageRow) {
    const attachmentNames = safeAttachmentList(row).map((item: any) => item.filename || item.name || "").join(" ")
    const rowRaw = row?.raw || {}
    const rowMetadata = row?.metadata || row?.metadata_json || rowRaw?.metadata || rowRaw?.metadata_json || {}
    return [
      getRowSender(row),
      getRowSenderEmail(row),
      clean(row.toEmail || row.to_email || row.recipient_email),
      getRowSubject(row),
      getRowBody(row),
      attachmentNames,
      clean(row.category),
      clean(row.status),
      clean(row.priority),
      clean(row.ownerUserId || row.owner_user_id),
      ownerLabel(row),
      sentByLabel(row),
      handledByLabel(row),
      clean(row.linkedEntityLabel || row.linked_entity_label),
      clean(row.linkedEntityType || row.linked_entity_type),
      clean(row.linkedEntityId || row.linked_entity_id),
      clean(rowRaw.entity_label || rowRaw.entity_type || rowRaw.entity_id),
      clean(rowMetadata.entity_label || rowMetadata.entity_type || rowMetadata.entity_id),
      clean(rowRaw.note || rowRaw.notes || rowMetadata.note || rowMetadata.notes),
      clean(rowRaw.task || rowRaw.tasks || rowMetadata.task || rowMetadata.tasks)
    ].join(" ").toLowerCase()
  }

  function matchesAdvancedSearch(row: MessageRow) {
    const sender = getRowSenderEmail(row).toLowerCase()
    const recipient = clean(row.toEmail || row.to_email || row.recipient_email).toLowerCase()
    const owner = [clean(row.ownerUserId || row.owner_user_id), ownerLabel(row)].join(" ").toLowerCase()
    const statusValue = normalizedStatus(row)
    const priorityValue = clean(row.priority).toLowerCase()
    const categoryValue = clean(row.category).toLowerCase()
    const rowDate = new Date(row.receivedAt || row.createdAt || row.updatedAt || 0).getTime()

    if (searchFilters.sender.trim() && !sender.includes(searchFilters.sender.trim().toLowerCase())) return false
    if (searchFilters.recipient.trim() && !recipient.includes(searchFilters.recipient.trim().toLowerCase())) return false
    if (searchFilters.owner.trim() && !owner.includes(searchFilters.owner.trim().toLowerCase())) return false
    if (searchFilters.status && statusValue !== searchFilters.status) return false
    if (searchFilters.priority && priorityValue !== searchFilters.priority) return false
    if (searchFilters.category && categoryValue !== searchFilters.category) return false
    if (searchFilters.opened === "opened" && !isTrackingOpened(row)) return false
    if (searchFilters.opened === "not_opened" && isTrackingOpened(row)) return false
    if (searchFilters.attachment === "yes" && !hasAttachments(row)) return false
    if (searchFilters.attachment === "no" && hasAttachments(row)) return false
    if (searchFilters.crm === "yes" && !clean(row.linkedEntityId || row.linked_entity_id)) return false
    if (searchFilters.crm === "no" && clean(row.linkedEntityId || row.linked_entity_id)) return false
    if (searchFilters.sla === "breach" && slaStatus(row).tone !== "danger") return false
    if (searchFilters.sla === "risk" && slaStatus(row).tone !== "warning") return false
    if (searchFilters.sla === "healthy" && slaStatus(row).tone !== "success") return false
    if (searchFilters.dateFrom && rowDate < new Date(searchFilters.dateFrom).getTime()) return false
    if (searchFilters.dateTo && rowDate > new Date(`${searchFilters.dateTo}T23:59:59`).getTime()) return false
    return true
  }

  const projectFolderRows = (folder: MailFolderKey, options: { useCurrentQuery?: boolean; useCurrentFilter?: boolean } = {}) => {
    const useCurrentQuery = options.useCurrentQuery === true
    const useCurrentFilter = options.useCurrentFilter === true
    return resolvedRowsPool.filter((row) => {
      if (isPermanentlyDeletedState(row)) return false
      if ((folder === "outbox" || folder === "inbox") && (isArchivedState(row) || isTrashState(row) || isSpamState(row))) return false
      if (!belongsToFolder(row, folder)) return false
      if (useCurrentFilter && !matchesCategoryFilter(row, filter)) return false
      if (useCurrentQuery) {
        if (!matchesAdvancedSearch(row)) return false
        const haystack = rowSearchHaystack(row)
        return !query.trim() || query.trim().toLowerCase().split(/\s+/).every((token) => haystack.includes(token))
      }
      return true
    })
  }

  const folderProjectedRows = projectFolderRows(activeFolder, { useCurrentQuery: true, useCurrentFilter: true })
  const messages = sortMessages(folderProjectedRows, sort)
  const selectedRows = messages.filter((row) => selectedIds.includes(row.id))
  const allVisibleSelected = messages.length > 0 && messages.every((row) => selectedIds.includes(row.id))
  const actionModel = folderActionModel(activeFolder)


  const selected = messages.find((row) => row.id === selectedId) || messages[0] || null

  // Auto-reconcile unread/read state when the operator opens an inbox message.
  useEffect(() => {
    if (!selected || activeFolder === "outbox") return
    if (!isUnreadRow(selected)) return
    const selectedKey = clean(selected.id || selected.messageId || selected.sourceId)
    if (!selectedKey || autoMarkSelectedReadRef.current.has(selectedKey)) return
    autoMarkSelectedReadRef.current.add(selectedKey)

    setFolderRows((current) => uniqueMessageRows(current.map((row) => clean(row.id || row.messageId || row.sourceId) === selectedKey ? markRowReadLocal(row) : row)))
    setData((current: any) => current ? {
      ...current,
      messages: Array.isArray(current.messages)
        ? uniqueMessageRows(current.messages.map((row: any) => clean(row.id || row.messageId || row.sourceId) === selectedKey ? markRowReadLocal(row) : row))
        : current.messages
    } : current)

    void performWorkflowAction(selected, "mark_read", { readAt: new Date().toISOString(), source: "open_message" })
  }, [selected?.id, activeFolder])

  const detail = selected?.id && selected?.id === data?.detail?.message?.id ? data?.detail : null
  useEffect(() => {
    if (selectedId && !messages.some((row) => row.id === selectedId)) {
      setSelectedId(messages[0]?.id || null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, messages.length, selectedId])

  const notes = selected && detail ? detail.notes || [] : []
  const tasks = selected && detail ? detail.tasks || [] : []
  const links = selected && detail ? detail.links || [] : []
  const audit = selected && detail ? detail.audit || [] : []
  const stats = data?.stats || {}
  const metrics = data?.metrics || {}
  const syncHistory = data?.syncHistory || []
  const teamWorkloads = data?.teamWorkloads || []

  const aggregateStats = useMemo(() => {
    if (!Array.isArray(stats)) {
      return {
        inbox: stats?.inbox || 0,
        unread: stats?.unread || 0,
        drafts: stats?.drafts || 0,
        outbox: stats?.outbox || 0,
        failed: stats?.failed || 0,
        assigned_to_me: stats?.assigned_to_me || 0,
        overdue: stats?.overdue || 0,
        waiting: stats?.waiting || 0
      }
    }

    return stats.reduce((acc: any, row: any) => {
      acc.inbox += Number(row?.inbox || 0)
      acc.unread += Number(row?.unread || 0)
      acc.drafts += Number(row?.drafts || 0)
      acc.outbox += Number(row?.outbox || 0)
      acc.failed += Number(row?.failed || 0)
      acc.assigned_to_me += Number(row?.assigned_to_me || 0)
      acc.overdue += Number(row?.overdue || 0)
      acc.waiting += Number(row?.waiting || 0)
      return acc
    }, { inbox: 0, unread: 0, drafts: 0, outbox: 0, failed: 0, assigned_to_me: 0, overdue: 0, waiting: 0 })
  }, [stats])

  const folderCounts = {
    inbox: projectFolderRows("inbox").length,
    unread: projectFolderRows("unread").length,
    outbox: projectFolderRows("outbox").length,
    drafts: projectFolderRows("drafts").length,
    scheduled: projectFolderRows("scheduled").length,
    failed: projectFolderRows("failed").length,
    all_mail: projectFolderRows("all_mail").length,
    archived: projectFolderRows("archived").length,
    spam: projectFolderRows("spam").length,
    trash: projectFolderRows("trash").length,
    templates: templates.length
  }

  const mailboxFolders: Array<{ key: MailFolderKey; label: string; count: number; icon: any; disabled?: boolean; helper?: string }> = [
    { key: "inbox", label: "Inbox", count: folderCounts.inbox, icon: Inbox },
    { key: "unread", label: "Unread", count: folderCounts.unread, icon: MailOpen },
    { key: "outbox", label: "Sent / Outbox", count: folderCounts.outbox, icon: Send },
    { key: "drafts", label: "Drafts", count: folderCounts.drafts, icon: FileText },
    { key: "scheduled", label: "Scheduled", count: folderCounts.scheduled, icon: CalendarClock },
    { key: "failed", label: "Failed", count: folderCounts.failed, icon: AlertTriangle },
    { key: "all_mail", label: "All Mail", count: folderCounts.all_mail, icon: Mail },
    { key: "archived", label: "Archived", count: folderCounts.archived, icon: Archive },
    { key: "spam", label: "Spam", count: folderCounts.spam, icon: ShieldCheck, helper: "Spam records" },
    { key: "trash", label: "Trash", count: folderCounts.trash, icon: Trash2, helper: "Trash records" },
    { key: "templates", label: "Templates", count: folderCounts.templates, icon: FileText }
  ]

  const activeFolderMeta = mailboxFolders.find((item) => item.key === activeFolder) || mailboxFolders[0]
  const selectedResolvedFolder = selected ? resolveMailFolder(selected) : activeFolder
  const selectedIsOutbound = selectedResolvedFolder === "outbox" || clean(selected?.direction).toLowerCase() === "outbound"
  const selectedIsInbound = Boolean(selected) && !selectedIsOutbound
  const selectedIsResolved = normalizedStatus(selected) === "resolved"
  const compactCommandRail = workspacePaneWidths.right < 335
  const selectedRecipient = getRowToDisplay(selected || {})

  function workflowMessageId(row: MessageRow | null | undefined) {
    return clean(row?.sourceId || row?.messageId || row?.id).replace(/^(outbox|draft)-/, "")
  }

  function isTrackingOpened(row: MessageRow | null | undefined) {
    return Number(row?.openCount || row?.open_count || 0) > 0 || Boolean(row?.firstOpenedAt || row?.first_opened_at || row?.lastOpenedAt || row?.last_opened_at)
  }

  function trackingLabel(row: MessageRow | null | undefined) {
    if (!row?.trackingEnabled && !row?.tracking_enabled && !row?.trackingId && !row?.tracking_id) return "Tracking off"
    if (isTrackingOpened(row)) {
      const openedAt = row?.lastOpenedAt || row?.last_opened_at || row?.firstOpenedAt || row?.first_opened_at
      return `Opened ${formatDate(openedAt)}${Number(row?.openCount || row?.open_count || 0) ? ` · ${Number(row?.openCount || row?.open_count || 0)} open(s)` : ""}`
    }
    return "Tracking active · not opened yet"
  }

  function trackingTone(row: MessageRow | null | undefined) {
    if (!row?.trackingEnabled && !row?.tracking_enabled && !row?.trackingId && !row?.tracking_id) return "neutral"
    return isTrackingOpened(row) ? "opened" : "waiting"
  }

  function trackingFollowupSuggestion(row: MessageRow | null | undefined) {
    if (!row) return "Select a sent email."
    if (!row?.trackingEnabled && !row?.tracking_enabled) return "Tracking was not enabled for this email."
    if (isTrackingOpened(row)) return "Recipient opened the email. Prepare next follow-up based on the conversation context."
    const age = messageAgeHours(row)
    if (age !== null && age >= 24) return "No open detected after 24h. Create a follow-up task or send a reminder."
    if (age !== null && age >= 6) return "Not opened yet. Monitor and prepare follow-up if no activity continues."
    return "Tracking active. Wait before follow-up."
  }

  async function refreshSelectedTracking() {
    const trackingId = clean(selected?.trackingId || selected?.tracking_id)
    if (!selected || !trackingId) {
      pushToast({ tone: "warning", title: "Tracking unavailable", message: "No tracking id is attached to this sent email." })
      return
    }

    const result = await api(`/api/email-os/tracking/status/${encodeURIComponent(trackingId)}`)
    if (!result.ok) {
      pushToast({ tone: "error", title: "Tracking refresh failed", message: result.error || "Could not read tracking status." })
      return
    }

    const tracking = result.data || {}
    setTrackingStatusDebug(tracking)
    const patch = {
      firstOpenedAt: tracking.firstOpenedAt || null,
      first_opened_at: tracking.firstOpenedAt || null,
      lastOpenedAt: tracking.lastOpenedAt || null,
      last_opened_at: tracking.lastOpenedAt || null,
      openCount: Number(tracking.openCount || 0),
      open_count: Number(tracking.openCount || 0)
    }

    setFolderRows((current) => uniqueMessageRows(current.map((row) => clean(row.trackingId || row.tracking_id) === trackingId ? { ...row, ...patch } : row)))
    setData((current: any) => current ? {
      ...current,
      messages: Array.isArray(current.messages)
        ? uniqueMessageRows(current.messages.map((row: any) => clean(row.trackingId || row.tracking_id) === trackingId ? { ...row, ...patch } : row))
        : current.messages
    } : current)

    setTrackingRefreshAt(new Date().toISOString())
    pushToast({
      tone: tracking.opened ? "success" : "info",
      title: tracking.opened ? "Tracking opened" : "Tracking still waiting",
      message: tracking.opened ? `Opened ${formatDate(tracking.lastOpenedAt || tracking.firstOpenedAt)}` : "No open recorded yet.",
      detail: `${Number(tracking.openCount || 0)} open(s)`
    })
  }


  const filteredTemplates = useMemo(() => {
    const q = templateQuery.toLowerCase().trim()
    return templates.filter((template) => {
      const haystack = [template.name, template.subject, template.subject_template, template.body, template.body_template, template.category].filter(Boolean).join(" ").toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [templates, templateQuery])

  async function performWorkflowAction(row: MessageRow | null | undefined, action: string, payload: Record<string, any> = {}) {
    const messageId = workflowMessageId(row)
    if (!row || !messageId) {
      setStatus("Select a message first")
      return false
    }

    const response = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        action,
        messageId,
        mailboxId: mailboxId || row.mailboxId,
        payload: {
          ...payload,
          mailboxId: mailboxId || row.mailboxId,
          source: row.source || row.folderKind || undefined
        }
      })
    })

    if (!response.ok) {
      const message = response.error || `${action} failed`
      setError(message)
      setStatus(message)
      pushToast({ tone: "error", title: "Action failed", message, detail: action.replace(/_/g, " ") })
      return false
    }

    return true
  }


  function rowMatchesAnyId(row: MessageRow, ids: string[]) {
    const set = new Set(ids.map((id) => clean(id)).filter(Boolean))
    return [
      row?.id,
      row?.messageId,
      row?.sourceId,
      row?.externalId,
      row?.external_id,
      row?.provider_uid,
      row?.providerMessageId,
      row?.provider_message_id,
      row?.trackingId,
      row?.tracking_id
    ].some((value) => set.has(clean(value)))
  }

  function removeRowsLocal(rowsToRemove: MessageRow[]) {
    const ids = rowsToRemove.flatMap((row) => [
      row?.id,
      row?.messageId,
      row?.sourceId,
      row?.externalId,
      row?.external_id,
      row?.provider_uid,
      row?.providerMessageId,
      row?.provider_message_id,
      row?.trackingId,
      row?.tracking_id
    ].map((value) => clean(value)).filter(Boolean))

    setFolderRows((current) => current.filter((row) => !rowMatchesAnyId(row, ids)))
    // sourceMessages is derived from API data; folderRows and data.messages are the mutable UI caches.
    setData((current: any) => current ? {
      ...current,
      messages: Array.isArray(current.messages) ? current.messages.filter((row: any) => !rowMatchesAnyId(row, ids)) : current.messages
    } : current)
  }

  async function runAction(action: string, payload: Record<string, any> = {}) {
    if (!selected?.id) {
      setStatus("Select a message first")
      return
    }

    setBusyAction(action)
    setStatus(`${action.replace(/_/g, " ")} in progress...`)
    const ok = await performWorkflowAction(selected, action, payload)
    setBusyAction(null)

    if (!ok) return

    if (action === "delete_permanent") {
      removeRowsLocal([selected])
      setStatus("Message permanently deleted")
      pushToast({ tone: "success", title: "Deleted permanently", message: "Message removed from Email-OS.", detail: "Source row, workflow rows and attachment metadata were requested for erasure." })
      setSelectedId(null)
      await load(null)
      return
    }

    setStatus("Action saved")
    pushToast({ tone: "success", title: "Action completed", message: action.replace(/_/g, " "), detail: selected?.subject || selected?.preview || undefined })
    setSelectedId(null)
    await load(null)
  }

  function openWorkflowModal(kind: "status" | "priority" | "category" | "assign") {
    if (!selected) return
    if (kind === "assign") setOwnerSearch("")
    setWorkflowForm({
      status: clean(selected.status) || "in_progress",
      priority: clean(selected.priority) || "high",
      category: clean(selected.category) || "other",
      ownerUserId: clean(selected.ownerUserId || currentUser?.id || ""),
      note: ""
    })
    setWorkflowOpen(kind)
  }

  async function submitWorkflowModal() {
    if (!selected || !workflowOpen) return

    const action = workflowOpen === "status"
      ? "set_status"
      : workflowOpen === "priority"
        ? "set_priority"
        : workflowOpen === "category"
          ? "set_category"
          : "assign_owner"

    const payload = workflowOpen === "status"
      ? { status: workflowForm.status, note: workflowForm.note }
      : workflowOpen === "priority"
        ? { priority: workflowForm.priority, note: workflowForm.note }
        : workflowOpen === "category"
          ? { category: workflowForm.category, note: workflowForm.note }
          : { ownerUserId: workflowForm.ownerUserId, note: workflowForm.note }

    await runAction(action, payload)
    setWorkflowOpen(null)
  }

  async function runBulkAction(action: string, payload: Record<string, any> = {}) {
    if (!selectedRows.length) {
      setStatus("Select at least one message")
      return
    }

    if (action === "delete_permanent" && !window.confirm(`Delete ${selectedRows.length} message(s) permanently from Email-OS, including stored attachment references when available? This cannot be undone.`)) return

    setBusyAction(`bulk_${action}`)
    setError(null)
    setStatus(`Applying ${action.replace(/_/g, " ")} to ${selectedRows.length} message(s)...`)

    let success = 0
    for (const row of selectedRows) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await performWorkflowAction(row, action, action === "delete_permanent" ? { ...payload, confirm: true } : payload)
      if (ok) success += 1
    }

    setBusyAction(null)
    if (action === "delete_permanent" && success > 0) {
      removeRowsLocal(selectedRows)
    }
    setSelectedIds([])
    setStatus(`${success}/${selectedRows.length} message(s) updated`)
    pushToast({
      tone: success === selectedRows.length ? "success" : "warning",
      title: action === "delete_permanent" ? "Permanent delete completed" : "Bulk action completed",
      message: `${success}/${selectedRows.length} message(s) updated`,
      detail: action.replace(/_/g, " ")
    })
    setSelectedId(null)
    await load(null)
  }

  async function deleteSelectedMessage() {
    if (!selected) return
    if (activeFolder === "trash") {
      if (!window.confirm("Delete this message permanently? This cannot be undone.")) return
      await runAction("delete_permanent")
      return
    }
    await runAction("move_trash")
    setActiveFolder("trash")
  }

  async function runFolderPrimaryAction() {
    if (!selected) return
    if (actionModel.primaryAction === "edit_draft") {
      setComposeMode("compose")
      setComposeSeed({
        selectedEmail: { ...selected, mailbox_id: mailboxId || selected.mailboxId },
        initialMailboxId: mailboxId || selected.mailboxId || scopeMailbox?.id || "",
        initialSubject: getRowSubject(selected),
        initialBody: getRowBody(selected)
      })
      setComposeOpen(true)
      return
    }
    if (actionModel.primaryAction === "duplicate") {
      setComposeMode("compose")
      setComposeSeed({
        initialMailboxId: mailboxId || selected.mailboxId || scopeMailbox?.id || "",
        initialSubject: getRowSubject(selected),
        initialBody: getRowBody(selected)
      })
      setComposeOpen(true)
      return
    }
    await runAction(actionModel.primaryAction)
  }

  async function runFolderDestructiveAction() {
    if (!selected) return
    if (actionModel.destructiveAction === "delete_permanent" && !window.confirm("Delete permanently from Email-OS including stored attachment references when available? This cannot be undone.")) return
    await runAction(actionModel.destructiveAction, actionModel.destructiveAction === "delete_permanent" ? { confirm: true } : {})
  }


  function openReply() {
    if (!selected) return
    setComposeMode("reply")
    setComposeSeed({
      selectedEmail: {
        ...selected,
        mailbox_id: mailboxId || selected.mailboxId,
        from_email: selected.fromEmail,
        subject: selected.subject
      }
    })
    setComposeOpen(true)
  }

  function openForward() {
    if (!selected) return
    setComposeMode("forward")
    setComposeSeed({
      selectedEmail: {
        ...selected,
        mailbox_id: mailboxId || selected.mailboxId,
        from_email: selected.fromEmail,
        subject: selected.subject,
        body: quoteOriginalMessage(selected)
      },
      initialSubject: `Fwd: ${getRowSubject(selected)}`,
      initialBody: quoteOriginalMessage(selected)
    })
    setComposeOpen(true)
  }

  function openTemplate(template: TemplateRow) {
    const mailboxName = getMailboxLabel(scopeMailbox || selected?.mailbox || {})
    const operatorName = currentUser?.fullName || currentUser?.name || currentUser?.email || "AngelCare"
    const rendered = renderTemplate(template, mailboxName, operatorName, selected)
    setComposeMode("compose")
    setComposeSeed({
      initialSubject: rendered.subject,
      initialBody: `${rendered.body}\n\n${mailboxName}`,
      initialMailboxId: mailboxId || selected?.mailboxId || scopeMailbox?.id || "",
      initialCc: clean(template.defaultCc || template.default_cc),
      initialBcc: clean(template.defaultBcc || template.default_bcc),
      initialPriority: clean(template.defaultPriority || template.default_priority || "normal"),
      initialTracking: template.trackingEnabled !== false && template.tracking_enabled !== false,
      initialTemplateId: clean(template.id),
      initialTemplateVersion: Number(template.currentVersion || template.current_version || 1),
      selectedEmail: selected ? { ...selected, mailbox_id: mailboxId || selected.mailboxId } : null
    })
    setComposeOpen(true)
    setTemplateOpen(false)
  }

    async function syncNow() {
    if (!mailboxId) {
      const message = "La vue globale ne peut synchroniser qu’une boîte assignée"
      setStatus(message)
      pushToast({ tone: "warning", title: "Sync completed with warning", message })
      return
    }

    setBusyAction("sync")
    const result = await api("/api/email-os/sync", {
      method: "POST",
      body: JSON.stringify({ mailboxId, limit: 25 })
    })
    setBusyAction(null)
    if (!result.ok) {
      const message = result.error || "Sync failed"
      setSyncWarning(message)
      setStatus(`Sync skipped: ${message}`)
      pushToast({
        tone: "warning",
        title: "Inbound sync unavailable",
        message,
        detail: "Existing mailbox records remain available. This is a bridge/connectivity issue, not a UI data loss."
      })
      await load(null)
      return
    }
    setSyncWarning(null)

    const fetched = Number(result.data?.fetched ?? result.data?.count ?? 0)
    const inserted = Number(result.data?.inserted || 0)
    const updated = Number(result.data?.updated || 0)
    const skipped = Number(result.data?.skipped || 0)
    const suppressed = Number(result.data?.suppressed || 0)
    const deduplicated = Number(result.data?.deduplicated || 0)

    // The bridge response contains transport previews, not authoritative database rows.
    // Never inject those previews into the actionable inbox because their identifiers
    // are POP3/provider identities rather than email_os_core_inbox primary keys.
    setActiveFolder("inbox")
    setFilter("all")
    setQuery("")
    setSearchFilters(defaultSearchFilters)
    setFolderRows([])
    setSelectedIds([])
    setSelectedId(null)
    autoMarkSelectedReadRef.current.clear()

    setStatus(`Synchronisé: ${fetched} fetched, ${inserted} inserted, ${updated} updated`)
    pushToast({
      tone: "success",
      title: "Sync completed",
      message: `${fetched} message(s) fetched`,
      detail: `${inserted} inserted · ${updated} updated · ${skipped} skipped · ${suppressed} suppressed · ${deduplicated} deduplicated`
    })

    // Reload only persisted source rows. This guarantees every visible record has a
    // real database ID and can safely participate in read/archive/trash workflows.
    await load(null)
  }

  async function lockMailbox() {
    if (!mailboxId) return
    setBusyAction("lock")
    await api("/api/email-os/access/logout-mailbox", {
      method: "POST",
      body: JSON.stringify({ mailboxId })
    })
    setBusyAction(null)
    window.location.href = "/email-os/gate"
  }

  function exportCurrentView() {
    const payload = {
      mailboxId: mailboxId || null,
      exportedAt: new Date().toISOString(),
      user: currentUser,
      messages: messages.map((row) => ({
        id: row.id,
        mailboxId: row.mailboxId,
        subject: row.subject,
        fromEmail: row.fromEmail,
        status: row.status,
        priority: row.priority,
        category: row.category,
        ownerUserId: row.ownerUserId,
        receivedAt: row.receivedAt,
        sla: row.sla
      }))
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `email-os-${mailboxId || "global"}-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function saveTemplate() {
    const method = templateForm.id ? "PATCH" : "POST"
    const result = await api("/api/email-os/templates", {
      method,
      body: JSON.stringify({
        ...templateForm,
        mailboxId: mailboxId || null,
        created_by: currentUser?.id || null
      })
    })
    if (!result.ok) {
      setStatus(result.error || "Template save failed")
      return
    }
    setStatus(templateForm.id ? "Modèle mis à jour" : "Modèle créé")
    setTemplateForm({ id: "", name: "", category: "other", subject: "", body: "", language: "fr" })
    const next = await api(`/api/email-os/templates?mailboxId=${encodeURIComponent(mailboxId || "")}`)
    if (next.ok) setTemplates(Array.isArray(next.data?.templates) ? next.data.templates : [])
  }

  function editTemplate(template: TemplateRow) {
    setTemplateForm({
      id: template.id || "",
      name: template.name || "",
      category: template.category || "other",
      subject: template.subject_template || template.subject || "",
      body: template.body_template || template.body || "",
      language: template.language || "fr"
    })
    setTemplateOpen(true)
    setStatus(`Modèle prêt à être modifié: ${template.name || template.id}`)
  }

  async function archiveTemplate(templateId: string) {
    const result = await api("/api/email-os/templates", {
      method: "DELETE",
      body: JSON.stringify({ id: templateId })
    })
    if (!result.ok) {
      setStatus(result.error || "Template archive failed")
      return
    }
    const next = await api(`/api/email-os/templates?mailboxId=${encodeURIComponent(mailboxId || "")}`)
    if (next.ok) setTemplates(Array.isArray(next.data?.templates) ? next.data.templates : [])
  }

  async function addNote() {
    if (!selected || !noteBody.trim()) return
    setBusyAction("note")
    const result = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({ action: "add_internal_note", messageId: selected.id, mailboxId: mailboxId || selected.mailboxId, payload: { body: noteBody } })
    })
    setBusyAction(null)
    if (!result.ok) {
      setStatus(result.error || "Note failed")
      return
    }
    setNoteBody("")
    setNotesOpen(false)
    pushToast({ tone: "success", title: "Note saved", message: "Internal note attached to the message." })
    await load(selected.id)
  }

  async function createTask() {
    if (!selected || !taskForm.title.trim()) return
    setBusyAction("task")
    const result = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        action: "create_followup_task",
        messageId: selected.id,
        mailboxId: mailboxId || selected.mailboxId,
        payload: taskForm
      })
    })
    setBusyAction(null)
    if (!result.ok) {
      setStatus(result.error || "Task failed")
      return
    }
    setTaskForm({ title: "", description: "", dueAt: "", priority: "normal", ownerUserId: "", note: "" })
    setTaskOpen(false)
    pushToast({ tone: "success", title: "Task created", message: "Follow-up task attached to the message." })
    await load(selected.id)
  }

  async function linkEntity() {
    if (!selected || !linkForm.entityId.trim()) return
    setBusyAction("link")
    const result = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        action: "link_entity",
        messageId: selected.id,
        mailboxId: mailboxId || selected.mailboxId,
        payload: linkForm
      })
    })
    setBusyAction(null)
    if (!result.ok) {
      setStatus(result.error || "Link failed")
      return
    }
    setLinkOpen(false)
    pushToast({ tone: "success", title: "Record linked", message: linkForm.entityLabel || linkForm.entityId })
    await load(selected.id)
  }

  function hoursSince(dateValue: any) {
    const date = dateValue ? new Date(dateValue) : null
    if (!date || Number.isNaN(date.getTime())) return null
    return Math.max(0, Math.round((Date.now() - date.getTime()) / 36_000) / 10)
  }

  function messageAgeHours(row: MessageRow | null | undefined) {
    return hoursSince(row?.receivedAt || row?.createdAt || row?.updatedAt)
  }

  function inferOpsIntent(row: MessageRow | null | undefined) {
    const text = [getRowSubject(row), getRowBody(row), getRowSenderEmail(row)].join(" ").toLowerCase()
    if (text.includes("urgent") || text.includes("réclamation") || text.includes("reclamation") || text.includes("complaint") || text.includes("problème") || text.includes("incident")) {
      return { intent: "complaint_case", label: "Complaint / urgent case", category: "complaint", priority: "urgent", status: "in_progress", slaHours: 2 }
    }
    if (text.includes("devis") || text.includes("quote") || text.includes("tarif") || text.includes("prix")) {
      return { intent: "quote_request", label: "Quote request", category: "b2b", priority: "high", status: "triaged", slaHours: 6 }
    }
    if (text.includes("candidature") || text.includes("cv") || text.includes("recrut")) {
      return { intent: "candidate", label: "Recruitment / candidate", category: "recruitment", priority: "normal", status: "triaged", slaHours: 24 }
    }
    if (text.includes("partenariat") || text.includes("partnership") || text.includes("b2b") || text.includes("école") || text.includes("creche") || text.includes("crèche")) {
      return { intent: "b2b_prospect", label: "B2B opportunity", category: "b2b", priority: "high", status: "triaged", slaHours: 8 }
    }
    if (text.includes("facture") || text.includes("paiement") || text.includes("invoice")) {
      return { intent: "invoice_dossier", label: "Finance / payment", category: "finance_payment", priority: "high", status: "triaged", slaHours: 8 }
    }
    return { intent: "contact", label: "General contact", category: "other", priority: "normal", status: "triaged", slaHours: 24 }
  }

  function slaStatus(row: MessageRow | null | undefined) {
    const profile = inferOpsIntent(row)
    const age = messageAgeHours(row)
    if (age === null) return { tone: "neutral", label: "SLA unknown", detail: "No reliable timestamp", profile }
    if (["resolved", "archived"].includes(normalizedStatus(row))) return { tone: "success", label: "Resolved", detail: "No active SLA pressure", profile }
    if (age >= profile.slaHours) return { tone: "danger", label: "SLA breach", detail: `${age}h old · target ${profile.slaHours}h`, profile }
    if (age >= profile.slaHours * 0.7) return { tone: "warning", label: "SLA risk", detail: `${age}h old · target ${profile.slaHours}h`, profile }
    return { tone: "success", label: "SLA healthy", detail: `${age}h old · target ${profile.slaHours}h`, profile }
  }

  function copilotSummary(row: MessageRow | null | undefined) {
    if (!row) return "Select a message to generate an operational brief."
    const profile = inferOpsIntent(row)
    const body = getRowBody(row).replace(/\s+/g, " ").trim()
    return [
      `Intent: ${profile.label}.`,
      `Recommended category: ${profile.category}.`,
      `Recommended priority: ${profile.priority}.`,
      `Recommended status: ${profile.status}.`,
      `Sender: ${getRowSender(row) || "unknown"} ${getRowSenderEmail(row) || ""}.`.trim(),
      body ? `Context: ${body.slice(0, 220)}${body.length > 220 ? "…" : ""}` : "No body preview available."
    ].join(" ")
  }

  async function applyCopilotTriage() {
    if (!selected) return
    const profile = inferOpsIntent(selected)
    setBusyAction("ops_copilot")
    const actions = [
      ["set_status", { status: profile.status, note: `OPS Copilot triage: ${profile.label}` }],
      ["set_priority", { priority: profile.priority, note: `OPS Copilot priority: ${profile.priority}` }],
      ["set_category", { category: profile.category, note: `OPS Copilot category: ${profile.category}` }]
    ]

    for (const [action, payload] of actions) {
      const ok = await performWorkflowAction(selected, String(action), payload as Record<string, any>)
      if (!ok) {
        setBusyAction(null)
        return
      }
    }

    setBusyAction(null)
    pushToast({ tone: "success", title: "OPS Copilot triage applied", message: profile.label, detail: "Status, priority and category were updated." })
    await load(selected.id)
  }

  async function createCopilotFollowupTask() {
    if (!selected) return
    const profile = inferOpsIntent(selected)
    const due = new Date(Date.now() + profile.slaHours * 60 * 60 * 1000)
    setTaskForm({
      title: `${profile.label} follow-up · ${getRowSubject(selected)}`,
      description: copilotSummary(selected),
      dueAt: due.toISOString().slice(0, 16),
      priority: profile.priority,
      ownerUserId: currentUser?.id || "",
      note: "Generated from OPS Copilot SLA intelligence."
    })
    setTaskOpen(true)
    setOpsCopilotOpen(false)
  }

  function operatorById(userId: unknown) {
    const id = clean(userId)
    if (!id) return null
    return operatorDirectory.find((operator: any) => clean(operator.id) === id) || null
  }

  function resolvedOperatorName(userId: unknown, snapshotName?: unknown) {
    const live = operatorById(userId)
    return clean(live?.fullName || snapshotName || live?.email || "")
  }

  function ownerLabel(row: MessageRow | null | undefined) {
    const userId = clean(row?.ownerUserId || row?.owner_user_id)
    return resolvedOperatorName(userId, row?.ownerName || row?.owner_name || row?.ownerUserName || row?.owner_user_name) || "Unassigned"
  }

  function sentByLabel(row: MessageRow | null | undefined) {
    return resolvedOperatorName(row?.sentByUserId || row?.sent_by_user_id, row?.sentByName || row?.sent_by_name) || "Mailbox automation"
  }

  function handledByLabel(row: MessageRow | null | undefined) {
    return resolvedOperatorName(row?.lastHandledByUserId || row?.last_handled_by_user_id, row?.lastHandledByName || row?.last_handled_by_name) || "No operator action yet"
  }

  function teamOwnerKey(row: MessageRow | null | undefined) {
    return clean(row?.ownerUserId || row?.owner_user_id || "unassigned")
  }

  function teamQueueRows() {
    return projectFolderRows("all_mail")
      .filter((row) => !isPermanentlyDeletedState(row))
      .filter((row) => !["resolved", "archived"].includes(normalizedStatus(row)))
  }

  function teamQueueSummary() {
    const rows = teamQueueRows()
    const unassigned = rows.filter((row) => !teamOwnerKey(row) || teamOwnerKey(row) === "unassigned")
    const assigned = rows.filter((row) => teamOwnerKey(row) && teamOwnerKey(row) !== "unassigned")
    const waitingInternal = rows.filter((row) => normalizedStatus(row) === "waiting_internal")
    const urgent = rows.filter((row) => ["urgent", "critical", "vip", "high"].includes(clean(row.priority).toLowerCase()))
    return {
      total: rows.length,
      unassigned: unassigned.length,
      assigned: assigned.length,
      waitingInternal: waitingInternal.length,
      urgent: urgent.length,
      overdue: rows.filter((row) => isOverdue(row) || slaStatus(row).tone === "danger").length
    }
  }

  function ownerWorkloadItems() {
    const map = new Map<string, { id: string; title: string; body: string; meta: string; count: number; urgent: number; overdue: number; email?: string; role?: string; department?: string }>()
    for (const operator of operatorDirectory) {
      const workload = teamWorkloads.find((row: any) => clean(row.user_id || row.owner_user_id || row.id) === clean(operator.id)) || {}
      const count = Number(workload.active_count || 0)
      const urgent = Number(workload.urgent_count || 0)
      const overdue = Number(workload.overdue_count || 0)
      map.set(clean(operator.id), {
        id: clean(operator.id),
        title: clean(operator.fullName || operator.email),
        email: clean(operator.email),
        role: clean(operator.title || operator.role),
        department: clean(operator.department),
        body: [clean(operator.title || operator.role), clean(operator.department), clean(operator.email)].filter(Boolean).join(" · "),
        meta: overdue ? `${overdue} overdue` : `${count} active · ${urgent} urgent/high`,
        count,
        urgent,
        overdue
      })
    }
    const unassignedRows = teamQueueRows().filter((row) => !teamOwnerKey(row) || teamOwnerKey(row) === "unassigned")
    if (unassignedRows.length) {
      const overdue = unassignedRows.filter((row) => isOverdue(row) || slaStatus(row).tone === "danger").length
      const urgent = unassignedRows.filter((row) => ["urgent", "critical", "vip", "high"].includes(clean(row.priority).toLowerCase())).length
      map.set("unassigned", {
        id: "unassigned",
        title: "Unassigned queue",
        body: "Messages awaiting a responsible AngelCare operator",
        meta: overdue ? `${overdue} overdue` : `${unassignedRows.length} active · ${urgent} urgent/high`,
        count: unassignedRows.length,
        urgent,
        overdue
      })
    }
    const search = ownerSearch.trim().toLowerCase()
    return Array.from(map.values())
      .filter((item) => !search || [item.title, item.email, item.role, item.department].join(" ").toLowerCase().includes(search))
      .sort((left, right) => left.overdue - right.overdue || left.count - right.count || left.title.localeCompare(right.title))
  }

  function openHandoff() {
    if (!selected) return
    setOwnerSearch("")
    setHandoffForm({
      ownerUserId: clean(selected.ownerUserId || selected.owner_user_id || currentUser?.id || ""),
      note: `Handoff from Email-OS: ${getRowSubject(selected)}`,
      dueAt: "",
      priority: clean(selected.priority) || "normal"
    })
    setHandoffOpen(true)
  }

  async function submitHandoff() {
    if (!selected) return
    setBusyAction("handoff")
    const assignOk = await performWorkflowAction(selected, "assign_owner", {
      ownerUserId: handoffForm.ownerUserId,
      note: handoffForm.note || "Email handoff"
    })
    if (!assignOk) {
      setBusyAction(null)
      return
    }

    if (handoffForm.note.trim()) {
      await performWorkflowAction(selected, "add_internal_note", {
        body: handoffForm.note,
        visibility: "internal",
        source: "team-handoff"
      })
    }

    if (handoffForm.dueAt) {
      await performWorkflowAction(selected, "create_followup_task", {
        title: `Handoff follow-up · ${getRowSubject(selected)}`,
        description: handoffForm.note || "Team handoff follow-up",
        dueAt: handoffForm.dueAt,
        priority: handoffForm.priority,
        ownerUserId: handoffForm.ownerUserId,
        note: "Generated from Team Operations handoff."
      })
    }

    setBusyAction(null)
    setHandoffOpen(false)
    pushToast({ tone: "success", title: "Handoff completed", message: resolvedOperatorName(handoffForm.ownerUserId) || "Assigned operator", detail: "Assignment, identity snapshot, note and optional task were persisted." })
    await load(selected.id)
  }

  function selectedContactEmail() {
    return getRowSenderEmail(selected) || clean(selected?.toEmail || selected?.to_email || "")
  }

  function selectedContactName() {
    return getRowSender(selected) || selectedContactEmail().split("@")[0] || "Contact"
  }

  function inferredEntityType() {
    const text = [getRowSubject(selected), getRowBody(selected), selectedContactEmail()].join(" ").toLowerCase()
    if (text.includes("candidature") || text.includes("cv") || text.includes("recrut")) return "candidate"
    if (text.includes("devis") || text.includes("quote") || text.includes("tarif") || text.includes("prix")) return "quote_request"
    if (text.includes("facture") || text.includes("paiement") || text.includes("invoice")) return "invoice_dossier"
    if (text.includes("réclamation") || text.includes("reclamation") || text.includes("complaint") || text.includes("urgent")) return "support_case"
    if (text.includes("partenariat") || text.includes("partnership") || text.includes("b2b")) return "b2b_prospect"
    if (text.includes("fournisseur") || text.includes("supplier")) return "supplier"
    return "contact"
  }

  function openSmartLink(entityType?: string) {
    if (!selected) return
    const type = entityType || inferredEntityType()
    const email = selectedContactEmail()
    const name = selectedContactName()
    setLinkForm({
      entityType: type,
      entityId: email || workflowMessageId(selected),
      entityLabel: name || getRowSubject(selected),
      note: `Linked from Email-OS message: ${getRowSubject(selected)}`
    })
    setLinkOpen(true)
  }

  async function quickConvert(entityType: string) {
    if (!selected) return
    const email = selectedContactEmail()
    const name = selectedContactName()
    const labelMap: Record<string, string> = {
      contact: "Contact timeline",
      parent_client: "Parent / client dossier",
      b2b_prospect: "B2B prospect",
      quote_request: "Quote request",
      support_case: "Support case",
      complaint_case: "Complaint case",
      candidate: "Candidate file",
      supplier: "Supplier dossier"
    }

    const payload = {
      entityType,
      entityId: email || `${entityType}-${workflowMessageId(selected)}`,
      entityLabel: `${labelMap[entityType] || entityType}: ${name || getRowSubject(selected)}`,
      note: `Created from Email-OS. Subject: ${getRowSubject(selected)}. Sender: ${name} ${email}`.trim()
    }

    setBusyAction(`convert_${entityType}`)
    const result = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        action: "link_entity",
        messageId: selected.id,
        mailboxId: mailboxId || selected.mailboxId,
        payload
      })
    })
    setBusyAction(null)

    if (!result.ok) {
      setStatus(result.error || "Conversion failed")
      pushToast({ tone: "error", title: "Conversion failed", message: result.error || entityType })
      return
    }

    pushToast({ tone: "success", title: "Email converted", message: payload.entityLabel, detail: "CRM link created and attached to this message." })
    setCrmQuickOpen(false)
    await load(selected.id)
  }

  function contactTimelineItems() {
    const email = selectedContactEmail().toLowerCase()
    if (!email) return []
    return resolvedRowsPool
      .filter((row) => [getRowSenderEmail(row), clean(row.toEmail || row.to_email)].join(" ").toLowerCase().includes(email))
      .slice(0, 8)
      .map((row) => ({
        id: row.id,
        title: getRowSubject(row),
        body: getRowBody(row).slice(0, 120) || "—",
        meta: formatDate(row?.receivedAt || row?.createdAt || row?.updatedAt)
      }))
  }

  function entityTimelineItems() {
    if (!selected) return []
    const email = selectedContactEmail().toLowerCase()
    const entityId = clean(selected.linkedEntityId || selected.linked_entity_id)
    return resolvedRowsPool
      .filter((row) => {
        const haystack = [getRowSenderEmail(row), clean(row.toEmail || row.to_email), clean(row.linkedEntityId || row.linked_entity_id), clean(row.linkedEntityLabel || row.linked_entity_label)].join(" ").toLowerCase()
        return (email && haystack.includes(email)) || (entityId && haystack.includes(entityId.toLowerCase()))
      })
      .slice(0, 12)
      .map((row) => ({
        id: row.id,
        title: getRowSubject(row),
        body: `${getRowSender(row)} · ${clean(row.status) || "message"} · ${getRowBody(row).slice(0, 100) || "—"}`,
        meta: formatDate(row?.receivedAt || row?.createdAt || row?.updatedAt)
      }))
  }

  function applyCheckCircle2dView(view: string) {
    setSearchFilters({
      sender: "",
      recipient: "",
      owner: "",
      status: "",
      priority: "",
      category: "",
      opened: "any",
      attachment: "any",
      crm: "any",
      task: "any",
      sla: "any",
      dateFrom: "",
      dateTo: ""
    })
    setQuery("")

    if (view === "urgent_mine") {
      setFilter("assigned_to_me")
      setSort("priority")
      setSearchFilters((current) => ({ ...current, priority: "urgent" }))
    }
    if (view === "unassigned_today") {
      setFilter("unassigned")
      setSort("newest")
      setSearchFilters((current) => ({ ...current, dateFrom: new Date().toISOString().slice(0, 10) }))
    }
    if (view === "opened_no_reply") {
      setActiveFolder("outbox")
      setFilter("all")
      setSort("opened_first")
      setSearchFilters((current) => ({ ...current, opened: "opened" }))
    }
    if (view === "quote_requests") {
      setFilter("b2b")
      setSearchFilters((current) => ({ ...current, category: "b2b" }))
      setQuery("devis quote prix tarif")
    }
    if (view === "complaints") {
      setFilter("complaints")
      setSearchFilters((current) => ({ ...current, category: "complaint", sla: "breach" }))
    }
    if (view === "recruitment") {
      setFilter("recruitment")
      setSearchFilters((current) => ({ ...current, category: "recruitment" }))
    }
    if (view === "waiting_internal") {
      setFilter("waiting_internal")
      setSearchFilters((current) => ({ ...current, status: "waiting_internal" }))
    }
    if (view === "overdue_followups") {
      setFilter("overdue")
      setSort("sla_due")
      setSearchFilters((current) => ({ ...current, sla: "breach" }))
    }
    setCheckCircle2dViewsOpen(false)
  }

  function exportCsv() {
    const columns = ["id", "mailboxId", "subject", "sender", "senderEmail", "recipient", "status", "priority", "category", "ownerUserId", "ownerName", "sentByName", "lastHandledByName", "receivedAt", "opened", "openCount"]
    const rows = messages.map((row) => [
      row.id,
      row.mailboxId,
      getRowSubject(row),
      getRowSender(row),
      getRowSenderEmail(row),
      clean(row.toEmail || row.to_email || row.recipient_email),
      clean(row.status),
      clean(row.priority),
      clean(row.category),
      clean(row.ownerUserId || row.owner_user_id),
      ownerLabel(row),
      sentByLabel(row),
      handledByLabel(row),
      row.receivedAt || row.createdAt || "",
      isTrackingOpened(row) ? "yes" : "no",
      String(Number(row.openCount || row.open_count || 0))
    ])
    const csv = [columns, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `email-os-search-${mailboxId || "global"}-${Date.now()}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const lastSync = data?.metrics?.lastSync || data?.syncHistory?.[0] || null

  const mailboxHeader = scoped
    ? {
        name: getMailboxLabel(scopeMailbox),
        email: getMailboxEmail(scopeMailbox),
        source: "windows-bridge-pop3",
        lockLabel: data?.mailboxScope?.session?.status === "active" ? "Déverrouillée" : "Verrouillée"
      }
    : {
        name: "AngelCare Email-OS",
        email: "Vue globale",
        source: "Global oversight",
        lockLabel: "Admin"
      }

  const heroMessages = Array.isArray(data?.messages) ? data.messages : []
  const heroInboxRows = heroMessages.filter((row: any) => resolveMailFolder(row) === "inbox")
  const heroOutboxRows = heroMessages.filter((row: any) => resolveMailFolder(row) === "outbox")
  const heroAssignedRows = heroInboxRows.filter((row: any) => clean(row?.ownerUserId || row?.owner_user_id))
  const heroUnassignedCount = Math.max(0, heroInboxRows.length - heroAssignedRows.length)
  const latestInbound = heroInboxRows.slice().sort((left: any, right: any) =>
    new Date(right?.receivedAt || right?.createdAt || right?.updatedAt || 0).getTime() -
    new Date(left?.receivedAt || left?.createdAt || left?.updatedAt || 0).getTime()
  )[0] || null
  const latestOutbound = heroOutboxRows.slice().sort((left: any, right: any) =>
    new Date(right?.sentAt || right?.sent_at || right?.createdAt || right?.updatedAt || 0).getTime() -
    new Date(left?.sentAt || left?.sent_at || left?.createdAt || left?.updatedAt || 0).getTime()
  )[0] || null

  const lastSyncAt = clean(lastSync?.created_at || lastSync?.timestamp || lastSync?.started_at)
  const activeOperationalCount = Math.max(Number(aggregateStats.inbox || 0), heroInboxRows.length)
  const slaControlledCount = Math.max(0, activeOperationalCount - Number(aggregateStats.overdue || 0))
  const slaControlRate = safePercent(slaControlledCount, activeOperationalCount)
  const assignmentCoverage = safePercent(heroAssignedRows.length, heroInboxRows.length)
  const deliveryIntegrity = Number(aggregateStats.failed || 0) === 0
  const mailboxPurpose = mailboxBusinessPurpose(mailboxHeader.name, mailboxHeader.email)
  const currentOperatorLabel = clean(currentUser?.fullName || currentUser?.name || currentUser?.email || "Current operator")
  const mailboxHealthState = error
    ? "degraded"
    : busyAction === "sync"
      ? "syncing"
      : Number(aggregateStats.failed || 0) > 0
        ? "attention"
        : lastSyncAt
          ? "operational"
          : "awaiting"

  const mailboxHealthLabel = mailboxHealthState === "degraded"
    ? "Intervention required"
    : mailboxHealthState === "syncing"
      ? "Synchronizing"
      : mailboxHealthState === "attention"
        ? "Operational attention"
        : mailboxHealthState === "operational"
          ? "Operational"
          : "Awaiting first sync"

  const mailboxHealthTone: "success" | "warning" | "danger" | "info" =
    mailboxHealthState === "degraded"
      ? "danger"
      : mailboxHealthState === "attention" || mailboxHealthState === "awaiting"
        ? "warning"
        : mailboxHealthState === "syncing"
          ? "info"
          : "success"

  const heroBriefingSignals: Array<{
    title: string
    detail: string
    tone: "blue" | "violet" | "amber" | "rose" | "green"
    icon: any
  }> = []

  if (Number(aggregateStats.failed || 0) > 0) {
    heroBriefingSignals.push({
      title: `${aggregateStats.failed} delivery issue${Number(aggregateStats.failed) === 1 ? "" : "s"}`,
      detail: "Outbound delivery requires operator review.",
      tone: "rose",
      icon: AlertTriangle
    })
  }
  if (Number(aggregateStats.overdue || 0) > 0) {
    heroBriefingSignals.push({
      title: `${aggregateStats.overdue} overdue commitment${Number(aggregateStats.overdue) === 1 ? "" : "s"}`,
      detail: "SLA attention is required in the active queue.",
      tone: "rose",
      icon: Clock3
    })
  }
  if (Number(aggregateStats.unread || 0) > 0) {
    heroBriefingSignals.push({
      title: `${aggregateStats.unread} unread conversation${Number(aggregateStats.unread) === 1 ? "" : "s"}`,
      detail: "Messages are waiting for an initial operator review.",
      tone: "blue",
      icon: MailOpen
    })
  }
  if (heroUnassignedCount > 0) {
    heroBriefingSignals.push({
      title: `${heroUnassignedCount} unassigned conversation${heroUnassignedCount === 1 ? "" : "s"}`,
      detail: "Ownership can be allocated from the workflow command deck.",
      tone: "violet",
      icon: UserCheck
    })
  }
  if (Number(aggregateStats.waiting || 0) > 0) {
    heroBriefingSignals.push({
      title: `${aggregateStats.waiting} waiting conversation${Number(aggregateStats.waiting) === 1 ? "" : "s"}`,
      detail: "A client or internal response is still pending.",
      tone: "amber",
      icon: Clock3
    })
  }
  if (!heroBriefingSignals.length) {
    heroBriefingSignals.push({
      title: "Mailbox operations are under control",
      detail: "No unread, overdue, failed or unassigned work requires immediate attention.",
      tone: "green",
      icon: CheckCircle2
    })
  }

  const primaryBriefingRisk =
    Number(aggregateStats.failed || 0) +
    Number(aggregateStats.overdue || 0) +
    Number(aggregateStats.unread || 0) +
    heroUnassignedCount

  const heroKpis: Array<{
    key: string
    label: string
    value: number
    description: string
    icon: any
    tone: "blue" | "violet" | "cyan" | "slate" | "amber" | "rose" | "green" | "indigo"
    onClick?: () => void
  }> = [
    {
      key: "inbox",
      label: "Inbox",
      value: folderCounts.inbox,
      description: folderCounts.inbox ? "Active inbound conversations" : "No active inbound work",
      icon: Inbox,
      tone: "blue",
      onClick: () => { setActiveFolder("inbox"); setFilter("all") }
    },
    {
      key: "unread",
      label: "Unread",
      value: folderCounts.unread,
      description: folderCounts.unread ? "Requiring operator review" : "Nothing waiting for review",
      icon: MailOpen,
      tone: folderCounts.unread ? "violet" : "green",
      onClick: () => { setActiveFolder("unread"); setFilter("all") }
    },
    {
      key: "drafts",
      label: "Drafts",
      value: folderCounts.drafts,
      description: folderCounts.drafts ? "Pending composition work" : "No unfinished drafts",
      icon: FileText,
      tone: "slate",
      onClick: () => { setActiveFolder("drafts"); setFilter("all") }
    },
    {
      key: "outbox",
      label: "Outbox",
      value: folderCounts.outbox,
      description: folderCounts.outbox ? "Sent and queued records" : "No outbound records",
      icon: Send,
      tone: "cyan",
      onClick: () => { setActiveFolder("outbox"); setFilter("all") }
    },
    {
      key: "failed",
      label: "Failed",
      value: folderCounts.failed,
      description: folderCounts.failed ? "Delivery intervention required" : "Delivery integrity protected",
      icon: AlertTriangle,
      tone: folderCounts.failed ? "rose" : "green",
      onClick: () => { setActiveFolder("failed"); setFilter("all") }
    },
    {
      key: "mine",
      label: "Mine",
      value: Number(aggregateStats.assigned_to_me || 0),
      description: Number(aggregateStats.assigned_to_me || 0) ? "Assigned to your operating scope" : "No personal assignments",
      icon: UserCheck,
      tone: "indigo",
      onClick: () => { setActiveFolder("inbox"); setFilter("assigned_to_me") }
    },
    {
      key: "overdue",
      label: "Overdue",
      value: Number(aggregateStats.overdue || 0),
      description: Number(aggregateStats.overdue || 0) ? "Commitments currently at risk" : "No SLA breach detected",
      icon: Clock3,
      tone: Number(aggregateStats.overdue || 0) ? "rose" : "green",
      onClick: () => { setActiveFolder("inbox"); setFilter("overdue") }
    },
    {
      key: "waiting",
      label: "Waiting",
      value: Number(aggregateStats.waiting || 0),
      description: Number(aggregateStats.waiting || 0) ? "Responses still pending" : "No waiting conversations",
      icon: Activity,
      tone: Number(aggregateStats.waiting || 0) ? "amber" : "slate",
      onClick: () => { setActiveFolder("inbox"); setFilter("waiting_internal") }
    }
  ]

  const folderCommandGroups: Array<{
    label: string
    tone: "mail" | "control" | "tools"
    items: typeof mailboxFolders
  }> = [
    {
      label: "Mail",
      tone: "mail",
      items: mailboxFolders.filter((folder) => ["inbox", "unread", "outbox", "drafts", "scheduled"].includes(folder.key))
    },
    {
      label: "Control",
      tone: "control",
      items: mailboxFolders.filter((folder) => ["failed", "all_mail", "archived", "spam", "trash"].includes(folder.key))
    },
    {
      label: "Tools",
      tone: "tools",
      items: mailboxFolders.filter((folder) => folder.key === "templates")
    }
  ]

  const drawerInputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
  const drawerTextareaClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
  const selectedMessageContext = selected ? {
    subject: getRowSubject(selected),
    sender: `${getRowSender(selected)} · ${getRowSenderEmail(selected)}`,
    recipient: clean(selected.toEmail || selected.to_email || selected.recipient_email || selected.recipientEmail),
    owner: ownerLabel(selected),
    status: normalizedStatus(selected),
    priority: clean(selected.priority) || "normal",
    timestamp: formatDate(selected.receivedAt || selected.received_at || selected.sentAt || selected.sent_at || selected.createdAt || selected.created_at),
    mailbox: mailboxHeader.name
  } : undefined

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <div className="w-full px-3 py-3 pb-28 lg:px-4 lg:pb-32">
        <section className="group/hero shrink-0 overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_20px_70px_rgba(15,23,42,.09)]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_8%_0%,rgba(14,165,233,.12),transparent_30%),radial-gradient(circle_at_84%_4%,rgba(124,58,237,.09),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f4faff_52%,#f8f6ff_100%)] px-3 py-3 lg:px-4">
            <div className="pointer-events-none absolute -left-20 top-14 h-48 w-48 rounded-full border border-sky-200/50 bg-white/50 blur-3xl" />
            <div className="pointer-events-none absolute right-8 top-0 h-44 w-80 rounded-b-[100px] bg-gradient-to-br from-sky-200/35 via-violet-200/25 to-amber-100/20 blur-3xl" />

            <div className="relative grid items-start gap-2.5 2xl:grid-cols-[minmax(0,1.24fr)_minmax(340px,.86fr)_minmax(350px,.72fr)] 2xl:grid-rows-[auto_auto]">
              <section className="relative self-start overflow-hidden rounded-[23px] border border-white/90 bg-white/80 p-3 shadow-[0_14px_42px_rgba(15,23,42,.065)] backdrop-blur-xl 2xl:col-start-1 2xl:row-start-1">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600" />
                <div className="flex min-w-0 items-start gap-4">
                  <div className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_14px_32px_rgba(15,23,42,.11)]">
                    <img src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="AngelCare" className="max-h-11 max-w-11 object-contain" />
                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white ${mailboxHealthState === "operational" ? "bg-emerald-500" : mailboxHealthState === "syncing" ? "animate-pulse bg-sky-500" : mailboxHealthState === "degraded" ? "bg-rose-500" : "bg-amber-400"}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.27em] text-slate-400">AngelCare Email-OS</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Mailbox command unit</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <h1 className="min-w-0 truncate text-[27px] font-black tracking-[-0.052em] text-slate-950 lg:text-[30px]">{mailboxHeader.name}</h1>
                      <HeroStatusBadge tone="success" label={mailboxHeader.lockLabel} icon={ShieldCheck} />
                      <HeroStatusBadge tone="info" label={mailboxHeader.source} icon={Activity} />
                    </div>
                    <p className="mt-0.5 max-w-3xl text-[13px] font-bold leading-5 text-slate-600">{mailboxPurpose}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <HeroMetadataChip icon={Mail} label={mailboxHeader.email || "No mailbox email"} />
                      <HeroMetadataChip icon={UserCheck} label={currentOperatorLabel} />
                      <HeroMetadataChip icon={Clock3} label={lastSyncAt ? `Verified ${formatActivityAge(lastSyncAt)}` : "No verified sync yet"} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                  <HeroIdentitySignal
                    eyebrow="Last inbound"
                    value={formatActivityAge(latestInbound?.receivedAt || latestInbound?.createdAt || latestInbound?.updatedAt)}
                    detail={latestInbound ? getRowSubject(latestInbound) : "No inbound record"}
                    icon={Inbox}
                    tone="blue"
                  />
                  <HeroIdentitySignal
                    eyebrow="Last outbound"
                    value={formatActivityAge(latestOutbound?.sentAt || latestOutbound?.sent_at || latestOutbound?.createdAt || latestOutbound?.updatedAt)}
                    detail={latestOutbound ? getRowSubject(latestOutbound) : "No outbound record"}
                    icon={Send}
                    tone="violet"
                  />
                  <HeroIdentitySignal
                    eyebrow="Ownership"
                    value={heroInboxRows.length ? `${assignmentCoverage}% covered` : "Queue clear"}
                    detail={heroUnassignedCount ? `${heroUnassignedCount} unassigned` : currentOperatorLabel}
                    icon={Users}
                    tone={heroUnassignedCount ? "amber" : "green"}
                  />
                </div>
              </section>

              <section className="self-start rounded-[23px] border border-slate-200/90 bg-white/88 p-3 shadow-[0_14px_42px_rgba(15,23,42,.06)] backdrop-blur-xl 2xl:col-start-2 2xl:row-start-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                      <Sparkles className="h-4 w-4" />
                      Today&apos;s mailbox briefing
                    </div>
                    <h2 className="mt-1.5 text-lg font-black tracking-[-0.03em] text-slate-950">
                      {primaryBriefingRisk ? "Attention is concentrated and actionable" : "Operations are under control"}
                    </h2>
                  </div>
                  <HeroStatusBadge
                    tone={primaryBriefingRisk ? "warning" : "success"}
                    label={primaryBriefingRisk ? `${primaryBriefingRisk} signal${primaryBriefingRisk === 1 ? "" : "s"}` : "Clear"}
                    icon={primaryBriefingRisk ? AlertTriangle : CheckCircle2}
                  />
                </div>

                <div className="mt-2 grid gap-1.5">
                  {heroBriefingSignals.slice(0, 2).map((signal, index) => (
                    <HeroBriefingSignal
                      key={`${signal.title}-${index}`}
                      title={signal.title}
                      detail={signal.detail}
                      tone={signal.tone}
                      icon={signal.icon}
                    />
                  ))}
                </div>

                <div className={`mt-2 rounded-[18px] border px-3 py-2.5 ${Number(aggregateStats.overdue || 0) || Number(aggregateStats.failed || 0) ? "border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50" : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Priority & SLA watch</div>
                      <div className="mt-1 truncate text-sm font-black text-slate-950">
                        {Number(aggregateStats.overdue || 0)
                          ? `${aggregateStats.overdue} commitment${Number(aggregateStats.overdue) === 1 ? "" : "s"} beyond target`
                          : Number(aggregateStats.failed || 0)
                            ? `${aggregateStats.failed} delivery exception${Number(aggregateStats.failed) === 1 ? "" : "s"}`
                            : "No immediate escalation required"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-black tracking-[-0.05em] text-slate-950">{slaControlRate}%</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">SLA controlled</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid content-start gap-2 2xl:col-start-3 2xl:row-span-2 2xl:row-start-1">
                <div
                  data-emailos-mailbox-command-panel="true"
                  className="rounded-[23px] border border-slate-200/90 bg-[linear-gradient(145deg,rgba(255,255,255,.98)_0%,rgba(248,250,252,.96)_58%,rgba(239,246,255,.92)_100%)] p-2.5 shadow-[0_16px_46px_rgba(15,23,42,.075)]"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setComposeMode("compose")
                        setComposeSeed({ initialMailboxId: mailboxId || selected?.mailboxId || scopeMailbox?.id || "" })
                        setComposeOpen(true)
                      }}
                      className="group relative min-h-[62px] overflow-hidden rounded-[19px] border border-slate-800 bg-[linear-gradient(135deg,#061224_0%,#0a2b50_54%,#075985_100%)] px-3 py-2.5 text-left text-white shadow-[0_16px_34px_rgba(2,20,48,.24)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-700 hover:shadow-[0_22px_42px_rgba(2,20,48,.30)] focus:outline-none focus:ring-4 focus:ring-sky-200 active:translate-y-0"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />
                      <div className="relative flex h-full items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14)] transition group-hover:bg-white/15">
                          <PencilLine className="h-[18px] w-[18px]" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-black tracking-[-0.015em]">Compose message</span>
                            <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.13em] text-sky-100">Primary</span>
                          </div>
                          <div className="mt-0.5 truncate text-[10px] font-bold text-sky-100/90">Start a governed business conversation</div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-sky-200 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void syncNow()}
                      aria-busy={busyAction === "sync"}
                      className={`group relative min-h-[62px] overflow-hidden rounded-[19px] border px-3 py-2.5 text-left shadow-[0_13px_30px_rgba(14,165,233,.10)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-100 active:translate-y-0 ${busyAction === "sync" ? "border-sky-300 bg-gradient-to-br from-sky-100 via-white to-cyan-50" : "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 hover:border-sky-300 hover:shadow-[0_18px_38px_rgba(14,165,233,.16)]"}`}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
                      <div className="relative flex h-full items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white shadow-[0_10px_22px_rgba(2,132,199,.24)] transition ${busyAction === "sync" ? "bg-cyan-600" : "bg-sky-600 group-hover:bg-sky-700"}`}>
                          <RefreshCw className={`h-[18px] w-[18px] ${busyAction === "sync" ? "animate-spin" : ""}`} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-black tracking-[-0.015em] text-slate-950">{busyAction === "sync" ? "Synchronizing mailbox" : "Sync mailbox"}</span>
                            <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.13em] ${busyAction === "sync" ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                              {busyAction === "sync" ? "Live" : "Verified"}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[10px] font-bold text-slate-600">
                            {busyAction === "sync" ? "Reconciling server and database records" : lastSyncAt ? `Up to date · ${formatTimeOnly(lastSyncAt)}` : "Run the first verified synchronization"}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-2">
                    <HeroUtilityAction icon={FileText} label="Templates" helper="Private library" tone="violet" onClick={() => setTemplateOpen(true)} />
                    <HeroUtilityAction icon={Search} label="Search" helper="Query builder" tone="sky" onClick={() => setSearchOpen(true)} />
                    <HeroUtilityAction icon={Download} label="Export" helper="CSV evidence" tone="emerald" onClick={exportCurrentView} />
                    {scoped
                      ? <HeroUtilityAction icon={LockKeyhole} label="Lock" helper="Access control" tone="danger" onClick={() => void lockMailbox()} />
                      : <HeroUtilityAction icon={LayoutGrid} label="Overview" helper="Network view" tone="slate" onClick={() => setActiveFolder("all_mail")} />}
                  </div>
                </div>

                <div className={`rounded-[23px] border p-3 shadow-[0_14px_38px_rgba(15,23,42,.065)] ${mailboxHealthTone === "success" ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50" : mailboxHealthTone === "danger" ? "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50" : mailboxHealthTone === "warning" ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50" : "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${mailboxHealthTone === "success" ? "bg-emerald-600 text-white" : mailboxHealthTone === "danger" ? "bg-rose-600 text-white" : mailboxHealthTone === "warning" ? "bg-amber-500 text-white" : "bg-sky-600 text-white"}`}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Mailbox health</div>
                        <div className="mt-1 text-sm font-black text-slate-950">{mailboxHealthLabel}</div>
                      </div>
                    </div>
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${mailboxHealthState === "operational" ? "bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" : mailboxHealthState === "syncing" ? "animate-pulse bg-sky-500 shadow-[0_0_0_5px_rgba(14,165,233,.12)]" : mailboxHealthState === "degraded" ? "bg-rose-500 shadow-[0_0_0_5px_rgba(244,63,94,.12)]" : "bg-amber-400 shadow-[0_0_0_5px_rgba(251,191,36,.14)]"}`} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <HeroHealthRow label="Inbound bridge" value={lastSyncAt ? "Connected" : "Awaiting verification"} tone={lastSyncAt ? "success" : "warning"} />
                    <HeroHealthRow label="Outbound relay" value={deliveryIntegrity ? "Ready · no failures" : `${aggregateStats.failed} issue${Number(aggregateStats.failed) === 1 ? "" : "s"}`} tone={deliveryIntegrity ? "success" : "danger"} />
                    <HeroHealthRow label="Last verified sync" value={lastSyncAt ? formatDate(lastSyncAt) : "Not recorded"} tone={lastSyncAt ? "info" : "warning"} />
                    <HeroHealthRow label="Access control" value={mailboxHeader.lockLabel} tone="info" />
                  </div>
                </div>
              </section>
              <section className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(115deg,#061326_0%,#0b2645_54%,#0b4165_100%)] px-3 py-2 text-white shadow-[0_14px_38px_rgba(2,20,48,.18)] 2xl:col-span-2 2xl:col-start-1 2xl:row-start-2">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-sky-400/12 to-transparent" />
                <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-white">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Operational pulse</div>
                      <div className="mt-0.5 truncate text-sm font-black text-white">
                        {busyAction === "sync"
                          ? "Reconciling mailbox records and integrity state…"
                          : latestInbound
                            ? `Latest inbound activity ${formatActivityAge(latestInbound?.receivedAt || latestInbound?.createdAt || latestInbound?.updatedAt)}`
                            : "Mailbox is ready for the next verified activity"}
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4 lg:max-w-[720px]">
                    <HeroPulseMetric label="SLA control" value={`${slaControlRate}%`} helper={`${aggregateStats.overdue || 0} overdue`} tone={Number(aggregateStats.overdue || 0) ? "warning" : "success"} />
                    <HeroPulseMetric label="Ownership" value={`${assignmentCoverage}%`} helper={`${heroUnassignedCount} unassigned`} tone={heroUnassignedCount ? "warning" : "success"} />
                    <HeroPulseMetric label="Delivery" value={deliveryIntegrity ? "Protected" : "Attention"} helper={`${aggregateStats.failed || 0} failed`} tone={deliveryIntegrity ? "success" : "danger"} />
                    <HeroPulseMetric label="Live activity" value={latestInbound ? formatTimeOnly(latestInbound?.receivedAt || latestInbound?.createdAt || latestInbound?.updatedAt) : "—"} helper={latestOutbound ? `Outbound ${formatTimeOnly(latestOutbound?.sentAt || latestOutbound?.sent_at || latestOutbound?.createdAt || latestOutbound?.updatedAt)}` : "No outbound yet"} tone="info" />
                  </div>
                </div>
              </section>
            </div>

            <div className="relative mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              {heroKpis.map((metric) => (
                <ExecutiveHeroMetric
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  description={metric.description}
                  icon={metric.icon}
                  tone={metric.tone}
                  onClick={metric.onClick}
                />
              ))}
            </div>
          </div>

          <nav className="border-t border-slate-200/90 bg-white/95 px-3 py-2 backdrop-blur-xl" aria-label="Email-OS mailbox folders">
            <div className="flex gap-3 overflow-x-auto pb-0.5">
              {folderCommandGroups.map((group) => (
                <div key={group.label} className="flex shrink-0 items-center gap-2">
                  <div className={`hidden rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-[0.17em] lg:block ${group.tone === "mail" ? "bg-sky-50 text-sky-700" : group.tone === "control" ? "bg-slate-100 text-slate-600" : "bg-violet-50 text-violet-700"}`}>
                    {group.label}
                  </div>
                  <div className="flex gap-1.5">
                    {group.items.map((folder) => {
                      const Icon = folder.icon
                      const selectedFolder = activeFolder === folder.key
                      const riskFolder = folder.key === "failed" || folder.key === "trash" || folder.key === "spam"
                      return (
                        <button
                          key={folder.key}
                          type="button"
                          onClick={() => {
                            if (folder.key === "templates") setTemplateOpen(true)
                            setActiveFolder(folder.key)
                            setFilter("all")
                          }}
                          className={`group/folder inline-flex h-10 shrink-0 items-center gap-2 rounded-[15px] border px-3 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${selectedFolder ? "border-sky-500 bg-[linear-gradient(135deg,#0284c7,#0369a1)] text-white shadow-[0_12px_28px_rgba(2,132,199,.24)]" : riskFolder && folder.count ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100" : "border-slate-200 bg-slate-50/80 text-slate-700 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"}`}
                          title={folder.helper || `Open ${folder.label}`}
                        >
                          <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${selectedFolder ? "bg-white/15" : "border border-white bg-white text-slate-500 shadow-sm group-hover/folder:text-sky-700"}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span>{folder.label}</span>
                          <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] ${selectedFolder ? "bg-white/20 text-white" : riskFolder && folder.count ? "bg-rose-100 text-rose-700" : "border border-slate-200 bg-white text-slate-500"}`}>{folder.count}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="h-7 w-px bg-slate-200 last:hidden" />
                </div>
              ))}
            </div>
          </nav>
        </section>

        {error ? <div className="mt-3 shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        <section
          ref={workspaceRef}
          className="mt-3 grid min-h-[760px] grid-cols-1 items-start gap-3 pb-24 xl:gap-0 xl:[grid-template-columns:var(--emailos-workspace-columns)]"
          style={{
            "--emailos-workspace-columns": `${workspacePaneWidths.left}px ${EMAIL_OS_WORKSPACE_RESIZER_WIDTH}px minmax(0,1fr) ${EMAIL_OS_WORKSPACE_RESIZER_WIDTH}px ${workspacePaneWidths.right}px`
          } as CSSProperties}
        >
          <aside className={`flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white transition-shadow xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:self-start ${workspaceResizingPane === "left" ? "ring-2 ring-sky-100 shadow-[0_24px_70px_rgba(14,165,233,.14)]" : "shadow-[0_18px_60px_rgba(15,23,42,.05)]"}`}>
            <div
              data-emailos-mailbox-filter-deck="true"
              className="border-b border-slate-100 bg-[linear-gradient(160deg,#ffffff_0%,#fbfdff_58%,#f5f9ff_100%)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.19em] text-slate-500">Mailbox</div>
                  <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="truncate text-[20px] font-black tracking-[-0.045em] text-slate-950">{activeFolderMeta.label}</h2>
                    <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-sky-700">
                      {messages.length} {messages.length === 1 ? "record" : "records"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => activeFolder === "templates" ? setTemplateOpen(true) : void load(selected?.id || null)}
                  aria-label={`Refresh ${activeFolderMeta.label}`}
                  title={`Refresh ${activeFolderMeta.label}`}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 shadow-[0_7px_18px_rgba(15,23,42,.055)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 hover:shadow-[0_10px_24px_rgba(14,165,233,.11)] focus:outline-none focus:ring-4 focus:ring-sky-100 active:translate-y-0"
                >
                  <RefreshCw className={`h-4 w-4 transition ${loading || folderLoading ? "animate-spin text-sky-600" : "group-hover:rotate-45"}`} strokeWidth={2.25} />
                </button>
              </div>

              <div className="group mt-2.5 flex h-11 items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-2.5 shadow-[0_8px_22px_rgba(15,23,42,.045)] transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-sky-50 text-sky-700 transition group-focus-within:bg-sky-100">
                  <Search className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search messages, people, notes, tasks or CRM…"
                  className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear mailbox search"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-stretch gap-1.5">
                <div className="relative flex h-10 min-w-[146px] flex-1 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-2.5 shadow-[0_5px_16px_rgba(15,23,42,.035)] transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600">
                    <Filter className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortKey)}
                    aria-label="Sort mailbox records"
                    className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-5 text-[10px] font-black text-slate-800 outline-none"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="priority">Priority</option>
                    <option value="sla_due">SLA due</option>
                    <option value="unassigned_first">Unassigned first</option>
                    <option value="opened_first">Opened first</option>
                    <option value="contact">Contact A–Z</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  title="Open Advanced Search Intelligence Builder"
                  className={`group flex h-10 min-w-[96px] items-center gap-2 rounded-[14px] border px-2.5 text-left shadow-[0_5px_16px_rgba(15,23,42,.035)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-100 active:translate-y-0 ${
                    Object.values(searchFilters).some((value) => value && value !== "any")
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-sky-100 text-sky-700 transition group-hover:bg-sky-200">
                    <Settings2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-black">Advanced</span>
                    <span className="block truncate text-[7px] font-black uppercase tracking-[0.09em] text-sky-700">
                      {Object.values(searchFilters).filter((value) => value && value !== "any").length || "Builder"}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckCircle2dViewsOpen(true)}
                  title="Open governed saved views"
                  className={`group flex h-10 min-w-[100px] items-center gap-2 rounded-[14px] border px-2.5 text-left shadow-[0_5px_16px_rgba(15,23,42,.035)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-100 active:translate-y-0 ${
                    !["all", "unread", "unassigned", "assigned_to_me"].includes(filter)
                      ? "border-violet-300 bg-violet-50 text-violet-800"
                      : "border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-violet-700 transition group-hover:bg-violet-200">
                    <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-black">Saved views</span>
                    <span className="block truncate text-[7px] font-black uppercase tracking-[0.09em] text-violet-700">Governed</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={exportCsv}
                  title="Export the current mailbox result as CSV"
                  className="group flex h-10 min-w-[72px] items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50/70 px-2.5 text-left text-emerald-800 shadow-[0_5px_16px_rgba(16,185,129,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100 active:translate-y-0"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-200">
                    <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-black">CSV</span>
                </button>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1 rounded-[16px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
                {([
                  ["all", "All", LayoutGrid],
                  ["unread", "Unread", MailOpen],
                  ["unassigned", "Unassigned", Users],
                  ["assigned_to_me", "Mine", UserCheck]
                ] as const).map(([key, label, Icon]) => {
                  const selectedFilter = filter === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      aria-pressed={selectedFilter}
                      className={`group flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[12px] px-1.5 text-[10px] font-black transition duration-200 focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                        selectedFilter
                          ? "bg-[linear-gradient(135deg,#0284c7,#0369a1)] text-white shadow-[0_8px_18px_rgba(2,132,199,.22)]"
                          : "bg-white text-slate-650 shadow-sm hover:-translate-y-0.5 hover:text-sky-800 hover:shadow-[0_7px_16px_rgba(15,23,42,.075)]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${selectedFilter ? "text-white" : "text-slate-500 group-hover:text-sky-700"}`} strokeWidth={2.2} />
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 px-3 py-2">
              {messages.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(event) => setSelectedIds(event.target.checked ? messages.map((row) => row.id) : [])}
                      className="h-4 w-4"
                    />
                    <span>{selectedIds.length ? `${selectedIds.length} selected` : "Select visible"}</span>
                  </label>
                  {selectedIds.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {actionModel.bulk.map((item: any) => (
                        <button
                          key={item.action}
                          type="button"
                          onClick={() => void runBulkAction(item.action)}
                          className={`rounded-xl px-2 py-1 text-[11px] font-black ${
                            item.tone === "danger" ? "bg-rose-50 text-rose-700" :
                            item.tone === "warning" ? "bg-amber-50 text-amber-700" :
                            item.tone === "success" ? "bg-emerald-50 text-emerald-700" :
                            "bg-white text-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold leading-5 text-sky-800">
                  Folder ready. Sync, search, or change folder to review records.
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((row) => (
                <div key={row.id} role="button" tabIndex={0} onClick={() => setSelectedId(row.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(row.id) }} className={`group w-full cursor-pointer rounded-2xl border p-3 text-left transition ${selected?.id === row.id ? "border-sky-300 bg-sky-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setSelectedIds((current) => event.target.checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id))}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isUnread(row) ? <span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> : <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />}
                        <div className="truncate text-sm font-black text-slate-950">{getRowSender(row)}</div>
                      </div>
                      <div className="mt-1 truncate text-sm font-black text-slate-800">{getRowSubject(row)}</div>
                      <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{row.preview || getRowBody(row)}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-[0.08em]">
                        <span className={`rounded-full border px-2 py-1 ${priorityTone(row.priority)}`}>{clean(row.priority) || "normal"}</span>
                        <span className={`rounded-full border px-2 py-1 ${statusTone(row.status)}`}>{clean(row.status) || "new"}</span>
                        {hasAttachments(row) ? <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700"><Paperclip className="inline h-3 w-3" /> File</span> : null}
                        {isTrackingOpened(row) ? <span className="animate-pulse rounded-full bg-emerald-50 px-2 py-1 text-emerald-700"><Eye className="inline h-3 w-3" /> Opened</span> : row.trackingEnabled ? <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-500"><Eye className="inline h-3 w-3" /> Tracking</span> : null}
                        {normalizedSource(row) === "outbox" ? <OperatorTag label="Sent by" name={sentByLabel(row)} tone="violet" /> : clean(row.lastHandledByUserId || row.last_handled_by_user_id) ? <OperatorTag label="Handled by" name={handledByLabel(row)} tone="sky" /> : clean(row.ownerUserId || row.owner_user_id) ? <OperatorTag label="Owner" name={ownerLabel(row)} tone="indigo" /> : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px] font-bold text-slate-400">{formatDate(row.receivedAt || row.createdAt)}</div>
                  </div>
                </div>
              ))}
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Inbox className="mx-auto h-9 w-9 text-slate-300" />
                  <div className="mt-3 text-base font-black text-slate-900">No records in {activeFolderMeta.label}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {folderNotice || (activeFolder === "spam" || activeFolder === "trash" ? activeFolderMeta.helper || "This folder has no records yet." : scoped && activeFolder === "inbox" ? `Send a test email to ${mailboxHeader.email || "this mailbox"}, wait 60 seconds, then sync.` : "No records match this folder or filter.")}
                  </p>
                  {scoped ? (
                    <button type="button" onClick={() => void syncNow()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">
                      <RefreshCw className="h-4 w-4" />
                      Sync now
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>

          <div
            role="separator"
            aria-label="Resize mailbox list and selected message"
            aria-orientation="vertical"
            aria-valuemin={EMAIL_OS_WORKSPACE_MIN_LEFT}
            aria-valuemax={EMAIL_OS_WORKSPACE_MAX_LEFT}
            aria-valuenow={workspacePaneWidths.left}
            tabIndex={0}
            title="Drag to resize the mailbox list · Double-click to reset · Arrow keys supported"
            onPointerDown={(event) => beginWorkspaceResize("left", event)}
            onDoubleClick={() => resetWorkspacePane("left")}
            onKeyDown={(event) => handleWorkspaceResizeKey("left", event)}
            className={`group relative hidden min-h-[680px] self-stretch cursor-col-resize touch-none select-none items-stretch justify-center outline-none xl:flex ${workspaceResizingPane === "left" ? "z-30" : "z-10"}`}
          >
            <div className={`my-5 w-1 rounded-full transition-all duration-150 group-hover:w-1.5 group-hover:bg-sky-400 group-focus-visible:w-1.5 group-focus-visible:bg-sky-500 ${workspaceResizingPane === "left" ? "w-1.5 bg-sky-500 shadow-[0_0_0_5px_rgba(14,165,233,.12)]" : "bg-slate-200"}`} />
          </div>

          <main className={`min-h-[760px] min-w-0 overflow-visible rounded-[28px] border border-slate-200/90 bg-white transition-shadow xl:self-start ${workspaceResizingPane ? "ring-2 ring-sky-100 shadow-[0_28px_90px_rgba(14,165,233,.13)]" : "shadow-[0_24px_80px_rgba(15,23,42,.08)]"}`}>
            {selected ? (
              <div className="min-h-[760px] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.08),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
                <div className="sticky top-20 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-xl">
                  <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white text-sky-700 shadow-[0_12px_30px_rgba(14,165,233,.15)] sm:flex">
                          {selectedIsOutbound ? <Send className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">{selected.mailboxName || selected.mailboxId}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">{selectedIsOutbound ? "Outbound" : "Inbound"}</span>
                            <span className={`rounded-full border px-2.5 py-1 ${statusTone(selected.status)}`}>{humanizeActionValue(selected.status, "New")}</span>
                            <span className={`rounded-full border px-2.5 py-1 ${priorityTone(selected.priority)}`}>{humanizeActionValue(selected.priority, "Normal")}</span>
                            {selected.sla?.overdue ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700">SLA overdue</span> : null}
                          </div>
                          <h2 className="mt-3 max-w-5xl text-2xl font-black tracking-[-0.045em] text-slate-950 lg:text-[32px] lg:leading-[1.12]">{getRowSubject(selected)}</h2>
                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-500 sm:grid-cols-2 2xl:grid-cols-4">
                            <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">From</span><div className="mt-0.5 truncate text-slate-700">{getRowFromDisplay(selected)}{getRowFromEmail(selected) ? ` · ${getRowFromEmail(selected)}` : ""}</div></div>
                            <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">To</span><div className="mt-0.5 truncate text-slate-700">{selectedRecipient}</div></div>
                            <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Owner</span><div className="mt-0.5 truncate text-slate-700">{ownerLabel(selected)}</div></div>
                            <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Activity</span><div className="mt-0.5 truncate text-slate-700">{formatDate(selected.sentAt || selected.sent_at || selected.receivedAt || selected.createdAt)}</div></div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedIsOutbound ? <OperatorIdentityBadge label="Sent by" name={sentByLabel(selected)} role={clean(selected.sentByRole || selected.sent_by_role)} department={clean(selected.sentByDepartment || selected.sent_by_department)} tone="violet" /> : null}
                            {clean(selected.ownerUserId || selected.owner_user_id) ? <OperatorIdentityBadge label="Assigned to" name={ownerLabel(selected)} role={clean(selected.ownerRole || selected.owner_role)} department={clean(selected.ownerDepartment || selected.owner_department)} tone="indigo" /> : null}
                            {clean(selected.lastHandledByUserId || selected.last_handled_by_user_id) ? <OperatorIdentityBadge label="Last handled by" name={handledByLabel(selected)} role={clean(selected.lastHandledByRole || selected.last_handled_by_role)} department={clean(selected.lastHandledByDepartment || selected.last_handled_by_department)} tone="sky" /> : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <DossierSignal label="Workflow" value={humanizeActionValue(selected.status, "New")} icon={Workflow} tone="blue" />
                        <DossierSignal label="Priority" value={humanizeActionValue(selected.priority, "Normal")} icon={Flag} tone={["urgent", "vip", "high"].includes(clean(selected.priority).toLowerCase()) ? "rose" : "slate"} />
                        <DossierSignal label="Category" value={categoryLabel(selected.category)} icon={Tag} tone="slate" />
                        <DossierSignal
                          label={selectedIsOutbound ? "Engagement" : "Read state"}
                          value={selectedIsOutbound ? trackingLabel(selected) : isUnread(selected) ? "Unread" : "Read"}
                          icon={selectedIsOutbound ? Eye : MailOpen}
                          tone={selectedIsOutbound && isTrackingOpened(selected) ? "green" : selectedIsInbound && isUnread(selected) ? "amber" : "slate"}
                          onClick={selectedIsOutbound ? () => setTrackingOpen(true) : undefined}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 2xl:max-w-[330px] 2xl:justify-end">
                      {selectedIsInbound ? (
                        <HeaderActionButton label="Reply" icon={Reply} tone="primary" onClick={openReply} />
                      ) : null}
                      {selectedIsInbound ? (
                        <HeaderActionButton label="Forward" icon={Forward} tone="quiet" onClick={openForward} />
                      ) : null}
                      <HeaderActionButton
                        label={actionModel.primary}
                        icon={actionModel.primaryAction === "duplicate" ? Copy : actionModel.primaryAction === "archive" ? Archive : RotateCcw}
                        tone={actionModel.primaryAction === "archive" ? "quiet" : "success"}
                        onClick={() => void runFolderPrimaryAction()}
                      />
                      <HeaderActionButton label={actionModel.destructive} icon={Trash2} tone="danger" onClick={() => void runFolderDestructiveAction()} />
                    </div>
                  </div>
                </div>

                <div className="p-4 pb-20">
                  <section className="rounded-[26px] border border-slate-200 bg-white p-3.5 shadow-[0_16px_44px_rgba(15,23,42,.055)] lg:p-4">
                    <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700"><Activity className="h-4 w-4" />Operational command deck</div>
                        <h3 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">Decide, execute and advance this message</h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Actions are grouped by business purpose so the operator can act confidently without scanning a flat button wall.</p>
                      </div>

                      <div ref={actionOverflowRef} className="relative self-start sm:self-auto">
                        <button
                          ref={actionOverflowButtonRef}
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={actionOverflowOpen}
                          onClick={() => setActionOverflowOpen((current) => !current)}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          More actions
                          <ChevronDown className={`h-3.5 w-3.5 transition ${actionOverflowOpen ? "rotate-180" : ""}`} />
                        </button>
                        {actionOverflowOpen ? (
                          <div role="menu" className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,.18)]">
                            <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operational utilities</div>
                            <OverflowActionItem icon={Link2} label="Link record" description="Connect this email to an existing business dossier." onClick={() => { setActionOverflowOpen(false); openSmartLink() }} />
                            <OverflowActionItem icon={Users} label="Team Operations" description="Open workload, queues and team ownership." onClick={() => { setActionOverflowOpen(false); setTeamOpsOpen(true) }} />
                            {selectedIsInbound ? <OverflowActionItem icon={MailOpen} label={isUnread(selected) ? "Mark as read" : "Mark as unread"} description="Reconcile the operator read state." onClick={() => { setActionOverflowOpen(false); void runAction(isUnread(selected) ? "mark_read" : "mark_unread") }} /> : null}
                            {selectedIsOutbound ? <OverflowActionItem icon={RefreshCw} label="Refresh tracking" description="Pull the latest recorded open activity." onClick={() => { setActionOverflowOpen(false); void refreshSelectedTracking() }} /> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2.5 2xl:grid-cols-3">
                      <CommandGroup title="Decision controls" description="Set the message operating state." icon={Workflow} tone="decision">
                        <CommandActionButton label="Change status" description="Advance the workflow stage." currentValue={humanizeActionValue(selected.status, "New")} icon={Workflow} tone="decision" onClick={() => openWorkflowModal("status")} busy={busyAction === "set_status"} />
                        <CommandActionButton label="Set priority" description="Control urgency and SLA attention." currentValue={humanizeActionValue(selected.priority, "Normal")} icon={Flag} tone="warning" onClick={() => openWorkflowModal("priority")} busy={busyAction === "set_priority"} />
                        <CommandActionButton label="Set category" description="Classify the business purpose." currentValue={categoryLabel(selected.category)} icon={Tag} tone="quiet" onClick={() => openWorkflowModal("category")} busy={busyAction === "set_category"} />
                        <CommandActionButton label="Assign owner" description="Place clear operator accountability." currentValue={ownerLabel(selected)} icon={UserCheck} tone="decision" onClick={() => openWorkflowModal("assign")} busy={busyAction === "assign_owner"} />
                      </CommandGroup>

                      <CommandGroup title="Workflow execution" description="Create action and move work forward." icon={ClipboardCheck} tone="workflow">
                        <CommandActionButton label="Add internal note" description="Record decision context for the team." badge={`${notes.length}`} icon={MessageSquareText} tone="workflow" onClick={() => setNotesOpen(true)} busy={busyAction === "note"} />
                        <CommandActionButton label="Create task" description={selectedIsOutbound ? "Schedule a commercial follow-up." : "Create accountable operational work."} badge={`${tasks.length}`} icon={ClipboardCheck} tone="primary" onClick={() => setTaskOpen(true)} busy={busyAction === "task"} />
                        <CommandActionButton label="Team handoff" description="Transfer ownership with context and due date." icon={ArrowLeftRight} tone="workflow" onClick={() => openHandoff()} busy={busyAction === "handoff"} />
                        <CommandActionButton label={selectedIsResolved ? "Resolved" : "Resolve message"} description={selectedIsResolved ? "This workflow is already resolved." : "Close the operational loop with audit history."} icon={ShieldCheck} tone="success" onClick={() => void runAction("resolve")} busy={busyAction === "resolve"} disabled={selectedIsResolved} />
                      </CommandGroup>

                      <CommandGroup title="Relationship intelligence" description="Connect context, history and automation." icon={Sparkles} tone="intelligence">
                        <CommandActionButton label="CRM conversion" description="Create the relevant business entity." icon={Building2} tone="intelligence" onClick={() => setCrmQuickOpen(true)} busy={Boolean(busyAction?.startsWith("convert_"))} />
                        <CommandActionButton label="Timeline intelligence" description="Review contact and entity history." badge={`${entityTimelineItems().length}`} icon={History} tone="intelligence" onClick={() => setTimelineOpen(true)} />
                        <CommandActionButton label="OPS Copilot" description="Apply SLA-aware operational intelligence." icon={Bot} tone="primary" onClick={() => setOpsCopilotOpen(true)} busy={busyAction === "ops_copilot"} />
                        {selectedIsOutbound ? (
                          <CommandActionButton label="Tracking intelligence" description={trackingFollowupSuggestion(selected)} currentValue={trackingLabel(selected)} icon={Eye} tone={isTrackingOpened(selected) ? "success" : "warning"} onClick={() => setTrackingOpen(true)} />
                        ) : (
                          <CommandActionButton label="Link business record" description="Connect this email to a dossier or contact." badge={`${links.length}`} icon={Link2} tone="quiet" onClick={() => openSmartLink()} busy={busyAction === "link"} />
                        )}
                      </CommandGroup>
                    </div>
                  </section>

                  <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)]">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"><MailOpen className="h-4 w-4 text-sky-600" />Message reader</div>
                        <div className="mt-1 text-sm font-black text-slate-900">Clean operational reading surface</div>
                      </div>
                      <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Message body display mode">
                        {(["clean", "plain", "original"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            role="tab"
                            data-body-mode={mode}
                            aria-selected={bodyMode === mode}
                            tabIndex={bodyMode === mode ? 0 : -1}
                            onClick={() => setBodyMode(mode)}
                            onKeyDown={(event) => handleBodyModeKey(event, mode)}
                            className={`rounded-xl px-3 py-2 text-xs font-black capitalize transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${bodyMode === mode ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 sm:p-6">
                      {bodyMode === "clean" && resolveMessageBodyFields(selected).bodyHtml ? (
                        <article className="prose prose-slate mx-auto min-h-[280px] max-w-4xl rounded-[24px] border border-slate-200 bg-white p-6 text-[15px] leading-8 shadow-[0_12px_40px_rgba(15,23,42,.05)] sm:p-8"><div dangerouslySetInnerHTML={{ __html: readyHtml(resolveMessageBodyFields(selected).bodyHtml) }} /></article>
                      ) : bodyMode === "original" ? (
                        <pre className="mx-auto min-h-[280px] max-w-4xl whitespace-pre-wrap break-words rounded-[24px] border border-slate-200 bg-slate-950 p-6 font-mono text-[13px] leading-7 text-slate-100 shadow-[0_12px_40px_rgba(15,23,42,.08)] sm:p-8">{bodyView(selected, bodyMode)}</pre>
                      ) : (
                        <pre className="mx-auto min-h-[280px] max-w-4xl whitespace-pre-wrap rounded-[24px] border border-slate-200 bg-white p-6 font-sans text-[15px] font-medium leading-8 text-slate-700 shadow-[0_12px_40px_rgba(15,23,42,.05)] sm:p-8">{bodyView(selected, bodyMode)}</pre>
                      )}
                    </div>
                  </section>

                  <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"><Paperclip className="h-4 w-4 text-sky-600" />Attachments</div>
                        <h3 className="mt-1 text-base font-black text-slate-950">Message files</h3>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{selected.attachments?.length || 0} file(s)</span>
                    </div>
                    {selected.attachments?.length ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {selected.attachments.map((attachment: any) => (
                          <div key={`${attachment.filename}-${attachment.size}`} className="group rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_40px_rgba(14,165,233,.10)]">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700"><FileText className="h-5 w-5" /></div>
                              <div className="min-w-0 flex-1"><div className="truncate font-black text-slate-900">{attachment.filename}</div><div className="mt-1 text-xs font-semibold text-slate-500">{attachment.contentType} · {attachment.size ? `${attachment.size} bytes` : "Size unknown"}</div></div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${attachment.storageFileId ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{attachment.storageFileId ? "Secure Windows storage" : "Legacy attachment"}</span>
                              {attachment.storageFileId ? <a href={`/api/storage/download/${attachment.storageFileId}?mailboxId=${encodeURIComponent(selected.mailboxId || mailboxId || "")}`} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-sky-700"><Download className="h-3.5 w-3.5" />Download</a> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 flex min-h-28 items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
                        <div><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm"><Paperclip className="h-5 w-5" /></div><div className="mt-3 text-sm font-black text-slate-800">No attachments</div><div className="mt-1 text-xs font-semibold text-slate-500">This message was delivered without files.</div></div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[50vh] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(14,165,233,.08),transparent_45%)] p-10 text-center">
                <div className="max-w-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-sky-100 bg-white text-sky-600 shadow-[0_20px_60px_rgba(14,165,233,.16)]"><MailOpen className="h-7 w-7" /></div><div className="mt-5 text-2xl font-black tracking-[-0.035em] text-slate-950">Select a message dossier</div><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">The executive dossier header, command deck, reader and intelligence rail will activate here.</p></div>
              </div>
            )}
          </main>

          <div
            role="separator"
            aria-label="Resize selected message and actions panel"
            aria-orientation="vertical"
            aria-valuemin={EMAIL_OS_WORKSPACE_MIN_RIGHT}
            aria-valuemax={EMAIL_OS_WORKSPACE_MAX_RIGHT}
            aria-valuenow={workspacePaneWidths.right}
            tabIndex={0}
            title="Drag to resize the selected message and actions panel · Double-click to reset · Arrow keys supported"
            onPointerDown={(event) => beginWorkspaceResize("right", event)}
            onDoubleClick={() => resetWorkspacePane("right")}
            onKeyDown={(event) => handleWorkspaceResizeKey("right", event)}
            className={`group relative hidden min-h-[680px] self-stretch cursor-col-resize touch-none select-none items-stretch justify-center outline-none xl:flex ${workspaceResizingPane === "right" ? "z-30" : "z-10"}`}
          >
            <div className={`my-5 w-1 rounded-full transition-all duration-150 group-hover:w-1.5 group-hover:bg-sky-400 group-focus-visible:w-1.5 group-focus-visible:bg-sky-500 ${workspaceResizingPane === "right" ? "w-1.5 bg-sky-500 shadow-[0_0_0_5px_rgba(14,165,233,.12)]" : "bg-slate-200"}`} />
          </div>

          <aside className={`min-h-[760px] min-w-0 overflow-visible rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_32%)] p-3 pb-24 transition-shadow xl:self-start ${workspaceResizingPane === "right" ? "ring-2 ring-sky-100 shadow-[0_28px_90px_rgba(14,165,233,.15)]" : "shadow-[0_24px_80px_rgba(15,23,42,.08)]"}`}>
            <div className="space-y-3 pb-12">
              <div className="sticky top-20 z-10 overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,.20)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sky-200"><PanelCommandIcon /></div>
                    <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Executive command rail</div><h3 className="mt-1 truncate text-base font-black tracking-[-0.02em]">{selected ? getRowSubject(selected) : "No message selected"}</h3><p className={`mt-1 font-semibold leading-5 text-slate-300 ${compactCommandRail ? "text-[11px]" : "text-xs"}`}>{activeFolderMeta.label} · {selected ? humanizeActionValue(selected.status, "New") : "Waiting for selection"}</p></div>
                  </div>
                  {selected ? <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${selectedIsOutbound && isTrackingOpened(selected) ? "animate-pulse bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.14)]" : "bg-sky-400 shadow-[0_0_0_5px_rgba(56,189,248,.14)]"}`} /> : null}
                </div>
                {selected ? (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <RailMetric label="Owner" value={ownerLabel(selected)} />
                      <RailMetric label={selectedIsOutbound ? "Opens" : "Tasks"} value={selectedIsOutbound ? `${Number(selected.openCount || selected.open_count || 0)}` : `${tasks.length}`} />
                    </div>
                    <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-slate-200"><span className="text-sky-300">{selectedIsOutbound ? "Sent by" : "Last handled by"}:</span> <span className="font-black text-white">{selectedIsOutbound ? sentByLabel(selected) : handledByLabel(selected)}</span></div>
                  </>
                ) : null}
              </div>

              {selected ? (
                <>
                  <RailSection eyebrow="Message" title="Immediate actions" description={compactCommandRail ? undefined : "High-confidence actions for the current message state."}>
                    {selectedIsInbound ? <RailAction label="Reply" description="Respond in the current message context." icon={Reply} tone="primary" onClick={openReply} compact={compactCommandRail} /> : null}
                    {selectedIsInbound ? <RailAction label="Forward" description="Transfer the message with its context." icon={Forward} tone="quiet" onClick={openForward} compact={compactCommandRail} /> : null}
                    <RailAction label={actionModel.primary} description={actionModel.primaryAction === "duplicate" ? "Create a new operational copy." : actionModel.primaryAction === "archive" ? "Remove from the live inbox safely." : "Restore this message to active operations."} icon={actionModel.primaryAction === "duplicate" ? Copy : actionModel.primaryAction === "archive" ? Archive : RotateCcw} tone={actionModel.primaryAction === "archive" ? "quiet" : "success"} onClick={() => void runFolderPrimaryAction()} compact={compactCommandRail} />
                    <RailAction label={actionModel.destructive} description={actionModel.destructiveAction === "delete_permanent" ? "Irreversible erasure from Email-OS." : "Move to Trash for controlled recovery."} icon={Trash2} tone="danger" onClick={() => void runFolderDestructiveAction()} compact={compactCommandRail} />
                  </RailSection>

                  <RailSection eyebrow="Workflow" title="Execution controls" description={compactCommandRail ? undefined : "Create ownership, evidence and accountable follow-up."}>
                    <RailAction label="Add internal note" description="Preserve decision context for the team." badge={`${notes.length}`} icon={MessageSquareText} tone="workflow" onClick={() => setNotesOpen(true)} busy={busyAction === "note"} compact={compactCommandRail} />
                    <RailAction label="Create task" description={selectedIsOutbound ? "Plan the next follow-up action." : "Create accountable operational work."} badge={`${tasks.length}`} icon={ClipboardCheck} tone="primary" onClick={() => setTaskOpen(true)} busy={busyAction === "task"} compact={compactCommandRail} />
                    <RailAction label="Assign owner" description={`Current: ${ownerLabel(selected)}`} icon={UserCheck} tone="decision" onClick={() => openWorkflowModal("assign")} busy={busyAction === "assign_owner"} compact={compactCommandRail} />
                    <RailAction label="Team handoff" description="Transfer ownership with context and due date." icon={ArrowLeftRight} tone="workflow" onClick={() => openHandoff()} busy={busyAction === "handoff"} compact={compactCommandRail} />
                    <RailAction label={selectedIsResolved ? "Resolved" : "Resolve workflow"} description={selectedIsResolved ? "Operational loop already closed." : "Close with a complete audit trail."} icon={ShieldCheck} tone="success" onClick={() => void runAction("resolve")} busy={busyAction === "resolve"} disabled={selectedIsResolved} compact={compactCommandRail} />
                  </RailSection>

                  <RailSection eyebrow="Intelligence" title="Relationship context" description={compactCommandRail ? undefined : "Use history, CRM context and automation without leaving the message."}>
                    <RailAction label="CRM conversion" description="Create the appropriate business entity." icon={Building2} tone="intelligence" onClick={() => setCrmQuickOpen(true)} busy={Boolean(busyAction?.startsWith("convert_"))} compact={compactCommandRail} />
                    <RailAction label="Timeline intelligence" description={`${entityTimelineItems().length} related event(s) currently available.`} icon={History} tone="intelligence" onClick={() => setTimelineOpen(true)} badge={`${entityTimelineItems().length}`} compact={compactCommandRail} />
                    <RailAction label="OPS Copilot" description="Apply SLA-aware operational intelligence." icon={Bot} tone="primary" onClick={() => setOpsCopilotOpen(true)} busy={busyAction === "ops_copilot"} compact={compactCommandRail} />
                    <RailAction label="Link business record" description="Connect the message to an existing dossier." icon={Link2} tone="quiet" onClick={() => openSmartLink()} badge={`${links.length}`} compact={compactCommandRail} />
                    {selectedIsOutbound ? <RailAction label="Tracking intelligence" description={trackingLabel(selected)} icon={Eye} tone={isTrackingOpened(selected) ? "success" : "warning"} onClick={() => setTrackingOpen(true)} badge={`${Number(selected.openCount || selected.open_count || 0)}`} compact={compactCommandRail} /> : null}
                    {selectedIsOutbound ? <RailAction label="Refresh tracking" description="Pull the latest open timestamps." icon={RefreshCw} tone="quiet" onClick={() => void refreshSelectedTracking()} compact={compactCommandRail} /> : null}
                  </RailSection>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.05)]">
                    <div className="flex items-center justify-between gap-2"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Message details</div><h3 className="mt-1 text-sm font-black text-slate-900">Operational evidence</h3></div><Activity className="h-5 w-5 text-sky-600" /></div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <EvidenceMetric label="Notes" value={`${notes.length}`} tone="blue" />
                      <EvidenceMetric label="Tasks" value={`${tasks.length}`} tone={tasks.length ? "amber" : "slate"} />
                      <EvidenceMetric label="Links" value={`${links.length}`} tone="violet" />
                      <EvidenceMetric label="Audit" value={`${audit.length}`} tone="green" />
                    </div>
                  </div>

                  <ContextCard title="Notes" action="Add" onAction={() => setNotesOpen(true)} empty="No internal notes yet." items={notes.map((note: any) => ({ id: note.id, title: note.author_name || note.author_user_id || "Internal note", body: note.body, meta: formatDate(note.created_at) }))} />
                  <ContextCard title="Tasks" action="Create" onAction={() => setTaskOpen(true)} empty="No open tasks." items={tasks.map((task: any) => ({ id: task.id, title: task.title, body: task.description || task.note || "—", meta: `${task.owner_name || "Unassigned"} · ${task.priority} · ${formatDate(task.due_at)}` }))} />
                  {selectedIsOutbound ? <ContextCard title="Tracking intelligence" action="Open" onAction={() => setTrackingOpen(true)} empty="No tracking activity recorded." items={[{ id: "tracking", title: trackingLabel(selected), body: trackingFollowupSuggestion(selected), meta: `${Number(selected.openCount || selected.open_count || 0)} open(s)` }]} /> : null}

                  <details className="rounded-[22px] border border-slate-200 bg-white p-4 text-xs shadow-[0_10px_30px_rgba(15,23,42,.04)]">
                    <summary className="cursor-pointer font-black text-slate-700">System health & diagnostics</summary>
                    <div className="mt-3 space-y-2 font-semibold text-slate-500"><div>Mailbox: {mailboxHeader.name}</div><div>Email: {mailboxHeader.email || "—"}</div><div>Sync: windows-bridge-pop3</div><div>Message ID: {selected.id}</div><div>Status: {status}</div></div>
                  </details>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><MailOpen className="h-5 w-5" /></div><div className="mt-3 text-sm font-black text-slate-800">Select a message</div><div className="mt-1 text-xs font-semibold leading-5 text-slate-500">The command rail will activate with real operational actions and intelligence.</div></div>
              )}
              {!mailboxId ? <StorageHealthPanel /> : null}
            </div>
          </aside>
        </section>

        <div className="fixed right-6 top-28 z-[9200] grid w-[420px] max-w-[calc(100vw-32px)] gap-3">
          {toasts.map((toast) => {
            const toneClass = toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : toast.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : toast.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-950"
                  : "border-sky-200 bg-sky-50 text-sky-950"
            const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "warning" ? AlertTriangle : toast.tone === "error" ? AlertTriangle : Clock3
            return (
              <div key={toast.id} className={`rounded-3xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,.16)] backdrop-blur ${toneClass}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-white/80 p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-black">{toast.title}</div>
                      <div className="shrink-0 text-[11px] font-black opacity-60">{toast.timestamp}</div>
                    </div>
                    {toast.message ? <div className="mt-1 text-sm font-bold leading-5 opacity-85">{toast.message}</div> : null}
                    {toast.detail ? <div className="mt-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold leading-5 opacity-80">{toast.detail}</div> : null}
                  </div>
                  <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-xl bg-white/70 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <EnterpriseComposeModal
          open={composeOpen}
          mode={composeMode}
          mailboxes={scoped ? [scopeMailbox].filter(Boolean) : (data?.mailboxes || [])}
          selectedEmail={composeSeed?.selectedEmail || selected || undefined}
          mailboxScopeLocked={scoped}
          initialMailboxId={composeSeed?.initialMailboxId}
          initialRecipients={composeSeed?.initialRecipients}
          initialSubject={composeSeed?.initialSubject}
          initialBody={composeSeed?.initialBody}
          initialCc={composeSeed?.initialCc}
          initialBcc={composeSeed?.initialBcc}
          initialPriority={composeSeed?.initialPriority}
          initialTracking={composeSeed?.initialTracking}
          initialTemplateId={composeSeed?.initialTemplateId}
          initialTemplateVersion={composeSeed?.initialTemplateVersion}
          onClose={() => setComposeOpen(false)}
          onDone={(event) => {
            if (event?.type === "sent") {
              setStatus("Email sent. Sent / Outbox refreshed.")
              pushToast({ tone: "success", title: "Email sent", message: "Sent / Outbox refreshed", detail: "Transport accepted the message." })
              setActiveFolder("outbox")
            } else if (event?.type === "draft") {
              setStatus("Draft saved. Drafts refreshed.")
              pushToast({ tone: "success", title: "Draft saved", message: "Drafts refreshed", detail: "The draft was persisted in Email-OS." })
              setActiveFolder("drafts")
            } else if (event?.type === "scheduled") {
              setStatus("Scheduled email saved. Scheduled refreshed.")
              pushToast({ tone: "success", title: "Email scheduled", message: "Scheduled refreshed", detail: "The scheduled message was persisted." })
              setActiveFolder("scheduled")
            }
            void load(null)
          }}
        />

        <MailboxTemplatesStudio
          key={mailboxId || clean(scopeMailbox?.id) || "emailos-template-studio"}
          open={templateOpen}
          mailboxId={mailboxId || clean(scopeMailbox?.id)}
          mailboxName={getMailboxLabel(scopeMailbox || {})}
          mailboxEmail={getMailboxEmail(scopeMailbox || {})}
          currentUser={currentUser}
          onClose={() => setTemplateOpen(false)}
          onInsert={openTemplate}
          onTemplatesChanged={setTemplates}
        />

        {notesOpen ? (
          <EnterpriseDrawer
            title="Rapid Evidence Note"
            eyebrow="Internal record"
            description="Capture a concise decision, observation or handoff detail that remains visible to the operating team only."
            icon={MessageSquareText}
            tone="indigo"
            width="compact"
            status="Internal only"
            progress={4}
            messageContext={selectedMessageContext}
            dirty={Boolean(noteBody.trim())}
            onClose={() => setNotesOpen(false)}
            footer={<DrawerFooter primaryLabel="Commit internal note" primaryIcon={CheckCircle2} onPrimary={() => void addNote()} primaryTone="indigo" disabled={!noteBody.trim()} onSecondary={() => setNotesOpen(false)} helper="The note is timestamped, attributed to the current operator and retained in the message audit context." />}
          >
            <DrawerSection eyebrow="Evidence composer" title="Document the operational context" description="Write what the next operator or reviewer needs to understand—without repeating the email itself." icon={MessageSquareText} tone="indigo">
              <div className="flex flex-wrap gap-2"><DrawerEvidenceBadge label="Internal visibility" tone="indigo" icon={ShieldCheck} /><DrawerEvidenceBadge label="Author attributed" tone="emerald" icon={UserCheck} /><DrawerEvidenceBadge label="Audit retained" tone="slate" icon={History} /></div>
              <div className="mt-4"><DrawerField label="Internal note" required hint={`${noteBody.trim().length} characters · Keep the note specific, factual and actionable.`}><textarea autoFocus value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Decision, risk, commitment, missing evidence or next action…" className={`${drawerTextareaClass} min-h-[220px]`} /></DrawerField></div>
            </DrawerSection>
            <div className="mt-4"><DrawerCallout title="Good evidence standard" description="Record the decision, owner, expected result and timing when relevant. Avoid copying sensitive information that does not support the workflow." tone="sky" icon={ShieldCheck} /></div>
          </EnterpriseDrawer>
        ) : null}

        {taskOpen ? (
          <EnterpriseDrawer
            title="Task Planning & Accountability Studio"
            eyebrow="Execution workflow"
            description="Convert the selected conversation into accountable work with a clear owner, due date, urgency and audit context."
            icon={ClipboardCheck}
            tone="sky"
            width="standard"
            status={taskForm.dueAt ? "Due date set" : "Planning required"}
            progress={4}
            messageContext={selectedMessageContext}
            dirty={Boolean(taskForm.title || taskForm.description || taskForm.dueAt || taskForm.ownerUserId || taskForm.note)}
            onClose={() => setTaskOpen(false)}
            footer={<DrawerFooter primaryLabel="Create accountable task" primaryIcon={ClipboardCheck} onPrimary={() => void createTask()} primaryTone="sky" disabled={!taskForm.title.trim()} busy={busyAction === "create_task"} onSecondary={() => setTaskOpen(false)} helper="The task will remain linked to this message and visible in its operational evidence timeline." />}
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2"><DrawerMetric label="Current priority" value={taskForm.priority} helper="Task urgency" tone={taskForm.priority === "urgent" || taskForm.priority === "vip" ? "rose" : taskForm.priority === "high" ? "amber" : "sky"} icon={Flag} /><DrawerMetric label="Due state" value={taskForm.dueAt ? "Scheduled" : "Unset"} helper={taskForm.dueAt ? formatDate(taskForm.dueAt) : "Set a target time"} tone={taskForm.dueAt ? "emerald" : "amber"} icon={CalendarClock} /><DrawerMetric label="Ownership" value={taskForm.ownerUserId ? "Assigned" : "Open"} helper={taskForm.ownerUserId || "No owner selected"} tone={taskForm.ownerUserId ? "indigo" : "slate"} icon={UserCheck} /></div>
              <DrawerSection eyebrow="Work definition" title="Define the expected operational result" description="A strong task states what must be completed and what evidence proves completion." icon={Flag} tone="sky">
                <div className="grid gap-3"><DrawerField label="Task title" required><input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Qualify partnership scope and confirm meeting" className={drawerInputClass} /></DrawerField><DrawerField label="Expected result"><textarea value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the action, expected outcome and required evidence…" className={`${drawerTextareaClass} min-h-28`} /></DrawerField></div>
              </DrawerSection>
              <DrawerSection eyebrow="Responsibility" title="Owner, urgency and timing" description="Select from known operational queues or retain a specific staff identifier." icon={UserCheck} tone="indigo">
                <div className="grid gap-3 md:grid-cols-2"><DrawerField label="Follow-up due date"><input type="datetime-local" value={taskForm.dueAt} onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))} className={drawerInputClass} /></DrawerField><DrawerField label="Task priority"><select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))} className={drawerInputClass}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="vip">VIP</option></select></DrawerField></div>
                <div className="mt-3"><DrawerField label="Search accountable owner" hint="Search by full name, professional email, role or department."><input value={ownerSearch} onChange={(event) => setOwnerSearch(event.target.value)} placeholder="Search AngelCare staff…" className={drawerInputClass} /></DrawerField></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{ownerWorkloadItems().filter((item) => item.id !== "unassigned").slice(0, 8).map((item) => <DrawerOption key={item.id} title={item.title} description={item.body} badge={item.meta} icon={UserCheck} tone="indigo" selected={taskForm.ownerUserId === item.id} onClick={() => setTaskForm((current) => ({ ...current, ownerUserId: item.id }))} />)}</div>
              </DrawerSection>
              <DrawerSection eyebrow="Audit context" title="Supporting internal note" description="Add why the task was created or what the owner should protect." icon={History} tone="slate"><DrawerField label="Internal note"><textarea value={taskForm.note} onChange={(event) => setTaskForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional audit context…" className={`${drawerTextareaClass} min-h-24`} /></DrawerField></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {linkOpen ? (
          <EnterpriseDrawer
            title="Advanced Record Linking Studio"
            eyebrow="Relationship governance"
            description="Attach this message to an authoritative contact, client, commercial, support or internal dossier."
            icon={Link2}
            tone="violet"
            width="wide"
            status={linkForm.entityId ? "Existing record" : "Reference required"}
            progress={4}
            messageContext={selectedMessageContext}
            dirty={Boolean(linkForm.entityId || linkForm.entityLabel || linkForm.note)}
            onClose={() => setLinkOpen(false)}
            footer={<DrawerFooter primaryLabel="Create governed link" primaryIcon={Link2} onPrimary={() => void linkEntity()} primaryTone="violet" disabled={!linkForm.entityType || !linkForm.entityId.trim()} onSecondary={() => setLinkOpen(false)} helper="The message remains unchanged; this action creates an auditable relationship to the selected business record." />}
          >
            <div className="grid gap-4">
              <DrawerCallout title="Duplicate-prevention checkpoint" description="Confirm the destination record before linking. Use CRM Conversion Studio when a new dossier should be created rather than linking an existing record." tone="violet" icon={ShieldCheck} />
              <DrawerSection eyebrow="Destination" title="Select the business record family" description="The selected relationship controls how this email appears in future timelines and operational dossiers." icon={Building2} tone="violet">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[['contact','Contact timeline','Keep exchanges grouped by sender.',UserCheck],['parent_client','Parent / client','Attach to family or client service.',Users],['b2b_prospect','B2B prospect','Connect commercial qualification.',Building2],['quote_request','Quote request','Link pricing and devis activity.',FileText],['support_case','Support case','Attach to service recovery.',ShieldCheck],['complaint_case','Complaint case','Connect formal complaint evidence.',AlertTriangle],['candidate','Candidate file','Link recruitment correspondence.',UserCheck],['supplier','Supplier dossier','Connect procurement records.',Building2],['invoice_dossier','Invoice dossier','Link finance and payment evidence.',FileText]].map(([type,title,description,Icon]: any) => <DrawerOption key={type} title={title} description={description} icon={Icon} tone="violet" selected={linkForm.entityType === type} onClick={() => setLinkForm((current) => ({ ...current, entityType: type }))} />)}
                </div>
              </DrawerSection>
              <DrawerSection eyebrow="Record identity" title="Confirm the exact destination" description="Use the authoritative record ID and a readable label for operator confidence." icon={Flag} tone="sky">
                <div className="grid gap-3 md:grid-cols-2"><DrawerField label="Entity ID" required><input value={linkForm.entityId} onChange={(event) => setLinkForm((current) => ({ ...current, entityId: event.target.value }))} placeholder="Authoritative record ID" className={drawerInputClass} /></DrawerField><DrawerField label="Entity label"><input value={linkForm.entityLabel} onChange={(event) => setLinkForm((current) => ({ ...current, entityLabel: event.target.value }))} placeholder="Readable dossier or contact name" className={drawerInputClass} /></DrawerField></div>
                <div className="mt-3"><DrawerField label="Relationship note"><textarea value={linkForm.note} onChange={(event) => setLinkForm((current) => ({ ...current, note: event.target.value }))} placeholder="Why this message belongs to the selected dossier…" className={`${drawerTextareaClass} min-h-24`} /></DrawerField></div>
              </DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {searchOpen ? (
          <EnterpriseDrawer title="Search Intelligence Builder" eyebrow="Mailbox discovery" description="Build a precise operational query across people, workflow, evidence, engagement, SLA and date signals." icon={Settings2} tone="sky" width="studio" status={`${messages.length} current result${messages.length === 1 ? "" : "s"}`} progress={3} onClose={() => setSearchOpen(false)} footer={<DrawerFooter primaryLabel="Apply operational search" primaryIcon={Search} onPrimary={() => setSearchOpen(false)} primaryTone="sky" secondaryLabel="Reset all" onSecondary={() => { setQuery(""); setFilter("all"); setSearchFilters(defaultSearchFilters) }} tertiaryLabel="Export CSV" onTertiary={exportCsv} helper="Search criteria are applied locally to the authoritative rows currently loaded in this mailbox workspace." />}>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2"><DrawerMetric label="Matching rows" value={messages.length} helper="Current filtered result" tone="sky" icon={Search} /><DrawerMetric label="Active criteria" value={Object.values(searchFilters).filter((value) => value && value !== "any").length + (query ? 1 : 0)} helper="Structured filters in use" tone="indigo" icon={Filter} /><DrawerMetric label="Folder scope" value={activeFolder.replaceAll('_',' ')} helper="Current mailbox context" tone="slate" icon={Inbox} /></div>
              <DrawerSection eyebrow="People & ownership" title="Who participated or owns the work?" description="Narrow by sender, recipient or accountable owner." icon={Users} tone="sky"><div className="grid gap-3 md:grid-cols-3"><DrawerField label="Sender"><input value={searchFilters.sender} onChange={(event) => setSearchFilters((current) => ({ ...current, sender: event.target.value }))} placeholder="Sender email contains…" className={drawerInputClass} /></DrawerField><DrawerField label="Recipient"><input value={searchFilters.recipient} onChange={(event) => setSearchFilters((current) => ({ ...current, recipient: event.target.value }))} placeholder="Recipient email contains…" className={drawerInputClass} /></DrawerField><DrawerField label="Owner"><input value={searchFilters.owner} onChange={(event) => setSearchFilters((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner ID or name…" className={drawerInputClass} /></DrawerField></div></DrawerSection>
              <DrawerSection eyebrow="Workflow" title="Operating state, urgency and business category" description="Combine workflow signals to isolate the exact queue that needs attention." icon={Workflow} tone="indigo"><div className="grid gap-3 md:grid-cols-3"><DrawerField label="Status"><select value={searchFilters.status} onChange={(event) => setSearchFilters((current) => ({ ...current, status: event.target.value }))} className={drawerInputClass}><option value="">Any status</option><option value="new">New</option><option value="triaged">Triaged</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="waiting_client">Waiting client</option><option value="waiting_internal">Waiting internal</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select></DrawerField><DrawerField label="Priority"><select value={searchFilters.priority} onChange={(event) => setSearchFilters((current) => ({ ...current, priority: event.target.value }))} className={drawerInputClass}><option value="">Any priority</option><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="vip">VIP</option></select></DrawerField><DrawerField label="Category"><select value={searchFilters.category} onChange={(event) => setSearchFilters((current) => ({ ...current, category: event.target.value }))} className={drawerInputClass}><option value="">Any category</option><option value="parent_client">Parent / client</option><option value="b2b">B2B</option><option value="partnership">Partnership</option><option value="recruitment">Recruitment</option><option value="finance_payment">Finance / payment</option><option value="complaint">Complaint</option><option value="supplier">Supplier</option><option value="internal">Internal</option><option value="other">Other</option></select></DrawerField></div></DrawerSection>
              <DrawerSection eyebrow="Evidence & engagement" title="What proof or response signal exists?" description="Filter by read tracking, attachments, CRM linkage, tasks and SLA state." icon={Activity} tone="violet"><div className="grid gap-3 md:grid-cols-3"><DrawerField label="Tracking state"><select value={searchFilters.opened} onChange={(event) => setSearchFilters((current) => ({ ...current, opened: event.target.value }))} className={drawerInputClass}><option value="any">Any tracking state</option><option value="opened">Opened</option><option value="not_opened">Not opened</option></select></DrawerField><DrawerField label="Attachments"><select value={searchFilters.attachment} onChange={(event) => setSearchFilters((current) => ({ ...current, attachment: event.target.value }))} className={drawerInputClass}><option value="any">Any attachment state</option><option value="yes">Has attachments</option><option value="no">No attachments</option></select></DrawerField><DrawerField label="CRM link"><select value={searchFilters.crm} onChange={(event) => setSearchFilters((current) => ({ ...current, crm: event.target.value }))} className={drawerInputClass}><option value="any">Any CRM state</option><option value="yes">Has CRM link</option><option value="no">No CRM link</option></select></DrawerField><DrawerField label="Task state"><select value={searchFilters.task} onChange={(event) => setSearchFilters((current) => ({ ...current, task: event.target.value }))} className={drawerInputClass}><option value="any">Any task state</option><option value="yes">Has task</option><option value="no">No task</option></select></DrawerField><DrawerField label="SLA state"><select value={searchFilters.sla} onChange={(event) => setSearchFilters((current) => ({ ...current, sla: event.target.value }))} className={drawerInputClass}><option value="any">Any SLA state</option><option value="healthy">SLA healthy</option><option value="risk">SLA risk</option><option value="breach">SLA breach</option></select></DrawerField></div></DrawerSection>
              <DrawerSection eyebrow="Time window" title="Limit the operational period" description="Use inclusive start and end dates to isolate a campaign, incident or reporting period." icon={CalendarClock} tone="amber"><div className="grid gap-3 md:grid-cols-2"><DrawerField label="From date"><input type="date" value={searchFilters.dateFrom} onChange={(event) => setSearchFilters((current) => ({ ...current, dateFrom: event.target.value }))} className={drawerInputClass} /></DrawerField><DrawerField label="To date"><input type="date" value={searchFilters.dateTo} onChange={(event) => setSearchFilters((current) => ({ ...current, dateTo: event.target.value }))} className={drawerInputClass} /></DrawerField></div></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {savedViewsOpen ? (
          <EnterpriseDrawer title="Operational Views Manager" eyebrow="CheckCircle2d intelligence" description="Launch a governed queue perspective designed around common AngelCare operating situations." icon={LayoutGrid} tone="indigo" width="standard" status="8 governed views" progress={2} onClose={() => setCheckCircle2dViewsOpen(false)}>
            <div className="grid gap-4">
              <DrawerCallout title="Purpose-built operational lenses" description="Each view applies a defined combination of folder, workflow, urgency, engagement or business-category filters." tone="indigo" icon={Sparkles} />
              <div className="grid gap-3 sm:grid-cols-2">{[
                ['urgent_mine','My urgent emails','Assigned/high-priority messages requiring immediate action.',Flag,'rose'],['unassigned_today','Unassigned today','Fresh messages not yet owned by the team.',UserCheck,'amber'],['opened_no_reply','Opened but no reply','Sent emails opened by recipients, ready for follow-up.',Eye,'emerald'],['quote_requests','Quote requests','Devis, price and tariff-related conversations.',FileText,'violet'],['complaints','Complaints','Complaint and SLA-risk conversations.',AlertTriangle,'rose'],['recruitment','Recruitment applications','Candidate and hiring conversations.',UserCheck,'indigo'],['waiting_internal','Waiting internal','Messages blocked on internal action.',Clock3,'sky'],['overdue_followups','Overdue follow-ups','SLA breach or overdue queues.',AlertTriangle,'rose']
              ].map(([key,title,description,Icon,tone]: any) => <DrawerOption key={key} title={title} description={description} icon={Icon} tone={tone} onClick={() => applyCheckCircle2dView(key)} />)}</div>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {timelineOpen ? (
          <EnterpriseDrawer title="Relationship Timeline Workspace" eyebrow="Contact intelligence" description="Review the loaded communication history for the detected contact or linked business entity." icon={History} tone="violet" width="wide" status={`${entityTimelineItems().length} event${entityTimelineItems().length === 1 ? "" : "s"}`} progress={3} messageContext={selectedMessageContext} onClose={() => setTimelineOpen(false)}>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2"><DrawerMetric label="Related events" value={entityTimelineItems().length} helper="Loaded timeline records" tone="violet" icon={History} /><DrawerMetric label="Business links" value={links.length} helper="Connected dossiers" tone="sky" icon={Link2} /><DrawerMetric label="Evidence notes" value={notes.length} helper="Internal context items" tone="indigo" icon={MessageSquareText} /></div>
              <DrawerSection eyebrow="Relationship identity" title={selectedContactName() || "No detected contact"} description={selectedContactEmail() || clean(selected?.linkedEntityLabel || selected?.linked_entity_label) || "Link the message to establish a durable timeline identity."} icon={UserCheck} tone="violet"><div className="flex flex-wrap gap-2"><DrawerEvidenceBadge label={selectedContactEmail() ? "Email detected" : "No email"} tone={selectedContactEmail() ? "emerald" : "amber"} icon={Mail} /><DrawerEvidenceBadge label={`${links.length} linked record${links.length === 1 ? "" : "s"}`} tone="violet" icon={Link2} /></div></DrawerSection>
              <DrawerSection eyebrow="Chronology" title="Communication and evidence history" description="Open a related record to move the authoritative selected-message context." icon={History} tone="violet"><div className="max-h-[56vh] overflow-y-auto pr-1">{entityTimelineItems().length ? entityTimelineItems().map((item) => <DrawerTimelineItem key={item.id} title={item.title} description={item.body} meta={item.meta} tone="violet" onClick={() => { setSelectedId(item.id); setTimelineOpen(false) }} />) : <DrawerEmptyState title="No related timeline found" description="Link this message to a contact or dossier to establish future relationship continuity." />}</div></DrawerSection>
              <div className="grid gap-3 sm:grid-cols-2"><DrawerOption title="Link this message" description="Attach the current conversation to a contact, client, quote or case." icon={Link2} tone="violet" onClick={() => openSmartLink()} /><DrawerOption title="Export current result" description="Download the filtered mailbox result as CSV evidence." icon={Download} tone="slate" onClick={exportCsv} /></div>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {handoffOpen ? (
          <EnterpriseDrawer title="Controlled Team Handoff Protocol" eyebrow="Responsibility transfer" description="Transfer ownership with explicit priority, due date, next action and audit evidence." icon={ArrowLeftRight} tone="indigo" width="standard" status={handoffForm.ownerUserId ? "Recipient selected" : "Owner required"} progress={4} messageContext={selectedMessageContext} dirty={Boolean(handoffForm.ownerUserId || handoffForm.note || handoffForm.dueAt)} onClose={() => setHandoffOpen(false)} footer={<DrawerFooter primaryLabel="Complete accountable handoff" primaryIcon={ArrowLeftRight} onPrimary={() => void submitHandoff()} primaryTone="indigo" disabled={!handoffForm.ownerUserId.trim()} busy={busyAction === "handoff"} onSecondary={() => setHandoffOpen(false)} helper="Ownership, note and optional follow-up task are committed as one controlled operational sequence." />}>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2"><DrawerMetric label="Current owner" value={selected ? ownerLabel(selected) : "—"} helper="Before transfer" tone="slate" icon={UserCheck} /><DrawerMetric label="New priority" value={handoffForm.priority} helper="Transfer urgency" tone={handoffForm.priority === "urgent" || handoffForm.priority === "vip" ? "rose" : handoffForm.priority === "high" ? "amber" : "indigo"} icon={Flag} /><DrawerMetric label="Follow-up" value={handoffForm.dueAt ? "Scheduled" : "Optional"} helper={handoffForm.dueAt ? formatDate(handoffForm.dueAt) : "No task requested"} tone={handoffForm.dueAt ? "emerald" : "slate"} icon={CalendarClock} /></div>
              <DrawerSection eyebrow="Receiving owner" title="Select the accountable AngelCare operator" description="Choose the real staff identity; Email-OS stores the immutable user ID and historical snapshot automatically." icon={Users} tone="indigo"><DrawerField label="Search staff directory" hint="Search full name, professional email, role or department."><input value={ownerSearch} onChange={(event) => setOwnerSearch(event.target.value)} placeholder="Search AngelCare operators…" className={drawerInputClass} /></DrawerField><div className="mt-3 grid gap-2 sm:grid-cols-2">{ownerWorkloadItems().filter((item) => item.id !== "unassigned").slice(0, 12).map((item) => <DrawerOption key={item.id} title={item.title} description={item.body || "AngelCare operator"} badge={item.meta} icon={UserCheck} tone={item.overdue ? "rose" : "indigo"} selected={handoffForm.ownerUserId === item.id} onClick={() => setHandoffForm((current) => ({ ...current, ownerUserId: item.id }))} />)}</div><details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-black text-slate-600">Technical identity fallback</summary><div className="mt-3"><DrawerField label="Immutable user ID" hint="Use only when the staff profile is not yet available in the directory."><input value={handoffForm.ownerUserId} onChange={(event) => setHandoffForm((current) => ({ ...current, ownerUserId: event.target.value }))} placeholder="Technical user ID" className={drawerInputClass} /></DrawerField></div></details></DrawerSection>
              <DrawerSection eyebrow="Service commitment" title="Set urgency and expected follow-up" description="A due date creates a linked handoff follow-up task automatically." icon={CalendarClock} tone="amber"><div className="grid gap-3 md:grid-cols-2"><DrawerField label="Priority"><select value={handoffForm.priority} onChange={(event) => setHandoffForm((current) => ({ ...current, priority: event.target.value }))} className={drawerInputClass}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="vip">VIP</option></select></DrawerField><DrawerField label="Follow-up due date"><input type="datetime-local" value={handoffForm.dueAt} onChange={(event) => setHandoffForm((current) => ({ ...current, dueAt: event.target.value }))} className={drawerInputClass} /></DrawerField></div></DrawerSection>
              <DrawerSection eyebrow="Transfer brief" title="Tell the receiving owner what must happen next" description="The handoff note is preserved as internal evidence and becomes the follow-up task description when a due date is set." icon={MessageSquareText} tone="sky"><DrawerField label="Handoff note" required><textarea value={handoffForm.note} onChange={(event) => setHandoffForm((current) => ({ ...current, note: event.target.value }))} placeholder="Context, expected action, evidence required and completion standard…" className={`${drawerTextareaClass} min-h-36`} /></DrawerField></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {teamOpsOpen ? (
          <EnterpriseDrawer title="Team Queue Command Center" eyebrow="Workforce operations" description="Inspect active load, ownership gaps, SLA exposure and handoff demand across the loaded mailbox workspace." icon={Users} tone="sky" width="studio" status={`${teamQueueSummary().total} active`} progress={3} messageContext={selectedMessageContext} onClose={() => setTeamOpsOpen(false)}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4"><DrawerMetric label="Active queue" value={teamQueueSummary().total} helper="Open operational conversations" tone="sky" icon={Inbox} /><DrawerMetric label="Unassigned" value={teamQueueSummary().unassigned} helper="Need accountable owner" tone={teamQueueSummary().unassigned ? "amber" : "emerald"} icon={UserCheck} /><DrawerMetric label="Overdue" value={teamQueueSummary().overdue} helper="SLA intervention required" tone={teamQueueSummary().overdue ? "rose" : "emerald"} icon={AlertTriangle} /><DrawerMetric label="Waiting internal" value={teamQueueSummary().waitingInternal} helper="Blocked by team action" tone={teamQueueSummary().waitingInternal ? "indigo" : "slate"} icon={Clock3} /></div>
              <DrawerSection eyebrow="Owner workload" title="Responsibility distribution" description="Review active work and overdue exposure by owner or queue." icon={Activity} tone="sky"><div className="grid gap-2 md:grid-cols-2">{ownerWorkloadItems().length ? ownerWorkloadItems().map((item) => <DrawerOption key={item.id} title={item.title} description={item.body} badge={item.meta} icon={item.id === "unassigned" ? AlertTriangle : UserCheck} tone={item.id === "unassigned" ? "amber" : item.overdue ? "rose" : "sky"} onClick={() => { setFilter(item.id === "unassigned" ? "unassigned" : "team_queue"); setTeamOpsOpen(false) }} />) : <div className="md:col-span-2"><DrawerEmptyState title="No active team workload" description="The currently loaded workspace has no unresolved queue demand." /></div>}</div></DrawerSection>
              <DrawerSection eyebrow="Queue actions" title="Move directly into the operating lane" description="Apply a queue lens or hand off the currently selected message." icon={ArrowLeftRight} tone="indigo"><div className="grid gap-2 sm:grid-cols-2"><DrawerOption title="Open unassigned queue" description="Review messages that need an accountable owner." icon={UserCheck} tone="amber" onClick={() => { setFilter("unassigned"); setTeamOpsOpen(false) }} /><DrawerOption title="Open waiting internal" description="Review conversations blocked on internal action." icon={Clock3} tone="sky" onClick={() => { setFilter("waiting_internal"); setTeamOpsOpen(false) }} /><DrawerOption title="Open handoff-needed" description="Find messages requiring responsibility transfer." icon={ArrowLeftRight} tone="indigo" onClick={() => { setFilter("handoff_needed"); setTeamOpsOpen(false) }} /><DrawerOption title="Handoff selected message" description="Assign, brief and optionally schedule follow-up." icon={Users} tone="emerald" disabled={!selected} onClick={() => { if (selected) openHandoff(); setTeamOpsOpen(false) }} /></div></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {trackingOpen ? (
          <EnterpriseDrawer title="Engagement Intelligence Console" eyebrow="Read-tracking evidence" description="Separate confirmed engagement evidence from operational interpretation and prepare the appropriate follow-up." icon={Eye} tone={selected && isTrackingOpened(selected) ? "emerald" : "amber"} width="wide" status={selected ? trackingLabel(selected) : "No sent message"} progress={3} messageContext={selectedMessageContext} onClose={() => setTrackingOpen(false)}>
            <div className="grid gap-4">
              <DrawerCallout title={selected ? trackingLabel(selected) : "Select a sent email"} description={selected ? trackingFollowupSuggestion(selected) : "Open Sent / Outbox and select an outbound message to activate tracking intelligence."} tone={selected && isTrackingOpened(selected) ? "emerald" : "amber"} icon={Eye} />
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4"><DrawerMetric label="Open count" value={Number(selected?.openCount || selected?.open_count || 0)} helper="Recorded tracking events" tone={selected && isTrackingOpened(selected) ? "emerald" : "amber"} icon={Eye} /><DrawerMetric label="First opened" value={formatTimeOnly(selected?.firstOpenedAt || selected?.first_opened_at)} helper={formatDate(selected?.firstOpenedAt || selected?.first_opened_at)} tone="sky" icon={Clock3} /><DrawerMetric label="Last opened" value={formatTimeOnly(selected?.lastOpenedAt || selected?.last_opened_at)} helper={formatDate(selected?.lastOpenedAt || selected?.last_opened_at)} tone="violet" icon={Activity} /><DrawerMetric label="Last refresh" value={formatTimeOnly(trackingRefreshAt)} helper={trackingRefreshAt ? formatDate(trackingRefreshAt) : "Not refreshed in this session"} tone="slate" icon={RefreshCw} /></div>
              <DrawerSection eyebrow="Interpretation" title="Recommended operator response" description="Use engagement evidence as a signal—not as proof of intent, agreement or reply." icon={Activity} tone="emerald"><div className="grid gap-2 sm:grid-cols-2"><DrawerOption title="Refresh tracking evidence" description="Pull the latest open count and timestamps from tracking events." icon={RefreshCw} tone="amber" onClick={() => void refreshSelectedTracking()} /><DrawerOption title="Create follow-up task" description="Prepare a timed reminder based on engagement state." icon={ClipboardCheck} tone="sky" onClick={() => void createCopilotFollowupTask()} /><DrawerOption title="CheckCircle2 intelligence note" description="Attach the follow-up interpretation to internal evidence." icon={MessageSquareText} tone="indigo" onClick={() => { setNoteBody(trackingFollowupSuggestion(selected)); setNotesOpen(true); setTrackingOpen(false) }} /></div></DrawerSection>
              <DrawerSection eyebrow="Technical evidence" title="Tracking proof and identifiers" description="Technical proof is available for audit and diagnostics without dominating the operator experience." icon={ShieldCheck} tone="slate"><div className="grid gap-3 md:grid-cols-2"><div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3"><div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Tracking ID</div><div className="mt-1 break-all text-[10px] font-black text-slate-700">{selected?.trackingId || selected?.tracking_id || "—"}</div></div><div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3"><div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Recorded proof</div><div className="mt-1 text-[10px] font-black text-slate-700">{trackingStatusDebug ? `${Array.isArray(trackingStatusDebug.events) ? trackingStatusDebug.events.length : 0} event(s) · ${trackingStatusDebug.opened ? "opened" : "not detected"}` : "Refresh to load technical proof"}</div></div></div>{trackingStatusDebug?.trackingUrl ? <div className="mt-3 break-all rounded-[18px] border border-slate-200 bg-white p-3 text-[10px] font-semibold text-slate-500">{trackingStatusDebug.trackingUrl}</div> : null}</DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {opsCopilotOpen ? (
          <EnterpriseDrawer title="Guided Decision & Automation Studio" eyebrow="OPS Copilot" description="Review SLA-aware recommendations, understand the evidence and choose the exact operational action to execute." icon={Bot} tone="sky" width="wide" status={selected ? inferOpsIntent(selected).label : "No message selected"} progress={3} messageContext={selectedMessageContext} onClose={() => setOpsCopilotOpen(false)}>
            <div className="grid gap-4">
              <DrawerSection eyebrow="Recommendation" title={selected ? inferOpsIntent(selected).label : "Select a message to activate intelligence"} description="Copilot proposes a workflow interpretation from the subject, body, sender and current SLA signals. The operator remains accountable for execution." icon={Sparkles} tone="sky"><div className="rounded-[20px] border border-sky-100 bg-sky-50/70 p-4 text-sm font-semibold leading-6 text-slate-700">{selected ? copilotSummary(selected) : "No operational evidence is available until a message is selected."}</div></DrawerSection>
              {selected ? <div className="grid grid-cols-3 gap-2"><DrawerMetric label="Suggested status" value={inferOpsIntent(selected).status.replaceAll('_',' ')} helper="Workflow recommendation" tone="sky" icon={Workflow} /><DrawerMetric label="Suggested priority" value={inferOpsIntent(selected).priority} helper="Urgency recommendation" tone={inferOpsIntent(selected).priority === "urgent" ? "rose" : inferOpsIntent(selected).priority === "high" ? "amber" : "indigo"} icon={Flag} /><DrawerMetric label="SLA state" value={slaStatus(selected).label} helper={slaStatus(selected).detail} tone={slaStatus(selected).tone === "danger" ? "rose" : slaStatus(selected).tone === "warning" ? "amber" : "emerald"} icon={Clock3} /></div> : null}
              <DrawerSection eyebrow="Controlled execution" title="Choose what Copilot may perform" description="Each action reuses the existing workflow APIs and records its result in the message context." icon={Sparkles} tone="indigo"><div className="grid gap-2 sm:grid-cols-2"><DrawerOption title="Apply smart triage" description="Persist the recommended status, priority and category." icon={Workflow} tone="sky" disabled={!selected} onClick={() => void applyCopilotTriage()} /><DrawerOption title="Create SLA follow-up task" description="Open a prefilled task using the recommended service window." icon={ClipboardCheck} tone="indigo" disabled={!selected} onClick={() => void createCopilotFollowupTask()} /><DrawerOption title="Convert to suggested dossier" description={`Create the recommended CRM relationship: ${selected ? inferOpsIntent(selected).label : "—"}.`} icon={Building2} tone="violet" disabled={!selected} onClick={() => void quickConvert(inferOpsIntent(selected).intent)} /><DrawerOption title="Create internal decision brief" description="Prefill an internal note with the Copilot interpretation." icon={MessageSquareText} tone="slate" disabled={!selected} onClick={() => { setNoteBody(copilotSummary(selected)); setNotesOpen(true); setOpsCopilotOpen(false) }} /></div></DrawerSection>
              <DrawerCallout title="Human-in-command safeguard" description="Recommendations are operational assistance, not autonomous approval. Confirm customer impact, ownership and evidence before applying a high-risk or irreversible action." tone="amber" icon={ShieldCheck} />
            </div>
          </EnterpriseDrawer>
        ) : null}

        {crmQuickOpen ? (
          <EnterpriseDrawer title="Business Conversion Studio" eyebrow="CRM & dossier creation" description="Convert the detected sender and message context into the correct AngelCare business record with a clear operational purpose." icon={Building2} tone="violet" width="studio" status={`Suggested: ${inferredEntityType()}`} progress={3} messageContext={selectedMessageContext} onClose={() => setCrmQuickOpen(false)}>
            <div className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
                <DrawerSection eyebrow="Detected identity" title={selectedContactName() || "No sender detected"} description={selectedContactEmail() || "No contact email was found on the selected message."} icon={UserCheck} tone="violet"><div className="grid grid-cols-2 gap-2"><DrawerMetric label="Suggested record" value={inferredEntityType()} helper="Based on message intent" tone="violet" icon={Sparkles} /><DrawerMetric label="Existing links" value={links.length} helper="Current dossier relationships" tone={links.length ? "emerald" : "slate"} icon={Link2} /></div><div className="mt-3"><DrawerCallout title="Conversion control" description="Choose Create when a new operational record is required. Use Advanced Link when the authoritative record already exists." tone="violet" icon={ShieldCheck} /></div></DrawerSection>
                <DrawerSection eyebrow="Destination" title="Select the exact business outcome" description="Each destination represents a different operating lifecycle and follow-up expectation." icon={Flag} tone="violet"><div className="grid gap-2 sm:grid-cols-2">{[
                  ['contact','Contact timeline','Keep future exchanges visible by sender.',UserCheck,'sky'],['parent_client','Parent / client dossier','Create or attach family/client service context.',Users,'emerald'],['b2b_prospect','B2B prospect','Start commercial qualification and follow-up.',Building2,'violet'],['quote_request','Quote request','Create a pricing/devis demand record.',FileText,'amber'],['support_case','Support case','Open a service support and recovery record.',ShieldCheck,'sky'],['complaint_case','Complaint case','Escalate into formal complaint handling.',AlertTriangle,'rose'],['candidate','Candidate file','Treat the conversation as a recruitment application.',UserCheck,'indigo'],['supplier','Supplier dossier','Create procurement/supplier relationship context.',Building2,'slate']
                ].map(([type,title,description,Icon,tone]: any) => <DrawerOption key={type} title={title} description={description} icon={Icon} tone={tone} badge={type === inferredEntityType() ? "Recommended" : undefined} onClick={() => void quickConvert(type)} />)}</div></DrawerSection>
              </div>
              <DrawerSection eyebrow="Existing record path" title="Link instead of creating a duplicate" description="Open the advanced linking studio when the destination record is already known." icon={Link2} tone="slate"><DrawerOption title="Open advanced record linking" description="Enter the authoritative record ID, readable label and relationship note." icon={Link2} tone="slate" onClick={() => openSmartLink()} /></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        {workflowOpen ? (
          <EnterpriseDrawer
            title={workflowOpen === "status" ? "Workflow State Decision" : workflowOpen === "priority" ? "Priority & SLA Decision" : workflowOpen === "category" ? "Business Classification Decision" : "Owner Assignment Protocol"}
            eyebrow={workflowOpen === "status" ? "Message lifecycle" : workflowOpen === "priority" ? "Urgency governance" : workflowOpen === "category" ? "Business routing" : "Responsibility governance"}
            description={workflowOpen === "status" ? "Move the message into the correct operating stage and preserve the reason for the audit trail." : workflowOpen === "priority" ? "Set the urgency level that controls attention, SLA posture and queue visibility." : workflowOpen === "category" ? "Classify the business purpose so the message reaches the correct operating lens." : "Assign an accountable owner using the loaded team workload context or a specific staff ID."}
            icon={workflowOpen === "status" ? Workflow : workflowOpen === "priority" ? Flag : workflowOpen === "category" ? Tag : UserCheck}
            tone={workflowOpen === "priority" ? "amber" : workflowOpen === "assign" ? "indigo" : workflowOpen === "category" ? "violet" : "sky"}
            width={workflowOpen === "assign" ? "standard" : "compact"}
            status={workflowOpen === "status" ? workflowForm.status.replaceAll('_',' ') : workflowOpen === "priority" ? workflowForm.priority : workflowOpen === "category" ? workflowForm.category.replaceAll('_',' ') : workflowForm.ownerUserId ? "Owner selected" : "Owner required"}
            progress={4}
            messageContext={selectedMessageContext}
            onClose={() => setWorkflowOpen(null)}
            footer={<DrawerFooter primaryLabel={workflowOpen === "status" ? "Apply lifecycle state" : workflowOpen === "priority" ? "Apply priority decision" : workflowOpen === "category" ? "Apply business category" : "Assign accountable owner"} primaryIcon={workflowOpen === "assign" ? UserCheck : CheckCircle2} onPrimary={() => void submitWorkflowModal()} primaryTone={workflowOpen === "priority" ? "amber" : workflowOpen === "assign" ? "indigo" : workflowOpen === "category" ? "violet" : "sky"} disabled={workflowOpen === "assign" && !workflowForm.ownerUserId.trim()} busy={busyAction === "workflow"} onSecondary={() => setWorkflowOpen(null)} helper="The decision is persisted through the existing workflow API and recorded in the message audit context." />}
          >
            <div className="grid gap-4">
              {workflowOpen === "status" ? <DrawerSection eyebrow="Lifecycle choice" title="Where is this message operationally?" description="Choose the state that truthfully represents the work—not simply the state that removes it from view." icon={Workflow} tone="sky"><div className="grid gap-2 sm:grid-cols-2">{[['new','New','Unreviewed or newly received.'],['triaged','Triaged','Reviewed and classified.'],['assigned','Assigned','An accountable owner exists.'],['in_progress','In progress','Active work is underway.'],['waiting_client','Waiting client','External response is required.'],['waiting_internal','Waiting internal','Blocked on an internal action.'],['resolved','Resolved','Operational loop is complete.'],['archived','Archived','Retained outside active work.']].map(([value,title,description]) => <DrawerOption key={value} title={title} description={description} icon={Workflow} tone={value === 'resolved' ? 'emerald' : value === 'archived' ? 'slate' : 'sky'} selected={workflowForm.status === value} onClick={() => setWorkflowForm((current) => ({ ...current, status: value }))} />)}</div></DrawerSection> : null}
              {workflowOpen === "priority" ? <DrawerSection eyebrow="Urgency choice" title="How much attention and SLA protection is required?" description="Use VIP and urgent only when the operational consequence justifies immediate queue precedence." icon={Flag} tone="amber"><div className="grid gap-2">{[['low','Low','Can follow the normal operating cadence.','slate'],['normal','Normal','Standard queue priority and SLA.','sky'],['high','High','Material attention required soon.','amber'],['urgent','Urgent','Immediate operational intervention.','rose'],['vip','VIP','Executive or strategically protected handling.','violet']].map(([value,title,description,tone]: any) => <DrawerOption key={value} title={title} description={description} icon={Flag} tone={tone} selected={workflowForm.priority === value} onClick={() => setWorkflowForm((current) => ({ ...current, priority: value }))} />)}</div></DrawerSection> : null}
              {workflowOpen === "category" ? <DrawerSection eyebrow="Business routing" title="Which operating domain owns this conversation?" description="Classification controls filters, saved views, reporting and future automation." icon={Tag} tone="violet"><div className="grid gap-2 sm:grid-cols-2">{[['parent_client','Parent / client','Family and service communication.',Users,'emerald'],['b2b','B2B','Institutional commercial demand.',Building2,'violet'],['partnership','Partnership','Strategic partnership development.',Link2,'sky'],['recruitment','Recruitment','Candidate and hiring activity.',UserCheck,'indigo'],['finance_payment','Finance / payment','Invoice and payment handling.',FileText,'amber'],['complaint','Complaint','Formal dissatisfaction or service risk.',AlertTriangle,'rose'],['supplier','Supplier','Procurement and supplier operations.',Building2,'slate'],['internal','Internal','Cross-team internal communication.',Users,'sky'],['other','Other','Unclassified or exceptional purpose.',Tag,'slate']].map(([value,title,description,Icon,tone]: any) => <DrawerOption key={value} title={title} description={description} icon={Icon} tone={tone} selected={workflowForm.category === value} onClick={() => setWorkflowForm((current) => ({ ...current, category: value }))} />)}</div></DrawerSection> : null}
              {workflowOpen === "assign" ? <DrawerSection eyebrow="Accountability" title="Select the responsible AngelCare operator" description="The directory displays real full names and workload; Email-OS stores the immutable user ID and historical snapshot automatically." icon={UserCheck} tone="indigo"><DrawerField label="Search staff directory" hint="Search full name, professional email, role or department."><input value={ownerSearch} onChange={(event) => setOwnerSearch(event.target.value)} placeholder="Search AngelCare operators…" className={drawerInputClass} /></DrawerField><div className="mt-3 grid gap-2 sm:grid-cols-2">{ownerWorkloadItems().filter((item) => item.id !== "unassigned").slice(0, 12).map((item) => <DrawerOption key={item.id} title={item.title} description={item.body || "AngelCare operator"} badge={item.meta} icon={UserCheck} tone={item.overdue ? 'rose' : 'indigo'} selected={workflowForm.ownerUserId === item.id} onClick={() => setWorkflowForm((current) => ({ ...current, ownerUserId: item.id }))} />)}</div><details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-black text-slate-600">Technical identity fallback</summary><div className="mt-3"><DrawerField label="Immutable user ID" required><input value={workflowForm.ownerUserId} onChange={(event) => setWorkflowForm((current) => ({ ...current, ownerUserId: event.target.value }))} placeholder="Technical user ID" className={drawerInputClass} /></DrawerField></div></details></DrawerSection> : null}
              <DrawerSection eyebrow="Decision evidence" title="Record the reason" description="A concise reason improves handoff quality, accountability and future audit review." icon={History} tone="slate"><DrawerField label="Internal reason / note" hint="Optional, but strongly recommended for high, urgent, VIP, resolved or reassigned decisions."><textarea value={workflowForm.note} onChange={(event) => setWorkflowForm((current) => ({ ...current, note: event.target.value }))} placeholder="Reason, expected result or ownership context…" className={`${drawerTextareaClass} min-h-28`} /></DrawerField></DrawerSection>
            </div>
          </EnterpriseDrawer>
        ) : null}

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-600">{status}</div>
      </div>
    </div>
  )
}


function OperatorTag({ label, name, tone }: { label: string; name: string; tone: "violet" | "sky" | "indigo" }) {
  const tones = { violet: "border-violet-200 bg-violet-50 text-violet-700", sky: "border-sky-200 bg-sky-50 text-sky-700", indigo: "border-indigo-200 bg-indigo-50 text-indigo-700" }
  const words = String(name || "AC").trim().split(/\s+/).filter(Boolean)
  const initials = words.length > 1 ? `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase() : (words[0] || "AC").slice(0, 2).toUpperCase()
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 normal-case tracking-normal ${tones[tone]}`}><span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[7px] font-black shadow-sm">{initials}</span><span className="text-[9px] font-black uppercase tracking-[0.08em] opacity-70">{label}</span><span className="max-w-[150px] truncate text-[10px] font-black">{name}</span></span>
}

function OperatorIdentityBadge({ label, name, role, department, tone }: { label: string; name: string; role?: string; department?: string; tone: "violet" | "sky" | "indigo" }) {
  const tones = { violet: "border-violet-200 bg-gradient-to-r from-violet-50 to-white text-violet-700", sky: "border-sky-200 bg-gradient-to-r from-sky-50 to-white text-sky-700", indigo: "border-indigo-200 bg-gradient-to-r from-indigo-50 to-white text-indigo-700" }
  const words = String(name || "AC").trim().split(/\s+/).filter(Boolean)
  const initials = words.length > 1 ? `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase() : (words[0] || "AC").slice(0, 2).toUpperCase()
  return <div className={`inline-flex min-w-0 items-center gap-2.5 rounded-[16px] border px-2.5 py-2 shadow-sm ${tones[tone]}`}><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white bg-white text-[10px] font-black shadow-sm">{initials}</div><div className="min-w-0"><div className="text-[8px] font-black uppercase tracking-[0.15em] opacity-65">{label}</div><div className="truncate text-xs font-black text-slate-950">{name}</div>{role || department ? <div className="truncate text-[9px] font-bold text-slate-500">{[role, department].filter(Boolean).join(" · ")}</div> : null}</div></div>
}


function Kpi({ label, value, tone }: { label: string; value: string; tone: "blue" | "amber" | "slate" | "green" | "rose" }) {
  const toneMap = {
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200"
  }

  return (
    <div className={`group relative overflow-hidden rounded-[22px] border p-4 shadow-[0_10px_30px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,.08)] ${toneMap[tone]}`}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-current opacity-35" />
      <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-65">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.05em]">{value}</div>
    </div>
  )
}

function commandToneClasses(tone: CommandTone) {
  const tones: Record<CommandTone, { surface: string; icon: string; value: string; hover: string }> = {
    primary: { surface: "border-sky-200 bg-gradient-to-br from-sky-50 to-white text-slate-900", icon: "border-sky-200 bg-sky-600 text-white", value: "bg-sky-100 text-sky-800", hover: "hover:border-sky-300 hover:shadow-[0_16px_35px_rgba(14,165,233,.14)]" },
    decision: { surface: "border-blue-200 bg-gradient-to-br from-blue-50 to-white text-slate-900", icon: "border-blue-200 bg-blue-600 text-white", value: "bg-blue-100 text-blue-800", hover: "hover:border-blue-300 hover:shadow-[0_16px_35px_rgba(37,99,235,.13)]" },
    workflow: { surface: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white text-slate-900", icon: "border-indigo-200 bg-indigo-600 text-white", value: "bg-indigo-100 text-indigo-800", hover: "hover:border-indigo-300 hover:shadow-[0_16px_35px_rgba(79,70,229,.13)]" },
    intelligence: { surface: "border-violet-200 bg-gradient-to-br from-violet-50 to-white text-slate-900", icon: "border-violet-200 bg-violet-600 text-white", value: "bg-violet-100 text-violet-800", hover: "hover:border-violet-300 hover:shadow-[0_16px_35px_rgba(124,58,237,.13)]" },
    success: { surface: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-slate-900", icon: "border-emerald-200 bg-emerald-600 text-white", value: "bg-emerald-100 text-emerald-800", hover: "hover:border-emerald-300 hover:shadow-[0_16px_35px_rgba(5,150,105,.13)]" },
    warning: { surface: "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-slate-900", icon: "border-amber-200 bg-amber-500 text-white", value: "bg-amber-100 text-amber-800", hover: "hover:border-amber-300 hover:shadow-[0_16px_35px_rgba(245,158,11,.13)]" },
    danger: { surface: "border-rose-200 bg-gradient-to-br from-rose-50 to-white text-slate-900", icon: "border-rose-200 bg-rose-600 text-white", value: "bg-rose-100 text-rose-800", hover: "hover:border-rose-300 hover:shadow-[0_16px_35px_rgba(225,29,72,.13)]" },
    quiet: { surface: "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-900", icon: "border-slate-200 bg-white text-slate-600", value: "bg-slate-100 text-slate-700", hover: "hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,.08)]" }
  }
  return tones[tone]
}

function HeaderActionButton({ label, icon: Icon, tone = "quiet", onClick }: { label: string; icon: any; tone?: CommandTone; onClick: () => void }) {
  const styles = commandToneClasses(tone)
  return <button type="button" onClick={onClick} className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${styles.surface} ${styles.hover}`}><Icon className="h-4 w-4" />{label}</button>
}

function DossierSignal({ label, value, icon: Icon, tone, onClick }: { label: string; value: string; icon: any; tone: "blue" | "green" | "amber" | "rose" | "slate"; onClick?: () => void }) {
  const tones = {
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  }
  const content = <><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/80 shadow-sm"><Icon className="h-4 w-4" /></div><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-65">{label}</div><div className="mt-0.5 truncate text-xs font-black">{value}</div></div></>
  const className = `flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${tones[tone]} ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : ""}`
  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <div className={className}>{content}</div>
}

function CommandGroup({ title, description, icon: Icon, tone, children }: { title: string; description: string; icon: any; tone: CommandTone; children: any }) {
  const styles = commandToneClasses(tone)
  return <section className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-2.5"><div className="flex items-start gap-2.5 px-1 pb-2.5"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}><Icon className="h-4 w-4" /></div><div><h4 className="text-sm font-black text-slate-950">{title}</h4><p className="mt-0.5 text-[11px] font-semibold leading-5 text-slate-500">{description}</p></div></div><div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">{children}</div></section>
}

function CommandActionButton({ label, description, currentValue, badge, icon: Icon, tone = "quiet", onClick, busy, disabled }: CommandActionProps) {
  const styles = commandToneClasses(tone)
  return <button type="button" onClick={onClick} disabled={disabled || busy} title={disabled ? description : undefined} aria-busy={busy || undefined} className={`group flex min-h-[70px] w-full items-start gap-2.5 rounded-[18px] border p-2.5 text-left transition motion-reduce:transition-none focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-55 ${styles.surface} ${styles.hover}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border transition group-hover:scale-[1.03] ${styles.icon}`}><Icon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-sm font-black text-slate-900">{busy ? "Processing…" : label}</span>{badge ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${styles.value}`}>{badge}</span> : <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-sky-500" />}</div>{currentValue ? <div className={`mt-1 inline-flex max-w-full truncate rounded-lg px-2 py-1 text-[10px] font-black ${styles.value}`}>{currentValue}</div> : null}{description ? <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div></button>
}

function OverflowActionItem({ icon: Icon, label, description, onClick }: { icon: any; label: string; description: string; onClick: () => void }) {
  return <button role="menuitem" type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-sky-50 focus:bg-sky-50 focus:outline-none"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"><Icon className="h-4 w-4" /></div><div><div className="text-xs font-black text-slate-900">{label}</div><div className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">{description}</div></div></button>
}

function PanelCommandIcon() {
  return <div className="relative"><Sparkles className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400" /></div>
}

function RailMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"><div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</div><div className="mt-1 truncate text-xs font-black text-white">{value}</div></div>
}

function RailSection({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: any }) {
  return <section className="rounded-[22px] border border-slate-200 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,.05)]"><div className="px-1 pb-3"><div className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-600">{eyebrow}</div><h3 className="mt-1 text-sm font-black text-slate-950">{title}</h3>{description ? <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div><div className="grid gap-2">{children}</div></section>
}

function RailAction({ label, description, badge, icon: Icon, tone = "quiet", onClick, busy, disabled, compact }: CommandActionProps) {
  const styles = commandToneClasses(tone)
  return <button type="button" onClick={onClick} disabled={disabled || busy} title={disabled ? description : undefined} aria-busy={busy || undefined} className={`group flex w-full items-center gap-2.5 rounded-[17px] border px-2.5 py-2.5 text-left transition motion-reduce:transition-none focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-55 ${styles.surface} ${styles.hover}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}><Icon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-black text-slate-900">{busy ? "Processing…" : label}</span>{badge ? <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${styles.value}`}>{badge}</span> : <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-sky-500" />}</div>{!compact && description ? <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div></button>
}

function EvidenceMetric({ label, value, tone }: { label: string; value: string; tone: "blue" | "amber" | "violet" | "green" | "slate" }) {
  const tones = { blue: "border-sky-100 bg-sky-50 text-sky-700", amber: "border-amber-100 bg-amber-50 text-amber-700", violet: "border-violet-100 bg-violet-50 text-violet-700", green: "border-emerald-100 bg-emerald-50 text-emerald-700", slate: "border-slate-200 bg-slate-50 text-slate-600" }
  return <div className={`rounded-2xl border px-3 py-2 ${tones[tone]}`}><div className="text-[9px] font-black uppercase tracking-[0.13em] opacity-65">{label}</div><div className="mt-1 text-lg font-black tracking-[-0.03em]">{value}</div></div>
}



type HeroSemanticTone = "success" | "warning" | "danger" | "info"

function HeroStatusBadge({ tone, label, icon: Icon }: { tone: HeroSemanticTone; label: string; icon: any }) {
  const tones: Record<HeroSemanticTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700"
  }
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-xl border px-2.5 text-[10px] font-black ${tones[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function HeroMetadataChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-1 shadow-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-sky-700" />
      <span className="max-w-[240px] truncate">{label}</span>
    </span>
  )
}

function HeroIdentitySignal({
  eyebrow,
  value,
  detail,
  icon: Icon,
  tone
}: {
  eyebrow: string
  value: string
  detail: string
  icon: any
  tone: "blue" | "violet" | "amber" | "green"
}) {
  const tones = {
    blue: "border-sky-100 bg-gradient-to-br from-sky-50 to-white text-sky-700",
    violet: "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-700",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-700",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-700"
  }
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-[16px] border px-2.5 py-2 ${tones[tone]}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white bg-white/90 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[8px] font-black uppercase tracking-[0.16em] opacity-65">{eyebrow}</div>
        <div className="mt-0.5 truncate text-xs font-black text-slate-950">{value}</div>
        <div className="mt-0.5 truncate text-[9px] font-bold text-slate-500">{detail}</div>
      </div>
    </div>
  )
}

function HeroBriefingSignal({
  title,
  detail,
  tone,
  icon: Icon
}: {
  title: string
  detail: string
  tone: "blue" | "violet" | "amber" | "rose" | "green"
  icon: any
}) {
  const tones = {
    blue: "border-sky-100 bg-sky-50/80 text-sky-700",
    violet: "border-violet-100 bg-violet-50/80 text-violet-700",
    amber: "border-amber-100 bg-amber-50/80 text-amber-700",
    rose: "border-rose-100 bg-rose-50/80 text-rose-700",
    green: "border-emerald-100 bg-emerald-50/80 text-emerald-700"
  }
  return (
    <div className={`group/signal flex items-center gap-2.5 rounded-[16px] border px-2.5 py-2 transition hover:-translate-y-0.5 hover:shadow-sm ${tones[tone]}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white bg-white/90 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-black text-slate-950">{title}</div>
        <div className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-slate-500">{detail}</div>
      </div>
    </div>
  )
}

function HeroUtilityAction({
  icon: Icon,
  label,
  helper,
  tone = "slate",
  onClick
}: {
  icon: any
  label: string
  helper: string
  tone?: "slate" | "sky" | "violet" | "emerald" | "danger"
  onClick: () => void
}) {
  const styles = {
    slate: {
      shell: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      icon: "border-slate-200 bg-slate-100 text-slate-700 group-hover:bg-slate-200",
      helper: "text-slate-500"
    },
    sky: {
      shell: "border-sky-200 bg-sky-50/70 hover:border-sky-300 hover:bg-sky-50",
      icon: "border-sky-200 bg-sky-100 text-sky-700 group-hover:bg-sky-200",
      helper: "text-sky-700"
    },
    violet: {
      shell: "border-violet-200 bg-violet-50/65 hover:border-violet-300 hover:bg-violet-50",
      icon: "border-violet-200 bg-violet-100 text-violet-700 group-hover:bg-violet-200",
      helper: "text-violet-700"
    },
    emerald: {
      shell: "border-emerald-200 bg-emerald-50/65 hover:border-emerald-300 hover:bg-emerald-50",
      icon: "border-emerald-200 bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
      helper: "text-emerald-700"
    },
    danger: {
      shell: "border-rose-200 bg-rose-50/75 hover:border-rose-300 hover:bg-rose-100/80",
      icon: "border-rose-200 bg-rose-100 text-rose-700 group-hover:bg-rose-200",
      helper: "text-rose-700"
    }
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-12 min-w-0 items-center gap-2.5 rounded-[15px] border px-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,.075)] focus:outline-none focus:ring-4 focus:ring-sky-100 active:translate-y-0 ${styles.shell}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border transition ${styles.icon}`}>
        <Icon className="h-4 w-4" strokeWidth={2.15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-black tracking-[-0.01em] text-slate-950">{label}</span>
        <span className={`mt-0.5 block truncate text-[8px] font-black uppercase tracking-[0.1em] ${styles.helper}`}>{helper}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  )
}

function HeroHealthRow({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone: HeroSemanticTone
}) {
  const dot = {
    success: "bg-emerald-500",
    warning: "bg-amber-400",
    danger: "bg-rose-500",
    info: "bg-sky-500"
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/65 px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot[tone]}`} />
        <span className="truncate text-[10px] font-bold text-slate-500">{label}</span>
      </div>
      <span className="truncate text-right text-[10px] font-black text-slate-800">{value}</span>
    </div>
  )
}

function HeroPulseMetric({
  label,
  value,
  helper,
  tone
}: {
  label: string
  value: string
  helper: string
  tone: HeroSemanticTone
}) {
  return (
    <div className="rounded-[15px] border border-white/15 bg-white/[0.10] px-2.5 py-1.5 text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.14]">
      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-white/80">
        <span className={`h-1.5 w-1.5 rounded-full ${tone === "success" ? "bg-emerald-300" : tone === "warning" ? "bg-amber-300" : tone === "danger" ? "bg-rose-300" : "bg-sky-300"}`} />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-black tracking-[-0.03em] text-white">{value}</div>
      <div className="mt-0.5 truncate text-[8px] font-bold text-white/70">{helper}</div>
    </div>
  )
}

function ExecutiveHeroMetric({
  label,
  value,
  description,
  icon: Icon,
  tone,
  onClick
}: {
  label: string
  value: number
  description: string
  icon: any
  tone: "blue" | "violet" | "cyan" | "slate" | "amber" | "rose" | "green" | "indigo"
  onClick?: () => void
}) {
  const tones = {
    blue: { card: "border-sky-200 bg-gradient-to-br from-white via-sky-50 to-blue-50", icon: "bg-sky-600 text-white shadow-sky-200", value: "text-sky-800", accent: "from-sky-500 to-blue-600" },
    violet: { card: "border-violet-200 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50", icon: "bg-violet-600 text-white shadow-violet-200", value: "text-violet-800", accent: "from-violet-500 to-fuchsia-600" },
    cyan: { card: "border-cyan-200 bg-gradient-to-br from-white via-cyan-50 to-sky-50", icon: "bg-cyan-600 text-white shadow-cyan-200", value: "text-cyan-800", accent: "from-cyan-500 to-sky-600" },
    slate: { card: "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100", icon: "bg-slate-700 text-white shadow-slate-200", value: "text-slate-800", accent: "from-slate-500 to-slate-700" },
    amber: { card: "border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50", icon: "bg-amber-500 text-white shadow-amber-200", value: "text-amber-800", accent: "from-amber-400 to-orange-500" },
    rose: { card: "border-rose-200 bg-gradient-to-br from-white via-rose-50 to-red-50", icon: "bg-rose-600 text-white shadow-rose-200", value: "text-rose-800", accent: "from-rose-500 to-red-600" },
    green: { card: "border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-teal-50", icon: "bg-emerald-600 text-white shadow-emerald-200", value: "text-emerald-800", accent: "from-emerald-500 to-teal-600" },
    indigo: { card: "border-indigo-200 bg-gradient-to-br from-white via-indigo-50 to-blue-50", icon: "bg-indigo-600 text-white shadow-indigo-200", value: "text-indigo-800", accent: "from-indigo-500 to-blue-600" }
  }
  const styles = tones[tone]
  const content = (
    <>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent} opacity-80`} />
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-[12px] shadow-lg ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        {onClick ? <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover/metric:text-sky-500" /> : null}
      </div>
      <div className={`mt-1.5 text-[22px] font-black leading-none tracking-[-0.05em] ${styles.value}`}>{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">{label}</div>
      <div className="mt-0.5 line-clamp-1 text-[8px] font-semibold leading-3 text-slate-500">{description}</div>
    </>
  )
  const className = `group/metric relative min-h-[96px] overflow-hidden rounded-[18px] border p-2.5 text-left shadow-[0_12px_30px_rgba(15,23,42,.045)] transition hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(15,23,42,.09)] focus:outline-none focus:ring-4 focus:ring-sky-100 ${styles.card}`
  return onClick
    ? <button type="button" onClick={onClick} className={className}>{content}</button>
    : <div className={className}>{content}</div>
}


function MiniMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "danger" }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">{label}</div>
      <div className="text-lg font-black tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function ContextCard({ title, action, onAction, empty, items }: { title: string; action: string; onAction: () => void; empty: string; items: Array<{ id: string; title: string; body?: string; meta?: string }> }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.05)]">
      <div className="flex items-center justify-between gap-3">
        <div><div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Evidence</div><h3 className="mt-1 text-sm font-black text-slate-950">{title}</h3></div>
        {action ? <button type="button" onClick={onAction} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">{action}</button> : null}
      </div>
      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-[18px] border border-slate-100 bg-slate-50/80 p-3">
            <div className="text-xs font-black text-slate-900">{item.title}</div>
            {item.meta ? <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{item.meta}</div> : null}
            {item.body ? <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-600">{item.body}</div> : null}
          </div>
        ))}
        {!items.length ? <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">{empty}</div> : null}
      </div>
    </div>
  )
}
