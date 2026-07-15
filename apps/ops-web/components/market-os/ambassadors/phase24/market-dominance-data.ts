import type { MarketDominanceSnapshot } from "./market-dominance-types";

export const marketDominanceSnapshot: MarketDominanceSnapshot = {
  regions: [
    {
      id: "region-casa",
      city: "Casablanca",
      demandScore: 94,
      growthMomentum: 88,
      saturationRisk: 42,
      ambassadorInfluenceScore: 91,
      recommendedMove: "Scale academy and healthcare ambassador campaigns immediately."
    },
    {
      id: "region-rabat",
      city: "Rabat",
      demandScore: 86,
      growthMomentum: 79,
      saturationRisk: 38,
      ambassadorInfluenceScore: 84,
      recommendedMove: "Increase premium healthcare referral campaigns and partner activations."
    },
    {
      id: "region-agadir",
      city: "Agadir",
      demandScore: 81,
      growthMomentum: 92,
      saturationRisk: 18,
      ambassadorInfluenceScore: 49,
      recommendedMove: "Recruit ambassadors urgently before competitors capture demand."
    },
    {
      id: "region-fes",
      city: "Fes",
      demandScore: 69,
      growthMomentum: 73,
      saturationRisk: 24,
      ambassadorInfluenceScore: 55,
      recommendedMove: "Launch a controlled academy-led market entry pilot."
    }
  ],
  competitors: [
    {
      id: "comp-001",
      competitorName: "Local Care Provider A",
      city: "Casablanca",
      activityType: "campaign",
      threatLevel: "high",
      summary: "Competitor increased social care campaign volume around family support services.",
      counterMove: "Activate high-conversion ambassadors and push proof-backed trust messaging."
    },
    {
      id: "comp-002",
      competitorName: "Training Center B",
      city: "Rabat",
      activityType: "pricing",
      threatLevel: "medium",
      summary: "Discount campaign detected for care training courses.",
      counterMove: "Position Academy around certification quality and employment outcomes."
    },
    {
      id: "comp-003",
      competitorName: "Healthcare Network C",
      city: "Agadir",
      activityType: "partnership",
      threatLevel: "critical",
      summary: "Potential competitor partnership movement in under-covered Agadir region.",
      counterMove: "Accelerate partner clinic outreach and ambassador recruitment sprint."
    }
  ],
  opportunities: [
    {
      id: "opp-001",
      title: "Agadir white-space expansion",
      city: "Agadir",
      category: "ambassador_recruitment",
      priority: "critical",
      expectedImpactMad: 320000,
      timing: "now",
      actionPlan: "Launch ambassador recruitment sprint through partners, Academy, and social sourcing."
    },
    {
      id: "opp-002",
      title: "Casablanca academy referral dominance",
      city: "Casablanca",
      category: "academy",
      priority: "high",
      expectedImpactMad: 480000,
      timing: "short_term",
      actionPlan: "Increase elite ambassador referral missions and lead qualification workflows."
    },
    {
      id: "opp-003",
      title: "Rabat premium home support positioning",
      city: "Rabat",
      category: "home_support",
      priority: "high",
      expectedImpactMad: 260000,
      timing: "short_term",
      actionPlan: "Deploy healthcare ambassadors with trust-first storytelling and partner proof."
    }
  ],
  sentiment: [
    {
      id: "sent-001",
      topic: "Home support trust",
      channel: "social",
      sentimentScore: 78,
      trend: "improving",
      insight: "Trust-oriented content is resonating strongly with families."
    },
    {
      id: "sent-002",
      topic: "Academy career value",
      channel: "community",
      sentimentScore: 84,
      trend: "improving",
      insight: "Training tied to employability has strong public appeal."
    },
    {
      id: "sent-003",
      topic: "Pricing sensitivity",
      channel: "reviews",
      sentimentScore: 61,
      trend: "stable",
      insight: "Pricing remains a decision factor; value framing should be reinforced."
    }
  ],
  briefings: [
    {
      id: "brief-001",
      title: "Agadir expansion window is open",
      urgency: "critical",
      summary: "Demand is rising while ambassador influence is still low, creating a time-sensitive expansion opportunity.",
      strategicDecision: "Authorize immediate ambassador recruitment and partner clinic outreach."
    },
    {
      id: "brief-002",
      title: "Casablanca remains the strongest revenue acceleration zone",
      urgency: "high",
      summary: "Academy demand, ambassador conversion, and social momentum are aligned.",
      strategicDecision: "Increase elite ambassador allocation and budget for academy campaigns."
    }
  ]
};
