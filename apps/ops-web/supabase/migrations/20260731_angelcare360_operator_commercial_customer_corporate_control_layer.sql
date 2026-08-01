begin;

create table if not exists public.angelcare360_operator_growth_account_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  horizon_months integer not null default 36,
  ambition_mad numeric(14,2) not null default 0,
  current_footprint jsonb not null default '{}'::jsonb,
  potential_footprint jsonb not null default '{}'::jsonb,
  strategic_priorities jsonb not null default '[]'::jsonb,
  whitespace_opportunities jsonb not null default '[]'::jsonb,
  competitive_position text,
  stakeholder_strategy jsonb not null default '{}'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  owner_id uuid,
  executive_sponsor_id uuid,
  next_review_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','review','completed','archived'))
);

create table if not exists public.angelcare360_operator_growth_relationship_coverage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  status text not null default 'active',
  executive_sponsor_score integer not null default 0 check (executive_sponsor_score between 0 and 100),
  economic_buyer_score integer not null default 0 check (economic_buyer_score between 0 and 100),
  contract_authority_score integer not null default 0 check (contract_authority_score between 0 and 100),
  operational_champion_score integer not null default 0 check (operational_champion_score between 0 and 100),
  relationship_recency_score integer not null default 0 check (relationship_recency_score between 0 and 100),
  single_contact_dependency boolean not null default false,
  missing_roles jsonb not null default '[]'::jsonb,
  risk_signals jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  assessed_at timestamptz not null default now(),
  assessed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_growth_forecasts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.angelcare360_operator_growth_opportunities(id) on delete cascade,
  owner_id uuid,
  period_key text not null,
  forecast_category text not null default 'pipeline',
  seller_amount_mad numeric(14,2) not null default 0,
  manager_amount_mad numeric(14,2) not null default 0,
  confidence integer not null default 50 check (confidence between 0 and 100),
  adjustment_reason text,
  snapshot_at timestamptz not null default now(),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (forecast_category in ('pipeline','best_case','commit','closed_won','excluded')),
  unique (opportunity_id, period_key, snapshot_at)
);

create table if not exists public.angelcare360_operator_growth_approvals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  opportunity_id uuid references public.angelcare360_operator_growth_opportunities(id) on delete cascade,
  offer_id uuid references public.angelcare360_operator_growth_offers(id) on delete cascade,
  approval_type text not null,
  status text not null default 'requested',
  requested_value jsonb not null default '{}'::jsonb,
  policy_limit jsonb not null default '{}'::jsonb,
  financial_impact_mad numeric(14,2) not null default 0,
  required_authority text not null default 'commercial_manager',
  approver_id uuid,
  decision_reason text,
  due_at timestamptz,
  decided_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('requested','pending','approved','rejected','cancelled')),
  check (client_id is not null or opportunity_id is not null or offer_id is not null)
);

create table if not exists public.angelcare360_operator_growth_change_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  contract_id uuid references public.angelcare360_operator_contracts(id) on delete set null,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  change_order_code text not null unique,
  change_type text not null,
  status text not null default 'draft',
  current_state jsonb not null default '{}'::jsonb,
  proposed_state jsonb not null default '{}'::jsonb,
  billing_effect jsonb not null default '{}'::jsonb,
  entitlement_effect jsonb not null default '{}'::jsonb,
  effective_at timestamptz,
  approval_id uuid references public.angelcare360_operator_growth_approvals(id) on delete set null,
  customer_communication_required boolean not null default true,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','review','pending_approval','approved','scheduled','executing','completed','cancelled'))
);

create table if not exists public.angelcare360_operator_growth_success_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  objective text not null,
  baseline_value text,
  target_value text,
  current_value text,
  success_metrics jsonb not null default '[]'::jsonb,
  product_capabilities jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  customer_owner text,
  angelcare_owner_id uuid,
  next_review_at timestamptz,
  outcome_status text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','at_risk','achieved','closed'))
);

create table if not exists public.angelcare360_operator_growth_health_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  is_default boolean not null default false,
  dimensions jsonb not null default '[]'::jsonb,
  thresholds jsonb not null default '{"healthy":75,"warning":50,"critical":30}'::jsonb,
  refresh_cadence text not null default 'daily',
  recovery_playbooks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','retired'))
);

create unique index if not exists uq_growth_health_default
  on public.angelcare360_operator_growth_health_models ((is_default)) where is_default = true and status = 'active';

create table if not exists public.angelcare360_operator_growth_support_entitlements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  contract_id uuid references public.angelcare360_operator_contracts(id) on delete set null,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  support_tier text not null default 'standard',
  status text not null default 'active',
  covered_modules jsonb not null default '[]'::jsonb,
  covered_institutions jsonb not null default '[]'::jsonb,
  included_hours numeric(10,2) not null default 0,
  consumed_hours numeric(10,2) not null default 0,
  response_target_minutes integer not null default 240,
  resolution_target_minutes integer not null default 1440,
  support_channels jsonb not null default '["email"]'::jsonb,
  escalation_level text not null default 'standard',
  business_calendar jsonb not null default '{}'::jsonb,
  out_of_scope_policy text not null default 'approval_required',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_growth_escalations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  case_id uuid references public.angelcare360_operator_customer_cases(id) on delete set null,
  escalation_type text not null default 'account',
  status text not null default 'open',
  severity text not null default 'high',
  title text not null,
  revenue_exposure_mad numeric(14,2) not null default 0,
  relationship_exposure text not null default '',
  owner_id uuid,
  executive_sponsor_id uuid,
  command_team jsonb not null default '[]'::jsonb,
  review_cadence text not null default 'daily',
  exit_criteria jsonb not null default '[]'::jsonb,
  next_checkpoint_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','command_active','monitoring','resolved','closed')),
  check (severity in ('low','medium','high','critical'))
);

create index if not exists idx_growth_account_plans_client on public.angelcare360_operator_growth_account_plans(client_id, status);
create index if not exists idx_growth_relationship_coverage_client on public.angelcare360_operator_growth_relationship_coverage(client_id, assessed_at desc);
create index if not exists idx_growth_forecasts_period on public.angelcare360_operator_growth_forecasts(period_key, forecast_category);
create index if not exists idx_growth_approvals_status on public.angelcare360_operator_growth_approvals(status, required_authority, due_at);
create index if not exists idx_growth_change_orders_client on public.angelcare360_operator_growth_change_orders(client_id, status, effective_at);
create index if not exists idx_growth_success_plans_client on public.angelcare360_operator_growth_success_plans(client_id, status);
create index if not exists idx_growth_support_entitlements_client on public.angelcare360_operator_growth_support_entitlements(client_id, status);
create index if not exists idx_growth_escalations_client on public.angelcare360_operator_growth_escalations(client_id, status, severity);

alter table public.angelcare360_operator_growth_account_plans enable row level security;
alter table public.angelcare360_operator_growth_relationship_coverage enable row level security;
alter table public.angelcare360_operator_growth_forecasts enable row level security;
alter table public.angelcare360_operator_growth_approvals enable row level security;
alter table public.angelcare360_operator_growth_change_orders enable row level security;
alter table public.angelcare360_operator_growth_success_plans enable row level security;
alter table public.angelcare360_operator_growth_health_models enable row level security;
alter table public.angelcare360_operator_growth_support_entitlements enable row level security;
alter table public.angelcare360_operator_growth_escalations enable row level security;

revoke all on table public.angelcare360_operator_growth_account_plans from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_relationship_coverage from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_forecasts from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_approvals from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_change_orders from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_success_plans from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_health_models from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_support_entitlements from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_escalations from anon, authenticated;

grant all on table public.angelcare360_operator_growth_account_plans to service_role;
grant all on table public.angelcare360_operator_growth_relationship_coverage to service_role;
grant all on table public.angelcare360_operator_growth_forecasts to service_role;
grant all on table public.angelcare360_operator_growth_approvals to service_role;
grant all on table public.angelcare360_operator_growth_change_orders to service_role;
grant all on table public.angelcare360_operator_growth_success_plans to service_role;
grant all on table public.angelcare360_operator_growth_health_models to service_role;
grant all on table public.angelcare360_operator_growth_support_entitlements to service_role;
grant all on table public.angelcare360_operator_growth_escalations to service_role;

insert into public.angelcare360_operator_growth_health_models (
  name, status, is_default, dimensions, thresholds, refresh_cadence, recovery_playbooks
)
select
  'AngelCare Customer Health · Corporate',
  'active',
  true,
  '[{"key":"relationship","label":"Relation","weight":15},{"key":"product_adoption","label":"Adoption produit","weight":20},{"key":"service_quality","label":"Qualité service","weight":15},{"key":"support_pressure","label":"Pression support","weight":10},{"key":"complaint_severity","label":"Réclamations","weight":10},{"key":"financial_reliability","label":"Fiabilité financière","weight":15},{"key":"renewal_readiness","label":"Renouvellement","weight":15}]'::jsonb,
  '{"healthy":75,"warning":50,"critical":30}'::jsonb,
  'daily',
  '{"critical":"executive_recovery","warning":"account_recovery","healthy":"maintain_cadence"}'::jsonb
where not exists (
  select 1 from public.angelcare360_operator_growth_health_models where is_default = true and status = 'active'
);

commit;
