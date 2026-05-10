create table if not exists email_os_core_sync_schedules (
  id text primary key,
  mailbox_id text not null,
  schedule_name text not null,
  frequency_minutes integer not null default 15,
  enabled boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_sync_jobs (
  id text primary key,
  mailbox_id text not null,
  schedule_id text,
  status text not null default 'queued',
  requested_by text,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_sync_history (
  id text primary key,
  mailbox_id text not null,
  sync_job_id text,
  status text not null,
  messages_synced integer not null default 0,
  error text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table email_os_core_sync_schedules disable row level security;
alter table email_os_core_sync_jobs disable row level security;
alter table email_os_core_sync_history disable row level security;

create index if not exists email_os_core_sync_schedules_mailbox_idx on email_os_core_sync_schedules(mailbox_id);
create index if not exists email_os_core_sync_jobs_status_idx on email_os_core_sync_jobs(status);
create index if not exists email_os_core_sync_history_mailbox_idx on email_os_core_sync_history(mailbox_id);
