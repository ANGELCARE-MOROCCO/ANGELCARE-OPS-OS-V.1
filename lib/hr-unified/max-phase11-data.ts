import { createClient } from '@/lib/supabase/server'

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

export async function getHRPhase11Data() {
  const supabase = await createClient()

  const [
    savedViews,
    timeline,
    kpis,
    tasks,
    approvals,
    candidates,
    staff,
    openings,
    risks,
    quality,
  ] = await Promise.all([
    supabase.from('hr_saved_views').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_activity_timeline').select('*').order('event_at', { ascending: false }).limit(700),
    supabase.from('hr_kpi_drilldowns').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_staff').select('*').order('created_at', { ascending: false }).limit(700),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_data_quality_checks').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_quality_reviews').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const data = {
    savedViews: rows(savedViews),
    timeline: rows(timeline),
    kpis: rows(kpis),
    tasks: rows(tasks),
    approvals: rows(approvals),
    candidates: rows(candidates),
    staff: rows(staff),
    openings: rows(openings),
    risks: rows(risks),
    quality: rows(quality),
  }

  const open = (x: any) => !['closed', 'completed', 'resolved', 'cancelled', 'archived', 'approved', 'ok'].includes(String(x?.status || '').toLowerCase())

  return {
    ...data,
    metrics: [
      { label: 'Saved views', value: data.savedViews.length, detail: 'Reusable operating views', tone: '#2563eb' },
      { label: 'Timeline events', value: data.timeline.length, detail: 'Recent HR activity', tone: '#7c3aed' },
      { label: 'KPI drilldowns', value: data.kpis.length, detail: 'Management indicators', tone: '#059669' },
      { label: 'Open decisions', value: data.approvals.filter(open).length, detail: 'Approval workload', tone: '#dc2626' },
      { label: 'Execution backlog', value: data.tasks.filter(open).length, detail: 'Open HR tasks', tone: '#ea580c' },
      { label: 'Risk checks', value: data.risks.filter(open).length + data.quality.filter(open).length, detail: 'Data + quality risks', tone: '#0891b2' },
    ],
  }
}
