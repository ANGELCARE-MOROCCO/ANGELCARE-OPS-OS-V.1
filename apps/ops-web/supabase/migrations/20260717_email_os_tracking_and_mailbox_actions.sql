-- AngelCare Email-OS: tracking + mailbox action state support
-- Additive and safe: no destructive changes.

alter table if exists email_os_core_outbox
  add column if not exists tracking_id text,
  add column if not exists tracking_enabled boolean default false,
  add column if not exists first_opened_at timestamptz,
  add column if not exists last_opened_at timestamptz,
  add column if not exists open_count integer default 0;

create index if not exists idx_email_os_core_outbox_tracking_id
  on email_os_core_outbox (tracking_id);

create table if not exists email_os_tracking_events (
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
  on email_os_tracking_events (tracking_id, created_at desc);

create index if not exists idx_email_os_tracking_events_outbox_id
  on email_os_tracking_events (outbox_id, created_at desc);

alter table if exists email_os_message_workflow
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists email_os_core_inbox
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists email_os_core_outbox
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists email_os_core_drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists email_os_core_saved_drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;
