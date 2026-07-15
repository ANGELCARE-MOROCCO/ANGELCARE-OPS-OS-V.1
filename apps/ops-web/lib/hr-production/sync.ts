import { createClient } from '@/lib/supabase/server'
import { HR_TABLES, getHRDashboardData } from './repository'

export async function getHRSyncReadiness() {
  const data = await getHRDashboardData()
  return [
    { module: 'Users/RBAC', status: data.staff.some((x:any)=>x.app_user_id) ? 'connected' : 'needs_mapping', detail: 'Link app users to HR staff profiles for permissions.' },
    { module: 'Missions', status: data.rosters.some((x:any)=>x.mission_ref) ? 'connected' : 'needs_mapping', detail: 'Use mission_ref on rosters to connect staff capacity to operations.' },
    { module: 'Payroll', status: data.attendance.some((x:any)=>x.validation_status === 'approved') ? 'ready' : 'blocked', detail: 'Payroll needs approved attendance records.' },
    { module: 'Documents', status: data.docs.length ? 'connected' : 'empty', detail: 'Attach and validate staff documents.' },
    { module: 'Recruitment', status: data.candidates.length ? 'active' : 'empty', detail: 'Candidate records feed onboarding and staff conversion.' },
  ]
}

export async function createHRSyncEvent(input: { sync_type: string; source_module?: string; target_module?: string; source_record_id?: string; payload?: any }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(HR_TABLES.syncEvents).insert([{ ...input, payload: input.payload || {}, status: 'pending' }]).select('id').single()
  if (error) throw new Error(error.message)
  return data
}
