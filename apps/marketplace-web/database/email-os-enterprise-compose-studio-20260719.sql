-- Email OS Enterprise Compose Studio
-- Production schema alignment for drafts, scheduled delivery, tracking and queue diagnostics.
-- Idempotent: safe to run multiple times in Supabase SQL Editor.

do $$
begin
  if to_regclass('public.email_os_core_drafts') is not null then
    alter table public.email_os_core_drafts
      add column if not exists from_email text,
      add column if not exists cc_email text,
      add column if not exists bcc_email text,
      add column if not exists priority text default 'normal',
      add column if not exists template_key text,
      add column if not exists diagnostics jsonb default '{}',
      add column if not exists scheduled_at timestamptz,
      add column if not exists created_by_user_id text,
      add column if not exists created_by_name text,
      add column if not exists created_by_email text,
      add column if not exists created_by_role text,
      add column if not exists created_by_department text,
      add column if not exists created_by_title text;
  end if;

  if to_regclass('public.email_os_core_outbox') is not null then
    alter table public.email_os_core_outbox
      add column if not exists scheduled_at timestamptz,
      add column if not exists tracking_id text,
      add column if not exists tracking_enabled boolean not null default false,
      add column if not exists first_opened_at timestamptz,
      add column if not exists last_opened_at timestamptz,
      add column if not exists open_count integer not null default 0,
      add column if not exists sent_by_user_id text,
      add column if not exists sent_by_name text,
      add column if not exists sent_by_email text,
      add column if not exists sent_by_role text,
      add column if not exists sent_by_department text,
      add column if not exists sent_by_title text;
  end if;

  if to_regclass('public.email_os_core_queue') is not null then
    alter table public.email_os_core_queue
      add column if not exists diagnostics jsonb default '{}',
      add column if not exists result jsonb default '{}',
      add column if not exists mailbox_id text,
      add column if not exists outbox_id text,
      add column if not exists scheduled_at timestamptz default now(),
      add column if not exists attempts integer not null default 0,
      add column if not exists last_error text,
      add column if not exists updated_at timestamptz default now();
  end if;
end $$;

create index if not exists email_os_core_outbox_scheduled_idx
  on public.email_os_core_outbox(status, scheduled_at)
  where status = 'scheduled';

create index if not exists email_os_core_queue_due_idx
  on public.email_os_core_queue(status, scheduled_at)
  where status in ('queued', 'pending', 'retry');

create unique index if not exists email_os_core_outbox_tracking_id_unique
  on public.email_os_core_outbox(tracking_id)
  where tracking_id is not null;
