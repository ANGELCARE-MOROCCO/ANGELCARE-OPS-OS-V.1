create table if not exists email_os_core_dead_letter_queue (
  id text primary key,
  queue_id text,
  payload jsonb,
  error text,
  created_at timestamptz default now()
);

create table if not exists email_os_core_system_health (
  id text primary key,
  component text,
  status text,
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);
