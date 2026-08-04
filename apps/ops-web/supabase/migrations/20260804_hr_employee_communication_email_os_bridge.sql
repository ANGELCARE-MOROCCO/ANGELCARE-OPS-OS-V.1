-- AngelCare HR Employee Communication -> Email OS RH mailbox
-- Additive, idempotent progress ledger for real-time sending feedback.
-- No mailbox credentials or message bodies are stored in this table.

begin;

create table if not exists public.hr_employee_email_send_jobs (
  id uuid primary key,
  requested_by_user_id text not null,
  employee_id text,
  employee_email text,
  subject text not null,
  stage text not null default 'preparing',
  status text not null default 'running',
  progress integer not null default 0,
  mailbox_id text,
  from_email text,
  outbox_id text,
  provider_message_id text,
  error_code text,
  error_message text,
  diagnostics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint hr_employee_email_send_jobs_stage_check check (
    stage in (
      'preparing',
      'validating_employee',
      'resolving_rh_mailbox',
      'recording_outbox',
      'sending_to_bridge',
      'provider_accepted',
      'sent',
      'failed'
    )
  ),
  constraint hr_employee_email_send_jobs_status_check check (
    status in ('running', 'sent', 'failed')
  ),
  constraint hr_employee_email_send_jobs_progress_check check (
    progress between 0 and 100
  )
);

create index if not exists hr_employee_email_send_jobs_requester_idx
  on public.hr_employee_email_send_jobs (requested_by_user_id, created_at desc);

create index if not exists hr_employee_email_send_jobs_employee_idx
  on public.hr_employee_email_send_jobs (employee_id, created_at desc);

create index if not exists hr_employee_email_send_jobs_outbox_idx
  on public.hr_employee_email_send_jobs (outbox_id)
  where outbox_id is not null;

create index if not exists hr_employee_email_send_jobs_running_idx
  on public.hr_employee_email_send_jobs (status, updated_at desc)
  where status = 'running';

alter table public.hr_employee_email_send_jobs enable row level security;

comment on table public.hr_employee_email_send_jobs is
  'Server-only progress ledger for HR employee emails sent through the canonical Email OS RH mailbox.';

comment on column public.hr_employee_email_send_jobs.diagnostics is
  'Redacted operational diagnostics only. Never store mailbox credentials, bridge tokens, or message bodies.';

commit;
