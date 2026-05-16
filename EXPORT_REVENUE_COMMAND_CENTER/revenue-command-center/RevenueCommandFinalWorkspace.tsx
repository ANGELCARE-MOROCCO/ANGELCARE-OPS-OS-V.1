"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Archive, ArrowRight, BarChart3, Bell, Bot, Briefcase, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Database, Flag, Gauge, LayoutDashboard, Lock, MessageSquare, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Target, Timer, Trash2, TrendingUp, UserPlus, Users, Zap } from "lucide-react"

type DraftRecord = {
  title: string
  description: string
  owner_name: string
  status: string
  priority: string
  risk_level: string
  value_mad: number | string
  due_date: string
  next_action: string
}

type RecordRow = {
  id?: string
  module_key?: string
  page_key?: string
  record_type?: string
  title?: string
  description?: string
  owner_name?: string
  department?: string
  status?: string
  priority?: string
  risk_level?: string
  stage?: string
  value_mad?: number
  due_date?: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

type WorkspaceKey =
  | "hq" | "controlTower" | "tasks" | "taskBoard" | "taskNew" | "taskDetail" | "taskDepth"
  | "prospects" | "prospectPipeline" | "prospectNew" | "prospectDetail" | "prospectEdit"
  | "campaigns" | "campaignBoard" | "campaignNew" | "campaignDetail" | "campaignExecution" | "campaignAssets" | "campaignPerformance"
  | "appointments" | "appointmentsCommand" | "followUps" | "automation" | "aiScoring" | "management"
  | "partnerships" | "businessDevelopment" | "growth" | "myWork" | "notifications" | "strategyRoom"

const money = new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 })

const workspaceMap: Record<WorkspaceKey, any> = {
  hq: {
    module: "revenue_hq", route: "/revenue-command-center", icon: LayoutDashboard,
    title: "Revenue Command Center", eyebrow: "Executive revenue operating system",
    summary: "Central command for strategic business development, sales execution, prospect discipline, SLA control, and revenue recovery.",
    accent: "from-cyan-500 via-blue-600 to-violet-600", recordType: "command_record",
    primaryAction: "Create command record", secondaryAction: "Seed command center",
    stages: ["Intake", "Qualified", "In execution", "Escalated", "Closed"],
    panels: ["Executive pipeline health", "Revenue risks", "SLA interventions", "Manager approvals"],
    playbooks: ["Daily revenue standup", "High-value prospect rescue", "Blocked deal recovery", "No-owner cleanup"],
    fields: ["Command title", "Strategic note", "Owner", "Stage", "Priority", "Risk", "Value MAD", "Due date", "Next action"]
  },
  controlTower: {
    module: "control_tower", route: "/revenue-command-center/control-tower", icon: Gauge,
    title: "Control Tower", eyebrow: "Risk, SLA, intervention, escalation",
    summary: "A live executive cockpit to detect revenue blockage, force ownership, open intervention rooms, and prevent silent pipeline decay.",
    accent: "from-fuchsia-500 via-rose-600 to-orange-500", recordType: "intervention",
    primaryAction: "Open intervention", secondaryAction: "Run risk scan",
    stages: ["Signal", "Triage", "Owner locked", "Recovery", "Resolved"],
    panels: ["Critical risks", "SLA breaches", "Blocked owners", "Recovery rooms"],
    playbooks: ["Escalate no-response prospect", "Recover late task", "Manager unblock", "Executive decision needed"],
    fields: ["Risk title", "Control note", "Incident owner", "Stage", "Severity", "Risk", "Revenue exposed", "Review date", "Required intervention"]
  },
  tasks: {
    module: "tasks", route: "/revenue-command-center/tasks", icon: ClipboardList,
    title: "Tasks Command", eyebrow: "Execution discipline and accountability",
    summary: "A production-grade task command desk for ownership, subtasks, escalation, blocking reasons, SLA, and manager follow-through.",
    accent: "from-emerald-500 via-teal-600 to-cyan-500", recordType: "task",
    primaryAction: "Create task", secondaryAction: "Create execution batch",
    stages: ["Backlog", "Today", "In progress", "Blocked", "Done"],
    panels: ["Today execution", "Blocked work", "Subtask depth", "Manager review"],
    playbooks: ["Assign owner", "Split into subtasks", "Escalate blocker", "Close with audit note"],
    fields: ["Task title", "Execution note", "Assignee", "Stage", "Priority", "Risk", "Value / impact", "Due date", "Next execution step"]
  },
  taskBoard: { extends: "tasks", route: "/revenue-command-center/tasks/board", title: "Task Operating Board", eyebrow: "Kanban, workload, blocked lanes" },
  taskNew: { extends: "tasks", route: "/revenue-command-center/tasks/new", title: "New Task Command Form", eyebrow: "Structured task creation", primaryAction: "Create production task" },
  taskDetail: { extends: "tasks", route: "/revenue-command-center/tasks/[id]", title: "Task Action Room", eyebrow: "Detail, subtasks, ownership, audit" },
  taskDepth: { extends: "tasks", route: "/revenue-command-center/tasks/[id]/depth", title: "Task Depth Layer", eyebrow: "Subtasks, dependencies, evidence" },
  prospects: {
    module: "prospects", route: "/revenue-command-center/prospects", icon: Target,
    title: "Prospects Pipeline", eyebrow: "Business development and sales domination",
    summary: "A dedicated prospect workspace for qualification, decision maps, next actions, owner pressure, deal value, and conversion discipline.",
    accent: "from-blue-500 via-indigo-600 to-purple-600", recordType: "prospect",
    primaryAction: "Create prospect", secondaryAction: "Run qualification",
    stages: ["Identified", "Qualified", "Contacted", "Meeting", "Negotiation", "Won/Lost"],
    panels: ["Qualification", "Decision makers", "Next follow-up", "Deal value"],
    playbooks: ["BANT qualification", "Map decision maker", "Book appointment", "Create recovery follow-up"],
    fields: ["Prospect / company", "Opportunity note", "Closer", "Stage", "Priority", "Risk", "Estimated value", "Next contact", "Next sales action"]
  },
  prospectPipeline: { extends: "prospects", route: "/revenue-command-center/prospects/pipeline", title: "Prospect Pipeline Board", eyebrow: "Stages, conversion, ownership" },
  prospectNew: { extends: "prospects", route: "/revenue-command-center/prospects/new", title: "New Prospect Intake", eyebrow: "Lead capture and qualification" },
  prospectDetail: { extends: "prospects", route: "/revenue-command-center/prospects/[id]", title: "Prospect Action Room", eyebrow: "Decision map, follow-up, deal control" },
  prospectEdit: { extends: "prospects", route: "/revenue-command-center/prospects/[id]/edit", title: "Edit Prospect Control File", eyebrow: "Qualification and ownership update" },
  campaigns: {
    module: "campaigns", route: "/revenue-command-center/campaigns", icon: TrendingUp,
    title: "Campaign Command", eyebrow: "Revenue campaign execution",
    summary: "Campaign workspace for pipeline generation, lead flow, conversion impact, assets, tasks, ROI, and cross-team execution.",
    accent: "from-amber-500 via-orange-600 to-red-600", recordType: "campaign",
    primaryAction: "Create campaign", secondaryAction: "Launch checklist",
    stages: ["Strategy", "Assets", "Launch", "Optimization", "ROI Review"],
    panels: ["Launch readiness", "Lead flow", "Assets", "ROI"],
    playbooks: ["Define ICP", "Approve assets", "Launch campaign", "Optimize low conversion"],
    fields: ["Campaign name", "Campaign objective", "Campaign owner", "Stage", "Priority", "Risk", "Target value", "Launch date", "Next campaign action"]
  },
  campaignBoard: { extends: "campaigns", route: "/revenue-command-center/campaigns/board", title: "Campaign Operating Board", eyebrow: "Launch, assets, ROI lanes" },
  campaignNew: { extends: "campaigns", route: "/revenue-command-center/campaigns/new", title: "New Revenue Campaign", eyebrow: "Campaign creation and launch plan" },
  campaignDetail: { extends: "campaigns", route: "/revenue-command-center/campaigns/[id]", title: "Campaign War Room", eyebrow: "Tasks, leads, ROI, ownership" },
  campaignExecution: { extends: "campaigns", route: "/revenue-command-center/campaigns/[id]/execution", title: "Campaign Execution Layer", eyebrow: "Checklist, tasks, blockers" },
  campaignAssets: { extends: "campaigns", route: "/revenue-command-center/campaigns/[id]/assets", title: "Campaign Assets Room", eyebrow: "Content, approvals, launch files" },
  campaignPerformance: { extends: "campaigns", route: "/revenue-command-center/campaigns/[id]/performance", title: "Campaign Performance Room", eyebrow: "ROI, leads, conversion" },
  appointments: {
    module: "appointments", route: "/revenue-command-center/appointments", icon: CalendarClock,
    title: "Appointments Command", eyebrow: "Meetings, confirmations, no-show prevention",
    summary: "Appointment control desk to schedule, confirm, reschedule, track no-shows, and convert meetings into next actions.",
    accent: "from-sky-500 via-cyan-600 to-emerald-500", recordType: "appointment",
    primaryAction: "Create appointment", secondaryAction: "Confirm meetings",
    stages: ["Requested", "Scheduled", "Confirmed", "Completed", "No-show"],
    panels: ["Today meetings", "Unconfirmed", "No-show risk", "Next follow-up"],
    playbooks: ["Confirm appointment", "Reschedule safely", "No-show recovery", "Create next step"],
    fields: ["Meeting title", "Meeting objective", "Host", "Stage", "Priority", "Risk", "Expected value", "Meeting date", "Next meeting action"]
  },
  appointmentsCommand: { extends: "appointments", route: "/revenue-command-center/appointments/command", title: "Appointment Conversion Desk", eyebrow: "Follow-up and meeting discipline" },
  followUps: { extends: "appointments", module: "follow_ups", route: "/revenue-command-center/follow-ups", title: "Follow-up Command", eyebrow: "Overdue, next contact, conversion pressure", primaryAction: "Create follow-up" },
  automation: {
    module: "automation", route: "/revenue-command-center/automation", icon: Zap,
    title: "Automation Center", eyebrow: "Rules, playbooks, trigger control",
    summary: "Automation command room for routing, SLA triggers, reminders, escalation playbooks, and safe activation testing.",
    accent: "from-violet-500 via-purple-600 to-fuchsia-600", recordType: "automation_rule",
    primaryAction: "Create automation rule", secondaryAction: "Test workflow",
    stages: ["Draft", "Testing", "Active", "Paused", "Retired"],
    panels: ["Rules", "Triggers", "Playbooks", "Audit"],
    playbooks: ["Auto-assign owner", "SLA breach alert", "Overdue follow-up", "High-value escalation"],
    fields: ["Rule name", "Automation logic", "Owner", "Stage", "Priority", "Risk", "Revenue coverage", "Review date", "Trigger condition"]
  },
  aiScoring: {
    module: "ai_scoring", route: "/revenue-command-center/ai-scoring", icon: Bot,
    title: "AI Revenue Scoring", eyebrow: "Priority, risk, recommendations",
    summary: "Scoring layer for prospect priority, task risk, next-best-action, stale opportunity detection, and manager recommendations.",
    accent: "from-indigo-500 via-blue-600 to-cyan-500", recordType: "score_signal",
    primaryAction: "Create scoring signal", secondaryAction: "Run recommendation scan",
    stages: ["Signal", "Scored", "Recommended", "Assigned", "Resolved"],
    panels: ["High-score prospects", "Risk signals", "Next-best-action", "Model review"],
    playbooks: ["Score prospect", "Flag stale deal", "Recommend next action", "Prioritize manager review"],
    fields: ["Signal title", "Evidence", "Analyst", "Stage", "Priority", "Risk", "Potential value", "Review date", "Recommended action"]
  },
  management: {
    module: "management", route: "/revenue-command-center/management", icon: Users,
    title: "Revenue Management", eyebrow: "Team, workload, permission, audit",
    summary: "Management layer for team workload, production discipline, permission control, performance review, and escalation approvals.",
    accent: "from-slate-400 via-slate-600 to-zinc-800", recordType: "management_action",
    primaryAction: "Create manager action", secondaryAction: "Review workload",
    stages: ["Review", "Assigned", "Coaching", "Escalated", "Approved"],
    panels: ["Team workload", "Permissions", "Performance", "Audit trail"],
    playbooks: ["Rebalance workload", "Review poor SLA", "Approve escalation", "Audit sensitive action"],
    fields: ["Management action", "Review note", "Manager", "Stage", "Priority", "Risk", "Revenue exposure", "Review date", "Decision required"]
  },
  partnerships: { extends: "prospects", module: "partnerships", route: "/revenue-command-center/partnerships", title: "Partnership Revenue Desk", eyebrow: "Partner pipeline and strategic alliances", recordType: "partnership" },
  businessDevelopment: { extends: "prospects", module: "business_development", route: "/revenue-command-center/business-development", title: "Business Development Command", eyebrow: "Strategic outreach and opportunity creation" },
  growth: { extends: "campaigns", module: "growth", route: "/revenue-command-center/growth", title: "Growth Revenue Room", eyebrow: "Growth experiments and conversion impact" },
  myWork: { extends: "tasks", module: "my_work", route: "/revenue-command-center/my-work", title: "My Revenue Work", eyebrow: "Personal execution desk" },
  notifications: { extends: "controlTower", module: "notifications", route: "/revenue-command-center/notifications", title: "Revenue Notifications", eyebrow: "Alerts, reminders, escalations" },
  strategyRoom: { extends: "hq", module: "strategy_room", route: "/revenue-command-center/strategy-room", title: "Revenue Strategy Room", eyebrow: "Strategic planning and executive alignment" },
}

function resolveWorkspace(key: WorkspaceKey) {
  const raw = workspaceMap[key] || workspaceMap.hq
  if (!raw.extends) return raw
  return { ...workspaceMap[raw.extends as WorkspaceKey], ...raw }
}

async function safeJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return { ok: res.ok && json.ok !== false, status: res.status, json, text }
  } catch {
    return { ok: false, status: res.status, json: null, text: text.slice(0, 220) }
  }
}

function fallbackRows(ws: any): RecordRow[] {
  return [
    { id: "local-1", module_key: ws.module, record_type: ws.recordType, title: `${ws.title} priority action`, description: `Fallback local row. API is reachable only when v10 routes are installed.`, owner_name: "Amina", status: ws.stages[0], priority: "high", risk_level: "medium", value_mad: 42000, due_date: "2026-05-06" },
    { id: "local-2", module_key: ws.module, record_type: ws.recordType, title: `${ws.title} manager review`, description: `Use Seed Records or Create after SQL is installed.`, owner_name: "Youssef", status: ws.stages[1] || "Open", priority: "medium", risk_level: "low", value_mad: 75000, due_date: "2026-05-07" },
    { id: "local-3", module_key: ws.module, record_type: ws.recordType, title: `${ws.title} blocked revenue item`, description: `This is intentionally labeled local so it cannot be mistaken for real data.`, owner_name: "Sara", status: "Blocked", priority: "urgent", risk_level: "high", value_mad: 126000, due_date: "2026-05-05" },
  ]
}

export default function RevenueCommandFinalWorkspace({ workspace = "hq", recordId }: { workspace?: WorkspaceKey, recordId?: string }) {
  const ws = resolveWorkspace(workspace)
  const Icon = ws.icon || LayoutDashboard
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [draft, setDraft] = useState<DraftRecord>({ title: "", description: "", owner_name: "Amina", status: String(ws.stages[0] ?? "Open"), priority: "high", risk_level: "medium", value_mad: 25000, due_date: "2026-05-06", next_action: String(ws.playbooks[0] ?? "Next action") })

  const api = "/api/revenue-command-center/v10"

  async function load() {
    setLoading(true); setError("")
    const r = await safeJson(`${api}/records?module=${encodeURIComponent(ws.module)}&page=${encodeURIComponent(ws.route)}`)
    if (!r.ok) {
      setError(`API problem ${r.status}: ${r.text || "No JSON returned"}`)
      setRecords(fallbackRows(ws))
    } else {
      const rows = r.json.records || []
      setRecords(rows.length ? rows : fallbackRows(ws))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [workspace])

  const visible = useMemo(() => records.filter(r => {
    const hay = `${r.title} ${r.description} ${r.owner_name} ${r.status} ${r.priority}`.toLowerCase()
    return (statusFilter === "all" || String(r.status).toLowerCase() === statusFilter.toLowerCase()) && hay.includes(query.toLowerCase())
  }), [records, statusFilter, query])

  const stats = useMemo(() => {
    const total = records.length
    const blocked = records.filter(r => String(r.status).toLowerCase().includes("blocked") || String(r.risk_level).toLowerCase() === "high").length
    const done = records.filter(r => ["done","closed","resolved","won/lost","approved"].some(s => String(r.status).toLowerCase().includes(s))).length
    const value = records.reduce((a, r) => a + Number(r.value_mad || 0), 0)
    return { total, open: Math.max(total - done, 0), blocked, done, value }
  }, [records])

  async function createRecord() {
    setBusy(true); setNotice("")
    const payload = { ...draft, module_key: ws.module, page_key: ws.route, record_type: ws.recordType, metadata: { workspace, route: ws.route, next_action: draft.next_action } }
    const r = await safeJson(`${api}/records`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setBusy(false)
    if (!r.ok) { setError(`Create failed ${r.status}: ${r.text}`); return }
    setNotice("Record created and audit logged.")
    await load()
  }

  async function act(action: string, ids = selected) {
    setBusy(true); setNotice("")
    const r = await safeJson(`${api}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, module: ws.module, page: ws.route, selected: ids, draft }) })
    setBusy(false)
    if (!r.ok) { setError(`Action failed ${r.status}: ${r.text}`); return }
    setNotice(`${action} executed for ${ids.length || 1} item(s).`)
    await load()
  }

  async function seed() {
    setBusy(true)
    const r = await safeJson(`${api}/seed`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: ws.module, page: ws.route, workspace }) })
    setBusy(false)
    if (!r.ok) { setError(`Seed failed ${r.status}: ${r.text}`); return }
    setNotice("Seed records inserted for this workspace.")
    await load()
  }

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return <main className="min-h-screen bg-[#070b16] text-white p-6 space-y-6">
    <section className={`relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br ${ws.accent} p-[1px] shadow-2xl`}>
      <div className="rounded-[2rem] bg-slate-950/90 p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-center">
          <div className="flex gap-6 items-start">
            <div className="rounded-3xl bg-white/10 p-5 border border-white/20"><Icon className="h-11 w-11 text-white" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200 font-black">{ws.eyebrow}</p>
              <h1 className="mt-3 text-5xl font-black tracking-tight text-white drop-shadow">{ws.title}</h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-100">{ws.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1">route {ws.route}</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-300/30 px-3 py-1">v10 API required</span>
                <span className="rounded-full bg-blue-500/15 border border-blue-300/30 px-3 py-1">audit enabled</span>
                {recordId ? <span className="rounded-full bg-fuchsia-500/15 border border-fuchsia-300/30 px-3 py-1">record {recordId}</span> : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={createRecord} disabled={busy} className="rounded-2xl bg-white text-slate-950 px-4 py-4 font-bold hover:bg-cyan-100"><Plus className="inline h-4 w-4 mr-2" />{ws.primaryAction}</button>
            <button onClick={seed} disabled={busy} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 font-bold hover:bg-white/15"><Database className="inline h-4 w-4 mr-2" />{ws.secondaryAction}</button>
            <button onClick={load} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 font-semibold"><RefreshCw className="inline h-4 w-4 mr-2" />Refresh</button>
            <button onClick={() => act("bulk_done")} className="rounded-2xl bg-emerald-500/15 border border-emerald-300/30 px-4 py-3 font-semibold"><CheckCircle2 className="inline h-4 w-4 mr-2" />Bulk Done</button>
          </div>
        </div>
      </div>
    </section>

    {error && <div className="rounded-2xl border border-rose-400/40 bg-rose-950/50 p-4 text-rose-100"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>}
    {notice && <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/40 p-4 text-emerald-100"><ShieldCheck className="inline h-5 w-5 mr-2" />{notice}</div>}

    <section className="grid gap-4 md:grid-cols-5">
      <Kpi label="Total" value={stats.total} icon={Activity}/><Kpi label="Open" value={stats.open} icon={Timer}/><Kpi label="Blocked" value={stats.blocked} icon={Flag}/><Kpi label="Done" value={stats.done} icon={CheckCircle2}/><Kpi label="Value" value={money.format(stats.value)} icon={Briefcase}/>
    </section>

    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 space-y-4">
        <h2 className="text-2xl font-black text-white"><Plus className="inline h-5 w-5 mr-2" />{ws.primaryAction}</h2>
        <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder={ws.fields[0]} className="w-full rounded-2xl bg-slate-950 border border-white/10 px-4 py-4 text-white placeholder:text-slate-400" />
        <textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder={ws.fields[1]} className="w-full min-h-28 rounded-2xl bg-slate-950 border border-white/10 px-4 py-4 text-white placeholder:text-slate-400" />
        <div className="grid grid-cols-2 gap-3">
          <Select value={draft.owner_name} onChange={(v: string) => setDraft({ ...draft, owner_name: v })} options={["Amina","Youssef","Sara","Mehdi","Manager"]}/>
          <Select value={draft.status} onChange={(v: string) => setDraft({ ...draft, status: v })} options={ws.stages}/>
          <Select value={draft.priority} onChange={(v: string) => setDraft({ ...draft, priority: v })} options={["low","medium","high","urgent"]}/>
          <Select value={draft.risk_level} onChange={(v: string) => setDraft({ ...draft, risk_level: v })} options={["low","medium","high","critical"]}/>
          <input type="number" value={draft.value_mad} onChange={e=>setDraft({...draft,value_mad:e.target.value})} placeholder={ws.fields[6]} className="rounded-2xl bg-slate-950 border border-white/10 px-4 py-3 text-white" />
          <input type="date" value={draft.due_date} onChange={e=>setDraft({...draft,due_date:e.target.value})} className="rounded-2xl bg-slate-950 border border-white/10 px-4 py-3 text-white" />
        </div>
        <Select value={draft.next_action} onChange={(v: string) => setDraft({ ...draft, next_action: v })} options={ws.playbooks}/>
        <button onClick={createRecord} disabled={busy} className="w-full rounded-2xl bg-cyan-400 text-slate-950 py-4 font-black hover:bg-cyan-300">Create real database row</button>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1"><Search className="absolute left-4 top-4 h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search records, owner, status..." className="w-full rounded-2xl bg-slate-950 border border-white/10 pl-11 pr-4 py-4 text-white"/></div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-2xl bg-slate-950 border border-white/10 px-4 py-4 text-white"><option value="all">All statuses</option>{ws.stages.map((s:string)=><option key={s} value={s}>{s}</option>)}</select>
            <span className="text-sm text-slate-300">{selected.length} selected</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={()=>act("assign_owner")} icon={UserPlus} label="Assign Amina" />
            <ActionButton onClick={()=>act("mark_urgent")} icon={Flag} label="Urgent" />
            <ActionButton onClick={()=>act("block_escalate")} icon={AlertTriangle} label="Block/Escalate" />
            <ActionButton onClick={()=>act("archive")} icon={Archive} label="Archive" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {ws.stages.slice(0,5).map((stage:string)=><div key={stage} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex justify-between text-sm"><b className="text-white">{stage}</b><span className="rounded-full bg-white/10 px-2">{records.filter(r=>r.status===stage).length}</span></div><div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-1/3 bg-white/60"/></div></div>)}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-white"><Database className="inline h-5 w-5 mr-2" />Live Records</h2><span>{visible.length} visible</span></div>
          <div className="mt-4 space-y-3">
            {loading ? <div className="p-8 text-slate-300">Loading Revenue Command records...</div> : visible.map(r => <article key={r.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                <div>
                  <label className="inline-flex gap-3 items-start"><input type="checkbox" checked={selected.includes(String(r.id))} onChange={()=>toggle(String(r.id))} className="mt-1 h-5 w-5"/><span><b className="text-xl text-white">{r.title}</b>{String(r.id).startsWith('local') && <em className="ml-2 rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-1 text-xs text-amber-100">fallback</em>}<p className="mt-2 text-slate-300">{r.description}</p></span></label>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs"><Badge>{r.status}</Badge><Badge>{r.priority}</Badge><Badge>owner {r.owner_name || "unassigned"}</Badge><Badge>{money.format(Number(r.value_mad || 0))}</Badge><Badge>due {r.due_date || "none"}</Badge></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>act("start", [String(r.id)])} className="rounded-xl border border-white/10 bg-white/5 py-3 font-bold">Start</button>
                  <button onClick={()=>act("complete", [String(r.id)])} className="rounded-xl border border-emerald-300/30 bg-emerald-500/15 py-3 font-bold">Complete</button>
                  <button onClick={()=>act("escalate", [String(r.id)])} className="rounded-xl border border-rose-300/30 bg-rose-500/15 py-3 font-bold">Escalate</button>
                  <button onClick={()=>act("next_action", [String(r.id)])} className="rounded-xl border border-cyan-300/30 bg-cyan-500/15 py-3 font-bold">Next</button>
                </div>
              </div>
            </article>)}
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-3">
      <InfoPanel title="Operational panels" icon={BarChart3} items={ws.panels}/>
      <InfoPanel title="Execution playbooks" icon={Sparkles} items={ws.playbooks}/>
      <InfoPanel title="Production guardrails" icon={Lock} items={["Real JSON API response required", "Audit log on every mutation", "No silent fallback without warning", "Workspace-specific module key", "Visible error and success states"]}/>
    </section>
  </main>
}

type IconComponent = React.ComponentType<{ className?: string }>

function Kpi({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: IconComponent }){ return <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5"><div className="flex justify-between"><p className="text-xs uppercase tracking-[0.25em] text-slate-200 font-bold">{label}</p><Icon className="h-5 w-5 text-white"/></div><p className="mt-3 text-3xl font-black text-white">{value}</p></div> }
function Badge({ children }: { children: React.ReactNode }){ return <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-100">{children}</span> }
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: readonly string[] }){ return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl bg-slate-950 border border-white/10 px-4 py-3 text-white">{options.map((o: string)=><option key={o} value={o}>{o}</option>)}</select> }
function ActionButton({ onClick, icon: Icon, label }: { onClick: () => void; icon: IconComponent; label: string }){ return <button onClick={onClick} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold hover:bg-white/10"><Icon className="inline h-4 w-4 mr-2" />{label}</button> }
function InfoPanel({ title, icon: Icon, items }: { title: string; icon: IconComponent; items: readonly string[] }){ return <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"><h3 className="text-xl font-black text-white"><Icon className="inline h-5 w-5 mr-2" />{title}</h3><div className="mt-4 space-y-3">{items.map((i: string)=><div key={i} className="flex items-center justify-between rounded-2xl bg-slate-950/70 border border-white/10 p-3"><span>{i}</span><ChevronRight className="h-4 w-4"/></div>)}</div></div> }
