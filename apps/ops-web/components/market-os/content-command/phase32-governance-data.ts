import type {
  Phase32ActionPermission,
  Phase32ApprovalAuthority,
  Phase32GovernancePolicy,
  Phase32GovernanceReadiness,
  Phase32PermissionMatrixRow,
  Phase32VisibilityScope,
} from './phase32-governance-types';

export const phase32PermissionMatrix: Phase32PermissionMatrixRow[] = [
  {
    role: 'viewer',
    description: 'Can inspect approved or visible workspace content.',
    capabilities: ['view_content'],
  },
  {
    role: 'creator',
    description: 'Can create content and edit owned drafts.',
    capabilities: ['view_content', 'create_content', 'edit_own_content', 'request_approval', 'run_ai_actions'],
  },
  {
    role: 'reviewer',
    description: 'Can review submitted content and request revisions.',
    capabilities: ['view_content', 'request_approval', 'approve_content', 'reject_content', 'view_analytics'],
  },
  {
    role: 'publisher',
    description: 'Can schedule and publish approved content.',
    capabilities: ['view_content', 'publish_content', 'view_analytics'],
  },
  {
    role: 'brand_manager',
    description: 'Controls brand assets, brand validation, and brand compliance decisions.',
    capabilities: ['view_content', 'approve_content', 'reject_content', 'manage_brand_assets', 'view_audit_log'],
  },
  {
    role: 'marketing_director',
    description: 'Owns operational command decisions, escalation routing, and workflow authority.',
    capabilities: [
      'view_content',
      'edit_all_content',
      'approve_content',
      'reject_content',
      'publish_content',
      'view_analytics',
      'view_audit_log',
      'override_workflow',
      'transfer_ownership',
    ],
  },
  {
    role: 'executive',
    description: 'Can inspect executive command views and approve high-risk decisions.',
    capabilities: ['view_content', 'view_analytics', 'view_audit_log', 'override_workflow'],
  },
  {
    role: 'admin',
    description: 'Full configuration and governance control.',
    capabilities: [
      'view_content',
      'create_content',
      'edit_own_content',
      'edit_all_content',
      'request_approval',
      'approve_content',
      'reject_content',
      'publish_content',
      'manage_brand_assets',
      'run_ai_actions',
      'view_analytics',
      'view_audit_log',
      'override_workflow',
      'transfer_ownership',
      'configure_workspace',
    ],
  },
];

export const phase32ActionPermissions: Phase32ActionPermission[] = [
  {
    id: 'perm-create-asset',
    action: 'Create content asset',
    requiredCapability: 'create_content',
    minimumRole: 'creator',
    risk: 'medium',
  },
  {
    id: 'perm-approve-content',
    action: 'Approve content',
    requiredCapability: 'approve_content',
    minimumRole: 'reviewer',
    risk: 'high',
  },
  {
    id: 'perm-publish-content',
    action: 'Publish content',
    requiredCapability: 'publish_content',
    minimumRole: 'publisher',
    risk: 'critical',
  },
  {
    id: 'perm-brand-assets',
    action: 'Manage brand assets',
    requiredCapability: 'manage_brand_assets',
    minimumRole: 'brand_manager',
    risk: 'high',
  },
  {
    id: 'perm-override-workflow',
    action: 'Override workflow',
    requiredCapability: 'override_workflow',
    minimumRole: 'marketing_director',
    risk: 'critical',
  },
  {
    id: 'perm-configure',
    action: 'Configure workspace',
    requiredCapability: 'configure_workspace',
    minimumRole: 'admin',
    risk: 'critical',
  },
];

export const phase32ApprovalAuthorities: Phase32ApprovalAuthority[] = [
  {
    id: 'authority-brand',
    area: 'Brand Governance',
    requiredRole: 'brand_manager',
    canEscalateTo: 'marketing_director',
    notes: 'Brand assets and visual identity decisions require brand authority.',
  },
  {
    id: 'authority-publishing',
    area: 'Publishing Handoff',
    requiredRole: 'publisher',
    canEscalateTo: 'marketing_director',
    notes: 'Only publishing-authorized users can move approved content toward publication.',
  },
  {
    id: 'authority-executive-risk',
    area: 'High-risk Campaign Decisions',
    requiredRole: 'marketing_director',
    canEscalateTo: 'executive',
    notes: 'Critical campaign or reputation-risk decisions can escalate to executive view.',
  },
];

export const phase32VisibilityScopes: Phase32VisibilityScope[] = [
  {
    id: 'scope-approved',
    scope: 'Approved content',
    allowedRoles: ['viewer', 'creator', 'reviewer', 'publisher', 'brand_manager', 'marketing_director', 'executive', 'admin'],
    notes: 'Approved content can be visible to all authorized workspace users.',
  },
  {
    id: 'scope-drafts',
    scope: 'Draft content',
    allowedRoles: ['creator', 'reviewer', 'brand_manager', 'marketing_director', 'admin'],
    notes: 'Draft visibility should remain limited to operational roles.',
  },
  {
    id: 'scope-audit',
    scope: 'Audit logs',
    allowedRoles: ['brand_manager', 'marketing_director', 'executive', 'admin'],
    notes: 'Audit visibility should be restricted to governance roles.',
  },
  {
    id: 'scope-config',
    scope: 'Workspace configuration',
    allowedRoles: ['admin'],
    notes: 'Configuration should remain admin-only.',
  },
];

export const phase32GovernancePolicies: Phase32GovernancePolicy[] = [
  {
    id: 'policy-no-publish-without-approval',
    title: 'No publishing without approval',
    description: 'Content must reach approved state before entering publishing handoff.',
    risk: 'critical',
    enabled: true,
  },
  {
    id: 'policy-audit-mutations',
    title: 'Audit all mutations',
    description: 'Create, update, archive, approve, reject, and publish actions must emit audit events.',
    risk: 'high',
    enabled: true,
  },
  {
    id: 'policy-brand-before-publication',
    title: 'Brand validation before publication',
    description: 'Brand-sensitive content must pass brand governance before scheduling.',
    risk: 'high',
    enabled: true,
  },
  {
    id: 'policy-ai-human-review',
    title: 'AI outputs require human review',
    description: 'AI-generated content should not publish without human validation.',
    risk: 'high',
    enabled: true,
  },
];

export const phase32GovernanceReadiness: Phase32GovernanceReadiness[] = [
  {
    label: 'Permission Matrix',
    percent: 91,
    blocker: 'Ready as a planning model; actual auth mapping still pending.',
  },
  {
    label: 'Action Permissions',
    percent: 88,
    blocker: 'Needs connection to live user roles later.',
  },
  {
    label: 'Approval Authority',
    percent: 86,
    blocker: 'Final org role naming may need adjustment.',
  },
  {
    label: 'Visibility Scopes',
    percent: 83,
    blocker: 'Requires final RLS implementation.',
  },
  {
    label: 'Governance Policies',
    percent: 90,
    blocker: 'Policy enforcement needs backend integration later.',
  },
];