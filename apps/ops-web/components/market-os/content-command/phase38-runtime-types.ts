export type Phase38RuntimeLayer =
  | 'client_ui'
  | 'server_action'
  | 'api_route'
  | 'repository'
  | 'database'
  | 'storage'
  | 'ai_provider'
  | 'analytics_provider'
  | 'realtime_provider';

export type Phase38RuntimeStatus =
  | 'mocked'
  | 'contract_ready'
  | 'ready_to_wire'
  | 'wired'
  | 'blocked';

export type Phase38MutationSafety =
  | 'read_only'
  | 'optimistic_with_rollback'
  | 'server_confirmed'
  | 'human_approved'
  | 'blocked';

export type Phase38RuntimeRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase38RuntimeAdapter {
  id: string;
  layer: Phase38RuntimeLayer;
  name: string;
  status: Phase38RuntimeStatus;
  risk: Phase38RuntimeRisk;
  boundary: 'client' | 'server' | 'database' | 'external';
  nextStep: string;
}

export interface Phase38MutationBlueprint {
  id: string;
  mutationName: string;
  entity: string;
  safety: Phase38MutationSafety;
  requiresAudit: boolean;
  requiresPermission: boolean;
  rollbackStrategy: string;
}

export interface Phase38RuntimeEvent {
  id: string;
  eventName: string;
  emittedBy: string;
  consumedBy: string[];
  persistenceRequired: boolean;
  notes: string;
}

export interface Phase38CutoverStage {
  id: string;
  stage: string;
  description: string;
  readiness: number;
  blockedBy: string[];
}

export interface Phase38RuntimeGuardrail {
  id: string;
  title: string;
  protection: string;
  enabled: boolean;
  riskReduced: Phase38RuntimeRisk;
}

export interface Phase38RuntimeScore {
  label: string;
  score: number;
  status: Phase38RuntimeStatus;
  recommendation: string;
}