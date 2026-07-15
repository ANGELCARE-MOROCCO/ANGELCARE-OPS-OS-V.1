export type Phase23QaSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Phase23SafetyGate {
  id: string;
  title: string;
  area: string;
  severity: Phase23QaSeverity;
  passed: boolean;
  recommendation: string;
}

export interface Phase23FallbackState {
  id: string;
  component: string;
  fallbackType: 'empty' | 'loading' | 'error' | 'permission' | 'offline';
  implemented: boolean;
}

export interface Phase23AuditCheck {
  id: string;
  title: string;
  category: 'typescript' | 'scope' | 'ui' | 'data' | 'workflow';
  passed: boolean;
}

export interface Phase23ReadinessScore {
  label: string;
  score: number;
}