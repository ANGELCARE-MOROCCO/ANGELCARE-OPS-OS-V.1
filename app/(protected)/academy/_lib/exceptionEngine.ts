export type AcademyException = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'eligibility' | 'payment' | 'attendance' | 'capacity' | 'certificate' | 'placement';
  title: string;
  message: string;
  entityType: string;
  entityId?: string;
  actionHref: string;
  actionLabel: string;
};

function daysAgo(date?: string | null) {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function buildAcademyExceptions(input: {
  trainees?: any[];
  payments?: any[];
  attendance?: any[];
  groups?: any[];
  certificates?: any[];
  enrollments?: any[];
}): AcademyException[] {
  const trainees = input.trainees || [];
  const payments = input.payments || [];
  const attendance = input.attendance || [];
  const groups = input.groups || [];
  const certificates = input.certificates || [];
  const enrollments = input.enrollments || [];
  const exceptions: AcademyException[] = [];

  for (const trainee of trainees) {
    if ((trainee.eligibility_status || 'pending') === 'pending') {
      exceptions.push({
        id: `eligibility-${trainee.id}`,
        severity: daysAgo(trainee.created_at) > 3 ? 'high' : 'medium',
        type: 'eligibility',
        title: 'Eligibility pending',
        message: `${trainee.full_name || 'Trainee'} needs eligibility decision before enrollment.`,
        entityType: 'trainee',
        entityId: trainee.id,
        actionHref: `/academy/eligibility?trainee=${trainee.id}`,
        actionLabel: 'Review eligibility',
      });
    }
  }

  for (const payment of payments) {
    const status = payment.status || 'pending';
    const overdue = payment.due_at && new Date(payment.due_at) < new Date() && status !== 'paid';
    if (overdue || status === 'overdue') {
      exceptions.push({
        id: `payment-${payment.id}`,
        severity: 'critical',
        type: 'payment',
        title: 'Overdue academy payment',
        message: `Payment ${payment.reference || payment.id} is overdue and requires follow-up.`,
        entityType: 'payment',
        entityId: payment.id,
        actionHref: `/academy/payments?payment=${payment.id}`,
        actionLabel: 'Follow payment',
      });
    }
  }

  const attendanceByTrainee = new Map<string, any[]>();
  for (const log of attendance) {
    if (!log.trainee_id) continue;
    attendanceByTrainee.set(log.trainee_id, [...(attendanceByTrainee.get(log.trainee_id) || []), log]);
  }
  for (const [traineeId, logs] of attendanceByTrainee) {
    const absences = logs.filter((l) => l.status === 'absent').length;
    const late = logs.filter((l) => l.status === 'late').length;
    if (absences >= 2 || late >= 3) {
      exceptions.push({
        id: `attendance-${traineeId}`,
        severity: absences >= 3 ? 'critical' : 'high',
        type: 'attendance',
        title: 'Attendance risk detected',
        message: `${absences} absence(s), ${late} late mark(s). Intervention recommended.`,
        entityType: 'trainee',
        entityId: traineeId,
        actionHref: `/academy/attendance?trainee=${traineeId}`,
        actionLabel: 'Open attendance',
      });
    }
  }

  for (const group of groups) {
    const count = enrollments.filter((e) => e.group_id === group.id).length;
    const capacity = Number(group.max_capacity || 0);
    if (capacity > 0 && count > capacity) {
      exceptions.push({
        id: `capacity-${group.id}`,
        severity: 'critical',
        type: 'capacity',
        title: 'Group over capacity',
        message: `${group.name || 'Group'} has ${count}/${capacity} enrolled trainees.`,
        entityType: 'group',
        entityId: group.id,
        actionHref: `/academy/locations-groups?group=${group.id}`,
        actionLabel: 'Rebalance group',
      });
    }
  }

  for (const trainee of trainees) {
    const isReady = trainee.status === 'ready_certificate' || trainee.status === 'active_training';
    const hasCertificate = certificates.some((c) => c.trainee_id === trainee.id);
    if (isReady && !hasCertificate) {
      exceptions.push({
        id: `certificate-${trainee.id}`,
        severity: 'medium',
        type: 'certificate',
        title: 'Certificate action pending',
        message: `${trainee.full_name || 'Trainee'} may be ready for certificate review.`,
        entityType: 'trainee',
        entityId: trainee.id,
        actionHref: `/academy/certificates?trainee=${trainee.id}`,
        actionLabel: 'Review certificate',
      });
    }
  }

  return exceptions.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    return order[a.severity] - order[b.severity];
  });
}
