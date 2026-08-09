export type GovernancePriority = "low" | "medium" | "high" | "critical";

export type OperatingModelPillar = {
  id: string;
  title: string;
  owner: string;
  maturityScore: number;
  description: string;
  requiredRhythm: string;
};

export type GovernanceApprovalGate = {
  id: string;
  gate: string;
  domain: "finance" | "compliance" | "ai" | "campaign" | "recruitment" | "data";
  priority: GovernancePriority;
  requiredApprover: string;
  autoExecutionAllowed: boolean;
  rule: string;
};

export type ExecutionRhythm = {
  id: string;
  cadence: "daily" | "weekly" | "monthly" | "quarterly";
  ritual: string;
  owner: string;
  expectedOutput: string;
};

export type OperatingRiskControl = {
  id: string;
  risk: string;
  severity: GovernancePriority;
  control: string;
  escalationOwner: string;
};

export type FinalOperatingModelSnapshot = {
  pillars: OperatingModelPillar[];
  approvalGates: GovernanceApprovalGate[];
  rhythms: ExecutionRhythm[];
  controls: OperatingRiskControl[];
};
