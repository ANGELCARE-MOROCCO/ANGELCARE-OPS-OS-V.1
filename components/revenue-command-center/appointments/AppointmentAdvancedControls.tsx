"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  FileText,
  Link2,
  MapPin,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Target,
  Trash2,
  UploadCloud,
  Users,
  Video,
  WandSparkles,
  Building2,
  Flame,
  Gauge,
  Mail,
  Phone,
  Star,
  UserRoundCheck,
  X,
} from "lucide-react"
import type { AppointmentProspect, AppointmentRecord } from "@/lib/revenue-command-center/appointments-command-store"
import { APPOINTMENT_TYPES, addMinutes, dateLabel, initials, nowLocalInput, timeLabel, typeLabel } from "./appointment-command-utils"
import { Panel, Tab } from "./appointment-command-widgets"

function cleanJson(value: string) {
  try {
    const parsed = JSON.parse(value || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toDateInput(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10)
  return new Date(value).toISOString().slice(0, 10)
}

function toTimeInput(value?: string | null) {
  if (!value) return "10:00"
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
}

function combineDateTime(date: string, time: string) {
  return `${date}T${time || "10:00"}:00`
}

function priorityColor(priority: string) {
  if (priority === "critical") return "from-red-500 to-orange-500"
  if (priority === "high") return "from-rose-500 to-fuchsia-500"
  if (priority === "medium") return "from-amber-400 to-orange-500"
  return "from-emerald-400 to-cyan-500"
}

function stageColor(stage: string) {
  if (stage.includes("won") || stage.includes("contract")) return "bg-emerald-500/20 text-emerald-100 border-emerald-300/30"
  if (stage.includes("negotiation") || stage.includes("proposal")) return "bg-violet-500/20 text-violet-100 border-violet-300/30"
  if (stage.includes("qualification")) return "bg-blue-500/20 text-blue-100 border-blue-300/30"
  return "bg-slate-500/20 text-white border-white/20"
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-200"
  if (score >= 60) return "text-amber-200"
  return "text-blue-200"
}

export function AppointmentDetails({
  appointment,
  onEdit,
  onAction,
}: {
  appointment: AppointmentRecord | null
  onEdit: (a: AppointmentRecord) => void
  onAction: (a: AppointmentRecord, action: "confirm" | "complete" | "cancel" | "delete") => void
}) {
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "tasks" | "documents" | "reminders">("details")

  if (!appointment) return null

  const currentAppointment = appointment

  const linkedTasks = Array.isArray(currentAppointment.tasks) ? currentAppointment.tasks : []
  const linkedDocs = Array.isArray(currentAppointment.documents) ? currentAppointment.documents : []
  const reminders = Array.isArray(currentAppointment.reminders) ? currentAppointment.reminders : []
  const attendees = Array.isArray(currentAppointment.attendees) ? currentAppointment.attendees : []

  async function copyMeetingLink() {
    const link = currentAppointment.meeting_link || ""
    if (!link) {
      setMessage("No meeting link saved for this appointment.")
      return
    }
    await navigator.clipboard?.writeText(link)
    setMessage("Meeting link copied.")
  }

  function duplicateAppointment() {
    const duplicate: AppointmentRecord = {
      ...currentAppointment,
      id: "",
      entity_type: currentAppointment.entity_type || "prospect",
      entity_id: currentAppointment.entity_id || "",
      title: `${currentAppointment.title} Copy`,
      status: "scheduled",
      appointment_at: currentAppointment.appointment_at,
      end_at: currentAppointment.end_at,
      owner: currentAppointment.owner || "BD Officer",
      appointment_type: currentAppointment.appointment_type || "meeting",
      priority: currentAppointment.priority || "medium",
      attendees: Array.isArray(currentAppointment.attendees) ? currentAppointment.attendees : [],
      reminders: Array.isArray(currentAppointment.reminders) ? currentAppointment.reminders : [],
      documents: Array.isArray(currentAppointment.documents) ? currentAppointment.documents : [],
      tasks: Array.isArray(currentAppointment.tasks) ? currentAppointment.tasks : [],
      created_at: currentAppointment.created_at || new Date().toISOString(),
      updated_at: currentAppointment.updated_at || new Date().toISOString(),
    }
    onEdit(duplicate)
    setMessage("Duplicate ready. Review and save from the modal.")
  }

  return (
    <section className="rcc-panel mt-6 rounded-3xl border border-[#244365] bg-gradient-to-br from-[#0e1e34] to-[#07111f] p-5 shadow-[0_24px_70px_rgba(0,0,0,.38)]">
      <div className="mb-4 flex flex-wrap gap-3 border-b border-[#244365] pb-4">
        <button onClick={() => setActiveTab("details")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black ${activeTab === "details" ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:bg-white/5"}`}><Eye className="h-5 w-5" />Appointment Details</button>
        <button onClick={() => setActiveTab("comments")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black ${activeTab === "comments" ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:bg-white/5"}`}><MessageCircle className="h-5 w-5" />Comments</button>
        <button onClick={() => setActiveTab("tasks")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black ${activeTab === "tasks" ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:bg-white/5"}`}><CheckCircle2 className="h-5 w-5" />Tasks ({linkedTasks.length || currentAppointment.linked_task_count || 0})</button>
        <button onClick={() => setActiveTab("documents")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black ${activeTab === "documents" ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:bg-white/5"}`}><FileText className="h-5 w-5" />Documents ({linkedDocs.length})</button>
        <button onClick={() => setActiveTab("reminders")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-black ${activeTab === "reminders" ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:bg-white/5"}`}><Bell className="h-5 w-5" />Reminders & Alerts ({reminders.length})</button>
      </div>

      {message && <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm font-black text-emerald-100">{message}</div>}

      {activeTab === "details" && (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_.85fr_.72fr]">
          <Panel title={currentAppointment.title}>
            <div className="grid gap-3 text-sm font-bold text-white">
              <DetailLine icon={<CalendarDays />} label="Schedule" value={`${dateLabel(currentAppointment.appointment_at)} · ${timeLabel(currentAppointment.appointment_at)} - ${timeLabel(currentAppointment.end_at)}`} />
              <DetailLine icon={<MapPin />} label="Location" value={currentAppointment.location || currentAppointment.entity_city || "No location"} />
              <DetailLine icon={<Video />} label="Meeting Link" value={currentAppointment.meeting_link || "No meeting link"} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#07111f] p-4 text-sm font-bold text-white">
              {currentAppointment.notes || currentAppointment.agenda || "No notes yet."}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniMetric label="Objective" value={currentAppointment.objective || "—"} />
              <MiniMetric label="Outcome" value={currentAppointment.expected_outcome || "—"} />
              <MiniMetric label="Priority" value={currentAppointment.priority || "medium"} />
            </div>
          </Panel>

          <Panel title="Attendees">
            <div className="space-y-3">
              <Attendee name={currentAppointment.owner || "BD Officer"} role="Organizer" />
              <Attendee name={currentAppointment.entity_contact || currentAppointment.entity_name || "Prospect"} role="Invitee" />
              {attendees.slice(0, 6).map((a: any, idx: number) => <Attendee key={idx} name={String(a.name || a.email || "Attendee")} role={String(a.role || "Attendee")} />)}
            </div>
          </Panel>

          <Panel title="Actions">
            <div className="grid gap-3">
              <ActionButton icon={<Edit3 />} label="Edit Appointment" onClick={() => onEdit(currentAppointment)} />
              <ActionButton icon={<CheckCircle2 />} label="Mark Completed" onClick={() => onAction(currentAppointment, "complete")} />
              <ActionButton icon={<Copy />} label="Duplicate" onClick={duplicateAppointment} />
              <ActionButton danger icon={<Trash2 />} label="Cancel Appointment" onClick={() => onAction(currentAppointment, "cancel")} />
              <ActionButton icon={<Share2 />} label="Share Meeting Link" onClick={copyMeetingLink} />
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "comments" && (
        <Panel title="Comments">
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#07111f] p-6 text-sm font-bold text-white/80">
            Comments should connect to your permanent event/comment log next. Current appointment notes: {currentAppointment.notes || "No note saved."}
          </div>
        </Panel>
      )}

      {activeTab === "tasks" && (
        <Panel title="Linked Tasks">
          <div className="grid gap-3">
            {linkedTasks.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 bg-[#07111f] p-6 text-sm font-bold text-white/80">No task JSON linked to this appointment yet. Linked revenue_tasks count: {currentAppointment.linked_task_count || 0}</div>}
            {linkedTasks.map((task: any, index: number) => (
              <div key={index} className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                <div className="text-sm font-black text-white">{String(task.title || "Linked task")}</div>
                <div className="mt-1 text-xs font-bold text-white/70">{String(task.owner || currentAppointment.owner || "BD Officer")} · {String(task.dueDate || "No due date")}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "documents" && (
        <Panel title="Documents">
          <div className="grid gap-3">
            {linkedDocs.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 bg-[#07111f] p-6 text-sm font-bold text-white/80">No documents saved in this appointment yet.</div>}
            {linkedDocs.map((doc: any, index: number) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#07111f] p-4">
                <div>
                  <div className="text-sm font-black text-white">{String(doc.name || doc.title || "Document")}</div>
                  <div className="text-xs font-bold text-white/65">{String(doc.type || "metadata")} · {String(doc.url || "No file URL")}</div>
                </div>
                {doc.url && <a href={String(doc.url)} target="_blank" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white">Open</a>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "reminders" && (
        <Panel title="Reminders & Alerts">
          <div className="grid gap-3">
            {reminders.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 bg-[#07111f] p-6 text-sm font-bold text-white/80">No reminders saved yet.</div>}
            {reminders.map((reminder: any, index: number) => (
              <div key={index} className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                <div className="text-sm font-black text-white">{String(reminder.reminder || reminder.type || "Reminder")}</div>
                <div className="mt-1 text-xs font-bold text-white/70">Email: {String(Boolean(reminder.sendEmailInvitation))} · WhatsApp: {String(Boolean(reminder.sendWhatsAppReminder))}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </section>
  )
}

function DetailLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[26px_110px_1fr] items-center gap-2 rounded-xl bg-[#07111f]/70 p-3">
      <span className="text-cyan-200 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="text-xs font-black uppercase tracking-[.12em] text-white/60">{label}</span>
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/60">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-white">{typeLabel(value)}</div>
    </div>
  )
}


function Attendee({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#10223a] p-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-cyan-400 text-xs font-black text-slate-950">{initials(name)}</span>
      <span><span className="block text-sm font-black text-white">{name}</span><span className="text-xs font-bold text-white">{role}</span></span>
    </div>
  )
}

function ActionButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-xl p-3 text-sm font-black ${danger ? "bg-red-500/15 text-red-200" : "bg-[#10223a] text-white hover:bg-white/5"}`}>{icon}{label}</button>
}

export function AppointmentModal({
  prospects,
  appointment,
  onClose,
  onSave,
}: {
  prospects: AppointmentProspect[]
  appointment: AppointmentRecord | null
  onClose: () => void
  onSave: (input: Record<string, any>) => Promise<void> | void
}) {
  const initialProspect = appointment ? prospects.find((p) => p.id === appointment.entity_id) || prospects[0] || null : prospects[0] || null
  const [selectedProspect, setSelectedProspect] = useState<AppointmentProspect | null>(initialProspect)
  const [prospectQuery, setProspectQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [prospectTypeFilter, setProspectTypeFilter] = useState("all")
  const [allDay, setAllDay] = useState(false)
  const [googleCalendar, setGoogleCalendar] = useState(true)
  const [outlookCalendar, setOutlookCalendar] = useState(false)
  const [followUpTask, setFollowUpTask] = useState(true)
  const [allowReschedule, setAllowReschedule] = useState(true)
  const [allowCancellation, setAllowCancellation] = useState(true)
  const [sendEmailInvitation, setSendEmailInvitation] = useState(true)
  const [sendWhatsAppReminder, setSendWhatsAppReminder] = useState(false)
  const [requireConfirmation, setRequireConfirmation] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const initialDate = toDateInput(appointment?.appointment_at)
  const initialStart = toTimeInput(appointment?.appointment_at)
  const initialEnd = toTimeInput(appointment?.end_at || addMinutes(appointment?.appointment_at || nowLocalInput(1), 60))

  const [form, setForm] = useState({
    id: appointment?.id || "",
    title: appointment?.title || "",
    appointmentDate: initialDate,
    startTime: initialStart,
    endTime: initialEnd,
    owner: appointment?.owner || "BD Officer",
    status: appointment?.status || "scheduled",
    appointmentType: appointment?.appointment_type || "meeting",
    purpose: appointment?.objective || "partnership_discussion",
    priority: appointment?.priority || "high",
    visibility: "team_members",
    location: appointment?.location || "Google Meet",
    meetingLink: appointment?.meeting_link || `https://meet.google.com/angelcare-${Date.now().toString(36)}`,
    notes: appointment?.notes || "",
    agenda: appointment?.agenda || "",
    outcomeGoal: appointment?.expected_outcome || "explore_partnership_opportunities",
    dealStage: appointment?.entity_stage || "negotiation",
    potentialValue: appointment?.entity_value_mad ? String(appointment.entity_value_mad) : "1200000",
    probability: "75",
    source: "referral",
    campaign: "q2_partnership_drive",
    reminder: "15_minutes_before",
    followUpDate: addMinutes(nowLocalInput(24), 0).slice(0, 10),
    followUpOwner: appointment?.owner || "BD Officer",
    internalNotes: appointment?.notes || "Focus on implementation timeline, pricing, training, support, decision-maker mapping and next commercial action.",
    tags: "High Potential, Strategic Account",
    attendeesText: JSON.stringify(appointment?.attendees || [], null, 2),
    remindersText: JSON.stringify(appointment?.reminders || [{ type: "popup", minutes: 15 }], null, 2),
    documentsText: JSON.stringify(appointment?.documents || [], null, 2),
    tasksText: JSON.stringify(appointment?.tasks || [], null, 2),
  })

  const cityOptions = useMemo(() => {
    return Array.from(new Set(prospects.map((p) => p.city).filter(Boolean))).sort()
  }, [prospects])

  const prospectTypeOptions = useMemo(() => {
    return Array.from(new Set(prospects.map((p) => p.stage).filter(Boolean))).sort()
  }, [prospects])

  const filteredProspects = useMemo(() => {
    const q = prospectQuery.toLowerCase()
    return prospects
      .filter((p) => cityFilter === "all" || p.city === cityFilter)
      .filter((p) => prospectTypeFilter === "all" || p.stage === prospectTypeFilter)
      .filter((p) => [p.name, p.city, p.stage, p.priority, p.contactName, p.owner].join(" ").toLowerCase().includes(q))
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 50)
  }, [prospectQuery, cityFilter, prospectTypeFilter, prospects])

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(draft = false) {
    if (!selectedProspect || !form.title.trim() || saving) return

    const appointmentAt = combineDateTime(form.appointmentDate, form.startTime)
    const endAt = combineDateTime(form.appointmentDate, form.endTime)

    setSaving(true)
    setSubmitError("")
    try {
      await onSave({
      id: form.id || undefined,
      entityType: selectedProspect.entityType,
      entityId: selectedProspect.id,
      prospectId: selectedProspect.entityType === "prospect" ? selectedProspect.id : undefined,
      partnershipId: selectedProspect.entityType === "partnership" ? selectedProspect.id : undefined,
      title: form.title,
      appointmentAt,
      endAt,
      owner: form.owner,
      status: draft ? "pending" : form.status,
      appointmentType: form.appointmentType,
      priority: form.priority,
      location: form.location,
      meetingLink: form.meetingLink,
      notes: form.notes || form.internalNotes,
      agenda: form.agenda,
      objective: form.purpose,
      expectedOutcome: form.outcomeGoal,
      attendees: cleanJson(form.attendeesText),
      reminders: [
        ...cleanJson(form.remindersText),
        { reminder: form.reminder, requireConfirmation, sendEmailInvitation, sendWhatsAppReminder, googleCalendar, outlookCalendar },
      ],
      documents: cleanJson(form.documentsText),
      tasks: [
        ...cleanJson(form.tasksText),
        ...(followUpTask ? [{ title: `Follow up after ${form.title}`, dueDate: form.followUpDate, owner: form.followUpOwner }] : []),
      ],
    })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save appointment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rcc-shell-content w-full max-w-none min-w-0 fixed inset-x-0 bottom-0 top-[72px] z-[2147483000] overflow-y-auto bg-black/82 p-3 backdrop-blur-md">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-appointment-modal],
        [data-appointment-modal] * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
        [data-appointment-modal] input,
        [data-appointment-modal] textarea,
        [data-appointment-modal] select,
        [data-appointment-modal] option {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background: #07101d !important;
        }
        [data-appointment-modal] input::placeholder,
        [data-appointment-modal] textarea::placeholder {
          color: rgba(255,255,255,.58) !important;
          -webkit-text-fill-color: rgba(255,255,255,.58) !important;
        }
      ` }} />

      <div data-appointment-modal="true" className="mx-auto w-full max-w-[1820px] overflow-hidden rounded-[18px] border border-[#3b5574] bg-gradient-to-br from-[#102033] via-[#0b1a2c] to-[#07111f] shadow-[0_40px_120px_rgba(0,0,0,.82)]">
        <header className="flex items-start justify-between border-b border-white/10 px-8 py-7">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">{appointment?.id ? "Edit Appointment" : "Schedule New Appointment"}</h2>
            <p className="mt-1 text-base font-bold text-white/80">Create and schedule a new meeting, call or engagement linked to a live prospect or partner</p>
          </div>
          <button disabled={saving} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10 disabled:opacity-60">
            <X className="h-6 w-6" />
          </button>
        </header>

        {submitError ? (
          <div className="mx-7 mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">
            {submitError}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 border-b border-white/10 px-7 py-4 md:grid-cols-4">
          <IntelligenceCard icon={<WandSparkles />} label="AI Scheduling Fit" value="High Match" detail="Prospect, owner and timing aligned" tone="violet" />
          <IntelligenceCard icon={<Flame />} label="Commercial Priority" value={form.priority.toUpperCase()} detail="Driven by selected prospect score" tone="rose" />
          <IntelligenceCard icon={<Star />} label="Live Entity Sync" value={selectedProspect ? "Connected" : "Select Entity"} detail={`${prospects.length} saved prospects/partners available`} tone="cyan" />
          <IntelligenceCard icon={<Target />} label="Next Action" value={followUpTask ? "Follow-up Task" : "No Follow-up"} detail="Saved into appointment tasks JSON" tone="emerald" />
        </section>

        <section className="grid gap-2 p-7 xl:grid-cols-[1.28fr_1.08fr_.95fr_.68fr]">
          <ModalSection title="1. Appointment Details">
            <Field label="Title" required>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Meeting with Little Genius Preschool" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" required><Select value={form.appointmentType} onChange={(v) => update("appointmentType", v)} options={APPOINTMENT_TYPES} /></Field>
              <Field label="Purpose" required><Select value={form.purpose} onChange={(v) => update("purpose", v)} options={["partnership_discussion", "sales_discovery", "demo", "contract_review", "budget_validation", "training_scope", "site_audit"]} /></Field>
            </div>

            <Field label="Description / Agenda">
              <textarea value={form.agenda} onChange={(e) => update("agenda", e.target.value)} placeholder="Initial meeting to discuss partnership and AngelCare OS implementation..." className="min-h-[128px]" maxLength={500} />
              <span className="absolute bottom-3 right-3 text-xs font-bold text-white/50">{form.agenda.length}/500</span>
            </Field>

            <Field label="Meeting Outcome Goal"><Select value={form.outcomeGoal} onChange={(v) => update("outcomeGoal", v)} options={["explore_partnership_opportunities", "confirm_budget", "send_proposal", "validate_decision_maker", "schedule_demo", "close_next_step"]} /></Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority"><Select value={form.priority} onChange={(v) => update("priority", v)} options={["low", "medium", "high", "critical"]} /></Field>
              <Field label="Visibility"><Select value={form.visibility} onChange={(v) => update("visibility", v)} options={["team_members", "management", "private", "revenue_department"]} /></Field>
            </div>
          </ModalSection>

          <ModalSection title="2. Smart Live Entity Selector">
            <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-r from-cyan-500/12 via-blue-500/10 to-violet-500/12 p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${priorityColor(selectedProspect?.priority || "medium")} text-lg font-black text-white shadow-lg`}>
                  {selectedProspect ? initials(selectedProspect.name) : <Building2 className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black uppercase tracking-[.15em] text-cyan-100">Live selected entity</div>
                  <div className="truncate text-xl font-black text-white">{selectedProspect?.name || "Select a saved prospect or partner"}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-black text-white">{selectedProspect?.city || "No city"}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${stageColor(selectedProspect?.stage || "")}`}>{selectedProspect?.stage || "stage"}</span>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-100">{selectedProspect?.priority || "priority"}</span>
                    <span className={`rounded-full border border-amber-300/25 bg-amber-500/15 px-2.5 py-1 text-[11px] font-black ${scoreTone(Number(selectedProspect?.score || 0))}`}>Score {selectedProspect?.score || 0}</span>
                  </div>
                </div>
                <div className="hidden rounded-2xl border border-white/10 bg-[#07111f]/80 p-3 text-right md:block">
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/60">Value MAD</div>
                  <div className="text-lg font-black text-emerald-200">{Number(selectedProspect?.value_mad || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <Field label="Search Saved Prospects" required>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-cyan-200" />
                <input value={prospectQuery} onChange={(e) => setProspectQuery(e.target.value)} placeholder="Search by company, partner, city, stage, score, contact, owner..." className="pl-11" />
              </div>
            </Field>

            <div className="grid gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[.14em] text-white/80">Live synced filters</span>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-black text-cyan-100">{filteredProspects.length} shown / {prospects.length} live entities</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[.12em] text-cyan-100">City</span>
                  <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="h-11 rounded-xl border border-cyan-300/20 bg-[#07111f] px-3 text-sm font-black text-white outline-none">
                    <option value="all">All Cities</option>
                    {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[.12em] text-cyan-100">Type / Stage</span>
                  <select value={prospectTypeFilter} onChange={(e) => setProspectTypeFilter(e.target.value)} className="h-11 rounded-xl border border-cyan-300/20 bg-[#07111f] px-3 text-sm font-black text-white outline-none">
                    <option value="all">All Types / Stages</option>
                    {prospectTypeOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => { setCityFilter("all"); setProspectTypeFilter("all"); setProspectQuery("") }} className="rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-xs font-black text-white hover:bg-white/5">Reset filters</button>
                <div className="rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-xs font-black text-white">Cities: {cityOptions.length}</div>
                <div className="rounded-xl border border-white/10 bg-[#07111f] px-3 py-2 text-xs font-black text-white">Types: {prospectTypeOptions.length}</div>
              </div>
            </div>

            <div className="rcc-shell-content w-full max-w-none min-w-0 max-h-[255px] overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#07111f]/70 p-2 shadow-inner">
              {filteredProspects.map((p) => (
                <button key={p.id} onClick={() => setSelectedProspect(p)} className={`mb-2 grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-cyan-300/50 hover:bg-cyan-500/10 ${selectedProspect?.id === p.id ? "border-cyan-300 bg-cyan-500/18 shadow-[0_0_25px_rgba(34,211,238,.14)]" : "border-white/10 bg-[#0b1829]"}`}>
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${priorityColor(p.priority)} text-base font-black text-white shadow-lg`}>{initials(p.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">{p.name}</span>
                    <span className="block truncate text-xs font-bold text-white/75">{p.entityType} · {p.city} · {p.contactName} · {p.owner}</span>
                    <span className="mt-1 flex gap-1">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${stageColor(p.stage)}`}>{p.stage}</span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-black text-white">{p.priority}</span>
                    </span>
                  </span>
                  <span className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-100">Score {p.score}</span>
                </button>
              ))}
              {!filteredProspects.length && (
                <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm font-bold text-white/65">No saved prospects or partners match this search or selected city/type filters.</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoChip icon={<UserRoundCheck />} label="Primary Contact" value={selectedProspect?.contactName || "N/A"} />
              <InfoChip icon={<Mail />} label="Email" value={selectedProspect?.email || "N/A"} />
              <InfoChip icon={<Phone />} label="Phone" value={selectedProspect?.phone || "N/A"} />
              <InfoChip icon={<Gauge />} label="Owner" value={selectedProspect?.owner || "BD Officer"} />
            </div>

            <button type="button" onClick={() => update("attendeesText", JSON.stringify([...cleanJson(form.attendeesText), { name: selectedProspect?.contactName || "External Contact", role: "External Guest", email: selectedProspect?.email || "" }], null, 2))} className="rounded-xl border border-dashed border-violet-400/40 bg-violet-500/10 py-3 text-sm font-black text-violet-100 hover:bg-violet-500/15">
              + Add selected contact to attendees
            </button>
          </ModalSection>

          <div className="grid gap-2">
            <ModalSection title="3. Date & Time">
              <Field label="Date" required><input type="date" value={form.appointmentDate} onChange={(e) => update("appointmentDate", e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Time" required><input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} /></Field>
                <Field label="End Time" required><input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} /></Field>
              </div>
              <Switch label="All Day" checked={allDay} onChange={setAllDay} />
              <Field label="Time Zone"><Select value="gmt_1_casablanca" onChange={() => undefined} options={["gmt_1_casablanca", "gmt_0_utc", "europe_paris"]} /></Field>
            </ModalSection>

            <ModalSection title="4. Location / Meeting Link">
              <Field label="Meeting Location" required><Select value={form.location} onChange={(v) => update("location", v)} options={["Google Meet", "Office", "Client Site", "Phone Call", "Zoom", "Microsoft Teams"]} /></Field>
              <Field label="Meeting Link" required>
                <div className="relative">
                  <input value={form.meetingLink} onChange={(e) => update("meetingLink", e.target.value)} className="pr-11" />
                  <button type="button" onClick={() => navigator.clipboard?.writeText(form.meetingLink)} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300"><Copy className="h-5 w-5" /></button>
                </div>
              </Field>
              <Switch label="Add to Google Calendar" checked={googleCalendar} onChange={setGoogleCalendar} />
              <Switch label="Add to Outlook Calendar" checked={outlookCalendar} onChange={setOutlookCalendar} />
            </ModalSection>
          </div>

          <div className="grid gap-2">
            <ModalSection title="5. Custom Fields">
              <Field label="Deal Stage"><Select value={form.dealStage} onChange={(v) => update("dealStage", v)} options={["new_lead", "qualification", "negotiation", "proposal", "contract", "won"]} /></Field>
              <Field label="Potential Value (MAD)"><input value={form.potentialValue} onChange={(e) => update("potentialValue", e.target.value)} /></Field>
              <Field label="Probability (%)"><input value={form.probability} onChange={(e) => update("probability", e.target.value)} /></Field>
              <Field label="Source"><Select value={form.source} onChange={(v) => update("source", v)} options={["referral", "outbound", "partner", "web", "event", "city_activation"]} /></Field>
              <Field label="Campaign"><Select value={form.campaign} onChange={(v) => update("campaign", v)} options={["q2_partnership_drive", "kenitra_activation", "casablanca_growth", "academy_b2b", "flashcards_winwin"]} /></Field>
            </ModalSection>

            <ModalSection title="6. Reminders & Follow Ups">
              <Field label="Reminder"><Select value={form.reminder} onChange={(v) => update("reminder", v)} options={["15_minutes_before", "30_minutes_before", "1_hour_before", "1_day_before"]} /></Field>
              <Switch label="Follow Up Task" checked={followUpTask} onChange={setFollowUpTask} />
              <Field label="Follow Up Date"><input type="date" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} /></Field>
              <Field label="Assign Follow Up To"><input value={form.followUpOwner} onChange={(e) => update("followUpOwner", e.target.value)} /></Field>
            </ModalSection>
          </div>

          <ModalSection title="7. Attachments & Documents">
            <div className="grid min-h-[118px] place-items-center rounded-xl border border-dashed border-white/20 bg-[#07111f]/60 p-5 text-center">
              <UploadCloud className="mb-2 h-8 w-8 text-white/50" />
              <div className="text-sm font-bold text-white">Drag & drop files here or click to upload</div>
              <div className="text-xs font-semibold text-white/55">Supports PDF, DOCX, PPT, XLS, JPG, PNG</div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#07111f] p-3">
              <div className="flex items-center gap-3"><FileText className="h-6 w-6 text-red-300" /><span><span className="block text-sm font-black text-white">Partnership_Proposal_AngelCare.pdf</span><span className="text-xs font-bold text-white/60">metadata saved in appointment documents JSON</span></span></div>
              <button onClick={() => update("documentsText", "[]")}><X className="h-4 w-4" /></button>
            </div>
          </ModalSection>

          <ModalSection title="8. Notes (Internal)">
            <Field label="Internal Notes">
              <textarea value={form.internalNotes} onChange={(e) => update("internalNotes", e.target.value)} className="min-h-[95px]" maxLength={500} />
              <span className="absolute bottom-3 right-3 text-xs font-bold text-white/50">{form.internalNotes.length}/500</span>
            </Field>
            <Field label="Add Note Tags"><input value={form.tags} onChange={(e) => update("tags", e.target.value)} /></Field>
          </ModalSection>

          <ModalSection title="9. Appointment Settings">
            <Switch icon={<ShieldCheck />} label="Allow Reschedule" checked={allowReschedule} onChange={setAllowReschedule} />
            <Switch icon={<ShieldCheck />} label="Allow Cancellation" checked={allowCancellation} onChange={setAllowCancellation} />
            <Switch icon={<ShieldCheck />} label="Send Email Invitation" checked={sendEmailInvitation} onChange={setSendEmailInvitation} />
            <Switch icon={<ShieldCheck />} label="Send WhatsApp Reminder" checked={sendWhatsAppReminder} onChange={setSendWhatsAppReminder} />
            <Switch icon={<ShieldCheck />} label="Require Confirmation" checked={requireConfirmation} onChange={setRequireConfirmation} />
          </ModalSection>
        </section>

        <footer className="flex items-center justify-between border-t border-white/10 px-8 py-5">
          <button disabled={saving} onClick={onClose} className="rounded-xl border border-white/10 bg-[#07111f] px-10 py-4 text-sm font-black text-white disabled:opacity-60">Cancel</button>
          <div className="flex gap-4">
            <button disabled={saving} onClick={() => void submit(true)} className="rounded-xl border border-violet-400/35 bg-[#07111f] px-10 py-4 text-sm font-black text-violet-200 disabled:opacity-60">Save as Draft</button>
            <button disabled={!selectedProspect || !form.title.trim() || saving} onClick={() => void submit(false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 px-10 py-4 text-sm font-black text-white shadow-[0_12px_40px_rgba(124,58,237,.35)] disabled:opacity-40">
              <CalendarDays className="h-5 w-5" /> {saving ? "Saving..." : appointment?.id ? "Save Appointment" : "Schedule Appointment"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}


function IntelligenceCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "violet" | "rose" | "cyan" | "emerald" }) {
  const colors = {
    violet: "from-violet-500/20 to-purple-500/10 border-violet-300/25 text-violet-100",
    rose: "from-rose-500/20 to-orange-500/10 border-rose-300/25 text-rose-100",
    cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-300/25 text-cyan-100",
    emerald: "from-emerald-500/20 to-green-500/10 border-emerald-300/25 text-emerald-100",
  }[tone]
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[.14em] text-white/65">{label}</span>
          <span className="block truncate text-base font-black text-white">{value}</span>
          <span className="block truncate text-xs font-bold text-white/70">{detail}</span>
        </span>
      </div>
    </div>
  )
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#0d2135]/95 to-[#081526]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.05)]">
      <h3 className="mb-5 border-b border-white/10 pb-3 text-sm font-black uppercase tracking-[.1em] text-white">{title}</h3>
      <div className="rcc-shell-content w-full max-w-none min-w-0 grid gap-4">
      
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
    </section>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="relative grid gap-2">
      <span className="text-sm font-black text-white/90">{label}{required && <span className="text-red-400"> *</span>}</span>
      <div className="rcc-shell-content w-full max-w-none min-w-0 [&_input]:h-12 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/10 [&_input]:bg-[#07111f] [&_input]:px-4 [&_input]:text-sm [&_input]:font-bold [&_input]:text-white [&_input]:outline-none [&_select]:h-12 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/10 [&_select]:bg-[#07111f] [&_select]:px-4 [&_select]:text-sm [&_select]:font-bold [&_select]:text-white [&_select]:outline-none [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/10 [&_textarea]:bg-[#07111f] [&_textarea]:p-4 [&_textarea]:text-sm [&_textarea]:font-bold [&_textarea]:text-white [&_textarea]:outline-none">
      {children}
      </div>
    </label>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((x) => <option key={x} value={x}>{typeLabel(x)}</option>)}</select>
}


function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#07111f]/75 p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-cyan-100">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>{label}
      </div>
      <div className="mt-1 truncate text-xs font-black text-white">{value}</div>
    </div>
  )
}

function Switch({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (value: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between rounded-lg py-1.5 text-left">
      <span className="flex items-center gap-2 text-sm font-bold text-white">{icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>}{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-500"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  )
}
