create table if not exists email_os_core_production_test_sessions (
  id text primary key,
  session_name text not null,
  environment text not null default 'local',
  status text not null default 'open',
  started_by text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}'
);

create table if not exists email_os_core_test_case_results (
  id text primary key,
  session_id text,
  area text not null,
  test_key text not null,
  test_label text not null,
  status text not null default 'pending',
  severity text not null default 'normal',
  notes text,
  evidence jsonb not null default '{}',
  tested_at timestamptz not null default now()
);

create table if not exists email_os_core_monitoring_events (
  id text primary key,
  event_type text not null,
  severity text not null default 'info',
  source text not null default 'email-os',
  title text not null,
  body text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_deployment_incidents (
  id text primary key,
  incident_type text not null,
  severity text not null default 'medium',
  title text not null,
  status text not null default 'open',
  root_cause text,
  resolution text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists email_os_core_route_protection_checks (
  id text primary key,
  route_path text not null,
  expected_protection text not null default 'authenticated',
  observed_status text not null default 'unknown',
  result text not null default 'pending',
  metadata jsonb not null default '{}',
  checked_at timestamptz not null default now()
);

alter table email_os_core_production_test_sessions disable row level security;
alter table email_os_core_test_case_results disable row level security;
alter table email_os_core_monitoring_events disable row level security;
alter table email_os_core_deployment_incidents disable row level security;
alter table email_os_core_route_protection_checks disable row level security;

create index if not exists email_os_core_test_results_session_idx on email_os_core_test_case_results(session_id);
create index if not exists email_os_core_monitoring_events_created_idx on email_os_core_monitoring_events(created_at desc);
create index if not exists email_os_core_deployment_incidents_status_idx on email_os_core_deployment_incidents(status, severity);
create index if not exists email_os_core_route_protection_route_idx on email_os_core_route_protection_checks(route_path);
