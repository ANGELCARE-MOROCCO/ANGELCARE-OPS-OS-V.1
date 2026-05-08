"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type Priority = "critical" | "high" | "medium" | "low"
type Status = "active" | "in_progress" | "blocked" | "manager_review" | "completed" | "archived"
type WorkspaceKey =
  | "tasks"
  | "prospects"
  | "campaigns"
  | "appointments"
  | "follow-ups"
  | "control-tower"
  | "automation"
  | "ai-scoring"
  | "management"
  | "partnerships"

type RevenueCommandRecord = {
  id: string
  title: string
  module: WorkspaceKey
  owner: string
  status: Status
  priority: Priority
  valueMad: number
  dueDate: string
  nextAction: string
  risk: string
  notes: string
  createdAt: string
  updatedAt: string
}

type CommandLog = {
  id: string
  at: string
  action: string
  detail: string
}

type RevenueStore = {
  records: RevenueCommandRecord[]
  logs: CommandLog[]
}

const STORE_KEY = "revenue_command_hq_v11_store"

const workspaces: Array<{
  key: WorkspaceKey
  title: string
  href: string
  icon: string
  mission: string
  color: string
}> = [
  {
    key: "control-tower",
    title: "Control Tower",
    href: "/revenue-command-center/control-tower",
    icon: "🛡️",
    mission: "Risk, SLA, escalation and executive intervention.",
    color: "from-rose-600 to-orange-500",
  },
  {
    key: "tasks",
    title: "Tasks Command",
    href: "/revenue-command-center/tasks",
    icon: "✅",
    mission: "Execution discipline, subtasks, blockers and completion.",
    color: "from-blue-600 to-cyan-500",
  },
  {
    key: "prospects",
    title: "Prospects",
    href: "/revenue-command-center/prospects",
    icon: "🎯",
    mission: "Pipeline, qualification, decision maps and conversion.",
    color: "from-emerald-600 to-teal-500",
  },
  {
    key: "campaigns",
    title: "Campaigns",
    href: "/revenue-command-center/campaigns",
    icon: "📣",
    mission: "Revenue campaigns, lead flow, assets and ROI.",
    color: "from-amber-500 to-red-500",
  },
  {
    key: "appointments",
    title: "Appointments",
    href: "/revenue-command-center/appointments",
    icon: "📅",
    mission: "Meetings, confirmations, no-show control and next steps.",
    color: "from-violet-600 to-fuchsia-500",
  },
  {
    key: "follow-ups",
    title: "Follow-ups",
    href: "/revenue-command-center/follow-ups",
    icon: "🔁",
    mission: "Callback discipline, overdue recovery and no-lead-left-behind.",
    color: "from-cyan-600 to-sky-500",
  },
  {
    key: "ai-scoring",
    title: "AI Scoring",
    href: "/revenue-command-center/ai-scoring",
    icon: "🧠",
    mission: "Priority, risk, next-best-action and scoring intelligence.",
    color: "from-indigo-600 to-purple-500",
  },
  {
    key: "automation",
    title: "Automation",
    href: "/revenue-command-center/automation",
    icon: "⚙️",
    mission: "Triggers, alerts, SLA rules and routing playbooks.",
    color: "from-slate-700 to-slate-500",
  },
  {
    key: "management",
    title: "Management",
    href: "/revenue-command-center/management",
    icon: "👔",
    mission: "Team workload, permissions, audit and accountability.",
    color: "from-teal-700 to-emerald-500",
  },
  {
    key: "partnerships",
    title: "Partnerships",
    href: "/revenue-command-center/partnerships",
    icon: "🤝",
    mission: "Partner pipeline, activation, referral revenue and agreements.",
    color: "from-pink-700 to-rose-500",
  },
]

const priorities: Priority[] = ["critical", "high", "medium", "low"]
const statuses: Status[] = ["active", "in_progress", "blocked", "manager_review", "completed", "archived"]

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function seedRecords(): RevenueCommandRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "rev-risk-vip-lead",
      title: "VIP lead stalled after consultation request",
      module: "control-tower",
      owner: "Revenue Manager",
      status: "blocked",
      priority: "critical",
      valueMad: 185000,
      dueDate: today(0),
      nextAction: "Assign executive owner and call family today.",
      risk: "High-value opportunity may decay after no response window.",
      notes: "Requires immediate intervention and manager audit.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rev-prospect-clinic",
      title: "Clinic partnership qualification batch",
      module: "prospects",
      owner: "BD Officer",
      status: "in_progress",
      priority: "high",
      valueMad: 320000,
      dueDate: today(3),
      nextAction: "Map decision makers and create appointment queue.",
      risk: "Several clinics contacted without decision-map confirmation.",
      notes: "Strong revenue expansion potential if qualified correctly.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rev-campaign-postpartum",
      title: "Postpartum campaign lead handoff control",
      module: "campaigns",
      owner: "Growth Lead",
      status: "active",
      priority: "high",
      valueMad: 240000,
      dueDate: today(2),
      nextAction: "Validate lead routing and WhatsApp follow-up SLA.",
      risk: "Campaign can generate leads faster than SDR follow-up capacity.",
      notes: "Connect campaign lead flow to follow-up command daily.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rev-task-sla",
      title: "Overdue follow-up recovery sweep",
      module: "follow-ups",
      owner: "SDR Lead",
      status: "manager_review",
      priority: "critical",
      valueMad: 97000,
      dueDate: today(-1),
      nextAction: "Recover overdue callbacks and escalate non-response.",
      risk: "Revenue leakage from delayed callback discipline.",
      notes: "Use overdue heatmap and owner accountability.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): RevenueStore {
  return {
    records: seedRecords(),
    logs: [
      {
        id: uid(),
        at: new Date().toLocaleString(),
        action: "HQ initialized",
        detail: "Revenue Command HQ V11 cockpit loaded.",
      },
    ],
  }
}

function readStore(): RevenueStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as RevenueStore
    if (!parsed.records || !Array.isArray(parsed.records)) return defaultStore()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: RevenueStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-white/10 bg-slate-950 p-5 text-white shadow-xl ${className}`}>{children}</section>
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "blue" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

export default function RevenueCommandHQV11Cockpit() {
  const [store, setStore] = useState<RevenueStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState<WorkspaceKey | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    module: "tasks" as WorkspaceKey,
    owner: "Revenue Manager",
    priority: "high" as Priority,
    status: "active" as Status,
    valueMad: 25000,
    dueDate: today(3),
    nextAction: "",
    risk: "",
    notes: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.records[0]?.id || "")
  }, [])

  function commit(next: RevenueStore, action: string, detail: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), at: new Date().toLocaleString(), action, detail }, ...next.logs].slice(0, 80),
    }

    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.records[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.records.find((record) => record.id === selectedId) || store.records[0]

  const filtered = useMemo(() => {
    return store.records.filter((record) => {
      const hay = `${record.title} ${record.owner} ${record.module} ${record.nextAction} ${record.risk} ${record.notes}`.toLowerCase()

      return (!query || hay.includes(query.toLowerCase()))
        && (moduleFilter === "all" || record.module === moduleFilter)
        && (priorityFilter === "all" || record.priority === priorityFilter)
    })
  }, [store.records, query, moduleFilter, priorityFilter])

  const stats = useMemo(() => {
    const active = store.records.filter((record) => !["completed", "archived"].includes(record.status)).length
    const critical = store.records.filter((record) => record.priority === "critical" || record.status === "blocked").length
    const value = store.records.reduce((sum, record) => sum + Number(record.valueMad || 0), 0)
    const overdue = store.records.filter((record) => new Date(record.dueDate).getTime() < Date.now() && !["completed", "archived"].includes(record.status)).length
    const owners = new Set(store.records.map((record) => record.owner).filter(Boolean)).size

    return { active, critical, value, overdue, owners, total: store.records.length }
  }, [store.records])

  function updateRecord(id: string, patch: Partial<RevenueCommandRecord>, action = "Record updated") {
    const target = store.records.find((record) => record.id === id)
    const records = store.records.map((record) => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record)

    commit({ ...store, records }, action, target?.title || id)
  }

  function createRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const now = new Date().toISOString()
    const record: RevenueCommandRecord = {
      id: uid(),
      title: draft.title,
      module: draft.module,
      owner: draft.owner,
      status: draft.status,
      priority: draft.priority,
      valueMad: Number(draft.valueMad) || 0,
      dueDate: draft.dueDate,
      nextAction: draft.nextAction || "Define next action.",
      risk: draft.risk || "No risk defined.",
      notes: draft.notes,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, records: [record, ...store.records] }, "HQ record created", record.title)
    setSelectedId(record.id)
    setCreateOpen(false)
    setDraft({
      title: "",
      module: "tasks",
      owner: "Revenue Manager",
      priority: "high",
      status: "active",
      valueMad: 25000,
      dueDate: today(3),
      nextAction: "",
      risk: "",
      notes: "",
    })
  }

  function deleteRecord(id: string) {
    const target = store.records.find((record) => record.id === id)
    const records = store.records.filter((record) => record.id !== id)

    commit({ ...store, records }, "HQ record deleted", target?.title || id)
    setSelectedId(records[0]?.id || "")
  }

  function execute(action: "complete" | "escalate" | "recover" | "archive" | "start") {
    if (!selected) return

    if (action === "complete") updateRecord(selected.id, { status: "completed" }, "Marked completed")
    if (action === "escalate") updateRecord(selected.id, { status: "blocked", priority: "critical", risk: "Executive intervention required." }, "Escalated")
    if (action === "recover") updateRecord(selected.id, { status: "in_progress", priority: "high", nextAction: "Recovery plan activated." }, "Recovery activated")
    if (action === "archive") updateRecord(selected.id, { status: "archived" }, "Archived")
    if (action === "start") updateRecord(selected.id, { status: "in_progress" }, "Started")
  }

  const criticalQueue = store.records.filter((record) => record.priority === "critical" || record.status === "blocked").slice(0, 5)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 selection:bg-blue-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-blue-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="blue">Revenue Command Center</Pill>
                <Pill tone="emerald">HQ V11</Pill>
                <Pill tone="amber">Stabilized Cockpit</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Revenue Command HQ — executive operating cockpit.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-blue-50/85 md:text-lg">
                A unified command entry point for revenue tasks, prospects, campaigns, follow-ups, appointments, partnerships, automation, AI scoring and management. This cockpit standardizes navigation, execution pressure, risk control and daily revenue discipline without deleting your existing deeper workspaces.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create command record</Button>
                <Button type="button" onClick={() => execute("escalate")}>Escalate selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore HQ seed</Button>
                <Link href="/revenue-command-center/control-tower" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Open Control Tower</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Active</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.active}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Open command records</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Critical</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.critical}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Risks + blockers</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Revenue exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Owners</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.owners}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Accountability coverage</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workspaces.map((workspace) => {
            const count = store.records.filter((record) => record.module === workspace.key).length
            const riskCount = store.records.filter((record) => record.module === workspace.key && (record.priority === "critical" || record.status === "blocked")).length

            return (
              <Link key={workspace.key} href={workspace.href} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`h-2 bg-gradient-to-r ${workspace.color}`} />
                <div className="p-5">
                  <div className="text-3xl">{workspace.icon}</div>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{workspace.title}</h3>
                  <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-600">{workspace.mission}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill tone="blue">{count} records</Pill>
                    <Pill tone={riskCount ? "rose" : "emerald"}>{riskCount} risks</Pill>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Create</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create revenue command record</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createRecord} className="grid gap-4 xl:grid-cols-[1fr_.5fr_.5fr_.5fr]">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Command title" />
              <Select value={draft.module} onChange={(e) => setDraft({ ...draft, module: e.target.value as WorkspaceKey })}>
                {workspaces.map((workspace) => <option key={workspace.key} value={workspace.key}>{workspace.title}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" />
              <Textarea value={draft.risk} onChange={(e) => setDraft({ ...draft, risk: e.target.value })} placeholder="Risk / blocker" className="xl:col-span-2" />
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create record</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.5fr_.4fr_.4fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, owner, workspace, next action..." />
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value as WorkspaceKey | "all")}>
              <option value="all">All workspaces</option>
              {workspaces.map((workspace) => <option key={workspace.key} value={workspace.key}>{workspace.title}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New record</Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <section className="space-y-4">
            {filtered.map((record) => {
              const workspace = workspaces.find((item) => item.key === record.module)
              return (
                <Card key={record.id} className={record.id === selected?.id ? "ring-4 ring-blue-100" : ""}>
                  <div className="grid gap-4 xl:grid-cols-[1fr_.45fr_.5fr]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={record.priority === "critical" ? "rose" : record.priority === "high" ? "amber" : "blue"}>{label(record.priority)}</Pill>
                        <Pill tone={record.status === "blocked" ? "rose" : record.status === "completed" ? "emerald" : "slate"}>{label(record.status)}</Pill>
                        <Pill tone="violet">{workspace?.title || record.module}</Pill>
                      </div>
                      <button type="button" onClick={() => setSelectedId(record.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-blue-800">{record.title}</button>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{record.nextAction}</p>
                      <p className="mt-3 text-sm font-black text-slate-700">Owner: {record.owner} • Due: {record.dueDate}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Revenue exposure</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{mad(record.valueMad)}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">{record.risk}</p>
                    </div>
                    <div className="grid gap-2">
                      <Button type="button" variant="soft" onClick={() => setSelectedId(record.id)}>Select</Button>
                      <Button type="button" variant="soft" onClick={() => updateRecord(record.id, { status: "in_progress" }, "Record started")}>Start</Button>
                      <Button type="button" variant="soft" onClick={() => updateRecord(record.id, { status: "completed" }, "Record completed")}>Complete</Button>
                      <Button type="button" variant="danger" onClick={() => deleteRecord(record.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </section>

          <aside className="space-y-6">
            <DarkCard>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Selected command</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No record selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.notes} onChange={(e) => updateRecord(selected.id, { notes: e.target.value }, "Notes updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateRecord(selected.id, { status: e.target.value as Status }, "Status updated")}>
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateRecord(selected.id, { priority: e.target.value as Priority }, "Priority updated")}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updateRecord(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateRecord(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                  </div>
                  <Textarea value={selected.nextAction} onChange={(e) => updateRecord(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => execute("start")}>Start</Button>
                    <Button type="button" variant="soft" onClick={() => execute("recover")}>Recover</Button>
                    <Button type="button" variant="danger" onClick={() => execute("escalate")}>Escalate</Button>
                    <Button type="button" variant="primary" onClick={() => execute("complete")}>Complete</Button>
                  </div>
                </div>
              ) : null}
            </DarkCard>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-700">Critical queue</p>
              <div className="mt-4 space-y-3">
                {criticalQueue.length ? criticalQueue.map((record) => (
                  <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className="block w-full rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left">
                    <p className="text-sm font-black text-rose-900">{record.title}</p>
                    <p className="mt-1 text-xs font-bold text-rose-700">{record.owner} • {mad(record.valueMad)}</p>
                  </button>
                )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No critical records.</p>}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Audit log</p>
              <div className="mt-4 space-y-2">
                {store.logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.detail} • {log.at}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}
