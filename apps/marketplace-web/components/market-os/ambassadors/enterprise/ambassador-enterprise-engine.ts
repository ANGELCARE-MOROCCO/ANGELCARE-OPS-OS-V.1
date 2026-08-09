import type { AmbassadorEnterpriseSnapshot } from "./ambassador-enterprise-types";

export type AmbassadorEnterpriseMetrics = {
  totalModules: number;
  averageMaturity: number;
  backendReadyModules: number;
  criticalPermissions: number;
  blockedChecklistItems: number;
  enterpriseReadinessScore: number;
};

export function getAmbassadorEnterpriseMetrics(snapshot: AmbassadorEnterpriseSnapshot): AmbassadorEnterpriseMetrics {
  const totalModules = snapshot.modules.length;
  const averageMaturity =
    totalModules === 0
      ? 0
      : Math.round(snapshot.modules.reduce((sum, item) => sum + item.maturityScore, 0) / totalModules);

  const backendReadyModules = snapshot.modules.filter((item) => item.productionStatus === "backend_ready").length;
  const criticalPermissions = snapshot.permissions.filter((item) => item.risk === "critical").length;
  const blockedChecklistItems = snapshot.checklist.filter((item) => item.status === "blocked").length;

  const enterpriseReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(averageMaturity + backendReadyModules * 3 - criticalPermissions * 2 - blockedChecklistItems * 8)
    )
  );

  return {
    totalModules,
    averageMaturity,
    backendReadyModules,
    criticalPermissions,
    blockedChecklistItems,
    enterpriseReadinessScore
  };
}

export function getModulesNeedingBackend(snapshot: AmbassadorEnterpriseSnapshot) {
  return snapshot.modules.filter((item) => item.productionStatus === "needs_backend" || item.productionStatus === "backend_ready");
}

export function getCriticalChecklist(snapshot: AmbassadorEnterpriseSnapshot) {
  return snapshot.checklist.filter((item) => item.priority === "critical");
}
