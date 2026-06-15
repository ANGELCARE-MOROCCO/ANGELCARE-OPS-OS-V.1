import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileBadge2,
  FileText,
  Gauge,
  GraduationCap,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
  Workflow,
} from 'lucide-react'
import { createHrRecord } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'
import DepartmentsOrgBuilderClient from './DepartmentsOrgBuilderClient'
import DepartmentFilesManagerClient from './DepartmentFilesManagerClient'
import { cookies } from 'next/headers'
import DepartmentsBoardCommandClient from './DepartmentsBoardCommandClient'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>
type IconType = ComponentType<{ className?: string }>

type DepartmentCommand = {
  id: string
  name: string
  manager: string
  count: number
  teams: number
  openRoles: number
  readiness: number
  risk: number
  engagement: number
  performance: number
  turnover: number
  status: string
  employees: Row[]
  cities: { name: string; count: number }[]
  roles: { name: string; count: number }[]
}

const sidebarGroups: { label: string; items: { label: string; href: string; icon: IconType }[] }[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', href: '/hr', icon: LayoutDashboard }] },
  {
    label: 'People',
    items: [
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
      { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Onboarding', href: '/hr/onboarding', icon: ClipboardCheck },
      { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
      { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
      { label: 'Leave Management', href: '/hr/leave', icon: Clock3 },
      { label: 'Work Schedules', href: '/hr/work-schedules', icon: Workflow },
      { label: 'Time Tracking', href: '/hr/time-tracking', icon: Activity },
    ],
  },
  {
    label: 'Compliance & Documents',
    items: [
      { label: 'Documents', href: '/hr/documents', icon: FileBadge2 },
      { label: 'Templates', href: '/hr/templates', icon: FileText },
      { label: 'Policies', href: '/hr/policies', icon: ShieldCheck },
      { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Integrations', href: '/hr/integrations', icon: Sparkles },
      { label: 'Settings', href: '/hr/settings', icon: Settings },
    ],
  },
]

function text(row: Row | null | undefined, keys: string[], fallback = '—') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row?.[key]
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim()
  }
  return fallback
}

function numberValue(row: Row | null | undefined, keys: string[], fallback = 0) {
  const raw = text(row, keys, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function pct(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function initials(name: string) {
  return name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AC'
}

function deptOf(row: Row) {
  return text(row, ['department', 'department_name', 'team', 'business_unit'], 'Unassigned')
}

function cityOf(row: Row) {
  return text(row, ['city', 'location', 'work_city', 'office'], 'Morocco')
}

function roleOf(row: Row) {
  return text(row, ['position', 'job_title', 'role', 'title'], 'Unassigned role')
}

function statusOf(row: Row) {
  return text(row, ['employment_status', 'status'], 'active').toLowerCase()
}

function activeStaff(staff: Row[]) {
  return staff.filter((s) => !['inactive', 'terminated', 'archived', 'left'].includes(statusOf(s)))
}

function avg(values: number[], fallback = 0) {
  const clean = values.filter((v) => Number.isFinite(v))
  return clean.length ? Math.round(clean.reduce((a, b) => a + b, 0) / clean.length) : fallback
}

function groupCount(rows: Row[], getter: (row: Row) => string) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = getter(row) || 'Unassigned'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/95 px-3 py-4 backdrop-blur-xl xl:block">
      <Link href="/hr" className="mb-5 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-xl shadow-violet-100">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20">
          <Network className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black">AngelCare HR</p>
          <p className="text-[11px] font-bold text-white/75">People Operating System</p>
        </div>
      </Link>

      <div className="space-y-5">
        {sidebarGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = item.href === '/hr/departments'
                return (
                  <Link
                    key={`${group.label}-${item.label}`}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-extrabold transition ${
                      active ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <p className="text-xs font-black text-violet-700">Org Intelligence</p>
        </div>
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">
          Live departments, teams, managers, roles, cities and employee distribution.
        </p>
      </div>
    </aside>
  )
}

function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[34px] border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  tone = 'violet',
}: {
  icon: IconType
  label: string
  value: ReactNode
  subtitle: string
  tone?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate'
}) {
  const tones = {
    violet: 'from-violet-50 to-white text-violet-700 border-violet-100',
    cyan: 'from-cyan-50 to-white text-cyan-700 border-cyan-100',
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-100',
    amber: 'from-amber-50 to-white text-amber-700 border-amber-100',
    rose: 'from-rose-50 to-white text-rose-700 border-rose-100',
    slate: 'from-slate-50 to-white text-slate-700 border-slate-100',
  }

  return (
    <section className={`relative overflow-hidden rounded-[30px] border bg-gradient-to-br p-5 shadow-sm ${tones[tone]}`}>
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-current opacity-10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-black text-slate-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

function Progress({ value, tone = 'violet' }: { value: number; tone?: 'violet' | 'emerald' | 'rose' | 'cyan' | 'amber' }) {
  const bg = {
    violet: 'from-violet-600 to-fuchsia-500',
    emerald: 'from-emerald-500 to-cyan-500',
    rose: 'from-rose-500 to-amber-400',
    cyan: 'from-cyan-500 to-blue-500',
    amber: 'from-amber-400 to-orange-500',
  }[tone]

  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className={`h-full rounded-full bg-gradient-to-r ${bg}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} />
    </div>
  )
}

function DepartmentPill({ children, tone = 'violet' }: { children: ReactNode; tone?: 'violet' | 'emerald' | 'rose' | 'cyan' | 'amber' | 'slate' }) {
  const tones = {
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>
}

function OrgMap({ departments, totalEmployees }: { departments: DepartmentCommand[]; totalEmployees: number }) {
  const top = departments.slice(0, 8)

  return (
    <div className="rounded-[30px] border border-slate-100 bg-gradient-to-br from-white via-violet-50/60 to-cyan-50/50 p-5">
      <div className="mx-auto grid h-20 max-w-[280px] place-items-center rounded-[28px] bg-slate-950 text-center text-white shadow-2xl shadow-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">AngelCare HR</p>
        <p className="text-lg font-black">{totalEmployees} active employees</p>
      </div>

      <div className="mx-auto h-8 w-px bg-slate-300" />
      <div className="mx-auto h-px w-[90%] bg-slate-300" />

      <div className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {top.map((dept, index) => (
          <div key={dept.name} className="relative rounded-[24px] border border-white/80 bg-white p-4 text-center shadow-md shadow-slate-200/60">
            <span className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-slate-300" />
            <div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${['bg-violet-50 text-violet-700','bg-cyan-50 text-cyan-700','bg-emerald-50 text-emerald-700','bg-amber-50 text-amber-700','bg-rose-50 text-rose-700'][index % 5]}`}>
              <Building2 className="h-5 w-5" />
            </div>
            <p className="mt-3 truncate text-sm font-black text-slate-950">{dept.name}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{dept.count} employees · {dept.teams} teams</p>
            <div className="mt-3">
              <Progress value={dept.readiness} tone="emerald" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DepartmentCard({ dept, index }: { dept: DepartmentCommand; index: number }) {
  return (
    <details className="group overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
      <summary className="cursor-pointer list-none p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-3xl ${['bg-violet-50 text-violet-700','bg-cyan-50 text-cyan-700','bg-emerald-50 text-emerald-700','bg-amber-50 text-amber-700','bg-rose-50 text-rose-700'][index % 5]}`}>
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-950">{dept.name}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Lead: {dept.manager} · {dept.count} employees · {dept.cities.length} cities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <DepartmentPill tone="emerald">Readiness {dept.readiness}%</DepartmentPill>
                <DepartmentPill tone={dept.risk > 35 ? 'rose' : 'cyan'}>Risk {dept.risk}%</DepartmentPill>
                <DepartmentPill tone="violet">{dept.openRoles} open roles</DepartmentPill>
              </div>
            </div>
          </div>

          <div className="grid min-w-[420px] gap-3 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Performance</p>
              <p className="mt-1 text-xl font-black text-slate-950">{dept.performance}%</p>
              <Progress value={dept.performance} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Engagement</p>
              <p className="mt-1 text-xl font-black text-slate-950">{dept.engagement}%</p>
              <Progress value={dept.engagement} tone="cyan" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Risk</p>
              <p className="mt-1 text-xl font-black text-slate-950">{dept.risk}%</p>
              <Progress value={dept.risk} tone="rose" />
            </div>
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/70 p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.85fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Mapped employees</h3>
            <div className="mt-4 grid max-h-[300px] gap-2 overflow-auto pr-1">
              {dept.employees.slice(0, 12).map((employee, i) => (
                <div key={`${dept.name}-${text(employee, ['id', 'email', 'full_name'], String(i))}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-xs font-black text-white">
                      {initials(text(employee, ['full_name', 'name', 'email'], 'AC'))}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{text(employee, ['full_name', 'name', 'email'], 'Employee')}</p>
                      <p className="text-xs font-bold text-slate-500">{roleOf(employee)} · {cityOf(employee)}</p>
                    </div>
                  </div>
                  <DepartmentPill tone="slate">{statusOf(employee)}</DepartmentPill>
                </div>
              ))}

              {!dept.employees.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500">
                  No live employees are mapped to this department yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Cities and roles</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                {dept.cities.slice(0, 8).map((city) => (
                  <div key={`${dept.name}-${city.name}`} className="rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-800">
                    {city.name} <span className="float-right">{city.count}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {dept.roles.slice(0, 8).map((role) => (
                  <div key={`${dept.name}-${role.name}`} className="rounded-2xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-800">
                    {role.name} <span className="float-right">{role.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Department operations</h3>
            <div className="mt-4 grid gap-2">
              {[
                ['Attendance control', '/hr/attendance', CalendarCheck],
                ['Payroll readiness', '/hr/payroll', WalletCards],
                ['Documents', '/hr/documents', FileBadge2],
                ['Training', '/hr/training', GraduationCap],
                ['Performance', '/hr/performance-matrix', Gauge],
                ['Work schedules', '/hr/work-schedules', Workflow],
              ].map(([label, href, Icon]: any) => (
                <Link key={`${dept.name}-${label}`} href={href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-600" />{label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </details>
  )
}

function CreateDepartmentPanel() {
  return (
    <Card title="Create / update structure" subtitle="Production save into HR departments and positions tables.">
      <div className="grid gap-4 xl:grid-cols-2">
        <form action={createHrRecord} className="rounded-[26px] border border-violet-100 bg-violet-50/60 p-4">
          <input type="hidden" name="_table" value={HR_TABLES.departments} />
          <input type="hidden" name="_redirect" value="/hr/departments" />
          <p className="text-sm font-black text-violet-950">New department</p>
          <div className="mt-4 grid gap-3">
            <input name="name" required placeholder="Department name" className="h-11 rounded-2xl border border-violet-100 bg-white px-4 text-sm font-bold outline-none" />
            <input name="manager" placeholder="Department manager / owner" className="h-11 rounded-2xl border border-violet-100 bg-white px-4 text-sm font-bold outline-none" />
            <input name="status" defaultValue="active" placeholder="Status" className="h-11 rounded-2xl border border-violet-100 bg-white px-4 text-sm font-bold outline-none" />
            <button className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
              <Plus className="mr-2 inline h-4 w-4" />
              Save department
            </button>
          </div>
        </form>

        <form action={createHrRecord} className="rounded-[26px] border border-cyan-100 bg-cyan-50/60 p-4">
          <input type="hidden" name="_table" value={HR_TABLES.positions} />
          <input type="hidden" name="_redirect" value="/hr/departments" />
          <p className="text-sm font-black text-cyan-950">New team / position group</p>
          <div className="mt-4 grid gap-3">
            <input name="title" required placeholder="Team or position title" className="h-11 rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-bold outline-none" />
            <input name="department" placeholder="Linked department" className="h-11 rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-bold outline-none" />
            <input name="status" defaultValue="active" placeholder="Status" className="h-11 rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-bold outline-none" />
            <button className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-cyan-200">
              <Network className="mr-2 inline h-4 w-4" />
              Save team
            </button>
          </div>
        </form>
      </div>
    </Card>
  )
}


function normalizeDepartmentName(value: string) {
  return String(value || '').trim().toLowerCase()
}

async function deletedDepartmentNamesFromCookie() {
  try {
    const store = await cookies()
    const raw = store.get('angelcare_deleted_departments')?.value || ''
    return new Set(
      raw
        .split('|')
        .map((item) => normalizeDepartmentName(decodeURIComponent(item)))
        .filter(Boolean),
    )
  } catch {
    return new Set<string>()
  }
}

function isDeletedDepartmentName(name: string, deleted: Set<string>) {
  return deleted.has(normalizeDepartmentName(name))
}

export default async function Page() {
  const data = await getHRDashboardData()
  const deletedDepartments = await deletedDepartmentNamesFromCookie()

  const staff: Row[] = activeStaff(data.staff || []).filter((row) => !isDeletedDepartmentName(deptOf(row), deletedDepartments))
  const rawDepartments: Row[] = (data.departments || []).filter((row) => !isDeletedDepartmentName(text(row, ['name', 'department'], ''), deletedDepartments))
  const positions: Row[] = (data.positions || []).filter((row) => !isDeletedDepartmentName(deptOf(row), deletedDepartments) && !isDeletedDepartmentName(text(row, ['parent_department', 'sub_department'], ''), deletedDepartments))
  const openings: Row[] = (data.openings || []).filter((row) => !isDeletedDepartmentName(deptOf(row), deletedDepartments) && !isDeletedDepartmentName(text(row, ['parent_department', 'sub_department'], ''), deletedDepartments))
  const activity: Row[] = [...(data.activity || []), ...(data.audit || [])]

  const deptNames = Array.from(
    new Set([
      ...rawDepartments.map((d) => text(d, ['name', 'department'], '')).filter(Boolean),
      ...staff.map(deptOf).filter(Boolean),
      ...positions.map(deptOf).filter(Boolean),
      ...openings.map(deptOf).filter(Boolean),
    ]),
  )

  const departments: DepartmentCommand[] = deptNames.map((name, index) => {
    const record = rawDepartments.find((d) => text(d, ['name', 'department'], '').toLowerCase() === name.toLowerCase()) || {}
    const employees = staff.filter((s) => deptOf(s).toLowerCase() === name.toLowerCase())
    const deptPositions = positions.filter((p) => deptOf(p).toLowerCase() === name.toLowerCase())
    const deptOpenings = openings.filter((o) => deptOf(o).toLowerCase() === name.toLowerCase() && text(o, ['status'], 'open').toLowerCase() === 'open')
    const realCount = employees.length || numberValue(record, ['headcount', 'employees', 'employee_count', 'headcount_target'], 0)

    const readiness = employees.length
      ? avg(employees.map((e) => Number(e?.__sync?.readiness || e?.readiness_score || 0)), clamp(70 + index * 3))
      : clamp(numberValue(record, ['readiness', 'readiness_score'], 0))

    const risk = employees.length
      ? avg(employees.map((e) => Number(e?.__sync?.risk || e?.risk_score || 0)), 0)
      : clamp(numberValue(record, ['risk', 'risk_score'], 0))

    return {
      id: text(record, ['id'], encodeURIComponent(name)),
      name,
      manager: text(record, ['manager', 'owner', 'department_head', 'lead', 'head'], employees[0] ? text(employees[0], ['manager', 'reports_to', 'full_name', 'name'], 'Unassigned') : 'Unassigned'),
      teams: deptPositions.length || numberValue(record, ['teams_count', 'teams'], 0),
      count: realCount,
      openRoles: deptOpenings.length || numberValue(record, ['open_roles', 'openings'], 0),
      readiness,
      risk,
      engagement: clamp(numberValue(record, ['engagement', 'engagement_score'], employees.length ? Math.max(60, readiness - 6) : 0)),
      performance: clamp(numberValue(record, ['performance', 'performance_score'], employees.length ? Math.max(60, readiness - 3) : 0)),
      turnover: clamp(numberValue(record, ['turnover', 'turnover_rate'], 0)),
      status: text(record, ['status'], 'active'),
      employees,
      cities: groupCount(employees, cityOf),
      roles: groupCount(employees, roleOf),
    }
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const orgBuilderDepartments = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    count: dept.count,
    teams: dept.teams,
    manager: dept.manager,
    status: dept.status,
    children: [],
    teamNodes: dept.roles.slice(0, 4).map((role) => ({
      id: `${dept.id}-${role.name}`,
      name: role.name,
      parent: dept.name,
      count: role.count,
    })),
  }))

  const totalEmployees = staff.length || departments.reduce((sum, d) => sum + d.count, 0)
  const totalDepartments = departments.length
  const totalTeams = departments.reduce((sum, d) => sum + d.teams, 0)
  const activeDepartments = departments.filter((d) => d.count > 0).length
  const openRoles = departments.reduce((sum, d) => sum + d.openRoles, 0)
  const orgReadiness = avg(departments.map((d) => d.readiness), 0)
  const orgRisk = avg(departments.map((d) => d.risk), 0)
  const cityCoverage = new Set(staff.map(cityOf).filter(Boolean)).size
  const topDept = departments[0]
  const riskyDept = [...departments].sort((a, b) => b.risk - a.risk)[0]
  const recent = activity.slice(0, 6)

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-700">People architecture OS</p>
                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 xl:text-5xl">Teams & Departments Command Center</h1>
                <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                  Live organizational control for AngelCare departments, team structure, mapped employees, cities, roles, readiness, risk and HR execution layers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 min-w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                  <Search className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-bold text-slate-400">Search departments, teams, managers...</span>
                </div>
                <Link href="/hr/employees" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Employees</Link>
                <Link href="/hr/organization" className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg">Org view</Link>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
              <MetricCard icon={Building2} label="Departments" value={totalDepartments} subtitle={`${activeDepartments} with mapped employees`} tone="violet" />
              <MetricCard icon={Network} label="Teams" value={totalTeams} subtitle="Synced from positions / teams" tone="cyan" />
              <MetricCard icon={Users} label="Employees" value={totalEmployees.toLocaleString()} subtitle="Live active staff mapped" tone="emerald" />
              <MetricCard icon={BriefcaseBusiness} label="Open roles" value={openRoles} subtitle="Department demand" tone="amber" />
              <MetricCard icon={MapPinIcon} label="Cities" value={cityCoverage} subtitle="Live workforce coverage" tone="cyan" />
              <MetricCard icon={BadgeCheck} label="Readiness" value={`${orgReadiness}%`} subtitle="Average org readiness" tone="emerald" />
              <MetricCard icon={ShieldCheck} label="Risk" value={`${orgRisk}%`} subtitle="Average org exposure" tone={orgRisk > 35 ? 'rose' : 'slate'} />
            </section>

            <DepartmentsOrgBuilderClient
              departments={orgBuilderDepartments}
              createAction={createHrRecord}
              departmentsTable={HR_TABLES.departments}
              positionsTable={HR_TABLES.positions}
            />

            
            <section className="grid gap-6 2xl:grid-cols-[1fr_0.52fr]">
              <div className="space-y-4">
                <DepartmentFilesManagerClient departments={departments} />

                {!departments.length ? (
                  <Card title="No departments detected" subtitle="Add departments or map employees to department fields to activate the command center.">
                    <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                      <Building2 className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-lg font-black text-slate-900">Department records are waiting for live data.</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">Create a department below or update employee department fields.</p>
                    </div>
                  </Card>
                ) : null}
              </div>

              <div className="min-w-0 space-y-6">
                <CreateDepartmentPanel />

                <DepartmentsBoardCommandClient />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return <Target className={className} />
}
