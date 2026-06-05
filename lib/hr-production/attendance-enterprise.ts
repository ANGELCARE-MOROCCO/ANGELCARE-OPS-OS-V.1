import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getHRDashboardData, getHRRecord, HR_TABLES, logHRActivity } from './repository'

type AnyRow = Record<string, any>

function clean(value: unknown, fallback = '') {
  const s = String(value ?? '').trim()
  return s.length ? s : fallback
}

function low(value: unknown) {
  return clean(value).toLowerCase()
}

function first(row: AnyRow, keys: string[], fallback: any = null) {
  for (const key of keys) {
    const v = row?.[key]
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return fallback
}

function minutesBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return 0
  const start = new Date(a).getTime()
  const end = new Date(b).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.round((end - start) / 60000)
}

async function safeSelect(table: string, orderColumn?: string, limit = 800) {
  const supabase = await createClient()
  try {
    let q = supabase.from(table).select('*').limit(limit)
    if (orderColumn) q = q.order(orderColumn, { ascending: false })
    const { data, error } = await q
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch {
    return null
  }
}

function uniqueRowsById(rows: AnyRow[]) {
  const seen = new Set<string>()
  const out: AnyRow[] = []
  for (const row of rows || []) {
    const key = String(row?.id || `${row?.user_id || row?.staff_profile_id || row?.staff_id || 'row'}-${row?.attendance_date || row?.work_date || row?.created_at || Math.random()}`)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

function ids(row: AnyRow) {
  const meta = row.metadata || row.payload || row.raw || {}
  return [
    row.id,
    row.staff_id,
    row.employee_id,
    row.user_id,
    row.profile_id,
    row.staff_profile_id,
    row.auth_user_id,
    row.created_by,
    row.owner_id,
    row.person_id,
    meta.staff_id,
    meta.employee_id,
    meta.user_id,
    meta.profile_id,
    meta.staff_profile_id,
    meta.auth_user_id,
    meta.person_id,
  ].filter(Boolean).map(String)
}

function emails(row: AnyRow) {
  const meta = row.metadata || row.payload || row.raw || {}
  return [
    row.email,
    row.staff_email,
    row.employee_email,
    meta.email,
    meta.staff_email,
    meta.employee_email,
  ].filter(Boolean).map((x:any)=>String(x).toLowerCase())
}

function resolveIdentity(row: AnyRow, staff: AnyRow[], links: AnyRow[]) {
  const rowIds = ids(row)
  const rowEmails = emails(row)

  const directStaff = staff.find((s:any) => ids(s).some(id => rowIds.includes(id)) || emails(s).some(email => rowEmails.includes(email)))

  const link = links.find((l:any) =>
    [l.source_user_id, l.source_staff_id, l.user_id, l.staff_id].filter(Boolean).map(String).some((id:string)=>rowIds.includes(id))
  )

  const linkedStaff = link?.staff_id ? staff.find((s:any)=>String(s.id) === String(link.staff_id)) : null
  const s = directStaff || linkedStaff || null

  const meta = row.metadata || row.payload || row.raw || {}

  const fallbackName =
    first(row, ['staff_name','employee_name','full_name','name','display_name'], '') ||
    first(meta, ['staff_name','employee_name','full_name','name','display_name'], '') ||
    link?.label ||
    'Unmapped staff'

  return {
    id: String(s?.id || link?.staff_id || row.staff_id || row.user_id || row.profile_id || fallbackName),
    name: clean(s?.full_name || s?.name || s?.display_name || s?.email || fallbackName, 'Unmapped staff'),
    role: clean(s?.position || s?.job_title || row.position || row.role || meta.position || meta.role, 'Staff'),
    department: clean(s?.department || row.department || meta.department, 'Unmapped department'),
    location: clean(s?.city || s?.location || row.city || row.location || meta.city || meta.location, 'Head Office'),
    staff_id: s?.id || link?.staff_id || row.staff_id || null,
    user_id: s?.user_id || row.user_id || link?.source_user_id || null,
    profile_id: s?.profile_id || row.profile_id || null,
    resolution_source: s ? (directStaff ? 'direct_or_profile_match' : 'identity_bridge') : (fallbackName !== 'Unmapped staff' ? 'row_metadata' : 'unmapped'),
  }
}

function normalizeStatus(row: AnyRow) {
  const raw = low(first(row, ['validation_status','attendance_status','status','state','event_type'], 'pending'))
  if (raw.includes('out')) return 'completed'
  if (raw.includes('in')) return 'present'
  if (raw.includes('valid') || raw.includes('approved') || raw.includes('complete')) return 'completed'
  if (raw.includes('auto')) return 'auto_synced'
  if (raw.includes('late')) return 'late'
  if (raw.includes('absent')) return 'absent'
  if (raw.includes('review') || raw.includes('pending') || raw.includes('open')) return 'needs_review'
  return raw || 'pending'
}

function normalizeAttendanceRow(row: AnyRow, staff: AnyRow[], links: AnyRow[], sourceTable: string) {
  const identity = resolveIdentity(row, staff, links)

  const punchIn =
    first(row, ['punch_in_at','check_in','check_in_at','clock_in_at','started_at','start_at','start_time'], null) ||
    (low(row.event_type).includes('in') || low(row.action).includes('shift_in') || low(row.action).includes('clock_in') ? (row.event_at || row.created_at) : null)

  const punchOut =
    first(row, ['punch_out_at','check_out','check_out_at','clock_out_at','ended_at','end_at','end_time'], null) ||
    (low(row.event_type).includes('out') || low(row.action).includes('shift_out') || low(row.action).includes('clock_out') ? (row.event_at || row.created_at) : null)

  const workDate =
    clean(first(row, ['work_date','attendance_date','date','day'], '')) ||
    clean(first(row, ['event_at','created_at','started_at','punch_in_at'], '')).slice(0, 10)

  const total = Number(first(row, ['total_minutes','work_minutes','duration_minutes','minutes'], 0)) || minutesBetween(punchIn, punchOut)

  return {
    id: String(row.id || `${sourceTable}-${identity.id}-${workDate}-${Math.random()}`),
    source_table: sourceTable,
    identity,
    work_date: workDate,
    punch_in_at: punchIn,
    punch_out_at: punchOut,
    break_start_at: first(row, ['break_start_at','lunch_start','pause_start_at','break_in_at'], null) ||
      (low(row.event_type).includes('break') || low(row.action).includes('lunch_start') || low(row.action).includes('break_start') ? (row.event_at || row.created_at) : null),
    break_end_at: first(row, ['break_end_at','lunch_end','pause_end_at','break_out_at'], null) ||
      (low(row.action).includes('lunch_end') || low(row.action).includes('break_end') || low(row.action).includes('resume') ? (row.event_at || row.created_at) : null),
    status: normalizeStatus(row),
    validation_status: clean(first(row, ['validation_status','attendance_status','status'], ''), normalizeStatus(row)),
    source: clean(row.source, sourceTable),
    payroll_status: clean(row.payroll_status, 'not_ready'),
    late_minutes: Number(first(row, ['late_minutes','delay_minutes'], 0)) || 0,
    overtime_minutes: Number(first(row, ['overtime_minutes'], 0)) || Math.max(0, total - 480),
    total_minutes: total,
    raw: row,
  }
}

function dedupe(rows: AnyRow[]) {
  const seen = new Map<string, AnyRow>()
  for (const row of rows) {
    const key = [
      row.identity?.staff_id || row.identity?.user_id || row.identity?.name,
      row.work_date,
      row.punch_in_at || '',
      row.punch_out_at || '',
      row.source_table,
    ].join('|')

    if (!seen.has(key)) seen.set(key, row)
  }
  return Array.from(seen.values())
}

export async function getAttendanceEnterpriseData() {
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []

  const links = await safeSelect('hr_identity_links', 'created_at', 700)
  const authenticatedUser = await getAuthenticatedUser()
  const directAttendanceRows = await safeSelect('hr_attendance_records', 'updated_at', 1200)
  const dashboardAttendanceRows = Array.isArray(dashboard.attendance) ? dashboard.attendance : []
  const combinedAttendanceRows = uniqueRowsById([...directAttendanceRows, ...dashboardAttendanceRows])

  const sources: { table: string; order?: string; rows: AnyRow[] }[] = [
    { table: 'v_hr_attendance_resolved_live', rows: await safeSelect('v_hr_attendance_resolved_live', 'created_at', 900) },
    { table: 'hr_attendance_records', rows: combinedAttendanceRows },
    { table: 'app_attendance_logs', order: 'event_at', rows: await safeSelect('app_attendance_logs', 'event_at', 900) },

    // User profile / app profile likely attendance sources.
    { table: 'user_attendance_records', order: 'created_at', rows: await safeSelect('user_attendance_records', 'created_at', 900) },
    { table: 'profile_attendance_records', order: 'created_at', rows: await safeSelect('profile_attendance_records', 'created_at', 900) },
    { table: 'user_attendance', order: 'created_at', rows: await safeSelect('user_attendance', 'created_at', 900) },
    { table: 'profile_attendance', order: 'created_at', rows: await safeSelect('profile_attendance', 'created_at', 900) },
    { table: 'attendance_records', order: 'created_at', rows: await safeSelect('attendance_records', 'created_at', 900) },
    { table: 'app_user_attendance', order: 'created_at', rows: await safeSelect('app_user_attendance', 'created_at', 900) },
    { table: 'user_time_entries', order: 'created_at', rows: await safeSelect('user_time_entries', 'created_at', 900) },
    { table: 'time_entries', order: 'created_at', rows: await safeSelect('time_entries', 'created_at', 900) },
  ]

  const normalized = sources.flatMap(src => (src.rows || []).map(row => normalizeAttendanceRow(row, staff, links, src.table)))

  // Critical live-board guarantee:
  // the OverheadPanel reads the authenticated user's live session from hr_attendance_records.
  // The shift board must include the same user's row even when the user is CEO/admin and not linked
  // to an HR staff profile, or when dashboard.attendance was capped before the newest row.
  if (authenticatedUser?.id) {
    const currentUserRows = combinedAttendanceRows.filter((row) => String(row?.user_id || row?.auth_user_id || '') === String(authenticatedUser.id))
    for (const row of currentUserRows) normalized.push(normalizeAttendanceRow(row, staff, links, 'hr_attendance_records'))
  }

  const records = dedupe(normalized)

  const logs = sources.find(s => s.table === 'app_attendance_logs')?.rows || []
  const mapped = records.filter(r => r.identity.resolution_source !== 'unmapped')
  const present = records.filter(r => /present|completed|auto|valid|approved/i.test(r.status))
  const late = records.filter(r => /late/i.test(r.status) || r.late_minutes > 0)
  const absent = records.filter(r => /absent|missing/i.test(r.status))
  const exceptions = records.filter(r => /review|pending|late|absent|missing|exception|open/i.test(r.status))
  const overtime = records.filter(r => r.overtime_minutes > 0 || /overtime/i.test(r.status))
  const unmapped = records.filter(r => r.identity.resolution_source === 'unmapped')

  const byPerson = new Map<string, AnyRow[]>()
  for (const r of records) {
    const key = r.identity.staff_id || r.identity.user_id || r.identity.name
    if (!byPerson.has(String(key))) byPerson.set(String(key), [])
    byPerson.get(String(key))!.push(r)
  }

  const departments = new Map<string, { total: number; present: number; late: number; absent: number; overtime: number }>()
  for (const r of records) {
    const k = r.identity.department || 'Unmapped department'
    if (!departments.has(k)) departments.set(k, { total: 0, present: 0, late: 0, absent: 0, overtime: 0 })
    const d = departments.get(k)!
    d.total++
    if (present.includes(r)) d.present++
    if (late.includes(r)) d.late++
    if (absent.includes(r)) d.absent++
    if (overtime.includes(r)) d.overtime++
  }

  const sourceBreakdown = sources.map(s => ({ table: s.table, count: s.rows.length })).filter(s => s.count > 0)
  const score = records.length ? Math.max(0, Math.round(((records.length - exceptions.length - unmapped.length) / records.length) * 100)) : 0

  return {
    dashboard,
    staff,
    records,
    logs,
    liveState: [],
    mapped,
    present,
    late,
    absent,
    exceptions,
    overtime,
    unmapped,
    byPerson,
    departments,
    score,
    sourceBreakdown,
    loadedAt: new Date().toISOString(),
  }
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

export async function redirectToStaffAttendance(formData: FormData) {
  'use server'
  const staffId = String(formData.get('staff_id') || '')
  redirect(staffId ? `/hr/attendance/staff/${staffId}` : '/hr/attendance')
}


export async function getIdentityLinks() {
  const supabase = await createClient()
  try {
    const { data } = await supabase
      .from('hr_identity_links')
      .select('*, staff:hr_staff_profiles(id, full_name, email, department, position, city)')
      .order('created_at', { ascending: false })
      .limit(700)

    return data || []
  } catch {
    return []
  }
}


export async function mapIdentityToStaffAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const link_id = String(formData.get('link_id') || '')
  const staff_id = String(formData.get('staff_id') || '')

  if (!link_id || !staff_id) {
    throw new Error('Missing link_id or staff_id')
  }

  const { data: staff } = await supabase
    .from(HR_TABLES.staff)
    .select('id, full_name, email, department, position, city')
    .eq('id', staff_id)
    .maybeSingle()

  const { error } = await supabase
    .from('hr_identity_links')
    .update({
      staff_id,
      label: staff?.full_name || staff?.email || 'Mapped staff',
      status: 'mapped',
      confidence: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', link_id)

  if (error) throw new Error(error.message)

  const { data: link } = await supabase
    .from('hr_identity_links')
    .select('*')
    .eq('id', link_id)
    .maybeSingle()

  if (link?.source_user_id) {
    await supabase
      .from(HR_TABLES.attendance)
      .update({ staff_id })
      .eq('user_id', link.source_user_id)

    await supabase
      .from('app_attendance_logs')
      .update({ staff_id })
      .eq('user_id', link.source_user_id)
  }

  try {
    await supabase
      .from('hr_user_identity_contracts')
      .upsert({
        staff_id,
        user_id: link?.source_user_id || null,
        email: staff?.email || null,
        full_name: staff?.full_name || null,
        source: 'manual_identity_map',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'staff_id' })
  } catch {}

  await logHRActivity({
    action: 'attendance.identity.mapped',
    source_table: 'hr_identity_links',
    record_id: link_id,
    entity_type: 'identity_link',
    payload: { link_id, staff_id, source_user_id: link?.source_user_id },
  })

  revalidatePath('/hr/attendance')
  revalidatePath('/hr/attendance/identity-map')
}
