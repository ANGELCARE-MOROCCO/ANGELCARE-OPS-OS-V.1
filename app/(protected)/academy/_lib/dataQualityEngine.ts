export type QualityCheck = {
  key: string
  label: string
  passed: boolean
  count: number
  impact: 'operational' | 'financial' | 'compliance' | 'customer'
  fix: string
}

export function runAcademyDataQuality(input: {
  trainees?: any[]
  courses?: any[]
  trainers?: any[]
  groups?: any[]
  payments?: any[]
}) {
  const trainees = input.trainees || []
  const courses = input.courses || []
  const trainers = input.trainers || []
  const groups = input.groups || []
  const payments = input.payments || []

  const checks: QualityCheck[] = [
    {
      key: 'trainee-contact-completeness',
      label: 'Trainee contact completeness',
      count: trainees.filter((t) => !t.phone && !t.email).length,
      passed: trainees.every((t) => t.phone || t.email),
      impact: 'customer',
      fix: 'Add at least phone or email before follow-up, enrollment, or certificate delivery.',
    },
    {
      key: 'course-price-duration',
      label: 'Course price and duration integrity',
      count: courses.filter((c) => Number(c.price || 0) <= 0 || Number(c.duration_hours || 0) <= 0).length,
      passed: courses.every((c) => Number(c.price || 0) > 0 && Number(c.duration_hours || 0) > 0),
      impact: 'financial',
      fix: 'Set non-zero price and duration for all active courses.',
    },
    {
      key: 'trainer-specialty',
      label: 'Trainer specialty classification',
      count: trainers.filter((t) => !t.specialty).length,
      passed: trainers.every((t) => !!t.specialty),
      impact: 'operational',
      fix: 'Classify trainer specialties to enable reliable group assignment.',
    },
    {
      key: 'group-capacity',
      label: 'Group capacity readiness',
      count: groups.filter((g) => Number(g.max_capacity || 0) <= 0).length,
      passed: groups.every((g) => Number(g.max_capacity || 0) > 0),
      impact: 'operational',
      fix: 'Define capacity for every active/planned group.',
    },
    {
      key: 'payment-reference',
      label: 'Payment reference discipline',
      count: payments.filter((p) => p.status === 'paid' && !p.reference).length,
      passed: payments.every((p) => p.status !== 'paid' || !!p.reference),
      impact: 'compliance',
      fix: 'Add payment reference for each validated payment.',
    },
  ]

  return checks
}
