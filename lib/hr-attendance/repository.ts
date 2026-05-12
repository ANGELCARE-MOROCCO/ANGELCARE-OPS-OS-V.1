import { createClient } from '@/lib/supabase/server'
import type { AttendanceEventType } from './types'

export async function recordAttendanceEvent(input: {
  userId?: string | null; staffId?: string | null; eventType: AttendanceEventType; source?: string; note?: string; metadata?: any
}) {
  const supabase = await createClient()
  const event_at = new Date().toISOString()
  const { data, error } = await supabase.from('app_attendance_logs').insert({
    user_id: input.userId || null,
    staff_id: input.staffId || null,
    event_type: input.eventType,
    source: input.source || 'overhead_panel',
    event_at,
    note: input.note || null,
    metadata: input.metadata || {},
  }).select('*').single()
  if (error) throw new Error(error.message)
  await syncAttendanceForUserDay(input.userId || null, input.staffId || null, event_at)
  return data
}

export async function syncAttendanceForUserDay(userId: string | null, staffId: string | null, isoDate: string) {
  const supabase = await createClient()
  const day = isoDate.slice(0,10)
  let query = supabase.from('app_attendance_logs').select('*').gte('event_at', `${day}T00:00:00.000Z`).lte('event_at', `${day}T23:59:59.999Z`).order('event_at')
  if (userId) query = query.eq('user_id', userId)
  else if (staffId) query = query.eq('staff_id', staffId)
  const { data: logs } = await query
  const events = logs || []
  const punchIn = events.find(x => x.event_type === 'punch_in')
  const punchOut = [...events].reverse().find(x => x.event_type === 'punch_out')
  const inAt = punchIn?.event_at || null
  const outAt = punchOut?.event_at || null
  const total = inAt && outAt ? Math.max(0, Math.round((+new Date(outAt) - +new Date(inAt))/60000)) : 0
  const lateMinutes = inAt ? Math.max(0, Math.round((+new Date(inAt) - +new Date(`${day}T09:00:00.000Z`))/60000)) : 0
  const exceptions: string[] = []
  if (!inAt) exceptions.push('missing_punch_in')
  if (inAt && !outAt) exceptions.push('missing_punch_out')
  if (lateMinutes > 0) exceptions.push('late')
  const status = exceptions.length ? (outAt ? 'exception' : 'open_exception') : 'validated'
  await supabase.from('hr_attendance_records').upsert({
    user_id: userId, staff_id: staffId, work_date: day, punch_in_at: inAt, punch_out_at: outAt,
    total_minutes: total, overtime_minutes: Math.max(0, total - 480), late_minutes: lateMinutes,
    status, exceptions, updated_at: new Date().toISOString(), source: 'sync_engine'
  }, { onConflict: 'user_id,work_date' })
}

export async function getUserAttendanceTimeline(userId: string, limit = 90) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hr_attendance_records').select('*').eq('user_id', userId).order('work_date', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
}

export async function getAttendanceDashboard(view = 'agenda') {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hr_attendance_records').select('*').order('work_date', { ascending: false }).limit(300)
  if (error) return { view, records: [], error: error.message }
  return { view, records: data || [], error: null }
}
