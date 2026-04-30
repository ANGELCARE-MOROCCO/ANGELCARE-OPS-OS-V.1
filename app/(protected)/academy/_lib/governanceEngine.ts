export type GovernanceSeverity = 'low' | 'medium' | 'high' | 'critical'

export type GovernanceFinding = {
  id: string
  title: string
  severity: GovernanceSeverity
  module: string
  recommendation: string
  ownerHint: string
}

export function buildAcademyGovernanceFindings(input: {
  trainees?: any[]
  enrollments?: any[]
  payments?: any[]
  attendance?: any[]
  certificates?: any[]
}) {
  const trainees = input.trainees || []
  const enrollments = input.enrollments || []
  const payments = input.payments || []
  const attendance = input.attendance || []
  const certificates = input.certificates || []

  const findings: GovernanceFinding[] = []

  const traineesWithoutSerial = trainees.filter((t) => !t.serial_number)
  if (traineesWithoutSerial.length) {
    findings.push({
      id: 'trainees-without-serial',
      title: `${traineesWithoutSerial.length} trainee record(s) without serial number`,
      severity: 'critical',
      module: 'Trainees',
      recommendation: 'Generate or repair serial numbers before issuing certificates or exporting dossiers.',
      ownerHint: 'Academy Admin',
    })
  }

  const approvedNotEnrolled = trainees.filter((t) => t.eligibility_status === 'approved' && !enrollments.some((e) => e.trainee_id === t.id))
  if (approvedNotEnrolled.length) {
    findings.push({
      id: 'approved-not-enrolled',
      title: `${approvedNotEnrolled.length} approved trainee(s) not enrolled`,
      severity: 'high',
      module: 'Eligibility / Enrollments',
      recommendation: 'Move approved candidates into enrollment or add rejection/hold reason.',
      ownerHint: 'Academy Coordinator',
    })
  }

  const unpaidEnrolled = enrollments.filter((e) => !payments.some((p) => p.trainee_id === e.trainee_id && p.status === 'paid'))
  if (unpaidEnrolled.length) {
    findings.push({
      id: 'enrolled-unpaid',
      title: `${unpaidEnrolled.length} enrolled record(s) without validated payment`,
      severity: 'high',
      module: 'Payments',
      recommendation: 'Validate payment, create installment plan, or flag exception before group dispatch.',
      ownerHint: 'Finance / Academy Sales',
    })
  }

  const certifiedWithoutAttendance = certificates.filter((c) => !attendance.some((a) => a.trainee_id === c.trainee_id))
  if (certifiedWithoutAttendance.length) {
    findings.push({
      id: 'certificate-without-attendance',
      title: `${certifiedWithoutAttendance.length} certificate(s) without attendance evidence`,
      severity: 'critical',
      module: 'Certificates / Attendance',
      recommendation: 'Attach attendance evidence or suspend certificate until compliance proof exists.',
      ownerHint: 'Academy Quality Lead',
    })
  }

  return findings
}

export function governanceScore(findings: GovernanceFinding[]) {
  const penalty = findings.reduce((sum, finding) => {
    if (finding.severity === 'critical') return sum + 25
    if (finding.severity === 'high') return sum + 15
    if (finding.severity === 'medium') return sum + 8
    return sum + 3
  }, 0)
  return Math.max(0, 100 - penalty)
}
