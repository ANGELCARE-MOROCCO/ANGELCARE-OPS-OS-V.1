export type Phase35InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Phase35ForecastDirection = 'improving' | 'stable' | 'declining' | 'volatile';

export interface Phase35ExecutiveInsight {
  id: string;
  title: string;
  area: 'campaign' | 'publishing' | 'workload' | 'approval' | 'brand' | 'ai' | 'analytics';
  severity: Phase35InsightSeverity;
  confidence: number;
  summary: string;
  recommendation: string;
}

export interface Phase35CampaignForecast {
  id: string;
  campaign: string;
  deliveryProbability: number;
  riskLevel: Phase35InsightSeverity;
  forecastDirection: Phase35ForecastDirection;
  predictedBlocker: string;
  recommendedMove: string;
}

export interface Phase35WorkloadForecast {
  id: string;
  team: string;
  pressureScore: number;
  forecastDirection: Phase35ForecastDirection;
  predictedRisk: string;
  recommendedAction: string;
}

export interface Phase35OperationalAnomaly {
  id: string;
  title: string;
  detectedIn: string;
  severity: Phase35InsightSeverity;
  signal: string;
  response: string;
}

export interface Phase35ExecutiveDigestItem {
  id: string;
  headline: string;
  priority: Phase35InsightSeverity;
  decisionRequired: boolean;
  owner: string;
}

export interface Phase35IntelligenceScore {
  label: string;
  score: number;
  direction: Phase35ForecastDirection;
  note: string;
}