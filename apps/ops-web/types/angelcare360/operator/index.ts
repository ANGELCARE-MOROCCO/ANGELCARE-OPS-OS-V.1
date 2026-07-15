import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

export type Angelcare360OperatorRole =
  | 'super_admin'
  | 'operator_admin'
  | 'account_manager'
  | 'finance_operator'
  | 'support_operator'
  | 'implementation_manager'
  | 'read_only'

export type Angelcare360OperatorPermission =
  | 'operator.clients.view'
  | 'operator.clients.create'
  | 'operator.clients.update'
  | 'operator.clients.archive'
  | 'operator.tenants.view'
  | 'operator.tenants.update'
  | 'operator.plans.view'
  | 'operator.plans.create'
  | 'operator.plans.update'
  | 'operator.plans.retire'
  | 'operator.packages.view'
  | 'operator.packages.create'
  | 'operator.packages.update'
  | 'operator.subscriptions.view'
  | 'operator.subscriptions.create'
  | 'operator.subscriptions.update'
  | 'operator.subscriptions.cancel'
  | 'operator.billing.view'
  | 'operator.billing.create'
  | 'operator.billing.update'
  | 'operator.payments.record'
  | 'operator.payments.confirm'
  | 'operator.payments.reject'
  | 'operator.dunning.view'
  | 'operator.dunning.update'
  | 'operator.features.view'
  | 'operator.features.update'
  | 'operator.usage.view'
  | 'operator.usage.update'
  | 'operator.onboarding.view'
  | 'operator.onboarding.update'
  | 'operator.support.view'
  | 'operator.support.create'
  | 'operator.support.update'
  | 'operator.support.resolve'
  | 'operator.contracts.view'
  | 'operator.contracts.create'
  | 'operator.contracts.update'
  | 'operator.renewals.view'
  | 'operator.renewals.create'
  | 'operator.renewals.update'
  | 'operator.service.view'
  | 'operator.service.update'
  | 'operator.audit.view'
  | 'operator.settings.manage'

export type Angelcare360OperatorClientStatus = 'prospect' | 'pilot' | 'active' | 'suspended' | 'churned' | 'archived'
export type Angelcare360OperatorClientLifecycleStage =
  | 'lead'
  | 'qualified'
  | 'demo_done'
  | 'proposal_sent'
  | 'contract_pending'
  | 'onboarding'
  | 'live'
  | 'renewal'
  | 'at_risk'
  | 'churned'

export type Angelcare360OperatorTenantEnvironment = 'pilot' | 'production' | 'sandbox'
export type Angelcare360OperatorTenantStatus = 'not_created' | 'provisioning' | 'active' | 'suspended' | 'archived'
export type Angelcare360OperatorProvisioningStatus = 'pending' | 'provisioning' | 'active' | 'failed' | 'blocked'

export type Angelcare360OperatorPlanStatus = 'draft' | 'active' | 'retired' | 'archived'
export type Angelcare360OperatorSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired' | 'archived'
export type Angelcare360OperatorFeatureStatus = 'enabled' | 'disabled' | 'locked' | 'scheduled' | 'requires_configuration'
export type Angelcare360OperatorLimitStatus = 'active' | 'paused' | 'archived'
export type Angelcare360OperatorInvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'archived'
export type Angelcare360OperatorPaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded' | 'cancelled'
export type Angelcare360OperatorPaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'card_manual' | 'other'
export type Angelcare360OperatorDunningStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
export type Angelcare360OperatorOnboardingStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
export type Angelcare360OperatorSupportStatus = 'new' | 'triage' | 'assigned' | 'waiting_client' | 'waiting_internal' | 'resolved' | 'closed' | 'archived'
export type Angelcare360OperatorPriority = 'low' | 'normal' | 'high' | 'urgent'
export type Angelcare360OperatorContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'cancelled' | 'archived'
export type Angelcare360OperatorRenewalStatus = 'upcoming' | 'in_discussion' | 'proposal_sent' | 'renewed' | 'at_risk' | 'lost' | 'cancelled'
export type Angelcare360OperatorServiceStatus = 'open' | 'watching' | 'resolved' | 'archived'
export type Angelcare360OperatorIncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved' | 'archived'
export type Angelcare360OperatorTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
export type Angelcare360OperatorNoteVisibility = 'internal' | 'restricted' | 'public'
export type Angelcare360OperatorAuditSeverity = 'debug' | 'info' | 'notice' | 'warning' | 'critical'

export interface Angelcare360OperatorClientRecord {
  id: string
  client_code: string
  display_name: string
  legal_name?: string | null
  client_type: string
  city?: string | null
  country?: string | null
  address?: string | null
  primary_contact_name?: string | null
  primary_contact_email?: string | null
  primary_contact_phone?: string | null
  commercial_owner_id?: string | null
  account_manager_id?: string | null
  support_owner_id?: string | null
  status: Angelcare360OperatorClientStatus | string
  lifecycle_stage: Angelcare360OperatorClientLifecycleStage | string
  source?: string | null
  health_status?: string | null
  risk_level?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  archived_at?: string | null
}

export interface Angelcare360OperatorTenantRecord {
  id: string
  client_id: string
  school_id?: string | null
  tenant_slug: string
  environment: Angelcare360OperatorTenantEnvironment | string
  status: Angelcare360OperatorTenantStatus | string
  provisioning_status: Angelcare360OperatorProvisioningStatus | string
  command_center_url?: string | null
  go_live_date?: string | null
  last_access_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorPlanRecord {
  id: string
  plan_code: string
  name: string
  description?: string | null
  monthly_price_mad: number | string
  annual_price_mad: number | string
  billing_cycle: string
  max_students?: number | null
  max_staff?: number | null
  max_users?: number | null
  max_sites?: number | null
  included_modules: string[]
  included_features: string[]
  support_level: string
  status: Angelcare360OperatorPlanStatus | string
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorPackageRecord {
  id: string
  package_code: string
  name: string
  description?: string | null
  module_keys: string[]
  feature_keys: string[]
  status: Angelcare360OperatorPlanStatus | string
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorSubscriptionRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  plan_id: string
  subscription_code: string
  status: Angelcare360OperatorSubscriptionStatus | string
  start_date: string
  trial_ends_at?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  billing_cycle: string
  billing_amount_mad: number | string
  discount_amount_mad: number | string
  cancellation_reason?: string | null
  suspended_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorFeatureFlagRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  feature_key: string
  feature_label: string
  module_key: string
  status: Angelcare360OperatorFeatureStatus | string
  enabled: boolean
  locked_reason?: string | null
  scheduled_for?: string | null
  activated_at?: string | null
  activated_by?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorUsageLimitRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  limit_key: string
  label: string
  allowed_value?: number | null
  current_value: number
  unit: string
  status: Angelcare360OperatorLimitStatus | string
  reset_cycle?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorBillingAccountRecord {
  id: string
  client_id: string
  billing_name: string
  billing_email: string
  billing_phone?: string | null
  billing_address?: string | null
  tax_identifier?: string | null
  payment_terms_days: number
  status: string
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorInvoiceRecord {
  id: string
  client_id: string
  subscription_id?: string | null
  billing_account_id?: string | null
  invoice_number: string
  issue_date: string
  due_date: string
  period_start?: string | null
  period_end?: string | null
  subtotal_mad: number | string
  discount_mad: number | string
  total_mad: number | string
  amount_paid_mad: number | string
  balance_due_mad: number | string
  status: Angelcare360OperatorInvoiceStatus | string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorPaymentRecord {
  id: string
  client_id: string
  invoice_id?: string | null
  payment_reference: string
  payment_date: string
  amount_mad: number | string
  method: Angelcare360OperatorPaymentMethod | string
  status: Angelcare360OperatorPaymentStatus | string
  received_by?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorDunningActionRecord {
  id: string
  client_id: string
  invoice_id?: string | null
  action_type: string
  status: Angelcare360OperatorDunningStatus | string
  due_date?: string | null
  completed_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorOnboardingTaskRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  title: string
  description?: string | null
  owner_id?: string | null
  status: Angelcare360OperatorOnboardingStatus | string
  priority: Angelcare360OperatorPriority | string
  due_date?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorSupportTicketRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  subject: string
  description: string
  category: string
  priority: Angelcare360OperatorPriority | string
  status: Angelcare360OperatorSupportStatus | string
  assigned_to?: string | null
  resolution_summary?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorContractRecord {
  id: string
  client_id: string
  subscription_id?: string | null
  contract_code: string
  status: Angelcare360OperatorContractStatus | string
  start_date: string
  end_date?: string | null
  renewal_date?: string | null
  signed_at?: string | null
  document_url?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorRenewalRecord {
  id: string
  client_id: string
  subscription_id?: string | null
  renewal_date: string
  status: Angelcare360OperatorRenewalStatus | string
  probability?: number | null
  expected_amount_mad?: number | null
  owner_id?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorServiceRequestRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  request_type: string
  title: string
  description: string
  priority: Angelcare360OperatorPriority | string
  status: Angelcare360OperatorSupportStatus | string
  assigned_to?: string | null
  due_date?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorIncidentRecord {
  id: string
  client_id?: string | null
  tenant_id?: string | null
  severity: Angelcare360OperatorAuditSeverity | string
  status: Angelcare360OperatorIncidentStatus | string
  title: string
  description: string
  started_at: string
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorTaskRecord {
  id: string
  client_id?: string | null
  tenant_id?: string | null
  title: string
  description?: string | null
  owner_id?: string | null
  status: Angelcare360OperatorTaskStatus | string
  priority: Angelcare360OperatorPriority | string
  due_date?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorNoteRecord {
  id: string
  client_id?: string | null
  tenant_id?: string | null
  author_id?: string | null
  note_type: string
  body: string
  visibility: Angelcare360OperatorNoteVisibility | string
  created_at: string
  updated_at: string
}

export interface Angelcare360OperatorServiceEventRecord {
  id: string
  client_id?: string | null
  tenant_id?: string | null
  event_type: string
  severity: Angelcare360OperatorAuditSeverity | string
  title: string
  description?: string | null
  status: Angelcare360OperatorServiceStatus | string
  occurred_at: string
  created_at: string
}

export interface Angelcare360OperatorAuditLogRecord {
  id: string
  actor_user_id?: string | null
  actor_role?: string | null
  client_id?: string | null
  tenant_id?: string | null
  module: string
  action: string
  entity_type: string
  entity_id?: string | null
  severity: Angelcare360OperatorAuditSeverity | string
  before_data?: Record<string, unknown> | null
  after_data?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface Angelcare360OperatorHealthFactor {
  label: string
  status: 'good' | 'warning' | 'critical' | 'locked'
  value?: string | number | null
  detail?: string | null
}

export interface Angelcare360OperatorHealthDashboard {
  scoreLabel: string
  scoreValue: number | null
  factors: Angelcare360OperatorHealthFactor[]
  summary: string
}

export interface Angelcare360OperatorOverviewRecord {
  totalClients: number
  activeClients: number
  pilotClients: number
  atRiskClients: number
  suspendedClients: number
  activeSubscriptions: number
  mrrEstimateMad: number
  arrEstimateMad: number
  overdueInvoices: number
  unpaidBalanceMad: number
  openSupportTickets: number
  urgentSupportTickets: number
  blockedOnboardingTasks: number
  upcomingRenewals: number
  modulesRequiringConfiguration: number
  featureFlagsLocked: number
  customerHealth: Angelcare360OperatorHealthDashboard
  recentServiceEvents: Angelcare360OperatorServiceEventRecord[]
  recentAuditEvents: Angelcare360AuditRecord[]
  quickActions: Array<{ label: string; href?: string; disabled?: boolean; disabledReason?: string }>
}

export interface Angelcare360OperatorNavigationItem {
  key: string
  label: string
  href: string
  summary: string
  badge?: string
}

export interface Angelcare360OperatorNavigationSection {
  group: string
  label: string
  summary: string
  items: Angelcare360OperatorNavigationItem[]
}

