create table if not exists email_os_core_queue (
  id text primary key,
  type text not null default 'send',
  status text not null default 'queued',
  mailbox_id text,
  outbox_id text,
  payload jsonb not null default '{}',
  attempts integer not null default 0,
  last_error text,
  result jsonb default '{}',
  scheduled_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists email_os_core_outbox (
  id text primary key,
  queue_id text,
  mailbox_id text,
  from_email text,
  to_email text,
  cc_email text,
  bcc_email text,
  subject text,
  body text,
  status text not null default 'queued',
  priority text default 'normal',
  template_key text,
  provider_message_id text,
  last_error text,
  diagnostics jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sent_at timestamptz
);

alter table email_os_core_queue
add column if not exists mailbox_id text,
add column if not exists outbox_id text,
add column if not exists attempts integer default 0,
add column if not exists last_error text,
add column if not exists result jsonb default '{}',
add column if not exists scheduled_at timestamptz default now(),
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

alter table email_os_core_outbox
add column if not exists queue_id text,
add column if not exists mailbox_id text,
add column if not exists from_email text,
add column if not exists cc_email text,
add column if not exists bcc_email text,
add column if not exists priority text default 'normal',
add column if not exists template_key text,
add column if not exists provider_message_id text,
add column if not exists last_error text,
add column if not exists diagnostics jsonb default '{}',
add column if not exists sent_at timestamptz,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

create index if not exists email_os_core_queue_status_type_idx on email_os_core_queue(status, type, scheduled_at);
create index if not exists email_os_core_outbox_status_idx on email_os_core_outbox(status, created_at desc);
