-- AngelCare ServiceOS enterprise schema foundation
create table if not exists service_os_blueprints (
  id text primary key,
  code text unique not null,
  name text not null,
  family text not null,
  market_segment text,
  cities jsonb default '[]'::jsonb,
  modules jsonb default '[]'::jsonb,
  base_price_mad numeric default 0,
  risk_level text default 'medium',
  status text default 'active',
  required_skills jsonb default '[]'::jsonb,
  required_documents jsonb default '[]'::jsonb,
  default_workflow jsonb default '[]'::jsonb,
  kpis jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists service_os_rules (
  id text primary key,
  name text not null,
  condition_logic text not null,
  actions jsonb default '[]'::jsonb,
  pricing_modifier_mad numeric default 0,
  risk_impact text,
  active boolean default true
);
create table if not exists service_os_missions (
  id text primary key,
  blueprint_code text not null,
  city text not null,
  status text not null,
  client_name text,
  staff_name text,
  start_at timestamptz,
  risk text,
  value_mad numeric default 0,
  created_at timestamptz default now()
);
create table if not exists service_os_city_deployments (
  id bigserial primary key,
  city text not null,
  blueprint_code text not null,
  active boolean default true,
  capacity_score numeric default 0,
  demand_score numeric default 0,
  staff_available integer default 0,
  launch_priority text default 'pilot'
);
