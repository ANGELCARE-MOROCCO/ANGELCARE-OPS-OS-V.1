export type AgentStatus = "active" | "paused" | "review_required" | "blocked";
export type AgentPriority = "low" | "medium" | "high" | "critical";

export type AmbassadorAIAgent = {
  id: string;
  name: string;
  role:
    | "growth_strategist"
    | "campaign_optimizer"
    | "ambassador_success"
    | "territory_expansion"
    | "compliance_governance"
    | "revenue_intelligence"
    | "recruitment_intelligence"
    | "operational_recovery"
    | "escalation_manager";
  status: AgentStatus;
  owner: string;
  confidenceScore: number;
  currentObjective: string;
  humanOverrideRequired: boolean;
};

export type AgentDelegation = {
  id: string;
  objective: string;
  leadAgent: string;
  supportingAgents: string[];
  priority: AgentPriority;
  status: "queued" | "running" | "consensus_required" | "approved" | "blocked" | "completed";
  expectedImpactMad: number;
};

export type AgentConsensusItem = {
  id: string;
  topic: string;
  agentsInvolved: string[];
  consensusScore: number;
  decision: string;
  requiresHumanApproval: boolean;
  riskReason?: string;
};

export type AgentAuditEvent = {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  confidenceScore: number;
  explainability: string;
  humanOverrideAvailable: boolean;
};

export type AgentGovernanceRule = {
  id: string;
  title: string;
  area: "finance" | "compliance" | "brand" | "data" | "operations";
  severity: AgentPriority;
  rule: string;
  autoBlock: boolean;
};

export type MultiAgentSnapshot = {
  agents: AmbassadorAIAgent[];
  delegations: AgentDelegation[];
  consensus: AgentConsensusItem[];
  audits: AgentAuditEvent[];
  governance: AgentGovernanceRule[];
};
