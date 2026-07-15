import type { FinalStabilizationSnapshot } from './final-stabilization-types';

export type FinalStabilizationMetrics = {
  totalChecks: number;
  criticalChecks: number;
  warnings: number;
  pending: number;
  sidebarRoutes: number;
  stabilizationScore: number;
};

export function getFinalStabilizationMetrics(snapshot: FinalStabilizationSnapshot): FinalStabilizationMetrics {
  const totalChecks = snapshot.checks.length;
  const criticalChecks = snapshot.checks.filter((item) => item.priority === 'critical').length;
  const warnings = snapshot.checks.filter((item) => item.status === 'warning').length;
  const pending = snapshot.checks.filter((item) => item.status === 'pending').length;
  const sidebarRoutes = snapshot.routes.filter((item) => item.shouldExposeInSidebar).length;

  const stabilizationScore = Math.max(
    0,
    Math.min(100, Math.round(84 - warnings * 6 - pending * 3 + sidebarRoutes))
  );

  return {
    totalChecks,
    criticalChecks,
    warnings,
    pending,
    sidebarRoutes,
    stabilizationScore
  };
}
