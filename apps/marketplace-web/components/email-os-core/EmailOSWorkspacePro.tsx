"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Archive, BriefcaseBusiness, Calendar, CheckCircle2, ChevronDown, Clock3, Database, FileText, Folder, Inbox, MailOpen, PhoneCall, RefreshCw, Reply, Search, Send, Settings, ShieldCheck, Sparkles, Star, Tag, Trash2, User, Users, X, Zap } from "lucide-react"
import EnterpriseComposeModal from "@/components/email-os-core/EnterpriseComposeModal"
import InboxActionToolbar from "@/components/email-os-core/InboxActionToolbar"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null),
    code: json?.code || json?.data?.code || null,
    status: res.status
  }
}

function asArray(payload: any) { return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [] }
function subjectOf(row: any) { return row?.subject || "(Sans objet)" }
function previewOf(row: any) { return row?.preview || row?.body || row?.description || row?.subject || "No preview available." }
function senderOf(row: any) { return row?.from_email || row?.fromEmail || row?.sender || row?.to_email || row?.toEmail || "system" }
function recipientOf(row: any) { return row?.to_email || row?.toEmail || row?.recipient || "recipient" }
function rowStatus(row: any) { return row?.status || (row?.read_at || row?.readAt ? "read" : "received") }
function normalizedStatus(row: any) { return String(rowStatus(row) || "").toLowerCase() }
function isTrash(row: any) { return normalizedStatus(row) === "trash" || Boolean(row?.deleted_at || row?.deletedAt) }
function isArchived(row: any) { return normalizedStatus(row) === "archived" || Boolean(row?.archived_at || row?.archivedAt) }
function isSpam(row: any) { return normalizedStatus(row) === "spam" }
function isUnread(row: any) { return !(row?.read_at || row?.readAt) && !["read", "sent", "trash", "archived"].includes(normalizedStatus(row)) }
function initials(value: string) { return String(value || "AC").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x => x[0]?.toUpperCase()).join("") || "AC" }
function mailboxLabel(mailboxes: any[], id: string) {
  const box = mailboxes.find((m) => m.id === id || m.mailbox_id === id)
  return box?.name || box?.email_address || box?.address || box?.email || id || "Mailbox"
}
function normalizeMailbox(row: any) {
  return { id: row.id || row.mailbox_id, name: row.name || row.label || row.email_address || row.address || row.email || row.id, email: row.email_address || row.address || row.email || row.from_email || row.username || "", department: row.department || row.owner || "operations", status: row.status || "active", provider: row.provider || row.source || "menara", raw: row }
}
function targetTypeForView(view: keyof typeof VIEWS) {
  if (view === "sent") return "outbox"
  if (view === "drafts") return "drafts"
  return "inbox"
}

type EmailOSSource = "inbox" | "outbox" | "drafts"

function withSource(rows: any[], source: EmailOSSource) {
  return rows.map((row) => ({ ...row, __emailOsSource: source }))
}

function sourceOf(row: any, view: keyof typeof VIEWS): EmailOSSource {
  if (row?.__emailOsSource === "outbox" || row?.__emailOsSource === "drafts" || row?.__emailOsSource === "inbox") return row.__emailOsSource
  return targetTypeForView(view) as EmailOSSource
}

function actionMovesOutOfView(action: string, currentView: keyof typeof VIEWS) {
  if (["delete", "permanent_delete", "archive", "spam", "restore", "move_folder"].includes(action)) return true
  if (action === "unstar" && currentView !== "trash") return true
  return false
}

function clientPatch(row: any, action: string, payload: any = {}, serverData?: any) {
  const now = new Date().toISOString()
  const patch: Record<string, any> = { updated_at: now, updatedAt: now }
  if (action === "permanent_delete") { patch.status = "permanently_deleted"; patch.deleted_at = now; patch.deletedAt = now; patch.permanentlyDeleted = true }
  if (action === "delete") { patch.status = "trash"; patch.deleted_at = now; patch.deletedAt = now }
  if (action === "archive") { patch.status = "archived"; patch.archived_at = now; patch.archivedAt = now }
  if (action === "restore") { patch.status = row.__emailOsSource === "drafts" ? "draft" : row.__emailOsSource === "outbox" ? "queued" : "received"; patch.deleted_at = null; patch.deletedAt = null; patch.archived_at = null; patch.archivedAt = null }
  if (action === "spam") patch.status = "spam"
  if (action === "mark_read") { patch.status = row.status === "trash" ? row.status : "read"; patch.read_at = now; patch.readAt = now }
  if (action === "mark_unread") { patch.status = row.status === "trash" ? row.status : "unread"; patch.read_at = null; patch.readAt = null }
  if (action === "star") { patch.starred = true; patch.starred_at = now; patch.starredAt = now }
  if (action === "unstar") { patch.starred = false; patch.starred_at = null; patch.starredAt = null }
  if (action === "tag" || action === "label") { patch.tag = payload?.tag || payload?.label || "follow-up"; patch.label = payload?.label || payload?.tag || "follow-up" }
  if (action === "move_folder") { patch.folder = payload?.folder || "follow-up-folder"; patch.status = payload?.folder || "foldered"; patch.tag = payload?.folder || payload?.tag || "foldered"; patch.label = payload?.label || payload?.folder || payload?.tag || "foldered" }
  return { ...row, ...(serverData || {}), ...patch, __emailOsSource: row.__emailOsSource }
}

const VIEWS = {
  inbox: { title: "Inbox", empty: "No inbox email selected" },
  sent: { title: "Sent", empty: "No sent email selected" },
  drafts: { title: "Drafts", empty: "No draft selected" },
  all: { title: "All Mail", empty: "No email selected" },
  spam: { title: "Spam", empty: "No spam email selected" },
  trash: { title: "Trash", empty: "No trashed email selected" },
  settings: { title: "Settings & Liveness", empty: "No mailbox selected" }
} as const

type AssistantMode = "meeting" | "task" | "crm" | "call" | null

type AssistantModalProps = {
  mode: AssistantMode
  selectedEmail: any
  mailboxes: any[]
  onClose: () => void
  onSaved: (message: string) => void
}

function AssistantActionModal({ mode, selectedEmail, mailboxes, onClose, onSaved }: AssistantModalProps) {
  const [title, setTitle] = useState(mode === "task" ? `Follow up: ${subjectOf(selectedEmail)}` : mode === "crm" ? `CRM contact: ${senderOf(selectedEmail)}` : mode === "call" ? `Call: ${senderOf(selectedEmail)}` : `Meeting: ${subjectOf(selectedEmail)}`)
  const [owner, setOwner] = useState("operations")
  const [dueAt, setDueAt] = useState("")
  const [priority, setPriority] = useState("high")
  const [notes, setNotes] = useState(previewOf(selectedEmail))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!mode) return null

  const actionType = mode

  async function save() {
    setBusy(true)
    setError(null)
    const result = await api("/api/email-os/assistant-action", {
      method: "POST",
      body: JSON.stringify({
        actionType,
        emailId: selectedEmail?.id,
        payload: {
          title,
          owner,
          dueAt: dueAt || null,
          priority,
          notes,
          mailboxId: selectedEmail?.mailbox_id,
          mailboxLabel: mailboxLabel(mailboxes, selectedEmail?.mailbox_id),
          subject: subjectOf(selectedEmail),
          contactEmail: senderOf(selectedEmail),
          source: "email-os-workspace"
        }
      })
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error || "Action failed")
      return
    }
    onSaved(`${actionType.toUpperCase()} action saved and synced`)
    onClose()
  }

  const Icon = actionType === "task" ? CheckCircle2 : actionType === "crm" ? BriefcaseBusiness : actionType === "call" ? PhoneCall : Calendar
  const titleText = actionType === "task" ? "Create synced follow-up task" : actionType === "crm" ? "Add contact to CRM action layer" : actionType === "call" ? "Log call action" : "Schedule meeting action"

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-violet-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-violet-50 px-7 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-600 p-3 text-white"><Icon className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-black text-slate-950">{titleText}</h2><p className="text-sm font-bold text-slate-500">Persists through Email-OS audit/copilot action APIs and stays linked to the selected email.</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-white p-3 text-slate-500"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid gap-4 p-7 md:grid-cols-2">
          <label className="md:col-span-2"><span className="text-xs font-black uppercase text-slate-500">Action title</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Owner / team</span><input value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Due / meeting time</span><input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-semibold outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-slate-500">Priority</span><select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-violet-100 px-4 text-sm font-black outline-none"><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="text-xs font-black uppercase text-violet-700">Linked mailbox</div><div className="mt-2 text-sm font-black text-slate-900">{mailboxLabel(mailboxes, selectedEmail?.mailbox_id)}</div><div className="text-xs font-semibold text-slate-500">{senderOf(selectedEmail)}</div></div>
          <label className="md:col-span-2"><span className="text-xs font-black uppercase text-slate-500">Notes / action context</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-36 w-full rounded-2xl border border-violet-100 p-4 text-sm font-semibold leading-6 outline-none" /></label>
          {error ? <div className="md:col-span-2 rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div> : null}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-violet-100 px-7 py-5">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl bg-slate-50 px-5 text-sm font-black text-slate-700">Cancel</button>
          <button type="button" onClick={save} disabled={busy || !title.trim()} className="h-11 rounded-2xl bg-violet-600 px-6 text-sm font-black text-white disabled:opacity-50">Save synced action</button>
        </footer>
      </div>
    </div>
  )
}



type EmailOSSyncControlPanelProps = {
  mailboxes: any[]
  selectedMailboxId: string
  onSynced: () => Promise<void> | void
  onStatus: (message: string) => void
}

type EmailOSSyncResult = {
  key: string
  label: string
  email: string
  status: "idle" | "syncing" | "success" | "empty" | "failed"
  fetched: number
  inserted: number
  skipped: number
  count: number
  error?: string
  at?: string
}

function syncIdentityForMailbox(mailbox: any) {
  return mailbox?.key || mailbox?.raw?.key || mailbox?.mailboxKey || mailbox?.id || mailbox?.mailbox_id || mailbox?.email
}

function EmailOSSyncControlPanel({ mailboxes, selectedMailboxId, onSynced, onStatus }: EmailOSSyncControlPanelProps) {
  const [deepFetch, setDeepFetch] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [lastStartedAt, setLastStartedAt] = useState<string | null>(null)
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, EmailOSSyncResult>>({})

  const selectedMailbox = useMemo(() => {
    if (!mailboxes.length) return null
    if (!selectedMailboxId || selectedMailboxId === "all") return mailboxes[0]
    return mailboxes.find((mailbox) => mailbox.id === selectedMailboxId || mailbox.mailbox_id === selectedMailboxId || mailbox.key === selectedMailboxId || mailbox.email === selectedMailboxId) || mailboxes[0]
  }, [mailboxes, selectedMailboxId])

  const resultRows = useMemo(() => {
    const seeded = mailboxes.map((mailbox) => {
      const key = syncIdentityForMailbox(mailbox)
      return results[key] || {
        key,
        label: mailbox.name || mailbox.label || mailbox.email || key,
        email: mailbox.email || mailbox.email_address || mailbox.address || "",
        status: "idle" as const,
        fetched: 0,
        inserted: 0,
        skipped: 0,
        count: 0
      }
    })
    return seeded
  }, [mailboxes, results])

  const summary = useMemo(() => {
    const rows = Object.values(results)
    return {
      success: rows.filter((row) => row.status === "success").length,
      empty: rows.filter((row) => row.status === "empty").length,
      failed: rows.filter((row) => row.status === "failed").length,
      inserted: rows.reduce((sum, row) => sum + (row.inserted || 0), 0),
      fetched: rows.reduce((sum, row) => sum + (row.fetched || 0), 0)
    }
  }, [results])

  function patchResult(mailbox: any, patch: Partial<EmailOSSyncResult>) {
    const key = syncIdentityForMailbox(mailbox)
    setResults((current) => {
      const previous = current[key] || {}
      return {
        ...current,
        [key]: {
          ...previous,
          key,
          label: mailbox.name || mailbox.label || mailbox.email || key,
          email: mailbox.email || mailbox.email_address || mailbox.address || "",
          status: "idle",
          fetched: 0,
          inserted: 0,
          skipped: 0,
          count: 0,
          ...patch
        }
      }
    })
  }

  async function syncMailbox(mailbox: any) {
    const mailboxIdentity = syncIdentityForMailbox(mailbox)
    if (!mailboxIdentity) return null
    setActiveKey(mailboxIdentity)
    patchResult(mailbox, { status: "syncing", error: undefined, at: new Date().toISOString() })

    const result = await api("/api/email-os/sync", {
      method: "POST",
      body: JSON.stringify({
        mailboxId: mailboxIdentity,
        limit: deepFetch ? 100 : 25,
        debug: true,
        force: true,
        forceFetch: true,
        source: "email-os-sync-control-panel"
      })
    })

    const payload = result.data?.data || result.data || {}
    const fetched = Number(payload.fetched ?? payload.count ?? 0)
    const inserted = Number(payload.inserted ?? payload.synced?.length ?? 0)
    const skipped = Number(payload.skipped ?? 0)
    const count = Number(payload.count ?? fetched ?? 0)

    if (!result.ok) {
      patchResult(mailbox, { status: "failed", error: result.code || result.error || "Sync failed", fetched: 0, inserted: 0, skipped: 0, count: 0, at: new Date().toISOString() })
      return { ok: false, error: result.error, code: result.code }
    }

    patchResult(mailbox, { status: inserted > 0 || fetched > 0 ? "success" : "empty", fetched, inserted, skipped, count, error: undefined, at: new Date().toISOString() })
    return { ok: true, fetched, inserted, skipped, count }
  }

  async function runCurrentSync() {
    if (!selectedMailbox || syncing) return
    setSyncing(true)
    setLastStartedAt(new Date().toISOString())
    onStatus(`Force sync started · ${selectedMailbox.name || selectedMailbox.email}`)
    const result = await syncMailbox(selectedMailbox)
    setActiveKey(null)
    setLastCompletedAt(new Date().toISOString())
    setSyncing(false)
    await onSynced()
    onStatus(result?.ok ? `Force sync completed · ${selectedMailbox.name || selectedMailbox.email}` : `Inbound sync failed: ${result?.code || result?.error || "SYNC_FAILED"}`)
  }

  async function runAllSync() {
    if (syncing || !mailboxes.length) return
    setSyncing(true)
    setLastStartedAt(new Date().toISOString())
    onStatus(`Sync all started · ${mailboxes.length} mailbox(es)`)
    let failedResult: { ok: false; error?: string; code?: string } | null = null
    for (const mailbox of mailboxes) {
      const result = await syncMailbox(mailbox)
      if (!result?.ok && !failedResult) failedResult = result as { ok: false; error?: string; code?: string }
    }
    setActiveKey(null)
    setLastCompletedAt(new Date().toISOString())
    setSyncing(false)
    await onSynced()
    onStatus(failedResult ? `Inbound sync failed: ${failedResult.code || failedResult.error || "SYNC_FAILED"}` : `Sync all completed · fetched ${summary.fetched} · inserted ${summary.inserted}`)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-950 via-violet-950 to-indigo-950 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-100"><Activity className="h-3.5 w-3.5" />Email OS Sync Center</div>
            <h2 className="mt-3 text-xl font-black">Manual Inbox Control</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-violet-100">Force fetch incoming emails, verify each mailbox, and surface failed credentials without hiding operational risk.</p>
          </div>
          <div className={`rounded-2xl p-3 ${syncing ? "bg-amber-400/20 text-amber-100" : "bg-emerald-400/20 text-emerald-100"}`}><RefreshCw className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} /></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-3"><div className="text-lg font-black">{summary.inserted}</div><div className="text-[10px] font-black uppercase text-violet-100">Inserted</div></div>
          <div className="rounded-2xl bg-white/10 p-3"><div className="text-lg font-black">{summary.empty}</div><div className="text-[10px] font-black uppercase text-violet-100">Empty OK</div></div>
          <div className="rounded-2xl bg-white/10 p-3"><div className="text-lg font-black">{summary.failed}</div><div className="text-[10px] font-black uppercase text-violet-100">Failed</div></div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div>
            <div className="text-xs font-black uppercase text-slate-500">Deep fetch mode</div>
            <div className="text-xs font-semibold text-slate-500">{deepFetch ? "Limit 100 · stronger mailbox pull" : "Limit 25 · standard inbox pull"}</div>
          </div>
          <button type="button" onClick={() => setDeepFetch((value) => !value)} className={`h-8 rounded-full px-3 text-xs font-black ${deepFetch ? "bg-violet-600 text-white" : "bg-white text-slate-600"}`}>{deepFetch ? "ON" : "OFF"}</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={runCurrentSync} disabled={syncing || !selectedMailbox} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 text-xs font-black text-white shadow-lg shadow-violet-100 disabled:opacity-50"><Zap className="h-4 w-4" />Sync current</button>
          <button type="button" onClick={runAllSync} disabled={syncing || !mailboxes.length} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-50"><Database className="h-4 w-4" />Sync all</button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400"><span>Mailbox execution ledger</span><span>{lastCompletedAt ? new Date(lastCompletedAt).toLocaleTimeString() : lastStartedAt ? "Running" : "Not synced"}</span></div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {resultRows.map((row) => {
              const isActive = activeKey === row.key
              const palette = row.status === "failed" ? "border-rose-100 bg-rose-50 text-rose-700" : row.status === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : row.status === "empty" ? "border-slate-100 bg-slate-50 text-slate-600" : row.status === "syncing" || isActive ? "border-amber-100 bg-amber-50 text-amber-700" : "border-slate-100 bg-white text-slate-500"
              return (
                <div key={row.key} className={`rounded-2xl border p-3 ${palette}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><div className="truncate text-xs font-black text-slate-900">{row.label}</div><div className="truncate text-[10px] font-semibold opacity-80">{row.email}</div></div>
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-black uppercase">{row.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-black"><span>Fetched {row.fetched}</span><span>Inserted {row.inserted}</span><span>Skipped {row.skipped}</span></div>
                  {row.error ? <div className="mt-2 flex gap-2 rounded-xl bg-white/80 p-2 text-[10px] font-bold leading-4 text-rose-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{row.error}</div> : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmailOSWorkspacePro() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [inboxRows, setInboxRows] = useState<any[]>([])
  const [outboxRows, setOutboxRows] = useState<any[]>([])
  const [draftRows, setDraftRows] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [view, setView] = useState<keyof typeof VIEWS>("inbox")
  const [activeTab, setActiveTab] = useState("primary")
  const [query, setQuery] = useState("")
  const [selectedMailboxId, setSelectedMailboxId] = useState("all")
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "schedule">("compose")
  const [composeMenuOpen, setComposeMenuOpen] = useState(false)
  const [status, setStatus] = useState("Ready")
  const [settingsHealth, setSettingsHealth] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [assistantModal, setAssistantModal] = useState<AssistantMode>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const normalizedMailboxes = useMemo(() => mailboxes.map(normalizeMailbox), [mailboxes])

  const rowsForView = useMemo(() => {
    if (view === "sent") return outboxRows.filter((row) => !isTrash(row))
    if (view === "drafts") return draftRows.filter((row) => !isTrash(row))
    if (view === "all") return [...inboxRows, ...outboxRows, ...draftRows].filter((row) => !isTrash(row) && !isSpam(row))
    if (view === "trash") return [...inboxRows, ...draftRows, ...outboxRows].filter(isTrash)
    if (view === "spam") return inboxRows.filter(isSpam)
    if (view === "settings") return []
    return inboxRows.filter((row) => !isTrash(row) && !isSpam(row) && !isArchived(row))
  }, [view, inboxRows, outboxRows, draftRows])

  const visibleRows = useMemo(() => {
    const q = query.toLowerCase().trim()
    return rowsForView.filter((row) => {
      const mailboxOk = selectedMailboxId === "all" || row.mailbox_id === selectedMailboxId || row.mailboxId === selectedMailboxId
      const text = [row.category, row.tag, row.label, row.priority, subjectOf(row), previewOf(row)].join(" ").toLowerCase()
      const tabOk = activeTab === "primary" ? true :
        activeTab === "unread" ? isUnread(row) :
        activeTab === "updates" ? ["update","system","notification","status"].some(t => text.includes(t)) :
        activeTab === "promotions" ? ["promo","marketing","offer","campaign"].some(t => text.includes(t)) :
        activeTab === "starred" ? Boolean(row.starred) || text.includes("starred") : true
      const haystack = [subjectOf(row), previewOf(row), senderOf(row), recipientOf(row), row.mailbox_id, row.mailboxId, row.status, row.tag, row.label].join(" ").toLowerCase()
      return mailboxOk && tabOk && (!q || haystack.includes(q))
    })
  }, [rowsForView, query, selectedMailboxId, activeTab])

  const selected = visibleRows.find((row) => row.id === selectedId) || visibleRows[0] || null
  const selectedBulkRows = useMemo(() => visibleRows.filter((row) => row?.id && selectedIds.includes(row.id)), [visibleRows, selectedIds])
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => row?.id && selectedIds.includes(row.id))
  const currentTitle = VIEWS[view]?.title || "Email-OS"

  async function load() {
    setStatus("Syncing workspace...")
    const [mailboxRes, inboxRes, outboxRes, draftRes] = await Promise.all([
      api("/api/email-os/compose-resources"),
      api("/api/email-os/inbox"),
      api("/api/email-os/outbox"),
      api("/api/email-os/entities/drafts")
    ])
    const resourceMailboxes = asArray(mailboxRes.data?.mailboxes)
    setMailboxes(resourceMailboxes)
    setInboxRows(withSource(asArray(inboxRes.data), "inbox"))
    setOutboxRows(withSource(asArray(outboxRes.data), "outbox"))
    setDraftRows(withSource(asArray(draftRes.data), "drafts"))
    setStatus(`Workspace synced · ${resourceMailboxes.length} mailbox(es) · ${asArray(inboxRes.data).length} inbox · ${asArray(outboxRes.data).length} outbox`)
  }

  async function loadSettingsHealth() {
    setSettingsLoading(true)
    const result = await api("/api/email-os/mailbox-liveness")
    setSettingsLoading(false)
    setSettingsHealth(result.ok ? result.data : { error: result.error || "Unable to load mailbox liveness" })
  }

  function switchView(nextView: keyof typeof VIEWS) {
    setView(nextView)
    setSelectedId(null)
    setSelectedIds([])
    setActiveTab("primary")
    if (nextView === "settings") loadSettingsHealth()
  }

  useEffect(() => { load() }, [])

  function patchRowsBySource(source: EmailOSSource, rowId: string, updater: (row: any) => any) {
    const patcher = (current: any[]) => current.map((row) => row.id === rowId ? updater(row) : row)
    if (source === "outbox") setOutboxRows(patcher)
    else if (source === "drafts") setDraftRows(patcher)
    else setInboxRows(patcher)
  }

  function removeRowsBySource(source: EmailOSSource, rowIds: string[]) {
    const ids = new Set(rowIds)
    const remover = (current: any[]) => current.filter((row) => !ids.has(row.id))
    if (source === "outbox") setOutboxRows(remover)
    else if (source === "drafts") setDraftRows(remover)
    else setInboxRows(remover)
  }

  function toggleSelectedRow(rowId: string) {
    setSelectedIds((current) => current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId])
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleRows.map((row) => row.id).filter(Boolean)
    setSelectedIds(allVisibleSelected ? [] : visibleIds)
  }

  function normalizeActionForView(action: string) {
    return view === "trash" && action === "delete" ? "permanent_delete" : action
  }

  async function runWorkspaceAction(action: string, payload: any = {}) {
    if (!selected?.id) return
    if (action === "back") { setSelectedId(null); return }
    if (action === "schedule") { setComposeMode("schedule"); setComposeOpen(true); return }
    if (action === "tag") payload = { ...payload, tag: payload.tag || "follow-up", label: payload.label || "follow-up" }
    if (action === "move_folder") payload = { ...payload, folder: payload.folder || "follow-up-folder" }

    const effectiveAction = normalizeActionForView(action)
    const selectedSource = sourceOf(selected, view)
    const selectedBeforeAction = { ...selected, __emailOsSource: selectedSource }
    const previous = { inboxRows, outboxRows, draftRows }

    setActionBusy(`${effectiveAction}:${selectedBeforeAction.id}`)
    setStatus(`${effectiveAction} syncing...`)
    if (effectiveAction === "permanent_delete") removeRowsBySource(selectedSource, [selectedBeforeAction.id])
    else patchRowsBySource(selectedSource, selectedBeforeAction.id, (row) => clientPatch({ ...row, __emailOsSource: selectedSource }, effectiveAction, payload))

    const result = await api("/api/email-os/message-action", {
      method: "POST",
      body: JSON.stringify({
        messageId: selectedBeforeAction.id,
        targetId: selectedBeforeAction.id,
        action: effectiveAction,
        source: selectedSource,
        targetType: selectedSource,
        mailboxId: selectedBeforeAction.mailbox_id || selectedBeforeAction.mailboxId || null,
        payload: { ...payload, source: selectedSource, targetType: selectedSource }
      })
    })

    setActionBusy(null)

    if (!result.ok) {
      setInboxRows(previous.inboxRows)
      setOutboxRows(previous.outboxRows)
      setDraftRows(previous.draftRows)
      setStatus(`${effectiveAction} failed · ${result.error || "API rejected action"}`)
      return
    }

    if (effectiveAction !== "permanent_delete") {
      patchRowsBySource(selectedSource, selectedBeforeAction.id, (row) => clientPatch({ ...row, __emailOsSource: selectedSource }, effectiveAction, payload, { ...(result.data || {}) }))
    }

    if (effectiveAction === "star") {
      setActiveTab("starred")
      setSelectedId(selectedBeforeAction.id)
    } else if (actionMovesOutOfView(effectiveAction, view)) {
      setSelectedId(null)
      setSelectedIds((current) => current.filter((id) => id !== selectedBeforeAction.id))
    }

    setStatus(`${effectiveAction} synced · ${selectedSource} · UI updated`)
  }

  async function runBulkWorkspaceAction(action: string, payload: any = {}) {
    const rows = selectedBulkRows
    if (!rows.length) return
    if (action === "tag") payload = { ...payload, tag: payload.tag || "follow-up", label: payload.label || "follow-up" }
    if (action === "move_folder") payload = { ...payload, folder: payload.folder || "follow-up-folder" }

    const effectiveAction = normalizeActionForView(action)
    const previous = { inboxRows, outboxRows, draftRows }
    setActionBusy(`bulk:${effectiveAction}`)
    setStatus(`Bulk ${effectiveAction} syncing for ${rows.length} message(s)...`)

    rows.forEach((row) => {
      const source = sourceOf(row, view)
      if (effectiveAction === "permanent_delete") removeRowsBySource(source, [row.id])
      else patchRowsBySource(source, row.id, (current) => clientPatch({ ...current, __emailOsSource: source }, effectiveAction, payload))
    })

    const results = await Promise.all(rows.map((row) => {
      const source = sourceOf(row, view)
      return api("/api/email-os/message-action", {
        method: "POST",
        body: JSON.stringify({
          messageId: row.id,
          targetId: row.id,
          action: effectiveAction,
          source,
          targetType: source,
          mailboxId: row.mailbox_id || row.mailboxId || null,
          payload: { ...payload, source, targetType: source, bulk: true }
        })
      })
    }))

    setActionBusy(null)
    const failed = results.find((result) => !result.ok)
    if (failed) {
      setInboxRows(previous.inboxRows)
      setOutboxRows(previous.outboxRows)
      setDraftRows(previous.draftRows)
      setStatus(`Bulk ${effectiveAction} failed · ${failed.error || "API rejected action"}`)
      return
    }

    if (effectiveAction !== "permanent_delete") {
      rows.forEach((row, index) => {
        const source = sourceOf(row, view)
        const result = results[index]
        patchRowsBySource(source, row.id, (current) => clientPatch({ ...current, __emailOsSource: source }, effectiveAction, payload, { ...(result.data || {}) }))
      })
    }

    setSelectedIds([])
    setSelectedId(null)
    if (effectiveAction === "star") setActiveTab("starred")
    setStatus(`Bulk ${effectiveAction} synced for ${rows.length} message(s)`)
  }

  const viewCounts = {
    inbox: inboxRows.filter((row) => !isTrash(row) && !isSpam(row) && !isArchived(row)).length,
    sent: outboxRows.filter((row) => !isTrash(row)).length,
    drafts: draftRows.filter((row) => !isTrash(row)).length,
    all: [...inboxRows, ...outboxRows, ...draftRows].filter((row) => !isTrash(row) && !isSpam(row)).length,
    spam: inboxRows.filter(isSpam).length,
    trash: [...inboxRows, ...draftRows, ...outboxRows].filter(isTrash).length
  }

  return (
    <div className="min-h-screen bg-[#f7f7ff] text-slate-950">
      <div className="grid min-h-screen grid-cols-[300px_minmax(380px,520px)_minmax(0,1fr)_360px]">
        <aside className="border-r border-violet-100 bg-white/80 p-5 shadow-sm">
          <div className="relative mb-7">
            <button type="button" onClick={() => setComposeMenuOpen(v => !v)} className="flex h-14 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200">
              <span className="inline-flex items-center gap-3"><FileText className="h-5 w-5" />Compose</span><ChevronDown className="h-4 w-4" />
            </button>
            {composeMenuOpen ? (
              <div className="absolute left-0 right-0 top-16 z-50 rounded-3xl border border-violet-100 bg-white p-2 shadow-2xl">
                <button type="button" onClick={() => { setComposeMode("compose"); setComposeOpen(true); setComposeMenuOpen(false) }} className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-black hover:bg-violet-50"><Send className="h-4 w-4 text-violet-600" />Compose email</button>
                <button type="button" onClick={() => { setComposeMode("schedule"); setComposeOpen(true); setComposeMenuOpen(false) }} className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-black hover:bg-violet-50"><Clock3 className="h-4 w-4 text-violet-600" />Schedule email</button>
              </div>
            ) : null}
          </div>

          {[["inbox","Inbox",Inbox,viewCounts.inbox],["sent","Sent",Send,viewCounts.sent],["drafts","Drafts",FileText,viewCounts.drafts],["all","All Mail",MailOpen,viewCounts.all],["spam","Spam",ShieldCheck,viewCounts.spam],["trash","Trash",Trash2,viewCounts.trash]].map(([key,label,Icon,count]: any) => (
            <button key={key} type="button" onClick={() => switchView(key)} className={`mb-1 flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-bold ${view === key ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className="inline-flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span>{count ? <span className="rounded-full bg-violet-200 px-2 py-0.5 text-xs">{count}</span> : null}
            </button>
          ))}

          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-2">
            <button type="button" onClick={() => switchView("settings")} className={`flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-black ${view === "settings" ? "bg-white text-violet-700 shadow-sm" : "text-slate-700 hover:bg-white"}`}>
              <Settings className="h-4 w-4 text-violet-600" />Settings & Liveness
            </button>
          </div>

          <div className="mt-8 text-xs font-black text-slate-500">Smart Views</div>
          {[["Mentions",User,"@"],["Unassigned",Users,"unassigned"],["Waiting for reply",Reply,"waiting"],["Due Today",Calendar,"today"],["VIP & Key Contacts",Star,"vip"],["Projects",Folder,"project"]].map(([label,Icon,filter]: any) => (
            <button key={label} type="button" onClick={() => { setQuery(String(filter).toLowerCase()); setStatus(`${label} filter applied`) }} className="mt-1 flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><Icon className="h-4 w-4 text-violet-500" />{label}</button>
          ))}
        </aside>

        <section className="border-r border-violet-100 bg-white/90 p-5">
          {view !== "settings" ? (
            <>
              <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-black">{currentTitle}</h1><button type="button" onClick={load} className="rounded-xl bg-slate-50 p-3 text-slate-500 hover:bg-violet-50"><RefreshCw className="h-4 w-4" /></button></div>
              <select value={selectedMailboxId} onChange={(e) => { setSelectedMailboxId(e.target.value); setSelectedId(null); setStatus("Mailbox filter synced") }} className="mb-4 h-11 w-full rounded-2xl border border-violet-100 bg-white px-3 text-sm font-black outline-none">
                <option value="all">All live mailboxes</option>{normalizedMailboxes.map((m) => <option key={m.id} value={m.id}>{m.name} {m.email ? `• ${m.email}` : ""}</option>)}
              </select>

              <div className="mb-5 flex gap-5 border-b border-slate-100">
                {[["primary","Primary"],["unread","Unread"],["updates","Updates"],["promotions","Promotions"],["starred","Starred"]].map(([key,label]) => (
                  <button key={key} type="button" onClick={() => { setActiveTab(key); setSelectedId(null); setStatus(`${label} tab selected`) }} className={`relative pb-3 text-sm font-black ${activeTab === key ? "text-violet-700" : "text-slate-500 hover:text-slate-900"}`}>{label}{activeTab === key ? <span className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-violet-600" /> : null}</button>
                ))}
              </div>

              <div className="mb-4 flex h-11 items-center rounded-2xl border border-slate-100 bg-slate-50 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${currentTitle.toLowerCase()}...`} className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none" /></div>
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-violet-100 bg-white px-3 py-2 text-xs font-black text-slate-600">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-violet-200" />Select all visible</label>
                {selectedBulkRows.length ? <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">{selectedBulkRows.length} selected</span> : <span>{visibleRows.length} visible</span>}
              </div>
              {selectedBulkRows.length ? (
                <div className="mb-4 rounded-3xl border border-violet-100 bg-violet-50 p-3 shadow-sm">
                  <div className="mb-2 text-xs font-black uppercase text-violet-700">Bulk actions</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("archive")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Archive</button>
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("delete")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50">{view === "trash" ? "Delete forever" : "Move to Trash"}</button>
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("restore")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Restore</button>
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("mark_read")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Mark read</button>
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("mark_unread")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Mark unread</button>
                    <button type="button" disabled={Boolean(actionBusy)} onClick={() => runBulkWorkspaceAction("star")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-amber-700 disabled:opacity-50">Star</button>
                    <button type="button" onClick={() => setSelectedIds([])} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500">Clear</button>
                  </div>
                </div>
              ) : null}
              <div className="max-h-[calc(100vh-330px)] space-y-3 overflow-y-auto">
                {visibleRows.map((row, index) => (
                  <div key={row.id || index} role="button" tabIndex={0} onClick={() => setSelectedId(row.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(row.id) }} className={`w-full cursor-pointer rounded-2xl border p-4 text-left ${selected?.id === row.id ? "border-violet-200 bg-violet-50" : "border-transparent hover:bg-slate-50"}`}>
                    <div className="flex gap-3">
                      <span onClick={(event) => event.stopPropagation()} className="pt-3"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelectedRow(row.id)} className="h-4 w-4 rounded border-violet-200" /></span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">{initials(view === "sent" ? recipientOf(row) : senderOf(row))}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><div className={`truncate font-black ${isUnread(row) ? "text-slate-950" : "text-slate-700"}`}>{view === "sent" ? recipientOf(row).split("@")[0] : senderOf(row).split("@")[0]}</div>{row.starred ? <Star className="h-3.5 w-3.5 fill-current text-amber-500" /> : null}</div><div className="truncate text-sm font-black">{subjectOf(row)}</div><div className="line-clamp-1 text-xs font-semibold text-slate-500">{previewOf(row)}</div><div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><span>{mailboxLabel(normalizedMailboxes, row.mailbox_id || row.mailboxId)}</span><span>• {rowStatus(row)}</span>{row.tag || row.label ? <span>• {row.tag || row.label}</span> : null}</div></div></div>
                  </div>
                ))}
                {visibleRows.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-100 p-8 text-center text-sm font-bold text-slate-400">No records for this view/filter.</div> : null}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5"><div className="text-sm font-black text-violet-700">CEO mailbox control</div><div className="mt-2 text-xs font-semibold text-slate-500">Configure, monitor, and verify all mailbox identities from the protected production liveness page.</div><a href="/email-os/mailbox-liveness" className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-violet-600 px-5 text-sm font-black text-white">Open liveness monitor</a></div>
              <button type="button" onClick={loadSettingsHealth} disabled={settingsLoading} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${settingsLoading ? "animate-spin" : ""}`} />Check all mailboxes now</button>
              <div className="space-y-3">{normalizedMailboxes.map((m) => <div key={m.id} className="rounded-2xl border border-slate-100 bg-white p-4"><div className="font-black">{m.name}</div><div className="text-xs font-semibold text-slate-500">{m.email}</div><div className="mt-2 text-[10px] font-black uppercase text-slate-400">{m.provider} · {m.id}</div></div>)}</div>
            </div>
          )}
        </section>

        <main className="bg-white p-6">
          {view === "settings" ? (
            <div className="max-h-[calc(100vh-70px)] overflow-y-auto">
              <h2 className="text-3xl font-black">Mailbox Production Control</h2><p className="mt-2 text-sm font-semibold text-slate-500">CEO-protected liveness, environment identities, provider reachability, and production counters.</p>
              {settingsHealth?.error ? <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-5 text-sm font-black text-rose-700">{settingsHealth.error}</div> : null}
              {settingsHealth?.summary ? <div className="mt-6 grid gap-4 md:grid-cols-4"><div className="rounded-3xl border border-slate-100 bg-slate-50 p-5"><div className="text-xs font-black uppercase text-slate-500">Total</div><div className="mt-2 text-3xl font-black">{settingsHealth.summary.total}</div></div><div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"><div className="text-xs font-black uppercase text-emerald-700">Live</div><div className="mt-2 text-3xl font-black text-emerald-700">{settingsHealth.summary.live}</div></div><div className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><div className="text-xs font-black uppercase text-amber-700">Partial</div><div className="mt-2 text-3xl font-black text-amber-700">{settingsHealth.summary.partial}</div></div><div className="rounded-3xl border border-rose-100 bg-rose-50 p-5"><div className="text-xs font-black uppercase text-rose-700">Risk</div><div className="mt-2 text-3xl font-black text-rose-700">{settingsHealth.summary.risk}</div></div></div> : null}
              <div className="mt-6 space-y-3">{(settingsHealth?.mailboxes || []).map((m: any) => <div key={m.key} className="rounded-3xl border border-slate-100 p-5"><div className="flex items-center justify-between gap-4"><div><div className="font-black">{m.label}</div><div className="text-sm font-semibold text-slate-500">{m.email}</div></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase text-violet-700">{m.health}</span></div><div className="mt-3 grid gap-2 text-xs font-bold md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3">SMTP {m.smtp?.reachable ? "OK" : "Risk"} · {m.smtp?.user}</div><div className="rounded-xl bg-slate-50 p-3">POP/IMAP {m.imap?.reachable ? "OK" : "Risk"} · {m.imap?.user}</div></div></div>)}</div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex h-12 items-center justify-between border-b border-slate-100 pb-4"><InboxActionToolbar selectedId={selected?.id} busy={Boolean(actionBusy)} trashMode={view === "trash"} onAction={runWorkspaceAction} /><div className="text-sm font-bold text-slate-500">{selected ? Math.max(visibleRows.findIndex((row) => row.id === selected.id) + 1, 1) : 0} of {visibleRows.length}</div></div>
              {!selected ? <div className="flex h-[70vh] items-center justify-center text-center"><div><MailOpen className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 text-xl font-black">{VIEWS[view]?.empty}</h2></div></div> : <div className="max-h-[calc(100vh-120px)] overflow-y-auto"><div className="flex items-start justify-between gap-5"><div><h2 className="text-3xl font-black">{subjectOf(selected)}</h2><div className="mt-2 text-sm font-bold text-slate-500">{view === "sent" ? `To: ${recipientOf(selected)}` : `From: ${senderOf(selected)}`}</div></div><div className="flex gap-2"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase text-violet-700">{rowStatus(selected)}</span>{selected.starred ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">Starred</span> : null}</div></div><div className="mt-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="font-black">{mailboxLabel(normalizedMailboxes, selected.mailbox_id || selected.mailboxId)}</div><div className="mt-5 whitespace-pre-wrap text-[15px] font-medium leading-8 text-slate-800">{previewOf(selected)}</div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => { setComposeMode("reply"); setComposeOpen(true) }} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Reply</button><button type="button" onClick={() => { setComposeMode("compose"); setComposeOpen(true) }} className="rounded-2xl bg-slate-50 px-5 py-3 text-sm font-black text-slate-700">Forward / new send</button><button type="button" onClick={() => runWorkspaceAction("archive")} className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 text-sm font-black text-slate-700"><Archive className="h-4 w-4" />Archive</button><button type="button" onClick={() => runWorkspaceAction("tag")} className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 text-sm font-black text-slate-700"><Tag className="h-4 w-4" />Label</button></div></div>}
            </>
          )}
        </main>

        <aside className="space-y-5 border-l border-violet-100 bg-white/80 p-5">
          <EmailOSSyncControlPanel mailboxes={normalizedMailboxes} selectedMailboxId={selectedMailboxId} onSynced={load} onStatus={setStatus} />
          <div className="rounded-3xl border border-violet-100 bg-white shadow-sm"><div className="flex items-center justify-between rounded-t-3xl bg-violet-100/70 p-5"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-700" /><h2 className="font-black">AI Assistant</h2></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-violet-700">Live actions</span></div><div className="space-y-3 p-5"><p className="text-sm font-semibold leading-6 text-slate-600">{view === "settings" ? "Mailbox operations and liveness are available in Settings & Liveness." : `${senderOf(selected)} has an Email-OS record ready for reply, task, CRM, meeting or call follow-up.`}</p><button type="button" onClick={() => { setComposeMode("reply"); setComposeOpen(true) }} className="h-11 w-full rounded-xl border border-violet-100 text-sm font-black hover:bg-violet-50">Reply with proposal confirmation</button><button type="button" onClick={() => setAssistantModal("meeting")} className="h-11 w-full rounded-xl border border-violet-100 text-sm font-black hover:bg-violet-50">Schedule a meeting</button><button type="button" onClick={() => setAssistantModal("task")} className="h-11 w-full rounded-xl border border-violet-100 text-sm font-black hover:bg-violet-50">Create a follow-up task</button><button type="button" onClick={() => setAssistantModal("crm")} className="h-11 w-full rounded-xl border border-violet-100 text-sm font-black hover:bg-violet-50">Add to CRM</button><button type="button" onClick={() => setAssistantModal("call")} className="h-11 w-full rounded-xl border border-violet-100 text-sm font-black hover:bg-violet-50">Log call action</button></div></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-400">Live status</div><div className="mt-2 text-sm font-bold text-slate-600">{status}</div></div>
        </aside>
      </div>

      <EnterpriseComposeModal open={composeOpen} mode={composeMode} mailboxes={normalizedMailboxes} selectedEmail={selected} onClose={() => setComposeOpen(false)} onDone={load} />
      <AssistantActionModal mode={assistantModal} selectedEmail={selected} mailboxes={normalizedMailboxes} onClose={() => setAssistantModal(null)} onSaved={(message) => { setStatus(message); load() }} />
    </div>
  )
}
