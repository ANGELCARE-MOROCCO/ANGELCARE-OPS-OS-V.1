import type { HRDashboardData } from './types'

export function getHRProductionMetrics(data: HRDashboardData) {
  const activeStaff = data.staff.filter((x) => (x.employment_status || 'active') === 'active').length
  const openRoles = data.openings.filter((x) => (x.status || 'open') === 'open').reduce((s, x) => s + Number(x.openings_count || 1), 0)
  const pendingApprovals = data.approvals.filter((x) => (x.status || 'pending') === 'pending').length
  const unvalidatedAttendance = data.attendance.filter((x) => (x.validation_status || 'pending') !== 'approved').length
  const missingDocs = data.docs.filter((x) => ['missing', 'expired', 'pending'].includes(String(x.status || 'missing'))).length
  const rosterConflicts = data.rosters.filter((x) => (x.conflict_status || 'clear') !== 'clear').length
  const openTasks = data.tasks.filter((x) => ['open', 'in_progress', 'blocked'].includes(String(x.status || 'open'))).length
  const openQuality = data.qualityChecks.filter((x) => (x.status || 'open') === 'open').length
  return { activeStaff, openRoles, pendingApprovals, unvalidatedAttendance, missingDocs, rosterConflicts, openTasks, openQuality }
}

export function getHRProductionScore(data: HRDashboardData) {
  const m = getHRProductionMetrics(data)
  let score = 100
  if (m.missingDocs) score -= Math.min(20, m.missingDocs * 2)
  if (m.unvalidatedAttendance) score -= Math.min(15, m.unvalidatedAttendance)
  if (m.rosterConflicts) score -= Math.min(15, m.rosterConflicts * 3)
  if (m.pendingApprovals) score -= Math.min(10, m.pendingApprovals)
  if (m.openQuality) score -= Math.min(20, m.openQuality * 4)
  return Math.max(0, score)
}
