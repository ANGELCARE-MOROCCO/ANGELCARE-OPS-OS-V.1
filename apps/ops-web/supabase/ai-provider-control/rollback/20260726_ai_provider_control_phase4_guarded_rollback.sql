-- GUARDED DESTRUCTIVE ROLLBACK. Run only after backup and explicit approval.
do $$ begin
  if current_setting('app.ai_provider_phase4_rollback_approved', true) is distinct from 'YES' then
    raise exception 'BLOCKED: set app.ai_provider_phase4_rollback_approved=YES for this transaction.';
  end if;
end $$;

drop function if exists public.ai_provider_restore_configuration(uuid,text);
drop function if exists public.ai_provider_simulate_runtime_route(text,text,text,integer,boolean);
drop function if exists public.ai_provider_fail_runtime_budget(uuid,uuid,integer,text,integer,jsonb);
drop function if exists public.ai_provider_reconcile_runtime_budget(uuid,uuid,integer,integer,bigint,bigint,integer,integer,text,text,numeric,jsonb);
drop function if exists public.ai_provider_acquire_runtime_budget(text,text,text,integer,bigint,bigint,boolean,text,text,text);
drop function if exists public.ai_provider_resolve_runtime_provider(text,text,text);
drop function if exists public.ai_provider_resolve_secret(uuid);
drop function if exists public.ai_provider_store_credential(uuid,uuid,text,text,text);

drop table if exists public.ai_provider_audit cascade;
drop table if exists public.ai_provider_emergency_state cascade;
drop table if exists public.ai_provider_alerts cascade;
drop table if exists public.ai_provider_config_versions cascade;
drop table if exists public.ai_provider_incidents cascade;
drop table if exists public.ai_provider_cooldowns cascade;
drop table if exists public.ai_provider_health_checks cascade;
drop table if exists public.ai_provider_usage_ledger cascade;
drop table if exists public.ai_provider_runtime_leases cascade;
drop table if exists public.ai_provider_budget_reservations cascade;
drop table if exists public.ai_provider_quota_policies cascade;
drop table if exists public.ai_provider_routing_rules cascade;
drop table if exists public.ai_provider_module_assignments cascade;
drop table if exists public.ai_provider_models cascade;
drop table if exists public.ai_provider_credentials cascade;
drop table if exists public.ai_provider_capacity_pools cascade;
drop table if exists public.ai_provider_dossiers cascade;
