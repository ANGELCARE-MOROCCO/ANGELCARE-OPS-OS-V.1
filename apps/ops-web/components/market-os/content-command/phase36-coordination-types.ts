export type Phase36RecommendationType =
  | 'prioritize_task'
  | 'redistribute_workload'
  | 'escalate_blocker'
  | 'sequence_campaign'
  | 'pause_publication'
  | 'request_decision'
  | 'run_quality_review';

export type Phase36CoordinationRisk = 'low' | 'medium' | 'high' | 'critical';

export type Phase36DecisionState = 'proposed' | 'reviewing' | 'accepted' | 'rejected';

export interface Phase36AutonomousRecommendation {
  id: string;
  title: string;
  type: Phase36RecommendationType;
  confidence: number;
  risk: Phase36CoordinationRisk;
  state: Phase36DecisionState;
  rationale: string;
  proposedAction: string;
}

export interface Phase36DecisionRoute {
  id: string;
  decision: string;
  routedTo: string;
  reason: string;
  urgency: Phase36CoordinationRisk;
  requiresHumanApproval: boolean;
}

export interface Phase36WorkloadRedistribution {
  id: string;
  fromOwner: string;
  toOwner: string;
  taskTitle: string;
  expectedImpact: string;
  risk: Phase36CoordinationRisk;
}

export interface Phase36ScenarioSimulation {
  id: string;
  scenario: string;
  predictedOutcome: string;
  confidence: number;
  recommendedMove: string;
}

export interface Phase36CoordinationConflict {
  id: string;
  conflict: string;
  affectedArea: string;
  severity: Phase36CoordinationRisk;
  resolutionProposal: string;
}

export interface Phase36ExecutiveBriefing {
  id: string;
  headline: string;
  summary: string;
  decisionNeeded: boolean;
  owner: string;
}