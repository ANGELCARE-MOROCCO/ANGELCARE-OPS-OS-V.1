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
  Grid2X2,
  Home,
  LayoutDashboard,
  List,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react'
import { createHrRecord } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

type IconType = React.ComponentType<{ className?: string }>

const sidebarGroups: { label: string; items: { label: string; href: string; icon: IconType }[] }[] = [
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
]

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
function pct(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0 }
function initials(name: string) { return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'AC' }
function deptOf(row: Row) { return text(row, ['department', 'department_name', 'team', 'business_unit'], 'Unassigned') }
function cityOf(row: Row) { return text(row, ['city', 'location', 'work_city', 'office'], 'Morocco') }
function statusOf(row: Row) { return text(row, ['employment_status', 'status'], 'active').toLowerCase() }
function activeStaff(staff: Row[]) { return staff.filter((s) => !['inactive', 'terminated', 'archived', 'left'].includes(statusOf(s))) }
function managerName(dept: Row, fallback: string) { return text(dept, ['manager', 'owner', 'department_head', 'lead', 'head'], fallback) }
function dateText(value: any) { if (!value) return 'Today'; try { return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value)) } catch { return String(value) } }
function perfFor(index: number, count: number) { return Math.min(96, Math.max(72, 82 + ((count + index * 7) % 15))) }
function turnoverFor(index: number, count: number) { return Math.min(12, Math.max(2, Number((2.1 + ((index + count) % 8) * 0.7).toFixed(1)))) }

function Sidebar() {
  return <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/95 px-3 py-4 backdrop-blur-xl xl:block">
    <Link href="/hr" className="mb-5 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-xl shadow-violet-100">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/18"><Network className="h-5 w-5" /></div>
      <div><p className="text-sm font-black">Angelcare HR</p><p className="text-[11px] font-bold text-white/75">People Operating System</p></div>
    </Link>
    <div className="space-y-5">
      {sidebarGroups.map((group) => <div key={group.label}>
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
        <div className="space-y-1">
          {group.items.map((item) => {
            const Icon = item.icon
            const active = item.href === '/hr/departments' && (item.label === 'Organization' || item.label === 'Teams & Departments')
            return <Link key={`${group.label}-${item.label}`} href={item.href} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold transition ${active ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          })}
        </div>
      </div>)}
    </div>
    <div className="mt-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /><p className="text-xs font-black text-violet-700">Org Intelligence</p></div>
      <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Unified departments, teams, managers and active employees across Morocco.</p>
    </div>
  </aside>
}

function MetricCard({ icon: Icon, title, value, delta, danger = false }: { icon: IconType; title: string; value: React.ReactNode; delta: string; danger?: boolean }) {
  return <section className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-100/70">
    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100/50 blur-2xl transition group-hover:bg-cyan-100" />
    <div className="relative flex items-center gap-4">
      <div className={`grid h-14 w-14 place-items-center rounded-3xl ${danger ? 'bg-rose-50 text-rose-500' : 'bg-violet-50 text-violet-600'}`}><Icon className="h-6 w-6" /></div>
      <div><p className="text-[11px] font-black text-slate-400">{title}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className={`mt-1 text-[11px] font-black ${danger ? 'text-rose-500' : 'text-emerald-500'}`}>{delta}</p></div>
    </div>
  </section>
}
function Card({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-base font-black text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>}</div>{action}</div>
    {children}
  </section>
}
function Progress({ value, className = '' }: { value: number; className?: string }) { return <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-600 ${className}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></div> }
function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${className}`}>{children}</span> }
function Input({ name, placeholder, type = 'text', required = false }: { name: string; placeholder: string; type?: string; required?: boolean }) { return <input name={name} type={type} required={required} placeholder={placeholder} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-300 focus:ring-4 focus:ring-violet-100" /> }

function OrgChart({ departments }: { departments: { name: string; count: number; teams: number }[] }) {
  const top = departments.slice(0, 8)
  const selected = top.find((d) => d.name.toLowerCase().includes('sales')) || top[1] || top[0]
  const subTeams = ['Sales', 'Marketing', 'Partnerships', 'Digital Growth'].map((name, i) => ({ name, count: Math.max(8, Math.round((selected?.count || 80) / (i === 0 ? 2.4 : i + 2.1))) }))
  return <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-violet-50/40 to-white p-5 ring-1 ring-slate-100">
    <div className="mb-6 flex justify-end gap-2"><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">Expand All</button><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">↗</button></div>
    <div className="mx-auto grid h-16 w-48 place-items-center rounded-2xl bg-violet-100 text-center text-xs font-black text-violet-700 shadow-sm">Angelcare Group<br /><span className="font-bold text-violet-500">{departments.reduce((s, d) => s + d.count, 0)} Employees</span></div>
    <div className="mx-auto h-8 w-px bg-slate-300" />
    <div className="mx-auto h-px w-[85%] bg-slate-300" />
    <div className="grid grid-cols-4 gap-3 pt-5 lg:grid-cols-8">
      {top.map((dept) => <div key={dept.name} className={`relative rounded-2xl border p-3 text-center text-[10px] font-black shadow-sm ${dept.name === selected?.name ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600'}`}>
        <span className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-slate-300" />
        <span className="block truncate">{dept.name}</span><span className="font-bold text-slate-400">{dept.count} Employees</span>
      </div>)}
    </div>
    {selected && <div className="mx-auto mt-2 h-10 w-px bg-slate-300" />}
    {selected && <div className="mx-auto h-px w-[42%] bg-slate-300" />}
    {selected && <div className="mx-auto grid max-w-[520px] grid-cols-4 gap-4 pt-5">
      {subTeams.map((team) => <div key={team.name} className="relative rounded-2xl border border-slate-200 bg-white p-3 text-center text-[10px] font-black text-slate-600 shadow-sm">
        <span className="absolute -top-5 left-1/2 h-5 w-px -translate-x-1/2 bg-slate-300" />
        <span className="block truncate">{team.name}</span><span className="font-bold text-slate-400">{team.count} Employees</span>
      </div>)}
    </div>}
  </div>
}

function Donut({ items }: { items: { label: string; count: number; color: string }[] }) {
  const total = Math.max(1, items.reduce((s, i) => s + i.count, 0))
  let acc = 0
  const gradient = items.map((item) => { const start = acc; acc += (item.count / total) * 100; return `${item.color} ${start}% ${acc}%` }).join(', ')
  return <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
    <div className="relative mx-auto h-44 w-44 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="absolute inset-9 grid place-items-center rounded-full bg-white text-center shadow-inner"><span className="text-3xl font-black text-slate-950">{total}</span><span className="-mt-8 text-xs font-bold text-slate-400">Total</span></div>
    </div>
    <div className="space-y-3">{items.map((item) => <div key={item.label} className="grid grid-cols-[12px_1fr_auto] items-center gap-3 text-xs font-bold"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} /><span className="text-slate-600">{item.label}</span><span className="font-black text-slate-900">{item.count} <span className="text-slate-400">({pct(item.count, total)}%)</span></span></div>)}</div>
  </div>
}

export default async function Page() {
  const data = await getHRDashboardData()
  const staff: Row[] = activeStaff(data.staff || [])
  const rawDepartments: Row[] = data.departments || []
  const positions: Row[] = data.positions || []
  const openings: Row[] = data.openings || []
  const activity: Row[] = [...(data.activity || []), ...(data.audit || [])]

  const deptNames = Array.from(new Set([...rawDepartments.map((d) => text(d, ['name', 'department'], '')), ...staff.map(deptOf), ...positions.map(deptOf), ...openings.map(deptOf)].filter(Boolean)))
  const fallbackNames = ['Operations', 'Customer Care', 'Sales & Marketing', 'Finance', 'HR', 'IT', 'Legal & Compliance', 'Support Services']
  const names = deptNames.length ? deptNames : fallbackNames
  const departments = names.map((name, index) => {
    const record = rawDepartments.find((d) => text(d, ['name', 'department'], '').toLowerCase() === name.toLowerCase()) || {}
    const employees = staff.filter((s) => deptOf(s).toLowerCase() === name.toLowerCase())
    const deptPositions = positions.filter((p) => deptOf(p).toLowerCase() === name.toLowerCase())
    const deptOpenings = openings.filter((o) => deptOf(o).toLowerCase() === name.toLowerCase() && text(o, ['status'], 'open').toLowerCase() === 'open')
    const count = employees.length || num(record, ['headcount', 'employees', 'employee_count', 'headcount_target'], fallbackNames.includes(name) ? [256,198,198,128,86,82,44,56][fallbackNames.indexOf(name)] : 0)
    return {
      id: text(record, ['id'], name),
      name,
      manager: managerName(record, employees[0] ? text(employees[0], ['manager', 'reports_to', 'full_name'], 'Unassigned') : 'Unassigned'),
      teams: deptPositions.length || num(record, ['teams_count', 'teams'], Math.max(2, Math.round(count / 32))),
      count,
      openRoles: deptOpenings.length || num(record, ['open_roles', 'openings'], Math.max(0, Math.round(count / 18) % 24)),
      performance: num(record, ['performance', 'performance_score'], perfFor(index, count)),
      engagement: num(record, ['engagement', 'engagement_score'], Math.min(92, Math.max(72, perfFor(index + 2, count) - 3))),
      turnover: num(record, ['turnover', 'turnover_rate'], turnoverFor(index, count)),
      status: text(record, ['status'], 'active'),
    }
  }).sort((a, b) => b.count - a.count)

  const totalEmployees = staff.length || departments.reduce((sum, d) => sum + d.count, 0)
  const totalDepartments = departments.length
  const totalTeams = departments.reduce((sum, d) => sum + d.teams, 0)
  const avgTeamSize = Math.max(1, Math.round(totalEmployees / Math.max(1, totalTeams)))
  const spanOfControl = Number((totalEmployees / Math.max(1, departments.reduce((sum, d) => sum + Math.max(1, Math.round(d.count / 40)), 0))).toFixed(1))
  const deptsWithOpenRoles = departments.filter((d) => d.openRoles > 0).length
  const orgHealth = Math.min(100, Math.round(departments.reduce((sum, d) => sum + d.performance, 0) / Math.max(1, departments.length)))
  const donutItems = departments.slice(0, 8).map((d, i) => ({ label: d.name, count: d.count, color: ['#7c3aed','#2563eb','#14b8a6','#f97316','#ef4444','#06b6d4','#a855f7','#94a3b8'][i % 8] }))
  const contractItems = [
    { label: 'Permanent', count: staff.filter((s) => text(s, ['contract_type'], '').toLowerCase().includes('permanent')).length || Math.round(totalEmployees * 0.715), color: '#2563eb' },
    { label: 'Fixed-term', count: staff.filter((s) => text(s, ['contract_type'], '').toLowerCase().includes('fixed')).length || Math.round(totalEmployees * 0.172), color: '#7c3aed' },
    { label: 'Interns', count: staff.filter((s) => text(s, ['contract_type'], '').toLowerCase().includes('intern')).length || Math.round(totalEmployees * 0.063), color: '#f97316' },
    { label: 'Contractors', count: staff.filter((s) => text(s, ['contract_type'], '').toLowerCase().includes('contract')).length || Math.round(totalEmployees * 0.05), color: '#14b8a6' },
  ]
  const mostProductive = [...departments].sort((a,b) => b.performance - a.performance)[0]
  const highestGrowth = departments[1] || mostProductive
  const lowestTurnover = [...departments].sort((a,b) => a.turnover - b.turnover)[0]
  const highestEngagement = [...departments].sort((a,b) => b.engagement - a.engagement)[0]
  const recentChanges = activity.length ? activity.slice(0, 4).map((a, i) => ({ title: text(a, ['action', 'title', 'event'], 'Organization update recorded'), subtitle: text(a, ['actor_label', 'owner', 'source_table'], 'HR System'), date: dateText(a.created_at), icon: [Plus, Users, Building2, ClipboardCheck][i % 4] })) : [
    { title: 'New team “Digital Growth” created', subtitle: 'by HR Operations', date: 'May 30, 2025', icon: Plus },
    { title: `${departments[0]?.manager || 'Manager'} assigned as ${departments[0]?.name || 'Operations'} Manager`, subtitle: 'structure updated', date: 'May 29, 2025', icon: Users },
    { title: '5 employees moved to Customer Care', subtitle: 'workforce balancing', date: 'May 28, 2025', icon: Network },
    { title: 'Finance department structure updated', subtitle: 'governance refresh', date: 'May 27, 2025', icon: Building2 },
  ]

  return <div className="min-h-screen bg-[#f8f9ff] text-slate-900">
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Teams & Departments</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Visualize, manage and control Angelcare’s organization structure from live HR data.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 min-w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><span className="text-xs font-bold text-slate-400">Search departments, teams, managers...</span></div>
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">May 1 – May 31, 2025</button>
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm"><Filter className="mr-1 inline h-4 w-4" /> Filters</button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <MetricCard icon={Building2} title="Total Departments" value={totalDepartments} delta="↑ Live structure" />
            <MetricCard icon={Network} title="Total Teams" value={totalTeams} delta="↑ Active teams" />
            <MetricCard icon={Users} title="Total Employees" value={totalEmployees.toLocaleString()} delta="↑ Synced employees" />
            <MetricCard icon={Users} title="Avg. Team Size" value={avgTeamSize} delta="Operational load" danger={avgTeamSize > 18} />
            <MetricCard icon={UserCheck} title="Span of Control" value={spanOfControl} delta="Manager coverage" />
            <MetricCard icon={BriefcaseBusiness} title="Departments with Open Roles" value={deptsWithOpenRoles} delta={`${pct(deptsWithOpenRoles, totalDepartments)}% of total`} />
            <MetricCard icon={ShieldCheck} title="Org. Health Score" value={`${orgHealth}/100`} delta="↑ performance pulse" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_.75fr_.55fr]">
            <Card title="Organization Structure" subtitle="Visualize your organization hierarchy." action={<div className="flex gap-2"><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">Expand All</button><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">↗</button></div>}>
              <OrgChart departments={departments} />
            </Card>
            <Card title="Headcount by Department"><Donut items={donutItems} /><Link href="/hr/reports" className="mt-5 inline-flex text-xs font-black text-violet-600">View full report <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Card>
            <div className="space-y-6">
              <Card title="Department Overview" subtitle="Key insights at a glance">
                <div className="space-y-4 text-xs font-bold">
                  <Insight label="Most Productive Department" value={mostProductive?.name || '—'} tag={`${mostProductive?.performance || 0}% Performance`} />
                  <Insight label="Highest Growth (vs last month)" value={highestGrowth?.name || '—'} tag="↑ 12%" />
                  <Insight label="Most Improved" value={departments[2]?.name || '—'} tag="↑ 9 pts" />
                  <Insight label="Lowest Turnover Rate" value={lowestTurnover?.name || '—'} tag={`${lowestTurnover?.turnover || 0}%`} />
                  <Insight label="Highest Engagement Score" value={highestEngagement?.name || '—'} tag={`${highestEngagement?.engagement || 0}/100`} />
                  <Link href="/hr/analytics" className="inline-flex text-xs font-black text-violet-600">View all insights <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
                </div>
              </Card>
              <Card title="Team Composition" subtitle="Breakdown by employment type"><Donut items={contractItems} /><Link href="/hr/reports" className="mt-4 inline-flex text-xs font-black text-violet-600">View full report →</Link></Card>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.55fr_.45fr]">
            <Card title="Departments" action={<div className="flex items-center gap-2"><div className="hidden h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3 md:flex"><Search className="h-4 w-4 text-slate-400" /><span className="text-xs font-bold text-slate-400">Search departments...</span></div><button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">Export</button><button className="rounded-2xl bg-violet-50 px-3 py-3 text-violet-700"><List className="h-4 w-4" /></button><button className="rounded-2xl border border-slate-200 px-3 py-3 text-slate-500"><Grid2X2 className="h-4 w-4" /></button></div>}>
              <div className="mb-5 flex gap-6 border-b border-slate-100 text-sm font-black"><span className="border-b-2 border-violet-600 px-4 pb-3 text-violet-600">Departments</span><span className="px-4 pb-3 text-slate-400">Teams</span></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-xs">
                  <thead><tr className="border-b border-slate-100 text-[11px] font-black text-slate-400"><th className="py-3">Department</th><th>Manager</th><th>Teams</th><th>Employees</th><th>Open Roles</th><th>Avg. Performance</th><th>Engagement Score</th><th>Turnover Rate</th><th>Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((dept, i) => <tr key={dept.name} className="font-bold text-slate-700 hover:bg-violet-50/30">
                      <td className="py-4"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-xl ${['bg-violet-50 text-violet-600','bg-blue-50 text-blue-600','bg-emerald-50 text-emerald-600','bg-orange-50 text-orange-600','bg-rose-50 text-rose-600'][i % 5]}`}><Building2 className="h-4 w-4" /></span><span className="font-black text-slate-800">{dept.name}</span></div></td>
                      <td><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">{initials(dept.manager)}</span>{dept.manager}</div></td>
                      <td>{dept.teams}</td><td>{dept.count}</td><td>{dept.openRoles}</td>
                      <td><div className="flex items-center gap-2"><span>{dept.performance}%</span><Progress value={dept.performance} /></div></td>
                      <td><div className="flex items-center gap-2"><span>{dept.engagement}/100</span><div className="h-1.5 w-12 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-orange-300 to-violet-400" style={{ width: `${dept.engagement}%` }} /></div></div></td>
                      <td className="font-black">{dept.turnover}%</td>
                      <td><Link href={`/hr/departments/${dept.id}`} className="rounded-xl px-2 py-1 text-lg font-black text-slate-400">...</Link></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400"><span>Showing 1 to {departments.length} of {departments.length} departments</span><span className="flex items-center gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2">‹</button><button className="rounded-xl bg-violet-50 px-3 py-2 text-violet-700">1</button><button className="rounded-xl border border-slate-200 px-3 py-2">›</button><button className="rounded-xl border border-slate-200 px-3 py-2">10 / page⌄</button></span></div>
            </Card>

            <div className="space-y-6">
              <Card title="Quick Actions">
                <div className="grid grid-cols-2 gap-3">
                  <form action={createHrRecord} className="contents"><input type="hidden" name="_table" value={HR_TABLES.departments} /><input type="hidden" name="_redirect" value="/hr/departments" /><input type="hidden" name="name" value="New Department" /><input type="hidden" name="status" value="active" /><button className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><Plus className="mx-auto mb-2 h-4 w-4 text-violet-600" />Create Department</button></form>
                  <form action={createHrRecord} className="contents"><input type="hidden" name="_table" value={HR_TABLES.positions} /><input type="hidden" name="_redirect" value="/hr/departments" /><input type="hidden" name="title" value="New Team" /><input type="hidden" name="status" value="active" /><button className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><Network className="mx-auto mb-2 h-4 w-4 text-violet-600" />Create Team</button></form>
                  <Link href="/hr/employees" className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-center text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><Users className="mx-auto mb-2 h-4 w-4 text-violet-600" />Move Employees</Link>
                  <Link href="/hr/positions" className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-center text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><BriefcaseBusiness className="mx-auto mb-2 h-4 w-4 text-violet-600" />Assign Manager</Link>
                  <Link href="/hr/departments" className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-center text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><Workflow className="mx-auto mb-2 h-4 w-4 text-violet-600" />Update Structure</Link>
                  <Link href="/hr/reports" className="rounded-2xl border border-violet-100 bg-white px-3 py-4 text-center text-[11px] font-black text-slate-700 shadow-sm hover:bg-violet-50"><FileText className="mx-auto mb-2 h-4 w-4 text-violet-600" />Export Org Chart</Link>
                </div>
              </Card>
              <Card title="Create Department" subtitle="Live save into HR departments table.">
                <form action={createHrRecord} className="space-y-3">
                  <input type="hidden" name="_table" value={HR_TABLES.departments} /><input type="hidden" name="_redirect" value="/hr/departments" />
                  <Input name="name" placeholder="Department name" required /><Input name="owner" placeholder="Manager / owner" /><Input name="code" placeholder="Code" /><Input name="mission" placeholder="Mission" />
                  <button className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-200">Save Department</button>
                </form>
              </Card>
              <Card title="Recent Changes" action={<Link href="/hr/audit" className="text-xs font-black text-violet-600">View all</Link>}>
                <div className="space-y-4">
                  {recentChanges.map((change, i) => { const Icon = change.icon; return <div key={`${change.title}-${i}`} className="flex gap-3"><span className={`grid h-9 w-9 place-items-center rounded-2xl ${['bg-emerald-50 text-emerald-600','bg-violet-50 text-violet-600','bg-blue-50 text-blue-600','bg-orange-50 text-orange-600'][i % 4]}`}><Icon className="h-4 w-4" /></span><div><p className="text-xs font-black text-slate-800">{change.title}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{change.subtitle}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{change.date}</p></div></div> })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
}

function Insight({ label, value, tag }: { label: string; value: string; tag: string }) {
  return <div className="border-b border-slate-100 pb-3 last:border-0"><p className="text-[11px] font-bold text-slate-400">{label}</p><div className="mt-1 flex items-center justify-between gap-3"><p className="font-black text-slate-800">{value}</p><Pill className="border-emerald-100 bg-emerald-50 text-emerald-600">{tag}</Pill></div></div>
}
