import { createClient } from '@/lib/supabase/server'
import { HR_CANONICAL_TABLES } from './source-of-truth'
import { logHRActivity } from './repository'

export type HRSyncIssue = { code: string; severity: 'critical' | 'warning' | 'info'; title: string; entity_type: string; entity_id?: string; repairable: boolean; payload?: any }

export async function diagnoseHRSync(): Promise<{ ok: true; issues: HRSyncIssue[] }> {
  const supabase = await createClient()
  const [staff, candidates, contracts, docs, onboarding, training, rosters, attendance] = await Promise.all([
    supabase.from(HR_CANONICAL_TABLES.staff).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.candidates).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.contracts).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.documents).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.onboarding).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.training).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.rosters).select('*').limit(1000),
    supabase.from(HR_CANONICAL_TABLES.attendance).select('*').limit(1000),
  ])
  const issues: HRSyncIssue[] = []
  const rows = <T = any>(x: any): T[] => x?.data || []
  const has = (arr: any[], staffId: string) => arr.some((r) => [r.staff_id, r.employee_id, r.profile_id, r.user_id].includes(staffId))

  rows(candidates).filter((c: any) => ['approved', 'hired', 'selected'].includes(String(c.status || c.stage).toLowerCase()) && !c.converted_staff_id).forEach((c: any) => issues.push({ code: 'approved_candidate_not_converted', severity: 'critical', title: `Approved candidate not converted: ${c.full_name || c.email || c.id}`, entity_type: 'candidate', entity_id: c.id, repairable: true, payload: c }))

  rows(staff).forEach((s: any) => {
    if (!has(rows(contracts), s.id)) issues.push({ code: 'staff_missing_contract', severity: 'critical', title: `Missing contract: ${s.full_name || s.email || s.id}`, entity_type: 'staff', entity_id: s.id, repairable: true })
    if (!has(rows(docs), s.id)) issues.push({ code: 'staff_missing_documents', severity: 'warning', title: `Missing document checklist: ${s.full_name || s.email || s.id}`, entity_type: 'staff', entity_id: s.id, repairable: true })
    if (!has(rows(onboarding), s.id)) issues.push({ code: 'staff_missing_onboarding', severity: 'critical', title: `Missing onboarding: ${s.full_name || s.email || s.id}`, entity_type: 'staff', entity_id: s.id, repairable: true })
    if (!has(rows(training), s.id)) issues.push({ code: 'staff_missing_training', severity: 'warning', title: `Missing training plan: ${s.full_name || s.email || s.id}`, entity_type: 'staff', entity_id: s.id, repairable: true })
    if (!has(rows(rosters), s.id)) issues.push({ code: 'staff_missing_roster', severity: 'info', title: `No roster assignment: ${s.full_name || s.email || s.id}`, entity_type: 'staff', entity_id: s.id, repairable: false })
  })

  rows(attendance).filter((a: any) => !a.staff_id && !a.employee_id && !a.profile_id).forEach((a: any) => issues.push({ code: 'attendance_without_identity', severity: 'critical', title: `Attendance record without identity: ${a.id}`, entity_type: 'attendance', entity_id: a.id, repairable: false }))

  await supabase.from(HR_CANONICAL_TABLES.dataQuality).insert({ code: 'hr_sync_diagnosis', title: 'HR sync diagnosis executed', status: issues.length ? 'open' : 'healthy', severity: issues.some(i => i.severity === 'critical') ? 'critical' : 'info', affected_count: issues.length, details: { issues }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  return { ok: true, issues }
}

export async function repairHRSyncIssue(issue: HRSyncIssue) {
  const supabase = await createClient()
  if (issue.code === 'approved_candidate_not_converted' && issue.entity_id) {
    const { convertCandidateToStaff } = await import('./lifecycle')
    return convertCandidateToStaff(issue.entity_id)
  }
  if (issue.entity_type === 'staff' && issue.entity_id) {
    const { data: staff } = await supabase.from(HR_CANONICAL_TABLES.staff).select('*').eq('id', issue.entity_id).maybeSingle()
    if (!staff) return { ok: false, error: 'Staff not found' }
    const stamp = new Date().toISOString()
    if (issue.code === 'staff_missing_contract') await supabase.from(HR_CANONICAL_TABLES.contracts).insert({ staff_id: staff.id, title: `${staff.full_name || staff.email || 'Staff'} contract`, status: 'draft', contract_type: 'standard', starts_at: staff.hire_date || new Date().toISOString().slice(0, 10), created_at: stamp, updated_at: stamp })
    if (issue.code === 'staff_missing_documents') await supabase.from(HR_CANONICAL_TABLES.documents).insert(['CIN / ID','CV','Diploma or certificate','Bank details','Emergency contact'].map(title => ({ staff_id: staff.id, title, document_type: title.toLowerCase().replaceAll(' ', '_'), status: 'missing', created_at: stamp, updated_at: stamp })))
    if (issue.code === 'staff_missing_onboarding') await supabase.from(HR_CANONICAL_TABLES.onboarding).insert(['Validate identity and contact details','Prepare contract and payroll profile','Collect mandatory documents','Assign first training plan','Assign first roster / mission readiness'].map((title, index) => ({ staff_id: staff.id, title, status: 'todo', owner_role: index < 2 ? 'hr' : 'operations', due_at: new Date(Date.now() + (index + 1) * 86400000).toISOString(), created_at: stamp, updated_at: stamp })))
    if (issue.code === 'staff_missing_training') await supabase.from(HR_CANONICAL_TABLES.training).insert(['AngelCare values and service standards','Child safety and safeguarding basics','Operational attendance and roster usage'].map(title => ({ staff_id: staff.id, title, status: 'planned', provider: 'AngelCare Academy', due_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_at: stamp, updated_at: stamp })))
    await logHRActivity({ action: 'hr_sync_issue_repaired', entity_type: issue.entity_type, entity_id: issue.entity_id, severity: 'info', payload: issue })
    return { ok: true, repaired: issue.code }
  }
  return { ok: false, error: 'Issue is not repairable automatically' }
}
