export type ExecutionSeverity = "healthy" | "warning" | "critical";

export type WorkflowRuntime = {
  id: string;
  workflow: string;
  owner: string;
  status: "queued" | "running" | "paused" | "failed" | "completed";
  progress: number;
  latencyMs: number;
  retryCount: number;
};

export type ExecutionQueue = {
  id: string;
  queue: string;
  throughputPerMinute: number;
  activeWorkers: number;
  backlog: number;
  health: ExecutionSeverity;
};

export type RuntimeEvent = {
  id: string;
  source: string;
  type: "notification" | "webhook" | "ai_action" | "sync" | "recovery";
  timestamp: string;
  status: "processed" | "retrying" | "failed";
  detail: string;
};

export type ExecutionDependency = {
  id: string;
  parentWorkflow: string;
  dependentWorkflow: string;
  state: "waiting" | "ready" | "blocked";
};

export type ExecutionHealthSnapshot = {
  runtimes: WorkflowRuntime[];
  queues: ExecutionQueue[];
  events: RuntimeEvent[];
  dependencies: ExecutionDependency[];
};
