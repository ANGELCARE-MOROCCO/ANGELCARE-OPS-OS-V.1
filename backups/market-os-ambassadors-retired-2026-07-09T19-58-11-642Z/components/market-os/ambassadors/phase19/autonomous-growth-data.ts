import type { AutonomousGrowthSnapshot } from "./autonomous-growth-types";

export const autonomousGrowthSnapshot: AutonomousGrowthSnapshot = {
  optimizationLoops: [
    {
      id: "loop-001",
      title: "Rebalance Casablanca Academy missions",
      domain: "mission_assignment",
      priority: "critical",
      status: "recommended",
      owner: "AI Growth Operator",
      confidenceScore: 94,
      expectedImpactMad: 132000,
      recommendation: "Move low-conversion missions toward elite academy ambassadors and increase WhatsApp follow-up cadence."
    },
    {
      id: "loop-002",
      title: "Reduce Marrakech payout inefficiency",
      domain: "reward_rules",
      priority: "high",
      status: "queued",
      owner: "Finance Operations",
      confidenceScore: 86,
      expectedImpactMad: 42000,
      recommendation: "Temporarily require proof quality above 80 before automatic reward generation."
    },
    {
      id: "loop-003",
      title: "Trigger Agadir recruitment acceleration",
      domain: "recruitment",
      priority: "critical",
      status: "running",
      owner: "Regional Growth Manager",
      confidenceScore: 91,
      expectedImpactMad: 98000,
      recommendation: "Open academy and partner referral sourcing to close the territory capacity gap."
    }
  ],
  redistributions: [
    {
      id: "redis-001",
      campaignName: "Academy Referral Sprint",
      sourceSegment: "Bronze low-conversion ambassadors",
      targetSegment: "Gold and Elite academy ambassadors",
      reason: "Conversion delta above 24% detected.",
      movedMissions: 18,
      expectedConversionLift: 16,
      status: "recommended"
    },
    {
      id: "redis-002",
      campaignName: "Home Support Awareness",
      sourceSegment: "Overloaded Rabat ambassadors",
      targetSegment: "Available Casablanca healthcare ambassadors",
      reason: "Workload imbalance and delayed proof submissions.",
      movedMissions: 11,
      expectedConversionLift: 9,
      status: "queued"
    }
  ],
  recruitmentTriggers: [
    {
      id: "trigger-001",
      city: "Agadir",
      triggerReason: "Lead demand exceeds ambassador capacity by 42%.",
      requiredAmbassadors: 23,
      suggestedSource: "partners",
      urgency: "critical",
      expectedRevenueCapacityMad: 124000
    },
    {
      id: "trigger-002",
      city: "Fes",
      triggerReason: "Expansion scenario shows positive academy referral ROI.",
      requiredAmbassadors: 14,
      suggestedSource: "campus",
      urgency: "medium",
      expectedRevenueCapacityMad: 54000
    }
  ],
  simulations: [
    {
      id: "sim-001",
      title: "Aggressive Casablanca academy scale",
      scenarioType: "aggressive",
      targetCity: "Casablanca",
      requiredAmbassadors: 38,
      expectedLeads: 410,
      expectedConversions: 92,
      expectedRevenueMad: 414000,
      riskScore: 31
    },
    {
      id: "sim-002",
      title: "Balanced Agadir territory launch",
      scenarioType: "balanced",
      targetCity: "Agadir",
      requiredAmbassadors: 23,
      expectedLeads: 185,
      expectedConversions: 33,
      expectedRevenueMad: 148000,
      riskScore: 44
    },
    {
      id: "sim-003",
      title: "Conservative Fes academy pilot",
      scenarioType: "conservative",
      targetCity: "Fes",
      requiredAmbassadors: 12,
      expectedLeads: 92,
      expectedConversions: 14,
      expectedRevenueMad: 63000,
      riskScore: 22
    }
  ],
  governance: [
    {
      id: "gov-001",
      title: "Payout auto-optimization requires finance approval",
      riskArea: "finance",
      severity: "high",
      autoBlocked: true,
      requiredHumanApproval: true,
      mitigation: "Finance must approve reward rule changes before activation."
    },
    {
      id: "gov-002",
      title: "Healthcare claims cannot be auto-approved",
      riskArea: "compliance",
      severity: "critical",
      autoBlocked: true,
      requiredHumanApproval: true,
      mitigation: "Compliance reviewer approval required for all healthcare content optimization."
    }
  ]
};
