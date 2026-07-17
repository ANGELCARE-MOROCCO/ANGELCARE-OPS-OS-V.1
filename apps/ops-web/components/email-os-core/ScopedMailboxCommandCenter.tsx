"use client"

import { useEffect, useMemo, useState } from "react"
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
  X,
  RotateCcw,
  Link2,
  Plus,
  LayoutGrid,
  Eye,
  Settings2
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
  | "overdue"
  | "has_attachments"
  | "complaints"
  | "partnerships"
  | "b2b"
  | "finance_payment"
  | "recruitment"
  | "archived_resolved"

type SortKey = "newest" | "oldest" | "priority" | "sla_due" | "unassigned_first"

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
  return clean(row?.fromName || row?.from_name || row?.fromEmail || row?.from_email || row?.sender_email || "Expéditeur inconnu")
}

function getRowSenderEmail(row: MessageRow) {
  return clean(row?.fromEmail || row?.from_email || row?.sender_email || row?.raw?.fromEmail || "")
}

function getRowBody(row: MessageRow) {
  return clean(row?.bodyText || row?.body || row?.preview || row?.raw?.text || row?.raw?.html || "")
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
  if (filter === "assigned_to_me") return Boolean(row?.ownerUserId)
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

function safeHtml(input: string) {
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

export default function ScopedMailboxCommandCenter({ mailboxId }: { mailboxId?: string }) {
  const scoped = Boolean(mailboxId)
  const [data, setData] = useState<WorkflowResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [sort, setSort] = useState<SortKey>("newest")
  const [query, setQuery] = useState("")
  const [bodyMode, setBodyMode] = useState<"clean" | "plain" | "original">("clean")
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [status, setStatus] = useState("Chargement")
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
  const [linkForm, setLinkForm] = useState({ entityType: "contact", entityId: "", entityLabel: "" })
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

  async function load(nextMessageId?: string | null) {
    setLoading(true)
    setError(null)
    const url = new URL("/api/email-os/workflows", window.location.origin)
    if (mailboxId) url.searchParams.set("mailboxId", mailboxId)
    if (nextMessageId) url.searchParams.set("messageId", nextMessageId)
    const result = await api(url.pathname + url.search)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || "Échec de chargement")
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

  const currentUser = data?.currentUser || null
  const scopeMailbox = data?.mailboxScope?.mailbox || null
  const messages = sortMessages((data?.messages || []).filter((row) => {
    const mailboxMatch = !mailboxId || clean(row.mailboxId) === clean(mailboxId)
    const filterMatch = matchesCategoryFilter(row, filter)
    const haystack = [getRowSender(row), getRowSenderEmail(row), getRowSubject(row), getRowBody(row), clean(row.category), clean(row.status), clean(row.ownerUserId)].join(" ").toLowerCase()
    return mailboxMatch && filterMatch && (!query.trim() || haystack.includes(query.trim().toLowerCase()))
  }), sort)

  const selected = messages.find((row) => row.id === selectedId) || messages[0] || data?.detail?.message || null
  const detail = selected?.id === data?.detail?.message?.id ? data?.detail : null
  const notes = detail?.notes || data?.notes || []
  const tasks = detail?.tasks || data?.tasks || []
  const links = detail?.links || data?.links || []
  const audit = detail?.audit || data?.audit || []
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

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.toLowerCase().trim()
    return templates.filter((template) => {
      const haystack = [template.name, template.subject, template.subject_template, template.body, template.body_template, template.category].filter(Boolean).join(" ").toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [templates, templateQuery])

  async function runAction(action: string, payload: Record<string, any> = {}) {
    if (!selected?.id) {
      setStatus("Sélectionnez un message")
      return
    }

    setBusyAction(action)
    setStatus(`${action} en cours...`)
    const result = await api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        action,
        messageId: selected.id,
        mailboxId: mailboxId || selected.mailboxId,
        payload
      })
    })
    setBusyAction(null)

    if (!result.ok) {
      setError(result.error || `${action} failed`)
      setStatus(result.error || `${action} failed`)
      return
    }

    setStatus("Action enregistrée")
    await load(selected.id)
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

  async function syncNow() {
    if (!mailboxId) {
      setStatus("La vue globale ne peut synchroniser qu’une boîte assignée")
      return
    }

    setBusyAction("sync")
    const result = await api("/api/email-os/sync", {
      method: "POST",
      body: JSON.stringify({ mailboxId, limit: 25 })
    })
    setBusyAction(null)
    if (!result.ok) {
      setError(result.error || "Sync failed")
      setStatus(result.error || "Sync failed")
      return
    }
    setStatus(`Synchronisé: ${result.data?.count || 0} message(s)`)
    await load(selected?.id || null)
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
    await load(selected.id)
  }

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#ffffff_100%)] text-slate-950">
      <div className="flex min-h-screen w-full flex-col gap-6 px-4 py-4 lg:px-6 xl:px-8">
        <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/95 shadow-[0_30px_100px_rgba(15,23,42,.10)] ring-1 ring-sky-100">
          <div className="grid gap-6 bg-gradient-to-br from-white via-sky-50/70 to-indigo-50 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_460px] lg:px-8 lg:py-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">AngelCare Email-OS</div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-950 lg:text-5xl">{mailboxHeader.name}</h1>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{mailboxHeader.lockLabel}</span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">{mailboxHeader.source}</span>
              </div>
              <p className="max-w-4xl text-sm font-semibold leading-7 text-slate-600 lg:text-base">
                {scoped
                  ? "Espace boîte unique. Les actions sont limitées à cette boîte verrouillée par PIN et tout envoi reste scoping-safe."
                  : "Cockpit global pour supervision CEO/admin. Les statistiques agrègent les boîtes et le fil d’activité global."}
              </p>
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Utilisateur: {currentUser?.name || currentUser?.email || currentUser?.id || "—"}</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Source: windows-bridge-pop3</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Dernière synchro: {formatDate(syncHistory?.[0]?.created_at || data?.metrics?.lastSync?.created_at || null)}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void syncNow()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white disabled:opacity-50" disabled={busyAction === "sync"}>
                  <RefreshCw className={`h-4 w-4 ${busyAction === "sync" ? "animate-spin" : ""}`} />
                  Sync now
                </button>
                <button type="button" onClick={() => { setComposeMode("compose"); setComposeSeed({ initialMailboxId: mailboxId || selected?.mailboxId || scopeMailbox?.id || "" }); setComposeOpen(true) }} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                  <PencilLine className="h-4 w-4" />
                  Compose
                </button>
                <button type="button" onClick={() => setTemplateOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                  <FileText className="h-4 w-4" />
                  Create template
                </button>
                <button type="button" onClick={exportCurrentView} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                  <Download className="h-4 w-4" />
                  Export current view
                </button>
                {scoped ? (
                  <button type="button" onClick={() => void lockMailbox()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700">
                    <LockKeyhole className="h-4 w-4" />
                    Lock mailbox
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="Inbox" value={String(aggregateStats.inbox)} tone="blue" />
                <Kpi label="Unread" value={String(aggregateStats.unread)} tone="amber" />
                <Kpi label="Drafts" value={String(aggregateStats.drafts)} tone="slate" />
                <Kpi label="Outbox" value={String(aggregateStats.outbox)} tone="green" />
                <Kpi label="Failed" value={String(aggregateStats.failed)} tone="rose" />
                <Kpi label="Assigned" value={String(aggregateStats.assigned_to_me)} tone="blue" />
                <Kpi label="Overdue" value={String(aggregateStats.overdue)} tone="rose" />
                <Kpi label="Waiting" value={String(aggregateStats.waiting)} tone="amber" />
              </div>
            </div>
          </div>
        </section>

        {/* Production readiness strip */}
        <section className="grid gap-3 rounded-[28px] border border-sky-100 bg-white/90 p-4 shadow-sm md:grid-cols-4">
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">Infrastructure: Windows POP3 + Storage Node</div>
          <div className="rounded-2xl bg-sky-50 p-4 text-sm font-black text-sky-700">Scope: {scoped ? "Single mailbox locked" : "CEO global oversight"}</div>
          <div className="rounded-2xl bg-indigo-50 p-4 text-sm font-black text-indigo-700">Workflow: Notes · Tasks · SLA · Audit</div>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-black text-amber-700">Storage: metadata in Supabase, files on Windows</div>
        </section>

        {error ? <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)_480px]">
          <aside className="space-y-4 rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Triage</div>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Boîte opérationnelle</h2>
              </div>
              <button type="button" onClick={() => void load(selected?.id || null)} className="rounded-2xl bg-slate-50 p-3 text-slate-600">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <Search className="h-4 w-4" />
                Recherche
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="sender, subject, body, category..." className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none" />
              <div className="mt-3 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-10 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="priority">Priority</option>
                  <option value="sla_due">SLA due</option>
                  <option value="unassigned_first">Unassigned first</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["unread", "Unread"],
                ["unassigned", "Unassigned"],
                ["assigned_to_me", "Assigned to me"],
                ["overdue", "Overdue"],
                ["has_attachments", "Has attachments"],
                ["complaints", "Complaints"],
                ["partnerships", "Partnerships"],
                ["b2b", "B2B"],
                ["finance_payment", "Finance/payment"],
                ["recruitment", "Recruitment"],
                ["archived_resolved", "Archived/resolved"]
              ].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key as FilterKey)} className={`rounded-2xl px-3 py-2 text-xs font-black ${filter === key ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700"}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {messages.map((row) => (
                <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={`w-full rounded-[24px] border p-4 text-left transition ${selected?.id === row.id ? "border-sky-200 bg-sky-50 shadow-sm" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{row.mailboxName || row.mailboxId}</span>
                        {isUnread(row) ? <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">Unread</span> : <span className="rounded-full bg-slate-100 px-2 py-1">Read</span>}
                        {hasAttachments(row) ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Attach</span> : null}
                      </div>
                      <div className="mt-2 truncate text-sm font-black text-slate-900">{getRowSubject(row)}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-slate-500">{getRowSender(row)} · {getRowSenderEmail(row)}</div>
                      <div className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{row.preview}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
                      <span className={`rounded-full border px-2 py-1 ${priorityTone(row.priority)}`}>{clean(row.priority)}</span>
                      <span className={`rounded-full border px-2 py-1 ${statusTone(row.status)}`}>{clean(row.status)}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-500">{formatRelativeMinutes(row.sla?.dueInMinutes)}</span>
                    </div>
                  </div>
                </button>
              ))}
              {messages.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                  <div className="mt-3 text-base font-black text-slate-900">No new inbound messages</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {scoped ? `Last sync source: windows-bridge-pop3. Send to ${mailboxHeader.email || "this mailbox"}, wait 60 seconds, then sync.` : "Global view has no messages in the current filter."}
                  </p>
                  {scoped ? (
                    <button type="button" onClick={() => void syncNow()} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">
                      <RefreshCw className="h-4 w-4" />
                      Sync now
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>

          <main className="space-y-4 rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
            {selected ? (
              <>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                        <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">{selected.mailboxName || selected.mailboxId}</span>
                        <span className={`rounded-full border px-2 py-1 ${statusTone(selected.status)}`}>{clean(selected.status)}</span>
                        <span className={`rounded-full border px-2 py-1 ${priorityTone(selected.priority)}`}>{clean(selected.priority)}</span>
                        <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600">{categoryLabel(selected.category)}</span>
                        {selected.linkedEntityLabel ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{selected.linkedEntityLabel}</span> : null}
                      </div>
                      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{getRowSubject(selected)}</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {getRowSender(selected)} <span className="text-slate-400">·</span> {getRowSenderEmail(selected)} <span className="text-slate-400">·</span> {formatDate(selected.receivedAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        <span className="rounded-full bg-slate-50 px-2 py-1">Owner: {selected.ownerUserId || "unassigned"}</span>
                        <span className="rounded-full bg-slate-50 px-2 py-1">Due: {formatDate(selected.firstResponseDueAt)}</span>
                        <span className="rounded-full bg-slate-50 px-2 py-1">{selected.sla?.overdue ? "Overdue" : `Due in ${formatRelativeMinutes(selected.sla?.dueInMinutes)}`}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={openReply} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">
                        <Reply className="h-4 w-4" />
                        Reply
                      </button>
                      <button type="button" onClick={openForward} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                        <Forward className="h-4 w-4" />
                        Forward
                      </button>
                      <button type="button" onClick={() => void runAction("archive")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                      <button type="button" onClick={() => void runAction(isUnread(selected) ? "mark_read" : "mark_unread")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
                        <MailOpen className="h-4 w-4" />
                        {isUnread(selected) ? "Mark read" : "Mark unread"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
                    <ActionButton label="Status" icon={Settings2} onClick={() => void runAction("set_status", { status: "in_progress" })} busy={busyAction === "set_status"} />
                    <ActionButton label="Priority" icon={Clock3} onClick={() => void runAction("set_priority", { priority: "high" })} busy={busyAction === "set_priority"} />
                    <ActionButton label="Category" icon={Tag} onClick={() => void runAction("set_category", { category: "other" })} busy={busyAction === "set_category"} />
                    <ActionButton label="Assign" icon={UserCheck} onClick={() => void runAction("assign_owner", { ownerUserId: currentUser?.id || "" })} busy={busyAction === "assign_owner"} />
                    <ActionButton label="Note" icon={PencilLine} onClick={() => setNotesOpen(true)} busy={busyAction === "note"} />
                    <ActionButton label="Task" icon={CheckCircle2} onClick={() => setTaskOpen(true)} busy={busyAction === "task"} />
                    <ActionButton label="Link" icon={Link2} onClick={() => setLinkOpen(true)} busy={busyAction === "link"} />
                    <ActionButton label="Resolve" icon={RotateCcw} onClick={() => void runAction("resolve")} busy={busyAction === "resolve"} />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <Eye className="h-4 w-4" />
                        Body viewer
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setBodyMode("clean")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "clean" ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600"}`}>Clean</button>
                        <button type="button" onClick={() => setBodyMode("plain")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "plain" ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600"}`}>Plain</button>
                        <button type="button" onClick={() => setBodyMode("original")} className={`rounded-xl px-3 py-2 text-xs font-black ${bodyMode === "original" ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600"}`}>Original</button>
                      </div>
                    </div>
                    {selected.bodyHtml && bodyMode === "original" ? (
                      <div className="prose max-w-none rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div dangerouslySetInnerHTML={{ __html: safeHtml(String(selected.bodyHtml)) }} />
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">{bodyView(selected, bodyMode)}</pre>
                    )}

                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                        <Paperclip className="h-4 w-4" />
                        Attachments
                      </div>
                      {selected.attachments?.length ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {selected.attachments.map((attachment: any) => (
                            <div key={`${attachment.filename}-${attachment.size}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="font-black text-slate-900">{attachment.filename}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-500">{attachment.contentType} · {attachment.size ? `${attachment.size} bytes` : "size unknown"}</div>
                              <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                                {attachment.storageStatus ? `Storage ${attachment.storageStatus}` : "Legacy inline attachment"}
                              </div>
                              {attachment.storageFileId ? (
                                <a
                                  href={`/api/storage/download/${attachment.storageFileId}?mailboxId=${encodeURIComponent(selected.mailboxId || mailboxId || "")}`}
                                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </a>
                              ) : (
                                <button type="button" disabled className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-400" title="Legacy inline attachment">
                                  <Download className="h-3.5 w-3.5" />
                                  Open/download unavailable
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Aucune pièce jointe enregistrée dans ce message.</div>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-950">Notes</h3>
                        <button type="button" onClick={() => setNotesOpen(true)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Add</button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {notes.map((note: any) => (
                          <div key={note.id} className="rounded-2xl bg-slate-50 p-3">
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{note.author_name || note.author_user_id || "internal"} · {formatDate(note.created_at)}</div>
                            <div className="mt-2 text-sm leading-6 text-slate-700">{note.body}</div>
                          </div>
                        ))}
                        {!notes.length ? <div className="text-sm font-semibold text-slate-500">Aucune note interne.</div> : null}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-950">Tasks</h3>
                        <button type="button" onClick={() => setTaskOpen(true)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Create</button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {tasks.map((task: any) => (
                          <div key={task.id} className="rounded-2xl bg-slate-50 p-3">
                            <div className="font-black text-slate-900">{task.title}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">{task.priority} · {formatDate(task.due_at)}</div>
                            <div className="mt-2 text-sm leading-6 text-slate-700">{task.description || task.note || "—"}</div>
                          </div>
                        ))}
                        {!tasks.length ? <div className="text-sm font-semibold text-slate-500">Aucune tâche ouverte.</div> : null}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-950">Entity links</h3>
                        <button type="button" onClick={() => setLinkOpen(true)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Link</button>
                      </div>
                      <div className="mt-4 space-y-2">
                        {links.map((link: any) => (
                          <div key={link.id} className="rounded-2xl bg-slate-50 p-3">
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{link.entity_type}</div>
                            <div className="mt-1 font-black text-slate-900">{link.entity_label || link.entity_id}</div>
                          </div>
                        ))}
                        {!links.length ? <div className="text-sm font-semibold text-slate-500">Aucun lien d’entité.</div> : null}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-950">Diagnostics</h3>
                        <button type="button" onClick={() => setDiagnosticsOpen((v) => !v)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Toggle</button>
                      </div>
                      {diagnosticsOpen ? (
                        <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                          <div>Message ID: {selected.id}</div>
                          <div>External ID: {selected.externalId || "—"}</div>
                          <div>Sync source: windows-bridge-pop3</div>
                          <div>Mailbox ID: {selected.mailboxId}</div>
                          <div>Inserted/synced: {formatDate(selected.receivedAt || selected.createdAt)}</div>
                          <div>Workflow status: {selected.status}</div>
                          <div>Priority: {selected.priority}</div>
                          <div>Category: {selected.category}</div>
                        </div>
                      ) : (
                        <div className="mt-3 text-sm font-semibold text-slate-500">Hidden by default.</div>
                      )}
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              <div className="flex min-h-[50vh] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <div>
                  <MailOpen className="mx-auto h-12 w-12 text-slate-300" />
                  <div className="mt-4 text-xl font-black text-slate-900">Sélectionnez un message</div>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Les opérations, le triage et le dossier apparaissent ici.</p>
                </div>
              </div>
            )}
          </main>

          <aside className="space-y-4 rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
            <div className="rounded-[28px] border border-sky-100 bg-sky-50/60 p-5">
              <div className="flex items-center gap-2 font-black text-sky-700">
                <Sparkles className="h-5 w-5" />
                Live operations
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Toutes les actions ci-dessous sont réelles. Elles écrivent via les APIs Email-OS et respectent le scope de boîte.</p>
              <div className="mt-4 space-y-2">
                <button type="button" onClick={openReply} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Reply with context</button>
                <button type="button" onClick={openForward} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Forward message</button>
                <button type="button" onClick={() => setNotesOpen(true)} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Add internal note</button>
                <button type="button" onClick={() => setTaskOpen(true)} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Create follow-up task</button>
                <button type="button" onClick={() => setLinkOpen(true)} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Link entity</button>
                <button type="button" onClick={() => void runAction("resolve")} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Resolve</button>
                <button type="button" onClick={() => void runAction("reopen")} className="h-11 w-full rounded-2xl bg-white text-sm font-black text-slate-800 shadow-sm">Reopen</button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 font-black text-slate-950">
                <LayoutGrid className="h-5 w-5 text-sky-700" />
                Mailbox health
              </div>
              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-3">Mailbox: {mailboxHeader.name}</div>
                <div className="rounded-2xl bg-slate-50 p-3">Email: {mailboxHeader.email || "—"}</div>
                <div className="rounded-2xl bg-slate-50 p-3">Sync source: windows-bridge-pop3</div>
                <div className="rounded-2xl bg-slate-50 p-3">Waiting conversations: {stats?.waiting || 0}</div>
                <div className="rounded-2xl bg-slate-50 p-3">High priority queue: {messages.filter((row) => ["vip", "urgent", "high"].includes(clean(row.priority).toLowerCase())).length}</div>
              </div>
            </div>

            {!mailboxId ? <StorageHealthPanel /> : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-950">Audit trail</h3>
                <button type="button" onClick={() => setDiagnosticsOpen(true)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Diagnostics</button>
              </div>
              <div className="mt-4 space-y-2">
                {audit.slice(0, 6).map((event: any) => (
                  <div key={event.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{event.action}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-700">{formatDate(event.created_at)}</div>
                  </div>
                ))}
                {!audit.length ? <div className="text-sm font-semibold text-slate-500">No audit events yet.</div> : null}
              </div>
            </div>

            {!scoped ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="font-black text-slate-950">Mailbox health cards</h3>
                <div className="mt-4 space-y-3">
                  {(data?.stats || []).slice?.(0, 8).map((row: any) => (
                    <div key={row.mailboxId} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-slate-900">{row.mailboxName}</div>
                          <div className="text-xs font-semibold text-slate-500">{row.mailboxEmail}</div>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">{row.total}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-black uppercase text-slate-500">
                        <span>Inbox {row.inbox}</span>
                        <span>Unread {row.unread}</span>
                        <span>Overdue {row.overdue}</span>
                        <span>Waiting {row.waiting}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Operational status</div>
              <div className="mt-2 text-sm font-semibold text-slate-600">{status}</div>
              {metrics?.lastSync ? <div className="mt-2 text-xs font-semibold text-slate-500">Last sync source: {metrics.lastSync.message || "windows-bridge-pop3"}</div> : null}
            </div>
          </aside>
        </section>

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
          onDone={() => void load(selected?.id || null)}
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
                <option value="contact">Contact</option>
                <option value="client_family">Client / family</option>
                <option value="b2b_prospect">B2B prospect</option>
                <option value="partner">Partner</option>
                <option value="candidate">Candidate</option>
                <option value="supplier">Supplier</option>
                <option value="invoice_dossier">Invoice / payment dossier</option>
                <option value="internal_project">Internal project</option>
              </select>
              <input value={linkForm.entityId} onChange={(e) => setLinkForm((current) => ({ ...current, entityId: e.target.value }))} placeholder="Entity ID" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <input value={linkForm.entityLabel} onChange={(e) => setLinkForm((current) => ({ ...current, entityLabel: e.target.value }))} placeholder="Entity label" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
              <button type="button" onClick={() => void linkEntity()} className="h-11 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white">Link entity</button>
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
    <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50">
      <div className="flex items-center gap-2 text-sm font-black text-slate-900">
        <Icon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-500">{busy ? "Exécution..." : "Action persistée"}</div>
    </button>
  )
}

function Drawer({ title, children, onClose }: { title: string; children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-[680px] overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-50 p-3 text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
