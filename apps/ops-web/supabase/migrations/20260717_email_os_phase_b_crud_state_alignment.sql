-- AngelCare Email-OS Phase B: CRUD state alignment
-- Additive/safe migration for mailbox folder actions.
-- Allows workflow statuses used by operator actions and ensures state timestamp columns exist.

alter table if exists public.email_os_message_workflow
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists public.email_os_core_inbox
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists public.email_os_core_outbox
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists public.email_os_core_drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

alter table if exists public.email_os_core_saved_drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists spam_at timestamptz,
  add column if not exists permanently_deleted_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'email_os_message_workflow'
      and constraint_name = 'email_os_message_workflow_status_check'
  ) then
    alter table public.email_os_message_workflow
      drop constraint email_os_message_workflow_status_check;
  end if;
end $$;

alter table if exists public.email_os_message_workflow
  add constraint email_os_message_workflow_status_check
  check (status in (
    'new',
    'triaged',
    'assigned',
    'in_progress',
    'waiting_client',
    'waiting_internal',
    'resolved',
    'archived',
    'trash',
    'trashed',
    'spam',
    'deleted'
  ));

create index if not exists idx_email_os_message_workflow_deleted_at
  on public.email_os_message_workflow (mailbox_id, deleted_at desc)
  where deleted_at is not null;

create index if not exists idx_email_os_message_workflow_spam_at
  on public.email_os_message_workflow (mailbox_id, spam_at desc)
  where spam_at is not null;

create index if not exists idx_email_os_message_workflow_permanent_delete
  on public.email_os_message_workflow (mailbox_id, permanently_deleted_at desc)
  where permanently_deleted_at is not null;
