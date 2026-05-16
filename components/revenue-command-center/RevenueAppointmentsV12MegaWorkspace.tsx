"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type AppointmentStatus =
  | "lead_qualified"
  | "requested"
  | "scheduled"
  | "confirmation_pending"
  | "confirmed"
  | "prepared"
  | "live"
  | "completed"
  | "converted"
  | "follow_up"
  | "no_show"
  | "rescheduled"
  | "recovery"
  | "lost"
  | "cancelled"

type AppointmentPriority = "critical" | "high" | "medium" | "low"
type AppointmentMode = "in_home" | "office" | "video" | "phone" | "partner_site" | "hospital"
type AppointmentType =
  | "family_consultation"
  | "care_assessment"
  | "elderly_care"
  | "postpartum"
  | "childcare"
  | "partner_meeting"
  | "academy_consultation"
  | "sales_call"

type AppointmentPageMode =
  | "dashboard"
  | "control-tower"
  | "live"
  | "schedule"
  | "calendar"
  | "queue"
  | "recovery"
  | "no-shows"
  | "reschedules"
  | "analytics"
  | "performance"
  | "conversion"
  | "risk"
  | "executive"
  | "escalations"
  | "high-value"

type AppointmentRecord = {
  id: string
  title: string
  familyOrCompany: string
  contactName: string
  phone: string
  city: string
  address: string
  source: string
  type: AppointmentType
  mode: AppointmentMode
  owner: string
  closer: string
  fieldCoordinator: string
  specialist: string
  status: AppointmentStatus
  priority: AppointmentPriority
  date: string
  time: string
  durationMin: number
  valueMad: number
  probability: number
  noShowRisk: number
  readinessScore: number
  decisionMakerPresent: boolean
  decisionMaker: string
  confirmationChannel: string
  confirmationMessage: string
  reminderPlan: string
  meetingObjective: string
  familyBriefing: string
  painPoints: string
  predictedObjections: string
  recommendedOffer: string
  prepChecklist: string[]
  liveNotes: string
  outcome: string
  nextStep: string
  noShowReason: string
  recoveryPlan: string
  escalationReason: string
  documents: string[]
  createdAt: string
  updatedAt: string
}

type AppointmentLog = {
  id: string
  appointmentId: string
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

type AppointmentStore = {
  appointments: AppointmentRecord[]
  logs: AppointmentLog[]
  automations: AutomationRule[]
}

const STORE_KEY = "revenue_appointments_v12_mega_store"

const statuses: AppointmentStatus[] = [
  "lead_qualified",
  "requested",
  "scheduled",
  "confirmation_pending",
  "confirmed",
  "prepared",
  "live",
  "completed",
  "converted",
  "follow_up",
  "no_show",
  "rescheduled",
  "recovery",
  "lost",
  "cancelled",
]

const priorities: AppointmentPriority[] = ["critical", "high", "medium", "low"]
const modes: AppointmentMode[] = ["in_home", "office", "video", "phone", "partner_site", "hospital"]
const types: AppointmentType[] = [
  "family_consultation",
  "care_assessment",
  "elderly_care",
  "postpartum",
  "childcare",
  "partner_meeting",
  "academy_consultation",
  "sales_call",
]

const subpages: Array<{ mode: AppointmentPageMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Dashboard", href: "/revenue-command-center/appointments", desc: "Master appointment command dashboard." },
  { mode: "control-tower", label: "Control Tower", href: "/revenue-command-center/appointments/control-tower", desc: "Risk, SLA, VIP and executive intervention." },
  { mode: "live", label: "Live Desk", href: "/revenue-command-center/appointments/live", desc: "Live meeting execution and action capture." },
  { mode: "schedule", label: "Schedule", href: "/revenue-command-center/appointments/schedule", desc: "Create and schedule appointments." },
  { mode: "calendar", label: "Calendar", href: "/revenue-command-center/appointments/calendar", desc: "Calendar and daily appointment rhythm." },
  { mode: "queue", label: "Queue", href: "/revenue-command-center/appointments/queue", desc: "Operational queue by stage and owner." },
  { mode: "recovery", label: "Recovery", href: "/revenue-command-center/appointments/recovery", desc: "Lost/no-show recovery workflows." },
  { mode: "no-shows", label: "No-shows", href: "/revenue-command-center/appointments/no-shows", desc: "No-show detection and rescue." },
  { mode: "reschedules", label: "Reschedules", href: "/revenue-command-center/appointments/reschedules", desc: "Reschedule control and confirmation." },
  { mode: "analytics", label: "Analytics", href: "/revenue-command-center/appointments/analytics", desc: "Appointment metrics and conversion health." },
  { mode: "performance", label: "Performance", href: "/revenue-command-center/appointments/performance", desc: "Closer and team performance." },
  { mode: "conversion", label: "Conversion", href: "/revenue-command-center/appointments/conversion", desc: "Conversion control and deal outcomes." },
  { mode: "risk", label: "Risk", href: "/revenue-command-center/appointments/risk", desc: "Risk intelligence and predictive alerts." },
  { mode: "executive", label: "Executive", href: "/revenue-command-center/appointments/executive", desc: "Leadership view and decisions." },
  { mode: "escalations", label: "Escalations", href: "/revenue-command-center/appointments/escalations", desc: "Executive escalation queue." },
  { mode: "high-value", label: "High Value", href: "/revenue-command-center/appointments/high-value", desc: "High MAD opportunity control." },
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

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value || 0)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function seedAppointments(): AppointmentRecord[] {
  const now = new Date().toISOString()

  return [
    {
      id: "apt-v12-vip-postpartum",
      title: "VIP postpartum care conversion consultation",
      familyOrCompany: "Family A — postpartum support",
      contactName: "Spouse decision maker",
      phone: "+212600000201",
      city: "Rabat",
      address: "Rabat Agdal",
      source: "Postpartum campaign",
      type: "postpartum",
      mode: "in_home",
      owner: "SDR Lead",
      closer: "Revenue Manager",
      fieldCoordinator: "Ops Coordinator",
      specialist: "Postpartum specialist",
      status: "confirmed",
      priority: "critical",
      date: today(0),
      time: "17:30",
      durationMin: 45,
      valueMad: 42000,
      probability: 82,
      noShowRisk: 18,
      readinessScore: 86,
      decisionMakerPresent: true,
      decisionMaker: "Spouse + grandmother",
      confirmationChannel: "WhatsApp + voice",
      confirmationMessage: "Confirmed by WhatsApp. Reminder required 2 hours before.",
      reminderPlan: "T-24h WhatsApp, T-2h voice, T-30min WhatsApp.",
      meetingObjective: "Confirm urgent postpartum needs, start date, package, decision path and caregiver readiness.",
      familyBriefing: "Mother and baby need immediate supervised support. Family values trust and reliability.",
      painPoints: "Urgency, emotional reassurance, caregiver trust, quality control.",
      predictedObjections: "Price comparison, trust proof, availability, start date certainty.",
      recommendedOffer: "Postpartum supervised support package with quality check-in and flexible schedule.",
      prepChecklist: ["Confirm decision maker", "Prepare trust proof", "Prepare package options", "Confirm caregiver availability"],
      liveNotes: "",
      outcome: "",
      nextStep: "Prepare consultation sheet and confirm attendance.",
      noShowReason: "",
      recoveryPlan: "",
      escalationReason: "High-value VIP appointment today.",
      documents: ["Consultation summary", "Pricing proposal", "Care plan"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "apt-v12-clinic-partner",
      title: "Clinic partnership referral meeting",
      familyOrCompany: "Clinique Maternité Rabat Premium",
      contactName: "Medical Director",
      phone: "+212600000202",
      city: "Rabat",
      address: "Partner site",
      source: "Partnership outreach",
      type: "partner_meeting",
      mode: "partner_site",
      owner: "BD Officer",
      closer: "CEO / Revenue Manager",
      fieldCoordinator: "Partnership Coordinator",
      specialist: "Business Development",
      status: "scheduled",
      priority: "high",
      date: today(2),
      time: "10:00",
      durationMin: 60,
      valueMad: 320000,
      probability: 69,
      noShowRisk: 25,
      readinessScore: 64,
      decisionMakerPresent: false,
      decisionMaker: "Medical Director + Operations Director",
      confirmationChannel: "Email + phone",
      confirmationMessage: "Calendar invite sent. Awaiting final decision-maker confirmation.",
      reminderPlan: "T-24h email, T-4h phone confirmation.",
      meetingObjective: "Present referral economics, care quality process and partnership pilot.",
      familyBriefing: "Institutional meeting. Focus on referral flow, trust, supervision and economics.",
      painPoints: "Referral credibility, patient trust, process clarity, activation responsibility.",
      predictedObjections: "Legal agreement, referral economics, patient experience, training.",
      recommendedOffer: "Referral pilot with co-branded activation and monthly review.",
      prepChecklist: ["Prepare partner one-pager", "Confirm attendees", "Prepare referral workflow", "Define activation pilot"],
      liveNotes: "",
      outcome: "",
      nextStep: "Confirm attendees and send agenda.",
      noShowReason: "",
      recoveryPlan: "",
      escalationReason: "",
      documents: ["Partnership proposal", "Referral flow", "Activation checklist"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "apt-v12-no-show-elderly",
      title: "No-show recovery — elderly care assessment",
      familyOrCompany: "Website elderly care lead",
      contactName: "Family contact",
      phone: "+212600000203",
      city: "Temara",
      address: "Temara center",
      source: "Website form",
      type: "elderly_care",
      mode: "phone",
      owner: "SDR Agent",
      closer: "SDR Lead",
      fieldCoordinator: "Ops Coordinator",
      specialist: "Elderly care assessor",
      status: "no_show",
      priority: "medium",
      date: today(-1),
      time: "15:00",
      durationMin: 30,
      valueMad: 18000,
      probability: 41,
      noShowRisk: 84,
      readinessScore: 37,
      decisionMakerPresent: false,
      decisionMaker: "Unknown",
      confirmationChannel: "Phone",
      confirmationMessage: "No answer before scheduled time.",
      reminderPlan: "Recovery WhatsApp + new time windows.",
      meetingObjective: "Recover missed assessment and rebook.",
      familyBriefing: "Needs care evaluation; no direct contact after initial form.",
      painPoints: "Trust, availability, family decision alignment.",
      predictedObjections: "No response, timing, alternative providers.",
      recommendedOffer: "Free quick phone assessment and flexible reschedule.",
      prepChecklist: ["Send recovery message", "Offer 2 slots", "Escalate if no answer", "Create follow-up"],
      liveNotes: "",
      outcome: "Missed appointment.",
      nextStep: "Send WhatsApp recovery and reschedule.",
      noShowReason: "No response.",
      recoveryPlan: "Send empathy message, offer two time windows, call again tomorrow.",
      escalationReason: "",
      documents: ["Recovery note"],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAutomations(): AutomationRule[] {
  return [
    {
      id: "auto-vip-unconfirmed",
      name: "VIP unconfirmed escalation",
      trigger: "Value > 100,000 MAD and confirmation pending for 6 hours",
      action: "Escalate to executive, assign senior closer and trigger WhatsApp + voice confirmation.",
      enabled: true,
    },
    {
      id: "auto-no-show-recovery",
      name: "No-show recovery workflow",
      trigger: "Appointment status becomes no_show",
      action: "Create recovery task, send WhatsApp recovery and notify SDR lead.",
      enabled: true,
    },
    {
      id: "auto-low-readiness",
      name: "Low readiness warning",
      trigger: "Readiness score below 50 before appointment",
      action: "Open prep checklist and notify owner/closer.",
      enabled: true,
    },
  ]
}

function defaultStore(): AppointmentStore {
  return {
    appointments: seedAppointments(),
    logs: [{ id: uid(), appointmentId: "system", at: new Date().toLocaleString(), action: "Appointments V12 initialized", note: "Deep execution engine seeded." }],
    automations: seedAutomations(),
  }
}

function readStore(): AppointmentStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as AppointmentStore
    if (!Array.isArray(parsed.appointments)) return defaultStore()
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    if (!Array.isArray(parsed.automations)) parsed.automations = seedAutomations()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: AppointmentStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
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

      {children}</section>
}

function Panel({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Card>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">{title}</p>
        {subtitle ? <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  )
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-violet-700 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-violet-700 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-violet-700 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-violet-700 text-white hover:bg-violet-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: AppointmentPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function statusTone(status: AppointmentStatus) {
  if (status === "converted") return "emerald"
  if (status === "no_show" || status === "lost" || status === "recovery") return "rose"
  if (status === "confirmed" || status === "prepared") return "blue"
  return "slate"
}

function pageTitle(mode: AppointmentPageMode) {
  const item = subpages.find((page) => page.mode === mode)
  return item?.label || "Appointments"
}

function pageSubtitle(mode: AppointmentPageMode) {
  const item = subpages.find((page) => page.mode === mode)
  return item?.desc || "Deep appointment execution layer."
}

export default function RevenueAppointmentsV12MegaWorkspace({ mode = "dashboard" }: { mode?: AppointmentPageMode }) {
  const [store, setStore] = useState<AppointmentStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<AppointmentPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "schedule")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [draft, setDraft] = useState({
    title: "",
    familyOrCompany: "",
    contactName: "",
    phone: "",
    city: "Rabat",
    address: "",
    source: "Manual",
    type: "family_consultation" as AppointmentType,
    mode: "phone" as AppointmentMode,
    owner: "SDR Agent",
    closer: "Revenue Manager",
    fieldCoordinator: "Ops Coordinator",
    specialist: "Care specialist",
    status: "requested" as AppointmentStatus,
    priority: "high" as AppointmentPriority,
    date: today(1),
    time: "10:00",
    durationMin: 45,
    valueMad: 15000,
    probability: 60,
    noShowRisk: 30,
    readinessScore: 55,
    decisionMakerPresent: false,
    decisionMaker: "",
    confirmationChannel: "WhatsApp",
    confirmationMessage: "",
    reminderPlan: "",
    meetingObjective: "",
    familyBriefing: "",
    painPoints: "",
    predictedObjections: "",
    recommendedOffer: "",
    prepChecklist: "Confirm decision maker\nPrepare offer\nSend reminder",
    liveNotes: "",
    outcome: "",
    nextStep: "",
    noShowReason: "",
    recoveryPlan: "",
    escalationReason: "",
    documents: "Consultation summary\nPricing proposal",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.appointments[0]?.id || "")
  }, [])

  function commit(next: AppointmentStore, action: string, note: string, appointmentId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), appointmentId: appointmentId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 150),
    }

    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.appointments[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.appointments.find((appointment) => appointment.id === selectedId) || store.appointments[0]

  const filtered = useMemo(() => {
    return store.appointments.filter((appointment) => {
      const hay = `${appointment.title} ${appointment.familyOrCompany} ${appointment.contactName} ${appointment.city} ${appointment.owner} ${appointment.closer} ${appointment.specialist} ${appointment.meetingObjective} ${appointment.nextStep}`.toLowerCase()

      const modeMatch =
        mode === "no-shows" ? appointment.status === "no_show" :
        mode === "reschedules" ? appointment.status === "rescheduled" :
        mode === "recovery" ? ["no_show", "recovery", "lost"].includes(appointment.status) :
        mode === "high-value" ? appointment.valueMad >= 50000 || appointment.priority === "critical" :
        mode === "risk" ? appointment.noShowRisk >= 60 || appointment.readinessScore < 50 :
        mode === "live" ? ["live", "prepared", "confirmed"].includes(appointment.status) :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || appointment.status === statusFilter)
        && (priorityFilter === "all" || appointment.priority === priorityFilter)
    })
  }, [store.appointments, query, statusFilter, priorityFilter, mode])

  const selectedChecklistDone = selected?.prepChecklist.filter((item) => item.startsWith("✓")).length || 0

  const stats = useMemo(() => {
    const todayCount = store.appointments.filter((appointment) => appointment.date === today(0)).length
    const confirmed = store.appointments.filter((appointment) => appointment.status === "confirmed" || appointment.status === "prepared").length
    const unconfirmed = store.appointments.filter((appointment) => ["requested", "scheduled", "confirmation_pending"].includes(appointment.status)).length
    const noShows = store.appointments.filter((appointment) => appointment.status === "no_show").length
    const converted = store.appointments.filter((appointment) => appointment.status === "converted").length
    const highValue = store.appointments.filter((appointment) => appointment.valueMad >= 50000 || appointment.priority === "critical").length
    const escalated = store.appointments.filter((appointment) => appointment.escalationReason.trim()).length
    const risk = store.appointments.filter((appointment) => appointment.noShowRisk >= 60 || appointment.readinessScore < 50).length
    const value = store.appointments.reduce((sum, appointment) => sum + Number(appointment.valueMad || 0), 0)
    const avgProbability = Math.round(store.appointments.reduce((sum, appointment) => sum + Number(appointment.probability || 0), 0) / Math.max(store.appointments.length, 1))
    const avgReadiness = Math.round(store.appointments.reduce((sum, appointment) => sum + Number(appointment.readinessScore || 0), 0) / Math.max(store.appointments.length, 1))

    return { todayCount, confirmed, unconfirmed, noShows, converted, highValue, escalated, risk, value, avgProbability, avgReadiness, total: store.appointments.length }
  }, [store.appointments])

  function updateAppointment(id: string, patch: Partial<AppointmentRecord>, action = "Appointment updated") {
    const target = store.appointments.find((appointment) => appointment.id === id)
    const appointments = store.appointments.map((appointment) => appointment.id === id ? { ...appointment, ...patch, updatedAt: new Date().toISOString() } : appointment)

    commit({ ...store, appointments }, action, target?.title || id, id)
  }

  function createAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const now = new Date().toISOString()
    const appointment: AppointmentRecord = {
      id: uid(),
      title: draft.title,
      familyOrCompany: draft.familyOrCompany,
      contactName: draft.contactName,
      phone: draft.phone,
      city: draft.city,
      address: draft.address,
      source: draft.source,
      type: draft.type,
      mode: draft.mode,
      owner: draft.owner,
      closer: draft.closer,
      fieldCoordinator: draft.fieldCoordinator,
      specialist: draft.specialist,
      status: draft.status,
      priority: draft.priority,
      date: draft.date,
      time: draft.time,
      durationMin: Number(draft.durationMin) || 45,
      valueMad: Number(draft.valueMad) || 0,
      probability: clamp(draft.probability),
      noShowRisk: clamp(draft.noShowRisk),
      readinessScore: clamp(draft.readinessScore),
      decisionMakerPresent: Boolean(draft.decisionMakerPresent),
      decisionMaker: draft.decisionMaker,
      confirmationChannel: draft.confirmationChannel,
      confirmationMessage: draft.confirmationMessage,
      reminderPlan: draft.reminderPlan,
      meetingObjective: draft.meetingObjective,
      familyBriefing: draft.familyBriefing,
      painPoints: draft.painPoints,
      predictedObjections: draft.predictedObjections,
      recommendedOffer: draft.recommendedOffer,
      prepChecklist: draft.prepChecklist.split("\n").map((item) => item.trim()).filter(Boolean),
      liveNotes: draft.liveNotes,
      outcome: draft.outcome,
      nextStep: draft.nextStep || "Confirm appointment and prepare context.",
      noShowReason: draft.noShowReason,
      recoveryPlan: draft.recoveryPlan,
      escalationReason: draft.escalationReason,
      documents: draft.documents.split("\n").map((item) => item.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, appointments: [appointment, ...store.appointments] }, "Appointment created", appointment.title, appointment.id)
    setSelectedId(appointment.id)
    setCreateOpen(false)
  }

  function deleteAppointment(id: string) {
    const target = store.appointments.find((appointment) => appointment.id === id)
    const appointments = store.appointments.filter((appointment) => appointment.id !== id)
    commit({ ...store, appointments }, "Appointment deleted", target?.title || id, id)
    setSelectedId(appointments[0]?.id || "")
  }

  function confirmAppointment(id: string) {
    updateAppointment(id, {
      status: "confirmed",
      confirmationMessage: "Confirmed. Reminder sequence active.",
      readinessScore: Math.max(selected?.readinessScore || 0, 70),
      nextStep: "Send reminder, prepare context and verify closer readiness.",
    }, "Appointment confirmed")
  }

  function prepareAppointment(id: string) {
    updateAppointment(id, {
      status: "prepared",
      readinessScore: 90,
      nextStep: "Appointment ready. Start live execution at meeting time.",
    }, "Appointment prepared")
  }

  function startLive(id: string) {
    updateAppointment(id, {
      status: "live",
      liveNotes: selected?.liveNotes || "Live execution started.",
      nextStep: "Capture objections, outcome and next commitment.",
    }, "Live appointment started")
  }

  function markNoShow(id: string) {
    updateAppointment(id, {
      status: "no_show",
      noShowReason: "No response / did not attend.",
      noShowRisk: 100,
      recoveryPlan: "Send empathy recovery message, offer two time windows, notify SDR lead.",
      nextStep: "Activate no-show recovery sequence.",
    }, "No-show logged")
  }

  function recoverAppointment(id: string) {
    updateAppointment(id, {
      status: "recovery",
      recoveryPlan: selected?.recoveryPlan || "Create recovery task, send WhatsApp, call tomorrow, escalate if high value.",
      nextStep: "Execute recovery workflow and reschedule.",
    }, "Recovery activated")
  }

  function rescheduleAppointment(id: string) {
    updateAppointment(id, {
      status: "rescheduled",
      date: today(2),
      confirmationMessage: "Rescheduled. Confirmation required.",
      nextStep: "Confirm new time with decision maker.",
    }, "Appointment rescheduled")
  }

  function convertAppointment(id: string) {
    updateAppointment(id, {
      status: "converted",
      probability: 100,
      outcome: selected?.outcome || "Converted into next revenue step.",
      nextStep: "Create onboarding/order/follow-up task and finalize documents.",
    }, "Appointment converted")
  }

  function closeLost(id: string) {
    updateAppointment(id, {
      status: "lost",
      outcome: selected?.outcome || "Lost or delayed. Recovery opportunity should be reviewed.",
      nextStep: "Run lost reason analysis and recovery decision.",
    }, "Appointment marked lost")
  }

  function escalateAppointment(id: string) {
    updateAppointment(id, {
      priority: "critical",
      escalationReason: selected?.escalationReason || "Executive intervention required.",
      nextStep: "Executive owner must review and decide intervention.",
    }, "Appointment escalated")
  }

  function autoScore(id: string) {
    const target = store.appointments.find((appointment) => appointment.id === id)
    if (!target) return

    let probability = 35
    if (target.decisionMakerPresent) probability += 18
    if (target.status === "confirmed" || target.status === "prepared") probability += 14
    if (target.valueMad >= 50000) probability += 8
    if (target.readinessScore >= 70) probability += 10
    if (target.noShowRisk >= 70) probability -= 16
    if (target.predictedObjections.trim()) probability -= 4

    const readiness = clamp(
      35
      + (target.confirmationMessage.trim() ? 15 : 0)
      + (target.meetingObjective.trim() ? 15 : 0)
      + (target.familyBriefing.trim() ? 10 : 0)
      + (target.prepChecklist.length * 4)
      + (target.decisionMakerPresent ? 15 : 0)
    )

    const noShowRisk = clamp(
      35
      + (target.status === "confirmation_pending" ? 25 : 0)
      + (target.status === "rescheduled" ? 12 : 0)
      + (!target.decisionMakerPresent ? 12 : 0)
      - (target.confirmationMessage.trim() ? 15 : 0)
    )

    updateAppointment(id, {
      probability: clamp(probability),
      readinessScore: readiness,
      noShowRisk,
      priority: probability >= 80 || target.valueMad >= 100000 ? "critical" : target.priority,
    }, "Predictive scoring updated")
  }

  function toggleChecklist(index: number) {
    if (!selected) return
    const next = selected.prepChecklist.map((item, i) => {
      if (i !== index) return item
      return item.startsWith("✓") ? item.replace(/^✓\s*/, "") : `✓ ${item}`
    })
    updateAppointment(selected.id, { prepChecklist: next }, "Checklist updated")
  }

  function addChecklistItem() {
    if (!selected || !newChecklistItem.trim()) return
    updateAppointment(selected.id, { prepChecklist: [...selected.prepChecklist, newChecklistItem.trim()] }, "Checklist item added")
    setNewChecklistItem("")
  }

  function toggleAutomation(id: string) {
    const automations = store.automations.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    commit({ ...store, automations }, "Automation toggled", id)
  }

  const boardGroups = statuses.map((status) => ({
    status,
    appointments: filtered.filter((appointment) => appointment.status === status),
  }))

  return (
    <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-h-screen bg-violet-50/60 text-slate-950 selection:bg-violet-200 selection:text-slate-950">
      <div className="w-full max-w-none min-w-0 space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-violet-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.28fr_.72fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="violet">Revenue Command</Pill>
                <Pill tone="blue">Appointments V12 Mega</Pill>
                <Pill tone="amber">{pageTitle(mode)}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Appointments deep execution engine — conversion, field control, recovery and executive command.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-violet-50/85 md:text-lg">
                This is no longer a calendar. It is a full appointment operating system: scheduling, confirmation, preparation, live execution, no-show recovery, conversion control, field coordination, AI scoring, executive escalation and revenue protection.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Schedule appointment</Button>
                <Button type="button" onClick={() => selected && autoScore(selected.id)}>Auto-score selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/appointments/control-tower" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Control Tower</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Today", stats.todayCount, "Appointments today"],
                ["Unconfirmed", stats.unconfirmed, "Need confirmation"],
                ["Value", mad(stats.value), "Revenue exposure"],
                ["Risk", stats.risk, "At-risk appointments"],
                ["Readiness", `${stats.avgReadiness}%`, "Avg readiness"],
                ["Probability", `${stats.avgProbability}%`, "Avg conversion"],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">{k}</p>
                  <p className="mt-3 text-3xl font-black text-white">{v}</p>
                  <p className="mt-2 text-sm font-bold text-white/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subpages.map((page) => (
            <Link key={page.href} href={page.href} className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${mode === page.mode ? "border-violet-400 bg-violet-100" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{page.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{page.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-700">Schedule</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Schedule full-control appointment</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createAppointment} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Appointment title" />
              <Input value={draft.familyOrCompany} onChange={(e) => setDraft({ ...draft, familyOrCompany: e.target.value })} placeholder="Family / company" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Address / location" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as AppointmentType })}>
                {types.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </Select>
              <Select value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as AppointmentMode })}>
                {modes.map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="SDR / owner" />
              <Input value={draft.closer} onChange={(e) => setDraft({ ...draft, closer: e.target.value })} placeholder="Closer" />
              <Input value={draft.fieldCoordinator} onChange={(e) => setDraft({ ...draft, fieldCoordinator: e.target.value })} placeholder="Field coordinator" />
              <Input value={draft.specialist} onChange={(e) => setDraft({ ...draft, specialist: e.target.value })} placeholder="Specialist" />
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AppointmentStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as AppointmentPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              <Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: Number(e.target.value) })} placeholder="Conversion %" />
              <Input type="number" value={draft.noShowRisk} onChange={(e) => setDraft({ ...draft, noShowRisk: Number(e.target.value) })} placeholder="No-show risk %" />
              <Input type="number" value={draft.readinessScore} onChange={(e) => setDraft({ ...draft, readinessScore: Number(e.target.value) })} placeholder="Readiness %" />
              <Input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="Decision maker" />
              <Input value={draft.confirmationChannel} onChange={(e) => setDraft({ ...draft, confirmationChannel: e.target.value })} placeholder="Confirmation channel" />
              <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Source" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
                <input type="checkbox" checked={draft.decisionMakerPresent} onChange={(e) => setDraft({ ...draft, decisionMakerPresent: e.target.checked })} />
                Decision maker present
              </label>
              <Textarea value={draft.meetingObjective} onChange={(e) => setDraft({ ...draft, meetingObjective: e.target.value })} placeholder="Meeting objective" className="xl:col-span-2" />
              <Textarea value={draft.familyBriefing} onChange={(e) => setDraft({ ...draft, familyBriefing: e.target.value })} placeholder="Family/company briefing" className="xl:col-span-2" />
              <Textarea value={draft.painPoints} onChange={(e) => setDraft({ ...draft, painPoints: e.target.value })} placeholder="Pain points" className="xl:col-span-2" />
              <Textarea value={draft.predictedObjections} onChange={(e) => setDraft({ ...draft, predictedObjections: e.target.value })} placeholder="Predicted objections" className="xl:col-span-2" />
              <Textarea value={draft.recommendedOffer} onChange={(e) => setDraft({ ...draft, recommendedOffer: e.target.value })} placeholder="Recommended offer" className="xl:col-span-2" />
              <Textarea value={draft.prepChecklist} onChange={(e) => setDraft({ ...draft, prepChecklist: e.target.value })} placeholder="Prep checklist, one per line" className="xl:col-span-2" />
              <Textarea value={draft.reminderPlan} onChange={(e) => setDraft({ ...draft, reminderPlan: e.target.value })} placeholder="Reminder plan" className="xl:col-span-2" />
              <Textarea value={draft.nextStep} onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })} placeholder="Next step" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Schedule appointment</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search appointments, contact, owner, closer, objective..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "all")}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as AppointmentPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New appointment</Button>
          </div>
        </Card>

        {["queue", "calendar", "control-tower"].includes(mode) ? (
          <section className="grid gap-4 xl:grid-cols-5">
            {boardGroups.map((group) => (
              <Card key={group.status} className="min-h-[230px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950">{label(group.status)}</h3>
                  <Pill tone="blue">{group.appointments.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.appointments.slice(0, 6).map((appointment) => (
                    <button key={appointment.id} type="button" onClick={() => setSelectedId(appointment.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{appointment.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{appointment.date} {appointment.time} • {mad(appointment.valueMad)}</p>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
          <section className="space-y-4">
            {filtered.map((appointment) => (
              <Card key={appointment.id} className={appointment.id === selected?.id ? "ring-4 ring-violet-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.65fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(appointment.priority)}>{label(appointment.priority)}</Pill>
                      <Pill tone={statusTone(appointment.status)}>{label(appointment.status)}</Pill>
                      <Pill tone="violet">{label(appointment.type)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(appointment.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-violet-800">{appointment.title}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{appointment.meetingObjective || appointment.nextStep}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{appointment.familyOrCompany} • {appointment.date} {appointment.time} • {appointment.phone}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Conversion engine</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{appointment.probability}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">No-show risk {appointment.noShowRisk}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Readiness {appointment.readinessScore}%</p>
                    <p className="mt-2 text-sm font-black text-violet-700">{mad(appointment.valueMad)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(appointment.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => confirmAppointment(appointment.id)}>Confirm</Button>
                    <Button type="button" variant="soft" onClick={() => prepareAppointment(appointment.id)}>Prepare</Button>
                    <Button type="button" variant="soft" onClick={() => startLive(appointment.id)}>Live</Button>
                    <Button type="button" variant="soft" onClick={() => rescheduleAppointment(appointment.id)}>Reschedule</Button>
                    <Button type="button" variant="soft" onClick={() => recoverAppointment(appointment.id)}>Recover</Button>
                    <Button type="button" variant="primary" onClick={() => convertAppointment(appointment.id)}>Convert</Button>
                    <Button type="button" variant="danger" onClick={() => markNoShow(appointment.id)}>No-show</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Selected appointment command room</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No appointment selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Conversion</p>
                      <p className="mt-1 text-2xl font-black">{selected.probability}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Risk</p>
                      <p className="mt-1 text-2xl font-black">{selected.noShowRisk}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Ready</p>
                      <p className="mt-1 text-2xl font-black">{selected.readinessScore}%</p>
                    </div>
                  </div>

                  <Textarea value={selected.familyBriefing} onChange={(e) => updateAppointment(selected.id, { familyBriefing: e.target.value }, "Briefing updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateAppointment(selected.id, { status: e.target.value as AppointmentStatus }, "Status updated")}>
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateAppointment(selected.id, { priority: e.target.value as AppointmentPriority }, "Priority updated")}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                    </Select>
                    <Input type="date" value={selected.date} onChange={(e) => updateAppointment(selected.id, { date: e.target.value }, "Date updated")} />
                    <Input type="time" value={selected.time} onChange={(e) => updateAppointment(selected.id, { time: e.target.value }, "Time updated")} />
                    <Input value={selected.owner} onChange={(e) => updateAppointment(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.closer} onChange={(e) => updateAppointment(selected.id, { closer: e.target.value }, "Closer updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateAppointment(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                    <Input type="number" value={selected.probability} onChange={(e) => updateAppointment(selected.id, { probability: clamp(Number(e.target.value)) }, "Probability updated")} />
                    <Input type="number" value={selected.noShowRisk} onChange={(e) => updateAppointment(selected.id, { noShowRisk: clamp(Number(e.target.value)) }, "No-show risk updated")} />
                    <Input type="number" value={selected.readinessScore} onChange={(e) => updateAppointment(selected.id, { readinessScore: clamp(Number(e.target.value)) }, "Readiness updated")} />
                  </div>

                  <Panel title="Preparation checklist" subtitle={`${selectedChecklistDone}/${selected.prepChecklist.length} completed`}>
                    <div className="space-y-2">
                      {selected.prepChecklist.map((item, index) => (
                        <button key={`${item}-${index}`} type="button" onClick={() => toggleChecklist(index)} className="block w-full rounded-2xl bg-slate-100 p-3 text-left text-sm font-black text-slate-900">
                          {item.startsWith("✓") ? "✅" : "⬜"} {item.replace(/^✓\s*/, "")}
                        </button>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add checklist item" />
                        <Button type="button" variant="primary" onClick={addChecklistItem}>Add</Button>
                      </div>
                    </div>
                  </Panel>

                  <Textarea value={selected.liveNotes} onChange={(e) => updateAppointment(selected.id, { liveNotes: e.target.value }, "Live notes updated")} placeholder="Live execution notes" />
                  <Textarea value={selected.outcome} onChange={(e) => updateAppointment(selected.id, { outcome: e.target.value }, "Outcome updated")} placeholder="Outcome" />
                  <Textarea value={selected.nextStep} onChange={(e) => updateAppointment(selected.id, { nextStep: e.target.value }, "Next step updated")} placeholder="Next step" />
                  <Textarea value={selected.recoveryPlan} onChange={(e) => updateAppointment(selected.id, { recoveryPlan: e.target.value }, "Recovery plan updated")} placeholder="Recovery plan" />
                  <Textarea value={selected.escalationReason} onChange={(e) => updateAppointment(selected.id, { escalationReason: e.target.value }, "Escalation updated")} placeholder="Escalation reason" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => autoScore(selected.id)}>Auto-score</Button>
                    <Button type="button" variant="soft" onClick={() => confirmAppointment(selected.id)}>Confirm</Button>
                    <Button type="button" variant="soft" onClick={() => prepareAppointment(selected.id)}>Prepare</Button>
                    <Button type="button" variant="soft" onClick={() => startLive(selected.id)}>Start live</Button>
                    <Button type="button" variant="soft" onClick={() => rescheduleAppointment(selected.id)}>Reschedule</Button>
                    <Button type="button" variant="soft" onClick={() => recoverAppointment(selected.id)}>Recover</Button>
                    <Button type="button" variant="danger" onClick={() => escalateAppointment(selected.id)}>Escalate</Button>
                    <Button type="button" variant="primary" onClick={() => convertAppointment(selected.id)}>Convert</Button>
                    <Button type="button" variant="danger" onClick={() => closeLost(selected.id)}>Lost</Button>
                    <Button type="button" variant="danger" onClick={() => deleteAppointment(selected.id)}>Delete</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Panel title="Automation engine" subtitle="Operational watchdog rules for appointments.">
              <div className="space-y-3">
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
            </Panel>

            <Panel title="AI copilot outputs" subtitle="Generated guidance for selected appointment.">
              {selected ? (
                <div className="space-y-3 text-sm font-bold leading-6 text-slate-700">
                  <div className="rounded-2xl bg-violet-50 p-4"><b>Briefing:</b> {selected.familyBriefing || "No briefing yet."}</div>
                  <div className="rounded-2xl bg-amber-50 p-4"><b>Objections:</b> {selected.predictedObjections || "No predicted objections yet."}</div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><b>Offer:</b> {selected.recommendedOffer || "No recommended offer yet."}</div>
                  <div className="rounded-2xl bg-rose-50 p-4"><b>Recovery:</b> {selected.recoveryPlan || "No recovery plan yet."}</div>
                </div>
              ) : null}
            </Panel>

            <Panel title="Activity stream" subtitle="Every command action is logged locally.">
              <div className="space-y-2">
                {store.logs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.note} • {log.at}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}
