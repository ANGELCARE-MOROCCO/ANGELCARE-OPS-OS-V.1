import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { ANGELCARE_DEPARTMENTS, ANGELCARE_POSITIONS } from './workforce'

type SafeResult<T> = { rows: T[]; error?: string; source: string }

type AnyRow = Record<string, any>

async function safeSelect<T = AnyRow>(supabase: any, source: string, table: string, options: { select?: string; limit?: number; order?: string; ascending?: boolean; filters?: Array<[string, string, any]> } = {}): Promise<SafeResult<T>> {
  try {
    let q = supabase.from(table).select(options.select || '*')
    for (const [method, column, value] of options.filters || []) q = q[method](column, value)
    if (options.order) q = q.order(options.order, { ascending: options.ascending ?? false })
    if (options.limit) q = q.limit(options.limit)
    const { data, error } = await q
    if (error) return { rows: [], error: error.message, source }
    return { rows: (data || []) as T[], source }
  } catch (e: any) {
    return { rows: [], error: e?.message || String(e), source }
  }
}

function todayRange() {
  const start = new Date(); start.setHours(0,0,0,0)
  const end = new Date(); end.setHours(23,59,59,999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function isDone(row: any) { return ['done','completed','closed','resolved','archived'].includes(String(row?.status || row?.state || '').toLowerCase()) }
function isOpen(row: any) { return !isDone(row) }
function titleOf(row: any, fallback = 'Untitled') { return row?.title || row?.name || row?.subject || row?.label || fallback }
function ownerOf(row: any) { return row?.assigned_to || row?.owner_id || row?.user_id || row?.person_id || row?.assignee_id || row?.created_by || null }
function dateOf(row: any) { return row?.due_at || row?.planned_at || row?.start_at || row?.shift_date || row?.date || row?.created_at || row?.updated_at || null }
function matchesUser(row: any, userId?: string | null) { if (!userId) return true; return [row?.assigned_to,row?.owner_id,row?.user_id,row?.person_id,row?.assignee_id,row?.created_by,row?.staff_id].filter(Boolean).includes(userId) }

export async function loadHRV2ConnectedData() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const { start, end } = todayRange()

  const [users, attendanceToday, hrProfiles, hrRosters, leave, docs, reviews, certs, disciplinary, memos, approvals, bdTasks, marketTasks, ambassadorMissions, incidents, acIncidents, acDocs, acReviews, acCerts, cohorts, missions] = await Promise.all([
    safeSelect(supabase, 'app_users', 'app_users', { select: '*', order: 'full_name', ascending: true, limit: 500 }),
    safeSelect(supabase, 'app_attendance_logs', 'app_attendance_logs', { select: '*', order: 'created_at', limit: 500, filters: [['gte','created_at',start], ['lte','created_at',end]] }),
    safeSelect(supabase, 'hr_staff_profiles', 'hr_staff_profiles', { select: '*', limit: 500 }),
    safeSelect(supabase, 'hr_rosters', 'hr_rosters', { select: '*', order: 'shift_date', ascending: true, limit: 500 }),
    safeSelect(supabase, 'hr_leave_requests', 'hr_leave_requests', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_staff_documents', 'hr_staff_documents', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_performance_reviews', 'hr_performance_reviews', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_certifications', 'hr_certifications', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_disciplinary_actions', 'hr_disciplinary_actions', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_staff_notifications', 'hr_staff_notifications', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'hr_approval_requests', 'hr_approval_requests', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'bd_tasks', 'bd_tasks', { select: '*', order: 'created_at', limit: 300 }),
    safeSelect(supabase, 'market_os_campaign_tasks', 'market_os_campaign_tasks', { select: '*', order: 'created_at', limit: 300 }),
    safeSelect(supabase, 'market_os_ambassador_missions', 'market_os_ambassador_missions', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'incidents', 'incidents', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'ac_incidents', 'ac_incidents', { select: '*', order: 'created_at', limit: 200 }),
    safeSelect(supabase, 'ac_documents', 'ac_documents', { select: '*', limit: 200 }),
    safeSelect(supabase, 'ac_performance_reviews', 'ac_performance_reviews', { select: '*', limit: 200 }),
    safeSelect(supabase, 'ac_certifications', 'ac_certifications', { select: '*', limit: 200 }),
    safeSelect(supabase, 'ac_training_cohorts', 'ac_training_cohorts', { select: '*', limit: 200 }),
    safeSelect(supabase, 'missions', 'missions', { select: '*', limit: 300 }),
  ])

  const allUsers = users.rows.filter((u: any) => String(u.status || 'active') !== 'inactive')
  const profilesByUser = Object.fromEntries(hrProfiles.rows.map((p: any) => [p.user_id, p]))
  const attendanceByUser = new Map<string, any[]>()
  attendanceToday.rows.forEach((log: any) => { const arr = attendanceByUser.get(log.user_id) || []; arr.push(log); attendanceByUser.set(log.user_id, arr) })

  const rosterRows = hrRosters.rows
  const openLeave = leave.rows.filter(isOpen)
  const openApprovals = approvals.rows.filter(isOpen)
  const openIncidents = [...incidents.rows, ...acIncidents.rows].filter(isOpen)
  const expiringDocs = [...docs.rows, ...acDocs.rows].filter((d: any) => String(d.status || '').toLowerCase() === 'missing' || (d.expires_at && new Date(d.expires_at).getTime() < Date.now() + 1000*60*60*24*30))
  const taskRows = [
    ...bdTasks.rows.map((t: any) => ({ ...t, _source: 'Revenue Task', _href: `/revenue-command-center/tasks/${t.id}` })),
    ...marketTasks.rows.map((t: any) => ({ ...t, _source: 'Market Campaign Task', _href: '/market-os/campaign-cycle' })),
    ...ambassadorMissions.rows.map((t: any) => ({ ...t, _source: 'Ambassador Mission', _href: '/market-os/ambassadors' })),
    ...missions.rows.map((t: any) => ({ ...t, _source: 'Mission', _href: t.id ? `/missions/${t.id}` : '/missions' })),
  ]
  const userTasks = taskRows.filter((t: any) => matchesUser(t, user?.id)).filter(isOpen)
  const allOpenTasks = taskRows.filter(isOpen)

  const staff = allUsers.map((u: any) => {
    const profile = profilesByUser[u.id] || {}
    const logs = attendanceByUser.get(u.id) || []
    const latest = logs[0]
    const roster = rosterRows.filter((r: any) => r.user_id === u.id || r.staff_id === u.id).slice(0, 8)
    const tasks = taskRows.filter((t: any) => matchesUser(t, u.id)).filter(isOpen)
    const incidentsForUser = openIncidents.filter((i: any) => matchesUser(i, u.id))
    const certsForUser = [...certs.rows, ...acCerts.rows].filter((c: any) => matchesUser(c, u.id))
    return {
      id: u.id,
      full_name: u.full_name || u.username || u.email || 'Unnamed staff',
      username: u.username,
      role: u.role || u.role_key || profile.role,
      department: profile.department || u.department || 'Unassigned',
      position: profile.position || u.job_title || u.role || 'Unassigned',
      contract_type: profile.contract_type || 'Not set',
      status: u.status || profile.status || 'active',
      latest_action: latest?.action || 'no_activity',
      logs_count: logs.length,
      roster_count: roster.length,
      open_tasks: tasks.length,
      open_incidents: incidentsForUser.length,
      certs: certsForUser.length,
      readiness: Math.max(35, Math.min(100, 55 + Math.min(25, logs.length * 5) + Math.min(20, certsForUser.length * 4) - Math.min(30, incidentsForUser.length * 10))),
    }
  })

  const connected = [users, attendanceToday, hrProfiles, hrRosters, leave, docs, reviews, certs, disciplinary, memos, approvals, bdTasks, marketTasks, ambassadorMissions, incidents, acIncidents, acDocs, acReviews, acCerts, cohorts, missions]
  const missing = connected.filter((r) => r.error).map((r) => ({ source: r.source, error: r.error }))

  return {
    user,
    now: new Date().toISOString(),
    staff,
    departments: ANGELCARE_DEPARTMENTS,
    positions: ANGELCARE_POSITIONS,
    attendanceToday: attendanceToday.rows,
    rosters: rosterRows,
    leave: leave.rows,
    docs: [...docs.rows, ...acDocs.rows],
    reviews: [...reviews.rows, ...acReviews.rows],
    certifications: [...certs.rows, ...acCerts.rows],
    disciplinary: disciplinary.rows,
    memos: memos.rows,
    approvals: approvals.rows,
    incidents: [...incidents.rows, ...acIncidents.rows],
    cohorts: cohorts.rows,
    tasks: taskRows,
    allOpenTasks,
    userTasks,
    openLeave,
    openApprovals,
    openIncidents,
    expiringDocs,
    missing,
    health: {
      staff: staff.length,
      presentToday: new Set(attendanceToday.rows.map((l: any) => l.user_id).filter(Boolean)).size,
      rostered: new Set(rosterRows.map((r: any) => r.user_id || r.staff_id).filter(Boolean)).size,
      openTasks: allOpenTasks.length,
      userTasks: userTasks.length,
      openIncidents: openIncidents.length,
      openLeave: openLeave.length,
      pendingApprovals: openApprovals.length,
      expiringDocs: expiringDocs.length,
      trainingCohorts: cohorts.rows.length,
      connectedTables: connected.filter((r) => !r.error).length,
      missingTables: missing.length,
    },
  }
}

export function hrTitle(row: any, fallback = 'Untitled') { return titleOf(row, fallback) }
export function hrOwner(row: any) { return ownerOf(row) }
export function hrDate(row: any) { return dateOf(row) }
