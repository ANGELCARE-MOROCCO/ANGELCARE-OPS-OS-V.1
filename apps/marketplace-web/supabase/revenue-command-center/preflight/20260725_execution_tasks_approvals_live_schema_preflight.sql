-- ANGELCARE Revenue Command Center Excellence v4 / Mega ZIP 4
-- READ-ONLY production truth gate. Run before the additive migration.
with required_tables(name) as (values
 ('revenue_tasks'),('revenue_activities'),('revenue_command_action_logs'),('revenue_accounts'),('revenue_opportunities')
), inventory as (
 select r.name, to_regclass('public.'||r.name) as relation
 from required_tables r
), task_columns as (
 select column_name,data_type,udt_name,is_nullable
 from information_schema.columns
 where table_schema='public' and table_name='revenue_tasks'
), checks as (
 select 'required_table:'||name as check_name,
        case when relation is not null then 'READY' else 'BLOCKED' end as status,
        coalesce(relation::text,'missing') as evidence
 from inventory
 union all
 select 'revenue_tasks.id.uuid',
        case when exists(select 1 from task_columns where column_name='id' and udt_name='uuid') then 'READY' else 'BLOCKED' end,
        coalesce((select udt_name from task_columns where column_name='id'),'missing')
 union all
 select 'revenue_tasks.status',
        case when exists(select 1 from task_columns where column_name='status') then 'READY' else 'BLOCKED' end,
        coalesce((select data_type from task_columns where column_name='status'),'missing')
 union all
 select 'revenue_tasks.title',
        case when exists(select 1 from task_columns where column_name='title') then 'READY' else 'BLOCKED' end,
        coalesce((select data_type from task_columns where column_name='title'),'missing')
)
select * from checks order by check_name;

select case when exists(
  select 1 from (
    with required_tables(name) as (values ('revenue_tasks'),('revenue_activities'),('revenue_command_action_logs'),('revenue_accounts'),('revenue_opportunities'))
    select name from required_tables where to_regclass('public.'||name) is null
  ) missing
) or not exists(
  select 1 from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id' and udt_name='uuid'
) then 'BLOCKED' else 'READY' end as cutover_gate;

-- Existing execution-related objects. This result is informational and helps avoid duplicate tables.
select table_name
from information_schema.tables
where table_schema='public'
  and (table_name like 'revenue_task%' or table_name like 'revenue_%approval%' or table_name like 'revenue_%evidence%')
order by table_name;

select table_name,column_name,data_type,udt_name,is_nullable
from information_schema.columns
where table_schema='public' and table_name like 'revenue_task%'
order by table_name,ordinal_position;

select schemaname,tablename,policyname,cmd,roles
from pg_policies
where schemaname='public' and tablename like 'revenue_task%'
order by tablename,policyname;
