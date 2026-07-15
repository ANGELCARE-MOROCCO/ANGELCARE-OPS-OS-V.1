-- AngelCare Connect → CareLink Mobile delivery hard fix
-- Goal: stop recursive RLS on connect room/task delivery and make private rooms + assigned tasks readable by assigned staff.

create extension if not exists pgcrypto;

create table if not exists public.connect_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'room',
  privacy_level text not null default 'private',
  department text null,
  module_key text null,
  created_by uuid null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  muted boolean not null default false,
  pinned boolean not null default false,
  last_read_at timestamptz null,
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create table if not exists public.connect_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  sender_id uuid not null,
  sender_name text null,
  body text not null,
  message_type text not null default 'text',
  priority text not null default 'normal',
  confidential boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz null,
  deleted_at timestamptz null
);

create table if not exists public.connect_message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  unique(message_id, user_id)
);

create table if not exists public.connect_actions (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'connect',
  source_message_id uuid null,
  conversation_id uuid null,
  title text not null,
  description text null,
  owner_id uuid null,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz null,
  completed_at timestamptz null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_action_assignees (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.connect_actions(id) on delete cascade,
  user_id uuid not null,
  assigned_by uuid null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(action_id, user_id)
);

create table if not exists public.connect_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  audience text not null default 'selected',
  title text not null,
  body text null,
  priority text not null default 'normal',
  read boolean not null default false,
  created_by uuid null,
  source_type text null,
  source_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.connect_actions add column if not exists conversation_id uuid null;
alter table public.connect_actions add column if not exists description text null;
alter table public.connect_actions add column if not exists completed_at timestamptz null;
alter table public.connect_actions add column if not exists updated_at timestamptz not null default now();
alter table public.connect_action_assignees add column if not exists assigned_by uuid null;
alter table public.connect_action_assignees add column if not exists completed_at timestamptz null;
alter table public.connect_action_assignees add column if not exists created_at timestamptz not null default now();
alter table public.connect_notifications add column if not exists source_type text null;
alter table public.connect_notifications add column if not exists source_id text null;
alter table public.connect_notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.connect_messages add column if not exists sender_name text null;

create index if not exists idx_connect_members_user on public.connect_conversation_members(user_id);
create index if not exists idx_connect_members_conversation on public.connect_conversation_members(conversation_id);
create index if not exists idx_connect_messages_conversation_created on public.connect_messages(conversation_id, created_at desc);
create index if not exists idx_connect_actions_owner on public.connect_actions(owner_id);
create index if not exists idx_connect_actions_created_by on public.connect_actions(created_by);
create index if not exists idx_connect_actions_conversation on public.connect_actions(conversation_id);
create index if not exists idx_connect_action_assignees_user on public.connect_action_assignees(user_id);
create index if not exists idx_connect_action_assignees_action on public.connect_action_assignees(action_id);
create index if not exists idx_connect_notifications_user_read on public.connect_notifications(user_id, read);

alter table public.connect_conversations enable row level security;
alter table public.connect_conversation_members enable row level security;
alter table public.connect_messages enable row level security;
alter table public.connect_message_reads enable row level security;
alter table public.connect_actions enable row level security;
alter table public.connect_action_assignees enable row level security;
alter table public.connect_notifications enable row level security;

-- Remove old recursive policies. The previous common pattern queried connect_conversation_members from its own policy,
-- and connect_action_assignees from its own policy, which causes Supabase infinite recursion.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'connect_conversations',
        'connect_conversation_members',
        'connect_messages',
        'connect_message_reads',
        'connect_room_invitations',
        'connect_actions',
        'connect_action_assignees',
        'connect_notifications'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- SECURITY DEFINER helpers deliberately query the membership/assignee tables outside caller RLS.
-- Policies call these helpers instead of self-referencing the same table directly.
create or replace function public.connect_is_conversation_member(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_conversation_members m
    where m.conversation_id = p_conversation_id
      and m.user_id = p_user_id
  );
$$;

create or replace function public.connect_can_manage_conversation(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_conversations c
    where c.id = p_conversation_id
      and c.created_by = p_user_id
  )
  or exists (
    select 1
    from public.connect_conversation_members m
    where m.conversation_id = p_conversation_id
      and m.user_id = p_user_id
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.connect_is_action_assignee(p_action_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_action_assignees a
    where a.action_id = p_action_id
      and a.user_id = p_user_id
  );
$$;

create or replace function public.connect_can_read_action(p_action_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_actions a
    where a.id = p_action_id
      and (
        a.created_by = p_user_id
        or a.owner_id = p_user_id
        or public.connect_is_action_assignee(a.id, p_user_id)
        or (a.conversation_id is not null and public.connect_is_conversation_member(a.conversation_id, p_user_id))
      )
  );
$$;

grant execute on function public.connect_is_conversation_member(uuid, uuid) to authenticated, anon, service_role;
grant execute on function public.connect_can_manage_conversation(uuid, uuid) to authenticated, anon, service_role;
grant execute on function public.connect_is_action_assignee(uuid, uuid) to authenticated, anon, service_role;
grant execute on function public.connect_can_read_action(uuid, uuid) to authenticated, anon, service_role;

-- Service role policies: server routes should never be blocked by RLS while app code applies business permissions.
create policy "connect service role conversations all" on public.connect_conversations for all to service_role using (true) with check (true);
create policy "connect service role members all" on public.connect_conversation_members for all to service_role using (true) with check (true);
create policy "connect service role messages all" on public.connect_messages for all to service_role using (true) with check (true);
create policy "connect service role reads all" on public.connect_message_reads for all to service_role using (true) with check (true);
create policy "connect service role actions all" on public.connect_actions for all to service_role using (true) with check (true);
create policy "connect service role action assignees all" on public.connect_action_assignees for all to service_role using (true) with check (true);
create policy "connect service role notifications all" on public.connect_notifications for all to service_role using (true) with check (true);

-- Authenticated user policies: non-recursive and assignment/member scoped.
create policy "connect conversations read by member" on public.connect_conversations
for select to authenticated
using (
  created_by = auth.uid()
  or privacy_level = 'public_readonly'
  or public.connect_is_conversation_member(id, auth.uid())
);

create policy "connect conversations create by authenticated" on public.connect_conversations
for insert to authenticated
with check (created_by = auth.uid());

create policy "connect conversations update by owner admin" on public.connect_conversations
for update to authenticated
using (created_by = auth.uid() or public.connect_can_manage_conversation(id, auth.uid()))
with check (created_by = auth.uid() or public.connect_can_manage_conversation(id, auth.uid()));

create policy "connect members read by same conversation member" on public.connect_conversation_members
for select to authenticated
using (
  user_id = auth.uid()
  or public.connect_is_conversation_member(conversation_id, auth.uid())
);

create policy "connect members write by conversation manager" on public.connect_conversation_members
for insert to authenticated
with check (
  user_id = auth.uid()
  or public.connect_can_manage_conversation(conversation_id, auth.uid())
);

create policy "connect members update by self or manager" on public.connect_conversation_members
for update to authenticated
using (user_id = auth.uid() or public.connect_can_manage_conversation(conversation_id, auth.uid()))
with check (user_id = auth.uid() or public.connect_can_manage_conversation(conversation_id, auth.uid()));

create policy "connect members delete by manager" on public.connect_conversation_members
for delete to authenticated
using (public.connect_can_manage_conversation(conversation_id, auth.uid()));

create policy "connect messages read by member" on public.connect_messages
for select to authenticated
using (sender_id = auth.uid() or public.connect_is_conversation_member(conversation_id, auth.uid()));

create policy "connect messages insert by member" on public.connect_messages
for insert to authenticated
with check (sender_id = auth.uid() and public.connect_is_conversation_member(conversation_id, auth.uid()));

create policy "connect messages update own" on public.connect_messages
for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create policy "connect message reads own/member" on public.connect_message_reads
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "connect actions read by owner creator assignee member" on public.connect_actions
for select to authenticated
using (public.connect_can_read_action(id, auth.uid()));

create policy "connect actions create by authenticated" on public.connect_actions
for insert to authenticated
with check (created_by = auth.uid() or owner_id = auth.uid());

create policy "connect actions update by visible user" on public.connect_actions
for update to authenticated
using (public.connect_can_read_action(id, auth.uid()))
with check (public.connect_can_read_action(id, auth.uid()));

create policy "connect actions delete by creator owner" on public.connect_actions
for delete to authenticated
using (created_by = auth.uid() or owner_id = auth.uid());

create policy "connect action assignees read safely" on public.connect_action_assignees
for select to authenticated
using (
  user_id = auth.uid()
  or assigned_by = auth.uid()
  or public.connect_can_read_action(action_id, auth.uid())
);

create policy "connect action assignees insert safely" on public.connect_action_assignees
for insert to authenticated
with check (
  assigned_by = auth.uid()
  or public.connect_can_read_action(action_id, auth.uid())
);

create policy "connect action assignees update safely" on public.connect_action_assignees
for update to authenticated
using (
  user_id = auth.uid()
  or assigned_by = auth.uid()
  or public.connect_can_read_action(action_id, auth.uid())
)
with check (
  user_id = auth.uid()
  or assigned_by = auth.uid()
  or public.connect_can_read_action(action_id, auth.uid())
);

create policy "connect action assignees delete safely" on public.connect_action_assignees
for delete to authenticated
using (assigned_by = auth.uid() or public.connect_can_read_action(action_id, auth.uid()));

create policy "connect notifications read own" on public.connect_notifications
for select to authenticated
using (user_id = auth.uid() or audience = 'all');

create policy "connect notifications insert authenticated" on public.connect_notifications
for insert to authenticated
with check (created_by = auth.uid() or user_id = auth.uid() or audience in ('selected', 'all'));

create policy "connect notifications update own" on public.connect_notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
