"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Archive,
  Bell,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Eye,
  FileText,
  Folder,
  Inbox,
  Layers3,
  Mail,
  MailCheck,
  MailOpen,
  MoreHorizontal,
  Pencil,
  PhoneCall,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCheck,
  Users,
  X,
  Zap
} from "lucide-react"
import EnterpriseComposeModal from "@/components/email-os-core/EnterpriseComposeModal"
import InboxActionToolbar from "@/components/email-os-core/InboxActionToolbar"

type WorkspaceView = "inbox" | "sent" | "drafts" | "all" | "archived" | "spam" | "trash" | "settings"
type RecordSource = "inbox" | "outbox" | "drafts"
type ComposeMode = "compose" | "reply" | "schedule"
type EnterpriseModalMode = "task" | "crm" | "meeting" | "call" | "label" | "folder" | "mailbox" | null

type ApiResult = { ok: boolean; data: any; patch?: any; error?: string | null; diagnostics?: any }

async function api(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  const json = await res.json().catch(() => null)
  return { ok: res.ok && json?.ok !== false, data: json?.data ?? json, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null), diagnostics: json?.diagnostics }
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function subjectOf(row: any) { return row?.subject || "(Sans objet)" }
function previewOf(row: any) { return row?.preview || row?.body || row?.description || row?.message || row?.subject || "No message preview available." }
function fromOf(row: any) { return row?.from_email || row?.fromEmail || row?.sender || row?.email || "system" }
function toOf(row: any) { return row?.to_email || row?.toEmail || row?.recipient || "recipient" }
function statusOf(row: any) { return String(row?.status || (row?.read_at ? "read" : "received")).toLowerCase() }
function sourceOf(row: any): RecordSource { return row?.__source === "outbox" || row?.__source === "drafts" ? row.__source : "inbox" }
function initials(value: string) { return String(value || "AC").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "AC" }
function mailboxId(row: any) { return row?.mailbox_id || row?.mailboxId || "" }
function nowLabel() { return new Date().toLocaleString() }

function normalizeMailbox(row: any) {
  return {
    id: row?.id || row?.mailbox_id,
    mailbox_id: row?.mailbox_id || row?.id,
    key: row?.key || row?.raw?.key || "",
    name: row?.name || row?.label || row?.email_address || row?.address || row?.email || row?.id || "Mailbox",
    label: row?.label || row?.name || row?.email || "Mailbox",
    email: row?.email_address || row?.address || row?.email || row?.from_email || row?.username || "",
    status: row?.status || "active",
    department: row?.department || row?.owner || "operations",
    source: row?.source || row?.provider || "email-os",
    smtp: row?.smtp,
    incoming: row?.incoming,
    raw: row
  }
}

function mailboxName(mailboxes: any[], id: string) {
  const found = mailboxes.find((m) => m.id === id || m.mailbox_id === id || m.email === id)
  return found?.name || found?.email || id || "All mailboxes"
}

function enrich(rows: any[], source: RecordSource) {
  return rows.map((row) => ({ ...row, __source: source }))
}

function recordMatchesCategory(row: any, category: string) {
  if (category === "primary") return true
  const text = [row?.category, row?.tag, row?.label, subjectOf(row), previewOf(row), fromOf(row)].join(" ").toLowerCase()
  if (category === "urgent") return ["urgent", "critical", "asap", "important"].some((token) => text.includes(token))
  if (category === "vip") return ["vip", "ceo", "director", "partner", "client"].some((token) => text.includes(token))
  if (category === "social") return text.includes("social") || text.includes("facebook") || text.includes("linkedin")
  if (category === "updates") return ["update", "notification", "status", "sync", "system"].some((token) => text.includes(token))
  if (category === "promotions") return ["promo", "marketing", "offer", "campaign"].some((token) => text.includes(token))
  if (category === "unassigned") return !row?.owner && !row?.assignee && !row?.assigned_to
  return true
}

function isInView(row: any, view: WorkspaceView) {
  const status = statusOf(row)
  const source = sourceOf(row)
  if (view === "all") return status !== "permanently_deleted"
  if (view === "sent") return source === "outbox" && ["sent", "delivered", "queued", "failed", "sending"].includes(status)
  if (view === "drafts") return source === "drafts" || status === "draft" || status === "scheduled"
  if (view === "archived") return status === "archived"
  if (view === "spam") return status === "spam"
  if (view === "trash") return status === "trash" || status === "deleted"
  return source === "inbox" && !["trash", "deleted", "archived", "spam", "permanently_deleted"].includes(status)
}

const views: Array<{ key: WorkspaceView; label: string; icon: any }> = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Outbox / Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "all", label: "All Mail", icon: MailOpen },
  { key: "archived", label: "Archived", icon: Archive },
  { key: "spam", label: "Spam", icon: ShieldCheck },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "settings", label: "Settings", icon: Settings }
]

const categories = ["primary", "urgent", "vip", "social", "updates", "promotions", "unassigned"]

function EnterpriseActionModal({ mode, selected, mailboxes, onClose, onSaved }: { mode: EnterpriseModalMode; selected: any; mailboxes: any[]; onClose: () => void; onSaved: (message: string) => void }) {
  const [title, setTitle] = useState("")
  const [owner, setOwner] = useState("operations")
  const [priority, setPriority] = useState("high")
  const [date, setDate] = useState("")
  const [label, setLabel] = useState("")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mode) return
    const base = subjectOf(selected)
    setTitle(mode === "crm" ? `CRM: ${fromOf(selected)}` : mode === "meeting" ? `Meeting: ${base}` : mode === "call" ? `Call: ${fromOf(selected)}` : mode === "label" ? `Label: ${base}` : mode === "folder" ? `Folder: ${base}` : `Follow-up: ${base}`)
    setLabel(mode === "folder" ? "operations-follow-up" : mode === "label" ? "priority-follow-up" : "")
    setNotes(previewOf(selected))
  }, [mode, selected])

  if (!mode) return null

  async function save() {
    setBusy(true)
    setError(null)
    const result = await api("/api/email-os/enterprise-record", {
      method: "POST",
      body: JSON.stringify({
        kind: mode,
        emailId: selected?.id,
        payload: {
          title,
          owner,
          priority,
          dueAt: date || null,
          label: label || null,
          notes,
          mailboxId: mailboxId(selected),
          mailbox: mailboxName(mailboxes, mailboxId(selected)),
          subject: subjectOf(selected),
          contact: fromOf(selected),
          source: sourceOf(selected)
        }
      })
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error || "Action failed")
      return
    }
    onSaved(`${mode} saved and synced`)
    onClose()
  }

  const Icon = mode === "crm" ? BriefcaseBusiness : mode === "meeting" ? Calendar : mode === "call" ? PhoneCall : mode === "label" ? Tag : mode === "folder" ? Folder : CheckCircle2
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-violet-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-600 p-3 text-white"><Icon className="h-5 w-5" /></div>
            <div><h2 className="text-2xl font-black capitalize text-slate-950">{mode} execution layer</h2><p className="text-sm font-bold text-slate-500">Live synced enterprise action linked to the current email and mailbox.</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-white p-3 text-slate-500"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid gap-4 p-8 md:grid-cols-2">
          <label className="md:col-span-2"><span className="text-xs font-black uppercase text-slate-500">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Owner / department</span><input value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Date / due time</span><input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Priority</span><select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none"><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Label / folder</span><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="priority-follow-up" className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label>
          <div className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="text-xs font-black uppercase text-violet-700">Linked email</div><div className="mt-1 font-black text-slate-900">{subjectOf(selected)}</div><div className="text-xs font-semibold text-slate-500">{mailboxName(mailboxes, mailboxId(selected))} · {fromOf(selected)}</div></div>
          <label className="md:col-span-2"><span className="text-xs font-black uppercase text-slate-500">Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-36 w-full rounded-2xl border border-violet-100 p-4 text-sm font-semibold leading-6 outline-none" /></label>
          {error ? <div className="md:col-span-2 rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div> : null}
        </div>
        <footer className="flex justify-end gap-3 border-t border-violet-100 px-8 py-5"><button type="button" onClick={onClose} className="h-11 rounded-2xl bg-slate-50 px-5 text-sm font-black">Cancel</button><button type="button" onClick={save} disabled={busy || !title.trim()} className="h-11 rounded-2xl bg-violet-600 px-6 text-sm font-black text-white disabled:opacity-50">Save live action</button></footer>
      </div>
    </div>
  )
}

function MailboxModal({ open, mailbox, onClose, onSaved }: { open: boolean; mailbox?: any; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("operations")
  const [status, setStatus] = useState("active")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(mailbox?.name || mailbox?.label || "")
    setEmail(mailbox?.email || mailbox?.email_address || "")
    setDepartment(mailbox?.department || "operations")
    setStatus(mailbox?.status || "active")
  }, [open, mailbox])

  if (!open) return null

  async function save() {
    setBusy(true)
    setError(null)
    const result = await api("/api/email-os/enterprise-mailboxes", { method: "POST", body: JSON.stringify({ payload: { id: mailbox?.id, name, email, department, status } }) })
    setBusy(false)
    if (!result.ok) { setError(result.error || "Mailbox save failed"); return }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-violet-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-violet-100 px-7 py-5"><div><h2 className="text-2xl font-black">Mailbox configuration</h2><p className="text-sm font-semibold text-slate-500">Metadata layer only. Transport credentials stay in env/vault.</p></div><button onClick={onClose}><X className="h-5 w-5" /></button></header>
        <div className="grid gap-4 p-7 md:grid-cols-2"><label><span className="text-xs font-black uppercase text-slate-500">Name</span><input value={name} onChange={(e)=>setName(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none" /></label><label><span className="text-xs font-black uppercase text-slate-500">Email</span><input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label><label><span className="text-xs font-black uppercase text-slate-500">Department</span><input value={department} onChange={(e)=>setDepartment(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label><label><span className="text-xs font-black uppercase text-slate-500">Status</span><select value={status} onChange={(e)=>setStatus(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none"><option value="active">Active</option><option value="paused">Paused</option><option value="disabled">Disabled</option></select></label>{error ? <div className="md:col-span-2 rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div> : null}</div>
        <footer className="flex justify-end gap-3 border-t border-violet-100 px-7 py-5"><button onClick={onClose} className="h-11 rounded-2xl bg-slate-50 px-5 text-sm font-black">Cancel</button><button onClick={save} disabled={busy || !email} className="h-11 rounded-2xl bg-violet-600 px-6 text-sm font-black text-white disabled:opacity-50">Save mailbox</button></footer>
      </div>
    </div>
  )
}

export default function EmailOSEnterpriseProductionWorkspace({ mailboxId: scopedMailboxId }: { mailboxId?: string } = {}) {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [inbox, setInbox] = useState<any[]>([])
  const [outbox, setOutbox] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [view, setView] = useState<WorkspaceView>("inbox")
  const [category, setCategory] = useState("primary")
  const [selectedMailbox, setSelectedMailbox] = useState(mailboxId || "all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("Ready")
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>("compose")
  const [actionMode, setActionMode] = useState<EnterpriseModalMode>(null)
  const [mailboxModalOpen, setMailboxModalOpen] = useState(false)
  const [editingMailbox, setEditingMailbox] = useState<any>(null)
  const [liveness, setLiveness] = useState<any>(null)
  const [composeMenuOpen, setComposeMenuOpen] = useState(false)

  const allRows = useMemo(() => [...enrich(inbox, "inbox"), ...enrich(outbox, "outbox"), ...enrich(drafts, "drafts")], [inbox, outbox, drafts])

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((row) => {
      const mailboxOk = selectedMailbox === "all" || mailboxId(row) === selectedMailbox
      const viewOk = isInView(row, view)
      const categoryOk = recordMatchesCategory(row, category)
      const searchText = [subjectOf(row), previewOf(row), fromOf(row), toOf(row), row?.tag, row?.label, row?.status, mailboxId(row)].join(" ").toLowerCase()
      return mailboxOk && viewOk && categoryOk && (!q || searchText.includes(q))
    })
  }, [allRows, selectedMailbox, view, category, query])

  const selected = visibleRows.find((row) => row.id === selectedId) || visibleRows[0] || null

  const counts = useMemo(() => {
    const countFor = (nextView: WorkspaceView) => allRows.filter((row) => selectedMailbox === "all" || mailboxId(row) === selectedMailbox).filter((row) => isInView(row, nextView)).length
    return Object.fromEntries(views.map((item) => [item.key, item.key === "settings" ? mailboxes.length : countFor(item.key)])) as Record<WorkspaceView, number>
  }, [allRows, mailboxes.length, selectedMailbox])

  const mailboxMetrics = useMemo(() => mailboxes.map((mailbox) => {
    const rows = allRows.filter((row) => mailboxId(row) === mailbox.id || mailboxId(row) === mailbox.mailbox_id)
    return { ...mailbox, inbox: rows.filter((row) => sourceOf(row) === "inbox" && isInView(row, "inbox")).length, sent: rows.filter((row) => sourceOf(row) === "outbox").length, drafts: rows.filter((row) => sourceOf(row) === "drafts").length, urgent: rows.filter((row) => recordMatchesCategory(row, "urgent")).length }
  }), [mailboxes, allRows])

  async function load() {
    setLoading(true)

    let syncSummary = ""
    if (scopedMailboxId) {
      setStatus("Syncing inbound messages for this mailbox...")
      const syncResult = await api("/api/email-os/sync", {
        method: "POST",
        body: JSON.stringify({ mailboxId: scopedMailboxId, limit: 25 })
      })

      if (syncResult.ok) {
        const data = syncResult.data || {}
        syncSummary = ` · inbound fetched ${data.fetched || 0}, inserted ${data.count || 0}, skipped ${data.skipped || 0}`
      } else {
        syncSummary = ` · inbound sync skipped: ${syncResult.error || "failed"}`
      }
    }

    const result = await api(`/api/email-os/enterprise-workspace${scopedMailboxId ? `?mailboxId=${encodeURIComponent(scopedMailboxId)}` : ""}`)
    if (result.ok) {
      setMailboxes(asArray(result.data?.mailboxes).map(normalizeMailbox))
      setInbox(asArray(result.data?.inbox))
      setOutbox(asArray(result.data?.outbox))
      setDrafts(asArray(result.data?.drafts))
      setTemplates(asArray(result.data?.templates))
      setAudit(asArray(result.data?.audit))
      setStatus(`Synced ${nowLabel()} · ${result.data?.diagnostics?.finalMailboxCount || 0} mailbox(es)${syncSummary}`)
    } else {
      setStatus(result.error || "Workspace load failed")
    }
    setLoading(false)
  }

  async function loadLiveness() {
    const result = await api("/api/email-os/mailbox-liveness")
    if (result.ok) setLiveness(result.data)
    else setStatus(result.error || "Liveness failed")
  }

  useEffect(() => {
    if (scopedMailboxId) setSelectedMailbox(scopedMailboxId)
    load()
    loadLiveness()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailboxId])

  async function runMessageAction(action: string, payload: any = {}) {
    if (!selected?.id) { setStatus("Select a message first"); return }
    const source = sourceOf(selected)
    setStatus(`${action} running...`)
    const result = await api("/api/email-os/message-action", { method: "POST", body: JSON.stringify({ messageId: selected.id, action, source, mailboxId: mailboxId(selected) || (selectedMailbox !== "all" ? selectedMailbox : null), payload }) })
    if (!result.ok) { setStatus(result.error || `${action} failed`); return }
    const patch = result.data || result.patch || {}
    const update = (rows: any[]) => rows.map((row) => row.id === selected.id ? { ...row, ...patch, __source: undefined } : row)
    if (source === "inbox") setInbox(update)
    if (source === "outbox") setOutbox(update)
    if (source === "drafts") setDrafts(update)
    setStatus(`${action} synced`)
  }

  function openCompose(mode: ComposeMode) { setComposeMode(mode); setComposeOpen(true); setComposeMenuOpen(false) }

  async function lockCurrentMailbox() {
    if (!scopedMailboxId) return
    setStatus("Locking mailbox session...")
    await api("/api/email-os/access/logout-mailbox", {
      method: "POST",
      body: JSON.stringify({ mailboxId: scopedMailboxId })
    })
    window.location.href = "/email-os/gate"
  }

  const scopedMailbox = Boolean(mailboxId)
  const visibleViews = scopedMailbox ? views.filter((item) => item.key !== "settings") : views
  const scopedMailboxRecords = mailboxes.filter((mailbox) => mailbox.id === selectedMailbox || mailbox.mailbox_id === selectedMailbox)
  const composeMailboxes = scopedMailbox ? (scopedMailboxRecords.length ? scopedMailboxRecords : mailboxes.slice(0, 1)) : mailboxes

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <div className="grid min-h-screen grid-cols-[310px_minmax(390px,520px)_minmax(0,1fr)_380px]">
        <aside className="border-r border-violet-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">AngelCare</div><h1 className="text-2xl font-black">Email-OS</h1></div><button onClick={load} className="rounded-2xl bg-violet-50 p-3 text-violet-700"><RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /></button></div>
          <div className="relative mb-5"><button onClick={() => setComposeMenuOpen((v) => !v)} className="flex h-14 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200"><span className="flex items-center gap-3"><Pencil className="h-5 w-5" />Compose</span><ChevronDown className="h-4 w-4" /></button>{composeMenuOpen ? <div className="absolute left-0 right-0 top-16 z-50 rounded-3xl border border-violet-100 bg-white p-2 shadow-2xl"><button onClick={() => openCompose("compose")} className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-black hover:bg-violet-50"><Send className="h-4 w-4 text-violet-600" />Compose email</button><button onClick={() => openCompose("schedule")} className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-black hover:bg-violet-50"><Clock3 className="h-4 w-4 text-violet-600" />Schedule email</button></div> : null}</div>
          {!scopedMailbox ? <><div className="mb-5 rounded-3xl border border-violet-100 bg-violet-50 p-3"><select value={selectedMailbox} onChange={(e) => { setSelectedMailbox(e.target.value); setSelectedId(null) }} className="h-11 w-full rounded-2xl border border-violet-100 bg-white px-3 text-sm font-black outline-none"><option value="all">All department mailboxes</option>{mailboxes.map((mailbox) => <option key={mailbox.id} value={mailbox.id}>{mailbox.name} · {mailbox.email}</option>)}</select></div><nav className="space-y-1">{visibleViews.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => { setView(item.key); setSelectedId(null) }} className={`flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-bold ${view === item.key ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span><span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{counts[item.key] || 0}</span></button> })}</nav><div className="mt-7"><div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Department workspaces</div><div className="max-h-[270px] space-y-2 overflow-y-auto pr-1">{mailboxMetrics.map((mailbox) => <button key={mailbox.id} onClick={() => { setSelectedMailbox(mailbox.id); setView("inbox") }} className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left hover:border-violet-200 hover:bg-violet-50"><div className="flex items-center justify-between"><div className="min-w-0"><div className="truncate text-sm font-black">{mailbox.name}</div><div className="truncate text-xs font-semibold text-slate-500">{mailbox.email}</div></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{mailbox.status}</span></div><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] font-black text-slate-500"><span>In {mailbox.inbox}</span><span>Sent {mailbox.sent}</span><span>Dr {mailbox.drafts}</span><span>Urg {mailbox.urgent}</span></div></button>)}</div></div></> : <><div className="mb-5 rounded-3xl border border-violet-100 bg-violet-50 p-4"><div className="text-xs font-black uppercase tracking-wide text-violet-700">Mailbox scope locked</div><div className="mt-1 text-sm font-black text-slate-900">{mailboxes[0]?.name || mailboxId}</div><div className="text-xs font-semibold text-slate-500">{mailboxes[0]?.email || ''}</div></div>
            <nav className="space-y-1">
              {visibleViews.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => { setView(item.key); setSelectedId(null) }}
                    className={`flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-bold ${view === item.key ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{counts[item.key] || 0}</span>
                  </button>
                )
              })}
            </nav>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => openCompose("compose")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white"
              >
                <Send className="h-4 w-4" /> Compose from this mailbox
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/email-os/gate" }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-100 bg-white px-4 text-sm font-black text-violet-700"
              >
                <Mail className="h-4 w-4" /> Return to mailbox gate
              </button>
              <button
                type="button"
                onClick={lockCurrentMailbox}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-sm font-black text-rose-700"
              >
                <ShieldCheck className="h-4 w-4" /> Lock mailbox session
              </button>
            </div></>}

        </aside>

        <section className="border-r border-violet-100 bg-white p-6">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="text-3xl font-black">{views.find((item) => item.key === view)?.label}</h2><p className="text-sm font-bold text-slate-500">{mailboxName(mailboxes, selectedMailbox)} · {visibleRows.length} record(s)</p></div>{!scopedMailbox ? <button onClick={() => { setEditingMailbox(null); setMailboxModalOpen(true) }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Plus className="inline h-4 w-4" /> Mailbox</button> : null}</div>
          {view !== "settings" || scopedMailbox ? <><div className="mb-4 flex h-12 items-center rounded-2xl border border-slate-100 bg-slate-50 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every email, mailbox, tag, contact..." className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none" /></div><div className="mb-4 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} onClick={() => { setCategory(item); setSelectedId(null) }} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-black uppercase ${category === item ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}>{item}</button>)}</div><div className="max-h-[calc(100vh-190px)] space-y-3 overflow-y-auto pr-1">{visibleRows.map((row) => <button key={`${sourceOf(row)}-${row.id}`} onClick={() => setSelectedId(row.id)} className={`w-full rounded-3xl border p-4 text-left transition ${selected?.id === row.id ? "border-violet-200 bg-violet-50 shadow-sm" : "border-transparent bg-white hover:bg-slate-50"}`}><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-black text-violet-700">{initials(view === "sent" ? toOf(row) : fromOf(row))}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-black">{view === "sent" ? toOf(row) : fromOf(row)}</div>{row?.starred ? <Star className="h-4 w-4 fill-current text-amber-400" /> : null}</div><div className="truncate text-sm font-black text-slate-900">{subjectOf(row)}</div><div className="line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{previewOf(row)}</div><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{sourceOf(row)}</span><span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">{statusOf(row)}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">{mailboxName(mailboxes, mailboxId(row))}</span></div></div></div></button>)}{visibleRows.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center"><Mail className="mx-auto h-10 w-10 text-slate-300" /><div className="mt-3 font-black">No live records for this view</div><p className="mt-1 text-sm font-semibold text-slate-500">Change mailbox, category, search, or sync incoming messages.</p></div> : null}</div></> : null}
        </section>

        <main className="bg-white p-6">
          {view !== "settings" ? <><div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4"><InboxActionToolbar selectedId={selected?.id} busy={false} onAction={(action: string) => runMessageAction(action, { mailboxId: mailboxId(selected) })} /><div className="flex items-center gap-2"><button onClick={() => selected && openCompose("reply")} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white"><Reply className="inline h-4 w-4" /> Reply</button><button onClick={() => selected && runMessageAction("star")} className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700"><Star className="inline h-4 w-4" /> Star</button></div></div>{selected ? <div className="max-h-[calc(100vh-110px)] overflow-y-auto"><div className="rounded-[30px] border border-violet-100 bg-white p-7 shadow-sm"><div className="flex items-start justify-between gap-5"><div><div className="text-xs font-black uppercase tracking-wide text-violet-600">{sourceOf(selected)} · {mailboxName(mailboxes, mailboxId(selected))}</div><h2 className="mt-2 text-3xl font-black leading-tight">{subjectOf(selected)}</h2><p className="mt-2 text-sm font-bold text-slate-500">{sourceOf(selected) === "outbox" ? `To: ${toOf(selected)}` : `From: ${fromOf(selected)}`}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">{statusOf(selected)}</span></div><div className="mt-6 whitespace-pre-wrap rounded-3xl bg-slate-50 p-6 text-[15px] font-medium leading-8 text-slate-800">{previewOf(selected)}</div><div className="mt-6 grid gap-3 md:grid-cols-4"><button onClick={() => setActionMode("task")} className="rounded-2xl border border-violet-100 p-4 text-left hover:bg-violet-50"><CheckCircle2 className="h-5 w-5 text-violet-600" /><div className="mt-2 text-sm font-black">Task</div></button><button onClick={() => setActionMode("meeting")} className="rounded-2xl border border-violet-100 p-4 text-left hover:bg-violet-50"><Calendar className="h-5 w-5 text-violet-600" /><div className="mt-2 text-sm font-black">Meeting</div></button><button onClick={() => setActionMode("crm")} className="rounded-2xl border border-violet-100 p-4 text-left hover:bg-violet-50"><BriefcaseBusiness className="h-5 w-5 text-violet-600" /><div className="mt-2 text-sm font-black">CRM</div></button><button onClick={() => setActionMode("call")} className="rounded-2xl border border-violet-100 p-4 text-left hover:bg-violet-50"><PhoneCall className="h-5 w-5 text-violet-600" /><div className="mt-2 text-sm font-black">Call</div></button></div></div></div> : <div className="flex h-[70vh] items-center justify-center text-center"><div><MailOpen className="mx-auto h-12 w-12 text-slate-300" /><div className="mt-4 text-xl font-black">Select a record</div></div></div>}</> : <div className="max-h-[calc(100vh-80px)] overflow-y-auto"><h2 className="text-3xl font-black">Mailbox Production Control</h2><p className="mt-2 text-sm font-semibold text-slate-500">CEO-ready liveness, configuration, and mailbox metadata control.</p>{liveness?.summary ? <div className="mt-6 grid gap-4 md:grid-cols-4"><div className="rounded-3xl bg-slate-50 p-5"><div className="text-xs font-black uppercase text-slate-500">Total</div><div className="mt-2 text-3xl font-black">{liveness.summary.total}</div></div><div className="rounded-3xl bg-emerald-50 p-5"><div className="text-xs font-black uppercase text-emerald-700">Live</div><div className="mt-2 text-3xl font-black text-emerald-700">{liveness.summary.live}</div></div><div className="rounded-3xl bg-amber-50 p-5"><div className="text-xs font-black uppercase text-amber-700">Partial</div><div className="mt-2 text-3xl font-black text-amber-700">{liveness.summary.partial}</div></div><div className="rounded-3xl bg-rose-50 p-5"><div className="text-xs font-black uppercase text-rose-700">Risk</div><div className="mt-2 text-3xl font-black text-rose-700">{liveness.summary.risk}</div></div></div> : null}<div className="mt-6 space-y-3">{(liveness?.mailboxes || []).map((mailbox: any) => <div key={mailbox.key} className="rounded-3xl border border-slate-100 p-5"><div className="flex items-center justify-between"><div><div className="font-black">{mailbox.label}</div><div className="text-sm font-semibold text-slate-500">{mailbox.email}</div></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase text-violet-700">{mailbox.health}</span></div><div className="mt-3 grid gap-2 text-xs font-bold md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3">SMTP {mailbox.smtp?.reachable ? "OK" : "Risk"} · {mailbox.smtp?.host}:{mailbox.smtp?.port}</div><div className="rounded-xl bg-slate-50 p-3">Incoming {mailbox.imap?.reachable ? "OK" : "Risk"} · {mailbox.imap?.protocol} {mailbox.imap?.host}:{mailbox.imap?.port}</div></div></div>)}</div></div>}
        </main>

        <aside className="space-y-5 border-l border-violet-100 bg-white/90 p-5">
          <div className="rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-700" /><h3 className="font-black">Enterprise Copilot</h3></div><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Every action below writes through live Email-OS APIs and is linked to the selected mailbox/message.</p><div className="mt-4 space-y-2"><button onClick={() => selected && openCompose("reply")} className="h-11 w-full rounded-2xl bg-white text-sm font-black hover:bg-violet-50">Reply with context</button><button onClick={() => setActionMode("meeting")} className="h-11 w-full rounded-2xl bg-white text-sm font-black hover:bg-violet-50">Schedule meeting</button><button onClick={() => setActionMode("task")} className="h-11 w-full rounded-2xl bg-white text-sm font-black hover:bg-violet-50">Create follow-up task</button><button onClick={() => setActionMode("crm")} className="h-11 w-full rounded-2xl bg-white text-sm font-black hover:bg-violet-50">Add to CRM</button></div></div>
          <div className="rounded-[28px] border border-slate-100 bg-white p-5"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-violet-600" /><h3 className="font-black">Live metrics</h3></div><div className="mt-4 grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-3"><div className="text-2xl font-black">{inbox.length}</div><div className="text-[10px] font-black uppercase text-slate-500">Inbox</div></div><div className="rounded-2xl bg-slate-50 p-3"><div className="text-2xl font-black">{outbox.length}</div><div className="text-[10px] font-black uppercase text-slate-500">Outbox</div></div><div className="rounded-2xl bg-slate-50 p-3"><div className="text-2xl font-black">{drafts.length}</div><div className="text-[10px] font-black uppercase text-slate-500">Drafts</div></div><div className="rounded-2xl bg-slate-50 p-3"><div className="text-2xl font-black">{templates.length}</div><div className="text-[10px] font-black uppercase text-slate-500">Templates</div></div></div></div>
          {!scopedMailbox ? <div className="rounded-[28px] border border-slate-100 bg-white p-5"><div className="flex items-center gap-2"><Database className="h-5 w-5 text-violet-600" /><h3 className="font-black">Activity feed</h3></div><div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto">{audit.slice(0, 8).map((row) => <div key={row.id} className="rounded-2xl bg-slate-50 p-3"><div className="text-xs font-black">{row.action || "activity"}</div><div className="text-[10px] font-semibold text-slate-500">{row.created_at || row.createdAt}</div></div>)}{audit.length === 0 ? <div className="text-sm font-semibold text-slate-400">No activity yet.</div> : null}</div></div> : null}
          <div className="rounded-3xl bg-slate-950 p-4 text-xs font-bold text-white">{status}</div>
        </aside>
      </div>

      <EnterpriseComposeModal open={composeOpen} mode={composeMode} mailboxes={composeMailboxes} selectedEmail={{ ...(selected || {}), mailbox_id: selectedMailbox }} mailboxScopeLocked={scopedMailbox} onClose={() => setComposeOpen(false)} onDone={load} />
      <EnterpriseActionModal mode={actionMode} selected={selected} mailboxes={mailboxes} onClose={() => setActionMode(null)} onSaved={(message) => { setStatus(message); load() }} />
      <MailboxModal open={mailboxModalOpen} mailbox={editingMailbox} onClose={() => setMailboxModalOpen(false)} onSaved={load} />
    </div>
  )
}
