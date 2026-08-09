-- Mega ZIP 8 RLS and object verification.

with required_tables(name) as (
  values
    ('revenue_partnership_stakeholders'),('revenue_partnership_qualifications'),
    ('revenue_partner_programs'),('revenue_partner_program_locations'),('revenue_partner_program_service_lines'),
    ('revenue_partner_benefits'),('revenue_partner_benefit_usage'),('revenue_partnership_obligations'),
    ('revenue_partnership_milestones'),('revenue_partner_activation_plans'),('revenue_partner_activation_gates'),
    ('revenue_partner_referrals'),('revenue_partner_referral_status_history'),
    ('revenue_partner_referral_attributions'),('revenue_partner_attribution_conflicts'),
    ('revenue_partner_performance_periods'),('revenue_partner_performance_metrics'),
    ('revenue_partner_scorecards'),('revenue_partner_reviews'),('revenue_partner_recovery_plans'),
    ('revenue_partner_recovery_checkpoints'),('revenue_partner_renewal_readiness'),
    ('revenue_partner_expansions'),('revenue_partnership_status_history'),
    ('revenue_partnership_risks'),('revenue_partnership_closures')
)
select
  name as table_name,
  case when to_regclass('public.'||name) is not null then 'PASS' else 'MISSING' end as table_status,
  case when c.relrowsecurity then 'PASS' else 'FAIL' end as rls_status,
  coalesce((select count(*) from pg_policies p where p.schemaname='public' and p.tablename=name and p.cmd='SELECT'),0) as select_policy_count
from required_tables
left join pg_class c on c.oid=to_regclass('public.'||name)
order by name;

select
  to_regclass('public.revenue_partnership_command_view') is not null as partnership_view_present,
  to_regclass('public.revenue_partner_referral_command_view') is not null as referral_view_present,
  to_regclass('public.revenue_partner_performance_command_view') is not null as performance_view_present,
  to_regprocedure('public.revenue_accept_partner_referral(uuid,uuid,boolean,text)') is not null as accept_referral_command_present,
  to_regprocedure('public.revenue_create_partner_attribution(uuid,text,text,numeric,numeric,text,text,uuid)') is not null as attribution_command_present,
  to_regprocedure('public.revenue_close_partner_performance_period(uuid,uuid,text,text,text)') is not null as performance_close_command_present,
  to_regprocedure('public.revenue_evaluate_partner_activation(uuid,uuid,text,text)') is not null as activation_command_present,
  to_regprocedure('public.revenue_launch_partner_renewal_workflow(uuid,text,uuid,text)') is not null as renewal_workflow_command_present,
  to_regprocedure('public.revenue_partner_realization_reversal_trigger()') is not null as realization_reversal_trigger_function_present,
  exists(select 1 from pg_trigger where tgname='trg_revenue_partner_realization_reversal' and not tgisinternal) as realization_reversal_trigger_present;

select
  (select count(*) from public.revenue_partnerships) as partnership_count,
  (select count(*) from public.revenue_partner_referrals) as referral_count,
  (select count(*) from public.revenue_partner_referral_attributions) as attribution_count,
  (select count(*) from public.revenue_partner_performance_periods) as performance_period_count,
  (select count(*) from public.revenue_partner_scorecards) as scorecard_count,
  (select count(*) from public.revenue_partnership_risks where status='open') as open_risk_count;
