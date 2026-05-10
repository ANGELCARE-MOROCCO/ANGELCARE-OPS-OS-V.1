import type {
  AmbassadorCampaignAssignment,
  AmbassadorHealthRecord,
  AmbassadorRiskLevel,
  PayoutRiskStatus,
} from "./phase4-types";

export function formatMad(value: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getRiskLabel(score: number): AmbassadorRiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function computeAmbassadorHealthScore(record: Pick<
  AmbassadorHealthRecord,
  "engagementScore" | "executionScore" | "complianceScore" | "missionsCompleted" | "overdueMissions"
>): number {
  const base =
    record.engagementScore * 0.25 +
    record.executionScore * 0.35 +
    record.complianceScore * 0.30 +
    Math.min(record.missionsCompleted, 20) * 0.5;

  const penalty = record.overdueMissions * 6;
  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

export function getCampaignProgress(assignment: AmbassadorCampaignAssignment): number {
  if (assignment.expectedRevenueMad <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((assignment.currentRevenueMad / assignment.expectedRevenueMad) * 100)),
  );
}

export function getPayoutDecision(status: PayoutRiskStatus): string {
  if (status === "clear") return "Approve payout";
  if (status === "review") return "Review before approval";
  return "Block payout";
}

export function summarizeHealth(records: AmbassadorHealthRecord[]) {
  const active = records.filter((record) => record.status === "active").length;
  const watchlist = records.filter((record) => record.status === "watchlist").length;
  const inactive = records.filter((record) => record.status === "inactive").length;
  const averageHealth =
    records.length === 0
      ? 0
      : Math.round(records.reduce((sum, record) => sum + record.healthScore, 0) / records.length);
  const revenueMad = records.reduce((sum, record) => sum + record.revenueMad, 0);
  const leads = records.reduce((sum, record) => sum + record.leadsGenerated, 0);

  return {
    active,
    watchlist,
    inactive,
    averageHealth,
    revenueMad,
    leads,
  };
}
