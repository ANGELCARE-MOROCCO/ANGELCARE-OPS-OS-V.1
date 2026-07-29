begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- AC CAPITAL OS ULTRA DEPARTMENT FINAL 09
-- Canonical lifecycle, institutional CRUD, versioning, durable orchestration,
-- executable agents, document artefacts, notifications and full traceability.
-- ============================================================================

-- Common lifecycle and optimistic-concurrency fields on canonical entities.
do $common_columns$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ac_capital_radar_sources',
    'ac_capital_radar_opportunities',
    'ac_capital_funders',
    'ac_capital_qualification_dossiers',
    'ac_capital_cases',
    'ac_capital_data_room_documents',
    'ac_capital_pipeline_records',
    'ac_capital_coordinator_tasks',
    'ac_capital_strategy_reports',
    'ac_capital_universal_approvals',
    'ac_capital_pipeline_outcomes',
    'ac_capital_doctrine_items'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I add column if not exists record_version bigint not null default 1', table_name);
      execute format('alter table public.%I add column if not exists lifecycle_status text', table_name);
      execute format('alter table public.%I add column if not exists archived_at timestamptz', table_name);
      execute format('alter table public.%I add column if not exists archived_by text', table_name);
      execute format('alter table public.%I add column if not exists archive_reason text', table_name);
      execute format('alter table public.%I add column if not exists merged_into_id uuid', table_name);
      execute format('alter table public.%I add column if not exists health_status text not null default ''healthy''', table_name);
      execute format('alter table public.%I add column if not exists last_integrity_check_at timestamptz', table_name);
      execute format('alter table public.%I add column if not exists last_automation_agent text', table_name);
      execute format('alter table public.%I add column if not exists last_automation_at timestamptz', table_name);
      execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', table_name);
    end if;
  end loop;
end
$common_columns$;

alter table public.ac_capital_orchestrator_workflows
  add column if not exists approval_id uuid,
  add column if not exists coordinator_task_id uuid;

create table if not exists public.ac_capital_record_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  version_no bigint not null,
  change_type text not null,
  snapshot jsonb not null default '{}'::jsonb,
  changed_fields text[] not null default '{}',
  actor text,
  reason text,
  source_workspace text,
  request_id text,
  created_at timestamptz not null default now(),
  unique(entity_type, entity_id, version_no)
);

create table if not exists public.ac_capital_record_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  note_type text not null default 'internal',
  body text not null,
  visibility text not null default 'internal',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_record_assignments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  assignment_type text not null default 'owner',
  assignee_id text,
  assignee_name text,
  status text not null default 'active',
  due_at timestamptz,
  assigned_by text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_saved_views (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null,
  name text not null,
  description text,
  query_state jsonb not null default '{}'::jsonb,
  visibility text not null default 'private',
  owner_id text,
  owner_name text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_key, owner_id, name)
);

create table if not exists public.ac_capital_runtime_leases (
  lease_key text primary key,
  holder text not null,
  acquired_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ac_capital_dead_letters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  error_code text,
  error_message text,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  status text not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  severity text not null default 'info',
  title text not null,
  message text,
  entity_type text,
  entity_id uuid,
  workspace_key text,
  action_href text,
  status text not null default 'unread',
  recipient_role text,
  recipient_id text,
  deduplication_key text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ac_capital_notifications_dedupe_uidx
  on public.ac_capital_notifications(deduplication_key)
  where deduplication_key is not null and status in ('unread','read');

create table if not exists public.ac_capital_agent_outputs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  capability text not null,
  workflow_id uuid,
  event_id uuid,
  entity_type text,
  entity_id uuid,
  provider_run_id uuid,
  doctrine_compilation_id uuid,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  confidence numeric(5,2),
  status text not null default 'draft-human-review',
  human_review_required boolean not null default true,
  reviewed_by text,
  reviewed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_agent_schedules (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null unique,
  enabled boolean not null default false,
  frequency_key text not null default 'daily',
  timezone text not null default 'Africa/Casablanca',
  schedule jsonb not null default '{}'::jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_status text,
  maximum_consecutive_failures integer not null default 4,
  consecutive_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_stage_gates (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null,
  from_stage text,
  to_stage text not null,
  gate_key text not null,
  label text not null,
  rule jsonb not null default '{}'::jsonb,
  blocking boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_key, gate_key)
);

create table if not exists public.ac_capital_stage_gate_evaluations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  workspace_key text not null,
  requested_stage text not null,
  passed boolean not null,
  evaluated_gates jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  evaluated_by text,
  evaluated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_type text not null,
  title text not null,
  entity_type text,
  entity_id uuid,
  workflow_id uuid,
  report_id uuid,
  status text not null default 'draft',
  lifecycle_status text default 'active',
  record_version bigint not null default 1,
  approval_status text not null default 'not-requested',
  current_version integer not null default 1,
  formats text[] not null default '{pdf,docx}',
  content_snapshot jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  evidence_references jsonb not null default '[]'::jsonb,
  confidentiality text not null default 'Confidential',
  generated_by text,
  generated_at timestamptz not null default now(),
  approved_version integer,
  approved_by text,
  approved_at timestamptz,
  immutable_snapshot_hash text,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  merged_into_id uuid,
  health_status text not null default 'healthy',
  last_integrity_check_at timestamptz,
  last_automation_agent text,
  last_automation_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ac_capital_artifacts
  add column if not exists lifecycle_status text default 'active',
  add column if not exists record_version bigint not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists archive_reason text,
  add column if not exists merged_into_id uuid,
  add column if not exists health_status text not null default 'healthy',
  add column if not exists last_integrity_check_at timestamptz,
  add column if not exists last_automation_agent text,
  add column if not exists last_automation_at timestamptz;

create table if not exists public.ac_capital_artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.ac_capital_artifacts(id) on delete cascade,
  version_no integer not null,
  format text not null,
  content_snapshot jsonb not null default '{}'::jsonb,
  sha256 text,
  byte_size bigint,
  output_reference text,
  status text not null default 'generated',
  generated_by text,
  generated_at timestamptz not null default now(),
  unique(artifact_id, version_no, format)
);

create table if not exists public.ac_capital_submission_proofs (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid,
  case_id uuid,
  coordinator_task_id uuid,
  approval_id uuid,
  submission_channel text,
  recipient text,
  submitted_at timestamptz,
  proof_reference text not null,
  proof_type text not null default 'manual-evidence',
  submitted_by text,
  status text not null default 'recorded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_command_results (
  id uuid primary key default gen_random_uuid(),
  command_key text not null,
  workspace_key text not null,
  actor text,
  request_id text,
  status text not null,
  summary text,
  records_created jsonb not null default '[]'::jsonb,
  records_updated jsonb not null default '[]'::jsonb,
  events_emitted jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ac_capital_record_versions_entity_idx on public.ac_capital_record_versions(entity_type, entity_id, version_no desc);
create index if not exists ac_capital_record_notes_entity_idx on public.ac_capital_record_notes(entity_type, entity_id, created_at desc);
create index if not exists ac_capital_assignments_entity_idx on public.ac_capital_record_assignments(entity_type, entity_id, status);
create index if not exists ac_capital_dead_letters_status_idx on public.ac_capital_dead_letters(status, last_failed_at desc);
create index if not exists ac_capital_notifications_recipient_idx on public.ac_capital_notifications(recipient_id, status, created_at desc);
create index if not exists ac_capital_agent_outputs_entity_idx on public.ac_capital_agent_outputs(entity_type, entity_id, created_at desc);
create index if not exists ac_capital_artifacts_entity_idx on public.ac_capital_artifacts(entity_type, entity_id, created_at desc);
create index if not exists ac_capital_artifact_versions_artifact_idx on public.ac_capital_artifact_versions(artifact_id, version_no desc);

-- Version and touch trigger. It is additive and only applied to canonical records.
create or replace function public.ac_capital_touch_and_version()
returns trigger
language plpgsql
as $function$
begin
  if tg_op = 'UPDATE' then
    new.record_version := coalesce(old.record_version, 1) + 1;
    if to_jsonb(new) ? 'updated_at' then
      new.updated_at := now();
    end if;
  end if;
  return new;
end
$function$;

create or replace function public.ac_capital_capture_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  payload jsonb := to_jsonb(new);
  id_value uuid;
  version_value bigint;
  changed text[] := '{}';
  key text;
begin
  id_value := (payload ->> 'id')::uuid;
  version_value := coalesce((payload ->> 'record_version')::bigint, 1);
  if tg_op = 'UPDATE' then
    for key in select jsonb_object_keys(payload) loop
      if (to_jsonb(old) -> key) is distinct from (payload -> key) then
        changed := array_append(changed, key);
      end if;
    end loop;
  end if;
  insert into public.ac_capital_record_versions(
    entity_type, entity_id, version_no, change_type, snapshot, changed_fields, source_workspace
  ) values (
    tg_table_name, id_value, version_value, lower(tg_op), payload, changed, tg_table_name
  ) on conflict (entity_type, entity_id, version_no) do nothing;
  return new;
end
$function$;

-- Database event bridge: every canonical mutation becomes an idempotent department event.
create or replace function public.ac_capital_emit_lifecycle_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  payload jsonb := to_jsonb(new);
  id_value uuid := (payload ->> 'id')::uuid;
  version_value text := coalesce(payload ->> 'record_version', payload ->> 'updated_at', payload ->> 'created_at', 'v1');
  event_name text;
  entity_name text := tg_argv[0];
  workspace_name text := tg_argv[1];
  base_event text := tg_argv[2];
  idempotency text;
begin
  -- Agent-authored updates are already represented by the originating event and
  -- agent output. Suppress only the update carrying a fresh automation marker,
  -- preventing self-triggering loops while allowing later human edits to emit.
  if coalesce(payload ->> 'last_automation_at', '') <> ''
     and (
       tg_op = 'INSERT'
       or coalesce(to_jsonb(old) ->> 'last_automation_at', '')
          is distinct from coalesce(payload ->> 'last_automation_at', '')
     ) then
    return new;
  end if;

  event_name := base_event || case when tg_op = 'INSERT' then '.created' else '.updated' end;

  if entity_name = 'source' and coalesce(payload ->> 'verification_status','') in ('validated','verified','official') then
    event_name := 'source.validated';
  elsif entity_name = 'qualification' and coalesce(payload ->> 'decision_label','') ~* 'pursue|approved|qualified' then
    event_name := 'qualification.approved';
  elsif entity_name = 'case' and coalesce(payload ->> 'status','') ~* 'ready|approval' then
    event_name := 'case.ready';
  elsif entity_name = 'approval' and coalesce(payload ->> 'status','') = 'approved' then
    event_name := 'approval.granted';
  elsif entity_name = 'outcome' then
    event_name := 'outcome.recorded';
  end if;

  idempotency := format('db:%s:%s:%s:%s', tg_table_name, id_value, event_name, version_value);

  insert into public.ac_capital_orchestrator_events(
    event_type, entity_type, entity_id, source_workspace, payload,
    idempotency_key, priority, status, available_at, created_by, updated_at
  ) values (
    event_name, entity_name, id_value, workspace_name,
    jsonb_build_object('record', payload, 'table', tg_table_name, 'operation', tg_op),
    idempotency,
    case when event_name in ('case.ready','approval.granted','outcome.recorded') then 'high' else 'normal' end,
    'queued', now(), 'database-event-bridge', now()
  ) on conflict (idempotency_key) do nothing;

  return new;
end
$function$;

-- Install common triggers safely.
do $install_triggers$
declare
  cfg record;
begin
  for cfg in
    select * from (values
      ('ac_capital_radar_sources','source','radar','source'),
      ('ac_capital_radar_opportunities','opportunity','radar','opportunity'),
      ('ac_capital_funders','funder','funders','funder'),
      ('ac_capital_qualification_dossiers','qualification','qualification','qualification'),
      ('ac_capital_cases','case','cases','case'),
      ('ac_capital_data_room_documents','document','data-room','document'),
      ('ac_capital_pipeline_records','pipeline','pipeline','pipeline'),
      ('ac_capital_universal_approvals','approval','approvals','approval'),
      ('ac_capital_coordinator_tasks','coordinator-task','coordinator','task'),
      ('ac_capital_pipeline_outcomes','outcome','pipeline','outcome'),
      ('ac_capital_doctrine_items','doctrine','doctrine','doctrine'),
      ('ac_capital_artifacts','artifact','artifacts','artifact')
    ) as rows(table_name, entity_type, workspace_key, event_prefix)
  loop
    if to_regclass('public.' || cfg.table_name) is not null then
      execute format('drop trigger if exists ac_capital_touch_version on public.%I', cfg.table_name);
      execute format('create trigger ac_capital_touch_version before update on public.%I for each row execute function public.ac_capital_touch_and_version()', cfg.table_name);
      execute format('drop trigger if exists ac_capital_capture_version on public.%I', cfg.table_name);
      execute format('create trigger ac_capital_capture_version after insert or update on public.%I for each row execute function public.ac_capital_capture_version()', cfg.table_name);
      execute format('drop trigger if exists ac_capital_lifecycle_event on public.%I', cfg.table_name);
      execute format('create trigger ac_capital_lifecycle_event after insert or update on public.%I for each row execute function public.ac_capital_emit_lifecycle_event(%L,%L,%L)', cfg.table_name, cfg.entity_type, cfg.workspace_key, cfg.event_prefix);
    end if;
  end loop;
end
$install_triggers$;

-- Stage gate catalogue.
insert into public.ac_capital_stage_gates(workspace_key, from_stage, to_stage, gate_key, label, rule, blocking)
values
  ('pipeline', null, 'Qualification', 'PIPELINE_QUALIFICATION_EXISTS', 'Qualification dossier exists', '{"requires":["qualification_dossier_id"]}', true),
  ('pipeline', null, 'Case Production', 'PIPELINE_CASE_EXISTS', 'Funding case exists', '{"requires":["case_id"]}', true),
  ('pipeline', null, 'Approval', 'PIPELINE_CASE_READY', 'Case readiness is sufficient', '{"minimumReadiness":60}', true),
  ('pipeline', null, 'Submission Ready', 'PIPELINE_APPROVAL_VALID', 'Exact case version is approved', '{"requiresApproval":true}', true),
  ('pipeline', null, 'Submitted', 'PIPELINE_SUBMISSION_PROOF', 'Submission proof is recorded', '{"requiresSubmissionProof":true}', true),
  ('case', null, 'Approval Ready', 'CASE_PROOF_READY', 'Required proof gaps are closed', '{"minimumDocumentReadiness":70}', true)
on conflict (workspace_key, gate_key) do update set
  label = excluded.label,
  rule = excluded.rule,
  blocking = excluded.blocking,
  active = true,
  updated_at = now();

-- Institutional agent contracts. All external actions remain prohibited.
insert into public.ac_capital_agent_registry(
  agent_key, agent_name, workspace_key, capability, description, enabled,
  automation_level, external_actions_allowed, provider_policy, trigger_events,
  action_permissions, retry_policy, updated_at
)
values
  ('capital-executive-orchestrator','Capital Executive Orchestrator','orchestrator','capital_orchestration','Coordinates the full internal capital lifecycle and pauses at human authority gates.',true,'internal-auto',false,'{"analysis":"openrouter/free","research":"tavily"}','{"source.validated","opportunity.created","qualification.approved","document.updated","case.ready","approval.granted","outcome.recorded"}','{"createInternalRecords":true,"moveInternalStages":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":60}',now()),
  ('funder-intelligence-agent','Funder Intelligence Agent','funders','funder_intelligence','Maintains living evidence-backed funder dossiers and relationship strategy.',true,'supervised-auto',false,'{"analysis":"openrouter/free","research":"tavily"}','{"funder.created","funder.updated","funder.refresh.requested"}','{"researchPublicSources":true,"updateFunderDossier":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":120}',now()),
  ('qualification-underwriter','AI Qualification Underwriter','qualification','opportunity_qualification','Performs evidence-backed underwriting, proof gaps and committee recommendations.',true,'internal-auto',false,'{"analysis":"openrouter/free"}','{"opportunity.created","opportunity.updated","opportunity.qualify.requested","document.updated"}','{"scoreOpportunity":true,"createProofGaps":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":60}',now()),
  ('funding-case-architect','AI Funding Case Architect','cases','case_drafting','Produces funder-specific case sections, financial narrative, impact and risk plans.',true,'supervised-auto',false,'{"analysis":"openrouter/free"}','{"qualification.approved","case.created","case.regenerate.requested"}','{"draftCase":true,"createInternalDocuments":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":90}',now()),
  ('data-room-proof-agent','Data Room Proof Agent','data-room','proof_intelligence','Matches proof requirements, identifies expiry and contradictions, and creates missions.',true,'internal-auto',false,'{"analysis":"openrouter/free"}','{"document.created","document.updated","proof.updated"}','{"analyzeSanitizedFacts":true,"createProofMissions":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":90}',now()),
  ('pipeline-intelligence-agent','Pipeline Intelligence Agent','pipeline','pipeline_intelligence','Detects stagnation, deadline risk, stage blockers and next-best internal actions.',true,'internal-auto',false,'{"analysis":"openrouter/free"}','{"pipeline.created","pipeline.updated","deadline.approaching","funder.response"}','{"recommendStage":true,"createInternalTasks":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":60}',now()),
  ('coordinator-mission-planner','Coordinator Mission Planner','coordinator','mission_preparation','Creates precise human execution packs after valid approval.',true,'supervised-auto',false,'{"analysis":"openrouter/free"}','{"approval.granted","coordinator-task.created","task.updated"}','{"prepareMission":true,"prepareCommunicationDraft":true,"externalActions":false}','{"maxAttempts":4,"backoffSeconds":60}',now()),
  ('executive-report-agent','Executive Reporting Agent','reports','executive_reporting','Composes evidence-bound reports and premium controlled artifacts.',true,'supervised-auto',false,'{"analysis":"openrouter/free"}','{"daily.close","weekly.close","report.requested","case.ready"}','{"composeReports":true,"generateArtifacts":true,"externalActions":false}','{"maxAttempts":3,"backoffSeconds":180}',now()),
  ('capital-learning-agent','Capital Learning Agent','learning','learning_analysis','Analyzes outcomes and proposes controlled doctrine and scoring improvements.',true,'supervised-auto',false,'{"analysis":"openrouter/free"}','{"outcome.recorded","case.closed","submission.failed"}','{"createLearningDrafts":true,"externalActions":false}','{"maxAttempts":3,"backoffSeconds":180}',now())
on conflict (agent_key) do update set
  agent_name = excluded.agent_name,
  workspace_key = excluded.workspace_key,
  capability = excluded.capability,
  description = excluded.description,
  enabled = excluded.enabled,
  automation_level = excluded.automation_level,
  external_actions_allowed = false,
  provider_policy = excluded.provider_policy,
  trigger_events = excluded.trigger_events,
  action_permissions = excluded.action_permissions,
  retry_policy = excluded.retry_policy,
  updated_at = now();

-- Runtime agent definitions consumed by the free-provider executor.
insert into public.ac_capital_ai_agents(
  agent_key, name, agent_name, description, purpose, category, status,
  search_provider_key, analysis_provider_key, trigger_mode, frequency_key,
  schedule, search_config, analysis_config, quota_config, action_permissions,
  prompt_doctrine, failure_policy, updated_at
)
values
  ('funder-intelligence-agent','Funder Intelligence Agent','Funder Intelligence Agent','Living public funder intelligence and positioning.','Maintain evidence-backed funder dossiers.','institutional-research','active','tavily','openrouter','both','weekly','{"days":[1],"hour":8,"minute":15}','{"maxSearchesPerRun":1,"maxResultsPerSearch":8,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":4200,"temperature":0.1}','{"maxRunsPerDay":5,"maxRunsPerWeek":20,"maxRunsPerMonth":80,"maxTavilyCreditsPerRun":1,"maxOpenRouterRequestsPerRun":2}','{"captureSources":true,"updateFunderDossier":true,"externalActions":false}','Research only authoritative public evidence. Build a living funder thesis, proof expectations and relationship strategy. Never perform outreach.','{"suspendAfterFailures":4}',now()),
  ('qualification-underwriter','AI Qualification Underwriter','AI Qualification Underwriter','Evidence-backed opportunity underwriting.','Score eligibility, fit, proof gaps and committee recommendations.','internal-analysis','active','tavily','openrouter','both','hourly','{"minute":15}','{"maxSearchesPerRun":1,"maxResultsPerSearch":6,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":5000,"temperature":0.1}','{"maxRunsPerDay":20,"maxRunsPerWeek":100,"maxRunsPerMonth":400,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"scoreOpportunity":true,"createProofGaps":true,"externalActions":false}','Apply AngelCare doctrine, hard eligibility checks and evidence-first scoring. Never invent facts.','{"suspendAfterFailures":4}',now()),
  ('funding-case-architect','AI Funding Case Architect','AI Funding Case Architect','Funder-specific funding case production.','Draft narratives, financial structure, impact, risks and proof packs.','internal-analysis','active','tavily','openrouter','both','hourly','{"minute":25}','{"maxSearchesPerRun":1,"maxResultsPerSearch":6,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":5500,"temperature":0.1}','{"maxRunsPerDay":15,"maxRunsPerWeek":75,"maxRunsPerMonth":300,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"draftCase":true,"createInternalDocuments":true,"externalActions":false}','Produce complete evidence-bound case structures. Missing figures become proof missions, never fabricated values.','{"suspendAfterFailures":4}',now()),
  ('data-room-proof-agent','Data Room Proof Agent','Data Room Proof Agent','Sanitized metadata proof intelligence.','Assess readiness, expiry, contradictions and missing evidence without exposing secrets.','internal-analysis','active','tavily','openrouter','both','daily','{"hour":7,"minute":30}','{"maxSearchesPerRun":1,"maxResultsPerSearch":5,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":3500,"temperature":0.1}','{"maxRunsPerDay":25,"maxRunsPerWeek":150,"maxRunsPerMonth":600,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"analyzeSanitizedFacts":true,"createProofMissions":true,"externalActions":false}','Analyze sanitized document metadata only. Raw confidential files must never leave AngelCare.','{"suspendAfterFailures":4}',now()),
  ('pipeline-intelligence-agent','Pipeline Intelligence Agent','Pipeline Intelligence Agent','Pipeline health and next-action intelligence.','Detect stagnation, deadlines, blockers and recovery actions.','internal-analysis','active','tavily','openrouter','both','daily','{"hour":8,"minute":0}','{"maxSearchesPerRun":1,"maxResultsPerSearch":5,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":3500,"temperature":0.1}','{"maxRunsPerDay":20,"maxRunsPerWeek":100,"maxRunsPerMonth":400,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"recommendStage":true,"createInternalTasks":true,"externalActions":false}','Recommend internal stage and next actions. Never claim a follow-up or submission occurred without proof.','{"suspendAfterFailures":4}',now()),
  ('coordinator-mission-planner','Coordinator Mission Planner','Coordinator Mission Planner','Human execution pack preparation.','Prepare exact mission, approved message, attachments, checklist and proof requirements.','internal-analysis','active','tavily','openrouter','both','hourly','{"minute":35}','{"maxSearchesPerRun":1,"maxResultsPerSearch":5,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":3800,"temperature":0.1}','{"maxRunsPerDay":20,"maxRunsPerWeek":100,"maxRunsPerMonth":400,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"prepareMission":true,"prepareCommunicationDraft":true,"externalActions":false}','Prepare execution-ready human instructions only after valid approval. Never send or submit.','{"suspendAfterFailures":4}',now()),
  ('executive-report-agent','Executive Reporting Agent','Executive Reporting Agent','Evidence-bound executive reporting and artifact composition.','Compose founder, board, bank, grant and case reports from approved records.','internal-analysis','active','tavily','openrouter','both','weekly','{"days":[5],"hour":17,"minute":0}','{"maxSearchesPerRun":1,"maxResultsPerSearch":5,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":5500,"temperature":0.1}','{"maxRunsPerDay":10,"maxRunsPerWeek":40,"maxRunsPerMonth":160,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"composeReports":true,"generateArtifacts":true,"externalActions":false}','Use only supplied approved AC Capital records. External release remains founder-controlled.','{"suspendAfterFailures":3}',now()),
  ('capital-learning-agent','Capital Learning Agent','Capital Learning Agent','Outcome and doctrine improvement analysis.','Analyze wins, losses, objections and proof friction; propose controlled improvements.','internal-analysis','active','tavily','openrouter','both','weekly','{"days":[5],"hour":18,"minute":0}','{"maxSearchesPerRun":1,"maxResultsPerSearch":5,"searchDepth":"basic","minimumSourceScore":0}','{"model":"openrouter/free","maxOutputTokens":3500,"temperature":0.1}','{"maxRunsPerDay":10,"maxRunsPerWeek":40,"maxRunsPerMonth":160,"maxTavilyCreditsPerRun":0,"maxOpenRouterRequestsPerRun":1}','{"createLearningDrafts":true,"externalActions":false}','Create draft learning proposals only. Never alter doctrine or scoring without approval.','{"suspendAfterFailures":3}',now())
on conflict (agent_key) do update set
  name=excluded.name, agent_name=excluded.agent_name, description=excluded.description,
  purpose=excluded.purpose, category=excluded.category, status='active',
  search_provider_key=excluded.search_provider_key, analysis_provider_key=excluded.analysis_provider_key,
  trigger_mode=excluded.trigger_mode, frequency_key=excluded.frequency_key,
  schedule=excluded.schedule, search_config=excluded.search_config,
  analysis_config=excluded.analysis_config, quota_config=excluded.quota_config,
  action_permissions=excluded.action_permissions, prompt_doctrine=excluded.prompt_doctrine,
  failure_policy=excluded.failure_policy, updated_at=now();

-- Seed durable schedules but keep them disabled until founder activation.
insert into public.ac_capital_agent_schedules(agent_key, enabled, frequency_key, timezone, schedule)
values
  ('capital-executive-orchestrator', true, 'hourly', 'Africa/Casablanca', '{"minute":5}'),
  ('funder-intelligence-agent', false, 'weekly', 'Africa/Casablanca', '{"days":[1],"hour":8,"minute":15}'),
  ('qualification-underwriter', false, 'hourly', 'Africa/Casablanca', '{"minute":15}'),
  ('funding-case-architect', false, 'hourly', 'Africa/Casablanca', '{"minute":25}'),
  ('data-room-proof-agent', false, 'daily', 'Africa/Casablanca', '{"hour":7,"minute":30}'),
  ('pipeline-intelligence-agent', false, 'daily', 'Africa/Casablanca', '{"hour":8,"minute":0}'),
  ('coordinator-mission-planner', false, 'hourly', 'Africa/Casablanca', '{"minute":35}'),
  ('executive-report-agent', false, 'weekly', 'Africa/Casablanca', '{"days":[5],"hour":17,"minute":0}'),
  ('capital-learning-agent', false, 'weekly', 'Africa/Casablanca', '{"days":[5],"hour":18,"minute":0}')
on conflict (agent_key) do update set
  frequency_key = excluded.frequency_key,
  timezone = excluded.timezone,
  schedule = excluded.schedule,
  updated_at = now();

-- RLS and authenticated internal access.
do $rls$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ac_capital_record_versions','ac_capital_record_notes','ac_capital_record_assignments',
    'ac_capital_saved_views','ac_capital_runtime_leases','ac_capital_dead_letters',
    'ac_capital_notifications','ac_capital_agent_outputs','ac_capital_agent_schedules',
    'ac_capital_stage_gates','ac_capital_stage_gate_evaluations','ac_capital_artifacts',
    'ac_capital_artifact_versions','ac_capital_submission_proofs','ac_capital_command_results'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_all', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_authenticated_all', table_name);
  end loop;
end
$rls$;

notify pgrst, 'reload schema';
commit;
