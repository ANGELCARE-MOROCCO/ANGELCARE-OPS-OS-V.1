"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  Layers3,
  Link2,
  Mail,
  MapPinned,
  MessageCircle,
  Plus,
  Radar,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { runAppointmentAction, saveAppointment, type AppointmentCommandPayload, type AppointmentProspect, type AppointmentRecord } from "@/lib/revenue-command-center/appointments-command-store"
import { useLiveAppointments, useLiveProspects, useLiveTasks, type RCCAppointment, type RCCProspect } from "@/lib/revenue-command-center/live-sync"
import { AppointmentAgenda, AppointmentList, Donut, InputDate, Kpi, MiniCalendar, Panel, SelectMini, Tab, TimelineView, UpcomingCard } from "@/components/revenue-command-center/appointments/appointment-command-widgets"
import { APPOINTMENT_TYPES, dateKey, filterAppointments, timeLabel } from "@/components/revenue-command-center/appointments/appointment-command-utils"
import { AppointmentDetails, AppointmentModal } from "@/components/revenue-command-center/appointments/AppointmentAdvancedControls"

type ViewMode = "calendar" | "list" | "timeline"
type CalendarScope = "day" | "week" | "month"

function appointmentToLegacy(row: RCCAppointment): AppointmentRecord {
  return {
    id: row.id,
    entity_type: "prospect",
    entity_id: row.entityId,
    title: row.title,
    appointment_at: row.appointmentAt,
    end_at: row.endAt || null,
    owner: row.owner,
    status: row.status as AppointmentRecord["status"],
    appointment_type: row.appointmentType,
    priority: row.priority,
    location: row.location || null,
    meeting_link: row.meetingLink || null,
    notes: row.notes || null,
    agenda: row.agenda || null,
    objective: row.objective || null,
    expected_outcome: row.expectedOutcome || null,
    attendees: row.attendees || [],
    reminders: row.reminders || [],
    documents: row.documents || [],
    tasks: row.tasks || [],
    created_at: String(row.raw?.created_at || row.updatedAt || new Date().toISOString()),
    updated_at: String(row.updatedAt || row.raw?.updated_at || new Date().toISOString()),
    entity_name: row.entityName,
    entity_city: row.entityCity,
    entity_priority: row.raw?.entity_priority,
    entity_stage: row.raw?.entity_stage,
    entity_contact: row.raw?.entity_contact,
    entity_phone: row.raw?.entity_phone,
    entity_email: row.raw?.entity_email,
    entity_score: row.raw?.entity_score,
    entity_value_mad: row.raw?.entity_value_mad,
    linked_task_count: row.raw?.linked_task_count,
  }
}

function prospectToAppointmentOption(row: RCCProspect): AppointmentProspect {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    stage: row.stage,
    priority: row.priority,
    value_mad: row.valueMad,
    score: row.score,
    contactName: row.contactName,
    owner: row.owner,
    email: row.email,
    phone: row.phone,
  }
}

function buildAppointmentMetrics(appointments: AppointmentRecord[]): AppointmentCommandPayload["metrics"] {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const total = appointments.length
  const confirmed = appointments.filter((a) => ["confirmed", "completed"].includes(a.status)).length
  const completed = appointments.filter((a) => a.status === "completed").length
  const durations = appointments.map((a) => {
    const start = new Date(a.appointment_at).getTime()
    const end = a.end_at ? new Date(a.end_at).getTime() : start + 45 * 60000
    return Math.max(1, Math.round((end - start) / 60000))
  })

  return {
    today_count: appointments.filter((a) => dateKey(a.appointment_at) === todayKey).length,
    week_count: appointments.filter((a) => {
      const d = new Date(a.appointment_at)
      return d >= weekStart && d < weekEnd
    }).length,
    month_count: appointments.filter((a) => {
      const d = new Date(a.appointment_at)
      return d >= monthStart && d < monthEnd
    }).length,
    confirmed_rate: total ? Math.round((confirmed / total) * 100) : 0,
    conversion_rate: total ? Math.round((completed / total) * 100) : 0,
    avg_duration_minutes: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    total_count: total,
  }
}

function buildTypeStats(appointments: AppointmentRecord[]) {
  const total = Math.max(appointments.length, 1)
  const map = new Map<string, number>()
  appointments.forEach((a) => map.set(a.appointment_type, (map.get(a.appointment_type) || 0) + 1))
  return Array.from(map.entries())
    .map(([appointment_type, count]) => ({ appointment_type, total: count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.total - a.total)
}



function UniformRevenueSidebar({
  active = "appointments",
}: {
  active?: "appointments" | "tasks" | "prospects" | "directory" | "partner" | "calendar" | "email" | "whatsapp" | "map" | "analytics" | "insights"
  taskCount?: number
  prospectCount?: number
  hotCount?: number
}) {
  const item = (href: string, icon: React.ReactNode, label: string, key: NonNullable<Parameters<typeof UniformRevenueSidebar>[0]["active"]>) => (
    <a
      href={href}
      className={`flex items-center gap-4 rounded-[22px] px-5 py-3.5 text-[16px] font-black transition ${
        active === key
          ? "bg-violet-800/80 text-white shadow-[0_10px_35px_rgba(124,58,237,.3)]"
          : "text-[#e5eefc] hover:bg-[#10223a]"
      }`}
    >
      <span className="grid h-7 w-7 place-items-center [&_svg]:h-7 [&_svg]:w-7">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </a>
  )

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-32px)] w-[292px] min-w-[292px] max-w-[292px] shrink-0 flex-col overflow-y-auto border-r border-[#244365] bg-[#07111f]/95 px-5 py-7 shadow-[18px_0_70px_rgba(0,0,0,.38)] backdrop-blur-xl">
      <a href="/revenue-command-center" className="mb-8 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-600 text-black shadow-lg shadow-yellow-500/25">
          <Sparkles className="h-9 w-9" />
        </div>
        <div>
          <div className="text-[26px] font-black tracking-[.22em] text-white">ANGELCARE</div>
          <div className="text-[13px] font-black uppercase tracking-[.18em] text-white">PROSPECT CENTER</div>
        </div>
      </a>

      <nav className="space-y-2">
        {item("/revenue-command-center", <Radar />, "Command Center", "prospects")}
        {item("/revenue-command-center/prospects/directory", <MapPinned />, "Prospects Directory", "directory")}
        {item("/revenue-command-center/partnerships", <Handshake />, "Partner Program", "partner")}
        {item("/revenue-command-center/daily-tasks", <CircleCheck />, "Tasks & Actions", "tasks")}
        {item("/revenue-command-center/appointments", <CalendarDays />, "Calendar", "appointments")}
        {item("/revenue-command-center/campaigns", <Mail />, "Email Campaigns", "email")}
        {item("/revenue-command-center/follow-ups", <MessageCircle />, "WhatsApp Center", "whatsapp")}
        {item("/revenue-command-center/market-mapping", <Globe2 />, "Market Map", "map")}
        {item("/revenue-command-center/revenue-analytics", <BarChart3 />, "Analytics & Reports", "analytics")}
        {item("/revenue-command-center/executive-briefing", <ShieldCheck />, "Market Insights", "insights")}
      </nav>
    </aside>
  )
}


export default function RevenueAppointmentsProductionCommandCenter() {
  const [error, setError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [scope, setScope] = useState<CalendarScope>("day")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  const {
    appointments: liveAppointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
  } = useLiveAppointments()

  const {
    prospects: liveProspects,
    loading: prospectsLoading,
    error: prospectsError,
    refresh: refreshProspects,
  } = useLiveProspects()

  const {
    tasks: liveTasks,
    byEntityId: tasksByProspect,
    loading: tasksLoading,
    refresh: refreshTasks,
  } = useLiveTasks()

  async function refresh() {
    setError("")
    await Promise.all([refreshAppointments(), refreshProspects(), refreshTasks()])
  }


  const appointments = useMemo(() => liveAppointments.map(appointmentToLegacy), [liveAppointments])
  const prospects = useMemo(() => liveProspects.map(prospectToAppointmentOption), [liveProspects])
  const metrics = useMemo(() => buildAppointmentMetrics(appointments), [appointments])
  const loading = appointmentsLoading || prospectsLoading || tasksLoading
  const filtered = useMemo(() => filterAppointments(appointments, { query, typeFilter, statusFilter, ownerFilter }), [appointments, query, typeFilter, statusFilter, ownerFilter])
  const dayAppointments = filtered.filter((appt) => dateKey(appt.appointment_at) === selectedDate)
  const upcoming = appointments.filter((appt) => new Date(appt.appointment_at).getTime() >= Date.now()).slice(0, 5)
  const owners = Array.from(new Set(appointments.map((appt) => appt.owner).filter(Boolean)))
  const typeStats = useMemo(() => buildTypeStats(appointments), [appointments])
  const completedToday = appointments.filter((appt) => dateKey(appt.appointment_at) === selectedDate && ["confirmed", "completed"].includes(appt.status)).length
  const cancelledToday = appointments.filter((appt) => dateKey(appt.appointment_at) === selectedDate && appt.status === "cancelled").length
  const scheduledToday = appointments.filter((appt) => dateKey(appt.appointment_at) === selectedDate && appt.status === "scheduled").length

  async function save(input: Record<string, any>) {
    await saveAppointment(input)
    setActionMessage(input.id ? "Appointment updated and synced." : "Appointment scheduled and synced.")
    setModalOpen(false)
    setEditingAppointment(null)
    await refresh()
  }

  async function quickAction(appt: AppointmentRecord, action: "confirm" | "complete" | "cancel" | "delete") {
    await runAppointmentAction(appt.id, action)
    setActionMessage(`Appointment ${action} synced.`)
    await refresh()
  }

  function createMeetingLink() {
    const slug = `angelcare-${Date.now().toString(36)}`
    navigator.clipboard?.writeText(`https://meet.google.com/${slug}`)
    setActionMessage("Meeting link copied. Add it to an appointment from the appointment modal.")
  }

  function exportCsv() {
    const header = ["title", "prospect", "city", "type", "status", "owner", "start", "end", "location"]
    const rows = filtered.map((x) => [x.title, x.entity_name || "", x.entity_city || "", x.appointment_type, x.status, x.owner, x.appointment_at, x.end_at || "", x.location || ""])
    const csv = [header.join(","), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `angelcare-appointments-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setActionMessage("Appointments exported.")
  }

  return (
    <main data-rcc-root="true" data-appointments-command="true" className="rcc-page-shell min-h-screen bg-[#050b16] text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-appointments-command],
        [data-appointments-command] * {
          color: #ffffff !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }

        [data-appointments-command] input,
        [data-appointments-command] textarea,
        [data-appointments-command] select,
        [data-appointments-command] option {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #060b18 !important;
          border-color: rgba(94, 139, 196, .55) !important;
        }

        [data-appointments-command] input::placeholder {
          color: rgba(255,255,255,.62) !important;
          -webkit-text-fill-color: rgba(255,255,255,.62) !important;
        }

        [data-appointments-command] aside a,
        [data-appointments-command] aside span,
        [data-appointments-command] aside div,
        [data-appointments-command] button,
        [data-appointments-command] button * {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        [data-appointments-command] .rcc-page-shell {
          background:
            radial-gradient(circle at 15% 2%, rgba(129, 76, 255, .28), transparent 26%),
            radial-gradient(circle at 82% 7%, rgba(0, 217, 255, .20), transparent 28%),
            radial-gradient(circle at 86% 70%, rgba(0, 255, 153, .08), transparent 30%),
            linear-gradient(180deg, #06111f 0%, #030814 72%, #01040b 100%) !important;
        }

        [data-appointments-command] .rcc-sidebar {
          background: linear-gradient(180deg, rgba(7,17,31,.99), rgba(4,10,20,.99)) !important;
          border-right: 1px solid rgba(79, 142, 218, .38) !important;
          box-shadow: 24px 0 70px rgba(0,0,0,.55) !important;
        }

        [data-appointments-command] .rcc-kpi,
        [data-appointments-command] .rcc-panel,
        [data-appointments-command] .rcc-calendar {
          background: linear-gradient(180deg, rgba(17,34,58,.98), rgba(9,20,36,.98)) !important;
          border: 1px solid rgba(81, 147, 230, .36) !important;
          box-shadow: 0 24px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.06) !important;
        }

        [data-appointments-command] .rcc-appt {
          border: 1px solid rgba(122, 92, 255, .72) !important;
          box-shadow: 0 18px 38px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08) !important;
        }

        [data-appointments-command] .rcc-soft {
          background: rgba(5, 11, 24, .72) !important;
          border: 1px solid rgba(79, 142, 218, .30) !important;
        }

        [data-appointments-command] .rcc-muted,
        [data-appointments-command] .rcc-muted * {
          color: rgba(255,255,255,.82) !important;
        }

        [data-appointments-command] .rcc-pill,
        [data-appointments-command] .rcc-pill * {
          color: #ffffff !important;
          font-weight: 900 !important;
        }
      ` }} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_2%,rgba(124,58,237,.25),transparent_26%),radial-gradient(circle_at_75%_8%,rgba(14,165,233,.22),transparent_30%),radial-gradient(circle_at_92%_28%,rgba(16,185,129,.13),transparent_24%),linear-gradient(180deg,#081120_0%,#030814_72%,#01040b_100%)]" />
      {modalOpen && <AppointmentModal prospects={prospects} appointment={editingAppointment} onClose={() => { setModalOpen(false); setEditingAppointment(null) }} onSave={(input) => void save(input)} />}
      <div className="relative flex w-full min-w-0 max-w-none">
        <UniformRevenueSidebar
          active="appointments"
          taskCount={liveTasks.length || 1}
          prospectCount={prospects.length || 78}
          hotCount={Math.max(
            0,
            prospects.filter((p) => p.priority === "critical" || p.priority === "high").length,
          ) || 77}
        />
        <section className="min-w-0 flex-1 p-7 xl:p-8">
          <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-[34px] font-black tracking-tight text-white">Appointments</h1>
              <p className="mt-2 text-base font-semibold text-white/85">Manage all meetings, calls and engagements with prospects and partners.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" /> Schedule Appointment</button>
              <button onClick={createMeetingLink} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-5 py-3 text-sm font-black text-white"><Link2 className="h-4 w-4" /> Create Meeting Link</button>
              <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-5 py-3 text-sm font-black text-white"><FileText className="h-4 w-4" /> Export</button>
              <button onClick={() => void refresh()} className="grid h-12 w-12 place-items-center rounded-xl border border-[#244365] bg-[#10223a] text-white"><RefreshCcw className="h-4 w-4" /></button>
            </div>
          </header>

          {(error || appointmentsError || prospectsError) && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-100">{error || appointmentsError || prospectsError}</div>}
          {actionMessage && <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-black text-emerald-100">{actionMessage}</div>}

          <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Kpi icon={<CalendarDays />} label="Today" value={String(metrics.today_count)} detail="Appointments" />
            <Kpi icon={<CalendarDays />} label="This Week" value={String(metrics.week_count)} detail="Appointments" tone="emerald" />
            <Kpi icon={<CalendarDays />} label="This Month" value={String(metrics.month_count)} detail="Appointments" tone="violet" />
            <Kpi icon={<Clock3 />} label="Confirmed" value={`${metrics.confirmed_rate}%`} detail="Attendance Rate" tone="amber" />
            <Kpi icon={<BarChart3 />} label="Conversion" value={`${metrics.conversion_rate}%`} detail="From Meetings" tone="emerald" />
            <Kpi icon={<Clock3 />} label="Avg. Duration" value={`${metrics.avg_duration_minutes}m`} detail="Per Meeting" tone="blue" />
          </section>

          <section className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="flex flex-wrap gap-2">
              <Tab active={viewMode === "calendar"} onClick={() => setViewMode("calendar")} icon={<CalendarDays />}>Calendar View</Tab>
              <Tab active={viewMode === "list"} onClick={() => setViewMode("list")} icon={<FileText />}>List View</Tab>
              <Tab active={viewMode === "timeline"} onClick={() => setViewMode("timeline")} icon={<Clock3 />}>Timeline View</Tab>
              <div className="relative min-w-[300px] flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search appointment, prospect, city, owner..." className="h-12 w-full rounded-xl border border-[#315474] bg-[#07111f] pl-11 pr-4 text-sm font-black text-white outline-none placeholder:text-white/55" />
              </div>
            </div>
            <InputDate value={selectedDate} onChange={setSelectedDate} />
            <SelectMini value={typeFilter} onChange={setTypeFilter} options={["all", ...APPOINTMENT_TYPES]} />
            <SelectMini value={statusFilter} onChange={setStatusFilter} options={["all", "scheduled", "confirmed", "completed", "pending", "cancelled", "no_show"]} />
            <SelectMini value={ownerFilter} onChange={setOwnerFilter} options={["all", ...owners]} />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[330px_minmax(680px,1fr)_390px]">
            <aside className="space-y-4">
              <MiniCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} appointments={appointments} />
              <Panel title="Appointment Types">
                <div className="space-y-2">
                  {typeStats.map((type) => <div key={type.appointment_type} className="flex items-center justify-between rounded-xl bg-[#10223a] p-2 text-sm font-bold text-white"><span>{type.appointment_type}</span><span className="rounded-lg bg-white/10 px-2 py-1 text-xs">{type.total}</span></div>)}
                  {!typeStats.length && <div className="text-sm font-bold text-white/60">No appointment types yet.</div>}
                  <button onClick={() => setModalOpen(true)} className="mt-2 text-xs font-black text-violet-300">+ Add Custom Type</button>
                </div>
              </Panel>
              <Panel title="Team Filter">
                <SelectMini value={ownerFilter} onChange={setOwnerFilter} options={["all", ...owners]} full />
              </Panel>
            </aside>

            <section className="rcc-calendar rounded-2xl border border-[#244365] bg-[#0e1e34]">
              <div className="flex items-center justify-between border-b border-[#244365] p-5">
                <h2 className="text-xl font-black text-white">{new Date(selectedDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2>
                <div className="flex rounded-xl border border-[#244365] bg-[#07111f] p-1">
                  {(["day", "week", "month"] as CalendarScope[]).map((item) => <button key={item} onClick={() => setScope(item)} className={`rounded-lg px-4 py-2 text-xs font-black ${scope === item ? "bg-violet-600 text-white" : "text-white/65"}`}>{item}</button>)}
                </div>
              </div>
              {viewMode === "calendar" && <AppointmentAgenda appointments={dayAppointments} onSelect={setSelectedAppointment} onEdit={(appt) => { setEditingAppointment(appt.id ? appt : null); setModalOpen(true) }} onAction={quickAction} />}
              {viewMode === "list" && <AppointmentList appointments={filtered} onSelect={setSelectedAppointment} onEdit={(appt) => { setEditingAppointment(appt); setModalOpen(true) }} onAction={quickAction} />}
              {viewMode === "timeline" && <TimelineView appointments={filtered} onSelect={setSelectedAppointment} />}
              {loading && <div className="p-6 text-sm font-black text-white/60">Loading live appointments...</div>}
            </section>

            <aside className="space-y-4">
              <Panel title="Upcoming Appointments" action={<button className="text-xs font-black text-violet-300">View All</button>}>
                <div className="space-y-3">{upcoming.map((appt) => <UpcomingCard key={appt.id} appointment={appt} onClick={() => setSelectedAppointment(appt)} />)}{!upcoming.length && <div className="text-sm font-bold text-white/60">No upcoming appointments.</div>}</div>
              </Panel>
              <Panel title="Appointment Statistics"><Donut total={metrics.total_count} values={typeStats} /></Panel>
              <Panel title="Today's Overview"><div className="space-y-2 text-sm font-black text-white/80"><div>🟢 {completedToday} Completed</div><div>🔵 {scheduledToday} Scheduled</div><div>🔴 {cancelledToday} Cancelled</div><div className="mt-3 rounded-xl bg-[#07111f] p-3">Selected: {selectedAppointment ? `${selectedAppointment.title} · ${timeLabel(selectedAppointment.appointment_at)}` : "None"}</div></div></Panel>
            </aside>
          </section>

          <AppointmentDetails appointment={selectedAppointment} onEdit={(appt) => { setEditingAppointment(appt); setModalOpen(true) }} onAction={quickAction} />
        </section>
      </div>
    </main>
  )
}
