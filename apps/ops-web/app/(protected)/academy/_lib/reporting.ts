export type AcademyReportType =
  | 'executive_weekly'
  | 'trainee_lifecycle'
  | 'payment_aging'
  | 'attendance_quality'
  | 'certificate_registry'
  | 'partner_placement'
  | 'trainer_performance'

export const REPORT_CATALOG: Array<{
  type: AcademyReportType
  title: string
  description: string
  audience: string
  output: string
}> = [
  { type: 'executive_weekly', title: 'Weekly Executive Academy Report', description: 'Board-ready view of pipeline, revenue, risks, certificates and outcomes.', audience: 'CEO / Academy Director', output: 'PDF-ready' },
  { type: 'trainee_lifecycle', title: 'Trainee Lifecycle Report', description: 'Full status by trainee from prospect to certified and placed.', audience: 'Academy Operations', output: 'PDF-ready' },
  { type: 'payment_aging', title: 'Payment Aging Report', description: 'Collected, pending, overdue and aging buckets by trainee/group.', audience: 'Finance / Management', output: 'PDF-ready' },
  { type: 'attendance_quality', title: 'Attendance & Quality Report', description: 'Presence, absence, lateness, risk and dropout indicators.', audience: 'Training Managers', output: 'PDF-ready' },
  { type: 'certificate_registry', title: 'Certificate Registry', description: 'Issued attestations, serials, verification status and audit evidence.', audience: 'Compliance / Clients', output: 'PDF-ready' },
  { type: 'partner_placement', title: 'Partner Placement Report', description: 'Placement opportunities, partner activity, dispatched candidates and follow-up.', audience: 'B2B / Partnerships', output: 'PDF-ready' },
  { type: 'trainer_performance', title: 'Trainer Performance Report', description: 'Trainer workload, assigned cohorts, quality indicators and attendance outcomes.', audience: 'Academy Director', output: 'PDF-ready' },
]

export function formatMAD(value: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value || 0)
}

export function dateRangeLabel(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Toutes périodes'
  return `${start || 'Début'} → ${end || 'Aujourd’hui'}`
}
