import { createClient } from '@/lib/supabase/server'

function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getHRPhase3() {
  const supabase = await createClient()
  const [staff, docs, conflicts, onboarding, candidates, openings, interviews, sources, tasks, approvals, departments, positions] = await Promise.all([
    supabase.from('hr_staff').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_roster_conflicts').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_interviews').select('*').order('scheduled_at', { ascending:true }).limit(500),
    supabase.from('hr_recruitment_sources').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_departments').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_positions').select('*').order('created_at', { ascending:false }).limit(300),
  ])
  return {
    staff: rows(staff), docs: rows(docs), conflicts: rows(conflicts), onboarding: rows(onboarding),
    candidates: rows(candidates), openings: rows(openings), interviews: rows(interviews), sources: rows(sources),
    tasks: rows(tasks), approvals: rows(approvals), departments: rows(departments), positions: rows(positions),
  }
}
