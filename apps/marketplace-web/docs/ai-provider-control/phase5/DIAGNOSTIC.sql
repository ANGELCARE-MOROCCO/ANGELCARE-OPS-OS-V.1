-- ANGELCARE AI Provider Control Phase 5 · Diagnostic preflight
-- READ ONLY. Run in Supabase SQL Editor before applying the migration.

select
  current_database() as database_name,
  now() as checked_at,
  to_regclass('public.ai_provider_dossiers') is not null as phase4_dossiers,
  to_regclass('public.ai_provider_quota_policies') is not null as phase4_quotas,
  to_regclass('public.ai_provider_budget_reservations') is not null as phase4_reservations,
  to_regclass('public.ai_provider_runtime_leases') is not null as phase4_runtime_leases,
  to_regprocedure('public.ai_provider_acquire_runtime_budget(text,text,text,integer,bigint,bigint,boolean,text,text,text)') is not null as phase4_budget_gateway,
  to_regprocedure('public.ai_provider_reconcile_runtime_budget(uuid,uuid,integer,integer,bigint,bigint,integer,integer,text,text,numeric,jsonb)') is not null as phase4_reconciliation,
  to_regprocedure('public.ai_provider_fail_runtime_budget(uuid,uuid,integer,text,text,jsonb)') is not null as phase4_failure_release,
  to_regprocedure('public.ai_provider_resolve_secret(uuid)') is not null as phase4_vault_resolution;

select
  object_name,
  object_type,
  installed
from (
  values
    ('ai_provider_command_policies','table',to_regclass('public.ai_provider_command_policies') is not null),
    ('ai_provider_command_schedules','table',to_regclass('public.ai_provider_command_schedules') is not null),
    ('ai_provider_governed_requests','table',to_regclass('public.ai_provider_governed_requests') is not null),
    ('ai_provider_structured_result_cache','table',to_regclass('public.ai_provider_structured_result_cache') is not null),
    ('ai_provider_reuse_events','table',to_regclass('public.ai_provider_reuse_events') is not null),
    ('ai_provider_policy_overrides','table',to_regclass('public.ai_provider_policy_overrides') is not null),
    ('ai_provider_begin_governed_request','function',to_regprocedure('public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb)') is not null)
) as checks(object_name,object_type,installed)
order by object_type,object_name;

select
  column_name,
  data_type
from information_schema.columns
where table_schema='public'
  and table_name='ai_provider_quota_policies'
  and column_name in (
    'max_requests_per_week','max_input_tokens_per_week','max_output_tokens_per_week',
    'max_total_tokens_per_week','max_estimated_cost_usd_per_day',
    'max_estimated_cost_usd_per_week','max_estimated_cost_usd_per_month'
  )
order by column_name;

-- Phase 5 may already be partially installed. This diagnostic deliberately reports
-- that state; it does not modify or reconcile anything.
