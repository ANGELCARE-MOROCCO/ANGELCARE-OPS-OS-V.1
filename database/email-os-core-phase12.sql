create table if not exists email_os_core_attachments (
  id text primary key,
  thread_id text,
  draft_id text,
  file_name text not null,
  mime_type text,
  size_bytes integer default 0,
  storage_path text,
  status text not null default 'attached',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_provider_logs (
  id text primary key,
  provider text not null,
  action text not null,
  status text not null,
  message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_delivery_attempts (
  id text primary key,
  queue_id text,
  status text not null,
  message_id text,
  error text,
  attempted_at timestamptz not null default now()
);

alter table email_os_core_attachments disable row level security;
alter table email_os_core_provider_logs disable row level security;
alter table email_os_core_delivery_attempts disable row level security;

create index if not exists email_os_core_attachments_thread_idx on email_os_core_attachments(thread_id);
create index if not exists email_os_core_provider_logs_created_idx on email_os_core_provider_logs(created_at desc);
create index if not exists email_os_core_delivery_attempts_queue_idx on email_os_core_delivery_attempts(queue_id);
