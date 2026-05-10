export type AmbassadorHealthStatus = "excellent" | "stable" | "warning" | "critical";

export type RegionalPerformance = {
  city: string;
  ambassadors: number;
  activeCampaigns: number;
  generatedLeads: number;
  revenueMad: number;
  healthStatus: AmbassadorHealthStatus;
};

export type AmbassadorExecutiveInsight = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "growth" | "compliance" | "campaign" | "revenue" | "retention";
  recommendation: string;
};

export type ExecutiveActionQueueItem = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "doing" | "done";
};
