export type AutomationSignal = {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'payment' | 'attendance' | 'eligibility' | 'certificate' | 'placement' | 'quality'
  title: string
  message: string
  actionLabel: string
  href: string
}

export function buildAutomationSignals(input: {
  trainees?: any[]
  payments?: any[]
  attendance?: any[]
  certificates?: any[]
  followups?: any[]
}): AutomationSignal[] {
  const trainees = input.trainees || []
  const payments = input.payments || []
  const attendance = input.attendance || []
  const certificates = input.certificates || []
  const followups = input.followups || []

  const signals: AutomationSignal[] = []

  trainees
    .filter((t) => !t.eligibility_status || t.eligibility_status === 'pending')
    .slice(0, 8)
    .forEach((t) => signals.push({
      id: `eligibility-${t.id}`,
      severity: 'high',
      category: 'eligibility',
      title: 'Eligibility gate pending',
      message: `${t.full_name || 'Trainee'} cannot move cleanly to enrollment until eligibility is validated.`,
      actionLabel: 'Open eligibility control',
      href: `/academy/eligibility?trainee=${t.id}`,
    }))

  payments
    .filter((p) => p.status !== 'paid')
    .slice(0, 10)
    .forEach((p) => signals.push({
      id: `payment-${p.id}`,
      severity: p.due_at && new Date(p.due_at) < new Date() ? 'critical' : 'medium',
      category: 'payment',
      title: 'Payment follow-up required',
      message: `Payment ${p.reference || p.id} is ${p.status || 'pending'} and requires finance follow-up.`,
      actionLabel: 'Open payment ledger',
      href: '/academy/payments',
    }))

  const attendanceByTrainee = attendance.reduce<Record<string, any[]>>((acc, item) => {
    const key = item.trainee_id || 'unknown'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  Object.entries(attendanceByTrainee).forEach(([traineeId, logs]) => {
    const absent = logs.filter((l) => l.status === 'absent').length
    const late = logs.filter((l) => l.status === 'late').length
    if (absent >= 2 || late >= 3) {
      signals.push({
        id: `attendance-${traineeId}`,
        severity: absent >= 3 ? 'critical' : 'high',
        category: 'attendance',
        title: 'Attendance risk detected',
        message: `Trainee ${traineeId} has ${absent} absence(s) and ${late} late mark(s).`,
        actionLabel: 'Open attendance control',
        href: `/academy/attendance?trainee=${traineeId}`,
      })
    }
  })

  trainees
    .filter((t) => t.status === 'active' || t.status === 'completed')
    .filter((t) => !certificates.some((c) => c.trainee_id === t.id))
    .slice(0, 8)
    .forEach((t) => signals.push({
      id: `certificate-${t.id}`,
      severity: 'medium',
      category: 'certificate',
      title: 'Certificate readiness to verify',
      message: `${t.full_name || 'Trainee'} may require certificate readiness review.`,
      actionLabel: 'Open certificate registry',
      href: `/academy/certificates?trainee=${t.id}`,
    }))

  followups
    .filter((f) => f.status !== 'closed')
    .slice(0, 8)
    .forEach((f) => signals.push({
      id: `placement-${f.id}`,
      severity: 'medium',
      category: 'placement',
      title: 'Post-graduation opportunity open',
      message: `${f.opportunity_type || 'Opportunity'} requires next action.`,
      actionLabel: 'Open graduation outcomes',
      href: '/academy/graduation',
    }))

  return signals.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

function severityRank(severity: AutomationSignal['severity']) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity]
}
