import type { AmbassadorSyncHealth, AmbassadorSyncRecord, AmbassadorSyncStatus } from "./ambassador-sync-types";

export function countBySyncStatus(records: AmbassadorSyncRecord[], status: AmbassadorSyncStatus): number {
  return records.filter((record) => record.status === status).length;
}

export function calculateAmbassadorSyncReadiness(records: AmbassadorSyncRecord[]): number {
  if (records.length === 0) return 0;

  const synced = countBySyncStatus(records, "synced");
  const pending = countBySyncStatus(records, "pending");
  const conflicts = countBySyncStatus(records, "conflict");
  const failed = countBySyncStatus(records, "failed");
  const highRisk = records.filter((record) => record.riskLevel === "high" || record.riskLevel === "critical").length;

  const base = Math.round((synced / records.length) * 100);
  const penalty = pending * 4 + conflicts * 10 + failed * 14 + highRisk * 3;

  return Math.max(0, Math.min(100, base - penalty + 30));
}

export function getAmbassadorSyncHealth(records: AmbassadorSyncRecord[]): AmbassadorSyncHealth {
  const totalRecords = records.length;
  const syncedRecords = countBySyncStatus(records, "synced");
  const pendingRecords = countBySyncStatus(records, "pending");
  const conflictRecords = countBySyncStatus(records, "conflict");
  const failedRecords = countBySyncStatus(records, "failed");
  const highRiskRecords = records.filter((record) => record.riskLevel === "high" || record.riskLevel === "critical").length;
  const syncReadinessScore = calculateAmbassadorSyncReadiness(records);

  return {
    totalRecords,
    syncedRecords,
    pendingRecords,
    conflictRecords,
    failedRecords,
    highRiskRecords,
    syncReadinessScore,
  };
}

export function getRecordsNeedingAttention(records: AmbassadorSyncRecord[]): AmbassadorSyncRecord[] {
  return records
    .filter((record) => record.status === "pending" || record.status === "conflict" || record.status === "failed" || record.riskLevel === "critical")
    .sort((a, b) => {
      const priority = { critical: 4, high: 3, medium: 2, low: 1 };
      return priority[b.riskLevel] - priority[a.riskLevel];
    });
}
