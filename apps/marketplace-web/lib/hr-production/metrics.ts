import type { HRDashboardData, HRHealthStatus, HRRow } from './types'

export type HRProductionMetrics = {
  totalStaff: number
  activeStaff: number
  activeStaffRate: number

  openRoles: number
  pendingApprovals: number

  attendanceRecords: number
  attendanceExceptions: number
  validatedAttendance: number
  rosterConflicts: number

  documentRecords: number
  missingDocs: number
  contractRecords: number
  trainingRecords: number
  complianceItems: number
  payrollInputs: number

  openTasks: number
  openServiceRequests: number
  openIncidents: number

  dataErrors: number
  openQuality: number

  staffCount: number
  activeCount: number
  openingsCount: number
  approvalsPending: number
  attendanceCount: number
  exceptionsCount: number
  validatedAttendanceRecords: number
  conflictsCount: number
  documentsCount: number
  missingDocuments: number
  qualityIssues: number
  openQualityIssues: number
}

function arr(value: unknown): HRRow[] {
  return Array.isArray(value) ? (value as HRRow[]) : []
}

function text(value: unknown): string {
  return String(value || '').toLowerCase()
}

function isActive(row: HRRow): boolean {
  const status = text(row.employment_status || row.status || row.state)
  return !['inactive', 'terminated', 'archived', 'deleted', 'offboarded'].includes(status)
}

function isOpen(row: HRRow): boolean {
  const status = text(row.status || row.pipeline_status || row.state)
  return ['open', 'active', 'published', 'recruiting', 'in_progress', 'in progress'].includes(status) || !status
}

function isPending(row: HRRow): boolean {
  const status = text(row.status || row.approval_status || row.state)
  return ['pending', 'requested', 'submitted', 'waiting', 'in_review', 'in review'].includes(status)
}

function isAttendanceException(row: HRRow): boolean {
  const status = text(row.status || row.attendance_status || row.exception_type || row.type)
  return ['late', 'absent', 'missing_punch', 'missing punch', 'missed_punch', 'exception', 'anomaly', 'incomplete'].some((x) => status.includes(x))
}

function isValidatedAttendance(row: HRRow): boolean {
  const status = text(row.status || row.validation_status || row.attendance_status)
  return ['validated', 'approved', 'closed', 'complete', 'completed'].some((x) => status.includes(x))
}

function isRosterConflict(row: HRRow): boolean {
  const status = text(row.status || row.conflict_status || row.type || row.notes)
  return ['conflict', 'overlap', 'double', 'uncovered', 'missing'].some((x) => status.includes(x))
}

function missingDocument(row: HRRow): boolean {
  const status = text(row.status || row.compliance_status || row.document_status)
  return ['missing', 'expired', 'required', 'incomplete'].some((x) => status.includes(x))
}

function isOpenQualityIssue(row: HRRow): boolean {
  const status = text(row.status || row.quality_status || row.severity || row.state)
  return !['closed', 'resolved', 'fixed', 'done', 'completed', 'passed'].includes(status)
}

export function getHRProductionMetrics(data: HRDashboardData): HRProductionMetrics {
  const staff = arr(data.staff)
  const openings = arr(data.openings)
  const attendance = arr(data.attendance)
  const rosters = arr(data.rosters)
  const documents = arr(data.documents)
  const approvals = arr(data.approvals)
  const contracts = arr(data.contracts)
  const training = arr(data.training)
  const compliance = arr(data.compliance)
  const payroll = arr(data.payroll)
  const tasks = arr(data.tasks)
  const serviceRequests = arr(data.serviceRequests)
  const incidents = arr(data.incidents)
  const dataQuality = arr(data.dataQuality)
  const errorsCount = Object.keys(data.errors || {}).length

  const totalStaff = staff.length
  const activeStaff = staff.filter(isActive).length
  const openRoles = openings.filter(isOpen).length
  const pendingApprovals = approvals.filter(isPending).length
  const attendanceRecords = attendance.length
  const attendanceExceptions = attendance.filter(isAttendanceException).length
  const validatedAttendance = attendance.filter(isValidatedAttendance).length
  const rosterConflicts = rosters.filter(isRosterConflict).length
  const documentRecords = documents.length
  const missingDocs = documents.filter(missingDocument).length
  const contractRecords = contracts.length
  const trainingRecords = training.length
  const complianceItems = compliance.length
  const payrollInputs = payroll.length
  const openTasks = tasks.filter((row) => !['done', 'completed', 'closed'].includes(text(row.status))).length
  const openServiceRequests = serviceRequests.filter((row) => !['done', 'completed', 'closed'].includes(text(row.status))).length
  const openIncidents = incidents.filter((row) => !['done', 'completed', 'closed', 'resolved'].includes(text(row.status))).length
  const openQuality = dataQuality.length ? dataQuality.filter(isOpenQualityIssue).length + errorsCount : errorsCount

  return {
    totalStaff,
    activeStaff,
    activeStaffRate: totalStaff ? Math.round((activeStaff / totalStaff) * 100) : 0,

    openRoles,
    pendingApprovals,

    attendanceRecords,
    attendanceExceptions,
    validatedAttendance,
    rosterConflicts,

    documentRecords,
    missingDocs,
    contractRecords,
    trainingRecords,
    complianceItems,
    payrollInputs,

    openTasks,
    openServiceRequests,
    openIncidents,

    dataErrors: errorsCount,
    openQuality,

    staffCount: totalStaff,
    activeCount: activeStaff,
    openingsCount: openRoles,
    approvalsPending: pendingApprovals,
    attendanceCount: attendanceRecords,
    exceptionsCount: attendanceExceptions,
    validatedAttendanceRecords: validatedAttendance,
    conflictsCount: rosterConflicts,
    documentsCount: documentRecords,
    missingDocuments: missingDocs,
    qualityIssues: openQuality,
    openQualityIssues: openQuality,
  }
}

export function getHRProductionScore(data: HRDashboardData): number {
  const metrics = getHRProductionMetrics(data)

  let score = 100
  score -= Math.min(metrics.dataErrors * 8, 32)
  score -= Math.min(metrics.openQuality * 4, 24)
  score -= Math.min(metrics.attendanceExceptions * 2, 18)
  score -= Math.min(metrics.rosterConflicts * 3, 18)
  score -= Math.min(metrics.missingDocs * 2, 18)
  score -= Math.min(metrics.pendingApprovals, 10)

  return Math.max(0, Math.min(100, score))
}

export function getHRProductionStatus(score: number): HRHealthStatus {
  return score >= 85 ? 'healthy' : score >= 65 ? 'warning' : 'critical'
}

export function getHRProductionReadiness(data: HRDashboardData) {
  const score = getHRProductionScore(data)
  const status = getHRProductionStatus(score)

  return {
    score,
    status,
    label: score >= 85 ? 'Production ready' : score >= 65 ? 'Needs stabilization' : 'Critical attention',
    metrics: getHRProductionMetrics(data),
  }
}
