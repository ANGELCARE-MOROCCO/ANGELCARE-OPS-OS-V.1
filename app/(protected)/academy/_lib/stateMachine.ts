export type AcademyStage =
  | 'lead'
  | 'prospect'
  | 'eligible'
  | 'enrolled'
  | 'active_training'
  | 'payment_risk'
  | 'attendance_risk'
  | 'ready_certificate'
  | 'certified'
  | 'graduated'
  | 'placed'
  | 'upsell';

export type AcademyTransition = {
  from: AcademyStage | '*';
  to: AcademyStage;
  action: string;
  label: string;
  requires?: string[];
};

export const ACADEMY_TRANSITIONS: AcademyTransition[] = [
  { from: 'lead', to: 'prospect', action: 'qualify_lead', label: 'Qualify lead' },
  { from: 'prospect', to: 'eligible', action: 'approve_eligibility', label: 'Approve eligibility', requires: ['eligibility_score'] },
  { from: 'eligible', to: 'enrolled', action: 'enroll', label: 'Enroll trainee', requires: ['course_id'] },
  { from: 'enrolled', to: 'active_training', action: 'activate_training', label: 'Activate training', requires: ['group_id'] },
  { from: 'active_training', to: 'ready_certificate', action: 'mark_ready_certificate', label: 'Mark ready for certificate', requires: ['attendance_ok', 'payment_ok'] },
  { from: 'ready_certificate', to: 'certified', action: 'issue_certificate', label: 'Issue certificate' },
  { from: 'certified', to: 'graduated', action: 'graduate', label: 'Graduate trainee' },
  { from: 'graduated', to: 'placed', action: 'place_with_partner', label: 'Place with partner' },
  { from: '*', to: 'payment_risk', action: 'flag_payment_risk', label: 'Flag payment risk' },
  { from: '*', to: 'attendance_risk', action: 'flag_attendance_risk', label: 'Flag attendance risk' },
  { from: '*', to: 'upsell', action: 'open_upsell', label: 'Open upsell opportunity' },
];

export function canTransition(current: AcademyStage | string | null | undefined, target: AcademyStage) {
  const currentStage = (current || 'prospect') as AcademyStage;
  return ACADEMY_TRANSITIONS.some((t) => (t.from === currentStage || t.from === '*') && t.to === target);
}

export function getAvailableTransitions(current: AcademyStage | string | null | undefined) {
  const currentStage = (current || 'prospect') as AcademyStage;
  return ACADEMY_TRANSITIONS.filter((t) => t.from === currentStage || t.from === '*');
}

export function stageLabel(stage?: string | null) {
  const map: Record<string, string> = {
    lead: 'Lead',
    prospect: 'Prospect',
    eligible: 'Eligible',
    enrolled: 'Enrolled',
    active_training: 'Active training',
    payment_risk: 'Payment risk',
    attendance_risk: 'Attendance risk',
    ready_certificate: 'Ready for certificate',
    certified: 'Certified',
    graduated: 'Graduated',
    placed: 'Placed',
    upsell: 'Upsell',
  };
  return map[String(stage || 'prospect')] || String(stage || 'Prospect');
}
