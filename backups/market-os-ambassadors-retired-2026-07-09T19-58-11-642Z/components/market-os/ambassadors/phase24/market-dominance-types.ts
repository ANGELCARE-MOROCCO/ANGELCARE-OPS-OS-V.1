export type MarketSignalPriority = "low" | "medium" | "high" | "critical";

export type RegionalMarketSignal = {
  id: string;
  city: string;
  demandScore: number;
  growthMomentum: number;
  saturationRisk: number;
  ambassadorInfluenceScore: number;
  recommendedMove: string;
};

export type CompetitiveSignal = {
  id: string;
  competitorName: string;
  city: string;
  activityType: "pricing" | "campaign" | "hiring" | "partnership" | "social" | "service_launch";
  threatLevel: MarketSignalPriority;
  summary: string;
  counterMove: string;
};

export type MarketOpportunity = {
  id: string;
  title: string;
  city: string;
  category: "academy" | "healthcare" | "home_support" | "partnership" | "ambassador_recruitment";
  priority: MarketSignalPriority;
  expectedImpactMad: number;
  timing: "now" | "short_term" | "medium_term" | "long_term";
  actionPlan: string;
};

export type SentimentSignal = {
  id: string;
  topic: string;
  channel: "social" | "whatsapp" | "reviews" | "community" | "partners";
  sentimentScore: number;
  trend: "improving" | "stable" | "declining";
  insight: string;
};

export type ExecutiveMarketBriefing = {
  id: string;
  title: string;
  urgency: MarketSignalPriority;
  summary: string;
  strategicDecision: string;
};

export type MarketDominanceSnapshot = {
  regions: RegionalMarketSignal[];
  competitors: CompetitiveSignal[];
  opportunities: MarketOpportunity[];
  sentiment: SentimentSignal[];
  briefings: ExecutiveMarketBriefing[];
};
