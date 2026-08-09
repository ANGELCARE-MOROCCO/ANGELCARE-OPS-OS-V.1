-- ANGELCARE AC WhatsApp Live — production foundation
-- Additive migration. OpenWA remains an isolated transport runtime.
create extension if not exists pgcrypto;

create table if not exists public.ac_whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phone_number_e164 text,
  department text,
  purpose text,
  openwa_session_id uuid unique,
  openwa_session_name text unique,
  engine_type text not null default 'whatsapp-web.js' check (engine_type in ('whatsapp-web.js','baileys')),
  status text not null default 'draft' check (status in ('draft','starting','authenticating','qr_required','pairing_required','connected','reconnecting','degraded','rate_limited','disconnected','authentication_lost','paused','suspended','error')),
  health_score integer not null default 100 check (health_score between 0 and 100),
  outbound_enabled boolean not null default true,
  campaigns_enabled boolean not null default true,
  cold_prospecting_enabled boolean not null default true,
  bulk_messaging_enabled boolean not null default true,
  default_queue_id uuid,
  settings jsonb not null default '{}'::jsonb,
  runtime_metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_activity_at timestamptz,
  last_error text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_queues (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  department text,
  description text,
  color text not null default '#059669',
  priority integer not null default 50,
  routing_mode text not null default 'least_loaded' check (routing_mode in ('manual','round_robin','least_loaded','skill','geographic','existing_owner')),
  status text not null default 'active' check (status in ('active','paused','archived')),
  sla_first_response_minutes integer not null default 15,
  sla_resolution_minutes integer not null default 240,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ac_whatsapp_accounts drop constraint if exists ac_whatsapp_accounts_default_queue_id_fkey;
alter table public.ac_whatsapp_accounts add constraint ac_whatsapp_accounts_default_queue_id_fkey foreign key (default_queue_id) references public.ac_whatsapp_queues(id) on delete set null;

create table if not exists public.ac_whatsapp_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role_key text not null default 'operator',
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  permissions text[] not null default '{}',
  working_hours jsonb not null default '{}'::jsonb,
  language text not null default 'fr',
  supervisor_user_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.ac_whatsapp_account_access (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ac_whatsapp_accounts(id) on delete cascade,
  user_id uuid not null,
  access_role text not null default 'operator',
  can_send boolean not null default true,
  can_campaign boolean not null default true,
  can_admin boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(account_id,user_id)
);

create table if not exists public.ac_whatsapp_queue_memberships (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.ac_whatsapp_queues(id) on delete cascade,
  user_id uuid not null,
  skill_level integer not null default 50 check (skill_level between 0 and 100),
  capacity integer not null default 25,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(queue_id,user_id)
);

create table if not exists public.ac_whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  whatsapp_id text not null,
  phone_number_e164 text,
  display_name text,
  first_name text,
  last_name text,
  organization_name text,
  contact_type text not null default 'unknown',
  preferred_language text not null default 'fr',
  city text,
  country_code text,
  owner_user_id uuid,
  lead_stage text,
  sentiment text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent','vip')),
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}'::jsonb,
  last_contact_at timestamptz,
  last_response_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(whatsapp_id)
);

create index if not exists ac_whatsapp_contacts_phone_idx on public.ac_whatsapp_contacts(phone_number_e164);
create index if not exists ac_whatsapp_contacts_search_idx on public.ac_whatsapp_contacts using gin (to_tsvector('simple', coalesce(display_name,'') || ' ' || coalesce(organization_name,'') || ' ' || coalesce(phone_number_e164,'')));

create table if not exists public.ac_whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ac_whatsapp_accounts(id) on delete cascade,
  contact_id uuid not null references public.ac_whatsapp_contacts(id) on delete cascade,
  remote_chat_id text not null,
  queue_id uuid references public.ac_whatsapp_queues(id) on delete set null,
  assigned_user_id uuid,
  status text not null default 'new' check (status in ('new','unassigned','assigned','in_progress','waiting_customer','waiting_internal','scheduled_followup','escalated','resolved','closed','reopened','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent','vip')),
  subject text,
  summary text,
  sentiment text,
  intent text,
  unread_count integer not null default 0,
  message_count integer not null default 0,
  last_message_preview text,
  last_message_direction text,
  last_message_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  snoozed_until timestamptz,
  sla_first_response_due_at timestamptz,
  sla_resolution_due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,remote_chat_id)
);

create index if not exists ac_whatsapp_conversations_live_idx on public.ac_whatsapp_conversations(status,last_message_at desc);
create index if not exists ac_whatsapp_conversations_assigned_idx on public.ac_whatsapp_conversations(assigned_user_id,status);
create index if not exists ac_whatsapp_conversations_queue_idx on public.ac_whatsapp_conversations(queue_id,status);

create table if not exists public.ac_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ac_whatsapp_accounts(id) on delete cascade,
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  external_message_id text,
  client_message_id text,
  direction text not null check (direction in ('inbound','outbound','internal')),
  message_type text not null default 'text',
  body text,
  caption text,
  quoted_external_message_id text,
  status text not null default 'received' check (status in ('draft','scheduled','queued','processing','accepted','sent','delivered','read','received','failed','cancelled','expired','revoked')),
  sender_user_id uuid,
  sender_whatsapp_id text,
  recipient_whatsapp_id text,
  error_code text,
  error_message text,
  raw_payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ac_whatsapp_messages_external_unique on public.ac_whatsapp_messages(account_id,external_message_id);
create unique index if not exists ac_whatsapp_messages_client_unique on public.ac_whatsapp_messages(client_message_id) where client_message_id is not null;
create index if not exists ac_whatsapp_messages_conversation_idx on public.ac_whatsapp_messages(conversation_id,created_at desc);

-- Private media bucket used through signed URLs and service-role ingestion.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name='storage') then
    insert into storage.buckets(id,name,public,file_size_limit)
    values ('ac-whatsapp-media','ac-whatsapp-media',false,52428800)
    on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit;
  end if;
exception when insufficient_privilege then
  raise notice 'Storage bucket creation skipped; create private bucket ac-whatsapp-media manually.';
end $$;

create table if not exists public.ac_whatsapp_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.ac_whatsapp_messages(id) on delete cascade,
  storage_provider text not null default 'supabase',
  storage_path text,
  source_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_conversation_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_labels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  color text not null default '#64748b',
  description text,
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_conversation_labels (
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  label_id uuid not null references public.ac_whatsapp_labels(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  primary key(conversation_id,label_id)
);

create table if not exists public.ac_whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default 'general',
  scope text not null default 'organization' check (scope in ('personal','team','department','organization','campaign')),
  language text not null default 'fr',
  body text not null,
  variables text[] not null default '{}',
  attachment_preset jsonb,
  status text not null default 'active' check (status in ('draft','review','active','archived')),
  version integer not null default 1,
  usage_count bigint not null default 0,
  reply_rate numeric(8,4),
  conversion_rate numeric(8,4),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  campaign_type text not null default 'cold_prospecting',
  objective text,
  department text,
  owner_user_id uuid,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  queue_id uuid references public.ac_whatsapp_queues(id) on delete set null,
  template_id uuid references public.ac_whatsapp_templates(id) on delete set null,
  message_body text,
  personalization jsonb not null default '{}'::jsonb,
  audience_filter jsonb not null default '{}'::jsonb,
  schedule_config jsonb not null default '{}'::jsonb,
  pacing_config jsonb not null default '{"batch_size":25,"delay_ms":2500}'::jsonb,
  sequence_config jsonb not null default '[]'::jsonb,
  stop_conditions jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','approved','scheduled','running','paused','completed','cancelled','failed')),
  total_recipients integer not null default 0,
  queued_count integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  reply_count integer not null default 0,
  positive_reply_count integer not null default 0,
  conversion_count integer not null default 0,
  failed_count integer not null default 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ac_whatsapp_campaigns(id) on delete cascade,
  contact_id uuid not null references public.ac_whatsapp_contacts(id) on delete cascade,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  rendered_body text,
  variables jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','excluded','queued','processing','sent','delivered','read','replied','converted','failed','cancelled')),
  external_message_id text,
  failure_reason text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id,contact_id)
);

create index if not exists ac_whatsapp_campaign_recipients_status_idx on public.ac_whatsapp_campaign_recipients(campaign_id,status);

create table if not exists public.ac_whatsapp_outbox (
  id uuid primary key default gen_random_uuid(),
  client_message_id text not null unique,
  account_id uuid not null references public.ac_whatsapp_accounts(id) on delete cascade,
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  campaign_id uuid references public.ac_whatsapp_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.ac_whatsapp_campaign_recipients(id) on delete cascade,
  message_type text not null default 'text',
  chat_id text not null,
  body text,
  media_payload jsonb,
  status text not null default 'queued' check (status in ('scheduled','queued','processing','sent','failed','cancelled','expired')),
  priority integer not null default 50,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  external_message_id text,
  last_error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_whatsapp_outbox_dispatch_idx on public.ac_whatsapp_outbox(status,available_at,priority desc);

create table if not exists public.ac_whatsapp_outbox_attempts (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.ac_whatsapp_outbox(id) on delete cascade,
  attempt_number integer not null,
  request_payload jsonb,
  response_payload jsonb,
  status text not null,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ac_whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null unique,
  idempotency_key text,
  event_type text not null,
  openwa_session_id text,
  signature_valid boolean not null default false,
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  retry_count integer not null default 0,
  raw_payload jsonb not null,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.ac_whatsapp_context_links (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete cascade,
  context_type text not null,
  entity_id text not null,
  entity_label text,
  source_route text,
  metadata jsonb not null default '{}'::jsonb,
  linked_by uuid,
  linked_at timestamptz not null default now(),
  unique(conversation_id,context_type,entity_id)
);

create table if not exists public.ac_whatsapp_consent_records (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.ac_whatsapp_contacts(id) on delete cascade,
  channel text not null default 'whatsapp',
  status text not null default 'unknown' check (status in ('unknown','granted','withdrawn','blocked')),
  source text,
  evidence text,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  recorded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_stop_list (
  id uuid primary key default gen_random_uuid(),
  whatsapp_id text not null unique,
  phone_number_e164 text,
  reason text,
  scope text not null default 'all',
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  revoked_by uuid,
  revoked_at timestamptz
);

create table if not exists public.ac_whatsapp_automation_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  trigger_type text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  run_count bigint not null default 0,
  last_run_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  operator_user_id uuid,
  reviewer_user_id uuid,
  score numeric(5,2),
  criteria jsonb not null default '{}'::jsonb,
  notes text,
  coaching_actions text[],
  status text not null default 'draft' check (status in ('draft','submitted','acknowledged','disputed','validated')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_operator_presence (
  user_id uuid primary key,
  status text not null default 'offline' check (status in ('online','busy','away','break','offline')),
  active_conversation_id uuid references public.ac_whatsapp_conversations(id) on delete set null,
  current_capacity integer not null default 0,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ac_whatsapp_security_events (
  id uuid primary key default gen_random_uuid(),
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  event_type text not null,
  title text not null,
  description text,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  user_id uuid,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

create table if not exists public.ac_whatsapp_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  reason text,
  previous_state jsonb,
  new_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,workspace,name)
);

-- Updated-at helper
create or replace function public.ac_whatsapp_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array[
    'ac_whatsapp_accounts','ac_whatsapp_queues','ac_whatsapp_memberships','ac_whatsapp_contacts',
    'ac_whatsapp_conversations','ac_whatsapp_messages','ac_whatsapp_templates','ac_whatsapp_campaigns',
    'ac_whatsapp_campaign_recipients','ac_whatsapp_outbox','ac_whatsapp_automation_rules',
    'ac_whatsapp_quality_reviews','ac_whatsapp_saved_views'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.ac_whatsapp_touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- Atomic worker claim, callable only by service role through server-side credentials.
create or replace function public.ac_whatsapp_claim_outbox(p_worker_id text, p_limit integer default 25)
returns setof public.ac_whatsapp_outbox
language plpgsql security definer set search_path=public as $$
begin
  return query
  with candidates as (
    select id from public.ac_whatsapp_outbox
    where status in ('queued','scheduled')
      and available_at <= now()
      and attempt_count < max_attempts
    order by priority desc, available_at asc
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,25),200))
  )
  update public.ac_whatsapp_outbox o
  set status='processing', locked_at=now(), locked_by=p_worker_id,
      attempt_count=o.attempt_count+1, updated_at=now()
  from candidates c where o.id=c.id
  returning o.*;
end $$;

create or replace function public.ac_whatsapp_release_stale_outbox(p_age_minutes integer default 10)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  update public.ac_whatsapp_outbox
  set status='queued', locked_at=null, locked_by=null, available_at=now(), updated_at=now()
  where status='processing' and locked_at < now() - make_interval(mins => greatest(1,p_age_minutes));
  get diagnostics n = row_count; return n;
end $$;



create or replace function public.ac_whatsapp_rollup_campaign_metrics() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  update public.ac_whatsapp_campaigns c set
    total_recipients = x.total_recipients,
    queued_count = x.queued_count,
    sent_count = x.sent_count,
    delivered_count = x.delivered_count,
    read_count = x.read_count,
    reply_count = x.reply_count,
    positive_reply_count = x.positive_reply_count,
    conversion_count = x.conversion_count,
    failed_count = x.failed_count,
    completed_at = case when x.total_recipients > 0 and x.terminal_count = x.total_recipients then coalesce(c.completed_at,now()) else c.completed_at end,
    status = case when x.total_recipients > 0 and x.terminal_count = x.total_recipients and c.status not in ('cancelled','paused') then 'completed' else c.status end,
    updated_at = now()
  from (
    select campaign_id,
      count(*)::int total_recipients,
      count(*) filter (where status in ('queued','processing'))::int queued_count,
      count(*) filter (where status in ('sent','delivered','read','replied','converted'))::int sent_count,
      count(*) filter (where status in ('delivered','read','replied','converted'))::int delivered_count,
      count(*) filter (where status in ('read','replied','converted'))::int read_count,
      count(*) filter (where status in ('replied','converted'))::int reply_count,
      count(*) filter (where status in ('replied','converted') and coalesce((variables->>'reply_sentiment'),'positive')='positive')::int positive_reply_count,
      count(*) filter (where status='converted')::int conversion_count,
      count(*) filter (where status='failed')::int failed_count,
      count(*) filter (where status in ('sent','delivered','read','replied','converted','failed','cancelled','excluded'))::int terminal_count
    from public.ac_whatsapp_campaign_recipients where campaign_id=coalesce(new.campaign_id,old.campaign_id)
    group by campaign_id
  ) x where c.id=x.campaign_id;
  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

drop trigger if exists ac_whatsapp_campaign_recipients_rollup on public.ac_whatsapp_campaign_recipients;
create trigger ac_whatsapp_campaign_recipients_rollup
after insert or update or delete on public.ac_whatsapp_campaign_recipients
for each row execute function public.ac_whatsapp_rollup_campaign_metrics();

-- Service-only domain: custom AngelCare sessions are enforced in Next.js APIs.
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'ac_whatsapp_%'
  loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

revoke all on function public.ac_whatsapp_claim_outbox(text,integer) from public, anon, authenticated;
revoke all on function public.ac_whatsapp_release_stale_outbox(integer) from public, anon, authenticated;
grant execute on function public.ac_whatsapp_claim_outbox(text,integer) to service_role;
grant execute on function public.ac_whatsapp_release_stale_outbox(integer) to service_role;

insert into public.ac_whatsapp_queues(code,name,department,description,color,priority,routing_mode)
values
 ('commercial','Commercial & Prospection','Commercial','Prospection B2B/B2C, campagnes et qualification','#e11d48',90,'least_loaded'),
 ('customer-care','Relation familles','Opérations','Parents, familles, admissions et service client','#059669',80,'least_loaded'),
 ('partners','Partenariats','Partenariats','Partenaires, investisseurs et institutions','#2563eb',70,'existing_owner'),
 ('finance','Finance & Paiements','Finance','Factures, paiements, échéances et recouvrement','#7c3aed',60,'least_loaded')
on conflict (code) do nothing;

insert into public.ac_whatsapp_labels(code,name,color,description)
values
 ('vip','VIP','#b45309','Contact prioritaire'),
 ('hot-lead','Lead chaud','#dc2626','Opportunité commerciale active'),
 ('payment','Paiement','#7c3aed','Suivi financier'),
 ('parent','Parent','#059669','Relation famille'),
 ('partner','Partenaire','#2563eb','Partenariat ou institution'),
 ('urgent','Urgent','#e11d48','Intervention immédiate')
on conflict (code) do nothing;

insert into public.ac_whatsapp_templates(code,name,category,scope,language,body,variables,status)
values
 ('commercial-intro-fr','Introduction commerciale premium','prospection','organization','fr','Bonjour {{contact_name}}, je vous contacte au nom d’ANGELCARE concernant {{service}}. Nous avons identifié une opportunité de collaboration pertinente pour {{organization}}. Seriez-vous disponible pour un échange court cette semaine ?',array['contact_name','service','organization'],'active'),
 ('followup-fr','Relance professionnelle','followup','organization','fr','Bonjour {{contact_name}}, je reviens vers vous au sujet de {{subject}}. Je reste disponible pour vous présenter les prochaines étapes et répondre à vos questions.',array['contact_name','subject'],'active'),
 ('appointment-fr','Confirmation de rendez-vous','appointment','organization','fr','Bonjour {{contact_name}}, votre rendez-vous ANGELCARE est confirmé le {{appointment_date}}. Notre équipe reste disponible si vous souhaitez ajuster l’horaire.',array['contact_name','appointment_date'],'active'),
 ('payment-fr','Rappel de paiement courtois','payment','organization','fr','Bonjour {{contact_name}}, nous vous rappelons que la facture {{invoice_number}} d’un montant de {{amount}} Dh arrive à échéance le {{payment_deadline}}. Merci de nous confirmer la date de règlement prévue.',array['contact_name','invoice_number','amount','payment_deadline'],'active')
on conflict (code) do nothing;
