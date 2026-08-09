import type {
  Phase23AuditCheck,
  Phase23FallbackState,
  Phase23ReadinessScore,
  Phase23SafetyGate,
} from './phase23-qa-types';

export function getFailedPhase23SafetyGates(gates: Phase23SafetyGate[]): Phase23SafetyGate[] {
  return gates.filter((gate) => !gate.passed);
}

export function getMissingPhase23Fallbacks(fallbacks: Phase23FallbackState[]): Phase23FallbackState[] {
  return fallbacks.filter((fallback) => !fallback.implemented);
}

export function getFailedPhase23AuditChecks(checks: Phase23AuditCheck[]): Phase23AuditCheck[] {
  return checks.filter((check) => !check.passed);
}

export function getPhase23OverallReadiness(scores: Phase23ReadinessScore[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / scores.length);
}