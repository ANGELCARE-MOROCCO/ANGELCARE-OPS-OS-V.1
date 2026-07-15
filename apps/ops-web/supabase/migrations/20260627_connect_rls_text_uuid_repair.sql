-- CONNECT RLS TEXT/UUID REPAIR
-- Fixes: ERROR 42883 operator does not exist: text = uuid
-- Cause: existing Connect tables may store user_id/created_by/assigned_by as text while auth.uid() is uuid.
-- This repair makes policies type-safe by comparing all ids as text and using SECURITY DEFINER helpers with text arguments.

-- 1) Drop Connect RLS policies that may contain uuid/text comparisons or recursive checks.
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

-- 2) Text-safe SECURITY DEFINER helpers. They cast table ids to text, so they work whether columns are uuid or text.
create or replace function public.connect_is_conversation_member(p_conversation_id text, p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_conversation_members m
    where m.conversation_id::text = p_conversation_id
      and m.user_id::text = p_user_id
  );
$$;

create or replace function public.connect_can_manage_conversation(p_conversation_id text, p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_conversations c
    where c.id::text = p_conversation_id
      and c.created_by::text = p_user_id
  )
  or exists (
    select 1
    from public.connect_conversation_members m
    where m.conversation_id::text = p_conversation_id
      and m.user_id::text = p_user_id
      and coalesce(m.role, 'member') in ('owner', 'admin')
  );
$$;

create or replace function public.connect_is_action_assignee(p_action_id text, p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_action_assignees a
    where a.action_id::text = p_action_id
      and a.user_id::text = p_user_id
  );
$$;

create or replace function public.connect_can_read_action(p_action_id text, p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connect_actions a
    where a.id::text = p_action_id
      and (
        a.created_by::text = p_user_id
        or a.owner_id::text = p_user_id
        or public.connect_is_action_assignee(a.id::text, p_user_id)
        or (a.conversation_id is not null and public.connect_is_conversation_member(a.conversation_id::text, p_user_id))
      )
  );
$$;

grant execute on function public.connect_is_conversation_member(text, text) to authenticated, anon, service_role;
grant execute on function public.connect_can_manage_conversation(text, text) to authenticated, anon, service_role;
grant execute on function public.connect_is_action_assignee(text, text) to authenticated, anon, service_role;
grant execute on function public.connect_can_read_action(text, text) to authenticated, anon, service_role;

-- 3) Ensure RLS is enabled.
alter table public.connect_conversations enable row level security;
alter table public.connect_conversation_members enable row level security;
alter table public.connect_messages enable row level security;
alter table public.connect_message_reads enable row level security;
alter table public.connect_actions enable row level security;
alter table public.connect_action_assignees enable row level security;
alter table public.connect_notifications enable row level security;

-- 4) Service role policies for server APIs.
create policy "connect service role conversations all" on public.connect_conversations for all to service_role using (true) with check (true);
create policy "connect service role members all" on public.connect_conversation_members for all to service_role using (true) with check (true);
create policy "connect service role messages all" on public.connect_messages for all to service_role using (true) with check (true);
create policy "connect service role reads all" on public.connect_message_reads for all to service_role using (true) with check (true);
create policy "connect service role actions all" on public.connect_actions for all to service_role using (true) with check (true);
create policy "connect service role action assignees all" on public.connect_action_assignees for all to service_role using (true) with check (true);
create policy "connect service role notifications all" on public.connect_notifications for all to service_role using (true) with check (true);

-- 5) Authenticated user policies. Every comparison uses ::text to avoid text = uuid errors.
create policy "connect conversations read by member text safe" on public.connect_conversations
for select to authenticated
using (
  created_by::text = auth.uid()::text
  or privacy_level = 'public_readonly'
  or public.connect_is_conversation_member(id::text, auth.uid()::text)
);

create policy "connect conversations create by authenticated text safe" on public.connect_conversations
for insert to authenticated
with check (created_by is null or created_by::text = auth.uid()::text);

create policy "connect conversations update by manager text safe" on public.connect_conversations
for update to authenticated
using (created_by::text = auth.uid()::text or public.connect_can_manage_conversation(id::text, auth.uid()::text))
with check (created_by::text = auth.uid()::text or public.connect_can_manage_conversation(id::text, auth.uid()::text));

create policy "connect members read by same room text safe" on public.connect_conversation_members
for select to authenticated
using (
  user_id::text = auth.uid()::text
  or public.connect_is_conversation_member(conversation_id::text, auth.uid()::text)
);

create policy "connect members insert by manager text safe" on public.connect_conversation_members
for insert to authenticated
with check (
  user_id::text = auth.uid()::text
  or public.connect_can_manage_conversation(conversation_id::text, auth.uid()::text)
);

create policy "connect members update by self manager text safe" on public.connect_conversation_members
for update to authenticated
using (user_id::text = auth.uid()::text or public.connect_can_manage_conversation(conversation_id::text, auth.uid()::text))
with check (user_id::text = auth.uid()::text or public.connect_can_manage_conversation(conversation_id::text, auth.uid()::text));

create policy "connect members delete by manager text safe" on public.connect_conversation_members
for delete to authenticated
using (public.connect_can_manage_conversation(conversation_id::text, auth.uid()::text));

create policy "connect messages read by member text safe" on public.connect_messages
for select to authenticated
using (sender_id::text = auth.uid()::text or public.connect_is_conversation_member(conversation_id::text, auth.uid()::text));

create policy "connect messages insert by member text safe" on public.connect_messages
for insert to authenticated
with check (sender_id::text = auth.uid()::text and public.connect_is_conversation_member(conversation_id::text, auth.uid()::text));

create policy "connect messages update own text safe" on public.connect_messages
for update to authenticated
using (sender_id::text = auth.uid()::text)
with check (sender_id::text = auth.uid()::text);

create policy "connect message reads own text safe" on public.connect_message_reads
for all to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

create policy "connect actions read visible text safe" on public.connect_actions
for select to authenticated
using (public.connect_can_read_action(id::text, auth.uid()::text));

create policy "connect actions create text safe" on public.connect_actions
for insert to authenticated
with check (
  created_by is null
  or owner_id is null
  or created_by::text = auth.uid()::text
  or owner_id::text = auth.uid()::text
);

create policy "connect actions update visible text safe" on public.connect_actions
for update to authenticated
using (public.connect_can_read_action(id::text, auth.uid()::text))
with check (public.connect_can_read_action(id::text, auth.uid()::text));

create policy "connect actions delete owner creator text safe" on public.connect_actions
for delete to authenticated
using (created_by::text = auth.uid()::text or owner_id::text = auth.uid()::text);

create policy "connect action assignees read text safe" on public.connect_action_assignees
for select to authenticated
using (
  user_id::text = auth.uid()::text
  or assigned_by::text = auth.uid()::text
  or public.connect_can_read_action(action_id::text, auth.uid()::text)
);

create policy "connect action assignees insert text safe" on public.connect_action_assignees
for insert to authenticated
with check (
  assigned_by is null
  or assigned_by::text = auth.uid()::text
  or public.connect_can_read_action(action_id::text, auth.uid()::text)
);

create policy "connect action assignees update text safe" on public.connect_action_assignees
for update to authenticated
using (
  user_id::text = auth.uid()::text
  or assigned_by::text = auth.uid()::text
  or public.connect_can_read_action(action_id::text, auth.uid()::text)
)
with check (
  user_id::text = auth.uid()::text
  or assigned_by::text = auth.uid()::text
  or public.connect_can_read_action(action_id::text, auth.uid()::text)
);

create policy "connect action assignees delete text safe" on public.connect_action_assignees
for delete to authenticated
using (assigned_by::text = auth.uid()::text or public.connect_can_read_action(action_id::text, auth.uid()::text));

create policy "connect notifications read own text safe" on public.connect_notifications
for select to authenticated
using (user_id::text = auth.uid()::text or audience = 'all');

create policy "connect notifications insert text safe" on public.connect_notifications
for insert to authenticated
with check (
  created_by is null
  or user_id is null
  or created_by::text = auth.uid()::text
  or user_id::text = auth.uid()::text
  or audience in ('selected', 'all')
);

create policy "connect notifications update own text safe" on public.connect_notifications
for update to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);
