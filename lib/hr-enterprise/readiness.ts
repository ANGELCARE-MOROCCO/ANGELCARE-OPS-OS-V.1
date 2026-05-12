import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionScore } from '@/lib/hr-production/metrics'
export async function getHREnterpriseReadiness() {
  const data = await getHRDashboardData()
  const baseScore = getHRProductionScore(data)
  const checks = [
    { key: 'staff_source', label: 'Staff source of truth exists', passed: data.staff.length > 0 },
    { key: 'attendance_records', label: 'Attendance records connected', passed: data.attendance.length > 0 },
    { key: 'approvals', label: 'Approval table reachable', passed: !data.errors.approvals },
    { key: 'documents', label: 'Document compliance reachable', passed: !data.errors.documents },
    { key: 'audit', label: 'Audit log reachable', passed: !data.errors.audit },
    { key: 'schema_errors', label: 'No repository schema errors', passed: Object.keys(data.errors).length === 0 },
  ]
  const readinessScore = Math.round((baseScore + (checks.filter(x=>x.passed).length / checks.length) * 100) / 2)
  return { readinessScore, baseScore, checks, errors: data.errors, checkedAt: new Date().toISOString() }
}
