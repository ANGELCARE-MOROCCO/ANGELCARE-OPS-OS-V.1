import type { FinalOperatingModelSnapshot } from "./operating-model-types";

export type OperatingModelMetrics = {
  pillarCount: number;
  averageMaturity: number;
  criticalApprovalGates: number;
  autoExecutionGates: number;
  criticalControls: number;
  governanceReadinessScore: number;
};

export function getOperatingModelMetrics(snapshot: FinalOperatingModelSnapshot): OperatingModelMetrics {
  const pillarCount = snapshot.pillars.length;
  const averageMaturity =
    pillarCount === 0
      ? 0
      : Math.round(snapshot.pillars.reduce((sum, item) => sum + item.maturityScore, 0) / pillarCount);

  const criticalApprovalGates = snapshot.approvalGates.filter((gate) => gate.priority === "critical").length;
  const autoExecutionGates = snapshot.approvalGates.filter((gate) => gate.autoExecutionAllowed).length;
  const criticalControls = snapshot.controls.filter((control) => control.severity === "critical").length;

  const governanceReadinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(averageMaturity + autoExecutionGates * 3 - criticalControls * 5 + criticalApprovalGates * 2)
    )
  );

  return {
    pillarCount,
    averageMaturity,
    criticalApprovalGates,
    autoExecutionGates,
    criticalControls,
    governanceReadinessScore
  };
}
