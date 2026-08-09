export type Phase34ExecutionState =
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'completed'
  | 'failed';

export type Phase34ExecutionPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Phase34ExecutionRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase34ExecutionTask {
  id: string;
  title: string;
  campaign: string;
  owner: string;
  state: Phase34ExecutionState;
  priority: Phase34ExecutionPriority;
  dueLabel: string;
  slaHours: number;
  elapsedHours: number;
  dependencies: string[];
}

export interface Phase34DependencyBlocker {
  id: string;
  taskId: string;
  blocker: string;
  severity: Phase34ExecutionRisk;
  blockingSince: string;
  recommendedAction: string;
}

export interface Phase34EscalationTrigger {
  id: string;
  trigger: string;
  condition: string;
  escalateTo: string;
  enabled: boolean;
}

export interface Phase34OperatorLoad {
  id: string;
  operator: string;
  activeTasks: number;
  urgentTasks: number;
  capacityPercent: number;
}

export interface Phase34ExecutionHealth {
  label: string;
  score: number;
  risk: Phase34ExecutionRisk;
  recommendation: string;
}