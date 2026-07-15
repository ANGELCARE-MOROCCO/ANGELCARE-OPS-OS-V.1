export type Phase27RouteKey =
  | 'overview'
  | 'operations'
  | 'management'
  | 'media'
  | 'publishing'
  | 'analytics'
  | 'ai'
  | 'collaboration'
  | 'qa'
  | 'executive'
  | 'consolidation';

export interface Phase27RouteConfig {
  key: Phase27RouteKey;
  label: string;
  description: string;
  componentName: string;
  enabled: boolean;
  order: number;
}

export interface Phase27ActivationStatus {
  key: Phase27RouteKey;
  mounted: boolean;
  buildSafe: boolean;
  notes: string;
}