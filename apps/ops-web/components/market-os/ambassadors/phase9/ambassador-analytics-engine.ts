import type {
  AmbassadorAnalyticsSnapshot,
  AmbassadorAttributionRecord,
  AmbassadorCampaignAnalytics,
  AmbassadorOrchestrationAction,
  AmbassadorRetentionRisk,
} from "./ambassador-analytics-types";

export type AmbassadorAnalyticsExecutiveSummary = {
  totalRevenueMad: number;
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  averageRoiScore: number;
  cleanAttributionRate: number;
  criticalActions: number;
  highRetentionRiskCount: number;
  analyticsReadinessScore: number;
};

export function calculateConversionRate(leads: number, conversions: number): number {
  if (leads <= 0) return 0;
  return Math.round((conversions / leads) * 100);
}

export function sumCampaignRevenue(campaigns: AmbassadorCampaignAnalytics[]): number {
  return campaigns.reduce((sum, campaign) => sum + campaign.revenueMad, 0);
}

export function sumCampaignLeads(campaigns: AmbassadorCampaignAnalytics[]): number {
  return campaigns.reduce((sum, campaign) => sum + campaign.generatedLeads, 0);
}

export function sumCampaignConversions(campaigns: AmbassadorCampaignAnalytics[]): number {
  return campaigns.reduce((sum, campaign) => sum + campaign.convertedLeads, 0);
}

export function calculateAverageRoiScore(campaigns: AmbassadorCampaignAnalytics[]): number {
  if (campaigns.length === 0) return 0;
  const total = campaigns.reduce((sum, campaign) => sum + campaign.roiScore, 0);
  return Math.round(total / campaigns.length);
}

export function calculateCleanAttributionRate(records: AmbassadorAttributionRecord[]): number {
  if (records.length === 0) return 0;
  const clean = records.filter((record) => record.attributionStatus === "clean").length;
  return Math.round((clean / records.length) * 100);
}

export function getHighRetentionRisks(risks: AmbassadorRetentionRisk[]): AmbassadorRetentionRisk[] {
  return risks.filter((risk) => risk.riskScore >= 70).sort((a, b) => b.riskScore - a.riskScore);
}

export function getCriticalActions(actions: AmbassadorOrchestrationAction[]): AmbassadorOrchestrationAction[] {
  return actions
    .filter((action) => action.priority === "critical" && action.status !== "done")
    .sort((a, b) => b.expectedImpactMad - a.expectedImpactMad);
}

export function calculateAnalyticsReadinessScore(snapshot: AmbassadorAnalyticsSnapshot): number {
  const roi = calculateAverageRoiScore(snapshot.campaigns);
  const attribution = calculateCleanAttributionRate(snapshot.attribution);
  const criticalPenalty = getCriticalActions(snapshot.orchestrationActions).length * 5;
  const retentionPenalty = getHighRetentionRisks(snapshot.retentionRisks).length * 4;
  const bottleneckPenalty = snapshot.campaigns.filter((campaign) => campaign.roiScore < 70).length * 6;

  return Math.max(0, Math.min(100, Math.round((roi + attribution) / 2 - criticalPenalty - retentionPenalty - bottleneckPenalty + 15)));
}

export function getAmbassadorAnalyticsExecutiveSummary(
  snapshot: AmbassadorAnalyticsSnapshot,
): AmbassadorAnalyticsExecutiveSummary {
  const totalRevenueMad = sumCampaignRevenue(snapshot.campaigns);
  const totalLeads = sumCampaignLeads(snapshot.campaigns);
  const totalConversions = sumCampaignConversions(snapshot.campaigns);
  const conversionRate = calculateConversionRate(totalLeads, totalConversions);
  const averageRoiScore = calculateAverageRoiScore(snapshot.campaigns);
  const cleanAttributionRate = calculateCleanAttributionRate(snapshot.attribution);
  const criticalActions = getCriticalActions(snapshot.orchestrationActions).length;
  const highRetentionRiskCount = getHighRetentionRisks(snapshot.retentionRisks).length;
  const analyticsReadinessScore = calculateAnalyticsReadinessScore(snapshot);

  return {
    totalRevenueMad,
    totalLeads,
    totalConversions,
    conversionRate,
    averageRoiScore,
    cleanAttributionRate,
    criticalActions,
    highRetentionRiskCount,
    analyticsReadinessScore,
  };
}
