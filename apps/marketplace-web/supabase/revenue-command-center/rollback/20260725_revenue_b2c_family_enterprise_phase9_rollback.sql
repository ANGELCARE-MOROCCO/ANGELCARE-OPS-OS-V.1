begin;
do $safe$
declare total_rows bigint;
begin
  if to_regclass('public.revenue_b2c_status_history') is not null then
    select
      coalesce((select count(*) from public.revenue_b2c_guardians),0)+
      coalesce((select count(*) from public.revenue_b2c_beneficiaries),0)+
      coalesce((select count(*) from public.revenue_b2c_service_requirements),0)+
      coalesce((select count(*) from public.revenue_b2c_matching_cycles),0)+
      coalesce((select count(*) from public.revenue_b2c_care_starts),0)+
      coalesce((select count(*) from public.revenue_b2c_status_history),0)
    into total_rows;
    if total_rows>0 and current_setting('angelcare.allow_phase9_destructive_rollback',true) is distinct from 'YES' then
      raise exception 'ROLLBACK BLOCKED: Phase 9 contains % operational rows. Set angelcare.allow_phase9_destructive_rollback=YES only after export and approval.',total_rows;
    end if;
  end if;
end
$safe$;

drop view if exists public.revenue_b2c_retention_command_view;
drop view if exists public.revenue_b2c_matching_command_view;
drop view if exists public.revenue_b2c_command_view;
drop function if exists public.revenue_accept_b2c_match(uuid,uuid,uuid,text,date);
drop function if exists public.revenue_authorize_b2c_activation(uuid,uuid,text,text);
drop function if exists public.revenue_evaluate_b2c_activation(uuid,uuid);
drop function if exists public.revenue_b2c_touch_updated_at();

drop table if exists public.revenue_b2c_closures;
drop table if exists public.revenue_b2c_evidence;
drop table if exists public.revenue_b2c_status_history;
drop table if exists public.revenue_b2c_recovery_checkpoints;
drop table if exists public.revenue_b2c_recovery_plans;
drop table if exists public.revenue_b2c_retention_plans;
drop table if exists public.revenue_b2c_retention_risks;
drop table if exists public.revenue_b2c_complaints;
drop table if exists public.revenue_b2c_satisfaction_checks;
drop table if exists public.revenue_b2c_care_starts;
drop table if exists public.revenue_b2c_activation_gates;
drop table if exists public.revenue_b2c_onboarding_items;
drop table if exists public.revenue_b2c_onboarding_plans;
drop table if exists public.revenue_b2c_matching_decisions;
drop table if exists public.revenue_b2c_matching_candidates;
drop table if exists public.revenue_b2c_matching_cycles;
drop table if exists public.revenue_b2c_service_recommendations;
drop table if exists public.revenue_b2c_consultations;
drop table if exists public.revenue_b2c_needs_assessments;
drop table if exists public.revenue_b2c_service_requirements;
drop table if exists public.revenue_b2c_family_instructions;
drop table if exists public.revenue_b2c_emergency_contacts;
drop table if exists public.revenue_b2c_beneficiaries;
drop table if exists public.revenue_b2c_guardians;
commit;
