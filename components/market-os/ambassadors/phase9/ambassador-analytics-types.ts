export type AmbassadorAnalyticsSegment =
  | "all"
  | "city"
  | "program"
  | "tier"
  | "campaign"
  | "manager"
  | "risk";

export type AmbassadorKpiTrend = "up" | "down" | "flat";

export type AmbassadorAttributionChannel =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "whatsapp"
  | "referral"
  | "event"
  | "academy"
  | "partner"
  | "unknown";

export type AmbassadorPerformanceKpi = {
  id: string;
  label: string;
  value: number;
  unit: "count" | "percent" | "mad" | "score";
  trend: AmbassadorKpiTrend;
  delta: number;
  owner: string;
};

export type AmbassadorCampaignAnalytics = {
  id: string;
  campaignName: string;
  city: string;
  assignedAmbassadors: number;
  activeAmbassadors: number;
  proofsSubmitted: number;
  proofsApproved: number;
  generatedLeads: number;
  convertedLeads: number;
  revenueMad: number;
  roiScore: number;
  bottleneck: string;
};

export type AmbassadorAttributionRecord = {
  id: string;
  ambassadorName: string;
  channel: AmbassadorAttributionChannel;
  city: string;
  campaignName: string;
  leads: number;
  conversions: number;
  revenueMad: number;
  confidenceScore: number;
  attributionStatus: "clean" | "needs_review" | "conflict" | "missing";
};

export type AmbassadorRetentionRisk = {
  id: string;
  ambassadorName: string;
  city: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "elite";
  riskScore: number;
  riskReason: string;
  recommendedAction: string;
  owner: string;
};

export type AmbassadorRegionalExpansionScore = {
  city: string;
  currentAmbassadors: number;
  targetAmbassadors: number;
  leadDemandScore: number;
  recruitmentPriority: "low" | "medium" | "high" | "critical";
  suggestedAction: string;
};

export type AmbassadorOrchestrationAction = {
  id: string;
  title: string;
  category: "campaign" | "revenue" | "retention" | "recruitment" | "compliance" | "training";
  owner: string;
  priority: "low" | "medium" | "high" | "critical";
  expectedImpactMad: number;
  dueDate: string;
  status: "todo" | "doing" | "blocked" | "done";
};

export type AmbassadorAnalyticsSnapshot = {
  kpis: AmbassadorPerformanceKpi[];
  campaigns: AmbassadorCampaignAnalytics[];
  attribution: AmbassadorAttributionRecord[];
  retentionRisks: AmbassadorRetentionRisk[];
  regionalExpansion: AmbassadorRegionalExpansionScore[];
  orchestrationActions: AmbassadorOrchestrationAction[];
};
