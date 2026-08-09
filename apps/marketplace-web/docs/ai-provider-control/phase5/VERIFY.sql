-- ANGELCARE AI Provider Control Phase 5 · Post-migration verification
-- READ ONLY. Run after the Phase 5 migration.

with required_tables(name) as (
  values
    ('ai_provider_command_policies'),
    ('ai_provider_command_schedules'),
    ('ai_provider_governed_requests'),
    ('ai_provider_structured_result_cache'),
    ('ai_provider_reuse_events'),
    ('ai_provider_policy_overrides')
)
select name, to_regclass('public.'||name) is not null as exists
from required_tables order by name;

with required_functions(signature) as (
  values
    ('public.ai_provider_preflight_governed_request(text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean)'),
    ('public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb)'),
    ('public.ai_provider_complete_governed_request(uuid,jsonb,text,bigint,bigint,integer,integer,numeric,integer,jsonb)'),
    ('public.ai_provider_fail_governed_request(uuid,integer,text,text,integer,jsonb)'),
    ('public.ai_provider_invalidate_structured_cache(text,text,text)'),
    ('public.ai_provider_restore_sovereign_configuration(uuid,text)')
)
select signature, to_regprocedure(signature) is not null as exists
from required_functions;

select
  scope_type,scope_key,max_requests_per_day,max_requests_per_week,
  max_input_tokens_per_week,max_output_tokens_per_week,max_total_tokens_per_week,
  max_estimated_cost_usd_per_day,max_estimated_cost_usd_per_week,
  max_estimated_cost_usd_per_month,hard_limit,enabled
from public.ai_provider_quota_policies
where scope_type='module'
  and scope_key in ('revenue_os','ai_provider_control')
order by scope_key;

select
  module_key,workspace_key,command_code,ai_mode,manual_allowed,scheduled_allowed,
  minimum_interval_seconds,max_runs_per_day,max_runs_per_week,max_cost_usd_per_week,
  cache_mode,cache_ttl_seconds,duplicate_window_seconds,approval_class,enabled
from public.ai_provider_command_policies
where module_key in ('revenue_os','ai_provider_control')
order by module_key,workspace_key,command_code;

select
  column_name,
  data_type
from information_schema.columns
where table_schema='public'
  and table_name='ai_provider_reuse_events'
  and column_name in ('module_key','workspace_key','command_code','avoided_requests','avoided_cost_usd')
order by column_name;

select
  count(*) filter(where decision='EXECUTE_NEW') as executed_new,
  count(*) filter(where decision='REUSE_CACHED') as reused_cached,
  count(*) filter(where decision='JOIN_IN_FLIGHT') as joined_in_flight,
  count(*) filter(where decision like 'BLOCK_%') as blocked,
  count(*) filter(where decision='DEFER_SCHEDULE') as deferred,
  count(*) filter(where decision='REQUIRE_APPROVAL') as approval_required
from public.ai_provider_governed_requests
where module_key='revenue_os';

select
  coalesce(sum(avoided_requests),0) as requests_avoided,
  coalesce(sum(avoided_input_tokens+avoided_output_tokens),0) as tokens_avoided,
  coalesce(sum(avoided_cost_usd),0) as estimated_cost_avoided_usd
from public.ai_provider_reuse_events
where module_key='revenue_os';

select
  schedule_key,module_key,workspace_key,command_code,status,enabled,
  max_runs_per_day,max_runs_per_week,next_run_at,last_completed_at,failure_count
from public.ai_provider_command_schedules
where module_key='revenue_os'
order by schedule_key;

-- Expected minimum seed coverage:
-- revenue_os: REVENUE_STRATEGY_ASSEMBLY, REVENUE_COUNCIL_*,
--             REVENUE_EXECUTIVE_BRIEF, REVENUE_PROVIDER_HEALTH_ACTIVE
-- ai_provider_control: AI_PROVIDER_CREDENTIAL_TEST
