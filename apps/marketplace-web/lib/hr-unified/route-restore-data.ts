// Compatibility bridge: old HR pages can keep importing this file while the module uses the new production repository.
import { createClient } from '@/lib/supabase/server'
import { getHRDashboardData, getHRRecord, getStaff360 } from '@/lib/hr-production/repository'

export function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getHRRestoreLists() {
  const data = await getHRDashboardData()
  const supabase = await createClient()
  const { data: checklistRows } = await supabase
    .from('hr_onboarding_checklists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return {
    ...data,
    attendance_corrections: (data as any).attendanceCorrections || (data as any).attendance_corrections || [],
    checklists: Array.isArray(checklistRows) && checklistRows.length ? checklistRows : (data as any).checklists || [],
  }
}

export { getHRRecord }

export async function getStaffRestore(staffId: string) {
  return getStaff360(staffId)
}
