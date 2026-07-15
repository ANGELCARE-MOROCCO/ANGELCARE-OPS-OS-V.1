import { createClient } from '@/lib/supabase/server'

function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getHRPhase5() {
  const supabase = await createClient()

  const [
    staff, candidates, openings, tasks, approvals, playbooks, templates,
    bulkActions, quality, calendar, escalations, docs, rosters, attendance
  ] = await Promise.all([
    supabase.from('hr_staff').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending:false }).limit(800),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_playbooks').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_templates').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_bulk_actions').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_quality_reviews').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_calendar_events').select('*').order('event_at', { ascending:true }).limit(300),
    supabase.from('hr_escalations').select('*').order('created_at', { ascending:false }).limit(300),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_rosters').select('*').order('created_at', { ascending:false }).limit(500),
    supabase.from('hr_attendance').select('*').order('created_at', { ascending:false }).limit(500),
  ])

  const data = {
    staff: rows(staff),
    candidates: rows(candidates),
    openings: rows(openings),
    tasks: rows(tasks),
    approvals: rows(approvals),
    playbooks: rows(playbooks),
    templates: rows(templates),
    bulkActions: rows(bulkActions),
    quality: rows(quality),
    calendar: rows(calendar),
    escalations: rows(escalations),
    docs: rows(docs),
    rosters: rows(rosters),
    attendance: rows(attendance),
  }

  const active = (x:any)=>!['closed','completed','cancelled','archived','resolved','rejected'].includes(String(x.status || '').toLowerCase())

  return {
    ...data,
    metrics: [
      { label:'Command objects', value:data.tasks.length + data.approvals.length + data.escalations.length, detail:'Tasks, approvals and escalations', tone:'#2563eb' },
      { label:'Playbooks', value:data.playbooks.length, detail:'HR operating procedures', tone:'#7c3aed' },
      { label:'Templates', value:data.templates.length, detail:'Reusable HR templates', tone:'#059669' },
      { label:'Bulk actions', value:data.bulkActions.filter(active).length, detail:'Batch execution queue', tone:'#ea580c' },
      { label:'Quality reviews', value:data.quality.length, detail:'HR QA checks', tone:'#0891b2' },
      { label:'Calendar events', value:data.calendar.length, detail:'HR planning events', tone:'#d97706' },
      { label:'Escalations', value:data.escalations.filter(active).length, detail:'Open HR escalations', tone:'#dc2626' },
      { label:'Search records', value:data.staff.length + data.candidates.length + data.openings.length, detail:'People and openings searchable base', tone:'#0f766e' },
    ]
  }
}
