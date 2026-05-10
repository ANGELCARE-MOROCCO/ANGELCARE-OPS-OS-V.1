import type {
  Phase30MigrationRisk,
  Phase30MigrationStep,
  Phase30RolloutChecklistItem,
  Phase30SqlBlueprint,
} from './phase30-migration-types';

export function getPhase30OrderedSteps(steps: Phase30MigrationStep[]): Phase30MigrationStep[] {
  return [...steps].sort((a, b) => a.order - b.order);
}

export function getPhase30BlockedSteps(steps: Phase30MigrationStep[]): Phase30MigrationStep[] {
  return steps.filter((step) => !step.ready);
}

export function getPhase30UnsafeSql(blueprints: Phase30SqlBlueprint[]): Phase30SqlBlueprint[] {
  return blueprints.filter((blueprint) => !blueprint.safeToRun);
}

export function getPhase30IncompleteChecklist(items: Phase30RolloutChecklistItem[]): Phase30RolloutChecklistItem[] {
  return items.filter((item) => !item.completed);
}

export function getPhase30RiskRank(risk: Phase30MigrationRisk): number {
  const rank: Record<Phase30MigrationRisk, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return rank[risk];
}