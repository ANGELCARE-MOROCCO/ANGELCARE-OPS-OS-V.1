-- AngelCare Email-OS — Operator identity and accountability attribution V2
-- Corrected authoritative assignment column: owner_user_id
-- Safe to rerun. All schema changes are additive and idempotent.

begin;

alter table if exists public.email_os_core_outbox
  add column if not exists sent_by_user_id text,
  add column if not exists sent_by_name text,
  add column if not exists sent_by_email text,
  add column if not exists sent_by_role text,
  add column if not exists sent_by_department text,
  add column if not exists sent_by_title text,
  add column if not exists created_by_user_id text,
  add column if not exists created_by_name text,
  add column if not exists created_by_email text,
  add column if not exists created_by_role text,
  add column if not exists created_by_department text,
  add column if not exists created_by_title text;

alter table if exists public.email_os_core_drafts
  add column if not exists created_by_user_id text,
  add column if not exists created_by_name text,
  add column if not exists created_by_email text,
  add column if not exists created_by_role text,
  add column if not exists created_by_department text,
  add column if not exists created_by_title text;

alter table if exists public.email_os_core_saved_drafts
  add column if not exists created_by_user_id text,
  add column if not exists created_by_name text,
  add column if not exists created_by_email text,
  add column if not exists created_by_role text,
  add column if not exists created_by_department text,
  add column if not exists created_by_title text;

alter table if exists public.email_os_message_workflow
  add column if not exists owner_name_snapshot text,
  add column if not exists owner_email_snapshot text,
  add column if not exists owner_role_snapshot text,
  add column if not exists owner_department_snapshot text,
  add column if not exists owner_title_snapshot text,
  add column if not exists assigned_by_name_snapshot text,
  add column if not exists assigned_by_email_snapshot text,
  add column if not exists assigned_by_role_snapshot text,
  add column if not exists assigned_by_department_snapshot text,
  add column if not exists assigned_by_title_snapshot text,
  add column if not exists last_handled_by_user_id text,
  add column if not exists last_handled_by_name_snapshot text,
  add column if not exists last_handled_by_email_snapshot text,
  add column if not exists last_handled_by_role_snapshot text,
  add column if not exists last_handled_by_department_snapshot text,
  add column if not exists last_handled_by_title_snapshot text;

alter table if exists public.email_os_message_assignments
  add column if not exists owner_user_id text,
  add column if not exists assignee_name_snapshot text,
  add column if not exists assignee_email_snapshot text,
  add column if not exists assignee_role_snapshot text,
  add column if not exists assignee_department_snapshot text,
  add column if not exists assignee_title_snapshot text,
  add column if not exists assigned_by_name_snapshot text,
  add column if not exists assigned_by_email_snapshot text,
  add column if not exists assigned_by_role_snapshot text,
  add column if not exists assigned_by_department_snapshot text,
  add column if not exists assigned_by_title_snapshot text;

alter table if exists public.email_os_message_notes
  add column if not exists author_email text,
  add column if not exists author_role text,
  add column if not exists author_department text,
  add column if not exists author_title text;

alter table if exists public.email_os_message_tasks
  add column if not exists owner_name_snapshot text,
  add column if not exists owner_email_snapshot text,
  add column if not exists owner_role_snapshot text,
  add column if not exists owner_department_snapshot text,
  add column if not exists owner_title_snapshot text,
  add column if not exists created_by_user_id text,
  add column if not exists created_by_name_snapshot text,
  add column if not exists created_by_email_snapshot text,
  add column if not exists created_by_role_snapshot text,
  add column if not exists created_by_department_snapshot text,
  add column if not exists created_by_title_snapshot text;

alter table if exists public.email_os_message_audit_events
  add column if not exists actor_name_snapshot text,
  add column if not exists actor_email_snapshot text,
  add column if not exists actor_role_snapshot text,
  add column if not exists actor_department_snapshot text,
  add column if not exists actor_title_snapshot text;

-- Create indexes only when both the table and target column exist.
do $$
begin
  if to_regclass('public.email_os_core_outbox') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'email_os_core_outbox'
         and column_name = 'sent_by_user_id'
     ) then
    execute 'create index if not exists email_os_core_outbox_sent_by_user_idx
             on public.email_os_core_outbox (sent_by_user_id)';
  end if;

  if to_regclass('public.email_os_message_workflow') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'email_os_message_workflow'
         and column_name = 'owner_user_id'
     ) then
    execute 'create index if not exists email_os_message_workflow_owner_user_idx
             on public.email_os_message_workflow (owner_user_id)';
  end if;

  if to_regclass('public.email_os_message_workflow') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'email_os_message_workflow'
         and column_name = 'last_handled_by_user_id'
     ) then
    execute 'create index if not exists email_os_message_workflow_last_handled_user_idx
             on public.email_os_message_workflow (last_handled_by_user_id)';
  end if;

  if to_regclass('public.email_os_message_assignments') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'email_os_message_assignments'
         and column_name = 'owner_user_id'
     ) then
    execute 'create index if not exists email_os_message_assignments_owner_idx
             on public.email_os_message_assignments (owner_user_id)';
  end if;
end
$$;

commit;

-- Optional verification result.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'email_os_core_outbox' and column_name like 'sent_by_%')
    or
    (table_name = 'email_os_message_workflow' and (
      column_name like 'owner_%_snapshot'
      or column_name like 'last_handled_by_%'
    ))
    or
    (table_name = 'email_os_message_assignments' and (
      column_name = 'owner_user_id'
      or column_name like 'assignee_%_snapshot'
      or column_name like 'assigned_by_%_snapshot'
    ))
  )
order by table_name, column_name;
