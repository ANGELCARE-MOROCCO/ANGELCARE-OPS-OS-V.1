export type Phase39RuntimeReadinessState =
  | 'not_started'
  | 'ready_to_wire'
  | 'needs_review'
  | 'blocked'
  | 'complete';

export type Phase39RuntimeArea =
  | 'environment'
  | 'supabase'
  | 'repository'
  | 'server_action'
  | 'crud'
  | 'audit'
  | 'permissions'
  | 'qa';

export type Phase39ActivationRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase39EnvironmentCheck {
  id: string;
  key: string;
  required: boolean;
  purpose: string;
  safeClientExposure: boolean;
}

export interface Phase39LiveRepositoryContract {
  id: string;
  entity: string;
  tableName: string;
  requiredMethods: string[];
  state: Phase39RuntimeReadinessState;
  risk: Phase39ActivationRisk;
}

export interface Phase39ServerActionScaffold {
  id: string;
  actionName: string;
  mutationType: 'create' | 'update' | 'archive' | 'approve' | 'publish' | 'ai_execute';
  serverOnly: boolean;
  requiresAudit: boolean;
  requiresPermission: boolean;
  state: Phase39RuntimeReadinessState;
}

export interface Phase39ActivationStep {
  id: string;
  area: Phase39RuntimeArea;
  title: string;
  order: number;
  state: Phase39RuntimeReadinessState;
  risk: Phase39ActivationRisk;
  instruction: string;
}

export interface Phase39RuntimeRiskItem {
  id: string;
  risk: string;
  severity: Phase39ActivationRisk;
  mitigation: string;
}

export interface Phase39ActivationScore {
  label: string;
  score: number;
  blocker: string;
}