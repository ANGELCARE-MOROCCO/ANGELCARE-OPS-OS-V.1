begin;

create table if not exists public.ac_whatsapp_conversation_artifacts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid null references public.ac_whatsapp_contacts(id) on delete set null,
  account_id uuid null references public.ac_whatsapp_accounts(id) on delete set null,
  artifact_type text not null check (artifact_type in (
    'milestone','commitment','approval','handoff','escalation','opportunity','case','evidence',
    'quality_issue','task','meeting','callback','question','decision','chapter','relationship_signal',
    'reply_strategy','document_insight','voice_insight','scheduled_message'
  )),
  title text not null,
  description text null,
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled','closed')),
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  source_message_id uuid null references public.ac_whatsapp_messages(id) on delete set null,
  assigned_user_id uuid null,
  due_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_wa_artifacts_conversation_created_idx on public.ac_whatsapp_conversation_artifacts(conversation_id, created_at desc);
create index if not exists ac_wa_artifacts_status_due_idx on public.ac_whatsapp_conversation_artifacts(status, due_at) where status in ('open','in_progress');
create index if not exists ac_wa_artifacts_source_message_idx on public.ac_whatsapp_conversation_artifacts(source_message_id) where source_message_id is not null;

create table if not exists public.ac_whatsapp_conversation_drafts (
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  user_id uuid not null,
  body text not null default '',
  mode text not null default 'customer' check (mode in ('customer','internal')),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.ac_whatsapp_conversation_presence (
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  user_id uuid not null,
  display_name_snapshot text null,
  role_snapshot text null,
  activity text null,
  last_seen_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists ac_wa_presence_last_seen_idx on public.ac_whatsapp_conversation_presence(conversation_id, last_seen_at desc);

alter table public.ac_whatsapp_conversation_artifacts enable row level security;
alter table public.ac_whatsapp_conversation_drafts enable row level security;
alter table public.ac_whatsapp_conversation_presence enable row level security;

revoke all on table public.ac_whatsapp_conversation_artifacts from anon, authenticated;
revoke all on table public.ac_whatsapp_conversation_drafts from anon, authenticated;
revoke all on table public.ac_whatsapp_conversation_presence from anon, authenticated;
grant all on table public.ac_whatsapp_conversation_artifacts to service_role;
grant all on table public.ac_whatsapp_conversation_drafts to service_role;
grant all on table public.ac_whatsapp_conversation_presence to service_role;

commit;
