import type { ExecutionHealthSnapshot } from "./live-execution-types";

export const executionHealthSnapshot: ExecutionHealthSnapshot = {
  runtimes: [
    {
      id: "runtime-001",
      workflow: "Agadir Expansion Recruitment Runtime",
      owner: "Growth Strategist Agent",
      status: "running",
      progress: 72,
      latencyMs: 210,
      retryCount: 0
    },
    {
      id: "runtime-002",
      workflow: "Revenue Attribution Recovery Runtime",
      owner: "Revenue Intelligence Agent",
      status: "paused",
      progress: 43,
      latencyMs: 420,
      retryCount: 2
    },
    {
      id: "runtime-003",
      workflow: "Healthcare Compliance Validation Runtime",
      owner: "Compliance Governance Agent",
      status: "running",
      progress: 88,
      latencyMs: 184,
      retryCount: 0
    }
  ],
  queues: [
    {
      id: "queue-001",
      queue: "growth-expansion",
      throughputPerMinute: 820,
      activeWorkers: 12,
      backlog: 18,
      health: "healthy"
    },
    {
      id: "queue-002",
      queue: "revenue-sync",
      throughputPerMinute: 412,
      activeWorkers: 6,
      backlog: 47,
      health: "warning"
    },
    {
      id: "queue-003",
      queue: "compliance-review",
      throughputPerMinute: 204,
      activeWorkers: 4,
      backlog: 9,
      health: "healthy"
    }
  ],
  events: [
    {
      id: "event-001",
      source: "Webhook Gateway",
      type: "webhook",
      timestamp: "2026-05-10T14:22:00.000Z",
      status: "processed",
      detail: "Regional recruitment trigger ingested successfully."
    },
    {
      id: "event-002",
      source: "AI Runtime Engine",
      type: "ai_action",
      timestamp: "2026-05-10T14:24:00.000Z",
      status: "retrying",
      detail: "Mission redistribution action retried due to dependency lock."
    },
    {
      id: "event-003",
      source: "Realtime Sync Channel",
      type: "sync",
      timestamp: "2026-05-10T14:27:00.000Z",
      status: "processed",
      detail: "Revenue and Ambassador OS synchronization completed."
    }
  ],
  dependencies: [
    {
      id: "dep-001",
      parentWorkflow: "Expansion Intelligence Runtime",
      dependentWorkflow: "Recruitment Sprint Runtime",
      state: "ready"
    },
    {
      id: "dep-002",
      parentWorkflow: "Compliance Validation Runtime",
      dependentWorkflow: "Campaign Deployment Runtime",
      state: "waiting"
    },
    {
      id: "dep-003",
      parentWorkflow: "Revenue Attribution Runtime",
      dependentWorkflow: "Payout Recommendation Runtime",
      state: "blocked"
    }
  ]
};
