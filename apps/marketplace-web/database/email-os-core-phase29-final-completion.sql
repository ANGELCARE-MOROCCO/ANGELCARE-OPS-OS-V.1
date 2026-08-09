-- EMAIL-OS CORE PHASE 29 — FINAL COMPLETION + STABILIZATION

create table if not exists email_os_core_final_readiness_checks (
  id text primary key,
  area text not null,
  check_key text not null,
  check_label text not null,
  status text not null default 'pending',
  result jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_reliability_runs (
  id text primary key,
  run_type text not null,
  status text not null default 'queued',
  processed_count integer not null default 0,
  failed_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists email_os_core_ai_execution_guards (
  id text primary key,
  action_type text not null,
  target_type text,
  target_id text,
  guard_status text not null default 'pending_review',
  risk_level text not null default 'low',
  reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_live_refresh_states (
  id text primary key,
  channel_key text not null,
  last_event_id text,
  subscriber_key text,
  acknowledged_at timestamptz,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_navigation_manifest (
  id text primary key,
  route_path text not null unique,
  label text not null,
  group_key text not null default 'email-os',
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table email_os_core_final_readiness_checks disable row level security;
alter table email_os_core_reliability_runs disable row level security;
alter table email_os_core_ai_execution_guards disable row level security;
alter table email_os_core_live_refresh_states disable row level security;
alter table email_os_core_navigation_manifest disable row level security;

create index if not exists email_os_core_final_readiness_area_idx on email_os_core_final_readiness_checks(area, status);
create index if not exists email_os_core_reliability_runs_type_idx on email_os_core_reliability_runs(run_type, created_at desc);
create index if not exists email_os_core_ai_guards_target_idx on email_os_core_ai_execution_guards(target_type, target_id);
create index if not exists email_os_core_live_refresh_channel_idx on email_os_core_live_refresh_states(channel_key);
create index if not exists email_os_core_nav_manifest_group_idx on email_os_core_navigation_manifest(group_key, sort_order);
