-- DESTRUCTIVE MANUAL ROLLBACK. Do not run after Phase 6 has operational records without export.
begin;
drop function if exists public.ai_ops_execute_destruction(uuid,text);
drop function if exists public.ai_ops_dependency_snapshot(text,text);
drop table if exists public.ai_ops_entity_tombstones;
drop table if exists public.ai_ops_action_jobs;
drop table if exists public.ai_ops_operator_notes;
drop table if exists public.ai_ops_sop_progress;
drop table if exists public.ai_ops_sop_articles;
drop table if exists public.ai_ops_module_registry;
drop table if exists public.ai_ops_capability_registry;
drop table if exists public.ai_ops_provider_adapters;
drop table if exists public.ai_ops_destruction_requests;
drop table if exists public.ai_ops_change_requests;
drop table if exists public.ai_ops_incident_cases;
commit;
