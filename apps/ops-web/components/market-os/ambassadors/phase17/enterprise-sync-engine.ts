import type { EnterpriseSyncSnapshot, CrossModuleSync } from "./enterprise-sync-types";

export type EnterpriseSyncMetrics = {
  totalConnections: number;
  healthyConnections: number;
  warningConnections: number;
  criticalConnections: number;
  operationalFeedItems: number;
  blockedDependencies: number;
  syncReadinessScore: number;
};

export function getCriticalSyncs(syncs: CrossModuleSync[]) {
  return syncs.filter((item) => item.syncHealth === "critical" || item.syncHealth === "warning");
}

export function getEnterpriseSyncMetrics(snapshot: EnterpriseSyncSnapshot): EnterpriseSyncMetrics {
  const totalConnections = snapshot.syncs.length;
  const healthyConnections = snapshot.syncs.filter((item) => item.syncHealth === "healthy").length;
  const warningConnections = snapshot.syncs.filter((item) => item.syncHealth === "warning").length;
  const criticalConnections = snapshot.syncs.filter((item) => item.syncHealth === "critical").length;
  const operationalFeedItems = snapshot.feeds.length;
  const blockedDependencies = snapshot.dependencies.filter((item) => item.blocked).length;

  const syncReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        healthyConnections * 18 -
        warningConnections * 8 -
        criticalConnections * 15 -
        blockedDependencies * 10 +
        55
      )
    )
  );

  return {
    totalConnections,
    healthyConnections,
    warningConnections,
    criticalConnections,
    operationalFeedItems,
    blockedDependencies,
    syncReadinessScore
  };
}
