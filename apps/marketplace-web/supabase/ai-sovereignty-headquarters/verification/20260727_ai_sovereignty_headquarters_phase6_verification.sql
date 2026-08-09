-- READ ONLY Phase 6 verification
with required(name,kind,present) as (
 values
 ('ai_ops_incident_cases','table',to_regclass('public.ai_ops_incident_cases') is not null),
 ('ai_ops_change_requests','table',to_regclass('public.ai_ops_change_requests') is not null),
 ('ai_ops_destruction_requests','table',to_regclass('public.ai_ops_destruction_requests') is not null),
 ('ai_ops_provider_adapters','table',to_regclass('public.ai_ops_provider_adapters') is not null),
 ('ai_ops_capability_registry','table',to_regclass('public.ai_ops_capability_registry') is not null),
 ('ai_ops_module_registry','table',to_regclass('public.ai_ops_module_registry') is not null),
 ('ai_ops_sop_articles','table',to_regclass('public.ai_ops_sop_articles') is not null),
 ('ai_ops_sop_progress','table',to_regclass('public.ai_ops_sop_progress') is not null),
 ('ai_ops_operator_notes','table',to_regclass('public.ai_ops_operator_notes') is not null),
 ('ai_ops_action_jobs','table',to_regclass('public.ai_ops_action_jobs') is not null),
 ('ai_ops_entity_tombstones','table',to_regclass('public.ai_ops_entity_tombstones') is not null),
 ('ai_ops_dependency_snapshot','function',to_regprocedure('public.ai_ops_dependency_snapshot(text,text)') is not null),
 ('ai_ops_execute_destruction','function',to_regprocedure('public.ai_ops_execute_destruction(uuid,text)') is not null)
)
select *,case when bool_and(present) over() then 'PHASE6_READY' else 'PHASE6_BLOCKED' end as gate from required order by kind,name;

select count(*) as sop_articles from public.ai_ops_sop_articles where status='published';
select count(*) as provider_adapters from public.ai_ops_provider_adapters;
select count(*) as capabilities from public.ai_ops_capability_registry;
select count(*) as modules from public.ai_ops_module_registry;

select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'ai_ops_%' order by tablename;

select has_function_privilege('anon','public.ai_ops_execute_destruction(uuid,text)','execute') as anon_can_destroy,
       has_function_privilege('authenticated','public.ai_ops_execute_destruction(uuid,text)','execute') as authenticated_can_destroy,
       has_function_privilege('service_role','public.ai_ops_execute_destruction(uuid,text)','execute') as service_role_can_destroy;
