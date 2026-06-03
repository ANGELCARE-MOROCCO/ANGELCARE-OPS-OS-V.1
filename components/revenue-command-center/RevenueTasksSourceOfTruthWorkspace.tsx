"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Eye,
  FileText,
  Handshake,
  Layers3,
  Link2,
  MapPin,
  Megaphone,
  PhoneCall,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react"
import {
  createProductionTask,
  listProductionProspectOptions,
  listProductionTasks,
  subscribeProductionExecution,
  updateProductionTaskStatus,
  type ProductionProspectOption,
  type ProductionTask,
} from "@/lib/revenue-command-center/production-execution-store"

function dateTimePlus(days: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

function dateOnly(value: string) {
  return value ? value.slice(0, 10) : ""
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled"
  return new Date(value).toLocaleString()
}

function durationLabel(startAt: string, endAt: string) {
  if (!startAt || !endAt) return "--"
  const diff = new Date(endAt).getTime() - new Date(startAt).getTime()
  if (diff <= 0) return "Invalid range"
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function priorityTone(priority: string) {
  if (priority === "critical" || priority === "high") return "text-emerald-200 bg-emerald-500/15 border-emerald-400/20"
  if (priority === "medium") return "text-amber-200 bg-amber-500/15 border-amber-400/20"
  return "text-blue-200 bg-blue-500/15 border-blue-400/20"
}

function stageTone(stage: string) {
  if (stage.includes("negotiation")) return "text-pink-200 bg-pink-500/15 border-pink-400/20"
  if (stage.includes("proposal")) return "text-blue-200 bg-blue-500/15 border-blue-400/20"
  if (stage.includes("qualification")) return "text-violet-200 bg-violet-500/15 border-violet-400/20"
  return "text-slate-200 bg-white/10 border-white/10"
}

const PREINSTALLED_TASK_TYPES = [
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
    icon: Handshake,
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
    icon: Megaphone,
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

function taskTypeMeta(type: string) {
  return PREINSTALLED_TASK_TYPES.find((item) => item.id === type) || PREINSTALLED_TASK_TYPES[0]
}

export default function RevenueTasksSourceOfTruthWorkspace() {
  const [tasks, setTasks] = useState<ProductionTask[]>([])
  const [prospects, setProspects] = useState<ProductionProspectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      const [taskData, prospectData] = await Promise.all([listProductionTasks(), listProductionProspectOptions()])
      setTasks(taskData)
      setProspects(prospectData.prospects)
      setLastSync(new Date())
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sync production tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeProductionExecution(() => void refresh())
    return unsubscribe
  }, [])

  const metrics = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open")
    const done = tasks.filter((t) => t.status === "done")
    const today = open.filter((t) => dateOnly(t.start_at || t.due_date || "") === new Date().toISOString().slice(0, 10))
    const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < new Date(new Date().toISOString().slice(0, 10)))
    const scheduled = open.filter((t) => t.start_at || t.end_at)
    const critical = open.filter((t) => t.priority === "critical" || t.priority === "high")
    return { total: tasks.length, open: open.length, done: done.length, today: today.length, scheduled: scheduled.length, overdue: overdue.length, critical: critical.length }
  }, [tasks])

  async function createTask(payload: EnterpriseTaskPayload) {
    await createProductionTask({
      entityType: payload.entityType,
      entityId: payload.entityId,
      title: payload.title,
      description: payload.description,
      owner: payload.owner,
      priority: payload.priority,
      dueDate: payload.dueDate || undefined,
      startAt: payload.startAt || undefined,
      endAt: payload.endAt || undefined,
      taskType: payload.taskType,
      department: payload.department,
      assignedRole: payload.assignedRole,
      location: payload.location,
      outcomeExpected: payload.outcomeExpected,
      escalationRule: payload.escalationRule,
      dependencies: payload.dependencies,
      tags: payload.tags,
      visibility: payload.visibility,
      reminderMinutes: payload.reminderMinutes,
      addToCalendar: payload.addToCalendar,
      sendNotifications: payload.sendNotifications,
    })
    await refresh()
  }

  async function toggleTask(task: ProductionTask) {
    try {
      setError("")
      await updateProductionTaskStatus(task.id, task.status === "done" ? "open" : "done")
      await refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update task")
    }
  }

  return (
    <main data-revenue-tasks-workspace="true" className="min-h-screen bg-[#050b16] p-4 text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-revenue-tasks-workspace] .task-type-card,
        [data-revenue-tasks-workspace] .task-type-card * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
      ` }} />
      <style dangerouslySetInnerHTML={{ __html: `
        [data-revenue-tasks-workspace] .prospect-selector-table,
        [data-revenue-tasks-workspace] .prospect-selector-table * {
          color: #ffffff !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }
        [data-revenue-tasks-workspace] .prospect-selector-table .prospect-muted {
          color: rgba(255,255,255,.86) !important;
        }
        [data-revenue-tasks-workspace] .prospect-selector-table .prospect-chip {
          color: #ffffff !important;
          font-weight: 900 !important;
        }
        [data-revenue-tasks-workspace] .prospect-selector-table .prospect-action {
          color: #ffffff !important;
          background: rgba(15, 23, 42, .78) !important;
        }
      ` }} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(16,185,129,.15),transparent_30%),radial-gradient(circle_at_84%_0%,rgba(59,130,246,.15),transparent_28%),linear-gradient(180deg,#07111f_0%,#030814_70%,#020611_100%)]" />
      {modalOpen && (
        <EnterpriseTaskModal
          prospects={prospects}
          onClose={() => setModalOpen(false)}
          onSubmit={async (payload) => {
            await createTask(payload)
            setModalOpen(false)
          }}
        />
      )}
      <section className="relative w-full max-w-none min-w-0 ">
        <header className="mb-4 flex flex-col gap-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,.32)] xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Supabase source-of-truth · prospect linked</div>
            <h1 className="mt-1 text-3xl font-black">Daily Tasks Command Center</h1>
            <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Create tasks linked to live prospects with full scheduling, ownership, escalation and analytics visibility.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950"><Plus className="h-4 w-4" />Create New Task</button>
            <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />Refresh</button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Kpi icon={<DatabaseZap />} label="Source" value="revenue_tasks" detail={lastSync ? lastSync.toLocaleTimeString() : "syncing"} />
          <Kpi icon={<Users />} label="Live Prospects" value={String(prospects.length)} detail="available to link" />
          <Kpi icon={<CheckCircle2 />} label="Total" value={String(metrics.total)} detail="all tasks" />
          <Kpi icon={<Clock3 />} label="Open" value={String(metrics.open)} detail="needs execution" />
          <Kpi icon={<Timer />} label="Scheduled" value={String(metrics.scheduled)} detail="start/end time" />
          <Kpi icon={<CalendarDays />} label="Today" value={String(metrics.today)} detail="starts/due today" />
          <Kpi icon={<AlertTriangle />} label="Overdue" value={String(metrics.overdue)} detail="requires escalation" />
        </section>

        <section className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">
              Live task sync failed: {error}
            </div>
          ) : null}
          {loading ? (
            <div className="p-12 text-center text-sm font-bold text-[#cbd5e1]">Loading production tasks...</div>
          ) : tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="grid gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 xl:grid-cols-[42px_1.25fr_.75fr_.75fr_.55fr_.7fr_210px] xl:items-center">
                  <button onClick={() => void toggleTask(task)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <div className="text-base font-black text-white">{task.title}</div>
                    <div className="mt-1 text-xs font-semibold text-[#cbd5e1]">{task.description || "No description"} · linked to {task.entity_name || task.entity_id}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge value={task.task_type || "execution"} />
                      <Badge value={task.department || "Revenue"} />
                      {(task.tags || []).slice(0, 3).map((tag) => <Badge key={tag} value={tag} />)}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white"><Users className="mr-2 inline h-4 w-4 text-cyan-300" />{task.owner}<br /><span className="prospect-muted text-xs !text-white/80">{task.assigned_role || "No role"}</span></div>
                  <div className="text-sm font-bold text-white"><MapPin className="mr-2 inline h-4 w-4 text-emerald-300" />{task.location || "No location"}</div>
                  <div className="space-y-1"><Badge value={task.priority} /><Badge value={task.status} /></div>
                  <div className="text-xs font-semibold text-[#cbd5e1]">
                    <div><Timer className="mr-1 inline h-3 w-3 text-emerald-300" />{formatDateTime(task.start_at)}</div>
                    <div><Clock3 className="mr-1 inline h-3 w-3 text-amber-300" />{formatDateTime(task.end_at)}</div>
                  </div>
                  <div className="text-xs font-semibold text-[#cbd5e1]">
                    <div><CalendarDays className="mr-1 inline h-3 w-3 text-blue-300" />Due: {task.due_date || "No due date"}</div>
                    <div className="mt-1 truncate">Outcome: {task.outcome_expected || "Not defined"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-xl font-black text-white">No production tasks yet</div>
              <p className="mt-2 text-sm font-semibold text-[#cbd5e1]">Create a full task and link it to a live prospect.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

type EnterpriseTaskPayload = {
  entityType: "prospect" | "partnership"
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

function EnterpriseTaskModal({ prospects, onClose, onSubmit }: { prospects: ProductionProspectOption[]; onClose: () => void; onSubmit: (payload: EnterpriseTaskPayload) => Promise<void> | void }) {
  const first = prospects[0]
  const [search, setSearch] = useState("")
  const [pickerOpen, setPickerOpen] = useState(true)
  const [liveProspects, setLiveProspects] = useState<ProductionProspectOption[]>(prospects)
  const [prospectSyncStatus, setProspectSyncStatus] = useState<"loading" | "live" | "empty" | "error">(prospects.length ? "live" : "loading")
  const [prospectSyncError, setProspectSyncError] = useState("")
  const [selectedProspect, setSelectedProspect] = useState<ProductionProspectOption | null>(first || null)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    owner: "BD Officer",
    assignedRole: "SDR / Revenue Operator",
    department: "Revenue",
    taskType: "prospect_follow_up",
    priority: "medium" as EnterpriseTaskPayload["priority"],
    startAt: dateTimePlus(0, 9, 0),
    endAt: dateTimePlus(0, 10, 0),
    dueDate: dateTimePlus(0, 18, 0).slice(0, 10),
    location: "AngelCare Command Center",
    outcomeExpected: "",
    escalationRule: "Escalate to Revenue Manager if not completed by due date.",
    dependencies: "",
    tags: ["execution", "revenue", "prospect"],
    visibility: "team",
    reminderMinutes: 15,
    addToCalendar: true,
    sendNotifications: true,
  })

  useEffect(() => {
    let cancelled = false
    async function loadLiveProspects() {
      setProspectSyncStatus("loading")
      setProspectSyncError("")
      try {
        const result = await listProductionProspectOptions(search)
        if (cancelled) return
        setLiveProspects(result.prospects)
        setProspectSyncStatus(result.prospects.length ? "live" : "empty")
        if (!selectedProspect && result.prospects[0]) setSelectedProspect(result.prospects[0])
      } catch (error) {
        if (cancelled) return
        setProspectSyncStatus("error")
        setProspectSyncError(error instanceof Error ? error.message : "Unable to sync prospects")
      }
    }
    const timer = window.setTimeout(() => void loadLiveProspects(), 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search])

  const filteredProspects = liveProspects
  const [prospectPage, setProspectPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredProspects.length / pageSize))
  const pagedProspects = filteredProspects.slice((prospectPage - 1) * pageSize, prospectPage * pageSize)

  useEffect(() => {
    setProspectPage(1)
  }, [search, liveProspects.length])

  const duration = durationLabel(form.startAt, form.endAt)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || form.tags.includes(tag)) return
    update("tags", [...form.tags, tag])
    setTagInput("")
  }

  async function submit() {
    if (!selectedProspect || !form.title.trim() || saving) return
    setSaving(true)
    setSubmitError("")
    try {
      await onSubmit({
      entityType: selectedProspect.entityType,
      entityId: selectedProspect.id,
      title: form.title.trim(),
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
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rcc-shell-content w-full max-w-none min-w-0 fixed inset-0 z-[99999] overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1540px] rounded-[30px] border border-[#315474] bg-[#071426] p-7 shadow-[0_30px_90px_rgba(0,0,0,.70)]">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-300"><BriefcaseBusiness className="h-6 w-6" /></div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Enterprise execution task</div>
              <h2 className="mt-1 text-3xl font-black text-white">Create New Task</h2>
              <p className="mt-1 text-sm font-bold text-[#cbd5e1]">Create a comprehensive execution task and link it to a live prospect or partner. All tasks are automatically synced and tracked.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={saving} onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">Cancel</button>
            <button disabled={!selectedProspect || !form.title.trim() || saving} onClick={() => void submit()} className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : "Create Task"}</button>
            <button disabled={saving} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10 disabled:opacity-60"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {submitError ? (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">
            {submitError}
          </div>
        ) : null}

        <section className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 md:grid-cols-4">
          <Feature icon={<Link2 />} title="Linked Entity" detail="Task will be linked to the selected prospect or partner" />
          <Feature icon={<RefreshCcw />} title="Real-time Sync" detail="Appears in tasks, timeline & analytics" />
          <Feature icon={<Bell />} title="Smart Escalation" detail="Automatic alerts & escalation rules" />
          <Feature icon={<Eye />} title="Full Visibility" detail="Track progress and outcomes" />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel icon={<Users />} title="1. Link to Prospect or Partner">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200">Live source</div>
                <div className="mt-1 text-lg font-black text-white">{filteredProspects.length} saved entities</div>
                <div className="mt-1 text-xs font-bold text-[#cbd5e1]">Synced from prospects and partnerships</div>
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">Selected</div>
                <div className="mt-1 max-w-[240px] truncate text-lg font-black text-white">{selectedProspect?.name || "None"}</div>
                <div className="mt-1 text-xs font-bold text-[#cbd5e1]">{selectedProspect ? `${selectedProspect.entityType} · ${selectedProspect.city} · ${selectedProspect.stage}` : "Choose one entity below"}</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setProspectSyncStatus("loading")
                  try {
                    const result = await listProductionProspectOptions("")
                    setLiveProspects(result.prospects)
                    setProspectSyncStatus(result.prospects.length ? "live" : "empty")
                    setPickerOpen(true)
                  } catch (error) {
                    setProspectSyncStatus("error")
                    setProspectSyncError(error instanceof Error ? error.message : "Unable to refresh")
                  }
                }}
                className="rounded-2xl border border-[#315474] bg-[#10223a] px-5 py-4 text-sm font-black text-white hover:bg-[#172942]"
              >
                Refresh List
              </button>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Find prospect or partner</span>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200" />
                <input
                  value={search}
                  onFocus={() => setPickerOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPickerOpen(true)
                  }}
                  placeholder="Search by prospect, partner, city, stage, priority, contact, phone, email..."
                  className="h-12 w-full rounded-xl border border-[#315474] bg-[#070b19] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            {prospectSyncStatus === "error" && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs font-bold text-red-100">
                Could not load saved prospects or partners. Please check Supabase connection and revenue operational tables.
              </div>
            )}

            <div className="prospect-selector-table overflow-hidden rounded-3xl border border-[#244365] bg-[#07111f]/80">
              <div className="grid grid-cols-[1.3fr_.75fr_.55fr_.55fr_120px] gap-3 border-b border-[#244365] bg-[#10223a] px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8] max-lg:hidden">
                <span>Prospect</span>
                <span>City / owner</span>
                <span>Stage</span>
                <span>Priority</span>
                <span className="text-right">Action</span>
              </div>

              <div className="rcc-shell-content w-full max-w-none min-w-0 max-h-[500px] overflow-y-auto p-2">
                {pagedProspects.map((prospect) => (
                  <button
                    key={prospect.id}
                    type="button"
                    onClick={() => {
                      setSelectedProspect(prospect)
                      setPickerOpen(false)
                    }}
                    className={`mb-2 grid w-full gap-3 rounded-2xl border p-4 text-left transition hover:border-cyan-300/50 hover:bg-white/5 lg:grid-cols-[1.3fr_.75fr_.55fr_.55fr_120px] lg:items-center ${selectedProspect?.id === prospect.id ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,.12)]" : "border-[#244365] bg-[#10223a]"}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-500 text-sm font-black text-slate-950">{prospect.name.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-black !text-white">{prospect.name}</span>
                        <span className="prospect-muted block truncate text-sm font-semibold !text-white/90">{prospect.company || `AngelCare ${prospect.entityType}`}</span>
                      </span>
                    </span>
                    <span className="text-sm font-bold !text-white">
                      {prospect.city}<br />
                      <span className="prospect-muted text-xs !text-white/80">{prospect.contactName || prospect.owner || "BD Owner"}</span>
                    </span>
                    <span><span className={`prospect-chip inline-flex rounded-xl border px-3 py-1 text-xs font-black ${stageTone(prospect.stage)}`}>{prospect.stage}</span></span>
                    <span><span className={`prospect-chip inline-flex rounded-xl border px-3 py-1 text-xs font-black ${priorityTone(prospect.priority)}`}>{prospect.priority}</span></span>
                    <span className="text-right">
                      <span className={`prospect-action inline-flex rounded-xl px-4 py-2 text-xs font-black ${selectedProspect?.id === prospect.id ? "bg-emerald-500 !text-slate-950" : "bg-white/10 !text-white"}`}>
                        {selectedProspect?.id === prospect.id ? "Selected" : "Select"}
                      </span>
                    </span>
                  </button>
                ))}
                {!pagedProspects.length && (
                  <div className="space-y-2 p-8 text-center text-sm font-bold text-[#cbd5e1]">
                    <div>No saved prospects or partners found.</div>
                    <div className="prospect-muted text-xs !text-white/80">Create records in Prospects Directory or Partner Program, then return here and refresh.</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#244365] bg-[#10223a] px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="text-xs font-bold text-[#cbd5e1]">
                  Showing {pagedProspects.length ? (prospectPage - 1) * pageSize + 1 : 0}–{Math.min(prospectPage * pageSize, filteredProspects.length)} of {filteredProspects.length}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={prospectPage <= 1} onClick={() => setProspectPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-2 text-xs font-black text-white disabled:opacity-40">Previous</button>
                  <span className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">Page {prospectPage} / {totalPages}</span>
                  <button type="button" disabled={prospectPage >= totalPages} onClick={() => setProspectPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-2 text-xs font-black text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          </Panel>

          <Panel icon={<CalendarDays />} title="2. Schedule & Timing">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Start Date" required value={form.startAt.slice(0, 10)} onChange={(v) => update("startAt", `${v}T${form.startAt.slice(11, 16) || "09:00"}`)} type="date" />
              <Input label="Start Time" required value={form.startAt.slice(11, 16)} onChange={(v) => update("startAt", `${form.startAt.slice(0, 10)}T${v}`)} type="time" />
              <Input label="End Date" required value={form.endAt.slice(0, 10)} onChange={(v) => update("endAt", `${v}T${form.endAt.slice(11, 16) || "10:00"}`)} type="date" />
              <Input label="End Time" required value={form.endAt.slice(11, 16)} onChange={(v) => update("endAt", `${form.endAt.slice(0, 10)}T${v}`)} type="time" />
              <Input label="Due Date" required value={form.dueDate} onChange={(v) => update("dueDate", v)} type="date" />
              <Input label="Duration" value={duration} onChange={() => {}} disabled />
            </div>
            <Info>Tasks will be considered overdue after the due date and escalated based on rules.</Info>
          </Panel>

          <Panel icon={<Layers3 />} title="2. Choose Task Type">
            <div className="grid gap-3 md:grid-cols-2">
              {PREINSTALLED_TASK_TYPES.map((item) => {
                const Icon = item.icon
                const active = form.taskType === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      update("taskType", item.id)
                      if (!form.title.trim()) update("title", item.defaultTitle)
                      if (!form.outcomeExpected.trim()) update("outcomeExpected", item.defaultOutcome)
                    }}
                    className={`task-type-card group rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-400/70 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,.16)]"
                        : "border-[#244365] bg-[#10223a] hover:border-cyan-300/50 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                        active ? "bg-emerald-400 text-slate-950" : "bg-blue-500/15 text-cyan-200"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black !text-white">{item.label}</span>
                        <span className="mt-1 block text-sm font-semibold leading-6 !text-white/95">{item.detail}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            <Info>
              Selected type: <span className="font-black text-white">{taskTypeMeta(form.taskType).label}</span>. Choosing a type pre-fills title/outcome only when those fields are empty.
            </Info>
          </Panel>

          <Panel icon={<Target />} title="3. Core Task Details">
            <Input label="Task Title" required value={form.title} onChange={(v) => update("title", v)} placeholder="Enter a clear and actionable task title..." max={150} />
            <Textarea label="Description / Execution Brief" required value={form.description} onChange={(v) => update("description", v)} placeholder="Provide detailed description of what needs to be done, how, and expected result..." max={1000} />
            <Textarea label="Expected Outcome" value={form.outcomeExpected} onChange={(v) => update("outcomeExpected", v)} placeholder="What is the expected result or outcome of this task?" max={500} />
          </Panel>

          <Panel icon={<Users />} title="4. Ownership & Classification">
            <div className="grid gap-3 md:grid-cols-2">
              <Select label="Owner" required value={form.owner} onChange={(v) => update("owner", v)} options={["BD Officer", "Revenue Manager", "SDR", "Partnership Manager", "Direction Rabat", "Marketing Operator"]} />
              <Select label="Assigned Role" required value={form.assignedRole} onChange={(v) => update("assignedRole", v)} options={["SDR / Revenue Operator", "Business Developer", "Revenue Manager", "Account Manager", "Marketing Operator", "Direction"]} />
              <Select label="Department" required value={form.department} onChange={(v) => update("department", v)} options={["Revenue", "Sales", "Marketing", "Operations", "Academy", "Partnerships", "Direction"]} />
              <ReadOnlyField label="Task Type" value={taskTypeMeta(form.taskType).label} />
              <Select label="Priority" required value={form.priority} onChange={(v) => update("priority", v as EnterpriseTaskPayload["priority"])} options={["low", "medium", "high", "critical"]} />
              <Input label="Location" value={form.location} onChange={(v) => update("location", v)} />
            </div>
          </Panel>

          <Panel icon={<ShieldCheck />} title="6. Additional Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <Select label="Visibility" value={form.visibility} onChange={(v) => update("visibility", v)} options={["team", "manager", "private", "direction"]} />
              <Select label="Reminder" value={String(form.reminderMinutes)} onChange={(v) => update("reminderMinutes", Number(v))} options={["0", "15", "30", "60", "1440"]} />
            </div>
            <Toggle label="Add to Calendar" detail="Automatically add this task to calendar" value={form.addToCalendar} onChange={(v) => update("addToCalendar", v)} />
            <Toggle label="Send Notifications" detail="Notify assignee and followers" value={form.sendNotifications} onChange={(v) => update("sendNotifications", v)} />
          </Panel>

          <Panel icon={<AlertTriangle />} title="5. Execution Controls">
            <Select label="Escalation Rule" value={form.escalationRule} onChange={(v) => update("escalationRule", v)} options={["Escalate to Revenue Manager if not completed by due date.", "Escalate to Direction Rabat after 24h delay.", "Notify owner only.", "Critical escalation same day."]} />
            <Textarea label="Dependencies / Blockers" value={form.dependencies} onChange={(v) => update("dependencies", v)} placeholder="List any dependencies or blockers..." max={500} />
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Tags</span>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Type and press Enter to add tags..." className="h-12 flex-1 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none placeholder:text-slate-400" />
                <button onClick={addTag} className="rounded-xl bg-white/10 px-4 font-black text-white">+</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => <button key={tag} onClick={() => update("tags", form.tags.filter((t) => t !== tag))} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">{tag} ×</button>)}
              </div>
            </label>
          </Panel>
        </div>

        <section className="mt-5 rounded-2xl border border-amber-500/40 bg-[#07111f]/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.14em] text-amber-300"><BriefcaseBusiness className="h-4 w-4" />Task Preview</div>
          <div className="grid gap-4 md:grid-cols-5">
            <Preview label="Prospect" value={selectedProspect ? `${selectedProspect.name} · ${selectedProspect.city}` : "—"} />
            <Preview label="Title" value={form.title || "—"} />
            <Preview label="Owner" value={form.owner || "—"} />
            <Preview label="Priority" value={form.priority || "—"} />
            <Preview label="Task Type" value={taskTypeMeta(form.taskType).label} />
          </div>
        </section>
        <p className="mt-3 text-xs font-semibold text-[#94a3b8]">After creation, this task will be visible in Daily Tasks, Activity Timeline, Analytics, and linked to the selected prospect.</p>
      </div>
    </div>
  )
}

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span><span><span className="block text-sm font-black text-white">{title}</span><span className="block text-xs font-semibold text-[#94a3b8]">{detail}</span></span></div>
}
function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5"><h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.12em] text-white"><span className="text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>{title}</h3><div className="rcc-shell-content w-full max-w-none min-w-0 grid gap-3">
      
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

      {children}</div></section>
}
function Info({ children }: { children: React.ReactNode }) {
  return <div className="rcc-shell-content w-full max-w-none min-w-0 mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
      {children}</div>
}
function Kpi({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-4"><div className="mb-3 text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div><div className="mt-1 text-2xl font-black text-white">{value}</div><div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}
function Badge({ value }: { value: string }) {
  return <span className="inline-flex w-fit rounded-xl bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white">{value}</span>
}
function Input({ label, value, onChange, type = "text", placeholder, max, required, disabled }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; max?: number; required?: boolean; disabled?: boolean }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label} {required && <span className="text-red-400">*</span>}</span><input disabled={disabled} type={type} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none placeholder:text-slate-400 disabled:opacity-70" />{max && <span className="text-right text-xs text-[#94a3b8]">{value.length}/{max}</span>}</label>
}
function Textarea({ label, value, onChange, placeholder, max, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; max?: number; required?: boolean }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label} {required && <span className="text-red-400">*</span>}</span><textarea value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-[105px] rounded-xl border border-[#315474] bg-[#070b19] p-3 text-sm font-bold text-white outline-none placeholder:text-slate-400" />{max && <span className="text-right text-xs text-[#94a3b8]">{value.length}/{max}</span>}</label>
}
function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label} {required && <span className="text-red-400">*</span>}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span>
      <div className="flex h-12 items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-black text-white">
        {value}
      </div>
    </label>
  )
}
function Toggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <button onClick={() => onChange(!value)} className="flex items-center justify-between rounded-2xl border border-[#244365] bg-[#07111f]/60 p-4 text-left"><span><span className="block text-sm font-black text-white">{label}</span><span className="block text-xs font-semibold text-[#94a3b8]">{detail}</span></span><span className={`relative h-7 w-12 rounded-full transition ${value ? "bg-emerald-500" : "bg-white/10"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`} /></span></button>
}
function Preview({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-white/10 last:border-r-0"><div className="text-xs font-bold text-[#94a3b8]">{label}</div><div className="mt-1 truncate text-sm font-black text-white">{value}</div></div>
}
