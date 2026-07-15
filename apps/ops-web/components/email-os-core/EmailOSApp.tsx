"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Archive, CheckCircle2, Edit3, FileText, Folder, Inbox, Mail, Plus, RefreshCw, Save, Search, Send, Settings, Trash2, Zap } from "lucide-react"

type Entity = "mailboxes" | "templates" | "threads" | "drafts" | "queue" | "audit" | "automation"
type View = Entity | "compose" | "health"

const configs: Record<Entity, { title: string; icon: any; primary: string; fields: Array<{ key: string; label: string; textarea?: boolean; checkbox?: boolean }> }> = {
  mailboxes: { title: "Mailboxes", icon: Folder, primary: "name", fields: [{key:"name",label:"Name"},{key:"address",label:"Email address"},{key:"provider",label:"Provider"},{key:"status",label:"Status"},{key:"owner",label:"Owner"}] },
  templates: { title: "Templates", icon: FileText, primary: "name", fields: [{key:"name",label:"Name"},{key:"subject",label:"Subject"},{key:"category",label:"Category"},{key:"body",label:"Body",textarea:true}] },
  threads: { title: "Threads", icon: Inbox, primary: "subject", fields: [{key:"mailboxId",label:"Mailbox ID"},{key:"fromEmail",label:"From email"},{key:"subject",label:"Subject"},{key:"preview",label:"Preview",textarea:true},{key:"status",label:"Status"},{key:"priority",label:"Priority"},{key:"owner",label:"Owner"}] },
  drafts: { title: "Drafts", icon: Edit3, primary: "subject", fields: [{key:"mailboxId",label:"Mailbox ID"},{key:"toEmail",label:"To email"},{key:"subject",label:"Subject"},{key:"body",label:"Body",textarea:true},{key:"status",label:"Status"}] },
  queue: { title: "Outbox Queue", icon: Archive, primary: "type", fields: [{key:"type",label:"Type"},{key:"status",label:"Status"},{key:"scheduledAt",label:"Scheduled at"}] },
  audit: { title: "Audit", icon: CheckCircle2, primary: "action", fields: [{key:"action",label:"Action"},{key:"targetType",label:"Target type"},{key:"targetId",label:"Target ID"},{key:"severity",label:"Severity"}] },
  automation: { title: "Automation", icon: Zap, primary: "name", fields: [{key:"name",label:"Name"},{key:"trigger",label:"Trigger"},{key:"action",label:"Action"},{key:"enabled",label:"Enabled",checkbox:true}] }
}

const nav: Array<{ key: View; label: string; icon: any }> = [
  { key:"mailboxes", label:"Mailboxes", icon:Folder },
  { key:"threads", label:"Threads", icon:Inbox },
  { key:"compose", label:"Compose", icon:Send },
  { key:"templates", label:"Templates", icon:FileText },
  { key:"automation", label:"Automation", icon:Zap },
  { key:"drafts", label:"Drafts", icon:Edit3 },
  { key:"queue", label:"Outbox", icon:Archive },
  { key:"audit", label:"Audit", icon:CheckCircle2 },
  { key:"health", label:"Health", icon:Activity }
]

async function api<T>(path: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  const json = await res.json().catch(() => null)
  if (!res.ok) return { ok:false, error: json?.error || `HTTP ${res.status}` }
  return { ok:true, data: json?.data ?? json }
}

function Button({ children, onClick, danger=false, primary=false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; primary?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${primary ? "bg-slate-950 text-white hover:bg-slate-800" : danger ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{children}</button>
}

function EntityView({ entity }: { entity: Entity }) {
  const cfg = configs[entity]
  const Icon = cfg.icon
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  async function load() {
    setLoading(true); setError("")
    const r = await api<any[]>(`/api/email-os/entities/${entity}`)
    if (r.ok) setRows(r.data || [])
    else setError(r.error || "Load failed")
    setLoading(false)
  }

  useEffect(() => { load() }, [entity])

  function create() {
    const next: Record<string, any> = {}
    cfg.fields.forEach(f => next[f.key] = f.checkbox ? true : "")
    if (entity === "mailboxes") Object.assign(next, { provider:"smtp_imap", status:"active", owner:"operations" })
    if (entity === "threads") Object.assign(next, { status:"open", priority:"normal" })
    if (entity === "drafts") next.status = "draft"
    if (entity === "queue") Object.assign(next, { type:"send", status:"queued" })
    if (entity === "audit") next.severity = "info"
    setEditing(null); setForm(next); setOpen(true)
  }

  function edit(row: any) { setEditing(row); setForm({ ...row }); setOpen(true) }

  async function save() {
    const path = editing ? `/api/email-os/entities/${entity}/${editing.id}` : `/api/email-os/entities/${entity}`
    const r = await api(path, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) })
    setToast(r.ok ? "Saved" : (r.error || "Save failed"))
    if (r.ok) { setOpen(false); await load() }
    setTimeout(() => setToast(""), 2500)
  }

  async function remove(row: any) {
    const r = await api(`/api/email-os/entities/${entity}/${row.id}`, { method:"DELETE" })
    setToast(r.ok ? "Deleted" : (r.error || "Delete failed"))
    if (r.ok) setRows(rows.filter(x => x.id !== row.id))
    setTimeout(() => setToast(""), 2500)
  }

  async function run(row: any) {
    const r = await api("/api/email-os/entities/audit", { method:"POST", body: JSON.stringify({ action:`${entity}.run`, targetType:entity, targetId:row.id, severity:"info" }) })
    setToast(r.ok ? "Action logged" : (r.error || "Action failed"))
    setTimeout(() => setToast(""), 2500)
  }

  const cols = useMemo(() => Array.from(new Set(rows.flatMap(r => Object.keys(r)).filter(k => !["body","details","payload"].includes(k)))).slice(0,5), [rows])

  return <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div><div><h1 className="text-2xl font-black">{cfg.title}</h1><p className="mt-1 text-sm text-slate-500">Live DB-backed workspace. No seeded demo rows.</p>{error && <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>}</div></div>
        <div className="flex gap-2"><Button onClick={load}><RefreshCw className="h-4 w-4" />Refresh</Button><Button primary onClick={create}><Plus className="h-4 w-4" />New</Button></div>
      </div>
    </section>

    {loading ? <div className="rounded-3xl border bg-white p-8 text-sm font-bold text-slate-500">Loading...</div> :
      rows.length === 0 ? <div className="flex min-h-[340px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><AlertTriangle className="h-8 w-8 text-slate-400" /><h2 className="mt-4 text-lg font-black">No records yet</h2><p className="mt-2 text-sm text-slate-500">Create your first real record.</p><div className="mt-4"><Button primary onClick={create}><Plus className="h-4 w-4" />Create</Button></div></div> :
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">{rows.map(row => <div key={row.id} className="grid grid-cols-[minmax(240px,1fr)_repeat(3,minmax(110px,160px))_230px] items-center gap-2 p-4">
          <div><div className="font-bold">{String(row[cfg.primary] || row.name || row.subject || row.action || row.type || row.id)}</div><div className="text-xs text-slate-500">{row.id}</div></div>
          {cols.slice(1,4).map(c => <div key={c} className="truncate text-sm text-slate-600">{typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c] ?? "")}</div>)}
          {Array.from({length: Math.max(0, 3 - cols.slice(1,4).length)}).map((_,i)=><div key={i}/>)}
          <div className="flex justify-end gap-2"><Button onClick={() => run(row)}>Run</Button><Button onClick={() => edit(row)}><Edit3 className="h-4 w-4" /></Button><Button danger onClick={() => remove(row)}><Trash2 className="h-4 w-4" /></Button></div>
        </div>)}</div>
      </section>}

    {open && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30"><div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-black">{editing ? "Edit" : "Create"} {cfg.title}</h2></div><Button onClick={() => setOpen(false)}>Close</Button></div>
      <div className="space-y-4 p-5">{cfg.fields.map(f => <label key={f.key} className="block"><span className="text-sm font-bold">{f.label}</span>{f.textarea ? <textarea value={form[f.key] || ""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="mt-2 min-h-32 w-full rounded-2xl border p-3 text-sm outline-none" /> : f.checkbox ? <div className="mt-3"><input type="checkbox" checked={Boolean(form[f.key])} onChange={e=>setForm({...form,[f.key]:e.target.checked})} className="h-4 w-4 cursor-pointer" /></div> : <input value={form[f.key] || ""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="mt-2 h-11 w-full rounded-2xl border px-3 text-sm outline-none" />}</label>)}<div className="flex justify-end gap-2 pt-4"><Button onClick={() => setOpen(false)}>Cancel</Button><Button primary onClick={save}><Save className="h-4 w-4" />Save</Button></div></div>
    </div></div>}

    {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border bg-white px-4 py-3 text-sm font-black shadow-2xl">{toast}</div>}
  </div>
}

function ComposeView() {
  const [form, setForm] = useState({ toEmail:"", subject:"", body:"" })
  const [status, setStatus] = useState("Ready")
  async function send() { const r = await api("/api/email-os/send", { method:"POST", body:JSON.stringify(form) }); setStatus(r.ok ? "Sent or queued" : (r.error || "Failed")) }
  async function draft() { const r = await api("/api/email-os/entities/drafts", { method:"POST", body:JSON.stringify({ ...form, status:"draft" }) }); setStatus(r.ok ? "Draft saved" : (r.error || "Failed")) }
  return <section className="rounded-3xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h1 className="text-2xl font-black">Compose</h1><p className="text-sm text-slate-500">SMTP sends; missing SMTP queues safely.</p></div><span className="rounded-full border px-3 py-1 text-xs font-black">{status}</span></div><div className="space-y-4 p-5"><input placeholder="To" value={form.toEmail} onChange={e=>setForm({...form,toEmail:e.target.value})} className="h-11 w-full rounded-2xl border px-3 text-sm outline-none"/><input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="h-11 w-full rounded-2xl border px-3 text-sm outline-none"/><textarea placeholder="Body" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} className="min-h-[360px] w-full rounded-2xl border p-3 text-sm outline-none"/><div className="flex gap-2"><Button primary onClick={send}><Send className="h-4 w-4"/>Send / Queue</Button><Button onClick={draft}><Save className="h-4 w-4"/>Save Draft</Button></div></div></section>
}

function HealthView() {
  const [data, setData] = useState<any>({})
  async function load(){ const r = await api<any>("/api/email-os/health"); setData(r.data?.data || r.data || {}) }
  useEffect(()=>{load()},[])
  return <div className="space-y-6"><section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex justify-between"><div><h1 className="text-2xl font-black">Health</h1><p className="text-sm text-slate-500">Real environment status.</p></div><Button onClick={load}><RefreshCw className="h-4 w-4"/>Refresh</Button></div></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Object.entries(data).map(([k,v])=><div key={k} className="rounded-3xl border bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-400">{k}</div><div className={`mt-3 font-black ${v ? "text-emerald-700" : "text-amber-700"}`}>{v ? "Configured" : "Missing"}</div></div>)}</section></div>
}

export default function EmailOSApp() {
  const [view, setView] = useState<View>("mailboxes")
  return <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-950">
    <aside className="hidden w-[290px] border-r bg-white lg:flex lg:flex-col"><div className="flex h-16 items-center gap-3 border-b px-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><Mail className="h-5 w-5"/></div><div><div className="text-sm font-black">AngelCare Email-OS</div><div className="text-xs text-slate-500">Clean production core</div></div></div><nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(item=>{const Icon=item.icon; const active=view===item.key; return <button key={item.key} onClick={()=>setView(item.key)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4"/>{item.label}</button>})}</nav></aside>
    <div className="flex min-w-0 flex-1 flex-col"><header className="flex h-16 items-center gap-3 border-b bg-white px-4"><div className="flex min-w-0 flex-1 items-center rounded-2xl border bg-slate-50 px-3"><Search className="h-4 w-4 text-slate-400"/><input placeholder="Search workspace..." className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"/></div><Button onClick={()=>setView("health")}><Settings className="h-4 w-4"/>Health</Button></header><main className="min-h-0 flex-1 overflow-y-auto p-6">{view==="compose" ? <ComposeView/> : view==="health" ? <HealthView/> : <EntityView entity={view}/>}</main></div>
  </div>
}
