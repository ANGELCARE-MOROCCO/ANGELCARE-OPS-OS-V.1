"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react"
import {
  useLiveAppointments,
  useLiveProspects,
  useLiveTasks,
  type RCCProspect,
} from "@/lib/revenue-command-center/live-sync"

type ViewMode = "grid" | "table"

function money(value: number) {
  return `${Math.round(value || 0).toLocaleString()} MAD`
}

function stageLabel(value: string) {
  return String(value || "new_lead").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function tonePriority(priority: string) {
  if (priority === "critical") return "border-red-300/30 bg-red-500/15 text-red-100"
  if (priority === "high") return "border-rose-300/30 bg-rose-500/15 text-rose-100"
  if (priority === "medium") return "border-amber-300/30 bg-amber-500/15 text-amber-100"
  return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
}

function scoreTone(score: number) {
  if (score >= 80) return "from-emerald-400 to-cyan-400"
  if (score >= 60) return "from-amber-400 to-orange-500"
  return "from-blue-400 to-violet-500"
}

export default function RevenueProspectsLiveSyncCommandCenter() {
  const { prospects, loading: prospectsLoading, error: prospectsError, lastSync: prospectLastSync, refresh: refreshProspects } = useLiveProspects()
  const { tasks, byEntityId: tasksByProspect, loading: tasksLoading, refresh: refreshTasks } = useLiveTasks()
  const { appointments, byEntityId: appointmentsByProspect, loading: appointmentsLoading, refresh: refreshAppointments } = useLiveAppointments()

  const [query, setQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const cities = useMemo(() => Array.from(new Set(prospects.map((p) => p.city).filter(Boolean))).sort(), [prospects])
  const stages = useMemo(() => Array.from(new Set(prospects.map((p) => p.stage).filter(Boolean))).sort(), [prospects])
  const priorities = useMemo(() => Array.from(new Set(prospects.map((p) => p.priority).filter(Boolean))).sort(), [prospects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects
      .filter((p) => cityFilter === "all" || p.city === cityFilter)
      .filter((p) => stageFilter === "all" || p.stage === stageFilter)
      .filter((p) => priorityFilter === "all" || p.priority === priorityFilter)
      .filter((p) => {
        if (!q) return true
        return [p.name, p.city, p.stage, p.priority, p.owner, p.contactName, p.email, p.phone]
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => b.score - a.score)
  }, [prospects, query, cityFilter, stageFilter, priorityFilter])

  const totalValue = prospects.reduce((sum, p) => sum + Number(p.valueMad || 0), 0)
  const highPriority = prospects.filter((p) => ["high", "critical"].includes(p.priority)).length
  const withTasks = prospects.filter((p) => (tasksByProspect.get(p.id) || []).length > 0).length
  const withAppointments = prospects.filter((p) => (appointmentsByProspect.get(p.id) || []).length > 0).length
  const loading = prospectsLoading || tasksLoading || appointmentsLoading

  async function refreshAll() {
    await Promise.all([refreshProspects(), refreshTasks(), refreshAppointments()])
  }

  return (
    <main data-rcc-prospects-live="true" className="min-h-screen bg-[#050b16] text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-rcc-prospects-live],
        [data-rcc-prospects-live] * {
          color: #ffffff !important;
          opacity: 1 !important;
        }
        [data-rcc-prospects-live] input,
        [data-rcc-prospects-live] select,
        [data-rcc-prospects-live] option {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background: #07111f !important;
        }
      ` }} />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(124,58,237,.24),transparent_27%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,.16),transparent_28%),linear-gradient(180deg,#081120_0%,#030814_74%,#01040b_100%)]" />

      <div className="relative w-full max-w-none min-w-0 p-6 xl:p-8">
        <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-cyan-100">
              <Sparkles className="h-4 w-4" /> Live Canonical Sync
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Prospects Command Center</h1>
            <p className="mt-2 text-base font-bold text-white/80">
              Synced live from revenue_prospects, revenue_tasks and revenue_appointments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/revenue-command-center/prospects/directory" className="inline-flex items-center gap-2 rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white hover:bg-white/5">
              <Users className="h-4 w-4" /> Directory
            </Link>
            <Link href="/revenue-command-center/daily-tasks" className="inline-flex items-center gap-2 rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white hover:bg-white/5">
              <CheckCircle2 className="h-4 w-4" /> Tasks
            </Link>
            <Link href="/revenue-command-center/appointments" className="inline-flex items-center gap-2 rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white hover:bg-white/5">
              <CalendarDays className="h-4 w-4" /> Appointments
            </Link>
            <button onClick={() => void refreshAll()} className="grid h-12 w-12 place-items-center rounded-xl border border-[#315474] bg-[#10223a] text-white hover:bg-white/5">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {prospectsError && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-100">
            {prospectsError}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Kpi icon={<Building2 />} label="Live Prospects" value={String(prospects.length)} detail={`${filtered.length} in current view`} />
          <Kpi icon={<TrendingUp />} label="Pipeline Value" value={money(totalValue)} detail="From revenue_prospects" tone="emerald" />
          <Kpi icon={<Target />} label="High Priority" value={String(highPriority)} detail="High / critical accounts" tone="rose" />
          <Kpi icon={<CheckCircle2 />} label="With Tasks" value={String(withTasks)} detail={`${tasks.length} total tasks`} tone="amber" />
          <Kpi icon={<CalendarDays />} label="With Appointments" value={String(withAppointments)} detail={`${appointments.length} total appointments`} tone="violet" />
          <Kpi icon={<Activity />} label="Live Status" value={loading ? "Syncing" : "Synced"} detail={prospectLastSync ? prospectLastSync.toLocaleTimeString() : "Waiting"} tone="blue" />
        </section>

        <section className="mb-5 rounded-3xl border border-[#315474] bg-gradient-to-br from-[#10223a] to-[#07111f] p-5 shadow-[0_24px_70px_rgba(0,0,0,.34)]">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_180px_150px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospects, city, owner, contact, phone..." className="h-12 w-full rounded-xl border border-[#315474] bg-[#07111f] pl-11 pr-4 text-sm font-black text-white outline-none placeholder:text-white/45" />
            </div>
            <Select value={cityFilter} onChange={setCityFilter} options={["all", ...cities]} label="City" />
            <Select value={stageFilter} onChange={setStageFilter} options={["all", ...stages]} label="Stage" />
            <Select value={priorityFilter} onChange={setPriorityFilter} options={["all", ...priorities]} label="Priority" />
            <button onClick={() => { setQuery(""); setCityFilter("all"); setStageFilter("all"); setPriorityFilter("all") }} className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-3 text-sm font-black text-white hover:bg-white/5">
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-white/70">
              <Filter className="h-4 w-4" /> {filtered.length} visible / {prospects.length} live prospects
            </div>
            <div className="flex rounded-xl border border-[#315474] bg-[#07111f] p-1">
              <button onClick={() => setViewMode("grid")} className={`rounded-lg px-4 py-2 text-xs font-black ${viewMode === "grid" ? "bg-violet-600" : "bg-transparent"}`}>Grid</button>
              <button onClick={() => setViewMode("table")} className={`rounded-lg px-4 py-2 text-xs font-black ${viewMode === "table" ? "bg-violet-600" : "bg-transparent"}`}>Table</button>
            </div>
          </div>
        </section>

        {viewMode === "grid" ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                taskCount={(tasksByProspect.get(prospect.id) || []).length}
                appointmentCount={(appointmentsByProspect.get(prospect.id) || []).length}
                nextAppointment={(appointmentsByProspect.get(prospect.id) || [])[0]?.appointmentAt}
              />
            ))}
          </section>
        ) : (
          <ProspectTable prospects={filtered} tasksByProspect={tasksByProspect} appointmentsByProspect={appointmentsByProspect} />
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#07111f] p-10 text-center">
            <div className="text-xl font-black text-white">No prospects match this view</div>
            <div className="mt-2 text-sm font-bold text-white/65">Reset filters or verify revenue_prospects access.</div>
          </div>
        )}
      </div>
    </main>
  )
}

function Kpi({ icon, label, value, detail, tone = "blue" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "blue" | "emerald" | "rose" | "amber" | "violet" }) {
  const bg = tone === "emerald" ? "from-emerald-500 to-green-500" : tone === "rose" ? "from-rose-500 to-red-500" : tone === "amber" ? "from-amber-400 to-orange-500" : tone === "violet" ? "from-violet-500 to-purple-600" : "from-blue-500 to-cyan-500"
  return (
    <div className="rounded-3xl border border-[#315474] bg-gradient-to-br from-[#10223a] to-[#07111f] p-5 shadow-[0_18px_60px_rgba(0,0,0,.30)]">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${bg} text-white shadow-lg [&_svg]:h-6 [&_svg]:w-6`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/65">{label}</div>
          <div className="truncate text-2xl font-black text-white">{value}</div>
          <div className="truncate text-xs font-bold text-white/70">{detail}</div>
        </div>
      </div>
    </div>
  )
}

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-12 rounded-xl border border-[#315474] bg-[#07111f] px-3 text-sm font-black text-white outline-none">
      {options.map((option) => <option key={option} value={option}>{option === "all" ? `All ${label}s` : stageLabel(option)}</option>)}
    </select>
  )
}

function ProspectCard({ prospect, taskCount, appointmentCount, nextAppointment }: { prospect: RCCProspect; taskCount: number; appointmentCount: number; nextAppointment?: string }) {
  return (
    <article className="group rounded-3xl border border-[#315474] bg-gradient-to-br from-[#10223a] to-[#07111f] p-5 shadow-[0_18px_60px_rgba(0,0,0,.30)] transition hover:-translate-y-0.5 hover:border-cyan-300/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${scoreTone(prospect.score)} text-lg font-black text-white shadow-lg`}>
            {prospect.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-white">{prospect.name}</h2>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-black text-white"><MapPin className="mr-1 inline h-3 w-3" />{prospect.city}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${tonePriority(prospect.priority)}`}>{prospect.priority}</span>
              <span className="rounded-full border border-violet-300/25 bg-violet-500/15 px-2.5 py-1 text-[11px] font-black text-violet-100">{stageLabel(prospect.stage)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#07111f] p-3 text-center">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/55">Score</div>
          <div className="text-2xl font-black text-white">{prospect.score}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Mini label="Value" value={money(prospect.valueMad)} />
        <Mini label="Tasks" value={String(taskCount)} />
        <Mini label="Appointments" value={String(appointmentCount)} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#07111f]/75 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <UserRoundCheck className="h-4 w-4 text-cyan-200" /> {prospect.contactName}
        </div>
        <div className="mt-1 text-xs font-bold text-white/65">{prospect.owner} · {prospect.email || "No email"} · {prospect.phone || "No phone"}</div>
        <div className="mt-2 text-xs font-bold text-cyan-100">
          Next appointment: {nextAppointment ? new Date(nextAppointment).toLocaleString() : "Not scheduled"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href={`/revenue-command-center/prospects/${prospect.id}`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-3 text-xs font-black text-white">
          Profile <ChevronRight className="h-4 w-4" />
        </Link>
        <Link href={`/revenue-command-center/daily-tasks?prospect=${prospect.id}`} className="inline-flex items-center justify-center rounded-xl border border-[#315474] bg-[#10223a] px-3 py-3 text-xs font-black text-white">
          Tasks
        </Link>
        <Link href={`/revenue-command-center/appointments?prospect=${prospect.id}`} className="inline-flex items-center justify-center rounded-xl border border-[#315474] bg-[#10223a] px-3 py-3 text-xs font-black text-white">
          Appointments
        </Link>
      </div>
    </article>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/55">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-white">{value}</div>
    </div>
  )
}

function ProspectTable({ prospects, tasksByProspect, appointmentsByProspect }: { prospects: RCCProspect[]; tasksByProspect: Map<string, any[]>; appointmentsByProspect: Map<string, any[]> }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#315474] bg-[#07111f] shadow-[0_18px_60px_rgba(0,0,0,.30)]">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-[#10223a] text-xs font-black uppercase tracking-[.14em] text-white/65">
          <tr>
            <th className="p-4">Prospect</th>
            <th className="p-4">City</th>
            <th className="p-4">Stage</th>
            <th className="p-4">Priority</th>
            <th className="p-4">Score</th>
            <th className="p-4">Value</th>
            <th className="p-4">Tasks</th>
            <th className="p-4">Appointments</th>
            <th className="p-4">Open</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p) => (
            <tr key={p.id} className="border-t border-white/10 text-sm font-bold text-white">
              <td className="p-4">{p.name}</td>
              <td className="p-4">{p.city}</td>
              <td className="p-4">{stageLabel(p.stage)}</td>
              <td className="p-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${tonePriority(p.priority)}`}>{p.priority}</span></td>
              <td className="p-4">{p.score}</td>
              <td className="p-4">{money(p.valueMad)}</td>
              <td className="p-4">{(tasksByProspect.get(p.id) || []).length}</td>
              <td className="p-4">{(appointmentsByProspect.get(p.id) || []).length}</td>
              <td className="p-4"><Link href={`/revenue-command-center/prospects/${p.id}`} className="text-cyan-200">Profile</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
