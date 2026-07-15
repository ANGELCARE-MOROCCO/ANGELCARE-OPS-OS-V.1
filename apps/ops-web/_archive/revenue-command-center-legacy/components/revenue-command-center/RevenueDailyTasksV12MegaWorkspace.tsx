"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type TaskStatus =
  | "inbox"
  | "today"
  | "planned"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "manager_review"
  | "approved"
  | "completed"
  | "archived"

type TaskPriority = "urgent" | "critical" | "high" | "medium" | "low"
type TaskType =
  | "sales"
  | "sdr"
  | "appointment"
  | "partnership"
  | "b2c"
  | "operations"
  | "finance"
  | "marketing"
  | "academy"
  | "hr"
  | "executive"
  | "quality"
  | "admin"

type TaskViewMode =
  | "dashboard"
  | "board"
  | "list"
  | "focus"
  | "calendar"
  | "agents"
  | "approvals"
  | "blocked"
  | "analytics"
  | "new"

type Subtask = {
  id: string
  title: string
  owner: string
  done: boolean
}

type TaskComment = {
  id: string
  author: string
  at: string
  body: string
}

type TaskRecord = {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  owner: string
  requester: string
  department: string
  relatedModule: string
  relatedRecord: string
  dueDate: string
  dueTime: string
  estimatedMinutes: number
  spentMinutes: number
  progress: number
  valueMad: number
  impactScore: number
  urgencyScore: number
  slaRisk: number
  approvalRequired: boolean
  evidenceRequired: boolean
  evidence: string
  blocker: string
  dependency: string
  successDefinition: string
  nextAction: string
  agentInstructions: string
  tags: string[]
  subtasks: Subtask[]
  comments: TaskComment[]
  createdAt: string
  updatedAt: string
}

type TaskLog = {
  id: string
  taskId: string
  at: string
  action: string
  note: string
}

type AutomationRule = {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
}

type TaskStore = {
  tasks: TaskRecord[]
  logs: TaskLog[]
  automations: AutomationRule[]
}

const STORE_KEY = "revenue_daily_tasks_v12_mega_store"

const statuses: TaskStatus[] = ["inbox", "today", "planned", "in_progress", "waiting", "blocked", "manager_review", "approved", "completed", "archived"]
const priorities: TaskPriority[] = ["urgent", "critical", "high", "medium", "low"]
const types: TaskType[] = ["sales", "sdr", "appointment", "partnership", "b2c", "operations", "finance", "marketing", "academy", "hr", "executive", "quality", "admin"]

const views: Array<{ mode: TaskViewMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Command", href: "/revenue-command-center/daily-tasks", desc: "Daily execution control center." },
  { mode: "board", label: "Board", href: "/revenue-command-center/daily-tasks/board", desc: "ClickUp-style task stages." },
  { mode: "list", label: "List", href: "/revenue-command-center/daily-tasks/list", desc: "Dense operational task list." },
  { mode: "focus", label: "Focus", href: "/revenue-command-center/daily-tasks/focus", desc: "Deep work queue for agents." },
  { mode: "calendar", label: "Calendar", href: "/revenue-command-center/daily-tasks/calendar", desc: "Due dates and daily rhythm." },
  { mode: "agents", label: "Agents", href: "/revenue-command-center/daily-tasks/agents", desc: "Owner workload and agent control." },
  { mode: "approvals", label: "Approvals", href: "/revenue-command-center/daily-tasks/approvals", desc: "Manager review and evidence." },
  { mode: "blocked", label: "Blocked", href: "/revenue-command-center/daily-tasks/blocked", desc: "Blockers and recovery." },
  { mode: "analytics", label: "Analytics", href: "/revenue-command-center/daily-tasks/analytics", desc: "Execution metrics and SLA risk." },
  { mode: "new", label: "New Task", href: "/revenue-command-center/daily-tasks/new", desc: "Create deep task." },
]

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function nowIso() {
  return new Date().toISOString()
}

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value || 0)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function seedTasks(): TaskRecord[] {
  const now = nowIso()
  return [
    {
      id: "daily-v12-vip-callback",
      title: "VIP postpartum lead recovery callback",
      description: "Recover high-value postpartum family lead and secure consultation decision path.",
      type: "sdr",
      status: "today",
      priority: "urgent",
      owner: "SDR Lead",
      requester: "Revenue Manager",
      department: "Revenue",
      relatedModule: "B2C Workflow",
      relatedRecord: "Family A — VIP postpartum support",
      dueDate: today(0),
      dueTime: "16:30",
      estimatedMinutes: 45,
      spentMinutes: 15,
      progress: 35,
      valueMad: 42000,
      impactScore: 92,
      urgencyScore: 95,
      slaRisk: 78,
      approvalRequired: false,
      evidenceRequired: true,
      evidence: "Call note + WhatsApp screenshot required.",
      blocker: "Decision maker availability not fully confirmed.",
      dependency: "Family contact answers phone.",
      successDefinition: "Consultation confirmed and decision maker mapped.",
      nextAction: "Call spouse, confirm consultation and document decision path.",
      agentInstructions: "Use trust-first script. Confirm mother/baby context, urgency, schedule and package readiness.",
      tags: ["VIP", "postpartum", "recovery", "today"],
      subtasks: [
        { id: "sub-1", title: "Call spouse", owner: "SDR Lead", done: false },
        { id: "sub-2", title: "Send WhatsApp confirmation", owner: "SDR Lead", done: false },
        { id: "sub-3", title: "Update decision maker notes", owner: "SDR Lead", done: false },
      ],
      comments: [
        { id: "com-1", author: "Revenue Manager", at: now, body: "High urgency. Do not leave this without a clear next step." },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "daily-v12-clinic-proposal",
      title: "Finalize clinic partnership proposal",
      description: "Prepare referral economics, pilot flow and partner one-pager for maternity clinic.",
      type: "partnership",
      status: "in_progress",
      priority: "critical",
      owner: "BD Officer",
      requester: "CEO",
      department: "Partnerships",
      relatedModule: "Partnerships",
      relatedRecord: "Clinique Maternité Rabat Premium",
      dueDate: today(1),
      dueTime: "11:00",
      estimatedMinutes: 120,
      spentMinutes: 50,
      progress: 58,
      valueMad: 420000,
      impactScore: 96,
      urgencyScore: 72,
      slaRisk: 42,
      approvalRequired: true,
      evidenceRequired: true,
      evidence: "Proposal PDF + activation flow required.",
      blocker: "",
      dependency: "CEO validates referral economics.",
      successDefinition: "Proposal approved and meeting agenda ready.",
      nextAction: "Finalize offer structure and send for CEO approval.",
      agentInstructions: "Make the offer concrete: referral flow, SLA, reporting, patient experience and activation pilot.",
      tags: ["clinic", "proposal", "partnership", "CEO"],
      subtasks: [
        { id: "sub-4", title: "Draft referral economics", owner: "BD Officer", done: true },
        { id: "sub-5", title: "Prepare one-pager", owner: "BD Officer", done: false },
        { id: "sub-6", title: "Submit for approval", owner: "BD Officer", done: false },
      ],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "daily-v12-staff-matching",
      title: "Match caregiver for elderly care assessment",
      description: "Shortlist available staff for Temara elderly care case and confirm first-day readiness.",
      type: "operations",
      status: "blocked",
      priority: "high",
      owner: "Ops Coordinator",
      requester: "Care Coordinator",
      department: "Operations",
      relatedModule: "B2C Workflow",
      relatedRecord: "Family B — elderly care assessment",
      dueDate: today(0),
      dueTime: "18:00",
      estimatedMinutes: 60,
      spentMinutes: 20,
      progress: 30,
      valueMad: 38000,
      impactScore: 81,
      urgencyScore: 80,
      slaRisk: 88,
      approvalRequired: false,
      evidenceRequired: true,
      evidence: "Staff shortlist + availability confirmation.",
      blocker: "No confirmed staff availability for morning slot.",
      dependency: "HR/Ops confirms available caregiver.",
      successDefinition: "At least two staff options confirmed with availability.",
      nextAction: "Escalate to Ops Director and request staff availability.",
      agentInstructions: "Prioritize proximity, elderly-care experience, reliability and replacement availability.",
      tags: ["matching", "elderly-care", "blocked", "ops"],
      subtasks: [
        { id: "sub-7", title: "Check available caregivers", owner: "Ops Coordinator", done: false },
        { id: "sub-8", title: "Confirm replacement option", owner: "Ops Coordinator", done: false },
      ],
      comments: [],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAutomations(): AutomationRule[] {
  return [
    { id: "auto-overdue-critical", name: "Overdue critical escalation", trigger: "Urgent/critical task overdue", action: "Move to blocked, notify manager and increase SLA risk.", enabled: true },
    { id: "auto-evidence-required", name: "Evidence gate", trigger: "Task completed with evidence required", action: "Send task to manager review until evidence is captured.", enabled: true },
    { id: "auto-high-value", name: "High-value task watchdog", trigger: "Value > 100,000 MAD and progress < 50%", action: "Flag for executive review.", enabled: true },
  ]
}

function defaultStore(): TaskStore {
  return {
    tasks: seedTasks(),
    logs: [{ id: uid(), taskId: "system", at: nowIso(), action: "Daily Tasks V12 initialized", note: "ClickUp-inspired deep execution workspace seeded." }],
    automations: seedAutomations(),
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
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    if (!Array.isArray(parsed.automations)) parsed.automations = seedAutomations()
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-indigo-700 text-white hover:bg-indigo-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }
  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: TaskPriority) {
  if (priority === "urgent" || priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function statusTone(status: TaskStatus) {
  if (status === "completed" || status === "approved") return "emerald"
  if (status === "blocked") return "rose"
  if (status === "in_progress" || status === "manager_review") return "blue"
  return "slate"
}

function defaultDraft(): Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "subtasks" | "comments" | "tags"> & { tagsText: string; subtasksText: string } {
  return {
    title: "",
    description: "",
    type: "operations",
    status: "inbox",
    priority: "high",
    owner: "Agent",
    requester: "Manager",
    department: "Revenue",
    relatedModule: "Revenue Command",
    relatedRecord: "",
    dueDate: today(0),
    dueTime: "17:00",
    estimatedMinutes: 45,
    spentMinutes: 0,
    progress: 0,
    valueMad: 0,
    impactScore: 50,
    urgencyScore: 50,
    slaRisk: 25,
    approvalRequired: false,
    evidenceRequired: false,
    evidence: "",
    blocker: "",
    dependency: "",
    successDefinition: "",
    nextAction: "",
    agentInstructions: "",
    tagsText: "daily\nexecution",
    subtasksText: "Define next action\nExecute\nLog evidence",
  }
}

export default function RevenueDailyTasksV12MegaWorkspace({ mode = "dashboard" }: { mode?: TaskViewMode }) {
  const [store, setStore] = useState<TaskStore>(() => defaultStore())
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [draft, setDraft] = useState(defaultDraft())
  const [newComment, setNewComment] = useState("")
  const [newSubtask, setNewSubtask] = useState("")

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.tasks[0]?.id || "")
  }, [])

  function commit(next: TaskStore, action: string, note: string, taskId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), taskId: taskId || selectedId || "system", at: nowIso(), action, note }, ...next.logs].slice(0, 200),
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

  const filtered = useMemo(() => {
    return store.tasks.filter((task) => {
      const hay = `${task.title} ${task.description} ${task.owner} ${task.type} ${task.department} ${task.relatedModule} ${task.relatedRecord} ${task.nextAction} ${task.blocker} ${task.tags.join(" ")}`.toLowerCase()
      const modeMatch =
        mode === "focus" ? ["today", "in_progress", "blocked"].includes(task.status) :
        mode === "agents" ? true :
        mode === "approvals" ? task.approvalRequired || task.status === "manager_review" :
        mode === "blocked" ? task.status === "blocked" || task.blocker.trim() !== "" :
        mode === "calendar" ? ["today", "planned"].includes(task.status) :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || task.status === statusFilter)
        && (typeFilter === "all" || task.type === typeFilter)
    })
  }, [store.tasks, query, statusFilter, typeFilter, mode])

  const stats = useMemo(() => {
    const open = store.tasks.filter((t) => !["completed", "archived"].includes(t.status)).length
    const todayTasks = store.tasks.filter((t) => t.dueDate === today(0) || t.status === "today").length
    const blocked = store.tasks.filter((t) => t.status === "blocked" || t.blocker.trim()).length
    const approvals = store.tasks.filter((t) => t.approvalRequired || t.status === "manager_review").length
    const value = store.tasks.reduce((sum, t) => sum + t.valueMad, 0)
    const avgProgress = Math.round(store.tasks.reduce((sum, t) => sum + t.progress, 0) / Math.max(store.tasks.length, 1))
    const slaRisk = Math.round(store.tasks.reduce((sum, t) => sum + t.slaRisk, 0) / Math.max(store.tasks.length, 1))
    return { open, todayTasks, blocked, approvals, value, avgProgress, slaRisk, total: store.tasks.length }
  }, [store.tasks])

  function updateTask(id: string, patch: Partial<TaskRecord>, action = "Task updated") {
    const target = store.tasks.find((task) => task.id === id)
    const tasks = store.tasks.map((task) => task.id === id ? { ...task, ...patch, updatedAt: nowIso() } : task)
    commit({ ...store, tasks }, action, target?.title || id, id)
  }

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const task: TaskRecord = {
      id: uid(),
      title: draft.title,
      description: draft.description,
      type: draft.type,
      status: draft.status,
      priority: draft.priority,
      owner: draft.owner,
      requester: draft.requester,
      department: draft.department,
      relatedModule: draft.relatedModule,
      relatedRecord: draft.relatedRecord,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      estimatedMinutes: Number(draft.estimatedMinutes) || 0,
      spentMinutes: Number(draft.spentMinutes) || 0,
      progress: clamp(draft.progress),
      valueMad: Number(draft.valueMad) || 0,
      impactScore: clamp(draft.impactScore),
      urgencyScore: clamp(draft.urgencyScore),
      slaRisk: clamp(draft.slaRisk),
      approvalRequired: Boolean(draft.approvalRequired),
      evidenceRequired: Boolean(draft.evidenceRequired),
      evidence: draft.evidence,
      blocker: draft.blocker,
      dependency: draft.dependency,
      successDefinition: draft.successDefinition,
      nextAction: draft.nextAction || "Execute task and update evidence.",
      agentInstructions: draft.agentInstructions,
      tags: draft.tagsText.split("\n").map((x) => x.trim()).filter(Boolean),
      subtasks: draft.subtasksText.split("\n").map((title) => ({ id: uid(), title: title.trim(), owner: draft.owner, done: false })).filter((x) => x.title),
      comments: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    commit({ ...store, tasks: [task, ...store.tasks] }, "Task created", task.title, task.id)
    setSelectedId(task.id)
    setDraft(defaultDraft())
    setCreateOpen(false)
  }

  function deleteTask(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    const tasks = store.tasks.filter((task) => task.id !== id)
    commit({ ...store, tasks }, "Task deleted", target?.title || id, id)
    setSelectedId(tasks[0]?.id || "")
  }

  function advanceTask(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    if (!target) return
    const index = statuses.indexOf(target.status)
    const status = statuses[Math.min(index + 1, statuses.length - 1)]
    updateTask(id, { status, progress: Math.min(100, target.progress + 15) }, `Advanced to ${label(status)}`)
  }

  function startTask(id: string) {
    updateTask(id, { status: "in_progress", nextAction: "Execute and log progress/evidence." }, "Task started")
  }

  function blockTask(id: string) {
    updateTask(id, { status: "blocked", blocker: selected?.blocker || "Blocker requires manager intervention.", slaRisk: 90 }, "Task blocked")
  }

  function completeTask(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    if (!target) return
    const status: TaskStatus = target.evidenceRequired || target.approvalRequired ? "manager_review" : "completed"
    updateTask(id, { status, progress: 100, nextAction: status === "manager_review" ? "Manager review required." : "Completed." }, status === "manager_review" ? "Sent to manager review" : "Task completed")
  }

  function approveTask(id: string) {
    updateTask(id, { status: "approved", progress: 100, nextAction: "Approved. Archive or connect to next workflow." }, "Task approved")
  }

  function autoScore(id: string) {
    const target = store.tasks.find((task) => task.id === id)
    if (!target) return
    let slaRisk = 20
    if (target.priority === "urgent" || target.priority === "critical") slaRisk += 25
    if (target.dueDate <= today(0)) slaRisk += 25
    if (target.blocker.trim()) slaRisk += 25
    if (target.progress < 40 && target.valueMad > 50000) slaRisk += 15
    const impactScore = clamp((target.valueMad > 100000 ? 90 : target.valueMad > 30000 ? 75 : 50) + (target.priority === "urgent" ? 10 : 0))
    updateTask(id, { slaRisk: clamp(slaRisk), impactScore, urgencyScore: target.dueDate <= today(0) ? 90 : target.urgencyScore }, "Task auto-scored")
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    const target = store.tasks.find((task) => task.id === taskId)
    if (!target) return
    const subtasks = target.subtasks.map((sub) => sub.id === subtaskId ? { ...sub, done: !sub.done } : sub)
    const progress = Math.round((subtasks.filter((s) => s.done).length / Math.max(subtasks.length, 1)) * 100)
    updateTask(taskId, { subtasks, progress }, "Subtask updated")
  }

  function addSubtask() {
    if (!selected || !newSubtask.trim()) return
    updateTask(selected.id, { subtasks: [...selected.subtasks, { id: uid(), title: newSubtask.trim(), owner: selected.owner, done: false }] }, "Subtask added")
    setNewSubtask("")
  }

  function addComment() {
    if (!selected || !newComment.trim()) return
    updateTask(selected.id, { comments: [{ id: uid(), author: "Current user", at: nowIso(), body: newComment.trim() }, ...selected.comments] }, "Comment added")
    setNewComment("")
  }

  function toggleAutomation(id: string) {
    const automations = store.automations.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    commit({ ...store, automations }, "Automation toggled", id)
  }

  const boardGroups = statuses.map((status) => ({
    status,
    tasks: filtered.filter((task) => task.status === status),
  }))

  const ownerStats = useMemo(() => {
    const map = new Map<string, { owner: string; count: number; blocked: number; value: number; progress: number }>()
    for (const task of store.tasks) {
      const current = map.get(task.owner) || { owner: task.owner, count: 0, blocked: 0, value: 0, progress: 0 }
      current.count += 1
      current.blocked += task.status === "blocked" ? 1 : 0
      current.value += task.valueMad
      current.progress += task.progress
      map.set(task.owner, current)
    }
    return Array.from(map.values()).map((x) => ({ ...x, progress: Math.round(x.progress / Math.max(x.count, 1)) }))
  }, [store.tasks])

  return (
    <main className="min-h-screen bg-indigo-50/60 text-slate-950 selection:bg-indigo-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.28fr_.72fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="violet">Revenue Command</Pill>
                <Pill tone="blue">Daily Tasks V12 Mega</Pill>
                <Pill tone="amber">{label(mode)}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Daily tasks deep workspace — ClickUp-inspired agent execution command center.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-indigo-50/85 md:text-lg">
                A premium corporate task system for agents and managers: create, open, edit, score, assign, approve, block, recover, evidence-gate, comment, manage subtasks, track SLA risk, and control daily execution across AngelCare modules.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create task</Button>
                <Button type="button" onClick={() => selected && autoScore(selected.id)}>Auto-score selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/daily-tasks/board" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Board</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Open", stats.open, "Active work"],
                ["Today", stats.todayTasks, "Due now"],
                ["Blocked", stats.blocked, "Need intervention"],
                ["Approvals", stats.approvals, "Manager review"],
                ["Value", mad(stats.value), "Execution exposure"],
                ["SLA Risk", `${stats.slaRisk}%`, "Average risk"],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70">{k}</p>
                  <p className="mt-3 text-3xl font-black text-white">{v}</p>
                  <p className="mt-2 text-sm font-bold text-white/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {views.map((view) => (
            <Link key={view.href} href={view.href} className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${mode === view.mode ? "border-indigo-400 bg-indigo-100" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{view.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{view.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Create deep task</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create operational task with full control fields</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createTask} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Task title" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TaskType })}>{types.map((t) => <option key={t} value={t}>{label(t)}</option>)}</Select>
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>{statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}>{priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}</Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner / agent" />
              <Input value={draft.requester} onChange={(e) => setDraft({ ...draft, requester: e.target.value })} placeholder="Requester" />
              <Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="Department" />
              <Input value={draft.relatedModule} onChange={(e) => setDraft({ ...draft, relatedModule: e.target.value })} placeholder="Related module" />
              <Input value={draft.relatedRecord} onChange={(e) => setDraft({ ...draft, relatedRecord: e.target.value })} placeholder="Related record" />
              <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Input type="time" value={draft.dueTime} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} />
              <Input type="number" value={draft.estimatedMinutes} onChange={(e) => setDraft({ ...draft, estimatedMinutes: Number(e.target.value) })} placeholder="Estimated minutes" />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })} placeholder="Progress %" />
              <Input type="number" value={draft.impactScore} onChange={(e) => setDraft({ ...draft, impactScore: Number(e.target.value) })} placeholder="Impact %" />
              <Input type="number" value={draft.urgencyScore} onChange={(e) => setDraft({ ...draft, urgencyScore: Number(e.target.value) })} placeholder="Urgency %" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"><input type="checkbox" checked={draft.approvalRequired} onChange={(e) => setDraft({ ...draft, approvalRequired: e.target.checked })} /> Approval required</label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"><input type="checkbox" checked={draft.evidenceRequired} onChange={(e) => setDraft({ ...draft, evidenceRequired: e.target.checked })} /> Evidence required</label>
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="xl:col-span-2" />
              <Textarea value={draft.successDefinition} onChange={(e) => setDraft({ ...draft, successDefinition: e.target.value })} placeholder="Success definition" className="xl:col-span-2" />
              <Textarea value={draft.agentInstructions} onChange={(e) => setDraft({ ...draft, agentInstructions: e.target.value })} placeholder="Agent instructions" className="xl:col-span-2" />
              <Textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" className="xl:col-span-2" />
              <Textarea value={draft.blocker} onChange={(e) => setDraft({ ...draft, blocker: e.target.value })} placeholder="Blocker" className="xl:col-span-2" />
              <Textarea value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} placeholder="Evidence requirement / evidence note" className="xl:col-span-2" />
              <Textarea value={draft.tagsText} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} placeholder="Tags, one per line" className="xl:col-span-2" />
              <Textarea value={draft.subtasksText} onChange={(e) => setDraft({ ...draft, subtasksText: e.target.value })} placeholder="Subtasks, one per line" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create task</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, agent, module, blocker, tag..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}><option value="all">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TaskType | "all")}><option value="all">All types</option>{types.map((t) => <option key={t} value={t}>{label(t)}</option>)}</Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New task</Button>
          </div>
        </Card>

        {mode === "board" ? (
          <section className="grid gap-4 xl:grid-cols-5">
            {boardGroups.map((group) => (
              <Card key={group.status} className="min-h-[260px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950">{label(group.status)}</h3>
                  <Pill tone="blue">{group.tasks.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <button key={task.id} type="button" onClick={() => setSelectedId(task.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{task.owner} • {mad(task.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={priorityTone(task.priority)}>{label(task.priority)}</Pill>
                        <Pill tone={task.slaRisk > 75 ? "rose" : "blue"}>{task.slaRisk}% SLA</Pill>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        ) : null}

        {mode === "agents" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {ownerStats.map((owner) => (
              <Card key={owner.owner}>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700">Agent workload</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{owner.owner}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500">{owner.count} tasks • {owner.blocked} blocked • {mad(owner.value)}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-700" style={{ width: `${owner.progress}%` }} /></div>
                <p className="mt-2 text-sm font-black text-slate-700">{owner.progress}% average progress</p>
              </Card>
            ))}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
          <section className="space-y-4">
            {filtered.map((task) => (
              <Card key={task.id} className={task.id === selected?.id ? "ring-4 ring-indigo-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.7fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(task.priority)}>{label(task.priority)}</Pill>
                      <Pill tone={statusTone(task.status)}>{label(task.status)}</Pill>
                      <Pill tone="violet">{label(task.type)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(task.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-indigo-800">{task.title}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{task.nextAction || task.description}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{task.owner} • {task.dueDate} {task.dueTime} • {task.department}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Execution</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{task.progress}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Impact {task.impactScore}% • SLA {task.slaRisk}%</p>
                    <p className="mt-2 text-sm font-black text-indigo-700">{mad(task.valueMad)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(task.id)}>Open</Button>
                    <Button type="button" variant="soft" onClick={() => autoScore(task.id)}>Score</Button>
                    <Button type="button" variant="soft" onClick={() => startTask(task.id)}>Start</Button>
                    <Button type="button" variant="soft" onClick={() => advanceTask(task.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => blockTask(task.id)}>Block</Button>
                    <Button type="button" variant="soft" onClick={() => approveTask(task.id)}>Approve</Button>
                    <Button type="button" variant="primary" onClick={() => completeTask(task.id)}>Complete</Button>
                    <Button type="button" variant="danger" onClick={() => deleteTask(task.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">Open task workspace</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No task selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-black text-white/60">Progress</p><p className="mt-1 text-2xl font-black">{selected.progress}%</p></div>
                    <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-black text-white/60">SLA</p><p className="mt-1 text-2xl font-black">{selected.slaRisk}%</p></div>
                    <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-black text-white/60">Value</p><p className="mt-1 text-xl font-black">{mad(selected.valueMad)}</p></div>
                  </div>

                  <Textarea value={selected.description} onChange={(e) => updateTask(selected.id, { description: e.target.value }, "Description updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateTask(selected.id, { status: e.target.value as TaskStatus }, "Status updated")}>{statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
                    <Select value={selected.priority} onChange={(e) => updateTask(selected.id, { priority: e.target.value as TaskPriority }, "Priority updated")}>{priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}</Select>
                    <Input value={selected.owner} onChange={(e) => updateTask(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.department} onChange={(e) => updateTask(selected.id, { department: e.target.value }, "Department updated")} />
                    <Input type="date" value={selected.dueDate} onChange={(e) => updateTask(selected.id, { dueDate: e.target.value }, "Due date updated")} />
                    <Input type="time" value={selected.dueTime} onChange={(e) => updateTask(selected.id, { dueTime: e.target.value }, "Due time updated")} />
                    <Input type="number" value={selected.progress} onChange={(e) => updateTask(selected.id, { progress: clamp(Number(e.target.value)) }, "Progress updated")} />
                    <Input type="number" value={selected.slaRisk} onChange={(e) => updateTask(selected.id, { slaRisk: clamp(Number(e.target.value)) }, "SLA updated")} />
                  </div>

                  <Textarea value={selected.successDefinition} onChange={(e) => updateTask(selected.id, { successDefinition: e.target.value }, "Success definition updated")} placeholder="Success definition" />
                  <Textarea value={selected.agentInstructions} onChange={(e) => updateTask(selected.id, { agentInstructions: e.target.value }, "Agent instructions updated")} placeholder="Agent instructions" />
                  <Textarea value={selected.nextAction} onChange={(e) => updateTask(selected.id, { nextAction: e.target.value }, "Next action updated")} placeholder="Next action" />
                  <Textarea value={selected.blocker} onChange={(e) => updateTask(selected.id, { blocker: e.target.value, status: e.target.value.trim() ? "blocked" : selected.status }, "Blocker updated")} placeholder="Blocker" />
                  <Textarea value={selected.evidence} onChange={(e) => updateTask(selected.id, { evidence: e.target.value }, "Evidence updated")} placeholder="Evidence" />

                  <Card className="bg-white text-slate-950">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Subtasks</p>
                    <div className="mt-3 space-y-2">
                      {selected.subtasks.map((sub) => (
                        <button key={sub.id} type="button" onClick={() => toggleSubtask(selected.id, sub.id)} className="block w-full rounded-2xl bg-slate-100 p-3 text-left text-sm font-black text-slate-900">
                          {sub.done ? "✅" : "⬜"} {sub.title} <span className="text-slate-400">— {sub.owner}</span>
                        </button>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="New subtask" />
                        <Button type="button" variant="primary" onClick={addSubtask}>Add</Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white text-slate-950">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Comments</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add comment" />
                        <Button type="button" variant="primary" onClick={addComment}>Send</Button>
                      </div>
                      {selected.comments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-sm font-black text-slate-950">{comment.author}</p>
                          <p className="text-xs font-bold text-slate-500">{new Date(comment.at).toLocaleString()}</p>
                          <p className="mt-2 text-sm font-bold text-slate-700">{comment.body}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => autoScore(selected.id)}>Auto-score</Button>
                    <Button type="button" variant="soft" onClick={() => startTask(selected.id)}>Start</Button>
                    <Button type="button" variant="soft" onClick={() => blockTask(selected.id)}>Block</Button>
                    <Button type="button" variant="soft" onClick={() => approveTask(selected.id)}>Approve</Button>
                    <Button type="button" variant="primary" onClick={() => completeTask(selected.id)}>Complete</Button>
                    <Button type="button" variant="danger" onClick={() => deleteTask(selected.id)}>Delete</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Automation engine</p>
              <div className="mt-4 space-y-3">
                {store.automations.map((rule) => (
                  <button key={rule.id} type="button" onClick={() => toggleAutomation(rule.id)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{rule.name}</p>
                      <Pill tone={rule.enabled ? "emerald" : "slate"}>{rule.enabled ? "Enabled" : "Disabled"}</Pill>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">IF {rule.trigger}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">THEN {rule.action}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Activity stream</p>
              <div className="mt-4 space-y-2">
                {store.logs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.note} • {new Date(log.at).toLocaleString()}</p>
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
