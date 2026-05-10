import type { AmbassadorAISnapshot } from "./ambassador-ai-types";

export const ambassadorAISnapshot: AmbassadorAISnapshot = {
  recommendations: [
    {
      id: "ai-rec-001",
      title: "Expand Casablanca academy missions",
      category: "expansion",
      priority: "critical",
      owner: "Marketing Director",
      city: "Casablanca",
      aiConfidence: 96,
      expectedImpactMad: 180000,
      recommendation: "Demand and conversion signals indicate academy ambassador capacity should increase by 35%."
    },
    {
      id: "ai-rec-002",
      title: "Assign Salma K. as regional mentor",
      category: "succession",
      priority: "high",
      owner: "Ambassador Director",
      city: "Casablanca",
      aiConfidence: 92,
      expectedImpactMad: 72000,
      recommendation: "High ROI and stable conversion quality suggest leadership expansion potential."
    },
    {
      id: "ai-rec-003",
      title: "Reduce low-performing TikTok missions",
      category: "campaign",
      priority: "medium",
      owner: "Revenue Command",
      city: "Marrakech",
      aiConfidence: 81,
      expectedImpactMad: 32000,
      recommendation: "Current payout-to-conversion ratio exceeds profitable thresholds."
    }
  ],
  expansionSignals: [
    {
      id: "exp-001",
      city: "Agadir",
      expansionScore: 91,
      marketDemandScore: 88,
      ambassadorCapacityScore: 42,
      competitionRisk: 21,
      recommendedAction: "Launch regional ambassador acquisition sprint immediately."
    },
    {
      id: "exp-002",
      city: "Fes",
      expansionScore: 74,
      marketDemandScore: 69,
      ambassadorCapacityScore: 51,
      competitionRisk: 33,
      recommendedAction: "Pilot academy referral missions before scaling."
    }
  ],
  risks: [
    {
      id: "risk-001",
      ambassadorName: "Nora H.",
      type: "fatigue",
      severity: "high",
      aiConfidence: 87,
      suggestedAction: "Reduce campaign load and assign coaching support."
    },
    {
      id: "risk-002",
      ambassadorName: "Aya R.",
      type: "conversion_decline",
      severity: "critical",
      aiConfidence: 93,
      suggestedAction: "Pause low-performing missions and retrain referral execution."
    }
  ],
  briefings: [
    {
      id: "brief-001",
      title: "Weekly Ambassador Intelligence Briefing",
      generatedAt: "2026-05-10T10:00:00.000Z",
      summary: "Casablanca and Rabat remain dominant revenue zones while Agadir shows the strongest untapped expansion opportunity.",
      strategicFocus: [
        "Expand academy ambassador recruitment",
        "Reduce payout inefficiencies",
        "Increase regional mentorship structure",
        "Stabilize conversion quality"
      ]
    }
  ]
};
