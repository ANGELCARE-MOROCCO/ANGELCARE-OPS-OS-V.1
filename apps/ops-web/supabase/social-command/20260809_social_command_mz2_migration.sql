-- ANGELCARE SOCIAL COMMAND MZ2 · ENGAGEMENT / AUTOMATION / INTELLIGENCE
-- Additive only. MZ1 media binaries remain on Windows infrastructure.
begin;
create extension if not exists pgcrypto;

create table if not exists public.social_command_webhook_deliveries (
 id uuid primary key default gen_random_uuid(), provider text not null default 'meta', event_key text,
 signature_valid boolean not null default false, duplicate boolean not null default false, status text not null default 'received',
 payload_bytes bigint not null default 0, event_id uuid, duplicate_event_id uuid, normalized_count integer not null default 0, latency_ms integer,
 error_message text, received_at timestamptz not null default now(), processed_at timestamptz, metadata jsonb not null default '{}'::jsonb
);
create index if not exists social_command_webhook_delivery_time_idx on public.social_command_webhook_deliveries(received_at desc,status);

create table if not exists public.social_command_webhook_events (
 id uuid primary key default gen_random_uuid(), delivery_id uuid references public.social_command_webhook_deliveries(id) on delete cascade,
 provider text not null default 'meta', provider_event_key text not null, object_type text, event_type text not null,
 payload jsonb not null default '{}'::jsonb, status text not null default 'accepted', normalized_count integer not null default 0,
 received_at timestamptz not null default now(), processed_at timestamptz, error_message text, created_at timestamptz not null default now()
);
create unique index if not exists social_command_webhook_event_key_idx on public.social_command_webhook_events(provider,provider_event_key);
create index if not exists social_command_webhook_event_kind_idx on public.social_command_webhook_events(event_type,received_at desc);

create table if not exists public.social_command_conversations (
 id uuid primary key default gen_random_uuid(), channel text not null check(channel in ('facebook','instagram')),
 provider_conversation_id text, participant_id text not null, participant_username text, participant_name text, participant_profile_picture_url text,
 status text not null default 'new' check(status in ('new','open','waiting','priority','assigned','responded','resolved','archived')),
 priority text not null default 'normal', assigned_user_id text, campaign_id uuid references public.social_command_campaigns(id) on delete set null,
 source_publication_id uuid references public.social_command_publications(id) on delete set null,
 triage_category text, triage_source text, triage_confidence numeric, unread_count integer not null default 0,
 first_received_at timestamptz not null default now(), last_message_at timestamptz not null default now(), first_response_at timestamptz,
 resolved_at timestamptz, due_at timestamptz, last_message_preview text, tags text[] not null default '{}', metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(channel,participant_id)
);
create index if not exists social_command_conversation_work_idx on public.social_command_conversations(status,priority,last_message_at desc);

create table if not exists public.social_command_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.social_command_conversations(id) on delete cascade,
 provider_message_id text, direction text not null check(direction in ('inbound','outbound')), sender_id text, recipient_id text, sender_username text,
 message_type text not null default 'text', text text not null default '', attachments jsonb not null default '[]'::jsonb,
 status text not null default 'received' check(status in ('received','queued','sending','sent','failed','read')), sent_by_user_id text,
 provider_timestamp timestamptz, provider_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists social_command_message_provider_idx on public.social_command_messages(provider_message_id) where provider_message_id is not null;
create index if not exists social_command_message_conversation_idx on public.social_command_messages(conversation_id,created_at);

create table if not exists public.social_command_conversation_assignments (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.social_command_conversations(id) on delete cascade,
 assigned_user_id text, assigned_by text, action text not null default 'assignment', assigned_at timestamptz not null default now(), unassigned_at timestamptz, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.social_command_conversation_tags (
 conversation_id uuid not null references public.social_command_conversations(id) on delete cascade, tag text not null, created_by text, created_at timestamptz not null default now(), primary key(conversation_id,tag)
);
create table if not exists public.social_command_engagement_events (
 id uuid primary key default gen_random_uuid(), kind text not null, channel text not null, conversation_id uuid references public.social_command_conversations(id) on delete cascade,
 publication_id uuid references public.social_command_publications(id) on delete set null, campaign_id uuid references public.social_command_campaigns(id) on delete set null,
 provider_reference text, status text not null default 'new', payload jsonb not null default '{}'::jsonb, observed_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists public.social_command_comments (
 id uuid primary key default gen_random_uuid(), provider_comment_id text not null unique, channel text not null default 'instagram', media_id text,
 publication_id uuid references public.social_command_publications(id) on delete set null, campaign_id uuid references public.social_command_campaigns(id) on delete set null,
 commenter_id text, commenter_username text, text text not null default '', status text not null default 'unanswered' check(status in ('new','unanswered','priority','sensitive','answered','resolved')),
 assigned_user_id text, provider_created_at timestamptz, replied_at timestamptz, resolved_at timestamptz, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists social_command_comments_work_idx on public.social_command_comments(status,provider_created_at desc);

create table if not exists public.social_command_mentions (
 id uuid primary key default gen_random_uuid(), provider_mention_id text not null unique, channel text not null default 'instagram', actor_id text, actor_username text,
 media_id text, text text, status text not null default 'new' check(status in ('new','reviewed','resolved')), metadata jsonb not null default '{}'::jsonb,
 provider_created_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.social_command_automations (
 id uuid primary key default gen_random_uuid(), automation_code text not null unique, name text not null, description text not null default '', family text not null,
 status text not null default 'active' check(status in ('active','paused','disabled')), trigger_type text not null,
 trigger_config jsonb not null default '{}'::jsonb, condition_config jsonb not null default '{}'::jsonb, action_config jsonb not null default '{}'::jsonb,
 guardrail_config jsonb not null default '{}'::jsonb, execution_mode text not null default 'automatic' check(execution_mode in ('automatic','proposal','manual')),
 version_no integer not null default 1, run_count integer not null default 0, success_count integer not null default 0, failure_count integer not null default 0, last_run_at timestamptz,
 created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.social_command_automation_versions (
 id uuid primary key default gen_random_uuid(), automation_id uuid not null references public.social_command_automations(id) on delete cascade, version_no integer not null,
 snapshot jsonb not null, changed_by text, created_at timestamptz not null default now(), unique(automation_id,version_no)
);
create table if not exists public.social_command_automation_runs (
 id uuid primary key default gen_random_uuid(), automation_id uuid not null references public.social_command_automations(id) on delete cascade, automation_code text not null,
 trigger_type text not null, trigger_entity_type text, trigger_entity_id text, status text not null check(status in ('running','completed','failed','skipped')),
 decision text, input_snapshot jsonb not null default '{}'::jsonb, condition_results jsonb not null default '{}'::jsonb, action_results jsonb not null default '[]'::jsonb,
 error_message text, started_at timestamptz not null default now(), completed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists social_command_automation_runs_idx on public.social_command_automation_runs(automation_code,started_at desc);
create table if not exists public.social_command_automation_actions (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references public.social_command_automation_runs(id) on delete cascade,
 action_type text not null, entity_type text, entity_id text, status text not null, result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), completed_at timestamptz
);

create table if not exists public.social_command_metric_snapshots (
 id uuid primary key default gen_random_uuid(), provider text not null default 'meta', channel text not null, entity_type text not null, entity_id text not null,
 metric_code text not null, canonical_metric text not null, value_numeric numeric, value_text text, period text, observed_at timestamptz not null,
 truth_state text not null check(truth_state in ('live','syncing','stale','unavailable','insufficient_data','provider_limited','failed')),
 provider_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists social_command_metric_lookup_idx on public.social_command_metric_snapshots(entity_type,entity_id,metric_code,observed_at desc);
create table if not exists public.social_command_campaign_metrics (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.social_command_campaigns(id) on delete cascade,
 metric_code text not null, value_numeric numeric, truth_state text not null, observed_at timestamptz not null, source_count integer not null default 0,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.social_command_reconciliation_runs (
 id uuid primary key default gen_random_uuid(), provider text not null default 'meta', status text not null, checked_count integer not null default 0,
 confirmed_count integer not null default 0, missing_count integer not null default 0, failed_count integer not null default 0,
 details jsonb not null default '[]'::jsonb, started_at timestamptz not null, completed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.social_command_channel_health_events (
 id uuid primary key default gen_random_uuid(), connection_id uuid references public.social_command_connections(id) on delete cascade, channel text not null,
 health_state text not null, reason text, details jsonb not null default '{}'::jsonb, observed_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.social_command_ai_operations (
 id uuid primary key default gen_random_uuid(), module text not null default 'social-command', operation text not null, actor_user_id text, automation_id text,
 provider text, status text not null, request_snapshot jsonb not null default '{}'::jsonb, response_snapshot jsonb not null default '{}'::jsonb,
 estimated_units numeric, actual_units numeric, error_message text, started_at timestamptz not null default now(), completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.social_command_operator_notes (
 id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id text not null, note text not null, created_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Seed the complete signed automation catalogue. No approval/shadow fields exist.
insert into public.social_command_automations(automation_code,name,description,family,status,trigger_type,trigger_config,condition_config,action_config,guardrail_config,execution_mode)
values
('A01','Smart Scheduler','Exécute les publications planifiées via le scheduler MZ1.','schedule','active','schedule_due','{}','{}','{"delegate":"mz1_scheduler"}','{"idempotent":true}','automatic'),
('A02','Failure Recovery Engine','Récupération contrôlée des erreurs transitoires MZ1.','recovery','active','job_failed','{}','{"transient_only":true}','{"delegate":"mz1_retry"}','{"max_attempts":5}','automatic'),
('A03','Credential Health Watch','Vérifie la santé de la connexion Meta et signale une reconnexion nécessaire.','credential','active','worker_tick','{}','{}','{"verify_meta_connection":true}','{"no_secret_exposure":true}','automatic'),
('A04','Publication Collision Guard','Détecte doublons probables et densités anormales sans créer de blocage artificiel.','collision','active','worker_tick','{}','{"dense_per_hour":3}','{"surface_attention":true}','{"operator_override":true}','automatic'),
('A05','Media Readiness Validator','Contrôle la préparation média avant exécution.','media','active','worker_tick','{}','{}','{"delegate":"mz1_media_validator"}','{"no_binary_in_supabase":true}','automatic'),
('A06','Cross-Channel Adaptation','Prépare des variantes éditables par canal via le contrôle IA central.','distribution','active','manual_or_campaign','{}','{}','{"ai_control":"central"}','{"operator_editable":true}','proposal'),
('A07','Campaign Cadence Engine','Transforme un volume/horizon en proposition de cadence réutilisant le Bulk Orchestrator MZ1.','cadence','active','manual','{}','{}','{"delegate":"mz1_bulk_orchestrator"}','{"no_second_scheduler":true}','proposal'),
('A08','DM Triage','Classe les conversations entrantes et maintient la classification éditable.','engagement','active','dm_inbound','{}','{}','{"classify":true}','{"editable":true}','automatic'),
('A09','Engagement Escalation','Fait remonter les interactions non répondues selon le seuil configuré.','engagement','active','worker_tick','{}','{"unanswered_minutes":120}','{"priority":"high"}','{"no_approval_gate":true}','automatic'),
('A10','Post-Publish Reconciliation','Réconcilie les références publiées avec l’état fournisseur.','reconciliation','active','worker_tick','{}','{}','{"provider_reconcile":true}','{"never_fake_success":true}','automatic')
on conflict(automation_code) do update set name=excluded.name,description=excluded.description,family=excluded.family,trigger_type=excluded.trigger_type,trigger_config=excluded.trigger_config,condition_config=excluded.condition_config,action_config=excluded.action_config,guardrail_config=excluded.guardrail_config,execution_mode=excluded.execution_mode,updated_at=now();

-- Maintain first assignment history automatically through service writes; secure tables exactly like MZ1.
do $$ declare t text; begin
 foreach t in array array[
 'social_command_webhook_deliveries','social_command_webhook_events','social_command_conversations','social_command_messages','social_command_conversation_assignments','social_command_conversation_tags','social_command_engagement_events','social_command_comments','social_command_mentions','social_command_automations','social_command_automation_versions','social_command_automation_runs','social_command_automation_actions','social_command_metric_snapshots','social_command_campaign_metrics','social_command_reconciliation_runs','social_command_channel_health_events','social_command_ai_operations','social_command_operator_notes'
 ] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on table public.%I from anon, authenticated',t);
 end loop;
end $$;

commit;
select 'SOCIAL_COMMAND_MZ2_DATABASE_APPLIED' as result, 19 as additive_tables, 10 as canonical_automations;
