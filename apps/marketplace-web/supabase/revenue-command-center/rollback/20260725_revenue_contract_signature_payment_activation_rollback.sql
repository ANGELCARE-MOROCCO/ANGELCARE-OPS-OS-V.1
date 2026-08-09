-- Controlled rollback for Mega ZIP 7. Review dependencies and backup before execution.
begin;
drop view if exists public.revenue_realization_command_view;
drop view if exists public.revenue_activation_command_view;
drop view if exists public.revenue_contract_command_view;
drop function if exists public.revenue_reverse_revenue_realization(uuid,uuid,jsonb,uuid);
drop function if exists public.revenue_confirm_revenue_realization(uuid,jsonb,uuid);
drop function if exists public.revenue_authorize_contract_activation(uuid,jsonb,uuid);
drop function if exists public.revenue_evaluate_activation_gates(uuid,jsonb,uuid);
drop function if exists public.revenue_evaluate_contract_effectiveness(uuid,jsonb,uuid);
drop function if exists public.revenue_create_contract_from_handoff(uuid,jsonb,uuid);
drop function if exists public.revenue_create_contract_version(uuid,text,text,text,uuid);
drop trigger if exists revenue_mz7_contract_status_history on public.revenue_contracts;
drop function if exists public.revenue_mz7_contract_status_history();

do $$ declare t text; begin
  foreach t in array array[
    'revenue_contracts','revenue_contract_sections','revenue_contract_reviews','revenue_contract_approvals','revenue_contract_signatories',
    'revenue_contract_conditions','revenue_contract_obligations','revenue_contract_milestones','revenue_payment_schedules','revenue_payment_requirements',
    'revenue_payment_promises','revenue_collection_actions','revenue_finance_handoffs','revenue_activation_gates','revenue_operational_handoffs','revenue_contract_risks'
  ] loop
    if to_regclass('public.'||t) is not null then execute format('drop trigger if exists %I on public.%I','mz7_touch_'||t,t); end if;
  end loop;
end $$;
drop function if exists public.revenue_mz7_touch_updated_at();

drop table if exists public.revenue_contract_closures cascade;
drop table if exists public.revenue_contract_status_history cascade;
drop table if exists public.revenue_contract_risks cascade;
drop table if exists public.revenue_realization_events cascade;
drop table if exists public.revenue_operational_handoffs cascade;
drop table if exists public.revenue_activation_decisions cascade;
drop table if exists public.revenue_activation_gates cascade;
drop table if exists public.revenue_payment_confirmations cascade;
drop table if exists public.revenue_finance_handoffs cascade;
drop table if exists public.revenue_collection_actions cascade;
drop table if exists public.revenue_payment_promise_events cascade;
drop table if exists public.revenue_payment_promises cascade;
drop table if exists public.revenue_payment_requirements cascade;
drop table if exists public.revenue_payment_schedules cascade;
drop table if exists public.revenue_payment_terms cascade;
drop table if exists public.revenue_contract_milestones cascade;
drop table if exists public.revenue_obligation_events cascade;
drop table if exists public.revenue_contract_obligations cascade;
drop table if exists public.revenue_condition_evidence cascade;
drop table if exists public.revenue_contract_conditions cascade;
drop table if exists public.revenue_signature_evidence cascade;
drop table if exists public.revenue_signature_events cascade;
drop table if exists public.revenue_contract_signatories cascade;
drop table if exists public.revenue_contract_approvals cascade;
drop table if exists public.revenue_contract_reviews cascade;
drop table if exists public.revenue_contract_sections cascade;
alter table if exists public.revenue_contracts drop constraint if exists revenue_contracts_active_version_id_fkey;
drop table if exists public.revenue_contract_versions cascade;
drop table if exists public.revenue_contracts cascade;
drop sequence if exists public.revenue_contract_reference_seq;
commit;
