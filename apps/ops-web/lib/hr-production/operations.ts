import { getHRDashboardData, logHRActivity } from './repository'
import { getHRProductionMetrics, getHRProductionReadiness, getHRProductionScore, getHRProductionStatus } from './metrics'
import type { HRDashboardData, HRRow } from './types'

export type HRDiagnosticCheck = {
  id: string
  label: string
  status: 'passed' | 'warning' | 'failed'
  severity: 'info' | 'warning' | 'critical'
  owner: string
  context: string
  recommendedAction: string
  safeToAutoRemediate: boolean
  endpoint?: string
}

function arr(value: unknown): HRRow[] {
  return Array.isArray(value) ? (value as HRRow[]) : []
}

function text(value: unknown): string {
  return String(value || '').toLowerCase()
}

function isOpen(row: HRRow): boolean {
  const s = text(row.status || row.state || row.approval_status || row.request_status)
  return !s || ['open', 'pending', 'requested', 'submitted', 'in_review', 'in progress', 'in_progress', 'active'].some((x) => s.includes(x))
}

function isMissingDocument(row: HRRow): boolean {
  const s = text(row.status || row.compliance_status || row.document_status || row.expiry_status)
  return ['missing', 'expired', 'required', 'incomplete'].some((x) => s.includes(x))
}

function isRosterConflict(row: HRRow): boolean {
  const s = text(row.status || row.conflict_status || row.type || row.notes)
  return ['conflict', 'overlap', 'double', 'uncovered', 'missing'].some((x) => s.includes(x))
}

function isAttendanceRisk(row: HRRow): boolean {
  const s = text(row.status || row.attendance_status || row.exception_type || row.type)
  return ['late', 'absent', 'missing', 'exception', 'anomaly', 'incomplete'].some((x) => s.includes(x))
}

function sourceConfidence(data: HRDashboardData): 'live' | 'partial' | 'fallback' {
  const errorCount = Object.keys(data.errors || {}).length
  const liveRows = ['staff', 'attendance', 'rosters', 'documents', 'approvals'].reduce((sum, key) => sum + arr((data as any)[key]).length, 0)
  if (errorCount === 0 && liveRows > 0) return 'live'
  if (liveRows > 0) return 'partial'
  return 'fallback'
}

export function buildHRRecommendations(data: HRDashboardData): string[] {
  const metrics = getHRProductionMetrics(data)
  const recommendations: string[] = []
  if (metrics.dataErrors) recommendations.push(`Resolve ${metrics.dataErrors} HR data source warning(s) before declaring full production readiness.`)
  if (metrics.attendanceExceptions) recommendations.push(`Review ${metrics.attendanceExceptions} attendance exception(s) and open correction workflow for missing/late punches.`)
  if (metrics.rosterConflicts) recommendations.push(`Open roster conflict workspace for ${metrics.rosterConflicts} uncovered/overlapping assignment(s).`)
  if (metrics.missingDocs) recommendations.push(`Launch document compliance review for ${metrics.missingDocs} missing or expired HR document(s).`)
  if (metrics.pendingApprovals) recommendations.push(`Clear ${metrics.pendingApprovals} pending HR approval(s) before payroll or staffing closure.`)
  if (metrics.openRoles) recommendations.push(`Validate ${metrics.openRoles} open role(s) against active recruitment and onboarding capacity.`)
  if (!recommendations.length) recommendations.push('HR cockpit is stable. Keep monitoring attendance, documents, approvals and payroll readiness from the command bridge.')
  return recommendations
}

export async function buildHROperationalSnapshot(action = 'snapshot') {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const readiness = getHRProductionReadiness(data)
  const score = getHRProductionScore(data)
  const status = getHRProductionStatus(score)
  const confidence = sourceConfidence(data)
  const recommendations = buildHRRecommendations(data)
  const audit = [...arr(data.audit), ...arr(data.activity)]
    .sort((a, b) => String(b.created_at || b.timestamp || '').localeCompare(String(a.created_at || a.timestamp || '')))
    .slice(0, 30)

  await logHRActivity({
    action: `hr.${action}`,
    entity_type: 'hr_module',
    module: 'hr',
    source: 'hr-production-command-bridge',
    status: 'recorded',
    severity: confidence === 'fallback' ? 'warning' : 'info',
    payload: { score, status, confidence, metrics },
  })

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    endpoint: '/api/hr/live-snapshot',
    sourceConfidence: confidence,
    score,
    status,
    readiness,
    metrics,
    totals: {
      employees: metrics.totalStaff,
      activeEmployees: metrics.activeStaff,
      inactiveEmployees: Math.max(0, metrics.totalStaff - metrics.activeStaff),
      pendingOnboarding: arr(data.onboarding).filter(isOpen).length,
      openRecruitmentCandidates: arr(data.candidates).filter(isOpen).length,
      attendanceRecords: metrics.attendanceRecords,
      attendanceExceptions: metrics.attendanceExceptions,
      leaveRequests: arr(data.leave).filter(isOpen).length,
      rosterConflicts: metrics.rosterConflicts,
      pendingApprovals: metrics.pendingApprovals,
      missingDocuments: metrics.missingDocs,
      trainingRecords: metrics.trainingRecords,
      payrollInputs: metrics.payrollInputs,
      auditEvents: audit.length,
    },
    health: {
      api: 'reachable',
      supabase: confidence === 'fallback' ? 'needs_configuration_or_tables' : 'reachable',
      employees: metrics.totalStaff ? 'active' : 'empty',
      attendance: metrics.attendanceExceptions ? 'attention' : 'stable',
      rosters: metrics.rosterConflicts ? 'attention' : 'stable',
      approvals: metrics.pendingApprovals ? 'pending' : 'stable',
      audit: audit.length ? 'active' : 'empty',
    },
    recommendations,
    audit,
    errors: data.errors || {},
  }
}

export async function runHRDiagnostics(action = 'diagnostics') {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const confidence = sourceConfidence(data)
  const checks: HRDiagnosticCheck[] = []
  const push = (check: HRDiagnosticCheck) => checks.push(check)

  push({
    id: 'hr-api-repository',
    label: 'HR repository/API availability',
    status: Object.keys(data.errors || {}).length ? 'warning' : 'passed',
    severity: Object.keys(data.errors || {}).length ? 'warning' : 'info',
    owner: 'HR Platform',
    context: Object.keys(data.errors || {}).length ? `${Object.keys(data.errors).length} table compatibility warning(s)` : 'Repository loaded without table errors.',
    recommendedAction: Object.keys(data.errors || {}).length ? 'Open Sync Center, run diagnose, then apply safe additive database compatibility SQL if needed.' : 'Keep monitoring via /api/hr/health and /api/hr/live-snapshot.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/sync/diagnose',
  })
  push({
    id: 'employees-live-state',
    label: 'Employee live state',
    status: metrics.totalStaff ? 'passed' : 'warning',
    severity: metrics.totalStaff ? 'info' : 'warning',
    owner: 'HR Operations',
    context: `${metrics.totalStaff} employee/staff record(s), ${metrics.activeStaff} active.`,
    recommendedAction: metrics.totalStaff ? 'Continue using Employees Command Center for profile operations.' : 'Create or import real staff records before production launch.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/employees',
  })
  push({
    id: 'attendance-risk',
    label: 'Attendance exceptions',
    status: metrics.attendanceExceptions ? 'warning' : 'passed',
    severity: metrics.attendanceExceptions ? 'warning' : 'info',
    owner: 'Workforce Operations',
    context: `${metrics.attendanceExceptions} exception(s) across ${metrics.attendanceRecords} attendance record(s).`,
    recommendedAction: metrics.attendanceExceptions ? 'Open attendance corrections and validate missing/late punches.' : 'Attendance stream currently has no detected exception.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/attendance/status',
  })
  push({
    id: 'roster-conflicts',
    label: 'Roster conflicts',
    status: metrics.rosterConflicts ? 'warning' : 'passed',
    severity: metrics.rosterConflicts ? 'warning' : 'info',
    owner: 'Scheduling',
    context: `${metrics.rosterConflicts} roster conflict(s) detected.`,
    recommendedAction: metrics.rosterConflicts ? 'Open roster planner and resolve overlapping/uncovered shifts.' : 'Roster dataset has no conflict marker.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/work-schedules',
  })
  push({
    id: 'document-compliance',
    label: 'Document compliance',
    status: metrics.missingDocs ? 'warning' : 'passed',
    severity: metrics.missingDocs ? 'warning' : 'info',
    owner: 'Compliance',
    context: `${metrics.missingDocs} missing/expired document(s) across ${metrics.documentRecords} document record(s).`,
    recommendedAction: metrics.missingDocs ? 'Open documents/compliance page and request missing files.' : 'No missing/expired HR document marker detected.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/export?scope=documents',
  })
  push({
    id: 'payroll-readiness',
    label: 'Payroll readiness',
    status: metrics.pendingApprovals || metrics.attendanceExceptions ? 'warning' : 'passed',
    severity: metrics.pendingApprovals || metrics.attendanceExceptions ? 'warning' : 'info',
    owner: 'Finance/HR',
    context: `${metrics.pendingApprovals} pending approval(s), ${metrics.payrollInputs} payroll input(s).`,
    recommendedAction: metrics.pendingApprovals || metrics.attendanceExceptions ? 'Resolve pending approvals and attendance exceptions before payroll generation.' : 'Payroll readiness has no blocking HR signal.',
    safeToAutoRemediate: false,
    endpoint: '/api/hr/payroll/generate',
  })

  const failed = checks.filter((x) => x.status === 'failed').length
  const warnings = checks.filter((x) => x.status === 'warning').length
  await logHRActivity({
    action: `hr.${action}`,
    entity_type: 'hr_module',
    module: 'hr',
    source: 'hr-production-command-bridge',
    status: failed ? 'failed' : warnings ? 'warning' : 'passed',
    severity: failed ? 'critical' : warnings ? 'warning' : 'info',
    payload: { failed, warnings, confidence, checks },
  })

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    endpoint: '/api/hr/diagnostics',
    sourceConfidence: confidence,
    summary: { passed: checks.filter((x) => x.status === 'passed').length, warnings, failed },
    checks,
    recommendations: buildHRRecommendations(data),
    raw: { metrics, errors: data.errors || {} },
  }
}

export async function getHRRecentAudit(limit = 50) {
  const data = await getHRDashboardData()
  const audit = [...arr(data.audit), ...arr(data.activity)]
    .sort((a, b) => String(b.created_at || b.timestamp || '').localeCompare(String(a.created_at || a.timestamp || '')))
    .slice(0, Math.max(1, Math.min(200, limit)))
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    endpoint: '/api/hr/audit/recent',
    sourceConfidence: sourceConfidence(data),
    audit,
    empty: audit.length === 0,
  }
}

export async function recordHRSafeAction(input: { action: string; reason?: string; payload?: any }) {
  const unsafe = ['purge', 'delete_all', 'silent_repair', 'payroll_generate_without_confirmation']
  const normalized = text(input.action)
  const blocked = unsafe.some((x) => normalized.includes(x))
  await logHRActivity({
    action: `hr.action.${input.action}`,
    entity_type: 'hr_operation',
    module: 'hr',
    source: 'hr-production-command-bridge',
    status: blocked ? 'blocked' : 'recorded',
    severity: blocked ? 'warning' : 'info',
    reason: input.reason || (blocked ? 'Unsafe action requires an explicit endpoint and confirmation gate.' : 'Action recorded by HR command bridge.'),
    payload: input.payload || {},
  })
  return {
    ok: !blocked,
    blocked,
    action: input.action,
    generatedAt: new Date().toISOString(),
    message: blocked ? 'Action safely blocked and audited. A confirmation-gated implementation is required.' : 'Action recorded and audited.',
  }
}
