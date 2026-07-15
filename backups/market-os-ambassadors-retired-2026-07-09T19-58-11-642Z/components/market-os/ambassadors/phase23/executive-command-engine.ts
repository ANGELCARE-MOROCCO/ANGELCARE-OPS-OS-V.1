import type { ExecutiveCommandSnapshot } from "./executive-command-types";

export type ExecutiveCommandMetrics = {
  activeInitiatives: number;
  criticalRisks: number;
  projectedAnnualRevenueMad: number;
  projectedExpansionCities: number;
  averageForecastConfidence: number;
  executiveReadinessScore: number;
};

export function getExecutiveCommandMetrics(snapshot: ExecutiveCommandSnapshot): ExecutiveCommandMetrics {
  const activeInitiatives = snapshot.initiatives.filter((item) => item.status === "active").length;
  const criticalRisks = snapshot.risks.filter((item) => item.severity === "critical").length;

  const annualForecast =
    snapshot.forecasts.find((item) => item.horizon === "1y");

  const projectedAnnualRevenueMad = annualForecast?.projectedRevenueMad ?? 0;
  const projectedExpansionCities = annualForecast?.projectedExpansionCities ?? 0;

  const averageForecastConfidence =
    snapshot.forecasts.length === 0
      ? 0
      : Math.round(
          snapshot.forecasts.reduce((sum, item) => sum + item.confidenceScore, 0) /
            snapshot.forecasts.length
        );

  const executiveReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        activeInitiatives * 14 +
        averageForecastConfidence -
        criticalRisks * 8 +
        22
      )
    )
  );

  return {
    activeInitiatives,
    criticalRisks,
    projectedAnnualRevenueMad,
    projectedExpansionCities,
    averageForecastConfidence,
    executiveReadinessScore
  };
}
