import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getHRDashboardData, HR_TABLES, getHRRecord, logHRActivity } from './repository'

export type AttendanceLiveRecord = { id:string; staff_id?:string|null; user_id?:string|null; staff_name:string; department:string; position:string; city:string; work_date:string; punch_in_at?:string|null; punch_out_at?:string|null; status:string; source:string; validation_status:string; raw:any }

function lower(v: unknown) { return String(v || '').toLowerCase() }
function val(row:any, keys:string[], fallback='') { for (const k of keys) { const v=row?.[k]; if (v!==null && v!==undefined && String(v).trim()!=='') return String(v) } return fallback }

function staffMatch(row:any, staff:any[]) {
  const ids=[row.staff_id,row.employee_id,row.user_id,row.profile_id,row.created_by,row.owner_id].filter(Boolean).map(String)
  return staff.find((s:any)=>[s.id,s.user_id,s.profile_id,s.employee_id,s.auth_user_id].filter(Boolean).map(String).some((id:string)=>ids.includes(id)))
}

function normalizeRecord(row:any, staff:any[]): AttendanceLiveRecord {
  const s=staffMatch(row, staff) || {}
  const status=val(row,['validation_status','attendance_status','status','state'],'pending')
  const name=val(row,['staff_name','employee_name','full_name','name'],'') || val(s,['full_name','name','display_name','email'],'') || 'Unmapped staff'
  return {
    id:String(row.id || `${row.staff_id || row.user_id || 'record'}-${row.work_date || row.created_at || Math.random()}`),
    staff_id: row.staff_id || s.id || null,
    user_id: row.user_id || s.user_id || null,
    staff_name:name,
    department: val(row,['department'],'') || val(s,['department','team','unit'],'Unmapped department'),
    position: val(row,['position','role'],'') || val(s,['position','job_title','role'],'Staff'),
    city: val(row,['city','location'],'') || val(s,['city','location','branch'],'Unmapped location'),
    work_date: val(row,['work_date','date'],'') || val(row,['created_at','event_at'],'').slice(0,10),
    punch_in_at: row.punch_in_at || row.check_in_at || row.clock_in_at || row.start_time || null,
    punch_out_at: row.punch_out_at || row.check_out_at || row.clock_out_at || row.end_time || null,
    status,
    source: val(row,['source'],'hr'),
    validation_status: status,
    raw: row,
  }
}

export async function getAttendanceLiveData() {
  const supabase = await createClient()
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  let attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
  let logs:any[] = []
  try { const res = await supabase.from('app_attendance_logs').select('*').order('event_at', { ascending:false }).limit(500); logs = res.data || [] } catch {}
  if ((!attendance || attendance.length === 0) && logs.length) attendance = logs.map((x:any)=>({ ...x, id:x.id, work_date:String(x.event_at || x.created_at || '').slice(0,10), punch_in_at:lower(x.event_type).includes('in') ? x.event_at : null, punch_out_at:lower(x.event_type).includes('out') ? x.event_at : null, status:'auto_synced', source:x.source || 'overhead_panel' }))
  const records = attendance.map((x:any)=>normalizeRecord(x, staff))
  const realMapped = records.filter(x=>x.staff_name !== 'Unmapped staff')
  const present = records.filter(x=>lower(x.status).match(/present|complete|validated|auto_synced|approved/))
  const late = records.filter(x=>lower(x.status).includes('late'))
  const absent = records.filter(x=>lower(x.status).includes('absent'))
  const exceptions = records.filter(x=>lower(x.status).match(/pending|review|missing|late|absent|exception|open/))
  const unmapped = records.filter(x=>x.staff_name === 'Unmapped staff')
  const departments = new Map<string, { total:number; present:number; late:number; absent:number }>()
  for (const r of records) { const k=r.department || 'Unmapped department'; if (!departments.has(k)) departments.set(k,{total:0,present:0,late:0,absent:0}); const d=departments.get(k)!; d.total++; if (present.includes(r)) d.present++; if (late.includes(r)) d.late++; if (absent.includes(r)) d.absent++ }
  const byStaff = new Map<string, AttendanceLiveRecord[]>()
  for (const r of records) { const k=String(r.staff_id || r.user_id || r.staff_name); if (!byStaff.has(k)) byStaff.set(k,[]); byStaff.get(k)!.push(r) }
  const score = records.length ? Math.round(((records.length - exceptions.length - unmapped.length) / records.length) * 100) : 0
  return { staff, records, logs, realMapped, present, late, absent, exceptions, unmapped, departments, byStaff, score, loadedAt:new Date().toISOString() }
}

export async function updateAttendanceStatusAction(id:string, status:string) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(HR_TABLES.attendance, id)
  const payload = { status, validation_status: status, updated_at: new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.attendance).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action:'attendance.status.updated', source_table:HR_TABLES.attendance, record_id:id, entity_type:'attendance', entity_id:id, before, after:payload })
  revalidatePath('/hr/attendance')
}
export async function approveAttendanceAction(id:string) { 'use server'; await updateAttendanceStatusAction(id,'validated') }
export async function markAttendanceReviewAction(id:string) { 'use server'; await updateAttendanceStatusAction(id,'needs_review') }
