-- CONTROLLED ROLLBACK: execute only before production data is used and after a verified backup.
begin;
drop table if exists public.market_ai_bridge_objects cascade;
drop table if exists public.market_ai_action_queue cascade;
drop table if exists public.market_ai_resource_updates cascade;
drop table if exists public.market_ai_learning_events cascade;
drop table if exists public.market_ai_guardrail_events cascade;
drop table if exists public.market_ai_csv_imports cascade;
drop table if exists public.market_ai_runs cascade;
drop table if exists public.market_ai_mandates cascade;
drop table if exists public.market_ai_command_schedules cascade;
drop table if exists public.market_ai_commands cascade;
drop table if exists public.market_ai_skills cascade;
drop table if exists public.market_ai_doctrine_entries cascade;
drop function if exists public.market_ai_set_updated_at();
commit;
