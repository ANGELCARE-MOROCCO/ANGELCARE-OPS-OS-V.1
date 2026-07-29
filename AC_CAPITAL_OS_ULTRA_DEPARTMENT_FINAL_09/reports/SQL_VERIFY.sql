do $verify$
declare
  required_table text;
  missing_tables text[] := '{}';
  registry_count integer;
  schedule_count integer;
  runtime_agent_count integer;
  openrouter_agent_count integer;
  gate_count integer;
  trigger_count integer;
begin
  foreach required_table in array array[
    'ac_capital_record_versions',
    'ac_capital_record_notes',
    'ac_capital_record_assignments',
    'ac_capital_saved_views',
    'ac_capital_runtime_leases',
    'ac_capital_dead_letters',
    'ac_capital_notifications',
    'ac_capital_agent_outputs',
    'ac_capital_agent_schedules',
    'ac_capital_stage_gates',
    'ac_capital_stage_gate_evaluations',
    'ac_capital_artifacts',
    'ac_capital_artifact_versions',
    'ac_capital_submission_proofs',
    'ac_capital_command_results'
  ] loop
    if to_regclass('public.' || required_table) is null then
      missing_tables := array_append(missing_tables, required_table);
    end if;
  end loop;

  if cardinality(missing_tables) > 0 then
    raise exception 'FINAL_09_MISSING_TABLES:%', array_to_string(missing_tables, ',');
  end if;

  select count(*) into registry_count
  from public.ac_capital_agent_registry
  where agent_key in (
    'capital-executive-orchestrator','funder-intelligence-agent','qualification-underwriter',
    'funding-case-architect','data-room-proof-agent','pipeline-intelligence-agent',
    'coordinator-mission-planner','executive-report-agent','capital-learning-agent'
  );
  if registry_count <> 9 then raise exception 'FINAL_09_AGENT_REGISTRY_EXPECTED_9_GOT_%', registry_count; end if;

  select count(*) into schedule_count
  from public.ac_capital_agent_schedules
  where agent_key in (
    'capital-executive-orchestrator','funder-intelligence-agent','qualification-underwriter',
    'funding-case-architect','data-room-proof-agent','pipeline-intelligence-agent',
    'coordinator-mission-planner','executive-report-agent','capital-learning-agent'
  );
  if schedule_count <> 9 then raise exception 'FINAL_09_AGENT_SCHEDULES_EXPECTED_9_GOT_%', schedule_count; end if;

  select count(*) into runtime_agent_count
  from public.ac_capital_ai_agents
  where agent_key in (
    'funder-intelligence-agent','qualification-underwriter','funding-case-architect',
    'data-room-proof-agent','pipeline-intelligence-agent','coordinator-mission-planner',
    'executive-report-agent','capital-learning-agent'
  );
  if runtime_agent_count <> 8 then raise exception 'FINAL_09_RUNTIME_AGENTS_EXPECTED_8_GOT_%', runtime_agent_count; end if;

  select count(*) into openrouter_agent_count
  from public.ac_capital_ai_agents
  where agent_key in (
    'funder-intelligence-agent','qualification-underwriter','funding-case-architect',
    'data-room-proof-agent','pipeline-intelligence-agent','coordinator-mission-planner',
    'executive-report-agent','capital-learning-agent'
  ) and analysis_provider_key = 'openrouter';
  if openrouter_agent_count <> 8 then raise exception 'FINAL_09_OPENROUTER_ASSIGNMENTS_EXPECTED_8_GOT_%', openrouter_agent_count; end if;

  select count(*) into gate_count from public.ac_capital_stage_gates where active = true;
  if gate_count < 6 then raise exception 'FINAL_09_STAGE_GATES_TOO_FEW:%', gate_count; end if;

  select count(*) into trigger_count
  from pg_trigger
  where not tgisinternal
    and tgname in ('ac_capital_touch_version','ac_capital_capture_version','ac_capital_lifecycle_event');
  if trigger_count < 15 then raise exception 'FINAL_09_LIFECYCLE_TRIGGERS_TOO_FEW:%', trigger_count; end if;
end
$verify$;

select
  (select count(*) from public.ac_capital_agent_registry where enabled = true) as enabled_registry_agents,
  (select count(*) from public.ac_capital_agent_schedules) as durable_schedules,
  (select count(*) from public.ac_capital_stage_gates where active = true) as enabled_stage_gates,
  (select count(*) from public.ac_capital_artifacts) as artifacts,
  (select count(*) from public.ac_capital_dead_letters where status = 'open') as open_dead_letters,
  (select count(*) from public.ac_capital_notifications where status = 'unread') as unread_notifications;

select 'AC_CAPITAL_OS_ULTRA_DEPARTMENT_FINAL_09_DATABASE_VERIFIED' as gate;
