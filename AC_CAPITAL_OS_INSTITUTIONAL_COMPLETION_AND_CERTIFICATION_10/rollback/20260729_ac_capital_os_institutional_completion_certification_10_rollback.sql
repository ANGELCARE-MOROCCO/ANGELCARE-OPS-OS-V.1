begin;

-- IC10 rollback removes only the certification control plane and its triggers.
-- It intentionally preserves all business records and certification evidence can be exported first.

do $drop_triggers$
declare
  target text;
begin
  foreach target in array array[
    'ac_capital_cases','ac_capital_artifacts','ac_capital_qualification_dossiers',
    'ac_capital_pipeline_records','ac_capital_strategy_reports'
  ] loop
    if to_regclass('public.' || target) is not null then
      execute format('drop trigger if exists ac_capital_ic10_supersede_approvals_trg on public.%I', target);
    end if;
  end loop;
  if to_regclass('public.ac_capital_artifacts') is not null then
    drop trigger if exists ac_capital_ic10_protect_approved_artifact_trg on public.ac_capital_artifacts;
  end if;
end
$drop_triggers$;

drop view if exists public.ac_capital_ic10_lifecycle_trace;
drop function if exists public.ac_capital_ic10_decide_approval(uuid,text,text,jsonb,text);
drop function if exists public.ac_capital_ic10_request_case_approval(uuid,text,text,text,text,text,text,date);
drop function if exists public.ac_capital_ic10_record_submission(uuid,uuid,uuid,text,text,text,text,text[],text,timestamptz,uuid,boolean);
drop function if exists public.ac_capital_ic10_protect_approved_artifact();
drop function if exists public.ac_capital_ic10_supersede_approvals();

drop table if exists public.ac_capital_certification_signoffs;
drop table if exists public.ac_capital_certification_evidence;
drop table if exists public.ac_capital_certification_checks;
drop table if exists public.ac_capital_scenario_steps;
drop table if exists public.ac_capital_scenario_certifications;
drop table if exists public.ac_capital_workspace_certifications;
drop table if exists public.ac_capital_certification_runs;

notify pgrst, 'reload schema';
commit;
