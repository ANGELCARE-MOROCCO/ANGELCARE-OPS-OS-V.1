import { createClient } from '@/lib/supabase/server'

function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getOneHR(table: string, id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data
}

export async function getStaff360(staffId: string) {
  const supabase = await createClient()
  const [staffRes, docsRes, attendanceRes, reviewsRes, rostersRes, tasksRes, onboardingRes] = await Promise.all([
    supabase.from('hr_staff').select('*').eq('id', staffId).maybeSingle(),
    supabase.from('hr_staff_documents').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_attendance').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_staff_performance_reviews').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(100),
    supabase.from('hr_rosters').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_execution_tasks').select('*').eq('related_staff_id', staffId).order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_onboarding_steps').select('*').eq('staff_id', staffId).order('created_at', { ascending:false }).limit(200),
  ])
  return {
    staff: staffRes.data,
    docs: rows(docsRes),
    attendance: rows(attendanceRes),
    reviews: rows(reviewsRes),
    rosters: rows(rostersRes),
    tasks: rows(tasksRes),
    onboarding: rows(onboardingRes),
  }
}

export async function getHRPhase2Lists() {
  const supabase = await createClient()
  const [openings, departments, positions, staff, rosters, attendance, corrections, onboarding, checklists, docs, reviews, approvals, tasks] = await Promise.all([
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_departments').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_positions').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_staff').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_rosters').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_attendance').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_onboarding_checklists').select('*').order('created_at', { ascending:false }).limit(200),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_staff_performance_reviews').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending:false }).limit(500),
  ])
  return {
    openings: rows(openings), departments: rows(departments), positions: rows(positions), staff: rows(staff),
    rosters: rows(rosters), attendance: rows(attendance), corrections: rows(corrections), onboarding: rows(onboarding),
    checklists: rows(checklists), docs: rows(docs), reviews: rows(reviews), approvals: rows(approvals), tasks: rows(tasks)
  }
}
