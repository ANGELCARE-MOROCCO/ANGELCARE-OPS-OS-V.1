"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type ExecutionStatus = "ready" | "active" | "blocked" | "review" | "completed"
type Urgency = "critical" | "high" | "normal"

type ExecutionLayer = {
  id: string
  title: string
  owner: string
  status: ExecutionStatus
  urgency: Urgency
  queue: number
  completed: number
  valueMad: number
  sla: number
  route: string
  description: string
  actions: string[]
}

type Activity = {
  id: string
  at: string
  action: string
  layer: string
}

const initialLayers: ExecutionLayer[] = [
  {
    id: "campaign",
    title: "Campaign War Room",
    owner: "Growth Lead",
    status: "active",
    urgency: "critical",
    queue: 12,
    completed: 4,
    valueMad: 640000,
    sla: 82,
    route: "/market-os/campaign-lifecycle",
    description: "Launch, pause, recover, assign and escalate active marketing campaigns.",
    actions: ["Launch", "Pause", "Escalate", "Assign"],
  },
  {
    id: "content",
    title: "Content Production Engine",
    owner: "Content Manager",
    status: "review",
    urgency: "high",
    queue: 43,
    completed: 18,
    valueMad: 180000,
    sla: 68,
    route: "/market-os/content-command-center",
    description: "Create, approve, schedule and publish SEO/content production assets.",
    actions: ["Create", "Approve", "Schedule", "Publish"],
  },
  {
    id: "seo",
    title: "SEO Blog Command",
    owner: "SEO Lead",
    status: "active",
    urgency: "high",
    queue: 21,
    completed: 9,
    valueMad: 260000,
    sla: 71,
    route: "/market-os/seo-blog-workspace",
    description: "Keyword clusters, briefs, metadata, publishing and editorial recovery.",
    actions: ["Generate Brief", "Optimize", "Publish", "Audit"],
  },
  {
    id: "acquisition",
    title: "Lead Acquisition Control",
    owner: "Acquisition Lead",
    status: "blocked",
    urgency: "critical",
    queue: 7,
    completed: 2,
    valueMad: 420000,
    sla: 89,
    route: "/market-os/attribution",
    description: "CPL anomalies, attribution repair, source quality and funnel leakage control.",
    actions: ["Audit", "Repair", "Validate", "Escalate"],
  },
  {
    id: "partners",
    title: "Partnership Growth",
    owner: "BD Officer",
    status: "active",
    urgency: "high",
    queue: 18,
    completed: 6,
    valueMad: 720000,
    sla: 64,
    route: "/market-os/partnerships",
    description: "Co-marketing, partner activation, referral flow and proposal follow-up.",
    actions: ["Activate", "Proposal", "Follow-up", "Review"],
  },
  {
    id: "ambassadors",
    title: "Ambassador Activation",
    owner: "Community Lead",
    status: "ready",
    urgency: "normal",
    queue: 32,
    completed: 14,
    valueMad: 95000,
    sla: 48,
    route: "/market-os/ambassadors",
    description: "Missions, referrals, incentives, content compliance and inactivity recovery.",
    actions: ["Create Mission", "Reward", "Recover", "Rank"],
  },
  {
    id: "calendar",
    title: "Editorial Calendar",
    owner: "Publishing Lead",
    status: "review",
    urgency: "high",
    queue: 16,
    completed: 8,
    valueMad: 110000,
    sla: 73,
    route: "/market-os/editorial-calendar",
    description: "Publishing timeline, approvals, deadlines, channel planning and bottlenecks.",
    actions: ["Plan", "Move", "Approve", "Recover"],
  },
  {
    id: "tasks",
    title: "Master Tasks Command",
    owner: "Ops Manager",
    status: "active",
    urgency: "critical",
    queue: 27,
    completed: 11,
    valueMad: 360000,
    sla: 85,
    route: "/revenue-command-center/daily-tasks",
    description: "Unified execution queue, blockers, evidence, approvals and agent workload.",
    actions: ["Create Task", "Assign", "Blocker", "Approve"],
  },
  {
    id: "risk",
    title: "Execution Risk Center",
    owner: "Executive Ops",
    status: "blocked",
    urgency: "critical",
    queue: 9,
    completed: 3,
    valueMad: 500000,
    sla: 91,
    route: "/revenue-command-center/daily-tasks/blocked",
    description: "SLA pressure, blocked workflows, overdue approvals and escalation routing.",
    actions: ["Open Risk", "Escalate", "Resolve", "Audit"],
  },
  {
    id: "ai",
    title: "AI Growth Assistant",
    owner: "CEO Office",
    status: "ready",
    urgency: "normal",
    queue: 10,
    completed: 5,
    valueMad: 240000,
    sla: 42,
    route: "/market-os/ai-command-center",
    description: "Campaign recommendations, SEO optimization, growth diagnosis and smart briefs.",
    actions: ["Diagnose", "Suggest", "Generate", "Prioritize"],
  },
]

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function statusClass(status: ExecutionStatus) {
  if (status === "blocked") return "bg-rose-50 text-rose-700 border-rose-200"
  if (status === "review") return "bg-amber-50 text-amber-700 border-amber-200"
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (status === "active") return "bg-blue-50 text-blue-700 border-blue-200"
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function urgencyClass(urgency: Urgency) {
  if (urgency === "critical") return "bg-rose-600 text-white"
  if (urgency === "high") return "bg-amber-500 text-white"
  return "bg-slate-700 text-white"
}

export default function MarketOSV16CorporateERPCommand() {
  const [layers, setLayers] = useState<ExecutionLayer[]>(initialLayers)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialLayers[0]?.id || "")
  const [activities, setActivities] = useState<Activity[]>([
    { id: "seed-1", at: new Date().toLocaleString(), action: "Market-OS V16 command initialized", layer: "System" },
  ])
  const [taskTitle, setTaskTitle] = useState("")

  const selected = layers.find((layer) => layer.id === selectedId) || layers[0]

  const filtered = useMemo(() => {
    return layers.filter((layer) =>
      `${layer.title} ${layer.owner} ${layer.description}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [layers, query])

  const stats = useMemo(() => {
    const queue = layers.reduce((sum, layer) => sum + layer.queue, 0)
    const completed = layers.reduce((sum, layer) => sum + layer.completed, 0)
    const blocked = layers.filter((layer) => layer.status === "blocked").length
    const review = layers.filter((layer) => layer.status === "review").length
    const value = layers.reduce((sum, layer) => sum + layer.valueMad, 0)
    const avgSla = Math.round(layers.reduce((sum, layer) => sum + layer.sla, 0) / layers.length)

    return { queue, completed, blocked, review, value, avgSla }
  }, [layers])

  function log(action: string, layer: string) {
    setActivities((current) => [
      { id: Math.random().toString(36).slice(2), at: new Date().toLocaleString(), action, layer },
      ...current,
    ].slice(0, 20))
  }

  function runLayerAction(layerId: string, action: string) {
    setLayers((current) =>
      current.map((layer) => {
        if (layer.id !== layerId) return layer

        let next = { ...layer }

        if (action.includes("Launch") || action.includes("Create") || action.includes("Generate") || action.includes("Plan")) {
          next.queue += 1
          next.status = "active"
        } else if (action.includes("Approve") || action.includes("Validate") || action.includes("Publish")) {
          next.completed += 1
          next.queue = Math.max(0, next.queue - 1)
          next.status = next.queue <= 1 ? "completed" : "active"
        } else if (action.includes("Escalate") || action.includes("Blocker") || action.includes("Open Risk")) {
          next.status = "blocked"
          next.sla = Math.min(100, next.sla + 8)
          next.urgency = "critical"
        } else if (action.includes("Recover") || action.includes("Resolve") || action.includes("Repair")) {
          next.status = "review"
          next.sla = Math.max(0, next.sla - 12)
        } else if (action.includes("Assign") || action.includes("Review") || action.includes("Audit")) {
          next.status = "review"
        } else {
          next.status = "active"
        }

        return next
      })
    )

    const layer = layers.find((item) => item.id === layerId)
    log(action, layer?.title || "Market-OS")
  }

  function createMasterTask() {
    if (!taskTitle.trim()) return

    const taskLayer = layers.find((layer) => layer.id === "tasks")
    if (taskLayer) {
      runLayerAction("tasks", "Create Task")
      log(`Created master task: ${taskTitle}`, "Master Tasks Command")
      setTaskTitle("")
    }
  }

  function setLayerStatus(status: ExecutionStatus) {
    if (!selected) return

    setLayers((current) =>
      current.map((layer) => layer.id === selected.id ? { ...layer, status } : layer)
    )
    log(`Status changed to ${label(status)}`, selected.title)
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-5 lg:p-8">

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  MARKET-OS V16
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700">
                  CORPORATE ERP COMMAND
                </span>
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-950">
                AngelCare Marketing Operations Control Center
              </h1>

              <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
                Clean corporate ERP-style command page for campaigns, SEO, content, acquisition,
                partners, ambassadors, risks, approvals and daily execution control.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/market-os/campaign-lifecycle" className="rounded-2xl bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-800">
                  Open Campaigns
                </Link>

                <Link href="/revenue-command-center/daily-tasks/new" className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-800">
                  Create Global Task
                </Link>

                <Link href="/market-os/seo-blog-workspace/create" className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-800 hover:bg-slate-50">
                  Create SEO Asset
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Total Queue", stats.queue],
                ["Completed", stats.completed],
                ["Blocked", stats.blocked],
                ["In Review", stats.review],
                ["Execution Value", mad(stats.value)],
                ["Avg SLA Risk", `${stats.avgSla}%`],
              ].map(([labelText, value]) => (
                <div key={labelText} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    {labelText}
                  </p>
                  <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_.4fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_.35fr_.35fr]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search command layers, owners, risks, campaigns..."
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <button
                onClick={() => selected && runLayerAction(selected.id, "Escalate")}
                className="rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black text-white hover:bg-rose-700"
              >
                Escalate Selected
              </button>

              <button
                onClick={() => selected && runLayerAction(selected.id, "Resolve")}
                className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700"
              >
                Resolve Selected
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Selected Layer</p>
            <p className="mt-2 text-xl font-black text-slate-950">{selected?.title}</p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          {filtered.map((layer) => (
            <article
              key={layer.id}
              className={`rounded-[2rem] border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                selectedId === layer.id ? "border-blue-400 ring-4 ring-blue-100" : "border-slate-200"
              }`}
            >
              <button onClick={() => setSelectedId(layer.id)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(layer.status)}`}>
                      {label(layer.status)}
                    </span>
                    <h3 className="mt-4 text-xl font-black text-slate-950">{layer.title}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${urgencyClass(layer.urgency)}`}>
                    {label(layer.urgency)}
                  </span>
                </div>

                <p className="mt-3 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">
                  {layer.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">Queue</p>
                    <p className="text-2xl font-black">{layer.queue}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">SLA</p>
                    <p className="text-2xl font-black">{layer.sla}%</p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-black text-blue-700">{mad(layer.valueMad)}</p>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {layer.actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => runLayerAction(layer.id, action)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {action}
                  </button>
                ))}
              </div>

              <Link href={layer.route} className="mt-3 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">
                Open Workspace
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Master Tasks Command</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Execution Queue & Agent Control</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Create operational tasks, assign execution, monitor blockers and push items into daily task workspace.
                </p>
              </div>

              <Link href="/revenue-command-center/daily-tasks" className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
                Open Daily Tasks
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_.3fr]">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Create a new execution task from Market-OS..."
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
              <button
                onClick={createMasterTask}
                className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
              >
                Create Task
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[
                ["Task Queue", layers.find((x) => x.id === "tasks")?.queue ?? 0],
                ["Blocked", stats.blocked],
                ["Approvals", stats.review],
                ["SLA Risk", `${stats.avgSla}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{k}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {["Assign to Agent", "Open Blockers", "Manager Review", "Evidence Gate", "SLA Recovery", "Focus Mode"].map((action) => (
                <button
                  key={action}
                  onClick={() => runLayerAction("tasks", action)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Selected Layer Control</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{selected?.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selected?.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {statusesShort.map((status) => (
                  <button
                    key={status}
                    onClick={() => setLayerStatus(status)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-blue-50"
                  >
                    {label(status)}
                  </button>
                ))}
              </div>

              <Link href={selected?.route || "/market-os"} className="mt-4 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white">
                Open Selected Workspace
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Activity Log</p>
              <div className="mt-4 space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">{activity.action}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{activity.layer} • {activity.at}</p>
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

const statusesShort: ExecutionStatus[] = ["ready", "active", "blocked", "review", "completed"]
