create table if not exists email_os_core_analytics_metrics (
  id text primary key,
  metric_key text not null,
  metric_value numeric not null default 0,
  metric_date date not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_reporting_snapshots (
  id text primary key,
  snapshot_name text not null,
  summary jsonb not null default '{}',
  generated_by text,
  generated_at timestamptz not null default now()
);

alter table email_os_core_analytics_metrics disable row level security;
alter table email_os_core_reporting_snapshots disable row level security;

create index if not exists email_os_core_metrics_key_idx
on email_os_core_analytics_metrics(metric_key, metric_date);
