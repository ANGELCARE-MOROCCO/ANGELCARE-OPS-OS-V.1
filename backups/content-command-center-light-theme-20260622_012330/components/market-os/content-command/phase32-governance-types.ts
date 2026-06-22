export type Phase32Role =
  | 'viewer'
  | 'creator'
  | 'reviewer'
  | 'publisher'
  | 'brand_manager'
  | 'marketing_director'
  | 'executive'
  | 'admin';

export type Phase32Capability =
  | 'view_content'
  | 'create_content'
  | 'edit_own_content'
  | 'edit_all_content'
  | 'request_approval'
  | 'approve_content'
  | 'reject_content'
  | 'publish_content'
  | 'manage_brand_assets'
  | 'run_ai_actions'
  | 'view_analytics'
  | 'view_audit_log'
  | 'override_workflow'
  | 'transfer_ownership'
  | 'configure_workspace';

export type Phase32GovernanceRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase32PermissionMatrixRow {
  role: Phase32Role;
  capabilities: Phase32Capability[];
  description: string;
}

export interface Phase32ActionPermission {
  id: string;
  action: string;
  requiredCapability: Phase32Capability;
  minimumRole: Phase32Role;
  risk: Phase32GovernanceRisk;
}

export interface Phase32ApprovalAuthority {
  id: string;
  area: string;
  requiredRole: Phase32Role;
  canEscalateTo: Phase32Role;
  notes: string;
}

export interface Phase32VisibilityScope {
  id: string;
  scope: string;
  allowedRoles: Phase32Role[];
  notes: string;
}

export interface Phase32GovernancePolicy {
  id: string;
  title: string;
  description: string;
  risk: Phase32GovernanceRisk;
  enabled: boolean;
}

export interface Phase32GovernanceReadiness {
  label: string;
  percent: number;
  blocker: string;
}