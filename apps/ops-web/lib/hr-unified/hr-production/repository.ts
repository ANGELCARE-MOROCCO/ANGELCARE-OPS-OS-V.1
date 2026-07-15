import { createClient } from '@/lib/supabase/server'
import type { HRDashboardData } from './types'

export const HR_TABLES = {
  openings: 'hr_job_openings',
  candidates: 'hr_recruitment_candidates',
  staff: 'hr_staff',
  departments: 'hr_departments',
  positions: 'hr_positions',
  rosters: 'hr_rosters',
  attendance: 'hr_attendance',
  attendanceCorrections: 'hr_attendance_corrections',
  tasks: 'hr_execution_tasks',
  approvals: 'hr_approval_requests',
  onboarding: 'hr_onboarding_cases',
  docs: 'hr_staff_documents',
  reviews: 'hr_staff_performance_reviews',
  activity: 'hr_activity_log',
  syncEvents: 'hr_sync_events',
  qualityChecks: 'hr_data_quality_checks',
  serviceRequests: 'hr_service_requests',
  playbooks: 'hr_playbooks',
  templates: 'hr_templates',
} as const

export const HR_ALLOWED_WRITE_TABLES = new Set(Object.values(HR_TABLES))

export function rows(res: any) {
  return Array.isArray(res?.data) ? res.data : []
}

async function list(table: string, limit = 500) {
  const supabase = await createClient()
  const res = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit)
  return rows(res)
}

export async function getHRDashboardData(): Promise<HRDashboardData> {
  const supabase = await createClient()
  const [
    openings, candidates, staff, departments, positions, rosters, attendance, attendanceCorrections,
    tasks, approvals, onboarding, docs, reviews, syncEvents, qualityChecks, serviceRequests,
  ] = await Promise.all([
    supabase.from(HR_TABLES.openings).select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.candidates).select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.staff).select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.departments).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.positions).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.rosters).select('*').order('shift_date', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.attendance).select('*').order('attendance_date', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.attendanceCorrections).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.tasks).select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.approvals).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.onboarding).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.docs).select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from(HR_TABLES.reviews).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.syncEvents).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.qualityChecks).select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.serviceRequests).select('*').order('created_at', { ascending:false }).limit(300),
  ])
  return {
    openings: rows(openings), candidates: rows(candidates), staff: rows(staff), departments: rows(departments),
    positions: rows(positions), rosters: rows(rosters), attendance: rows(attendance), attendanceCorrections: rows(attendanceCorrections),
    tasks: rows(tasks), approvals: rows(approvals), onboarding: rows(onboarding), docs: rows(docs), reviews: rows(reviews),
    syncEvents: rows(syncEvents), qualityChecks: rows(qualityChecks), serviceRequests: rows(serviceRequests),
  }
}

export async function getHRList(key: keyof typeof HR_TABLES, limit = 500) {
  return list(HR_TABLES[key], limit)
}

export async function getHRRecord(table: string, id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data
}

export async function getStaff360(staffId: string) {
  const supabase = await createClient()
  const [staff, docs, attendance, reviews, rosters, onboarding, tasks] = await Promise.all([
    supabase.from(HR_TABLES.staff).select('*').eq('id', staffId).maybeSingle(),
    supabase.from(HR_TABLES.docs).select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.attendance).select('*').eq('staff_id', staffId).order('attendance_date', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.reviews).select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from(HR_TABLES.rosters).select('*').eq('staff_id', staffId).order('shift_date', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.onboarding).select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from(HR_TABLES.tasks).select('*').eq('related_staff_id', staffId).order('created_at', { ascending:false }).limit(300),
  ])
  return { staff: staff.data, docs: rows(docs), attendance: rows(attendance), reviews: rows(reviews), rosters: rows(rosters), onboarding: rows(onboarding), tasks: rows(tasks) }
}

export async function logHRActivity(input: { actor_user_id?: string | null; actor_label?: string | null; source_table: string; record_id?: string | null; action: string; details?: any }) {
  const supabase = await createClient()
  await supabase.from(HR_TABLES.activity).insert([{ ...input, details: input.details || {} }])
}
