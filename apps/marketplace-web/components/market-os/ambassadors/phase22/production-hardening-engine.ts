import type { HardeningStatus, ProductionHardeningSnapshot } from "./production-hardening-types";

export type ProductionHardeningMetrics = {
  passedDiagnostics: number;
  warnings: number;
  failed: number;
  pending: number;
  availableRoutes: number;
  releaseBlockers: number;
  productionReadinessScore: number;
};

function countStatus<T extends { status: HardeningStatus }>(items: T[], status: HardeningStatus): number {
  return items.filter((item) => item.status === status).length;
}

export function getProductionHardeningMetrics(snapshot: ProductionHardeningSnapshot): ProductionHardeningMetrics {
  const allStatusItems = [...snapshot.diagnostics, ...snapshot.buildChecks, ...snapshot.releaseGates];
  const passedDiagnostics = countStatus(snapshot.diagnostics, "passed");
  const warnings = countStatus(allStatusItems, "warning");
  const failed = countStatus(allStatusItems, "failed");
  const pending = countStatus(allStatusItems, "pending");
  const availableRoutes = snapshot.routes.filter((route) => route.status === "available").length;
  const releaseBlockers = snapshot.releaseGates.filter((gate) => gate.blocker && gate.status !== "passed").length;

  const productionReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        passedDiagnostics * 12 +
        availableRoutes * 4 -
        warnings * 5 -
        failed * 14 -
        pending * 3 -
        releaseBlockers * 8 +
        55
      )
    )
  );

  return {
    passedDiagnostics,
    warnings,
    failed,
    pending,
    availableRoutes,
    releaseBlockers,
    productionReadinessScore
  };
}
