-- ANGELCARE HR Employee 360 — post-migration verification

select
  to_regclass('public.hr_staff_profiles') as canonical_staff,
  to_regclass('public.hr_employee_lifecycle_events') as lifecycle_events,
  to_regclass('public.hr_employee_360_audit_events') as audit_events,
  to_regclass('public.hr_employee_cases') as employee_cases,
  to_regclass('public.hr_employee_360_idempotency') as idempotency;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'hr-employee-documents';

select
  table_name,
  count(*) filter (where column_name = 'version') as has_version,
  count(*) filter (where column_name = 'archived_at') as has_archive,
  count(*) filter (where column_name in ('staff_id', 'employee_id')) as identity_columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'hr_leave_requests', 'hr_payroll_inputs', 'hr_roster_assignments',
    'hr_documents', 'hr_contracts', 'hr_onboarding_journeys',
    'hr_training_records', 'hr_performance_reviews', 'hr_attendance_records',
    'hr_attendance_corrections', 'hr_tasks', 'hr_approval_requests',
    'hr_incidents'
  )
group by table_name
order by table_name;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'hr_employee_lifecycle_events',
    'hr_employee_360_audit_events',
    'hr_employee_cases',
    'hr_employee_360_idempotency'
  )
order by c.relname;

select
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in ('hr_employee360_touch', 'hr_employee360_touch_profile')
order by event_object_table, trigger_name;

-- Legacy workspace rows are preserved as explicitly tagged cases.
select
  count(*) as legacy_cases_backfilled
from public.hr_employee_cases
where metadata->>'legacy' = 'true';
