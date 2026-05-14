import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getHRDashboardData, getHRRecord, HR_TABLES, logHRActivity } from '@/lib/hr-production/repository'

export const WORKFORCE_TABLES = {
  staff: HR_TABLES.staff,
  attendance: HR_TABLES.attendance,
  rosters: HR_TABLES.rosters,
  logs: 'app_attendance_logs',
  conflicts: 'hr_roster_conflicts',
  templates: 'hr_shift_templates',
  actions: 'hr_workforce_actions',
  alerts: 'hr_workforce_alerts',
} as const

function str(v: unknown) { return String(v || '').toLowerCase() }

export function identityOf(row: any, staff: any[]) {
  const id = row.staff_id || row.employee_id || row.user_id || row.profile_id
  const found = staff.find((s: any) => [s.id, s.user_id, s.profile_id].filter(Boolean).includes(id))
  return {
    id,
    name: row.staff_name || found?.full_name || found?.name || found?.email || 'Unmapped staff',
    department: row.department || found?.department || 'Unmapped department',
    city: row.city || row.location || found?.city || 'Unmapped location',
    position: row.position || found?.position || found?.role || 'Staff',
  }
}

export async function getWorkforceOpsData() {
  const supabase = await createClient()
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  const attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
  const rosters = Array.isArray(dashboard.rosters) ? dashboard.rosters : []

  let logs: any[] = []
  let alerts: any[] = []
  try { const res = await supabase.from(WORKFORCE_TABLES.logs).select('*').order('event_at', { ascending: false }).limit(600); logs = res.data || [] } catch {}
  try { const res = await supabase.from(WORKFORCE_TABLES.alerts).select('*').order('created_at', { ascending: false }).limit(300); alerts = res.data || [] } catch {}

  const normalizedAttendance = attendance.map((row: any) => ({ ...row, identity: identityOf(row, staff) }))
  const normalizedRosters = rosters.map((row: any) => ({ ...row, identity: identityOf(row, staff) }))

  const exceptions = normalizedAttendance.filter((x: any) => str(x.status || x.validation_status || x.attendance_status || x.exception_type).match(/late|missing|review|exception|pending|open/))
  const validated = normalizedAttendance.filter((x: any) => str(x.status || x.validation_status || x.attendance_status).match(/validated|approved|complete|completed|closed/))
  const conflicts = normalizedRosters.filter((x: any) => str(x.status || x.conflict_status || x.type).match(/conflict|uncovered|overlap|missing|risk/))
  const covered = normalizedRosters.filter((x: any) => str(x.status).match(/covered|confirmed|approved|published/))

  const peopleMap = new Map<string, { staff: any; attendance: any[]; rosters: any[] }>()
  for (const s of staff) peopleMap.set(s.full_name || s.name || s.email || s.id, { staff: s, attendance: [], rosters: [] })
  for (const a of normalizedAttendance) { const key = a.identity.name; if (!peopleMap.has(key)) peopleMap.set(key, { staff: {}, attendance: [], rosters: [] }); peopleMap.get(key)!.attendance.push(a) }
  for (const r of normalizedRosters) { const key = r.identity.name; if (!peopleMap.has(key)) peopleMap.set(key, { staff: {}, attendance: [], rosters: [] }); peopleMap.get(key)!.rosters.push(r) }

  const totalSignals = normalizedAttendance.length + normalizedRosters.length
  const issues = exceptions.length + conflicts.length
  const readiness = totalSignals ? Math.max(0, Math.round(((totalSignals - issues) / totalSignals) * 100)) : 0

  return { dashboard, staff, attendance: normalizedAttendance, rosters: normalizedRosters, logs, alerts, exceptions, validated, conflicts, covered, peopleMap, readiness }
}

export async function createWorkforceAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const payload = {
    action_type: String(formData.get('action_type') || 'review'),
    staff_id: String(formData.get('staff_id') || ''),
    roster_id: String(formData.get('roster_id') || ''),
    attendance_id: String(formData.get('attendance_id') || ''),
    priority: String(formData.get('priority') || 'normal'),
    status: 'open',
    notes: String(formData.get('notes') || ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from(WORKFORCE_TABLES.actions).insert(payload)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'workforce.action.created', source_table: WORKFORCE_TABLES.actions, payload })
  revalidatePath('/hr/workforce-ops')
}

export async function publishRosterAction() {
  'use server'
  const supabase = await createClient()
  const payload = { status: 'published', updated_at: new Date().toISOString() }
  await supabase.from(WORKFORCE_TABLES.rosters).update(payload).neq('status', 'deleted')
  await logHRActivity({ action: 'roster.plan.published', source_table: WORKFORCE_TABLES.rosters, payload })
  revalidatePath('/hr/rosters')
  revalidatePath('/hr/workforce-ops')
  redirect('/hr/workforce-ops')
}
