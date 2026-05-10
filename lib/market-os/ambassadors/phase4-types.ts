export type AmbassadorRiskLevel = "low" | "medium" | "high" | "critical";
export type AmbassadorOperationalStatus = "active" | "watchlist" | "inactive" | "paused";
export type CampaignAssignmentStatus = "draft" | "assigned" | "in_progress" | "submitted" | "approved" | "rejected";
export type ComplianceEscalationStatus = "open" | "reviewing" | "coaching" | "resolved";
export type PayoutRiskStatus = "clear" | "review" | "blocked";

export type AmbassadorHealthRecord = {
  id: string;
  ambassadorName: string;
  city: string;
  region: string;
  tier: "starter" | "certified" | "premium" | "elite";
  status: AmbassadorOperationalStatus;
  healthScore: number;
  engagementScore: number;
  executionScore: number;
  complianceScore: number;
  revenueMad: number;
  leadsGenerated: number;
  missionsCompleted: number;
  overdueMissions: number;
  lastActivity: string;
  riskLevel: AmbassadorRiskLevel;
  recommendedAction: string;
};

export type AmbassadorCampaignAssignment = {
  id: string;
  campaignName: string;
  ambassadorName: string;
  city: string;
  objective: string;
  status: CampaignAssignmentStatus;
  deadline: string;
  proofRequired: boolean;
  expectedRevenueMad: number;
  currentRevenueMad: number;
  owner: string;
};

export type AmbassadorRegionalSignal = {
  id: string;
  region: string;
  city: string;
  coverageScore: number;
  activeAmbassadors: number;
  openMissions: number;
  conversionRate: number;
  riskLevel: AmbassadorRiskLevel;
  opportunity: string;
};

export type AmbassadorComplianceEscalation = {
  id: string;
  ambassadorName: string;
  category: "brand" | "proof" | "conduct" | "late_delivery" | "payment";
  status: ComplianceEscalationStatus;
  severity: AmbassadorRiskLevel;
  owner: string;
  openedAt: string;
  resolutionPlan: string;
};

export type AmbassadorPayoutRisk = {
  id: string;
  ambassadorName: string;
  payoutMad: number;
  status: PayoutRiskStatus;
  reason: string;
  proofStatus: "missing" | "pending" | "validated" | "conflict";
  approver: string;
};

export type AmbassadorPhase4Snapshot = {
  generatedAt: string;
  healthRecords: AmbassadorHealthRecord[];
  campaignAssignments: AmbassadorCampaignAssignment[];
  regionalSignals: AmbassadorRegionalSignal[];
  complianceEscalations: AmbassadorComplianceEscalation[];
  payoutRisks: AmbassadorPayoutRisk[];
};
