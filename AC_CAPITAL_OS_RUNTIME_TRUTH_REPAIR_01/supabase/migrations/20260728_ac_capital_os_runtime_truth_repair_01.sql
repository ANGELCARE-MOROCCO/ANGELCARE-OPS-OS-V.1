begin;

-- AC CAPITAL OS Runtime Truth Repair 01
-- Activates governed Gemini Google Search research, substantive report composition,
-- provider evidence persistence and rejection traceability without enabling external actions.

do $$
begin
  if to_regclass('public.ac_capital_radar_research_runs') is null
     or to_regclass('public.ac_capital_radar_opportunities') is null
     or to_regclass('public.ac_capital_strategy_reports') is null
     or to_regclass('public.ai_provider_module_assignments') is null
     or to_regclass('public.ai_provider_command_policies') is null then
    raise exception 'AC_CAPITAL_RUNTIME_TRUTH_REPAIR_PREREQUISITES_MISSING';
  end if;
end $$;

alter table public.ac_capital_radar_research_runs
  add column if not exists research_query text,
  add column if not exists provider_request_id text,
  add column if not exists provider_response_id text,
  add column if not exists provider_model text,
  add column if not exists input_tokens integer not null default 0,
  add column if not exists output_tokens integer not null default 0,
  add column if not exists estimated_cost_usd numeric(14,6) not null default 0,
  add column if not exists grounding_queries text[] not null default '{}',
  add column if not exists grounding_metadata jsonb not null default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.ac_capital_radar_sources
  add column if not exists research_run_id uuid references public.ac_capital_radar_research_runs(id) on delete set null,
  add column if not exists provider_request_id text,
  add column if not exists grounding_chunk_index integer;

alter table public.ac_capital_radar_opportunities
  add column if not exists research_run_id uuid references public.ac_capital_radar_research_runs(id) on delete set null,
  add column if not exists provider_request_id text,
  add column if not exists grounding_chunk_index integer,
  add column if not exists grounding_metadata jsonb not null default '{}'::jsonb,
  add column if not exists rejection_reason text;

create table if not exists public.ac_capital_radar_rejections (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid references public.ac_capital_radar_research_runs(id) on delete cascade,
  candidate_title text not null,
  source_name text,
  source_url text,
  rejection_reason text not null,
  provider_request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ac_capital_radar_rejections_run_idx on public.ac_capital_radar_rejections(research_run_id);
alter table public.ac_capital_radar_rejections enable row level security;

alter table public.ac_capital_strategy_reports
  add column if not exists provider_request_id text,
  add column if not exists provider_model text,
  add column if not exists generated_body jsonb not null default '{}'::jsonb,
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists confidence_score numeric(5,2);

alter table public.ac_capital_strategy_report_sections
  add column if not exists content_markdown text,
  add column if not exists provider_request_id text;

alter table public.ac_capital_report_exports
  add column if not exists report_id uuid references public.ac_capital_strategy_reports(id) on delete set null,
  add column if not exists provider_request_id text;

-- The live bridge must already have an enabled assignment and quota row.
do $$
begin
  if not exists (select 1 from public.ai_provider_module_assignments where module_key='ac_capital_os' and enabled) then
    raise exception 'AC_CAPITAL_ENABLED_PROVIDER_ASSIGNMENT_REQUIRED';
  end if;
  if not exists (select 1 from public.ai_provider_quota_policies where scope_type='module' and scope_key='ac_capital_os' and enabled) then
    raise exception 'AC_CAPITAL_MODULE_QUOTA_POLICY_REQUIRED';
  end if;
end $$;

-- Grounded requests were previously explicitly blocked at zero. Activate a conservative allowance.
update public.ai_provider_quota_policies
set max_grounded_requests_per_day = greatest(coalesce(max_grounded_requests_per_day,0),25),
    updated_at = now(),
    metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('acCapitalGroundedResearch',true,'source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01')
where scope_type='module' and scope_key='ac_capital_os' and enabled;

-- Authorize the two real runtime capabilities on the existing dedicated AC Capital assignment.
update public.ai_provider_module_assignments
set capability_allowlist = (
      select array_agg(distinct capability order by capability)
      from unnest(coalesce(capability_allowlist,'{}'::text[]) || array['grounded_research','structured_content']::text[]) capability
    ),
    metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('groundedResearch',true,'substantiveReports',true,'source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'),
    updated_at = now()
where module_key='ac_capital_os' and enabled;

-- Register primary and fallback models for grounded research and structured report composition.
insert into public.ai_provider_models
  (dossier_id,model_code,display_name,capability,enabled,primary_for_capability,grounding_allowed,max_output_tokens,metadata,created_at,updated_at)
select a.dossier_id, a.primary_model, a.primary_model || ' — AC Capital Grounded Research', 'grounded_research', true, true, true, 7000,
       jsonb_build_object('moduleKey','ac_capital_os','role','primary','source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from public.ai_provider_module_assignments a
where a.module_key='ac_capital_os' and a.enabled and a.primary_model is not null
on conflict (dossier_id,model_code,capability) do update set
  enabled=true, primary_for_capability=true, grounding_allowed=true, max_output_tokens=7000,
  metadata=coalesce(public.ai_provider_models.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

insert into public.ai_provider_models
  (dossier_id,model_code,display_name,capability,enabled,primary_for_capability,grounding_allowed,max_output_tokens,metadata,created_at,updated_at)
select a.dossier_id, a.primary_model, a.primary_model || ' — AC Capital Report Composer', 'structured_content', true, true, false, 7000,
       jsonb_build_object('moduleKey','ac_capital_os','role','primary','source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from public.ai_provider_module_assignments a
where a.module_key='ac_capital_os' and a.enabled and a.primary_model is not null
on conflict (dossier_id,model_code,capability) do update set
  enabled=true, primary_for_capability=true, grounding_allowed=false, max_output_tokens=7000,
  metadata=coalesce(public.ai_provider_models.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

insert into public.ai_provider_models
  (dossier_id,model_code,display_name,capability,enabled,primary_for_capability,grounding_allowed,max_output_tokens,metadata,created_at,updated_at)
select a.dossier_id, a.fallback_model, a.fallback_model || ' — AC Capital Grounded Research Fallback', 'grounded_research', true, false, true, 5000,
       jsonb_build_object('moduleKey','ac_capital_os','role','fallback','source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from public.ai_provider_module_assignments a
where a.module_key='ac_capital_os' and a.enabled and a.fallback_model is not null
on conflict (dossier_id,model_code,capability) do update set
  enabled=true, grounding_allowed=true, max_output_tokens=5000,
  metadata=coalesce(public.ai_provider_models.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

insert into public.ai_provider_models
  (dossier_id,model_code,display_name,capability,enabled,primary_for_capability,grounding_allowed,max_output_tokens,metadata,created_at,updated_at)
select a.dossier_id, a.fallback_model, a.fallback_model || ' — AC Capital Report Composer Fallback', 'structured_content', true, false, false, 5000,
       jsonb_build_object('moduleKey','ac_capital_os','role','fallback','source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from public.ai_provider_module_assignments a
where a.module_key='ac_capital_os' and a.enabled and a.fallback_model is not null
on conflict (dossier_id,model_code,capability) do update set
  enabled=true, grounding_allowed=false, max_output_tokens=5000,
  metadata=coalesce(public.ai_provider_models.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

-- Route both capabilities through one deterministic highest-priority assignment.
with primary_assignment as (
  select id
  from public.ai_provider_module_assignments
  where module_key='ac_capital_os' and enabled
  order by priority asc, created_at asc
  limit 1
)
insert into public.ai_provider_routing_rules
  (module_key,capability,routing_mode,primary_assignment_id,fallback_assignment_ids,sticky_mission,enabled,metadata,created_at,updated_at)
select 'ac_capital_os', capability, 'primary_fallback', a.id, '{}'::uuid[], true, true,
       jsonb_build_object('manualOnly',true,'externalActions',false,'source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from primary_assignment a
cross join (values ('grounded_research'),('structured_content')) c(capability)
on conflict (module_key,capability) do update set
  routing_mode='primary_fallback', primary_assignment_id=excluded.primary_assignment_id,
  fallback_assignment_ids='{}'::uuid[], sticky_mission=true, enabled=true,
  metadata=coalesce(public.ai_provider_routing_rules.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

-- Explicit governed policies for the two real buttons. They remain manual and executive-controlled.
with primary_assignment as (
  select primary_model, fallback_model
  from public.ai_provider_module_assignments
  where module_key='ac_capital_os' and enabled
  order by priority asc, created_at asc
  limit 1
)
insert into public.ai_provider_command_policies
  (module_key,workspace_key,command_code,ai_mode,manual_allowed,scheduled_allowed,minimum_interval_seconds,
   max_runs_per_day,max_runs_per_week,max_runs_per_month,max_input_tokens_per_run,max_output_tokens_per_run,
   max_cost_usd_per_run,max_cost_usd_per_day,max_cost_usd_per_week,max_retries,cache_mode,cache_ttl_seconds,
   duplicate_window_seconds,force_refresh_allowed,approval_class,allowed_provider_types,allowed_models,allowed_trigger_types,
   execution_window,cooldown_after_failure_seconds,consecutive_failure_suspend_threshold,enabled,metadata,created_at,updated_at)
select 'ac_capital_os', x.workspace_key, x.command_code, 'ai_required', true, false, 5,
       x.daily_limit, x.daily_limit*7, x.daily_limit*30, 120000, 7000,
       2, 10, 40, 1, 'ttl', 0, 5, true, 'route_enforced_sensitive_only',
       array['gemini']::text[], array_remove(array[a.primary_model,a.fallback_model]::text[],null), array['manual','forced_refresh']::text[],
       '{}'::jsonb, 300, 3, true,
       jsonb_build_object('externalActions',false,'humanReviewRequired',true,'source','AC_CAPITAL_RUNTIME_TRUTH_REPAIR_01'), now(), now()
from primary_assignment a
cross join (values
  ('opportunity-radar','AC_CAPITAL_RADAR_GROUNDED_RESEARCH',25),
  ('executive-report-studio','AC_CAPITAL_REPORT_COMPOSE',50)
) x(workspace_key,command_code,daily_limit)
on conflict (module_key,workspace_key,command_code) do update set
  ai_mode='ai_required', manual_allowed=true, scheduled_allowed=false, minimum_interval_seconds=5,
  max_runs_per_day=excluded.max_runs_per_day, max_runs_per_week=excluded.max_runs_per_week, max_runs_per_month=excluded.max_runs_per_month,
  max_input_tokens_per_run=120000, max_output_tokens_per_run=7000, max_cost_usd_per_run=2,
  max_cost_usd_per_day=10, max_cost_usd_per_week=40, max_retries=1, cache_mode='ttl', cache_ttl_seconds=0,
  duplicate_window_seconds=5, force_refresh_allowed=true, approval_class='route_enforced_sensitive_only',
  allowed_provider_types=array['gemini']::text[], allowed_models=excluded.allowed_models,
  allowed_trigger_types=array['manual','forced_refresh']::text[], enabled=true,
  metadata=coalesce(public.ai_provider_command_policies.metadata,'{}'::jsonb)||excluded.metadata, updated_at=now();

update public.ac_capital_live_wiring_status
set ai_provider_mode='provider-control-live', report_status='substantive-ai-composition', updated_at=now(), last_checked_at=now()
where workspace in ('capital-radar','strategy-production-command','executive-report-studio');

commit;
