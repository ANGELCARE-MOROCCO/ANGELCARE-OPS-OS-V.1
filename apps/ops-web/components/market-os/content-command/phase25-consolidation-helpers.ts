import type {
  Phase25IntegrityCheck,
  Phase25WorkspaceCategory,
  Phase25WorkspaceManifestItem,
} from './phase25-consolidation-types';

export function getPhase25ActiveWorkspaces(items: Phase25WorkspaceManifestItem[]): Phase25WorkspaceManifestItem[] {
  return items.filter((item) => item.active);
}

export function getPhase25WorkspacesByCategory(
  items: Phase25WorkspaceManifestItem[],
  category: Phase25WorkspaceCategory
): Phase25WorkspaceManifestItem[] {
  return items.filter((item) => item.category === category);
}

export function getPhase25FailedIntegrityChecks(checks: Phase25IntegrityCheck[]): Phase25IntegrityCheck[] {
  return checks.filter((check) => !check.passed);
}

export function getPhase25BuildSafePercent(items: Phase25WorkspaceManifestItem[]): number {
  if (items.length === 0) return 0;
  const buildSafe = items.filter((item) => item.buildSafe).length;
  return Math.round((buildSafe / items.length) * 100);
}