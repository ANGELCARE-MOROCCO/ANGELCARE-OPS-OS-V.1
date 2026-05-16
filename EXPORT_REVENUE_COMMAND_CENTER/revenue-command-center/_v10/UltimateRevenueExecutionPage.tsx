"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Activity, AlarmClock, Archive, ArrowRight, BadgeCheck, BarChart3, Bell, Bot, Briefcase, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Command, Crown, Database, Edit3, Eye, Filter, Flag, Gauge, GitBranch, Globe2, Handshake, Headphones, Layers3, LineChart, LockKeyhole, Mail, Megaphone, Network, Phone, Plus, Radar, RefreshCw, Rocket, Route, Save, Search, Settings, ShieldCheck, Sparkles, Target, Timer, TrendingUp, Users, Wallet, Workflow, Zap, Trash2, UserPlus, XCircle } from "lucide-react"

export type RevenuePageKey =
  | "home" | "cockpit" | "control-tower" | "master-command" | "elite-command" | "strategy-room" | "executive-briefing"
  | "tasks" | "tasks-new" | "tasks-board" | "task-detail" | "task-depth"
  | "prospects" | "prospects-new" | "prospects-pipeline" | "prospect-detail" | "prospect-edit" | "leads-impact"
  | "follow-ups" | "appointments" | "appointments-command" | "notifications"
  | "sdr-execution" | "b2c-workflow" | "business-development"
  | "campaigns" | "campaigns-board" | "partnerships" | "partnerships-pipeline" | "market-mapping" | "market-coverage"
  | "management" | "my-work" | "team-performance" | "workload-balancer"
  | "automation" | "ai-scoring" | "predictive" | "meta-readiness" | "system-activation" | "overdue-heatmap" | "growth"

type RevenueRecord = {
  id: string
  module_key: string
  page_key?: string | null
  record_type?: string | null
  title: string
  description?: string | null
  owner_name?: string | null
  department?: string | null
  status: string
  priority: string
  risk_level: string
  value_mad?: number | null
  due_at?: string | null
  next_action?: string | null
  stage?: string | null
  score?: number | null
  metadata?: any
  created_at?: string
  updated_at?: string
}

type Pulse = { total: number; open: number; blocked: number; completed: number; highRisk: number; overdue: number; value: number; byStatus: Record<string, number>; byOwner: Record<string, number> }

type PageConfig = { key: RevenuePageKey; title: string; eyebrow: string; purpose: string; icon: any; accent: string; module: string; route: string; primary: string; secondary: string; lanes: string[]; presets: string[] }

function cfg(key: RevenuePageKey, title: string, eyebrow: string, purpose: string, icon: any, accent: string, module: string, route: string, primary: string, secondary: string, lanes: string[], presets: string[]): PageConfig { return { key, title, eyebrow, purpose, icon, accent, module, route, primary, secondary, lanes, presets } }

const configs: Record<string, PageConfig> = {
  home: cfg("home","Revenue Command Center","Production revenue operating system","Central workspace for revenue execution, prospect control, task command, follow-ups, campaigns, automation and management.", Command,"from-violet-500 via-fuchsia-500 to-cyan-400","revenue_hq","/revenue-command-center","Create command record","Run revenue pulse",["Intake","Executing","Review","Closed"],["CEO revenue decision","Daily command task","Manager escalation","Revenue protection action"]),
  tasks: cfg("tasks","Tasks Command Desk","Real execution task layer","Create, assign, update, bulk execute, escalate and close revenue tasks with audit-safe mutations.", ClipboardList,"from-blue-500 via-cyan-500 to-emerald-400","tasks","/revenue-command-center/tasks","Create task","Bulk complete",["open","in_progress","blocked","completed"],["Call priority family","Prepare proposal","Recover blocked lead","Manager review"]),
  "tasks-new": cfg("tasks-new","Create Revenue Task","Structured task creation","High-control creation workflow with owner, SLA, priority, value, risk and execution checklist.", Plus,"from-blue-500 via-indigo-500 to-violet-500","tasks","/revenue-command-center/tasks/new","Save new task","Seed task presets",["open","in_progress","blocked","completed"],["New family callback","Sales admin action","Follow-up proof","Quality check"]),
  "tasks-board": cfg("tasks-board","Task Board","Kanban execution board","Operational board for stage movement, blockers, owner load and bulk task transitions.", Layers3,"from-indigo-500 via-sky-500 to-cyan-400","tasks","/revenue-command-center/tasks/board","Move selected","Balance workload",["open","in_progress","blocked","completed"],["Board recovery","Agent daily task","Overdue task","Closure proof"]),
  "task-detail": cfg("task-detail","Task Detail Command","Single task control room","Detail-ready view for subtasks, notes, status changes, blockers, assignment and manager decisions.", Eye,"from-violet-500 via-blue-500 to-cyan-500","tasks","/revenue-command-center/tasks/[id]","Save detail action","Escalate task",["open","in_progress","blocked","completed"],["Add subtask","Add manager note","Escalate blocker","Close with proof"]),
  "task-depth": cfg("task-depth","Task Depth Intelligence","Root-cause execution layer","Deep inspection for dependencies, recovery plan, blocker cause and execution audit.", GitBranch,"from-fuchsia-500 via-violet-500 to-blue-500","tasks","/revenue-command-center/tasks/[id]/depth","Add dependency","Run depth scan",["dependencies","root_cause","recovery","approved"],["Dependency fix","Root cause note","Recovery plan","Approval gate"]),
  prospects: cfg("prospects","Prospects Command","Real pipeline execution","Qualify prospects, assign owners, move stages, score value and trigger follow-ups.", Users,"from-emerald-500 via-lime-500 to-yellow-400","prospects","/revenue-command-center/prospects","Create prospect","Qualify selected",["new","qualified","proposal","won"],["New family inquiry","Qualified care need","Proposal follow-up","Won conversion"]),
  "prospects-new": cfg("prospects-new","Create Prospect","Structured prospect intake","Create a prospect with source, urgency, value, score, owner and next-best action.", Plus,"from-lime-500 via-emerald-500 to-teal-500","prospects","/revenue-command-center/prospects/new","Save prospect","Seed prospect presets",["new","qualified","proposal","won"],["Website inquiry","Referral lead","Call center lead","Partner referral"]),
  "prospects-pipeline": cfg("prospects-pipeline","Prospect Pipeline","Pipeline operating board","Move prospects across conversion stages with risk, owner, value and next-action control.", Route,"from-teal-500 via-emerald-500 to-green-400","prospects","/revenue-command-center/prospects/pipeline","Move stage","Create follow-up",["new","qualified","proposal","won"],["Qualification task","Proposal stage","Lost risk rescue","Close plan"]),
  "prospect-detail": cfg("prospect-detail","Prospect Detail Command","Single prospect control room","Control one prospect through notes, stage, owner, risk, appointments and value movement.", Eye,"from-green-500 via-emerald-500 to-cyan-400","prospects","/revenue-command-center/prospects/[id]","Save prospect action","Schedule appointment",["new","qualified","proposal","won"],["Update stage","Add call note","Set appointment","Create task"]),
  "prospect-edit": cfg("prospect-edit","Edit Prospect","Prospect correction and enrichment","Edit prospect profile, owner, source, risk, value, score and next action.", Edit3,"from-green-400 via-teal-500 to-cyan-500","prospects","/revenue-command-center/prospects/[id]/edit","Save changes","Re-score",["new","qualified","proposal","won"],["Data correction","Need profile update","Score update","Source correction"]),
  "follow-ups": cfg("follow-ups","Follow-ups Command","Promise and callback control","Manage callbacks, overdue promises, next action, relationship notes and follow-up proof.", Phone,"from-amber-400 via-orange-500 to-rose-500","followups","/revenue-command-center/follow-ups","Create follow-up","Mark called",["due","called","missed","rescheduled"],["Family callback","Partner callback","Proposal chase","Payment promise"]),
  appointments: cfg("appointments","Appointments Command","Booking execution desk","Schedule, confirm, reschedule, mark no-show and track appointment results.", CalendarDays,"from-sky-500 via-cyan-500 to-teal-400","appointments","/revenue-command-center/appointments","Create appointment","Confirm selected",["scheduled","confirmed","completed","no_show"],["Assessment booking","Family meeting","Partner meeting","Care planning call"]),
  "appointments-command": cfg("appointments-command","Appointment Control Room","High-control appointments","Operational appointment board for confirmations, reminders, outcomes and owner routing.", CalendarDays,"from-cyan-500 via-blue-500 to-indigo-500","appointments","/revenue-command-center/appointments/command","Confirm appointment","Send reminder",["scheduled","confirmed","completed","no_show"],["Reminder action","Reschedule flow","No-show recovery","Outcome capture"]),
  campaigns: cfg("campaigns","Campaigns Command","Revenue campaign execution","Launch, monitor and recover campaigns with ROI, tasks, follow-ups and approval controls.", Megaphone,"from-pink-500 via-rose-500 to-orange-400","campaigns","/revenue-command-center/campaigns","Create campaign action","Launch checklist",["draft","active","review","closed"],["Meta campaign follow-up","SEO lead push","Referral campaign","Local awareness action"]),
  partnerships: cfg("partnerships","Partnerships Command","Partner revenue execution","Manage partner pipeline, health, referrals, cadence, agreements and next actions.", Handshake,"from-purple-500 via-indigo-500 to-blue-400","partnerships","/revenue-command-center/partnerships","Create partner action","Log referral",["identified","contacted","active","strategic"],["Clinic referral","Trainer partner","Association contact","Care institution lead"]),
  automation: cfg("automation","Automation Center","Rules and safety execution","Create manual-safe automation records, track trigger intent, and audit every execution.", Workflow,"from-fuchsia-500 via-purple-500 to-indigo-500","automation","/revenue-command-center/automation","Create rule","Run manual trigger",["draft","armed","ran","paused"],["Overdue alert rule","Owner assignment rule","Follow-up reminder","Risk escalation rule"]),
  "ai-scoring": cfg("ai-scoring","AI Scoring Workspace","Human-controlled scoring","Prioritize records with score, risk reason, confidence, override and manager review.", Bot,"from-cyan-400 via-blue-500 to-violet-500","intelligence","/revenue-command-center/ai-scoring","Score selected","Apply override",["unscored","scored","review","approved"],["High value prospect","Risky task","Conversion signal","Manager override"]),
  management: cfg("management","Management Command","Team execution management","Control workload, approvals, quality review, agent activity, capacity and coaching signals.", Briefcase,"from-slate-500 via-zinc-700 to-black","management","/revenue-command-center/management","Create review","Assign workload",["review","coaching","approved","closed"],["Agent review","Quality issue","Workload decision","Manager approval"]),
  "control-tower": cfg("control-tower","Control Tower","Revenue risk command","See bottlenecks, high-risk work, overdue tasks, workload and value-at-risk in one command view.", Radar,"from-emerald-400 via-teal-500 to-cyan-500","control","/revenue-command-center/control-tower","Resolve risk","Run control scan",["signal","escalated","recovering","resolved"],["SLA breach","Blocked value","Owner overload","Critical recovery"]),
}
const fallback = configs.home
const statusOptions = ["open","in_progress","blocked","completed","new","qualified","proposal","won","due","called","missed","rescheduled","scheduled","confirmed","completed","no_show","draft","active","review","closed","paused","approved"]
const owners = ["Amina","Youssef","Salma","Nora","Mehdi","Hassan","Kenza"]

function money(n?: number | null) { return `MAD ${Number(n || 0).toLocaleString()}` }
function todayPlus(days: number) { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10) }
function riskClass(r: string) { const x=(r||"").toLowerCase(); return x.includes("critical")||x.includes("high") ? "bg-rose-500/15 text-rose-100 border-rose-300/25" : x.includes("medium") ? "bg-amber-500/15 text-amber-100 border-amber-300/25" : "bg-emerald-500/15 text-emerald-100 border-emerald-300/25" }
function statusClass(s: string) { const x=(s||"").toLowerCase(); return x.includes("block")||x.includes("miss")||x.includes("no_show") ? "bg-rose-500/15 text-rose-100 border-rose-300/25" : x.includes("completed")||x.includes("won")||x.includes("approved")||x.includes("confirmed") ? "bg-emerald-500/15 text-emerald-100 border-emerald-300/25" : "bg-cyan-500/15 text-cyan-100 border-cyan-300/25" }

function makeFallbackRecords(config: PageConfig): RevenueRecord[] {
  return config.presets.map((p, i) => ({ id: `fallback-${config.key}-${i}`, module_key: config.module, page_key: config.key, record_type: config.module, title: p, description: `Fallback local record. Use Seed Records or Create to write real database rows.`, owner_name: owners[i%owners.length], status: config.lanes[i%config.lanes.length], priority: ["high","medium","urgent","low"][i%4], risk_level: ["medium","high","critical","low"][i%4], value_mad: [42000,88000,27000,136000][i%4], due_at: todayPlus(i-1), next_action: ["Call", "Manager review", "Recover", "Close proof"][i%4], stage: config.lanes[i%config.lanes.length], score: 62+i*8, metadata: { fallback: true } }))
}

export default function UltimateRevenueExecutionPage({ pageKey }: { pageKey: RevenuePageKey }) {
  const config = configs[pageKey] || fallback
  const Icon = config.icon || Command
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [pulse, setPulse] = useState<Pulse | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [consoleLines, setConsoleLines] = useState<string[]>([`V10 production execution layer online`, `module=${config.module} page=${config.key}`, `actions=create/update/bulk/audit/pulse`])
  const [draft, setDraft] = useState({ title: "", description: "", owner_name: "Amina", status: config.lanes[0] || "open", priority: "high", risk_level: "medium", value_mad: "25000", due_at: todayPlus(1), next_action: "Call and qualify" })

  async function load() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/revenue-command-center/v10/records?module=${encodeURIComponent(config.module)}&page=${encodeURIComponent(config.key)}`, { cache: "no-store" })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Could not load records")
      setRecords((json.records || []).length ? json.records : makeFallbackRecords(config))
      const pres = await fetch(`/api/revenue-command-center/v10/pulse?module=${encodeURIComponent(config.module)}`, { cache: "no-store" })
      const pjson = await pres.json(); if (pjson.ok) setPulse(pjson.pulse)
      push(`loaded ${(json.records || []).length} database records`)
    } catch (e:any) { setError(e?.message || "Load failed"); setRecords(makeFallbackRecords(config)); push(`fallback loaded because database/API failed`) }
    setLoading(false)
  }
  useEffect(()=>{ load() }, [config.key])
  function push(line:string){ setConsoleLines(lines => [`${new Date().toLocaleTimeString()} :: ${line}`, ...lines].slice(0,10)) }

  const filtered = useMemo(()=> records.filter(r => (status === "all" || r.status === status) && `${r.title} ${r.description} ${r.owner_name} ${r.status}`.toLowerCase().includes(query.toLowerCase())), [records, query, status])
  const ids = new Set(selected)
  const displayPulse = pulse || { total: records.length, open: records.filter(r=>!["completed","won","closed","approved"].includes(r.status)).length, blocked: records.filter(r=>r.status.includes("blocked")).length, completed: records.filter(r=>["completed","won","closed","approved"].includes(r.status)).length, highRisk: records.filter(r=>["high","critical","urgent"].includes((r.risk_level||"").toLowerCase())).length, overdue: records.filter(r=>r.due_at && new Date(r.due_at) < new Date()).length, value: records.reduce((a,r)=>a+Number(r.value_mad||0),0), byStatus:{}, byOwner:{} }

  async function createRecord(title?: string) {
    setSaving(true); setError("")
    const body = { ...draft, title: title || draft.title || `${config.title} action`, module_key: config.module, page_key: config.key, record_type: config.module, stage: draft.status, score: 70, metadata: { source: "v10_ui", page: config.key } }
    try { const res = await fetch('/api/revenue-command-center/v10/records', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); const json = await res.json(); if(!json.ok) throw new Error(json.error || 'Create failed'); push(`created ${json.record?.title || body.title}`); setDraft(d=>({...d,title:"",description:""})); await load() } catch(e:any){ setError(e?.message || 'Create failed'); push(`create failed`) }
    setSaving(false)
  }
  async function updateRecord(id:string, updates:any) {
    if (id.startsWith('fallback-')) { setError('This is fallback data. Click Seed Records first or create real records.'); push('fallback record cannot be updated'); return }
    setSaving(true); setError("")
    try { const res = await fetch('/api/revenue-command-center/v10/records', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, ...updates, module_key: config.module, page_key: config.key }) }); const json = await res.json(); if(!json.ok) throw new Error(json.error || 'Update failed'); push(`updated ${updates.action_key || 'record'}`); await load() } catch(e:any){ setError(e?.message || 'Update failed'); push(`update failed`) }
    setSaving(false)
  }
  async function bulk(action:string, updates:any={}) {
    const realIds = selected.filter(x=>!x.startsWith('fallback-'))
    if (!realIds.length) { setError('Select real database records first. Fallback rows are not mutable.'); push(`${action} blocked: no real records selected`); return }
    setSaving(true); setError("")
    try { const res = await fetch('/api/revenue-command-center/v10/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids: realIds, action, updates, module_key: config.module, page_key: config.key }) }); const json = await res.json(); if(!json.ok) throw new Error(json.error || 'Bulk failed'); push(`bulk ${action}: ${json.count || realIds.length} records`); setSelected([]); await load() } catch(e:any){ setError(e?.message || 'Bulk failed'); push(`bulk ${action} failed`) }
    setSaving(false)
  }
  async function seed() {
    setSaving(true); setError("")
    try { const res = await fetch('/api/revenue-command-center/v10/seed', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ module_key: config.module, page_key: config.key, presets: config.presets, lanes: config.lanes }) }); const json = await res.json(); if(!json.ok) throw new Error(json.error || 'Seed failed'); push(`seeded ${json.count} real records`); await load() } catch(e:any){ setError(e?.message || 'Seed failed'); push('seed failed') }
    setSaving(false)
  }

  return <main className="min-h-screen bg-[#050713] text-white overflow-hidden">
    <div className="fixed inset-0 pointer-events-none opacity-70" style={{background:"radial-gradient(circle at 15% 10%, rgba(34,211,238,.22), transparent 30%), radial-gradient(circle at 85% 0%, rgba(217,70,239,.20), transparent 32%), radial-gradient(circle at 50% 90%, rgba(16,185,129,.12), transparent 35%)"}} />
    <section className="relative p-5 md:p-8 space-y-6">
      <header className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${config.accent} p-[1px] shadow-2xl`}>
        <div className="rounded-[2rem] bg-slate-950/90 p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex items-start gap-5"><div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10 border border-white/15 shadow-xl"><Icon className="h-10 w-10" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[.28em] text-cyan-200"><Sparkles className="h-4 w-4" /> {config.eyebrow}</div><h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{config.title}</h1><p className="mt-3 max-w-4xl text-base md:text-lg text-slate-200">{config.purpose}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">route {config.route}</span><span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1">real API v10</span><span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1">audit enabled</span></div></div></div>
            <div className="grid grid-cols-2 gap-3 min-w-[320px]"><button onClick={()=>createRecord()} disabled={saving} className="rounded-2xl bg-white text-slate-950 px-4 py-3 font-bold shadow-xl hover:scale-[1.02] transition"><Plus className="inline h-4 w-4 mr-2" />{config.primary}</button><button onClick={seed} disabled={saving} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-bold hover:bg-white/15"><Database className="inline h-4 w-4 mr-2" />Seed Records</button><button onClick={load} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-bold hover:bg-white/15"><RefreshCw className="inline h-4 w-4 mr-2" />Refresh</button><button onClick={()=>bulk('completed',{status:'completed',stage:'completed'})} className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 font-bold hover:bg-emerald-400/15"><CheckCircle2 className="inline h-4 w-4 mr-2" />Bulk Done</button></div>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-rose-300/25 bg-rose-500/15 p-4 text-rose-100"><XCircle className="inline h-5 w-5 mr-2" />{error}</div>}

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[['Total',displayPulse.total,Activity],['Open',displayPulse.open,Timer],['Blocked',displayPulse.blocked,Flag],['Done',displayPulse.completed,BadgeCheck],['Risk',displayPulse.highRisk,AlarmClock],['Value',money(displayPulse.value),Wallet]].map(([label,val,I]:any)=><div key={label} className="rounded-3xl border border-white/10 bg-white/[.06] p-4 shadow-xl"><div className="flex items-center justify-between text-slate-300"><span className="text-xs uppercase tracking-[.2em]">{label}</span><I className="h-5 w-5" /></div><div className="mt-3 text-2xl font-black text-white">{val}</div></div>)}
      </section>

      <section className="grid xl:grid-cols-[410px_1fr] gap-5">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl"><h2 className="text-xl font-black flex items-center gap-2"><Save className="h-5 w-5" /> Create / Execute</h2><div className="mt-4 space-y-3"><input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none" placeholder="Action title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/><textarea className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none min-h-24" placeholder="Description / execution note" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/><div className="grid grid-cols-2 gap-3"><select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={draft.owner_name} onChange={e=>setDraft({...draft,owner_name:e.target.value})}>{owners.map(o=><option key={o}>{o}</option>)}</select><select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{config.lanes.map(s=><option key={s}>{s}</option>)}</select><select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}>{['urgent','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select><select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={draft.risk_level} onChange={e=>setDraft({...draft,risk_level:e.target.value})}>{['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select><input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3" placeholder="Value MAD" value={draft.value_mad} onChange={e=>setDraft({...draft,value_mad:e.target.value})}/><input type="date" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3" value={draft.due_at} onChange={e=>setDraft({...draft,due_at:e.target.value})}/></div><input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none" placeholder="Next action" value={draft.next_action} onChange={e=>setDraft({...draft,next_action:e.target.value})}/><button onClick={()=>createRecord()} disabled={saving} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:scale-[1.01] transition">Create Real DB Record</button></div></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl"><h2 className="text-xl font-black flex items-center gap-2"><Zap className="h-5 w-5" /> Scenario Presets</h2><div className="mt-4 grid gap-2">{config.presets.map(p=><button key={p} onClick={()=>createRecord(p)} className="text-left rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 hover:bg-white/10"><span className="font-bold">{p}</span><span className="block text-xs text-slate-400">one-click real execution record</span></button>)}</div></div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl"><h2 className="text-xl font-black flex items-center gap-2"><TerminalIcon /> Execution Console</h2><div className="mt-4 space-y-2 font-mono text-xs text-cyan-100">{consoleLines.map((l,i)=><div key={i} className="rounded-xl bg-black/30 px-3 py-2">{l}</div>)}</div></div>
        </aside>
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-4 shadow-2xl"><div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between"><div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent outline-none" placeholder="Search records, owner, status..." value={query} onChange={e=>setQuery(e.target.value)} /></div><select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option>{Array.from(new Set([...config.lanes, ...statusOptions])).map(s=><option key={s} value={s}>{s}</option>)}</select><div className="text-sm text-slate-300">{selected.length} selected</div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>bulk('assign',{owner_name:'Amina'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10"><UserPlus className="inline h-4 w-4 mr-1" />Assign Amina</button><button onClick={()=>bulk('priority',{priority:'urgent',risk_level:'high'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10"><Flag className="inline h-4 w-4 mr-1" />Urgent</button><button onClick={()=>bulk('blocked',{status:'blocked',risk_level:'critical'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10"><AlarmClock className="inline h-4 w-4 mr-1" />Block/Escalate</button><button onClick={()=>bulk('archive',{status:'archived'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10"><Archive className="inline h-4 w-4 mr-1" />Archive</button></div></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">{config.lanes.map(l=><div key={l} className="rounded-3xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center justify-between"><h3 className="font-black capitalize">{l.replaceAll('_',' ')}</h3><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{records.filter(r=>r.status===l || r.stage===l).length}</span></div><div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-white/60" style={{width:`${Math.min(100, records.filter(r=>r.status===l || r.stage===l).length * 18)}%`}} /></div></div>)}</div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black flex items-center gap-2"><Database className="h-5 w-5" /> Live Records</h2><span className="text-sm text-slate-300">{loading ? 'loading...' : `${filtered.length} visible`}</span></div><div className="mt-4 space-y-3">{filtered.map(r=><article key={r.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 hover:bg-slate-900/70 transition"><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div className="flex gap-3"><input type="checkbox" checked={ids.has(r.id)} onChange={e=>setSelected(s=>e.target.checked ? [...s,r.id] : s.filter(x=>x!==r.id))} className="mt-2 h-5 w-5"/><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black">{r.title}</h3>{r.metadata?.fallback && <span className="rounded-full bg-amber-400/15 border border-amber-300/25 px-2 py-1 text-xs text-amber-100">fallback</span>}</div><p className="mt-1 text-sm text-slate-300">{r.description || r.next_action || 'No description yet'}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className={`rounded-full border px-2 py-1 ${statusClass(r.status)}`}>{r.status}</span><span className={`rounded-full border px-2 py-1 ${riskClass(r.risk_level)}`}>{r.risk_level}</span><span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">owner {r.owner_name || 'unassigned'}</span><span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">{money(r.value_mad)}</span><span className="rounded-full border border-white/10 bg-white/10 px-2 py-1">due {r.due_at ? String(r.due_at).slice(0,10) : 'none'}</span></div></div></div><div className="grid grid-cols-2 gap-2 min-w-[250px]"><button onClick={()=>updateRecord(r.id,{status:'in_progress',stage:'in_progress',action_key:'start'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10">Start</button><button onClick={()=>updateRecord(r.id,{status:'completed',stage:'completed',action_key:'complete'})} className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm hover:bg-emerald-400/15">Complete</button><button onClick={()=>updateRecord(r.id,{status:'blocked',risk_level:'critical',action_key:'escalate'})} className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm hover:bg-rose-400/15">Escalate</button><button onClick={()=>updateRecord(r.id,{owner_name: owners[(owners.indexOf(r.owner_name||'Amina')+1)%owners.length], action_key:'reassign'})} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10">Reassign</button></div></div></article>)}{!filtered.length && <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-300">No records. Use Create or Seed Records.</div>}</div></div>
        </section>
      </section>
    </section>
  </main>
}
function TerminalIcon(){ return <Command className="h-5 w-5"/> }
