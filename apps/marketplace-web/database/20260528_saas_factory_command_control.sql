-- AngelCare SaaS Factory Command Control
-- Central enterprise control layer for modules, options, actions, APIs, queues, tenants, incidents and audit events.

create extension if not exists pgcrypto;

create table if not exists public.saas_factory_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  route_prefix text,
  owner_team text,
  status text not null default 'healthy',
  visibility text not null default 'visible',
  access_mode text not null default 'full',
  environment text not null default 'production',
  rollout_stage text not null default 'released',
  version text default 'v1.0.0',
  api_count integer default 0,
  page_count integer default 0,
  tables text[] default array[]::text[],
  dependencies text[] default array[]::text[],
  metadata_json jsonb default '{}'::jsonb,
  last_health numeric default 0,
  last_health_status text default 'unknown',
  last_health_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_option_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  type text not null default 'business',
  module_scope text[] default array[]::text[],
  is_global boolean default true,
  is_system_locked boolean default false,
  is_enabled boolean default true,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_options (
  id uuid primary key default gen_random_uuid(),
  group_key text not null references public.saas_factory_option_groups(key) on delete cascade,
  value text not null,
  label text not null,
  description text,
  sort_order integer default 100,
  color text,
  icon text,
  metadata_json jsonb default '{}'::jsonb,
  availability_scope text[] default array[]::text[],
  is_default boolean default false,
  is_enabled boolean default true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_key, value)
);

create table if not exists public.saas_factory_option_bindings (
  id uuid primary key default gen_random_uuid(),
  option_group_key text not null references public.saas_factory_option_groups(key) on delete cascade,
  module_key text not null,
  field_key text not null,
  page_path text,
  is_required boolean default false,
  is_default_source boolean default false,
  created_at timestamptz default now(),
  unique(option_group_key, module_key, field_key)
);

create table if not exists public.saas_factory_action_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  page_path text not null,
  component_name text,
  action_key text not null,
  action_label text not null,
  action_type text not null,
  target_api text,
  target_table text,
  permission_required text,
  status text default 'unknown',
  response_time_ms integer,
  is_critical boolean default false,
  last_tested_at timestamptz,
  last_result jsonb default '{}'::jsonb,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(module_key, page_path, action_key)
);

create table if not exists public.saas_factory_api_registry (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  method text not null default 'GET',
  module_key text,
  owner_team text,
  status text default 'unknown',
  avg_response_ms integer,
  error_rate numeric default 0,
  requests_24h integer default 0,
  last_probe_at timestamptz,
  last_probe_result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  enabled boolean default false,
  type text default 'release',
  environments text[] default array['production']::text[],
  target_segment text default 'All users',
  owner text,
  impact numeric default 0,
  risk text default 'low',
  schedule_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  rule_type text not null default 'correlation',
  severity text default 'medium',
  enabled boolean default true,
  conditions jsonb default '[]'::jsonb,
  exceptions jsonb default '[]'::jsonb,
  actions jsonb default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_queue_records (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  type text default 'standard',
  status text default 'healthy',
  messages integer default 0,
  backlog integer default 0,
  in_flight integer default 0,
  failed integer default 0,
  avg_processing_ms integer default 0,
  metadata_json jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_tenants (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  domain text,
  status text default 'active',
  plan text default 'enterprise',
  region text default 'US-East (N. Virginia)',
  users_count integer default 0,
  ingestion_gb numeric default 0,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_data_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  source_type text not null,
  category text,
  status text default 'healthy',
  ingestion_health numeric default 100,
  owner text,
  usage_level text default 'medium',
  last_ingested_at timestamptz,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null unique,
  title text not null,
  severity text default 'medium',
  service text,
  region text,
  status text default 'investigating',
  assigned_to uuid,
  metadata_json jsonb default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saas_factory_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  event text not null,
  actor_id uuid,
  actor_label text,
  resource text,
  event_type text,
  severity text default 'low',
  result text default 'success',
  ip_address text,
  before_json jsonb default '{}'::jsonb,
  after_json jsonb default '{}'::jsonb,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.saas_factory_modules enable row level security;
alter table public.saas_factory_option_groups enable row level security;
alter table public.saas_factory_options enable row level security;
alter table public.saas_factory_option_bindings enable row level security;
alter table public.saas_factory_action_registry enable row level security;
alter table public.saas_factory_api_registry enable row level security;
alter table public.saas_factory_feature_flags enable row level security;
alter table public.saas_factory_rules enable row level security;
alter table public.saas_factory_queue_records enable row level security;
alter table public.saas_factory_tenants enable row level security;
alter table public.saas_factory_data_sources enable row level security;
alter table public.saas_factory_incidents enable row level security;
alter table public.saas_factory_audit_events enable row level security;

-- Policies are permissive for authenticated internal users. Tighten to your existing app role claims when ready.
do $$ begin
  create policy "saas_factory_authenticated_read_modules" on public.saas_factory_modules for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "saas_factory_authenticated_read_option_groups" on public.saas_factory_option_groups for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "saas_factory_authenticated_read_options" on public.saas_factory_options for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "saas_factory_authenticated_read_audit" on public.saas_factory_audit_events for select to authenticated using (true);
exception when duplicate_object then null; end $$;

insert into public.saas_factory_option_groups (key,label,description,type,is_global)
values
('cities','Cities','All system cities and locations','system',true),
('regions','Regions','Geographic regions','system',true),
('service_categories','Service Categories','All service categories','business',true),
('hr_departments','Departments','HR departments','business',true),
('academy_groups','Academy Groups','Academy group categories','business',true),
('lead_sources','Lead Sources','Lead acquisition sources','business',true),
('task_priorities','Task Priorities','Task priority levels','system',true),
('notification_channels','Notification Channels','Notification delivery channels','system',true)
on conflict (key) do nothing;

insert into public.saas_factory_options (group_key,value,label,metadata_json,availability_scope,is_default,is_enabled)
values
('cities','casablanca','Casablanca','{"region":"Grand Casablanca","country":"Morocco"}'::jsonb,array['leads','revenue','academy','hr','service_os','market_os','connect','contracts','missions'],true,true),
('cities','rabat','Rabat','{"region":"Rabat-Salé-Kénitra","country":"Morocco"}'::jsonb,array['leads','revenue','academy','hr','service_os','market_os'],false,true),
('task_priorities','urgent','Urgent','{"color":"red"}'::jsonb,array['all'],false,true),
('task_priorities','high','High','{"color":"orange"}'::jsonb,array['all'],false,true),
('task_priorities','medium','Medium','{"color":"yellow"}'::jsonb,array['all'],true,true),
('task_priorities','low','Low','{"color":"blue"}'::jsonb,array['all'],false,true)
on conflict (group_key,value) do nothing;
