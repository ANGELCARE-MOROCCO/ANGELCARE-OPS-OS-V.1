"use client"

import Link from "next/link"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  MapPin,
  MoreHorizontal,
  Sparkles,
  Target,
  Trash2,
  Users,
  Zap,
} from "lucide-react"
import type { AppointmentCommandPayload, AppointmentRecord } from "@/lib/revenue-command-center/appointments-command-store"
import { dateKey, initials, statusTone, timeLabel, typeLabel, typeTone } from "./appointment-command-utils"

export function AppointmentSidebar({ metrics }: { metrics: AppointmentCommandPayload["metrics"] }) {
  const nav = [
    ["Command Center", "/revenue-command-center", Target],
    ["Prospects Directory", "/revenue-command-center/prospects/directory", Users],
    ["All Prospects", "/revenue-command-center/prospects", Users],
    ["Daily Tasks", "/revenue-command-center/daily-tasks", CheckCircle2],
    ["Appointments", "/revenue-command-center/appointments", CalendarDays],
    ["Automations", "/revenue-command-center/automation", Zap],
    ["Reports", "/revenue-command-center/revenue-analytics", BarChart3],
  ] as const

  return (
    <aside className="rcc-sidebar sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-[#244365] bg-[#07111f]/98 p-6 xl:block">
      <Link href="/revenue-command-center" className="mb-9 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-600 text-black">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-black tracking-[.18em] text-white">ANGELCARE</div>
          <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white">B2B Acquisition Command</div>
        </div>
      </Link>
      <div className="space-y-3">
        {nav.map(([label, href, Icon]) => (
          <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${label === "Appointments" ? "bg-violet-600/30 text-white ring-1 ring-violet-400/30" : "text-white hover:bg-white/5 hover:text-white"}`}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {label === "Daily Tasks" && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs">{metrics.today_count}</span>}
          </Link>
        ))}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[#244365] bg-[#10223a] p-4">
        <div className="text-xs font-black uppercase tracking-[.14em] text-violet-200">Angel AI Assistant</div>
        <p className="mt-2 text-xs font-semibold text-white">Appointments are live and synced across tasks, prospects and analytics.</p>
      </div>
    </aside>
  )
}

export function Kpi({ icon, label, value, detail, tone = "blue" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: string }) {
  const color = tone === "emerald" ? "from-emerald-600 to-green-500" : tone === "violet" ? "from-violet-600 to-purple-500" : tone === "amber" ? "from-amber-500 to-orange-500" : "from-blue-600 to-sky-500"
  return (
    <div className="rcc-kpi rounded-2xl border border-[#244365] bg-[#10223a] p-6">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white [&_svg]:h-6 [&_svg]:w-6`}>{icon}</div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-[.1em] text-white">{label}</div>
          <div className="text-3xl font-black text-white">{value}</div>
          <div className="text-xs font-bold text-white">{detail}</div>
        </div>
      </div>
    </div>
  )
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rcc-panel rounded-2xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_18px_50px_rgba(0,0,0,.24)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black text-white">{title}</h3>
        {action}
      </div>
      
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

      {children}
    </section>
  )
}

export function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${active ? "bg-violet-600 text-white" : "bg-[#07111f] text-white hover:text-white"}`}>
      {icon}
      {children}
    </button>
  )
}

export function InputDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border border-[#244365] bg-[#07111f] px-4 text-sm font-black text-white outline-none" />
}

export function SelectMini({ value, onChange, options, full = false }: { value: string; onChange: (value: string) => void; options: string[]; full?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${full ? "w-full" : "w-full xl:w-[180px]"} h-11 rounded-xl border border-[#244365] bg-[#07111f] px-3 text-sm font-black text-white outline-none`}>
      {options.map((x) => <option key={x} value={x}>{x === "all" ? "All" : typeLabel(x)}</option>)}
    </select>
  )
}

export function MiniCalendar({ selectedDate, setSelectedDate, appointments }: { selectedDate: string; setSelectedDate: (v: string) => void; appointments: AppointmentRecord[] }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const currentMonth = new Date(selectedDate).toISOString().slice(0, 7)
  return (
    <Panel title={new Date(selectedDate).toLocaleDateString([], { month: "long", year: "numeric" })}>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-white">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <span key={d}>{d}</span>)}
        {days.map((day) => {
          const value = `${currentMonth}-${String(day).padStart(2, "0")}`
          const has = appointments.some((a) => dateKey(a.appointment_at) === value)
          return <button key={day} onClick={() => setSelectedDate(value)} className={`rounded-lg p-2 text-sm font-black ${selectedDate === value ? "bg-violet-600 text-white" : has ? "bg-blue-500/15 text-blue-100" : "text-white hover:bg-white/5"}`}>{day}</button>
        })}
      </div>
    </Panel>
  )
}

export function AppointmentRow({ appointment, onSelect, onEdit, onAction }: { appointment: AppointmentRecord; onSelect: (a: AppointmentRecord) => void; onEdit: (a: AppointmentRecord) => void; onAction: (a: AppointmentRecord, action: "confirm" | "complete" | "cancel" | "delete") => void }) {
  const rowGradient = appointment.appointment_type.includes("call")
    ? "from-emerald-600/30 via-emerald-500/15 to-green-500/10 hover:border-emerald-300/70"
    : appointment.appointment_type.includes("demo")
      ? "from-amber-600/30 via-orange-500/15 to-yellow-500/10 hover:border-amber-300/70"
      : appointment.appointment_type.includes("site")
        ? "from-blue-600/30 via-sky-500/15 to-cyan-500/10 hover:border-blue-300/70"
        : appointment.appointment_type.includes("contract")
          ? "from-red-600/30 via-rose-500/15 to-orange-500/10 hover:border-red-300/70"
          : "from-violet-600/30 via-indigo-500/20 to-blue-500/15 hover:border-violet-300/70"
  return (
    <div onClick={() => onSelect(appointment)} className={`mb-2 cursor-pointer rounded-xl border border-[#315474] appt-block bg-gradient-to-r ${rowGradient} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">{timeLabel(appointment.appointment_at)} - {timeLabel(appointment.end_at)}</div>
          <div className="mt-1 text-lg font-black text-white">{appointment.title}</div>
          <div className="text-xs font-semibold text-white">{appointment.entity_name} · {appointment.entity_city}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg border px-2 py-1 text-xs font-black ${typeTone(appointment.appointment_type)}`}>{typeLabel(appointment.appointment_type)}</span>
          <span className={`rounded-lg border px-2 py-1 text-xs font-black ${statusTone(appointment.status)}`}>{appointment.status}</span>
          <button onClick={(e) => { e.stopPropagation(); onEdit(appointment) }} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white"><Edit3 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onAction(appointment, "complete") }} className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-200"><CheckCircle2 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onAction(appointment, "delete") }} className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/15 text-red-200"><Trash2 className="h-4 w-4" /></button>
          <MoreHorizontal className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}

export function AppointmentAgenda({ appointments, onSelect, onEdit, onAction }: { appointments: AppointmentRecord[]; onSelect: (a: AppointmentRecord) => void; onEdit: (a: AppointmentRecord) => void; onAction: (a: AppointmentRecord, action: "confirm" | "complete" | "cancel" | "delete") => void }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)
  return (
    <div className="p-4">
      <div className="grid gap-2">
        {hours.map((hour) => {
          const items = appointments.filter((a) => new Date(a.appointment_at).getHours() === hour)
          return (
            <div key={hour} className="grid grid-cols-[64px_1fr] gap-3">
              <div className="rcc-muted text-sm font-bold text-white">{String(hour).padStart(2, "0")}:00</div>
              <div className="min-h-[62px] rounded-xl border border-dashed border-[#315474] bg-[#07111f]/45 p-1.5">
                {items.map((appt) => <AppointmentRow key={appt.id} appointment={appt} onSelect={onSelect} onEdit={onEdit} onAction={onAction} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AppointmentList({ appointments, onSelect, onEdit, onAction }: { appointments: AppointmentRecord[]; onSelect: (a: AppointmentRecord) => void; onEdit: (a: AppointmentRecord) => void; onAction: (a: AppointmentRecord, action: "confirm" | "complete" | "cancel" | "delete") => void }) {
  return <div className="space-y-2 p-4">{appointments.map((appt) => <AppointmentRow key={appt.id} appointment={appt} onSelect={onSelect} onEdit={onEdit} onAction={onAction} />)}{!appointments.length && <div className="p-12 text-center text-sm font-black text-white">No appointments match this view.</div>}</div>
}

export function TimelineView({ appointments, onSelect }: { appointments: AppointmentRecord[]; onSelect: (a: AppointmentRecord) => void }) {
  return <div className="space-y-4 p-5">{appointments.map((a) => <button key={a.id} onClick={() => onSelect(a)} className="grid w-full grid-cols-[90px_1fr_auto] items-center gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 text-left"><span className="text-sm font-black text-white">{timeLabel(a.appointment_at)}</span><span><span className="block text-base font-black text-white">{a.title}</span><span className="text-xs font-bold text-white">{a.entity_name} · {a.entity_city}</span></span><span className={`rounded-xl border px-3 py-1 text-xs font-black ${statusTone(a.status)}`}>{a.status}</span></button>)}</div>
}

export function UpcomingCard({ appointment, onClick }: { appointment: AppointmentRecord; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-[#10223a] p-3 text-left hover:bg-white/5"><div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/20 text-violet-100"><span className="text-xs font-black">{new Date(appointment.appointment_at).toLocaleDateString([], { month: "short" }).toUpperCase()}</span><span className="-mt-2 text-lg font-black">{new Date(appointment.appointment_at).getDate()}</span></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-white">{appointment.title}</div><div className="truncate text-xs font-semibold text-white">{appointment.entity_name}</div><div className="text-xs text-white">{timeLabel(appointment.appointment_at)}</div></div><span className={`rounded-lg border px-2 py-1 text-xs font-black ${statusTone(appointment.status)}`}>{appointment.status}</span></button>
}

export function Donut({ total, values }: { total: number; values: Array<{ appointment_type: string; total: number; pct: number }> }) {
  return <div className="flex items-center gap-5"><div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#7c3aed_0_40%,#22c55e_40%_65%,#f59e0b_65%_80%,#0ea5e9_80%_100%)]"><div className="grid h-20 w-20 place-items-center rounded-full bg-[#10223a] text-center"><span className="text-2xl font-black text-white">{total}</span><span className="-mt-5 text-[10px] font-bold text-white">Total</span></div></div><div className="space-y-3">{values.slice(0, 5).map((v) => <div key={v.appointment_type} className="flex gap-2 text-xs font-bold text-white"><span>●</span><span>{typeLabel(v.appointment_type)} {v.total} ({v.pct}%)</span></div>)}</div></div>
}
