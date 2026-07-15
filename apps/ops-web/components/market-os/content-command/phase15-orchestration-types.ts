export interface Phase15PipelineStep {
  id: string;
  title: string;
  owner: string;
  status: 'pending' | 'active' | 'blocked' | 'completed';
  dependencyCount: number;
}

export interface Phase15ReleaseGate {
  id: string;
  title: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface Phase15EscalationRoute {
  id: string;
  area: string;
  escalationOwner: string;
  trigger: string;
}