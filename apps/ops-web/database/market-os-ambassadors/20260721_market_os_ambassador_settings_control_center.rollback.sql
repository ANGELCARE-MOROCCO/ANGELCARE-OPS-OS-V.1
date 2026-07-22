-- Guarded rollback for the Settings Policy & Runtime Control Center.
-- This is destructive to settings-version history. Export/backup all five tables first.
-- Existing legacy market_os_ambassador_settings data is not removed.

begin;

do $$
begin
  if exists (select 1 from public.market_os_ambassador_settings_versions where status in ('published','scheduled')) then
    raise exception 'Rollback blocked: published or scheduled settings versions exist. Export evidence and cancel/replace them explicitly first.';
  end if;
end $$;

drop function if exists public.market_os_ambassador_rollback_settings_version(uuid,uuid,text,text,jsonb);
drop function if exists public.market_os_ambassador_publish_settings_version(uuid,uuid,text,jsonb,text);
drop function if exists public.market_os_ambassador_schedule_settings_version(uuid,uuid,text,timestamptz);
drop function if exists public.market_os_ambassador_decide_settings_approval(uuid,uuid,text,text,text,text);
drop function if exists public.market_os_ambassador_submit_settings_version(uuid,uuid,text,jsonb,text[]);

drop trigger if exists trg_market_os_ambassador_mission_assignment_policy on public.market_os_ambassador_mission_assignments;
drop function if exists public.market_os_ambassador_enforce_mission_assignment_policy();
drop trigger if exists trg_market_os_ambassador_territory_policy on public.market_os_ambassador_territory_assignments;
drop function if exists public.market_os_ambassador_enforce_territory_policy();
drop function if exists public.market_os_ambassador_effective_settings_configuration(text,text,text,text);

drop trigger if exists trg_market_os_ambassador_settings_runtime_immutable on public.market_os_ambassador_settings_runtime_events;
drop function if exists public.market_os_ambassador_block_settings_runtime_mutation();
drop trigger if exists trg_market_os_ambassador_settings_approval_guard on public.market_os_ambassador_settings_approvals;
drop function if exists public.market_os_ambassador_guard_settings_approval_mutation();
drop trigger if exists trg_market_os_ambassador_settings_version_lifecycle on public.market_os_ambassador_settings_versions;
drop function if exists public.market_os_ambassador_guard_settings_version_lifecycle();

delete from public.market_os_ambassador_idempotency
where operation in (
  'settings_submit','settings_approval','settings_schedule','settings_publish','settings_rollback'
);

drop table if exists public.market_os_ambassador_settings_runtime_events;
drop table if exists public.market_os_ambassador_settings_publications;
drop table if exists public.market_os_ambassador_settings_active_scopes;
drop table if exists public.market_os_ambassador_settings_approvals;
drop table if exists public.market_os_ambassador_settings_versions;

delete from public.market_os_ambassador_role_permissions
where permission_key in (
  'settings.draft','settings.validate','settings.submit','settings.approve',
  'settings.publish','settings.rollback','settings.runtime'
);

commit;
