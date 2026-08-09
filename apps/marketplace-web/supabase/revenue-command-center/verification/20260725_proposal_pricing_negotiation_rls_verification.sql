-- Mega ZIP 6 post-migration verification
select 'TABLE' as object_type,t.table_name,
       case when c.relrowsecurity then 'PASS' else 'FAIL_RLS_DISABLED' end as result
from information_schema.tables t
join pg_class c on c.relname=t.table_name
join pg_namespace n on n.oid=c.relnamespace and n.nspname=t.table_schema
where t.table_schema='public' and t.table_name=any(array[
'revenue_proposals','revenue_proposal_versions','revenue_proposal_sections','revenue_proposal_line_items','revenue_pricing_scenarios','revenue_proposal_approval_requests','revenue_discount_requests','revenue_margin_exceptions','revenue_proposal_documents','revenue_proposal_recipients','revenue_proposal_transmissions','revenue_proposal_delivery_events','revenue_proposal_responses','revenue_negotiations','revenue_negotiation_rounds','revenue_negotiation_positions','revenue_proposal_objections','revenue_counteroffers','revenue_concession_requests','revenue_negotiation_decisions','revenue_proposal_status_history','revenue_commercial_outcomes','revenue_contract_handoffs'])
order by t.table_name;

select 'VIEW' as object_type,name as object_name,case when to_regclass('public.'||name) is not null then 'PASS' else 'FAIL' end as result
from unnest(array['revenue_proposal_command_view','revenue_negotiation_command_view']) name;

select 'FUNCTION' as object_type,name as object_name,
       case when to_regprocedure('public.'||name) is not null then 'PASS' else 'FAIL' end as result
from unnest(array[
'revenue_recalculate_proposal(uuid)',
'revenue_create_proposal_version(uuid,text,text,text,uuid)',
'revenue_apply_commercial_outcome(uuid,jsonb,uuid)'
]) name;

select 'COUNTS' as check_group,
  (select count(*) from public.revenue_proposals) as proposal_count,
  (select count(*) from public.revenue_proposal_versions) as version_count,
  (select count(*) from public.revenue_negotiations) as negotiation_count,
  (select count(*) from public.revenue_proposal_status_history) as status_history_count,
  (select count(*) from public.revenue_contract_handoffs) as contract_handoff_count;

select 'LEGACY_PROSPECT_ID' as check_group,
       c.udt_name as actual_type,
       case when c.udt_name='text' then 'PASS' else 'FAIL' end as result
from information_schema.columns c where c.table_schema='public' and c.table_name='revenue_prospects' and c.column_name='id';
