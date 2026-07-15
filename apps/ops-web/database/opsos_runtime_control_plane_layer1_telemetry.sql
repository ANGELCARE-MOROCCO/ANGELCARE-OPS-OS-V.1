-- ANGELCARE OPSOS Runtime Control Plane — Layer 1 Real Telemetry
-- Additive and safe: no destructive operations.

create extension if not exists pgcrypto;

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

alter table public.opsos_performance_events
  add column if not exists api_path text,
  add column if not exists interaction_name text,
  add column if not exists session_id text,
  add column if not exists user_id text,
  add column if not exists user_agent text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_opsos_performance_events_created_at on public.opsos_performance_events(created_at desc);
create index if not exists idx_opsos_performance_events_route on public.opsos_performance_events(route);
create index if not exists idx_opsos_performance_events_event_type on public.opsos_performance_events(event_type);
create index if not exists idx_opsos_performance_events_severity on public.opsos_performance_events(severity);
create index if not exists idx_opsos_performance_events_session_id on public.opsos_performance_events(session_id);
create index if not exists idx_opsos_performance_events_api_path on public.opsos_performance_events(api_path);

create or replace view public.opsos_route_telemetry_last_hour as
select
  coalesce(route, '/unknown') as route,
  count(*)::integer as event_count,
  count(*) filter (where event_type = 'long_task')::integer as long_task_count,
  count(*) filter (where event_type = 'api_call')::integer as api_call_count,
  count(*) filter (where event_type = 'api_error')::integer as api_error_count,
  count(*) filter (where event_type in ('client_error','unhandled_rejection'))::integer as client_error_count,
  max(coalesce(duration_ms, 0))::integer as max_duration_ms,
  round(avg(coalesce(duration_ms, 0)))::integer as avg_duration_ms,
  max(coalesce(memory_mb, 0))::integer as max_memory_mb,
  max(created_at) as last_event_at,
  case
    when count(*) filter (where severity = 'critical') > 0 then 'critical'
    when count(*) filter (where severity = 'warning') > 0 then 'warning'
    else 'healthy'
  end as status
from public.opsos_performance_events
where created_at >= now() - interval '1 hour'
group by coalesce(route, '/unknown')
order by
  case
    when count(*) filter (where severity = 'critical') > 0 then 3
    when count(*) filter (where severity = 'warning') > 0 then 2
    else 1
  end desc,
  max(coalesce(duration_ms, 0)) desc;

create or replace view public.opsos_modal_telemetry_last_hour as
select
  coalesce(modal, 'Unknown Modal') as modal,
  coalesce(route, '/unknown') as route,
  count(*)::integer as event_count,
  count(*) filter (where event_type = 'modal_open')::integer as open_count,
  count(*) filter (where event_type = 'modal_close')::integer as close_count,
  max(coalesce(duration_ms, 0))::integer as max_duration_ms,
  max(coalesce(memory_mb, 0))::integer as max_memory_mb,
  max(created_at) as last_event_at,
  case
    when count(*) filter (where severity = 'critical') > 0 then 'critical'
    when count(*) filter (where severity = 'warning') > 0 then 'warning'
    else 'healthy'
  end as status
from public.opsos_performance_events
where created_at >= now() - interval '1 hour'
  and modal is not null
group by coalesce(modal, 'Unknown Modal'), coalesce(route, '/unknown')
order by max(coalesce(duration_ms, 0)) desc;

create table if not exists public.opsos_telemetry_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  route text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_opsos_telemetry_sessions_last_seen on public.opsos_telemetry_sessions(last_seen_at desc);

-- Optional retention helper: keeps the table healthy without deleting business data.
-- Run manually only after approval:
-- delete from public.opsos_performance_events where created_at < now() - interval '30 days';
