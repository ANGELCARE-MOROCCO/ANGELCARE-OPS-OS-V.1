alter table if exists email_os_core_queue
add column if not exists attempts integer default 0;

alter table if exists email_os_core_queue
add column if not exists last_error text;

alter table if exists email_os_core_outbox
add column if not exists provider_message_id text;

alter table if exists email_os_core_outbox
add column if not exists sent_at timestamptz;

create table if not exists email_os_core_provider_logs (
  id text primary key,
  provider text,
  status text,
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);
