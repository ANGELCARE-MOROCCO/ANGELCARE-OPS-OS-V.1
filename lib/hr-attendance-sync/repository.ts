import { createClient } from '@/lib/supabase/server'
import type { AttendanceAction, AttendanceRecord } from './types'

const ACTION_TO_COLUMN: Record<AttendanceAction, 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end'> = {
  shift_in: 'check_in',
  shift_out: 'check_out',
  lunch_start: 'lunch_start',
  lunch_end: 'lunch_end',
}

export function todayCasablanca() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function minutesToHours(value?: number | null) {
  const mins = Math.max(0, Number(value || 0))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

export function timeOnly(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '—'
  }
}

export async function resolveStaffProfileForUser(userId: string) {
  const supabase = await createClient()
  const { data: direct } = await supabase
    .from('hr_staff_profiles')
    .select('id, full_name, department, position, user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (direct) return direct

  const { data: user } = await supabase
    .from('app_users')
    .select('id, full_name, name, email, department, job_title')
    .eq('id', userId)
    .maybeSingle()

  return user
    ? { id: null, user_id: user.id, full_name: user.full_name || user.name || user.email || 'Staff member', department: user.department, position: user.job_title }
    : null
}

export async function syncPunchToHrAttendance(input: {
  userId: string
  action: AttendanceAction
  note?: string | null
  source?: string
  deviceContext?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const day = todayCasablanca()
  const column = ACTION_TO_COLUMN[input.action]
  const staff = await resolveStaffProfileForUser(input.userId)

  const { error: logError } = await supabase.from('app_attendance_logs').insert({
    user_id: input.userId,
    staff_profile_id: staff?.id || null,
    action: input.action,
    note: input.note || null,
    source: input.source || 'overhead_panel',
    device_context: input.deviceContext || {},
    created_at: now,
  })
  if (logError) throw new Error(logError.message)

  const { data: existing } = await supabase
    .from('hr_attendance_records')
    .select('*')
    .eq('user_id', input.userId)
    .eq('attendance_date', day)
    .maybeSingle()

  const patch: Record<string, unknown> = {
    user_id: input.userId,
    staff_profile_id: staff?.id || null,
    staff_name: staff?.full_name || 'Staff member',
    attendance_date: day,
    source: input.source || 'overhead_panel',
    validation_status: 'auto_synced',
    status: input.action === 'shift_out' ? 'completed' : 'in_progress',
    updated_at: now,
    [column]: now,
  }

  let recordId = existing?.id as string | undefined
  if (existing?.id) {
    const { error } = await supabase.from('hr_attendance_records').update(patch).eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase.from('hr_attendance_records').insert({ ...patch, created_at: now }).select('id').single()
    if (error) throw new Error(error.message)
    recordId = data?.id
  }

  if (recordId) await supabase.rpc('hr_recalculate_attendance_record', { record_id: recordId })
  return { ok: true, attendance_date: day, action: input.action }
}

export async function getAttendanceCommandData(options?: { from?: string; to?: string; userId?: string }) {
  const supabase = await createClient()
  const to = options?.to || todayCasablanca()
  const from = options?.from || addDays(to, -6)

  let recordsQuery = supabase
    .from('hr_attendance_records')
    .select('*')
    .gte('attendance_date', from)
    .lte('attendance_date', to)
    .order('attendance_date', { ascending: false })
    .order('check_in', { ascending: false })

  let logsQuery = supabase
    .from('app_attendance_logs')
    .select('*')
    .gte('created_at', `${from}T00:00:00.000Z`)
    .lte('created_at', `${to}T23:59:59.999Z`)
    .order('created_at', { ascending: false })

  if (options?.userId) {
    recordsQuery = recordsQuery.eq('user_id', options.userId)
    logsQuery = logsQuery.eq('user_id', options.userId)
  }

  const [{ data: records, error: recordsError }, { data: logs, error: logsError }] = await Promise.all([recordsQuery, logsQuery])
  if (recordsError) throw new Error(recordsError.message)
  if (logsError) throw new Error(logsError.message)

  const safeRecords = (records || []) as AttendanceRecord[]
  const completed = safeRecords.filter((r) => r.status === 'completed').length
  const inProgress = safeRecords.filter((r) => r.status === 'in_progress').length
  const exceptions = safeRecords.filter((r) => r.missing_punch || r.status === 'needs_review' || r.anomaly_reason).length
  const totalMinutes = safeRecords.reduce((sum, r) => sum + Number(r.total_minutes || 0), 0)
  const overtimeMinutes = safeRecords.reduce((sum, r) => sum + Number(r.overtime_minutes || 0), 0)
  const people = new Set(safeRecords.map((r) => r.user_id || r.staff_profile_id || r.staff_name).filter(Boolean)).size

  return {
    from,
    to,
    records: safeRecords,
    logs: logs || [],
    metrics: {
      records: safeRecords.length,
      people,
      completed,
      inProgress,
      exceptions,
      totalMinutes,
      overtimeMinutes,
    },
  }
}
