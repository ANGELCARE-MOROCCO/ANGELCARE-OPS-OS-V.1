export type Phase37AutonomyLevel =
  | 'observe_only'
  | 'recommend_only'
  | 'human_approved_execution'
  | 'limited_auto_execution'
  | 'blocked';

export type Phase37SafetyRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase37HumanGate {
  id: string;
  gate: string;
  appliesTo: string;
  requiredRole: string;
  risk: Phase37SafetyRisk;
  mandatory: boolean;
}

export interface Phase37AutonomyBoundary {
  id: string;
  actionType: string;
  autonomyLevel: Phase37AutonomyLevel;
  maxAllowedRisk: Phase37SafetyRisk;
  notes: string;
}

export interface Phase37SafetyCheck {
  id: string;
  title: string;
  category: 'brand' | 'publishing' | 'ai' | 'data' | 'permissions' | 'audit';
  passed: boolean;
  required: boolean;
  recommendation: string;
}

export interface Phase37RollbackPlan {
  id: string;
  scenario: string;
  rollbackOwner: string;
  steps: string[];
  ready: boolean;
}

export interface Phase37AutonomyReadiness {
  label: string;
  score: number;
  risk: Phase37SafetyRisk;
  blocker: string;
}