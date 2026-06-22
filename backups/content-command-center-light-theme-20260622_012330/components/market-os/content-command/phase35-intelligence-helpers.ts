import type {
  Phase35CampaignForecast,
  Phase35ExecutiveDigestItem,
  Phase35ExecutiveInsight,
  Phase35IntelligenceScore,
  Phase35OperationalAnomaly,
  Phase35WorkloadForecast,
} from './phase35-intelligence-types';

export function getPhase35CriticalInsights(insights: Phase35ExecutiveInsight[]): Phase35ExecutiveInsight[] {
  return insights.filter((insight) => insight.severity === 'critical' || insight.severity === 'high');
}

export function getPhase35CampaignsAtRisk(forecasts: Phase35CampaignForecast[]): Phase35CampaignForecast[] {
  return forecasts.filter((forecast) => forecast.deliveryProbability < 70 || forecast.riskLevel === 'high' || forecast.riskLevel === 'critical');
}

export function getPhase35HighPressureTeams(forecasts: Phase35WorkloadForecast[]): Phase35WorkloadForecast[] {
  return forecasts.filter((forecast) => forecast.pressureScore >= 85);
}

export function getPhase35HighSeverityAnomalies(anomalies: Phase35OperationalAnomaly[]): Phase35OperationalAnomaly[] {
  return anomalies.filter((anomaly) => anomaly.severity === 'high' || anomaly.severity === 'critical');
}

export function getPhase35DecisionDigestItems(items: Phase35ExecutiveDigestItem[]): Phase35ExecutiveDigestItem[] {
  return items.filter((item) => item.decisionRequired);
}

export function getPhase35AverageIntelligenceScore(scores: Phase35IntelligenceScore[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / scores.length);
}