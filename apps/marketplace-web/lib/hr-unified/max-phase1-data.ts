import { createClient } from '@/lib/supabase/server'

function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }
function open(row: any) { return !['done','completed','closed','cancelled','archived','rejected'].includes(String(row?.status || '').toLowerCase()) }

export async function getHRMaxPhase1Snapshot() {
  const supabase = await createClient()
  const [candidatesRes, tasksRes, approvalsRes, openingsRes, staffRes, docsRes, correctionsRes, conflictsRes] = await Promise.all([
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_staff').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_roster_conflicts').select('*').order('created_at', { ascending:false }).limit(300),
  ])

  const candidates = rows(candidatesRes)
  const tasks = rows(tasksRes)
  const approvals = rows(approvalsRes)
  const openings = rows(openingsRes)
  const staff = rows(staffRes)
  const docs = rows(docsRes)
  const corrections = rows(correctionsRes)
  const conflicts = rows(conflictsRes)

  const metrics = [
    { label:'Candidates', value:candidates.filter(open).length, detail:'Active recruitment pipeline', tone:'#7c3aed' },
    { label:'Open tasks', value:tasks.filter(open).length, detail:'HR execution workload', tone:'#ea580c' },
    { label:'Approvals', value:approvals.filter((x:any)=>['pending','requested','open'].includes(String(x.status||'').toLowerCase())).length, detail:'Management decisions pending', tone:'#dc2626' },
    { label:'Openings', value:openings.filter(open).length, detail:'Hiring demand active', tone:'#2563eb' },
    { label:'Staff', value:staff.length, detail:'Staff profile base', tone:'#059669' },
    { label:'Documents', value:docs.length, detail:'Staff document records', tone:'#0f766e' },
    { label:'Attendance fixes', value:corrections.filter(open).length, detail:'Correction requests', tone:'#0891b2' },
    { label:'Roster risks', value:conflicts.filter(open).length, detail:'Planning conflicts', tone:'#be123c' },
  ]

  return { candidates, tasks, approvals, openings, staff, docs, corrections, conflicts, metrics }
}

export async function getCandidate(id: string) {
  const supabase = await createClient()
  const [candidateRes, pipelineRes, tasksRes] = await Promise.all([
    supabase.from('hr_recruitment_candidates').select('*').eq('id', id).maybeSingle(),
    supabase.from('hr_recruitment_pipeline').select('*').eq('candidate_id', id).order('created_at', { ascending:false }).limit(100),
    supabase.from('hr_execution_tasks').select('*').eq('related_candidate_id', id).order('created_at', { ascending:false }).limit(100),
  ])
  return { candidate: candidateRes.data, pipeline: rows(pipelineRes), tasks: rows(tasksRes) }
}
