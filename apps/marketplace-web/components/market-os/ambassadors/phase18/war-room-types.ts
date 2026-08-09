export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type LiveOperationalAlert = {
  id: string;
  title: string;
  category:
    | "conversion_drop"
    | "territory_risk"
    | "campaign_delay"
    | "compliance"
    | "payout"
    | "engagement";
  severity: AlertSeverity;
  city: string;
  createdAt: string;
  summary: string;
  autoAction?: string;
};

export type LiveActivityStream = {
  id: string;
  ambassadorName: string;
  city: string;
  action: string;
  timestamp: string;
  impact: string;
};

export type OperationalHeartbeat = {
  id: string;
  operation: string;
  status: "healthy" | "warning" | "critical";
  latencyMs: number;
  owner: string;
};

export type TerritoryLivePerformance = {
  id: string;
  city: string;
  activeAmbassadors: number;
  liveLeads: number;
  conversionRate: number;
  engagementScore: number;
  operationalHealth: number;
};

export type WarRoomSnapshot = {
  alerts: LiveOperationalAlert[];
  activity: LiveActivityStream[];
  heartbeat: OperationalHeartbeat[];
  territories: TerritoryLivePerformance[];
};
