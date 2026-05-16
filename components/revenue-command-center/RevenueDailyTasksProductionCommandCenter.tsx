"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useLiveAppointments, useLiveProspects, useLiveTasks } from "@/lib/revenue-command-center/live-sync"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Filter,
  Link2,
  Mail,
  Layers3,
  MessageCircle,
  PhoneCall,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  DatabaseZap,
  Gauge,
  Globe2,
  Handshake,
  Settings,
  X,
  Zap,
} from "lucide-react"
import {
  createDailyTask,
  runTaskQuickAction,
  type DailyCommandPayload,
  type DailyProspectOption,
  type DailyTask,
} from "@/lib/revenue-command-center/daily-tasks-command-store"

function dateTimePlus(days: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

function formatTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function taskTypeLabel(type: string) {
  return {
    prospect_follow_up: "Follow Up",
    qualification: "Qualification",
    proposal: "Proposal",
    negotiation: "Negotiation",
    contract: "Contract",
    appointment_prep: "Meeting",
    market_activation: "Activation",
    internal_control: "Control",
    document: "Document",
    recovery: "Recovery",
  }[type] || type || "Task"
}

const TASK_TYPES = [
  { id: "prospect_follow_up", label: "Follow Ups", icon: PhoneCall },
  { id: "proposal", label: "Proposals", icon: FileText },
  { id: "appointment_prep", label: "Meetings", icon: CalendarDays },
  { id: "contract", label: "Contracts", icon: CheckCircle2 },
  { id: "qualification", label: "Qualification", icon: Target },
  { id: "recovery", label: "Recovery", icon: AlertTriangle },
  { id: "document", label: "Documents", icon: Send },
  { id: "market_activation", label: "Activation", icon: Zap },
  { id: "internal_control", label: "Control", icon: Filter },
  { id: "negotiation", label: "Negotiation", icon: MessageCircle },
] as const

const FINAL_TASK_TYPE_OPTIONS = [
  {
    id: "prospect_follow_up",
    label: "Follow-up",
    icon: PhoneCall,
    detail: "Call, WhatsApp, email, and recovery follow-up",
    defaultTitle: "Follow up with selected prospect",
    defaultOutcome: "Next commercial step confirmed and logged.",
  },
  {
    id: "qualification",
    label: "Qualification",
    icon: Target,
    detail: "Need, budget, decision-maker, urgency validation",
    defaultTitle: "Qualify selected prospect",
    defaultOutcome: "Qualification score and next step validated.",
  },
  {
    id: "proposal",
    label: "Proposal",
    icon: FileText,
    detail: "Prepare, send, revise, and track offer proposal",
    defaultTitle: "Prepare proposal for selected prospect",
    defaultOutcome: "Proposal ready/sent with clear commercial value.",
  },
  {
    id: "negotiation",
    label: "Negotiation",
    icon: MessageCircle,
    detail: "Resolve objections, terms, budget, and closing path",
    defaultTitle: "Advance negotiation with selected prospect",
    defaultOutcome: "Objections addressed and closing path defined.",
  },
  {
    id: "contract",
    label: "Contract",
    icon: ShieldCheck,
    detail: "Contract preparation, validation, signature follow-up",
    defaultTitle: "Prepare contract control step",
    defaultOutcome: "Contract path secured and next legal/commercial step ready.",
  },
  {
    id: "appointment_prep",
    label: "Meeting Prep",
    icon: CalendarDays,
    detail: "Brief, agenda, documents, and decision mapping",
    defaultTitle: "Prepare commercial meeting",
    defaultOutcome: "Meeting agenda and required materials ready.",
  },
  {
    id: "market_activation",
    label: "Market Activation",
    icon: Sparkles,
    detail: "City/sector domination action and outreach sequence",
    defaultTitle: "Launch market activation action",
    defaultOutcome: "Target segment contacted and activation tracked.",
  },
  {
    id: "internal_control",
    label: "Internal Control",
    icon: Layers3,
    detail: "Manager review, process control, quality assurance",
    defaultTitle: "Run internal execution control",
    defaultOutcome: "Control completed and gaps escalated if needed.",
  },
  {
    id: "document",
    label: "Document",
    icon: Send,
    detail: "Proposal, contract, pricing, attachment, or proof document",
    defaultTitle: "Prepare or send required document",
    defaultOutcome: "Document created/sent and linked to prospect.",
  },
  {
    id: "recovery",
    label: "Recovery",
    icon: TrendingUp,
    detail: "Rescue stalled or inactive prospect with dedicated motion",
    defaultTitle: "Run recovery motion for selected prospect",
    defaultOutcome: "Prospect reactivated or classified with clear next action.",
  },
] as const

function finalTaskTypeMeta(type: string) {
  return FINAL_TASK_TYPE_OPTIONS.find((item) => item.id === type) || FINAL_TASK_TYPE_OPTIONS[0]
}

function priorityClass(value: string) {
  if (value === "critical" || value === "high") return "bg-red-500/15 text-red-200 border-red-400/20"
  if (value === "medium") return "bg-amber-500/15 text-amber-200 border-amber-400/20"
  return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
}


function resolveProspectLabel(task: any, prospects: any[] = []): string {
  const linkedId =
    task?.prospect_id ||
    task?.prospectId ||
    task?.entity_id ||
    task?.entityId ||
    task?.raw?.prospect_id ||
    task?.raw?.entity_id

  const linkedProspect = prospects.find((p: any) =>
    p?.id === linkedId ||
    p?.prospect_id === linkedId ||
    p?.uuid === linkedId
  )

  return String(
    linkedProspect?.name ||
    linkedProspect?.company ||
    linkedProspect?.title ||
    task?.prospect_name ||
    task?.prospectName ||
    task?.company ||
    task?.entity_name ||
    task?.raw?.entity_name ||
    task?.raw?.prospect_name ||
    "Linked live prospect"
  )
}

function resolveProspectSubLabel(task: any, prospects: any[] = []): string {
  const linkedId =
    task?.prospect_id ||
    task?.prospectId ||
    task?.entity_id ||
    task?.entityId

  const linkedProspect = prospects.find((p: any) =>
    p?.id === linkedId ||
    p?.prospect_id === linkedId ||
    p?.uuid === linkedId
  )

  return (
    linkedProspect?.owner ||
    linkedProspect?.city ||
    linkedProspect?.sector ||
    task?.assigned_to ||
    task?.owner ||
    "Linked live prospect"
  )
}

function statusLabel(task: DailyTask) {
  if (task.status_label) return task.status_label
  if (task.status === "done") return "Completed"
  if (task.status === "cancelled") return "Cancelled"
  if (task.due_date && task.due_date < todayISO()) return "Overdue"
  if (task.start_at && new Date(task.start_at) > new Date()) return "Scheduled"
  return "In Progress"
}


function normalizeLiveTaskForDailyPage(task: any): DailyTask {
  return {
    ...task.raw,
    id: task.id,
    entity_id: task.entityId || task.raw?.entity_id || "",
    entity_name: task.entityName || task.raw?.entity_name || task.raw?.prospect_name || "",
    title: task.title || task.raw?.title || "Untitled task",
    description: task.description || task.raw?.description || "",
    status: task.status || task.raw?.status || "pending",
    priority: task.priority || task.raw?.priority || "medium",
    task_type: task.task_type || task.raw?.task_type || task.raw?.type || "follow_up",
    owner: task.owner || task.raw?.owner || "BD Officer",
    assigned_role: task.assignedRole || task.raw?.assigned_role || "",
    start_at: task.start_at || task.raw?.start_at || null,
    end_at: task.end_at || task.raw?.end_at || null,
    due_date: task.due_date || task.raw?.due_date || task.raw?.due_at || null,
    location: task.location || task.raw?.location || "",
    expected_outcome: task.expectedOutcome || task.raw?.expected_outcome || "",
    updated_at: task.updatedAt || task.raw?.updated_at || "",
  } as DailyTask
}

function normalizeLiveProspectForDailyPage(prospect: any) {
  return {
    ...prospect.raw,
    id: prospect.id,
    name: prospect.name,
    city: prospect.city,
    stage: prospect.stage,
    priority: prospect.priority,
    value_mad: prospect.valueMad,
    score: prospect.score,
    data: {
      ...(prospect.raw?.data || {}),
      owner: prospect.owner,
      contactName: prospect.contactName,
      email: prospect.email,
      phone: prospect.phone,
    },
  }
}

function normalizeLiveAppointmentForDailyPage(appointment: any) {
  return {
    ...appointment.raw,
    id: appointment.id,
    entity_id: appointment.entityId,
    title: appointment.title,
    appointment_at: appointment.appointmentAt,
    end_at: appointment.endAt,
    owner: appointment.owner,
    status: appointment.status,
    appointment_type: appointment.appointmentType,
    priority: appointment.priority,
    location: appointment.location,
    meeting_link: appointment.meetingLink,
  }
}

function statusClass(label: string) {
  if (label === "Completed") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
  if (label === "Overdue") return "bg-red-500/15 text-red-200 border-red-400/20"
  if (label === "Scheduled") return "bg-violet-500/15 text-violet-200 border-violet-400/20"
  if (label === "Pending") return "bg-amber-500/15 text-amber-200 border-amber-400/20"
  return "bg-blue-500/15 text-blue-200 border-blue-400/20"
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "AC"
}


function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

function GitPipelineIcon() {
  return <Layers3 className="h-5 w-5" />
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[.16em] text-white/65">{title}</div>
      <div className="rcc-shell-content w-full max-w-none min-w-0 space-y-1">
      
      <style jsx global>{`
        /* RCC_PARENT_SHELL_FULLWIDTH_FIX_V5 */
        .rcc-shell-main,
        .rcc-shell-content,
        .rcc-shell-content > *,
        main.rcc-shell-main > * {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
        }
        [class*="revenue-command-center"] {
          max-width: none !important;
        }
      `}</style>

      {children}</div>
    </div>
  )
}

function NavItem({ href, icon, label, badge, active }: { href: string; icon: React.ReactNode; label: string; badge?: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition", active ? "bg-violet-600/30 text-white ring-1 ring-violet-400/30" : "text-white/78 hover:bg-[#1a2b42] hover:text-white")}>
      <span className="grid h-5 w-5 place-items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{badge}</span>}
    </Link>
  )
}

function RevenueSidebar({ totalTasks, activeTasks, overdueTasks }: { totalTasks: number; activeTasks: number; overdueTasks: number }) {
  return (
    <aside className="sticky top-[92px] hidden h-[calc(100vh-92px)] w-[286px] shrink-0 border-r border-[#244365] bg-[#07111f]/95 px-5 py-6 shadow-[16px_0_60px_rgba(0,0,0,.35)] backdrop-blur-xl xl:block">
      <Link href="/revenue-command-center" className="mb-7 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-600 text-black shadow-lg shadow-yellow-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-black tracking-[.18em] text-white">ANGELCARE</div>
          <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white/80">PROSPECT CENTER</div>
        </div>
      </Link>

      <NavGroup title="Command HQ">
        <NavItem href="/revenue-command-center" icon={<BarChart3 />} label="Command Center" />
      </NavGroup>

      <NavGroup title="Prospect Management">
        <NavItem href="/revenue-command-center/prospects" icon={<Users />} label="All Prospects" />
        <NavItem href="/revenue-command-center/prospects/directory" icon={<Target />} label="Prospects Directory" />
        <NavItem href="/revenue-command-center/prospects/high-value" icon={<Zap />} label="Hot Prospects" />
        <NavItem href="/revenue-command-center/prospects/pipeline" icon={<GitPipelineIcon />} label="Pipeline" />
        <NavItem href="/revenue-command-center/prospects/decision-map" icon={<Handshake />} label="Partner Program" />
      </NavGroup>

      <NavGroup title="Execution">
        <NavItem href="/revenue-command-center/daily-tasks" icon={<CheckCircle2 />} label="Tasks & Actions" active badge={String(activeTasks)} />
        <NavItem href="/revenue-command-center/appointments" icon={<CalendarDays />} label="Calendar" />
        <NavItem href="/revenue-command-center/activity-timeline" icon={<Clock3 />} label="Activity Timeline" />
        <NavItem href="/revenue-command-center/automation" icon={<Zap />} label="Automations" />
        <NavItem href="/revenue-command-center/campaigns" icon={<Mail />} label="Email Campaigns" />
        <NavItem href="/revenue-command-center/follow-ups" icon={<MessageCircle />} label="WhatsApp Center" />
      </NavGroup>

      <NavGroup title="Intelligence">
        <NavItem href="/revenue-command-center/market-mapping" icon={<Globe2 />} label="Market Map" />
        <NavItem href="/revenue-command-center/revenue-analytics" icon={<BarChart3 />} label="Analytics & Reports" />
        <NavItem href="/revenue-command-center/predictive" icon={<Gauge />} label="Competitors" />
        <NavItem href="/revenue-command-center/executive-briefing" icon={<ShieldCheck />} label="Executive Briefing" />
      </NavGroup>

      <NavGroup title="System">
        <NavItem href="/revenue-command-center/management" icon={<Users />} label="Team" />
        <NavItem href="/production-persistence-center" icon={<DatabaseZap />} label="Integrations" />
        <NavItem href="/revenue-command-center/settings" icon={<Settings />} label="Settings" />
      </NavGroup>

      <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#244365] bg-[#10223a] p-4">
        <div className="text-xs font-black uppercase tracking-[.14em] text-white/60">Execution Health</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div><div className="text-lg font-black text-white">{totalTasks}</div><div className="text-[10px] text-white/60">tasks</div></div>
          <div><div className="text-lg font-black text-emerald-300">{activeTasks}</div><div className="text-[10px] text-white/60">active</div></div>
          <div><div className="text-lg font-black text-red-300">{overdueTasks}</div><div className="text-[10px] text-white/60">overdue</div></div>
        </div>
      </div>
    </aside>
  )
}


async function syncTaskStatus({
  taskId,
  status,
  setTasks,
}: {
  taskId: string
  status: string
  setTasks?: any
}) {
  try {
    const normalized =
      status === "completed" ? "done" :
      status === "in_progress" ? "open" :
      status

    if (typeof window !== "undefined") {
      const response = await fetch("/api/revenue/tasks/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          status: normalized,
        }),
      })

      await response.json().catch(() => ({}))
    }

    if (setTasks) {
      setTasks((prev: any[]) =>
        prev.map((task: any) =>
          task.id === taskId
            ? {
                ...task,
                status: normalized,
                updated_at: new Date().toISOString(),
              }
            : task
        )
      )
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rcc-task-status-updated", {
          detail: {
            taskId,
            status: normalized,
            at: Date.now(),
          },
        })
      )
    }
  } catch (error) {
    console.error("Task status sync failed", error)
  }
}


export default function RevenueDailyTasksProductionCommandCenter() {
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<"all" | "mine" | "team" | "delegated" | "following">("all")
  const [priority, setPriority] = useState("all")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [error, setError] = useState("")
  const { tasks: liveTasks, loading: tasksLoading, error: tasksError } = useLiveTasks()
  const { prospects: liveProspects, loading: prospectsLoading, error: prospectsError } = useLiveProspects()
  const { appointments: liveAppointments, loading: appointmentsLoading, error: appointmentsError } = useLiveAppointments()
  const loading = tasksLoading || prospectsLoading || appointmentsLoading

  const [actionMessage, setActionMessage] = useState("")
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null)
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<string | null>(null)
  const [noteTask, setNoteTask] = useState<DailyTask | null>(null)
  const [callTask, setCallTask] = useState<DailyTask | null>(null)

  async function refresh() {
    setError("")
    await Promise.resolve()
  }


  const tasks = liveTasks.map(normalizeLiveTaskForDailyPage)
  const prospects = liveProspects.map(normalizeLiveProspectForDailyPage)
  const metrics = {
    total_tasks: tasks.length,
    completed_tasks: tasks.filter((task: any) => task.status === "done" || task.status === "completed").length,
    in_progress_tasks: tasks.filter((task: any) => ["open", "in_progress", "scheduled"].includes(String(task.status))).length,
    pending_tasks: tasks.filter((task: any) => String(task.status) === "pending").length,
    overdue_tasks: tasks.filter((task: any) => {
      const due = task.due_date
      return due ? new Date(due).getTime() < Date.now() && !["done", "completed"].includes(String(task.status)) : false
    }).length,
    next_7_days: tasks.filter((task: any) => {
      const due = task.due_date
      if (!due) return false
      const time = new Date(due).getTime()
      return time >= Date.now() && time <= Date.now() + 7 * 24 * 60 * 60 * 1000
    }).length,
    completion_rate: tasks.length
      ? Math.round((tasks.filter((task: any) => task.status === "done" || task.status === "completed").length / tasks.length) * 100)
      : 0,
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (priority !== "all" && task.priority !== priority) return false
        if (category !== "all" && task.task_type !== category) return false
        const currentStatus = statusLabel(task).toLowerCase().replace(/\s+/g, "_")
        if (status !== "all" && currentStatus !== status) return false
        if (scope === "mine" && !["BD Officer", "SDR"].includes(task.owner)) return false
        if (scope === "delegated" && !task.assigned_role) return false
        if (scope === "following" && !(task.tags || []).includes("following")) return false
        if (!q) return true
        return [
          task.title,
          task.description,
          task.owner,
          task.task_type,
          task.priority,
          task.entity_name,
          task.entity_city,
          task.entity_contact,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        const ap = a.priority === "critical" ? 4 : a.priority === "high" ? 3 : a.priority === "medium" ? 2 : 1
        const bp = b.priority === "critical" ? 4 : b.priority === "high" ? 3 : b.priority === "medium" ? 2 : 1
        return bp - ap
      })
  }, [tasks, priority, category, status, scope, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paged = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => setPage(1), [query, priority, category, status, scope, itemsPerPage])

  async function action(task: DailyTask, actionType: "complete" | "reopen" | "delete") {
    await runTaskQuickAction(task.id, actionType)
    await refresh()
  }

  async function updateTaskSmartStatus(task: DailyTask, nextStatus: "open" | "done" | "cancelled", nextLabel: string) {
    const response = await fetch("/api/revenue-command-center/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        taskId: task.id,
        entityId: task.entity_id,
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        owner: task.owner,
        dueDate: task.due_date || null,
        startAt: task.start_at || null,
        endAt: task.end_at || null,
        taskType: task.task_type,
        department: task.department,
        assignedRole: task.assigned_role || "",
        location: task.location || "",
        outcomeExpected: task.outcome_expected || "",
        escalationRule: task.escalation_rule || "",
        dependencies: task.dependencies || "",
        tags: task.tags || [],
        visibility: task.visibility || "team",
        reminderMinutes: task.reminder_minutes || 15,
        addToCalendar: task.add_to_calendar ?? true,
        sendNotifications: task.send_notifications ?? true,
        status: nextStatus,
        statusLabel: nextLabel,
      }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.ok) {
      setError(payload.error || "Unable to update task status")
      return
    }
    setStatusMenuTaskId(null)
    setActionMessage(`Status updated to ${nextLabel}.`)
    await refresh()
  }

  async function createTask(input: EnterpriseTaskPayload) {
    await createDailyTask(input)
    setActionMessage("Task created and synced to Revenue Tasks.")
    await refresh()
  }

  async function updateTaskFromFullModal(taskId: string, input: EnterpriseTaskPayload) {
    const response = await fetch("/api/revenue-command-center/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ taskId, ...input }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.ok) {
      setError(payload.error || "Unable to update task")
      return
    }
    setActionMessage("Task updated from full modal and synced everywhere.")
    await refresh()
  }

  function showAction(message: string) {
    setActionMessage(message)
    window.setTimeout(() => setActionMessage(""), 2600)
  }

  function exportTasksCsv() {
    const rows = filtered.map((task) => ({
      title: task.title,
      prospect: task.entity_name || task.entity_id,
      city: task.entity_city || "",
      type: task.task_type,
      priority: task.priority,
      owner: task.owner,
      status: statusLabel(task),
      due_date: task.due_date || "",
      start_at: task.start_at || "",
      end_at: task.end_at || "",
    }))
    const header = Object.keys(rows[0] || { title: "", prospect: "", city: "", type: "", priority: "", owner: "", status: "", due_date: "", start_at: "", end_at: "" })
    const csv = [header.join(","), ...rows.map((row: any) => header.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `angelcare-daily-tasks-${todayISO()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showAction("Tasks exported as CSV.")
  }

  function openEmailTask(task?: DailyTask) {
    const target = task || tasks[0]
    if (!target) return showAction("No task available for email.")
    const email = target.entity_email || ""
    const subject = encodeURIComponent(`AngelCare follow-up: ${target.title}`)
    const body = encodeURIComponent(`Hello,\n\nFollowing up regarding: ${target.title}\n\nBest regards,\nAngelCare`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  function openCallTask(task?: DailyTask) {
    const target = task || tasks.find((item) => item.entity_phone)
    if (!target?.entity_phone) return showAction("No phone number available for this prospect.")
    window.location.href = `tel:${target.entity_phone}`
  }

  const categories: Array<{ task_type: string; total: number; count: number; pct: number }> = Object.values(
    tasks.reduce((acc: Record<string, { task_type: string; total: number; count: number; pct: number }>, task: DailyTask) => {
      const type = task.task_type || "follow_up"
      if (!acc[type]) acc[type] = { task_type: type, total: 0, count: 0, pct: 0 }
      acc[type].total += 1
      acc[type].count += 1
      return acc
    }, {}),
  ).map((item) => ({
    ...item,
    pct: tasks.length ? Math.round((item.total / tasks.length) * 100) : 0,
  }))

  const workload: Array<{
    owner: string
    total_tasks: number
    open_tasks: number
    completed_tasks: number
    priority_tasks: number
  }> = Object.values(
    tasks.reduce((acc: Record<string, { owner: string; total_tasks: number; open_tasks: number; completed_tasks: number; priority_tasks: number }>, task: DailyTask) => {
      const owner = task.owner || resolveProspectSubLabel(task, prospects)
      if (!acc[owner]) acc[owner] = { owner, total_tasks: 0, open_tasks: 0, completed_tasks: 0, priority_tasks: 0 }
      acc[owner].total_tasks += 1
      if (["done", "completed"].includes(String(task.status))) acc[owner].completed_tasks += 1
      else acc[owner].open_tasks += 1
      if (["high", "critical"].includes(String(task.priority))) acc[owner].priority_tasks += 1
      return acc
    }, {}),
  ).sort((a, b) => b.total_tasks - a.total_tasks)
  const upcoming = tasks
    .filter((t) => t.status === "open" && t.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 4)

  return (
    <main data-daily-tasks-command="true" className="min-h-screen bg-[#050b16] px-4 pb-4 pt-[92px] text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        /* restore daily tasks top alignment without damaging template */
        [data-daily-tasks-command] { align-self: stretch !important; justify-self: stretch !important; }
        [data-daily-tasks-command] > div.relative { margin-top: 0 !important; transform: none !important; }

        [data-daily-tasks-command] * { color: inherit; }
        [data-daily-tasks-command] .force-white,
        [data-daily-tasks-command] .force-white * { color: #fff !important; opacity: 1 !important; }
        [data-daily-tasks-command] .muted { color: rgba(255,255,255,.78) !important; }
      ` }} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(124,58,237,.15),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,.12),transparent_28%),linear-gradient(180deg,#07111f_0%,#030814_70%,#020611_100%)]" />
      {(modalOpen || editingTask) && (
        <TaskModal
          prospects={prospects}
          editingTask={editingTask}
          onClose={() => {
            setModalOpen(false)
            setEditingTask(null)
          }}
          onSubmit={(input) => {
            if (editingTask) {
              void updateTaskFromFullModal(editingTask.id, input)
            } else {
              void createTask(input)
            }
            setModalOpen(false)
            setEditingTask(null)
          }}
        />
      )}

      <div className="relative flex w-full min-w-0 max-w-none items-start gap-4">
        <RevenueSidebar totalTasks={metrics.total_tasks} activeTasks={metrics.in_progress_tasks + metrics.pending_tasks} overdueTasks={metrics.overdue_tasks} />
        <section className="min-w-0 flex-1">
        <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Revenue Command Center / Live Execution</div>
            <h1 className="mt-1 text-3xl font-black text-white">Daily Tasks · Live Synced Command Center</h1>
            <p className="mt-1 text-sm font-semibold text-white/75">Real task operations powered by Supabase: revenue_tasks, revenue_prospects, events and analytics.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" /> Add Task</button>
            <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" /> Refresh</button>
            <button onClick={exportTasksCsv} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"><FileText className="h-4 w-4" /> Export CSV</button>
          </div>
        </header>

        {(error || tasksError || prospectsError || appointmentsError) && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-100">{error || tasksError || prospectsError || appointmentsError}</div>}
        {actionMessage && <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-black text-emerald-100">{actionMessage}</div>}

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_360px]">
          <Kpi icon={<Sparkles />} label="Total Tasks" value={String(metrics.total_tasks)} detail="from revenue_tasks" tone="violet" />
          <Kpi icon={<CheckCircle2 />} label="Completed" value={String(metrics.completed_tasks)} detail={`${metrics.completion_rate}% of total`} tone="emerald" />
          <Kpi icon={<RefreshCcw />} label="In Progress" value={String(metrics.in_progress_tasks)} detail="live active tasks" tone="blue" />
          <Kpi icon={<Clock3 />} label="Pending" value={String(metrics.pending_tasks)} detail="future scheduled" tone="amber" />
          <Kpi icon={<AlertTriangle />} label="Overdue" value={String(metrics.overdue_tasks)} detail="needs attention" tone="red" />
          <TaskDonut metrics={metrics} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_430px]">
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Tab active={scope === "all"} onClick={() => setScope("all")}>All Tasks ({tasks.length})</Tab>
                  <Tab active={scope === "mine"} onClick={() => setScope("mine")}>My Tasks</Tab>
                  <Tab active={scope === "team"} onClick={() => setScope("team")}>Team Tasks</Tab>
                  <Tab active={scope === "delegated"} onClick={() => setScope("delegated")}>Delegated</Tab>
                  <Tab active={scope === "following"} onClick={() => setScope("following")}>Following</Tab>
                </div>
                <div className="grid gap-2 md:grid-cols-[220px_170px_170px_150px_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="h-11 w-full rounded-xl border border-[#244365] bg-[#07111f] pl-10 pr-3 text-sm font-bold text-white outline-none placeholder:text-white/45" />
                  </div>
                  <SelectMini value={priority} onChange={setPriority} options={["all", "critical", "high", "medium", "low"]} />
                  <SelectMini value={category} onChange={setCategory} options={["all", ...TASK_TYPES.map((t) => t.id)]} />
                  <SelectMini value={status} onChange={setStatus} options={["all", "in_progress", "scheduled", "completed", "overdue"]} />
                  <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#244365] bg-[#07111f] px-4 text-sm font-black text-white"><Filter className="h-4 w-4" /> Filters</button>
                </div>
              </div>
            </Panel>

            <Panel className="overflow-visible p-0">
              <div className="grid grid-cols-[42px_1.3fr_1fr_.45fr_.5fr_.75fr_.65fr_.65fr_135px] gap-3 border-b border-[#244365] bg-[#07111f] px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] text-white/65 max-2xl:hidden">
                <span>✓</span><span>Task</span><span>Prospect / Company</span><span>Type</span><span>Priority</span><span>Assignee</span><span>Due Time</span><span>Status</span><span>Actions</span>
              </div>

              {loading ? (
                <div className="p-14 text-center text-sm font-black text-white/70">Loading real tasks...</div>
              ) : paged.length ? (
                <div className="divide-y divide-white/5">
                  {paged.map((task) => {
                    const label = statusLabel(task)
                    return (
                      <div key={task.id} className="force-white grid gap-3 px-4 py-4 transition hover:bg-white/[.03] 2xl:grid-cols-[42px_1.3fr_1fr_.45fr_.5fr_.75fr_.65fr_.65fr_135px] 2xl:items-center">
                        <button onClick={() => void action(task, task.status === "done" ? "reopen" : "complete")} className="grid h-8 w-8 place-items-center rounded-lg border border-[#315474] bg-[#07111f] text-emerald-300">
                          {task.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <span />}
                        </button>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">{task.title}</div>
                          <div className="truncate text-xs font-semibold text-white/75">{task.description || task.outcome_expected || "No execution brief"}</div>
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-900 text-xs font-black">{initials(task.entity_name || task.entity_id)}</div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-white">{task.entity_name || resolveProspectLabel(task, prospects)}</div>
                            <div className="truncate text-xs font-semibold text-white/70">{task.entity_city || resolveProspectSubLabel(task, prospects)}</div>
                          </div>
                        </div>
                        <Badge value={taskTypeLabel(task.task_type)} tone="type" />
                        <Badge value={task.priority} tone={task.priority} />
                        <div className="flex items-center gap-2">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-sky-400 text-xs font-black text-slate-950">{initials(task.owner)}</div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-white">{task.owner}</div>
                            <div className="truncate text-xs font-semibold text-white/60">{task.assigned_role || "Owner"}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-white">{formatTime(task.start_at || task.end_at)}<br /><span className="text-xs text-white/60">{task.due_date || "No due"}</span></div>
                        <SmartStatusSelector
                          task={task}
                          label={label}
                          open={statusMenuTaskId === task.id}
                          onToggle={() => setStatusMenuTaskId(statusMenuTaskId === task.id ? null : task.id)}
                          onChange={(nextStatus, nextLabel) => void updateTaskSmartStatus(task, nextStatus, nextLabel)}
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingTask(task)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-blue-200" title="Edit task"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => void action(task, task.status === "done" ? "reopen" : "complete")} className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-200" title="Complete/Reopen"><Check className="h-4 w-4" /></button>
                          <button onClick={() => void action(task, "delete")} className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/15 text-red-200" title="Delete task"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-14 text-center">
                  <div className="text-xl font-black text-white">No tasks match this view</div>
                  <p className="mt-2 text-sm font-semibold text-white/65">Create a real task or change filters.</p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#244365] bg-[#07111f]/80 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-bold text-white/75">Showing {paged.length ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} tasks</div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[#244365] bg-[#07111f] px-4 py-2 text-sm font-black text-white disabled:opacity-40">‹</button>
                  <span className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">{page}</span>
                  <span className="px-2 text-white/50">/ {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl border border-[#244365] bg-[#07111f] px-4 py-2 text-sm font-black text-white disabled:opacity-40">›</button>
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="rounded-xl border border-[#244365] bg-[#07111f] px-3 py-2 text-sm font-black text-white">
                    {[8, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </Panel>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <SmartActions tasks={tasks} prospects={prospects} />
              <TeamWorkload workload={workload} />
              <Automations />
            </section>
          </div>

          <aside className="space-y-4">
            <SidePanel title="Productivity" action="This Week">
              <div className="text-4xl font-black text-white">{metrics.completion_rate}%</div>
              <div className="mt-1 text-sm font-semibold text-white/65">Team productivity from completed tasks</div>
              <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${metrics.completion_rate}%` }} /></div>
            </SidePanel>

            <SidePanel title="Upcoming Deadlines" action="Next 7 Days">
              <div className="space-y-3">
                {upcoming.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-200"><CalendarDays className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">{task.title}</div>
                      <div className="truncate text-xs font-semibold text-white/65">{task.entity_name || task.entity_id}</div>
                    </div>
                    <div className="text-right text-xs font-bold text-white/65">{task.due_date || "No due"}</div>
                  </div>
                ))}
                {!upcoming.length && <div className="text-sm font-bold text-white/60">No upcoming deadlines.</div>}
              </div>
            </SidePanel>

            <SidePanel title="Task Categories" action="View All">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.task_type}>
                    <div className="mb-1 flex justify-between text-sm font-bold text-white"><span>{taskTypeLabel(cat.task_type)}</span><span>{cat.total} ({cat.pct}%)</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, cat.pct)}%` }} /></div>
                  </div>
                ))}
                {!categories.length && <div className="text-sm font-bold text-white/60">No categories yet.</div>}
              </div>
            </SidePanel>

            <SidePanel title="Quick Actions">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
                <Quick icon={<Sparkles />} label="Add Task" onClick={() => setModalOpen(true)} />
                <Quick icon={<CalendarDays />} label="Schedule Meeting" onClick={() => { setModalOpen(true); showAction("Choose Meeting Prep task type in the modal.") }} />
                <Quick icon={<FileText />} label="Export Tasks" onClick={exportTasksCsv} />
              </div>
            </SidePanel>
          </aside>
        </section>
        </section>
      </div>
    </main>
  )
}


function SmartStatusSelector({
  task,
  label,
  open,
  onToggle,
  onChange,
}: {
  task: DailyTask
  label: string
  open: boolean
  onToggle: () => void
  onChange: (nextStatus: "open" | "done" | "cancelled", nextLabel: string) => void
}) {
  const options: Array<{
    label: string
    description: string
    status: "open" | "done" | "cancelled"
    tone: string
  }> = [
    { label: "In Progress", description: "Keep task active now", status: "open", tone: "bg-blue-500/15 text-blue-100 border-blue-400/20" },
    { label: "Scheduled", description: "Planned for its start time", status: "open", tone: "bg-violet-500/15 text-violet-100 border-violet-400/20" },
    { label: "Pending", description: "Waiting for next input", status: "open", tone: "bg-amber-500/15 text-amber-100 border-amber-400/20" },
    { label: "Completed", description: "Mark task as done", status: "done", tone: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20" },
    { label: "Cancelled", description: "Cancel this task", status: "cancelled", tone: "bg-slate-500/15 text-slate-100 border-slate-400/20" },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-1 text-xs font-black ${statusClass(label)}`}
      >
        {label}
        <span className="text-white/70">⌄</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-[9999] w-[320px] overflow-hidden rounded-2xl border border-[#315474] bg-[#071426] p-2 shadow-[0_22px_70px_rgba(0,0,0,.75)]">
          <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.14em] text-cyan-200">
            Smart Status Selector
          </div>
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.status, option.label)}
              className={`mb-1 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:bg-white/5 ${
                option.label === label ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-[#10223a]"
              }`}
            >
              <span className={`mt-0.5 h-3 w-3 rounded-full border ${option.tone}`} />
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">{option.label}</span>
                <span className="block text-xs font-semibold text-white/65">{option.description}</span>
              </span>
            </button>
          ))}
          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 text-[11px] font-bold text-white/60">
            Current: {task.title}
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  const toneClass = tone === "violet" ? "from-violet-600 to-purple-500" : tone === "emerald" ? "from-emerald-600 to-green-500" : tone === "blue" ? "from-blue-600 to-sky-500" : tone === "amber" ? "from-amber-500 to-orange-500" : "from-red-600 to-rose-500"
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} text-white [&_svg]:h-6 [&_svg]:w-6`}>{icon}</div>
        <div><div className="text-[11px] font-black uppercase tracking-[.1em] text-white/65">{label}</div><div className="text-3xl font-black text-white">{value}</div><div className="text-xs font-bold text-emerald-300">{detail}</div></div>
      </div>
    </div>
  )
}

function TaskDonut({ metrics }: { metrics: DailyCommandPayload["metrics"] }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5">
      <div className="mb-2 flex items-center justify-between"><h3 className="font-black text-white">Task Overview</h3><span className="text-xs font-black text-violet-300">View Report</span></div>
      <div className="flex items-center gap-5">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_40%,#0ea5e9_40%_73%,#f59e0b_73%_93%,#ef4444_93%_100%)]">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#10223a] text-center"><span className="text-2xl font-black text-white">{metrics.total_tasks}</span><span className="-mt-5 text-[10px] font-bold text-white/60">Total</span></div>
        </div>
        <div className="space-y-2 text-sm font-bold text-white/80">
          <div>🟢 Completed {metrics.completed_tasks}</div>
          <div>🔵 In Progress {metrics.in_progress_tasks}</div>
          <div>🟠 Pending {metrics.pending_tasks}</div>
          <div>🔴 Overdue {metrics.overdue_tasks}</div>
        </div>
      </div>
    </div>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#244365] bg-[#0e1e34] p-4 shadow-[0_20px_60px_rgba(0,0,0,.26)] ${className}`}>{children}</section>
}
function SidePanel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return <Panel><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-white">{title}</h3>{action && <span className="text-xs font-black text-violet-300">{action}</span>}</div>{children}</Panel>
}
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-xl px-4 py-3 text-sm font-black ${active ? "bg-violet-600 text-white" : "bg-[#07111f] text-white/70 hover:text-white"}`}>{children}</button>
}
function SelectMini({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border border-[#244365] bg-[#07111f] px-3 text-sm font-black text-white">{options.map((x) => <option key={x} value={x}>{x === "all" ? "All" : taskTypeLabel(x)}</option>)}</select>
}
function Badge({ value, tone }: { value: string; tone: string }) {
  const cls = tone === "type" ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20" : tone === "Completed" ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20" : tone === "Overdue" ? "bg-red-500/15 text-red-200 border-red-400/20" : statusClass(tone) || priorityClass(tone)
  return <span className={`inline-flex w-fit rounded-lg border px-3 py-1 text-xs font-black ${cls}`}>{value}</span>
}
function SmartActions({ tasks, prospects }: { tasks: DailyTask[]; prospects: DailyProspectOption[] }) {
  const overdue = tasks.filter((t) => t.status === "open" && t.due_date && t.due_date < todayISO()).length
  return <Panel><h3 className="mb-4 text-lg font-black text-white">Smart Actions</h3><div className="grid grid-cols-2 gap-3"><Smart label="Focus on overdue" detail={`${overdue} tasks need attention`} /><Smart label="Follow-up sequence" detail={`${prospects.length} prospects available`} /><Smart label="Schedule meetings" detail="Create appointment tasks" /><Smart label="Send proposals" detail={`${tasks.filter(t => t.task_type === "proposal").length} proposal tasks`} /></div></Panel>
}
function Smart({ label, detail }: { label: string; detail: string }) { return <div className="rounded-2xl bg-[#10223a] p-4"><div className="font-black text-white">{label}</div><div className="text-xs font-bold text-white/65">{detail}</div></div> }
function TeamWorkload({ workload }: { workload: DailyCommandPayload["workload"] }) {
  return <Panel><h3 className="mb-4 text-lg font-black text-white">Team Workload</h3><div className="space-y-3">{workload.map((w) => <div key={w.owner} className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-sky-400 text-xs font-black text-slate-950">{initials(w.owner)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-white">{w.owner}</div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, w.open_tasks * 12)}%` }} /></div></div><div className="text-sm font-black text-white">{w.open_tasks}/{w.total_tasks}</div></div>)}</div></Panel>
}
function Automations() {
  return <Panel><h3 className="mb-4 text-lg font-black text-white">Automations</h3>{["New Prospect Onboarding", "Follow Up Sequence", "Proposal Follow Up", "Contract Reminder"].map((x) => <div key={x} className="mb-3 flex items-center justify-between rounded-xl bg-[#10223a] p-3"><span className="text-sm font-black text-white">{x}</span><span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-black text-slate-950">Active</span></div>)}</Panel>
}
function Quick({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="grid min-h-[88px] place-items-center rounded-2xl bg-[#10223a] p-3 text-center text-xs font-black text-white hover:bg-violet-500/10 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:text-violet-300">{icon}<span>{label}</span></button>
}

type EnterpriseTaskPayload = {
  entityId: string
  title: string
  description: string
  owner: string
  assignedRole: string
  department: string
  taskType: string
  priority: "low" | "medium" | "high" | "critical"
  startAt: string
  endAt: string
  dueDate: string
  location: string
  outcomeExpected: string
  escalationRule: string
  dependencies: string
  tags: string[]
  visibility: string
  reminderMinutes: number
  addToCalendar: boolean
  sendNotifications: boolean
}

function TaskModal({
  prospects,
  editingTask,
  onClose,
  onSubmit,
}: {
  prospects: DailyProspectOption[]
  editingTask?: DailyTask | null
  onClose: () => void
  onSubmit: (payload: EnterpriseTaskPayload) => void
}) {
  const initialProspect = editingTask
    ? prospects.find((p) => p.id === editingTask.entity_id) || {
        id: editingTask.entity_id,
        name: editingTask.entity_name || "Linked prospect",
        city: editingTask.entity_city || resolveProspectSubLabel(editingTask, prospects),
        stage: editingTask.entity_stage || "unknown",
        priority: editingTask.entity_priority || "medium",
        value_mad: Number(editingTask.entity_value_mad || 0),
        score: Number(editingTask.entity_score || 0),
        contactName: editingTask.entity_contact || "N/A",
        owner: editingTask.owner || "BD Officer",
      }
    : prospects[0] || null

  const [selectedProspect, setSelectedProspect] = useState<DailyProspectOption | null>(initialProspect)
  const [query, setQuery] = useState("")
  const [prospectPage, setProspectPage] = useState(1)
  const [tagInput, setTagInput] = useState("")
  const [form, setForm] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    owner: editingTask?.owner || "BD Officer",
    assignedRole: editingTask?.assigned_role || "SDR / Revenue Operator",
    department: editingTask?.department || "Revenue",
    taskType: editingTask?.task_type || "prospect_follow_up",
    priority: (editingTask?.priority || "medium") as EnterpriseTaskPayload["priority"],
    startAt: editingTask?.start_at ? editingTask.start_at.slice(0, 16) : dateTimePlus(0, 9, 0),
    endAt: editingTask?.end_at ? editingTask.end_at.slice(0, 16) : dateTimePlus(0, 10, 0),
    dueDate: editingTask?.due_date || todayISO(),
    location: editingTask?.location || "AngelCare Command Center",
    outcomeExpected: editingTask?.outcome_expected || "",
    escalationRule: editingTask?.escalation_rule || "Escalate to Revenue Manager if not completed by due date.",
    dependencies: editingTask?.dependencies || "",
    tags: editingTask?.tags?.length ? editingTask.tags : ["revenue", "execution"],
    visibility: editingTask?.visibility || "team",
    reminderMinutes: editingTask?.reminder_minutes || 15,
    addToCalendar: editingTask?.add_to_calendar ?? true,
    sendNotifications: editingTask?.send_notifications ?? true,
  })

  const filtered = prospects.filter((p) =>
    [p.name, p.city, p.stage, p.priority, p.contactName, p.owner]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedProspects = filtered.slice((prospectPage - 1) * pageSize, prospectPage * pageSize)

  useEffect(() => {
    setProspectPage(1)
  }, [query])

  function update(key: keyof typeof form, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || form.tags.includes(tag)) return
    update("tags", [...form.tags, tag])
    setTagInput("")
  }

  function submit() {
    if (!selectedProspect || !form.title.trim()) return
    onSubmit({
      entityId: selectedProspect.id,
      title: form.title,
      description: form.description,
      owner: form.owner,
      assignedRole: form.assignedRole,
      department: form.department,
      taskType: form.taskType,
      priority: form.priority,
      startAt: form.startAt,
      endAt: form.endAt,
      dueDate: form.dueDate,
      location: form.location,
      outcomeExpected: form.outcomeExpected,
      escalationRule: form.escalationRule,
      dependencies: form.dependencies,
      tags: form.tags,
      visibility: form.visibility,
      reminderMinutes: form.reminderMinutes,
      addToCalendar: form.addToCalendar,
      sendNotifications: form.sendNotifications,
    })
  }

  return (
    <div className="rcc-shell-content w-full max-w-none min-w-0 fixed inset-0 z-[99999] overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <style dangerouslySetInnerHTML={{ __html: `
        /* restore daily tasks top alignment without damaging template */
        [data-daily-tasks-command] { align-self: stretch !important; justify-self: stretch !important; }
        [data-daily-tasks-command] > div.relative { margin-top: 0 !important; transform: none !important; }

        [data-final-task-modal] .task-type-card,
        [data-final-task-modal] .task-type-card * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
        [data-final-task-modal] .prospect-row,
        [data-final-task-modal] .prospect-row * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
      ` }} />
      <div data-final-task-modal="true" className="mx-auto w-full max-w-[1540px] rounded-[32px] border border-[#315474] bg-[#071426] p-7 shadow-[0_30px_90px_rgba(0,0,0,.72)]">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/20 text-violet-200">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">{editingTask ? "Edit enterprise task" : "Enterprise execution task"}</div>
              <h2 className="mt-1 text-3xl font-black text-white">{editingTask ? "Edit Task" : "Create New Task"}</h2>
              <p className="mt-1 text-sm font-bold text-white/75">{editingTask ? "Update the full task record and sync it across profile, daily tasks, analytics and timeline." : "Final production modal: live prospect link, 10 task types, timing, ownership, controls and sync."}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white">Cancel</button>
            <button disabled={!selectedProspect || !form.title.trim()} onClick={submit} className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{editingTask ? "Save Changes" : "Create Task"}</button>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <section className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 md:grid-cols-4">
          <Feature icon={<Link2 />} title="Linked to Prospect" detail="Task is saved against selected prospect ID" />
          <Feature icon={<RefreshCcw />} title="Real-time Sync" detail="Appears in tasks, timeline & analytics" />
          <Feature icon={<Bell />} title="Smart Escalation" detail="Automatic alerts & escalation rules" />
          <Feature icon={<Eye />} title="Full Visibility" detail="Track progress and outcomes" />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <ModalPanel title="1. Link to Prospect" icon={<Users />}>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved prospects..." className="h-12 w-full rounded-xl border border-[#315474] bg-[#070b19] pl-11 pr-4 font-bold text-white outline-none placeholder:text-white/40" />
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-100">{filtered.length} prospects</div>
            </div>

            {selectedProspect && (
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200">Selected Prospect</div>
                <div className="mt-1 text-lg font-black text-white">{selectedProspect.name}</div>
                <div className="mt-1 text-xs font-bold text-white/75">{selectedProspect.city} · {selectedProspect.contactName || selectedProspect.owner}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-100">{selectedProspect.priority}</span>
                  <span className="rounded-xl border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-100">{selectedProspect.stage}</span>
                  <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">Score {selectedProspect.score || 0}</span>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-[#244365] bg-[#07111f]/80">
              <div className="rcc-shell-content w-full max-w-none min-w-0 max-h-[390px] overflow-y-auto p-2">
                {pagedProspects.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedProspect(p)} className={`prospect-row mb-2 grid w-full grid-cols-[48px_1fr_auto] items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-cyan-300/50 hover:bg-white/5 ${selectedProspect?.id === p.id ? "border-cyan-400/60 bg-cyan-500/10" : "border-[#244365] bg-[#10223a]"}`}>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-500 text-sm font-black text-slate-950">{initials(p.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-black text-white">{p.name}</span>
                      <span className="block truncate text-xs font-semibold text-white/80">{p.city} · {p.contactName || p.owner}</span>
                    </span>
                    <span className={`rounded-xl px-4 py-2 text-xs font-black ${selectedProspect?.id === p.id ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white"}`}>
                      {selectedProspect?.id === p.id ? "Selected" : "Select"}
                    </span>
                  </button>
                ))}
                {!pagedProspects.length && <div className="p-8 text-center text-sm font-bold text-white/70">No saved prospects found.</div>}
              </div>
              <div className="flex items-center justify-between border-t border-[#244365] bg-[#10223a] px-4 py-3">
                <div className="text-xs font-bold text-white/70">Showing {pagedProspects.length ? (prospectPage - 1) * pageSize + 1 : 0}–{Math.min(prospectPage * pageSize, filtered.length)} of {filtered.length}</div>
                <div className="flex gap-2">
                  <button disabled={prospectPage <= 1} onClick={() => setProspectPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-2 text-xs font-black text-white disabled:opacity-40">Previous</button>
                  <span className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">Page {prospectPage}/{totalPages}</span>
                  <button disabled={prospectPage >= totalPages} onClick={() => setProspectPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-2 text-xs font-black text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          </ModalPanel>

          <ModalPanel title="2. Choose Task Type" icon={<Layers3 />}>
            <div className="grid gap-3 md:grid-cols-2">
              {FINAL_TASK_TYPE_OPTIONS.map((item) => {
                const Icon = item.icon
                const active = form.taskType === item.id
                return (
                  <button key={item.id} type="button" onClick={() => {
                    update("taskType", item.id)
                    if (!form.title.trim()) update("title", item.defaultTitle)
                    if (!form.outcomeExpected.trim()) update("outcomeExpected", item.defaultOutcome)
                  }} className={`task-type-card rounded-2xl border p-4 text-left transition ${active ? "border-emerald-400/70 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,.16)]" : "border-[#244365] bg-[#10223a] hover:border-cyan-300/50 hover:bg-white/5"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? "bg-emerald-400 text-slate-950" : "bg-blue-500/15 text-cyan-200"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black text-white">{item.label}</span>
                        <span className="mt-1 block text-sm font-semibold leading-6 text-white/90">{item.detail}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </ModalPanel>

          <ModalPanel title="3. Core Task Details" icon={<Target />}>
            <Input label="Task Title" value={form.title} onChange={(v) => update("title", v)} />
            <Textarea label="Description / Execution Brief" value={form.description} onChange={(v) => update("description", v)} />
            <Textarea label="Expected Outcome" value={form.outcomeExpected} onChange={(v) => update("outcomeExpected", v)} />
          </ModalPanel>

          <ModalPanel title="4. Schedule & Timing" icon={<CalendarDays />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="datetime-local" label="Start" value={form.startAt} onChange={(v) => update("startAt", v)} />
              <Input type="datetime-local" label="End" value={form.endAt} onChange={(v) => update("endAt", v)} />
              <Input type="date" label="Due Date" value={form.dueDate} onChange={(v) => update("dueDate", v)} />
              <Input label="Location" value={form.location} onChange={(v) => update("location", v)} />
            </div>
          </ModalPanel>

          <ModalPanel title="5. Ownership & Classification" icon={<Users />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select label="Owner" value={form.owner} onChange={(v) => update("owner", v)} options={["BD Officer", "Revenue Manager", "SDR", "Partnership Manager", "Direction Rabat", "Marketing Operator"]} />
              <Select label="Assigned Role" value={form.assignedRole} onChange={(v) => update("assignedRole", v)} options={["SDR / Revenue Operator", "Business Developer", "Revenue Manager", "Account Manager", "Marketing Operator", "Direction"]} />
              <Select label="Department" value={form.department} onChange={(v) => update("department", v)} options={["Revenue", "Sales", "Marketing", "Operations", "Academy", "Partnerships", "Direction"]} />
              <ReadOnlyField label="Task Type" value={finalTaskTypeMeta(form.taskType).label} />
              <Select label="Priority" value={form.priority} onChange={(v) => update("priority", v)} options={["low", "medium", "high", "critical"]} />
              <Select label="Visibility" value={form.visibility} onChange={(v) => update("visibility", v)} options={["team", "manager", "private", "direction"]} />
            </div>
          </ModalPanel>

          <ModalPanel title="6. Execution Controls" icon={<ShieldCheck />}>
            <Textarea label="Escalation Rule" value={form.escalationRule} onChange={(v) => update("escalationRule", v)} />
            <Textarea label="Dependencies / Blockers" value={form.dependencies} onChange={(v) => update("dependencies", v)} />
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Tags</span>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Type and press Enter..." className="h-12 flex-1 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none placeholder:text-white/40" />
                <button onClick={addTag} className="rounded-xl bg-white/10 px-4 font-black text-white">+</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => <button key={tag} onClick={() => update("tags", form.tags.filter((t) => t !== tag))} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">{tag} ×</button>)}
              </div>
            </label>
          </ModalPanel>
        </div>

        <section className="mt-5 rounded-2xl border border-amber-500/40 bg-[#07111f]/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.14em] text-amber-300"><BriefcaseBusiness className="h-4 w-4" />Task Preview</div>
          <div className="grid gap-4 md:grid-cols-5">
            <Preview label="Prospect" value={selectedProspect ? `${selectedProspect.name} · ${selectedProspect.city}` : "—"} />
            <Preview label="Title" value={form.title || "—"} />
            <Preview label="Owner" value={form.owner || "—"} />
            <Preview label="Priority" value={form.priority || "—"} />
            <Preview label="Task Type" value={finalTaskTypeMeta(form.taskType).label} />
          </div>
        </section>
      </div>
    </div>
  )
}



function EditTaskModal({ task, onClose, onSaved }: { task: DailyTask; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [priority, setPriority] = useState(task.priority)
  const [owner, setOwner] = useState(task.owner)
  const [dueDate, setDueDate] = useState(task.due_date || todayISO())
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const response = await fetch("/api/revenue-command-center/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ taskId: task.id, title, description, priority, owner, dueDate }),
    })
    const payload = await response.json()
    setSaving(false)
    if (!response.ok || !payload.ok) {
      alert(payload.error || "Unable to update task")
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-[28px] border border-[#315474] bg-[#071426] p-6 shadow-[0_30px_90px_rgba(0,0,0,.7)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-blue-300">Edit live task</div>
            <h2 className="text-2xl font-black text-white">Update Task</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3">
          <Input label="Title" value={title} onChange={setTitle} />
          <Textarea label="Description" value={description} onChange={setDescription} />
          <div className="grid gap-3 md:grid-cols-3">
            <Select label="Priority" value={priority} onChange={(value) => setPriority(value as DailyTask["priority"])} options={["low", "medium", "high", "critical"]} />
            <Input label="Owner" value={owner} onChange={setOwner} />
            <Input type="date" label="Due Date" value={dueDate} onChange={setDueDate} />
          </div>
          <button disabled={saving || !title.trim()} onClick={save} className="mt-2 rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 disabled:opacity-40">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span><span><span className="block text-sm font-black text-white">{title}</span><span className="block text-xs font-semibold text-white/70">{detail}</span></span></div>
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><div className="flex h-12 items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-black text-white">{value}</div></label>
}

function Preview({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-white/10 last:border-r-0"><div className="text-xs font-bold text-white/60">{label}</div><div className="mt-1 truncate text-sm font-black text-white">{value}</div></div>
}

function ModalPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5"><h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.12em] text-white"><span className="text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>{title}</h3><div className="rcc-shell-content w-full max-w-none min-w-0 grid gap-3">
      {children}</div></section>
}
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none" /></label>
}
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[110px] rounded-xl border border-[#315474] bg-[#070b19] p-3 text-sm font-bold text-white outline-none" /></label>
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none">{options.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
}