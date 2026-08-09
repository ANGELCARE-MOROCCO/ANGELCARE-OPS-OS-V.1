-- ANGELCARE Revenue Command Center — Mega ZIP 12
-- Final read-only production security and integrity verification.
-- This file performs no mutation.

with executive_tables as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relname like 'revenue_executive_%'
), browser_base_access as (
  select
    relname,
    has_table_privilege('authenticated', format('public.%I', relname), 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_can_mutate,
    has_table_privilege('anon', format('public.%I', relname), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_has_access
  from executive_tables
), command_views as (
  select unnest(array[
    'public.revenue_executive_forecast_command_view',
    'public.revenue_executive_intervention_command_view'
  ]) as relation_name
), view_access as (
  select
    relation_name,
    has_table_privilege('authenticated', relation_name, 'SELECT,INSERT,UPDATE,DELETE') as authenticated_has_access,
    has_table_privilege('anon', relation_name, 'SELECT,INSERT,UPDATE,DELETE') as anon_has_access,
    has_table_privilege('service_role', relation_name, 'SELECT') as service_role_can_read
  from command_views
), protected_rpcs as (
  select p.proname,
         p.prosecdef as security_definer,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'revenue_executive_create_forecast_snapshot',
      'revenue_executive_submit_forecast',
      'revenue_executive_override_forecast',
      'revenue_executive_create_intervention',
      'revenue_executive_decide_intervention',
      'revenue_executive_close_intervention',
      'revenue_executive_manage_scenario',
      'revenue_executive_manage_briefing'
    )
)
select
  (select count(*) from executive_tables) as executive_tables,
  (select count(*) from executive_tables where relrowsecurity) as rls_enabled_tables,
  (select count(*) from browser_base_access where authenticated_can_mutate) as authenticated_mutable_tables,
  (select count(*) from browser_base_access where anon_has_access) as anon_accessible_tables,
  (select count(*) from view_access where authenticated_has_access) as authenticated_accessible_command_views,
  (select count(*) from view_access where anon_has_access) as anon_accessible_command_views,
  (select count(*) from view_access where service_role_can_read) as service_role_readable_command_views,
  (select count(*) from protected_rpcs) as protected_rpc_count,
  (select count(*) from protected_rpcs where authenticated_can_execute or anon_can_execute) as browser_executable_protected_rpcs,
  (select count(*) from protected_rpcs where service_role_can_execute) as service_role_executable_protected_rpcs,
  case
    when (select count(*) from executive_tables) = 29
     and (select count(*) from executive_tables where relrowsecurity) = 29
     and (select count(*) from browser_base_access where authenticated_can_mutate) = 0
     and (select count(*) from browser_base_access where anon_has_access) = 0
     and (select count(*) from view_access where authenticated_has_access) = 0
     and (select count(*) from view_access where anon_has_access) = 0
     and (select count(*) from view_access where service_role_can_read) = 2
     and (select count(*) from protected_rpcs) = 8
     and (select count(*) from protected_rpcs where authenticated_can_execute or anon_can_execute) = 0
     and (select count(*) from protected_rpcs where service_role_can_execute) = 8
    then 'PASS'
    else 'REVIEW_REQUIRED'
  end as phase12_security_gate;

select * from (
  select 'orphan_forecast_lines' as check_name, count(*)::bigint as defect_count
  from public.revenue_executive_forecast_lines l
  left join public.revenue_executive_forecast_snapshots s on s.id = l.snapshot_id
  where s.id is null
  union all
  select 'duplicate_active_overrides', count(*)::bigint
  from (
    select forecast_line_id
    from public.revenue_executive_forecast_overrides
    where status = 'active'
    group by forecast_line_id
    having count(*) > 1
  ) q
  union all
  select 'active_interventions_without_owner', count(*)::bigint
  from public.revenue_executive_interventions
  where status not in ('closed', 'cancelled')
    and nullif(btrim(coalesce(owner_label, '')), '') is null
  union all
  select 'decisions_without_reason_or_evidence', count(*)::bigint
  from public.revenue_executive_decisions
  where nullif(btrim(coalesce(reason, '')), '') is null
     or nullif(btrim(coalesce(evidence_reference, '')), '') is null
  union all
  select 'approved_scenarios_without_approval_date', count(*)::bigint
  from public.revenue_executive_scenarios
  where status = 'approved' and approved_at is null
  union all
  select 'approved_briefings_without_approval_date', count(*)::bigint
  from public.revenue_executive_briefings
  where status = 'approved' and approved_at is null
) checks
order by check_name;

select
  coalesce(sum(case when lower(coalesce(status, '')) not in ('reversed','cancelled','void','rejected') then coalesce(amount,0) else 0 end), 0) as authoritative_realized_mad,
  coalesce(sum(case when lower(coalesce(status, '')) in ('reversed','cancelled','void','rejected') then coalesce(amount,0) else 0 end), 0) as reversed_realization_mad
from public.revenue_realization_events;
