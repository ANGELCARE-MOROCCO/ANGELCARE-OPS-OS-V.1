create table if not exists email_os_core_approvals (
  id text primary key,
  target_type text not null,
  target_id text not null,
  title text not null,
  status text not null default 'pending',
  requested_by text,
  decided_by text,
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists email_os_core_notes (
  id text primary key,
  thread_id text,
  body text not null,
  author text,
  visibility text not null default 'internal',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_sla_rules (
  id text primary key,
  name text not null,
  priority text not null default 'normal',
  response_minutes integer not null default 240,
  escalation_minutes integer not null default 480,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_approvals disable row level security;
alter table email_os_core_notes disable row level security;
alter table email_os_core_sla_rules disable row level security;

create index if not exists email_os_core_approvals_status_idx on email_os_core_approvals(status);
create index if not exists email_os_core_notes_thread_idx on email_os_core_notes(thread_id);
create index if not exists email_os_core_sla_priority_idx on email_os_core_sla_rules(priority);
