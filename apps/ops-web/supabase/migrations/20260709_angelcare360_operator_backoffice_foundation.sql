-- AngelCare 360 Operator Backoffice Foundation
-- Internal SaaS operator namespace only.

begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_operator_clients (
  id uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  display_name text not null,
  legal_name text,
  client_type text not null,
  city text,
  country text not null default 'Maroc',
  address text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  commercial_owner_id uuid,
  account_manager_id uuid,
  support_owner_id uuid,
  status text not null default 'prospect',
  lifecycle_stage text not null default 'lead',
  source text,
  health_status text,
  risk_level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (status in ('prospect', 'pilot', 'active', 'suspended', 'churned', 'archived')),
  check (lifecycle_stage in ('lead', 'qualified', 'demo_done', 'proposal_sent', 'contract_pending', 'onboarding', 'live', 'renewal', 'at_risk', 'churned'))
);

create table if not exists public.angelcare360_operator_tenants (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  school_id uuid references public.angelcare360_schools(id) on delete set null,
  tenant_slug text not null unique,
  environment text not null default 'pilot',
  status text not null default 'not_created',
  provisioning_status text not null default 'pending',
  command_center_url text,
  go_live_date date,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (environment in ('pilot', 'production', 'sandbox')),
  check (status in ('not_created', 'provisioning', 'active', 'suspended', 'archived'))
);

create table if not exists public.angelcare360_operator_plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null unique,
  name text not null,
  description text,
  monthly_price_mad numeric not null default 0,
  annual_price_mad numeric not null default 0,
  billing_cycle text not null default 'monthly',
  max_students integer,
  max_staff integer,
  max_users integer,
  max_sites integer,
  included_modules jsonb not null default '[]'::jsonb,
  included_features jsonb not null default '[]'::jsonb,
  support_level text not null default 'standard',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'active', 'retired', 'archived'))
);

create table if not exists public.angelcare360_operator_packages (
  id uuid primary key default gen_random_uuid(),
  package_code text not null unique,
  name text not null,
  description text,
  module_keys jsonb not null default '[]'::jsonb,
  feature_keys jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'active', 'retired', 'archived'))
);

create table if not exists public.angelcare360_operator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  plan_id uuid not null references public.angelcare360_operator_plans(id) on delete restrict,
  subscription_code text not null unique,
  status text not null default 'trial',
  start_date date not null,
  trial_ends_at date,
  current_period_start date,
  current_period_end date,
  billing_cycle text not null default 'monthly',
  billing_amount_mad numeric not null default 0,
  discount_amount_mad numeric not null default 0,
  cancellation_reason text,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired', 'archived'))
);

create table if not exists public.angelcare360_operator_feature_flags (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  feature_key text not null,
  feature_label text not null,
  module_key text not null,
  status text not null default 'disabled',
  enabled boolean not null default false,
  locked_reason text,
  scheduled_for date,
  activated_at timestamptz,
  activated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, tenant_id, feature_key),
  check (status in ('enabled', 'disabled', 'locked', 'scheduled', 'requires_configuration'))
);

create table if not exists public.angelcare360_operator_usage_limits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  limit_key text not null,
  label text not null,
  allowed_value integer,
  current_value integer not null default 0,
  unit text not null default 'unités',
  status text not null default 'active',
  reset_cycle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, tenant_id, limit_key),
  check (status in ('active', 'paused', 'archived'))
);

create table if not exists public.angelcare360_operator_billing_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  billing_name text not null,
  billing_email text not null,
  billing_phone text,
  billing_address text,
  tax_identifier text,
  payment_terms_days integer not null default 7,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.angelcare360_operator_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  billing_account_id uuid references public.angelcare360_operator_billing_accounts(id) on delete set null,
  invoice_number text not null unique,
  issue_date date not null,
  due_date date not null,
  period_start date,
  period_end date,
  subtotal_mad numeric not null default 0,
  discount_mad numeric not null default 0,
  total_mad numeric not null default 0,
  amount_paid_mad numeric not null default 0,
  balance_due_mad numeric not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_operator_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  invoice_id uuid references public.angelcare360_operator_invoices(id) on delete set null,
  payment_reference text not null unique,
  payment_date date not null,
  amount_mad numeric not null,
  method text not null,
  status text not null default 'pending',
  received_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (method in ('bank_transfer', 'cash', 'cheque', 'card_manual', 'other')),
  check (status in ('pending', 'confirmed', 'rejected', 'refunded', 'cancelled'))
);

create table if not exists public.angelcare360_operator_dunning_actions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  invoice_id uuid references public.angelcare360_operator_invoices(id) on delete set null,
  action_type text not null,
  status text not null default 'planned',
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('planned', 'in_progress', 'completed', 'blocked', 'cancelled'))
);

create table if not exists public.angelcare360_operator_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid,
  status text not null default 'todo',
  priority text not null default 'normal',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  check (priority in ('low', 'normal', 'high', 'urgent'))
);

create table if not exists public.angelcare360_operator_support_tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  subject text not null,
  description text not null,
  category text not null,
  priority text not null default 'normal',
  status text not null default 'new',
  assigned_to uuid,
  resolution_summary text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (priority in ('low', 'normal', 'high', 'urgent')),
  check (status in ('new', 'triage', 'assigned', 'waiting_client', 'waiting_internal', 'resolved', 'closed', 'archived'))
);

create table if not exists public.angelcare360_operator_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  contract_code text not null unique,
  status text not null default 'draft',
  start_date date not null,
  end_date date,
  renewal_date date,
  signed_at timestamptz,
  document_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'sent', 'signed', 'active', 'expired', 'cancelled', 'archived'))
);

create table if not exists public.angelcare360_operator_renewals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  renewal_date date not null,
  status text not null default 'upcoming',
  probability integer,
  expected_amount_mad numeric,
  owner_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (probability is null or probability between 0 and 100),
  check (status in ('upcoming', 'in_discussion', 'proposal_sent', 'renewed', 'at_risk', 'lost', 'cancelled'))
);

create table if not exists public.angelcare360_operator_service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  request_type text not null,
  title text not null,
  description text not null,
  priority text not null default 'normal',
  status text not null default 'new',
  assigned_to uuid,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (priority in ('low', 'normal', 'high', 'urgent')),
  check (status in ('new', 'triage', 'assigned', 'waiting_client', 'waiting_internal', 'resolved', 'closed', 'archived'))
);

create table if not exists public.angelcare360_operator_incidents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  description text not null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('low', 'medium', 'high', 'critical')),
  check (status in ('open', 'investigating', 'mitigated', 'resolved', 'archived'))
);

create table if not exists public.angelcare360_operator_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid,
  status text not null default 'todo',
  priority text not null default 'normal',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  check (priority in ('low', 'normal', 'high', 'urgent'))
);

create table if not exists public.angelcare360_operator_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  author_id uuid,
  note_type text not null default 'note',
  body text not null,
  visibility text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility in ('internal', 'restricted', 'public'))
);

create table if not exists public.angelcare360_operator_service_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  title text not null,
  description text,
  status text not null default 'open',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (status in ('open', 'watching', 'resolved', 'archived')),
  check (severity in ('info', 'low', 'medium', 'high', 'critical'))
);

create table if not exists public.angelcare360_operator_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  client_id uuid,
  tenant_id uuid,
  module text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  severity text not null default 'info',
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('debug', 'info', 'notice', 'warning', 'critical'))
);

create index if not exists angelcare360_operator_clients_status_idx on public.angelcare360_operator_clients (status);
create index if not exists angelcare360_operator_clients_lifecycle_stage_idx on public.angelcare360_operator_clients (lifecycle_stage);
create index if not exists angelcare360_operator_clients_risk_level_idx on public.angelcare360_operator_clients (risk_level);
create index if not exists angelcare360_operator_tenants_client_id_idx on public.angelcare360_operator_tenants (client_id);
create index if not exists angelcare360_operator_tenants_status_idx on public.angelcare360_operator_tenants (status);
create index if not exists angelcare360_operator_plans_status_idx on public.angelcare360_operator_plans (status);
create index if not exists angelcare360_operator_subscriptions_status_idx on public.angelcare360_operator_subscriptions (status);
create index if not exists angelcare360_operator_invoices_status_idx on public.angelcare360_operator_invoices (status);
create index if not exists angelcare360_operator_payments_status_idx on public.angelcare360_operator_payments (status);
create index if not exists angelcare360_operator_payments_payment_date_idx on public.angelcare360_operator_payments (payment_date);
create index if not exists angelcare360_operator_renewals_renewal_date_idx on public.angelcare360_operator_renewals (renewal_date);
create index if not exists angelcare360_operator_support_tickets_status_idx on public.angelcare360_operator_support_tickets (status);
create index if not exists angelcare360_operator_support_tickets_priority_idx on public.angelcare360_operator_support_tickets (priority);
create index if not exists angelcare360_operator_audit_logs_created_at_idx on public.angelcare360_operator_audit_logs (created_at desc);

commit;
