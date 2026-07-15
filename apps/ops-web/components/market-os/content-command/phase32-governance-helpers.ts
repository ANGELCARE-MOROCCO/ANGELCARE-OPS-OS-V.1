import type {
  Phase32ActionPermission,
  Phase32GovernancePolicy,
  Phase32GovernanceReadiness,
  Phase32GovernanceRisk,
  Phase32PermissionMatrixRow,
  Phase32Role,
} from './phase32-governance-types';

export function getPhase32CapabilitiesForRole(
  matrix: Phase32PermissionMatrixRow[],
  role: Phase32Role
): string[] {
  return matrix.find((row) => row.role === role)?.capabilities ?? [];
}

export function getPhase32HighRiskActions(
  actions: Phase32ActionPermission[]
): Phase32ActionPermission[] {
  return actions.filter((action) => action.risk === 'high' || action.risk === 'critical');
}

export function getPhase32EnabledPolicies(
  policies: Phase32GovernancePolicy[]
): Phase32GovernancePolicy[] {
  return policies.filter((policy) => policy.enabled);
}

export function getPhase32AverageGovernanceReadiness(
  items: Phase32GovernanceReadiness[]
): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.percent, 0);
  return Math.round(total / items.length);
}

export function getPhase32RiskRank(risk: Phase32GovernanceRisk): number {
  const rank: Record<Phase32GovernanceRisk, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return rank[risk];
}