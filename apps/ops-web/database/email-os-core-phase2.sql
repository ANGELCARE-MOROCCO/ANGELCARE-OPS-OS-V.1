-- EMAIL-OS CORE PHASE 2 SQL

alter table email_os_core_mailboxes
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_status text default 'idle',
  add column if not exists sync_error text;

create table if not exists email_os_core_messages (
  id text primary key,
  thread_id text,
  mailbox_id text,
  provider_uid text,
  from_email text,
  to_email text,
  subject text,
  body_text text,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

alter table email_os_core_messages disable row level security;

create index if not exists email_os_core_messages_thread_idx on email_os_core_messages(thread_id);
create index if not exists email_os_core_messages_mailbox_idx on email_os_core_messages(mailbox_id);
create index if not exists email_os_core_messages_received_idx on email_os_core_messages(received_at desc);
