import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileBadge2,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Home,
  LayoutDashboard,
  MapPinned,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCheck,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react'
import { createHrRecord, advanceHrStatus } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

const sidebarGroups = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
    { label: 'Analytics', href: '/hr/analytics', icon: BarChart3 },
    { label: 'Reports', href: '/hr/reports', icon: FileText },
    { label: 'Alerts', href: '/hr/notifications', icon: Bell },
  ]},
  { label: 'People', items: [
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Organization', href: '/hr/departments', icon: Network },
    { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Positions & Roles', href: '/hr/positions', icon: BriefcaseBusiness },
    { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
    { label: 'Onboarding', href: '/hr/onboarding', icon: ClipboardCheck },
    { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
    { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap },
  ]},
  { label: 'Operations', items: [
    { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
    { label: 'Leave Management', href: '/hr/approvals', icon: Clock3 },
    { label: 'Work Schedules', href: '/hr/rosters', icon: Workflow },
    { label: 'Time Tracking', href: '/hr/workforce-ops', icon: Activity },
    { label: 'Overtime & Approvals', href: '/hr/approvals', icon: CheckCircle2 },
  ]},
  { label: 'Compensation & Benefits', items: [
    { label: 'Payroll', href: '/hr/payroll', icon: WalletCards },
    { label: 'Compensation', href: '/hr/compensation', icon: BadgeCheck },
    { label: 'Benefits & Insurance', href: '/hr/benefits', icon: ShieldCheck },
  ]},
  { label: 'Compliance & Documents', items: [
    { label: 'Policies & Procedures', href: '/hr/templates', icon: ShieldCheck },
    { label: 'Documents', href: '/hr/documents', icon: FileBadge2 },
    { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
  ]},
  { label: 'System', items: [
    { label: 'Integrations', href: '/hr/sync-center', icon: Sparkles },
    { label: 'Settings', href: '/hr/settings', icon: Settings },
    { label: 'Access & Permissions', href: '/hr/permissions', icon: ShieldCheck },
  ]},
] as const

const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired'] as const
const stageLabel: Record<string, string> = { applied: 'Applied', new: 'Applied', screening: 'Screening', interview: 'Interview', assessment: 'Assessment', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', on_hold: 'On Hold', pending: 'Pending' }

function text(row: Row, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== null && value !== undefined && String(value).trim()) return String(value)
  }
  return fallback
}
function num(row: Row, keys: string[], fallback = 0) {
  const raw = text(row, keys, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
function normalizeStage(candidate: Row) {
  const s = text(candidate, ['pipeline_stage', 'stage', 'status', 'decision'], 'applied').toLowerCase().replace(/\s+/g, '_')
  if (s === 'new') return 'applied'
  return s
}
function pct(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0 }
function dateText(value: any) {
  if (!value) return '—'
  try { return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value)) } catch { return String(value) }
}
function cityOf(row: Row) { return text(row, ['city', 'location', 'work_city'], 'Morocco') }
function sourceOf(row: Row) { return text(row, ['source', 'candidate_source', 'channel'], 'manual') }
function positionOf(row: Row) { return text(row, ['desired_position', 'job_title', 'position', 'title'], 'Open role') }
function toneByStage(stage: string) {
  const s = stage.toLowerCase()
  if (s.includes('hired')) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (s.includes('reject')) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (s.includes('hold')) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (s.includes('interview') || s.includes('assessment')) return 'border-violet-200 bg-violet-50 text-violet-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}
function initials(name: string) { return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'AC' }

function Sidebar() {
  return <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/95 px-5 py-6 shadow-[20px_0_60px_rgba(15,23,42,0.04)] backdrop-blur xl:block">
    <div className="mb-6 flex items-center gap-3 px-2">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200"><Sparkles className="h-5 w-5" /></div>
      <div><p className="text-sm font-black text-slate-950">Angelcare HR</p><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Morocco ops</p></div>
    </div>
    <div className="space-y-6">
      {sidebarGroups.map((group) => <div key={group.label}>
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</p>
        <div className="space-y-1">
          {group.items.map((item) => {
            const active = item.href === '/hr/recruitment'
            const Icon = item.icon
            return <Link key={`${group.label}-${item.label}`} href={item.href} className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition ${active ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-500'}`} />
              <span>{item.label}</span>
            </Link>
          })}
        </div>
      </div>)}
    </div>
    <div className="mt-8 rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-violet-700"><Sparkles className="h-4 w-4" /> Angel AI Recruiting</div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Pipeline intelligence, conversion risk, interviews and hiring execution in one synced workspace.</p>
      <Link href="/hr/sync-center" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-sm ring-1 ring-violet-100">Check sync <ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </div>
  </aside>
}
function MetricCard({ icon: Icon, title, value, delta, danger }: any) {
  return <div className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70">
    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-100/70 blur-2xl" />
    <div className="relative flex items-center gap-4">
      <div className="grid h-14 w-14 place-items-center rounded-[22px] bg-gradient-to-br from-violet-50 to-cyan-50 text-violet-600 ring-1 ring-violet-100"><Icon className="h-6 w-6" /></div>
      <div><p className="text-xs font-black text-slate-400">{title}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className={`mt-1 text-xs font-black ${danger ? 'text-rose-500' : 'text-emerald-600'}`}>{delta}</p></div>
    </div>
  </div>
}
function Card({ title, subtitle, action, children, className = '' }: any) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-base font-black text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>}</div>{action}</div>
    {children}
  </section>
}
function Pill({ children, className = '' }: any) { return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${className}`}>{children}</span> }
function Progress({ value, className = '' }: { value: number; className?: string }) { return <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 ${className}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></div> }
function Input({ name, placeholder, type = 'text', required = false }: any) { return <input name={name} type={type} required={required} placeholder={placeholder} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-300 focus:ring-4 focus:ring-violet-100" /> }
function Select({ name, children }: any) { return <select name={name} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100">{children}</select> }

function MoroccoRecruitmentMap({ locations }: { locations: { city: string; count: number }[] }) {
  const max = Math.max(1, ...locations.map((x) => x.count))
  const points: Record<string, { x: number; y: number }> = { Casablanca: { x: 42, y: 54 }, Rabat: { x: 45, y: 41 }, Tanger: { x: 48, y: 20 }, Fes: { x: 62, y: 38 }, Marrakech: { x: 52, y: 66 }, Agadir: { x: 35, y: 79 }, Oujda: { x: 76, y: 39 }, Remote: { x: 68, y: 68 } }
  return <div className="relative h-[280px] overflow-hidden rounded-[26px] bg-gradient-to-br from-violet-50 via-white to-cyan-50 ring-1 ring-violet-100">
    <svg viewBox="0 0 420 300" className="absolute inset-0 h-full w-full">
      <path d="M201 17 L226 31 L245 57 L266 73 L299 84 L317 112 L307 142 L331 174 L316 204 L277 218 L258 247 L215 261 L178 247 L154 225 L132 206 L105 178 L89 151 L104 121 L132 93 L153 68 L174 44 Z" fill="rgb(237 233 254)" stroke="rgb(196 181 253)" strokeWidth="2" />
      <path d="M205 37 L223 67 L211 98 L226 127 L206 160 L219 194 L199 226" fill="none" stroke="rgb(196 181 253)" strokeWidth="1.2" strokeDasharray="5 5" />
      <path d="M145 96 L183 111 L225 127 L276 123" fill="none" stroke="rgb(196 181 253)" strokeWidth="1" />
      <path d="M114 169 L160 173 L206 160 L279 181" fill="none" stroke="rgb(196 181 253)" strokeWidth="1" />
    </svg>
    {locations.slice(0, 8).map((loc) => {
      const p = points[loc.city] || points.Casablanca
      const size = 22 + Math.round((loc.count / max) * 18)
      return <div key={loc.city} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
        <div className="relative grid place-items-center rounded-full bg-violet-600 text-[11px] font-black text-white shadow-xl shadow-violet-300" style={{ width: size, height: size }}>
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/40" />
          <span className="relative">{loc.count}</span>
        </div>
        <div className="mt-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-violet-700 shadow-sm ring-1 ring-violet-100">{loc.city}</div>
      </div>
    })}
  </div>
}

export default async function Page() {
  const data = await getHRDashboardData()
  const candidates: Row[] = data.candidates || []
  const openings: Row[] = data.openings || []
  const hired = candidates.filter((c) => normalizeStage(c) === 'hired' || text(c, ['decision'], '').toLowerCase() === 'hired')
  const inProgress = candidates.filter((c) => ['screening', 'interview', 'assessment', 'offer'].includes(normalizeStage(c)))
  const openReqs = openings.filter((x) => text(x, ['status'], 'open').toLowerCase() === 'open')
  const totalReqs = openings.length
  const acceptanceRate = candidates.length ? Math.round((hired.length / Math.max(1, candidates.filter((c) => ['offer','hired'].includes(normalizeStage(c)) || text(c, ['decision'], '').toLowerCase() === 'hired').length)) * 100) : 0
  const avgTime = Math.max(1, Math.round((openReqs.reduce((sum, x) => sum + num(x, ['days_open'], 18), 0) || 24) / Math.max(1, openReqs.length || 1)))
  const stageCounts = stages.map((s) => ({ stage: s, count: candidates.filter((c) => normalizeStage(c) === s || (s === 'applied' && normalizeStage(c) === 'new')).length }))
  const topStage = Math.max(1, ...stageCounts.map((x) => x.count))
  const sources = Array.from(candidates.reduce((map, c) => map.set(sourceOf(c), (map.get(sourceOf(c)) || 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const locations = Array.from([...candidates, ...openings].reduce((map, r) => map.set(cityOf(r), (map.get(cityOf(r)) || 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count }))
  const recent = [...candidates].sort((a, b) => String(b.created_at || b.applied_on || '').localeCompare(String(a.created_at || a.applied_on || ''))).slice(0, 7)
  const interviews = candidates.filter((c) => text(c, ['interview_date'], '') !== '').slice(0, 5)
  const conversion = pct(hired.length, Math.max(1, candidates.length))

  return <div className="min-h-screen bg-[#f8f9ff] text-slate-900">
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Recruitment</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Manage candidates, requisitions, interviews and hiring conversion from your live HR database.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 min-w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><span className="text-xs font-bold text-slate-400">Search candidates, jobs, skills, departments...</span><kbd className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-400">⌘K</kbd></div>
              <Link href="/hr/recruitment/candidates" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Candidates</Link>
              <Link href="/hr/recruitment/kanban" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Pipeline</Link>
              <a href="#create" className="rounded-2xl bg-violet-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-200"><Plus className="mr-1 inline h-4 w-4" /> Create</a>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={BriefcaseBusiness} title="Total Requisitions" value={totalReqs} delta="Live from openings" />
            <MetricCard icon={ClipboardCheck} title="Open Requisitions" value={openReqs.length} delta="Ready to hire" />
            <MetricCard icon={Users} title="Total Candidates" value={candidates.length} delta="Synced candidates" />
            <MetricCard icon={UserCheck} title="In Progress" value={inProgress.length} delta="Active pipeline" />
            <MetricCard icon={BadgeCheck} title="Hired This Month" value={hired.length} delta="Converted profiles" />
            <MetricCard icon={Clock3} title="Avg. Time to Hire" value={`${avgTime} Days`} delta="Based on requisitions" danger={avgTime > 30} />
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            <Card title="Recruitment Pipeline" subtitle="Stage conversion using existing candidates." action={<Link href="/hr/recruitment/kanban" className="text-xs font-black text-violet-600">View full pipeline →</Link>}>
              <div className="space-y-3">
                {stageCounts.map((s, i) => <div key={s.stage} className="grid grid-cols-[92px_1fr_64px] items-center gap-3 text-xs font-black">
                  <span className="text-slate-500">{stageLabel[s.stage]}</span>
                  <div className="relative h-9 overflow-hidden rounded-xl bg-slate-50"><div className="h-full rounded-xl bg-gradient-to-r from-violet-300 via-violet-500 to-indigo-700" style={{ width: `${Math.max(10, (s.count / topStage) * 100)}%`, opacity: 1 - i * 0.07 }} /><span className="absolute inset-0 grid place-items-center text-white drop-shadow">{s.count}</span></div>
                  <span className="text-right text-slate-400">{pct(s.count, Math.max(1, candidates.length))}%</span>
                </div>)}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs font-bold text-slate-400">Overall Conversion Rate</p><p className="text-2xl font-black text-slate-950">{conversion}%</p></div><div><p className="text-xs font-bold text-slate-400">Total Drop-off</p><p className="text-2xl font-black text-rose-500">{Math.max(0, candidates.length - hired.length)}</p></div></div>
            </Card>

            <Card title="Candidates Overview" subtitle="Live candidate status distribution." action={<Link href="/hr/recruitment/candidates" className="text-xs font-black text-violet-600">View candidates →</Link>}>
              <div className="flex items-center justify-center gap-8">
                <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(from_90deg,#7c3aed_0_32%,#2563eb_32%_76%,#a78bfa_76%_86%,#f43f5e_86%_94%,#22c55e_94%_100%)] p-5 shadow-inner"><div className="grid h-full w-full place-items-center rounded-full bg-white text-center"><div><p className="text-3xl font-black text-slate-950">{candidates.length}</p><p className="text-xs font-black text-slate-400">Total</p></div></div></div>
                <div className="space-y-3 text-xs font-black">{['applied','screening','interview','offer','hired'].map((s) => { const count = stageCounts.find((x) => x.stage === s)?.count || 0; return <div key={s} className="flex min-w-40 items-center justify-between gap-5"><span className="text-slate-500">{stageLabel[s]}</span><span>{count} ({pct(count, Math.max(1, candidates.length))}%)</span></div> })}</div>
              </div>
            </Card>

            <Card title="Candidates by Source" subtitle="Acquisition channels from real candidate records." action={<Link href="/hr/recruitment/sources" className="text-xs font-black text-violet-600">View source report →</Link>}>
              <div className="space-y-4">{(sources.length ? sources : [['manual',0]]).map(([source, count]) => <div key={source} className="grid grid-cols-[110px_1fr_72px] items-center gap-3 text-xs font-black"><span className="capitalize text-slate-500">{source}</span><Progress value={pct(count, Math.max(1, candidates.length))} /><span className="text-right text-slate-500">{pct(count, Math.max(1, candidates.length))}% ({count})</span></div>)}</div>
            </Card>

            <Card title="Requisitions by Location" subtitle="Morocco hiring density." action={<a href="#locations" className="text-xs font-black text-violet-600">View all locations →</a>}>
              <MoroccoRecruitmentMap locations={locations.length ? locations : [{ city: 'Casablanca', count: 1 }, { city: 'Rabat', count: 1 }]} />
            </Card>
          </div>

          <div id="create" className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Card title="Open Requisitions" subtitle="Create and monitor live job openings." action={<details className="relative"><summary className="cursor-pointer list-none rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-200"><Plus className="mr-1 inline h-4 w-4" /> Create Requisition</summary><div className="absolute right-0 top-12 z-20 w-[720px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"><form action={createHrRecord} className="grid gap-3 md:grid-cols-2"><input type="hidden" name="_table" value={HR_TABLES.openings} /><input type="hidden" name="_redirect" value="/hr/recruitment" /><Input name="title" required placeholder="Job title" /><Input name="department" placeholder="Department" /><Input name="city" placeholder="City" /><Input name="openings_count" type="number" placeholder="Openings count" /><Select name="status"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="on_hold">On Hold</option><option value="closed">Closed</option></Select><Select name="hiring_priority"><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></Select><Input name="required_skills" placeholder="Required skills" /><Input name="target_start_date" type="date" placeholder="Target start date" /><button className="md:col-span-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Save live requisition</button></form></div></details>}>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{['Job Title','Department','Location','Applicants','Status','Actions'].map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{openings.slice(0, 8).map((job) => <tr key={text(job, ['id', 'title'])} className="bg-white font-bold text-slate-600"><td className="px-4 py-3 font-black text-slate-950">{text(job, ['title','position','job_title'])}</td><td className="px-4 py-3">{text(job, ['department'])}</td><td className="px-4 py-3">{cityOf(job)}</td><td className="px-4 py-3">{candidates.filter((c) => text(c, ['job_id'], '') === text(job, ['id'], 'x') || positionOf(c) === text(job, ['title','position','job_title'])).length}</td><td className="px-4 py-3"><Pill className={toneByStage(text(job, ['status'], 'open'))}>{text(job, ['status'], 'open')}</Pill></td><td className="px-4 py-3"><Link href="/hr/openings" className="font-black text-violet-600">Open</Link></td></tr>)}{openings.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center font-bold text-slate-400">No live requisitions yet. Create one above.</td></tr>}</tbody></table>
              </div>
            </Card>

            <Card title="Upcoming Interviews" subtitle="Live interview dates from candidates." action={<Link href="/hr/recruitment/interviews" className="text-xs font-black text-violet-600">View all</Link>}>
              <div className="space-y-3">{interviews.length ? interviews.map((c) => <div key={text(c, ['id', 'full_name'])} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xs font-black text-violet-600 ring-1 ring-violet-100">{dateText(text(c, ['interview_date'])).split(' ').slice(0,2).join(' ')}</div><div><p className="text-sm font-black text-slate-950">{text(c, ['full_name'])}</p><p className="text-xs font-bold text-slate-500">{positionOf(c)}</p></div></div><Pill className="border-violet-200 bg-violet-50 text-violet-700">Interview</Pill></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">No interview dates found in the synced candidate records.</p>}</div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card title="Recent Candidates" subtitle="Real candidates with direct actions." action={<details className="relative"><summary className="cursor-pointer list-none rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white"><Plus className="mr-1 inline h-4 w-4" /> Add Candidate</summary><div className="absolute right-0 top-12 z-20 w-[720px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"><form action={createHrRecord} className="grid gap-3 md:grid-cols-2"><input type="hidden" name="_table" value={HR_TABLES.candidates} /><input type="hidden" name="_redirect" value="/hr/recruitment" /><Input name="full_name" required placeholder="Candidate full name" /><Input name="email" placeholder="Email" /><Input name="phone" placeholder="Phone" /><Input name="city" placeholder="City" /><Input name="desired_position" placeholder="Desired position" /><Select name="source"><option value="linkedin">LinkedIn</option><option value="website">Website</option><option value="referral">Referral</option><option value="indeed">Indeed</option><option value="manual">Manual</option></Select><Select name="pipeline_stage"><option value="applied">Applied</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="assessment">Assessment</option><option value="offer">Offer</option><option value="hired">Hired</option></Select><Input name="score" type="number" placeholder="Score / rating" /><Input name="interview_date" type="datetime-local" placeholder="Interview date" /><Input name="notes" placeholder="Notes" /><button className="md:col-span-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Save live candidate</button></form></div></details>}>
              <div className="overflow-hidden rounded-2xl border border-slate-100"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{['Candidate','Job Title','Stage','Source','Rating','Actions'].map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{recent.map((c) => { const stage = normalizeStage(c); const id = text(c, ['id'], ''); return <tr key={id || text(c, ['full_name'])} className="bg-white font-bold text-slate-600"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 text-[11px] font-black text-violet-700">{initials(text(c, ['full_name']))}</div><div><p className="font-black text-slate-950">{text(c, ['full_name'])}</p><p className="text-[11px] text-slate-400">{cityOf(c)}</p></div></div></td><td className="px-4 py-3">{positionOf(c)}</td><td className="px-4 py-3"><Pill className={toneByStage(stage)}>{stageLabel[stage] || stage}</Pill></td><td className="px-4 py-3 capitalize">{sourceOf(c)}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-0.5 text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.min(5, Math.round(num(c, ['score','rating'], 4))) ? 'fill-current' : ''}`} />)}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={id ? `/hr/recruitment/candidates/${id}` : '/hr/recruitment/candidates'} className="font-black text-violet-600">Open</Link>{id && stage !== 'hired' && <form action={advanceHrStatus}><input type="hidden" name="_table" value={HR_TABLES.candidates} /><input type="hidden" name="_redirect" value="/hr/recruitment" /><input type="hidden" name="_id" value={id} /><input type="hidden" name="_field" value="pipeline_stage" /><input type="hidden" name="status" value={stage === 'offer' ? 'hired' : stage === 'assessment' ? 'offer' : stage === 'interview' ? 'assessment' : stage === 'screening' ? 'interview' : 'screening'} /><button className="font-black text-emerald-600">Advance</button></form>}</div></td></tr> })}{recent.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center font-bold text-slate-400">No candidates found. Add the first live candidate.</td></tr>}</tbody></table></div>
            </Card>

            <div className="space-y-6">
              <Card title="Candidate Status" subtitle="Synced pipeline health.">
                <div className="grid grid-cols-[150px_1fr] items-center gap-6"><div className="grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(from_90deg,#7c3aed_0_40%,#2563eb_40%_76%,#a78bfa_76%_88%,#f43f5e_88%_94%,#22c55e_94%_100%)] p-4"><div className="grid h-full w-full place-items-center rounded-full bg-white text-center"><div><p className="text-2xl font-black">{candidates.length}</p><p className="text-xs font-black text-slate-400">Total</p></div></div></div><div className="space-y-3">{stageCounts.map((s) => <div key={s.stage} className="flex justify-between text-xs font-black"><span className="text-slate-500">{stageLabel[s.stage]}</span><span>{s.count} ({pct(s.count, Math.max(1, candidates.length))}%)</span></div>)}</div></div>
              </Card>
              <Card title="Tasks & Reminders" subtitle="Execution prompts based on live pipeline." action={<Link href="/hr/tasks" className="text-xs font-black text-violet-600">View all</Link>}>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-sm"><b className="text-rose-700">Review {stageCounts.find((x) => x.stage === 'applied')?.count || 0} new applications</b><p className="text-xs font-bold text-rose-500">Due today</p></div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm"><b className="text-blue-700">Schedule interviews for {stageCounts.find((x) => x.stage === 'screening')?.count || 0} screened candidates</b><p className="text-xs font-bold text-blue-500">Due tomorrow</p></div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm"><b className="text-amber-700">Follow up with hiring managers</b><p className="text-xs font-bold text-amber-500">Keep requisitions moving</p></div>
                </div>
              </Card>
            </div>
          </div>

          <Card id="locations" title="Recruitment Control Center" subtitle="Every action here writes through existing HR server actions and refreshes the live recruitment workspace.">
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/hr/recruitment/candidates" className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><Users className="mb-3 h-6 w-6 text-violet-600" /> Full candidate directory</Link>
              <Link href="/hr/recruitment/interviews" className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><CalendarCheck className="mb-3 h-6 w-6 text-violet-600" /> Interview calendar</Link>
              <Link href="/hr/recruitment/sources" className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><Target className="mb-3 h-6 w-6 text-violet-600" /> Source analytics</Link>
              <Link href="/hr/sync-center" className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><Filter className="mb-3 h-6 w-6 text-violet-600" /> Sync diagnostics</Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  </div>
}
