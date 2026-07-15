import type { AmbassadorAISnapshot, AmbassadorExpansionSignal, AmbassadorRiskSignal } from "./ambassador-ai-types";

export type AmbassadorAIMetrics = {
  recommendationCount: number;
  criticalRecommendations: number;
  expansionOpportunities: number;
  activeRisks: number;
  averageAIConfidence: number;
  strategicReadinessScore: number;
};

export function calculateAverageConfidence(snapshot: AmbassadorAISnapshot): number {
  const values = [
    ...snapshot.recommendations.map((item) => item.aiConfidence),
    ...snapshot.risks.map((item) => item.aiConfidence)
  ];

  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}

export function getCriticalRisks(risks: AmbassadorRiskSignal[]) {
  return risks.filter((risk) => risk.severity === "critical" || risk.severity === "high");
}

export function getExpansionPriority(signals: AmbassadorExpansionSignal[]) {
  return signals.sort((a, b) => b.expansionScore - a.expansionScore);
}

export function getAmbassadorAIMetrics(snapshot: AmbassadorAISnapshot): AmbassadorAIMetrics {
  const recommendationCount = snapshot.recommendations.length;
  const criticalRecommendations = snapshot.recommendations.filter((item) => item.priority === "critical").length;
  const expansionOpportunities = snapshot.expansionSignals.filter((item) => item.expansionScore >= 70).length;
  const activeRisks = getCriticalRisks(snapshot.risks).length;
  const averageAIConfidence = calculateAverageConfidence(snapshot);

  const strategicReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        averageAIConfidence +
        expansionOpportunities * 4 -
        activeRisks * 6 +
        criticalRecommendations * 3
      )
    )
  );

  return {
    recommendationCount,
    criticalRecommendations,
    expansionOpportunities,
    activeRisks,
    averageAIConfidence,
    strategicReadinessScore
  };
}
