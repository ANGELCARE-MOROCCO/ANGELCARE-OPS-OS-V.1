-- Phase 4 verification
with required(name) as (values
 ('ai_provider_dossiers'),('ai_provider_capacity_pools'),('ai_provider_credentials'),('ai_provider_models'),
 ('ai_provider_module_assignments'),('ai_provider_routing_rules'),('ai_provider_quota_policies'),
 ('ai_provider_budget_reservations'),('ai_provider_runtime_leases'),('ai_provider_usage_ledger'),
 ('ai_provider_health_checks'),('ai_provider_cooldowns'),('ai_provider_incidents'),
 ('ai_provider_config_versions'),('ai_provider_alerts'),('ai_provider_emergency_state'),('ai_provider_audit')
)
select name,to_regclass('public.'||name) is not null as present
from required order by name;

select tablename,rowsecurity
from pg_tables where schemaname='public' and tablename like 'ai_provider_%'
order by tablename;

select proname,prosecdef
from pg_proc join pg_namespace n on n.oid=pronamespace
where n.nspname='public' and proname like 'ai_provider_%'
order by proname;

select
  (select count(*) from public.ai_provider_quota_policies where scope_type='global' and scope_key='*') as global_policy,
  (select mode from public.ai_provider_emergency_state where scope_key='*') as emergency_mode,
  (select count(*) from public.ai_provider_credentials where vault_secret_id is null) as credentials_without_vault,
  has_function_privilege('authenticated','public.ai_provider_resolve_secret(uuid)','EXECUTE') as authenticated_can_resolve_secret,
  has_function_privilege('service_role','public.ai_provider_resolve_secret(uuid)','EXECUTE') as service_role_can_resolve_secret,
  has_function_privilege('authenticated','public.ai_provider_restore_configuration(uuid,text)','EXECUTE') as authenticated_can_restore,
  has_function_privilege('service_role','public.ai_provider_restore_configuration(uuid,text)','EXECUTE') as service_role_can_restore;
