"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"

type Stage = "planning" | "production" | "approval" | "launch-ready" | "live" | "optimization"
type Risk = "low" | "medium" | "high" | "critical"
type TaskStatus = "todo" | "doing" | "done" | "blocked"
type ApprovalStatus = "pending" | "approved" | "rejected"

type Campaign = {
  id: string
  name: string
  objective: string
  owner: string
  team: string
  channel: string
  stage: Stage
  risk: Risk
  launchDate: string
  budgetMad: number
  spentMad: number
  revenueMad: number
  leads: number
  readiness: number
  createdAt: string
  updatedAt: string
}

type Task = {
  id: string
  campaignId: string
  title: string
  owner: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  dueDate: string
  createdAt: string
}

type Approval = {
  id: string
  campaignId: string
  title: string
  owner: string
  status: ApprovalStatus
  createdAt: string
}

type RiskRecord = {
  id: string
  campaignId: string
  title: string
  level: Risk
  owner: string
  createdAt: string
}

type Log = {
  id: string
  message: string
  meta: string
  createdAt: string
}

type WorkspaceState = {
  campaigns: Campaign[]
  tasks: Task[]
  approvals: Approval[]
  risks: RiskRecord[]
  logs: Log[]
  selectedId: string | null
}

const STORAGE_KEY = "angelcare.market_os.campaign_command_center.full_workspace.v2"

const stages: Stage[] = ["planning", "production", "approval", "launch-ready", "live", "optimization"]
const risks: Risk[] = ["low", "medium", "high", "critical"]

const stageLabel: Record<Stage, string> = {
  planning: "Planning",
  production: "Production",
  approval: "Approval",
  "launch-ready": "Launch Ready",
  live: "Live",
  optimization: "Optimization",
}

const riskLabel: Record<Risk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

const emptyState: WorkspaceState = {
  campaigns: [],
  tasks: [],
  approvals: [],
  risks: [],
  logs: [],
  selectedId: null,
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function parseState(raw: string | null): WorkspaceState {
  if (!raw) return emptyState
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>
    return {
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
    }
  } catch {
    return emptyState
  }
}

function mad(value: number) {
  return `MAD ${new Intl.NumberFormat("en-US").format(Math.round(Number(value || 0)))}`
}

function roas(campaign: Campaign) {
  if (!campaign.spentMad) return 0
  return Math.round((campaign.revenueMad / campaign.spentMad) * 10) / 10
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`
}

function toneByRisk(risk: Risk) {
  if (risk === "critical" || risk === "high") return "rose"
  if (risk === "medium") return "amber"
  return "emerald"
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  )
}

function Icon({ icon, tone = "blue" }: { icon: string; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-50 text-slate-700",
  }

  return <span className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-black ${tones[tone]}`}>{icon}</span>
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${className}`}>{children}</section>
}

function EmptyCard({ title, text, action, onClick }: { title: string; text: string; action?: string; onClick?: () => void }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-bold text-slate-500">{text}</p>
      {action && onClick ? (
        <button onClick={onClick} className="mt-4 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white">
          {action}
        </button>
      ) : null}
    </div>
  )
}

export default function CampaignLifecycleExecutionWorkspace() {
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<WorkspaceState>(emptyState)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all")
  const [riskFilter, setRiskFilter] = useState<"all" | Risk>("all")
  const [activePanel, setActivePanel] = useState<"overview" | "create" | "launch" | "budget" | "risk" | "tasks" | "performance" | "approvals" | "calendar">("overview")
  const [form, setForm] = useState({
    name: "",
    objective: "",
    owner: "",
    team: "",
    channel: "",
    launchDate: "",
    budgetMad: "",
  })

  useEffect(() => {
    setState(parseState(window.localStorage.getItem(STORAGE_KEY)))
    setForm((current) => ({ ...current, launchDate: isoToday() }))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  function commit(next: WorkspaceState, message: string, meta = "Campaign lifecycle") {
    const log: Log = {
      id: id("log"),
      message,
      meta,
      createdAt: new Date().toISOString(),
    }
    setState({ ...next, logs: [log, ...next.logs].slice(0, 120) })
  }

  const selected = useMemo(() => {
    return state.campaigns.find((campaign) => campaign.id === state.selectedId) || state.campaigns[0] || null
  }, [state.campaigns, state.selectedId])

  const selectedTasks = useMemo(() => selected ? state.tasks.filter((task) => task.campaignId === selected.id) : [], [selected, state.tasks])
  const selectedRisks = useMemo(() => selected ? state.risks.filter((risk) => risk.campaignId === selected.id) : [], [selected, state.risks])
  const selectedApprovals = useMemo(() => selected ? state.approvals.filter((approval) => approval.campaignId === selected.id) : [], [selected, state.approvals])

  const filteredCampaigns = useMemo(() => {
    return state.campaigns.filter((campaign) => {
      const text = `${campaign.name} ${campaign.objective} ${campaign.owner} ${campaign.team} ${campaign.channel}`.toLowerCase()
      return (
        (!query.trim() || text.includes(query.toLowerCase())) &&
        (stageFilter === "all" || campaign.stage === stageFilter) &&
        (riskFilter === "all" || campaign.risk === riskFilter)
      )
    })
  }, [state.campaigns, query, stageFilter, riskFilter])

  const metrics = useMemo(() => {
    const totalBudget = state.campaigns.reduce((sum, c) => sum + c.budgetMad, 0)
    const totalSpend = state.campaigns.reduce((sum, c) => sum + c.spentMad, 0)
    const totalRevenue = state.campaigns.reduce((sum, c) => sum + c.revenueMad, 0)
    const leads = state.campaigns.reduce((sum, c) => sum + c.leads, 0)
    const budgetControlled = state.campaigns.length
      ? Math.round((state.campaigns.filter((c) => !c.budgetMad || c.spentMad <= c.budgetMad).length / state.campaigns.length) * 100)
      : 0

    return {
      active: state.campaigns.length,
      launchReady: state.campaigns.filter((c) => c.stage === "launch-ready" || c.stage === "live").length,
      budgetControlled,
      highRisk: state.campaigns.filter((c) => c.risk === "high" || c.risk === "critical").length,
      roas: totalSpend ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
      leads,
      tasksDue: state.tasks.filter((t) => t.status !== "done").length,
      approvalsDue: state.approvals.filter((a) => a.status === "pending").length,
      totalBudget,
      totalSpend,
      totalRevenue,
    }
  }, [state])

  function createCampaign(event?: React.FormEvent) {
    event?.preventDefault()
    if (!form.name.trim()) return

    const now = new Date().toISOString()
    const campaign: Campaign = {
      id: id("cmp"),
      name: form.name.trim(),
      objective: form.objective.trim(),
      owner: form.owner.trim() || "Unassigned",
      team: form.team.trim() || "Market-OS",
      channel: form.channel.trim() || "Unassigned",
      stage: "planning",
      risk: "low",
      launchDate: form.launchDate || isoToday(),
      budgetMad: Number(form.budgetMad || 0),
      spentMad: 0,
      revenueMad: 0,
      leads: 0,
      readiness: 0,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...state, campaigns: [campaign, ...state.campaigns], selectedId: campaign.id }, "Campaign created", campaign.name)
    setForm({ name: "", objective: "", owner: "", team: "", channel: "", launchDate: isoToday(), budgetMad: "" })
    setActivePanel("overview")
  }

  function updateCampaign(idValue: string, patch: Partial<Campaign>, message = "Campaign updated") {
    const campaign = state.campaigns.find((c) => c.id === idValue)
    if (!campaign) return

    commit(
      {
        ...state,
        selectedId: idValue,
        campaigns: state.campaigns.map((c) => c.id === idValue ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c),
      },
      message,
      campaign.name,
    )
  }

  function selectCampaign(idValue: string) {
    setState({ ...state, selectedId: idValue })
  }

  function addTask(campaignId = selected?.id) {
    if (!campaignId) return
    const task: Task = {
      id: id("task"),
      campaignId,
      title: "New execution task",
      owner: "Market-OS",
      status: "todo",
      priority: "medium",
      dueDate: isoToday(),
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, tasks: [task, ...state.tasks] }, "Task created", task.title)
  }

  function addRisk(campaignId = selected?.id) {
    if (!campaignId) return
    const risk: RiskRecord = {
      id: id("risk"),
      campaignId,
      title: "Operational risk detected",
      level: "medium",
      owner: "Market-OS",
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, risks: [risk, ...state.risks] }, "Risk logged", risk.title)
  }

  function addApproval(campaignId = selected?.id) {
    if (!campaignId) return
    const approval: Approval = {
      id: id("approval"),
      campaignId,
      title: "Campaign approval request",
      owner: "Marketing Director",
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, approvals: [approval, ...state.approvals] }, "Approval requested", approval.title)
  }

  function runLaunchReadiness() {
    if (!selected) return
    const doneTasks = selectedTasks.filter((t) => t.status === "done").length
    const taskScore = selectedTasks.length ? Math.round((doneTasks / selectedTasks.length) * 35) : 0
    const approvalScore = selectedApprovals.length && selectedApprovals.every((a) => a.status === "approved") ? 25 : 0
    const budgetScore = !selected.budgetMad || selected.spentMad <= selected.budgetMad ? 20 : 8
    const riskPenalty = selectedRisks.filter((r) => r.level === "high" || r.level === "critical").length * 15
    const readiness = Math.max(0, Math.min(100, 20 + taskScore + approvalScore + budgetScore - riskPenalty))

    updateCampaign(selected.id, {
      readiness,
      stage: readiness >= 85 ? "launch-ready" : readiness >= 55 ? "approval" : selected.stage,
    }, "Launch readiness checked")
  }

  function advanceStage() {
    if (!selected) return
    const index = stages.indexOf(selected.stage)
    updateCampaign(selected.id, { stage: stages[Math.min(stages.length - 1, index + 1)] }, "Campaign advanced")
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `angelcare-campaign-command-center-${isoToday()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    commit(state, "Workspace exported", "JSON export")
  }

  const kpis = [
    ["Active Campaigns", metrics.active, "Live records", "▣", "blue"],
    ["Launch Readiness", metrics.launchReady, "Ready/live", "◇", "emerald"],
    ["Budget Controlled", `${metrics.budgetControlled}%`, "Within MAD budget", "◔", "emerald"],
    ["High Risk", metrics.highRisk, "Needs action", "△", "rose"],
    ["ROAS", `${metrics.roas}x`, "MAD revenue/spend", "◈", "violet"],
    ["Leads", metrics.leads, "Total captured", "◌", "blue"],
    ["Tasks Due", metrics.tasksDue, "Open tasks", "□", "amber"],
    ["Approvals Due", metrics.approvalsDue, "Pending approvals", "⬡", "violet"],
  ] as const

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-950">
        <Card className="p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">ANGELCARE Market-OS</p>
          <h1 className="mt-2 text-3xl font-black">Loading campaign command center…</h1>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen xl:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">AC</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">ANGELCARE</p>
              <h2 className="text-lg font-black">Market-OS</h2>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-500">Campaign OS</p>
            <p className="mt-1 text-sm font-black text-slate-950">Enterprise Workspace</p>
          </div>

          <nav className="mt-6 grid gap-1 text-sm font-black text-slate-700">
            {[
              ["Command Board", "⌘", "overview"],
              ["Execution Workspace", "✣", "overview"],
              ["Campaigns", "▣", "overview"],
              ["Launch Control", "◇", "launch"],
              ["Budget Cockpit", "MAD", "budget"],
              ["Risk Center", "△", "risk"],
              ["Performance Pulse", "↗", "performance"],
              ["Approvals", "⬡", "approvals"],
              ["Calendar", "◷", "calendar"],
            ].map(([labelText, icon, panel]) => (
              <button
                key={labelText}
                onClick={() => setActivePanel(panel as typeof activePanel)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  activePanel === panel ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-[11px]">{icon}</span>
                <span className="flex-1">{labelText}</span>
                {labelText === "Approvals" && metrics.approvalsDue ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-700">{metrics.approvalsDue}</span> : null}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Quick Filters</p>
            <div className="mt-3 grid gap-2 text-xs font-black text-slate-600">
              <button onClick={() => setStageFilter("all")} className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">All campaigns <span>{state.campaigns.length}</span></button>
              <button onClick={() => setRiskFilter("high")} className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">High priority <span>{metrics.highRisk}</span></button>
              <button onClick={() => setActivePanel("approvals")} className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">Needs approval <span>{metrics.approvalsDue}</span></button>
            </div>
          </div>

          <Link href="/market-os" className="mt-4 flex rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">← Back to Market OS</Link>
        </aside>

        <section className="min-w-0 bg-slate-50/70">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">System Status</p>
                  <p className="text-xs font-black text-emerald-900">All systems operational</p>
                </div>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaigns, tasks, owners, or keywords..." className="h-12 min-w-[280px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setActivePanel("create")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">+ Create Campaign</button>
                <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50">Launch Control</button>
                <button onClick={() => setActivePanel("budget")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Budget Cockpit</button>
                <button onClick={() => setActivePanel("risk")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Risk Center</button>
                <button onClick={() => setActivePanel("performance")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Performance</button>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5">
            <section className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-950">ANGELCARE Campaign Command Center</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">Execute with precision. Control risk. Maximize performance.</p>
              </div>
              <button onClick={exportWorkspace} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Export Workspace</button>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              {kpis.map(([labelText, value, note, icon, tone]) => (
                <Card key={labelText} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{labelText}</p>
                      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
                    </div>
                    <Icon icon={icon} tone={tone} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">{note}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-2/3 rounded-full bg-blue-500" />
                  </div>
                </Card>
              ))}
            </section>

            {activePanel === "create" ? (
              <Card className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Create Campaign</p>
                    <h2 className="mt-1 text-2xl font-black">Operational campaign creation studio</h2>
                  </div>
                  <button onClick={() => setActivePanel("overview")} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black">Close</button>
                </div>

                <form onSubmit={createCampaign} className="grid gap-3 lg:grid-cols-4">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" />
                  <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} placeholder="Team" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Objective" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" />
                  <input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="Channel" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input type="date" value={form.launchDate} onChange={(e) => setForm({ ...form, launchDate: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={form.budgetMad} onChange={(e) => setForm({ ...form, budgetMad: e.target.value })} placeholder="Budget MAD" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Create campaign</button>
                </form>
              </Card>
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="space-y-5">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Campaign Execution Board</h2>
                    <button onClick={() => setStageFilter("all")} className="text-xs font-black text-blue-600">View All Campaigns</button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
                    {stages.map((stage) => {
                      const count = state.campaigns.filter((campaign) => campaign.stage === stage).length
                      return (
                        <button key={stage} onClick={() => setStageFilter(stage)} className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${stageFilter === stage ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                          <p className="text-xs font-black text-blue-700">{stageLabel[stage]}</p>
                          <p className="mt-2 text-2xl font-black">{count}</p>
                          <p className="text-xs font-bold text-slate-500">Campaigns</p>
                        </button>
                      )
                    })}
                  </div>
                </Card>

                <section className="grid gap-5 xl:grid-cols-[1.1fr_0.8fr_0.9fr]">
                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Budget & ROI Cockpit</h2>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Total Budget</p><p className="mt-2 text-xl font-black">{mad(metrics.totalBudget)}</p></div>
                      <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Total Spend</p><p className="mt-2 text-xl font-black">{mad(metrics.totalSpend)}</p></div>
                      <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">ROI Forecast</p><p className="mt-2 text-xl font-black">{metrics.roas}x</p></div>
                    </div>
                    <div className="mt-5 space-y-2">
                      {filteredCampaigns.slice(0, 5).length ? filteredCampaigns.slice(0, 5).map((campaign) => (
                        <button key={campaign.id} onClick={() => selectCampaign(campaign.id)} className="grid w-full gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 md:grid-cols-[1fr_120px_90px_90px]">
                          <span className="text-sm font-black">{campaign.name}</span>
                          <span className="text-xs font-bold text-slate-500">{mad(campaign.spentMad)}</span>
                          <span className="text-xs font-black text-emerald-700">{roas(campaign)}x</span>
                          <Pill tone={toneByRisk(campaign.risk)}>{riskLabel[campaign.risk]}</Pill>
                        </button>
                      )) : <EmptyCard title="No campaigns yet" text="Create campaigns to activate Budget & ROI." />}
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Launch Readiness</h2>
                    <div className="mt-5 grid place-items-center rounded-3xl bg-emerald-50 p-6">
                      <p className="text-5xl font-black text-emerald-700">{selected ? pct(selected.readiness) : "—"}</p>
                      <p className="mt-2 text-sm font-black text-emerald-900">{selected ? "Launch Score" : "Select campaign"}</p>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                      <div className="flex justify-between"><span>Tasks Completed</span><span>{selectedTasks.filter((t) => t.status === "done").length} / {selectedTasks.length}</span></div>
                      <div className="flex justify-between"><span>Approvals</span><span>{selectedApprovals.filter((a) => a.status === "approved").length} / {selectedApprovals.length}</span></div>
                      <div className="flex justify-between"><span>Risk Review</span><span>{selectedRisks.length} open</span></div>
                    </div>
                    <button onClick={runLaunchReadiness} disabled={!selected} className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Run Launch Readiness Check</button>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Risk & Escalation</h2>
                    <div className="mt-5 grid gap-2">
                      {selectedRisks.slice(0, 4).length ? selectedRisks.slice(0, 4).map((risk) => (
                        <div key={risk.id} className="rounded-2xl border border-slate-200 p-3">
                          <Pill tone={toneByRisk(risk.level)}>{riskLabel[risk.level]}</Pill>
                          <p className="mt-2 text-sm font-black">{risk.title}</p>
                          <p className="text-xs font-bold text-slate-500">Owner: {risk.owner}</p>
                        </div>
                      )) : <EmptyCard title="No risks logged" text="Use Risk Center to flag risks." />}
                    </div>
                    <button onClick={() => addRisk()} disabled={!selected} className="mt-4 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Go to Risk Center</button>
                  </Card>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Live Performance Analytics</h2>
                    <div className="mt-5 grid h-[260px] place-items-center rounded-3xl bg-slate-50 p-5">
                      <div className="w-full space-y-4">
                        {["Spend", "Leads", "ROAS"].map((item, index) => (
                          <div key={item}>
                            <div className="flex justify-between text-xs font-black text-slate-500"><span>{item}</span><span>{index === 0 ? mad(metrics.totalSpend) : index === 1 ? metrics.leads : `${metrics.roas}x`}</span></div>
                            <div className="mt-2 h-3 rounded-full bg-white">
                              <div className={`h-full rounded-full ${index === 0 ? "bg-blue-500" : index === 1 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${Math.min(90, 20 + (index + 1) * 20 + state.campaigns.length * 3)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Calendar / Timeline</h2>
                    <div className="mt-5 grid gap-2 md:grid-cols-5">
                      {stages.slice(0, 5).map((stage) => (
                        <div key={stage} className="min-h-[170px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-black text-slate-500">{stageLabel[stage]}</p>
                          <div className="mt-3 space-y-2">
                            {state.campaigns.filter((c) => c.stage === stage).slice(0, 2).map((campaign) => (
                              <button key={campaign.id} onClick={() => selectCampaign(campaign.id)} className="w-full rounded-xl bg-white p-2 text-left text-[11px] font-bold text-slate-700">
                                {campaign.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              </div>

              <aside className="space-y-5">
                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Tasks / Execution Queue</h2>
                  <div className="mt-4 grid gap-2">
                    <button onClick={() => addTask()} disabled={!selected} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">+ Add Task</button>
                    {selectedTasks.slice(0, 5).length ? selectedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-black">{task.title}</p>
                        <div className="mt-2 flex justify-between"><Pill tone={task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : "blue"}>{task.status}</Pill><span className="text-xs font-bold text-slate-500">{task.dueDate}</span></div>
                      </div>
                    )) : <EmptyCard title="No tasks" text="Add tasks for the selected campaign." />}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Quick Actions</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setActivePanel("create")} className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-xs font-black text-blue-700">Create Campaign</button>
                    <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 disabled:opacity-50">Launch Control</button>
                    <button onClick={() => setActivePanel("budget")} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3 text-xs font-black text-violet-700">Budget Cockpit</button>
                    <button onClick={() => addRisk()} disabled={!selected} className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 disabled:opacity-50">Risk Center</button>
                    <button onClick={() => setActivePanel("performance")} className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3 text-xs font-black text-sky-700">Performance</button>
                    <button onClick={() => addApproval()} disabled={!selected} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-xs font-black text-amber-700 disabled:opacity-50">Approvals</button>
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Team Activity / Approvals / Messaging</h2>
                  <div className="mt-4 space-y-2">
                    {state.logs.slice(0, 5).length ? state.logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-black">{log.message}</p>
                        <p className="text-xs font-bold text-slate-500">{log.meta}</p>
                      </div>
                    )) : <EmptyCard title="No activity yet" text="Workspace activity appears after real actions." />}
                  </div>
                </Card>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
