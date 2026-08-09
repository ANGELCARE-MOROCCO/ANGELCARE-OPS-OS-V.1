create table if not exists email_os_core_command_alerts (
  id text primary key,
  alert_type text not null,
  severity text not null default 'info',
  title text not null,
  body text,
  entity_type text,
  entity_id text,
  status text not null default 'open',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_thread_priority_scores (
  id text primary key,
  thread_id text not null,
  score integer not null default 0,
  priority text not null default 'normal',
  drivers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_risk_classifications (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  risk_level text not null default 'low',
  risk_reason text,
  recommended_action text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_bottleneck_snapshots (
  id text primary key,
  bottleneck_type text not null,
  severity text not null default 'info',
  title text not null,
  count_value integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table email_os_core_command_alerts disable row level security;
alter table email_os_core_thread_priority_scores disable row level security;
alter table email_os_core_risk_classifications disable row level security;
alter table email_os_core_bottleneck_snapshots disable row level security;

create index if not exists email_os_core_command_alerts_status_idx on email_os_core_command_alerts(status, severity);
create index if not exists email_os_core_thread_priority_scores_thread_idx on email_os_core_thread_priority_scores(thread_id);
create index if not exists email_os_core_risk_classifications_entity_idx on email_os_core_risk_classifications(entity_type, entity_id);
create index if not exists email_os_core_bottleneck_snapshots_created_idx on email_os_core_bottleneck_snapshots(created_at desc);
