"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, AlertTriangle, BadgeCheck, BookOpen, Briefcase, CheckCircle2, ClipboardList, Coins, FileCheck, Flag, GraduationCap, Handshake, Layers3, MapPinned, Megaphone, MessageSquare, Plus, Radar, RefreshCw, ShieldCheck, Sparkles, Target, Users, WalletCards, Zap } from "lucide-react"

type AnyRecord = Record<string, any>
type SuiteConfig = AnyRecord & { basePath: string; moduleName: string; headline: string; description: string; primaryNoun: string; pluralNoun: string; accent: string; badge: string; panels: string[] }

type Store = {
  entities: AnyRecord[]
  programs: AnyRecord[]
  missions: AnyRecord[]
  leads: AnyRecord[]
  payouts: AnyRecord[]
  territories: AnyRecord[]
  library: AnyRecord[]
  training: AnyRecord[]
  approvals: AnyRecord[]
  automations: AnyRecord[]
  communications: AnyRecord[]
  documents: AnyRecord[]
  analytics: AnyRecord[]
  events: AnyRecord[]
}

const statusClass: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Candidate: "bg-blue-50 text-blue-700 border-blue-200",
  Prospect: "bg-blue-50 text-blue-700 border-blue-200",
  Paused: "bg-amber-50 text-amber-700 border-amber-200",
  Suspended: "bg-rose-50 text-rose-700 border-rose-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  UnderReview: "bg-violet-50 text-violet-700 border-violet-200",
  Converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Validated: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Running: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Draft: "bg-slate-50 text-slate-700 border-slate-200",
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  Flagged: "bg-rose-50 text-rose-700 border-rose-200",
  Synced: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

function normalize(config: SuiteConfig): Store {
  return {
    entities: config.entities || [], programs: config.programs || [], missions: config.missions || [], leads: config.leads || [], payouts: config.payouts || [], territories: config.territories || [], library: config.library || [], training: config.training || [],
    approvals: config.approvals || [], automations: config.automations || [], communications: config.communications || [], documents: config.documents || [], analytics: config.analytics || [], events: [],
  }
}
function storageKey(config: SuiteConfig) { return `angelcare:${config.basePath}:execution-store:v2` }
function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) { return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusClass[tone || String(children)] || "border-slate-200 bg-white text-slate-600"}`}>{children}</span> }
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div> }
function fmt(n: number) { return `${Math.round(n).toLocaleString()} MAD` }

function useExecutionStore(config: SuiteConfig) {
  const [store, setStore] = useState<Store>(() => normalize(config))
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey(config)); if (saved) setStore({ ...normalize(config), ...JSON.parse(saved) }) } catch {}
  }, [config.basePath])
  useEffect(() => { try { localStorage.setItem(storageKey(config), JSON.stringify(store)) } catch {} }, [store, config.basePath])
  async function action(actionKey: string, collection: keyof Store, target?: AnyRecord, patch?: AnyRecord) {
    const id = target?.id || `${String(collection).toUpperCase()}-${Date.now()}`
    const event = { id: `EV-${Date.now()}`, at: new Date().toISOString(), actionKey, collection, targetId: id, targetTitle: target?.name || target?.title || target?.source || id, status: "Synced" }
    setStore(prev => {
      const list = [...(prev[collection] || [])]
      const idx = list.findIndex(x => x.id === id)
      if (idx >= 0) list[idx] = { ...list[idx], ...patch, updatedAt: event.at }
      else list.unshift({ id, ...(patch || {}), createdAt: event.at, status: patch?.status || "Draft" })
      return { ...prev, [collection]: list, events: [event, ...(prev.events || [])].slice(0, 25) }
    })
    try {
      const endpoint = `${config.basePath.replace("/market-os", "/api/market-os")}/action`
      await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionKey, collection, targetId: id, patch, event }) })
    } catch {}
  }
  return { store, action }
}

function Hero({ config }: { config: SuiteConfig }) {
  return <section className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.accent} p-8 text-white shadow-xl`}>
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><div><div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest ring-1 ring-white/20">{config.badge}</div><h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">{config.headline}</h1><p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">{config.description}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={`${config.basePath}/programs`} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg">Configure programs</Link><Link href={`${config.basePath}/approvals`} className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-black text-white">Approval desk</Link><Link href={`${config.basePath}/automation`} className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-black text-white">Automation rules</Link></div></div><div className="grid grid-cols-2 gap-3">{config.panels.map((p: string, i: number) => <div key={p} className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15"><p className="text-3xl font-black">{i === 0 ? "360°" : i === 1 ? "20+" : i === 2 ? "AI" : "SLA"}</p><p className="mt-2 text-sm font-bold text-white/75">{p}</p></div>)}</div></div>
  </section>
}
function Metric({ label, value, icon: Icon, note }: { label: string; value: string; icon: any; note: string }) { return <Card><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{note}</p></div><div className="rounded-2xl bg-slate-950 p-3 text-white"><Icon className="h-5 w-5" /></div></div></Card> }
const gateways = [
  ["Profiles", "", Users], ["Programs", "programs", Layers3], ["Missions", "missions", ClipboardList], ["Leads", "leads", Target], ["Approvals", "approvals", FileCheck], ["Payouts", "payouts", WalletCards], ["Territories", "territories", MapPinned], ["Library / Enablement", "content-library", BookOpen], ["Training", "training", GraduationCap], ["Compliance", "compliance", ShieldCheck], ["Automation", "automation", Zap], ["Analytics", "analytics", Radar], ["Communications", "communications", MessageSquare], ["Settings", "settings", Sparkles],
]
function Gateway({ config }: { config: SuiteConfig }) { return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{gateways.map(([title, href, Icon]: any) => { const path = title.includes("Library") && config.basePath.includes("partners") ? "enablement" : href; return <Link key={String(title)} href={path ? `${config.basePath}/${path}` : config.basePath} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-4 flex items-center justify-between"><div className="rounded-2xl bg-slate-100 p-3 text-slate-900"><Icon className="h-5 w-5" /></div><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" /></div><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-500">Open records, validation controls, daily actions, and synchronized execution history.</p></Link> })}</div> }

export function ManagementDashboard({ config }: { config: SuiteConfig }) {
  const { store, action } = useExecutionStore(config)
  const revenue = store.entities.reduce((s, e) => s + Number(e.revenue || 0), 0)
  const leads = store.leads.length || store.entities.reduce((s, e) => s + Number(e.leads || 0), 0)
  const commission = store.payouts.reduce((s, p) => s + Number(p.amount || 0), 0)
  return <main className="space-y-6"><Hero config={config}/><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label={`${config.pluralNoun} controlled`} value={String(store.entities.length)} icon={Users} note="Profiles, status, KYC, manager and risk."/><Metric label="Programs live" value={String(store.programs.length)} icon={Layers3} note="Configurable execution models."/><Metric label="Leads in engine" value={String(leads)} icon={Target} note="Referral attribution and validation."/><Metric label="Payout exposure" value={fmt(commission)} icon={Coins} note="Pending, approved, paid, rejected."/></div><Gateway config={config}/><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Card><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">Live execution command table</h2><Pill tone="Synced">Local + API synced</Pill></div><div className="overflow-hidden rounded-2xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">City</th><th className="p-3">Status</th><th className="p-3">Score</th><th className="p-3">Action</th></tr></thead><tbody>{store.entities.map(e => <tr key={e.id} className="border-t"><td className="p-3 font-black text-slate-900">{e.name}</td><td className="p-3 text-slate-600">{e.type}</td><td className="p-3 text-slate-600">{e.city}</td><td className="p-3"><Pill tone={e.status}>{e.status}</Pill></td><td className="p-3 font-black">{e.score}%</td><td className="p-3"><button onClick={()=>action("activate_profile","entities",e,{status:"Active", score: Math.min(100, Number(e.score || 0)+3)})} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Activate</button></td></tr>)}</tbody></table></div></Card><Card><h2 className="text-xl font-black text-slate-950">Execution event log</h2><div className="mt-4 space-y-3">{(store.events.length ? store.events : [{id:"EV-ready", actionKey:"system_ready", targetTitle:"Execution layer ready", status:"Synced"}]).slice(0,8).map((x:any)=><div key={x.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><CheckCircle2 className="h-5 w-5 text-emerald-600"/><div><p className="font-black text-slate-900">{x.actionKey}</p><p className="text-xs font-semibold text-slate-500">{x.targetTitle} • {x.status}</p></div></div>)}</div></Card></div></main>
}

function sourceFor(view: string, store: Store, config: SuiteConfig): [keyof Store, AnyRecord[]] {
  if (view === "entities") return ["entities", store.entities]
  if (view === "programs") return ["programs", store.programs]
  if (view === "missions") return ["missions", store.missions]
  if (view === "leads") return ["leads", store.leads]
  if (view === "payouts" || view === "commissions") return ["payouts", store.payouts]
  if (view === "territories") return ["territories", store.territories]
  if (view === "training") return ["training", store.training]
  if (view === "library" || view === "enablement") return ["library", store.library]
  if (view === "approvals" || view === "compliance") return ["approvals", store.approvals]
  if (view === "automation") return ["automations", store.automations]
  if (view === "communications") return ["communications", store.communications]
  if (view === "documents") return ["documents", store.documents]
  if (view === "analytics") return ["analytics", store.analytics]
  if (view === "settings") return ["programs", (config.templates || []).map((name: string, i: number)=>({ id:`TPL-${i+1}`, name, type:"Editable template", status:"Draft", target:"Activation scenario", kpi:"Ready to configure" }))]
  return ["entities", store.entities]
}
function defaultNew(view: string, config: SuiteConfig): AnyRecord {
  const stamp = Date.now()
  if (view === "programs") return { name: "New configurable program", type: "Template", status: "Draft", target: "Define audience", commission: "Rule pending", kpi: "Set target", risk: "Low" }
  if (view === "missions") return { title: "New execution mission", owner: "Unassigned", priority: "Medium", status: "Pending", deadline: "72h", proof: "Required" }
  if (view === "leads") return { source: "Manual submission", owner: "Unassigned", status: "UnderReview", value: 0, duplicateRisk: "Low" }
  if (view === "payouts" || view === "commissions") return { owner: "Unassigned", program: "Manual", amount: 0, status: "Pending", proof: "Awaiting validation" }
  if (view === "approvals" || view === "compliance") return { title: "New validation request", owner: "Manager", status: "Pending", risk: "Medium", sla: "24h" }
  if (view === "automation") return { title: "New automation rule", trigger: "When status changes", status: "Active", action: "Notify manager" }
  if (view === "communications") return { title: "New broadcast", audience: "All", status: "Draft", channel: "Internal" }
  return { name: `New ${config.primaryNoun} ${stamp}`, type: "Manual", city: "Rabat", status: "Candidate", manager: "Manager", score: 60, revenue: 0, leads: 0 }
}
export function ManagementPage({ config, view }: { config: SuiteConfig; view: string }) {
  const { store, action } = useExecutionStore(config)
  const [q, setQ] = useState("")
  const [collection, source] = sourceFor(view, store, config)
  const data = useMemo(() => source.filter(item => JSON.stringify(item).toLowerCase().includes(q.toLowerCase())), [q, source])
  const title = view === "entities" ? `${config.pluralNoun} Profiles` : view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, " ")
  return <main className="space-y-6"><Hero config={{...config, headline: `${config.moduleName} — ${title}`, description: `Execution workspace for ${title.toLowerCase()}: create, validate, approve, reject, assign, track, synchronize and keep audit history.`}}/><div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, status, city, program, owner..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900"/><button onClick={()=>action(`create_${view}`, collection, undefined, defaultNew(view, config))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4"/>Create</button><button onClick={()=>action(`sync_${view}`, collection, data[0], { status: data[0]?.status || "Synced" })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"><RefreshCw className="h-4 w-4"/>Sync</button></div><Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-950">{title} records</h2><div className="flex gap-2"><Pill tone="Synced">Synced</Pill><Pill tone="Running">Actionable</Pill></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((item:any) => <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-slate-400">{item.id}</p><h3 className="mt-1 text-lg font-black text-slate-950">{item.name || item.title || item.source || item.city || item.owner}</h3></div><Pill tone={item.status}>{item.status || item.risk || item.level || item.density || "Open"}</Pill></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">{Object.entries(item).filter(([k])=>!["id","name","title"].includes(k)).slice(0,6).map(([k,v])=><div key={k} className="rounded-2xl bg-white p-3"><p className="uppercase text-slate-400">{k}</p><p className="mt-1 text-slate-800">{String(v)}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>action(`open_${view}`, collection, item, { status: item.status || "Open" })} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button><button onClick={()=>action(`approve_${view}`, collection, item, { status:"Approved" })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Approve</button><button onClick={()=>action(`flag_${view}`, collection, item, { status:"Flagged", risk:"High" })} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">Flag</button></div></div>)}</div></Card></main>
}
