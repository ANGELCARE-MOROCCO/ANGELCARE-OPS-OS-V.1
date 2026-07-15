create table if not exists email_os_core_ai_triage (
  id text primary key,
  thread_id text not null,
  ai_category text,
  ai_priority text,
  ai_sentiment text,
  ai_summary text,
  ai_reply_suggestion text,
  confidence_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_realtime_events (
  id text primary key,
  event_type text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_notifications (
  id text primary key,
  target_user text,
  title text not null,
  body text,
  severity text not null default 'info',
  read_status boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_role_permissions (
  id text primary key,
  role_key text not null,
  permission_key text not null,
  permission_scope text not null default 'global',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_provider_health (
  id text primary key,
  provider_key text not null,
  provider_status text not null default 'healthy',
  latency_ms integer not null default 0,
  error_rate numeric not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table email_os_core_ai_triage disable row level security;
alter table email_os_core_realtime_events disable row level security;
alter table email_os_core_notifications disable row level security;
alter table email_os_core_role_permissions disable row level security;
alter table email_os_core_provider_health disable row level security;
