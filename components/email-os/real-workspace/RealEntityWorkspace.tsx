"use client"

import { useEffect, useMemo, useState } from "react"
import { realEmailOSRequest } from "@/lib/email-os/real/client"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Zap
} from "lucide-react"

type Entity =
  | "mailboxes"
  | "templates"
  | "automation"
  | "approvals"
  | "outbox"
  | "audit"
  | "runtime-events"

const configs: Record<Entity, {
  title: string
  subtitle: string
  icon: any
  fields: Array<{ key: string; label: string; type?: "text" | "textarea" | "checkbox" }>
  primaryField: string
}> = {
  mailboxes: {
    title: "Mailbox Administration",
    subtitle: "Real mailbox registry loaded from database. Create, edit, delete and sync operational mailboxes.",
    icon: Folder,
    primaryField: "name",
    fields: [
      { key: "name", label: "Mailbox name" },
      { key: "address", label: "Email address" },
      { key: "provider", label: "Provider" },
      { key: "status", label: "Status" },
      { key: "ownerRole", label: "Owner role" }
    ]
  },
  templates: {
    title: "Template Library",
    subtitle: "Real template records. Create, edit, delete and use corporate response templates.",
    icon: FileText,
    primaryField: "name",
    fields: [
      { key: "name", label: "Template name" },
      { key: "subject", label: "Subject" },
      { key: "category", label: "Category" },
      { key: "body", label: "Body", type: "textarea" }
    ]
  },
  automation: {
    title: "Automation Rules",
    subtitle: "Real automation rule records. Define trigger/action logic and enable or disable rules.",
    icon: Zap,
    primaryField: "name",
    fields: [
      { key: "name", label: "Rule name" },
      { key: "trigger", label: "Trigger" },
      { key: "action", label: "Action" },
      { key: "enabled", label: "Enabled", type: "checkbox" }
    ]
  },
  approvals: {
    title: "Approval Decisions",
    subtitle: "Real approval decision log. Approve/reject records are persisted to database.",
    icon: ShieldCheck,
    primaryField: "targetId",
    fields: [
      { key: "targetId", label: "Target ID" },
      { key: "targetType", label: "Target type" },
      { key: "decision", label: "Decision" },
      { key: "reason", label: "Reason", type: "textarea" }
    ]
  },
  outbox: {
    title: "Outbox & Queue",
    subtitle: "Real queue jobs. Retry, inspect and create delivery jobs.",
    icon: Send,
    primaryField: "type",
    fields: [
      { key: "type", label: "Job type" },
      { key: "status", label: "Status" },
      { key: "scheduledAt", label: "Scheduled at" }
    ]
  },
  audit: {
    title: "Audit Timeline",
    subtitle: "Real audit events. No placeholder timeline.",
    icon: CheckCircle2,
    primaryField: "action",
    fields: [
      { key: "action", label: "Action" },
      { key: "severity", label: "Severity" },
      { key: "mailboxId", label: "Mailbox ID" },
      { key: "threadId", label: "Thread ID" }
    ]
  },
  "runtime-events": {
    title: "Runtime Events",
    subtitle: "Real runtime events. Worker and action events appear here.",
    icon: Activity,
    primaryField: "type",
    fields: [
      { key: "type", label: "Event type" },
      { key: "mailboxId", label: "Mailbox ID" },
      { key: "threadId", label: "Thread ID" }
    ]
  }
}

function Button({ children, onClick, kind = "secondary" }: { children: React.ReactNode; onClick?: () => void; kind?: "primary" | "secondary" | "danger" }) {
  const cls = kind === "primary"
    ? "bg-slate-950 text-white hover:bg-slate-800"
    : kind === "danger"
      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"

  return (
    <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold shadow-sm ${cls}`}>
      {children}
    </button>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-950">No live records yet</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        This workspace is connected to the database. Create your first record to start operating with real data.
      </p>
      <div className="mt-5">
        <Button kind="primary" onClick={onCreate}><Plus className="h-4 w-4" /> Create first record</Button>
      </div>
    </div>
  )
}

export default function RealEntityWorkspace({ entity }: { entity: Entity }) {
  const config = configs[entity]
  const Icon = config.icon
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [toast, setToast] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const result = await realEmailOSRequest<any[]>(`/api/email-os/real/${entity}`)
    if (result.ok) setRecords(result.data || [])
    else setError(result.error || "Failed to load")
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [entity])

  function openCreate() {
    setEditing(null)
    const initial: Record<string, any> = {}
    config.fields.forEach((field) => {
      initial[field.key] = field.type === "checkbox" ? true : ""
    })
    if (entity === "mailboxes") {
      initial.provider = "smtp_imap"
      initial.status = "active"
    }
    if (entity === "outbox") {
      initial.type = "send"
      initial.status = "queued"
    }
    if (entity === "audit") initial.severity = "info"
    if (entity === "approvals") initial.decision = "pending"
    setForm(initial)
    setDrawerOpen(true)
  }

  function openEdit(record: any) {
    setEditing(record)
    setForm({ ...record })
    setDrawerOpen(true)
  }

  async function save() {
    const path = editing?.id
      ? `/api/email-os/real/${entity}/${editing.id}`
      : `/api/email-os/real/${entity}`

    const result = await realEmailOSRequest(path, {
      method: editing?.id ? "PATCH" : "POST",
      body: JSON.stringify(form)
    })

    if (result.ok) {
      setToast(editing?.id ? "Updated successfully" : "Created successfully")
      setDrawerOpen(false)
      await load()
      window.setTimeout(() => setToast(null), 2500)
    } else {
      setToast(result.error || "Save failed")
    }
  }

  async function remove(record: any) {
    const result = await realEmailOSRequest(`/api/email-os/real/${entity}/${record.id}`, { method: "DELETE" })
    if (result.ok) {
      setToast("Deleted successfully")
      setRecords(records.filter((item) => item.id !== record.id))
      window.setTimeout(() => setToast(null), 2500)
    } else {
      setToast(result.error || "Delete failed")
    }
  }

  async function execute(record: any) {
    if (entity === "mailboxes") {
      await realEmailOSRequest("/api/email-os/actions/execute", {
        method: "POST",
        body: JSON.stringify({ action: "sync.mailbox", payload: { mailboxId: record.id } })
      })
      setToast("Mailbox sync queued")
    } else if (entity === "outbox") {
      await realEmailOSRequest("/api/email-os/actions/execute", {
        method: "POST",
        body: JSON.stringify({ action: "queue.retry", payload: { data: { jobId: record.id } } })
      })
      setToast("Retry queued")
    } else if (entity === "templates") {
      await realEmailOSRequest("/api/email-os/actions/execute", {
        method: "POST",
        body: JSON.stringify({ action: "compose.saveDraft", payload: { subject: record.subject, text: record.body } })
      })
      setToast("Draft created from template")
    } else {
      await realEmailOSRequest("/api/email-os/real/runtime-events", {
        method: "POST",
        body: JSON.stringify({ type: `${entity}.execute`, payload: record })
      })
      setToast("Execution event logged")
    }
    window.setTimeout(() => setToast(null), 2500)
  }

  const columns = useMemo(() => {
    const keys = new Set<string>()
    records.slice(0, 5).forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (!["body", "payload", "details"].includes(key)) keys.add(key)
      })
    })
    return Array.from(keys).slice(0, 5)
  }, [records])

  return (
    <div className="relative min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">{config.title}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{config.subtitle}</p>
                {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
              <Button kind="primary" onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading live records...</div>
        ) : records.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(120px,180px))_220px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
              <div>Primary</div>
              {columns.slice(1, 5).map((column) => <div key={column}>{column}</div>)}
              {Array.from({ length: Math.max(0, 4 - columns.slice(1, 5).length) }).map((_, i) => <div key={i} />)}
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div key={record.id} className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(120px,180px))_220px] items-center gap-2 px-5 py-4">
                  <div>
                    <div className="font-bold text-slate-950">
                      {String(record[config.primaryField] || record.name || record.action || record.type || record.id)}
                    </div>
                    <div className="text-xs text-slate-500">{record.id}</div>
                  </div>
                  {columns.slice(1, 5).map((column) => (
                    <div key={column} className="truncate text-sm text-slate-600">
                      {typeof record[column] === "object" ? JSON.stringify(record[column]) : String(record[column] ?? "")}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - columns.slice(1, 5).length) }).map((_, i) => <div key={i} />)}
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => execute(record)}><MoreHorizontal className="h-4 w-4" /> Run</Button>
                    <Button onClick={() => openEdit(record)}><Edit3 className="h-4 w-4" /></Button>
                    <Button kind="danger" onClick={() => remove(record)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xl">
          {toast}
        </div>
      ) : null}

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/20">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">{editing ? "Edit record" : "Create record"}</h2>
                <p className="text-sm text-slate-500">{config.title}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">Close</button>
            </div>

            <div className="space-y-4 p-5">
              {config.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-bold text-slate-700">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.key] || ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
                    />
                  ) : field.type === "checkbox" ? (
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.key])}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                      />
                    </div>
                  ) : (
                    <input
                      value={form[field.key] || ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                  )}
                </label>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
                <Button kind="primary" onClick={save}><Save className="h-4 w-4" /> Save</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
