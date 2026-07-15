import { createClient } from '@/lib/supabase/server'
import { logHRActivity } from './repository'

export const HR_CANONICAL_TABLES = {
  staff: 'hr_staff_profiles',
  candidates: 'hr_candidates',
  openings: 'hr_opening_jobs',
  onboarding: 'hr_onboarding_tasks',
  attendance: 'hr_attendance_records',
  rosters: 'hr_roster_assignments',
  departments: 'hr_departments',
  positions: 'hr_positions',
  documents: 'hr_documents',
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

export type HRCanonicalKey = keyof typeof HR_CANONICAL_TABLES
export type HRCanonicalRow = Record<string, any>

export function normalizeHRName(row: HRCanonicalRow) {
  return row.full_name || row.name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Unknown HR record'
}

export function normalizeStaffId(row: HRCanonicalRow) {
  return row.staff_id || row.employee_id || row.profile_id || row.user_id || row.id || null
}

export async function selectHR<K extends HRCanonicalKey>(key: K, limit = 500) {
  const supabase = await createClient()
  const table = HR_CANONICAL_TABLES[key]
  const { data, error } = await supabase.from(table).select('*').limit(limit)
  if (error) return { table, data: [] as HRCanonicalRow[], error: error.message }
  return { table, data: (data || []) as HRCanonicalRow[], error: null as string | null }
}

export async function insertHR<K extends HRCanonicalKey>(key: K, row: HRCanonicalRow, auditAction?: string) {
  const supabase = await createClient()
  const table = HR_CANONICAL_TABLES[key]
  const payload = { ...row, created_at: row.created_at || new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(table).insert(payload).select('*').maybeSingle()
  if (!error && auditAction) {
    await logHRActivity({ action: auditAction, entity_type: key, entity_id: data?.id, source_table: table, after: data, severity: 'info' })
  }
  return { data, error: error?.message || null, table }
}

export async function updateHR<K extends HRCanonicalKey>(key: K, id: string, patch: HRCanonicalRow, auditAction?: string) {
  const supabase = await createClient()
  const table = HR_CANONICAL_TABLES[key]
  const { data: before } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  const { data, error } = await supabase.from(table).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle()
  if (!error && auditAction) {
    await logHRActivity({ action: auditAction, entity_type: key, entity_id: id, source_table: table, before, after: data, severity: 'info' })
  }
  return { data, error: error?.message || null, table }
}
