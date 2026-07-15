import type { AgentDelegation, AgentGovernanceRule, MultiAgentSnapshot } from "./multi-agent-types";

export type MultiAgentMetrics = {
  activeAgents: number;
  reviewRequiredAgents: number;
  criticalDelegations: number;
  consensusRequired: number;
  humanApprovalsRequired: number;
  autoBlockedRules: number;
  averageConfidence: number;
  agentReadinessScore: number;
};

export function getCriticalDelegations(delegations: AgentDelegation[]): AgentDelegation[] {
  return delegations
    .filter((item) => item.priority === "critical" || item.priority === "high")
    .sort((a, b) => b.expectedImpactMad - a.expectedImpactMad);
}

export function getAutoBlockedRules(rules: AgentGovernanceRule[]): AgentGovernanceRule[] {
  return rules.filter((rule) => rule.autoBlock);
}

export function getMultiAgentMetrics(snapshot: MultiAgentSnapshot): MultiAgentMetrics {
  const activeAgents = snapshot.agents.filter((agent) => agent.status === "active").length;
  const reviewRequiredAgents = snapshot.agents.filter((agent) => agent.status === "review_required").length;
  const criticalDelegations = getCriticalDelegations(snapshot.delegations).length;
  const consensusRequired = snapshot.delegations.filter((item) => item.status === "consensus_required").length;
  const humanApprovalsRequired =
    snapshot.consensus.filter((item) => item.requiresHumanApproval).length +
    snapshot.agents.filter((agent) => agent.humanOverrideRequired).length;
  const autoBlockedRules = getAutoBlockedRules(snapshot.governance).length;

  const averageConfidence =
    snapshot.agents.length === 0
      ? 0
      : Math.round(snapshot.agents.reduce((sum, agent) => sum + agent.confidenceScore, 0) / snapshot.agents.length);

  const agentReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        averageConfidence +
        activeAgents * 3 -
        reviewRequiredAgents * 6 -
        consensusRequired * 4 -
        autoBlockedRules * 5
      )
    )
  );

  return {
    activeAgents,
    reviewRequiredAgents,
    criticalDelegations,
    consensusRequired,
    humanApprovalsRequired,
    autoBlockedRules,
    averageConfidence,
    agentReadinessScore
  };
}
