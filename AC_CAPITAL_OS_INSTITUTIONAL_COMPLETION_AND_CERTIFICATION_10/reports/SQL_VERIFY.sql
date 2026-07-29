\set ON_ERROR_STOP on

select 'IC10_TABLES' as gate, count(*) as value
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ac_capital_certification_runs',
    'ac_capital_certification_checks',
    'ac_capital_certification_evidence',
    'ac_capital_workspace_certifications',
    'ac_capital_scenario_certifications',
    'ac_capital_scenario_steps',
    'ac_capital_certification_signoffs'
  );

select 'IC10_WORKSPACES' as gate, count(*) as value
from public.ac_capital_workspace_certifications;

select 'IC10_SCENARIOS' as gate, count(*) as value
from public.ac_capital_scenario_certifications;

select 'IC10_SCENARIO_STEPS' as gate, count(*) as value
from public.ac_capital_scenario_steps;

select 'IC10_APPROVAL_TRIGGERS' as gate, count(*) as value
from pg_trigger
where not tgisinternal
  and tgname = 'ac_capital_ic10_supersede_approvals_trg';

select 'IC10_ARTIFACT_IMMUTABILITY_TRIGGER' as gate, count(*) as value
from pg_trigger
where not tgisinternal
  and tgname = 'ac_capital_ic10_protect_approved_artifact_trg';

select 'IC10_FUNCTIONS' as gate, count(*) as value
from pg_proc
where proname in (
  'ac_capital_ic10_supersede_approvals',
  'ac_capital_ic10_protect_approved_artifact',
  'ac_capital_ic10_record_submission',
  'ac_capital_ic10_decide_approval',
  'ac_capital_ic10_request_case_approval'
);


select 'IC10_READ_ONLY_RLS_POLICIES' as gate, count(*) as value
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ac_capital_certification_runs','ac_capital_certification_checks',
    'ac_capital_certification_evidence','ac_capital_workspace_certifications',
    'ac_capital_scenario_certifications','ac_capital_scenario_steps',
    'ac_capital_certification_signoffs'
  )
  and policyname like '%_authenticated_read'
  and cmd = 'SELECT';

select 'IC10_LIFECYCLE_VIEW' as gate, count(*) as value
from information_schema.views
where table_schema = 'public'
  and table_name = 'ac_capital_ic10_lifecycle_trace';

do $verify$
declare
  table_count integer;
  workspace_count integer;
  scenario_count integer;
  step_count integer;
  trigger_count integer;
  artifact_trigger_count integer;
  function_count integer;
  view_count integer;
  read_policy_count integer;
  write_policy_count integer;
begin
  select count(*) into table_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'ac_capital_certification_runs','ac_capital_certification_checks',
      'ac_capital_certification_evidence','ac_capital_workspace_certifications',
      'ac_capital_scenario_certifications','ac_capital_scenario_steps',
      'ac_capital_certification_signoffs'
    );
  select count(*) into workspace_count from public.ac_capital_workspace_certifications;
  select count(*) into scenario_count from public.ac_capital_scenario_certifications;
  select count(*) into step_count from public.ac_capital_scenario_steps;
  select count(*) into trigger_count from pg_trigger where not tgisinternal and tgname = 'ac_capital_ic10_supersede_approvals_trg';
  select count(*) into artifact_trigger_count from pg_trigger where not tgisinternal and tgname = 'ac_capital_ic10_protect_approved_artifact_trg';
  select count(*) into function_count from pg_proc where proname in ('ac_capital_ic10_supersede_approvals','ac_capital_ic10_protect_approved_artifact','ac_capital_ic10_record_submission','ac_capital_ic10_decide_approval','ac_capital_ic10_request_case_approval');
  select count(*) into view_count from information_schema.views where table_schema='public' and table_name='ac_capital_ic10_lifecycle_trace';
  select count(*) into read_policy_count from pg_policies where schemaname='public' and tablename in ('ac_capital_certification_runs','ac_capital_certification_checks','ac_capital_certification_evidence','ac_capital_workspace_certifications','ac_capital_scenario_certifications','ac_capital_scenario_steps','ac_capital_certification_signoffs') and policyname like '%_authenticated_read' and cmd='SELECT';
  select count(*) into write_policy_count from pg_policies where schemaname='public' and tablename in ('ac_capital_certification_runs','ac_capital_certification_checks','ac_capital_certification_evidence','ac_capital_workspace_certifications','ac_capital_scenario_certifications','ac_capital_scenario_steps','ac_capital_certification_signoffs') and cmd in ('INSERT','UPDATE','DELETE','ALL');

  if table_count <> 7 then raise exception 'IC10_TABLE_COUNT_EXPECTED_7_GOT_%', table_count; end if;
  if workspace_count <> 15 then raise exception 'IC10_WORKSPACE_COUNT_EXPECTED_15_GOT_%', workspace_count; end if;
  if scenario_count <> 8 then raise exception 'IC10_SCENARIO_COUNT_EXPECTED_8_GOT_%', scenario_count; end if;
  if step_count <> 45 then raise exception 'IC10_SCENARIO_STEP_COUNT_EXPECTED_45_GOT_%', step_count; end if;
  if trigger_count < 5 then raise exception 'IC10_APPROVAL_TRIGGER_COUNT_EXPECTED_AT_LEAST_5_GOT_%', trigger_count; end if;
  if artifact_trigger_count <> 1 then raise exception 'IC10_ARTIFACT_TRIGGER_EXPECTED_1_GOT_%', artifact_trigger_count; end if;
  if function_count <> 5 then raise exception 'IC10_FUNCTION_COUNT_EXPECTED_5_GOT_%', function_count; end if;
  if view_count <> 1 then raise exception 'IC10_LIFECYCLE_VIEW_EXPECTED_1_GOT_%', view_count; end if;
  if read_policy_count <> 7 then raise exception 'IC10_READ_POLICY_COUNT_EXPECTED_7_GOT_%', read_policy_count; end if;
  if write_policy_count <> 0 then raise exception 'IC10_BROWSER_WRITE_POLICIES_EXPECTED_0_GOT_%', write_policy_count; end if;

  raise notice 'AC_CAPITAL_OS_IC10_DATABASE_VERIFIED';
end
$verify$;
