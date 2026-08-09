import { createClient } from '@/lib/supabase/server'
import { getHRDashboardData } from './repository'

function normalizeText(value: unknown) {
  return String(value || '').toLowerCase()
}

export async function getWorkforceAttendanceData() {
  const supabase = await createClient()
  const dashboard = await getHRDashboardData()

  let logs: any[] = []
  try {
    const res = await supabase.from('app_attendance_logs').select('*').order('event_at', { ascending: false }).limit(500)
    logs = res.data || []
  } catch {}

  const attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  const rosters = Array.isArray(dashboard.rosters) ? dashboard.rosters : []

  const records = attendance.map((row: any) => {
    const staffRecord = staff.find((s: any) =>
      [s.id, s.user_id, s.profile_id].filter(Boolean).includes(row.staff_id || row.user_id || row.profile_id)
    )
    return {
      ...row,
      staff_name: row.staff_name || staffRecord?.full_name || staffRecord?.name || staffRecord?.email || 'Staff member',
      department: row.department || staffRecord?.department || '—',
      city: row.city || staffRecord?.city || '—',
    }
  })

  const exceptions = records.filter((x: any) => {
    const s = normalizeText(x.status || x.attendance_status || x.validation_status || x.exception_type)
    return s.includes('late') || s.includes('missing') || s.includes('review') || s.includes('exception') || s.includes('pending')
  })

  const completed = records.filter((x: any) => normalizeText(x.status || x.validation_status).match(/complete|validated|approved|closed/))

  const peopleMap = new Map<string, any[]>()
  for (const row of records) {
    const key = row.staff_name || row.staff_id || row.user_id || 'Unassigned'
    if (!peopleMap.has(key)) peopleMap.set(key, [])
    peopleMap.get(key)!.push(row)
  }

  const total = records.length
  const readiness = total ? Math.max(0, Math.round(((total - exceptions.length) / total) * 100)) : 0

  return { dashboard, staff, rosters, logs, records, exceptions, completed, peopleMap, readiness }
}
