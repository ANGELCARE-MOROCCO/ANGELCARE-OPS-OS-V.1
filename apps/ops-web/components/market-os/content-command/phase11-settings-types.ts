export type Phase11ConfigScope =
  | 'statuses'
  | 'priorities'
  | 'languages'
  | 'channels'
  | 'content_types'
  | 'governance'
  | 'sla';

export interface Phase11ConfigOption {
  id: string;
  scope: Phase11ConfigScope;
  label: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
}

export interface Phase11GovernanceRule {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Phase11SlaRule {
  id: string;
  title: string;
  targetHours: number;
  appliesTo: string;
  enabled: boolean;
}

export interface Phase11SettingsValidation {
  valid: boolean;
  warnings: string[];
}