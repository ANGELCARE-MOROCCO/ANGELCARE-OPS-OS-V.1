export type AcCapitalOsWorkspaceStatus =
  | 'foundation-ready'
  | 'contracted-next'
  | 'requires-backend-activation'
  | 'requires-ai-activation'
  | 'locked-future-zip';

export type AcCapitalOsRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AcCapitalOsWorkspaceKey =
  | 'executive-cockpit'
  | 'capital-radar'
  | 'qualification-engine'
  | 'funder-intelligence'
  | 'case-builder'
  | 'data-room'
  | 'capital-pipeline'
  | 'coordinator-cockpit'
  | 'doctrine-vault'
  | 'ai-command-center'
  | 'strategy-simulator'
  | 'reports'
  | 'manual-sop'
  | 'settings';

export interface AcCapitalOsWorkspace {
  key: AcCapitalOsWorkspaceKey;
  name: string;
  route: string;
  universe: string;
  mission: string;
  status: AcCapitalOsWorkspaceStatus;
  accent: 'navy' | 'blue' | 'teal' | 'green' | 'amber' | 'red' | 'purple';
  protected: boolean;
  megaZip: number;
  frontEndObligation: string;
  backEndObligation: string;
  backofficeObligation: string;
}

export interface AcCapitalOsFoundationContract {
  moduleName: 'AC CAPITAL OS';
  route: '/ac-capital-os';
  signedBackend: boolean;
  signedFrontEnd: boolean;
  protectedInternalAccess: boolean;
  megaZip: number;
  mission: string;
  visualDoctrine: string;
}

export interface AcCapitalOsAuditEvent {
  id: string;
  module: 'AC CAPITAL OS';
  action: string;
  objectType: string;
  objectId?: string;
  actorId?: string;
  severity: AcCapitalOsRiskLevel;
  message: string;
  createdAt: string;
}

export interface AcCapitalOsRolePermission {
  role: 'founder' | 'capital-admin' | 'coordinator' | 'viewer' | 'ai-system';
  canView: boolean;
  canCreate: boolean;
  canApprove: boolean;
  canExecuteExternalCommunication: boolean;
  canInjectDoctrine: boolean;
  canManageAi: boolean;
}
