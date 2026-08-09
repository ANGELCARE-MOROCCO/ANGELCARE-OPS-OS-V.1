-- Phase 11 RLS and server-only command verification
with expected(name) as (
  values
  ('revenue_executive_forecast_models'),('revenue_executive_forecast_model_versions'),
  ('revenue_executive_forecast_snapshots'),('revenue_executive_forecast_lines'),
  ('revenue_executive_forecast_submissions'),('revenue_executive_forecast_overrides'),
  ('revenue_executive_forecast_movements'),('revenue_executive_forecast_accuracy_periods'),
  ('revenue_executive_signal_rules'),('revenue_executive_signal_rule_versions'),
  ('revenue_executive_signals'),('revenue_executive_signal_evidence'),
  ('revenue_executive_leakage_events'),('revenue_executive_leakage_resolutions'),
  ('revenue_executive_interventions'),('revenue_executive_intervention_assignments'),
  ('revenue_executive_intervention_checkpoints'),('revenue_executive_decision_requests'),
  ('revenue_executive_decisions'),('revenue_executive_intervention_actions'),
  ('revenue_executive_intervention_outcomes'),('revenue_executive_scenarios'),
  ('revenue_executive_scenario_versions'),('revenue_executive_scenario_assumptions'),
  ('revenue_executive_scenario_results'),('revenue_executive_briefings'),
  ('revenue_executive_briefing_sections'),('revenue_executive_data_quality_issues'),
  ('revenue_executive_audit_events')
),
public_relations as (
  select c.relname,c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in ('r','p')
),
security as (
  select
    e.name,
    c.relrowsecurity as rls_enabled,
    has_table_privilege('authenticated', format('public.%I',e.name), 'INSERT,UPDATE,DELETE') as authenticated_can_mutate,
    has_table_privilege('anon', format('public.%I',e.name), 'SELECT,INSERT,UPDATE,DELETE') as anon_has_access
  from expected e
  left join public_relations c on c.relname=e.name
)
select
  count(*) as expected_tables,
  count(*) filter(where rls_enabled) as rls_enabled_tables,
  count(*) filter(where authenticated_can_mutate) as authenticated_mutable_tables,
  count(*) filter(where anon_has_access) as anon_accessible_tables,
  case when count(*)=29
         and count(*) filter(where rls_enabled)=29
         and count(*) filter(where authenticated_can_mutate)=0
         and count(*) filter(where anon_has_access)=0
       then 'PASS' else 'FAIL' end as security_gate
from security;

select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'revenue_executive_%'
order by p.proname;
