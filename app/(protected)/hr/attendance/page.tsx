import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  Home,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Users,
  UserCheck,
  Workflow,
} from 'lucide-react'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'
import {
  approveAttendanceAction,
  createAttendanceAction,
  getAttendanceEnterpriseData,
  markReviewAttendanceAction,
} from '@/lib/hr-production/attendance-enterprise'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/hr', icon: Home },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
      { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Onboarding', href: '/hr/onboarding', icon: CalendarCheck },
      { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
      { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
      { label: 'Leave Management', href: '/hr/approvals', icon: Clock3 },
      { label: 'Work Schedules', href: '/hr/work-schedules', icon: Workflow },
      { label: 'Time Tracking', href: '/hr/workforce-ops', icon: ActivityIcon },
    ],
  },
  {
    label: 'COMPLIANCE & DOCUMENTS',
    items: [
      { label: 'Documents', href: '/hr/documents', icon: FolderKanban },
      { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Integrations', href: '/hr/sync-center', icon: Sparkles },
      { label: 'Settings', href: '/hr/settings', icon: Settings },
    ],
  },
]

function ActivityIcon(props: React.ComponentProps<typeof Gauge>) {
  return <Gauge {...props} />
}


function t(v: any) {
  const s = String(v || '')
  if (!s) return '—'
  if (s.includes('T')) return s.slice(11, 16)
  return s.slice(0, 5)
}
function d(v: any) { return String(v || '').slice(0, 10) || '—' }
function rid(r: Row) { return encodeURIComponent(String(r?.id || r?.identity?.staff_id || r?.identity?.name || 'staff')) }
function staffKeyOf(r: Row) { return String(r?.identity?.staff_id || r?.identity?.user_id || r?.identity?.email || r?.identity?.name || r?.staff_id || r?.employee_id || r?.id || 'staff') }
function staffModalId(r: Row) { return `record-${encodeURIComponent(staffKeyOf(r))}` }
function uniqueByStaff(rows: Row[]) {
  const seen = new Set<string>()
  const out: Row[] = []
  for (const r of rows) {
    const key = staffKeyOf(r)
    if (!seen.has(key)) { seen.add(key); out.push(r) }
  }
  return out
}
function pct(n: number, total: number) { return total ? Math.round((n / total) * 100) : 0 }
function isToday(r: Row) { return d(r.work_date || r.created_at) === new Date().toISOString().slice(0,10) }
function isoToday() { return new Date().toISOString().slice(0,10) }
function shiftDate(date: string, days: number) { const x = new Date(`${date || isoToday()}T12:00:00`); x.setDate(x.getDate()+days); return x.toISOString().slice(0,10) }
function niceDate(date: string) { try { return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long', day:'2-digit', month:'short', year:'numeric'}) } catch { return date } }
function monthStart(date: string) { const x = new Date(`${date || isoToday()}T12:00:00`); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-01` }
function monthEnd(date: string) { const x = new Date(`${date || isoToday()}T12:00:00`); return new Date(x.getFullYear(), x.getMonth()+1, 0).toISOString().slice(0,10) }
function inPeriod(row: Row, from: string, to: string) { const day = d(row.work_date || row.created_at); return day >= from && day <= to }
function minsLabel(mins: number) { const h = Math.floor(Math.max(0, mins) / 60); const m = Math.max(0, mins) % 60; return h ? `${h}h ${m}m` : `${m}m` }
function workedMinutes(r: Row) {
  if (Number(r.worked_minutes || r.duration_minutes || 0) > 0) return Number(r.worked_minutes || r.duration_minutes || 0)
  const a = String(r.punch_in_at || ''); const b = String(r.punch_out_at || '')
  const parse = (v: string) => { const m = v.includes('T') ? v.slice(11,16) : v.slice(0,5); const [hh,mm] = m.split(':').map(Number); return Number.isFinite(hh) ? hh*60+(mm||0) : 0 }
  const start = parse(a); const end = parse(b); return start && end && end > start ? end - start : 0
}
function minutesFromAnyTime(v: any) {
  const raw = String(v || '')
  if (!raw) return 0
  const m = raw.includes('T') ? raw.slice(11, 16) : raw.slice(0, 5)
  const [hh, mm] = m.split(':').map(Number)
  return Number.isFinite(hh) ? hh * 60 + (mm || 0) : 0
}
function monthWorkedMinutes(rows: Row[], from: string, to: string) {
  const byDay = new Map<string, Row[]>()
  rows.filter((x) => inPeriod(x, from, to)).forEach((x) => {
    const day = d(x.work_date || x.created_at || x.punch_in_at || x.punch_out_at)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(x)
  })
  let total = 0
  for (const [, dayRows] of byDay) {
    const direct = dayRows.reduce((sum, x) => sum + workedMinutes(x), 0)
    if (direct > 0) { total += direct; continue }
    const times = dayRows.flatMap((x) => [minutesFromAnyTime(x.punch_in_at), minutesFromAnyTime(x.punch_out_at), minutesFromAnyTime(x.created_at)]).filter(Boolean).sort((a,b)=>a-b)
    if (times.length >= 2 && times[times.length - 1] > times[0]) total += times[times.length - 1] - times[0]
    else if (dayRows.some((x) => /present|complete|valid|approved|auto|in|out/i.test(String(x.status || x.event_type || x.type || '')))) total += 8 * 60
  }
  return total
}
function activeDays(rows: Row[], from: string, to: string) {
  return new Set(rows.filter((x) => inPeriod(x, from, to)).map((x) => d(x.work_date || x.created_at || x.punch_in_at || x.punch_out_at))).size
}
function statusTone(status: any) {
  const s = String(status || '').toLowerCase()
  if (/present|completed|valid|approved|auto/.test(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (/late|review|pending|open/.test(s)) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (/absent|missing|exception|risk/.test(s)) return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}
function Status({ value }: { value: any }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusTone(value)}`}>{String(value || 'pending').replaceAll('_',' ')}</span>
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)] ${className}`}>{children}</section>
}
function ModalShell({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div id={id} className="fixed inset-x-0 bottom-0 top-[112px] z-[120] hidden overflow-y-auto bg-slate-950/45 p-6 backdrop-blur-md target:block">
      <a href="#attendance-command" className="absolute inset-0 cursor-default" aria-label="Close attendance modal" />
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_34px_120px_rgba(15,23,42,.30)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-violet-50 to-cyan-50 p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[.35em] text-violet-500">Attendance operation</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>
          <a href="#attendance-command" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-light text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white">×</a>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  )
}
function ModalButton({ href, children, tone = 'light' }: { href: string; children: React.ReactNode; tone?: 'light'|'dark'|'green'|'purple' }) {
  const c = tone === 'dark' ? 'bg-slate-950 text-white' : tone === 'green' ? 'bg-emerald-600 text-white' : tone === 'purple' ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white' : 'border border-slate-200 bg-white text-slate-800'
  return <a href={href} className={`rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${c}`}>{children}</a>
}

function HrSidebar() {
  return (
    <aside className="sticky top-[82px] hidden h-[calc(100vh-82px)] w-[318px] shrink-0 overflow-y-auto border-r border-slate-100 bg-white px-7 py-8 shadow-[18px_0_60px_rgba(15,23,42,.04)] xl:block">
      <div className="mb-10 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-[0_18px_45px_rgba(124,58,237,.35)]">
          <Sparkles className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[26px] font-black leading-tight tracking-[-.04em] text-slate-950">AngelCare HR</div>
          <div className="mt-1 text-[15px] font-black uppercase tracking-[.32em] text-slate-800">Command OS</div>
        </div>
      </div>

      <nav className="space-y-8" aria-label="AngelCare HR navigation">
        {navGroups.map((group) => (
          <section key={group.label}>
            <div className="mb-4 text-[15px] font-black uppercase tracking-[.30em] text-slate-400">{group.label}</div>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = item.href === '/hr/attendance'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-5 rounded-[20px] px-5 py-4 text-[18px] font-black transition-all duration-200 ${
                      active
                        ? 'border border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-white text-slate-950 shadow-[0_12px_30px_rgba(124,58,237,.12)]'
                        : 'text-slate-800 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-violet-700'
                    }`}
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-slate-900' : 'text-slate-800 group-hover:text-violet-700'}`} strokeWidth={2.25} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  )
}


function Metric({ label, value, sub, icon, tone='violet' }: { label: string; value: any; sub: string; icon: string; tone?: string }) {
  const bg = tone === 'green' ? 'from-emerald-50 to-teal-50 text-emerald-700' : tone === 'rose' ? 'from-rose-50 to-orange-50 text-rose-700' : tone === 'blue' ? 'from-blue-50 to-cyan-50 text-blue-700' : tone === 'amber' ? 'from-amber-50 to-orange-50 text-amber-700' : 'from-violet-50 to-indigo-50 text-violet-700'
  return <Card className="p-5"><div className="flex items-center gap-4"><div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${bg} text-2xl`}>{icon}</div><div><p className="text-xs font-black text-slate-500">{label}</p><div className="mt-1 text-3xl font-black text-slate-950">{value}</div><p className="text-xs font-bold text-slate-500">{sub}</p></div></div></Card>
}

function ShiftGrid({ records, selectedDate }: { records: Row[]; selectedDate: string }) {
  const lanes = Array.from(new Map(records.slice(0, 80).map((r) => [r.identity?.name || r.id, r])).values()).slice(0, 12)
  const hours = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
  const prev = shiftDate(selectedDate, -1)
  const next = shiftDate(selectedDate, 1)
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-xl font-black text-slate-950">Live Shift Board</h3>
          <p className="text-sm font-semibold text-slate-500">Monitor active staff lanes, schedule coverage, late arrivals and exceptions for the selected day.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/hr/attendance?date=${prev}`} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">‹</Link>
          <form className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <input type="date" name="date" defaultValue={selectedDate} className="bg-transparent text-sm font-black text-slate-800 outline-none" />
            <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
          </form>
          <Link href={`/hr/attendance?date=${next}`} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">›</Link>
          <Link href="/hr/attendance" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Today</Link>
          <ModalButton href="#manual-punch">Manual punch</ModalButton>
          <ModalButton href="#bulk-action" tone="purple">Bulk action</ModalButton>
        </div>
      </div>
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm font-black text-slate-700">
          <span className="rounded-2xl bg-white px-4 py-2 shadow-sm">{niceDate(selectedDate)}</span>
          <span className="rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-700">{records.length} records loaded</span>
          <span className="rounded-2xl bg-violet-50 px-4 py-2 text-violet-700">Click any staff name or bar to open full attendance control</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[230px_repeat(12,90px)] bg-slate-50 text-[11px] font-black uppercase tracking-[.1em] text-slate-500">
            <div className="border-r border-slate-200 p-3">Staff / site</div>{hours.map(h => <div key={h} className="border-r border-slate-200 p-3 text-center">{h}</div>)}
          </div>
          {lanes.map((r, index) => {
            const start = Math.max(0, Math.min(10, Number(t(r.punch_in_at).slice(0,2)) - 7 || index % 6))
            const span = r.punch_out_at ? Math.max(2, Math.min(9, (Number(t(r.punch_out_at).slice(0,2)) || 17) - (Number(t(r.punch_in_at).slice(0,2)) || 8))) : 5
            const tone = /late|review|pending/i.test(r.status) ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100' : /absent|missing/i.test(r.status) ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100'
            return <div key={`${staffKeyOf(r)}-${index}`} className="grid grid-cols-[230px_repeat(12,90px)] border-t border-slate-100 hover:bg-violet-50/30">
              <a href={`#${staffModalId(r)}`} className="group border-r border-slate-100 p-3 transition hover:bg-white">
                <div className="font-black text-violet-700 group-hover:text-violet-900">{r.identity?.name || 'Staff member'}</div>
                <div className="text-xs font-semibold text-slate-500">{r.identity?.department || 'Unmapped department'} · {r.identity?.location || 'No site'}</div>
                <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">open control room →</div>
              </a>
              {hours.map((h, i) => <div key={`${rid(r)}-${h}`} className="relative h-20 border-r border-slate-100 p-1 hover:bg-cyan-50/40">{i === start ? <a href={`#${staffModalId(r)}`} className={`absolute left-1 top-3 z-10 h-12 rounded-2xl border px-3 py-2 text-xs font-black shadow-md transition hover:-translate-y-1 hover:shadow-xl ${tone}`} style={{ width: `${span * 88}px` }}><span className="mr-1">●</span>{t(r.punch_in_at)} - {t(r.punch_out_at)} · {String(r.status || 'synced').replaceAll('_',' ')}</a> : null}</div>)}
            </div>
          })}
          {!lanes.length ? <div className="p-12 text-center"><div className="text-2xl font-black text-slate-900">No attendance rows for {niceDate(selectedDate)}</div><p className="mt-2 font-bold text-slate-500">Use the date selector or create a manual punch/control action.</p><div className="mt-5"><ModalButton href="#manual-punch" tone="purple">Create manual punch</ModalButton></div></div> : null}
        </div>
      </div>
    </Card>
  )
}

function ActionCenter({ exceptions, overtime, unmapped }: { exceptions: Row[]; overtime: Row[]; unmapped: Row[] }) {
  const queues = [
    ['Needs review', exceptions.length, 'Late, missing or pending validation records.', '#exceptions', 'amber'],
    ['Overtime control', overtime.length, 'Extra minutes needing payroll or manager validation.', '#overtime-modal', 'violet'],
    ['Identity mapping', unmapped.length, 'Unmapped punches to connect with real staff profiles.', '/hr/attendance/identity-map', 'rose'],
    ['Corrections', exceptions.slice(0,12).length, 'Manual correction and audit trail requests.', '/hr/attendance/corrections', 'blue'],
  ]
  return <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-black text-slate-950">Execution Control Center</h3><p className="text-sm font-semibold text-slate-500">Every operational queue links to a concrete action.</p></div><Link href="/hr/attendance/actions" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">All actions</Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{queues.map(([title, count, sub, href, tone]) => <a key={title} href={String(href)} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><div className="text-sm font-black text-slate-950">{title}</div><div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-xl font-black text-violet-600">{count}</div></div><p className="mt-2 text-xs font-semibold text-slate-500">{sub}</p></a>)}</div></Card>
}

function DataQuality({ data }: { data: Row }) {
  const sources = data.sourceBreakdown || []
  return <Card className="p-5"><h3 className="text-xl font-black text-slate-950">Sync & Data Quality</h3><p className="mt-1 text-sm font-semibold text-slate-500">Source coverage, identity resolution and reliability score.</p><div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]"><div className="grid place-items-center rounded-[28px] bg-gradient-to-br from-violet-600 to-cyan-500 p-8 text-white shadow-xl shadow-violet-200"><div className="text-5xl font-black">{data.score || 0}%</div><div className="text-xs font-black uppercase tracking-[.2em] opacity-80">quality score</div></div><div className="space-y-3">{sources.slice(0,8).map((s: Row) => <div key={s.table} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between text-sm"><span className="font-black text-slate-800">{s.table}</span><span className="font-black text-violet-600">{s.count}</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(100, Number(s.count || 0))}%` }} /></div></div>)}{!sources.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No live source returned records yet.</div> : null}</div></div></Card>
}

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = searchParams ? await searchParams : {}
  const q = String(params?.q || '').toLowerCase()
  const view = String(params?.view || 'command')
  const selectedDate = String(params?.date || isoToday())
  const data = await getAttendanceEnterpriseData()
  const allRecords = Array.isArray(data.records) ? data.records : []
  const dateRecords = allRecords.filter((r: Row) => d(r.work_date || r.created_at) === selectedDate)
  const sourceRecords = dateRecords.length ? dateRecords : allRecords.filter(isToday)
  const records = q ? sourceRecords.filter((r: Row) => [r.identity?.name, r.identity?.department, r.identity?.location, r.status, r.source_table].join(' ').toLowerCase().includes(q)) : sourceRecords
  const today = records
  const active = records.filter((r: Row) => /present|auto|valid|approved|completed/i.test(String(r.status)))
  const late = records.filter((r: Row) => /late/i.test(String(r.status)) || Number(r.late_minutes || 0) > 0)
  const absent = records.filter((r: Row) => /absent|missing/i.test(String(r.status)))
  const exceptions = Array.isArray(data.exceptions) ? data.exceptions : []
  const overtime = Array.isArray(data.overtime) ? data.overtime : []
  const unmapped = Array.isArray(data.unmapped) ? data.unmapped : []
  const depts = Array.from((data.departments || new Map()).entries()).map(([name, d]: any) => ({ name, ...d }))

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
        <div className="flex">
          <HrSidebar />
          <main className="min-w-0 flex-1 p-5 lg:p-7">
            <div className="sticky top-[82px] z-30 mb-6 rounded-[30px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,.08)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[.25em] text-violet-500">Angelcare attendance command</p><h1 className="mt-1 text-3xl font-black text-slate-950">Attendance Operations Center</h1><p className="text-sm font-semibold text-slate-500">Live monitoring, correction control, payroll readiness, identity mapping and site coverage.</p></div>
                <form className="flex flex-wrap gap-2"><input type="hidden" name="date" value={selectedDate} /><input name="q" defaultValue={q} placeholder="Search staff, city, team, status..." className="h-12 w-[340px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm outline-none focus:border-violet-300" /><button className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">Search</button><ModalButton href="#manual-punch" tone="purple">+ Add punch</ModalButton><ModalButton href="#bulk-action">Bulk control</ModalButton></form>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{['command','live','exceptions','payroll','sites','quality'].map(v => <Link key={v} href={`/hr/attendance?date=${selectedDate}&view=${v}`} className={`rounded-2xl px-4 py-2 text-sm font-black capitalize ${view === v ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-100 text-slate-600 hover:bg-white'}`}>{v}</Link>)}</div>
            </div>

            <HRRealtimeSyncPanel domain="attendance" title="Attendance realtime sync" compact />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <Metric label="Records" value={records.length} sub="Synced attendance rows" icon="▤" />
              <Metric label="Active" value={active.length} sub={`${pct(active.length, records.length)}% present/complete`} icon="✓" tone="green" />
              <Metric label="Late" value={late.length} sub="Delay signals" icon="◷" tone="amber" />
              <Metric label="Absent" value={absent.length} sub="Missing/absent signals" icon="!" tone="rose" />
              <Metric label="Overtime" value={overtime.length} sub="Payroll review queue" icon="✦" tone="blue" />
              <Metric label="Quality" value={`${data.score || 0}%`} sub="Identity + exception score" icon="◈" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
              <ShiftGrid records={records} selectedDate={selectedDate} />
              <div className="space-y-5">
                <ActionCenter exceptions={exceptions} overtime={overtime} unmapped={unmapped} />
                <Card className="p-5"><h3 className="text-xl font-black text-slate-950">Coverage by Department</h3><div className="mt-4 space-y-3">{depts.slice(0,8).map((d) => <div key={d.name} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between text-sm"><span className="font-black">{d.name}</span><span className="font-black text-violet-600">{pct(d.present, d.total)}%</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-violet-500" style={{ width: `${pct(d.present, d.total)}%` }} /></div><div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-black text-slate-500"><span>Total {d.total}</span><span>Present {d.present}</span><span>Late {d.late}</span><span>Absent {d.absent}</span></div></div>)}</div></Card>
              </div>
            </div>

            <div id="exceptions" className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-xl font-black">Exception Queue</h3><p className="text-sm font-semibold text-slate-500">Review, approve, correct or create HR follow-up.</p></div><Link href="/hr/attendance/corrections" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black">Corrections center</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500"><tr><th className="p-4">Date</th><th>Staff</th><th>Department</th><th>Status</th><th>Source</th><th>Actions</th></tr></thead><tbody>{exceptions.slice(0,18).map((r: Row, i: number) => <tr key={`${staffKeyOf(r)}-${r.id || i}`} className="border-t border-slate-100"><td className="p-4 font-bold">{d(r.work_date)}</td><td><a href={`#${staffModalId(r)}`} className="font-black text-slate-950 hover:text-violet-600">{r.identity?.name}</a></td><td className="font-semibold text-slate-500">{r.identity?.department}</td><td><Status value={r.status} /></td><td className="text-xs font-bold text-slate-500">{r.source_table}</td><td><div className="flex gap-2"><form action={approveAttendanceAction.bind(null, String(r.id || ''))}><button className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button></form><form action={markReviewAttendanceAction.bind(null, String(r.id || ''))}><button className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700">Review</button></form><a href="#create-action" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">Action</a></div></td></tr>)}</tbody></table>{!exceptions.length ? <div className="p-10 text-center font-bold text-slate-500">No exceptions in the current sync.</div> : null}</div></Card>
              <DataQuality data={data as Row} />
            </div>

            <Card className="mt-5 p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-black">Operational Command Modules</h3><p className="text-sm font-semibold text-slate-500">Fast access to every attendance execution layer.</p></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{[
              ['/hr/attendance/actions','Actions','Create and track HR attendance actions.'],['/hr/attendance/corrections','Corrections','Fix punch errors with audit trail.'],['/hr/attendance/identity-map','Identity Map','Resolve unmapped staff signals.'],['/hr/attendance/readiness','Payroll Readiness','Validate overtime and payroll export.'],['/hr/work-schedules','Work Schedules','Shift templates and site coverage.'],
            ].map(([href,title,sub]) => <Link key={href} href={href} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="text-lg font-black text-slate-950">{title}</div><p className="mt-2 text-sm font-semibold text-slate-500">{sub}</p><div className="mt-4 text-sm font-black text-violet-600">Open →</div></Link>)}</div></Card>
          </main>
        </div>

        {uniqueByStaff(records).slice(0,80).map((r: Row) => {
          const staffKey = String(r.identity?.staff_id || r.identity?.user_id || r.identity?.name || r.id)
          const allStaffHistory = allRecords.filter((x: Row) => staffKeyOf(x) === staffKey)
          const history = allStaffHistory.sort((a: Row, b: Row) => String(b.work_date || b.created_at || '').localeCompare(String(a.work_date || a.created_at || ''))).slice(0, 30)
          const monthFrom = monthStart(selectedDate)
          const monthTo = monthEnd(selectedDate)
          const monthMinutes = monthWorkedMinutes(allStaffHistory, monthFrom, monthTo)
          const monthDays = activeDays(allStaffHistory, monthFrom, monthTo)
          const staffLate = allStaffHistory.filter((x: Row) => /late/i.test(String(x.status)) || Number(x.late_minutes || 0) > 0).length
          const staffAbsent = allStaffHistory.filter((x: Row) => /absent|missing/i.test(String(x.status))).length
          const staffOvertime = allStaffHistory.reduce((sum: number, x: Row) => sum + Number(x.overtime_minutes || 0), 0)
          return <ModalShell key={`modal-${encodeURIComponent(staffKeyOf(r))}`} id={staffModalId(r)} title={`${r.identity?.name || 'Staff'} attendance control room`} subtitle="Full attendance view, live validation, historical trace, payroll impact and follow-up execution.">
            <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <div className="space-y-5">
                <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-2xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.32em] text-cyan-200">Staff attendance passport</p>
                      <h3 className="mt-2 text-3xl font-black">{r.identity?.name || 'Staff member'}</h3>
                      <p className="mt-1 text-sm font-bold text-white/70">{r.identity?.department || 'Unmapped department'} · {r.identity?.location || 'No site'} · {d(r.work_date)}</p>
                    </div>
                    <Status value={r.status} />
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-5">
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><p className="text-xs font-black uppercase text-white/50">Month hours</p><p className="mt-1 text-2xl font-black">{minsLabel(monthMinutes)}</p></div>
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><p className="text-xs font-black uppercase text-white/50">Punch in</p><p className="mt-1 text-2xl font-black">{t(r.punch_in_at)}</p></div>
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><p className="text-xs font-black uppercase text-white/50">Punch out</p><p className="mt-1 text-2xl font-black">{t(r.punch_out_at)}</p></div>
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><p className="text-xs font-black uppercase text-white/50">Late</p><p className="mt-1 text-2xl font-black">{r.late_minutes || 0}m</p></div>
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><p className="text-xs font-black uppercase text-white/50">Overtime</p><p className="mt-1 text-2xl font-black">{r.overtime_minutes || 0}m</p></div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <Metric label="History rows" value={history.length} sub={`Loaded for staff · ${monthDays} active days this month`} icon="▤" />
                  <Metric label="Month hours" value={minsLabel(monthMinutes)} sub="Actual selected month" icon="⏱" tone="green" />
                  <Metric label="Late signals" value={staffLate} sub="Historical delays" icon="◷" tone="amber" />
                  <Metric label="Absences" value={staffAbsent} sub="Missing/absent" icon="!" tone="rose" />
                  <Metric label="Overtime" value={minsLabel(staffOvertime)} sub="Payroll impact" icon="✦" tone="blue" />
                </div>
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black text-slate-950">Attendance history explorer</h3><p className="mt-1 text-sm font-semibold text-slate-500">Target a specific period, audit rows and open a printable detailed report.</p></div><span className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">period-ready audit</span></div>
                  <form action="/hr/attendance/report" className="mt-4 grid gap-3 rounded-[24px] border border-slate-100 bg-slate-50 p-4 md:grid-cols-5">
                    <input type="hidden" name="staff" value={staffKey} />
                    <label className="text-xs font-black uppercase tracking-[.15em] text-slate-500">From<input type="date" name="from" defaultValue={monthStart(selectedDate)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none" /></label>
                    <label className="text-xs font-black uppercase tracking-[.15em] text-slate-500">To<input type="date" name="to" defaultValue={monthEnd(selectedDate)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none" /></label>
                    <label className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Scope<select name="scope" defaultValue="staff" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none"><option value="staff">Selected staff</option><option value="department">Department</option><option value="all">All staff</option></select></label>
                    <label className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Format<select name="format" defaultValue="pdf" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none"><option value="pdf">PDF-ready</option><option value="audit">Audit view</option></select></label>
                    <button className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100">Open report table</button>
                  </form>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500"><tr><th className="p-3">Date</th><th>Status</th><th>In</th><th>Out</th><th>Late</th><th>Overtime</th><th>Source</th></tr></thead>
                      <tbody>{history.map((h: Row, i: number) => <tr key={`${h.id || staffKey}-${i}`} className="border-t border-slate-100"><td className="p-3 font-black">{d(h.work_date || h.created_at)}</td><td><Status value={h.status} /></td><td className="font-bold">{t(h.punch_in_at)}</td><td className="font-bold">{t(h.punch_out_at)}</td><td className="font-bold">{h.late_minutes || 0}m</td><td className="font-bold">{h.overtime_minutes || 0}m</td><td className="text-xs font-bold text-slate-500">{h.source_table || 'synced'}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black">Live controls</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Approve, review, create correction and route payroll action.</p>
                  <div className="mt-4 grid gap-2">
                    <form action={approveAttendanceAction.bind(null, String(r.id || ''))}><button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100">Approve record live</button></form>
                    <form action={markReviewAttendanceAction.bind(null, String(r.id || ''))}><button className="w-full rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-700">Mark for manager review</button></form>
                    <Link className="block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white" href={`/hr/attendance/staff/${encodeURIComponent(staffKey)}`}>Open staff profile</Link>
                    <Link className="block rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-center text-sm font-black text-white" href={`/hr/attendance/report?staff=${encodeURIComponent(staffKey)}&from=${monthStart(selectedDate)}&to=${monthEnd(selectedDate)}&scope=staff`}>Generate monthly PDF report</Link>
                  </div>
                </div>
                <form action={createAttendanceAction} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <input type="hidden" name="attendance_id" value={String(r.id || '')} />
                  <input type="hidden" name="staff_id" value={String(r.identity?.staff_id || staffKey || '')} />
                  <h3 className="text-lg font-black">Create follow-up action</h3>
                  <select name="action_type" className="mt-4 w-full rounded-2xl border border-slate-200 p-3 font-bold"><option value="correction">Correction request</option><option value="manager_review">Manager review</option><option value="payroll_validation">Payroll validation</option><option value="identity_mapping">Identity mapping</option><option value="absence_justification">Absence justification</option></select>
                  <select name="priority" className="mt-3 w-full rounded-2xl border border-slate-200 p-3 font-bold"><option>normal</option><option>high</option><option>urgent</option></select>
                  <textarea name="notes" rows={6} placeholder="Decision, evidence, correction needed, manager instruction, payroll impact..." className="mt-3 w-full rounded-2xl border border-slate-200 p-3 font-bold" />
                  <button className="mt-3 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 font-black text-white shadow-lg shadow-violet-100">Save action live</button>
                </form>
                <div className="rounded-[30px] border border-violet-100 bg-violet-50 p-5">
                  <h3 className="text-lg font-black text-violet-950">Operational notes</h3>
                  <p className="mt-2 text-sm font-semibold text-violet-700">This control room is linked to the selected date board. Use previous/next/date picker to change the active agenda, then open any employee for their full historical attendance view.</p>
                </div>
              </div>
            </div>
          </ModalShell>
        })}

        <ModalShell id="manual-punch" title="Manual punch creation" subtitle="Create a controlled manual attendance record or route it to corrections when direct creation is restricted."><form action={createAttendanceAction} className="grid gap-4 lg:grid-cols-3"><input name="staff_id" placeholder="Staff ID / employee profile" className="rounded-2xl border border-slate-200 p-4 font-bold" /><input name="action_type" defaultValue="manual_punch" className="rounded-2xl border border-slate-200 p-4 font-bold" /><select name="priority" className="rounded-2xl border border-slate-200 p-4 font-bold"><option>normal</option><option>high</option><option>urgent</option></select><textarea name="notes" rows={6} placeholder="Punch date, time in/out, reason, manager approval, evidence..." className="rounded-2xl border border-slate-200 p-4 font-bold lg:col-span-3" /><button className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 p-4 font-black text-white lg:col-span-3">Create controlled action</button></form></ModalShell>
        <ModalShell id="bulk-action" title="Bulk attendance control" subtitle="Launch batch review for late, absent, overtime, unmapped or payroll blocked records."><form action={createAttendanceAction} className="grid gap-4 lg:grid-cols-2"><select name="action_type" className="rounded-2xl border border-slate-200 p-4 font-bold"><option value="bulk_review">Bulk review</option><option value="bulk_payroll_validation">Bulk payroll validation</option><option value="bulk_correction">Bulk correction</option><option value="bulk_identity_mapping">Bulk identity mapping</option></select><select name="priority" className="rounded-2xl border border-slate-200 p-4 font-bold"><option>normal</option><option>high</option><option>urgent</option></select><textarea name="notes" rows={6} placeholder="Scope, filters, department, period, owner, decision notes..." className="rounded-2xl border border-slate-200 p-4 font-bold lg:col-span-2" /><button className="rounded-2xl bg-slate-950 p-4 font-black text-white lg:col-span-2">Launch bulk control</button></form></ModalShell>
        <ModalShell id="create-action" title="Attendance action creator" subtitle="Create a production action linked to the attendance operations queue."><form action={createAttendanceAction} className="grid gap-4 lg:grid-cols-2"><input name="attendance_id" placeholder="Attendance record ID if known" className="rounded-2xl border border-slate-200 p-4 font-bold" /><input name="staff_id" placeholder="Staff ID if known" className="rounded-2xl border border-slate-200 p-4 font-bold" /><select name="action_type" className="rounded-2xl border border-slate-200 p-4 font-bold"><option value="review">Review</option><option value="correction">Correction</option><option value="payroll_validation">Payroll validation</option><option value="manager_escalation">Manager escalation</option></select><select name="priority" className="rounded-2xl border border-slate-200 p-4 font-bold"><option>normal</option><option>high</option><option>urgent</option></select><textarea name="notes" rows={6} placeholder="Action notes..." className="rounded-2xl border border-slate-200 p-4 font-bold lg:col-span-2" /><button className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 p-4 font-black text-white lg:col-span-2">Save action</button></form></ModalShell>
    </div>
  )
}
