export type ProductKernelPublicationStatus = 'draft' | 'review' | 'published' | 'suspended' | 'deprecated' | 'retired' | 'archived'
export type ProductKernelRuntimeMaturity = 'operational' | 'configuration_dependent' | 'backend_ready' | 'frontend_only' | 'integration_dependent' | 'locked' | 'deprecated' | 'unverified'
export type ProductKernelItemType = 'module' | 'feature' | 'addon' | 'meter'
export type ProductKernelEffectiveState = 'enabled' | 'disabled' | 'suspended' | 'locked' | 'requires_configuration'

export interface ProductModuleRecord {
  id: string
  module_key: string
  name: string
  short_name?: string | null
  description?: string | null
  commercial_summary?: string | null
  category: string
  status: ProductKernelPublicationStatus | string
  sellability: string
  runtime_maturity: ProductKernelRuntimeMaturity | string
  version: string
  customer_route_prefix?: string | null
  api_prefix?: string | null
  support_owner_role?: string | null
  default_support_tier: string
  configuration_schema: Record<string, unknown>
  evidence: Array<Record<string, unknown> | string>
  region_availability: string[]
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  published_at?: string | null
  deprecated_at?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface ProductFeatureRecord {
  id: string
  module_id: string
  feature_key: string
  name: string
  description?: string | null
  feature_tier: string
  status: ProductKernelPublicationStatus | string
  sellability: string
  runtime_maturity: ProductKernelRuntimeMaturity | string
  customer_route?: string | null
  api_route?: string | null
  permission_keys: string[]
  configuration_required: boolean
  configuration_schema: Record<string, unknown>
  evidence: Array<Record<string, unknown> | string>
  version: string
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  published_at?: string | null
  deprecated_at?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface ProductAddonRecord {
  id: string
  addon_code: string
  name: string
  description?: string | null
  module_id?: string | null
  feature_id?: string | null
  addon_type: string
  billing_model: string
  status: ProductKernelPublicationStatus | string
  currency: string
  list_price: number | string
  included_quantity?: number | string | null
  unit?: string | null
  configuration_schema: Record<string, unknown>
  region_availability: string[]
  version: string
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  published_at?: string | null
  deprecated_at?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface ProductMeterRecord {
  id: string
  meter_key: string
  name: string
  description?: string | null
  unit: string
  meter_type: string
  reset_cycle?: string | null
  hard_limit: boolean
  warning_threshold_pct: number
  topup_enabled: boolean
  topup_increment?: number | string | null
  status: ProductKernelPublicationStatus | string
  source_table?: string | null
  source_column?: string | null
  version: string
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  published_at?: string | null
  deprecated_at?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface ProductDependencyRecord {
  id: string
  source_type: ProductKernelItemType
  source_id: string
  target_type: ProductKernelItemType
  target_id: string
  relation_type: string
  required_state?: string | null
  reason?: string | null
  created_at: string
}

export interface PackageVersionRecord {
  id: string
  package_id?: string | null
  version_code: string
  version_number: number
  name: string
  description?: string | null
  target_segment?: string | null
  status: string
  currency: string
  monthly_price: number | string
  annual_price: number | string
  setup_fee: number | string
  support_tier: string
  implementation_tier: string
  effective_from?: string | null
  effective_to?: string | null
  region_availability: string[]
  metadata: Record<string, unknown>
  published_at?: string | null
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  deprecated_at?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface PackageVersionItemRecord {
  id: string
  package_version_id: string
  item_type: ProductKernelItemType
  item_id: string
  inclusion_type: string
  quantity?: number | string | null
  configuration: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PriceBookRecord {
  id: string
  price_book_code: string
  name: string
  currency: string
  region_code: string
  status: string
  version_code: string
  effective_from?: string | null
  effective_to?: string | null
  created_at: string
  updated_at: string
  is_seeded?: boolean
  seed_source?: string | null
  supersedes_id?: string | null
  owner_role?: string | null
  lifecycle_note?: string | null
  published_at?: string | null
  published_by?: string | null
  retired_at?: string | null
  last_reviewed_at?: string | null
}

export interface PriceBookEntryRecord {
  id: string
  price_book_id: string
  item_type: 'package_version' | ProductKernelItemType
  item_id: string
  billing_cycle: string
  unit_price: number | string
  setup_fee: number | string
  minimum_quantity?: number | string | null
  maximum_quantity?: number | string | null
  volume_rules: Array<Record<string, unknown>>
  created_at: string
  updated_at: string
}

export interface SubscriptionAddonRecord {
  id: string
  subscription_id: string
  addon_id: string
  status: string
  quantity: number | string
  unit_price: number | string
  start_date: string
  end_date?: string | null
  notes?: string | null
}

export interface CapacityTopupRecord {
  id: string
  subscription_id: string
  tenant_id?: string | null
  meter_id: string
  quantity: number | string
  amount: number | string
  currency: string
  status: string
  starts_at: string
  expires_at?: string | null
  reason?: string | null
}

export interface TenantEntitlementSnapshotRecord {
  id: string
  client_id: string
  tenant_id: string
  subscription_id?: string | null
  package_version_id?: string | null
  status: string
  source_signature?: string | null
  compiled_payload: Record<string, unknown>
  compiled_at?: string | null
  activated_at?: string | null
  superseded_at?: string | null
  created_at: string
}

export interface TenantEntitlementItemRecord {
  id: string
  snapshot_id: string
  item_type: ProductKernelItemType
  item_id?: string | null
  item_key: string
  item_label: string
  module_key?: string | null
  effective_state: ProductKernelEffectiveState | string
  origin: string
  quantity?: number | string | null
  configuration: Record<string, unknown>
  reason?: string | null
}

export interface TenantOverrideRecord {
  id: string
  client_id: string
  tenant_id: string
  item_type: ProductKernelItemType
  item_id?: string | null
  item_key: string
  override_state: ProductKernelEffectiveState | string
  quantity_override?: number | string | null
  reason: string
  approval_status: string
  starts_at: string
  expires_at?: string | null
  status: string
}

export interface ScannerRunRecord {
  id: string
  status: string
  repository_signature?: string | null
  started_at: string
  completed_at?: string | null
  summary: Record<string, unknown>
  error_message?: string | null
}

export interface ScannerFindingRecord {
  id: string
  run_id: string
  finding_type: string
  finding_key: string
  title: string
  description?: string | null
  classification: string
  confidence: number
  evidence: Array<Record<string, unknown> | string>
  suggestion: Record<string, unknown>
  status: string
  adopted_entity_type?: string | null
  adopted_entity_id?: string | null
}

export type ProductAdminChangeScope =
  | 'catalogue_only'
  | 'new_sales_only'
  | 'selected_subscriptions'
  | 'existing_at_renewal'
  | 'all_active_subscriptions'
  | 'scheduled'
  | 'immediate_authorized'

export interface ProductRevisionRecord {
  id: string
  entity_type: string
  entity_id: string
  revision_number: number
  operation: string
  change_scope: ProductAdminChangeScope | string
  effective_at?: string | null
  reason?: string | null
  before_data: Record<string, unknown>
  after_data: Record<string, unknown>
  impact_data: Record<string, unknown>
  created_by?: string | null
  created_at: string
}

export interface ProductChangeJobRecord {
  id: string
  entity_type: string
  entity_id: string
  operation: string
  change_scope: ProductAdminChangeScope | string
  selected_subscription_ids: string[]
  effective_at?: string | null
  status: string
  reason?: string | null
  impact_data: Record<string, unknown>
  result_data: Record<string, unknown>
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface ProductKernelSnapshot {
  modules: ProductModuleRecord[]
  features: ProductFeatureRecord[]
  addons: ProductAddonRecord[]
  meters: ProductMeterRecord[]
  dependencies: ProductDependencyRecord[]
  packageVersions: PackageVersionRecord[]
  packageItems: PackageVersionItemRecord[]
  priceBooks: PriceBookRecord[]
  priceEntries: PriceBookEntryRecord[]
  subscriptionAddons: SubscriptionAddonRecord[]
  topups: CapacityTopupRecord[]
  entitlementSnapshots: TenantEntitlementSnapshotRecord[]
  entitlementItems: TenantEntitlementItemRecord[]
  overrides: TenantOverrideRecord[]
  scannerRuns: ScannerRunRecord[]
  scannerFindings: ScannerFindingRecord[]
  revisions: ProductRevisionRecord[]
  changeJobs: ProductChangeJobRecord[]
  legacy: {
    clients: Array<Record<string, unknown>>
    tenants: Array<Record<string, unknown>>
    subscriptions: Array<Record<string, unknown>>
    plans: Array<Record<string, unknown>>
    packages: Array<Record<string, unknown>>
    featureFlags: Array<Record<string, unknown>>
    usageLimits: Array<Record<string, unknown>>
  }
  sourceState: 'complete' | 'partial' | 'unavailable'
  sources: Array<{ key: string; state: 'complete' | 'unavailable'; count: number; error?: string }>
}
