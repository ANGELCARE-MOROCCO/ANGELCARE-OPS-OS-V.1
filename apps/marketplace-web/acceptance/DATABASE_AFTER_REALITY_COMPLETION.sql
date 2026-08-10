-- ANGELCARE Marketplace Reality Completion — hard database postflight
-- Read-only acceptance. Raises on any missing table/column/RLS contract.
do $$
declare
  required_table text;
  missing text[] := '{}';
  rls_missing text[] := '{}';
  scope_missing text[] := '{}';
  direct_grant_count integer := 0;
begin
  foreach required_table in array array[
    'angelcare_marketplace_growth_execution_cases',
    'angelcare_marketplace_qa_defect_cases',
    'angelcare_marketplace_intelligence_signal_cases',
    'angelcare_marketplace_performance_incident_cases',
    'angelcare_marketplace_security_incident_cases_v2',
    'angelcare_marketplace_trust_investigation_cases',
    'angelcare_marketplace_release_execution_cases',
    'angelcare_marketplace_reality_command_events'
  ] loop
    if to_regclass('public.' || required_table) is null then
      missing := array_append(missing, required_table);
      continue;
    end if;

    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=required_table and c.relrowsecurity
    ) then
      rls_missing := array_append(rls_missing, required_table);
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=required_table and column_name='territory_id'
    ) or not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=required_table and column_name='tenant_id'
    ) then
      scope_missing := array_append(scope_missing, required_table);
    end if;
  end loop;

  if cardinality(missing)>0 then
    raise exception 'REALITY COMPLETION POSTFLIGHT FAILED — missing tables: %', array_to_string(missing, ', ');
  end if;
  if cardinality(rls_missing)>0 then
    raise exception 'REALITY COMPLETION POSTFLIGHT FAILED — RLS disabled: %', array_to_string(rls_missing, ', ');
  end if;
  if cardinality(scope_missing)>0 then
    raise exception 'REALITY COMPLETION POSTFLIGHT FAILED — missing tenant/territory scope columns: %', array_to_string(scope_missing, ', ');
  end if;

  select count(*) into direct_grant_count
  from information_schema.role_table_grants
  where table_schema='public'
    and table_name in (
      'angelcare_marketplace_growth_execution_cases','angelcare_marketplace_qa_defect_cases',
      'angelcare_marketplace_intelligence_signal_cases','angelcare_marketplace_performance_incident_cases',
      'angelcare_marketplace_security_incident_cases_v2','angelcare_marketplace_trust_investigation_cases',
      'angelcare_marketplace_release_execution_cases','angelcare_marketplace_reality_command_events'
    )
    and grantee in ('anon','authenticated','PUBLIC');

  if direct_grant_count > 0 then
    raise exception 'REALITY COMPLETION POSTFLIGHT FAILED — direct browser grants found: %', direct_grant_count;
  end if;
end $$;

select
  'PASS'::text as reality_completion_database_acceptance,
  8::integer as specialist_tables,
  now() as checked_at;
