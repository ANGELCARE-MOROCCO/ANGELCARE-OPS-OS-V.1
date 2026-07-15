import type { WarRoomSnapshot } from "./war-room-types";

export const warRoomSnapshot: WarRoomSnapshot = {
  alerts: [
    {
      id: "alert-001",
      title: "Casablanca conversion drop detected",
      category: "conversion_drop",
      severity: "high",
      city: "Casablanca",
      createdAt: "2026-05-10T12:02:00.000Z",
      summary: "Conversion performance dropped 18% within 2 hours.",
      autoAction: "AI reassigned high-performing ambassadors to active campaigns."
    },
    {
      id: "alert-002",
      title: "Agadir territory expansion pressure",
      category: "territory_risk",
      severity: "critical",
      city: "Agadir",
      createdAt: "2026-05-10T12:08:00.000Z",
      summary: "Lead demand exceeds ambassador capacity by 42%.",
      autoAction: "Escalation sent to Academy onboarding and HR."
    },
    {
      id: "alert-003",
      title: "Payout anomaly detected",
      category: "payout",
      severity: "medium",
      city: "Marrakech",
      createdAt: "2026-05-10T11:44:00.000Z",
      summary: "Reward ratio exceeded safe profitability threshold."
    }
  ],
  activity: [
    {
      id: "activity-001",
      ambassadorName: "Salma K.",
      city: "Casablanca",
      action: "Generated new academy referral conversion",
      timestamp: "2026-05-10T12:12:00.000Z",
      impact: "+4,500 MAD projected revenue"
    },
    {
      id: "activity-002",
      ambassadorName: "Meryem B.",
      city: "Rabat",
      action: "Completed healthcare campaign mission",
      timestamp: "2026-05-10T12:05:00.000Z",
      impact: "12 qualified leads added"
    },
    {
      id: "activity-003",
      ambassadorName: "Aya R.",
      city: "Tanger",
      action: "Flagged for engagement decline",
      timestamp: "2026-05-10T11:55:00.000Z",
      impact: "AI intervention triggered"
    }
  ],
  heartbeat: [
    {
      id: "heartbeat-001",
      operation: "Lead attribution sync",
      status: "healthy",
      latencyMs: 142,
      owner: "Revenue Command"
    },
    {
      id: "heartbeat-002",
      operation: "CRM propagation",
      status: "warning",
      latencyMs: 420,
      owner: "CRM Engine"
    },
    {
      id: "heartbeat-003",
      operation: "HR performance sync",
      status: "critical",
      latencyMs: 980,
      owner: "HR OS"
    }
  ],
  territories: [
    {
      id: "territory-001",
      city: "Casablanca",
      activeAmbassadors: 64,
      liveLeads: 118,
      conversionRate: 23,
      engagementScore: 91,
      operationalHealth: 88
    },
    {
      id: "territory-002",
      city: "Rabat",
      activeAmbassadors: 42,
      liveLeads: 71,
      conversionRate: 19,
      engagementScore: 86,
      operationalHealth: 83
    },
    {
      id: "territory-003",
      city: "Agadir",
      activeAmbassadors: 11,
      liveLeads: 66,
      conversionRate: 14,
      engagementScore: 72,
      operationalHealth: 49
    }
  ]
};
