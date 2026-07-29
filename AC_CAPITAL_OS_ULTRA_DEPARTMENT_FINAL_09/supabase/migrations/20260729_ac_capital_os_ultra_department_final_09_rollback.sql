begin;
-- Safe rollback removes only Final 09 triggers/functions/new tables. Added columns are retained
-- intentionally because destructive column removal could erase live post-install data.
do $drop_triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ac_capital_radar_sources','ac_capital_radar_opportunities','ac_capital_funders',
    'ac_capital_qualification_dossiers','ac_capital_cases','ac_capital_data_room_documents',
    'ac_capital_pipeline_records','ac_capital_universal_approvals','ac_capital_coordinator_tasks',
    'ac_capital_pipeline_outcomes','ac_capital_doctrine_items'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists ac_capital_touch_version on public.%I', table_name);
      execute format('drop trigger if exists ac_capital_capture_version on public.%I', table_name);
      execute format('drop trigger if exists ac_capital_lifecycle_event on public.%I', table_name);
    end if;
  end loop;
end
$drop_triggers$;
drop function if exists public.ac_capital_touch_and_version();
drop function if exists public.ac_capital_capture_version();
drop function if exists public.ac_capital_emit_lifecycle_event();

drop table if exists public.ac_capital_command_results;
drop table if exists public.ac_capital_submission_proofs;
drop table if exists public.ac_capital_artifact_versions;
drop table if exists public.ac_capital_artifacts;
drop table if exists public.ac_capital_stage_gate_evaluations;
drop table if exists public.ac_capital_stage_gates;
drop table if exists public.ac_capital_agent_schedules;
drop table if exists public.ac_capital_agent_outputs;
drop table if exists public.ac_capital_notifications;
drop table if exists public.ac_capital_dead_letters;
drop table if exists public.ac_capital_runtime_leases;
drop table if exists public.ac_capital_saved_views;
drop table if exists public.ac_capital_record_assignments;
drop table if exists public.ac_capital_record_notes;
drop table if exists public.ac_capital_record_versions;
notify pgrst, 'reload schema';
commit;
