import { createClient } from '@/lib/supabase/server'

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

export async function getHRUXPack1Data() {
  const supabase = await createClient()

  const [
    staff,
    candidates,
    openings,
    tasks,
    approvals,
    docs,
    conflicts,
    corrections,
    onboarding,
    dailyOps,
    escalations,
    kpis,
    timeline,
    quality,
  ] = await Promise.all([
    supabase.from('hr_staff').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_roster_conflicts').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_daily_operations').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_escalations').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_kpi_drilldowns').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_activity_timeline').select('*').order('event_at', { ascending: false }).limit(500),
    supabase.from('hr_data_quality_checks').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const data = {
    staff: rows(staff),
    candidates: rows(candidates),
    openings: rows(openings),
    tasks: rows(tasks),
    approvals: rows(approvals),
    docs: rows(docs),
    conflicts: rows(conflicts),
    corrections: rows(corrections),
    onboarding: rows(onboarding),
    dailyOps: rows(dailyOps),
    escalations: rows(escalations),
    kpis: rows(kpis),
    timeline: rows(timeline),
    quality: rows(quality),
  }

  const open = (x: any) => !['closed', 'completed', 'resolved', 'cancelled', 'archived', 'approved', 'ok', 'ready'].includes(String(x?.status || '').toLowerCase())
  const pendingDocs = data.docs.filter((d: any) => String(d?.verification_status || d?.status || 'pending') !== 'verified')
  const activeCandidates = data.candidates.filter(open)
  const activeOpenings = data.openings.filter(open)
  const activeTasks = data.tasks.filter(open)
  const pendingApprovals = data.approvals.filter(open)
  const rosterRisks = data.conflicts.filter(open)
  const attendanceRisks = data.corrections.filter(open)
  const onboardingBacklog = data.onboarding.filter(open)
  const activeEscalations = data.escalations.filter(open)
  const qualityRisks = data.quality.filter(open)

  return {
    ...data,
    activeCandidates,
    activeOpenings,
    activeTasks,
    pendingApprovals,
    pendingDocs,
    rosterRisks,
    attendanceRisks,
    onboardingBacklog,
    escalations,
    qualityRisks,
    executivePulse: [
      { label: 'Workforce base', value: data.staff.length, detail: 'active staff records', tone: 'green', progress: Math.min(100, data.staff.length) },
      { label: 'Recruitment pressure', value: activeCandidates.length + activeOpenings.length, detail: 'active candidates + openings', tone: 'purple', progress: Math.min(100, activeCandidates.length + activeOpenings.length) },
      { label: 'Command backlog', value: activeTasks.length + pendingApprovals.length, detail: 'tasks + decisions pending', tone: 'amber', progress: Math.min(100, activeTasks.length + pendingApprovals.length) },
      { label: 'Risk exposure', value: pendingDocs.length + rosterRisks.length + attendanceRisks.length + qualityRisks.length, detail: 'docs, roster, attendance, quality', tone: 'red', progress: Math.min(100, pendingDocs.length + rosterRisks.length + attendanceRisks.length + qualityRisks.length) },
    ],
  }
}
