create extension if not exists pgcrypto;

create table if not exists public.connect_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'AngelCare Connect',
  type text not null default 'room',
  privacy_level text not null default 'private',
  department text,
  module_key text,
  created_by text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connect_conversations
  add column if not exists title text not null default 'AngelCare Connect',
  add column if not exists type text not null default 'room',
  add column if not exists privacy_level text not null default 'private',
  add column if not exists department text,
  add column if not exists module_key text,
  add column if not exists created_by text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.connect_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  user_id text not null,
  role text not null default 'member',
  muted boolean not null default false,
  pinned boolean not null default false,
  last_read_at timestamptz,
  archived_at timestamptz,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connect_conversation_members
  add column if not exists conversation_id uuid,
  add column if not exists user_id text,
  add column if not exists role text not null default 'member',
  add column if not exists muted boolean not null default false,
  add column if not exists pinned boolean not null default false,
  add column if not exists last_read_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists joined_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.connect_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text,
  body text not null default '',
  message_type text not null default 'text',
  priority text not null default 'normal',
  confidential boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

alter table public.connect_messages
  add column if not exists conversation_id uuid,
  add column if not exists sender_id text,
  add column if not exists sender_name text,
  add column if not exists body text not null default '',
  add column if not exists message_type text not null default 'text',
  add column if not exists priority text not null default 'normal',
  add column if not exists confidential boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

create table if not exists public.connect_message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  user_id text not null,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.connect_message_reads
  add column if not exists message_id uuid,
  add column if not exists conversation_id uuid,
  add column if not exists user_id text,
  add column if not exists read_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.connect_attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  message_id uuid references public.connect_messages(id) on delete set null,
  storage_bucket text not null default 'connect-attachments',
  storage_path text not null,
  filename text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.connect_attachments
  add column if not exists conversation_id uuid,
  add column if not exists message_id uuid,
  add column if not exists storage_bucket text not null default 'connect-attachments',
  add column if not exists storage_path text,
  add column if not exists filename text not null default 'connect-file',
  add column if not exists content_type text not null default 'application/octet-stream',
  add column if not exists size_bytes bigint not null default 0,
  add column if not exists uploaded_by text,
  add column if not exists uploaded_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create table if not exists public.connect_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  audience text not null default 'selected',
  title text not null,
  body text,
  priority text not null default 'normal',
  read boolean not null default false,
  read_at timestamptz,
  created_by text,
  source_type text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.connect_notifications
  add column if not exists user_id text,
  add column if not exists audience text not null default 'selected',
  add column if not exists title text not null default 'Connect notification',
  add column if not exists body text,
  add column if not exists priority text not null default 'normal',
  add column if not exists read boolean not null default false,
  add column if not exists read_at timestamptz,
  add column if not exists created_by text,
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.connect_actions (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'connect',
  source_message_id uuid,
  conversation_id uuid references public.connect_conversations(id) on delete set null,
  title text not null,
  description text,
  owner_id text,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.connect_actions
  add column if not exists source text not null default 'connect',
  add column if not exists source_message_id uuid,
  add column if not exists conversation_id uuid,
  add column if not exists title text not null default 'Connect follow-up',
  add column if not exists description text,
  add column if not exists owner_id text,
  add column if not exists status text not null default 'open',
  add column if not exists priority text not null default 'normal',
  add column if not exists due_at timestamptz,
  add column if not exists created_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

create table if not exists public.connect_action_assignees (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.connect_actions(id) on delete cascade,
  user_id text not null,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.connect_action_assignees
  add column if not exists action_id uuid,
  add column if not exists user_id text,
  add column if not exists assigned_by text,
  add column if not exists assigned_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

create table if not exists public.connect_call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.connect_conversations(id) on delete set null,
  room_name text not null,
  call_type text not null default 'audio',
  status text not null default 'ringing',
  started_by text,
  receiver_id text,
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  connected_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.connect_call_sessions
  add column if not exists conversation_id uuid,
  add column if not exists room_name text not null default ('angelcare-connect-' || gen_random_uuid()::text),
  add column if not exists call_type text not null default 'audio',
  add column if not exists status text not null default 'ringing',
  add column if not exists started_by text,
  add column if not exists receiver_id text,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists answered_at timestamptz,
  add column if not exists connected_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.connect_call_participants (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.connect_call_sessions(id) on delete cascade,
  user_id text not null,
  role text not null default 'receiver',
  status text not null default 'ringing',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connect_call_participants
  add column if not exists call_id uuid,
  add column if not exists user_id text,
  add column if not exists role text not null default 'receiver',
  add column if not exists status text not null default 'ringing',
  add column if not exists joined_at timestamptz,
  add column if not exists left_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.connect_presence (
  user_id text primary key,
  status text not null default 'online',
  current_route text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.connect_presence
  add column if not exists user_id text,
  add column if not exists status text not null default 'online',
  add column if not exists current_route text,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists connect_conversation_members_unique_idx on public.connect_conversation_members(conversation_id, user_id);
create index if not exists connect_conversation_members_user_idx on public.connect_conversation_members(user_id);
create index if not exists connect_conversations_updated_idx on public.connect_conversations(updated_at desc);
create index if not exists connect_messages_conversation_created_idx on public.connect_messages(conversation_id, created_at);
create index if not exists connect_messages_deleted_idx on public.connect_messages(deleted_at);
create unique index if not exists connect_message_reads_unique_idx on public.connect_message_reads(message_id, user_id);
create index if not exists connect_message_reads_conversation_user_idx on public.connect_message_reads(conversation_id, user_id);
create index if not exists connect_attachments_conversation_idx on public.connect_attachments(conversation_id, uploaded_at desc);
create index if not exists connect_attachments_message_idx on public.connect_attachments(message_id);
create index if not exists connect_notifications_user_read_idx on public.connect_notifications(user_id, read, created_at desc);
create index if not exists connect_notifications_source_idx on public.connect_notifications(source_type, source_id);
create index if not exists connect_actions_owner_idx on public.connect_actions(owner_id, status);
create index if not exists connect_actions_conversation_idx on public.connect_actions(conversation_id);
create unique index if not exists connect_action_assignees_unique_idx on public.connect_action_assignees(action_id, user_id);
create index if not exists connect_action_assignees_user_idx on public.connect_action_assignees(user_id);
create index if not exists connect_call_sessions_user_idx on public.connect_call_sessions(started_by, receiver_id, started_at desc);
create index if not exists connect_call_sessions_conversation_idx on public.connect_call_sessions(conversation_id, started_at desc);
create unique index if not exists connect_call_participants_unique_idx on public.connect_call_participants(call_id, user_id);
create index if not exists connect_call_participants_user_idx on public.connect_call_participants(user_id);
create unique index if not exists connect_presence_user_unique_idx on public.connect_presence(user_id);
create index if not exists connect_presence_seen_idx on public.connect_presence(last_seen_at desc);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'connect_conversations_type_check') then
    alter table public.connect_conversations add constraint connect_conversations_type_check check (type in ('direct','room','broadcast','context')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_conversations_privacy_check') then
    alter table public.connect_conversations add constraint connect_conversations_privacy_check check (privacy_level in ('private','department','executive','module','public_readonly')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_messages_type_check') then
    alter table public.connect_messages add constraint connect_messages_type_check check (message_type in ('text','system','task','approval','call','file')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_priority_check') then
    alter table public.connect_messages add constraint connect_priority_check check (priority in ('normal','important','urgent')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_actions_status_check') then
    alter table public.connect_actions add constraint connect_actions_status_check check (status in ('open','in_progress','blocked','done','cancelled')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_calls_status_check') then
    alter table public.connect_call_sessions add constraint connect_calls_status_check check (status in ('ringing','answered','connected','rejected','ended','missed','created','active')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'connect_calls_type_check') then
    alter table public.connect_call_sessions add constraint connect_calls_type_check check (call_type in ('audio','video')) not valid;
  end if;
end $$;

create or replace function public.connect_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists connect_conversations_touch_updated_at on public.connect_conversations;
create trigger connect_conversations_touch_updated_at before update on public.connect_conversations
for each row execute function public.connect_touch_updated_at();

drop trigger if exists connect_conversation_members_touch_updated_at on public.connect_conversation_members;
create trigger connect_conversation_members_touch_updated_at before update on public.connect_conversation_members
for each row execute function public.connect_touch_updated_at();

drop trigger if exists connect_actions_touch_updated_at on public.connect_actions;
create trigger connect_actions_touch_updated_at before update on public.connect_actions
for each row execute function public.connect_touch_updated_at();

drop trigger if exists connect_call_sessions_touch_updated_at on public.connect_call_sessions;
create trigger connect_call_sessions_touch_updated_at before update on public.connect_call_sessions
for each row execute function public.connect_touch_updated_at();

drop trigger if exists connect_call_participants_touch_updated_at on public.connect_call_participants;
create trigger connect_call_participants_touch_updated_at before update on public.connect_call_participants
for each row execute function public.connect_touch_updated_at();

drop trigger if exists connect_presence_touch_updated_at on public.connect_presence;
create trigger connect_presence_touch_updated_at before update on public.connect_presence
for each row execute function public.connect_touch_updated_at();

alter table public.connect_conversations enable row level security;
alter table public.connect_conversation_members enable row level security;
alter table public.connect_messages enable row level security;
alter table public.connect_message_reads enable row level security;
alter table public.connect_attachments enable row level security;
alter table public.connect_notifications enable row level security;
alter table public.connect_actions enable row level security;
alter table public.connect_action_assignees enable row level security;
alter table public.connect_call_sessions enable row level security;
alter table public.connect_call_participants enable row level security;
alter table public.connect_presence enable row level security;

drop policy if exists connect_conversations_member_access on public.connect_conversations;
create policy connect_conversations_member_access on public.connect_conversations
for all to authenticated
using (
  created_by::text = auth.uid()::text
  or exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_conversations.id::text
      and m.user_id::text = auth.uid()::text
      and m.archived_at is null
  )
)
with check (
  created_by::text = auth.uid()::text
  or exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_conversations.id::text
      and m.user_id::text = auth.uid()::text
  )
);

drop policy if exists connect_conversation_members_self_access on public.connect_conversation_members;
create policy connect_conversation_members_self_access on public.connect_conversation_members
for all to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

drop policy if exists connect_messages_member_access on public.connect_messages;
create policy connect_messages_member_access on public.connect_messages
for all to authenticated
using (
  exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_messages.conversation_id::text
      and m.user_id::text = auth.uid()::text
      and m.archived_at is null
  )
)
with check (
  sender_id::text = auth.uid()::text
  and exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_messages.conversation_id::text
      and m.user_id::text = auth.uid()::text
  )
);

drop policy if exists connect_message_reads_member_access on public.connect_message_reads;
create policy connect_message_reads_member_access on public.connect_message_reads
for all to authenticated
using (
  user_id::text = auth.uid()::text
  or exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_message_reads.conversation_id::text
      and m.user_id::text = auth.uid()::text
  )
)
with check (
  user_id::text = auth.uid()::text
  and exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_message_reads.conversation_id::text
      and m.user_id::text = auth.uid()::text
  )
);

drop policy if exists connect_attachments_member_access on public.connect_attachments;
create policy connect_attachments_member_access on public.connect_attachments
for all to authenticated
using (
  exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_attachments.conversation_id::text
      and m.user_id::text = auth.uid()::text
  )
)
with check (
  uploaded_by::text = auth.uid()::text
  and exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id::text = connect_attachments.conversation_id::text
      and m.user_id::text = auth.uid()::text
  )
);

drop policy if exists connect_notifications_user_access on public.connect_notifications;
create policy connect_notifications_user_access on public.connect_notifications
for all to authenticated
using (
  user_id::text = auth.uid()::text
  or created_by::text = auth.uid()::text
  or audience in ('all','public')
)
with check (
  created_by::text = auth.uid()::text
  or user_id::text = auth.uid()::text
);

drop policy if exists connect_actions_member_access on public.connect_actions;
create policy connect_actions_member_access on public.connect_actions
for all to authenticated
using (
  owner_id::text = auth.uid()::text
  or created_by::text = auth.uid()::text
  or exists (
    select 1 from public.connect_action_assignees a
    where a.action_id::text = connect_actions.id::text
      and a.user_id::text = auth.uid()::text
  )
)
with check (
  owner_id::text = auth.uid()::text
  or created_by::text = auth.uid()::text
);

drop policy if exists connect_action_assignees_member_access on public.connect_action_assignees;
create policy connect_action_assignees_member_access on public.connect_action_assignees
for all to authenticated
using (
  user_id::text = auth.uid()::text
  or assigned_by::text = auth.uid()::text
)
with check (assigned_by::text = auth.uid()::text);

drop policy if exists connect_call_sessions_participant_access on public.connect_call_sessions;
create policy connect_call_sessions_participant_access on public.connect_call_sessions
for all to authenticated
using (
  started_by::text = auth.uid()::text
  or receiver_id::text = auth.uid()::text
  or exists (
    select 1 from public.connect_call_participants p
    where p.call_id::text = connect_call_sessions.id::text
      and p.user_id::text = auth.uid()::text
  )
)
with check (
  started_by::text = auth.uid()::text
  or receiver_id::text = auth.uid()::text
  or exists (
    select 1 from public.connect_call_participants p
    where p.call_id::text = connect_call_sessions.id::text
      and p.user_id::text = auth.uid()::text
  )
);

drop policy if exists connect_call_participants_self_access on public.connect_call_participants;
create policy connect_call_participants_self_access on public.connect_call_participants
for all to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

drop policy if exists connect_presence_self_access on public.connect_presence;
create policy connect_presence_self_access on public.connect_presence
for all to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

insert into storage.buckets (id, name, public)
values ('connect-attachments', 'connect-attachments', false)
on conflict (id) do update set public = false;

drop policy if exists connect_attachments_storage_authenticated_read on storage.objects;
create policy connect_attachments_storage_authenticated_read on storage.objects
for select to authenticated
using (bucket_id = 'connect-attachments');

drop policy if exists connect_attachments_storage_authenticated_write on storage.objects;
create policy connect_attachments_storage_authenticated_write on storage.objects
for insert to authenticated
with check (bucket_id = 'connect-attachments');

drop policy if exists connect_attachments_storage_authenticated_delete on storage.objects;
create policy connect_attachments_storage_authenticated_delete on storage.objects
for delete to authenticated
using (bucket_id = 'connect-attachments');

alter table public.connect_conversations replica identity full;
alter table public.connect_conversation_members replica identity full;
alter table public.connect_messages replica identity full;
alter table public.connect_message_reads replica identity full;
alter table public.connect_attachments replica identity full;
alter table public.connect_notifications replica identity full;
alter table public.connect_actions replica identity full;
alter table public.connect_action_assignees replica identity full;
alter table public.connect_call_sessions replica identity full;
alter table public.connect_call_participants replica identity full;
alter table public.connect_presence replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array[
    'connect_conversations',
    'connect_conversation_members',
    'connect_messages',
    'connect_message_reads',
    'connect_attachments',
    'connect_notifications',
    'connect_actions',
    'connect_action_assignees',
    'connect_call_sessions',
    'connect_call_participants',
    'connect_presence'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;
