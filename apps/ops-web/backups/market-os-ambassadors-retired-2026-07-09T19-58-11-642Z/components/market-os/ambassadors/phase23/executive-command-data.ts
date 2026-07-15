import type { ExecutiveCommandSnapshot } from "./executive-command-types";

export const executiveCommandSnapshot: ExecutiveCommandSnapshot = {
  initiatives: [
    {
      id: "initiative-001",
      title: "National Ambassador Expansion Morocco",
      owner: "CEO",
      status: "active",
      priority: "critical",
      expectedImpactMad: 2400000,
      strategicGoal: "Scale AngelCare ambassador coverage across 12 major cities."
    },
    {
      id: "initiative-002",
      title: "Academy-to-Ambassador Recruitment Flywheel",
      owner: "Academy Director",
      status: "active",
      priority: "high",
      expectedImpactMad: 820000,
      strategicGoal: "Convert Academy graduates into growth operators."
    },
    {
      id: "initiative-003",
      title: "AI Autonomous Operations Governance",
      owner: "Operations Director",
      status: "planning",
      priority: "high",
      expectedImpactMad: 0,
      strategicGoal: "Create safe executive oversight for autonomous AI execution."
    }
  ],
  risks: [
    {
      id: "risk-001",
      area: "growth",
      severity: "critical",
      title: "Agadir territory demand exceeds current workforce capacity",
      mitigation: "Accelerate predictive recruitment pipeline and partner sourcing."
    },
    {
      id: "risk-002",
      area: "compliance",
      severity: "high",
      title: "AI-generated healthcare content requires governance supervision",
      mitigation: "Maintain mandatory human validation before publication."
    },
    {
      id: "risk-003",
      area: "operations",
      severity: "medium",
      title: "Cross-module synchronization latency increasing",
      mitigation: "Connect real event persistence and queue infrastructure."
    }
  ],
  forecasts: [
    {
      id: "forecast-001",
      horizon: "30d",
      projectedRevenueMad: 420000,
      projectedExpansionCities: 2,
      projectedAmbassadors: 160,
      confidenceScore: 88
    },
    {
      id: "forecast-002",
      horizon: "90d",
      projectedRevenueMad: 1280000,
      projectedExpansionCities: 5,
      projectedAmbassadors: 420,
      confidenceScore: 84
    },
    {
      id: "forecast-003",
      horizon: "1y",
      projectedRevenueMad: 6200000,
      projectedExpansionCities: 12,
      projectedAmbassadors: 1400,
      confidenceScore: 72
    }
  ],
  briefings: [
    {
      id: "brief-001",
      title: "Casablanca academy campaigns outperforming projections",
      summary: "Elite ambassador segments exceeded conversion expectations by 21%.",
      urgency: "high",
      source: "Revenue Intelligence Agent"
    },
    {
      id: "brief-002",
      title: "Agadir expansion opportunity window detected",
      summary: "Healthcare demand and partner interest rising faster than forecast.",
      urgency: "critical",
      source: "Growth Strategist Agent"
    },
    {
      id: "brief-003",
      title: "Autonomous operations readiness improving",
      summary: "Governance safeguards reducing operational AI risk exposure.",
      urgency: "medium",
      source: "AI Governance Engine"
    }
  ]
};
