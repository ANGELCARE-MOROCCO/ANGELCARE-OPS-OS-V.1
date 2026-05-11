// Compatibility bridge: old HR pages can keep importing this file while the module uses the new production repository.
import { getHRDashboardData, getHRRecord, getStaff360 } from '@/lib/hr-production/repository'

export function rows(res: any) { return Array.isArray(res?.data) ? res.data : [] }

export async function getHRRestoreLists() {
  const data = await getHRDashboardData()
  return {
    ...data,
    attendance_corrections: data.attendanceCorrections,
    checklists: data.onboarding,
  }
}

export { getHRRecord }

export async function getStaffRestore(staffId: string) {
  return getStaff360(staffId)
}
