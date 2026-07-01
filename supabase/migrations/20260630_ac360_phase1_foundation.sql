-- AngelCare 360 Phase 1 Foundation - Billing, Entitlements, Usage, Restrictions, Multi-Tenant Backbone
-- Ref: AC360-PH1-FOUNDATION-2026-06-30
-- Scope: 12 master systems / 52 engine map / Phase 1 production foundation
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. Common timestamp trigger
-- -----------------------------------------------------------------------------
create or replace function public.ac360_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Multi-tenant institution foundation
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_organizations (
  id uuid primary key default gen_random_uuid(),
  org_code text not null unique,
  display_name text not null,
  legal_name text,
  org_type text not null default 'kindergarten_school',
  lifecycle_status text not null default 'prospect',
  status text not null default 'active',
  country text not null default 'Morocco',
  city text,
  address text,
  phone text,
  email text,
  billing_email text,
  website text,
  timezone text not null default 'Africa/Casablanca',
  currency text not null default 'MAD',
  preferred_language text not null default 'fr',
  current_academic_year_id uuid,
  owner_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (status in ('active','trial','grace','restricted','suspended','cancelled','archived')),
  check (lifecycle_status in ('prospect','trial','onboarding','active','at_risk','restricted','suspended','cancelled','archived'))
);

create table if not exists public.ac360_campuses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_code text not null,
  name text not null,
  status text not null default 'active',
  city text,
  address text,
  phone text,
  email text,
  capacity_students integer,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, campus_code),
  check (status in ('active','inactive','restricted','archived'))
);

create table if not exists public.ac360_legal_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.ac360_organizations(id) on delete cascade,
  legal_name text,
  trade_name text,
  registration_number text,
  tax_identifier text,
  ice_number text,
  cnss_number text,
  billing_address text,
  billing_contact_name text,
  billing_contact_email text,
  billing_contact_phone text,
  payment_terms_days integer not null default 7,
  currency text not null default 'MAD',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac360_academic_years (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  label text not null,
  status text not null default 'planned',
  starts_on date,
  ends_on date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, label),
  check (status in ('planned','active','closed','archived'))
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ac360_organizations_current_year_fk'
      and conrelid = 'public.ac360_organizations'::regclass
  ) then
    alter table public.ac360_organizations
      add constraint ac360_organizations_current_year_fk
      foreign key (current_academic_year_id) references public.ac360_academic_years(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Identity, membership, RBAC, permissions, audit
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_user_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  app_user_id uuid,
  auth_user_id uuid,
  email text,
  display_name text,
  member_type text not null default 'school_staff',
  status text not null default 'active',
  default_role_key text,
  invited_by uuid,
  invited_at timestamptz,
  joined_at timestamptz,
  last_seen_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, app_user_id),
  unique(org_id, auth_user_id),
  check (member_type in ('angelcare_internal','school_owner','school_admin','school_staff','teacher','finance','admissions','parent','external_accountant','consultant')),
  check (status in ('invited','active','paused','restricted','suspended','archived'))
);

create table if not exists public.ac360_permissions (
  permission_key text primary key,
  category text not null,
  label text not null,
  description text,
  risk_level text not null default 'low',
  is_system_locked boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac360_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  role_key text not null,
  label text not null,
  description text,
  scope text not null default 'organization',
  is_template boolean not null default false,
  is_system_locked boolean not null default false,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, role_key),
  check (scope in ('global','organization','campus','department','classroom')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.ac360_roles(id) on delete cascade,
  permission_key text not null references public.ac360_permissions(permission_key) on delete cascade,
  effect text not null default 'allow',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(role_id, permission_key),
  check (effect in ('allow','deny'))
);

create table if not exists public.ac360_user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.ac360_user_memberships(id) on delete cascade,
  role_id uuid not null references public.ac360_roles(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  assigned_by uuid,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(membership_id, role_id, campus_id),
  check (status in ('active','paused','expired','revoked'))
);

create table if not exists public.ac360_audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete set null,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  actor_app_user_id uuid,
  actor_email text,
  engine_code text,
  event_code text not null,
  action_key text,
  resource_type text,
  resource_id uuid,
  severity text not null default 'info',
  result text not null default 'success',
  ip_address text,
  user_agent text,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('debug','info','notice','warning','critical')),
  check (result in ('success','blocked','failed','warning'))
);

-- -----------------------------------------------------------------------------
-- 3. 52 engine map / system registry
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_foundation_engines (
  engine_code text primary key,
  system_group text not null,
  engine_name text not null,
  purpose text not null,
  phase text not null default 'phase_1_foundation',
  criticality text not null default 'high',
  implementation_status text not null default 'designed',
  table_scope text[] not null default array[]::text[],
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. Feature registry, action registry, package catalog, add-ons
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_feature_registry (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  module_key text not null,
  family text not null,
  label text not null,
  description text,
  billing_family text not null default 'access',
  is_core boolean not null default false,
  is_billable boolean not null default true,
  is_enterprise_only boolean not null default false,
  default_meter_key text,
  default_credit_cost numeric not null default 0,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (billing_family in ('core','access','capacity','usage','service','governance','enterprise')),
  check (status in ('active','planned','deprecated','archived'))
);

create table if not exists public.ac360_action_registry (
  id uuid primary key default gen_random_uuid(),
  action_key text not null unique,
  feature_key text not null references public.ac360_feature_registry(feature_key) on delete cascade,
  engine_code text references public.ac360_foundation_engines(engine_code) on delete set null,
  label text not null,
  description text,
  entitlement_key text,
  meter_key text,
  credit_cost numeric not null default 0,
  restriction_behavior text not null default 'block',
  audit_required boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (restriction_behavior in ('allow','warn','block','read_only','require_upgrade','require_topup'))
);

create table if not exists public.ac360_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  label text not null,
  commercial_name text not null,
  description text,
  package_level integer not null,
  status text not null default 'active',
  public_monthly_price_mad numeric not null default 0,
  public_annual_price_mad numeric not null default 0,
  currency text not null default 'MAD',
  target_segment text,
  position integer not null default 100,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','hidden','archived'))
);

create table if not exists public.ac360_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.ac360_plans(id) on delete cascade,
  version_code text not null unique,
  label text not null,
  monthly_price_mad numeric not null default 0,
  annual_price_mad numeric not null default 0,
  setup_price_mad numeric not null default 0,
  effective_from date not null default current_date,
  effective_to date,
  included_limits_json jsonb not null default '{}'::jsonb,
  included_credits_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','retired'))
);

create table if not exists public.ac360_plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.ac360_plan_versions(id) on delete cascade,
  feature_key text not null references public.ac360_feature_registry(feature_key) on delete cascade,
  entitlement_key text not null,
  access_mode text not null default 'included',
  limit_key text,
  limit_value numeric,
  included_quantity numeric,
  reset_interval text default 'monthly',
  overage_behavior text not null default 'block',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_version_id, feature_key, entitlement_key),
  check (access_mode in ('included','limited','metered','read_only','addon_locked','enterprise_locked','blocked')),
  check (overage_behavior in ('allow','warn','block','charge','topup_required','upgrade_required'))
);

create table if not exists public.ac360_addons (
  id uuid primary key default gen_random_uuid(),
  addon_key text not null unique,
  label text not null,
  family text not null,
  description text,
  billing_model text not null default 'monthly',
  monthly_price_mad numeric not null default 0,
  setup_price_mad numeric not null default 0,
  unit_label text,
  included_allowance_json jsonb not null default '{}'::jsonb,
  cancellable boolean not null default true,
  data_preservation_policy text not null default 'preserve_data_read_only_after_period',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (billing_model in ('monthly','annual','usage','one_time','setup_plus_monthly','enterprise_quote')),
  check (status in ('active','hidden','archived'))
);

create table if not exists public.ac360_addon_entitlements (
  id uuid primary key default gen_random_uuid(),
  addon_key text not null references public.ac360_addons(addon_key) on delete cascade,
  feature_key text not null references public.ac360_feature_registry(feature_key) on delete cascade,
  entitlement_key text not null,
  access_mode text not null default 'included',
  limit_key text,
  limit_value numeric,
  included_quantity numeric,
  reset_interval text default 'monthly',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(addon_key, feature_key, entitlement_key),
  check (access_mode in ('included','limited','metered','read_only','blocked'))
);

create table if not exists public.ac360_serenite_bundles (
  id uuid primary key default gen_random_uuid(),
  bundle_key text not null unique,
  label text not null,
  description text,
  monthly_price_mad numeric not null default 0,
  included_allowance_json jsonb not null default '{}'::jsonb,
  support_level text not null default 'standard',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','hidden','archived'))
);

create table if not exists public.ac360_professional_services_catalog (
  service_key text primary key,
  label text not null,
  family text not null,
  description text,
  min_price_mad numeric not null default 0,
  max_price_mad numeric,
  billing_model text not null default 'one_time',
  deliverable text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. Subscriptions, items, quotes, contracts, invoices, payments
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  plan_id uuid not null references public.ac360_plans(id),
  plan_version_id uuid not null references public.ac360_plan_versions(id),
  subscription_code text not null unique,
  status text not null default 'trial',
  billing_interval text not null default 'monthly',
  currency text not null default 'MAD',
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  grace_ends_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('trial','active','past_due','grace','restricted','suspended','cancelled','archived')),
  check (billing_interval in ('monthly','annual','custom'))
);

create table if not exists public.ac360_subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.ac360_subscriptions(id) on delete cascade,
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  item_type text not null default 'addon',
  item_key text not null,
  label text not null,
  addon_key text references public.ac360_addons(addon_key) on delete set null,
  serenite_bundle_key text references public.ac360_serenite_bundles(bundle_key) on delete set null,
  quantity numeric not null default 1,
  unit_price_mad numeric not null default 0,
  billing_interval text not null default 'monthly',
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_type in ('base_plan','addon','serenite_bundle','usage_pack','professional_service','discount','custom')),
  check (status in ('active','paused','cancel_pending','cancelled','archived')),
  check (billing_interval in ('monthly','annual','one_time','usage','custom'))
);

create table if not exists public.ac360_quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete set null,
  quote_number text not null unique,
  status text not null default 'draft',
  total_mad numeric not null default 0,
  valid_until date,
  line_items_json jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','sent','accepted','rejected','expired','cancelled'))
);

create table if not exists public.ac360_contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  quote_id uuid references public.ac360_quotes(id) on delete set null,
  contract_number text not null unique,
  status text not null default 'draft',
  signed_at timestamptz,
  starts_on date,
  ends_on date,
  monthly_commitment_mad numeric not null default 0,
  annual_commitment_mad numeric not null default 0,
  contract_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','sent','signed','active','expired','cancelled','archived'))
);

create table if not exists public.ac360_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft',
  currency text not null default 'MAD',
  subtotal_mad numeric not null default 0,
  discount_mad numeric not null default 0,
  tax_mad numeric not null default 0,
  total_mad numeric not null default 0,
  amount_paid_mad numeric not null default 0,
  amount_due_mad numeric generated always as (greatest(total_mad - amount_paid_mad, 0)) stored,
  issued_at timestamptz,
  due_date date,
  paid_at timestamptz,
  period_start date,
  period_end date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (status in ('draft','issued','sent','partial','paid','overdue','void','cancelled'))
);

create table if not exists public.ac360_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.ac360_invoices(id) on delete cascade,
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  line_type text not null default 'subscription',
  item_key text,
  label text not null,
  description text,
  quantity numeric not null default 1,
  unit_price_mad numeric not null default 0,
  amount_mad numeric not null default 0,
  period_start date,
  period_end date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (line_type in ('subscription','addon','usage','credit_pack','serenite','service','discount','adjustment'))
);

create table if not exists public.ac360_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  invoice_id uuid references public.ac360_invoices(id) on delete set null,
  payment_reference text unique,
  status text not null default 'pending',
  method text not null default 'manual',
  amount_mad numeric not null default 0,
  received_at timestamptz,
  recorded_by uuid,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending','confirmed','failed','refunded','cancelled'))
);

-- -----------------------------------------------------------------------------
-- 6. Usage meters, credits, capacity snapshots
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_usage_meters (
  meter_key text primary key,
  label text not null,
  unit_label text not null,
  category text not null,
  default_credit_cost numeric not null default 0,
  default_unit_price_mad numeric not null default 0,
  aggregation text not null default 'sum',
  reset_interval text not null default 'monthly',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (aggregation in ('sum','max','last','count_distinct')),
  check (reset_interval in ('none','daily','monthly','annual'))
);

create table if not exists public.ac360_usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  meter_key text not null references public.ac360_usage_meters(meter_key),
  feature_key text references public.ac360_feature_registry(feature_key) on delete set null,
  action_key text references public.ac360_action_registry(action_key) on delete set null,
  actor_app_user_id uuid,
  quantity numeric not null default 1,
  credits_consumed numeric not null default 0,
  amount_mad numeric not null default 0,
  period_start date not null default date_trunc('month', now())::date,
  period_end date not null default (date_trunc('month', now()) + interval '1 month - 1 day')::date,
  idempotency_key text,
  source text not null default 'app',
  source_resource_type text,
  source_resource_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, meter_key, idempotency_key)
);

create table if not exists public.ac360_usage_summaries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  meter_key text not null references public.ac360_usage_meters(meter_key),
  period_start date not null,
  period_end date not null,
  quantity numeric not null default 0,
  credits_consumed numeric not null default 0,
  amount_mad numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(org_id, meter_key, period_start, period_end)
);

create table if not exists public.ac360_credit_wallets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  wallet_key text not null,
  credit_type text not null default 'angelcare_credits',
  status text not null default 'active',
  balance numeric not null default 0,
  monthly_included_allowance numeric not null default 0,
  rollover_policy text not null default 'no_rollover',
  expires_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, wallet_key),
  check (status in ('active','paused','exhausted','expired','archived'))
);

create table if not exists public.ac360_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.ac360_credit_wallets(id) on delete cascade,
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  ledger_type text not null,
  amount numeric not null,
  balance_after numeric,
  usage_event_id uuid references public.ac360_usage_events(id) on delete set null,
  invoice_id uuid references public.ac360_invoices(id) on delete set null,
  reason text,
  idempotency_key text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(wallet_id, idempotency_key),
  check (ledger_type in ('grant','purchase','consume','adjust','expire','refund','monthly_reset'))
);

create table if not exists public.ac360_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  capacity_key text not null,
  current_value numeric not null default 0,
  limit_value numeric,
  source_table text,
  measured_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  unique(org_id, capacity_key, measured_at)
);

-- -----------------------------------------------------------------------------
-- 7. Lifecycle, restrictions, recommendations, automated rules
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_trials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  conversion_status text not null default 'pending',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','converted','expired','cancelled'))
);

create table if not exists public.ac360_grace_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  invoice_id uuid references public.ac360_invoices(id) on delete set null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','resolved','expired','cancelled'))
);

create table if not exists public.ac360_restriction_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null,
  trigger_type text not null,
  severity text not null default 'warning',
  condition_json jsonb not null default '{}'::jsonb,
  action_json jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac360_restrictions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  restriction_key text not null,
  status text not null default 'active',
  severity text not null default 'warning',
  restriction_type text not null default 'feature',
  target_feature_key text,
  target_action_key text,
  target_meter_key text,
  behavior text not null default 'warn',
  reason text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, restriction_key, target_feature_key, target_action_key, status),
  check (status in ('active','resolved','expired','cancelled')),
  check (behavior in ('warn','block','read_only','suspend_non_admin','admin_only','topup_required','upgrade_required'))
);

create table if not exists public.ac360_recommendations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  subscription_id uuid references public.ac360_subscriptions(id) on delete set null,
  recommendation_key text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  title text not null,
  message text not null,
  recommended_plan_key text,
  recommended_addon_key text,
  recommended_bundle_key text,
  trigger_json jsonb not null default '{}'::jsonb,
  dismissed_by uuid,
  dismissed_at timestamptz,
  accepted_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','accepted','dismissed','expired','archived')),
  check (priority in ('low','medium','high','critical'))
);

create table if not exists public.ac360_automation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null,
  system_group text not null,
  trigger_event text not null,
  condition_json jsonb not null default '{}'::jsonb,
  action_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  phase text not null default 'phase_1_foundation',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 8. Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_org_status on public.ac360_organizations(status, lifecycle_status);
create index if not exists idx_ac360_campuses_org_status on public.ac360_campuses(org_id, status);
create index if not exists idx_ac360_memberships_org_status on public.ac360_user_memberships(org_id, status);
create index if not exists idx_ac360_memberships_app_user on public.ac360_user_memberships(app_user_id);
create index if not exists idx_ac360_audit_org_created on public.ac360_audit_logs(org_id, created_at desc);
create index if not exists idx_ac360_features_module_family on public.ac360_feature_registry(module_key, family, status);
create index if not exists idx_ac360_plan_entitlements_feature on public.ac360_plan_entitlements(feature_key, access_mode);
create index if not exists idx_ac360_subscriptions_org_status on public.ac360_subscriptions(org_id, status);
create index if not exists idx_ac360_subscription_items_org_status on public.ac360_subscription_items(org_id, status, item_type);
create index if not exists idx_ac360_invoices_org_status_due on public.ac360_invoices(org_id, status, due_date);
create index if not exists idx_ac360_usage_events_org_period on public.ac360_usage_events(org_id, meter_key, period_start, period_end);
create index if not exists idx_ac360_restrictions_org_status on public.ac360_restrictions(org_id, status, behavior);
create index if not exists idx_ac360_recommendations_org_status on public.ac360_recommendations(org_id, status, priority);

-- -----------------------------------------------------------------------------
-- 9. Triggers
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'ac360_organizations','ac360_campuses','ac360_legal_profiles','ac360_academic_years',
    'ac360_user_memberships','ac360_permissions','ac360_roles','ac360_user_role_assignments',
    'ac360_foundation_engines','ac360_feature_registry','ac360_action_registry','ac360_plans',
    'ac360_plan_versions','ac360_plan_entitlements','ac360_addons','ac360_serenite_bundles',
    'ac360_professional_services_catalog','ac360_subscriptions','ac360_subscription_items',
    'ac360_quotes','ac360_contracts','ac360_invoices','ac360_payments','ac360_usage_meters',
    'ac360_credit_wallets','ac360_trials','ac360_grace_periods','ac360_restriction_rules',
    'ac360_restrictions','ac360_recommendations','ac360_automation_rules'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 10. RLS: enabled with service-role friendly policies. Tighten per org after auth bridge.
-- -----------------------------------------------------------------------------
alter table public.ac360_organizations enable row level security;
alter table public.ac360_campuses enable row level security;
alter table public.ac360_legal_profiles enable row level security;
alter table public.ac360_academic_years enable row level security;
alter table public.ac360_user_memberships enable row level security;
alter table public.ac360_permissions enable row level security;
alter table public.ac360_roles enable row level security;
alter table public.ac360_role_permissions enable row level security;
alter table public.ac360_user_role_assignments enable row level security;
alter table public.ac360_audit_logs enable row level security;
alter table public.ac360_foundation_engines enable row level security;
alter table public.ac360_feature_registry enable row level security;
alter table public.ac360_action_registry enable row level security;
alter table public.ac360_plans enable row level security;
alter table public.ac360_plan_versions enable row level security;
alter table public.ac360_plan_entitlements enable row level security;
alter table public.ac360_addons enable row level security;
alter table public.ac360_addon_entitlements enable row level security;
alter table public.ac360_serenite_bundles enable row level security;
alter table public.ac360_professional_services_catalog enable row level security;
alter table public.ac360_subscriptions enable row level security;
alter table public.ac360_subscription_items enable row level security;
alter table public.ac360_quotes enable row level security;
alter table public.ac360_contracts enable row level security;
alter table public.ac360_invoices enable row level security;
alter table public.ac360_invoice_lines enable row level security;
alter table public.ac360_payments enable row level security;
alter table public.ac360_usage_meters enable row level security;
alter table public.ac360_usage_events enable row level security;
alter table public.ac360_usage_summaries enable row level security;
alter table public.ac360_credit_wallets enable row level security;
alter table public.ac360_credit_ledger enable row level security;
alter table public.ac360_capacity_snapshots enable row level security;
alter table public.ac360_trials enable row level security;
alter table public.ac360_grace_periods enable row level security;
alter table public.ac360_restriction_rules enable row level security;
alter table public.ac360_restrictions enable row level security;
alter table public.ac360_recommendations enable row level security;
alter table public.ac360_automation_rules enable row level security;

-- Read catalog tables for authenticated sessions; service role bypasses RLS by design.
do $$
declare t text;
begin
  foreach t in array array[
    'ac360_foundation_engines','ac360_feature_registry','ac360_action_registry','ac360_plans',
    'ac360_plan_versions','ac360_plan_entitlements','ac360_addons','ac360_addon_entitlements',
    'ac360_serenite_bundles','ac360_professional_services_catalog','ac360_usage_meters',
    'ac360_permissions','ac360_restriction_rules','ac360_automation_rules'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_catalog_read_authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'ac360_catalog_read_authenticated', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 11. Core RPCs: audit, access evaluation, usage recording
-- -----------------------------------------------------------------------------
create or replace function public.ac360_record_audit(
  p_org_id uuid,
  p_engine_code text,
  p_event_code text,
  p_action_key text default null,
  p_resource_type text default null,
  p_resource_id uuid default null,
  p_result text default 'success',
  p_severity text default 'info',
  p_actor_app_user_id uuid default null,
  p_actor_email text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare v_id uuid;
begin
  insert into public.ac360_audit_logs(org_id, actor_app_user_id, actor_email, engine_code, event_code, action_key, resource_type, resource_id, result, severity, metadata_json)
  values (p_org_id, p_actor_app_user_id, p_actor_email, p_engine_code, p_event_code, p_action_key, p_resource_type, p_resource_id, p_result, p_severity, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.ac360_has_feature(
  p_org_id uuid,
  p_feature_key text,
  p_action_key text default null,
  p_quantity numeric default 1
)
returns table(
  allowed boolean,
  decision text,
  reason text,
  source text,
  access_mode text,
  limit_key text,
  limit_value numeric,
  active_subscription_id uuid
)
language plpgsql
security definer
as $$
declare
  v_sub record;
  v_restriction record;
  v_ent record;
  v_addon record;
begin
  select s.*, pv.id as pv_id
    into v_sub
  from public.ac360_subscriptions s
  join public.ac360_plan_versions pv on pv.id = s.plan_version_id
  where s.org_id = p_org_id
    and s.status in ('trial','active','grace','past_due','restricted')
  order by case s.status when 'active' then 1 when 'trial' then 2 when 'grace' then 3 else 4 end, s.created_at desc
  limit 1;

  if v_sub.id is null then
    return query select false, 'no_subscription'::text, 'No active subscription found for this organization.'::text, 'subscription'::text, null::text, null::text, null::numeric, null::uuid;
    return;
  end if;

  select * into v_restriction
  from public.ac360_restrictions r
  where r.org_id = p_org_id
    and r.status = 'active'
    and (r.ends_at is null or r.ends_at > now())
    and (
      r.target_feature_key is null or r.target_feature_key = p_feature_key
      or (p_action_key is not null and r.target_action_key = p_action_key)
    )
    and r.behavior in ('block','read_only','suspend_non_admin','admin_only','topup_required','upgrade_required')
  order by case r.behavior when 'block' then 1 when 'suspend_non_admin' then 2 when 'admin_only' then 3 else 4 end, r.created_at desc
  limit 1;

  if v_restriction.id is not null and v_restriction.behavior = 'block' then
    return query select false, 'blocked'::text, coalesce(v_restriction.reason, 'Feature blocked by active account restriction.')::text, 'restriction'::text, v_restriction.behavior::text, null::text, null::numeric, v_sub.id::uuid;
    return;
  end if;

  select pe.* into v_ent
  from public.ac360_plan_entitlements pe
  where pe.plan_version_id = v_sub.plan_version_id
    and pe.feature_key = p_feature_key
  order by case pe.access_mode when 'included' then 1 when 'limited' then 2 when 'metered' then 3 when 'read_only' then 4 else 9 end
  limit 1;

  if v_ent.id is not null and v_ent.access_mode in ('included','limited','metered','read_only') then
    return query select (v_ent.access_mode <> 'read_only'),
      case when v_ent.access_mode = 'read_only' then 'read_only' else 'allowed' end::text,
      ('Allowed by plan entitlement: ' || v_ent.entitlement_key)::text,
      'plan'::text,
      v_ent.access_mode::text,
      v_ent.limit_key::text,
      v_ent.limit_value::numeric,
      v_sub.id::uuid;
    return;
  end if;

  select ae.* into v_addon
  from public.ac360_subscription_items si
  join public.ac360_addon_entitlements ae on ae.addon_key = si.addon_key
  where si.org_id = p_org_id
    and si.subscription_id = v_sub.id
    and si.status in ('active','cancel_pending')
    and ae.feature_key = p_feature_key
  order by si.created_at desc
  limit 1;

  if v_addon.id is not null and v_addon.access_mode in ('included','limited','metered','read_only') then
    return query select (v_addon.access_mode <> 'read_only'),
      case when v_addon.access_mode = 'read_only' then 'read_only' else 'allowed' end::text,
      ('Allowed by active add-on: ' || v_addon.addon_key)::text,
      'addon'::text,
      v_addon.access_mode::text,
      v_addon.limit_key::text,
      v_addon.limit_value::numeric,
      v_sub.id::uuid;
    return;
  end if;

  return query select false, 'upgrade_required'::text, 'Feature is not included in the current package or active add-ons.'::text, 'entitlement'::text, coalesce(v_ent.access_mode, 'blocked')::text, v_ent.limit_key::text, v_ent.limit_value::numeric, v_sub.id::uuid;
end;
$$;

create or replace function public.ac360_record_usage(
  p_org_id uuid,
  p_meter_key text,
  p_quantity numeric default 1,
  p_feature_key text default null,
  p_action_key text default null,
  p_actor_app_user_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_meter record;
  v_sub uuid;
  v_event uuid;
  v_period_start date := date_trunc('month', now())::date;
  v_period_end date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
  v_credits numeric := 0;
begin
  select * into v_meter from public.ac360_usage_meters where meter_key = p_meter_key;
  if v_meter.meter_key is null then
    raise exception 'Unknown AC360 meter: %', p_meter_key;
  end if;

  select id into v_sub
  from public.ac360_subscriptions
  where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')
  order by created_at desc
  limit 1;

  v_credits := coalesce(v_meter.default_credit_cost, 0) * coalesce(p_quantity, 1);

  insert into public.ac360_usage_events(org_id, subscription_id, meter_key, feature_key, action_key, actor_app_user_id, quantity, credits_consumed, period_start, period_end, idempotency_key, metadata_json)
  values (p_org_id, v_sub, p_meter_key, p_feature_key, p_action_key, p_actor_app_user_id, coalesce(p_quantity, 1), v_credits, v_period_start, v_period_end, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb))
  on conflict (org_id, meter_key, idempotency_key) do update set metadata_json = public.ac360_usage_events.metadata_json || excluded.metadata_json
  returning id into v_event;

  insert into public.ac360_usage_summaries(org_id, subscription_id, meter_key, period_start, period_end, quantity, credits_consumed, updated_at)
  values (p_org_id, v_sub, p_meter_key, v_period_start, v_period_end, coalesce(p_quantity, 1), v_credits, now())
  on conflict (org_id, meter_key, period_start, period_end)
  do update set quantity = public.ac360_usage_summaries.quantity + excluded.quantity,
                credits_consumed = public.ac360_usage_summaries.credits_consumed + excluded.credits_consumed,
                updated_at = now();

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-33', 'usage.recorded', p_action_key, 'usage_event', v_event, 'success', 'info', p_actor_app_user_id, null, jsonb_build_object('meter_key', p_meter_key, 'quantity', p_quantity, 'credits', v_credits));
  return v_event;
end;
$$;

-- -----------------------------------------------------------------------------
-- 12. Seeds: 52 engines, permissions, features, meters, packages, add-ons, rules
-- -----------------------------------------------------------------------------
insert into public.ac360_foundation_engines(engine_code, system_group, engine_name, purpose, phase, criticality, implementation_status, table_scope) values
('AC360-ENG-01','Multi-Tenant Institution System','Tenant / Organization Engine','Creates and isolates each school/kindergarten account.','phase_1_foundation','critical','implemented',array['ac360_organizations']),
('AC360-ENG-02','Multi-Tenant Institution System','Campus / Site Engine','Manages branches, campuses and physical locations.','phase_1_foundation','critical','implemented',array['ac360_campuses']),
('AC360-ENG-03','Multi-Tenant Institution System','Legal Institution Profile Engine','Stores billing/legal profile and invoice identity.','phase_1_foundation','high','implemented',array['ac360_legal_profiles']),
('AC360-ENG-04','Multi-Tenant Institution System','Academic Year Engine','Separates yearly school operations and archives.','phase_1_foundation','high','implemented',array['ac360_academic_years']),
('AC360-ENG-05','Multi-Tenant Institution System','Data Isolation Engine','Prevents one institution from seeing another institution data.','phase_1_foundation','critical','implemented',array['ac360_user_memberships','ac360_organizations']),
('AC360-ENG-06','Identity, Access & Governance System','Authentication Engine','Bridges AngelCare users and future school users into AC360.','phase_1_foundation','critical','implemented',array['ac360_user_memberships']),
('AC360-ENG-07','Identity, Access & Governance System','Role-Based Access Engine','Controls director, admin, teacher, finance, admissions and parent roles.','phase_1_foundation','critical','implemented',array['ac360_roles','ac360_role_permissions']),
('AC360-ENG-08','Identity, Access & Governance System','Advanced Permission Engine','Controls custom permissions by feature/action.','phase_1_foundation','critical','implemented',array['ac360_permissions','ac360_role_permissions']),
('AC360-ENG-09','Identity, Access & Governance System','User Lifecycle Engine','Invite, activate, suspend and archive users.','phase_1_foundation','high','implemented',array['ac360_user_memberships']),
('AC360-ENG-10','Identity, Access & Governance System','Audit Log Engine','Tracks sensitive billing, entitlement and governance actions.','phase_1_foundation','critical','implemented',array['ac360_audit_logs']),
('AC360-ENG-11','Identity, Access & Governance System','Session & Device Engine','Prepares login/session/device governance.','phase_1_foundation','high','designed',array['ac360_audit_logs']),
('AC360-ENG-12','Billing Core System','Plan Catalog Engine','Stores Start, Pro and Command packages.','phase_1_foundation','critical','implemented',array['ac360_plans']),
('AC360-ENG-13','Billing Core System','Plan Versioning Engine','Keeps historical pricing versions.','phase_1_foundation','critical','implemented',array['ac360_plan_versions']),
('AC360-ENG-14','Billing Core System','Pricing Rules Engine','Controls monthly, annual, launch and custom pricing.','phase_1_foundation','critical','implemented',array['ac360_plans','ac360_plan_versions','ac360_addons']),
('AC360-ENG-15','Billing Core System','Subscription Engine','Stores active client package and lifecycle.','phase_1_foundation','critical','implemented',array['ac360_subscriptions']),
('AC360-ENG-16','Billing Core System','Subscription Item Engine','Stores base plan, add-ons, Sérénité bundles and services.','phase_1_foundation','critical','implemented',array['ac360_subscription_items']),
('AC360-ENG-17','Billing Core System','Invoice Engine','Generates and tracks invoices.','phase_1_foundation','critical','implemented',array['ac360_invoices']),
('AC360-ENG-18','Billing Core System','Invoice Line Engine','Breaks down plan, add-ons, usage and services.','phase_1_foundation','high','implemented',array['ac360_invoice_lines']),
('AC360-ENG-19','Billing Core System','Payment Tracking Engine','Tracks paid, unpaid, partial and overdue payment state.','phase_1_foundation','critical','implemented',array['ac360_payments']),
('AC360-ENG-20','Billing Core System','Renewal Engine','Prepares monthly/annual renewal cycles.','phase_1_foundation','high','implemented',array['ac360_subscriptions','ac360_invoices']),
('AC360-ENG-21','Billing Core System','Contract / Quote Engine','Handles quotes, custom contracts and enterprise pricing.','phase_1_foundation','high','implemented',array['ac360_quotes','ac360_contracts']),
('AC360-ENG-22','Entitlement & Feature Control System','Feature Registry Engine','Lists every billable feature/action family.','phase_1_foundation','critical','implemented',array['ac360_feature_registry']),
('AC360-ENG-23','Entitlement & Feature Control System','Entitlement Engine','Decides what each institution can access.','phase_1_foundation','critical','implemented',array['ac360_plan_entitlements','ac360_addon_entitlements']),
('AC360-ENG-24','Entitlement & Feature Control System','Module Access Engine','Opens/closes Admissions, HR, Transport, ParentTrust, etc.','phase_1_foundation','critical','implemented',array['ac360_feature_registry','ac360_plan_entitlements']),
('AC360-ENG-25','Entitlement & Feature Control System','Capacity Limit Engine','Controls students, staff, campuses, classes and storage limits.','phase_1_foundation','critical','implemented',array['ac360_plan_entitlements','ac360_capacity_snapshots']),
('AC360-ENG-26','Entitlement & Feature Control System','Action Permission Engine','Checks if serious actions are allowed before execution.','phase_1_foundation','critical','implemented',array['ac360_action_registry']),
('AC360-ENG-27','Entitlement & Feature Control System','Restriction Engine','Blocks/warns/restricts actions when limits or payments fail.','phase_1_foundation','critical','implemented',array['ac360_restrictions','ac360_restriction_rules']),
('AC360-ENG-28','Add-On & Growth Menu System','Add-On Store Engine','Lists purchasable modules and billable menu options.','phase_1_foundation','high','implemented',array['ac360_addons']),
('AC360-ENG-29','Add-On & Growth Menu System','Add-On Activation Engine','Activates modules instantly through subscription items.','phase_1_foundation','high','implemented',array['ac360_subscription_items','ac360_addon_entitlements']),
('AC360-ENG-30','Add-On & Growth Menu System','Add-On Cancellation Engine','Cancels access while preserving data.','phase_1_foundation','high','implemented',array['ac360_subscription_items']),
('AC360-ENG-31','Add-On & Growth Menu System','Add-On Proration Engine','Prepares mid-period add-on proration rules.','phase_1_foundation','medium','designed',array['ac360_subscription_items','ac360_invoice_lines']),
('AC360-ENG-32','Add-On & Growth Menu System','Recommended Upgrade Engine','Suggests packages/add-ons/bundles based on usage.','phase_1_foundation','high','implemented',array['ac360_recommendations']),
('AC360-ENG-33','Usage, Credits & Metering System','Usage Event Engine','Records every billable action.','phase_1_foundation','critical','implemented',array['ac360_usage_events']),
('AC360-ENG-34','Usage, Credits & Metering System','Usage Meter Engine','Counts activity by month and meter.','phase_1_foundation','critical','implemented',array['ac360_usage_meters','ac360_usage_summaries']),
('AC360-ENG-35','Usage, Credits & Metering System','Credit Wallet Engine','Stores AngelCare Credits balances.','phase_1_foundation','critical','implemented',array['ac360_credit_wallets']),
('AC360-ENG-36','Usage, Credits & Metering System','Credit Ledger Engine','Adds and deducts credits with full traceability.','phase_1_foundation','critical','implemented',array['ac360_credit_ledger']),
('AC360-ENG-37','Usage, Credits & Metering System','Overage Engine','Charges or blocks when usage exceeds allowance.','phase_1_foundation','high','implemented',array['ac360_restrictions','ac360_usage_summaries']),
('AC360-ENG-38','Usage, Credits & Metering System','Usage Alert Engine','Warns at 70%, 90% and 100% of usage.','phase_1_foundation','high','implemented',array['ac360_recommendations','ac360_automation_rules']),
('AC360-ENG-39','Account Lifecycle & Restriction System','Trial Engine','Controls free/pilot account period.','phase_1_foundation','critical','implemented',array['ac360_trials']),
('AC360-ENG-40','Account Lifecycle & Restriction System','Grace Period Engine','Allows short delay after unpaid invoices.','phase_1_foundation','critical','implemented',array['ac360_grace_periods']),
('AC360-ENG-41','Account Lifecycle & Restriction System','Warning Banner Engine','Feeds UI warning banners for payment/limit risks.','phase_1_foundation','high','implemented',array['ac360_restrictions','ac360_recommendations']),
('AC360-ENG-42','Account Lifecycle & Restriction System','Soft Restriction Engine','Blocks premium actions first.','phase_1_foundation','critical','implemented',array['ac360_restrictions']),
('AC360-ENG-43','Account Lifecycle & Restriction System','Hard Suspension Engine','Locks non-admin access when severe overdue.','phase_1_foundation','critical','implemented',array['ac360_restrictions']),
('AC360-ENG-44','Account Lifecycle & Restriction System','Archive / Data Retention Engine','Preserves data after cancellation.','phase_1_foundation','critical','implemented',array['ac360_organizations','ac360_subscription_items']),
('AC360-ENG-45','School Operations System','Student Lifecycle Engine','Enrollment, archive, transfer and alumni.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-46','School Operations System','Parent Portal Engine','Parent access, consent and communication.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-47','School Operations System','Classroom Engine','Classes, groups and planning.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-48','School Operations System','Attendance Engine','Student/staff presence.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-49','School Operations System','Finance / Tuition Engine','Tuition, receivables, payment reminders.','phase_2_operations','critical','planned',array[]::text[]),
('AC360-ENG-50','School Operations System','Document Storage Engine','Files, contracts, medical docs and storage usage.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-51','School Operations System','Reports Engine','PDFs, dashboards, exports and scheduled reporting.','phase_2_operations','high','planned',array[]::text[]),
('AC360-ENG-52','School Operations System','Task / Operations Engine','Internal school task and department management.','phase_2_operations','high','planned',array[]::text[])
on conflict (engine_code) do update set
  system_group=excluded.system_group, engine_name=excluded.engine_name, purpose=excluded.purpose, phase=excluded.phase,
  criticality=excluded.criticality, implementation_status=excluded.implementation_status, table_scope=excluded.table_scope, updated_at=now();

insert into public.ac360_permissions(permission_key, category, label, risk_level, is_system_locked) values
('ac360.foundation.view','foundation','View AC360 foundation cockpit','low',true),
('ac360.foundation.manage','foundation','Manage AC360 foundation records','critical',true),
('ac360.billing.view','billing','View packages, subscriptions and invoices','medium',true),
('ac360.billing.manage','billing','Manage packages, subscriptions and invoices','critical',true),
('ac360.entitlements.evaluate','entitlements','Evaluate feature access','high',true),
('ac360.usage.record','usage','Record usage events','high',true),
('ac360.restrictions.manage','restrictions','Manage account restrictions','critical',true),
('ac360.audit.view','audit','View AC360 audit logs','high',true)
on conflict (permission_key) do update set label=excluded.label, category=excluded.category, risk_level=excluded.risk_level, updated_at=now();

insert into public.ac360_usage_meters(meter_key, label, unit_label, category, default_credit_cost, default_unit_price_mad, aggregation, reset_interval) values
('automation_credit','Automation Credits','credit','automation',1,0.19,'sum','monthly'),
('whatsapp_message','WhatsApp Messages','message','communication',3,0.57,'sum','monthly'),
('sms_message','SMS Messages','message','communication',5,0.95,'sum','monthly'),
('email_message','Email Messages','message','communication',1,0.05,'sum','monthly'),
('ai_credit','AI Credits','credit','ai',10,0.25,'sum','monthly'),
('report_generation','Report Generation','report','reports',10,1.90,'sum','monthly'),
('storage_gb','Storage','GB','storage',0,6,'max','monthly'),
('student_capacity','Active Students','student','capacity',0,0,'max','monthly'),
('staff_user_capacity','Staff Users','user','capacity',0,0,'max','monthly'),
('campus_capacity','Campuses','campus','capacity',0,0,'max','monthly')
on conflict (meter_key) do update set label=excluded.label, category=excluded.category, default_credit_cost=excluded.default_credit_cost, default_unit_price_mad=excluded.default_unit_price_mad, updated_at=now();

insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost) values
('institution_profile','foundation','tenant','Institution profile','School account and organization profile.','core',true,false,false,null,0),
('campus_management','foundation','tenant','Campus management','Branch/site management.','capacity',true,true,false,'campus_capacity',0),
('legal_billing_profile','foundation','billing','Legal billing profile','Legal identity and billing contacts.','core',true,false,false,null,0),
('academic_years','foundation','operations','Academic years','Year separation and archive readiness.','core',true,false,false,null,0),
('rbac_basic','governance','security','Basic RBAC','Standard roles and permissions.','governance',true,true,false,null,0),
('rbac_advanced','governance','security','Advanced RBAC','Custom roles, advanced permissions and approvals.','governance',false,true,false,null,0),
('audit_logs','governance','security','Audit logs','Sensitive action traceability.','governance',false,true,false,null,0),
('billing_center','billing','billing','Billing center','Plans, subscriptions, invoices, payments and account state.','core',true,false,false,null,0),
('student_core','school_operations','students','Student management core','Active student records and basic lifecycle.','capacity',true,true,false,'student_capacity',0),
('parent_portal_basic','school_operations','parents','Parent portal basic','Basic parent access and family records.','core',true,false,false,null,0),
('staff_core','school_operations','staff','Staff user management','Staff accounts and directory.','capacity',true,true,false,'staff_user_capacity',0),
('classroom_core','school_operations','classes','Classroom structure','Classes, sections and basic groups.','capacity',true,true,false,null,0),
('attendance_basic','school_operations','attendance','Basic attendance','Student attendance basics.','access',true,true,false,null,0),
('attendance_advanced','school_operations','attendance','Advanced attendance','Corrections, alerts and advanced controls.','access',false,true,false,null,0),
('finance_basic','school_operations','finance','Basic invoicing','Monthly invoices and payment status.','access',true,true,false,null,0),
('finance_advanced','school_operations','finance','Advanced finance','Receivables, unpaid tracking and collection dashboard.','access',false,true,false,null,0),
('admissions_basic','growth_menu','admissions','Admissions basic','Basic admissions pipeline and prospects.','access',false,true,false,null,0),
('admissions_advanced','growth_menu','admissions','Advanced Admissions CRM','Campaigns, conversion analytics, lead import and public forms.','access',false,true,false,null,0),
('communication_basic','growth_menu','communication','Basic communication','Basic announcements and templates.','usage',true,true,false,'email_message',1),
('communication_whatsapp','growth_menu','communication','WhatsApp communication','WhatsApp sending, reminders and campaigns.','usage',false,true,false,'whatsapp_message',3),
('communication_sms','growth_menu','communication','SMS communication','SMS reminders and emergency messages.','usage',false,true,false,'sms_message',5),
('automation_limited','growth_menu','automation','Limited automations','Included automations for reminders and reports.','usage',false,true,false,'automation_credit',1),
('automation_builder','growth_menu','automation','Workflow builder','Custom workflows, conditional logic and sequences.','access',false,true,false,'automation_credit',1),
('reports_basic','school_operations','reports','Basic reports','Basic dashboards and exports.','access',true,true,false,'report_generation',10),
('reports_executive','school_operations','reports','Executive reports','Owner dashboards, scheduled and advanced reports.','access',false,true,false,'report_generation',10),
('tasks_basic','school_operations','tasks','Basic tasks','Basic internal task management.','access',false,true,false,null,0),
('tasks_department','school_operations','tasks','Department workspaces','Department-level boards and approvals.','access',false,true,false,null,0),
('documents_storage','foundation','documents','Document storage','Files, contracts, medical docs and PDFs.','usage',true,true,false,'storage_gb',0),
('parenttrust','growth_menu','parenttrust','ParentTrust','Surveys, complaints, satisfaction and reputation dashboard.','access',false,true,false,null,0),
('hr_staffing','growth_menu','hr','HR & Staffing','Staff shifts, recruitment, interviews and evaluations.','access',false,true,false,null,0),
('academy_training','growth_menu','academy','Academy Training','Training records, courses, certificates and skill matrix.','access',false,true,false,null,0),
('transport_module','growth_menu','transport','Transport module','Routes, drivers, vehicles, parent alerts.','access',false,true,false,null,0),
('ai_assistant','growth_menu','ai','AI Assistant','Messages, reports, summaries, translation and risk insights.','usage',false,true,false,'ai_credit',10),
('branding_basic','growth_menu','branding','Basic branded documents','Basic branded documents and templates.','access',false,true,false,null,0),
('white_label_branding','growth_menu','branding','White-label branding','Custom login, portal, domain and branded PDFs.','access',false,true,false,null,0),
('api_webhooks','enterprise','integrations','API & Webhooks','Enterprise API access and external integrations.','enterprise',false,true,true,null,0),
('security_enterprise','enterprise','security','Enterprise security','SSO, device/IP policies, advanced sensitive logs.','enterprise',false,true,true,null,0),
('credit_wallet','billing','credits','AngelCare Credits Wallet','Credits for automations, WhatsApp, SMS, AI and reports.','usage',true,true,false,'automation_credit',1)
on conflict (feature_key) do update set label=excluded.label, module_key=excluded.module_key, family=excluded.family, billing_family=excluded.billing_family, is_core=excluded.is_core, is_billable=excluded.is_billable, default_meter_key=excluded.default_meter_key, updated_at=now();

insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior) values
('org.create','institution_profile','AC360-ENG-01','Create organization','Create a new institution tenant.','foundation.org.create',null,0,'block'),
('campus.create','campus_management','AC360-ENG-02','Create campus','Add a campus/site.','capacity.campus','campus_capacity',0,'require_upgrade'),
('student.create','student_core','AC360-ENG-25','Create student','Add active student.','capacity.students','student_capacity',0,'require_upgrade'),
('staff.invite','staff_core','AC360-ENG-25','Invite staff','Invite staff user.','capacity.staff_users','staff_user_capacity',0,'require_upgrade'),
('invoice.generate','finance_basic','AC360-ENG-17','Generate invoice','Generate school invoice.','finance.invoice.generate','report_generation',10,'block'),
('payment.reminder.send','communication_whatsapp','AC360-ENG-33','Send payment reminder','Send payment reminder via WhatsApp/SMS/email.','communication.reminder.send','whatsapp_message',3,'require_topup'),
('automation.run','automation_limited','AC360-ENG-33','Run automation','Execute automation workflow.','automation.run','automation_credit',1,'require_topup'),
('report.generate','reports_basic','AC360-ENG-51','Generate report','Generate PDF/export/report.','reports.generate','report_generation',10,'require_topup'),
('ai.generate','ai_assistant','AC360-ENG-33','Generate AI output','AI message/report/summary generation.','ai.generate','ai_credit',10,'require_topup'),
('addon.activate','billing_center','AC360-ENG-29','Activate add-on','Activate Growth Menu add-on.','addons.activate',null,0,'block'),
('addon.cancel','billing_center','AC360-ENG-30','Cancel add-on','Cancel Growth Menu add-on while preserving data.','addons.cancel',null,0,'read_only')
on conflict (action_key) do update set label=excluded.label, feature_key=excluded.feature_key, engine_code=excluded.engine_code, meter_key=excluded.meter_key, credit_cost=excluded.credit_cost, restriction_behavior=excluded.restriction_behavior, updated_at=now();

insert into public.ac360_plans(plan_key,label,commercial_name,description,package_level,public_monthly_price_mad,public_annual_price_mad,target_segment,position) values
('start','AngelCare 360 Start','360 Start','Digitize school basics: students, parents, attendance, basic invoices and basic communication.',1,790,7900,'Small crèches and early digitalization',10),
('pro','AngelCare 360 Pro','360 Pro','Run daily operations professionally: attendance, finance, admissions basics, reports and parent communication.',2,1490,14900,'Serious growing kindergarten or private school',20),
('command','AngelCare 360 Command','360 Command','Control operations, finance, governance and performance from an executive cockpit.',3,2900,29000,'Premium school, owner/director, serious operator',30)
on conflict (plan_key) do update set label=excluded.label, commercial_name=excluded.commercial_name, public_monthly_price_mad=excluded.public_monthly_price_mad, public_annual_price_mad=excluded.public_annual_price_mad, updated_at=now();

insert into public.ac360_plan_versions(plan_id, version_code, label, monthly_price_mad, annual_price_mad, setup_price_mad, included_limits_json, included_credits_json, status)
select id, plan_key || '-v2026-01', commercial_name || ' v2026-01', public_monthly_price_mad, public_annual_price_mad, 0,
  case plan_key
    when 'start' then '{"students":60,"staff_users":5,"campuses":1,"classes":4,"storage_gb":5}'::jsonb
    when 'pro' then '{"students":150,"staff_users":15,"campuses":1,"classes":12,"storage_gb":25}'::jsonb
    when 'command' then '{"students":350,"staff_users":35,"campuses":2,"classes":30,"storage_gb":75}'::jsonb
  end,
  case plan_key
    when 'start' then '{"automation_credit":300}'::jsonb
    when 'pro' then '{"automation_credit":1500}'::jsonb
    when 'command' then '{"automation_credit":5000}'::jsonb
  end,
  'active'
from public.ac360_plans
on conflict (version_code) do update set monthly_price_mad=excluded.monthly_price_mad, annual_price_mad=excluded.annual_price_mad, included_limits_json=excluded.included_limits_json, included_credits_json=excluded.included_credits_json, updated_at=now();

-- Plan entitlements: core + upgrade hunger. Use explicit rows for clean DB-first checks.
with pv as (
  select pv.id, p.plan_key from public.ac360_plan_versions pv join public.ac360_plans p on p.id = pv.plan_id where pv.version_code in ('start-v2026-01','pro-v2026-01','command-v2026-01')
), rows(plan_key, feature_key, entitlement_key, access_mode, limit_key, limit_value, included_quantity, overage_behavior) as (values
('start','institution_profile','foundation.institution','included',null,null,null,'allow'),
('start','legal_billing_profile','foundation.legal','included',null,null,null,'allow'),
('start','academic_years','foundation.academic_years','included',null,null,null,'allow'),
('start','billing_center','billing.center','included',null,null,null,'allow'),
('start','campus_management','capacity.campuses','limited','campuses',1,1,'upgrade_required'),
('start','student_core','capacity.students','limited','students',60,60,'upgrade_required'),
('start','staff_core','capacity.staff_users','limited','staff_users',5,5,'upgrade_required'),
('start','classroom_core','capacity.classes','limited','classes',4,4,'upgrade_required'),
('start','documents_storage','capacity.storage','limited','storage_gb',5,5,'topup_required'),
('start','parent_portal_basic','parents.basic','included',null,null,null,'allow'),
('start','attendance_basic','attendance.basic','included',null,null,null,'allow'),
('start','finance_basic','finance.basic','included',null,null,null,'allow'),
('start','communication_basic','communication.basic','metered','automation_credit',300,300,'topup_required'),
('start','reports_basic','reports.basic','limited','reports_monthly',20,20,'topup_required'),
('start','credit_wallet','credits.wallet','metered','automation_credit',300,300,'topup_required'),
('pro','institution_profile','foundation.institution','included',null,null,null,'allow'),
('pro','legal_billing_profile','foundation.legal','included',null,null,null,'allow'),
('pro','academic_years','foundation.academic_years','included',null,null,null,'allow'),
('pro','billing_center','billing.center','included',null,null,null,'allow'),
('pro','campus_management','capacity.campuses','limited','campuses',1,1,'upgrade_required'),
('pro','student_core','capacity.students','limited','students',150,150,'upgrade_required'),
('pro','staff_core','capacity.staff_users','limited','staff_users',15,15,'upgrade_required'),
('pro','classroom_core','capacity.classes','limited','classes',12,12,'upgrade_required'),
('pro','documents_storage','capacity.storage','limited','storage_gb',25,25,'topup_required'),
('pro','parent_portal_basic','parents.basic','included',null,null,null,'allow'),
('pro','attendance_advanced','attendance.advanced','included',null,null,null,'allow'),
('pro','finance_basic','finance.full','included',null,null,null,'allow'),
('pro','admissions_basic','admissions.basic','included',null,null,null,'allow'),
('pro','communication_basic','communication.standard','metered','automation_credit',1500,1500,'topup_required'),
('pro','automation_limited','automation.limited','metered','automation_credit',1500,1500,'topup_required'),
('pro','reports_basic','reports.standard','limited','reports_monthly',80,80,'topup_required'),
('pro','tasks_basic','tasks.basic','included',null,null,null,'allow'),
('pro','rbac_basic','governance.rbac_basic','included',null,null,null,'allow'),
('pro','credit_wallet','credits.wallet','metered','automation_credit',1500,1500,'topup_required'),
('command','institution_profile','foundation.institution','included',null,null,null,'allow'),
('command','legal_billing_profile','foundation.legal','included',null,null,null,'allow'),
('command','academic_years','foundation.academic_years','included',null,null,null,'allow'),
('command','billing_center','billing.center','included',null,null,null,'allow'),
('command','campus_management','capacity.campuses','limited','campuses',2,2,'upgrade_required'),
('command','student_core','capacity.students','limited','students',350,350,'upgrade_required'),
('command','staff_core','capacity.staff_users','limited','staff_users',35,35,'upgrade_required'),
('command','classroom_core','capacity.classes','limited','classes',30,30,'upgrade_required'),
('command','documents_storage','capacity.storage','limited','storage_gb',75,75,'topup_required'),
('command','parent_portal_basic','parents.full','included',null,null,null,'allow'),
('command','attendance_advanced','attendance.advanced_control','included',null,null,null,'allow'),
('command','finance_advanced','finance.advanced','included',null,null,null,'allow'),
('command','admissions_basic','admissions.full_pipeline','included',null,null,null,'allow'),
('command','communication_basic','communication.advanced','metered','automation_credit',5000,5000,'topup_required'),
('command','communication_whatsapp','communication.whatsapp_limited','metered','whatsapp_message',500,500,'topup_required'),
('command','automation_limited','automation.higher_allowance','metered','automation_credit',5000,5000,'topup_required'),
('command','reports_executive','reports.executive','included',null,null,null,'allow'),
('command','tasks_department','tasks.department','included',null,null,null,'allow'),
('command','rbac_advanced','governance.rbac_advanced','included',null,null,null,'allow'),
('command','audit_logs','governance.audit_logs','included',null,null,null,'allow'),
('command','branding_basic','branding.documents','included',null,null,null,'allow'),
('command','credit_wallet','credits.wallet','metered','automation_credit',5000,5000,'topup_required')
)
insert into public.ac360_plan_entitlements(plan_version_id, feature_key, entitlement_key, access_mode, limit_key, limit_value, included_quantity, overage_behavior)
select pv.id, r.feature_key, r.entitlement_key, r.access_mode, r.limit_key, r.limit_value, r.included_quantity, r.overage_behavior
from rows r join pv on pv.plan_key = r.plan_key
on conflict (plan_version_id, feature_key, entitlement_key) do update set access_mode=excluded.access_mode, limit_key=excluded.limit_key, limit_value=excluded.limit_value, included_quantity=excluded.included_quantity, overage_behavior=excluded.overage_behavior, updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable) values
('extra_50_students','Extra 50 Students','capacity','Adds capacity for 50 additional active students.','monthly',250,0,'50 students','{"students":50}'::jsonb,true),
('extra_5_staff','Extra 5 Staff Users','capacity','Adds capacity for 5 staff users.','monthly',150,0,'5 staff users','{"staff_users":5}'::jsonb,true),
('extra_campus','Extra Campus','capacity','Adds one additional campus/site.','monthly',700,0,'campus','{"campuses":1}'::jsonb,true),
('storage_25gb','Extra 25 GB Storage','capacity','Adds 25 GB file/document storage.','monthly',150,0,'25 GB','{"storage_gb":25}'::jsonb,true),
('advanced_admissions','Advanced Admissions CRM','admissions','Lead import, campaigns, conversion analytics, public forms and duplicate detection.','monthly',490,0,'module','{}'::jsonb,true),
('finance_power','Finance Power','finance','Advanced unpaid tracking, receivables aging, collection workflow and accountant access.','monthly',690,0,'module','{}'::jsonb,true),
('communication_omnichannel','Communication Power','communication','WhatsApp/SMS/email campaigns, scheduled messages and analytics access.','monthly',390,0,'module','{}'::jsonb,true),
('workflow_builder','Workflow Builder','automation','Custom workflows, conditional logic, approval automation and scheduled reports.','monthly',590,0,'module','{}'::jsonb,true),
('parenttrust','ParentTrust Premium','parenttrust','Surveys, complaints, engagement analytics and reputation reporting.','monthly',900,0,'module','{}'::jsonb,true),
('hr_staffing','HR & Staffing','hr','Staff attendance, leave, recruitment, interviews, evaluation and onboarding workflows.','monthly',590,0,'module','{}'::jsonb,true),
('academy_training','Academy Training','academy','Training records, course library, assessments, certificates and skill matrix.','monthly',990,0,'module','{}'::jsonb,true),
('transport_module','Transport Module','transport','Routes, vehicles, drivers, route alerts and transport reports.','monthly',690,0,'module','{}'::jsonb,true),
('ai_assistant','AI Assistant Pack','ai','AI messages, reports, summaries, translation and data cleanup support.','monthly',390,0,'module','{"ai_credit":1000}'::jsonb,true),
('white_label_branding','White Label Branding','branding','Custom portal branding, branded PDFs, login page and identity controls.','setup_plus_monthly',300,1500,'module','{}'::jsonb,true),
('custom_domain','Custom Domain','branding','Custom parent/school portal domain setup and monthly maintenance.','setup_plus_monthly',400,900,'domain','{}'::jsonb,true),
('api_webhooks','API & Webhooks','integrations','Enterprise API access, webhooks and external integration readiness.','enterprise_quote',1200,2500,'module','{}'::jsonb,true),
('enterprise_security','Enterprise Security','security','SSO, IP/device restrictions, sensitive access logs and advanced policies.','enterprise_quote',1500,2500,'module','{}'::jsonb,true),
('credits_1000','1,000 AngelCare Credits','credits','Credits for automations, WhatsApp/SMS, AI and reports.','usage',190,0,'1,000 credits','{"automation_credit":1000}'::jsonb,true),
('credits_5000','5,000 AngelCare Credits','credits','Credits for automations, WhatsApp/SMS, AI and reports.','usage',790,0,'5,000 credits','{"automation_credit":5000}'::jsonb,true),
('credits_10000','10,000 AngelCare Credits','credits','Credits for automations, WhatsApp/SMS, AI and reports.','usage',1390,0,'10,000 credits','{"automation_credit":10000}'::jsonb,true)
on conflict (addon_key) do update set label=excluded.label, family=excluded.family, monthly_price_mad=excluded.monthly_price_mad, setup_price_mad=excluded.setup_price_mad, included_allowance_json=excluded.included_allowance_json, updated_at=now();

with rows(addon_key, feature_key, entitlement_key, access_mode, limit_key, limit_value, included_quantity) as (values
('extra_50_students','student_core','capacity.students.extra_50','limited','students',50,50),
('extra_5_staff','staff_core','capacity.staff.extra_5','limited','staff_users',5,5),
('extra_campus','campus_management','capacity.campus.extra_1','limited','campuses',1,1),
('storage_25gb','documents_storage','capacity.storage.extra_25gb','limited','storage_gb',25,25),
('advanced_admissions','admissions_advanced','admissions.advanced','included',null,null,null),
('finance_power','finance_advanced','finance.power','included',null,null,null),
('communication_omnichannel','communication_whatsapp','communication.whatsapp','metered','whatsapp_message',null,null),
('communication_omnichannel','communication_sms','communication.sms','metered','sms_message',null,null),
('workflow_builder','automation_builder','automation.builder','included',null,null,null),
('parenttrust','parenttrust','parenttrust.full','included',null,null,null),
('hr_staffing','hr_staffing','hr.staffing','included',null,null,null),
('academy_training','academy_training','academy.training','included',null,null,null),
('transport_module','transport_module','transport.full','included',null,null,null),
('ai_assistant','ai_assistant','ai.assistant','metered','ai_credit',1000,1000),
('white_label_branding','white_label_branding','branding.white_label','included',null,null,null),
('custom_domain','white_label_branding','branding.custom_domain','included',null,null,null),
('api_webhooks','api_webhooks','integrations.api_webhooks','included',null,null,null),
('enterprise_security','security_enterprise','security.enterprise','included',null,null,null),
('credits_1000','credit_wallet','credits.1000','metered','automation_credit',1000,1000),
('credits_5000','credit_wallet','credits.5000','metered','automation_credit',5000,5000),
('credits_10000','credit_wallet','credits.10000','metered','automation_credit',10000,10000)
)
insert into public.ac360_addon_entitlements(addon_key, feature_key, entitlement_key, access_mode, limit_key, limit_value, included_quantity)
select * from rows
on conflict (addon_key, feature_key, entitlement_key) do update set access_mode=excluded.access_mode, limit_key=excluded.limit_key, limit_value=excluded.limit_value, included_quantity=excluded.included_quantity;

insert into public.ac360_serenite_bundles(bundle_key,label,description,monthly_price_mad,included_allowance_json,support_level) values
('serenite_essential','Sérénité Essential','Safe monthly comfort: extra credits, usage summary and priority remote support.',690,'{"automation_credit":3000,"report_generation":50,"support":"priority_remote"}'::jsonb,'priority_remote'),
('serenite_plus','Sérénité Plus','Strong operational comfort: larger communication/automation allowance, finance report and quarterly optimization.',1490,'{"automation_credit":8000,"whatsapp_message":1000,"report_generation":150,"support":"priority_plus"}'::jsonb,'priority_plus'),
('serenite_premium','Sérénité Premium','Premium comfort: high allowance, executive report, ParentTrust mini-report and dedicated success contact.',2900,'{"automation_credit":20000,"whatsapp_message":3000,"sms_message":500,"ai_credit":3000,"report_generation":400,"support":"dedicated_success"}'::jsonb,'dedicated_success')
on conflict (bundle_key) do update set label=excluded.label, monthly_price_mad=excluded.monthly_price_mad, included_allowance_json=excluded.included_allowance_json, updated_at=now();

insert into public.ac360_professional_services_catalog(service_key,label,family,description,min_price_mad,max_price_mad,billing_model,deliverable) values
('basic_excel_import','Basic Excel Import','data_migration','Import clean student/parent/staff Excel files.',1500,3500,'one_time','Validated import + error summary'),
('full_data_migration','Full Data Migration','data_migration','Student, parent, staff, finance and historical record migration.',3900,12000,'one_time','Migration workbook + live imported records'),
('finance_history_migration','Finance History Migration','data_migration','Historical invoices, balances and payment records.',2500,9000,'one_time','Finance migration proof + reconciliation checklist'),
('premium_onboarding','Premium Onboarding','onboarding','Configuration, kickoff, templates and first team training.',3900,12000,'one_time','Launch checklist + configured account'),
('onsite_training','On-site Training','training','On-site training for directors, admin, teachers or finance team.',2500,8000,'one_time','Training attendance + training report'),
('operations_audit','School Operations Audit','consulting','School ops, parent experience, admissions, HR or finance audit.',2500,9000,'one_time','Audit report + 30-day action plan'),
('custom_implementation','Custom Implementation','enterprise','Custom workflows, integrations, enterprise setups or multi-site rollout.',12000,null,'enterprise_quote','Statement of work + phased delivery plan')
on conflict (service_key) do update set label=excluded.label, min_price_mad=excluded.min_price_mad, max_price_mad=excluded.max_price_mad, updated_at=now();

insert into public.ac360_restriction_rules(rule_key,label,trigger_type,severity,condition_json,action_json,is_enabled,sort_order) values
('trial_expired','Trial expired','trial.end','critical','{"trial_status":"expired"}'::jsonb,'{"behavior":"admin_only","message":"Trial ended. Select a package to continue."}'::jsonb,true,10),
('invoice_unpaid_d3_warning','Invoice unpaid D+3 warning','invoice.overdue','warning','{"days_overdue":3}'::jsonb,'{"behavior":"warn","message":"Payment reminder banner."}'::jsonb,true,20),
('invoice_unpaid_d7_disable_automations','Invoice unpaid D+7 disable automations','invoice.overdue','high','{"days_overdue":7}'::jsonb,'{"behavior":"block","target_feature":"automation_limited","message":"Automations paused until payment."}'::jsonb,true,30),
('invoice_unpaid_d14_block_new_students','Invoice unpaid D+14 block new students','invoice.overdue','critical','{"days_overdue":14}'::jsonb,'{"behavior":"block","target_action":"student.create","message":"New student creation blocked until payment."}'::jsonb,true,40),
('invoice_unpaid_d21_suspend_non_admin','Invoice unpaid D+21 suspend non-admin','invoice.overdue','critical','{"days_overdue":21}'::jsonb,'{"behavior":"suspend_non_admin","message":"Non-admin access suspended until payment."}'::jsonb,true,50),
('student_limit_reached','Student limit reached','capacity.limit','high','{"capacity_key":"students","threshold":1}'::jsonb,'{"behavior":"upgrade_required","target_action":"student.create"}'::jsonb,true,60),
('staff_limit_reached','Staff user limit reached','capacity.limit','high','{"capacity_key":"staff_users","threshold":1}'::jsonb,'{"behavior":"upgrade_required","target_action":"staff.invite"}'::jsonb,true,70),
('campus_limit_reached','Campus limit reached','capacity.limit','high','{"capacity_key":"campuses","threshold":1}'::jsonb,'{"behavior":"upgrade_required","target_action":"campus.create"}'::jsonb,true,80),
('storage_limit_reached','Storage limit reached','capacity.limit','high','{"capacity_key":"storage_gb","threshold":1}'::jsonb,'{"behavior":"topup_required","target_feature":"documents_storage"}'::jsonb,true,90),
('credits_exhausted','AngelCare credits exhausted','usage.credits','high','{"balance_lte":0}'::jsonb,'{"behavior":"topup_required","target_feature":"credit_wallet"}'::jsonb,true,100),
('addon_cancelled_readonly','Add-on cancelled read-only','addon.cancelled','medium','{"cancelled":true}'::jsonb,'{"behavior":"read_only","message":"Data preserved; editing disabled after billing period."}'::jsonb,true,110)
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,status,phase,sort_order) values
('usage_70_warn','Usage 70% warning','Usage, Credits & Metering System','usage.summary.updated','{"threshold":0.70}'::jsonb,'{"create_recommendation":true,"severity":"warning"}'::jsonb,'active','phase_1_foundation',10),
('usage_90_upgrade','Usage 90% upgrade recommendation','Usage, Credits & Metering System','usage.summary.updated','{"threshold":0.90}'::jsonb,'{"recommend":"serenite_plus_or_topup","severity":"high"}'::jsonb,'active','phase_1_foundation',20),
('limit_100_block','Limit 100% restriction','Entitlement & Feature Control System','capacity.limit.reached','{"threshold":1.0}'::jsonb,'{"create_restriction":true,"behavior":"upgrade_required"}'::jsonb,'active','phase_1_foundation',30),
('addon_cancel_preserve','Add-on cancel preserves data','Add-On & Growth Menu System','addon.cancelled','{"cancel_at_period_end":true}'::jsonb,'{"set_feature_read_only":true,"preserve_data":true}'::jsonb,'active','phase_1_foundation',40),
('past_due_d7_pause_automation','Past due D+7 pauses automation','Account Lifecycle & Restriction System','invoice.overdue','{"days_overdue":7}'::jsonb,'{"target_feature":"automation_limited","behavior":"block"}'::jsonb,'active','phase_1_foundation',50),
('manual_reminder_recommend_automation','Manual reminders recommend automation','Add-On & Growth Menu System','usage.pattern.detected','{"action":"payment.reminder.send","manual_count_gt":30}'::jsonb,'{"recommend_addon":"workflow_builder"}'::jsonb,'active','phase_1_foundation',60),
('unpaid_high_recommend_finance_power','High unpaid balances recommend Finance Power','Add-On & Growth Menu System','finance.unpaid.detected','{"unpaid_ratio_gt":0.20}'::jsonb,'{"recommend_addon":"finance_power"}'::jsonb,'active','phase_1_foundation',70),
('parent_issues_recommend_parenttrust','Parent issues recommend ParentTrust','Add-On & Growth Menu System','parent.issue.detected','{"open_parent_issues_gt":5}'::jsonb,'{"recommend_addon":"parenttrust"}'::jsonb,'active','phase_1_foundation',80)
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, status=excluded.status, updated_at=now();
