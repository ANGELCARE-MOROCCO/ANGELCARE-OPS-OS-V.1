export type Phase33ImplementationState =
  | 'mock'
  | 'ready_to_connect'
  | 'partially_connected'
  | 'live'
  | 'blocked';

export type Phase33ImplementationArea =
  | 'data'
  | 'api'
  | 'media'
  | 'ai'
  | 'analytics'
  | 'publishing'
  | 'realtime'
  | 'permissions'
  | 'qa';

export type Phase33Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Phase33ReadinessItem {
  id: string;
  area: Phase33ImplementationArea;
  title: string;
  state: Phase33ImplementationState;
  priority: Phase33Priority;
  nextStep: string;
}

export interface Phase33Dependency {
  id: string;
  title: string;
  dependsOn: string[];
  blocker: string;
  resolved: boolean;
}

export interface Phase33CutoverChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  risk: Phase33Priority;
}

export interface Phase33ConnectionScore {
  label: string;
  score: number;
  recommendation: string;
}