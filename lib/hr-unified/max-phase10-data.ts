import { createClient } from '@/lib/supabase/server'

export type HRSyncRecord = {
  id: string
  source_table: string
  source_id: string | null
  target_table: string
  target_id: string | null
  link_type: string
  status: string
  notes: string | null
  created_at: string
}

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

export async function getHRPhase10Data() {
  const supabase = await createClient()

  const [
    links,
    audit,
    syncEvents,
    qualityChecks,
    staff,
    candidates,
    openings,
    tasks,
    approvals,
    onboarding,
    docs,
  ] = await Promise.all([
    supabase.from('hr_record_links').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_audit_logs').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_sync_events').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_data_quality_checks').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_staff').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_recruitment_candidates').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('hr_onboarding_steps').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const data = {
    links: rows(links) as HRSyncRecord[],
    audit: rows(audit),
    syncEvents: rows(syncEvents),
    qualityChecks: rows(qualityChecks),
    staff: rows(staff),
    candidates: rows(candidates),
    openings: rows(openings),
    tasks: rows(tasks),
    approvals: rows(approvals),
    onboarding: rows(onboarding),
    docs: rows(docs),
  }

  const open = (x: any) => !['closed', 'completed', 'resolved', 'cancelled', 'archived', 'ok'].includes(String(x?.status || '').toLowerCase())

  return {
    ...data,
    metrics: [
      { label: 'Linked records', value: data.links.length, detail: 'Cross-module relationships', tone: '#2563eb' },
      { label: 'Sync events', value: data.syncEvents.length, detail: 'Synchronization activity', tone: '#7c3aed' },
      { label: 'Quality checks', value: data.qualityChecks.filter(open).length, detail: 'Open data-quality issues', tone: '#dc2626' },
      { label: 'Audit events', value: data.audit.length, detail: 'Traceability records', tone: '#059669' },
      { label: 'Task links', value: data.links.filter((x) => x.target_table === 'hr_execution_tasks' || x.source_table === 'hr_execution_tasks').length, detail: 'Task relationship links', tone: '#ea580c' },
      { label: 'People records', value: data.staff.length + data.candidates.length, detail: 'Staff + candidates', tone: '#0891b2' },
    ],
  }
}
