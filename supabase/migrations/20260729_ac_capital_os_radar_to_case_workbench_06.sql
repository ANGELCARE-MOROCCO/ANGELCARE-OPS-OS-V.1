begin;

-- AC CAPITAL OS · Radar-to-Case Conversion Workbench 06
-- Additive only. Existing Radar, Qualification, Case Factory, Pipeline,
-- Coordinator, AI Operations and audit records are preserved.

do $preflight$
begin
  if to_regclass('public.ac_capital_radar_sources') is null
     or to_regclass('public.ac_capital_radar_opportunities') is null
     or to_regclass('public.ac_capital_radar_research_runs') is null
     or to_regclass('public.ac_capital_qualification_dossiers') is null
     or to_regclass('public.ac_capital_cases') is null
     or to_regclass('public.ac_capital_pipeline_records') is null
     or to_regclass('public.ac_capital_coordinator_tasks') is null
     or to_regclass('public.ac_capital_provider_execution_logs') is null then
    raise exception 'AC_CAPITAL_RADAR_TO_CASE_WORKBENCH_06_PREREQUISITES_MISSING';
  end if;
end
$preflight$;

alter table public.ac_capital_provider_execution_logs
  add column if not exists updated_at timestamptz not null default now();

alter table public.ac_capital_radar_sources
  add column if not exists research_run_id uuid,
  add column if not exists provider_request_id text,
  add column if not exists grounding_chunk_index integer,
  add column if not exists source_domain text,
  add column if not exists content_excerpt text,
  add column if not exists raw_content text,
  add column if not exists published_at timestamptz,
  add column if not exists detected_deadline date,
  add column if not exists funding_amount_label text,
  add column if not exists eligibility_excerpt text,
  add column if not exists application_url text,
  add column if not exists officiality text not null default 'unverified',
  add column if not exists freshness_status text not null default 'unknown',
  add column if not exists duplicate_fingerprint text,
  add column if not exists assigned_reviewer text,
  add column if not exists review_note text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists cluster_id uuid,
  add column if not exists linked_opportunity_id uuid,
  add column if not exists lifecycle_status text not null default 'captured',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ac_capital_radar_opportunities
  add column if not exists organization_name text,
  add column if not exists application_url text,
  add column if not exists application_status text not null default 'unknown',
  add column if not exists eligibility_confidence integer not null default 0,
  add column if not exists evidence_quality_score integer not null default 0,
  add column if not exists strategic_value_score integer not null default 0,
  add column if not exists effort_score integer not null default 0,
  add column if not exists risk_level text not null default 'unknown',
  add column if not exists owner text,
  add column if not exists next_action text,
  add column if not exists cluster_id uuid,
  add column if not exists qualification_dossier_id uuid,
  add column if not exists case_id uuid,
  add column if not exists pipeline_record_id uuid,
  add column if not exists workflow_status text not null default 'candidate',
  add column if not exists proof_gaps text[] not null default '{}',
  add column if not exists required_documents text[] not null default '{}',
  add column if not exists evidence_quotes text[] not null default '{}',
  add column if not exists linked_source_count integer not null default 0,
  add column if not exists conversion_state text not null default 'not-started',
  add column if not exists last_refreshed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ac_capital_radar_research_runs
  add column if not exists research_query text,
  add column if not exists provider_request_id text,
  add column if not exists provider_response_id text,
  add column if not exists provider_model text,
  add column if not exists input_tokens integer not null default 0,
  add column if not exists output_tokens integer not null default 0,
  add column if not exists estimated_cost_usd numeric not null default 0,
  add column if not exists grounding_queries jsonb not null default '[]'::jsonb,
  add column if not exists grounding_metadata jsonb not null default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.ac_capital_qualification_dossiers
  add column if not exists radar_cluster_id uuid,
  add column if not exists radar_source_ids uuid[] not null default '{}',
  add column if not exists conversion_event_id uuid,
  add column if not exists preliminary_score_method text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ac_capital_cases
  add column if not exists radar_cluster_id uuid,
  add column if not exists radar_source_ids uuid[] not null default '{}',
  add column if not exists conversion_event_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ac_capital_pipeline_records
  add column if not exists radar_cluster_id uuid,
  add column if not exists radar_source_ids uuid[] not null default '{}',
  add column if not exists conversion_event_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.ac_capital_radar_evidence_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_title text not null,
  canonical_source_id uuid,
  canonical_opportunity_id uuid,
  cluster_key text not null,
  organization_name text,
  program_name text,
  source_count integer not null default 0,
  official_source_count integer not null default 0,
  deadline_confidence integer not null default 0,
  eligibility_confidence integer not null default 0,
  evidence_quality_score integer not null default 0,
  status text not null default 'needs-review',
  assigned_reviewer text,
  review_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_evidence_cluster_members (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.ac_capital_radar_evidence_clusters(id) on delete cascade,
  source_id uuid not null references public.ac_capital_radar_sources(id) on delete cascade,
  member_role text not null default 'supporting',
  duplicate_probability integer not null default 0,
  relationship_reason text,
  created_at timestamptz not null default now(),
  unique(cluster_id, source_id)
);

create table if not exists public.ac_capital_radar_source_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ac_capital_radar_sources(id) on delete cascade,
  opportunity_id uuid,
  cluster_id uuid,
  decision text not null,
  confidence integer not null default 0,
  officiality text,
  assigned_reviewer text,
  review_note text,
  reviewed_by text,
  reviewed_at timestamptz not null default now(),
  evidence_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_research_missions (
  id uuid primary key default gen_random_uuid(),
  mission_title text not null,
  mission_type text not null default 'deeper-research',
  source_id uuid,
  opportunity_id uuid,
  cluster_id uuid,
  research_query text not null,
  requested_depth text not null default 'basic',
  status text not null default 'queued',
  requested_by text,
  assigned_agent_key text not null default 'funding-opportunity-radar',
  result_run_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_conversion_events (
  id uuid primary key default gen_random_uuid(),
  source_id uuid,
  opportunity_id uuid,
  cluster_id uuid,
  qualification_dossier_id uuid,
  case_id uuid,
  pipeline_record_id uuid,
  coordinator_task_ids uuid[] not null default '{}',
  conversion_mode text not null,
  status text not null default 'completed',
  before_state jsonb,
  after_state jsonb,
  actor text,
  reason text,
  reversible boolean not null default true,
  reversal_event_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_internal_notes (
  id uuid primary key default gen_random_uuid(),
  source_id uuid,
  opportunity_id uuid,
  cluster_id uuid,
  note_type text not null default 'internal',
  note text not null,
  actor text,
  created_at timestamptz not null default now()
);

create unique index if not exists ac_capital_radar_clusters_key_uidx
  on public.ac_capital_radar_evidence_clusters(cluster_key);
create index if not exists ac_capital_radar_cluster_members_source_idx
  on public.ac_capital_radar_evidence_cluster_members(source_id);
create index if not exists ac_capital_radar_source_reviews_source_idx
  on public.ac_capital_radar_source_reviews(source_id, reviewed_at desc);
create index if not exists ac_capital_radar_conversion_opportunity_idx
  on public.ac_capital_radar_conversion_events(opportunity_id, created_at desc);
create index if not exists ac_capital_radar_sources_lifecycle_idx
  on public.ac_capital_radar_sources(lifecycle_status, created_at desc);
create index if not exists ac_capital_radar_sources_cluster_idx
  on public.ac_capital_radar_sources(cluster_id);
create index if not exists ac_capital_radar_opportunities_workflow_idx
  on public.ac_capital_radar_opportunities(workflow_status, created_at desc);
create index if not exists ac_capital_radar_opportunities_links_idx
  on public.ac_capital_radar_opportunities(qualification_dossier_id, case_id, pipeline_record_id);

update public.ac_capital_provider_execution_logs
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.ac_capital_radar_sources
set
  source_domain = coalesce(
    nullif(source_domain, ''),
    regexp_replace(split_part(split_part(coalesce(source_url, ''), '://', 2), '/', 1), '^www\\.', '')
  ),
  duplicate_fingerprint = coalesce(
    nullif(duplicate_fingerprint, ''),
    md5(lower(coalesce(source_name, '') || '|' || coalesce(source_url, '')))
  ),
  lifecycle_status = case lower(coalesce(verification_status, 'needs_review'))
    when 'validated' then 'validated'
    when 'valid' then 'validated'
    when 'rejected' then 'rejected'
    when 'archived' then 'archived'
    when 'secondary-evidence' then 'secondary-evidence'
    else coalesce(nullif(lifecycle_status, ''), 'captured')
  end,
  updated_at = coalesce(updated_at, now());

update public.ac_capital_radar_opportunities
set
  evidence_quality_score = greatest(evidence_quality_score, source_confidence),
  strategic_value_score = greatest(
    strategic_value_score,
    case when coalesce(grounding_metadata->>'relevanceScore', '') ~ '^[0-9]+$' then (grounding_metadata->>'relevanceScore')::integer else 0 end
  ),
  workflow_status = case status
    when 'ready-for-qualification' then 'qualification-pending'
    when 'watchlist' then 'watchlist'
    when 'rejected' then 'rejected'
    else coalesce(nullif(workflow_status, ''), 'candidate')
  end,
  updated_at = coalesce(updated_at, now());

alter table public.ac_capital_radar_evidence_clusters enable row level security;
alter table public.ac_capital_radar_evidence_cluster_members enable row level security;
alter table public.ac_capital_radar_source_reviews enable row level security;
alter table public.ac_capital_radar_research_missions enable row level security;
alter table public.ac_capital_radar_conversion_events enable row level security;
alter table public.ac_capital_radar_internal_notes enable row level security;

notify pgrst, 'reload schema';

commit;
