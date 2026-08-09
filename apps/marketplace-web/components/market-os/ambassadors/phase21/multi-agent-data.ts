import type { MultiAgentSnapshot } from "./multi-agent-types";

export const multiAgentSnapshot: MultiAgentSnapshot = {
  agents: [
    {
      id: "agent-growth",
      name: "Growth Strategist Agent",
      role: "growth_strategist",
      status: "active",
      owner: "CEO",
      confidenceScore: 94,
      currentObjective: "Maximize ambassador-led revenue expansion across Casablanca, Rabat, and Agadir.",
      humanOverrideRequired: true
    },
    {
      id: "agent-campaign",
      name: "Campaign Optimization Agent",
      role: "campaign_optimizer",
      status: "active",
      owner: "Marketing Director",
      confidenceScore: 91,
      currentObjective: "Redistribute missions toward high-conversion ambassadors.",
      humanOverrideRequired: false
    },
    {
      id: "agent-compliance",
      name: "Compliance Governance Agent",
      role: "compliance_governance",
      status: "review_required",
      owner: "Compliance Manager",
      confidenceScore: 88,
      currentObjective: "Block unsafe claims and route coaching workflows.",
      humanOverrideRequired: true
    },
    {
      id: "agent-revenue",
      name: "Revenue Intelligence Agent",
      role: "revenue_intelligence",
      status: "active",
      owner: "Revenue Command",
      confidenceScore: 93,
      currentObjective: "Detect attribution anomalies and optimize payout-to-revenue ratio.",
      humanOverrideRequired: true
    },
    {
      id: "agent-recruitment",
      name: "Recruitment Intelligence Agent",
      role: "recruitment_intelligence",
      status: "active",
      owner: "Academy Growth Manager",
      confidenceScore: 86,
      currentObjective: "Trigger recruitment sprints in under-covered cities.",
      humanOverrideRequired: false
    }
  ],
  delegations: [
    {
      id: "delegation-001",
      objective: "Launch Agadir ambassador expansion sprint",
      leadAgent: "Growth Strategist Agent",
      supportingAgents: ["Recruitment Intelligence Agent", "Territory Expansion Agent", "Revenue Intelligence Agent"],
      priority: "critical",
      status: "consensus_required",
      expectedImpactMad: 148000
    },
    {
      id: "delegation-002",
      objective: "Correct Marrakech reward inefficiency",
      leadAgent: "Revenue Intelligence Agent",
      supportingAgents: ["Compliance Governance Agent", "Campaign Optimization Agent"],
      priority: "high",
      status: "running",
      expectedImpactMad: 42000
    },
    {
      id: "delegation-003",
      objective: "Promote Salma K. to regional mentor pipeline",
      leadAgent: "Ambassador Success Agent",
      supportingAgents: ["Growth Strategist Agent"],
      priority: "medium",
      status: "queued",
      expectedImpactMad: 72000
    }
  ],
  consensus: [
    {
      id: "consensus-001",
      topic: "Agadir expansion requires immediate recruitment sprint",
      agentsInvolved: ["Growth Strategist Agent", "Recruitment Intelligence Agent", "Revenue Intelligence Agent"],
      consensusScore: 92,
      decision: "Proceed with recruitment sprint after human approval.",
      requiresHumanApproval: true,
      riskReason: "Budget and staffing capacity need leadership confirmation."
    },
    {
      id: "consensus-002",
      topic: "Marrakech payout rule should be temporarily tightened",
      agentsInvolved: ["Revenue Intelligence Agent", "Compliance Governance Agent"],
      consensusScore: 87,
      decision: "Require proof quality above 80 before automatic reward release.",
      requiresHumanApproval: true,
      riskReason: "Finance-sensitive reward policy modification."
    }
  ],
  audits: [
    {
      id: "audit-agent-001",
      agentName: "Campaign Optimization Agent",
      action: "Recommended redistribution of 18 academy missions.",
      timestamp: "2026-05-10T13:05:00.000Z",
      confidenceScore: 91,
      explainability: "Elite ambassadors show 24% higher conversion in academy campaigns.",
      humanOverrideAvailable: true
    },
    {
      id: "audit-agent-002",
      agentName: "Compliance Governance Agent",
      action: "Blocked healthcare content auto-approval.",
      timestamp: "2026-05-10T13:12:00.000Z",
      confidenceScore: 88,
      explainability: "Content category included regulated care claims requiring reviewer validation.",
      humanOverrideAvailable: true
    }
  ],
  governance: [
    {
      id: "gov-agent-001",
      title: "Finance actions require human approval",
      area: "finance",
      severity: "critical",
      rule: "AI agents cannot directly approve payouts or reward rule changes.",
      autoBlock: true
    },
    {
      id: "gov-agent-002",
      title: "Healthcare claims require compliance review",
      area: "compliance",
      severity: "critical",
      rule: "AI agents can flag or recommend but cannot approve regulated claims.",
      autoBlock: true
    },
    {
      id: "gov-agent-003",
      title: "Human override must remain available",
      area: "operations",
      severity: "high",
      rule: "All critical AI recommendations must expose override and audit trail.",
      autoBlock: false
    }
  ]
};
