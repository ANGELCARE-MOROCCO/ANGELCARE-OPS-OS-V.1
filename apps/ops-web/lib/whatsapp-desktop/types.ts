export type JsonRecord = Record<string, unknown>

export type WhatsAppWorkspaceStatus = "draft" | "active" | "suspended" | "retired"
export type WhatsAppWorkspaceSecurity = "standard" | "sensitive" | "executive"
export type WhatsAppAssignmentRole = "owner" | "administrator" | "supervisor" | "operator" | "auditor"
export type WhatsAppAssignmentStatus = "pending" | "active" | "suspended" | "revoked" | "expired"
export type WhatsAppDeviceApproval = "pending" | "approved" | "rejected" | "suspended" | "revoked" | "compromised"
export type WhatsAppLinkState = "unknown" | "not_linked" | "qr_required" | "linked" | "logged_out"
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
  last_heartbeat_at: string | null
  last_seen_at: string | null
  runtime_health: JsonRecord
  metadata: JsonRecord
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
