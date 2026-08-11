-- ANGELCARE AC WHATSAPP LIVE — FINAL ENTERPRISE REALITY COMPLETION & OWNERSHIP CLOSURE
-- Additive, transactional, no destructive migration.
begin;
create extension if not exists pgcrypto;

create table if not exists public.ac_whatsapp_response_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon_key text not null default 'message-square-text',
  color text not null default '#0f172a',
  parent_id uuid references public.ac_whatsapp_response_categories(id) on delete set null,
  owner_user_id uuid,
  permitted_roles text[] not null default '{}',
  permitted_account_ids uuid[] not null default '{}',
  status text not null default 'active' check (status in ('active','inactive','archived')),
  display_order integer not null default 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_whatsapp_response_categories_status_idx on public.ac_whatsapp_response_categories(status,display_order,name);
alter table public.ac_whatsapp_response_categories enable row level security;

alter table public.ac_whatsapp_templates
  add column if not exists category_id uuid references public.ac_whatsapp_response_categories(id) on delete set null,
  add column if not exists shortcut text,
  add column if not exists description text,
  add column if not exists service_line text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists approval_status text not null default 'approved',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid;
create unique index if not exists ac_whatsapp_templates_shortcut_unique on public.ac_whatsapp_templates(lower(shortcut)) where shortcut is not null and btrim(shortcut) <> '';
create index if not exists ac_whatsapp_templates_category_idx on public.ac_whatsapp_templates(category_id,status,updated_at desc);

create table if not exists public.ac_whatsapp_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ac_whatsapp_templates(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(template_id,version)
);
alter table public.ac_whatsapp_template_versions enable row level security;

create table if not exists public.ac_whatsapp_template_usage (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ac_whatsapp_templates(id) on delete cascade,
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete set null,
  operator_user_id uuid,
  usage_type text not null default 'insert' check (usage_type in ('preview','insert','send')),
  rendered_body text,
  created_at timestamptz not null default now()
);
create index if not exists ac_whatsapp_template_usage_template_idx on public.ac_whatsapp_template_usage(template_id,created_at desc);
alter table public.ac_whatsapp_template_usage enable row level security;

create table if not exists public.ac_whatsapp_import_jobs (
  id uuid primary key default gen_random_uuid(),
  import_type text not null check (import_type in ('saved_responses','automation_rules')),
  category_id uuid references public.ac_whatsapp_response_categories(id) on delete set null,
  file_name text,
  source_sha256 text,
  status text not null default 'preview' check (status in ('preview','validated','committed','rolled_back','failed')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  warning_rows integer not null default 0,
  rejected_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  created_by uuid,
  committed_by uuid,
  committed_at timestamptz,
  rolled_back_by uuid,
  rolled_back_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.ac_whatsapp_import_jobs enable row level security;

create table if not exists public.ac_whatsapp_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.ac_whatsapp_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_row jsonb not null,
  normalized_row jsonb,
  disposition text not null default 'valid' check (disposition in ('valid','warning','rejected','committed','rolled_back')),
  messages text[] not null default '{}',
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now(),
  unique(import_job_id,row_number)
);
alter table public.ac_whatsapp_import_rows
  add column if not exists previous_state jsonb,
  add column if not exists entity_action text;
alter table public.ac_whatsapp_import_rows enable row level security;

alter table public.ac_whatsapp_automation_rules
  add column if not exists category_id uuid references public.ac_whatsapp_response_categories(id) on delete set null,
  add column if not exists account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  add column if not exists template_id uuid references public.ac_whatsapp_templates(id) on delete set null,
  add column if not exists description text,
  add column if not exists priority integer not null default 100,
  add column if not exists cooldown_seconds integer not null default 300,
  add column if not exists max_runs_per_conversation integer not null default 1,
  add column if not exists schedule_config jsonb not null default '{}'::jsonb,
  add column if not exists human_takeover_policy text not null default 'pause',
  add column if not exists approval_status text not null default 'draft',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists test_mode boolean not null default true,
  add column if not exists archived_at timestamptz;
create index if not exists ac_whatsapp_automation_rules_priority_idx on public.ac_whatsapp_automation_rules(status,priority,updated_at desc);

create table if not exists public.ac_whatsapp_automation_executions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.ac_whatsapp_automation_rules(id) on delete cascade,
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete set null,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  message_id uuid references public.ac_whatsapp_messages(id) on delete set null,
  execution_status text not null default 'matched' check (execution_status in ('matched','suppressed','sent','failed','simulated')),
  trigger_payload jsonb not null default '{}'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists ac_whatsapp_automation_executions_rule_idx on public.ac_whatsapp_automation_executions(rule_id,created_at desc);
alter table public.ac_whatsapp_automation_executions enable row level security;

alter table public.ac_whatsapp_conversations
  add column if not exists automation_paused boolean not null default false,
  add column if not exists automation_paused_by uuid,
  add column if not exists automation_paused_at timestamptz,
  add column if not exists automation_pause_reason text;

alter table public.ac_whatsapp_memberships
  drop constraint if exists ac_whatsapp_memberships_status_check;
alter table public.ac_whatsapp_memberships
  add constraint ac_whatsapp_memberships_status_check check (status in ('active','paused','suspended','revoked','removed'));
alter table public.ac_whatsapp_memberships
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid,
  add column if not exists removal_reason text,
  add column if not exists transfer_target_user_id uuid,
  add column if not exists lifecycle_metadata jsonb not null default '{}'::jsonb;

alter table public.ac_whatsapp_contacts
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists archive_reason text;

alter table public.ac_whatsapp_campaigns
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists archive_reason text;

alter table public.ac_whatsapp_attachments
  add column if not exists purged_at timestamptz,
  add column if not exists purged_by uuid,
  add column if not exists purge_reason text,
  add column if not exists purge_job_id uuid,
  add column if not exists previous_storage_path text,
  add column if not exists purge_verified_at timestamptz;

create table if not exists public.ac_whatsapp_media_retention_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete cascade,
  direction text check (direction in ('inbound','outbound','all')) default 'all',
  media_types text[] not null default '{}',
  retention_days integer not null default 90 check (retention_days between 1 and 3650),
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  preserve_message_history boolean not null default true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ac_whatsapp_media_retention_policies enable row level security;

create table if not exists public.ac_whatsapp_media_purge_jobs (
  id uuid primary key default gen_random_uuid(),
  scope jsonb not null default '{}'::jsonb,
  status text not null default 'preview' check (status in ('preview','running','completed','partial','failed','cancelled')),
  total_items integer not null default 0,
  total_bytes bigint not null default 0,
  deleted_items integer not null default 0,
  deleted_bytes bigint not null default 0,
  protected_items integer not null default 0,
  failed_items integer not null default 0,
  confirmation_phrase text,
  reason text,
  created_by uuid,
  executed_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.ac_whatsapp_media_purge_jobs enable row level security;

create table if not exists public.ac_whatsapp_media_purge_items (
  id uuid primary key default gen_random_uuid(),
  purge_job_id uuid not null references public.ac_whatsapp_media_purge_jobs(id) on delete cascade,
  attachment_id uuid references public.ac_whatsapp_attachments(id) on delete set null,
  message_id uuid,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  disposition text not null default 'candidate' check (disposition in ('candidate','protected','deleted','failed','missing')),
  error_message text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.ac_whatsapp_media_purge_items enable row level security;

create table if not exists public.ac_whatsapp_runtime_controls (
  control_key text primary key default 'global',
  outbound_paused boolean not null default false,
  automation_paused boolean not null default false,
  campaigns_paused boolean not null default false,
  reason text,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  check (control_key = 'global')
);
alter table public.ac_whatsapp_runtime_controls enable row level security;
insert into public.ac_whatsapp_runtime_controls(control_key) values ('global') on conflict (control_key) do nothing;

-- Atomic workforce offboarding: remove AC WhatsApp access without deleting the global AngelCare user.
create or replace function public.ac_whatsapp_remove_member(
  p_user_id uuid,
  p_transfer_target_user_id uuid default null,
  p_transfer_queue_id uuid default null,
  p_reason text default null,
  p_actor_user_id uuid default null,
  p_correlation_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.ac_whatsapp_memberships%rowtype;
  v_conversations integer := 0;
  v_followups integer := 0;
  v_campaigns integer := 0;
begin
  select * into v_member from public.ac_whatsapp_memberships where user_id = p_user_id for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND'; end if;
  if p_transfer_target_user_id = p_user_id then raise exception 'INVALID_TRANSFER_TARGET'; end if;

  update public.ac_whatsapp_conversations
     set assigned_user_id = p_transfer_target_user_id,
         queue_id = coalesce(p_transfer_queue_id, queue_id),
         status = case when p_transfer_target_user_id is null then 'unassigned' else 'assigned' end,
         updated_at = now()
   where assigned_user_id = p_user_id
     and status not in ('resolved','closed','archived');
  get diagnostics v_conversations = row_count;

  update public.ac_whatsapp_followup_tasks
     set assigned_user_id = p_transfer_target_user_id,
         updated_at = now()
   where assigned_user_id = p_user_id and status = 'open';
  get diagnostics v_followups = row_count;

  update public.ac_whatsapp_campaigns
     set owner_user_id = p_transfer_target_user_id,
         updated_by = p_actor_user_id,
         updated_at = now()
   where owner_user_id = p_user_id
     and status not in ('completed','cancelled','failed');
  get diagnostics v_campaigns = row_count;

  delete from public.ac_whatsapp_account_access where user_id = p_user_id;
  delete from public.ac_whatsapp_queue_memberships where user_id = p_user_id;

  update public.ac_whatsapp_memberships
     set status = 'removed',
         removed_at = now(),
         removed_by = p_actor_user_id,
         removal_reason = nullif(btrim(coalesce(p_reason,'')),''),
         transfer_target_user_id = p_transfer_target_user_id,
         lifecycle_metadata = coalesce(lifecycle_metadata,'{}'::jsonb) || jsonb_build_object(
           'conversations_transferred', v_conversations,
           'followups_transferred', v_followups,
           'campaigns_transferred', v_campaigns,
           'transfer_queue_id', p_transfer_queue_id,
           'removed_at', now()
         ),
         updated_by = p_actor_user_id,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.ac_whatsapp_audit_events(actor_user_id,action,entity_type,entity_id,reason,previous_state,new_state,metadata,correlation_id)
  values(p_actor_user_id,'membership.remove','membership',v_member.id::text,p_reason,to_jsonb(v_member),
    jsonb_build_object('status','removed','transfer_target_user_id',p_transfer_target_user_id,'transfer_queue_id',p_transfer_queue_id),
    jsonb_build_object('conversations',v_conversations,'followups',v_followups,'campaigns',v_campaigns),p_correlation_id);

  return jsonb_build_object('ok',true,'membership_id',v_member.id,'conversations',v_conversations,'followups',v_followups,'campaigns',v_campaigns);
end $$;

-- Governed contact merge. The target survives; the source becomes archived evidence instead of being blindly deleted.
create or replace function public.ac_whatsapp_merge_contacts(
  p_source_id uuid,
  p_target_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null,
  p_correlation_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.ac_whatsapp_contacts%rowtype;
  v_target public.ac_whatsapp_contacts%rowtype;
  v_conversations integer := 0;
begin
  if p_source_id = p_target_id then raise exception 'CONTACT_MERGE_SAME_RECORD'; end if;
  select * into v_source from public.ac_whatsapp_contacts where id = p_source_id for update;
  if not found then raise exception 'SOURCE_CONTACT_NOT_FOUND'; end if;
  select * into v_target from public.ac_whatsapp_contacts where id = p_target_id for update;
  if not found then raise exception 'TARGET_CONTACT_NOT_FOUND'; end if;

  update public.ac_whatsapp_conversations set contact_id = p_target_id, updated_at = now() where contact_id = p_source_id;
  get diagnostics v_conversations = row_count;
  update public.ac_whatsapp_messages set contact_id = p_target_id, updated_at = now() where contact_id = p_source_id;
  update public.ac_whatsapp_outbox set contact_id = p_target_id, updated_at = now() where contact_id = p_source_id;
  update public.ac_whatsapp_context_links set contact_id = p_target_id where contact_id = p_source_id;
  update public.ac_whatsapp_consent_records set contact_id = p_target_id where contact_id = p_source_id;
  update public.ac_whatsapp_followup_tasks set contact_id = p_target_id, updated_at = now() where contact_id = p_source_id;

  delete from public.ac_whatsapp_campaign_recipients s
   where s.contact_id = p_source_id
     and exists (select 1 from public.ac_whatsapp_campaign_recipients t where t.campaign_id = s.campaign_id and t.contact_id = p_target_id);
  update public.ac_whatsapp_campaign_recipients set contact_id = p_target_id, updated_at = now() where contact_id = p_source_id;

  update public.ac_whatsapp_contacts
     set display_name = coalesce(nullif(v_target.display_name,''), v_source.display_name),
         organization_name = coalesce(nullif(v_target.organization_name,''), v_source.organization_name),
         phone_number_e164 = coalesce(nullif(v_target.phone_number_e164,''), v_source.phone_number_e164),
         city = coalesce(nullif(v_target.city,''), v_source.city),
         tags = array(select distinct x from unnest(coalesce(v_target.tags,'{}') || coalesce(v_source.tags,'{}')) x),
         custom_fields = coalesce(v_source.custom_fields,'{}'::jsonb) || coalesce(v_target.custom_fields,'{}'::jsonb),
         updated_by = p_actor_user_id,
         updated_at = now()
   where id = p_target_id;

  update public.ac_whatsapp_contacts
     set archived_at = now(), archived_by = p_actor_user_id,
         archive_reason = 'Fusionné vers ' || p_target_id::text || coalesce(' · ' || nullif(p_reason,''),''),
         tags = array(select distinct x from unnest(coalesce(tags,'{}') || array['merged-source']) x),
         updated_by = p_actor_user_id, updated_at = now()
   where id = p_source_id;

  insert into public.ac_whatsapp_audit_events(actor_user_id,action,entity_type,entity_id,reason,previous_state,new_state,metadata,correlation_id)
  values(p_actor_user_id,'contact.merge','contact',p_target_id::text,p_reason,to_jsonb(v_target),
    jsonb_build_object('source_id',p_source_id,'target_id',p_target_id),jsonb_build_object('conversations_relinked',v_conversations),p_correlation_id);

  return jsonb_build_object('ok',true,'source_id',p_source_id,'target_id',p_target_id,'conversations_relinked',v_conversations);
end $$;

revoke all on function public.ac_whatsapp_remove_member(uuid,uuid,uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.ac_whatsapp_merge_contacts(uuid,uuid,text,uuid,text) from public, anon, authenticated;
grant execute on function public.ac_whatsapp_remove_member(uuid,uuid,uuid,text,uuid,text) to service_role;
grant execute on function public.ac_whatsapp_merge_contacts(uuid,uuid,text,uuid,text) to service_role;

-- Existing service-role architecture remains authoritative. Browser roles get no direct mutation access.
do $$
declare t text;
begin
  foreach t in array array[
    'ac_whatsapp_response_categories','ac_whatsapp_template_versions','ac_whatsapp_template_usage',
    'ac_whatsapp_import_jobs','ac_whatsapp_import_rows','ac_whatsapp_automation_executions',
    'ac_whatsapp_media_retention_policies','ac_whatsapp_media_purge_jobs','ac_whatsapp_media_purge_items','ac_whatsapp_runtime_controls'
  ] loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

commit;
