-- AngelCare Email-OS Phase F: Tracking, read intelligence and follow-up readiness.
-- Additive/safe migration.

alter table if exists public.email_os_core_outbox
  add column if not exists tracking_id text,
  add column if not exists tracking_enabled boolean default false,
  add column if not exists first_opened_at timestamptz,
  add column if not exists last_opened_at timestamptz,
  add column if not exists open_count integer default 0;

create index if not exists idx_email_os_core_outbox_tracking_id
  on public.email_os_core_outbox (tracking_id);

create table if not exists public.email_os_tracking_events (
  id text primary key,
  tracking_id text not null,
  outbox_id text,
  mailbox_id text,
  recipient_email text,
  event_type text not null default 'open',
  user_agent text,
  ip_address text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_os_tracking_events_tracking_id
  on public.email_os_tracking_events (tracking_id, created_at desc);

create index if not exists idx_email_os_tracking_events_outbox_id
  on public.email_os_tracking_events (outbox_id, created_at desc);

create index if not exists idx_email_os_tracking_events_mailbox_id
  on public.email_os_tracking_events (mailbox_id, created_at desc);
