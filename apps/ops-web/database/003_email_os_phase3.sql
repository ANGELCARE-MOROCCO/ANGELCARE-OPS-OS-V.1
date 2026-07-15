create table if not exists email_os_core_inbox (
  id text primary key,
  mailbox_id text,
  provider_uid text,
  subject text,
  from_email text,
  to_email text,
  preview text,
  status text default 'received',
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists email_os_core_sync_logs (
  id text primary key,
  mailbox_id text,
  provider text,
  synced_count integer default 0,
  status text,
  message text,
  created_at timestamptz default now()
);
