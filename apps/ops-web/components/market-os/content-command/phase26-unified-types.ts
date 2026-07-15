export type Phase26WorkspaceKey =
  | 'overview'
  | 'operations'
  | 'management'
  | 'media'
  | 'publishing'
  | 'analytics'
  | 'ai'
  | 'collaboration'
  | 'qa'
  | 'executive';

export type Phase26WorkspaceStatus = 'ready' | 'review' | 'future';

export interface Phase26WorkspaceTab {
  key: Phase26WorkspaceKey;
  label: string;
  description: string;
  status: Phase26WorkspaceStatus;
  recommendedComponent: string;
  priority: number;
}

export interface Phase26CommandAction {
  id: string;
  label: string;
  description: string;
  workspace: Phase26WorkspaceKey;
  enabled: boolean;
}

export interface Phase26UnifiedFilterState {
  search: string;
  workspace: Phase26WorkspaceKey | 'all';
  status: Phase26WorkspaceStatus | 'all';
}

export interface Phase26WorkspaceHealth {
  workspace: Phase26WorkspaceKey;
  readiness: number;
  blockers: number;
  notes: string;
}

export interface Phase26ProductionState {
  loading: boolean;
  error: string | null;
  empty: boolean;
}