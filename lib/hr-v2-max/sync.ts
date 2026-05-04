import { createClient } from '@/lib/supabase/server'

export type HrMetric = { label: string; value: string; tone: string; detail: string }
export type HrRow = Record<string, any>

const tableCandidates = {
  staff: ['hr_staff_profiles', 'users', 'caregivers'],
  roster: ['hr_rosters'],
  leave: ['hr_leave_requests'],
  notifications: ['hr_staff_notifications'],
  approvals: ['hr_approval_requests'],
  positions: ['hr_positions'],
  departments: ['hr_departments'],
  audits: ['hr_execution_audit_events'],
  actions: ['hr_execution_action_queue'],
  payroll: ['hr_payroll_preparation_items'],
  capacity: ['hr_capacity_plans'],
  missions: ['missions'],
  tasks: ['tasks', 'revenue_tasks', 'rcc_tasks'],
  incidents: ['incidents', 'quality_incidents'],
  attendance: ['attendance', 'pointage', 'work_sessions'],
  training: ['academy_enrollments', 'training_sessions', 'hr_certifications'],
}

async function safeSelect(table: string, limit = 20): Promise<HrRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error || !data) return []
    return data as HrRow[]
  } catch {
    return []
  }
}

async function firstAvailable(tables: string[], limit = 20): Promise<{ table: string; rows: HrRow[] }> {
  for (const table of tables) {
    const rows = await safeSelect(table, limit)
    if (rows.length) return { table, rows }
  }
  return { table: tables[0] ?? 'unknown', rows: [] }
}

function pickName(row: HrRow) {
  return row.full_name || row.name || row.title || row.email || row.position || row.id || 'Record'
}

export async function getHrMaximumSnapshot() {
  const [staff, roster, leave, notifications, approvals, positions, departments, audits, actions, payroll, capacity, missions, tasks, incidents, attendance, training] = await Promise.all([
    firstAvailable(tableCandidates.staff, 50),
    firstAvailable(tableCandidates.roster, 50),
    firstAvailable(tableCandidates.leave, 50),
    firstAvailable(tableCandidates.notifications, 50),
    firstAvailable(tableCandidates.approvals, 50),
    firstAvailable(tableCandidates.positions, 80),
    firstAvailable(tableCandidates.departments, 20),
    firstAvailable(tableCandidates.audits, 30),
    firstAvailable(tableCandidates.actions, 30),
    firstAvailable(tableCandidates.payroll, 30),
    firstAvailable(tableCandidates.capacity, 30),
    firstAvailable(tableCandidates.missions, 30),
    firstAvailable(tableCandidates.tasks, 30),
    firstAvailable(tableCandidates.incidents, 30),
    firstAvailable(tableCandidates.attendance, 30),
    firstAvailable(tableCandidates.training, 30),
  ])

  const syncSignals = [staff, roster, leave, notifications, approvals, missions, tasks, incidents, attendance, training]
  const connected = syncSignals.filter((s) => s.rows.length > 0).length
  const health = Math.min(98, 50 + connected * 5)

  const metrics: HrMetric[] = [
    { label: 'Staff Signals', value: String(staff.rows.length), tone: 'from-sky-500 to-blue-700', detail: `Source: ${staff.table}` },
    { label: 'Roster Duties', value: String(roster.rows.length), tone: 'from-emerald-500 to-green-700', detail: `Source: ${roster.table}` },
    { label: 'Open Leaves', value: String(leave.rows.length), tone: 'from-amber-500 to-orange-700', detail: `Source: ${leave.table}` },
    { label: 'Approvals', value: String(approvals.rows.length), tone: 'from-violet-500 to-purple-700', detail: `Source: ${approvals.table}` },
    { label: 'Mission Links', value: String(missions.rows.length), tone: 'from-rose-500 to-pink-700', detail: `Source: ${missions.table}` },
    { label: 'Sync Health', value: `${health}%`, tone: 'from-slate-700 to-black', detail: `${connected}/10 HR data bridges active` },
  ]

  const activity = [
    ...notifications.rows.slice(0, 4).map((r) => ({ type: 'Memo', title: r.title || r.message || pickName(r), route: '/hr/memos', status: r.status || 'active' })),
    ...actions.rows.slice(0, 4).map((r) => ({ type: 'Action', title: r.title || pickName(r), route: r.target_route || '/hr/actions', status: r.status || 'pending' })),
    ...audits.rows.slice(0, 4).map((r) => ({ type: 'Audit', title: r.title || pickName(r), route: '/hr/sync-control', status: r.status || 'open' })),
  ].slice(0, 10)

  return { metrics, staff, roster, leave, notifications, approvals, positions, departments, audits, actions, payroll, capacity, missions, tasks, incidents, attendance, training, activity, health }
}

export const hrMaxNav = [
  { href: '/hr', label: 'Command Center' },
  { href: '/hr/execution', label: 'Execution Layer' },
  { href: '/hr/sync-control', label: 'Sync Control' },
  { href: '/hr/command-ops', label: 'Command Ops' },
  { href: '/hr/staff', label: 'Staff Directory' },
  { href: '/hr/positions', label: 'Positions' },
  { href: '/hr/departments', label: 'Departments' },
  { href: '/hr/attendance', label: 'Attendance' },
  { href: '/hr/roster/monthly', label: 'Monthly Roster' },
  { href: '/hr/leave', label: 'Leave' },
  { href: '/hr/replacements', label: 'Replacements' },
  { href: '/hr/performance', label: 'Performance' },
  { href: '/hr/training', label: 'Training' },
  { href: '/hr/incidents', label: 'Incidents' },
  { href: '/hr/documents', label: 'Documents' },
  { href: '/hr/approvals', label: 'Approvals' },
  { href: '/hr/compliance', label: 'Compliance' },
  { href: '/hr/payroll-prep', label: 'Payroll Prep' },
  { href: '/hr/workforce-capacity', label: 'Capacity' },
  { href: '/hr/memos', label: 'Memos' },
  { href: '/hr/settings', label: 'Settings' },
]
