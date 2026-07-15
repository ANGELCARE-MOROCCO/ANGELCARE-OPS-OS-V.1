import type { MarketDominanceSnapshot, MarketOpportunity, RegionalMarketSignal } from "./market-dominance-types";

export type MarketDominanceMetrics = {
  strongestCity: string;
  criticalOpportunities: number;
  criticalThreats: number;
  averageDemandScore: number;
  averageSentimentScore: number;
  expectedOpportunityMad: number;
  dominanceReadinessScore: number;
};

export function getTopRegions(regions: RegionalMarketSignal[]): RegionalMarketSignal[] {
  return [...regions].sort((a, b) => {
    const scoreA = a.demandScore + a.growthMomentum + a.ambassadorInfluenceScore - a.saturationRisk;
    const scoreB = b.demandScore + b.growthMomentum + b.ambassadorInfluenceScore - b.saturationRisk;
    return scoreB - scoreA;
  });
}

export function getCriticalOpportunities(opportunities: MarketOpportunity[]): MarketOpportunity[] {
  return opportunities
    .filter((item) => item.priority === "critical" || item.priority === "high")
    .sort((a, b) => b.expectedImpactMad - a.expectedImpactMad);
}

export function getMarketDominanceMetrics(snapshot: MarketDominanceSnapshot): MarketDominanceMetrics {
  const topRegions = getTopRegions(snapshot.regions);
  const strongestCity = topRegions[0]?.city ?? "Unknown";
  const criticalOpportunities = snapshot.opportunities.filter((item) => item.priority === "critical").length;
  const criticalThreats = snapshot.competitors.filter((item) => item.threatLevel === "critical").length;
  const averageDemandScore =
    snapshot.regions.length === 0 ? 0 : Math.round(snapshot.regions.reduce((sum, item) => sum + item.demandScore, 0) / snapshot.regions.length);
  const averageSentimentScore =
    snapshot.sentiment.length === 0 ? 0 : Math.round(snapshot.sentiment.reduce((sum, item) => sum + item.sentimentScore, 0) / snapshot.sentiment.length);
  const expectedOpportunityMad = snapshot.opportunities.reduce((sum, item) => sum + item.expectedImpactMad, 0);

  const dominanceReadinessScore = Math.max(
    0,
    Math.min(100, Math.round((averageDemandScore + averageSentimentScore) / 2 + criticalOpportunities * 4 - criticalThreats * 8))
  );

  return {
    strongestCity,
    criticalOpportunities,
    criticalThreats,
    averageDemandScore,
    averageSentimentScore,
    expectedOpportunityMad,
    dominanceReadinessScore
  };
}
