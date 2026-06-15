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
import InteractiveMoroccoHRMap from '@/components/hr-production/InteractiveMoroccoHRMap'
import HRStaffIntelligenceNavigator from '@/components/hr-production/HRStaffIntelligenceNavigator'
import HRRecentActivityCommand from '@/components/hr-production/HRRecentActivityCommand'
import InteractiveHeadcountTrend from '@/components/hr-production/InteractiveHeadcountTrend'

const sidebarGroups = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/hr', icon: Home, active: true },
  ]},
  { label: 'People', items: [
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
    { label: 'Onboarding', href: '/hr/onboarding', icon: ClipboardCheck },
    { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
    { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap },
  ]},
  { label: 'Operations', items: [
    { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
    { label: 'Leave Management', href: '/hr/leave', icon: Clock3 },
    { label: 'Work Schedules', href: '/hr/work-schedules', icon: Workflow },
    { label: 'Time Tracking', href: '/hr/time-tracking', icon: Activity },
  ]},
  { label: 'Compliance & Documents', items: [
    { label: 'Documents', href: '/hr/documents', icon: FileBadge2 },
    { label: 'Templates', href: '/hr/templates', icon: FileText },
    { label: 'Policies', href: '/hr/policies', icon: ShieldCheck },
    { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
  ]},
  { label: 'System', items: [
    { label: 'Integrations', href: '/hr/integrations', icon: Sparkles },
    { label: 'Settings', href: '/hr/settings', icon: Settings },
  ]},
]

const quickActions = [
  { label: 'Add Employee', href: '/hr/employees', icon: UserCog },
  { label: 'Create Job', href: '/hr/openings/new', icon: BriefcaseBusiness },
  { label: 'Request Time Off', href: '/hr/leave', icon: CalendarCheck },
  { label: 'Add Document', href: '/hr/documents', icon: FileText },
  { label: 'Schedule Meeting', href: '/hr/calendar', icon: Clock3 },
  { label: 'Create Policy', href: '/hr/templates', icon: ShieldCheck },
  { label: 'Performance Review', href: '/hr/performance-matrix', icon: Gauge },
  { label: 'Generate Report', href: '/hr/documents', icon: BarChart3 },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Number(value || 0)))
}

function rowCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

function sourceConfidence(data: any): 'live' | 'partial' | 'empty' {
  const loadedRows =
    rowCount(data.staff) +
    rowCount(data.openings) +
    rowCount(data.candidates) +
    rowCount(data.attendance) +
    rowCount(data.rosters) +
    rowCount(data.documents) +
    rowCount(data.approvals) +
    rowCount(data.training) +
    rowCount(data.performance)
  const errors = Object.keys(data.errors || {}).length
  if (loadedRows > 0 && errors === 0) return 'live'
  if (loadedRows > 0) return 'partial'
  return 'empty'
}

function sourceLabel(confidence: 'live' | 'partial' | 'empty') {
  if (confidence === 'live') return 'Supabase live'
  if (confidence === 'partial') return 'Partial Supabase sync'
  return 'No live HR rows'
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "violet",
  confidence = "live",
}: {
  title: string;
  value: string;
  detail: string;
  icon: any;
  tone?: "amber" | "blue" | "green" | "cyan" | "violet" | "rose";
  confidence?: "partial" | "live" | "empty";
}) {
  const toneClass =
    tone === "amber"
      ? "from-amber-50 to-white text-amber-700 border-amber-100"
      : tone === "blue"
        ? "from-blue-50 to-white text-blue-700 border-blue-100"
        : tone === "green"
          ? "from-emerald-50 to-white text-emerald-700 border-emerald-100"
          : tone === "cyan"
            ? "from-cyan-50 to-white text-cyan-700 border-cyan-100"
            : tone === "rose"
              ? "from-rose-50 to-white text-rose-700 border-rose-100"
              : "from-violet-50 to-white text-violet-700 border-violet-100";

  return (
    <div className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
            {detail}
          </p>
        </div>
        {Icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <span className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {confidence}
      </span>
    </div>
  );
}


type HRWorkforceGraphRow = Record<string, any>

function hrWfgRows(value: unknown): HRWorkforceGraphRow[] {
  return Array.isArray(value) ? value as HRWorkforceGraphRow[] : []
}

function hrWfgText(value: unknown) {
  return String(value || '').trim()
}

function hrWfgLower(value: unknown) {
  return hrWfgText(value).toLowerCase()
}

function hrWfgDepartment(row: HRWorkforceGraphRow) {
  return hrWfgText(row.department_name || row.department || row.team_name || row.team || row.business_unit || row.unit || 'Unassigned')
}

function hrWfgStatus(row: HRWorkforceGraphRow) {
  return hrWfgLower(row.employment_status || row.status || row.state || row.hr_status)
}

function hrWfgActive(row: HRWorkforceGraphRow) {
  const status = hrWfgStatus(row)
  return !['inactive', 'terminated', 'archived', 'deleted', 'offboarded', 'left', 'resigned'].includes(status)
}

function hrWfgPending(row: HRWorkforceGraphRow) {
  const status = hrWfgStatus(row)
  return ['pending', 'draft', 'invited', 'onboarding', 'probation', 'in_review', 'in review'].includes(status)
}

function hrWfgRisk(row: HRWorkforceGraphRow) {
  const status = hrWfgStatus(row)
  const risk = hrWfgLower(row.risk_level || row.hr_risk || row.compliance_status || row.document_status)
  return ['risk', 'at_risk', 'at risk', 'blocked', 'expired', 'missing', 'suspended'].some((key) => status.includes(key) || risk.includes(key))
}

function hrWfgDate(row: HRWorkforceGraphRow) {
  const value = row.hire_date || row.hired_at || row.start_date || row.joined_at || row.created_at || row.updated_at
  const date = value ? new Date(String(value)) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function hrWfgMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function hrWfgLastMonths(count = 12) {
  const now = new Date()
  const months: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(hrWfgMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return months
}

function hrWfgMonthLabel(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

function hrWfgPct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function hrWfgConic(groups: { label: string; count: number; color?: string }[], total: number, colors: string[]) {
  if (!groups.length || total <= 0) return '#e2e8f0 0% 100%'
  let start = 0
  return groups.map((group, index) => {
    const size = (group.count / total) * 100
    const end = index === groups.length - 1 ? 100 : start + size
    const segment = `${group.color || colors[index % colors.length]} ${start}% ${end}%`
    start = end
    return segment
  }).join(', ')
}

function hrWfgGroupCounts(items: HRWorkforceGraphRow[], picker: (row: HRWorkforceGraphRow) => string) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = picker(item)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function hrWfgTrend(staff: HRWorkforceGraphRow[], totalStaff: number) {
  const months = hrWfgLastMonths(12)
  const monthly = new Map<string, number>()
  for (const month of months) monthly.set(month, 0)

  for (const row of staff) {
    const date = hrWfgDate(row)
    if (!date) continue
    const key = hrWfgMonthKey(date)
    if (monthly.has(key)) monthly.set(key, (monthly.get(key) || 0) + 1)
  }

  const hasRealDates = [...monthly.values()].some(Boolean)
  let running = Math.max(0, totalStaff - [...monthly.values()].reduce((sum, value) => sum + value, 0))
  const values = months.map((month) => {
    running += monthly.get(month) || 0
    return running
  })

  return {
    months,
    values: hasRealDates ? values : months.map(() => totalStaff),
    hasRealDates,
  }
}

function HRWorkforceGraphDeck({
  data,
  totalStaff,
  activeStaff,
  pendingApprovals,
  validatedAttendance,
  openQuality,
}: {
  data: any
  totalStaff: number
  activeStaff: number
  pendingApprovals: number
  validatedAttendance: number
  openQuality: number
}) {
  const staff = hrWfgRows(data.staff)
  const attendance = hrWfgRows(data.attendance)
  const colors = ['#8b5cf6', '#2563eb', '#06b6d4', '#14b8a6', '#22c55e', '#f59e0b', '#64748b', '#a855f7']

  const departments = hrWfgGroupCounts(staff, hrWfgDepartment).slice(0, 7)
  const departmentTotal = staff.length || totalStaff
  const departmentConic = hrWfgConic(departments, Math.max(departmentTotal, 1), colors)

  const trend = hrWfgTrend(staff, totalStaff)

  const active = staff.length ? staff.filter(hrWfgActive).length : activeStaff
  const pending = staff.filter(hrWfgPending).length + pendingApprovals
  const atRisk = staff.filter(hrWfgRisk).length + openQuality
  const inactive = Math.max(0, totalStaff - active)

  const statusGroups = [
    { label: 'Active', count: active, color: '#22c55e' },
    { label: 'Validated attendance', count: validatedAttendance, color: '#3b82f6' },
    { label: 'Pending', count: pending, color: '#f59e0b' },
    { label: 'At risk', count: atRisk, color: '#ef4444' },
    { label: 'Inactive / other', count: inactive, color: '#64748b' },
  ].filter((item) => item.count > 0)

  const statusTotal = Math.max(statusGroups.reduce((sum, item) => sum + item.count, 0), 1)
  const statusConic = hrWfgConic(statusGroups, statusTotal, colors)

  return (
    <>
      <Panel title="Workforce Overview" subtitle={staff.length ? 'Live headcount by department' : 'Waiting for live staff rows'} className="col-span-12 xl:col-span-4" hideView>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Production view</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{staff.length ? `${staff.length} staff/profile rows loaded` : 'No staff records loaded yet'}</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">● Live</span>
              <span className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">{departments.length} groups</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[190px_1fr]">
            <div className="relative grid h-44 w-44 place-items-center rounded-full shadow-inner" style={{ background: `conic-gradient(${departmentConic})` }}>
              <div className="absolute inset-2 rounded-full border border-white/70" />
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-[inset_0_4px_20px_rgba(15,23,42,0.06)]">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-950">{formatNumber(departmentTotal)}</div>
                  <div className="text-[10px] font-black text-slate-400">Live total</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {departments.map((group, index) => (
                <div key={group.label} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-700">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span>{group.count} · {hrWfgPct(group.count, departmentTotal)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full" style={{ width: `${hrWfgPct(group.count, departmentTotal)}%`, background: colors[index % colors.length] }} />
                  </div>
                </div>
              ))}
              {!departments.length ? <Empty title="No department distribution" text="Add department/team fields on staff profiles to activate this view." /> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">Coverage · {hrWfgPct(departmentTotal, Math.max(totalStaff, 1))}%</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">Departments · {departments.length}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">{staff.length ? 'Synced' : 'Awaiting data'}</div>
          </div>
        </div>
      </Panel>

      <InteractiveHeadcountTrend
        months={trend.months.map(hrWfgMonthLabel)}
        values={trend.values}
        hasRealDates={trend.hasRealDates}
        attendanceRows={attendance.length}
      />

      <Panel title="Workforce by Status" subtitle="Operational split from HR records" className="col-span-12 xl:col-span-4" hideView>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Live status model</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Built from staff, approvals, attendance and risk indicators.</p>
            </div>
            <span className={`rounded-xl border px-3 py-2 text-xs font-black ${atRisk > 0 ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{atRisk > 0 ? `${atRisk} risk signal(s)` : 'Stable'}</span>
          </div>

          <div className="grid gap-5 md:grid-cols-[170px_1fr]">
            <div className="grid h-40 w-40 place-items-center rounded-full shadow-inner" style={{ background: `conic-gradient(${statusConic})` }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-[inset_0_4px_20px_rgba(15,23,42,0.06)]">
                <div className="text-center">
                  <b className="text-2xl text-slate-950">{formatNumber(totalStaff)}</b>
                  <div className="text-[10px] font-black text-slate-400">Total</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {statusGroups.map((item) => (
                <div key={item.label} className="block rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <div className="mb-1 flex justify-between text-xs font-black text-slate-700">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full" style={{ width: `${hrWfgPct(item.count, statusTotal)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
              {!statusGroups.length ? <Empty title="No workforce status data" text="Staff status records are required to activate this operational split." /> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">Active · {active}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">Pending · {pending}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-600">At risk · {atRisk}</div>
          </div>
        </div>
      </Panel>
    </>
  )
}


type HRLiveInsightRow = Record<string, any>

function hrLisRows(value: unknown): HRLiveInsightRow[] {
  return Array.isArray(value) ? value as HRLiveInsightRow[] : []
}

function hrLisText(value: unknown) {
  return String(value || '').toLowerCase()
}

function hrLisNumber(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function hrLisDate(value: unknown) {
  if (!value) return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function hrLisDaysBetween(start: unknown, end: unknown) {
  const a = hrLisDate(start)
  const b = hrLisDate(end)
  if (!a || !b) return null
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

function hrLisAverage(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value))
  if (!clean.length) return null
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

function hrLisStatus(row: HRLiveInsightRow) {
  return hrLisText(row.status || row.state || row.attendance_status || row.pipeline_status || row.training_status || row.review_status)
}

function hrLisAbsent(row: HRLiveInsightRow) {
  const status = hrLisStatus(row)
  const type = hrLisText(row.type || row.exception_type || row.reason)
  return ['absent', 'absence', 'no_show', 'no show'].some((key) => status.includes(key) || type.includes(key))
}

function hrLisOvertime(row: HRLiveInsightRow) {
  const status = hrLisStatus(row)
  const overtimeMinutes = hrLisNumber(row.overtime_minutes || row.extra_minutes)
  const overtimeHours = hrLisNumber(row.overtime_hours || row.extra_hours)
  return overtimeMinutes > 0 || overtimeHours > 0 || status.includes('overtime') || status.includes('extra')
}

function hrLisOffered(row: HRLiveInsightRow) {
  const status = hrLisText(row.status || row.pipeline_status || row.offer_status || row.stage)
  return ['offer', 'offered', 'accepted', 'hired'].some((key) => status.includes(key))
}

function hrLisAccepted(row: HRLiveInsightRow) {
  const status = hrLisText(row.status || row.pipeline_status || row.offer_status || row.stage)
  return ['accepted', 'hired', 'joined', 'signed'].some((key) => status.includes(key))
}

function hrLisTrainingComplete(row: HRLiveInsightRow) {
  const status = hrLisText(row.status || row.training_status || row.completion_status)
  const progress = hrLisNumber(row.progress || row.completion_rate || row.completion_percent)
  return progress >= 100 || ['complete', 'completed', 'validated', 'passed', 'certified'].some((key) => status.includes(key))
}

function hrLisRating(row: HRLiveInsightRow) {
  const raw = hrLisNumber(row.rating || row.score || row.overall_score || row.performance_score || row.engagement_score)
  if (!raw) return null
  if (raw > 5 && raw <= 100) return raw / 20
  if (raw > 5 && raw <= 10) return raw / 2
  return Math.min(raw, 5)
}

function hrLisTone(value: number | null, goodMin: number, warningMin: number, reverse = false) {
  if (value === null) return 'slate'
  if (reverse) {
    if (value <= goodMin) return 'emerald'
    if (value <= warningMin) return 'amber'
    return 'rose'
  }
  if (value >= goodMin) return 'emerald'
  if (value >= warningMin) return 'amber'
  return 'rose'
}

function HRLiveInsightCard({
  title,
  value,
  subtitle,
  tone,
  progress,
  source,
  detail,
}: {
  title: string
  value: string
  subtitle: string
  tone: 'emerald' | 'cyan' | 'violet' | 'blue' | 'amber' | 'rose' | 'slate'
  progress: number
  source: string
  detail: string
}) {
  const toneMap: Record<string, string> = {
    emerald: 'from-emerald-400 to-teal-500 text-emerald-600',
    cyan: 'from-cyan-400 to-sky-500 text-cyan-600',
    violet: 'from-violet-500 to-fuchsia-500 text-violet-600',
    blue: 'from-blue-500 to-indigo-500 text-blue-600',
    amber: 'from-amber-400 to-orange-400 text-amber-600',
    rose: 'from-rose-400 to-red-500 text-rose-600',
    slate: 'from-slate-400 to-slate-600 text-slate-600',
  }

  const gradient = toneMap[tone].split(' ').slice(0, 2).join(' ')
  const textClass = toneMap[tone].split(' ').at(-1) || 'text-slate-600'

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(124,58,237,0.16)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <span className="text-lg font-black">↗</span>
        </div>
        <span className={`rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${textClass}`}>
          Live
        </span>
      </div>

      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 min-h-[28px] text-[11px] font-black text-slate-500">{subtitle}</p>

      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black text-slate-400">
        <span className="rounded-xl bg-slate-50 px-2 py-1">{source}</span>
        <span className="rounded-xl bg-slate-50 px-2 py-1 text-right">{detail}</span>
      </div>
    </article>
  )
}

function HRLiveInsightStrip({ data, metrics }: { data: any; metrics: any }) {
  const attendance = hrLisRows(data.attendance)
  const payroll = hrLisRows((data as any).payroll)
  const candidates = hrLisRows((data as any).candidates)
  const training = hrLisRows(data.training)
  const performance = hrLisRows(data.performance)

  const attendanceRecords = Number(metrics.attendanceRecords || attendance.length || 0)
  const absentCount = attendance.filter(hrLisAbsent).length
  const exceptionCount = Number(metrics.attendanceExceptions || 0)
  const absenteeismRate = attendanceRecords ? Math.round((absentCount / attendanceRecords) * 100) : null

  const overtimeSignals = attendance.filter(hrLisOvertime).length + payroll.filter(hrLisOvertime).length
  const overtimeProgress = attendanceRecords ? Math.round((overtimeSignals / Math.max(attendanceRecords, 1)) * 100) : 0

  const hiredCandidates = candidates.filter((row) => ['hired', 'joined', 'accepted'].some((key) => hrLisStatus(row).includes(key)))
  const hireDurations = hiredCandidates
    .map((row) => hrLisDaysBetween(row.applied_at || row.created_at || row.application_date, row.hired_at || row.hire_date || row.updated_at))
    .filter((value): value is number => value !== null)
  const avgHireDays = hrLisAverage(hireDurations)

  const offered = candidates.filter(hrLisOffered)
  const accepted = offered.filter(hrLisAccepted)
  const offerAcceptance = offered.length ? Math.round((accepted.length / offered.length) * 100) : null

  const completedTraining = training.filter(hrLisTrainingComplete).length
  const trainingCompletion = training.length ? Math.round((completedTraining / training.length) * 100) : null

  const ratings = performance.map(hrLisRating).filter((value): value is number => value !== null)
  const engagement = hrLisAverage(ratings)

  const cards = [
    {
      title: 'Absenteeism Rate',
      value: absenteeismRate === null ? '—' : `${absenteeismRate}%`,
      subtitle: attendanceRecords ? `${absentCount} absence signal(s) from ${attendanceRecords} attendance rows` : 'Waiting for attendance records',
      tone: hrLisTone(absenteeismRate, 3, 8, true),
      progress: absenteeismRate ?? 0,
      source: `${attendance.length} attendance`,
      detail: `${exceptionCount} exceptions`,
    },
    {
      title: 'Overtime Control',
      value: `${overtimeSignals}`,
      subtitle: overtimeSignals ? 'Overtime signals requiring workforce review' : 'No overtime signals detected',
      tone: overtimeSignals > 10 ? 'rose' : overtimeSignals > 0 ? 'amber' : 'emerald',
      progress: overtimeProgress,
      source: `${attendance.length + payroll.length} rows`,
      detail: `${overtimeProgress}% exposure`,
    },
    {
      title: 'Time to Hire',
      value: avgHireDays === null ? '—' : `${Math.round(avgHireDays)} days`,
      subtitle: hireDurations.length ? `Average from ${hireDurations.length} hired candidate(s)` : 'Needs applied/hired dates',
      tone: avgHireDays === null ? 'slate' : avgHireDays <= 14 ? 'emerald' : avgHireDays <= 30 ? 'amber' : 'rose',
      progress: avgHireDays === null ? 0 : Math.max(8, Math.min(100, 100 - Math.round(avgHireDays))),
      source: `${candidates.length} candidates`,
      detail: `${hiredCandidates.length} hired`,
    },
    {
      title: 'Offer Acceptance',
      value: offerAcceptance === null ? '—' : `${offerAcceptance}%`,
      subtitle: offered.length ? `${accepted.length} accepted from ${offered.length} offer-stage candidates` : 'No offer-stage candidates yet',
      tone: hrLisTone(offerAcceptance, 80, 55),
      progress: offerAcceptance ?? 0,
      source: `${offered.length} offers`,
      detail: `${accepted.length} accepted`,
    },
    {
      title: 'Training Completion',
      value: trainingCompletion === null ? '—' : `${trainingCompletion}%`,
      subtitle: training.length ? `${completedTraining} completed from ${training.length} training records` : 'Waiting for training rows',
      tone: hrLisTone(trainingCompletion, 85, 60),
      progress: trainingCompletion ?? 0,
      source: `${training.length} records`,
      detail: `${completedTraining} complete`,
    },
    {
      title: 'Employee Engagement',
      value: engagement === null ? '—' : `${engagement.toFixed(1)} / 5`,
      subtitle: ratings.length ? `Average from ${ratings.length} performance review(s)` : 'Needs review scores',
      tone: engagement === null ? 'slate' : engagement >= 4 ? 'emerald' : engagement >= 3 ? 'amber' : 'rose',
      progress: engagement === null ? 0 : Math.round((engagement / 5) * 100),
      source: `${performance.length} reviews`,
      detail: ratings.length ? 'scored' : 'unscored',
    },
  ] as const

  return (
    <div className="col-span-12 grid grid-cols-2 gap-4 lg:grid-cols-6">
      {cards.map((card) => <HRLiveInsightCard key={card.title} {...card} />)}
    </div>
  )
}


type HRMiniRow = Record<string, any>

function hrMiniRows(value: unknown): HRMiniRow[] {
  return Array.isArray(value) ? value as HRMiniRow[] : []
}

function hrMiniText(value: unknown, fallback = '') {
  const v = String(value || '').trim()
  return v || fallback
}

function hrMiniLower(value: unknown) {
  return hrMiniText(value).toLowerCase()
}

function hrMiniStatus(row: HRMiniRow) {
  return hrMiniLower(row.status || row.stage || row.pipeline_status || row.application_status || row.candidate_status)
}

function hrMiniDepartment(row: HRMiniRow) {
  return hrMiniText(row.department_name || row.department || row.team_name || row.team || row.business_unit || row.target_department, 'Unassigned')
}

function hrMiniRecruitStage(row: HRMiniRow) {
  const status = hrMiniStatus(row)
  if (['hired', 'joined', 'accepted'].some((x) => status.includes(x))) return 'Hired'
  if (['offer', 'offered'].some((x) => status.includes(x))) return 'Offered'
  if (['interview', 'meeting'].some((x) => status.includes(x))) return 'Interview'
  if (['screen', 'shortlist', 'qualified'].some((x) => status.includes(x))) return 'Screening'
  return 'Applicants'
}

function HRRecruitmentPipelinePanel({ data }: { data: any }) {
  const candidates = hrMiniRows((data as any).candidates || (data as any).recruitment)
  const openings = hrMiniRows((data as any).openings)
  const stages = ['Applicants', 'Screening', 'Interview', 'Offered', 'Hired']
  const stageCounts = stages.map((stage) => ({
    stage,
    count: candidates.filter((candidate) => hrMiniRecruitStage(candidate) === stage).length,
  }))

  const total = Math.max(candidates.length, stageCounts.reduce((sum, item) => sum + item.count, 0), 1)
  const departmentMap = new Map<string, number>()

  for (const candidate of candidates) {
    const department = hrMiniDepartment(candidate)
    departmentMap.set(department, (departmentMap.get(department) || 0) + 1)
  }

  for (const opening of openings) {
    const department = hrMiniDepartment(opening)
    if (!departmentMap.has(department)) departmentMap.set(department, 0)
  }

  const departmentRows = [...departmentMap.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count || a.department.localeCompare(b.department))
    .slice(0, 6)

  const hiredCount = stageCounts.find((x) => x.stage === 'Hired')?.count || 0
  const offeredCount = stageCounts.find((x) => x.stage === 'Offered')?.count || 0
  const conversion = candidates.length ? Math.round((hiredCount / candidates.length) * 100) : 0
  const offerAcceptance = offeredCount ? Math.round((hiredCount / offeredCount) * 100) : 0

  return (
    <Panel title="Recruitment Pipeline" subtitle="Live candidate stages and department demand" className="col-span-12 xl:col-span-4" hideView>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Candidates<br/><span className="text-lg text-slate-950">{candidates.length}</span></div>
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Open roles<br/><span className="text-lg text-slate-950">{openings.length}</span></div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Conversion<br/><span className="text-lg text-slate-950">{conversion}%</span></div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            {stageCounts.map((item, index) => (
              <div key={item.stage} className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-800">
                  <span>{item.stage}</span>
                  <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.max(4, Math.round((item.count / total) * 100))}%` }} />
                </div>
                <p className="mt-1 text-[10px] font-black text-slate-400">Stage {index + 1} · {Math.round((item.count / total) * 100)}%</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Offer acceptance</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{offerAcceptance}%</p>
              <p className="text-[11px] font-bold text-slate-500">{hiredCount} hired from {offeredCount} offer-stage candidates</p>
            </div>

            {departmentRows.map((row) => (
              <div key={row.department}>
                <div className="mb-1 flex justify-between">
                  <span>{row.department}</span>
                  <span>{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.max(4, Math.round((row.count / Math.max(1, candidates.length)) * 100))}%` }} />
                </div>
              </div>
            ))}

            {!candidates.length ? <Empty title="No live candidates" text="Recruitment pipeline will activate when candidate rows are loaded." /> : null}
          </div>
        </div>
      </div>
    </Panel>
  )
}

const HR_DASHBOARD_CITY_COORDS: Record<string, { lat: number; lng: number; aliases: string[] }> = {
  Rabat: { lat: 34.0209, lng: -6.8416, aliases: ['rabat'] },
  Salé: { lat: 34.0531, lng: -6.7985, aliases: ['sale', 'salé'] },
  Temara: { lat: 33.9287, lng: -6.9067, aliases: ['temara', 'témara'] },
  Casablanca: { lat: 33.5731, lng: -7.5898, aliases: ['casablanca', 'casa'] },
  Bouznika: { lat: 33.7894, lng: -7.1597, aliases: ['bouznika'] },
  Tiflet: { lat: 33.8947, lng: -6.3065, aliases: ['tiflet', 'tifelet'] },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498, aliases: ['beni mellal', 'béni mellal', 'bni mellal'] },
  Tanger: { lat: 35.7595, lng: -5.834, aliases: ['tanger', 'tangier'] },
  Marrakech: { lat: 31.6295, lng: -7.9811, aliases: ['marrakech', 'marrakesh'] },
  Agadir: { lat: 30.4278, lng: -9.5981, aliases: ['agadir'] },
  'Fès': { lat: 34.0331, lng: -5.0003, aliases: ['fes', 'fès', 'fez'] },
}

function hrMiniCity(row: HRMiniRow) {
  const raw = hrMiniLower(row.city || row.work_city || row.location_city || row.base_city || row.home_city || row.employee_city || row.staff_city || row.current_city || row.region || row.address || row.metadata?.city || row.data?.city)
  for (const [city, meta] of Object.entries(HR_DASHBOARD_CITY_COORDS)) {
    if (meta.aliases.some((alias) => raw.includes(alias))) return city
  }
  return raw ? hrMiniText(row.city || row.location || row.region, 'Location missing') : 'Location missing'
}

function hrMiniHash(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

function hrMiniCoords(city: string) {
  const known = HR_DASHBOARD_CITY_COORDS[city]
  if (known) return { lat: known.lat, lng: known.lng }
  const hash = hrMiniHash(city)
  const angle = ((hash % 360) * Math.PI) / 180
  const radius = 0.35 + (hash % 9) * 0.055
  return {
    lat: HR_DASHBOARD_CITY_COORDS.Rabat.lat + Math.sin(angle) * radius,
    lng: HR_DASHBOARD_CITY_COORDS.Rabat.lng + Math.cos(angle) * radius,
  }
}

function hrMiniActive(row: HRMiniRow) {
  const status = hrMiniLower(row.employment_status || row.status || row.state || row.hr_status)
  return !['inactive', 'terminated', 'archived', 'deleted', 'offboarded', 'left', 'resigned'].includes(status)
}

function hrMiniPending(row: HRMiniRow) {
  const status = hrMiniLower(row.employment_status || row.status || row.state || row.hr_status)
  return ['pending', 'draft', 'invited', 'onboarding', 'probation', 'in_review', 'in review'].some((key) => status.includes(key))
}

function hrMiniRisk(row: HRMiniRow) {
  const status = hrMiniLower(row.employment_status || row.status || row.state || row.hr_status)
  const risk = hrMiniLower(row.risk_level || row.hr_risk || row.compliance_status || row.document_status)
  return ['risk', 'at_risk', 'at risk', 'blocked', 'expired', 'missing', 'suspended'].some((key) => status.includes(key) || risk.includes(key))
}

function HRMapPanel({ data, activeStaff, pendingApprovals, openQuality }: { data: any; activeStaff: number; pendingApprovals: number; openQuality: number }) {
  const staff = hrMiniRows(data.staff)
  const cityMap = new Map<string, any>()

  for (const row of staff) {
    const city = hrMiniCity(row)
    const coords = hrMiniCoords(city)
    const marker = cityMap.get(city) || {
      city,
      lat: coords.lat,
      lng: coords.lng,
      count: 0,
      active: 0,
      pending: 0,
      risk: 0,
      employees: [],
    }

    marker.count += 1
    if (hrMiniActive(row)) marker.active += 1
    if (hrMiniPending(row)) marker.pending += 1
    if (hrMiniRisk(row)) marker.risk += 1
    marker.employees.push({
      id: String(row.id || row.employee_id || row.staff_id || `${city}-${marker.count}`),
      name: hrMiniText(row.full_name || row.name || row.employee_name || row.staff_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(), 'Unnamed employee'),
      role: hrMiniText(row.position_title || row.position || row.role || row.job_title || row.function_title, 'Role not specified'),
      department: hrMiniDepartment(row),
      status: hrMiniText(row.employment_status || row.status || row.state, 'unknown'),
      city,
      lat: coords.lat,
      lng: coords.lng,
      active: hrMiniActive(row),
      pending: hrMiniPending(row),
      risk: hrMiniRisk(row),
    })
    cityMap.set(city, marker)
  }

  if (!staff.length && activeStaff > 0) {
    const coords = hrMiniCoords('Rabat')
    cityMap.set('Rabat', {
      city: 'Rabat',
      lat: coords.lat,
      lng: coords.lng,
      count: activeStaff,
      active: activeStaff,
      pending: pendingApprovals,
      risk: openQuality,
      employees: [],
    })
  }

  const markers = [...cityMap.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
  const riskTotal = markers.reduce((sum, marker) => sum + marker.risk, 0) || openQuality

  return (
    <Panel title="Employee Distribution by Location" subtitle="Interactive OpenStreetMap HR zoning" className="col-span-12 xl:col-span-4" hideView>
      <InteractiveMoroccoHRMap markers={markers} total={staff.length || activeStaff} approvals={pendingApprovals} risks={riskTotal} />
    </Panel>
  )
}

function hrMiniPerfRating(row: HRMiniRow) {
  const raw = Number(row.rating || row.score || row.overall_score || row.performance_score || row.review_score || row.engagement_score || row.final_score || 0)
  if (!Number.isFinite(raw) || raw <= 0) return null
  if (raw > 10 && raw <= 100) return Math.min(5, raw / 20)
  if (raw > 5 && raw <= 10) return Math.min(5, raw / 2)
  return Math.min(5, raw)
}

function hrMiniPerfBand(score: number | null) {
  if (score === null) return 'Unscored'
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.8) return 'Good'
  if (score >= 3) return 'Average'
  if (score >= 2) return 'Below Average'
  return 'Poor'
}

function hrMiniPerfColor(label: string) {
  if (label === 'Excellent') return '#22c55e'
  if (label === 'Good') return '#3b82f6'
  if (label === 'Average') return '#f59e0b'
  if (label === 'Below Average') return '#ef4444'
  if (label === 'Poor') return '#64748b'
  return '#cbd5e1'
}

function hrMiniConic(parts: { label: string; count: number; color: string }[]) {
  const total = Math.max(1, parts.reduce((sum, part) => sum + part.count, 0))
  let start = 0
  return parts.map((part, index) => {
    const size = (part.count / total) * 100
    const end = index === parts.length - 1 ? 100 : start + size
    const segment = `${part.color} ${start}% ${end}%`
    start = end
    return segment
  }).join(', ')
}

function HRPerformanceOverviewPanel({ data, activeStaff }: { data: any; activeStaff: number }) {
  const reviews = hrMiniRows(data.performance)
  const staff = hrMiniRows(data.staff)
  const scored = reviews
    .map((row) => ({ row, score: hrMiniPerfRating(row) }))
    .filter((item): item is { row: HRMiniRow; score: number } => item.score !== null)

  const avgScore = scored.length ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length : null
  const labels = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor']
  const bands = labels.map((label) => ({
    label,
    count: scored.filter((item) => hrMiniPerfBand(item.score) === label).length,
    color: hrMiniPerfColor(label),
  }))
  const totalScored = Math.max(1, scored.length)
  const conic = hrMiniConic(bands)
  const coverage = staff.length ? Math.round((reviews.length / Math.max(staff.length, 1)) * 100) : reviews.length ? 100 : 0
  const riskReviews = scored.filter((item) => item.score < 3).sort((a, b) => a.score - b.score).slice(0, 3)
  const topReviews = scored.filter((item) => item.score >= 4).sort((a, b) => b.score - a.score).slice(0, 3)

  return (
    <Panel title="Performance Overview" subtitle="Live review scores, coverage and coaching signals" className="col-span-12 xl:col-span-4" hideView>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Production performance model</p>
            <p className="mt-1 text-sm font-bold text-slate-600">{reviews.length ? `${reviews.length} review row(s) loaded` : 'No performance review rows loaded yet'}</p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-xs font-black ${avgScore !== null ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {avgScore !== null ? 'Live scored' : 'Needs scores'}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[170px_1fr]">
          <div className="grid h-40 w-40 place-items-center rounded-full shadow-inner" style={{ background: `conic-gradient(${conic})` }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-[inset_0_4px_20px_rgba(15,23,42,0.06)]">
              <div>
                <b className="text-2xl text-slate-950">{avgScore === null ? '—' : avgScore.toFixed(1)}</b>
                <div className="text-[10px] font-black text-slate-400">/ 5 average</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {bands.map((band) => (
              <div key={band.label} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                <div className="mb-1 flex justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: band.color }} />{band.label}</span>
                  <span>{band.count} · {Math.round((band.count / totalScored) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.round((band.count / totalScored) * 100)}%`, background: band.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Coverage<br/><span className={coverage >= 80 ? 'text-emerald-600' : coverage >= 40 ? 'text-amber-600' : 'text-rose-600'}>{coverage}%</span></div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Scored<br/><span className="text-slate-950">{scored.length}</span></div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Top<br/><span className="text-emerald-600">{topReviews.length}</span></div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Risk<br/><span className={riskReviews.length ? 'text-rose-600' : 'text-emerald-600'}>{riskReviews.length}</span></div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Top performers</p>
            <div className="space-y-2">
              {topReviews.map((item, index) => (
                <div key={`top-${index}`} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                  {hrMiniText(item.row.employee_name || item.row.staff_name || item.row.full_name || item.row.name, 'Employee')} · {item.score.toFixed(1)}
                </div>
              ))}
              {!topReviews.length ? <p className="text-xs font-bold text-slate-400">No top scored reviews yet.</p> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Coaching watchlist</p>
            <div className="space-y-2">
              {riskReviews.map((item, index) => (
                <div key={`risk-${index}`} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-800">
                  {hrMiniText(item.row.employee_name || item.row.staff_name || item.row.full_name || item.row.name, 'Employee')} · {item.score.toFixed(1)}
                </div>
              ))}
              {!riskReviews.length ? <p className="text-xs font-bold text-slate-400">No low-score risk detected.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}


function Panel({
  title,
  subtitle,
  children,
  className = '',
  hideView = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  hideView?: boolean
}) {
  return (
    <section className={`overflow-hidden rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur-xl ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-bold text-slate-400">{subtitle}</p> : null}
        </div>
        {!hideView ? (
          <button className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">
            View →
          </button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
      <p className="text-sm font-black text-slate-700">{title}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{text}</p>
    </div>
  )
}

export default async function Page() {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)
  const confidence = sourceConfidence(data)
  const confidenceLabel = sourceLabel(confidence)
  const sourceErrors = Object.keys(data.errors || {}).length

  const totalStaff = Number(metrics.totalStaff || metrics.staffCount || rowCount(data.staff) || 0)
  const activeStaff = Number(metrics.activeStaff || metrics.activeCount || 0)
  const openRoles = Number(metrics.openRoles || metrics.openingsCount || 0)
  const pendingApprovals = Number(metrics.pendingApprovals || metrics.approvalsPending || 0)
  const openQuality = Number(metrics.openQuality || metrics.openQualityIssues || 0)
  const missingDocs = Number(metrics.missingDocs || metrics.missingDocuments || 0)
  const rosterConflicts = Number(metrics.rosterConflicts || metrics.conflictsCount || 0)
  const attendanceRecords = Number(metrics.attendanceRecords || metrics.attendanceCount || 0)
  const attendanceExceptions = Number(metrics.attendanceExceptions || metrics.exceptionsCount || 0)
  const validatedAttendance = Number(metrics.validatedAttendance || metrics.validatedAttendanceRecords || 0)
  const attendanceRate = attendanceRecords ? Math.round((validatedAttendance / attendanceRecords) * 100) : 0
  const openTasks = Number(metrics.openTasks || 0)

  const staffNavigatorEmployees = (Array.isArray(data.staff) ? data.staff : []).map((row: any, index: number) => {
    const status = String(row.employment_status || row.status || row.state || row.hr_status || '').toLowerCase()
    const riskSource = String(row.risk_level || row.hr_risk || row.compliance_status || row.document_status || '').toLowerCase()
    const risk = ['risk', 'at_risk', 'at risk', 'blocked', 'expired', 'missing', 'suspended'].some((key) =>
      status.includes(key) || riskSource.includes(key)
    )
    const pending = ['pending', 'draft', 'invited', 'onboarding', 'probation', 'in_review', 'in review'].some((key) => status.includes(key))
    const active = !['inactive', 'terminated', 'archived', 'deleted', 'offboarded', 'left', 'resigned'].includes(status)

    return {
      id: String(row.id || row.employee_id || row.staff_id || `employee-${index}`),
      name: String(row.full_name || row.name || row.employee_name || row.staff_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unnamed employee'),
      department: String(row.department_name || row.department || row.team_name || row.team || row.business_unit || 'Unassigned'),
      city: String(row.city || row.work_city || row.location_city || row.base_city || row.home_city || row.employee_city || row.staff_city || row.current_city || row.region || 'Location missing'),
      role: String(row.position_title || row.position || row.role || row.job_title || row.function_title || 'Role not specified'),
      status: String(row.employment_status || row.status || row.state || 'unknown'),
      risk,
      pending,
      active,
    }
  })

  const hrRiskScore = sourceErrors + openQuality + missingDocs + rosterConflicts + attendanceExceptions

  const alerts = [
    ['High Attrition Risk', `${Math.max(openQuality, 1)} workforce signals need HR review`, '10m ago'],
    ['Pending Approvals', `${pendingApprovals} requests are waiting for validation`, '30m ago'],
    ['Compliance Alert', `${missingDocs} documents require attention`, '2h ago'],
    ['Roster Conflict', `${rosterConflicts} schedule conflicts detected`, '5h ago'],
  ]


  const hrRecentActivityItems = [
    ...((Array.isArray((data as any).tasks) ? (data as any).tasks : []).slice(0, 10).map((row: any, index: number) => ({
      id: String(row.id || `task-${index}`),
      title: String(row.title || row.name || 'HR task'),
      subtitle: String(row.description || row.summary || 'HR execution item'),
      category: 'Workforce',
      categoryKey: 'workforce' as const,
      status: String(row.status || 'open'),
      priority: String(row.priority || 'medium'),
      owner: String(row.assignee_name || row.owner_name || row.actor_name || 'HR team'),
      department: String(row.department || row.department_name || 'HR Operations'),
      created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    }))),
    ...((Array.isArray((data as any).recruitment) ? (data as any).recruitment : Array.isArray((data as any).candidates) ? (data as any).candidates : []).slice(0, 8).map((row: any, index: number) => ({
      id: String(row.id || `recruitment-${index}`),
      title: String(row.title || row.position_title || row.role || row.name || 'Recruitment activity'),
      subtitle: String(row.stage || row.status || row.notes || 'Candidate pipeline item'),
      category: 'Recruitment',
      categoryKey: 'recruitment' as const,
      status: String(row.status || row.stage || 'open'),
      priority: String(row.priority || 'high'),
      owner: String(row.owner_name || row.recruiter_name || row.candidate_name || 'Talent team'),
      department: String(row.department || row.department_name || 'Recruitment'),
      created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    }))),
    ...((Array.isArray((data as any).documents) ? (data as any).documents : []).slice(0, 6).map((row: any, index: number) => ({
      id: String(row.id || `document-${index}`),
      title: String(row.title || row.name || 'Compliance document'),
      subtitle: String(row.document_type || row.status || 'Document workflow item'),
      category: 'Compliance',
      categoryKey: 'compliance' as const,
      status: String(row.status || 'review'),
      priority: String(row.priority || 'medium'),
      owner: String(row.owner_name || row.actor_name || 'Compliance desk'),
      department: String(row.department || 'Compliance'),
      created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    }))),
    ...((Array.isArray((data as any).approvals) ? (data as any).approvals : []).slice(0, 6).map((row: any, index: number) => ({
      id: String(row.id || `approval-${index}`),
      title: String(row.title || row.name || 'Approval request'),
      subtitle: String(row.request_type || row.status || 'Validation workflow'),
      category: 'Approvals',
      categoryKey: 'approvals' as const,
      status: String(row.status || 'pending'),
      priority: String(row.priority || 'medium'),
      owner: String(row.owner_name || row.requester_name || 'HR approval desk'),
      department: String(row.department || 'HR'),
      created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    }))),
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
    .slice(0, 24)

  return (
    <main className="fixed inset-x-0 bottom-0 top-[112px] z-[40] overflow-hidden bg-[#f8fafc] text-slate-900">
      <div className="grid h-full grid-cols-[250px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-slate-200/80 bg-white/95 px-3 py-4 shadow-[24px_0_80px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600 text-white shadow-xl shadow-violet-200"><Sparkles className="h-5 w-5" /></div>
            <div><div className="text-sm font-black text-slate-950">AngelCare HR</div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">Command OS</div></div>
          </div>
          <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {sidebarGroups.map((group) => <div key={group.label}><div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div><div className="space-y-1">{group.items.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${item.href === '/hr' ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><item.icon className="h-4 w-4" />{item.label}</Link>)}</div></div>)}
          </nav>
          <Link href="/ai-command-center/hr-copilot" className="mt-4 flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 shadow-sm"><span>Ask Angel AI</span><Sparkles className="h-4 w-4" /></Link>
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#ede9fe_0,transparent_32%),radial-gradient(circle_at_top_right,#e0f2fe_0,transparent_28%),#f8fafc] p-5">
          <div className="sticky top-0 z-40 mb-5 rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 backdrop-blur-2xl">
            <header className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-violet-500"><LayoutDashboard className="h-4 w-4" /> Dashboard</div>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">HR Operational Overview</h1>
                <p className="text-sm font-semibold text-slate-500">
                  Persistent overhead panel · real HR repository snapshot · {confidenceLabel}
                  {sourceErrors ? ` · ${sourceErrors} source warning(s)` : ' · all queried sources healthy'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm xl:flex"><Search className="h-4 w-4" /> Search HR</div>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm">May 1 – May 31, 2026 <ChevronDown className="ml-2 inline h-4 w-4" /></button>
                <Link href="/hr/settings" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-xl shadow-slate-200">Customize</Link>
                <button className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white lg:hidden"><Menu className="h-5 w-5" /></button>
              </div>
            </header>
            <div className="mt-4 flex overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/80">
              <MetricCard title="Total Employees" value={formatNumber(totalStaff)} detail={`${rowCount(data.staff)} staff/profile row(s)`} icon={Users} tone="violet" confidence={confidence} />
              <MetricCard title="Active Employees" value={formatNumber(activeStaff)} detail={`${totalStaff ? Math.round((activeStaff / Math.max(totalStaff, 1)) * 100) : 0}% active from staff status`} icon={UserCheck} tone="cyan" confidence={confidence} />
              <MetricCard title="Open Positions" value={formatNumber(openRoles)} detail={`${rowCount(data.openings)} opening row(s)`} icon={BriefcaseBusiness} tone="violet" confidence={confidence} />
              <MetricCard title="Pending Approvals" value={formatNumber(pendingApprovals)} detail={`${rowCount(data.approvals)} approval row(s)`} icon={ClipboardCheck} tone="green" confidence={confidence} />
              <MetricCard title="HR Risk" value={formatNumber(hrRiskScore)} detail={`${missingDocs} docs · ${rosterConflicts} roster · ${attendanceExceptions} attendance`} icon={ShieldCheck} tone="rose" confidence={confidence} />
              <MetricCard title="Labor Control" value={`${score}%`} detail={`${confidenceLabel}${sourceErrors ? ` · ${sourceErrors} warning(s)` : ''}`} icon={CircleDollarSign} tone="blue" confidence={confidence} />
            </div>
            {confidence !== 'live' ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-800">
                HR production readiness notice: {confidenceLabel}. The dashboard now refuses inflated fallback numbers and only displays loaded HR records. Open Diagnostics or Sync Center to repair missing tables/sources.
              </div>
            ) : null}
          </div>

          <div id="dashboard" className="grid grid-cols-12 gap-4">
            <HRWorkforceGraphDeck
              data={data}
              totalStaff={totalStaff}
              activeStaff={activeStaff}
              pendingApprovals={pendingApprovals}
              validatedAttendance={validatedAttendance}
              openQuality={openQuality}
            />

            <HRLiveInsightStrip data={data} metrics={metrics} />

            <HRRecruitmentPipelinePanel data={data} />
            <HRMapPanel data={data} activeStaff={activeStaff} pendingApprovals={pendingApprovals} openQuality={openQuality} />
            <HRPerformanceOverviewPanel data={data} activeStaff={activeStaff} />
            <HRStaffIntelligenceNavigator employees={staffNavigatorEmployees} />
            <HRRecentActivityCommand items={hrRecentActivityItems} />
          </div>
        </section>
      </div>
    </main>
  )
}
