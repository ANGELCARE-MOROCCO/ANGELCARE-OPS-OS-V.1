import type { AmbassadorPerformanceRank, AmbassadorRevenueAttribution, AmbassadorRevenueSnapshot } from './ambassador-revenue-types';

export type AmbassadorRevenueMetrics = {
  totalRevenueMad: number;
  totalPayoutMad: number;
  totalLeads: number;
  totalQualifiedLeads: number;
  totalConversions: number;
  conversionRate: number;
  qualificationRate: number;
  rewardToRevenueRatio: number;
  cleanAttributionRate: number;
  criticalPerformers: number;
  revenueReadinessScore: number;
};

export function calculateRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getCriticalPerformers(rankings: AmbassadorPerformanceRank[]): AmbassadorPerformanceRank[] {
  return rankings.filter((rank) => rank.performanceStatus === 'critical').sort((a, b) => a.roiScore - b.roiScore);
}

export function getAttributionRisks(records: AmbassadorRevenueAttribution[]): AmbassadorRevenueAttribution[] {
  return records.filter((record) => record.status !== 'clean' || record.confidenceScore < 70).sort((a, b) => a.confidenceScore - b.confidenceScore);
}

export function getAmbassadorRevenueMetrics(snapshot: AmbassadorRevenueSnapshot): AmbassadorRevenueMetrics {
  const totalRevenueMad = snapshot.attribution.reduce((sum, item) => sum + item.revenueMad, 0);
  const totalPayoutMad = snapshot.attribution.reduce((sum, item) => sum + item.payoutMad, 0);
  const totalLeads = snapshot.attribution.reduce((sum, item) => sum + item.leads, 0);
  const totalQualifiedLeads = snapshot.attribution.reduce((sum, item) => sum + item.qualifiedLeads, 0);
  const totalConversions = snapshot.attribution.reduce((sum, item) => sum + item.conversions, 0);
  const conversionRate = calculateRate(totalConversions, totalLeads);
  const qualificationRate = calculateRate(totalQualifiedLeads, totalLeads);
  const rewardToRevenueRatio = calculateRate(totalPayoutMad, Math.max(totalRevenueMad, 1));
  const cleanAttributionRate = calculateRate(snapshot.attribution.filter((item) => item.status === 'clean').length, snapshot.attribution.length);
  const criticalPerformers = getCriticalPerformers(snapshot.rankings).length;
  const riskPenalty = getAttributionRisks(snapshot.attribution).length * 6 + criticalPerformers * 8;
  const revenueReadinessScore = Math.max(0, Math.min(100, Math.round((conversionRate + qualificationRate + cleanAttributionRate) / 2 - riskPenalty + 35)));

  return { totalRevenueMad, totalPayoutMad, totalLeads, totalQualifiedLeads, totalConversions, conversionRate, qualificationRate, rewardToRevenueRatio, cleanAttributionRate, criticalPerformers, revenueReadinessScore };
}
