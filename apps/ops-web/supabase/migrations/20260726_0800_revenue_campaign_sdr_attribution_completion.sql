begin;

create extension if not exists pgcrypto;

do $preflight$
declare
  id_type text;
  prospect_id_type text;
  required_column text;
  support_table text;
  support_existing integer:=0;
  support_expected integer:=34;
begin
  if to_regclass('public.revenue_campaigns') is null then
    raise exception 'BLOCKED: public.revenue_campaigns is missing.';
  end if;
  select data_type into id_type from information_schema.columns
  where table_schema='public' and table_name='revenue_campaigns' and column_name='id';
  if id_type is distinct from 'uuid' then
    raise exception 'BLOCKED: revenue_campaigns.id must be uuid; found %.',coalesce(id_type,'missing');
  end if;
  foreach required_column in array array['name','audience','objective','channel','budget_mad','status','priority','owner','metadata','created_at','updated_at'] loop
    if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name=required_column) then
      raise exception 'BLOCKED: revenue_campaigns.% is required by Mega ZIP 10.',required_column;
    end if;
  end loop;
  if to_regclass('public.revenue_prospects') is null then raise exception 'BLOCKED: public.revenue_prospects is missing.'; end if;
  if to_regclass('public.revenue_accounts') is null then raise exception 'BLOCKED: public.revenue_accounts is missing.'; end if;
  if to_regclass('public.revenue_contacts') is null then raise exception 'BLOCKED: public.revenue_contacts is missing.'; end if;
  if to_regclass('public.revenue_tasks') is null then raise exception 'BLOCKED: Phase 4 revenue_tasks is missing.'; end if;
  if to_regclass('public.revenue_appointments') is null then raise exception 'BLOCKED: Phase 5 revenue_appointments is missing.'; end if;
  if to_regclass('public.revenue_payment_confirmations') is null then raise exception 'BLOCKED: Phase 7 revenue_payment_confirmations is missing.'; end if;
  select data_type into prospect_id_type from information_schema.columns
  where table_schema='public' and table_name='revenue_prospects' and column_name='id';
  if prospect_id_type is distinct from 'text' then
    raise exception 'BLOCKED: revenue_prospects.id must remain text; found %.',coalesce(prospect_id_type,'missing');
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='account_id' and data_type='uuid') then raise exception 'BLOCKED: revenue_prospects.account_id uuid is required.'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='contact_id' and data_type='uuid') then raise exception 'BLOCKED: revenue_prospects.contact_id uuid is required.'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_communication_events' and column_name='thread_id' and data_type='uuid') then raise exception 'BLOCKED: revenue_communication_events.thread_id uuid is required.'; end if;
  if to_regclass('public.revenue_communication_threads') is null then raise exception 'BLOCKED: Phase 5 revenue_communication_threads is missing.'; end if;
  if to_regclass('public.revenue_communication_events') is null then raise exception 'BLOCKED: Phase 5 revenue_communication_events is missing.'; end if;
  if to_regclass('public.revenue_communication_delivery_events') is null then raise exception 'BLOCKED: Phase 5 revenue_communication_delivery_events is missing.'; end if;
  if to_regclass('public.revenue_opportunities') is null then raise exception 'BLOCKED: canonical revenue_opportunities is missing.'; end if;
  if to_regclass('public.revenue_proposals') is null then raise exception 'BLOCKED: Phase 6 revenue_proposals is missing.'; end if;
  if to_regclass('public.revenue_contracts') is null then raise exception 'BLOCKED: Phase 7 revenue_contracts is missing.'; end if;
  if to_regclass('public.revenue_realization_events') is null then raise exception 'BLOCKED: Phase 7 revenue_realization_events is missing.'; end if;
  foreach support_table in array array[
    'revenue_campaign_segments','revenue_campaign_segment_versions','revenue_campaign_audience_snapshots','revenue_campaign_audience_members',
    'revenue_campaign_recipient_eligibility','revenue_campaign_recipients','revenue_campaign_suppressions','revenue_campaign_frequency_decisions',
    'revenue_campaign_sequences','revenue_campaign_sequence_versions','revenue_campaign_templates','revenue_campaign_template_versions',
    'revenue_campaign_sequence_steps','revenue_campaign_sequence_branches','revenue_campaign_enrollments','revenue_campaign_step_executions',
    'revenue_campaign_dispatch_attempts','revenue_campaign_replies','revenue_campaign_sdr_assignments','revenue_campaign_provider_readiness',
    'revenue_campaign_sender_readiness','revenue_campaign_approvals','revenue_campaign_risks','revenue_campaign_evidence',
    'revenue_campaign_status_history','revenue_campaign_conversion_events','revenue_campaign_attributions','revenue_campaign_attribution_conflicts',
    'revenue_campaign_costs','revenue_campaign_performance_periods','revenue_campaign_experiments','revenue_campaign_experiment_variants',
    'revenue_campaign_recovery_plans','revenue_campaign_recovery_checkpoints'
  ] loop
    if to_regclass('public.'||support_table) is not null then support_existing:=support_existing+1; end if;
  end loop;
  if support_existing>0 and support_existing<support_expected then
    raise exception 'BLOCKED: partial Mega ZIP 10 schema detected (%/% support tables). Reconcile or roll back before applying.',support_existing,support_expected;
  end if;
end
$preflight$;

alter table public.revenue_campaigns
  add column if not exists reference text,
  add column if not exists campaign_type text not null default 'acquisition',
  add column if not exists channel_mix jsonb not null default '[]'::jsonb,
  add column if not exists owner_id uuid,
  add column if not exists sdr_lead text,
  add column if not exists end_at timestamptz,
  add column if not exists approval_status text not null default 'not_requested',
  add column if not exists readiness_status text not null default 'not_evaluated',
  add column if not exists audience_mode text not null default 'frozen_snapshot',
  add column if not exists attribution_model text not null default 'rules_primary_source',
  add column if not exists attribution_window_days integer not null default 60,
  add column if not exists frequency_policy jsonb not null default '{"maxPerDay":2,"maxPerWeek":5,"minHoursBetween":20}'::jsonb,
  add column if not exists strategy jsonb not null default '{}'::jsonb,
  add column if not exists risk_status text not null default 'clear',
  add column if not exists pause_reason text,
  add column if not exists emergency_stopped boolean not null default false,
  add column if not exists emergency_stopped_at timestamptz,
  add column if not exists audience_snapshot_id uuid,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

update public.revenue_campaigns
set reference=coalesce(nullif(reference,''),'AC-CAM-'||upper(substr(replace(id::text,'-',''),1,10))),
    channel_mix=case when jsonb_array_length(channel_mix)=0 then jsonb_build_array(coalesce(nullif(channel,''),'email')) else channel_mix end,
    sdr_lead=coalesce(nullif(sdr_lead,''),'SDR Lead'),
    readiness_status=coalesce(nullif(readiness_status,''),'not_evaluated'),
    approval_status=coalesce(nullif(approval_status,''),'not_requested')
where reference is null or reference='' or jsonb_array_length(channel_mix)=0 or sdr_lead is null;

create unique index if not exists revenue_campaigns_reference_uidx_v10 on public.revenue_campaigns(reference) where reference is not null;
create index if not exists revenue_campaigns_status_idx_v10 on public.revenue_campaigns(status,updated_at desc);
create index if not exists revenue_campaigns_owner_idx_v10 on public.revenue_campaigns(owner,owner_id,status);
create index if not exists revenue_campaigns_launch_idx_v10 on public.revenue_campaigns(launch_at,status);

alter table public.revenue_communication_events
  add column if not exists campaign_id uuid,
  add column if not exists campaign_recipient_id uuid,
  add column if not exists campaign_sequence_version_id uuid,
  add column if not exists campaign_step_id uuid;
create index if not exists revenue_communication_events_campaign_idx_v10 on public.revenue_communication_events(campaign_id,occurred_at desc);
create index if not exists revenue_communication_events_campaign_recipient_idx_v10 on public.revenue_communication_events(campaign_recipient_id,occurred_at desc);

create table if not exists public.revenue_campaign_segments(
  id uuid primary key default gen_random_uuid(),
  name text not null,entity_type text not null default 'prospect',objective text,
  filter_definition jsonb not null default '{}'::jsonb,exclusion_definition jsonb not null default '{}'::jsonb,
  owner text,visibility text not null default 'team',status text not null default 'draft',current_version integer not null default 0,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),archived_at timestamptz
);
create table if not exists public.revenue_campaign_segment_versions(
  id uuid primary key default gen_random_uuid(),segment_id uuid not null references public.revenue_campaign_segments(id) on delete cascade,
  version_number integer not null,filter_definition jsonb not null default '{}'::jsonb,exclusion_definition jsonb not null default '{}'::jsonb,
  estimated_size integer not null default 0,status text not null default 'draft',approved_by uuid,approved_at timestamptz,
  created_by uuid,created_at timestamptz not null default now(),unique(segment_id,version_number)
);
create table if not exists public.revenue_campaign_audience_snapshots(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  segment_id uuid references public.revenue_campaign_segments(id) on delete set null,
  segment_version_id uuid references public.revenue_campaign_segment_versions(id) on delete set null,
  mode text not null default 'frozen',filter_snapshot jsonb not null default '{}'::jsonb,
  candidate_count integer not null default 0,eligible_count integer not null default 0,excluded_count integer not null default 0,
  suppressed_count integer not null default 0,duplicate_count integer not null default 0,missing_channel_count integer not null default 0,
  frequency_blocked_count integer not null default 0,status text not null default 'frozen',frozen_by uuid,frozen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_audience_members(
  id uuid primary key default gen_random_uuid(),snapshot_id uuid not null references public.revenue_campaign_audience_snapshots(id) on delete cascade,
  campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete set null,account_id uuid,contact_id uuid,
  display_name text,channel text,contact_value text,contact_value_normalized text,eligibility_status text not null default 'candidate',
  exclusion_reason text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create unique index if not exists revenue_campaign_audience_member_identity_uidx_v10 on public.revenue_campaign_audience_members(snapshot_id,coalesce(prospect_id,''),coalesce(contact_id::text,''),coalesce(contact_value_normalized,''));

create table if not exists public.revenue_campaign_recipient_eligibility(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete set null,account_id uuid,contact_id uuid,
  channel text not null,contact_value text,contact_value_normalized text,decision text not null,
  reasons jsonb not null default '[]'::jsonb,checks jsonb not null default '{}'::jsonb,
  evaluated_by uuid,evaluated_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create index if not exists revenue_campaign_eligibility_campaign_idx_v10 on public.revenue_campaign_recipient_eligibility(campaign_id,decision,evaluated_at desc);

create table if not exists public.revenue_campaign_recipients(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  audience_snapshot_id uuid references public.revenue_campaign_audience_snapshots(id) on delete set null,
  prospect_id text references public.revenue_prospects(id) on delete set null,account_id uuid,contact_id uuid,
  display_name text,channel text not null,contact_value text,contact_value_normalized text,
  status text not null default 'candidate',owner text,owner_id uuid,current_step_order integer,current_sequence_version_id uuid,
  communication_thread_id uuid references public.revenue_communication_threads(id) on delete set null,
  eligibility_id uuid references public.revenue_campaign_recipient_eligibility(id) on delete set null,
  first_contact_at timestamptz,last_action_at timestamptz,last_reply_at timestamptz,completed_at timestamptz,
  idempotency_key text not null,metadata jsonb not null default '{}'::jsonb,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(idempotency_key)
);
create unique index if not exists revenue_campaign_active_recipient_uidx_v10 on public.revenue_campaign_recipients(campaign_id,coalesce(prospect_id,''),coalesce(contact_id::text,''),coalesce(contact_value_normalized,'')) where status not in ('removed','invalid','completed');
create index if not exists revenue_campaign_recipients_queue_idx_v10 on public.revenue_campaign_recipients(campaign_id,status,owner,updated_at desc);

create table if not exists public.revenue_campaign_suppressions(
  id uuid primary key default gen_random_uuid(),campaign_id uuid references public.revenue_campaigns(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete set null,contact_id uuid,contact_value_normalized text,
  channel text not null default 'all',scope text not null default 'global',reason text not null,status text not null default 'active',
  effective_at timestamptz not null default now(),expires_at timestamptz,source_event_id uuid,evidence jsonb not null default '{}'::jsonb,
  created_by uuid,revoked_by uuid,revoked_at timestamptz,revocation_reason text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists revenue_campaign_suppressions_lookup_idx_v10 on public.revenue_campaign_suppressions(status,channel,scope,prospect_id,contact_id,contact_value_normalized);
create table if not exists public.revenue_campaign_frequency_decisions(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.revenue_campaign_recipients(id) on delete cascade,
  prospect_id text,contact_id uuid,channel text,decision text not null,reason text,
  daily_count integer not null default 0,weekly_count integer not null default 0,last_contact_at timestamptz,next_allowed_at timestamptz,
  policy_snapshot jsonb not null default '{}'::jsonb,evaluated_at timestamptz not null default now(),created_at timestamptz not null default now()
);

create table if not exists public.revenue_campaign_sequences(
  id uuid primary key default gen_random_uuid(),campaign_id uuid references public.revenue_campaigns(id) on delete cascade,
  name text not null,objective text,target_entity_type text not null default 'prospect',entry_criteria jsonb not null default '{}'::jsonb,
  exit_criteria jsonb not null default '{}'::jsonb,pause_rules jsonb not null default '{}'::jsonb,frequency_limits jsonb not null default '{}'::jsonb,
  status text not null default 'draft',owner text,current_version integer not null default 0,active_version_id uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),archived_at timestamptz
);
create table if not exists public.revenue_campaign_sequence_versions(
  id uuid primary key default gen_random_uuid(),sequence_id uuid not null references public.revenue_campaign_sequences(id) on delete cascade,
  version_number integer not null,snapshot jsonb not null default '{}'::jsonb,status text not null default 'draft',
  approved_by uuid,approved_at timestamptz,created_by uuid,created_at timestamptz not null default now(),unique(sequence_id,version_number)
);
alter table public.revenue_campaign_sequences drop constraint if exists revenue_campaign_sequences_active_version_fk_v10;
alter table public.revenue_campaign_sequences add constraint revenue_campaign_sequences_active_version_fk_v10 foreign key(active_version_id) references public.revenue_campaign_sequence_versions(id) on delete set null;

create table if not exists public.revenue_campaign_templates(
  id uuid primary key default gen_random_uuid(),name text not null,channel text not null,language text not null default 'fr',
  target_audience text,objective text,subject text,body text not null,variables jsonb not null default '[]'::jsonb,
  required_disclosures jsonb not null default '[]'::jsonb,status text not null default 'draft',owner text,
  current_version integer not null default 0,active_version_id uuid,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),archived_at timestamptz
);
create table if not exists public.revenue_campaign_template_versions(
  id uuid primary key default gen_random_uuid(),template_id uuid not null references public.revenue_campaign_templates(id) on delete cascade,
  version_number integer not null,subject text,body text not null,variables jsonb not null default '[]'::jsonb,
  status text not null default 'draft',approved_by uuid,approved_at timestamptz,created_by uuid,created_at timestamptz not null default now(),
  unique(template_id,version_number)
);
alter table public.revenue_campaign_templates drop constraint if exists revenue_campaign_templates_active_version_fk_v10;
alter table public.revenue_campaign_templates add constraint revenue_campaign_templates_active_version_fk_v10 foreign key(active_version_id) references public.revenue_campaign_template_versions(id) on delete set null;

create table if not exists public.revenue_campaign_sequence_steps(
  id uuid primary key default gen_random_uuid(),sequence_id uuid not null references public.revenue_campaign_sequences(id) on delete cascade,
  sequence_version_id uuid references public.revenue_campaign_sequence_versions(id) on delete cascade,
  step_order integer not null,step_type text not null,channel text,delay_minutes integer not null default 0,
  allowed_window jsonb not null default '{}'::jsonb,template_id uuid references public.revenue_campaign_templates(id) on delete set null,
  template_version_id uuid references public.revenue_campaign_template_versions(id) on delete set null,sender_identity_id text,
  owner_role text,preconditions jsonb not null default '{}'::jsonb,skip_conditions jsonb not null default '{}'::jsonb,
  success_conditions jsonb not null default '{}'::jsonb,failure_behavior jsonb not null default '{}'::jsonb,
  reply_behavior jsonb not null default '{}'::jsonb,retry_policy jsonb not null default '{}'::jsonb,status text not null default 'draft',
  created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists revenue_campaign_sequence_steps_order_uidx_v10 on public.revenue_campaign_sequence_steps(sequence_id,coalesce(sequence_version_id,'00000000-0000-0000-0000-000000000000'::uuid),step_order);
create table if not exists public.revenue_campaign_sequence_branches(
  id uuid primary key default gen_random_uuid(),sequence_id uuid not null references public.revenue_campaign_sequences(id) on delete cascade,
  sequence_version_id uuid references public.revenue_campaign_sequence_versions(id) on delete cascade,
  source_step_id uuid not null references public.revenue_campaign_sequence_steps(id) on delete cascade,
  condition_type text not null,condition_definition jsonb not null default '{}'::jsonb,
  target_step_id uuid references public.revenue_campaign_sequence_steps(id) on delete set null,exit_outcome text,
  priority integer not null default 100,status text not null default 'active',created_by uuid,created_at timestamptz not null default now()
);

create table if not exists public.revenue_campaign_enrollments(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid not null references public.revenue_campaign_recipients(id) on delete cascade,
  sequence_id uuid not null references public.revenue_campaign_sequences(id) on delete restrict,
  sequence_version_id uuid not null references public.revenue_campaign_sequence_versions(id) on delete restrict,
  status text not null default 'active',current_step_order integer not null default 1,entered_at timestamptz not null default now(),
  paused_at timestamptz,completed_at timestamptz,exit_reason text,idempotency_key text not null,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(idempotency_key)
);
create unique index if not exists revenue_campaign_active_enrollment_uidx_v10 on public.revenue_campaign_enrollments(campaign_recipient_id,sequence_version_id) where status in ('active','paused');
create table if not exists public.revenue_campaign_step_executions(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid not null references public.revenue_campaign_recipients(id) on delete cascade,
  enrollment_id uuid not null references public.revenue_campaign_enrollments(id) on delete cascade,
  sequence_step_id uuid not null references public.revenue_campaign_sequence_steps(id) on delete restrict,
  step_order integer not null,step_type text not null,channel text,owner text,status text not null default 'scheduled',
  priority_score numeric(8,2) not null default 50,scheduled_at timestamptz,due_at timestamptz,started_at timestamptz,completed_at timestamptz,
  attempt_count integer not null default 0,last_error text,idempotency_key text not null,metadata jsonb not null default '{}'::jsonb,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(idempotency_key)
);
create index if not exists revenue_campaign_step_queue_idx_v10 on public.revenue_campaign_step_executions(status,due_at,priority_score desc);
create table if not exists public.revenue_campaign_dispatch_attempts(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid not null references public.revenue_campaign_recipients(id) on delete cascade,
  step_execution_id uuid not null references public.revenue_campaign_step_executions(id) on delete cascade,
  communication_event_id uuid references public.revenue_communication_events(id) on delete set null,
  provider text not null,provider_message_id text,status text not null default 'prepared',attempt_number integer not null default 1,
  idempotency_key text not null,error_code text,error_message text,requested_at timestamptz not null default now(),
  provider_accepted_at timestamptz,completed_at timestamptz,metadata jsonb not null default '{}'::jsonb,created_by uuid,created_at timestamptz not null default now(),unique(idempotency_key)
);

create table if not exists public.revenue_campaign_replies(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid not null references public.revenue_campaign_recipients(id) on delete cascade,
  communication_event_id uuid references public.revenue_communication_events(id) on delete set null,
  channel text not null,classification text not null,message text,provider_message_id text,
  qualifying boolean not null default false,opt_out boolean not null default false,requires_human_review boolean not null default false,
  follow_up_due_at timestamptz,classified_by uuid,occurred_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_sdr_assignments(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.revenue_campaign_recipients(id) on delete cascade,
  assignment_type text not null default 'follow_up',owner text,owner_id uuid,status text not null default 'open',priority text not null default 'high',
  due_at timestamptz,objective text,outcome text,source_reply_id uuid references public.revenue_campaign_replies(id) on delete set null,
  completed_at timestamptz,created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists revenue_campaign_sdr_queue_idx_v10 on public.revenue_campaign_sdr_assignments(status,due_at,priority);

create table if not exists public.revenue_campaign_provider_readiness(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  channel text not null,provider text not null,sender_identity_id text,status text not null default 'unknown',checks jsonb not null default '{}'::jsonb,
  daily_limit integer not null default 0,available_capacity integer not null default 0,recent_failure_rate numeric(8,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb,checked_by uuid,checked_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_sender_readiness(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  channel text not null,provider text,sender_identity_id text not null,status text not null default 'unknown',checks jsonb not null default '{}'::jsonb,
  daily_limit integer not null default 0,available_capacity integer not null default 0,recent_failure_rate numeric(8,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb,checked_by uuid,checked_at timestamptz not null default now(),created_at timestamptz not null default now()
);

create table if not exists public.revenue_campaign_approvals(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  approval_type text not null default 'launch',title text not null,reason text,risk_level text not null default 'medium',status text not null default 'pending',
  limitations jsonb not null default '{}'::jsonb,evidence jsonb not null default '{}'::jsonb,requested_by uuid,requested_at timestamptz not null default now(),
  due_at timestamptz,decided_by uuid,decided_at timestamptz,decision_reason text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_risks(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  risk_type text not null,description text not null,severity text not null default 'medium',probability_percent numeric(5,2) not null default 0,
  value_at_risk_mad numeric(18,2) not null default 0,owner text,mitigation text,status text not null default 'open',
  resolution text,created_by uuid,resolved_by uuid,resolved_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_evidence(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  evidence_type text not null,title text not null,reference text not null,url text,payload jsonb not null default '{}'::jsonb,
  created_by uuid,created_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_status_history(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  event_type text not null,title text not null,from_status text,to_status text,reason text,
  payload jsonb not null default '{}'::jsonb,result jsonb not null default '{}'::jsonb,actor_id uuid,
  occurred_at timestamptz not null default now(),created_at timestamptz not null default now()
);

create table if not exists public.revenue_campaign_conversion_events(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.revenue_campaign_recipients(id) on delete set null,
  communication_event_id uuid references public.revenue_communication_events(id) on delete set null,
  event_type text not null,target_entity_type text not null,target_entity_id text not null,evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),created_by uuid,created_at timestamptz not null default now()
);
create unique index if not exists revenue_campaign_conversion_event_uidx_v10 on public.revenue_campaign_conversion_events(campaign_id,event_type,target_entity_type,target_entity_id);
create table if not exists public.revenue_campaign_attributions(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.revenue_campaign_recipients(id) on delete set null,
  sequence_version_id uuid references public.revenue_campaign_sequence_versions(id) on delete set null,
  sequence_step_id uuid references public.revenue_campaign_sequence_steps(id) on delete set null,
  channel text,sdr_owner text,event_type text not null,event_id text not null,attribution_model text not null,
  attribution_share numeric(8,4) not null,attributed_value numeric(18,2) not null default 0,currency text not null default 'MAD',
  event_timestamp timestamptz,evidence_reference text not null,status text not null default 'active',override_reason text,
  reversal_event_id uuid,reversed_at timestamptz,created_by uuid,created_at timestamptz not null default now(),
  check(attribution_share>0 and attribution_share<=100),check(attributed_value>=0)
);
create unique index if not exists revenue_campaign_attribution_active_uidx_v10 on public.revenue_campaign_attributions(campaign_id,event_type,event_id,attribution_model) where status in ('active','confirmed','attributed');
create index if not exists revenue_campaign_attribution_event_idx_v10 on public.revenue_campaign_attributions(event_type,event_id,status);
create table if not exists public.revenue_campaign_attribution_conflicts(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  campaign_recipient_id uuid references public.revenue_campaign_recipients(id) on delete set null,
  conflict_type text not null,description text not null,competing_source_type text,competing_source_id text,event_type text,event_id text,
  value_at_risk_mad numeric(18,2) not null default 0,status text not null default 'open',decision text,resolution_reason text,
  created_by uuid,resolved_by uuid,resolved_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_campaign_costs(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  category text not null,label text not null,amount_mad numeric(18,2) not null,currency text not null default 'MAD',
  cost_state text not null default 'estimated',occurred_on date not null default current_date,source text not null default 'manual',
  finance_reference text,evidence jsonb not null default '{}'::jsonb,approval_status text not null default 'not_required',
  created_by uuid,confirmed_by uuid,confirmed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  check(amount_mad>=0),check(cost_state in ('estimated','approved','committed','confirmed'))
);
create table if not exists public.revenue_campaign_performance_periods(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  label text not null,starts_at timestamptz not null,ends_at timestamptz,status text not null default 'active',
  targets jsonb not null default '{}'::jsonb,metrics jsonb not null default '{}'::jsonb,economics jsonb not null default '{}'::jsonb,
  scorecard jsonb not null default '{}'::jsonb,review_decision text,closed_by uuid,closed_at timestamptz,
  created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_experiments(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  name text not null,hypothesis text not null,primary_metric text not null,secondary_metrics jsonb not null default '[]'::jsonb,
  allocation jsonb not null default '{}'::jsonb,minimum_sample_size integer not null default 100,status text not null default 'draft',
  starts_at timestamptz,ends_at timestamptz,winner_variant_id uuid,decision_reason text,created_by uuid,decided_by uuid,decided_at timestamptz,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_experiment_variants(
  id uuid primary key default gen_random_uuid(),experiment_id uuid not null references public.revenue_campaign_experiments(id) on delete cascade,
  label text not null,variant_type text not null,configuration jsonb not null default '{}'::jsonb,allocation_percent numeric(8,4) not null default 50,
  sample_size integer not null default 0,results jsonb not null default '{}'::jsonb,status text not null default 'active',created_at timestamptz not null default now(),
  check(allocation_percent>=0 and allocation_percent<=100)
);
alter table public.revenue_campaign_experiments drop constraint if exists revenue_campaign_experiments_winner_fk_v10;
alter table public.revenue_campaign_experiments add constraint revenue_campaign_experiments_winner_fk_v10 foreign key(winner_variant_id) references public.revenue_campaign_experiment_variants(id) on delete set null;
create table if not exists public.revenue_campaign_recovery_plans(
  id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.revenue_campaigns(id) on delete cascade,
  root_cause text not null,impact text not null,containment text not null,corrective_actions jsonb not null default '{}'::jsonb,
  owner text,deadline timestamptz,restart_criteria text not null,status text not null default 'active',created_by uuid,approved_by uuid,
  approved_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.revenue_campaign_recovery_checkpoints(
  id uuid primary key default gen_random_uuid(),recovery_plan_id uuid not null references public.revenue_campaign_recovery_plans(id) on delete cascade,
  title text not null,due_at timestamptz,status text not null default 'open',result text,evidence jsonb not null default '{}'::jsonb,
  completed_by uuid,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

alter table public.revenue_campaigns drop constraint if exists revenue_campaigns_audience_snapshot_fk_v10;
alter table public.revenue_campaigns add constraint revenue_campaigns_audience_snapshot_fk_v10 foreign key(audience_snapshot_id) references public.revenue_campaign_audience_snapshots(id) on delete set null;

alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_fk_v10;
alter table public.revenue_communication_events add constraint revenue_communication_events_campaign_fk_v10 foreign key(campaign_id) references public.revenue_campaigns(id) on delete set null;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_recipient_fk_v10;
alter table public.revenue_communication_events add constraint revenue_communication_events_campaign_recipient_fk_v10 foreign key(campaign_recipient_id) references public.revenue_campaign_recipients(id) on delete set null;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_sequence_version_fk_v10;
alter table public.revenue_communication_events add constraint revenue_communication_events_campaign_sequence_version_fk_v10 foreign key(campaign_sequence_version_id) references public.revenue_campaign_sequence_versions(id) on delete set null;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_step_fk_v10;
alter table public.revenue_communication_events add constraint revenue_communication_events_campaign_step_fk_v10 foreign key(campaign_step_id) references public.revenue_campaign_sequence_steps(id) on delete set null;

create or replace function public.revenue_campaign_touch_updated_at_v10()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

do $triggers$
declare t text;
begin
  foreach t in array array[
    'revenue_campaigns','revenue_campaign_segments','revenue_campaign_recipients','revenue_campaign_suppressions',
    'revenue_campaign_sequences','revenue_campaign_sequence_steps','revenue_campaign_templates','revenue_campaign_enrollments',
    'revenue_campaign_step_executions','revenue_campaign_sdr_assignments','revenue_campaign_approvals','revenue_campaign_risks',
    'revenue_campaign_attribution_conflicts','revenue_campaign_costs','revenue_campaign_performance_periods','revenue_campaign_experiments',
    'revenue_campaign_recovery_plans','revenue_campaign_recovery_checkpoints'
  ] loop
    execute format('drop trigger if exists revenue_campaign_touch_v10 on public.%I',t);
    execute format('create trigger revenue_campaign_touch_v10 before update on public.%I for each row execute function public.revenue_campaign_touch_updated_at_v10()',t);
  end loop;
end
$triggers$;

create or replace function public.revenue_campaign_approved_asset_immutable_v10()
returns trigger language plpgsql as $$
begin
  if old.status='approved' then raise exception 'Approved campaign assets are immutable; create a new version.'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists revenue_campaign_sequence_version_immutable_v10 on public.revenue_campaign_sequence_versions;
create trigger revenue_campaign_sequence_version_immutable_v10 before update or delete on public.revenue_campaign_sequence_versions for each row execute function public.revenue_campaign_approved_asset_immutable_v10();
drop trigger if exists revenue_campaign_template_version_immutable_v10 on public.revenue_campaign_template_versions;
create trigger revenue_campaign_template_version_immutable_v10 before update or delete on public.revenue_campaign_template_versions for each row execute function public.revenue_campaign_approved_asset_immutable_v10();
drop trigger if exists revenue_campaign_version_step_immutable_v10 on public.revenue_campaign_sequence_steps;
create trigger revenue_campaign_version_step_immutable_v10 before update or delete on public.revenue_campaign_sequence_steps
for each row when (old.sequence_version_id is not null and old.status='approved') execute function public.revenue_campaign_approved_asset_immutable_v10();

create or replace function public.revenue_campaign_closed_period_immutable_v10()
returns trigger language plpgsql as $$
begin
  if old.status='closed' then raise exception 'Closed campaign performance periods are immutable.'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists revenue_campaign_closed_period_immutable_v10 on public.revenue_campaign_performance_periods;
create trigger revenue_campaign_closed_period_immutable_v10 before update or delete on public.revenue_campaign_performance_periods
for each row execute function public.revenue_campaign_closed_period_immutable_v10();

create or replace function public.revenue_evaluate_campaign_recipient(
  p_campaign_id uuid,p_prospect_id text default null,p_contact_id uuid default null,p_channel text default 'email',
  p_contact_value text default null,p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_campaign record;v_normalized text;v_suppressed boolean:=false;v_duplicate boolean:=false;v_daily integer:=0;v_weekly integer:=0;
  v_max_day integer:=2;v_max_week integer:=5;v_min_hours integer:=20;v_last timestamptz;v_next timestamptz;
  v_account_id uuid;v_contact_id uuid;
  v_decision text:='eligible';v_reasons jsonb:='[]'::jsonb;v_checks jsonb;v_row revenue_campaign_recipient_eligibility%rowtype;
begin
  select * into v_campaign from public.revenue_campaigns where id=p_campaign_id for share;
  if not found then raise exception 'Campaign not found.'; end if;
  v_contact_id:=p_contact_id;
  if p_prospect_id is not null then
    select account_id,coalesce(p_contact_id,contact_id) into v_account_id,v_contact_id from public.revenue_prospects where id=p_prospect_id;
  end if;
  v_normalized:=lower(trim(coalesce(p_contact_value,'')));
  if v_normalized='' then v_decision:='missing_channel';v_reasons:=v_reasons||jsonb_build_array('contact_value_missing'); end if;
  select exists(select 1 from public.revenue_campaign_suppressions s where s.status='active'
    and (s.expires_at is null or s.expires_at>now())
    and (s.campaign_id is null or s.campaign_id=p_campaign_id)
    and (s.channel='all' or s.channel=p_channel)
    and ((p_prospect_id is not null and s.prospect_id=p_prospect_id) or (v_contact_id is not null and s.contact_id=v_contact_id) or (v_normalized<>'' and s.contact_value_normalized=v_normalized))) into v_suppressed;
  if v_suppressed then v_decision:='suppressed';v_reasons:=v_reasons||jsonb_build_array('active_suppression'); end if;
  select exists(select 1 from public.revenue_campaign_recipients r where r.campaign_id=p_campaign_id
    and r.status not in ('removed','invalid','completed')
    and ((p_prospect_id is not null and r.prospect_id=p_prospect_id) or (v_contact_id is not null and r.contact_id=v_contact_id) or (v_normalized<>'' and r.contact_value_normalized=v_normalized))) into v_duplicate;
  if v_duplicate and v_decision='eligible' then v_decision:='duplicate';v_reasons:=v_reasons||jsonb_build_array('active_enrollment_exists'); end if;
  begin v_max_day:=greatest(1,coalesce((v_campaign.frequency_policy->>'maxPerDay')::integer,2)); exception when others then v_max_day:=2; end;
  begin v_max_week:=greatest(1,coalesce((v_campaign.frequency_policy->>'maxPerWeek')::integer,5)); exception when others then v_max_week:=5; end;
  begin v_min_hours:=greatest(1,coalesce((v_campaign.frequency_policy->>'minHoursBetween')::integer,20)); exception when others then v_min_hours:=20; end;
  select count(*) filter(where occurred_at>=now()-interval '1 day'),count(*) filter(where occurred_at>=now()-interval '7 days'),max(occurred_at)
  into v_daily,v_weekly,v_last from public.revenue_communication_events e
  where e.direction='outbound' and e.channel=p_channel
    and e.status in ('provider_accepted','sent','delivered','recorded','replied')
    and ((p_prospect_id is not null and e.prospect_id=p_prospect_id) or (v_contact_id is not null and e.contact_id=v_contact_id) or (v_normalized<>'' and exists(select 1 from jsonb_array_elements_text(coalesce(e.recipients,'[]'::jsonb)) as x(value) where lower(x.value)=v_normalized)));
  if v_last is not null then v_next:=v_last+make_interval(hours=>v_min_hours); end if;
  if v_decision='eligible' and (v_daily>=v_max_day or v_weekly>=v_max_week or (v_next is not null and v_next>now())) then
    v_decision:='temporarily_blocked';v_reasons:=v_reasons||jsonb_build_array('frequency_cap');
  end if;
  v_checks:=jsonb_build_object('suppressed',v_suppressed,'duplicate',v_duplicate,'dailyCount',v_daily,'weeklyCount',v_weekly,'maxPerDay',v_max_day,'maxPerWeek',v_max_week,'lastContactAt',v_last,'nextAllowedAt',v_next);
  insert into public.revenue_campaign_recipient_eligibility(campaign_id,prospect_id,account_id,contact_id,channel,contact_value,contact_value_normalized,decision,reasons,checks,evaluated_by)
  values(p_campaign_id,p_prospect_id,v_account_id,v_contact_id,p_channel,p_contact_value,nullif(v_normalized,''),v_decision,v_reasons,v_checks,p_actor_id) returning * into v_row;
  insert into public.revenue_campaign_frequency_decisions(campaign_id,prospect_id,contact_id,channel,decision,reason,daily_count,weekly_count,last_contact_at,next_allowed_at,policy_snapshot)
  values(p_campaign_id,p_prospect_id,v_contact_id,p_channel,case when v_decision='temporarily_blocked' then 'blocked' else 'allowed' end,case when v_decision='temporarily_blocked' then 'frequency_cap' else null end,v_daily,v_weekly,v_last,v_next,v_campaign.frequency_policy);
  return jsonb_build_object('id',v_row.id,'decision',v_decision,'reasons',v_reasons,'checks',v_checks);
end $$;

create or replace function public.revenue_freeze_campaign_audience(
  p_campaign_id uuid,p_segment_id uuid default null,p_segment_version_id uuid default null,p_mode text default 'frozen',
  p_filter_snapshot jsonb default '{}'::jsonb,p_members jsonb default '[]'::jsonb,p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_campaign record;v_snapshot record;v_member jsonb;v_eval jsonb;v_decision text;v_prospect_id text;v_contact_id uuid;
  v_account_id uuid;v_display_name text;v_channel text;v_contact_value text;v_candidate integer:=0;v_eligible integer:=0;
  v_excluded integer:=0;v_suppressed integer:=0;v_missing integer:=0;v_frequency integer:=0;v_duplicate integer:=0;
begin
  select * into v_campaign from public.revenue_campaigns where id=p_campaign_id for update;
  if not found then raise exception 'Campaign not found.'; end if;
  if jsonb_typeof(coalesce(p_members,'[]'::jsonb))<>'array' then raise exception 'Audience members must be a JSON array.'; end if;
  insert into public.revenue_campaign_audience_snapshots(campaign_id,segment_id,segment_version_id,mode,filter_snapshot,status,frozen_by,frozen_at)
  values(p_campaign_id,p_segment_id,p_segment_version_id,coalesce(nullif(p_mode,''),'frozen'),coalesce(p_filter_snapshot,'{}'::jsonb),'building',p_actor_id,now())
  returning * into v_snapshot;
  for v_member in select value from jsonb_array_elements(coalesce(p_members,'[]'::jsonb)) loop
    v_candidate:=v_candidate+1;
    v_prospect_id:=nullif(trim(v_member->>'prospectId'),'');
    v_contact_id:=nullif(trim(v_member->>'contactId'),'')::uuid;
    v_account_id:=nullif(trim(v_member->>'accountId'),'')::uuid;
    v_display_name:=coalesce(nullif(trim(v_member->>'displayName'),''),nullif(trim(v_member->>'name'),''),nullif(trim(v_member->>'contactValue'),''),'Destinataire');
    v_channel:=coalesce(nullif(trim(v_member->>'channel'),''),'email');
    v_contact_value:=coalesce(nullif(trim(v_member->>'contactValue'),''),nullif(trim(v_member->>'email'),''),nullif(trim(v_member->>'phone'),''));
    begin
      v_eval:=public.revenue_evaluate_campaign_recipient(p_campaign_id,v_prospect_id,v_contact_id,v_channel,v_contact_value,p_actor_id);
      v_decision:=coalesce(v_eval->>'decision','requires_review');
    exception when others then
      v_decision:='requires_review';
      v_eval:=jsonb_build_object('decision',v_decision,'reasons',jsonb_build_array(sqlerrm));
    end;
    if exists(
      select 1 from public.revenue_campaign_audience_members m
      where m.snapshot_id=v_snapshot.id and coalesce(m.prospect_id,'')=coalesce(v_prospect_id,'')
        and coalesce(m.contact_id::text,'')=coalesce(v_contact_id::text,'')
        and coalesce(m.contact_value_normalized,'')=coalesce(lower(trim(v_contact_value)),'')
    ) then
      v_duplicate:=v_duplicate+1;
      continue;
    end if;
    if v_prospect_id is not null then
      select coalesce(v_account_id,p.account_id),coalesce(v_contact_id,p.contact_id),coalesce(nullif(v_display_name,'Destinataire'),p.name),coalesce(v_contact_value,case when v_channel='email' then p.email else p.phone end)
      into v_account_id,v_contact_id,v_display_name,v_contact_value from public.revenue_prospects p where p.id=v_prospect_id;
    end if;
    insert into public.revenue_campaign_audience_members(snapshot_id,campaign_id,prospect_id,account_id,contact_id,display_name,channel,contact_value,contact_value_normalized,eligibility_status,exclusion_reason,metadata)
    values(v_snapshot.id,p_campaign_id,v_prospect_id,v_account_id,v_contact_id,v_display_name,v_channel,v_contact_value,nullif(lower(trim(coalesce(v_contact_value,''))),''),v_decision,
      case when v_decision='eligible' then null else coalesce((v_eval->'reasons'->>0),v_decision) end,
      coalesce(v_member->'metadata','{}'::jsonb)||jsonb_build_object('eligibility',v_eval));
    if v_decision='eligible' then v_eligible:=v_eligible+1;
    elsif v_decision='suppressed' then v_suppressed:=v_suppressed+1;
    elsif v_decision='missing_channel' then v_missing:=v_missing+1;
    elsif v_decision='temporarily_blocked' then v_frequency:=v_frequency+1;
    else v_excluded:=v_excluded+1; end if;
  end loop;
  update public.revenue_campaign_audience_snapshots set
    candidate_count=v_candidate,eligible_count=v_eligible,excluded_count=v_excluded,suppressed_count=v_suppressed,
    duplicate_count=v_duplicate,missing_channel_count=v_missing,frequency_blocked_count=v_frequency,status='frozen'
  where id=v_snapshot.id returning * into v_snapshot;
  update public.revenue_campaigns set audience_snapshot_id=v_snapshot.id,audience_mode=coalesce(nullif(p_mode,''),'frozen'),status='sequence_preparation',updated_by=p_actor_id,updated_at=now() where id=p_campaign_id;
  insert into public.revenue_campaign_status_history(campaign_id,event_type,title,to_status,payload,result,actor_id)
  values(p_campaign_id,'campaign_audience_frozen','Audience campagne figée','sequence_preparation',jsonb_build_object('segmentId',p_segment_id,'mode',p_mode),
    jsonb_build_object('snapshotId',v_snapshot.id,'candidateCount',v_candidate,'eligibleCount',v_eligible,'excludedCount',v_excluded,'suppressedCount',v_suppressed,'duplicateCount',v_duplicate,'missingChannelCount',v_missing,'frequencyBlockedCount',v_frequency),p_actor_id);
  return jsonb_build_object('id',v_snapshot.id,'candidateCount',v_candidate,'eligibleCount',v_eligible,'excludedCount',v_excluded,'suppressedCount',v_suppressed,'duplicateCount',v_duplicate,'missingChannelCount',v_missing,'frequencyBlockedCount',v_frequency,'status','frozen');
end $$;

create or replace function public.revenue_enroll_campaign_recipient(
  p_campaign_id uuid,p_prospect_id text default null,p_contact_id uuid default null,p_sequence_version_id uuid default null,
  p_channel text default 'email',p_contact_value text default null,p_owner text default null,p_actor_id uuid default null,p_idempotency_key text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_eval jsonb;v_decision text;v_existing record;v_version record;v_sequence record;v_step record;v_recipient record;v_enrollment record;v_execution record;v_key text;
  v_display_name text;v_account_id uuid;v_effective_contact_id uuid;
begin
  v_key:=coalesce(nullif(p_idempotency_key,''),p_campaign_id::text||':'||coalesce(p_prospect_id,p_contact_id::text,lower(trim(p_contact_value))));
  select * into v_existing from public.revenue_campaign_recipients where idempotency_key=v_key;
  if found then return jsonb_build_object('recipientId',v_existing.id,'idempotentReplay',true); end if;
  v_eval:=public.revenue_evaluate_campaign_recipient(p_campaign_id,p_prospect_id,p_contact_id,p_channel,p_contact_value,p_actor_id);
  v_decision:=v_eval->>'decision';
  if v_decision<>'eligible' then raise exception 'Recipient not eligible: %',v_decision; end if;
  v_display_name:=nullif(trim(coalesce(p_contact_value,'')),'');
  v_effective_contact_id:=p_contact_id;
  if p_prospect_id is not null then
    select name,account_id,coalesce(p_contact_id,contact_id) into v_display_name,v_account_id,v_effective_contact_id
    from public.revenue_prospects where id=p_prospect_id;
    if not found then raise exception 'Prospect not found.'; end if;
  end if;
  if p_sequence_version_id is null then
    select sv.* into v_version from public.revenue_campaign_sequence_versions sv join public.revenue_campaign_sequences s on s.id=sv.sequence_id
    where s.campaign_id=p_campaign_id and sv.status='approved' order by sv.approved_at desc nulls last,sv.created_at desc limit 1;
  else select * into v_version from public.revenue_campaign_sequence_versions where id=p_sequence_version_id and status='approved'; end if;
  if not found then raise exception 'Approved sequence version required.'; end if;
  select * into v_sequence from public.revenue_campaign_sequences where id=v_version.sequence_id;
  select * into v_step from public.revenue_campaign_sequence_steps where sequence_id=v_sequence.id and sequence_version_id=v_version.id and status='approved' order by step_order limit 1;
  if not found then raise exception 'Sequence has no executable step.'; end if;
  insert into public.revenue_campaign_recipients(campaign_id,audience_snapshot_id,prospect_id,account_id,contact_id,display_name,channel,contact_value,contact_value_normalized,status,owner,current_step_order,current_sequence_version_id,eligibility_id,idempotency_key,created_by,updated_by)
  values(p_campaign_id,(select id from public.revenue_campaign_audience_snapshots where campaign_id=p_campaign_id and status='frozen' order by frozen_at desc limit 1),p_prospect_id,v_account_id,v_effective_contact_id,coalesce(v_display_name,p_contact_value),p_channel,p_contact_value,nullif(lower(trim(coalesce(p_contact_value,''))),''),'enrolled',p_owner,v_step.step_order,v_version.id,(v_eval->>'id')::uuid,v_key,p_actor_id,p_actor_id) returning * into v_recipient;
  insert into public.revenue_campaign_enrollments(campaign_id,campaign_recipient_id,sequence_id,sequence_version_id,status,current_step_order,idempotency_key,created_by,updated_by)
  values(p_campaign_id,v_recipient.id,v_sequence.id,v_version.id,'active',v_step.step_order,'enroll:'||v_key,p_actor_id,p_actor_id) returning * into v_enrollment;
  insert into public.revenue_campaign_step_executions(campaign_id,campaign_recipient_id,enrollment_id,sequence_step_id,step_order,step_type,channel,owner,status,scheduled_at,due_at,idempotency_key,created_by,updated_by)
  values(p_campaign_id,v_recipient.id,v_enrollment.id,v_step.id,v_step.step_order,v_step.step_type,v_step.channel,p_owner,'scheduled',now()+make_interval(mins=>greatest(0,v_step.delay_minutes)),now()+make_interval(mins=>greatest(0,v_step.delay_minutes)),'step:'||v_enrollment.id::text||':'||v_step.id::text,p_actor_id,p_actor_id) returning * into v_execution;
  return jsonb_build_object('recipientId',v_recipient.id,'enrollmentId',v_enrollment.id,'executionId',v_execution.id,'idempotentReplay',false);
end $$;

create or replace function public.revenue_approve_campaign_sequence(p_sequence_id uuid,p_version_number integer default null,p_actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s record;v record;step_count integer:=0;next_version integer;
begin
  select * into s from public.revenue_campaign_sequences where id=p_sequence_id for update;
  if not found then raise exception 'Campaign sequence not found.'; end if;
  select count(*) into step_count from public.revenue_campaign_sequence_steps where sequence_id=p_sequence_id and sequence_version_id is null and status='draft';
  if step_count=0 then raise exception 'A sequence without draft steps cannot be approved.'; end if;
  next_version:=coalesce(p_version_number,greatest(1,coalesce(s.current_version,0)+1));
  if exists(select 1 from public.revenue_campaign_sequence_versions where sequence_id=p_sequence_id and version_number=next_version) then
    raise exception 'Sequence version % already exists.',next_version;
  end if;
  insert into public.revenue_campaign_sequence_versions(sequence_id,version_number,snapshot,status,approved_by,approved_at,created_by)
  select s.id,next_version,jsonb_build_object(
    'sequence',to_jsonb(s),
    'steps',coalesce((select jsonb_agg(to_jsonb(x) order by x.step_order) from public.revenue_campaign_sequence_steps x where x.sequence_id=s.id and x.sequence_version_id is null and x.status='draft'),'[]'::jsonb)
  ),'approved',p_actor_id,now(),p_actor_id returning * into v;
  insert into public.revenue_campaign_sequence_steps(sequence_id,sequence_version_id,step_order,step_type,channel,delay_minutes,allowed_window,template_id,template_version_id,sender_identity_id,owner_role,preconditions,skip_conditions,success_conditions,failure_behavior,reply_behavior,retry_policy,status,created_by)
  select d.sequence_id,v.id,d.step_order,d.step_type,d.channel,d.delay_minutes,d.allowed_window,d.template_id,
    coalesce(d.template_version_id,t.active_version_id),d.sender_identity_id,d.owner_role,d.preconditions,d.skip_conditions,d.success_conditions,d.failure_behavior,d.reply_behavior,d.retry_policy,'approved',p_actor_id
  from public.revenue_campaign_sequence_steps d
  left join public.revenue_campaign_templates t on t.id=d.template_id
  where d.sequence_id=s.id and d.sequence_version_id is null and d.status='draft';
  update public.revenue_campaign_sequences set status='approved',active_version_id=v.id,current_version=next_version,updated_by=p_actor_id,updated_at=now() where id=s.id;
  return jsonb_build_object('id',v.id,'sequenceId',s.id,'versionNumber',next_version,'status','approved','approvedSteps',step_count);
end $$;

create or replace function public.revenue_evaluate_campaign_readiness(p_campaign_id uuid,p_actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c record;gates jsonb;ready boolean;critical_risks integer;approved_sequence integer;approved_template integer;provider_ready integer;sender_ready integer;approval_ready integer;snapshot_ready integer;
begin
  select * into c from public.revenue_campaigns where id=p_campaign_id for update;
  if not found then raise exception 'Campaign not found.'; end if;
  select count(*) into snapshot_ready from public.revenue_campaign_audience_snapshots where campaign_id=p_campaign_id and status='frozen' and eligible_count>0;
  select count(*) into approved_sequence from public.revenue_campaign_sequences where campaign_id=p_campaign_id and status='approved' and active_version_id is not null;
  select count(distinct tv.id) into approved_template
  from public.revenue_campaign_sequences q
  join public.revenue_campaign_sequence_steps s on s.sequence_id=q.id and s.sequence_version_id=q.active_version_id and s.status='approved'
  join public.revenue_campaign_template_versions tv on tv.id=s.template_version_id and tv.status='approved'
  where q.campaign_id=p_campaign_id and q.status='approved';
  select count(*) into provider_ready from public.revenue_campaign_provider_readiness where campaign_id=p_campaign_id and status='ready';
  select count(*) into sender_ready from public.revenue_campaign_sender_readiness where campaign_id=p_campaign_id and status='ready';
  select count(*) into approval_ready from public.revenue_campaign_approvals where campaign_id=p_campaign_id and status in ('approved','approved_with_limits');
  select count(*) into critical_risks from public.revenue_campaign_risks where campaign_id=p_campaign_id and severity='critical' and status not in ('resolved','closed','accepted');
  gates:=jsonb_build_object(
    'strategy',jsonb_build_object('status',case when nullif(c.objective,'') is not null and nullif(c.audience,'') is not null then 'passed' else 'failed' end),
    'audience',jsonb_build_object('status',case when snapshot_ready>0 then 'passed' else 'failed' end,'count',snapshot_ready),
    'sequence',jsonb_build_object('status',case when approved_sequence>0 then 'passed' else 'failed' end,'count',approved_sequence),
    'templates',jsonb_build_object('status',case when approved_template>0 then 'passed' else 'failed' end,'count',approved_template),
    'provider',jsonb_build_object('status',case when provider_ready>0 then 'passed' else 'failed' end,'count',provider_ready),
    'sender',jsonb_build_object('status',case when sender_ready>0 then 'passed' else 'failed' end,'count',sender_ready),
    'approval',jsonb_build_object('status',case when approval_ready>0 or c.approval_status in ('approved','approved_with_limits') then 'passed' else 'failed' end,'count',approval_ready),
    'risk',jsonb_build_object('status',case when critical_risks=0 then 'passed' else 'failed' end,'criticalOpen',critical_risks),
    'frequency',jsonb_build_object('status',case when jsonb_typeof(c.frequency_policy)='object' then 'passed' else 'failed' end)
  );
  ready:=not exists(select 1 from jsonb_each(gates) x where x.value->>'status'<>'passed');
  update public.revenue_campaigns set readiness_status=case when ready then 'ready' else 'blocked' end,updated_by=p_actor_id,updated_at=now() where id=p_campaign_id;
  insert into public.revenue_campaign_status_history(campaign_id,event_type,title,to_status,payload,result,actor_id)
  values(p_campaign_id,'campaign_readiness_evaluated','Readiness campagne évaluée',case when ready then 'ready' else 'blocked' end,'{}',jsonb_build_object('ready',ready,'gates',gates),p_actor_id);
  return jsonb_build_object('campaignId',p_campaign_id,'ready',ready,'gates',gates);
end $$;

create or replace function public.revenue_launch_campaign(p_campaign_id uuid,p_actor_id uuid default null,p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c record;r jsonb;m record;enrollment jsonb;scheduled integer:=0;enrolled integer:=0;skipped integer:=0;errors jsonb:='[]'::jsonb;
begin
  select * into c from public.revenue_campaigns where id=p_campaign_id for update;
  if not found then raise exception 'Campaign not found.'; end if;
  if c.status in ('active','launching') then return jsonb_build_object('campaignId',p_campaign_id,'status',c.status,'idempotentReplay',true); end if;
  r:=public.revenue_evaluate_campaign_readiness(p_campaign_id,p_actor_id);
  if coalesce((r->>'ready')::boolean,false)=false then raise exception 'Campaign readiness is blocked.'; end if;
  if c.approval_status not in ('approved','approved_with_limits') and not exists(select 1 from public.revenue_campaign_approvals where campaign_id=p_campaign_id and status in ('approved','approved_with_limits')) then raise exception 'Approved launch decision required.'; end if;
  for m in
    select * from public.revenue_campaign_audience_members
    where snapshot_id=c.audience_snapshot_id and campaign_id=p_campaign_id and eligibility_status='eligible'
    order by created_at,id
  loop
    begin
      enrollment:=public.revenue_enroll_campaign_recipient(p_campaign_id,m.prospect_id,m.contact_id,null,coalesce(nullif(m.channel,''),'email'),m.contact_value,coalesce(c.sdr_lead,c.owner,'SDR'),p_actor_id,
        coalesce(nullif(p_idempotency_key,''),'launch-'||p_campaign_id::text)||':'||m.id::text);
      if coalesce((enrollment->>'idempotentReplay')::boolean,false) then skipped:=skipped+1; else enrolled:=enrolled+1; end if;
    exception when others then
      skipped:=skipped+1;
      errors:=errors||jsonb_build_array(jsonb_build_object('audienceMemberId',m.id,'error',sqlerrm));
    end;
  end loop;
  if not exists(select 1 from public.revenue_campaign_recipients where campaign_id=p_campaign_id and status not in ('removed','invalid')) then
    raise exception 'Campaign launch produced no eligible enrollment.';
  end if;
  update public.revenue_campaigns set status='active',launch_at=coalesce(launch_at,now()),updated_by=p_actor_id,updated_at=now() where id=p_campaign_id;
  update public.revenue_campaign_step_executions set status='scheduled',updated_by=p_actor_id,updated_at=now() where campaign_id=p_campaign_id and status='prepared';
  get diagnostics scheduled=row_count;
  insert into public.revenue_campaign_status_history(campaign_id,event_type,title,from_status,to_status,payload,result,actor_id)
  values(p_campaign_id,'campaign_launched','Campagne lancée',c.status,'active',jsonb_build_object('idempotencyKey',p_idempotency_key),jsonb_build_object('enrolledRecipients',enrolled,'skippedRecipients',skipped,'scheduledExecutions',scheduled,'errors',errors),p_actor_id);
  return jsonb_build_object('campaignId',p_campaign_id,'status','active','enrolledRecipients',enrolled,'skippedRecipients',skipped,'scheduledExecutions',scheduled,'errors',errors,'idempotentReplay',false);
end $$;

create or replace function public.revenue_dispatch_campaign_step(p_execution_id uuid,p_provider text default 'manual',p_provider_message_id text default null,p_actor_id uuid default null,p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare x record;r record;c record;s record;tv record;existing record;comm record;attempt record;v_thread_id uuid;v_key text;v_status text;v_external boolean;
begin
  select * into x from public.revenue_campaign_step_executions where id=p_execution_id for update;
  if not found then raise exception 'Step execution not found.'; end if;
  select * into r from public.revenue_campaign_recipients where id=x.campaign_recipient_id for update;
  select * into c from public.revenue_campaigns where id=x.campaign_id for share;
  select * into s from public.revenue_campaign_sequence_steps where id=x.sequence_step_id and status='approved';
  if not found then raise exception 'Approved sequence step not found.'; end if;
  if s.template_version_id is not null then select * into tv from public.revenue_campaign_template_versions where id=s.template_version_id and status='approved'; end if;
  if c.status<>'active' or c.emergency_stopped then raise exception 'Campaign is not dispatchable.'; end if;
  if exists(select 1 from public.revenue_campaign_suppressions q where q.status='active' and (q.expires_at is null or q.expires_at>now()) and (q.campaign_id is null or q.campaign_id=c.id) and (q.channel='all' or q.channel=coalesce(x.channel,r.channel)) and (q.prospect_id=r.prospect_id or q.contact_id=r.contact_id or q.contact_value_normalized=r.contact_value_normalized)) then raise exception 'Recipient is suppressed.'; end if;
  v_key:=coalesce(nullif(p_idempotency_key,''),'dispatch:'||p_execution_id::text);
  select * into existing from public.revenue_campaign_dispatch_attempts where idempotency_key=v_key for update;
  v_external:=nullif(p_provider_message_id,'') is not null;
  v_status:=case when v_external then 'provider_accepted' else 'prepared' end;
  if found then
    if existing.status='prepared' and v_external then
      update public.revenue_campaign_dispatch_attempts set provider=coalesce(nullif(p_provider,''),provider),provider_message_id=p_provider_message_id,status='provider_accepted',provider_accepted_at=now(),metadata=metadata||jsonb_build_object('confirmedBy',p_actor_id,'confirmedAt',now()) where id=existing.id returning * into existing;
      update public.revenue_communication_events set provider=coalesce(nullif(p_provider,''),provider),provider_message_id=p_provider_message_id,status='provider_accepted',updated_at=now() where id=existing.communication_event_id;
      update public.revenue_campaign_step_executions set status='provider_accepted',attempt_count=attempt_count+1,started_at=coalesce(started_at,now()),updated_by=p_actor_id,updated_at=now() where id=x.id;
      update public.revenue_campaign_recipients set status='contacted',first_contact_at=coalesce(first_contact_at,now()),last_action_at=now(),updated_by=p_actor_id,updated_at=now() where id=r.id;
      return jsonb_build_object('dispatchAttemptId',existing.id,'communicationEventId',existing.communication_event_id,'status','provider_accepted','externalSendConfirmed',true,'idempotentReplay',false,'preparedUpgraded',true);
    end if;
    return jsonb_build_object('dispatchAttemptId',existing.id,'communicationEventId',existing.communication_event_id,'status',existing.status,'externalSendConfirmed',existing.status in ('provider_accepted','sent','delivered'),'idempotentReplay',true);
  end if;
  v_thread_id:=r.communication_thread_id;
  if v_thread_id is not null and not exists(select 1 from public.revenue_communication_threads where id=v_thread_id) then v_thread_id:=null; end if;
  if v_thread_id is null then
    insert into public.revenue_communication_threads(subject,channel_scope,status,prospect_id,account_id,contact_id,owner_id,owner_name,metadata)
    values('Campagne — '||coalesce(r.display_name,c.name),coalesce(x.channel,r.channel),'open',r.prospect_id,r.account_id,r.contact_id,p_actor_id,coalesce(x.owner,c.owner,'Revenue Command'),jsonb_build_object('campaign_id',c.id,'campaign_recipient_id',r.id)) returning id into v_thread_id;
    update public.revenue_campaign_recipients set communication_thread_id=v_thread_id,updated_by=p_actor_id,updated_at=now() where id=r.id;
  end if;
  insert into public.revenue_communication_events(thread_id,campaign_id,campaign_recipient_id,campaign_sequence_version_id,campaign_step_id,prospect_id,account_id,contact_id,direction,channel,provider,provider_message_id,sender,recipients,subject,body_summary,content,occurred_at,status,owner_id,owner_name,metadata)
  values(v_thread_id,c.id,r.id,r.current_sequence_version_id,s.id,r.prospect_id,r.account_id,r.contact_id,'outbound',coalesce(x.channel,r.channel),coalesce(nullif(p_provider,''),'manual'),coalesce(p_provider_message_id,''),coalesce(x.owner,c.owner,'Revenue Command'),jsonb_build_array(r.contact_value),coalesce(tv.subject,''),coalesce(tv.body,s.step_type),jsonb_build_object('stepType',s.step_type,'stepOrder',s.step_order,'templateVersionId',s.template_version_id),now(),v_status,p_actor_id,coalesce(x.owner,c.owner,'Revenue Command'),jsonb_build_object('campaign_id',c.id,'recipient_id',r.id,'execution_id',x.id)) returning * into comm;
  insert into public.revenue_campaign_dispatch_attempts(campaign_id,campaign_recipient_id,step_execution_id,communication_event_id,provider,provider_message_id,status,idempotency_key,provider_accepted_at,created_by)
  values(c.id,r.id,x.id,comm.id,coalesce(nullif(p_provider,''),'manual'),p_provider_message_id,v_status,v_key,case when v_external then now() else null end,p_actor_id) returning * into attempt;
  update public.revenue_campaign_step_executions set status=v_status,attempt_count=attempt_count+1,started_at=case when v_external then coalesce(started_at,now()) else started_at end,updated_by=p_actor_id,updated_at=now() where id=x.id;
  if v_external then update public.revenue_campaign_recipients set status='contacted',first_contact_at=coalesce(first_contact_at,now()),last_action_at=now(),updated_by=p_actor_id,updated_at=now() where id=r.id; end if;
  return jsonb_build_object('dispatchAttemptId',attempt.id,'communicationEventId',comm.id,'status',v_status,'externalSendConfirmed',v_external,'idempotentReplay',false);
end $$;

create or replace function public.revenue_record_campaign_provider_event(
  p_communication_event_id uuid,p_event_type text,p_provider text default 'manual',p_provider_event_id text default null,
  p_occurred_at timestamptz default null,p_details jsonb default '{}'::jsonb,p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare comm record;attempt record;delivery record;v_time timestamptz:=coalesce(p_occurred_at,now());v_terminal boolean;v_contacted boolean;
begin
  select * into comm from public.revenue_communication_events where id=p_communication_event_id for update;
  if not found then raise exception 'Communication event not found.'; end if;
  if nullif(p_provider_event_id,'') is not null then
    select d.* into delivery from public.revenue_communication_delivery_events d where d.provider=p_provider and d.provider_event_id=p_provider_event_id limit 1;
    if found then return jsonb_build_object('deliveryEventId',delivery.id,'communicationEventId',comm.id,'status',delivery.event_type,'idempotentReplay',true); end if;
  end if;
  insert into public.revenue_communication_delivery_events(communication_event_id,event_type,provider,provider_event_id,occurred_at,details,metadata)
  values(comm.id,p_event_type,coalesce(nullif(p_provider,''),'manual'),coalesce(p_provider_event_id,''),v_time,coalesce(p_details,'{}'::jsonb),jsonb_build_object('campaign_id',comm.campaign_id,'actor_id',p_actor_id)) returning * into delivery;
  update public.revenue_communication_events set status=p_event_type,provider=coalesce(nullif(p_provider,''),provider),provider_message_id=coalesce(nullif(p_provider_event_id,''),provider_message_id),updated_at=now() where id=comm.id;
  select * into attempt from public.revenue_campaign_dispatch_attempts where communication_event_id=comm.id order by created_at desc limit 1 for update;
  v_contacted:=p_event_type in ('provider_accepted','sent','delivered');
  v_terminal:=p_event_type in ('delivered','hard_bounce','provider_rejected','failed');
  if found then
    update public.revenue_campaign_dispatch_attempts set status=p_event_type,provider_message_id=coalesce(nullif(p_provider_event_id,''),provider_message_id),completed_at=case when v_terminal then v_time else completed_at end,metadata=metadata||jsonb_build_object('lastProviderEvent',p_event_type,'lastProviderEventAt',v_time) where id=attempt.id;
    update public.revenue_campaign_step_executions set status=p_event_type,completed_at=case when v_terminal then v_time else completed_at end,last_error=case when p_event_type in ('hard_bounce','provider_rejected','failed') then coalesce(p_details->>'message',p_event_type) else last_error end,updated_by=p_actor_id,updated_at=now() where id=attempt.step_execution_id;
  end if;
  if v_contacted and comm.campaign_recipient_id is not null then update public.revenue_campaign_recipients set status='contacted',first_contact_at=coalesce(first_contact_at,v_time),last_action_at=v_time,updated_by=p_actor_id,updated_at=now() where id=comm.campaign_recipient_id; end if;
  if p_event_type='hard_bounce' and comm.campaign_recipient_id is not null then
    update public.revenue_campaign_recipients set status='invalid',last_action_at=v_time,updated_by=p_actor_id,updated_at=now() where id=comm.campaign_recipient_id;
    update public.revenue_campaign_enrollments set status='terminated',paused_at=v_time,exit_reason='hard_bounce',updated_by=p_actor_id,updated_at=now() where campaign_recipient_id=comm.campaign_recipient_id and status in ('active','paused');
    update public.revenue_campaign_step_executions set status='cancelled',last_error='hard_bounce',updated_by=p_actor_id,updated_at=now() where campaign_recipient_id=comm.campaign_recipient_id and status in ('scheduled','due','prepared','manual_review');
    insert into public.revenue_campaign_suppressions(campaign_id,prospect_id,contact_id,contact_value_normalized,channel,scope,reason,status,source_event_id,created_by)
    select null,r.prospect_id,r.contact_id,r.contact_value_normalized,coalesce(comm.channel,'email'),'channel','hard_bounce','active',comm.id,p_actor_id
    from public.revenue_campaign_recipients r where r.id=comm.campaign_recipient_id
      and not exists(select 1 from public.revenue_campaign_suppressions q where q.status='active' and q.source_event_id=comm.id);
  end if;
  return jsonb_build_object('deliveryEventId',delivery.id,'communicationEventId',comm.id,'status',p_event_type,'idempotentReplay',false);
end $$;

create or replace function public.revenue_process_campaign_reply(p_campaign_recipient_id uuid,p_channel text,p_classification text,p_message text default null,p_provider_message_id text default null,p_actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r record;comm record;reply record;v_thread_id uuid;v_qualifying boolean;v_opt_out boolean;v_review boolean;v_status text;
begin
  select * into r from public.revenue_campaign_recipients where id=p_campaign_recipient_id for update;
  if not found then raise exception 'Campaign recipient not found.'; end if;
  v_qualifying:=p_classification in ('positive_interest','meeting_request','information_request','referral_contact');
  v_opt_out:=p_classification='opt_out';v_review:=p_classification in ('complaint','invalid_response','needs_human_review');
  v_thread_id:=r.communication_thread_id;
  if v_thread_id is not null and not exists(select 1 from public.revenue_communication_threads where id=v_thread_id) then v_thread_id:=null; end if;
  if v_thread_id is null then
    insert into public.revenue_communication_threads(subject,channel_scope,status,prospect_id,account_id,contact_id,owner_id,owner_name,metadata)
    values('Réponse campagne — '||coalesce(r.display_name,r.contact_value,'Destinataire'),p_channel,'open',r.prospect_id,r.account_id,r.contact_id,p_actor_id,coalesce(r.owner,'SDR'),jsonb_build_object('campaign_id',r.campaign_id,'campaign_recipient_id',r.id)) returning id into v_thread_id;
    update public.revenue_campaign_recipients set communication_thread_id=v_thread_id,updated_by=p_actor_id,updated_at=now() where id=r.id;
  end if;
  insert into public.revenue_communication_events(thread_id,campaign_id,campaign_recipient_id,prospect_id,account_id,contact_id,direction,channel,provider,provider_message_id,sender,recipients,subject,body_summary,content,occurred_at,status,outcome,owner_id,owner_name,metadata)
  values(v_thread_id,r.campaign_id,r.id,r.prospect_id,r.account_id,r.contact_id,'inbound',p_channel,'external',coalesce(p_provider_message_id,''),r.contact_value,'[]'::jsonb,'Réponse campagne',coalesce(p_message,''),jsonb_build_object('classification',p_classification),now(),'received',p_classification,p_actor_id,coalesce(r.owner,'SDR'),jsonb_build_object('campaign_id',r.campaign_id,'recipient_id',r.id)) returning * into comm;
  insert into public.revenue_campaign_replies(campaign_id,campaign_recipient_id,communication_event_id,channel,classification,message,provider_message_id,qualifying,opt_out,requires_human_review,follow_up_due_at,classified_by)
  values(r.campaign_id,r.id,comm.id,p_channel,p_classification,p_message,p_provider_message_id,v_qualifying,v_opt_out,v_review,case when v_qualifying or v_review then now()+interval '4 hours' else null end,p_actor_id) returning * into reply;
  v_status:=case when v_opt_out then 'opted_out' when v_qualifying then 'engaged' when p_classification='no_interest' then 'negative_response' else 'reply_received' end;
  update public.revenue_campaign_recipients set status=v_status,last_reply_at=now(),last_action_at=now(),updated_by=p_actor_id,updated_at=now() where id=r.id;
  if v_qualifying or v_opt_out or p_classification in ('no_interest','existing_customer','wrong_contact','complaint') then
    update public.revenue_campaign_enrollments set status=case when v_opt_out then 'terminated' else 'paused' end,paused_at=now(),exit_reason=p_classification,updated_by=p_actor_id,updated_at=now() where campaign_recipient_id=r.id and status='active';
    update public.revenue_campaign_step_executions set status='cancelled',updated_by=p_actor_id,updated_at=now() where campaign_recipient_id=r.id and status in ('scheduled','due','prepared');
  end if;
  if v_opt_out then
    insert into public.revenue_campaign_suppressions(campaign_id,prospect_id,contact_id,contact_value_normalized,channel,scope,reason,status,source_event_id,created_by)
    values(null,r.prospect_id,r.contact_id,r.contact_value_normalized,p_channel,'channel','recipient_opt_out','active',comm.id,p_actor_id);
  end if;
  if v_qualifying or v_review then
    insert into public.revenue_campaign_sdr_assignments(campaign_id,campaign_recipient_id,assignment_type,owner,status,priority,due_at,objective,source_reply_id,created_by)
    values(r.campaign_id,r.id,case when v_review then 'human_review' else 'qualified_follow_up' end,coalesce(r.owner,'SDR'),'open',case when p_classification in ('meeting_request','complaint') then 'critical' else 'high' end,now()+interval '4 hours','Traiter la réponse et sécuriser la prochaine décision.',reply.id,p_actor_id);
  end if;
  return jsonb_build_object('replyId',reply.id,'communicationEventId',comm.id,'classification',p_classification,'recipientStatus',v_status,'futureStepsStopped',v_qualifying or v_opt_out or p_classification in ('no_interest','existing_customer','wrong_contact','complaint'));
end $$;

create or replace function public.revenue_create_campaign_attribution(
  p_campaign_id uuid,p_campaign_recipient_id uuid default null,p_event_type text default null,p_event_id text default null,
  p_attribution_model text default 'rules_primary_source',p_attribution_share numeric default 100,p_attributed_value numeric default 0,
  p_evidence_reference text default null,p_override_reason text default null,p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  existing_share numeric:=0;partner_share numeric:=0;event_value numeric:=0;event_time timestamptz;
  campaign_start timestamptz;window_days integer;event_opportunity_id uuid;event_contract_id uuid;
  lineage_ok boolean:=false;recipient record;attr record;conflict record;
  attr_sequence_version_id uuid;attr_channel text;attr_sdr_owner text;
begin
  if nullif(p_event_type,'') is null or nullif(p_event_id,'') is null then raise exception 'Attribution event is required.'; end if;
  if nullif(p_evidence_reference,'') is null then raise exception 'Attribution evidence is required.'; end if;
  if p_attribution_share<=0 or p_attribution_share>100 then raise exception 'Attribution share must be between 0 and 100.'; end if;
  select coalesce(launch_at,created_at),attribution_window_days into campaign_start,window_days from public.revenue_campaigns where id=p_campaign_id;
  if not found then raise exception 'Campaign not found.'; end if;
  if p_campaign_recipient_id is not null then
    select * into recipient from public.revenue_campaign_recipients where id=p_campaign_recipient_id and campaign_id=p_campaign_id;
    if not found then raise exception 'Campaign recipient does not belong to the campaign.'; end if;
    attr_sequence_version_id:=recipient.current_sequence_version_id;attr_channel:=recipient.channel;attr_sdr_owner:=recipient.owner;
  end if;
  if p_event_type='reply' then
    select occurred_at into event_time from public.revenue_campaign_replies where id::text=p_event_id and campaign_id=p_campaign_id;
    lineage_ok:=event_time is not null;
  elsif p_event_type='meeting_created' then
    select created_at into event_time from public.revenue_appointments where id::text=p_event_id;
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and event_type='meeting_created' and target_entity_id=p_event_id);
  elsif p_event_type='opportunity_created' then
    select created_at,id into event_time,event_opportunity_id from public.revenue_opportunities where id::text=p_event_id;
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and event_type='opportunity_created' and target_entity_id=p_event_id);
  elsif p_event_type='proposal_created' then
    select created_at,opportunity_id into event_time,event_opportunity_id from public.revenue_proposals where id::text=p_event_id;
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and ((event_type='proposal_created' and target_entity_id=p_event_id) or (event_type='opportunity_created' and target_entity_id=event_opportunity_id::text)));
  elsif p_event_type='contract_signed' then
    select created_at,opportunity_id,id into event_time,event_opportunity_id,event_contract_id from public.revenue_contracts where id::text=p_event_id;
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and ((event_type='contract_signed' and target_entity_id=p_event_id) or (event_type='opportunity_created' and target_entity_id=event_opportunity_id::text)));
  elsif p_event_type='payment_confirmed' then
    select pc.created_at,pc.contract_id,c.opportunity_id into event_time,event_contract_id,event_opportunity_id
    from public.revenue_payment_confirmations pc join public.revenue_contracts c on c.id=pc.contract_id where pc.id::text=p_event_id;
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and ((event_type='payment_confirmed' and target_entity_id=p_event_id) or (event_type='contract_signed' and target_entity_id=event_contract_id::text) or (event_type='opportunity_created' and target_entity_id=event_opportunity_id::text)));
  elsif p_event_type='revenue_realized' then
    select r.amount,r.realized_at,r.contract_id,c.opportunity_id into event_value,event_time,event_contract_id,event_opportunity_id
    from public.revenue_realization_events r join public.revenue_contracts c on c.id=r.contract_id
    where r.id::text=p_event_id and r.status in ('realized','partially_realized');
    lineage_ok:=exists(select 1 from public.revenue_campaign_conversion_events where campaign_id=p_campaign_id and ((event_type='revenue_realized' and target_entity_id=p_event_id) or (event_type='contract_signed' and target_entity_id=event_contract_id::text) or (event_type='opportunity_created' and target_entity_id=event_opportunity_id::text)));
  else raise exception 'Unsupported attribution event type.'; end if;
  if event_time is null then raise exception 'Canonical attribution event not found.'; end if;
  if not lineage_ok and nullif(p_override_reason,'') is null then
    insert into public.revenue_campaign_attribution_conflicts(campaign_id,campaign_recipient_id,conflict_type,description,event_type,event_id,value_at_risk_mad,status,created_by)
    values(p_campaign_id,p_campaign_recipient_id,'lineage_unproven','The canonical event has no verified campaign conversion lineage.',p_event_type,p_event_id,greatest(p_attributed_value,event_value),'open',p_actor_id) returning * into conflict;
    return jsonb_build_object('status','conflict','conflictId',conflict.id,'conflictType',conflict.conflict_type,'attributionCreated',false);
  end if;
  if event_time<campaign_start or event_time>campaign_start+make_interval(days=>greatest(1,window_days)) then
    insert into public.revenue_campaign_attribution_conflicts(campaign_id,campaign_recipient_id,conflict_type,description,event_type,event_id,value_at_risk_mad,status,created_by)
    values(p_campaign_id,p_campaign_recipient_id,'outside_window','The commercial event is outside the campaign attribution window.',p_event_type,p_event_id,greatest(p_attributed_value,event_value),'open',p_actor_id) returning * into conflict;
    return jsonb_build_object('status','conflict','conflictId',conflict.id,'conflictType',conflict.conflict_type,'attributionCreated',false);
  end if;
  select coalesce(sum(attribution_share),0) into existing_share from public.revenue_campaign_attributions where event_type=p_event_type and event_id=p_event_id and status in ('active','confirmed','attributed');
  if to_regclass('public.revenue_partner_referral_attributions') is not null then
    select coalesce(sum(attribution_share),0) into partner_share from public.revenue_partner_referral_attributions where event_type=replace(p_event_type,'meeting_created','meeting_completed') and event_id=p_event_id and status in ('active','confirmed','attributed');
  end if;
  if existing_share+partner_share+p_attribution_share>100 then
    insert into public.revenue_campaign_attribution_conflicts(campaign_id,campaign_recipient_id,conflict_type,description,competing_source_type,event_type,event_id,value_at_risk_mad,status,created_by)
    values(p_campaign_id,p_campaign_recipient_id,'over_allocation','Campaign and partner attribution would exceed 100%.','campaign_or_partner',p_event_type,p_event_id,greatest(p_attributed_value,event_value),'open',p_actor_id) returning * into conflict;
    return jsonb_build_object('status','conflict','conflictId',conflict.id,'conflictType',conflict.conflict_type,'campaignShare',existing_share,'partnerShare',partner_share,'requestedShare',p_attribution_share,'attributionCreated',false);
  end if;
  insert into public.revenue_campaign_attributions(campaign_id,campaign_recipient_id,sequence_version_id,channel,sdr_owner,event_type,event_id,attribution_model,attribution_share,attributed_value,currency,event_timestamp,evidence_reference,status,override_reason,created_by)
  values(p_campaign_id,p_campaign_recipient_id,attr_sequence_version_id,attr_channel,attr_sdr_owner,p_event_type,p_event_id,p_attribution_model,p_attribution_share,case when p_event_type='revenue_realized' and p_attributed_value=0 then event_value*(p_attribution_share/100.0) else greatest(0,p_attributed_value) end,'MAD',event_time,p_evidence_reference,'active',nullif(p_override_reason,''),p_actor_id) returning * into attr;
  return jsonb_build_object('status','attributed','attributionId',attr.id,'eventType',p_event_type,'eventId',p_event_id,'share',attr.attribution_share,'value',attr.attributed_value,'partnerShare',partner_share,'totalShare',existing_share+partner_share+attr.attribution_share,'lineageVerified',lineage_ok,'overrideApplied',nullif(p_override_reason,'') is not null);
end $$;

create or replace function public.revenue_close_campaign_performance_period(p_period_id uuid,p_actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p record;enrolled integer;contacted integer;replies integer;positive integer;meetings integer;opportunities integer;contracts integer;realized numeric;confirmed_cost numeric;v_metrics jsonb;v_economics jsonb;v_scorecard jsonb;
begin
  select * into p from public.revenue_campaign_performance_periods where id=p_period_id for update;
  if not found then raise exception 'Performance period not found.'; end if;
  if p.status='closed' then return jsonb_build_object('periodId',p.id,'status','closed','idempotentReplay',true,'metrics',p.metrics,'economics',p.economics); end if;
  select count(*) into enrolled from public.revenue_campaign_recipients where campaign_id=p.campaign_id and created_at>=p.starts_at and (p.ends_at is null or created_at<=p.ends_at);
  select count(*) into contacted from public.revenue_campaign_recipients where campaign_id=p.campaign_id and first_contact_at>=p.starts_at and (p.ends_at is null or first_contact_at<=p.ends_at);
  select count(*),count(*) filter(where classification in ('positive_interest','meeting_request','information_request')) into replies,positive from public.revenue_campaign_replies where campaign_id=p.campaign_id and occurred_at>=p.starts_at and (p.ends_at is null or occurred_at<=p.ends_at);
  select count(*) filter(where event_type='meeting_created'),count(*) filter(where event_type='opportunity_created'),count(*) filter(where event_type='contract_signed') into meetings,opportunities,contracts from public.revenue_campaign_conversion_events where campaign_id=p.campaign_id and occurred_at>=p.starts_at and (p.ends_at is null or occurred_at<=p.ends_at);
  select coalesce(sum(attributed_value),0) into realized from public.revenue_campaign_attributions where campaign_id=p.campaign_id and event_type='revenue_realized' and status in ('active','confirmed','attributed') and created_at>=p.starts_at and (p.ends_at is null or created_at<=p.ends_at);
  select coalesce(sum(amount_mad),0) into confirmed_cost from public.revenue_campaign_costs where campaign_id=p.campaign_id and cost_state='confirmed' and occurred_on>=p.starts_at::date and (p.ends_at is null or occurred_on<=p.ends_at::date);
  v_metrics:=jsonb_build_object('enrolled',enrolled,'contacted',contacted,'replies',replies,'positiveReplies',positive,'meetings',meetings,'opportunities',opportunities,'contracts',contracts,'replyRate',case when contacted>0 then round(replies::numeric/contacted*100,2) else 0 end,'meetingRate',case when replies>0 then round(meetings::numeric/replies*100,2) else 0 end);
  v_economics:=jsonb_build_object('realizedRevenueMad',realized,'confirmedCostMad',confirmed_cost,'returnPercent',case when confirmed_cost>0 then round((realized-confirmed_cost)/confirmed_cost*100,2) else null end);
  v_scorecard:=jsonb_build_object('commercialScore',least(100,coalesce((positive*5+meetings*10+opportunities*15+contracts*25),0)),'deliverabilityRisk',case when exists(select 1 from public.revenue_campaign_dispatch_attempts where campaign_id=p.campaign_id and status in ('hard_bounce','provider_rejected','failed')) then 'review' else 'clear' end,'attributionConflicts',(select count(*) from public.revenue_campaign_attribution_conflicts where campaign_id=p.campaign_id and status='open'));
  update public.revenue_campaign_performance_periods set metrics=v_metrics,economics=v_economics,scorecard=v_scorecard,status='closed',closed_by=p_actor_id,closed_at=now(),updated_at=now() where id=p.id;
  return jsonb_build_object('periodId',p.id,'status','closed','metrics',v_metrics,'economics',v_economics,'scorecard',v_scorecard,'idempotentReplay',false);
end $$;

create or replace function public.revenue_campaign_realization_reversal_v10()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='reversed' and (old.status is distinct from new.status) then
    update public.revenue_campaign_attributions set status='reversed',reversal_event_id=new.id,reversed_at=now()
    where event_type='revenue_realized'
      and event_id=coalesce(nullif(to_jsonb(new)->>'reversal_of_id',''),new.id::text)
      and status in ('active','confirmed','attributed');
  end if;
  return new;
end $$;
drop trigger if exists revenue_campaign_realization_reversal_v10 on public.revenue_realization_events;
create trigger revenue_campaign_realization_reversal_v10 after update of status on public.revenue_realization_events
for each row execute function public.revenue_campaign_realization_reversal_v10();

create or replace view public.revenue_campaign_command_view with (security_invoker=true) as
select c.*,
  (select count(*) from public.revenue_campaign_recipients r where r.campaign_id=c.id and r.status not in ('removed','invalid')) as recipient_count,
  (select count(*) from public.revenue_campaign_replies r where r.campaign_id=c.id) as reply_count,
  (select count(*) from public.revenue_campaign_replies r where r.campaign_id=c.id and r.classification in ('positive_interest','meeting_request','information_request')) as positive_reply_count,
  (select count(*) from public.revenue_campaign_attribution_conflicts x where x.campaign_id=c.id and x.status='open') as open_attribution_conflicts,
  (select coalesce(sum(a.attributed_value),0) from public.revenue_campaign_attributions a where a.campaign_id=c.id and a.event_type='revenue_realized' and a.status in ('active','confirmed','attributed')) as realized_revenue_mad,
  (select coalesce(sum(k.amount_mad),0) from public.revenue_campaign_costs k where k.campaign_id=c.id and k.cost_state='confirmed') as confirmed_cost_mad
from public.revenue_campaigns c;

create or replace view public.revenue_campaign_recipient_command_view with (security_invoker=true) as
select r.*,c.name as campaign_name,c.status as campaign_status,e.status as enrollment_status,e.current_step_order as enrollment_step_order,
  (select max(x.scheduled_at) from public.revenue_campaign_step_executions x where x.campaign_recipient_id=r.id and x.status in ('scheduled','due','overdue')) as next_step_at,
  (select count(*) from public.revenue_campaign_replies q where q.campaign_recipient_id=r.id) as reply_count
from public.revenue_campaign_recipients r join public.revenue_campaigns c on c.id=r.campaign_id
left join lateral (select * from public.revenue_campaign_enrollments z where z.campaign_recipient_id=r.id order by z.created_at desc limit 1) e on true;

create or replace view public.revenue_sdr_campaign_queue_view with (security_invoker=true) as
select x.id,x.campaign_id,x.campaign_recipient_id,x.enrollment_id,x.sequence_step_id,x.step_order,x.step_type,x.channel,x.owner,x.status,x.priority_score,x.scheduled_at,x.due_at,x.attempt_count,x.last_error,
  r.display_name,r.contact_value,r.prospect_id,r.contact_id,r.status as recipient_status,c.name as campaign_name,c.priority as campaign_priority
from public.revenue_campaign_step_executions x
join public.revenue_campaign_recipients r on r.id=x.campaign_recipient_id
join public.revenue_campaigns c on c.id=x.campaign_id
where x.status in ('scheduled','due','overdue','manual_review');

-- RLS and grants. APIs mutate through the authenticated server/service role; clients receive read-only access.
do $rls$
declare t text;p text;
begin
  foreach t in array array[
    'revenue_campaign_segments','revenue_campaign_segment_versions','revenue_campaign_audience_snapshots','revenue_campaign_audience_members',
    'revenue_campaign_recipient_eligibility','revenue_campaign_recipients','revenue_campaign_suppressions','revenue_campaign_frequency_decisions',
    'revenue_campaign_sequences','revenue_campaign_sequence_versions','revenue_campaign_sequence_steps','revenue_campaign_sequence_branches',
    'revenue_campaign_templates','revenue_campaign_template_versions','revenue_campaign_enrollments','revenue_campaign_step_executions',
    'revenue_campaign_dispatch_attempts','revenue_campaign_replies','revenue_campaign_sdr_assignments','revenue_campaign_provider_readiness',
    'revenue_campaign_sender_readiness','revenue_campaign_approvals','revenue_campaign_risks','revenue_campaign_evidence',
    'revenue_campaign_status_history','revenue_campaign_conversion_events','revenue_campaign_attributions','revenue_campaign_attribution_conflicts',
    'revenue_campaign_costs','revenue_campaign_performance_periods','revenue_campaign_experiments','revenue_campaign_experiment_variants',
    'revenue_campaign_recovery_plans','revenue_campaign_recovery_checkpoints'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    p:=t||'_service_role_all_v10';
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname=p) then
      execute format('create policy %I on public.%I for all to service_role using (true) with check (true)',p,t);
    end if;
    p:=t||'_authenticated_read_v10';
    if exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname=p) then
      execute format('drop policy %I on public.%I',p,t);
    end if;
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end
$rls$;

revoke all on public.revenue_campaign_command_view,public.revenue_campaign_recipient_command_view,public.revenue_sdr_campaign_queue_view from anon,authenticated;
grant select on public.revenue_campaign_command_view,public.revenue_campaign_recipient_command_view,public.revenue_sdr_campaign_queue_view to service_role;
revoke execute on function public.revenue_evaluate_campaign_recipient(uuid,text,uuid,text,text,uuid) from public,authenticated;
revoke execute on function public.revenue_freeze_campaign_audience(uuid,uuid,uuid,text,jsonb,jsonb,uuid) from public,authenticated;
revoke execute on function public.revenue_enroll_campaign_recipient(uuid,text,uuid,uuid,text,text,text,uuid,text) from public,authenticated;
revoke execute on function public.revenue_approve_campaign_sequence(uuid,integer,uuid) from public,authenticated;
revoke execute on function public.revenue_evaluate_campaign_readiness(uuid,uuid) from public,authenticated;
revoke execute on function public.revenue_launch_campaign(uuid,uuid,text) from public,authenticated;
revoke execute on function public.revenue_dispatch_campaign_step(uuid,text,text,uuid,text) from public,authenticated;
revoke execute on function public.revenue_record_campaign_provider_event(uuid,text,text,text,timestamptz,jsonb,uuid) from public,authenticated;
revoke execute on function public.revenue_process_campaign_reply(uuid,text,text,text,text,uuid) from public,authenticated;
revoke execute on function public.revenue_create_campaign_attribution(uuid,uuid,text,text,text,numeric,numeric,text,text,uuid) from public,authenticated;
revoke execute on function public.revenue_close_campaign_performance_period(uuid,uuid) from public,authenticated;
grant execute on function public.revenue_evaluate_campaign_recipient(uuid,text,uuid,text,text,uuid) to service_role;
grant execute on function public.revenue_freeze_campaign_audience(uuid,uuid,uuid,text,jsonb,jsonb,uuid) to service_role;
grant execute on function public.revenue_enroll_campaign_recipient(uuid,text,uuid,uuid,text,text,text,uuid,text) to service_role;
grant execute on function public.revenue_approve_campaign_sequence(uuid,integer,uuid) to service_role;
grant execute on function public.revenue_evaluate_campaign_readiness(uuid,uuid) to service_role;
grant execute on function public.revenue_launch_campaign(uuid,uuid,text) to service_role;
grant execute on function public.revenue_dispatch_campaign_step(uuid,text,text,uuid,text) to service_role;
grant execute on function public.revenue_record_campaign_provider_event(uuid,text,text,text,timestamptz,jsonb,uuid) to service_role;
grant execute on function public.revenue_process_campaign_reply(uuid,text,text,text,text,uuid) to service_role;
grant execute on function public.revenue_create_campaign_attribution(uuid,uuid,text,text,text,numeric,numeric,text,text,uuid) to service_role;
grant execute on function public.revenue_close_campaign_performance_period(uuid,uuid) to service_role;

commit;
