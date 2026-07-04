-- AngelCare Connect OS / CareLink Mobile delivery fix
-- Fixes: infinite recursion detected in policy for relation "connect_action_assignees"
-- Scope: backend security only. No UI changes.
-- Purpose:
--   CEO/Admin/Supervisor can assign Connect tasks/messages/calls.
--   Caregiver can read assigned Connect tasks inside CareLink Mobile.
--   Policies must not self-reference connect_action_assignees recursively.

begin;

-- Required safety indexes. They are idempotent and make the helper checks fast.
create index if not exists idx_connect_actions_created_by
  on public.connect_actions(created_by);

create index if not exists idx_connect_actions_owner_id
  on public.connect_actions(owner_id);

create index if not exists idx_connect_action_assignees_user_id
  on public.connect_action_assignees(user_id);

create index if not exists idx_connect_action_assignees_action_id
  on public.connect_action_assignees(action_id);

create unique index if not exists connect_action_assignees_unique_idx
  on public.connect_action_assignees(action_id, user_id);

-- This helper returns every id that may represent the current logged-in person:
-- 1) auth.uid() from Supabase Auth
-- 2) app_users.id if mapped by auth_user_id
-- 3) app_users.id if mapped by email
-- This is important because Connect stores user_id as text and your app often uses app_users.id.
create or replace function public.connect_current_user_ids()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  ids text[] := array[]::text[];
  auth_id text := nullif(auth.uid()::text, '');
  auth_email text := nullif(coalesce(auth.jwt() ->> 'email', ''), '');
  mapped_id text;
  has_app_users boolean;
  has_auth_user_id boolean;
  has_email boolean;
begin
  if auth_id is not null then
    ids := array_append(ids, auth_id);
  end if;

  select to_regclass('public.app_users') is not null into has_app_users;

  if has_app_users then
    select exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_users'
        and column_name = 'auth_user_id'
    ) into has_auth_user_id;

    if has_auth_user_id and auth_id is not null then
      execute 'select id::text from public.app_users where auth_user_id::text = $1 limit 1'
        into mapped_id
        using auth_id;
      if mapped_id is not null then
        ids := array_append(ids, mapped_id);
      end if;
    end if;

    -- Some deployments use app_users.id directly as auth.uid(). Keep this path.
    if auth_id is not null then
      execute 'select id::text from public.app_users where id::text = $1 limit 1'
        into mapped_id
        using auth_id;
      if mapped_id is not null then
        ids := array_append(ids, mapped_id);
      end if;
    end if;

    select exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_users'
        and column_name = 'email'
    ) into has_email;

    if has_email and auth_email is not null then
      execute 'select id::text from public.app_users where lower(email::text) = lower($1) limit 1'
        into mapped_id
        using auth_email;
      if mapped_id is not null then
        ids := array_append(ids, mapped_id);
      end if;
    end if;
  end if;

  return coalesce((select array_agg(distinct value) from unnest(ids) as value where value is not null and value <> ''), array[]::text[]);
end;
$$;

create or replace function public.connect_is_current_user_id(target_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(target_user_id, '') = any(public.connect_current_user_ids())
$$;

create or replace function public.connect_can_read_action(target_action_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_actions action
    where action.id = target_action_id
      and (
        action.owner_id::text = any(public.connect_current_user_ids())
        or action.created_by::text = any(public.connect_current_user_ids())
        or exists (
          select 1
          from public.connect_action_assignees assignee
          where assignee.action_id = action.id
            and assignee.user_id::text = any(public.connect_current_user_ids())
        )
      )
  )
$$;

create or replace function public.connect_can_manage_action(target_action_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_actions action
    where action.id = target_action_id
      and (
        action.owner_id::text = any(public.connect_current_user_ids())
        or action.created_by::text = any(public.connect_current_user_ids())
        or exists (
          select 1
          from public.connect_action_assignees assignee
          where assignee.action_id = action.id
            and assignee.assigned_by::text = any(public.connect_current_user_ids())
        )
      )
  )
$$;

-- Make sure RLS is enabled, but replace unsafe policies with non-recursive policies.
alter table public.connect_actions enable row level security;
alter table public.connect_action_assignees enable row level security;

-- Drop every policy on these two tables so hidden older recursive policies cannot remain.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('connect_actions', 'connect_action_assignees')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end;
$$;

-- Actions: visible if current user created it, owns it, or is assigned to it.
-- The check is delegated to SECURITY DEFINER helper to avoid RLS recursion.
create policy connect_actions_safe_select
on public.connect_actions
for select
to authenticated
using (public.connect_can_read_action(id));

create policy connect_actions_safe_insert
on public.connect_actions
for insert
to authenticated
with check (
  created_by::text = any(public.connect_current_user_ids())
  or owner_id::text = any(public.connect_current_user_ids())
);

create policy connect_actions_safe_update
on public.connect_actions
for update
to authenticated
using (public.connect_can_read_action(id))
with check (public.connect_can_read_action(id));

create policy connect_actions_safe_delete
on public.connect_actions
for delete
to authenticated
using (public.connect_can_manage_action(id));

-- Assignees: visible to the assignee, assigning user, action owner/creator.
-- Never query connect_action_assignees directly in its own policy.
create policy connect_action_assignees_safe_select
on public.connect_action_assignees
for select
to authenticated
using (
  user_id::text = any(public.connect_current_user_ids())
  or assigned_by::text = any(public.connect_current_user_ids())
  or public.connect_can_manage_action(action_id)
  or public.connect_can_read_action(action_id)
);

create policy connect_action_assignees_safe_insert
on public.connect_action_assignees
for insert
to authenticated
with check (
  assigned_by::text = any(public.connect_current_user_ids())
  or public.connect_can_manage_action(action_id)
);

create policy connect_action_assignees_safe_update
on public.connect_action_assignees
for update
to authenticated
using (
  user_id::text = any(public.connect_current_user_ids())
  or assigned_by::text = any(public.connect_current_user_ids())
  or public.connect_can_manage_action(action_id)
)
with check (
  user_id::text = any(public.connect_current_user_ids())
  or assigned_by::text = any(public.connect_current_user_ids())
  or public.connect_can_manage_action(action_id)
);

create policy connect_action_assignees_safe_delete
on public.connect_action_assignees
for delete
to authenticated
using (
  assigned_by::text = any(public.connect_current_user_ids())
  or public.connect_can_manage_action(action_id)
);

grant execute on function public.connect_current_user_ids() to authenticated, service_role;
grant execute on function public.connect_is_current_user_id(text) to authenticated, service_role;
grant execute on function public.connect_can_read_action(uuid) to authenticated, service_role;
grant execute on function public.connect_can_manage_action(uuid) to authenticated, service_role;

commit;
