import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getHRDashboardData, HR_TABLES, getHRRecord, logHRActivity } from './repository'

function lower(v: unknown) { return String(v || '').toLowerCase() }
function pick(row: any, keys: string[], fallback = '') {
  for (const k of keys) {
    const v = row?.[k]
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v)
  }
  return fallback
}
function matchStaff(row: any, staff: any[]) {
  const ids = [row.staff_id,row.employee_id,row.user_id,row.profile_id,row.created_by,row.owner_id].filter(Boolean).map(String)
  return staff.find((s:any)=>[s.id,s.user_id,s.profile_id,s.employee_id,s.auth_user_id].filter(Boolean).map(String).some((id:string)=>ids.includes(id)))
}
function normalize(row: any, staff: any[]) {
  const s = matchStaff(row, staff) || {}
  const status = pick(row, ['validation_status','attendance_status','status','state'], 'pending')
  const name = pick(row, ['staff_name','employee_name','full_name','name'], '') || pick(s, ['full_name','name','display_name','email'], '') || 'Unmapped staff'
  return {
    id: String(row.id || `${row.staff_id || row.user_id || name}-${row.work_date || row.event_at || Math.random()}`),
    staff_id: row.staff_id || s.id || null,
    user_id: row.user_id || s.user_id || null,
    name,
    role: pick(row, ['position','role'], '') || pick(s, ['position','job_title','role'], 'Staff'),
    department: pick(row, ['department'], '') || pick(s, ['department','team','unit'], 'Unmapped department'),
    location: pick(row, ['location','city'], '') || pick(s, ['city','location','branch'], 'Head Office'),
    work_date: pick(row, ['work_date','date'], '') || pick(row, ['created_at','event_at'], '').slice(0,10),
    punch_in_at: row.punch_in_at || row.check_in_at || row.clock_in_at || row.start_time || null,
    punch_out_at: row.punch_out_at || row.check_out_at || row.clock_out_at || row.end_time || null,
    status,
    source: pick(row, ['source'], 'hr'),
    raw: row,
  }
}
export async function getAttendanceMonitorData() {
  const supabase = await createClient()
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  let attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
  let logs: any[] = []
  try { const res = await supabase.from('app_attendance_logs').select('*').order('event_at', { ascending:false }).limit(500); logs = res.data || [] } catch {}
  if ((!attendance || attendance.length === 0) && logs.length) {
    attendance = logs.map((x:any)=>({ ...x, work_date:String(x.event_at || x.created_at || '').slice(0,10), punch_in_at:lower(x.event_type).includes('in') ? x.event_at : null, punch_out_at:lower(x.event_type).includes('out') ? x.event_at : null, status:'auto_synced', source:x.source || 'overhead_panel' }))
  }
  const records = attendance.map((x:any)=>normalize(x, staff))
  const mapped = records.filter((x:any)=>x.name !== 'Unmapped staff')
  const present = records.filter((x:any)=>lower(x.status).match(/present|valid|complete|approved|auto/))
  const late = records.filter((x:any)=>lower(x.status).includes('late'))
  const absent = records.filter((x:any)=>lower(x.status).includes('absent'))
  const exceptions = records.filter((x:any)=>lower(x.status).match(/pending|review|missing|late|absent|exception|open/))
  const onLeave = records.filter((x:any)=>lower(x.status).includes('leave'))
  const departments = new Map<string, any>()
  for (const r of records) {
    if (!departments.has(r.department)) departments.set(r.department, { total:0, present:0, late:0, absent:0 })
    const d = departments.get(r.department); d.total++; if (present.includes(r)) d.present++; if (late.includes(r)) d.late++; if (absent.includes(r)) d.absent++
  }
  const byPerson = new Map<string, any[]>()
  for (const r of records) { const k = String(r.staff_id || r.user_id || r.name); if (!byPerson.has(k)) byPerson.set(k, []); byPerson.get(k)!.push(r) }
  const score = records.length ? Math.round((present.length / records.length) * 100) : 0
  return { staff, records, mapped, present, late, absent, exceptions, onLeave, departments, byPerson, logs, score }
}
export async function approveAttendanceAction(id: string) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(HR_TABLES.attendance, id)
  const payload = { status:'validated', validation_status:'validated', updated_at:new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.attendance).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action:'attendance.approved', source_table:HR_TABLES.attendance, record_id:id, before, after:payload })
  revalidatePath('/hr/attendance')
}
