import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionMetrics, getHRProductionScore } from '@/lib/hr-production/metrics'
import { HR_PRODUCTION_NAV } from '@/lib/hr-production/navigation'
import { HRAction, HRCard, HRLightAction, HRSection, HRStatusPill, HRTable } from './hr/_components/HRProductionUI'

function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown): string {
  return String(value || '').toLowerCase()
}

function formatDate(value: unknown) {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleDateString()
  } catch {
    return String(value)
  }
}

function countUnvalidatedAttendance(attendance: any[]) {
  return attendance.filter((row) => {
    const status = text(row.validation_status || row.status || row.attendance_status)
    return !['validated', 'approved', 'closed', 'complete', 'completed'].some((x) => status.includes(x))
  }).length
}

function countRosterConflicts(rosters: any[]) {
  return rosters.filter((row) => {
    const status = text(row.status || row.conflict_status || row.type || row.notes)
    return ['conflict', 'overlap', 'double', 'uncovered', 'missing'].some((x) => status.includes(x))
  }).length
}

function countOpenQuality(data: any) {
  const explicit = rows(data.dataQuality)
  const errorCount = Object.keys(data.errors || {}).length
  if (!explicit.length) return errorCount
  return explicit.filter((row) => {
    const status = text(row.status || row.quality_status || row.state)
    return !['closed', 'resolved', 'fixed', 'done', 'completed', 'passed'].includes(status)
  }).length + errorCount
}

function firstValue(row: any, fields: string[], fallback = '—') {
  for (const field of fields) {
    if (row?.[field] !== undefined && row?.[field] !== null && String(row[field]).trim() !== '') return row[field]
  }
  return fallback
}

function tableRows(items: any[]): any[][] {
  return items.map((item) => {
    if (Array.isArray(item)) return item
    return Object.values(item || {}).map((value) => value === null || value === undefined ? '—' : String(value))
  })
}

const EXECUTIVE_MODULES = [
  {
    title: 'Staff Command',
    href: '/hr/staff',
    eyebrow: 'People registry',
    description: 'Employees, caregivers, contracts, profiles, availability, compliance and 360° staff visibility.',
    accent: 'from-blue-600 to-cyan-500',
  },
  {
    title: 'Recruitment Pipeline',
    href: '/hr/recruitment',
    eyebrow: 'Hiring engine',
    description: 'Open roles, candidates, sourcing, interviews, shortlists and hiring execution.',
    accent: 'from-violet-600 to-fuchsia-500',
  },
  {
    title: 'Attendance Center',
    href: '/hr/attendance',
    eyebrow: 'Punch sync',
    description: 'Punch in/out, validation, exceptions, late arrivals, missed punch-outs and agenda views.',
    accent: 'from-emerald-600 to-teal-500',
  },
  {
    title: 'Rosters & Coverage',
    href: '/hr/rosters',
    eyebrow: 'Workforce planning',
    description: 'Schedules, mission coverage, conflicts, daily staffing gaps and field operations readiness.',
    accent: 'from-orange-600 to-amber-500',
  },
  {
    title: 'Approvals Desk',
    href: '/hr/approvals',
    eyebrow: 'Decision queue',
    description: 'Leave, attendance corrections, contracts, documents and HR requests pending validation.',
    accent: 'from-rose-600 to-pink-500',
  },
  {
    title: 'Reports & Exports',
    href: '/hr/reports',
    eyebrow: 'Management reporting',
    description: 'Attendance, payroll prep, compliance, recruitment funnel and executive reports.',
    accent: 'from-slate-700 to-slate-500',
  },
]

const CONTROL_MODULES = [
  { label: 'Data Quality', href: '/hr/data-quality', description: 'Detect missing fields, schema gaps and broken HR records.' },
  { label: 'Sync Center', href: '/hr/sync-center', description: 'Check HR links with users, attendance, rosters and operations.' },
  { label: 'System Health', href: '/hr/system-health', description: 'Readiness score, risks and production stability indicators.' },
  { label: 'Route Coverage', href: '/hr/route-coverage', description: 'See all HR routes and missing navigation coverage.' },
  { label: 'Export Center', href: '/hr/reports/export', description: 'Prepare HR data extracts for payroll, compliance and leadership.' },
  { label: 'Settings', href: '/hr/settings', description: 'Configure HR operating rules, standards and controls.' },
]

const ENTERPRISE_MODULES = [
  { label: 'Contracts', href: '/hr/contracts' },
  { label: 'Documents', href: '/hr/documents' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Training', href: '/hr/training' },
  { label: 'Payroll Inputs', href: '/hr/payroll' },
  { label: 'Onboarding', href: '/hr/onboarding' },
  { label: 'Departments', href: '/hr/departments' },
  { label: 'Positions', href: '/hr/positions' },
  { label: 'Tasks', href: '/hr/tasks' },
  { label: 'Service Requests', href: '/hr/service-requests' },
  { label: 'SLA Tracking', href: '/hr/sla' },
  { label: 'Escalations', href: '/hr/escalations' },
  { label: 'Daily Operations', href: '/hr/daily-operations' },
  { label: 'Playbooks', href: '/hr/playbooks' },
  { label: 'Templates', href: '/hr/templates' },
  { label: 'Audit Trail', href: '/hr/audit' },
  { label: 'Activity Timeline', href: '/hr/activity' },
  { label: 'Incidents', href: '/hr/incidents' },
  { label: 'Performance', href: '/hr/performance' },
  { label: 'Workforce Missions', href: '/hr/workforce/missions' },
  { label: 'Workforce Forecast', href: '/hr/workforce/forecast' },
  { label: 'Roster Conflicts', href: '/hr/rosters/conflicts' },
  { label: 'Interview Board', href: '/hr/recruitment/interviews' },
  { label: 'Recruitment Sources', href: '/hr/recruitment/sources' },
]

export default async function Page() {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)

  const attendance = rows(data.attendance)
  const rosters = rows(data.rosters)
  const staff = rows(data.staff)
  const candidates = rows(data.candidates)
  const approvals = rows(data.approvals)
  const documents = rows(data.documents)
  const contracts = rows(data.contracts)
  const training = rows(data.training)
  const errors = Object.entries(data.errors || {})

  const unvalidatedAttendance =
    (metrics as any).unvalidatedAttendance ??
    (
      Math.max(0, (metrics.attendanceRecords || attendance.length) - (metrics.validatedAttendance || 0)) ||
      countUnvalidatedAttendance(attendance)
    )

  const rosterConflicts =
    (metrics as any).rosterConflicts ??
    (
      (metrics as any).conflictsCount ??
      countRosterConflicts(rosters)
    )

  const openQuality =
    (metrics as any).openQuality ??
    (
      (metrics as any).qualityIssues ??
      countOpenQuality(data)
    )

  const readinessStatus = score >= 85 ? 'healthy' : score >= 65 ? 'warning' : 'critical'
  const activeRate = metrics.activeStaffRate || 0

  const recentStaff = staff.slice(0, 8).map((row) => ({
    staff: firstValue(row, ['full_name', 'name', 'display_name', 'email'], 'Unnamed staff'),
    role: firstValue(row, ['position', 'job_title', 'role'], 'Staff'),
    status: firstValue(row, ['employment_status', 'status'], 'active'),
    city: firstValue(row, ['city', 'location'], '—'),
  }))

  const recentCandidates = candidates.slice(0, 8).map((row) => ({
    candidate: firstValue(row, ['full_name', 'name', 'email'], 'Candidate'),
    stage: firstValue(row, ['stage', 'pipeline_stage', 'status'], 'screening'),
    role: firstValue(row, ['role', 'position', 'opening_title'], 'Open role'),
    owner: firstValue(row, ['owner', 'recruiter'], 'HR'),
  }))

  const pendingApprovalsRows = approvals.slice(0, 8).map((row) => ({
    item: firstValue(row, ['title', 'request_type', 'type'], 'Approval request'),
    status: firstValue(row, ['status', 'approval_status'], 'pending'),
    owner: firstValue(row, ['owner', 'requested_by', 'actor_label'], 'HR'),
    date: formatDate(firstValue(row, ['created_at', 'requested_at'], '')),
  }))

  const documentRows = documents.slice(0, 8).map((row) => ({
    document: firstValue(row, ['title', 'document_type', 'type'], 'Document'),
    owner: firstValue(row, ['full_name', 'staff_name', 'employee_name', 'staff_id'], 'Staff'),
    status: firstValue(row, ['status', 'compliance_status'], 'recorded'),
    expiry: formatDate(firstValue(row, ['expires_at', 'expiry_date'], '')),
  }))

  const readinessItems = [
    { label: 'Build stability', value: score >= 70 ? 'Controlled' : 'Review', status: score >= 70 ? 'healthy' : 'warning' },
    { label: 'HR route coverage', value: `${HR_PRODUCTION_NAV.length + ENTERPRISE_MODULES.length}+ links`, status: 'healthy' },
    { label: 'Attendance architecture', value: unvalidatedAttendance ? `${unvalidatedAttendance} to validate` : 'Validated', status: unvalidatedAttendance ? 'warning' : 'healthy' },
    { label: 'ERP readiness', value: openQuality ? `${openQuality} quality items` : 'Clean', status: openQuality ? 'warning' : 'healthy' },
    { label: 'Enterprise controls', value: errors.length ? `${errors.length} alerts` : 'Stable', status: errors.length ? 'warning' : 'healthy' },
  ]

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_32%)]" />
          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-5">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-slate-200">
                AngelCare Human Capital Operating System
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  HR Command Center
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                  Premium enterprise cockpit for staff, recruitment, attendance synchronization, workforce coverage,
                  approvals, compliance, payroll inputs, operational quality and executive HR governance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <HRAction href="/hr/staff">Manage staff</HRAction>
                <HRAction href="/hr/attendance">Attendance cockpit</HRAction>
                <HRAction href="/hr/recruitment">Recruitment pipeline</HRAction>
                <HRLightAction href="/hr/sync-center">Sync center</HRLightAction>
                <HRLightAction href="/hr/reports">Reports</HRLightAction>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-300">Readiness</div>
                  <div className="mt-1 text-4xl font-black">{score}%</div>
                </div>
                <HRStatusPill value={readinessStatus} />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
              </div>
              <div className="text-xs leading-5 text-slate-300">
                Loaded {data.loadedAt ? new Date(data.loadedAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <HRCard title="Total staff" value={metrics.totalStaff} />
          <HRCard title="Active staff" value={metrics.activeStaff} />
          <HRCard title="Active rate" value={`${activeRate}%`} />
          <HRCard title="Open roles" value={metrics.openRoles} />
          <HRCard title="Pending approvals" value={metrics.pendingApprovals} />
          <HRCard title="Quality alerts" value={openQuality} />
          <HRCard title="Attendance records" value={metrics.attendanceRecords} />
          <HRCard title="Not validated" value={unvalidatedAttendance} />
          <HRCard title="Roster conflicts" value={rosterConflicts} />
          <HRCard title="Missing documents" value={metrics.missingDocs} />
          <HRCard title="Contracts" value={metrics.contractRecords} />
          <HRCard title="Training records" value={metrics.trainingRecords} />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {EXECUTIVE_MODULES.map((module) => (
            <a
              key={module.href}
              href={module.href}
              className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`h-2 bg-gradient-to-r ${module.accent}`} />
              <div className="space-y-4 p-5">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{module.eyebrow}</div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                </div>
                <div className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition group-hover:bg-slate-800">
                  Open workspace →
                </div>
              </div>
            </a>
          ))}
        </section>

        <HRSection title="Executive control panels" subtitle="Premium access points for quality, synchronization, reporting, settings and readiness control.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CONTROL_MODULES.map((module) => (
              <a
                key={module.href}
                href={module.href}
                className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="text-base font-black text-slate-950">{module.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{module.description}</div>
              </a>
            ))}
          </div>
        </HRSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <HRSection title="Production readiness board" subtitle="The five critical areas that must remain controlled before push and deployment.">
            <div className="grid gap-3">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div>
                    <div className="text-sm font-black text-slate-900">{item.label}</div>
                    <div className="text-xs font-semibold text-slate-500">{item.value}</div>
                  </div>
                  <HRStatusPill value={item.status} />
                </div>
              ))}
            </div>
          </HRSection>

          <HRSection title="Enterprise quick launch" subtitle="All HR submodules and operational destinations.">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {ENTERPRISE_MODULES.map((module) => (
                <a
                  key={module.href}
                  href={module.href}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {module.label}
                </a>
              ))}
            </div>
          </HRSection>
        </div>

        <HRSection title="Full HR route map" subtitle="Navigation registry from the production HR layer.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {HR_PRODUCTION_NAV.map((x) => (
              <a
                key={x.href}
                href={x.href}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div>{x.label}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{x.href}</div>
              </a>
            ))}
          </div>
        </HRSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <HRSection title="Recent staff" subtitle="Latest staff records from the unified HR repository.">
            <HRTable headers={['Staff', 'Role', 'Status', 'City']} rows={tableRows(recentStaff)} />
          </HRSection>

          <HRSection title="Recruitment pipeline" subtitle="Candidate and open-role activity.">
            <HRTable headers={['Candidate', 'Stage', 'Role', 'Owner']} rows={tableRows(recentCandidates)} />
          </HRSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <HRSection title="Pending approvals" subtitle="Approval queue requiring HR or management action.">
            <HRTable headers={['Item', 'Status', 'Owner', 'Date']} rows={tableRows(pendingApprovalsRows)} />
          </HRSection>

          <HRSection title="Document control" subtitle="Employee document and compliance visibility.">
            <HRTable headers={['Document', 'Owner', 'Status', 'Expiry']} rows={tableRows(documentRows)} />
          </HRSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <HRSection title="Attendance command" subtitle="Punch-in/out and validation intelligence.">
            <div className="space-y-3">
              <HRCard title="Attendance records" value={metrics.attendanceRecords} />
              <HRCard title="Validated" value={metrics.validatedAttendance} />
              <HRCard title="Not validated" value={unvalidatedAttendance} />
              <div className="flex flex-wrap gap-2">
                <HRAction href="/hr/attendance">Open attendance</HRAction>
                <HRLightAction href="/hr/attendance?view=agenda">Agenda view</HRLightAction>
              </div>
            </div>
          </HRSection>

          <HRSection title="Workforce coverage" subtitle="Rosters, missions and field staffing risk.">
            <div className="space-y-3">
              <HRCard title="Roster records" value={rosters.length} />
              <HRCard title="Conflicts" value={rosterConflicts} />
              <HRCard title="Contracts" value={contracts.length} />
              <div className="flex flex-wrap gap-2">
                <HRAction href="/hr/rosters">Open rosters</HRAction>
                <HRLightAction href="/hr/workforce/missions">Missions</HRLightAction>
              </div>
            </div>
          </HRSection>

          <HRSection title="Learning & performance" subtitle="Training, performance and staff development control.">
            <div className="space-y-3">
              <HRCard title="Training" value={training.length} />
              <HRCard title="Performance" value={rows((data as any).performance).length} />
              <HRCard title="Open tasks" value={metrics.openTasks} />
              <div className="flex flex-wrap gap-2">
                <HRAction href="/hr/training">Training</HRAction>
                <HRLightAction href="/hr/performance">Performance</HRLightAction>
              </div>
            </div>
          </HRSection>
        </div>

        <HRSection title="Repository quality alerts" subtitle="Tables or compatibility fallbacks that need review before enterprise production.">
          <HRTable
            headers={['Module', 'Status', 'Error']}
            rows={tableRows(errors.map(([module, error]) => ({
              module,
              status: 'review',
              error: String(error),
            })))}
          />
        </HRSection>
      </div>
    </AppShell>
  )
}
