-- ANGELCARE Marketplace Reality Completion — database preflight
-- Read-only. Must pass before applying 20260810110000_...migration.sql.
do $$
declare
  missing text[] := '{}';
  required_table text;
begin
  foreach required_table in array array[
    'app_users',
    'angelcare_marketplace_workspace_access',
    'angelcare_marketplace_academy_remediations',
    'angelcare_marketplace_homepage_release_dossiers',
    'angelcare_marketplace_operating_cases',
    'angelcare_marketplace_operating_timeline',
    'angelcare_marketplace_academy_cohorts',
    'angelcare_marketplace_provider_operational_eligibility',
    'angelcare_marketplace_audit_log'
  ] loop
    if to_regclass('public.' || required_table) is null then
      missing := array_append(missing, required_table);
    end if;
  end loop;
  if cardinality(missing) > 0 then
    raise exception 'REALITY COMPLETION PREFLIGHT FAILED — missing baseline tables: %', array_to_string(missing, ', ');
  end if;
end $$;

select
  'PASS'::text as reality_completion_preflight,
  current_database() as database_name,
  now() as checked_at;
