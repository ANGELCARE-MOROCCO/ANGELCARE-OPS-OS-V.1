-- ANGELCARE AI Provider Control Phase 5 · MANUAL destructive rollback
-- STOP: export all Phase 5 tables before running. This file is NEVER auto-executed.

begin;

revoke all on function public.ai_provider_restore_sovereign_configuration(uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.ai_provider_invalidate_structured_cache(text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.ai_provider_fail_governed_request(uuid,integer,text,text,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.ai_provider_complete_governed_request(uuid,jsonb,text,bigint,bigint,integer,integer,numeric,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.ai_provider_preflight_governed_request(text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean) from public,anon,authenticated,service_role;

drop function if exists public.ai_provider_restore_sovereign_configuration(uuid,text);
drop function if exists public.ai_provider_invalidate_structured_cache(text,text,text);
drop function if exists public.ai_provider_fail_governed_request(uuid,integer,text,text,integer,jsonb);
drop function if exists public.ai_provider_complete_governed_request(uuid,jsonb,text,bigint,bigint,integer,integer,numeric,integer,jsonb);
drop function if exists public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb);
drop function if exists public.ai_provider_preflight_governed_request(text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean);

alter table if exists public.ai_provider_budget_reservations
  drop constraint if exists ai_provider_budget_reservations_governed_request_fk;

drop table if exists public.ai_provider_reuse_events;
drop table if exists public.ai_provider_structured_result_cache;
drop table if exists public.ai_provider_governed_requests;
drop table if exists public.ai_provider_command_schedules;
drop table if exists public.ai_provider_command_policies;
drop table if exists public.ai_provider_policy_overrides;

alter table if exists public.ai_provider_budget_reservations
  drop column if exists governed_request_id,
  drop column if exists request_fingerprint,
  drop column if exists trigger_type,
  drop column if exists workspace_key,
  drop column if exists reserved_cost_usd;

alter table if exists public.ai_provider_quota_policies
  drop column if exists max_estimated_cost_usd_per_month,
  drop column if exists max_estimated_cost_usd_per_week,
  drop column if exists max_estimated_cost_usd_per_day,
  drop column if exists max_total_tokens_per_week,
  drop column if exists max_output_tokens_per_week,
  drop column if exists max_input_tokens_per_week,
  drop column if exists max_requests_per_week;

commit;
