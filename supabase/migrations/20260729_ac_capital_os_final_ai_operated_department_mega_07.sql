begin;

-- AC CAPITAL OS FINAL AI-OPERATED DEPARTMENT MEGA 07
-- One additive institutional orchestration layer across Radar, Qualification,
-- Funder Intelligence, Case Factory, Data Room, Pipeline, Coordinator,
-- Approvals, Reports and Learning.

do $preflight$
begin
  if to_regclass('public.ac_capital_radar_sources') is null
     or to_regclass('public.ac_capital_radar_opportunities') is null
     or to_regclass('public.ac_capital_qualification_dossiers') is null
     or to_regclass('public.ac_capital_cases') is null
     or to_regclass('public.ac_capital_pipeline_records') is null
     or to_regclass('public.ac_capital_coordinator_tasks') is null then
    raise exception 'AC_CAPITAL_FINAL_MEGA_07_PREREQUISITES_MISSING';
  end if;
end
$preflight$;

create table if not exists public.ac_capital_orchestrator_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  source_workspace text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  priority text not null default 'normal',
  status text not null default 'queued',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  processed_at timestamptz,
  error_code text,
  error_message text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(idempotency_key)
);

create table if not exists public.ac_capital_orchestrator_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_type text not null,
  title text not null,
  root_entity_type text not null,
  root_entity_id uuid,
  opportunity_id uuid,
  qualification_dossier_id uuid,
  case_id uuid,
  pipeline_record_id uuid,
  status text not null default 'active',
  current_stage text not null default 'intake',
  automation_mode text not null default 'internal-auto',
  next_action text,
  owner text,
  blocked_reason text,
  doctrine_snapshot_id uuid,
  trace jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_orchestrator_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.ac_capital_orchestrator_workflows(id) on delete cascade,
  step_key text not null,
  workspace_key text not null,
  capability text not null,
  status text not null default 'pending',
  prerequisite_snapshot jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  approval_required boolean not null default false,
  approval_id uuid,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_id, step_key)
);

create table if not exists public.ac_capital_agent_registry (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null unique,
  agent_name text not null,
  workspace_key text not null,
  capability text not null,
  description text,
  enabled boolean not null default true,
  automation_level text not null default 'internal-auto',
  external_actions_allowed boolean not null default false,
  provider_policy jsonb not null default '{}'::jsonb,
  trigger_events text[] not null default '{}',
  action_permissions jsonb not null default '{}'::jsonb,
  retry_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_doctrine_compilations (
  id uuid primary key default gen_random_uuid(),
  compilation_key text not null unique,
  scope text not null default 'capital-department',
  effective_bundle jsonb not null default '{}'::jsonb,
  source_versions jsonb not null default '[]'::jsonb,
  conflicts jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  compiled_by text,
  compiled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_universal_approvals (
  id uuid primary key default gen_random_uuid(),
  approval_type text not null,
  object_type text not null,
  object_id uuid,
  object_version text not null,
  snapshot jsonb not null default '{}'::jsonb,
  diff_snapshot jsonb not null default '{}'::jsonb,
  evidence_package jsonb not null default '{}'::jsonb,
  decision_requested text not null,
  risk_level text not null default 'medium',
  status text not null default 'pending',
  approver_role text not null default 'founder',
  requested_by text,
  requested_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  decision_note text,
  conditions jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_integrity_issues (
  id uuid primary key default gen_random_uuid(),
  issue_code text not null,
  entity_type text not null,
  entity_id uuid,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  detail text,
  recommended_action text,
  auto_repairable boolean not null default false,
  detected_snapshot jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  unique(issue_code, entity_type, entity_id)
);

create table if not exists public.ac_capital_outcome_learning (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid,
  case_id uuid,
  pipeline_record_id uuid,
  outcome text not null,
  outcome_reason text,
  objections jsonb not null default '[]'::jsonb,
  proof_friction jsonb not null default '[]'::jsonb,
  successful_patterns jsonb not null default '[]'::jsonb,
  failed_patterns jsonb not null default '[]'::jsonb,
  doctrine_proposals jsonb not null default '[]'::jsonb,
  scoring_proposals jsonb not null default '[]'::jsonb,
  status text not null default 'draft-learning',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_entity_links (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id uuid not null,
  relation_type text not null,
  to_type text not null,
  to_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(from_type, from_id, relation_type, to_type, to_id)
);

create index if not exists ac_capital_orchestrator_events_queue_idx on public.ac_capital_orchestrator_events(status, available_at, created_at);
create index if not exists ac_capital_orchestrator_workflows_status_idx on public.ac_capital_orchestrator_workflows(status, updated_at desc);
create index if not exists ac_capital_orchestrator_steps_workflow_idx on public.ac_capital_orchestrator_steps(workflow_id, status);
create index if not exists ac_capital_universal_approvals_status_idx on public.ac_capital_universal_approvals(status, requested_at desc);
create index if not exists ac_capital_integrity_issues_status_idx on public.ac_capital_integrity_issues(status, severity, detected_at desc);
create index if not exists ac_capital_entity_links_from_idx on public.ac_capital_entity_links(from_type, from_id);
create index if not exists ac_capital_entity_links_to_idx on public.ac_capital_entity_links(to_type, to_id);

insert into public.ac_capital_agent_registry(agent_key,agent_name,workspace_key,capability,description,trigger_events,action_permissions,provider_policy)
values
('capital-executive-orchestrator','Capital Executive Orchestrator','orchestrator','department_orchestration','Coordinates the complete internal capital lifecycle.',array['source.validated','opportunity.created','qualification.updated','document.uploaded','case.ready','approval.granted','submission.recorded','outcome.recorded'],jsonb_build_object('create_internal_records',true,'advance_internal_workflow',true,'create_tasks',true,'external_actions',false),jsonb_build_object('mode','deterministic')),
('funder-intelligence-agent','Funder Intelligence Agent','funders','funder_profile_analysis','Maintains living institutional funder intelligence.',array['opportunity.created','funder.refresh.requested'],jsonb_build_object('update_funder_profiles',true,'prepare_positioning',true,'external_actions',false),jsonb_build_object('search','tavily','analysis','openrouter/free')),
('qualification-underwriter','AI Qualification Underwriter','qualification','opportunity_qualification','Runs evidence-backed underwriting and proof-gap analysis.',array['opportunity.created','evidence.updated','document.uploaded','doctrine.compiled'],jsonb_build_object('create_scores',true,'create_proof_gaps',true,'prepare_committee_pack',true,'external_actions',false),jsonb_build_object('analysis','openrouter/free')),
('funding-case-architect','AI Funding Case Architect','cases','case_drafting','Produces funder-specific internal draft cases.',array['qualification.pursue','proof.updated'],jsonb_build_object('draft_case',true,'create_document_missions',true,'prepare_risk_plans',true,'external_actions',false),jsonb_build_object('analysis','openrouter/free')),
('data-room-proof-agent','Data Room Proof Agent','data-room','proof_gap_analysis','Maintains proof completeness, freshness and contradictions.',array['case.created','document.uploaded','document.expiring'],jsonb_build_object('classify_documents',true,'create_missing_proof',true,'update_readiness',true,'external_actions',false),jsonb_build_object('mode','internal-only')),
('pipeline-intelligence-agent','Pipeline Intelligence Agent','pipeline','pipeline_intelligence','Detects stagnation, deadline pressure and next-best action.',array['pipeline.updated','deadline.approaching','funder.response'],jsonb_build_object('create_followups',true,'update_probability',true,'escalate_risk',true,'external_actions',false),jsonb_build_object('analysis','openrouter/free')),
('coordinator-mission-planner','Coordinator Mission Planner','coordinator','mission_preparation','Prepares controlled human execution missions.',array['case.approved','pipeline.action.required'],jsonb_build_object('prepare_messages',true,'prepare_call_scripts',true,'create_tasks',true,'send_external',false,'submit_external',false),jsonb_build_object('analysis','openrouter/free')),
('executive-reporting-agent','Executive Reporting Agent','reports','executive_reporting','Generates evidence-backed management briefs.',array['daily.close','weekly.close','decision.required'],jsonb_build_object('draft_reports',true,'create_decision_briefs',true,'external_release',false),jsonb_build_object('analysis','openrouter/free')),
('capital-learning-agent','Capital Learning Agent','learning','learning_analysis','Converts outcomes into controlled improvement proposals.',array['outcome.recorded','case.closed'],jsonb_build_object('propose_doctrine',true,'propose_scoring',true,'propose_sop',true,'auto_apply_changes',false),jsonb_build_object('analysis','openrouter/free'))
on conflict(agent_key) do update set
  agent_name=excluded.agent_name,workspace_key=excluded.workspace_key,capability=excluded.capability,
  description=excluded.description,trigger_events=excluded.trigger_events,action_permissions=excluded.action_permissions,
  provider_policy=excluded.provider_policy,updated_at=now();

-- Normalize abandoned runs so the department never stays falsely busy.
update public.ac_capital_ai_agent_runs
set status='failed', phase='failed', error_code='AC_CAPITAL_STALE_RUN_RECOVERED',
    error_message=coalesce(error_message,'Recovered by Final Mega 07 integrity migration.'),
    finished_at=coalesce(finished_at,now()), completed_at=coalesce(completed_at,now()), updated_at=now()
where status in ('queued','running','provider_execution_running') and created_at < now()-interval '30 minutes';

alter table public.ac_capital_orchestrator_events enable row level security;
alter table public.ac_capital_orchestrator_workflows enable row level security;
alter table public.ac_capital_orchestrator_steps enable row level security;
alter table public.ac_capital_agent_registry enable row level security;
alter table public.ac_capital_doctrine_compilations enable row level security;
alter table public.ac_capital_universal_approvals enable row level security;
alter table public.ac_capital_integrity_issues enable row level security;
alter table public.ac_capital_outcome_learning enable row level security;
alter table public.ac_capital_entity_links enable row level security;

do $policies$
declare t text;
begin
  foreach t in array array[
    'ac_capital_orchestrator_events','ac_capital_orchestrator_workflows','ac_capital_orchestrator_steps',
    'ac_capital_agent_registry','ac_capital_doctrine_compilations','ac_capital_universal_approvals',
    'ac_capital_integrity_issues','ac_capital_outcome_learning','ac_capital_entity_links'
  ] loop
    execute format('drop policy if exists %I on public.%I', t||'_authenticated_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t||'_authenticated_all', t);
  end loop;
end
$policies$;

notify pgrst, 'reload schema';
commit;
