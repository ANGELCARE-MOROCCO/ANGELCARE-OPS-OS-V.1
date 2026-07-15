-- AngelCare Connect Privacy Schema V1
-- Run in Supabase SQL editor after validating table names for your current auth/user model.

create table if not exists public.connect_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('direct','room','broadcast','context')),
  privacy_level text not null default 'private' check (privacy_level in ('private','department','executive','module','public_readonly')),
  department text,
  module_key text,
  created_by uuid,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  muted boolean not null default false,
  pinned boolean not null default false,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create table if not exists public.connect_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  message_type text not null default 'text' check (message_type in ('text','system','task','approval','call','file')),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  confidential boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.connect_message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  unique(message_id, user_id)
);

create table if not exists public.connect_room_invitations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  invited_user_id uuid not null,
  invited_by uuid,
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  created_at timestamptz not null default now()
);

create index if not exists connect_conversations_type_idx on public.connect_conversations(type);
create index if not exists connect_members_user_idx on public.connect_conversation_members(user_id);
create index if not exists connect_messages_conversation_idx on public.connect_messages(conversation_id, created_at desc);

alter table public.connect_conversations enable row level security;
alter table public.connect_conversation_members enable row level security;
alter table public.connect_messages enable row level security;
alter table public.connect_message_reads enable row level security;
alter table public.connect_room_invitations enable row level security;

-- RLS assumes Supabase auth.uid(). If your app uses custom app_users only, adapt these policies.
create policy if not exists "connect conversations visible to members"
on public.connect_conversations for select
using (
  exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id = connect_conversations.id
    and m.user_id = auth.uid()
  )
);

create policy if not exists "connect members visible to members"
on public.connect_conversation_members for select
using (
  exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id = connect_conversation_members.conversation_id
    and m.user_id = auth.uid()
  )
);

create policy if not exists "connect messages visible to members"
on public.connect_messages for select
using (
  exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id = connect_messages.conversation_id
    and m.user_id = auth.uid()
  )
);

create policy if not exists "connect messages insert by members"
on public.connect_messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.connect_conversation_members m
    where m.conversation_id = connect_messages.conversation_id
    and m.user_id = auth.uid()
  )
);
