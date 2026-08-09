-- Read-only preflight. Run in Supabase SQL Editor before the migration.
select current_database() as database_name, now() as checked_at;

select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'hr_onboarding_journeys',
    'hr_onboarding_tasks',
    'hr_onboarding_documents',
    'hr_onboarding_activity',
    'hr_onboarding_checklists',
    'hr_onboarding_checklist_assignments',
    'hr_onboarding_idempotency'
  )
order by table_name;

select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'hr_onboarding_journeys',
    'hr_onboarding_tasks',
    'hr_onboarding_documents',
    'hr_onboarding_activity',
    'hr_onboarding_checklists'
  )
order by table_name, ordinal_position;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename like 'hr_onboarding%'
order by tablename, policyname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename like 'hr_onboarding%'
order by tablename, indexname;
