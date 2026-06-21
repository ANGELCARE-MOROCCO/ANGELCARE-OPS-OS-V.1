"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"

type CampaignStage =
  | "planning"
  | "production"
  | "approval"
  | "launch-ready"
  | "live"
  | "optimization"

type CampaignRisk = "low" | "medium" | "high" | "critical"
type TaskStatus = "todo" | "doing" | "done" | "blocked"
type ApprovalStatus = "pending" | "approved" | "rejected"

type CampaignRecord = {
  id: string
  name: string
  objective: string
  owner: string
  team: string
  audience: string
  channel: string
  stage: CampaignStage
  risk: CampaignRisk
  launchDate: string
  budgetMad: number
  spentMad: number
  revenueMad: number
  leads: number
  readiness: number
  notes: string
  createdAt: string
  updatedAt: string
}

type CampaignTask = {
  id: string
  campaignId: string
  title: string
  owner: string
  status: TaskStatus
  dueDate: string
  priority: "low" | "medium" | "high"
  createdAt: string
}

type CampaignApproval = {
  id: string
  campaignId: string
  title: string
  status: ApprovalStatus
  owner: string
  createdAt: string
}

type CampaignRiskRecord = {
  id: string
  campaignId: string
  title: string
  level: CampaignRisk
  owner: string
  createdAt: string
}

type ActivityLog = {
  id: string
  message: string
  meta: string
  createdAt: string
}

type WorkspaceState = {
  campaigns: CampaignRecord[]
  tasks: CampaignTask[]
  approvals: CampaignApproval[]
  risks: CampaignRiskRecord[]
  logs: ActivityLog[]
  selectedId: string | null
}

const STORAGE_KEY = "angelcare.market_os.campaign_lifecycle.execution_workspace.v1"

const stages: CampaignStage[] = ["planning", "production", "approval", "launch-ready", "live", "optimization"]
const risks: CampaignRisk[] = ["low", "medium", "high", "critical"]

const emptyState: WorkspaceState = {
  campaigns: [],
  tasks: [],
  approvals: [],
  risks: [],
  logs: [],
  selectedId: null,
}

const stageLabel: Record<CampaignStage, string> = {
  planning: "Planning",
  production: "Production",
  approval: "Approval",
  "launch-ready": "Launch Ready",
  live: "Live",
  optimization: "Optimization",
}

const riskLabel: Record<CampaignRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function money(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

function roas(campaign: CampaignRecord) {
  if (!campaign.spentMad) return 0
  return Math.round((campaign.revenueMad / campaign.spentMad) * 10) / 10
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function safeParse(raw: string | null): WorkspaceState {
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

function StatusPill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
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

function IconBox({ icon, tone = "blue" }: { icon: string; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-50 text-slate-700",
  }

  return (
    <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-black shadow-sm ${tones[tone]}`}>
      {icon}
    </span>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] ${className}`}>
      {children}
    </section>
  )
}

export default function CampaignLifecycleExecutionWorkspace() {
  const [state, setState] = useState<WorkspaceState>(emptyState)
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<"all" | CampaignStage>("all")
  const [riskFilter, setRiskFilter] = useState<"all" | CampaignRisk>("all")
  const [activePanel, setActivePanel] = useState<"overview" | "create" | "launch" | "budget" | "risk" | "tasks" | "performance">("overview")
  const [form, setForm] = useState({
    name: "",
    objective: "",
    owner: "",
    team: "",
    audience: "",
    channel: "",
    budgetMad: 0,
    launchDate: todayIso(),
  })

  useEffect(() => {
    setState(safeParse(window.localStorage.getItem(STORAGE_KEY)))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  function commit(next: WorkspaceState, message: string, meta = "Campaign lifecycle") {
    const now = new Date().toISOString()
    const log: ActivityLog = {
      id: uid("log"),
      message,
      meta,
      createdAt: now,
    }

    setState({
      ...next,
      logs: [log, ...next.logs].slice(0, 80),
    })
  }

  const selected = useMemo(() => {
    return state.campaigns.find((campaign) => campaign.id === state.selectedId) || state.campaigns[0] || null
  }, [state.campaigns, state.selectedId])

  const selectedTasks = useMemo(() => {
    if (!selected) return []
    return state.tasks.filter((task) => task.campaignId === selected.id)
  }, [state.tasks, selected])

  const selectedRisks = useMemo(() => {
    if (!selected) return []
    return state.risks.filter((risk) => risk.campaignId === selected.id)
  }, [state.risks, selected])

  const selectedApprovals = useMemo(() => {
    if (!selected) return []
    return state.approvals.filter((approval) => approval.campaignId === selected.id)
  }, [state.approvals, selected])

  const filteredCampaigns = useMemo(() => {
    return state.campaigns.filter((campaign) => {
      const haystack = `${campaign.name} ${campaign.objective} ${campaign.owner} ${campaign.team} ${campaign.audience} ${campaign.channel}`.toLowerCase()
      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase())
      const matchesStage = stageFilter === "all" || campaign.stage === stageFilter
      const matchesRisk = riskFilter === "all" || campaign.risk === riskFilter
      return matchesQuery && matchesStage && matchesRisk
    })
  }, [state.campaigns, query, stageFilter, riskFilter])

  const metrics = useMemo(() => {
    const activeCampaigns = state.campaigns.length
    const launchReady = state.campaigns.filter((campaign) => campaign.stage === "launch-ready" || campaign.stage === "live").length
    const budgetControlled = state.campaigns.length
      ? Math.round(
          (state.campaigns.filter((campaign) => campaign.budgetMad <= 0 || campaign.spentMad <= campaign.budgetMad).length / state.campaigns.length) * 100,
        )
      : 0
    const highRisk = state.campaigns.filter((campaign) => campaign.risk === "high" || campaign.risk === "critical").length
    const spend = state.campaigns.reduce((sum, campaign) => sum + Number(campaign.spentMad || 0), 0)
    const revenue = state.campaigns.reduce((sum, campaign) => sum + Number(campaign.revenueMad || 0), 0)
    const roi = spend ? Math.round((revenue / spend) * 100) / 100 : 0
    const leads = state.campaigns.reduce((sum, campaign) => sum + Number(campaign.leads || 0), 0)
    const tasksDue = state.tasks.filter((task) => task.status !== "done").length
    const approvalsDue = state.approvals.filter((approval) => approval.status === "pending").length

    return { activeCampaigns, launchReady, budgetControlled, highRisk, roi, leads, tasksDue, approvalsDue, spend, revenue }
  }, [state])

  function createCampaign(event?: React.FormEvent) {
    event?.preventDefault()

    if (!form.name.trim()) return

    const now = new Date().toISOString()
    const campaign: CampaignRecord = {
      id: uid("cmp"),
      name: form.name.trim(),
      objective: form.objective.trim(),
      owner: form.owner.trim() || "Unassigned",
      team: form.team.trim() || "Market OS",
      audience: form.audience.trim(),
      channel: form.channel.trim(),
      stage: "planning",
      risk: "low",
      launchDate: form.launchDate || todayIso(),
      budgetMad: Number(form.budgetMad || 0),
      spentMad: 0,
      revenueMad: 0,
      leads: 0,
      readiness: 0,
      notes: "",
      createdAt: now,
      updatedAt: now,
    }

    commit(
      {
        ...state,
        campaigns: [campaign, ...state.campaigns],
        selectedId: campaign.id,
      },
      "Campaign created",
      campaign.name,
    )

    setForm({
      name: "",
      objective: "",
      owner: "",
      team: "",
      audience: "",
      channel: "",
      budgetMad: 0,
      launchDate: todayIso(),
    })
    setActivePanel("overview")
  }

  function updateCampaign(id: string, patch: Partial<CampaignRecord>, message = "Campaign updated") {
    const campaign = state.campaigns.find((item) => item.id === id)
    if (!campaign) return

    commit(
      {
        ...state,
        campaigns: state.campaigns.map((item) =>
          item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
        ),
        selectedId: id,
      },
      message,
      campaign.name,
    )
  }

  function addTask(campaignId?: string) {
    const target = campaignId || selected?.id
    if (!target) return

    const task: CampaignTask = {
      id: uid("task"),
      campaignId: target,
      title: "New operational task",
      owner: "Market OS",
      status: "todo",
      dueDate: todayIso(),
      priority: "medium",
      createdAt: new Date().toISOString(),
    }

    commit(
      {
        ...state,
        tasks: [task, ...state.tasks],
        selectedId: target,
      },
      "Task created",
      task.title,
    )
  }

  function addApproval(campaignId?: string) {
    const target = campaignId || selected?.id
    if (!target) return

    const approval: CampaignApproval = {
      id: uid("approval"),
      campaignId: target,
      title: "Campaign approval request",
      owner: "Marketing Director",
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    commit(
      {
        ...state,
        approvals: [approval, ...state.approvals],
        selectedId: target,
      },
      "Approval requested",
      approval.title,
    )
  }

  function addRisk(campaignId?: string) {
    const target = campaignId || selected?.id
    if (!target) return

    const risk: CampaignRiskRecord = {
      id: uid("risk"),
      campaignId: target,
      title: "Operational risk flagged",
      level: "medium",
      owner: "Market OS",
      createdAt: new Date().toISOString(),
    }

    commit(
      {
        ...state,
        risks: [risk, ...state.risks],
        selectedId: target,
      },
      "Risk flagged",
      risk.title,
    )
  }

  function runLaunchReadiness() {
    if (!selected) return

    const completedTasks = selectedTasks.filter((task) => task.status === "done").length
    const totalTasks = selectedTasks.length
    const approvalsOk = selectedApprovals.length > 0 && selectedApprovals.every((approval) => approval.status === "approved")
    const riskPenalty = selectedRisks.filter((risk) => risk.level === "high" || risk.level === "critical").length * 15
    const taskScore = totalTasks ? Math.round((completedTasks / totalTasks) * 35) : 0
    const approvalScore = approvalsOk ? 25 : 0
    const budgetScore = selected.budgetMad <= 0 || selected.spentMad <= selected.budgetMad ? 20 : 5
    const baseScore = selected.objective ? 20 : 10
    const nextReadiness = clamp(baseScore + taskScore + approvalScore + budgetScore - riskPenalty)

    updateCampaign(
      selected.id,
      {
        readiness: nextReadiness,
        stage: nextReadiness >= 85 ? "launch-ready" : nextReadiness >= 55 ? "approval" : selected.stage,
      },
      "Launch readiness checked",
    )
  }

  function exportWorkspace() {
    const payload = JSON.stringify(state, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `angelcare-campaign-lifecycle-${todayIso()}.json`
    anchor.click()
    URL.revokeObjectURL(url)

    commit(state, "Workspace exported", "JSON")
  }

  const kpiCards = [
    { label: "Active Campaigns", value: String(metrics.activeCampaigns), note: "Live records", icon: "▣", tone: "blue" as const },
    { label: "Launch Ready", value: String(metrics.launchReady), note: "Ready or live", icon: "◇", tone: "emerald" as const },
    { label: "Budget Controlled", value: `${metrics.budgetControlled}%`, note: "Within budget", icon: "◔", tone: "emerald" as const },
    { label: "High Risk", value: String(metrics.highRisk), note: "High or critical", icon: "△", tone: "rose" as const },
    { label: "ROAS", value: `${metrics.roi}x`, note: "Revenue / spend", icon: "◈", tone: "violet" as const },
    { label: "Leads", value: String(metrics.leads), note: "Total captured", icon: "◌", tone: "blue" as const },
    { label: "Tasks Due", value: String(metrics.tasksDue), note: "Open tasks", icon: "□", tone: "amber" as const },
    { label: "Approval Queue", value: String(metrics.approvalsDue), note: "Pending approvals", icon: "⬡", tone: "violet" as const },
  ]

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-950">
        <Card className="p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">ANGELCARE Campaign OS</p>
          <h1 className="mt-3 text-3xl font-black">Loading execution workspace…</h1>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen xl:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">
              AC
            </div>
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
              ["Create Campaign", "+", "create"],
              ["Launch Control", "◇", "launch"],
              ["Budget Cockpit", "MAD", "budget"],
              ["Risk Center", "△", "risk"],
              ["Execution Tasks", "□", "tasks"],
              ["Performance Pulse", "↗", "performance"],
            ].map(([labelText, icon, panel]) => (
              <button
                key={labelText}
                onClick={() => setActivePanel(panel as typeof activePanel)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  activePanel === panel ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-[11px]">{icon}</span>
                <span>{labelText}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Environment</p>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-sm font-black text-emerald-900">Production</p>
            <p className="text-xs font-bold text-emerald-700">Live workspace state</p>
          </div>

          <Link href="/market-os" className="mt-4 flex rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">
            ← Back to Market OS
          </Link>
        </aside>

        <section className="min-w-0 bg-slate-50/70">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">System Status</p>
                  <p className="text-xs font-black text-emerald-900">All systems operational</p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search campaigns, tasks, owners, or keywords..."
                  className="h-12 min-w-[280px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setActivePanel("create")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm">
                  + Create Campaign
                </button>
                <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50">
                  Launch Control
                </button>
                <button onClick={() => setActivePanel("budget")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Budget Cockpit
                </button>
                <button onClick={() => setActivePanel("risk")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Risk Center
                </button>
                <button onClick={exportWorkspace} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Export
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5">
            <section className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">ANGELCARE Campaign Lifecycle</p>
                <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">Campaign Command Center</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">Execute with precision. Control risk. Maximize performance.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500">
                {state.campaigns.length ? `${state.campaigns.length} live campaign records` : "No campaign records yet"}
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              {kpiCards.map((card) => (
                <Card key={card.label} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                      <p className="mt-3 text-2xl font-black text-slate-950">{card.value}</p>
                    </div>
                    <IconBox icon={card.icon} tone={card.tone} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">{card.note}</p>
                </Card>
              ))}
            </section>

            {activePanel === "create" ? (
              <Card className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Creation Studio</p>
                    <h2 className="mt-1 text-2xl font-black">Create operational campaign record</h2>
                  </div>
                  <button onClick={() => setActivePanel("overview")} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black">Close</button>
                </div>

                <form onSubmit={createCampaign} className="grid gap-3 lg:grid-cols-4">
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Campaign name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" />
                  <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} placeholder="Team" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} placeholder="Objective" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" />
                  <input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} placeholder="Audience" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} placeholder="Channel" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input type="number" value={form.budgetMad} onChange={(event) => setForm({ ...form, budgetMad: Number(event.target.value) })} placeholder="Budget MAD" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <input type="date" value={form.launchDate} onChange={(event) => setForm({ ...form, launchDate: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" />
                  <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Create campaign</button>
                </form>
              </Card>
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
              <div className="space-y-5">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Campaign Execution Board</h2>
                    <Link href="/market-os/campaign-lifecycle" className="text-xs font-black text-blue-600">View all campaigns</Link>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
                    {stages.map((stage) => {
                      const count = state.campaigns.filter((campaign) => campaign.stage === stage).length
                      return (
                        <button
                          key={stage}
                          onClick={() => setStageFilter(stage)}
                          className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                            stageFilter === stage ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                          }`}
                        >
                          <p className="text-xs font-black text-blue-700">{stageLabel[stage]}</p>
                          <p className="mt-2 text-2xl font-black">{count}</p>
                          <p className="text-xs font-bold text-slate-500">Campaigns</p>
                        </button>
                      )
                    })}
                  </div>
                </Card>

                <section className="grid gap-5 xl:grid-cols-3">
                  <Card className="p-5 xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Budget & ROI Cockpit</h2>
                      <button onClick={() => setActivePanel("budget")} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black">Open Budget</button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">Total Budget</p>
                        <p className="mt-2 text-2xl font-black">MAD {money(state.campaigns.reduce((sum, campaign) => sum + campaign.budgetMad, 0))}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">Total Spend</p>
                        <p className="mt-2 text-2xl font-black">MAD {money(metrics.spend)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">ROAS</p>
                        <p className="mt-2 text-2xl font-black">{metrics.roi}x</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {filteredCampaigns.slice(0, 5).map((campaign) => (
                        <button
                          key={campaign.id}
                          onClick={() => setState({ ...state, selectedId: campaign.id })}
                          className="grid w-full gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 md:grid-cols-[1fr_110px_110px_90px]"
                        >
                          <span className="text-sm font-black">{campaign.name}</span>
                          <span className="text-sm font-bold text-slate-500">MAD {money(campaign.spentMad)}</span>
                          <span className="text-sm font-bold text-slate-500">{roas(campaign)}x ROAS</span>
                          <StatusPill tone={campaign.risk === "high" || campaign.risk === "critical" ? "rose" : "emerald"}>{riskLabel[campaign.risk]}</StatusPill>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Launch Readiness</h2>
                    <div className="mt-5 grid place-items-center rounded-3xl bg-emerald-50 p-6">
                      <p className="text-5xl font-black text-emerald-700">{selected ? `${selected.readiness}%` : "—"}</p>
                      <p className="mt-2 text-sm font-black text-emerald-900">{selected ? selected.name : "Select a campaign"}</p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Run readiness check</button>
                      <button onClick={() => selected && addApproval(selected.id)} disabled={!selected} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black disabled:opacity-50">Request approval</button>
                    </div>
                  </Card>
                </section>

                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Campaign Portfolio / Execution Board</h2>
                    <div className="flex gap-2">
                      <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as typeof stageFilter)} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black">
                        <option value="all">All stages</option>
                        {stages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}
                      </select>
                      <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black">
                        <option value="all">All risks</option>
                        {risks.map((risk) => <option key={risk} value={risk}>{riskLabel[risk]}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    {filteredCampaigns.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                        <h3 className="text-2xl font-black">No campaign records yet</h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">Create a campaign to activate the execution workspace.</p>
                        <button onClick={() => setActivePanel("create")} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">+ Create campaign</button>
                      </div>
                    ) : (
                      <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
                        <thead>
                          <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            <th className="px-3 py-2">Campaign</th>
                            <th className="px-3 py-2">Stage</th>
                            <th className="px-3 py-2">Readiness</th>
                            <th className="px-3 py-2">Risk</th>
                            <th className="px-3 py-2">Owner</th>
                            <th className="px-3 py-2">Spend</th>
                            <th className="px-3 py-2">ROAS</th>
                            <th className="px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCampaigns.map((campaign) => (
                            <tr key={campaign.id} className="rounded-2xl bg-white shadow-sm">
                              <td className="rounded-l-2xl px-3 py-4 font-black">{campaign.name}</td>
                              <td className="px-3 py-4"><StatusPill tone="blue">{stageLabel[campaign.stage]}</StatusPill></td>
                              <td className="px-3 py-4">
                                <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${clamp(campaign.readiness)}%` }} />
                                </div>
                                <p className="mt-1 text-xs font-black">{campaign.readiness}%</p>
                              </td>
                              <td className="px-3 py-4"><StatusPill tone={campaign.risk === "high" || campaign.risk === "critical" ? "rose" : "emerald"}>{riskLabel[campaign.risk]}</StatusPill></td>
                              <td className="px-3 py-4 font-bold text-slate-600">{campaign.owner}</td>
                              <td className="px-3 py-4 font-bold text-slate-600">MAD {money(campaign.spentMad)}</td>
                              <td className="px-3 py-4 font-black">{roas(campaign)}x</td>
                              <td className="rounded-r-2xl px-3 py-4">
                                <button onClick={() => setState({ ...state, selectedId: campaign.id })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">Select</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>

              <aside className="space-y-5">
                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Tasks / Execution Queue</h2>
                  <div className="mt-4 grid gap-2">
                    <button onClick={() => addTask()} disabled={!selected} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">+ Add task</button>
                    {selectedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-black">{task.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">{task.owner}</span>
                          <StatusPill tone={task.status === "blocked" ? "rose" : task.status === "done" ? "emerald" : "blue"}>{task.status}</StatusPill>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Risk & Escalation</h2>
                  <div className="mt-4 grid gap-2">
                    <button onClick={() => addRisk()} disabled={!selected} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Log risk</button>
                    {selectedRisks.slice(0, 4).map((risk) => (
                      <div key={risk.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-black">{risk.title}</p>
                        <StatusPill tone={risk.level === "high" || risk.level === "critical" ? "rose" : "amber"}>{riskLabel[risk.level]}</StatusPill>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Quick Actions</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setActivePanel("create")} className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-xs font-black text-blue-700">Create</button>
                    <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 disabled:opacity-50">Launch</button>
                    <button onClick={() => setActivePanel("budget")} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3 text-xs font-black text-violet-700">Budget</button>
                    <button onClick={() => addRisk()} disabled={!selected} className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 disabled:opacity-50">Risk</button>
                    <button onClick={() => setActivePanel("performance")} className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3 text-xs font-black text-sky-700">Performance</button>
                    <button onClick={() => addApproval()} disabled={!selected} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-xs font-black text-amber-700 disabled:opacity-50">Approval</button>
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Team Activity</h2>
                  <div className="mt-4 space-y-2">
                    {state.logs.slice(0, 6).length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No activity yet.</p>
                    ) : (
                      state.logs.slice(0, 6).map((log) => (
                        <div key={log.id} className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-sm font-black">{log.message}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{log.meta}</p>
                        </div>
                      ))
                    )}
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
