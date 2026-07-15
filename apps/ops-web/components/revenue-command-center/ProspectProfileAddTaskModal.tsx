"use client"

import { useState } from "react"
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  Handshake,
  Layers3,
  Link2,
  MessageCircle,
  PhoneCall,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react"
import { createProfileLinkedTask, type ProfileTaskPayload, type ProfileTaskProspect } from "@/lib/revenue-command-center/profile-task-modal-store"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function dateTimePlus(days: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "AC"
}

const PROFILE_TASK_TYPES = [
  { id: "prospect_follow_up", label: "Follow-up", icon: PhoneCall, detail: "Call, WhatsApp, email, and recovery follow-up", defaultTitle: "Follow up with prospect", defaultOutcome: "Next commercial step confirmed and logged." },
  { id: "qualification", label: "Qualification", icon: Target, detail: "Need, budget, decision-maker, urgency validation", defaultTitle: "Qualify prospect", defaultOutcome: "Qualification score and next step validated." },
  { id: "proposal", label: "Proposal", icon: FileText, detail: "Prepare, send, revise, and track offer proposal", defaultTitle: "Prepare proposal", defaultOutcome: "Proposal ready/sent with clear commercial value." },
  { id: "negotiation", label: "Negotiation", icon: Handshake, detail: "Resolve objections, terms, budget, and closing path", defaultTitle: "Advance negotiation", defaultOutcome: "Objections addressed and closing path defined." },
  { id: "contract", label: "Contract", icon: ShieldCheck, detail: "Contract preparation, validation, signature follow-up", defaultTitle: "Prepare contract control step", defaultOutcome: "Contract path secured and next legal/commercial step ready." },
  { id: "appointment_prep", label: "Meeting Prep", icon: CalendarDays, detail: "Brief, agenda, documents, and decision mapping", defaultTitle: "Prepare commercial meeting", defaultOutcome: "Meeting agenda and required materials ready." },
  { id: "market_activation", label: "Market Activation", icon: Sparkles, detail: "City/sector domination action and outreach sequence", defaultTitle: "Launch market activation action", defaultOutcome: "Target segment contacted and activation tracked." },
  { id: "internal_control", label: "Internal Control", icon: Layers3, detail: "Manager review, process control, quality assurance", defaultTitle: "Run internal execution control", defaultOutcome: "Control completed and gaps escalated if needed." },
  { id: "document", label: "Document", icon: Send, detail: "Proposal, contract, pricing, attachment, or proof document", defaultTitle: "Prepare or send required document", defaultOutcome: "Document created/sent and linked to prospect." },
  { id: "recovery", label: "Recovery", icon: TrendingUp, detail: "Rescue stalled or inactive prospect with dedicated motion", defaultTitle: "Run recovery motion", defaultOutcome: "Prospect reactivated or classified with clear next action." },
] as const

function taskTypeMeta(type: string) {
  return PROFILE_TASK_TYPES.find((x) => x.id === type) || PROFILE_TASK_TYPES[0]
}

export function ProspectProfileAddTaskModal({
  prospect,
  open,
  onClose,
  onCreated,
}: {
  prospect: ProfileTaskProspect
  open: boolean
  onClose: () => void
  onCreated?: (task: any) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    owner: prospect.owner || "BD Officer",
    assignedRole: "SDR / Revenue Operator",
    department: "Revenue",
    taskType: "prospect_follow_up",
    priority: (prospect.priority === "critical" ? "critical" : prospect.priority === "low" ? "low" : prospect.priority === "medium" ? "medium" : "high") as ProfileTaskPayload["priority"],
    startAt: dateTimePlus(0, 9, 0),
    endAt: dateTimePlus(0, 10, 0),
    dueDate: todayISO(),
    location: `${prospect.city || "AngelCare"} Command Zone`,
    outcomeExpected: "",
    escalationRule: "Escalate to Revenue Manager if not completed by due date.",
    dependencies: "",
    tags: ["revenue", "prospect-profile", "execution"],
    visibility: "team",
    reminderMinutes: 15,
    addToCalendar: true,
    sendNotifications: true,
  })

  if (!open) return null

  function update(key: keyof typeof form, value: any) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    if (!form.title.trim()) {
      setError("Task title is required.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const task = await createProfileLinkedTask({
        entityId: prospect.id,
        title: form.title,
        description: form.description,
        owner: form.owner,
        priority: form.priority,
        dueDate: form.dueDate,
        startAt: form.startAt,
        endAt: form.endAt,
        taskType: form.taskType,
        department: form.department,
        assignedRole: form.assignedRole,
        location: form.location,
        outcomeExpected: form.outcomeExpected,
        escalationRule: form.escalationRule,
        dependencies: form.dependencies,
        tags: form.tags,
        visibility: form.visibility,
        reminderMinutes: form.reminderMinutes,
        addToCalendar: form.addToCalendar,
        sendNotifications: form.sendNotifications,
        prospectSnapshot: prospect,
      })
      onCreated?.(task)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : typeof err === "string" ? err : "Unable to create task. Please check the Revenue task API response.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rcc-shell-content w-full max-w-none min-w-0 fixed inset-0 z-[99999] overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-profile-task-modal] .task-type-card,
        [data-profile-task-modal] .task-type-card * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
      ` }} />
      <div data-profile-task-modal="true" className="mx-auto w-full max-w-[1540px] rounded-[32px] border border-[#315474] bg-[#071426] p-7 shadow-[0_30px_90px_rgba(0,0,0,.72)]">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/20 text-violet-200">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Prospect profile task</div>
              <h2 className="mt-1 text-3xl font-black text-white">Create Task for {prospect.name}</h2>
              <p className="mt-1 text-sm font-bold text-white/75">This task is automatically linked to the current prospect and synced to Daily Tasks.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white">Cancel</button>
            <button disabled={saving || !form.title.trim()} onClick={submit} className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Creating..." : "Create Task"}</button>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-100">{error}</div>}

        <section className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 md:grid-cols-4">
          <Feature icon={<Link2 />} title="Auto-linked" detail="Saved against current prospect ID" />
          <Feature icon={<RefreshCcw />} title="Live Sync" detail="Appears in Daily Tasks instantly" />
          <Feature icon={<Bell />} title="Escalation" detail="Creates alerts based on due date" />
          <Feature icon={<Eye />} title="Timeline" detail="Action is logged permanently" />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="1. Current Prospect" icon={<Users />}>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-500 text-sm font-black text-slate-950">{initials(prospect.name)}</div>
                <div>
                  <div className="text-lg font-black text-white">{prospect.name}</div>
                  <div className="text-xs font-bold text-white/75">{prospect.city || "Unassigned"} · {prospect.contactName || "BD Contact"}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-100">{prospect.priority || "priority"}</span>
                <span className="rounded-xl border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-100">{prospect.stage || "stage"}</span>
                <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">Score {prospect.score || 0}</span>
              </div>
            </div>
          </Panel>

          <Panel title="2. Choose Task Type" icon={<Layers3 />}>
            <div className="grid gap-3 md:grid-cols-2">
              {PROFILE_TASK_TYPES.map((item) => {
                const Icon = item.icon
                const active = form.taskType === item.id
                return (
                  <button key={item.id} type="button" onClick={() => {
                    update("taskType", item.id)
                    if (!form.title.trim()) update("title", `${item.defaultTitle} — ${prospect.name}`)
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
          </Panel>

          <Panel title="3. Core Details" icon={<Target />}>
            <Input label="Task Title" value={form.title} onChange={(v) => update("title", v)} />
            <Textarea label="Description / Execution Brief" value={form.description} onChange={(v) => update("description", v)} />
            <Textarea label="Expected Outcome" value={form.outcomeExpected} onChange={(v) => update("outcomeExpected", v)} />
          </Panel>

          <Panel title="4. Schedule & Timing" icon={<CalendarDays />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="datetime-local" label="Start" value={form.startAt} onChange={(v) => update("startAt", v)} />
              <Input type="datetime-local" label="End" value={form.endAt} onChange={(v) => update("endAt", v)} />
              <Input type="date" label="Due Date" value={form.dueDate} onChange={(v) => update("dueDate", v)} />
              <Input label="Location" value={form.location} onChange={(v) => update("location", v)} />
            </div>
          </Panel>

          <Panel title="5. Ownership" icon={<Users />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select label="Owner" value={form.owner} onChange={(v) => update("owner", v)} options={["BD Officer", "Revenue Manager", "SDR", "Partnership Manager", "Direction Rabat", "Marketing Operator"]} />
              <Select label="Assigned Role" value={form.assignedRole} onChange={(v) => update("assignedRole", v)} options={["SDR / Revenue Operator", "Business Developer", "Revenue Manager", "Account Manager", "Marketing Operator", "Direction"]} />
              <Select label="Department" value={form.department} onChange={(v) => update("department", v)} options={["Revenue", "Sales", "Marketing", "Operations", "Academy", "Partnerships", "Direction"]} />
              <ReadOnly label="Task Type" value={taskTypeMeta(form.taskType).label} />
              <Select label="Priority" value={form.priority || "medium"} onChange={(v) => update("priority", v)} options={["low", "medium", "high", "critical"]} />
              <Select label="Visibility" value={form.visibility} onChange={(v) => update("visibility", v)} options={["team", "manager", "private", "direction"]} />
            </div>
          </Panel>

          <Panel title="6. Execution Controls" icon={<ShieldCheck />}>
            <Textarea label="Escalation Rule" value={form.escalationRule} onChange={(v) => update("escalationRule", v)} />
            <Textarea label="Dependencies / Blockers" value={form.dependencies} onChange={(v) => update("dependencies", v)} />
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">{tag}</span>)}
            </div>
          </Panel>
        </div>

        <section className="mt-5 rounded-2xl border border-amber-500/40 bg-[#07111f]/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.14em] text-amber-300"><BriefcaseBusiness className="h-4 w-4" />Task Preview</div>
          <div className="grid gap-4 md:grid-cols-5">
            <Preview label="Prospect" value={`${prospect.name} · ${prospect.city || "Unassigned"}`} />
            <Preview label="Title" value={form.title || "—"} />
            <Preview label="Owner" value={form.owner || "—"} />
            <Preview label="Priority" value={form.priority || "—"} />
            <Preview label="Task Type" value={taskTypeMeta(form.taskType).label} />
          </div>
        </section>
      </div>
    </div>
  )
}

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span><span><span className="block text-sm font-black text-white">{title}</span><span className="block text-xs font-semibold text-white/70">{detail}</span></span></div>
}
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none" /></label>
}
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[110px] rounded-xl border border-[#315474] bg-[#070b19] p-3 text-sm font-bold text-white outline-none" /></label>
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none">{options.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><div className="flex h-12 items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-black text-white">{value}</div></label>
}
function Preview({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-white/10 last:border-r-0"><div className="text-xs font-bold text-white/60">{label}</div><div className="mt-1 truncate text-sm font-black text-white">{value}</div></div>
}
