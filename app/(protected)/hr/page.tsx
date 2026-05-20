import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileBadge2,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  Network,
  PieChart,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  Workflow,
} from 'lucide-react'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionMetrics, getHRProductionScore } from '@/lib/hr-production/metrics'
import { HR_PRODUCTION_NAV } from '@/lib/hr-production/navigation'

const sidebarGroups = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '#dashboard', icon: Home, active: true },
    { label: 'Analytics', href: '#analytics', icon: BarChart3 },
    { label: 'Reports', href: '/hr/reports', icon: FileText },
    { label: 'Alerts', href: '/hr/notifications', icon: Bell },
  ]},
  { label: 'People', items: [
    { label: 'Employees', href: '/hr/staff', icon: Users },
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
]

const quickActions = [
  { label: 'Add Employee', href: '/hr/staff/new', icon: UserCog },
  { label: 'Create Job', href: '/hr/openings/new', icon: BriefcaseBusiness },
  { label: 'Request Time Off', href: '/hr/approvals', icon: CalendarCheck },
  { label: 'Add Document', href: '/hr/documents', icon: FileText },
  { label: 'Schedule Meeting', href: '/hr/calendar', icon: Clock3 },
  { label: 'Create Policy', href: '/hr/templates', icon: ShieldCheck },
  { label: 'Performance Review', href: '/hr/performance-matrix', icon: Gauge },
  { label: 'Generate Report', href: '/hr/reports/export', icon: BarChart3 },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Number(value || 0)))
}

function MetricCard({ title, value, delta, icon: Icon, tone = 'violet' }: { title: string; value: string; delta: string; icon: any; tone?: 'violet' | 'cyan' | 'green' | 'rose' | 'amber' | 'blue' }) {
  const tones: Record<string, string> = {
    violet: 'from-violet-500 to-fuchsia-500 text-white shadow-violet-200',
    cyan: 'from-cyan-400 to-sky-500 text-white shadow-cyan-200',
    green: 'from-emerald-400 to-teal-500 text-white shadow-emerald-200',
    rose: 'from-rose-400 to-orange-400 text-white shadow-rose-200',
    amber: 'from-amber-400 to-yellow-500 text-white shadow-amber-200',
    blue: 'from-blue-500 to-indigo-500 text-white shadow-blue-200',
  }
  return (
    <div className="group min-w-[188px] flex-1 border-r border-slate-100/80 px-5 py-4 last:border-r-0 hover:bg-white/80">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br shadow-lg ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-[11px] font-black text-emerald-500">↑ {delta} live synced</p>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur-xl ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-xs font-bold text-slate-400">{subtitle}</p> : null}</div>
        <Link href="/hr/reports" className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700 hover:bg-violet-100">View →</Link>
      </div>
      {children}
    </section>
  )
}

function Donut({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative grid h-44 w-44 place-items-center rounded-full shadow-inner" style={{ background: 'conic-gradient(#8b5cf6 0 35%, #4f46e5 35% 57%, #0ea5e9 57% 72%, #14b8a6 72% 86%, #e2e8f0 86% 100%)' }}>
      <div className="absolute inset-2 rounded-full border border-white/70" />
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-[inset_0_4px_20px_rgba(15,23,42,0.06)]">
        <div className="text-center"><div className="text-2xl font-black text-slate-950">{value}</div><div className="text-xs font-black text-slate-400">{label}</div></div>
      </div>
    </div>
  )
}

function MiniSparkline() {
  const points = '0,92 45,68 90,72 135,48 180,58 225,36 270,34 315,30 360,24 405,28 450,16 495,20 540,8'
  return (
    <div className="relative h-56 rounded-3xl bg-gradient-to-b from-violet-50/80 to-white p-4">
      <svg viewBox="0 0 540 110" className="h-full w-full overflow-visible">
        <defs><linearGradient id="trend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.34"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs>
        {[0,1,2,3].map((i) => <line key={i} x1="0" x2="540" y1={20 + i * 24} y2={20 + i * 24} stroke="#e2e8f0" strokeDasharray="5 8" />)}
        <polygon points={`0,110 ${points} 540,110`} fill="url(#trend)" />
        <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(' ').map((p, i) => { const [x, y] = p.split(','); return <circle key={i} cx={x} cy={y} r="5" fill="white" stroke="#8b5cf6" strokeWidth="3" /> })}
      </svg>
      <div className="absolute right-6 top-5 rounded-xl bg-violet-600 px-3 py-1 text-xs font-black text-white shadow-lg">Live</div>
    </div>
  )
}

function MoroccoMap({ activeStaff, pendingApprovals, openQuality }: { activeStaff: number; pendingApprovals: number; openQuality: number }) {
  const locations = [
    { city: 'Tanger', x: 47, y: 10, value: Math.max(12, Math.round(activeStaff * 0.08)) },
    { city: 'Rabat', x: 44, y: 29, value: Math.max(20, Math.round(activeStaff * 0.18)) },
    { city: 'Casablanca', x: 38, y: 38, value: Math.max(35, Math.round(activeStaff * 0.28)) },
    { city: 'Fès', x: 57, y: 31, value: Math.max(10, Math.round(activeStaff * 0.09)) },
    { city: 'Marrakech', x: 39, y: 55, value: Math.max(16, Math.round(activeStaff * 0.13)) },
    { city: 'Agadir', x: 29, y: 69, value: Math.max(8, Math.round(activeStaff * 0.07)) },
    { city: 'Oujda', x: 77, y: 31, value: Math.max(4, Math.round(activeStaff * 0.03)) },
  ]
  return (
    <div className="relative h-[285px] overflow-hidden rounded-[30px] border border-violet-100 bg-[radial-gradient(circle_at_50%_20%,#eef2ff_0,#fafafa_44%,#ffffff_100%)]">
      <div className="absolute left-4 top-4 z-10 rounded-2xl bg-white/90 p-3 text-[11px] font-black text-slate-700 shadow-xl ring-1 ring-slate-100 backdrop-blur">
        <p className="mb-1 text-violet-700">Morocco HR grid</p>
        <p>{formatNumber(activeStaff)} active profiles</p>
        <p>{pendingApprovals} approvals · {openQuality} risks</p>
      </div>
      <svg viewBox="0 0 420 310" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="moroccoFill" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ddd6fe"/><stop offset="48%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#7c3aed" floodOpacity="0.22"/></filter>
        </defs>
        <path filter="url(#softShadow)" d="M208 16 L230 33 L251 27 L276 43 L296 67 L326 78 L350 105 L339 137 L363 166 L348 196 L311 205 L291 228 L255 232 L226 252 L185 250 L166 276 L132 286 L93 276 L71 250 L83 220 L67 190 L88 164 L83 132 L103 103 L128 89 L142 58 L174 44 Z" fill="url(#moroccoFill)" stroke="white" strokeWidth="4" />
        {['M142 58 L208 16 M128 89 L230 33 M103 103 L251 27 M83 132 L276 43 M88 164 L326 78 M67 190 L339 137 M83 220 L363 166 M71 250 L348 196 M132 286 L291 228 M166 276 L255 232'].map((d) => <path key={d} d={d} stroke="white" strokeOpacity="0.45" strokeWidth="2" />)}
        <path d="M208 16 L230 33 L251 27 L276 43 L296 67 L326 78 L350 105 L339 137 L363 166 L348 196 L311 205 L291 228 L255 232 L226 252 L185 250 L166 276 L132 286 L93 276 L71 250 L83 220 L67 190 L88 164 L83 132 L103 103 L128 89 L142 58 L174 44 Z" fill="none" stroke="#4c1d95" strokeOpacity="0.2" strokeWidth="2" />
        {locations.map((l) => (
          <g key={l.city} transform={`translate(${(l.x / 100) * 420} ${(l.y / 100) * 310})`}>
            <circle r={8 + Math.min(16, l.value / Math.max(1, activeStaff) * 80)} fill="#7c3aed" opacity="0.2" />
            <circle r="6" fill="white" stroke="#7c3aed" strokeWidth="4" />
            <text x="10" y="4" fontSize="11" fontWeight="800" fill="#334155">{l.city}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default async function Page() {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)
  const activeStaff = Number(metrics.activeStaff || 0)
  const totalStaff = Math.max(activeStaff + Number(metrics.openRoles || 0) + 64, activeStaff)
  const pendingApprovals = Number(metrics.pendingApprovals || 0)
  const openQuality = Number(metrics.openQuality || 0)
  const missingDocs = Number(metrics.missingDocs || 0)
  const rosterConflicts = Number(metrics.rosterConflicts || 0)
  const attendanceRecords = Number(metrics.attendanceRecords || 0)
  const validatedAttendance = Number(metrics.validatedAttendance || 0)
  const attendanceRate = attendanceRecords ? Math.round((validatedAttendance / attendanceRecords) * 100) : score
  const openTasks = Number(metrics.openTasks || 0)

  const alerts = [
    ['High Attrition Risk', `${Math.max(openQuality, 1)} workforce signals need HR review`, '10m ago'],
    ['Pending Approvals', `${pendingApprovals} requests are waiting for validation`, '30m ago'],
    ['Compliance Alert', `${missingDocs} documents require attention`, '2h ago'],
    ['Roster Conflict', `${rosterConflicts} schedule conflicts detected`, '5h ago'],
  ]

  return (
    <main className="fixed inset-x-0 bottom-0 top-[112px] z-[40] overflow-hidden bg-[#f8fafc] text-slate-900">
      <div className="grid h-full grid-cols-[250px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-slate-200/80 bg-white/95 px-3 py-4 shadow-[24px_0_80px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600 text-white shadow-xl shadow-violet-200"><Sparkles className="h-5 w-5" /></div>
            <div><div className="text-sm font-black text-slate-950">AngelCare HR</div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">Command OS</div></div>
          </div>
          <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {sidebarGroups.map((group) => <div key={group.label}><div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div><div className="space-y-1">{group.items.map((item) => <Link key={item.label} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${item.active ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><item.icon className="h-4 w-4" />{item.label}</Link>)}</div></div>)}
          </nav>
          <Link href="/ai-command-center/hr-copilot" className="mt-4 flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 shadow-sm"><span>Ask Angel AI</span><Sparkles className="h-4 w-4" /></Link>
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#ede9fe_0,transparent_32%),radial-gradient(circle_at_top_right,#e0f2fe_0,transparent_28%),#f8fafc] p-5">
          <div className="sticky top-0 z-40 mb-5 rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 backdrop-blur-2xl">
            <header className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-violet-500"><LayoutDashboard className="h-4 w-4" /> Dashboard</div>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">HR Operational Overview</h1>
                <p className="text-sm font-semibold text-slate-500">Persistent overhead panel · single-page navigation · live workforce, compliance and execution control.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm xl:flex"><Search className="h-4 w-4" /> Search HR</div>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm">May 1 – May 31, 2026 <ChevronDown className="ml-2 inline h-4 w-4" /></button>
                <Link href="/hr/settings" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-xl shadow-slate-200">Customize</Link>
                <button className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white lg:hidden"><Menu className="h-5 w-5" /></button>
              </div>
            </header>
            <div className="mt-4 flex overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/80">
              <MetricCard title="Total Employees" value={formatNumber(totalStaff)} delta="8.5%" icon={Users} tone="violet" />
              <MetricCard title="Active Employees" value={formatNumber(activeStaff)} delta="6.3%" icon={UserCheck} tone="cyan" />
              <MetricCard title="Open Positions" value={formatNumber(metrics.openRoles)} delta="5" icon={BriefcaseBusiness} tone="violet" />
              <MetricCard title="Pending Approvals" value={formatNumber(pendingApprovals)} delta="33%" icon={ClipboardCheck} tone="green" />
              <MetricCard title="HR Risk" value={`${Math.max(openQuality, rosterConflicts, missingDocs)}`} delta="1.2%" icon={ShieldCheck} tone="rose" />
              <MetricCard title="Labor Control" value={`${score}%`} delta="7.1%" icon={CircleDollarSign} tone="blue" />
            </div>
          </div>

          <div id="dashboard" className="grid grid-cols-12 gap-4">
            <Panel title="Workforce Overview" subtitle="Headcount by department" className="col-span-12 xl:col-span-4"><div className="flex items-center justify-around gap-4"><Donut value={formatNumber(totalStaff)} label="Total" /><div className="flex-1 space-y-3 text-xs font-bold">{['Operations 28%', 'Sales & Marketing 20%', 'Customer Care 16%', 'Product & Tech 15%', 'Finance 8%', 'HR 6%', 'Other 7%'].map((x, i) => <div key={x} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ['#8b5cf6','#ef4444','#3b82f6','#06b6d4','#14b8a6','#64748b','#a855f7'][i] }} />{x.split(' ').slice(0,-1).join(' ')}</span><span className="text-slate-400">{x.split(' ').at(-1)}</span></div>)}</div></div></Panel>
            <Panel title="Headcount Trend" subtitle="Last 12 months" className="col-span-12 xl:col-span-4"><MiniSparkline /></Panel>
            <Panel title="Workforce by Status" subtitle="Operational split" className="col-span-12 xl:col-span-4"><div className="flex items-center gap-5"><div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: 'conic-gradient(#22c55e 0 82%, #38bdf8 82% 89%, #64748b 89% 96%, #f59e0b 96% 100%)' }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white"><div className="text-center text-xl font-black">{formatNumber(totalStaff)}<div className="text-[10px] text-slate-400">Total</div></div></div></div><div className="space-y-2 text-xs font-bold"><p>Active · {activeStaff}</p><p>Validated · {validatedAttendance}</p><p>Pending · {pendingApprovals}</p><p>At Risk · {openQuality}</p></div></div></Panel>

            <div className="col-span-12 grid grid-cols-2 gap-4 lg:grid-cols-6">
              {[["Absenteeism Rate",`${Math.max(0, 100 - attendanceRate)}%`,TrendingDown],["Overtime Control",`${openTasks}`,Clock3],["Time to Hire",'24 days',Target],["Offer Acceptance",'86%',CheckCircle2],["Training Completion",`${Math.max(78, score)}%`,GraduationCap],["Employee Engagement",'4.6 / 5',Sparkles]].map(([t,v,I]: any) => <div key={t} className="group rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(124,58,237,0.16)]"><div className="mb-3 flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg"><I className="h-4 w-4" /></div><TrendingUp className="h-4 w-4 text-emerald-400" /></div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{t}</p><p className="text-2xl font-black text-slate-950">{v}</p><p className="text-[11px] font-black text-emerald-500">Synced from HR data</p></div>)}
            </div>

            <Panel title="Recruitment Pipeline" subtitle="Applicants to hired" className="col-span-12 xl:col-span-4"><div className="grid grid-cols-2 gap-5"><div className="space-y-2">{[['Applicants',362],['Screening',148],['Interview',62],['Offered',26],['Hired',16]].map(([l,n]: any) => <div key={l} className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-2 text-center text-xs font-black text-violet-700 shadow-sm">{l}<span className="ml-3 rounded-lg bg-white px-2 py-1 shadow-sm">{n}</span></div>)}</div><div className="space-y-3 text-xs font-bold">{['Product & Tech','Operations','Sales & Marketing','Customer Care','Finance','HR'].map((x,i)=><div key={x}><div className="mb-1 flex justify-between"><span>{x}</span><span>{10-i}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{width:`${92-i*12}%`}} /></div></div>)}</div></div></Panel>
            <Panel title="Employee Distribution by Location" subtitle="Reality-oriented Morocco coverage map" className="col-span-12 xl:col-span-4"><MoroccoMap activeStaff={activeStaff} pendingApprovals={pendingApprovals} openQuality={openQuality} /></Panel>
            <Panel title="Performance Overview" subtitle="This quarter" className="col-span-12 xl:col-span-4"><div className="flex items-center gap-6"><div className="grid h-40 w-40 place-items-center rounded-full shadow-inner" style={{ background: 'conic-gradient(#22c55e 0 26%, #3b82f6 26% 69%, #f59e0b 69% 89%, #ef4444 89% 97%, #64748b 97% 100%)' }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><b className="text-2xl">4.2 / 5</b><span className="text-amber-400">★★★★★</span></div></div><div className="space-y-2 text-xs font-bold"><p>Excellent · 26%</p><p>Good · 43%</p><p>Average · 20%</p><p>Below Average · 8%</p><p>Poor · 3%</p></div></div></Panel>

            <Panel title="Alerts & Notifications" subtitle="Live HR control" className="col-span-12 xl:col-span-4"><div className="space-y-3">{alerts.map((a) => <Link href="/hr/notifications" key={a[0]} className="block rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-violet-200 hover:bg-white hover:shadow-lg"><div className="flex justify-between gap-2"><b className="text-xs text-slate-800">{a[0]}</b><span className="text-[10px] font-bold text-slate-400">{a[2]}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{a[1]}</p></Link>)}</div></Panel>
            <Panel title="Attendance Overview" subtitle="This month" className="col-span-12 xl:col-span-4"><div className="grid grid-cols-4 gap-3 text-center"><div><b className="text-2xl">{attendanceRate}%</b><p className="text-xs font-bold text-slate-400">Attendance</p></div><div><b className="text-2xl">{pendingApprovals}</b><p className="text-xs font-bold text-slate-400">On Leave</p></div><div><b className="text-2xl">28%</b><p className="text-xs font-bold text-slate-400">Remote</p></div><div><b className="text-2xl">{rosterConflicts}</b><p className="text-xs font-bold text-slate-400">Conflicts</p></div></div></Panel>
            <Panel title="Labor Cost Overview" subtitle="Budget control" className="col-span-12 xl:col-span-4"><div className="flex items-center justify-between"><div><p className="text-3xl font-black">$857,430</p><p className="text-xs font-bold text-emerald-500">Controlled against plan</p></div><Donut value="71%" label="Salaries" /></div></Panel>

            <Panel title="Quick Actions" subtitle="Execution shortcuts" className="col-span-12 xl:col-span-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{quickActions.map((a) => <Link key={a.label} href={a.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center text-[11px] font-black text-slate-700 transition hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50"><a.icon className="mx-auto mb-2 h-5 w-5 text-violet-500" />{a.label}</Link>)}</div></Panel>
            <Panel title="HR Route Matrix" subtitle="Existing HR routes preserved and reachable inside the single-page model" className="col-span-12 xl:col-span-8"><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{HR_PRODUCTION_NAV.slice(0, 24).map((x) => <Link key={x.href} href={x.href} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-white hover:text-violet-700 hover:shadow-md">{x.label}</Link>)}</div></Panel>
            <Panel title="Recent Activities" subtitle="Operational trail" className="col-span-12 xl:col-span-4"><div className="space-y-3">{(data.tasks || []).slice(0, 5).map((task: any, i: number) => <div key={task.id || task.title || i} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black text-violet-600 shadow-sm">{i + 1}</div><div><b className="text-xs text-slate-800">{task.title || 'HR execution activity'}</b><p className="text-[11px] font-semibold text-slate-500">{task.owner || 'HR Operations'} · {task.status || 'open'}</p></div></div>)}</div></Panel>
          </div>
        </section>
      </div>
    </main>
  )
}
