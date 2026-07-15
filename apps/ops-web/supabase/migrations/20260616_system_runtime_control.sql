create extension if not exists "pgcrypto";

create table if not exists public.system_runtime_control (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'normal',
  is_system_online boolean not null default true,
  shutdown_started_at timestamptz null,
  shutdown_ends_at timestamptz null,
  resume_at timestamptz null,
  timezone text not null default 'Africa/Casablanca',
  reason text null,
  authorized_roles text[] not null default array['ceo', 'admin']::text[],
  authorized_emails text[] not null default '{}'::text[],
  disabled_modules jsonb not null default '{}'::jsonb,
  enabled_core_routes jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  last_action_by text null,
  last_action_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_runtime_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  from_mode text null,
  to_mode text null,
  actor_email text null,
  actor_role text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metric_key text not null,
  metric_value numeric not null default 0,
  cost_estimate numeric not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_runtime_control_mode_idx
  on public.system_runtime_control (mode, is_system_online);

create index if not exists system_runtime_control_updated_idx
  on public.system_runtime_control (updated_at desc);

create index if not exists system_runtime_events_created_idx
  on public.system_runtime_events (created_at desc);

create index if not exists system_runtime_events_type_idx
  on public.system_runtime_events (event_type, created_at desc);

create index if not exists system_usage_snapshots_period_idx
  on public.system_usage_snapshots (period_start desc, period_end desc);

create index if not exists system_usage_snapshots_metric_idx
  on public.system_usage_snapshots (metric_key, created_at desc);

create index if not exists system_usage_snapshots_source_idx
  on public.system_usage_snapshots (source, created_at desc);

insert into public.system_runtime_control (
  id,
  mode,
  is_system_online,
  timezone,
  reason,
  authorized_roles,
  authorized_emails,
  disabled_modules,
  enabled_core_routes,
  schedule,
  last_action_by,
  last_action_at
) values (
  '11111111-1111-1111-1111-111111111111',
  'normal',
  true,
  'Africa/Casablanca',
  null,
  array['ceo', 'admin']::text[],
  '{}'::text[],
  '{}'::jsonb,
  '["/ceo/system-control"]'::jsonb,
  '{}'::jsonb,
  null,
  null
) on conflict (id) do nothing;
