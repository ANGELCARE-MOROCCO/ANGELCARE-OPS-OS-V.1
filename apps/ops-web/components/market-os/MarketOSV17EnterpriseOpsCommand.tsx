"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type Status = "operational" | "attention" | "blocked" | "review" | "completed"
type Priority = "P0" | "P1" | "P2" | "P3"

type OpsLayer = {
  id: string
  title: string
  domain: string
  owner: string
  route: string
  status: Status
  priority: Priority
  queue: number
  blockers: number
  approvals: number
  progress: number
  valueMad: number
  description: string
  actions: string[]
}

type Log = {
  id: string
  at: string
  layer: string
  action: string
}

const coreSubmodules = [
  {
    title: "Campaign Lifecycle",
    route: "/market-os/campaign-lifecycle",
    owner: "Growth Lead",
    purpose: "Campaign launches, budget pressure, audience control, execution stages and risks.",
    kpis: ["12 active", "4 approvals", "2 blocked"],
  },
  {
    title: "Content Command Center",
    route: "/market-os/content-command-center",
    owner: "Content Manager",
    purpose: "Production pipeline, editorial approvals, creative assets, publishing and workloads.",
    kpis: ["43 assets", "9 review", "16 scheduled"],
  },
  {
    title: "SEO Blog Workspace",
    route: "/market-os/seo-blog-workspace",
    owner: "SEO Lead",
    purpose: "Keyword clusters, blog production, meta optimization, editorial calendar and SEO scoring.",
    kpis: ["21 briefs", "8 drafts", "6 ready"],
  },
  {
    title: "Ambassadors Engine",
    route: "/market-os/ambassadors",
    owner: "Community Lead",
    purpose: "Ambassador missions, referral tracking, incentives, performance, content compliance and inactivity recovery.",
    kpis: ["32 active", "8 missions", "5 inactive"],
  },
]

const initialLayers: OpsLayer[] = [
  {
    id: "campaign-launch",
    title: "Campaign Launch Control",
    domain: "Campaign Lifecycle",
    owner: "Growth Lead",
    route: "/market-os/campaign-lifecycle",
    status: "attention",
    priority: "P0",
    queue: 12,
    blockers: 2,
    approvals: 4,
    progress: 61,
    valueMad: 640000,
    description: "Launch readiness, budget gate, creative approvals, channel activation and conversion pressure.",
    actions: ["Create Launch Task", "Approve Launch", "Pause Campaign", "Escalate Budget", "Assign Owner", "Open Launch Checklist"],
  },
  {
    id: "campaign-risk",
    title: "Campaign Risk & Recovery",
    domain: "Campaign Lifecycle",
    owner: "Campaign Ops",
    route: "/market-os/campaign-lifecycle",
    status: "blocked",
    priority: "P0",
    queue: 7,
    blockers: 4,
    approvals: 1,
    progress: 38,
    valueMad: 390000,
    description: "Recover campaigns with poor CPL, weak conversion, missing attribution or launch blockers.",
    actions: ["Open Risk", "Repair Attribution", "Create Recovery Task", "Escalate Owner", "Rebalance Budget", "Audit Funnel"],
  },
  {
    id: "content-production",
    title: "Content Production Desk",
    domain: "Content Command Center",
    owner: "Content Manager",
    route: "/market-os/content-command-center",
    status: "review",
    priority: "P1",
    queue: 43,
    blockers: 3,
    approvals: 9,
    progress: 54,
    valueMad: 180000,
    description: "Production queue, copy, creative requirements, review, publishing deadlines and workload control.",
    actions: ["Create Asset", "Assign Writer", "Send Review", "Approve Asset", "Schedule Publish", "Recover Stuck Asset"],
  },
  {
    id: "seo-production",
    title: "SEO Production & Optimization",
    domain: "SEO Blog Workspace",
    owner: "SEO Lead",
    route: "/market-os/seo-blog-workspace",
    status: "operational",
    priority: "P1",
    queue: 21,
    blockers: 1,
    approvals: 3,
    progress: 69,
    valueMad: 260000,
    description: "Keyword clusters, briefs, meta titles, meta descriptions, internal links and content scoring.",
    actions: ["Generate Brief", "Optimize Meta", "Create Blog Task", "Score SEO", "Publish Article", "Open Keyword Gap"],
  },
  {
    id: "calendar-control",
    title: "Editorial Calendar Control",
    domain: "Editorial Calendar",
    owner: "Publishing Lead",
    route: "/market-os/editorial-calendar",
    status: "attention",
    priority: "P1",
    queue: 16,
    blockers: 5,
    approvals: 4,
    progress: 57,
    valueMad: 110000,
    description: "Calendar planning, channel schedule, missed deadlines, approval gates and publication recovery.",
    actions: ["Move Deadline", "Create Slot", "Approve Calendar", "Recover Overdue", "Assign Channel", "Lock Week Plan"],
  },
  {
    id: "acquisition-control",
    title: "Acquisition & Attribution Control",
    domain: "Performance",
    owner: "Acquisition Lead",
    route: "/market-os/attribution",
    status: "blocked",
    priority: "P0",
    queue: 9,
    blockers: 4,
    approvals: 2,
    progress: 42,
    valueMad: 520000,
    description: "Source quality, tracking gaps, attribution conflicts, CPL anomalies and funnel leakage.",
    actions: ["Audit Source", "Fix Tracking", "Validate UTM", "Open CPL Alert", "Escalate Leak", "Create Data Task"],
  },
  {
    id: "partner-marketing",
    title: "Partner Co-Marketing Activation",
    domain: "Partnerships",
    owner: "BD Officer",
    route: "/market-os/partnerships",
    status: "attention",
    priority: "P1",
    queue: 18,
    blockers: 2,
    approvals: 6,
    progress: 49,
    valueMad: 720000,
    description: "Partner activation, clinic co-marketing, referral flow, proposals and meeting follow-ups.",
    actions: ["Activate Partner", "Create Co-Marketing Plan", "Schedule Meeting", "Send Proposal", "Track Referral", "Escalate Partner"],
  },
  {
    id: "ambassador-growth",
    title: "Ambassador Growth Engine",
    domain: "Ambassadors",
    owner: "Community Lead",
    route: "/market-os/ambassadors",
    status: "operational",
    priority: "P2",
    queue: 32,
    blockers: 1,
    approvals: 2,
    progress: 72,
    valueMad: 95000,
    description: "Ambassador missions, rewards, referral tracking, content compliance and inactivity recovery.",
    actions: ["Create Mission", "Assign Ambassador", "Approve Reward", "Recover Inactive", "Track Referral", "Rank Performance"],
  },
  {
    id: "daily-execution",
    title: "Daily Tasks & Agent Workload",
    domain: "Execution",
    owner: "Ops Manager",
    route: "/revenue-command-center/daily-tasks",
    status: "attention",
    priority: "P0",
    queue: 27,
    blockers: 7,
    approvals: 9,
    progress: 58,
    valueMad: 360000,
    description: "Cross-module task command, agent workload, approvals, evidence gates and blocked execution.",
    actions: ["Create Task", "Assign Agent", "Open Blockers", "Request Evidence", "Approve Work", "Focus Mode"],
  },
  {
    id: "executive-control",
    title: "Executive Marketing Control",
    domain: "Leadership",
    owner: "CEO Office",
    route: "/revenue-command-center/daily-tasks/blocked",
    status: "review",
    priority: "P0",
    queue: 11,
    blockers: 5,
    approvals: 8,
    progress: 44,
    valueMad: 830000,
    description: "CEO/manager view for budget decisions, blocked campaigns, strategic approvals and revenue exposure.",
    actions: ["Open Decision", "Approve Budget", "Escalate Team", "Freeze Risk", "Request Report", "Close Review"],
  },
]

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value)
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function statusClass(status: Status) {
  if (status === "blocked") return "border-red-200 bg-red-50 text-red-700"
  if (status === "attention") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "review") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function priorityClass(priority: Priority) {
  if (priority === "P0") return "bg-red-700 text-slate-950"
  if (priority === "P1") return "bg-blue-700 text-slate-950"
  if (priority === "P2") return "bg-slate-50 text-slate-950"
  return "bg-slate-500 text-slate-950"
}

export default function MarketOSV17EnterpriseOpsCommand() {
  const [layers, setLayers] = useState(initialLayers)
  const [selectedId, setSelectedId] = useState(initialLayers[0].id)
  const [query, setQuery] = useState("")
  const [taskDraft, setTaskDraft] = useState("")
  const [logs, setLogs] = useState<Log[]>([
    { id: "init", at: new Date().toLocaleString(), layer: "System", action: "Market-OS V17 enterprise command ready" },
  ])

  const selected = layers.find((layer) => layer.id === selectedId) || layers[0]

  const filtered = useMemo(() => {
    return layers.filter((layer) =>
      `${layer.title} ${layer.domain} ${layer.owner} ${layer.description}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [layers, query])

  const stats = useMemo(() => {
    return {
      queue: layers.reduce((sum, layer) => sum + layer.queue, 0),
      blockers: layers.reduce((sum, layer) => sum + layer.blockers, 0),
      approvals: layers.reduce((sum, layer) => sum + layer.approvals, 0),
      value: layers.reduce((sum, layer) => sum + layer.valueMad, 0),
      progress: Math.round(layers.reduce((sum, layer) => sum + layer.progress, 0) / layers.length),
      p0: layers.filter((layer) => layer.priority === "P0").length,
    }
  }, [layers])

  function log(layer: string, action: string) {
    setLogs((current) => [
      { id: Math.random().toString(36).slice(2), at: new Date().toLocaleString(), layer, action },
      ...current,
    ].slice(0, 30))
  }

  function execute(layerId: string, action: string) {
    const target = layers.find((layer) => layer.id === layerId)

    setLayers((current) =>
      current.map((layer) => {
        if (layer.id !== layerId) return layer
        const next = { ...layer }

        if (/(Create|Generate|Open|Schedule|Assign|Request)/i.test(action)) {
          next.queue += 1
          next.status = "operational"
          next.progress = Math.min(100, next.progress + 3)
        }

        if (/(Approve|Validate|Publish|Close|Lock)/i.test(action)) {
          next.approvals = Math.max(0, next.approvals - 1)
          next.queue = Math.max(0, next.queue - 1)
          next.progress = Math.min(100, next.progress + 9)
          next.status = next.approvals > 1 ? "review" : "operational"
        }

        if (/(Escalate|Risk|Alert|Leak|Freeze|Blocker)/i.test(action)) {
          next.status = "blocked"
          next.blockers += 1
          next.priority = "P0"
          next.progress = Math.max(0, next.progress - 4)
        }

        if (/(Recover|Repair|Resolve|Fix)/i.test(action)) {
          next.blockers = Math.max(0, next.blockers - 1)
          next.status = next.blockers <= 1 ? "review" : "attention"
          next.progress = Math.min(100, next.progress + 7)
        }

        return next
      })
    )

    log(target?.title || "Market-OS", action)
  }

  function createMasterTask() {
    if (!taskDraft.trim()) return
    execute("daily-execution", "Create Task")
    log("Master Tasks Command", `Task created: ${taskDraft}`)
    setTaskDraft("")
  }

  function setSelectedStatus(status: Status) {
    setLayers((current) => current.map((layer) => layer.id === selected.id ? { ...layer, status } : layer))
    log(selected.title, `Status set to ${label(status)}`)
  }

  return (
    <main data-market-os-root className="min-h-screen bg-[#F3F5F8] text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-5 lg:p-8">

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 xl:grid-cols-[1.12fr_.88fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black tracking-wide text-slate-700">MARKET-OS V17</span>
                <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black tracking-wide text-blue-700">ENTERPRISE OPS</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black tracking-wide text-emerald-700">ERP STYLE</span>
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-950">
                Market-OS Operations Headquarters
              </h1>

              <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
                Structured corporate command page with direct access to the 4 Market-OS submodules,
                10 execution layers, real local action state, task command, approvals, blockers,
                risks, owner controls and activity tracking.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/market-os/campaign-lifecycle" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-slate-950 hover:bg-blue-800">Campaign Lifecycle</Link>
                <Link href="/market-os/content-command-center" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white">Content Command</Link>
                <Link href="/market-os/seo-blog-workspace" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">SEO Blog Workspace</Link>
                <Link href="/market-os/ambassadors" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">Ambassadors</Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/market-os/editorial-calendar" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:bg-white">Editorial Calendar</Link>
                <Link href="/market-os/attribution" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:bg-white">Attribution</Link>
                <Link href="/market-os/partnerships" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:bg-white">Partnerships</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Total Queue", stats.queue],
                ["Blockers", stats.blockers],
                ["Approvals", stats.approvals],
                ["Revenue Exposure", mad(stats.value)],
                ["Avg Progress", `${stats.progress}%`],
                ["P0 Layers", stats.p0],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-9500">{k}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {coreSubmodules.map((module) => (
            <article key={module.route} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Core Submodule</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{module.title}</h2>
              <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">{module.purpose}</p>
              <p className="mt-3 text-sm font-black text-slate-700">Owner: {module.owner}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {module.kpis.map((kpi) => (
                  <div key={kpi} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700">{kpi}</div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link href={module.route} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-slate-950">Open</Link>
                <button onClick={() => log(module.title, "Quick action requested")} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">Quick Action</button>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_.25fr_.25fr]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search layers, submodules, owners, actions, risks..."
              className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            <button onClick={() => execute(selected.id, "Escalate Selected")} className="rounded-xl bg-red-700 px-5 py-4 text-sm font-black text-slate-950 hover:bg-red-800">Escalate Selected</button>
            <button onClick={() => execute(selected.id, "Recover Selected")} className="rounded-xl bg-emerald-700 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-800">Recover Selected</button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          {filtered.map((layer) => (
            <article key={layer.id} className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${selected.id === layer.id ? "border-blue-400 ring-4 ring-blue-100" : "border-slate-200"}`}>
              <button onClick={() => setSelectedId(layer.id)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-md border px-3 py-1 text-xs font-black ${statusClass(layer.status)}`}>{label(layer.status)}</span>
                  <span className={`rounded-md px-3 py-1 text-xs font-black ${priorityClass(layer.priority)}`}>{layer.priority}</span>
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-950">{layer.title}</h3>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.15em] text-slate-500">{layer.domain}</p>
                <p className="mt-3 min-h-[84px] text-sm font-semibold leading-6 text-slate-600">{layer.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xs font-black text-slate-500">Queue</p><p className="text-xl font-black">{layer.queue}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xs font-black text-slate-500">Block</p><p className="text-xl font-black">{layer.blockers}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xs font-black text-slate-500">Appr.</p><p className="text-xl font-black">{layer.approvals}</p></div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${layer.progress}%` }} />
                </div>

                <p className="mt-3 text-sm font-black text-blue-700">{mad(layer.valueMad)}</p>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {layer.actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => execute(layer.id, action)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {action}
                  </button>
                ))}
              </div>

              <Link href={layer.route} className="mt-3 block rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-white">
                Open Workspace
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Master Task Command</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Cross-Market Execution Tasks</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Create tasks, assign owners, open blockers, request evidence, trigger approvals and move work into the Daily Tasks workspace.
                </p>
              </div>
              <Link href="/revenue-command-center/daily-tasks" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-slate-950">Open Daily Tasks</Link>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_.25fr]">
              <input
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                placeholder="Create a Market-OS execution task..."
                className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
              <button onClick={createMasterTask} className="rounded-xl bg-white px-5 py-4 text-sm font-black text-slate-950">Create Task</button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                ["Assign Owner", "Assign Agent"],
                ["Evidence Gate", "Request Evidence"],
                ["Manager Approval", "Approve Work"],
                ["Blocker Desk", "Open Blockers"],
                ["SLA Recovery", "Recover SLA"],
                ["Focus Queue", "Focus Mode"],
                ["Launch Checklist", "Open Launch Checklist"],
                ["Risk Escalation", "Escalate Risk"],
              ].map(([labelText, action]) => (
                <button key={action} onClick={() => execute("daily-execution", action)} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                  {labelText}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-9500">Selected Layer Control</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected.description}</p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {(["operational", "attention", "blocked", "review", "completed"] as Status[]).map((status) => (
                  <button key={status} onClick={() => setSelectedStatus(status)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700 hover:bg-blue-50">
                    {label(status)}
                  </button>
                ))}
              </div>

              <Link href={selected.route} className="mt-4 block rounded-xl bg-white px-5 py-4 text-center text-sm font-black text-slate-950">
                Open Selected Workspace
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-9500">Execution Activity</p>
              <div className="mt-4 max-h-[430px] space-y-3 overflow-auto pr-1">
                {logs.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">{entry.action}</p>
                    <p className="mt-1 text-xs font-bold text-slate-9500">{entry.layer} • {entry.at}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}