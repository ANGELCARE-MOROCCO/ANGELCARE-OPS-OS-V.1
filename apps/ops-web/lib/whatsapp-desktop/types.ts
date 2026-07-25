export type JsonRecord = Record<string, unknown>

export type WhatsAppWorkspaceStatus = "draft" | "active" | "suspended" | "retired"
export type WhatsAppWorkspaceSecurity = "standard" | "sensitive" | "executive"
export type WhatsAppAssignmentRole = "owner" | "administrator" | "supervisor" | "operator" | "auditor"
export type WhatsAppAssignmentStatus = "pending" | "active" | "suspended" | "revoked" | "expired"
export type WhatsAppDeviceApproval = "pending" | "approved" | "rejected" | "suspended" | "revoked" | "compromised"
export type WhatsAppLinkState = "unknown" | "not_linked" | "qr_required" | "linked" | "logged_out"
export type WhatsAppGovernanceSyncStatus = "synchronized" | "pending" | "drift" | "offline" | "blocked" | "unknown" | "error"
export type WhatsAppRemoteCommand =
  | "HIDE_WHATSAPP_VIEW"
  | "SHOW_ACCESS_REVOKED_NOTICE"
  | "RELOAD_WHATSAPP_VIEW"
  | "RESTART_WHATSAPP_RENDERER"
  | "CLEAR_WHATSAPP_CACHE"
  | "CLEAR_WHATSAPP_SESSION"
  | "REFRESH_AUTHORIZATION"
  | "LOG_OUT_ANGELCARE_DESKTOP"

export interface WhatsAppDesktopPolicy {
  id?: string
  workspace_id: string
  lease_duration_minutes: number
  offline_grace_minutes: number
  heartbeat_active_seconds: number
  heartbeat_background_seconds: number
  maximum_users: number
  maximum_devices_per_user: number
  require_new_device_approval: boolean
  clear_session_on_revocation: boolean
  allow_downloads: boolean
  allow_uploads: boolean
  allow_microphone: boolean
  allow_camera: boolean
  allow_notifications: boolean
  allow_external_open: boolean
  allow_local_cache_clear: boolean
  allow_local_session_clear: boolean
  minimum_desktop_version: string
  blocked_versions: string[]
  policy_json?: JsonRecord
}

export interface WhatsAppDesktopWorkspace {
  id: string
  code: string
  name: string
  description: string | null
  phone_number_e164: string | null
  department: string | null
  owner_user_id: string
  status: WhatsAppWorkspaceStatus
  maximum_devices: number
  security_level: WhatsAppWorkspaceSecurity
  created_at: string
  updated_at: string
  policy?: WhatsAppDesktopPolicy | null
  assignment?: WhatsAppDesktopAssignment | null
}

export interface WhatsAppDesktopAssignment {
  id: string
  workspace_id: string
  user_id: string
  role: WhatsAppAssignmentRole
  permissions: string[]
  status: WhatsAppAssignmentStatus
  valid_from: string
  valid_until: string | null
  created_at: string
  updated_at: string
}

export interface WhatsAppDesktopDevice {
  id: string
  installation_id: string
  device_name: string
  platform: string
  architecture: string | null
  desktop_version: string | null
  operating_system_version: string | null
  registered_user_id: string
  current_user_id: string | null
  approval_status: WhatsAppDeviceApproval
  whatsapp_link_state: WhatsAppLinkState
  first_registered_at: string
  approved_at: string | null
  suspended_at?: string | null
  suspended_by?: string | null
  suspension_reason?: string | null
  restored_at?: string | null
  restored_by?: string | null
  revoked_at?: string | null
  revoked_by?: string | null
  revoke_reason?: string | null
  compromised_at?: string | null
  last_heartbeat_at: string | null
  last_seen_at: string | null
  last_ip?: string | null
  runtime_health: JsonRecord
  metadata: JsonRecord
  reported_state?: JsonRecord
  synchronization_status?: WhatsAppGovernanceSyncStatus
  governance_contract_version?: string | null
  desktop_build_number?: number | null
  last_configuration_pull_at?: string | null
  last_command_poll_at?: string | null
  last_authorization_refresh_at?: string | null
  last_whatsapp_lease_renewal_at?: string | null
  last_diagnostics_at?: string | null
  client_clock_at?: string | null
  clock_drift_seconds?: number | null
}

export interface WhatsAppAuthorizationResult {
  ok: boolean
  authorized: boolean
  reason: string
  lease?: {
    id: string
    token: string
    issued_at: string
    expires_at: string
    grace_expires_at: string
  } | null
  workspace?: WhatsAppDesktopWorkspace | null
  device?: WhatsAppDesktopDevice | null
  assignment?: WhatsAppDesktopAssignment | null
  policy?: WhatsAppDesktopPolicy | null
}

export interface WhatsAppGovernanceAdminOverview {
  capabilities?: Record<string, boolean>
  workspaces: WhatsAppDesktopWorkspace[]
  assignments: Array<WhatsAppDesktopAssignment & { workspace?: { name: string; code: string }; user?: JsonRecord }>
  devices: Array<WhatsAppDesktopDevice & { workspace_access?: JsonRecord[]; user?: JsonRecord }>
  requests: JsonRecord[]
  commands: JsonRecord[]
  security_events: JsonRecord[]
  audit_events: JsonRecord[]
  users: JsonRecord[]
  counts: Record<string, number>
}


export interface WhatsAppDeviceDesiredState extends JsonRecord {
  id?: string
  device_id: string
  desired_state: JsonRecord
  desired_revision: number
  desired_policy_id?: string | null
  desired_policy_version?: number
  desired_mode: "standard" | "focus" | "locked"
  desired_whatsapp_enabled: boolean
  desired_ac_plus_enabled: boolean
  desired_split_enabled: boolean
  desired_maximum_tabs: number
  reason?: string | null
  updated_at?: string
}

export interface WhatsAppGovernanceAlert extends JsonRecord {
  id: string
  device_id?: string | null
  workspace_id?: string | null
  alert_type: string
  severity: "informational" | "attention" | "high" | "critical"
  status: "open" | "acknowledged" | "resolved" | "dismissed"
  title: string
  description?: string | null
  assigned_to?: string | null
  evidence?: JsonRecord
  occurrences?: number
  first_detected_at?: string
  last_detected_at?: string
}

export interface WhatsAppControlPlaneDevice extends WhatsAppDesktopDevice {
  user?: Record<string, any> | null
  registered_user?: Record<string, any> | null
  workspace_access?: Array<Record<string, any>>
  desired_state?: WhatsAppDeviceDesiredState | null
  sync_assessment?: Record<string, any>
  effective_policy?: Record<string, any> | null
  pending_command_count?: number
  open_alert_count?: number
  active_session_count?: number
}

export interface WhatsAppControlPlaneCommand extends Record<string, any> {
  id: string
  device_id: string
  command_channel: "whatsapp" | "station"
  command_type: string
  status: string
  reason?: string | null
  issued_at?: string | null
  delivered_at?: string | null
  received_at?: string | null
  completed_at?: string | null
  failed_at?: string | null
  failure_reason?: string | null
  correlation_id?: string | null
  priority?: string | null
  retry_count?: number | null
  max_retries?: number | null
  device?: { id?: string; device_name?: string } | null
}

export interface WhatsAppControlPlaneOverview {
  release: Record<string, any>
  capabilities: Record<string, boolean>
  counts: Record<string, number>
  devices: WhatsAppControlPlaneDevice[]
  alerts: WhatsAppGovernanceAlert[]
  commands: WhatsAppControlPlaneCommand[]
  station_commands: Array<Record<string, any>>
  policies: Array<Record<string, any>>
  workspaces: Array<Record<string, any>>
  users: Array<Record<string, any>>
  migration_error?: string | null
}

export interface WhatsAppDeviceLifecycleDossier {
  device: WhatsAppDesktopDevice & { online: boolean; available_actions: string[] }
  workspace_access: JsonRecord[]
  sessions: JsonRecord[]
  commands: JsonRecord[]
  heartbeats: JsonRecord[]
  audit_events: JsonRecord[]
  security_events: JsonRecord[]
  desired_state?: WhatsAppDeviceDesiredState | null
  sync_assessment?: JsonRecord
  station_commands?: JsonRecord[]
  station_events?: JsonRecord[]
  alerts?: WhatsAppGovernanceAlert[]
}
