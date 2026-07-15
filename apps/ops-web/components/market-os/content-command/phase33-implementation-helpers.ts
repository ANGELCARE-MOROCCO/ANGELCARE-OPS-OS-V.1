import type {
  Phase33ConnectionScore,
  Phase33CutoverChecklistItem,
  Phase33Dependency,
  Phase33ReadinessItem,
} from './phase33-implementation-types';

export function getPhase33ReadyToConnect(items: Phase33ReadinessItem[]): Phase33ReadinessItem[] {
  return items.filter((item) => item.state === 'ready_to_connect');
}

export function getPhase33CriticalItems(items: Phase33ReadinessItem[]): Phase33ReadinessItem[] {
  return items.filter((item) => item.priority === 'critical');
}

export function getPhase33UnresolvedDependencies(items: Phase33Dependency[]): Phase33Dependency[] {
  return items.filter((item) => !item.resolved);
}

export function getPhase33OpenCutoverItems(items: Phase33CutoverChecklistItem[]): Phase33CutoverChecklistItem[] {
  return items.filter((item) => !item.completed);
}

export function getPhase33AverageConnectionScore(items: Phase33ConnectionScore[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / items.length);
}