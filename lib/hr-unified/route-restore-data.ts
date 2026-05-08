import { createClient } from '@/lib/supabase/server'

export function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getHRRestoreLists() {
  const supabase = await createClient()
  const [
    openings, candidates, staff, departments, positions, rosters, attendance,
    tasks, approvals, onboarding, checklists, docs, reviews
  ] = await Promise.all([
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_staff').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_departments').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_positions').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_rosters').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_attendance').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_onboarding_checklists').select('*').order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_staff_performance_reviews').select('*').order('created_at', { ascending:false }).limit(300),
  ])
  return {
    openings: rows(openings), candidates: rows(candidates), staff: rows(staff),
    departments: rows(departments), positions: rows(positions), rosters: rows(rosters),
    attendance: rows(attendance), tasks: rows(tasks), approvals: rows(approvals),
    onboarding: rows(onboarding), checklists: rows(checklists), docs: rows(docs), reviews: rows(reviews),
  }
}

export async function getHRRecord(table: string, id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data
}

export async function getStaffRestore(staffId: string) {
  const supabase = await createClient()
  const [staff, docs, attendance, reviews, rosters, onboarding, tasks] = await Promise.all([
    supabase.from('hr_staff').select('*').eq('id', staffId).maybeSingle(),
    supabase.from('hr_staff_documents').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_attendance').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_staff_performance_reviews').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_rosters').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_onboarding_steps').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_execution_tasks').select('*').eq('related_staff_id', staffId).order('created_at', { ascending:false }).limit(300),
  ])
  return { staff: staff.data, docs: rows(docs), attendance: rows(attendance), reviews: rows(reviews), rosters: rows(rosters), onboarding: rows(onboarding), tasks: rows(tasks) }
}
