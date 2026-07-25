-- ANGELCARE Revenue Command Center
-- READ-ONLY live-schema reconciliation: Prospect / Account / Contact / Opportunity Phase 2
-- This script performs no INSERT, UPDATE, DELETE, ALTER, CREATE or DROP operation.

with required_tables(table_name) as (
  values
    ('revenue_accounts'),
    ('revenue_contacts'),
    ('revenue_prospects'),
    ('revenue_opportunities'),
    ('revenue_tasks'),
    ('revenue_appointments'),
    ('revenue_activities'),
    ('revenue_command_action_logs')
), table_inventory as (
  select
    r.table_name,
    to_regclass('public.' || r.table_name) is not null as present,
    coalesce(c.reltuples::bigint, 0) as estimated_rows,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from required_tables r
  left join pg_class c on c.oid = to_regclass('public.' || r.table_name)
)
select 'TABLE' as object_type, table_name as object_name,
       case when present then 'READY' else 'MISSING' end as status,
       jsonb_build_object('estimated_rows', estimated_rows, 'rls_enabled', rls_enabled) as details
from table_inventory
order by table_name;

with expected_columns(table_name, column_name, expected_type) as (
  values
    ('revenue_accounts','id','uuid'),
    ('revenue_accounts','account_name','text'),
    ('revenue_contacts','id','uuid'),
    ('revenue_contacts','account_id','uuid'),
    ('revenue_prospects','id','uuid'),
    ('revenue_prospects','account_id','uuid'),
    ('revenue_prospects','contact_id','uuid'),
    ('revenue_prospects','name','text'),
    ('revenue_prospects','stage','text'),
    ('revenue_opportunities','id','uuid'),
    ('revenue_opportunities','prospect_id','uuid'),
    ('revenue_opportunities','account_id','uuid'),
    ('revenue_tasks','id','uuid'),
    ('revenue_tasks','prospect_id','uuid'),
    ('revenue_tasks','entity_type','text'),
    ('revenue_tasks','entity_id','text_or_uuid'),
    ('revenue_tasks','status','text'),
    ('revenue_tasks','due_date','timestamp_or_date'),
    ('revenue_appointments','id','uuid'),
    ('revenue_appointments','prospect_id','uuid'),
    ('revenue_appointments','entity_type','text'),
    ('revenue_appointments','entity_id','text_or_uuid'),
    ('revenue_appointments','status','text'),
    ('revenue_appointments','appointment_at','timestamp with time zone')
), actual as (
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema = 'public'
)
select
  'COLUMN' as object_type,
  e.table_name || '.' || e.column_name as object_name,
  case
    when a.column_name is null then 'MISSING'
    when e.expected_type = 'text_or_uuid' and a.data_type in ('text', 'uuid') then 'READY'
    when e.expected_type = 'timestamp_or_date' and a.data_type in ('date', 'timestamp with time zone', 'timestamp without time zone') then 'READY'
    when a.data_type <> e.expected_type then 'TYPE_DRIFT'
    else 'READY'
  end as status,
  jsonb_build_object('expected_type', e.expected_type, 'actual_type', a.data_type) as details
from expected_columns e
left join actual a using (table_name, column_name)
order by e.table_name, e.column_name;

select
  'FOREIGN_KEY' as object_type,
  con.conname as object_name,
  'PRESENT' as status,
  jsonb_build_object(
    'table', con.conrelid::regclass::text,
    'definition', pg_get_constraintdef(con.oid)
  ) as details
from pg_constraint con
where con.contype = 'f'
  and con.connamespace = 'public'::regnamespace
  and con.conrelid in (
    to_regclass('public.revenue_contacts'),
    to_regclass('public.revenue_prospects'),
    to_regclass('public.revenue_opportunities'),
    to_regclass('public.revenue_tasks'),
    to_regclass('public.revenue_appointments')
  )
order by con.conrelid::regclass::text, con.conname;

select
  'POLICY' as object_type,
  schemaname || '.' || tablename || '.' || policyname as object_name,
  cmd as status,
  jsonb_build_object('roles', roles, 'qual', qual, 'with_check', with_check) as details
from pg_policies
where schemaname = 'public'
  and tablename like 'revenue_%'
order by tablename, policyname;

select
  'INDEX' as object_type,
  schemaname || '.' || tablename || '.' || indexname as object_name,
  'PRESENT' as status,
  jsonb_build_object('definition', indexdef) as details
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'revenue_accounts',
    'revenue_contacts',
    'revenue_prospects',
    'revenue_opportunities',
    'revenue_tasks',
    'revenue_appointments'
  )
order by tablename, indexname;

-- Critical conflict detector: the repository contains both a legacy text-id definition
-- and a UUID canonical definition for revenue_prospects. This result must be READY before migration.
select
  'CUTOVER_GATE' as object_type,
  'public.revenue_prospects.id_uuid_contract' as object_name,
  case when data_type = 'uuid' then 'READY' else 'BLOCKED' end as status,
  jsonb_build_object(
    'actual_type', data_type,
    'required_action', case when data_type = 'uuid'
      then 'Phase 2 additive migration may proceed after backup and policy review.'
      else 'Stop. Produce an approved legacy text-id to UUID mapping, FK rewrite, backfill and rollback plan.'
    end
  ) as details
from information_schema.columns
where table_schema = 'public' and table_name = 'revenue_prospects' and column_name = 'id';
