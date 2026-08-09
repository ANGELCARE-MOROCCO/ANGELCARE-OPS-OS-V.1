-- READ ONLY Phase 6 preflight
select current_database() as database_name, current_user as database_user, now() as checked_at;
with required(name,present) as (
 values
 ('ai_provider_dossiers',to_regclass('public.ai_provider_dossiers') is not null),
 ('ai_provider_credentials',to_regclass('public.ai_provider_credentials') is not null),
 ('ai_provider_module_assignments',to_regclass('public.ai_provider_module_assignments') is not null),
 ('ai_provider_routing_rules',to_regclass('public.ai_provider_routing_rules') is not null),
 ('ai_provider_quota_policies',to_regclass('public.ai_provider_quota_policies') is not null),
 ('ai_provider_command_policies',to_regclass('public.ai_provider_command_policies') is not null),
 ('vault.secrets',to_regclass('vault.secrets') is not null)
)
select name,present,case when bool_and(present) over() then 'READY' else 'BLOCKED' end as phase6_gate from required order by name;
select case when to_regclass('public.ai_ops_sop_articles') is null then 'READY_FOR_NEW_INSTALL' else 'PHASE6_ALREADY_PARTIAL_OR_INSTALLED' end as installation_state;
