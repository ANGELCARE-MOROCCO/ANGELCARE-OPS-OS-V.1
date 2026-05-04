'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type WorkspaceKind =
  | 'overview'
  | 'staff'
  | 'staff-new'
  | 'staff-detail'
  | 'positions'
  | 'departments'
  | 'attendance'
  | 'roster'
  | 'roster-monthly'
  | 'leave'
  | 'replacements'
  | 'performance'
  | 'training'
  | 'incidents'
  | 'documents'
  | 'approvals'
  | 'compliance'
  | 'payroll-prep'
  | 'workforce-capacity'
  | 'memos'
  | 'settings'
  | 'bulk-actions'
  | 'staff-control'
  | 'roster-control'
  | 'workflow-center'

type Props = {
  kind: WorkspaceKind
  staffId?: string
}

const navGroups = [
  {
    title: 'Command',
    links: [
      ['/hr', 'Overview'],
      ['/hr/staff', 'Staff'],
      ['/hr/staff/new', 'New Staff'],
      ['/hr/positions', 'Positions'],
      ['/hr/departments', 'Departments'],
    ],
  },
  {
    title: 'Operations',
    links: [
      ['/hr/attendance', 'Attendance'],
      ['/hr/roster', 'Roster'],
      ['/hr/roster/monthly', 'Monthly Roster'],
      ['/hr/leave', 'Leave'],
      ['/hr/replacements', 'Replacements'],
    ],
  },
  {
    title: 'Control',
    links: [
      ['/hr/performance', 'Performance'],
      ['/hr/training', 'Training'],
      ['/hr/incidents', 'Incidents'],
      ['/hr/documents', 'Documents'],
      ['/hr/approvals', 'Approvals'],
      ['/hr/compliance', 'Compliance'],
    ],
  },
  {
    title: 'Execution',
    links: [
      ['/hr/payroll-prep', 'Payroll Prep'],
      ['/hr/workforce-capacity', 'Capacity'],
      ['/hr/memos', 'Memos'],
      ['/hr/settings', 'Settings'],
      ['/hr/bulk-actions', 'Bulk Actions'],
      ['/hr/staff-control', 'Staff Control'],
      ['/hr/roster-control', 'Roster Control'],
      ['/hr/workflow-center', 'Workflows'],
    ],
  },
]

const pageCopy: Record<WorkspaceKind, { title: string; eyebrow: string; mission: string; primary: string; secondary: string }> = {
  overview: {
    title: 'AngelCare HR Workforce Command Center',
    eyebrow: 'Executive HR Operations',
    mission: 'Control people, attendance, roster, compliance, documents, memos and workforce capacity from one premium command cockpit.',
    primary: 'Open staff control',
    secondary: 'Review alerts',
  },
  staff: {
    title: 'Staff Directory & Workforce Registry',
    eyebrow: 'Staff Operations',
    mission: 'Search, filter, bulk update, assign roles, inspect profiles and control staff status without leaving the page.',
    primary: 'Create staff profile',
    secondary: 'Bulk update staff',
  },
  'staff-new': {
    title: 'Create Staff Profile',
    eyebrow: 'Onboarding Form',
    mission: 'Register a new staff member with role, department, contract, manager, payroll code, documents and first roster readiness.',
    primary: 'Save draft profile',
    secondary: 'Attach documents',
  },
  'staff-detail': {
    title: 'Staff 360 Control Panel',
    eyebrow: 'Full Worker Profile',
    mission: 'Inspect attendance, missions, roster, tasks, incidents, documents, leave, performance and HR actions for this worker.',
    primary: 'Edit profile',
    secondary: 'Create HR action',
  },
  positions: {
    title: 'Positions Catalog',
    eyebrow: 'Role Architecture',
    mission: 'Manage AngelCare positions, missions, KPIs, default shifts, families and role-to-permission readiness.',
    primary: 'Add position',
    secondary: 'Map permissions',
  },
  departments: {
    title: 'Departments & Workforce Families',
    eyebrow: 'Organization Structure',
    mission: 'Control departments, capacity ownership, colors, descriptions and operational coverage across AngelCare.',
    primary: 'Add department',
    secondary: 'Review structure',
  },
  attendance: {
    title: 'Attendance Control Center',
    eyebrow: 'Pointage & Presence',
    mission: 'Monitor presence, lateness, absences, breaks, missing check-ins and attendance compliance by role and shift.',
    primary: 'Add manual record',
    secondary: 'Export pointage',
  },
  roster: {
    title: 'Roster Operations Board',
    eyebrow: 'Shift Control',
    mission: 'Assign shifts, detect gaps, manage duties, duplicate patterns, prepare replacements and protect daily coverage.',
    primary: 'Assign shift',
    secondary: 'Duplicate week',
  },
  'roster-monthly': {
    title: 'Monthly Roster Calendar',
    eyebrow: 'Monthly Workforce View',
    mission: 'Navigate the full month, inspect duties for all staff, filter by department, and open shift control directly.',
    primary: 'Create monthly plan',
    secondary: 'Show gaps',
  },
  leave: {
    title: 'Leave & Absence Management',
    eyebrow: 'Absence Control',
    mission: 'Approve, reject, assess coverage impact, trigger replacement, and maintain absence compliance from one queue.',
    primary: 'Approve selected',
    secondary: 'Find replacement',
  },
  replacements: {
    title: 'Replacement Command Desk',
    eyebrow: 'Coverage Recovery',
    mission: 'Resolve absences, uncovered missions, shift conflicts and emergency staffing shortages with traceable actions.',
    primary: 'Create replacement',
    secondary: 'Escalate risk',
  },
  performance: {
    title: 'Performance Review Center',
    eyebrow: 'Quality & Scoring',
    mission: 'Score reliability, behavior, mission success, client satisfaction and compliance with review actions.',
    primary: 'Create review',
    secondary: 'Flag coaching',
  },
  training: {
    title: 'Training & Certification Desk',
    eyebrow: 'Academy Sync',
    mission: 'Assign training, monitor readiness, validate certification, and prepare trainees for placement.',
    primary: 'Assign training',
    secondary: 'Review certifications',
  },
  incidents: {
    title: 'Incident History & Response',
    eyebrow: 'Risk Control',
    mission: 'Track staff incidents, severity, corrective action, closure and prevention loops across operations.',
    primary: 'Log incident',
    secondary: 'Open risk board',
  },
  documents: {
    title: 'Staff Documents Vault',
    eyebrow: 'Document Compliance',
    mission: 'Upload, verify, expire-track, filter and audit staff documents required for operational readiness.',
    primary: 'Upload document',
    secondary: 'Verify selected',
  },
  approvals: {
    title: 'HR Approval Inbox',
    eyebrow: 'Decision Queue',
    mission: 'Approve, reject, comment and trace requests for leave, roster changes, documents, profiles and exceptions.',
    primary: 'Approve selected',
    secondary: 'Reject selected',
  },
  compliance: {
    title: 'Compliance Command Center',
    eyebrow: 'HR Risk & Policy',
    mission: 'Monitor documents, certifications, incidents, policies, attendance and HR audit readiness.',
    primary: 'Create audit item',
    secondary: 'Export compliance',
  },
  'payroll-prep': {
    title: 'Payroll Preparation Workspace',
    eyebrow: 'Payroll Inputs',
    mission: 'Prepare salary inputs, attendance exceptions, overtime, unpaid leave, penalties and validation before payroll.',
    primary: 'Prepare batch',
    secondary: 'Export payroll',
  },
  'workforce-capacity': {
    title: 'Workforce Capacity Dashboard',
    eyebrow: 'Coverage Intelligence',
    mission: 'Compare available staff, scheduled duties, gaps, overload, leave impact and department capacity.',
    primary: 'Open capacity plan',
    secondary: 'Flag shortage',
  },
  memos: {
    title: 'Memos & Staff Notifications',
    eyebrow: 'Internal Communication',
    mission: 'Push announcements, reminders, urgent memos, policy notes and track audience/read status.',
    primary: 'Send memo',
    secondary: 'Target audience',
  },
  settings: {
    title: 'HR Settings & Operating Rules',
    eyebrow: 'Configuration',
    mission: 'Control HR defaults, roster rules, leave policies, statuses, document requirements and workflow behavior.',
    primary: 'Save settings',
    secondary: 'Preview rules',
  },
  'bulk-actions': {
    title: 'Bulk Actions Engine',
    eyebrow: 'Mass Execution',
    mission: 'Select staff, preview impact, assign, deactivate, notify, export and apply controlled mass actions.',
    primary: 'Run bulk action',
    secondary: 'Preview impact',
  },
  'staff-control': {
    title: 'Staff Control Room',
    eyebrow: 'Admin Workforce Controls',
    mission: 'Mass manage status, departments, roles, managers, memos, compliance and operational activation.',
    primary: 'Mass assign',
    secondary: 'Deactivate selected',
  },
  'roster-control': {
    title: 'Roster Control Room',
    eyebrow: 'Duty Assignment Engine',
    mission: 'Build rosters, assign shifts, detect conflicts, duplicate weeks, and handle staff coverage manually.',
    primary: 'Assign selected',
    secondary: 'Detect conflicts',
  },
  'workflow-center': {
    title: 'Manual Workflow Center',
    eyebrow: 'Human Execution Chains',
    mission: 'Run controlled workflows like leave approval, replacement, document verification and profile activation.',
    primary: 'Run workflow',
    secondary: 'Override step',
  },
}

const staffRows = [
  { id: 'seed1', name: 'Amina El Fassi', role: 'Care Coordinator', dept: 'Care Operations', status: 'Active', shift: '10:00-18:00', score: 92 },
  { id: 'seed2', name: 'Youssef Bennani', role: 'Sales Agent', dept: 'Revenue / Sales', status: 'Active', shift: '10:00-18:00', score: 87 },
  { id: 'seed3', name: 'Sara Amrani', role: 'Roster Planner', dept: 'Care Operations', status: 'On Leave', shift: 'Roster-based', score: 81 },
  { id: 'seed4', name: 'Mehdi Alaoui', role: 'Compliance Officer', dept: 'Core Office Staff', status: 'Review', shift: '10:00-18:00', score: 76 },
]

const operationalRows = [
  { title: 'Missing check-in detected', owner: 'Field Supervisor', impact: 'Medium', status: 'Open', action: 'Review pointage' },
  { title: 'Caregiver replacement required', owner: 'Replacement Coordinator', impact: 'High', status: 'Urgent', action: 'Assign backup' },
  { title: 'Document expires this week', owner: 'HR Officer', impact: 'Medium', status: 'Pending', action: 'Verify document' },
  { title: 'Leave approval waiting', owner: 'HR Manager', impact: 'Low', status: 'Queue', action: 'Approve / reject' },
]

function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'purple' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>
}

function ButtonLike({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls = 'inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800'
  if (href) return <Link className={cls} href={href}>{children}</Link>
  return <button className={cls} type="button">{children}</button>
}

function SecondaryButton({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls = 'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'
  if (href) return <Link className={cls} href={href}>{children}</Link>
  return <button className={cls} type="button">{children}</button>
}

function Filters() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-5">
        <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" placeholder="Search staff, role, memo, shift..." />
        <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"><option>All departments</option><option>Care Operations</option><option>Revenue / Sales</option><option>Core Office Staff</option></select>
        <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"><option>All statuses</option><option>Active</option><option>On Leave</option><option>Review</option></select>
        <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"><option>Today</option><option>This week</option><option>This month</option></select>
        <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" type="button">Apply filters</button>
      </div>
    </div>
  )
}

function KpiStrip() {
  const kpis = [
    ['Active staff', '128', '+12 ready'],
    ['Attendance compliance', '94%', '3 exceptions'],
    ['Roster coverage', '87%', '6 gaps'],
    ['Open HR actions', '23', '8 urgent'],
  ]
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map(([label, value, note]) => (
        <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-4xl font-black tracking-tight text-slate-950">{value}</p>
            <Pill tone={note.includes('urgent') || note.includes('gaps') ? 'amber' : 'green'}>{note}</Pill>
          </div>
        </div>
      ))}
    </div>
  )
}

function SubNav({ current }: { current: WorkspaceKind }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{group.title}</p>
            <div className="flex flex-wrap gap-2">
              {group.links.map(([href, label]) => (
                <Link key={href} href={href} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StaffTable({ detail }: { detail?: boolean }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-lg font-black text-slate-950">Live workforce rows</h3>
          <p className="text-sm text-slate-500">Selectable rows with direct action controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton>Assign</SecondaryButton>
          <SecondaryButton>Send memo</SecondaryButton>
          <ButtonLike>Export</ButtonLike>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4"><input type="checkbox" /></th>
              <th className="p-4">Staff</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Shift</th>
              <th className="p-4">Score</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="p-4"><input type="checkbox" /></td>
                <td className="p-4 font-bold text-slate-950">{row.name}<div className="text-xs font-medium text-slate-500">{row.status}</div></td>
                <td className="p-4">{row.role}</td>
                <td className="p-4">{row.dept}</td>
                <td className="p-4">{row.shift}</td>
                <td className="p-4"><Pill tone={row.score > 85 ? 'green' : row.score > 80 ? 'blue' : 'amber'}>{row.score}%</Pill></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white" href={`/hr/staff/${row.id}`}>View</Link>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white" type="button">Edit</button>
                    <button className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white" type="button">Action</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthlyRoster() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-black text-slate-950">Monthly roster matrix</h3><p className="text-sm text-slate-500">Click any duty cell to open assignment controls.</p></div>
        <div className="flex gap-2"><SecondaryButton>Previous</SecondaryButton><ButtonLike>Next month</ButtonLike></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {days.map((day) => {
          const busy = day % 4 === 0
          const warning = day % 7 === 0
          return (
            <button key={day} className={`rounded-2xl border p-3 text-left transition hover:scale-[1.01] ${warning ? 'border-amber-200 bg-amber-50' : busy ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`} type="button">
              <p className="text-xs font-black uppercase text-slate-400">Day {day}</p>
              <p className="mt-2 text-sm font-bold text-slate-950">{warning ? 'Gap risk' : busy ? 'Covered' : 'Standard'}</p>
              <p className="text-xs text-slate-500">{busy ? '12 duties' : '8 duties'}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ActionQueue() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h3 className="text-lg font-black text-slate-950">Operational queue</h3><p className="text-sm text-slate-500">Human-first actions with clear owners.</p></div>
        <Pill tone="red">4 open</Pill>
      </div>
      <div className="space-y-3">
        {operationalRows.map((row) => (
          <div key={row.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-bold text-slate-950">{row.title}</p><p className="text-sm text-slate-500">Owner: {row.owner} · Impact: {row.impact}</p></div>
              <Pill tone={row.status === 'Urgent' ? 'red' : row.status === 'Open' ? 'amber' : 'blue'}>{row.status}</Pill>
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><SecondaryButton>{row.action}</SecondaryButton><SecondaryButton>Comment</SecondaryButton><ButtonLike>Open</ButtonLike></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormLab({ kind }: { kind: WorkspaceKind }) {
  const fields = kind === 'staff-new'
    ? ['Full name', 'Email', 'Phone', 'Department', 'Position', 'Contract type', 'Manager', 'Payroll code']
    : ['Title', 'Owner', 'Department', 'Status', 'Due date', 'Priority', 'Notes', 'Action reason']
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">Execution form</h3>
      <p className="mb-4 text-sm text-slate-500">Production-style input layout ready to connect to server actions or Supabase inserts.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => <input key={field} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" placeholder={field} />)}
        <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 md:col-span-2" placeholder="Operational notes, context, decision trace..." />
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><ButtonLike>Save record</ButtonLike><SecondaryButton>Save draft</SecondaryButton><SecondaryButton>Reset</SecondaryButton></div>
    </div>
  )
}

export default function HRDominationWorkspace({ kind, staffId }: Props) {
  const [mode, setMode] = useState('command')
  const copy = pageCopy[kind]
  const isRoster = kind === 'roster' || kind === 'roster-monthly' || kind === 'roster-control'
  const isForm = kind === 'staff-new' || kind === 'settings' || kind === 'positions' || kind === 'departments' || kind === 'memos'

  const contextTabs = useMemo(() => ['command', 'records', 'actions', 'audit', 'export'], [])

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.3),transparent_40%)] p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">{copy.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{copy.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{copy.mission}</p>
                {staffId ? <p className="mt-2 text-sm text-slate-400">Profile ID: {staffId}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLike href={kind === 'staff' ? '/hr/staff/new' : undefined}>{copy.primary}</ButtonLike>
                <SecondaryButton>{copy.secondary}</SecondaryButton>
              </div>
            </div>
          </div>
        </section>

        <SubNav current={kind} />
        <KpiStrip />

        <div className="flex flex-wrap gap-2">
          {contextTabs.map((tab) => (
            <button key={tab} onClick={() => setMode(tab)} className={`rounded-2xl px-4 py-2 text-sm font-bold capitalize ${mode === tab ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`} type="button">{tab}</button>
          ))}
        </div>

        <Filters />

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {isForm ? <FormLab kind={kind} /> : null}
            {isRoster ? <MonthlyRoster /> : <StaffTable detail={kind === 'staff-detail'} />}
            <div className="grid gap-4 md:grid-cols-3">
              {['Bulk-ready selection', 'Inline decisions', 'Audit trail'].map((title, idx) => (
                <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Pill tone={idx === 0 ? 'blue' : idx === 1 ? 'green' : 'purple'}>{idx === 0 ? 'Control' : idx === 1 ? 'Action' : 'Trace'}</Pill>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Designed for manual execution by HR users: select, verify, act, comment and track.</p>
                  <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" type="button">Open control</button>
                </div>
              ))}
            </div>
          </div>
          <aside className="space-y-6">
            <ActionQueue />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Right command panel</h3>
              <p className="mt-2 text-sm text-slate-500">Quick controls stay visible so every page is actionable.</p>
              <div className="mt-4 grid gap-2">
                <ButtonLike>Create record</ButtonLike>
                <SecondaryButton>Import</SecondaryButton>
                <SecondaryButton>Export</SecondaryButton>
                <SecondaryButton>Send memo</SecondaryButton>
                <SecondaryButton>Open audit log</SecondaryButton>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
