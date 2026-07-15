export type FactoryStatus = 'operational' | 'warning' | 'critical' | 'maintenance' | 'disabled'
export type FactoryScope = 'global' | 'module' | 'tenant' | 'user'

export type FactoryPageKey =
  | 'executive'
  | 'observatory'
  | 'modules'
  | 'configuration'
  | 'options'
  | 'actions'
  | 'apis'
  | 'supabase'
  | 'realtime'
  | 'incidents'
  | 'permissions'
  | 'feature-flags'
  | 'rules'
  | 'data-sources'
  | 'queues'
  | 'tenants'
  | 'deployment'
  | 'audit'

export type FactoryModule = {
  id?: string
  key: string
  label: string
  description?: string | null
  route_prefix?: string | null
  owner_team?: string | null
  status: FactoryStatus | string
  visibility?: 'visible' | 'hidden' | 'locked' | string
  rollout_stage?: 'draft' | 'beta' | 'production' | 'maintenance' | string
  requires_realtime?: boolean
  requires_external_service?: boolean
  metadata_json?: Record<string, unknown>
  last_health_status?: string | null
  last_health_checked_at?: string | null
  created_at?: string
  updated_at?: string
}

export type FactoryOptionGroup = {
  id?: string
  key: string
  label: string
  description?: string | null
  module_scope?: string[]
  is_global?: boolean
  is_system_locked?: boolean
  is_enabled?: boolean
}

export type FactoryOption = {
  id?: string
  group_key: string
  value: string
  label: string
  description?: string | null
  sort_order?: number
  color?: string | null
  icon?: string | null
  metadata_json?: Record<string, unknown>
  availability_scope?: string[]
  is_default?: boolean
  is_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export type FactoryFeatureFlag = {
  id?: string
  key: string
  label: string
  description?: string | null
  module_key: string
  status: 'enabled' | 'disabled' | 'beta' | 'locked' | string
  rollout_stage?: string | null
  rollout_percent?: number
  is_emergency_locked?: boolean
  metadata_json?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type FactoryIncident = {
  id?: string
  title: string
  description?: string | null
  module_key?: string | null
  severity: 'info' | 'warning' | 'critical' | string
  status: 'open' | 'investigating' | 'resolved' | 'muted' | string
  owner?: string | null
  source?: string | null
  metadata_json?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type FactoryAction = {
  id?: string
  module_key: string
  page_path: string
  component_name?: string | null
  action_key: string
  action_label: string
  action_type: 'button' | 'modal' | 'form' | 'api' | 'server_action' | 'nav' | string
  target_api?: string | null
  target_table?: string | null
  permission_required?: string | null
  status: FactoryStatus | 'live' | 'partial' | 'dead' | 'blocked' | 'unknown' | string
  is_critical?: boolean
  last_tested_at?: string | null
  last_error?: string | null
}

export type FactoryApi = {
  id?: string
  route: string
  module_key: string
  method?: string
  status: FactoryStatus | string
  latency_ms?: number | null
  owner_team?: string | null
  last_checked_at?: string | null
  last_error?: string | null
}

export type FactoryAuditEvent = {
  id?: string
  event_type: string
  title: string
  actor?: string | null
  module_key?: string | null
  severity?: string | null
  metadata_json?: Record<string, unknown>
  created_at?: string
}

export type FactoryOverview = {
  counts: {
    modules: number
    options: number
    featureFlags: number
    incidents: number
    actions: number
    apis: number
    auditEvents: number
  }
  modules: FactoryModule[]
  optionGroups: FactoryOptionGroup[]
  options: FactoryOption[]
  featureFlags: FactoryFeatureFlag[]
  incidents: FactoryIncident[]
  actions: FactoryAction[]
  apis: FactoryApi[]
  auditEvents: FactoryAuditEvent[]
}
