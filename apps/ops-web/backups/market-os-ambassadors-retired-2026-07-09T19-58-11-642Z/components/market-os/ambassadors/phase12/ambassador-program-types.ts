export type AmbassadorProgramStatus = "draft" | "active" | "paused" | "archived";

export type AmbassadorProgramType =
  | "student"
  | "influencer"
  | "healthcare"
  | "academy"
  | "regional"
  | "partner"
  | "vip"
  | "referral";

export type AmbassadorTierCode = "bronze" | "silver" | "gold" | "platinum" | "elite" | "regional_leader";

export type AmbassadorRewardRuleType =
  | "fixed_bonus"
  | "commission"
  | "points"
  | "gift"
  | "training_access"
  | "certification"
  | "recognition";

export type AmbassadorEligibilityRule = {
  id: string;
  label: string;
  metric:
    | "health_score"
    | "proof_approval_rate"
    | "monthly_leads"
    | "monthly_revenue_mad"
    | "training_score"
    | "compliance_cases"
    | "campaign_participation";
  operator: "gte" | "lte" | "eq";
  value: number;
  required: boolean;
};

export type AmbassadorTierRule = {
  tier: AmbassadorTierCode;
  label: string;
  minHealthScore: number;
  minApprovedProofs: number;
  minRevenueMad: number;
  commissionRate: number;
  monthlyBonusMad: number;
  permissions: string[];
};

export type AmbassadorRewardRule = {
  id: string;
  name: string;
  type: AmbassadorRewardRuleType;
  trigger:
    | "mission_completed"
    | "proof_approved"
    | "lead_converted"
    | "revenue_threshold"
    | "tier_upgrade"
    | "training_completed"
    | "compliance_clean_month";
  amountMad?: number;
  points?: number;
  commissionRate?: number;
  status: "active" | "draft" | "paused";
  financeApprovalRequired: boolean;
};

export type AmbassadorProgramPolicy = {
  id: string;
  name: string;
  description: string;
  proofRequired: boolean;
  maxMissionsPerWeek: number;
  minimumTrainingLevel: AmbassadorTierCode;
  payoutCycle: "weekly" | "biweekly" | "monthly";
  complianceReviewRequired: boolean;
  managerApprovalRequired: boolean;
};

export type AmbassadorProgram = {
  id: string;
  name: string;
  type: AmbassadorProgramType;
  status: AmbassadorProgramStatus;
  owner: string;
  cityScope: string[];
  activeAmbassadors: number;
  targetAmbassadors: number;
  eligibilityRules: AmbassadorEligibilityRule[];
  tierRules: AmbassadorTierRule[];
  rewardRules: AmbassadorRewardRule[];
  policies: AmbassadorProgramPolicy[];
};

export type AmbassadorProgramGovernanceItem = {
  id: string;
  title: string;
  area: "eligibility" | "tier" | "reward" | "policy" | "finance" | "compliance";
  severity: "low" | "medium" | "high" | "critical";
  owner: string;
  status: "open" | "reviewing" | "resolved";
  recommendation: string;
};

export type AmbassadorProgramSnapshot = {
  programs: AmbassadorProgram[];
  governance: AmbassadorProgramGovernanceItem[];
};
