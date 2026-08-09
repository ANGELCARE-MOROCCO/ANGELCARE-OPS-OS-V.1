import type { ExecutionHealthSnapshot } from "./live-execution-types";

export type ExecutionRuntimeMetrics = {
  runningRuntimes: number;
  failedEvents: number;
  retryingEvents: number;
  healthyQueues: number;
  blockedDependencies: number;
  orchestrationReadinessScore: number;
};

export function getExecutionRuntimeMetrics(snapshot: ExecutionHealthSnapshot): ExecutionRuntimeMetrics {
  const runningRuntimes = snapshot.runtimes.filter((r) => r.status === "running").length;
  const failedEvents = snapshot.events.filter((e) => e.status === "failed").length;
  const retryingEvents = snapshot.events.filter((e) => e.status === "retrying").length;
  const healthyQueues = snapshot.queues.filter((q) => q.health === "healthy").length;
  const blockedDependencies = snapshot.dependencies.filter((d) => d.state === "blocked").length;

  const orchestrationReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        runningRuntimes * 14 +
        healthyQueues * 11 -
        retryingEvents * 5 -
        blockedDependencies * 7 +
        48
      )
    )
  );

  return {
    runningRuntimes,
    failedEvents,
    retryingEvents,
    healthyQueues,
    blockedDependencies,
    orchestrationReadinessScore
  };
}
