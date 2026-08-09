import type {
  AmbassadorExecutiveInsight,
  ExecutiveActionQueueItem,
  RegionalPerformance,
} from "./executive-intelligence-types";

export const regionalPerformance: RegionalPerformance[] = [
  {
    city: "Rabat",
    ambassadors: 42,
    activeCampaigns: 6,
    generatedLeads: 188,
    revenueMad: 126000,
    healthStatus: "excellent",
  },
  {
    city: "Casablanca",
    ambassadors: 61,
    activeCampaigns: 8,
    generatedLeads: 254,
    revenueMad: 210000,
    healthStatus: "stable",
  },
  {
    city: "Marrakech",
    ambassadors: 17,
    activeCampaigns: 3,
    generatedLeads: 58,
    revenueMad: 42000,
    healthStatus: "warning",
  },
];

export const executiveInsights: AmbassadorExecutiveInsight[] = [
  {
    id: "insight-1",
    title: "Marrakech ambassador retention decreasing",
    severity: "high",
    category: "retention",
    recommendation: "Launch regional incentive sprint and mentor activation.",
  },
  {
    id: "insight-2",
    title: "Casablanca campaign conversion improving",
    severity: "medium",
    category: "revenue",
    recommendation: "Scale healthcare influencer onboarding in Casablanca.",
  },
];

export const executiveActionQueue: ExecutiveActionQueueItem[] = [
  {
    id: "queue-1",
    title: "Approve regional expansion budget",
    owner: "CEO",
    dueDate: "2026-05-12",
    priority: "critical",
    status: "todo",
  },
  {
    id: "queue-2",
    title: "Review ambassador churn risks",
    owner: "Marketing Director",
    dueDate: "2026-05-13",
    priority: "high",
    status: "doing",
  },
];
