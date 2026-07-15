create extension if not exists "pgcrypto";

create table if not exists public.system_module_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text unique not null,
  module_name text not null,
  module_group text null,
  description text null,
  route_prefixes text[] not null default '{}'::text[],
  api_prefixes text[] not null default '{}'::text[],
  owner_role text not null default 'ceo',
  status text not null default 'active',
  risk_level text not null default 'normal',
  cost_sensitivity text not null default 'medium',
  is_core_system boolean not null default false,
  is_allowed_in_standby boolean not null default false,
  detected_source text null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_runtime_policies (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  auto_refresh_enabled boolean not null default true,
  live_polling_enabled boolean not null default true,
  heavy_sync_enabled boolean not null default true,
  min_refresh_interval_ms integer not null default 300000,
  max_refresh_interval_ms integer not null default 600000,
  jitter_enabled boolean not null default true,
  standby_behavior text not null default 'disable_non_core',
  emergency_behavior text not null default 'block',
  allowed_during_standby boolean not null default false,
  manual_override_enabled boolean not null default true,
  schedule jsonb not null default '{}'::jsonb,
  policy_payload jsonb not null default '{}'::jsonb,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_route_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text null,
  route_path text not null,
  route_type text not null default 'page',
  method text null,
  is_api boolean not null default false,
  is_heavy boolean not null default false,
  is_live_sync boolean not null default false,
  is_allowed_in_standby boolean not null default false,
  risk_level text not null default 'normal',
  detected_from text null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.system_scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_type text not null default 'local_app_scan',
  status text not null default 'completed',
  modules_detected integer not null default 0,
  routes_detected integer not null default 0,
  api_routes_detected integer not null default 0,
  polling_sources_detected integer not null default 0,
  high_risk_items integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.system_policy_events (
  id uuid primary key default gen_random_uuid(),
  event_type text null,
  module_key text null,
  route_path text null,
  actor_email text null,
  before_payload jsonb not null default '{}'::jsonb,
  after_payload jsonb not null default '{}'::jsonb,
  message text null,
  created_at timestamptz not null default now()
);

create unique index if not exists system_runtime_policies_module_key_uidx
  on public.system_runtime_policies (module_key);

create unique index if not exists system_route_registry_route_path_uidx
  on public.system_route_registry (route_path);

create index if not exists system_module_registry_last_seen_idx
  on public.system_module_registry (last_seen_at desc);

create index if not exists system_module_registry_status_idx
  on public.system_module_registry (status, risk_level);

create index if not exists system_runtime_policies_updated_idx
  on public.system_runtime_policies (updated_at desc);

create index if not exists system_route_registry_last_seen_idx
  on public.system_route_registry (last_seen_at desc);

create index if not exists system_route_registry_module_idx
  on public.system_route_registry (module_key, route_type);

create index if not exists system_scan_results_created_idx
  on public.system_scan_results (created_at desc);

create index if not exists system_policy_events_created_idx
  on public.system_policy_events (created_at desc);

create index if not exists system_policy_events_module_idx
  on public.system_policy_events (module_key, created_at desc);

create index if not exists system_policy_events_route_idx
  on public.system_policy_events (route_path, created_at desc);

insert into public.system_module_registry (
  module_key,
  module_name,
  module_group,
  description,
  route_prefixes,
  api_prefixes,
  owner_role,
  status,
  risk_level,
  cost_sensitivity,
  is_core_system,
  is_allowed_in_standby,
  detected_source
) values (
  'ceo-system-control',
  'CEO System Control',
  'CEO',
  'Executive runtime command tower and protected standby governance.',
  array['/ceo/system-control']::text[],
  array['/api/system-control']::text[],
  'ceo',
  'active',
  'critical',
  'high',
  true,
  true,
  'seed'
) on conflict (module_key) do nothing;

insert into public.system_runtime_policies (
  module_key,
  auto_refresh_enabled,
  live_polling_enabled,
  heavy_sync_enabled,
  min_refresh_interval_ms,
  max_refresh_interval_ms,
  jitter_enabled,
  standby_behavior,
  emergency_behavior,
  allowed_during_standby,
  manual_override_enabled,
  schedule,
  policy_payload,
  updated_by
) values (
  'ceo-system-control',
  true,
  true,
  true,
  60000,
  300000,
  true,
  'allow',
  'block',
  true,
  true,
  '{}'::jsonb,
  '{}'::jsonb,
  'seed'
) on conflict (module_key) do nothing;
