-- AngelCare Email-OS Phase H: Team assignment and staff operations.
-- Additive/safe migration for assignment history and handoff metadata.

create table if not exists public.email_os_message_assignments (
  id text primary key,
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  assignee_user_id text,
  assigned_by text,
  status text not null default 'active',
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.email_os_message_assignments
  add column if not exists note text,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists assigned_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_email_os_message_assignments_message
  on public.email_os_message_assignments (mailbox_id, message_id, assigned_at desc);

create index if not exists idx_email_os_message_assignments_assignee
  on public.email_os_message_assignments (assignee_user_id, status, assigned_at desc);
