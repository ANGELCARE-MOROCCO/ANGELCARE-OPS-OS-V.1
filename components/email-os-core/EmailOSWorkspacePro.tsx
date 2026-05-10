"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Archive,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Folder,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Trash2,
  UserPlus,
  Wifi,
  Zap
} from "lucide-react"
import ProviderActionsPanel from "@/components/email-os-core/ProviderActionsPanel"

type Entity = "mailboxes" | "templates" | "threads" | "drafts" | "queue" | "audit" | "automation"
type View = Entity | "compose" | "health"

type Thread = {
  id: string
  subject?: string
  preview?: string
  fromEmail?: string
  status?: string
  priority?: string
  owner?: string
  updatedAt?: string
}

const nav: Array<{ key: View; label: string; icon: any }> = [
  { key: "threads", label: "Inbox", icon: Inbox },
  { key: "compose", label: "Compose", icon: Send },
  { key: "mailboxes", label: "Mailboxes", icon: Folder },
  { key: "templates", label: "Templates", icon: FileText },
  { key: "automation", label: "Automation", icon: Zap },
  { key: "drafts", label: "Drafts", icon: Edit3 },
  { key: "queue", label: "Outbox", icon: Archive },
  { key: "audit", label: "Audit", icon: CheckCircle2 },
  { key: "health", label: "Health", icon: Activity }
]

const configs: Record<Entity, { title: string; icon: any; primary: string; fields: Array<{ key: string; label: string; textarea?: boolean; checkbox?: boolean }> }> = {
  mailboxes: { title: "Mailboxes", icon: Folder, primary: "name", fields: [{ key: "name", label: "Name" }, { key: "address", label: "Email address" }, { key: "provider", label: "Provider" }, { key: "status", label: "Status" }, { key: "owner", label: "Owner" }] },
  templates: { title: "Templates", icon: FileText, primary: "name", fields: [{ key: "name", label: "Name" }, { key: "subject", label: "Subject" }, { key: "category", label: "Category" }, { key: "body", label: "Body", textarea: true }] },
  threads: { title: "Threads", icon: Inbox, primary: "subject", fields: [{ key: "mailboxId", label: "Mailbox ID" }, { key: "fromEmail", label: "From email" }, { key: "subject", label: "Subject" }, { key: "preview", label: "Preview", textarea: true }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "owner", label: "Owner" }] },
  drafts: { title: "Drafts", icon: Edit3, primary: "subject", fields: [{ key: "mailboxId", label: "Mailbox ID" }, { key: "toEmail", label: "To email" }, { key: "subject", label: "Subject" }, { key: "body", label: "Body", textarea: true }, { key: "status", label: "Status" }] },
  queue: { title: "Outbox Queue", icon: Archive, primary: "type", fields: [{ key: "type", label: "Type" }, { key: "status", label: "Status" }, { key: "scheduledAt", label: "Scheduled at" }] },
  audit: { title: "Audit", icon: CheckCircle2, primary: "action", fields: [{ key: "action", label: "Action" }, { key: "targetType", label: "Target type" }, { key: "targetId", label: "Target ID" }, { key: "severity", label: "Severity" }] },
  automation: { title: "Automation", icon: Zap, primary: "name", fields: [{ key: "name", label: "Name" }, { key: "trigger", label: "Trigger" }, { key: "action", label: "Action" }, { key: "enabled", label: "Enabled", checkbox: true }] }
}

async function api<T>(path: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  const json = await res.json().catch(() => null)
  if (!res.ok) return { ok: false, error: json?.error || `HTTP ${res.status}` }
  return { ok: true, data: json?.data ?? json }
}

function Button({ children, onClick, primary = false, danger = false, disabled = false }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? "bg-slate-950 text-white hover:bg-slate-800" : danger ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  )
}

function ConfirmDelete({ label, onCancel, onConfirm }: { label: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-rose-50 p-3 text-rose-700"><Trash2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Delete record?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">This will remove {label}. This action cannot be undone from the UI.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button danger onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

function ThreadsSplitPane({ toast }: { toast: (message: string) => void }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await api<Thread[]>("/api/email-os/entities/threads")
    setThreads(result.ok ? result.data || [] : [])
    setSelectedId((current) => current || result.data?.[0]?.id || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selected = threads.find((item) => item.id === selectedId) || threads[0]

  async function action(actionName: string) {
    if (!selected) return
    const result = await api("/api/email-os/thread-action", {
      method: "POST",
      body: JSON.stringify({ threadId: selected.id, action: actionName, owner: "operations" })
    })

    toast(result.ok ? `Thread ${actionName} completed` : result.error || "Action failed")
    await load()
  }

  async function createManualThread() {
    const result = await api("/api/email-os/entities/threads", {
      method: "POST",
      body: JSON.stringify({
        fromEmail: "manual@angelcare.ma",
        subject: "Manual operational thread",
        preview: "Created manually from the workspace.",
        status: "open",
        priority: "normal"
      })
    })
    toast(result.ok ? "Thread created" : result.error || "Create failed")
    await load()
  }

  return (
    <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="border-r border-slate-200">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <h1 className="text-lg font-black text-slate-950">Thread Inbox</h1>
            <p className="text-xs text-slate-500">{threads.length} live records</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            <Button primary onClick={createManualThread}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          {loading ? <div className="p-5 text-sm font-bold text-slate-500">Loading...</div> : null}
          {!loading && threads.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-4 font-black text-slate-950">No threads yet</h2>
              <p className="mt-2 text-sm text-slate-500">Sync IMAP or create a manual thread.</p>
              <div className="mt-4"><Button primary onClick={createManualThread}>Create thread</Button></div>
            </div>
          ) : null}
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedId(thread.id)}
              className={`block w-full cursor-pointer border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${selected?.id === thread.id ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-black text-slate-950">{thread.subject || "(No subject)"}</div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{thread.priority || "normal"}</span>
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-slate-500">{thread.fromEmail || "unknown sender"}</div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{thread.preview || "No preview"}</p>
              <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">{thread.status || "open"}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center">
            <div>
              <Mail className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-black text-slate-950">Select a thread</h2>
              <p className="mt-2 text-sm text-slate-500">Choose a thread to view details and execute actions.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{selected.subject || "(No subject)"}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.fromEmail || "unknown"} • {selected.status || "open"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => action("assign")}><UserPlus className="h-4 w-4" /> Assign</Button>
                  <Button onClick={() => action("snooze")}><Clock className="h-4 w-4" /> Snooze</Button>
                  <Button onClick={() => action("archive")}><Archive className="h-4 w-4" /> Archive</Button>
                  <Button onClick={() => action("resolve")}><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
                  <Button danger onClick={() => action("escalate")}><ShieldAlert className="h-4 w-4" /> Escalate</Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">Thread preview</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.preview || "No message preview available."}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-black uppercase text-slate-400">Owner</div><div className="mt-2 font-black">{selected.owner || "Unassigned"}</div></div>
                <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-black uppercase text-slate-400">Priority</div><div className="mt-2 font-black">{selected.priority || "normal"}</div></div>
                <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-black uppercase text-slate-400">Status</div><div className="mt-2 font-black">{selected.status || "open"}</div></div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function EntityManager({ entity, toast }: { entity: Entity; toast: (message: string) => void }) {
  const cfg = configs[entity]
  const Icon = cfg.icon
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    const result = await api<any[]>(`/api/email-os/entities/${entity}`)
    setRows(result.ok ? result.data || [] : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [entity])

  function create() {
    const next: Record<string, any> = {}
    cfg.fields.forEach((field) => next[field.key] = field.checkbox ? true : "")
    if (entity === "mailboxes") Object.assign(next, { provider: "smtp_imap", status: "active", owner: "operations" })
    if (entity === "queue") Object.assign(next, { type: "send", status: "queued" })
    if (entity === "audit") next.severity = "info"
    setEditing(null)
    setForm(next)
    setOpen(true)
  }

  function edit(row: any) {
    setEditing(row)
    setForm({ ...row })
    setOpen(true)
  }

  async function save() {
    const result = await api(editing ? `/api/email-os/entities/${entity}/${editing.id}` : `/api/email-os/entities/${entity}`, {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(form)
    })
    toast(result.ok ? "Saved" : result.error || "Save failed")
    if (result.ok) {
      setOpen(false)
      await load()
    }
  }

  async function remove() {
    if (!pendingDelete) return
    const result = await api(`/api/email-os/entities/${entity}/${pendingDelete.id}`, { method: "DELETE" })
    toast(result.ok ? "Deleted" : result.error || "Delete failed")
    if (result.ok) {
      setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
    }
  }

  async function syncMailbox(row: any) {
  const result = await api("/api/email-os/sync", {
    method: "POST",
    body: JSON.stringify({ mailboxId: row.id, limit: 10 })
  })

  const syncCount =
    result.data &&
    typeof result.data === "object" &&
    "count" in result.data
      ? Number(result.data.count || 0)
      : 0

  toast(result.ok ? `Synced ${syncCount} messages` : result.error || "Sync failed")
  await load()
}

  const cols = useMemo(() => Array.from(new Set(rows.flatMap((row) => Object.keys(row)).filter((key) => !["body", "details", "payload"].includes(key)))).slice(0, 5), [rows])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">{cfg.title}</h1>
              <p className="mt-1 text-sm text-slate-500">Live DB-backed records. No seeded demo data.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button primary onClick={create}><Plus className="h-4 w-4" /> New</Button>
          </div>
        </div>
      </section>

      {entity === "mailboxes" ? <ProviderActionsPanel /> : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Inbox className="h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-lg font-black text-slate-950">No records yet</h2>
          <p className="mt-2 text-sm text-slate-500">Create your first record.</p>
          <div className="mt-4"><Button primary onClick={create}><Plus className="h-4 w-4" /> Create</Button></div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[minmax(240px,1fr)_repeat(3,minmax(110px,160px))_280px] items-center gap-2 p-4">
                <div>
                  <div className="font-black text-slate-950">{String(row[cfg.primary] || row.name || row.subject || row.action || row.type || row.id)}</div>
                  <div className="text-xs text-slate-500">{row.id}</div>
                </div>
                {cols.slice(1, 4).map((column) => <div key={column} className="truncate text-sm text-slate-600">{typeof row[column] === "object" ? JSON.stringify(row[column]) : String(row[column] ?? "")}</div>)}
                {Array.from({ length: Math.max(0, 3 - cols.slice(1, 4).length) }).map((_, i) => <div key={i} />)}
                <div className="flex justify-end gap-2">
                  {entity === "mailboxes" ? <Button onClick={() => syncMailbox(row)}><RefreshCw className="h-4 w-4" /> Sync</Button> : null}
                  <Button onClick={() => edit(row)}><Edit3 className="h-4 w-4" /></Button>
                  <Button danger onClick={() => setPendingDelete(row)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-slate-950">{editing ? "Edit" : "Create"} {cfg.title}</h2>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="space-y-4 p-5">
              {cfg.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-bold text-slate-700">{field.label}</span>
                  {field.textarea ? <textarea value={form[field.key] || ""} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none" /> :
                    field.checkbox ? <div className="mt-3"><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} className="h-4 w-4 cursor-pointer" /></div> :
                    <input value={form[field.key] || ""} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none" />}
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button primary onClick={save}><Save className="h-4 w-4" /> Save</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? <ConfirmDelete label={String(pendingDelete[cfg.primary] || pendingDelete.id)} onCancel={() => setPendingDelete(null)} onConfirm={remove} /> : null}
    </div>
  )
}

function ComposePanel({ toast }: { toast: (message: string) => void }) {
  const [form, setForm] = useState({ toEmail: "", subject: "", body: "" })
  const [status, setStatus] = useState("Ready")

  async function send() {
    setStatus("Sending...")
    const result = await api("/api/email-os/send", { method: "POST", body: JSON.stringify(form) })
    setStatus(result.ok ? "Sent or queued" : result.error || "Failed")
    toast(result.ok ? "Message sent or queued" : result.error || "Send failed")
  }

  async function draft() {
    const result = await api("/api/email-os/entities/drafts", { method: "POST", body: JSON.stringify({ ...form, status: "draft" }) })
    toast(result.ok ? "Draft saved" : result.error || "Draft failed")
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Compose</h1>
          <p className="text-sm text-slate-500">SMTP sends; missing SMTP queues safely.</p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-500">{status}</span>
      </div>
      <div className="space-y-4 p-5">
        <input placeholder="To" value={form.toEmail} onChange={(event) => setForm({ ...form, toEmail: event.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
        <input placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
        <textarea placeholder="Body" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} className="min-h-[360px] w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none" />
        <div className="flex gap-2">
          <Button primary onClick={send}><Send className="h-4 w-4" /> Send / Queue</Button>
          <Button onClick={draft}><Save className="h-4 w-4" /> Save Draft</Button>
        </div>
      </div>
    </section>
  )
}

function HealthPanel() {
  const [data, setData] = useState<any>({})

  async function load() {
    const result = await api<any>("/api/email-os/health")
    setData(result.data?.data || result.data || {})
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Health</h1>
            <p className="text-sm text-slate-500">Real provider and environment status.</p>
          </div>
          <Button onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase text-slate-400">{key}</div>
            <div className={`mt-3 font-black ${value ? "text-emerald-700" : "text-amber-700"}`}>{value ? "Configured" : "Missing"}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default function EmailOSWorkspacePro() {
  const [view, setView] = useState<View>("threads")
  const [toastMessage, setToastMessage] = useState("")

  function toast(message: string) {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(""), 3000)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
      <aside className="hidden w-[290px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><Mail className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-black">AngelCare Email-OS</div>
            <div className="text-xs text-slate-500">Workspace execution</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button key={item.key} onClick={() => setView(item.key)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input placeholder="Search workspace..." className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
          </div>
          <Button onClick={() => setView("health")}><Settings className="h-4 w-4" /> Health</Button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {view === "threads" ? <ThreadsSplitPane toast={toast} /> :
            view === "compose" ? <ComposePanel toast={toast} /> :
            view === "health" ? <HealthPanel /> :
            <EntityManager entity={view} toast={toast} />}
        </main>
      </div>

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black shadow-2xl">
          {toastMessage}
        </div>
      ) : null}
    </div>
  )
}
