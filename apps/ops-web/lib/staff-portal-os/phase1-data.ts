import { createClient } from '@/lib/supabase/server'
import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'

export type StaffPortalUser = {
  id?: string | null
  email?: string | null
  username?: string | null
  full_name?: string | null
  name?: string | null
  role?: string | null
  role_key?: string | null
  department?: string | null
  position?: string | null
  job_title?: string | null
  permissions?: string[] | null
}

export type StaffPortalTask = {
  id: string
  source: string
  title: string
  detail: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  date: string | null
  href: string
  executeHref: string
}

export type StaffPortalMemo = {
  id: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  source: string
  createdAt: string
}

export type StaffPortalRoute = {
  label: string
  shortLabel?: string
  href: string
  module: string
  moduleLabel: string
}

export type StaffPortalData = {
  user: StaffPortalUser | null
  displayName: string
  department: string
  position: string
  roleLabel: string
  accessRoutes: StaffPortalRoute[]
  routeGroups: Record<string, StaffPortalRoute[]>
  kpis: {
    label: string
    value: string | number
    detail: string
    tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
  }[]
  tasksToday: StaffPortalTask[]
  tasksWeek: StaffPortalTask[]
  tasksMonth: StaffPortalTask[]
  memos: StaffPortalMemo[]
  mySpaceLinks: { label: string; href: string; detail: string; icon: string }[]
  controlPanels: { title: string; detail: string; href: string; tone: string; actions: { label: string; href: string }[] }[]
}

type AnyRow = Record<string, any>

function rows(res: any): AnyRow[] {
  return Array.isArray(res?.data) ? res.data : []
}

function safeDate(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function addDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function text(value: unknown, fallback = ''): string {
  const result = String(value ?? '').trim()
  return result || fallback
}

function low(value: unknown): string {
  return String(value ?? '').toLowerCase()
}

function displayName(user: StaffPortalUser | null): string {
  return text(user?.full_name, text(user?.name, text(user?.username, text(user?.email, 'AngelCare teammate'))))
}

function roleLabel(user: StaffPortalUser | null): string {
  return text(user?.role, text(user?.role_key, 'staff')).replaceAll('_', ' ')
}

function departmentLabel(user: StaffPortalUser | null): string {
  return text(user?.department, 'AngelCare Operations')
}

function positionLabel(user: StaffPortalUser | null): string {
  return text(user?.position, text(user?.job_title, roleLabel(user)))
}

function rowOwner(row: AnyRow): string {
  return text(row.assigned_to || row.user_id || row.agent_id || row.owner_id || row.assignee_id || row.created_by || row.staff_id)
}

function belongsToUser(row: AnyRow, userId: unknown): boolean {
  const owner = rowOwner(row)
  if (!userId || !owner) return true
  return String(owner) === String(userId)
}

function titleOf(row: AnyRow): string {
  return text(
    row.title ||
      row.name ||
      row.subject ||
      row.label ||
      row.mission_title ||
      row.client_name ||
      row.family_name ||
      row.company_name,
    `Item ${String(row.id || '').slice(0, 8)}`
  )
}

function dateOf(row: AnyRow): string | null {
  const raw =
    row.mission_date ||
    row.date ||
    row.due_date ||
    row.deadline ||
    row.start_date ||
    row.scheduled_at ||
    row.appointment_at ||
    row.shift_date ||
    row.created_at
  const date = safeDate(raw)
  return date ? date.toISOString() : raw ? String(raw) : null
}

function statusOf(row: AnyRow): string {
  return text(row.status || row.stage || row.priority || row.state, 'open')
}

function priorityOf(row: AnyRow): StaffPortalTask['priority'] {
  const value = low(row.priority || row.severity || row.status)
  if (['critical', 'urgent', 'blocked', 'overdue'].includes(value)) return 'critical'
  if (['high', 'risk', 'late'].includes(value)) return 'high'
  if (['medium', 'pending', 'open', 'in_progress'].includes(value)) return 'medium'
  return 'low'
}

function executeHref(source: string, row: AnyRow): string {
  const id = row.id || row.task_id || row.uuid
  if (source === 'Mission') return id ? `/missions/${id}` : '/missions'
  if (source === 'Revenue Task') return id ? `/revenue-command-center/tasks/${id}` : '/revenue-command-center/tasks'
  if (source === 'Appointment') return '/revenue-command-center/appointments'
  if (source === 'Incident') return id ? `/incidents/${id}` : '/incidents'
  if (source === 'Lead') return id ? `/leads/${id}` : '/leads'
  if (source === 'Contract') return id ? `/contracts/${id}` : '/contracts'
  if (source === 'HR Task') return '/hr/tasks'
  return '/staff-home'
}

function taskFrom(source: string, row: AnyRow): StaffPortalTask {
  const href = executeHref(source, row)
  return {
    id: String(row.id || row.task_id || `${source}-${titleOf(row)}`),
    source,
    title: titleOf(row),
    detail: text(row.description || row.notes || row.category || row.location || row.client_name || row.family_name, `${source} execution item`),
    status: statusOf(row),
    priority: priorityOf(row),
    date: dateOf(row),
    href,
    executeHref: href,
  }
}

function isOpenTask(task: StaffPortalTask): boolean {
  return !['done', 'completed', 'closed', 'resolved', 'cancelled', 'archived'].includes(low(task.status))
}

function isSameDay(dateValue: string | null, date: Date): boolean {
  const parsed = safeDate(dateValue)
  return parsed ? isoDate(parsed) === isoDate(date) : false
}

function isWithinDays(dateValue: string | null, days: number): boolean {
  const parsed = safeDate(dateValue)
  if (!parsed) return false
  const now = new Date()
  const end = addDays(days)
  return parsed.getTime() >= new Date(isoDate(now)).getTime() && parsed.getTime() <= end.getTime()
}

function scoreTask(task: StaffPortalTask): number {
  let score = 0
  if (task.priority === 'critical') score += 60
  if (task.priority === 'high') score += 40
  if (task.priority === 'medium') score += 20
  if (['open', 'pending', 'in_progress', 'assigned', 'new'].includes(low(task.status))) score += 12
  const parsed = safeDate(task.date)
  if (parsed) {
    const diff = (parsed.getTime() - Date.now()) / 86400000
    if (diff < 0) score += 30
    if (diff <= 1) score += 25
    if (diff <= 7) score += 10
  }
  return score
}

function normalizeRoutes(routes: ReturnType<typeof getAllowedAppRoutes>): StaffPortalRoute[] {
  return routes.slice(0, 42).map((route) => ({
    label: route.label,
    shortLabel: route.shortLabel,
    href: route.href,
    module: route.module,
    moduleLabel: route.moduleLabel,
  }))
}

export async function getStaffPortalPhase1Data(user: StaffPortalUser | null): Promise<StaffPortalData> {
  const supabase = await createClient()
  const userId = user?.id
  const start = isoDate(addDays(-3))
  const end = isoDate(addDays(35))

  const [
    missionsRes,
    tasksRes,
    appointmentsRes,
    incidentsRes,
    leadsRes,
    contractsRes,
    attendanceRes,
    rosterRes,
    appUsersRes,
    hrTasksRes,
    hrApprovalsRes,
    hrDocsRes,
  ] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(120),
    supabase.from('bd_tasks').select('*').order('created_at', { ascending: false }).limit(150),
    supabase.from('bd_appointments').select('*').order('appointment_at', { ascending: true }).limit(80),
    supabase.from('incidents').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(80),
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(80),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }).limit(80),
    supabase.from('attendance_logs').select('*').order('id', { ascending: false }).limit(60),
    supabase.from('staff_rosters').select('*').gte('shift_date', start).lte('shift_date', end).order('shift_date', { ascending: true }).limit(250),
    supabase.from('app_users').select('id, full_name, username, role, department, position').order('full_name').limit(90),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(80),
  ])

  const missions = rows(missionsRes)
  const tasks = rows(tasksRes)
  const appointments = rows(appointmentsRes)
  const incidents = rows(incidentsRes)
  const leads = rows(leadsRes)
  const contracts = rows(contractsRes)
  const attendance = rows(attendanceRes)
  const roster = rows(rosterRes)
  const appUsers = rows(appUsersRes)
  const hrTasks = rows(hrTasksRes)
  const hrApprovals = rows(hrApprovalsRes)
  const hrDocs = rows(hrDocsRes)

  const allTasks = [
    ...missions.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Mission', row)),
    ...tasks.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Revenue Task', row)),
    ...appointments.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Appointment', row)),
    ...incidents.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Incident', row)),
    ...leads.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Lead', row)),
    ...contracts.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('Contract', row)),
    ...hrTasks.filter((row) => belongsToUser(row, userId)).map((row) => taskFrom('HR Task', row)),
  ].sort((a, b) => scoreTask(b) - scoreTask(a))

  const today = new Date()
  const tasksToday = allTasks.filter((task) => isOpenTask(task) && isSameDay(task.date, today)).slice(0, 10)
  const tasksWeek = allTasks.filter((task) => isOpenTask(task) && isWithinDays(task.date, 7)).slice(0, 14)
  const tasksMonth = allTasks.filter((task) => isOpenTask(task) && isWithinDays(task.date, 31)).slice(0, 18)

  const allowedRoutes = normalizeRoutes(getAllowedAppRoutes(user))
  const routeGroups = groupRoutesByModule(allowedRoutes)

  const openIncidents = incidents.filter((row) => !['resolved', 'closed', 'archived'].includes(low(row.status)))
  const pendingApprovals = hrApprovals.filter((row) => !['approved', 'rejected', 'closed', 'completed'].includes(low(row.status)))
  const pendingDocs = hrDocs.filter((row) => String(row.verification_status || row.status || 'pending') !== 'verified')
  const latestAttendance = attendance[0]
  const todayRoster = roster.filter((row) => isSameDay(String(row.shift_date || row.date || ''), today))

  const memos: StaffPortalMemo[] = [
    ...openIncidents.slice(0, 2).map((row) => ({
      id: String(row.id || row.title),
      title: titleOf(row),
      body: text(row.description || row.notes || row.severity, 'Incident requires attention.'),
      severity: 'critical' as const,
      source: 'Incident Control',
      createdAt: text(row.created_at, new Date().toISOString()),
    })),
    ...pendingApprovals.slice(0, 2).map((row) => ({
      id: String(row.id || row.title),
      title: titleOf(row),
      body: text(row.description || row.notes || row.approval_type, 'Approval pending review.'),
      severity: 'warning' as const,
      source: 'Approval Desk',
      createdAt: text(row.created_at, new Date().toISOString()),
    })),
    {
      id: 'daily-briefing',
      title: 'Daily staff operating briefing',
      body: `Today you have ${tasksToday.length} urgent/today items, ${tasksWeek.length} items this week and ${allowedRoutes.length} authorized workspaces available.`,
      severity: tasksToday.length || openIncidents.length ? 'warning' : 'success',
      source: 'AngelCare Control Tower',
      createdAt: new Date().toISOString(),
    },
  ]

  const mySpaceLinks = [
    { label: 'My Profile', href: '/profile', detail: 'Identity, account and personal access.', icon: '👤' },
    { label: 'My Roster', href: '/operations/availability', detail: 'Availability, roster and field planning.', icon: '🗓️' },
    { label: 'My Trainings', href: '/academy', detail: 'Training, academy and readiness.', icon: '🎓' },
    { label: 'Admin Services', href: '/users', detail: 'Requests, access and internal services.', icon: '🛠️' },
    { label: 'My Attendance', href: '/pointage', detail: 'Clocking, attendance and presence.', icon: '🕒' },
    { label: 'My Documents', href: '/hr/documents', detail: 'Documents, compliance and signatures.', icon: '📄' },
    { label: 'My Tasks', href: tasksToday[0]?.href || '/staff-home', detail: 'Open and execute your work queue.', icon: '✅' },
    { label: 'My Messages', href: '/staff-home#control-memos', detail: 'Briefings, memos and acknowledgements.', icon: '📡' },
  ]

  const controlPanels = [
    { title: 'Daily Execution', detail: `${tasksToday.length} today tasks and ${tasksWeek.length} weekly tasks`, href: tasksToday[0]?.href || '/staff-home', tone: '#2563eb', actions: [{ label: 'Open Today', href: tasksToday[0]?.href || '/staff-home' }, { label: 'Week View', href: '/staff-home#tasks' }] },
    { title: 'Roster & Availability', detail: `${todayRoster.length} roster entries for today`, href: '/operations/availability', tone: '#0891b2', actions: [{ label: 'Availability', href: '/operations/availability' }, { label: 'Replacements', href: '/operations/replacements' }] },
    { title: 'Attendance Control', detail: latestAttendance ? `Latest status: ${statusOf(latestAttendance)}` : 'No recent attendance log', href: '/pointage', tone: '#059669', actions: [{ label: 'Pointage', href: '/pointage' }, { label: 'Attendance HR', href: '/hr/attendance' }] },
    { title: 'Training & Academy', detail: 'Training, certifications and staff readiness', href: '/academy', tone: '#7c3aed', actions: [{ label: 'Academy', href: '/academy' }, { label: 'Trainings', href: '/hr/training' }] },
    { title: 'Admin Services', detail: 'Profile, access, internal requests and support', href: '/profile', tone: '#475569', actions: [{ label: 'Profile', href: '/profile' }, { label: 'Users', href: '/users' }] },
    { title: 'Messages & Memos', detail: `${memos.length} control-tower briefing items`, href: '/staff-home#control-memos', tone: '#16a34a', actions: [{ label: 'Read Briefing', href: '/staff-home#control-memos' }, { label: 'Control Desk', href: '/operations' }] },
    { title: 'Performance Pulse', detail: `${allTasks.filter(isOpenTask).length} open work items`, href: '/reports', tone: '#ea580c', actions: [{ label: 'Reports', href: '/reports' }, { label: 'Dashboard', href: '/staff-home' }] },
    { title: 'Authorized Workspaces', detail: `${allowedRoutes.length} routes enabled by permissions`, href: allowedRoutes[0]?.href || '/staff-home', tone: '#0f766e', actions: [{ label: 'First Workspace', href: allowedRoutes[0]?.href || '/staff-home' }, { label: 'Access Menu', href: '/staff-home#access-menu' }] },
  ]

  return {
    user,
    displayName: displayName(user),
    department: departmentLabel(user),
    position: positionLabel(user),
    roleLabel: roleLabel(user),
    accessRoutes: allowedRoutes,
    routeGroups,
    kpis: [
      { label: "Today's tasks", value: tasksToday.length, detail: 'Due or scheduled today', tone: tasksToday.length ? 'amber' : 'green' },
      { label: 'Weekly load', value: tasksWeek.length, detail: 'Open execution items this week', tone: tasksWeek.length > 6 ? 'red' : 'blue' },
      { label: 'Monthly horizon', value: tasksMonth.length, detail: 'Execution items this month', tone: 'purple' },
      { label: 'Authorized modules', value: Object.keys(routeGroups).length, detail: 'Synced from user permissions', tone: 'cyan' },
      { label: 'Pending approvals', value: pendingApprovals.length, detail: 'Decision or validation queue', tone: pendingApprovals.length ? 'amber' : 'green' },
      { label: 'Open incidents', value: openIncidents.length, detail: 'Warnings requiring awareness', tone: openIncidents.length ? 'red' : 'green' },
      { label: 'Roster today', value: todayRoster.length, detail: 'Roster entries for today', tone: 'blue' },
      { label: 'Document checks', value: pendingDocs.length, detail: 'Pending HR document items', tone: pendingDocs.length ? 'red' : 'green' },
    ],
    tasksToday,
    tasksWeek,
    tasksMonth,
    memos,
    mySpaceLinks,
    controlPanels,
  }
}
