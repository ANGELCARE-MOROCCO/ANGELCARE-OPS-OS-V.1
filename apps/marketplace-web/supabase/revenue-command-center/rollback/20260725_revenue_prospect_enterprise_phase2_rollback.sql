-- ANGELCARE Revenue Command Center
-- CONTROLLED ROLLBACK: Prospect / Account / Contact / Opportunity Phase 2
-- Run only after a verified backup and explicit approval.
-- This rollback removes Phase 2-only objects but intentionally preserves additive columns
-- on canonical base tables to avoid destructive loss of live business data.

begin;

drop view if exists public.revenue_prospect_enterprise_overview;
drop function if exists public.revenue_create_enterprise_prospect_dossier(jsonb, uuid, text);

drop trigger if exists revenue_opportunities_capture_stage_change on public.revenue_opportunities;
drop function if exists public.revenue_capture_opportunity_stage_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'revenue_contact_relationships',
    'revenue_decision_map_members',
    'revenue_account_risks',
    'revenue_account_plans',
    'revenue_opportunity_risks',
    'revenue_opportunity_competitors'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists %I on public.%I', table_name || '_touch_updated_at', table_name);
    end if;
  end loop;
end $$;

drop table if exists public.revenue_opportunity_competitors;
drop table if exists public.revenue_opportunity_risks;
drop table if exists public.revenue_opportunity_participants;
drop table if exists public.revenue_opportunity_stage_history;
drop table if exists public.revenue_account_plans;
drop table if exists public.revenue_account_risks;
drop table if exists public.revenue_account_status_history;
drop table if exists public.revenue_qualification_assessments;
drop table if exists public.revenue_decision_map_members;
drop table if exists public.revenue_contact_relationships;
drop table if exists public.revenue_account_aliases;

drop function if exists public.revenue_enterprise_touch_updated_at();

commit;
