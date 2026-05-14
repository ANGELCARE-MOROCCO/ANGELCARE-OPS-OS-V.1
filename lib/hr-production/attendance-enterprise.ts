import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getHRDashboardData, HR_TABLES, getHRRecord, logHRActivity } from './repository'

function lower(v: unknown) { return String(v || '').toLowerCase() }
function safe(v: unknown, fallback = '') { const s = String(v || '').trim(); return s || fallback }

export async function getIdentityLinks() {
  const supabase = await createClient()
  try {
    const { data } = await supabase
      .from('hr_identity_links')
      .select('*, staff:hr_staff_profiles(id, full_name, email, department, position, city)')
      .order('created_at', { ascending: false })
      .limit(500)
    return data || []
  } catch {
    return []
  }
}

export async function getResolvedAttendanceRows() {
  const supabase = await createClient()
  try {
    const { data } = await supabase
      .from('v_hr_attendance_resolved_live')
      .select('*')
      .limit(800)
    return data || []
  } catch {
    return []
  }
}

export async function getAttendanceEnterpriseData() {
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  let resolvedRows: any[] = await getResolvedAttendanceRows()

  if (!resolvedRows.length) {
    const attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
    resolvedRows = attendance.map((x: any) => ({
      ...x,
      resolved_staff_name: x.staff_name || x.full_name || x.name || 'Unmapped overhead identity',
      resolved_department: x.department || 'Unmapped department',
      resolved_position: x.position || 'Staff',
      resolved_city: x.city || x.location || 'Head Office',
      identity_resolution_source: 'fallback',
    }))
  }

  const records = resolvedRows.map((row: any) => {
    const status = safe(row.validation_status || row.attendance_status || row.status, 'pending')
    const total = Number(row.total_minutes || 0)
    return {
      id: String(row.id),
      identity: {
        id: String(row.resolved_staff_id || row.staff_id || row.user_id || row.resolved_staff_name),
        name: safe(row.resolved_staff_name, 'Unmapped overhead identity'),
        role: safe(row.resolved_position, 'Staff'),
        department: safe(row.resolved_department, 'Unmapped department'),
        location: safe(row.resolved_city || row.location, 'Head Office'),
        staff_id: row.resolved_staff_id || row.staff_id || null,
        user_id: row.user_id || null,
        profile_id: row.profile_id || null,
      },
      work_date: safe(row.work_date || row.created_at, '').slice(0, 10),
      punch_in_at: row.punch_in_at || row.check_in_at || row.clock_in_at || null,
      punch_out_at: row.punch_out_at || row.check_out_at || row.clock_out_at || null,
      break_start_at: row.break_start_at || null,
      break_end_at: row.break_end_at || null,
      status,
      validation_status: safe(row.validation_status, status),
      source: safe(row.source, 'hr'),
      payroll_status: safe(row.payroll_status, 'not_ready'),
      late_minutes: Number(row.late_minutes || 0),
      overtime_minutes: Number(row.overtime_minutes || Math.max(0, total - 480)),
      total_minutes: total,
      identity_resolution_source: row.identity_resolution_source,
      raw: row,
    }
  })

  let logs: any[] = []
  const supabase = await createClient()
  try {
    const { data } = await supabase.from('app_attendance_logs').select('*').order('event_at', { ascending: false }).limit(500)
    logs = data || []
  } catch {}

  const mapped = records.filter(x => x.identity_resolution_source === 'identity_bridge' || x.identity_resolution_source === 'direct_staff_id')
  const present = records.filter(x => /present|valid|complete|approved|auto/i.test(x.status))
  const late = records.filter(x => /late/i.test(x.status) || x.late_minutes > 0)
  const absent = records.filter(x => /absent|missing/i.test(x.status))
  const exceptions = records.filter(x => /review|pending|late|absent|missing|exception|open/i.test(x.status))
  const overtime = records.filter(x => x.overtime_minutes > 0 || /overtime/i.test(x.status))
  const unmapped = records.filter(x => x.identity_resolution_source === 'bridge_unmapped' || x.identity.name === 'Unmapped overhead identity')

  const byPerson = new Map<string, any[]>()
  for (const r of records) {
    const key = r.identity.staff_id || r.identity.user_id || r.identity.name
    if (!byPerson.has(String(key))) byPerson.set(String(key), [])
    byPerson.get(String(key))!.push(r)
  }

  const departments = new Map<string, {total:number; present:number; late:number; absent:number; overtime:number}>()
  for (const r of records) {
    const k = r.identity.department
    if (!departments.has(k)) departments.set(k, { total: 0, present: 0, late: 0, absent: 0, overtime: 0 })
    const d = departments.get(k)!
    d.total++
    if (present.includes(r)) d.present++
    if (late.includes(r)) d.late++
    if (absent.includes(r)) d.absent++
    if (overtime.includes(r)) d.overtime++
  }

  const score = records.length ? Math.max(0, Math.round(((records.length - exceptions.length - unmapped.length) / records.length) * 100)) : 0
  return { dashboard, staff, records, logs, liveState: [], mapped, present, late, absent, exceptions, overtime, unmapped, byPerson, departments, score, loadedAt: new Date().toISOString() }
}

export async function mapIdentityToStaffAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const link_id = String(formData.get('link_id') || '')
  const staff_id = String(formData.get('staff_id') || '')
  if (!link_id || !staff_id) throw new Error('Missing link_id or staff_id')

  const { data: staff } = await supabase.from(HR_TABLES.staff).select('id, full_name').eq('id', staff_id).maybeSingle()

  const { error } = await supabase
    .from('hr_identity_links')
    .update({
      staff_id,
      label: staff?.full_name || 'Mapped staff',
      status: 'mapped',
      confidence: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', link_id)

  if (error) throw new Error(error.message)

  const { data: link } = await supabase.from('hr_identity_links').select('*').eq('id', link_id).maybeSingle()

  if (link?.source_user_id) {
    await supabase.from(HR_TABLES.attendance).update({ staff_id }).eq('user_id', link.source_user_id).is('staff_id', null)
    await supabase.from('app_attendance_logs').update({ staff_id }).eq('user_id', link.source_user_id).is('staff_id', null)
  }

  await logHRActivity({ action: 'attendance.identity.mapped', source_table: 'hr_identity_links', record_id: link_id, payload: { staff_id, link } })
  revalidatePath('/hr/attendance')
  revalidatePath('/hr/attendance/identity-map')
}

export async function approveAttendanceAction(id: string) {
  'use server'
  const supabase = await createClient()
  const before = await getHRRecord(HR_TABLES.attendance, id)
  const payload = { status: 'validated', validation_status: 'validated', updated_at: new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.attendance).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await logHRActivity({ action: 'attendance.approved', source_table: HR_TABLES.attendance, record_id: id, before, after: payload })
  revalidatePath('/hr/attendance')
}

export async function markReviewAttendanceAction(id: string) {
  'use server'
  const supabase = await createClient()
  const payload = { status: 'needs_review', validation_status: 'needs_review', updated_at: new Date().toISOString() }
  const { error } = await supabase.from(HR_TABLES.attendance).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hr/attendance')
}


export async function createAttendanceAction(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const payload = {
    attendance_id: String(formData.get('attendance_id') || '') || null,
    staff_id: String(formData.get('staff_id') || '') || null,
    action_type: String(formData.get('action_type') || 'review'),
    priority: String(formData.get('priority') || 'normal'),
    status: 'open',
    notes: String(formData.get('notes') || ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('hr_attendance_actions').insert(payload)
  if (error) throw new Error(error.message)

  await logHRActivity({
    action: 'attendance.action.created',
    source_table: 'hr_attendance_actions',
    entity_type: 'attendance_action',
    payload,
  })

  revalidatePath('/hr/attendance')
  revalidatePath('/hr/attendance/actions')
}
