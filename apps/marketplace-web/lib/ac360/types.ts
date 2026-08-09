export type Ac360PackageKey = 'start' | 'pro' | 'command'
export type Ac360AccessMode = 'included' | 'limited' | 'metered' | 'read_only' | 'addon_locked' | 'enterprise_locked' | 'blocked'
export type Ac360DecisionCode = 'allowed' | 'blocked' | 'read_only' | 'upgrade_required' | 'topup_required' | 'no_subscription' | 'error'

export type Ac360Engine = {
  engine_code: string
  system_group: string
  engine_name: string
  purpose: string
  phase: string
  criticality: string
  implementation_status: string
  table_scope?: string[]
}

export type Ac360Feature = {
  id?: string
  feature_key: string
  module_key: string
  family: string
  label: string
  description?: string | null
  billing_family: string
  is_core: boolean
  is_billable: boolean
  is_enterprise_only: boolean
  default_meter_key?: string | null
  default_credit_cost?: number | null
  status: string
}

export type Ac360Plan = {
  id: string
  plan_key: Ac360PackageKey | string
  label: string
  commercial_name: string
  description?: string | null
  package_level: number
  public_monthly_price_mad: number
  public_annual_price_mad: number
  currency: string
  target_segment?: string | null
  position: number
}

export type Ac360Addon = {
  id: string
  addon_key: string
  label: string
  family: string
  description?: string | null
  billing_model: string
  monthly_price_mad: number
  setup_price_mad: number
  unit_label?: string | null
  cancellable: boolean
  status: string
}

export type Ac360Subscription = {
  id: string
  org_id: string
  plan_id: string
  plan_version_id: string
  subscription_code: string
  status: string
  billing_interval: string
  currency: string
  current_period_start?: string | null
  current_period_end?: string | null
  trial_ends_at?: string | null
  grace_ends_at?: string | null
}

export type Ac360UsageMeter = {
  meter_key: string
  label: string
  unit_label: string
  category: string
  default_credit_cost: number
  default_unit_price_mad: number
  aggregation: string
  reset_interval: string
  status: string
}

export type Ac360Restriction = {
  id: string
  org_id: string
  subscription_id?: string | null
  restriction_key: string
  status: string
  severity: string
  restriction_type: string
  target_feature_key?: string | null
  target_action_key?: string | null
  target_meter_key?: string | null
  behavior: string
  reason?: string | null
  starts_at: string
  ends_at?: string | null
}

export type Ac360AccessDecision = {
  allowed: boolean
  decision: Ac360DecisionCode | string
  reason: string
  source: string
  accessMode?: string | null
  limitKey?: string | null
  limitValue?: number | null
  activeSubscriptionId?: string | null
}

export type Ac360FoundationSnapshot = {
  ok: boolean
  migrated: boolean
  generatedAt: string
  error?: string
  counts: Record<string, number>
  engines: Ac360Engine[]
  plans: Ac360Plan[]
  features: Ac360Feature[]
  addons: Ac360Addon[]
  meters: Ac360UsageMeter[]
  subscriptions: Ac360Subscription[]
  restrictions: Ac360Restriction[]
  recommendations: any[]
  usageEvents: any[]
  auditLogs: any[]
  rules: any[]
  missingTables: string[]
}

export type Ac360UsageRecordInput = {
  orgId: string
  meterKey: string
  quantity?: number
  featureKey?: string
  actionKey?: string
  actorAppUserId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}
