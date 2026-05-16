-- SALES MODULE V30 PACK 6 — GROWTH & CONVERSION DEPTH
-- Safe additive migration. No destructive statements.

create table if not exists sales_renewal_controls (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  related_deal_id uuid null,
  renewal_window date null,
  current_package text,
  renewal_status text default 'watching',
  satisfaction_signal text,
  payment_behavior text,
  upsell_readiness integer default 0 check (upsell_readiness between 0 and 100),
  recommended_action text,
  owner_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales_cross_sell_recommendations (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  primary_offer text not null,
  recommended_offer text not null,
  fit_reason text,
  fulfillment_condition text,
  status text default 'recommended',
  owner_id uuid null,
  created_at timestamptz default now()
);

create table if not exists sales_persona_profiles (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  client_name text,
  persona_type text not null,
  decision_driver text,
  proof_needed text,
  recommended_script text,
  pressure_level text default 'balanced',
  created_at timestamptz default now()
);

create table if not exists sales_service_fit_assessments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  client_name text,
  need_severity integer default 0 check (need_severity between 0 and 100),
  payment_readiness integer default 0 check (payment_readiness between 0 and 100),
  decision_power integer default 0 check (decision_power between 0 and 100),
  fulfillment_feasibility integer default 0 check (fulfillment_feasibility between 0 and 100),
  fit_decision text default 'review',
  manager_note text,
  created_at timestamptz default now()
);

create table if not exists sales_deal_expansion_paths (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null,
  client_name text not null,
  expansion_type text not null,
  next_moment_at timestamptz null,
  expansion_owner_id uuid null,
  required_proof text,
  blocker text,
  status text default 'planned',
  created_at timestamptz default now()
);

create table if not exists sales_territory_growth_controls (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  zone text,
  demand_signal text,
  fulfillment_friction text,
  recommended_focus text,
  risk_rule text,
  priority_score integer default 0 check (priority_score between 0 and 100),
  created_at timestamptz default now()
);

alter table sales_renewal_controls enable row level security;
alter table sales_cross_sell_recommendations enable row level security;
alter table sales_persona_profiles enable row level security;
alter table sales_service_fit_assessments enable row level security;
alter table sales_deal_expansion_paths enable row level security;
alter table sales_territory_growth_controls enable row level security;
