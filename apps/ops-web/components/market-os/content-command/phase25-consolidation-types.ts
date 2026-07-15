export type Phase25WorkspaceCategory =
  | 'foundation'
  | 'operations'
  | 'governance'
  | 'analytics'
  | 'ai'
  | 'publishing'
  | 'executive'
  | 'qa';

export interface Phase25WorkspaceManifestItem {
  id: string;
  phase: number;
  title: string;
  category: Phase25WorkspaceCategory;
  description: string;
  active: boolean;
  buildSafe: boolean;
}

export interface Phase25ActivationMapItem {
  id: string;
  importName: string;
  importPath: string;
  recommendedPlacement: string;
}

export interface Phase25IntegrityCheck {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
}

export interface Phase25ModuleSummary {
  label: string;
  value: string;
  detail: string;
}