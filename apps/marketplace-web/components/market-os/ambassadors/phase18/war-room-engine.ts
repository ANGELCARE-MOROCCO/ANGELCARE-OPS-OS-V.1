import type { WarRoomSnapshot, LiveOperationalAlert } from "./war-room-types";

export type WarRoomMetrics = {
  activeAlerts: number;
  criticalAlerts: number;
  liveSignals: number;
  healthyOperations: number;
  warningOperations: number;
  criticalOperations: number;
  warRoomHealthScore: number;
};

export function getCriticalAlerts(alerts: LiveOperationalAlert[]) {
  return alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high");
}

export function getWarRoomMetrics(snapshot: WarRoomSnapshot): WarRoomMetrics {
  const activeAlerts = snapshot.alerts.length;
  const criticalAlerts = snapshot.alerts.filter((item) => item.severity === "critical").length;
  const liveSignals = snapshot.activity.length;
  const healthyOperations = snapshot.heartbeat.filter((item) => item.status === "healthy").length;
  const warningOperations = snapshot.heartbeat.filter((item) => item.status === "warning").length;
  const criticalOperations = snapshot.heartbeat.filter((item) => item.status === "critical").length;

  const warRoomHealthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        healthyOperations * 20 -
        warningOperations * 6 -
        criticalOperations * 14 -
        criticalAlerts * 12 +
        82
      )
    )
  );

  return {
    activeAlerts,
    criticalAlerts,
    liveSignals,
    healthyOperations,
    warningOperations,
    criticalOperations,
    warRoomHealthScore
  };
}
