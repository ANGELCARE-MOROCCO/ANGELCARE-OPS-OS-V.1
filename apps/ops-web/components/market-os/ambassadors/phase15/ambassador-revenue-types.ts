export type RevenueChannel = "instagram" | "tiktok" | "whatsapp" | "referral" | "event" | "academy" | "partner" | "direct";
export type PerformanceStatus = "excellent" | "healthy" | "watch" | "critical";

export type AmbassadorRevenueAttribution = {
  id: string;
  ambassadorName: string;
  city: string;
  campaign: string;
  channel: RevenueChannel;
  leads: number;
  qualifiedLeads: number;
  conversions: number;
  revenueMad: number;
  payoutMad: number;
  confidenceScore: number;
  status: "clean" | "needs_review" | "conflict" | "missing";
};

export type AmbassadorPerformanceRank = {
  id: string;
  ambassadorName: string;
  city: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "elite";
  revenueMad: number;
  conversions: number;
  roiScore: number;
  rewardToRevenueRatio: number;
  performanceStatus: PerformanceStatus;
  nextBestAction: string;
};

export type AmbassadorPayoutForecast = {
  id: string;
  period: string;
  expectedPayoutMad: number;
  approvedPayoutMad: number;
  pendingPayoutMad: number;
  blockedPayoutMad: number;
  financeRisk: "low" | "medium" | "high" | "critical";
  note: string;
};

export type AmbassadorIntervention = {
  id: string;
  ambassadorName: string;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
  owner: string;
  expectedRecoveryMad: number;
  dueDate: string;
  status: "todo" | "doing" | "blocked" | "done";
};

export type AmbassadorRevenueSnapshot = {
  attribution: AmbassadorRevenueAttribution[];
  rankings: AmbassadorPerformanceRank[];
  payoutForecasts: AmbassadorPayoutForecast[];
  interventions: AmbassadorIntervention[];
};
