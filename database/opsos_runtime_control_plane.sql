-- ANGELCARE OPSOS Runtime Control Plane foundation
-- Safe DB-first migration: additive tables only, no destructive changes.

create table if not exists public.opsos_runtime_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot jsonb not null default '{}'::jsonb,
  source text not null default 'runtime-control-plane',
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists public.opsos_runtime_action_runs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target text not null default 'global',
  scope text not null default 'runtime-control-plane',
  operator text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  status text not null default 'success',
  rollback_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.opsos_runtime_controls (
  id uuid primary key default gen_random_uuid(),
  control_key text not null unique,
  label text not null,
  scope text not null default 'global',
  enabled boolean not null default false,
  value jsonb not null default '{}'::jsonb,
  risk_level text not null default 'low',
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.opsos_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  label text not null,
  description text,
  rollout integer not null default 0 check (rollout >= 0 and rollout <= 100),
  target_scope text not null default 'all-users',
  enabled boolean not null default false,
  override_enabled boolean not null default false,
  risk_level text not null default 'low',
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.opsos_safe_mode_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique,
  label text not null,
  scope text not null default 'global',
  enabled boolean not null default false,
  rules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.opsos_performance_events (
  id uuid primary key default gen_random_uuid(),
  route text,
  modal text,
  event_type text not null,
  severity text not null default 'info',
  duration_ms integer,
  memory_mb integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_opsos_runtime_snapshots_created_at on public.opsos_runtime_snapshots(created_at desc);
create index if not exists idx_opsos_runtime_action_runs_created_at on public.opsos_runtime_action_runs(created_at desc);
create index if not exists idx_opsos_performance_events_created_at on public.opsos_performance_events(created_at desc);
create index if not exists idx_opsos_performance_events_route on public.opsos_performance_events(route);

insert into public.opsos_runtime_controls (control_key, label, scope, enabled, value, risk_level)
values
  ('global.disable_animations', 'Disable animations', 'global', true, '{"impact":"Stops non-critical animation loops"}', 'low'),
  ('market_os.limit_rows', 'Limit Market-OS rows', 'market-os', true, '{"maxRows":40}', 'medium'),
  ('global.disable_live_polling', 'Disable live polling', 'global', true, '{"polling":"off"}', 'medium'),
  ('global.lazy_load_modals', 'Lazy-load modals', 'global', true, '{"mount":"on-open"}', 'low')
on conflict (control_key) do nothing;

insert into public.opsos_feature_flags (flag_key, label, description, rollout, target_scope, enabled, override_enabled, risk_level)
values
  ('new_nav_experience', 'New navigation experience', 'Navigation runtime experiment', 75, 'all-users', true, true, 'medium'),
  ('hr.employee360.printPreview', 'Employee 360 Print Preview', 'Controls heavy print preview loading', 0, 'hr', false, true, 'low'),
  ('marketos.timeline.liveProgress', 'Market OS Timeline Live Progress', 'Controls campaign timeline live progress refresh', 25, 'market-os', true, true, 'medium')
on conflict (flag_key) do nothing;
