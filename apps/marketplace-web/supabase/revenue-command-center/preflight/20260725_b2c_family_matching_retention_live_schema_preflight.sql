-- Mega ZIP 9 — read-only live-schema preflight
with required_objects(name,kind) as (
  values
    ('revenue_b2c_cases','table'),
    ('revenue_tasks','table'),
    ('revenue_appointments','table'),
    ('revenue_proposals','table'),
    ('revenue_contracts','table'),
    ('revenue_payment_confirmations','table'),
    ('revenue_operational_handoffs','table')
),
object_state as (
  select name,kind,to_regclass('public.'||name) is not null as present from required_objects
),
identity_state as (
  select
    (select data_type from information_schema.columns where table_schema='public' and table_name='revenue_b2c_cases' and column_name='id') as b2c_id_type,
    (select data_type from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') as prospect_id_type,
    (select data_type from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id') as task_id_type,
    (select data_type from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='id') as appointment_id_type
),
phase9_tables(name) as (
  values
    ('revenue_b2c_guardians'),('revenue_b2c_beneficiaries'),('revenue_b2c_emergency_contacts'),
    ('revenue_b2c_family_instructions'),('revenue_b2c_service_requirements'),('revenue_b2c_needs_assessments'),
    ('revenue_b2c_consultations'),('revenue_b2c_service_recommendations'),('revenue_b2c_matching_cycles'),
    ('revenue_b2c_matching_candidates'),('revenue_b2c_matching_decisions'),('revenue_b2c_onboarding_plans'),
    ('revenue_b2c_onboarding_items'),('revenue_b2c_activation_gates'),('revenue_b2c_care_starts'),
    ('revenue_b2c_satisfaction_checks'),('revenue_b2c_complaints'),('revenue_b2c_retention_risks'),
    ('revenue_b2c_retention_plans'),('revenue_b2c_recovery_plans'),('revenue_b2c_recovery_checkpoints'),
    ('revenue_b2c_status_history'),('revenue_b2c_evidence'),('revenue_b2c_closures')
),
phase9_state as (
  select count(*) filter(where to_regclass('public.'||name) is not null) as present_count,count(*) as expected_count from phase9_tables
),
b2c_columns as (
  select column_name,data_type,is_nullable,column_default
  from information_schema.columns
  where table_schema='public' and table_name='revenue_b2c_cases'
),
compatibility_state as (
  select
    exists(select 1 from b2c_columns where column_name='owner_id') as has_owner_id,
    exists(select 1 from b2c_columns where column_name='owner') as has_owner,
    not exists(
      select 1
      from (values
        ('parent_name'),('city'),('service_interest'),('stage'),('estimated_value_mad'),
        ('phone'),('email'),('status'),('created_at'),('updated_at')
      ) required(column_name)
      where not exists(select 1 from b2c_columns c where c.column_name=required.column_name)
    ) as has_required_legacy_columns
)
select 'OBJECT' as check_type,name as object_name,
  case when present then 'PASS' else 'BLOCKED' end as status,
  jsonb_build_object('kind',kind) as details
from object_state
union all
select 'IDENTITY','public.revenue_b2c_cases.id',
  case when b2c_id_type='uuid' then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('data_type',b2c_id_type)
from identity_state
union all
select 'IDENTITY','public.revenue_prospects.id',
  case when prospect_id_type='text' then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('data_type',prospect_id_type,'required_contract','legacy TEXT identity preserved')
from identity_state
union all
select 'IDENTITY','public.revenue_tasks.id',
  case when task_id_type='uuid' then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('data_type',task_id_type)
from identity_state
union all
select 'IDENTITY','public.revenue_appointments.id',
  case when appointment_id_type='uuid' then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('data_type',appointment_id_type)
from identity_state
union all
select 'COMPATIBILITY','public.revenue_b2c_cases.owner',
  case when has_owner_id or has_owner then 'PASS' else 'BLOCKED' end,
  jsonb_build_object(
    'owner_id_present',has_owner_id,
    'owner_present',has_owner,
    'migration_behavior','owner_id is preferred; legacy owner is supported'
  )
from compatibility_state
union all
select 'COMPATIBILITY','public.revenue_b2c_cases.legacy_core_columns',
  case when has_required_legacy_columns then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('required',jsonb_build_array(
    'parent_name','city','service_interest','stage','estimated_value_mad',
    'phone','email','status','created_at','updated_at'
  ))
from compatibility_state
union all
select 'PHASE9_STATE','support_tables',
  case when present_count in (0,expected_count) then 'PASS' else 'BLOCKED' end,
  jsonb_build_object('present',present_count,'expected',expected_count,'rule','all missing or all present; partial installation is blocked')
from phase9_state
union all
select 'COLUMN','revenue_b2c_cases.'||column_name,'PRESENT',
  jsonb_build_object('data_type',data_type,'nullable',is_nullable,'default',column_default)
from b2c_columns
order by check_type,object_name;

with gates as (
  select
    to_regclass('public.revenue_b2c_cases') is not null as b2c_cases,
    to_regclass('public.revenue_tasks') is not null as tasks,
    to_regclass('public.revenue_appointments') is not null as appointments,
    to_regclass('public.revenue_proposals') is not null as proposals,
    to_regclass('public.revenue_contracts') is not null as contracts,
    to_regclass('public.revenue_payment_confirmations') is not null as payments,
    to_regclass('public.revenue_operational_handoffs') is not null as handoffs,
    (select data_type='uuid' from information_schema.columns where table_schema='public' and table_name='revenue_b2c_cases' and column_name='id') as b2c_uuid,
    (select data_type='text' from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') as prospect_text,
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_b2c_cases' and column_name in ('owner_id','owner')) as owner_compatible,
    not exists(
      select 1
      from (values
        ('parent_name'),('city'),('service_interest'),('stage'),('estimated_value_mad'),
        ('phone'),('email'),('status'),('created_at'),('updated_at')
      ) required(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='revenue_b2c_cases' and c.column_name=required.column_name
      )
    ) as core_columns_compatible
),
partial as (
  select count(*) filter(where to_regclass('public.'||name) is not null) as present_count
  from (values
    ('revenue_b2c_guardians'),('revenue_b2c_beneficiaries'),('revenue_b2c_service_requirements'),
    ('revenue_b2c_matching_cycles'),('revenue_b2c_activation_gates'),('revenue_b2c_status_history')
  ) t(name)
)
select
  'CUTOVER_GATE' as check_type,
  'MEGA_ZIP_9' as object_name,
  case when b2c_cases and tasks and appointments and proposals and contracts and payments and handoffs
    and b2c_uuid and prospect_text and owner_compatible and core_columns_compatible
    and present_count in (0,6) then 'READY' else 'BLOCKED' end as status,
  jsonb_build_object(
    'b2c_cases',b2c_cases,'tasks',tasks,'appointments',appointments,'proposals',proposals,
    'contracts',contracts,'payments',payments,'handoffs',handoffs,'b2c_uuid',b2c_uuid,
    'prospect_text',prospect_text,'owner_compatible',owner_compatible,
    'core_columns_compatible',core_columns_compatible,
    'representative_phase9_tables_present',present_count
  ) as details
from gates,partial;
