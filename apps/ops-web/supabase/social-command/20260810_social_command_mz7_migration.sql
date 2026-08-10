-- ANGELCARE SOCIAL COMMAND MZ7 — META RELATIONSHIP MEMORY + FACEBOOK PARITY
-- ADDITIVE. NO HARD DELETE OF NORMAL ENGAGEMENT MEMORY. MANUAL SQL ONLY.
begin;
create extension if not exists pgcrypto;

create table if not exists public.social_command_relationship_contacts (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  relationship_state text not null default 'active' check (relationship_state in ('active','archived','anonymized')),
  current_owner_user_id text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_command_relationship_identities (
  id uuid primary key default gen_random_uuid(),
  relationship_contact_id uuid not null references public.social_command_relationship_contacts(id) on delete restrict,
  provider text not null check (provider in ('instagram','facebook')),
  provider_user_id text not null,
  provider_account_id text,
  username text,
  display_name text,
  profile_picture_url text,
  link_state text not null default 'provider_identity' check (link_state in ('provider_identity','verified_link','manual_link','anonymized')),
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_user_id)
);

create table if not exists public.social_command_journey_events (
  id uuid primary key default gen_random_uuid(),
  relationship_contact_id uuid references public.social_command_relationship_contacts(id) on delete restrict,
  provider_identity_id uuid references public.social_command_relationship_identities(id) on delete restrict,
  provider text check (provider is null or provider in ('instagram','facebook')),
  entity_type text not null,
  entity_id text,
  event_kind text not null,
  source_kind text not null check (source_kind in ('webhook_live','historical_sync','operator','automation','meta_test','provider_reconciliation')),
  title text,
  summary text,
  actor_user_id text,
  provider_reference text,
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.social_command_history_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check(provider in ('instagram','facebook')),
  sync_kind text not null check(sync_kind in ('conversations','comments')),
  mode text not null check(mode in ('discover','import')),
  status text not null default 'running' check(status in ('running','completed','failed','cancelled')),
  actor_user_id text,
  discovered_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  provider_limited_count integer not null default 0,
  error_message text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_command_history_sync_checkpoints (
  id uuid primary key default gen_random_uuid(),
  provider text not null check(provider in ('instagram','facebook')),
  sync_kind text not null check(sync_kind in ('conversations','comments')),
  cursor text,
  metadata jsonb not null default '{}'::jsonb,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,sync_kind)
);

alter table public.social_command_contact_profiles add column if not exists relationship_contact_id uuid references public.social_command_relationship_contacts(id) on delete restrict;

alter table public.social_command_conversations
  add column if not exists relationship_contact_id uuid references public.social_command_relationship_contacts(id) on delete restrict,
  add column if not exists provider_account_id text,
  add column if not exists messaging_window_expires_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text,
  add column if not exists waiting_reason text,
  add column if not exists waiting_until timestamptz,
  add column if not exists source_kind text not null default 'webhook_live',
  add column if not exists provider_state text;

alter table public.social_command_comments
  add column if not exists relationship_contact_id uuid references public.social_command_relationship_contacts(id) on delete restrict,
  add column if not exists provider_account_id text,
  add column if not exists provider_post_id text,
  add column if not exists parent_comment_id text,
  add column if not exists provider_permalink text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text,
  add column if not exists source_kind text not null default 'webhook_live',
  add column if not exists provider_state text;

alter table public.social_command_mentions
  add column if not exists relationship_contact_id uuid references public.social_command_relationship_contacts(id) on delete restrict,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text,
  add column if not exists source_kind text not null default 'webhook_live',
  add column if not exists provider_state text;

alter table public.social_command_messages
  add column if not exists source_kind text not null default 'webhook_live',
  add column if not exists provider_state text,
  add column if not exists edited_at timestamptz;

-- Extend status constraints without guessing constraint names.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid='public.social_command_comments'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop
    execute format('alter table public.social_command_comments drop constraint %I',r.conname);
  end loop;
  alter table public.social_command_comments add constraint social_command_comments_status_mz7_chk check(status in ('new','unanswered','priority','sensitive','answered','resolved','archived'));
  for r in select conname from pg_constraint where conrelid='public.social_command_mentions'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop
    execute format('alter table public.social_command_mentions drop constraint %I',r.conname);
  end loop;
  alter table public.social_command_mentions add constraint social_command_mentions_status_mz7_chk check(status in ('new','reviewed','resolved','archived'));
end $$;

create index if not exists social_command_relationship_identity_contact_idx on public.social_command_relationship_identities(relationship_contact_id,last_seen_at desc);
create index if not exists social_command_relationship_contact_seen_idx on public.social_command_relationship_contacts(last_seen_at desc);
create index if not exists social_command_journey_contact_time_idx on public.social_command_journey_events(relationship_contact_id,occurred_at desc);
create index if not exists social_command_journey_provider_ref_idx on public.social_command_journey_events(provider,provider_reference) where provider_reference is not null;
create index if not exists social_command_history_run_idx on public.social_command_history_sync_runs(provider,sync_kind,started_at desc);
create index if not exists social_command_conversation_relationship_idx on public.social_command_conversations(relationship_contact_id,last_message_at desc);
create index if not exists social_command_comment_relationship_idx on public.social_command_comments(relationship_contact_id,provider_created_at desc);
create index if not exists social_command_comment_provider_post_idx on public.social_command_comments(channel,provider_post_id,provider_created_at desc);
create index if not exists social_command_contact_profile_relationship_idx on public.social_command_contact_profiles(relationship_contact_id) where relationship_contact_id is not null;

alter table public.social_command_relationship_contacts enable row level security;
alter table public.social_command_relationship_identities enable row level security;
alter table public.social_command_journey_events enable row level security;
alter table public.social_command_history_sync_runs enable row level security;
alter table public.social_command_history_sync_checkpoints enable row level security;
revoke all on table public.social_command_relationship_contacts from anon, authenticated;
revoke all on table public.social_command_relationship_identities from anon, authenticated;
revoke all on table public.social_command_journey_events from anon, authenticated;
revoke all on table public.social_command_history_sync_runs from anon, authenticated;
revoke all on table public.social_command_history_sync_checkpoints from anon, authenticated;

-- Normal product code may archive/anonymize, but cannot physically erase journey memory.
create or replace function public.social_command_mz7_block_delete() returns trigger language plpgsql as $$
begin raise exception 'SOCIAL_COMMAND_MZ7_JOURNEY_MEMORY_DELETE_BLOCKED'; end $$;

do $$
declare t text;
begin
 foreach t in array array['social_command_relationship_contacts','social_command_relationship_identities','social_command_journey_events','social_command_contact_profiles','social_command_conversations','social_command_messages','social_command_comments','social_command_mentions'] loop
   execute format('drop trigger if exists social_command_mz7_no_delete on public.%I',t);
   execute format('create trigger social_command_mz7_no_delete before delete on public.%I for each row execute function public.social_command_mz7_block_delete()',t);
 end loop;
end $$;

-- Privileged compliance anonymization preserves non-identifying journey/audit evidence.
create or replace function public.social_command_mz7_compliance_anonymize_contact(p_contact_id uuid,p_actor_user_id text,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_identity_ids uuid[]; v_reason text:=coalesce(nullif(trim(p_reason),''),'Compliance erasure/anonymization');
begin
 if p_contact_id is null then raise exception 'CONTACT_ID_REQUIRED'; end if;
 select coalesce(array_agg(id),'{}'::uuid[]) into v_identity_ids from public.social_command_relationship_identities where relationship_contact_id=p_contact_id;
 update public.social_command_relationship_contacts set display_name='Anonymized relationship',relationship_state='anonymized',tags='{}',metadata=jsonb_build_object('compliance_anonymized',true),updated_at=now() where id=p_contact_id;
 update public.social_command_relationship_identities set provider_user_id='anonymized:'||id::text,username=null,display_name='Anonymized identity',profile_picture_url=null,link_state='anonymized',evidence=jsonb_build_object('compliance_anonymized',true),updated_at=now() where relationship_contact_id=p_contact_id;
 update public.social_command_contact_profiles set provider_scoped_user_id='anonymized:'||id::text,username=null,display_name='Anonymized identity',profile_picture_url=null,follower_count=null,is_verified_user=null,is_user_follow_business=null,is_business_follow_user=null,last_error=null,refresh_state='provider_limited',updated_at=now() where relationship_contact_id=p_contact_id;
 update public.social_command_messages m set text='[anonymized by compliance action]',sender_id=null,recipient_id=null,sender_username=null,attachments='[]'::jsonb,provider_payload=jsonb_build_object('compliance_anonymized',true),updated_at=now() where m.conversation_id in(select id from public.social_command_conversations where relationship_contact_id=p_contact_id);
 update public.social_command_comments set commenter_id=null,commenter_username=null,text='[anonymized by compliance action]',metadata=jsonb_build_object('compliance_anonymized',true),updated_at=now() where relationship_contact_id=p_contact_id;
 update public.social_command_mentions set actor_id=null,actor_username=null,text='[anonymized by compliance action]',metadata=jsonb_build_object('compliance_anonymized',true),updated_at=now() where relationship_contact_id=p_contact_id;
 update public.social_command_conversations set participant_id='anonymized:'||id::text,participant_username=null,participant_name='Anonymized contact',participant_profile_picture_url=null,last_message_preview='[anonymized]',metadata=jsonb_build_object('compliance_anonymized',true),updated_at=now() where relationship_contact_id=p_contact_id;
 update public.social_command_journey_events set title=case when event_kind='relationship.compliance_anonymized' then title else coalesce(title,'Historical event') end,summary=null,provider_reference=null,payload=jsonb_build_object('compliance_anonymized',true) where relationship_contact_id=p_contact_id;
 insert into public.social_command_journey_events(id,relationship_contact_id,entity_type,entity_id,event_kind,source_kind,title,summary,actor_user_id,occurred_at,payload,created_at) values(gen_random_uuid(),p_contact_id,'contact',p_contact_id::text,'relationship.compliance_anonymized','operator','Compliance anonymization completed',v_reason,p_actor_user_id,now(),jsonb_build_object('reason',v_reason),now());
 return jsonb_build_object('ok',true,'contactId',p_contact_id,'anonymizedAt',now());
end $$;
revoke all on function public.social_command_mz7_compliance_anonymize_contact(uuid,text,text) from public,anon,authenticated;

comment on table public.social_command_relationship_contacts is 'MZ7 durable cross-provider relationship shell. Normal operator cleanup is archive, never hard-delete.';
comment on table public.social_command_journey_events is 'MZ7 permanent operational journey ledger with source provenance.';
comment on table public.social_command_history_sync_runs is 'MZ7 bounded Meta historical discovery/import evidence.';
commit;
select 'SOCIAL_COMMAND_MZ7_DATABASE_APPLIED' as result,5 as additive_tables;
