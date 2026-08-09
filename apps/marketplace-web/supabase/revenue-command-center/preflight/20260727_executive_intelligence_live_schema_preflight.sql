-- ANGELCARE Revenue Command Center — Mega ZIP 11 read-only live-schema preflight
-- This script never mutates data.
with required_relations(name) as (
  values
    ('revenue_opportunities'),
    ('revenue_proposals'),
    ('revenue_contracts'),
    ('revenue_payment_requirements'),
    ('revenue_payment_confirmations'),
    ('revenue_realization_events'),
    ('revenue_tasks')
),
required_presence as (
  select r.name,
         to_regclass('public.' || r.name) is not null as present
  from required_relations r
),
prospect_contract as (
  select
    exists (
      select 1 from information_schema.columns
      where table_schema='public'
        and table_name='revenue_prospects'
        and column_name='id'
        and data_type='text'
    ) as text_identity_preserved
),
phase11_tables as (
  select count(*)::integer as present
  from information_schema.tables
  where table_schema='public'
    and table_type='BASE TABLE'
    and table_name like 'revenue_executive_%'
),
legacy_bridges as (
  select jsonb_agg(table_name order by table_name) as available
  from information_schema.tables
  where table_schema='public'
    and (
      table_name like 'bd_%forecast%'
      or table_name like 'browser_extension_b2b_forecast%'
      or table_name like 'revenue_os_%scenario%'
      or table_name like 'opsos_%briefing%'
    )
),
result as (
  select
    (select bool_and(present) from required_presence) as canonical_relations_ready,
    (select text_identity_preserved from prospect_contract) as prospect_text_identity_ready,
    (select present from phase11_tables) as phase11_support_tables_present,
    (select available from legacy_bridges) as legacy_bridge_inventory,
    (select jsonb_agg(jsonb_build_object('relation',name,'present',present) order by name) from required_presence) as required_relation_inventory
)
select
  *,
  case
    when not canonical_relations_ready then 'BLOCKED_CANONICAL_RELATIONS'
    when not prospect_text_identity_ready then 'BLOCKED_PROSPECT_IDENTITY'
    when phase11_support_tables_present not in (0,29) then 'BLOCKED_PARTIAL_PHASE11_INSTALLATION'
    else 'READY'
  end as cutover_gate
from result;
