import type {
  Phase26ProductionState,
  Phase26UnifiedFilterState,
  Phase26WorkspaceHealth,
  Phase26WorkspaceTab,
} from './phase26-unified-types';

export function getPhase26OrderedTabs(tabs: Phase26WorkspaceTab[]): Phase26WorkspaceTab[] {
  return [...tabs].sort((a, b) => a.priority - b.priority);
}

export function filterPhase26Tabs(
  tabs: Phase26WorkspaceTab[],
  filter: Phase26UnifiedFilterState
): Phase26WorkspaceTab[] {
  return tabs.filter((tab) => {
    const searchMatch =
      filter.search.trim().length === 0 ||
      tab.label.toLowerCase().includes(filter.search.toLowerCase()) ||
      tab.description.toLowerCase().includes(filter.search.toLowerCase());

    const workspaceMatch = filter.workspace === 'all' || tab.key === filter.workspace;
    const statusMatch = filter.status === 'all' || tab.status === filter.status;

    return searchMatch && workspaceMatch && statusMatch;
  });
}

export function getPhase26OverallReadiness(items: Phase26WorkspaceHealth[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.readiness, 0);
  return Math.round(total / items.length);
}

export function getPhase26TotalBlockers(items: Phase26WorkspaceHealth[]): number {
  return items.reduce((sum, item) => sum + item.blockers, 0);
}

export function getPhase26ProductionStateLabel(state: Phase26ProductionState): string {
  if (state.loading) return 'Loading';
  if (state.error) return 'Error';
  if (state.empty) return 'Empty';
  return 'Ready';
}