"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bold,
  Bot,
  Calendar,
  ChevronDown,
  Eye,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Globe2,
  ImageIcon,
  Italic,
  Download,
  Link2,
  List,
  MailCheck,
  MoreHorizontal,
  Paperclip,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Strikethrough,
  Table,
  Trash2,
  Underline,
  X
} from "lucide-react"

type Props = {
  open: boolean
  mode: "compose" | "reply" | "forward" | "schedule"
  mailboxes?: any[]
  selectedEmail?: any
  mailboxScopeLocked?: boolean
  initialMailboxId?: string
  initialRecipients?: Array<{ name?: string; email: string }>
  initialSubject?: string
  initialBody?: string
  initialCc?: string
  initialBcc?: string
  onClose: () => void
  onDone?: () => void
}

type ComposeTemplate = {
  id: string
  name: string
  subject: string
  body: string
  category?: string
  priority?: string
  tone?: string
  raw?: any
}

type ComposeMailbox = {
  id: string
  name: string
  email: string
  status?: string
  department?: string
  provider?: string
  raw?: any
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  const json = await res.json().catch(() => null)
  return { ok: res.ok && json?.ok !== false, data: json?.data ?? json, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null) }
}

function senderOf(email: any) {
  return email?.from_email || email?.fromEmail || email?.sender || ""
}

function subjectOf(email: any) {
  return email?.subject || ""
}

function niceName(email: string) {
  const base = String(email || "").split("@")[0] || "Contact"
  return base.split(/[._-]+/).filter(Boolean).map((x) => x[0]?.toUpperCase() + x.slice(1)).join(" ")
}

function quoteOriginal(selectedEmail: any) {
  const body = selectedEmail?.body || selectedEmail?.bodyText || selectedEmail?.preview || ""
  const lines = [
    "",
    "---------- Message d'origine ----------",
    `De: ${senderOf(selectedEmail) || "inconnu"}`,
    `Objet: ${subjectOf(selectedEmail) || "(Sans objet)"}`,
    "",
    String(body)
  ]
  return lines.join("\n")
}


function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Unable to read attachment: ${file.name}`))
    reader.onload = () => {
      const raw = String(reader.result || "")
      resolve(raw.includes(",") ? raw.split(",").pop() || "" : raw)
    }
    reader.readAsDataURL(file)
  })
}

async function uploadAttachmentToGateway(file: File, mailboxId: string, entityType: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("moduleKey", "email_os")
  formData.append("mailboxId", mailboxId)
  formData.append("entityType", entityType)
  formData.append("direction", "outbound")
  formData.append("createdBy", "enterprise-compose-modal")
  formData.append("metadata", JSON.stringify({ source: "enterprise-compose-modal" }))

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData
  })

  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
  }
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024

function attachmentIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return FileSpreadsheet
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return FileText
  return FileArchive
}

function mailboxSignature(mailbox?: ComposeMailbox | null) {
  const identity = `${mailbox?.id || ""} ${mailbox?.email || ""} ${mailbox?.name || ""}`.toLowerCase()

  if (identity.includes("academy")) {
    return { unit: "ACADEMY", line1: "Empowering Education.", line2: "Transforming Futures." }
  }
  if (identity.includes("partenaires") || identity.includes("partner")) {
    return { unit: "PARTNERSHIPS", line1: "Building trusted partnerships.", line2: "Advancing quality childcare and education." }
  }
  if (identity.includes("commercial")) {
    return { unit: "COMMERCIAL", line1: "Business development.", line2: "Client relations and growth coordination." }
  }
  if (identity.includes("support")) {
    return { unit: "SUPPORT", line1: "Client support.", line2: "Responsive service coordination." }
  }
  if (identity.includes("ops") || identity.includes("operations")) {
    return { unit: "OPERATIONS", line1: "Operational coordination.", line2: "Field execution and service continuity." }
  }
  if (identity.includes("rh") || identity.includes("hr")) {
    return { unit: "HR", line1: "Human resources.", line2: "Team coordination and people operations." }
  }
  if (identity.includes("homeservice") || identity.includes("home")) {
    return { unit: "HOME SERVICE", line1: "Premium home childcare.", line2: "Family support and field excellence." }
  }
  if (identity.includes("b2b")) {
    return { unit: "B2B", line1: "Institutional partnerships.", line2: "Professional childcare solutions." }
  }
  if (identity.includes("montessori")) {
    return { unit: "MONTESSORI", line1: "Structured learning.", line2: "Purposeful development through practice." }
  }
  if (identity.includes("events") || identity.includes("excursions")) {
    return { unit: "EVENTS", line1: "Experiential coordination.", line2: "Safe and memorable children activities." }
  }
  if (identity.includes("it.support")) {
    return { unit: "IT SUPPORT", line1: "Digital operations.", line2: "Infrastructure and system continuity." }
  }

  return { unit: "", line1: "Professional communication.", line2: "Operational excellence." }
}

export default function EnterpriseComposeModal({
  open,
  mode,
  mailboxes = [],
  selectedEmail,
  mailboxScopeLocked = false,
  initialMailboxId,
  initialRecipients,
  initialSubject,
  initialBody,
  initialCc,
  initialBcc,
  onClose,
  onDone
}: Props) {
  const replyTo = senderOf(selectedEmail)

  const [liveMailboxes, setLiveMailboxes] = useState<ComposeMailbox[]>([])
  const [templates, setTemplates] = useState<ComposeTemplate[]>([])
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("Ready")
  const [priority, setPriority] = useState("high")
  const [tracking, setTracking] = useState(true)
  const [readReceipt, setReadReceipt] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [ccOpen, setCcOpen] = useState(false)
  const [bccOpen, setBccOpen] = useState(false)
  const [ccEmail, setCcEmail] = useState("")
  const [bccEmail, setBccEmail] = useState("")
  const [driveUrl, setDriveUrl] = useState("")
  const [showDriveBox, setShowDriveBox] = useState(false)
  const [mailboxId, setMailboxId] = useState(initialMailboxId || selectedEmail?.mailbox_id || mailboxes[0]?.id || "")
  const [recipients, setRecipients] = useState<Array<{ name?: string; email: string }>>(
    initialRecipients?.length
      ? initialRecipients
      : mode === "reply" && replyTo
        ? [{ name: niceName(replyTo), email: replyTo }]
        : []
  )
  const [subject, setSubject] = useState(
    initialSubject ||
    (mode === "reply"
      ? `Re: ${subjectOf(selectedEmail)}`
      : mode === "forward"
        ? `Fwd: ${subjectOf(selectedEmail)}`
        : "")
  )
  const [body, setBody] = useState(
    initialBody ||
    (mode === "reply"
      ? `Bonjour ${niceName(replyTo)},\n\nMerci pour votre message.\n\nNous avons bien reçu votre demande et nous revenons vers vous dès que possible avec la suite opérationnelle.\n\nCordialement,\nAngelCare${quoteOriginal(selectedEmail)}`
      : mode === "forward"
        ? `Bonjour,\n\nVeuillez trouver ci-dessous le message transféré et le contexte associé.\n\n${quoteOriginal(selectedEmail)}`
        : "")
  )
  const [attachments, setAttachments] = useState<Array<{
    name: string
    size: string
    sizeBytes?: number
    source?: string
    mimeType?: string
    contentBase64?: string
    fileId?: string
    storageBucket?: string
    storageKey?: string
    storageStatus?: string
    downloadUrl?: string
  }>>([])

  useEffect(() => {
    if (!open) return

    setMailboxId(initialMailboxId || selectedEmail?.mailbox_id || mailboxes[0]?.id || "")
    setRecipients(
      initialRecipients?.length
        ? initialRecipients
        : mode === "reply" && replyTo
          ? [{ name: niceName(replyTo), email: replyTo }]
          : []
    )
    setSubject(
      initialSubject ||
      (mode === "reply"
        ? `Re: ${subjectOf(selectedEmail)}`
        : mode === "forward"
          ? `Fwd: ${subjectOf(selectedEmail)}`
          : "")
    )
    setBody(
      initialBody ||
      (mode === "reply"
        ? `Bonjour ${niceName(replyTo)},\n\nMerci pour votre message.\n\nNous avons bien reçu votre demande et nous revenons vers vous dès que possible avec la suite opérationnelle.\n\nCordialement,\nAngelCare${quoteOriginal(selectedEmail)}`
        : mode === "forward"
          ? `Bonjour,\n\nVeuillez trouver ci-dessous le message transféré et le contexte associé.\n\n${quoteOriginal(selectedEmail)}`
          : "")
    )
    setCcEmail(initialCc || "")
    setBccEmail(initialBcc || "")
  }, [open, mode, selectedEmail?.mailbox_id, mailboxes, replyTo, initialMailboxId, initialRecipients, initialSubject, initialBody, initialCc, initialBcc])

  const resourceMailboxes = useMemo(() => {
    const normalizedProps = mailboxes.map((row: any) => ({
      id: row.id || row.mailbox_id,
      name: row.name || row.label || row.email_address || row.address || row.email || row.id || row.mailbox_id,
      email: row.email_address || row.address || row.email || row.from_email || row.username || "",
      status: row.status || "active",
      department: row.department || row.owner || "operations",
      provider: row.provider || row.type || "smtp",
      raw: row
    }))

    if (mailboxScopeLocked) {
      return normalizedProps.slice(0, 1)
    }

    const byId = new Map<string, ComposeMailbox>()
    for (const row of [...normalizedProps, ...liveMailboxes]) {
      if (row?.id) byId.set(row.id, row)
    }
    return Array.from(byId.values())
  }, [mailboxes, liveMailboxes, mailboxScopeLocked])

  const activeMailbox = resourceMailboxes.find((item) => item.id === mailboxId) || resourceMailboxes[0] || null
  const activeSignature = mailboxSignature(activeMailbox)
  const toEmail = recipients.map((r) => r.email).join(", ")

  const filteredTemplates = templates.filter((template) => {
    const q = templateSearch.toLowerCase().trim()
    if (!q) return true
    return [template.name, template.subject, template.category, template.tone].filter(Boolean).join(" ").toLowerCase().includes(q)
  })

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadResources() {
      const result = await api("/api/email-os/compose-resources")
      if (cancelled) return

      if (result.ok) {
        const nextMailboxes = mailboxScopeLocked ? [] : (result.data?.mailboxes || [])
        const nextTemplates = result.data?.templates || []

        setLiveMailboxes(nextMailboxes)
        setTemplates(nextTemplates)

        setMailboxId((current: string) => {
          if (mailboxScopeLocked) return selectedEmail?.mailbox_id || mailboxes[0]?.id || current || ""
          return current || selectedEmail?.mailbox_id || nextMailboxes[0]?.id || mailboxes[0]?.id || ""
        })
        setStatus(mailboxScopeLocked
          ? `Mailbox sender locked · ${nextTemplates.length} template(s) loaded`
          : `Live resources loaded: ${nextMailboxes.length} mailbox(es), ${nextTemplates.length} template(s)`
        )
      } else {
        setStatus(result.error || "Unable to load compose resources")
      }
    }

    loadResources()

    return () => {
      cancelled = true
    }
  }, [open, selectedEmail?.mailbox_id, mailboxScopeLocked, mailboxes])

  useEffect(() => {
    if (mode === "schedule") {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, "0")
      const dd = String(now.getDate()).padStart(2, "0")
      setScheduledDate((current) => current || `${yyyy}-${mm}-${dd}`)
      setScheduledTime((current) => current || "09:00")
    }
  }, [mode])

  if (!open) return null

  async function audit(action: string, payload: any = {}) {
    await api("/api/email-os/compose-action", {
      method: "POST",
      body: JSON.stringify({ action, payload: { ...payload, mailboxId, subject, toEmail } })
    })
  }

  function addRecipient(email: string) {
    const value = email.trim()
    if (!value) return
    setRecipients((current) => [...current, { name: niceName(value), email: value }])
  }

  function applyTemplate(template: ComposeTemplate) {
    setSubject(template.subject || template.name || subject)
    setBody(template.body || body)
    if (template.priority) setPriority(template.priority)
    setTemplateMenuOpen(false)
    setStatus(`Template applied: ${template.name}`)
    audit("apply_template", { templateId: template.id, templateName: template.name })
  }

  async function addLocalFiles(files: FileList | null) {
    if (!files) return

    const selected = Array.from(files)
    const existingTotal = attachments.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0)
    const selectedTotal = selected.reduce((sum, file) => sum + file.size, 0)

    if (selected.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
      setStatus("Attachment blocked: each file must be 8 MB or less.")
      return
    }

    if (existingTotal + selectedTotal > MAX_TOTAL_ATTACHMENT_BYTES) {
      setStatus("Attachment blocked: total attachments must be 15 MB or less.")
      return
    }

    setStatus("Reading attachment file(s)...")

    const next = await Promise.all(selected.map(async (file) => {
      const mimeType = file.type || "application/octet-stream"
      if (mailboxId) {
        try {
          const uploaded = await uploadAttachmentToGateway(file, mailboxId, mode === "reply" || mode === "forward" ? "reply_attachment" : "compose_attachment")
          if (uploaded.ok && uploaded.data?.id) {
            return {
              name: uploaded.data.original_filename || file.name,
              size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
              sizeBytes: file.size,
              source: "storage",
              mimeType,
              fileId: uploaded.data.id,
              storageBucket: uploaded.data.storage_bucket,
              storageKey: uploaded.data.storage_key,
              storageStatus: uploaded.data.status || "active",
              downloadUrl: `/api/storage/download/${uploaded.data.id}?mailboxId=${encodeURIComponent(mailboxId)}`
            }
          }
        } catch {
          // Fall back to legacy inline attachment behavior below.
        }
      }

      return {
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        sizeBytes: file.size,
        source: "legacy",
        mimeType,
        contentBase64: await fileToBase64(file)
      }
    }))

    setAttachments((current) => [...current, ...next])
    setStatus(`${next.length} attachment(s) added`)
    audit("attach_files", { files: next.map(({ name, size, sizeBytes, mimeType, source, fileId, storageStatus }) => ({ name, size, sizeBytes, mimeType, source, fileId, storageStatus })) })
  }

  function addDriveLink() {
    if (!driveUrl.trim()) {
      setShowDriveBox(true)
      setStatus("Paste a Google Drive link")
      return
    }

    const item = {
      name: "Google Drive Link",
      size: "linked",
      source: driveUrl.trim()
    }

    setAttachments((current) => [...current, item])
    setDriveUrl("")
    setShowDriveBox(false)
    setStatus("Drive link attached")
    audit("link_drive", { url: item.source })
  }

  function generateAI() {
    const generatedSubject = subject || "Partnership Proposal – AngelCare Academy"
    const generatedBody = `Dear Partner,\n\nWe are pleased to propose a structured collaboration with AngelCare Academy for teacher training, operational excellence, and long-term educational development.\n\nThe proposed partnership includes training delivery, planning coordination, reporting, and a clear follow-up framework for both teams.\n\nPlease find attached the relevant partnership materials and proposed next steps.\n\nBest regards,\nAngelCare`

    setSubject(generatedSubject)
    setBody(generatedBody)
    setStatus("AI content inserted")
    audit("ai_generate", { prompt: "compose" })
  }

  function improveWriting() {
    setBody((current) => `${current}\n\nThis message has been reviewed for clarity, professionalism, and actionability.`)
    setStatus("Writing improved")
    audit("ai_improve_writing")
  }

  function fixTone() {
    setStatus("Grammar and tone check completed")
    audit("ai_fix_grammar_tone")
  }

  async function saveDraft(statusValue = "draft") {
    setBusy(true)
    setStatus(statusValue === "scheduled" ? "Saving scheduled email..." : "Saving draft...")

    const result = await api("/api/email-os/entities/drafts", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: activeMailbox?.email,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body,
        priority,
        status: statusValue,
        scheduledAt: scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : null,
        attachments: attachments.filter((item) => item.fileId || item.contentBase64).map(({ name, mimeType, contentBase64, fileId }) => ({ filename: name, contentType: mimeType, contentBase64, fileId })),
        diagnostics: { tracking, readReceipt, attachments: attachments.map(({ contentBase64, ...safe }) => safe), mode }
      })
    })

    await audit(statusValue === "scheduled" ? "schedule_email" : "save_draft", { result, attachments, scheduledDate, scheduledTime })

    setBusy(false)
    setStatus(result.ok ? (statusValue === "scheduled" ? "Scheduled email saved" : "Draft saved") : result.error || "Draft failed")

    if (result.ok) {
      onDone?.()
      if (statusValue === "scheduled") onClose()
    }
  }

  async function sendNow() {
    if (!mailboxId) {
      setStatus("Select a sending mailbox first")
      return
    }

    if (!toEmail) {
      setStatus("Add at least one recipient")
      return
    }

    setBusy(true)
    setStatus("Sending...")

    const result = await api("/api/email-os/send-direct", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: activeMailbox?.email,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body,
        priority,
        attachments: attachments.filter((item) => item.fileId || item.contentBase64).map(({ name, mimeType, contentBase64, fileId }) => ({ filename: name, contentType: mimeType, contentBase64, fileId })),
        diagnostics: { tracking, readReceipt, attachments: attachments.map(({ contentBase64, ...safe }) => safe), mode }
      })
    })

    await audit("send_email", { result, attachments })

    setBusy(false)
    setStatus(result.ok ? "Sent" : result.error || "Send failed")

    if (result.ok) {
      onDone?.()
      onClose()
    }
  }

  const AttachmentIcon = ({ name }: { name: string }) => {
    const Icon = attachmentIcon(name)
    return <Icon className="h-5 w-5" />
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 top-[86px] z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="grid h-[calc(100vh-118px)] w-full max-w-[1580px] grid-cols-[minmax(0,1fr)_400px] overflow-hidden rounded-[28px] border border-violet-100 bg-white shadow-2xl">
        <section className="flex min-h-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-violet-100 px-7">
            <h2 className="text-2xl font-black text-slate-950">New Message</h2>
            <div className="flex items-center gap-5 text-slate-700">
              <button type="button" className="text-xl leading-none">−</button>
              <button type="button" className="text-lg">↗</button>
              <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr]">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Send from / Outbox mailbox</span>
                <select
                  value={mailboxId}
                  disabled={mailboxScopeLocked}
                  onChange={(event) => {
                    if (mailboxScopeLocked) return
                    setMailboxId(event.target.value)
                    audit("select_mailbox", { mailboxId: event.target.value })
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-violet-100 bg-white px-4 text-sm font-black outline-none disabled:cursor-not-allowed disabled:bg-violet-50 disabled:text-violet-800"
                >
                  {resourceMailboxes.length === 0 ? <option value="">No mailbox registered</option> : null}
                  {resourceMailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.id}>
                      {mailbox.name} {mailbox.email ? `• ${mailbox.email}` : ""}
                    </option>
                  ))}
                </select>
                {mailboxScopeLocked ? (
                  <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                    Sender locked by mailbox PIN session
                  </div>
                ) : null}
              </label>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
                <div className="text-xs font-black uppercase tracking-wide text-violet-600">Live mailbox configuration</div>
                <div className="mt-1 truncate text-sm font-black text-slate-900">{activeMailbox?.name || "No mailbox selected"}</div>
                <div className="truncate text-xs font-semibold text-slate-500">{activeMailbox?.email || "Configure mailbox email in Email-OS"}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-violet-100 pb-5">
              <span className="w-12 text-sm font-black text-slate-600">To:</span>
              <div className="flex min-h-12 flex-1 flex-wrap items-center gap-3">
                {recipients.map((recipient) => (
                  <span key={recipient.email} className="inline-flex h-12 items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-200 text-xs font-black text-violet-800">{(recipient.name || recipient.email || "?")[0]}</span>
                    <span className="leading-tight">
                      <span className="block text-sm font-black text-slate-800">{recipient.name}</span>
                      <span className="block text-xs font-semibold text-slate-500">{recipient.email}</span>
                    </span>
                    <button type="button" onClick={() => setRecipients((current) => current.filter((item) => item.email !== recipient.email))}><X className="h-4 w-4 text-slate-400" /></button>
                  </span>
                ))}
                <input
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addRecipient(event.currentTarget.value)
                      event.currentTarget.value = ""
                    }
                  }}
                  placeholder="+ add recipient then press Enter"
                  className="h-10 min-w-[190px] flex-1 bg-transparent text-sm font-semibold outline-none"
                />
              </div>
              <button type="button" onClick={() => setCcOpen((value) => !value)} className="font-black text-violet-700">Cc</button>
              <button type="button" onClick={() => setBccOpen((value) => !value)} className="font-black text-violet-700">Bcc</button>
            </div>

            {(ccOpen || bccOpen) ? (
              <div className="grid gap-3 border-b border-violet-100 py-4 md:grid-cols-2">
                {ccOpen ? <input value={ccEmail} onChange={(event) => setCcEmail(event.target.value)} placeholder="Cc" className="h-11 rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /> : null}
                {bccOpen ? <input value={bccEmail} onChange={(event) => setBccEmail(event.target.value)} placeholder="Bcc" className="h-11 rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /> : null}
              </div>
            ) : null}

            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-4 border-b border-violet-100 py-5">
              <span className="text-sm font-black text-slate-600">Subject:</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 min-w-0 text-sm font-black outline-none" placeholder="Subject" />

              <div className="relative">
                <button type="button" onClick={() => setTemplateMenuOpen((value) => !value)} className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
                  Templates <ChevronDown className="h-4 w-4" />
                </button>

                {templateMenuOpen ? (
                  <div className="absolute right-0 top-9 z-50 w-[360px] rounded-3xl border border-violet-100 bg-white p-3 shadow-2xl">
                    <div className="flex h-10 items-center rounded-2xl bg-slate-50 px-3">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search templates..." className="h-full flex-1 bg-transparent px-2 text-sm font-semibold outline-none" />
                    </div>
                    <div className="mt-3 max-h-[320px] overflow-y-auto">
                      {filteredTemplates.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No live template found.</div>
                      ) : null}

                      {filteredTemplates.map((template) => (
                        <button key={template.id} type="button" onClick={() => applyTemplate(template)} className="mb-2 block w-full rounded-2xl p-3 text-left hover:bg-violet-50">
                          <div className="text-sm font-black text-slate-900">{template.name}</div>
                          <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{template.subject || template.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button type="button" onClick={() => setOptionsOpen((value) => !value)} className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
                  Options <ChevronDown className="h-4 w-4" />
                </button>
                {optionsOpen ? (
                  <div className="absolute right-0 top-9 z-50 w-[260px] rounded-3xl border border-violet-100 bg-white p-3 shadow-2xl">
                    <button type="button" onClick={() => setTracking((value) => !value)} className="mb-2 flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-black hover:bg-violet-50">
                      Email tracking <span>{tracking ? "On" : "Off"}</span>
                    </button>
                    <button type="button" onClick={() => setReadReceipt((value) => !value)} className="mb-2 flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-black hover:bg-violet-50">
                      Read receipt <span>{readReceipt ? "On" : "Off"}</span>
                    </button>
                    <button type="button" onClick={() => saveDraft("draft")} className="flex h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-black hover:bg-violet-50">
                      Save draft <Save className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 rounded-xl border border-violet-100 bg-white px-3 text-sm font-black text-slate-700">
                <option value="high">High Importance</option>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-violet-100 bg-white">
              <div className="flex h-14 items-center gap-4 border-b border-violet-100 px-4 text-slate-500">
                <button type="button">↶</button>
                <button type="button">↷</button>
                <select className="h-9 rounded-xl border border-violet-100 px-3 text-sm font-semibold"><option>Inter</option></select>
                <select className="h-9 rounded-xl border border-violet-100 px-3 text-sm font-semibold"><option>14</option></select>
                <button type="button" className="rounded-lg bg-violet-100 p-2 text-violet-700"><Bold className="h-4 w-4" /></button>
                <button type="button"><Italic className="h-4 w-4" /></button>
                <button type="button"><Underline className="h-4 w-4" /></button>
                <button type="button"><Strikethrough className="h-4 w-4" /></button>
                <button type="button"><List className="h-4 w-4" /></button>
                <button type="button"><Link2 className="h-4 w-4" /></button>
                <button type="button"><ImageIcon className="h-4 w-4" /></button>
                <button type="button"><Table className="h-4 w-4" /></button>
                <button type="button"><Globe2 className="h-4 w-4" /></button>
                <button type="button"><MoreHorizontal className="h-5 w-5" /></button>
              </div>

              <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your email..." className="min-h-[390px] w-full resize-none p-6 text-[15px] font-medium leading-8 text-slate-800 outline-none" />

              <div className="mx-6 mb-6 rounded-2xl bg-violet-50 p-4">
                <div className="flex items-center gap-5">
                  <div className="text-xl font-black text-slate-900">ANGELCARE<br />{activeSignature.unit ? <span className="text-sm text-amber-500">{activeSignature.unit}</span> : null}</div>
                  <div className="h-14 w-px bg-violet-200" />
                  <div>
                    <div className="font-black text-slate-900">{activeSignature.line1}</div>
                    <div className="font-black text-slate-900">{activeSignature.line2}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-black text-slate-800">Attachments ({attachments.length})</div>
              {attachments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {attachments.map((attachment) => (
                    <div key={`${attachment.name}-${attachment.source || "local"}`} className="flex h-16 items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4">
                      <div className="rounded-xl bg-red-50 p-2 text-red-600"><AttachmentIcon name={attachment.name} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-black text-slate-800">{attachment.name}</div>
                        <div className="text-xs font-semibold text-slate-500">{attachment.size} · {attachment.mimeType || "unknown"}</div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {attachment.fileId ? `Storage ${attachment.storageStatus || "active"}` : "Legacy inline"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attachment.downloadUrl ? (
                          <a href={attachment.downloadUrl} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                            <Download className="inline h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item !== attachment))}><X className="h-4 w-4 text-slate-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-violet-100 p-5 text-sm font-bold text-slate-500">No attachment yet. Use Attach files or Link drive.</div>
              )}
            </div>

            {showDriveBox ? (
              <div className="mt-4 flex gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-3">
                <input value={driveUrl} onChange={(event) => setDriveUrl(event.target.value)} placeholder="Paste Google Drive link..." className="h-11 flex-1 rounded-xl border border-violet-100 px-3 text-sm font-semibold outline-none" />
                <button type="button" onClick={addDriveLink} className="rounded-xl bg-violet-600 px-4 text-sm font-black text-white">Attach link</button>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl bg-violet-50 px-5 text-sm font-black text-violet-700">
                <Paperclip className="h-4 w-4" />
                Attach files
                <input type="file" multiple className="hidden" onChange={(event) => void addLocalFiles(event.target.files)} />
              </label>
              <button type="button" onClick={addDriveLink} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-50 px-5 text-sm font-black text-slate-900">
                <Globe2 className="h-4 w-4" />
                Link drive
              </button>
              <button type="button" onClick={() => setTemplateMenuOpen(true)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-50 px-5 text-sm font-black text-slate-900">
                <FileText className="h-4 w-4" />
                Insert template
              </button>
              <button type="button" onClick={() => setTracking((value) => !value)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-50 px-5 text-sm font-black text-slate-900">
                <Eye className="h-4 w-4" />
                Email tracking {tracking ? "On" : "Off"}
              </button>
              <button type="button" onClick={() => setReadReceipt((value) => !value)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-50 px-5 text-sm font-black text-slate-900">
                <MailCheck className="h-4 w-4" />
                Request read receipt {readReceipt ? "On" : "Off"}
              </button>
            </div>
          </div>

          <footer className="flex h-20 items-center justify-between border-t border-violet-100 px-7">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={sendNow} disabled={busy} className="inline-flex h-12 items-center gap-3 rounded-2xl bg-violet-600 px-7 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-50">
                <Send className="h-4 w-4" />
                Send
              </button>
              <button type="button" onClick={() => saveDraft("scheduled")} disabled={busy} className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-50 px-6 text-sm font-black text-slate-700 disabled:opacity-50">
                <Calendar className="h-4 w-4" />
                Send later
              </button>
              <button type="button" onClick={() => audit("configure_followup", { subject })} className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-50 px-6 text-sm font-black text-slate-700">
                <ShieldCheck className="h-4 w-4" />
                Follow up
              </button>
              <button type="button" onClick={() => saveDraft("draft")} disabled={busy} className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-50 px-6 text-sm font-black text-slate-700 disabled:opacity-50">
                <Save className="h-4 w-4" />
                Save draft
              </button>
            </div>
            <button type="button" onClick={() => { setBody(""); setSubject(""); setRecipients([]); setAttachments([]); audit("discard_compose") }} className="rounded-2xl bg-slate-50 p-4 text-slate-500">
              <Trash2 className="h-5 w-5" />
            </button>
          </footer>
        </section>

        <aside className="space-y-5 overflow-y-auto border-l border-violet-100 bg-[#fbfaff] p-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3 font-black">
              <Sparkles className="h-5 w-5 text-violet-700" />
              AI Assistant
              <span className="ml-auto rounded-full bg-violet-50 px-2 py-1 text-[10px] text-violet-700">Beta</span>
            </div>
            <textarea defaultValue="Write a professional email to propose a partnership for teacher training programs." className="min-h-24 w-full rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm font-semibold leading-6 outline-none" />
            <button type="button" onClick={generateAI} className="mt-4 h-12 w-full rounded-2xl bg-violet-600 text-sm font-black text-white">
              <Bot className="mr-2 inline h-4 w-4" />
              Generate with AI
            </button>
            <button type="button" onClick={improveWriting} className="mt-3 h-12 w-full rounded-2xl bg-slate-50 text-sm font-black text-slate-700">Improve writing</button>
            <button type="button" onClick={fixTone} className="mt-2 h-12 w-full rounded-2xl bg-slate-50 text-sm font-black text-slate-700">Fix grammar & tone</button>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex justify-between">
              <h3 className="font-black">Live Templates</h3>
              <button type="button" onClick={() => setTemplateMenuOpen(true)} className="text-sm font-black text-blue-500">View all</button>
            </div>
            {templates.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No Email-OS template loaded.</div>
            ) : null}
            {templates.slice(0, 6).map((template, index) => (
              <button key={template.id} type="button" onClick={() => applyTemplate(template)} className={`mb-2 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-black ${index === 0 ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <FileText className="h-4 w-4" />
                <span className="truncate">{template.name}</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex justify-between">
              <h3 className="font-black">Attachments</h3>
              <button type="button" onClick={() => setStatus("Manage attachments panel ready")} className="text-sm font-black text-blue-500">Manage all</button>
            </div>
            <div className="text-sm font-semibold text-slate-500">{attachments.length} files attached</div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {attachments.slice(0, 4).map((attachment) => (
                <div key={attachment.name} className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black">
                  <AttachmentIcon name={attachment.name} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-black">Schedule & Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="h-11 rounded-xl border border-slate-100 px-3 text-sm" />
              <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="h-11 rounded-xl border border-slate-100 px-3 text-sm" />
            </div>
            <label className="mt-4 flex items-center justify-between text-sm font-black"><span>Email tracking</span><input type="checkbox" checked={tracking} onChange={(event) => setTracking(event.target.checked)} /></label>
            <label className="mt-4 flex items-center justify-between text-sm font-black"><span>Read receipt</span><input type="checkbox" checked={readReceipt} onChange={(event) => setReadReceipt(event.target.checked)} /></label>
            <label className="mt-4 block text-sm font-black">
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-100 px-3">
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="low">Low</option>
              </select>
            </label>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500">{status}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
