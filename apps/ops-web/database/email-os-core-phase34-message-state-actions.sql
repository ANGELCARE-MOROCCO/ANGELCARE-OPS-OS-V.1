-- Email-OS Phase 34: production message state contract.
-- Run this in Supabase SQL Editor before final browser testing.
-- It is idempotent and covers every Email-OS table currently used by the workspace/API layer.

do $$
begin
  if to_regclass('public.email_os_core_inbox') is not null then
    alter table public.email_os_core_inbox
      add column if not exists status text default 'received',
      add column if not exists updated_at timestamptz default now(),
      add column if not exists read_at timestamptz,
      add column if not exists starred boolean not null default false,
      add column if not exists starred_at timestamptz,
      add column if not exists tag text,
      add column if not exists label text,
      add column if not exists folder text,
      add column if not exists archived_at timestamptz,
      add column if not exists deleted_at timestamptz;
  end if;

  if to_regclass('public.email_os_core_outbox') is not null then
    alter table public.email_os_core_outbox
      add column if not exists status text default 'sent',
      add column if not exists updated_at timestamptz default now(),
      add column if not exists read_at timestamptz,
      add column if not exists starred boolean not null default false,
      add column if not exists starred_at timestamptz,
      add column if not exists tag text,
      add column if not exists label text,
      add column if not exists folder text,
      add column if not exists archived_at timestamptz,
      add column if not exists deleted_at timestamptz;
  end if;

  if to_regclass('public.email_os_core_drafts') is not null then
    alter table public.email_os_core_drafts
      add column if not exists status text default 'draft',
      add column if not exists updated_at timestamptz default now(),
      add column if not exists read_at timestamptz,
      add column if not exists starred boolean not null default false,
      add column if not exists starred_at timestamptz,
      add column if not exists tag text,
      add column if not exists label text,
      add column if not exists folder text,
      add column if not exists archived_at timestamptz,
      add column if not exists deleted_at timestamptz;
  end if;

  if to_regclass('public.email_os_core_saved_drafts') is not null then
    alter table public.email_os_core_saved_drafts
      add column if not exists status text default 'draft',
      add column if not exists updated_at timestamptz default now(),
      add column if not exists read_at timestamptz,
      add column if not exists starred boolean not null default false,
      add column if not exists starred_at timestamptz,
      add column if not exists tag text,
      add column if not exists label text,
      add column if not exists folder text,
      add column if not exists archived_at timestamptz,
      add column if not exists deleted_at timestamptz;
  end if;
end $$;

create index if not exists email_os_core_inbox_state_idx on public.email_os_core_inbox(status, updated_at desc);
create index if not exists email_os_core_inbox_starred_state_idx on public.email_os_core_inbox(starred, updated_at desc);
create index if not exists email_os_core_inbox_mailbox_state_idx on public.email_os_core_inbox(mailbox_id, status, updated_at desc);
create index if not exists email_os_core_outbox_state_idx on public.email_os_core_outbox(status, updated_at desc);
create index if not exists email_os_core_outbox_starred_state_idx on public.email_os_core_outbox(starred, updated_at desc);
create index if not exists email_os_core_drafts_state_idx on public.email_os_core_drafts(status, updated_at desc);
create index if not exists email_os_core_drafts_starred_state_idx on public.email_os_core_drafts(starred, updated_at desc);
