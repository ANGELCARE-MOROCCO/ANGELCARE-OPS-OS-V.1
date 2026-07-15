import { createClient } from '@/lib/supabase/server'
import { getHRDashboardData } from './repository'

function clean(value: unknown) {
  const s = String(value || '').trim()
  return s.length ? s : ''
}

function lower(value: unknown) {
  return clean(value).toLowerCase()
}

function getMetadata(row: any) {
  const m = row?.metadata || row?.payload || row?.raw || {}
  return typeof m === 'object' && m ? m : {}
}

function idsFrom(row: any) {
  const meta = getMetadata(row)
  return [
    row?.staff_id,
    row?.employee_id,
    row?.user_id,
    row?.profile_id,
    row?.auth_user_id,
    row?.created_by,
    row?.owner_id,
    meta?.staff_id,
    meta?.employee_id,
    meta?.user_id,
    meta?.profile_id,
    meta?.auth_user_id,
    meta?.email,
  ].filter(Boolean).map(String)
}

function emailsFrom(row: any) {
  const meta = getMetadata(row)
  return [
    row?.email,
    row?.staff_email,
    row?.employee_email,
    meta?.email,
    meta?.staff_email,
    meta?.employee_email,
  ].filter(Boolean).map((x: any) => String(x).toLowerCase())
}

export function resolveRealStaff(row: any, staff: any[]) {
  const ids = idsFrom(row)
  const emails = emailsFrom(row)

  const matched = staff.find((s: any) => {
    const staffIds = idsFrom(s)
    const staffEmails = emailsFrom(s)
    return (
      staffIds.some((id: string) => ids.includes(id)) ||
      staffEmails.some((email: string) => emails.includes(email))
    )
  })

  const meta = getMetadata(row)

  const fallbackName =
    clean(row?.staff_name) ||
    clean(row?.employee_name) ||
    clean(row?.full_name) ||
    clean(row?.name) ||
    clean(meta?.staff_name) ||
    clean(meta?.employee_name) ||
    clean(meta?.full_name) ||
    clean(meta?.name)

  return {
    staff_id: matched?.id || row?.staff_id || meta?.staff_id || null,
    user_id: matched?.user_id || row?.user_id || meta?.user_id || null,
    profile_id: matched?.profile_id || row?.profile_id || meta?.profile_id || null,
    name:
      clean(matched?.full_name) ||
      clean(matched?.name) ||
      clean(matched?.display_name) ||
      clean(matched?.email) ||
      fallbackName ||
      'Unmapped staff',
    department:
      clean(matched?.department) ||
      clean(row?.department) ||
      clean(meta?.department) ||
      'Unmapped department',
    position:
      clean(matched?.position) ||
      clean(matched?.job_title) ||
      clean(row?.position) ||
      clean(meta?.position) ||
      'Staff',
    city:
      clean(matched?.city) ||
      clean(matched?.location) ||
      clean(row?.city) ||
      clean(row?.location) ||
      clean(meta?.city) ||
      clean(meta?.location) ||
      'Head Office',
    resolved: Boolean(matched),
    mapping_source: matched ? 'hr_staff_profiles' : fallbackName ? 'row_or_metadata' : 'unmapped',
  }
}

export async function getAttendanceRealSyncData() {
  const supabase = await createClient()
  const dashboard = await getHRDashboardData()
  const staff = Array.isArray(dashboard.staff) ? dashboard.staff : []
  let attendance = Array.isArray(dashboard.attendance) ? dashboard.attendance : []

  let logs: any[] = []
  let diagnostics: any[] = []

  try {
    const res = await supabase.from('app_attendance_logs').select('*').order('event_at', { ascending: false }).limit(700)
    logs = res.data || []
  } catch {}

  try {
    const res = await supabase.from('v_hr_attendance_identity_diagnostics').select('*').limit(700)
    diagnostics = res.data || []
  } catch {}

  if ((!attendance || attendance.length === 0) && logs.length) {
    attendance = logs.map((x: any) => ({
      ...x,
      work_date: String(x.event_at || x.created_at || '').slice(0, 10),
      punch_in_at: lower(x.event_type).includes('in') ? x.event_at : null,
      punch_out_at: lower(x.event_type).includes('out') ? x.event_at : null,
      status: 'auto_synced',
      validation_status: 'auto_synced',
      source: x.source || 'overhead_panel',
    }))
  }

  const records = attendance.map((row: any) => {
    const identity = resolveRealStaff(row, staff)
    return {
      id: String(row.id || `${identity.staff_id || identity.user_id || identity.name}-${row.work_date || row.event_at || Math.random()}`),
      ...row,
      identity,
      staff_name: identity.name,
      department: identity.department,
      position: identity.position,
      city: identity.city,
      mapping_source: identity.mapping_source,
      mapping_resolved: identity.resolved,
    }
  })

  return {
    staff,
    attendance: records,
    logs,
    diagnostics,
    mapped: records.filter((x: any) => x.mapping_resolved),
    metadataMapped: records.filter((x: any) => !x.mapping_resolved && x.mapping_source === 'row_or_metadata'),
    unmapped: records.filter((x: any) => x.identity.name === 'Unmapped staff'),
  }
}
