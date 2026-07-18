"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  CalendarClock
} from "lucide-react"
import EnterpriseComposeModal from "@/components/email-os-core/EnterpriseComposeModal"
import StorageHealthPanel from "@/components/email-os-core/StorageHealthPanel"

type MessageRow = any
type TemplateRow = any

type WorkflowResponse = {
  currentUser?: { id?: string; name?: string | null; email?: string | null; role?: string | null }
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
  return clean(row?.fromName || row?.from_name || row?.toName || row?.to_name || row?.fromEmail || row?.from_email || row?.sender_email || row?.toEmail || row?.to_email || row?.recipient_email || "Expéditeur inconnu")
}

function getRowSenderEmail(row: MessageRow) {
  return clean(row?.fromEmail || row?.from_email || row?.sender_email || row?.toEmail || row?.to_email || row?.recipient_email || row?.raw?.fromEmail || "")
}

function getRowBody(row: MessageRow) {
  return clean(row?.bodyText || row?.body_text || row?.body || row?.text || row?.html || row?.preview || row?.raw?.text || row?.raw?.html || "")
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
  return Boolean(row?.permanentlyDeletedAt || row?.permanently_deleted_at) || ["deleted", "deleted_permanent", "permanently_deleted"].includes(normalizedStatus(row))
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
  if (isPermanentlyDeletedState(row)) return false
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
  if (view === "original") {
    if (row?.bodyHtml) return row.bodyHtml
    return row?.bodyText || row?.body || row?.preview || ""
  }

  if (view === "plain") {
    return row?.bodyText || row?.body || row?.preview || ""
  }

  const source = row?.bodyText || row?.body || row?.preview || row?.bodyHtml || ""
  return String(source)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
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
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
}

function renderTemplate(template: TemplateRow, mailboxName: string, operatorName: string) {
  const replacements: Record<string, string> = {
    "{{first_name}}": "collaborateur",
    "{{company}}": "AngelCare",
    "{{mailbox}}": mailboxName,
    "{{operator}}": operatorName,
    "{{date}}": new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date()),
    "{{service}}": "la demande",
    "{{city}}": "Casablanca"
  }
  const subject = clean(template?.subject || template?.subject_template || template?.name || "")
  const body = clean(template?.body || template?.body_template || "").replace(/\\n/g, "\n")
  return {
    subject: Object.entries(replacements).reduce((value, [needle, replacement]) => value.replaceAll(needle, replacement), subject),
    body: Object.entries(replacements).reduce((value, [needle, replacement]) => value.replaceAll(needle, replacement), body)
  }
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
  const [savedViewsOpen, setSavedViewsOpen] = useState(false)
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
  const autoMarkSelectedReadRef = useRef<Set<string>>(new Set())

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
    async function loadTemplates() {
      const result = await api("/api/email-os/templates")
      if (result.ok) {
        setTemplates(Array.isArray(result.data) ? result.data : [])
      } else {
        setTemplates(BUILTIN_TEMPLATES)
      }
    }

    void loadTemplates()
  }, [])

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
          fromName: row.to_name || row.toName || row.to_email || row.toEmail || "Recipient",
          fromEmail: row.to_email || row.toEmail || row.recipient_email || "",
          preview: row.body_text || row.text || row.body || row.html || row.error || "",
          bodyText: row.body_text || row.text || row.body || row.html || row.error || "",
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
          fromName: row.to_name || row.toName || row.to_email || row.toEmail || "Draft recipient",
          fromEmail: row.to_email || row.toEmail || row.recipient_email || "",
          preview: row.body_text || row.text || row.body || row.html || "Saved draft",
          bodyText: row.body_text || row.text || row.body || row.html || "",
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
    const owner = clean(row.ownerUserId || row.owner_user_id).toLowerCase()
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
    templates: templates.length || BUILTIN_TEMPLATES.length
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
    const operatorName = currentUser?.name || currentUser?.email || "AngelCare"
    const rendered = renderTemplate(template, mailboxName, operatorName)
    setComposeMode("compose")
    setComposeSeed({
      initialSubject: rendered.subject,
      initialBody: `${rendered.body}\n\n${mailboxName}`,
      initialMailboxId: mailboxId || selected?.mailboxId || scopeMailbox?.id || "",
      selectedEmail: selected ? { ...selected, mailbox_id: mailboxId || selected.mailboxId } : null
    })
    setComposeOpen(true)
    setTemplateOpen(false)
  }

  function bridgeSyncedRowsToInboxRows(rows: any[]): MessageRow[] {
    return (Array.isArray(rows) ? rows : []).map((row: any) => ({
      id: clean(row.id || row.messageId || row.providerUid || row.provider_uid || row.externalId || row.external_id || `${mailboxId}:${row.subject}:${row.receivedAt || row.date || row.createdAt}`),
      mailboxId: clean(row.mailboxId || row.mailbox_id || mailboxId || ""),
      mailbox_id: clean(row.mailboxId || row.mailbox_id || mailboxId || ""),
      source: "inbox",
      sourceTable: "email_os_core_inbox",
      folder: "inbox",
      status: clean(row.status || "new"),
      subject: clean(row.subject || "(Sans objet)"),
      fromEmail: clean(row.fromEmail || row.from_email || row.sender || row.email || ""),
      from_email: clean(row.fromEmail || row.from_email || row.sender || row.email || ""),
      toEmail: clean(row.toEmail || row.to_email || ""),
      to_email: clean(row.toEmail || row.to_email || ""),
      body: clean(row.body || row.text || row.preview || row.snippet || ""),
      preview: clean(row.preview || row.snippet || row.body || row.text || ""),
      receivedAt: clean(row.receivedAt || row.received_at || row.date || row.createdAt || row.created_at || new Date().toISOString()),
      createdAt: clean(row.createdAt || row.created_at || row.receivedAt || row.received_at || new Date().toISOString()),
      updatedAt: clean(row.updatedAt || row.updated_at || new Date().toISOString()),
      raw: row.raw || row
    })).filter((row: any) => row.id)
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
    const syncedRows = bridgeSyncedRowsToInboxRows(result.data?.synced || [])

    setActiveFolder("inbox")
    setFilter("all")
    setQuery("")
    setSearchFilters(defaultSearchFilters)

    if (syncedRows.length) {
      setFolderRows((current) => uniqueMessageRows([...syncedRows, ...current]))
    }

    setStatus(`Synchronisé: ${fetched} message(s) fetched, ${inserted} inserted, ${updated} updated`)
    pushToast({
      tone: "success",
      title: "Sync completed",
      message: `${fetched} message(s) fetched`,
      detail: `${inserted} inserted · ${updated} updated · ${skipped} skipped`
    })

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
    const next = await api("/api/email-os/templates")
    if (next.ok) setTemplates(Array.isArray(next.data) ? next.data : [])
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
    const next = await api("/api/email-os/templates")
    if (next.ok) setTemplates(Array.isArray(next.data) ? next.data : [])
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

  function ownerLabel(row: MessageRow | null | undefined) {
    const owner = clean(row?.ownerName || row?.owner_name || row?.ownerUserName || row?.owner_user_name || row?.ownerUserId || row?.owner_user_id)
    if (owner) return owner
    return "Unassigned"
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
    const map = new Map<string, { id: string; title: string; body: string; meta: string; count: number; urgent: number; overdue: number }>()
    for (const row of teamQueueRows()) {
      const key = teamOwnerKey(row) || "unassigned"
      const title = key === "unassigned" ? "Unassigned queue" : ownerLabel(row)
      const current = map.get(key) || { id: key, title, body: "", meta: "", count: 0, urgent: 0, overdue: 0 }
      current.count += 1
      if (["urgent", "critical", "vip", "high"].includes(clean(row.priority).toLowerCase())) current.urgent += 1
      if (isOverdue(row) || slaStatus(row).tone === "danger") current.overdue += 1
      current.body = `${current.count} active message(s) · ${current.urgent} urgent/high`
      current.meta = current.overdue ? `${current.overdue} overdue` : "On track"
      map.set(key, current)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8)
  }

  function openHandoff() {
    if (!selected) return
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
    pushToast({ tone: "success", title: "Handoff completed", message: ownerLabel({ ownerUserId: handoffForm.ownerUserId } as any), detail: "Assignment, note and optional task were persisted." })
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

  function applySavedView(view: string) {
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
    setSavedViewsOpen(false)
  }

  function exportCsv() {
    const columns = ["id", "mailboxId", "subject", "sender", "senderEmail", "recipient", "status", "priority", "category", "ownerUserId", "receivedAt", "opened", "openCount"]
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

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <div className="flex h-screen w-full flex-col overflow-hidden px-3 py-3 lg:px-4">
        <section className="shrink-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,.08)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-violet-50 px-5 py-4">
            <div className="absolute right-0 top-0 h-28 w-80 rounded-bl-[80px] bg-gradient-to-br from-sky-200/40 via-violet-200/30 to-amber-100/30 blur-2xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/70">
                  <img src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="AngelCare" className="max-h-12 max-w-12 object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">ANGELCARE EMAIL-OS</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-3xl font-black tracking-[-0.05em] text-slate-950">{mailboxHeader.name}</h1>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{scoped ? "Déverrouillée" : "Admin"}</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">windows-bridge-pop3</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
                    <span>{mailboxHeader.email || "No mailbox email"}</span>
                    <span>•</span>
                    <span>{currentUser?.email || "operator"}</span>
                    <span>•</span>
                    <span>Dernière synchro {formatDate(lastSync?.created_at || lastSync?.timestamp || lastSync?.started_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => void syncNow()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white shadow-lg shadow-sky-200">
                  <RefreshCw className={`h-4 w-4 ${busyAction === "sync" ? "animate-spin" : ""}`} />
                  Sync now
                </button>
                <button type="button" onClick={() => { setComposeMode("compose"); setComposeSeed({ initialMailboxId: mailboxId || selected?.mailboxId || scopeMailbox?.id || "" }); setComposeOpen(true) }} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                  <PencilLine className="h-4 w-4" />
                  Compose
                </button>
                <button type="button" onClick={() => setTemplateOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                  <FileText className="h-4 w-4" />
                  Templates
                </button>
                <button type="button" onClick={() => setSearchOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <button type="button" onClick={exportCurrentView} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {scoped ? (
                  <button type="button" onClick={() => void lockMailbox()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700">
                    <LockKeyhole className="h-4 w-4" />
                    Lock
                  </button>
                ) : null}
              </div>
            </div>

            <div className="relative mt-4 grid gap-2 sm:grid-cols-4 xl:grid-cols-8">
              <MiniMetric label="Inbox" value={String(folderCounts.inbox)} />
              <MiniMetric label="Unread" value={String(folderCounts.unread)} />
              <MiniMetric label="Drafts" value={String(folderCounts.drafts)} />
              <MiniMetric label="Outbox" value={String(folderCounts.outbox)} />
              <MiniMetric label="Failed" value={String(folderCounts.failed)} />
              <MiniMetric label="Mine" value={String(aggregateStats.assigned_to_me)} />
              <MiniMetric label="Overdue" value={String(aggregateStats.overdue)} tone="danger" />
              <MiniMetric label="Waiting" value={String(aggregateStats.waiting)} />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-4 py-3">
            {mailboxFolders.map((folder) => {
              const Icon = folder.icon
              const selectedFolder = activeFolder === folder.key
              return (
                <button
                  key={folder.key}
                  type="button"
                  onClick={() => {
                    if (folder.key === "templates") setTemplateOpen(true)
                    setActiveFolder(folder.key)
                    setFilter("all")
                  }}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${selectedFolder ? "border-sky-300 bg-sky-600 text-white shadow-lg shadow-sky-100" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"}`}
                  title={folder.helper}
                >
                  <Icon className="h-4 w-4" />
                  <span>{folder.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${selectedFolder ? "bg-white/20 text-white" : "bg-white text-slate-500"}`}>{folder.count}</span>
                </button>
              )
            })}
          </div>
        </section>

        {error ? <div className="mt-3 shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        <section className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <aside className="flex min-h-0 flex-col rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.05)]">
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mailbox</div>
                  <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">{activeFolderMeta.label}</h2>
                </div>
                <button type="button" onClick={() => activeFolder === "templates" ? setTemplateOpen(true) : void load(selected?.id || null)} className="rounded-2xl bg-slate-50 p-2.5 text-slate-600">
                  <RefreshCw className={`h-4 w-4 ${loading || folderLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                {activeFolderMeta.label} · {messages.length} record(s)
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subject, sender, recipient, body, notes, tasks, CRM..." className="h-8 flex-1 bg-transparent text-sm font-semibold outline-none" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-9 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="priority">Priority</option>
                  <option value="sla_due">SLA due</option>
                  <option value="unassigned_first">Unassigned first</option>
                  <option value="opened_first">Opened first</option>
                  <option value="contact">Contact A-Z</option>
                </select>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setSearchOpen(true)} className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-700">Advanced</button>
                <button type="button" onClick={() => setSavedViewsOpen(true)} className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-700">Saved views</button>
                <button type="button" onClick={exportCsv} className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-black text-slate-700">CSV</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
                {[
                  ["all", "All"],
                  ["unread", "Unread"],
                  ["unassigned", "Unassigned"],
                  ["assigned_to_me", "Mine"],
                  ["team_queue", "Team queue"],
                  ["waiting_internal", "Waiting internal"],
                  ["handoff_needed", "Handoff"],
                  ["overdue", "Overdue"],
                  ["has_attachments", "Files"],
                  ["complaints", "Complaints"],
                  ["partnerships", "Partners"],
                  ["b2b", "B2B"],
                  ["finance_payment", "Finance"],
                  ["recruitment", "Hiring"],
                  ["archived_resolved", "Done"]
                ].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setFilter(key as FilterKey)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black ${filter === key ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700"}`}>
                    {label}
                  </button>
                ))}
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

          <main className="min-h-0 overflow-y-auto rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.05)]">
            {selected ? (
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.10em] text-slate-500">
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">{selected.mailboxName || selected.mailboxId}</span>
                      <span className={`rounded-full border px-2 py-1 ${statusTone(selected.status)}`}>{clean(selected.status) || "new"}</span>
                      <span className={`rounded-full border px-2 py-1 ${priorityTone(selected.priority)}`}>{clean(selected.priority) || "normal"}</span>
                      <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600">{categoryLabel(selected.category)}</span>
                      {selected.sla?.overdue ? <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">Overdue</span> : null}
                    </div>
                    <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 lg:text-3xl">{getRowSubject(selected)}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      {getRowSender(selected)} <span className="text-slate-400">·</span> {getRowSenderEmail(selected)} <span className="text-slate-400">·</span> {formatDate(selected.receivedAt)}
                    </p>
                    {activeFolder === "outbox" ? (
                      <button type="button" onClick={() => setTrackingOpen(true)} className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition hover:shadow-sm ${
                        trackingTone(selected) === "opened" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        trackingTone(selected) === "waiting" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                      }`}>
                        <Eye className={`h-4 w-4 ${isTrackingOpened(selected) ? "animate-pulse" : ""}`} />
                        {trackingLabel(selected)}
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["inbox", "unread", "all_mail"].includes(activeFolder) ? (
                      <>
                        <button type="button" onClick={openReply} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white"><Reply className="h-4 w-4" />Reply</button>
                        <button type="button" onClick={openForward} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"><Forward className="h-4 w-4" />Forward</button>
                        <button type="button" onClick={() => void runAction(isUnread(selected) ? "mark_read" : "mark_unread")} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"><MailOpen className="h-4 w-4" />{isUnread(selected) ? "Mark read" : "Mark unread"}</button>
                      </>
                    ) : null}
                    <button type="button" onClick={() => void runFolderPrimaryAction()} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700"><RotateCcw className="h-4 w-4" />{actionModel.primary}</button>
                    <button type="button" onClick={() => void runFolderDestructiveAction()} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700"><Trash2 className="h-4 w-4" />{actionModel.destructive}</button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton label="Change status" icon={Settings2} onClick={() => openWorkflowModal("status")} busy={busyAction === "set_status"} />
                  <ActionButton label="Set priority" icon={Clock3} onClick={() => openWorkflowModal("priority")} busy={busyAction === "set_priority"} />
                  <ActionButton label="Set category" icon={Tag} onClick={() => openWorkflowModal("category")} busy={busyAction === "set_category"} />
                  <ActionButton label="Assign" icon={UserCheck} onClick={() => openWorkflowModal("assign")} busy={busyAction === "assign_owner"} />
                  <ActionButton label="Team handoff" icon={UserCheck} onClick={() => openHandoff()} busy={busyAction === "handoff"} />
                  <ActionButton label="Team Ops" icon={Users} onClick={() => setTeamOpsOpen(true)} busy={false} />
                  <ActionButton label="Add note" icon={PencilLine} onClick={() => setNotesOpen(true)} busy={busyAction === "note"} />
                  <ActionButton label="Create task" icon={CheckCircle2} onClick={() => setTaskOpen(true)} busy={busyAction === "task"} />
                  <ActionButton label="Link record" icon={Link2} onClick={() => openSmartLink()} busy={busyAction === "link"} />
                  <ActionButton label="CRM convert" icon={Sparkles} onClick={() => setCrmQuickOpen(true)} busy={Boolean(busyAction?.startsWith("convert_"))} />
                  <ActionButton label="Timeline" icon={LayoutGrid} onClick={() => setTimelineOpen(true)} busy={false} />
                  <ActionButton label="OPS Copilot" icon={Sparkles} onClick={() => setOpsCopilotOpen(true)} busy={busyAction === "ops_copilot"} />
                  <ActionButton label="Resolve" icon={CheckCircle2} onClick={() => void runAction("resolve")} busy={busyAction === "resolve"} />
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700"><Eye className="h-4 w-4" />Message</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setBodyMode("clean")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "clean" ? "bg-sky-600 text-white" : "bg-white text-slate-600"}`}>Clean</button>
                      <button type="button" onClick={() => setBodyMode("plain")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "plain" ? "bg-sky-600 text-white" : "bg-white text-slate-600"}`}>Plain</button>
                      <button type="button" onClick={() => setBodyMode("original")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "original" ? "bg-sky-600 text-white" : "bg-white text-slate-600"}`}>Original</button>
                    </div>
                  </div>
                  {selected.bodyHtml && bodyMode === "original" ? (
                    <div className="prose max-w-none rounded-2xl border border-slate-200 bg-white p-5"><div dangerouslySetInnerHTML={{ __html: readyHtml(String(selected.bodyHtml)) }} /></div>
                  ) : (
                    <pre className="min-h-[240px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">{bodyView(selected, bodyMode)}</pre>
                  )}
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700"><Paperclip className="h-4 w-4" />Attachments</div>
                  {selected.attachments?.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {selected.attachments.map((attachment: any) => (
                        <div key={`${attachment.filename}-${attachment.size}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="font-black text-slate-900">{attachment.filename}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{attachment.contentType} · {attachment.size ? `${attachment.size} bytes` : "size unknown"}</div>
                          <div className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">{attachment.storageFileId ? "Stored on AngelCare Windows Node" : "Legacy attachment — send supported"}</div>
                          {attachment.storageFileId ? (
                            <a href={`/api/storage/download/${attachment.storageFileId}?mailboxId=${encodeURIComponent(selected.mailboxId || mailboxId || "")}`} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white"><Download className="h-3.5 w-3.5" />Download</a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">No attachment recorded for this message.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[50vh] items-center justify-center p-10 text-center">
                <div>
                  <MailOpen className="mx-auto h-12 w-12 text-slate-300" />
                  <div className="mt-4 text-xl font-black text-slate-900">Select a message</div>
                  <p className="mt-2 text-sm font-semibold text-slate-500">The conversation, reply tools, and context will appear here.</p>
                </div>
              </div>
            )}
          </main>

          <aside className="min-h-0 overflow-y-auto rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,.05)]">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="flex items-center gap-2 font-black text-sky-700"><Sparkles className="h-5 w-5" />Actions</div>
              <div className="mt-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {activeFolderMeta.label}
              </div>
              <div className="mt-3 grid gap-2">
                {selected && ["inbox", "unread", "all_mail"].includes(activeFolder) ? (
                  <>
                    <button type="button" onClick={openReply} className="h-10 rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Reply</button>
                    <button type="button" onClick={openForward} className="h-10 rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Forward</button>
                  </>
                ) : null}
                {selected ? (
                  <>
                    <button type="button" onClick={() => void runFolderPrimaryAction()} className="h-10 rounded-2xl bg-white text-sm font-black text-emerald-700 shadow-sm">{actionModel.primary}</button>
                    <button type="button" onClick={() => void runFolderDestructiveAction()} className="h-10 rounded-2xl bg-white text-sm font-black text-rose-700 shadow-sm">{actionModel.destructive}</button>
                    <button type="button" onClick={() => setNotesOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Add note</button>
                    <button type="button" onClick={() => setTaskOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Create task</button>
                    <button type="button" onClick={() => setCrmQuickOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-violet-700 shadow-sm">CRM convert</button>
                    <button type="button" onClick={() => setOpsCopilotOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-sky-700 shadow-sm">OPS Copilot</button>
                    <button type="button" onClick={() => openHandoff()} className="h-10 rounded-2xl bg-white text-sm font-black text-indigo-700 shadow-sm">Team handoff</button>
                    <button type="button" onClick={() => setTeamOpsOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Team Ops</button>
                    {activeFolder === "outbox" ? <button type="button" onClick={() => setTrackingOpen(true)} className="h-10 rounded-2xl bg-white text-sm font-black text-emerald-700 shadow-sm">Tracking</button> : null}
                    {activeFolder === "outbox" ? <button type="button" onClick={() => void refreshSelectedTracking()} className="h-10 rounded-2xl bg-white text-sm font-black text-amber-700 shadow-sm">Refresh tracking</button> : null}
                  </>
                ) : (
                  <div className="rounded-2xl bg-white px-3 py-4 text-sm font-bold text-slate-500">Select a message to open actions.</div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <ContextCard title="Notes" action="Add" onAction={() => setNotesOpen(true)} empty="No internal notes yet." items={notes.map((note: any) => ({ id: note.id, title: note.author_name || note.author_user_id || "internal", body: note.body, meta: formatDate(note.created_at) }))} />
              <ContextCard title="Tasks" action="Create" onAction={() => setTaskOpen(true)} empty="No open tasks." items={tasks.map((task: any) => ({ id: task.id, title: task.title, body: task.description || task.note || "—", meta: `${task.priority} · ${formatDate(task.due_at)}` }))} />
              <ContextCard title="Timeline intelligence" action="Open" onAction={() => setTimelineOpen(true)} empty="Select a message to view contact/entity timeline." items={selected ? entityTimelineItems().slice(0, 5) : []} />
              <ContextCard title="Team operations" action="Open" onAction={() => setTeamOpsOpen(true)} empty="No team workload yet." items={[
                { id: "team-total", title: "Active team queue", body: `${teamQueueSummary().total} active · ${teamQueueSummary().unassigned} unassigned`, meta: `${teamQueueSummary().overdue} overdue` },
                ...ownerWorkloadItems()
              ]} />
              <ContextCard title="Tracking intelligence" action="Open" onAction={() => setTrackingOpen(true)} empty="Select a sent email to view read tracking." items={selected && activeFolder === "outbox" ? [
                { id: "tracking", title: trackingLabel(selected), body: trackingFollowupSuggestion(selected), meta: isTrackingOpened(selected) ? "Opened" : "Waiting" },
                { id: "tracking-id", title: "Tracking ID", body: selected.trackingId || selected.tracking_id || "No tracking id", meta: `${Number(selected.openCount || selected.open_count || 0)} open(s)` }
              ] : []} />
              <ContextCard title="OPS intelligence" action="Open" onAction={() => setOpsCopilotOpen(true)} empty="Select a message to calculate operational intelligence." items={selected ? [
                { id: "sla", title: slaStatus(selected).label, body: slaStatus(selected).detail, meta: slaStatus(selected).profile.label },
                { id: "brief", title: "Operational brief", body: copilotSummary(selected), meta: "OPS Copilot" }
              ] : []} />
              <ContextCard title="Contact intelligence" action="Convert" onAction={() => setCrmQuickOpen(true)} empty="Select a message to build contact intelligence." items={selected ? [
                { id: "contact", title: selectedContactName(), body: selectedContactEmail() || "No email detected", meta: inferredEntityType() },
                ...contactTimelineItems()
              ] : []} />
              <ContextCard title="Links" action="Link" onAction={() => openSmartLink()} empty="No linked record." items={links.map((link: any) => ({ id: link.id, title: link.entity_label || link.entity_id, body: link.entity_type, meta: "Linked" }))} />
              <ContextCard title="Audit timeline" action="" onAction={() => {}} empty="No audit events yet." items={audit.slice(0, 8).map((event: any) => ({ id: event.id || `${event.action}-${event.created_at}`, title: event.action || event.event_type || "workflow event", body: event.details?.summary || event.details?.action || event.severity || "Recorded action", meta: formatDate(event.created_at || event.createdAt) }))} />
            </div>

            <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-800">System health & diagnostics</summary>
              <div className="mt-3 space-y-2 text-xs font-semibold text-slate-500">
                <div>Mailbox: {mailboxHeader.name}</div>
                <div>Email: {mailboxHeader.email || "—"}</div>
                <div>Sync source: windows-bridge-pop3</div>
                <div>Waiting: {stats?.waiting || 0}</div>
                <div>High priority: {messages.filter((row) => ["vip", "urgent", "high"].includes(clean(row.priority).toLowerCase())).length}</div>
                {selected ? <div>Message ID: {selected.id}</div> : null}
                <div>Status: {status}</div>
              </div>
            </details>
            {!mailboxId ? <div className="mt-4"><StorageHealthPanel /></div> : null}
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

        {templateOpen ? (
          <Drawer title="Templates" onClose={() => setTemplateOpen(false)}>
            <div className="grid gap-3">
              <input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)} placeholder="Search templates" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={templateForm.name} onChange={(e) => setTemplateForm((current) => ({ ...current, name: e.target.value }))} placeholder="Template name" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                  <select value={templateForm.category} onChange={(e) => setTemplateForm((current) => ({ ...current, category: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                    <option value="parent_client">Parent/client</option>
                    <option value="b2b">B2B</option>
                    <option value="partnership">Partnership</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="finance_payment">Finance/payment</option>
                    <option value="complaint">Complaint</option>
                    <option value="supplier">Supplier</option>
                    <option value="internal">Internal</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={templateForm.subject} onChange={(e) => setTemplateForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject template" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none md:col-span-2" />
                  <textarea value={templateForm.body} onChange={(e) => setTemplateForm((current) => ({ ...current, body: e.target.value }))} placeholder="Body template" className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none md:col-span-2" />
                  <button type="button" onClick={() => void saveTemplate()} className="h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">{templateForm.id ? "Save changes" : "Create template"}</button>
                </div>
              </div>
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-900">{template.name}</div>
                        <div className="text-xs font-semibold text-slate-500">{template.category} · {template.language || "fr"}</div>
                        <div className="mt-2 text-sm text-slate-600">{template.subject || template.subject_template || "—"}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => openTemplate(template)} className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white">Insert</button>
                        <button type="button" onClick={() => editTemplate(template)} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">Edit</button>
                        <button type="button" onClick={() => archiveTemplate(template.id)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Archive</button>
                      </div>
                    </div>
                    <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{template.body || template.body_template}</div>
                  </div>
                ))}
              </div>
            </div>
          </Drawer>
        ) : null}

        {notesOpen ? (
          <Drawer title="Add internal note" onClose={() => setNotesOpen(false)}>
            <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Internal note" className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
            <button type="button" onClick={() => void addNote()} className="mt-4 h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">Save note</button>
          </Drawer>
        ) : null}

        {taskOpen ? (
          <Drawer title="Create follow-up task" onClose={() => setTaskOpen(false)}>
            <div className="grid gap-3">
              <input value={taskForm.title} onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))} placeholder="Task title" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <textarea value={taskForm.description} onChange={(e) => setTaskForm((current) => ({ ...current, description: e.target.value }))} placeholder="Task description" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" value={taskForm.dueAt} onChange={(e) => setTaskForm((current) => ({ ...current, dueAt: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                <select value={taskForm.priority} onChange={(e) => setTaskForm((current) => ({ ...current, priority: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <input value={taskForm.ownerUserId} onChange={(e) => setTaskForm((current) => ({ ...current, ownerUserId: e.target.value }))} placeholder="Owner user id (optional)" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <textarea value={taskForm.note} onChange={(e) => setTaskForm((current) => ({ ...current, note: e.target.value }))} placeholder="Internal note" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
              <button type="button" onClick={() => void createTask()} className="h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">Create task</button>
            </div>
          </Drawer>
        ) : null}

        {linkOpen ? (
          <Drawer title="Link entity" onClose={() => setLinkOpen(false)}>
            <div className="grid gap-3">
              <select value={linkForm.entityType} onChange={(e) => setLinkForm((current) => ({ ...current, entityType: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                <option value="contact">Contact timeline</option>
                <option value="parent_client">Parent / client dossier</option>
                <option value="b2b_prospect">B2B prospect</option>
                <option value="quote_request">Quote request</option>
                <option value="support_case">Support case</option>
                <option value="complaint_case">Complaint case</option>
                <option value="partner">Partner</option>
                <option value="candidate">Candidate</option>
                <option value="supplier">Supplier</option>
                <option value="invoice_dossier">Invoice / payment dossier</option>
                <option value="internal_project">Internal project</option>
              </select>
              <input value={linkForm.entityId} onChange={(e) => setLinkForm((current) => ({ ...current, entityId: e.target.value }))} placeholder="Entity ID" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <input value={linkForm.entityLabel} onChange={(e) => setLinkForm((current) => ({ ...current, entityLabel: e.target.value }))} placeholder="Entity label" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <textarea value={linkForm.note} onChange={(e) => setLinkForm((current) => ({ ...current, note: e.target.value }))} placeholder="CRM note / dossier context" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
              <button type="button" onClick={() => void linkEntity()} className="h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">Link entity</button>
            </div>
          </Drawer>
        ) : null}

        {searchOpen ? (
          <Drawer title="Advanced search & filters" onClose={() => setSearchOpen(false)}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-600">Enterprise search</div>
                <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">Filter across sender, recipient, status, priority, CRM link, tracking/open state, SLA, attachment and dates.</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input value={searchFilters.sender} onChange={(e) => setSearchFilters((current) => ({ ...current, sender: e.target.value }))} placeholder="Sender email contains..." className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                <input value={searchFilters.recipient} onChange={(e) => setSearchFilters((current) => ({ ...current, recipient: e.target.value }))} placeholder="Recipient email contains..." className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                <input value={searchFilters.owner} onChange={(e) => setSearchFilters((current) => ({ ...current, owner: e.target.value }))} placeholder="Owner user id contains..." className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                <select value={searchFilters.status} onChange={(e) => setSearchFilters((current) => ({ ...current, status: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="">Any status</option>
                  <option value="new">New</option>
                  <option value="triaged">Triaged</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting_client">Waiting client</option>
                  <option value="waiting_internal">Waiting internal</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
                <select value={searchFilters.priority} onChange={(e) => setSearchFilters((current) => ({ ...current, priority: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="">Any priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="vip">VIP</option>
                </select>
                <select value={searchFilters.category} onChange={(e) => setSearchFilters((current) => ({ ...current, category: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="">Any category</option>
                  <option value="parent_client">Parent/client</option>
                  <option value="b2b">B2B</option>
                  <option value="partnership">Partnership</option>
                  <option value="recruitment">Recruitment</option>
                  <option value="finance_payment">Finance/payment</option>
                  <option value="complaint">Complaint</option>
                  <option value="supplier">Supplier</option>
                  <option value="internal">Internal</option>
                  <option value="other">Other</option>
                </select>
                <select value={searchFilters.opened} onChange={(e) => setSearchFilters((current) => ({ ...current, opened: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="any">Any tracking state</option>
                  <option value="opened">Opened</option>
                  <option value="not_opened">Not opened</option>
                </select>
                <select value={searchFilters.attachment} onChange={(e) => setSearchFilters((current) => ({ ...current, attachment: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="any">Any attachment state</option>
                  <option value="yes">Has attachments</option>
                  <option value="no">No attachments</option>
                </select>
                <select value={searchFilters.crm} onChange={(e) => setSearchFilters((current) => ({ ...current, crm: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="any">Any CRM state</option>
                  <option value="yes">Has CRM link</option>
                  <option value="no">No CRM link</option>
                </select>
                <select value={searchFilters.sla} onChange={(e) => setSearchFilters((current) => ({ ...current, sla: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="any">Any SLA state</option>
                  <option value="healthy">SLA healthy</option>
                  <option value="risk">SLA risk</option>
                  <option value="breach">SLA breach</option>
                </select>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">From date</span>
                  <input type="date" value={searchFilters.dateFrom} onChange={(e) => setSearchFilters((current) => ({ ...current, dateFrom: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">To date</span>
                  <input type="date" value={searchFilters.dateTo} onChange={(e) => setSearchFilters((current) => ({ ...current, dateTo: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSearchOpen(false)} className="h-11 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white">Apply filters</button>
                <button type="button" onClick={() => { setQuery(""); setFilter("all"); setSearchFilters(defaultSearchFilters) }} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">Reset</button>
                <button type="button" onClick={exportCsv} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">Export CSV</button>
              </div>
            </div>
          </Drawer>
        ) : null}

        {savedViewsOpen ? (
          <Drawer title="Saved operational views" onClose={() => setSavedViewsOpen(false)}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["urgent_mine", "My urgent emails", "Assigned/high-priority messages requiring immediate action."],
                ["unassigned_today", "Unassigned today", "Fresh messages not yet owned by the team."],
                ["opened_no_reply", "Opened but no reply", "Sent emails opened by recipients, ready for follow-up."],
                ["quote_requests", "Quote requests", "Devis, prix, tariff and quote-related conversations."],
                ["complaints", "Complaints", "Complaint/SLA-risk conversations."],
                ["recruitment", "Recruitment applications", "Candidate and hiring conversations."],
                ["waiting_internal", "Waiting internal", "Messages blocked on internal action."],
                ["overdue_followups", "Overdue follow-ups", "SLA breach or overdue queues."]
              ].map(([key, title, body]) => (
                <button key={key} type="button" onClick={() => applySavedView(key)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50">
                  <div className="text-sm font-black text-slate-900">{title}</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{body}</div>
                </button>
              ))}
            </div>
          </Drawer>
        ) : null}

        {timelineOpen ? (
          <Drawer title="Timeline intelligence" onClose={() => setTimelineOpen(false)}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Contact / entity history</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selected ? selectedContactName() : "No message selected"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{selected ? selectedContactEmail() || clean(selected.linkedEntityLabel || selected.linked_entity_label) || "No contact/entity detected" : "Select a message first."}</div>
              </div>

              <div className="grid gap-3">
                {entityTimelineItems().length ? entityTimelineItems().map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setTimelineOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-violet-200 hover:bg-violet-50">
                    <div className="text-sm font-black text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.body}</div>
                    <div className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{item.meta}</div>
                  </button>
                )) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">No related timeline records found in the current loaded workspace.</div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => openSmartLink()} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-violet-200 hover:bg-violet-50">
                  <div className="text-sm font-black text-slate-900">Link this message</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Attach current message to contact/client/quote/case.</div>
                </button>
                <button type="button" onClick={exportCsv} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 hover:bg-slate-50">
                  <div className="text-sm font-black text-slate-900">Export current result</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Download filtered search as CSV.</div>
                </button>
              </div>
            </div>
          </Drawer>
        ) : null}

        {handoffOpen ? (
          <Drawer title="Team handoff" onClose={() => setHandoffOpen(false)}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Selected message</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selected ? getRowSubject(selected) : "No message selected"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{selected ? `${getRowSender(selected)} · ${getRowSenderEmail(selected)}` : "—"}</div>
              </div>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Owner user ID</span>
                <input value={handoffForm.ownerUserId} onChange={(event) => setHandoffForm((current) => ({ ...current, ownerUserId: event.target.value }))} placeholder="Paste staff user id" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Priority</span>
                <select value={handoffForm.priority} onChange={(event) => setHandoffForm((current) => ({ ...current, priority: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="vip">VIP</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Follow-up due date optional</span>
                <input type="datetime-local" value={handoffForm.dueAt} onChange={(event) => setHandoffForm((current) => ({ ...current, dueAt: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Handoff note</span>
                <textarea value={handoffForm.note} onChange={(event) => setHandoffForm((current) => ({ ...current, note: event.target.value }))} placeholder="What should the next owner do?" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
              </label>

              <button type="button" onClick={() => void submitHandoff()} className="h-11 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white">
                Complete handoff
              </button>
            </div>
          </Drawer>
        ) : null}

        {teamOpsOpen ? (
          <Drawer title="Team operations cockpit" onClose={() => setTeamOpsOpen(false)}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Active queue</div>
                  <div className="mt-2 text-3xl font-black text-slate-950">{teamQueueSummary().total}</div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">Unassigned</div>
                  <div className="mt-2 text-3xl font-black text-amber-700">{teamQueueSummary().unassigned}</div>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-rose-600">Overdue</div>
                  <div className="mt-2 text-3xl font-black text-rose-700">{teamQueueSummary().overdue}</div>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-sky-600">Waiting internal</div>
                  <div className="mt-2 text-3xl font-black text-sky-700">{teamQueueSummary().waitingInternal}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-900">Owner workload</div>
                <div className="grid gap-2">
                  {ownerWorkloadItems().length ? ownerWorkloadItems().map((item) => (
                    <button key={item.id} type="button" onClick={() => { setFilter(item.id === "unassigned" ? "unassigned" : "team_queue"); setTeamOpsOpen(false) }} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-sky-200 hover:bg-sky-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{item.body}</div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{item.meta}</div>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No active team workload.</div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { setFilter("unassigned"); setTeamOpsOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-amber-200 hover:bg-amber-50">
                  <div className="text-sm font-black text-slate-900">Open unassigned queue</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Review messages that need an owner.</div>
                </button>
                <button type="button" onClick={() => { setFilter("waiting_internal"); setTeamOpsOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-200 hover:bg-sky-50">
                  <div className="text-sm font-black text-slate-900">Open waiting internal</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Review team-blocked conversations.</div>
                </button>
                <button type="button" onClick={() => { setFilter("handoff_needed"); setTeamOpsOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-indigo-200 hover:bg-indigo-50">
                  <div className="text-sm font-black text-slate-900">Open handoff-needed</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Find messages requiring ownership or handoff.</div>
                </button>
                <button type="button" onClick={() => { if (selected) openHandoff(); setTeamOpsOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 hover:bg-emerald-50">
                  <div className="text-sm font-black text-slate-900">Handoff selected message</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Assign, note, and optionally create follow-up.</div>
                </button>
              </div>
            </div>
          </Drawer>
        ) : null}

        {trackingOpen ? (
          <Drawer title="Tracking & read intelligence" onClose={() => setTrackingOpen(false)}>
            <div className="grid gap-4">
              <div className={`rounded-2xl border p-4 ${
                selected && isTrackingOpened(selected) ? "border-emerald-200 bg-emerald-50" :
                selected?.trackingEnabled ? "border-amber-200 bg-amber-50" :
                "border-slate-200 bg-slate-50"
              }`}>
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Eye className={`h-5 w-5 ${selected && isTrackingOpened(selected) ? "animate-pulse text-emerald-600" : "text-slate-500"}`} />
                  {selected ? trackingLabel(selected) : "No sent email selected"}
                </div>
                <div className="mt-2 text-xs font-bold leading-5 text-slate-600">{selected ? trackingFollowupSuggestion(selected) : "Open Sent / Outbox and select an email."}</div>
                {trackingRefreshAt ? <div className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Last tracking refresh: {formatDate(trackingRefreshAt)}</div> : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">First opened</div>
                  <div className="mt-2 text-sm font-black text-slate-900">{formatDate(selected?.firstOpenedAt || selected?.first_opened_at)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Last opened</div>
                  <div className="mt-2 text-sm font-black text-slate-900">{formatDate(selected?.lastOpenedAt || selected?.last_opened_at)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Open count</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{Number(selected?.openCount || selected?.open_count || 0)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Tracking ID</div>
                  <div className="mt-2 break-all text-xs font-black text-slate-700">{selected?.trackingId || selected?.tracking_id || "—"}</div>
                </div>
              </div>

              {trackingStatusDebug ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Tracking proof</div>
                  <div className="mt-2 break-all text-xs font-bold text-slate-600">URL: {trackingStatusDebug.trackingUrl || "Not recorded on this sent row"}</div>
                  <div className="mt-2 text-xs font-bold text-slate-600">Events: {Array.isArray(trackingStatusDebug.events) ? trackingStatusDebug.events.length : 0}</div>
                  <div className="mt-1 text-xs font-bold text-slate-600">Opened: {trackingStatusDebug.opened ? "yes" : "not detected"}</div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void refreshSelectedTracking()} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm hover:border-amber-300">
                  <div className="text-sm font-black text-amber-900">Refresh tracking status</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-amber-700">Pull latest open count and timestamps from tracking events.</div>
                </button>
                <button type="button" onClick={() => void createCopilotFollowupTask()} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 hover:bg-emerald-50">
                  <div className="text-sm font-black text-slate-900">Create follow-up task</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Prepare a timed reminder if no open/reply happens.</div>
                </button>
                <button type="button" onClick={() => { setNoteBody(trackingFollowupSuggestion(selected)); setNotesOpen(true); setTrackingOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 hover:bg-slate-50">
                  <div className="text-sm font-black text-slate-900">Save tracking note</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Attach read intelligence to the message notes.</div>
                </button>
              </div>
            </div>
          </Drawer>
        ) : null}

        {opsCopilotOpen ? (
          <Drawer title="OPS Copilot command center" onClose={() => setOpsCopilotOpen(false)}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-600">Operational intelligence</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selected ? inferOpsIntent(selected).label : "No message selected"}</div>
                <div className="mt-2 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-slate-700">{selected ? copilotSummary(selected) : "Select a message first."}</div>
              </div>

              {selected ? (
                <div className={`rounded-2xl border p-4 ${
                  slaStatus(selected).tone === "danger" ? "border-rose-200 bg-rose-50" :
                  slaStatus(selected).tone === "warning" ? "border-amber-200 bg-amber-50" :
                  "border-emerald-200 bg-emerald-50"
                }`}>
                  <div className="text-sm font-black text-slate-900">{slaStatus(selected).label}</div>
                  <div className="mt-1 text-xs font-bold text-slate-600">{slaStatus(selected).detail}</div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void applyCopilotTriage()} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-200 hover:bg-sky-50">
                  <div className="text-sm font-black text-slate-900">Apply smart triage</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Persist recommended status, priority and category.</div>
                </button>
                <button type="button" onClick={() => void createCopilotFollowupTask()} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-200 hover:bg-sky-50">
                  <div className="text-sm font-black text-slate-900">Create SLA follow-up task</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Open a prefilled task based on SLA target.</div>
                </button>
                <button type="button" onClick={() => void quickConvert(inferOpsIntent(selected).intent)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-violet-200 hover:bg-violet-50">
                  <div className="text-sm font-black text-slate-900">Convert to suggested dossier</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Create CRM link: {selected ? inferOpsIntent(selected).label : "—"}</div>
                </button>
                <button type="button" onClick={() => { setNoteBody(copilotSummary(selected)); setNotesOpen(true); setOpsCopilotOpen(false) }} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 hover:bg-slate-50">
                  <div className="text-sm font-black text-slate-900">Create internal brief note</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Prefill a note with the Copilot brief.</div>
                </button>
              </div>
            </div>
          </Drawer>
        ) : null}

        {crmQuickOpen ? (
          <Drawer title="CRM conversion studio" onClose={() => setCrmQuickOpen(false)}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-500">Detected contact</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selectedContactName() || "No sender selected"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{selectedContactEmail() || "No email detected"}</div>
                <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">Suggested: {inferredEntityType()}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["contact", "Contact timeline", "Keep all future exchanges visible by sender."],
                  ["parent_client", "Parent / client dossier", "Attach to family/client service record."],
                  ["b2b_prospect", "B2B prospect", "Prepare commercial follow-up."],
                  ["quote_request", "Quote request", "Convert to devis / pricing request."],
                  ["support_case", "Support case", "Open support/service case."],
                  ["complaint_case", "Complaint case", "Escalate as complaint."],
                  ["candidate", "Candidate file", "Treat as recruitment application."],
                  ["supplier", "Supplier dossier", "Attach to supplier record."]
                ].map(([type, title, body]) => (
                  <button key={type} type="button" onClick={() => void quickConvert(type)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50">
                    <div className="text-sm font-black text-slate-900">{title}</div>
                    <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{body}</div>
                  </button>
                ))}
              </div>

              <button type="button" onClick={() => openSmartLink()} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">Open advanced link form</button>
            </div>
          </Drawer>
        ) : null}

        {workflowOpen ? (
          <Drawer
            title={
              workflowOpen === "status"
                ? "Change message status"
                : workflowOpen === "priority"
                  ? "Set message priority"
                  : workflowOpen === "category"
                    ? "Set message category"
                    : "Assign message owner"
            }
            onClose={() => setWorkflowOpen(null)}
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Selected message</div>
                <div className="mt-2 text-lg font-black text-slate-950">{selected ? getRowSubject(selected) : "No message selected"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{selected ? `${getRowSender(selected)} · ${getRowSenderEmail(selected)}` : "—"}</div>
              </div>

              {workflowOpen === "status" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Status</span>
                  <select value={workflowForm.status} onChange={(event) => setWorkflowForm((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In progress</option>
                    <option value="waiting_client">Waiting client</option>
                    <option value="waiting_internal">Waiting internal</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              ) : null}

              {workflowOpen === "priority" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Priority</span>
                  <select value={workflowForm.priority} onChange={(event) => setWorkflowForm((current) => ({ ...current, priority: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="vip">VIP</option>
                  </select>
                </label>
              ) : null}

              {workflowOpen === "category" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Category</span>
                  <select value={workflowForm.category} onChange={(event) => setWorkflowForm((current) => ({ ...current, category: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none">
                    <option value="parent_client">Parent / client</option>
                    <option value="b2b">B2B</option>
                    <option value="partnership">Partnership</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="finance_payment">Finance / payment</option>
                    <option value="complaint">Complaint</option>
                    <option value="supplier">Supplier</option>
                    <option value="internal">Internal</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              ) : null}

              {workflowOpen === "assign" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Owner user ID</span>
                  <input value={workflowForm.ownerUserId} onChange={(event) => setWorkflowForm((current) => ({ ...current, ownerUserId: event.target.value }))} placeholder="Paste staff user id or keep current owner" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                </label>
              ) : null}

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Internal reason / note</span>
                <textarea value={workflowForm.note} onChange={(event) => setWorkflowForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional context for audit trail and team handoff" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none" />
              </label>

              <button type="button" onClick={() => void submitWorkflowModal()} className="h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">
                Apply workflow update
              </button>
            </div>
          </Drawer>
        ) : null}

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-600">{status}</div>
      </div>
    </div>
  )
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
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</div>
    </div>
  )
}

function ActionButton({ label, icon: Icon, onClick, busy }: { label: string; icon: any; onClick: () => void; busy?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
      <Icon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
      {busy ? "Saving..." : label}
    </button>
  )
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-950">{title}</h3>
        <button type="button" onClick={onAction} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">{action}</button>
      </div>
      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-50 p-3">
            <div className="text-sm font-black text-slate-900">{item.title}</div>
            {item.meta ? <div className="mt-1 text-[11px] font-bold text-slate-400">{item.meta}</div> : null}
            {item.body ? <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{item.body}</div> : null}
          </div>
        ))}
        {!items.length ? <div className="text-sm font-semibold text-slate-500">{empty}</div> : null}
      </div>
    </div>
  )
}

function Drawer({ title, children, onClose }: { title: string; children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/50 backdrop-blur-md">
      <div className="h-full w-full max-w-[760px] overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-50 p-3 text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
