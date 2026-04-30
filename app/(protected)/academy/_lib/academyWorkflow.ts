export const ACADEMY_MODULES = [
  { title: 'Administration', href: '/academy/administration', desc: 'Governance, controls, audit, operating standards.' },
  { title: 'Trainees', href: '/academy/trainees', desc: 'Permanent trainee folders, serials, status lifecycle.' },
  { title: 'Eligibility', href: '/academy/eligibility', desc: 'Approval gate, scoring, rejection/request-info controls.' },
  { title: 'Courses', href: '/academy/courses', desc: 'Course catalog, pricing, duration and status.' },
  { title: 'Trainers', href: '/academy/trainers', desc: 'Trainer workforce, specialty, assignment readiness.' },
  { title: 'Locations & Groups', href: '/academy/locations-groups', desc: 'Locations, cohorts, group capacity and dispatch.' },
  { title: 'Enrollments', href: '/academy/enrollments', desc: 'Enroll trainee into course and group.' },
  { title: 'Payments', href: '/academy/payments', desc: 'Payment ledger, status, overdue risk and follow-up.' },
  { title: 'Calendar', href: '/academy/calendar', desc: 'Training schedule and session control.' },
  { title: 'Attendance', href: '/academy/attendance', desc: 'Presence, absence, lateness and quality risks.' },
  { title: 'Certificates', href: '/academy/certificates', desc: 'Certificate registry, readiness and authenticity.' },
  { title: 'Graduation', href: '/academy/graduation', desc: 'Graduation outcomes, placement and upsell.' },
  { title: 'Partners', href: '/academy/partners', desc: 'Schools, nurseries and professional partner pipeline.' },
  { title: 'Alerts & Sales', href: '/academy/alerts-sales', desc: 'Alerts, reminders, sales and after-sales follow-up.' },
] as const

export const TRAINEE_STATUSES = ['prospect', 'eligible', 'enrolled', 'active', 'certified', 'graduated', 'placed', 'rejected'] as const
export const ELIGIBILITY_STATUSES = ['pending', 'approved', 'rejected', 'request_info'] as const
export const ENROLLMENT_STATUSES = ['draft', 'enrolled', 'active', 'paused', 'completed', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'cancelled'] as const
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const
export const GROUP_STATUSES = ['planned', 'active', 'completed', 'cancelled'] as const
export const COURSE_STATUSES = ['active', 'draft', 'paused', 'archived'] as const

export function generateAcademySerial(city?: string | null) {
  const year = new Date().getFullYear()
  const cityCode = (city || 'GEN').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GEN'
  const stamp = Date.now().toString().slice(-6)
  return `ACAD-${year}-${cityCode}-${stamp}`
}

export function generateCertificateNumber(serial?: string | null) {
  const stamp = Date.now().toString().slice(-8)
  return `CERT-${serial || 'ACAD'}-${stamp}`.replace(/[^a-zA-Z0-9-]/g, '')
}

export function paymentRisk(payment: any) {
  if (!payment) return { label: 'No payment', tone: '#64748b' }
  if (payment.status === 'paid') return { label: 'Paid', tone: '#16a34a' }
  if (payment.status === 'overdue') return { label: 'Overdue', tone: '#dc2626' }
  if (payment.due_at && new Date(payment.due_at) < new Date() && payment.status !== 'paid') return { label: 'Overdue', tone: '#dc2626' }
  if (payment.status === 'partial') return { label: 'Partial', tone: '#f59e0b' }
  return { label: 'Pending', tone: '#f59e0b' }
}

export function attendanceRisk(logs: any[]) {
  if (!logs?.length) return { label: 'No attendance', tone: '#64748b', rate: 0 }
  const present = logs.filter((l) => l.status === 'present' || l.status === 'late').length
  const rate = Math.round((present / logs.length) * 100)
  if (rate < 70) return { label: 'High risk', tone: '#dc2626', rate }
  if (rate < 85) return { label: 'Watch', tone: '#f59e0b', rate }
  return { label: 'Stable', tone: '#16a34a', rate }
}

export function certificateReady({ trainee, latestPayment, attendanceLogs }: any) {
  const payOk = latestPayment?.status === 'paid'
  const att = attendanceRisk(attendanceLogs || [])
  const eligibilityOk = trainee?.eligibility_status === 'approved'
  return { ready: Boolean(payOk && att.rate >= 80 && eligibilityOk), payOk, attendanceRate: att.rate, eligibilityOk }
}
