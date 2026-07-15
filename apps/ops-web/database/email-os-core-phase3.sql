-- EMAIL-OS CORE PHASE 3 SQL

alter table email_os_core_threads
  add column if not exists archived_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists assigned_at timestamptz,
  add column if not exists snoozed_until timestamptz;

alter table email_os_core_threads
  add column if not exists last_action text;

create index if not exists email_os_core_threads_status_idx on email_os_core_threads(status);
create index if not exists email_os_core_threads_priority_idx on email_os_core_threads(priority);
