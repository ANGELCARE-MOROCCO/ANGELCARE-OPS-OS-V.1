-- ANGELCARE Revenue Command Center
-- READ-ONLY live-schema reconciliation: Prospect / Account / Contact / Opportunity Phase 2.
-- Production compatibility contract: public.revenue_prospects.id remains TEXT.
-- This script performs no INSERT, UPDATE, DELETE, ALTER, CREATE, DROP or TRUNCATE operation.

with required_legacy_tables(table_name) as (
  values ('revenue_contacts'),('revenue_prospects'),('revenue_tasks'),('revenue_appointments'),('revenue_activities'),('revenue_command_action_logs')
), optional_enterprise_tables(table_name) as (
  values ('revenue_accounts'),('revenue_opportunities')
), inventory as (
  select table_name,true as required from required_legacy_tables
  union all select table_name,false from optional_enterprise_tables
)
select 'TABLE' as object_type,i.table_name as object_name,
       case when to_regclass('public.'||i.table_name) is not null then 'READY' when i.required then 'MISSING' else 'WILL_INSTALL' end as status,
       jsonb_build_object('required_before_migration',i.required,'rls_enabled',coalesce(c.relrowsecurity,false),'estimated_rows',coalesce(c.reltuples::bigint,0)) as details
from inventory i left join pg_class c on c.oid=to_regclass('public.'||i.table_name)
order by i.required desc,i.table_name;

with expected_columns(table_name,column_name,expected_type) as (
  values
    ('revenue_prospects','id','text'),('revenue_prospects','name','text'),('revenue_prospects','stage','text'),
    ('revenue_contacts','id','uuid'),('revenue_tasks','id','uuid'),('revenue_tasks','entity_id','text_or_uuid'),
    ('revenue_tasks','due_date','timestamp_or_date'),('revenue_appointments','id','uuid'),
    ('revenue_appointments','entity_id','text_or_uuid'),('revenue_appointments','appointment_at','timestamp_or_date')
), actual as (
  select table_name,column_name,data_type,udt_name from information_schema.columns where table_schema='public'
)
select 'COLUMN' as object_type,e.table_name||'.'||e.column_name as object_name,
       case when a.column_name is null then 'MISSING'
            when e.expected_type='text_or_uuid' and a.udt_name in ('text','uuid') then 'READY'
            when e.expected_type='timestamp_or_date' and a.data_type in ('date','timestamp with time zone','timestamp without time zone') then 'READY'
            when a.udt_name<>e.expected_type and a.data_type<>e.expected_type then 'TYPE_DRIFT'
            else 'READY' end as status,
       jsonb_build_object('expected_type',e.expected_type,'actual_type',coalesce(a.udt_name,a.data_type)) as details
from expected_columns e left join actual a using(table_name,column_name)
order by e.table_name,e.column_name;

with missing as (
  select table_name from (values ('revenue_contacts'),('revenue_prospects'),('revenue_tasks'),('revenue_appointments'),('revenue_activities'),('revenue_command_action_logs')) v(table_name)
  where to_regclass('public.'||table_name) is null
), contract as (
  select
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') prospect_id_type,
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id') task_id_type,
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='id') appointment_id_type
)
select 'CUTOVER_GATE' as object_type,'public.revenue_prospects.id_text_compatibility_contract' as object_name,
       case when exists(select 1 from missing) then 'BLOCKED'
            when (select prospect_id_type from contract)<>'text' then 'BLOCKED'
            when (select task_id_type from contract)<>'uuid' then 'BLOCKED'
            when (select appointment_id_type from contract)<>'uuid' then 'BLOCKED'
            else 'READY' end as status,
       jsonb_build_object(
         'missing_required_tables',(select coalesce(jsonb_agg(table_name),'[]'::jsonb) from missing),
         'prospect_id_type',(select prospect_id_type from contract),
         'task_id_type',(select task_id_type from contract),
         'appointment_id_type',(select appointment_id_type from contract),
         'required_action','Keep legacy prospect IDs as TEXT; establish UUID enterprise entities linked through TEXT prospect_id columns.'
       ) as details;
