-- Read-only RLS and object verification for Mega ZIP 9
with required_tables(name) as (
  values
    ('revenue_b2c_guardians'),('revenue_b2c_beneficiaries'),('revenue_b2c_emergency_contacts'),
    ('revenue_b2c_family_instructions'),('revenue_b2c_service_requirements'),('revenue_b2c_needs_assessments'),
    ('revenue_b2c_consultations'),('revenue_b2c_service_recommendations'),('revenue_b2c_matching_cycles'),
    ('revenue_b2c_matching_candidates'),('revenue_b2c_matching_decisions'),('revenue_b2c_onboarding_plans'),
    ('revenue_b2c_onboarding_items'),('revenue_b2c_activation_gates'),('revenue_b2c_care_starts'),
    ('revenue_b2c_satisfaction_checks'),('revenue_b2c_complaints'),('revenue_b2c_retention_risks'),
    ('revenue_b2c_retention_plans'),('revenue_b2c_recovery_plans'),('revenue_b2c_recovery_checkpoints'),
    ('revenue_b2c_status_history'),('revenue_b2c_evidence'),('revenue_b2c_closures')
)
select
  r.name,
  case when c.oid is not null then 'PASS' else 'FAIL' end as table_status,
  case when c.relrowsecurity then 'PASS' else 'FAIL' end as rls_status,
  count(p.policyname) as policy_count
from required_tables r
left join pg_class c on c.oid=to_regclass('public.'||r.name)
left join pg_policies p on p.schemaname='public' and p.tablename=r.name
group by r.name,c.oid,c.relrowsecurity
order by r.name;

select
  to_regclass('public.revenue_b2c_command_view') is not null as command_view_present,
  to_regclass('public.revenue_b2c_matching_command_view') is not null as matching_view_present,
  to_regclass('public.revenue_b2c_retention_command_view') is not null as retention_view_present,
  to_regprocedure('public.revenue_evaluate_b2c_activation(uuid,uuid)') is not null as activation_function_present,
  to_regprocedure('public.revenue_authorize_b2c_activation(uuid,uuid,text,text)') is not null as authorization_function_present,
  to_regprocedure('public.revenue_accept_b2c_match(uuid,uuid,uuid,text,date)') is not null as matching_function_present;

select
  (select count(*) from public.revenue_b2c_cases) as case_count,
  (select count(*) from public.revenue_b2c_guardians) as guardian_count,
  (select count(*) from public.revenue_b2c_beneficiaries) as beneficiary_count,
  (select count(*) from public.revenue_b2c_matching_cycles) as matching_cycle_count,
  (select count(*) from public.revenue_b2c_activation_gates) as activation_gate_count,
  (select count(*) from public.revenue_b2c_status_history) as history_count;
