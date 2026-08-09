with required(name) as (
  values
    ('revenue_contracts'),('revenue_contract_versions'),('revenue_contract_sections'),('revenue_contract_reviews'),
    ('revenue_contract_approvals'),('revenue_contract_signatories'),('revenue_signature_events'),('revenue_signature_evidence'),
    ('revenue_contract_conditions'),('revenue_condition_evidence'),('revenue_contract_obligations'),('revenue_obligation_events'),
    ('revenue_contract_milestones'),('revenue_payment_terms'),('revenue_payment_schedules'),('revenue_payment_requirements'),
    ('revenue_payment_promises'),('revenue_payment_promise_events'),('revenue_collection_actions'),('revenue_finance_handoffs'),
    ('revenue_payment_confirmations'),('revenue_activation_gates'),('revenue_activation_decisions'),('revenue_operational_handoffs'),
    ('revenue_realization_events'),('revenue_contract_risks'),('revenue_contract_status_history'),('revenue_contract_closures')
)
select r.name,
       case when c.relname is not null then 'PASS' else 'MISSING' end table_status,
       case when c.relrowsecurity then 'PASS' else 'FAIL' end rls_status,
       coalesce((select count(*) from pg_policies p where p.schemaname='public' and p.tablename=r.name),0) policy_count
from required r
left join pg_class c on c.oid=to_regclass('public.'||r.name)
order by r.name;

select routine_name,security_type
from information_schema.routines
where routine_schema='public' and routine_name in (
  'revenue_create_contract_from_handoff','revenue_create_contract_version','revenue_evaluate_contract_effectiveness',
  'revenue_evaluate_activation_gates','revenue_authorize_contract_activation','revenue_confirm_revenue_realization'
)
order by routine_name;

select
  to_regclass('public.revenue_contract_command_view') is not null as contract_view_present,
  to_regclass('public.revenue_activation_command_view') is not null as activation_view_present,
  to_regclass('public.revenue_realization_command_view') is not null as realization_view_present,
  (select count(*) from public.revenue_contracts) as contract_count,
  (select count(*) from public.revenue_contract_versions) as version_count,
  (select count(*) from public.revenue_contract_signatories) as signatory_count,
  (select count(*) from public.revenue_payment_confirmations) as payment_confirmation_count,
  (select count(*) from public.revenue_realization_events) as realization_event_count;
