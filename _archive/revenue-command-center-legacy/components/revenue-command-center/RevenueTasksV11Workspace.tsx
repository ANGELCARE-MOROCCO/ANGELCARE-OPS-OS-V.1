"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type TaskStatus = "backlog" | "today" | "in_progress" | "blocked" | "manager_review" | "completed" | "archived"
type TaskPriority = "critical" | "high" | "medium" | "low"
type TaskType = "prospect" | "campaign" | "appointment" | "follow_up" | "partnership" | "management" | "general"

type RevenueTask = {
  id: string
  title: string
  description: string
  type: TaskType
  owner: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  valueMad: number
  blocker: string
  nextAction: string
  evidence: string
  progress: number
  createdAt: string
  updatedAt: string
}

type Subtask = {
  id: string
  taskId: string
  title: string
  owner: string
  done: boolean
}

type TaskLog = {
  id: string
  taskId: string
  at: string
  action: string
  note: string
}

type TaskStore = {
  tasks: RevenueTask[]
  subtasks: Subtask[]
  logs: TaskLog[]
}

const STORE_KEY = "revenue_tasks_v11_store"

const statuses: TaskStatus[] = ["backlog", "today", "in_progress", "blocked", "manager_review", "completed", "archived"]
const priorities: TaskPriority[] = ["critical", "high", "medium", "low"]
const types: TaskType[] = ["prospect", "campaign", "appointment", "follow_up", "partnership", "management", "general"]

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
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

function seedTasks(): RevenueTask[] {
  const now = new Date().toISOString()
  return [
    {
      id: "tsk-vip-lead-recovery",
      title: "Recover VIP postpartum lead before SLA breach",
      description: "Call, qualify, update family context, create next appointment or escalation note.",
      type: "prospect",
      owner: "SDR Lead",
      status: "blocked",
      priority: "critical",
      dueDate: today(0),
      valueMad: 185000,
      blocker: "No owner confirmation after first contact attempt.",
      nextAction: "Call family and assign executive owner.",
      evidence: "WhatsApp history + CRM note required.",
      progress: 35,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "tsk-clinic-pitch",
      title: "Prepare clinic partnership pitch package",
      description: "Create one-page offer, referral economics, meeting agenda and objection handling notes.",
      type: "partnership",
      owner: "BD Officer",
      status: "in_progress",
      priority: "high",
      dueDate: today(2),
      valueMad: 320000,
      blocker: "",
      nextAction: "Finalize deck and book meeting.",
      evidence: "Deck link + call sheet.",
      progress: 62,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "tsk-campaign-handoff",
      title: "Validate campaign lead handoff SLA",
      description: "Confirm routing, owner coverage, lead follow-up templates and no-delay callback routine.",
      type: "campaign",
      owner: "Growth Ops",
      status: "today",
      priority: "high",
      dueDate: today(1),
      valueMad: 240000,
      blocker: "Lead ownership matrix not fully confirmed.",
      nextAction: "Test routing with 3 sample leads.",
      evidence: "Screenshot proof + QA checklist.",
      progress: 48,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedSubtasks(): Subtask[] {
  return [
    { id: "sub-1", taskId: "tsk-vip-lead-recovery", title: "Call family contact", owner: "SDR Lead", done: false },
    { id: "sub-2", taskId: "tsk-vip-lead-recovery", title: "Update lead status and notes", owner: "SDR Lead", done: false },
    { id: "sub-3", taskId: "tsk-clinic-pitch", title: "Finalize referral economics", owner: "BD Officer", done: true },
    { id: "sub-4", taskId: "tsk-campaign-handoff", title: "Test WhatsApp routing", owner: "Growth Ops", done: false },
  ]
}

function defaultStore(): TaskStore {
  return {
    tasks: seedTasks(),
    subtasks: seedSubtasks(),
    logs: [{ id: uid(), taskId: "system", at: new Date().toLocaleString(), action: "Tasks initialized", note: "Revenue Tasks V11 workspace seeded." }],
  }
}

function readStore(): TaskStore {
  if (typeof window === "undefined") return defaultStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as TaskStore
    if (!Array.isArray(parsed.tasks)) return defaultStore()
    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: TaskStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
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

function priorityTone(priority: TaskPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

export default function RevenueTasksV11Workspace({ mode = "workspace" }: { mode?: "workspace" | "board" | "new" }) {
  const [store, setStore] = useState<TaskStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [subtaskTitle, setSubtaskTitle] = useState("")
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    type: "general" as TaskType,
    owner: "Revenue Manager",
    status: "backlog" as TaskStatus,
    priority: "high" as TaskPriority,
    dueDate: today(2),
    valueMad: 25000,
    blocker: "",
    nextAction: "",
    evidence: "",
    progress: 0,
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.tasks[0]?.id || "")
  }, [])

  function commit(next: TaskStore, action: string, note: string, taskId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), taskId: taskId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 100),
    }
    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.tasks[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.tasks.find((task) => task.id === selectedId) || store.tasks[0]
  const selectedSubtasks = selected ? store.subtasks.filter((subtask) => subtask.taskId === selected.id) : []

  const filtered = useMemo(() => {
    return store.tasks.filter((task) => {
      const hay = `${task.title} ${task.description} ${task.owner} ${task.type} ${task.nextAction} ${task.blocker}`.toLowerCase()
      return (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || task.status === statusFilter)
        && (priorityFilter === "all" || task.priority === priorityFilter)
    })
  }, [store.tasks, query, statusFilter, priorityFilter])

  const stats = useMemo(() => {
    const open = store.tasks.filter((task) => !["completed", "archived"].includes(task.status)).length
    const blocked = store.tasks.filter((task) => task.status === "blocked" || task.priority === "critical").length
    const done = store.tasks.filter((task) => task.status === "completed").length
    const overdue = store.tasks.filter((task) => new Date(task.dueDate).getTime() < Date.now() && !["completed", "archived"].includes(task.status)).length
    const value = store.tasks.reduce((sum, task) => sum + Number(task.valueMad || 0), 0)
    return { open, blocked, done, overdue, value, total: store.tasks.length }
  }, [store.tasks])

  function updateTask(id: string, patch: Partial<RevenueTask>, action = "Task updated") {
    const target = store.tasks.find((task) => task.id === id)
    const tasks = store.tasks.map((task) => task.id === id ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task)
    commit({ ...store, tasks }, action, target?.title || id, id)
  }

  function createTask(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!draft.title.trim()) return

    const now = new Date().toISOString()
    const task: RevenueTask = {
      id: uid(),
      title: draft.title,
      description: draft.description,
      type: draft.type,
      owner: draft.owner,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate,
      valueMad: Number(draft.valueMad) || 0,
      blocker: draft.blocker,
      nextAction: draft.nextAction || "Define next execution action.",
      evidence: draft.evidence,
      progress: Number(draft.progress) || 0,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, tasks: [task, ...store.tasks] }, "Task created", task.title, task.id)
    setSelectedId(task.id)
    setCreateOpen(false)
    setDraft({
      title: "",
      description: "",
      type: "general",
      owner: "Revenue Manager",
      status: "backlog",
      priority: "high",
      dueDate: today(2),
      valueMad: 25000,
      blocker: "",
      nextAction: "",
      evidence: "",
      progress: 0,
    })
  }

  function deleteTask(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    const tasks = store.tasks.filter((task) => task.id !== id)
    const subtasks = store.subtasks.filter((subtask) => subtask.taskId !== id)
    commit({ ...store, tasks, subtasks }, "Task deleted", target?.title || id, id)
    setSelectedId(tasks[0]?.id || "")
  }

  function addSubtask() {
    if (!selected || !subtaskTitle.trim()) return
    const subtask: Subtask = {
      id: uid(),
      taskId: selected.id,
      title: subtaskTitle,
      owner: selected.owner,
      done: false,
    }
    commit({ ...store, subtasks: [subtask, ...store.subtasks] }, "Subtask added", subtask.title, selected.id)
    setSubtaskTitle("")
  }

  function toggleSubtask(id: string) {
    const target = store.subtasks.find((subtask) => subtask.id === id)
    const subtasks = store.subtasks.map((subtask) => subtask.id === id ? { ...subtask, done: !subtask.done } : subtask)
    commit({ ...store, subtasks }, "Subtask toggled", target?.title || id, target?.taskId)
  }

  function deleteSubtask(id: string) {
    const target = store.subtasks.find((subtask) => subtask.id === id)
    const subtasks = store.subtasks.filter((subtask) => subtask.id !== id)
    commit({ ...store, subtasks }, "Subtask deleted", target?.title || id, target?.taskId)
  }

  function advanceTask(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    if (!target) return
    const index = statuses.indexOf(target.status)
    const nextStatus = statuses[Math.min(index + 1, statuses.length - 1)]
    updateTask(id, { status: nextStatus, progress: Math.min(100, target.progress + 15) }, `Advanced to ${label(nextStatus)}`)
  }

  const boardGroups = statuses.slice(0, 6).map((status) => ({
    status,
    tasks: filtered.filter((task) => task.status === status),
  }))

  return (
    <main className="min-h-screen bg-blue-50/50 text-slate-950 selection:bg-blue-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-blue-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="blue">Revenue Command</Pill>
                <Pill tone="emerald">Tasks V11</Pill>
                <Pill tone="amber">{mode === "board" ? "Operating Board" : mode === "new" ? "New Task" : "Execution Engine"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Tasks command — execution discipline, blockers, subtasks and accountability.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-blue-50/85 md:text-lg">
                A controlled task operating system for revenue execution. Create tasks, assign owners, manage subtasks, escalate blockers, track evidence and protect commercial momentum.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create task</Button>
                <Button type="button" onClick={() => selected && advanceTask(selected.id)}>Advance selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/tasks/board" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Task board</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Open</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.open}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Active work items</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Blocked</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.blocked}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Critical + blocked</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Revenue exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/70">Overdue</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.overdue}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Needs intervention</p>
              </div>
            </div>
          </div>
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Create task</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create accountable execution task</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createTask} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Task title" />
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TaskType })}>
                {types.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </Select>
              <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })} placeholder="Progress %" />
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="xl:col-span-2" />
              <Textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" className="xl:col-span-2" />
              <Textarea value={draft.blocker} onChange={(e) => setDraft({ ...draft, blocker: e.target.value })} placeholder="Blocker" className="xl:col-span-2" />
              <Textarea value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} placeholder="Evidence required" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create task</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, owner, blocker, next action..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New task</Button>
          </div>
        </Card>

        {mode === "board" ? (
          <section className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
            {boardGroups.map((group) => (
              <Card key={group.status} className="min-h-[260px]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-slate-950">{label(group.status)}</h2>
                  <Pill tone="blue">{group.tasks.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <button key={task.id} type="button" onClick={() => setSelectedId(task.id)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{task.owner} • {mad(task.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={priorityTone(task.priority)}>{label(task.priority)}</Pill>
                        <Pill tone={task.status === "blocked" ? "rose" : "emerald"}>{task.progress}%</Pill>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <section className="space-y-4">
              {filtered.map((task) => (
                <Card key={task.id} className={task.id === selected?.id ? "ring-4 ring-blue-100" : ""}>
                  <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.55fr]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={priorityTone(task.priority)}>{label(task.priority)}</Pill>
                        <Pill tone={task.status === "blocked" ? "rose" : task.status === "completed" ? "emerald" : "blue"}>{label(task.status)}</Pill>
                        <Pill tone="violet">{label(task.type)}</Pill>
                      </div>
                      <button type="button" onClick={() => setSelectedId(task.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-blue-800">{task.title}</button>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{task.nextAction}</p>
                      <p className="mt-3 text-sm font-black text-slate-700">Owner: {task.owner} • Due: {task.dueDate}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Progress</p>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />
                      </div>
                      <p className="mt-2 text-2xl font-black text-slate-950">{task.progress}%</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">{mad(task.valueMad)}</p>
                    </div>
                    <div className="grid gap-2">
                      <Button type="button" variant="soft" onClick={() => setSelectedId(task.id)}>Select</Button>
                      <Button type="button" variant="soft" onClick={() => advanceTask(task.id)}>Advance</Button>
                      <Button type="button" variant="soft" onClick={() => updateTask(task.id, { status: "completed", progress: 100 }, "Completed")}>Complete</Button>
                      <Button type="button" variant="danger" onClick={() => deleteTask(task.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <aside className="space-y-6">
              <Card className="bg-slate-950 text-white">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Selected task</p>
                <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No task selected"}</h2>

                {selected ? (
                  <div className="mt-5 space-y-4">
                    <Textarea value={selected.description} onChange={(e) => updateTask(selected.id, { description: e.target.value }, "Description updated")} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={selected.status} onChange={(e) => updateTask(selected.id, { status: e.target.value as TaskStatus }, "Status updated")}>
                        {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                      </Select>
                      <Select value={selected.priority} onChange={(e) => updateTask(selected.id, { priority: e.target.value as TaskPriority }, "Priority updated")}>
                        {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                      </Select>
                      <Input value={selected.owner} onChange={(e) => updateTask(selected.id, { owner: e.target.value }, "Owner updated")} />
                      <Input type="number" value={selected.progress} onChange={(e) => updateTask(selected.id, { progress: Number(e.target.value) }, "Progress updated")} />
                    </div>
                    <Textarea value={selected.nextAction} onChange={(e) => updateTask(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                    <Textarea value={selected.blocker} onChange={(e) => updateTask(selected.id, { blocker: e.target.value, status: e.target.value.trim() ? "blocked" : selected.status }, "Blocker updated")} />
                    <Textarea value={selected.evidence} onChange={(e) => updateTask(selected.id, { evidence: e.target.value }, "Evidence updated")} />

                    <div className="grid gap-3 rounded-2xl bg-white/5 p-4">
                      <p className="text-sm font-black text-white">Subtasks</p>
                      <div className="flex gap-2">
                        <Input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} placeholder="New subtask" />
                        <Button type="button" variant="primary" onClick={addSubtask}>Add</Button>
                      </div>
                      <div className="space-y-2">
                        {selectedSubtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/10 p-3">
                            <button type="button" onClick={() => toggleSubtask(subtask.id)} className="text-left text-sm font-bold text-white">
                              {subtask.done ? "✅" : "⬜"} {subtask.title}
                            </button>
                            <button type="button" onClick={() => deleteSubtask(subtask.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-black text-white">Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Execution log</p>
                <div className="mt-4 space-y-2">
                  {store.logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-950">{log.action}</p>
                      <p className="text-xs font-bold text-slate-500">{log.note} • {log.at}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
