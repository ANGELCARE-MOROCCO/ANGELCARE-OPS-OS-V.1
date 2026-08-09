export type InfrastructureSeverity = "healthy" | "warning" | "critical";

export type EventBusChannel = {
  id: string;
  name: string;
  throughputPerMinute: number;
  latencyMs: number;
  status: InfrastructureSeverity;
};

export type BackgroundJob = {
  id: string;
  jobName: string;
  queue: string;
  status: "queued" | "running" | "retrying" | "failed" | "completed";
  retries: number;
  owner: string;
};

export type ExecutionAuditLog = {
  id: string;
  actor: string;
  action: string;
  module: string;
  timestamp: string;
  approvalRequired: boolean;
};

export type InfrastructureAlert = {
  id: string;
  title: string;
  category: "sla" | "queue" | "auth" | "sync" | "telemetry";
  severity: InfrastructureSeverity;
  summary: string;
};

export type InfrastructureSnapshot = {
  channels: EventBusChannel[];
  jobs: BackgroundJob[];
  audits: ExecutionAuditLog[];
  alerts: InfrastructureAlert[];
};
