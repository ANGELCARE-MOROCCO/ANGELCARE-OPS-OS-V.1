export type Phase30MigrationStage =
  | 'schema'
  | 'indexes'
  | 'relationships'
  | 'rls'
  | 'audit'
  | 'seed'
  | 'verification';

export type Phase30MigrationRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase30MigrationStep {
  id: string;
  stage: Phase30MigrationStage;
  title: string;
  sqlObject: string;
  order: number;
  risk: Phase30MigrationRisk;
  ready: boolean;
  notes: string;
}

export interface Phase30SqlBlueprint {
  id: string;
  title: string;
  tableName: string;
  sqlPreview: string;
  safeToRun: boolean;
}

export interface Phase30DependencyPlan {
  id: string;
  objectName: string;
  dependsOn: string[];
  reason: string;
}

export interface Phase30RolloutChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  blocker: string;
}