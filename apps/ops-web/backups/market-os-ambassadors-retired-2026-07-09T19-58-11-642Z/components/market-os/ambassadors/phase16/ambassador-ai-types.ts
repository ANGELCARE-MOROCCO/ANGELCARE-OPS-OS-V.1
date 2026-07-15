export type StrategicPriority = "low" | "medium" | "high" | "critical";

export type AmbassadorAIRecommendation = {
  id: string;
  title: string;
  category:
    | "assignment"
    | "expansion"
    | "campaign"
    | "retention"
    | "revenue"
    | "lead_quality"
    | "succession";
  priority: StrategicPriority;
  owner: string;
  city: string;
  aiConfidence: number;
  expectedImpactMad: number;
  recommendation: string;
};

export type AmbassadorExpansionSignal = {
  id: string;
  city: string;
  expansionScore: number;
  marketDemandScore: number;
  ambassadorCapacityScore: number;
  competitionRisk: number;
  recommendedAction: string;
};

export type AmbassadorRiskSignal = {
  id: string;
  ambassadorName: string;
  type: "fatigue" | "churn" | "quality_drop" | "compliance" | "conversion_decline";
  severity: StrategicPriority;
  aiConfidence: number;
  suggestedAction: string;
};

export type AmbassadorExecutiveBriefing = {
  id: string;
  title: string;
  generatedAt: string;
  summary: string;
  strategicFocus: string[];
};

export type AmbassadorAISnapshot = {
  recommendations: AmbassadorAIRecommendation[];
  expansionSignals: AmbassadorExpansionSignal[];
  risks: AmbassadorRiskSignal[];
  briefings: AmbassadorExecutiveBriefing[];
};
