import type { EnterpriseSyncSnapshot } from "./enterprise-sync-types";

export const enterpriseSyncSnapshot: EnterpriseSyncSnapshot = {
  syncs: [
    {
      id: "sync-001",
      sourceModule: "Ambassador OS",
      targetModule: "Revenue Command",
      syncType: "conversion_attribution",
      lastSyncAt: "2026-05-10T11:00:00.000Z",
      syncHealth: "healthy",
      recordsProcessed: 482
    },
    {
      id: "sync-002",
      sourceModule: "Academy",
      targetModule: "Ambassador OS",
      syncType: "recruitment_pipeline",
      lastSyncAt: "2026-05-10T10:45:00.000Z",
      syncHealth: "healthy",
      recordsProcessed: 138
    },
    {
      id: "sync-003",
      sourceModule: "CRM",
      targetModule: "Ambassador OS",
      syncType: "lead_status_mapping",
      lastSyncAt: "2026-05-10T09:40:00.000Z",
      syncHealth: "warning",
      recordsProcessed: 64,
      issue: "Lead ownership conflicts detected."
    },
    {
      id: "sync-004",
      sourceModule: "HR OS",
      targetModule: "Ambassador OS",
      syncType: "performance_impact_tracking",
      lastSyncAt: "2026-05-10T08:15:00.000Z",
      syncHealth: "critical",
      recordsProcessed: 19,
      issue: "Performance reviews not propagating correctly."
    }
  ],
  feeds: [
    {
      id: "feed-001",
      title: "Casablanca conversion surge",
      module: "Revenue Command",
      priority: "high",
      timestamp: "2026-05-10T11:05:00.000Z",
      summary: "Academy ambassadors increased conversion volume by 21%."
    },
    {
      id: "feed-002",
      title: "New academy ambassador cohort ready",
      module: "Academy",
      priority: "medium",
      timestamp: "2026-05-10T10:20:00.000Z",
      summary: "28 candidates approved for onboarding pipeline."
    },
    {
      id: "feed-003",
      title: "Regional partnership escalation",
      module: "Partnerships",
      priority: "critical",
      timestamp: "2026-05-10T09:50:00.000Z",
      summary: "Agadir partner activation delayed due to staffing shortage."
    }
  ],
  dependencies: [
    {
      id: "dep-001",
      operation: "Agadir ambassador expansion sprint",
      dependsOn: ["Academy onboarding", "HR approvals", "Revenue targeting"],
      blocked: false
    },
    {
      id: "dep-002",
      operation: "Marrakech healthcare campaign",
      dependsOn: ["CRM segmentation", "Partnership activation"],
      blocked: true,
      blockerReason: "Lead segmentation data missing."
    }
  ],
  propagations: [
    {
      id: "prop-001",
      originModule: "Revenue Command",
      generatedTask: "Review low ROI ambassador missions",
      assignedTeam: "Ambassador Operations",
      status: "doing"
    },
    {
      id: "prop-002",
      originModule: "Academy",
      generatedTask: "Prepare onboarding workflow for new ambassador cohort",
      assignedTeam: "HR & Ambassador Operations",
      status: "todo"
    }
  ]
};
