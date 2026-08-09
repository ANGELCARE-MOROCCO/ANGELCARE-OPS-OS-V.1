export type TenantAccessAccountStatus =
  | 'draft'
  | 'invitation_pending'
  | 'invited'
  | 'activation_pending'
  | 'active'
  | 'locked'
  | 'suspended'
  | 'expired'
  | 'revoked'

export type TenantAccessRoleTemplate =
  | 'tenant_owner'
  | 'general_direction'
  | 'school_admin'
  | 'finance_admin'
  | 'operations_admin'
  | 'academic_admin'
  | 'hr_admin'
  | 'support_contact'
  | 'auditor'
  | 'custom'

export interface TenantRoleTemplateRecord {
  id: string
  role_key: TenantAccessRoleTemplate | string
  name: string
  description?: string | null
  permissions: string[]
  denied_permissions: string[]
  module_keys: string[]
  require_mfa: boolean
  is_system: boolean
  status: string
}

export interface TenantAccessAccountRecord {
  id: string
  client_id: string
  tenant_id: string
  app_user_id?: string | null
  membership_id?: string | null
  school_user_role_id?: string | null
  school_id?: string | null
  organization_id?: string | null
  campus_id?: string | null
  full_name: string
  email: string
  phone?: string | null
  job_title?: string | null
  preferred_language: string
  role_template: TenantAccessRoleTemplate | string
  status: TenantAccessAccountStatus | string
  is_primary_owner: boolean
  scope_mode: string
  module_keys: string[]
  explicit_permissions: string[]
  denied_permissions: string[]
  security_policy: Record<string, unknown>
  access_starts_at?: string | null
  access_expires_at?: string | null
  invited_at?: string | null
  activated_at?: string | null
  last_login_at?: string | null
  last_security_event_at?: string | null
  mfa_enrolled_at?: string | null
  mfa_last_verified_at?: string | null
  created_at: string
  updated_at: string
  client?: Record<string, unknown> | null
  tenant?: Record<string, unknown> | null
}

export interface TenantAccessInvitationRecord {
  id: string
  access_account_id: string
  email: string
  status: string
  delivery_status: string
  expires_at: string
  sent_at?: string | null
  opened_at?: string | null
  accepted_at?: string | null
  cancelled_at?: string | null
  created_at: string
}

export interface TenantAccessScopeRecord {
  id: string
  access_account_id: string
  scope_type: string
  scope_id?: string | null
  scope_label: string
  access_level: string
  created_at: string
}

export interface TenantAccessEventRecord {
  id: string
  access_account_id?: string | null
  client_id?: string | null
  tenant_id?: string | null
  event_type: string
  severity: string
  summary: string
  metadata: Record<string, unknown>
  actor_user_id?: string | null
  created_at: string
}

export interface TenantSupportAccessSessionRecord {
  id: string
  client_id: string
  tenant_id: string
  operator_user_id: string
  access_mode: string
  reason: string
  status: string
  starts_at: string
  expires_at: string
  ended_at?: string | null
  approved_by?: string | null
  created_at: string
}

export interface TenantOwnerTransferRecord {
  id: string
  tenant_id: string
  from_access_account_id?: string | null
  to_access_account_id: string
  status: string
  effective_at?: string | null
  reason: string
  created_at: string
}


export interface TenantUserSessionRecord {
  user_id: string
  created_at?: string | null
  expires_at?: string | null
  mfa_verified_at?: string | null
  device_label?: string | null
  ip_address?: string | null
  user_agent?: string | null
  last_seen_at?: string | null
}

export interface TenantAccessSnapshot {
  accounts: TenantAccessAccountRecord[]
  invitations: TenantAccessInvitationRecord[]
  scopes: TenantAccessScopeRecord[]
  events: TenantAccessEventRecord[]
  roleTemplates: TenantRoleTemplateRecord[]
  permissionCatalog: Array<{ permission_key: string; domain_key: string; action_key: string; label: string; description?: string | null; risk_level?: string | null }>
  supportSessions: TenantSupportAccessSessionRecord[]
  ownerTransfers: TenantOwnerTransferRecord[]
  clients: Array<Record<string, unknown>>
  tenants: Array<Record<string, unknown>>
  schools: Array<Record<string, unknown>>
  campuses: Array<Record<string, unknown>>
  sessions: TenantUserSessionRecord[]
  entitlementSnapshots: Array<Record<string, unknown>>
  entitlementItems: Array<Record<string, unknown>>
  activeSessionCounts: Record<string, number>
}
