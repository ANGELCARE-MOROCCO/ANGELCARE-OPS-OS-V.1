import { getHRDashboardData, logHRActivity } from './repository'
import type { HRDashboardData, HRRow } from './types'

export type HRLiveDomain = 'attendance' | 'rosters' | 'work-schedules' | 'leave' | 'approvals' | 'documents' | 'contracts' | 'compliance' | 'training' | 'recruitment' | 'onboarding' | 'payroll' | 'reports' | 'employees' | 'staff' | 'hr' | string

const domainKeys: Record<string, string[]> = {
  attendance: ['attendance'],
  rosters: ['rosters'],
  'work-schedules': ['rosters', 'staff', 'leave'],
  leave: ['leave', 'approvals', 'rosters'],
  approvals: ['approvals', 'leave', 'payroll'],
  documents: ['documents', 'contracts', 'compliance'],
  contracts: ['contracts', 'documents', 'compliance'],
  compliance: ['compliance', 'documents', 'contracts', 'training'],
  training: ['training', 'staff', 'compliance'],
  recruitment: ['openings', 'candidates', 'onboarding'],
  onboarding: ['onboarding', 'candidates', 'staff', 'documents', 'training'],
  payroll: ['payroll', 'attendance', 'approvals', 'leave'],
  reports: ['staff', 'attendance', 'rosters', 'leave', 'payroll', 'approvals', 'audit'],
  employees: ['staff', 'attendance', 'rosters', 'documents', 'training', 'contracts'],
  staff: ['staff', 'attendance', 'rosters', 'documents', 'training', 'contracts'],
  hr: ['staff', 'attendance', 'rosters', 'leave', 'documents', 'approvals', 'training', 'payroll'],
}

function rows(data: HRDashboardData, key: string): HRRow[] {
  const value = (data as any)[key]
  return Array.isArray(value) ? value : []
}

function txt(value: unknown) { return String(value || '').toLowerCase() }
function open(row: HRRow) { return !txt(row.status || row.state || row.request_status || row.approval_status) || ['open', 'active', 'pending', 'requested', 'submitted', 'planned', 'in_progress', 'review'].some((x) => txt(row.status || row.state || row.request_status || row.approval_status).includes(x)) }
function warning(row: HRRow) { return ['warning', 'late', 'missing', 'expired', 'pending', 'conflict', 'blocked', 'review', 'incomplete', 'uncovered', 'overlap'].some((x) => txt(Object.values(row).join(' ')).includes(x)) }
function blocked(row: HRRow) { return ['critical', 'failed', 'blocked', 'unsafe', 'expired', 'absent', 'hard_delete'].some((x) => txt(Object.values(row).join(' ')).includes(x)) }

function confidence(data: HRDashboardData, keys: string[]) {
  const errors = Object.keys(data.errors || {}).filter((key) => keys.includes(key)).length
  const count = keys.reduce((sum, key) => sum + rows(data, key).length, 0)
  if (count > 0 && errors === 0) return 'live'
  if (count > 0) return 'partial'
  return 'fallback'
}

function actionSet(domain: string) {
  const safe = (id: string, label: string, detail: string, mode = 'gated') => ({ id, label, detail, mode })
  const common = [safe(`${domain}.refresh`, 'Refresh synced dataset', 'Reloads live/fallback HR data through the domain endpoint.', 'safe')]
  const byDomain: Record<string, any[]> = {
    attendance: [safe('attendance.correction_request', 'Create correction request', 'Creates a non-destructive attendance correction workflow.'), safe('attendance.manager_review', 'Route manager review', 'Marks selected attendance risks for managerial validation.')],
    rosters: [safe('rosters.conflict_review', 'Open conflict review', 'Audits uncovered/overlapping roster records.'), safe('rosters.print_ready', 'Generate print-ready roster', 'Uses non-mutating export/print workflow.')],
    'work-schedules': [safe('work_schedules.shift_validation', 'Validate shifts', 'Checks conflicts against leave, staff and roster data.'), safe('work_schedules.print_board', 'Generate office board', 'Creates a print/export-ready schedule package.')],
    leave: [safe('leave.approval_review', 'Review leave approvals', 'Routes open leave requests into approval workspace.')],
    approvals: [safe('approvals.bulk_review', 'Bulk review pending approvals', 'Prepares approval queue; does not auto-approve.')],
    documents: [safe('documents.request_missing', 'Request missing documents', 'Creates/audits requests for missing or expired documents.')],
    contracts: [safe('contracts.renewal_review', 'Review contract renewals', 'Flags expiring contract records for HR validation.')],
    compliance: [safe('compliance.risk_review', 'Open compliance risk review', 'Builds a compliance action list from documents/contracts/training.')],
    training: [safe('training.assignment_review', 'Review training assignments', 'Prepares training assignment actions without silent mutation.')],
    recruitment: [safe('recruitment.pipeline_review', 'Review candidate pipeline', 'Audits candidate/opening progress and stale stages.')],
    onboarding: [safe('onboarding.checklist_review', 'Review onboarding checklists', 'Audits incomplete onboarding tasks and candidate conversion gaps.')],
    payroll: [safe('payroll.generate_preview', 'Generate payroll preview', 'Preview-only; final payroll mutation remains confirmation-gated.')],
    reports: [safe('reports.full_export', 'Generate full HR export', 'Downloads a structured HR reporting package.')],
  }
  return [...common, ...(byDomain[domain] || [])]
}

function domainRisks(domain: string, records: HRRow[], data: HRDashboardData) {
  const risks: any[] = []
  const warn = records.filter(warning)
  const block = records.filter(blocked)
  if (warn.length) risks.push({ id: `${domain}-warnings`, title: `${warn.length} warning record(s)`, severity: 'warning', detail: 'Detected pending, incomplete, missing, late, expired, conflict or review markers in this domain.' })
  if (block.length) risks.push({ id: `${domain}-blocked`, title: `${block.length} blocking record(s)`, severity: 'critical', detail: 'Critical/blocked/failed/absent/expired markers require human review before workflow closure.' })

  if (domain === 'payroll') {
    const attendanceRisks = rows(data, 'attendance').filter(warning).length
    const approvalRisks = rows(data, 'approvals').filter(open).length
    if (attendanceRisks || approvalRisks) risks.push({ id: 'payroll-input-blockers', title: 'Payroll input blockers', severity: 'warning', detail: `${attendanceRisks} attendance risk(s), ${approvalRisks} pending approval(s) should be cleared before payroll generation.` })
  }
  if (domain === 'leave') {
    const rosterOverlap = rows(data, 'rosters').filter(warning).length
    if (rosterOverlap) risks.push({ id: 'leave-roster-impact', title: 'Roster impact detected', severity: 'warning', detail: `${rosterOverlap} roster warning(s) may need review against leave decisions.` })
  }
  if (domain === 'onboarding') {
    const candidates = rows(data, 'candidates').filter(open).length
    const tasks = rows(data, 'onboarding').filter(open).length
    if (candidates || tasks) risks.push({ id: 'onboarding-pending', title: 'Pending onboarding workload', severity: 'warning', detail: `${candidates} candidate(s) and ${tasks} onboarding task(s) remain active.` })
  }
  if (domain === 'documents' || domain === 'compliance' || domain === 'contracts') {
    const missingDocs = rows(data, 'documents').filter(warning).length
    const contractRisks = rows(data, 'contracts').filter(warning).length
    if (missingDocs || contractRisks) risks.push({ id: 'compliance-doc-risk', title: 'Document/contract risk', severity: 'warning', detail: `${missingDocs} document warning(s), ${contractRisks} contract warning(s).` })
  }
  return risks.slice(0, 20)
}

export async function buildHRDomainLiveState(domainInput: HRLiveDomain = 'hr') {
  const domain = String(domainInput || 'hr')
  const data = await getHRDashboardData()
  const keys = domainKeys[domain] || domainKeys.hr
  const records = keys.flatMap((key) => rows(data, key).map((row) => ({ ...row, __domainTable: key })))
  const auditRows = [...rows(data, 'audit'), ...rows(data, 'activity')].slice(0, 25)
  const summary = {
    records: records.length,
    active: records.filter(open).length,
    warnings: records.filter(warning).length,
    blocked: records.filter(blocked).length,
    auditEvents: auditRows.length,
  }
  const sourceConfidence = confidence(data, keys)
  const status = summary.blocked ? 'critical' : summary.warnings ? 'attention' : sourceConfidence === 'fallback' ? 'fallback' : 'synced'
  const risks = domainRisks(domain, records, data)
  const actions = actionSet(domain)

  await logHRActivity({
    action: 'hr.domain_live_state',
    entity_type: 'hr_domain',
    entity_id: domain,
    module: 'hr',
    source: 'hr-live-sync-layer',
    severity: status === 'critical' ? 'critical' : status === 'attention' ? 'warning' : 'info',
    status: 'recorded',
    payload: { domain, keys, summary, sourceConfidence, status },
  })

  return {
    ok: true,
    endpoint: '/api/hr/realtime/state',
    domain,
    keys,
    generatedAt: new Date().toISOString(),
    sourceConfidence,
    status,
    summary,
    risks,
    actions,
    sampleRecords: records.slice(0, 25),
    audit: auditRows,
    errors: data.errors || {},
  }
}

export async function buildHRDomainExport(format = 'json') {
  const data = await getHRDashboardData()
  const domains = Object.keys(domainKeys).filter((x) => x !== 'hr')
  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    format,
    sourceConfidence: confidence(data, ['staff', 'attendance', 'rosters', 'leave', 'payroll', 'approvals', 'documents']),
    domains: await Promise.all(domains.map((domain) => buildHRDomainLiveState(domain))),
  }
  await logHRActivity({ action: 'hr.full_live_export', entity_type: 'hr_report', module: 'hr', source: 'hr-live-sync-layer', status: 'recorded', payload: { format, domains: domains.length } })
  return payload
}
