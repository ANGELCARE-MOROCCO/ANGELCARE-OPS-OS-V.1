import type { InfrastructureSnapshot } from "./infrastructure-types";

export type InfrastructureMetrics = {
  healthyChannels: number;
  criticalChannels: number;
  activeJobs: number;
  retryingJobs: number;
  approvalFlows: number;
  infrastructureReadinessScore: number;
};

export function getInfrastructureMetrics(snapshot: InfrastructureSnapshot): InfrastructureMetrics {
  const healthyChannels = snapshot.channels.filter((item) => item.status === "healthy").length;
  const criticalChannels = snapshot.channels.filter((item) => item.status === "critical").length;
  const activeJobs = snapshot.jobs.filter((item) => item.status === "running").length;
  const retryingJobs = snapshot.jobs.filter((item) => item.status === "retrying").length;
  const approvalFlows = snapshot.audits.filter((item) => item.approvalRequired).length;

  const infrastructureReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        healthyChannels * 24 -
        criticalChannels * 14 -
        retryingJobs * 6 +
        activeJobs * 8 +
        62
      )
    )
  );

  return {
    healthyChannels,
    criticalChannels,
    activeJobs,
    retryingJobs,
    approvalFlows,
    infrastructureReadinessScore
  };
}
