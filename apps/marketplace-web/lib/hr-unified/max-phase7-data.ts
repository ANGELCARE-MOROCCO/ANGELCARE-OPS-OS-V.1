import { createClient } from '@/lib/supabase/server'

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

export async function getHRPhase7Data() {
  const supabase = await createClient()

  const [tasks, approvals, candidates, openings, staff, docs, conflicts, corrections, onboarding, dailyOps] = await Promise.all([
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_staff').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_roster_conflicts').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_daily_operations').select('*').order('created_at', { ascending: false }).limit(300),
  ])

  const open = (x: any) => !['done', 'completed', 'closed', 'cancelled', 'archived', 'resolved', 'rejected'].includes(String(x?.status || '').toLowerCase())

  const data = {
    tasks: rows(tasks),
    approvals: rows(approvals),
    candidates: rows(candidates),
    openings: rows(openings),
    staff: rows(staff),
    docs: rows(docs),
    conflicts: rows(conflicts),
    corrections: rows(corrections),
    onboarding: rows(onboarding),
    dailyOps: rows(dailyOps),
  }

  return {
    ...data,
    metrics: [
      { label: 'Open command items', value: data.tasks.filter(open).length + data.approvals.filter(open).length, detail: 'Tasks + approvals requiring action', tone: '#2563eb' },
      { label: 'Recruitment pressure', value: data.candidates.filter(open).length + data.openings.filter(open).length, detail: 'Candidates + openings active', tone: '#7c3aed' },
      { label: 'People base', value: data.staff.length, detail: 'Staff records available', tone: '#059669' },
      { label: 'Risk queue', value: data.conflicts.filter(open).length + data.corrections.filter(open).length, detail: 'Conflicts + corrections open', tone: '#dc2626' },
      { label: 'Onboarding backlog', value: data.onboarding.filter(open).length, detail: 'Integration steps not closed', tone: '#d97706' },
      { label: 'Daily ops logs', value: data.dailyOps.length, detail: 'Daily HR operating logs', tone: '#0891b2' },
    ],
  }
}
