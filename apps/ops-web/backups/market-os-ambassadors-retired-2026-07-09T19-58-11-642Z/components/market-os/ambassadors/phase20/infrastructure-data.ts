import type { InfrastructureSnapshot } from "./infrastructure-types";

export const infrastructureSnapshot: InfrastructureSnapshot = {
  channels: [
    {
      id: "channel-001",
      name: "ambassador.live.activity",
      throughputPerMinute: 842,
      latencyMs: 124,
      status: "healthy"
    },
    {
      id: "channel-002",
      name: "revenue.sync.events",
      throughputPerMinute: 391,
      latencyMs: 318,
      status: "warning"
    },
    {
      id: "channel-003",
      name: "hr.performance.propagation",
      throughputPerMinute: 74,
      latencyMs: 812,
      status: "critical"
    }
  ],
  jobs: [
    {
      id: "job-001",
      jobName: "Autonomous Mission Redistribution",
      queue: "growth-optimization",
      status: "running",
      retries: 0,
      owner: "AI Growth Operator"
    },
    {
      id: "job-002",
      jobName: "Lead Attribution Recovery",
      queue: "revenue-sync",
      status: "retrying",
      retries: 2,
      owner: "Revenue Command"
    },
    {
      id: "job-003",
      jobName: "Academy Recruitment Forecast",
      queue: "predictive-engine",
      status: "queued",
      retries: 0,
      owner: "Academy Intelligence"
    }
  ],
  audits: [
    {
      id: "audit-001",
      actor: "AI Growth Operator",
      action: "Mission redistribution proposal generated",
      module: "Ambassador OS",
      timestamp: "2026-05-10T12:40:00.000Z",
      approvalRequired: true
    },
    {
      id: "audit-002",
      actor: "Revenue Command",
      action: "Payout anomaly escalation executed",
      module: "Revenue Command",
      timestamp: "2026-05-10T12:22:00.000Z",
      approvalRequired: false
    }
  ],
  alerts: [
    {
      id: "alert-001",
      title: "SLA latency threshold exceeded",
      category: "sla",
      severity: "critical",
      summary: "HR propagation latency exceeded safe operational threshold."
    },
    {
      id: "alert-002",
      title: "Queue retry escalation detected",
      category: "queue",
      severity: "warning",
      summary: "Revenue synchronization queue retry rate increasing."
    }
  ]
};
