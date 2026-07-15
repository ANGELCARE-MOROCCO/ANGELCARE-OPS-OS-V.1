-- AngelCare SaaS Factory Command - Phase 2 live registry/control schema
-- Safe to run multiple times. Enables live options, modules, feature flags, incidents, action/API registry, audit timeline, data source truth, queues and tenant foundations.

create extension if not exists pgcrypto;

create table if not exists public.saas_factory_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  route_prefix text,
  owner_team text,
  status text not null default 'operational',
  visibility text not null default 'visible',
  rollout_stage text not null default 'production',
  requires_realtime boolean not null default false,
  requires_external_service boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  last_health_status text default 'unknown',
  last_health_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_option_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  module_scope text[] not null default array[]::text[],
  is_global boolean not null default false,
  is_system_locked boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_options (
  id uuid primary key default gen_random_uuid(),
  group_key text not null references public.saas_factory_option_groups(key) on delete cascade,
  value text not null,
  label text not null,
  description text,
  sort_order int not null default 100,
  color text,
  icon text,
  metadata_json jsonb not null default '{}'::jsonb,
  availability_scope text[] not null default array[]::text[],
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_key, value)
);

create table if not exists public.saas_factory_feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  module_key text not null default 'saas_factory_command',
  status text not null default 'disabled',
  rollout_stage text default 'draft',
  rollout_percent int not null default 0 check (rollout_percent >= 0 and rollout_percent <= 100),
  is_emergency_locked boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  status text not null default 'unknown',
  is_critical boolean not null default false,
  last_tested_at timestamptz,
  last_result jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_key, page_path, action_key)
);

create table if not exists public.saas_factory_api_registry (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  method text not null default 'GET',
  module_key text not null,
  status text not null default 'unknown',
  latency_ms int,
  owner_team text,
  last_checked_at timestamptz,
  last_error text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(route, method)
);

create table if not exists public.saas_factory_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  module_key text,
  severity text not null default 'warning',
  status text not null default 'open',
  owner text,
  source text default 'manual',
  metadata_json jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  trigger_type text not null,
  condition_json jsonb not null default '{}'::jsonb,
  action_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  module_scope text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_rule_runs (
  id uuid primary key default gen_random_uuid(),
  rule_key text,
  status text not null default 'queued',
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.saas_factory_data_sources (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  page_path text,
  source_type text not null default 'supabase',
  table_names text[] not null default array[]::text[],
  api_routes text[] not null default array[]::text[],
  risk_level text not null default 'low',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_queue_jobs (
  id uuid primary key default gen_random_uuid(),
  queue_key text not null,
  module_key text,
  job_type text not null,
  status text not null default 'queued',
  priority text not null default 'normal',
  payload_json jsonb not null default '{}'::jsonb,
  attempts int not null default 0,
  last_error text,
  run_after timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_tenants (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  status text not null default 'active',
  plan text default 'internal_enterprise',
  enabled_modules text[] not null default array[]::text[],
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_factory_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_key text not null,
  permission_key text not null,
  effect text not null default 'allow',
  reason text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.saas_factory_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  actor text,
  module_key text,
  severity text default 'info',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_saas_factory_options_group_enabled on public.saas_factory_options(group_key, is_enabled, sort_order);
create index if not exists idx_saas_factory_modules_status on public.saas_factory_modules(status, visibility);
create index if not exists idx_saas_factory_flags_module on public.saas_factory_feature_flags(module_key, status);
create index if not exists idx_saas_factory_incidents_status on public.saas_factory_incidents(status, severity);
create index if not exists idx_saas_factory_audit_created on public.saas_factory_audit_events(created_at desc);

alter table public.saas_factory_modules enable row level security;
alter table public.saas_factory_option_groups enable row level security;
alter table public.saas_factory_options enable row level security;
alter table public.saas_factory_feature_flags enable row level security;
alter table public.saas_factory_action_registry enable row level security;
alter table public.saas_factory_api_registry enable row level security;
alter table public.saas_factory_incidents enable row level security;
alter table public.saas_factory_rules enable row level security;
alter table public.saas_factory_rule_runs enable row level security;
alter table public.saas_factory_data_sources enable row level security;
alter table public.saas_factory_queue_jobs enable row level security;
alter table public.saas_factory_tenants enable row level security;
alter table public.saas_factory_permission_overrides enable row level security;
alter table public.saas_factory_audit_events enable row level security;

-- Service-role API access is used by this Next.js app. Authenticated read policies are included for future browser-side realtime subscriptions.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saas_factory_options' and policyname = 'Authenticated users can read factory options') then
    create policy "Authenticated users can read factory options" on public.saas_factory_options for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saas_factory_option_groups' and policyname = 'Authenticated users can read factory option groups') then
    create policy "Authenticated users can read factory option groups" on public.saas_factory_option_groups for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saas_factory_modules' and policyname = 'Authenticated users can read factory modules') then
    create policy "Authenticated users can read factory modules" on public.saas_factory_modules for select to authenticated using (true);
  end if;
end $$;

insert into public.saas_factory_tenants(key, label, status, plan, enabled_modules)
values ('angelcare_primary', 'AngelCare Primary Workspace', 'active', 'internal_enterprise', array['email_os','revenue_command_center','market_os','hr','academy','service_os','connect','operations'])
on conflict (key) do update set label = excluded.label, status = excluded.status, enabled_modules = excluded.enabled_modules, updated_at = now();

insert into public.saas_factory_option_groups(key, label, description, module_scope, is_global, is_enabled)
values
('cities','Cities','Global cities available across Revenue, HR, Academy, Market OS, Service OS and operations.',array['revenue_command_center','market_os','hr','academy','service_os','operations'],true,true),
('departments','Departments','Departments used in HR, staff portal, permissions, connect tasks and assignment flows.',array['hr','staff_portal','connect','operations'],true,true),
('service_categories','Service Categories','Service catalog categories exposed to services, market, revenue, and operations.',array['service_os','revenue_command_center','market_os','operations'],true,true),
('lead_sources','Lead Sources','Revenue and market acquisition channels.',array['revenue_command_center','market_os'],false,true),
('task_priorities','Task Priorities','Shared priority model for tasks, incidents, revenue, connect and HR work.',array['connect','hr','revenue_command_center','incidents'],true,true),
('academy_locations','Academy Locations','Training location choices for academy classes, certificates, payments and receipts.',array['academy'],false,true),
('campaign_channels','Campaign Channels','Market OS and Revenue campaign execution channels.',array['market_os','revenue_command_center'],false,true)
on conflict (key) do update set label = excluded.label, description = excluded.description, module_scope = excluded.module_scope, updated_at = now();

insert into public.saas_factory_options(group_key, value, label, description, sort_order, availability_scope, metadata_json, is_default, is_enabled)
values
('cities','casablanca','Casablanca','Primary AngelCare operating city',10,array['revenue_command_center','market_os','hr','academy','service_os'],'{"country":"Morocco","region":"Grand Casablanca"}'::jsonb,true,true),
('cities','rabat','Rabat','Capital region operations',20,array['revenue_command_center','market_os','hr','academy','service_os'],'{"country":"Morocco","region":"Rabat-Salé-Kénitra"}'::jsonb,false,true),
('cities','marrakech','Marrakech','Expansion city',30,array['revenue_command_center','market_os','service_os'],'{"country":"Morocco","region":"Marrakech-Safi"}'::jsonb,false,true),
('departments','direction','Direction',null,10,array['hr','staff_portal','connect'],'{}'::jsonb,true,true),
('departments','human_resources','Human Resources',null,20,array['hr','staff_portal','connect'],'{}'::jsonb,false,true),
('departments','operations','Operations',null,30,array['operations','hr','connect'],'{}'::jsonb,false,true),
('service_categories','childcare','Childcare',null,10,array['service_os','revenue_command_center','market_os'],'{}'::jsonb,true,true),
('lead_sources','website','Website',null,10,array['revenue_command_center','market_os'],'{}'::jsonb,true,true),
('task_priorities','urgent','Urgent',null,10,array['connect','hr','revenue_command_center','incidents'],'{}'::jsonb,false,true)
on conflict (group_key, value) do update set label = excluded.label, availability_scope = excluded.availability_scope, metadata_json = excluded.metadata_json, updated_at = now();

insert into public.saas_factory_modules(key, label, description, route_prefix, owner_team, status, visibility, rollout_stage, requires_realtime, requires_external_service, last_health_status)
values
('email_os','Email OS','Mailbox, compose, liveness, outbox, provider and communication production layer.','/email-os','Engineering / Communication','operational','visible','production',true,true,'operational'),
('revenue_command_center','Revenue Command Center','Prospects, partnerships, tasks, campaigns, pipelines and revenue execution.','/revenue-command-center','Revenue','operational','visible','production',true,false,'operational'),
('market_os','Market OS','Campaign lifecycle, content command, ambassadors and marketing operations.','/market-os','Marketing','operational','visible','production',true,false,'operational'),
('hr','HR MAX','Employees, rosters, attendance, documents, performance, onboarding and HR execution.','/hr','Human Resources','operational','visible','production',true,false,'operational'),
('academy','Academy','Trainees, certificates, payment receipts, templates, QR and academy operations.','/academy','Academy','warning','visible','production',true,false,'warning'),
('service_os','Service OS','Service blueprints, categories, commercial configuration, execution and live ops expansion.','/services','Services','warning','visible','beta',false,false,'warning'),
('connect','AngelCare Connect','Rooms, chat, calls, tasks, notifications and LiveKit collaboration.','/connect','Engineering / Communication','operational','visible','production',true,true,'operational'),
('operations','Operations','Missions, availability, replacements, pointage and operational execution.','/operations','Operations','operational','visible','production',true,false,'operational')
on conflict (key) do update set label = excluded.label, description = excluded.description, route_prefix = excluded.route_prefix, status = excluded.status, updated_at = now();

insert into public.saas_factory_feature_flags(key, label, description, module_key, status, rollout_stage, rollout_percent)
values
('saas_factory.live_options_registry','Live Options Registry','Allows predefined options to be controlled live from the factory.','saas_factory_command','enabled','production',100),
('saas_factory.module_registry','Module Registry Control','Controls module visibility, status and readiness.','saas_factory_command','enabled','production',100),
('saas_factory.action_matrix','Action Matrix','Tracks buttons, modals, forms and server actions.','saas_factory_command','beta','beta',40),
('academy.certificate_qr','Academy Certificate QR','Makes certificates traceable with live QR and reference numbers.','academy','enabled','production',100),
('hr.roster_print_templates','HR Roster Print Templates','Modern office-board print templates for daily, weekly and monthly rosters.','hr','beta','beta',60)
on conflict (key) do update set status = excluded.status, rollout_stage = excluded.rollout_stage, rollout_percent = excluded.rollout_percent, updated_at = now();

insert into public.saas_factory_audit_events(event_type, title, actor, module_key, severity, metadata_json)
values ('saas_factory.phase2.migration', 'SaaS Factory Command Phase 2 migration applied', 'system', 'saas_factory_command', 'info', '{"phase":2}'::jsonb);
