import type {
  Phase37AutonomyReadiness,
  Phase37HumanGate,
  Phase37RollbackPlan,
  Phase37SafetyCheck,
} from './phase37-safety-types';

export function getPhase37MandatoryHumanGates(gates: Phase37HumanGate[]): Phase37HumanGate[] {
  return gates.filter((gate) => gate.mandatory);
}

export function getPhase37FailedRequiredChecks(checks: Phase37SafetyCheck[]): Phase37SafetyCheck[] {
  return checks.filter((check) => check.required && !check.passed);
}

export function getPhase37PendingRollbackPlans(plans: Phase37RollbackPlan[]): Phase37RollbackPlan[] {
  return plans.filter((plan) => !plan.ready);
}

export function getPhase37AverageAutonomyReadiness(items: Phase37AutonomyReadiness[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / items.length);
}