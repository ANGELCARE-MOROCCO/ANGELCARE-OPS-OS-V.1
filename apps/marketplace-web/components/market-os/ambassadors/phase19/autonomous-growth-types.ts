export type OptimizationPriority = "low" | "medium" | "high" | "critical";
export type OptimizationStatus = "queued" | "running" | "recommended" | "approved" | "blocked" | "completed";

export type AutonomousOptimizationLoop = {
  id: string;
  title: string;
  domain:
    | "campaign"
    | "mission_assignment"
    | "territory_balance"
    | "reward_rules"
    | "recruitment"
    | "conversion"
    | "compliance"
    | "training";
  priority: OptimizationPriority;
  status: OptimizationStatus;
  owner: string;
  confidenceScore: number;
  expectedImpactMad: number;
  recommendation: string;
};

export type AutonomousMissionRedistribution = {
  id: string;
  campaignName: string;
  sourceSegment: string;
  targetSegment: string;
  reason: string;
  movedMissions: number;
  expectedConversionLift: number;
  status: OptimizationStatus;
};

export type PredictiveRecruitmentTrigger = {
  id: string;
  city: string;
  triggerReason: string;
  requiredAmbassadors: number;
  suggestedSource: "academy" | "partners" | "social" | "campus" | "referral" | "community";
  urgency: OptimizationPriority;
  expectedRevenueCapacityMad: number;
};

export type GrowthSimulationScenario = {
  id: string;
  title: string;
  scenarioType: "conservative" | "balanced" | "aggressive";
  targetCity: string;
  requiredAmbassadors: number;
  expectedLeads: number;
  expectedConversions: number;
  expectedRevenueMad: number;
  riskScore: number;
};

export type AutonomousGovernanceItem = {
  id: string;
  title: string;
  riskArea: "finance" | "brand" | "compliance" | "data_quality" | "workload";
  severity: OptimizationPriority;
  autoBlocked: boolean;
  requiredHumanApproval: boolean;
  mitigation: string;
};

export type AutonomousGrowthSnapshot = {
  optimizationLoops: AutonomousOptimizationLoop[];
  redistributions: AutonomousMissionRedistribution[];
  recruitmentTriggers: PredictiveRecruitmentTrigger[];
  simulations: GrowthSimulationScenario[];
  governance: AutonomousGovernanceItem[];
};
