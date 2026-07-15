export type ExecutivePriority = "low" | "medium" | "high" | "critical";

export type ExecutiveStrategicInitiative = {
  id: string;
  title: string;
  owner: string;
  status: "planning" | "active" | "blocked" | "completed";
  priority: ExecutivePriority;
  expectedImpactMad: number;
  strategicGoal: string;
};

export type EnterpriseRiskItem = {
  id: string;
  area: "finance" | "operations" | "compliance" | "growth" | "staffing";
  severity: ExecutivePriority;
  title: string;
  mitigation: string;
};

export type ExecutiveForecast = {
  id: string;
  horizon: "30d" | "90d" | "180d" | "1y";
  projectedRevenueMad: number;
  projectedExpansionCities: number;
  projectedAmbassadors: number;
  confidenceScore: number;
};

export type ExecutiveBriefing = {
  id: string;
  title: string;
  summary: string;
  urgency: ExecutivePriority;
  source: string;
};

export type ExecutiveCommandSnapshot = {
  initiatives: ExecutiveStrategicInitiative[];
  risks: EnterpriseRiskItem[];
  forecasts: ExecutiveForecast[];
  briefings: ExecutiveBriefing[];
};
