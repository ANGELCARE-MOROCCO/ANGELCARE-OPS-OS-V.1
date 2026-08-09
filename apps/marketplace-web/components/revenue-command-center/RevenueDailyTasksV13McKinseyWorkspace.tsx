"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type TaskStatus =
  | "intake"
  | "triaged"
  | "today"
  | "in_progress"
  | "waiting_input"
  | "blocked"
  | "quality_review"
  | "manager_approval"
  | "completed"
  | "archived"

type Priority = "P0" | "P1" | "P2" | "P3"
type TaskType =
  | "ceo"
  | "sales"
  | "sdr"
  | "appointments"
  | "partnerships"
  | "b2c"
  | "market_os"
  | "academy"
  | "finance"
  | "hr"
  | "ops"
  | "quality"
  | "admin"

type ViewMode =
  | "dashboard"
  | "board"
  | "list"
  | "focus"
  | "agents"
  | "approvals"
  | "blocked"
  | "calendar"
  | "analytics"
  | "new"

type Subtask = {
  id: string
  title: string
  owner: string
  done: boolean
}

type Comment = {
  id: string
  author: string
  at: string
  body: string
}

type Preuves = {
  id: string
  label: string
  value: string
}

type Task = {
  id: string
  title: string
  executiveSummary: string
  type: TaskType
  status: TaskStatus
  priority: Priority
  owner: string
  requester: string
  department: string
  module: string
  recordRef: string
  dueDate: string
  dueTime: string
  estimatedMinutes: number
  spentMinutes: number
  progress: number
  valueMad: number
  impactScore: number
  urgencyScore: number
  complexityScore: number
  slaRisk: number
  approvalRequired: boolean
  evidenceRequired: boolean
  qualityGate: string
  successDefinition: string
  nextAction: string
  blocker: string
  dependency: string
  decisionNeeded: string
  agentInstructions: string
  managerNotes: string
  tags: string[]
  subtasks: Subtask[]
  comments: Comment[]
  evidence: Preuves[]
  createdAt: string
  updatedAt: string
}

type Log = {
  id: string
  taskId: string
  at: string
  action: string
  note: string
}

type Store = {
  tasks: Task[]
  logs: Log[]
}

const STORE_KEY = "revenue_daily_tasks_v13_mckinsey_store"

const statuses: TaskStatus[] = [
  "intake",
  "triaged",
  "today",
  "in_progress",
  "waiting_input",
  "blocked",
  "quality_review",
  "manager_approval",
  "completed",
  "archived",
]

const priorities: Priority[] = ["P0", "P1", "P2", "P3"]
const types: TaskType[] = ["ceo", "sales", "sdr", "appointments", "partnerships", "b2c", "market_os", "academy", "finance", "hr", "ops", "quality", "admin"]

const views: Array<{ mode: ViewMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Commandement", href: "/revenue-command-center/daily-tasks", desc: "Poste exécutif des tâches et engagements." },
  { mode: "board", label: "Tableau", href: "/revenue-command-center/daily-tasks/board", desc: "Cycle d’exécution par statut." },
  { mode: "list", label: "Liste", href: "/revenue-command-center/daily-tasks/list", desc: "Vue dense des tâches opérationnelles." },
  { mode: "focus", label: "Priorités", href: "/revenue-command-center/daily-tasks/focus", desc: "File de travail concentrée par agent." },
  { mode: "agents", label: "Équipe", href: "/revenue-command-center/daily-tasks/agents", desc: "Charge, capacité et responsabilité." },
  { mode: "approvals", label: "Approbations", href: "/revenue-command-center/daily-tasks/approvals", desc: "Décisions et portes de validation." },
  { mode: "blocked", label: "Blocages", href: "/revenue-command-center/daily-tasks/blocked", desc: "Obstacles, dépendances et récupération." },
  { mode: "calendar", label: "Calendrier", href: "/revenue-command-center/daily-tasks/calendar", desc: "Rythme quotidien et hebdomadaire." },
  { mode: "analytics", label: "Analyses", href: "/revenue-command-center/daily-tasks/analytics", desc: "SLA, valeur et qualité d’exécution." },
  { mode: "new", label: "Nouvelle tâche", href: "/revenue-command-center/daily-tasks/new", desc: "Créer une mission d’exécution complète." },
]
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString()
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value || 0)} Dh`
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function pTone(priority: Priority) {
  if (priority === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (priority === "P1") return "border-blue-200 bg-blue-50 text-blue-700"
  if (priority === "P2") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function sTone(status: TaskStatus) {
  if (status === "blocked") return "border-red-200 bg-red-50 text-red-700"
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "manager_approval" || status === "quality_review") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "waiting_input") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function seedTasks(): Task[] {
  const n = now()
  return [
    {
      id: "task-v13-vip-recovery",
      title: "Recover VIP postpartum family and secure consultation",
      executiveSummary: "High-value B2C lead requires immediate recovery, decision-maker confirmation and consultation booking.",
      type: "b2c",
      status: "today",
      priority: "P0",
      owner: "SDR Lead",
      requester: "Revenue Manager",
      department: "Revenue",
      module: "B2C Workflow",
      recordRef: "Family A — VIP postpartum support",
      dueDate: today(0),
      dueTime: "16:30",
      estimatedMinutes: 45,
      spentMinutes: 15,
      progress: 35,
      valueMad: 42000,
      impactScore: 91,
      urgencyScore: 95,
      complexityScore: 54,
      slaRisk: 82,
      approvalRequired: false,
      evidenceRequired: true,
      qualityGate: "Call note, outcome and next appointment must be captured.",
      successDefinition: "Consultation booked with decision maker confirmed.",
      nextAction: "Call spouse, confirm consultation window and document decision map.",
      blocker: "Decision maker availability uncertain.",
      dependency: "Family answers phone or WhatsApp.",
      decisionNeeded: "",
      agentInstructions: "Use trust-first script. Confirm mother/baby context, urgency, schedule, decision maker and budget comfort.",
      managerNotes: "High urgency. Manager should monitor outcome before end of day.",
      tags: ["vip", "b2c", "postpartum", "today"],
      subtasks: [
        { id: "sub-1", title: "Call spouse", owner: "SDR Lead", done: false },
        { id: "sub-2", title: "Send WhatsApp confirmation", owner: "SDR Lead", done: false },
        { id: "sub-3", title: "Update decision maker notes", owner: "SDR Lead", done: false },
      ],
      comments: [{ id: "com-1", author: "Revenue Manager", at: n, body: "Close the loop today. No vague status." }],
      evidence: [{ id: "ev-1", label: "Required evidence", value: "Call note + WhatsApp screenshot." }],
      createdAt: n,
      updatedAt: n,
    },
    {
      id: "task-v13-clinic-proposal",
      title: "Finalize clinic partnership proposal and approval deck",
      executiveSummary: "Clinic partnership needs final commercial proposal, referral flow and executive validation.",
      type: "partnerships",
      status: "manager_approval",
      priority: "P0",
      owner: "BD Officer",
      requester: "CEO",
      department: "Partnerships",
      module: "Partnerships",
      recordRef: "Clinique Maternité Rabat Premium",
      dueDate: today(1),
      dueTime: "11:00",
      estimatedMinutes: 120,
      spentMinutes: 70,
      progress: 66,
      valueMad: 420000,
      impactScore: 96,
      urgencyScore: 78,
      complexityScore: 76,
      slaRisk: 62,
      approvalRequired: true,
      evidenceRequired: true,
      qualityGate: "CEO approval required before external send.",
      successDefinition: "Approved proposal sent and meeting agenda confirmed.",
      nextAction: "Submit referral economics and one-pager to CEO for approval.",
      blocker: "",
      dependency: "CEO validates referral economics.",
      decisionNeeded: "Referral incentive and monthly review format.",
      agentInstructions: "Make proposal precise: SLA, patient flow, reporting, referral economics, quality controls.",
      managerNotes: "Needs executive review.",
      tags: ["partnership", "clinic", "proposal", "approval"],
      subtasks: [
        { id: "sub-4", title: "Finalize economics", owner: "BD Officer", done: true },
        { id: "sub-5", title: "Prepare one-pager", owner: "BD Officer", done: false },
        { id: "sub-6", title: "CEO approval", owner: "CEO", done: false },
      ],
      comments: [],
      evidence: [{ id: "ev-2", label: "Proposal file", value: "Pending upload/link." }],
      createdAt: n,
      updatedAt: n,
    },
    {
      id: "task-v13-ops-blocker",
      title: "Unblock caregiver matching for elderly care assessment",
      executiveSummary: "Service start is at risk because caregiver availability has not been confirmed.",
      type: "ops",
      status: "blocked",
      priority: "P1",
      owner: "Ops Coordinator",
      requester: "Care Coordinator",
      department: "Operations",
      module: "B2C Workflow",
      recordRef: "Family B — elderly care assessment",
      dueDate: today(0),
      dueTime: "18:00",
      estimatedMinutes: 60,
      spentMinutes: 25,
      progress: 30,
      valueMad: 38000,
      impactScore: 83,
      urgencyScore: 86,
      complexityScore: 68,
      slaRisk: 91,
      approvalRequired: false,
      evidenceRequired: true,
      qualityGate: "At least two staff options confirmed.",
      successDefinition: "Two qualified caregivers confirmed with availability and backup option.",
      nextAction: "Escalate staffing availability and confirm replacement option.",
      blocker: "No confirmed morning slot caregiver.",
      dependency: "HR/Ops availability confirmation.",
      decisionNeeded: "Whether to offer alternative time window.",
      agentInstructions: "Prioritize proximity, elderly-care experience, reliability and replacement coverage.",
      managerNotes: "Needs Ops Director attention if not resolved today.",
      tags: ["ops", "blocked", "caregiver", "elderly-care"],
      subtasks: [
        { id: "sub-7", title: "Check caregiver availability", owner: "Ops Coordinator", done: false },
        { id: "sub-8", title: "Confirm backup caregiver", owner: "Ops Coordinator", done: false },
      ],
      comments: [],
      evidence: [{ id: "ev-3", label: "Availability confirmation", value: "Pending." }],
      createdAt: n,
      updatedAt: n,
    },
  ]
}

function defaultStore(): Store {
  return {
    tasks: seedTasks(),
    logs: [{ id: "log-init", taskId: "system", at: now(), action: "Daily Tasks V13 initialized", note: "McKinsey-style corporate execution workspace ready." }],
  }
}

function readStore(): Store {
  if (typeof window === "undefined") return defaultStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as Store
    if (!Array.isArray(parsed.tasks)) return defaultStore()
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: Store) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(23,58,91,.065)] ${className}`}>{children}</section>
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "dark" | "blue" | "red" | "green" | "soft" }) {
  const tone = props.tone || "dark"
  const classes = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    blue: "bg-blue-700 text-white hover:bg-blue-800",
    red: "bg-red-700 text-white hover:bg-red-800",
    green: "bg-emerald-700 text-white hover:bg-emerald-800",
    soft: "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white",
  }
  return <button {...props} className={`rounded-xl px-4 py-3 text-sm font-black transition ${classes[tone]} ${props.className || ""}`} />
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[92px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} />
}

function defaultDraft() {
  return {
    title: "",
    executiveSummary: "",
    type: "ops" as TaskType,
    status: "intake" as TaskStatus,
    priority: "P1" as Priority,
    owner: "Agent",
    requester: "Manager",
    department: "Revenue",
    module: "Revenue Command",
    recordRef: "",
    dueDate: today(0),
    dueTime: "17:00",
    estimatedMinutes: 45,
    spentMinutes: 0,
    progress: 0,
    valueMad: 0,
    impactScore: 50,
    urgencyScore: 50,
    complexityScore: 40,
    slaRisk: 25,
    approvalRequired: false,
    evidenceRequired: false,
    qualityGate: "",
    successDefinition: "",
    nextAction: "",
    blocker: "",
    dependency: "",
    decisionNeeded: "",
    agentInstructions: "",
    managerNotes: "",
    tagsText: "daily\nexecution",
    subtasksText: "Clarify objective\nExecute action\nLog evidence",
    evidenceText: "Preuve requise",
  }
}

export default function RevenueDailyTasksV13McKinseyWorkspace({ mode = "dashboard" }: { mode?: ViewMode }) {
  const [store, setStore] = useState<Store>(() => defaultStore())
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [draft, setDraft] = useState(defaultDraft())
  const [newComment, setNewComment] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [newPreuves, setNewPreuves] = useState("")

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.tasks[0]?.id || "")
  }, [])

  const selected = store.tasks.find((task) => task.id === selectedId) || store.tasks[0]

  function commit(tasks: Task[], action: string, note: string, taskId?: string) {
    const next = {
      ...store,
      tasks,
      logs: [{ id: uid(), taskId: taskId || selectedId || "system", at: now(), action, note }, ...store.logs].slice(0, 200),
    }
    setStore(next)
    writeStore(next)
  }

  function restore() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.tasks[0]?.id || "")
    writeStore(seeded)
  }

  function updateTask(id: string, patch: Partial<Task>, action = "Task updated") {
    const target = store.tasks.find((t) => t.id === id)
    const tasks = store.tasks.map((task) => task.id === id ? { ...task, ...patch, updatedAt: now() } : task)
    commit(tasks, action, target?.title || id, id)
  }

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const task: Task = {
      id: uid(),
      title: draft.title,
      executiveSummary: draft.executiveSummary,
      type: draft.type,
      status: draft.status,
      priority: draft.priority,
      owner: draft.owner,
      requester: draft.requester,
      department: draft.department,
      module: draft.module,
      recordRef: draft.recordRef,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      estimatedMinutes: Number(draft.estimatedMinutes) || 0,
      spentMinutes: Number(draft.spentMinutes) || 0,
      progress: clamp(Number(draft.progress)),
      valueMad: Number(draft.valueMad) || 0,
      impactScore: clamp(Number(draft.impactScore)),
      urgencyScore: clamp(Number(draft.urgencyScore)),
      complexityScore: clamp(Number(draft.complexityScore)),
      slaRisk: clamp(Number(draft.slaRisk)),
      approvalRequired: Boolean(draft.approvalRequired),
      evidenceRequired: Boolean(draft.evidenceRequired),
      qualityGate: draft.qualityGate,
      successDefinition: draft.successDefinition,
      nextAction: draft.nextAction || "Execute and document the next action.",
      blocker: draft.blocker,
      dependency: draft.dependency,
      decisionNeeded: draft.decisionNeeded,
      agentInstructions: draft.agentInstructions,
      managerNotes: draft.managerNotes,
      tags: draft.tagsText.split("\n").map((x) => x.trim()).filter(Boolean),
      subtasks: draft.subtasksText.split("\n").map((title) => ({ id: uid(), title: title.trim(), owner: draft.owner, done: false })).filter((s) => s.title),
      comments: [],
      evidence: draft.evidenceText.trim() ? [{ id: uid(), label: "Preuves", value: draft.evidenceText.trim() }] : [],
      createdAt: now(),
      updatedAt: now(),
    }

    commit([task, ...store.tasks], "Task created", task.title, task.id)
    setSelectedId(task.id)
    setCreateOpen(false)
    setDraft(defaultDraft())
  }

  function deleteTask(id: string) {
    const target = store.tasks.find((t) => t.id === id)
    const tasks = store.tasks.filter((t) => t.id !== id)
    commit(tasks, "Task deleted", target?.title || id, id)
    setSelectedId(tasks[0]?.id || "")
  }

  function autoScore(id: string) {
    const target = store.tasks.find((t) => t.id === id)
    if (!target) return

    let risk = 15
    if (target.priority === "P0") risk += 30
    if (target.priority === "P1") risk += 18
    if (target.dueDate <= today(0)) risk += 25
    if (target.blocker.trim()) risk += 25
    if (target.progress < 40 && target.valueMad > 30000) risk += 12

    updateTask(id, {
      slaRisk: clamp(risk),
      impactScore: clamp((target.valueMad > 100000 ? 92 : target.valueMad > 30000 ? 75 : 55) + (target.priority === "P0" ? 8 : 0)),
      urgencyScore: target.dueDate <= today(0) ? 90 : target.urgencyScore,
      status: risk >= 80 ? "blocked" : target.status,
    }, "Task scored")
  }

  function startTask(id: string) {
    updateTask(id, { status: "in_progress", progress: Math.max(selected?.progress || 0, 15), nextAction: "Execute, update progress and capture evidence." }, "Task started")
  }

  function blockTask(id: string) {
    updateTask(id, { status: "blocked", slaRisk: 95, blocker: selected?.blocker || "Blocker requires manager intervention." }, "Task blocked")
  }

  function sendReview(id: string) {
    const target = store.tasks.find((t) => t.id === id)
    if (!target) return
    updateTask(id, {
      status: target.approvalRequired ? "manager_approval" : "quality_review",
      nextAction: "Review evidence, quality gate and final decision.",
    }, "Sent to review")
  }

  function completeTask(id: string) {
    const target = store.tasks.find((t) => t.id === id)
    if (!target) return
    if ((target.evidenceRequired && target.evidence.length === 0) || target.approvalRequired) {
      sendReview(id)
      return
    }
    updateTask(id, { status: "completed", progress: 100, slaRisk: 0, nextAction: "Completed and ready to archive." }, "Task completed")
  }

  function approveTask(id: string) {
    updateTask(id, { status: "completed", progress: 100, slaRisk: 0, approvalRequired: false, nextAction: "Approved and completed." }, "Task approved")
  }

  function advanceTask(id: string) {
    const target = store.tasks.find((t) => t.id === id)
    if (!target) return
    const nextStatus = statuses[Math.min(statuses.indexOf(target.status) + 1, statuses.length - 1)]
    updateTask(id, { status: nextStatus, progress: Math.min(100, target.progress + 12) }, `Advanced to ${label(nextStatus)}`)
  }

  function toggleSubtask(taskId: string, subId: string) {
    const target = store.tasks.find((t) => t.id === taskId)
    if (!target) return
    const subtasks = target.subtasks.map((s) => s.id === subId ? { ...s, done: !s.done } : s)
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
    updateTask(selected.id, { comments: [{ id: uid(), author: "Current user", at: now(), body: newComment.trim() }, ...selected.comments] }, "Comment added")
    setNewComment("")
  }

  function addPreuves() {
    if (!selected || !newPreuves.trim()) return
    updateTask(selected.id, { evidence: [{ id: uid(), label: "Preuves", value: newPreuves.trim() }, ...selected.evidence] }, "Preuves added")
    setNewPreuves("")
  }

  const filtered = useMemo(() => {
    return store.tasks.filter((task) => {
      const hay = `${task.title} ${task.executiveSummary} ${task.owner} ${task.module} ${task.recordRef} ${task.tags.join(" ")} ${task.nextAction} ${task.blocker}`.toLowerCase()

      const modeMatch =
        mode === "focus" ? ["today", "in_progress", "blocked"].includes(task.status) :
        mode === "approvals" ? task.approvalRequired || task.status === "manager_approval" || task.status === "quality_review" :
        mode === "blocked" ? task.status === "blocked" || task.blocker.trim() !== "" :
        mode === "calendar" ? ["today", "triaged", "in_progress"].includes(task.status) :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || task.status === statusFilter)
        && (typeFilter === "all" || task.type === typeFilter)
    })
  }, [store.tasks, query, statusFilter, typeFilter, mode])

  const stats = useMemo(() => {
    const open = store.tasks.filter((t) => !["completed", "archived"].includes(t.status)).length
    const blocked = store.tasks.filter((t) => t.status === "blocked" || t.blocker.trim()).length
    const approvals = store.tasks.filter((t) => t.approvalRequired || t.status === "manager_approval" || t.status === "quality_review").length
    const todayCount = store.tasks.filter((t) => t.dueDate === today(0) || t.status === "today").length
    const value = store.tasks.reduce((sum, t) => sum + t.valueMad, 0)
    const risk = Math.round(store.tasks.reduce((sum, t) => sum + t.slaRisk, 0) / Math.max(store.tasks.length, 1))
    const progress = Math.round(store.tasks.reduce((sum, t) => sum + t.progress, 0) / Math.max(store.tasks.length, 1))
    return { open, blocked, approvals, todayCount, value, risk, progress }
  }, [store.tasks])

  const boardGroups = statuses.map((status) => ({
    status,
    tasks: filtered.filter((task) => task.status === status),
  }))

  const ownerStats = useMemo(() => {
    const map = new Map<string, { owner: string; count: number; blocked: number; value: number; progress: number }>()
    for (const task of store.tasks) {
      const item = map.get(task.owner) || { owner: task.owner, count: 0, blocked: 0, value: 0, progress: 0 }
      item.count += 1
      item.blocked += task.status === "blocked" ? 1 : 0
      item.value += task.valueMad
      item.progress += task.progress
      map.set(task.owner, item)
    }
    return Array.from(map.values()).map((x) => ({ ...x, progress: Math.round(x.progress / Math.max(x.count, 1)) }))
  }, [store.tasks])

  return (
    <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-h-screen bg-[radial-gradient(circle_at_85%_-10%,rgba(70,143,202,.12),transparent_28%),linear-gradient(180deg,#f8fbfe_0%,#edf4f9_100%)] text-slate-950">
      <div className="w-full max-w-none min-w-0 space-y-6 p-5 lg:p-8">

        <section className="overflow-hidden rounded-[2.2rem] border border-[#d7e4ef] bg-white p-8 shadow-[0_24px_70px_rgba(25,66,101,.10)]">
          <div className="grid gap-8 xl:grid-cols-[1.12fr_.88fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black tracking-wide text-blue-700">ANGELCARE • EXÉCUTION QUOTIDIENNE</span>
                <span className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black tracking-wide text-slate-700">DISCIPLINE EXÉCUTIVE</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black tracking-wide text-emerald-700">DONNÉES OPÉRATIONNELLES</span>
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-950">
                Poste de commandement de l’exécution quotidienne
              </h1>

              <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
                Un environnement structuré pour prioriser, attribuer et clôturer le travail quotidien avec visibilité sur les SLA, blocages, preuves, approbations, qualité et capacité des équipes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button tone="blue" type="button" onClick={() => setCreateOpen(true)}>Créer une tâche</Button>
                <Button tone="dark" type="button" onClick={() => selected && startTask(selected.id)}>Démarrer la sélection</Button>
                <Button tone="red" type="button" onClick={() => selected && blockTask(selected.id)}>Bloquer la sélection</Button>
                <Link href="/revenue-command-center" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">Poste de commandement</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Ouvertes", stats.open],
                ["Aujourd’hui", stats.todayCount],
                ["Bloquées", stats.blocked],
                ["Approbations", stats.approvals],
                ["Valeur", mad(stats.value)],
                ["Risque SLA", `${stats.risk}%`],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{k}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {views.map((view) => (
            <Link key={view.href} href={view.href} className={`rounded-2xl border p-4 shadow-sm ${mode === view.mode ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{view.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{view.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Création de mission</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Créer une tâche d’exécution complète</h2>
              </div>
              <Button tone="soft" type="button" onClick={() => setCreateOpen(false)}>Fermer</Button>
            </div>

            <form onSubmit={createTask} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Intitulé de la tâche" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TaskType })}>{types.map((x) => <option key={x} value={x}>{label(x)}</option>)}</Select>
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>{statuses.map((x) => <option key={x} value={x}>{label(x)}</option>)}</Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>{priorities.map((x) => <option key={x} value={x}>{x}</option>)}</Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Responsable" />
              <Input value={draft.requester} onChange={(e) => setDraft({ ...draft, requester: e.target.value })} placeholder="Demandeur" />
              <Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="Département" />
              <Input value={draft.module} onChange={(e) => setDraft({ ...draft, module: e.target.value })} placeholder="Module concerné" />
              <Input value={draft.recordRef} onChange={(e) => setDraft({ ...draft, recordRef: e.target.value })} placeholder="Dossier lié" />
              <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Input type="time" value={draft.dueTime} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Valeur en Dh" />
              <Input type="number" value={draft.impactScore} onChange={(e) => setDraft({ ...draft, impactScore: Number(e.target.value) })} placeholder="Impact %" />
              <Input type="number" value={draft.urgencyScore} onChange={(e) => setDraft({ ...draft, urgencyScore: Number(e.target.value) })} placeholder="Urgence %" />
              <Input type="number" value={draft.complexityScore} onChange={(e) => setDraft({ ...draft, complexityScore: Number(e.target.value) })} placeholder="Complexité %" />
              <Input type="number" value={draft.slaRisk} onChange={(e) => setDraft({ ...draft, slaRisk: Number(e.target.value) })} placeholder="Risque SLA %" />
              <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black"><input type="checkbox" checked={draft.approvalRequired} onChange={(e) => setDraft({ ...draft, approvalRequired: e.target.checked })} /> Approbation requise</label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black"><input type="checkbox" checked={draft.evidenceRequired} onChange={(e) => setDraft({ ...draft, evidenceRequired: e.target.checked })} /> Preuve requise</label>
              <Textarea className="xl:col-span-2" value={draft.executiveSummary} onChange={(e) => setDraft({ ...draft, executiveSummary: e.target.value })} placeholder="Synthèse exécutive" />
              <Textarea className="xl:col-span-2" value={draft.successDefinition} onChange={(e) => setDraft({ ...draft, successDefinition: e.target.value })} placeholder="Critère de réussite" />
              <Textarea className="xl:col-span-2" value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Prochaine action" />
              <Textarea className="xl:col-span-2" value={draft.agentInstructions} onChange={(e) => setDraft({ ...draft, agentInstructions: e.target.value })} placeholder="Instructions d’exécution" />
              <Textarea className="xl:col-span-2" value={draft.qualityGate} onChange={(e) => setDraft({ ...draft, qualityGate: e.target.value })} placeholder="Contrôle qualité" />
              <Textarea className="xl:col-span-2" value={draft.blocker} onChange={(e) => setDraft({ ...draft, blocker: e.target.value })} placeholder="Blocage" />
              <Textarea className="xl:col-span-2" value={draft.tagsText} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} placeholder="Étiquettes, une par ligne" />
              <Textarea className="xl:col-span-2" value={draft.subtasksText} onChange={(e) => setDraft({ ...draft, subtasksText: e.target.value })} placeholder="Sous-tâches, une par ligne" />
              <Button tone="blue" type="submit" className="xl:col-span-4">Créer une tâche</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.35fr_.35fr_.25fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une tâche, un responsable, un module ou un blocage…" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}><option value="all">Tous les statuts</option>{statuses.map((x) => <option key={x} value={x}>{label(x)}</option>)}</Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TaskType | "all")}><option value="all">Tous les types</option>{types.map((x) => <option key={x} value={x}>{label(x)}</option>)}</Select>
            <Button tone="dark" type="button" onClick={restore}>Réinitialiser</Button>
          </div>
        </Card>

        {mode === "board" ? (
          <section className="grid gap-4 xl:grid-cols-5">
            {boardGroups.map((group) => (
              <Card key={group.status} className="min-h-[260px]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-slate-950">{label(group.status)}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{group.tasks.length}</span>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <button key={task.id} onClick={() => setSelectedId(task.id)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{task.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{task.owner} • {task.module}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-md border px-2 py-1 text-xs font-black ${pTone(task.priority)}`}>{task.priority}</span>
                        <span className={`rounded-md border px-2 py-1 text-xs font-black ${sTone(task.status)}`}>{task.slaRisk}% SLA</span>
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
            {ownerStats.map((agent) => (
              <Card key={agent.owner}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Charge de l’équipe</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{agent.owner}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500">{agent.count} tâches • {agent.blocked} bloquées • {mad(agent.value)}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${agent.progress}%` }} /></div>
                <p className="mt-2 text-sm font-black text-slate-700">{agent.progress}% average progress</p>
              </Card>
            ))}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
          <div className="space-y-4">
            {filtered.map((task) => (
              <Card key={task.id} className={task.id === selected?.id ? "border-blue-400 ring-4 ring-blue-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.7fr]">
                  <button onClick={() => setSelectedId(task.id)} className="text-left">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md border px-3 py-1 text-xs font-black ${pTone(task.priority)}`}>{task.priority}</span>
                      <span className={`rounded-md border px-3 py-1 text-xs font-black ${sTone(task.status)}`}>{label(task.status)}</span>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">{label(task.type)}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-slate-950">{task.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{task.executiveSummary}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{task.owner} • {task.module} • {task.dueDate} {task.dueTime}</p>
                  </button>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Score d’exécution</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{task.progress}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Impact {task.impactScore}% • SLA {task.slaRisk}%</p>
                    <p className="mt-2 text-sm font-black text-blue-700">{mad(task.valueMad)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button tone="soft" type="button" onClick={() => setSelectedId(task.id)}>Ouvrir</Button>
                    <Button tone="soft" type="button" onClick={() => autoScore(task.id)}>Évaluer</Button>
                    <Button tone="soft" type="button" onClick={() => startTask(task.id)}>Démarrer</Button>
                    <Button tone="soft" type="button" onClick={() => advanceTask(task.id)}>Avancer</Button>
                    <Button tone="red" type="button" onClick={() => blockTask(task.id)}>Bloquer</Button>
                    <Button tone="blue" type="button" onClick={() => sendReview(task.id)}>Réviser</Button>
                    <Button tone="green" type="button" onClick={() => approveTask(task.id)}>Approuver</Button>
                    <Button tone="dark" type="button" onClick={() => completeTask(task.id)}>Clôturer</Button>
                    <Button tone="red" type="button" onClick={() => deleteTask(task.id)} className="col-span-2">Supprimer</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <aside className="space-y-6">
            <Card>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Salle de commandement de la tâche</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{selected?.title || "Aucune tâche sélectionnée"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Progression</p><p className="mt-1 text-2xl font-black">{selected.progress}%</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">SLA</p><p className="mt-1 text-2xl font-black">{selected.slaRisk}%</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Valeur</p><p className="mt-1 text-xl font-black">{mad(selected.valueMad)}</p></div>
                  </div>

                  <Textarea value={selected.executiveSummary} onChange={(e) => updateTask(selected.id, { executiveSummary: e.target.value }, "Executive summary updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateTask(selected.id, { status: e.target.value as TaskStatus }, "Status updated")}>{statuses.map((x) => <option key={x} value={x}>{label(x)}</option>)}</Select>
                    <Select value={selected.priority} onChange={(e) => updateTask(selected.id, { priority: e.target.value as Priority }, "Priority updated")}>{priorities.map((x) => <option key={x} value={x}>{x}</option>)}</Select>
                    <Input value={selected.owner} onChange={(e) => updateTask(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.department} onChange={(e) => updateTask(selected.id, { department: e.target.value }, "Department updated")} />
                    <Input type="date" value={selected.dueDate} onChange={(e) => updateTask(selected.id, { dueDate: e.target.value }, "Due date updated")} />
                    <Input type="time" value={selected.dueTime} onChange={(e) => updateTask(selected.id, { dueTime: e.target.value }, "Due time updated")} />
                    <Input type="number" value={selected.progress} onChange={(e) => updateTask(selected.id, { progress: clamp(Number(e.target.value)) }, "Progression updated")} />
                    <Input type="number" value={selected.slaRisk} onChange={(e) => updateTask(selected.id, { slaRisk: clamp(Number(e.target.value)) }, "SLA updated")} />
                  </div>

                  <Textarea value={selected.successDefinition} onChange={(e) => updateTask(selected.id, { successDefinition: e.target.value }, "Success updated")} placeholder="Critère de réussite" />
                  <Textarea value={selected.nextAction} onChange={(e) => updateTask(selected.id, { nextAction: e.target.value }, "Next action updated")} placeholder="Prochaine action" />
                  <Textarea value={selected.agentInstructions} onChange={(e) => updateTask(selected.id, { agentInstructions: e.target.value }, "Agent instructions updated")} placeholder="Instructions d’exécution" />
                  <Textarea value={selected.qualityGate} onChange={(e) => updateTask(selected.id, { qualityGate: e.target.value }, "Quality gate updated")} placeholder="Contrôle qualité" />
                  <Textarea value={selected.blocker} onChange={(e) => updateTask(selected.id, { blocker: e.target.value, status: e.target.value.trim() ? "blocked" : selected.status }, "Blocker updated")} placeholder="Blocage" />
                  <Textarea value={selected.decisionNeeded} onChange={(e) => updateTask(selected.id, { decisionNeeded: e.target.value }, "Decision updated")} placeholder="Decision needed" />
                </div>
              ) : null}
            </Card>

            {selected ? (
              <>
                <Card>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Sous-tâches</p>
                  <div className="mt-4 space-y-2">
                    {selected.subtasks.map((sub) => (
                      <button key={sub.id} type="button" onClick={() => toggleSubtask(selected.id, sub.id)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-black text-slate-900">
                        {sub.done ? "✅" : "⬜"} {sub.title} <span className="text-slate-400">— {sub.owner}</span>
                      </button>
                    ))}
                    <div className="flex gap-2">
                      <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Nouvelle sous-tâche" />
                      <Button tone="blue" type="button" onClick={addSubtask}>Ajouter</Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Preuves</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input value={newPreuves} onChange={(e) => setNewPreuves(e.target.value)} placeholder="Ajouter une preuve, un lien ou une note" />
                      <Button tone="blue" type="button" onClick={addPreuves}>Ajouter</Button>
                    </div>
                    {selected.evidence.map((ev) => (
                      <div key={ev.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-950">{ev.label}</p>
                        <p className="mt-1 text-sm font-bold text-slate-600">{ev.value}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Commentaires</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ajouter un commentaire" />
                      <Button tone="blue" type="button" onClick={addComment}>Envoyer</Button>
                    </div>
                    {selected.comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-950">{comment.author}</p>
                        <p className="text-xs font-bold text-slate-500">{new Date(comment.at).toLocaleString()}</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Journal d’activité</p>
              <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1">
                {store.logs.slice(0, 14).map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.note} • {new Date(log.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  )
}
