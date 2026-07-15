import type {
  AutonomousGrowthSnapshot,
  AutonomousGovernanceItem,
  AutonomousOptimizationLoop,
  GrowthSimulationScenario,
} from "./autonomous-growth-types";

export type AutonomousGrowthMetrics = {
  activeOptimizationLoops: number;
  criticalOptimizations: number;
  expectedImpactMad: number;
  autonomousBlockedItems: number;
  humanApprovalRequired: number;
  topScenarioRevenueMad: number;
  automationReadinessScore: number;
};

export function getCriticalOptimizationLoops(loops: AutonomousOptimizationLoop[]): AutonomousOptimizationLoop[] {
  return loops
    .filter((loop) => loop.priority === "critical" || loop.priority === "high")
    .sort((a, b) => b.expectedImpactMad - a.expectedImpactMad);
}

export function getTopGrowthScenarios(scenarios: GrowthSimulationScenario[]): GrowthSimulationScenario[] {
  return [...scenarios].sort((a, b) => b.expectedRevenueMad - a.expectedRevenueMad);
}

export function getGovernanceBlocks(items: AutonomousGovernanceItem[]): AutonomousGovernanceItem[] {
  return items.filter((item) => item.autoBlocked || item.requiredHumanApproval);
}

export function getAutonomousGrowthMetrics(snapshot: AutonomousGrowthSnapshot): AutonomousGrowthMetrics {
  const activeOptimizationLoops = snapshot.optimizationLoops.filter((loop) => loop.status !== "completed" && loop.status !== "blocked").length;
  const criticalOptimizations = getCriticalOptimizationLoops(snapshot.optimizationLoops).length;
  const expectedImpactMad = snapshot.optimizationLoops.reduce((sum, loop) => sum + loop.expectedImpactMad, 0);
  const autonomousBlockedItems = snapshot.governance.filter((item) => item.autoBlocked).length;
  const humanApprovalRequired = snapshot.governance.filter((item) => item.requiredHumanApproval).length;
  const topScenarioRevenueMad = getTopGrowthScenarios(snapshot.simulations)[0]?.expectedRevenueMad ?? 0;

  const confidenceAverage =
    snapshot.optimizationLoops.length === 0
      ? 0
      : Math.round(snapshot.optimizationLoops.reduce((sum, loop) => sum + loop.confidenceScore, 0) / snapshot.optimizationLoops.length);

  const automationReadinessScore = Math.max(
    0,
    Math.min(100, Math.round(confidenceAverage + criticalOptimizations * 3 - autonomousBlockedItems * 8 - humanApprovalRequired * 4))
  );

  return {
    activeOptimizationLoops,
    criticalOptimizations,
    expectedImpactMad,
    autonomousBlockedItems,
    humanApprovalRequired,
    topScenarioRevenueMad,
    automationReadinessScore,
  };
}
