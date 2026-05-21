import { createClient } from '@/lib/supabase/server'
import type { AttendanceAction, AttendanceLiveState, AttendanceRecord, LiveAttendanceStatus, PunchResult } from './types'

const ACTION_TO_COLUMN: Record<AttendanceAction, 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end'> = {
  shift_in: 'check_in',
  shift_out: 'check_out',
  lunch_start: 'lunch_start',
  lunch_end: 'lunch_end',
}

const NEXT_STATUS: Record<AttendanceAction, LiveAttendanceStatus> = {
  shift_in: 'in',
  shift_out: 'out',
  lunch_start: 'pause',
  lunch_end: 'back',
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

function minutesBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return 0
  const start = new Date(a).getTime()
  const end = new Date(b).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return Math.floor((end - start) / 60000)
}

function deriveLiveStatus(record?: AttendanceRecord | null): LiveAttendanceStatus {
  if (!record?.id) return 'none'
  if (record.check_in && record.check_out) return 'out'
  if (record.lunch_start && !record.lunch_end) return 'pause'
  if (record.lunch_start && record.lunch_end && record.check_in && !record.check_out) return 'back'
  if (record.check_in && !record.check_out) return 'in'
  return 'none'
}

function deriveCanPunch(record?: AttendanceRecord | null): Record<AttendanceAction, boolean> {
  const status = deriveLiveStatus(record)
  return {
    shift_in: status === 'none' || status === 'out',
    shift_out: status === 'in' || status === 'back',
    lunch_start: status === 'in' || status === 'back',
    lunch_end: status === 'pause',
  }
}

function deriveMessage(status: LiveAttendanceStatus, record?: AttendanceRecord | null) {
  if (status === 'none') return 'Ready to punch in.'
  if (status === 'in') return `Shift active since ${timeOnly(record?.check_in)}.`
  if (status === 'pause') return `Break active since ${timeOnly(record?.lunch_start)}.`
  if (status === 'back') return `Back from break. Shift remains active.`
  if (status === 'out') return `Shift completed at ${timeOnly(record?.check_out)}.`
  return 'Attendance status needs review.'
}

function computeWorkedMinutes(record?: AttendanceRecord | null) {
  if (!record?.check_in) return Number(record?.total_minutes || 0)
  const end = record.check_out || new Date().toISOString()
  return Math.max(0, minutesBetween(record.check_in, end) - computeBreakMinutes(record))
}

function computeBreakMinutes(record?: AttendanceRecord | null) {
  if (!record?.lunch_start) return Number(record?.break_minutes || 0)
  const end = record.lunch_end || new Date().toISOString()
  return minutesBetween(record.lunch_start, end)
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

async function logHrActivity(input: { entityId?: string | null; title: string; description?: string | null; actorId?: string | null }) {
  const supabase = await createClient()
  await supabase.from('hr_activity_timeline').insert({
    entity_type: 'attendance',
    entity_id: input.entityId || input.actorId || null,
    title: input.title,
    description: input.description || null,
    actor_id: input.actorId || null,
    created_at: new Date().toISOString(),
  }).then(() => null, () => null)
}

async function readTodayRecord(userId: string, day = todayCasablanca()) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_attendance_records')
    .select('*')
    .eq('user_id', userId)
    .eq('attendance_date', day)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data || null) as AttendanceRecord | null
}

export async function getLiveAttendanceState(userId: string): Promise<AttendanceLiveState> {
  const day = todayCasablanca()
  const [staff, record] = await Promise.all([resolveStaffProfileForUser(userId), readTodayRecord(userId, day)])
  const status = deriveLiveStatus(record)
  return {
    ok: true,
    attendance_date: day,
    status,
    message: deriveMessage(status, record),
    record,
    canPunch: deriveCanPunch(record),
    workedMinutes: computeWorkedMinutes(record),
    breakMinutes: computeBreakMinutes(record),
    staff: staff ? { id: staff.id || null, user_id: userId, full_name: staff.full_name || 'Staff member', department: staff.department, position: staff.position } : null,
  }
}

function assertValidTransition(action: AttendanceAction, record?: AttendanceRecord | null) {
  const canPunch = deriveCanPunch(record)
  if (canPunch[action]) return
  const status = deriveLiveStatus(record)
  const labels: Record<AttendanceAction, string> = {
    shift_in: 'punch in',
    shift_out: 'punch out',
    lunch_start: 'start break',
    lunch_end: 'return from break',
  }
  throw new Error(`Cannot ${labels[action]} while attendance status is ${status}. Refresh the page if another device was used.`)
}

export async function syncPunchToHrAttendance(input: {
  userId: string
  action: AttendanceAction
  note?: string | null
  source?: string
  deviceContext?: Record<string, unknown>
  force?: boolean
}): Promise<PunchResult> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const day = todayCasablanca()
  const column = ACTION_TO_COLUMN[input.action]
  const staff = await resolveStaffProfileForUser(input.userId)
  const existing = await readTodayRecord(input.userId, day)

  if (!input.force) assertValidTransition(input.action, existing)

  const { error: logError } = await supabase.from('app_attendance_logs').insert({
    user_id: input.userId,
    staff_profile_id: staff?.id || null,
    action: input.action,
    note: input.note || null,
    source: input.source || 'overhead_panel',
    device_context: input.deviceContext || {},
    validation_status: input.force ? 'forced' : 'auto_accepted',
    created_at: now,
  })
  if (logError) throw new Error(logError.message)

  const patch: Record<string, unknown> = {
    user_id: input.userId,
    staff_profile_id: staff?.id || null,
    staff_name: staff?.full_name || 'Staff member',
    attendance_date: day,
    source: input.source || 'overhead_panel',
    validation_status: input.force ? 'forced_sync' : 'auto_synced',
    status: NEXT_STATUS[input.action] === 'out' ? 'completed' : 'in_progress',
    updated_at: now,
    [column]: now,
  }

  if (input.action === 'shift_in') {
    patch.check_out = null
    patch.lunch_start = null
    patch.lunch_end = null
  }

  if (input.action === 'shift_out' && existing?.lunch_start && !existing?.lunch_end) {
    patch.lunch_end = now
    patch.notes = [existing.notes, 'Auto-closed active break during punch out.'].filter(Boolean).join('\n')
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

  if (recordId) {
    await supabase.rpc('hr_recalculate_attendance_record', { record_id: recordId }).then(() => null, () => null)
    await logHrActivity({
      entityId: recordId,
      actorId: input.userId,
      title: `Attendance ${input.action.replaceAll('_', ' ')}`,
      description: `${staff?.full_name || 'Staff member'} used ${input.source || 'overhead_panel'} at ${now}.`,
    })
  }

  const fresh = await readTodayRecord(input.userId, day)
  const status = deriveLiveStatus(fresh)

  return {
    ok: true,
    attendance_date: day,
    action: input.action,
    status,
    message: deriveMessage(status, fresh),
    record: fresh,
    canPunch: deriveCanPunch(fresh),
    workedMinutes: computeWorkedMinutes(fresh),
    breakMinutes: computeBreakMinutes(fresh),
  }
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
