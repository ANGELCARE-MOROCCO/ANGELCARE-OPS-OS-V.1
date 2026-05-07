"use client"

import * as React from "react"
import Link from "next/link"

export type CampaignStatus = "draft" | "planning" | "ready" | "active" | "paused" | "scaling" | "completed" | "archived"
export type CampaignPriority = "Low" | "Medium" | "High" | "Critical"

export type Campaign = {
  id: string
  title: string
  objective: string
  audience: string
  offer: string
  channel: string
  owner: string
  priority: CampaignPriority
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: number
  spend: number
  leads: number
  conversions: number
  revenue: number
  brandScore: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type CampaignTask = {
  id: string
  campaignId: string
  title: string
  owner: string
  dueDate: string
  status: "todo" | "in-progress" | "done" | "blocked"
  priority: CampaignPriority
  notes: string
}

export type BudgetLine = {
  id: string
  campaignId: string
  channel: string
  allocation: number
  spent: number
  owner: string
  notes: string
}

export type RiskItem = {
  id: string
  campaignId: string
  title: string
  severity: CampaignPriority
  owner: string
  mitigation: string
  status: "open" | "monitoring" | "resolved"
}

export type AssetItem = {
  id: string
  campaignId: string
  title: string
  type: "Creative" | "Landing page" | "Copy" | "Brief" | "Video" | "WhatsApp script"
  owner: string
  status: "draft" | "review" | "approved" | "rework"
  link: string
}

export type ApprovalItem = {
  id: string
  campaignId: string
  title: string
  approver: string
  status: "pending" | "approved" | "rejected"
  decisionNote: string
}

export type CalendarItem = {
  id: string
  campaignId: string
  title: string
  date: string
  type: "launch" | "review" | "publishing" | "optimization" | "meeting"
  owner: string
}

export type LogEntry = { id: string; at: string; action: string; detail: string }
export type CampaignStore = {
  campaigns: Campaign[]
  tasks: CampaignTask[]
  budgets: BudgetLine[]
  risks: RiskItem[]
  assets: AssetItem[]
  approvals: ApprovalItem[]
  calendar: CalendarItem[]
  logs: LogEntry[]
}

const STORAGE_KEY = "angelcare_market_os_campaign_backoffice_v5"
const channels = ["Meta Ads", "Google Ads", "SEO", "WhatsApp", "Ambassadors", "Partnership", "Email", "Clinic network"]
const statuses: CampaignStatus[] = ["draft", "planning", "ready", "active", "paused", "scaling", "completed", "archived"]
const priorities: CampaignPriority[] = ["Low", "Medium", "High", "Critical"]

function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}
function today(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) }
function money(n: number) { return `${Math.round(n || 0).toLocaleString()} MAD` }
function pct(n: number) { return `${Math.max(0, Math.min(999, Math.round(n || 0)))}%` }
function label(s: string) { return s.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") }
function cls(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(" ") }
function conversionRate(c: Campaign) { return c.leads ? (c.conversions / c.leads) * 100 : 0 }
function roi(c: Campaign) { return c.spend ? ((c.revenue - c.spend) / c.spend) * 100 : 0 }
function cac(c: Campaign) { return c.conversions ? c.spend / c.conversions : 0 }
function burn(c: Campaign) { return c.budget ? (c.spend / c.budget) * 100 : 0 }
function statusTone(status: string) {
  if (["active", "scaling", "approved", "done", "resolved", "published"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (["ready", "planning", "review", "pending", "monitoring", "in-progress"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-700"
  if (["paused", "blocked", "rework", "rejected"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
function priorityTone(priority: string) {
  if (priority === "Critical") return "border-rose-200 bg-rose-50 text-rose-700"
  if (priority === "High") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function defaultStore(): CampaignStore {
  const c1: Campaign = {
    id: "camp-mothers-care-rabat",
    title: "Rabat Mothers Care Growth Sprint",
    objective: "Acquire qualified family leads for maternal and home-care services in Rabat/Temara.",
    audience: "Mothers, families, clinic partners and postpartum communities",
    offer: "Free needs assessment + priority onboarding call",
    channel: "Meta Ads",
    owner: "Marketing Director",
    priority: "Critical",
    status: "active",
    startDate: today(-7),
    endDate: today(21),
    budget: 50000,
    spend: 18500,
    leads: 348,
    conversions: 41,
    revenue: 128000,
    brandScore: 91,
    notes: "Dominance campaign focused on high-intent family acquisition and ambassador-assisted proof.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const c2: Campaign = {
    id: "camp-clinic-partner-casa",
    title: "Casablanca Clinic Partner Referral Engine",
    objective: "Build predictable partner referrals from clinics and medical offices.",
    audience: "Clinic managers, pediatricians, maternity partners, family doctors",
    offer: "Partner onboarding pack + preferred patient coordination",
    channel: "Partnership",
    owner: "Growth Manager",
    priority: "High",
    status: "planning",
    startDate: today(3),
    endDate: today(40),
    budget: 35000,
    spend: 4200,
    leads: 68,
    conversions: 7,
    revenue: 34000,
    brandScore: 86,
    notes: "Strategic B2B referral campaign requiring content assets, partner brief, and approval gate.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return {
    campaigns: [c1, c2],
    tasks: [
      { id: "task-1", campaignId: c1.id, title: "Validate Meta creative set A/B", owner: "Content Lead", dueDate: today(1), status: "in-progress", priority: "High", notes: "Compare caregiver trust message vs urgent family support message." },
      { id: "task-2", campaignId: c1.id, title: "Prepare ambassador WhatsApp proof script", owner: "Ambassador Lead", dueDate: today(2), status: "todo", priority: "Critical", notes: "Must use approved tone and capture qualified lead source." },
      { id: "task-3", campaignId: c2.id, title: "Create clinic partner one-page brief", owner: "Brand Manager", dueDate: today(5), status: "todo", priority: "High", notes: "Include service promise, patient handoff, and contact flow." },
    ],
    budgets: [
      { id: "budget-1", campaignId: c1.id, channel: "Meta Ads", allocation: 30000, spent: 15000, owner: "Paid Media", notes: "Primary acquisition budget." },
      { id: "budget-2", campaignId: c1.id, channel: "Ambassadors", allocation: 10000, spent: 2500, owner: "Ambassador Lead", notes: "Community referral support." },
      { id: "budget-3", campaignId: c2.id, channel: "Partnership", allocation: 20000, spent: 4200, owner: "Partnership Manager", notes: "Clinic outreach and materials." },
    ],
    risks: [
      { id: "risk-1", campaignId: c1.id, title: "Lead quality drops if ambassadors use unapproved scripts", severity: "High", owner: "Brand Manager", mitigation: "Require approved WhatsApp script and proof screenshot before reward.", status: "monitoring" },
      { id: "risk-2", campaignId: c2.id, title: "Clinic response cycle too slow", severity: "Medium", owner: "Growth Manager", mitigation: "Use direct manager calls and short partner summary.", status: "open" },
    ],
    assets: [
      { id: "asset-1", campaignId: c1.id, title: "Mothers care creative pack", type: "Creative", owner: "Designer", status: "approved", link: "" },
      { id: "asset-2", campaignId: c2.id, title: "Clinic partner brief", type: "Brief", owner: "Brand Manager", status: "draft", link: "" },
    ],
    approvals: [
      { id: "approval-1", campaignId: c1.id, title: "Launch message approval", approver: "CEO", status: "approved", decisionNote: "Approved with family-trust wording." },
      { id: "approval-2", campaignId: c2.id, title: "Partner outreach approval", approver: "Marketing Director", status: "pending", decisionNote: "Waiting for final compliance review." },
    ],
    calendar: [
      { id: "cal-1", campaignId: c1.id, title: "Performance review", date: today(2), type: "review", owner: "Marketing Director" },
      { id: "cal-2", campaignId: c2.id, title: "Partner campaign launch", date: today(3), type: "launch", owner: "Growth Manager" },
    ],
    logs: [{ id: uid("log"), at: new Date().toISOString(), action: "Workspace initialized", detail: "Campaign Lifecycle Backoffice store loaded." }],
  }
}

function readStore(): CampaignStore {
  if (typeof window === "undefined") return defaultStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = defaultStore()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    return { ...defaultStore(), ...parsed }
  } catch { return defaultStore() }
}
function saveStore(store: CampaignStore) { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) }

function useCampaignStore() {
  const [store, setStore] = React.useState<CampaignStore>(() => defaultStore())
  React.useEffect(() => setStore(readStore()), [])
  const commit = React.useCallback((updater: (draft: CampaignStore) => void, action: string, detail: string) => {
    setStore(current => {
      const draft: CampaignStore = JSON.parse(JSON.stringify(current))
      updater(draft)
      draft.logs = [{ id: uid("log"), at: new Date().toISOString(), action, detail }, ...(draft.logs || [])].slice(0, 80)
      saveStore(draft)
      return draft
    })
  }, [])
  const reset = React.useCallback(() => { const seed = defaultStore(); saveStore(seed); setStore(seed) }, [])
  return { store, commit, reset }
}

function Button({ href, children, onClick, kind = "soft" }: { href?: string; children: React.ReactNode; onClick?: () => void; kind?: "primary" | "dark" | "soft" | "danger" }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5"
  const styles = kind === "primary" ? "bg-emerald-600 text-white shadow-emerald-100" : kind === "dark" ? "bg-slate-950 text-white" : kind === "danger" ? "bg-rose-600 text-white" : "border border-slate-200 bg-white text-slate-800"
  if (href) return <Link href={href} className={cls(base, styles)}>{children}</Link>
  return <button type={onClick ? "button" : "submit"} onClick={onClick} className={cls(base, styles)}>{children}</button>
}
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={cls("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</section> }
function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "status" | "priority" }) { return <span className={cls("inline-flex rounded-full border px-3 py-1 text-xs font-black", tone === "priority" ? priorityTone(String(children)) : tone === "status" ? statusTone(String(children)) : "border-slate-200 bg-slate-50 text-slate-700")}>{children}</span> }
function Header({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) { return <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Campaign Lifecycle</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p></div><div className="flex flex-wrap gap-2">{children}</div></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>{children}</label> }
const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 text-slate-950"><div className="mx-auto max-w-[1850px] space-y-6 p-4 lg:p-8">{children}</div></main>
}
function findCampaign(store: CampaignStore, id: string) { return store.campaigns.find(c => c.id === id) || store.campaigns[0] }
function campaignLinks(id: string) {
  return [
    ["Overview", `/market-os/campaign-lifecycle/${id}`],
    ["Edit", `/market-os/campaign-lifecycle/${id}/edit`],
    ["Tasks", `/market-os/campaign-lifecycle/${id}/tasks`],
    ["Budget", `/market-os/campaign-lifecycle/${id}/budget`],
    ["Launch", `/market-os/campaign-lifecycle/${id}/launch-control`],
    ["Performance", `/market-os/campaign-lifecycle/${id}/performance`],
    ["Calendar", `/market-os/campaign-lifecycle/${id}/calendar`],
    ["Risks", `/market-os/campaign-lifecycle/${id}/risks`],
    ["Assets", `/market-os/campaign-lifecycle/${id}/assets`],
    ["Approvals", `/market-os/campaign-lifecycle/${id}/approvals`],
    ["Content Plan", `/market-os/campaign-lifecycle/${id}/content-plan`],
    ["Delete", `/market-os/campaign-lifecycle/${id}/delete`],
  ]
}
function CampaignNav({ id }: { id: string }) { return <Panel className="p-3"><div className="flex flex-wrap gap-2">{campaignLinks(id).map(([label, href]) => <Link key={href} href={href} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">{label}</Link>)}</div></Panel> }
function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{note}</p></div> }

function CampaignForm({ initial, onSave, mode }: { initial?: Campaign; mode: "create" | "edit"; onSave: (campaign: Campaign) => void }) {
  const [form, setForm] = React.useState<Campaign>(() => initial || { id: uid("camp"), title: "", objective: "", audience: "", offer: "", channel: "Meta Ads", owner: "Marketing Director", priority: "High", status: "draft", startDate: today(0), endDate: today(30), budget: 0, spend: 0, leads: 0, conversions: 0, revenue: 0, brandScore: 80, notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  return <form onSubmit={e => { e.preventDefault(); onSave({ ...form, updatedAt: new Date().toISOString() }) }} className="grid gap-4">
    <Field label="Campaign title"><input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Owner"><input className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></Field><Field label="Channel"><select className={inputClass} value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>{channels.map(c => <option key={c}>{c}</option>)}</select></Field></div>
    <div className="grid gap-4 md:grid-cols-3"><Field label="Status"><select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CampaignStatus })}>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field><Field label="Priority"><select className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as CampaignPriority })}>{priorities.map(p => <option key={p}>{p}</option>)}</select></Field><Field label="Brand score"><input type="number" className={inputClass} value={form.brandScore} onChange={e => setForm({ ...form, brandScore: Number(e.target.value) })} /></Field></div>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Start date"><input type="date" className={inputClass} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field><Field label="End date"><input type="date" className={inputClass} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field></div>
    <Field label="Objective"><textarea className={cls(inputClass, "min-h-[100px]")} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} /></Field>
    <div className="grid gap-4 md:grid-cols-2"><Field label="Audience"><textarea className={cls(inputClass, "min-h-[90px]")} value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /></Field><Field label="Offer"><textarea className={cls(inputClass, "min-h-[90px]")} value={form.offer} onChange={e => setForm({ ...form, offer: e.target.value })} /></Field></div>
    <div className="grid gap-4 md:grid-cols-5"><Field label="Budget"><input type="number" className={inputClass} value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} /></Field><Field label="Spend"><input type="number" className={inputClass} value={form.spend} onChange={e => setForm({ ...form, spend: Number(e.target.value) })} /></Field><Field label="Leads"><input type="number" className={inputClass} value={form.leads} onChange={e => setForm({ ...form, leads: Number(e.target.value) })} /></Field><Field label="Conversions"><input type="number" className={inputClass} value={form.conversions} onChange={e => setForm({ ...form, conversions: Number(e.target.value) })} /></Field><Field label="Revenue"><input type="number" className={inputClass} value={form.revenue} onChange={e => setForm({ ...form, revenue: Number(e.target.value) })} /></Field></div>
    <Field label="Management notes"><textarea className={cls(inputClass, "min-h-[120px]")} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
    <div className="flex flex-wrap gap-3"><Button kind="primary">{mode === "create" ? "Create campaign" : "Save campaign"}</Button><Button href="/market-os/campaign-lifecycle">Back to board</Button></div>
  </form>
}

export function MainCampaignBoard() {
  const { store, commit, reset } = useCampaignStore(); const [query, setQuery] = React.useState(""); const [status, setStatus] = React.useState("all")
  const filtered = store.campaigns.filter(c => (`${c.title} ${c.owner} ${c.channel} ${c.objective} ${c.audience}`.toLowerCase().includes(query.toLowerCase())) && (status === "all" || c.status === status))
  const active = store.campaigns.filter(c => ["active", "scaling"].includes(c.status)).length
  const urgent = store.campaigns.filter(c => c.priority === "Critical" || burn(c) > 85).length
  return <Shell>
    <section className="rounded-[2rem] bg-gradient-to-br from-emerald-950 via-slate-950 to-black p-6 text-white shadow-2xl lg:p-8"><div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr]"><div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black">MARKET-OS</span><span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">CAMPAIGN BACKOFFICE</span></div><h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight md:text-6xl">Campaign lifecycle control room for AngelCare growth dominance.</h1><p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-emerald-50/85">Plan, launch, control, optimize and close campaigns across paid media, SEO, content, ambassadors, partners and clinic channels with synced execution layers.</p><div className="mt-7 flex flex-wrap gap-3"><Button href="/market-os/campaign-lifecycle/create" kind="primary">+ New campaign</Button><Button onClick={reset} kind="dark">Reset demo store</Button></div></div><div className="grid gap-3 sm:grid-cols-2"><Metric label="Campaigns" value={store.campaigns.length} note="Total records"/><Metric label="Active" value={active} note="Currently running"/><Metric label="Urgent" value={urgent} note="Critical/budget watch"/><Metric label="Revenue" value={money(store.campaigns.reduce((a,c)=>a+c.revenue,0))} note="Tracked impact"/></div></div></section>
    <Panel><Header title="Campaign portfolio" subtitle="Search, filter, open, edit, delete, launch, budget and optimize every campaign from one controlled surface."><Button href="/market-os/campaign-lifecycle/create" kind="primary">Create</Button></Header><div className="mt-5 grid gap-4 md:grid-cols-3"><input className={inputClass} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search campaign, owner, channel..."/><select className={inputClass} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select><Button onClick={()=>commit(d=>{},"Board reviewed","Campaign board filters reviewed")}>Log review</Button></div><div className="mt-6 grid gap-4 xl:grid-cols-2">{filtered.map(c => <article key={c.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="flex flex-wrap gap-2"><Badge tone="status">{c.status}</Badge><Badge tone="priority">{c.priority}</Badge><Badge>{c.channel}</Badge></div><Link href={`/market-os/campaign-lifecycle/${c.id}`} className="mt-3 block text-2xl font-black text-slate-950 hover:underline">{c.title}</Link><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{c.objective}</p><div className="mt-4 grid gap-3 md:grid-cols-4"><Metric label="Budget" value={money(c.budget)} note={`${pct(burn(c))} burned`}/><Metric label="Leads" value={c.leads} note={`${c.conversions} conv.`}/><Metric label="ROI" value={pct(roi(c))} note={`CAC ${money(cac(c))}`}/><Metric label="Brand" value={c.brandScore} note="score"/></div><div className="mt-4 flex flex-wrap gap-2">{campaignLinks(c.id).slice(0,10).map(([l,h])=><Button key={h} href={h}>{l}</Button>)}</div></article>)}</div></Panel>
    <Panel><Header title="Execution log" subtitle="Every real action writes to this log for traceability." /> <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{store.logs.slice(0,8).map(log=><div key={log.id} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{log.action}</p><p className="mt-2 text-sm font-bold text-slate-700">{log.detail}</p><p className="mt-1 text-xs text-slate-400">{new Date(log.at).toLocaleString()}</p></div>)}</div></Panel>
  </Shell>
}

export function CreateCampaignPage() { const { commit } = useCampaignStore(); const [done,setDone]=React.useState(""); return <Shell><Panel><Header title="Create campaign" subtitle="Create a full AngelCare campaign record with operational objective, channel, budget, owner, audience, offer and KPI baseline." /></Panel><Panel><CampaignForm mode="create" onSave={campaign=>{commit(d=>{d.campaigns=[campaign,...d.campaigns]},"Campaign created", campaign.title); setDone(`Created ${campaign.title}`)}} />{done && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">{done}</p>}</Panel></Shell> }
export function EditCampaignPage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); return <Shell><CampaignNav id={c.id}/><Panel><Header title="Edit campaign" subtitle="Update campaign strategy, status, budget, KPI and executive notes." /></Panel><Panel><CampaignForm mode="edit" initial={c} onSave={campaign=>commit(d=>{d.campaigns=d.campaigns.map(x=>x.id===campaign.id?campaign:x)},"Campaign updated",campaign.title)} /></Panel></Shell> }
export function DeleteCampaignPage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); return <Shell><CampaignNav id={c.id}/><Panel><Header title="Delete / archive campaign" subtitle="Safely archive or fully delete campaign records and related execution objects." /></Panel><Panel><h3 className="text-2xl font-black">{c.title}</h3><p className="mt-2 text-sm font-semibold text-slate-600">Archive keeps the campaign in history. Delete removes campaign, tasks, budget lines, risks, assets, approvals and calendar items from localStorage.</p><div className="mt-5 flex flex-wrap gap-3"><Button kind="dark" onClick={()=>commit(d=>{d.campaigns=d.campaigns.map(x=>x.id===c.id?{...x,status:"archived",updatedAt:new Date().toISOString()}:x)},"Campaign archived",c.title)}>Archive</Button><Button kind="danger" onClick={()=>commit(d=>{d.campaigns=d.campaigns.filter(x=>x.id!==c.id); d.tasks=d.tasks.filter(x=>x.campaignId!==c.id); d.budgets=d.budgets.filter(x=>x.campaignId!==c.id); d.risks=d.risks.filter(x=>x.campaignId!==c.id); d.assets=d.assets.filter(x=>x.campaignId!==c.id); d.approvals=d.approvals.filter(x=>x.campaignId!==c.id); d.calendar=d.calendar.filter(x=>x.campaignId!==c.id)},"Campaign deleted",c.title)}>Delete fully</Button><Button href="/market-os/campaign-lifecycle">Back</Button></div></Panel></Shell> }
export function CampaignOverviewPage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); const tasks=store.tasks.filter(t=>t.campaignId===c.id); const approvals=store.approvals.filter(a=>a.campaignId===c.id); const launchReady = c.budget>0 && tasks.length>0 && approvals.every(a=>a.status==="approved") && c.brandScore>=75; return <Shell><CampaignNav id={c.id}/><Panel><Header title={c.title} subtitle={c.objective}><Button href={`/market-os/campaign-lifecycle/${c.id}/edit`} kind="primary">Edit</Button><Button onClick={()=>commit(d=>{d.campaigns=d.campaigns.map(x=>x.id===c.id?{...x,status:launchReady?"active":"planning",updatedAt:new Date().toISOString()}:x)},launchReady?"Campaign launched":"Launch blocked",launchReady?c.title:"Missing launch gates")}>{launchReady?"Launch":"Check gates"}</Button></Header><div className="mt-4 flex flex-wrap gap-2"><Badge tone="status">{c.status}</Badge><Badge tone="priority">{c.priority}</Badge><Badge>{c.owner}</Badge></div></Panel><div className="grid gap-4 md:grid-cols-4"><Metric label="Budget burn" value={pct(burn(c))} note={`${money(c.spend)} spent`}/><Metric label="Conversion rate" value={pct(conversionRate(c))} note={`${c.conversions}/${c.leads}`}/><Metric label="ROI" value={pct(roi(c))} note="return"/><Metric label="Launch gate" value={launchReady?"Ready":"Blocked"} note="approval/task/budget/brand"/></div><Panel><Header title="Execution layers" subtitle="Open each personalized campaign workspace to complete real work."/><div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">{campaignLinks(c.id).slice(2,11).map(([l,h])=><Link key={h} href={h} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:bg-emerald-50"><p className="text-2xl">⚙️</p><h3 className="mt-3 text-lg font-black">{l}</h3><p className="mt-2 text-sm font-semibold text-slate-500">Open {l.toLowerCase()} execution tools.</p></Link>)}</div></Panel></Shell> }

type CampaignCollection = "tasks" | "budgets" | "risks" | "assets" | "approvals" | "calendar"
function CrudPage<T extends { id: string; campaignId: string }>(props: { id: string; title: string; subtitle: string; collection: CampaignCollection; render: (item:T, update:(item:T)=>void, remove:()=>void)=>React.ReactNode; blank: T; fields: (item:T,set:(item:T)=>void)=>React.ReactNode }) {
  const { store, commit } = useCampaignStore(); const c=findCampaign(store, props.id); const items=(store[props.collection] as unknown as T[]).filter(x=>x.campaignId===c.id); const [form,setForm]=React.useState<T>({...props.blank, id:uid("item"), campaignId:c.id});
  const save = () => commit(d=>{ const arr=d[props.collection] as unknown as T[]; const exists=arr.some(x=>x.id===form.id); (d as any)[props.collection] = exists ? arr.map(x=>x.id===form.id?form:x) : [form,...arr]; }, `${props.title} saved`, c.title)
  return <Shell><CampaignNav id={c.id}/><Panel><Header title={props.title} subtitle={props.subtitle}><Button onClick={()=>setForm({...props.blank,id:uid("item"),campaignId:c.id})}>New</Button><Button onClick={save} kind="primary">Save</Button></Header></Panel><div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><Panel><div className="grid gap-4">{props.fields(form,setForm)}<Button onClick={save} kind="primary">Save record</Button></div></Panel><Panel><div className="space-y-3">{items.map(item=><div key={item.id}>{props.render(item, (next)=>{setForm(next); commit(d=>{const arr=d[props.collection] as unknown as T[]; (d as any)[props.collection]=arr.map(x=>x.id===next.id?next:x)},`${props.title} updated`,c.title)} , ()=>commit(d=>{const arr=d[props.collection] as unknown as T[]; (d as any)[props.collection]=arr.filter(x=>x.id!==item.id)},`${props.title} deleted`,c.title))}</div>)}{items.length===0&&<p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center font-bold text-slate-500">No records yet.</p>}</div></Panel></div></Shell>
}

export function TasksPage({ id }: { id: string }) { return <CrudPage<CampaignTask> id={id} title="Task command board" subtitle="Create, assign, block, complete and track campaign execution tasks." collection="tasks" blank={{id:"",campaignId:id,title:"",owner:"Marketing Ops",dueDate:today(3),status:"todo",priority:"High",notes:""}} fields={(x,set)=><><Field label="Task"><input className={inputClass} value={x.title} onChange={e=>set({...x,title:e.target.value})}/></Field><Field label="Owner"><input className={inputClass} value={x.owner} onChange={e=>set({...x,owner:e.target.value})}/></Field><Field label="Due"><input type="date" className={inputClass} value={x.dueDate} onChange={e=>set({...x,dueDate:e.target.value})}/></Field><Field label="Status"><select className={inputClass} value={x.status} onChange={e=>set({...x,status:e.target.value as CampaignTask['status']})}>{["todo","in-progress","done","blocked"].map(s=><option key={s} value={s}>{label(s)}</option>)}</select></Field><Field label="Notes"><textarea className={inputClass} value={x.notes} onChange={e=>set({...x,notes:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap gap-2"><Badge tone="status">{x.status}</Badge><Badge tone="priority">{x.priority}</Badge></div><h3 className="mt-2 font-black">{x.title}</h3><p className="text-sm font-bold text-slate-500">{x.owner} • {x.dueDate}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,status:"done"})}>Done</Button><Button onClick={()=>update({...x,status:"blocked"})}>Block</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function BudgetPage({ id }: { id: string }) { return <CrudPage<BudgetLine> id={id} title="Budget control" subtitle="Allocate spend by channel, monitor burn and keep campaign finance decisions traceable." collection="budgets" blank={{id:"",campaignId:id,channel:"Meta Ads",allocation:0,spent:0,owner:"Marketing Ops",notes:""}} fields={(x,set)=><><Field label="Channel"><select className={inputClass} value={x.channel} onChange={e=>set({...x,channel:e.target.value})}>{channels.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Allocation"><input type="number" className={inputClass} value={x.allocation} onChange={e=>set({...x,allocation:Number(e.target.value)})}/></Field><Field label="Spent"><input type="number" className={inputClass} value={x.spent} onChange={e=>set({...x,spent:Number(e.target.value)})}/></Field><Field label="Owner"><input className={inputClass} value={x.owner} onChange={e=>set({...x,owner:e.target.value})}/></Field><Field label="Notes"><textarea className={inputClass} value={x.notes} onChange={e=>set({...x,notes:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-black">{x.channel}</h3><p className="text-sm font-bold text-slate-500">{money(x.spent)} / {money(x.allocation)} • {pct(x.allocation ? x.spent/x.allocation*100 : 0)}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,spent:x.spent+1000})}>+1000 spend</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function RisksPage({ id }: { id: string }) { return <CrudPage<RiskItem> id={id} title="Risk command" subtitle="Identify risks, assign mitigation, monitor status and protect campaign outcomes." collection="risks" blank={{id:"",campaignId:id,title:"",severity:"High",owner:"Marketing Director",mitigation:"",status:"open"}} fields={(x,set)=><><Field label="Risk"><input className={inputClass} value={x.title} onChange={e=>set({...x,title:e.target.value})}/></Field><Field label="Severity"><select className={inputClass} value={x.severity} onChange={e=>set({...x,severity:e.target.value as CampaignPriority})}>{priorities.map(p=><option key={p}>{p}</option>)}</select></Field><Field label="Owner"><input className={inputClass} value={x.owner} onChange={e=>set({...x,owner:e.target.value})}/></Field><Field label="Mitigation"><textarea className={inputClass} value={x.mitigation} onChange={e=>set({...x,mitigation:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Badge tone="priority">{x.severity}</Badge><h3 className="mt-2 font-black">{x.title}</h3><p className="text-sm font-bold text-slate-500">{x.owner} • {x.status}</p><p className="mt-2 text-sm text-slate-600">{x.mitigation}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,status:"resolved"})}>Resolve</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function AssetsPage({ id }: { id: string }) { return <CrudPage<AssetItem> id={id} title="Asset control" subtitle="Manage creatives, landing pages, scripts and briefs required before launch." collection="assets" blank={{id:"",campaignId:id,title:"",type:"Creative",owner:"Content Lead",status:"draft",link:""}} fields={(x,set)=><><Field label="Asset"><input className={inputClass} value={x.title} onChange={e=>set({...x,title:e.target.value})}/></Field><Field label="Type"><select className={inputClass} value={x.type} onChange={e=>set({...x,type:e.target.value as AssetItem['type']})}>{["Creative","Landing page","Copy","Brief","Video","WhatsApp script"].map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Owner"><input className={inputClass} value={x.owner} onChange={e=>set({...x,owner:e.target.value})}/></Field><Field label="Link"><input className={inputClass} value={x.link} onChange={e=>set({...x,link:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Badge tone="status">{x.status}</Badge><h3 className="mt-2 font-black">{x.title}</h3><p className="text-sm font-bold text-slate-500">{x.type} • {x.owner}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,status:"approved"})}>Approve</Button><Button onClick={()=>update({...x,status:"rework"})}>Rework</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function ApprovalsPage({ id }: { id: string }) { return <CrudPage<ApprovalItem> id={id} title="Approval gate" subtitle="Control CEO, brand, budget, launch and compliance approvals before campaign execution." collection="approvals" blank={{id:"",campaignId:id,title:"",approver:"CEO",status:"pending",decisionNote:""}} fields={(x,set)=><><Field label="Approval"><input className={inputClass} value={x.title} onChange={e=>set({...x,title:e.target.value})}/></Field><Field label="Approver"><input className={inputClass} value={x.approver} onChange={e=>set({...x,approver:e.target.value})}/></Field><Field label="Decision note"><textarea className={inputClass} value={x.decisionNote} onChange={e=>set({...x,decisionNote:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Badge tone="status">{x.status}</Badge><h3 className="mt-2 font-black">{x.title}</h3><p className="text-sm font-bold text-slate-500">{x.approver}</p><p className="mt-2 text-sm text-slate-600">{x.decisionNote}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,status:"approved"})}>Approve</Button><Button onClick={()=>update({...x,status:"rejected"})}>Reject</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function CalendarPage({ id }: { id: string }) { return <CrudPage<CalendarItem> id={id} title="Campaign calendar" subtitle="Plan launch, reviews, optimization, publishing and management checkpoints in a monthly operating view." collection="calendar" blank={{id:"",campaignId:id,title:"",date:today(1),type:"review",owner:"Marketing Ops"}} fields={(x,set)=><><Field label="Event"><input className={inputClass} value={x.title} onChange={e=>set({...x,title:e.target.value})}/></Field><Field label="Date"><input type="date" className={inputClass} value={x.date} onChange={e=>set({...x,date:e.target.value})}/></Field><Field label="Type"><select className={inputClass} value={x.type} onChange={e=>set({...x,type:e.target.value as CalendarItem['type']})}>{["launch","review","publishing","optimization","meeting"].map(t=><option key={t}>{label(t)}</option>)}</select></Field><Field label="Owner"><input className={inputClass} value={x.owner} onChange={e=>set({...x,owner:e.target.value})}/></Field></>} render={(x,update,remove)=><article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Badge>{label(x.type)}</Badge><h3 className="mt-2 font-black">{x.title}</h3><p className="text-sm font-bold text-slate-500">{x.date} • {x.owner}</p><div className="mt-3 flex gap-2"><Button onClick={()=>update({...x,date:today(7)})}>Move +7d</Button><Button onClick={remove} kind="danger">Delete</Button></div></article>} /> }
export function PerformancePage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); return <Shell><CampaignNav id={c.id}/><Panel><Header title="Performance command" subtitle="Update KPI inputs and let the workspace calculate CAC, ROI, conversion rate and budget burn." /></Panel><div className="grid gap-4 md:grid-cols-4"><Metric label="CAC" value={money(cac(c))} note="cost per conversion"/><Metric label="ROI" value={pct(roi(c))} note="return"/><Metric label="Conversion" value={pct(conversionRate(c))} note="lead to customer"/><Metric label="Burn" value={pct(burn(c))} note="budget consumed"/></div><Panel><CampaignForm mode="edit" initial={c} onSave={campaign=>commit(d=>{d.campaigns=d.campaigns.map(x=>x.id===campaign.id?campaign:x)},"Performance updated",campaign.title)} /></Panel></Shell> }
export function LaunchControlPage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); const tasks=store.tasks.filter(t=>t.campaignId===c.id); const approvals=store.approvals.filter(a=>a.campaignId===c.id); const assets=store.assets.filter(a=>a.campaignId===c.id); const checks=[['Budget defined',c.budget>0],['Tasks exist',tasks.length>0],['Assets approved',assets.some(a=>a.status==='approved')],['Approvals clear',approvals.length>0&&approvals.every(a=>a.status==='approved')],['Brand score ≥ 75',c.brandScore>=75]]; const ready=checks.every(([,ok])=>ok); return <Shell><CampaignNav id={c.id}/><Panel><Header title="Launch control" subtitle="Strict pre-launch gate for AngelCare campaigns. Launch is blocked until critical controls are green."><Button kind={ready?"primary":"soft"} onClick={()=>commit(d=>{d.campaigns=d.campaigns.map(x=>x.id===c.id?{...x,status:ready?'active':'planning'}:x)},ready?'Campaign launched':'Launch blocked',c.title)}>{ready?'Launch campaign':'Launch blocked'}</Button></Header></Panel><Panel><div className="grid gap-3 md:grid-cols-2">{checks.map(([name,ok])=><div key={String(name)} className={cls("rounded-2xl border p-4",ok?"border-emerald-200 bg-emerald-50":"border-rose-200 bg-rose-50")}><p className={cls("text-lg font-black",ok?"text-emerald-800":"text-rose-800")}>{ok?'✅':'⛔'} {name}</p></div>)}</div></Panel></Shell> }
export function ContentPlanPage({ id }: { id: string }) { const { store, commit } = useCampaignStore(); const c=findCampaign(store,id); return <Shell><CampaignNav id={c.id}/><Panel><Header title="Content and channel plan" subtitle="Generate and manage campaign execution prompts for Content Command, SEO Blog and Ambassadors." /></Panel><Panel><div className="grid gap-4 md:grid-cols-3"><Button kind="primary" onClick={()=>commit(d=>{d.tasks=[{id:uid('task'),campaignId:c.id,title:'Create campaign content brief',owner:'Content Command',dueDate:today(2),status:'todo',priority:'High',notes:`Brief for ${c.title}`} ,...d.tasks]},'Content brief task created',c.title)}>Create content brief task</Button><Button onClick={()=>commit(d=>{d.tasks=[{id:uid('task'),campaignId:c.id,title:'Prepare SEO/blog support article',owner:'SEO Manager',dueDate:today(5),status:'todo',priority:'Medium',notes:`SEO support for ${c.title}`} ,...d.tasks]},'SEO task created',c.title)}>Create SEO task</Button><Button onClick={()=>commit(d=>{d.tasks=[{id:uid('task'),campaignId:c.id,title:'Assign ambassador activation mission',owner:'Ambassador Lead',dueDate:today(3),status:'todo',priority:'High',notes:`Ambassador mission for ${c.title}`} ,...d.tasks]},'Ambassador task created',c.title)}>Create ambassador task</Button></div></Panel></Shell> }
