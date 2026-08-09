-- ANGELCARE Revenue Command Excellence v5 / Mega ZIP 5
-- READ-ONLY live schema preflight. Run before the engagement migration.

with required_tables(name) as (
  values
    ('revenue_prospects'),('revenue_accounts'),('revenue_contacts'),('revenue_opportunities'),
    ('revenue_appointments'),('revenue_tasks'),('revenue_activities'),('revenue_command_action_logs')
), missing as (
  select name from required_tables where to_regclass('public.'||name) is null
), contracts as (
  select
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') as prospect_id_type,
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='id') as appointment_id_type,
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id') as task_id_type,
    (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='entity_id') as appointment_entity_id_type
)
select
  'CUTOVER_GATE' as object_type,
  'public.revenue_engagement_enterprise_contract' as object_name,
  case
    when exists(select 1 from missing) then 'BLOCKED'
    when (select prospect_id_type from contracts) <> 'text' then 'BLOCKED'
    when (select appointment_id_type from contracts) <> 'uuid' then 'BLOCKED'
    when (select task_id_type from contracts) <> 'uuid' then 'BLOCKED'
    when (select appointment_entity_id_type from contracts) <> 'text' then 'BLOCKED'
    else 'READY'
  end as status,
  jsonb_build_object(
    'missing_tables',(select coalesce(jsonb_agg(name),'[]'::jsonb) from missing),
    'prospect_id_type',(select prospect_id_type from contracts),
    'appointment_id_type',(select appointment_id_type from contracts),
    'task_id_type',(select task_id_type from contracts),
    'appointment_entity_id_type',(select appointment_entity_id_type from contracts),
    'required_action',case when exists(select 1 from missing) then 'Install the previous accepted Revenue Command phases before Mega ZIP 5.' else 'Backup, review RLS, then run the additive engagement migration.' end
  ) as details;

select table_name,
       (select relrowsecurity from pg_class where oid=to_regclass('public.'||table_name)) as rls_enabled
from information_schema.tables
where table_schema='public'
  and (table_name like 'revenue_appointment%' or table_name like 'revenue_meeting%' or table_name like 'revenue_communication%')
order by table_name;

select table_name,column_name,data_type,udt_name,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name='revenue_appointments'
order by ordinal_position;

select count(*) as appointment_count,
       count(*) filter (where status in ('scheduled','confirmation_pending','confirmed','prepared','live')) as active_appointment_count,
       count(*) filter (where prospect_id is not null) as linked_prospect_count
from public.revenue_appointments;
