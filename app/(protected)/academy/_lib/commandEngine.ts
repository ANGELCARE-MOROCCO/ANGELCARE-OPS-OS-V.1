import type { AcademyException } from './exceptionEngine';

export type AcademyCommand = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  ownerHint: string;
  expectedOutcome: string;
};

export function buildManagerCommands(exceptions: AcademyException[], snapshot: any = {}): AcademyCommand[] {
  const commands: AcademyCommand[] = [];
  const critical = exceptions.filter((e) => e.severity === 'critical');
  const payment = exceptions.find((e) => e.type === 'payment');
  const eligibility = exceptions.find((e) => e.type === 'eligibility');
  const attendance = exceptions.find((e) => e.type === 'attendance');
  const certificate = exceptions.find((e) => e.type === 'certificate');

  if (critical.length) {
    commands.push({
      id: 'critical-exceptions',
      title: 'Resolve critical Academy exceptions',
      description: `${critical.length} critical exception(s) require direct management action today.`,
      href: critical[0].actionHref,
      priority: 'P0',
      ownerHint: 'Academy Manager / CEO',
      expectedOutcome: 'Remove operational blockers and reduce risk exposure.',
    });
  }
  if (payment) {
    commands.push({
      id: 'payment-followup',
      title: 'Secure payment follow-up',
      description: payment.message,
      href: payment.actionHref,
      priority: 'P1',
      ownerHint: 'Finance / Sales admin',
      expectedOutcome: 'Payment status updated and follow-up recorded.',
    });
  }
  if (eligibility) {
    commands.push({
      id: 'eligibility-queue',
      title: 'Clear eligibility queue',
      description: eligibility.message,
      href: '/academy/eligibility',
      priority: 'P1',
      ownerHint: 'Academy Coordinator',
      expectedOutcome: 'Candidates approved, rejected, or sent for missing information.',
    });
  }
  if (attendance) {
    commands.push({
      id: 'attendance-risk',
      title: 'Intervene on attendance risk',
      description: attendance.message,
      href: attendance.actionHref,
      priority: 'P1',
      ownerHint: 'Trainer / Academy Manager',
      expectedOutcome: 'Risk note recorded and trainee contacted.',
    });
  }
  if (certificate) {
    commands.push({
      id: 'certificate-queue',
      title: 'Review certificate readiness',
      description: certificate.message,
      href: '/academy/certificates',
      priority: 'P2',
      ownerHint: 'Academy Admin',
      expectedOutcome: 'Certificate issued or blocked with reason.',
    });
  }
  if (!commands.length) {
    commands.push({
      id: 'stable-ops',
      title: 'Maintain Academy operating rhythm',
      description: 'No critical exception detected. Review pipeline velocity and next cohort readiness.',
      href: '/academy',
      priority: 'P3',
      ownerHint: 'Academy Manager',
      expectedOutcome: 'Keep pipeline moving and validate next cohort capacity.',
    });
  }
  return commands;
}
