import { createClient } from '@/lib/supabase/server'
import type { HRActivityInput, HRDashboardData, HRResult, HRRow } from './types'

export const HR_TABLES = {
  staff: 'hr_staff_profiles',
  openings: 'hr_opening_jobs',
  candidates: 'hr_candidates',
  onboarding: 'hr_onboarding_tasks',
  attendance: 'hr_attendance_records',
  rosters: 'hr_roster_assignments',
  departments: 'hr_departments',
  positions: 'hr_positions',
  documents: 'hr_documents',
  docs: 'hr_documents',
  approvals: 'hr_approval_requests',
  contracts: 'hr_contracts',
  training: 'hr_training_records',
  compliance: 'hr_compliance_items',
  leave: 'hr_leave_requests',
  payroll: 'hr_payroll_inputs',
  tasks: 'hr_tasks',
  serviceRequests: 'hr_service_requests',
  sla: 'hr_sla_tracking',
  escalations: 'hr_escalations',
  dailyOperations: 'hr_daily_operations',
  dataQuality: 'hr_data_quality_checks',
  playbooks: 'hr_playbooks',
  templates: 'hr_templates',
  syncEvents: 'hr_sync_events',
  incidents: 'hr_incidents',
  performance: 'hr_performance_reviews',
  audit: 'hr_audit_logs',
  activity: 'hr_activity_timeline',
} as const

export const HR_ALLOWED_WRITE_TABLES = new Set<string>(Object.values(HR_TABLES))

const FALLBACK_TABLES: Record<string, string[]> = {
  [HR_TABLES.staff]: ['hr_staff', 'staff_profiles', 'profiles'],
  [HR_TABLES.candidates]: ['hr_recruitment_candidates'],
  [HR_TABLES.openings]: ['hr_job_openings', 'hr_openings'],
  [HR_TABLES.attendance]: ['hr_attendance', 'attendance_records', 'app_attendance_logs'],
  [HR_TABLES.rosters]: ['hr_rosters', 'roster_assignments'],
  [HR_TABLES.documents]: ['hr_employee_documents', 'staff_documents'],
  [HR_TABLES.onboarding]: ['hr_onboarding_journeys', 'hr_onboarding_steps', 'hr_onboarding_checklists'],
  [HR_TABLES.training]: ['hr_training_assignments', 'hr_training_programs'],

  [HR_TABLES.contracts]: ['hr_staff_contracts', 'contracts'],
  [HR_TABLES.performance]: ['hr_reviews', 'performance_reviews'],
  [HR_TABLES.audit]: ['hr_activity_log', 'hr_audit_trail'],
  [HR_TABLES.activity]: ['hr_activity_log', 'hr_audit_trail'],
}

async function safeSelect(table: string, limit = 200): Promise<HRResult> {
  const supabase = await createClient()
  const attempts = [table, ...(FALLBACK_TABLES[table] || [])]
  const errors: string[] = []
  let emptyResult: HRResult | null = null

  for (const t of attempts) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(limit)
      if (!error) {
        const rows = Array.isArray(data) ? data : []
        if (rows.length) return { data: rows, error: null, table: t }
        emptyResult = emptyResult || { data: rows, error: null, table: t }
      } else {
        errors.push(`${t}: ${error.message}`)
      }
    } catch (err: any) {
      errors.push(`${t}: ${err?.message || String(err)}`)
    }
  }

  return emptyResult || { data: [], error: errors.join(' | '), table }
}

export async function getHRDashboardData(): Promise<HRDashboardData> {
  const keys = [
    'staff',
    'openings',
    'candidates',
    'onboarding',
    'attendance',
    'rosters',
    'departments',
    'positions',
    'documents',
    'docs',
    'approvals',
    'contracts',
    'training',
    'compliance',
    'leave',
    'payroll',
    'tasks',
    'serviceRequests',
    'sla',
    'escalations',
    'dailyOperations',
    'dataQuality',
    'playbooks',
    'templates',
    'syncEvents',
    'incidents',
    'performance',
    'audit',
    'activity',
  ] as const

  const tables = keys.map((k) => HR_TABLES[k])
  const results = await Promise.all(tables.map((t) => safeSelect(t)))

  const data: any = { loadedAt: new Date().toISOString(), errors: {} }

  keys.forEach((k, i) => {
    data[k] = results[i]?.data || []
    if (results[i]?.error) data.errors[k] = results[i].error
  })

  return data as HRDashboardData
}

export async function getHRRecord(table: string, id: string): Promise<HRRow | null> {
  const supabase = await createClient()
  const attempts = [table, ...(FALLBACK_TABLES[table] || [])]

  for (const t of attempts) {
    try {
      const { data, error } = await supabase.from(t).select('*').eq('id', id).maybeSingle()
      if (!error && data) return data
    } catch {}
  }

  return null
}

export async function getStaff360(id: string) {
  const staff = await getHRRecord(HR_TABLES.staff, id)
  const dashboard = await getHRDashboardData()

  const byStaff = (row: HRRow) =>
    [row.id, row.staff_id, row.employee_id, row.user_id, row.profile_id].filter(Boolean).includes(id)

  return {
    staff,
    attendance: (dashboard.attendance || []).filter(byStaff),
    rosters: (dashboard.rosters || []).filter(byStaff),
    rosterAssignments: (dashboard.rosters || []).filter(byStaff),
    documents: (dashboard.documents || []).filter(byStaff),
    docs: (dashboard.documents || []).filter(byStaff),
    contracts: (dashboard.contracts || []).filter(byStaff),
    approvals: (dashboard.approvals || []).filter(byStaff),
    tasks: (dashboard.tasks || []).filter(byStaff),
    onboarding: (dashboard.onboarding || []).filter(byStaff),
    incidents: (dashboard.incidents || []).filter(byStaff),
    serviceRequests: (dashboard.serviceRequests || []).filter(byStaff),
    training: (dashboard.training || []).filter(byStaff),
    trainings: (dashboard.training || []).filter(byStaff),
    performance: (dashboard.performance || []).filter(byStaff),
    reviews: (dashboard.performance || []).filter(byStaff),
    payroll: (dashboard.payroll || []).filter(byStaff),
    leave: (dashboard.leave || []).filter(byStaff),
  }
}

export async function logHRActivity(input: HRActivityInput) {
  const supabase = await createClient()

  const row = {
    ...input,
    module: input.module || 'hr',
    source: input.source || 'hr-production',
    status: input.status || 'recorded',
    created_at: new Date().toISOString(),
  }

  try {
    await supabase.from(HR_TABLES.audit).insert(row)
  } catch {}

  try {
    await supabase.from(HR_TABLES.activity).insert(row)
  } catch {}
}
