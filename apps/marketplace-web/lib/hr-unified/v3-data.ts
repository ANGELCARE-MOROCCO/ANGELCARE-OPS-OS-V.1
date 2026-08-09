import { createClient } from '@/lib/supabase/server'

export type HRV3Metric = { label: string; value: string | number; detail: string; tone: string }

export async function getHRV3Snapshot() {
  const supabase = await createClient()

  const [
    staffRes,
    candidatesRes,
    tasksRes,
    approvalsRes,
    docsRes,
    conflictsRes,
    correctionsRes,
    reviewsRes,
    auditRes,
    openingsRes,
  ] = await Promise.all([
    supabase.from('hr_staff').select('*').limit(500),
    supabase.from('hr_recruitment_candidates').select('*').limit(500),
    supabase.from('hr_execution_tasks').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('hr_approval_requests').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('hr_staff_documents').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('hr_roster_conflicts').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('hr_attendance_corrections').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('hr_staff_performance_reviews').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('hr_audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('hr_job_openings').select('*').limit(200),
  ])

  const staff = staffRes.data || []
  const candidates = candidatesRes.data || []
  const tasks = tasksRes.data || []
  const approvals = approvalsRes.data || []
  const docs = docsRes.data || []
  const conflicts = conflictsRes.data || []
  const corrections = correctionsRes.data || []
  const reviews = reviewsRes.data || []
  const audits = auditRes.data || []
  const openings = openingsRes.data || []

  const openTasks = tasks.filter((t:any)=>!['done','completed','closed','cancelled'].includes(String(t.status || '').toLowerCase()))
  const pendingApprovals = approvals.filter((a:any)=>['pending','requested','open'].includes(String(a.status || '').toLowerCase()))
  const urgentConflicts = conflicts.filter((c:any)=>['high','critical'].includes(String(c.severity || '').toLowerCase()) || ['open','detected'].includes(String(c.status || '').toLowerCase()))
  const pendingCorrections = corrections.filter((c:any)=>['pending','requested'].includes(String(c.status || '').toLowerCase()))
  const expiringDocs = docs.filter((d:any)=>{
    if (!d.expiry_date) return false
    const diff = (new Date(d.expiry_date).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 45
  })

  return {
    staff, candidates, tasks, approvals, docs, conflicts, corrections, reviews, audits, openings,
    metrics: [
      { label: 'Active staff', value: staff.length, detail: 'HR staff records tracked', tone: '#2563eb' },
      { label: 'Candidates', value: candidates.length, detail: 'Recruitment pipeline volume', tone: '#7c3aed' },
      { label: 'Open HR tasks', value: openTasks.length, detail: 'Execution workload', tone: '#ea580c' },
      { label: 'Pending approvals', value: pendingApprovals.length, detail: 'Needs management decision', tone: '#dc2626' },
      { label: 'Roster conflicts', value: urgentConflicts.length, detail: 'Planning risks to solve', tone: '#be123c' },
      { label: 'Corrections', value: pendingCorrections.length, detail: 'Attendance requests pending', tone: '#0891b2' },
      { label: 'Expiring docs', value: expiringDocs.length, detail: 'Documents expiring in 45 days', tone: '#ca8a04' },
      { label: 'Openings', value: openings.length, detail: 'Hiring demand active', tone: '#059669' },
    ] as HRV3Metric[],
    openTasks,
    pendingApprovals,
    urgentConflicts,
    pendingCorrections,
    expiringDocs,
  }
}
