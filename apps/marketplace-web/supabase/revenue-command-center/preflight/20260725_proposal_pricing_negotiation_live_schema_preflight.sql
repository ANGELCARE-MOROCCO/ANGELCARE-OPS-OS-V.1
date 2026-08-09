-- ANGELCARE Revenue Command Center — Mega ZIP 6 read-only production preflight
-- No mutation. Proceed only when the final CUTOVER_GATE row is READY.

with required as (
  select * from (values
    ('public.revenue_prospects','text'),
    ('public.revenue_accounts','uuid'),
    ('public.revenue_contacts','uuid'),
    ('public.revenue_opportunities','uuid'),
    ('public.revenue_tasks','uuid'),
    ('public.revenue_appointments','uuid'),
    ('public.revenue_meeting_outcomes','uuid'),
    ('public.revenue_communication_events','uuid')
  ) as x(object_name,expected_id_type)
), inspected as (
  select r.object_name,r.expected_id_type,
         to_regclass(r.object_name) is not null as present,
         (select c.udt_name from information_schema.columns c
          where c.table_schema=split_part(r.object_name,'.',1)
            and c.table_name=split_part(r.object_name,'.',2)
            and c.column_name='id') as actual_id_type
  from required r
)
select 'FOUNDATION' as check_group,object_name,
       case when not present then 'MISSING' when actual_id_type=expected_id_type then 'PASS' else 'TYPE_MISMATCH' end as result,
       jsonb_build_object('expected_id_type',expected_id_type,'actual_id_type',actual_id_type) as details
from inspected
order by object_name;

with objects(name) as (values
  ('revenue_proposals'),('revenue_proposal_versions'),('revenue_proposal_sections'),('revenue_proposal_line_items'),
  ('revenue_pricing_scenarios'),('revenue_proposal_approval_requests'),('revenue_discount_requests'),('revenue_margin_exceptions'),
  ('revenue_proposal_documents'),('revenue_proposal_recipients'),('revenue_proposal_transmissions'),('revenue_proposal_delivery_events'),
  ('revenue_proposal_responses'),('revenue_negotiations'),('revenue_negotiation_rounds'),('revenue_negotiation_positions'),
  ('revenue_proposal_objections'),('revenue_counteroffers'),('revenue_concession_requests'),('revenue_negotiation_decisions'),
  ('revenue_proposal_status_history'),('revenue_commercial_outcomes'),('revenue_contract_handoffs')
)
select 'PROPOSAL_OBJECT' as check_group,name as object_name,
       case when to_regclass('public.'||name) is null then 'AVAILABLE_TO_CREATE'
            when exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=name and c.column_name='id' and c.udt_name='uuid') then 'COMPATIBLE_PRESENT'
            else 'INCOMPATIBLE_PRESENT' end as result
from objects order by name;

select 'LEGACY_ID_CONTRACT' as check_group,
       'public.revenue_prospects.id' as object_name,
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id' and udt_name='text') then 'PASS' else 'BLOCKED' end as result,
       jsonb_build_object('required','text','reason','247 production prospects include non-UUID legacy identifiers') as details;

with foundation as (
  select count(*) filter(where to_regclass(object_name) is null or actual_type is distinct from expected_type) as failures
  from (
    select object_name,expected_type,
      (select c.udt_name from information_schema.columns c where c.table_schema='public' and c.table_name=split_part(object_name,'.',2) and c.column_name='id') actual_type
    from (values
      ('public.revenue_prospects','text'),('public.revenue_accounts','uuid'),('public.revenue_contacts','uuid'),
      ('public.revenue_opportunities','uuid'),('public.revenue_tasks','uuid'),('public.revenue_appointments','uuid'),
      ('public.revenue_meeting_outcomes','uuid'),('public.revenue_communication_events','uuid')
    ) f(object_name,expected_type)
  ) x
), objects(name) as (values
  ('revenue_proposals'),('revenue_proposal_versions'),('revenue_proposal_sections'),('revenue_proposal_line_items'),
  ('revenue_pricing_scenarios'),('revenue_proposal_approval_requests'),('revenue_discount_requests'),('revenue_margin_exceptions'),
  ('revenue_proposal_documents'),('revenue_proposal_recipients'),('revenue_proposal_transmissions'),('revenue_proposal_delivery_events'),
  ('revenue_proposal_responses'),('revenue_negotiations'),('revenue_negotiation_rounds'),('revenue_negotiation_positions'),
  ('revenue_proposal_objections'),('revenue_counteroffers'),('revenue_concession_requests'),('revenue_negotiation_decisions'),
  ('revenue_proposal_status_history'),('revenue_commercial_outcomes'),('revenue_contract_handoffs')
), object_state as (
  select count(*) filter(where to_regclass('public.'||name) is not null) present_count,
         count(*) filter(where to_regclass('public.'||name) is not null and not exists(
           select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=name and c.column_name='id' and c.udt_name='uuid'
         )) incompatible_count,
         count(*) total_count
  from objects
)
select 'CUTOVER_GATE' as check_group,
       case when foundation.failures=0
                  and object_state.incompatible_count=0
                  and object_state.present_count in (0,object_state.total_count)
            then 'READY' else 'BLOCKED' end as result,
       jsonb_build_object(
         'mode',case when object_state.present_count=0 then 'FRESH_INSTALL' when object_state.present_count=object_state.total_count then 'COMPATIBLE_REAPPLY' else 'PARTIAL_SCHEMA_RECONCILIATION_REQUIRED' end,
         'foundation_failures',foundation.failures,
         'proposal_objects_present',object_state.present_count,
         'proposal_objects_expected',object_state.total_count,
         'incompatible_objects',object_state.incompatible_count,
         'instruction','Apply only after backup, review and a READY result.'
       ) as details
from foundation cross join object_state;
