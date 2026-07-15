import type {
  AmbassadorEligibilityRule,
  AmbassadorProgram,
  AmbassadorProgramGovernanceItem,
  AmbassadorProgramSnapshot,
  AmbassadorTierRule,
} from "./ambassador-program-types";

export type AmbassadorProgramMetrics = {
  activePrograms: number;
  totalActiveAmbassadors: number;
  totalTargetAmbassadors: number;
  coveragePercent: number;
  activeRewardRules: number;
  criticalGovernanceItems: number;
  financeApprovalRuleCount: number;
  programReadinessScore: number;
};

export function calculateProgramCoverage(program: AmbassadorProgram): number {
  if (program.targetAmbassadors <= 0) return 0;
  return Math.round((program.activeAmbassadors / program.targetAmbassadors) * 100);
}

export function countActiveRewardRules(programs: AmbassadorProgram[]): number {
  return programs.reduce((sum, program) => {
    return sum + program.rewardRules.filter((rule) => rule.status === "active").length;
  }, 0);
}

export function countFinanceApprovalRules(programs: AmbassadorProgram[]): number {
  return programs.reduce((sum, program) => {
    return sum + program.rewardRules.filter((rule) => rule.financeApprovalRequired).length;
  }, 0);
}

export function getCriticalGovernanceItems(items: AmbassadorProgramGovernanceItem[]): AmbassadorProgramGovernanceItem[] {
  return items.filter((item) => item.severity === "critical" && item.status !== "resolved");
}

export function evaluateEligibility(
  rules: AmbassadorEligibilityRule[],
  metrics: Partial<Record<AmbassadorEligibilityRule["metric"], number>>,
): { passed: boolean; failedRules: AmbassadorEligibilityRule[] } {
  const failedRules = rules.filter((rule) => {
    const value = metrics[rule.metric];
    if (typeof value !== "number") return rule.required;

    if (rule.operator === "gte") return value < rule.value;
    if (rule.operator === "lte") return value > rule.value;
    return value !== rule.value;
  });

  return {
    passed: failedRules.length === 0,
    failedRules,
  };
}

export function getEligibleTier(
  tiers: AmbassadorTierRule[],
  metrics: { healthScore: number; approvedProofs: number; revenueMad: number },
): AmbassadorTierRule | undefined {
  return [...tiers]
    .sort((a, b) => b.minRevenueMad - a.minRevenueMad)
    .find((tier) => {
      return (
        metrics.healthScore >= tier.minHealthScore &&
        metrics.approvedProofs >= tier.minApprovedProofs &&
        metrics.revenueMad >= tier.minRevenueMad
      );
    });
}

export function getAmbassadorProgramMetrics(snapshot: AmbassadorProgramSnapshot): AmbassadorProgramMetrics {
  const activePrograms = snapshot.programs.filter((program) => program.status === "active").length;
  const totalActiveAmbassadors = snapshot.programs.reduce((sum, program) => sum + program.activeAmbassadors, 0);
  const totalTargetAmbassadors = snapshot.programs.reduce((sum, program) => sum + program.targetAmbassadors, 0);
  const coveragePercent = totalTargetAmbassadors <= 0 ? 0 : Math.round((totalActiveAmbassadors / totalTargetAmbassadors) * 100);
  const activeRewardRules = countActiveRewardRules(snapshot.programs);
  const criticalGovernanceItems = getCriticalGovernanceItems(snapshot.governance).length;
  const financeApprovalRuleCount = countFinanceApprovalRules(snapshot.programs);

  const base = activePrograms * 12 + coveragePercent + activeRewardRules * 4;
  const penalty = criticalGovernanceItems * 12 + financeApprovalRuleCount * 2;
  const programReadinessScore = Math.max(0, Math.min(100, Math.round(base / 2 - penalty + 35)));

  return {
    activePrograms,
    totalActiveAmbassadors,
    totalTargetAmbassadors,
    coveragePercent,
    activeRewardRules,
    criticalGovernanceItems,
    financeApprovalRuleCount,
    programReadinessScore,
  };
}
