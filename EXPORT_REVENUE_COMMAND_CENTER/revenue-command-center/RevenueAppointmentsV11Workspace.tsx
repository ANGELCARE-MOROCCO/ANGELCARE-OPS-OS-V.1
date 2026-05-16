"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type AppointmentStatus =
  | "requested"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "no_show"
  | "rescheduled"
  | "converted"
  | "cancelled"

type AppointmentPriority = "critical" | "high" | "medium" | "low"
type AppointmentType = "consultation" | "follow_up" | "partner_meeting" | "sales_call" | "academy_meeting" | "care_assessment"

type AppointmentRecord = {
  id: string
  title: string
  familyOrCompany: string
  contactName: string
  phone: string
  city: string
  type: AppointmentType
  owner: string
  closer: string
  status: AppointmentStatus
  priority: AppointmentPriority
  date: string
  time: string
  valueMad: number
  confirmationMessage: string
  meetingObjective: string
  prepNotes: string
  outcome: string
  nextStep: string
  noShowReason: string
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

type AppointmentStore = {
  appointments: AppointmentRecord[]
  logs: AppointmentLog[]
}

const STORE_KEY = "revenue_appointments_v11_store"

const statuses: AppointmentStatus[] = ["requested", "scheduled", "confirmed", "completed", "no_show", "rescheduled", "converted", "cancelled"]
const priorities: AppointmentPriority[] = ["critical", "high", "medium", "low"]
const types: AppointmentType[] = ["consultation", "follow_up", "partner_meeting", "sales_call", "academy_meeting", "care_assessment"]

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

function seedAppointments(): AppointmentRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "apt-postpartum-vip-01",
      title: "VIP postpartum consultation",
      familyOrCompany: "Family A",
      contactName: "Spouse decision maker",
      phone: "+212600000201",
      city: "Rabat",
      type: "consultation",
      owner: "SDR Lead",
      closer: "Revenue Manager",
      status: "confirmed",
      priority: "critical",
      date: today(0),
      time: "17:30",
      valueMad: 42000,
      confirmationMessage: "Confirmed by WhatsApp. Send reminder 2h before.",
      meetingObjective: "Confirm needs, urgency, pricing, start date and decision path.",
      prepNotes: "Mother + baby context, preference for supervised caregiver, spouse involved.",
      outcome: "",
      nextStep: "Prepare consultation sheet and confirm final attendance.",
      noShowReason: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "apt-clinic-partner-02",
      title: "Clinic partnership presentation",
      familyOrCompany: "Clinic Maternity Rabat",
      contactName: "Medical Director",
      phone: "+212600000202",
      city: "Rabat",
      type: "partner_meeting",
      owner: "BD Officer",
      closer: "CEO / Revenue Manager",
      status: "scheduled",
      priority: "high",
      date: today(2),
      time: "10:00",
      valueMad: 320000,
      confirmationMessage: "Calendar invite sent. Awaiting final confirmation.",
      meetingObjective: "Present referral economics, care quality process and joint activation.",
      prepNotes: "Bring partner one-pager and referral flow.",
      outcome: "",
      nextStep: "Confirm attendees and send agenda.",
      noShowReason: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "apt-no-show-recovery-03",
      title: "No-show recovery call",
      familyOrCompany: "Website elderly care lead",
      contactName: "Family contact",
      phone: "+212600000203",
      city: "Temara",
      type: "follow_up",
      owner: "SDR Agent",
      closer: "SDR Lead",
      status: "no_show",
      priority: "medium",
      date: today(-1),
      time: "15:00",
      valueMad: 18000,
      confirmationMessage: "No answer before scheduled time.",
      meetingObjective: "Recover missed appointment and rebook.",
      prepNotes: "Use empathetic recovery message, offer 2 new time windows.",
      outcome: "Missed appointment.",
      nextStep: "Send WhatsApp recovery and reschedule.",
      noShowReason: "No response.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): AppointmentStore {
  return {
    appointments: seedAppointments(),
    logs: [{ id: uid(), appointmentId: "system", at: new Date().toLocaleString(), action: "Appointments initialized", note: "Revenue Appointments V11 workspace seeded." }],
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

export default function RevenueAppointmentsV11Workspace({ mode = "workspace" }: { mode?: "workspace" | "command" | "new" }) {
  const [store, setStore] = useState<AppointmentStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<AppointmentPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [draft, setDraft] = useState({
    title: "",
    familyOrCompany: "",
    contactName: "",
    phone: "",
    city: "Rabat",
    type: "consultation" as AppointmentType,
    owner: "SDR Agent",
    closer: "Revenue Manager",
    status: "requested" as AppointmentStatus,
    priority: "high" as AppointmentPriority,
    date: today(1),
    time: "10:00",
    valueMad: 15000,
    confirmationMessage: "",
    meetingObjective: "",
    prepNotes: "",
    outcome: "",
    nextStep: "",
    noShowReason: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.appointments[0]?.id || "")
  }, [])

  function commit(next: AppointmentStore, action: string, note: string, appointmentId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), appointmentId: appointmentId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 100),
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
      const hay = `${appointment.title} ${appointment.familyOrCompany} ${appointment.contactName} ${appointment.city} ${appointment.owner} ${appointment.closer} ${appointment.nextStep}`.toLowerCase()

      return (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || appointment.status === statusFilter)
        && (priorityFilter === "all" || appointment.priority === priorityFilter)
    })
  }, [store.appointments, query, statusFilter, priorityFilter])

  const stats = useMemo(() => {
    const todayCount = store.appointments.filter((appointment) => appointment.date === today(0)).length
    const unconfirmed = store.appointments.filter((appointment) => ["requested", "scheduled"].includes(appointment.status)).length
    const noShows = store.appointments.filter((appointment) => appointment.status === "no_show").length
    const converted = store.appointments.filter((appointment) => appointment.status === "converted").length
    const value = store.appointments.reduce((sum, appointment) => sum + Number(appointment.valueMad || 0), 0)

    return { todayCount, unconfirmed, noShows, converted, value, total: store.appointments.length }
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
      type: draft.type,
      owner: draft.owner,
      closer: draft.closer,
      status: draft.status,
      priority: draft.priority,
      date: draft.date,
      time: draft.time,
      valueMad: Number(draft.valueMad) || 0,
      confirmationMessage: draft.confirmationMessage,
      meetingObjective: draft.meetingObjective,
      prepNotes: draft.prepNotes,
      outcome: draft.outcome,
      nextStep: draft.nextStep || "Confirm appointment and prepare context.",
      noShowReason: draft.noShowReason,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, appointments: [appointment, ...store.appointments] }, "Appointment created", appointment.title, appointment.id)
    setSelectedId(appointment.id)
    setCreateOpen(false)
    setDraft({
      title: "",
      familyOrCompany: "",
      contactName: "",
      phone: "",
      city: "Rabat",
      type: "consultation",
      owner: "SDR Agent",
      closer: "Revenue Manager",
      status: "requested",
      priority: "high",
      date: today(1),
      time: "10:00",
      valueMad: 15000,
      confirmationMessage: "",
      meetingObjective: "",
      prepNotes: "",
      outcome: "",
      nextStep: "",
      noShowReason: "",
    })
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
      confirmationMessage: "Confirmed. Send reminder and prepare consultation context.",
      nextStep: "Send reminder, prepare context and ensure closer readiness.",
    }, "Appointment confirmed")
  }

  function markNoShow(id: string) {
    updateAppointment(id, {
      status: "no_show",
      noShowReason: "No response / did not attend.",
      nextStep: "Send recovery message and offer two new time windows.",
    }, "No-show logged")
  }

  function convertAppointment(id: string) {
    updateAppointment(id, {
      status: "converted",
      outcome: "Converted into next revenue step.",
      nextStep: "Create onboarding/order/follow-up task.",
    }, "Appointment converted")
  }

  function rescheduleAppointment(id: string) {
    updateAppointment(id, {
      status: "rescheduled",
      date: today(2),
      nextStep: "Confirm new appointment time with decision maker.",
    }, "Appointment rescheduled")
  }

  return (
    <main className="min-h-screen bg-violet-50/60 text-slate-950 selection:bg-violet-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-violet-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="violet">Revenue Command</Pill>
                <Pill tone="blue">Appointments V11</Pill>
                <Pill tone="amber">{mode === "command" ? "Conversion Desk" : mode === "new" ? "New Appointment" : "Command Workspace"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Appointments command — confirmation, no-show recovery and conversion control.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-violet-50/85 md:text-lg">
                A focused appointment cockpit to protect conversion moments: schedule, confirm, prepare, recover no-shows, capture outcome and move every meeting into the next revenue step.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Schedule appointment</Button>
                <Button type="button" onClick={() => selected && confirmAppointment(selected.id)}>Confirm selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/appointments/command" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Conversion desk</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">Today</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.todayCount}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Appointments today</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">Unconfirmed</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.unconfirmed}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Needs confirmation</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Opportunity exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">Converted</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.converted}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Successful outcomes</p>
              </div>
            </div>
          </div>
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-700">Schedule</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Schedule controlled revenue appointment</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createAppointment} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Appointment title" />
              <Input value={draft.familyOrCompany} onChange={(e) => setDraft({ ...draft, familyOrCompany: e.target.value })} placeholder="Family / company" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as AppointmentType })}>
                {types.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Coordinator" />
              <Input value={draft.closer} onChange={(e) => setDraft({ ...draft, closer: e.target.value })} placeholder="Closer" />
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AppointmentStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as AppointmentPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              <Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Textarea value={draft.meetingObjective} onChange={(e) => setDraft({ ...draft, meetingObjective: e.target.value })} placeholder="Meeting objective" className="xl:col-span-3" />
              <Textarea value={draft.prepNotes} onChange={(e) => setDraft({ ...draft, prepNotes: e.target.value })} placeholder="Preparation notes" className="xl:col-span-2" />
              <Textarea value={draft.nextStep} onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })} placeholder="Next step" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Schedule appointment</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search appointments, contact, city, owner, objective..." />
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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-4">
            {filtered.map((appointment) => (
              <Card key={appointment.id} className={appointment.id === selected?.id ? "ring-4 ring-violet-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.6fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(appointment.priority)}>{label(appointment.priority)}</Pill>
                      <Pill tone={appointment.status === "no_show" ? "rose" : appointment.status === "converted" ? "emerald" : "blue"}>{label(appointment.status)}</Pill>
                      <Pill tone="violet">{label(appointment.type)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(appointment.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-violet-800">{appointment.title}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{appointment.meetingObjective || appointment.nextStep}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{appointment.familyOrCompany} • {appointment.date} {appointment.time} • {appointment.phone}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Value / closer</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{mad(appointment.valueMad)}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{appointment.closer} • {appointment.city}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(appointment.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => confirmAppointment(appointment.id)}>Confirm</Button>
                    <Button type="button" variant="soft" onClick={() => rescheduleAppointment(appointment.id)}>Reschedule</Button>
                    <Button type="button" variant="soft" onClick={() => markNoShow(appointment.id)}>No-show</Button>
                    <Button type="button" variant="primary" onClick={() => convertAppointment(appointment.id)}>Convert</Button>
                    <Button type="button" variant="danger" onClick={() => deleteAppointment(appointment.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Selected appointment</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No appointment selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.prepNotes} onChange={(e) => updateAppointment(selected.id, { prepNotes: e.target.value }, "Prep notes updated")} />
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
                  </div>
                  <Textarea value={selected.confirmationMessage} onChange={(e) => updateAppointment(selected.id, { confirmationMessage: e.target.value }, "Confirmation updated")} />
                  <Textarea value={selected.outcome} onChange={(e) => updateAppointment(selected.id, { outcome: e.target.value }, "Outcome updated")} />
                  <Textarea value={selected.nextStep} onChange={(e) => updateAppointment(selected.id, { nextStep: e.target.value }, "Next step updated")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => confirmAppointment(selected.id)}>Confirm</Button>
                    <Button type="button" variant="soft" onClick={() => rescheduleAppointment(selected.id)}>Reschedule</Button>
                    <Button type="button" variant="danger" onClick={() => markNoShow(selected.id)}>No-show</Button>
                    <Button type="button" variant="primary" onClick={() => convertAppointment(selected.id)}>Convert</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-700">Appointment activity log</p>
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
      </div>
    </main>
  )
}
